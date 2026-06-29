import mongoose from 'mongoose';

const meetingSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please add a meeting title'],
    },
    thesisGroupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ThesisGroup',
      required: true,
    },
    supervisorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    meetingDate: {
      type: Date,
      required: [true, 'Please add a meeting date'],
    },
    meetingLink: {
      type: String,
      default: '',
    },
    agenda: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['scheduled', 'completed', 'cancelled'],
      default: 'scheduled',
    },
  },
  {
    timestamps: true,
  }
);

const Meeting = mongoose.model('Meeting', meetingSchema);

export default Meeting;
