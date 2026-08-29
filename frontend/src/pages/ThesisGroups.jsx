import React, { useEffect, useState, useRef } from "react";
import {
  Users,
  User,
  BookOpen,
  Activity,
  Plus,
  Search,
  UserCheck,
  UserX,
  X,
} from "lucide-react";

import {
  getMyGroup,
  acceptJoinRequest,
  rejectJoinRequest,
} from "../services/thesisGroupService";

import BrowseGroups from "../components/thesisGroups/BrowseGroups";
import CreateThesisGroup from "../components/thesisGroups/CreateThesisGroup";

const ThesisGroups = () => {
  const [myGroup, setMyGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showBrowseGroups, setShowBrowseGroups] =
    useState(false);

  const [showCreateGroup, setShowCreateGroup] =
    useState(false);

  // ==========================================
  // JOIN REQUEST ACTION STATE
  // ==========================================

  const [processingRequestId, setProcessingRequestId] =
    useState(null);

  // ==========================================
  // ACCEPT MEMBER MODAL STATE
  // ==========================================

  const [showAcceptModal, setShowAcceptModal] =
    useState(false);

  const [selectedRequest, setSelectedRequest] =
    useState(null);

  const [memberRole, setMemberRole] =
    useState("");

  const [memberChapter, setMemberChapter] =
    useState("");

  const [acceptError, setAcceptError] =
    useState("");

  // ==========================================
  // REF FOR BROWSE GROUPS SECTION
  // ==========================================

  const browseGroupsRef = useRef(null);

  // ==========================================
  // GET CURRENT USER
  // ==========================================

  const getCurrentUser = () => {
    try {
      const storedUser = localStorage.getItem(
        "thesisSphereUser"
      );

      if (!storedUser) {
        return null;
      }

      return JSON.parse(storedUser);
    } catch (error) {
      console.error(
        "Failed to read logged-in user:",
        error
      );

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
        err?.message ||
          "Failed to load your thesis group"
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
        myGroup.leaderId?.toString?.() ||
        null;
    }

    if (!leaderId) {
      return false;
    }

    return (
      leaderId.toString() ===
      currentUserId.toString()
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
      (request) =>
        request.status === "pending"
    ) || [];

  // ==========================================
  // OPEN ACCEPT MODAL
  // ==========================================

  const openAcceptModal = (request) => {
    setSelectedRequest(request);

    // Clear previous values
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

    // Validate role
    if (!memberRole.trim()) {
      setAcceptError(
        "Please enter a role for this member."
      );
      return;
    }

    // Validate chapter
    if (!memberChapter.trim()) {
      setAcceptError(
        "Please enter a thesis chapter for this member."
      );
      return;
    }

    try {
      setProcessingRequestId(
        selectedRequest._id
      );

      setAcceptError("");

      await acceptJoinRequest(
        myGroup._id,
        selectedRequest._id,
        {
          role: memberRole.trim(),
          chapter: memberChapter.trim(),
        }
      );

      alert(
        "Join request accepted successfully!"
      );

      // Close modal
      setShowAcceptModal(false);
      setSelectedRequest(null);
      setMemberRole("");
      setMemberChapter("");

      // Reload group so the new member
      // and assigned role/chapter appear
      await loadMyGroup();
    } catch (err) {
      console.error(err);

      setAcceptError(
        err?.message ||
          "Failed to accept join request"
      );
    } finally {
      setProcessingRequestId(null);
    }
  };

  // ==========================================
  // REJECT JOIN REQUEST
  // ==========================================

  const handleRejectRequest = async (
    requestId
  ) => {
    try {
      setProcessingRequestId(requestId);

      await rejectJoinRequest(
        myGroup._id,
        requestId
      );

      alert(
        "Join request rejected successfully!"
      );

      await loadMyGroup();
    } catch (err) {
      console.error(err);

      alert(
        err?.message ||
          "Failed to reject join request"
      );
    } finally {
      setProcessingRequestId(null);
    }
  };

  // ==========================================
  // LOADING
  // ==========================================

  if (loading) {
    return (
      <div className="p-8 text-slate-700">
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
                       text-slate-900"
          >
            Thesis Groups
          </h1>

          <p
            className="text-slate-600
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
                       bg-white
                       text-slate-700
                       font-semibold
                       hover:bg-slate-50
                       transition"
          >
            <Search size={18} />
            Browse Groups
          </button>

          {/* ================= CREATE GROUP ================= */}

          <button
            onClick={() =>
              setShowCreateGroup(true)
            }
            className="flex items-center gap-2
                       px-5 py-3
                       rounded-xl
                       bg-blue-600
                       hover:bg-blue-700
                       text-white
                       font-semibold
                       transition"
          >
            <Plus size={18} />
            Create Group
          </button>

        </div>
      </div>

      {/* ================= ERROR ================= */}

      {error && (
        <div
          className="bg-red-50
                     border border-red-200
                     text-red-700
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
                     border border-slate-200
                     rounded-2xl
                     shadow-sm
                     p-10
                     text-center"
        >
          <div
            className="w-16 h-16
                       mx-auto
                       rounded-full
                       bg-blue-100
                       text-blue-600
                       flex items-center
                       justify-center"
          >
            <Users size={30} />
          </div>

          <h2
            className="text-xl
                       font-bold
                       text-slate-900
                       mt-5"
          >
            You are not in a thesis group
          </h2>

          <p
            className="text-slate-600
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
                       border border-slate-200
                       rounded-2xl
                       shadow-sm
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
                             uppercase
                             tracking-wide"
                >
                  My Thesis Group
                </p>

                <h2
                  className="text-2xl
                             font-bold
                             text-slate-900
                             mt-1"
                >
                  {myGroup.groupName ||
                    "Thesis Group"}
                </h2>
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
                                  ? "bg-green-100 text-green-700"
                                  : "bg-slate-100 text-slate-600"
                              }`}
                >
                  ● {myGroup.status || "Active"}
                </div>

              </div>

            </div>

            {/* ================= THESIS TOPIC ================= */}

            <div
              className="mt-6
                         p-5
                         rounded-xl
                         bg-slate-50
                         border border-slate-200"
            >
              <div
                className="flex
                           items-center
                           gap-2
                           text-slate-800
                           font-semibold"
              >
                <BookOpen size={19} />
                Thesis Topic
              </div>

              <p
                className="text-lg
                           font-semibold
                           text-slate-900
                           mt-2"
              >
                {myGroup.topicId?.title ||
                  "Topic not assigned"}
              </p>

              {myGroup.topicId?.description && (
                <p
                  className="text-slate-600
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
                             font-bold"
                >
                  <Users size={20} />
                  Members
                </div>

                <span
                  className="text-sm
                             font-semibold
                             text-slate-600"
                >
                  {myGroup.members?.length ||
                    0}{" "}
                  / 5
                </span>
              </div>

              <div className="space-y-3">

                {myGroup.members?.map(
                  (member) => {

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
                                   rounded-xl
                                   p-4"
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
                                       text-blue-600
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
                                         text-slate-900"
                            >
                              {member.fullName ||
                                member.name ||
                                "Student"}
                            </h3>

                            <p
                              className="text-sm
                                         text-slate-600"
                            >
                              {details?.role ||
                                "Group Member"}
                            </p>

                            <p
                              className="text-sm
                                         text-slate-500
                                         mt-1"
                            >
                              {details?.chapter ||
                                "Chapter not assigned"}
                            </p>

                          </div>

                        </div>

                      </div>
                    );
                  }
                )}

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
                                 text-blue-700
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
                               rounded-xl
                               p-5
                               bg-slate-50"
                  >
                    <p className="text-slate-600">
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
                                       rounded-xl
                                       p-4
                                       bg-white"
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
                                             text-blue-600
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
                                               text-slate-900"
                                  >
                                    {studentName}
                                  </h3>

                                  {student?.email && (
                                    <p
                                      className="text-sm
                                                 text-slate-500"
                                    >
                                      {student.email}
                                    </p>
                                  )}

                                  {request.requestedAt && (
                                    <p
                                      className="text-xs
                                                 text-slate-400
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
                                className="flex
                                           gap-2"
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
                                             px-4
                                             py-2.5
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
                                  disabled={
                                    isProcessing
                                  }
                                  className="flex
                                             items-center
                                             justify-center
                                             gap-2
                                             px-4
                                             py-2.5
                                             rounded-xl
                                             bg-red-100
                                             hover:bg-red-200
                                             text-red-700
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
                             text-slate-800"
                >
                  Thesis Progress
                </span>

                <span
                  className="font-bold
                             text-blue-600"
                >
                  {myGroup.progress || 0}%
                </span>
              </div>

              <div
                className="w-full
                           h-3
                           bg-slate-200
                           rounded-full
                           overflow-hidden"
              >
                <div
                  className="h-full
                             bg-blue-600
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
                       border border-slate-200
                       rounded-2xl
                       shadow-sm
                       p-6"
          >

            <div
              className="flex
                         items-center
                         gap-2
                         text-xl
                         font-bold
                         text-slate-900
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
                                   mt-2"
                      />

                      <div>

                        <p
                          className="text-slate-800
                                     font-medium"
                        >
                          {activity.description}
                        </p>

                        {activity.createdAt && (
                          <p
                            className="text-sm
                                       text-slate-500
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

              <p className="text-slate-600">
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
                     border border-slate-200
                     rounded-2xl
                     p-6"
        >
          <BrowseGroups />
        </div>
      )}

      {/* ================= CREATE GROUP ================= */}

      {showCreateGroup && (
        <CreateThesisGroup
          onClose={() =>
            setShowCreateGroup(false)
          }
          onGroupCreated={async () => {
            setShowCreateGroup(false);

            await loadMyGroup();
          }}
        />
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
                     px-4"
        >

          <div
            className="w-full
                       max-w-md
                       bg-white
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
                             text-slate-900"
                >
                  Accept Member
                </h2>

                <p
                  className="text-sm
                             text-slate-500
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
                           text-slate-500
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
                           border border-blue-100"
              >
                <p
                  className="text-sm
                             text-slate-500"
                >
                  Student
                </p>

                <p
                  className="font-bold
                             text-slate-900"
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
                           px-4
                           py-3
                           border border-slate-300
                           rounded-xl
                           text-slate-900
                           placeholder:text-slate-400
                           focus:outline-none
                           focus:ring-2
                           focus:ring-blue-500
                           disabled:bg-slate-100"
              />

            </div>

            {/* CHAPTER */}

            <div className="mb-4">

              <label
                className="block
                           text-sm
                           font-semibold
                           text-slate-700
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
                           px-4
                           py-3
                           border border-slate-300
                           rounded-xl
                           text-slate-900
                           placeholder:text-slate-400
                           focus:outline-none
                           focus:ring-2
                           focus:ring-blue-500
                           disabled:bg-slate-100"
              />

            </div>

            {/* MODAL ERROR */}

            {acceptError && (
              <div
                className="mb-4
                           p-3
                           rounded-xl
                           bg-red-50
                           border border-red-200
                           text-red-700
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
                           px-4
                           py-3
                           rounded-xl
                           border border-slate-300
                           bg-white
                           text-slate-700
                           font-semibold
                           hover:bg-slate-50
                           transition
                           disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                onClick={handleAcceptRequest}
                disabled={!!processingRequestId}
                className="flex-1
                           px-4
                           py-3
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