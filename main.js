// === Labyrinth Tycoon - main.js ===

// --- DOM Elemente ---
const screens = {
  menu: document.getElementById("menu"),
  game: document.getElementById("game"),
  stats: document.getElementById("stats"),
  builder: document.getElementById("builder"),
};

const mazeContainer = document.getElementById("mazeContainer");
const builderContainer = document.getElementById("builderContainer");
const scoreDisplay = document.getElementById("scoreDisplay");
const deviceSelect = document.getElementById("deviceSelect");

// --- Variablen ---
let maze = [];
let mazeSize = 5; // Startgröße
let player = { x: 0, y: 0 };
let endPos = { x: 0, y: 0 };
let score = 0;
let solved = 0;
let bonusFails = 0;
let moveCount = 0;
let device = "PC";

let builderMode = false;
let builderData = [];
let builderStart = null;
let builderEnd = null;

// --- Helfer-Funktionen ---
function showScreen(name) {
  Object.values(screens).forEach(s => s.classList.add("hidden"));
  screens[name].classList.remove("hidden");
}

function saveData() {
  localStorage.setItem("labyrinthTycoonData", JSON.stringify({
    score, solved, bonusFails, moveCount, device, mazeSize
  }));
}

function loadData() {
  const data = localStorage.getItem("labyrinthTycoonData");
  if (data) {
    const obj = JSON.parse(data);
    score = obj.score || 0;
    solved = obj.solved || 0;
    bonusFails = obj.bonusFails || 0;
    moveCount = obj.moveCount || 0;
    device = obj.device || "PC";
    mazeSize = obj.mazeSize || 5;
    deviceSelect.value = device;
  }
  updateScore();
}

function updateScore() {
  scoreDisplay.textContent = score;
}

function isInside(x, y) {
  return x >= 0 && y >= 0 && x < mazeSize && y < mazeSize;
}

// --- Maze-Generierung (Random DFS) ---
function generateMaze(size) {
  mazeSize = size;
  maze = Array.from({ length: size }, () => Array(size).fill(1)); // 1 = Wand, 0 = Weg

  // Start und Ende zufällig (Start links oben, Ende rechts unten)
  player = { x: 0, y: 0 };
  maze[0][0] = 0;
  endPos = { x: size - 1, y: size - 1 };
  maze[endPos.y][endPos.x] = 0;

  // DFS Stack
  const stack = [];
  stack.push({ x: 0, y: 0 });

  while (stack.length) {
    const current = stack[stack.length - 1];
    const neighbors = [];

    // Nachbarn 2 Schritte weg prüfen (N, S, O, W)
    const directions = [
      { x: 0, y: -2 },
      { x: 2, y: 0 },
      { x: 0, y: 2 },
      { x: -2, y: 0 },
    ];

    for (const dir of directions) {
      const nx = current.x + dir.x;
      const ny = current.y + dir.y;
      if (isInside(nx, ny) && maze[ny][nx] === 1) {
        neighbors.push({ x: nx, y: ny, betweenX: current.x + dir.x / 2, betweenY: current.y + dir.y / 2 });
      }
    }

    if (neighbors.length) {
      const chosen = neighbors[Math.floor(Math.random() * neighbors.length)];
      maze[chosen.y][chosen.x] = 0;
      maze[chosen.betweenY][chosen.betweenX] = 0;
      stack.push({ x: chosen.x, y: chosen.y });
    } else {
      stack.pop();
    }
  }
}

// --- Maze rendern ---
function renderMaze() {
  mazeContainer.style.gridTemplateColumns = `repeat(${mazeSize}, 1fr)`;
  mazeContainer.innerHTML = "";

  for (let y = 0; y < mazeSize; y++) {
    for (let x = 0; x < mazeSize; x++) {
      const cell = document.createElement("div");
      cell.classList.add("cell");
      if (maze[y][x] === 1) cell.classList.add("wall");
      if (player.x === x && player.y === y) cell.classList.add("player");
      if (endPos.x === x && endPos.y === y) cell.classList.add("end");
      mazeContainer.appendChild(cell);
    }
  }
}

// --- Spieler bewegen ---
function movePlayer(dx, dy) {
  const nx = player.x + dx;
  const ny = player.y + dy;
  if (isInside(nx, ny) && maze[ny][nx] === 0) {
    player.x = nx;
    player.y = ny;
    moveCount++;
    renderMaze();
    checkWin();
  }
}

function checkWin() {
  if (player.x === endPos.x && player.y === endPos.y) {
    score++;
    solved++;
    updateScore();
    saveData();
    alert("Du hast das Labyrinth geschafft!");
    adjustMazeSize();
    startGame();
  }
}

