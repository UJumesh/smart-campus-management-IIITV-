import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../api";
import { toast } from "react-toastify";

const API_URL = "/api/reservations";

const initialState = {
  reservations: [],
  reservation: null,
  isError: false,
  isSuccess: false,
  isLoading: false,
  message: "",
};

// Get user reservations
export const getUserReservations = createAsyncThunk(
  "reservation/getUserReservations",
  async (_, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.user.token;
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };
      const response = await api.get(`${API_URL}/user`, config);
      return response.data;
    } catch (error) {
      const message =
        (error.response &&
          error.response.data &&
          error.response.data.message) ||
        error.message ||
        error.toString();

      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Get reservation by ID
export const getReservationById = createAsyncThunk(
  "reservation/getReservationById",
  async (reservationId, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.user.token;
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };
      const response = await api.get(`${API_URL}/${reservationId}`, config);
      return response.data;
    } catch (error) {
      const message =
        (error.response &&
          error.response.data &&
          error.response.data.message) ||
        error.message ||
        error.toString();

      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Get resource reservations
export const getResourceReservations = createAsyncThunk(
  "reservation/getResourceReservations",
  async (resourceId, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.user.token;
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };
      const response = await api.get(
        `${API_URL}/resource/${resourceId}`,
        config
      );
      return response.data;
    } catch (error) {
      const message =
        (error.response &&
          error.response.data &&
          error.response.data.message) ||
        error.message ||
        error.toString();

      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Create new reservation
export const createReservation = createAsyncThunk(
  "reservation/createReservation",
  async (reservationData, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.user.token;
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };
      const response = await api.post(API_URL, reservationData, config);
      toast.success("Reservation created successfully");
      return response.data;
    } catch (error) {
      const message =
        (error.response &&
          error.response.data &&
          error.response.data.message) ||
        error.message ||
        error.toString();

      toast.error(message);
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Update reservation
export const updateReservation = createAsyncThunk(
  "reservation/updateReservation",
  async ({ reservationId, reservationData }, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.user.token;
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };
      const response = await api.put(
        `${API_URL}/${reservationId}`,
        reservationData,
        config
      );
      toast.success("Reservation updated successfully");
      return response.data;
    } catch (error) {
      const message =
        (error.response &&
          error.response.data &&
          error.response.data.message) ||
        error.message ||
        error.toString();

      toast.error(message);
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Cancel reservation
export const cancelReservation = createAsyncThunk(
  "reservation/cancelReservation",
  async (reservationId, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.user.token;
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };
      const response = await api.put(
        `${API_URL}/${reservationId}/cancel`,
        {},
        config
      );
      toast.success("Reservation cancelled successfully");
      return response.data;
    } catch (error) {
      const message =
        (error.response &&
          error.response.data &&
          error.response.data.message) ||
        error.message ||
        error.toString();

      toast.error(message);
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Delete reservation
export const deleteReservation = createAsyncThunk(
  "reservation/deleteReservation",
  async (reservationId, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.user.token;
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };
      await api.delete(`${API_URL}/${reservationId}`, config);
      toast.success("Reservation deleted successfully");
      return reservationId;
    } catch (error) {
      const message =
        (error.response &&
          error.response.data &&
          error.response.data.message) ||
        error.message ||
        error.toString();

      toast.error(message);
      return thunkAPI.rejectWithValue(message);
    }
  }
);

export const reservationSlice = createSlice({
  name: "reservation",
  initialState,
  reducers: {
    reset: (state) => {
      state.isLoading = false;
      state.isSuccess = false;
      state.isError = false;
      state.message = "";
    },
  },
  extraReducers: (builder) => {
    builder
      // Get user reservations
      .addCase(getUserReservations.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getUserReservations.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.reservations = action.payload;
      })
      .addCase(getUserReservations.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      // Get reservation by ID
      .addCase(getReservationById.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getReservationById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.reservation = action.payload;
      })
      .addCase(getReservationById.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      // Get resource reservations
      .addCase(getResourceReservations.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getResourceReservations.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.reservations = action.payload;
      })
      .addCase(getResourceReservations.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      // Create reservation
      .addCase(createReservation.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(createReservation.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.reservations.push(action.payload);
      })
      .addCase(createReservation.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      // Update reservation
      .addCase(updateReservation.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(updateReservation.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.reservations = state.reservations.map((reservation) =>
          reservation._id === action.payload._id ? action.payload : reservation
        );
        state.reservation = action.payload;
      })
      .addCase(updateReservation.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      // Cancel reservation
      .addCase(cancelReservation.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(cancelReservation.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.reservations = state.reservations.map((reservation) =>
          reservation._id === action.payload._id ? action.payload : reservation
        );
        state.reservation = action.payload;
      })
      .addCase(cancelReservation.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      // Delete reservation
      .addCase(deleteReservation.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(deleteReservation.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.reservations = state.reservations.filter(
          (reservation) => reservation._id !== action.payload
        );
      })
      .addCase(deleteReservation.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      });
  },
});

export const { reset } = reservationSlice.actions;
export default reservationSlice.reducer;
