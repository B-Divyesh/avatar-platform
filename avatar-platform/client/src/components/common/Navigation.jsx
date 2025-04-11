import React from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import {
  AppBar,
  Box,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Avatar,
  Badge,
  useTheme,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import {
  Home as HomeIcon,
  Description as ContractIcon,
  Psychology as AIIcon,
  Notifications as MatchIcon,
  AccountCircle as ProfileIcon,
  ExitToApp as LogoutIcon,
} from "@mui/icons-material";
import { useAuth } from "../context/AuthContext";

// Styled components
const StyledAppBar = styled(AppBar)(({ theme }) => ({
  backgroundColor: theme.colors.secondary.main, // Bubblegum pink
  boxShadow: theme.shadows[2],
  borderRadius: "8px",
  margin: "10px",
  width: "calc(100% - 20px)",
}));

const NavButton = styled(Button)(({ theme, active }) => ({
  color: active ? theme.colors.primary.main : "#fff",
  margin: "0 5px",
  fontWeight: active ? "bold" : "normal",
  "&:hover": {
    backgroundColor: theme.colors.secondary.dark,
  },
}));

const ProfileButton = styled(IconButton)(({ theme }) => ({
  color: "#fff",
  marginLeft: "auto",
  backgroundColor: theme.colors.secondary.dark,
  "&:hover": {
    backgroundColor: theme.colors.secondary.main,
  },
}));

// Navigation Component
const Navigation = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser, logout } = useAuth();

  // Determine if route is active
  const isActive = (path) => {
    return location.pathname.includes(path);
  };

  // Define navigation items based on user type
  const getNavItems = () => {
    const baseUrl =
      currentUser?.userType === "investor" ? "/investor" : "/freelancer";

    return [
      {
        label: "Home",
        icon: <HomeIcon />,
        path: baseUrl,
        exact: true,
      },
      {
        label: "Contracts",
        icon: <ContractIcon />,
        path: `${baseUrl}/contracts`,
      },
      {
        label: "Avatar AI",
        icon: <AIIcon />,
        path: `${baseUrl}/ai`,
      },
      {
        label: "Match",
        icon: <MatchIcon />,
        path: `${baseUrl}/match`,
        badge: currentUser?.pendingMatches?.length || 0,
      },
    ];
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  // If no user, don't show the navigation
  if (!currentUser) return null;

  return (
    <StyledAppBar position="static">
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ flexGrow: 0, mr: 3 }}>
          Avatar
        </Typography>

        <Box sx={{ display: "flex", flexGrow: 1 }}>
          {getNavItems().map((item) => (
            <NavButton
              key={item.path}
              active={isActive(item.path)}
              startIcon={
                item.badge ? (
                  <Badge badgeContent={item.badge} color="error">
                    {item.icon}
                  </Badge>
                ) : (
                  item.icon
                )
              }
              onClick={() => navigate(item.path)}
            >
              {item.label}
            </NavButton>
          ))}
        </Box>

        <ProfileButton
          aria-label="profile"
          onClick={() => navigate(`/${currentUser.userType}/profile`)}
          sx={{ mr: 1 }}
        >
          {currentUser.profileImage ? (
            <Avatar
              src={currentUser.profileImage}
              alt={currentUser.displayName || currentUser.email}
            />
          ) : (
            <ProfileIcon />
          )}
        </ProfileButton>

        <IconButton
          aria-label="logout"
          onClick={handleLogout}
          sx={{ color: "#fff" }}
        >
          <LogoutIcon />
        </IconButton>
      </Toolbar>
    </StyledAppBar>
  );
};

export default Navigation;
