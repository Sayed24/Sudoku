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

// Clone solution to puzzle
let puzzle = solution.map(row => row.slice());

// Remove 55 random cells
for (let i = 0; i < 55; i++) {
    let r = Math.floor(Math.random() * 9);
    let c = Math.floor(Math.random() * 9);
    puzzle[r][c] = "";
}

function renderBoard() {
    const table = document.getElementById("sudokuBoard");
    table.innerHTML = "";

    for (let r = 0; r < 9; r++) {
        let row = document.createElement("tr");

        for (let c = 0; c < 9; c++) {
            let cell = document.createElement("td");

            if (puzzle[r][c] === "") {
                let input = document.createElement("input");
                input.setAttribute("maxlength", 1);
                cell.appendChild(input);
            } else {
                cell.textContent = puzzle[r][c];
            }

            row.appendChild(cell);
        }

        table.appendChild(row);
    }
}

function startGame() {
    let name = document.getElementById("playerNameInput").value.trim();

    if (name === "") return alert("Please enter your name!");

    document.getElementById("welcomeScreen").style.display = "none";
    document.getElementById("playerNameDisplay").textContent = "Player: " + name;

    renderBoard();
}

function checkSudoku() {
    let inputs = document.querySelectorAll("td input");
    let index = 0;

    for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {

            let value = puzzle[r][c] === "" ? inputs[index++].value : puzzle[r][c];

            if (Number(value) !== solution[r][c]) {
                showResult(false);
                return;
            }
        }
    }
    showResult(true);
}

function giveHint() {
    let empties = [];

    for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
            if (puzzle[r][c] === "") {
                empties.push({ r, c });
            }
        }
    }

    if (empties.length === 0) return;

    let random = empties[Math.floor(Math.random() * empties.length)];

    puzzle[random.r][random.c] = solution[random.r][random.c];
    renderBoard();
}

function showResult(success) {
    let player = document.getElementById("playerNameDisplay").textContent.replace("Player: ", "");

    let msg = success
        ? `🎉 Congratulations ${player}, You Completed the Sudoku!`
        : `❌ Sorry ${player}, Your Solution Is Incorrect.`;

    document.getElementById("resultMessage").textContent = msg;
    document.getElementById("resultPopup").style.display = "flex";
}

function playAgain() {
    window.location.reload();
}

function resetGame() {
    window.location.reload();
}