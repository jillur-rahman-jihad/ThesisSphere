import { useState, useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

/**
 * Custom hook encapsulating all WebRTC + Socket.IO signaling logic.
 *
 * @param {string} meetingId - The meeting room ID
 * @param {object} currentUser - The authenticated user object
 * @returns WebRTC state and control functions
 */
const useWebRTC = (meetingId, currentUser) => {
  // Streams
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);

  // UI states
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [connectionState, setConnectionState] = useState('new'); // new | connecting | connected | disconnected | failed
  const [remoteUser, setRemoteUser] = useState(null);
  const [error, setError] = useState(null);
  const [participantCount, setParticipantCount] = useState(0);

  // Refs to keep current values in callbacks
  const socketRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const localStreamRef = useRef(null);
  const remoteStreamRef = useRef(null);
  const isNegotiatingRef = useRef(false);
  const hasLeftRef = useRef(false);

  /**
   * Create a new RTCPeerConnection with event handlers.
   */
  const createPeerConnection = useCallback((remoteSocketId) => {
    // Clean up any existing peer connection
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
    }

    const pc = new RTCPeerConnection(ICE_SERVERS);
    peerConnectionRef.current = pc;

    // Add local tracks to the connection
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        pc.addTrack(track, localStreamRef.current);
      });
    }

    // Create a new MediaStream for remote tracks
    const newRemoteStream = new MediaStream();
    remoteStreamRef.current = newRemoteStream;
    setRemoteStream(newRemoteStream);

    // Handle incoming remote tracks
    pc.ontrack = (event) => {
      event.streams[0].getTracks().forEach((track) => {
        newRemoteStream.addTrack(track);
      });
      setRemoteStream(new MediaStream(newRemoteStream.getTracks()));
    };

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate && socketRef.current) {
        socketRef.current.emit('ice-candidate', {
          to: remoteSocketId,
          candidate: event.candidate,
        });
      }
    };

    // Track connection state
    pc.onconnectionstatechange = () => {
      const state = pc.connectionState;
      console.log(`[WebRTC] Connection state: ${state}`);
      setConnectionState(state);

      if (state === 'failed') {
        setError('Connection failed. Please try rejoining the meeting.');
      }
    };

    pc.oniceconnectionstatechange = () => {
      console.log(`[WebRTC] ICE state: ${pc.iceConnectionState}`);
      if (pc.iceConnectionState === 'disconnected') {
        setConnectionState('disconnected');
      }
    };

    return pc;
  }, []);

  /**
   * Initialize local media stream (camera + microphone).
   */
  const initializeMedia = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      localStreamRef.current = stream;
      setLocalStream(stream);
      return stream;
    } catch (err) {
      let message = 'Failed to access camera and microphone.';
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        message = 'Camera and microphone permissions are required to join the meeting. Please allow access in your browser settings and try again.';
      } else if (err.name === 'NotFoundError') {
        message = 'No camera or microphone found. Please connect a device and try again.';
      } else if (err.name === 'NotReadableError') {
        message = 'Camera or microphone is already in use by another application.';
      }
      setError(message);
      return null;
    }
  }, []);

  /**
   * Connect to Socket.IO and set up signaling event handlers.
   */
  const connectSocket = useCallback(() => {
    const token = currentUser?.token;
    if (!token || !meetingId) return null;

    // Connect directly to the Express/Socket.IO backend (not the CRA dev proxy)
    // CRA proxy does not reliably forward WebSocket upgrades for Socket.IO
    const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5050';
    const socket = io(BACKEND_URL, {
      auth: { token },
      transports: ['polling', 'websocket'], // polling first ensures stable upgrade
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log(`[Socket.IO] Connected: ${socket.id}`);
      socket.emit('join-meeting', { meetingId });
    });

    socket.on('connect_error', (err) => {
      console.error('[Socket.IO] Connection error:', err.message);
      if (err.message.includes('Authentication')) {
        setError('Authentication failed. Please log in again.');
      } else {
        setError('Failed to connect to the meeting server. Please check your connection and try again.');
      }
    });

    // Room info received after joining
    socket.on('room-info', ({ participants, participantCount: count }) => {
      setParticipantCount(count);

      // If there's already another participant, initiate the call (we are the offerer)
      if (participants.length > 0) {
        const remotePeer = participants[0];
        setRemoteUser(remotePeer.user);
        setConnectionState('connecting');

        const pc = createPeerConnection(remotePeer.socketId);

        // Create and send offer
        pc.createOffer()
          .then((offer) => pc.setLocalDescription(offer))
          .then(() => {
            socket.emit('offer', {
              to: remotePeer.socketId,
              offer: pc.localDescription,
            });
          })
          .catch((err) => {
            console.error('[WebRTC] Failed to create offer:', err);
            setError('Failed to establish connection. Please try again.');
          });
      }
    });

    // Another user joined the meeting
    socket.on('user-joined', ({ socketId: remoteSocketId, user }) => {
      console.log(`[Socket.IO] User joined: ${user.fullName}`);
      setRemoteUser(user);
      setParticipantCount((prev) => prev + 1);
      // The new joiner will send us an offer, so we wait
    });

    // Received an offer from a remote peer
    socket.on('offer', async ({ from, offer, user }) => {
      console.log(`[WebRTC] Received offer from ${user.fullName}`);
      setRemoteUser(user);
      setConnectionState('connecting');

      const pc = createPeerConnection(from);

      try {
        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        socket.emit('answer', {
          to: from,
          answer: pc.localDescription,
        });
      } catch (err) {
        console.error('[WebRTC] Failed to handle offer:', err);
        setError('Failed to connect to the other participant.');
      }
    });

    // Received an answer from a remote peer
    socket.on('answer', async ({ from, answer }) => {
      console.log('[WebRTC] Received answer');
      try {
        const pc = peerConnectionRef.current;
        if (pc && pc.signalingState === 'have-local-offer') {
          await pc.setRemoteDescription(new RTCSessionDescription(answer));
        }
      } catch (err) {
        console.error('[WebRTC] Failed to handle answer:', err);
      }
    });

    // Received an ICE candidate from a remote peer
    socket.on('ice-candidate', async ({ from, candidate }) => {
      try {
        const pc = peerConnectionRef.current;
        if (pc && candidate) {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        }
      } catch (err) {
        console.error('[WebRTC] Failed to add ICE candidate:', err);
      }
    });

    // A user left the meeting
    socket.on('user-left', ({ socketId, user }) => {
      console.log(`[Socket.IO] User left: ${user.fullName}`);
      setRemoteUser(null);
      setRemoteStream(null);
      setConnectionState('new');
      setParticipantCount((prev) => Math.max(1, prev - 1));

      // Clean up peer connection
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
        peerConnectionRef.current = null;
      }
      remoteStreamRef.current = null;
    });

    // Server error messages
    socket.on('error-message', ({ message }) => {
      setError(message);
    });

    return socket;
  }, [meetingId, currentUser, createPeerConnection]);

  /**
   * Toggle microphone mute/unmute.
   */
  const toggleMute = useCallback(() => {
    if (localStreamRef.current) {
      const audioTracks = localStreamRef.current.getAudioTracks();
      audioTracks.forEach((track) => {
        track.enabled = !track.enabled;
      });
      setIsMuted((prev) => !prev);
    }
  }, []);

  /**
   * Toggle camera on/off.
   */
  const toggleCamera = useCallback(() => {
    if (localStreamRef.current) {
      const videoTracks = localStreamRef.current.getVideoTracks();
      videoTracks.forEach((track) => {
        track.enabled = !track.enabled;
      });
      setIsCameraOff((prev) => !prev);
    }
  }, []);

  /**
   * Leave the meeting — stop all tracks, close connections, disconnect socket.
   */
  const leaveCall = useCallback(() => {
    if (hasLeftRef.current) return;
    hasLeftRef.current = true;

    // Notify server
    if (socketRef.current) {
      socketRef.current.emit('leave-meeting');
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    // Close peer connection
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    // Stop all local media tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }

    setLocalStream(null);
    setRemoteStream(null);
    setRemoteUser(null);
    setConnectionState('disconnected');
  }, []);

  /**
   * Initialize everything on mount.
   */
  useEffect(() => {
    let socket = null;

    const init = async () => {
      const stream = await initializeMedia();
      if (stream) {
        socket = connectSocket();
      }
    };

    init();

    // Cleanup on unmount
    return () => {
      if (!hasLeftRef.current) {
        leaveCall();
      }
    };
  }, [initializeMedia, connectSocket, leaveCall]);

  return {
    localStream,
    remoteStream,
    isMuted,
    isCameraOff,
    connectionState,
    remoteUser,
    error,
    participantCount,
    toggleMute,
    toggleCamera,
    leaveCall,
  };
};

export default useWebRTC;
