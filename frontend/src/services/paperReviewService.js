const API_BASE = "/api/paper-reviews";

// ============================================================
// GET AUTHENTICATION TOKEN
// ============================================================

const getToken = () => {
  try {
    const storedUser =
      localStorage.getItem(
        "thesisSphereUser"
      );

    if (!storedUser) return "";

    const user =
      JSON.parse(storedUser);

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

// ============================================================
// GENERIC REQUEST HELPER
// ============================================================

const request = async (
  endpoint,
  options = {}
) => {
  const token = getToken();

  const isFormData =
    options.body instanceof FormData;

  const headers = {
    ...(token
      ? {
          Authorization:
            `Bearer ${token}`,
        }
      : {}),

    ...(options.headers || {}),
  };

  // Don't manually set Content-Type for FormData.
  if (!isFormData) {
    headers["Content-Type"] =
      "application/json";
  }

  const response =
    await fetch(
      `${API_BASE}${endpoint}`,
      {
        ...options,
        headers,
      }
    );

  let data;

  try {
    data =
      await response.json();
  } catch (error) {
    data = {};
  }

  if (!response.ok) {
    throw new Error(
      data.message ||
        "Something went wrong"
    );
  }

  return data;
};

// ============================================================
// STUDENT
// ============================================================

// ============================================================
// CREATE PAPER REVIEW
// ============================================================

export const createPaperReview =
  async (paperData) => {
    const formData =
      new FormData();

    formData.append(
      "title",
      paperData.title
    );

    formData.append(
      "thesisGroupId",
      paperData.thesisGroupId
    );

    formData.append(
      "deadline",
      paperData.deadline
    );

    if (paperData.paperFile) {
      formData.append(
        "paperFile",
        paperData.paperFile
      );
    }

    return request("/", {
      method: "POST",
      body: formData,
    });
  };

// ============================================================
// GET STUDENT PAPERS
// ============================================================

export const getStudentPaperReviews =
  async () => {
    return request(
      "/my-papers"
    );
  };

// ============================================================
// GET PAPER BY ID
// ============================================================

export const getPaperReviewById =
  async (paperId) => {
    return request(
      `/${paperId}`
    );
  };

// ============================================================
// UPDATE PAPER
// ============================================================

export const updatePaperReview =
  async (
    paperId,
    paperData
  ) => {
    const formData = new FormData();

    formData.append("title", paperData.title);
    formData.append("deadline", paperData.deadline);

    if (paperData.paperFile) {
      formData.append("paperFile", paperData.paperFile);
    }

    return request(
      `/${paperId}`,
      {
        method: "PUT",
        body: formData,
      }
    );
  };

// ============================================================
// SUBMIT PAPER
// ============================================================

export const submitPaperReview =
  async (paperId) => {
    return request(
      `/${paperId}/submit`,
      {
        method: "PUT",
      }
    );
  };

// ============================================================
// GET MY THESIS GROUPS
// ============================================================

export const getMyThesisGroups =
  async () => {
    return request(
      "/my-groups"
    );
  };

// ============================================================
// STUDENT STATISTICS
// ============================================================

export const getStudentPaperStatistics =
  async () => {
    return request(
      "/student/statistics"
    );
  };

// ============================================================
// GET PAPER PDF URL
// ============================================================

export const getPaperFileUrl =
  (paperId) => {
    return `${API_BASE}/${paperId}/file`;
  };

export const getPaperFileBlob =
  async (paperId) => {
    const token = getToken();
    const response = await fetch(
      getPaperFileUrl(paperId),
      {
        headers: token
          ? { Authorization: `Bearer ${token}` }
          : {},
      }
    );

    if (!response.ok) {
      throw new Error("Unable to load paper PDF.");
    }

    return response.blob();
  };

// ============================================================
// FACULTY
// ============================================================

// ============================================================
// GET SUPERVISOR PAPERS
// ============================================================

export const getSupervisorPaperReviews =
  async () => {
    return request(
      "/supervisor/papers"
    );
  };

// ============================================================
// GET SUPERVISOR PAPER
// ============================================================

export const getSupervisorPaperReviewById =
  async (paperId) => {
    return request(
      `/supervisor/${paperId}`
    );
  };

// ============================================================
// REVIEW PAPER
// ============================================================

export const reviewPaper =
  async (
    paperId,
    reviewData
  ) => {
    return request(
      `/${paperId}/review`,
      {
        method: "PUT",
        body: JSON.stringify(
          reviewData
        ),
      }
    );
  };

// ============================================================
// SUPERVISOR STATISTICS
// ============================================================

export const getSupervisorPaperStatistics =
  async () => {
    return request(
      "/supervisor/statistics"
    );
  };

// ============================================================
// DEFAULT SERVICE
// ============================================================

const paperReviewService = {
  createPaperReview,

  getStudentPaperReviews,

  getPaperReviewById,

  updatePaperReview,

  submitPaperReview,

  getMyThesisGroups,

  getStudentPaperStatistics,

  getPaperFileUrl,

  getSupervisorPaperReviews,

  getSupervisorPaperReviewById,

  reviewPaper,

  getSupervisorPaperStatistics,
};

export default paperReviewService;