import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';

const GlobalSacramentRequirementsModal = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [notificationData, setNotificationData] = useState(null);

  // Listen for the global event to open the modal
  useEffect(() => {
    const handleOpenRequirementsModal = (event) => {
      const { detail: data } = event;
      setNotificationData(data);
      setModalOpen(true);
    };

    window.addEventListener('openSacramentRequirementsModal', handleOpenRequirementsModal);
    
    return () => {
      window.removeEventListener('openSacramentRequirementsModal', handleOpenRequirementsModal);
    };
  }, []);

  // Don't render anything if modal is not open
  if (!modalOpen || !notificationData) {
    return null;
  }

  return ReactDOM.createPortal(
    <div className="invite-modal-overlay" onClick={() => {
      setModalOpen(false);
      setNotificationData(null);
    }}>
      <div className="invite-modal" style={{padding: '2rem', maxWidth: '600px', width: '90vw'}} onClick={e => e.stopPropagation()}>
        <button 
          className="invite-modal-close" 
          onClick={() => {
            setModalOpen(false);
            setNotificationData(null);
          }}
        >
          ×
        </button>
        
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-[#FFEBC9] rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-[#CD8B3E]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-[#3F2E1E] mb-2">Required Documents & Requirements</h2>
          <p className="text-[#5C4B38]">
            For your <strong>{notificationData.sacrament_type || 'Sacrament'}</strong> appointment
          </p>
          {notificationData.appointment_date && (
            <p className="text-sm text-[#5C4B38] mt-2">
              Scheduled for: {new Date(notificationData.appointment_date).toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>
          )}
        </div>

        {/* Requirements List */}
        <div style={{
          background: '#FFF6E5',
          border: '2px solid #f2e4ce',
          borderRadius: '12px',
          padding: '1.5rem',
          marginBottom: '1.5rem',
          borderLeft: '4px solid #CD8B3E'
        }}>
          <h3 style={{ color: '#3F2E1E', marginBottom: '1rem', fontSize: '1.1rem', fontWeight: '600' }}>
            📋 Required Documents:
          </h3>
          <ul style={{ paddingLeft: '20px', margin: 0, color: '#3F2E1E' }}>
            {notificationData.requirements && notificationData.requirements.length > 0 ? (
              notificationData.requirements.map((requirement, index) => (
                <li key={index} style={{ marginBottom: '0.75rem', lineHeight: '1.6' }}>
                  {requirement}
                </li>
              ))
            ) : (
              <li style={{ color: '#5C4B38' }}>No specific requirements listed. Please contact the parish office for details.</li>
            )}
          </ul>
        </div>

        {/* Important Reminders */}
        <div style={{
          background: '#f0f8ff',
          border: '2px solid #e0f2fe',
          borderRadius: '12px',
          padding: '1rem',
          marginBottom: '1.5rem',
          borderLeft: '4px solid #4a90e2'
        }}>
          <h4 style={{ color: '#3F2E1E', marginBottom: '0.75rem', fontSize: '1rem', fontWeight: '600' }}>
            📝 Important Reminders:
          </h4>
          <ul style={{ paddingLeft: '20px', margin: 0, color: '#5C4B38', fontSize: '0.9rem', lineHeight: '1.8' }}>
            <li>Please arrive <strong>15 minutes before</strong> your scheduled time</li>
            <li>Bring all required documents listed above</li>
            <li>If you need to make changes, contact the parish office immediately</li>
            <li>Dress appropriately for the sacred ceremony</li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
          <button
            onClick={() => {
              setModalOpen(false);
              setNotificationData(null);
              window.location.href = '/appoint';
            }}
            style={{
              background: '#fff',
              border: '2px solid #CD8B3E',
              color: '#CD8B3E',
              padding: '0.75rem 1.5rem',
              borderRadius: '8px',
              fontWeight: '600',
              fontSize: '0.875rem',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = '#FFEBC9';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = '#fff';
            }}
          >
            View Appointments
          </button>
          <button
            onClick={() => {
              setModalOpen(false);
              setNotificationData(null);
            }}
            style={{
              background: '#CD8B3E',
              border: 'none',
              color: 'white',
              padding: '0.75rem 1.5rem',
              borderRadius: '8px',
              fontWeight: '600',
              fontSize: '0.875rem',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = '#B77B35';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = '#CD8B3E';
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default GlobalSacramentRequirementsModal;

