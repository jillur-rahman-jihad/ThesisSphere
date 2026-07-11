import React from 'react';
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
} from 'lucide-react';

const quickLinks = [
  { label: 'Find Supervisor', path: '/find-supervisor', icon: Search },
  { label: 'Browse Topics', path: '/topics', icon: Sparkles },
  { label: 'Thesis Groups', path: '/groups', icon: Users },
  { label: 'Reports', path: '/reports', icon: FileText },
  { label: 'Calendar', path: '/calendar', icon: CalendarDays },
  { label: 'Meetings', path: '/meetings', icon: Layers3 },
];

const progressMilestones = [
  { title: 'Topic selected', completed: true },
  { title: 'Supervisor assigned', completed: true },
  { title: 'Proposal submitted', completed: true },
  { title: 'Literature review draft', completed: false },
  { title: 'Methodology chapter', completed: false },
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

function StudentDashboardContent({ user, dashboardData, loading, error }) {
  const displayName = user?.fullName || dashboardData?.user?.fullName || 'Student';
  const semester = dashboardData?.profile?.semester || user?.semester || 'Semester not set';
  const department = dashboardData?.user?.department || user?.department || 'Department not set';
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

  const recentActivity = [];

  if (dashboardData?.recentNotifications?.length) {
    dashboardData.recentNotifications.forEach((notification) => {
      recentActivity.push({
        title: notification.title,
        time: formatRelativeTime(notification.createdAt),
        detail: notification.message || notification.type || 'Notification from your dashboard',
      });
    });
  }

  if (dashboardData?.recentMessages?.length) {
    dashboardData.recentMessages.forEach((message) => {
      recentActivity.push({
        title: `Message from ${message.sender?.fullName || 'team member'}`,
        time: formatRelativeTime(message.createdAt),
        detail: message.message,
      });
    });
  }

  const progressMilestones = [
    { title: 'Topic selected', completed: Boolean(dashboardData?.thesisTopic) },
    { title: 'Supervisor assigned', completed: Boolean(dashboardData?.profile?.supervisorId) },
    { title: 'Proposal submitted', completed: (dashboardData?.progressReports || []).length > 0 },
    { title: 'Literature review draft', completed: Number(summary.progressPercentage || 0) >= 50 },
    { title: 'Methodology chapter', completed: Number(summary.progressPercentage || 0) >= 75 },
  ];

  const nextMeeting = dashboardData?.upcomingMeetings?.[0] || null;

  if (loading) {
    return (
      <div className="rounded-3xl bg-white border border-slate-200 p-10 shadow-sm flex items-center justify-center min-h-[320px]">
        <div className="text-center space-y-3">
          <div className="mx-auto w-10 h-10 rounded-full border-4 border-slate-200 border-t-amber-500 animate-spin" />
          <p className="text-slate-600 font-medium">Loading your dashboard from the backend...</p>
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
                <div className="w-11 h-11 rounded-full bg-amber-500 text-slate-900 font-bold flex items-center justify-center">
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
                <span>Current goal</span>
                <span className="font-semibold">{dashboardData?.latestProgress?.summary || dashboardData?.thesisTopic?.title || 'Thesis planning'}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="rounded-2xl bg-white border border-slate-200 p-5 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm text-slate-500">{stat.label}</p>
                  <p className="mt-2 text-3xl font-bold text-slate-900">{stat.value}</p>
                  <p className="mt-1 text-sm text-slate-500">{stat.description}</p>
                </div>
                <div className={`rounded-2xl bg-gradient-to-br ${stat.accent} p-3 text-white shadow-lg`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>
            </div>
          );
        })}
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 rounded-3xl bg-white border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Progress milestones</h2>
              <p className="text-sm text-slate-500 mt-1">Track the major steps of your thesis journey.</p>
            </div>
            <div className="rounded-full bg-emerald-50 text-emerald-700 px-3 py-1 text-sm font-semibold">
              {progressMilestones.filter((item) => item.completed).length} of {progressMilestones.length} complete
            </div>
          </div>

          <div className="mt-6 space-y-4">
            {progressMilestones.map((item) => (
              <div key={item.title} className="flex items-center gap-4 rounded-2xl bg-slate-50 px-4 py-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${item.completed ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-200 text-slate-400'}`}>
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-slate-900">{item.title}</p>
                    <p className="text-sm text-slate-500">{item.completed ? 'Completed' : 'Pending'}</p>
                </div>
                <div className={`text-sm font-semibold ${item.completed ? 'text-emerald-600' : 'text-slate-400'}`}>
                  {item.completed ? 'Done' : 'Next'}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl bg-white border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Upcoming deadlines</h2>
              <p className="text-sm text-slate-500 mt-1">Stay ahead of the next submissions.</p>
            </div>
            <Clock3 className="w-5 h-5 text-slate-400" />
          </div>

          <div className="mt-6 space-y-4">
            {upcomingDeadlines.map((deadline) => (
              <div key={deadline.title} className="rounded-2xl border border-slate-200 p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-semibold text-slate-900">{deadline.title}</p>
                    <p className="text-sm text-slate-500 mt-1">Due {deadline.due}</p>
                  </div>
                  <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                    {deadline.status}
                  </span>
                </div>
              </div>
            ))}
            {!upcomingDeadlines.length && (
              <p className="text-sm text-slate-500">No deadlines found yet. Your supervisor or group can add them in the backend.</p>
            )}
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="rounded-3xl bg-white border border-slate-200 p-6 shadow-sm xl:col-span-2">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Recent activity</h2>
              <p className="text-sm text-slate-500 mt-1">Latest updates from your thesis workspace.</p>
            </div>
            <MessageSquare className="w-5 h-5 text-slate-400" />
          </div>

          <div className="mt-6 space-y-4">
            {recentActivity.slice(0, 4).map((activity) => (
              <div key={activity.title} className="rounded-2xl bg-slate-50 px-4 py-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-semibold text-slate-900">{activity.title}</p>
                    <p className="mt-1 text-sm text-slate-500">{activity.detail}</p>
                  </div>
                  <span className="text-xs font-medium text-slate-400 whitespace-nowrap">{activity.time}</span>
                </div>
              </div>
            ))}
            {!recentActivity.length && (
              <p className="text-sm text-slate-500">No recent backend activity yet.</p>
            )}
          </div>
        </div>

        <div className="rounded-3xl bg-white border border-slate-200 p-6 shadow-sm">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Quick actions</h2>
            <p className="text-sm text-slate-500 mt-1">Jump into the most common student tasks.</p>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3">
            {quickLinks.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.label}
                  to={item.path}
                  className="group rounded-2xl border border-slate-200 bg-slate-50 p-4 transition hover:border-amber-300 hover:bg-amber-50"
                >
                  <Icon className="w-5 h-5 text-slate-500 group-hover:text-amber-600" />
                  <p className="mt-4 text-sm font-semibold text-slate-900">{item.label}</p>
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