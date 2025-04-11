import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Divider,
  CircularProgress,
  Alert,
  Grid,
  IconButton,
  useTheme,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import {
  Google as GoogleIcon,
  LockOutlined as LockIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
} from "@mui/icons-material";

import { useAuth } from "../../context/AuthContext";

// Styled components
const PageContainer = styled(Box)(({ theme }) => ({
  backgroundColor: theme.colors.background.default,
  minHeight: "100vh",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  padding: theme.spacing(2),
}));

const LoginBox = styled(Paper)(({ theme }) => ({
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

const GoogleButton = styled(Button)(({ theme }) => ({
  backgroundColor: "#ffffff",
  color: theme.colors.text.primary,
  boxShadow: "0px 2px 4px rgba(0, 0, 0, 0.1)",
  padding: theme.spacing(1.5),
  textTransform: "none",
  "&:hover": {
    backgroundColor: "#f5f5f5",
  },
}));

// Main login component
const Login = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { loginWithEmail, loginWithGoogle, connectWallet } = useAuth();

  // State
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Handle email login
  const handleEmailLogin = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      setError("Please enter both email and password.");
      return;
    }

    try {
      setError("");
      setLoading(true);

      const response = await loginWithEmail(email, password);

      // Navigate based on user type
      if (response?.user?.user_metadata?.user_type === "investor") {
        navigate("/investor");
      } else {
        navigate("/freelancer");
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("Failed to sign in. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  // Handle Google login
  const handleGoogleLogin = async () => {
    try {
      setError("");
      setLoading(true);

      await loginWithGoogle();

      // Navigation happens automatically via auth state change
    } catch (err) {
      console.error("Google login error:", err);
      setError("Failed to sign in with Google. Please try again.");
      setLoading(false);
    }
  };

  return (
    <PageContainer>
      <LoginBox>
        <Logo>
          <Typography variant="h4" sx={{ color: "#fff", fontWeight: "bold" }}>
            A
          </Typography>
        </Logo>

        <Typography variant="h4" align="center" gutterBottom>
          Welcome to Avatar
        </Typography>

        <Typography
          variant="body1"
          align="center"
          color="text.secondary"
          sx={{ mb: 4 }}
        >
          The decentralized platform connecting freelancers and investors
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <form onSubmit={handleEmailLogin}>
          <TextField
            label="Email"
            type="email"
            fullWidth
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            margin="normal"
            variant="outlined"
            required
          />

          <TextField
            label="Password"
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

          <Box sx={{ textAlign: "right", mb: 2 }}>
            <Link
              to="/forgot-password"
              style={{
                textDecoration: "none",
                color: theme.colors.secondary.main,
              }}
            >
              <Typography variant="body2">Forgot password?</Typography>
            </Link>
          </Box>

          <Button
            type="submit"
            variant="contained"
            fullWidth
            size="large"
            disabled={loading}
            sx={{
              mt: 2,
              mb: 3,
              py: 1.5,
              bgcolor: theme.colors.secondary.main,
              "&:hover": { bgcolor: theme.colors.secondary.dark },
            }}
          >
            {loading ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              "Sign In"
            )}
          </Button>
        </form>

        <Divider sx={{ my: 3 }}>
          <Typography variant="body2" color="text.secondary">
            OR
          </Typography>
        </Divider>

        <GoogleButton
          fullWidth
          size="large"
          startIcon={<GoogleIcon />}
          onClick={handleGoogleLogin}
          disabled={loading}
        >
          Sign in with Google
        </GoogleButton>

        <Box sx={{ mt: 4, textAlign: "center" }}>
          <Typography variant="body2" color="text.secondary">
            Don't have an account?{" "}
            <Link
              to="/register"
              style={{
                textDecoration: "none",
                color: theme.colors.secondary.main,
              }}
            >
              Sign up
            </Link>
          </Typography>
        </Box>
      </LoginBox>
    </PageContainer>
  );
};

export default Login;
