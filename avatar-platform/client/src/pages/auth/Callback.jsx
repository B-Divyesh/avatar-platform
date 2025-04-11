// Create client/src/pages/auth/Callback.jsx - Missing OAuth callback handler

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, CircularProgress } from '@mui/material';
import { supabase } from '../../services/supabaseClient';
import { useAuth } from '../../context/AuthContext';

const AuthCallback = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [error, setError] = useState(null);

  useEffect(() => {
    // Handle the OAuth callback
    const handleAuthCallback = async () => {
      try {
        // Get the URL hash (needed for OAuth redirect)
        const hash = window.location.hash;
        
        // Get the query params (needed for email confirmation & password reset)
        const query = new URLSearchParams(window.location.search);
        
        // Check if this is for email confirmation
        const accessToken = query.get('access_token');
        const refreshToken = query.get('refresh_token');
        const type = query.get('type');
        
        if (accessToken && refreshToken && type === 'recovery') {
          // Handle password reset
          await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          });
          
          // Redirect to reset password page
          navigate('/reset-password');
          return;
        }
        
        // For OAuth callback
        if (hash && hash.includes('access_token')) {
          // Supabase Auth will handle this automatically
          // We just need to wait for the session to be established
          const maxAttempts = 10;
          for (let i = 0; i < maxAttempts; i++) {
            const { data } = await supabase.auth.getSession();
            if (data.session) {
              // Redirect based on user type
              if (data.session.user.user_metadata.user_type === 'investor') {
                navigate('/investor');
              } else {
                navigate('/freelancer');
              }
              return;
            }
            
            // Wait before retrying
            await new Promise(resolve => setTimeout(resolve, 500));
          }
          
          setError('Failed to establish session after OAuth login');
        } else {
          // No auth data in URL, redirect to login
          navigate('/login');
        }
      } catch (err) {
        console.error('Error handling auth callback:', err);
        setError('Failed to process authentication');
        // Redirect to login after a delay
        setTimeout(() => navigate('/login'), 3000);
      }
    };

    handleAuthCallback();
  }, [navigate]);

  // If user is already authenticated, redirect to appropriate page
  useEffect(() => {
    if (currentUser) {
      navigate(currentUser.userType === 'investor' ? '/investor' : '/freelancer');
    }
  }, [currentUser, navigate]);

  return (
    <Box 
      sx={{ 
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FFEB3B',
        padding: 2
      }}
    >
      {error ? (
        <Typography color="error" variant="h6" align="center" gutterBottom>
          {error}
        </Typography>
      ) : (
        <>
          <CircularProgress size={60} sx={{ mb: 4 }} />
          <Typography variant="h5" align="center" gutterBottom>
            Processing your login...
          </Typography>
          <Typography variant="body1" align="center" color="text.secondary">
            Please wait while we complete the authentication process.
          </Typography>
        </>
      )}
    </Box>
  );
};

export default AuthCallback;

// Now update App.jsx to include the callback route
// Add this route to client/src/App.jsx

// <Route path="/auth/callback" element={<AuthCallback />} />

// Also fix registerWithEmail in authController.js to properly handle userType

