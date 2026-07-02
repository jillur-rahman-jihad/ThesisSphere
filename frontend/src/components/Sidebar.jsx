import React from 'react';
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
  GraduationCap
} from 'lucide-react';

const Sidebar = ({ currentUser }) => {
  const isStudent = currentUser?.role === 'student';

  const navItems = isStudent 
    ? [
        { name: 'Dashboard', icon: LayoutDashboard, active: true },
        { name: 'Find Supervisor', icon: Search, badge: 3 },
        { name: 'Discussion Forum', icon: MessageSquare },
        { name: 'Thesis Groups', icon: Users },
        { name: 'Browse Topics', icon: Lightbulb },
        { name: 'Meetings', icon: Video },
        { name: 'Messages', icon: Mail, badge: 3 },
        { name: 'Deadline Calendar', icon: Calendar },
        { name: 'Reports', icon: FileText },
        { name: 'Paper Reviews', icon: BookOpen },
        { name: 'Contributions', icon: BarChart2 },
        { name: 'Notifications', icon: Bell, badge: 3 },
        { name: 'My Profile', icon: User },
      ]
    : [
        { name: 'Workload Dashboard', icon: LayoutDashboard, active: true },
        { name: 'Post Topics', icon: Lightbulb },
        { name: 'Meetings', icon: Video },
        { name: 'Messages', icon: Mail, badge: 2 },
        { name: 'Calendar', icon: Calendar },
        { name: 'Paper Reviews', icon: BookOpen },
        { name: 'Notifications', icon: Bell, badge: 3 },
        { name: 'My Profile', icon: User },
      ];

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  };

  return (
    <div className="w-[260px] bg-[#1a1f2e] h-screen flex flex-col text-slate-300 font-['Inter',sans-serif] border-r border-slate-800 flex-shrink-0">
      
      {/* Logo Area */}
      <div className="p-6 pb-4">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-8 h-8 bg-amber-600 rounded-lg flex items-center justify-center text-white">
            <GraduationCap className="w-5 h-5" />
          </div>
          <span className="text-xl font-bold text-white tracking-tight">ThesisSphere</span>
        </div>

        {/* Role Toggle Indicator */}
        <div className="flex p-1 bg-[#131722] rounded-lg border border-slate-800/60 mb-2">
          <div className={`flex-1 text-center py-1.5 text-xs font-semibold rounded-md ${isStudent ? 'bg-amber-600 text-white' : 'text-slate-500'}`}>
            Student
          </div>
          <div className={`flex-1 text-center py-1.5 text-xs font-semibold rounded-md ${!isStudent ? 'bg-amber-600 text-white' : 'text-slate-500'}`}>
            Faculty
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto px-4 py-2 space-y-1 custom-scrollbar">
        {navItems.map((item, index) => (
          <button 
            key={index}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors group ${
              item.active 
                ? 'bg-amber-600/10 text-amber-500' 
                : 'hover:bg-slate-800/50 text-slate-400 hover:text-slate-200'
            }`}
          >
            <div className="flex items-center gap-3">
              <item.icon className={`w-4 h-4 ${item.active ? 'text-amber-500' : 'text-slate-400 group-hover:text-slate-200'}`} />
              <span className={`text-[0.85rem] font-medium ${item.active ? 'text-amber-500' : ''}`}>
                {item.name}
              </span>
            </div>
            {item.badge && (
              <span className="bg-amber-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                {item.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* User Profile Footer */}
      <div className="p-4 border-t border-slate-800/60">
        <div className="flex items-center gap-3 px-2">
          <div className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            {getInitials(currentUser?.fullName)}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-[0.85rem] font-bold text-slate-200 truncate">
              {currentUser?.fullName || 'User Name'}
            </h4>
            <p className="text-[0.65rem] text-slate-500 truncate mt-0.5">
              {isStudent ? 'Student • ThesisSphere' : currentUser?.designation || 'Faculty • ThesisSphere'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
