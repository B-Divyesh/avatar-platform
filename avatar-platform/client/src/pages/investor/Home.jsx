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
} from "@mui/material";
import { styled } from "@mui/material/styles";
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  ThumbUp as ThumbUpIcon,
  StarRate as StarIcon,
} from "@mui/icons-material";

import Navigation from "../../components/Navigation";
import { useAuth } from "../../context/AuthContext";
import { getFreelancers } from "../../services/userService";

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

// Main component
const InvestorHome = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  // State
  const [freelancers, setFreelancers] = useState([]);
  const [filteredFreelancers, setFilteredFreelancers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortBy, setSortBy] = useState("recommended");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");

  // Fetch freelancers
  useEffect(() => {
    const fetchFreelancers = async () => {
      try {
        setLoading(true);

        const data = await getFreelancers();

        // Add some mock recommendation scores
        const freelancersWithScore = data.map((freelancer) => ({
          ...freelancer,
          recommendationScore: Math.floor(Math.random() * 100), // Mock score
          hasSmartContract: Math.random() > 0.7, // 30% chance to have a smart contract
        }));

        setFreelancers(freelancersWithScore);
        setFilteredFreelancers(freelancersWithScore);
      } catch (err) {
        console.error("Error fetching freelancers:", err);
        setError("Failed to load freelancers. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchFreelancers();
  }, []);

  // Apply filters and search
  useEffect(() => {
    let result = [...freelancers];

    // Apply search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (freelancer) =>
          freelancer.name.toLowerCase().includes(query) ||
          freelancer.skills.some((skill) =>
            skill.toLowerCase().includes(query)
          ) ||
          (freelancer.bio && freelancer.bio.toLowerCase().includes(query))
      );
    }

    // Apply category filter
    if (filterCategory !== "all") {
      result = result.filter(
        (freelancer) => freelancer.category === filterCategory
      );
    }

    // Apply sort
    if (sortBy === "recommended") {
      result.sort((a, b) => b.recommendationScore - a.recommendationScore);
    } else if (sortBy === "rating") {
      result.sort((a, b) => b.rating - a.rating);
    } else if (sortBy === "contracts") {
      result.sort((a, b) => b.completedContracts - a.completedContracts);
    }

    setFilteredFreelancers(result);
  }, [freelancers, searchQuery, filterCategory, sortBy]);

  // Handle view profile
  const handleViewProfile = (id) => {
    navigate(`/profile/${id}`);
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
          Find Potential Investment Opportunities
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
            placeholder="Search freelancers and startups..."
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
              <MenuItem value="recommended">Recommended</MenuItem>
              <MenuItem value="rating">Highest Rated</MenuItem>
              <MenuItem value="contracts">Most Contracts</MenuItem>
            </Select>
          </FormControl>

          <FormControl sx={{ minWidth: "150px" }}>
            <InputLabel>Category</InputLabel>
            <Select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              label="Category"
            >
              <MenuItem value="all">All Categories</MenuItem>
              <MenuItem value="tech">Technology</MenuItem>
              <MenuItem value="design">Design</MenuItem>
              <MenuItem value="finance">Finance</MenuItem>
              <MenuItem value="marketing">Marketing</MenuItem>
              <MenuItem value="other">Other</MenuItem>
            </Select>
          </FormControl>
        </Box>

        {/* Freelancers Grid */}
        {filteredFreelancers.length === 0 ? (
          <Box sx={{ textAlign: "center", py: 8 }}>
            <Typography variant="h6" color="text.secondary">
              No results found. Try adjusting your filters.
            </Typography>
          </Box>
        ) : (
          <Grid container spacing={2}>
            {filteredFreelancers.map((freelancer) => (
              <Grid item key={freelancer.id}>
                {freelancer.hasSmartContract ? (
                  <SmartContractNote
                    onClick={() => handleViewProfile(freelancer.id)}
                  >
                    <Typography variant="h6" noWrap sx={{ mb: 1 }}>
                      {freelancer.name}
                    </Typography>
                    <Box sx={{ mb: 1, display: "flex", alignItems: "center" }}>
                      <StarIcon
                        sx={{ color: theme.colors.warning.main, mr: 0.5 }}
                      />
                      <Typography variant="body2">
                        {freelancer.rating.toFixed(1)}
                      </Typography>
                    </Box>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mb: 1, flex: 1, overflow: "hidden" }}
                    >
                      {freelancer.bio?.substring(0, 70) || "No bio available"}
                      {(freelancer.bio?.length || 0) > 70 ? "..." : ""}
                    </Typography>
                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                      {freelancer.skills?.slice(0, 2).map((skill, idx) => (
                        <Chip key={idx} label={skill} size="small" />
                      ))}
                      {(freelancer.skills?.length || 0) > 2 && (
                        <Chip
                          label={`+${freelancer.skills.length - 2}`}
                          size="small"
                        />
                      )}
                    </Box>
                  </SmartContractNote>
                ) : (
                  <StickyNote onClick={() => handleViewProfile(freelancer.id)}>
                    <Typography variant="h6" noWrap sx={{ mb: 1 }}>
                      {freelancer.name}
                    </Typography>
                    <Box sx={{ mb: 1, display: "flex", alignItems: "center" }}>
                      <StarIcon
                        sx={{ color: theme.colors.warning.main, mr: 0.5 }}
                      />
                      <Typography variant="body2">
                        {freelancer.rating.toFixed(1)}
                      </Typography>
                    </Box>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mb: 1, flex: 1, overflow: "hidden" }}
                    >
                      {freelancer.bio?.substring(0, 70) || "No bio available"}
                      {(freelancer.bio?.length || 0) > 70 ? "..." : ""}
                    </Typography>
                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                      {freelancer.skills?.slice(0, 2).map((skill, idx) => (
                        <Chip key={idx} label={skill} size="small" />
                      ))}
                      {(freelancer.skills?.length || 0) > 2 && (
                        <Chip
                          label={`+${freelancer.skills.length - 2}`}
                          size="small"
                        />
                      )}
                    </Box>
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

export default InvestorHome;
