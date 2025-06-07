// --- Globale Variablen ---

let maze = [];
let mazeSize = 5;
let playerPos = { x: 0, y: 0 };
let endPos = { x: mazeSize - 1, y: mazeSize - 1 };
let points = 0;
let totalMazesCompleted = 0;
let deviceType = 'auto'; // "desktop" oder "mobile" oder "auto"
let gameActive = false;
let bonusMode = false;
let bonusInterval = null;
let bonusState = 0; // für Bonuswechsel

// Maze Builder
let builderMaze = [];
let builderSize = 5;
let builderSelectedCellType = 0; // 0 = leer, 1 = Wand, 2 = Start, 3 = Ende

// UI-Elemente
const menuScreen = document.getElementById('menuScreen');
const gameScreen = document.getElementById('gameScreen');
const statsScreen = document.getElementById('statsScreen');
const builderScreen = document.getElementById('builderScreen');

const mazeContainer = document.getElementById('mazeContainer');
const pointsDisplay = document.getElementById('pointsDisplay');
const deviceSelect = document.getElementById('deviceSelect');

const btnStartGame = document.getElementById('btnStartGame');
const btnMazeBuilder = document.getElementById('btnMazeBuilder');
const btnShowStats = document.getElementById('btnShowStats');

const btnBackFromGame = document.getElementById('btnBackFromGame');
const btnBackFromStats = document.getElementById('btnBackFromStats');
const btnBackFromBuilder = document.getElementById('btnBackFromBuilder');

const statsScreenContent = statsScreen.querySelector('p');

const builderGrid = document.getElementById('builderGrid');
const btnBuilderClear = document.getElementById('btnBuilderClear');
const btnBuilderSave = document.getElementById('btnBuilderSave');
const btnBuilderLoad = document.getElementById('btnBuilderLoad');
const builderCellTypes = document.querySelectorAll('.builderCellType');

// --- Initial Setup ---

deviceSelect.addEventListener('change', () => {
  deviceType = deviceSelect.value;
  if (deviceType === 'auto') detectDevice();
  if (gameActive) renderMaze();
});

function detectDevice() {
  if (/Mobi|Android/i.test(navigator.userAgent)) deviceType = 'mobile';
  else deviceType = 'desktop';
  deviceSelect.value = deviceType;
}

// --- Maze-Generierung ---

function generateMaze(size) {
  // Einfaches zufälliges Labyrinth mit Start und End-Punkt
  const m = [];
  for (let y = 0; y < size; y++) {
    m[y] = [];
    for (let x = 0; x < size; x++) {
      if (y === 0 || x === 0 || y === size - 1 || x === size - 1) m[y][x] = 1;
      else m[y][x] = Math.random() < 0.3 ? 1 : 0;
    }
  }
  m[0][0] = 0; 
  m[size - 1][size - 1] = 0;
  return m;
}

// --- Rendering ---

function renderMaze() {
  mazeContainer.innerHTML = '';

  const maxHeight = window.innerHeight * 0.6;
  const maxWidth = window.innerWidth * 0.9;

  const cellSizeH = Math.floor(maxHeight / mazeSize);
  const cellSizeW = Math.floor(maxWidth / mazeSize);
  const cellSize = Math.min(cellSizeH, cellSizeW);

  mazeContainer.style.gridTemplateRows = `repeat(${mazeSize}, ${cellSize}px)`;
  mazeContainer.style.gridTemplateColumns = `repeat(${mazeSize}, ${cellSize}px)`;

  for (let y = 0; y < mazeSize; y++) {
    for (let x = 0; x < mazeSize; x++) {
      const cell = document.createElement('div');
      cell.classList.add('cell');
      if (maze[y][x] === 1) cell.classList.add('wall');
      if (playerPos.x === x && playerPos.y === y) cell.classList.add('player');
      if (endPos.x === x && endPos.y === y) cell.classList.add('end');
      mazeContainer.appendChild(cell);
    }
  }
}

// --- Spieler bewegen ---

function movePlayer(dx, dy) {
  if (!gameActive) return;
  let newX = playerPos.x + dx;
  let newY = playerPos.y + dy;

  if (newX < 0 || newX >= mazeSize || newY < 0 || newY >= mazeSize) return;
  if (maze[newY][newX] === 1) return;

  playerPos.x = newX;
  playerPos.y = newY;

  renderMaze();
  checkWin();
}

