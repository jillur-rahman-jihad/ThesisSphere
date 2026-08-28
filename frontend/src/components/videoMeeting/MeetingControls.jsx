import React from 'react';
import { Mic, MicOff, Video, VideoOff, PhoneOff } from 'lucide-react';

/**
 * Meeting control bar with mute, camera, and leave buttons.
 * Styled to match ThesisSphere's amber/slate design system.
 *
 * @param {boolean} isMuted - Current mute state
 * @param {boolean} isCameraOff - Current camera state
 * @param {function} onToggleMute - Handler to toggle mute
 * @param {function} onToggleCamera - Handler to toggle camera
 * @param {function} onLeave - Handler to leave the meeting
 */
const MeetingControls = ({
  isMuted,
  isCameraOff,
  onToggleMute,
  onToggleCamera,
  onLeave,
}) => {
  return (
    <div className="flex items-center justify-center gap-4 py-4 px-6">
      {/* Mute/Unmute Button */}
      <button
        onClick={onToggleMute}
        className={`group relative w-14 h-14 rounded-full flex items-center justify-center transition-all duration-200 shadow-lg ${
          isMuted
            ? 'bg-red-500 hover:bg-red-600 text-white shadow-red-500/30'
            : 'bg-slate-700 hover:bg-slate-600 text-white shadow-slate-700/30'
        }`}
        title={isMuted ? 'Unmute microphone' : 'Mute microphone'}
      >
        {isMuted ? (
          <MicOff className="w-5 h-5" />
        ) : (
          <Mic className="w-5 h-5" />
        )}
        <span className="absolute -bottom-7 left-1/2 -translate-x-1/2 text-xs text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
          {isMuted ? 'Unmute' : 'Mute'}
        </span>
      </button>

      {/* Camera On/Off Button */}
      <button
        onClick={onToggleCamera}
        className={`group relative w-14 h-14 rounded-full flex items-center justify-center transition-all duration-200 shadow-lg ${
          isCameraOff
            ? 'bg-red-500 hover:bg-red-600 text-white shadow-red-500/30'
            : 'bg-slate-700 hover:bg-slate-600 text-white shadow-slate-700/30'
        }`}
        title={isCameraOff ? 'Turn camera on' : 'Turn camera off'}
      >
        {isCameraOff ? (
          <VideoOff className="w-5 h-5" />
        ) : (
          <Video className="w-5 h-5" />
        )}
        <span className="absolute -bottom-7 left-1/2 -translate-x-1/2 text-xs text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
          {isCameraOff ? 'Start Video' : 'Stop Video'}
        </span>
      </button>

      {/* Leave Meeting Button */}
      <button
        onClick={onLeave}
        className="group relative w-16 h-14 rounded-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center transition-all duration-200 shadow-lg shadow-red-600/30 hover:shadow-red-700/40"
        title="Leave meeting"
      >
        <PhoneOff className="w-5 h-5" />
        <span className="absolute -bottom-7 left-1/2 -translate-x-1/2 text-xs text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
          Leave
        </span>
      </button>
    </div>
  );
};

export default MeetingControls;
