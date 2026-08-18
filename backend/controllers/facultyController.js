import User from '../models/userModel.js';
import SupervisorProfile from '../models/SupervisorProfile.js';
import ThesisGroup from '../models/ThesisGroup.js';

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
    if (supervisorProfile.maxStudents > 0 && supervisorProfile.currentStudents >= supervisorProfile.maxStudents) {
      res.status(400);
      throw new Error('Supervisor has reached maximum student capacity');
    }

    // Check if student is already in a group with this supervisor
    const existingGroup = await ThesisGroup.findOne({ 
      members: req.user._id,
      supervisorId: facultyId
    });

    if (existingGroup) {
      res.status(400);
      throw new Error('You are already supervised by this faculty member');
    }

    // Auto-create a Solo group for this student
    const newGroup = new ThesisGroup({
      groupName: `${req.user.fullName}'s Group`,
      leaderId: req.user._id,
      members: [req.user._id],
      supervisorId: facultyId
    });

    await newGroup.save();

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
