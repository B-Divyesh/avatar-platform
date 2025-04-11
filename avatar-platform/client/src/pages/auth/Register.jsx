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
  ToggleButtonGroup,
  ToggleButton,
  Stepper,
  Step,
  StepLabel,
  useTheme,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import {
  Google as GoogleIcon,
  AccountCircle as UserIcon,
  BusinessCenter as InvestorIcon,
  Computer as FreelancerIcon,
  ArrowBack as BackIcon,
  ArrowForward as NextIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  AccountBalanceWallet as WalletIcon,
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

const RegisterBox = styled(Paper)(({ theme }) => ({
  width: "100%",
  maxWidth: "550px",
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

const UserTypeButton = styled(ToggleButton)(({ theme }) => ({
  padding: theme.spacing(2),
  border: `1px solid ${theme.colors.primary.main}`,
  "&.Mui-selected": {
    backgroundColor: theme.colors.primary.main,
    color: theme.colors.text.primary,
    "&:hover": {
      backgroundColor: theme.colors.primary.dark,
    },
  },
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

const WalletButton = styled(Button)(({ theme }) => ({
  padding: theme.spacing(1.5),
  textTransform: "none",
  border: `1px solid ${theme.colors.secondary.main}`,
  color: theme.colors.secondary.main,
  "&:hover": {
    backgroundColor: "rgba(233, 30, 99, 0.08)",
  },
}));

// Main registration component
const Register = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { registerWithEmail, loginWithGoogle, connectWallet } = useAuth();

  // State
  const [activeStep, setActiveStep] = useState(0);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [userType, setUserType] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Steps for registration
  const steps = ["Account Type", "Your Details", "Connect Wallet"];

  // Handle user type selection
  const handleUserTypeChange = (event, newType) => {
    if (newType !== null) {
      setUserType(newType);
    }
  };

  // Handle back button
  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  // Handle next button
  const handleNext = () => {
    // Validate current step
    if (activeStep === 0) {
      if (!userType) {
        setError("Please select an account type.");
        return;
      }
    } else if (activeStep === 1) {
      if (!name || !email || !password || !confirmPassword) {
        setError("Please fill in all required fields.");
        return;
      }

      if (password !== confirmPassword) {
        setError("Passwords do not match.");
        return;
      }

      if (password.length < 8) {
        setError("Password must be at least 8 characters long.");
        return;
      }
    }

    setError("");
    setActiveStep((prevStep) => prevStep + 1);
  };

  // Handle wallet connection
  const handleConnectWallet = async () => {
    try {
      setError("");
      setLoading(true);

      const { address } = await connectWallet();

      setWalletConnected(true);
      setWalletAddress(address);
    } catch (err) {
      console.error("Error connecting wallet:", err);
      setError(
        "Failed to connect wallet. Please make sure you have MetaMask installed."
      );
    } finally {
      setLoading(false);
    }
  };

  // Handle final registration
  const handleRegister = async () => {
    try {
      setError("");
      setLoading(true);

      // Register user with email
      await registerWithEmail(email, password, userType);

      // Navigate based on user type
      if (userType === "investor") {
        navigate("/investor");
      } else {
        navigate("/freelancer");
      }
    } catch (err) {
      console.error("Registration error:", err);
      setError("Failed to register. " + (err.message || "Please try again."));
    } finally {
      setLoading(false);
    }
  };

  // Handle Google registration
  const handleGoogleRegister = async () => {
    try {
      setError("");
      setLoading(true);

      await loginWithGoogle();

      // Navigation happens automatically via auth state change
    } catch (err) {
      console.error("Google login error:", err);
      setError("Failed to sign up with Google. Please try again.");
      setLoading(false);
    }
  };

  // Render step content
  const getStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Box sx={{ mt: 4 }}>
            <Typography variant="h6" gutterBottom>
              What describes you best?
            </Typography>

            <ToggleButtonGroup
              value={userType}
              exclusive
              onChange={handleUserTypeChange}
              aria-label="User Type"
              fullWidth
              sx={{ mt: 2 }}
            >
              <UserTypeButton value="investor" aria-label="investor">
                <Box sx={{ textAlign: "center" }}>
                  <InvestorIcon sx={{ fontSize: 48, mb: 1 }} />
                  <Typography variant="subtitle1">Investor</Typography>
                  <Typography variant="body2" color="text.secondary">
                    I want to invest in projects and freelancers
                  </Typography>
                </Box>
              </UserTypeButton>

              <UserTypeButton value="freelancer" aria-label="freelancer">
                <Box sx={{ textAlign: "center" }}>
                  <FreelancerIcon sx={{ fontSize: 48, mb: 1 }} />
                  <Typography variant="subtitle1">
                    Freelancer/Business
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    I want to showcase my work and find investors
                  </Typography>
                </Box>
              </UserTypeButton>
            </ToggleButtonGroup>

            <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 4 }}>
              <Button
                variant="contained"
                endIcon={<NextIcon />}
                onClick={handleNext}
                sx={{
                  bgcolor: theme.colors.secondary.main,
                  "&:hover": { bgcolor: theme.colors.secondary.dark },
                }}
              >
                Next
              </Button>
            </Box>
          </Box>
        );

      case 1:
        return (
          <Box sx={{ mt: 4 }}>
            <Typography variant="h6" gutterBottom>
              Your Account Details
            </Typography>

            <TextField
              label="Full Name"
              fullWidth
              value={name}
              onChange={(e) => setName(e.target.value)}
              margin="normal"
              variant="outlined"
              required
            />

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

            <Box
              sx={{ display: "flex", justifyContent: "space-between", mt: 4 }}
            >
              <Button
                variant="outlined"
                startIcon={<BackIcon />}
                onClick={handleBack}
              >
                Back
              </Button>

              <Button
                variant="contained"
                endIcon={<NextIcon />}
                onClick={handleNext}
                sx={{
                  bgcolor: theme.colors.secondary.main,
                  "&:hover": { bgcolor: theme.colors.secondary.dark },
                }}
              >
                Next
              </Button>
            </Box>
          </Box>
        );

      case 2:
        return (
          <Box sx={{ mt: 4 }}>
            <Typography variant="h6" gutterBottom>
              Connect Your Wallet
            </Typography>

            <Typography variant="body1" color="text.secondary" paragraph>
              Connecting your wallet allows you to create and manage smart
              contracts on the blockchain.
            </Typography>

            {walletConnected ? (
              <Box
                sx={{
                  mt: 3,
                  mb: 4,
                  p: 2,
                  bgcolor: "rgba(76, 175, 80, 0.1)",
                  borderRadius: 1,
                }}
              >
                <Typography
                  variant="subtitle1"
                  sx={{ color: theme.colors.success.main }}
                >
                  Wallet Connected Successfully
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ wordBreak: "break-all", mt: 1 }}
                >
                  {walletAddress}
                </Typography>
              </Box>
            ) : (
              <WalletButton
                fullWidth
                size="large"
                startIcon={<WalletIcon />}
                onClick={handleConnectWallet}
                disabled={loading}
                sx={{ mt: 2, mb: 4 }}
              >
                {loading ? <CircularProgress size={24} /> : "Connect Wallet"}
              </WalletButton>
            )}

            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              You can skip this step and connect your wallet later.
            </Typography>

            <Box
              sx={{ display: "flex", justifyContent: "space-between", mt: 4 }}
            >
              <Button
                variant="outlined"
                startIcon={<BackIcon />}
                onClick={handleBack}
              >
                Back
              </Button>

              <Button
                variant="contained"
                onClick={handleRegister}
                disabled={loading}
                sx={{
                  bgcolor: theme.colors.secondary.main,
                  "&:hover": { bgcolor: theme.colors.secondary.dark },
                }}
              >
                {loading ? (
                  <CircularProgress size={24} color="inherit" />
                ) : (
                  "Complete Registration"
                )}
              </Button>
            </Box>
          </Box>
        );

      default:
        return "Unknown step";
    }
  };

  return (
    <PageContainer>
      <RegisterBox>
        <Logo>
          <Typography variant="h4" sx={{ color: "#fff", fontWeight: "bold" }}>
            A
          </Typography>
        </Logo>

        <Typography variant="h4" align="center" gutterBottom>
          Create Account
        </Typography>

        <Typography
          variant="body1"
          align="center"
          color="text.secondary"
          sx={{ mb: 4 }}
        >
          Join Avatar to connect, contract, and collaborate on the blockchain
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label, index) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {getStepContent(activeStep)}

        <Divider sx={{ my: 4 }}>
          <Typography variant="body2" color="text.secondary">
            OR
          </Typography>
        </Divider>

        <GoogleButton
          fullWidth
          size="large"
          startIcon={<GoogleIcon />}
          onClick={handleGoogleRegister}
          disabled={loading}
        >
          Sign up with Google
        </GoogleButton>

        <Box sx={{ mt: 4, textAlign: "center" }}>
          <Typography variant="body2" color="text.secondary">
            Already have an account?{" "}
            <Link
              to="/login"
              style={{
                textDecoration: "none",
                color: theme.colors.secondary.main,
              }}
            >
              Sign in
            </Link>
          </Typography>
        </Box>
      </RegisterBox>
    </PageContainer>
  );
};

export default Register;
