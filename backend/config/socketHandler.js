import jwt from 'jsonwebtoken';
import User from '../models/userModel.js';
import VideoMeeting from '../models/VideoMeeting.js';
import Message from '../models/Message.js';

/**
 * Initialize Socket.IO signaling for WebRTC video meetings and real-time messaging.
 * Keeps signaling logic isolated from Express routes.
 */
const initializeSocket = (io) => {
  // Track active participants per room: { meetingId: Map<socketId, userData> }
  const rooms = new Map();
  // Track online users: Map<userId, Set<socketId>>
  const userSockets = new Map();

  // Authenticate socket connections using JWT
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;

      if (!token) {
        return next(new Error('Authentication required'));
      }

      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'fallback_secret_key'
      );

      const user = await User.findById(decoded.id).select('-password');
      if (!user) {
        return next(new Error('User not found'));
      }

      // Attach user data to the socket
      socket.user = {
        _id: user._id.toString(),
        fullName: user.fullName,
        email: user.email,
        role: user.role,
      };

      next();
    } catch (error) {
      next(new Error('Authentication failed'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.user._id;
    console.log(`[Socket.IO] User connected: ${socket.user.fullName} (${socket.id})`);

    // Join user's individual room for direct messages and notifications
    socket.join(userId);
    socket.join(`user:${userId}`);

    // Track online status
    if (!userSockets.has(userId)) {
      userSockets.set(userId, new Set());
    }
    userSockets.get(userId).add(socket.id);

    // If first socket connection for this user, broadcast online status
    if (userSockets.get(userId).size === 1) {
      socket.broadcast.emit('user_online', { userId });
    }

    // Send current list of online user IDs to the connected client
    socket.emit('online_users', Array.from(userSockets.keys()));


    /**
     * Event: join-meeting
     * Payload: { meetingId: string }
     * Joins the socket to the meeting room, validates the meeting exists,
     * and limits participants to 2.
     */
    socket.on('join-meeting', async ({ meetingId }) => {
      try {
        // Validate meeting exists in DB
        const meeting = await VideoMeeting.findOne({ meetingId });
        if (!meeting) {
          socket.emit('error-message', { message: 'Meeting not found' });
          return;
        }

        if (meeting.status === 'ended') {
          socket.emit('error-message', { message: 'This meeting has ended' });
          return;
        }

        // Initialize room tracking if needed
        if (!rooms.has(meetingId)) {
          rooms.set(meetingId, new Map());
        }

        const room = rooms.get(meetingId);

        // Check if this user is already in the room (e.g. page refresh)
        for (const [existingSocketId, existingUser] of room.entries()) {
          if (existingUser._id === socket.user._id && existingSocketId !== socket.id) {
            // Remove old socket entry
            room.delete(existingSocketId);
            break;
          }
        }

        // Check room capacity (max 2 participants)
        if (room.size >= 2 && !room.has(socket.id)) {
          socket.emit('error-message', { message: 'Meeting is full (maximum 2 participants)' });
          return;
        }

        // Join the Socket.IO room
        socket.join(meetingId);
        socket.meetingId = meetingId;
        room.set(socket.id, socket.user);

        console.log(`[Socket.IO] ${socket.user.fullName} joined meeting ${meetingId} (${room.size}/2)`);

        // Update meeting in DB
        if (!meeting.participants.some((p) => p.toString() === socket.user._id)) {
          meeting.participants.push(socket.user._id);
        }
        if (room.size >= 2 && meeting.status === 'waiting') {
          meeting.status = 'active';
          meeting.startedAt = new Date();
        }
        await meeting.save();

        // Notify the joining user about existing participants
        const existingParticipants = [];
        for (const [sid, userData] of room.entries()) {
          if (sid !== socket.id) {
            existingParticipants.push({ socketId: sid, user: userData });
          }
        }

        socket.emit('room-info', {
          meetingId,
          participants: existingParticipants,
          participantCount: room.size,
        });

        // Notify existing participants that someone joined
        socket.to(meetingId).emit('user-joined', {
          socketId: socket.id,
          user: socket.user,
        });
      } catch (error) {
        console.error('[Socket.IO] Error joining meeting:', error.message);
        socket.emit('error-message', { message: 'Failed to join meeting' });
      }
    });

    /**
     * Event: offer
     * Relay WebRTC offer to the target peer.
     */
    socket.on('offer', ({ to, offer }) => {
      socket.to(to).emit('offer', {
        from: socket.id,
        offer,
        user: socket.user,
      });
    });

    /**
     * Event: answer
     * Relay WebRTC answer to the target peer.
     */
    socket.on('answer', ({ to, answer }) => {
      socket.to(to).emit('answer', {
        from: socket.id,
        answer,
      });
    });

    /**
     * Event: ice-candidate
     * Relay ICE candidate to the target peer.
     */
    socket.on('ice-candidate', ({ to, candidate }) => {
      socket.to(to).emit('ice-candidate', {
        from: socket.id,
        candidate,
      });
    });

    /**
     * Real-time Direct Messaging Events
     */

    // Send a message in real-time
    socket.on('send_message', async ({ receiverId, message, attachments }, callback) => {
      try {
        if (!receiverId || !message || !message.trim()) {
          return callback?.({ success: false, message: 'Receiver and message are required' });
        }

        const newMessage = await Message.create({
          sender: socket.user._id,
          receiver: receiverId,
          message: message.trim(),
          attachments: Array.isArray(attachments) ? attachments : [],
        });

        const populated = await Message.findById(newMessage._id)
          .populate('sender', '-password')
          .populate('receiver', '-password');

        // Emit to recipient's room(s) and sender's room(s)
        io.to(receiverId.toString()).to(`user:${receiverId}`).emit('new_message', populated);
        io.to(socket.user._id.toString()).to(`user:${socket.user._id}`).emit('new_message', populated);

        callback?.({ success: true, data: populated });
      } catch (err) {
        console.error('[Socket.IO] send_message error:', err.message);
        callback?.({ success: false, message: err.message });
      }
    });

    // Real-time typing indicators
    socket.on('typing', ({ receiverId }) => {
      if (receiverId) {
        io.to(receiverId.toString()).to(`user:${receiverId}`).emit('user_typing', {
          senderId: socket.user._id,
          senderName: socket.user.fullName,
        });
      }
    });

    socket.on('stop_typing', ({ receiverId }) => {
      if (receiverId) {
        io.to(receiverId.toString()).to(`user:${receiverId}`).emit('user_stop_typing', {
          senderId: socket.user._id,
        });
      }
    });

    // Mark single message as read
    socket.on('mark_read', async ({ messageId }, callback) => {
      try {
        if (!messageId) return;
        const msg = await Message.findById(messageId);
        if (msg && msg.receiver.toString() === socket.user._id.toString()) {
          msg.isRead = true;
          await msg.save();

          io.to(msg.sender.toString()).to(`user:${msg.sender}`).emit('message_read', {
            messageId: msg._id,
            readerId: socket.user._id,
          });
          callback?.({ success: true });
        }
      } catch (err) {
        console.error('[Socket.IO] mark_read error:', err.message);
        callback?.({ success: false, message: err.message });
      }
    });

    // Mark whole conversation with participant as read
    socket.on('read_conversation', async ({ participantId }, callback) => {
      try {
        if (!participantId) return;
        const result = await Message.updateMany(
          { sender: participantId, receiver: socket.user._id, isRead: false },
          { $set: { isRead: true } }
        );

        io.to(participantId.toString()).to(`user:${participantId}`).emit('conversation_read', {
          readerId: socket.user._id,
          participantId: participantId.toString(),
          count: result.modifiedCount,
        });

        callback?.({ success: true, count: result.modifiedCount });
      } catch (err) {
        console.error('[Socket.IO] read_conversation error:', err.message);
        callback?.({ success: false, message: err.message });
      }
    });

    /**
     * Event: disconnect
     * Clean up when a user disconnects.
     */
    socket.on('disconnect', () => {
      console.log(`[Socket.IO] User disconnected: ${socket.user.fullName} (${socket.id})`);

      // Clean up user socket tracking & presence
      if (userSockets.has(userId)) {
        const set = userSockets.get(userId);
        set.delete(socket.id);
        if (set.size === 0) {
          userSockets.delete(userId);
          socket.broadcast.emit('user_offline', { userId });
        }
      }

      const meetingId = socket.meetingId;
      if (meetingId && rooms.has(meetingId)) {
        const room = rooms.get(meetingId);
        room.delete(socket.id);

        // Notify remaining participants
        socket.to(meetingId).emit('user-left', {
          socketId: socket.id,
          user: socket.user,
        });

        // Clean up empty rooms
        if (room.size === 0) {
          rooms.delete(meetingId);
        }
      }
    });

    /**
     * Event: leave-meeting
     * Explicit leave (user clicks "Leave" button).
     */
    socket.on('leave-meeting', () => {
      const meetingId = socket.meetingId;
      if (meetingId) {
        console.log(`[Socket.IO] ${socket.user.fullName} left meeting ${meetingId}`);

        if (rooms.has(meetingId)) {
          const room = rooms.get(meetingId);
          room.delete(socket.id);

          // Notify remaining participants
          socket.to(meetingId).emit('user-left', {
            socketId: socket.id,
            user: socket.user,
          });

          if (room.size === 0) {
            rooms.delete(meetingId);
          }
        }

        socket.leave(meetingId);
        socket.meetingId = null;
      }
    });
  });
};


export default initializeSocket;
