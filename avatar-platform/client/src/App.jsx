
import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate,
} from "react-router-dom";
import { ThemeProvider, CssBaseline } from "@mui/material";
import { StreamChat } from "stream-chat";
import { ChatProvider } from "stream-chat-react";
import { Web3Provider } from "@ethersproject/providers";
import { Web3ReactProvider } from "@web3-react/core";
import { ethers } from "ethers";

// Import theme
import theme from "./theme";

// Auth pages
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";

// Investor pages
import InvestorHome from "./pages/investor/Home";
import InvestorContracts from "./pages/investor/Contracts";
import InvestorAI from "./pages/investor/AI";
import InvestorMatch from "./pages/investor/Match";
import InvestorProfile from "./pages/investor/Profile";

// Freelancer pages
import FreelancerHome from "./pages/freelancer/Home";
import FreelancerContracts from "./pages/freelancer/Contracts";
import FreelancerAI from "./pages/freelancer/AI";
import FreelancerMatch from "./pages/freelancer/Match";
import FreelancerProfile from "./pages/freelancer/Profile";

// Shared pages
import ContractDetails from "./pages/shared/ContractDetails";
import ProfileView from "./pages/shared/ProfileView";
import Chat from "./pages/shared/Chat";
import NotFound from "./pages/shared/NotFound"; // Fixed import for NotFound

// Contexts
import { AuthProvider, useAuth } from "./context/AuthContext";

// Create Stream Chat client
const chatClient = StreamChat.getInstance(process.env.REACT_APP_STREAM_API_KEY);

// Web3 provider getter
function getLibrary(provider) {
  return new Web3Provider(provider);
}

// Protected Route component
const ProtectedRoute = ({ children }) => {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!currentUser) {
    return <Navigate to="/login" />;
  }

  return children;
};

// User type specific routes
const UserTypeRoute = ({ children, requiredType }) => {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!currentUser) {
    return <Navigate to="/login" />;
  }

  if (currentUser.userType !== requiredType) {
    return (
      <Navigate
        to={currentUser.userType === "investor" ? "/investor" : "/freelancer"}
      />
    );
  }

  return children;
};

function App() {
  return (
    <Web3ReactProvider getLibrary={getLibrary}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <AuthProvider>
          <ChatProvider client={chatClient}>
            <Router>
              <Routes>
                {/* Auth Routes */}
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />

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

                {/* Redirect root to appropriate home */}
                <Route path="/" element={<Navigate to="/login" />} />

                {/* 404 */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Router>
          </ChatProvider>
        </AuthProvider>
      </ThemeProvider>
    </Web3ReactProvider>
  );
}

export default App;