const register = async (req, res) => {
  try {
    const { email, password, userType } = req.body;
    
    // Validate input
    if (!email || !password || !userType) {
      return res.status(400).json({ 
        error: 'Email, password, and user type are required'
        // Continuing from the previous code in authController.js

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
    
    // Create Stream Chat user
    try {
      if (streamClient) {
        await streamClient.upsertUser({
          id: data.user.id,
          name: email.split('@')[0],
          email: email,
          role: userType,
        });
      }
    } catch (streamError) {
      console.error('Error creating Stream Chat user:', streamError);
      // Continue with registration even if Stream Chat fails
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

// Now, update App.jsx to include the full routing with AuthCallback
// In client/src/App.jsx

import React from "react";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate,
} from "react-router-dom";
import { ThemeProvider, CssBaseline } from "@mui/material";
import { StreamChat } from "stream-chat";
import { ChatProvider } from "stream-chat-react";
import { Web3Provider } from "@ethersproject/providers";
import { Web3ReactProvider } from "@web3-react/core";
import { ethers } from "ethers";

// Import theme
import theme from "./theme";

// Auth pages
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import AuthCallback from "./pages/auth/Callback";
import ResetPassword from "./pages/auth/ResetPassword";

// Investor pages
import InvestorHome from "./pages/investor/Home";
import InvestorContracts from "./pages/investor/Contracts";
import InvestorAI from "./pages/investor/AI";
import InvestorMatch from "./pages/investor/Match";
import InvestorProfile from "./pages/investor/Profile";

// Freelancer pages
import FreelancerHome from "./pages/freelancer/Home";
import FreelancerContracts from "./pages/freelancer/Contracts";
import FreelancerAI from "./pages/freelancer/AI";
import FreelancerMatch from "./pages/freelancer/Match";
import FreelancerProfile from "./pages/freelancer/Profile";

// Shared pages
import ContractDetails from "./pages/shared/ContractDetails";
import ProfileView from "./pages/shared/ProfileView";
import Chat from "./pages/shared/Chat";
import NotFound from "./pages/shared/NotFound";

// Contexts
import { AuthProvider, useAuth } from "./context/AuthContext";

// Initialize Stream Chat client - fixed initialization
const chatApiKey = process.env.REACT_APP_STREAM_API_KEY || "mp83mukd32jj";
const chatClient = StreamChat.getInstance(chatApiKey);

// Web3 provider getter - fixed for ethers v6
function getLibrary(provider) {
  return new ethers.BrowserProvider(provider);
}

// Protected Route component
const ProtectedRoute = ({ children }) => {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!currentUser) {
    return <Navigate to="/login" />;
  }

  return children;
};

// User type specific routes
const UserTypeRoute = ({ children, requiredType }) => {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!currentUser) {
    return <Navigate to="/login" />;
  }

  if (currentUser.userType !== requiredType) {
    return (
      <Navigate
        to={currentUser.userType === "investor" ? "/investor" : "/freelancer"}
      />
    );
  }

  return children;
};

function App() {
  return (
    <Web3ReactProvider getLibrary={getLibrary}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <AuthProvider>
          <ChatProvider client={chatClient}>
            <Router>
              <Routes>
                {/* Auth Routes */}
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/auth/callback" element={<AuthCallback />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/forgot-password" element={<ResetPassword isForgot={true} />} />

                {/* Investor Routes */}
                <Route
                  path="/investor"
                  element={
                    <ProtectedRoute>
                      <UserTypeRoute requiredType="investor">
                        <InvestorHome />
                      </UserTypeRoute>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/investor/contracts"
                  element={
                    <ProtectedRoute>
                      <UserTypeRoute requiredType="investor">
                        <InvestorContracts />
                      </UserTypeRoute>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/investor/ai"
                  element={
                    <ProtectedRoute>
                      <UserTypeRoute requiredType="investor">
                        <InvestorAI />
                      </UserTypeRoute>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/investor/match"
                  element={
                    <ProtectedRoute>
                      <UserTypeRoute requiredType="investor">
                        <InvestorMatch />
                      </UserTypeRoute>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/investor/profile"
                  element={
                    <ProtectedRoute>
                      <UserTypeRoute requiredType="investor">
                        <InvestorProfile />
                      </UserTypeRoute>
                    </ProtectedRoute>
                  }
                />

                {/* Freelancer Routes */}
                <Route
                  path="/freelancer"
                  element={
                    <ProtectedRoute>
                      <UserTypeRoute requiredType="freelancer">
                        <FreelancerHome />
                      </UserTypeRoute>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/freelancer/contracts"
                  element={
                    <ProtectedRoute>
                      <UserTypeRoute requiredType="freelancer">
                        <FreelancerContracts />
                      </UserTypeRoute>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/freelancer/ai"
                  element={
                    <ProtectedRoute>
                      <UserTypeRoute requiredType="freelancer">
                        <FreelancerAI />
                      </UserTypeRoute>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/freelancer/match"
                  element={
                    <ProtectedRoute>
                      <UserTypeRoute requiredType="freelancer">
                        <FreelancerMatch />
                      </UserTypeRoute>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/freelancer/profile"
                  element={
                    <ProtectedRoute>
                      <UserTypeRoute requiredType="freelancer">
                        <FreelancerProfile />
                      </UserTypeRoute>
                    </ProtectedRoute>
                  }
                />

                {/* Shared Routes */}
                <Route
                  path="/contract/:id"
                  element={
                    <ProtectedRoute>
                      <ContractDetails />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/profile/:id"
                  element={
                    <ProtectedRoute>
                      <ProfileView />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/chat/:id"
                  element={
                    <ProtectedRoute>
                      <Chat />
                    </ProtectedRoute>
                  }
                />

                {/* Redirect root to appropriate home */}
                <Route 
                  path="/" 
                  element={
                    <Navigate to="/login" />
                  } 
                />

                {/* 404 */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Router>
          </ChatProvider>
        </AuthProvider>
      </ThemeProvider>
    </Web3ReactProvider>
  );
}

export default App;

// Create the ResetPassword component that was missing
// in client/src/pages/auth/ResetPassword.jsx

import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  CircularProgress,
  Alert,
  IconButton,
  useTheme,
  Link as MuiLink,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import {
  LockOutlined as LockIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Email as EmailIcon,
} from "@mui/icons-material";
import { supabase } from "../../services/supabaseClient";
import { resetPassword, updatePassword } from "../../services/authService";

// Styled components
const PageContainer = styled(Box)(({ theme }) => ({
  backgroundColor: theme.colors.background.default,
  minHeight: "100vh",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  padding: theme.spacing(2),
}));

const FormBox = styled(Paper)(({ theme }) => ({
  width: "100%",
  maxWidth: "450px",
  padding: theme.spacing(4),
  backgroundColor: theme.colors.background.paper,
  boxShadow: theme.shadows[3],
}));

const Logo = styled("div")(({ theme }) => ({
  width: "80px",
  height: "80px",
  borderRadius: "50%",
  backgroundColor: theme.colors.secondary.main,
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  margin: "0 auto",
  marginBottom: theme.spacing(3),
}));

// Component for handling both reset password and forgot password
const ResetPassword = ({ isForgot = false }) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  
  // State
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  // Check if we're in password reset flow
  const [isReset, setIsReset] = useState(!isForgot);
  
  useEffect(() => {
    // Check if we're receiving a reset token in the URL
    const query = new URLSearchParams(location.search);
    const accessToken = query.get('access_token');
    
    if (accessToken) {
      // Set the user's session with the access token
      const setSession = async () => {
        try {
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
          });
          
          if (error) {
            console.error('Error setting session:', error);
            setError('Invalid or expired reset link. Please request a new one.');
            setIsReset(false);
          } else {
            setIsReset(true);
          }
        } catch (err) {
          console.error('Error in session setup:', err);
          setError('Failed to set up password reset session');
          setIsReset(false);
        }
      };
      
      setSession();
    }
  }, [location.search]);
  
  // Handle forgot password request
  const handleForgotPassword = async (e) => {
    e.preventDefault();
    
    if (!email) {
      setError("Please enter your email address");
      return;
    }
    
    try {
      setLoading(true);
      setError("");
      
      await resetPassword(email);
      
      setSuccess(`Password reset instructions have been sent to ${email}`);
    } catch (err) {
      console.error("Error requesting password reset:", err);
      setError("Failed to send reset instructions. Please try again.");
    } finally {
      setLoading(false);
    }
  };
  
  // Handle password reset
  const handleResetPassword = async (e) => {
    e.preventDefault();
    
    if (!password || !confirmPassword) {
      setError("Please enter and confirm your new password");
      return;
    }
    
    if (password.length < 8) {
      setError("Password must be at least 8 characters long");
      return;
    }
    
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    
    try {
      setLoading(true);
      setError("");
      
      await updatePassword(password);
      
      setSuccess("Your password has been reset successfully. You can now log in with your new password.");
      
      // Navigate to login after a delay
      setTimeout(() => {
        navigate("/login");
      }, 3000);
    } catch (err) {
      console.error("Error resetting password:", err);
      setError("Failed to reset password. Please try again or request a new reset link.");
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <PageContainer>
      <FormBox>
        <Logo>
          <LockIcon sx={{ color: "#fff", fontSize: 36 }} />
        </Logo>
        
        <Typography variant="h4" align="center" gutterBottom>
          {isReset ? "Reset Password" : "Forgot Password"}
        </Typography>
        
        <Typography
          variant="body1"
          align="center"
          color="text.secondary"
          sx={{ mb: 4 }}
        >
          {isReset 
            ? "Enter your new password below" 
            : "Enter your email and we'll send you instructions to reset your password"}
        </Typography>
        
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}
        
        {success && (
          <Alert severity="success" sx={{ mb: 3 }}>
            {success}
          </Alert>
        )}
        
        {isReset ? (
          <form onSubmit={handleResetPassword}>
            <TextField
              label="New Password"
              type={showPassword ? "text" : "password"}
              fullWidth
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              margin="normal"
              variant="outlined"
              required
              InputProps={{
                endAdornment: (
                  <IconButton
                    aria-label="toggle password visibility"
                    onClick={() => setShowPassword(!showPassword)}
                    edge="end"
                  >
                    {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                  </IconButton>
                ),
              }}
            />
            
            <TextField
              label="Confirm Password"
              type={showPassword ? "text" : "password"}
              fullWidth
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              margin="normal"
              variant="outlined"
              required
            />
            
            <Button
              type="submit"
              variant="contained"
              fullWidth
              size="large"
              disabled={loading}
              sx={{
                mt: 3,
                mb: 2,
                py: 1.5,
                bgcolor: theme.colors.secondary.main,
                "&:hover": { bgcolor: theme.colors.secondary.dark },
              }}
            >
              {loading ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                "Reset Password"
              )}
            </Button>
          </form>
        ) : (
          <form onSubmit={handleForgotPassword}>
            <TextField
              label="Email"
              type="email"
              fullWidth
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              margin="normal"
              variant="outlined"
              required
              InputProps={{
                startAdornment: <EmailIcon sx={{ mr: 1, color: "text.secondary" }} />,
              }}
            />
            
            <Button
              type="submit"
              variant="contained"
              fullWidth
              size="large"
              disabled={loading}
              sx={{
                mt: 3,
                mb: 2,
                py: 1.5,
                bgcolor: theme.colors.secondary.main,
                "&:hover": { bgcolor: theme.colors.secondary.dark },
              }}
            >
              {loading ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                "Send Reset Instructions"
              )}
            </Button>
          </form>
        )}
        
        <Box sx={{ textAlign: "center", mt: 2 }}>
          <MuiLink
            component="button"
            variant="body2"
            onClick={() => navigate("/login")}
            sx={{ cursor: "pointer" }}
          >
            Back to Login
          </MuiLink>
        </Box>
      </FormBox>
    </PageContainer>
  );
};

export default ResetPassword;