import mongoose from 'mongoose';

const citationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    sourceInput: {
      type: String,
      default: '',
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
    sourceUrl: {
      type: String,
      default: '',
    },
    citationType: {
      type: String,
      enum: ['APA', 'IEEE', 'MLA', 'BibTeX'],
      default: 'APA',
    },
    generatedCitation: {
      type: String,
      default: '',
    },
    formats: {
      apa: {
        type: String,
        default: '',
      },
      mla: {
        type: String,
        default: '',
      },
      bibtex: {
        type: String,
        default: '',
      },
    },
  },
  {
    timestamps: true,
  }
);

const Citation = mongoose.model('Citation', citationSchema);

export default Citation;
