import mongoose from 'mongoose';

const supervisorProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    designation: {
      type: String,
      default: '',
    },
    officeRoom: {
      type: String,
      default: '',
    },
    expertise: {
      type: [String],
      default: [],
    },
    publications: {
      type: [String],
      default: [],
    },
    maxStudents: {
      type: Number,
      default: 0,
    },
    currentStudents: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

const SupervisorProfile = mongoose.model('SupervisorProfile', supervisorProfileSchema);

export default SupervisorProfile;
