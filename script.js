/* Modern Sudoku complete script
   - fixed layout, centered numbers
   - timer, difficulty
   - hint, undo/redo, reset, check
   - correct glow + confetti on win
   - shake animation & message on fail
   - loading overlay hides reliably
   - dark/light toggle (always visible)
*/

/* ---------- Base completed solution ---------- */
const BASE_SOLUTION = [
  [5,3,4,6,7,8,9,1,2],
  [6,7,2,1,9,5,3,4,8],
  [1,9,8,3,4,2,5,6,7],
  [8,5,9,7,6,1,4,2,3],
  [4,2,6,8,5,3,7,9,1],
  [7,1,3,9,2,4,8,5,6],
  [9,6,1,5,3,7,2,8,4],
  [2,8,7,4,1,9,6,3,5],
  [3,4,5,2,8,6,1,7,9]
];

/* ---------- DOM elements ---------- */
const loadingOverlay = document.getElementById('loadingOverlay');
const welcomeScreen = document.getElementById('welcome-screen');
const playerNameInput = document.getElementById('playerName');
const difficultySelect = document.getElementById('difficulty');
const startBtn = document.getElementById('startBtn');
const toggleThemeBtn = document.getElementById('toggleThemeBtn');
const themeToggleFixed = document.getElementById('themeToggleFixed');

const greeting = document.getElementById('greeting');
const timerEl = document.getElementById('timer');
const boardTable = document.getElementById('sudoku-board');

const undoBtn = document.getElementById('undoBtn');
const redoBtn = document.getElementById('redoBtn');
const hintBtn = document.getElementById('hintBtn');
const checkBtn = document.getElementById('checkBtn');
const resetBtn = document.getElementById('resetBtn');

const resultScreen = document.getElementById('result-screen');
const resultMessage = document.getElementById('result-message');
const resultTime = document.getElementById('result-time');
const playAgainBtn = document.getElementById('playAgainBtn');
const closeResultBtn = document.getElementById('closeResultBtn');

const soundInput = document.getElementById('sound-input');
const soundWrong = document.getElementById('sound-wrong');
const soundWin = document.getElementById('sound-win');

/* ---------- State ---------- */
let solution = [];
let puzzle = [];
let playerName = '';
let timerInterval = null;
let elapsed = 0;

/* For undo/redo: stacks of moves
   move = { r, c, from, to, type }  // type: 'input'|'hint'
*/
let undoStack = [];
let redoStack = [];

/* ---------- Helpers ---------- */
function deepCopy(grid){ return grid.map(r => r.slice()); }
function removeCellsFrom(sol, removeCount){
  const p = deepCopy(sol);
  let removed = 0;
  while(removed < removeCount){
    const r = Math.floor(Math.random()*9);
    const c = Math.floor(Math.random()*9);
    if(p[r][c] !== ""){
      p[r][c] = "";
      removed++;
    }
  }
  return p;
}
function removeCountForDifficulty(d){
  if(d==='easy') return 36;
  if(d==='medium') return 46;
  return 54;
}

/* ---------- Loading overlay hide reliably ---------- */
window.addEventListener('load', () => {
  // Ensure loading overlay is removed after small delay
  setTimeout(()=> {
    if(loadingOverlay) loadingOverlay.style.display='none';
    // ensure welcome screen visible (if not started)
    if(welcomeScreen) welcomeScreen.style.display='flex';
  }, 300);
});

/* ---------- Timer ---------- */
function startTimer(){
  stopTimer();
  elapsed = 0;
  timerEl.textContent = 'Time: 00:00';
  timerInterval = setInterval(()=>{
    elapsed++;
    const mm = String(Math.floor(elapsed/60)).padStart(2,'0');
    const ss = String(elapsed%60).padStart(2,'0');
    timerEl.textContent = `Time: ${mm}:${ss}`;
  },1000);
}
function stopTimer(){ if(timerInterval){ clearInterval(timerInterval); timerInterval=null; } }

