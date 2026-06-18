import React, { useState, useEffect } from 'react';
import '../../../css/staffCertificates.css';
import { api } from '../../utils/axios';
import { useNavigate } from 'react-router-dom';

const showToast = (msg, type = 'success') => {
    const toast = document.createElement('div');
    toast.textContent = msg;
    toast.className = `toast toast-${type}`;
    Object.assign(toast.style, {
        position: 'fixed',
        top: '24px',
        right: '24px',
        background: type === 'success' ? '#22c55e' : '#ef4444',
        color: '#fff',
        padding: '12px 24px',
        borderRadius: '8px',
        fontWeight: 'bold',
        zIndex: 9999,
        boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
        fontSize: '1rem',
        opacity: 0.95,
    });
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2500);
};

const StaffCertificates = () => {
  const navigate = useNavigate();
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCertificate, setSelectedCertificate] = useState(null);
  const [actionLoading, setActionLoading] = useState({}); // { [id]: 'approve' | 'reject' | null }
  const [popup, setPopup] = useState({ show: false, message: '', type: 'success' });
  const [rejectingId, setRejectingId] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [isRejectingCertificate, setIsRejectingCertificate] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showDeleteWarning, setShowDeleteWarning] = useState(false);
  const [deleteCertificateId, setDeleteCertificateId] = useState(null);
  const [releasingId, setReleasingId] = useState(null);
  const [releasedIds, setReleasedIds] = useState(new Set()); // Track released certificate IDs
  const [page, setPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    setLoading(true);
    api.get('/certificate-requests')
      .then(res => setCertificates(Array.isArray(res.data) ? res.data : []))
      .catch(() => setCertificates([]))
      .finally(() => setLoading(false));
  }, []);

  const handleApprove = async (id) => {
    setActionLoading(prev => ({ ...prev, [id]: 'approve' }));
    try {
      const res = await api.patch(`/certificate-requests/${id}`, { status: 'approved' });
      setCertificates(certs => certs.map(cert => cert.id === id ? res.data : cert));
      setPopup({ show: true, message: 'Certificate request approved!', type: 'success' });
    } catch (error) {
      setPopup({ show: true, message: 'Failed to approve request.', type: 'error' });
    } finally {
      setActionLoading(prev => ({ ...prev, [id]: null }));
    }
  };


  const openRejectModal = (certificate) => {
    setRejectingId(certificate.id);
    setRejectReason('');
    setShowRejectModal(true);
  };

  const handleRejectConfirm = async () => {
    if (!rejectingId) return;
    setIsRejectingCertificate(true);
    try {
      const res = await api.patch(`/certificate-requests/${rejectingId}`, { 
        status: 'rejected', 
        rejection_reason: rejectReason 
      });
      setCertificates(certs => certs.map(cert => cert.id === rejectingId ? res.data : cert));
      showToast('Certificate request rejected and applicant notified.', 'error');
    } catch (error) {
      showToast('Failed to reject request.', 'error');
    } finally {
      setIsRejectingCertificate(false);
      setShowRejectModal(false);
      setRejectingId(null);
      setRejectReason('');
    }
  };

  const handleDelete = (id) => {
    setDeleteCertificateId(id);
    setShowDeleteWarning(true); // First warning popup
  };

  // First warning - proceed to second confirmation
  const proceedToConfirmDelete = () => {
    setShowDeleteWarning(false);
    setShowDeleteConfirm(true); // Second confirmation popup
  };

  // Cancel first warning
  const cancelDeleteWarning = () => {
    setShowDeleteWarning(false);
    setDeleteCertificateId(null);
  };

  // Final confirmation - actually delete
  const confirmDelete = async () => {
    if (!deleteCertificateId) return;
    try {
      await api.delete(`/certificate-requests/${deleteCertificateId}`);
      setCertificates(certs => certs.filter(cert => cert.id !== deleteCertificateId));
      showToast('Certificate request deleted successfully!', 'success');
    } catch (error) {
      console.error('Delete error:', error);
      showToast('Failed to delete certificate request.', 'error');
    } finally {
      setShowDeleteConfirm(false);
      setDeleteCertificateId(null);
    }
  };

  // Cancel final confirmation
  const cancelDelete = () => {
    setShowDeleteConfirm(false);
    setDeleteCertificateId(null);
  };

  const handleRelease = async (id) => {
    // Don't allow releasing if already released
    if (releasedIds.has(id)) {
      return;
    }
    
    setReleasingId(id);
    setActionLoading(prev => ({ ...prev, [id]: 'release' }));
    try {
      const res = await api.post(`/certificate-requests/${id}/release`);
      // Mark as released after successful release
      setReleasedIds(prev => new Set(prev).add(id));
      showToast('Certificate ready notification sent to requestor!', 'success');
    } catch (error) {
      showToast('Failed to send notification.', 'error');
    } finally {
      setActionLoading(prev => ({ ...prev, [id]: null }));
      setReleasingId(null);
    }
  };

  const handleViewDetails = (certificate) => {
    setSelectedCertificate(certificate);
  };

  const closeModal = () => {
    setSelectedCertificate(null);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) return <div className="loading-users" style={{ textAlign: 'left' }}>Loading certificate requests...</div>;

  return (
    <div className="certificates-container">
      {/* Popup Modal Notification */}
      {popup.show && (
        <div className="popup-modal">
          <div className="popup-content">
            <h2 className="popup-title">{popup.type === 'success' ? 'Success' : 'Notification'}</h2>
            <p className="popup-message">{popup.message}</p>
            <button className="popup-close" onClick={() => setPopup({ ...popup, show: false })}>Close</button>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div style={{ 
          position: 'fixed', 
          inset: 0, 
          background: 'rgba(0,0,0,0.4)', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          zIndex: 2000 
        }}>
          <div style={{ 
            width: 560, 
            maxWidth: '94%', 
            background: '#fff', 
            borderRadius: 12, 
            padding: 20, 
            boxShadow: '0 8px 30px rgba(0,0,0,0.2)' 
          }}>
            <h3 style={{ marginTop: 0, color: '#3F2E1E' }}>Reject Certificate Request</h3>
            <p style={{ color: '#5C4B38' }}>
              Provide a reason for rejecting this certificate request. The applicant will receive an email with this message.
            </p>
            <textarea
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              placeholder="Reason for rejection"
              style={{ 
                width: '100%', 
                minHeight: 120, 
                padding: 12, 
                borderRadius: 8, 
                border: '1px solid #f2e4ce', 
                marginTop: 12,
                resize: 'vertical'
              }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
              <button 
                onClick={() => { 
                  setShowRejectModal(false); 
                  setRejectingId(null); 
                  setRejectReason(''); 
                }} 
                style={{ 
                  background: '#fff', 
                  border: '1px solid #d1d5db', 
                  padding: '8px 14px', 
                  borderRadius: 8,
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button 
                onClick={handleRejectConfirm} 
                disabled={isRejectingCertificate || !rejectReason.trim()} 
                style={{ 
                  background: isRejectingCertificate ? '#ef4444aa' : '#ef4444', 
                  color: '#fff', 
                  border: 'none', 
                  padding: '8px 14px', 
                  borderRadius: 8,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: isRejectingCertificate || !rejectReason.trim() ? 'not-allowed' : 'pointer'
                }}
              >
                {isRejectingCertificate ? (
                  <>
                    <span className="btn-spinner"></span>
                    Sending...
                  </>
                ) : (
                  'Send Rejection'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="certificates-header">
        <h1 className="certificates-title">Certificate Requests</h1>
        <button
          onClick={() => navigate('/staff/parish-records')}
          className="records-btn"
          style={{
            background: '#806c4b',
            color: 'white',
            border: 'none',
            borderRadius: '25px',
            padding: '0.7rem 1.8rem',
            fontSize: '0.95rem',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            boxShadow: '0 2px 4px rgba(205, 139, 62, 0.2)'
          }}
        >
          📋 Parish Records
        </button>
      </div>

      {/* Stats Summary */}
      <div className="stats-grid">
        <div className="stat-card">
          <h3 className="stat-label">Total Requests</h3>
          <p className="stat-value total">{certificates.length}</p>
        </div>
        <div className="stat-card">
          <h3 className="stat-label">Pending</h3>
          <p className="stat-value pending">
            {certificates.filter(cert => cert.status === 'pending').length}
          </p>
        </div>
        <div className="stat-card">
          <h3 className="stat-label">Approved</h3>
          <p className="stat-value completed">
            {certificates.filter(cert => cert.status === 'approved').length}
          </p>
        </div>
        <div className="stat-card">
          <h3 className="stat-label">Completed</h3>
          <p className="stat-value completed">
            {certificates.filter(cert => cert.status === 'completed').length}
          </p>
        </div>
      </div>

      {/* Certificates Table */}
      <div className="certificates-table-container">
        <div className="table-wrapper">
          <table className="certificates-table">
            <thead>
              <tr>
                <th>Type</th>
                <th>Certificate Recipient / Requestor</th>
                <th className="hide-mobile">Date Requested</th>
                <th className="hide-tablet">Purpose</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {certificates.length > 0 ? (
                (([...certificates].sort((a,b) => {
                  const aPending = a.status === 'pending' ? 0 : 1;
                  const bPending = b.status === 'pending' ? 0 : 1;
                  if (aPending !== bPending) return aPending - bPending; // pending first
                  const aDate = a.created_at ? new Date(a.created_at).getTime() : 0;
                  const bDate = b.created_at ? new Date(b.created_at).getTime() : 0;
                  return bDate - aDate; // newest first
                })).slice((page - 1) * pageSize, page * pageSize)).map((certificate) => (
                  <tr key={certificate.id}
                    className="certificate-row"
                    onClick={e => {
                      if (e.target.closest('.action-btn')) return;
                      handleViewDetails(certificate);
                    }}
                  >
                    <td>
                      <div className="certificate-type">{certificate.certificate_type}</div>
                    </td>
                    <td>
                      <div className="requestor-info">
                        <div className="requestor-name">
                          {certificate.first_name} {certificate.last_name}
                          {/* Show "Request for Others" label if requester exists but no recipient_user_id */}
                          {certificate.requester_id && !certificate.recipient_user_id && (
                            <span style={{
                              display: 'inline-block',
                              marginLeft: '0.5rem',
                              fontSize: '0.75rem',
                              color: '#dc2626',
                              fontWeight: '600',
                              background: '#fee2e2',
                              padding: '0.125rem 0.5rem',
                              borderRadius: '4px',
                              border: '1px solid #fecaca'
                            }}>
                              (Request for Others)
                            </span>
                          )}
                          {/* Show "Requested by Family Member" if recipient_user_id exists */}
                          {(certificate.recipient || certificate.recipient_user_id) && (
                            <span style={{
                              display: 'inline-block',
                              marginLeft: '0.5rem',
                              fontSize: '0.75rem',
                              color: '#806c4b',
                              fontWeight: '600',
                              background: '#FFF6E5',
                              padding: '0.125rem 0.5rem',
                              borderRadius: '4px',
                              border: '1px solid #f2e4ce'
                            }}>
                              (Requested by {certificate.requester?.name || 'Family Member'})
                            </span>
                          )}
                        </div>
                        {/* Show requester info for "Request for Others" */}
                        {certificate.requester_id && !certificate.recipient_user_id && certificate.requester && (
                          <div style={{
                            fontSize: '0.75rem',
                            color: '#5C4B38',
                            marginTop: '0.25rem',
                            fontStyle: 'italic'
                          }}>
                            Requested by: {certificate.requester.name}
                          </div>
                        )}
                        {/* Show recipient info for family member requests */}
                        {(certificate.recipient || certificate.recipient_user_id) && (
                          <div style={{
                            fontSize: '0.75rem',
                            color: '#5C4B38',
                            marginTop: '0.25rem',
                            fontStyle: 'italic'
                          }}>
                            Certificate for: {certificate.recipient?.name || certificate.first_name + ' ' + certificate.last_name}
                            {certificate.recipient && certificate.recipient.name !== (certificate.first_name + ' ' + certificate.last_name) && (
                              <span style={{ color: '#806c4b', marginLeft: '0.25rem' }}>
                                (Requested by family member)
                              </span>
                            )}
                          </div>
                        )}
                        <div className="show-mobile date-requested">
                          Req: {certificate.created_at ? new Date(certificate.created_at).toLocaleDateString() : ''}
                        </div>
                        <div className="show-tablet purpose-mobile">
                          Purpose: {certificate.purpose}
                        </div>
                      </div>
                    </td>
                    <td className="hide-mobile">
                      {certificate.created_at ? new Date(certificate.created_at).toLocaleDateString() : ''}
                    </td>
                    <td className="hide-tablet">{certificate.purpose}</td>
                    <td>
                      <span className={`status-badge ${certificate.status}`}>
                        {certificate.status.charAt(0).toUpperCase() + certificate.status.slice(1)}
                      </span>
                    </td>
                    <td>
                      <div className="table-actions">
                        <button
                          title="Approve"
                          onClick={e => { e.stopPropagation(); handleApprove(certificate.id); }}
                          disabled={certificate.status !== 'pending' || actionLoading[certificate.id]}
                          aria-label="Approve"
                          style={{
                            background: (certificate.status !== 'pending') ?
                              'linear-gradient(135deg, #94a3b8 0%, #64748b 100%)' :
                              'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '6px',
                            padding: '0.3rem 0.6rem',
                            cursor: (certificate.status !== 'pending') ? 'not-allowed' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.2s ease',
                            boxShadow: (certificate.status !== 'pending') ?
                              '0 2px 8px rgba(148, 163, 184, 0.2)' :
                              '0 2px 8px rgba(34, 197, 94, 0.2)',
                            minWidth: '36px',
                            minHeight: '28px',
                            opacity: (certificate.status !== 'pending') ? 0.6 : 1
                          }}
                          onMouseEnter={e => {
                            if (certificate.status === 'pending') {
                              e.currentTarget.style.transform = 'translateY(-1px)';
                              e.currentTarget.style.boxShadow = '0 4px 12px rgba(34, 197, 94, 0.3)';
                            }
                          }}
                          onMouseLeave={e => {
                            if (certificate.status === 'pending') {
                              e.currentTarget.style.transform = 'translateY(0)';
                              e.currentTarget.style.boxShadow = '0 2px 8px rgba(34, 197, 94, 0.2)';
                            }
                          }}
                        >
                          {actionLoading[certificate.id] === 'approve' ? (
                            <span className="btn-spinner"></span>
                          ) : (
                            <>
                              <span className="action-text-full">Approve</span>
                              <span className="action-text-short">✓</span>
                            </>
                          )}
                        </button>
                        <button
                          title="Reject"
                          onClick={e => { e.stopPropagation(); openRejectModal(certificate); }}
                          disabled={certificate.status !== 'pending' || actionLoading[certificate.id]}
                          aria-label="Reject"
                          style={{
                            background: (certificate.status !== 'pending') ?
                              'linear-gradient(135deg, #94a3b8 0%, #64748b 100%)' :
                              'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '6px',
                            padding: '0.3rem 0.6rem',
                            cursor: (certificate.status !== 'pending') ? 'not-allowed' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.2s ease',
                            boxShadow: (certificate.status !== 'pending') ?
                              '0 2px 8px rgba(148, 163, 184, 0.2)' :
                              '0 2px 8px rgba(239, 68, 68, 0.2)',
                            minWidth: '36px',
                            minHeight: '28px',
                            opacity: (certificate.status !== 'pending') ? 0.6 : 1
                          }}
                          onMouseEnter={e => {
                            if (certificate.status === 'pending') {
                              e.currentTarget.style.transform = 'translateY(-1px)';
                              e.currentTarget.style.boxShadow = '0 4px 12px rgba(239, 68, 68, 0.3)';
                            }
                          }}
                          onMouseLeave={e => {
                            if (certificate.status === 'pending') {
                              e.currentTarget.style.transform = 'translateY(0)';
                              e.currentTarget.style.boxShadow = '0 2px 8px rgba(239, 68, 68, 0.2)';
                            }
                          }}
                        >
                          <span className="action-text-full">Reject</span>
                          <span className="action-text-short">✗</span>
                        </button>
                        <button
                          title={releasedIds.has(certificate.id) ? "Released" : "Release"}
                          onClick={e => { e.stopPropagation(); handleRelease(certificate.id); }}
                          disabled={certificate.status === 'rejected' || actionLoading[certificate.id] === 'release' || releasedIds.has(certificate.id)}
                          aria-label={releasedIds.has(certificate.id) ? "Released" : "Release"}
                          style={{
                            background: (certificate.status === 'rejected' || actionLoading[certificate.id] === 'release' || releasedIds.has(certificate.id)) ?
                              'linear-gradient(135deg, #94a3b8 0%, #64748b 100%)' :
                              'linear-gradient(135deg, #806c4b 0%, #6b5a3f 100%)',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '6px',
                            padding: '0.3rem 0.6rem',
                            cursor: (certificate.status === 'rejected' || actionLoading[certificate.id] === 'release' || releasedIds.has(certificate.id)) ? 'not-allowed' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.2s ease',
                            boxShadow: (certificate.status === 'rejected' || actionLoading[certificate.id] === 'release' || releasedIds.has(certificate.id)) ?
                              '0 2px 8px rgba(148, 163, 184, 0.2)' :
                              '0 2px 8px rgba(205, 139, 62, 0.2)',
                            minWidth: '36px',
                            minHeight: '28px',
                            opacity: (certificate.status === 'rejected' || actionLoading[certificate.id] === 'release' || releasedIds.has(certificate.id)) ? 0.6 : 1
                          }}
                          onMouseEnter={e => {
                            if (certificate.status !== 'rejected' && actionLoading[certificate.id] !== 'release' && !releasedIds.has(certificate.id)) {
                              e.currentTarget.style.transform = 'translateY(-1px)';
                              e.currentTarget.style.boxShadow = '0 4px 12px rgba(205, 139, 62, 0.3)';
                            }
                          }}
                          onMouseLeave={e => {
                            if (certificate.status !== 'rejected' && actionLoading[certificate.id] !== 'release' && !releasedIds.has(certificate.id)) {
                              e.currentTarget.style.transform = 'translateY(0)';
                              e.currentTarget.style.boxShadow = '0 2px 8px rgba(205, 139, 62, 0.2)';
                            }
                          }}
                        >
                          {actionLoading[certificate.id] === 'release' ? (
                            <span className="btn-spinner"></span>
                          ) : releasedIds.has(certificate.id) ? (
                            <>
                              <span className="action-text-full">Released</span>
                              <span className="action-text-short">✓</span>
                            </>
                          ) : (
                            <>
                              <span className="action-text-full">Release</span>
                              <span className="action-text-short">📤</span>
                            </>
                          )}
                        </button>
                        <button
                          className="action-btn delete-btn"
                          title="Delete"
                          onClick={e => { e.stopPropagation(); handleDelete(certificate.id); }}
                          aria-label="Delete"
                          disabled={certificate.status === 'completed'}
                        >
                          <span className="action-text-full">Delete</span>
                          <span className="action-text-short">🗑</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6">
                    <div className="empty-state">
                      <div className="empty-icon">📋</div>
                      <p className="empty-title">No certificate requests found</p>
                      <p className="empty-subtitle">New requests will appear here when submitted</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', justifyContent: 'flex-end', padding: '0.75rem' }}>
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page <= 1}
              style={{ padding: '0.4rem 0.8rem', borderRadius: 6, border: '1px solid #e2cfa3', background: page <= 1 ? '#f5f5f5' : '#fff', color: '#3F2E1E' }}
            >Prev</button>
            <span style={{ fontSize: '0.9rem', color: '#3F2E1E' }}>Page {page} of {Math.max(1, Math.ceil(certificates.length / pageSize))}</span>
            <button
              onClick={() => setPage(p => Math.min(Math.max(1, Math.ceil(certificates.length / pageSize)), p + 1))}
              disabled={page >= Math.max(1, Math.ceil(certificates.length / pageSize))}
              style={{ padding: '0.4rem 0.8rem', borderRadius: 6, border: '1px solid #e2cfa3', background: page >= Math.max(1, Math.ceil(certificates.length / pageSize)) ? '#f5f5f5' : '#fff', color: '#3F2E1E' }}
            >Next</button>
          </div>
        </div>
      </div>

      {/* First Warning Modal */}
      {showDeleteWarning && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(0,0,0,0.5)',
          zIndex: 10000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <div style={{
            background: 'white',
            borderRadius: 12,
            padding: '2rem',
            maxWidth: 400,
            width: '90%',
            textAlign: 'center',
            boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
          }}>
            <div style={{
              fontSize: '3rem',
              marginBottom: '1rem'
            }}>
              ⚠️
            </div>
            <h3 style={{ color: '#3F2E1E', marginBottom: '1rem', fontSize: '1.25rem', fontWeight: 'bold' }}>
              Warning: Delete Certificate Request
            </h3>
            <p style={{ color: '#5C4B38', marginBottom: '2rem', lineHeight: 1.5 }}>
              You are about to delete this certificate request. This action cannot be undone. Are you sure you want to proceed?
            </p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button
                onClick={cancelDeleteWarning}
                style={{
                  background: '#f8f9fa',
                  color: '#6c757d',
                  border: '1px solid #dee2e6',
                  borderRadius: 8,
                  padding: '0.75rem 1.5rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#e9ecef'}
                onMouseLeave={(e) => e.currentTarget.style.background = '#f8f9fa'}
              >
                Cancel
              </button>
              <button
                onClick={proceedToConfirmDelete}
                style={{
                  background: '#f59e0b',
                  color: 'white',
                  border: 'none',
                  borderRadius: 8,
                  padding: '0.75rem 1.5rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#d97706'}
                onMouseLeave={(e) => e.currentTarget.style.background = '#f59e0b'}
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Second Confirmation Modal */}
      {showDeleteConfirm && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(0,0,0,0.5)',
          zIndex: 10001,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <div style={{
            background: 'white',
            borderRadius: 12,
            padding: '2rem',
            maxWidth: 400,
            width: '90%',
            textAlign: 'center',
            boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
          }}>
            <div style={{
              fontSize: '3rem',
              marginBottom: '1rem'
            }}>
              🗑️
            </div>
            <h3 style={{ color: '#dc2626', marginBottom: '1rem', fontSize: '1.25rem', fontWeight: 'bold' }}>
              Final Confirmation
            </h3>
            <p style={{ color: '#5C4B38', marginBottom: '2rem', lineHeight: 1.5 }}>
              This is your last chance to cancel. Are you absolutely sure you want to permanently delete this certificate request? This action cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button
                onClick={cancelDelete}
                style={{
                  background: '#f8f9fa',
                  color: '#6c757d',
                  border: '1px solid #dee2e6',
                  borderRadius: 8,
                  padding: '0.75rem 1.5rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#e9ecef'}
                onMouseLeave={(e) => e.currentTarget.style.background = '#f8f9fa'}
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                style={{
                  background: '#dc2626',
                  color: 'white',
                  border: 'none',
                  borderRadius: 8,
                  padding: '0.75rem 1.5rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#b91c1c'}
                onMouseLeave={(e) => e.currentTarget.style.background = '#dc2626'}
              >
                Yes, Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal for certificate details */}
      {selectedCertificate && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <button 
              onClick={closeModal} 
              className="modal-close"
            >
              &times;
            </button>
            <h2 className="modal-title">Certificate Request Details</h2>
            <div className="modal-divider" />
            <div className="modal-details">
              <div className="detail-row">
                <strong>Type:</strong> {selectedCertificate.certificate_type}
              </div>
              {/* Show "Request for Others" section */}
              {selectedCertificate.requester_id && !selectedCertificate.recipient_user_id ? (
                <>
                  <div className="detail-row" style={{
                    background: '#fee2e2',
                    padding: '0.75rem',
                    borderRadius: '8px',
                    border: '1px solid #fecaca',
                    marginBottom: '0.5rem'
                  }}>
                    <strong style={{ color: '#dc2626' }}>📋 Request for Others</strong>
                  </div>
                  <div className="detail-row">
                    <strong>Certificate Recipient:</strong> {selectedCertificate.first_name} {selectedCertificate.last_name}
                  </div>
                  <div className="detail-row">
                    <strong>Requested By:</strong> {selectedCertificate.requester?.name || 'User'}
                  </div>
                  <div className="detail-row">
                    <strong>Requester Email:</strong> {selectedCertificate.email} <span style={{ fontSize: '0.875rem', color: '#5C4B38', fontStyle: 'italic' }}>(Contact for notifications)</span>
                  </div>
                  <div className="detail-row">
                    <strong>Requester Phone:</strong> {selectedCertificate.phone} <span style={{ fontSize: '0.875rem', color: '#5C4B38', fontStyle: 'italic' }}>(Contact for notifications)</span>
                  </div>
                </>
              ) : (selectedCertificate.recipient || selectedCertificate.recipient_user_id) ? (
                <>
                  <div className="detail-row" style={{
                    background: '#FFF6E5',
                    padding: '0.75rem',
                    borderRadius: '8px',
                    border: '1px solid #f2e4ce',
                    marginBottom: '0.5rem'
                  }}>
                    <strong style={{ color: '#806c4b' }}>📋 Requested for Family Member</strong>
                  </div>
                  <div className="detail-row">
                    <strong>Certificate For:</strong> {selectedCertificate.recipient?.name || `${selectedCertificate.first_name} ${selectedCertificate.last_name}`}
                    {selectedCertificate.recipient && selectedCertificate.recipient.name !== `${selectedCertificate.first_name} ${selectedCertificate.last_name}` && (
                      <span style={{ color: '#5C4B38', marginLeft: '0.5rem' }}>
                        (Name on certificate: {selectedCertificate.first_name} {selectedCertificate.last_name})
                      </span>
                    )}
                  </div>
                  <div className="detail-row">
                    <strong>Requested By:</strong> {selectedCertificate.requester?.name || (selectedCertificate.requester_id ? 'Family Member' : 'N/A')}
                  </div>
                  <div className="detail-row">
                    <strong>Requester Email:</strong> {selectedCertificate.email} <span style={{ fontSize: '0.875rem', color: '#5C4B38', fontStyle: 'italic' }}>(Contact for notifications)</span>
                  </div>
                  <div className="detail-row">
                    <strong>Requester Phone:</strong> {selectedCertificate.phone} <span style={{ fontSize: '0.875rem', color: '#5C4B38', fontStyle: 'italic' }}>(Contact for notifications)</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="detail-row">
                    <strong>Requestor:</strong> {selectedCertificate.first_name} {selectedCertificate.last_name}
                  </div>
                  <div className="detail-row">
                    <strong>Email:</strong> {selectedCertificate.email}
                  </div>
                  <div className="detail-row">
                    <strong>Phone:</strong> {selectedCertificate.phone}
                  </div>
                </>
              )}
              <div className="detail-row">
                <strong>Date Requested:</strong> {selectedCertificate.created_at ? new Date(selectedCertificate.created_at).toLocaleDateString() : ''}
              </div>
              <div className="detail-row">
                <strong>Status:</strong> 
                <span className={`status-badge ${selectedCertificate.status}`} style={{ marginLeft: '8px' }}>
                  {selectedCertificate.status.charAt(0).toUpperCase() + selectedCertificate.status.slice(1)}
                </span>
              </div>
              <div className="detail-row">
                <strong>Address:</strong> {selectedCertificate.address}
              </div>
              <div className="detail-row">
                <strong>Purpose:</strong> {selectedCertificate.purpose}
              </div>
              <div className="detail-row">
                <strong>Date Needed:</strong> {selectedCertificate.date_needed ? new Date(selectedCertificate.date_needed).toLocaleDateString() : selectedCertificate.dateNeeded}
              </div>
              {selectedCertificate.additional_info && (
                <div className="detail-row">
                  <strong>Additional Info:</strong> {selectedCertificate.additional_info}
                </div>
              )}
            </div>
            <div className="modal-divider" />
            <div className="modal-actions">
              <button 
                onClick={closeModal} 
                className="modal-btn primary"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffCertificates; 