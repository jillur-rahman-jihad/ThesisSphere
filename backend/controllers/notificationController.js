import Notification from '../models/Notification.js';

// @desc    Get all notifications for logged in user
// @route   GET /api/notifications
// @access  Private
const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.json(notifications);
  } catch (error) {
    res.status(500);
    throw new Error('Server error when fetching notifications');
  }
};

// @desc    Mark a notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
const markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      res.status(404);
      throw new Error('Notification not found');
    }

    if (notification.userId.toString() !== req.user._id.toString()) {
      res.status(401);
      throw new Error('Not authorized to update this notification');
    }

    notification.isRead = true;
    const updatedNotification = await notification.save();

    res.json(updatedNotification);
  } catch (error) {
    res.status(500);
    throw new Error(error.message || 'Server error when marking notification as read');
  }
};

// @desc    Mark all notifications as read
// @route   PUT /api/notifications/read-all
// @access  Private
const markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { userId: req.user._id, isRead: false },
      { $set: { isRead: true } }
    );
    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    res.status(500);
    throw new Error('Server error when marking all notifications as read');
  }
};

// @desc    Delete a notification
// @route   DELETE /api/notifications/:id
// @access  Private
const deleteNotification = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      res.status(404);
      throw new Error('Notification not found');
    }

    if (notification.userId.toString() !== req.user._id.toString()) {
      res.status(401);
      throw new Error('Not authorized to delete this notification');
    }

    await Notification.deleteOne({ _id: req.params.id });
    res.json({ message: 'Notification removed' });
  } catch (error) {
    res.status(500);
    throw new Error('Server error when deleting notification');
  }
};

export { getNotifications, markAsRead, markAllAsRead, deleteNotification };
