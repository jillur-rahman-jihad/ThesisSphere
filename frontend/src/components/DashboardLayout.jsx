import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar.jsx';

const DashboardLayout = ({ currentUser, onLogout }) => {
  return (
    <div className="flex h-screen w-full bg-[#f8f9fa] overflow-hidden font-['Inter',sans-serif]">
      {/* Left Sidebar */}
      <Sidebar currentUser={currentUser} />

      {/* Right Content Area (Main Dashboard) */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Top Header */}
        <header className="h-[72px] bg-white border-b border-slate-200 flex items-center justify-between px-8 flex-shrink-0">
          <h2 className="text-lg font-bold text-slate-800">
            {currentUser?.role === 'student' ? 'Dashboard' : 'Supervisor Dashboard'}
          </h2>
          
          <div className="flex items-center gap-4">
             <button
              onClick={onLogout}
              className="text-sm font-semibold text-rose-500 hover:text-rose-600 px-4 py-2 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors"
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
