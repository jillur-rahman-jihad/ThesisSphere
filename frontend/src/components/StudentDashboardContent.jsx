import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  CalendarDays,
  CheckCircle2,
  AlertTriangle,
  Clock3,
  FileText,
  Layers3,
  MessageSquare,
  Search,
  Sparkles,
  Target,
  TrendingUp,
  Users,
  Video,
  ExternalLink,
  Loader2,
  Check,
  Circle,
  GraduationCap,
  UserRound,
} from 'lucide-react';

const quickLinks = [
  { label: 'Find Supervisor', path: '/find-supervisor', icon: Search },
  { label: 'Browse Topics', path: '/topics', icon: Sparkles },
  { label: 'Thesis Groups', path: '/groups', icon: Users },
  { label: 'Automated Reports', path: '/automated-report', icon: FileText },
  { label: 'Deadline Calendar', path: '/calendar', icon: CalendarDays },
  { label: 'Meetings', path: '/meetings', icon: Layers3 },
];

function getInitials(name) {
  if (!name) return 'S';
  return name
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

const statConfig = [
  {
    key: 'progressPercentage',
    label: 'Progress',
    description: 'Overall thesis completion',
    icon: TrendingUp,
    accent: 'from-emerald-500 to-emerald-600',
    format: (value) => `${Number(value || 0)}%`,
  },
  {
    key: 'openTasksCount',
    label: 'Open tasks',
    description: 'Action items this week',
    icon: CheckCircle2,
    accent: 'from-blue-500 to-blue-600',
  },
  {
    key: 'upcomingDeadlinesCount',
    label: 'Upcoming deadlines',
    description: 'Due within 14 days',
    icon: CalendarDays,
    accent: 'from-amber-500 to-amber-600',
  },
  {
    key: 'unreadMessagesCount',
    label: 'Unread messages',
    description: 'Supervisor and group chat',
    icon: MessageSquare,
    accent: 'from-violet-500 to-violet-600',
  },
];

function formatRelativeTime(value) {
  if (!value) return 'Recently';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Recently';

  const diffInSeconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (diffInSeconds < 60) return 'Just now';
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  const diffInDays = Math.floor(diffInHours / 24);
  return `${diffInDays}d ago`;
}

function formatShortDate(value) {
  if (!value) return 'TBD';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'TBD';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function mapDeadlineLabel(type) {
  if (!type) return 'Due soon';
  return type.charAt(0).toUpperCase() + type.slice(1);
}

function StudentDashboardContent({ user, dashboardData, loading, error, onRefresh }) {
  const [updatingMilestoneIndex, setUpdatingMilestoneIndex] = useState(null);

  const displayName = user?.fullName || dashboardData?.user?.fullName || 'Student';
  const semester = dashboardData?.profile?.semester || user?.semester || 'Semester not set';
  const department = dashboardData?.user?.department || user?.department || 'Department not set';
  const thesisGroup = dashboardData?.thesisGroup;
  const advisor = thesisGroup?.supervisorId || dashboardData?.profile?.supervisorId;
  const summary = dashboardData?.summary || {};

  const stats = statConfig.map((stat) => ({
    ...stat,
    value: stat.format ? stat.format(summary[stat.key]) : summary[stat.key] ?? 0,
  }));

  const upcomingDeadlines = (dashboardData?.upcomingDeadlines || []).map((deadline) => ({
    title: deadline.title,
    due: deadline.dueLabel || formatShortDate(deadline.dueDate),
    status: mapDeadlineLabel(deadline.type),
  }));

  const upcomingMeetings = dashboardData?.upcomingMeetings || [];
  const nextMeeting = upcomingMeetings[0] || null;

  // Real, user-modifiable milestones from MongoDB database
  const milestones = dashboardData?.milestones || [];

  // Toggle milestone in database
  const handleToggleMilestone = async (index, currentCompleted) => {
    if (!dashboardData?.thesisGroup?._id) {
      alert('You must be assigned to a thesis group to update milestones.');
      return;
    }

    setUpdatingMilestoneIndex(index);
    try {
      const response = await fetch('/api/dashboard/student/milestones', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify({
          milestoneIndex: index,
          completed: !currentCompleted,
        }),
      });

      const result = await response.json();
      if (response.ok && result.success) {
        if (onRefresh) {
          await onRefresh();
        }
      } else {
        alert(result.message || 'Failed to update milestone');
      }
    } catch (err) {
      console.error(err);
      alert('Error updating milestone in database');
    } finally {
      setUpdatingMilestoneIndex(null);
    }
  };

  // Use rich database-driven activity stream
  const recentActivity = (dashboardData?.recentActivity || []).map((act) => ({
    title: act.title,
    detail: act.detail,
    time: formatRelativeTime(act.createdAt),
    type: act.type,
  }));

  if (loading) {
    return (
      <div className="rounded-3xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-10 shadow-sm flex items-center justify-center min-h-[320px]">
        <div className="text-center space-y-3">
          <div className="mx-auto w-10 h-10 rounded-full border-4 border-slate-200 dark:border-slate-700 border-t-amber-500 animate-spin" />
          <p className="text-slate-600 dark:text-slate-300 font-medium">Loading your student dashboard from database...</p>
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
      {/* Header Section */}
      <section className="rounded-3xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white p-8 shadow-xl shadow-slate-900/10 border border-slate-800">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
          <div className="space-y-4 max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200">
              <Sparkles className="w-4 h-4 text-amber-400" />
              Student dashboard overview
            </div>

            <div>
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
                Welcome back, {displayName}
              </h1>
              <p className="mt-3 text-slate-300 max-w-2xl">
                Keep track of your thesis progress, review upcoming deadlines, and jump straight into the next task.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
              <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
                <p className="text-slate-400">Department</p>
                <p className="mt-1 font-semibold text-white">{department}</p>
              </div>
              <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
                <p className="text-slate-400">Semester</p>
                <p className="mt-1 font-semibold text-white">{semester}</p>
              </div>
              <div className="rounded-2xl bg-white/5 border border-white/10 p-4 flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-amber-500 text-slate-900 dark:text-white font-bold flex items-center justify-center">
                  {getInitials(displayName)}
                </div>
                <div>
                  <p className="text-slate-400">Account</p>
                  <p className="mt-1 font-semibold text-white">Active</p>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-3xl bg-white/5 border border-white/10 p-5 w-full lg:max-w-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-300">Today</p>
                <p className="text-xl font-semibold">Thesis focus</p>
              </div>
              <div className="rounded-2xl bg-amber-500/15 p-3 text-amber-300">
                <Target className="w-6 h-6" />
              </div>
            </div>
            <div className="mt-5 space-y-3 text-sm text-slate-200">
              <div className="flex items-center justify-between">
                <span>Latest report</span>
                <span className="font-semibold">{dashboardData?.latestProgress ? `Week ${dashboardData.latestProgress.weekNo}` : 'Not submitted'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Next meeting</span>
                <span className="font-semibold">{nextMeeting?.meetingDate ? new Date(nextMeeting.meetingDate).toLocaleString('en-US', { weekday: 'short', hour: 'numeric', minute: '2-digit' }) : 'Not scheduled'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Current topic</span>
                <span className="font-semibold truncate max-w-[170px] text-right">{dashboardData?.thesisTopic?.title || dashboardData?.thesisGroup?.groupName || 'Thesis planning'}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Thesis group and advisor */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-amber-50 dark:bg-amber-900/30 p-3 text-amber-600 dark:text-amber-300">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">My thesis group</p>
              <p className="mt-1 text-lg font-bold text-slate-900 dark:text-white">
                {thesisGroup?.groupName || 'Not assigned'}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-blue-50 dark:bg-blue-900/30 p-3 text-blue-600 dark:text-blue-300">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-sm text-slate-500 dark:text-slate-400">My advisor</p>
              <p className="mt-1 text-lg font-bold text-slate-900 dark:text-white truncate">
                {advisor?.fullName || 'Not assigned'}
              </p>
              {advisor?.email && (
                <p className="text-sm text-slate-500 dark:text-slate-400 truncate">{advisor.email}</p>
              )}
            </div>
            {!advisor && <UserRound className="ml-auto w-5 h-5 text-slate-300 dark:text-slate-600" />}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-5 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{stat.label}</p>
                  <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">{stat.value}</p>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{stat.description}</p>
                </div>
                <div className={`rounded-2xl bg-gradient-to-br ${stat.accent} p-3 text-white shadow-lg`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>
            </div>
          );
        })}
      </section>

      {/* Dynamic Milestones and Deadlines */}
      <section className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Interactive Milestones */}
        <div className="xl:col-span-2 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Progress milestones</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Click any milestone to mark complete or pending in your database.
              </p>
            </div>
            <div className="rounded-full bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 px-3 py-1 text-sm font-semibold">
              {milestones.filter((item) => item.completed).length} of {milestones.length} complete
            </div>
          </div>

          <div className="mt-6 space-y-3">
            {milestones.map((item, index) => {
              const isUpdating = updatingMilestoneIndex === index;
              return (
                <div
                  key={item._id || item.title}
                  onClick={() => !isUpdating && handleToggleMilestone(index, item.completed)}
                  className={`flex items-center gap-4 rounded-2xl p-4 transition cursor-pointer border ${
                    item.completed
                      ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/40'
                      : 'bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700 hover:border-amber-400'
                  }`}
                >
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
                      item.completed
                        ? 'bg-emerald-500 text-white shadow-sm'
                        : 'border-2 border-slate-300 dark:border-slate-600 text-transparent hover:border-amber-500'
                    }`}
                  >
                    {isUpdating ? (
                      <Loader2 className="w-4 h-4 animate-spin text-slate-500" />
                    ) : item.completed ? (
                      <Check className="w-5 h-5 stroke-[3]" />
                    ) : null}
                  </div>

                  <div className="flex-1">
                    <p className={`font-semibold text-sm ${item.completed ? 'text-slate-900 dark:text-white line-through opacity-80' : 'text-slate-900 dark:text-white'}`}>
                      {item.title}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {item.completed
                        ? item.completedAt
                          ? `Completed on ${formatShortDate(item.completedAt)}`
                          : 'Completed'
                        : 'Click to mark as done in database'}
                    </p>
                  </div>

                  <span
                    className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                      item.completed
                        ? 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {item.completed ? 'Done' : 'Pending'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Upcoming Deadlines */}
        <div className="rounded-3xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Upcoming deadlines</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Stay ahead of the next submissions.</p>
            </div>
            <Clock3 className="w-5 h-5 text-slate-400" />
          </div>

          <div className="mt-6 space-y-4">
            {upcomingDeadlines.map((deadline) => (
              <div key={deadline.title} className="rounded-2xl border border-slate-200 dark:border-slate-700 p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-white">{deadline.title}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Due {deadline.due}</p>
                  </div>
                  <span className="rounded-full bg-amber-50 dark:bg-amber-900/30 px-3 py-1 text-xs font-semibold text-amber-700 dark:text-amber-300">
                    {deadline.status}
                  </span>
                </div>
              </div>
            ))}
            {!upcomingDeadlines.length && (
              <p className="text-sm text-slate-500 dark:text-slate-400">No deadlines scheduled right now.</p>
            )}
          </div>
        </div>
      </section>

      {/* Upcoming Meetings Section */}
      {upcomingMeetings.length > 0 && (
        <section className="rounded-3xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Scheduled Thesis Meetings</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Upcoming supervisory sessions and group discussions.</p>
            </div>
            <Link to="/meetings" className="text-sm font-semibold text-amber-600 dark:text-amber-400 hover:underline">
              View all meetings
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {upcomingMeetings.map((meeting) => (
              <div key={meeting._id} className="p-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2.5 py-1 rounded-lg">
                      {meeting.meetingDate ? new Date(meeting.meetingDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Scheduled'}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      {meeting.meetingDate ? new Date(meeting.meetingDate).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : ''}
                    </span>
                  </div>
                  <h3 className="font-semibold text-slate-900 dark:text-white mt-3">{meeting.title}</h3>
                  {meeting.agenda && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">{meeting.agenda}</p>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
                  <span className="text-xs capitalize font-medium text-slate-600 dark:text-slate-400">{meeting.status}</span>
                  {meeting.meetingLink ? (
                    <a
                      href={meeting.meetingLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-600 dark:text-amber-400 hover:underline"
                    >
                      <Video className="w-3.5 h-3.5" /> Join Room
                    </a>
                  ) : (
                    <Link to="/meetings" className="text-xs font-medium text-slate-500 hover:underline">
                      Details
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Activity and Quick Actions */}
      <section className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="rounded-3xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-6 shadow-sm xl:col-span-2">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Recent activity</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Live updates from your thesis workspace.</p>
            </div>
            <MessageSquare className="w-5 h-5 text-slate-400" />
          </div>

          <div className="mt-6 space-y-4">
            {recentActivity.map((activity, idx) => (
              <div key={idx} className="rounded-2xl bg-slate-50 dark:bg-slate-900/50 px-4 py-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-white">{activity.title}</p>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{activity.detail}</p>
                  </div>
                  <span className="text-xs font-medium text-slate-400 whitespace-nowrap">{activity.time}</span>
                </div>
              </div>
            ))}
            {!recentActivity.length && (
              <p className="text-sm text-slate-500 dark:text-slate-400">No recent activity recorded yet.</p>
            )}
          </div>
        </div>

        <div className="rounded-3xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Quick actions</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Jump into the most common student tasks.</p>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3">
            {quickLinks.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.label}
                  to={item.path}
                  className="group rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 p-4 transition hover:border-amber-300 hover:bg-amber-50 dark:bg-amber-900/30"
                >
                  <Icon className="w-5 h-5 text-slate-500 dark:text-slate-400 group-hover:text-amber-600" />
                  <p className="mt-4 text-sm font-semibold text-slate-900 dark:text-white">{item.label}</p>
                </Link>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}

export default StudentDashboardContent;