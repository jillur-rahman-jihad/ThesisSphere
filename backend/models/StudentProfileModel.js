import mongoose from "mongoose";

const studentProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    studentId: {
      type: String,
      default: "",
    },

    semester: {
      type: String,
      default: "",
    },
    
    program: {
      type: String,
      default: "",
    },

    cgpa: {
      type: Number,
      default: 0,
    },

    publications: {
      type: Number,
      default: 0,
    },

    thesisTitle: {
      type: String,
      default: "",
    },

    thesisGroupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ThesisGroup",
      default: null,
    },

    supervisorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const StudentProfile = mongoose.model(
  "StudentProfile",
  studentProfileSchema
);

export default StudentProfile;