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

// --- Initial Setup ---

deviceSelect.addEventListener('change', () => {
  deviceType = deviceSelect.value;
  if (deviceType === 'auto') detectDevice();
  if (gameActive) renderMaze(); // neu rendern bei Gerätewechsel
});

function detectDevice() {
  if (/Mobi|Android/i.test(navigator.userAgent)) deviceType = 'mobile';
  else deviceType = 'desktop';
  deviceSelect.value = deviceType;
}

// --- Maze-Generierung ---

function generateMaze(size) {
  // Einfaches zufälliges Labyrinth mit Start und End-Punkt
  // 0 = leer, 1 = Wand

  // Für Einfachheit: alle Wände außen, innen 70% leer, 30% Wand

  const m = [];
  for (let y = 0; y < size; y++) {
    m[y] = [];
    for (let x = 0; x < size; x++) {
      if (y === 0 || x === 0 || y === size - 1 || x === size - 1) m[y][x] = 1;
      else m[y][x] = Math.random() < 0.3 ? 1 : 0;
    }
  }

  // Start und Ende frei
  m[0][0] = 0;
  m[size - 1][size - 1] = 0;

  return m;
}

// --- Rendering ---

function renderMaze() {
  mazeContainer.innerHTML = '';

  // Größe des Grids anpassen (max 60vh, max 90vw)
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

  if (newX < 0 || newX >= mazeSize || newY < 0 || newY >= mazeSize) return; // Außenbereich

  if (maze[newY][newX] === 1) return; // Wand

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

    // Meilenstein: Labyrinth vergrößern
    if ([10, 50, 150, 500, 1000].includes(points)) {
      mazeSize = Math.min(mazeSize + 2, 25);
    }

    // Neues Labyrinth generieren
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

// Bonus-Modi

const bonusEffects = [
  'normal',
  'reverse',
  'blur',
  'showMaze',
  'black',
];

// Bonus-Zustand wechseln alle 5s, wenn Bonusmode aktiv

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

  if (effect === 'normal') {
    mazeContainer.style.filter = 'none';
  } else if (effect === 'reverse') {
    // Umkehrung der Steuerung wird in movePlayer berücksichtigt
    // Hier optisch keine Änderung nötig
    mazeContainer.style.border = '2px solid yellow';
  } else if (effect === 'blur') {
    mazeContainer.style.filter = 'blur(3px)';
  } else if (effect === 'showMaze') {
    // Spieler nicht sichtbar, nur Labyrinth
    mazeContainer.style.filter = 'grayscale(100%)';
  } else if (effect === 'black') {
    mazeContainer.style.backgroundColor = 'black';
  }
}

// Variable um zu erkennen, ob aktuell Steuerung invertiert ist
function isReverseControl() {
  return bonusEffects[bonusState] === 'reverse';
}

// --- Tastatursteuerung ---

window.addEventListener('keydown', (e) => {
  if (!gameActive) return;

  let dx = 0,
    dy = 0;

  const reverse = isReverseControl();

  switch (e.key) {
    case 'ArrowUp':
    case 'w':
    case 'W':
      dy = reverse ? 1 : -1;
      break;
    case 'ArrowDown':
    case 's':
    case 'S':
      dy = reverse ? -1 : 1;
      break;
    case 'ArrowLeft':
    case 'a':
    case 'A':
      dx = reverse ? 1 : -1;
      break;
    case 'ArrowRight':
    case 'd':
    case 'D':
      dx = reverse ? -1 : 1;
      break;
  }
  if (dx !== 0 || dy !== 0) {
    e.preventDefault();
    movePlayer(dx, dy);
  }
});

// --- Touchsteuerung (Swipe) ---

let touchStartX = 0;
let touchStartY = 0;

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

  if (absDx < 20 && absDy < 20) return; // Zu kurze Swipe

  const reverse = isReverseControl();

  if (absDx > absDy) {
    // horizontal
    if (dx > 0) movePlayer(reverse ? -1 : 1, 0);
    else movePlayer(reverse ? 1 : -1, 0);
  } else {
    // vertikal
    if (dy > 0) movePlayer(0, reverse ? -1 : 1);
    else movePlayer(0, reverse ? 1 : -1);
  }
});

// --- Menüsteuerung ---

btnStartGame.addEventListener('click', () => {
  startGame();
});

btnBackFromGame.addEventListener('click', () => {
  endGame();
});

btnShowStats.addEventListener('click', () => {
  showStats();
});

btnBackFromStats.addEventListener('click', () => {
  showMenu();
});

btnMazeBuilder.addEventListener('click', () => {
  showBuilder();
});

btnBackFromBuilder.addEventListener('click', () => {
  showMenu();
});

// --- Spiele starten/beenden ---

function startGame() {
  points = 0;
  totalMazesCompleted = 0;
  mazeSize = 5;
  gameActive = true;
  bonusMode = false;
  stopBonusInterval();

  updatePointsDisplay();

  showSection('gameScreen');
  generateAndStartMaze();
}

function endGame() {
  gameActive = false;
  bonusMode = false;
  stopBonusInterval();
  showMenu();
}

// --- Anzeige wechseln ---

function showSection(id) {
  menuScreen.style.display = id === 'menuScreen' ? 'block' : 'none';
  gameScreen.style.display = id === 'gameScreen' ? 'block' : 'none';
  statsScreen.style.display = id === 'statsScreen' ? 'block' : 'none';
  builderScreen.style.display = id === 'builderScreen' ? 'block' : 'none';
}

// --- Statistik anzeigen ---

function showStats() {
  updateStats();
  showSection('statsScreen');
}

function updateStats() {
  statsScreenContent.innerHTML = `
    <strong>Aktuelle Punkte:</strong> ${points} <br />
    <strong>Größe des Labyrinths:</strong> ${mazeSize} x ${mazeSize} <br />
    <strong>Gesamt absolvierte Labyrinthe:</strong> ${totalMazesCompleted} <br />
    <strong>Gerätetyp:</strong> ${deviceType} <br />
  `;
}

// --- Menu anzeigen ---

function showMenu() {
  showSection('menuScreen');
}

// --- Initial ---

detectDevice();
showMenu();
