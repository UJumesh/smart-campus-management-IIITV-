import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    items: [],
    loading: false,
    error: null
};

const resourceSlice = createSlice({
    name: 'resources',
    initialState,
    reducers: {
        // ...existing reducers...
    }
});

export const selectResources = (state) => state?.resources?.items || [];
export default resourceSlice.reducer;