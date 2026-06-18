// resources/js/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './components/App';
import '../css/adminTheme.css';
import axios from 'axios';

// Set default axios configuration
axios.defaults.withCredentials = true;
axios.defaults.baseURL = 'http://localhost:8000';
axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';
axios.defaults.headers.common['Accept'] = 'application/json';

// Use the default Axios XSRF token handling
axios.defaults.xsrfCookieName = 'XSRF-TOKEN';
axios.defaults.xsrfHeaderName = 'X-XSRF-TOKEN';

// Add response interceptor to handle 401 responses
axios.interceptors.response.use(
    response => response,
    error => {
        if (error.response?.status === 401) {
            localStorage.removeItem('user');
        }
        return Promise.reject(error);
    }
);

// Try both possible root element IDs for flexibility
const root = document.getElementById('react-root') || document.getElementById('root');

if (root) {
    // Get CSRF cookie from Sanctum first
    axios.get('/sanctum/csrf-cookie')
        .then(() => {
            ReactDOM.createRoot(root).render(
                <React.StrictMode>
                    <App />
                </React.StrictMode>
            );
        })
        .catch((error) => {
            console.error('Failed to get CSRF cookie:', error);
            // Still render the app even if CSRF cookie fetch fails
            ReactDOM.createRoot(root).render(
                <React.StrictMode>
                    <App />
                </React.StrictMode>
            );
        });
} else {
    console.error('Root element not found. Looking for #react-root or #root');
}
