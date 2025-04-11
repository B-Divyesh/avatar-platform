import { supabase, TABLES } from "./supabaseClient";

/**
 * Get all matches for the current user
 * @param {string} userType - User type (investor or freelancer)
 * @returns {Promise<Array>} Matches array
 */
export const getMatches = async (userType) => {
  try {
    const { data: session } = await supabase.auth.getSession();
    if (!session?.user) {
      throw new Error("Not authenticated");
    }

    const userId = session.user.id;
    const field = userType === "investor" ? "investor_id" : "freelancer_id";
    
    // Get matches with accepted status
    const { data, error } = await supabase
      .from(TABLES.MATCHES)
      .select(`
        id,
        status,
        created_at,
        investor:investor_id (
          id, 
          email,
          profiles:profiles (name, profile_image)
        ),
        freelancer:freelancer_id (
          id,
          email,
          profiles:profiles (name, profile_image)
        )
      `)
      .eq(field, userId)
      .eq("status", "accepted")
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }

    // Format data for display
    const formattedMatches = data.map((match) => {
      const otherParty = userType === "investor" ? match.freelancer : match.investor;
      
      return {
        id: otherParty.id,
        matchId: match.id,
        name: otherParty.profiles?.name || otherParty.email || "Unknown",
        email: otherParty.email,
        profileImage: otherParty.profiles?.profile_image || null,
        status: match.status,
        isOnline: false, // This would come from a real-time status service
        lastMessage: null, // This would come from the last message in chat
        lastMessageTime: null, // This would come from the last message timestamp
        unreadCount: 0, // This would be calculated from unread messages
        requestedAt: match.created_at,
      };
    });

    return formattedMatches;
  } catch (error) {
    console.error("Error fetching matches:", error);
    throw error;
  }
};

/**
 * Get pending match requests
 * @param {string} userType - User type (investor or freelancer)
 * @returns {Promise<Array>} Pending matches array
 */
export const getPendingMatches = async (userType) => {
  try {
    const { data: session } = await supabase.auth.getSession();
    if (!session?.user) {
      throw new Error("Not authenticated");
    }

    const userId = session.user.id;
    const otherField = userType === "investor" ? "freelancer_id" : "investor_id";
    const userField = userType === "investor" ? "investor_id" : "freelancer_id";
    
    // Get pending match requests intended for this user
    const { data, error } = await supabase
      .from(TABLES.MATCHES)
      .select(`
        id,
        status,
        created_at,
        investor:investor_id (
          id, 
          email,
          profiles:profiles (name, profile_image)
        ),
        freelancer:freelancer_id (
          id,
          email,
          profiles:profiles (name, profile_image)
        )
      `)
      .eq(userField, userId)
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }

    // Format data for display
    const formattedMatches = data.map((match) => {
      const otherParty = userType === "investor" ? match.freelancer : match.investor;
      
      return {
        id: otherParty.id,
        matchId: match.id,
        name: otherParty.profiles?.name || otherParty.email || "Unknown",
        email: otherParty.email,
        profileImage: otherParty.profiles?.profile_image || null,
        status: match.status,
        requestedAt: match.created_at,
      };
    });

    return formattedMatches;
  } catch (error) {
    console.error("Error fetching pending matches:", error);
    throw error;
  }
};

/**
 * Request match with another user
 * @param {string} otherUserId - ID of user to match with
 * @param {string} userType - Current user type (investor or freelancer)
 * @returns {Promise<Object>} Created match
 */
