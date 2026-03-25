const Message = require("../models/Message");
const Conversation = require("../models/Conversation");
const User = require("../models/User");
const asyncHandler = require("../middleware/async");
const ErrorResponse = require("../utils/errorResponse");
const mongoose = require("mongoose");

/**
 * @desc    Get all conversations for the current user
 * @route   GET /api/messages/conversations
 * @access  Private
 */
exports.getConversations = asyncHandler(async (req, res, next) => {
  // Find all conversations where the user is a participant
  const conversations = await Conversation.find({
    "participants.user": req.user.id,
  })
    .populate({
      path: "participants.user",
      select: "firstName lastName email role",
    })
    .populate({
      path: "lastMessage",
      select: "content createdAt isSystemMessage",
    })
    .populate({
      path: "createdBy",
      select: "firstName lastName email",
    })
    .sort({ lastMessageAt: -1, createdAt: -1 });

  res.status(200).json({
    success: true,
    count: conversations.length,
    data: conversations,
  });
});

/**
 * @desc    Get a single conversation with messages
 * @route   GET /api/messages/conversations/:id
 * @access  Private
 */
exports.getConversation = asyncHandler(async (req, res, next) => {
  const conversation = await Conversation.findById(req.params.id)
    .populate({
      path: "participants.user",
      select: "firstName lastName email role",
    })
    .populate({
      path: "createdBy",
      select: "firstName lastName email",
    });

  if (!conversation) {
    return next(
      new ErrorResponse(
        `Conversation not found with id of ${req.params.id}`,
        404
      )
    );
  }

  // Check if user is part of the conversation
  const isParticipant = conversation.participants.some(
    (participant) => participant.user._id.toString() === req.user.id
  );

  if (!isParticipant) {
    return next(
      new ErrorResponse("Not authorized to access this conversation", 403)
    );
  }

  // Get messages for the conversation
  const messages = await Message.find({ conversation: req.params.id })
    .populate({
      path: "sender",
      select: "firstName lastName email role",
    })
    .populate({
      path: "readBy.user",
      select: "firstName lastName",
    })
    .sort({ createdAt: 1 });

  // Update user's lastSeen timestamp in the conversation
  await Conversation.findOneAndUpdate(
    {
      _id: req.params.id,
      "participants.user": req.user.id,
    },
    {
      "participants.$.lastSeen": new Date(),
    }
  );

  // Mark all messages as read by current user
  await Message.updateMany(
    {
      conversation: req.params.id,
      "readBy.user": { $ne: req.user.id },
    },
    {
      $addToSet: {
        readBy: {
          user: req.user.id,
          readAt: new Date(),
        },
      },
    }
  );

  res.status(200).json({
    success: true,
    data: {
      conversation,
      messages,
    },
  });
});

/**
 * @desc    Create a new direct conversation
 * @route   POST /api/messages/conversations/direct/:recipientId
 * @access  Private
 */
exports.createDirectConversation = asyncHandler(async (req, res, next) => {
  const { recipientId } = req.params;

  // Check if recipient exists
  const recipient = await User.findById(recipientId);
  if (!recipient) {
    return next(
      new ErrorResponse(`User not found with id of ${recipientId}`, 404)
    );
  }

  // Check if a conversation already exists between these users
  const existingConversation = await Conversation.findOne({
    type: "direct",
    participants: {
      $all: [
        { $elemMatch: { user: new mongoose.Types.ObjectId(req.user.id) } },
        { $elemMatch: { user: new mongoose.Types.ObjectId(recipientId) } },
      ],
    },
  });

  if (existingConversation) {
    return res.status(200).json({
      success: true,
      data: existingConversation,
    });
  }

  // Create conversation
  const conversation = await Conversation.create({
    type: "direct",
    participants: [
      { user: req.user.id, role: "member", lastSeen: new Date() },
      { user: recipientId, role: "member" },
    ],
    createdBy: req.user.id,
  });

  // Populate the response
  const populatedConversation = await Conversation.findById(conversation._id)
    .populate({
      path: "participants.user",
      select: "firstName lastName email role",
    })
    .populate({
      path: "createdBy",
      select: "firstName lastName email",
    });

  res.status(201).json({
    success: true,
    data: populatedConversation,
  });
});

