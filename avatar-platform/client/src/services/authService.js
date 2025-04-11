import { supabase, TABLES } from "./supabaseClient";

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

    // Get user profile data
    const { data: profile, error: profileError } = await supabase
      .from(TABLES.PROFILES)
      .select("*")
      .eq("id", user.id)
      .single();

    if (profileError && profileError.code !== "PGRST116") {
      console.error("Error fetching user profile:", profileError);
    }

    // Get pending matches count
    const { data: pendingMatches, error: matchesError } = await supabase
      .from(TABLES.MATCHES)
      .select("id")
      .eq(
        user.user_metadata.user_type === "investor"
          ? "investor_id"
          : "freelancer_id",
        user.id
      )
      .eq("status", "pending");

    if (matchesError) {
      console.error("Error fetching pending matches:", matchesError);
    }

    return {
      id: user.id,
      email: user.email,
      userType: user.user_metadata?.user_type || "freelancer",
      name: profile?.name || user.user_metadata?.name || "",
      bio: profile?.bio || "",
      profileImage: profile?.profile_image || "",
      walletAddress: profile?.wallet_address || "",
      skills: profile?.skills || [],
      industries: profile?.industries || [],
      experience: profile?.experience || [],
      education: profile?.education || [],
      portfolio: profile?.portfolio || [],
      pendingMatches: pendingMatches || [],
      createdAt: user.created_at,
    };
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

    return data;
  } catch (error) {
    console.error("Error updating profile:", error);
    throw error;
  }
};

/**
 * Upload profile image
 * @param {string} userId - User ID
 * @param {File} file - Image file to upload
 * @returns {Promise<string>} URL of uploaded image
 */
export const uploadProfileImage = async (userId, file) => {
  try {
    const fileExt = file.name.split(".").pop();
    const fileName = `${userId}-${Date.now()}.${fileExt}`;
    const filePath = `profile-images/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(filePath, file);

    if (uploadError) {
      throw uploadError;
    }

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
    const { data, error } = await supabase.rpc("check_email_exists", {
      email_to_check: email,
    });

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error("Error checking email:", error);
    throw error;
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
