const API_URL = '/api/video-meetings';

const getToken = () => {
  const user = JSON.parse(localStorage.getItem('thesisSphereUser'));
  return user?.token;
};

export const createVideoMeeting = async () => {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getToken()}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to create video meeting');
  }

  return response.json();
};

export const getVideoMeeting = async (meetingId) => {
  const response = await fetch(`${API_URL}/${meetingId}`, {
    headers: {
      Authorization: `Bearer ${getToken()}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to fetch meeting');
  }

  return response.json();
};

export const endVideoMeeting = async (meetingId) => {
  const response = await fetch(`${API_URL}/${meetingId}/end`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${getToken()}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to end meeting');
  }

  return response.json();
};
