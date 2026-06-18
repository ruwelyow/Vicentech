import React, { useState, useEffect } from 'react';
import { api } from '../../utils/axios';
import '../../../css/events.css';

const Events = () => {
    const [activeTab, setActiveTab] = useState('events');
    const [announcements, setAnnouncements] = useState([]);
    const [events, setEvents] = useState([]);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        const fetchAnnouncements = async () => {
            try {
                const res = await api.get('/announcements');
                setAnnouncements(res.data);
            } catch (err) {
                setAnnouncements([]);
            }
        };
        fetchAnnouncements();

        // Fetch events from your API
        const fetchEvents = async () => {
            try {
                const res = await api.get('/events');
                setEvents(res.data);
            } catch (err) {
                console.error('Error fetching events:', err);
                setEvents([]);
            }
        };
        fetchEvents();


    }, []);

    const handleEventReadMore = (event) => {
        setSelectedEvent(event);
        setSelectedAnnouncement(null);
        setIsModalOpen(true);
    };

    const handleAnnouncementReadMore = (announcement) => {
        setSelectedAnnouncement(announcement);
        setSelectedEvent(null);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setSelectedEvent(null);
        setSelectedAnnouncement(null);
    };

    return (
        <div className="events-page">
            {/* Hero Section */}
            <section className="events-hero text-center">
                <div className="bg-white border border-[#f2e4ce] shadow-lg p-8 pb-10 w-full mt-6">
                    <h1 className="text-5xl font-extrabold text-[#3F2E1E] mb-3 tracking-tight font-['Times_New_Roman']">Events & Announcements</h1>
                    <p className="text-lg text-[#5C4B38] max-w-2xl mx-auto leading-relaxed">
                        Stay updated with the latest events and announcements from our parish community.
                    </p>
                </div>
            </section>

            {/* Main Content */}
            <div className="bg-white border border-[#f2e4ce] rounded-2xl shadow-lg p-8 max-w-6xl mx-auto -mt-16">
                {/* Tab Navigation */}
                <div className="events-tabs">
                    <button
                        className={`events-tab ${activeTab === 'events' ? 'active' : ''}`}
                        onClick={() => setActiveTab('events')}
                    >
                        Upcoming Events
                    </button>
                    <button
                        className={`events-tab ${activeTab === 'announcements' ? 'active' : ''}`}
                        onClick={() => setActiveTab('announcements')}
                    >
                        Announcements
                    </button>

                </div>

                {/* Events Section */}
                {activeTab === 'events' && (
                    <div className="events-grid">
                        {events.length === 0 ? (
                            <div className="no-events">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                                    <line x1="16" y1="2" x2="16" y2="6"/>
                                    <line x1="8" y1="2" x2="8" y2="6"/>
                                    <line x1="3" y1="10" x2="21" y2="10"/>
                                </svg>
                                <h3>No Events Yet</h3>
                                <p>Check back soon for upcoming events</p>
                            </div>
                        ) : (
                            events.map(event => (
                                <div key={event.id} className="event-card">
                                    <div className="event-display">
                                        <div className="event-image-container">
                                            <img
                                                src={
                                                    event.image_data
                                                        ? `data:${event.image_mime};base64,${event.image_data}`
                                                        : 'https://placehold.co/300x200?text=Event'
                                                }
                                                alt={event.title}
                                                className="event-image"
                                            />
                                            <div className="event-date-badge">
                                                <span className="date-month">
                                                    {event.date ? new Date(event.date).toLocaleDateString('en-US', { month: 'short' }) : 'TBA'}
                                                </span>
                                                <span className="date-day">
                                                    {event.date ? new Date(event.date).getDate() : '--'}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="event-content">
                                            <h3 className="event-title">{event.title}</h3>
                                            
                                            <div className="event-meta">
                                                <div className="meta-item">
                                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                                                        <line x1="16" y1="2" x2="16" y2="6"/>
                                                        <line x1="8" y1="2" x2="8" y2="6"/>
                                                        <line x1="3" y1="10" x2="21" y2="10"/>
                                                    </svg>
                                                    <span>{event.date ? new Date(event.date).toLocaleDateString('en-US', {
                                                        weekday: 'long',
                                                        year: 'numeric',
                                                        month: 'long', 
                                                        day: 'numeric'
                                                    }) : 'Date TBA'}</span>
                                                </div>

                                                <div className="meta-item">
                                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                                        <circle cx="12" cy="12" r="10"/>
                                                        <polyline points="12,6 12,12 16,14"/>
                                                    </svg>
                                                    <span>{event.time || 'Time TBA'}</span>
                                                </div>

                                                <div className="meta-item">
                                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                                                        <circle cx="12" cy="10" r="3"/>
                                                    </svg>
                                                    <span>{event.location || 'Location TBA'}</span>
                                                </div>
                                            </div>

                                            <p className="event-description">
                                                {event.description && event.description.length > 120 
                                                    ? `${event.description.substring(0, 120)}...` 
                                                    : event.description || 'No description available.'}
                                            </p>

                                            <div className="event-actions">
                                                <button 
                                                    onClick={() => handleEventReadMore(event)}
                                                    className="read-more-btn"
                                                >
                                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                                                        <circle cx="12" cy="12" r="3"/>
                                                    </svg>
                                                    Read More
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}

                {/* Announcements Section */}
                {activeTab === 'announcements' && (
                    <div className="events-grid">
                        {announcements.length === 0 ? (
                            <div className="no-events">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                    <path d="M10.34 15.84c-.688-.06-1.386-.09-2.09-.09H7.5a4.5 4.5 0 110-9h.75c.704 0 1.402-.03 2.09-.09m0 9.18c.253.962.584 1.892.985 2.783.247.55.06 1.21-.463 1.511l-.657.38c-.551.318-1.26.117-1.527-.461a20.845 20.845 0 01-1.44-4.282m3.102.069a18.03 18.03 0 01-.59-4.59c0-1.586.205-3.124.59-4.59m0 9.18a23.848 23.848 0 018.835 2.535M10.34 6.66a23.847 23.847 0 008.835-2.535m0 0A23.74 23.74 0 0018.795 3m.38 1.125a23.91 23.91 0 011.014 5.395m-1.014 8.855c-.118.38-.245.754-.38 1.125m.38-1.125a23.91 23.91 0 001.014-5.395m0-3.46c.495.413.811 1.035.811 1.73 0 .695-.316 1.317-.811 1.73m0-3.46a24.347 24.347 0 010 3.46"/>
                                </svg>
                                <h3>No Announcements Yet</h3>
                                <p>Check back soon for parish announcements</p>
                            </div>
                        ) : announcements.map(announcement => (
                            <div key={announcement.id} className="event-card">
                                <div className="event-display">
                                    <div className="event-image-container">
                                        <img
                                            src={
                                                announcement.image_data
                                                    ? `data:${announcement.image_mime};base64,${announcement.image_data}`
                                                    : 'https://placehold.co/300x200?text=Announcement'
                                            }
                                            alt={announcement.title}
                                            className="event-image"
                                        />
                                        <div className="event-date-badge">
                                            <span className="date-month">
                                                {announcement.date ? new Date(announcement.date).toLocaleDateString('en-US', { month: 'short' }) : 
                                                 announcement.created_at ? new Date(announcement.created_at).toLocaleDateString('en-US', { month: 'short' }) : 'TBA'}
                                            </span>
                                            <span className="date-day">
                                                {announcement.date ? new Date(announcement.date).getDate() : 
                                                 announcement.created_at ? new Date(announcement.created_at).getDate() : '--'}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="event-content">
                                        <h3 className="event-title">{announcement.title}</h3>
                                        
                                        <div className="event-meta">
                                            <div className="meta-item">
                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                                                    <line x1="16" y1="2" x2="16" y2="6"/>
                                                    <line x1="8" y1="2" x2="8" y2="6"/>
                                                    <line x1="3" y1="10" x2="21" y2="10"/>
                                                </svg>
                                                <span>{announcement.date ? new Date(announcement.date).toLocaleDateString('en-US', {
                                                    weekday: 'long',
                                                    year: 'numeric',
                                                    month: 'long', 
                                                    day: 'numeric'
                                                }) : announcement.created_at ? new Date(announcement.created_at).toLocaleDateString('en-US', {
                                                    weekday: 'long',
                                                    year: 'numeric',
                                                    month: 'long', 
                                                    day: 'numeric'
                                                }) : 'Date TBA'}</span>
                                            </div>

                                            <div className="meta-item">
                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                                    <path d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z"/>
                                                    <path d="M6 6h.008v.008H6V6z"/>
                                                </svg>
                                                <span>{announcement.type || 'General'}</span>
                                            </div>
                                        </div>

                                        <p className="event-description">
                                            {announcement.description && announcement.description.length > 120 
                                                ? `${announcement.description.substring(0, 120)}...` 
                                                : announcement.description || 'No description available.'}
                                        </p>

                                        <div className="event-actions">
                                            <button 
                                                onClick={() => handleAnnouncementReadMore(announcement)}
                                                className="read-more-btn"
                                            >
                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                                                    <circle cx="12" cy="12" r="3"/>
                                                </svg>
                                                Read More
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Modal for detailed view */}
            {isModalOpen && (selectedEvent || selectedAnnouncement) && (
                <div className="modal-overlay" onClick={closeModal}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <button className="modal-close" onClick={closeModal}>
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                        
                        {selectedEvent && (
                            <div className="modal-body">
                                {/* Hero Image Section */}
                                <div className="modal-hero">
                                    <img
                                        src={
                                            selectedEvent.image_data
                                                ? `data:${selectedEvent.image_mime};base64,${selectedEvent.image_data}`
                                                : 'https://placehold.co/1200x400?text=Event'
                                        }
                                        alt={selectedEvent.title}
                                        className="hero-image"
                                    />
                                    <div className="hero-overlay">
                                        <div className="hero-content">
                                            {/* Badge and title removed */}
                                        </div>
                                    </div>
                                </div>

                                {/* Content Section */}
                                <div className="modal-main">
                                    {/* Title */}
                                    <div className="modal-title-section">
                                        <h1 className="modal-title">{selectedEvent.title}</h1>
                                    </div>

                                    {/* Quick Info Cards */}
                                    <div className="info-cards">
                                        <div className="info-card">
                                            <div className="info-icon">
                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                                                    <line x1="16" y1="2" x2="16" y2="6"/>
                                                    <line x1="8" y1="2" x2="8" y2="6"/>
                                                    <line x1="3" y1="10" x2="21" y2="10"/>
                                                </svg>
                                            </div>
                                            <div className="info-text">
                                                <div className="info-label">Date</div>
                                                <div className="info-value">
                                                    {selectedEvent.date ? new Date(selectedEvent.date).toLocaleDateString('en-US', { 
                                                        weekday: 'long', 
                                                        year: 'numeric', 
                                                        month: 'long', 
                                                        day: 'numeric' 
                                                    }) : 'To Be Announced'}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="info-card">
                                            <div className="info-icon">
                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                                    <circle cx="12" cy="12" r="10"/>
                                                    <polyline points="12,6 12,12 16,14"/>
                                                </svg>
                                            </div>
                                            <div className="info-text">
                                                <div className="info-label">Time</div>
                                                <div className="info-value">{selectedEvent.time || 'To Be Announced'}</div>
                                            </div>
                                        </div>

                                        <div className="info-card">
                                            <div className="info-icon">
                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                                                    <circle cx="12" cy="10" r="3"/>
                                                </svg>
                                            </div>
                                            <div className="info-text">
                                                <div className="info-label">Location</div>
                                                <div className="info-value">{selectedEvent.location || 'To Be Announced'}</div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Description */}
                                    <div className="description-section">
                                        <h2 className="section-title">About This Event</h2>
                                        <div className="description-text">
                                            <p>{selectedEvent.description}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                        
                        {selectedAnnouncement && (
                            <div className="modal-body">
                                {/* Hero Image Section */}
                                <div className="modal-hero">
                                    <img
                                        src={
                                            selectedAnnouncement.image_data
                                                ? `data:${selectedAnnouncement.image_mime};base64,${selectedAnnouncement.image_data}`
                                                : 'https://placehold.co/1200x400?text=Announcement'
                                        }
                                        alt={selectedAnnouncement.title}
                                        className="hero-image"
                                    />
                                    <div className="hero-overlay">
                                        <div className="hero-content">
                                            {/* Badge and title removed */}
                                        </div>
                                    </div>
                                </div>

                                {/* Content Section */}
                                <div className="modal-main">
                                    {/* Title */}
                                    <div className="modal-title-section">
                                        <h1 className="modal-title">{selectedAnnouncement.title}</h1>
                                    </div>

                                    {/* Quick Info Cards */}
                                    <div className="info-cards">
                                        <div className="info-card">
                                            <div className="info-icon">
                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                                                    <line x1="16" y1="2" x2="16" y2="6"/>
                                                    <line x1="8" y1="2" x2="8" y2="6"/>
                                                    <line x1="3" y1="10" x2="21" y2="10"/>
                                                </svg>
                                            </div>
                                            <div className="info-text">
                                                <div className="info-label">Published</div>
                                                <div className="info-value">
                                                    {selectedAnnouncement.date ? new Date(selectedAnnouncement.date).toLocaleDateString('en-US', { 
                                                        weekday: 'long', 
                                                        year: 'numeric', 
                                                        month: 'long', 
                                                        day: 'numeric' 
                                                    }) : selectedAnnouncement.created_at ? new Date(selectedAnnouncement.created_at).toLocaleDateString('en-US', { 
                                                        weekday: 'long', 
                                                        year: 'numeric', 
                                                        month: 'long', 
                                                        day: 'numeric' 
                                                    }) : 'To Be Announced'}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="info-card">
                                            <div className="info-icon">
                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                                    <path d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 0 1 0 2.828l-7 7a2 2 0 0 1-2.828 0l-7-7A1.994 1.994 0 0 1 3 12V7a4 4 0 0 1 4-4z"/>
                                                </svg>
                                            </div>
                                            <div className="info-text">
                                                <div className="info-label">Type</div>
                                                <div className="info-value">{selectedAnnouncement.type || 'General Announcement'}</div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Description */}
                                    <div className="description-section">
                                        <h2 className="section-title">Announcement Details</h2>
                                        <div className="description-text">
                                            <p>{selectedAnnouncement.description}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Events;