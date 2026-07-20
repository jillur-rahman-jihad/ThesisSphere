import SupervisorProfile from '../models/SupervisorProfile.js';
import User from '../models/userModel.js';

// @desc    Get all supervisors
// @route   GET /api/supervisors
// @access  Private (Students mostly)
export const getAllSupervisors = async (req, res, next) => {
  try {
    // Find all supervisor profiles and populate the user details
    const supervisors = await SupervisorProfile.find({})
      .populate('userId', 'fullName email department profilePicture researchInterests skills bio availability')
      .lean();

    // Filter out any where userId might be null (if a user was deleted but profile remained)
    const validSupervisors = supervisors.filter(s => s.userId !== null);

    // Format the response for the frontend
    const formattedSupervisors = validSupervisors.map(sup => ({
      _id: sup.userId._id, // User ID is more useful for messaging/requests
      profileId: sup._id,
      fullName: sup.userId.fullName,
      email: sup.userId.email,
      department: sup.userId.department || '',
      profilePicture: sup.userId.profilePicture,
      designation: sup.designation,
      officeRoom: sup.officeRoom,
      expertise: sup.expertise || [],
      researchInterests: sup.researchInterests || [],
      consultationHours: sup.consultationHours,
      consultationMode: sup.consultationMode,
      website: sup.website,
      publications: sup.publications || [],
      maxStudents: sup.maxStudents,
      currentStudents: sup.currentStudents,
    }));

    res.status(200).json({
      success: true,
      count: formattedSupervisors.length,
      data: formattedSupervisors,
    });
  } catch (error) {
    next(error);
  }
};
