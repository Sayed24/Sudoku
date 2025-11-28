// Simple Sudoku puzzle + solution (static for demonstration)
let puzzle = [
    [5, 3, "", "", 7, "", "", "", ""],
    [6, "", "", 1, 9, 5, "", "", ""],
    ["", 9, 8, "", "", "", "", 6, ""],
    [8, "", "", "", 6, "", "", "", 3],
    [4, "", "", 8, "", 3, "", "", 1],
    [7, "", "", "", 2, "", "", "", 6],
    ["", 6, "", "", "", "", 2, 8, ""],
    ["", "", "", 4, 1, 9, "", "", 5],
    ["", "", "", "", 8, "", "", 7, 9]
];

let solution = [
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

// Elements
const board = document.getElementById("sudoku-board");
const welcomeScreen = document.getElementById("welcome-screen");
const resultScreen = document.getElementById("result-screen");
const resultMessage = document.getElementById("result-message");
const greeting = document.getElementById("greeting");
const startBtn = document.getElementById("startBtn");
const playAgainBtn = document.getElementById("playAgainBtn");
const hintBtn = document.getElementById("hintBtn");

welcomeScreen.style.display = "flex";

// Build board
function generateBoard() {
    board.innerHTML = "";

    for (let r = 0; r < 9; r++) {
        let row = document.createElement("tr");

        for (let c = 0; c < 9; c++) {
            let cell = document.createElement("td");

            // Bold borders for 3x3 grid
            if (r % 3 === 0) cell.style.borderTopWidth = "3px";
            if (c % 3 === 0) cell.style.borderLeftWidth = "3px";
            if (r === 8) cell.style.borderBottomWidth = "3px";
            if (c === 8) cell.style.borderRightWidth = "3px";

            let value = puzzle[r][c];

            if (value !== "") {
                cell.textContent = value;
                cell.style.background = "#e3f2ff";
            } else {
                let input = document.createElement("input");
                input.maxLength = 1;

                input.addEventListener("input", () => {
                    checkBoard();
                });

                cell.appendChild(input);
            }

            row.appendChild(cell);
        }

        board.appendChild(row);
    }
}

// Check if puzzle is solved
function checkBoard() {
    for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
            let cell = board.rows[r].cells[c];

            let val = cell.children[0] ? cell.children[0].value : cell.textContent;

            if (val != solution[r][c]) return;
        }
    }

    resultMessage.textContent = `${playerName} — Success! You completed the puzzle!`;
    resultScreen.style.display = "flex";
}

let playerName = "";

startBtn.addEventListener("click", () => {
    let nameInput = document.getElementById("playerName").value.trim();

    if (nameInput === "") return;

    playerName = nameInput;
    greeting.textContent = `Player: ${playerName}`;

    welcomeScreen.style.display = "none";
    generateBoard();
});

// Hint Button
hintBtn.addEventListener("click", () => {
    for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
            let cell = board.rows[r].cells[c];

            if (cell.children[0] && cell.children[0].value === "") {
                cell.children[0].value = solution[r][c];
                return;
            }
        }
    }
});

// Play again
playAgainBtn.addEventListener("click", () => {
    location.reload();
});