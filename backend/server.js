import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';

// Load environment variables
dotenv.config();

// Initialize express and socket.io
const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:5173", // Vite default port
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Check for API key
if (!process.env.GEMINI_API_KEY) {
  console.error('GEMINI_API_KEY is not set in environment variables');
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Store active rooms and their participants
const rooms = new Map();

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Create a new room
  socket.on('create-room', () => {
    const roomId = uuidv4();
    rooms.set(roomId, { users: new Set([socket.id]), drawingData: null });
    socket.join(roomId);
    socket.emit('room-created', roomId);
    console.log(`Room created: ${roomId}`);
  });

  // Join existing room
  socket.on('join-room', (roomId) => {
    const room = rooms.get(roomId);
    if (room) {
      room.users.add(socket.id);
      socket.join(roomId);
      socket.emit('room-joined', roomId);
      if (room.drawingData) {
        socket.emit('canvas-state', room.drawingData);
      }
      console.log(`User ${socket.id} joined room ${roomId}`);
    } else {
      socket.emit('error', 'Room not found');
      console.log(`Failed to join room: ${roomId} (not found)`);
    }
  });

  // Handle drawing events
  socket.on('draw', ({ roomId, drawData }) => {
    const room = rooms.get(roomId);
    if (room) {
      room.drawingData = drawData;
      socket.to(roomId).emit('draw', drawData);
    }
  });

  // Handle canvas reset
  socket.on('canvas-reset', ({ roomId }) => {
    const room = rooms.get(roomId);
    if (room) {
      room.drawingData = null;
      socket.to(roomId).emit('canvas-reset');
      console.log(`Canvas reset in room ${roomId}`);
    }
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    for (const [roomId, room] of rooms.entries()) {
      if (room.users.has(socket.id)) {
        room.users.delete(socket.id);
        if (room.users.size === 0) {
          rooms.delete(roomId);
          console.log(`Room ${roomId} deleted (no users)`);
        }
      }
    }
    console.log('User disconnected:', socket.id);
  });
});

// Analyze image endpoint
app.post('/analyze', async (req, res) => {
  try {
    const { image } = req.body;

    if (!image) {
      return res.status(400).json({ error: 'No image data provided' });
    }

    // Clean the base64 data
    const base64Data = image.split(';base64,').pop();

    // Using the updated model name: gemini-1.5-flash
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    console.log('Making request to Gemini API with gemini-1.5-flash model...');
    
    try {
      const prompt = "Please analyze this image in detail. If it contains mathematical expressions, solve them step by step. If it contains diagrams or drawings, describe them thoroughly. If it contains word games or puzzles, provide the solution with explanation.";
      
      const result = await model.generateContent({
        contents: [{
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType: 'image/png',
                data: base64Data
              }
            }
          ]
        }]
      });

      const response = await result.response;
      const responseText = response.text();
      
      console.log('Successfully received response from Gemini');
      res.json({ result: responseText });
      
    } catch (genError) {
      console.error('Gemini API Error:', genError);
      res.status(500).json({ 
        error: 'Error processing image with Gemini API', 
        details: genError.message 
      });
    }
  } catch (error) {
    console.error('Server Error:', error);
    res.status(500).json({ 
      error: 'Server error while processing request',
      details: error.message 
    });
  }
});

const PORT = 3000;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log('Gemini API Key status:', process.env.GEMINI_API_KEY ? 'Set' : 'Not set');
});