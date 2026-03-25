import { createSelector } from 'reselect';

// Base selector with better null checking
const selectResourcesState = (state) => state?.resources || {};

// Helper to normalize resource data regardless of structure
const normalizeResourcesData = (items) => {
  // If it's already an array, use it directly
  if (Array.isArray(items)) {
    return items;
  }
  
  // If it has a data property that's an array, use that
  if (items && items.data && Array.isArray(items.data)) {
    return items.data;
  }
  
  // If it's an object but not an array, check for nested resource objects
  if (items && typeof items === 'object' && !Array.isArray(items)) {
    // If it looks like a single resource, wrap it in an array
    if (items.name && items.type) {
      return [items];
    }
    
    // Look for arrays in the object values
    const possibleArrays = Object.values(items).filter(val => Array.isArray(val));
    if (possibleArrays.length > 0) {
      // Use the longest array found
      return possibleArrays.reduce((a, b) => a.length > b.length ? a : b);
    }
  }
  
  // Default to empty array if all else fails
  return [];
};

// Memoized selector for resources
export const selectResources = createSelector(
    [selectResourcesState],
    (resourcesState) => {
      const items = resourcesState.items || [];
      return normalizeResourcesData(items);
    }
);

// Memoized selector for loading state
export const selectResourcesLoading = createSelector(
    [selectResourcesState],
    (resourcesState) => resourcesState.loading || resourcesState.isLoading || false
);

// Memoized selector for error state
export const selectResourcesError = createSelector(
    [selectResourcesState],
    (resourcesState) => resourcesState.error || resourcesState.isError || null
);
