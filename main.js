let mazeSize = 7;
let points = 0;

let maze = [];
let playerPos = { x: 0, y: 0 };
let endPos = { x: 0, y: 0 };

const pointsDisplay = document.getElementById('points');
const mazeContainer = document.getElementById('maze');

function generateMaze(size) {
  maze = Array(size).fill().map(() => Array(size).fill(1));

  function neighbors(x, y) {
    const dirs = [[2, 0], [-2, 0], [0, 2], [0, -2]];
    return dirs
      .map(d => [x + d[0], y + d[1]])
      .filter(([nx, ny]) => nx > 0 && ny > 0 && nx < size - 1 && ny < size - 1 && maze[ny][nx] === 1);
  }

  function carve(x, y) {
    maze[y][x] = 0;
    let nbs = neighbors(x, y);
    shuffleArray(nbs);
    for (const [nx, ny] of nbs) {
      if (maze[ny][nx] === 1) {
        maze[(y + ny) >> 1][(x + nx) >> 1] = 0;
        carve(nx, ny);
      }
    }
  }

  carve(1, 1);

  maze[1][1] = 0;
  maze[size - 2][size - 2] = 0;

  playerPos = { x: 1, y: 1 };
  endPos = { x: size - 2, y: size - 2 };
}

function shuffleArray(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

function calculateCellSize() {
  const maxWidth = window.innerWidth * 0.95;
  const maxHeight = window.innerHeight * 0.80;
  const cellWidth = Math.floor(maxWidth / mazeSize);
  const cellHeight = Math.floor(maxHeight / mazeSize);
  return Math.min(cellWidth, cellHeight);
}

function drawMaze() {
  mazeContainer.innerHTML = '';
  const cellSize = calculateCellSize();

  mazeContainer.style.gridTemplateColumns = `repeat(${mazeSize}, ${cellSize}px)`;
  mazeContainer.style.gridTemplateRows = `repeat(${mazeSize}, ${cellSize}px)`;
  mazeContainer.style.width = `${cellSize * mazeSize}px`;
  mazeContainer.style.height = `${cellSize * mazeSize}px`;

  for (let y = 0; y < mazeSize; y++) {
    for (let x = 0; x < mazeSize; x++) {
      const cell = document.createElement('div');
      cell.classList.add('cell');
      if (maze[y][x] === 1) cell.classList.add('wall');
      if (x === 1 && y === 1) cell.classList.add('start');
      if (x === endPos.x && y === endPos.y) cell.classList.add('end');
      if (x === playerPos.x && y === playerPos.y) cell.classList.add('player');
      mazeContainer.appendChild(cell);
    }
  }
}

function tryMove(dx, dy) {
  const nx = playerPos.x + dx;
  const ny = playerPos.y + dy;
  if (nx >= 0 && ny >= 0 && nx < mazeSize && ny < mazeSize) {
    if (maze[ny][nx] === 0) {
      playerPos.x = nx;
      playerPos.y = ny;
      drawMaze();
      checkEnd();
    }
  }
}

function checkEnd() {
  if (playerPos.x === endPos.x && playerPos.y === endPos.y) {
    points++;
    pointsDisplay.textContent = `Punkte: ${points}`;
    mazeSize += 2;
    generateMaze(mazeSize);
    drawMaze();
  }
}

window.addEventListener('keydown', e => {
  switch (e.key) {
    case 'ArrowUp': e.preventDefault(); tryMove(0, -1); break;
    case 'ArrowDown': e.preventDefault(); tryMove(0, 1); break;
    case 'ArrowLeft': e.preventDefault(); tryMove(-1, 0); break;
    case 'ArrowRight': e.preventDefault(); tryMove(1, 0); break;
  }
});

window.addEventListener('resize', () => {
  drawMaze();
});

// TOUCH-STEUERUNG
let startX = 0, startY = 0;

mazeContainer.addEventListener('touchstart', e => {
  const touch = e.touches[0];
  startX = touch.clientX;
  startY = touch.clientY;
}, { passive: true });

mazeContainer.addEventListener('touchend', e => {
  const touch = e.changedTouches[0];
  const dx = touch.clientX - startX;
  const dy = touch.clientY - startY;

  if (Math.abs(dx) > Math.abs(dy)) {
    if (dx > 30) tryMove(1, 0);
    else if (dx < -30) tryMove(-1, 0);
  } else {
    if (dy > 30) tryMove(0, 1);
    else if (dy < -30) tryMove(0, -1);
  }
});

generateMaze(mazeSize);
drawMaze();
pointsDisplay.textContent = `Punkte: ${points}`;
