import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  FileText,
  Plus,
  Search,
  Edit3,
  Eye,
  X,
  Clock,
  CheckCircle,
  AlertCircle,
  FileEdit,
  MessageSquare,
  RefreshCw,
  Calendar,
  Users,
  User,
  BookOpen,
  Send,
  GraduationCap,
  ChevronDown,
} from "lucide-react";

import {
  createPaperReview,
  getStudentPaperReviews,
  getPaperReviewById,
  updatePaperReview,
  submitPaperReview,
  getMyThesisGroups,
  getStudentPaperStatistics,
  getSupervisorPaperReviews,
  getSupervisorPaperReviewById,
  reviewPaper,
  getSupervisorPaperStatistics,
  getPaperFileBlob,
} from "../services/paperReviewService";


// ============================================================
// STATUS CONFIGURATION
// ============================================================

const STATUS_CONFIG = {
  draft: {
    label: "Draft",
    className:
      "bg-slate-100 text-slate-700 dark:bg-slate-700/50 dark:text-slate-300",
    icon: <FileEdit size={15} />,
  },

  "under review": {
    label: "Under Review",
    className:
      "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
    icon: <Clock size={15} />,
  },

  "revision required": {
    label: "Revision Required",
    className:
      "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
    icon: <AlertCircle size={15} />,
  },

  accepted: {
    label: "Accepted",
    className:
      "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
    icon: <CheckCircle size={15} />,
  },
};


// ============================================================
// MAIN COMPONENT
// ============================================================

