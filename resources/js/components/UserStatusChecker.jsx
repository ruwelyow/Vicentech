import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../utils/axios';

const UserStatusChecker = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const checkUserStatus = async () => {
      try {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        if (!user.id) {
          return;
        }


        // Check user status from server using the /me endpoint
        const response = await fetch('/api/me', {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
          },
        });

        if (!response.ok) {
          return;
        }

        const userData = await response.json();
        const status = userData.status || 'active';
        const deactivatedAt = userData.deactivated_at;


        // Check if user was deactivated after they logged in
        const userLoginTime = user.lastLoginTime || user.created_at;
        const wasDeactivatedAfterLogin = deactivatedAt && 
          new Date(deactivatedAt) > new Date(userLoginTime);


        // If user is deactivated, log them out
        if (status === 'inactive') {
          localStorage.removeItem('user');
          window.dispatchEvent(new Event('userLogout'));
          
          // Show appropriate message based on when deactivation occurred
          const message = wasDeactivatedAfterLogin 
            ? 'Your account has been deactivated by an administrator. You have been logged out from all devices.'
            : 'Your account has been deactivated. Please contact an administrator for assistance.';
            
          navigate('/login', { 
            state: { 
              message: message
            } 
          });
        }
      } catch (error) {
        // If there's an error checking status, don't log out the user
        // This prevents network issues from logging out users
      }
    };

    // Check status immediately
    checkUserStatus();

    // Set up periodic checks every 5 seconds for more responsive deactivation
    const interval = setInterval(checkUserStatus, 5000);

    // Listen for deactivation events
    const handleUserDeactivated = (event) => {
      const deactivatedUserId = event.detail?.userId;
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      
      
      if (deactivatedUserId === currentUser.id) {
        localStorage.removeItem('user');
        window.dispatchEvent(new Event('userLogout'));
        navigate('/login', { 
          state: { 
            message: 'Your account has been deactivated. Please contact an administrator for assistance.' 
          } 
        });
      }
    };

    window.addEventListener('userDeactivated', handleUserDeactivated);

    // Check status when page becomes visible (user switches back to tab)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        checkUserStatus();
      }
    };

    // Check status when user navigates (for SPA navigation)
    const handleNavigation = () => {
      checkUserStatus();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleNavigation);
    window.addEventListener('popstate', handleNavigation);

    // Cleanup
    return () => {
      clearInterval(interval);
      window.removeEventListener('userDeactivated', handleUserDeactivated);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleNavigation);
      window.removeEventListener('popstate', handleNavigation);
    };
  }, [navigate]);

  return null; // This component doesn't render anything
};

export default UserStatusChecker;
