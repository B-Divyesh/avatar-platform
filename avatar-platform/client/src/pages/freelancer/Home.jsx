import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Grid,
  Typography,
  Paper,
  Chip,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  InputAdornment,
  CircularProgress,
  Snackbar,
  Alert,
  useTheme,
  IconButton,
  Tooltip,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import {
  Search as SearchIcon,
  ThumbUp as ThumbUpIcon,
  StarRate as StarIcon,
  MonetizationOn as MoneyIcon,
  ArrowForward as ArrowIcon,
  BusinessCenter as BusinessIcon,
} from "@mui/icons-material";

import Navigation from "../../components/Navigation";
import { useAuth } from "../../context/AuthContext";
import { getInvestors } from "../../services/userService";

// Styled components
const StickyNote = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  margin: theme.spacing(2),
  height: "180px",
  width: "180px",
  display: "flex",
  flexDirection: "column",
  backgroundColor: theme.colors.background.paper,
  boxShadow: "0px 4px 8px rgba(0, 0, 0, 0.2)",
  transition: "transform 0.2s, box-shadow 0.2s",
  position: "relative",
  overflow: "hidden",
  cursor: "pointer",
  "&:hover": {
    transform: "translateY(-5px)",
    boxShadow: "0px 6px 12px rgba(0, 0, 0, 0.3)",
  },
}));

const SmartContractNote = styled(StickyNote)(({ theme }) => ({
  background: "linear-gradient(135deg, #ffffff 0%, #f0f0f0 100%)",
  "&::after": {
    content: '""',
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background:
      "linear-gradient(45deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.5) 50%, rgba(255,255,255,0.1) 100%)",
    backgroundSize: "200% 200%",
    animation: "holographic 5s ease infinite",
    pointerEvents: "none",
  },
  "@keyframes holographic": {
    "0%": {
      backgroundPosition: "0% 0%",
    },
    "50%": {
      backgroundPosition: "100% 100%",
    },
    "100%": {
      backgroundPosition: "0% 0%",
    },
  },
}));

const Container = styled(Box)(({ theme }) => ({
  backgroundColor: theme.colors.background.default,
  minHeight: "100vh",
  padding: theme.spacing(2),
}));

const EmptyStateBox = styled(Box)(({ theme }) => ({
  textAlign: "center",
  padding: theme.spacing(8),
  backgroundColor: "rgba(255, 255, 255, 0.7)",
  borderRadius: theme.shape.borderRadius,
  margin: theme.spacing(4, 0),
}));

