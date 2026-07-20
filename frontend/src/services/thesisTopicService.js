const POST_URL = '/api/thesis-post';
const BROWSE_URL = '/api/thesis-browse';

const getAuthHeaders = (currentUser) => ({
  'Content-Type': 'application/json',
  ...(currentUser?.token ? { Authorization: `Bearer ${currentUser.token}` } : {}),
});

export const createThesisTopic = async (topicData, currentUser) => {
  const response = await fetch(POST_URL, {
    method: 'POST',
    headers: getAuthHeaders(currentUser),
    body: JSON.stringify(topicData),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Unable to post thesis topic');
  }

  return data;
};

export const getThesisTopics = async (currentUser, filters = {}) => {
  const query = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      query.append(key, value);
    }
  });

  const url = `${BROWSE_URL}${query.toString() ? `?${query.toString()}` : ''}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: getAuthHeaders(currentUser),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Unable to load thesis topics');
  }

  return data;
};

export const updateThesisTopic = async (topicId, topicData, currentUser) => {
  const response = await fetch(`${POST_URL}/${topicId}`, {
    method: 'PUT',
    headers: getAuthHeaders(currentUser),
    body: JSON.stringify(topicData),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Unable to update thesis topic');
  }

  return data;
};

export const deleteThesisTopic = async (topicId, currentUser) => {
  const response = await fetch(`${POST_URL}/${topicId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(currentUser),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Unable to delete thesis topic');
  }

  return data;
};

