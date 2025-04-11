import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Paper,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Divider,
  Button,
  IconButton,
  Chip,
  Badge,
  CircularProgress,
  Snackbar,
  Alert,
  useTheme,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import {
  Check as AcceptIcon,
  Close as DeclineIcon,
  Message as MessageIcon,
  VideoCall as VideoIcon,
  CalendarMonth as CalendarIcon,
  Send as SendIcon,
  SentimentSatisfied as EmojiIcon,
  AttachFile as AttachIcon,
  MoreVert as MoreIcon,
  ChatBubble as ChatIcon,
  InsertInvitation as InviteIcon,
  Person as PersonIcon,
  NotificationsActive as NotificationIcon,
  NotificationsOff as NotificationOffIcon,
} from "@mui/icons-material";

import {
  Channel,
  Chat,
  Window,
  MessageList,
  MessageInput,
} from "stream-chat-react";
import "stream-chat-react/dist/css/index.css";
import { StreamChat } from "stream-chat";

import Navigation from "../../components/Navigation";
import { useAuth } from "../../context/AuthContext";
import {
  getMatches,
  acceptMatch,
  declineMatch,
  getPendingMatches,
  getChatHistory,
} from "../../services/matchService";

// Styled components
const Container = styled(Box)(({ theme }) => ({
  backgroundColor: theme.colors.background.default,
  minHeight: "100vh",
  padding: theme.spacing(2),
}));

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(0),
  marginBottom: theme.spacing(3),
  backgroundColor: theme.colors.background.paper,
  overflow: "hidden",
}));

const MatchItem = styled(ListItem)(({ theme, selected }) => ({
  cursor: "pointer",
  backgroundColor: selected ? "rgba(233, 30, 99, 0.08)" : "inherit",
  "&:hover": {
    backgroundColor: selected
      ? "rgba(233, 30, 99, 0.12)"
      : "rgba(0, 0, 0, 0.04)",
  },
}));

const ChatHeader = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2),
  borderBottom: `1px solid ${theme.divider}`,
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
}));

const ChatInput = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2),
  borderTop: `1px solid ${theme.divider}`,
  display: "flex",
  alignItems: "center",
}));

const ChatBody = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2),
  height: "60vh",
  overflowY: "auto",
}));

const MessageBubble = styled(Box)(({ theme, sent }) => ({
  maxWidth: "70%",
  padding: theme.spacing(1.5),
  marginBottom: theme.spacing(1),
  borderRadius: sent ? "18px 18px 0 18px" : "18px 18px 18px 0",
  backgroundColor: sent ? theme.colors.secondary.main : "#f0f0f0",
  color: sent ? "#fff" : theme.colors.text.primary,
  alignSelf: sent ? "flex-end" : "flex-start",
}));

const TabPanel = (props) => {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`match-tabpanel-${index}`}
      aria-labelledby={`match-tab-${index}`}
      {...other}
    >
      {value === index && <Box>{children}</Box>}
    </div>
  );
};