// --- Gewinnprüfung ---

function checkWin() {
  if (playerPos.x === endPos.x && playerPos.y === endPos.y) {
    points++;
    totalMazesCompleted++;
    updatePointsDisplay();

    if ([10, 50, 150, 500, 1000].includes(points)) {
      mazeSize = Math.min(mazeSize + 2, 25);
    }

    generateAndStartMaze();
  }
}

// --- Punkteanzeige ---

function updatePointsDisplay() {
  pointsDisplay.textContent = `Punkte: ${points}`;
}

// --- Neues Labyrinth starten ---

function generateAndStartMaze() {
  maze = generateMaze(mazeSize);
  playerPos = { x: 0, y: 0 };
  endPos = { x: mazeSize - 1, y: mazeSize - 1 };
  renderMaze();
}

// --- Steuerung ---

const bonusEffects = ['normal', 'reverse', 'blur', 'showMaze', 'black'];

function startBonusInterval() {
  if (bonusInterval) clearInterval(bonusInterval);
  bonusInterval = setInterval(() => {
    bonusState = (bonusState + 1) % bonusEffects.length;
    applyBonusEffect();
  }, 5000);
}

function stopBonusInterval() {
  if (bonusInterval) clearInterval(bonusInterval);
  bonusState = 0;
  applyBonusEffect();
}

function applyBonusEffect() {
  const effect = bonusEffects[bonusState];
  mazeContainer.style.filter = '';
  mazeContainer.style.backgroundColor = '';
  mazeContainer.style.border = '';

  if (effect === 'normal') {
    mazeContainer.style.filter = 'none';
  } else if (effect === 'reverse') {
    mazeContainer.style.border = '2px solid yellow';
  } else if (effect === 'blur') {
    mazeContainer.style.filter = 'blur(3px)';
  } else if (effect === 'showMaze') {
    mazeContainer.style.filter = 'grayscale(100%)';
  } else if (effect === 'black') {
    mazeContainer.style.backgroundColor = 'black';
  }
}

function isReverseControl() {
  return bonusEffects[bonusState] === 'reverse';
}

// Tastatur-Steuerung

window.addEventListener('keydown', (e) => {
  if (!gameActive) return;

  let dx = 0, dy = 0;
  const reverse = isReverseControl();

  switch (e.key) {
    case 'ArrowUp': case 'w': case 'W': dy = reverse ? 1 : -1; break;
    case 'ArrowDown': case 's': case 'S': dy = reverse ? -1 : 1; break;
    case 'ArrowLeft': case 'a': case 'A': dx = reverse ? 1 : -1; break;
    case 'ArrowRight': case 'd': case 'D': dx = reverse ? -1 : 1; break;
  }
  if (dx !== 0 || dy !== 0) {
    e.preventDefault();
    movePlayer(dx, dy);
  }
});

// Touchsteuerung (Swipe)

let touchStartX = 0, touchStartY = 0;

mazeContainer.addEventListener('touchstart', (e) => {
  if (!gameActive) return;
  const touch = e.changedTouches[0];
  touchStartX = touch.clientX;
  touchStartY = touch.clientY;
});

mazeContainer.addEventListener('touchend', (e) => {
  if (!gameActive) return;
  const touch = e.changedTouches[0];
  const dx = touch.clientX - touchStartX;
  const dy = touch.clientY - touchStartY;
  const absDx = Math.abs(dx);
  const absDy = Math.abs(dy);
  if (absDx < 20 && absDy < 20) return;

  const reverse = isReverseControl();

  if (absDx > absDy) {
    if (dx > 0) movePlayer(reverse ? -1 : 1, 0);
movePlayer(0, reverse ? -1 : 1);
    else movePlayer(0, reverse ? 1 : -1);
  }
});

// --- Menü Navigation ---

function showScreen(screen) {
  menuScreen.style.display = 'none';
  gameScreen.style.display = 'none';
  statsScreen.style.display = 'none';
  builderScreen.style.display = 'none';

  screen.style.display = 'block';
}

// --- Buttons ---

btnStartGame.addEventListener('click', () => {
  points = 0;
  mazeSize = 5;
  totalMazesCompleted = 0;
  gameActive = true;
  generateAndStartMaze();
  updatePointsDisplay();
  showScreen(gameScreen);
  startBonusInterval();
});

btnBackFromGame.addEventListener('click', () => {
  gameActive = false;
  stopBonusInterval();
  showScreen(menuScreen);
});

