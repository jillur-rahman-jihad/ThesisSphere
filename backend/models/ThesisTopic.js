import mongoose from 'mongoose';

const thesisTopicSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please add a title'],
    },
    description: {
      type: String,
      default: '',
    },
    category: {
      type: String,
      default: '',
    },
    keywords: {
      type: [String],
      default: [],
    },
    supervisorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    status: {
      type: String,
      enum: ['available', 'assigned', 'completed'],
      default: 'available',
    },
  },
  {
    timestamps: true,
  }
);

const ThesisTopic = mongoose.model('ThesisTopic', thesisTopicSchema);

export default ThesisTopic;