const PaperReviews = () => {
  const [userRole, setUserRole] = useState("");

  const [papers, setPapers] = useState([]);

  const [statistics, setStatistics] = useState({
    total: 0,
    underReview: 0,
    revisionRequired: 0,
    accepted: 0,
    draft: 0,
  });

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const [searchTerm, setSearchTerm] = useState("");

  const [selectedStatus, setSelectedStatus] =
    useState("all");

  const [showAddModal, setShowAddModal] =
    useState(false);

  const [showEditModal, setShowEditModal] =
    useState(false);

  const [showDetailsModal, setShowDetailsModal] =
    useState(false);

  const [selectedPaper, setSelectedPaper] =
    useState(null);

  const [saving, setSaving] = useState(false);


  // ============================================================
  // GET USER ROLE
  // ============================================================

  useEffect(() => {
    try {
      const storedUser =
        localStorage.getItem(
          "thesisSphereUser"
        );

      if (!storedUser) {
        setError(
          "User information not found."
        );

        setLoading(false);
        return;
      }

      const parsedUser =
        JSON.parse(storedUser);

      const role =
        parsedUser.role ||
        parsedUser.user?.role ||
        "";

      setUserRole(role);
    } catch (err) {
      console.error(err);

      setError(
        "Unable to determine user role."
      );

      setLoading(false);
    }
  }, []);


  // ============================================================
  // LOAD PAPERS
  // ============================================================

  const loadPapers = async () => {
    if (!userRole) return;

    try {
      setLoading(true);
      setError("");

      let response;
      let statisticsResponse;

      if (userRole === "faculty") {
        response =
          await getSupervisorPaperReviews();

        statisticsResponse =
          await getSupervisorPaperStatistics();
      } else {
        response =
          await getStudentPaperReviews();

        statisticsResponse =
          await getStudentPaperStatistics();
      }

      setPapers(
        response?.data ||
        response?.papers ||
        []
      );

      setStatistics(
        statisticsResponse?.data ||
        statisticsResponse?.statistics ||
        {
          total: 0,
          underReview: 0,
          revisionRequired: 0,
          accepted: 0,
          draft: 0,
        }
      );
    } catch (err) {
      console.error(err);

      setError(
        err.message ||
          "Failed to load paper reviews."
      );

      setPapers([]);
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    if (userRole) {
      loadPapers();
    }
  }, [userRole]);


  // ============================================================
  // FILTER PAPERS
  // ============================================================

  const filteredPapers = useMemo(() => {
    return papers.filter((paper) => {
      const search =
        searchTerm
          .toLowerCase()
          .trim();

      const title =
        paper.title || "";

      const thesisName =
        paper.thesisGroupId?.topicId?.title ||
        paper.thesisGroupId?.topicId?.name ||
        "";

      const supervisorName =
        paper.thesisGroupId?.supervisorId?.fullName ||
        "";

      const groupName =
        paper.thesisGroupId?.groupName ||
        "";

      const matchesSearch =
        !search ||
        title
          .toLowerCase()
          .includes(search) ||
        thesisName
          .toLowerCase()
          .includes(search) ||
        supervisorName
          .toLowerCase()
          .includes(search) ||
        groupName
          .toLowerCase()
          .includes(search);

      const normalized =
        normalizeStatus(
          paper.status
        );

      const matchesStatus =
        selectedStatus === "all" ||
        normalized ===
          selectedStatus;

      return (
        matchesSearch &&
        matchesStatus
      );
    });
  }, [
    papers,
    searchTerm,
    selectedStatus,
  ]);


  // ============================================================
  // OPEN DETAILS
  // ============================================================

  const openDetails = async (
    paper
  ) => {
    try {
      setError("");

      let response;

      if (
        userRole === "faculty"
      ) {
        response =
          await getSupervisorPaperReviewById(
            paper._id
          );
      } else {
        response =
          await getPaperReviewById(
            paper._id
          );
      }

      setSelectedPaper(
        response?.data ||
        response?.paper ||
        paper
      );

      setShowDetailsModal(true);
    } catch (err) {
      console.error(err);

      setSelectedPaper(paper);
      setShowDetailsModal(true);
    }
  };


  // ============================================================
  // OPEN PDF
  // ============================================================

  const openPdf = async (paper) => {
    /*
     * The PDF is now stored directly in MongoDB.
     *
     * Therefore paper.paperFile is no longer
     * a physical file path such as:
     *
     * /uploads/papers/example.pdf
     *
     * Instead, we request:
     *
     * /api/paper-reviews/:paperId/file
     */

    if (!paper?._id) {
      setError(
        "No PDF is available for this paper."
      );

      return;
    }

    const popup = window.open(
      "about:blank",
      "paperPdfPopup",
      "popup=yes,width=1100,height=800,resizable=yes,scrollbars=yes"
    );

    try {
      const pdfBlob = await getPaperFileBlob(paper._id);
      const fileUrl = URL.createObjectURL(pdfBlob);

      if (popup) {
        popup.location.href = fileUrl;
      }
    } catch (error) {
      if (popup) popup.close();
      setError(error.message || "Unable to load paper PDF.");
    }
  };


  // ============================================================
  // OPEN EDIT
  // ============================================================

  const openEdit = (paper) => {
    setSelectedPaper(paper);
    setShowEditModal(true);
  };


  // ============================================================
  // SUBMIT PAPER
  // ============================================================

  const handleSubmitPaper =
    async (paperId) => {
      const confirmed =
        window.confirm(
          "Are you sure you want to submit this paper for review?"
        );

      if (!confirmed) return;

      try {
        setSaving(true);
        setError("");

        await submitPaperReview(
          paperId
        );

        await loadPapers();
      } catch (err) {
        console.error(err);

        setError(
          err.message ||
            "Failed to submit paper."
        );
      } finally {
        setSaving(false);
      }
    };


  // ============================================================
  // AFTER SAVE
  // ============================================================

  const handleSaved =
    async () => {
      setShowAddModal(false);
      setShowEditModal(false);
      setSelectedPaper(null);

      await loadPapers();
    };


  // ============================================================
  // AFTER REVIEW
  // ============================================================

  const handleReviewed =
    async () => {
      setShowDetailsModal(false);
      setSelectedPaper(null);

      await loadPapers();
    };


  // ============================================================
  // LOADING
  // ============================================================

  if (
    loading &&
    !papers.length
  ) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900/50 p-6 md:p-8">

        <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300">

          <RefreshCw
            size={20}
            className="animate-spin"
          />

          Loading paper reviews...

        </div>

      </div>
    );
  }


  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900/50 p-6 md:p-8">

      {/* ======================================================
          HEADER
      ====================================================== */}

      <div className="mb-8">

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">

          <div>

            <p className="text-sm font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
              {userRole === "faculty"
                ? "Faculty Workspace"
                : "Student Workspace"}
            </p>

            <h1 className="text-3xl font-bold text-slate-900 dark:text-white mt-1">
              Paper Reviews
            </h1>

            <p className="text-slate-600 dark:text-slate-300 mt-2">
              {userRole === "faculty"
                ? "Review thesis papers, provide feedback and manage review status."
                : "Create, submit and track your thesis paper reviews."}
            </p>

          </div>


          {/* REFRESH BUTTON REMOVED */}

          <div className="flex gap-3">

            {userRole ===
              "student" && (
              <button
                onClick={() =>
                  setShowAddModal(
                    true
                  )
                }
                className="inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 shadow-sm"
              >
                <Plus size={18} />
                Add Paper
              </button>
            )}

          </div>

        </div>

      </div>


      {/* ======================================================
          ERROR
      ====================================================== */}

      {error && (
        <div className="mb-6 rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-900/20 p-4 text-red-700 dark:text-red-300 flex items-start justify-between gap-4">

          <p>{error}</p>

          <button
            onClick={() =>
              setError("")
            }
            className="shrink-0"
          >
            <X size={18} />
          </button>

        </div>
      )}


      {/* ======================================================
          STATISTICS
      ====================================================== */}

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">

        <StatCard
          icon={
            <FileText
              size={21}
            />
          }
          label="Total Papers"
          value={
            statistics.total
          }
        />

        <StatCard
          icon={
            <Clock
              size={21}
            />
          }
          label="Under Review"
          value={
            statistics.underReview
          }
        />

        <StatCard
          icon={
            <AlertCircle
              size={21}
            />
          }
          label="Revision Required"
          value={
            statistics.revisionRequired
          }
        />

        <StatCard
          icon={
            <CheckCircle
              size={21}
            />
          }
          label="Accepted"
          value={
            statistics.accepted
          }
        />

      </div>


      {/* ======================================================
          SEARCH + FILTER
      ====================================================== */}

      <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 mb-6">

        <div className="flex flex-col md:flex-row gap-4">

          <div className="relative flex-1">

            <Search
              size={19}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              type="text"
              value={
                searchTerm
              }
              onChange={(e) =>
                setSearchTerm(
                  e.target.value
                )
              }
              placeholder="Search papers, groups or supervisors..."
              className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

          </div>


          <select
            value={
              selectedStatus
            }
            onChange={(e) =>
              setSelectedStatus(
                e.target.value
              )
            }
            className="px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 font-medium"
          >

            <option value="all">
              All Status
            </option>

            <option value="draft">
              Draft
            </option>

            <option value="under review">
              Under Review
            </option>

            <option value="revision required">
              Revision Required
            </option>

            <option value="accepted">
              Accepted
            </option>

          </select>

        </div>

      </div>


      {/* ======================================================
          PAPER LIST
      ====================================================== */}

      {filteredPapers.length ===
      0 ? (

        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-12 text-center">

          <FileText
            size={48}
            className="mx-auto text-slate-400"
          />

          <h2 className="mt-4 text-xl font-bold text-slate-900 dark:text-white">
            No Papers Found
          </h2>

          <p className="mt-2 text-slate-500 dark:text-slate-400">
            {userRole ===
            "student"
              ? "You have not created any paper reviews yet."
              : "There are currently no papers assigned to your thesis groups."}
          </p>

          {userRole ===
            "student" && (
            <button
              onClick={() =>
                setShowAddModal(
                  true
                )
              }
              className="mt-5 inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700"
            >
              <Plus size={18} />
              Add Your First Paper
            </button>
          )}

        </div>

      ) : (

        <div className="space-y-5">

          {filteredPapers.map(
            (paper) => (
              <PaperCard
                key={
                  paper._id
                }
                paper={
                  paper
                }
                userRole={
                  userRole
                }
                onView={() =>
                  openPdf(
                    paper
                  )
                }
                onReview={() =>
                  openDetails(
                    paper
                  )
                }
                onEdit={() =>
                  openEdit(
                    paper
                  )
                }
                onSubmit={() =>
                  handleSubmitPaper(
                    paper._id
                  )
                }
                saving={
                  saving
                }
              />
            )
          )}

        </div>

      )}


      {/* ======================================================
          ADD PAPER MODAL
      ====================================================== */}

      {showAddModal && (
        <PaperFormModal
          title="Create Paper Review"
          onClose={() =>
            setShowAddModal(
              false
            )
          }
          onSaved={
            handleSaved
          }
        />
      )}


      {/* ======================================================
          EDIT PAPER MODAL
      ====================================================== */}

      {showEditModal &&
        selectedPaper && (
          <PaperFormModal
            title="Edit Paper Review"
            paper={
              selectedPaper
            }
            onClose={() => {
              setShowEditModal(
                false
              );

              setSelectedPaper(
                null
              );
            }}
            onSaved={
              handleSaved
            }
          />
        )}


      {/* ======================================================
          DETAILS / REVIEW MODAL
      ====================================================== */}

      {showDetailsModal &&
        selectedPaper && (
          <PaperDetailsModal
            paper={
              selectedPaper
            }
            userRole={
              userRole
            }
            onClose={() => {
              setShowDetailsModal(
                false
              );

              setSelectedPaper(
                null
              );
            }}
            onReviewed={
              handleReviewed
            }
          />
        )}

    </div>
  );
};


