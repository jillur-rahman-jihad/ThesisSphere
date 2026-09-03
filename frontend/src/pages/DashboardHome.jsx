import React, { useEffect, useState, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import StudentDashboardContent from '../components/StudentDashboardContent.jsx';
import FacultyDashboardContent from '../components/FacultyDashboardContent.jsx';

const DashboardHome = () => {
  const { currentUser } = useOutletContext() || {};
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadDashboard = useCallback(async () => {
    if (!currentUser?.token) {
      setError('Missing authentication token. Please log in again.');
      setLoading(false);
      return;
    }

    try {
      const endpoint = currentUser.role === 'faculty' ? '/api/dashboard/faculty' : '/api/dashboard/student';
      const response = await fetch(endpoint, {
        headers: {
          Authorization: `Bearer ${currentUser.token}`,
        },
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Failed to load dashboard data');
      }

      setDashboardData(result.data);
      setError('');
    } catch (fetchError) {
      setError(fetchError.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, [currentUser?.token, currentUser?.role]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  if (currentUser?.role === 'faculty') {
    return (
      <FacultyDashboardContent
        user={currentUser}
        dashboardData={dashboardData}
        loading={loading}
        error={error}
        onRefresh={loadDashboard}
      />
    );
  }

  return (
    <StudentDashboardContent
      user={currentUser}
      dashboardData={dashboardData}
      loading={loading}
      error={error}
      onRefresh={loadDashboard}
    />
  );
};

export default DashboardHome;