/**
 * @desc    Create a new group conversation
 * @route   POST /api/messages/conversations/group
 * @access  Private (Admin and Lecturer only)
 */
exports.createGroupConversation = asyncHandler(async (req, res, next) => {
  const { name, participantIds } = req.body;

  // Check if current user is admin or lecturer
  if (req.user.role !== "admin" && req.user.role !== "lecturer") {
    return next(
      new ErrorResponse("Not authorized to create group conversations", 403)
    );
  }

  if (!name) {
    return next(new ErrorResponse("Please provide a name for the group", 400));
  }

  if (
    !participantIds ||
    !Array.isArray(participantIds) ||
    participantIds.length === 0
  ) {
    return next(new ErrorResponse("Please provide participant IDs", 400));
  }

  // Validate all participants exist
  const participants = await User.find({ _id: { $in: participantIds } });
  if (participants.length !== participantIds.length) {
    return next(new ErrorResponse("One or more participants not found", 404));
  }

  // Create participant array, adding creator as admin
  const participantArray = [
    { user: req.user.id, role: "admin", lastSeen: new Date() },
  ];

  // Add participants if not already included (avoid duplicates)
  participantIds.forEach((id) => {
    if (id !== req.user.id) {
      participantArray.push({ user: id, role: "member" });
    }
  });

  // Create conversation
  const conversation = await Conversation.create({
    name,
    type: "group",
    participants: participantArray,
    createdBy: req.user.id,
  });

  // Create system message about group creation
  await Message.create({
    sender: req.user.id,
    conversation: conversation._id,
    content: `${req.user.firstName} ${req.user.lastName} created the group "${name}"`,
    isSystemMessage: true,
  });

  // Populate the response
  const populatedConversation = await Conversation.findById(conversation._id)
    .populate({
      path: "participants.user",
      select: "firstName lastName email role",
    })
    .populate({
      path: "createdBy",
      select: "firstName lastName email",
    });

  res.status(201).json({
    success: true,
    data: populatedConversation,
  });
});

/**
 * @desc    Add participants to a group conversation
 * @route   POST /api/messages/conversations/:id/participants
 * @access  Private (Admin and Lecturer only)
 */
exports.addParticipants = asyncHandler(async (req, res, next) => {
  const { participantIds } = req.body;

  // Validate participantIds
  if (
    !participantIds ||
    !Array.isArray(participantIds) ||
    participantIds.length === 0
  ) {
    return next(new ErrorResponse("Please provide participant IDs", 400));
  }

  // Find conversation
  const conversation = await Conversation.findById(req.params.id);
  if (!conversation) {
    return next(
      new ErrorResponse(
        `Conversation not found with id of ${req.params.id}`,
        404
      )
    );
  }

  // Check if conversation is a group
  if (conversation.type !== "group") {
    return next(
      new ErrorResponse("Can only add participants to group conversations", 400)
    );
  }

  // Check if user is admin of the group
  const userParticipant = conversation.participants.find(
    (p) => p.user.toString() === req.user.id && p.role === "admin"
  );

  if (!userParticipant && req.user.role !== "admin") {
    return next(
      new ErrorResponse("Not authorized to add participants to this group", 403)
    );
  }

  // Validate all participants exist
  const participants = await User.find({ _id: { $in: participantIds } });
  if (participants.length !== participantIds.length) {
    return next(new ErrorResponse("One or more participants not found", 404));
  }

  // Add new participants if not already in the group
  const existingParticipantIds = conversation.participants.map((p) =>
    p.user.toString()
  );
  const newParticipants = [];

  for (const id of participantIds) {
    if (!existingParticipantIds.includes(id)) {
      conversation.participants.push({ user: id, role: "member" });
      newParticipants.push(id);
    }
  }

  // Save if there are new participants
  if (newParticipants.length > 0) {
    await conversation.save();

    // Get new participant names for system message
    const newParticipantUsers = await User.find({
      _id: { $in: newParticipants },
    }).select("firstName lastName");

    const participantNames = newParticipantUsers
      .map((u) => `${u.firstName} ${u.lastName}`)
      .join(", ");

    // Create system message
    await Message.create({
      sender: req.user.id,
      conversation: conversation._id,
      content: `${req.user.firstName} ${req.user.lastName} added ${participantNames} to the group`,
      isSystemMessage: true,
    });
  }

  // Populate the response
  const populatedConversation = await Conversation.findById(conversation._id)
    .populate({
      path: "participants.user",
      select: "firstName lastName email role",
    })
    .populate({
      path: "createdBy",
      select: "firstName lastName email",
    });

  res.status(200).json({
    success: true,
    data: populatedConversation,
  });
});