export const requestMatch = async (otherUserId, userType) => {
  try {
    const { data: session } = await supabase.auth.getSession();
    if (!session?.user) {
      throw new Error("Not authenticated");
    }

    const userId = session.user.id;
    
    // Check if match already exists
    const { data: existingMatch, error: checkError } = await supabase
      .from(TABLES.MATCHES)
      .select("*")
      .or(`and(investor_id.eq.${userId},freelancer_id.eq.${otherUserId}),and(investor_id.eq.${otherUserId},freelancer_id.eq.${userId})`)
      .maybeSingle();

    if (checkError) {
      throw checkError;
    }

    if (existingMatch) {
      return existingMatch; // Match already exists
    }

    // Create new match
    const matchData = {
      status: "pending",
      created_at: new Date().toISOString(),
    };

    if (userType === "investor") {
      matchData.investor_id = userId;
      matchData.freelancer_id = otherUserId;
    } else {
      matchData.investor_id = otherUserId;
      matchData.freelancer_id = userId;
    }

    const { data, error } = await supabase
      .from(TABLES.MATCHES)
      .insert(matchData)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error("Error requesting match:", error);
    throw error;
  }
};

/**
 * Get match status with another user
 * @param {string} otherUserId - ID of other user
 * @returns {Promise<Object>} Match status
 */
export const getMatchStatus = async (otherUserId) => {
  try {
    const { data: session } = await supabase.auth.getSession();
    if (!session?.user) {
      return { status: "none" };
    }

    const userId = session.user.id;
    
    // Check for existing match
    const { data, error } = await supabase
      .from(TABLES.MATCHES)
      .select("*")
      .or(`and(investor_id.eq.${userId},freelancer_id.eq.${otherUserId}),and(investor_id.eq.${otherUserId},freelancer_id.eq.${userId})`)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!data) {
      return { status: "none" };
    }

    return { 
      status: data.status,
      matchId: data.id
    };
  } catch (error) {
    console.error("Error checking match status:", error);
    return { status: "none" };
  }
};

/**
 * Accept a match request
 * @param {string} matchId - Match ID
 * @returns {Promise<Object>} Updated match
 */
export const acceptMatch = async (matchId) => {
  try {
    const { data, error } = await supabase
      .from(TABLES.MATCHES)
      .update({ status: "accepted" })
      .eq("id", matchId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error("Error accepting match:", error);
    throw error;
  }
};

/**
 * Decline a match request
 * @param {string} matchId - Match ID
 * @returns {Promise<Object>} Updated match
 */
export const declineMatch = async (matchId) => {
  try {
    const { data, error } = await supabase
      .from(TABLES.MATCHES)
      .update({ status: "declined" })
      .eq("id", matchId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error("Error declining match:", error);
    throw error;
  }
};

/**
 * Get chat history with another user
 * @param {string} otherUserId - ID of other user
 * @returns {Promise<Array>} Chat messages
 */
export const getChatHistory = async (otherUserId) => {
  try {
    const { data: session } = await supabase.auth.getSession();
    if (!session?.user) {
      throw new Error("Not authenticated");
    }

    const userId = session.user.id;
    
    // Get chat messages between these users
    const { data, error } = await supabase
      .from(TABLES.CHAT_MESSAGES)
      .select("*")
      .or(`and(sender_id.eq.${userId},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${userId})`)
      .order("created_at", { ascending: true });

    if (error) {
      throw error;
    }

    // Format messages for display
    const formattedMessages = data.map((message) => ({
      id: message.id,
      text: message.message,
      user: {
        id: message.sender_id,
      },
      createdAt: message.created_at,
    }));

    return formattedMessages;
  } catch (error) {
    console.error("Error fetching chat history:", error);
    // Return empty array instead of throwing to avoid UI errors
    return [];
  }
};

/**
 * Send a chat message to another user
 * @param {string} receiverId - ID of message recipient
 * @param {string} message - Message text
 * @returns {Promise<Object>} Created message
 */
export const sendChatMessage = async (receiverId, message) => {
  try {
    const { data: session } = await supabase.auth.getSession();
    if (!session?.user) {
      throw new Error("Not authenticated");
    }

    const senderId = session.user.id;
    
    // Insert new message
    const { data, error } = await supabase
      .from(TABLES.CHAT_MESSAGES)
      .insert({
        sender_id: senderId,
        receiver_id: receiverId,
        message: message,
        read: false,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error("Error sending message:", error);
    throw error;
  }
};