// --- Größe anpassen bei Meilensteinen ---
function adjustMazeSize() {
  const milestones = [10, 50, 150, 500, 1000];
  for (let i = milestones.length - 1; i >= 0; i--) {
    if (score >= milestones[i]) {
      mazeSize = 5 + i * 5;
      break;
    }
  }
}

// --- Spiel starten ---
function startGame() {
  builderMode = false;
  generateMaze(mazeSize);
  player = { x: 0, y: 0 };
  moveCount = 0;
  showScreen("game");
  renderMaze();
  updateScore();
}

// --- Touch Steuerung ---
let touchStartX = null, touchStartY = null;

document.addEventListener("touchstart", (e) => {
  if (!screens.game.classList.contains("hidden")) {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
  }
});

document.addEventListener("touchend", (e) => {
  if (!screens.game.classList.contains("hidden")) {
    const dx = e.changedTouches[0].clientX - touchStartX;
    const dy = e.changedTouches[0].clientY - touchStartY;
    if (Math.abs(dx) > Math.abs(dy)) {
      movePlayer(dx > 0 ? 1 : -1, 0);
    } else {
      movePlayer(0, dy > 0 ? 1 : -1);
    }
  }
});

// --- Tastatursteuerung ---
document.addEventListener("keydown", (e) => {
  if (!screens.game.classList.contains("hidden") && device === "PC") {
    switch (e.key) {
      case "ArrowUp": movePlayer(0, -1); break;
      case "ArrowDown": movePlayer(0, 1); break;
      case "ArrowLeft": movePlayer(-1, 0);break;
      case "ArrowRight": movePlayer(1, 0); break;
    }
  }
});

// --- Statistiken anzeigen ---
function showStats() {
  document.getElementById("statScore").textContent = score;
  document.getElementById("statSolved").textContent = solved;
  document.getElementById("statFails").textContent = bonusFails;
  document.getElementById("statMoves").textContent = moveCount;
  document.getElementById("statDevice").textContent = device;
  showScreen("stats");
}

// --- Gerät ändern ---
deviceSelect.addEventListener("change", () => {
  device = deviceSelect.value;
  saveData();
});

// --- Buttons Events ---
document.getElementById("startGameBtn").addEventListener("click", () => {
  adjustMazeSize();
  startGame();
});

document.getElementById("backToMenu").addEventListener("click", () => {
  showScreen("menu");
  saveData();
});

document.getElementById("statsBtn").addEventListener("click", () => {
  showStats();
});

document.getElementById("backFromStats").addEventListener("click", () => {
  showScreen("menu");
});

document.getElementById("startBuilderBtn").addEventListener("click", () => {
  builderMode = true;
  mazeSize = 5;
  builderData = Array.from({ length: mazeSize }, () => Array(mazeSize).fill(1));
  builderStart = { x: 0, y: 0 };
  builderEnd = { x: mazeSize - 1, y: mazeSize - 1 };
  renderBuilder();
  showScreen("builder");
});

document.getElementById("backFromBuilder").addEventListener("click", () => {
  showScreen("menu");
});

document.getElementById("startBuilderGame").addEventListener("click", () => {
  // Übernehme gebautes Maze ins Spiel
  maze = builderData.map(row => row.slice());
  mazeSize = maze.length;
  player = { ...builderStart };
  endPos = { ...builderEnd };
  score = 0;
  solved = 0;
  moveCount = 0;
  bonusFails = 0;
  updateScore();
  showScreen("game");
  renderMaze();
  saveData();
});

// --- Maze-Baumeister rendern ---
function renderBuilder() {
  builderContainer.style.gridTemplateColumns = `repeat(${mazeSize}, 1fr)`;
  builderContainer.innerHTML = "";

  for (let y = 0; y < mazeSize; y++) {
    for (let x = 0; x < mazeSize; x++) {
      const cell = document.createElement("div");
      cell.classList.add("cell");
      if (builderData[y][x] === 1) cell.classList.add("wall");
      if (builderStart.x === x && builderStart.y === y) cell.textContent = "S";
      else if (builderEnd.x === x && builderEnd.y === y) cell.textContent = "E";
      cell.style.userSelect = "none";
      cell.addEventListener("click", () => {
        if (x === builderStart.x && y === builderStart.y) return; // Start bleibt Start
        if (x === builderEnd.x && y === builderEnd.y) return;     // Ende bleibt Ende
        builderData[y][x] = builderData[y][x] === 1 ? 0 : 1;
        renderBuilder();
      });
      builderContainer.appendChild(cell);
    }
  }
}

// --- Initialisierung ---
loadData();
showScreen("menu");
