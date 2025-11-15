import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { Server as SocketIo } from 'socket.io';
import http from 'http';

// Import routes
import streamRoutes from './routes/streams.js';
import alertRoutes from './routes/alerts.js';
import mlRoutes from './routes/ml.js';

// Import ML service
import MLService from './services/mlService.js';

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new SocketIo(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

// Basic middleware
app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:5173",
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
console.log('Connected to Supabase');

// Initialize ML Service
const mlService = new MLService();
mlService.initialize().then(() => {
  console.log('✅ ML Service initialized');
}).catch(err => {
  console.error('❌ ML Service initialization failed:', err);
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('🔌 Client connected:', socket.id);
  
  socket.on('join-stream', (streamId) => {
    socket.join(`stream-${streamId}`);
    console.log(`📺 Client joined stream: ${streamId}`);
  });
  
  socket.on('disconnect', () => {
    console.log('🔌 Client disconnected:', socket.id);
  });
});

// Make io and supabase available to routes
app.use((req, res, next) => {
  req.io = io;
  req.mlService = mlService;
  req.supabase = supabase;
  next();
});

// Routes
app.use('/api/streams', streamRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/ml', mlRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    mlModelLoaded: mlService.isModelLoaded()
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('❌ Error:', err.stack);
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
});

export { app, io, supabase };