import mongoose from 'mongoose';

const paperReviewSchema = new mongoose.Schema(
  {
    thesisGroupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ThesisGroup',
      required: true,
    },
    paperTitle: {
      type: String,
      required: [true, 'Please add a paper title'],
    },
    paperFile: {
      type: String,
      default: '',
    },
    reviewer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    comments: {
      type: String,
      default: '',
    },
    score: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['submitted', 'reviewed', 'revision'],
      default: 'submitted',
    },
    reviewedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const PaperReview = mongoose.model('PaperReview', paperReviewSchema);

export default PaperReview;
