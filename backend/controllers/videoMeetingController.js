import VideoMeeting from '../models/VideoMeeting.js';

// @desc    Create a new video meeting
// @route   POST /api/video-meetings
// @access  Private
export const createVideoMeeting = async (req, res, next) => {
  try {
    const meeting = await VideoMeeting.create({
      createdBy: req.user._id,
      participants: [req.user._id],
      status: 'waiting',
    });

    const populated = await VideoMeeting.findById(meeting._id)
      .populate('createdBy', 'fullName email role')
      .populate('participants', 'fullName email role');

    res.status(201).json({
      success: true,
      data: populated,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get video meeting by meetingId
// @route   GET /api/video-meetings/:meetingId
// @access  Private
export const getVideoMeeting = async (req, res, next) => {
  try {
    const { meetingId } = req.params;

    // Validate meetingId format (8-char hex)
    if (!meetingId || !/^[a-f0-9]{8}$/i.test(meetingId)) {
      res.status(400);
      throw new Error('Invalid meeting ID format');
    }

    const meeting = await VideoMeeting.findOne({ meetingId })
      .populate('createdBy', 'fullName email role')
      .populate('participants', 'fullName email role');

    if (!meeting) {
      res.status(404);
      throw new Error('Meeting not found. It may have ended or the ID is incorrect.');
    }

    res.status(200).json({
      success: true,
      data: meeting,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    End a video meeting
// @route   PUT /api/video-meetings/:meetingId/end
// @access  Private
export const endVideoMeeting = async (req, res, next) => {
  try {
    const { meetingId } = req.params;

    const meeting = await VideoMeeting.findOne({ meetingId });

    if (!meeting) {
      res.status(404);
      throw new Error('Meeting not found');
    }

    meeting.status = 'ended';
    meeting.endedAt = new Date();
    await meeting.save();

    res.status(200).json({
      success: true,
      message: 'Meeting ended',
      data: meeting,
    });
  } catch (error) {
    next(error);
  }
};
