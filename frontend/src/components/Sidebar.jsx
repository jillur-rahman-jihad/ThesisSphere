import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import {
  LayoutDashboard,
  Search,
  MessageSquare,
  Users,
  Lightbulb,
  Video,
  Mail,
  Calendar,
  FileText,
  BookOpen,
  BarChart2,
  Bell,
  User,
  GraduationCap,
} from 'lucide-react';

const Sidebar = ({ currentUser }) => {
  const { theme, toggleTheme } = useTheme();
  const isStudent = currentUser?.role === 'student';

  const [liveCounts, setLiveCounts] = useState({
    unreadNotifications: 0,
    unreadMessages: 0,
  });

  // Fetch real counts from backend
  useEffect(() => {
    let isMounted = true;

    const fetchCounts = async () => {
      if (!currentUser?.token) return;
      try {
        const res = await fetch('/api/dashboard/counts', {
          headers: {
            Authorization: `Bearer ${currentUser.token}`,
          },
        });
        if (res.ok) {
          const data = await res.json();
          if (data.success && isMounted) {
            setLiveCounts(data.data);
          }
        }
      } catch (err) {
        // Silently fail if server is busy
      }
    };

    fetchCounts();
    const interval = setInterval(fetchCounts, 30000); // refresh every 30 seconds

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [currentUser?.token]);

  const navItems = isStudent
    ? [
        { name: 'Dashboard', icon: LayoutDashboard, path: '/' },
        { name: 'Find Supervisor', icon: Search, path: '/find-supervisor' },
        { name: 'Discussion Forum', icon: MessageSquare, path: '/discussion' },
        { name: 'Thesis Groups', icon: Users, path: '/groups' },
        { name: 'Browse Topics', icon: Lightbulb, path: '/topics' },
        { name: 'Meetings', icon: Video, path: '/meetings' },
        {
          name: 'Messages',
          icon: Mail,
          badge: liveCounts.unreadMessages > 0 ? liveCounts.unreadMessages : null,
          path: '/messages',
        },
        { name: 'Deadline Calendar', icon: Calendar, path: '/calendar' },
        { name: 'My Applications', icon: FileText, path: '/applications' },
        { name: 'Paper Reviews', icon: BookOpen, path: '/reviews' },
        { name: 'Citation Generator', icon: BookOpen, path: '/citations' },
        { name: 'Contributions', icon: BarChart2, path: '/contributions' },
        { name: 'Automated Report', icon: FileText, path: '/automated-report' },
        {
          name: 'Notifications',
          icon: Bell,
          badge: liveCounts.unreadNotifications > 0 ? liveCounts.unreadNotifications : null,
          path: '/notifications',
        },
        { name: 'My Profile', icon: User, path: '/profile' },
      ]
    : [
        { name: 'Workload Dashboard', icon: LayoutDashboard, path: '/' },
        { name: 'Post Topics', icon: Lightbulb, path: '/post-topics' },
        { name: 'Discussion Forum', icon: MessageSquare, path: '/discussion' },
        { name: 'Group Manager', icon: Users, path: '/supervisor/group-manager' },
        { name: 'Meetings', icon: Video, path: '/meetings' },
        {
          name: 'Messages',
          icon: Mail,
          badge: liveCounts.unreadMessages > 0 ? liveCounts.unreadMessages : null,
          path: '/messages',
        },
        { name: 'Calendar', icon: Calendar, path: '/calendar' },
        { name: 'Paper Reviews', icon: BookOpen, path: '/reviews' },
        { name: 'Citation Generator', icon: BookOpen, path: '/citations' },
        {
          name: 'Notifications',
          icon: Bell,
          badge: liveCounts.unreadNotifications > 0 ? liveCounts.unreadNotifications : null,
          path: '/notifications',
        },
        { name: 'My Profile', icon: User, path: '/faculty-profile' },
      ];

  const getInitials = (name) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <div className="w-[260px] bg-[#1a1f2e] h-screen flex flex-col text-slate-300 font-['Inter',sans-serif] border-r border-slate-800 flex-shrink-0 print-hidden">
      {/* Logo Area */}
      <div className="p-6 pb-4">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-8 h-8 bg-amber-600 rounded-lg flex items-center justify-center text-white">
            <GraduationCap className="w-5 h-5" />
          </div>
          <span className="text-xl font-bold text-white tracking-tight">
            ThesisSphere
          </span>
        </div>

        {/* Role Toggle Indicator */}
        <div className="flex p-1 bg-[#131722] rounded-lg border border-slate-800/60 mb-2">
          <div
            className={`flex-1 text-center py-1.5 text-xs font-semibold rounded-md ${
              isStudent
                ? 'bg-amber-600 text-white'
                : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            Student
          </div>

          <div
            className={`flex-1 text-center py-1.5 text-xs font-semibold rounded-md ${
              !isStudent
                ? 'bg-amber-600 text-white'
                : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            Faculty
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto px-4 py-2 space-y-1 custom-scrollbar">
        {navItems.map((item, index) => (
          <NavLink
            key={index}
            to={item.path}
            className={({ isActive }) =>
              `w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors group ${
                isActive
                  ? 'bg-amber-600/10 text-amber-500'
                  : 'hover:bg-slate-800/50 text-slate-400 hover:text-slate-200'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <div className="flex items-center gap-3">
                  <item.icon
                    className={`w-4 h-4 ${
                      isActive
                        ? 'text-amber-500'
                        : 'text-slate-400 group-hover:text-slate-200'
                    }`}
                  />
                  <span
                    className={`text-[0.85rem] font-medium ${
                      isActive ? 'text-amber-500' : ''
                    }`}
                  >
                    {item.name}
                  </span>
                </div>

                {Boolean(item.badge) && (
                  <span className="bg-amber-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center shadow-sm">
                    {item.badge}
                  </span>
                )}
              </>
            )}
          </NavLink>
        ))}
      </div>

      {/* Bottom Profile Area */}
      <div className="p-4 border-t border-slate-800/60 text-center">
        <h4 className="text-[0.85rem] font-bold text-slate-200 truncate px-2">
          {currentUser?.fullName || 'User Name'}
        </h4>

        <p className="text-[0.65rem] text-slate-500 dark:text-slate-400 truncate mt-1 px-2">
          {isStudent
            ? currentUser?.department
              ? `${currentUser.department} • Student`
              : 'Student • ThesisSphere'
            : currentUser?.designation || currentUser?.department || 'Faculty • ThesisSphere'}
        </p>
      </div>
    </div>
  );
};

export default Sidebar;