/* ---------- Render fixed-size board ---------- */
function renderBoard(){
  boardTable.innerHTML = '';
  for(let r=0;r<9;r++){
    const tr = document.createElement('tr');
    for(let c=0;c<9;c++){
      const td = document.createElement('td');

      // block borders (thicker)
      if(r%3===0) td.style.borderTopWidth='2px';
      if(c%3===0) td.style.borderLeftWidth='2px';
      if(r===8) td.style.borderBottomWidth='2px';
      if(c===8) td.style.borderRightWidth='2px';

      const val = puzzle[r][c];
      if(val === ""){
        const inp = document.createElement('input');
        inp.type = 'text';
        inp.maxLength = 1;
        inp.inputMode = 'numeric';
        inp.autocomplete = 'off';

        // value enforcement and move recording
        inp.addEventListener('input', (e) => {
          let v = e.target.value.replace(/[^\d]/g,'').slice(0,1);
          if(v === '0') v = '';
          e.target.value = v;

          // record move (from previous cell value to new)
          // Find current puzzle state for this cell (we use index mapping)
        });

        // handle blur to commit move: easier to track moves on blur/enter
        inp.addEventListener('blur', (e) => {
          commitInputValue(r,c,e.target.value);
        });

        // also handle Enter to commit and move focus
        inp.addEventListener('keydown', (e) => {
          if(e.key === 'Enter'){
            e.preventDefault();
            inp.blur();
          }
          // allow arrow navigation
          const arrowKeys = ['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'];
          if(arrowKeys.includes(e.key)){
            e.preventDefault();
            navigateFrom(r,c,e.key);
          }
          // Ctrl+Z / Ctrl+Y for undo/redo
          if((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z'){ undoMove(); }
          if((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y'){ redoMove(); }
        });

        td.appendChild(inp);
      } else {
        td.textContent = val;
        td.classList.add('prefilled');
      }

      tr.appendChild(td);
    }
    boardTable.appendChild(tr);
  }
}

/* ---------- Commit input value to puzzle and push undo move ---------- */
function commitInputValue(r,c,newVal){
  // find inputs NodeList index mapping to grid position
  // But simpler: read the value from DOM for that cell and compare to puzzle
  const cell = boardTable.rows[r].cells[c];
  const input = cell.querySelector('input');
  const from = puzzle[r][c] === "" ? "" : puzzle[r][c];
  const to = input ? input.value.trim() : (puzzle[r][c] || '');

  // If user cleared value -> to == ''
  // Only record if changed relative to the underlying puzzle (pre-filled are not inputs)
  // Underlying puzzle may be "" if empty cell
  const prevDisplayed = from === "" ? "" : String(from);

  if(to === prevDisplayed) {
    // nothing changed (or re-typed same)
    return;
  }

  // Update puzzle data -> For user typed numbers we keep puzzle as "" (we only store prefilled in puzzle),
  // but to simplify undo/redo, we'll maintain a separate "userEntries" structure or write entered number into puzzle for checking convenience.
  // We'll store user entries into puzzle (but mark prefilled with separate array).
  puzzle[r][c] = to === "" ? "" : Number(to);

  // push move
  undoStack.push({r,c,from: prevDisplayed, to: to === "" ? "" : String(to), type:'input'});
  // clear redo
  redoStack = [];
  updateUndoRedoButtons();
}

/* ---------- Navigate with arrows ---------- */
function navigateFrom(r,c,key){
  let nr=r, nc=c;
  if(key === 'ArrowUp') nr = Math.max(0,r-1);
  if(key === 'ArrowDown') nr = Math.min(8,r+1);
  if(key === 'ArrowLeft') nc = Math.max(0,c-1);
  if(key === 'ArrowRight') nc = Math.min(8,c+1);
  const nextCell = boardTable.rows[nr].cells[nc];
  if(nextCell){
    const input = nextCell.querySelector('input');
    if(input){ input.focus(); input.select(); }
  }
}

/* ---------- Undo / Redo logic ---------- */
function updateUndoRedoButtons(){
  undoBtn.disabled = undoStack.length === 0;
  redoBtn.disabled = redoStack.length === 0;
}

function undoMove(){
  if(undoStack.length === 0) return;
  const move = undoStack.pop();
  // revert puzzle
  puzzle[move.r][move.c] = move.from === "" ? "" : (isNaN(move.from) ? move.from : Number(move.from));
  // update DOM cell
  const cell = boardTable.rows[move.r].cells[move.c];
  const input = cell.querySelector('input');
  if(input){
    input.value = move.from;
  } else {
    // was prefilled? shouldn't be in undo stack, but handle defensively
    cell.textContent = move.from;
  }
  // push to redo
  redoStack.push(move);
  updateUndoRedoButtons();
}

function redoMove(){
  if(redoStack.length === 0) return;
  const move = redoStack.pop();
  puzzle[move.r][move.c] = move.to === "" ? "" : (isNaN(move.to) ? move.to : Number(move.to));
  const cell = boardTable.rows[move.r].cells[move.c];
  const input = cell.querySelector('input');
  if(input){
    input.value = move.to;
  } else {
    cell.textContent = move.to;
  }
  undoStack.push(move);
  updateUndoRedoButtons();
}

/* ---------- Hint function (fills one empty cell and records move) ---------- */
function giveHint(){
  // find empty cell positions
  const empties = [];
  for(let r=0;r<9;r++){
    for(let c=0;c<9;c++){
      if(puzzle[r][c] === "") empties.push({r,c});
    }
  }
  if(empties.length === 0){
    alert('No empty cells to hint.');
    return;
  }
  const pick = empties[Math.floor(Math.random()*empties.length)];
  const r = pick.r; const c = pick.c;
  const from = '';
  const to = solution[r][c];

  // commit
  puzzle[r][c] = to;
  undoStack.push({r,c,from:'',to:String(to),type:'hint'});
  redoStack = [];
  updateUndoRedoButtons();

  // re-render to show as prefilled (hint becomes prefilled)
  renderBoard();
}

/* ---------- Check full board correctness (user requested) ---------- */
function checkFullBoard(){
  // collect all values: prefilled are in puzzle for prefilled cells; user inputs have been committed into puzzle on blur
  // We ensure puzzle contains both prefilled and user entries
  for(let r=0;r<9;r++){
    for(let c=0;c<9;c++){
      const val = puzzle[r][c];
      if(val === "" || Number(val) !== solution[r][c]){
        // wrong or empty
        // flash shake animation on board container
        boardTable.classList.add('shake');
        setTimeout(()=> boardTable.classList.remove('shake'), 600);
        // play wrong sound
        if(soundWrong) soundWrong.play();
        // show result screen with fail message
        showResult(false);
        return;
      }
    }
  }
  // If reached, success:
  if(soundWin) soundWin.play();
  showResult(true, true);
}

/* ---------- Reset puzzle (same difficulty) ---------- */
function resetPuzzle(){
  if(!solution.length) return;
  const diff = difficultySelect.value || 'medium';
  puzzle = removeCellsFrom(solution, removeCountForDifficulty(diff));
  undoStack = [];
  redoStack = [];
  updateUndoRedoButtons();
  renderBoard();
  elapsed = 0;
  timerEl.textContent = 'Time: 00:00';
}

/* ---------- Show result modal ---------- */
function showResult(success, completed=false){
  stopTimer();
  if(success){
    resultMessage.textContent = `🎉 Congratulations ${playerName}! You completed the puzzle!`;
    // confetti
    confetti({
      particleCount: 160,
      spread: 70,
      origin: { y: 0.6 }
    });
    // add glow to board quickly
    boardTable.classList.add('correct-glow');
    setTimeout(()=> boardTable.classList.remove('correct-glow'), 1200);
  } else {
    resultMessage.textContent = `❌ ${playerName}, you failed the game. Try again!`;
  }
  const mm = String(Math.floor(elapsed/60)).padStart(2,'0');
  const ss = String(elapsed%60).padStart(2,'0');
  resultTime.textContent = `Time: ${mm}:${ss}`;
  resultScreen.classList.remove('hidden');
}

/* ---------- Play again (restart to welcome) ---------- */
function playAgain(){
  resultScreen.classList.add('hidden');
  welcomeScreen.classList.remove('hidden');
  boardTable.innerHTML = '';
  greeting.textContent = '';
  playerNameInput.value = '';
  stopTimer();
  elapsed = 0;
  timerEl.textContent = 'Time: 00:00';
  solution = [];
  puzzle = [];
  undoStack = [];
  redoStack = [];
  updateUndoRedoButtons();
}

/* ---------- Theme toggle ---------- */
function toggleTheme(){
  document.body.classList.toggle('light');
}
toggleThemeBtn && toggleThemeBtn.addEventListener('click', toggleTheme);
themeToggleFixed && themeToggleFixed.addEventListener('click', toggleTheme);

/* ---------- Start game flow ---------- */
function startGame(){
  const name = playerNameInput.value.trim();
  if(!name){ alert('Please enter your name'); playerNameInput.focus(); return; }
  playerName = name;
  greeting.textContent = `Player: ${playerName}`;

  // build puzzle from base solution with removals
  solution = deepCopy(BASE_SOLUTION);
  const diff = difficultySelect.value || 'medium';
  puzzle = removeCellsFrom(solution, removeCountForDifficulty(diff));

  // ensure welcome hidden and result hidden
  welcomeScreen.classList.add('hidden');
  resultScreen.classList.add('hidden');

  // reset stacks
  undoStack = [];
  redoStack = [];
  updateUndoRedoButtons();

  // render and start timer
  renderBoard();
  startTimer();
}

/* ---------- Commit any remaining inputs when user clicks Check or Reset ---------- */
/* To ensure puzzle reflects DOM inputs (if user didn't blur), we collect current input values into puzzle before check or reset */
function syncInputsToPuzzle(){
  // iterate rows and inputs
  const inputs = boardTable.querySelectorAll('input');
  let idx = 0;
  for(let r=0;r<9;r++){
    for(let c=0;c<9;c++){
      if(puzzle[r][c] === ""){
        const val = inputs[idx] ? inputs[idx].value.trim() : '';
        puzzle[r][c] = val === '' ? "" : Number(val);
        idx++;
      }
    }
  }
}

/* ---------- Event bindings ---------- */
startBtn.addEventListener('click', startGame);
undoBtn.addEventListener('click', undoMove);
redoBtn.addEventListener('click', redoMove);
hintBtn.addEventListener('click', () => { giveHint(); updateUndoRedoButtons(); } );
checkBtn.addEventListener('click', () => { syncInputsToPuzzle(); checkFullBoard(); } );
resetBtn.addEventListener('click', resetPuzzle);
playAgainBtn.addEventListener('click', playAgain);
closeResultBtn.addEventListener('click', () => resultScreen.classList.add('hidden'));

/* Keyboard shortcuts for undo/redo globally */
document.addEventListener('keydown', (e) => {
  if((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z'){ e.preventDefault(); undoMove(); }
  if((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y'){ e.preventDefault(); redoMove(); }
});

/* ---------- Init ---------- */
(function init(){
  // show loading overlay until window load; handled by window 'load' listener
  welcomeScreen.classList.remove('hidden');
  resultScreen.classList.add('hidden');
  updateUndoRedoButtons();
})();
