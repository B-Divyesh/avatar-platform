import { supabase } from "../services/supabaseClient";

/**
 * Register a new user
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @returns {Promise<void>}
 */
export const register = async (req, res) => {
  try {
    const { email, password, userType } = req.body;
    
    // Validate input
    if (!email || !password || !userType) {
      return res.status(400).json({ 
        error: 'Email, password, and user type are required'
      });
    }

    // Validate user type
    if (!['investor', 'freelancer'].includes(userType)) {
      return res.status(400).json({ 
        error: 'User type must be either "investor" or "freelancer"' 
      });
    }
    
    // Check if email already exists
    const { data: existingUser, error: checkError } = await supabase
      .rpc('check_email_exists', { email_to_check: email });
    
    if (checkError) {
      console.error('Error checking email existence:', checkError);
      throw checkError;
    }
    
    if (existingUser) {
      return res.status(400).json({ error: 'Email already exists' });
    }
    
    // Register user with Supabase
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
      console.error('Supabase signup error:', error);
      throw error;
    }
    
    // Initialize profile in database
    try {
      await supabase
        .from('profiles')
        .insert({
          id: data.user.id,
          name: '',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
    } catch (profileError) {
      console.error('Error creating initial profile:', profileError);
      // Continue with registration process
    }
    
    // Determine if email confirmation is required
    const emailConfirmRequired = !data.session;
    
    res.status(201).json({
      message: emailConfirmRequired 
        ? 'Registration successful. Please check your email to confirm your account.'
        : 'User registered successfully',
      user: {
        id: data.user.id,
        email: data.user.email,
        userType: data.user.user_metadata.user_type,
      },
      emailConfirmRequired
    });
  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).json({ error: 'Failed to register user', message: error.message });
  }
};

/**
 * Login a user
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @returns {Promise<void>}
 */
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Validate input
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    
    // Login with Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) {
      console.error('Login error:', error);
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Get user profile
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single();
      
    if (profileError && profileError.code !== 'PGRST116') {
      console.error('Error fetching profile:', profileError);
    }
    
    res.status(200).json({
      message: 'Login successful',
      user: {
        id: data.user.id,
        email: data.user.email,
        userType: data.user.user_metadata.user_type,
        name: profileData?.name || '',
        profileImage: profileData?.profile_image || '',
      },
      token: data.session.access_token,
    });
  } catch (error) {
    console.error('Error logging in:', error);
    res.status(500).json({ error: 'Failed to login', message: error.message });
  }
};

/**
 * Get the current user
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @returns {Promise<void>}
 */
export const getCurrentUser = async (req, res) => {
  try {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    const user = session.user;
    
    // Get user profile
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
      
    if (profileError && profileError.code !== 'PGRST116') {
      console.error('Error fetching profile:', profileError);
    }
    
    res.status(200).json({
      id: user.id,
      email: user.email,
      userType: user.user_metadata?.user_type || 'freelancer',
      name: profileData?.name || user.user_metadata?.name || '',
      bio: profileData?.bio || '',
      profileImage: profileData?.profile_image || '',
      walletAddress: profileData?.wallet_address || '',
      skills: profileData?.skills || [],
      industries: profileData?.industries || [],
      experience: profileData?.experience || [],
      education: profileData?.education || [],
      portfolio: profileData?.portfolio || [],
      createdAt: user.created_at,
    });
  } catch (error) {
    console.error('Error getting current user:', error);
    res.status(500).json({ error: 'Failed to get user', message: error.message });
  }
};

/**
 * Logout a user
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @returns {Promise<void>}
 */
export const logout = async (req, res) => {
  try {
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      throw error;
    }
    
    res.status(200).json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Error logging out:', error);
    res.status(500).json({ error: 'Failed to logout', message: error.message });
  }
};

/**
 * Reset password
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @returns {Promise<void>}
 */
export const resetPassword = async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }
    
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.CLIENT_URL}/reset-password`,
    });
    
    if (error) {
      throw error;
    }
    
    res.status(200).json({ message: 'Password reset email sent' });
  } catch (error) {
    console.error('Error sending reset password email:', error);
    res.status(500).json({ error: 'Failed to send reset email', message: error.message });
  }
};

/**
 * Update password
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @returns {Promise<void>}
 */
export const updatePassword = async (req, res) => {
  try {
    const { password } = req.body;
    
    if (!password) {
      return res.status(400).json({ error: 'New password is required' });
    }
    
    const { error } = await supabase.auth.updateUser({ password });
    
    if (error) {
      throw error;
    }
    
    res.status(200).json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Error updating password:', error);
    res.status(500).json({ error: 'Failed to update password', message: error.message });
  }
};