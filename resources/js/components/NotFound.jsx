import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const NotFound = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const currentPath = location.pathname;

    // Get user from localStorage to determine appropriate redirect
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    
    const getSuggestedRoute = () => {
        // Common typos and suggestions
        const suggestions = {
            // Staff routes
            '/staff/profiles': '/staff/profile',
            '/staff/dashboards': '/staff/dashboard',
            '/staff/certificate': '/staff/certificates',
            '/staff/record': '/staff/parish-records',
            '/staff/records': '/staff/parish-records',
            '/staff/mortuarys': '/staff/mortuary',
            '/staff/sacrament': '/staff/sacraments',
            '/staff/priest': '/staff/priest-calendar',
            '/staff/gives': '/staff/give',
            '/staff/calendar': '/staff/priest-calendar',
            '/staff/priest-calendars': '/staff/priest-calendar',
            
            // Admin routes
            '/admin/profiles': '/admin/profile',
            '/admin/dashboards': '/admin/dashboard',
            '/admin/userss': '/admin/users',
            '/admin/gallerys': '/admin/gallery',
            '/admin/eventss': '/admin/events',
            '/admin/announcement': '/admin/announcements',
            '/admin/request': '/admin/requests',
            
            // General typos
            '/profiles': user?.is_staff ? '/staff/profile' : user?.is_admin ? '/admin/profile' : '/profile',
            '/dashboards': user?.is_staff ? '/staff/dashboard' : user?.is_admin ? '/admin/dashboard' : user?.is_priest ? '/priest/dashboard' : '/dashboard',
        };

        return suggestions[currentPath] || null;
    };

    const getDefaultRedirect = () => {
        if (!user) return '/';
        
        if (user.is_admin) return '/admin/dashboard';
        if (user.is_staff) return '/staff/dashboard';
        if (user.is_priest) return '/priest/dashboard';
        return '/dashboard';
    };

    const suggestedRoute = getSuggestedRoute();
    const defaultRedirect = getDefaultRedirect();

    const handleGoHome = () => {
        navigate(defaultRedirect);
    };

    const handleGoBack = () => {
        navigate(-1);
    };

    const handleSuggestedRoute = () => {
        if (suggestedRoute) {
            navigate(suggestedRoute);
        }
    };

    return (
        <div className="not-found-page min-h-screen bg-gray-100 flex items-center justify-center px-4">
            <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
                {/* 404 Icon */}
                <div className="mb-6">
                    <svg 
                        className="mx-auto h-24 w-24 text-gray-400" 
                        fill="none" 
                        viewBox="0 0 24 24" 
                        stroke="currentColor"
                    >
                        <path 
                            strokeLinecap="round" 
                            strokeLinejoin="round" 
                            strokeWidth={1} 
                            d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.29-1.009-5.824-2.591M15 12a3 3 0 11-6 0 3 3 0 016 0z" 
                        />
                    </svg>
                </div>

                {/* Error Message */}
                <h1 className="text-4xl font-bold text-gray-900 mb-4">404</h1>
                <h2 className="text-xl font-semibold text-gray-700 mb-2">Page Not Found</h2>
                <p className="text-gray-600 mb-6">
                    The page <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono">{currentPath}</code> doesn't exist.
                </p>

                {/* Suggestion */}
                {suggestedRoute && (
                    <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-blue-800 text-sm mb-2">
                            Did you mean to go to:
                        </p>
                        <button
                            onClick={handleSuggestedRoute}
                            className="text-blue-600 hover:text-blue-800 font-medium underline"
                        >
                            {suggestedRoute}
                        </button>
                    </div>
                )}

                {/* Action Buttons */}
                <div className="space-y-3">
                    <button
                        onClick={handleGoHome}
                        className="w-full bg-[#CD8B3E] hover:bg-[#B87A35] text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200"
                    >
                        Go to Dashboard
                    </button>
                    
                    <button
                        onClick={handleGoBack}
                        className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium py-3 px-4 rounded-lg transition-colors duration-200"
                    >
                        Go Back
                    </button>
                </div>

                {/* Help Text */}
                <div className="mt-6 text-sm text-gray-500">
                    <p>
                        If you believe this is an error, please contact the administrator.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default NotFound;
