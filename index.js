const config = require('./config.json');
var express = require('express');
const path = require('path');
var fs = require('fs');
var https = require('https');
var http = require('http');
var ws = require('ws');
var geoip = require('geoip-lite');


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
	} else {
		res.sendFile(path.join(__dirname, "/public/default.html"));
	}
});


//Redirects from http to https to stop accidental wrong URLs
var redirect = express();
var server = http.createServer(redirect);
redirect.get('*', function (req, res) {
	res.redirect('https://' + req.headers.host + req.url);
})
server.listen(80);


var app = express();
app.use(express.static('public'));
app.use("/users", users);
app.use("/", page);

// var httpsServer = https.createServer(options, app);

var httpsServerForUsers = https.createServer(options);


const uWS = require('uWebSockets.js');
const e = require('express');

const uWSApp = uWS.SSLApp({
// var socketServer = new ws.Server({ server: httpsServer, perMessageDeflate: false });

	/* There are more SSL options, cut for brevity */
	key_file_name: config.sslKey,
	cert_file_name: config.sslCert,
	// passphrase: '1234'
  }).ws('/*', {
  
	/* There are many common helper features */
	compression: 0,
    maxPayloadLength: 16 * 1024 * 1024,
    idleTimeout: 60,

  
	open: (ws) => {
		console.log('A WebSocket connected!');
		ws.subscribe('broadcast');
	  },
	/* For brevity we skip the other events (upgrade, open, ping, pong, close) */
	// message: (ws, message, isBinary) => {
	  /* You can do app.publish('sensors/home/temperature', '22C') kind of pub/sub as well */
	  
	  /* Here we echo the message back, using compression if available */
	//   let ok = ws.send(message, isBinary, true);
	//   ws.publish('broadcast', message, isBinary);
	// },
  	close: (ws, code, message) => {
    	console.log('WebSocket closed');
  	}
	
  }).get('/*', (res, req) => {

	/* It does Http as well */
	res.writeStatus('200 OK').writeHeader('IsExample', 'Yes').end('Hello there!');
	
  }).listen(parseInt(config.wsPort), (token) => {
	if (token) {
	  console.log('Listening to port ' + config.wsPort);
	} else {
		console.log(token)
	  console.log('Failed to listen to port ' + config.wsPort);
	}
	
  });
  


var socketServerUsers = new ws.Server({ server: httpsServerForUsers, perMessageDeflate: false });

// socketServer.connectionCount = 0;

// socketServer.on('connection', function (socket, upgradeReq) {
// 	let cookies;
// 	let location;
// 	try {
// 		location = geoip.lookup((upgradeReq || socket.upgradeReq).socket.remoteAddress.replace('::ffff:', ''));
// 	} catch (err) {
// 		console.log("GeoIP not loaded correctly or key not given.")
// 	}
// 	try {
// 		cookies = Object.fromEntries((upgradeReq || socket.upgradeReq).headers.cookie.split('; ').map(x => x.split(/=(.*)$/, 2).map(decodeURIComponent)))
// 		if (cookies.streamkey != config.streamKey || !cookies.username) { //Failed authentication
// 			console.log(`Failed authentication from: ${(upgradeReq || socket.upgradeReq).socket.remoteAddress.replace('::ffff:', '')} : ${(location) ? (`${location.city}, ${location.region} ${location.country}`) : "(Unknown Location)"}`);
// 			socket.close();
// 			return;
// 		} else {
// 			usersArray.push(cookies.username);
// 			updateUsers();
// 		}
// 	} catch (err) {
// 		socket.close();
// 		return;
// 	}

