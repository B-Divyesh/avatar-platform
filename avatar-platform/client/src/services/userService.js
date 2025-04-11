import { supabase, TABLES } from "./supabaseClient";

/**
 * Get all freelancers
 * @param {number} limit - Maximum number of records to return
 * @param {number} offset - Number of records to skip
 * @returns {Promise<Array>} Array of freelancer profiles
 */
export const getFreelancers = async (limit = 100, offset = 0) => {
  try {
    // Join users and profiles tables
    const { data, error } = await supabase
      .from("users")
      .select(
        `
        id,
        email,
        created_at,
        profiles (
          name,
          bio,
          profile_image,
          wallet_address,
          skills,
          experience,
          education,
          portfolio
        )
      `
      )
      .eq("user_type", "freelancer")
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw error;
    }

    // Get completed contracts count for each freelancer
    const freelancersWithStats = await Promise.all(
      data.map(async (freelancer) => {
        // Get contracts count
        const { count: contractsCount, error: contractsError } = await supabase
          .from(TABLES.CONTRACTS)
          .select("id", { count: "exact", head: true })
          .eq("freelancer_id", freelancer.id)
          .eq("status", "completed");

        if (contractsError) {
          console.error("Error fetching contracts count:", contractsError);
        }

        // Calculate average rating from contracts
        const { data: contractsData, error: ratingsError } = await supabase
          .from(TABLES.CONTRACTS)
          .select("rating")
          .eq("freelancer_id", freelancer.id)
          .not("rating", "is", null);

        if (ratingsError) {
          console.error("Error fetching ratings:", ratingsError);
        }

        let averageRating = 0;
        if (contractsData && contractsData.length > 0) {
          const sum = contractsData.reduce(
            (acc, contract) => acc + (contract.rating || 0),
            0
          );
          averageRating = sum / contractsData.length;
        }

        return {
          id: freelancer.id,
          email: freelancer.email,
          name: freelancer.profiles?.name || "",
          bio: freelancer.profiles?.bio || "",
          profileImage: freelancer.profiles?.profile_image || "",
          walletAddress: freelancer.profiles?.wallet_address || "",
          skills: freelancer.profiles?.skills || [],
          experience: freelancer.profiles?.experience || [],
          education: freelancer.profiles?.education || [],
          portfolio: freelancer.profiles?.portfolio || [],
          completedContracts: contractsCount || 0,
          rating: averageRating || 0,
          createdAt: freelancer.created_at,
        };
      })
    );

    return freelancersWithStats;
  } catch (error) {
    console.error("Error fetching freelancers:", error);
    throw error;
  }
};

/**
 * Get all investors
 * @param {number} limit - Maximum number of records to return
 * @param {number} offset - Number of records to skip
 * @returns {Promise<Array>} Array of investor profiles
 */
export const getInvestors = async (limit = 100, offset = 0) => {
  try {
    // Join users and profiles tables
    const { data, error } = await supabase
      .from("users")
      .select(
        `
        id,
        email,
        created_at,
        profiles (
          name,
          bio,
          profile_image,
          wallet_address,
          industries
        )
      `
      )
      .eq("user_type", "investor")
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw error;
    }

    // Get investment stats for each investor
    const investorsWithStats = await Promise.all(
      data.map(async (investor) => {
        // Get contracts count
        const { count: contractsCount, error: contractsError } = await supabase
          .from(TABLES.CONTRACTS)
          .select("id", { count: "exact", head: true })
          .eq("investor_id", investor.id);

        if (contractsError) {
          console.error("Error fetching contracts count:", contractsError);
        }

        // Get average investment amount
        const { data: contractsData, error: investmentsError } = await supabase
          .from(TABLES.CONTRACTS)
          .select("value")
          .eq("investor_id", investor.id)
          .not("value", "is", null);

        if (investmentsError) {
          console.error("Error fetching investment amounts:", investmentsError);
        }

        let averageInvestment = 0;
        if (contractsData && contractsData.length > 0) {
          const sum = contractsData.reduce(
            (acc, contract) => acc + (contract.value || 0),
            0
          );
          averageInvestment = sum / contractsData.length;
        }

        return {
          id: investor.id,
          email: investor.email,
          name: investor.profiles?.name || "",
          bio: investor.profiles?.bio || "",
          profileImage: investor.profiles?.profile_image || "",
          walletAddress: investor.profiles?.wallet_address || "",
          industries: investor.profiles?.industries || [],
          completedInvestments: contractsCount || 0,
          averageInvestment: averageInvestment || 0,
          createdAt: investor.created_at,
        };
      })
    );

    return investorsWithStats;
  } catch (error) {
    console.error("Error fetching investors:", error);
    throw error;
  }
};

/**
 * Get user profile by ID
 * @param {string} userId - User ID
 * @returns {Promise<Object>} User profile
 */
