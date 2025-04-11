// Fix server/middleware/authMiddleware.js

const { createClient } = require('@supabase/supabase-js');
const config = require('../config/config');

// Create Supabase client
const supabase = createClient(
  config.supabase.url,
  config.supabase.serviceKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

/**
 * Authentication middleware to verify user token
 */
const authMiddleware = async (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized - No token provided' });
    }
    
    const token = authHeader.split(' ')[1];
    
    // Verify token with Supabase using the correct method
    const { data, error } = await supabase.auth.getUser(token);
    
    if (error || !data.user) {
      console.error('Auth error:', error);
      return res.status(401).json({ error: 'Unauthorized - Invalid token' });
    }
    
    // Add user to request object
    req.user = data.user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Role-based authorization middleware
 * @param {string} role - Required role ('investor' or 'freelancer')
 */
const authorizeRole = (role) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized - No user found' });
    }
    
    const userRole = req.user.user_metadata?.user_type;
    
    if (role && userRole !== role) {
      return res.status(403).json({ error: 'Forbidden - Insufficient permissions' });
    }
    
    next();
  };
};

module.exports = {
  authMiddleware,
  authorizeRole,
};

// Fix server/controllers/authController.js - OAuth issues

const { createClient } = require('@supabase/supabase-js');
const config = require('../config/config');
const StreamChat = require('stream-chat').StreamChat;

// Create Supabase client
const supabase = createClient(config.supabase.url, config.supabase.serviceKey);

// Create Stream Chat client
const streamClient = new StreamChat(
  config.streamChat.apiKey,
  config.streamChat.apiSecret
);

/**
 * Login a user
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Validate input
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    
    // Login user with Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) {
      throw error;
    }
    
    // Get profile data
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single();
    
    // Generate Stream Chat token
    let streamToken = null;
    try {
      streamToken = streamClient.createToken(data.user.id);
    } catch (streamError) {
      console.error("Error creating Stream token:", streamError);
      // Continue despite Stream Chat error
    }
    
    res.status(200).json({
      token: data.session.access_token,
      refreshToken: data.session.refresh_token,
      user: {
        id: data.user.id,
        email: data.user.email,
        userType: data.user.user_metadata.user_type,
        name: profile?.name || '',
        profileImage: profile?.profile_image || '',
      },
      streamToken,
    });
  } catch (error) {
    console.error('Error logging in:', error);
    res.status(401).json({ error: 'Invalid credentials' });
  }
};

/**
 * Generate Stream Chat token
 */
const generateStreamToken = async (req, res) => {
  try {
    const userId = req.user.id;
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }
    
    // Create Stream Chat token
    const token = streamClient.createToken(userId);
    
    res.status(200).json({ token });
  } catch (error) {
    console.error('Error generating Stream Chat token:', error);
    res.status(500).json({ error: 'Failed to generate chat token' });
  }
};

// Fix server/index.js - Improved error handling and middleware setup

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

// Initialize Supabase client with better options
const supabase = createClient(
  config.supabase.url,
  config.supabase.serviceKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// Initialize Stream Chat client with proper error handling
let streamClient;
try {
  streamClient = StreamChat.getInstance(
    config.streamChat.apiKey,
    config.streamChat.apiSecret
  );
} catch (error) {
  console.error('Failed to initialize Stream Chat client:', error);
  streamClient = null;
}

// Middleware - improved CORS setup
app.use(cors({
  origin: config.cors.origin,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: config.cors.credentials,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev')); // Logging

// Attach clients to request object with better error handling
app.use((req, res, next) => {
  req.supabase = supabase;
  
  // Only attach streamClient if it was initialized successfully
  if (streamClient) {
    req.streamClient = streamClient;
  }
  
  next();
});

// API Version prefix
const API_PREFIX = '/api';

// Routes
app.use(`${API_PREFIX}/auth`, authRoutes);
app.use(`${API_PREFIX}/contracts`, contractRoutes);
app.use(`${API_PREFIX}/ai`, aiRoutes);

// Health check endpoint
app.get(`${API_PREFIX}/health`, (req, res) => {
  // More detailed health check including service status
  const health = {
    status: 'ok',
    timestamp: new Date(),
    services: {
      supabase: !!supabase,
      streamChat: !!streamClient
    },
    environment: process.env.NODE_ENV || 'development'
  };
  
  res.status(200).json(health);
});

// Global error handler - IMPORTANT ADDITION
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  
  // Determine appropriate status code
  let statusCode = 500;
  if (err.statusCode) {
    statusCode = err.statusCode;
  } else if (err.code === 'ECONNREFUSED') {
    statusCode = 503; // Service Unavailable
  } else if (err.name === 'ValidationError') {
    statusCode = 400; // Bad Request
  }
  
  // Send appropriate error response
  res.status(statusCode).json({ 
    error: 'Server error', 
    message: process.env.NODE_ENV === 'development' ? err.message : 'An unexpected error occurred',
    // Include stack trace only in development
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// 404 handler - place after all routes
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Not found',
    message: `The requested endpoint (${req.method} ${req.path}) was not found`
  });
});

// Graceful shutdown handler
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  // Close database connections, etc.
  process.exit(0);
});

// Start server
app.listen(PORT, () => {
  console.log(`Avatar Platform server running on port ${PORT}`);
});

module.exports = app;