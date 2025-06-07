let code = "";
let device = "PC";
let player = { x: 0, y: 0 };
let maze = [];
let mazeSize = 5;
let score = 0;
let solved = 0;
let bonusFails = 0;
let moveCount = 0;
let startTime;
let inBonus = false;
let bonusMode = "";
let builderMode = false;
let builderData = [];
let builderStart = null;
let builderEnd = null;

const screens = {
  code: document.getElementById("codeScreen"),
  menu: document.getElementById("mainMenu"),
  game: document.getElementById("gameScreen"),
  stats: document.getElementById("statsScreen"),
  builder: document.getElementById("builderScreen"),
};

function showScreen(name) {
  Object.values(screens).forEach(s => s.classList.add("hidden"));
  screens[name].classList.remove("hidden");
}

function enterCode() {
  const input = document.getElementById("codeInput").value.trim();
  if (!input.match(/^LAB-\w{4}-\w{4}$/)) {
    alert("Ungültiger Codeformat. Beispiel: LAB-1234-ABCD");
    return;
  }
  code = input;
  loadData();
  document.getElementById("codeDisplay").innerText = code;
  showScreen("menu");
}

function loadData() {
  const saved = JSON.parse(localStorage.getItem(code)) || {};
  score = saved.score || 0;
  device = saved.device || "PC";
  solved = saved.solved || 0;
  bonusFails = saved.bonusFails || 0;
  moveCount = saved.moveCount || 0;
}

function saveData() {
  localStorage.setItem(code, JSON.stringify({
    score, device, solved, bonusFails, moveCount
  }));
}

function startGame() {
  mazeSize = getMazeSizeFromScore(score);
  generateMaze(mazeSize);
  renderMaze();
  player.x = 0;
  player.y = 0;
  startTime = Date.now();
  inBonus = isBonusLevel();
  bonusMode = inBonus ? randomBonusMode() : "";
  document.getElementById("bonusInfo").innerText = inBonus ? `BONUS: ${bonusMode}` : "";
  showScreen("game");
}

function getMazeSizeFromScore(score) {
  if (score >= 1000) return 25;
  if (score >= 500) return 20;
  if (score >= 150) return 15;
  if (score >= 50) return 10;
  if (score >= 10) return 7;
  return 5;
}
function generateMaze(size) {
  maze = Array.from({ length: size }, () =>
    Array.from({ length: size }, () => (Math.random() < 0.25 ? 1 : 0))
  );
  maze[0][0] = 0; // Start
  maze[size - 1][size - 1] = 0; // Ziel
}

function renderMaze() {
  const container = document.getElementById("mazeContainer");
  container.innerHTML = "";
  container.style.gridTemplateColumns = `repeat(${mazeSize}, 1fr)`;
  for (let y = 0; y < mazeSize; y++) {
    for (let x = 0; x < mazeSize; x++) {
      const cell = document.createElement("div");
      cell.className = "cell";
      if (maze[y][x] === 1) cell.classList.add("wall");
      if (x === player.x && y === player.y) cell.classList.add("player");
      if (x === mazeSize - 1 && y === mazeSize - 1) cell.classList.add("end");
      container.appendChild(cell);
    }
  }
}

function movePlayer(dx, dy) {
  if (inBonus && bonusMode === "reverse") {
    dx *= -1;
    dy *= -1;
  }

  const nx = player.x + dx;
  const ny = player.y + dy;
  if (
    nx >= 0 && ny >= 0 &&
    nx < mazeSize && ny < mazeSize &&
    maze[ny][nx] === 0
  ) {
    player.x = nx;
    player.y = ny;
    moveCount++;
    renderMaze();
    checkWin();
  }
}

function checkWin() {
  if (player.x === mazeSize - 1 && player.y === mazeSize - 1) {
    const timeTaken = (Date.now() - startTime) / 1000;
    if (inBonus && bonusMode === "invisible" && !visiblePhase) {
      bonusFails++;
    } else {
      score++;
      solved++;
      saveData();
    }
    setTimeout(startGame, 800);
  }
}

function isBonusLevel() {
  return score % 5 === 0 && score !== 0;
}

function randomBonusMode() {
  const modes = ["reverse", "blur", "invisible"];
  return modes[Math.floor(Math.random() * modes.length)];
}

