import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Users,
  Briefcase,
  CalendarDays,
  FileCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  BarChart3,
  TrendingUp,
  Inbox,
  UserCheck,
  X,
  Mail,
  GraduationCap,
  Edit2,
  Check,
  MessageSquare,
  ArrowRight,
  Loader2,
} from 'lucide-react';

function getInitials(name) {
  if (!name) return 'F';
  return name
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function FacultyDashboardContent({ user, dashboardData, loading, error, onRefresh }) {
  const navigate = useNavigate();
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [processingRequestId, setProcessingRequestId] = useState(null);
  const [actionMessage, setActionMessage] = useState(null);

  // Capacity editing state
  const [isEditingCapacity, setIsEditingCapacity] = useState(false);
  const [capacityInput, setCapacityInput] = useState('');
  const [savingCapacity, setSavingCapacity] = useState(false);

  const displayName = user?.fullName || dashboardData?.user?.fullName || 'Faculty Member';
  const department = dashboardData?.user?.department || user?.department || 'Department not set';
  const summary = dashboardData?.summary || {};
  const activeStudents = dashboardData?.studentProgress || [];
  const workloadChart = dashboardData?.workloadChart || [];
  const pendingRequests = dashboardData?.pendingRequests || [];

  // Handle Accept or Decline Supervision Request
  const handleRequestDecision = async (requestId, status) => {
    setProcessingRequestId(requestId);
    setActionMessage(null);
    try {
      const response = await fetch(`/api/dashboard/faculty/supervision-requests/${requestId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify({ status }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setActionMessage({
          type: 'success',
          text: `Supervision request successfully ${status}!`,
        });
        if (onRefresh) {
          await onRefresh();
        }
      } else {
        setActionMessage({
          type: 'error',
          text: result.message || `Failed to ${status} request`,
        });
      }
    } catch (err) {
      console.error(err);
      setActionMessage({
        type: 'error',
        text: `Network error while attempting to ${status} request`,
      });
    } finally {
      setProcessingRequestId(null);
    }
  };

  // Handle Save Max Students Capacity
  const handleSaveCapacity = async () => {
    const val = Number(capacityInput);
    if (Number.isNaN(val) || val < 0) {
      alert('Please enter a valid non-negative number');
      return;
    }

    setSavingCapacity(true);
    try {
      const res = await fetch('/api/dashboard/faculty/capacity', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify({ maxStudents: val }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setIsEditingCapacity(false);
        setActionMessage({
          type: 'success',
          text: 'Supervision capacity updated successfully!',
        });
        if (onRefresh) {
          await onRefresh();
        }
      } else {
        alert(data.message || 'Failed to update capacity');
      }
    } catch (err) {
      console.error(err);
      alert('Error updating capacity');
    } finally {
      setSavingCapacity(false);
    }
  };

  if (loading) {
    return (
      <div className="rounded-3xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-10 shadow-sm flex items-center justify-center min-h-[320px]">
        <div className="text-center space-y-3">
          <div className="mx-auto w-10 h-10 rounded-full border-4 border-slate-200 dark:border-slate-700 border-t-amber-500 animate-spin" />
          <p className="text-slate-600 dark:text-slate-300 font-medium">Loading your supervisor dashboard from the database...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-3xl bg-white dark:bg-slate-800 border border-rose-200 p-8 shadow-sm flex items-start gap-4">
        <div className="rounded-2xl bg-rose-50 p-3 text-rose-600">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Dashboard unavailable</h2>
          <p className="mt-2 text-slate-600 dark:text-slate-300">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {actionMessage && (
        <div
          className={`p-4 rounded-2xl flex items-center justify-between border ${
            actionMessage.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 text-emerald-800 dark:text-emerald-300'
              : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 text-rose-800 dark:text-rose-300'
          }`}
        >
          <div className="flex items-center gap-2">
            {actionMessage.type === 'success' ? <Check className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
            <span className="font-medium text-sm">{actionMessage.text}</span>
          </div>
          <button onClick={() => setActionMessage(null)} className="p-1 hover:opacity-75">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header Section */}
      <section className="rounded-3xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white p-8 shadow-xl shadow-slate-900/10 border border-slate-800">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
          <div className="space-y-4 max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200">
              <Briefcase className="w-4 h-4 text-amber-400" />
              Supervisor Dashboard
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
                Welcome, {displayName}
              </h1>
              <p className="mt-3 text-slate-300 max-w-2xl">
                Manage your supervisees, review thesis progress, and handle new supervision requests from students.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm mt-6">
              <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
                <p className="text-slate-400">Department</p>
                <p className="mt-1 font-semibold text-white">{department}</p>
              </div>

              {/* Editable Supervision Capacity */}
              <div className="rounded-2xl bg-white/5 border border-white/10 p-4 relative group">
                <div className="flex items-center justify-between">
                  <p className="text-slate-400">Supervision Capacity</p>
                  {!isEditingCapacity && (
                    <button
                      onClick={() => {
                        setCapacityInput(summary.maxStudents || 5);
                        setIsEditingCapacity(true);
                      }}
                      className="text-slate-400 hover:text-amber-400 transition"
                      title="Edit capacity in database"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {isEditingCapacity ? (
                  <div className="mt-2 flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      max="50"
                      value={capacityInput}
                      onChange={(e) => setCapacityInput(e.target.value)}
                      className="w-16 px-2 py-1 text-sm bg-slate-900 text-white border border-amber-400 rounded-lg outline-none"
                    />
                    <button
                      onClick={handleSaveCapacity}
                      disabled={savingCapacity}
                      className="p-1 bg-emerald-500 hover:bg-emerald-600 text-white rounded-md text-xs transition"
                      title="Save"
                    >
                      {savingCapacity ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      onClick={() => setIsEditingCapacity(false)}
                      className="p-1 bg-slate-700 hover:bg-slate-600 text-white rounded-md text-xs transition"
                      title="Cancel"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <p className="mt-1 font-semibold text-white">
                    {summary.activeStudentsCount || 0} / {summary.maxStudents || 0} Students
                  </p>
                )}
              </div>

              <div className="rounded-2xl bg-white/5 border border-white/10 p-4 flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-amber-500 text-slate-900 dark:text-white font-bold flex items-center justify-center">
                  {getInitials(displayName)}
                </div>
                <div>
                  <p className="text-slate-400">Account Type</p>
                  <p className="mt-1 font-semibold text-white capitalize">{user?.role || 'Faculty'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        <div className="rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-5 shadow-sm hover:shadow-md transition">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">Active Students</p>
              <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">{summary.activeStudentsCount || 0}</p>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Currently supervising</p>
            </div>
            <div className="rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 p-3 text-white shadow-lg">
              <Users className="w-5 h-5" />
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-5 shadow-sm hover:shadow-md transition">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">Pending Reviews</p>
              <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">{summary.pendingReviewsCount || 0}</p>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Papers awaiting review</p>
            </div>
            <div className="rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 p-3 text-white shadow-lg">
              <FileCheck className="w-5 h-5" />
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-5 shadow-sm hover:shadow-md transition">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">Meetings</p>
              <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">{summary.meetingsThisMonth || 0}</p>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Conducted this month</p>
            </div>
            <div className="rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 p-3 text-white shadow-lg">
              <CalendarDays className="w-5 h-5" />
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-5 shadow-sm hover:shadow-md transition">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">Supervision Requests</p>
              <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">{summary.pendingRequestsCount || 0}</p>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Awaiting your decision</p>
            </div>
            <div className="rounded-2xl bg-gradient-to-br from-violet-500 to-violet-600 p-3 text-white shadow-lg">
              <Inbox className="w-5 h-5" />
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Student Progress Overview */}
        <div className="xl:col-span-2 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Supervisee Progress Overview</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Track the thesis completion status of your active students.</p>
            </div>
            <TrendingUp className="w-5 h-5 text-slate-400" />
          </div>

          <div className="mt-6 space-y-5">
            {activeStudents.map((student, idx) => (
              <div key={student._id || idx} className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 p-4">
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-sm">
                      {getInitials(student.fullName)}
                    </div>
                    <div>
                      <button
                        onClick={() => setSelectedStudent(student)}
                        className="font-semibold text-slate-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors text-left"
                      >
                        {student.fullName || 'Student Name'}
                      </button>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{student.thesisTitle || 'Thesis Project'}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-slate-700 dark:text-slate-200">{student.progressPercentage || 0}%</span>
                    <span className={`block text-[11px] font-semibold ${
                      student.status === 'On Track' ? 'text-emerald-600 dark:text-emerald-400' :
                      student.status === 'Slightly Behind' ? 'text-amber-600 dark:text-amber-400' : 'text-rose-600 dark:text-rose-400'
                    }`}>
                      {student.status}
                    </span>
                  </div>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2.5 mt-3">
                  <div
                    className="bg-indigo-600 h-2.5 rounded-full transition-all duration-500"
                    style={{ width: `${student.progressPercentage || 0}%` }}
                  ></div>
                </div>
              </div>
            ))}
            {!activeStudents.length && (
              <div className="text-center py-8">
                <UserCheck className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500 dark:text-slate-400 font-medium">You have no active students.</p>
              </div>
            )}
          </div>
        </div>

        {/* Pending Supervision Requests */}
        <div className="rounded-3xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-6 shadow-sm flex flex-col">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Pending Requests</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Students seeking supervision.</p>
            </div>
            <div className="rounded-full bg-violet-50 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300 px-3 py-1 text-sm font-semibold">
              {pendingRequests.length} New
            </div>
          </div>

          <div className="mt-6 space-y-4 flex-1">
            {pendingRequests.map((req) => {
              const isProcessing = processingRequestId === req._id;
              return (
                <div key={req._id} className="rounded-2xl border border-slate-200 dark:border-slate-700 p-4 hover:border-violet-300 transition-colors">
                  <p className="font-semibold text-slate-900 dark:text-white">{req.studentName}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{req.studentDepartment}</p>
                  <div className="mt-3 bg-slate-50 dark:bg-slate-900/50 p-2 rounded-lg text-sm text-slate-700 dark:text-slate-200 border border-slate-100 dark:border-slate-800">
                    <span className="font-semibold block mb-1">Topic:</span>
                    {req.topicTitle}
                  </div>
                  <div className="flex items-center justify-between mt-4">
                    <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-1 rounded">
                      Match: {req.compatibilityScore}%
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleRequestDecision(req._id, 'declined')}
                        disabled={isProcessing}
                        className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition disabled:opacity-50"
                        title="Decline request"
                      >
                        {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <XCircle className="w-5 h-5" />}
                      </button>
                      <button
                        onClick={() => handleRequestDecision(req._id, 'accepted')}
                        disabled={isProcessing}
                        className="p-1.5 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-lg transition disabled:opacity-50"
                        title="Accept request"
                      >
                        {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
            {!pendingRequests.length && (
              <div className="h-full flex flex-col items-center justify-center text-center py-8">
                <Inbox className="w-10 h-10 text-slate-300 mb-3" />
                <p className="text-sm text-slate-500 dark:text-slate-400">No pending supervision requests at the moment.</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Workload Chart */}
      <section className="rounded-3xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-xl">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Workload Overview (Past 6 Months)</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">Combined meetings and paper reviews</p>
          </div>
        </div>

        <div className="flex items-end gap-2 md:gap-6 h-64 mt-8 px-2 md:px-8 border-b border-slate-100 dark:border-slate-800 pb-2">
          {workloadChart.map((monthData, idx) => {
            const total = monthData.meetings + monthData.reviews;
            const maxVal = Math.max(...workloadChart.map((d) => d.meetings + d.reviews), 10);
            const heightPercentage = (total / maxVal) * 100;
            const monthName = monthData.month;

            return (
              <div key={idx} className="flex-1 flex flex-col items-center justify-end h-full group relative">
                <div className="absolute -top-12 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800 text-white text-xs py-1 px-2 rounded whitespace-nowrap pointer-events-none z-10 shadow-lg">
                  {monthData.meetings} Meetings, {monthData.reviews} Reviews
                </div>
                <div
                  className="w-full max-w-[40px] bg-gradient-to-t from-blue-600 to-blue-400 rounded-t-md transition-all duration-500"
                  style={{ height: `${Math.max(heightPercentage, 5)}%` }}
                ></div>
                <div className="mt-3 text-xs md:text-sm font-medium text-slate-600 dark:text-slate-300">{monthName}</div>
              </div>
            );
          })}
          {!workloadChart.length && (
            <div className="w-full h-full flex items-center justify-center text-slate-500 dark:text-slate-400">
              Not enough data to display chart.
            </div>
          )}
        </div>
      </section>

      {/* Student Profile Modal with Actions */}
      {selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md overflow-hidden rounded-[28px] bg-white dark:bg-slate-800 shadow-2xl border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 px-6 py-5">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Student Profile</h2>
              <button
                onClick={() => setSelectedStudent(null)}
                className="text-slate-400 hover:text-slate-900 dark:hover:text-white transition"
              >
                <X size={24} />
              </button>
            </div>
            <div className="p-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-xl">
                  {getInitials(selectedStudent.fullName)}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">{selectedStudent.fullName}</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-1">
                    <GraduationCap size={16} /> {selectedStudent.department || 'Department not specified'}
                  </p>
                  {selectedStudent.email && (
                    <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                      <Mail size={14} /> {selectedStudent.email}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-slate-700">
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Thesis Topic</p>
                  <p className="text-sm font-medium text-slate-900 dark:text-white">{selectedStudent.thesisTitle || 'Not assigned'}</p>
                </div>

                <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-slate-700">
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Overall Progress</p>
                    <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">{selectedStudent.progressPercentage || 0}%</span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                    <div
                      className="bg-indigo-600 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${selectedStudent.progressPercentage || 0}%` }}
                    ></div>
                  </div>
                </div>

                {/* Direct Actions */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <button
                    onClick={() => {
                      setSelectedStudent(null);
                      navigate('/messages');
                    }}
                    className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold transition"
                  >
                    <MessageSquare className="w-4 h-4" /> Message
                  </button>
                  <button
                    onClick={() => {
                      setSelectedStudent(null);
                      navigate('/supervisor/group-manager');
                    }}
                    className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-sm font-semibold transition"
                  >
                    Group Manager <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default FacultyDashboardContent;
