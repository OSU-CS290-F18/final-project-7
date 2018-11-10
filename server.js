/*
 * Write your server code in this file.  Don't forget to add your name and
 * @oregonstate.edu email address below.
 *
 * name: Ashyan Rahavi
 * email: rahavia@oregonstate.edu
 */
 
var express = require('express');
var bodyParser = require('body-parser');
var http = require('http');
var path = require('path');
var socketIO = require('socket.io');
var wallHittable = true;
var playerHittable = true;
var restart = false;

var app = express();
var server = http.Server(app);
var io = socketIO(server);

var urlencodedParser = bodyParser.urlencoded({extended: true});

//async function myTimer() {
//    console.log('This prints every second');
//}
//setInterval(myTimer, 1000);

app.use(function (req, res, next) {
	console.log("== Request made");
	console.log("  - Method:", req.method);
	console.log("  - URL:", req.url);
	next();
});

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

app.use(express.static('public'));
app.use('/static', express.static(__dirname + '/public/static'));
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());

app.post("/update-text*", function(req, res, next) {
    console.log('test');
    console.log(req.body);
    res.end();
});

app.post("/restart-game", function(req, res, next) {
  restart = true;
  res.end();
});

app.get("*", function(req, res, next) {
    res.type('text/html');
    res.status(404);
});

var port = process.env.PORT;
if(!port) {
    port = 3000;
}
server.listen(port, function(err) {
    if(err) {
        throw err;
   }
   console.log('Server is listening on port', port);
});

var players = {};
var ball = {
    x : 500,
    y : 250,
    xSpeed : 0,
    ySpeed : 0,
    radius : 5
};
var canvas = {
	width: 1000,
	height: 500
};
io.on('connection', function(socket) {
	socket.emit('data', canvas);
  var startX = 100;
  
  socket.on('new player', function() {
		if(Object.keys(players).length < 2) {
			if(Object.keys(players).length == 1) {
				ball.xSpeed = 400;
				ball.ySpeed = 400;
			}
			for(id in players) {
				if(players[id].x < canvas.width/2) {
					startX = 900;
				}
			}
			players[socket.id] = {
				x: startX,
				y: 250,
				width: 10,
				height: 50
			};
		}
	});
  
  socket.on('movement', function(data) {
    var player = players[socket.id] || {};
    /*
    if (data.left) {
      player.x -= 5;
    }
    */
    if (data.up) {
      player.y -= 5;
    }
    /*
    if (data.right) {
      player.x += 5;
    }
    */
    if (data.down) {
      player.y += 5;
    }
  });
  
  socket.on('disconnect', function() {
    delete players[socket.id];
  });
});




var lastUpdateTime = (new Date()).getTime();
async function updateBall() {
	if((ball.y - ball.radius) <= 0 || (ball.y + ball.radius) >= canvas.height) {
		ball.y = ((ball.y - ball.radius) <= 0) ? (1 + ball.radius) : (canvas.height - ball.radius - 1) ;
		ball.ySpeed = ball.ySpeed * -1;
	}
	for(id in players) {
		var player = players[id];
		if(player.x > canvas.width/2) {
			//Right Player
			
			//If the ball hits the paddle left side
			if(ball.y + ball.radius <= player.y + player.height && ball.y - ball.radius >= player.y &&
				 ball.x + ball.radius >= player.x && ball.x + ball.radius <= player.x + player.width) {
				ball.xSpeed = ball.xSpeed * -1;
				ball.x = player.x - ball.radius - 1;
				continue;
			}
			
			//If the ball hits the paddle top
			if(ball.x <= (player.x + player.width) && ball.x >= player.x &&
				(ball.y + ball.radius) >= player.y && (ball.y + ball.radius) <= (player.y + player.height)) 
				{
				ball.ySpeed = ball.ySpeed * -1;
				ball.xSpeed = ball.xSpeed * -1;
				ball.y = player.y - ball.radius - 1;
				continue;
			}
			//If the ball hits the paddle bottom
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
			
			//If the ball hits the paddle right side
			if(ball.y + ball.radius <= player.y + player.height && ball.y - ball.radius >= player.y &&
				 ball.x - ball.radius <= player.x + player.width && ball.x - ball.radius >= player.x) {
				ball.xSpeed = ball.xSpeed * -1;
				console.log(ball.x);
				ball.x = player.x + ball.radius + 1;
				continue;
			}
			
			//If the ball hits the paddle top
			if(ball.x <= (player.x + player.width) && ball.x >= player.x &&
				(ball.y + ball.radius) >= player.y && (ball.y + ball.radius) <= (player.y + player.height)) 
				{
				ball.ySpeed = ball.ySpeed * -1;
				ball.xSpeed = ball.xSpeed * -1;
				ball.y = player.y - ball.radius - 1;
				continue;
			}
			//If the ball hits the paddle bottom
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
  if(restart) {
    ball.x = 500;
    ball.y = 250;
    restart = false;
  }
  lastUpdateTime = currentTime;
}


setInterval(function() {
  updateBall();
  io.sockets.emit('state', players, ball);
}, 1000 / 60);