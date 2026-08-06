import ThesisGroup from '../models/ThesisGroup.js';
import Meeting from '../models/Meeting.js';
import Deadline from '../models/Deadline.js';

// @desc    Get all calendar events (meetings and deadlines) for the logged in user
// @route   GET /api/calendar
// @access  Private
export const getCalendarEvents = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const isStudent = req.user.role === 'student';

    let groupIds = [];
    let meetings = [];
    let supervisedGroups = [];

    if (isStudent) {
      // Find all groups the student is a member of
      const groups = await ThesisGroup.find({ members: userId });
      groupIds = groups.map(g => g._id);

      // Meetings where student is participant
      meetings = await Meeting.find({ participants: userId })
        .populate('supervisorId', 'fullName')
        .populate('thesisGroupId', 'groupName');
    } else {
      // Find all groups the faculty supervises
      const groups = await ThesisGroup.find({ supervisorId: userId });
      groupIds = groups.map(g => g._id);
      supervisedGroups = groups; // Save to return for the "Add Deadline" dropdown

      // Meetings where faculty is supervisor
      meetings = await Meeting.find({ supervisorId: userId })
        .populate('thesisGroupId', 'groupName')
        .populate('participants', 'fullName');
    }

    // Deadlines tied to the user's groups
    const deadlines = await Deadline.find({ thesisGroupId: { $in: groupIds } })
      .populate('thesisGroupId', 'groupName');

    // Format events for the frontend calendar
    const formattedMeetings = meetings.map(m => ({
      _id: m._id,
      title: m.title,
      date: m.meetingDate,
      type: 'meeting',
      description: m.agenda || 'No agenda provided',
      groupName: m.thesisGroupId ? m.thesisGroupId.groupName : 'General',
      status: m.status
    }));

    const formattedDeadlines = deadlines.map(d => ({
      _id: d._id,
      title: d.title,
      date: d.date,
      type: 'deadline', // frontend can color code this
      deadlineType: d.type, // 'proposal', 'progress', etc.
      description: d.description,
      groupName: d.thesisGroupId ? d.thesisGroupId.groupName : 'Unknown Group'
    }));

    // Combine and sort by date
    const allEvents = [...formattedMeetings, ...formattedDeadlines].sort((a, b) => new Date(a.date) - new Date(b.date));

    res.status(200).json({
      success: true,
      data: {
        events: allEvents,
        supervisedGroups: supervisedGroups.map(g => ({ _id: g._id, groupName: g.groupName })) // Sent only for faculty to populate select dropdown
      }
    });

  } catch (error) {
    console.error('Error fetching calendar events:', error);
    next(new Error('Failed to fetch calendar events'));
  }
};

// @desc    Create a new deadline
// @route   POST /api/calendar/deadline
// @access  Private (Faculty only)
export const createDeadline = async (req, res, next) => {
  try {
    if (req.user.role !== 'faculty') {
      res.status(403);
      throw new Error('Only faculty can create deadlines');
    }

    const { title, description, date, type, thesisGroupId } = req.body;

    if (!title || !date || !type || !thesisGroupId) {
      res.status(400);
      throw new Error('Please provide all required fields');
    }

    // Verify the faculty actually supervises this group
    const group = await ThesisGroup.findById(thesisGroupId);
    if (!group || group.supervisorId.toString() !== req.user._id.toString()) {
      res.status(403);
      throw new Error('Not authorized to set deadline for this group');
    }

    const deadline = await Deadline.create({
      title,
      description,
      date,
      type,
      thesisGroupId
    });

    res.status(201).json({
      success: true,
      data: deadline
    });
  } catch (error) {
    console.error('Error creating deadline:', error);
    next(error);
  }
};
