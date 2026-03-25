/**
 * Format a date string or Date object into a readable format
 * @param {string|Date} dateString - The date to format
 * @param {Object} options - Formatting options
 * @returns {string} Formatted date string
 */
export const formatDate = (dateString, options = {}) => {
  if (!dateString) return "";

  try {
    const date = new Date(dateString);

    // Default formatting options
    const defaultOptions = {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    };

    // Merge default options with provided options
    const formattingOptions = { ...defaultOptions, ...options };

    // Return formatted date
    return date.toLocaleDateString("en-US", formattingOptions);
  } catch (error) {
    console.error("Error formatting date:", error);
    return dateString;
  }
};

/**
 * Format a date for display in a calendar or event list
 * @param {string|Date} dateString - The date to format
 * @returns {string} Formatted date string (e.g., "Mon, Mar 15, 2023 at 2:30 PM")
 */
export const formatEventDate = (dateString) => {
  if (!dateString) return "";

  try {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Check if the date is today or tomorrow
    if (date.toDateString() === today.toDateString()) {
      return `Today at ${date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      })}`;
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return `Tomorrow at ${date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      })}`;
    } else {
      // Format with day of week for dates in the next 7 days
      const diffDays = Math.ceil((date - today) / (1000 * 60 * 60 * 24));
      if (diffDays > 0 && diffDays < 7) {
        return date.toLocaleDateString("en-US", {
          weekday: "long",
          hour: "2-digit",
          minute: "2-digit",
        });
      } else {
        // Regular format for other dates
        return date.toLocaleDateString("en-US", {
          weekday: "short",
          month: "short",
          day: "numeric",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });
      }
    }
  } catch (error) {
    console.error("Error formatting event date:", error);
    return dateString;
  }
};
