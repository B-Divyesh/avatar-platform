import React, { lazy, Suspense } from "react";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate,
} from "react-router-dom";
import { ThemeProvider, CssBaseline, CircularProgress, Box } from "@mui/material";
import { Web3ReactProvider } from "@web3-react/core";
import { ethers } from "ethers";

// Import theme
import theme from "./theme";

// Auth pages - keep these eager loaded for better UX
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import AuthCallback from "./pages/auth/Callback";
import ResetPassword from "./pages/auth/ResetPassword";

// Auth context
import { useAuth } from "./context/AuthContext";

// Lazy load all other pages to improve initial load time
const InvestorHome = lazy(() => import("./pages/investor/Home"));
const InvestorContracts = lazy(() => import("./pages/investor/Contracts"));
const InvestorAI = lazy(() => import("./pages/investor/AI"));
const InvestorMatch = lazy(() => import("./pages/investor/Match"));
const InvestorProfile = lazy(() => import("./pages/investor/Profile"));

const FreelancerHome = lazy(() => import("./pages/freelancer/Home"));
const FreelancerContracts = lazy(() => import("./pages/freelancer/Contracts"));
const FreelancerAI = lazy(() => import("./pages/freelancer/AI"));
const FreelancerMatch = lazy(() => import("./pages/freelancer/Match"));
const FreelancerProfile = lazy(() => import("./pages/freelancer/Profile"));

const ContractDetails = lazy(() => import("./pages/shared/ContractDetails"));
const ProfileView = lazy(() => import("./pages/shared/ProfileView"));
const Chat = lazy(() => import("./pages/shared/Chat"));
const NotFound = lazy(() => import("./pages/shared/NotFound"));

// Web3 provider getter
function getLibrary(provider) {
  return new ethers.providers.Web3Provider(provider);
}

// Loading component for Suspense
const LoadingFallback = () => {
  return (
    <Box 
      sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center',
        height: '100vh',
        bgcolor: theme.colors.background.default
      }}
    >
      <CircularProgress size={60} />
    </Box>
  );
};

// Protected Route component
const ProtectedRoute = ({ children }) => {
  const { currentUser, authInitialized } = useAuth();

  // If auth isn't initialized yet, show loading
  if (!authInitialized) {
    return <LoadingFallback />;
  }

  // If no user is logged in, redirect to login
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

// User type specific routes
const UserTypeRoute = ({ children, requiredType }) => {
  const { currentUser, authInitialized } = useAuth();

  // If auth isn't initialized yet, show loading
  if (!authInitialized) {
    return <LoadingFallback />;
  }

  // If no user is logged in, redirect to login
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  // If user type doesn't match required type, redirect to appropriate home
  if (currentUser.userType !== requiredType) {
    return <Navigate to={`/${currentUser.userType}`} replace />;
  }

  return children;
};

// Public Route - redirects authenticated users to their home page
const PublicRoute = ({ children }) => {
  const { currentUser, authInitialized } = useAuth();

  // If auth isn't initialized yet, just render the component
  if (!authInitialized) {
    return children;
  }

  // If user is logged in, redirect to their home page
  if (currentUser) {
    return <Navigate to={`/${currentUser.userType}`} replace />;
  }

  return children;
};

function App() {
  return (
    <Web3ReactProvider getLibrary={getLibrary}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Router>
          <Suspense fallback={<LoadingFallback />}>
            <Routes>
              {/* Auth Routes - Public but will redirect if logged in */}
              <Route path="/login" element={
                <PublicRoute>
                  <Login />
                </PublicRoute>
              } />
              
              <Route path="/register" element={
                <PublicRoute>
                  <Register />
                </PublicRoute>
              } />
              
              {/* Auth Callback - Special case */}
              <Route path="/auth/callback" element={<AuthCallback />} />
              
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/forgot-password" element={<ResetPassword isForgot={true} />} />

              {/* Investor Routes */}
              <Route
                path="/investor"
                element={
                  <ProtectedRoute>
                    <UserTypeRoute requiredType="investor">
                      <InvestorHome />
                    </UserTypeRoute>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/investor/contracts"
                element={
                  <ProtectedRoute>
                    <UserTypeRoute requiredType="investor">
                      <InvestorContracts />
                    </UserTypeRoute>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/investor/ai"
                element={
                  <ProtectedRoute>
                    <UserTypeRoute requiredType="investor">
                      <InvestorAI />
                    </UserTypeRoute>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/investor/match"
                element={
                  <ProtectedRoute>
                    <UserTypeRoute requiredType="investor">
                      <InvestorMatch />
                    </UserTypeRoute>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/investor/profile"
                element={
                  <ProtectedRoute>
                    <UserTypeRoute requiredType="investor">
                      <InvestorProfile />
                    </UserTypeRoute>
                  </ProtectedRoute>
                }
              />

              {/* Freelancer Routes */}
              <Route
                path="/freelancer"
                element={
                  <ProtectedRoute>
                    <UserTypeRoute requiredType="freelancer">
                      <FreelancerHome />
                    </UserTypeRoute>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/freelancer/contracts"
                element={
                  <ProtectedRoute>
                    <UserTypeRoute requiredType="freelancer">
                      <FreelancerContracts />
                    </UserTypeRoute>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/freelancer/ai"
                element={
                  <ProtectedRoute>
                    <UserTypeRoute requiredType="freelancer">
                      <FreelancerAI />
                    </UserTypeRoute>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/freelancer/match"
                element={
                  <ProtectedRoute>
                    <UserTypeRoute requiredType="freelancer">
                      <FreelancerMatch />
                    </UserTypeRoute>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/freelancer/profile"
                element={
                  <ProtectedRoute>
                    <UserTypeRoute requiredType="freelancer">
                      <FreelancerProfile />
                    </UserTypeRoute>
                  </ProtectedRoute>
                }
              />

              {/* Shared Routes */}
              <Route
                path="/contract/:id"
                element={
                  <ProtectedRoute>
                    <ContractDetails />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile/:id"
                element={
                  <ProtectedRoute>
                    <ProfileView />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/chat/:id"
                element={
                  <ProtectedRoute>
                    <Chat />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/chat"
                element={
                  <ProtectedRoute>
                    <Chat />
                  </ProtectedRoute>
                }
              />

              {/* Redirect root to login if not logged in, or to appropriate home if logged in */}
              <Route path="/" element={
                <PublicRoute>
                  <Navigate to="/login" replace />
                </PublicRoute>
              } />

              {/* 404 */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </Router>
      </ThemeProvider>
    </Web3ReactProvider>
  );
}

export default App;