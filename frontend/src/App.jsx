import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AuthPage from './AuthPage.jsx';
import DashboardLayout from './components/DashboardLayout.jsx';

// Pages
import DashboardHome from './pages/DashboardHome';
import FindSupervisor from './pages/FindSupervisor';
import DiscussionForum from './pages/DiscussionForum';
import ThesisGroups from './pages/ThesisGroups';
import BrowseTopics from './pages/BrowseTopics';
import Meetings from './pages/Meetings';
import Messages from './pages/Messages';
import Calendar from './pages/Calendar';
import Reports from './pages/Reports';
import PaperReviews from './pages/PaperReviews';
import Contributions from './pages/Contributions';
import Notifications from './pages/Notifications';
import Profile from './pages/Profile';
import PostTopics from './pages/PostTopics';

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check for stored user on mount
  useEffect(() => {
    const stored = localStorage.getItem('thesisSphereUser');
    if (stored) {
      try {
        setCurrentUser(JSON.parse(stored));
      } catch {
        localStorage.removeItem('thesisSphereUser');
      }
    }
    setLoading(false);
  }, []);

  const handleLoginSuccess = (userData) => {
    setCurrentUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('thesisSphereUser');
    setCurrentUser(null);
  };

  if (loading) {
    return null; // Or a loading spinner
  }

  return (
    <Router>
      <Routes>
        {/* If no user, show auth page on all routes */}
        {!currentUser ? (
          <Route path="*" element={<AuthPage onLoginSuccess={handleLoginSuccess} />} />
        ) : (
          /* Protected Routes wrapped in DashboardLayout */
          <Route path="/" element={<DashboardLayout currentUser={currentUser} onLogout={handleLogout} />}>
            <Route index element={<DashboardHome />} />
            <Route path="find-supervisor" element={<FindSupervisor />} />
            <Route path="discussion" element={<DiscussionForum />} />
            <Route path="groups" element={<ThesisGroups />} />
            <Route path="topics" element={<BrowseTopics />} />
            <Route path="meetings" element={<Meetings />} />
            <Route path="messages" element={<Messages />} />
            <Route path="calendar" element={<Calendar />} />
            <Route path="reports" element={<Reports />} />
            <Route path="reviews" element={<PaperReviews />} />
            <Route path="contributions" element={<Contributions />} />
            <Route path="notifications" element={<Notifications />} />
            <Route path="profile" element={<Profile />} />
            <Route path="post-topics" element={<PostTopics />} />
            
            {/* Catch-all for logged in users */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        )}
      </Routes>
    </Router>
  );
}