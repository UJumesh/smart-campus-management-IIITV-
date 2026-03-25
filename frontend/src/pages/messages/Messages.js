import React, { useState, useEffect, useRef } from "react";
import { useDispatch } from "react-redux";
import {
  Box,
  Typography,
  Paper,
  Button,
  CircularProgress,
  Alert,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Divider,
  TextField,
  Grid,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  InputAdornment,
  FormControl,
  InputLabel,
  Input,
  FormHelperText,
  Chip,
  Checkbox,
} from "@mui/material";
import {
  Person as PersonIcon,
  Group as GroupIcon,
  Send as SendIcon,
  Add as AddIcon,
  Chat as ChatIcon,
  Search as SearchIcon,
  CheckCircle as CheckCircleIcon,
} from "@mui/icons-material";
import { toast } from "react-toastify";
import useAuth from "../../hooks/useAuth";
import { useSocket } from "../../context/SocketContext";

const Messages = () => {
  const dispatch = useDispatch();
  const socket = useSocket();
  const messagesEndRef = useRef(null);

  const { user } = useAuth({
    redirectIfNotAuth: true,
    redirectTo: "/login",
  });

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [currentConversation, setCurrentConversation] = useState(null);
  const [newMessage, setNewMessage] = useState("");
  const [socketConnected, setSocketConnected] = useState(false);
  const [newConversationDialog, setNewConversationDialog] = useState(false);

  // New conversation dialog state
  const [searchEmail, setSearchEmail] = useState("");
  const [searchError, setSearchError] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  
  // Add state for group conversation
  const [isGroupMode, setIsGroupMode] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [selectedUsers, setSelectedUsers] = useState([]);

  // Fetch conversations
  useEffect(() => {
    setIsLoading(true);

    try {
      const {
        getConversations,
      } = require("../../services/slices/messageSlice");
      if (getConversations) {
        dispatch(getConversations())
          .unwrap()
          .then((data) => {
            setConversations(data || []);
            setIsLoading(false);
          })
          .catch((err) => {
            console.error("Error fetching conversations:", err);
            setError("Could not load conversations.");
            setIsLoading(false);
          });
      } else {
        setConversations([]);
        setIsLoading(false);
      }
    } catch (err) {
      console.error("Error loading messages:", err);
      setError("Something went wrong loading messages.");
      setIsLoading(false);
    }
  }, [dispatch]);

  // Set up socket connection
  useEffect(() => {
    if (socket) {
      setSocketConnected(socket.connected);

      socket.on("connect", () => setSocketConnected(true));
      socket.on("disconnect", () => setSocketConnected(false));

      return () => {
        socket.off("connect");
        socket.off("disconnect");
      };
    }
  }, [socket]);

  // Scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [currentConversation?.messages]);

  // Handle conversation selection
  const handleSelectConversation = (conversation) => {
    setCurrentConversation({
      conversation: conversation,
      messages: [],
    });

    try {
      const { getConversation } = require("../../services/slices/messageSlice");
      if (getConversation) {
        dispatch(getConversation(conversation._id))
          .unwrap()
          .then((data) => {
            setCurrentConversation(data);
          })
          .catch((err) => {
            console.error("Error fetching conversation:", err);
            toast.error("Could not load messages");
          });
      }
    } catch (err) {
      console.error("Error loading conversation:", err);
    }
  };

  // Send message function
  const handleSendMessage = () => {
    if (!newMessage.trim() || !currentConversation) return;

    try {
      const { sendMessage } = require("../../services/slices/messageSlice");
      if (sendMessage) {
        dispatch(
          sendMessage({
            conversationId: currentConversation.conversation._id,
            content: newMessage.trim(),
          })
        )
          .unwrap()
          .then(() => {
            setNewMessage("");
          })
          .catch((err) => {
            console.error("Error sending message:", err);
            toast.error("Could not send message");
          });
      }
    } catch (err) {
      console.error("Error sending message:", err);
      toast.error("Messaging is unavailable");
    }
  };

  // Function to get conversation name
  const getConversationName = (conversation) => {
    if (!conversation) return "Unknown";

    if (conversation.type === "group") {
      return conversation.name || "Group Chat";
    }

    if (conversation.participants && Array.isArray(conversation.participants)) {
      const otherParticipant = conversation.participants.find(
        (p) => p.user && p.user._id !== user?.id
      );

      if (otherParticipant && otherParticipant.user) {
        const firstName = otherParticipant.user.firstName || "";
        const lastName = otherParticipant.user.lastName || "";
        return (
          `${firstName} ${lastName}`.trim() ||
          otherParticipant.user.email ||
          "User"
        );
      }
    }

    return conversation.name || "Conversation";
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return "";
    return new Date(timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Handle new conversation button click
  const handleNewConversation = () => {
    setNewConversationDialog(true);
    setSearchEmail("");
    setSearchResults([]);
    setSearchError("");
    setIsGroupMode(false);
    setGroupName("");
    setSelectedUsers([]);
  };

  // Close the new conversation dialog
  const handleCloseDialog = () => {
    setNewConversationDialog(false);
    setSearchEmail("");
    setSearchResults([]);
    setSearchError("");
    setIsGroupMode(false);
    setGroupName("");
    setSelectedUsers([]);
  };

  // Search for users by email
  const handleSearchUser = () => {
    if (!searchEmail.trim()) {
      setSearchError("Please enter an email address");
      return;
    }

    if (searchEmail.length < 3) {
      setSearchError("Please enter at least 3 characters");
      return;
    }

    setSearchError("");
    setSearchLoading(true);

    try {
      const {
        searchUsersByEmail,
      } = require("../../services/slices/messageSlice");
      if (searchUsersByEmail) {
        dispatch(searchUsersByEmail(searchEmail))
          .unwrap()
          .then((data) => {
            setSearchResults(data || []);
            if (data && data.length === 0) {
              setSearchError("No users found with that email address");
            }
            setSearchLoading(false);
          })
          .catch((err) => {
            console.error("Error searching users:", err);
            toast.error("Could not search for users");
            setSearchLoading(false);
          });
      } else {
        setSearchLoading(false);
        toast.error("User search is unavailable");
      }
    } catch (err) {
      console.error("Error searching users:", err);
      setSearchLoading(false);
      toast.error("User search is unavailable");
    }
  };

  // Create a direct conversation with a user
  const handleStartConversation = (userId) => {
    try {
      const {
        createDirectConversation,
      } = require("../../services/slices/messageSlice");
      if (createDirectConversation) {
        dispatch(createDirectConversation(userId))
          .unwrap()
          .then((data) => {
            toast.success("Conversation started");
            handleCloseDialog();

            // Refresh conversations and select the new one
            dispatch(
              require("../../services/slices/messageSlice").getConversations()
            )
              .unwrap()
              .then((conversations) => {
                setConversations(conversations || []);
                // Find the new conversation and select it
                const newConversation = conversations.find((c) =>
                  c.participants.some((p) => p.user._id === userId)
                );
                if (newConversation) {
                  handleSelectConversation(newConversation);
                }
              });
          })
          .catch((err) => {
            console.error("Error creating conversation:", err);
            toast.error("Could not create conversation");
          });
      } else {
        toast.error("Creating conversations is unavailable");
        handleCloseDialog();
      }
    } catch (err) {
      console.error("Error creating conversation:", err);
      toast.error("Creating conversations is unavailable");
      handleCloseDialog();
    }
  };

  // Toggle selection of a user for group conversation
  const toggleUserSelection = (user) => {
    // Check if user is already selected
    const isSelected = selectedUsers.some(u => u._id === user._id);
    
    if (isSelected) {
      // Remove user from selection
      setSelectedUsers(selectedUsers.filter(u => u._id !== user._id));
    } else {
      // Add user to selection
      setSelectedUsers([...selectedUsers, user]);
    }
  };
  
  // Create a group conversation
  const handleCreateGroupConversation = () => {
    if (!groupName.trim()) {
      toast.error("Please enter a group name");
      return;
    }
    
    if (selectedUsers.length === 0) {
      toast.error("Please select at least one user for the group");
      return;
    }
    
    try {
      const { createGroupConversation } = require("../../services/slices/messageSlice");
      if (createGroupConversation) {
        const groupData = {
          name: groupName,
          participantIds: selectedUsers.map(user => user._id)
        };
        
        dispatch(createGroupConversation(groupData))
          .unwrap()
          .then((data) => {
            toast.success("Group conversation created");
            handleCloseDialog();
            
            // Refresh conversations and select the new one
            dispatch(
              require("../../services/slices/messageSlice").getConversations()
            )
              .unwrap()
              .then((conversations) => {
                setConversations(conversations || []);
                // Find the new conversation and select it
                const newConversation = conversations.find(
                  (c) => c._id === data._id
                );
                if (newConversation) {
                  handleSelectConversation(newConversation);
                }
              });
          })
          .catch((err) => {
            console.error("Error creating group conversation:", err);
            toast.error("Could not create group conversation");
          });
      } else {
        toast.error("Creating group conversations is unavailable");
        handleCloseDialog();
      }
    } catch (err) {
      console.error("Error creating group conversation:", err);
      toast.error("Creating group conversations is unavailable");
      handleCloseDialog();
    }
  };

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        p: 3,
        height: "calc(100vh - 100px)",
        bgcolor: "background.default",
      }}
    >
      <Grid container spacing={3} sx={{ height: "100%" }}>
        {/* Conversations List */}
        <Grid item xs={12} md={4}>
          <Paper
            sx={{
              height: "100%",
              display: "flex",
              flexDirection: "column",
              borderRadius: 2,
              overflow: "hidden",
              boxShadow: 3,
            }}
          >
            <Box
              sx={{
                p: 2,
                bgcolor: "primary.main",
                color: "white",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Conversations
              </Typography>
              <IconButton
                size="small"
                sx={{ color: "white" }}
                onClick={handleNewConversation}
              >
                <AddIcon />
              </IconButton>
            </Box>

            {isLoading ? (
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  flexGrow: 1,
                }}
              >
                <CircularProgress />
              </Box>
            ) : (
              <List sx={{ flexGrow: 1, overflow: "auto", p: 0 }}>
                {conversations && conversations.length > 0 ? (
                  conversations.map((conversation) => {
                    const isSelected =
                      currentConversation?.conversation?._id ===
                      conversation._id;
                    return (
                      <ListItem
                        key={conversation._id}
                        button
                        selected={isSelected}
                        onClick={() => handleSelectConversation(conversation)}
                        sx={{
                          borderLeft: isSelected ? 3 : 0,
                          borderLeftColor: "primary.main",
                          transition: "all 0.2s",
                          py: 1.5,
                          "&:hover": { bgcolor: "action.hover" },
                        }}
                      >
                        <ListItemAvatar>
                          <Avatar
                            sx={{
                              bgcolor:
                                conversation.type === "group"
                                  ? "secondary.main"
                                  : "primary.main",
                            }}
                          >
                            {conversation.type === "group" ? (
                              <GroupIcon />
                            ) : (
                              <PersonIcon />
                            )}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={
                            <Typography
                              noWrap
                              sx={{ fontWeight: isSelected ? 600 : 400 }}
                            >
                              {getConversationName(conversation)}
                            </Typography>
                          }
                          secondary={
                            <Typography
                              noWrap
                              variant="body2"
                              color="text.secondary"
                            >
                              {conversation.lastMessage?.content ||
                                "No messages yet"}
                            </Typography>
                          }
                        />
                      </ListItem>
                    );
                  })
                ) : (
                  <Box
                    sx={{
                      p: 4,
                      textAlign: "center",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                    }}
                  >
                    <Avatar
                      sx={{ mb: 2, width: 50, height: 50, bgcolor: "grey.200" }}
                    >
                      <ChatIcon sx={{ color: "grey.500" }} />
                    </Avatar>
                    <Typography color="textSecondary" gutterBottom>
                      No conversations yet
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      Start a new conversation using the + button above
                    </Typography>
                  </Box>
                )}
              </List>
            )}
          </Paper>
        </Grid>

        {/* Messages Area */}
        <Grid item xs={12} md={8}>
          <Paper
            sx={{
              height: "100%",
              display: "flex",
              flexDirection: "column",
              borderRadius: 2,
              overflow: "hidden",
              boxShadow: 3,
            }}
          >
            {currentConversation ? (
              <>
                {/* Chat Header */}
                <Box
                  sx={{
                    p: 2,
                    bgcolor: "primary.main",
                    color: "white",
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  <Avatar sx={{ mr: 1.5, bgcolor: "white" }}>
                    {currentConversation.conversation.type === "group" ? (
                      <GroupIcon sx={{ color: "primary.main" }} />
                    ) : (
                      <PersonIcon sx={{ color: "primary.main" }} />
                    )}
                  </Avatar>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {getConversationName(currentConversation.conversation)}
                  </Typography>
                </Box>

                {/* Messages */}
                <Box
                  sx={{
                    flexGrow: 1,
                    overflow: "auto",
                    p: 2,
                    bgcolor: "grey.50",
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  {isLoading ? (
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        height: "100%",
                      }}
                    >
                      <CircularProgress />
                    </Box>
                  ) : currentConversation.messages &&
                    currentConversation.messages.length > 0 ? (
                    currentConversation.messages.map((message) => {
                      const isCurrentUser = message.sender?._id === user?.id;

                      return (
                        <Box
                          key={message._id}
                          sx={{
                            display: "flex",
                            flexDirection: isCurrentUser
                              ? "row-reverse"
                              : "row",
                            mb: 2,
                            alignItems: "flex-end",
                          }}
                        >
                          {!isCurrentUser && (
                            <Avatar sx={{ mr: 1, width: 32, height: 32 }}>
                              {message.sender?.firstName?.charAt(0) || (
                                <PersonIcon fontSize="small" />
                              )}
                            </Avatar>
                          )}
                          <Paper
                            sx={{
                              p: 1.5,
                              maxWidth: "70%",
                              bgcolor: isCurrentUser ? "primary.main" : "white",
                              color: isCurrentUser ? "white" : "text.primary",
                              borderRadius: 2,
                              borderTopRightRadius: isCurrentUser ? 0 : 2,
                              borderTopLeftRadius: isCurrentUser ? 2 : 0,
                              boxShadow: 1,
                            }}
                          >
                            <Typography variant="body1">
                              {message.content}
                            </Typography>
                            <Typography
                              variant="caption"
                              display="block"
                              textAlign="right"
                              sx={{
                                opacity: 0.8,
                                mt: 0.5,
                              }}
                            >
                              {formatTime(message.createdAt)}
                            </Typography>
                          </Paper>
                        </Box>
                      );
                    })
                  ) : (
                    <Box
                      sx={{
                        textAlign: "center",
                        mt: 4,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        flexGrow: 1,
                        justifyContent: "center",
                      }}
                    >
                      <Avatar
                        sx={{
                          mb: 2,
                          width: 70,
                          height: 70,
                          bgcolor: "grey.200",
                        }}
                      >
                        <ChatIcon sx={{ fontSize: 40, color: "grey.500" }} />
                      </Avatar>
                      <Typography color="textSecondary" gutterBottom>
                        No messages yet
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        Send the first message to start the conversation
                      </Typography>
                    </Box>
                  )}
                  <div ref={messagesEndRef} />
                </Box>

                {/* Message Input */}
                <Box
                  sx={{
                    p: 2,
                    borderTop: 1,
                    borderColor: "divider",
                    bgcolor: "white",
                  }}
                >
                  <Grid container spacing={1} alignItems="center">
                    <Grid item xs>
                      <TextField
                        fullWidth
                        placeholder="Type a message..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage();
                          }
                        }}
                        variant="outlined"
                        size="small"
                        sx={{
                          "& .MuiOutlinedInput-root": {
                            borderRadius: 4,
                          },
                        }}
                      />
                    </Grid>
                    <Grid item>
                      <Button
                        variant="contained"
                        endIcon={<SendIcon />}
                        onClick={handleSendMessage}
                        disabled={!newMessage.trim()}
                        sx={{ borderRadius: 4 }}
                      >
                        Send
                      </Button>
                    </Grid>
                  </Grid>
                </Box>
              </>
            ) : (
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  height: "100%",
                  bgcolor: "grey.50",
                  p: 3,
                }}
              >
                <Avatar
                  sx={{
                    width: 80,
                    height: 80,
                    mb: 3,
                    bgcolor: "grey.200",
                  }}
                >
                  <ChatIcon sx={{ fontSize: 40, color: "grey.500" }} />
                </Avatar>
                <Typography variant="h6" color="textSecondary" gutterBottom>
                  Your Messages
                </Typography>
                <Typography
                  color="textSecondary"
                  align="center"
                  sx={{ maxWidth: 300, mb: 2 }}
                >
                  Select a conversation from the list to start messaging
                </Typography>
                <Button
                  variant="outlined"
                  startIcon={<AddIcon />}
                  sx={{ mt: 2, borderRadius: 4 }}
                  onClick={handleNewConversation}
                >
                  New conversation
                </Button>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* New Conversation Dialog */}
      <Dialog
        open={newConversationDialog}
        onClose={handleCloseDialog}
        fullWidth
        maxWidth="sm"
        PaperProps={{
          sx: {
            borderRadius: 2,
            boxShadow: 5,
            overflow: "hidden",
          },
        }}
      >
        <DialogTitle
          sx={{
            bgcolor: "primary.main",
            color: "white",
            p: 2.5,
            display: "flex",
            alignItems: "center",
            gap: 1.5,
          }}
        >
          {isGroupMode ? (
            <GroupIcon sx={{ fontSize: 28 }} />
          ) : (
            <PersonIcon sx={{ fontSize: 28 }} />
          )}
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            {isGroupMode ? "Create Group Conversation" : "Start New Conversation"}
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ p: 0 }}>
          {/* Conversation Type Selector - Only show for admin/lecturer */}
          {(user?.role === "admin" || user?.role === "lecturer") && (
            <Box sx={{ px: 3, pt: 3 }}>
              <Box 
                sx={{ 
                  display: 'flex',
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 2,
                  overflow: 'hidden'
                }}
              >
                <Button
                  fullWidth
                  variant={!isGroupMode ? "contained" : "text"}
                  disableElevation
                  onClick={() => {
                    setIsGroupMode(false);
                    setSelectedUsers([]);
                  }}
                  sx={{ 
                    borderRadius: 0,
                    py: 1,
                    color: !isGroupMode ? 'white' : 'text.primary'
                  }}
                >
                  <PersonIcon sx={{ mr: 1, fontSize: 20 }} />
                  Direct Message
                </Button>
                <Button
                  fullWidth
                  variant={isGroupMode ? "contained" : "text"}
                  disableElevation
                  onClick={() => setIsGroupMode(true)}
                  sx={{ 
                    borderRadius: 0,
                    py: 1,
                    color: isGroupMode ? 'white' : 'text.primary'
                  }}
                >
                  <GroupIcon sx={{ mr: 1, fontSize: 20 }} />
                  Group Chat
                </Button>
              </Box>
            </Box>
          )}
          
          {/* Group Name Input - Only in group mode */}
          {isGroupMode && (
            <Box sx={{ px: 3, pt: 3 }}>
              <TextField
                label="Group Name"
                fullWidth
                variant="outlined"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="Enter a name for your group"
                sx={{ mb: 2 }}
              />
            </Box>
          )}
        
          {/* Instructions */}
          <Box sx={{ px: 3, pt: isGroupMode ? 1 : 3, pb: 2 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {isGroupMode 
                ? "Search and select users to add to your group chat" 
                : "Search for users by their email address to start a conversation with them."}
            </Typography>
          </Box>

          {/* Search field */}
          <Box sx={{ px: 3, pb: 2 }}>
            <Paper
              elevation={0}
              variant="outlined"
              sx={{ p: 2, borderRadius: 1, bgcolor: "grey.50" }}
            >
              <FormControl error={!!searchError} fullWidth variant="standard">
                <InputLabel htmlFor="search-email" sx={{ px: 1 }}>
                  Search by Email
                </InputLabel>
                <Input
                  id="search-email"
                  value={searchEmail}
                  onChange={(e) => setSearchEmail(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSearchUser()}
                  fullWidth
                  startAdornment={
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" color="action" />
                    </InputAdornment>
                  }
                  sx={{ px: 1 }}
                />
                {searchError && (
                  <FormHelperText sx={{ px: 1, mt: 1 }}>
                    {searchError}
                  </FormHelperText>
                )}
              </FormControl>
              <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 2 }}>
                <Button
                  onClick={handleSearchUser}
                  variant="contained"
                  size="medium"
                  disableElevation
                  disabled={searchLoading}
                  sx={{
                    borderRadius: 4,
                    px: 3,
                    color: "white",
                    fontWeight: 500,
                  }}
                >
                  {searchLoading ? <CircularProgress size={24} /> : "Search"}
                </Button>
              </Box>
            </Paper>
          </Box>

          {/* Selected Users List - Only in group mode */}
          {isGroupMode && selectedUsers.length > 0 && (
            <Box sx={{ px: 3, pb: 2 }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Selected Users ({selectedUsers.length})
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {selectedUsers.map(user => (
                  <Chip
                    key={user._id}
                    label={`${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email}
                    onDelete={() => toggleUserSelection(user)}
                    color="primary"
                    variant="outlined"
                  />
                ))}
              </Box>
            </Box>
          )}

          {/* Search results */}
          {searchResults && searchResults.length > 0 ? (
            <Box sx={{ px: 3, pb: 2 }}>
              <Typography
                variant="subtitle2"
                color="text.primary"
                sx={{ mb: 1, fontWeight: 600 }}
              >
                Search Results ({searchResults.length})
              </Typography>
              <Paper
                variant="outlined"
                sx={{
                  maxHeight: 300,
                  overflow: "auto",
                  borderRadius: 1,
                  border: 1,
                  borderColor: "divider",
                }}
              >
                <List disablePadding>
                  {searchResults.map((searchUser) => {
                    // For direct messages: check if there's already a conversation
                    const existingConversation = !isGroupMode ? conversations.find(
                      (conv) =>
                        conv.type === "direct" &&
                        conv.participants.some(
                          (p) => p.user._id === searchUser._id
                        )
                    ) : null;
                    
                    // For group: check if user is already selected
                    const isSelected = isGroupMode && selectedUsers.some(u => u._id === searchUser._id);

                    return (
                      <ListItem
                        key={searchUser._id}
                        button
                        onClick={() => 
                          isGroupMode 
                            ? toggleUserSelection(searchUser)
                            : (!existingConversation && handleStartConversation(searchUser._id))
                        }
                        disabled={!isGroupMode && existingConversation}
                        divider
                        sx={{
                          transition: "all 0.2s",
                          py: 1.5,
                          "&:hover": {
                            bgcolor: !isGroupMode && existingConversation
                              ? "transparent"
                              : "action.hover",
                          },
                          bgcolor: isSelected ? 'action.selected' : 'transparent',
                        }}
                      >
                        <ListItemAvatar>
                          <Avatar
                            sx={{
                              bgcolor: !isGroupMode && existingConversation
                                ? "grey.300"
                                : isSelected ? "primary.main" : "primary.light",
                              width: 40,
                              height: 40,
                            }}
                          >
                            {searchUser.firstName?.charAt(0) || <PersonIcon />}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={
                            <Typography
                              variant="subtitle2"
                              sx={{
                                fontWeight: 500,
                                color: !isGroupMode && existingConversation
                                  ? "text.secondary"
                                  : "text.primary",
                              }}
                            >
                              {`${searchUser.firstName || ""} ${
                                searchUser.lastName || ""
                              }`.trim() || "User"}
                            </Typography>
                          }
                          secondary={
                            <Typography
                              variant="body2"
                              color="text.secondary"
                              sx={{ fontSize: "0.8rem" }}
                            >
                              {searchUser.email}
                            </Typography>
                          }
                        />
                        {!isGroupMode ? (
                          existingConversation ? (
                            <Chip
                              label="Existing"
                              size="small"
                              sx={{
                                bgcolor: "grey.100",
                                fontSize: "0.7rem",
                                height: 24,
                              }}
                            />
                          ) : (
                            <Button
                              size="small"
                              variant="outlined"
                              startIcon={<AddIcon fontSize="small" />}
                              sx={{
                                borderRadius: 4,
                                fontSize: "0.75rem",
                                height: 28,
                                minWidth: 0,
                              }}
                            >
                              Add
                            </Button>
                          )
                        ) : (
                          <Checkbox 
                            checked={isSelected}
                            size="small"
                            color="primary"
                          />
                        )}
                      </ListItem>
                    );
                  })}
                </List>
              </Paper>
            </Box>
          ) : searchResults && searchResults.length === 0 && !searchLoading ? (
            <Box
              sx={{
                p: 4,
                textAlign: "center",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
              }}
            >
              <Avatar
                sx={{ mb: 2, width: 50, height: 50, bgcolor: "grey.200" }}
              >
                <SearchIcon sx={{ color: "grey.500" }} />
              </Avatar>
              <Typography color="textSecondary" gutterBottom fontWeight={500}>
                No users found
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Try searching with a different email address
              </Typography>
            </Box>
          ) : null}
        </DialogContent>
        <Divider />
        <DialogActions sx={{ p: 2, justifyContent: "space-between" }}>
          <Typography variant="caption" color="text.secondary">
            Conversations are private and secure
          </Typography>
          <Box>
            <Button
              onClick={handleCloseDialog}
              variant="outlined"
              sx={{ borderRadius: 4, px: 3, mr: 1 }}
            >
              Cancel
            </Button>
            {isGroupMode && (
              <Button
                onClick={handleCreateGroupConversation}
                variant="contained"
                disabled={selectedUsers.length === 0 || !groupName.trim()}
                sx={{ borderRadius: 4, px: 3 }}
              >
                Create Group
              </Button>
            )}
          </Box>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Messages;
