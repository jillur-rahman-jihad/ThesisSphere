import mongoose from 'mongoose';

const thesisGroupSchema = new mongoose.Schema(
  {
    // ================= EXISTING FIELDS =================

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

    // Persistent and user-modifiable thesis milestones
    milestones: [
      {
        title: {
          type: String,
          required: true,
        },
        completed: {
          type: Boolean,
          default: false,
        },
        completedAt: {
          type: Date,
          default: null,
        },
      },
    ],

    // ================= NEW FIELDS =================

    // Active / inactive group
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
    },

    // Information about what each member is working on
    memberDetails: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        },

        role: {
          type: String,
          required: true,
        },

        chapter: {
          type: String,
          required: true,
        },
      },
    ],
     // Join requests from students
    joinRequests: [
      {
        studentId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        },

        status: {
          type: String,
          enum: ['pending', 'accepted', 'rejected'],
          default: 'pending',
        },

        requestedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    // Recent activities of the group
    recentActivity: [
      {
        description: {
          type: String,
          required: true,
        },

        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

const ThesisGroup = mongoose.model('ThesisGroup', thesisGroupSchema);

export default ThesisGroup;