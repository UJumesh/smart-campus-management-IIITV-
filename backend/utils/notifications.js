const Notification = require('../models/Notification');

/**
 * Send a notification to a user
 * @param {Object} notificationData - The notification data
 * @param {String} notificationData.recipient - The recipient user ID
 * @param {String} notificationData.sender - The sender user ID
 * @param {String} notificationData.type - The notification type
 * @param {String} notificationData.title - The notification title
 * @param {String} notificationData.message - The notification message
 * @param {Object} notificationData.reference - Reference object (optional)
 * @param {String} notificationData.reference.type - Reference type (e.g., 'event', 'message')
 * @param {String} notificationData.reference.id - Reference ID
 * @returns {Promise<Object>} The created notification
 */
exports.sendNotification = async (notificationData) => {
  try {
    // Check if Notification model exists
    if (!Notification) {
      console.warn('Notification model not found. Using mock implementation.');
      return {
        _id: 'mock-notification-id',
        ...notificationData,
        createdAt: new Date(),
        read: false
      };
    }

    const notification = await Notification.create({
      recipient: notificationData.recipient,
      sender: notificationData.sender,
      type: notificationData.type,
      title: notificationData.title,
      message: notificationData.message,
      reference: notificationData.reference,
      read: false
    });

    // Here you could also implement real-time notifications via WebSockets
    // For example, using Socket.io to emit an event to the recipient

    return notification;
  } catch (error) {
    console.error('Error sending notification:', error);
    // Return a mock notification in case of error
    return {
      _id: 'error-notification-id',
      ...notificationData,
      createdAt: new Date(),
      read: false,
      error: error.message
    };
  }
}; 