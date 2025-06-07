// --- Variablen ---
let maze = [];
let mazeSize = 5;
let player = { x: 0, y: 0 };
let endPos = { x: mazeSize - 1, y: mazeSize - 1 };
let score = 0;
let solved = 0;
let bonusFails = 0;
let moveCount = 0;
let device = "auto";
let builderMode = false;
let builderData = [];
let builderStart = { x: 0, y: 0 };
let builderEnd = { x: 4, y: 4 };

const menuScreen = document.getElementById("menu");
const gameScreen = document.getElementById("game");
const statsScreen = document.getElementById("stats");
const builderScreen = document.getElementById("builder");

const mazeContainer = document.getElementById("mazeContainer");
const builderContainer = document.getElementById("builderContainer");

const scoreDisplay = document.getElementById("scoreDisplay");
const deviceSelect = document.getElementById("deviceSelect");
const accountInput = document.getElementById("accountCode");

// --- Hilfsfunktionen ---
function showScreen(name) {
  menuScreen.classList.add("hidden");
  gameScreen.classList.add("hidden");
  statsScreen.classList.add("hidden");
  builderScreen.classList.add("hidden");

  if (name === "menu") menuScreen.classList.remove("hidden");
  else if (name === "game") gameScreen.classList.remove("hidden");
  else if (name === "stats") statsScreen.classList.remove("hidden");
  else if (name === "builder") builderScreen.classList.remove("hidden");
}

function saveData() {
  const code = accountInput.value.trim();
  if (!code) return;
  const data = {
    maze,
    mazeSize,
    player,
    endPos,
    score,
    solved,
    bonusFails,
    moveCount,
    device,
  };
  localStorage.setItem("labyrinthTycoon_" + code, JSON.stringify(data));
}

function loadData() {
  const code = accountInput.value.trim();
  if (!code) return false;
  const dataStr = localStorage.getItem("labyrinthTycoon_" + code);
  if (!dataStr) return false;
  try {
    const data = JSON.parse(dataStr);
    maze = data.maze;
    mazeSize = data.mazeSize;
    player = data.player;
    endPos = data.endPos;
    score = data.score;
    solved = data.solved;
    bonusFails = data.bonusFails;
    moveCount = data.moveCount;
    device = data.device;
    deviceSelect.value = device;
    updateScore();
    if (maze && maze.length) {
      renderMaze();
    }
    return true;
  } catch {
    return false;
  }
}

function updateScore() {
  scoreDisplay.textContent = "Punkte: " + score;
}

// --- Maze Generierung (Random, immer lösbar) ---
function generateMaze(size) {
  // Einfacher Algorithmus: Alle Zellen 0, dann zufällige Wände (1) setzen, Start und Ende frei
  // Um Lösbarkeit zu garantieren: Start-Ende verbunden mit einem Pfad

  // Initial alles 1 (Wand)
  maze = Array.from({ length: size }, () => Array(size).fill(1));

  // Pfad von Start zu Ende "graben"
  let x = 0, y = 0;
  maze[y][x] = 0;
  while (x < size - 1 || y < size - 1) {
    if (x < size - 1 && y < size - 1) {
      if (Math.random() < 0.5) x++; else y++;
    } else if (x < size - 1) {
      x++;
    } else {
      y++;
    }
    maze[y][x] = 0;
  }

  // Weitere zufällige freie Zellen hinzufügen, ca 40%
  for (let i = 0; i < size * size * 0.4; i++) {
    let rx = Math.floor(Math.random() * size);
    let ry = Math.floor(Math.random() * size);
    maze[ry][rx] = 0;
  }

  return maze;
}

// --- Maze Darstellung ---
function renderMaze() {
  mazeContainer.innerHTML = "";
  mazeContainer.style.gridTemplateColumns = `repeat(${mazeSize}, 1fr)`;

  // Größere Zellen bei kleinen Geräten
  let cellSize = 30;
  if (device === "mobile") cellSize = 40;
  else if (device === "desktop") cellSize = 30;
  else {
    // auto
    if (window.innerWidth < 600) cellSize = 40;
    else if (window.innerWidth < 900) cellSize = 35;
    else cellSize = 30;
  }

  mazeContainer.style.width = `${cellSize * mazeSize}px`;
  mazeContainer.style.height = `${cellSize * mazeSize}px`;

  for (let y = 0; y < mazeSize; y++) {
    for (let x = 0; x < mazeSize; x++) {
      const cell = document.createElement("div");
      cell.classList.add("cell");
      if (maze[y][x] === 1) cell.classList.add("wall");
      if (player.x === x && player.y === y) cell.classList.add("player");
      if (endPos.x === x && endPos.y === y) cell.classList.add("end");
      cell.style.width = `${cellSize}px`;
      cell.style.height = `${cellSize}px`;
      mazeContainer.appendChild(cell);
    }
  }
}

