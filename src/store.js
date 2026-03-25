import { configureStore } from '@reduxjs/toolkit';

// Create store without any reducers since we're not using them
export default configureStore({
  reducer: {
    // Intentionally left empty
  },
}); 