// 	socketServer.connectionCount++;
// 	console.log(`New user connected to stream: ${cookies.username} - ${(upgradeReq || socket.upgradeReq).socket.remoteAddress.replace('::ffff:', '')} : ${(location) ? (`${location.city}, ${location.region} ${location.country}`) : "(Unknown Location)"}.(${socketServer.connectionCount} total).`);
// 	socket.on('close', function (code, message) {
// 		try {
// 			usersArray.find((user, i) => {
// 				if (user == cookies.username) {
// 					usersArray.splice(i, 1); // Find and remove first matching username
// 					updateUsers();
// 				}
// 			});
// 		} catch (err) {

// 		}

// 		socketServer.connectionCount--;
// 		console.log(`${cookies.username} disconnected (${socketServer.connectionCount} total).`);
// 	});
// });

// socketServer.broadcast = function (data) {
// 	socketServer.clients.forEach(function each(client) {
// 		if (client.readyState === ws.OPEN) {
// 			client.send(data);
// 		}
// 	});
// };


socketServerUsers.connectionCount = 0;

socketServerUsers.on('connection', function (socket, upgradeReq) {
	let cookies;
	let location;
	try {
		location = geoip.lookup((upgradeReq || socket.upgradeReq).socket.remoteAddress.replace('::ffff:', ''));
	} catch (err) {
		console.log("GeoIP not loaded correctly or key not given.")
	}
	try {
		cookies = Object.fromEntries((upgradeReq || socket.upgradeReq).headers.cookie.split('; ').map(x => x.split(/=(.*)$/, 2).map(decodeURIComponent)))
		if (cookies.streamkey != config.streamKey || !cookies.username) { //Failed authentication
			console.log(`Failed authentication from: ${(upgradeReq || socket.upgradeReq).socket.remoteAddress.replace('::ffff:', '')} : ${(location) ? (`${location.city}, ${location.region} ${location.country}`) : "(Unknown Location)"}`);
			// console.log(`Failed authentication from: ${(upgradeReq || socket.upgradeReq).socket.remoteAddress.replace('::ffff:', '')} `);
			socket.close();
			return;
		}
	} catch (err) {
		socket.close();
		return;
	}
	socketServerUsers.connectionCount++;
	updateUsers();

	socket.on('close', function (code, message) {
		socketServerUsers.connectionCount--;
	});
});

function updateUsers() {
	socketServerUsers.clients.forEach(function each(client) {
		if (client.readyState === ws.OPEN) {
			client.send(JSON.stringify(usersArray));
		}
	});
}


// httpsServer.listen(config.wsPort);
httpsServerForUsers.listen(config.wsUsersPort);


var streamServer = https.createServer(options, function (request, response) {
	var params = request.url.substr(1).split('/');
	let location;
	try {
		location = geoip.lookup(request.socket.remoteAddress.replace('::ffff:', ''));
	} catch (err) {
		console.log("GeoIP not loaded correctly or key not given.")
	}
	if (params[0] !== config.streamSecret) {
		console.log(`Failed Stream Connection: ${request.socket.remoteAddress.replace('::ffff:', '')}:${request.socket.remotePort} ${(location) ? (`${location.city}, ${location.region} ${location.country}`) : "(Unknown Location)"} - wrong secret.`);
		response.end();
		return false;
	}
	if (params[1] == 'lowlatency') {
		decision = 'lowlatency';
		console.log(`Switched to low latency mode.`);
	} else if (params[1] == 'quality') {
		decision = 'quality';
		console.log(`Switched to quality mode.`);
	} else {
		console.log("No stream type given. Use either lowlatency or quality.");
		response.end();
		return false;
	}

	response.connection.setTimeout(0);
	// console.log(`Successful Stream Connection: ${request.socket.remoteAddress.replace('::ffff:', '')}:${request.socket.remotePort} `);
	console.log(`Successful Stream Connection: ${request.socket.remoteAddress.replace('::ffff:', '')}:${request.socket.remotePort} ${(location) ? (`${location.city}, ${location.region} ${location.country}`) : "(Unknown Location)"}`);

	request.on('data', function (data) {
		uWSApp.publish('broadcast', data, true);
		// socketServer.broadcast(data);
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
