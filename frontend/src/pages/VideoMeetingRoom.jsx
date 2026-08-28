import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Copy,
  Check,
  AlertCircle,
  Loader2,
  Users,
  GraduationCap,
  ArrowLeft,
} from 'lucide-react';
import useWebRTC from '../hooks/useWebRTC';
import VideoPlayer from '../components/videoMeeting/VideoPlayer';
import MeetingControls from '../components/videoMeeting/MeetingControls';
import { getVideoMeeting } from '../services/videoMeetingService';

/**
 * Full-screen video meeting room page.
 * Renders outside DashboardLayout for maximum screen real estate.
 */
const VideoMeetingRoom = () => {
  const { meetingId } = useParams();
  const navigate = useNavigate();

  // Get current user from localStorage (same approach as App.jsx)
  const [currentUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('thesisSphereUser'));
    } catch {
      return null;
    }
  });

  // Meeting validation state
  const [meetingValid, setMeetingValid] = useState(null); // null = loading, true/false
  const [meetingError, setMeetingError] = useState('');
  const [copied, setCopied] = useState(false);

  // Validate user is logged in
  useEffect(() => {
    if (!currentUser) {
      navigate('/', { replace: true });
    }
  }, [currentUser, navigate]);

  // Validate meeting exists
  useEffect(() => {
    const validateMeeting = async () => {
      try {
        await getVideoMeeting(meetingId);
        setMeetingValid(true);
      } catch (err) {
        setMeetingValid(false);
        setMeetingError(err.message || 'Meeting not found');
      }
    };

    if (meetingId && currentUser) {
      validateMeeting();
    }
  }, [meetingId, currentUser]);

  // Initialize WebRTC only after meeting is validated
  const {
    localStream,
    remoteStream,
    isMuted,
    isCameraOff,
    connectionState,
    remoteUser,
    error: webrtcError,
    participantCount,
    toggleMute,
    toggleCamera,
    leaveCall,
  } = useWebRTC(
    meetingValid ? meetingId : null,
    meetingValid ? currentUser : null
  );

  // Handle leave
  const handleLeave = () => {
    leaveCall();
    navigate('/meetings', { replace: true });
  };

  // Copy meeting link
  const copyLink = () => {
    const link = `${window.location.origin}/video-meeting/${meetingId}`;
    navigator.clipboard.writeText(link).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // --- RENDER STATES ---

  // Not authenticated
  if (!currentUser) {
    return null;
  }

  // Meeting validation loading
  if (meetingValid === null) {
    return (
      <div className="h-screen w-screen bg-[#0f1118] flex items-center justify-center font-['Inter',sans-serif]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-amber-500 animate-spin" />
          <p className="text-slate-400 text-lg">Joining meeting...</p>
        </div>
      </div>
    );
  }

  // Meeting not found
  if (meetingValid === false) {
    return (
      <div className="h-screen w-screen bg-[#0f1118] flex items-center justify-center font-['Inter',sans-serif]">
        <div className="flex flex-col items-center gap-6 max-w-md text-center px-6">
          <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-red-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white mb-2">Meeting Not Found</h2>
            <p className="text-slate-400">
              {meetingError || 'The meeting you\'re looking for doesn\'t exist or has ended.'}
            </p>
          </div>
          <button
            onClick={() => navigate('/meetings', { replace: true })}
            className="flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white px-6 py-3 rounded-xl font-semibold transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Meetings
          </button>
        </div>
      </div>
    );
  }

  // WebRTC error (e.g., camera permission denied)
  if (webrtcError && !localStream) {
    return (
      <div className="h-screen w-screen bg-[#0f1118] flex items-center justify-center font-['Inter',sans-serif]">
        <div className="flex flex-col items-center gap-6 max-w-lg text-center px-6">
          <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-red-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white mb-2">Connection Error</h2>
            <p className="text-slate-400">{webrtcError}</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => window.location.reload()}
              className="bg-slate-700 hover:bg-slate-600 text-white px-6 py-3 rounded-xl font-semibold transition-colors"
            >
              Try Again
            </button>
            <button
              onClick={() => navigate('/meetings', { replace: true })}
              className="flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white px-6 py-3 rounded-xl font-semibold transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Meetings
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- MAIN MEETING UI ---
  return (
    <div className="h-screen w-screen bg-[#0f1118] flex flex-col font-['Inter',sans-serif] overflow-hidden">
      {/* Top Bar */}
      <header className="h-14 bg-[#1a1f2e] border-b border-slate-800 flex items-center justify-between px-4 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 bg-amber-600 rounded-lg flex items-center justify-center">
            <GraduationCap className="w-4 h-4 text-white" />
          </div>
          <span className="text-white font-bold text-sm tracking-tight">ThesisSphere</span>
          <span className="text-slate-600 text-sm">|</span>
          <span className="text-slate-400 text-sm font-medium">Video Meeting</span>
        </div>

        <div className="flex items-center gap-3">
          {/* Participant count */}
          <div className="flex items-center gap-1.5 text-slate-400 text-sm">
            <Users className="w-4 h-4" />
            <span>{participantCount}</span>
          </div>

          {/* Meeting ID & Copy */}
          <div className="flex items-center gap-2 bg-slate-800 rounded-lg px-3 py-1.5">
            <span className="text-slate-300 text-sm font-mono">{meetingId}</span>
            <button
              onClick={copyLink}
              className="text-slate-400 hover:text-amber-400 transition-colors"
              title="Copy meeting link"
            >
              {copied ? (
                <Check className="w-4 h-4 text-green-400" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Video Area */}
      <div className="flex-1 flex items-center justify-center p-4 gap-4 min-h-0">
        {remoteStream && remoteUser ? (
          /* Two participants — side by side or grid layout */
          <div className="w-full h-full flex flex-col lg:flex-row items-center justify-center gap-4 max-w-7xl mx-auto">
            {/* Remote Video (Primary) */}
            <div className="relative flex-1 w-full h-full max-h-full flex items-center justify-center">
              <VideoPlayer
                stream={remoteStream}
                label={remoteUser?.fullName || 'Participant'}
                isLocal={false}
                isCameraOff={false}
                className="w-full h-full max-h-[calc(100vh-180px)]"
              />
            </div>

            {/* Local Video (Secondary) */}
            <div className="absolute bottom-28 right-6 z-10 w-48 h-36 lg:w-64 lg:h-48 rounded-2xl overflow-hidden shadow-2xl border-2 border-slate-700/50 hover:border-amber-500/50 transition-colors">
              <VideoPlayer
                stream={localStream}
                muted={true}
                label={currentUser?.fullName || 'You'}
                isLocal={true}
                isCameraOff={isCameraOff}
                isMuted={isMuted}
                className="w-full h-full"
              />
            </div>
          </div>
        ) : (
          /* Solo — waiting for participant */
          <div className="w-full h-full flex flex-col items-center justify-center gap-6 max-w-4xl mx-auto">
            {/* Local Video (full size when alone) */}
            <div className="w-full flex-1 max-h-[calc(100vh-260px)] flex items-center justify-center">
              <VideoPlayer
                stream={localStream}
                muted={true}
                label={currentUser?.fullName || 'You'}
                isLocal={true}
                isCameraOff={isCameraOff}
                isMuted={isMuted}
                className="w-full h-full max-w-4xl"
              />
            </div>

            {/* Waiting Banner */}
            <div className="flex flex-col items-center gap-3 py-2">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
                <p className="text-slate-400 text-sm font-medium">
                  Waiting for other participant to join...
                </p>
              </div>
              <button
                onClick={copyLink}
                className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm px-4 py-2 rounded-lg transition-colors border border-slate-700"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 text-green-400" />
                    Link Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Copy Invite Link
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Inline error toast */}
      {webrtcError && localStream && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 bg-red-500/90 backdrop-blur-sm text-white text-sm px-4 py-2 rounded-xl shadow-lg flex items-center gap-2 max-w-md">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{webrtcError}</span>
        </div>
      )}

      {/* Connection state indicator */}
      {connectionState === 'connecting' && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 bg-amber-500/90 backdrop-blur-sm text-white text-sm px-4 py-2 rounded-xl shadow-lg flex items-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Connecting...</span>
        </div>
      )}

      {/* Control Bar */}
      <div className="flex-shrink-0 bg-[#1a1f2e] border-t border-slate-800">
        <MeetingControls
          isMuted={isMuted}
          isCameraOff={isCameraOff}
          onToggleMute={toggleMute}
          onToggleCamera={toggleCamera}
          onLeave={handleLeave}
        />
      </div>
    </div>
  );
};

export default VideoMeetingRoom;
