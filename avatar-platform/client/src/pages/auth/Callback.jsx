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
              if (data.session.user.user_metadata?.user_type === 'investor') {
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