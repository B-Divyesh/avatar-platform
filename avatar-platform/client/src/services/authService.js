import { supabase, TABLES } from "./supabaseClient";

// Cache for user profiles to avoid repeated API calls
const profileCache = new Map();

/**
 * Get current authenticated user with profile data
 * @returns {Promise<Object|null>} User object with profile data or null if not authenticated
 */
export const getCurrentUser = async () => {
  try {
    // Get session data
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session) {
      return null;
    }

    const user = session.user;
    
    // Check cache first
    if (profileCache.has(user.id)) {
      return profileCache.get(user.id);
    }

    // Get user profile data
    const { data: profile, error: profileError } = await supabase
      .from(TABLES.PROFILES)
      .select("*")
      .eq("id", user.id)
      .single();

    if (profileError && profileError.code !== "PGRST116") {
      console.error("Error fetching user profile:", profileError);
    }

    // Determine user type from user metadata or default to "freelancer"
    const userType = user.user_metadata?.user_type || "freelancer";

    // Create basic user data without dependent API calls
    const userData = {
      id: user.id,
      email: user.email,
      userType: userType,
      name: profile?.name || user.user_metadata?.name || "",
      bio: profile?.bio || "",
      profileImage: profile?.profile_image || "",
      walletAddress: profile?.wallet_address || "",
      skills: profile?.skills || [],
      industries: profile?.industries || [],
      experience: profile?.experience || [],
      education: profile?.education || [],
      portfolio: profile?.portfolio || [],
      pendingMatches: [], // Avoid extra API call, will be populated on demand
      createdAt: user.created_at,
    };

    // Cache the user data
    profileCache.set(user.id, userData);
    return userData;
  } catch (error) {
    console.error("Error in getCurrentUser:", error);
    return null;
  }
};

/**
 * Create or update user profile
 * @param {string} userId - User ID
 * @param {Object} profileData - Profile data to update
 * @returns {Promise<Object>} Updated profile
 */
export const updateProfile = async (userId, profileData) => {
  try {
    const { data, error } = await supabase
      .from(TABLES.PROFILES)
      .upsert({ id: userId, ...profileData, updated_at: new Date() })
      .select()
      .single();

    if (error) {
      throw error;
    }

    // Update cache
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

    if (uploadError) {
      throw uploadError;
    }

    // Get the public URL
    const { data: urlData } = supabase.storage
      .from("avatars")
      .getPublicUrl(filePath);

    // Update profile with new image URL
    await updateProfile(userId, { profile_image: urlData.publicUrl });

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
      profileCache.set(userId, { ...cachedUser, walletAddress });
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
    // Check if the email exists in auth.users
    const { data, error } = await supabase
      .from("users")
      .select("id")
      .eq("email", email)
      .maybeSingle();

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
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

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
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      throw error;
    }
  } catch (error) {
    console.error("Error updating password:", error);
    throw error;
  }
};