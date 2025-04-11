import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box,
  Grid,
  Typography,
  Paper,
  Avatar,
  Button,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Rating,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  CircularProgress,
  Snackbar,
  Alert,
  Skeleton,
  useTheme,
  IconButton,
  Tooltip,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import {
  Star as StarIcon,
  Business as BusinessIcon,
  School as SchoolIcon,
  Work as WorkIcon,
  Code as CodeIcon,
  Category as CategoryIcon,
  Chat as ChatIcon,
  ThumbUp as MatchIcon,
  AccountBalanceWallet as WalletIcon,
  VerifiedUser as VerifiedIcon,
  ArrowBack as BackIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  Download as DownloadIcon,
  Link as LinkIcon,
  GitHub as GitHubIcon,
} from "@mui/icons-material";

import Navigation from "../../components/Navigation";
import SmartContractCard from "../../components/SmartContractCard";
import { useAuth } from "../../context/AuthContext";
import { getUserById } from "../../services/userService";
import { requestMatch, getMatchStatus } from "../../services/matchService";
import { getUserContracts } from "../../services/contractService";

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

const PortfolioItem = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  height: "100%",
  display: "flex",
  flexDirection: "column",
  position: "relative",
}));

const InfoBox = styled(Box)(({ theme }) => ({
  backgroundColor: "rgba(0,0,0,0.02)",
  borderRadius: theme.shape.borderRadius,
  padding: theme.spacing(2),
  marginBottom: theme.spacing(2),
}));

const MatchButton = styled(Button)(({ theme, matched }) => ({
  backgroundColor: matched
    ? theme.colors.success.main
    : theme.colors.secondary.main,
  color: "#fff",
  "&:hover": {
    backgroundColor: matched
      ? theme.colors.success.dark
      : theme.colors.secondary.dark,
  },
}));