// --- Bewegung ---
function movePlayer(dx, dy) {
  const nx = player.x + dx;
  const ny = player.y + dy;
  if (maze[ny][nx] === 1) return; // Wand

  player.x = nx;
  player.y = ny;
  moveCount++;
  updateScore();

  if (player.x === endPos.x && player.y === endPos.y) {
    solved++;
    score += 10; // Punkte fürs Lösen
    alert("Glückwunsch! Labyrinth gelöst.");
    generateNewMaze();
  } else {
    renderMaze();
  }
}

// --- Neues Maze starten ---
function generateNewMaze() {
  mazeSize = 5 + Math.min(solved, 10); // Maze wird max bis 15x15 größer
  maze = generateMaze(mazeSize);
  player = { x: 0, y: 0 };
  endPos = { x: mazeSize - 1, y: mazeSize - 1 };
  moveCount = 0;
  renderMaze();
  updateScore();
}

// --- Steuerung ---
function setupControls() {
  window.addEventListener("keydown", e => {
    if (gameScreen.classList.contains("hidden")) return;
    switch (e.key) {
      case "ArrowUp":
      case "w":
      case "W":
        movePlayer(0, -1);
        break;
      case "ArrowDown":
      case "s":
      case "S":
        movePlayer(0, 1);
        break;
      case "ArrowLeft":
      case "a":
      case "A":
        movePlayer(-1, 0);
        break;
      case "ArrowRight":
      case "d":
      case "D":
        movePlayer(1, 0);
        break;
    }
  });
}

// --- Statistiken anzeigen ---
function showStats() {
  document.getElementById("statScore").textContent = score;
  document.getElementById("statSolved").textContent = solved;
  document.getElementById("statFails").textContent = bonusFails;
  document.getElementById("statMoves").textContent = moveCount;
  document.getElementById("statDevice").textContent = device.charAt(0).toUpperCase() + device.slice(1);
  showScreen("stats");
}

// --- Maze-Baumeister ---
// Erstellt ein editierbares Gitter für den User
function renderBuilder() {
  builderContainer.innerHTML = "";
  builderContainer.style.gridTemplateColumns = `repeat(${mazeSize}, 1fr)`;
  const size = mazeSize;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const cell = document.createElement("div");
      cell.classList.add("cell");
      cell.style.width = "30px";
      cell.style.height = "30px";
      cell.style.userSelect = "none";

      // Wand oder leer
      if (builderData[y] && builderData[y][x] === 1) cell.classList.add("wall");

      // Start und Ende markieren
      if (builderStart.x === x && builderStart.y === y) cell.textContent = "S";
      else if (builderEnd.x === x && builderEnd.y === y) cell.textContent = "E";
      else cell.textContent = "";

      cell.addEventListener("click", () => {
        if (builderStart.x === x && builderStart.y === y) return;
        if (builderEnd.x === x && builderEnd.y === y) return;

        builderData[y][x] = builderData[y][x] === 1 ? 0 : 1;
        renderBuilder();
      });
      builderContainer.appendChild(cell);
    }
  }
}

// --- Builder initialisieren ---
function initBuilder() {
  mazeSize = 5;
  builderData = generateMaze(mazeSize).map(row => row.slice());
  builderStart = { x: 0, y: 0 };
  builderEnd = { x: mazeSize - 1, y: mazeSize - 1 };
  renderBuilder();
}

// --- Maze mit Builder-Daten starten ---
function startBuilderGame() {
  maze = builderData.map(row => row.slice());
  mazeSize = maze.length;
  player = { x: builderStart.x, y: builderStart.y };
  endPos = { x: builderEnd.x, y: builderEnd.y };
  moveCount = 0;
  solved = 0;
  score = 0;
  updateScore();
  renderMaze();
  showScreen("game");
}

// --- Gerät ändern ---
function changeDevice() {
  device = deviceSelect.value;
  if (device === "auto") {
    // Automatisch bleibt so, keine Aktion nötig
  }
  if (!gameScreen.classList.contains("hidden")) renderMaze();
}

// --- Event Listener Setup ---
function setupListeners() {
  document.getElementById("startGameBtn").addEventListener("click", () => {
    generateNewMaze();
    showScreen("game");
  });

  document.getElementById("statsBtn").addEventListener("click", showStats);
  document.getElementById("backFromStats").addEventListener("click", () => showScreen("menu"));

  document.getElementById("backToMenu").addEventListener("click", () => {
    saveData();
    showScreen("menu");
  });

  document.getElementById("startBuilderBtn").addEventListener("click", () => {
    initBuilder();
    showScreen("builder");
  });

  document.getElementById("backFromBuilder").addEventListener("click", () => showScreen("menu"));

  document.getElementById("startBuilderGame").addEventListener("click", () => {
    startBuilderGame();
  });

  deviceSelect.addEventListener("change", changeDevice);

  document.getElementById("loadAccountBtn").addEventListener("click", () => {
    if (loadData()) alert("Account geladen!");
    else alert("Kein Account gefunden.");
  });
}

// --- Initialisierung ---
function init() {
  setupListeners();
  setupControls();
  showScreen("menu");
  changeDevice();
  updateScore();
}

init();
