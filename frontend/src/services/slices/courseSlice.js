import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../api";
import { toast } from "react-toastify";

const API_URL = "/api/courses";

const initialState = {
  courses: [],
  course: null,
  isError: false,
  isSuccess: false,
  isLoading: false,
  message: "",
};

// Get all courses
export const getAllCourses = createAsyncThunk(
  "course/getAllCourses",
  async (_, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.user.token;
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };
      const response = await api.get(API_URL, config);
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

// Get course by ID
export const getCourseById = createAsyncThunk(
  "course/getCourseById",
  async (courseId, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.user.token;
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };
      const response = await api.get(`${API_URL}/${courseId}`, config);
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

// Create new course
export const createCourse = createAsyncThunk(
  "course/createCourse",
  async (courseData, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.user.token;
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };
      const response = await api.post(API_URL, courseData, config);
      toast.success("Course created successfully");
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

// Update course
export const updateCourse = createAsyncThunk(
  "course/updateCourse",
  async ({ courseId, courseData }, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.user.token;
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };
      const response = await api.put(
        `${API_URL}/${courseId}`,
        courseData,
        config
      );
      toast.success("Course updated successfully");
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

// Delete course
export const deleteCourse = createAsyncThunk(
  "course/deleteCourse",
  async (courseId, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.user.token;
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };
      await api.delete(`${API_URL}/${courseId}`, config);
      toast.success("Course deleted successfully");
      return courseId;
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

export const courseSlice = createSlice({
  name: "course",
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
      // Get all courses
      .addCase(getAllCourses.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getAllCourses.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.courses = action.payload;
      })
      .addCase(getAllCourses.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      // Get course by ID
      .addCase(getCourseById.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getCourseById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.course = action.payload;
      })
      .addCase(getCourseById.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      // Create course
      .addCase(createCourse.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(createCourse.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.courses.push(action.payload);
      })
      .addCase(createCourse.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      // Update course
      .addCase(updateCourse.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(updateCourse.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.courses = state.courses.map((course) =>
          course._id === action.payload._id ? action.payload : course
        );
        state.course = action.payload;
      })
      .addCase(updateCourse.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      // Delete course
      .addCase(deleteCourse.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(deleteCourse.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.courses = state.courses.filter(
          (course) => course._id !== action.payload
        );
      })
      .addCase(deleteCourse.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      });
  },
});

export const { reset } = courseSlice.actions;
export default courseSlice.reducer;
