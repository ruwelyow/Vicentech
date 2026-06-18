import React, { useEffect } from 'react';
import ReactDOM from 'react-dom';

const SuccessPopup = ({ 
  isOpen, 
  onClose, 
  title = "Success!", 
  message = "Operation completed successfully",
  duration = 3000 
}) => {
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [isOpen, onClose, duration]);

  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <div className="success-popup-overlay">
      <div className="success-popup-container">
        <div className="success-popup-content">
          <div className="success-popup-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 12l2 2 4-4"/>
              <circle cx="12" cy="12" r="10"/>
            </svg>
          </div>
          <div className="success-popup-text">
            <h3 className="success-popup-title">{title}</h3>
            <p className="success-popup-message">{message}</p>
          </div>
          <button className="success-popup-close" onClick={onClose}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default SuccessPopup;
