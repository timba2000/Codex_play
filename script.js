const canvas = document.getElementById('board');
const ctx = canvas.getContext('2d');

const CELL_SIZE = 20;
const BOARD_CELLS = canvas.width / CELL_SIZE;
const BASE_SPEED = 110; // milliseconds per move

const startBtn = document.getElementById('startBtn');
const pauseBtn = document.getElementById('pauseBtn');
const resetBtn = document.getElementById('resetBtn');
const scoreValue = document.getElementById('scoreValue');
const highScoreValue = document.getElementById('highScoreValue');
const highScoreName = document.getElementById('highScoreName');

let snake = [];
let direction = { x: 1, y: 0 };
let nextDirection = direction;
let food = { x: 5, y: 5 };
let score = 0;
let intervalId = null;
let isRunning = false;
let isGameOver = false;
let hasStarted = false;
let highScore = loadHighScore();

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
  updateHighScoreDisplay();
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
  if (score > highScore.score) {
    const namePrompt = prompt('New high score! Enter your name:', highScore.name !== '---' ? highScore.name : '') ?? '';
    const trimmedName = namePrompt.trim() || 'Anonymous';
    highScore = {
      score,
      name: trimmedName,
    };
    saveHighScore();
    updateHighScoreDisplay();
  }
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

function loadHighScore() {
  try {
    const stored = localStorage.getItem('snakeHighScore');
    if (!stored) {
      return { score: 0, name: '---' };
    }
    const parsed = JSON.parse(stored);
    const storedScore = Number(parsed.score);
    if (!Number.isFinite(storedScore) || storedScore < 0) {
      return { score: 0, name: '---' };
    }
    const storedName = typeof parsed.name === 'string' && parsed.name.trim() !== '' ? parsed.name.trim() : '---';
    return { score: storedScore, name: storedName };
  } catch (error) {
    return { score: 0, name: '---' };
  }
}

function saveHighScore() {
  try {
    localStorage.setItem('snakeHighScore', JSON.stringify(highScore));
  } catch (error) {
    // Ignore write errors (e.g., storage disabled)
  }
}

function updateHighScoreDisplay() {
  highScoreValue.textContent = highScore.score;
  highScoreName.textContent = highScore.name || '---';
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
  const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  gradient.addColorStop(0, '#4ade80');
  gradient.addColorStop(1, '#22d3ee');
  ctx.fillStyle = gradient;

  snake.forEach((segment, index) => {
    const x = segment.x * CELL_SIZE;
    const y = segment.y * CELL_SIZE;
    ctx.fillRect(x, y, CELL_SIZE, CELL_SIZE);

    if (index === 0) {
      ctx.fillStyle = 'rgba(15, 23, 42, 0.6)';
      const eyeSize = CELL_SIZE / 6;
      const offsetX = direction.x === 0 ? eyeSize : direction.x > 0 ? CELL_SIZE - 2 * eyeSize : eyeSize;
      const offsetY = direction.y === 0 ? eyeSize : direction.y > 0 ? CELL_SIZE - 2 * eyeSize : eyeSize;
      ctx.fillRect(x + offsetX, y + eyeSize, eyeSize, eyeSize);
      ctx.fillRect(x + eyeSize, y + offsetY, eyeSize, eyeSize);
      ctx.fillStyle = gradient;
    }
  });
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
