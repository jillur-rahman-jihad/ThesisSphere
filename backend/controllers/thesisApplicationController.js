import ThesisApplication from '../models/ThesisApplication.js';
import ThesisTopic from '../models/ThesisTopic.js';

// @desc    Apply for a thesis topic
// @route   POST /api/thesis-applications
// @access  Private (Student only)
export const applyForTopic = async (req, res, next) => {
  try {
    if (req.user?.role !== 'student') {
      res.status(403);
      throw new Error('Only students can apply for thesis topics');
    }

    const { topicId, message } = req.body;

    const topic = await ThesisTopic.findById(topicId);
    if (!topic) {
      res.status(404);
      throw new Error('Thesis topic not found');
    }

    if (topic.status !== 'available') {
      res.status(400);
      throw new Error('This topic is no longer available');
    }

    // Check if already applied
    const existingApplication = await ThesisApplication.findOne({
      topicId,
      studentId: req.user._id,
    });

    if (existingApplication) {
      res.status(400);
      throw new Error('You have already applied for this topic');
    }

    const application = await ThesisApplication.create({
      topicId,
      studentId: req.user._id,
      message: message?.trim() || '',
    });

    res.status(201).json({
      success: true,
      message: 'Application submitted successfully',
      data: application,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get logged in student's applications
// @route   GET /api/thesis-applications/my-applications
// @access  Private (Student only)
export const getMyApplications = async (req, res, next) => {
  try {
    if (req.user?.role !== 'student') {
      res.status(403);
      throw new Error('Only students can view their applications');
    }

    const applications = await ThesisApplication.find({ studentId: req.user._id })
      .populate({
        path: 'topicId',
        populate: {
          path: 'supervisorId',
          select: 'fullName department'
        }
      })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: applications.length,
      data: applications,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all applications for a specific topic
// @route   GET /api/thesis-applications/topic/:topicId
// @access  Private (Faculty only, must be owner of topic)
export const getTopicApplications = async (req, res, next) => {
  try {
    if (req.user?.role !== 'faculty') {
      res.status(403);
      throw new Error('Only faculty can view applications');
    }

    const topicId = req.params.topicId;
    const topic = await ThesisTopic.findById(topicId);

    if (!topic) {
      res.status(404);
      throw new Error('Topic not found');
    }

    if (topic.supervisorId.toString() !== req.user._id.toString()) {
      res.status(403);
      throw new Error('You can only view applications for your own topics');
    }

    const applications = await ThesisApplication.find({ topicId })
      .populate('studentId', 'fullName email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: applications.length,
      data: applications,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Accept or reject an application
// @route   PUT /api/thesis-applications/:id/status
// @access  Private (Faculty only)
export const updateApplicationStatus = async (req, res, next) => {
  try {
    if (req.user?.role !== 'faculty') {
      res.status(403);
      throw new Error('Only faculty can update application status');
    }

    const { status } = req.body;
    if (!['accepted', 'rejected'].includes(status)) {
      res.status(400);
      throw new Error('Invalid status');
    }

    const application = await ThesisApplication.findById(req.params.id);
    if (!application) {
      res.status(404);
      throw new Error('Application not found');
    }

    const topic = await ThesisTopic.findById(application.topicId);
    if (topic.supervisorId.toString() !== req.user._id.toString()) {
      res.status(403);
      throw new Error('You are not authorized to update applications for this topic');
    }

    if (status === 'accepted') {
      // Reject all other pending applications for this topic
      await ThesisApplication.updateMany(
        { topicId: topic._id, _id: { $ne: application._id }, status: 'pending' },
        { $set: { status: 'rejected' } }
      );
      
      // Mark topic as assigned
      topic.status = 'assigned';
      await topic.save();
    }

    application.status = status;
    await application.save();

    res.status(200).json({
      success: true,
      message: `Application ${status} successfully`,
      data: application,
    });
  } catch (error) {
    next(error);
  }
};
