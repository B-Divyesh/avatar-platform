import { supabase, TABLES } from "./supabaseClient";

// Cache for user profiles to avoid repeated API calls
const profileCache = new Map();

// Performance tracking
const perfTracker = {
  startTime: null,
  logPerformance: (operation) => {
    if (!perfTracker.startTime) return;
    const duration = Date.now() - perfTracker.startTime;
    console.log(`Performance: ${operation} took ${duration}ms`);
    perfTracker.startTime = null;
  },
  start: () => {
    perfTracker.startTime = Date.now();
  }
};

/**
 * Get current authenticated user with profile data
 * Prioritizes login completion before any profile fetching
 * @returns {Promise<Object|null>} User object with profile data or null if not authenticated
 */
export const getCurrentUser = async () => {
  try {
    perfTracker.start();
    
    // Get session data - this is the critical path for login
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();
    
    perfTracker.logPerformance('Getting auth session');

    if (sessionError) {
      console.error("Session error:", sessionError);
      return null;
    }
    
    if (!session) {
      console.log("No active session found");
      return null;
    }

    const user = session.user;
    
    // Check cache first to avoid unnecessary API calls
    if (profileCache.has(user.id)) {
      console.log("User profile found in cache");
      return profileCache.get(user.id);
    }
    
    // Create a basic user object with minimal data from the session
    // This ensures we have something to return even if profile fetch fails
    const basicUserData = {
      id: user.id,
      email: user.email,
      userType: user.user_metadata?.user_type || "freelancer",
      createdAt: user.created_at,
      // Default empty values for profile data
      name: user.user_metadata?.name || "",
      profileImage: "",
      skills: [],
      industries: [],
      walletAddress: "",
      bio: "",
      experience: [],
      education: [],
      portfolio: [],
      pendingMatches: []
    };
    
    // Cache this basic user data immediately
    profileCache.set(user.id, basicUserData);
    
    // Start profile fetch in the background - don't await it
    fetchAndUpdateUserProfile(user.id, basicUserData)
      .catch(error => {
        console.error("Background profile fetch failed:", error);
      });
    
    return basicUserData;
  } catch (error) {
    console.error("Error in getCurrentUser:", error);
    return null;
  }
};

/**
 * Fetch user profile data and update the cache in the background
 * This is separated from the main authentication flow to prevent login delays
 * @param {string} userId - User ID
 * @param {Object} basicUserData - Basic user data already cached
 */
async function fetchAndUpdateUserProfile(userId, basicUserData) {
  try {
    perfTracker.start();
    
    // Get user profile data
    const { data: profile, error: profileError } = await supabase
      .from(TABLES.PROFILES)
      .select("*")
      .eq("id", userId)
      .single();
    
    perfTracker.logPerformance('Fetching user profile');
    
    if (profileError && profileError.code !== "PGRST116") {
      console.error("Error fetching user profile:", profileError);
      return;
    }
    
    // If user type is not in metadata, try to get it from users table
    let userType = basicUserData.userType;
    
    if (!userType || userType === "freelancer") {
      try {
        perfTracker.start();
        const { data: userData, error: userDataError } = await supabase
          .from('users')
          .select('user_type')
          .eq('id', userId)
          .single();
        
        perfTracker.logPerformance('Fetching user type');
        
        if (!userDataError && userData && userData.user_type) {
          userType = userData.user_type;
        }
      } catch (err) {
        console.error("Error fetching user type:", err);
      }
    }
    
    // Update the cached user data with profile information
    const updatedUserData = {
      ...basicUserData,
      userType: userType,
      name: profile?.name || basicUserData.name,
      bio: profile?.bio || "",
      profileImage: profile?.profile_image || "",
      walletAddress: profile?.wallet_address || "",
      skills: profile?.skills || [],
      industries: profile?.industries || [],
      experience: profile?.experience || [],
      education: profile?.education || [],
      portfolio: profile?.portfolio || []
    };
    
    // Update the cache
    profileCache.set(userId, updatedUserData);
    
    // Dispatch an event to notify components of the profile update
    window.dispatchEvent(new CustomEvent('user-profile-updated', { 
      detail: { userId } 
    }));
  } catch (error) {
    console.error("Error updating user profile:", error);
  }
}

