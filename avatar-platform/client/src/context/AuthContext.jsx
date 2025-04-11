import React, { createContext, useContext, useState, useEffect } from "react";
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

  // Check if user is authenticated
  useEffect(() => {
    const checkUser = async () => {
      try {
        setLoading(true);
        const user = await getCurrentUser();

        if (user) {
          setCurrentUser(user);
        } else {
          setCurrentUser(null);
        }
      } catch (error) {
        console.error("Error checking auth state:", error);
        setCurrentUser(null);
      } finally {
        setLoading(false);
      }
    };

    // Initial check
    checkUser();

    // Set up Supabase auth listener
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === "SIGNED_IN" && session) {
          const user = await getCurrentUser();
          setCurrentUser(user);
        } else if (event === "SIGNED_OUT") {
          setCurrentUser(null);
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

  // Login with email (via Supabase)
  const loginWithEmail = async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      return data;
    } catch (error) {
      console.error("Error logging in:", error);
      throw error;
    }
  };

  // Login with Google (via Supabase)
  const loginWithGoogle = async () => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) throw error;

      return data;
    } catch (error) {
      console.error("Error logging in with Google:", error);
      throw error;
    }
  };

  // Register with email
  const registerWithEmail = async (email, password, userType) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            user_type: userType, // 'investor' or 'freelancer'
          },
        },
      });

      if (error) throw error;

      return data;
    } catch (error) {
      console.error("Error registering:", error);
      throw error;
    }
  };

  // Logout
  const logout = async () => {
    try {
      const { error } = await supabase.auth.signOut();

      if (error) throw error;

      setCurrentUser(null);
      setWalletConnected(false);
      setEthersProvider(null);
      setSigner(null);
    } catch (error) {
      console.error("Error logging out:", error);
      throw error;
    }
  };

  // Context value
  const value = {
    currentUser,
    loading,
    walletConnected,
    ethersProvider,
    signer,
    connectWallet,
    loginWithEmail,
    loginWithGoogle,
    registerWithEmail,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to use the auth context
export const useAuth = () => {
  return useContext(AuthContext);
};
