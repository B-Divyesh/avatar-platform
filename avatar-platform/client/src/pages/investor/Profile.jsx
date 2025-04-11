import React, { useState, useEffect, useRef } from "react";
import {
  Box,
  Grid,
  Typography,
  Paper,
  Avatar,
  Button,
  TextField,
  Chip,
  IconButton,
  CircularProgress,
  Divider,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  Alert,
  Rating,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  useTheme,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import {
  Edit as EditIcon,
  Save as SaveIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  CloudUpload as UploadIcon,
  AccountBalanceWallet as WalletIcon,
  Check as VerifiedIcon,
  StarRate as StarIcon,
  Description as ContractIcon,
  Verified as SuccessIcon,
  Business as BusinessIcon,
} from "@mui/icons-material";

import Navigation from "../components/common/Navigation";
import { useAuth } from "../../context/AuthContext";
import {
  updateProfile,
  uploadProfileImage,
  updateWalletAddress,
} from "../../services/authService";

// Styled components
const Container = styled(Box)(({ theme }) => ({
  backgroundColor: theme.colors.background.default,
  minHeight: "100vh",
  padding: theme.spacing(2),
}));

const ProfileHeader = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  marginBottom: theme.spacing(3),
  backgroundColor: theme.colors.background.paper,
  position: "relative",
}));

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  marginBottom: theme.spacing(3),
  backgroundColor: theme.colors.background.paper,
}));

const WalletConnectButton = styled(Button)(({ theme, connected }) => ({
  backgroundColor: connected ? theme.colors.success.main : theme.colors.primary.main,
  color: "#fff",
  "&:hover": {
    backgroundColor: connected ? theme.colors.success.dark : theme.colors.primary.dark,
  },
}));

const VisuallyHiddenInput = styled("input")({
  clip: "rect(0 0 0 0)",
  clipPath: "inset(50%)",
  height: 1,
  overflow: "hidden",
  position: "absolute",
  bottom: 0,
  left: 0,
  whiteSpace: "nowrap",
  width: 1,
});

