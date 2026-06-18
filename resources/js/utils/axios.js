import axios from 'axios';

// Get CSRF token from meta tag (preferred for session-based routes) or cookie (fallback)
export const getCsrfToken = () => {
    // For session-based routes in web.php, prefer meta tag token from session
    const metaToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
    if (metaToken) {
        return metaToken;
    }
    // Fallback to cookie (for Sanctum/API routes)
    const cookies = document.cookie.split(';');
    for (let cookie of cookies) {
        const [name, value] = cookie.trim().split('=');
        if (name === 'XSRF-TOKEN') {
            return decodeURIComponent(value);
        }
    }
    return null;
};

// Create an instance for API routes
export const api = axios.create({
    baseURL: '/api', // <--- THIS IS IMPORTANT
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest'
    },
    withCredentials: true,
    xsrfCookieName: 'XSRF-TOKEN',
    xsrfHeaderName: 'X-XSRF-TOKEN'
});

// Add CSRF token to requests and debug logging
api.interceptors.request.use(async config => {
    // Remove Content-Type header for FormData - browser will set it with boundary
    if (config.data instanceof FormData) {
        delete config.headers['Content-Type'];
    }
    
    // For POST requests, ensure we have a CSRF token
    if (config.method === 'post' || config.method === 'put' || config.method === 'patch' || config.method === 'delete') {
        let token = getCsrfToken();
        
        // If no token found, try to get CSRF token from endpoint (for web routes) or Sanctum cookie (for API routes)
        if (!token && config.url !== '/sanctum/csrf-cookie' && config.url !== '/csrf-token') {
            try {
                // Try web CSRF token endpoint first (for session-based routes)
                const baseAxios = axios.create({ withCredentials: true });
                const tokenResponse = await baseAxios.get('/csrf-token');
                if (tokenResponse?.data?.csrf_token) {
                    token = tokenResponse.data.csrf_token;
                    // Update meta tag if it exists
                    let metaTag = document.querySelector('meta[name="csrf-token"]');
                    if (!metaTag) {
                        metaTag = document.createElement('meta');
                        metaTag.setAttribute('name', 'csrf-token');
                        document.head.appendChild(metaTag);
                    }
                    metaTag.setAttribute('content', token);
                } else {
                    // Fallback to Sanctum cookie for API routes
                    await baseAxios.get('/sanctum/csrf-cookie');
                    token = getCsrfToken();
                }
            } catch (e) {
                console.warn('Failed to get CSRF token:', e);
            }
        }
        
        if (token) {
            // Set both headers - Laravel accepts either
            config.headers['X-CSRF-TOKEN'] = token;
            config.headers['X-XSRF-TOKEN'] = token;
        }
    }
    
    // Debug logging
    // console.log('API Request:', {
    //     method: config.method?.toUpperCase(),
    //     url: config.url,
    //     baseURL: config.baseURL,
    //     fullURL: `${config.baseURL}${config.url}`,
    //     hasCSRF: !!config.headers['X-CSRF-TOKEN']
    // });
    
    return config;
}, error => {
    return Promise.reject(error);
});

// Create an instance for auth routes
export const auth = axios.create({
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest'
    },
    withCredentials: true,
    xsrfCookieName: 'XSRF-TOKEN',
    xsrfHeaderName: 'X-XSRF-TOKEN'
});

// Mirror CSRF handling for auth (web) routes
auth.interceptors.request.use(async config => {
    if (config.method === 'post' || config.method === 'put' || config.method === 'patch' || config.method === 'delete') {
        let token = getCsrfToken();
        if (!token && config.url !== '/sanctum/csrf-cookie') {
            try {
                const baseAxios = axios.create({ withCredentials: true });
                await baseAxios.get('/sanctum/csrf-cookie');
                token = getCsrfToken();
            } catch (e) {
                console.warn('Failed to get CSRF cookie (auth):', e);
            }
        }
        if (token) {
            // Both headers are accepted by Laravel; X-XSRF-TOKEN is Sanctum's default
            config.headers['X-CSRF-TOKEN'] = token;
            config.headers['X-XSRF-TOKEN'] = token;
        }
    }
    return config;
}, error => Promise.reject(error));

// Add error handling interceptors
const handleError = error => {
    const status = error.response?.status;
    const reqUrl = `${error.config?.baseURL || ''}${error.config?.url || ''}`;
    // Suppress expected guest 401 for auth check
    if (status === 401 && (error.config?.url === '/me' || reqUrl.endsWith('/api/me'))) {
        return Promise.reject(error);
    }
    if (status === 500) {
        console.error('Server error:', error.response?.data);
    }
    return Promise.reject(error);
};

api.interceptors.response.use(response => response, handleError);
auth.interceptors.response.use(response => response, handleError);

// Auto-refresh CSRF cookie on 419 CSRF mismatch and retry once
const attachCsrfAutoRefresh = (instance) => {
  instance.interceptors.response.use(
    (res) => res,
    async (error) => {
      const status = error.response?.status;
      const message = error.response?.data?.message || '';
      const originalConfig = error.config || {};
      if (!originalConfig._csrfRetry && (status === 419 || /csrf/i.test(message))) {
        try {
          originalConfig._csrfRetry = true;
          const baseAxios = axios.create({ withCredentials: true });
          
          // Try web CSRF token endpoint first (for session-based routes)
          try {
            const tokenResponse = await baseAxios.get('/csrf-token');
            if (tokenResponse?.data?.csrf_token) {
              // Update meta tag if it exists
              let metaTag = document.querySelector('meta[name="csrf-token"]');
              if (!metaTag) {
                metaTag = document.createElement('meta');
                metaTag.setAttribute('name', 'csrf-token');
                document.head.appendChild(metaTag);
              }
              metaTag.setAttribute('content', tokenResponse.data.csrf_token);
            }
          } catch (e) {
            // Fallback to Sanctum cookie for API routes
            await baseAxios.get('/sanctum/csrf-cookie');
          }
          
          // Wait a bit for token to be available
          await new Promise(resolve => setTimeout(resolve, 200));
          
          // Get fresh token (from meta tag or cookie)
          const token = getCsrfToken();
          if (token) {
            originalConfig.headers = originalConfig.headers || {};
            originalConfig.headers['X-CSRF-TOKEN'] = token;
            originalConfig.headers['X-XSRF-TOKEN'] = token;
          }
          
          // Retry the original request with the same instance
          return instance.request(originalConfig);
        } catch (e) {
          // Fall through to default handler if retry fails
        }
      }
      return Promise.reject(error);
    }
  );
};

attachCsrfAutoRefresh(api);
attachCsrfAutoRefresh(auth);

export default api; 