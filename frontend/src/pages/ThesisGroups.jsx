import React, { useEffect, useState, useRef } from "react";
import {
  Users,
  User,
  BookOpen,
  Activity,
  Search,
  UserCheck,
  UserX,
  X,
  Pencil,
  Save,
} from "lucide-react";

import {
  getMyGroup,
  updateThesisGroup,
  acceptJoinRequest,
  rejectJoinRequest,
} from "../services/thesisGroupService";

import BrowseGroups from "../components/thesisGroups/BrowseGroups";

const ThesisGroups = () => {
  const [myGroup, setMyGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showBrowseGroups, setShowBrowseGroups] = useState(false);

  const [isEditingGroup, setIsEditingGroup] = useState(false);
  const [groupNameDraft, setGroupNameDraft] = useState("");
  const [memberDetailsDraft, setMemberDetailsDraft] = useState([]);
  const [savingGroup, setSavingGroup] = useState(false);

  // ==========================================
  // JOIN REQUEST ACTION STATE
  // ==========================================

  const [processingRequestId, setProcessingRequestId] = useState(null);

  // ==========================================
  // ACCEPT MEMBER MODAL STATE
  // ==========================================

  const [showAcceptModal, setShowAcceptModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [memberRole, setMemberRole] = useState("");
  const [memberChapter, setMemberChapter] = useState("");
  const [acceptError, setAcceptError] = useState("");

  // ==========================================
  // REF FOR BROWSE GROUPS SECTION
  // ==========================================

  const browseGroupsRef = useRef(null);

  // ==========================================
  // GET CURRENT USER
  // ==========================================

  const getCurrentUser = () => {
    try {
      const storedUser = localStorage.getItem("thesisSphereUser");

      if (!storedUser) {
        return null;
      }

      return JSON.parse(storedUser);
    } catch (error) {
      console.error("Failed to read logged-in user:", error);
      return null;
    }
  };

  const currentUser = getCurrentUser();

  // ==========================================
  // GET CURRENT USER ID SAFELY
  // ==========================================

  const currentUserId =
    currentUser?._id ||
    currentUser?.id ||
    currentUser?.user?._id ||
    currentUser?.user?.id ||
    null;

  // ==========================================
  // LOAD MY GROUP
  // ==========================================

  const loadMyGroup = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await getMyGroup();

      setMyGroup(response?.data || null);
    } catch (err) {
      console.error(err);

      setError(
        err?.message || "Failed to load your thesis group"
      );

      setMyGroup(null);
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // CHECK WHETHER CURRENT USER IS LEADER
  // ==========================================

  const isGroupLeader = () => {
    if (!myGroup?.leaderId || !currentUserId) {
      return false;
    }

    let leaderId = null;

    if (
      typeof myGroup.leaderId === "object" &&
      myGroup.leaderId !== null
    ) {
      leaderId =
        myGroup.leaderId._id ||
        myGroup.leaderId.id ||
        null;
    }

    if (!leaderId) {
      leaderId =
        myGroup.leaderId?.toString?.() || null;
    }

    if (!leaderId) {
      return false;
    }

    return (
      leaderId.toString() === currentUserId.toString()
    );
  };

  // ==========================================
  // LOAD GROUP ON PAGE LOAD
  // ==========================================

  useEffect(() => {
    loadMyGroup();
  }, []);

  // ==========================================
  // GET PENDING JOIN REQUESTS
  // ==========================================

  const pendingJoinRequests =
    myGroup?.joinRequests?.filter(
      (request) => request.status === "pending"
    ) || [];

  // ==========================================
  // OPEN ACCEPT MODAL
  // ==========================================

  const openAcceptModal = (request) => {
    setSelectedRequest(request);

    setMemberRole("");
    setMemberChapter("");
    setAcceptError("");

    setShowAcceptModal(true);
  };

  // ==========================================
  // CLOSE ACCEPT MODAL
  // ==========================================

  const closeAcceptModal = () => {
    if (processingRequestId) {
      return;
    }

    setShowAcceptModal(false);
    setSelectedRequest(null);
    setMemberRole("");
    setMemberChapter("");
    setAcceptError("");
  };

  // ==========================================
  // ACCEPT JOIN REQUEST
  // ==========================================

  const handleAcceptRequest = async () => {
    if (!selectedRequest) {
      return;
    }

    if (!memberRole.trim()) {
      setAcceptError(
        "Please enter a role for this member."
      );
      return;
    }

    if (!memberChapter.trim()) {
      setAcceptError(
        "Please enter a thesis chapter for this member."
      );
      return;
    }

    try {
      setProcessingRequestId(selectedRequest._id);

      setAcceptError("");

      await acceptJoinRequest(
        myGroup._id,
        selectedRequest._id,
        {
          role: memberRole.trim(),
          chapter: memberChapter.trim(),
        }
      );

      alert("Join request accepted successfully!");

      setShowAcceptModal(false);
      setSelectedRequest(null);
      setMemberRole("");
      setMemberChapter("");

      await loadMyGroup();
    } catch (err) {
      console.error(err);

      setAcceptError(
        err?.message || "Failed to accept join request"
      );
    } finally {
      setProcessingRequestId(null);
    }
  };

  // ==========================================
  // REJECT JOIN REQUEST
  // ==========================================

  const handleRejectRequest = async (requestId) => {
    try {
      setProcessingRequestId(requestId);

      await rejectJoinRequest(
        myGroup._id,
        requestId
      );

      alert("Join request rejected successfully!");

      await loadMyGroup();
    } catch (err) {
      console.error(err);

      alert(
        err?.message || "Failed to reject join request"
      );
    } finally {
      setProcessingRequestId(null);
    }
  };

  // ==========================================
  // EDIT GROUP
  // ==========================================

  const startEditingGroup = () => {
    setGroupNameDraft(myGroup.groupName || "");

    setMemberDetailsDraft(
      (myGroup.members || []).map((member) => {
        const details = myGroup.memberDetails?.find(
          (item) =>
            (
              item.userId?._id ||
              item.userId
            )?.toString() === member._id?.toString()
        );

        return {
          userId: member._id,
          role: details?.role || "",
          chapter: details?.chapter || "",
        };
      })
    );

    setError("");
    setIsEditingGroup(true);
  };

  const updateMemberDetailDraft = (
    userId,
    field,
    value
  ) => {
    setMemberDetailsDraft((details) =>
      details.map((detail) =>
        detail.userId.toString() === userId.toString()
          ? { ...detail, [field]: value }
          : detail
      )
    );
  };

  const saveGroupDetails = async () => {
    if (!groupNameDraft.trim()) {
      setError("Group name is required.");
      return;
    }

    if (
      memberDetailsDraft.some(
        (detail) =>
          !detail.role.trim() ||
          !detail.chapter.trim()
      )
    ) {
      setError("Each member needs a role and chapter.");
      return;
    }

    try {
      setSavingGroup(true);
      setError("");

      const response = await updateThesisGroup(
        myGroup._id,
        {
          groupName: groupNameDraft.trim(),
          memberDetails: memberDetailsDraft,
        }
      );

      setMyGroup(response.data);
      setIsEditingGroup(false);
    } catch (err) {
      setError(
        err?.message ||
          "Failed to update thesis group"
      );
    } finally {
      setSavingGroup(false);
    }
  };

  // ==========================================
  // LOADING
  // ==========================================

  if (loading) {
    return (
      <div className="p-8 text-slate-700 dark:text-slate-300">
        Loading thesis groups...
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">

      {/* ================= HEADER ================= */}

      <div
        className="flex flex-col
                   md:flex-row
                   md:items-center
                   md:justify-between
                   gap-4"
      >
        <div>
          <h1
            className="text-3xl
                       font-bold
                       text-slate-900
                       dark:text-white"
          >
            Thesis Groups
          </h1>

          <p
            className="text-slate-600
                       dark:text-slate-400
                       mt-1"
          >
            Manage your thesis group and explore
            other groups.
          </p>
        </div>

        <div className="flex gap-3">

          {/* ================= BROWSE GROUPS ================= */}

          <button
            onClick={() => {
              if (!showBrowseGroups) {
                setShowBrowseGroups(true);

                setTimeout(() => {
                  browseGroupsRef.current?.scrollIntoView({
                    behavior: "smooth",
                    block: "start",
                  });
                }, 100);
              } else {
                browseGroupsRef.current?.scrollIntoView({
                  behavior: "smooth",
                  block: "start",
                });
              }
            }}
            className="flex items-center gap-2
                       px-5 py-3
                       rounded-xl
                       border border-slate-300
                       dark:border-slate-700
                       bg-white
                       dark:bg-slate-800
                       text-slate-700
                       dark:text-slate-200
                       font-semibold
                       hover:bg-slate-50
                       dark:hover:bg-slate-700
                       transition"
          >
            <Search size={18} />
            Browse Groups
          </button>

        </div>
      </div>

      {/* ================= ERROR ================= */}

      {error && (
        <div
          className="bg-red-50
                     dark:bg-red-950/40
                     border border-red-200
                     dark:border-red-900
                     text-red-700
                     dark:text-red-300
                     rounded-xl
                     p-4"
        >
          {error}
        </div>
      )}

      {/* ================= NO GROUP ================= */}

      {!myGroup && !error && (
        <div
          className="bg-white
                     dark:bg-slate-900
                     border border-slate-200
                     dark:border-slate-800
                     rounded-2xl
                     shadow-sm
                     dark:shadow-none
                     p-10
                     text-center"
        >
          <div
            className="w-16 h-16
                       mx-auto
                       rounded-full
                       bg-blue-100
                       dark:bg-blue-950/50
                       text-blue-600
                       dark:text-blue-400
                       flex items-center
                       justify-center"
          >
            <Users size={30} />
          </div>

          <h2
            className="text-xl
                       font-bold
                       text-slate-900
                       dark:text-white
                       mt-5"
          >
            You are not in a thesis group
          </h2>

          <p
            className="text-slate-600
                       dark:text-slate-400
                       mt-2
                       max-w-md
                       mx-auto"
          >
            Create a new thesis group or browse
            existing groups to find students
            working on similar research topics.
          </p>
        </div>
      )}

      {/* ================= MY GROUP ================= */}

      {myGroup && (
        <>

          <div
            className="bg-white
                       dark:bg-slate-900
                       border border-slate-200
                       dark:border-slate-800
                       rounded-2xl
                       shadow-sm
                       dark:shadow-none
                       p-6"
          >

            {/* ================= GROUP HEADER ================= */}

            <div
              className="flex flex-col
                         md:flex-row
                         md:items-center
                         md:justify-between
                         gap-4"
            >

              <div>
                <p
                  className="text-sm
                             font-semibold
                             text-blue-600
                             dark:text-blue-400
                             uppercase
                             tracking-wide"
                >
                  My Thesis Group
                </p>

                {isEditingGroup ? (
                  <input
                    value={groupNameDraft}
                    onChange={(event) =>
                      setGroupNameDraft(
                        event.target.value
                      )
                    }
                    className="mt-1 w-full max-w-md
                               rounded-lg
                               border border-slate-300
                               dark:border-slate-700
                               bg-white
                               dark:bg-slate-800
                               px-3 py-2
                               text-xl font-bold
                               text-slate-900
                               dark:text-white
                               focus:outline-none
                               focus:ring-2
                               focus:ring-blue-500"
                    aria-label="Group name"
                  />
                ) : (
                  <h2
                    className="text-2xl
                               font-bold
                               text-slate-900
                               dark:text-white
                               mt-1"
                  >
                    {myGroup.groupName ||
                      "Thesis Group"}
                  </h2>
                )}
              </div>

              <div
                className="flex
                           items-center
                           gap-3
                           flex-wrap"
              >

                <div
                  className={`px-4 py-2
                              rounded-full
                              text-sm
                              font-semibold
                              w-fit
                              ${
                                myGroup.status ===
                                "active"
                                  ? "bg-green-100 text-green-700 dark:bg-green-950/50 dark:text-green-400"
                                  : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                              }`}
                >
                  ● {myGroup.status || "Active"}
                </div>

                {isGroupLeader() && (
                  <button
                    onClick={
                      isEditingGroup
                        ? saveGroupDetails
                        : startEditingGroup
                    }
                    disabled={savingGroup}
                    className="flex items-center gap-2
                               rounded-lg
                               bg-blue-600
                               px-4 py-2
                               text-sm font-semibold
                               text-white
                               transition
                               hover:bg-blue-700
                               disabled:opacity-60"
                  >
                    {isEditingGroup ? (
                      <Save size={16} />
                    ) : (
                      <Pencil size={16} />
                    )}

                    {savingGroup
                      ? "Saving..."
                      : isEditingGroup
                      ? "Save"
                      : "Edit group"}
                  </button>
                )}

                {isEditingGroup && (
                  <button
                    onClick={() =>
                      setIsEditingGroup(false)
                    }
                    disabled={savingGroup}
                    className="rounded-lg
                               border border-slate-300
                               dark:border-slate-700
                               px-4 py-2
                               text-sm font-semibold
                               text-slate-700
                               dark:text-slate-200
                               bg-white
                               dark:bg-slate-800
                               hover:bg-slate-50
                               dark:hover:bg-slate-700
                               disabled:opacity-60"
                  >
                    Cancel
                  </button>
                )}

              </div>

            </div>

            {/* ================= THESIS TOPIC ================= */}

            <div
              className="mt-6
                         p-5
                         rounded-xl
                         bg-slate-50
                         dark:bg-slate-800/70
                         border border-slate-200
                         dark:border-slate-700"
            >
              <div
                className="flex
                           items-center
                           gap-2
                           text-slate-800
                           dark:text-slate-200
                           font-semibold"
              >
                <BookOpen size={19} />
                Thesis Topic
              </div>

              <p
                className="text-lg
                           font-semibold
                           text-slate-900
                           dark:text-white
                           mt-2"
              >
                {myGroup.topicId?.title ||
                  "Topic not assigned"}
              </p>

              {myGroup.topicId?.description && (
                <p
                  className="text-slate-600
                             dark:text-slate-400
                             mt-2"
                >
                  {myGroup.topicId.description}
                </p>
              )}
            </div>

            {/* ================= MEMBERS ================= */}

            <div className="mt-6">

              <div
                className="flex
                           items-center
                           justify-between
                           mb-4"
              >
                <div
                  className="flex
                             items-center
                             gap-2
                             text-slate-900
                             dark:text-white
                             font-bold"
                >
                  <Users size={20} />
                  Members
                </div>

                <span
                  className="text-sm
                             font-semibold
                             text-slate-600
                             dark:text-slate-400"
                >
                  {myGroup.members?.length || 0} / 5
                </span>
              </div>

              <div className="space-y-3">

                {myGroup.members?.map((member) => {

                  const details =
                    myGroup.memberDetails?.find(
                      (item) =>
                        (
                          item.userId?._id ||
                          item.userId
                        )?.toString() ===
                        member._id?.toString()
                    );

                  return (
                    <div
                      key={member._id}
                      className="border
                                 border-slate-200
                                 dark:border-slate-700
                                 rounded-xl
                                 p-4
                                 bg-white
                                 dark:bg-slate-800/50"
                    >

                      <div
                        className="flex
                                   items-start
                                   gap-4"
                      >

                        <div
                          className="w-11 h-11
                                     rounded-full
                                     bg-blue-100
                                     dark:bg-blue-950/50
                                     text-blue-600
                                     dark:text-blue-400
                                     flex
                                     items-center
                                     justify-center
                                     shrink-0"
                        >
                          <User size={22} />
                        </div>

                        <div className="flex-1">

                          <h3
                            className="font-bold
                                       text-slate-900
                                       dark:text-white"
                          >
                            {member.fullName ||
                              member.name ||
                              "Student"}
                          </h3>

                          {isEditingGroup ? (
                            <div
                              className="mt-2
                                         grid gap-2
                                         sm:grid-cols-2"
                            >
                              <input
                                value={
                                  memberDetailsDraft.find(
                                    (item) =>
                                      item.userId.toString() ===
                                      member._id.toString()
                                  )?.role || ""
                                }
                                onChange={(event) =>
                                  updateMemberDetailDraft(
                                    member._id,
                                    "role",
                                    event.target.value
                                  )
                                }
                                className="rounded-lg
                                           border border-slate-300
                                           dark:border-slate-700
                                           bg-white
                                           dark:bg-slate-800
                                           px-3 py-2
                                           text-sm
                                           text-slate-900
                                           dark:text-white
                                           placeholder:text-slate-400
                                           focus:outline-none
                                           focus:ring-2
                                           focus:ring-blue-500"
                                placeholder="Role"
                                aria-label={`${member.fullName || "Member"} role`}
                              />

                              <input
                                value={
                                  memberDetailsDraft.find(
                                    (item) =>
                                      item.userId.toString() ===
                                      member._id.toString()
                                  )?.chapter || ""
                                }
                                onChange={(event) =>
                                  updateMemberDetailDraft(
                                    member._id,
                                    "chapter",
                                    event.target.value
                                  )
                                }
                                className="rounded-lg
                                           border border-slate-300
                                           dark:border-slate-700
                                           bg-white
                                           dark:bg-slate-800
                                           px-3 py-2
                                           text-sm
                                           text-slate-900
                                           dark:text-white
                                           placeholder:text-slate-400
                                           focus:outline-none
                                           focus:ring-2
                                           focus:ring-blue-500"
                                placeholder="Chapter"
                                aria-label={`${member.fullName || "Member"} chapter`}
                              />
                            </div>
                          ) : (
                            <>
                              <p
                                className="text-sm
                                           text-slate-600
                                           dark:text-slate-400"
                              >
                                {details?.role ||
                                  "Group Member"}
                              </p>

                              <p
                                className="text-sm
                                           text-slate-500
                                           dark:text-slate-500
                                           mt-1"
                              >
                                {details?.chapter ||
                                  "Chapter not assigned"}
                              </p>
                            </>
                          )}

                        </div>

                      </div>

                    </div>
                  );
                })}

              </div>

            </div>

            {/* ================= JOIN REQUESTS ================= */}

            {isGroupLeader() && (
              <div className="mt-8">

                <div
                  className="flex
                             items-center
                             justify-between
                             mb-4"
                >

                  <div
                    className="flex
                               items-center
                               gap-2
                               text-slate-900
                               dark:text-white
                               font-bold"
                  >
                    <UserCheck size={20} />
                    Join Requests
                  </div>

                  {pendingJoinRequests.length > 0 && (
                    <span
                      className="px-3 py-1
                                 rounded-full
                                 bg-blue-100
                                 dark:bg-blue-950/50
                                 text-blue-700
                                 dark:text-blue-400
                                 text-sm
                                 font-bold"
                    >
                      {pendingJoinRequests.length}
                    </span>
                  )}

                </div>

                {pendingJoinRequests.length === 0 ? (

                  <div
                    className="border
                               border-slate-200
                               dark:border-slate-700
                               rounded-xl
                               p-5
                               bg-slate-50
                               dark:bg-slate-800/70"
                  >
                    <p
                      className="text-slate-600
                                 dark:text-slate-400"
                    >
                      No pending join requests.
                    </p>
                  </div>

                ) : (

                  <div className="space-y-3">

                    {pendingJoinRequests.map(
                      (request) => {

                        const student =
                          request.studentId;

                        const studentName =
                          student?.fullName ||
                          student?.name ||
                          "Student";

                        const isProcessing =
                          processingRequestId ===
                          request._id;

                        return (
                          <div
                            key={request._id}
                            className="border
                                       border-slate-200
                                       dark:border-slate-700
                                       rounded-xl
                                       p-4
                                       bg-white
                                       dark:bg-slate-800/50"
                          >

                            <div
                              className="flex
                                         flex-col
                                         md:flex-row
                                         md:items-center
                                         md:justify-between
                                         gap-4"
                            >

                              {/* STUDENT INFO */}

                              <div
                                className="flex
                                           items-center
                                           gap-4"
                              >

                                <div
                                  className="w-11 h-11
                                             rounded-full
                                             bg-blue-100
                                             dark:bg-blue-950/50
                                             text-blue-600
                                             dark:text-blue-400
                                             flex
                                             items-center
                                             justify-center
                                             shrink-0"
                                >
                                  <User size={22} />
                                </div>

                                <div>

                                  <h3
                                    className="font-bold
                                               text-slate-900
                                               dark:text-white"
                                  >
                                    {studentName}
                                  </h3>

                                  {student?.email && (
                                    <p
                                      className="text-sm
                                                 text-slate-500
                                                 dark:text-slate-400"
                                    >
                                      {student.email}
                                    </p>
                                  )}

                                  {request.requestedAt && (
                                    <p
                                      className="text-xs
                                                 text-slate-400
                                                 dark:text-slate-500
                                                 mt-1"
                                    >
                                      Requested{" "}
                                      {new Date(
                                        request.requestedAt
                                      ).toLocaleString()}
                                    </p>
                                  )}

                                </div>

                              </div>

                              {/* ACTION BUTTONS */}

                              <div
                                className="flex gap-2"
                              >

                                {/* ACCEPT */}

                                <button
                                  onClick={() =>
                                    openAcceptModal(
                                      request
                                    )
                                  }
                                  disabled={
                                    isProcessing ||
                                    myGroup.members
                                      ?.length >= 5
                                  }
                                  className="flex
                                             items-center
                                             justify-center
                                             gap-2
                                             px-4 py-2.5
                                             rounded-xl
                                             bg-green-600
                                             hover:bg-green-700
                                             text-white
                                             font-semibold
                                             transition
                                             disabled:opacity-50
                                             disabled:cursor-not-allowed"
                                >
                                  <UserCheck size={17} />

                                  {isProcessing
                                    ? "Processing..."
                                    : "Accept"}
                                </button>

                                {/* REJECT */}

                                <button
                                  onClick={() =>
                                    handleRejectRequest(
                                      request._id
                                    )
                                  }
                                  disabled={isProcessing}
                                  className="flex
                                             items-center
                                             justify-center
                                             gap-2
                                             px-4 py-2.5
                                             rounded-xl
                                             bg-red-100
                                             dark:bg-red-950/40
                                             hover:bg-red-200
                                             dark:hover:bg-red-950/60
                                             text-red-700
                                             dark:text-red-400
                                             font-semibold
                                             transition
                                             disabled:opacity-50
                                             disabled:cursor-not-allowed"
                                >
                                  <UserX size={17} />
                                  Reject
                                </button>

                              </div>

                            </div>

                          </div>
                        );
                      }
                    )}

                  </div>

                )}

              </div>
            )}

            {/* ================= PROGRESS ================= */}

            <div className="mt-6">

              <div
                className="flex
                           justify-between
                           items-center
                           mb-2"
              >
                <span
                  className="font-semibold
                             text-slate-800
                             dark:text-slate-200"
                >
                  Thesis Progress
                </span>

                <span
                  className="font-bold
                             text-blue-600
                             dark:text-blue-400"
                >
                  {myGroup.progress || 0}%
                </span>
              </div>

              <div
                className="w-full
                           h-3
                           bg-slate-200
                           dark:bg-slate-700
                           rounded-full
                           overflow-hidden"
              >
                <div
                  className="h-full
                             bg-blue-600
                             dark:bg-blue-500
                             rounded-full
                             transition-all"
                  style={{
                    width: `${
                      myGroup.progress || 0
                    }%`,
                  }}
                />
              </div>

            </div>

          </div>

          {/* ================= RECENT ACTIVITY ================= */}

          <div
            className="bg-white
                       dark:bg-slate-900
                       border border-slate-200
                       dark:border-slate-800
                       rounded-2xl
                       shadow-sm
                       dark:shadow-none
                       p-6"
          >

            <div
              className="flex
                         items-center
                         gap-2
                         text-xl
                         font-bold
                         text-slate-900
                         dark:text-white
                         mb-5"
            >
              <Activity size={21} />
              Recent Activity
            </div>

            {myGroup.recentActivity?.length ? (

              <div className="space-y-4">

                {myGroup.recentActivity.map(
                  (activity, index) => (

                    <div
                      key={index}
                      className="flex
                                 items-start
                                 gap-3"
                    >

                      <div
                        className="w-2 h-2
                                   rounded-full
                                   bg-blue-600
                                   dark:bg-blue-500
                                   mt-2"
                      />

                      <div>

                        <p
                          className="text-slate-800
                                     dark:text-slate-200
                                     font-medium"
                        >
                          {activity.description}
                        </p>

                        {activity.createdAt && (
                          <p
                            className="text-sm
                                       text-slate-500
                                       dark:text-slate-500
                                       mt-1"
                          >
                            {new Date(
                              activity.createdAt
                            ).toLocaleString()}
                          </p>
                        )}

                      </div>

                    </div>
                  )
                )}

              </div>

            ) : (

              <p
                className="text-slate-600
                           dark:text-slate-400"
              >
                No recent activity.
              </p>

            )}

          </div>

        </>
      )}

      {/* ================= BROWSE GROUPS ================= */}

      {showBrowseGroups && (
        <div
          ref={browseGroupsRef}
          className="bg-slate-50
                     dark:bg-slate-900
                     border border-slate-200
                     dark:border-slate-800
                     rounded-2xl
                     p-6"
        >
          <BrowseGroups hasGroup={Boolean(myGroup)} />
        </div>
      )}

      {/* ===================================================== */}
      {/* ACCEPT MEMBER MODAL */}
      {/* ===================================================== */}

      {showAcceptModal && (
        <div
          className="fixed inset-0
                     z-50
                     flex
                     items-center
                     justify-center
                     bg-black/50
                     dark:bg-black/70
                     px-4"
        >

          <div
            className="w-full
                       max-w-md
                       bg-white
                       dark:bg-slate-900
                       border border-transparent
                       dark:border-slate-800
                       rounded-2xl
                       shadow-xl
                       p-6"
          >

            {/* MODAL HEADER */}

            <div
              className="flex
                         items-center
                         justify-between
                         mb-5"
            >

              <div>

                <h2
                  className="text-xl
                             font-bold
                             text-slate-900
                             dark:text-white"
                >
                  Accept Member
                </h2>

                <p
                  className="text-sm
                             text-slate-500
                             dark:text-slate-400
                             mt-1"
                >
                  Assign a role and thesis chapter
                  to this member.
                </p>

              </div>

              <button
                onClick={closeAcceptModal}
                disabled={!!processingRequestId}
                className="p-2
                           rounded-lg
                           hover:bg-slate-100
                           dark:hover:bg-slate-800
                           text-slate-500
                           dark:text-slate-400
                           disabled:opacity-50"
              >
                <X size={20} />
              </button>

            </div>

            {/* STUDENT NAME */}

            {selectedRequest?.studentId && (
              <div
                className="mb-5
                           p-3
                           rounded-xl
                           bg-blue-50
                           dark:bg-blue-950/40
                           border border-blue-100
                           dark:border-blue-900"
              >

                <p
                  className="text-sm
                             text-slate-500
                             dark:text-slate-400"
                >
                  Student
                </p>

                <p
                  className="font-bold
                             text-slate-900
                             dark:text-white"
                >
                  {selectedRequest.studentId.fullName ||
                    selectedRequest.studentId.name ||
                    "Student"}
                </p>

              </div>
            )}

            {/* ROLE */}

            <div className="mb-4">

              <label
                className="block
                           text-sm
                           font-semibold
                           text-slate-700
                           dark:text-slate-300
                           mb-2"
              >
                Role
              </label>

              <input
                type="text"
                value={memberRole}
                onChange={(e) =>
                  setMemberRole(e.target.value)
                }
                placeholder="e.g. Developer, Researcher, Designer"
                disabled={!!processingRequestId}
                className="w-full
                           px-4 py-3
                           border border-slate-300
                           dark:border-slate-700
                           rounded-xl
                           bg-white
                           dark:bg-slate-800
                           text-slate-900
                           dark:text-white
                           placeholder:text-slate-400
                           focus:outline-none
                           focus:ring-2
                           focus:ring-blue-500
                           disabled:bg-slate-100
                           dark:disabled:bg-slate-800"
              />

            </div>

            {/* CHAPTER */}

            <div className="mb-4">

              <label
                className="block
                           text-sm
                           font-semibold
                           text-slate-700
                           dark:text-slate-300
                           mb-2"
              >
                Thesis Chapter
              </label>

              <input
                type="text"
                value={memberChapter}
                onChange={(e) =>
                  setMemberChapter(e.target.value)
                }
                placeholder="e.g. Introduction, Methodology, Results"
                disabled={!!processingRequestId}
                className="w-full
                           px-4 py-3
                           border border-slate-300
                           dark:border-slate-700
                           rounded-xl
                           bg-white
                           dark:bg-slate-800
                           text-slate-900
                           dark:text-white
                           placeholder:text-slate-400
                           focus:outline-none
                           focus:ring-2
                           focus:ring-blue-500
                           disabled:bg-slate-100
                           dark:disabled:bg-slate-800"
              />

            </div>

            {/* MODAL ERROR */}

            {acceptError && (
              <div
                className="mb-4
                           p-3
                           rounded-xl
                           bg-red-50
                           dark:bg-red-950/40
                           border border-red-200
                           dark:border-red-900
                           text-red-700
                           dark:text-red-300
                           text-sm"
              >
                {acceptError}
              </div>
            )}

            {/* ACTIONS */}

            <div
              className="flex
                         gap-3
                         mt-6"
            >

              <button
                onClick={closeAcceptModal}
                disabled={!!processingRequestId}
                className="flex-1
                           px-4 py-3
                           rounded-xl
                           border border-slate-300
                           dark:border-slate-700
                           bg-white
                           dark:bg-slate-800
                           text-slate-700
                           dark:text-slate-200
                           font-semibold
                           hover:bg-slate-50
                           dark:hover:bg-slate-700
                           transition
                           disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                onClick={handleAcceptRequest}
                disabled={!!processingRequestId}
                className="flex-1
                           px-4 py-3
                           rounded-xl
                           bg-green-600
                           hover:bg-green-700
                           text-white
                           font-semibold
                           transition
                           disabled:opacity-50
                           disabled:cursor-not-allowed"
              >
                {processingRequestId
                  ? "Accepting..."
                  : "Accept Member"}
              </button>

            </div>

          </div>

        </div>
      )}

    </div>
  );
};

export default ThesisGroups;
