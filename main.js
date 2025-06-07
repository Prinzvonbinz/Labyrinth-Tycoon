const mazeContainer = document.getElementById("maze");
const info = document.getElementById("info");

let level = 1;
let size = 7;
let maze = [];
let player = { x: 1, y: 1 };
let end = { x: 0, y: 0 };

function generateMaze(size) {
  // Init maze filled with walls
  maze = Array.from({ length: size }, () => Array(size).fill(1));

  function inBounds(x, y) {
    return x > 0 && y > 0 && x < size - 1 && y < size - 1;
  }

  function carve(x, y) {
    const dirs = shuffle([
      [0, -2],
      [0, 2],
      [-2, 0],
      [2, 0],
    ]);
    for (const [dx, dy] of dirs) {
      const nx = x + dx, ny = y + dy;
      if (inBounds(nx, ny) && maze[ny][nx] === 1) {
        maze[ny][nx] = 0;
        maze[y + dy / 2][x + dx / 2] = 0;
        carve(nx, ny);
      }
    }
  }

  maze[1][1] = 0;
  carve(1, 1);
  player = { x: 1, y: 1 };
  end = { x: size - 2, y: size - 2 };
  maze[end.y][end.x] = 0;
}

function shuffle(arr) {
  return arr.sort(() => Math.random() - 0.5);
}

function drawMaze() {
  mazeContainer.innerHTML = "";
  const cellSize = Math.floor(Math.min(window.innerWidth, window.innerHeight) / size);
  mazeContainer.style.gridTemplateColumns = `repeat(${size}, ${cellSize}px)`;
  mazeContainer.style.gridTemplateRows = `repeat(${size}, ${cellSize}px)`;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const div = document.createElement("div");
      div.classList.add("cell");
      div.style.width = div.style.height = `${cellSize}px`;
      if (maze[y][x] === 1) div.classList.add("wall");
      if (x === player.x && y === player.y) div.classList.add("player");
      else if (x === 1 && y === 1) div.classList.add("start");
      else if (x === end.x && y === end.y) div.classList.add("end");
      mazeContainer.appendChild(div);
    }
  }
}

function tryMove(dx, dy) {
  const nx = player.x + dx;
  const ny = player.y + dy;
  if (nx >= 0 && ny >= 0 && nx < size && ny < size && maze[ny][nx] === 0) {
    player.x = nx;
    player.y = ny;
    drawMaze();
    if (player.x === end.x && player.y === end.y) {
      level++;
      size += 2;
      info.textContent = `Level: ${level}`;
      generateMaze(size);
      drawMaze();
    }
  }
}

window.addEventListener("keydown", (e) => {
  switch (e.key) {
    case "ArrowUp": tryMove(0, -1); break;
    case "ArrowDown": tryMove(0, 1); break;
    case "ArrowLeft": tryMove(-1, 0); break;
    case "ArrowRight": tryMove(1, 0); break;
  }
});

let touchStartX = 0, touchStartY = 0;

mazeContainer.addEventListener("touchstart", (e) => {
  const t = e.touches[0];
  touchStartX = t.clientX;
  touchStartY = t.clientY;
}, { passive: true });

mazeContainer.addEventListener("touchend", (e) => {
  const t = e.changedTouches[0];
  const dx = t.clientX - touchStartX;
  const dy = t.clientY - touchStartY;

  if (Math.abs(dx) > Math.abs(dy)) {
    if (dx > 20) tryMove(1, 0);
    else if (dx < -20) tryMove(-1, 0);
  } else {
    if (dy > 20) tryMove(0, 1);
    else if (dy < -20) tryMove(0, -1);
  }
});

generateMaze(size);
drawMaze();
