import React, { useEffect, useRef } from 'react';
import { VideoOff, User } from 'lucide-react';

/**
 * Reusable video player component.
 * Renders a <video> element for a given MediaStream with overlay labels.
 *
 * @param {MediaStream} stream - The media stream to display
 * @param {boolean} muted - Whether to mute the video (use for local video to prevent echo)
 * @param {string} label - Display name label
 * @param {boolean} isLocal - Whether this is the local user's video
 * @param {boolean} isCameraOff - Whether the camera is disabled
 * @param {boolean} isMuted - Whether the microphone is muted
 * @param {string} className - Additional CSS classes
 */
const VideoPlayer = ({
  stream,
  muted = false,
  label = '',
  isLocal = false,
  isCameraOff = false,
  isMuted = false,
  className = '',
}) => {
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  const getInitials = (name) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const showPlaceholder = !stream || isCameraOff;

  return (
    <div
      className={`relative rounded-2xl overflow-hidden bg-slate-800 ${className}`}
      style={{ aspectRatio: isLocal ? undefined : '16/9' }}
    >
      {/* Video Element */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={muted}
        className={`w-full h-full object-cover ${showPlaceholder ? 'hidden' : 'block'}`}
        style={isLocal ? { transform: 'scaleX(-1)' } : undefined}
      />

      {/* Camera Off Placeholder */}
      {showPlaceholder && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-800">
          <div className="flex flex-col items-center gap-3">
            <div className="w-20 h-20 rounded-full bg-slate-700 flex items-center justify-center">
              {label ? (
                <span className="text-2xl font-bold text-slate-300">
                  {getInitials(label)}
                </span>
              ) : (
                <User className="w-10 h-10 text-slate-400" />
              )}
            </div>
            {isCameraOff && (
              <div className="flex items-center gap-1.5 text-slate-400 text-sm">
                <VideoOff className="w-4 h-4" />
                <span>Camera off</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Name Label */}
      {label && (
        <div className="absolute bottom-3 left-3 flex items-center gap-2">
          <span className="bg-black/60 backdrop-blur-sm text-white text-sm font-medium px-3 py-1.5 rounded-lg">
            {label}
            {isLocal && ' (You)'}
          </span>
          {isMuted && (
            <span className="bg-red-500/80 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-md">
              Muted
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default VideoPlayer;
