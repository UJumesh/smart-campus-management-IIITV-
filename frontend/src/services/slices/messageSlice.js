import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../api";
import { toast } from "react-toastify";

const initialState = {
  messages: [],
  conversations: [],
  currentConversation: null,
  searchResults: [],
  isError: false,
  isSuccess: false,
  isLoading: false,
  message: "",
};

// Extract error message utility function
const extractErrorMessage = (error) => {
  return (
    (error.response &&
      error.response.data &&
      (error.response.data.message || error.response.data.error)) ||
    error.message ||
    error.toString()
  );
};

// Get all conversations
export const getConversations = createAsyncThunk(
  "message/getConversations",
  async (_, thunkAPI) => {
    try {
      const response = await api.get("/api/messages/conversations");
      return response.data.data;
    } catch (error) {
      const message = extractErrorMessage(error);
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Get conversation with messages
export const getConversation = createAsyncThunk(
  "message/getConversation",
  async (conversationId, thunkAPI) => {
    try {
      const response = await api.get(
        `/api/messages/conversations/${conversationId}`
      );
      return response.data.data;
    } catch (error) {
      const message = extractErrorMessage(error);
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Create direct conversation
export const createDirectConversation = createAsyncThunk(
  "message/createDirectConversation",
  async (recipientId, thunkAPI) => {
    try {
      const response = await api.post(
        `/api/messages/conversations/direct/${recipientId}`
      );
      return response.data.data;
    } catch (error) {
      const message = extractErrorMessage(error);
      toast.error(message);
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Create group conversation
export const createGroupConversation = createAsyncThunk(
  "message/createGroupConversation",
  async (groupData, thunkAPI) => {
    try {
      const response = await api.post(
        "/api/messages/conversations/group",
        groupData
      );
      toast.success("Group created successfully");
      return response.data.data;
    } catch (error) {
      const message = extractErrorMessage(error);
      toast.error(message);
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Add participants to group
export const addParticipants = createAsyncThunk(
  "message/addParticipants",
  async ({ conversationId, participantIds }, thunkAPI) => {
    try {
      const response = await api.post(
        `/api/messages/conversations/${conversationId}/participants`,
        {
          participantIds,
        }
      );
      toast.success("Participants added successfully");
      return response.data.data;
    } catch (error) {
      const message = extractErrorMessage(error);
      toast.error(message);
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Send message
export const sendMessage = createAsyncThunk(
  "message/sendMessage",
  async (messageData, thunkAPI) => {
    try {
      // Make sure there's a valid conversation ID
      if (!messageData.conversationId && !messageData.conversation) {
        return thunkAPI.rejectWithValue("Conversation ID is required");
      }

      const response = await api.post("/api/messages", messageData);
      return response.data.data;
    } catch (error) {
      const message = extractErrorMessage(error);
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Search users by email
export const searchUsersByEmail = createAsyncThunk(
  "message/searchUsersByEmail",
  async (email, thunkAPI) => {
    try {
      const response = await api.get(
        `/api/messages/users/search?email=${email}`
      );
      return response.data.data;
    } catch (error) {
      const message = extractErrorMessage(error);
      return thunkAPI.rejectWithValue(message);
    }
  }
);

export const messageSlice = createSlice({
  name: "message",
  initialState,
  reducers: {
    reset: (state) => {
      state.isLoading = false;
      state.isSuccess = false;
      state.isError = false;
      state.message = "";
    },
    setCurrentConversation: (state, action) => {
      state.currentConversation = action.payload;
    },
    addMessage: (state, action) => {
      // For socket-received messages
      if (
        state.currentConversation &&
        state.currentConversation.conversation &&
        state.currentConversation.conversation._id ===
          action.payload.conversation
      ) {
        state.currentConversation.messages.push(action.payload);
      }
    },
    clearSearchResults: (state) => {
      state.searchResults = [];
    },
  },
  extraReducers: (builder) => {
    builder
      // Get conversations
      .addCase(getConversations.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getConversations.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.conversations = action.payload;
      })
      .addCase(getConversations.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })

      // Get single conversation with messages
      .addCase(getConversation.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getConversation.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.currentConversation = action.payload;
      })
      .addCase(getConversation.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })

      // Create direct conversation
      .addCase(createDirectConversation.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(createDirectConversation.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        // Add to conversations if not already there
        const exists = state.conversations.some(
          (conv) => conv._id === action.payload._id
        );
        if (!exists) {
          state.conversations.unshift(action.payload);
        }
        state.currentConversation = {
          conversation: action.payload,
          messages: [],
        };
      })
      .addCase(createDirectConversation.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })

      // Create group conversation
      .addCase(createGroupConversation.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(createGroupConversation.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.conversations.unshift(action.payload);
        state.currentConversation = {
          conversation: action.payload,
          messages: [],
        };
      })
      .addCase(createGroupConversation.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })

      // Add participants to group
      .addCase(addParticipants.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(addParticipants.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        // Update in conversations list
        state.conversations = state.conversations.map((conv) =>
          conv._id === action.payload._id ? action.payload : conv
        );
        // Update current conversation if it's the same
        if (
          state.currentConversation &&
          state.currentConversation.conversation &&
          state.currentConversation.conversation._id === action.payload._id
        ) {
          state.currentConversation.conversation = action.payload;
        }
      })
      .addCase(addParticipants.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })

      // Send message
      .addCase(sendMessage.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(sendMessage.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        // Add message to current conversation
        if (
          state.currentConversation &&
          state.currentConversation.conversation &&
          state.currentConversation.conversation._id ===
            action.payload.conversation
        ) {
          state.currentConversation.messages.push(action.payload);
        }
        // Update last message in conversation list
        state.conversations = state.conversations.map((conv) => {
          if (conv._id === action.payload.conversation) {
            return {
              ...conv,
              lastMessage: action.payload,
              lastMessageAt: action.payload.createdAt,
            };
          }
          return conv;
        });
      })
      .addCase(sendMessage.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })

      // Search users by email
      .addCase(searchUsersByEmail.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(searchUsersByEmail.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.searchResults = action.payload;
      })
      .addCase(searchUsersByEmail.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      });
  },
});

export const { reset, setCurrentConversation, addMessage, clearSearchResults } =
  messageSlice.actions;
export default messageSlice.reducer;
