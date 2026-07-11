import User from '../models/userModel.js';
import SupervisorProfile from '../models/SupervisorProfile.js';
import ThesisGroup from '../models/ThesisGroup.js';
import Meeting from '../models/Meeting.js';
import PaperReview from '../models/PaperReview.js';
import ProgressReport from '../models/ProgressReport.js';
import SupervisionRequest from '../models/SupervisionRequest.js';

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

    const profile = await SupervisorProfile.findOne({ userId: facultyId });

    // 3. Concurrent Data Fetching using Promise.all for performance
    const [
      thesisGroups,
      allMeetings,
      allReviews,
      pendingRequests
    ] = await Promise.all([
      // Fetch thesis groups supervised by this faculty and populate members
      ThesisGroup.find({ supervisorId: facultyId })
        .populate('members', 'fullName email department profilePicture')
        .lean(),
      
      // Fetch all meetings for workload chart and upcoming count
      Meeting.find({ supervisorId: facultyId }).lean(),
      
      // Fetch all paper reviews for workload chart and pending count
      PaperReview.find({ reviewer: facultyId }).lean(),

      // Fetch pending supervision requests and populate student details
      SupervisionRequest.find({ supervisorId: facultyId, status: 'pending' })
        .populate('studentId', 'fullName email department')
        .lean()
    ]);

    // --- 4a. Process Student Progress Overview ---
    // Extract all students from thesis groups and find their latest progress
    const activeStudents = [];
    for (const group of thesisGroups) {
      // Get the latest progress report for this group
      const latestReport = await ProgressReport.findOne({ thesisGroupId: group._id })
        .sort({ createdAt: -1 })
        .lean();
      
      const progressPercentage = latestReport?.progressPercentage || group.progress || 0;

      group.members.forEach(member => {
        activeStudents.push({
          _id: member._id,
          fullName: member.fullName,
          department: member.department,
          profilePicture: member.profilePicture,
          thesisTitle: group.groupName, // using groupName as thesisTitle for now
          progressPercentage,
          status: progressPercentage >= 75 ? 'On Track' : (progressPercentage >= 40 ? 'Slightly Behind' : 'Needs Attention')
        });
      });
    }

    // --- 4b. Process Top Cards Metrics ---
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    // Meetings this month & upcoming
    let meetingsThisMonth = 0;
    let upcomingMeetingsCount = 0;
    allMeetings.forEach(m => {
      const mDate = new Date(m.meetingDate);
      if (mDate.getMonth() === currentMonth && mDate.getFullYear() === currentYear) {
        meetingsThisMonth++;
      }
      if (m.status === 'scheduled' && mDate > new Date()) {
        upcomingMeetingsCount++;
      }
    });

    // Pending Reviews
    const pendingReviewsCount = allReviews.filter(r => r.status !== 'reviewed').length;

    // --- 4c. Process Monthly Workload Chart (Last 6 Months) ---
    const workloadChart = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const targetMonth = d.getMonth();
      const targetYear = d.getFullYear();

      const monthMeetings = allMeetings.filter(m => {
        const mDate = new Date(m.meetingDate);
        return mDate.getMonth() === targetMonth && mDate.getFullYear() === targetYear;
      }).length;

      const monthReviews = allReviews.filter(r => {
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
          activeStudentsCount: profile?.currentStudents || activeStudents.length,
          maxStudents: profile?.maxStudents || 5,
          meetingsThisMonth,
          upcomingMeetingsCount,
          pendingReviewsCount,
          pendingRequestsCount: pendingRequests.length
        },
        studentProgress: activeStudents,
        workloadChart,
        pendingRequests: pendingRequests.map(req => ({
          _id: req._id,
          studentName: req.studentId?.fullName,
          studentDepartment: req.studentId?.department,
          topicTitle: req.topicTitle || 'Undecided Topic',
          compatibilityScore: req.compatibilityScore || 0,
          status: req.status
        }))
      }
    });

  } catch (error) {
    next(error);
  }
};
