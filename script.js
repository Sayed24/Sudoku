/* Modern Sudoku - full features
   - Very Easy / Easy / Medium / Hard difficulties
   - Fixed-size board, center-aligned numbers
   - Undo / Redo with move history and mini-dot timeline
   - Hint, Reset, Check, Timer
   - Confetti + glow on success, shake on failure
   - Floating 3D undo/redo buttons (Style C)
   - Light/Dark toggle always visible
   - Loading overlay hides reliably
*/

/* ---------- Base solved grid (valid) ---------- */
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

/* ---------- DOM ---------- */
const loadingOverlay = document.getElementById('loadingOverlay');
const welcomeScreen = document.getElementById('welcomeScreen');
const playerNameInput = document.getElementById('playerName');
const difficultySelect = document.getElementById('difficulty');
const startBtn = document.getElementById('startBtn');
const themeToggleStart = document.getElementById('themeToggleStart');
const themeToggleFixed = document.getElementById('themeToggleFixed');

const greeting = document.getElementById('greeting');
const timerEl = document.getElementById('timer');

const sudokuBoard = document.getElementById('sudokuBoard');
const gameContainer = document.getElementById('gameContainer');

const hintBtn = document.getElementById('hintBtn');
const checkBtn = document.getElementById('checkBtn');
const resetBtn = document.getElementById('resetBtn');

const undoBtn = document.getElementById('undoBtn');
const redoBtn = document.getElementById('redoBtn');
const historyBar = document.getElementById('historyBar');

const resultScreen = document.getElementById('resultScreen');
const resultTitle = document.getElementById('resultTitle');
const resultTime = document.getElementById('resultTime');
const playAgainBtn = document.getElementById('playAgainBtn');
const closeResultBtn = document.getElementById('closeResultBtn');

const soundInput = document.getElementById('soundInput');
const soundWrong = document.getElementById('soundWrong');
const soundWin = document.getElementById('soundWin');

/* ---------- State ---------- */
let solution = [];
let puzzle = [];
let playerName = '';
let timerInterval = null;
let elapsed = 0;

/* Moves stacks for undo/redo + history array */
let undoStack = [];
let redoStack = [];
let history = []; // each move has {r,c,from,to,type,moveIdx}

