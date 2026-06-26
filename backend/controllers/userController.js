import User from '../models/userModel.js';

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
