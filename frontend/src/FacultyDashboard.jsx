import React from 'react';
import { Navigate } from 'react-router-dom';

/**
 * Obsolete stub replaced by DashboardHome.
 * Automatically redirects to the unified dynamic dashboard.
 */
export default function FacultyDashboard() {
  return <Navigate to="/" replace />;
}