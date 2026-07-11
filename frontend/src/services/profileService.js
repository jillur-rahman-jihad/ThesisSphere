const API_URL = "/api/auth/profile";

const getToken = () => {
  const user = JSON.parse(localStorage.getItem("thesisSphereUser"));
  return user?.token;
};

export const getProfile = async () => {
  const response = await fetch(API_URL, {
    headers: {
      Authorization: `Bearer ${getToken()}`,
    },
  });

 if (!response.ok) {
  const errorData = await response.json();
  throw new Error(errorData.message || "Failed to update profile");
}

  return response.json();
};

export const updateProfile = async (profileData) => {
  const response = await fetch(API_URL, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getToken()}`,
    },
    body: JSON.stringify(profileData),
  });

  if (!response.ok) {
    throw new Error("Failed to update profile");
  }

  return response.json();
};

export const updateFacultyProfile = async (profileData) => {
  const response = await fetch("/api/faculty/profile", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getToken()}`,
    },
    body: JSON.stringify(profileData),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to update faculty profile");
  }

  return response.json();
};