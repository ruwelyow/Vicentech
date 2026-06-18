import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../utils/axios';
import '../../../css/events.css';

const News = () => {
  const [newsItems, setNewsItems] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/news')
      .then(res => setNewsItems(Array.isArray(res.data) ? res.data : []))
      .catch(() => setNewsItems([]));
  }, []);

  return (
    <div className="events-page">
      {/* Hero Section */}
      <section className="events-hero text-center">
        <div className="bg-white border border-[#f2e4ce] shadow-lg p-8 pb-10 w-full mt-6">
          <h1 className="text-5xl font-extrabold text-[#3F2E1E] mb-3 tracking-tight font-['Times_New_Roman']">All News</h1>
          <p className="text-lg text-[#5C4B38] max-w-2xl mx-auto leading-relaxed">
            Stay updated with the latest news and announcements from our parish community.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <div className="bg-white border border-[#f2e4ce] rounded-2xl shadow-lg p-8 max-w-6xl mx-auto -mt-16">
        {/* News Section */}
        <div className="events-grid">
          {newsItems.length === 0 ? (
            <div className="no-events">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9.5a2.5 2.5 0 00-2.5-2.5H15"/>
                <path d="M9 7h6m-6 4h6m-2 5h2"/>
              </svg>
              <h3>No News Yet</h3>
              <p>Check back soon for latest news</p>
            </div>
          ) : (
            newsItems.map((item, idx) => (
              <div key={item.id || idx} className="event-card">
                <div className="event-display">
                  <div className="event-image-container">
                    <img
                      src={
                        item.image
                          ? (item.image.startsWith('data:') ? item.image : item.image)
                          : 'https://placehold.co/300x200?text=News'
                      }
                      alt={item.title}
                      className="event-image"
                    />
                    <div className="event-date-badge">
                      <span className="date-month">
                        {item.date ? new Date(item.date).toLocaleDateString('en-US', { month: 'short' }) : 'TBA'}
                      </span>
                      <span className="date-day">
                        {item.date ? new Date(item.date).getDate() : '--'}
                      </span>
                    </div>
                  </div>

                  <div className="event-content">
                    <h3 className="event-title">{item.title}</h3>
                    
                    <div className="event-meta">
                      <div className="meta-item">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                          <line x1="16" y1="2" x2="16" y2="6"/>
                          <line x1="8" y1="2" x2="8" y2="6"/>
                          <line x1="3" y1="10" x2="21" y2="10"/>
                        </svg>
                        <span>{item.date ? new Date(item.date).toLocaleDateString('en-US', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long', 
                          day: 'numeric'
                        }) : 'Date TBA'}</span>
                      </div>

                    </div>

                    <p className="event-description">
                      {(item.content || item.quote || item.description) && (item.content || item.quote || item.description).length > 120 
                        ? `${(item.content || item.quote || item.description).substring(0, 120)}...` 
                        : (item.content || item.quote || item.description) || ''}
                    </p>

                    <div className="event-actions">
                      <button 
                        onClick={() => navigate(`/news/${item.id}`)}
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
      </div>
    </div>
  );
};


export default News; 