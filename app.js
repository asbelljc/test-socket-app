const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const os = require('os');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

let clients = new Map();

// Helper function to get IP address of a request
function getIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  return forwarded ? forwarded.split(',')[0] : req.connection.remoteAddress;
}

wss.on('connection', (ws, req) => {
  const ip = getIp(req);
  clients.set(ws, ip);

  // Notify all clients of the current user list
  const updateClients = () => {
    const ips = Array.from(clients.values());
    const message = JSON.stringify({ type: 'users', data: ips });
    clients.forEach((_, client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  };

  updateClients();

  // Handle client disconnection
  ws.on('close', () => {
    clients.delete(ws);
    updateClients();
  });
});

app.use(express.static('public'));

module.exports = app;
