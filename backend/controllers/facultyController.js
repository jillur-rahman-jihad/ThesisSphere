import User from '../models/userModel.js';
import SupervisorProfile from '../models/SupervisorProfile.js';
import ThesisGroup from '../models/ThesisGroup.js';
import SupervisionRequest from '../models/SupervisionRequest.js';
import Notification from '../models/Notification.js';
import StudentProfile from '../models/StudentProfileModel.js';

// @desc    Update faculty profile
// @route   PUT /api/faculty/profile
// @access  Private
export const updateFacultyProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }

    user.fullName = req.body.fullName ?? user.fullName;
    user.department = req.body.department ?? user.department;
    user.university = req.body.university ?? user.university;
    user.researchInterests = req.body.researchInterests ?? user.researchInterests;
    user.skills = req.body.skills ?? user.skills;
    user.bio = req.body.bio ?? user.bio;
    user.profilePicture = req.body.profilePicture ?? user.profilePicture;

    await user.save();

    let supervisorProfile = await SupervisorProfile.findOne({ userId: user._id });

    if (!supervisorProfile) {
      supervisorProfile = new SupervisorProfile({ userId: user._id });
    }

    supervisorProfile.designation = req.body.designation ?? supervisorProfile.designation;
    supervisorProfile.officeRoom = req.body.officeRoom ?? supervisorProfile.officeRoom;
    supervisorProfile.expertise = req.body.expertise ?? supervisorProfile.expertise;
    supervisorProfile.researchInterests = req.body.researchInterests ?? supervisorProfile.researchInterests;
    supervisorProfile.consultationHours = req.body.consultationHours ?? supervisorProfile.consultationHours;
    supervisorProfile.consultationMode = req.body.consultationMode ?? supervisorProfile.consultationMode;
    supervisorProfile.website = req.body.website ?? supervisorProfile.website;
    supervisorProfile.publications = req.body.publications ?? supervisorProfile.publications;
    supervisorProfile.maxStudents = req.body.maxStudents ?? supervisorProfile.maxStudents;
    supervisorProfile.currentStudents = req.body.currentStudents ?? supervisorProfile.currentStudents;

    await supervisorProfile.save();

    res.status(200).json({
      success: true,
      message: 'Faculty profile updated successfully',
      data: {
        user,
        supervisorProfile,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get faculty profile by ID
// @route   GET /api/faculty/profile/:id
// @access  Private
export const getFacultyProfileById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }

    let supervisorProfile = await SupervisorProfile.findOne({ userId: user._id });

    if (!supervisorProfile) {
      // Return basic data if profile doesn't exist yet
      supervisorProfile = { userId: user._id };
    }

    res.status(200).json({
      success: true,
      data: {
        ...user.toObject(),
        profile: supervisorProfile,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add student to supervisor
// @route   POST /api/faculty/profile/:id/add-student
// @access  Private (Student only)
export const addStudentToSupervisor = async (req, res, next) => {
  try {
    if (req.user.role !== 'student') {
      res.status(403);
      throw new Error('Only students can add a supervisor');
    }

    const facultyId = req.params.id;
    
    // Check if faculty exists and has a profile
    const faculty = await User.findById(facultyId);
    if (!faculty || faculty.role !== 'faculty') {
      res.status(404);
      throw new Error('Faculty not found');
    }

    const supervisorProfile = await SupervisorProfile.findOne({ userId: facultyId });
    if (!supervisorProfile) {
      res.status(400);
      throw new Error('Faculty has not set up their supervisor profile');
    }

    // Check capacity
    if (supervisorProfile.maxStudents === 0 || supervisorProfile.currentStudents >= supervisorProfile.maxStudents) {
      res.status(400);
      throw new Error('Supervisor has reached maximum student capacity or is not accepting students');
    }

    // 1. Validate incoming data
    const { applicationType, groupMembers } = req.body;
    const type = applicationType === 'group' ? 'group' : 'solo';
    const members = type === 'group' && Array.isArray(groupMembers) ? [...new Set([...groupMembers, req.user._id.toString()])] : [req.user._id.toString()];

    // 2. Check if student(s) already in a group with this supervisor
    const existingGroup = await ThesisGroup.findOne({ 
      members: { $in: members },
      supervisorId: facultyId
    });

    if (existingGroup) {
      res.status(400);
      throw new Error('One or more students are already supervised by this faculty member');
    }

    // 3. Check for existing pending requests
    const existingRequest = await SupervisionRequest.findOne({
      studentId: req.user._id,
      supervisorId: facultyId,
      status: 'pending'
    });

    if (existingRequest) {
      res.status(400);
      throw new Error('You already have a pending supervision request for this faculty member');
    }

    // 4. Create the SupervisionRequest
    const newRequest = new SupervisionRequest({
      studentId: req.user._id,
      supervisorId: facultyId,
      status: 'pending',
      applicationType: type,
      groupMembers: type === 'group' ? members : []
    });

    await newRequest.save();

    // 5. Create a Notification for the Faculty
    const notification = new Notification({
      userId: facultyId,
      title: 'New Supervision Request',
      message: `${req.user.fullName} has applied for supervision ${type === 'group' ? 'as a group' : 'solo'}.`,
      type: 'supervision_request',
      actionId: newRequest._id,
      actionType: 'supervision_request',
      actionStatus: 'pending'
    });
    
    await notification.save();
    
    if (req.app.get('io')) {
      req.app.get('io').to(facultyId.toString()).emit('new-notification', notification);
    }

    res.status(201).json({
      success: true,
      message: 'Supervision request sent successfully to the faculty member',
      data: newRequest
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Accept a supervision request
// @route   POST /api/faculty/profile/:id/accept-request
// @access  Private (Faculty only)
export const acceptSupervisionRequest = async (req, res, next) => {
  try {
    const facultyId = req.params.id;
    const { requestId, notificationId } = req.body;

    if (req.user._id.toString() !== facultyId) {
      res.status(403);
      throw new Error('Unauthorized');
    }

    const request = await SupervisionRequest.findById(requestId).populate('studentId');
    if (!request || request.status !== 'pending') {
      res.status(404);
      throw new Error('Request not found or already processed');
    }

    const supervisorProfile = await SupervisorProfile.findOne({ userId: facultyId });
    if (supervisorProfile.maxStudents === 0 || supervisorProfile.currentStudents >= supervisorProfile.maxStudents) {
      res.status(400);
      throw new Error('You have reached your maximum student capacity');
    }

    // Accept request
    request.status = 'accepted';
    await request.save();

    // Create ThesisGroup
    const members = request.applicationType === 'group' ? request.groupMembers : [request.studentId._id];
    const newGroup = new ThesisGroup({
      groupName: `${request.studentId.fullName}'s Group`,
      leaderId: request.studentId._id,
      members: members,
      supervisorId: facultyId
    });
    await newGroup.save();

    // Update StudentProfiles to link the group
    await StudentProfile.updateMany(
      { userId: { $in: members } },
      { $set: { thesisGroupId: newGroup._id } }
    );

    // Increment currentStudents
    supervisorProfile.currentStudents += 1;
    await supervisorProfile.save();

    // Update Notification status if provided
    if (notificationId) {
      await Notification.findByIdAndUpdate(notificationId, { actionStatus: 'accepted' });
    } else {
      await Notification.updateMany({ actionId: request._id }, { actionStatus: 'accepted' });
    }

    // Notify students
    for (const memberId of members) {
      const notif = new Notification({
        userId: memberId,
        title: 'Supervision Request Accepted',
        message: `Your supervision request to ${req.user.fullName} has been accepted.`,
        type: 'supervision_accepted'
      });
      await notif.save();
      if (req.app.get('io')) {
        req.app.get('io').to(memberId.toString()).emit('new-notification', notif);
      }
    }

    res.status(200).json({ success: true, message: 'Request accepted' });
  } catch (error) {
    next(error);
  }
};

// @desc    Reject a supervision request
// @route   POST /api/faculty/profile/:id/reject-request
// @access  Private (Faculty only)
export const rejectSupervisionRequest = async (req, res, next) => {
  try {
    const facultyId = req.params.id;
    const { requestId, notificationId } = req.body;

    if (req.user._id.toString() !== facultyId) {
      res.status(403);
      throw new Error('Unauthorized');
    }

    const request = await SupervisionRequest.findById(requestId).populate('studentId');
    if (!request || request.status !== 'pending') {
      res.status(404);
      throw new Error('Request not found or already processed');
    }

    request.status = 'rejected';
    await request.save();

    if (notificationId) {
      await Notification.findByIdAndUpdate(notificationId, { actionStatus: 'rejected' });
    } else {
      await Notification.updateMany({ actionId: request._id }, { actionStatus: 'rejected' });
    }

    const members = request.applicationType === 'group' ? request.groupMembers : [request.studentId._id];
    for (const memberId of members) {
      const notif = new Notification({
        userId: memberId,
        title: 'Supervision Request Declined',
        message: `Your supervision request to ${req.user.fullName} was declined.`,
        type: 'supervision_rejected'
      });
      await notif.save();
      if (req.app.get('io')) {
        req.app.get('io').to(memberId.toString()).emit('new-notification', notif);
      }
    }

    res.status(200).json({ success: true, message: 'Request rejected' });
  } catch (error) {
    next(error);
  }
};

// @desc    Get supervision request details
// @route   GET /api/faculty/supervision-request/:requestId
// @access  Private (Faculty only)
export const getSupervisionRequestDetails = async (req, res, next) => {
  try {
    const { requestId } = req.params;

    const request = await SupervisionRequest.findById(requestId)
      .populate({
        path: 'studentId',
        select: 'fullName email department profilePicture studentId'
      })
      .populate({
        path: 'groupMembers',
        select: 'fullName email department profilePicture studentId'
      });

    if (!request) {
      res.status(404);
      throw new Error('Supervision request not found');
    }

    res.status(200).json({
      success: true,
      data: request
    });
  } catch (error) {
    next(error);
  }
};
