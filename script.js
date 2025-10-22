// Variables to control game state
let gameRunning = false; // Keeps track of whether game is active or not
let dropMaker; // Will store our timer that creates drops regularly
let score = 0;
let duration = 30; // seconds
let startTime = null;
let timerInterval = null;
let dropInterval = null;
let gameActive = false;

const gameContainer = document.getElementById('game-container');
const scoreSpan = document.getElementById('score');
const timeSpan = document.getElementById('time');
const startBtn = document.getElementById('start-btn');

function randomPosition() {
    const x = Math.random() * (gameContainer.offsetWidth - 60);
    const y = Math.random() * (gameContainer.offsetHeight - 60);
    return { x, y };
}

function createDrop(isGood) {
    const drop = document.createElement('div');
    drop.classList.add('drop');
    drop.classList.add(isGood ? 'good-drop' : 'bad-drop');
    const pos = randomPosition();
    drop.style.left = `${pos.x}px`;
    drop.style.top = `${pos.y}px`;
    drop.title = isGood ? 'Good Drop' : 'Bad Drop';

    drop.addEventListener('click', () => {
        if (!gameActive) return;
        if (isGood) {
            score += 1;
        } else {
            score -= 2;
        }
        scoreSpan.textContent = score;
        drop.remove();
    });

    gameContainer.appendChild(drop);

    setTimeout(() => {
        if (drop.parentNode) drop.remove();
    }, 1500);
}

function updateTimer() {
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    const remaining = Math.max(duration - elapsed, 0);
    timeSpan.textContent = remaining;
    if (remaining <= 0) {
        endGame();
    }
}

function startGame() {
    score = 0;
    scoreSpan.textContent = score;
    gameContainer.innerHTML = '';
    gameActive = true;
    startTime = Date.now();
    timeSpan.textContent = duration;

    timerInterval = setInterval(updateTimer, 100);
    dropInterval = setInterval(() => {
        // 60% chance for good drop, 40% for bad drop
        createDrop(Math.random() < 0.6);
    }, 700);
}

function endGame() {
    gameActive = false;
    clearInterval(timerInterval);
    clearInterval(dropInterval);
    timeSpan.textContent = 0;
    alert(`Game Over! Your score: ${score}`);
}

startBtn.addEventListener('click', () => {
    if (!gameActive) startGame();
});
