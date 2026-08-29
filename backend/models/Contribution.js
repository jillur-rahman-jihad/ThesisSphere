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
    category: {
      type: String,
      enum: ['Research', 'Frontend', 'Backend', 'Documentation', 'Testing', 'Data Analysis', 'Presentation', 'Other'],
      default: 'Research',
    },
    status: {
      type: String,
      enum: ['Completed', 'In Progress', 'Pending Verification'],
      default: 'Completed',
    },
    milestone: {
      type: String,
      default: 'General Progress',
    },
    proofLink: {
      type: String,
      default: '',
    },
    logDate: {
      type: Date,
      default: Date.now,
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
