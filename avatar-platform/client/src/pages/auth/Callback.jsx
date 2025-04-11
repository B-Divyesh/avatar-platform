import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, CircularProgress, Alert } from '@mui/material';
import { supabase } from '../../services/supabaseClient';
import { useAuth } from '../../context/AuthContext';

const AuthCallback = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [error, setError] = useState(null);
  const [processing, setProcessing] = useState(true);

  useEffect(() => {
    // If already logged in, redirect to appropriate page
    if (currentUser) {
      navigate(currentUser.userType === 'investor' ? '/investor' : '/freelancer');
      return;
    }

    // Handle the OAuth callback
    const handleAuthCallback = async () => {
      try {
        setProcessing(true);
        
        // Get the URL hash and query params
        const hash = window.location.hash;
        const query = new URLSearchParams(window.location.search);
        
        // Check if this is for password reset
        const accessToken = query.get('access_token');
        const refreshToken = query.get('refresh_token');
        const type = query.get('type');
        
        if (accessToken && refreshToken && type === 'recovery') {
          // Handle password reset
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          });
          
          if (error) {
            throw new Error('Invalid or expired reset link');
          }
          
          // Redirect to reset password page
          navigate('/reset-password');
          return;
        }
        
        // Check if we have a hash (OAuth flow)
        if (hash && hash.includes('access_token')) {
          // Wait for the session to be established
          // Supabase Auth should handle this automatically
          setTimeout(() => {
            // Redirect to the home page after a short delay
            // The auth state listener will handle the rest
            navigate('/');
          }, 1000);
          return;
        }
        
        // No auth data in URL, redirect to login
        navigate('/login');
      } catch (err) {
        console.error('Error handling auth callback:', err);
        setError(err.message || 'Failed to process authentication');
        
        // Redirect to login after a delay
        setTimeout(() => navigate('/login'), 3000);
      } finally {
        setProcessing(false);
      }
    };

    handleAuthCallback();
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
        <Alert severity="error" sx={{ maxWidth: '500px', mb: 2 }}>
          {error}
        </Alert>
      ) : null}
      
      <CircularProgress size={60} sx={{ mb: 4 }} />
      <Typography variant="h5" align="center" gutterBottom>
        Processing your login...
      </Typography>
      <Typography variant="body1" align="center" color="text.secondary">
        Please wait while we complete the authentication process.
      </Typography>
    </Box>
  );
};

export default AuthCallback;