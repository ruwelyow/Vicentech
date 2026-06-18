import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { api } from '../utils/axios';

const GlobalFamilyInvitationModal = () => {
  const [invitationModalOpen, setInvitationModalOpen] = useState(false);
  const [selectedInvite, setSelectedInvite] = useState(null);
  const [loading, setLoading] = useState(false);

  // Handle accepting invitation
  const handleAcceptInvite = async (invite) => {
    setLoading(true);
    try {
      const invitationId = invite.invitation_id;
      if (!invitationId) {
        console.error("Failed to find invitation ID in notification payload:", invite);
        alert("Could not process invitation. ID is missing.");
        return;
      }
      await api.post(`/family-invitations/${invitationId}/respond`, { status: 'accepted' });
      setInvitationModalOpen(false);
      setSelectedInvite(null);
      // Refresh the page to update family information
      window.location.reload();
    } catch (err) {
      const errorMessage = err.response?.data?.error || err.response?.data?.message || err.message || 'Failed to accept invitation';
      console.error('Error accepting invitation:', err.response?.data || err);
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Handle rejecting invitation
  const handleRejectInvite = async (invite) => {
    setLoading(true);
    try {
      const invitationId = invite.invitation_id;
      if (!invitationId) {
        console.error("Failed to find invitation ID in notification payload:", invite);
        alert("Could not process invitation. ID is missing.");
        return;
      }
      await api.post(`/family-invitations/${invitationId}/respond`, { status: 'rejected' });
      setInvitationModalOpen(false);
      setSelectedInvite(null);
    } catch (err) {
      const errorMessage = err.response?.data?.error || err.response?.data?.message || err.message || 'Failed to reject invitation';
      console.error('Error rejecting invitation:', err.response?.data || err);
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Listen for the global event to open the modal
  useEffect(() => {
    const handleOpenInviteModal = (event) => {
      const { detail: invite } = event;
      setSelectedInvite(invite);
      setInvitationModalOpen(true);
    };

    window.addEventListener('openFamilyInviteModal', handleOpenInviteModal);
    
    return () => {
      window.removeEventListener('openFamilyInviteModal', handleOpenInviteModal);
    };
  }, []);

  // Don't render anything if modal is not open
  if (!invitationModalOpen || !selectedInvite) {
    return null;
  }

  return ReactDOM.createPortal(
    <div className="invite-modal-overlay" onClick={() => setInvitationModalOpen(false)}>
      <div className="invite-modal" style={{padding: '2rem'}} onClick={e => e.stopPropagation()}>
        <button 
          className="invite-modal-close" 
          onClick={() => {
            setInvitationModalOpen(false);
            setSelectedInvite(null);
          }}
        >
          ×
        </button>
        <h2 className="text-2xl font-bold text-center mb-4 text-[#3F2E1E]">Family Invitation</h2>
        <p className="text-center mb-6 text-[#5C4B38]">
          You have received a <b>{selectedInvite.relationship}</b> invitation from <b>{selectedInvite.inviter_name || selectedInvite.inviter?.name}</b>.
        </p>
        
        {/* Important Notice */}
        <div style={{
          background: '#FFF6E5',
          border: '2px solid #f2e4ce',
          borderRadius: '12px',
          padding: '1rem',
          marginBottom: '1.5rem',
          borderLeft: '4px solid #CD8B3E'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.75rem'
          }}>
            <div style={{
              color: '#CD8B3E',
              fontSize: '1.25rem',
              fontWeight: 'bold',
              marginTop: '0.125rem'
            }}>
              ⚠️
            </div>
            <div>
              <h4 style={{
                color: '#3F2E1E',
                fontWeight: '600',
                fontSize: '0.95rem',
                marginBottom: '0.5rem',
                margin: 0
              }}>
                Important Notice
              </h4>
              {/* Check if user is a family head - show different message */}
              {(() => {
                const user = JSON.parse(localStorage.getItem('user') || '{}');
                const isFamilyHead = user.is_family_head && user.family_id;
                
                if (isFamilyHead) {
                  return (
                    <>
                      <p style={{
                        color: '#5C4B38',
                        fontSize: '0.875rem',
                        lineHeight: '1.4',
                        margin: '0 0 0.5rem 0',
                        fontWeight: '600'
                      }}>
                        You are a family head with your own family group.
                      </p>
                      <p style={{
                        color: '#5C4B38',
                        fontSize: '0.875rem',
                        lineHeight: '1.4',
                        margin: 0
                      }}>
                        By accepting this invitation, you will be linked to <b>{selectedInvite.inviter_name || selectedInvite.inviter?.name}'s</b> family as a <b>{selectedInvite.relationship}</b>. 
                        You will <b>keep your primary family</b> (where you are the head) and be connected to their family via relationship records.
                      </p>
                    </>
                  );
                }
                
                return (
                  <>
                    <p style={{
                      color: '#5C4B38',
                      fontSize: '0.875rem',
                      lineHeight: '1.4',
                      margin: 0
                    }}>
                      By accepting this invitation, you acknowledge that <b>{selectedInvite.inviter_name || selectedInvite.inviter?.name}</b> (as the family head) 
                      will have the ability to:
                    </p>
                    <ul style={{
                      color: '#5C4B38',
                      fontSize: '0.875rem',
                      lineHeight: '1.4',
                      margin: '0.5rem 0 0 0',
                      paddingLeft: '1.25rem'
                    }}>
                      <li>View and edit your family-related information (name, phone, address, etc.)</li>
                      <li>Manage your relationship details and family group settings</li>
                      <li>Remove you from the family group if needed</li>
                      <li>Transfer family head status to you or other members</li>
                    </ul>
                    <p style={{
                      color: '#5C4B38',
                      fontSize: '0.8rem',
                      lineHeight: '1.3',
                      margin: '0.75rem 0 0 0',
                      fontStyle: 'italic'
                    }}>
                      Note: You can leave the family group at any time from your profile settings.
                    </p>
                  </>
                );
              })()}
            </div>
          </div>
        </div>
        <div className="flex justify-center gap-4">
          <button
            className="family-invite-accept-btn"
            onClick={() => handleAcceptInvite(selectedInvite)}
            disabled={loading}
            style={{
              background: loading ? '#ccc' : '#10b981',
              color: 'white',
              padding: '0.75rem 1.5rem',
              borderRadius: '8px',
              border: 'none',
              fontWeight: '600',
              fontSize: '0.875rem',
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <span className="btn-icon" aria-hidden="true">✔</span> 
            {loading ? 'Processing...' : 'Accept'}
          </button>
          <button
            className="family-invite-reject-btn"
            onClick={() => handleRejectInvite(selectedInvite)}
            disabled={loading}
            style={{
              background: loading ? '#ccc' : '#ef4444',
              color: 'white',
              padding: '0.75rem 1.5rem',
              borderRadius: '8px',
              border: 'none',
              fontWeight: '600',
              fontSize: '0.875rem',
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <span className="btn-icon" aria-hidden="true">✖</span> 
            {loading ? 'Processing...' : 'Reject'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default GlobalFamilyInvitationModal;

