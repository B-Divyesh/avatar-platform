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