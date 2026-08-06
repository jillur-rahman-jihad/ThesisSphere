import api from './api';

const getEvents = async () => {
  const response = await api.get('/api/calendar');
  return response.data;
};

const createDeadline = async (deadlineData) => {
  const response = await api.post('/api/calendar/deadline', deadlineData);
  return response.data;
};

const calendarService = {
  getEvents,
  createDeadline,
};

export default calendarService;
