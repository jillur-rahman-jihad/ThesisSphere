import React, { useState, useEffect, useCallback } from 'react';
import {
  getGroupContributions,
  addContribution,
  updateContribution,
  deleteContribution,
  seedGroupContributions,
} from '../services/contributionTrackerService';
import {
  Activity,
  RefreshCw,
  Sparkles,
  Plus,
  AlertCircle,
  Clock,
  Users,
  Award,
  TrendingUp,
  PieChart as PieIcon,
  BarChart3,
  Calendar,
  CheckCircle2,
  User,
  ExternalLink,
  Trash2,
  Edit2,
  Search,
  X,
  Link as LinkIcon,
  FileText,
  Lock,
  Zap,
} from 'lucide-react';

/* ==========================================================================
   CONSTANTS & COLOR PALETTES
   ========================================================================== */
const DONUT_COLORS = [
  { stroke: '#6366f1', fill: 'bg-indigo-500', text: 'text-indigo-600 dark:text-indigo-400', border: 'border-indigo-500' },
  { stroke: '#10b981', fill: 'bg-emerald-500', text: 'text-emerald-600 dark:text-emerald-400', border: 'border-emerald-500' },
  { stroke: '#f59e0b', fill: 'bg-amber-500', text: 'text-amber-600 dark:text-amber-400', border: 'border-amber-500' },
  { stroke: '#ec4899', fill: 'bg-pink-500', text: 'text-pink-600 dark:text-pink-400', border: 'border-pink-500' },
  { stroke: '#3b82f6', fill: 'bg-blue-500', text: 'text-blue-600 dark:text-blue-400', border: 'border-blue-500' },
  { stroke: '#8b5cf6', fill: 'bg-purple-500', text: 'text-purple-600 dark:text-purple-400', border: 'border-purple-500' },
];

const CATEGORY_COLORS = {
  Research: 'bg-indigo-500',
  Frontend: 'bg-emerald-500',
  Backend: 'bg-blue-500',
  Documentation: 'bg-amber-500',
  Testing: 'bg-rose-500',
  'Data Analysis': 'bg-purple-500',
  Presentation: 'bg-cyan-500',
  Other: 'bg-slate-500',
};

const CATEGORY_BADGES = {
  Research: 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800',
  Frontend: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
  Backend: 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800',
  Documentation: 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800',
  Testing: 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800',
  'Data Analysis': 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800',
  Presentation: 'bg-cyan-50 dark:bg-cyan-950/40 text-cyan-700 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800',
  Other: 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700',
};

/* ==========================================================================
   SUBCOMPONENT 1: OVERVIEW METRIC CARDS
   ========================================================================== */
