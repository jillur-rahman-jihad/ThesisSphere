import mongoose from 'mongoose';

const contributionSchema = new mongoose.Schema(
  {
    thesisGroupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ThesisGroup',
      required: true,
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    task: {
      type: String,
      required: [true, 'Please describe the task'],
    },
    hoursSpent: {
      type: Number,
      default: 0,
    },
    contributionPercentage: {
      type: Number,
      default: 0,
    },
    submittedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

const Contribution = mongoose.model('Contribution', contributionSchema);

export default Contribution;