/**
 * Create or update user profile
 * @param {string} userId - User ID
 * @param {Object} profileData - Profile data to update
 * @returns {Promise<Object>} Updated profile
 */
export const updateProfile = async (userId, profileData) => {
  try {
    perfTracker.start();
    
    const { data, error } = await supabase
      .from(TABLES.PROFILES)
      .upsert({ id: userId, ...profileData, updated_at: new Date() })
      .select()
      .single();
    
    perfTracker.logPerformance('Updating profile');

    if (error) {
      throw error;
    }

    // Update cache if exists
    if (profileCache.has(userId)) {
      const cachedUser = profileCache.get(userId);
      profileCache.set(userId, { ...cachedUser, ...profileData });
    }

    return data;
  } catch (error) {
    console.error("Error updating profile:", error);
    throw error;
  }
};

/**
 * Upload profile image - optimized with pre-signed URL
 * @param {string} userId - User ID
 * @param {File} file - Image file to upload
 * @returns {Promise<string>} URL of uploaded image
 */
export const uploadProfileImage = async (userId, file) => {
  try {
    perfTracker.start();
    
    const fileExt = file.name.split(".").pop();
    const fileName = `${userId}-${Date.now()}.${fileExt}`;
    const filePath = `profile-images/${fileName}`;

    // Upload directly
    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });
    
    perfTracker.logPerformance('Uploading profile image');

    if (uploadError) {
      throw uploadError;
    }

    // Get the public URL
    const { data: urlData } = supabase.storage
      .from("avatars")
      .getPublicUrl(filePath);

    // Update profile with new image URL
    await updateProfile(userId, { profile_image: urlData.publicUrl });

    // Update cache with new image URL
    if (profileCache.has(userId)) {
      const cachedUser = profileCache.get(userId);
      profileCache.set(userId, { 
        ...cachedUser, 
        profileImage: urlData.publicUrl 
      });
    }

    return urlData.publicUrl;
  } catch (error) {
    console.error("Error uploading profile image:", error);
    throw error;
  }
};

/**
 * Update user wallet address
 * @param {string} userId - User ID
 * @param {string} walletAddress - Ethereum wallet address
 * @returns {Promise<Object>} Updated profile
 */
export const updateWalletAddress = async (userId, walletAddress) => {
  try {
    const { data, error } = await supabase
      .from(TABLES.PROFILES)
      .upsert({
        id: userId,
        wallet_address: walletAddress,
        updated_at: new Date(),
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    // Update cache
    if (profileCache.has(userId)) {
      const cachedUser = profileCache.get(userId);
      profileCache.set(userId, { 
        ...cachedUser, 
        walletAddress: walletAddress 
      });
    }

    return data;
  } catch (error) {
    console.error("Error updating wallet address:", error);
    throw error;
  }
};

/**
 * Check if email exists
 * @param {string} email - Email to check
 * @returns {Promise<boolean>} True if email exists
 */
export const checkEmailExists = async (email) => {
  try {
    perfTracker.start();
    
    // Check if the email exists in auth.users
    const { data, error } = await supabase
      .from("users")
      .select("id")
      .eq("email", email)
      .maybeSingle();
    
    perfTracker.logPerformance('Checking email existence');

    if (error) {
      console.error("Error checking email:", error);
      return false;
    }

    return !!data;
  } catch (error) {
    console.error("Error checking email:", error);
    return false;
  }
};

/**
 * Send password reset email
 * @param {string} email - Email to send reset link to
 * @returns {Promise<void>}
 */
export const resetPassword = async (email) => {
  try {
    perfTracker.start();
    
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    
    perfTracker.logPerformance('Sending password reset email');

    if (error) {
      throw error;
    }
  } catch (error) {
    console.error("Error sending password reset:", error);
    throw error;
  }
};

/**
 * Update password
 * @param {string} newPassword - New password
 * @returns {Promise<void>}
 */
export const updatePassword = async (newPassword) => {
  try {
    perfTracker.start();
    
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });
    
    perfTracker.logPerformance('Updating password');

    if (error) {
      throw error;
    }
  } catch (error) {
    console.error("Error updating password:", error);
    throw error;
  }
};

/**
 * Clear profile cache for testing or when needed
 */
export const clearProfileCache = () => {
  profileCache.clear();
};