import mongoose from 'mongoose';

const studentProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    studentId: {
      type: String,
      default: '',
    },
    semester: {
      type: String,
      default: '',
    },
    cgpa: {
      type: Number,
      default: 0,
    },
    thesisGroupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ThesisGroup',
      default: null,
    },
    supervisorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    researchInterests: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

const StudentProfile = mongoose.model('StudentProfile', studentProfileSchema);

export default StudentProfile;
