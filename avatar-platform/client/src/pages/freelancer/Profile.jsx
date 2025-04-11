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
  GitHub as GitHubIcon,
  LinkedIn as LinkedInIcon,
  Language as WebsiteIcon,
  AccountBalanceWallet as WalletIcon,
  Check as VerifiedIcon,
  StarRate as StarIcon,
  Description as ContractIcon,
  Verified as SuccessIcon,
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
const FreelancerProfile = () => {
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
  const [openSkillDialog, setOpenSkillDialog] = useState(false);
  const [openEducationDialog, setOpenEducationDialog] = useState(false);
  const [openExperienceDialog, setOpenExperienceDialog] = useState(false);
  const [openPortfolioDialog, setOpenPortfolioDialog] = useState(false);
  const [skillInput, setSkillInput] = useState("");
  const [educationData, setEducationData] = useState({
    school: "",
    degree: "",
    field: "",
    startDate: "",
    endDate: "",
  });
  const [experienceData, setExperienceData] = useState({
    company: "",
    position: "",
    description: "",
    startDate: "",
    endDate: "",
  });
  const [portfolioData, setPortfolioData] = useState({
    title: "",
    description: "",
    link: "",
    type: "website",
  });

  // Profile form state
  const [profileData, setProfileData] = useState({
    name: currentUser?.name || "",
    bio: currentUser?.bio || "",
    skills: currentUser?.skills || [],
    experience: currentUser?.experience || [],
    education: currentUser?.education || [],
    portfolio: currentUser?.portfolio || [],
  });

  // Initialize profile data when currentUser changes
  useEffect(() => {
    if (currentUser) {
      setProfileData({
        name: currentUser.name || "",
        bio: currentUser.bio || "",
        skills: currentUser.skills || [],
        experience: currentUser.experience || [],
        education: currentUser.education || [],
        portfolio: currentUser.portfolio || [],
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

  // Handle skill dialog
  const handleAddSkill = () => {
    if (!skillInput.trim()) return;

    const updatedSkills = [...profileData.skills, skillInput.trim()];
    setProfileData({
      ...profileData,
      skills: updatedSkills,
    });
    setSkillInput("");
    setOpenSkillDialog(false);
  };

  const handleRemoveSkill = (skillToRemove) => {
    const updatedSkills = profileData.skills.filter(
      (skill) => skill !== skillToRemove
    );
    setProfileData({
      ...profileData,
      skills: updatedSkills,
    });
  };

  // Handle education dialog
  const handleEducationChange = (e) => {
    const { name, value } = e.target;
    setEducationData({
      ...educationData,
      [name]: value,
    });
  };

  const handleAddEducation = () => {
    const updatedEducation = [...profileData.education, educationData];
    setProfileData({
      ...profileData,
      education: updatedEducation,
    });
    setEducationData({
      school: "",
      degree: "",
      field: "",
      startDate: "",
      endDate: "",
    });
    setOpenEducationDialog(false);
  };

  const handleRemoveEducation = (index) => {
    const updatedEducation = [...profileData.education];
    updatedEducation.splice(index, 1);
    setProfileData({
      ...profileData,
      education: updatedEducation,
    });
  };

  // Handle experience dialog
  const handleExperienceChange = (e) => {
    const { name, value } = e.target;
    setExperienceData({
      ...experienceData,
      [name]: value,
    });
  };

  const handleAddExperience = () => {
    const updatedExperience = [...profileData.experience, experienceData];
    setProfileData({
      ...profileData,
      experience: updatedExperience,
    });
    setExperienceData({
      company: "",
      position: "",
      description: "",
      startDate: "",
      endDate: "",
    });
    setOpenExperienceDialog(false);
  };

  const handleRemoveExperience = (index) => {
    const updatedExperience = [...profileData.experience];
    updatedExperience.splice(index, 1);
    setProfileData({
      ...profileData,
      experience: updatedExperience,
    });
  };

  // Handle portfolio dialog
  const handlePortfolioChange = (e) => {
    const { name, value } = e.target;
    setPortfolioData({
      ...portfolioData,
      [name]: value,
    });
  };

  const handleAddPortfolio = () => {
    const updatedPortfolio = [...profileData.portfolio, portfolioData];
    setProfileData({
      ...profileData,
      portfolio: updatedPortfolio,
    });
    setPortfolioData({
      title: "",
      description: "",
      link: "",
      type: "website",
    });
    setOpenPortfolioDialog(false);
  };

  const handleRemovePortfolio = (index) => {
    const updatedPortfolio = [...profileData.portfolio];
    updatedPortfolio.splice(index, 1);
    setProfileData({
      ...profileData,
      portfolio: updatedPortfolio,
    });
  };

  return (
    <>
      <Navigation />
      <Container>
        <Typography variant="h4" gutterBottom>
          My Profile
        </Typography>

        {/* Profile Header */}
        <ProfileHeader>
          <Grid container spacing={3}>
            <Grid item xs={12} md={4} sx={{ textAlign: { xs: "center", md: "left" } }}>
              <Box sx={{ position: "relative", display: "inline-block" }}>
                <Avatar
                  src={currentUser?.profileImage}
                  alt={profileData.name || "User"}
                  sx={{ width: 150, height: 150, mb: 2 }}
                >
                  {profileData.name ? profileData.name.charAt(0) : "U"}
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
                    placeholder="Tell investors about yourself and what you do..."
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
                    {profileData.bio || "Add a bio to tell investors about yourself..."}
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
                      Connect your wallet to create and manage smart contracts
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
            <Tab label="Skills" />
            <Tab label="Experience" />
            <Tab label="Education" />
            <Tab label="Portfolio" />
            <Tab label="Analytics" />
          </Tabs>

          {/* Skills Tab */}
          <TabPanel value={tabValue} index={0}>
            <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
              <Typography variant="h6">Professional Skills</Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setOpenSkillDialog(true)}
                size="small"
                sx={{
                  bgcolor: theme.colors.secondary.main,
                  "&:hover": { bgcolor: theme.colors.secondary.dark },
                }}
              >
                Add Skill
              </Button>
            </Box>

            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
              {profileData.skills.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  No skills added yet. Add skills to help investors find you.
                </Typography>
              ) : (
                profileData.skills.map((skill, index) => (
                  <Chip
                    key={index}
                    label={skill}
                    onDelete={() => handleRemoveSkill(skill)}
                    sx={{ m: 0.5 }}
                  />
                ))
              )}
            </Box>
          </TabPanel>

          {/* Experience Tab */}
          <TabPanel value={tabValue} index={1}>
            <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
              <Typography variant="h6">Work Experience</Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setOpenExperienceDialog(true)}
                size="small"
                sx={{
                  bgcolor: theme.colors.secondary.main,
                  "&:hover": { bgcolor: theme.colors.secondary.dark },
                }}
              >
                Add Experience
              </Button>
            </Box>

            {profileData.experience.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                No experience added yet. Add your work history to showcase your professional background.
              </Typography>
            ) : (
              <List>
                {profileData.experience.map((exp, index) => (
                  <React.Fragment key={index}>
                    <ListItem
                      alignItems="flex-start"
                      secondaryAction={
                        <IconButton
                          edge="end"
                          onClick={() => handleRemoveExperience(index)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      }
                    >
                      <ListItemText
                        primary={
                          <Typography variant="subtitle1">
                            {exp.position} at {exp.company}
                          </Typography>
                        }
                        secondary={
                          <>
                            <Typography variant="body2" component="span">
                              {exp.startDate} - {exp.endDate || "Present"}
                            </Typography>
                            <Typography
                              variant="body2"
                              color="text.secondary"
                              sx={{ display: "block", mt: 1 }}
                            >
                              {exp.description}
                            </Typography>
                          </>
                        }
                      />
                    </ListItem>
                    {index < profileData.experience.length - 1 && (
                      <Divider variant="inset" component="li" />
                    )}
                  </React.Fragment>
                ))}
              </List>
            )}
          </TabPanel>

          {/* Education Tab */}
          <TabPanel value={tabValue} index={2}>
            <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
              <Typography variant="h6">Education</Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setOpenEducationDialog(true)}
                size="small"
                sx={{
                  bgcolor: theme.colors.secondary.main,
                  "&:hover": { bgcolor: theme.colors.secondary.dark },
                }}
              >
                Add Education
              </Button>
            </Box>

            {profileData.education.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                No education added yet. Add your educational background to complete your profile.
              </Typography>
            ) : (
              <List>
                {profileData.education.map((edu, index) => (
                  <React.Fragment key={index}>
                    <ListItem
                      alignItems="flex-start"
                      secondaryAction={
                        <IconButton
                          edge="end"
                          onClick={() => handleRemoveEducation(index)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      }
                    >
                      <ListItemText
                        primary={
                          <Typography variant="subtitle1">
                            {edu.degree} in {edu.field}
                          </Typography>
                        }
                        secondary={
                          <>
                            <Typography variant="body2" component="span">
                              {edu.school}
                            </Typography>
                            <Typography
                              variant="body2"
                              color="text.secondary"
                              sx={{ display: "block" }}
                            >
                              {edu.startDate} - {edu.endDate || "Present"}
                            </Typography>
                          </>
                        }
                      />
                    </ListItem>
                    {index < profileData.education.length - 1 && (
                      <Divider variant="inset" component="li" />
                    )}
                  </React.Fragment>
                ))}
              </List>
            )}
          </TabPanel>

          {/* Portfolio Tab */}
          <TabPanel value={tabValue} index={3}>
            <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
              <Typography variant="h6">Portfolio & Projects</Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setOpenPortfolioDialog(true)}
                size="small"
                sx={{
                  bgcolor: theme.colors.secondary.main,
                  "&:hover": { bgcolor: theme.colors.secondary.dark },
                }}
              >
                Add Project
              </Button>
            </Box>

            {profileData.portfolio.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                No portfolio items added yet. Showcase your work to potential investors.
              </Typography>
            ) : (
              <Grid container spacing={2}>
                {profileData.portfolio.map((item, index) => (
                  <Grid item xs={12} sm={6} md={4} key={index}>
                    <Paper
                      sx={{
                        p: 2,
                        height: "100%",
                        display: "flex",
                        flexDirection: "column",
                        position: "relative",
                      }}
                    >
                      <IconButton
                        size="small"
                        sx={{ position: "absolute", top: 8, right: 8 }}
                        onClick={() => handleRemovePortfolio(index)}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>

                      <Typography variant="h6" gutterBottom>
                        {item.title}
                      </Typography>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mb: 2, flexGrow: 1 }}
                      >
                        {item.description}
                      </Typography>
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                        }}
                      >
                        <Chip
                          label={item.type.charAt(0).toUpperCase() + item.type.slice(1)}
                          size="small"
                        />
                        <IconButton
                          size="small"
                          component="a"
                          href={item.link}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {item.type === "github" ? (
                            <GitHubIcon fontSize="small" />
                          ) : item.type === "linkedin" ? (
                            <LinkedInIcon fontSize="small" />
                          ) : (
                            <WebsiteIcon fontSize="small" />
                          )}
                        </IconButton>
                      </Box>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            )}
          </TabPanel>

          {/* Analytics Tab */}
          <TabPanel value={tabValue} index={4}>
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Profile Analytics
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Track your profile performance and contract statistics.
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
                      {currentUser?.completedContracts || 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Completed Contracts
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
                    <Box sx={{ display: "flex", justifyContent: "center", mb: 1 }}>
                      <Typography variant="h3" sx={{ mr: 0.5 }}>
                        {currentUser?.rating?.toFixed(1) || "0.0"}
                      </Typography>
                      <StarIcon
                        sx={{ color: theme.colors.warning.main, fontSize: 30, mt: 0.8 }}
                      />
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      Average Rating
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
                      {profileData.skills.length || 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Skills Listed
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
                      {walletConnected ? "Yes" : "No"}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Wallet Verified
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>
            </Box>

            <Box>
              <Typography variant="h6" gutterBottom>
                Recent Contracts
              </Typography>
              {currentUser?.completedContracts > 0 ? (
                <List>
                  {/* This would be populated with actual contract data */}
                  <ListItem>
                    <ListItemAvatar>
                      <Avatar>
                        <ContractIcon />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary="Website Development Project"
                      secondary="Completed on Jan 15, 2023 • $5,000"
                    />
                    <Box sx={{ display: "flex", alignItems: "center" }}>
                      <Typography variant="body2" sx={{ mr: 1 }}>
                        Rating:
                      </Typography>
                      <Rating value={4.5} precision={0.5} readOnly size="small" />
                    </Box>
                  </ListItem>
                  <Divider variant="inset" component="li" />
                </List>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No completed contracts yet. Your contract history will appear here once you complete your first project.
                </Typography>
              )}
            </Box>
          </TabPanel>
        </StyledPaper>

        {/* Add Skill Dialog */}
        <Dialog open={openSkillDialog} onClose={() => setOpenSkillDialog(false)}>
          <DialogTitle>Add Skill</DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              label="Skill"
              fullWidth
              variant="outlined"
              value={skillInput}
              onChange={(e) => setSkillInput(e.target.value)}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenSkillDialog(false)}>Cancel</Button>
            <Button onClick={handleAddSkill}>Add</Button>
          </DialogActions>
        </Dialog>

        {/* Add Education Dialog */}
        <Dialog
          open={openEducationDialog}
          onClose={() => setOpenEducationDialog(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Add Education</DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              name="school"
              label="School/University"
              fullWidth
              variant="outlined"
              value={educationData.school}
              onChange={handleEducationChange}
            />
            <TextField
              margin="dense"
              name="degree"
              label="Degree"
              fullWidth
              variant="outlined"
              value={educationData.degree}
              onChange={handleEducationChange}
            />
            <TextField
              margin="dense"
              name="field"
              label="Field of Study"
              fullWidth
              variant="outlined"
              value={educationData.field}
              onChange={handleEducationChange}
            />
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  margin="dense"
                  name="startDate"
                  label="Start Date"
                  fullWidth
                  variant="outlined"
                  value={educationData.startDate}
                  onChange={handleEducationChange}
                  placeholder="YYYY-MM"
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  margin="dense"
                  name="endDate"
                  label="End Date (or expected)"
                  fullWidth
                  variant="outlined"
                  value={educationData.endDate}
                  onChange={handleEducationChange}
                  placeholder="YYYY-MM or Present"
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenEducationDialog(false)}>Cancel</Button>
            <Button onClick={handleAddEducation}>Add</Button>
          </DialogActions>
        </Dialog>

        {/* Add Experience Dialog */}
        <Dialog
          open={openExperienceDialog}
          onClose={() => setOpenExperienceDialog(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Add Experience</DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              name="company"
              label="Company"
              fullWidth
              variant="outlined"
              value={experienceData.company}
              onChange={handleExperienceChange}
            />
            <TextField
              margin="dense"
              name="position"
              label="Position"
              fullWidth
              variant="outlined"
              value={experienceData.position}
              onChange={handleExperienceChange}
            />
            <TextField
              margin="dense"
              name="description"
              label="Description"
              fullWidth
              multiline
              rows={3}
              variant="outlined"
              value={experienceData.description}
              onChange={handleExperienceChange}
            />
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  margin="dense"
                  name="startDate"
                  label="Start Date"
                  fullWidth
                  variant="outlined"
                  value={experienceData.startDate}
                  onChange={handleExperienceChange}
                  placeholder="YYYY-MM"
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  margin="dense"
                  name="endDate"
                  label="End Date"
                  fullWidth
                  variant="outlined"
                  value={experienceData.endDate}
                  onChange={handleExperienceChange}
                  placeholder="YYYY-MM or Present"
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenExperienceDialog(false)}>Cancel</Button>
            <Button onClick={handleAddExperience}>Add</Button>
          </DialogActions>
        </Dialog>

        {/* Add Portfolio Dialog */}
        <Dialog
          open={openPortfolioDialog}
          onClose={() => setOpenPortfolioDialog(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Add Project</DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              name="title"
              label="Project Title"
              fullWidth
              variant="outlined"
              value={portfolioData.title}
              onChange={handlePortfolioChange}
            />
            <TextField
              margin="dense"
              name="description"
              label="Description"
              fullWidth
              multiline
              rows={3}
              variant="outlined"
              value={portfolioData.description}
              onChange={handlePortfolioChange}
            />
            <TextField
              margin="dense"
              name="link"
              label="Link"
              fullWidth
              variant="outlined"
              value={portfolioData.link}
              onChange={handlePortfolioChange}
              placeholder="https://..."
            />
            <FormControl fullWidth margin="dense">
              <InputLabel>Project Type</InputLabel>
              <Select
                name="type"
                value={portfolioData.type}
                onChange={handlePortfolioChange}
                label="Project Type"
              >
                <MenuItem value="website">Website</MenuItem>
                <MenuItem value="github">GitHub</MenuItem>
                <MenuItem value="mobile">Mobile App</MenuItem>
                <MenuItem value="design">Design</MenuItem>
                <MenuItem value="research">Research</MenuItem>
                <MenuItem value="other">Other</MenuItem>
              </Select>
            </FormControl>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenPortfolioDialog(false)}>Cancel</Button>
            <Button onClick={handleAddPortfolio}>Add</Button>
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
      </Container>
    </>
  );
};

export default FreelancerProfile;