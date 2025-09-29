const canvas = document.getElementById('board');
const ctx = canvas.getContext('2d');

const CELL_SIZE = 20;
const BOARD_CELLS = canvas.width / CELL_SIZE;
const BASE_SPEED = 110; // milliseconds per move

const startBtn = document.getElementById('startBtn');
const pauseBtn = document.getElementById('pauseBtn');
const resetBtn = document.getElementById('resetBtn');
const scoreValue = document.getElementById('scoreValue');

let snake = [];
let direction = { x: 1, y: 0 };
let nextDirection = direction;
let food = { x: 5, y: 5 };
let score = 0;
let intervalId = null;
let isRunning = false;
let isGameOver = false;
let hasStarted = false;

let audioContext = null;

function getAudioContext() {
  if (audioContext) return audioContext;
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return null;
  audioContext = new AudioContextClass();
  return audioContext;
}

function unlockAudioContext() {
  const context = getAudioContext();
  if (!context) return;
  if (context.state === 'suspended') {
    context.resume();
  }
}

function playMunchSound() {
  const context = getAudioContext();
  if (!context) return;

  const now = context.currentTime;
  const oscillator = context.createOscillator();
  const gainNode = context.createGain();

  oscillator.type = 'square';
  oscillator.frequency.setValueAtTime(280, now);
  oscillator.frequency.exponentialRampToValueAtTime(480, now + 0.18);

  gainNode.gain.setValueAtTime(0.0001, now);
  gainNode.gain.exponentialRampToValueAtTime(0.2, now + 0.02);
  gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.25);

  oscillator.connect(gainNode);
  gainNode.connect(context.destination);

  oscillator.start(now);
  oscillator.stop(now + 0.3);
}

const keyMap = {
  ArrowUp: { x: 0, y: -1 },
  ArrowDown: { x: 0, y: 1 },
  ArrowLeft: { x: -1, y: 0 },
  ArrowRight: { x: 1, y: 0 },
  w: { x: 0, y: -1 },
  s: { x: 0, y: 1 },
  a: { x: -1, y: 0 },
  d: { x: 1, y: 0 },
};

function init() {
  resetGame();
  drawBoard();
}

function resetGame() {
  snake = [
    { x: 8, y: 10 },
    { x: 7, y: 10 },
    { x: 6, y: 10 },
  ];
  direction = { x: 1, y: 0 };
  nextDirection = direction;
  score = 0;
  scoreValue.textContent = score;
  food = spawnFood();
  isGameOver = false;
  hasStarted = false;
  drawBoard();
  updateButtons();
}

function startGame() {
  if (isRunning) return;
  if (isGameOver) {
    resetGame();
  }
  unlockAudioContext();
  isRunning = true;
  hasStarted = true;
  intervalId = window.setInterval(step, BASE_SPEED);
  updateButtons();
}

function pauseGame() {
  if (!isRunning) return;
  isRunning = false;
  window.clearInterval(intervalId);
  updateButtons();
}

function resumeGame() {
  if (isRunning || isGameOver) return;
  unlockAudioContext();
  isRunning = true;
  hasStarted = true;
  intervalId = window.setInterval(step, BASE_SPEED);
  updateButtons();
}

function stopGame() {
  isRunning = false;
  window.clearInterval(intervalId);
  updateButtons();
}

function updateButtons() {
  startBtn.disabled = isRunning || (hasStarted && !isGameOver);
  startBtn.textContent = isGameOver ? 'Play Again' : 'Start';

  pauseBtn.disabled = !hasStarted || isGameOver;
  pauseBtn.textContent = isRunning ? 'Pause' : 'Resume';
  if (!hasStarted || isGameOver) {
    pauseBtn.textContent = 'Pause';
  }

  resetBtn.disabled = !hasStarted || isRunning;
}

function spawnFood() {
  let position;
  do {
    position = {
      x: Math.floor(Math.random() * BOARD_CELLS),
      y: Math.floor(Math.random() * BOARD_CELLS),
    };
  } while (snake.some((segment) => segment.x === position.x && segment.y === position.y));
  return position;
}

