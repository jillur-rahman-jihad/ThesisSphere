const API_URL = "/api/thesis-groups";

// Get login token
const getToken = () => {
  const user = JSON.parse(
    localStorage.getItem("thesisSphereUser")
  );

  return user?.token;
};

// Common headers
const getHeaders = () => {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${getToken()}`,
  };
};


// ==========================================
// GET MY THESIS GROUP
// ==========================================
export const getMyGroup = async () => {
  const response = await fetch(
    `${API_URL}/my-group`,
    {
      method: "GET",
      headers: getHeaders(),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message || "Failed to fetch your thesis group"
    );
  }

  return data;
};


// ==========================================
// GET ALL THESIS GROUPS
// ==========================================
export const getAllGroups = async () => {
  const response = await fetch(API_URL, {
    method: "GET",
    headers: getHeaders(),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message || "Failed to fetch thesis groups"
    );
  }

  return data;
};


// ==========================================
// CREATE THESIS GROUP
// ==========================================
export const createThesisGroup = async (groupData) => {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(groupData),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message || "Failed to create thesis group"
    );
  }

  return data;
};



// ================= REQUEST TO JOIN =================

export const requestToJoinGroup = async (groupId) => {
  const response = await fetch(
    `${API_URL}/${groupId}/request`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${getToken()}`,
        "Content-Type": "application/json",
      },
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message ||
        "Failed to send join request"
    );
  }

  return data;
};


// ==========================================
// ACCEPT JOIN REQUEST
// ==========================================
export const acceptJoinRequest = async (
  groupId,
  requestId,
  memberDetails
) => {
  const response = await fetch(
    `${API_URL}/${groupId}/requests/${requestId}/accept`,
    {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(memberDetails),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message ||
        "Failed to accept join request"
    );
  }

  return data;
};


// ==========================================
// REJECT JOIN REQUEST
// ==========================================
export const rejectJoinRequest = async (
  groupId,
  requestId
) => {
  const response = await fetch(
    `${API_URL}/${groupId}/requests/${requestId}/reject`,
    {
      method: "POST",
      headers: getHeaders(),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message ||
        "Failed to reject join request"
    );
  }

  return data;
};