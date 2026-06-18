import React, { useEffect, useState } from 'react';
import { api } from '../../utils/axios';
import '../../../css/staffDashboard.css';

const accentColor = '#CD8B3E';
const accentColorLight = '#FFF6E5';
const accentColorLighter = '#FFEBC9';
const sidebarBg = '#DED0B6';
const sidebarText = '#3F2E1E';
const sidebarActive = '#FFEBC9';
const mainBg = '#fff';
const cardBg = '#fff';
const cardShadow = '0 4px 6px rgba(0,0,0,0.10)';
const borderRadius = 18;
const borderColor = '#f2e4ce';
const primaryText = '#3F2E1E';
const secondaryText = '#5C4B38';

const AdminDashboard = () => {
  const [userCount, setUserCount] = useState(0);
  const [recentActivities, setRecentActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch user count and recent activities in parallel
      const [usersRes, activitiesRes] = await Promise.all([
        api.get('/all-users').catch(err => ({ data: [] })),
        api.get('/admin/recent-activities').catch(err => ({ data: { success: false, data: [] } }))
      ]);

      // Set user count (excluding admin, staff, priest)
      const allUsers = usersRes.data || [];
      const parishioners = allUsers.filter(user => !user.is_admin && !user.is_staff && !user.is_priest);
      setUserCount(parishioners.length);

      // Set recent activities
      if (activitiesRes.data?.success) {
        setRecentActivities(activitiesRes.data.data || []);
      } else {
        setRecentActivities([]);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError('Failed to load dashboard data');
      setUserCount(0);
      setRecentActivities([]);
    } finally {
      setLoading(false);
    }
  };

  const summary = {
    users: userCount,
    donations: 0, // Will be updated when we implement donation analytics
    requests: recentActivities.filter(activity => 
      activity.type === 'Prayer Request' || 
      activity.type === 'Certificate Request' || 
      activity.type === 'Ministry Application'
    ).length,
  };

  // Icon mapping for different activity types - using SVG icons like sidebar
  const getActivityIcon = (type) => {
    const iconMap = {
      'Event Registration': (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="#CD8B3E" className="w-6 h-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      'Donation': (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="#CD8B3E" className="w-6 h-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      'Prayer Request': (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="#CD8B3E" className="w-6 h-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.536L16.732 3.732z" />
        </svg>
      ),
      'Announcement': (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="#CD8B3E" className="w-6 h-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.148-6.354A1.76 1.76 0 015.583 11H9.42a1.76 1.76 0 011.595.928l.606 1.819z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.148-6.354A1.76 1.76 0 019.583 11H13.42a1.76 1.76 0 011.595.928l.606 1.819z" />
        </svg>
      ),
      'Ministry Application': (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="#CD8B3E" className="w-6 h-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M15 21v-2a6 6 0 00-5.197-5.197" />
        </svg>
      ),
      'Mass Attendance': (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="#CD8B3E" className="w-6 h-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      'Certificate Request': (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="#CD8B3E" className="w-6 h-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
        </svg>
      ),
      'User Registration': (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="#CD8B3E" className="w-6 h-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M18 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM3 19.235v-.11a6.375 6.375 0 0112.75 0v.11A12.318 12.318 0 019.374 21c-2.331 0-4.512-.645-6.374-1.766z" />
        </svg>
      )
    };
    return iconMap[type] || (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="#CD8B3E" className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
      </svg>
    );
  };

  // Color mapping for different activity types
  const getActivityColor = (type) => {
    const colorMap = {
      'Event Registration': '#3B82F6',
      'Donation': '#10B981',
      'Prayer Request': '#8B5CF6',
      'Announcement': '#F59E0B',
      'Ministry Application': '#EF4444',
      'Mass Attendance': '#CD8B3E',
      'Certificate Request': '#06B6D4',
      'User Registration': '#84CC16'
    };
    return colorMap[type] || '#6B7280';
  };

  // Get status badge class (similar to staff dashboard)
  const getStatusBadgeClass = (status) => {
    if (!status) return 'status-badge';
    switch (status.toLowerCase()) {
      case 'pending': return 'status-badge pending';
      case 'processing': return 'status-badge processing';
      case 'approved': return 'status-badge approved';
      case 'completed': return 'status-badge completed';
      case 'rejected': return 'status-badge rejected';
      case 'active': return 'status-badge active';
      default: return 'status-badge';
    }
  };

  // Map activity type to display format with icon (for staff dashboard style)
  const getActivityTypeIcon = (type) => {
    // Map admin activity types to staff-style icons
    if (type === 'Certificate Request') {
      return (
        <svg width="16" height="16" fill="none" stroke="#059669" strokeWidth="2" viewBox="0 0 24 24">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14,2 14,8 20,8"/>
        </svg>
      );
    } else if (type === 'Ministry Application') {
      return (
        <svg width="16" height="16" fill="none" stroke="#D97706" strokeWidth="2" viewBox="0 0 24 24">
          <path d="M12 2v20"/>
          <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
        </svg>
      );
    } else if (type === 'Event Registration' || type === 'Mass Attendance') {
      return (
        <svg width="16" height="16" fill="none" stroke="#806c4b" strokeWidth="2" viewBox="0 0 24 24">
          <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
        </svg>
      );
    } else {
      // Default icon
      return (
        <svg width="16" height="16" fill="none" stroke="#806c4b" strokeWidth="2" viewBox="0 0 24 24">
          <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
        </svg>
      );
    }
  };

  if (loading) {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        background: 'rgba(255,255,255,0.6)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
      }}>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 16,
        }}>
          <svg style={{ width: 64, height: 64, color: '#CD8B3E', marginBottom: 12 }} viewBox="0 0 50 50">
            <circle cx="25" cy="25" r="20" fill="none" stroke="#CD8B3E" strokeWidth="6" strokeDasharray="31.4 31.4" strokeLinecap="round">
              <animateTransform attributeName="transform" type="rotate" from="0 25 25" to="360 25 25" dur="1s" repeatCount="indefinite" />
            </circle>
          </svg>
          <div style={{ color: '#3F2E1E', fontWeight: 600, fontSize: 20, letterSpacing: 1 }}>
            Loading dashboard...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="staff-dashboard" style={{
      width: '100%',
      maxWidth: '100%',
      minHeight: '100vh'
    }}>
        <main className="staff-main-content" style={{
          width: '100%',
          maxWidth: '1400px',
          margin: '0 auto',
          padding: '1.5rem',
          fontSize: 'clamp(0.7rem, 1vw, 0.9rem)',
          boxSizing: 'border-box'
        }}>
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <h1 style={{
              fontSize: '3.5rem',
              fontWeight: '700',
              color: '#3F2E1E',
              letterSpacing: '2px',
              textTransform: 'uppercase',
              marginBottom: '0.5rem',
              marginTop: '0'
            }}>ADMIN DASHBOARD</h1>
            <p style={{
              fontSize: '1.125rem',
              color: '#5C4B38',
              marginTop: '0.5rem',
              marginBottom: '0',
              lineHeight: '1.6'
            }}>Your central hub for managing all parish operations and services.</p>
          </div>
        
        <div className="summary-cards">
          <div className="summary-card users-card">
            <div className="card-icon">
              <svg width="24" height="24" fill="none" stroke="#806c4b" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M18 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM3 19.235v-.11a6.375 6.375 0 0112.75 0v.11A12.318 12.318 0 019.374 21c-2.331 0-4.512-.645-6.374-1.766z" />
              </svg>
            </div>
            <div className="card-content">
              <div className="card-value">{summary.users}</div>
              <div className="card-label">Users</div>
            </div>
          </div>
          <div className="summary-card requests-card">
            <div className="card-icon">
              <svg width="24" height="24" fill="none" stroke="#806c4b" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V19.5a2.25 2.25 0 002.25 2.25h.75M4.5 6.75h9.75a2.25 2.25 0 012.25 2.25v9.75m-9.75 0h9.75" />
              </svg>
            </div>
            <div className="card-content">
              <div className="card-value">{summary.requests}</div>
              <div className="card-label">Requests</div>
            </div>
          </div>
        </div>
        
        {error && (
          <div style={{
            padding: '0.5rem',
            background: '#FEE2E2',
            color: '#DC2626',
            borderRadius: '4px',
            marginBottom: '0.75rem',
            fontSize: 'clamp(0.6rem, 0.8vw, 0.7rem)'
          }}>
            {error}
          </div>
        )}

        <div className="recent-requests">
          <div className="section-header" style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '1.5rem',
            borderBottom: '1px solid #f2e4ce',
            background: '#FFF6E5'
          }}>
            <h2 style={{
              fontSize: '1.25rem',
              fontWeight: '600',
              color: '#3F2E1E',
              margin: 0
            }}>Recent Activities</h2>
            <button 
              onClick={fetchDashboardData}
              style={{
                padding: '0.5rem 1rem',
                fontSize: '0.875rem',
                background: accentColor,
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                boxShadow: '0 2px 4px rgba(205, 139, 62, 0.2)'
              }}
              onMouseOver={(e) => {
                e.target.style.background = '#B77B35';
                e.target.style.transform = 'translateY(-1px)';
                e.target.style.boxShadow = '0 4px 8px rgba(205, 139, 62, 0.3)';
              }}
              onMouseOut={(e) => {
                e.target.style.background = accentColor;
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 2px 4px rgba(205, 139, 62, 0.2)';
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" style={{ width: '16px', height: '16px' }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
              </svg>
              Refresh
            </button>
          </div>
          <div className="requests-table">
            <table>
              <thead>
                <tr>
                  <th>TYPE</th>
                  <th>DETAIL</th>
                  <th>DATE</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="3" style={{ textAlign: 'center', padding: '2rem', color: '#8B7355' }}>
                      Loading recent activities...
                    </td>
                  </tr>
                ) : recentActivities.length === 0 ? (
                  <tr>
                    <td colSpan="3" style={{ textAlign: 'center', padding: '2rem', color: '#8B7355' }}>
                      No recent activities found
                    </td>
                  </tr>
                ) : (
                  recentActivities.map((activity) => (
                    <tr key={activity.id || activity.type + '-' + activity.date}>
                      <td>
                        <div className="request-type">
                          <span className="type-icon">
                            {getActivityTypeIcon(activity.type)}
                          </span>
                          {activity.type}
                        </div>
                      </td>
                      <td className="request-detail">{activity.detail || 'N/A'}</td>
                      <td className="request-date">{activity.date || 'N/A'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;