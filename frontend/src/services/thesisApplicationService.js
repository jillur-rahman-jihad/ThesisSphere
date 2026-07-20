const API_URL = '/api/thesis-applications';

const getAuthHeaders = (currentUser) => ({
  'Content-Type': 'application/json',
  ...(currentUser?.token ? { Authorization: `Bearer ${currentUser.token}` } : {}),
});

export const applyForTopic = async (topicId, message, currentUser) => {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: getAuthHeaders(currentUser),
    body: JSON.stringify({ topicId, message }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Unable to apply for topic');
  }
  return data;
};

export const getMyApplications = async (currentUser) => {
  const response = await fetch(`${API_URL}/my-applications`, {
    method: 'GET',
    headers: getAuthHeaders(currentUser),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Unable to fetch your applications');
  }
  return data;
};

export const getTopicApplications = async (topicId, currentUser) => {
  const response = await fetch(`${API_URL}/topic/${topicId}`, {
    method: 'GET',
    headers: getAuthHeaders(currentUser),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Unable to fetch applications for this topic');
  }
  return data;
};

export const updateApplicationStatus = async (applicationId, status, currentUser) => {
  const response = await fetch(`${API_URL}/${applicationId}/status`, {
    method: 'PUT',
    headers: getAuthHeaders(currentUser),
    body: JSON.stringify({ status }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Unable to update application status');
  }
  return data;
};
