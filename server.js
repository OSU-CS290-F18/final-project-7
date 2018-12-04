/*
 * Write your server code in this file.  Don't forget to add your name and
 * @oregonstate.edu email address below.
 *
 * name: Ashyan Rahavi
 * email: rahavia@oregonstate.edu
 */

var express = require('express');
var http = require('http');
var path = require('path');
var socketIO = require('socket.io');
var wallHittable = true;
var playerHittable = true;
var restart = false;
var tickRate = 60;
var highscores = require('./highScores.json')

var fs = require('fs');

var app = express();
var server = http.Server(app);
var io = socketIO(server);

var leftPlayerScore = 0;
var rightPlayerScore = 0;
var winnerFound = false;

var players = {};
var ball = {
    x : 400,
    y : 250,
    xSpeed : 0,
    ySpeed : 0,
    radius : 5
};
var canvas = {
	width: 800,
	height: 500
};
var score = {
  player1: 0,
  player2: 0
};

/*
app.get("/", function(req, res, next) {
    res.type('text/html');
    res.send(indexPage);
});

app.get("/index.html", function(req, res, next) {
    res.type('text/html');
    res.send(indexPage);
});

app.get("/style.css", function(req, res, next) {
    res.type('text/css');
    res.send(cssStyle);
});

app.get("/index.js", function(req, res, next) {
    res.type('application/javascript');
    res.send(indexJS);
});
*/

var port = process.env.PORT || 8123;
server.listen(port, function(err) {
	if(err) {
		throw err;
	}
	console.log('Server is listening on port', port);
});

app.use(function (req, res, next) {
	console.log("== Request made");
	console.log("  - Method:", req.method);
	console.log("  - URL:", req.url);
	next();
});

app.use(express.static('public'));

app.post("/restart-game", function(req, res, next) {
  resetGame(0, 0);
	console.log('before end');
  res.status(200).send("Restarted the game");
	console.log('after end');
});

console.log('after restart');

app.get("*", function(req, res) {
  res.status(404).sendFile('public/404.html', {root: __dirname });
});


io.on('connection', function(socket) {
	socket.emit('data', canvas);
  var startX = 50;
	socket.emit('jsonData', highscores);

  socket.on('new player', function() {
		if(Object.keys(players).length < 2) {
			leftPlayerScore = 0;
			rightPlayerScore = 0;
			for(id in players) {
				if(players[id].x < canvas.width/2) {
					startX = 750;
				}
			}
			players[socket.id] = {
				x: startX,
				y: 225,
				width: 10,
				height: 50,
				ready: false
			};
		}
	});

	socket.on('playerWon', function(playerName){
		updateHighscores(playerName);
	});

  socket.on('movement', function(data) {
    var player = players[socket.id] || {};

    if (data.up && player.y > 4) {
      player.y -= 5;
    }

    if (data.down && player.y + player.height < canvas.height + 5) {
      player.y += 5;
    }
  });

  socket.on('disconnect', function() {
    delete players[socket.id];
  });

	socket.on('playerReady', function() {
		if(ball.xSpeed == 0) {
			players[socket.id].ready = true;
			var numReady = 0;
			for(player in players) {
				if(players[player].ready) {
					numReady++;
				}
			}
			if(numReady == 2) {
				ball.xSpeed = 350;
				ball.ySpeed = 350;
				for(player in players) {
					players[player].ready = false;
				}
			}
		}
	});
});

var lastUpdateTime = (new Date()).getTime();

function resetBall(xSpeed, ySpeed) {
	ball.x = 500;
	ball.y = 250;
	ball.xSpeed = xSpeed;
	ball.ySpeed = ySpeed;
}

function resetGame(xSpeed, ySpeed) {
	console.log("Restarting the game...");
	resetBall(xSpeed, ySpeed);
	leftPlayerScore = 0;
	rightPlayerScore = 0;

  for(id in players){
    players[id].y = 225;
  }

	io.sockets.emit('score', leftPlayerScore, rightPlayerScore);
}

