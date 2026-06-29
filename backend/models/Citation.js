import mongoose from 'mongoose';

const citationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    sourceTitle: {
      type: String,
      required: [true, 'Please add a source title'],
    },
    authors: {
      type: [String],
      default: [],
    },
    year: {
      type: Number,
      default: null,
    },
    doi: {
      type: String,
      default: '',
    },
    citationType: {
      type: String,
      enum: ['APA', 'IEEE', 'MLA'],
      required: [true, 'Please specify the citation type'],
    },
    generatedCitation: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

const Citation = mongoose.model('Citation', citationSchema);

export default Citation;