// ============================================================
// STAT CARD
// ============================================================

const StatCard = ({
  icon,
  label,
  value,
}) => {
  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 shadow-sm">

      <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">

        {icon}

        <span className="text-xs font-semibold uppercase tracking-wider">
          {label}
        </span>

      </div>

      <p className="text-3xl font-bold text-slate-900 dark:text-white mt-3">
        {value ?? 0}
      </p>

    </div>
  );
};


// ============================================================
// PAPER CARD
// ============================================================

const PaperCard = ({
  paper,
  userRole,
  onView,
  onReview,
  onEdit,
  onSubmit,
  saving,
}) => {
  const status =
    normalizeStatus(
      paper.status
    );

  const group =
    paper.thesisGroupId;

  const topic =
    group?.topicId;

  const supervisor =
    group?.supervisorId;

  const hasPdf = Boolean(paper?._id);

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 shadow-sm hover:shadow-md transition">

      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5">

        <div className="flex items-start gap-4">

          <div className="h-12 w-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <FileText
              size={23}
            />
          </div>

          <div>

            <div className="flex flex-wrap items-center gap-2">

              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                {paper.title ||
                  "Untitled Paper"}
              </h2>

              <StatusBadge
                status={
                  paper.status
                }
              />

            </div>

            <p className="text-slate-500 dark:text-slate-400 mt-1">
              {group?.groupName ||
                "Thesis group not available"}
            </p>

          </div>

        </div>


        <div className="flex flex-wrap gap-2">

          <button
            onClick={
              onView
            }
            disabled={
              !hasPdf
            }
            title={
              hasPdf
                ? userRole ===
                  "faculty"
                  ? "Open student's uploaded PDF"
                  : "Open your uploaded PDF"
                : "No PDF uploaded"
            }
            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold hover:bg-slate-200 dark:hover:bg-slate-600 disabled:cursor-not-allowed disabled:opacity-50"
          >

            <Eye size={16} />

            View PDF

          </button>


          {userRole ===
            "faculty" && (
            <button
              onClick={
                onReview
              }
              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 font-semibold hover:bg-blue-100 dark:hover:bg-blue-900/40"
            >

              <MessageSquare
                size={16}
              />

              Feedback

            </button>
          )}


          {userRole ===
            "student" &&
            (
              status ===
                "draft" ||
              status ===
                "revision required"
            ) && (
              <>

                <button
                  onClick={
                    onEdit
                  }
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 font-semibold hover:bg-blue-100 dark:hover:bg-blue-900/40"
                >

                  <Edit3
                    size={16}
                  />

                  Edit

                </button>

                <button
                  onClick={
                    onSubmit
                  }
                  disabled={
                    saving
                  }
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 font-semibold hover:bg-green-100 dark:hover:bg-green-900/40 disabled:opacity-50"
                >

                  <Send
                    size={16}
                  />

                  Submit

                </button>

              </>
            )}

        </div>

      </div>


      {/* PAPER INFORMATION */}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mt-6">

        <InfoItem
          icon={
            <BookOpen
              size={17}
            />
          }
          label="Thesis Topic"
          value={
            topic?.title ||
            topic?.name ||
            "Not assigned"
          }
        />

        <InfoItem
          icon={
            <Users
              size={17}
            />
          }
          label="Thesis Group"
          value={
            group?.groupName ||
            "Not available"
          }
        />

        <InfoItem
          icon={
            <User
              size={17}
            />
          }
          label="Supervisor"
          value={
            supervisor?.fullName ||
            "Not assigned"
          }
        />

        <InfoItem
          icon={
            <Calendar
              size={17}
            />
          }
          label="Deadline"
          value={formatDate(
            paper.deadline
          )}
        />

      </div>


      {/* SUBMITTED DATE */}

      <div className="grid gap-4 sm:grid-cols-2 mt-4">

        <InfoItem
          icon={
            <Calendar
              size={17}
            />
          }
          label="Submitted Date"
          value={
            paper.submittedDate
              ? formatDate(
                  paper.submittedDate
                )
              : "Not submitted"
          }
        />

        <InfoItem
          icon={
            <User
              size={17}
            />
          }
          label="Submitted By"
          value={
            paper.submittedBy
              ?.fullName ||
            "Unknown"
          }
        />

      </div>


      {/* PDF INFORMATION */}

      {hasPdf && (
        <div className="mt-5 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/40 p-4">

          <div className="flex items-center gap-3">

            <FileText
              size={20}
              className="text-blue-600 dark:text-blue-400 shrink-0"
            />

            <div className="min-w-0">

              <p className="text-xs font-semibold uppercase tracking-wider text-blue-700 dark:text-blue-300">
                Uploaded PDF
              </p>

              <p className="text-sm font-medium text-slate-700 dark:text-slate-200 mt-1 truncate">
                {paper.paperFile?.fileName ||
                  "Research Paper.pdf"}
              </p>

              {paper.paperFile?.size && (
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {formatFileSize(
                    paper.paperFile.size
                  )}
                </p>
              )}

            </div>

          </div>

        </div>
      )}


      {/* GROUP MEMBERS */}

      <div className="mt-5 flex items-start gap-3">

        <Users
          size={18}
          className="text-slate-400 mt-0.5"
        />

        <div>

          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Thesis Group Members
          </p>

          <p className="text-sm text-slate-700 dark:text-slate-300 mt-1">
            {getMemberNames(
              group
            )}
          </p>

        </div>

      </div>


      {/* FEEDBACK */}

      {paper.feedback && (
        <div className="mt-5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 p-4">

          <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200 font-semibold">

            <MessageSquare
              size={17}
            />

            Faculty Feedback

          </div>

          <p className="text-sm text-slate-600 dark:text-slate-400 mt-2 line-clamp-2">
            {paper.feedback}
          </p>

        </div>
      )}

    </div>
  );
};


