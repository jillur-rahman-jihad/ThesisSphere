import React, { useEffect, useState } from "react";

import {
  Users,
  User,
  BookOpen,
  Activity,
  TrendingUp,
  Edit3,
  UserPlus,
  UserMinus,
  X,
  RefreshCw,
} from "lucide-react";

import {
  getSupervisorGroups,
  getSupervisorGroupDetails,
  updateGroupProgress,
  updateMemberResponsibility,
  removeMemberFromGroup,
} from "../services/supervisorGroupManagerService";

const SupervisorGroupManager = () => {
  const [groups, setGroups] = useState([]);

  const [selectedGroup, setSelectedGroup] = useState(null);

  const [loading, setLoading] = useState(true);

  const [detailsLoading, setDetailsLoading] = useState(false);

  const [error, setError] = useState("");

  const [showResponsibilityModal, setShowResponsibilityModal] =
    useState(false);

  const [selectedMember, setSelectedMember] = useState(null);

  const [memberRole, setMemberRole] = useState("");

  const [memberChapter, setMemberChapter] = useState("");

  const [saving, setSaving] = useState(false);

  // ============================================================
  // LOAD SUPERVISOR GROUPS
  // ============================================================

  const loadGroups = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await getSupervisorGroups();

      setGroups(response.data || []);
    } catch (err) {
      console.error(err);

      setError(err.message || "Failed to load supervisor groups.");
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // LOAD GROUP DETAILS
  // ============================================================

  const openGroup = async (groupId) => {
    try {
      setDetailsLoading(true);
      setError("");

      const response = await getSupervisorGroupDetails(groupId);

      setSelectedGroup(response.data);
    } catch (err) {
      console.error(err);

      setError(err.message || "Failed to load group details.");
    } finally {
      setDetailsLoading(false);
    }
  };

  useEffect(() => {
    loadGroups();
  }, []);

  // ============================================================
  // UPDATE PROGRESS
  // ============================================================

  const handleProgressChange = async (value) => {
    if (!selectedGroup) return;

    try {
      setSaving(true);

      const response = await updateGroupProgress(
        selectedGroup._id,
        Number(value)
      );

      setSelectedGroup((prev) => ({
        ...prev,
        progress: response.data.progress,
      }));

      setGroups((prev) =>
        prev.map((group) =>
          group._id === selectedGroup._id
            ? {
                ...group,
                progress: response.data.progress,
              }
            : group
        )
      );
    } catch (err) {
      alert(err.message || "Failed to update progress.");
    } finally {
      setSaving(false);
    }
  };

  // ============================================================
  // OPEN RESPONSIBILITY MODAL
  // ============================================================

  const openResponsibilityModal = (member) => {
    setSelectedMember(member);

    setMemberRole(member.role === "Not assigned" ? "" : member.role);

    setMemberChapter(
      member.chapter === "Not assigned" ? "" : member.chapter
    );

    setShowResponsibilityModal(true);
  };

  // ============================================================
  // SAVE RESPONSIBILITY
  // ============================================================

  const saveResponsibility = async () => {
    if (!selectedMember) return;

    if (!memberRole.trim()) {
      alert("Please enter a role.");
      return;
    }

    if (!memberChapter.trim()) {
      alert("Please enter a thesis chapter.");
      return;
    }

    try {
      setSaving(true);

      await updateMemberResponsibility(
        selectedGroup._id,
        selectedMember._id,
        {
          role: memberRole.trim(),
          chapter: memberChapter.trim(),
        }
      );

      await openGroup(selectedGroup._id);

      setShowResponsibilityModal(false);
    } catch (err) {
      alert(err.message || "Failed to update responsibility.");
    } finally {
      setSaving(false);
    }
  };

  // ============================================================
  // REMOVE MEMBER
  // ============================================================

  const handleRemoveMember = async (member) => {
    if (!selectedGroup) return;

    const confirmed = window.confirm(
      `Remove ${member.fullName} from this thesis group?`
    );

    if (!confirmed) return;

    try {
      setSaving(true);

      await removeMemberFromGroup(selectedGroup._id, member._id);

      await openGroup(selectedGroup._id);

      await loadGroups();
    } catch (err) {
      alert(err.message || "Failed to remove member.");
    } finally {
      setSaving(false);
    }
  };

  // ============================================================
  // LOADING
  // ============================================================

  if (loading) {
    return (
      <div className="p-8 bg-slate-900 min-h-screen">
        <div className="flex items-center gap-3 text-slate-200">
          <RefreshCw size={20} className="animate-spin" />
          Loading your thesis groups...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 p-6 md:p-8">
      {/* ======================================================
          HEADER
      ====================================================== */}

      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-blue-400">
              Supervisor Workspace
            </p>

            <h1 className="text-3xl font-bold text-white mt-1">
              Group Manager
            </h1>

            <p className="text-slate-400 mt-2">
              Monitor your assigned thesis groups, members,
              responsibilities and progress.
            </p>
          </div>

          <button
            onClick={loadGroups}
            className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-slate-700 bg-slate-800 text-slate-200 font-semibold hover:bg-slate-700"
          >
            <RefreshCw size={17} />
            Refresh
          </button>
        </div>
      </div>

      {/* ======================================================
          ERROR
      ====================================================== */}

      {error && (
        <div className="mb-6 rounded-xl border border-red-800 bg-red-950/50 p-4 text-red-300">
          {error}
        </div>
      )}

      {/* ======================================================
          GROUP SUMMARY
      ====================================================== */}

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <SummaryCard
          icon={<Users size={21} />}
          label="Assigned Groups"
          value={groups.length}
        />

        <SummaryCard
          icon={<User size={21} />}
          label="Total Students"
          value={groups.reduce(
            (total, group) =>
              total + (group.members?.length || 0),
            0
          )}
        />

        <SummaryCard
          icon={<TrendingUp size={21} />}
          label="Average Progress"
          value={
            groups.length
              ? `${Math.round(
                  groups.reduce(
                    (total, group) =>
                      total + (group.progress || 0),
                    0
                  ) / groups.length
                )}%`
              : "0%"
          }
        />

        <SummaryCard
          icon={<Activity size={21} />}
          label="Active Groups"
          value={groups.length}
        />
      </div>

      {/* ======================================================
          GROUP LIST
      ====================================================== */}

      {!selectedGroup ? (
        <div>
          {groups.length === 0 ? (
            <div className="rounded-2xl border border-slate-700 bg-slate-800 p-12 text-center">
              <Users
                size={45}
                className="mx-auto text-slate-500"
              />

              <h2 className="mt-4 text-xl font-bold text-white">
                No Assigned Groups
              </h2>

              <p className="mt-2 text-slate-400">
                You currently have no active thesis groups assigned
                to you.
              </p>
            </div>
          ) : (
            <div className="grid gap-5 lg:grid-cols-2">
              {groups.map((group) => (
                <button
                  key={group._id}
                  onClick={() => openGroup(group._id)}
                  className="text-left rounded-2xl border border-slate-700 bg-slate-800 p-6 shadow-sm hover:shadow-md hover:border-blue-500 transition"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-wider font-semibold text-blue-400">
                        Thesis Group
                      </p>

                      <h2 className="text-xl font-bold text-white mt-1">
                        {group.groupName}
                      </h2>
                    </div>

                    <span className="px-3 py-1 rounded-full bg-green-900/50 text-green-300 text-xs font-semibold">
                      {group.status}
                    </span>
                  </div>

                  {/* LEADER */}

                  <div className="mt-5 flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-blue-900/60 flex items-center justify-center text-blue-400">
                      <User size={19} />
                    </div>

                    <div>
                      <p className="text-xs text-slate-500">
                        Group Leader
                      </p>

                      <p className="font-semibold text-white">
                        {group.leaderId?.fullName || "Unknown"}
                      </p>
                    </div>
                  </div>

                  {/* TOPIC */}

                  <div className="mt-5 flex items-start gap-3">
                    <BookOpen
                      size={19}
                      className="text-slate-400 mt-1"
                    />

                    <div>
                      <p className="text-xs text-slate-500">
                        Thesis Topic
                      </p>

                      <p className="font-medium text-slate-200">
                        {group.topicId?.title ||
                          "Topic not assigned"}
                      </p>
                    </div>
                  </div>

                  {/* BOTTOM STATS */}

                  <div className="mt-6 grid grid-cols-2 gap-3">
                    <div className="rounded-xl bg-slate-700/50 p-4">
                      <p className="text-xs text-slate-400">
                        Members
                      </p>

                      <p className="text-xl font-bold text-white">
                        {group.members?.length || 0}/5
                      </p>
                    </div>

                    <div className="rounded-xl bg-slate-700/50 p-4">
                      <p className="text-xs text-slate-400">
                        Progress
                      </p>

                      <p className="text-xl font-bold text-blue-400">
                        {group.progress || 0}%
                      </p>
                    </div>
                  </div>

                  {/* PROGRESS */}

                  <div className="mt-4">
                    <div className="h-2 rounded-full bg-slate-700 overflow-hidden">
                      <div
                        className="h-full bg-blue-600 rounded-full"
                        style={{
                          width: `${group.progress || 0}%`,
                        }}
                      />
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* ====================================================
           GROUP DETAILS
        ==================================================== */

        <div>
          <button
            onClick={() => setSelectedGroup(null)}
            className="mb-5 text-blue-400 font-semibold hover:underline"
          >
            ← Back to My Groups
          </button>

          {detailsLoading ? (
            <div className="p-10 text-center text-slate-300">
              Loading group details...
            </div>
          ) : (
            <>
              {/* GROUP HEADER */}

              <div className="rounded-3xl bg-gradient-to-r from-indigo-700 via-violet-700 to-sky-600 p-7 md:p-8 text-white">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">
                  <div>
                    <p className="text-white/70 text-sm uppercase tracking-wider">
                      Assigned Thesis Group
                    </p>

                    <h1 className="text-3xl font-bold mt-1">
                      {selectedGroup.groupName}
                    </h1>

                    <p className="mt-2 text-white/80">
                      Leader:{" "}
                      <span className="font-semibold">
                        {selectedGroup.leaderId?.fullName}
                      </span>
                    </p>
                  </div>

                  <div className="rounded-2xl bg-white/10 px-5 py-4">
                    <p className="text-sm text-white/70">
                      Current Progress
                    </p>

                    <p className="text-3xl font-bold">
                      {selectedGroup.progress || 0}%
                    </p>
                  </div>
                </div>
              </div>

              {/* STATISTICS */}

              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4 mt-6">
                <SummaryCard
                  icon={<Users size={21} />}
                  label="Members"
                  value={`${selectedGroup.statistics?.totalMembers || 0}/5`}
                />

                <SummaryCard
                  icon={<UserPlus size={21} />}
                  label="Available Slots"
                  value={
                    selectedGroup.statistics?.availableSlots || 0
                  }
                />

                <SummaryCard
                  icon={<BriefcaseIcon />}
                  label="Responsibilities"
                  value={
                    selectedGroup.statistics
                      ?.assignedResponsibilities || 0
                  }
                />

                <SummaryCard
                  icon={<Activity size={21} />}
                  label="Activities"
                  value={
                    selectedGroup.statistics?.recentActivities || 0
                  }
                />
              </div>

              {/* TOPIC + PROGRESS */}

              <div className="grid gap-6 lg:grid-cols-2 mt-6">
                <div className="rounded-2xl border border-slate-700 bg-slate-800 p-6">
                  <div className="flex items-center gap-2 font-bold text-white">
                    <BookOpen size={20} />
                    Thesis Topic
                  </div>

                  <h2 className="mt-4 text-xl font-bold text-white">
                    {selectedGroup.topicId?.title ||
                      "Topic not assigned"}
                  </h2>

                  <p className="mt-2 text-slate-400">
                    {selectedGroup.topicId?.description ||
                      "No topic description available."}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-700 bg-slate-800 p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 font-bold text-white">
                      <TrendingUp size={20} />
                      Group Progress
                    </div>

                    <span className="font-bold text-blue-400">
                      {selectedGroup.progress || 0}%
                    </span>
                  </div>

                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={selectedGroup.progress || 0}
                    disabled={saving}
                    onChange={(e) =>
                      handleProgressChange(e.target.value)
                    }
                    className="w-full mt-6"
                  />

                  <div className="flex justify-between text-xs text-slate-500 mt-2">
                    <span>0%</span>
                    <span>25%</span>
                    <span>50%</span>
                    <span>75%</span>
                    <span>100%</span>
                  </div>
                </div>
              </div>

              {/* MEMBERS */}

              <div className="rounded-2xl border border-slate-700 bg-slate-800 p-6 mt-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-5">
                  <div>
                    <h2 className="text-xl font-bold text-white">
                      Group Members
                    </h2>

                    <p className="text-sm text-slate-400 mt-1">
                      Manage responsibilities and membership.
                    </p>
                  </div>

                </div>

                <div className="space-y-4">
                  {selectedGroup.members?.map((member) => {
                    const isLeader =
                      selectedGroup.leaderId?._id?.toString() ===
                      member._id?.toString();

                    return (
                      <div
                        key={member._id}
                        className="border border-slate-700 rounded-2xl p-5 bg-slate-800"
                      >
                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
                          <div className="flex items-start gap-4">
                            <div className="h-12 w-12 rounded-full bg-blue-900/60 text-blue-400 flex items-center justify-center shrink-0">
                              <User size={22} />
                            </div>

                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <h3 className="font-bold text-white">
                                  {member.fullName}
                                </h3>

                                {isLeader && (
                                  <span className="px-2 py-1 rounded-full bg-blue-900/60 text-blue-300 text-xs font-bold">
                                    Leader
                                  </span>
                                )}
                              </div>

                              <p className="text-sm text-slate-400">
                                {member.email}
                              </p>

                              <div className="mt-3 grid sm:grid-cols-2 gap-3">
                                <div className="rounded-xl bg-slate-700/50 px-4 py-3">
                                  <p className="text-xs text-slate-400">
                                    Role
                                  </p>

                                  <p className="font-semibold text-slate-200">
                                    {member.role}
                                  </p>
                                </div>

                                <div className="rounded-xl bg-slate-700/50 px-4 py-3">
                                  <p className="text-xs text-slate-400">
                                    Chapter
                                  </p>

                                  <p className="font-semibold text-slate-200">
                                    {member.chapter}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="flex gap-2">
                            <button
                              onClick={() =>
                                openResponsibilityModal(member)
                              }
                              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-blue-900/40 text-blue-300 font-semibold hover:bg-blue-900/60"
                            >
                              <Edit3 size={16} />
                              Edit
                            </button>

                            {!isLeader && (
                              <button
                                onClick={() =>
                                  handleRemoveMember(member)
                                }
                                disabled={saving}
                                className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-red-950/40 text-red-300 font-semibold hover:bg-red-950/60 disabled:opacity-50"
                              >
                                <UserMinus size={16} />
                                Remove
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* RECENT ACTIVITY */}

              <div className="rounded-2xl border border-slate-700 bg-slate-800 p-6 mt-6">
                <div className="flex items-center gap-2 font-bold text-white text-xl">
                  <Activity size={21} />
                  Recent Activity
                </div>

                <div className="mt-5 space-y-4">
                  {selectedGroup.recentActivity?.length ? (
                    selectedGroup.recentActivity.map(
                      (activity, index) => (
                        <div
                          key={activity._id || index}
                          className="flex gap-3"
                        >
                          <div className="h-2 w-2 rounded-full bg-blue-500 mt-2" />

                          <div>
                            <p className="text-slate-200 font-medium">
                              {activity.description}
                            </p>

                            {activity.createdAt && (
                              <p className="text-xs text-slate-500 mt-1">
                                {new Date(
                                  activity.createdAt
                                ).toLocaleString()}
                              </p>
                            )}
                          </div>
                        </div>
                      )
                    )
                  ) : (
                    <p className="text-slate-400">
                      No recent activity.
                    </p>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* ======================================================
          RESPONSIBILITY MODAL
      ====================================================== */}

      {showResponsibilityModal && (
        <Modal
          title="Change Member Responsibility"
          onClose={() => setShowResponsibilityModal(false)}
        >
          <p className="text-sm text-slate-400 mb-5">
            Update the role and thesis chapter for{" "}
            <strong className="text-slate-200">
              {selectedMember?.fullName}
            </strong>
            .
          </p>

          <label className="block text-sm font-semibold text-slate-300">
            Role
          </label>

          <input
            value={memberRole}
            onChange={(e) => setMemberRole(e.target.value)}
            placeholder="e.g. Backend Developer"
            className="w-full mt-2 px-4 py-3 rounded-xl border border-slate-600 bg-slate-700 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <label className="block text-sm font-semibold text-slate-300 mt-4">
            Thesis Chapter
          </label>

          <input
            value={memberChapter}
            onChange={(e) => setMemberChapter(e.target.value)}
            placeholder="e.g. Methodology"
            className="w-full mt-2 px-4 py-3 rounded-xl border border-slate-600 bg-slate-700 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <div className="flex gap-3 mt-6">
            <button
              onClick={() => setShowResponsibilityModal(false)}
              className="flex-1 px-4 py-3 rounded-xl border border-slate-600 text-slate-200 font-semibold hover:bg-slate-700"
            >
              Cancel
            </button>

            <button
              onClick={saveResponsibility}
              disabled={saving}
              className="flex-1 px-4 py-3 rounded-xl bg-blue-600 text-white font-semibold disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </Modal>
      )}

    </div>
  );
};

// ============================================================
// SUMMARY CARD
// ============================================================

const SummaryCard = ({ icon, label, value }) => (
  <div className="rounded-2xl border border-slate-700 bg-slate-800 p-5 shadow-sm">
    <div className="flex items-center gap-2 text-slate-400">
      {icon}

      <span className="text-xs font-semibold uppercase tracking-wider">
        {label}
      </span>
    </div>

    <p className="text-3xl font-bold text-white mt-3">
      {value}
    </p>
  </div>
);

// ============================================================
// BRIEFCASE ICON
// ============================================================

const BriefcaseIcon = () => (
  <div className="text-slate-400">
    <Activity size={21} />
  </div>
);

// ============================================================
// MODAL
// ============================================================

const Modal = ({ title, onClose, children }) => (
  <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
    <div className="w-full max-w-lg bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl">
      <div className="flex items-center justify-between border-b border-slate-700 px-6 py-5">
        <h2 className="text-xl font-bold text-white">
          {title}
        </h2>

        <button
          onClick={onClose}
          className="p-2 rounded-lg hover:bg-slate-700 text-slate-300"
        >
          <X size={20} />
        </button>
      </div>

      <div className="p-6">{children}</div>
    </div>
  </div>
);

export default SupervisorGroupManager;