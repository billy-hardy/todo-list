var WebSocketServer = require('ws').Server,
    wss = new WebSocketServer({ port: 80);

wss.on('connection', function connection(ws) {
    ws.on('message', function incoming(message) {
        console.log('received: %s', message);
        wss.clients.forEach(function(client) {
            if(ws != client) {
                client.send(message);
            }
        });
    });

    ws.send('something');
});
