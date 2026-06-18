import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../utils/axios';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate, Link } from 'react-router-dom';
import '../../css/Notifications.css';

const Notifications = ({ popup = false, onClose }) => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    const fetchNotifications = useCallback(async () => {
        try {
            setLoading(true);
            const response = await api.get('/notifications');
            // Defensive: ensure notifications is always an array
            let notificationsData = [];
            if (Array.isArray(response.data)) {
                notificationsData = response.data;
            } else if (response.data && Array.isArray(response.data.data)) {
                notificationsData = response.data.data;
            } else {
                notificationsData = [];
            }
            
            // Parse data field if it's a string (Laravel stores it as JSON)
            notificationsData = notificationsData.map(notification => {
                if (notification.data && typeof notification.data === 'string') {
                    try {
                        notification.data = JSON.parse(notification.data);
                    } catch (e) {
                        console.warn('Failed to parse notification data:', e);
                    }
                }
                return notification;
            });
            
            setNotifications(notificationsData);
            if (popup) {
                await api.post('/notifications/mark-as-read');
                window.dispatchEvent(new CustomEvent('notificationsUpdated'));
            }
        } catch (error) {
            console.error('Failed to fetch notifications:', error);
        } finally {
            setLoading(false);
        }
    }, [popup]);

    useEffect(() => {
        fetchNotifications();
    }, [fetchNotifications]);

    // Helper to get a summary for each notification
    const getNotificationSummary = (notification) => {
        if (notification.data.message) {
            return `"${notification.data.message.substring(0, 50)}..."`;
        } else if (notification.data.request_text) {
            return `"${notification.data.request_text.substring(0, 50)}..."`;
        } else if (notification.data.title) {
            return `"${notification.data.title.substring(0, 50)}..."`;
        } else if (notification.data.description) {
            return `"${notification.data.description.substring(0, 50)}..."`;
        } else {
            return '';
        }
    };

    // Handle notification click
    const handleNotificationClick = async (notification) => {
        if (popup && onClose) {
            onClose();
        }
        
        console.log('Notification clicked:', notification); // Debug log
        // Mark as read optimistically (non-blocking)
        try {
            if (!notification.read_at && notification.id) {
                api.post(`/notifications/${notification.id}/read`).catch(() => {});
            }
        } catch (_) {}
        
        // Check for specific notification types and data
        // IMPORTANT: Check sacrament notifications FIRST before other checks that might match
        if (notification.data.type === 'sacrament' || notification.data.appointment_id) {
            // Sacrament notification - show requirements popup if approved and has requirements
            if (notification.data.status === 'approved' && notification.data.requirements && notification.data.requirements.length > 0) {
                // Dispatch global event to open requirements modal (like family invitation modal)
                window.dispatchEvent(new CustomEvent('openSacramentRequirementsModal', { detail: notification.data }));
                // Close popup if it's open
                if (popup && onClose) {
                    onClose();
                }
                return; // Don't navigate if showing modal
            } else {
                // If no requirements or not approved, navigate to appointments page
                if (popup && onClose) {
                    onClose();
                }
                navigate('/appoint');
                return;
            }
        } else if (notification.data.event_id) {
            // Deep link to specific event join page if we have the id
            navigate(`/events/${notification.data.event_id}/join`);
        } else if (notification.data.type === 'events') {
            // Go to events page
            navigate('/events');
        } else if (notification.data.type === 'announcement') {
            // Go to notifications page to see all notifications
            navigate('/notifications');
        } else if (notification.data.type === 'family_invitation') {
            // Dispatch event to open modal directly
            window.dispatchEvent(new CustomEvent('openFamilyInviteModal', { detail: notification.data }));
            // Don't navigate to profile page - let the modal handle everything
        } else if (notification.data.request_text) {
            // Go to prayer request page
            navigate('/prayerRequest');
        } else if (notification.data.status === 'approved' || notification.data.status === 'rejected') {
            // Ministry application status - go to apply page (only if not a sacrament notification)
            if (notification.data.type !== 'sacrament' && !notification.data.appointment_id) {
                navigate('/apply');
            }
        } else if (notification.data.type === 'donation') {
            // Donation notification - route to donations (fallback to home if unavailable)
            try {
                navigate('/donations');
            } catch (_) {
                navigate('/');
            }
        } else if (notification.data.mass_schedule_id) {
            // Deep link to a specific mass attendance page when id is present
            navigate(`/mass-attendance/${notification.data.mass_schedule_id}`);
        } else if (notification.data.type === 'mass_schedule') {
            // Mass schedule notification - go to mass schedule page
            navigate('/mass-schedule');
        } else {
            // Default: go to home
            console.log('No specific route found, going to home');
            navigate('/');
        }
    };

    // Defensive: ensure notificationsToShow is always an array
    const notificationsToShow = Array.isArray(popup ? notifications.slice(0, 5) : notifications)
        ? (popup ? notifications.slice(0, 5) : notifications)
        : [];

    const ApprovedIcon = (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" fill="#e7fbe9" stroke="#22c55e"/>
        <path d="M8 12l2 2l4-4" stroke="#22c55e" strokeWidth="2.5" fill="none"/>
      </svg>
    );
    const RejectedIcon = (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#e35d6a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" fill="#fde8ea" stroke="#e35d6a"/>
        <path d="M9 9l6 6M15 9l-6 6" stroke="#e35d6a" strokeWidth="2.5"/>
      </svg>
    );
    const AnnouncementIcon = (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#CD8B3E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="8" width="13" height="8" rx="2" fill="#FFF6E5" stroke="#CD8B3E"/>
        <path d="M16 10v4M19 9v6" stroke="#CD8B3E"/>
        <circle cx="7" cy="12" r="1.2" fill="#CD8B3E"/>
      </svg>
    );
    const BellIcon = (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#CD8B3E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 16v-5a6 6 0 10-12 0v5l-2 2v1h16v-1l-2-2z" fill="#FFF6E5" stroke="#CD8B3E"/>
        <circle cx="12" cy="19" r="2" fill="#CD8B3E"/>
      </svg>
    );

    const FamilyIcon = (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#4a90e2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 12c2.67 0 8 1.34 8 4v2H4v-2c0-2.66 5.33-4 8-4zm0-2a4 4 0 110-8 4 4 0 010 8z" fill="#e8f0fe" stroke="#4a90e2"/>
        <path d="M18 20v-2c0-1.1-.9-2-2-2h-8c-1.1 0-2 .9-2 2v2" stroke="#4a90e2"/>
      </svg>
    );

    const mainContent = (
        <>
            {loading ? (
                <p>Loading...</p>
            ) : notifications.length === 0 ? (
                <p className="no-notifications">You have no new notifications.</p>
            ) : (
                <ul className="notifications-list">
                    {notificationsToShow.map(notification => (
                        <li
                            key={notification.id}
                            className={`notification-item ${!notification.read_at ? 'unread' : ''}`}
                            style={{ cursor: 'pointer' }}
                            onClick={() => handleNotificationClick(notification)}
                        >
                            <div className="notification-icon">
                                {notification.data.status === 'approved' ? ApprovedIcon :
                                 notification.data.status === 'rejected' ? RejectedIcon :
                                 notification.data.type === 'announcement' ? AnnouncementIcon : 
                                 notification.data.type === 'family_invitation' ? FamilyIcon : BellIcon}
                            </div>
                            <div className="notification-content">
                                <p>{notification.data.message || notification.data.title || 'You have a new notification.'}</p>
                                <small>
                                    {getNotificationSummary(notification)}
                                </small>
                            </div>
                            <div className="notification-time">
                                {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                            </div>
                        </li>
                    ))}
                </ul>
            )}
            {popup && notifications.length > 0 && (
                <div className="see-all-container">
                    <Link to="/notifications" onClick={onClose} className="see-all-link">See all notifications</Link>
                </div>
            )}
        </>
    );

    if (popup) {
        return (
            <>
                <div className="notifications-popup">
                    <div className="notifications-header">
                        <h3>Notifications</h3>
                    </div>
                    {mainContent}
                </div>
            </>
        );
    }

    return (
        <>
            <div className="events-page min-h-screen pb-20">
                {/* Hero Section */}
                <section className="events-hero text-center">
                    <div className="bg-white border border-[#f2e4ce] shadow-lg p-8 pb-10 w-full mt-6">
                        <h1 className="text-5xl font-extrabold text-[#3F2E1E] mb-3 tracking-tight font-['Times_New_Roman']">Notifications</h1>
                        <p className="text-lg text-[#5C4B38] max-w-2xl mx-auto leading-relaxed">
                            Stay up to date with the latest updates, announcements, and activity related to your account.
                        </p>
                    </div>
                </section>
                <div className="bg-white border border-[#f2e4ce] rounded-2xl shadow-lg p-8 max-w-6xl mx-auto -mt-16">
                    {mainContent}
                </div>
            </div>
        </>
    );
};

export default Notifications; 