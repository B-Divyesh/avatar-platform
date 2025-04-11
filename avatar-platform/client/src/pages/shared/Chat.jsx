import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  IconButton,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Divider,
  AppBar,
  Toolbar,
  Badge,
  CircularProgress,
  Snackbar,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  useTheme,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import {
  Send as SendIcon,
  SentimentSatisfied as EmojiIcon,
  AttachFile as AttachIcon,
  VideoCall as VideoIcon,
  Phone as CallIcon,
  MoreVert as MoreIcon,
  ArrowBack as BackIcon,
  InsertInvitation as CalendarIcon,
  Schedule as ScheduleIcon,
  Description as ContractIcon,
  Person as ProfileIcon,
  Search as SearchIcon,
} from "@mui/icons-material";

import Navigation from "../components/common/Navigation";
import { useAuth } from "../../context/AuthContext";
import { getUserById } from "../../services/userService";
import { getChatHistory, sendChatMessage, getMatches } from "../../services/matchService";

// Styled components
const Container = styled(Box)(({ theme }) => ({
  backgroundColor: theme.colors.background.default,
  minHeight: "100vh",
  padding: theme.spacing(2),
}));

const ChatContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  height: "calc(100vh - 140px)",
  borderRadius: theme.shape.borderRadius,
  overflow: "hidden",
}));

const ContactsList = styled(Box)(({ theme }) => ({
  width: 320,
  backgroundColor: theme.colors.background.paper,
  borderRight: `1px solid ${theme.divider}`,
  overflowY: "auto",
}));

const ContactItem = styled(ListItem)(({ theme, selected }) => ({
  cursor: "pointer",
  backgroundColor: selected ? "rgba(233, 30, 99, 0.08)" : "inherit",
  "&:hover": {
    backgroundColor: selected
      ? "rgba(233, 30, 99, 0.12)"
      : "rgba(0, 0, 0, 0.04)",
  },
}));

const ChatBox = styled(Box)(({ theme }) => ({
  flex: 1,
  display: "flex",
  flexDirection: "column",
  backgroundColor: theme.colors.background.paper,
}));

const ChatHeader = styled(AppBar)(({ theme }) => ({
  position: "relative",
  backgroundColor: theme.colors.background.paper,
  color: theme.colors.text.primary,
  boxShadow: "none",
  borderBottom: `1px solid ${theme.divider}`,
}));

const ChatMessages = styled(Box)(({ theme }) => ({
  flex: 1,
  padding: theme.spacing(2),
  overflowY: "auto",
  backgroundColor: theme.colors.background.default,
}));

const ChatInputContainer = styled(Box)(({ theme }) => ({
  padding: theme.spacing(1, 2),
  backgroundColor: theme.colors.background.paper,
  borderTop: `1px solid ${theme.divider}`,
  display: "flex",
  alignItems: "center",
}));

const MessageBubble = styled(Box)(({ theme, sent }) => ({
  maxWidth: "70%",
  padding: theme.spacing(1.5),
  marginBottom: theme.spacing(1),
  borderRadius: sent ? "18px 18px 0 18px" : "18px 18px 18px 0",
  backgroundColor: sent ? theme.colors.secondary.main : "#f0f0f0",
  color: sent ? "#fff" : theme.colors.text.primary,
  alignSelf: sent ? "flex-end" : "flex-start",
  position: "relative",
}));

