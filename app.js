const WebSocket = require('ws');

const wss = new WebSocket.Server({ port: process.env.PORT || 3000 });

let clients = new Map();

// Helper function to get IP address of a request
function getIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  return forwarded ? forwarded.split(',')[0] : req.socket.remoteAddress;
}

wss.on('connection', (ws, req) => {
  const ip = getIp(req);

  clients.set(ip, ws);

  // Send the list of connected users to the new client
  ws.send(
    JSON.stringify({ type: 'users', data: Array.from(clients.values()) })
  );

  // Broadcast the updated list to all clients
  const broadcastUserList = () => {
    const ips = Array.from(clients.values());
    const message = JSON.stringify({ type: 'users', data: ips });
    clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  };

  broadcastUserList();

  // Handle client disconnection
  ws.on('close', () => {
    clients.delete(ws);
    broadcastUserList();
  });
});
