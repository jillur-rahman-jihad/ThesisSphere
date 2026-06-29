import jwt from 'jsonwebtoken';
import User from '../models/userModel.js';
import StudentProfile from '../models/StudentProfile.js';
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
