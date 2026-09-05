import mongoose from "mongoose";

const paperReviewSchema = new mongoose.Schema(
  {
    // ============================================================
    // PAPER INFORMATION
    // ============================================================

    title: {
      type: String,
      required: [true, "Paper title is required"],
      trim: true,
    },

    // ============================================================
    // THESIS GROUP
    // ============================================================

    thesisGroupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ThesisGroup",
      required: [true, "Thesis group is required"],
    },

    // ============================================================
    // SUBMITTED BY
    // ============================================================

    submittedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Submitting student is required"],
    },

    // ============================================================
    // DATES
    // ============================================================

    submittedDate: {
      type: Date,
      default: null,
    },

    deadline: {
      type: Date,
      required: [true, "Deadline is required"],
    },

    // ============================================================
    // STATUS
    // ============================================================

    status: {
      type: String,
      enum: [
        "draft",
        "under review",
        "revision required",
        "accepted",
      ],
      default: "draft",
    },

    // ============================================================
    // FACULTY FEEDBACK
    // ============================================================

    feedback: {
      type: String,
      default: "",
      trim: true,
    },

    // ============================================================
    // REVIEW INFORMATION
    // ============================================================

    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    reviewedAt: {
      type: Date,
      default: null,
    },

    // ============================================================
    // PAPER PDF
    // Stored directly inside MongoDB as Binary/Buffer
    // ============================================================

    paperFile: {
      data: {
        type: Buffer,
        default: null,
      },

      contentType: {
        type: String,
        default: "application/pdf",
      },

      fileName: {
        type: String,
        default: "",
      },

      size: {
        type: Number,
        default: 0,
      },
    },
  },
  {
    timestamps: true,
  }
);

// ============================================================
// INDEXES
// ============================================================

paperReviewSchema.index({
  thesisGroupId: 1,
});

paperReviewSchema.index({
  submittedBy: 1,
});

paperReviewSchema.index({
  status: 1,
});

paperReviewSchema.index({
  thesisGroupId: 1,
  status: 1,
});

// ============================================================
// MODEL
// ============================================================

const PaperReview = mongoose.model(
  "PaperReview",
  paperReviewSchema
);

export default PaperReview;