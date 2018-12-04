
document.getElementById('restart-button').addEventListener('click', function() {
  $.ajax({
		url: '/restart-game',
		type: 'POST'
	});
});

var socket = io();
socket.on('message', function(data) {
  console.log(data);
});

var canvas = document.getElementById('canvas');
socket.on('data', function(canvasData) {
	canvas.width = canvasData.width;
	canvas.height = canvasData.height;
});


var movement = {
  up: false,
  down: false,
  left: false,
  right: false
}
document.addEventListener('keydown', function(event) {
  switch (event.keyCode) {
    case 87: // W
      movement.up = true;
      break;
    case 83: // S
      movement.down = true;
      break;
  }
});
document.addEventListener('keyup', function(event) {
  switch (event.keyCode) {
    case 87: // W
      movement.up = false;
      break;
    case 83: // S
      movement.down = false;
      break;
  }
});

socket.emit('new player');
setInterval(function() {
  socket.emit('movement', movement);
}, 1000 / 60);


var context = canvas.getContext('2d');
socket.on('state', function(players, ball) {
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = 'green';
  for (var id in players) {
    var player = players[id];
    context.beginPath();
    context.rect(player.x, player.y, player.width, player.height);
    context.fill();
  }
  context.beginPath();
  context.arc(ball.x, ball.y, ball.radius, 0, 2 * Math.PI);
  context.fill();
});
