import mongoose from 'mongoose';

const recommendedPaperSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    authors: {
      type: [String],
      default: [],
    },
    link: {
      type: String,
      default: '',
    },
  },
  { _id: false }
);

const recommendationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    recommendedSupervisors: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    recommendedTopics: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ThesisTopic',
      },
    ],
    recommendedPapers: {
      type: [recommendedPaperSchema],
      default: [],
    },
    generatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

const Recommendation = mongoose.model('Recommendation', recommendationSchema);

export default Recommendation;
