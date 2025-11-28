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
    ],
    medium: [
        [null,2,null,6,null,8,null,null,null],
        [5,8,null,null,9,null,2,null,null],
        [null,null,null,null,4,null,null,null,null],
        [3,null,null,null,null,null,null,1,null],
        [null,null,1,null,null,null,7,null,null],
        [null,6,null,null,null,null,null,null,9],
        [null,null,null,null,1,null,null,null,null],
        [null,null,4,null,6,null,null,2,1],
        [null,null,null,2,null,9,null,5,null]
    ],
    hard: [
        [null,null,5,3,null,null,null,null,null],
        [8,null,null,null,null,null,null,2,null],
        [null,7,null,null,1,null,5,null,null],
        [4,null,null,null,null,5,3,null,null],
        [null,1,null,null,7,null,null,null,6],
        [null,null,3,2,null,null,null,8,null],
        [null,6,null,5,null,null,null,null,9],
        [null,null,4,null,null,null,null,3,null],
        [null,null,null,null,null,9,7,null,null]
    ]
};

// Timer
let timerInterval;
let seconds = 0;

function startTimer() {
    timerInterval = setInterval(() => {
        seconds++;
        const mins = String(Math.floor(seconds/60)).padStart(2,'0');
        const secs = String(seconds % 60).padStart(2,'0');
        document.getElementById("timer").textContent = `${mins}:${secs}`;
    }, 1000);
}

// Start Game
let sudokuBoard, solution;

function startGame() {
    const name = document.getElementById("player-name-input").value.trim();
    if(!name){ alert("Please enter your name!"); return; }

    document.getElementById("player-name").textContent = name;
    const difficulty = document.getElementById("difficulty").value;
    sudokuBoard = JSON.parse(JSON.stringify(sudokuBoards[difficulty]));
    solution = generateSolution(difficulty);

    document.getElementById("welcome-screen").style.display = "none";
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
    let index = 0, correct=true;
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
    const resultBox = document.getElementById("result-modal");
    const resultTitle = document.getElementById("result-title");
    const finalTime = document.getElementById("final-time");
    const playerName = document.getElementById("player-name").textContent;

    finalTime.textContent = `Your time: ${document.getElementById("timer").textContent}`;

    if(correct){
        resultTitle.textContent = `Congratulations, ${playerName}! You solved it!`;
        resultTitle.className="result-success";
    }else{
        resultTitle.textContent = `Sorry ${playerName}, the puzzle is not correct.`;
        resultTitle.className="result-fail";
    }

    resultBox.style.display="flex";
}

// Close Result and Restart
function closeResult(){ window.location.reload(); }

// Generate Solution (simple pre-set solutions for demo)
function generateSolution(difficulty){
    if(difficulty=="easy"){
        return [
            [5,3,4,6,7,8,9,1,2],
            [6,7,2,1,9,5,3,4,8],
            [1,9,8,3,4,2,5,6,7],
            [8,5,9,7,6,1,4,2,3],
            [4,2,6,8,5,3,7,9,1],
            [7,1,3,9,2,4,8,5,6],
            [9,6,1,5,3,7,2,8,4],
            [2,8,7,4,1,9,6,3,5],
            [3,4,5,2,8,6,1,7,9],
        ];
    }
    if(difficulty=="medium"){
        return [
            [1,2,3,6,7,8,9,4,5],
            [5,8,9,1,9,4,2,3,7],
            [6,4,7,3,4,2,1,5,8],
            [3,5,2,7,8,6,4,1,9],
            [4,9,1,5,2,3,7,8,6],
            [7,6,8,9,1,4,5,2,3],
            [2,3,5,4,1,7,6,9,8],
            [9,7,4,8,6,5,3,2,1],
            [8,1,6,2,3,9,4,7,5],
        ];
    }
    if(difficulty=="hard"){
        return [
            [1,4,5,3,2,7,6,9,8],
            [8,3,9,6,5,4,1,2,7],
            [2,7,6,9,1,8,5,4,3],
            [4,8,1,7,9,5,3,6,2],
            [9,1,2,4,7,3,8,5,6],
            [5,6,3,2,8,1,7,8,9],
            [7,6,8,5,3,2,4,1,9],
            [6,9,4,1,4,6,2,3,5],
            [3,2,7,8,6,9,7,5,1],
        ];
    }
}
