const config = require('./config.json');
var express = require('express');
const path = require('path');
var fs = require('fs');
var https = require('https');
var ws = require('ws');

const options = {
	key: fs.readFileSync(config.sslKey),
	cert: fs.readFileSync(config.sslCert)
};

var decision;

var usersArray = [];
var users = express();
users.get("/", function (req, res) {
	res.json({ users: usersArray })
});

var page = express();
page.get("/", function (req, res) {
	if (decision == 'lowlatency') {
		res.sendFile(path.join(__dirname, "/public/lowlatency.html"));
	} else if (decision == 'quality') {
		res.sendFile(path.join(__dirname, "/public/quality.html"));
	}
});


var app = express();
app.use(express.static('public'));
app.use("/users", users);
app.use("/", page);

var httpsServer = https.createServer(options, app);
var socketServer = new ws.Server({ server: httpsServer, perMessageDeflate: false });
socketServer.connectionCount = 0;

socketServer.on('connection', function (socket, upgradeReq) {
	var cookies;
	try {
		cookies = Object.fromEntries((upgradeReq || socket.upgradeReq).headers.cookie.split('; ').map(x => x.split(/=(.*)$/, 2).map(decodeURIComponent)))
		if (cookies.streamkey != config.streamKey || !cookies.username) { //Failed authentication
			console.log(`Failed authentication from: ${(upgradeReq || socket.upgradeReq).socket.remoteAddress.replace('::ffff:', '')}`);
			socket.close();
			return;
		} else {
			usersArray.push(cookies.username);
		}
	} catch (err) {
		socket.close();
		return;
	}

	socketServer.connectionCount++;
	console.log(`New user connected to stream: ${cookies.username} - ${(upgradeReq || socket.upgradeReq).socket.remoteAddress.replace('::ffff:', '')}. (${socketServer.connectionCount} total).`);
	socket.on('close', function (code, message) {
		try {
			usersArray.find((user, i) => {
				if (user == cookies.username) {
					usersArray.splice(i, 1); // Find and remove first matching username
				}
			});
		} catch (err) {

		}

		socketServer.connectionCount--;
		console.log(`${cookies.username} disconnected. (${socketServer.connectionCount} total).`);
	});
});
socketServer.broadcast = function (data) {
	socketServer.clients.forEach(function each(client) {
		if (client.readyState === ws.OPEN) {
			client.send(data);
		}
	});
};

httpsServer.listen(config.wsPort);


var streamServer = https.createServer(options, function (request, response) {
	var params = request.url.substr(1).split('/');

	if (params[0] !== config.streamSecret) {
		console.log(`Failed Stream Connection: ${request.socket.remoteAddress.replace('::ffff:', '')}:${request.socket.remotePort} - wrong secret.`);
		response.end();
	}
	if (params[1] == 'lowlatency') {
		decision = 'lowlatency';
		console.log(`Switched to low latency mode.`);
	} else if (params[1] == 'quality') {
		decision = 'quality';
		console.log(`Switched to quality mode.`);
	}  else {
		console.log("No stream type given. Use either lowlatency or quality.");
		process.exit(0);
	}

	response.connection.setTimeout(0);
	console.log(`Successful Stream Connection: ${request.socket.remoteAddress.replace('::ffff:', '')}:${request.socket.remotePort}`);

	request.on('data', function (data) {
		socketServer.broadcast(data);
		if (request.socket.recording) {
			request.socket.recording.write(data);
		}
	});
	request.on('end', function () {
		console.log('Stream Connection closed.');
		if (request.socket.recording) {
			request.socket.recording.close();
		}
	});

})

streamServer.headersTimeout = 0;
streamServer.listen(config.streamPort);


console.log(`Listening for incoming Video Stream on https://127.0.0.1:${config.streamPort}/${config.streamSecret}`);
console.log(`Awaiting WebSocket connections on wss://127.0.0.1:${config.wsPort}/`);