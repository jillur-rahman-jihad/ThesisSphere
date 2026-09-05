import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: [true, 'Please add a notification title'],
    },
    message: {
      type: String,
      default: '',
    },
    type: {
      type: String,
      default: 'general',
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    actionId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    actionType: {
      type: String,
      default: null,
    },
    actionStatus: {
      type: String,
      enum: ['pending', 'accepted', 'rejected'],
      default: 'pending',
    },
  },
  {
    timestamps: true,
  }
);

const Notification = mongoose.model('Notification', notificationSchema);

export default Notification;
