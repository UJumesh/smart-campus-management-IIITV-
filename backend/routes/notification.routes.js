const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const Notification = require("../models/Notification");
const asyncHandler = require("../middleware/async");
const ErrorResponse = require("../utils/errorResponse");

// Notification controller with real implementations
const notificationController = {
  // Get all notifications for the current user
  getNotifications: asyncHandler(async (req, res) => {
    const notifications = await Notification.find({ recipient: req.user.id })
      .sort({ createdAt: -1 })
      .populate("sender", "firstName lastName avatar");

    res.status(200).json({
      success: true,
      count: notifications.length,
      data: notifications,
    });
  }),

  // Get a single notification
  getNotification: asyncHandler(async (req, res, next) => {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      return next(
        new ErrorResponse(
          `Notification not found with id of ${req.params.id}`,
          404
        )
      );
    }

    // Make sure notification belongs to user
    if (notification.recipient.toString() !== req.user.id) {
      return next(
        new ErrorResponse(`Not authorized to access this notification`, 403)
      );
    }

    res.status(200).json({ success: true, data: notification });
  }),

  // Mark a notification as read
  markAsRead: asyncHandler(async (req, res, next) => {
    let notification = await Notification.findById(req.params.id);

    if (!notification) {
      return next(
        new ErrorResponse(
          `Notification not found with id of ${req.params.id}`,
          404
        )
      );
    }

    // Make sure notification belongs to user
    if (notification.recipient.toString() !== req.user.id) {
      return next(
        new ErrorResponse(`Not authorized to modify this notification`, 403)
      );
    }

    notification = await Notification.findByIdAndUpdate(
      req.params.id,
      { read: true, readAt: Date.now() },
      { new: true }
    );

    res.status(200).json({ success: true, data: notification });
  }),

  // Mark all notifications as read
  markAllAsRead: asyncHandler(async (req, res) => {
    await Notification.updateMany(
      { recipient: req.user.id, read: false },
      { read: true, readAt: Date.now() }
    );

    res.status(200).json({ success: true, data: {} });
  }),

  // Delete a notification
  deleteNotification: asyncHandler(async (req, res, next) => {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      return next(
        new ErrorResponse(
          `Notification not found with id of ${req.params.id}`,
          404
        )
      );
    }

    // Make sure notification belongs to user
    if (notification.recipient.toString() !== req.user.id) {
      return next(
        new ErrorResponse(`Not authorized to delete this notification`, 403)
      );
    }

    await notification.remove();

    res.status(200).json({ success: true, data: {} });
  }),

  // Delete all notifications
  deleteAllNotifications: asyncHandler(async (req, res) => {
    await Notification.deleteMany({ recipient: req.user.id });

    res.status(200).json({
      success: true,
      message: "All notifications deleted successfully",
      data: {},
    });
  }),
};

// Routes
router.route("/").get(protect, notificationController.getNotifications);

// Route to delete all notifications
router
  .route("/delete-all")
  .delete(protect, notificationController.deleteAllNotifications);

// Add sample notifications route for testing
router.route("/generate-samples").post(
  protect,
  asyncHandler(async (req, res) => {
    // Delete existing notifications for this user to avoid duplicates
    await Notification.deleteMany({ recipient: req.user.id });

    // Create sample notifications
    const sampleNotifications = [
      {
        recipient: req.user.id,
        sender: req.user.id,
        type: "event_invitation",
        title: "New Event Invitation",
        content: "You have been invited to the End of Year Celebration",
        read: false,
        priority: "medium",
        link: "/events/1",
      },
      {
        recipient: req.user.id,
        sender: req.user.id,
        type: "schedule_change",
        title: "Class Rescheduled",
        content: "Your Database Systems class has been moved to Room 302",
        read: false,
        priority: "high",
        link: "/schedule",
      },
      {
        recipient: req.user.id,
        sender: req.user.id,
        type: "message",
        title: "New Message",
        content: "You have a new message from Professor Smith",
        read: true,
        priority: "medium",
        link: "/messages",
      },
      {
        recipient: req.user.id,
        sender: req.user.id,
        type: "announcement",
        title: "Campus Announcement",
        content: "The library will be closed for renovations next weekend",
        read: true,
        priority: "low",
        link: null,
      },
      {
        recipient: req.user.id,
        sender: req.user.id,
        type: "system",
        title: "Account Update",
        content: "Your account has been updated successfully",
        read: false,
        priority: "low",
        link: "/profile",
      },
    ];

    await Notification.insertMany(sampleNotifications);

    res.status(200).json({
      success: true,
      message: "Sample notifications generated",
      count: sampleNotifications.length,
    });
  })
);

router
  .route("/mark-all-read")
  .put(protect, notificationController.markAllAsRead);

router
  .route("/:id")
  .get(protect, notificationController.getNotification)
  .put(protect, notificationController.markAsRead)
  .delete(protect, notificationController.deleteNotification);

module.exports = router;
