// resources/js/utils/csrf.js

/**
 * Get a fresh CSRF token from the server
 * @returns {Promise<string>} The CSRF token
 */
export const getCsrfToken = async () => {
    try {
        const response = await fetch('/csrf-token', {
            method: 'GET',
            credentials: 'include',
            headers: {
                'X-Requested-With': 'XMLHttpRequest',
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache',
            },
        });

        if (!response.ok) {
            throw new Error(`Failed to get CSRF token: ${response.status}`);
        }

        const data = await response.json();
        return data.csrf_token;
    } catch (error) {
        console.error('Error getting CSRF token:', error);
        throw error;
    }
};

/**
 * Refresh CSRF token (legacy function for compatibility)
 */
export const refreshCsrfToken = async () => {
    return await getCsrfToken();
};

/**
 * Make an authenticated request with CSRF token
 * @param {string} url - The URL to make the request to
 * @param {Object} options - Fetch options
 * @returns {Promise<Response>} The fetch response
 */
export const authenticatedRequest = async (url, options = {}) => {
    try {
        const csrfToken = await getCsrfToken();
        
        const defaultOptions = {
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': csrfToken,
                'X-Requested-With': 'XMLHttpRequest',
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache',
            },
        };

        const finalOptions = {
            ...defaultOptions,
            ...options,
            headers: {
                ...defaultOptions.headers,
                ...options.headers,
            },
        };

        return await fetch(url, finalOptions);
    } catch (error) {
        console.error('Error making authenticated request:', error);
        throw error;
    }
};
  