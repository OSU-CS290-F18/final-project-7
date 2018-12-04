function createGameHistory(name1,number_of_wins){
    var gameHistory = document.createElement('div');
    var insertedString = name1 + ": " + number_of_wins

    gameHistory.classList.add('game-history');
    var insertedParagraph = document.createElement('b');
    insertedParagraph.textContent = insertedString;
    gameHistory.appendChild(insertedParagraph)


    var historyContainer = document.getElementById("games-won-container");

    historyContainer.appendChild(gameHistory);
}

function clearGameHistory(){
  var historyContainer = document.getElementById("games-won-container");
  while (historyContainer.firstChild) {
    historyContainer.removeChild(historyContainer.lastChild);
  }
}

// MODAL STUFF
var modalBackdrop = document.querySelector('#modal-backdrop');
var sellSomethingModal = document.querySelector('#add-highscore-modal');

var closeModalButton = document.querySelector('#modal-close');
closeModalButton.addEventListener('click', handleCloseModalButtonClick);

var cancelModalButton = document.querySelector('#modal-cancel');
cancelModalButton.addEventListener('click', handleCloseModalButtonClick);

var acceptModalButton = document.querySelector('#modal-accept');
acceptModalButton.addEventListener('click', handleCloseModalButtonClick);


function handleCloseModalButtonClick(event) {
    console.log("Clicked the cancel model button");
    var textBoxContent = document.getElementById('highscore-text-input').value;
    if(event.target.id == 'modal-accept'){
        if(textBoxContent == ' '){
          alert("You did not input a name. Please input a name or cancel.");
        }
        else{
          socket.emit('playerWon', textBoxContent);
        }
    }
    else{

    modalBackdrop.classList.add('hidden');
    sellSomethingModal.classList.add('hidden');

    //Save data
    $.ajax({
  		url: '/restart-game',
  		type: 'POST'
  	});

  }
}


function showModal(event){
  console.log("Showing model");
  modalBackdrop.classList.remove('hidden');
  sellSomethingModal.classList.remove('hidden');
}



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

socket.on('jsonData', function(jsonData) {
  console.log("jsonData", jsonData);
  clearGameHistory();
  for(player in jsonData){
    console.log("Creating game history...");
    createGameHistory(player, jsonData[player].score);
  }
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
    case 32: // space
      socket.emit('playerReady');
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
  context.fillStyle = 'lime';
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

socket.on('score', function(leftPlayerScore, rightPlayerScore) {
  console.log("Player 1: %d    Player 2: %d", leftPlayerScore, rightPlayerScore);
});

socket.on('winner', function(winner) {
  userId = socket.io.engine.id
  if(winner == userId) {
    showModal();
    console.log('you won');
  } else {
    //code for loser
    console.log('you lost');
  }

});
