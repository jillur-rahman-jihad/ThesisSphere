import Meeting from '../models/Meeting.js';
import ThesisGroup from '../models/ThesisGroup.js';
import StudentProfile from '../models/StudentProfileModel.js';
import Notification from '../models/Notification.js';

// @desc    Get all meetings for the logged-in user
// @route   GET /api/meetings
// @access  Private
export const getMeetings = async (req, res, next) => {
  try {
    let meetings = [];

    if (req.user.role === 'student') {
      const studentProfile = await StudentProfile.findOne({ userId: req.user._id });
      
      if (studentProfile && studentProfile.thesisGroupId) {
        meetings = await Meeting.find({ thesisGroupId: studentProfile.thesisGroupId })
          .populate('supervisorId', 'fullName email department')
          .populate('participants', 'fullName email')
          .sort({ meetingDate: 1 });
      }
    } else if (req.user.role === 'faculty') {
      meetings = await Meeting.find({ supervisorId: req.user._id })
        .populate('thesisGroupId', 'groupName')
        .populate('participants', 'fullName email')
        .sort({ meetingDate: 1 });
    }

    res.status(200).json({
      success: true,
      count: meetings.length,
      data: meetings,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get thesis groups associated with the user
// @route   GET /api/meetings/groups
// @access  Private
export const getGroups = async (req, res, next) => {
  try {
    let groups = [];

    if (req.user.role === 'student') {
      const studentProfile = await StudentProfile.findOne({ userId: req.user._id });
      if (studentProfile && studentProfile.thesisGroupId) {
        const group = await ThesisGroup.findById(studentProfile.thesisGroupId)
          .populate('supervisorId', 'fullName email department')
          .populate('members', 'fullName email');
        if (group) {
          groups = [group];
        }
      }
    } else if (req.user.role === 'faculty') {
      groups = await ThesisGroup.find({ supervisorId: req.user._id })
        .populate('members', 'fullName email');
    }

    res.status(200).json({
      success: true,
      count: groups.length,
      data: groups,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new meeting
// @route   POST /api/meetings
// @access  Private
export const createMeeting = async (req, res, next) => {
  try {
    const { title, meetingDate, meetingLink, agenda, thesisGroupId } = req.body;

    if (!title || !meetingDate) {
      res.status(400);
      throw new Error('Please provide a meeting title and date');
    }

    let targetGroupId = thesisGroupId;
    let targetSupervisorId;
    let targetParticipants = [];

    if (req.user.role === 'student') {
      const studentProfile = await StudentProfile.findOne({ userId: req.user._id });
      if (!studentProfile || !studentProfile.thesisGroupId) {
        res.status(400);
        throw new Error('You must be assigned to a thesis group to schedule a meeting');
      }
      
      targetGroupId = studentProfile.thesisGroupId;
      targetSupervisorId = studentProfile.supervisorId;
      
      if (!targetSupervisorId) {
        res.status(400);
        throw new Error('You must have a supervisor assigned to schedule a meeting');
      }

      const group = await ThesisGroup.findById(targetGroupId);
      if (group) {
        targetParticipants = group.members;
      }
    } else if (req.user.role === 'faculty') {
      if (!targetGroupId) {
        res.status(400);
        throw new Error('Please select a thesis group');
      }

      const group = await ThesisGroup.findById(targetGroupId);
      if (!group) {
        res.status(404);
        throw new Error('Selected thesis group not found');
      }

      if (group.supervisorId.toString() !== req.user._id.toString()) {
        res.status(403);
        throw new Error('You can only schedule meetings for groups you supervise');
      }

      targetSupervisorId = req.user._id;
      targetParticipants = group.members;
    } else {
      res.status(403);
      throw new Error('Not authorized to schedule meetings');
    }

    const meeting = await Meeting.create({
      title,
      thesisGroupId: targetGroupId,
      supervisorId: targetSupervisorId,
      participants: targetParticipants,
      meetingDate,
      meetingLink: meetingLink || '',
      agenda: agenda || '',
      status: 'scheduled',
    });

    // Populate the meeting for response
    const populatedMeeting = await Meeting.findById(meeting._id)
      .populate('supervisorId', 'fullName email department')
      .populate('participants', 'fullName email');

    // Create notifications for participants
    const dateString = new Date(meetingDate).toLocaleString();
    const scheduledBy = req.user.fullName;

    for (const participantId of targetParticipants) {
      if (participantId.toString() !== req.user._id.toString()) {
        await Notification.create({
          userId: participantId,
          title: 'New Meeting Scheduled',
          message: `A meeting "${title}" has been scheduled by ${scheduledBy} for ${dateString}.`,
          type: 'meeting',
        });
      }
    }

    // Notify supervisor if scheduled by student
    if (req.user.role === 'student' && targetSupervisorId) {
      await Notification.create({
        userId: targetSupervisorId,
        title: 'New Meeting Scheduled by Student',
        message: `A meeting "${title}" has been scheduled by student ${scheduledBy} for ${dateString}.`,
        type: 'meeting',
      });
    }

    res.status(201).json({
      success: true,
      message: 'Meeting scheduled successfully',
      data: populatedMeeting,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a meeting
// @route   PUT /api/meetings/:id
// @access  Private
export const updateMeeting = async (req, res, next) => {
  try {
    const { title, meetingDate, meetingLink, agenda, status } = req.body;
    let meeting = await Meeting.findById(req.params.id);

    if (!meeting) {
      res.status(404);
      throw new Error('Meeting not found');
    }

    // Check authorization: User must be either the supervisor or a participant of the meeting
    const isSupervisor = meeting.supervisorId.toString() === req.user._id.toString();
    const isParticipant = meeting.participants.some(
      (pId) => pId.toString() === req.user._id.toString()
    );

    if (!isSupervisor && !isParticipant) {
      res.status(403);
      throw new Error('Not authorized to update this meeting');
    }

    // Perform updates
    if (title) meeting.title = title;
    if (meetingDate) meeting.meetingDate = meetingDate;
    if (meetingLink !== undefined) meeting.meetingLink = meetingLink;
    if (agenda !== undefined) meeting.agenda = agenda;
    if (status) {
      if (!['scheduled', 'completed', 'cancelled'].includes(status)) {
        res.status(400);
        throw new Error('Invalid status type');
      }
      meeting.status = status;
    }

    await meeting.save();

    const updatedMeeting = await Meeting.findById(meeting._id)
      .populate('supervisorId', 'fullName email department')
      .populate('participants', 'fullName email');

    // Create notifications for changes
    const changerName = req.user.fullName;
    const dateString = new Date(updatedMeeting.meetingDate).toLocaleString();

    const notifyUsers = [...updatedMeeting.participants];
    if (updatedMeeting.supervisorId && !notifyUsers.some(u => u._id.toString() === updatedMeeting.supervisorId._id.toString())) {
      notifyUsers.push(updatedMeeting.supervisorId);
    }

    for (const userObj of notifyUsers) {
      const userId = userObj._id || userObj;
      if (userId.toString() !== req.user._id.toString()) {
        let notifTitle = 'Meeting Details Updated';
        let notifMsg = `The meeting "${updatedMeeting.title}" has been updated by ${changerName}. New time: ${dateString}.`;

        if (status && status === 'cancelled') {
          notifTitle = 'Meeting Cancelled';
          notifMsg = `The meeting "${updatedMeeting.title}" scheduled for ${dateString} has been CANCELLED by ${changerName}.`;
        } else if (status && status === 'completed') {
          notifTitle = 'Meeting Marked as Completed';
          notifMsg = `The meeting "${updatedMeeting.title}" has been marked as completed by ${changerName}.`;
        }

        await Notification.create({
          userId,
          title: notifTitle,
          message: notifMsg,
          type: 'meeting',
        });
      }
    }

    res.status(200).json({
      success: true,
      message: 'Meeting updated successfully',
      data: updatedMeeting,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Cancel/Delete a meeting
// @route   DELETE /api/meetings/:id
// @access  Private
export const deleteMeeting = async (req, res, next) => {
  try {
    const meeting = await Meeting.findById(req.params.id);

    if (!meeting) {
      res.status(404);
      throw new Error('Meeting not found');
    }

    const isSupervisor = meeting.supervisorId.toString() === req.user._id.toString();
    const isParticipant = meeting.participants.some(
      (pId) => pId.toString() === req.user._id.toString()
    );

    if (!isSupervisor && !isParticipant) {
      res.status(403);
      throw new Error('Not authorized to cancel this meeting');
    }

    // Store details for notifications before deleting
    const title = meeting.title;
    const dateString = new Date(meeting.meetingDate).toLocaleString();
    const participants = [...meeting.participants];
    const supervisorId = meeting.supervisorId;
    const changerName = req.user.fullName;

    await Meeting.findByIdAndDelete(req.params.id);

    // Notify participants and supervisor
    const notifyUsers = [...participants];
    if (supervisorId && !notifyUsers.some(uid => uid.toString() === supervisorId.toString())) {
      notifyUsers.push(supervisorId);
    }

    for (const userId of notifyUsers) {
      if (userId.toString() !== req.user._id.toString()) {
        await Notification.create({
          userId,
          title: 'Meeting Cancelled',
          message: `The meeting "${title}" which was scheduled for ${dateString} has been deleted/cancelled by ${changerName}.`,
          type: 'meeting',
        });
      }
    }

    res.status(200).json({
      success: true,
      message: 'Meeting cancelled and deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
