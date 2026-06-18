import React from 'react';
import { useNavigate } from 'react-router-dom';

const AccessDenied = ({ userRole, attemptedRoute }) => {
    const navigate = useNavigate();

    const getRoleDisplayName = (role) => {
        switch (role) {
            case 'admin': return 'Administrator';
            case 'staff': return 'Staff Member';
            case 'priest': return 'Priest';
            case 'user': return 'Parishioner';
            default: return 'User';
        }
    };

    const getCorrectDashboard = (role) => {
        switch (role) {
            case 'admin': return '/admin/dashboard';
            case 'staff': return '/staff/dashboard';
            case 'priest': return '/priest/dashboard';
            case 'user': return '/dashboard';
            default: return '/';
        }
    };

    const getRouteDescription = (route) => {
        if (route.startsWith('/admin/')) return 'Administrator';
        if (route.startsWith('/staff/')) return 'Staff';
        if (route.startsWith('/priest/')) return 'Priest';
        if (route === '/' || ['/dashboard', '/appoint', '/apply', '/prayerRequest', '/certificate-request', '/give', '/profile', '/gallery', '/sacrament-history', '/donation-history'].includes(route)) {
            return 'Parishioner';
        }
        return 'Restricted';
    };

    return (
        <div className="access-denied-page">
            <style>{`
                .access-denied-page {
                    min-height: 100vh;
                    background: linear-gradient(135deg, #DED0B6 0%, #f5f0e8 100%);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 2rem;
                    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                }
                
                .access-denied-container {
                    background: white;
                    border-radius: 24px;
                    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1);
                    padding: 2rem;
                    max-width: 600px;
                    width: 100%;
                    text-align: center;
                    position: relative;
                    overflow: hidden;
                }
                
                .access-denied-container::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    height: 6px;
                    background: linear-gradient(90deg, #e74c3c 0%, #c0392b 100%);
                }
                
                .access-denied-icon {
                    width: 60px;
                    height: 60px;
                    margin: 0 auto 1.5rem;
                    background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%);
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    position: relative;
                    box-shadow: 0 10px 30px rgba(231, 76, 60, 0.3);
                }
                
                .access-denied-icon svg {
                    width: 40px;
                    height: 40px;
                    color: white;
                }
                
                .access-denied-title {
                    font-size: 1.75rem;
                    font-weight: 800;
                    color: #2d3748;
                    margin-bottom: 0.75rem;
                    letter-spacing: -0.025em;
                }
                
                .access-denied-subtitle {
                    font-size: 1rem;
                    color: #718096;
                    margin-bottom: 1.5rem;
                    line-height: 1.6;
                }
                
                .error-card {
                    background: linear-gradient(135deg, #fed7d7 0%, #feb2b2 100%);
                    border: 1px solid #fc8181;
                    border-radius: 12px;
                    padding: 0.75rem;
                    margin-bottom: 0.75rem;
                    position: relative;
                }
                
                .error-card-header {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin-bottom: 0.75rem;
                }
                
                .error-card-icon {
                    width: 28px;
                    height: 28px;
                    background: #e53e3e;
                    border-radius: 6px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin-right: 0.5rem;
                }
                
                .error-card-icon svg {
                    width: 16px;
                    height: 16px;
                    color: white;
                }
                
                .error-card-title {
                    font-size: 1rem;
                    font-weight: 700;
                    color: #742a2a;
                }
                
                .error-card-message {
                    color: #742a2a;
                    font-size: 0.875rem;
                    line-height: 1.4;
                }
                
                .info-card {
                    background: linear-gradient(135deg, #e6fffa 0%, #b2f5ea 100%);
                    border: 1px solid #4fd1c7;
                    border-radius: 12px;
                    padding: 0.75rem;
                    margin-bottom: 1rem;
                }
                
                .info-card-header {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin-bottom: 0.75rem;
                }
                
                .info-card-icon {
                    width: 28px;
                    height: 28px;
                    background: #38b2ac;
                    border-radius: 6px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin-right: 0.5rem;
                }
                
                .info-card-icon svg {
                    width: 16px;
                    height: 16px;
                    color: white;
                }
                
                .info-card-title {
                    font-size: 0;
                    font-weight: 700;
                    color: #234e52;
                }
                
                .info-card-message {
                    color: #234e52;
                    font-size: 0.875rem;
                    line-height: 1.4;
                }
                
                .action-buttons {
                    display: flex;
                    flex-direction: column;
                    gap: 1rem;
                }
                
                .btn-primary {
                    background: linear-gradient(135deg, #CD8B3E 0%, #B67A35 100%);
                    color: white;
                    border: none;
                    border-radius: 12px;
                    padding: 1rem 2rem;
                    font-weight: 600;
                    font-size: 1rem;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 0.5rem;
                    box-shadow: 0 4px 15px rgba(205, 139, 62, 0.3);
                }
                
                .btn-primary:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 8px 25px rgba(205, 139, 62, 0.4);
                }
                
                .btn-secondary {
                    background: white;
                    color: #4a5568;
                    border: 2px solid #e2e8f0;
                    border-radius: 12px;
                    padding: 1rem 2rem;
                    font-weight: 600;
                    font-size: 1rem;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 0.5rem;
                }
                
                .btn-secondary:hover {
                    background: #f7fafc;
                    border-color: #CD8B3E;
                    transform: translateY(-1px);
                }
                
                .help-text {
                    margin-top: 2rem;
                    padding-top: 1.5rem;
                    border-top: 1px solid #e2e8f0;
                    color: #718096;
                    font-size: 0.875rem;
                }
                
                @media (max-width: 640px) {
                    .access-denied-container {
                        padding: 2rem 1.5rem;
                        margin: 1rem;
                    }
                    
                    .access-denied-title {
                        font-size: 2rem;
                    }
                    
                    .action-buttons {
                        gap: 0.75rem;
                    }
                }
            `}</style>
            
            <div className="access-denied-container">
                {/* Access Denied Icon */}
                <div className="access-denied-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10"/>
                        <line x1="15" y1="9" x2="9" y2="15"/>
                        <line x1="9" y1="9" x2="15" y2="15"/>
                    </svg>
                </div>

                {/* Error Title */}
                <h1 className="access-denied-title">
                    Access Denied
                </h1>
                
                <p className="access-denied-subtitle">
                    You don't have permission to access this area
                </p>

                {/* Error Message */}
                <div className="error-card">
                    <div className="error-card-header">
                        <div className="error-card-icon">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"/>
                            </svg>
                        </div>
                        <h2 className="error-card-title">
                            Insufficient Permissions
                        </h2>
                    </div>
                    <p className="error-card-message">
                        You are logged in as a <strong>{getRoleDisplayName(userRole)}</strong> and do not have permission to access <strong>{getRouteDescription(attemptedRoute)}</strong> features.
                    </p>
                </div>

                {/* Role-specific Message */}
                <div className="info-card">
                    <div className="info-card-header">
                        <div className="info-card-icon">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="10"/>
                                <path d="M12 6v6l4 2"/>
                            </svg>
                        </div>
                        <h3 className="info-card-title">
                            Your Access Level
                        </h3>
                    </div>
                    <p className="info-card-message">
                        As a <strong>{getRoleDisplayName(userRole)}</strong>, you have access to specific features designed for your role.
                    </p>
                </div>

                {/* Action Buttons */}
                <div className="action-buttons">
                    <button
                        onClick={() => navigate(getCorrectDashboard(userRole))}
                        className="btn-primary"
                    >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{width: '20px', height: '20px'}}>
                            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                            <polyline points="9,22 9,12 15,12 15,22"/>
                        </svg>
                        Go to My Dashboard
                    </button>
                </div>

                {/* Help Text */}
                <div className="help-text">
                    <p>
                        If you believe this is an error, please contact the system administrator.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default AccessDenied;