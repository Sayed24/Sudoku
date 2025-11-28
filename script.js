/* Sudoku game - complete working version
   - hidden result modal by default
   - hint, check, reset, play again
   - digits-only input enforcement
   - bold 3x3 borders
   - simple timer
*/

/* ------- Utilities & initial solution/puzzles ------- */

/* A base valid solved grid (used as solution template in this simple implementation).
   In a production app you'd use a proper generator/solver to create many unique puzzles.
*/
const baseSolution = [
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

/* Deep copy helper */
function deepCopyGrid(g){ return g.map(r => r.slice()); }

/* Remove N cells randomly from a solution to make a puzzle */
function makePuzzleFromSolution(sol, removeCount){
  const puzzle = deepCopyGrid(sol);
  let removed = 0;
  while(removed < removeCount){
    const r = Math.floor(Math.random()*9);
    const c = Math.floor(Math.random()*9);
    if(puzzle[r][c] !== ""){ puzzle[r][c] = ""; removed++; }
  }
  return puzzle;
}

/* Difficulty -> how many cells to remove */
function removeCountForDifficulty(d){
  if(d === "easy") return 36;    // more filled
  if(d === "medium") return 46;
  return 54; // hard
}

/* ------- Game state ------- */
let solution = deepCopyGrid(baseSolution);
let puzzle = [];
let timerInterval = null;
let elapsedSeconds = 0;

/* ------- Timer functions ------- */
function startTimer(){
  stopTimer();
  elapsedSeconds = 0;
  updateTimerDisplay();
  timerInterval = setInterval(()=>{
    elapsedSeconds++;
    updateTimerDisplay();
  }, 1000);
}
function stopTimer(){ if(timerInterval) { clearInterval(timerInterval); timerInterval = null; } }
function updateTimerDisplay(){
  const mm = String(Math.floor(elapsedSeconds/60)).padStart(2,'0');
  const ss = String(elapsedSeconds%60).padStart(2,'0');
  document.getElementById('timerDisplay').textContent = `Time: ${mm}:${ss}`;
}

/* ------- Rendering the board ------- */
function renderBoard(){
  const table = document.getElementById('sudokuBoard');
  table.innerHTML = '';

  for(let r=0; r<9; r++){
    const tr = document.createElement('tr');

    for(let c=0; c<9; c++){
      const td = document.createElement('td');

      // add data attributes for potential future use
      td.dataset.row = r;
      td.dataset.col = c;

      if(puzzle[r][c] === ""){
        const input = document.createElement('input');
        input.type = 'text';
        input.inputMode = 'numeric';
        input.maxLength = 1;
        input.autocomplete = 'off';

        // restrict to digits 1-9
        input.addEventListener('input', (e) => {
          const val = e.target.value.replace(/[^\d]/g,'').slice(0,1);
          if(val === "0") { e.target.value = ""; return; } // disallow 0
          e.target.value = val;
        });

        // keep puzzle cell empty initially
        td.appendChild(input);
      } else {
        td.textContent = puzzle[r][c];
        td.style.fontWeight = '700';
        td.style.color = '#111827';
      }

      tr.appendChild(td);
    }

    table.appendChild(tr);
  }
}

/* ------- Start / initialize game ------- */
function startGame(){
  const name = document.getElementById('playerNameInput').value.trim();
  if(!name){ alert('Please enter your name'); return; }

  // set player display
  document.getElementById('playerNameDisplay').textContent = `Player: ${name}`;

  // difficulty
  const diff = document.getElementById('difficulty').value || 'medium';
  const removeCount = removeCountForDifficulty(diff);

  // create puzzle from base solution (simple approach)
  puzzle = makePuzzleFromSolution(solution, removeCount);

  // hide welcome, show board
  document.getElementById('welcomeScreen').classList.add('hidden');
  document.getElementById('resultPopup').classList.add('hidden');

  // render board and start timer
  renderBoard();
  startTimer();
}

/* ------- Check solution ------- */
function checkSudoku(){
  // gather inputs and compare with solution
  const table = document.getElementById('sudokuBoard');
  const inputs = table.querySelectorAll('input');
  let inputIndex = 0;

  for(let r=0; r<9; r++){
    for(let c=0; c<9; c++){
      const expected = solution[r][c];

      if(puzzle[r][c] === "") {
        const supplied = inputs[inputIndex].value.trim();
        inputIndex++;
        if(supplied === "" || Number(supplied) !== expected){
          showResult(false);
          return;
        }
      } else {
        // prefilled cell - already matches
      }
    }
  }

  // all matched
  showResult(true);
}

/* ------- Hint: fill one empty cell with correct number ------- */
function giveHint(){
  const empties = [];
  for(let r=0;r<9;r++){
    for(let c=0;c<9;c++){
      if(puzzle[r][c] === "") empties.push({r,c});
    }
  }
  if(empties.length === 0){ alert('No empty cells to hint.'); return; }

  const pick = empties[Math.floor(Math.random()*empties.length)];
  puzzle[pick.r][pick.c] = solution[pick.r][pick.c];

  // re-render and keep timer running
  renderBoard();
}

/* ------- Reset & Play Again ------- */
function resetPuzzle(){
  // rebuild puzzle from solution using same difficulty
  const diff = document.getElementById('difficulty').value || 'medium';
  puzzle = makePuzzleFromSolution(solution, removeCountForDifficulty(diff));
  renderBoard();
  elapsedSeconds = 0;
  updateTimerDisplay();
}

function playAgain(){
  // restart fresh: re-show welcome screen
  document.getElementById('welcomeScreen').classList.remove('hidden');
  document.getElementById('resultPopup').classList.add('hidden');
  stopTimer();
  elapsedSeconds = 0;
  updateTimerDisplay();
  document.getElementById('playerNameInput').value = '';
  document.getElementById('playerNameDisplay').textContent = '';
  puzzle = [];
  const table = document.getElementById('sudokuBoard'); table.innerHTML = '';
}

function closeResult(){
  // just close the result modal and allow editing (do not reload)
  document.getElementById('resultPopup').classList.add('hidden');
}

/* ------- Show result modal ------- */
function showResult(success){
  stopTimer();
  const msg = success ? '🎉 Congratulations — You solved it!' : '❌ Not correct. Keep trying!';
  document.getElementById('resultMessage').textContent = msg;
  const mm = String(Math.floor(elapsedSeconds/60)).padStart(2,'0');
  const ss = String(elapsedSeconds%60).padStart(2,'0');
  document.getElementById('resultTime').textContent = `Time: ${mm}:${ss}`;
  document.getElementById('resultPopup').classList.remove('hidden');
}

/* ------- Initialize page default state ------- */
(function init(){
  // start with welcome screen visible and result hidden
  document.getElementById('welcomeScreen').classList.remove('hidden');
  document.getElementById('resultPopup').classList.add('hidden');
  updateTimerDisplay();
})();