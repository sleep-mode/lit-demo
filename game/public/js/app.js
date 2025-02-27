//

var socket;

//

var playerName;
var clientId;

var btn;
var nickErrorText;
var playerNameInput;

//

var screenWidth = window.innerWidth;
var screenHeight = window.innerHeight;

var PIXEL_RATIO = (function () {
    var ctx = document.createElement("canvas").getContext("2d"),
        dpr = window.devicePixelRatio || 1,
        bsr = ctx.webkitBackingStorePixelRatio ||
              ctx.mozBackingStorePixelRatio ||
              ctx.msBackingStorePixelRatio ||
              ctx.oBackingStorePixelRatio ||
              ctx.backingStorePixelRatio || 1;

    return dpr / bsr;
})();

var c = document.getElementById('cvs');
var canvas = c.getContext('2d');
var ratio = PIXEL_RATIO;
c.width = screenWidth * ratio; 
c.height = screenHeight * ratio;
c.style.width = screenWidth + 'px';
c.style.height = screenHeight + 'px';
c.getContext("2d").setTransform(ratio, 0, 0, ratio, 0, 0);

var KEY_ENTER = 13;

var tickLengthMs = 1000 / 60;
var previousTick = Date.now();
var actualTicks = 0;

//

var game = new Game();

//

function startGame() {
  document.getElementById('gameAreaWrapper').style.display = 'block';
  document.getElementById('startMenuWrapper').style.display = 'none';

  playerName = 'test'; //playerNameInput.value.replace(/(<([^>]+)>)/ig, '');

  //Set up socket
  socket = new eio.Socket('ws://' + window.location.hostname + ':5000/');
  game.handleNetwork(socket);

  //Start loop
  windowLoop();
}

function windowLoop () {
  requestAnimFrame(windowLoop);
  gameLoop();
}

function gameLoop () {
  var now = Date.now();
  actualTicks++;
  game.handleGraphics(canvas);
  if (previousTick + tickLengthMs <= now) {
    var delta = (now - previousTick) / 1000;
    previousTick = now;
    game.handleLogic(delta);
    actualTicks = 0;
  }
}

//Check nick and start game
function checkNick() {
  if (validNick()) {
      startGame();
  } else {
      nickErrorText.style.display = 'inline';
  }
}

//Check if nick is alphanumeric
function validNick() {
  var regex = /^\w*$/;
  console.log('Regex Test', regex.exec(playerNameInput.value));
  return regex.exec(playerNameInput.value) !== null;
}

//Set up form
window.onload = function() {
  'use strict';

  startGame();
  btn = document.getElementById('startButton');
  nickErrorText = document.querySelector('#startMenu .input-error');
  playerNameInput = document.getElementById('playerNameInput')

  btn.onclick = checkNick; //Check nick on click

  playerNameInput.addEventListener('keypress', function (e) {
    var key = e.which || e.keyCode;

    if (key === KEY_ENTER) {
      checkNick();
    }
  });
};

//Define animation frame
window.requestAnimFrame = (function () {
  return  window.requestAnimationFrame       ||
          window.webkitRequestAnimationFrame ||
          window.mozRequestAnimationFrame    ||
          function( callback ){
            window.setTimeout(callback, 1000 / 60);
          };
})();

//Resize event
window.addEventListener('resize', function() {
  screenWidth = window.innerWidth;
  screenHeight = window.innerHeight;
  c.width = screenWidth;
  c.height = screenHeight;
}, true);

function emit(event, message) {
  socket.send(BufferUtil().from(JSON.stringify({
    event: event,
    message: message 
  })));
}
