import mongoose from 'mongoose';

const deadlineSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please add a title'],
    },
    description: {
      type: String,
      default: '',
    },
    date: {
      type: Date,
      required: [true, 'Please add a deadline date'],
    },
    type: {
      type: String,
      enum: ['proposal', 'progress', 'meeting', 'submission', 'defense'],
      required: [true, 'Please specify the deadline type'],
    },
    thesisGroupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ThesisGroup',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const Deadline = mongoose.model('Deadline', deadlineSchema);

export default Deadline;