// Main component - matches can be 'investor' or 'freelancer'
const Match = ({ userType = "investor" }) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  // The other user type (opposite of current user)
  const otherUserType = userType === "investor" ? "freelancer" : "investor";

  // State
  const [activeTab, setActiveTab] = useState(0);
  const [matches, setMatches] = useState([]);
  const [pendingMatches, setPendingMatches] = useState([]);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [chatClient, setChatClient] = useState(null);
  const [channel, setChannel] = useState(null);
  const [messageText, setMessageText] = useState("");
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Initialize Stream Chat
  useEffect(() => {
    const initChat = async () => {
      try {
        // In a real app, you would get this from your backend
        const client = StreamChat.getInstance("your-stream-api-key");

        if (currentUser) {
          await client.connectUser(
            {
              id: currentUser.id,
              name: currentUser.displayName || currentUser.email,
              image: currentUser.profileImage,
            },
            "dummy-token" // In a real app, you would get this from your backend
          );

          setChatClient(client);
        }
      } catch (err) {
        console.error("Error connecting to Stream Chat:", err);
      }
    };

    if (currentUser && !chatClient) {
      initChat();
    }

    return () => {
      // Cleanup chat connection when component unmounts
      if (chatClient) {
        chatClient.disconnectUser();
      }
    };
  }, [currentUser]);

  // Fetch matches and pending matches
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch confirmed matches
        const matchesData = await getMatches(userType);
        setMatches(matchesData);

        // Fetch pending match requests
        const pendingData = await getPendingMatches(userType);
        setPendingMatches(pendingData);
      } catch (err) {
        console.error("Error fetching matches:", err);
        setError("Failed to load matches. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userType]);

  // Set up chat channel when a match is selected
  useEffect(() => {
    const setupChannel = async () => {
      if (chatClient && selectedMatch) {
        // Create or get existing channel
        const channelId = ["user", currentUser.id, "match", selectedMatch.id]
          .sort()
          .join("-");

        const channel = chatClient.channel("messaging", channelId, {
          members: [currentUser.id, selectedMatch.id],
          name: `Chat with ${selectedMatch.name}`,
        });

        await channel.watch();
        setChannel(channel);

        // Fetch chat history
        const history = await getChatHistory(selectedMatch.id);
        setChatMessages(history);
      }
    };

    if (selectedMatch) {
      setupChannel();
    }

    return () => {
      // Stop watching channel when component unmounts or selected match changes
      if (channel) {
        channel.stopWatching();
      }
    };
  }, [selectedMatch, chatClient, currentUser]);

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    setSelectedMatch(null);
  };

  // Handle accepting a match request
  const handleAcceptMatch = async (matchId) => {
    try {
      await acceptMatch(matchId);

      // Update pending matches list
      setPendingMatches(pendingMatches.filter((match) => match.id !== matchId));

      // Fetch confirmed matches
      const updatedMatches = await getMatches(userType);
      setMatches(updatedMatches);

      setSuccess(
        "Match request accepted! You can now chat with this connection."
      );
    } catch (err) {
      console.error("Error accepting match:", err);
      setError("Failed to accept match. Please try again.");
    }
  };

  // Handle declining a match request
  const handleDeclineMatch = async (matchId) => {
    try {
      await declineMatch(matchId);

      // Update pending matches list
      setPendingMatches(pendingMatches.filter((match) => match.id !== matchId));

      setSuccess("Match request declined.");
    } catch (err) {
      console.error("Error declining match:", err);
      setError("Failed to decline match. Please try again.");
    }
  };

  // Handle sending a message
  const handleSendMessage = () => {
    if (!messageText.trim() || !channel) return;

    // In a real app, you would use the Stream Chat SDK
    // channel.sendMessage({ text: messageText });

    // For demo purposes, add message locally
    const newMessage = {
      id: Date.now().toString(),
      text: messageText,
      user: {
        id: currentUser.id,
      },
      createdAt: new Date(),
    };

    setChatMessages([...chatMessages, newMessage]);
    setMessageText("");
  };

  // Handle view profile
  const handleViewProfile = (id) => {
    navigate(`/profile/${id}`);
  };

  // Render loading state
  if (loading) {
    return (
      <>
        <Navigation />
        <Container>
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              height: "80vh",
            }}
          >
            <CircularProgress />
          </Box>
        </Container>
      </>
    );
  }

  return (
    <>
      <Navigation />
      <Container>
        <Typography variant="h4" gutterBottom>
          {userType === "investor"
            ? "Connect with Freelancers & Startups"
            : "Connect with Investors"}
        </Typography>

        <StyledPaper>
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            textColor="secondary"
            indicatorColor="secondary"
            sx={{ borderBottom: 1, borderColor: "divider" }}
          >
            <Tab label="Matches" icon={<ChatIcon />} iconPosition="start" />
            <Tab
              label={
                <Badge badgeContent={pendingMatches.length} color="error">
                  Requests
                </Badge>
              }
              icon={<NotificationIcon />}
              iconPosition="start"
            />
          </Tabs>

          <Box sx={{ display: "flex", height: "70vh" }}>
            <TabPanel
              value={activeTab}
              index={0}
              sx={{ width: "30%", borderRight: 1, borderColor: "divider" }}
            >
              <List
                sx={{
                  width: "100%",
                  maxWidth: 360,
                  bgcolor: "background.paper",
                  p: 0,
                }}
              >
                {matches.length === 0 ? (
                  <Box sx={{ p: 3, textAlign: "center" }}>
                    <Typography variant="body1" color="text.secondary">
                      No matches yet.
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mt: 1 }}
                    >
                      Explore potential {otherUserType}s in the home page and
                      request matches.
                    </Typography>
                  </Box>
                ) : (
                  matches.map((match) => (
                    <React.Fragment key={match.id}>
                      <MatchItem
                        alignItems="flex-start"
                        selected={selectedMatch?.id === match.id}
                        onClick={() => setSelectedMatch(match)}
                      >
                        <ListItemAvatar>
                          <Avatar src={match.profileImage} alt={match.name}>
                            {!match.profileImage && match.name.charAt(0)}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={match.name}
                          secondary={
                            <React.Fragment>
                              <Typography
                                component="span"
                                variant="body2"
                                color="text.primary"
                                sx={{ display: "inline" }}
                              >
                                {match.lastMessage || "Start a conversation"}
                              </Typography>
                              {match.lastMessageTime && (
                                <Typography
                                  component="span"
                                  variant="caption"
                                  color="text.secondary"
                                  sx={{ display: "block", mt: 0.5 }}
                                >
                                  {new Date(
                                    match.lastMessageTime
                                  ).toLocaleTimeString([], {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </Typography>
                              )}
                            </React.Fragment>
                          }
                        />
                        {match.unreadCount > 0 && (
                          <Badge
                            badgeContent={match.unreadCount}
                            color="error"
                          />
                        )}
                      </MatchItem>
                      <Divider variant="inset" component="li" />
                    </React.Fragment>
                  ))
                )}
              </List>
            </TabPanel>

            <TabPanel
              value={activeTab}
              index={1}
              sx={{ width: "30%", borderRight: 1, borderColor: "divider" }}
            >
              <List
                sx={{
                  width: "100%",
                  maxWidth: 360,
                  bgcolor: "background.paper",
                  p: 0,
                }}
              >
                {pendingMatches.length === 0 ? (
                  <Box sx={{ p: 3, textAlign: "center" }}>
                    <Typography variant="body1" color="text.secondary">
                      No pending requests.
                    </Typography>
                  </Box>
                ) : (
                  pendingMatches.map((match) => (
                    <React.Fragment key={match.id}>
                      <MatchItem alignItems="flex-start">
                        <ListItemAvatar>
                          <Avatar src={match.profileImage} alt={match.name}>
                            {!match.profileImage && match.name.charAt(0)}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={match.name}
                          secondary={
                            <React.Fragment>
                              <Typography
                                component="span"
                                variant="body2"
                                color="text.primary"
                                sx={{ display: "inline" }}
                              >
                                {match.title ||
                                  (userType === "investor"
                                    ? "Freelancer"
                                    : "Investor")}
                              </Typography>
                              <Typography
                                component="span"
                                variant="caption"
                                color="text.secondary"
                                sx={{ display: "block", mt: 0.5 }}
                              >
                                Requested{" "}
                                {new Date(
                                  match.requestedAt
                                ).toLocaleDateString()}
                              </Typography>
                            </React.Fragment>
                          }
                        />
                        <Box
                          sx={{
                            display: "flex",
                            flexDirection: "column",
                            gap: 1,
                          }}
                        >
                          <IconButton
                            aria-label="accept"
                            color="success"
                            onClick={() => handleAcceptMatch(match.id)}
                          >
                            <AcceptIcon />
                          </IconButton>
                          <IconButton
                            aria-label="decline"
                            color="error"
                            onClick={() => handleDeclineMatch(match.id)}
                          >
                            <DeclineIcon />
                          </IconButton>
                        </Box>
                      </MatchItem>
                      <Divider variant="inset" component="li" />
                    </React.Fragment>
                  ))
                )}
              </List>
            </TabPanel>

            {/* Chat area */}
            <Box sx={{ flex: 1, display: "flex", flexDirection: "column" }}>
              {selectedMatch ? (
                <>
                  <ChatHeader>
                    <Box sx={{ display: "flex", alignItems: "center" }}>
                      <Avatar
                        src={selectedMatch.profileImage}
                        alt={selectedMatch.name}
                        sx={{ mr: 2 }}
                      >
                        {!selectedMatch.profileImage &&
                          selectedMatch.name.charAt(0)}
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle1">
                          {selectedMatch.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {selectedMatch.isOnline ? "Online" : "Offline"}
                        </Typography>
                      </Box>
                    </Box>
                    <Box>
                      <IconButton
                        aria-label="video call"
                        onClick={() => console.log("Video call")}
                      >
                        <VideoIcon />
                      </IconButton>
                      <IconButton
                        aria-label="schedule meeting"
                        onClick={() => console.log("Schedule meeting")}
                      >
                        <CalendarIcon />
                      </IconButton>
                      <IconButton
                        aria-label="view profile"
                        onClick={() => handleViewProfile(selectedMatch.id)}
                      >
                        <PersonIcon />
                      </IconButton>
                    </Box>
                  </ChatHeader>

                  <ChatBody sx={{ display: "flex", flexDirection: "column" }}>
                    {chatMessages.length === 0 ? (
                      <Box
                        sx={{
                          flex: 1,
                          display: "flex",
                          justifyContent: "center",
                          alignItems: "center",
                          flexDirection: "column",
                          p: 3,
                        }}
                      >
                        <InviteIcon
                          sx={{ fontSize: 60, color: "text.disabled", mb: 2 }}
                        />
                        <Typography
                          variant="h6"
                          color="text.secondary"
                          gutterBottom
                        >
                          Start Conversation
                        </Typography>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          align="center"
                        >
                          Send a message to begin chatting with{" "}
                          {selectedMatch.name}
                        </Typography>
                      </Box>
                    ) : (
                      chatMessages.map((message) => (
                        <MessageBubble
                          key={message.id}
                          sent={message.user.id === currentUser.id}
                          sx={{
                            alignSelf:
                              message.user.id === currentUser.id
                                ? "flex-end"
                                : "flex-start",
                          }}
                        >
                          <Typography variant="body1">
                            {message.text}
                          </Typography>
                          <Typography
                            variant="caption"
                            sx={{ display: "block", mt: 0.5, opacity: 0.7 }}
                          >
                            {new Date(message.createdAt).toLocaleTimeString(
                              [],
                              { hour: "2-digit", minute: "2-digit" }
                            )}
                          </Typography>
                        </MessageBubble>
                      ))
                    )}
                  </ChatBody>

                  <ChatInput>
                    <IconButton size="small" sx={{ mr: 1 }}>
                      <AttachIcon />
                    </IconButton>
                    <TextField
                      fullWidth
                      placeholder="Type a message..."
                      variant="outlined"
                      size="small"
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === "Enter") {
                          handleSendMessage();
                        }
                      }}
                      sx={{ mr: 1 }}
                    />
                    <IconButton size="small" sx={{ mr: 1 }}>
                      <EmojiIcon />
                    </IconButton>
                    <IconButton
                      color="primary"
                      onClick={handleSendMessage}
                      disabled={!messageText.trim()}
                      sx={{
                        bgcolor: theme.colors.secondary.main,
                        color: "#fff",
                        "&:hover": { bgcolor: theme.colors.secondary.dark },
                        "&.Mui-disabled": {
                          bgcolor: "rgba(233, 30, 99, 0.3)",
                          color: "rgba(255, 255, 255, 0.7)",
                        },
                      }}
                    >
                      <SendIcon />
                    </IconButton>
                  </ChatInput>
                </>
              ) : (
                <Box
                  sx={{
                    flex: 1,
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    flexDirection: "column",
                    p: 3,
                  }}
                >
                  <MessageIcon
                    sx={{ fontSize: 60, color: "text.disabled", mb: 2 }}
                  />
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    Select a conversation
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    align="center"
                  >
                    Choose a match from the list to start chatting
                  </Typography>
                </Box>
              )}
            </Box>
          </Box>
        </StyledPaper>

        {/* Error Snackbar */}
        <Snackbar
          open={!!error}
          autoHideDuration={6000}
          onClose={() => setError(null)}
        >
          <Alert
            onClose={() => setError(null)}
            severity="error"
            sx={{ width: "100%" }}
          >
            {error}
          </Alert>
        </Snackbar>

        {/* Success Snackbar */}
        <Snackbar
          open={!!success}
          autoHideDuration={6000}
          onClose={() => setSuccess(null)}
        >
          <Alert
            onClose={() => setSuccess(null)}
            severity="success"
            sx={{ width: "100%" }}
          >
            {success}
          </Alert>
        </Snackbar>
      </Container>
    </>
  );
};

export default Match;