// Main component
const Chat = () => {
  const theme = useTheme();
  const { id } = useParams(); // id of the other person
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const messagesEndRef = useRef(null);

  // State
  const [contacts, setContacts] = useState([]);
  const [selectedContact, setSelectedContact] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [error, setError] = useState(null);
  const [calendarDialogOpen, setCalendarDialogOpen] = useState(false);
  const [meetingDate, setMeetingDate] = useState("");
  const [meetingTime, setMeetingTime] = useState("");
  const [meetingTopic, setMeetingTopic] = useState("");

  // Effect to fetch contacts/matches
  useEffect(() => {
    const fetchContacts = async () => {
      try {
        // Fetch all accepted matches - these are our contacts
        const matchesData = await getMatches(currentUser.userType);
        setContacts(matchesData);

        // If we have an ID param, find that contact
        if (id) {
          const contact = matchesData.find((c) => c.id === id);
          if (contact) {
            setSelectedContact(contact);
          } else {
            // If not found in matches, fetch user details directly
            const userData = await getUserById(id);
            if (userData) {
              setSelectedContact({
                id: userData.id,
                name: userData.name,
                profileImage: userData.profileImage,
                lastMessage: null,
                lastMessageTime: null,
                unreadCount: 0,
                isOnline: false,
              });
            }
          }
        } else if (matchesData.length > 0) {
          // If no ID param, select the first contact
          setSelectedContact(matchesData[0]);
        }
      } catch (err) {
        console.error("Error fetching contacts:", err);
        setError("Failed to load contacts. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchContacts();
  }, [id, currentUser]);

  // Effect to fetch messages when selected contact changes
  useEffect(() => {
    const fetchMessages = async () => {
      if (!selectedContact) return;

      try {
        const messagesData = await getChatHistory(selectedContact.id);
        setMessages(messagesData);
      } catch (err) {
        console.error("Error fetching messages:", err);
        setError("Failed to load messages. Please try again.");
      }
    };

    fetchMessages();
  }, [selectedContact]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Handle send message
  const handleSendMessage = async () => {
    if (!messageText.trim() || !selectedContact) return;

    try {
      setSendingMessage(true);
      await sendChatMessage(selectedContact.id, messageText);

      // Optimistically add message to UI
      const newMessage = {
        id: Date.now().toString(),
        text: messageText,
        user: {
          id: currentUser.id,
        },
        createdAt: new Date(),
      };

      setMessages([...messages, newMessage]);
      setMessageText("");
    } catch (err) {
      console.error("Error sending message:", err);
      setError("Failed to send message. Please try again.");
    } finally {
      setSendingMessage(false);
    }
  };

  // Handle input keypress (Enter to send)
  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Handle schedule meeting
  const handleScheduleMeeting = () => {
    setCalendarDialogOpen(true);
  };

  // Send meeting invitation
  const sendMeetingInvitation = () => {
    if (!meetingDate || !meetingTime || !meetingTopic) return;

    const meetingMessage = `Meeting Invitation: ${meetingTopic}\nDate: ${meetingDate}\nTime: ${meetingTime}`;
    setMessageText(meetingMessage);
    setCalendarDialogOpen(false);
    // Don't automatically send, let user review first
  };

  // Handle view profile
  const handleViewProfile = () => {
    if (selectedContact) {
      navigate(`/profile/${selectedContact.id}`);
    }
  };

  // Handle video call
  const handleVideoCall = () => {
    // In a real app, this would initiate a video call
    alert("Video call feature would be integrated here");
  };

  // Format message timestamp
  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
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
        <Button
          startIcon={<BackIcon />}
          onClick={() => navigate(-1)}
          sx={{ mb: 2 }}
        >
          Back
        </Button>

        <Typography variant="h4" gutterBottom>
          Messages
        </Typography>

        <ChatContainer>
          {/* Contacts List */}
          <ContactsList>
            <Box
              sx={{
                p: 2,
                display: "flex",
                alignItems: "center",
                backgroundColor: "rgba(0,0,0,0.02)",
              }}
            >
              <TextField
                placeholder="Search contacts..."
                size="small"
                fullWidth
                InputProps={{
                  startAdornment: <SearchIcon sx={{ mr: 1, color: "text.secondary" }} />,
                }}
              />
            </Box>
            <List sx={{ p: 0 }}>
              {contacts.length === 0 ? (
                <Box sx={{ p: 3, textAlign: "center" }}>
                  <Typography variant="body1" color="text.secondary">
                    No contacts yet
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Match with users to start chatting
                  </Typography>
                </Box>
              ) : (
                contacts.map((contact) => (
                  <React.Fragment key={contact.id}>
                    <ContactItem
                      alignItems="flex-start"
                      selected={selectedContact?.id === contact.id}
                      onClick={() => setSelectedContact(contact)}
                    >
                      <ListItemAvatar>
                        <Badge
                          color="success"
                          variant="dot"
                          invisible={!contact.isOnline}
                          overlap="circular"
                          anchorOrigin={{
                            vertical: "bottom",
                            horizontal: "right",
                          }}
                        >
                          <Avatar src={contact.profileImage} alt={contact.name}>
                            {!contact.profileImage && contact.name.charAt(0)}
                          </Avatar>
                        </Badge>
                      </ListItemAvatar>
                      <ListItemText
                        primary={contact.name}
                        secondary={
                          <>
                            <Typography
                              variant="body2"
                              color="text.primary"
                              component="span"
                              sx={{
                                display: "inline",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                                maxWidth: "150px",
                              }}
                            >
                              {contact.lastMessage || "Start a conversation"}
                            </Typography>
                            {contact.lastMessageTime && (
                              <Typography
                                variant="caption"
                                color="text.secondary"
                                sx={{ display: "block", mt: 0.5 }}
                              >
                                {formatTimestamp(contact.lastMessageTime)}
                              </Typography>
                            )}
                          </>
                        }
                      />
                      {contact.unreadCount > 0 && (
                        <Badge badgeContent={contact.unreadCount} color="error" />
                      )}
                    </ContactItem>
                    <Divider component="li" />
                  </React.Fragment>
                ))
              )}
            </List>
          </ContactsList>

          {/* Chat Area */}
          <ChatBox>
            {selectedContact ? (
              <>
                {/* Chat Header */}
                <ChatHeader>
                  <Toolbar>
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        cursor: "pointer",
                      }}
                      onClick={handleViewProfile}
                    >
                      <Badge
                        color="success"
                        variant="dot"
                        invisible={!selectedContact.isOnline}
                        overlap="circular"
                        anchorOrigin={{
                          vertical: "bottom",
                          horizontal: "right",
                        }}
                      >
                        <Avatar
                          src={selectedContact.profileImage}
                          alt={selectedContact.name}
                        >
                          {!selectedContact.profileImage &&
                            selectedContact.name.charAt(0)}
                        </Avatar>
                      </Badge>
                      <Box sx={{ ml: 2 }}>
                        <Typography variant="h6">{selectedContact.name}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {selectedContact.isOnline ? "Online" : "Offline"}
                        </Typography>
                      </Box>
                    </Box>
                    <Box sx={{ ml: "auto" }}>
                      <IconButton onClick={handleScheduleMeeting}>
                        <CalendarIcon />
                      </IconButton>
                      <IconButton onClick={handleVideoCall}>
                        <VideoIcon />
                      </IconButton>
                      <IconButton onClick={handleViewProfile}>
                        <ProfileIcon />
                      </IconButton>
                    </Box>
                  </Toolbar>
                </ChatHeader>

                {/* Messages Area */}
                <ChatMessages>
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      minHeight: "100%",
                    }}
                  >
                    {messages.length === 0 ? (
                      <Box
                        sx={{
                          flex: 1,
                          display: "flex",
                          flexDirection: "column",
                          justifyContent: "center",
                          alignItems: "center",
                          padding: 3,
                        }}
                      >
                        <Avatar
                          src={selectedContact.profileImage}
                          alt={selectedContact.name}
                          sx={{ width: 80, height: 80, mb: 2 }}
                        >
                          {!selectedContact.profileImage &&
                            selectedContact.name.charAt(0)}
                        </Avatar>
                        <Typography variant="h6" gutterBottom>
                          {selectedContact.name}
                        </Typography>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          align="center"
                        >
                          This is the beginning of your conversation with{" "}
                          {selectedContact.name}.
                          <br />
                          Send a message to start chatting.
                        </Typography>
                      </Box>
                    ) : (
                      messages.map((message) => (
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
                          <Typography
                            variant="body1"
                            sx={{ whiteSpace: "pre-wrap" }}
                          >
                            {message.text}
                          </Typography>
                          <Typography
                            variant="caption"
                            sx={{
                              display: "block",
                              mt: 0.5,
                              opacity: 0.7,
                              textAlign: "right",
                            }}
                          >
                            {formatTimestamp(message.createdAt)}
                          </Typography>
                        </MessageBubble>
                      ))
                    )}
                    <div ref={messagesEndRef} />
                  </Box>
                </ChatMessages>

                {/* Chat Input */}
                <ChatInputContainer>
                  <IconButton>
                    <AttachIcon />
                  </IconButton>
                  <TextField
                    fullWidth
                    placeholder="Type a message..."
                    multiline
                    maxRows={4}
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    onKeyDown={handleKeyPress}
                    variant="standard"
                    InputProps={{
                      disableUnderline: true,
                    }}
                    sx={{ mx: 2 }}
                  />
                  <IconButton>
                    <EmojiIcon />
                  </IconButton>
                  <IconButton
                    color="secondary"
                    onClick={handleSendMessage}
                    disabled={!messageText.trim() || sendingMessage}
                    sx={{
                      bgcolor: theme.colors.secondary.main,
                      color: "#fff",
                      "&:hover": { bgcolor: theme.colors.secondary.dark },
                      ml: 1,
                      "&.Mui-disabled": { opacity: 0.5, color: "#fff" },
                    }}
                  >
                    {sendingMessage ? (
                      <CircularProgress size={24} color="inherit" />
                    ) : (
                      <SendIcon />
                    )}
                  </IconButton>
                </ChatInputContainer>
              </>
            ) : (
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  alignItems: "center",
                  height: "100%",
                  p: 3,
                }}
              >
                <Typography variant="h5" gutterBottom>
                  Select a contact to start chatting
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Choose a contact from the list on the left
                </Typography>
              </Box>
            )}
          </ChatBox>
        </ChatContainer>
      </Container>

      {/* Schedule Meeting Dialog */}
      <Dialog
        open={calendarDialogOpen}
        onClose={() => setCalendarDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Schedule a Meeting</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Meeting Topic"
            fullWidth
            value={meetingTopic}
            onChange={(e) => setMeetingTopic(e.target.value)}
            sx={{ mb: 2 }}
          />
          <Box sx={{ display: "flex", mb: 2, gap: 2 }}>
            <TextField
              label="Date"
              type="date"
              value={meetingDate}
              onChange={(e) => setMeetingDate(e.target.value)}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="Time"
              type="time"
              value={meetingTime}
              onChange={(e) => setMeetingTime(e.target.value)}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCalendarDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={sendMeetingInvitation}
            variant="contained"
            color="primary"
            startIcon={<ScheduleIcon />}
            disabled={!meetingDate || !meetingTime || !meetingTopic}
            sx={{
              bgcolor: theme.colors.secondary.main,
              "&:hover": { bgcolor: theme.colors.secondary.dark },
            }}
          >
            Create Invitation
          </Button>
        </DialogActions>
      </Dialog>

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
    </>
  );
};

export default Chat;