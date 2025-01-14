// Bare-bones WebSocket server in Node.js
const http = require('http');
const WebSocket = require('ws');

const server = http.createServer();
const wss = new WebSocket.Server({ server });

let clients = new Map();

// Helper function to get IP address of a request
function getIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  return forwarded ? forwarded.split(',')[0] : req.socket.remoteAddress;
}

wss.on('connection', (ws, req) => {
  const ip = getIp(req);
  clients.set(ws, ip);

  // Send the list of connected users to the new client
  ws.send(
    JSON.stringify({ type: 'users', data: Array.from(clients.values()) })
  );

  // Broadcast the updated list to all clients
  const broadcastUserList = () => {
    const ips = Array.from(clients.values());
    const message = JSON.stringify({ type: 'users', data: ips });
    clients.forEach((_, client) => {
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

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`WebSocket server running on ws://localhost:${PORT}`);
});
