import React from 'react';
import StudentDashboardContent from './components/StudentDashboardContent.jsx';

export default function StudentDashboard({ user }) {
  return <StudentDashboardContent user={user} />;
}