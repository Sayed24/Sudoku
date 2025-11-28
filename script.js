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

let puzzle = [];
let playerName = "";
let timerInterval;
let elapsedSeconds = 0;

const board = document.getElementById("sudoku-board");
const welcomeScreen = document.getElementById("welcome-screen");
const resultScreen = document.getElementById("result-screen");
const resultMessage = document.getElementById("result-message");
const resultTime = document.getElementById("result-time");
const greeting = document.getElementById("greeting");

const startBtn = document.getElementById("startBtn");
const playAgainBtn = document.getElementById("playAgainBtn");
const hintBtn = document.getElementById("hintBtn");
const toggleThemeBtn = document.getElementById("toggleThemeBtn");

const correctSound = document.getElementById("correct-sound");
const wrongSound = document.getElementById("wrong-sound");
const winSound = document.getElementById("win-sound");
const timerDisplay = document.getElementById("timer");

function deepCopyGrid(g){ return g.map(r => r.slice()); }
function makePuzzle(removeCount){
    let p = deepCopyGrid(solution);
    let removed = 0;
    while(removed < removeCount){
        let r = Math.floor(Math.random()*9);
        let c = Math.floor(Math.random()*9);
        if(p[r][c] !== ""){ p[r][c] = ""; removed++; }
    }
    return p;
}

function startTimer(){
    clearInterval(timerInterval);
    elapsedSeconds=0;
    timerDisplay.textContent="Time: 00:00";
    timerInterval=setInterval(()=>{
        elapsedSeconds++;
        let mm = String(Math.floor(elapsedSeconds/60)).padStart(2,'0');
        let ss = String(elapsedSeconds%60).padStart(2,'0');
        timerDisplay.textContent=`Time: ${mm}:${ss}`;
    },1000);
}
function stopTimer(){ clearInterval(timerInterval); }

function generateBoard(){
    board.innerHTML="";
    for(let r=0;r<9;r++){
        let row = document.createElement("tr");
        for(let c=0;c<9;c++){
            let cell = document.createElement("td");
            if(r%3===0) cell.style.borderTopWidth="3px";
            if(c%3===0) cell.style.borderLeftWidth="3px";
            if(r===8) cell.style.borderBottomWidth="3px";
            if(c===8) cell.style.borderRightWidth="3px";

            let val = puzzle[r][c];
            if(val!==""){
                cell.textContent=val;
                cell.style.background="rgba(0,198,255,0.3)";
            }else{
                let input=document.createElement("input");
                input.maxLength=1;
                input.addEventListener("input",()=>{ input.value=input.value.replace(/[^\d]/g,''); checkBoard(); });
                cell.appendChild(input);
            }
            row.appendChild(cell);
        }
        board.appendChild(row);
    }
}

function startGame(){
    playerName=document.getElementById("playerName").value.trim();
    if(playerName==="") return;
    greeting.textContent=`Player: ${playerName}`;
    welcomeScreen.style.display="none";
    let diff=document.getElementById("difficulty").value;
    let removeCount=diff==="easy"?36:diff==="medium"?46:54;
    puzzle=makePuzzle(removeCount);
    generateBoard();
    startTimer();
}

function checkBoard(){
    const inputs=board.querySelectorAll("input");
    let idx=0;
    for(let r=0;r<9;r++){
        for(let c=0;c<9;c++){
            let cell=puzzle[r][c];
            let val = cell===""?inputs[idx++].value:cell;
            if(Number(val)!==solution[r][c]) return;
        }
    }
    stopTimer();
    let mm = String(Math.floor(elapsedSeconds/60)).padStart(2,'0');
    let ss = String(elapsedSeconds%60).padStart(2,'0');
    resultMessage.textContent=`🎉 Congratulations ${playerName}, You completed the Sudoku!`;
    resultTime.textContent=`Time: ${mm}:${ss}`;
    resultScreen.style.display="flex";
    winSound.play();
}

startBtn.addEventListener("click", startGame);
playAgainBtn.addEventListener("click",()=>{ location.reload(); });
hintBtn.addEventListener("click",()=>{
    for(let r=0;r<9;r++){
        for(let c=0;c<9;c++){
            let cell=board.rows[r].cells[c];
            if(cell.children[0] && cell.children[0].value===""){
                cell.children[0].value=solution[r][c];
                return;
            }
        }
    }
});

// Dark/Light mode
toggleThemeBtn.addEventListener("click",()=>{
    document.body.classList.toggle("light");
});