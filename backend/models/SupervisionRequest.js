import mongoose from 'mongoose';

const supervisionRequestSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    supervisorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'declined'],
      default: 'pending',
    },
    topicTitle: {
      type: String,
      default: '',
    },
    compatibilityScore: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

const SupervisionRequest = mongoose.model('SupervisionRequest', supervisionRequestSchema);

export default SupervisionRequest;
