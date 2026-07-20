import mongoose from 'mongoose';

const thesisApplicationSchema = new mongoose.Schema(
  {
    topicId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ThesisTopic',
      required: true,
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    message: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected'],
      default: 'pending',
    },
  },
  {
    timestamps: true,
  }
);

// Prevent a student from applying to the same topic multiple times
thesisApplicationSchema.index({ topicId: 1, studentId: 1 }, { unique: true });

const ThesisApplication = mongoose.model('ThesisApplication', thesisApplicationSchema);

export default ThesisApplication;
