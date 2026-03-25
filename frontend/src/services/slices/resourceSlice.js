import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api, { setAuthToken } from "../api";
import { toast } from "react-toastify";

const API_URL = "/api/resources";

const initialState = {
  items: [],
  isError: false,
  isSuccess: false,
  isLoading: false,
  message: "",
  forceRefresh: false,
};

// Get all resources
export const getAllResources = createAsyncThunk(
  "resource/getAllResources",
  async (_, thunkAPI) => {
    try {
      // Get token via multiple methods to ensure we have it
      let token = null;
      
      // Method 1: From Redux state (most common)
      const userFromState = thunkAPI.getState().auth.user;
      if (userFromState && userFromState.token) {
        token = userFromState.token;
        console.log("getAllResources: Token found in Redux state");
      }
      
      // Method 2: From direct token storage (backup)
      if (!token) {
        token = localStorage.getItem("token");
        if (token) console.log("getAllResources: Token found in localStorage.token");
      }
      
      // Method 3: From user object in localStorage (fallback)
      if (!token) {
        try {
          const userStr = localStorage.getItem("user");
          if (userStr) {
            const user = JSON.parse(userStr);
            if (user && user.token) {
              token = user.token;
              console.log("getAllResources: Token found in localStorage.user");
              
              // Restore user to Redux state if needed
              if (!userFromState) {
                console.log("Restoring user to Redux state");
                // We can't directly dispatch here, but we can set the API defaults
                setAuthToken(user.token);
              }
            }
          }
        } catch (e) {
          console.error("Error parsing user from localStorage:", e);
        }
      }
      
      // Final check before proceeding
      if (!token) {
        console.error("getAllResources: No auth token found in any storage location");
        return thunkAPI.rejectWithValue("Authentication token is missing. Please log in again.");
      }
      
      console.log("getAllResources: Starting API request with token");
      
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };
      
      console.log('getAllResources: Sending request to API:', API_URL);
      const response = await api.get(API_URL, config);
      console.log('getAllResources: Raw API Response:', response);
      console.log('getAllResources: Response data:', response.data);
      
      // Complete debug output of entire response
      console.log('FULL DATA DUMP: ', JSON.stringify(response.data, null, 2));
      
      // Handle successful response but no data
      if (!response.data) {
        console.warn('getAllResources: No data in response');
        return { success: true, count: 0, data: [] };
      }
      
      // Standardize response format to account for MongoDB Atlas changes
      let result;
      
      // Case 1: Standard response format {success, count, data}
      if (response.data && response.data.data) {
        console.log(`getAllResources: Found ${response.data.data.length} resources in standard format`);
        result = response.data;
      } 
      // Case 2: Direct array response
      else if (Array.isArray(response.data)) {
        console.log(`getAllResources: Found ${response.data.length} resources in array format`);
        result = { success: true, count: response.data.length, data: response.data };
      }
      // Case 3: MongoDB Atlas format with nested data
      else if (response.data && typeof response.data === 'object') {
        // Check if the response itself is a resource object (has name, type fields)
        if (response.data.name && response.data.type) {
          console.log(`getAllResources: Found single resource object`);
          result = { success: true, count: 1, data: [response.data] };
        } else {
          // Extract any arrays we can find in the response
          const possibleArrays = Object.values(response.data).filter(val => Array.isArray(val));
          if (possibleArrays.length > 0) {
            // Use the longest array found
            const longestArray = possibleArrays.reduce((a, b) => a.length > b.length ? a : b);
            console.log(`getAllResources: Found ${longestArray.length} resources in nested format`);
            result = { success: true, count: longestArray.length, data: longestArray };
          } else {
            // Last resort: just wrap the whole response as a single item
            console.log(`getAllResources: Unusual response format, wrapping entire object`);
            result = { success: true, count: 1, data: [response.data] };
          }
        }
      }
      // Case 4: Empty or unexpected format
      else {
        console.warn('getAllResources: Unexpected response format, returning empty array');
        result = { success: true, count: 0, data: [] };
      }
      
      console.log('Final processed result:', result);
      return result;
    } catch (error) {
      console.error('getAllResources ERROR:', error);
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

// Get resource by ID
export const getResourceById = createAsyncThunk(
  "resource/getResourceById",
  async (resourceId, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.user.token;
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };
      console.log(`Getting resource with ID: ${resourceId}`);
      const response = await api.get(`${API_URL}/${resourceId}`, config);
      console.log('Resource by ID response:', response.data);
      
      // Standardize the response format
      let resourceData = response.data;
      if (resourceData.data) {
        resourceData = resourceData.data;
      }
      
      return resourceData;
    } catch (error) {
      console.error('Error getting resource by ID:', error);
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

// Create new resource
export const createResource = createAsyncThunk(
  "resource/createResource",
  async (resourceData, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.user.token;
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      };
      
      console.log("Sending resource data to API:", resourceData);
      const response = await api.post(API_URL, resourceData, config);
      toast.success("Resource created successfully");
      console.log("API response from createResource:", response.data);
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

// Update resource
export const updateResource = createAsyncThunk(
  "resource/updateResource",
  async ({ resourceId, resourceData }, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.user.token;
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      };
      
      console.log("Updating resource with data:", resourceData);
      const response = await api.put(
        `${API_URL}/${resourceId}`,
        resourceData,
        config
      );
      toast.success("Resource updated successfully");
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

// Delete resource
export const deleteResource = createAsyncThunk(
  "resource/deleteResource",
  async (resourceId, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.user.token;
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };
      await api.delete(`${API_URL}/${resourceId}`, config);
      toast.success("Resource deleted successfully");
      return resourceId;
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

// Get resources by type
export const getResourcesByType = createAsyncThunk(
  "resource/getResourcesByType",
  async (resourceType, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.user.token;
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };
      const response = await api.get(`${API_URL}/type/${resourceType}`, config);
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

const resourceSlice = createSlice({
  name: 'resources',
  initialState,
  reducers: {
    reset: (state) => {
      // Reset status flags but preserve data
      state.isLoading = false;
      state.isSuccess = false;
      state.isError = false;
      state.message = '';
      // DO NOT reset resource or items data
      // This ensures we don't lose data when resetting status flags
    },
    resetForceRefresh(state) {
      state.forceRefresh = false;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(getAllResources.pending, (state) => {
        state.isLoading = true;
        state.isError = false;
        state.message = '';
      })
      .addCase(getAllResources.fulfilled, (state, action) => {
        state.isLoading = false;
        state.items = action.payload;
      })
      .addCase(getAllResources.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.error.message;
      })
      // Get resource by ID
      .addCase(getResourceById.pending, (state) => {
        state.isLoading = true;
        state.isError = false;
        state.message = '';
        // Don't clear resource yet to prevent form flickering during reloads
      })
      .addCase(getResourceById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = false; // Don't set success true as this is just loading data
        state.isError = false;
        
        // Store the resource in the state
        console.log('Setting resource in state:', action.payload);
        state.resource = action.payload;
      })
      .addCase(getResourceById.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
        state.resource = null; // Clear resource on error
      })
      // Create resource
      .addCase(createResource.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(createResource.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        console.log('Create resource reducer received:', action.payload);
        // Handle the response which might be the resource or an object with data property
        const newResource = action.payload?.data || action.payload;
        if (newResource) {
          // If resources is an array, push to it
          if (Array.isArray(state.items)) {
            state.items.push(newResource);
          } 
          // If resources is an object with data property that is an array
          else if (state.items && Array.isArray(state.items.data)) {
            state.items.data.push(newResource);
          }
          // If resources is not initialized yet, create a new array
          else {
            state.items = [newResource];
          }
        }
        // Set this flag to trigger a refresh when component mounts
        state.forceRefresh = true;
        console.log('Adding new resource to state and forcing refresh');
      })
      .addCase(createResource.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      // Update resource
      .addCase(updateResource.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(updateResource.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        
        // Get the updated resource data
        const updatedResource = action.payload?.data || action.payload;
        
        // Update the resource in the items array
        if (Array.isArray(state.items)) {
          // Direct array format
          state.items = state.items.map((resource) =>
            resource._id === updatedResource._id ? updatedResource : resource
          );
        } else if (state.items && Array.isArray(state.items.data)) {
          // Object with data array format
          state.items.data = state.items.data.map((resource) =>
            resource._id === updatedResource._id ? updatedResource : resource
          );
        }
        
        // Keep the individual resource in state for editing forms
        state.resource = updatedResource;
      })
      .addCase(updateResource.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      // Delete resource
      .addCase(deleteResource.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(deleteResource.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        
        const resourceId = action.payload;
        console.log(`Deleting resource with ID: ${resourceId}`);
        
        // Handle different state.items formats
        if (Array.isArray(state.items)) {
          // Direct array format
          state.items = state.items.filter(resource => resource._id !== resourceId);
        } else if (state.items && Array.isArray(state.items.data)) {
          // Object with data array format
          state.items.data = state.items.data.filter(resource => resource._id !== resourceId);
        } else {
          console.warn('Unable to delete from items - unexpected data format');
        }
      })
      .addCase(deleteResource.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      // Get resources by type
      .addCase(getResourcesByType.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getResourcesByType.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.items = action.payload;
      })
      .addCase(getResourcesByType.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      });
  },
});

export const { reset, resetForceRefresh } = resourceSlice.actions;
export default resourceSlice.reducer;
