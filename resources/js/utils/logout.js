/**
 * Standardized logout utility function
 * Handles CSRF token retrieval, logout request, and error handling
 */
export const performLogout = async (navigate, setLoggingOut = null) => {
  if (setLoggingOut) {
    setLoggingOut(true);
  }
  
  const minWait = new Promise(resolve => setTimeout(resolve, 2000));
  
  try {
    // First, get a fresh CSRF token
    const csrfResponse = await fetch('/csrf-token', {
      method: 'GET',
      credentials: 'include',
      headers: {
        'X-Requested-With': 'XMLHttpRequest',
      },
    });
    
    if (!csrfResponse.ok) {
      throw new Error('Failed to get CSRF token');
    }
    
    const csrfData = await csrfResponse.json();
    const csrfToken = csrfData.csrf_token;

    // Then perform logout
    const response = await fetch('/logout', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-TOKEN': csrfToken,
        'X-Requested-With': 'XMLHttpRequest',
      },
    });

    if (!response.ok) {
      throw new Error(`Logout failed with status ${response.status}`);
    }

    // Clear user data and dispatch logout event
    localStorage.removeItem('user');
    window.dispatchEvent(new Event('userLogout'));
    
    // Proactively clear CSRF/session cookies to avoid stale tokens on next login
    try {
      const past = 'Thu, 01 Jan 1970 00:00:00 GMT';
      document.cookie = 'XSRF-TOKEN=;expires=' + past + ';path=/;SameSite=Lax';
      document.cookie = 'laravel_session=;expires=' + past + ';path=/;SameSite=Lax';
    } catch (_) {}
    
    // Wait minimum time for better UX
    await minWait;
    
    // Navigate to appropriate page
    if (navigate) {
      navigate('/login');
    } else {
      window.location.href = '/login';
    }
    
    return true;
  } catch (error) {
    console.error('Logout error:', error);
    
    // Show user-friendly error message
    const errorMessage = error.message.includes('CSRF') 
      ? 'Session expired. Please refresh the page and try again.'
      : 'Logout failed. Please check your connection and try again.';
    
    alert(errorMessage);
    
    // If it's a CSRF error, try to refresh the page
    if (error.message.includes('CSRF') || error.message.includes('419')) {
      window.location.reload();
    } else {
      // For other errors, try force logout as fallback
      console.warn('Logout failed, attempting force logout');
      forceLogout(navigate);
    }
    
    return false;
  } finally {
    if (setLoggingOut) {
      setLoggingOut(false);
    }
  }
};

/**
 * Retry logout with exponential backoff
 */
export const performLogoutWithRetry = async (navigate, setLoggingOut = null, maxRetries = 3) => {
  let retries = 0;
  
  while (retries < maxRetries) {
    const success = await performLogout(navigate, setLoggingOut);
    
    if (success) {
      return true;
    }
    
    retries++;
    
    if (retries < maxRetries) {
      // Wait before retry with exponential backoff
      const delay = Math.pow(2, retries) * 1000; // 2s, 4s, 8s
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  return false;
};

/**
 * Force logout - clears local data and redirects without server call
 * Use this as a fallback when server logout fails
 */
export const forceLogout = (navigate) => {
  localStorage.removeItem('user');
  window.dispatchEvent(new Event('userLogout'));
  try {
    const past = 'Thu, 01 Jan 1970 00:00:00 GMT';
    document.cookie = 'XSRF-TOKEN=;expires=' + past + ';path=/;SameSite=Lax';
    document.cookie = 'laravel_session=;expires=' + past + ';path=/;SameSite=Lax';
  } catch (_) {}
  
  if (navigate) {
    navigate('/login');
  } else {
    window.location.href = '/login';
  }
};
