import User from '../models/userModel.js';
import SupervisorProfile from '../models/SupervisorProfile.js';
import ThesisGroup from '../models/ThesisGroup.js';
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
    const targetId = (!req.params.id || req.params.id === 'me') ? req.user._id : req.params.id;
    const user = await User.findById(targetId).select('-password');

    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }

    let supervisorProfile = await SupervisorProfile.findOne({ userId: user._id });

    if (!supervisorProfile) {
      // Return basic data if profile doesn't exist yet
      supervisorProfile = { userId: user._id, maxStudents: 5, currentStudents: 0 };
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

    const studentProfile = await StudentProfile.findOne({ userId: req.user._id });
    const assignedGroup = studentProfile?.thesisGroupId
      ? await ThesisGroup.findById(studentProfile.thesisGroupId)
      : await ThesisGroup.findOne({ members: req.user._id, supervisorId: { $ne: null } });
    const assignedSupervisorId = studentProfile?.supervisorId || assignedGroup?.supervisorId;

    if (assignedSupervisorId) {
      res.status(400);
      throw new Error('You already have a supervisor assigned');
    }

    // Keep the student profile and thesis group linked to the same supervisor.
    const newGroup = assignedGroup || new ThesisGroup({
      groupName: `${req.user.fullName}'s Group`,
      leaderId: req.user._id,
      members: [req.user._id],
    });
    newGroup.supervisorId = facultyId;

    await newGroup.save();

    const linkedProfile = studentProfile || new StudentProfile({ userId: req.user._id });
    linkedProfile.thesisGroupId = newGroup._id;
    linkedProfile.supervisorId = facultyId;
    await linkedProfile.save();

    // Increment currentStudents
    supervisorProfile.currentStudents += 1;
    await supervisorProfile.save();

    res.status(201).json({
      success: true,
      message: 'Successfully added supervisor and created thesis group',
      data: newGroup
    });
  } catch (error) {
    next(error);
  }
};
