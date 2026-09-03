import User from '../models/userModel.js';
import StudentProfile from '../models/StudentProfileModel.js';
import ThesisGroup from '../models/ThesisGroup.js';
import ThesisTopic from '../models/ThesisTopic.js';
import Deadline from '../models/Deadline.js';
import Meeting from '../models/Meeting.js';
import Message from '../models/Message.js';
import Notification from '../models/Notification.js';
import ProgressReport from '../models/ProgressReport.js';
import Contribution from '../models/Contribution.js';
import PaperReview from '../models/PaperReview.js';
import ForumPost from '../models/ForumPost.js';
import Recommendation from '../models/Recommendation.js';

const formatDate = (date) => {
  if (!date) return null;
  return new Date(date).toISOString();
};

const toShortDate = (date) => {
  if (!date) return '';
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
};

const DEFAULT_MILESTONES = [
  { title: 'Topic selected', completed: false },
  { title: 'Supervisor assigned', completed: false },
  { title: 'Proposal submitted', completed: false },
  { title: 'Literature review draft', completed: false },
  { title: 'Methodology chapter', completed: false },
  { title: 'Final thesis defense', completed: false },
];

export const getStudentDashboard = async (req, res, next) => {
  try {
    if (req.user?.role !== 'student') {
      res.status(403);
      throw new Error('Only students can access the student dashboard');
    }

    const user = await User.findById(req.user._id).select('-password');
    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }

    const profile = await StudentProfile.findOne({ userId: user._id })
      .populate('supervisorId', 'fullName email role department university')
      .populate('thesisGroupId');

    const populatedGroup = profile?.thesisGroupId && profile.thesisGroupId._id
      ? profile.thesisGroupId
      : null;
    const thesisGroupId = populatedGroup?._id || null;
    const thesisTopicId = populatedGroup?.topicId?._id || populatedGroup?.topicId || null;

    const [
      thesisGroupDoc,
      topic,
      deadlines,
      meetings,
      unreadNotifications,
      recentNotifications,
      recentMessages,
      progressReports,
      contributions,
      paperReviews,
      recentPosts,
      recommendations,
    ] = await Promise.all([
      thesisGroupId
        ? ThesisGroup.findById(thesisGroupId)
            .populate('leaderId', 'fullName email role')
            .populate('members', 'fullName email role')
            .populate('supervisorId', 'fullName email role department university')
            .populate('topicId')
        : Promise.resolve(null),
      thesisTopicId
        ? ThesisTopic.findById(thesisTopicId).lean()
        : Promise.resolve(null),
      thesisGroupId
        ? Deadline.find({ thesisGroupId })
            .sort({ date: 1 })
            .limit(5)
            .lean()
        : Promise.resolve([]),
      thesisGroupId
        ? Meeting.find({ thesisGroupId, status: 'scheduled' })
            .sort({ meetingDate: 1 })
            .limit(5)
            .lean()
        : Promise.resolve([]),
      Notification.countDocuments({ userId: user._id, isRead: false }),
      Notification.find({ userId: user._id })
        .sort({ createdAt: -1 })
        .limit(5)
        .lean(),
      Message.find({
        $or: [
          { sender: user._id },
          { receiver: user._id },
        ],
      })
        .sort({ createdAt: -1 })
        .limit(10)
        .populate('sender', 'fullName email role')
        .populate('receiver', 'fullName email role')
        .lean(),
      thesisGroupId
        ? ProgressReport.find({ thesisGroupId })
            .sort({ createdAt: -1 })
            .limit(5)
            .populate('submittedBy', 'fullName email role')
            .lean()
        : Promise.resolve([]),
      thesisGroupId
        ? Contribution.find({ thesisGroupId, studentId: user._id })
            .sort({ submittedAt: -1 })
            .limit(5)
            .lean()
        : Promise.resolve([]),
      thesisGroupId
        ? PaperReview.find({ thesisGroupId })
            .sort({ createdAt: -1 })
            .limit(5)
            .populate('reviewer', 'fullName email role')
            .lean()
        : Promise.resolve([]),
      ForumPost.find({})
        .sort({ createdAt: -1 })
        .limit(4)
        .populate('author', 'fullName email role')
        .lean(),
      Recommendation.findOne({ userId: user._id })
        .sort({ generatedAt: -1 })
        .populate('recommendedSupervisors', 'fullName email role department university')
        .populate('recommendedTopics')
        .lean(),
    ]);

    // Handle persistent milestones
    let milestones = [];
    if (thesisGroupDoc) {
      if (!thesisGroupDoc.milestones || thesisGroupDoc.milestones.length === 0) {
        // Initialize default milestones in database
        thesisGroupDoc.milestones = [
          { title: 'Topic selected', completed: Boolean(thesisTopicId || topic) },
          { title: 'Supervisor assigned', completed: Boolean(profile?.supervisorId || thesisGroupDoc?.supervisorId) },
          { title: 'Proposal submitted', completed: progressReports.length > 0 },
          { title: 'Literature review draft', completed: false },
          { title: 'Methodology chapter', completed: false },
          { title: 'Final thesis defense', completed: false },
        ];
        await thesisGroupDoc.save();
      }
      milestones = thesisGroupDoc.milestones;
    } else {
      // If student has no group yet, calculate based on current state
      milestones = [
        { title: 'Topic selected', completed: Boolean(topic) },
        { title: 'Supervisor assigned', completed: Boolean(profile?.supervisorId) },
        { title: 'Proposal submitted', completed: false },
        { title: 'Literature review draft', completed: false },
        { title: 'Methodology chapter', completed: false },
        { title: 'Final thesis defense', completed: false },
      ];
    }

    const upcomingDeadlines = deadlines.slice(0, 5).map((item) => ({
      _id: item._id,
      title: item.title,
      description: item.description,
      dueDate: item.date,
      dueLabel: toShortDate(item.date),
      type: item.type,
    }));

    const upcomingMeetings = meetings.map((item) => ({
      _id: item._id,
      title: item.title,
      meetingDate: item.meetingDate,
      meetingLabel: formatDate(item.meetingDate),
      meetingLink: item.meetingLink,
      agenda: item.agenda,
      status: item.status,
    }));

    const latestProgress = progressReports[0] || null;

    // Calculate real progress percentage from milestones if available
    let progressPercentage = 0;
    if (milestones.length > 0) {
      const completedCount = milestones.filter((m) => m.completed).length;
      progressPercentage = Math.round((completedCount / milestones.length) * 100);
    } else if (typeof thesisGroupDoc?.progress === 'number') {
      progressPercentage = thesisGroupDoc.progress;
    }

    // Build rich, unified recent activity stream from actual database events
    const rawActivities = [];

    (recentNotifications || []).forEach((n) => {
      rawActivities.push({
        _id: n._id,
        title: n.title,
        detail: n.message || 'Notification',
        createdAt: n.createdAt,
        type: 'notification',
      });
    });

    (recentMessages || []).forEach((m) => {
      rawActivities.push({
        _id: m._id,
        title: `Message from ${m.sender?.fullName || 'User'}`,
        detail: m.message,
        createdAt: m.createdAt,
        type: 'message',
      });
    });

    (progressReports || []).forEach((r) => {
      rawActivities.push({
        _id: r._id,
        title: `Submitted Progress Report (${r.title || `Week ${r.weekNo}`})`,
        detail: r.summary || `Week ${r.weekNo} report submission`,
        createdAt: r.createdAt,
        type: 'report',
      });
    });

    (contributions || []).forEach((c) => {
      rawActivities.push({
        _id: c._id,
        title: `Contribution: ${c.taskName || c.description || 'Task completed'}`,
        detail: `${c.hoursSpent || 0} hrs spent • ${c.category || 'General'}`,
        createdAt: c.submittedAt || c.createdAt,
        type: 'contribution',
      });
    });

    (paperReviews || []).forEach((pr) => {
      rawActivities.push({
        _id: pr._id,
        title: `Paper Review: ${pr.paperTitle || 'Submitted Draft'}`,
        detail: `Status: ${pr.status} ${pr.comments ? `• "${pr.comments}"` : ''}`,
        createdAt: pr.createdAt,
        type: 'review',
      });
    });

    // Sort combined activities by date descending
    rawActivities.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const recentActivity = rawActivities.slice(0, 8);

    const unreadMessagesCount = recentMessages.filter(
      (message) => !message.isRead && String(message.receiver?._id || message.receiver) === String(user._id)
    ).length;

    const summary = {
      progressPercentage,
      unreadNotifications,
      upcomingDeadlinesCount: deadlines.length,
      upcomingMeetingsCount: meetings.length,
      openTasksCount:
        deadlines.length +
        paperReviews.filter((review) => review.status !== 'reviewed').length +
        (latestProgress ? 0 : 1),
      unreadMessagesCount,
      contributionsCount: contributions.length,
      paperReviewsCount: paperReviews.length,
      communityPostsCount: recentPosts.length,
    };

    res.status(200).json({
      success: true,
      data: {
        user,
        profile,
        thesisGroup: thesisGroupDoc?.toObject() || null,
        thesisTopic: thesisGroupDoc?.topicId || topic,
        milestones,
        summary,
        upcomingDeadlines,
        upcomingMeetings,
        recentActivity,
        recentMessages: recentMessages.slice(0, 4),
        recentNotifications: recentNotifications.slice(0, 4),
        progressReports,
        latestProgress,
        contributions,
        paperReviews,
        recentPosts,
        recommendations: recommendations || null,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update student thesis milestones in database
// @route   PUT /api/dashboard/student/milestones
// @access  Private (Student only)
export const updateStudentMilestones = async (req, res, next) => {
  try {
    if (req.user?.role !== 'student') {
      res.status(403);
      throw new Error('Only students can update their thesis milestones');
    }

    const { milestoneIndex, completed, milestones: updatedMilestones } = req.body;

    const profile = await StudentProfile.findOne({ userId: req.user._id });
    if (!profile?.thesisGroupId) {
      res.status(400);
      throw new Error('You are not currently enrolled in a thesis group to update milestones');
    }

    const group = await ThesisGroup.findById(profile.thesisGroupId);
    if (!group) {
      res.status(404);
      throw new Error('Thesis group not found');
    }

    if (Array.isArray(updatedMilestones)) {
      group.milestones = updatedMilestones.map((m) => ({
        title: m.title,
        completed: Boolean(m.completed),
        completedAt: m.completed ? m.completedAt || new Date() : null,
      }));
    } else if (typeof milestoneIndex === 'number' && group.milestones[milestoneIndex]) {
      group.milestones[milestoneIndex].completed = Boolean(completed);
      group.milestones[milestoneIndex].completedAt = completed ? new Date() : null;
    } else {
      res.status(400);
      throw new Error('Invalid milestone update payload');
    }

    // Recalculate group progress based on completed milestones
    const completedCount = group.milestones.filter((m) => m.completed).length;
    const progress = Math.round((completedCount / group.milestones.length) * 100);
    group.progress = progress;

    await group.save();

    res.status(200).json({
      success: true,
      message: 'Milestones updated successfully in database',
      data: {
        milestones: group.milestones,
        progress: group.progress,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get live unread message and notification counts for badges
// @route   GET /api/dashboard/counts
// @access  Private
export const getDashboardCounts = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const [unreadNotifications, unreadMessages] = await Promise.all([
      Notification.countDocuments({ userId, isRead: false }),
      Message.countDocuments({ receiver: userId, isRead: false }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        unreadNotifications,
        unreadMessages,
      },
    });
  } catch (error) {
    next(error);
  }
};