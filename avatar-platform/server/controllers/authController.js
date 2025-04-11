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
 * Get current user profile data
 */
const getCurrentUser = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get user profile data
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (profileError && profileError.code !== 'PGRST116') {
      throw profileError;
    }
    
    // Get pending matches count
    const userType = req.user.user_metadata.user_type;
    const matchColumn = userType === 'investor' ? 'investor_id' : 'freelancer_id';
    
    const { data: pendingMatches, error: matchesError } = await supabase
      .from('matches')
      .select('id')
      .eq(matchColumn, userId)
      .eq('status', 'pending');
    
    if (matchesError) {
      throw matchesError;
    }
    
    // Prepare response
    const userResponse = {
      id: userId,
      email: req.user.email,
      userType: userType || 'freelancer',
      name: profile?.name || req.user.user_metadata?.name || '',
      bio: profile?.bio || '',
      profileImage: profile?.profile_image || '',
      walletAddress: profile?.wallet_address || '',
      skills: profile?.skills || [],
      industries: profile?.industries || [],
      experience: profile?.experience || [],
      education: profile?.education || [],
      portfolio: profile?.portfolio || [],
      pendingMatches: pendingMatches || [],
      createdAt: req.user.created_at,
    };
    
    res.status(200).json(userResponse);
  } catch (error) {
    console.error('Error in getCurrentUser:', error);
    res.status(500).json({ error: 'Failed to get current user' });
  }
};

/**
 * Update user profile
 */
const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const profileData = req.body;
    
    // Validate input
    if (!profileData) {
      return res.status(400).json({ error: 'Profile data is required' });
    }
    
    // Update profile
    const { data, error } = await supabase
      .from('profiles')
      .upsert({ id: userId, ...profileData, updated_at: new Date() })
      .select()
      .single();
    
    if (error) {
      throw error;
    }
    
    res.status(200).json(data);
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
};

/**
 * Update user wallet address
 */
const updateWalletAddress = async (req, res) => {
  try {
    const userId = req.user.id;
    const { walletAddress } = req.body;
    
    // Validate input
    if (!walletAddress) {
      return res.status(400).json({ error: 'Wallet address is required' });
    }
    
    // Update wallet address
    const { data, error } = await supabase
      .from('profiles')
      .upsert({
        id: userId,
        wallet_address: walletAddress,
        updated_at: new Date()
      })
      .select()
      .single();
    
    if (error) {
      throw error;
    }
    
    res.status(200).json(data);
  } catch (error) {
    console.error('Error updating wallet address:', error);
    res.status(500).json({ error: 'Failed to update wallet address' });
  }
};

/**
 * Register a new user
 */
const register = async (req, res) => {
  try {
    const { email, password, userType } = req.body;
    
    // Validate input
    if (!email || !password || !userType) {
      return res.status(400).json({ 
        error: 'Email, password, and user type are required' 
      });
    }
    
    // Check if email already exists
    const { data: existingUser, error: checkError } = await supabase
      .rpc('check_email_exists', { email_to_check: email });
    
    if (checkError) {
      throw checkError;
    }
    
    if (existingUser) {
      return res.status(400).json({ error: 'Email already exists' });
    }
    
    // Register user
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          user_type: userType, // 'investor' or 'freelancer'
        },
      },
    });
    
    if (error) {
      throw error;
    }
    
    // Create Stream Chat user
    try {
      await streamClient.upsertUser({
        id: data.user.id,
        name: email.split('@')[0],
        email: email,
        role: userType,
      });
    } catch (streamError) {
      console.error('Error creating Stream Chat user:', streamError);
      // Continue with registration even if Stream Chat fails
    }
    
    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: data.user.id,
        email: data.user.email,
        userType: data.user.user_metadata.user_type,
      }
    });
  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).json({ error: 'Failed to register user' });
  }
};

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
    
    // Login user
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
    const streamToken = streamClient.createToken(data.user.id);
    
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
 * Reset password request
 */
const requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;
    
    // Validate input
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }
    
    // Send reset password email
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.CLIENT_URL}/reset-password`,
    });
    
    if (error) {
      throw error;
    }
    
    res.status(200).json({ message: 'Password reset email sent' });
  } catch (error) {
    console.error('Error requesting password reset:', error);
    res.status(500).json({ error: 'Failed to send password reset email' });
  }
};

/**
 * Reset password
 */
const resetPassword = async (req, res) => {
  try {
    const { password } = req.body;
    
    // Validate input
    if (!password) {
      return res.status(400).json({ error: 'New password is required' });
    }
    
    // Update password
    const { error } = await supabase.auth.updateUser({
      password,
    });
    
    if (error) {
      throw error;
    }
    
    res.status(200).json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Error resetting password:', error);
    res.status(500).json({ error: 'Failed to reset password' });
  }
};

/**
 * Logout user
 */
const logout = async (req, res) => {
  try {
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      throw error;
    }
    
    res.status(200).json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Error logging out:', error);
    res.status(500).json({ error: 'Failed to logout' });
  }
};

module.exports = {
  getCurrentUser,
  updateProfile,
  updateWalletAddress,
  register,
  login,
  requestPasswordReset,
  resetPassword,
  logout,
};