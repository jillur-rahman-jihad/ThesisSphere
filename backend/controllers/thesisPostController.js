import ThesisTopic from '../models/ThesisTopic.js';

const normalizeKeywords = (keywords) => {
  if (Array.isArray(keywords)) {
    return keywords
      .map((keyword) => keyword.trim())
      .filter(Boolean);
  }

  if (typeof keywords === 'string') {
    return keywords
      .split(',')
      .map((keyword) => keyword.trim())
      .filter(Boolean);
  }

  return [];
};

// @desc    Create a thesis topic
// @route   POST /api/thesis-post
// @access  Private (faculty only)
export const createThesisTopic = async (req, res, next) => {
  try {
    if (req.user?.role !== 'faculty') {
      res.status(403);
      throw new Error('Only faculty members can post thesis topics');
    }

    const { title, description, category, keywords } = req.body;

    if (!title || !title.trim()) {
      res.status(400);
      throw new Error('Please provide a thesis topic title');
    }

    const topic = await ThesisTopic.create({
      title: title.trim(),
      description: description?.trim() || '',
      category: category?.trim() || '',
      keywords: normalizeKeywords(keywords),
      supervisorId: req.user._id,
      status: 'available',
    });

    const populatedTopic = await topic.populate('supervisorId', 'fullName department university');

    res.status(201).json({
      success: true,
      message: 'Thesis topic posted successfully',
      data: populatedTopic,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a thesis topic
// @route   PUT /api/thesis-post/:id
// @access  Private (faculty only, must be owner)
export const updateThesisTopic = async (req, res, next) => {
  try {
    if (req.user?.role !== 'faculty') {
      res.status(403);
      throw new Error('Only faculty members can update thesis topics');
    }

    const topic = await ThesisTopic.findById(req.params.id);

    if (!topic) {
      res.status(404);
      throw new Error('Thesis topic not found');
    }

    if (topic.supervisorId.toString() !== req.user._id.toString()) {
      res.status(403);
      throw new Error('You are not authorized to update this topic');
    }

    const { title, description, category, keywords, status } = req.body;

    topic.title = title?.trim() || topic.title;
    topic.description = description?.trim() || topic.description;
    topic.category = category?.trim() || topic.category;
    topic.status = status || topic.status;
    
    if (keywords) {
      topic.keywords = normalizeKeywords(keywords);
    }

    const updatedTopic = await topic.save();
    const populatedTopic = await updatedTopic.populate('supervisorId', 'fullName department university');

    res.status(200).json({
      success: true,
      message: 'Thesis topic updated successfully',
      data: populatedTopic,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a thesis topic
// @route   DELETE /api/thesis-post/:id
// @access  Private (faculty only, must be owner)
export const deleteThesisTopic = async (req, res, next) => {
  try {
    if (req.user?.role !== 'faculty') {
      res.status(403);
      throw new Error('Only faculty members can delete thesis topics');
    }

    const topic = await ThesisTopic.findById(req.params.id);

    if (!topic) {
      res.status(404);
      throw new Error('Thesis topic not found');
    }

    if (topic.supervisorId.toString() !== req.user._id.toString()) {
      res.status(403);
      throw new Error('You are not authorized to delete this topic');
    }

    await topic.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Thesis topic deleted successfully',
      data: {},
    });
  } catch (error) {
    next(error);
  }
};

