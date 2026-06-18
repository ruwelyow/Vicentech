import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import AccessDenied from '../components/AccessDenied';

const RoleRoute = ({ children, allowedRoles, allowGuest = false }) => {
  // Get user from localStorage (or from your global state)
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  const location = useLocation();

  if (!user) {
    // Not logged in
    if (allowGuest) {
      // Allow guest access for public pages
      return children;
    }
    return <Navigate to="/login" />;
  }

  // Determine role
  let role = 'user';
  if (user.is_admin) {
    role = 'admin';
  } else if (user.is_staff) {
    role = 'staff';
  } else if (user.is_priest) {
    role = 'priest';
  }

  // Check if user role is allowed (only if allowedRoles is specified)
  if (allowedRoles && !allowedRoles.includes(role)) {
    // Show Access Denied page instead of redirecting
    return <AccessDenied userRole={role} attemptedRoute={location.pathname} />;
  }

  // Allowed, render the component
  return children;
};

export default RoleRoute;
