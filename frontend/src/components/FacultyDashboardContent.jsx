import React from 'react';
import { Link } from 'react-router-dom';
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
  UserCheck
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

function FacultyDashboardContent({ user, dashboardData, loading, error }) {
  const displayName = user?.fullName || dashboardData?.user?.fullName || 'Faculty Member';
  const department = dashboardData?.user?.department || user?.department || 'Department not set';
  const summary = dashboardData?.summary || {};
  const activeStudents = dashboardData?.studentProgress || [];
  const workloadChart = dashboardData?.workloadChart || [];
  const pendingRequests = dashboardData?.pendingRequests || [];

  if (loading) {
    return (
      <div className="rounded-3xl bg-white border border-slate-200 p-10 shadow-sm flex items-center justify-center min-h-[320px]">
        <div className="text-center space-y-3">
          <div className="mx-auto w-10 h-10 rounded-full border-4 border-slate-200 border-t-amber-500 animate-spin" />
          <p className="text-slate-600 font-medium">Loading your supervisor dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-3xl bg-white border border-rose-200 p-8 shadow-sm flex items-start gap-4">
        <div className="rounded-2xl bg-rose-50 p-3 text-rose-600">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-900">Dashboard unavailable</h2>
          <p className="mt-2 text-slate-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
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
              <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
                <p className="text-slate-400">Supervision Capacity</p>
                <p className="mt-1 font-semibold text-white">
                  {summary.activeStudentsCount || 0} / {summary.maxStudents || 5} Students
                </p>
              </div>
              <div className="rounded-2xl bg-white/5 border border-white/10 p-4 flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-amber-500 text-slate-900 font-bold flex items-center justify-center">
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
        <div className="rounded-2xl bg-white border border-slate-200 p-5 shadow-sm hover:shadow-md transition">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm text-slate-500">Active Students</p>
              <p className="mt-2 text-3xl font-bold text-slate-900">{summary.activeStudentsCount || 0}</p>
              <p className="mt-1 text-sm text-slate-500">Currently supervising</p>
            </div>
            <div className="rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 p-3 text-white shadow-lg">
              <Users className="w-5 h-5" />
            </div>
          </div>
        </div>
        
        <div className="rounded-2xl bg-white border border-slate-200 p-5 shadow-sm hover:shadow-md transition">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm text-slate-500">Pending Reviews</p>
              <p className="mt-2 text-3xl font-bold text-slate-900">{summary.pendingReviewsCount || 0}</p>
              <p className="mt-1 text-sm text-slate-500">Papers awaiting review</p>
            </div>
            <div className="rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 p-3 text-white shadow-lg">
              <FileCheck className="w-5 h-5" />
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-white border border-slate-200 p-5 shadow-sm hover:shadow-md transition">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm text-slate-500">Meetings</p>
              <p className="mt-2 text-3xl font-bold text-slate-900">{summary.meetingsThisMonth || 0}</p>
              <p className="mt-1 text-sm text-slate-500">Conducted this month</p>
            </div>
            <div className="rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 p-3 text-white shadow-lg">
              <CalendarDays className="w-5 h-5" />
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-white border border-slate-200 p-5 shadow-sm hover:shadow-md transition">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm text-slate-500">Supervision Requests</p>
              <p className="mt-2 text-3xl font-bold text-slate-900">{summary.pendingRequestsCount || 0}</p>
              <p className="mt-1 text-sm text-slate-500">Awaiting your decision</p>
            </div>
            <div className="rounded-2xl bg-gradient-to-br from-violet-500 to-violet-600 p-3 text-white shadow-lg">
              <Inbox className="w-5 h-5" />
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Student Progress Overview */}
        <div className="xl:col-span-2 rounded-3xl bg-white border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Supervisee Progress Overview</h2>
              <p className="text-sm text-slate-500 mt-1">Track the thesis completion status of your active students.</p>
            </div>
            <TrendingUp className="w-5 h-5 text-slate-400" />
          </div>

          <div className="mt-6 space-y-5">
            {activeStudents.map((student, idx) => (
              <div key={student._id || idx} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-sm">
                      {getInitials(student.userId?.fullName)}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">{student.userId?.fullName || 'Student Name'}</p>
                      <p className="text-xs text-slate-500">{student.thesisTopic?.title || 'No Topic Selected'}</p>
                    </div>
                  </div>
                  <span className="font-bold text-slate-700">{student.progressPercentage || 0}%</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2.5 mt-3">
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
                <p className="text-slate-500 font-medium">You have no active students.</p>
              </div>
            )}
          </div>
        </div>

        {/* Pending Supervision Requests */}
        <div className="rounded-3xl bg-white border border-slate-200 p-6 shadow-sm flex flex-col">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Pending Requests</h2>
              <p className="text-sm text-slate-500 mt-1">Students seeking supervision.</p>
            </div>
            <div className="rounded-full bg-violet-50 text-violet-700 px-3 py-1 text-sm font-semibold">
              {pendingRequests.length} New
            </div>
          </div>

          <div className="mt-6 space-y-4 flex-1">
            {pendingRequests.map((req, idx) => (
              <div key={req._id || idx} className="rounded-2xl border border-slate-200 p-4 hover:border-violet-300 transition-colors">
                <p className="font-semibold text-slate-900">{req.studentName}</p>
                <p className="text-xs text-slate-500 mt-1">{req.studentDepartment}</p>
                <div className="mt-3 bg-slate-50 p-2 rounded-lg text-sm text-slate-700 border border-slate-100">
                  <span className="font-semibold block mb-1">Topic:</span>
                  {req.topicTitle}
                </div>
                <div className="flex items-center justify-between mt-4">
                  <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded">
                    Score: {req.compatibilityScore}%
                  </span>
                  <div className="flex gap-2">
                    <button className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition" title="Decline">
                      <XCircle className="w-5 h-5" />
                    </button>
                    <button className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition" title="Accept">
                      <CheckCircle2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {!pendingRequests.length && (
              <div className="h-full flex flex-col items-center justify-center text-center py-8">
                <Inbox className="w-10 h-10 text-slate-300 mb-3" />
                <p className="text-sm text-slate-500">No pending supervision requests at the moment.</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Workload Chart (Simplified HTML Bar Chart) */}
      <section className="rounded-3xl bg-white border border-slate-200 p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Workload Overview (Past 6 Months)</h2>
            <p className="text-sm text-slate-500">Combined meetings and paper reviews</p>
          </div>
        </div>

        <div className="flex items-end gap-2 md:gap-6 h-64 mt-8 px-2 md:px-8 border-b border-slate-100 pb-2">
          {workloadChart.map((monthData, idx) => {
            const total = monthData.meetings + monthData.reviews;
            const maxVal = Math.max(...workloadChart.map(d => d.meetings + d.reviews), 10);
            const heightPercentage = (total / maxVal) * 100;
            const monthName = monthData.month;
            
            return (
              <div key={idx} className="flex-1 flex flex-col items-center justify-end h-full group relative">
                {/* Tooltip */}
                <div className="absolute -top-12 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800 text-white text-xs py-1 px-2 rounded whitespace-nowrap pointer-events-none z-10">
                  {monthData.meetings} Meetings, {monthData.reviews} Reviews
                </div>
                {/* Bar */}
                <div 
                  className="w-full max-w-[40px] bg-gradient-to-t from-blue-600 to-blue-400 rounded-t-md transition-all duration-500" 
                  style={{ height: `${Math.max(heightPercentage, 5)}%` }} // min 5% height so it's visible
                ></div>
                {/* Label */}
                <div className="mt-3 text-xs md:text-sm font-medium text-slate-600">{monthName}</div>
              </div>
            );
          })}
          {!workloadChart.length && (
            <div className="w-full h-full flex items-center justify-center text-slate-500">
              Not enough data to display chart.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

export default FacultyDashboardContent;
