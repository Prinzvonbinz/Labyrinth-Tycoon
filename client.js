const socket = io();

let currentCode = null;
let currentLobby = null;
let myColor = null;
let myTurn = false;

// --- DOM Elements ---
const loginDiv = document.getElementById('login');
const mainMenuDiv = document.getElementById('mainMenu');
const invitationsMenuDiv = document.getElementById('invitationsMenu');
const lobbyDiv = document.getElementById('lobby');
const gameDiv = document.getElementById('game');

const usernameInput = document.getElementById('username');
const codeInput = document.getElementById('codeInput');
const btnLogin = document.getElementById('btnLogin');
const loginStatus = document.getElementById('loginStatus');

const btnCreateLobby = document.getElementById('btnCreateLobby');
const btnInvitations = document.getElementById('btnInvitations');
const currentCodeSpan = document.getElementById('currentCode');

const invitationList = document.getElementById('invitationList');
const btnBackInvitations = document.getElementById('btnBackInvitations');

const lobbyCodeSpan = document.getElementById('lobbyCode');
const hostNameSpan = document.getElementById('hostName');
const playerListDiv = document.getElementById('playerList');
const mapVoteSelect = document.getElementById('mapVoteSelect');
const btnVoteMap = document.getElementById('btnVoteMap');
const colorSelect = document.getElementById('colorSelect');
const btnChooseColor = document.getElementById('btnChooseColor');
const btnStartGame = document.getElementById('btnStartGame');

const gameMapSpan = document.getElementById('gameMap');
const turnInfoSpan = document.getElementById('turnInfo');
const diceResultSpan = document.getElementById('diceResult');
const btnRollNormal = document.getElementById('btnRollNormal');
const btnRollGold = document.getElementById('btnRollGold');
const btnRollSilver = document.getElementById('btnRollSilver');
const btnRollBronze = document.getElementById('btnRollBronze');

// --- Events ---

btnLogin.onclick = () => {
  const username = usernameInput.value.trim();
  const code = codeInput.value.trim().toUpperCase();
  if(!username) {
    loginStatus.textContent = 'Bitte Namen eingeben.';
    return;
  }
  socket.emit('login', code || null, username, (codeReturned) => {
    currentCode = codeReturned;
    loginStatus.textContent = `Eingeloggt als ${username} mit Code ${currentCode}`;
    loginDiv.style.display = 'none';
    mainMenuDiv.style.display = 'block';
    currentCodeSpan.textContent = `Dein Code: ${currentCode}`;
  });
};

btnCreateLobby.onclick = () => {
  socket.emit('createLobby', (lobbyCode) => {
    showLobby(lobbyCode);
  });
};

btnInvitations.onclick = () => {
  socket.emit('getInvitations', (invitations) => {
    invitationList.innerHTML = '';
    if(invitations.length === 0) {
      invitationList.innerHTML = '<li>Keine Einladungen</li>';
    } else {
      invitations.forEach(lobbyCode => {
        const li = document.createElement('li');
        li.textContent = `Lobby ${lobbyCode} `;
        const btnAccept = document.createElement('button');
        btnAccept.textContent = 'Annehmen';
        btnAccept.onclick = () => {
          socket.emit('acceptInvitation', lobbyCode, (success) => {
            if(success) {
              showLobby(lobbyCode);
              invitationsMenuDiv.style.display = 'none';
              mainMenuDiv.style.display = 'none';
            }
          });
        };
        li.appendChild(btnAccept);
        invitationList.appendChild(li);
      });
    }
    invitationsMenuDiv.style.display = 'block';
    mainMenuDiv.style.display = 'none';
  });
};

btnBackInvitations.onclick = () => {
  invitationsMenuDiv.style.display = 'none';
  mainMenuDiv.style.display = 'block';
};

btnVoteMap?.addEventListener('click', () => {
  const map = mapVoteSelect.value;
  if(!currentLobby) return;
  socket.emit('voteMap', currentLobby, map, (ok) => {
    if(ok) alert('Karte gewählt!');
  });
});

btnChooseColor?.addEventListener('click', () => {
  const color = colorSelect.value;
  if(!currentLobby) return;
  socket.emit('chooseColor', currentLobby, color, (ok) => {
    if(ok) {
      myColor = color;
      alert('Farbe gewählt!');
    } else {
      alert('Farbe schon vergeben.');
    }
  });
});