// Bonus: Schwarzbild / sichtbar im Wechsel
let visiblePhase = true;
setInterval(() => {
  if (inBonus && bonusMode === "invisible") {
    visiblePhase = !visiblePhase;
    document.getElementById("mazeContainer").style.visibility = visiblePhase ? "visible" : "hidden";
  }
}, 5000);

// Tastatursteuerung
document.addEventListener("keydown", e => {
  if (!screens.game.classList.contains("hidden")) {
    if (["ArrowUp", "w"].includes(e.key)) movePlayer(0, -1);
    if (["ArrowDown", "s"].includes(e.key)) movePlayer(0, 1);
    if (["ArrowLeft", "a"].includes(e.key)) movePlayer(-1, 0);
    if (["ArrowRight", "d"].includes(e.key)) movePlayer(1, 0);
  }
});
// Touchsteuerung
let touchStartX, touchStartY;
document.addEventListener("touchstart", e => {
  if (!screens.game.classList.contains("hidden")) {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
  }
});
document.addEventListener("touchend", e => {
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

// Statistiken anzeigen
function showStats() {
  document.getElementById("statScore").innerText = score;
  document.getElementById("statSolved").innerText = solved;
  document.getElementById("statFails").innerText = bonusFails;
  document.getElementById("statMoves").innerText = moveCount;
  document.getElementById("statDevice").innerText = device;
  showScreen("stats");
}

// Geräteeinstellung
function setDevice(newDevice) {
  device = newDevice;
  saveData();
  alert(`Gerät auf ${newDevice} gesetzt`);
}

// Maze-Baumeister
function openBuilder() {
  builderMode = true;
  mazeSize = 10;
  builderData = Array.from({ length: mazeSize }, () => Array(mazeSize).fill(0));
  builderStart = null;
  builderEnd = null;
  renderBuilder();
  showScreen("builder");
}

function renderBuilder() {
  const container = document.getElementById("builderContainer");
  container.innerHTML = "";
  container.style.gridTemplateColumns = `repeat(${mazeSize}, 1fr)`;
  for (let y = 0; y < mazeSize; y++) {
    for (let x = 0; x < mazeSize; x++) {
      const cell = document.createElement("div");
      cell.className = "cell";
      if (builderData[y][x] === 1) cell.classList.add("wall");
      if (builderStart?.x === x && builderStart?.y === y) cell.classList.add("player");
      if (builderEnd?.x === x && builderEnd?.y === y) cell.classList.add("end");
      cell.onclick = () => toggleBuilderCell(x, y);
      container.appendChild(cell);
    }
  }
}

function toggleBuilderCell(x, y) {
  if (!builderStart) {
    builderStart = { x, y };
  } else if (!builderEnd) {
    builderEnd = { x, y };
  } else {
    builderData[y][x] = builderData[y][x] === 1 ? 0 : 1;
  }
  renderBuilder();
}
function startBuilderMaze() {
  if (!builderStart || !builderEnd) {
    alert("Bitte Start- und Endpunkt setzen!");
    return;
  }
  maze = builderData;
  player = { x: builderStart.x, y: builderStart.y };
  mazeSize = builderData.length;
  inBonus = false;
  bonusMode = null;
  startTime = Date.now();
  showScreen("game");
  renderMaze();
}

document.getElementById("deviceSelect").addEventListener("change", e => {
  setDevice(e.target.value);
});

document.getElementById("backToMenu").addEventListener("click", () => {
  showScreen("menu");
});

document.getElementById("startBuilderBtn").addEventListener("click", () => {
  openBuilder();
});

document.getElementById("startGameBtn").addEventListener("click", () => {
  startGame();
});

document.getElementById("statsBtn").addEventListener("click", () => {
  showStats();
});

document.getElementById("backFromStats").addEventListener("click", () => {
  showScreen("menu");
});

document.getElementById("startBuilderGame").addEventListener("click", () => {
  startBuilderMaze();
});

document.getElementById("backFromBuilder").addEventListener("click", () => {
  showScreen("menu");
});

// Initial starten mit Login-Code
if (!localStorage.getItem("playerCode")) {
  const entered = prompt("Gib deinen Spieler-Code ein:");
  if (entered) {
    localStorage.setItem("playerCode", entered);
    loadData();
  } else {
    alert("Spieler-Code erforderlich!");
    location.reload();
  }
} else {
  loadData();
}
