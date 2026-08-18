/**
 * Automated Report Generator controller
 * Single-file feature: exposes `generateReport` which compiles a progress
 * summary from existing models and returns JSON. Filtered by current user.
 */

import ThesisApplication from '../models/ThesisApplication.js';
import ProgressReport from '../models/ProgressReport.js';
import ThesisTopic from '../models/ThesisTopic.js';
import StudentProfile from '../models/StudentProfileModel.js';
import SupervisorProfile from '../models/SupervisorProfile.js';

/**
 * Assemble user-specific aggregated report data from the database.
 * Returns an object suitable for JSON response or further processing.
 */
async function compileReportData(userId, options = {}) {
  // options: { type, from: Date, to: Date }
  const { type, from, to } = options;

  // base aggregations (filter by user where applicable)
  const [applicationsCount, applicationsByStatus] = await Promise.all([
    ThesisApplication.countDocuments({ studentId: userId }).exec(),
    ThesisApplication.aggregate([
      { $match: { studentId: userId } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]).exec()
  ]);

  const topicsSummary = await ThesisTopic.find({}).select('title').limit(10).lean().exec().catch(() => []);
  
  // Count only this student's profile
  const studentCount = await StudentProfile.countDocuments({ userId }).exec().catch(() => 0);
  const supervisorsCount = await SupervisorProfile.countDocuments().exec().catch(() => 0);

  // build a date filter for progress & meetings (filter by student)
  const progressFilter = { submittedBy: userId };
  if (from || to) progressFilter.createdAt = {};
  if (from) progressFilter.createdAt.$gte = from;
  if (to) progressFilter.createdAt.$lte = to;

  // fetch recent progress for this student
  const recentProgress = await ProgressReport.find(progressFilter).sort({ createdAt: -1 }).limit(50).populate('submittedBy', 'fullName').lean().exec().catch(() => []);

  // fetch groups and topics referenced by recent progress
  const groupIds = Array.from(new Set((recentProgress || []).map(r => String(r.thesisGroupId)).filter(Boolean)));
  let groupMap = {};
  if (groupIds.length) {
    const ThesisGroup = (await import('../models/ThesisGroup.js')).default;
    const groups = await ThesisGroup.find({ _id: { $in: groupIds } }).populate('topicId', 'title').lean().exec().catch(() => []);
    groupMap = groups.reduce((m, g) => { m[String(g._id)] = g; return m; }, {});
  }

  // attach topicTitle to progress items when available
  const annotatedProgress = (recentProgress || []).map(p => {
    const g = groupMap[String(p.thesisGroupId)] || {};
    return {
      ...p,
      submittedByName: p.submittedBy?.fullName || p.submittedBy?.name || null,
      topicTitle: g.topicId?.title || null
    };
  });

  // supervisor activity: meetings, feedback, and action items for user's thesis groups
  let supervisorActivity = { meetings: [], feedback: [], actionItems: [] };
  try {
    const Meeting = (await import('../models/Meeting.js')).default;
    const Recommendation = (await import('../models/Recommendation.js')).default;

    // Get user's thesis group IDs for filtering
    let userGroupIds = [...groupIds];
    if (userGroupIds.length === 0) {
      // If no groups from progress, try to find from ThesisGroup directly
      const ThesisGroup = (await import('../models/ThesisGroup.js')).default;
      const userGroups = await ThesisGroup.find({
        $or: [{ leaderId: userId }, { members: userId }]
      }).select('_id').lean().exec().catch(() => []);
      userGroupIds = userGroups.map(g => g._id);
    }

    // Build date filter for meetings
    const meetFilter = {};
    if (userGroupIds.length > 0) {
      meetFilter.thesisGroupId = { $in: userGroupIds };
    }
    if (from || to) {
      meetFilter.meetingDate = {};
      if (from) meetFilter.meetingDate.$gte = from;
      if (to) meetFilter.meetingDate.$lte = to;
    }

    // Fetch meetings with supervisor details
    const meetings = await Meeting.find(meetFilter)
      .sort({ meetingDate: -1 })
      .limit(50)
      .populate('supervisorId', 'fullName email')
      .lean()
      .exec()
      .catch(() => []);

    // Fetch supervisor feedback from progress reports
    const feedbackFilter = { submittedBy: userId };
    if (from || to) {
      feedbackFilter.createdAt = {};
      if (from) feedbackFilter.createdAt.$gte = from;
      if (to) feedbackFilter.createdAt.$lte = to;
    }

    const progressWithFeedback = await ProgressReport.find(feedbackFilter)
      .select('supervisorFeedback createdAt submittedBy title progressPercentage')
      .populate('submittedBy', 'fullName')
      .lean()
      .exec()
      .catch(() => []);

    // Fetch action items/recommendations
    const recFilter = { studentId: userId };
    if (from || to) {
      recFilter.createdAt = {};
      if (from) recFilter.createdAt.$gte = from;
      if (to) recFilter.createdAt.$lte = to;
    }

    const recommendations = await Recommendation.find(recFilter)
      .sort({ createdAt: -1 })
      .limit(30)
      .populate('supervisorId', 'fullName')
      .lean()
      .exec()
      .catch(() => []);

    // Compile supervisor activity
    supervisorActivity = {
      meetings: meetings.map(m => ({
        date: m.meetingDate,
        topic: m.meetingTopic || 'General Discussion',
        supervisor: m.supervisorId?.fullName || 'Unknown',
        supervisorEmail: m.supervisorId?.email || '',
        notes: m.notes || 'No notes recorded',
        duration: m.duration || 'N/A'
      })),
      feedback: progressWithFeedback
        .filter(p => p.supervisorFeedback)
        .map(p => ({
          date: p.createdAt,
          reportTitle: p.title || 'Progress Report',
          feedback: p.supervisorFeedback,
          progressPercentage: p.progressPercentage
        })),
      actionItems: recommendations.map(r => ({
        title: r.title || 'Action Item',
        description: r.description || '',
        priority: r.priority || 'medium',
        status: r.status || 'pending',
        dueDate: r.dueDate,
        supervisor: r.supervisorId?.fullName || 'Unknown',
        createdDate: r.createdAt
      }))
    };
  } catch (e) {
    console.error('Error fetching supervisor activity:', e);
    supervisorActivity = { meetings: [], feedback: [], actionItems: [] };
  }

  // chapter/topic summaries: aggregate by topic from annotatedProgress
  const chapters = [];
  const chapterMap = {};
  annotatedProgress.forEach(p => {
    const key = p.topicTitle || 'Unknown Topic';
    if (!chapterMap[key]) chapterMap[key] = { title: key, samples: [], latestSummary: '', avgProgress: 0 };
    chapterMap[key].samples.push(p);
    if (!chapterMap[key].latestSummary && p.summary) chapterMap[key].latestSummary = p.summary;
  });
  Object.values(chapterMap).forEach(c => {
    const avg = c.samples.reduce((s, x) => s + (Number(x.progressPercentage) || 0), 0) / Math.max(1, c.samples.length);
    chapters.push({ title: c.title, latestSummary: c.latestSummary || '', avgProgress: Math.round(avg) });
  });

  // final submissions: comprehensive package for user's thesis
  let thesisPackage = {};
  try {
    const User = (await import('../models/userModel.js')).default;
    const ThesisGroup = (await import('../models/ThesisGroup.js')).default;
    const Deadline = (await import('../models/Deadline.js')).default;
    const Citation = (await import('../models/Citation.js')).default;

    // Get current user info
    const user = await User.findById(userId).select('-password').lean().exec();
    
    // Find thesis group where user is a member or leader
    const userGroups = await ThesisGroup.find({
      $or: [{ leaderId: userId }, { members: userId }]
    })
      .populate('leaderId', 'fullName email')
      .populate('members', 'fullName email')
      .populate('supervisorId', 'fullName email')
      .populate('topicId', 'title description')
      .lean()
      .exec();

    if (userGroups.length > 0) {
      const group = userGroups[0]; // Get primary group
      
      // Get deadlines for this group
      const deadlines = await Deadline.find({ thesisGroupId: group._id })
        .sort({ date: 1 })
        .lean()
        .exec();
      
      // Get citations/references for the user
      const citations = await Citation.find({ userId })
        .lean()
        .exec();
      
      // Calculate submission readiness checklist
      const submissionChecklist = {
        abstract: chapters.length > 0 && chapters.some(c => c.latestSummary),
        chapters: chapters.length > 0,
        bibliography: citations.length > 0,
        supervisor_approval: group.supervisorId ? true : false,
        progress_complete: group.progress >= 95,
        all_deadlines_met: true
      };

      // Calculate quality metrics
      const totalCharacters = chapters.reduce((sum, c) => sum + (c.latestSummary?.length || 0), 0);
      const avgChapterLength = chapters.length > 0 ? Math.round(totalCharacters / chapters.length) : 0;

      thesisPackage = {
        studentInfo: {
          name: user?.fullName || 'Unknown',
          email: user?.email || '',
          department: user?.department || '',
          university: user?.university || ''
        },
        groupInfo: {
          groupName: group.groupName,
          leaderId: group.leaderId?.fullName || 'Unknown',
          members: (group.members || []).map(m => m.fullName).join(', ') || 'No members',
          supervisor: group.supervisorId?.fullName || 'Not Assigned'
        },
        thesisTopic: {
          title: group.topicId?.title || 'No Topic',
          description: group.topicId?.description || ''
        },
        chapterBreakdown: chapters.map((ch, idx) => ({
          chapter: idx + 1,
          title: ch.title,
          progress: ch.avgProgress,
          summary: ch.latestSummary,
          wordCount: ch.latestSummary?.length || 0,
          status: ch.avgProgress >= 95 ? 'Completed' : 'In Progress'
        })),
        submissionChecklist,
        references: {
          total: citations.length,
          byType: citations.reduce((acc, c) => {
            acc[c.citationType] = (acc[c.citationType] || 0) + 1;
            return acc;
          }, {})
        },
        qualityMetrics: {
          totalCharacters,
          averageChapterLength: avgChapterLength,
          chaptersComplete: chapters.filter(c => c.avgProgress >= 95).length,
          totalChapters: chapters.length,
          completionRate: chapters.length > 0 ? Math.round((chapters.filter(c => c.avgProgress >= 95).length / chapters.length) * 100) : 0
        },
        deadlines: deadlines
          .filter(d => d.type === 'submission' || d.type === 'defense')
          .map(d => ({
            title: d.title,
            date: d.date,
            type: d.type,
            daysRemaining: Math.ceil((new Date(d.date) - new Date()) / (1000 * 60 * 60 * 24))
          })),
        overallProgress: group.progress || 0,
        readyForSubmission: group.progress >= 95 && submissionChecklist.chapters && submissionChecklist.bibliography
      };
    }
  } catch (e) {
    console.error('Error compiling thesis package:', e);
    thesisPackage = {};
  }

  return {
    meta: {
      generatedAt: new Date(),
      applicationsCount: applicationsCount || 0,
      studentCount,
      supervisorsCount
    },
    applicationsByStatus: (applicationsByStatus || []).reduce((acc, cur) => {
      acc[cur._id || 'unknown'] = cur.count;
      return acc;
    }, {}),
    topics: (topicsSummary || []).map(t => ({ title: t.title || 'Untitled' })),
    recentProgress: annotatedProgress,
    chapters,
    supervisorActivity,
    thesisPackage
  };
}

/**
 * Express handler: GET /api/automated-report
 * Requires authentication via JWT token
 * Responds with user-specific compiled JSON report.
 */
async function generateReport(req, res) {
  try {
    // req.user is set by protect middleware
    const userId = req.user?._id;
    if (!userId) {
      return res.status(401).json({ ok: false, error: 'User not authenticated' });
    }

    const { type, from, to } = req.query || {};
    const opts = {};
    if (type) opts.type = type;
    if (from) opts.from = new Date(from);
    if (to) opts.to = new Date(to);
    
    const data = await compileReportData(userId, opts);
    return res.json({ ok: true, report: data });
  } catch (err) {
    console.error('AutomatedReport error:', err);
    return res.status(500).json({ ok: false, error: 'Failed to generate report' });
  }
}

export { generateReport, compileReportData };

