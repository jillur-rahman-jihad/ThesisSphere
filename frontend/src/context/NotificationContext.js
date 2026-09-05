import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { io } from 'socket.io-client';
import notificationService from '../services/notificationService';

const NotificationContext = createContext();

export const useNotification = () => useContext(NotificationContext);

export const NotificationProvider = ({ children, currentUser }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [socket, setSocket] = useState(null);

  // Fetch initial notifications
  const fetchNotifications = useCallback(async () => {
    if (!currentUser || !currentUser.token) return;
    try {
      const data = await notificationService.getNotifications(currentUser.token);
      setNotifications(data);
      setUnreadCount(data.filter(n => !n.isRead).length);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  }, [currentUser]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Setup Socket.IO connection
  useEffect(() => {
    if (!currentUser || !currentUser.token) return;

    const newSocket = io('http://localhost:5050', {
      auth: { token: currentUser.token },
    });

    newSocket.on('connect', () => {
      console.log('Socket connected for notifications');
    });

    newSocket.on('new-notification', (notification) => {
      setNotifications((prev) => [notification, ...prev]);
      setUnreadCount((prev) => prev + 1);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [currentUser]);

  const markAsRead = async (id) => {
    if (!currentUser || !currentUser.token) return;
    try {
      await notificationService.markAsRead(id, currentUser.token);
      setNotifications((prev) => 
        prev.map(n => n._id === id ? { ...n, isRead: true } : n)
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const markAllAsRead = async () => {
    if (!currentUser || !currentUser.token || unreadCount === 0) return;
    try {
      await notificationService.markAllAsRead(currentUser.token);
      setNotifications((prev) => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const deleteNotification = async (id) => {
    if (!currentUser || !currentUser.token) return;
    try {
      await notificationService.deleteNotification(id, currentUser.token);
      setNotifications((prev) => {
        const notif = prev.find(n => n._id === id);
        if (notif && !notif.isRead) {
          setUnreadCount(c => Math.max(0, c - 1));
        }
        return prev.filter(n => n._id !== id);
      });
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  return (
    <NotificationContext.Provider 
      value={{ 
        notifications, 
        unreadCount, 
        markAsRead, 
        markAllAsRead, 
        deleteNotification,
        fetchNotifications
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};
