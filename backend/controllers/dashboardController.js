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
      thesisGroup,
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
            .lean()
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
        .limit(3)
        .lean(),
      Message.find({
        $or: [
          { sender: user._id },
          { receiver: user._id },
        ],
      })
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('sender', 'fullName email role')
        .populate('receiver', 'fullName email role')
        .lean(),
      thesisGroupId
        ? ProgressReport.find({ thesisGroupId })
            .sort({ createdAt: -1 })
            .limit(3)
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
            .limit(3)
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

    const upcomingDeadlines = deadlines.slice(0, 3).map((item) => ({
      _id: item._id,
      title: item.title,
      description: item.description,
      dueDate: item.date,
      dueLabel: toShortDate(item.date),
      type: item.type,
    }));

    const upcomingMeetings = meetings.slice(0, 3).map((item) => ({
      _id: item._id,
      title: item.title,
      meetingDate: item.meetingDate,
      meetingLabel: formatDate(item.meetingDate),
      meetingLink: item.meetingLink,
      agenda: item.agenda,
      status: item.status,
    }));

    const latestProgress = progressReports[0] || null;
    const groupProgress = typeof thesisGroup?.progress === 'number' ? thesisGroup.progress : 0;
    const progressPercentage = latestProgress?.progressPercentage ?? groupProgress;

    const summary = {
      progressPercentage,
      unreadNotifications,
      upcomingDeadlinesCount: deadlines.length,
      upcomingMeetingsCount: meetings.length,
      openTasksCount:
        deadlines.length +
        paperReviews.filter((review) => review.status !== 'reviewed').length +
        (latestProgress ? 0 : 1),
      unreadMessagesCount: recentMessages.filter((message) => !message.isRead && String(message.receiver?._id || message.receiver) === String(user._id)).length,
      contributionsCount: contributions.length,
      paperReviewsCount: paperReviews.length,
      communityPostsCount: recentPosts.length,
    };

    res.status(200).json({
      success: true,
      data: {
        user,
        profile,
        thesisGroup,
        thesisTopic: thesisGroup?.topicId || topic,
        summary,
        upcomingDeadlines,
        upcomingMeetings,
        recentMessages,
        recentNotifications,
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