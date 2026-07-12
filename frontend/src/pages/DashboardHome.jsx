import React from 'react';
import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import StudentDashboardContent from '../components/StudentDashboardContent.jsx';
import FacultyDashboardContent from '../components/FacultyDashboardContent.jsx';

const DashboardHome = () => {
  const { currentUser } = useOutletContext() || {};
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;

    const loadDashboard = async () => {
      if (!currentUser?.token) {
        if (isMounted) {
          setError('Missing authentication token. Please log in again.');
          setLoading(false);
        }
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

        if (isMounted) {
          setDashboardData(result.data);
          setError('');
        }
      } catch (fetchError) {
        if (isMounted) {
          setError(fetchError.message || 'Failed to load dashboard data');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadDashboard();

    return () => {
      isMounted = false;
    };
  }, [currentUser?.token, currentUser?.role]);

  if (currentUser?.role === 'faculty') {
    return (
      <FacultyDashboardContent
        user={currentUser}
        dashboardData={dashboardData}
        loading={loading}
        error={error}
      />
    );
  }

  return (
    <StudentDashboardContent
      user={currentUser}
      dashboardData={dashboardData}
      loading={loading}
      error={error}
    />
  );
};

export default DashboardHome;
