import User from '../models/userModel.js';
import SupervisorProfile from '../models/SupervisorProfile.js';

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
