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
const difficultySelect = document.getElementById('difficulty');
const milestoneBanner = document.getElementById('milestone-banner');

// --- Audio setup for click sounds ---
// Use Web Audio API so we don't need to ship an audio file.
// Plays a short "drop" blip; slightly different tone for good vs bad.
const AudioCtx = window.AudioContext || window.webkitAudioContext;
let audioCtx = null;

function getAudioCtx() {
    if (!audioCtx && AudioCtx) {
        audioCtx = new AudioCtx();
    }
    return audioCtx;
}

function playDropSound(isGood) {
    const ctx = getAudioCtx();
    if (!ctx) return; // Web Audio not supported

    // On some browsers the context starts suspended until a user gesture.
    if (ctx.state === 'suspended') {
        // Try to resume on the click gesture that triggered this.
        ctx.resume().catch(() => {});
    }

    const now = ctx.currentTime;

    // Create a simple "drip": oscillator + quick gain envelope + slight pitch glide
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    // Tone selection: higher pitch for good, lower for bad
    const startFreq = isGood ? 800 : 260;
    const endFreq = isGood ? 500 : 180;

    osc.type = 'sine';
    osc.frequency.setValueAtTime(startFreq, now);
    osc.frequency.exponentialRampToValueAtTime(endFreq, now + 0.15);

    // Gentle, percussive envelope
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.25, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.2);

    // Light lowpass to make it more "drop"-like
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(2000, now);
    filter.Q.value = 1.2;

    osc.connect(gain).connect(filter).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.22);
}

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
        // Play a short click/drip sound on every drop click
        playDropSound(isGood);
        if (isGood) {
            score += 1;
        } else {
            score -= 2;
        }
        scoreSpan.textContent = score;
        checkMilestones();
        drop.remove();
    });

    gameContainer.appendChild(drop);

    const lifetime = activeSettings?.lifetimeMs ?? 1500;
    setTimeout(() => {
        if (drop.parentNode) drop.remove();
    }, lifetime);
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

    // Apply difficulty settings
    const chosen = (difficultySelect?.value || 'normal');
    activeSettings = difficulties[chosen] || difficulties.normal;
    // Prevent changing difficulty mid-game
    if (difficultySelect) difficultySelect.disabled = true;
    startBtn.disabled = true;

    // Reset milestones and banner
    shownMilestones.clear();
    hideMilestone();

    timerInterval = setInterval(updateTimer, 100);
    dropInterval = setInterval(() => {
        // chance for good drop depends on difficulty
        createDrop(Math.random() < activeSettings.goodChance);
    }, activeSettings.spawnMs);
}

function endGame() {
    gameActive = false;
    clearInterval(timerInterval);
    clearInterval(dropInterval);
    timeSpan.textContent = 0;
    alert(`Game Over! Your score: ${score}`);
    if (difficultySelect) difficultySelect.disabled = false;
    startBtn.disabled = false;
}

startBtn.addEventListener('click', () => {
    if (!gameActive) startGame();
});

// --- Difficulty settings ---
// Adjust spawn rate, good drop chance, and drop lifetime by difficulty.
const difficulties = {
    easy:   { spawnMs: 900, goodChance: 0.75, lifetimeMs: 1800 },
    normal: { spawnMs: 700, goodChance: 0.60, lifetimeMs: 1500 },
    hard:   { spawnMs: 500, goodChance: 0.50, lifetimeMs: 1200 },
};

let activeSettings = difficulties.normal;

// --- Milestones ---
// Show encouraging messages at certain score thresholds once per game.
const milestoneConfig = [
    { score: 5,  messages: [
        'Great start! 5 drops!',
        'You’re on your way!',
        'Nice streak!'
    ]},
    { score: 10, messages: [
        'Halfway there!',
        '10 down — keep it flowing!',
        'Making waves!'
    ]},
    { score: 15, messages: [
        '15! So close!',
        'You’ve got the rhythm!',
        'Drop by drop!'
    ]},
    { score: 20, messages: [
        '20! Incredible!',
        'You did it — amazing!',
        'Hydration hero!'
    ]},
];

const shownMilestones = new Set();

function randFrom(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

function showMilestone(text) {
    if (!milestoneBanner) return;
    milestoneBanner.textContent = text;
    milestoneBanner.classList.add('show');
    // Auto-hide after 2 seconds
    clearTimeout(showMilestone._t);
    showMilestone._t = setTimeout(() => {
        hideMilestone();
    }, 2000);
}

function hideMilestone() {
    if (!milestoneBanner) return;
    milestoneBanner.classList.remove('show');
}

function checkMilestones() {
    for (const m of milestoneConfig) {
        if (score >= m.score && !shownMilestones.has(m.score)) {
            shownMilestones.add(m.score);
            showMilestone(randFrom(m.messages));
        }
    }
}
