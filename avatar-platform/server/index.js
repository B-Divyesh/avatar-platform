const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const config = require('./config/config');
const { createClient } = require('@supabase/supabase-js');
const StreamChat = require('stream-chat').StreamChat;

// Import routes
const authRoutes = require('./routes/authRoutes');
const contractRoutes = require('./routes/contractRoutes');
const aiRoutes = require('./routes/aiRoutes');

// Initialize Express app
const app = express();
const PORT = config.port;

// Initialize Supabase client
const supabase = createClient(
  config.supabase.url,
  config.supabase.serviceKey
);

// Initialize Stream Chat client
const streamClient = new StreamChat(
  config.streamChat.apiKey,
  config.streamChat.apiSecret
);

// Middleware
app.use(cors(config.cors));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev')); // Logging

// Attach clients to request object
app.use((req, res, next) => {
  req.supabase = supabase;
  req.streamClient = streamClient;
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/contracts', contractRoutes);
app.use('/api/ai', aiRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date() });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ 
    error: 'Internal server error', 
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Avatar Platform server running on port ${PORT}`);
});

module.exports = app;