const ContributionOverviewCard = ({ summary, groupProgress }) => {
  const cards = [
    {
      title: 'Total Hours Logged',
      value: `${summary?.totalHours || 0} hrs`,
      subtitle: `${summary?.totalTasks || 0} total work tasks logged`,
      icon: Clock,
      iconBg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
      badge: 'Active Tracker',
    },
    {
      title: 'Group Members',
      value: summary?.memberCount || 0,
      subtitle: 'Active student contributors',
      icon: Users,
      iconBg: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400',
      badge: 'Team',
    },
    {
      title: 'Top Contributor',
      value: summary?.topContributor || 'N/A',
      subtitle: 'Highest hours contributed',
      icon: Award,
      iconBg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
      badge: 'Lead',
    },
    {
      title: 'Project Progress',
      value: `${groupProgress || 0}%`,
      subtitle: 'Overall thesis group milestone',
      icon: TrendingUp,
      iconBg: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
      badge: 'Status',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {cards.map((card, idx) => {
        const IconComponent = card.icon;
        return (
          <div
            key={idx}
            className="relative overflow-hidden rounded-2xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-md border border-slate-200/80 dark:border-slate-700/80 p-5 shadow-sm hover:shadow-md transition-all duration-300 group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                {card.title}
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                {card.badge}
              </span>
            </div>
            
            <div className="mt-3 flex items-baseline justify-between">
              <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight group-hover:scale-105 transition-transform duration-200">
                {card.value}
              </h3>
              <div className={`p-2.5 rounded-xl ${card.iconBg}`}>
                <IconComponent className="w-5 h-5" />
              </div>
            </div>

            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 font-medium">
              {card.subtitle}
            </p>
          </div>
        );
      })}
    </div>
  );
};

/* ==========================================================================
   SUBCOMPONENT 2: VISUAL CHARTS & ANALYTICS
   ========================================================================== */
const ContributionCharts = ({ memberStats = [], categoryStats = {}, weeklyTimeline = [] }) => {
  const [hoveredMember, setHoveredMember] = useState(null);

  const totalHours = memberStats.reduce((sum, m) => sum + (m.totalHours || 0), 0);

  let cumulativeAngle = 0;
  const donutSlices = memberStats.map((member, index) => {
    const pct = totalHours > 0 ? (member.totalHours / totalHours) : 0;
    const angle = pct * 360;
    const startAngle = cumulativeAngle;
    cumulativeAngle += angle;
    
    const colorObj = DONUT_COLORS[index % DONUT_COLORS.length];

    return {
      ...member,
      pctDisplay: (pct * 100).toFixed(1),
      startAngle,
      angle,
      color: colorObj,
    };
  });

  const categoryArray = Object.entries(categoryStats).map(([cat, hours]) => ({
    name: cat,
    hours,
    pct: totalHours > 0 ? ((hours / totalHours) * 100).toFixed(1) : 0,
  })).sort((a, b) => b.hours - a.hours);

  const maxWeeklyHours = Math.max(...weeklyTimeline.map((w) => w.hours || 0), 10);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
      {/* 1. Member Workload Donut Chart */}
      <div className="lg:col-span-1 rounded-2xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-md border border-slate-200/80 dark:border-slate-700/80 p-6 shadow-sm flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                <PieIcon className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Member Hours Share</h3>
            </div>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-2.5 py-1 rounded-full">
              {memberStats.length} Members
            </span>
          </div>

          <div className="relative flex items-center justify-center my-4">
            <svg viewBox="0 0 100 100" className="w-48 h-48 transform -rotate-90">
              {totalHours === 0 ? (
                <circle cx="50" cy="50" r="38" fill="none" stroke="#e2e8f0" strokeWidth="16" />
              ) : (
                donutSlices.map((slice, i) => {
                  const strokeDasharray = `${(slice.pctDisplay * 2.387).toFixed(2)} 238.7`;
                  const strokeDashoffset = -((slice.startAngle / 360) * 238.7).toFixed(2);
                  return (
                    <circle
                      key={i}
                      cx="50"
                      cy="50"
                      r="38"
                      fill="none"
                      stroke={slice.color.stroke}
                      strokeWidth="16"
                      strokeDasharray={strokeDasharray}
                      strokeDashoffset={strokeDashoffset}
                      className="transition-all duration-300 cursor-pointer hover:opacity-80"
                      onMouseEnter={() => setHoveredMember(slice)}
                      onMouseLeave={() => setHoveredMember(null)}
                    />
                  );
                })
              )}
            </svg>

            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-black text-slate-900 dark:text-white">
                {hoveredMember ? `${hoveredMember.pctDisplay}%` : `${totalHours}h`}
              </span>
              <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                {hoveredMember ? hoveredMember.fullName.split(' ')[0] : 'Total Hours'}
              </span>
            </div>
          </div>

          <div className="space-y-2.5 mt-4">
            {donutSlices.map((slice, idx) => (
              <div
                key={idx}
                className={`flex items-center justify-between p-2 rounded-xl transition-colors ${
                  hoveredMember?.studentId === slice.studentId
                    ? 'bg-slate-100 dark:bg-slate-700/80 font-medium'
                    : 'hover:bg-slate-50 dark:hover:bg-slate-700/40'
                }`}
                onMouseEnter={() => setHoveredMember(slice)}
                onMouseLeave={() => setHoveredMember(null)}
              >
                <div className="flex items-center gap-2.5 overflow-hidden">
                  <span className={`w-3 h-3 rounded-full ${slice.color.fill}`} />
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[120px]">
                    {slice.fullName}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-900 dark:text-white">{slice.totalHours}h</span>
                  <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 min-w-[38px] text-right">
                    {slice.pctDisplay}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 2. Category Workload Distribution Chart */}
      <div className="lg:col-span-1 rounded-2xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-md border border-slate-200/80 dark:border-slate-700/80 p-6 shadow-sm flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <BarChart3 className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Work Category Breakdown</h3>
            </div>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Distribution</span>
          </div>

          <div className="space-y-4 my-2">
            {categoryArray.map((cat, idx) => {
              const bgClass = CATEGORY_COLORS[cat.name] || 'bg-slate-500';
              return (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">{cat.name}</span>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-slate-900 dark:text-white">{cat.hours}h</span>
                      <span className="text-slate-400 dark:text-slate-500">({cat.pct}%)</span>
                    </div>
                  </div>
                  <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${bgClass} rounded-full transition-all duration-500 ease-out`}
                      style={{ width: `${cat.pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span>Categorized by task type</span>
          <span className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> 8 Work Types
          </span>
        </div>
      </div>

      {/* 3. Weekly Contribution Timeline */}
      <div className="lg:col-span-1 rounded-2xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-md border border-slate-200/80 dark:border-slate-700/80 p-6 shadow-sm flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
                <Calendar className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Weekly Activity Timeline</h3>
            </div>
            <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2.5 py-1 rounded-full">
              6 Weeks
            </span>
          </div>

          <div className="h-48 flex items-end justify-between gap-3 pt-6 pb-2 px-2">
            {weeklyTimeline.map((item, idx) => {
              const heightPct = Math.min(100, Math.max(12, (item.hours / maxWeeklyHours) * 100));
              return (
                <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end group">
                  <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity mb-1">
                    {item.hours}h
                  </span>
                  <div className="w-full bg-slate-100 dark:bg-slate-700/60 rounded-xl h-full flex items-end overflow-hidden p-1">
                    <div
                      className="w-full bg-gradient-to-t from-blue-600 to-indigo-500 rounded-lg group-hover:from-blue-500 group-hover:to-indigo-400 transition-all duration-300"
                      style={{ height: `${heightPct}%` }}
                    />
                  </div>
                  <span className="mt-2 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                    {item.week}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span>Weekly group velocity</span>
          <span className="font-semibold text-slate-700 dark:text-slate-300">
            Avg: {(totalHours / 6).toFixed(1)} hrs/wk
          </span>
        </div>
      </div>
    </div>
  );
};

/* ==========================================================================
   SUBCOMPONENT 3: MEMBER STUDENT PROFILES & AUTOMATIC TASK TABLE
   ========================================================================== */
const ContributionMemberList = ({
  memberStats = [],
  contributions = [],
  currentUser = {},
  onEditContribution,
  onDeleteContribution,
  onOpenLogModal,
}) => {
  const [selectedStudentId, setSelectedStudentId] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const currentUserIdStr = currentUser?._id?.toString() || currentUser?.id?.toString() || '';

  const filteredContributions = contributions.filter((item) => {
    const sId = item.studentId?._id || item.studentId;
    if (selectedStudentId !== 'all' && sId?.toString() !== selectedStudentId?.toString()) {
      return false;
    }
    if (selectedCategory !== 'all' && item.category !== selectedCategory) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTask = item.task.toLowerCase().includes(q);
      const matchName = (item.studentId?.fullName || '').toLowerCase().includes(q);
      const matchCat = (item.category || '').toLowerCase().includes(q);
      return matchTask || matchName || matchCat;
    }
    return true;
  });

  const activeMember = memberStats.find((m) => m.studentId?.toString() === selectedStudentId?.toString());

  return (
    <div className="rounded-2xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-md border border-slate-200/80 dark:border-slate-700/80 p-6 shadow-sm mb-8">
      {/* Header & Log Action Button */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <User className="w-5 h-5 text-indigo-500" />
            Member Student Contributions & Auto-Tracked Work
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Work items automatically aggregate from system activity (reports, reviews, meetings) and member entries.
          </p>
        </div>

        <button
          onClick={() => onOpenLogModal()}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-semibold text-xs shadow-md shadow-indigo-500/20 transition-all duration-200"
        >
          <Plus className="w-4 h-4" />
          Log My Contribution
        </button>
      </div>

      {/* Student Profile Switcher Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-6 scrollbar-thin">
        <button
          onClick={() => setSelectedStudentId('all')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            selectedStudentId === 'all'
              ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm'
              : 'bg-slate-100 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
          }`}
        >
          All Members ({memberStats.length})
        </button>

        {memberStats.map((m) => (
          <button
            key={m.studentId}
            onClick={() => setSelectedStudentId(m.studentId)}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
              selectedStudentId === m.studentId
                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/20'
                : 'bg-slate-100 dark:bg-slate-700/60 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <div className="w-5 h-5 rounded-full bg-indigo-200 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 flex items-center justify-center text-[10px] font-extrabold">
              {m.fullName.charAt(0)}
            </div>
            <span>{m.fullName}</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-black/10 dark:bg-white/10 font-bold">
              {m.contributionPercentage}%
            </span>
          </button>
        ))}
      </div>

      {/* Profile Detail Card */}
      {activeMember && (
        <div className="mb-6 p-4 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/50 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white font-black text-lg flex items-center justify-center shadow-md">
              {activeMember.fullName.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-base font-bold text-slate-900 dark:text-white">{activeMember.fullName}</h4>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300">
                  ID: {activeMember.universityId}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {activeMember.email} • {activeMember.department || 'CSE'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <div className="text-center px-3 py-1.5 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-xs">
              <span className="block text-slate-400 text-[10px] font-semibold">Total Hours</span>
              <span className="font-extrabold text-indigo-600 dark:text-indigo-400 text-sm">
                {activeMember.totalHours} hrs
              </span>
            </div>

            <div className="text-center px-3 py-1.5 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-xs">
              <span className="block text-slate-400 text-[10px] font-semibold">Tasks Completed</span>
              <span className="font-extrabold text-emerald-600 dark:text-emerald-400 text-sm">
                {activeMember.completedTasksCount} / {activeMember.taskCount}
              </span>
            </div>

            <div className="text-center px-3 py-1.5 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-xs">
              <span className="block text-slate-400 text-[10px] font-semibold">Contribution Share</span>
              <span className="font-extrabold text-amber-600 dark:text-amber-400 text-sm">
                {activeMember.contributionPercentage}%
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Filter and Search Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-4">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search work tasks or member..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">All Categories</option>
            <option value="Research">Research</option>
            <option value="Frontend">Frontend</option>
            <option value="Backend">Backend</option>
            <option value="Documentation">Documentation</option>
            <option value="Testing">Testing</option>
            <option value="Data Analysis">Data Analysis</option>
            <option value="Presentation">Presentation</option>
            <option value="Other">Other</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto border border-slate-200 dark:border-slate-700/80 rounded-xl">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-700/40 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
              <th className="py-3 px-4">Member</th>
              <th className="py-3 px-4">Work Task & Milestone</th>
              <th className="py-3 px-4">Category</th>
              <th className="py-3 px-4 text-center">Hours</th>
              <th className="py-3 px-4 text-center">Status</th>
              <th className="py-3 px-4 text-center">Date Logged</th>
              <th className="py-3 px-4 text-right">Access / Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 text-xs">
            {filteredContributions.length === 0 ? (
              <tr>
                <td colSpan="7" className="py-8 text-center text-slate-400 dark:text-slate-500 font-medium">
                  No contribution logs found matching the filter. Click "Log My Contribution" to add work.
                </td>
              </tr>
            ) : (
              filteredContributions.map((item) => {
                const studentName = item.studentId?.fullName || 'Unknown Student';
                const sIdStr = item.studentId?._id?.toString() || item.studentId?.toString();
                const isMyOwnWork = currentUserIdStr && sIdStr === currentUserIdStr;
                const isAutoTracked = Boolean(item.isAutomated);

                const badgeStyle = CATEGORY_BADGES[item.category] || CATEGORY_BADGES.Other;
                const formattedDate = new Date(item.logDate || item.createdAt).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                });

                return (
                  <tr
                    key={item._id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-700/30 transition-colors group"
                  >
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-700 font-bold text-slate-700 dark:text-slate-300 flex items-center justify-center text-xs">
                          {studentName.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white leading-tight">{studentName}</p>
                          <p className="text-[10px] text-slate-400">{item.studentId?.email || ''}</p>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <p className="font-semibold text-slate-800 dark:text-slate-200">{item.task}</p>
                          {isAutoTracked && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-indigo-300 text-[9px] font-extrabold">
                              <Zap className="w-3 h-3 text-amber-500" /> Auto System Activity
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] font-medium text-slate-400">
                            {item.milestone || 'General Progress'}
                          </span>
                          {item.proofLink && (
                            <a
                              href={item.proofLink}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[10px] text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-0.5"
                            >
                              <ExternalLink className="w-3 h-3" /> Proof
                            </a>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border ${badgeStyle}`}>
                        {item.category}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-center font-extrabold text-slate-900 dark:text-white whitespace-nowrap">
                      {item.hoursSpent} hrs
                    </td>

                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          item.status === 'Completed'
                            ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                            : 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300'
                        }`}
                      >
                        {item.status === 'Completed' ? (
                          <CheckCircle2 className="w-3 h-3" />
                        ) : (
                          <Clock className="w-3 h-3" />
                        )}
                        {item.status}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-center text-slate-500 dark:text-slate-400 whitespace-nowrap text-[11px]">
                      {formattedDate}
                    </td>

                    {/* Actions & Permission Control */}
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      {isMyOwnWork && !isAutoTracked ? (
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => onEditContribution(item)}
                            className="p-1.5 rounded-lg text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 transition-colors"
                            title="Edit Your Log"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onDeleteContribution(item._id)}
                            className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors"
                            title="Delete Your Log"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-end gap-1 text-slate-400 dark:text-slate-500 text-[10px] font-medium">
                          <Lock className="w-3.5 h-3.5" />
                          <span>{isAutoTracked ? 'Auto System Activity' : "Member's Work (Read-Only)"}</span>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

/* ==========================================================================
   SUBCOMPONENT 4: LOG / EDIT MODAL DIALOG (AUTOLOGGED TO CURRENT USER)
   ========================================================================== */
const ContributionLogModal = ({
  isOpen,
  onClose,
  onSubmit,
  editItem = null,
  groupId,
  currentUser = {},
}) => {
  const [formData, setFormData] = useState({
    task: '',
    category: 'Research',
    hoursSpent: 10,
    status: 'Completed',
    milestone: 'General Progress',
    proofLink: '',
    logDate: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    if (editItem) {
      setFormData({
        task: editItem.task || '',
        category: editItem.category || 'Research',
        hoursSpent: editItem.hoursSpent || 0,
        status: editItem.status || 'Completed',
        milestone: editItem.milestone || 'General Progress',
        proofLink: editItem.proofLink || '',
        logDate: editItem.logDate
          ? new Date(editItem.logDate).toISOString().split('T')[0]
          : new Date().toISOString().split('T')[0],
      });
    } else {
      setFormData({
        task: '',
        category: 'Research',
        hoursSpent: 10,
        status: 'Completed',
        milestone: 'Phase 2 - Development',
        proofLink: '',
        logDate: new Date().toISOString().split('T')[0],
      });
    }
  }, [editItem, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.task.trim()) {
      alert('Please provide a task description.');
      return;
    }

    const sId = currentUser?._id || currentUser?.id;

    onSubmit({
      ...formData,
      thesisGroupId: groupId,
      studentId: sId,
      hoursSpent: Number(formData.hoursSpent),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-xl rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-700/80 bg-slate-50/50 dark:bg-slate-800/50">
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            {editItem ? 'Edit My Contribution Log' : 'Log My Contribution Work'}
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs font-medium">
          {/* Automatic Logging Identity Banner */}
          <div className="p-3 rounded-xl bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/60 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-indigo-600 text-white font-extrabold flex items-center justify-center text-xs">
              {(currentUser.fullName || 'U').charAt(0)}
            </div>
            <div>
              <p className="text-[11px] font-bold text-indigo-900 dark:text-indigo-200">
                Logging Work For: {currentUser.fullName || 'Current User'}
              </p>
              <p className="text-[10px] text-indigo-600 dark:text-indigo-400">
                {currentUser.email || 'Automated Student Attribution'}
              </p>
            </div>
          </div>

          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1.5">
              Task / Work Executed
            </label>
            <input
              type="text"
              placeholder="e.g. Implemented REST API authentication & JWT middleware"
              value={formData.task}
              onChange={(e) => setFormData({ ...formData, task: e.target.value })}
              className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-700 font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1.5">
                Work Category
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-700 font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                <option value="Research">Research</option>
                <option value="Frontend">Frontend</option>
                <option value="Backend">Backend</option>
                <option value="Documentation">Documentation</option>
                <option value="Testing">Testing</option>
                <option value="Data Analysis">Data Analysis</option>
                <option value="Presentation">Presentation</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1.5 flex items-center justify-between">
                <span>Hours Spent</span>
                <span className="font-extrabold text-indigo-600 dark:text-indigo-400">
                  {formData.hoursSpent} hrs
                </span>
              </label>
              <input
                type="number"
                min="1"
                max="200"
                value={formData.hoursSpent}
                onChange={(e) => setFormData({ ...formData, hoursSpent: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1.5">
                Task Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-700 font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                <option value="Completed">Completed</option>
                <option value="In Progress">In Progress</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1.5 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                Date Logged
              </label>
              <input
                type="date"
                value={formData.logDate}
                onChange={(e) => setFormData({ ...formData, logDate: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-700 font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1.5">
              Project Milestone / Phase
            </label>
            <input
              type="text"
              placeholder="e.g. Phase 2 - System Implementation"
              value={formData.milestone}
              onChange={(e) => setFormData({ ...formData, milestone: e.target.value })}
              className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-700 font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1.5 flex items-center gap-1">
              <LinkIcon className="w-3.5 h-3.5 text-slate-400" />
              Proof / GitHub Commit Link (Optional)
            </label>
            <input
              type="url"
              placeholder="https://github.com/ThesisSphere/commit/..."
              value={formData.proofLink}
              onChange={(e) => setFormData({ ...formData, proofLink: e.target.value })}
              className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-700 font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-700/80">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold shadow-md shadow-indigo-500/20 transition-all"
            >
              {editItem ? 'Update Log' : 'Save Contribution'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* ==========================================================================
   MAIN PAGE CONTAINER
   ========================================================================== */
const Contributions = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  const [trackerData, setTrackerData] = useState({
    group: null,
    allGroups: [],
    summary: {},
    categoryStats: {},
    weeklyTimeline: [],
    memberStats: [],
    contributions: [],
  });

  const [selectedGroupId, setSelectedGroupId] = useState('default');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [seeding, setSeeding] = useState(false);

  const currentUser = JSON.parse(localStorage.getItem('thesisSphereUser') || '{}');

  const fetchTrackerData = useCallback(async (gId) => {
    try {
      setLoading(true);
      setError(null);
      const data = await getGroupContributions(gId);
      if (data.success) {
        setTrackerData({
          group: data.group,
          allGroups: data.allGroups || [],
          summary: data.summary || {},
          categoryStats: data.categoryStats || {},
          weeklyTimeline: data.weeklyTimeline || [],
          memberStats: data.memberStats || [],
          contributions: data.contributions || [],
        });
        if (data.group && gId === 'default') {
          setSelectedGroupId(data.group._id);
        }
      }
    } catch (err) {
      console.error('Error fetching contribution tracker data:', err);
      setError(err.message || 'Failed to load contribution tracker data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTrackerData(selectedGroupId);
  }, [selectedGroupId, fetchTrackerData]);

  const handleGroupChange = (e) => {
    const newId = e.target.value;
    setSelectedGroupId(newId);
  };

  const handleOpenAddModal = () => {
    setEditingItem(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleModalSubmit = async (formData) => {
    try {
      if (editingItem) {
        await updateContribution(editingItem._id, {
          ...formData,
          requestingUserId: currentUser._id,
        });
        showToast('Contribution log updated successfully!');
      } else {
        await addContribution({
          ...formData,
          requestingUserId: currentUser._id,
        });
        showToast('Contribution log created under your profile!');
      }
      setIsModalOpen(false);
      setEditingItem(null);
      fetchTrackerData(selectedGroupId);
    } catch (err) {
      alert(err.message || 'Failed to save contribution log');
    }
  };

  const handleDeleteContribution = async (id) => {
    if (!window.confirm('Are you sure you want to delete your contribution log?')) {
      return;
    }
    try {
      await deleteContribution(id);
      showToast('Contribution log removed.');
      fetchTrackerData(selectedGroupId);
    } catch (err) {
      alert(err.message || 'Failed to delete log');
    }
  };

  const handleSeedData = async () => {
    try {
      setSeeding(true);
      const targetGroup = trackerData.group?._id || selectedGroupId;
      const res = await seedGroupContributions(targetGroup);
      showToast(res.message || 'Sample contribution data seeded!');
      fetchTrackerData(targetGroup);
    } catch (err) {
      alert(err.message || 'Failed to seed sample data');
    } finally {
      setSeeding(false);
    }
  };

  const showToast = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => {
      setSuccessMsg(null);
    }, 4000);
  };

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Toast Notification */}
      {successMsg && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-2 px-4 py-3 rounded-2xl bg-emerald-600 text-white font-bold text-xs shadow-xl animate-bounce">
          <Sparkles className="w-4 h-4" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Main Banner Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-900 via-slate-900 to-slate-950 p-6 sm:p-8 text-white shadow-xl">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-bold mb-3 backdrop-blur-md">
              <Activity className="w-3.5 h-3.5 text-indigo-400" />
              Automated & Verified Contribution Tracker
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Group Contribution Tracker
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-slate-300 max-w-2xl">
              Inspect individual member contributions automatically derived from platform work (progress reports, paper reviews, meetings) and self-logged tasks.
            </p>

            {trackerData.group && (
              <div className="mt-3 flex items-center gap-3 text-xs font-semibold text-indigo-200">
                <span className="bg-indigo-950/60 border border-indigo-800/60 px-3 py-1 rounded-lg">
                  Group: <strong className="text-white">{trackerData.group.groupName}</strong>
                </span>
                {trackerData.group.topic && (
                  <span className="bg-slate-800/60 border border-slate-700/60 px-3 py-1 rounded-lg truncate max-w-xs">
                    Topic: <strong className="text-white">{trackerData.group.topic.title}</strong>
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Action & Group Switcher Controls */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Faculty / Admin Mode: Monitor Any Supervised Group */}
            {(currentUser?.role === 'faculty' || currentUser?.role === 'admin') && trackerData.allGroups?.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-indigo-200 hidden sm:inline">Monitor Group:</span>
                <select
                  value={selectedGroupId}
                  onChange={handleGroupChange}
                  className="px-3.5 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/15 text-xs font-bold text-white backdrop-blur-md focus:outline-none focus:ring-2 focus:ring-indigo-400"
                >
                  {trackerData.allGroups.map((g) => (
                    <option key={g._id} value={g._id} className="text-slate-900 bg-white">
                      {g.groupName} ({g.topicId?.title || 'Supervised Thesis Group'})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <button
              onClick={() => fetchTrackerData(selectedGroupId)}
              className="p-2.5 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/15 text-white backdrop-blur-md transition-all active:scale-95"
              title="Refresh Data"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>

            <button
              onClick={handleOpenAddModal}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-indigo-500 hover:bg-indigo-600 active:scale-95 text-xs font-extrabold text-white shadow-lg shadow-indigo-500/30 transition-all"
            >
              <Plus className="w-4 h-4" />
              Log My Contribution
            </button>
          </div>
        </div>

        <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Main View */}
      {loading && !trackerData.group ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-bold text-slate-500">Loading contribution graphs and student profiles...</p>
        </div>
      ) : error ? (
        <div className="p-6 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-6 h-6" />
            <div>
              <h4 className="font-bold text-sm">Error Loading Contribution Tracker</h4>
              <p className="text-xs">{error}</p>
            </div>
          </div>
        </div>
      ) : (
        <>
          <ContributionOverviewCard
            summary={trackerData.summary}
            groupProgress={trackerData.group?.progress}
          />

          <ContributionCharts
            memberStats={trackerData.memberStats}
            categoryStats={trackerData.categoryStats}
            weeklyTimeline={trackerData.weeklyTimeline}
          />

          <ContributionMemberList
            memberStats={trackerData.memberStats}
            contributions={trackerData.contributions}
            currentUser={currentUser}
            onEditContribution={handleOpenEditModal}
            onDeleteContribution={handleDeleteContribution}
            onOpenLogModal={handleOpenAddModal}
          />
        </>
      )}

      <ContributionLogModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleModalSubmit}
        editItem={editingItem}
        groupId={trackerData.group?._id || selectedGroupId}
        currentUser={currentUser}
      />
    </div>
  );
};

export default Contributions;
