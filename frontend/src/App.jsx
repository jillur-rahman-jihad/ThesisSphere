import React, { useState, useEffect } from "react";
import AuthPage from "./AuthPage";

function FacultyDashboard({ user, onLogout }) {
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col justify-center items-center">
      <h1 className="text-4xl font-bold text-blue-600">
        Hello, {user.fullName}
      </h1>

      <p className="text-gray-600 mt-2">
        Welcome to Faculty Dashboard
      </p>

      <button
        onClick={onLogout}
        className="mt-6 bg-red-500 text-white px-5 py-2 rounded hover:bg-red-600"
      >
        Logout
      </button>
    </div>
  );
}

function StudentDashboard({ user, onLogout }) {
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col justify-center items-center">
      <h1 className="text-4xl font-bold text-green-600">
        Hello, {user.fullName}
      </h1>

      <p className="text-gray-600 mt-2">
        Welcome to Student Dashboard
      </p>

      <button
        onClick={onLogout}
        className="mt-6 bg-red-500 text-white px-5 py-2 rounded hover:bg-red-600"
      >
        Logout
      </button>
    </div>
  );
}

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);

  // Check localStorage when app loads
  useEffect(() => {
    const storedUser = localStorage.getItem("thesisSphereUser");

    if (storedUser) {
      try {
        setCurrentUser(JSON.parse(storedUser));
      } catch {
        localStorage.removeItem("thesisSphereUser");
      }
    }
  }, []);

  // Called after successful login/register
  const handleLoginSuccess = (userData) => {
    setCurrentUser(userData);
  };

  // Logout
  const handleLogout = () => {
    localStorage.removeItem("thesisSphereUser");
    setCurrentUser(null);
  };

  // Show login page
  if (!currentUser) {
    return (
      <AuthPage
        onLoginSuccess={handleLoginSuccess}
      />
    );
  }

  // Faculty dashboard
  if (currentUser.role === "faculty") {
    return (
      <FacultyDashboard
        user={currentUser}
        onLogout={handleLogout}
      />
    );
  }

  // Student dashboard
  return (
    <StudentDashboard
      user={currentUser}
      onLogout={handleLogout}
    />
  );
}