/* ---------- Helpers ---------- */
const deepCopy = g => g.map(r => r.slice());
function removeCountForDiff(d){
  if(d==='veryeasy') return 30; // very easy: keep many numbers
  if(d==='easy') return 36;
  if(d==='medium') return 46;
  return 54; // hard
}
function makePuzzleFromSolution(sol,removeCount){
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

/* ---------- Loading overlay: hide reliably ---------- */
window.addEventListener('load', () => {
  setTimeout(()=> {
    if(loadingOverlay) loadingOverlay.style.display = 'none';
    // show welcome if not started
    if(welcomeScreen) welcomeScreen.style.display = 'flex';
  }, 250);
});

/* ---------- Timer ---------- */
function startTimer(){
  clearInterval(timerInterval);
  elapsed = 0;
  timerEl.textContent = 'Time: 00:00';
  timerInterval = setInterval(()=>{
    elapsed++;
    const mm = String(Math.floor(elapsed/60)).padStart(2,'0');
    const ss = String(elapsed%60).padStart(2,'0');
    timerEl.textContent = `Time: ${mm}:${ss}`;
  },1000);
}
function stopTimer(){ if(timerInterval){ clearInterval(timerInterval); timerInterval = null; } }

/* ---------- Render board (fixed layout) ---------- */
function renderBoard(){
  sudokuBoard.innerHTML = '';
  for(let r=0;r<9;r++){
    const tr = document.createElement('tr');
    for(let c=0;c<9;c++){
      const td = document.createElement('td');

      // thicker block borders
      if(r%3===0) td.style.borderTopWidth = '2px';
      if(c%3===0) td.style.borderLeftWidth = '2px';
      if(r===8) td.style.borderBottomWidth = '2px';
      if(c===8) td.style.borderRightWidth = '2px';

      const val = puzzle[r][c];
      if(val === ""){
        const inp = document.createElement('input');
        inp.type = 'text';
        inp.maxLength = 1;
        inp.inputMode = 'numeric';
        inp.autocomplete = 'off';

        // local index to help commit
        inp.addEventListener('input', (e) => {
          // allow digits 1-9 only
          let v = e.target.value.replace(/[^\d]/g,'').slice(0,1);
          if(v === '0') v = '';
          e.target.value = v;
          // play small input sound (optional)
          if(soundInput && e.target.value) soundInput.currentTime = 0, soundInput.play();
        });

        // commit on blur
        inp.addEventListener('blur', (e) => {
          commitInput(r,c,e.target.value.trim());
        });

        // handle Enter and arrows
        inp.addEventListener('keydown', (e) => {
          if(e.key === 'Enter'){ e.preventDefault(); inp.blur(); }
          if(e.key.startsWith('Arrow')){ e.preventDefault(); moveFocusByKey(r,c,e.key); }
          if((e.ctrlKey || e.metaKey) && e.key.toLowerCase()==='z'){ e.preventDefault(); undoMove(); }
          if((e.ctrlKey || e.metaKey) && e.key.toLowerCase()==='y'){ e.preventDefault(); redoMove(); }
        });

        td.appendChild(inp);
      } else {
        td.textContent = val;
        td.classList.add('prefilled');
      }
      tr.appendChild(td);
    }
    sudokuBoard.appendChild(tr);
  }
  // update history bar visuals
  renderHistoryBar();
}

/* ---------- Commit input and record move ---------- */
function commitInput(r,c,value){
  const prev = puzzle[r][c] === "" ? "" : String(puzzle[r][c]);
  const newVal = value === "" ? "" : String(value);

  // if no change -> do nothing
  if(prev === newVal) return;

  // update puzzle so checks work easily
  puzzle[r][c] = newVal === "" ? "" : Number(newVal);

  // record move
  const move = { r, c, from: prev, to: newVal, type: 'input' };
  undoStack.push(move);
  redoStack = [];
  history.push(move);
  renderHistoryBar();
}

/* ---------- Move focus with arrows ---------- */
function moveFocusByKey(r,c,key){
  let nr=r, nc=c;
  if(key === 'ArrowUp') nr = Math.max(0,r-1);
  if(key === 'ArrowDown') nr = Math.min(8,r+1);
  if(key === 'ArrowLeft') nc = Math.max(0,c-1);
  if(key === 'ArrowRight') nc = Math.min(8,c+1);
  const next = sudokuBoard.rows[nr].cells[nc];
  if(next){
    const input = next.querySelector('input');
    if(input){ input.focus(); input.select(); }
  }
}

/* ---------- Undo / Redo moves ---------- */
function updateUndoRedoButtons(){
  undoBtn.disabled = undoStack.length === 0;
  redoBtn.disabled = redoStack.length === 0;
  renderHistoryBar();
}

function undoMove(){
  if(undoStack.length === 0) return;
  const move = undoStack.pop();
  // revert puzzle
  puzzle[move.r][move.c] = move.from === "" ? "" : (isNaN(move.from) ? move.from : Number(move.from));
  // reflect in DOM
  const cell = sudokuBoard.rows[move.r].cells[move.c];
  const input = cell.querySelector('input');
  if(input) input.value = move.from;
  else cell.textContent = move.from;

  redoStack.push(move);
  renderHistoryBar();
  updateUndoRedoButtons();
}

function redoMove(){
  if(redoStack.length === 0) return;
  const move = redoStack.pop();
  puzzle[move.r][move.c] = move.to === "" ? "" : (isNaN(move.to) ? move.to : Number(move.to));
  const cell = sudokuBoard.rows[move.r].cells[move.c];
  const input = cell.querySelector('input');
  if(input) input.value = move.to;
  else cell.textContent = move.to;

  undoStack.push(move);
  renderHistoryBar();
  updateUndoRedoButtons();
}

/* ---------- Render small history bar dots ---------- */
function renderHistoryBar(){
  historyBar.innerHTML = '';
  const maxDots = Math.min(history.length, 12); // show up to 12 recent moves
  const start = Math.max(0, history.length - maxDots);
  for(let i = start; i < history.length; i++){
    const dot = document.createElement('div');
    dot.className = 'history-dot';
    if(i === history.length - 1) dot.classList.add('active'); // latest highlighted
    // hover show tooltip
    const mv = history[i];
    dot.title = `#${i+1}: ${mv.type === 'hint' ? 'Hint' : 'Input'} r${mv.r+1}c${mv.c+1} → ${mv.to}`;
    dot.addEventListener('click', () => {
      // jump to that move: undo until length = i+1
      while(history.length > i+1 && undoStack.length > 0){
        undoMove();
        history.pop();
      }
      // or redo if needed - but keep behavior simple
      renderHistoryBar();
    });
    historyBar.appendChild(dot);
  }
}

/* ---------- Hint (fills a random empty cell) ---------- */
function giveHint(){
  const empties = [];
  for(let r=0;r<9;r++){
    for(let c=0;c<9;c++){
      if(puzzle[r][c] === "") empties.push({r,c});
    }
  }
  if(empties.length === 0){ alert('No empty cells for hint.'); return; }
  const pick = empties[Math.floor(Math.random()*empties.length)];
  const val = solution[pick.r][pick.c];
  // record move and set
  puzzle[pick.r][pick.c] = val;
  const move = { r: pick.r, c: pick.c, from: '', to: String(val), type: 'hint' };
  undoStack.push(move);
  redoStack = [];
  history.push(move);
  renderBoard();
  updateUndoRedoButtons();
}

/* ---------- Sync DOM inputs into puzzle (used before checking) ---------- */
function syncInputsToPuzzle(){
  const inputs = sudokuBoard.querySelectorAll('input');
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

/* ---------- Check full board correctness ---------- */
function checkFullBoard(){
  syncInputsToPuzzle();
  // check every cell
  for(let r=0;r<9;r++){
    for(let c=0;c<9;c++){
      const v = puzzle[r][c];
      if(v === "" || Number(v) !== solution[r][c]){
        // fail
        // shake board and show failure message with name
        gameContainer.classList.add('shake');
        setTimeout(()=> gameContainer.classList.remove('shake'), 600);
        if(soundWrong) { soundWrong.currentTime = 0; soundWrong.play(); }
        showResult(false);
        return;
      }
    }
  }
  // success
  if(soundWin){ soundWin.currentTime = 0; soundWin.play(); }
  // confetti and glow
  confetti({ particleCount: 140, spread: 80, origin:{ y:0.6 } });
  gameContainer.classList.add('correct-glow');
  setTimeout(()=> gameContainer.classList.remove('correct-glow'), 1200);
  showResult(true);
}

/* ---------- Reset puzzle (same difficulty) ---------- */
function resetPuzzle(){
  if(!solution.length) return;
  const diff = difficultySelect.value || 'medium';
  puzzle = makePuzzleFromSolution(solution, removeCountForDiff(diff));
  undoStack = []; redoStack = []; history = [];
  updateUndoRedoButtons();
  renderBoard();
  elapsed = 0; timerEl.textContent = 'Time: 00:00';
}

/* ---------- Show result dialog ---------- */
function showResult(success){
  stopTimer();
  if(success){
    resultTitle.textContent = `🎉 Congrats, ${playerName}! You solved the puzzle!`;
  } else {
    resultTitle.textContent = `❌ ${playerName}, you failed the game. Try again!`;
  }
  const mm = String(Math.floor(elapsed/60)).padStart(2,'0');
  const ss = String(elapsed%60).padStart(2,'0');
  resultTime.textContent = `Time: ${mm}:${ss}`;
  resultScreen.classList.remove('hidden');
}

/* ---------- Play again / close ---------- */
function playAgain(){
  resultScreen.classList.add('hidden');
  welcomeScreen.classList.remove('hidden');
  sudokuBoard.innerHTML = '';
  greeting.textContent = '';
  playerNameInput.value = '';
  stopTimer();
  elapsed = 0;
  timerEl.textContent = 'Time: 00:00';
  solution = []; puzzle = []; undoStack = []; redoStack = []; history = [];
  updateUndoRedoButtons();
}
function closeResult(){ resultScreen.classList.add('hidden'); }

/* ---------- Start game ---------- */
function startGame(){
  const name = playerNameInput.value.trim();
  if(!name){ alert('Please enter your name'); playerNameInput.focus(); return; }
  playerName = name;
  greeting.textContent = `Player: ${playerName}`;

  // build puzzle from base solution with removals
  solution = deepCopy(BASE_SOLUTION);
  const diff = difficultySelect.value || 'medium';
  puzzle = makePuzzleFromSolution(solution, removeCountForDiff(diff));

  welcomeScreen.classList.add('hidden');
  resultScreen.classList.add('hidden');

  undoStack = []; redoStack = []; history = [];
  updateUndoRedoButtons();

  renderBoard();
  startTimer();
}

/* ---------- Theme toggle ---------- */
function toggleTheme(){
  document.body.classList.toggle('light');
}

/* ---------- Event bindings ---------- */
startBtn.addEventListener('click', startGame);
themeToggleStart.addEventListener('click', toggleTheme);
themeToggleFixed.addEventListener('click', toggleTheme);

hintBtn.addEventListener('click', giveHint);
checkBtn.addEventListener('click', checkFullBoard);
resetBtn.addEventListener('click', resetPuzzle);

undoBtn.addEventListener('click', undoMove);
redoBtn.addEventListener('click', redoMove);

playAgainBtn.addEventListener('click', playAgain);
closeResultBtn.addEventListener('click', closeResult);

// keyboard shortcuts
document.addEventListener('keydown', (e) => {
  if((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z'){ e.preventDefault(); undoMove(); }
  if((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y'){ e.preventDefault(); redoMove(); }
});

/* ---------- Init ---------- */
(function init(){
  welcomeScreen.classList.remove('hidden');
  resultScreen.classList.add('hidden');
  if(loadingOverlay) loadingOverlay.style.display = 'flex';
})();
