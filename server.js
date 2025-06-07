const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

app.use(express.static('public'));

const PORT = 3000;

// Datenstrukturen (in-memory)
const accounts = {};  // code -> { username, socketId }
const lobbies = {};   // lobbyCode -> { hostCode, players: [code], mapVotes, colors, gameStarted, turnOrder, ... }
const invitations = {}; // code -> [lobbyCode]

function generateCode(length = 5) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for(let i=0; i<length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Account erstellen/verbinden
  socket.on('login', (code, username, callback) => {
    if(!code) {
      // Neuer Code
      code = generateCode();
    }
    accounts[code] = { username, socketId: socket.id };
    socket.data.code = code;
    socket.data.username = username;
    console.log(`Account: ${username} (${code}) connected.`);
    callback(code);
  });

  // Lobby erstellen
  socket.on('createLobby', (callback) => {
    const code = socket.data.code;
    if(!code) return;
    const lobbyCode = generateCode(4);
    lobbies[lobbyCode] = {
      hostCode: code,
      players: [code],
      mapVotes: {},
      colors: {},
      gameStarted: false,
      turnOrder: [],
      currentTurn: 0,
      minigameResults: null,
    };
    invitations[code] = invitations[code] || [];
    callback(lobbyCode);
    io.to(socket.id).emit('lobbyUpdate', lobbies[lobbyCode], lobbyCode);
    console.log(`Lobby ${lobbyCode} created by ${code}`);
  });

  // Einladung senden
  socket.on('invitePlayer', (lobbyCode, playerCode, callback) => {
    if(!lobbies[lobbyCode]) return;
    invitations[playerCode] = invitations[playerCode] || [];
    if(!invitations[playerCode].includes(lobbyCode)) {
      invitations[playerCode].push(lobbyCode);
    }
    // Wenn eingeladener Spieler online -> Nachricht senden
    const invitedAccount = accounts[playerCode];
    if(invitedAccount) {
      io.to(invitedAccount.socketId).emit('invitationReceived', { lobbyCode, from: socket.data.code });
    }
    callback(true);
  });

  // Einladung abrufen
  socket.on('getInvitations', (callback) => {
    const code = socket.data.code;
    if(!code) return callback([]);
    callback(invitations[code] || []);
  });

  // Einladung annehmen
  socket.on('acceptInvitation', (lobbyCode, callback) => {
    const code = socket.data.code;
    if(!code || !lobbies[lobbyCode]) return callback(false);
    if(!lobbies[lobbyCode].players.includes(code)) {
      lobbies[lobbyCode].players.push(code);
    }
    // Einladung entfernen
    invitations[code] = (invitations[code] || []).filter(c => c !== lobbyCode);
    io.to(socket.id).emit('lobbyUpdate', lobbies[lobbyCode], lobbyCode);
    // Alle Spieler lobbyUpdate senden
    lobbies[lobbyCode].players.forEach(c => {
      if(accounts[c]) io.to(accounts[c].socketId).emit('lobbyUpdate', lobbies[lobbyCode], lobbyCode);
    });
    callback(true);
  });

  // Map voten
  socket.on('voteMap', (lobbyCode, map, callback) => {
    if(!lobbies[lobbyCode]) return;
    const code = socket.data.code;
    lobbies[lobbyCode].mapVotes[code] = map;
    callback(true);
    // Update alle
    lobbies[lobbyCode].players.forEach(c => {
      if(accounts[c]) io.to(accounts[c].socketId).emit('lobbyUpdate', lobbies[lobbyCode], lobbyCode);
    });
  });

  // Farbe wählen
  socket.on('chooseColor', (lobbyCode, color, callback) => {
    if(!lobbies[lobbyCode]) return;
    const code = socket.data.code;
    // Farbe nicht vergeben?
    const takenColors = Object.values(lobbies[lobbyCode].colors);
    if(takenColors.includes(color)) {
      callback(false);
      return;
    }
    lobbies[lobbyCode].colors[code] = color;
    callback(true);
    // Update alle
    lobbies[lobbyCode].players.forEach(c => {
      if(accounts[c]) io.to(accounts[c].socketId).emit('lobbyUpdate', lobbies[lobbyCode], lobbyCode);
    });
  });

  // Spiel starten (nur Host)
  socket.on('startGame', (lobbyCode, callback) => {
    if(!lobbies[lobbyCode]) return callback(false);
    if(lobbies[lobbyCode].hostCode !== socket.data.code) return callback(false);

    // Map auswerten: Mehrheit oder Zufall bei Gleichstand
    const votes = Object.values(lobbies[lobbyCode].mapVotes);
    if(votes.length < lobbies[lobbyCode].players.length) {
      return callback(false); // Nicht alle haben gewählt
    }
    // Zähle Votes
    const countMap = {};
    votes.forEach(m => countMap[m] = (countMap[m] || 0) +1);
    const maxCount = Math.max(...Object.values(countMap));
    const candidates = Object.entries(countMap).filter(([m,c]) => c === maxCount).map(([m]) => m);
    let chosenMap = candidates[Math.floor(Math.random() * candidates.length)];

    lobbies[lobbyCode].chosenMap = chosenMap;

    // Reihenfolge zufällig
    const shuffled = [...lobbies[lobbyCode].players].sort(() => Math.random() - 0.5);
    lobbies[lobbyCode].turnOrder = shuffled;
    lobbies[lobbyCode].currentTurn = 0;
    lobbies[lobbyCode].gameStarted = true;

    // Start-Daten an alle schicken
    lobbies[lobbyCode].players.forEach(c => {
      if(accounts[c]) {
        io.to(accounts[c].socketId).emit('gameStarted', {
          map: chosenMap,
          turnOrder: lobbies[lobbyCode].turnOrder,
          colors: lobbies[lobbyCode].colors,
        });
      }
    });

    callback(true);
  });

  // Würfeln
  socket.on('rollDice', (lobbyCode, diceType, callback) => {
    if(!lobbies[lobbyCode] || !lobbies[lobbyCode].gameStarted) return;
    const code = socket.data.code;
    // Nur aktueller Spieler darf würfeln
    if(lobbies[lobbyCode].turnOrder[lobbies[lobbyCode].currentTurn] !== code) {
      callback({error: 'Not your turn'});
      return;
    }

    // Würfel: normal (1-6) oder bonus (Gold 4-6, Silber 2-4, Bronze 1-3)
    let roll = 1;
    if(diceType === 'normal') {
      roll = Math.floor(Math.random() * 6) + 1;
    } else if(diceType === 'gold') {
      roll = [4,5,6][Math.floor(Math.random() * 3)];
    } else if(diceType === 'silver') {
      roll = [2,3,4][Math.floor(Math.random() * 3)];
    } else if(diceType === 'bronze') {
      roll = [1,2,3][Math.floor(Math.random() * 3)];
    } else {
      roll = Math.floor(Math.random() * 6) + 1;
    }

    // Spiel-Logik für Spielfeld wird hier noch nicht implementiert, nur Würfelergebnis
    callback({ roll });

    // Broadcast Würfelergebnis an alle Spieler
    lobbies[lobbyCode].players.forEach(c => {
      if(accounts[c]) {
        io.to(accounts[c].socketId).emit('diceRolled', { player: code, roll });
      }
    });

    // Nächster Spieler am Zug
    lobbies[lobbyCode].currentTurn = (lobbies[lobbyCode].currentTurn + 1) % lobbies[lobbyCode].turnOrder.length;

    // Alle über aktuellen Spieler informieren
    lobbies[lobbyCode].players.forEach(c => {
      if(accounts[c]) {
        io.to(accounts[c].socketId).emit('turnChanged', lobbies[lobbyCode].turnOrder[lobbies[lobbyCode].currentTurn]);
      }
    });
  });

  // Minispiel-Ergebnis senden
  socket.on('submitMinigameResult', (lobbyCode, place, callback) => {
    if(!lobbies[lobbyCode]) return callback(false);
    // Sammle Ergebnisse
    if(!lobbies[lobbyCode].minigameResults) lobbies[lobbyCode].minigameResults = [];
    lobbies[lobbyCode].minigameResults.push({ player: socket.data.code, place });
    callback(true);

    // Wenn alle Spieler Ergebnisse geschickt haben => auswerten und Bonuswürfel vergeben
    if(lobbies[lobbyCode].minigameResults.length === lobbies[lobbyCode].players.length) {
      // Sortieren nach Platz
      const sorted = lobbies[lobbyCode].minigameResults.sort((a,b) => a.place - b.place);

      // Bonuswürfel verteilen
      const bonusMap = {};
      sorted.forEach((res, idx) => {
        if(idx === 0) bonusMap[res.player] = 'gold';
        else if(idx === 1) bonusMap[res.player] = 'silver';
        else if(idx === 2) bonusMap[res.player] = 'bronze';
      });

      // Sende Bonus an alle Spieler
      lobbies[lobbyCode].players.forEach(c => {
        if(accounts[c]) {
          io.to(accounts[c].socketId).emit('minigameResults', { sorted, bonusMap });
        }
      });

      // Reset für nächstes Minispiel
      lobbies[lobbyCode].minigameResults = [];
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    // Optional: Spieler aus Lobbys entfernen
  });
});

http.listen(PORT, () => {
  console.log(`Server läuft auf http://localhost:${PORT}`);
});
