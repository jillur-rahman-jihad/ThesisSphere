import User from '../models/userModel.js';
import SupervisorProfile from '../models/SupervisorProfile.js';
import ThesisGroup from '../models/ThesisGroup.js';
import Meeting from '../models/Meeting.js';
import PaperReview from '../models/PaperReview.js';
import ProgressReport from '../models/ProgressReport.js';
import SupervisionRequest from '../models/SupervisionRequest.js';
import Notification from '../models/Notification.js';
import StudentProfile from '../models/StudentProfileModel.js';

const getMonthName = (monthIndex) => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return months[monthIndex];
};

// @desc    Get faculty dashboard data
// @route   GET /api/dashboard/faculty
// @access  Private (Faculty only)
export const getFacultyDashboard = async (req, res, next) => {
  try {
    // 1. Security Check
    if (req.user?.role !== 'faculty') {
      res.status(403);
      throw new Error('Only faculty members can access this dashboard');
    }

    const facultyId = req.user._id;

    // 2. Fetch the User and their SupervisorProfile
    const user = await User.findById(facultyId).select('-password');
    if (!user) {
      res.status(404);
      throw new Error('Faculty user not found');
    }

    let profile = await SupervisorProfile.findOne({ userId: facultyId });
    if (!profile) {
      profile = await SupervisorProfile.create({ userId: facultyId, maxStudents: 5, currentStudents: 0 });
    }

    // 3. Concurrent Data Fetching using Promise.all for performance
    const [
      thesisGroups,
      allMeetings,
      allReviews,
      pendingRequests
    ] = await Promise.all([
      // Fetch thesis groups supervised by this faculty, populating members and topics
      ThesisGroup.find({ supervisorId: facultyId })
        .populate('members', 'fullName email department profilePicture')
        .populate('topicId', 'title description category')
        .lean(),
      
      // Fetch all meetings for workload chart and upcoming count
      Meeting.find({ supervisorId: facultyId }).lean(),
      
      // Fetch all paper reviews for workload chart and pending count
      PaperReview.find({ reviewedBy: facultyId }).lean(),

      // Fetch pending supervision requests and populate student details
      SupervisionRequest.find({ supervisorId: facultyId, status: 'pending' })
        .populate('studentId', 'fullName email department')
        .sort({ createdAt: -1 })
        .lean()
    ]);

    // 4. Batch fetch progress reports to eliminate N+1 query loop
    const groupIds = thesisGroups.map((g) => g._id);
    const allReports = groupIds.length > 0
      ? await ProgressReport.find({ thesisGroupId: { $in: groupIds } })
          .sort({ createdAt: -1 })
          .lean()
      : [];

    const latestReportByGroup = new Map();
    for (const report of allReports) {
      const gId = report.thesisGroupId.toString();
      if (!latestReportByGroup.has(gId)) {
        latestReportByGroup.set(gId, report);
      }
    }

    // --- 4a. Process Student Progress Overview ---
    const activeStudents = [];
    for (const group of thesisGroups) {
      const latestReport = latestReportByGroup.get(group._id.toString());
      const progressPercentage = latestReport?.progressPercentage ?? group.progress ?? 0;
      const thesisTitle = group.topicId?.title || group.groupName || 'Thesis Project';

      (group.members || []).forEach((member) => {
        activeStudents.push({
          _id: member._id,
          fullName: member.fullName,
          email: member.email,
          department: member.department || user.department,
          profilePicture: member.profilePicture,
          groupId: group._id,
          groupName: group.groupName,
          thesisTitle,
          progressPercentage,
          status: progressPercentage >= 75 ? 'On Track' : (progressPercentage >= 40 ? 'Slightly Behind' : 'Needs Attention')
        });
      });
    }

    // Synchronize supervisor profile currentStudents count with real database count
    if (profile.currentStudents !== activeStudents.length) {
      profile.currentStudents = activeStudents.length;
      await profile.save();
    }

    // --- 4b. Process Top Cards Metrics ---
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    let meetingsThisMonth = 0;
    let upcomingMeetingsCount = 0;
    allMeetings.forEach((m) => {
      const mDate = new Date(m.meetingDate);
      if (mDate.getMonth() === currentMonth && mDate.getFullYear() === currentYear) {
        meetingsThisMonth++;
      }
      if (m.status === 'scheduled' && mDate > new Date()) {
        upcomingMeetingsCount++;
      }
    });

    const pendingReviewsCount = allReviews.filter((r) => r.status !== 'reviewed').length;

    // --- 4c. Process Monthly Workload Chart (Last 6 Months) ---
    const workloadChart = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const targetMonth = d.getMonth();
      const targetYear = d.getFullYear();

      const monthMeetings = allMeetings.filter((m) => {
        const mDate = new Date(m.meetingDate);
        return mDate.getMonth() === targetMonth && mDate.getFullYear() === targetYear;
      }).length;

      const monthReviews = allReviews.filter((r) => {
        const rDate = new Date(r.createdAt);
        return rDate.getMonth() === targetMonth && rDate.getFullYear() === targetYear;
      }).length;

      workloadChart.push({
        month: getMonthName(targetMonth),
        meetings: monthMeetings,
        reviews: monthReviews
      });
    }

    // 5. Format and Send Response
    res.status(200).json({
      success: true,
      data: {
        user,
        profile,
        summary: {
          activeStudentsCount: activeStudents.length,
          maxStudents: profile.maxStudents || 5,
          meetingsThisMonth,
          upcomingMeetingsCount,
          pendingReviewsCount,
          pendingRequestsCount: pendingRequests.length
        },
        studentProgress: activeStudents,
        workloadChart,
        pendingRequests: pendingRequests.map((req) => ({
          _id: req._id,
          studentId: req.studentId?._id,
          studentName: req.studentId?.fullName || 'Student',
          studentEmail: req.studentId?.email || '',
          studentDepartment: req.studentId?.department || 'Department not specified',
          topicTitle: req.topicTitle || 'Undecided Topic',
          compatibilityScore: req.compatibilityScore || 0,
          status: req.status,
          createdAt: req.createdAt
        }))
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update supervision request status (Accept or Decline)
// @route   PUT /api/dashboard/faculty/supervision-requests/:id
// @access  Private (Faculty only)
export const updateSupervisionRequestStatus = async (req, res, next) => {
  try {
    if (req.user?.role !== 'faculty') {
      res.status(403);
      throw new Error('Only faculty members can manage supervision requests');
    }

    const { status } = req.body;
    if (!['accepted', 'declined'].includes(status)) {
      res.status(400);
      throw new Error('Invalid status. Must be "accepted" or "declined"');
    }

    const request = await SupervisionRequest.findById(req.params.id)
      .populate('studentId', 'fullName email department');

    if (!request) {
      res.status(404);
      throw new Error('Supervision request not found');
    }

    if (request.supervisorId.toString() !== req.user._id.toString()) {
      res.status(403);
      throw new Error('Not authorized to update this request');
    }

    const supervisorProfile = await SupervisorProfile.findOne({ userId: req.user._id });

    if (status === 'accepted') {
      // Check capacity
      if (supervisorProfile && supervisorProfile.maxStudents > 0) {
        const activeGroups = await ThesisGroup.find({ supervisorId: req.user._id });
        const totalSupervisedStudents = activeGroups.reduce((acc, g) => acc + (g.members?.length || 0), 0);
        if (totalSupervisedStudents >= supervisorProfile.maxStudents) {
          res.status(400);
          throw new Error(`Cannot accept request: You have reached your maximum supervision capacity of ${supervisorProfile.maxStudents} students.`);
        }
      }

      // Check if student is already in a group with this supervisor
      let group = await ThesisGroup.findOne({
        members: request.studentId._id,
        supervisorId: req.user._id
      });

      if (!group) {
        // Look for student's current group or create one
        group = await ThesisGroup.findOne({ members: request.studentId._id });
        if (group) {
          group.supervisorId = req.user._id;
          await group.save();
        } else {
          group = await ThesisGroup.create({
            groupName: `${request.studentId.fullName}'s Group`,
            leaderId: request.studentId._id,
            members: [request.studentId._id],
            supervisorId: req.user._id,
            milestones: [
              { title: 'Topic selected', completed: Boolean(request.topicTitle) },
              { title: 'Supervisor assigned', completed: true, completedAt: new Date() },
              { title: 'Proposal submitted', completed: false },
              { title: 'Literature review draft', completed: false },
              { title: 'Methodology chapter', completed: false },
              { title: 'Final thesis defense', completed: false },
            ]
          });
        }
      }

      // Update student profile with supervisor and group
      await StudentProfile.findOneAndUpdate(
        { userId: request.studentId._id },
        { supervisorId: req.user._id, thesisGroupId: group._id },
        { upsert: true }
      );

      // Notify student
      await Notification.create({
        userId: request.studentId._id,
        title: 'Supervision Request Accepted!',
        message: `${req.user.fullName} has accepted your supervision request for "${request.topicTitle || 'your thesis'}".`,
        type: 'supervision'
      });
    } else {
      // Notify student of declined request
      await Notification.create({
        userId: request.studentId._id,
        title: 'Supervision Request Update',
        message: `${req.user.fullName} was unable to accept your supervision request at this time.`,
        type: 'supervision'
      });
    }

    request.status = status;
    await request.save();

    // Recalculate currentStudents count
    if (supervisorProfile) {
      const activeGroups = await ThesisGroup.find({ supervisorId: req.user._id });
      supervisorProfile.currentStudents = activeGroups.reduce((acc, g) => acc + (g.members?.length || 0), 0);
      await supervisorProfile.save();
    }

    res.status(200).json({
      success: true,
      message: `Supervision request ${status} successfully`,
      data: request
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update supervisor student capacity
// @route   PUT /api/dashboard/faculty/capacity
// @access  Private (Faculty only)
export const updateFacultyCapacity = async (req, res, next) => {
  try {
    if (req.user?.role !== 'faculty') {
      res.status(403);
      throw new Error('Only faculty can update capacity');
    }

    const { maxStudents } = req.body;
    const capacityNum = Number(maxStudents);

    if (Number.isNaN(capacityNum) || capacityNum < 0) {
      res.status(400);
      throw new Error('Please enter a valid non-negative number for maximum capacity');
    }

    let profile = await SupervisorProfile.findOne({ userId: req.user._id });
    if (!profile) {
      profile = new SupervisorProfile({ userId: req.user._id });
    }

    profile.maxStudents = capacityNum;
    await profile.save();

    res.status(200).json({
      success: true,
      message: 'Supervision capacity updated successfully',
      data: {
        maxStudents: profile.maxStudents,
        currentStudents: profile.currentStudents
      }
    });
  } catch (error) {
    next(error);
  }
};