btnShowStats.addEventListener('click', () => {
  updateStats();
  showScreen(statsScreen);
});

btnBackFromStats.addEventListener('click', () => {
  showScreen(menuScreen);
});

btnMazeBuilder.addEventListener('click', () => {
  initBuilder();
  showScreen(builderScreen);
});

btnBackFromBuilder.addEventListener('click', () => {
  showScreen(menuScreen);
});

// --- Punkte & Statistiken ---

function updateStats() {
  statsScreenContent.innerHTML = `
    Gesamtpunkte: ${points}<br>
    Labyrinthe geschafft: ${totalMazesCompleted}<br>
    Aktuelle Labyrinthgröße: ${mazeSize} x ${mazeSize}<br>
    Gerätetyp: ${deviceType}
  `;
}

// --- Maze Builder Funktionen ---

function initBuilder() {
  builderSize = 5;
  builderMaze = [];
  for (let y = 0; y < builderSize; y++) {
    builderMaze[y] = [];
    for (let x = 0; x < builderSize; x++) {
      builderMaze[y][x] = 0;
    }
  }
  renderBuilderGrid();
}

function renderBuilderGrid() {
  builderGrid.innerHTML = '';
  builderGrid.style.gridTemplateRows = `repeat(${builderSize}, 40px)`;
  builderGrid.style.gridTemplateColumns = `repeat(${builderSize}, 40px)`;

  for (let y = 0; y < builderSize; y++) {
    for (let x = 0; x < builderSize; x++) {
      const cell = document.createElement('div');
      cell.classList.add('builderCell');
      switch (builderMaze[y][x]) {
        case 0: cell.style.background = 'white'; break;
        case 1: cell.style.background = 'black'; break;
        case 2: cell.style.background = 'green'; break; // Start
        case 3: cell.style.background = 'red'; break;   // End
      }
      cell.addEventListener('click', () => {
        builderMaze[y][x] = builderSelectedCellType;
        renderBuilderGrid();
      });
      builderGrid.appendChild(cell);
    }
  }
}

builderCellTypes.forEach(btn => {
  btn.addEventListener('click', () => {
    builderSelectedCellType = parseInt(btn.dataset.type);
    builderCellTypes.forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
  });
});

btnBuilderClear.addEventListener('click', () => {
  initBuilder();
});

btnBuilderSave.addEventListener('click', () => {
  // Einfach als JSON im LocalStorage speichern
  localStorage.setItem('customMaze', JSON.stringify({ maze: builderMaze, size: builderSize }));
  alert('Labyrinth gespeichert!');
});

btnBuilderLoad.addEventListener('click', () => {
  const data = localStorage.getItem('customMaze');
  if (!data) {
    alert('Kein gespeichertes Labyrinth gefunden!');
    return;
  }
  const obj = JSON.parse(data);
  builderMaze = obj.maze;
  builderSize = obj.size;
  renderBuilderGrid();
  alert('Labyrinth geladen!');
});

// --- Labyrinth vom Builder laden ins Spiel ---

function loadCustomMaze() {
  const data = localStorage.getItem('customMaze');
  if (!data) return false;
  const obj = JSON.parse(data);
  mazeSize = obj.size;
  maze = obj.maze;
  playerPos = { x: 0, y: 0 };
  // Suche Endposition (Zelle mit 3)
  for (let y = 0; y < mazeSize; y++) {
    for (let x = 0; x < mazeSize; x++) {
      if (maze[y][x] === 3) {
        endPos = { x, y };
      }
      if (maze[y][x] === 2) {
        playerPos = { x, y };
      }
    }
  }
  return true;
}

// --- Spiel mit Custom Maze starten (erweiterte Funktion) ---

btnStartGame.addEventListener('click', () => {
  points = 0;
  totalMazesCompleted = 0;

  if (!loadCustomMaze()) {
    mazeSize = 5;
    maze = generateMaze(mazeSize);
    playerPos = { x: 0, y: 0 };
    endPos = { x: mazeSize - 1, y: mazeSize - 1 };
  }

  gameActive = true;
  updatePointsDisplay();
  renderMaze();
  showScreen(gameScreen);
  startBonusInterval();
});

// --- Bei Laden Device automatisch erkennen ---
detectDevice();
deviceSelect.value = deviceType;

// --- Initial Screen anzeigen ---
showScreen(menuScreen);