const TabPanel = (props) => {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`profile-tabpanel-${index}`}
      aria-labelledby={`profile-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
};

// Main component
const InvestorProfile = () => {
  const theme = useTheme();
  const { currentUser, connectWallet } = useAuth();
  const fileInputRef = useRef(null);

  // State
  const [editing, setEditing] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);
  const [walletLoading, setWalletLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [walletConnected, setWalletConnected] = useState(!!currentUser?.walletAddress);
  const [openIndustryDialog, setOpenIndustryDialog] = useState(false);
  const [industryInput, setIndustryInput] = useState("");
  
  // Profile form state
  const [profileData, setProfileData] = useState({
    name: currentUser?.name || "",
    bio: currentUser?.bio || "",
    industries: currentUser?.industries || [],
    investmentRange: currentUser?.investmentRange || { min: 1000, max: 50000 },
    investmentCriteria: currentUser?.investmentCriteria || "",
  });

  // Initialize profile data when currentUser changes
  useEffect(() => {
    if (currentUser) {
      setProfileData({
        name: currentUser.name || "",
        bio: currentUser.bio || "",
        industries: currentUser.industries || [],
        investmentRange: currentUser.investmentRange || { min: 1000, max: 50000 },
        investmentCriteria: currentUser.investmentCriteria || "",
      });
      setWalletConnected(!!currentUser.walletAddress);
    }
  }, [currentUser]);

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // Handle edit profile
  const handleEditProfile = () => {
    setEditing(true);
  };

  // Handle save profile
  const handleSaveProfile = async () => {
    try {
      setLoading(true);
      setError(null);

      await updateProfile(currentUser.id, profileData);

      setEditing(false);
      setSuccess("Profile updated successfully!");
    } catch (err) {
      console.error("Error updating profile:", err);
      setError("Failed to update profile. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Handle profile image upload
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setImageLoading(true);
      setError(null);

      await uploadProfileImage(currentUser.id, file);

      setSuccess("Profile image updated successfully!");
    } catch (err) {
      console.error("Error uploading image:", err);
      setError("Failed to upload image. Please try again.");
    } finally {
      setImageLoading(false);
    }
  };

  // Handle wallet connection
  const handleConnectWallet = async () => {
    try {
      setWalletLoading(true);
      setError(null);

      const { address } = await connectWallet();

      // Update wallet address in user profile
      await updateWalletAddress(currentUser.id, address);

      setWalletConnected(true);
      setSuccess("Wallet connected successfully!");
    } catch (err) {
      console.error("Error connecting wallet:", err);
      setError(
        err.message || "Failed to connect wallet. Please make sure you have MetaMask installed."
      );
    } finally {
      setWalletLoading(false);
    }
  };

  // Handle basic info change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfileData({
      ...profileData,
      [name]: value,
    });
  };

  // Handle investment range change
  const handleRangeChange = (e) => {
    const { name, value } = e.target;
    setProfileData({
      ...profileData,
      investmentRange: {
        ...profileData.investmentRange,
        [name]: parseInt(value),
      },
    });
  };

  // Handle industry dialog
  const handleAddIndustry = () => {
    if (!industryInput.trim()) return;

    const updatedIndustries = [...profileData.industries, industryInput.trim()];
    setProfileData({
      ...profileData,
      industries: updatedIndustries,
    });
    setIndustryInput("");
    setOpenIndustryDialog(false);
  };

  const handleRemoveIndustry = (industryToRemove) => {
    const updatedIndustries = profileData.industries.filter(
      (industry) => industry !== industryToRemove
    );
    setProfileData({
      ...profileData,
      industries: updatedIndustries,
    });
  };

  // Mock data for the portfolio display
  const investmentPortfolio = [
    {
      id: 1,
      name: "TechStartup Inc.",
      type: "Software Development",
      amount: 25000,
      date: "2023-06-15",
      roi: 12.5,
    },
    {
      id: 2,
      name: "Green Energy Solutions",
      type: "Renewable Energy",
      amount: 35000,
      date: "2023-04-22",
      roi: 8.2,
    },
    {
      id: 3,
      name: "HealthTech Innovations",
      type: "Healthcare",
      amount: 15000,
      date: "2023-02-10",
      roi: 15.7,
    },
  ];

  return (
    <>
      <Navigation />
      <Container>
        <Typography variant="h4" gutterBottom>
          Investor Profile
        </Typography>

        {/* Profile Header */}
        <ProfileHeader>
          <Grid container spacing={3}>
            <Grid item xs={12} md={4} sx={{ textAlign: { xs: "center", md: "left" } }}>
              <Box sx={{ position: "relative", display: "inline-block" }}>
                <Avatar
                  src={currentUser?.profileImage}
                  alt={profileData.name || "Investor"}
                  sx={{ width: 150, height: 150, mb: 2 }}
                >
                  {profileData.name ? profileData.name.charAt(0) : "I"}
                </Avatar>
                {imageLoading && (
                  <CircularProgress
                    size={30}
                    sx={{
                      position: "absolute",
                      top: "50%",
                      left: "50%",
                      marginTop: "-15px",
                      marginLeft: "-15px",
                    }}
                  />
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  style={{ display: "none" }}
                />
                <Button
                  variant="outlined"
                  startIcon={<UploadIcon />}
                  onClick={() => fileInputRef.current.click()}
                  sx={{ mt: 1 }}
                  disabled={imageLoading}
                >
                  Upload Photo
                </Button>
              </Box>
            </Grid>
            <Grid item xs={12} md={8}>
              {editing ? (
                <>
                  <TextField
                    name="name"
                    label="Name"
                    fullWidth
                    value={profileData.name}
                    onChange={handleInputChange}
                    margin="normal"
                    variant="outlined"
                  />
                  <TextField
                    name="bio"
                    label="Bio"
                    fullWidth
                    multiline
                    rows={4}
                    value={profileData.bio}
                    onChange={handleInputChange}
                    margin="normal"
                    variant="outlined"
                    placeholder="Describe your investment interests and background..."
                  />
                  <Box sx={{ mt: 2, display: "flex", justifyContent: "flex-end" }}>
                    <Button
                      onClick={() => setEditing(false)}
                      sx={{ mr: 1 }}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="contained"
                      startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
                      onClick={handleSaveProfile}
                      disabled={loading}
                      sx={{
                        bgcolor: theme.colors.secondary.main,
                        "&:hover": { bgcolor: theme.colors.secondary.dark },
                      }}
                    >
                      Save
                    </Button>
                  </Box>
                </>
              ) : (
                <>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <Typography variant="h4" gutterBottom>
                      {profileData.name || "Your Name"}
                    </Typography>
                    <Button
                      variant="outlined"
                      startIcon={<EditIcon />}
                      onClick={handleEditProfile}
                    >
                      Edit Profile
                    </Button>
                  </Box>
                  <Typography variant="body1" paragraph>
                    {profileData.bio || "Add a bio to tell freelancers and founders about your investment interests..."}
                  </Typography>
                </>
              )}

              {/* Wallet Connection */}
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  mt: 2,
                  p: 2,
                  backgroundColor: "rgba(0,0,0,0.02)",
                  borderRadius: theme.shape.borderRadius,
                }}
              >
                <Box sx={{ mr: 2 }}>
                  <WalletIcon color={walletConnected ? "success" : "action"} />
                </Box>
                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="subtitle1">
                    Ethereum Wallet
                  </Typography>
                  {walletConnected ? (
                    <Typography
                      variant="body2"
                      sx={{
                        fontFamily: "monospace",
                        display: "flex",
                        alignItems: "center",
                      }}
                    >
                      {currentUser?.walletAddress}
                      <VerifiedIcon
                        color="success"
                        fontSize="small"
                        sx={{ ml: 1 }}
                      />
                    </Typography>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      Connect your wallet to create and fund smart contracts
                    </Typography>
                  )}
                </Box>
                <WalletConnectButton
                  variant="contained"
                  startIcon={
                    walletLoading ? (
                      <CircularProgress size={20} color="inherit" />
                    ) : walletConnected ? (
                      <SuccessIcon />
                    ) : (
                      <WalletIcon />
                    )
                  }
                  onClick={handleConnectWallet}
                  disabled={walletLoading || walletConnected}
                  connected={walletConnected}
                >
                  {walletConnected
                    ? "Connected"
                    : walletLoading
                    ? "Connecting..."
                    : "Connect Wallet"}
                </WalletConnectButton>
              </Box>
            </Grid>
          </Grid>
        </ProfileHeader>

        {/* Profile Content */}
        <StyledPaper>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            textColor="secondary"
            indicatorColor="secondary"
            sx={{ borderBottom: 1, borderColor: "divider" }}
          >
            <Tab label="Investment Preferences" />
            <Tab label="Portfolio" />
            <Tab label="Analytics" />
          </Tabs>

          {/* Investment Preferences Tab */}
          <TabPanel value={tabValue} index={0}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Box>
                  <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
                    <Typography variant="h6">Industries of Interest</Typography>
                    <Button
                      variant="contained"
                      startIcon={<AddIcon />}
                      onClick={() => setOpenIndustryDialog(true)}
                      size="small"
                      sx={{
                        bgcolor: theme.colors.secondary.main,
                        "&:hover": { bgcolor: theme.colors.secondary.dark },
                      }}
                    >
                      Add Industry
                    </Button>
                  </Box>

                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                    {profileData.industries.length === 0 ? (
                      <Typography variant="body2" color="text.secondary">
                        No industries added yet. Add industries you're interested in investing in.
                      </Typography>
                    ) : (
                      profileData.industries.map((industry, index) => (
                        <Chip
                          key={index}
                          label={industry}
                          onDelete={() => handleRemoveIndustry(industry)}
                          sx={{ m: 0.5 }}
                        />
                      ))
                    )}
                  </Box>
                </Box>
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>
                  Investment Range
                </Typography>
                
                {editing ? (
                  <Box sx={{ mt: 2 }}>
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <TextField
                          label="Minimum ($)"
                          type="number"
                          name="min"
                          value={profileData.investmentRange.min}
                          onChange={handleRangeChange}
                          fullWidth
                        />
                      </Grid>
                      <Grid item xs={6}>
                        <TextField
                          label="Maximum ($)"
                          type="number"
                          name="max"
                          value={profileData.investmentRange.max}
                          onChange={handleRangeChange}
                          fullWidth
                        />
                      </Grid>
                    </Grid>
                  </Box>
                ) : (
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      p: 2,
                      bgcolor: "rgba(0,0,0,0.02)",
                      borderRadius: 1,
                    }}
                  >
                    <Typography variant="h5" sx={{ fontWeight: "bold" }}>
                      ${profileData.investmentRange.min.toLocaleString()} - ${profileData.investmentRange.max.toLocaleString()}
                    </Typography>
                  </Box>
                )}
              </Grid>

              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Investment Criteria
                </Typography>
                
                {editing ? (
                  <TextField
                    name="investmentCriteria"
                    multiline
                    rows={4}
                    value={profileData.investmentCriteria}
                    onChange={handleInputChange}
                    fullWidth
                    placeholder="Describe what you look for in potential investments..."
                  />
                ) : (
                  <Typography variant="body1">
                    {profileData.investmentCriteria || "No investment criteria specified yet."}
                  </Typography>
                )}
              </Grid>
            </Grid>
          </TabPanel>

          {/* Portfolio Tab */}
          <TabPanel value={tabValue} index={1}>
            <Typography variant="h6" gutterBottom>
              Investment Portfolio
            </Typography>

            {investmentPortfolio.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                No investments yet. Your investment portfolio will appear here once you make your first investment.
              </Typography>
            ) : (
              <Box sx={{ mt: 2 }}>
                <Grid container spacing={3}>
                  {investmentPortfolio.map((investment) => (
                    <Grid item xs={12} md={4} key={investment.id}>
                      <Paper sx={{ p: 2, height: "100%" }}>
                        <Typography variant="h6">{investment.name}</Typography>
                        <Chip
                          label={investment.type}
                          size="small"
                          sx={{ mt: 1, mb: 2 }}
                        />
                        <Divider sx={{ my: 1 }} />
                        <Grid container spacing={1}>
                          <Grid item xs={6}>
                            <Typography variant="caption" color="text.secondary">
                              Investment
                            </Typography>
                            <Typography variant="subtitle1">
                              ${investment.amount.toLocaleString()}
                            </Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography variant="caption" color="text.secondary" align="right" display="block">
                              ROI
                            </Typography>
                            <Typography
                              variant="subtitle1"
                              color="success.main"
                              align="right"
                            >
                              +{investment.roi}%
                            </Typography>
                          </Grid>
                        </Grid>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ mt: 1, display: "block" }}
                        >
                          Invested on {new Date(investment.date).toLocaleDateString()}
                        </Typography>
                      </Paper>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            )}
          </TabPanel>

          {/* Analytics Tab */}
          <TabPanel value={tabValue} index={2}>
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Investment Analytics
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Track your investment performance and contract statistics.
              </Typography>

              <Grid container spacing={3}>
                <Grid item xs={12} sm={6} md={3}>
                  <Paper
                    sx={{
                      p: 2,
                      textAlign: "center",
                      height: "100%",
                      bgcolor: "rgba(233, 30, 99, 0.08)",
                    }}
                  >
                    <Typography variant="h3" sx={{ mb: 1 }}>
                      {investmentPortfolio.length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Active Investments
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Paper
                    sx={{
                      p: 2,
                      textAlign: "center",
                      height: "100%",
                      bgcolor: "rgba(255, 235, 59, 0.08)",
                    }}
                  >
                    <Typography variant="h3" sx={{ mb: 1 }}>
                      ${investmentPortfolio.reduce((sum, inv) => sum + inv.amount, 0).toLocaleString()}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Invested
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Paper
                    sx={{
                      p: 2,
                      textAlign: "center",
                      height: "100%",
                      bgcolor: "rgba(33, 150, 243, 0.08)",
                    }}
                  >
                    <Typography variant="h3" sx={{ mb: 1 }}>
                      {profileData.industries.length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Industries
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Paper
                    sx={{
                      p: 2,
                      textAlign: "center",
                      height: "100%",
                      bgcolor: "rgba(76, 175, 80, 0.08)",
                    }}
                  >
                    <Typography variant="h3" sx={{ mb: 1 }}>
                      {(investmentPortfolio.reduce((sum, inv) => sum + inv.roi, 0) / investmentPortfolio.length).toFixed(1)}%
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Avg. ROI
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>
            </Box>

            <Box>
              <Typography variant="h6" gutterBottom>
                Recent Activity
              </Typography>
              <List>
                <ListItem>
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: theme.colors.primary.main }}>
                      <BusinessIcon />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary="New Investment in HealthTech Innovations"
                    secondary="3 days ago • $15,000"
                  />
                </ListItem>
                <Divider variant="inset" component="li" />
                <ListItem>
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: theme.colors.secondary.main }}>
                      <ContractIcon />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary="Smart Contract Completed"
                    secondary="1 week ago • Green Energy Solutions"
                  />
                </ListItem>
                <Divider variant="inset" component="li" />
                <ListItem>
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: theme.colors.success.main }}>
                      <SuccessIcon />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary="ROI Goal Reached"
                    secondary="2 weeks ago • TechStartup Inc. reached 12.5% ROI"
                  />
                </ListItem>
              </List>
            </Box>
          </TabPanel>
        </StyledPaper>
      </Container>

      {/* Add Industry Dialog */}
      <Dialog open={openIndustryDialog} onClose={() => setOpenIndustryDialog(false)}>
        <DialogTitle>Add Industry</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Industry"
            fullWidth
            variant="outlined"
            value={industryInput}
            onChange={(e) => setIndustryInput(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenIndustryDialog(false)}>Cancel</Button>
          <Button onClick={handleAddIndustry}>Add</Button>
        </DialogActions>
      </Dialog>

      {/* Error Snackbar */}
      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError(null)}
      >
        <Alert
          onClose={() => setError(null)}
          severity="error"
          sx={{ width: "100%" }}
        >
          {error}
        </Alert>
      </Snackbar>

      {/* Success Snackbar */}
      <Snackbar
        open={!!success}
        autoHideDuration={6000}
        onClose={() => setSuccess(null)}
      >
        <Alert
          onClose={() => setSuccess(null)}
          severity="success"
          sx={{ width: "100%" }}
        >
          {success}
        </Alert>
      </Snackbar>
    </>
  );
};

export default InvestorProfile;