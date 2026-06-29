import mongoose from 'mongoose';

const thesisGroupSchema = new mongoose.Schema(
  {
    groupName: {
      type: String,
      required: [true, 'Please add a group name'],
    },
    leaderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    supervisorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    topicId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ThesisTopic',
      default: null,
    },
    progress: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

const ThesisGroup = mongoose.model('ThesisGroup', thesisGroupSchema);

export default ThesisGroup;
