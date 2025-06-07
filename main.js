// --- Variablen & State ---
let maze = [];
let rows = 10;
let cols = 10;
let playerPos = { row: 0, col: 0 };
let points = 0;
let inGame = false;
let gameState = 'menu'; // 'menu', 'playing', 'stats', 'builder'
let deviceType = 'auto'; // 'auto', 'mobile', 'desktop'

// Maze-Baumeister Variablen
let customMaze = null;
let mazeBuilderRows = 10;
let mazeBuilderCols = 10;
let mazeBuilderGrid = [];

// --- DOM Elemente ---
const screens = {
  menu: document.getElementById('menuScreen'),
  game: document.getElementById('gameScreen'),
  stats: document.getElementById('statsScreen'),
  builder: document.getElementById('builderScreen'),
};

const pointsDisplay = document.getElementById('pointsDisplay');
const mazeContainer = document.getElementById('mazeContainer');
const mazeBuilderGridEl = document.getElementById('mazeBuilderGrid');

// --- Funktionen ---

// Bildschirm wechseln
function showScreen(screenName) {
  Object.values(screens).forEach(s => (s.style.display = 'none'));
  if (screens[screenName]) screens[screenName].style.display = 'block';
  gameState = screenName;
}

// Neues zufälliges Maze generieren (DFS Backtracking)
function generateMaze(r, c) {
  // init 2D array mit 1=Wand
  maze = Array(r)
    .fill(null)
    .map(() => Array(c).fill(1));

  function shuffle(arr) {
    return arr.sort(() => Math.random() - 0.5);
  }

  function carve(row, col) {
    maze[row][col] = 0;
    const directions = shuffle([
      [0, 2],
      [0, -2],
      [2, 0],
      [-2, 0],
    ]);
    for (const [dr, dc] of directions) {
      const nr = row + dr;
      const nc = col + dc;
      if (nr >= 0 && nr < r && nc >= 0 && nc < c && maze[nr][nc] === 1) {
        maze[row + dr / 2][col + dc / 2] = 0;
        carve(nr, nc);
      }
    }
  }

  // Start bei (0,0) immer frei
  carve(0, 0);
  // Ende immer frei
  maze[r - 1][c - 1] = 0;
}

// Maze rendern
function renderMaze() {
  mazeContainer.innerHTML = '';
  mazeContainer.style.gridTemplateRows = `repeat(${rows}, 1fr)`;
  mazeContainer.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;

  const cellSize = getCellSize();

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cell = document.createElement('div');
      cell.style.width = cellSize + 'px';
      cell.style.height = cellSize + 'px';
      cell.classList.add('cell');
      if (maze[r][c] === 1) cell.classList.add('wall');
      if (r === playerPos.row && c === playerPos.col) cell.classList.add('player');
      if (r === rows - 1 && c === cols - 1) cell.classList.add('end');
      mazeContainer.appendChild(cell);
    }
  }
}

// Zellgröße abhängig vom Gerät
function getCellSize() {
  const maxWidth = window.innerWidth * 0.8;
  const maxHeight = window.innerHeight * 0.6;
  let sizeW = maxWidth / cols;
  let sizeH = maxHeight / rows;
  let size = Math.floor(Math.min(sizeW, sizeH));
  if (deviceType === 'mobile') size = Math.min(size, 25);
  else if (deviceType === 'desktop') size = Math.min(size, 40);
  else size = Math.min(size, 30);
  return size;
}

// Spieler bewegen
function movePlayer(dr, dc) {
  if (!inGame) return;
  const nr = playerPos.row + dr;
  const nc = playerPos.col + dc;
  if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) return;
  if (maze[nr][nc] === 1) return; // Wand
  playerPos = { row: nr, col: nc };
  renderMaze();
  checkGoal();
}

// Ziel erreicht?
function checkGoal() {
  if (playerPos.row === rows - 1 && playerPos.col === cols - 1) {
    points++;
    updatePoints();
    growMazeIfNeeded();
    startNewMaze();
  }
}

// Punktestand aktualisieren
function updatePoints() {
  pointsDisplay.textContent = `Punkte: ${points}`;
}

// Labyrinth nach Punkten vergrößern
function growMazeIfNeeded() {
  if (points === 10) {
    rows += 2;
    cols += 2;
  } else if (points === 50) {
    rows += 3;
    cols += 3;
  } else if (points === 150) {
    rows += 4;
    cols += 4;
  } else if (points === 500) {
    rows += 5;
    cols += 5;
  } else if (points === 1000) {
    rows += 6;
    cols += 6;
  }
}