// Match Button component
const MatchButton = styled(IconButton)(({ theme, matched }) => ({
  position: "absolute",
  right: theme.spacing(1),
  bottom: theme.spacing(1),
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
const FreelancerHome = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  // State
  const [investors, setInvestors] = useState([]);
  const [filteredInvestors, setFilteredInvestors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortBy, setSortBy] = useState("recommended");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [matchedInvestors, setMatchedInvestors] = useState(new Set());

  // Fetch investors
  useEffect(() => {
    const fetchInvestors = async () => {
      try {
        setLoading(true);

        const data = await getInvestors();

        // Add some mock recommendation scores and matching scores
        const investorsWithScore = data.map((investor) => ({
          ...investor,
          recommendationScore: Math.floor(Math.random() * 100), // Mock score
          matchScore: Math.floor(Math.random() * 100), // Mock match score
          hasSmartContract: Math.random() > 0.7, // 30% chance to have a smart contract
          averageInvestment: Math.floor(Math.random() * 50000) + 10000, // $10K to $60K
        }));

        setInvestors(investorsWithScore);
        setFilteredInvestors(investorsWithScore);

        // Get previously matched investors
        const matched = new Set(currentUser?.matchedInvestors || []);
        setMatchedInvestors(matched);
      } catch (err) {
        console.error("Error fetching investors:", err);
        setError("Failed to load investors. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchInvestors();
  }, [currentUser]);

  // Apply filters and search
  useEffect(() => {
    let result = [...investors];

    // Apply search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (investor) =>
          investor.name.toLowerCase().includes(query) ||
          investor.industries.some((industry) =>
            industry.toLowerCase().includes(query)
          ) ||
          (investor.bio && investor.bio.toLowerCase().includes(query))
      );
    }

    // Apply category filter
    if (filterCategory !== "all") {
      result = result.filter((investor) =>
        investor.industries.includes(filterCategory)
      );
    }

    // Apply sort
    if (sortBy === "recommended") {
      result.sort((a, b) => b.matchScore - a.matchScore);
    } else if (sortBy === "investments") {
      result.sort((a, b) => b.completedInvestments - a.completedInvestments);
    } else if (sortBy === "amount") {
      result.sort((a, b) => b.averageInvestment - a.averageInvestment);
    }

    setFilteredInvestors(result);
  }, [investors, searchQuery, filterCategory, sortBy]);

  // Handle view profile
  const handleViewProfile = (id) => {
    navigate(`/profile/${id}`);
  };

  // Handle match request
  const handleMatchRequest = async (id, e) => {
    e.stopPropagation(); // Prevent clicking through to profile

    try {
      // Toggle match state
      const newMatched = new Set(matchedInvestors);

      if (newMatched.has(id)) {
        newMatched.delete(id);
      } else {
        newMatched.add(id);
      }

      setMatchedInvestors(newMatched);

      // Call API to update match status
      // await updateMatchStatus(id, newMatched.has(id));

      // Mock API call for demonstration
      console.log(`Investor ${id} match status: ${newMatched.has(id)}`);
    } catch (err) {
      console.error("Error updating match status:", err);
      setError("Failed to update match status. Please try again.");
    }
  };

  // Render loading state
  if (loading) {
    return (
      <>
        <Navigation />
        <Container>
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              height: "80vh",
            }}
          >
            <CircularProgress />
          </Box>
        </Container>
      </>
    );
  }

  return (
    <>
      <Navigation />
      <Container>
        <Typography variant="h4" gutterBottom>
          Find Potential Investors
        </Typography>

        {/* Filters and Search */}
        <Box
          sx={{
            mb: 4,
            display: "flex",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 2,
          }}
        >
          <TextField
            placeholder="Search investors..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            sx={{ flexGrow: 1, minWidth: "250px" }}
          />

          <FormControl sx={{ minWidth: "150px" }}>
            <InputLabel>Sort By</InputLabel>
            <Select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              label="Sort By"
            >
              <MenuItem value="recommended">Best Match</MenuItem>
              <MenuItem value="investments">Most Investments</MenuItem>
              <MenuItem value="amount">Avg. Investment</MenuItem>
            </Select>
          </FormControl>

          <FormControl sx={{ minWidth: "150px" }}>
            <InputLabel>Industry</InputLabel>
            <Select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              label="Industry"
            >
              <MenuItem value="all">All Industries</MenuItem>
              <MenuItem value="tech">Technology</MenuItem>
              <MenuItem value="finance">Finance</MenuItem>
              <MenuItem value="healthcare">Healthcare</MenuItem>
              <MenuItem value="education">Education</MenuItem>
              <MenuItem value="real-estate">Real Estate</MenuItem>
              <MenuItem value="other">Other</MenuItem>
            </Select>
          </FormControl>
        </Box>

        {/* Investors Grid */}
        {filteredInvestors.length === 0 ? (
          <EmptyStateBox>
            <BusinessIcon
              sx={{ fontSize: 60, mb: 2, color: theme.colors.primary.dark }}
            />
            <Typography variant="h6" gutterBottom>
              No investors found
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              Try adjusting your filters or search criteria
            </Typography>
            <Button
              variant="contained"
              sx={{
                bgcolor: theme.colors.secondary.main,
                "&:hover": { bgcolor: theme.colors.secondary.dark },
              }}
              onClick={() => {
                setSearchQuery("");
                setFilterCategory("all");
                setSortBy("recommended");
              }}
            >
              Reset Filters
            </Button>
          </EmptyStateBox>
        ) : (
          <Grid container spacing={2}>
            {filteredInvestors.map((investor) => (
              <Grid item key={investor.id}>
                {investor.hasSmartContract ? (
                  <SmartContractNote
                    onClick={() => handleViewProfile(investor.id)}
                  >
                    <Typography variant="h6" noWrap sx={{ mb: 1 }}>
                      {investor.name}
                    </Typography>
                    <Box sx={{ mb: 1, display: "flex", alignItems: "center" }}>
                      <MoneyIcon
                        sx={{
                          color: theme.colors.success.main,
                          mr: 0.5,
                          fontSize: "0.9rem",
                        }}
                      />
                      <Typography variant="body2">
                        Avg: ${(investor.averageInvestment / 1000).toFixed(0)}K
                      </Typography>
                    </Box>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mb: 1, flex: 1, overflow: "hidden" }}
                    >
                      {investor.bio?.substring(0, 70) || "No bio available"}
                      {(investor.bio?.length || 0) > 70 ? "..." : ""}
                    </Typography>
                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                      {investor.industries?.slice(0, 2).map((industry, idx) => (
                        <Chip key={idx} label={industry} size="small" />
                      ))}
                      {(investor.industries?.length || 0) > 2 && (
                        <Chip
                          label={`+${investor.industries.length - 2}`}
                          size="small"
                        />
                      )}
                    </Box>
                    <Tooltip
                      title={
                        matchedInvestors.has(investor.id)
                          ? "Matched"
                          : "Request Match"
                      }
                    >
                      <MatchButton
                        size="small"
                        matched={matchedInvestors.has(investor.id)}
                        onClick={(e) => handleMatchRequest(investor.id, e)}
                      >
                        {matchedInvestors.has(investor.id) ? (
                          <ThumbUpIcon />
                        ) : (
                          <ArrowIcon />
                        )}
                      </MatchButton>
                    </Tooltip>
                  </SmartContractNote>
                ) : (
                  <StickyNote onClick={() => handleViewProfile(investor.id)}>
                    <Typography variant="h6" noWrap sx={{ mb: 1 }}>
                      {investor.name}
                    </Typography>
                    <Box sx={{ mb: 1, display: "flex", alignItems: "center" }}>
                      <MoneyIcon
                        sx={{
                          color: theme.colors.success.main,
                          mr: 0.5,
                          fontSize: "0.9rem",
                        }}
                      />
                      <Typography variant="body2">
                        Avg: ${(investor.averageInvestment / 1000).toFixed(0)}K
                      </Typography>
                    </Box>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mb: 1, flex: 1, overflow: "hidden" }}
                    >
                      {investor.bio?.substring(0, 70) || "No bio available"}
                      {(investor.bio?.length || 0) > 70 ? "..." : ""}
                    </Typography>
                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                      {investor.industries?.slice(0, 2).map((industry, idx) => (
                        <Chip key={idx} label={industry} size="small" />
                      ))}
                      {(investor.industries?.length || 0) > 2 && (
                        <Chip
                          label={`+${investor.industries.length - 2}`}
                          size="small"
                        />
                      )}
                    </Box>
                    <Tooltip
                      title={
                        matchedInvestors.has(investor.id)
                          ? "Matched"
                          : "Request Match"
                      }
                    >
                      <MatchButton
                        size="small"
                        matched={matchedInvestors.has(investor.id)}
                        onClick={(e) => handleMatchRequest(investor.id, e)}
                      >
                        {matchedInvestors.has(investor.id) ? (
                          <ThumbUpIcon />
                        ) : (
                          <ArrowIcon />
                        )}
                      </MatchButton>
                    </Tooltip>
                  </StickyNote>
                )}
              </Grid>
            ))}
          </Grid>
        )}

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
      </Container>
    </>
  );
};

export default FreelancerHome;
