import axios from 'axios';

const API_URL = 'http://localhost:5050/api/notifications/';

const getNotifications = async (token) => {
  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
  const response = await axios.get(API_URL, config);
  return response.data;
};

const markAsRead = async (id, token) => {
  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
  const response = await axios.put(`${API_URL}${id}/read`, {}, config);
  return response.data;
};

const markAllAsRead = async (token) => {
  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
  const response = await axios.put(`${API_URL}read-all`, {}, config);
  return response.data;
};

const deleteNotification = async (id, token) => {
  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
  const response = await axios.delete(`${API_URL}${id}`, config);
  return response.data;
};

const notificationService = {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
};

export default notificationService;