function step() {
  direction = nextDirection;
  const newHead = {
    x: snake[0].x + direction.x,
    y: snake[0].y + direction.y,
  };

  if (isCollision(newHead)) {
    handleGameOver();
    return;
  }

  snake.unshift(newHead);

  if (newHead.x === food.x && newHead.y === food.y) {
    score += 10;
    scoreValue.textContent = score;
    food = spawnFood();
    playMunchSound();
  } else {
    snake.pop();
  }

  drawBoard();
}

function isCollision(head) {
  const outOfBounds =
    head.x < 0 ||
    head.y < 0 ||
    head.x >= BOARD_CELLS ||
    head.y >= BOARD_CELLS;

  if (outOfBounds) return true;

  return snake.some((segment) => segment.x === head.x && segment.y === head.y);
}

function handleGameOver() {
  stopGame();
  isGameOver = true;
  updateButtons();
  drawBoard();
}

function drawBoard() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawGrid();
  drawFood();
  drawSnake();

  if (isGameOver) {
    drawGameOver();
  }
}

function drawGrid() {
  ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--grid-line');
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let i = 0; i <= BOARD_CELLS; i++) {
    ctx.moveTo(i * CELL_SIZE + 0.5, 0);
    ctx.lineTo(i * CELL_SIZE + 0.5, canvas.height);
    ctx.moveTo(0, i * CELL_SIZE + 0.5);
    ctx.lineTo(canvas.width, i * CELL_SIZE + 0.5);
  }
  ctx.stroke();
}

function drawSnake() {
  snake.forEach((segment, index) => {
    const x = segment.x * CELL_SIZE;
    const y = segment.y * CELL_SIZE;
    const isHead = index === 0;
    const progress = index / Math.max(1, snake.length - 1);
    const padding = CELL_SIZE * 0.15;
    const radius = CELL_SIZE / 2.3;
    const bodySize = CELL_SIZE - padding * 2;

    const bodyGradient = ctx.createLinearGradient(x, y, x + CELL_SIZE, y + CELL_SIZE);
    bodyGradient.addColorStop(0, `hsl(${145 - progress * 18}, 82%, ${55 - progress * 10}%)`);
    bodyGradient.addColorStop(1, `hsl(${165 - progress * 10}, 88%, ${42 - progress * 8}%)`);

    ctx.save();
    ctx.shadowColor = 'rgba(34, 197, 94, 0.35)';
    ctx.shadowBlur = 12;
    drawRoundedRect(ctx, x + padding, y + padding, bodySize, bodySize, radius);
    ctx.fillStyle = bodyGradient;
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.lineWidth = 1.4;
    ctx.strokeStyle = 'rgba(15, 23, 42, 0.45)';
    drawRoundedRect(ctx, x + padding, y + padding, bodySize, bodySize, radius);
    ctx.stroke();
    ctx.restore();

    ctx.save();
    const shineGradient = ctx.createLinearGradient(x, y, x, y + CELL_SIZE);
    shineGradient.addColorStop(0, 'rgba(255, 255, 255, 0.6)');
    shineGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.globalAlpha = 0.4;
    drawRoundedRect(
      ctx,
      x + padding + 1.5,
      y + padding + 1.5,
      bodySize - 3,
      (bodySize - 3) / 1.7,
      radius / 1.5
    );
    ctx.fillStyle = shineGradient;
    ctx.fill();
    ctx.restore();

    if (isHead) {
      drawSnakeHead(x, y, padding, bodySize);
    }
  });
}

