const { createClient } = require('@supabase/supabase-js');
const config = require('../config/config');

// Create Supabase client
const supabase = createClient(config.supabase.url, config.supabase.serviceKey);

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
    
    // Verify token with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return res.status(401).json({ error: 'Unauthorized - Invalid token' });
    }
    
    // Add user to request object
    req.user = user;
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