// ============================================================
// INFO ITEM
// ============================================================

const InfoItem = ({
  icon,
  label,
  value,
}) => {
  return (
    <div className="rounded-xl bg-slate-50 dark:bg-slate-900/50 p-4">

      <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">

        {icon}

        <span className="text-xs font-semibold uppercase tracking-wider">
          {label}
        </span>

      </div>

      <p className="font-semibold text-slate-800 dark:text-slate-200 mt-2 truncate">
        {value}
      </p>

    </div>
  );
};


// ============================================================
// STATUS BADGE
// ============================================================

const StatusBadge = ({
  status,
}) => {
  const config =
    getStatusConfig(
      status
    );

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${config.className}`}
    >
      {config.icon}
      {config.label}
    </span>
  );
};


// ============================================================
// PAPER FORM MODAL
// ============================================================

const PaperFormModal = ({
  title,
  paper,
  onClose,
  onSaved,
}) => {
  const [groups, setGroups] =
    useState([]);

  const [
    loadingGroups,
    setLoadingGroups,
  ] = useState(false);

  const [formData, setFormData] =
    useState({
      title:
        paper?.title || "",

      thesisGroupId:
        paper?.thesisGroupId?._id ||
        paper?.thesisGroupId ||
        "",

      deadline:
        formatInputDate(
          paper?.deadline
        ),
    });

  const [paperFile, setPaperFile] =
    useState(null);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");


  // ============================================================
  // LOAD STUDENT GROUPS
  // ============================================================

  useEffect(() => {
    const loadGroups =
      async () => {
        try {
          setLoadingGroups(
            true
          );

          setError("");

          const response =
            await getMyThesisGroups();

          console.log(
            "Paper Review - Thesis Groups Response:",
            response
          );

          const loadedGroups =
            Array.isArray(
              response
            )
              ? response
              : Array.isArray(
                  response?.groups
                )
              ? response.groups
              : Array.isArray(
                  response?.data
                )
              ? response.data
              : Array.isArray(
                  response?.data
                    ?.groups
                )
              ? response.data
                  .groups
              : [];

          console.log(
            "Paper Review - Loaded Groups:",
            loadedGroups
          );

          setGroups(
            loadedGroups
          );

          if (
            loadedGroups.length ===
            0
          ) {
            setError(
              "No active thesis groups were found for your account."
            );
          }
        } catch (err) {
          console.error(
            "Failed to load thesis groups:",
            err
          );

          setGroups([]);

          setError(
            err.message ||
              "Failed to load thesis groups."
          );
        } finally {
          setLoadingGroups(
            false
          );
        }
      };

    loadGroups();
  }, []);


  // ============================================================
  // HANDLE CHANGE
  // ============================================================

  const handleChange = (
    e
  ) => {
    const {
      name,
      value,
    } = e.target;

    setFormData(
      (prev) => ({
        ...prev,
        [name]: value,
      })
    );
  };


  // ============================================================
  // HANDLE PDF CHANGE
  // ============================================================

  const handleFileChange = (
    e
  ) => {
    const file =
      e.target.files?.[0] ||
      null;

    if (!file) {
      setPaperFile(null);
      return;
    }

    if (
      file.type !==
      "application/pdf"
    ) {
      setPaperFile(null);

      setError(
        "Only PDF files are allowed."
      );

      e.target.value = "";

      return;
    }

    if (
      file.size >
      10 * 1024 * 1024
    ) {
      setPaperFile(null);

      setError(
        "The PDF must be 10 MB or smaller."
      );

      e.target.value = "";

      return;
    }

    setError("");

    setPaperFile(file);
  };


  // ============================================================
  // SUBMIT FORM
  // ============================================================

  const handleSubmit =
    async (e) => {
      e.preventDefault();

      setError("");

      if (
        !formData.title.trim()
      ) {
        setError(
          "Paper title is required."
        );

        return;
      }

      if (
        !formData.thesisGroupId
      ) {
        setError(
          "Please select a thesis group."
        );

        return;
      }

      if (
        !formData.deadline
      ) {
        setError(
          "Deadline is required."
        );

        return;
      }

      // PDF is required only when creating
      // a new paper.
      if (
        !paper?._id &&
        !paperFile
      ) {
        setError(
          "Please upload the paper PDF."
        );

        return;
      }

      try {
        setSaving(true);

        /*
         * IMPORTANT:
         *
         * createPaperReview() in the updated
         * service accepts normal paper data
         * and creates FormData itself.
         */

        if (!paper?._id) {
          await createPaperReview({
            title:
              formData.title.trim(),

            thesisGroupId:
              formData.thesisGroupId,

            deadline:
              formData.deadline,

            paperFile:
              paperFile,
          });
        } else {
          await updatePaperReview(
            paper._id,
            {
              title:
                formData.title.trim(),

              deadline:
                formData.deadline,

              paperFile:
                paperFile,
            }
          );
        }

        await onSaved();
      } catch (err) {
        console.error(err);

        setError(
          err.message ||
            "Failed to save paper review."
        );
      } finally {
        setSaving(false);
      }
    };


  return (
    <Modal
      title={title}
      onClose={onClose}
    >

      <form
        onSubmit={
          handleSubmit
        }
        className="space-y-5"
      >

        {error && (
          <div className="rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/50 p-3 text-sm text-red-700 dark:text-red-300">
            {error}
          </div>
        )}


        {/* PAPER TITLE */}

        <FormField
          label="Paper Title"
          name="title"
          value={
            formData.title
          }
          onChange={
            handleChange
          }
          placeholder="Enter paper title"
          required
        />


        {/* PAPER PDF */}

        <div>

          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">

            Paper PDF

            {!paper?._id && (
              <span className="text-red-500 ml-1">
                *
              </span>
            )}

          </label>


          <div className="mt-2 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900/50 p-4">

            <input
              type="file"
              accept=".pdf,application/pdf"
              onChange={
                handleFileChange
              }
              className="block w-full text-sm text-slate-700 dark:text-slate-200 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-600 file:text-white file:font-semibold hover:file:bg-blue-700"
            />


            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
              PDF only, maximum
              10 MB.
            </p>


            {paperFile && (
              <div className="mt-3 flex items-center gap-2">

                <FileText
                  size={17}
                  className="text-blue-600 dark:text-blue-400 shrink-0"
                />

                <p className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">
                  {paperFile.name}
                </p>

                <p className="text-xs text-slate-500 dark:text-slate-400 shrink-0">
                  ({formatFileSize(
                    paperFile.size
                  )})
                </p>

              </div>
            )}


            {paper?.paperFile?.fileName &&
              !paperFile && (
                <div className="mt-3">

                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    Current file:
                  </p>

                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 mt-1 truncate">
                    {
                      paper.paperFile
                        .fileName
                    }
                  </p>

                  {paper.paperFile
                    .size && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      {formatFileSize(
                        paper
                          .paperFile
                          .size
                      )}
                    </p>
                  )}

                </div>
              )}

          </div>

          {paper?._id && (
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
              The current PDF is stored in
              MongoDB. PDF replacement is not
              required when editing the paper.
            </p>
          )}

        </div>


        {/* THESIS GROUP */}

        <div>

          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">

            Thesis Group

            <span className="text-red-500 ml-1">
              *
            </span>

          </label>


          <div className="relative mt-2">

            <select
              name="thesisGroupId"
              value={
                formData.thesisGroupId
              }
              onChange={
                handleChange
              }
              disabled={
                loadingGroups ||
                !!paper?._id
              }
              className="w-full appearance-none px-4 py-3 pr-10 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60"
            >

              <option value="">
                {loadingGroups
                  ? "Loading thesis groups..."
                  : groups.length ===
                    0
                  ? "No thesis groups available"
                  : "Select thesis group"}
              </option>


              {groups.map(
                (group) => (
                  <option
                    key={
                      group._id
                    }
                    value={
                      group._id
                    }
                  >
                    {group.groupName ||
                      "Unnamed Group"}
                  </option>
                )
              )}

            </select>


            <ChevronDown
              size={18}
              className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400"
            />

          </div>


          {!!paper?._id && (
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
              The thesis group cannot be
              changed after the paper is created.
            </p>
          )}

        </div>


        {/* GROUP PREVIEW */}

        {formData.thesisGroupId && (
          <SelectedGroupPreview
            group={groups.find(
              (group) =>
                group._id ===
                formData.thesisGroupId
            )}
          />
        )}


        {/* DEADLINE */}

        <FormField
          label="Review Deadline"
          name="deadline"
          type="date"
          value={
            formData.deadline
          }
          onChange={
            handleChange
          }
          required
        />


        {/* NOTE */}

        <div className="rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/40 p-4">

          <div className="flex items-start gap-3">

            <FileEdit
              size={18}
              className="text-blue-600 dark:text-blue-400 mt-0.5 shrink-0"
            />

            <div>

              <p className="font-semibold text-blue-800 dark:text-blue-300">
                Draft workflow
              </p>

              <p className="text-sm text-blue-700 dark:text-blue-400 mt-1">
                Your paper will first be
                saved as a draft. You can
                review the information before
                submitting it to your supervisor.
              </p>

            </div>

          </div>

        </div>


        {/* BUTTONS */}

        <div className="flex gap-3 pt-2">

          <button
            type="button"
            onClick={
              onClose
            }
            className="flex-1 px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 font-semibold hover:bg-slate-50 dark:hover:bg-slate-700"
          >
            Cancel
          </button>


          <button
            type="submit"
            disabled={
              saving
            }
            className="flex-1 px-4 py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-50"
          >
            {saving
              ? "Saving..."
              : paper
              ? "Save Changes"
              : "Save Draft"}
          </button>

        </div>

      </form>

    </Modal>
  );
};


// ============================================================
// SELECTED GROUP PREVIEW
// ============================================================

const SelectedGroupPreview = ({
  group,
}) => {
  if (!group) return null;

  const topic =
    group.topicId;

  const supervisor =
    group.supervisorId;

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 p-5">

      <div className="flex items-center gap-2 mb-4">

        <GraduationCap
          size={19}
          className="text-blue-600 dark:text-blue-400"
        />

        <h3 className="font-bold text-slate-900 dark:text-white">
          Thesis Group Information
        </h3>

      </div>


      <div className="space-y-4">

        <DetailBox
          icon={
            <Users
              size={17}
            />
          }
          label="Group"
          value={
            group.groupName ||
            "Not available"
          }
        />

        <DetailBox
          icon={
            <BookOpen
              size={17}
            />
          }
          label="Thesis Topic"
          value={
            topic?.title ||
            topic?.name ||
            "Not assigned"
          }
        />

        <DetailBox
          icon={
            <User
              size={17}
            />
          }
          label="Supervisor"
          value={
            supervisor?.fullName ||
            "Not assigned"
          }
        />

        <DetailBox
          icon={
            <Users
              size={17}
            />
          }
          label="Members"
          value={getMemberNames(
            group
          )}
        />

      </div>

    </div>
  );
};


// ============================================================
// PAPER DETAILS / FACULTY REVIEW MODAL
// ============================================================

const PaperDetailsModal = ({
  paper,
  userRole,
  onClose,
  onReviewed,
}) => {
  const [status, setStatus] =
    useState(
      normalizeStatus(
        paper.status
      )
    );

  const [feedback, setFeedback] =
    useState(
      paper.feedback ||
        ""
    );

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const group =
    paper.thesisGroupId;

  const topic =
    group?.topicId;

  const supervisor =
    group?.supervisorId;


  // ============================================================
  // FACULTY REVIEW
  // ============================================================

  const handleReview =
    async () => {
      if (
        userRole !== "faculty"
      ) {
        return;
      }

      try {
        setSaving(true);
        setError("");

        await reviewPaper(
          paper._id,
          {
            status,
            feedback:
              feedback.trim(),
          }
        );

        await onReviewed();
      } catch (err) {
        console.error(err);

        setError(
          err.message ||
            "Failed to submit review."
        );
      } finally {
        setSaving(false);
      }
    };


  // ============================================================
  // PDF
  // ============================================================

  const hasPdf = Boolean(paper?._id);


  const handleOpenPdf =
    async () => {
      if (!hasPdf) {
        setError(
          "No PDF is available for this paper."
        );

        return;
      }

      const popup = window.open(
        "about:blank",
        "paperPdfPopup",
        "popup=yes,width=1100,height=800,resizable=yes,scrollbars=yes"
      );

      try {
        const pdfBlob =
          await getPaperFileBlob(
            paper._id
          );

        const fileUrl =
          URL.createObjectURL(
            pdfBlob
          );

        if (popup) {
          popup.location.href = fileUrl;
        }
      } catch (error) {
        if (popup) popup.close();

        setError(
          error.message ||
            "Unable to load paper PDF."
        );
      }
    };


  return (
    <Modal
      title={
        userRole ===
        "faculty"
          ? "Review Paper"
          : "Paper Details"
      }
      onClose={onClose}
      maxWidth="max-w-3xl"
    >

      <div className="space-y-6">

        {error && (
          <div className="rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/50 p-3 text-sm text-red-700 dark:text-red-300">
            {error}
          </div>
        )}


        {/* PAPER HEADER */}

        <div>

          <StatusBadge
            status={
              paper.status
            }
          />

          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mt-3">
            {paper.title ||
              "Untitled Paper"}
          </h2>

          <p className="text-slate-500 dark:text-slate-400 mt-1">
            {group?.groupName ||
              "Thesis group not available"}
          </p>

        </div>


        {/* PDF */}

        {hasPdf && (
          <div className="rounded-2xl border border-blue-200 dark:border-blue-900/50 bg-blue-50 dark:bg-blue-900/20 p-5">

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">

              <div className="flex items-center gap-3 min-w-0">

                <div className="h-11 w-11 rounded-xl bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">

                  <FileText
                    size={21}
                  />

                </div>

                <div className="min-w-0">

                  <p className="text-xs font-semibold uppercase tracking-wider text-blue-700 dark:text-blue-300">
                    Research Paper
                  </p>

                  <p className="font-semibold text-slate-800 dark:text-slate-200 mt-1 truncate">
                    {paper.paperFile
                      ?.fileName ||
                      "Research Paper.pdf"}
                  </p>

                  {paper.paperFile
                    ?.size && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      {formatFileSize(
                        paper
                          .paperFile
                          .size
                      )}
                    </p>
                  )}

                </div>

              </div>


              <button
                type="button"
                onClick={
                  handleOpenPdf
                }
                className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 shrink-0"
              >

                <Eye
                  size={17}
                />

                View PDF

              </button>

            </div>

          </div>
        )}


        {/* BASIC INFORMATION */}

        <div className="grid gap-4 sm:grid-cols-2">

          <DetailBox
            icon={
              <BookOpen
                size={18}
              />
            }
            label="Thesis Topic"
            value={
              topic?.title ||
              topic?.name ||
              "Not assigned"
            }
          />

          <DetailBox
            icon={
              <Users
                size={18}
              />
            }
            label="Thesis Group"
            value={
              group?.groupName ||
              "Not available"
            }
          />

          <DetailBox
            icon={
              <User
                size={18}
              />
            }
            label="Supervisor"
            value={
              supervisor?.fullName ||
              "Not assigned"
            }
          />

          <DetailBox
            icon={
              <User
                size={18}
              />
            }
            label="Submitted By"
            value={
              paper
                .submittedBy
                ?.fullName ||
              "Unknown"
            }
          />

          <DetailBox
            icon={
              <Calendar
                size={18}
              />
            }
            label="Submitted Date"
            value={
              paper.submittedDate
                ? formatDate(
                    paper.submittedDate
                  )
                : "Not submitted"
            }
          />

          <DetailBox
            icon={
              <Clock
                size={18}
              />
            }
            label="Deadline"
            value={formatDate(
              paper.deadline
            )}
          />

        </div>


        {/* GROUP MEMBERS */}

        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 p-5">

          <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">

            <Users size={19} />

            Thesis Group Members

          </div>

          <p className="mt-3 text-slate-700 dark:text-slate-300">
            {getMemberNames(
              group
            )}
          </p>

        </div>


        {/* EXISTING FEEDBACK */}

        {paper.feedback && (
          <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 p-5">

            <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">

              <MessageSquare
                size={19}
              />

              Faculty Feedback

            </div>

            <p className="mt-3 text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
              {paper.feedback}
            </p>

          </div>
        )}


        {/* FACULTY REVIEW SECTION */}

        {userRole ===
          "faculty" && (

          <div className="border-t border-slate-200 dark:border-slate-700 pt-6">

            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Submit Review
            </h3>

            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Update the paper status and
              provide feedback to the student.
            </p>


            <div className="mt-5">

              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                Paper Status
              </label>

              <select
                value={
                  status
                }
                onChange={(
                  e
                ) =>
                  setStatus(
                    e.target
                      .value
                  )
                }
                className="w-full mt-2 px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              >

                <option value="draft">
                  Draft
                </option>

                <option value="under review">
                  Under Review
                </option>

                <option value="revision required">
                  Revision Required
                </option>

                <option value="accepted">
                  Accepted
                </option>

              </select>

            </div>


            <div className="mt-5">

              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                Feedback
              </label>

              <textarea
                value={
                  feedback
                }
                onChange={(
                  e
                ) =>
                  setFeedback(
                    e.target
                      .value
                  )
                }
                rows={6}
                placeholder="Write your feedback for the student..."
                className="w-full mt-2 px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              />

            </div>


            <div className="flex gap-3 mt-6">

              <button
                onClick={
                  onClose
                }
                className="flex-1 px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 font-semibold hover:bg-slate-50 dark:hover:bg-slate-700"
              >
                Cancel
              </button>

              <button
                onClick={
                  handleReview
                }
                disabled={
                  saving
                }
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-50"
              >

                <Send
                  size={17}
                />

                {saving
                  ? "Submitting..."
                  : "Submit Review"}

              </button>

            </div>

          </div>
        )}


        {/* STUDENT ACTION */}

        {userRole ===
          "student" &&
          (
            normalizeStatus(
              paper.status
            ) === "draft" ||
            normalizeStatus(
              paper.status
            ) ===
              "revision required"
          ) && (

            <div className="border-t border-slate-200 dark:border-slate-700 pt-6">

              <div className="rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/40 p-4">

                <p className="text-sm text-blue-700 dark:text-blue-300">
                  This paper can be edited
                  and submitted for supervisor
                  review.
                </p>

              </div>

            </div>
          )}

      </div>

    </Modal>
  );
};


// ============================================================
// DETAIL BOX
// ============================================================

const DetailBox = ({
  icon,
  label,
  value,
}) => {
  return (
    <div className="rounded-xl bg-slate-50 dark:bg-slate-900/50 p-4">

      <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">

        {icon}

        <span className="text-xs font-semibold uppercase tracking-wider">
          {label}
        </span>

      </div>

      <p className="mt-2 font-semibold text-slate-800 dark:text-slate-200 whitespace-pre-wrap">
        {value}
      </p>

    </div>
  );
};


// ============================================================
// FORM FIELD
// ============================================================

const FormField = ({
  label,
  name,
  value,
  onChange,
  placeholder,
  type = "text",
  required = false,
}) => {
  return (
    <div>

      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">

        {label}

        {required && (
          <span className="text-red-500 ml-1">
            *
          </span>
        )}

      </label>

      <input
        type={type}
        name={name}
        value={
          value || ""
        }
        onChange={
          onChange
        }
        placeholder={
          placeholder
        }
        required={
          required
        }
        className="w-full mt-2 px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

    </div>
  );
};


// ============================================================
// MODAL
// ============================================================

const Modal = ({
  title,
  onClose,
  children,
  maxWidth = "max-w-xl",
}) => {
  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">

      <div
        className={`w-full ${maxWidth} max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-800 rounded-2xl shadow-2xl`}
      >

        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 dark:border-slate-700 px-6 py-5 bg-white dark:bg-slate-800">

          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            {title}
          </h2>

          <button
            onClick={
              onClose
            }
            className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"
          >
            <X size={20} />
          </button>

        </div>

        <div className="p-6">
          {children}
        </div>

      </div>

    </div>
  );
};


// ============================================================
// STATUS HELPERS
// ============================================================

const normalizeStatus = (
  status
) => {
  if (!status) {
    return "draft";
  }

  return status
    .toString()
    .trim()
    .toLowerCase()
    .replace(
      /_/g,
      " "
    );
};


const getStatusConfig = (
  status
) => {
  const normalized =
    normalizeStatus(
      status
    );

  return (
    STATUS_CONFIG[
      normalized
    ] ||
    STATUS_CONFIG.draft
  );
};


// ============================================================
// DATE HELPERS
// ============================================================

const formatDate = (
  date
) => {
  if (!date) {
    return "Not provided";
  }

  try {
    const parsed =
      new Date(date);

    if (
      Number.isNaN(
        parsed.getTime()
      )
    ) {
      return "Not provided";
    }

    return parsed.toLocaleDateString(
      "en-US",
      {
        year: "numeric",
        month: "short",
        day: "numeric",
      }
    );
  } catch {
    return "Not provided";
  }
};


const formatInputDate = (
  date
) => {
  if (!date) {
    return "";
  }

  try {
    const parsed =
      new Date(date);

    if (
      Number.isNaN(
        parsed.getTime()
      )
    ) {
      return "";
    }

    return parsed
      .toISOString()
      .split("T")[0];
  } catch {
    return "";
  }
};


// ============================================================
// FILE SIZE HELPER
// ============================================================

const formatFileSize = (
  bytes
) => {
  if (
    !bytes ||
    bytes <= 0
  ) {
    return "Unknown size";
  }

  const units = [
    "Bytes",
    "KB",
    "MB",
    "GB",
  ];

  const index =
    Math.floor(
      Math.log(bytes) /
        Math.log(1024)
    );

  const size =
    bytes /
    Math.pow(
      1024,
      index
    );

  return `${size.toFixed(
    index === 0
      ? 0
      : 2
  )} ${units[index]}`;
};


// ============================================================
// MEMBER HELPERS
// ============================================================

const getMemberNames = (
  group
) => {
  if (!group) {
    return "No members listed";
  }

  const members = [];

  if (
    Array.isArray(
      group.members
    )
  ) {
    members.push(
      ...group.members
    );
  }

  if (
    group.leaderId &&
    !members.some(
      (member) =>
        getObjectId(
          member
        ) ===
        getObjectId(
          group.leaderId
        )
    )
  ) {
    members.push(
      group.leaderId
    );
  }

  const names =
    members
      .map(
        (member) => {
          if (
            typeof member ===
            "string"
          ) {
            return member;
          }

          return (
            member?.fullName ||
            member?.name ||
            ""
          );
        }
      )
      .filter(Boolean);

  return (
    names.join(", ") ||
    "No members listed"
  );
};


const getObjectId = (
  value
) => {
  if (!value) {
    return "";
  }

  if (
    typeof value ===
    "string"
  ) {
    return value;
  }

  return (
    value._id ||
    value.id ||
    ""
  ).toString();
};


// ============================================================
// EXPORT
// ============================================================

export default PaperReviews;
