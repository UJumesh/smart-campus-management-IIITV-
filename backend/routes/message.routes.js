const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/auth");
const messageController = require("../controllers/message.controller");

// Get all conversations and send message
router.route("/").post(protect, messageController.sendMessage);

// Get a specific conversation's messages
router.route("/conversations").get(protect, messageController.getConversations);

// Get single conversation with messages
router
  .route("/conversations/:id")
  .get(protect, messageController.getConversation);

// Create direct conversation
router
  .route("/conversations/direct/:recipientId")
  .post(protect, messageController.createDirectConversation);

// Create group conversation
router
  .route("/conversations/group")
  .post(
    protect,
    authorize("admin", "lecturer"),
    messageController.createGroupConversation
  );

// Add participants to group conversation
router
  .route("/conversations/:id/participants")
  .post(protect, messageController.addParticipants);

// Search users by email
router.route("/users/search").get(protect, messageController.searchUsers);

module.exports = router;