btnStartGame?.addEventListener('click', () => {
  if(!currentLobby) return;
  socket.emit('startGame', currentLobby, (ok) => {
    if(!ok) alert('Spiel konnte nicht gestartet werden (nicht alle haben gewählt oder du bist nicht Host).');
  });
});

// Würfeln Buttons
btnRollNormal?.addEventListener('click', () => rollDice('normal'));
btnRollGold?.addEventListener('click', () => rollDice('gold'));
btnRollSilver?.addEventListener('click', () => rollDice('silver'));
btnRollBronze?.addEventListener('click', () => rollDice('bronze'));

function rollDice(type) {
  if(!currentLobby) return;
  socket.emit('rollDice', currentLobby, type, (res) => {
    if(res.error) {
      alert(res.error);
    } else {
      diceResultSpan.textContent = `Würfel: ${res.roll}`;
    }
  });
}

// --- Socket Event Handlers ---

socket.on('lobbyUpdate', (lobby, lobbyCode) => {
  if(lobbyCode !== currentLobby) return;
  updateLobby(lobby);
});

socket.on('gameStarted', (data) => {
  mainMenuDiv.style.display = 'none';
  lobbyDiv.style.display = 'none';
  gameDiv.style.display = 'block';
  gameMapSpan.textContent = data.map;
  updateTurn(data.turnOrder[0]);
});

socket.on('diceRolled', ({ player, roll }) => {
  diceResultSpan.textContent = `Spieler ${player} würfelt ${roll}`;
});

socket.on('turnChanged', (code) => {
  updateTurn(code);
});

socket.on('minigameResults', ({ sorted, bonusMap }) => {
  let msg = 'Minispiel Ergebnisse:\n';
  sorted.forEach((res, i) => {
    msg += `${i+1}. ${res.player} (${bonusMap[res.player] || 'kein Bonus'})\n`;
  });
  alert(msg);
});

// --- Helper Functions ---

function showLobby(lobbyCode) {
  currentLobby = lobbyCode;
  mainMenuDiv.style.display = 'none';
  invitationsMenuDiv.style.display = 'none';
  lobbyDiv.style.display = 'block';
  lobbyCodeSpan.textContent = lobbyCode;
  // Frage Lobby-Infos ab
  // Lobby-Infos kommen über 'lobbyUpdate' Events
  playerListDiv.innerHTML = 'Warte auf Updates...';
}

function updateLobby(lobby) {
  // Host
  hostNameSpan.textContent = accountsNameByCode(lobby.hostCode) || lobby.hostCode;
  // Spieler
  playerListDiv.innerHTML = '';
  lobby.players.forEach(code => {
    const div = document.createElement('div');
    div.textContent = accountsNameByCode(code) || code;
    if(lobby.colors[code]) {
      const swatch = document.createElement('span');
      swatch.className = 'color-swatch';
      swatch.style.backgroundColor = lobby.colors[code];
      div.appendChild(swatch);
    }
    playerListDiv.appendChild(div);
  });
  // Map Votes (optional anzeigen)
  // Farben etc.

  // Host darf starten wenn alle map votes haben
  if(lobby.hostCode === currentCode && lobby.players.length > 1) {
    btnStartGame.style.display = 'inline-block';
  } else {
    btnStartGame.style.display = 'none';
  }
}

function updateTurn(currentPlayerCode) {
  if(currentPlayerCode === currentCode) {
    turnInfoSpan.textContent = 'Du bist dran! Würfle.';
    myTurn = true;
    btnRollNormal.disabled = false;
    btnRollGold.disabled = false;
    btnRollSilver.disabled = false;
    btnRollBronze.disabled = false;
  } else {
    turnInfoSpan.textContent = `Spieler ${accountsNameByCode(currentPlayerCode) || currentPlayerCode} ist dran.`;
    myTurn = false;
    btnRollNormal.disabled = true;
    btnRollGold.disabled = true;
    btnRollSilver.disabled = true;
    btnRollBronze.disabled = true;
  }
}

function accountsNameByCode(code) {
  // Simple cache from socket events?
  // For demo, just code itself
  if(code === currentCode) return usernameInput.value || 'Du';
  return code;
}

// --- Init ---
loginDiv.style.display = 'block';
