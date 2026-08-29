const API_BASE =
  "/api/supervisor-group-manager";

const getToken = () => {
  try {
    const storedUser =
      localStorage.getItem("thesisSphereUser");

    if (!storedUser) return "";

    const user = JSON.parse(storedUser);

    return (
      user.token ||
      user.user?.token ||
      ""
    );
  } catch (error) {
    console.error(
      "Unable to get authentication token",
      error
    );

    return "";
  }
};

const request = async (
  endpoint,
  options = {}
) => {
  const token = getToken();

  const response = await fetch(
    `${API_BASE}${endpoint}`,
    {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        ...(options.headers || {}),
      },
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message ||
        "Something went wrong"
    );
  }

  return data;
};


// ============================================================
// GET SUPERVISOR GROUPS
// ============================================================

export const getSupervisorGroups =
  async () => {
    return request("/groups");
  };


// ============================================================
// GET GROUP DETAILS
// ============================================================

export const getSupervisorGroupDetails =
  async (groupId) => {
    return request(
      `/groups/${groupId}`
    );
  };


// ============================================================
// UPDATE GROUP PROGRESS
// ============================================================

export const updateGroupProgress =
  async (groupId, progress) => {
    return request(
      `/groups/${groupId}/progress`,
      {
        method: "PUT",
        body: JSON.stringify({
          progress,
        }),
      }
    );
  };


// ============================================================
// UPDATE MEMBER RESPONSIBILITY
// ============================================================

export const updateMemberResponsibility =
  async (
    groupId,
    memberId,
    data
  ) => {
    return request(
      `/groups/${groupId}/members/${memberId}`,
      {
        method: "PUT",
        body: JSON.stringify(data),
      }
    );
  };


// ============================================================
// REMOVE MEMBER
// ============================================================

export const removeMemberFromGroup =
  async (
    groupId,
    memberId
  ) => {
    return request(
      `/groups/${groupId}/members/${memberId}`,
      {
        method: "DELETE",
      }
    );
  };


// ============================================================
// ASSIGN STUDENT
// ============================================================

export const assignStudentToGroup =
  async (
    groupId,
    data
  ) => {
    return request(
      `/groups/${groupId}/members`,
      {
        method: "POST",
        body: JSON.stringify(data),
      }
    );
  };


// ============================================================
// GET AVAILABLE STUDENTS
// ============================================================

export const getAvailableStudents =
  async () => {
    return request("/students");
  };