/**
 * @desc    Send a message
 * @route   POST /api/messages
 * @access  Private
 */
exports.sendMessage = asyncHandler(async (req, res, next) => {
  // Accept both conversationId and conversation parameter names for flexibility
  const { conversationId, conversation, content, attachments } = req.body;
  const targetConversationId = conversationId || conversation;

  // Validate content
  if (!content || content.trim() === "") {
    return next(new ErrorResponse("Message content is required", 400));
  }

  // Validate conversationId
  if (!targetConversationId) {
    return next(new ErrorResponse("Conversation ID is required", 400));
  }

  // Find conversation
  const conversationDoc = await Conversation.findById(targetConversationId);
  if (!conversationDoc) {
    return next(
      new ErrorResponse(
        `Conversation not found with id of ${targetConversationId}`,
        404
      )
    );
  }

  // Check if user is part of the conversation
  const isParticipant = conversationDoc.participants.some(
    (p) => p.user.toString() === req.user.id
  );

  if (!isParticipant) {
    return next(
      new ErrorResponse(
        "Not authorized to send messages to this conversation",
        403
      )
    );
  }

  // Create message
  const message = await Message.create({
    sender: req.user.id,
    conversation: targetConversationId,
    content,
    attachments: attachments || [],
    readBy: [{ user: req.user.id }], // Mark as read by sender
  });

  // Update conversation last message and time
  await Conversation.findByIdAndUpdate(targetConversationId, {
    lastMessage: message._id,
    lastMessageAt: message.createdAt,
  });

  // Update sender's lastSeen in the conversation
  await Conversation.findOneAndUpdate(
    {
      _id: targetConversationId,
      "participants.user": req.user.id,
    },
    {
      "participants.$.lastSeen": new Date(),
    }
  );

  // Populate the response
  const populatedMessage = await Message.findById(message._id).populate({
    path: "sender",
    select: "firstName lastName email role",
  });

  res.status(201).json({
    success: true,
    data: populatedMessage,
  });
});

/**
 * @desc    Search users by email
 * @route   GET /api/messages/users/search
 * @access  Private
 */
exports.searchUsers = asyncHandler(async (req, res, next) => {
  const { email } = req.query;

  if (!email) {
    return next(new ErrorResponse("Please provide an email to search", 400));
  }

  // Validate minimum length for search
  if (email.length < 3) {
    return next(new ErrorResponse("Please provide at least 3 characters", 400));
  }

  // Search for users with matching email (case insensitive)
  const users = await User.find({
    email: { $regex: email, $options: "i" },
    _id: { $ne: req.user.id }, // Exclude current user
  }).select("firstName lastName email role");

  res.status(200).json({
    success: true,
    count: users.length,
    data: users,
  });
});
