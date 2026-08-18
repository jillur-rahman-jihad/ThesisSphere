const FORUM_URL = '/api/forum';

const getAuthHeaders = (currentUser) => ({
  'Content-Type': 'application/json',
  ...(currentUser?.token ? { Authorization: `Bearer ${currentUser.token}` } : {}),
});

export const getForumPosts = async (currentUser, filters = {}) => {
  const query = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      query.append(key, value);
    }
  });

  const url = `${FORUM_URL}${query.toString() ? `?${query.toString()}` : ''}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: getAuthHeaders(currentUser),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Unable to fetch forum posts');
  }

  return data;
};

export const getForumPostById = async (postId, currentUser) => {
  const response = await fetch(`${FORUM_URL}/${postId}`, {
    method: 'GET',
    headers: getAuthHeaders(currentUser),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Unable to fetch post details');
  }

  return data;
};

export const createForumPost = async (postData, currentUser) => {
  const response = await fetch(FORUM_URL, {
    method: 'POST',
    headers: getAuthHeaders(currentUser),
    body: JSON.stringify(postData),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Unable to create discussion post');
  }

  return data;
};

export const addComment = async (postId, commentText, currentUser) => {
  const response = await fetch(`${FORUM_URL}/${postId}/comments`, {
    method: 'POST',
    headers: getAuthHeaders(currentUser),
    body: JSON.stringify({ comment: commentText }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Unable to add comment');
  }

  return data;
};

export const toggleLikePost = async (postId, currentUser) => {
  const response = await fetch(`${FORUM_URL}/${postId}/like`, {
    method: 'PUT',
    headers: getAuthHeaders(currentUser),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Unable to toggle like');
  }

  return data;
};

export const toggleResolvedStatus = async (postId, currentUser) => {
  const response = await fetch(`${FORUM_URL}/${postId}/resolve`, {
    method: 'PUT',
    headers: getAuthHeaders(currentUser),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Unable to update resolution status');
  }

  return data;
};

export const deleteForumPost = async (postId, currentUser) => {
  const response = await fetch(`${FORUM_URL}/${postId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(currentUser),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Unable to delete discussion post');
  }

  return data;
};

export const deleteComment = async (postId, commentId, currentUser) => {
  const response = await fetch(`${FORUM_URL}/${postId}/comments/${commentId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(currentUser),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Unable to delete comment');
  }

  return data;
};
