import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../utils/axios';
import '../../css/Chatbot.css';

const Chatbot = () => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [lastSentMessage, setLastSentMessage] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const messagesEndRef = useRef(null);
  const chatWindowRef = useRef(null);
  const resizeHandleRef = useRef(null);
  const isResizingRef = useRef(false);
  
  // Load saved size from localStorage or use defaults
  const getInitialSize = () => {
    try {
      const saved = localStorage.getItem('chatbot-size');
      if (saved) {
        const parsed = JSON.parse(saved);
        return { width: parsed.width || 380, height: parsed.height || 500 };
      }
    } catch (e) {
      console.warn('Failed to load chatbot size from localStorage:', e);
    }
    return { width: 380, height: 500 };
  };
  
  const [chatSize, setChatSize] = useState(getInitialSize);

  // FAQ Questions
  const faqQuestions = [
    "What are the mass schedules?",
    "How do I request a certificate?",
    "What are the office hours?",
    "How can I contact the parish office?",
    "Where can I make a donation?",
    "What ministries are available?"
  ];

  // Check if user is authenticated
  const checkAuthentication = () => {
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    return user && user.id;
  };

  // Handle FAQ question click
  const handleFAQClick = async (question) => {
    if (!isOnline || isLoading) return;
    
    // Add the question as user message
    addMessage(question, 'user');
    setInputMessage('');
    setErrorMessage('');
    setIsLoading(true);
    
    try {
      await sendMessage(question);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle opening chat - check authentication first
  const handleOpenChat = () => {
    if (!checkAuthentication()) {
      // Redirect to login with a message
      navigate('/login', { 
        state: { 
          message: 'Please login to use the chatbot.',
          redirectTo: window.location.pathname
        } 
      });
      return;
    }
    setIsOpen(true);
  };

  const addMessage = (text, sender) => {
    setMessages(prev => [...prev, { text, sender }]);
  };

  // Parse markdown links and convert to React elements
  const parseLinks = (text) => {
    // Split text by newlines first to preserve line breaks
    const lines = text.split('\n');
    return lines.map((line, lineIndex) => {
      // Regular expression to match markdown links: [text](url)
      const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
      const parts = [];
      let lastIndex = 0;
      let match;

      while ((match = linkRegex.exec(line)) !== null) {
        // Add text before the link
        if (match.index > lastIndex) {
          parts.push(line.substring(lastIndex, match.index));
        }
        
        // Add the link
        const linkText = match[1];
        const linkUrl = match[2];
        parts.push(
          <a
            key={`${lineIndex}-${match.index}`}
            href={linkUrl}
            onClick={(e) => {
              e.preventDefault();
              navigate(linkUrl);
              setIsOpen(false); // Close chat window after navigation
            }}
            style={{
              color: '#CD8B3E',
              textDecoration: 'underline',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            {linkText}
          </a>
        );
        
        lastIndex = linkRegex.lastIndex;
      }
      
      // Add remaining text after the last link
      if (lastIndex < line.length) {
        parts.push(line.substring(lastIndex));
      }
      
      // Return the line with its parts, or the original line if no links
      const lineContent = parts.length > 0 ? parts : line;
      
      // Add line break if not the last line
      return (
        <React.Fragment key={lineIndex}>
          {lineContent}
          {lineIndex < lines.length - 1 && <br />}
        </React.Fragment>
      );
    });
  };

  const handleSendMessage = async (e) => {
    // only trigger on Enter key or click event
    if ((e.key === 'Enter' || e.type === 'click') && inputMessage.trim() && !isLoading) {
      const message = inputMessage.trim();
      // store last message in case we need to retry
      setLastSentMessage(message);
      addMessage(message, 'user');
      setInputMessage('');
      setErrorMessage('');
      setIsLoading(true);
      try {
        await sendMessage(message);
      } finally {
        setIsLoading(false);
      }
    }
  };

  // sendMessage performs the network call with timeout and sets system messages or error state
  const sendMessage = async (message) => {
    if (!message) return;
    if (!isOnline || (typeof navigator !== 'undefined' && !navigator.onLine)) {
      setErrorMessage('You appear to be offline. Please check your internet connection.');
      addMessage('Error: no internet connection.', 'system');
      return;
    }

    let timeoutId;
    const timeoutMs = 20000; // 20s
    try {
      const postPromise = api.post('/chat', { message });
      const timeoutPromise = new Promise((_, reject) => { timeoutId = setTimeout(() => reject(new Error('timeout')), timeoutMs); });
      const response = await Promise.race([postPromise, timeoutPromise]);
      clearTimeout(timeoutId);

      if (response && response.data) {
        // prefer structured response
        addMessage(response.data.response || 'No response from server.', 'system');
      } else {
        addMessage('No response from server.', 'system');
      }
      setErrorMessage('');
    } catch (error) {
      clearTimeout(timeoutId);
      // provide friendlier messages depending on the failure
      if (error.message === 'timeout') {
        setErrorMessage('The request timed out. Check your connection and try again.');
        addMessage('Error: request timed out.', 'system');
      } else if (error.message === 'Network Error' || (error.request && !error.response)) {
        setErrorMessage('Network error. Please check your internet connection.');
        addMessage('Error: network failure.', 'system');
      } else if (error.response) {
        // Handle authentication errors
        if (error.response.status === 401 || error.response.status === 403) {
          setErrorMessage('Please login to use the chatbot.');
          addMessage('Authentication required. Please login to continue.', 'system');
          // Close chat and redirect to login after a short delay
          setTimeout(() => {
            setIsOpen(false);
            navigate('/login', { 
              state: { 
                message: 'Please login to use the chatbot.',
                redirectTo: window.location.pathname
              } 
            });
          }, 2000);
        } else {
          setErrorMessage(`Server error (${error.response.status}). Please try again later.`);
          addMessage('Sorry, there was an error. Please try again later.', 'system');
        }
      } else {
        setErrorMessage('An unexpected error occurred. Please try again.');
        addMessage('Sorry, there was an error. Please try again later.', 'system');
      }
    }
  };

  useEffect(() => {
    if (isOpen && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  // listen to online/offline events to show status and prevent sending
  useEffect(() => {
    const handleOnline = () => { setIsOnline(true); setErrorMessage(''); };
    const handleOffline = () => { setIsOnline(false); setErrorMessage('You appear to be offline. Check your internet connection.'); };
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Listen for logout events to close chat
  useEffect(() => {
    const handleLogout = () => {
      setIsOpen(false);
      setMessages([]);
      setInputMessage('');
      setErrorMessage('');
    };
    window.addEventListener('userLogout', handleLogout);
    return () => {
      window.removeEventListener('userLogout', handleLogout);
    };
  }, []);

  // Resize functionality
  useEffect(() => {
    if (!resizeHandleRef.current) return;

    const handleMouseDown = (e) => {
      // Check if clicking on the resize handle or its children
      const target = e.target;
      if (target === resizeHandleRef.current || resizeHandleRef.current.contains(target)) {
        e.preventDefault();
        e.stopPropagation();
        isResizingRef.current = true;
        document.body.style.cursor = 'nwse-resize';
        document.body.style.userSelect = 'none';
      }
    };

    const handleMouseMove = (e) => {
      if (!isResizingRef.current || !chatWindowRef.current) return;

      e.preventDefault();
      const rect = chatWindowRef.current.getBoundingClientRect();
      // Calculate width and height from top-left corner
      // Keep bottom-right corner fixed by using bottom and right CSS properties
      const newWidth = rect.right - e.clientX;
      const newHeight = rect.bottom - e.clientY;

      // Min and max constraints
      const minWidth = 300;
      const maxWidth = window.innerWidth - 48; // Account for margins
      const minHeight = 400;
      const maxHeight = window.innerHeight - 48;

      const constrainedWidth = Math.max(minWidth, Math.min(maxWidth, newWidth));
      const constrainedHeight = Math.max(minHeight, Math.min(maxHeight, newHeight));

      setChatSize({
        width: constrainedWidth,
        height: constrainedHeight
      });

      // Keep bottom-right position fixed - don't change left/top
      // The CSS already has bottom: 24px and right: 24px, so we just update size
      if (chatWindowRef.current) {
        chatWindowRef.current.style.left = 'auto';
        chatWindowRef.current.style.top = 'auto';
        chatWindowRef.current.style.right = '24px';
        chatWindowRef.current.style.bottom = '24px';
      }

      // Save to localStorage
      try {
        localStorage.setItem('chatbot-size', JSON.stringify({
          width: constrainedWidth,
          height: constrainedHeight
        }));
      } catch (e) {
        console.warn('Failed to save chatbot size to localStorage:', e);
      }
    };

    const handleMouseUp = () => {
      if (isResizingRef.current) {
        isResizingRef.current = false;
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      }
    };

    const resizeHandle = resizeHandleRef.current;
    resizeHandle.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      resizeHandle.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isOpen]); // Re-run when chat opens/closes to ensure ref is available

  return (
    <>
      {/* Floating Chat Button */}
      <button
        className="chat-button genz-chat-btn chatbot-face-button"
        onClick={handleOpenChat}
        aria-label="Open chat window"
      >
        <img 
          src="/images/chatbot-face.png" 
          alt="Chat with us"
          className="chatbot-face-image"
          onError={(e) => {
            // Fallback if image doesn't exist - show default icon
            const button = e.currentTarget.closest('button');
            if (button) {
              e.target.style.display = 'none';
              button.style.background = 'linear-gradient(135deg, #CD8B3E 0%, #B77B35 100%)';
              button.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" width="28" height="28" style="color: white;">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
              `;
            }
          }}
        />
      </button>

      {/* Chat Window */}
      <section
        ref={chatWindowRef}
        className={`chat-window${isOpen ? ' active' : ''}`}
        id="chatWindow"
        aria-label="Chat window"
        tabIndex={-1}
        style={{
          width: `${chatSize.width}px`,
          height: `${chatSize.height}px`,
          maxWidth: '95vw',
          maxHeight: '95vh',
          bottom: '24px',
          right: '24px',
          left: 'auto',
          top: 'auto'
        }}
      >
        <header className="chat-header genz-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <img 
              src="/images/chatbot-face.png" 
              alt="Vici"
              style={{
                width: '48px',
                height: '48px',
                objectFit: 'cover',
                objectPosition: 'center 30%',
                flexShrink: 0
              }}
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
            <span style={{ fontSize: '1.4rem', fontWeight: '800' }}>Vici</span>
          </div>
          <button className="close-chat genz-close" onClick={() => setIsOpen(false)} aria-label="Close chat window">
            <span style={{ fontSize: '18px' }}>✕</span>
          </button>
        </header>
        {/* Error banner when offline or network issues */}
        {errorMessage && (
          <div style={{ padding: '12px 16px', background: '#fef2f2', color: '#dc2626', borderRadius: '8px', margin: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, border: '1px solid #fecaca' }} role="alert">
            <div style={{ fontSize: '0.9rem' }}>{errorMessage}</div>
            <div style={{ display: 'flex', gap: 8 }}>
              {lastSentMessage && (
                <button
                  type="button"
                  onClick={async () => {
                    if (!lastSentMessage) return;
                    setErrorMessage('');
                    setIsLoading(true);
                    try {
                      await sendMessage(lastSentMessage);
                    } finally {
                      setIsLoading(false);
                    }
                  }}
                  style={{ background: '#3b82f6', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem' }}
                >
                  Retry
                </button>
              )}
              <button type="button" onClick={() => setErrorMessage('')} style={{ background: 'transparent', border: '1px solid #d1d5db', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem' }}>Dismiss</button>
            </div>
          </div>
        )}

        <main className="chat-messages">
          {messages.length === 0 ? (
            <div style={{ 
              padding: '1rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem'
            }}>
              <div style={{ 
                color: '#CD8B3E', 
                textAlign: 'center', 
                marginBottom: '0.5rem',
                fontSize: '1rem', 
                fontWeight: '600'
              }}>
                How can we help you today?
              </div>
              
              {/* FAQ Section */}
              <div style={{
                marginTop: '0.5rem'
              }}>
                <label style={{
                  fontSize: '0.85rem',
                  fontWeight: '600',
                  color: '#3F2E1E',
                  marginBottom: '0.5rem',
                  display: 'block'
                }}>
                  Frequently Asked Questions:
                </label>
                <select
                  onChange={(e) => {
                    if (e.target.value) {
                      handleFAQClick(e.target.value);
                      e.target.value = ''; // Reset dropdown after selection
                    }
                  }}
                  disabled={isLoading || !isOnline}
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    borderRadius: '8px',
                    border: '1.5px solid #e2cfa3',
                    background: '#FFF6E5',
                    color: '#3F2E1E',
                    fontSize: '0.85rem',
                    fontWeight: '500',
                    cursor: isLoading || !isOnline ? 'not-allowed' : 'pointer',
                    outline: 'none',
                    opacity: isLoading || !isOnline ? 0.6 : 1,
                    transition: 'all 0.2s ease',
                    appearance: 'none',
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23CD8B3E' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 1rem center',
                    paddingRight: '2.5rem'
                  }}
                  onMouseEnter={(e) => {
                    if (!isLoading && isOnline) {
                      e.target.style.background = '#f9f4e8';
                      e.target.style.borderColor = '#CD8B3E';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isLoading && isOnline) {
                      e.target.style.background = '#FFF6E5';
                      e.target.style.borderColor = '#e2cfa3';
                    }
                  }}
                  defaultValue=""
                >
                  <option value="" disabled>
                    Select a question...
                  </option>
                  {faqQuestions.map((question, index) => (
                    <option key={index} value={question}>
                      {question}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ) : (
            <>
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={msg.sender === 'user' ? 'user-bubble' : 'bot-bubble'}
                  style={msg.sender === 'bot' || msg.sender === 'system' ? {
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '10px'
                  } : {}}
                >
                  {msg.sender === 'user' ? (
                    msg.text
                  ) : (
                    <>
                      <img 
                        src="/images/chatbot-face.png" 
                        alt="Vici"
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          objectFit: 'cover',
                          objectPosition: 'center 30%',
                          border: '2px solid #CD8B3E',
                          flexShrink: 0,
                          marginTop: '2px'
                        }}
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                      <div style={{ flex: 1 }}>
                        {parseLinks(msg.text)}
                      </div>
                    </>
                  )}
                </div>
              ))}
              {isLoading && (
                <div className="bot-bubble genz-typing" style={{ 
                  borderRadius: '8px',
                  background: 'linear-gradient(135deg, #F7F3ED 0%, #FFEBC9 100%)',
                  border: '1px solid #CD8B3E',
                  padding: '8px 12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '0.95rem'
                }}>
                  <img 
                    src="/images/chatbot-face.png" 
                    alt="Vici is typing"
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      objectFit: 'cover',
                      objectPosition: 'center 30%',
                      border: '2px solid #CD8B3E',
                      animation: 'typing-pulse 1.5s infinite ease-in-out',
                      flexShrink: 0
                    }}
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                  <div style={{ display: 'flex', gap: '3px', alignItems: 'center' }}>
                    <div style={{ 
                      width: '4px', 
                      height: '4px', 
                      backgroundColor: '#B77B35', 
                      borderRadius: '50%',
                      animation: 'typing-dot 1.4s infinite ease-in-out'
                    }}></div>
                    <div style={{ 
                      width: '4px', 
                      height: '4px', 
                      backgroundColor: '#B77B35', 
                      borderRadius: '50%',
                      animation: 'typing-dot 1.4s infinite ease-in-out 0.2s'
                    }}></div>
                    <div style={{ 
                      width: '4px', 
                      height: '4px', 
                      backgroundColor: '#B77B35', 
                      borderRadius: '50%',
                      animation: 'typing-dot 1.4s infinite ease-in-out 0.4s'
                    }}></div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </>
          )}
        </main>
        <form className="chat-input genz-input" onSubmit={e => { e.preventDefault(); handleSendMessage({ type: 'click' }); }}>
          <input
            type="text"
            aria-label="Type your message"
            placeholder={isLoading ? 'Please wait...' : (!isOnline ? 'You are offline' : 'Type your message...')}
            value={inputMessage}
            onChange={e => setInputMessage(e.target.value)}
            onKeyDown={handleSendMessage}
            disabled={isLoading || !isOnline}
            style={{
              borderRadius: '16px',
              border: '1px solid #CD8B3E',
              background: '#ffffff',
              fontSize: '0.85rem'
            }}
          />
          <button
            type="submit"
            disabled={isLoading}
            aria-label="Send message"
            tabIndex={-1}
            style={{
              background: 'linear-gradient(135deg, #CD8B3E 0%, #B77B35 100%)',
              borderRadius: '16px',
              padding: '8px 12px',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: '0 2px 6px rgba(205, 139, 62, 0.3)',
              minWidth: '36px',
              height: '36px'
            }}
            onMouseOver={e => {
              if (!isLoading) {
                e.target.style.transform = 'translateY(-1px)';
                e.target.style.boxShadow = '0 3px 8px rgba(205, 139, 62, 0.4)';
              }
            }}
            onMouseOut={e => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 2px 6px rgba(205, 139, 62, 0.3)';
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="#fff" viewBox="0 0 24 24" width={20} height={20}>
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
            </svg>
          </button>
        </form>
        {/* Resize Handle */}
        <div
          ref={resizeHandleRef}
          className="chat-resize-handle"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '28px',
            height: '28px',
            cursor: 'nwse-resize',
            background: 'transparent',
            zIndex: 1002,
            opacity: 0.6,
            transition: 'opacity 0.2s ease',
            pointerEvents: 'auto',
            touchAction: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.opacity = '1';
          }}
          onMouseLeave={(e) => {
            if (!isResizingRef.current) {
              e.currentTarget.style.opacity = '0.6';
            }
          }}
          aria-label="Drag to resize chat window"
          role="button"
          tabIndex={0}
          title="Drag to resize"
        >
          {/* Resize indicator - corner arrows */}
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            style={{ pointerEvents: 'none' }}
          >
            {/* Top-left corner arrows */}
            <path
              d="M2 2L6 2M2 2L2 6"
              stroke="#ffffff"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <path
              d="M3 3L5 3M3 3L3 5"
              stroke="#ffffff"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
            <path
              d="M4 4L5 4M4 4L4 5"
              stroke="#ffffff"
              strokeWidth="1"
              strokeLinecap="round"
            />
          </svg>
        </div>
      </section>
    </>
  );
};

export default Chatbot;