import React, { createContext, useContext, useState, useEffect, useMemo } from "react";
import { ethers } from "ethers";
import { supabase } from "../services/supabaseClient";
import { getCurrentUser } from "../services/authService";

// Create context
const AuthContext = createContext();

// Provider component
export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [walletConnected, setWalletConnected] = useState(false);
  const [ethersProvider, setEthersProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [authInitialized, setAuthInitialized] = useState(false);

  // Check if user is authenticated - only run once on mount
  useEffect(() => {
    const checkUser = async () => {
      try {
        console.log("Checking user authentication...");
        setLoading(true);
        
        // Get session directly from Supabase
        const { data } = await supabase.auth.getSession();
        console.log("Session data:", data);
        
        if (data.session) {
          try {
            const fullUser = await getCurrentUser();
            console.log("Full user data:", fullUser);
            
            if (fullUser) {
              setCurrentUser(fullUser);
            } else {
              setCurrentUser(null);
              // Session exists but no user - might be an invalid session
              await supabase.auth.signOut();
            }
          } catch (profileError) {
            console.error("Error fetching full profile:", profileError);
            setCurrentUser(null);
          }
        } else {
          console.log("No active session found");
          setCurrentUser(null);
        }
      } catch (error) {
        console.error("Error checking auth state:", error);
        setCurrentUser(null);
      } finally {
        setLoading(false);
        setAuthInitialized(true);
      }
    };

    // Initial check
    checkUser();

    // Set up Supabase auth listener
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("Auth state changed:", event, session);
        
        if (event === "SIGNED_IN" && session) {
          setLoading(true);
          try {
            const fullUser = await getCurrentUser();
            if (fullUser) {
              setCurrentUser(fullUser);
            } else {
              setCurrentUser(null);
            }
          } catch (error) {
            console.error("Error in auth change handler:", error);
            setCurrentUser(null);
          } finally {
            setLoading(false);
          }
        } else if (event === "SIGNED_OUT") {
          console.log("User signed out");
          setCurrentUser(null);
          setLoading(false);
        }
      }
    );

    // Clean up listener
    return () => {
      if (authListener && authListener.subscription) {
        authListener.subscription.unsubscribe();
      }
    };
  }, []);

  // Connect wallet
  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        await window.ethereum.request({ method: "eth_requestAccounts" });

        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const userSigner = provider.getSigner();
        const address = await userSigner.getAddress();

        setEthersProvider(provider);
        setSigner(userSigner);
        setWalletConnected(true);

        return { provider, signer: userSigner, address };
      } catch (error) {
        console.error("Error connecting wallet:", error);
        throw error;
      }
    } else {
      throw new Error("Metamask not installed");
    }
  };

  // Login with email
  const loginWithEmail = async (email, password) => {
    try {
      setLoading(true);
      console.log("Logging in with email:", email);
      
      // Clear any existing session first to prevent conflicts
      await supabase.auth.signOut();
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error("Login error:", error);
        throw error;
      }

      console.log("Login successful, data:", data);
      
      // We don't need to set the user here, the auth state change listener will handle it
      return data;
    } catch (error) {
      console.error("Error logging in:", error);
      setLoading(false);  // Make sure to set loading to false on error
      throw error;
    }
  };

  // Login with Google
  const loginWithGoogle = async () => {
    try {
      console.log("Starting Google login...");
      
      // Clear any existing session first
      await supabase.auth.signOut();
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        console.error("Google login error:", error);
        throw error;
      }
      
      console.log("Google login initiated, redirecting...");
      return data;
    } catch (error) {
      console.error("Error logging in with Google:", error);
      throw error;
    }
  };

  // Register with email
  const registerWithEmail = async (email, password, userType) => {
    try {
      setLoading(true);
      console.log("Registering with email:", email, "userType:", userType);
      
      // Clear any existing session first
      await supabase.auth.signOut();
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            user_type: userType,
          },
        },
      });

      if (error) {
        console.error("Registration error:", error);
        throw error;
      }

      console.log("Registration result:", data);
      
      // If email confirmation is not required and we have a session, we can set the user
      if (data.session) {
        try {
          const fullUser = await getCurrentUser();
          if (fullUser) {
            setCurrentUser(fullUser);
          }
        } catch (userError) {
          console.error("Error getting user after registration:", userError);
        }
      } else {
        console.log("Email confirmation required, no session yet");
      }
      
      return data;
    } catch (error) {
      console.error("Error registering:", error);
      setLoading(false);  // Make sure to set loading to false on error
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Logout
  const logout = async () => {
    try {
      setLoading(true);
      console.log("Logging out...");
      
      const { error } = await supabase.auth.signOut();

      if (error) {
        console.error("Logout error:", error);
        throw error;
      }

      console.log("Logout successful");
      setCurrentUser(null);
      setWalletConnected(false);
      setEthersProvider(null);
      setSigner(null);
    } catch (error) {
      console.error("Error logging out:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Memoize the context value to prevent unnecessary re-renders
  const value = useMemo(() => ({
    currentUser,
    loading,
    walletConnected,
    ethersProvider,
    signer,
    authInitialized,
    connectWallet,
    loginWithEmail,
    loginWithGoogle,
    registerWithEmail,
    logout,
  }), [
    currentUser, 
    loading, 
    walletConnected, 
    ethersProvider, 
    signer,
    authInitialized
  ]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to use the auth context
export const useAuth = () => {
  return useContext(AuthContext);
};