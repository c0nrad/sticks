
var fs = require('fs'),
	net = require('net'),
	stdin = process.stdin,
	stdout = process.stdout;

var count = 0,
	users = {},
	gameNumber = 0,
	turn = "";


var server = net.createServer(function(conn) {
	conn.setEncoding('utf8');
	conn.write(
		'\n > Welcome to Sticks Server!' +
		'\n > There are ' + count + ' other people connected at this time.' +
		'\n > Please write your name and press enter: '
	);

	count++;

	var nickname;

	conn.on('data', function(data) {
		data = data.replace('\r\n', '');

		if (!nickname) {
			if (users[data]) {
				conn.write("Nickname is already in use dumbass \n");
				return;
			} else {
				nickname = data;
				users[nickname] = conn;

				for (var i in users) {
					users[i].write(' > '+ nickname + ' has joined the room. \n');
				}

				users[nickname].write(' > Enter moves in the form "row sticks ex. 1 1" \n');
				users[nickname].write(' > Keep in mind that possible rows are 0,1,2 and sticks are 0-7')

				if (count == 2) {
					broadcastBoard();
					askUserMove(nickname);
					turn = nickname
				}
			}
		} else {
			console.log(nickname + ": " + data)

			if (turn == nickname) {
				row = parseInt(data.split(' ')[0], 10);
				number = parseInt(data.split(' ')[1], 10);
				if (isValidMove(row, number)) {
					console.log(data + " is a valid move");
					broadcast("moved" + data, nickname);
					move(data, nickname);
				} else {
					askUserMove(nickname);
					broadcast(data, nickname);
				}
			} else {
				broadcast(data, nickname);
			}
		}

	});

	conn.on('close', function() {
		count--;
		delete users[nickname];
	});
});

gameState = [3, 5, 7];

function broadcast(data, sender) {
	for (var i in users) {
		if (i != sender) {
			users[i].write(' > ' + sender + ': ' + data + '\n');
		}
	}
}

function broadcastAll(data, sender) {
	for (var i in users) {
		users[i].write(data);
	}
}

function broadcastBoard() {
for (var i in users) {
		printBoard(i);
	}
}

function switchTurn(nickname) {
	console.log("switchTurn: " + nickname);
	for (i in users) {
		console.log(i);
		if (i != nickname) {
			turn = i;
			console.log("Returning:", i)
			return i;
		}
	}
}

function askUserMove(nickname) {
	users[nickname].write(' > Enter your move: ');
}

function printBoard(nickname) {
	userConn = users[nickname];
	userConn.write('\n');
	for (var i in gameState) {
		numSticks = gameState[i];
		spaces = Array(Math.floor((18-numSticks*2 ) / 2)).join(' ');
		userConn.write(numSticks + ":" + spaces +  Array(numSticks+1).join('| ') + spaces + "\n");
	}
	userConn.write('\n');
}

function updateBoard(row, number) {
	gameState[row] -= number;
}

function move(data, nickname) {
	row = parseInt(data.split(' ')[0], 10);
	number = parseInt(data.split(' ')[1], 10);

	if (!isValidMove(row, number)){
		askUserMove(user);
		return;
	}

	console.log("User entered row:", row, " number:", number);
	updateBoard(row, number);

	broadcastBoard();

	if (isGameOver()) {
		broadcastAll("!!!Game over!!! \n");
		broadcastAll(turn + " wins the game!\n");
		broadcastAll("Now gtfo...\n");

		for (var i in users) {
			i.end("");
		}
		return;
	}

	switchTurn(nickname);
	askUserMove(turn);
}

function isValidMove(row, number) {
	console.log("isValidMove: row: ", row, " number: ", number);
	if (isNaN(row) || isNaN(number)) {
		return false;
	}

	if (row >= 3 || row < 0) {
		return false;
	}

	if (gameState[row] < number) {
		return false;
	}

	return true;
}

function isGameOver() {
	if (gameState[0] + gameState[1] + gameState[2] <= 1) {
		return true;
	}
	return false;
}



server.listen(3000, function() {
	console.log("Server listening on *:3000");
})