// Main component
const ProfileView = () => {
  const theme = useTheme();
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  // State
  const [profile, setProfile] = useState(null);
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [matchStatus, setMatchStatus] = useState({ status: "none", matchId: null });
  const [matchLoading, setMatchLoading] = useState(false);
  const [matchDialogOpen, setMatchDialogOpen] = useState(false);
  const [hireDialogOpen, setHireDialogOpen] = useState(false);

  // Check if viewing freelancer or investor
  const isViewingFreelancer = () => {
    return profile?.userType === "freelancer";
  };

  // Check if current user is opposite type of viewed profile
  const isOppositeType = () => {
    if (!currentUser || !profile) return false;
    return (
      (currentUser.userType === "investor" && profile.userType === "freelancer") ||
      (currentUser.userType === "freelancer" && profile.userType === "investor")
    );
  };

  // Fetch profile data
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const userData = await getUserById(id);
        setProfile(userData);

        // Fetch contracts for this user
        const contractsData = await getUserContracts(id);
        setContracts(contractsData);

        // Check match status if opposite types
        if (currentUser && currentUser.id !== id) {
          const status = await getMatchStatus(id);
          setMatchStatus(status);
        }
      } catch (err) {
        console.error("Error fetching profile:", err);
        setError("Failed to load profile. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [id, currentUser]);

  // Handle request match
  const handleRequestMatch = async () => {
    try {
      setMatchLoading(true);
      await requestMatch(id, currentUser.userType);
      setMatchStatus({ status: "pending", matchId: Date.now().toString() });
      setSuccess(
        `Match request sent to ${profile.name || "user"}. You'll be notified when they respond.`
      );
      setMatchDialogOpen(false);
    } catch (err) {
      console.error("Error requesting match:", err);
      setError("Failed to send match request. Please try again.");
    } finally {
      setMatchLoading(false);
    }
  };

  // Handle hire
  const handleHire = () => {
    // Navigate to contracts page with pre-filled data
    navigate(`/${currentUser.userType}/contracts`, {
      state: { createNew: true, freelancerId: id },
    });
  };

  // Handle chat
  const handleChat = () => {
    navigate(`/chat/${id}`);
  };

  // Handle back
  const handleBack = () => {
    navigate(-1);
  };

  // Handle portfolio item click
  const handlePortfolioClick = (link) => {
    if (link) {
      window.open(link, "_blank");
    }
  };

  // Render loading state
  if (loading) {
    return (
      <>
        <Navigation />
        <Container>
          <ProfileHeader>
            <Grid container spacing={3}>
              <Grid item xs={12} md={3} sx={{ textAlign: "center" }}>
                <Skeleton variant="circular" width={150} height={150} sx={{ mx: "auto" }} />
              </Grid>
              <Grid item xs={12} md={9}>
                <Skeleton variant="text" width="60%" height={60} />
                <Skeleton variant="text" width="40%" height={30} sx={{ mb: 2 }} />
                <Skeleton variant="rectangular" height={100} />
              </Grid>
            </Grid>
          </ProfileHeader>
          <StyledPaper>
            <Skeleton variant="text" width="30%" height={40} />
            <Skeleton variant="rectangular" height={200} sx={{ my: 2 }} />
          </StyledPaper>
        </Container>
      </>
    );
  }

  if (!profile) {
    return (
      <>
        <Navigation />
        <Container>
          <StyledPaper>
            <Typography variant="h5" align="center" sx={{ py: 4 }}>
              Profile not found or you don't have permission to view it.
            </Typography>
            <Box sx={{ display: "flex", justifyContent: "center" }}>
              <Button
                variant="outlined"
                startIcon={<BackIcon />}
                onClick={handleBack}
              >
                Go Back
              </Button>
            </Box>
          </StyledPaper>
        </Container>
      </>
    );
  }

  return (
    <>
      <Navigation />
      <Container>
        <Button
          startIcon={<BackIcon />}
          onClick={handleBack}
          sx={{ mb: 2 }}
        >
          Back
        </Button>

        <ProfileHeader>
          <Grid container spacing={3}>
            <Grid item xs={12} md={3} sx={{ textAlign: { xs: "center", md: "left" } }}>
              <Avatar
                src={profile.profileImage}
                alt={profile.name}
                sx={{ width: 150, height: 150, mx: { xs: "auto", md: 0 }, mb: 2 }}
              >
                {profile.name ? profile.name.charAt(0) : "U"}
              </Avatar>
              {profile.walletAddress && (
                <Chip
                  icon={<VerifiedIcon />}
                  label="Verified"
                  color="success"
                  variant="outlined"
                />
              )}
            </Grid>

            <Grid item xs={12} md={6}>
              <Typography variant="h4" gutterBottom>
                {profile.name}
              </Typography>
              <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                <Chip
                  label={profile.userType === "freelancer" ? "Freelancer" : "Investor"}
                  color="primary"
                  size="small"
                  sx={{ mr: 1 }}
                />
                {profile.rating > 0 && (
                  <Box sx={{ display: "flex", alignItems: "center" }}>
                    <Rating
                      value={profile.rating}
                      precision={0.5}
                      readOnly
                      size="small"
                    />
                    <Typography variant="body2" sx={{ ml: 0.5 }}>
                      ({profile.ratingsCount})
                    </Typography>
                  </Box>
                )}
              </Box>
              <Typography variant="body1" paragraph>
                {profile.bio || "No bio available."}
              </Typography>
              {isViewingFreelancer() ? (
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, mt: 2 }}>
                  {profile.skills.map((skill, index) => (
                    <Chip key={index} label={skill} size="small" />
                  ))}
                </Box>
              ) : (
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, mt: 2 }}>
                  {profile.industries.map((industry, index) => (
                    <Chip key={index} label={industry} size="small" />
                  ))}
                </Box>
              )}
            </Grid>

            <Grid item xs={12} md={3}>
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 1,
                  alignItems: { xs: "center", md: "flex-end" },
                }}
              >
                {isOppositeType() && (
                  <>
                    {matchStatus.status === "accepted" ? (
                      <Button
                        variant="contained"
                        startIcon={<ChatIcon />}
                        onClick={handleChat}
                        sx={{
                          bgcolor: theme.colors.secondary.main,
                          "&:hover": { bgcolor: theme.colors.secondary.dark },
                        }}
                      >
                        Chat
                      </Button>
                    ) : matchStatus.status === "pending" ? (
                      <Button
                        variant="outlined"
                        startIcon={<MatchIcon />}
                        disabled
                      >
                        Request Pending
                      </Button>
                    ) : (
                      <MatchButton
                        variant="contained"
                        startIcon={<MatchIcon />}
                        matched={false}
                        onClick={() => setMatchDialogOpen(true)}
                      >
                        Request Match
                      </MatchButton>
                    )}

                    {currentUser.userType === "investor" &&
                      profile.userType === "freelancer" && (
                        <Button
                          variant="outlined"
                          onClick={() => setHireDialogOpen(true)}
                          sx={{ mt: 1 }}
                        >
                          Create Contract
                        </Button>
                      )}
                  </>
                )}

                <Box
                  sx={{
                    bgcolor: "rgba(0,0,0,0.03)",
                    px: 2,
                    py: 1,
                    borderRadius: 1,
                    mt: 2,
                    textAlign: "center",
                  }}
                >
                  <Typography variant="body2" color="text.secondary">
                    Member since
                  </Typography>
                  <Typography variant="body1">
                    {new Date(profile.createdAt).toLocaleDateString()}
                  </Typography>
                </Box>

                {profile.walletAddress && (
                  <Box
                    sx={{
                      bgcolor: "rgba(0,0,0,0.03)",
                      px: 2,
                      py: 1,
                      borderRadius: 1,
                      mt: 1,
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    <WalletIcon color="success" sx={{ mr: 1 }} />
                    <Typography variant="body2" noWrap>
                      Blockchain Verified
                    </Typography>
                  </Box>
                )}
              </Box>
            </Grid>
          </Grid>
        </ProfileHeader>

        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            {isViewingFreelancer() ? (
              <>
                {/* Freelancer sections */}
                {profile.experience && profile.experience.length > 0 && (
                  <StyledPaper>
                    <Typography variant="h6" gutterBottom sx={{ display: "flex", alignItems: "center" }}>
                      <WorkIcon sx={{ mr: 1 }} /> Experience
                    </Typography>
                    <List>
                      {profile.experience.map((exp, index) => (
                        <React.Fragment key={index}>
                          <ListItem alignItems="flex-start">
                            <ListItemAvatar>
                              <Avatar sx={{ bgcolor: theme.colors.primary.main }}>
                                <BusinessIcon />
                              </Avatar>
                            </ListItemAvatar>
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
                          {index < profile.experience.length - 1 && (
                            <Divider variant="inset" component="li" />
                          )}
                        </React.Fragment>
                      ))}
                    </List>
                  </StyledPaper>
                )}

                {profile.education && profile.education.length > 0 && (
                  <StyledPaper>
                    <Typography variant="h6" gutterBottom sx={{ display: "flex", alignItems: "center" }}>
                      <SchoolIcon sx={{ mr: 1 }} /> Education
                    </Typography>
                    <List>
                      {profile.education.map((edu, index) => (
                        <React.Fragment key={index}>
                          <ListItem alignItems="flex-start">
                            <ListItemAvatar>
                              <Avatar sx={{ bgcolor: theme.colors.primary.main }}>
                                <SchoolIcon />
                              </Avatar>
                            </ListItemAvatar>
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
                          {index < profile.education.length - 1 && (
                            <Divider variant="inset" component="li" />
                          )}
                        </React.Fragment>
                      ))}
                    </List>
                  </StyledPaper>
                )}

                {profile.portfolio && profile.portfolio.length > 0 && (
                  <StyledPaper>
                    <Typography variant="h6" gutterBottom sx={{ display: "flex", alignItems: "center" }}>
                      <CodeIcon sx={{ mr: 1 }} /> Portfolio
                    </Typography>
                    <Grid container spacing={2}>
                      {profile.portfolio.map((item, index) => (
                        <Grid item xs={12} sm={6} md={4} key={index}>
                          <PortfolioItem onClick={() => handlePortfolioClick(item.link)}>
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
                              {item.link && (
                                <IconButton size="small">
                                  {item.type === "github" ? (
                                    <GitHubIcon fontSize="small" />
                                  ) : (
                                    <LinkIcon fontSize="small" />
                                  )}
                                </IconButton>
                              )}
                            </Box>
                          </PortfolioItem>
                        </Grid>
                      ))}
                    </Grid>
                  </StyledPaper>
                )}
              </>
            ) : (
              <>
                {/* Investor sections */}
                <StyledPaper>
                  <Typography variant="h6" gutterBottom sx={{ display: "flex", alignItems: "center" }}>
                    <CategoryIcon sx={{ mr: 1 }} /> Investment Preferences
                  </Typography>
                  <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                      <InfoBox>
                        <Typography variant="subtitle2" color="text.secondary">
                          Industries of Interest
                        </Typography>
                        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, mt: 1 }}>
                          {profile.industries.map((industry, index) => (
                            <Chip key={index} label={industry} size="small" />
                          ))}
                        </Box>
                      </InfoBox>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <InfoBox>
                        <Typography variant="subtitle2" color="text.secondary">
                          Investment Range
                        </Typography>
                        <Typography variant="h6">
                          {profile.investmentRange ? (
                            `$${profile.investmentRange.min.toLocaleString()} - $${profile.investmentRange.max.toLocaleString()}`
                          ) : (
                            "Not specified"
                          )}
                        </Typography>
                      </InfoBox>
                    </Grid>
                    {profile.investmentCriteria && (
                      <Grid item xs={12}>
                        <InfoBox>
                          <Typography variant="subtitle2" color="text.secondary">
                            Investment Criteria
                          </Typography>
                          <Typography variant="body1" sx={{ mt: 1 }}>
                            {profile.investmentCriteria}
                          </Typography>
                        </InfoBox>
                      </Grid>
                    )}
                  </Grid>
                </StyledPaper>
              </>
            )}

            {/* Smart Contracts Section */}
            <StyledPaper>
              <Typography variant="h6" gutterBottom sx={{ display: "flex", alignItems: "center" }}>
                <WalletIcon sx={{ mr: 1 }} /> Smart Contracts
              </Typography>
              {contracts.filter(c => c.smartContractAddress).length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  No blockchain contracts available yet.
                </Typography>
              ) : (
                <Grid container spacing={2}>
                  {contracts
                    .filter(c => c.smartContractAddress)
                    .map((contract) => (
                      <Grid item xs={12} md={6} key={contract.id}>
                        <SmartContractCard
                          title={contract.title}
                          address={contract.smartContractAddress}
                          status={contract.status}
                          verified={true}
                          description={contract.description}
                          investor={contract.investor}
                          freelancer={contract.freelancer}
                          value={contract.value}
                          onClick={() => navigate(`/contract/${contract.id}`)}
                        />
                      </Grid>
                    ))}
                </Grid>
              )}
            </StyledPaper>
          </Grid>

          <Grid item xs={12} md={4}>
            <StyledPaper>
              <Typography variant="h6" gutterBottom>
                {isViewingFreelancer() ? "Freelancer Stats" : "Investor Stats"}
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <InfoBox>
                    <Typography variant="body2" color="text.secondary">
                      Completed Contracts
                    </Typography>
                    <Typography variant="h5">{profile.completedContracts}</Typography>
                  </InfoBox>
                </Grid>
                <Grid item xs={6}>
                  <InfoBox>
                    <Typography variant="body2" color="text.secondary">
                      Rating
                    </Typography>
                    <Box sx={{ display: "flex", alignItems: "center" }}>
                      <Typography variant="h5" sx={{ mr: 1 }}>
                        {profile.rating.toFixed(1)}
                      </Typography>
                      <StarIcon sx={{ color: theme.colors.warning.main }} />
                    </Box>
                  </InfoBox>
                </Grid>
                {isViewingFreelancer() ? (
                  <Grid item xs={12}>
                    <InfoBox>
                      <Typography variant="body2" color="text.secondary">
                        Skills
                      </Typography>
                      <Typography variant="h5">{profile.skills.length}</Typography>
                    </InfoBox>
                  </Grid>
                ) : (
                  <Grid item xs={12}>
                    <InfoBox>
                      <Typography variant="body2" color="text.secondary">
                        Industries
                      </Typography>
                      <Typography variant="h5">{profile.industries.length}</Typography>
                    </InfoBox>
                  </Grid>
                )}
              </Grid>

              {isOppositeType() && (
                <Box sx={{ mt: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Connect
                  </Typography>
                  <Button
                    variant="contained"
                    startIcon={<ChatIcon />}
                    fullWidth
                    sx={{
                      mb: 2,
                      bgcolor:
                        matchStatus.status === "accepted"
                          ? theme.colors.secondary.main
                          : "grey.400",
                      "&:hover": {
                        bgcolor:
                          matchStatus.status === "accepted"
                            ? theme.colors.secondary.dark
                            : "grey.500",
                      },
                    }}
                    onClick={handleChat}
                    disabled={matchStatus.status !== "accepted"}
                  >
                    Chat
                  </Button>
                  {matchStatus.status === "none" ? (
                    <MatchButton
                      variant="contained"
                      startIcon={<MatchIcon />}
                      matched={false}
                      fullWidth
                      onClick={() => setMatchDialogOpen(true)}
                    >
                      Request Match
                    </MatchButton>
                  ) : matchStatus.status === "pending" ? (
                    <Button
                      variant="outlined"
                      startIcon={<MatchIcon />}
                      fullWidth
                      disabled
                    >
                      Request Pending
                    </Button>
                  ) : (
                    <MatchButton
                      variant="contained"
                      startIcon={<CheckIcon />}
                      matched={true}
                      fullWidth
                      disabled
                    >
                      Matched
                    </MatchButton>
                  )}

                  {currentUser.userType === "investor" &&
                    profile.userType === "freelancer" && (
                      <Button
                        variant="outlined"
                        startIcon={<WalletIcon />}
                        fullWidth
                        sx={{ mt: 2 }}
                        onClick={() => setHireDialogOpen(true)}
                      >
                        Create Contract
                      </Button>
                    )}
                </Box>
              )}

              {/* Recent Contracts */}
              <Box sx={{ mt: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Recent Contracts
                </Typography>
                {contracts.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    No contracts available.
                  </Typography>
                ) : (
                  <List sx={{ p: 0 }}>
                    {contracts.slice(0, 3).map((contract) => (
                      <ListItem
                        key={contract.id}
                        sx={{
                          bgcolor: "rgba(0,0,0,0.02)",
                          mb: 1,
                          borderRadius: 1,
                          cursor: "pointer",
                        }}
                        onClick={() => navigate(`/contract/${contract.id}`)}
                      >
                        <ListItemText
                          primary={contract.title}
                          secondary={
                            <>
                              <Typography variant="caption" color="text.secondary">
                                Status: {contract.status.charAt(0).toUpperCase() + contract.status.slice(1)}
                              </Typography>
                              <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                                Value: ${contract.value.toLocaleString()}
                              </Typography>
                            </>
                          }
                        />
                      </ListItem>
                    ))}
                    {contracts.length > 3 && (
                      <Button
                        variant="text"
                        size="small"
                        sx={{ mt: 1 }}
                        onClick={() => navigate(`/contract/${id}`)}
                      >
                        View all contracts
                      </Button>
                    )}
                  </List>
                )}
              </Box>
            </StyledPaper>
          </Grid>
        </Grid>
      </Container>

      {/* Request Match Dialog */}
      <Dialog
        open={matchDialogOpen}
        onClose={() => setMatchDialogOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Request Match</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Send a match request to {profile.name || "this user"}? If they accept,
            you'll be able to chat and collaborate on projects.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setMatchDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleRequestMatch}
            variant="contained"
            disabled={matchLoading}
            sx={{
              bgcolor: theme.colors.secondary.main,
              "&:hover": { bgcolor: theme.colors.secondary.dark },
            }}
          >
            {matchLoading ? <CircularProgress size={24} /> : "Send Request"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Hire Dialog */}
      <Dialog
        open={hireDialogOpen}
        onClose={() => setHireDialogOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Create Contract</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Would you like to create a new contract with {profile.name || "this freelancer"}?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setHireDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleHire}
            variant="contained"
            sx={{
              bgcolor: theme.colors.secondary.main,
              "&:hover": { bgcolor: theme.colors.secondary.dark },
            }}
          >
            Create Contract
          </Button>
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

export default ProfileView;