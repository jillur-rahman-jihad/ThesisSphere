const API_URL = "/api/calendar";

const getToken = () => {
  const user = JSON.parse(localStorage.getItem("thesisSphereUser"));
  return user?.token;
};

const getEvents = async () => {
  const response = await fetch(API_URL, {
    headers: {
      Authorization: `Bearer ${getToken()}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to fetch calendar events");
  }

  return response.json();
};

const createDeadline = async (deadlineData) => {
  const response = await fetch(`${API_URL}/deadline`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getToken()}`,
    },
    body: JSON.stringify(deadlineData),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw { response: { data: { message: errorData.message || "Failed to create deadline" } } }; 
    // structured this way to match how Calendar.jsx currently catches err.response?.data?.message
  }

  return response.json();
};

const calendarService = {
  getEvents,
  createDeadline,
};

export default calendarService;