function updateBall() {

  //If the ball hits the top or bottom of the board
	if(ball.y - ball.radius <= 0 || ball.y + ball.radius >= canvas.height) {
		ball.y = ((ball.y - ball.radius) <= 0) ? (1 + ball.radius) : (canvas.height - ball.radius - 1) ;
		ball.ySpeed = ball.ySpeed * -1;
	}

  //If the ball goes out of the walls
  //Left side wall
  if(ball.x - ball.radius <= 0) {
		ball.xSpeed = ball.xSpeed * -1;
		resetBall(350, 350);
		rightPlayerScore += 1;
		io.sockets.emit('score', leftPlayerScore, rightPlayerScore);
  }
  //Right side wall
  if(ball.x + ball.radius >= canvas.width) {
		ball.xSpeed = ball.xSpeed * -1;
		resetBall(-350, 350);
		leftPlayerScore += 1
		io.sockets.emit('score', leftPlayerScore, rightPlayerScore);
  }



	for(id in players) {
		var player = players[id];
		if(player.x > canvas.width/2) {
			//Right Player

			//If the ball hits the paddle's left side
			if(ball.y + ball.radius <= player.y + player.height && ball.y - ball.radius >= player.y &&
				 ball.x + ball.radius >= player.x && ball.x + ball.radius <= player.x + player.width) {
				ball.xSpeed = ball.xSpeed * -1;
				ball.x = player.x - ball.radius - 1;
				continue;
			}

			//If the ball hits the paddle's top
			if(ball.x <= (player.x + player.width) && ball.x >= player.x &&
				(ball.y + ball.radius) >= player.y && (ball.y + ball.radius) <= (player.y + player.height))
				{
				ball.ySpeed = ball.ySpeed * -1;
				ball.xSpeed = ball.xSpeed * -1;
				ball.y = player.y - ball.radius - 1;
				continue;
			}
			//If the ball hits the paddle's bottom
			if(ball.x <= (player.x + player.width) && ball.x >= player.x &&
				(ball.y - ball.radius) <= (player.y + player.height) && (ball.y - ball.radius) >= player.y)
				{
				ball.ySpeed = ball.ySpeed * -1;
				ball.xSpeed = ball.xSpeed * -1;
				ball.y = player.y + player.height + ball.radius + 1;
				continue;
				}
		} else {
			//Left player

			//If the ball hits the paddle's right side
			if(ball.y + ball.radius <= player.y + player.height && ball.y - ball.radius >= player.y &&
				 ball.x - ball.radius <= player.x + player.width && ball.x - ball.radius >= player.x) {
        ball.xSpeed = ball.xSpeed * -1;
				ball.x = player.x + player.width + ball.radius + 1;
				continue;
			}

			//If the ball hits the paddle's top
			if(ball.x <= (player.x + player.width) && ball.x >= player.x &&
				(ball.y + ball.radius) >= player.y && (ball.y + ball.radius) <= (player.y + player.height))
				{
				ball.ySpeed = ball.ySpeed * -1;
				ball.xSpeed = ball.xSpeed * -1;
				ball.y = player.y - ball.radius - 1;
				continue;
			}
			//If the ball hits the paddle's bottom
			if(ball.x <= (player.x + player.width) && ball.x >= player.x &&
				(ball.y - ball.radius) <= (player.y + player.height) && (ball.y - ball.radius) >= player.y)
				{
				ball.ySpeed = ball.ySpeed * -1;
				ball.xSpeed = ball.xSpeed * -1;
				ball.y = player.y + player.height + ball.radius + 1;
				continue;
			}
		}
	}

  var currentTime = (new Date()).getTime();
  var timeDifference = currentTime - lastUpdateTime;
  ball.x += Math.round((ball.xSpeed * timeDifference)/1000);
  ball.y += Math.round((ball.ySpeed * timeDifference)/1000);
  lastUpdateTime = currentTime;
}

function checkWinner() {
	if(leftPlayerScore >= 10 || rightPlayerScore >= 10) {
		winnerFound = true;
		var leftSocket;
		var rightSocket;
		for(id in players) {
			if(players[id].x < canvas.width/2) {
				leftSocket = id;
			} else {
				rightSocket = id;
			}
		}
		var winner = leftPlayerScore >= 10 ? leftSocket : rightSocket;
		io.sockets.emit('winner', winner)
		ball.xSpeed = 0;
		ball.ySpeed = 0;
	}
}

function updateHighscores(playerName){
	console.log("playerName:", playerName);
	if(playerName in highscores){
		console.log("playerName");
		var playerScore = parseInt(highscores[playerName].score);
		playerScore++;
		highscores[playerName].score = playerScore.toString();
	}
	else{
		console.log(highscores);
		highscores[playerName] = {
			"score": "1"
		};
	}
	var tempJsonData = JSON.stringify(highscores);
	fs.writeFile("highScores.json", tempJsonData, function(err) {
		if (err) {
				console.log(err);
		}
	});

	io.sockets.emit('jsonData', highscores);
}


setInterval(function() {
  updateBall();
  io.sockets.emit('state', players, ball);
	if(winnerFound == false) {
		checkWinner();
	}
}, 1000 / tickRate);
