import mongoose from 'mongoose';

const progressReportSchema = new mongoose.Schema(
  {
    thesisGroupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ThesisGroup',
      required: true,
    },
    submittedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    weekNo: {
      type: Number,
      required: [true, 'Please specify the week number'],
    },
    summary: {
      type: String,
      default: '',
    },
    progressPercentage: {
      type: Number,
      default: 0,
    },
    generatedPdf: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

const ProgressReport = mongoose.model('ProgressReport', progressReportSchema);

export default ProgressReport;
