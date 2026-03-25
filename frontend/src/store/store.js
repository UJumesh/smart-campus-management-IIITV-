
import { configureStore } from '@reduxjs/toolkit';
import resourceReducer from '../slices/resourceSlice';

const store = configureStore({
    reducer: {
        resources: resourceReducer
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: false
        })
});

export default store;