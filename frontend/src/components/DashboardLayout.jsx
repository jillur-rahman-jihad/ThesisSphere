import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar.jsx';
import { useTheme } from '../context/ThemeContext';
import { Moon, Sun } from 'lucide-react';

const DashboardLayout = ({ currentUser, onLogout }) => {
  const { theme, toggleTheme } = useTheme();
  return (
    <div className="flex h-screen w-full bg-[#f8f9fa] dark:bg-slate-900 text-slate-900 dark:text-white dark:text-slate-100 overflow-hidden font-['Inter',sans-serif] transition-colors duration-300">
      {/* Left Sidebar */}
      <Sidebar currentUser={currentUser} />

      {/* Right Content Area (Main Dashboard) */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Top Header */}
        <header className="h-[72px] bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between px-8 flex-shrink-0 transition-colors duration-300">
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 dark:text-white">
            {currentUser?.role === 'student' ? 'Dashboard' : 'Supervisor Dashboard'}
          </h2>
          
          <div className="flex items-center gap-4">
            <button 
              onClick={toggleTheme}
              className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-500 dark:text-slate-400 dark:text-amber-400 transition-colors flex-shrink-0"
              title="Toggle Dark Mode"
            >
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
             <button
              onClick={onLogout}
              className="text-sm font-semibold text-rose-500 hover:text-rose-600 px-4 py-2 bg-rose-50 hover:bg-rose-100 dark:bg-rose-500/10 dark:hover:bg-rose-500/20 rounded-lg transition-colors"
            >
              Log out
            </button>
          </div>
        </header>

        {/* Scrollable Main Content renders the matched child route component */}
        <main className="flex-1 overflow-y-auto p-8">
            <Outlet context={{ currentUser }} />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
