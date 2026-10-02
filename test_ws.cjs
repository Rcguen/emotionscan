const WebSocket = require('ws');
const ws = new WebSocket('wss://api.hume.ai/v0/stream/models?apikey=invalid_key');
ws.on('error', (err) => console.log('Error with apikey:', err.message));
const ws2 = new WebSocket('wss://api.hume.ai/v0/stream/models?api_key=invalid_key');
ws2.on('error', (err) => console.log('Error with api_key:', err.message));
