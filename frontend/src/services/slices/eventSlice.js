import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { toast } from "react-toastify";
import api from "../api";

/**
 * Extract error message from error response
 * @param {Object} error - The error object
 * @returns {String} - Extracted error message
 */
const extractErrorMessage = (error) => {
  return (
    (error.response &&
      error.response.data &&
      (error.response.data.message || error.response.data.error)) ||
    error.message ||
    error.toString()
  );
};

// Get all events
export const getEvents = createAsyncThunk(
  "events/getAll",
  async (params, thunkAPI) => {
    try {
      const response = await api.get("/api/events", { params });
      return response.data.data;
    } catch (error) {
      const message = extractErrorMessage(error);

      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Get single event
export const getEvent = createAsyncThunk(
  "events/getOne",
  async (id, thunkAPI) => {
    try {
      const response = await api.get(`/api/events/${id}`);
      return response.data.data;
    } catch (error) {
      const message = extractErrorMessage(error);

      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Create new event
export const createEvent = createAsyncThunk(
  "events/create",
  async (eventData, thunkAPI) => {
    try {
      const response = await api.post("/api/events", eventData);
      toast.success("Event created successfully");
      return response.data.data;
    } catch (error) {
      const message = extractErrorMessage(error);

      toast.error(message);
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Update event
export const updateEvent = createAsyncThunk(
  "events/update",
  async ({ id, eventData }, thunkAPI) => {
    try {
      const response = await api.put(`/api/events/${id}`, eventData);
      toast.success("Event updated successfully");
      return response.data.data;
    } catch (error) {
      const message = extractErrorMessage(error);

      toast.error(message);
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Delete event
export const deleteEvent = createAsyncThunk(
  "events/delete",
  async (id, thunkAPI) => {
    try {
      await api.delete(`/api/events/${id}`);
      toast.success("Event deleted successfully");
      return id;
    } catch (error) {
      const message = extractErrorMessage(error);

      toast.error(message);
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Register for event
export const registerForEvent = createAsyncThunk(
  "events/registerForEvent",
  async (id, thunkAPI) => {
    try {
      console.log(`Sending registration request for event ID: ${id}`);
      const token = localStorage.getItem("token");
      console.log(
        `Auth token from localStorage: ${token ? "Present" : "Not found"}`
      );

      const response = await api.post(`/api/events/${id}/register`);
      console.log("Registration API response:", response.data);

      // Get the updated event data with the new attendees list
      const updatedEvent = response.data.data;

      // Add calendar integration here
      try {
        // Use the returned event data for calendar integration
        const event = updatedEvent || thunkAPI.getState().events.event;

        // Only proceed if we have event data
        if (event && event._id) {
          // Create calendar event object
          const calendarEvent = {
            title: event.title,
            description: event.description,
            location: event.location,
            start: new Date(event.startDate),
            end: new Date(event.endDate),
            eventId: event._id,
          };

          // Check if browser supports calendar integration
          if (window.isSecureContext && "scheduling" in navigator) {
            // Modern browsers with Scheduling API
            try {
              navigator.scheduling
                .createEvent(calendarEvent)
                .then(() => toast.success("Event added to your calendar"))
                .catch((err) => console.log("Calendar API error:", err));
            } catch (calendarErr) {
              console.log("Error adding to calendar:", calendarErr);
              // Silently fail - calendar integration is optional
            }
          } else if (
            "Notification" in window &&
            Notification.permission === "granted"
          ) {
            // Fallback to notification if calendar API not available
            new Notification(`Event Registered: ${event.title}`, {
              body: `You're registered for ${event.title} on ${new Date(
                event.startDate
              ).toLocaleDateString()}`,
              icon: "/logo.png",
            });
          }

          // Store registration in local storage as backup
          const storedEvents = JSON.parse(
            localStorage.getItem("registeredEvents") || "[]"
          );
          if (!storedEvents.some((e) => e.eventId === event._id)) {
            storedEvents.push({
              ...calendarEvent,
              timestamp: new Date().toISOString(),
            });
            localStorage.setItem(
              "registeredEvents",
              JSON.stringify(storedEvents)
            );
            console.log("Saved registration to localStorage");
          }
        }
      } catch (calendarError) {
        console.error("Calendar integration error:", calendarError);
        // Don't reject the promise - calendar integration is a nice-to-have
      }

      toast.success("Successfully registered for event!");
      return updatedEvent;
    } catch (error) {
      console.error("Registration failed:", error);
      return thunkAPI.rejectWithValue(extractErrorMessage(error));
    }
  }
);

// Get event attendees
export const getEventAttendees = createAsyncThunk(
  "events/attendees",
  async (id, thunkAPI) => {
    try {
      const response = await api.get(`/api/events/${id}/attendees`);
      return response.data.data;
    } catch (error) {
      const message = extractErrorMessage(error);

      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Check in attendee
export const checkInAttendee = createAsyncThunk(
  "events/checkin",
  async ({ eventId, userId }, thunkAPI) => {
    try {
      const response = await api.put(
        `/api/events/${eventId}/checkin/${userId}`
      );
      toast.success("Attendee checked in successfully");
      return response.data.data;
    } catch (error) {
      const message = extractErrorMessage(error);

      toast.error(message);
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Get user registrations
export const getUserRegistrations = createAsyncThunk(
  "events/getUserRegistrations",
  async (_, thunkAPI) => {
    try {
      const response = await api.get("/api/events/user/registrations");
      return response.data.data;
    } catch (error) {
      const message = extractErrorMessage(error);
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Unregister from event
export const unregisterFromEvent = createAsyncThunk(
  "events/unregisterFromEvent",
  async (id, thunkAPI) => {
    try {
      console.log(`Sending unregistration request for event ID: ${id}`);

      const response = await api.delete(`/api/events/${id}/register`);
      console.log("Unregistration API response:", response.data);

      // Get the updated event data with the updated attendees list
      const updatedEvent = response.data.data;

      // Remove event from localStorage
      try {
        const storedEvents = JSON.parse(
          localStorage.getItem("registeredEvents") || "[]"
        );
        const filteredEvents = storedEvents.filter((e) => e.eventId !== id);
        localStorage.setItem(
          "registeredEvents",
          JSON.stringify(filteredEvents)
        );
        console.log("Removed registration from localStorage");
      } catch (error) {
        console.error("Error updating localStorage:", error);
      }

      toast.success("Successfully unregistered from event!");
      return updatedEvent;
    } catch (error) {
      console.error("Unregistration failed:", error);
      return thunkAPI.rejectWithValue(extractErrorMessage(error));
    }
  }
);

// Get upcoming events (max 5)
export const getUpcomingEvents = createAsyncThunk(
  "events/getUpcoming",
  async (_, thunkAPI) => {
    try {
      // Request events with status=upcoming and limit=5
      const response = await api.get("/api/events", {
        params: {
          status: "upcoming",
          limit: 5,
        },
      });
      return response.data.data;
    } catch (error) {
      const message = extractErrorMessage(error);
      return thunkAPI.rejectWithValue(message);
    }
  }
);

const initialState = {
  events: [],
  upcomingEvents: [],
  event: null,
  attendees: [],
  registeredEvents: [],
  registeredEventIds: [],
  isLoading: false,
  isSuccess: false,
  isError: false,
  message: "",
  refreshNeeded: false
};

export const eventSlice = createSlice({
  name: "events",
  initialState,
  reducers: {
    reset: (state) => {
      state.isLoading = false;
      state.isSuccess = false;
      state.isError = false;
      state.message = "";
    },
    triggerRefresh: (state, action) => {
      state.refreshNeeded = true;
      state.lastRefreshTrigger = action.payload?.timestamp || new Date().toISOString();
    },
    clearEvent: (state) => {
      state.event = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Get all events
      .addCase(getEvents.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getEvents.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.events = action.payload.data;
        state.refreshNeeded = false;
      })
      .addCase(getEvents.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })

      // Get single event
      .addCase(getEvent.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getEvent.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.event = action.payload;
      })
      .addCase(getEvent.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })

      // Create event
      .addCase(createEvent.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(createEvent.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.events.push(action.payload.data);
        state.refreshNeeded = true;
        state.event = action.payload.data;
      })
      .addCase(createEvent.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })

      // Update event
      .addCase(updateEvent.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(updateEvent.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        const index = state.events.findIndex(event => event._id === action.payload.data._id);
        if (index !== -1) {
          state.events[index] = action.payload.data;
        }
        state.refreshNeeded = true;
        state.event = action.payload.data;
      })
      .addCase(updateEvent.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })

      // Delete event
      .addCase(deleteEvent.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(deleteEvent.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.events = state.events.filter(event => event._id !== action.payload.id);
        state.refreshNeeded = true;
        state.event = null;
      })
      .addCase(deleteEvent.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })

      // Register for event
      .addCase(registerForEvent.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(registerForEvent.fulfilled, (state, action) => {
        state.isLoading = false;
        state.success = true;

        // Update the specific event in the events array
        if (state.events.length > 0) {
          const index = state.events.findIndex(
            (event) => event._id === action.payload._id
          );
          if (index !== -1) {
            state.events[index] = action.payload;
          }
        }

        // Also update the single event if it matches the one we just registered for
        if (state.event && state.event._id === action.payload._id) {
          state.event = action.payload;
        }

        console.log("Updated event in Redux store after registration");
      })
      .addCase(registerForEvent.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      // Get event attendees
      .addCase(getEventAttendees.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getEventAttendees.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.attendees = action.payload;
      })
      .addCase(getEventAttendees.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })

      // Check in attendee
      .addCase(checkInAttendee.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(checkInAttendee.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.event = action.payload;
        state.events = state.events.map((event) =>
          event._id === action.payload._id ? action.payload : event
        );
      })
      .addCase(checkInAttendee.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })

      // Get user registrations
      .addCase(getUserRegistrations.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getUserRegistrations.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;

        // Get event IDs from response data
        if (Array.isArray(action.payload)) {
          // If the response is an array of events
          state.registeredEvents = action.payload;
          state.registeredEventIds = action.payload.map(
            (event) => event._id || event.id
          );
        } else if (
          action.payload &&
          action.payload.data &&
          Array.isArray(action.payload.data)
        ) {
          // If the response has a data field with an array of events
          state.registeredEvents = action.payload.data;
          state.registeredEventIds = action.payload.data.map(
            (event) => event._id || event.id
          );
        } else if (
          action.payload &&
          action.payload.eventIds &&
          Array.isArray(action.payload.eventIds)
        ) {
          // If the response has an eventIds field
          state.registeredEventIds = action.payload.eventIds;
        } else {
          // Fallback - empty array if we can't parse the response
          state.registeredEventIds = [];
        }
      })
      .addCase(getUserRegistrations.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })

      // Unregister from event
      .addCase(unregisterFromEvent.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(unregisterFromEvent.fulfilled, (state, action) => {
        state.isLoading = false;
        state.success = true;

        // Update the specific event in the events array
        if (state.events.length > 0) {
          const index = state.events.findIndex(
            (event) => event._id === action.payload._id
          );
          if (index !== -1) {
            state.events[index] = action.payload;
          }
        }

        // Also update the single event if it matches the one we just unregistered from
        if (state.event && state.event._id === action.payload._id) {
          state.event = action.payload;
        }

        // Update registeredEventIds array
        state.registeredEventIds = state.registeredEventIds.filter(
          (id) => id !== action.payload._id
        );

        console.log("Updated event in Redux store after unregistration");
      })
      .addCase(unregisterFromEvent.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      // Get upcoming events
      .addCase(getUpcomingEvents.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getUpcomingEvents.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        // Store upcoming events in the dedicated state property
        state.upcomingEvents = action.payload.slice(0, 5);
      })
      .addCase(getUpcomingEvents.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      });
  },
});

export const { reset, triggerRefresh, clearEvent } = eventSlice.actions;
export default eventSlice.reducer;