// Neues Labyrinth starten (random oder custom)
function startNewMaze() {
  playerPos = { row: 0, col: 0 };
  if (customMaze) {
    maze = JSON.parse(JSON.stringify(customMaze));
    rows = maze.length;
    cols = maze[0].length;
  } else {
    generateMaze(rows, cols);
  }
  renderMaze();
}

// --- Maze-Baumeister Funktionen ---

function createMazeBuilderGrid(rows, cols) {
  mazeBuilderRows = rows;
  mazeBuilderCols = cols;
  mazeBuilderGrid = Array(rows)
    .fill(null)
    .map(() => Array(cols).fill(1));
  mazeBuilderGrid[0][0] = 0; // Start
  mazeBuilderGrid[rows - 1][cols - 1] = 0; // Ziel
}

function renderMazeBuilder() {
  mazeBuilderGridEl.innerHTML = '';
  mazeBuilderGridEl.style.gridTemplateRows = `repeat(${mazeBuilderRows}, 1fr)`;
  mazeBuilderGridEl.style.gridTemplateColumns = `repeat(${mazeBuilderCols}, 1fr)`;

  const cellSize = getCellSize();

  for (let r = 0; r < mazeBuilderRows; r++) {
    for (let c = 0; c < mazeBuilderCols; c++) {
      const cell = document.createElement('div');
      cell.style.width = cellSize + 'px';
      cell.style.height = cellSize + 'px';
      cell.classList.add('cell');
      if (mazeBuilderGrid[r][c] === 1) cell.classList.add('wall');
      if (r === 0 && c === 0) cell.classList.add('start');
      if (r === mazeBuilderRows - 1 && c === mazeBuilderCols - 1) cell.classList.add('end');

      if (!((r === 0 && c === 0) || (r === mazeBuilderRows - 1 && c === mazeBuilderCols - 1))) {
        cell.style.cursor = 'pointer';
        cell.addEventListener('click', () => {
          mazeBuilderGrid[r][c] = mazeBuilderGrid[r][c] === 1 ? 0 : 1;
          renderMazeBuilder();
        });
      }
      mazeBuilderGridEl.appendChild(cell);
    }
  }
}

function startCustomMazeGame() {
  if (!customMaze) {
    alert('Bitte erst das Labyrinth im Maze-Baumeister erstellen.');
    return;
  }
  inGame = true;
  playerPos = { row: 0, col: 0 };
  maze = JSON.parse(JSON.stringify(customMaze));
  rows = maze.length;
  cols = maze[0].length;
  renderMaze();
  updatePoints();
  showScreen('game');
}

// --- Event-Listener & Initialisierung ---

// Gerätetyp aus Auswahl lesen
function updateDeviceType() {
  const sel = document.getElementById('deviceSelect');
  deviceType = sel.value;
}

// Steuerung: Pfeiltasten
window.addEventListener('keydown', e => {
  if (!inGame) return;
  if (gameState !== 'game') return;

  switch (e.key) {
    case 'ArrowUp':
    case 'w':
      movePlayer(-1, 0);
      break;
    case 'ArrowDown':
    case 's':
      movePlayer(1, 0);
      break;
    case 'ArrowLeft':
    case 'a':
      movePlayer(0, -1);
      break;
    case 'ArrowRight':
    case 'd':
      movePlayer(0, 1);
      break;
  }
});

// Menü-Buttons
document.getElementById('btnStartGame').addEventListener('click', () => {
  updateDeviceType();
  points = 0;
  customMaze = null; // Standard: zufällig
  rows = 10;
  cols = 10;
  inGame = true;
  startNewMaze();
  updatePoints();
  showScreen('game');
});

document.getElementById('btnShowStats').addEventListener('click', () => {
  showScreen('stats');
});

document.getElementById('btnBackFromGame').addEventListener('click', () => {
  inGame = false;
  showScreen('menu');
});

document.getElementById('btnBackFromStats').addEventListener('click', () => {
  showScreen('menu');
});

document.getElementById('btnMazeBuilder').addEventListener('click', () => {
  updateDeviceType();
  points = 0;
  inGame = false;
  createMazeBuilderGrid(mazeBuilderRows, mazeBuilderCols);
  renderMazeBuilder();
  showScreen('builder');
});

document.getElementById('mazeBuilderStart').addEventListener('click', () => {
  customMaze = JSON.parse(JSON.stringify(mazeBuilderGrid));
  startCustomMazeGame();
});

document.getElementById('btnBackFromBuilder').addEventListener('click', () => {
  showScreen('menu');
});

// Beim Laden
window.addEventListener('load', () => {
  showScreen('menu');
  updateDeviceType();
});
