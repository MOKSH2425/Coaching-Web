import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children, allowedRole }) => {
  const currentRole = localStorage.getItem('user_role');

  // If they aren't logged in at all, kick them to the login page
  if (!currentRole) {
    return <Navigate to="/login" replace />;
  }

  // If a Student tries to access an Admin page (or vice versa), redirect them
  if (allowedRole && currentRole !== allowedRole) {
    return <Navigate to={currentRole === 'admin' ? '/dashboard' : '/student-dashboard'} replace />;
  }

  // If they pass the checks, let them render the page!
  return children;
};

export default ProtectedRoute;