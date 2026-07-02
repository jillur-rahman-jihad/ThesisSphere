import React, { useState, useEffect } from 'react';
import AuthPage from './AuthPage.jsx';
import DashboardLayout from './components/DashboardLayout.jsx';

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);

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
  }, []);

  const handleLoginSuccess = (userData) => {
    setCurrentUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('thesisSphereUser');
    setCurrentUser(null);
  };

  // If no user is logged in, show Auth page
  if (!currentUser) {
    return <AuthPage onLoginSuccess={handleLoginSuccess} />;
  }

  // Show the new Dashboard layout for logged in users
  return <DashboardLayout currentUser={currentUser} onLogout={handleLogout} />;
}