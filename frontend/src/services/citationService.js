const API_URL = '/api/citations';

const getToken = () => {
  const user = JSON.parse(localStorage.getItem('thesisSphereUser') || 'null');
  return user?.token;
};

export const generateCitation = async (payload) => {
  const response = await fetch(`${API_URL}/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getToken()}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to generate citation');
  }

  return response.json();
};

export const getUserCitations = async () => {
  const response = await fetch(API_URL, {
    headers: {
      Authorization: `Bearer ${getToken()}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to fetch citations');
  }

  return response.json();
};