export const getUserById = async (userId) => {
  try {
    // Get user data
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("*")
      .eq("id", userId)
      .single();

    if (userError) {
      throw userError;
    }

    // Get profile data
    const { data: profileData, error: profileError } = await supabase
      .from(TABLES.PROFILES)
      .select("*")
      .eq("id", userId)
      .single();

    if (profileError && profileError.code !== "PGRST116") {
      console.error("Error fetching user profile:", profileError);
    }

    // Get contracts data
    const { data: contractsData, error: contractsError } = await supabase
      .from(TABLES.CONTRACTS)
      .select("*")
      .or(`investor_id.eq.${userId},freelancer_id.eq.${userId}`)
      .order("created_at", { ascending: false });

    if (contractsError) {
      console.error("Error fetching user contracts:", contractsError);
    }

    // Calculate statistics
    let completedContracts = 0;
    let rating = 0;
    let ratingsCount = 0;

    if (contractsData) {
      completedContracts = contractsData.filter(
        (c) => c.status === "completed"
      ).length;

      const ratings = contractsData
        .filter((c) => c.rating && c.status === "completed")
        .map((c) => c.rating);

      if (ratings.length > 0) {
        rating = ratings.reduce((sum, r) => sum + r, 0) / ratings.length;
        ratingsCount = ratings.length;
      }
    }

    return {
      id: userId,
      email: userData.email,
      userType: userData.user_type,
      name: profileData?.name || "",
      bio: profileData?.bio || "",
      profileImage: profileData?.profile_image || "",
      walletAddress: profileData?.wallet_address || "",
      skills: profileData?.skills || [],
      industries: profileData?.industries || [],
      experience: profileData?.experience || [],
      education: profileData?.education || [],
      portfolio: profileData?.portfolio || [],
      contracts: contractsData || [],
      completedContracts,
      rating,
      ratingsCount,
      createdAt: userData.created_at,
    };
  } catch (error) {
    console.error("Error fetching user by ID:", error);
    throw error;
  }
};

/**
 * Search users
 * @param {string} query - Search query
 * @param {string} userType - User type filter ('investor' or 'freelancer')
 * @param {Array} filters - Additional filters
 * @returns {Promise<Array>} Array of matching users
 */
export const searchUsers = async (query, userType = null, filters = {}) => {
  try {
    let searchQuery = supabase.from("users").select(`
        id,
        email,
        user_type,
        created_at,
        profiles (
          name,
          bio,
          profile_image,
          wallet_address,
          skills,
          industries
        )
      `);

    // Apply user type filter if provided
    if (userType) {
      searchQuery = searchQuery.eq("user_type", userType);
    }

    // Apply text search
    if (query && query.trim() !== "") {
      searchQuery = searchQuery.or(
        `profiles.name.ilike.%${query}%,profiles.bio.ilike.%${query}%`
      );
    }

    // Apply additional filters
    if (filters.skills && filters.skills.length > 0) {
      // This assumes skills are stored as an array in the profiles table
      searchQuery = searchQuery.contains("profiles.skills", filters.skills);
    }

    if (filters.industries && filters.industries.length > 0) {
      // This assumes industries are stored as an array in the profiles table
      searchQuery = searchQuery.contains(
        "profiles.industries",
        filters.industries
      );
    }

    const { data, error } = await searchQuery.order("created_at", {
      ascending: false,
    });

    if (error) {
      throw error;
    }

    return data.map((user) => ({
      id: user.id,
      email: user.email,
      userType: user.user_type,
      name: user.profiles?.name || "",
      bio: user.profiles?.bio || "",
      profileImage: user.profiles?.profile_image || "",
      walletAddress: user.profiles?.wallet_address || "",
      skills: user.profiles?.skills || [],
      industries: user.profiles?.industries || [],
      createdAt: user.created_at,
    }));
  } catch (error) {
    console.error("Error searching users:", error);
    throw error;
  }
};

/**
 * Get recommended users based on matching criteria
 * @param {string} userId - Current user ID
 * @param {number} limit - Maximum number of records to return
 * @returns {Promise<Array>} Array of recommended users
 */
export const getRecommendedUsers = async (userId, limit = 10) => {
  try {
    // Get current user data
    const { data: currentUser, error: userError } = await getUserById(userId);

    if (userError) {
      throw userError;
    }

    // Determine if current user is investor or freelancer
    const isInvestor = currentUser.userType === "investor";

    // Get potential matches
    const { data, error } = await supabase
      .from("users")
      .select(
        `
        id,
        email,
        user_type,
        created_at,
        profiles (
          name,
          bio,
          profile_image,
          wallet_address,
          skills,
          industries
        )
      `
      )
      .eq("user_type", isInvestor ? "freelancer" : "investor")
      .limit(limit);

    if (error) {
      throw error;
    }

    // Apply recommendation algorithm (simplified for demo)
    const recommendedUsers = data.map((user) => {
      let matchScore = 0;

      if (isInvestor) {
        // For investors, match based on freelancer skills vs investor industries
        const skills = user.profiles?.skills || [];
        const industries = currentUser.industries || [];

        // Count matching skills/industries
        const matches = skills.filter((skill) =>
          industries.some((industry) =>
            skill.toLowerCase().includes(industry.toLowerCase())
          )
        ).length;

        matchScore = (matches / Math.max(skills.length, 1)) * 100;
      } else {
        // For freelancers, match based on freelancer skills vs investor industries
        const skills = currentUser.skills || [];
        const industries = user.profiles?.industries || [];

        // Count matching skills/industries
        const matches = skills.filter((skill) =>
          industries.some((industry) =>
            skill.toLowerCase().includes(industry.toLowerCase())
          )
        ).length;

        matchScore = (matches / Math.max(skills.length, 1)) * 100;
      }

      return {
        id: user.id,
        email: user.email,
        userType: user.user_type,
        name: user.profiles?.name || "",
        bio: user.profiles?.bio || "",
        profileImage: user.profiles?.profile_image || "",
        walletAddress: user.profiles?.wallet_address || "",
        skills: user.profiles?.skills || [],
        industries: user.profiles?.industries || [],
        matchScore: Math.min(Math.round(matchScore), 100),
        createdAt: user.created_at,
      };
    });

    // Sort by match score
    return recommendedUsers.sort((a, b) => b.matchScore - a.matchScore);
  } catch (error) {
    console.error("Error getting recommended users:", error);
    throw error;
  }
};
