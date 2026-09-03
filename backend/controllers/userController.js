import User from '../models/userModel.js';
import StudentProfile from '../models/StudentProfileModel.js';

// @desc    Get all users (with a mockup fallback if DB is not connected)
// @route   GET /api/users
// @access  Public
export const getUsers = async (req, res, next) => {
  try {
    let users = [];
    try {
      users = await User.find({}).select('-password');
    } catch (dbErr) {
      console.warn('Database query failed or not connected, using mockup data:', dbErr.message);
      // Fallback mockup users if MongoDB is not running
      users = [
        {
          _id: 'mock_1',
          name: 'Jane Doe',
          email: 'jane@example.com',
          role: 'admin',
          createdAt: new Date().toISOString(),
        },
        {
          _id: 'mock_2',
          name: 'John Smith',
          email: 'john@example.com',
          role: 'user',
          createdAt: new Date().toISOString(),
        }
      ];
    }

    res.status(200).json({
      success: true,
      count: users.length,
      data: users,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new user (with a mockup fallback if DB is not connected)
// @route   POST /api/users
// @access  Public
export const createUser = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      res.status(400);
      throw new Error('Please add all required fields: name, email, password');
    }

    try {
      const userExists = await User.findOne({ email });

      if (userExists) {
        res.status(400);
        throw new Error('User already exists');
      }

      const newUser = await User.create({
        name,
        email,
        password,
        role,
      });

      res.status(201).json({
        success: true,
        data: {
          _id: newUser._id,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
        },
      });
    } catch (dbErr) {
      console.warn('Database not connected, simulating creation:', dbErr.message);
      res.status(201).json({
        success: true,
        message: 'User created (Simulated: Database not connected)',
        data: {
          _id: `mock_${Date.now()}`,
          name,
          email,
          role: role || 'user',
        },
      });
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Lookup student by studentId
// @route   GET /api/users/student-lookup?studentId=...
// @access  Private
export const lookupStudentById = async (req, res, next) => {
  try {
    const { studentId } = req.query;
    if (!studentId) {
      res.status(400);
      throw new Error('Please provide a student ID');
    }

    const studentProfile = await StudentProfile.findOne({ studentId }).populate({
      path: 'userId',
      match: { role: 'student' },
      select: 'fullName email department'
    });
    
    if (!studentProfile || !studentProfile.userId) {
      res.status(404);
      throw new Error('Student not found with that ID');
    }

    const studentData = {
      _id: studentProfile.userId._id,
      fullName: studentProfile.userId.fullName,
      email: studentProfile.userId.email,
      department: studentProfile.userId.department,
      studentId: studentProfile.studentId
    };

    res.status(200).json({
      success: true,
      data: studentData
    });
  } catch (error) {
    next(error);
  }
};
