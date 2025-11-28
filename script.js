// Sound
let winSound = new Audio('https://freesound.org/data/previews/320/320655_5260877-lq.mp3');
let failSound = new Audio('https://freesound.org/data/previews/170/170162_2437358-lq.mp3');

// Timer
let timerInterval; let seconds = 0;

function startTimer() {
    timerInterval = setInterval(()=>{
        seconds++;
        const mins = String(Math.floor(seconds/60)).padStart(2,'0');
        const secs = String(seconds%60).padStart(2,'0');
        document.getElementById("timer").textContent = `${mins}:${secs}`;
    }, 1000);
}

// Game variables
let sudokuBoard=[], solution=[];

// Start Game
function startGame(){
    const name = document.getElementById("player-name-input").value.trim();
    if(!name){ alert("Please enter your name!"); return; }
    document.getElementById("player-name").textContent = name;

    const difficulty=document.getElementById("difficulty").value;
    [sudokuBoard, solution] = generatePuzzle(difficulty);

    document.getElementById("welcome-screen").style.display="none";
    document.getElementById("result-modal").classList.add("hidden");
    generateBoard();
    seconds=0; startTimer();
}

// Generate Board
function generateBoard(){
    const board = document.getElementById("sudoku-board");
    board.innerHTML="";
    for(let r=0;r<9;r++){
        for(let c=0;c<9;c++){
            let cell=document.createElement("input");
            cell.maxLength=1;
            cell.classList.add("cell");
            cell.dataset.row=r; cell.dataset.col=c;
            if(sudokuBoard[r][c]!==null){
                cell.value=sudokuBoard[r][c]; cell.disabled=true; cell.style.background="#e0e0e0";
            }
            board.appendChild(cell);
        }
    }
}

// Check Sudoku
function checkSudoku(){
    const cells=document.querySelectorAll(".cell"); let index=0; let correct=true;
    for(let r=0;r<9;r++){
        for(let c=0;c<9;c++){
            let value=cells[index].value;
            if(value=="" || parseInt(value)!==solution[r][c]){
                correct=false;
                cells[index].style.background="#ffd6d6";
            }else{ cells[index].style.background="#d6ffd8"; }
            index++;
        }
    }
    showResult(correct);
}

// Show Result
function showResult(correct){
    clearInterval(timerInterval);
    const resultBox=document.getElementById("result-modal");
    const resultTitle=document.getElementById("result-title");
    const finalTime=document.getElementById("final-time");
    const playerName=document.getElementById("player-name").textContent;
    finalTime.textContent=`Your time: ${document.getElementById("timer").textContent}`;
    if(correct){ resultTitle.textContent=`Congratulations, ${playerName}! You solved it!`; resultTitle.className="result-success"; winSound.play(); confetti(); }
    else { resultTitle.textContent=`Sorry ${playerName}, the puzzle is not correct.`; resultTitle.className="result-fail"; failSound.play(); }
    resultBox.classList.remove("hidden");
}

// Close Result
function closeResult(){ window.location.reload(); }

// Hint Function
function giveHint(){
    let emptyCells=[];
    const cells=document.querySelectorAll(".cell");
    cells.forEach(cell=>{
        if(cell.value==="") emptyCells.push(cell);
    });
    if(emptyCells.length===0){ alert("No empty cells to hint."); return; }
    let hintCell=emptyCells[Math.floor(Math.random()*emptyCells.length)];
    let r=parseInt(hintCell.dataset.row); let c=parseInt(hintCell.dataset.col);
    hintCell.value=solution[r][c]; hintCell.style.background="#d6f0ff";
}

// Generate Puzzle (randomly remove numbers)
function generatePuzzle(difficulty){
    // Full solution
    let base= [
        [5,3,4,6,7,8,9,1,2],[6,7,2,1,9,5,3,4,8],[1,9,8,3,4,2,5,6,7],
        [8,5,9,7,6,1,4,2,3],[4,2,6,8,5,3,7,9,1],[7,1,3,9,2,4,8,5,6],
        [9,6,1,5,3,7,2,8,4],[2,8,7,4,1,9,6,3,5],[3,4,5,2,8,6,1,7,9]
    ];
    // Deep copy for puzzle
    let puzzle = base.map(row => row.slice());
    let removeCount = difficulty==="easy"?35:difficulty==="medium"?45:55;
    while(removeCount>0){
        let r=Math.floor(Math.random()*9);
        let c=Math.floor(Math.random()*9);
        if(puzzle[r][c]!==null){ puzzle[r][c]=null; removeCount--; }
    }
    return [puzzle, base];
}