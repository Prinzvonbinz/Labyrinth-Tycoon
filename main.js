// Labyrinth-Grundversion

let mazeSize = 7; // Startgröße
let points = 0;

let maze = [];
let playerPos = { x: 0, y: 0 };
let endPos = { x: 0, y: 0 };

const pointsDisplay = document.getElementById('points');
const mazeContainer = document.getElementById('maze');

function generateMaze(size) {
  // Maze mit Backtracking-Algorithmus generieren
  // 0 = leer, 1 = wand

  // Init grid voll mit Wänden
  maze = Array(size).fill().map(() => Array(size).fill(1));

  // Hilfsfunktion: Nachbarn mit 2 Feldern Abstand
  function neighbors(x, y) {
    const dirs = [
      [2, 0],
      [-2, 0],
      [0, 2],
      [0, -2]
    ];
    return dirs
      .map(d => [x + d[0], y + d[1]])
      .filter(([nx, ny]) => nx > 0 && ny > 0 && nx < size-1 && ny < size-1 && maze[ny][nx] === 1);
  }

  // Tiefensuche Backtracking
  function carve(x, y) {
    maze[y][x] = 0;
    let nbs = neighbors(x, y);
    shuffleArray(nbs);
    for (const [nx, ny] of nbs) {
      if (maze[ny][nx] === 1) {
        maze[(y + ny) >> 1][(x + nx) >> 1] = 0; // Weg zwischen Feldern frei
        carve(nx, ny);
      }
    }
  }

  carve(1, 1);

  // Start und Ende setzen
  maze[1][1] = 0; // Start
  maze[size - 2][size - 2] = 0; // Ende
  playerPos = { x:1, y:1 };
  endPos = { x:size - 2, y:size - 2 };
}

// Hilfsfunktion: Array mischen
function shuffleArray(arr) {
  for(let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i+1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

function drawMaze() {
  mazeContainer.innerHTML = '';
  mazeContainer.style.gridTemplateColumns = `repeat(${mazeSize}, 25px)`;
  mazeContainer.style.gridTemplateRows = `repeat(${mazeSize}, 25px)`;
  for(let y=0; y<mazeSize; y++) {
    for(let x=0; x<mazeSize; x++) {
      const cell = document.createElement('div');
      cell.classList.add('cell');
      if(maze[y][x] === 1) cell.classList.add('wall');
      if(x === playerPos.x && y === playerPos.y) cell.classList.add('player');
      if(x === 1 && y === 1) cell.classList.add('start');
      if(x === endPos.x && y === endPos.y) cell.classList.add('end');
      mazeContainer.appendChild(cell);
    }
  }
}

function tryMove(dx, dy) {
  const nx = playerPos.x + dx;
  const ny = playerPos.y + dy;
  if(nx >= 0 && ny >= 0 && nx < mazeSize && ny < mazeSize) {
    if(maze[ny][nx] === 0) { // nur auf freien Feldern bewegen
      playerPos.x = nx;
      playerPos.y = ny;
      drawMaze();
      checkEnd();
    }
  }
}

function checkEnd() {
  if(playerPos.x === endPos.x && playerPos.y === endPos.y) {
    points++;
    pointsDisplay.textContent = `Punkte: ${points}`;
    // Maze vergrößern an bestimmten Punkten
    if([10, 50, 150, 500, 1000].includes(points)) {
      mazeSize += 2;
    }
    generateMaze(mazeSize);
    drawMaze();
  }
}

// Pfeiltasten abfangen
window.addEventListener('keydown', e => {
  switch(e.key) {
    case 'ArrowUp': tryMove(0, -1); break;
    case 'ArrowDown': tryMove(0, 1); break;
    case 'ArrowLeft': tryMove(-1, 0); break;
    case 'ArrowRight': tryMove(1, 0); break;
  }
});

// Start
generateMaze(mazeSize);
drawMaze();
pointsDisplay.textContent = `Punkte: ${points}`;