function drawSnakeHead(x, y, padding, bodySize) {
  const centerX = x + CELL_SIZE / 2;
  const centerY = y + CELL_SIZE / 2;
  const eyeRadius = Math.max(2.5, CELL_SIZE / 6.5);
  const pupilRadius = eyeRadius / 1.8;
  const eyeOffset = eyeRadius * 1.2;

  let eyes;
  if (direction.x !== 0) {
    const baseX = direction.x > 0 ? x + CELL_SIZE - padding - eyeRadius * 1.2 : x + padding + eyeRadius * 1.2;
    eyes = [
      { x: baseX, y: centerY - eyeOffset },
      { x: baseX, y: centerY + eyeOffset },
    ];
  } else {
    const baseY = direction.y > 0 ? y + CELL_SIZE - padding - eyeRadius * 1.2 : y + padding + eyeRadius * 1.2;
    eyes = [
      { x: centerX - eyeOffset, y: baseY },
      { x: centerX + eyeOffset, y: baseY },
    ];
  }

  ctx.save();
  eyes.forEach((eye) => {
    ctx.fillStyle = '#f8fafc';
    ctx.beginPath();
    ctx.arc(eye.x, eye.y, eyeRadius, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(
      eye.x + direction.x * eyeRadius * 0.25,
      eye.y + direction.y * eyeRadius * 0.25,
      pupilRadius,
      0,
      Math.PI * 2
    );
    ctx.fill();
  });
  ctx.restore();

  const tongueLength = CELL_SIZE / 3.2;
  const tongueWidth = CELL_SIZE / 10;
  const baseX = centerX + direction.x * (bodySize / 2 + 1);
  const baseY = centerY + direction.y * (bodySize / 2 + 1);

  ctx.save();
  ctx.fillStyle = 'rgba(248, 113, 113, 0.85)';
  ctx.beginPath();
  if (direction.x !== 0) {
    ctx.moveTo(baseX, baseY - tongueWidth / 2);
    ctx.lineTo(baseX + direction.x * tongueLength, baseY);
    ctx.lineTo(baseX, baseY + tongueWidth / 2);
  } else {
    ctx.moveTo(baseX - tongueWidth / 2, baseY);
    ctx.lineTo(baseX, baseY + direction.y * tongueLength);
    ctx.lineTo(baseX + tongueWidth / 2, baseY);
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawRoundedRect(context, x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2);
  context.beginPath();
  context.moveTo(x + r, y);
  context.arcTo(x + width, y, x + width, y + height, r);
  context.arcTo(x + width, y + height, x, y + height, r);
  context.arcTo(x, y + height, x, y, r);
  context.arcTo(x, y, x + width, y, r);
  context.closePath();
}

function drawFood() {
  const x = food.x * CELL_SIZE;
  const y = food.y * CELL_SIZE;
  const radius = CELL_SIZE / 2;

  const glow = ctx.createRadialGradient(
    x + radius,
    y + radius,
    CELL_SIZE / 8,
    x + radius,
    y + radius,
    radius
  );
  glow.addColorStop(0, '#fbbf24');
  glow.addColorStop(1, 'rgba(251, 191, 36, 0.2)');

  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(x + radius, y + radius, radius, 0, Math.PI * 2);
  ctx.fill();
}

function drawGameOver() {
  ctx.fillStyle = 'rgba(15, 23, 42, 0.7)';
  ctx.fillRect(0, canvas.height / 2 - 40, canvas.width, 80);

  ctx.fillStyle = '#f1f5f9';
  ctx.font = 'bold 28px "Segoe UI", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
  ctx.font = '16px "Segoe UI", sans-serif';
  ctx.fillText('Press Start to try again', canvas.width / 2, canvas.height / 2 + 26);
}

function changeDirection(event) {
  const newDirection = keyMap[event.key];
  if (!newDirection) return;

  const isOpposite = newDirection.x === -direction.x && newDirection.y === -direction.y;
  if (isOpposite) return;

  nextDirection = newDirection;
}

document.addEventListener('keydown', (event) => {
  unlockAudioContext();
  if (event.key === ' ' && !isGameOver) {
    event.preventDefault();
    if (isRunning) {
      pauseGame();
    } else {
      resumeGame();
    }
    return;
  }
  changeDirection(event);
});

startBtn.addEventListener('click', () => {
  if (isGameOver) {
    resetGame();
  }
  startGame();
});

pauseBtn.addEventListener('click', () => {
  if (isRunning) {
    pauseGame();
  } else {
    resumeGame();
  }
});

resetBtn.addEventListener('click', () => {
  stopGame();
  resetGame();
});

init();
