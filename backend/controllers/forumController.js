import ForumPost from '../models/ForumPost.js';

// @desc    Get all forum posts with search, filtering, & sorting
// @route   GET /api/forum
// @access  Public
export const getForumPosts = async (req, res) => {
  try {
    const { search, category, tag, sort } = req.query;

    let query = {};

    // Category filter
    if (category && category !== 'All') {
      query.category = category;
    }

    // Tag filter
    if (tag) {
      query.tags = { $in: [tag] };
    }

    // Search filter (title or content)
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } },
        { tags: { $regex: search, $options: 'i' } },
      ];
    }

    // Sorting
    let sortOptions = { createdAt: -1 }; // default latest
    if (sort === 'popular') {
      sortOptions = { likes: -1, createdAt: -1 };
    } else if (sort === 'unanswered') {
      query['comments.0'] = { $exists: false };
    }

    const posts = await ForumPost.find(query)
      .populate('author', 'fullName name email role avatar profilePicture profileImage')
      .populate('comments.userId', 'fullName name email role avatar profilePicture profileImage')
      .sort(sortOptions);

    res.status(200).json({
      success: true,
      count: posts.length,
      data: posts,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch forum posts',
      error: error.message,
    });
  }
};

// @desc    Get single forum post by ID & increment view count
// @route   GET /api/forum/:id
// @access  Public
export const getForumPostById = async (req, res) => {
  try {
    const post = await ForumPost.findById(req.params.id)
      .populate('author', 'fullName name email role avatar profilePicture profileImage')
      .populate('comments.userId', 'fullName name email role avatar profilePicture profileImage');

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Forum post not found',
      });
    }

    // Increment view count
    post.views += 1;
    await post.save();

    res.status(200).json({
      success: true,
      data: post,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch forum post',
      error: error.message,
    });
  }
};

// @desc    Create a new forum post
// @route   POST /api/forum
// @access  Private
export const createForumPost = async (req, res) => {
  try {
    const { title, content, category, tags } = req.body;

    if (!title || !content) {
      return res.status(400).json({
        success: false,
        message: 'Title and content are required',
      });
    }

    const formattedTags = Array.isArray(tags)
      ? tags
      : typeof tags === 'string'
      ? tags.split(',').map((t) => t.trim()).filter(Boolean)
      : [];

    const post = await ForumPost.create({
      author: req.user._id,
      title,
      content,
      category: category || 'General Discussion',
      tags: formattedTags,
    });

    const populatedPost = await ForumPost.findById(post._id).populate(
      'author',
      'fullName name email role avatar profilePicture profileImage'
    );

    res.status(201).json({
      success: true,
      message: 'Forum post created successfully',
      data: populatedPost,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create forum post',
      error: error.message,
    });
  }
};

// @desc    Add a comment to a forum post
// @route   POST /api/forum/:id/comments
// @access  Private
export const addComment = async (req, res) => {
  try {
    const { comment } = req.body;

    if (!comment || !comment.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Comment content cannot be empty',
      });
    }

    const post = await ForumPost.findById(req.params.id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Forum post not found',
      });
    }

    post.comments.push({
      userId: req.user._id,
      comment: comment.trim(),
    });

    await post.save();

    const updatedPost = await ForumPost.findById(req.params.id)
      .populate('author', 'fullName name email role avatar profilePicture profileImage')
      .populate('comments.userId', 'fullName name email role avatar profilePicture profileImage');

    res.status(200).json({
      success: true,
      message: 'Comment added successfully',
      data: updatedPost,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to add comment',
      error: error.message,
    });
  }
};

// @desc    Toggle upvote/like on a post
// @route   PUT /api/forum/:id/like
// @access  Private
export const toggleLikePost = async (req, res) => {
  try {
    const post = await ForumPost.findById(req.params.id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Forum post not found',
      });
    }

    const userIdStr = req.user._id.toString();
    const alreadyLikedIndex = post.likes.findIndex(
      (id) => id.toString() === userIdStr
    );

    if (alreadyLikedIndex !== -1) {
      // Unlike
      post.likes.splice(alreadyLikedIndex, 1);
    } else {
      // Like
      post.likes.push(req.user._id);
    }

    await post.save();

    const updatedPost = await ForumPost.findById(req.params.id)
      .populate('author', 'fullName name email role avatar profilePicture profileImage')
      .populate('comments.userId', 'fullName name email role avatar profilePicture profileImage');

    res.status(200).json({
      success: true,
      data: updatedPost,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to toggle like',
      error: error.message,
    });
  }
};

// @desc    Toggle resolution status of a post
// @route   PUT /api/forum/:id/resolve
// @access  Private
export const toggleResolvedStatus = async (req, res) => {
  try {
    const post = await ForumPost.findById(req.params.id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Forum post not found',
      });
    }

    // Only post author or faculty/admin can mark as resolved
    if (
      post.author.toString() !== req.user._id.toString() &&
      req.user.role !== 'faculty' &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to change resolution status of this post',
      });
    }

    post.isResolved = !post.isResolved;
    await post.save();

    const updatedPost = await ForumPost.findById(req.params.id)
      .populate('author', 'fullName name email role avatar profilePicture profileImage')
      .populate('comments.userId', 'fullName name email role avatar profilePicture profileImage');

    res.status(200).json({
      success: true,
      message: `Post marked as ${post.isResolved ? 'Resolved' : 'Unresolved'}`,
      data: updatedPost,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update resolution status',
      error: error.message,
    });
  }
};

// @desc    Delete a forum post
// @route   DELETE /api/forum/:id
// @access  Private
export const deleteForumPost = async (req, res) => {
  try {
    const post = await ForumPost.findById(req.params.id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Forum post not found',
      });
    }

    // Check authorization: post author or faculty/admin
    if (
      post.author.toString() !== req.user._id.toString() &&
      req.user.role !== 'faculty' &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this post',
      });
    }

    await ForumPost.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Forum post deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete forum post',
      error: error.message,
    });
  }
};

// @desc    Delete a comment from a forum post
// @route   DELETE /api/forum/:id/comments/:commentId
// @access  Private
export const deleteComment = async (req, res) => {
  try {
    const post = await ForumPost.findById(req.params.id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Forum post not found',
      });
    }

    const comment = post.comments.id(req.params.commentId);

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found',
      });
    }

    // Check authorization: comment author, post author, or faculty/admin
    if (
      comment.userId.toString() !== req.user._id.toString() &&
      post.author.toString() !== req.user._id.toString() &&
      req.user.role !== 'faculty' &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this comment',
      });
    }

    post.comments.pull({ _id: req.params.commentId });
    await post.save();

    const updatedPost = await ForumPost.findById(req.params.id)
      .populate('author', 'fullName name email role avatar profilePicture profileImage')
      .populate('comments.userId', 'fullName name email role avatar profilePicture profileImage');

    res.status(200).json({
      success: true,
      message: 'Comment deleted successfully',
      data: updatedPost,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete comment',
      error: error.message,
    });
  }
};
