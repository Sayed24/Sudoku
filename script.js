// Sound effects
let correctSound = new Audio('https://freesound.org/data/previews/522/522148_10277777-lq.mp3'); // optional: correct sound
let wrongSound = new Audio('https://freesound.org/data/previews/170/170162_2437358-lq.mp3'); // optional: wrong sound
let winSound = new Audio('https://freesound.org/data/previews/320/320655_5260877-lq.mp3'); // win

// Confetti
function launchConfetti() {
    const duration = 3 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 1000 };

    function frame() {
        confetti({ ...defaults, particleCount: 5, origin: { x: Math.random(), y: Math.random() - 0.2 } });
        if (Date.now() < animationEnd) requestAnimationFrame(frame);
    }
    frame();
}

// Predefined boards
let sudokuBoards = {
    easy: [
        [5,3,null,null,7,null,null,null,null],
        [6,null,null,1,9,5,null,null,null],
        [null,9,8,null,null,null,null,6,null],
        [8,null,null,null,6,null,null,null,3],
        [4,null,null,8,null,3,null,null,1],
        [7,null,null,null,2,null,null,null,6],
        [null,6,null,null,null,null,2,8,null],
        [null,null,null,4,1,9,null,null,5],
        [null,null,null,null,8,null,null,7,9],
    ]
};

// Timer
let timerInterval;
let seconds = 0;

function startTimer() {
    timerInterval = setInterval(() => {
        seconds++;
        const mins = String(Math.floor(seconds/60)).padStart(2,'0');
        const secs = String(seconds%60).padStart(2,'0');
        document.getElementById("timer").textContent = `${mins}:${secs}`;
    }, 1000);
}

// Game variables
let sudokuBoard, solution;

// Start Game
function startGame() {
    const name = document.getElementById("player-name-input").value.trim();
    if(!name){ alert("Please enter your name!"); return; }

    document.getElementById("player-name").textContent = name;
    const difficulty = document.getElementById("difficulty").value;

    sudokuBoard = JSON.parse(JSON.stringify(sudokuBoards.easy)); // for demo only
    solution = generateSolution();

    document.getElementById("welcome-screen").style.display = "none";
    document.getElementById("result-modal").classList.add("hidden");
    generateBoard();
    seconds = 0;
    startTimer();
}

// Generate Board
function generateBoard(){
    const board = document.getElementById("sudoku-board");
    board.innerHTML = "";
    for(let r=0;r<9;r++){
        for(let c=0;c<9;c++){
            let cell = document.createElement("input");
            cell.maxLength=1;
            cell.classList.add("cell");
            cell.dataset.row = r;
            cell.dataset.col = c;
            if(sudokuBoard[r][c]!==null){
                cell.value=sudokuBoard[r][c];
                cell.disabled=true;
                cell.style.background="#e0e0e0";
            }
            board.appendChild(cell);
        }
    }
}

// Check Sudoku
function checkSudoku(){
    const cells = document.querySelectorAll(".cell");
    let index=0, correct=true;
    for(let r=0;r<9;r++){
        for(let c=0;c<9;c++){
            let value = cells[index].value;
            if(value=="" || parseInt(value)!==solution[r][c]){
                correct=false;
                cells[index].style.background="#ffd6d6";
            }else{
                cells[index].style.background="#d6ffd8";
            }
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

    if(correct){
        resultTitle.textContent=`Congratulations, ${playerName}! You solved it!`;
        resultTitle.className="result-success";
        winSound.play();
        launchConfetti();
    }else{
        resultTitle.textContent=`Sorry ${playerName}, the puzzle is not correct.`;
        resultTitle.className="result-fail";
        wrongSound.play();
    }

    resultBox.classList.remove("hidden");
}

// Close Result
function closeResult(){ window.location.reload(); }

// Generate Solution (fixed for demo)
function generateSolution(){
    return [
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
}
