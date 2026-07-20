import ThesisTopic from '../models/ThesisTopic.js';

// @desc    Get thesis topics
// @route   GET /api/thesis-browse
// @access  Private
export const getThesisTopics = async (req, res, next) => {
  try {
    const { mine, status } = req.query;
    const filter = {};

    if (status) {
      filter.status = status;
    }

    if (mine === 'true') {
      if (req.user?.role !== 'faculty') {
        res.status(403);
        throw new Error('Only faculty members can view their own topics');
      }

      filter.supervisorId = req.user._id;
    }

    const topics = await ThesisTopic.find(filter)
      .populate('supervisorId', 'fullName department university')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: topics.length,
      data: topics,
    });
  } catch (error) {
    next(error);
  }
};
