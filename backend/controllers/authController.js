import jwt from 'jsonwebtoken';
import User from '../models/userModel.js';
import StudentProfile from '../models/StudentProfileModel.js';
import SupervisorProfile from '../models/SupervisorProfile.js';

// Generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'fallback_secret_key', {
    expiresIn: '30d',
  });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
export const registerUser = async (req, res, next) => {
  try {
    const { fullName, email, password, role, department, university, studentId, semester, designation } = req.body;

    // Validate required fields
    if (!fullName || !email || !password || !role) {
      res.status(400);
      throw new Error('Please provide fullName, email, password, and role');
    }

    // Validate role
    if (!['student', 'faculty'].includes(role)) {
      res.status(400);
      throw new Error('Role must be either "student" or "faculty"');
    }

    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      res.status(400);
      throw new Error('A user with this email already exists');
    }

    // Create the user
    const user = await User.create({
      fullName,
      email,
      password,
      role,
      department: department || '',
      university: university || '',
    });

    // Create role-specific profile
    if (role === 'student') {
      await StudentProfile.create({
        userId: user._id,
        studentId: studentId || '',
        semester: semester || '',
      });
    } else if (role === 'faculty') {
      await SupervisorProfile.create({
        userId: user._id,
        designation: designation || '',
      });
    }

    // Return user data with token
    res.status(201).json({
      success: true,
      data: {
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        department: user.department,
        university: user.university,
        token: generateToken(user._id),
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Login user & get token
// @route   POST /api/auth/login
// @access  Public
export const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400);
      throw new Error('Please provide email and password');
    }

    // Find user and include password for comparison
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      res.status(401);
      throw new Error('Invalid email or password');
    }

    // Check password
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      res.status(401);
      throw new Error('Invalid email or password');
    }

    res.status(200).json({
      success: true,
      data: {
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        department: user.department,
        university: user.university,
        token: generateToken(user._id),
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/profile
// @access  Private
export const getUserProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }

    // Fetch role-specific profile
    let profile = null;
    if (user.role === 'student') {
      profile = await StudentProfile.findOne({ userId: user._id });
    } else if (user.role === 'faculty') {
      profile = await SupervisorProfile.findOne({ userId: user._id });
    }

    res.status(200).json({
      success: true,
      data: {
        ...user.toObject(),
        profile,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update current user profile
// @route   PUT /api/auth/profile
// @access  Private
export const updateUserProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }

    // ---------- Update User Collection ----------
    user.fullName = req.body.fullName ?? user.fullName;
    user.department = req.body.department ?? user.department;
    user.university = req.body.university ?? user.university;
    user.researchInterests =
      req.body.researchInterests ?? user.researchInterests;
    user.skills = req.body.skills ?? user.skills;
    user.bio = req.body.bio ?? user.bio;
    user.profilePicture =
      req.body.profilePicture ?? user.profilePicture;

    await user.save();

    // ---------- Update Student Profile ----------
    const studentProfile = await StudentProfile.findOne({
      userId: req.user._id,
    });

    if (studentProfile) {
      studentProfile.studentId =
        req.body.studentId ?? studentProfile.studentId;

      studentProfile.semester =
        req.body.semester ?? studentProfile.semester;

      studentProfile.program =
        req.body.program ?? studentProfile.program;

      studentProfile.cgpa =
        req.body.cgpa ?? studentProfile.cgpa;

      studentProfile.publications =
        req.body.publications ?? studentProfile.publications;

      studentProfile.thesisTitle =
        req.body.thesisTitle ?? studentProfile.thesisTitle;

      studentProfile.supervisorId =
        req.body.supervisorId ?? studentProfile.supervisorId;

      await studentProfile.save();
    }

    let supervisorProfile = null;
    if (user.role === 'faculty') {
      supervisorProfile = await SupervisorProfile.findOne({ userId: user._id });
      if (!supervisorProfile) {
        supervisorProfile = new SupervisorProfile({ userId: user._id });
      }

      supervisorProfile.designation =
        req.body.designation ?? supervisorProfile.designation;
      supervisorProfile.officeRoom =
        req.body.officeRoom ?? supervisorProfile.officeRoom;
      supervisorProfile.expertise =
        req.body.expertise ?? supervisorProfile.expertise;
      supervisorProfile.researchInterests =
        req.body.researchInterests ?? supervisorProfile.researchInterests;
      supervisorProfile.consultationHours =
        req.body.consultationHours ?? supervisorProfile.consultationHours;
      supervisorProfile.consultationMode =
        req.body.consultationMode ?? supervisorProfile.consultationMode;
      supervisorProfile.publications =
        req.body.publications ?? supervisorProfile.publications;
      supervisorProfile.maxStudents =
        req.body.maxStudents ?? supervisorProfile.maxStudents;
      supervisorProfile.currentStudents =
        req.body.currentStudents ?? supervisorProfile.currentStudents;

      await supervisorProfile.save();
    }

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user,
        studentProfile,
        supervisorProfile,
      },
    });
  } catch (error) {
    next(error);
  }
};