const MAP_HEIGHT = 300;

let width = 1000; //window.innerWidth;
let middle = (window.innerHeight / 2);
let speed = 300;
let coinSpawn = 1;
let lastCoinSpawn = 1;
let basicEnemySpawn = 3;
let enemySpawn = 3;
let lastEnemySpawn = 0;
let enemyLife = 5;
let score = 0;

function Game () { 
  var self = this;
  self.players = {};
  self.coins = [];
  self.enemies = [];
  self.pid = -1;
  self.name = "";
  addEventListener('keydown', self.handleKeyboard.bind(self));
};

Game.prototype.initPlayer = function(name) {
  return {
    name: name,
    x: 10,
    y: middle,
    direction: -1
  }
}

Game.prototype.spawnCoin = function() {
  return {
    x: Math.random() * width,
    y: middle
  }
}

Game.prototype.spawnEnemy = function() {
  return {
    life: enemyLife,
    x: Math.random() * width,
    y: middle
  }
}

Game.prototype.handleKeyboard = function(event) {
  var self = this;
  if ((event.keyCode || event.which) == 32) { 
    if (self.players[clientId]) {
      self.players[clientId].direction *= -1;
      emit('playerDirection', {
        clientId: clientId,
        direction: self.players[clientId].direction
      });
    }
  }
}

Game.prototype.updatePlayerList = function(playersData) {
  var self = this;
  var players = Object.keys(playersData);
  for (var i = 0; i < players.length; i++) {
    var pid = players[i];
    self.players[pid] = playersData[pid].player;
  }
}

Game.prototype.handleNetwork = function(socket) {
  var self = this;
  //Network callback

  socket.on('open', function() {
    socket.on('message', function(data) {
      var msg = JSON.parse(BufferUtil().toString(data));
      if (msg.event == 'welcome') {
        clientId = msg.message.id;
        self.updatePlayerList(msg.message.players); 
        console.log('All players', self.players);
      }
      if (msg.event == 'playerJoin') {
        self.updatePlayerList(msg.message.players); 
        console.log('New player joined', self.players);
      }
      if (msg.event == 'updatePlayerDirection') {
        self.players[msg.message.player] = {
          x: msg.message.x,
          y: msg.message.y,
          direction: msg.message.direction
        }
      }
      if (msg.event == 'playerDisconnect') {
        delete self.players[msg.message.player];
      }
    });
    socket.on('close', function(){});
  });
}

Game.prototype.updatePlayer = function(delta, player) {
  player.x += player.direction * speed * delta;  
  if (player.direction > 0 && player.x > width) {
    player.x = player.x % 1000;
  }
  if (player.direction < 0 && player.x < 0) {
    player.x = width;
  }
}

Game.prototype.checkCollision = function(player, objects, callback) {
  const threshold = 1;
  const removeTarget = [];
  for(let i = 0; i < objects.length; i++) {
    if (Math.abs(player.x - objects[i].x) < threshold) {
      removeTarget.push(objects[i]);
    }
  }

  for(let i = 0; i < removeTarget.length; i++) {
    if (objects.splice(objects.indexOf(removeTarget[i]), 1).length > 0) {
      callback();
    }
  }
}

Game.prototype.handleLogic = function(delta) {
  var self = this;
  //Update loop
  for (var i = 0; i < Object.keys(self.players).length; i++) {
    var pid = Object.keys(self.players)[i];
    self.updatePlayer(delta, self.players[pid]);
    self.checkCollision(self.players[pid], self.coins, () => {score++;});
    self.checkCollision(self.players[pid], self.enemies, () => {score = 0;});
  }

  lastCoinSpawn += delta;
  if (lastCoinSpawn > coinSpawn) {
    lastCoinSpawn = 0;
    self.coins.push(self.spawnCoin());
  }

  enemySpawn = Math.max(0.5, basicEnemySpawn - score * 0.3);

  lastEnemySpawn += delta;
  if (lastEnemySpawn > enemySpawn) {
    lastEnemySpawn = 0;
    self.enemies.push(self.spawnEnemy());
  }

  for (let i = self.enemies.length - 1; i >= 0; i--) {
    let enemy = self.enemies[i];
    enemy.life -= delta;
    if (enemy.life < 0) {
      self.enemies.splice(i, 1);
    }
  }
}

Game.prototype.handleGraphics = function(graphics) {
  //Draw loop
  var self = this;

  let screenMiddle = (screenHeight / 2) - (MAP_HEIGHT / 2);

  graphics.fillStyle = '#333333';
  graphics.fillRect(0, 0, screenWidth, screenHeight);

  graphics.fillStyle = '#222';
  graphics.fillRect(0, screenMiddle, screenWidth, MAP_HEIGHT);

  var dummyPositions = [100, 500, 600, 1200, 1300, 1400, 1500];
  dummyPositions.forEach((x) => {
    graphics.beginPath();
    graphics.arc(parseInt(x), parseInt(middle), 30, 0, Math.PI * 2, true);
    graphics.fillStyle = '#555';
    graphics.fill();
  });

  for (var i = 0; i < Object.keys(self.players).length; i++) {
    graphics.beginPath();
    var pid = Object.keys(self.players)[i];
    if (pid == clientId) {
      var playerPosition = self.players[pid];
      graphics.font = '12px Tahoma';
      graphics.fillStyle = '#fff';
      var nearPlayerCount = () => {
        var cnt = 0;
        const distance = 200;
        dummyPositions.forEach((x) => {
          if (Math.abs(playerPosition.x - x) < distance)
            cnt++;
        });
        return cnt;
      };
      graphics.fillText(nearPlayerCount(), parseInt(playerPosition.x), parseInt(playerPosition.y) - 50);
    } else {
      graphics.fillStyle = '#f0f';
    }
    graphics.arc(parseInt(self.players[pid].x), parseInt(self.players[pid].y), 30, 0, Math.PI * 2, true);
    graphics.fill();
    graphics.fillText(pid, self.players[pid].x, parseInt(self.players[pid].y + 20));
  }

  for (let i = 0; i < self.coins.length; i++) {
    graphics.beginPath();
    graphics.fillStyle = '#ff0';
    graphics.arc(parseInt(self.coins[i].x), parseInt(self.coins[i].y), 30, 0, Math.PI * 2, true);
    graphics.fill();
  }

  // for (let i = 0; i < self.enemies.length; i++) {
  //   graphics.beginPath();
  //   graphics.fillStyle = '#f00';
  //   graphics.arc(parseInt(self.enemies[i].x), parseInt(self.enemies[i].y), 30, 0, Math.PI * 2, true);
  //   graphics.fill();
  // }
  
  graphics.fillStyle = '#FFF';
  graphics.font = '12px Tahoma';
  var playerCount = Object.keys(self.players).length;
  graphics.fillText('Total players: ' + playerCount, 10, 10);
  graphics.fillText('Score: ' + score, 10, 20);
}
