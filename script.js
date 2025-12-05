/* Modern Sudoku (Option A - Glass UI)
   - fixed-size board (no resizing while typing)
   - centered numbers
   - difficulty, timer, hint, check, reset, play again
   - dark/light toggle
   - simple random cell removal from a base solution
*/

/* ---------- Base solution (valid completed grid) ---------- */
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

/* ---------- Elements ---------- */
const welcomeScreen = document.getElementById('welcome-screen');
const startBtn = document.getElementById('startBtn');
const toggleThemeBtn = document.getElementById('toggleThemeBtn');
const playerNameInput = document.getElementById('playerName');
const difficultySelect = document.getElementById('difficulty');

const greeting = document.getElementById('greeting');
const timerEl = document.getElementById('timer');

const boardTable = document.getElementById('sudoku-board');
const hintBtn = document.getElementById('hintBtn');
const checkBtn = document.getElementById('checkBtn');
const resetBtn = document.getElementById('resetBtn');

const resultScreen = document.getElementById('result-screen');
const resultMessage = document.getElementById('result-message');
const resultTime = document.getElementById('result-time');
const playAgainBtn = document.getElementById('playAgainBtn');
const closeResultBtn = document.getElementById('closeResultBtn');

const soundCorrect = document.getElementById('sound-correct');
const soundWrong = document.getElementById('sound-wrong');
const soundWin = document.getElementById('sound-win');

/* ---------- Game State ---------- */
let solution = [];
let puzzle = [];
let playerName = '';
let timerInterval = null;
let elapsed = 0;

/* ---------- Helpers ---------- */
function deepCopy(grid){ return grid.map(r => r.slice()); }

function removeCellsFromSolution(sol, removeCount){
  const p = deepCopy(sol);
  let removed = 0;
  while(removed < removeCount){
    const r = Math.floor(Math.random()*9);
    const c = Math.floor(Math.random()*9);
    if(p[r][c] !== ""){ p[r][c] = ""; removed++; }
  }
  return p;
}

function removeCountForDifficulty(d){
  if(d === 'easy') return 36;   // ~45 filled
  if(d === 'medium') return 46; // ~35 filled
  return 54;                    // ~27 filled
}

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
function stopTimer(){
  if(timerInterval){ clearInterval(timerInterval); timerInterval = null; }
}

/* ---------- Render Board (fixed layout) ---------- */
function renderBoard(){
  boardTable.innerHTML = '';
  for(let r=0; r<9; r++){
    const tr = document.createElement('tr');
    for(let c=0; c<9; c++){
      const td = document.createElement('td');

      // Bold block borders
      if(r % 3 === 0) td.style.borderTopWidth = '2px';
      if(c % 3 === 0) td.style.borderLeftWidth = '2px';
      if(r === 8) td.style.borderBottomWidth = '2px';
      if(c === 8) td.style.borderRightWidth = '2px';

      const val = puzzle[r][c];
      if(val === ""){
        const inp = document.createElement('input');
        inp.type = 'text';
        inp.maxLength = 1;
        inp.inputMode = 'numeric';
        inp.autocomplete = 'off';

        // Only digits 1-9 allowed; center aligned via CSS
        inp.addEventListener('input', (e) => {
          let v = e.target.value.replace(/[^\d]/g,'').slice(0,1);
          if(v === '0') v = '';
          e.target.value = v;
          // Optional immediate feedback (play small sound for correct number typed)
          // We'll avoid giving audio on every input to not be annoying.
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

/* ---------- Start Game ---------- */
function startGame(){
  const name = playerNameInput.value.trim();
  if(!name){ alert('Please enter your name'); playerNameInput.focus(); return; }
  playerName = name;
  greeting.textContent = `Player: ${playerName}`;

  // prepare puzzle
  solution = deepCopy(BASE_SOLUTION);
  const diff = difficultySelect.value || 'medium';
  const removeCount = removeCountForDifficulty(diff);
  puzzle = removeCellsFromSolution(solution, removeCount);

  // UI changes
  welcomeScreen.classList.add('hidden');
  resultScreen.classList.add('hidden');

  renderBoard();
  startTimer();
}

/* ---------- Check board correctness ---------- */
function checkBoard(){
  // Gather inputs and compare to solution
  const inputs = boardTable.querySelectorAll('input');
  let idx = 0;
  for(let r=0;r<9;r++){
    for(let c=0;c<9;c++){
      if(puzzle[r][c] === ""){
        const val = inputs[idx].value.trim();
        idx++;
        if(val === "" || Number(val) !== solution[r][c]){
          // wrong or empty -> show result as not complete
          soundWrong && soundWrong.play();
          showResult(false);
          return false;
        }
      } else {
        // prefilled cell - continue
      }
    }
  }
  // All matched
  soundWin && soundWin.play();
  showResult(true);
  return true;
}

/* ---------- Hint ---------- */
function giveHint(){
  const empties = [];
  for(let r=0;r<9;r++){
    for(let c=0;c<9;c++){
      if(puzzle[r][c] === "") empties.push({r,c});
    }
  }
  if(empties.length === 0){ alert('No empty cells to hint.'); return; }

  const pick = empties[Math.floor(Math.random()*empties.length)];
  // fill puzzle so rendering shows as prefilled
  puzzle[pick.r][pick.c] = solution[pick.r][pick.c];
  renderBoard();
}

/* ---------- Reset puzzle (same difficulty) ---------- */
function resetPuzzle(){
  if(!solution.length) return;
  const diff = difficultySelect.value || 'medium';
  puzzle = removeCellsFromSolution(solution, removeCountForDifficulty(diff));
  renderBoard();
  elapsed = 0;
  timerEl.textContent = 'Time: 00:00';
}

/* ---------- Show result ---------- */
function showResult(success){
  stopTimer();
  resultMessage.textContent = success
    ? `🎉 Congratulations ${playerName} — You solved the Sudoku!`
    : `❌ Not correct yet, ${playerName}. Try again!`;

  const mm = String(Math.floor(elapsed/60)).padStart(2,'0');
  const ss = String(elapsed%60).padStart(2,'0');
  resultTime.textContent = `Time: ${mm}:${ss}`;

  resultScreen.classList.remove('hidden');
}

/* ---------- Play again (restart completely) ---------- */
function playAgain(){
  // reset UI to welcome
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
}

/* ---------- Theme toggle ---------- */
function toggleTheme(){
  document.body.classList.toggle('light');
}

/* ---------- Event listeners ---------- */
startBtn.addEventListener('click', startGame);
hintBtn.addEventListener('click', giveHint);
checkBtn.addEventListener('click', checkBoard);
resetBtn.addEventListener('click', resetPuzzle);
playAgainBtn.addEventListener('click', playAgain);
closeResultBtn.addEventListener('click', ()=> resultScreen.classList.add('hidden'));
toggleThemeBtn.addEventListener('click', toggleTheme);

/* ---------- Init: show welcome screen, hide result ---------- */
(function init(){
  welcomeScreen.classList.remove('hidden');
  resultScreen.classList.add('hidden');
  timerEl.textContent = 'Time: 00:00';
})();
