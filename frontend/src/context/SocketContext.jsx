import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext(null);

export const SocketProvider = ({ currentUser, children }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const socketRef = useRef(null);

  useEffect(() => {
    const token = currentUser?.token;
    if (!token) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setIsConnected(false);
        setOnlineUsers(new Set());
      }
      return;
    }

    const BACKEND_URL =
      process.env.REACT_APP_BACKEND_URL ||
      (window.location.port === '3000' ? 'http://localhost:5050' : window.location.origin);

    const socket = io(BACKEND_URL, {
      auth: { token },
      transports: ['polling', 'websocket'],
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('[SocketContext] Connected to server, socketId:', socket.id);
      setIsConnected(true);
    });

    socket.on('disconnect', (reason) => {
      console.log('[SocketContext] Disconnected:', reason);
      setIsConnected(false);
    });

    socket.on('online_users', (userIds) => {
      setOnlineUsers(new Set(userIds));
    });

    socket.on('user_online', ({ userId }) => {
      setOnlineUsers((prev) => new Set([...prev, userId]));
    });

    socket.on('user_offline', ({ userId }) => {
      setOnlineUsers((prev) => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
      setIsConnected(false);
    };
  }, [currentUser?.token]);

  // Helper actions
  const emitTyping = useCallback((receiverId) => {
    if (socketRef.current && isConnected && receiverId) {
      socketRef.current.emit('typing', { receiverId });
    }
  }, [isConnected]);

  const emitStopTyping = useCallback((receiverId) => {
    if (socketRef.current && isConnected && receiverId) {
      socketRef.current.emit('stop_typing', { receiverId });
    }
  }, [isConnected]);

  const sendSocketMessage = useCallback(({ receiverId, message, attachments }) => {
    return new Promise((resolve) => {
      if (!socketRef.current || !socketRef.current.connected) {
        resolve({ success: false, message: 'Socket not connected' });
        return;
      }
      socketRef.current.emit('send_message', { receiverId, message, attachments }, (res) => {
        resolve(res || { success: true });
      });
    });
  }, []);

  const readConversation = useCallback((participantId) => {
    if (socketRef.current && isConnected && participantId) {
      socketRef.current.emit('read_conversation', { participantId });
    }
  }, [isConnected]);

  return (
    <SocketContext.Provider
      value={{
        socket: socketRef.current,
        isConnected,
        onlineUsers,
        emitTyping,
        emitStopTyping,
        sendSocketMessage,
        readConversation,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    return {
      socket: null,
      isConnected: false,
      onlineUsers: new Set(),
      emitTyping: () => {},
      emitStopTyping: () => {},
      sendSocketMessage: async () => ({ success: false }),
      readConversation: () => {},
    };
  }
  return context;
};

export default SocketContext;
