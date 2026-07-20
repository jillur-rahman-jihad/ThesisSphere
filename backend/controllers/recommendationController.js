import SupervisorProfile from '../models/SupervisorProfile.js';
import StudentProfile from '../models/StudentProfileModel.js';
import ThesisTopic from '../models/ThesisTopic.js';
import User from '../models/userModel.js';

// Helper function to calculate Jaccard-like similarity between two arrays of strings
const calculateSimilarity = (arr1, arr2) => {
  if (!arr1 || !arr2 || arr1.length === 0 || arr2.length === 0) return 0;
  
  const set1 = new Set(arr1.map(s => s.toLowerCase().trim()));
  const set2 = new Set(arr2.map(s => s.toLowerCase().trim()));
  
  let intersection = 0;
  for (let item of set1) {
    if (set2.has(item)) {
      intersection++;
    }
  }
  
  // Calculate percentage based on the smaller array or just raw intersection
  // We'll use intersection count for simplicity and sorting
  return intersection;
};

// @desc    Get AI-based recommendations for a student
// @route   GET /api/recommendations
// @access  Private (Student only)
export const getRecommendations = async (req, res, next) => {
  try {
    const studentId = req.user._id;

    if (req.user.role !== 'student') {
      res.status(403);
      throw new Error('Only students can get recommendations');
    }

    // Fetch the student's profile to get their research interests
    const studentProfile = await StudentProfile.findOne({ userId: studentId }).lean();
    
    // If no profile or no interests, we can't recommend well
    let studentInterests = [];
    if (studentProfile && studentProfile.researchInterests) {
      studentInterests = studentProfile.researchInterests;
    } else {
      // Fallback: check user model
      const user = await User.findById(studentId).lean();
      studentInterests = user.researchInterests || [];
    }

    // 1. Recommend Supervisors
    const supervisors = await SupervisorProfile.find({})
      .populate('userId', 'fullName email department profilePicture')
      .lean();

    const rankedSupervisors = supervisors
      .filter(sup => sup.userId !== null)
      .map(sup => {
        const supKeywords = [...(sup.expertise || []), ...(sup.researchInterests || [])];
        const score = calculateSimilarity(studentInterests, supKeywords);
        return {
          ...sup,
          score
        };
      })
      .sort((a, b) => b.score - a.score) // Sort descending by score
      .slice(0, 3); // Top 3

    // Format supervisors for frontend
    const recommendedSupervisors = rankedSupervisors.map(sup => ({
      _id: sup.userId._id,
      fullName: sup.userId.fullName,
      department: sup.userId.department,
      profilePicture: sup.userId.profilePicture,
      designation: sup.designation,
      expertise: sup.expertise,
      score: sup.score,
      matchPercentage: studentInterests.length > 0 ? Math.round((sup.score / studentInterests.length) * 100) : 0
    }));

    // 2. Recommend Topics
    const topics = await ThesisTopic.find({ status: 'available' })
      .populate('supervisorId', 'fullName department')
      .lean();

    const rankedTopics = topics
      .map(topic => {
        const score = calculateSimilarity(studentInterests, topic.keywords || []);
        return {
          ...topic,
          score
        };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);

    const recommendedTopics = rankedTopics.map(topic => ({
      _id: topic._id,
      title: topic.title,
      description: topic.description,
      category: topic.category,
      supervisor: topic.supervisorId ? topic.supervisorId.fullName : 'Unassigned',
      score: topic.score,
      matchPercentage: studentInterests.length > 0 ? Math.round((topic.score / studentInterests.length) * 100) : 0
    }));

    res.status(200).json({
      success: true,
      data: {
        studentInterests,
        recommendedSupervisors,
        recommendedTopics
      }
    });

  } catch (error) {
    next(error);
  }
};
