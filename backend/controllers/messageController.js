import Message from '../models/Message.js';
import User from '../models/userModel.js';

// @desc   Send a new message
// @route  POST /api/messages
// @access Private
export const sendMessage = async (req, res, next) => {
  try {
    const sender = req.user._id;
    const { receiver, message, attachments } = req.body;

    if (!receiver || !message) {
      res.status(400);
      throw new Error('Receiver and message are required');
    }

    // Ensure receiver exists
    const recv = await User.findById(receiver).select('-password');
    if (!recv) {
      res.status(404);
      throw new Error('Receiver not found');
    }

    const newMessage = await Message.create({
      sender,
      receiver,
      message,
      attachments: Array.isArray(attachments) ? attachments : [],
    });

    const populated = await Message.findById(newMessage._id)
      .populate('sender', '-password')
      .populate('receiver', '-password');

    res.status(201).json({ success: true, data: populated });
  } catch (error) {
    next(error);
  }
};

// @desc   Get conversation between authenticated user and another user
// @route  GET /api/messages/conversation/:participantId
// @access Private
export const getConversation = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { participantId } = req.params;

    // Validate participant exists
    const participant = await User.findById(participantId).select('-password');
    if (!participant) {
      res.status(404);
      throw new Error('Participant not found');
    }

    const messages = await Message.find({
      $or: [
        { sender: userId, receiver: participantId },
        { sender: participantId, receiver: userId },
      ],
    })
      .sort({ createdAt: 1 })
      .populate('sender', '-password')
      .populate('receiver', '-password');

    res.status(200).json({ success: true, count: messages.length, data: messages });
  } catch (error) {
    next(error);
  }
};

// @desc   Get inbox (latest message per conversation)
// @route  GET /api/messages/inbox
// @access Private
export const getInbox = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const agg = await Message.aggregate([
      {
        $match: {
          $or: [{ sender: userId }, { receiver: userId }],
        },
      },
      {
        $project: {
          sender: 1,
          receiver: 1,
          message: 1,
          attachments: 1,
          isRead: 1,
          createdAt: 1,
          otherUser: {
            $cond: [{ $eq: ['$sender', userId] }, '$receiver', '$sender'],
          },
        },
      },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: '$otherUser',
          lastMessageId: { $first: '$_id' },
          lastMessage: { $first: '$message' },
          attachments: { $first: '$attachments' },
          isRead: { $first: '$isRead' },
          createdAt: { $first: '$createdAt' },
        },
      },
      { $sort: { createdAt: -1 } },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'participant',
        },
      },
      { $unwind: '$participant' },
      {
        $project: {
          _id: 0,
          participant: { _id: '$participant._id', fullName: '$participant.fullName', email: '$participant.email', role: '$participant.role' },
          lastMessage: 1,
          attachments: 1,
          isRead: 1,
          createdAt: 1,
          lastMessageId: 1,
        },
      },
    ]);

    res.status(200).json({ success: true, count: agg.length, data: agg });
  } catch (error) {
    next(error);
  }
};

// @desc   Mark a message as read
// @route  PATCH /api/messages/:id/read
// @access Private
export const markAsRead = async (req, res, next) => {
  try {
    const messageId = req.params.id;
    const userId = req.user._id;

    const message = await Message.findById(messageId);
    if (!message) {
      res.status(404);
      throw new Error('Message not found');
    }

    // Only receiver can mark as read
    if (message.receiver.toString() !== userId.toString()) {
      res.status(403);
      throw new Error('Not authorized to mark this message as read');
    }

    message.isRead = true;
    await message.save();

    res.status(200).json({ success: true, data: message });
  } catch (error) {
    next(error);
  }
};
