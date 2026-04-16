import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { auth } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';

const ProtectedRoute = ({ children, allowedRole }) => {
  const [authUser, setAuthUser] = useState(undefined);
  const currentRole = localStorage.getItem('user_role');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setAuthUser(user);
    });
    return unsubscribe;
  }, []);

  if (authUser === undefined) {
    return null;
  }

  if (!authUser) {
    localStorage.removeItem('user_role');
    return <Navigate to="/login" replace />;
  }

  // If they aren't logged in at all, kick them to the login page
  if (!currentRole) {
    return <Navigate to="/login" replace />;
  }

  // If a Student tries to access an Admin page (or vice versa), redirect them
  if (allowedRole && currentRole !== allowedRole) {
    return <Navigate to={currentRole === 'admin' ? '/dashboard' : '/student/dashboard'} replace />;
  }

  // If they pass the checks, let them render the page!
  return children;
};

export default ProtectedRoute;