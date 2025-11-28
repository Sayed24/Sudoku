let sudokuBoard = [
    [5,3,null,null,7,null,null,null,null],
    [6,null,null,1,9,5,null,null,null],
    [null,9,8,null,null,null,null,6,null],
    [8,null,null,null,6,null,null,null,3],
    [4,null,null,8,null,3,null,null,1],
    [7,null,null,null,2,null,null,null,6],
    [null,6,null,null,null,null,2,8,null],
    [null,null,null,4,1,9,null,null,5],
    [null,null,null,null,8,null,null,7,9],
];

// Complete solution to check correctness
let solution = [
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

function startGame() {
    const name = document.getElementById("player-name-input").value.trim();

    if (!name) {
        alert("Please enter your name!");
        return;
    }

    document.getElementById("player-name").textContent = name;
    document.getElementById("welcome-screen").style.display = "none";
    generateBoard();
}

function generateBoard() {
    const board = document.getElementById("sudoku-board");
    board.innerHTML = "";

    for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
            let cell = document.createElement("input");
            cell.maxLength = 1;
            cell.classList.add("cell");

            if (sudokuBoard[r][c] !== null) {
                cell.value = sudokuBoard[r][c];
                cell.disabled = true;
                cell.style.background = "#e0e0e0";
            }

            board.appendChild(cell);
        }
    }
}

function checkSudoku() {
    const cells = document.querySelectorAll(".cell");
    let index = 0;
    let correct = true;

    for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
            let value = cells[index].value;
            if (value == "" || parseInt(value) !== solution[r][c]) {
                correct = false;
                cells[index].style.background = "#ffd6d6"; 
            } else {
                cells[index].style.background = "#d6ffd8"; 
            }
            index++;
        }
    }

    showResult(correct);
}

function showResult(correct) {
    const resultBox = document.getElementById("result-modal");
    const resultTitle = document.getElementById("result-title");
    const playerName = document.getElementById("player-name").textContent;

    if (correct) {
        resultTitle.textContent = `Congratulations, ${playerName}! You solved it!`;
        resultTitle.className = "result-success";
    } else {
        resultTitle.textContent = `Sorry ${playerName}, the puzzle is not correct.`;
        resultTitle.className = "result-fail";
    }

    resultBox.style.display = "flex";
}

function closeResult() {
    window.location.reload();
}