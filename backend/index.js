import express from 'express';
import { WebSocketServer } from 'ws';
import http from 'http';
import dotenv from 'dotenv';
import twilio from 'twilio';
import cors from 'cors';
import { VoiceBotEngine } from './engine.js';
import { getDb } from './db.js';

dotenv.config();

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors());

// Initialize DB on startup
getDb().catch(console.error);

// REST APIs
app.get('/api/agents', async (req, res) => {
  try {
    const db = await getDb();
    const agents = await db.all('SELECT * FROM agents');
    res.json(agents);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/agents', async (req, res) => {
  try {
    const { name, role, voice, language, system_prompt } = req.body;
    const db = await getDb();
    const result = await db.run(
      'INSERT INTO agents (name, role, voice, language, system_prompt, status) VALUES (?, ?, ?, ?, ?, ?)',
      [name, role, voice, language, system_prompt, 'Active']
    );
    res.json({ id: result.lastID, name, role, voice, language, system_prompt, status: 'Active' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/calls', async (req, res) => {
  try {
    const db = await getDb();
    const calls = await db.all('SELECT * FROM call_logs ORDER BY created_at DESC');
    res.json(calls);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/stats', async (req, res) => {
  try {
    const db = await getDb();
    const count = await db.get('SELECT COUNT(*) as total FROM call_logs');
    res.json({
      totalCalls: count.total,
      concurrentCalls: 1, // Mock live data
      qualificationRate: '42.8%',
      avgDuration: '2m 14s'
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

const server = http.createServer(app);
const wssMedia = new WebSocketServer({ noServer: true });
const wssStream = new WebSocketServer({ noServer: true });

const PORT = process.env.PORT || 3001; // Port 3001 for backend to avoid conflict with Next.js on 3000

app.post('/incoming', (req, res) => {
  const VoiceResponse = twilio.twiml.VoiceResponse;
  const response = new VoiceResponse();
  const connect = response.connect();
  connect.stream({
    url: `wss://${req.headers.host}/media`,
    track: 'inbound_track'
  });
  response.pause({ length: 120 });
  res.type('text/xml');
  res.send(response.toString());
});

// Upgrade HTTP server to support multiple WS paths
server.on('upgrade', (request, socket, head) => {
  if (request.url === '/media') {
    wssMedia.handleUpgrade(request, socket, head, (ws) => {
      wssMedia.emit('connection', ws, request);
    });
  } else if (request.url === '/stream') {
    wssStream.handleUpgrade(request, socket, head, (ws) => {
      wssStream.emit('connection', ws, request);
    });
  } else {
    socket.destroy();
  }
});

// Twilio PSTN Connections
wssMedia.on('connection', (ws) => {
  console.log('New Twilio WebSocket connection');
  const engine = new VoiceBotEngine(ws, { language: 'en-US' });

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message.toString());
      if (data.event === 'start') {
        console.log(`Stream started: ${data.start.streamSid}`);
      } else if (data.event === 'media') {
        const payload = Buffer.from(data.media.payload, 'base64');
        engine.handleIncomingAudio(payload);
      }
    } catch (e) {
      console.error(e);
    }
  });

  ws.on('close', () => engine.cleanup());
});

// Browser Dashboard Connections (Testing)
wssStream.on('connection', (ws) => {
  console.log('New Browser Dashboard WebSocket connection');
  let engine = null;

  ws.on('message', (message) => {
    if (Buffer.isBuffer(message)) {
      if (engine) engine.handleIncomingAudio(message);
    } else {
      try {
        const data = JSON.parse(message.toString());
        if (data.event === 'start') {
          console.log('Browser test call started with custom script');
          engine = new VoiceBotEngine(ws, { language: 'hi-IN', systemPrompt: data.systemPrompt });
        }
      } catch (e) {
        console.error('Invalid message from browser:', e);
      }
    }
  });

  ws.on('close', () => {
    if (engine) engine.cleanup();
  });
});

server.listen(PORT, () => {
  console.log(`Voice Bot Engine Backend listening on port ${PORT}`);
});
