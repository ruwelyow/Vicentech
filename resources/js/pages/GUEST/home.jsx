import React, { useEffect, useState, useRef } from 'react';
import '../../../css/home.css';
import { useLocation, useNavigate } from 'react-router-dom';
import { api } from '../../utils/axios'; // or adjust the path as needed
import Chatbot from '../../components/Chatbot';
import GoogleMap from '../../components/GoogleMap';

const Home = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [currentNews, setCurrentNews] = useState(0);
  const [newsItems, setNewsItems] = useState([]);
  const newsRowRef = useRef(null);
  const [newsStartIndex, setNewsStartIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const newsSectionRef = useRef(null);
  const [newsVisible, setNewsVisible] = useState(false);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const organizationsRef = useRef(null);
  const [ministries, setMinistries] = useState([]);

  // Carousel state
  const [carouselItems, setCarouselItems] = useState([]);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [isCarouselLoading, setIsCarouselLoading] = useState(true);
  const carouselRef = useRef(null);

  // Fetch events and announcements and combine for carousel
  useEffect(() => {
    let mounted = true;
    setCarouselItems([]);
    setIsCarouselLoading(true);
    Promise.all([
      api.get('/events'),
      api.get('/announcements')
    ]).then(([eventsRes, announcementsRes]) => {
      if (!mounted) return;
      const events = Array.isArray(eventsRes.data) ? eventsRes.data.map(e => ({ ...e, type: 'event' })) : [];
      const announcements = Array.isArray(announcementsRes.data) ? announcementsRes.data.map(a => ({ ...a, type: 'announcement' })) : [];
      const combined = [...events, ...announcements];
      setCarouselItems(combined);
      setIsCarouselLoading(false);
    }).catch((err) => {
      if (mounted) {
        setCarouselItems([]);
        setIsCarouselLoading(false);
      }
    });
    return () => { mounted = false; };
  }, []);

  // Ensure carouselIndex is valid when items change
  useEffect(() => {
    if (carouselItems.length === 0) {
      setCarouselIndex(0);
    } else if (carouselIndex >= carouselItems.length) {
      setCarouselIndex(0);
    }
  }, [carouselItems, carouselIndex]);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const prevNews = () => setCurrentNews((prev) => (prev === 0 ? newsItems.length - 1 : prev - 1));
  const nextNews = () => setCurrentNews((prev) => (prev === newsItems.length - 1 ? 0 : prev + 1));
  
  // Scroll to section if hash is present in URL
  useEffect(() => {
    if (location.hash) {
      const section = document.querySelector(location.hash);
      if (section) {
        section.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, [location]);

  useEffect(() => {
    api.get('/news')
      .then(res => {
        setNewsItems(Array.isArray(res.data) ? res.data : []);
      })
      .catch(() => {
        setNewsItems([]);
      });
  }, []);

  useEffect(() => {
    api.get('/ministries')
      .then(res => {
        setMinistries(Array.isArray(res.data) ? res.data : []);
      })
      .catch(() => {
        setMinistries([]);
      });
  }, []);

  useEffect(() => {
    const observer = new window.IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setNewsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 }
    );
    if (newsSectionRef.current) {
      observer.observe(newsSectionRef.current);
    }
    return () => observer.disconnect();
  }, []);

  const addMessage = (text, sender) => {
    setMessages(prev => [...prev, { text, sender }]);
  };

  const handleSendMessage = async (e) => {
    if (e.key === 'Enter' && inputMessage.trim()) {
      const message = inputMessage.trim();
      addMessage(message, 'user');
      setInputMessage('');
      setIsLoading(true);

      try {
        const response = await api.post('/chat', {
          message: message
        });

        if (response.data.success) {
          addMessage(response.data.response, 'system');
        } else {
          addMessage(response.data.response, 'system');
        }
      } catch (error) {
        // Fallback to original logic if API fails
        const fallbackResponse = getFallbackResponse(message.toLowerCase());
        addMessage(fallbackResponse, 'system');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const getFallbackResponse = (message) => {
    if (message.includes('mass') || message.includes('schedule')) {
      return `Our mass schedule is:
Monday-Saturday: 6:00 AM and 6:00 PM
Sunday: 6:00 AM, 8:00 AM, 10:00 AM, 4:00 PM, and 6:00 PM`;
    } else if (message.includes('location') || message.includes('address')) {
      return 'We are located at Brgy. Mamatid, City of Cabuyao, Laguna. You can find us near the Mamatid Municipal Hall.';
    } else if (message.includes('contact') || message.includes('phone')) {
      return `You can reach us through:
Phone: 09123456789
Email: sanvicenteferrer@gmail.com`;
    } else if (message.includes('sacrament') || message.includes('appointment')) {
      return 'For sacrament appointments (Baptism, Confirmation, Wedding), please visit our Appoint Sacrament page or contact our office directly.';
    } else if (['hello', 'hi', 'hey'].some(word => message.includes(word))) {
      return 'Hello! How can I assist you today with information about San Vicente Ferrer Church?';
    } else {
      return 'Thank you for your message. For immediate assistance, please contact us at 09123456789 or visit our office during business hours (8:00 AM - 5:00 PM, Monday-Saturday).';
    }
  };

  useEffect(() => {
    const toggleChat = () => {
      const chatWindow = document.getElementById('chatWindow');
      if (chatWindow) chatWindow.classList.toggle('active');
      const chatButton = document.querySelector('.chat-button');
      if (chatButton) chatButton.classList.remove('pulse');
    };

    const handleKeyPress = async (event) => {
      if (event.key === 'Enter') {
        const input = document.getElementById('messageInput');
        const message = input.value.trim();

        if (message) {
          addMessage(message, 'user');
          input.value = '';
          setIsLoading(true);

          try {
            const response = await api.post('/chat', {
              message: message
            });

            if (response.data.success) {
              addMessage(response.data.response, 'system');
            } else {
              addMessage(response.data.response, 'system');
            }
          } catch (error) {
            // Fallback to original logic if API fails
            const fallbackResponse = getFallbackResponse(message.toLowerCase());
            addMessage(fallbackResponse, 'system');
          } finally {
            setIsLoading(false);
          }
        }
      }
    };

    const virtualTourSection = document.querySelector('.virtual-tour-section');

    const handleKeyDown = (event) => {
      const isInViewport = (elem) => {
        const rect = elem.getBoundingClientRect();
        return rect.top >= 0 && rect.left >= 0 && rect.bottom <= window.innerHeight && rect.right <= window.innerWidth;
      };

      if (virtualTourSection && isInViewport(virtualTourSection)) {
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) {
          event.preventDefault();
          virtualTourSection.focus();
        }
      }
    };

    const handleClick = () => window.location.href = '/virtual-tour';

    const handleEnter = (event) => {
      if (event.key === 'Enter') {
        window.location.href = '/virtual-tour';
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    if (virtualTourSection) {
      virtualTourSection.setAttribute('tabIndex', '0');
      virtualTourSection.addEventListener('click', handleClick);
      virtualTourSection.addEventListener('keydown', handleEnter);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      if (virtualTourSection) {
        virtualTourSection.removeEventListener('click', handleClick);
        virtualTourSection.removeEventListener('keydown', handleEnter);
      }
    };
  }, []);

  
  // Auto-advance carousel for What's New
  useEffect(() => {
    if (newsItems.length > 1) {
      const interval = setInterval(() => {
        setNewsStartIndex(prev => (prev + 1) % newsItems.length);
      }, 4000); // 4 seconds
      return () => clearInterval(interval);
    }
  }, [newsItems]);

  const scrollNewsRow = (direction) => {
    if (newsRowRef.current) {
      const scrollAmount = 320; // width of one card + gap
      newsRowRef.current.scrollBy({
        left: direction === 'right' ? scrollAmount : -scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  const scrollOrganizations = (direction) => {
    if (organizationsRef.current) {
      const scrollAmount = 400; // width of one card + gap
      organizationsRef.current.scrollBy({
        left: direction === 'right' ? scrollAmount : -scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  return (
    <main style={{ background: '#fff' }}>
      <section className="hero-section">
        <div className="main-content">
          <div className="sanVicente-container">
          </div>
          <h1>DIOCESAN SHRINE OF<br />SAN VICENTE FERRER <br />MAMATID</h1>
        </div>
      </section>

      <div className="gradient-space"></div>
    
      {/* Events & Announcements Section (Matching Latest News Design) */}
      <section className="events-announcements-section" style={{ width: "100%", background: "#fff", padding: "16px 0 0 0", marginBottom: 0 }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 16 }}>
          <h2 style={{ color: "#3F2E1E", fontFamily: "Merriweather, serif", fontWeight: 500, fontSize: "2.5rem", letterSpacing: 0.5, textAlign: "center", marginBottom: 0 }}>
            EVENTS & ANNOUNCEMENTS
          </h2>
          <hr style={{ width: "20%", margin: "0 auto 24px", borderTop: "2px solid #CD8B3E", opacity: 0.5, borderRadius: 2 }} />
        </div>

        {isCarouselLoading ? (
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center', 
            padding: '40px 20px',
            minHeight: '300px'
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              border: '3px solid #f3f3f3',
              borderTop: '3px solid #CD8B3E',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              marginBottom: '16px'
            }}></div>
            <div style={{ 
              color: '#5C4B38', 
              fontSize: '1.1rem', 
              fontWeight: 500,
              textAlign: 'center'
            }}>
              Loading events and announcements...
            </div>
            <style>{`
              @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
            `}</style>
          </div>
        ) : carouselItems.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#5C4B38', paddingBottom: 24 }}>
            No events or announcements yet. Please check back soon.
          </div>
        ) : (
          <div
            style={{
              width: windowWidth <= 600 ? '98vw' : '80vw',
              maxWidth: '1400px',
              margin: '0 auto',
              display: 'flex',
              flexDirection: windowWidth <= 900 ? 'column' : 'row',
              alignItems: windowWidth <= 900 ? 'center' : 'flex-start',
              justifyContent: 'center',
              gap: windowWidth <= 900 ? 12 : 12,
              minHeight: windowWidth <= 600 ? 320 : 420,
              boxSizing: 'border-box',
              padding: windowWidth <= 600 ? '0 16px' : '0',
            }}
          >
            {/* Featured Card */}
            {(() => {
              const featuredIdx = carouselIndex % carouselItems.length;
              const featured = carouselItems[featuredIdx];
              const featuredImg = (featured?.image_data && featured?.image_mime)
                ? `data:${featured.image_mime};base64,${featured.image_data}`
                : (featured?.image || 'https://placehold.co/800x500?text=No+Image');
              const goToEvents = () => {
                if (featured?.type === 'announcement') localStorage.setItem('eventsTab', 'announcements');
                navigate('/events');
              };
              return (
                <div key={featuredIdx}
                  style={{
                    flex: windowWidth <= 900 ? 'none' : '1 1 0',
                    width: windowWidth <= 900 ? '100%' : 'auto',
                    minWidth: windowWidth <= 600 ? '320px' : '480px',
                    maxWidth: windowWidth <= 900 ? '600px' : 'none',
                    boxSizing: 'border-box',
                    background: '#F7F3ED',
                    borderRadius: 22,
                    overflow: 'hidden',
                    position: 'relative',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'flex-end',
                    aspectRatio: windowWidth <= 600 ? '16/10' : '16/9',
                    cursor: 'pointer',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                  }}
                  onClick={goToEvents}
                >
                  {/* Calendar Date Box - Positioned at upper right corner of image */}
                  <div style={{
                    position: 'absolute',
                    top: '16px',
                    right: '16px',
                    background: 'rgba(205, 139, 62, 0.95)',
                    borderRadius: '12px',
                    padding: '8px',
                    textAlign: 'center',
                    minWidth: '60px',
                    backdropFilter: 'blur(10px)',
                    zIndex: 3,
                  }}>
                    {(() => {
                      const dateStr = featured?.date || featured?.created_at?.slice(0,10) || '';
                      const date = new Date(dateStr);
                      const month = date.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
                      const day = date.getDate();
                      return (
                        <>
                          <div style={{ color: 'white', fontWeight: 600, fontSize: '0.8rem', letterSpacing: '0.5px', lineHeight: 1, textTransform: 'uppercase' }}>
                            {month}
                          </div>
                          <div style={{ color: 'white', fontWeight: 700, fontSize: '1.5rem', lineHeight: 1 }}>
                            {day}
                          </div>
                        </>
                      );
                    })()}
                  </div>
                  
                  <img
                    src={featuredImg}
                    alt={featured?.title || featured?.name || 'Item'}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', borderRadius: 22 }}
                  />
                  <div style={{
                    position: 'absolute', left: 0, right: 0, bottom: 0, color: '#fff',
                    padding: '28px 32px 20px 32px', borderBottomLeftRadius: 22, borderBottomRightRadius: 22,
                    zIndex: 2, 
                    background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.4) 50%, transparent 100%)', 
                    textShadow: '0 2px 8px rgba(0,0,0,0.7)'
                  }}>
                    <div style={{ fontSize: '1.55rem', fontWeight: 800, color: '#fff', marginBottom: 0, fontFamily: 'Merriweather, serif', lineHeight: 1.2, textShadow: '0 2px 8px rgba(0,0,0,0.8)' }}>
                      {featured?.title || featured?.name || ''}
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Side Grid (up to 6) */}
            <div style={{
              flex: windowWidth <= 900 ? 'none' : '1 1 0',
              display: 'grid',
              gridTemplateColumns: windowWidth <= 600 ? '1fr' : windowWidth <= 900 ? 'repeat(2, 1fr)' : 'repeat(2, 1fr)',
              gridTemplateRows: windowWidth <= 600 ? 'none' : windowWidth <= 900 ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)',
              gap: windowWidth <= 600 ? 16 : 16,
              width: windowWidth <= 900 ? '100%' : 'auto',
              minWidth: windowWidth <= 600 ? 0 : windowWidth <= 900 ? '100%' : '420px',
              maxWidth: windowWidth <= 900 ? '600px' : 'none',
              boxSizing: 'border-box',
              justifyContent: 'space-between',
              margin: windowWidth <= 900 ? '0 auto' : '0',
            }}>
              {Array.from({ length: Math.min(4, Math.max(0, carouselItems.length - 1)) }).map((_, idx) => {
                const sideIdx = (carouselIndex + 1 + idx) % carouselItems.length;
                const item = carouselItems[sideIdx];
                const img = (item?.image_data && item?.image_mime)
                  ? `data:${item.image_mime};base64,${item.image_data}`
                  : (item?.image || 'https://placehold.co/600x400?text=No+Image');
                const handleClick = () => {
                  if (item?.type === 'announcement') localStorage.setItem('eventsTab', 'announcements');
                  navigate('/events');
                };
                return (
                  <div key={sideIdx} style={{
                    background: '#F7F3ED',
                    borderRadius: 16,
                    overflow: 'hidden',
                    width: '100%',
                    height: 'auto',
                    position: 'relative',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'flex-end',
                    aspectRatio: windowWidth <= 600 ? '16/10' : '16/8',
                    transition: 'box-shadow 0.2s, transform 0.2s',
                    cursor: 'pointer',
                    boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
                  }}
                  onClick={handleClick}
                  onMouseOver={e => { 
                    e.currentTarget.style.boxShadow='0 8px 28px rgba(205,139,62,0.15)'; 
                    e.currentTarget.style.transform='translateY(-3px)'; 
                  }}
                  onMouseOut={e => { 
                    e.currentTarget.style.boxShadow='0 2px 12px rgba(0,0,0,0.06)'; 
                    e.currentTarget.style.transform='none'; 
                  }}
                  >
                    {/* Calendar Date Box - Positioned at upper right corner of image */}
                    <div style={{
                      position: 'absolute',
                      top: '12px',
                      right: '12px',
                      background: 'rgba(205, 139, 62, 0.95)',
                      borderRadius: '8px',
                      padding: '4px',
                      textAlign: 'center',
                      minWidth: '45px',
                      backdropFilter: 'blur(8px)',
                      zIndex: 3,
                    }}>
                      {(() => {
                        const dateStr = item?.date || item?.created_at?.slice(0,10) || '';
                        const date = new Date(dateStr);
                        const month = date.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
                        const day = date.getDate();
                        return (
                          <>
                            <div style={{ color: 'white', fontWeight: 600, fontSize: '0.6rem', letterSpacing: '0.5px', lineHeight: 1, textTransform: 'uppercase' }}>
                              {month}
                            </div>
                            <div style={{ color: 'white', fontWeight: 700, fontSize: '1rem', lineHeight: 1 }}>
                              {day}
                            </div>
                          </>
                        );
                      })()}
                    </div>
                    
                    <img src={img} alt={item?.title || item?.name || 'Item'}
                         style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', borderRadius: 16 }} />
                    <div style={{
                      position: 'absolute', left: 0, right: 0, bottom: 0, color: '#fff',
                      padding: '14px 18px 10px 18px', borderBottomLeftRadius: 16, borderBottomRightRadius: 16,
                      zIndex: 2, 
                      background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.5) 60%, transparent 100%)', 
                      textShadow: '0 2px 8px rgba(0,0,0,0.8)'
                    }}>
                      <div style={{ fontSize: '1.08rem', fontWeight: 700, color: '#fff', marginBottom: 0, fontFamily: 'Merriweather, serif', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', textShadow: '0 2px 8px rgba(0,0,0,0.8)' }}>
                        {item?.title || item?.name || ''}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* See More Button */}
        <div style={{ width: '100%', display: 'flex', justifyContent: 'center', marginTop: windowWidth <= 600 ? 16 : -80, boxSizing: 'border-box' }}>
          <button
            style={{
              background: '#fff', color: '#CD8B3E', border: '2px solid #CD8B3E', borderRadius: 8,
              padding: '12px 36px', fontSize: '1.1rem', fontWeight: 600, cursor: 'pointer',
              boxShadow: '0 1px 4px rgba(205,139,62,0.10)', letterSpacing: 1, transition: 'background 0.2s, color 0.2s',
            }}
            onClick={() => navigate('/events')}
            onMouseOver={e => { e.target.style.background='#CD8B3E'; e.target.style.color='#fff'; }}
            onMouseOut={e => { e.target.style.background='#fff'; e.target.style.color='#CD8B3E'; }}
          >
            See More
          </button>
        </div>
      </section>

      {/* Gradient Design Section */}
      <div className="gradient-design-section"></div>
    
      <section className="historical-section">
        <div className="historical-content">
          <div className="historical-image" id='history'>
            <img
              src="/images/SanVicente-Vested.jpg"
              alt="San Vicente Ferrer"
              className="history-img"
              onContextMenu={e => e.preventDefault()}
            />
          </div>
          <div className="historical-text" >
            <h2 style={{ textAlign: windowWidth <= 600 ? 'center' : 'left' }}>HISTORICAL PROFILE</h2>
            <p style={{ textAlign: windowWidth <= 600 ? 'center' : 'left' }}>The parish church of San Vicente Ferrer in Mamatid, Cabuyao, traces its origins to the miraculous discovery of the patron saint's image beneath a large tree on the church's current site. The villagers built a small chapel at the location, and later, the land was donated to the Church by the affluent Bella family of Cabuyao. On April 5, 1946, the chapel became a parish church under the Diocese of Lipa, Batangas. Devotion to San Vicente Ferrer flourished, spreading to neighboring towns and cities, with parishioners embracing the saint's habits, participating in the grand annual fiesta, and showing</p>
            <button className="read-more" onClick={() => navigate('/historical-profile')}>READ MORE</button>
          </div>
        </div>
      </section>
 
      <div className="gradient-space-reverse"></div>

      {/* Latest News Section (Matching Events & Announcements Design) */}
      <section 
        className={`latest-news-section${newsVisible ? ' fade-in-up' : ''}`}
        ref={newsSectionRef}
        style={{ width: "100%", background: "#fff", padding: "16px 0 0 0", marginBottom: 0 }}
      >
        {/* News Title and Subtitle (centered above cards) */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 16 }}>
          <h2 style={{ color: "#3F2E1E", fontFamily: "Merriweather, serif", fontWeight: 500, fontSize: "2.5rem", letterSpacing: 0.5, textAlign: "center", marginBottom: 0 }}>
            LATEST NEWS
          </h2>
          <hr style={{ width: "20%", margin: "0 auto 24px", borderTop: "2px solid #CD8B3E", opacity: 0.5, borderRadius: 2 }} />
        </div>
        {/* News Row with Arrows and Cards */}
        <div
          style={{
            width: windowWidth <= 600 ? '98vw' : '80vw',
            maxWidth: '1400px',
            margin: '0 auto',
            display: 'flex',
            flexDirection: windowWidth <= 900 ? 'column' : 'row',
            alignItems: windowWidth <= 900 ? 'center' : 'flex-start',
            justifyContent: 'center',
            gap: windowWidth <= 900 ? 12 : 12,
            minHeight: windowWidth <= 600 ? 320 : 420,
            boxSizing: 'border-box',
            padding: windowWidth <= 600 ? '0 16px' : '0',
          }}
        >
          {/* News Content */}
          {newsItems.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#5C4B38', paddingBottom: 24 }}>
              No news available yet. Please check back soon.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: windowWidth <= 900 ? 'column' : 'row', alignItems: windowWidth <= 900 ? 'center' : 'flex-start', justifyContent: 'center', gap: windowWidth <= 900 ? 12 : 12, width: '100%' }}>
          {/* Featured News Card */}
          {newsItems.length > 0 && (
            (() => {
              const featuredIdx = newsStartIndex % newsItems.length;
              const featured = newsItems[featuredIdx];
              return (
                <div key={featuredIdx} 
                  style={{
                    flex: windowWidth <= 900 ? 'none' : '1 1 0',
                    width: windowWidth <= 900 ? '100%' : 'auto',
                    minWidth: windowWidth <= 600 ? '320px' : '480px',
                    maxWidth: windowWidth <= 900 ? '600px' : 'none',
                    boxSizing: 'border-box',
                    background: '#F7F3ED',
                    borderRadius: 22,
                    overflow: 'hidden',
                    position: 'relative',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'flex-end',
                    aspectRatio: windowWidth <= 600 ? '16/10' : '16/9',
                    cursor: 'pointer',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                  }}
                  onClick={() => navigate(`/news/${featured.id}`)}
                >
                  {/* Calendar Date Box - Positioned at upper right corner of image */}
                  <div style={{
                    position: 'absolute',
                    top: '16px',
                    right: '16px',
                    background: 'rgba(205, 139, 62, 0.95)',
                    borderRadius: '12px',
                    padding: '8px',
                    textAlign: 'center',
                    minWidth: '60px',
                    backdropFilter: 'blur(10px)',
                    zIndex: 3,
                  }}>
                    {(() => {
                      const dateStr = featured.date || '';
                      const date = new Date(dateStr);
                      const month = date.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
                      const day = date.getDate();
                      return (
                        <>
                          <div style={{ color: 'white', fontWeight: 600, fontSize: '0.8rem', letterSpacing: '0.5px', lineHeight: 1, textTransform: 'uppercase' }}>
                            {month}
                          </div>
                          <div style={{ color: 'white', fontWeight: 700, fontSize: '1.5rem', lineHeight: 1 }}>
                            {day}
                          </div>
                        </>
                      );
                    })()}
                  </div>
                  
                  <img
                    src={featured.image || 'https://placehold.co/800x500?text=No+Image'}
                    alt={featured.title || 'News Item'}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', borderRadius: 22 }}
                  />
                  {/* Overlay for text */}
                  <div style={{
                    position: 'absolute', left: 0, right: 0, bottom: 0, color: '#fff',
                    padding: '28px 32px 20px 32px', borderBottomLeftRadius: 22, borderBottomRightRadius: 22,
                    zIndex: 2, 
                    background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.4) 50%, transparent 100%)', 
                    textShadow: '0 2px 8px rgba(0,0,0,0.7)'
                  }}>
                    <div style={{fontSize: '1.55rem', fontWeight: 800, color: '#fff', marginBottom: 0, fontFamily: 'Merriweather, serif', lineHeight: 1.2, textShadow: '0 2px 8px rgba(0,0,0,0.8)'}}>{featured.title}</div>
                  </div>
                </div>
              );
            })()
          )}
          {/* Side News Cards Grid (up to 4) */}
          <div style={{
            flex: windowWidth <= 900 ? 'none' : '1 1 0',
            display: 'grid',
            gridTemplateColumns: windowWidth <= 600 ? '1fr' : windowWidth <= 900 ? 'repeat(2, 1fr)' : 'repeat(2, 1fr)',
            gridTemplateRows: windowWidth <= 600 ? 'none' : windowWidth <= 900 ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)',
            gap: windowWidth <= 600 ? 16 : 16,
            width: windowWidth <= 900 ? '100%' : 'auto',
            minWidth: windowWidth <= 600 ? 0 : windowWidth <= 900 ? '100%' : '420px',
            maxWidth: windowWidth <= 900 ? '600px' : 'none',
            boxSizing: 'border-box',
            justifyContent: 'space-between',
            margin: windowWidth <= 900 ? '0 auto' : '0',
          }}>
            {Array.from({ length: Math.min(4, Math.max(0, newsItems.length - 1)) }).map((_, idx) => {
              const sideIdx = (newsStartIndex + 1 + idx) % newsItems.length;
              const item = newsItems[sideIdx];
              return (
                <div key={sideIdx} style={{
                  background: '#F7F3ED',
                  borderRadius: 16,
                  overflow: 'hidden',
                  width: '100%',
                  height: 'auto',
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'flex-end',
                  aspectRatio: windowWidth <= 600 ? '16/10' : '16/8',
                  transition: 'box-shadow 0.2s, transform 0.2s',
                  cursor: 'pointer',
                  boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
                }}
                onClick={() => navigate(`/news/${item.id}`)}
                onMouseOver={e => { 
                  e.currentTarget.style.boxShadow='0 8px 28px rgba(205,139,62,0.15)'; 
                  e.currentTarget.style.transform='translateY(-3px)'; 
                }}
                onMouseOut={e => { 
                  e.currentTarget.style.boxShadow='0 2px 12px rgba(0,0,0,0.06)'; 
                  e.currentTarget.style.transform='none'; 
                }}
                >
                  {/* Calendar Date Box - Positioned at upper right corner of image */}
                  <div style={{
                    position: 'absolute',
                    top: '12px',
                    right: '12px',
                    background: 'rgba(205, 139, 62, 0.95)',
                    borderRadius: '8px',
                    padding: '4px',
                    textAlign: 'center',
                    minWidth: '45px',
                    backdropFilter: 'blur(8px)',
                    zIndex: 3,
                  }}>
                    {(() => {
                      const dateStr = item.date || '';
                      const date = new Date(dateStr);
                      const month = date.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
                      const day = date.getDate();
                      return (
                        <>
                          <div style={{ color: 'white', fontWeight: 600, fontSize: '0.6rem', letterSpacing: '0.5px', lineHeight: 1, textTransform: 'uppercase' }}>
                            {month}
                          </div>
                          <div style={{ color: 'white', fontWeight: 700, fontSize: '1rem', lineHeight: 1 }}>
                            {day}
                          </div>
                        </>
                      );
                    })()}
                  </div>
                  
                  <img
                    src={item.image || 'https://placehold.co/600x400?text=No+Image'}
                    alt={item.title || 'News Item'}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', borderRadius: 16 }}
                  />
                  <div style={{
                    position: 'absolute', left: 0, right: 0, bottom: 0, color: '#fff',
                    padding: '28px 32px 20px 32px', borderBottomLeftRadius: 16, borderBottomRightRadius: 16,
                    zIndex: 2, 
                    background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.4) 50%, transparent 100%)', 
                    textShadow: '0 2px 8px rgba(0,0,0,0.7)'
                  }}>
                    <div style={{fontSize: '1.55rem', fontWeight: 800, color: '#fff', marginBottom: 0, fontFamily: 'Merriweather, serif', lineHeight: 1.2, textShadow: '0 2px 8px rgba(0,0,0,0.8)'}}>{item.title}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
          )}
            </div>
        {/* See More Button below cards */}
        <div style={{width: '100%', display: 'flex', justifyContent: 'center', marginTop: windowWidth <= 600 ? 16 : -80, boxSizing: 'border-box'}}>
          <button
            style={{
              background: '#fff',
              color: '#CD8B3E',
              border: '2px solid #CD8B3E',
              borderRadius: 8,
              padding: '12px 36px',
              fontSize: '1.1rem',
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: '0 1px 4px rgba(205,139,62,0.10)',
              letterSpacing: 1,
              transition: 'background 0.2s, color 0.2s',
            }}
            onClick={() => navigate('/news')}
            onMouseOver={e => {e.target.style.background='#CD8B3E';e.target.style.color='#fff';}}
            onMouseOut={e => {e.target.style.background='#fff';e.target.style.color='#CD8B3E';}}
          >
            See More
          </button>
        </div>
      </section>
      
      <div className="gradient-space-reverse"></div>

      <section className="virtual-tour-section" id='explore'>
        <div className="virtual-tour-content">
          <h1 className="tour-title">Explore Virtual Tour</h1>
          <p className="tour-description">Experience the beauty and serenity of the church like never before through ViceTech's Virtual 360° Tour</p>
          <a href="/virtual-tour" className="explore-button">EXPLORE NOW</a>
        </div>
        <div className="virtual-tour-overlay"></div>
        <div className="virtual-tour-background"></div>
      </section>

      <div className="gradient-space"></div>

      {/* Ministries Section */}
      <section id="ministries" className="organizations-section">
        <div className="organizations-container">
          <div className="organizations-header">
            <div className="organizations-icon">
              <img src="/images/COA-DIOCESAN-SHRINE-SVF-MAMATID-SOLO.svg" alt="Church Logo" style={{ width: '50px', height: '50px' }} />
            </div>
            <h2 className="organizations-title">MINISTRIES</h2>
            <p className="organizations-quote">"In prayer and service together, we become the hands and feet of Christ."</p>
          </div>
          
          <div className="organizations-carousel">
            <button className="organizations-nav-btn organizations-nav-prev" onClick={() => scrollOrganizations('left')}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M15 18l-6-6 6-6"/>
              </svg>
            </button>
            
            <div className="organizations-cards" ref={organizationsRef}>
              {ministries.length > 0 ? (
                ministries.map((ministry) => {
                  const imageSrc = ministry.image_data && ministry.image_mime
                    ? `data:${ministry.image_mime};base64,${ministry.image_data}`
                    : '/images/organizations/placeholder.jpg';
                  return (
                    <div 
                      key={ministry.id} 
                      className="organization-card"
                      onClick={() => navigate(`/ministries/${ministry.id}`)}
                      style={{ cursor: 'pointer' }}
                    >
                      <img src={imageSrc} alt={ministry.name} />
                      <div className="organization-caption">{ministry.name.toUpperCase()}</div>
                    </div>
                  );
                })
              ) : (
                <>
                  <div 
                    className="organization-card"
                    onClick={() => navigate('/ministries')}
                    style={{ cursor: 'pointer' }}
                  >
                    <img src="/images/organizations/cofradia.jpg" alt="Cofradia del Sto. Niño" />
                    <div className="organization-caption">COFRADIA DEL STO. NIÑO</div>
                  </div>
                  <div 
                    className="organization-card"
                    onClick={() => navigate('/ministries')}
                    style={{ cursor: 'pointer' }}
                  >
                    <img src="/images/organizations/ministers.jpg" alt="Ministers of Holy Communion" />
                    <div className="organization-caption">MINISTERS OF HOLY COMMUNION</div>
                  </div>
                  <div 
                    className="organization-card"
                    onClick={() => navigate('/ministries')}
                    style={{ cursor: 'pointer' }}
                  >
                    <img src="/images/organizations/lectors.jpg" alt="Lectors and Cantors Ministry" />
                    <div className="organization-caption">LECTORS AND CANTORS MINISTRY</div>
                  </div>
                </>
              )}
            </div>
            
            <button className="organizations-nav-btn organizations-nav-next" onClick={() => scrollOrganizations('right')}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 18l6-6-6-6"/>
              </svg>
            </button>
          </div>
        </div>
      </section>

      <div className="gradient-space-flipped"></div>

      {/* Google Maps Section - Above Footer */}
      <section className="map-section">
        <div className="map-container">
          <div className="map-header">
            <h2 className="map-title">Find Us</h2>
            <p className="map-subtitle">Visit the Diocesan Shrine of San Vicente Ferrer</p>
            <hr className="map-divider" />
          </div>

          <div className="map-card">
            <div className="map-wrapper" style={{ width: '100%', height: '400px' }}>
              <GoogleMap
                width="100%"
                height="100%"
                lat={14.23502}
                lng={121.15816}
                zoom={17}
                markerTitle="Diocesan Shrine and Parish of San Vicente Ferrer - Mamatid"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer-section">
        <div className="footer-content">
          <div className="footer-left">
            <div className="footer-logo">
              <img 
                src="/images/COA-DIOCESAN-SHRINE-SVF-MAMATID-SOLO.svg" 
                alt="San Vicente Ferrer Logo" 
                className="footer-logo-img"
                draggable="false"
                onDragStart={(e) => e.preventDefault()}
                onContextMenu={(e) => e.preventDefault()}
                style={{userSelect: 'none', WebkitUserSelect: 'none', pointerEvents: 'auto'}}
              />
              <div className="footer-title" style={{ textAlign: 'center' }}>
                <h3>DIOCESAN SHRINE OF</h3>
                <h2>SAN VICENTE FERRER</h2>
                <p>Brgy. Mamatid City of Cabuyao Laguna</p>
              </div>
            </div>
          </div>

          <div className="footer-right">
            <div className="footer-contact" style={{ textAlign: windowWidth <= 600 ? 'center' : 'left' }}>
              <p>For more inquiries Please , Contact our Office at</p>
              <p>09123456789 / 09123456789</p>
              <p>09123456789 / 09123456789</p>
            </div>

            <div className="footer-donate" style={{ textAlign: windowWidth <= 600 ? 'center' : 'left', display: 'flex', alignItems: 'center', gap: '12px', flexWrap: windowWidth <= 600 ? 'wrap' : 'nowrap', justifyContent: windowWidth <= 600 ? 'center' : 'flex-start' }}>
              <button 
                className="donate-button" 
                onClick={() => navigate('/give')} 
                title="Donate Online"
                style={{
                  background: 'linear-gradient(135deg, #CD8B3E 0%, #B8762A 100%)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '25px',
                  padding: '12px 24px',
                  fontSize: '1rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 15px rgba(205, 139, 62, 0.3)',
                  transition: 'all 0.3s ease',
                  letterSpacing: '0.5px',
                  textTransform: 'uppercase'
                }}
                onMouseOver={e => {
                  e.target.style.background = 'linear-gradient(135deg, #B8762A 0%, #A0651F 100%)';
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 6px 20px rgba(205, 139, 62, 0.4)';
                }}
                onMouseOut={e => {
                  e.target.style.background = 'linear-gradient(135deg, #CD8B3E 0%, #B8762A 100%)';
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 4px 15px rgba(205, 139, 62, 0.3)';
                }}
              >
                <img src="/images/COA-DIOCESAN-SHRINE-SVF-MAMATID-SOLO.svg" alt="Donate" className="donate-icon" style={{ width: '20px', height: '20px' }} />
                <span>Donate</span>
              </button>
              <a href="https://www.facebook.com/SanVicenteFerrerMamatid" target="_blank" rel="noopener noreferrer" className="social-link" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '40px', height: '40px', backgroundColor: '#1877F2', borderRadius: '50%', textDecoration: 'none', transition: 'transform 0.2s', boxShadow: '0 2px 8px rgba(24, 119, 242, 0.3)' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" style={{ display: 'block', fill: 'white' }}>
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" fill="white" stroke="none"/>
                </svg>
              </a>
              <a href="https://www.instagram.com/loloentengmamatid" target="_blank" rel="noopener noreferrer" className="social-link" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '40px', height: '40px', backgroundColor: '#E4405F', borderRadius: '50%', textDecoration: 'none', transition: 'transform 0.2s', boxShadow: '0 2px 8px rgba(228, 64, 95, 0.3)' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" style={{ display: 'block', fill: 'white' }}>
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" fill="white" stroke="none"/>
                </svg>
              </a>
              <a href="https://www.tiktok.com/@loloentengmamatid" target="_blank" rel="noopener noreferrer" className="social-link" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '40px', height: '40px', backgroundColor: '#000000', borderRadius: '50%', textDecoration: 'none', transition: 'transform 0.2s', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" style={{ display: 'block', fill: 'white' }}>
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" fill="white" stroke="none"/>
                </svg>
              </a>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <div className="footer-copyright" style={{ textAlign: windowWidth <= 600 ? 'center' : 'left' }}>
            <p>&copy; Copyright All rights reserved</p>
          </div>
        </div>
      </footer>

      <Chatbot />
      
      {/* Mobile Social Media Icons Fix */}
      <style>{`
        @media (max-width: 600px) {
          .social-link {
            width: 44px !important;
            height: 44px !important;
            min-width: 44px !important;
            min-height: 44px !important;
            display: inline-flex !important;
            align-items: center !important;
            justify-content: center !important;
            flex-shrink: 0 !important;
            position: relative !important;
          }
          
          .social-link svg {
            width: 22px !important;
            height: 22px !important;
            display: block !important;
            fill: white !important;
            stroke: none !important;
            pointer-events: none !important;
            position: absolute !important;
            top: 50% !important;
            left: 50% !important;
            transform: translate(-50%, -50%) !important;
            z-index: 2 !important;
          }
          
          .social-link svg path {
            fill: white !important;
            stroke: none !important;
            vector-effect: non-scaling-stroke !important;
          }
          
          .footer-donate {
            gap: 16px !important;
            margin-top: 16px !important;
          }
        }
        
        .social-link:hover {
          transform: scale(1.1) !important;
        }
        
        .social-link svg {
          pointer-events: none;
        }
        
        .social-link svg path {
          fill: white !important;
          stroke: none !important;
        }
      `}</style>
    </main>
  );
};
export default Home;