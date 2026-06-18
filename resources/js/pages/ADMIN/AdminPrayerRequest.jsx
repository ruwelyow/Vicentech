import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../../utils/axios';
import '../../../css/Adminprayerrequest.css';
import { format } from 'date-fns';

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

// Modal Component
const PrayerRequestModal = ({ request, onClose }) => {
    if (!request) return null;
    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            zIndex: 1000,
            background: 'rgba(44, 44, 44, 0.25)',
            backdropFilter: 'blur(6px)',
            WebkitBackdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
        }} onClick={onClose}>
            <div style={{
                background: '#fff',
                borderRadius: 18,
                boxShadow: '0 8px 32px rgba(60,40,20,0.18)',
                padding: '2.5rem 2.5rem 2rem 2.5rem',
                minWidth: 340,
                maxWidth: 420,
                width: '90vw',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                gap: 18,
            }} onClick={e => e.stopPropagation()}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <h3 style={{ fontSize: 22, fontWeight: 700, color: '#3F2E1E', margin: 0 }}>
                        Prayer Request from <span style={{ color: '#CD8B3E' }}>{request.name}</span>
                    </h3>
                    <span className={`status-badge status-${request.status}`} style={{ fontSize: 15, fontWeight: 600 }}>{request.status}</span>
                </div>
                <div style={{ borderTop: '1.5px solid #f2e4ce', margin: '0 -2.5rem', marginBottom: 12 }} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {request.title && (
                        <div style={{ fontSize: 15 }}><span style={{ fontWeight: 600, color: '#3F2E1E' }}>Title:</span> <span>{request.title}</span></div>
                    )}
                    <div style={{ fontSize: 15 }}><span style={{ fontWeight: 600, color: '#3F2E1E' }}>Email:</span> <span>{request.email}</span></div>
                    <div style={{ fontSize: 15 }}><span style={{ fontWeight: 600, color: '#3F2E1E' }}>Phone:</span> <span>{request.phone || 'N/A'}</span></div>
                    <div style={{ fontSize: 15 }}><span style={{ fontWeight: 600, color: '#3F2E1E' }}>Received:</span> <span>{format(new Date(request.created_at), 'MMMM dd, yyyy, h:mm a')}</span></div>
                </div>
                <div style={{ borderTop: '1.5px solid #f2e4ce', margin: '0 -2.5rem', marginTop: 8, marginBottom: 8 }} />
                <div style={{ fontSize: 16, color: '#5C4B38', background: '#FFF6E5', borderRadius: 10, padding: '1rem', minHeight: 60 }}>
                    {request.request}
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
                    <button onClick={onClose} style={{ background: '#CD8B3E', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 32px', fontWeight: 700, fontSize: 16, cursor: 'pointer', boxShadow: '0 2px 8px rgba(205,139,62,0.10)', transition: 'background 0.2s' }}>Close</button>
                </div>
            </div>
        </div>
    );
};

const AdminPrayerRequest = () => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [filter, setFilter] = useState('all');
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [actionLoadingId, setActionLoadingId] = useState(null);
    const [actionType, setActionType] = useState(null);
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [rejectReason, setRejectReason] = useState('');
    const [rejectingRequest, setRejectingRequest] = useState(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deleteRequestId, setDeleteRequestId] = useState(null);
    const [page, setPage] = useState(1);
    const pageSize = 10;

    const fetchRequests = useCallback(async () => {
        console.log('fetchRequests called');
        try {
            setLoading(true);
            const response = await api.get('/prayer-requests');
            console.log('Prayer requests API response:', response.data); // Debug log
            // Defensive: ensure requests is always an array
            if (Array.isArray(response.data)) {
                setRequests(response.data);
            } else if (response.data && Array.isArray(response.data.data)) {
                setRequests(response.data.data);
            } else {
                setRequests([]);
            }
        } catch (err) {
            setError('Failed to fetch prayer requests.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchRequests();
    }, [fetchRequests]);

    const handleUpdateStatus = async (id, status, rejectionReason = null) => {
        setActionLoadingId(id);
        setActionType(status);
        try {
            const payload = { status };
            if (status === 'rejected' && rejectionReason) {
                payload.rejection_reason = rejectionReason;
            }
            await api.post(`/prayer-requests/${id}/status`, payload);
            await fetchRequests();
            window.dispatchEvent(new CustomEvent('prayerRequestUpdated'));
            showToast(`Prayer request ${status} successfully`, 'success');
        } catch (err) {
            showToast(`Failed to ${status} prayer request`, 'error');
            console.error(err);
        } finally {
            setActionLoadingId(null);
            setActionType(null);
        }
    };

    const handleRejectClick = (request) => {
        setRejectingRequest(request);
        setRejectReason('');
        setShowRejectModal(true);
    };

    const handleRejectConfirm = async () => {
        if (!rejectReason.trim()) {
            showToast('Please provide a reason for rejection', 'error');
            return;
        }
        
        await handleUpdateStatus(rejectingRequest.id, 'rejected', rejectReason);
        setShowRejectModal(false);
        setRejectingRequest(null);
        setRejectReason('');
    };
    
    const handleRowClick = async (request) => {
        setSelectedRequest(request);
        if (!request.is_read) {
            try {
                await api.post(`/prayer-requests/${request.id}/mark-as-read`);
                // Update the request locally instead of refetching all
                setRequests(prevRequests => prevRequests.map(r =>
                    r.id === request.id ? { ...r, is_read: true } : r
                ));
                window.dispatchEvent(new CustomEvent('prayerRequestUpdated'));
            } catch (err) {
                console.error("Failed to mark as read:", err);
            }
        }
    };

    const handleDelete = (id) => {
        setDeleteRequestId(id);
        setShowDeleteConfirm(true);
    };

    const confirmDelete = async () => {
        try {
            await api.delete(`/prayer-requests/${deleteRequestId}`);
            await fetchRequests();
        } catch (err) {
            alert('Failed to delete prayer request.');
            console.error(err);
        }
        setShowDeleteConfirm(false);
        setDeleteRequestId(null);
    };

    const cancelDelete = () => {
        setShowDeleteConfirm(false);
        setDeleteRequestId(null);
    };

    const filteredRequests = requests.filter(request => {
        if (filter === 'all') return true;
        return request.status === filter;
    });

    // Sort: pending first, then newest by created_at
    const sortedRequests = [...filteredRequests].sort((a, b) => {
        const ap = a.status === 'pending' ? 0 : 1;
        const bp = b.status === 'pending' ? 0 : 1;
        if (ap !== bp) return ap - bp;
        const ad = a.created_at ? new Date(a.created_at).getTime() : 0;
        const bd = b.created_at ? new Date(b.created_at).getTime() : 0;
        return bd - ad;
    });
    const lastPage = Math.max(1, Math.ceil(sortedRequests.length / pageSize));
    const paginatedRequests = sortedRequests.slice((page - 1) * pageSize, page * pageSize);

    if (loading) {
        return <div className="loading-users">Loading prayer requests...</div>;
    }

    if (error) {
        return <div className="error-message">{error}</div>;
    }

    return (
        <>
            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && (
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
                        <h3 style={{ color: '#3F2E1E', marginBottom: '1rem', fontSize: '1.25rem' }}>
                            Confirm Delete
                        </h3>
                        <p style={{ color: '#5C4B38', marginBottom: '2rem', lineHeight: 1.5 }}>
                            Are you sure you want to delete this prayer request? This action cannot be undone.
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
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmDelete}
                                style={{
                                    background: '#e74c3c',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: 8,
                                    padding: '0.75rem 1.5rem',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                }}
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="sacraments-container responsive-admin-users" style={{ maxWidth: '90%', width: '95%', minHeight: '100vh', padding: '1.5rem', margin: '0 auto' }}>
            <style>{`
                @media (max-width: 600px) {
                  .responsive-admin-users {
                    width: 95vw !important;
                    max-width: 100vw !important;
                    margin-left: auto !important;
                    margin-right: auto !important;
                    padding-left: 1rem !important;
                    padding-right: 1rem !important;
                  }
                }
                .loading-dots {
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    gap: 2px;
                    width: 18px;
                    height: 18px;
                }
                
                .loading-dots .dot {
                    width: 3px;
                    height: 3px;
                    background-color: white;
                    border-radius: 50%;
                    animation: pulse 1.4s ease-in-out infinite both;
                }
                
                .loading-dots .dot:nth-child(1) { animation-delay: -0.32s; }
                .loading-dots .dot:nth-child(2) { animation-delay: -0.16s; }
                .loading-dots .dot:nth-child(3) { animation-delay: 0s; }
                
                @keyframes pulse {
                    0%, 80%, 100% {
                        transform: scale(0.6);
                        opacity: 0.5;
                    }
                    40% {
                        transform: scale(1);
                        opacity: 1;
                    }
                }
            `}</style>
            {error && <div className="error-msg" style={{ whiteSpace: 'pre-line' }}>{error}</div>}

            <PrayerRequestModal request={selectedRequest} onClose={() => setSelectedRequest(null)} />

            <div className="sacraments-header" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center', width: '100%' }}>
                <h1 className="sacraments-title" style={{ fontSize: '2rem', width: '100%' }}>Manage Prayer Requests</h1>
                <div className="filter-bar" style={{ marginBottom: '1.5rem', display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center', background: '#fff', border: '1.5px solid #f2e4ce', borderRadius: '14px', boxShadow: '0 2px 8px rgba(60, 47, 30, 0.07)', padding: '1.2rem 2rem', width: '100%', minWidth: '400px' }}>
                    <label htmlFor="statusFilter" style={{ marginRight: '8px', fontWeight: 600, color: '#3F2E1E' }}>Filter by Status:</label>
                    <select id="statusFilter" value={filter} onChange={e => setFilter(e.target.value)} style={{ padding: '6px 12px', borderRadius: 6, border: '1.5px solid #e2cfa3', fontSize: 14, color: '#3F2E1E', background: '#fff', minWidth: 120 }}>
                        <option value="all">All</option>
                        <option value="pending">Pending</option>
                        <option value="approved">Approved</option>
                        <option value="rejected">Rejected</option>
                    </select>
                </div>
            </div>

            <div className="user-table-wrapper" style={{ background: 'white', borderRadius: '1rem', border: '1.5px solid #f2e4ce', boxShadow: '0 4px 12px rgba(60, 47, 30, 0.08)', overflow: 'hidden', marginTop: '1.5rem' }}>
                <div style={{ overflowX: 'auto', width: '100%' }}>
                    <table className="user-table responsive-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.95rem', minWidth: 500 }}>
                        <thead>
                            <tr style={{ background: '#f9f6f2' }}>
                                <th style={{ padding: '0.5rem', minWidth: 120 }}>Received</th>
                                <th style={{ padding: '0.5rem', minWidth: 120 }}>Name</th>
                                <th style={{ padding: '0.5rem', minWidth: 200 }}>Request</th>
                                <th style={{ padding: '0.5rem', minWidth: 80 }}>Status</th>
                                <th style={{ padding: '0.5rem', minWidth: 120 }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredRequests.length === 0 && (
                                <tr>
                                    <td colSpan={5} style={{ textAlign: 'center', padding: '1rem' }}>No prayer requests found.</td>
                                </tr>
                            )}
                            {filteredRequests.length > 0 && paginatedRequests.map(req => (
                                <tr key={req.id} onClick={() => handleRowClick(req)} className={`request-row ${!req.is_read ? 'unread' : ''}`} style={{ borderBottom: '1px solid #f2e4ce', cursor: 'pointer' }}>
                                    <td style={{ padding: '0.5rem' }}>{format(new Date(req.created_at), 'MMM dd, yyyy')}</td>
                                    <td style={{ padding: '0.5rem' }}>{req.name}</td>
                                    <td style={{ padding: '0.5rem', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{req.request}</td>
                                    <td style={{ padding: '0.5rem' }}>
                                        <span style={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            padding: '0.4rem 0.8rem',
                                            borderRadius: '12px',
                                            fontSize: '0.75rem',
                                            fontWeight: '600',
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.5px',
                                            border: '1px solid',
                                            background: req.status === 'approved' ? 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)' :
                                                      req.status === 'rejected' ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' :
                                                      'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                                            color: 'white',
                                            borderColor: req.status === 'approved' ? '#16a34a' :
                                                        req.status === 'rejected' ? '#dc2626' :
                                                        '#d97706',
                                            boxShadow: req.status === 'approved' ? '0 2px 8px rgba(34, 197, 94, 0.2)' :
                                                      req.status === 'rejected' ? '0 2px 8px rgba(239, 68, 68, 0.2)' :
                                                      '0 2px 8px rgba(245, 158, 11, 0.2)'
                                        }}>
                                            {req.status === 'approved' ? '✓ Approved' :
                                             req.status === 'rejected' ? '✕ Rejected' :
                                             '⏳ Pending'}
                                        </span>
                                    </td>
                                    <td style={{ padding: '0.5rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'flex-start' }}>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleUpdateStatus(req.id, 'approved'); }}
                                                disabled={req.status !== 'pending' || (actionLoadingId === req.id && actionType === 'approved')}
                                                aria-label="Approve"
                                                style={{
                                                    background: req.status === 'approved' ? 
                                                        'linear-gradient(135deg, #94a3b8 0%, #64748b 100%)' : 
                                                        'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                                                    color: 'white',
                                                    border: 'none',
                                                    borderRadius: '6px',
                                                    padding: '0.3rem',
                                                    cursor: req.status === 'approved' ? 'not-allowed' : 'pointer',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    transition: 'all 0.2s ease',
                                                    boxShadow: req.status === 'approved' ? 
                                                        '0 2px 8px rgba(148, 163, 184, 0.2)' : 
                                                        '0 2px 8px rgba(34, 197, 94, 0.2)',
                                                    minWidth: '28px',
                                                    minHeight: '28px',
                                                    opacity: req.status === 'approved' ? 0.6 : 1
                                                }}
                                                onMouseEnter={(e) => {
                                                    if (req.status !== 'approved') {
                                                        e.target.style.transform = 'translateY(-1px)';
                                                        e.target.style.boxShadow = '0 4px 12px rgba(34, 197, 94, 0.3)';
                                                    }
                                                }}
                                                onMouseLeave={(e) => {
                                                    if (req.status !== 'approved') {
                                                        e.target.style.transform = 'translateY(0)';
                                                        e.target.style.boxShadow = '0 2px 8px rgba(34, 197, 94, 0.2)';
                                                    }
                                                }}
                                            >
                                                {actionLoadingId === req.id && actionType === 'approved' ? (
                                                    <div className="loading-dots">
                                                        <div className="dot"></div>
                                                        <div className="dot"></div>
                                                        <div className="dot"></div>
                                                    </div>
                                                ) : (
                                                    <svg width="14" height="14" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                        <path d="M5 10.5L9 14.5L15 7.5" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
                                                    </svg>
                                                )}
                                            </button>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleRejectClick(req); }}
                                                disabled={req.status !== 'pending' || (actionLoadingId === req.id && actionType === 'rejected')}
                                                aria-label="Reject"
                                                style={{
                                                    background: req.status === 'rejected' ? 
                                                        'linear-gradient(135deg, #94a3b8 0%, #64748b 100%)' : 
                                                        'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                                                    color: 'white',
                                                    border: 'none',
                                                    borderRadius: '6px',
                                                    padding: '0.3rem',
                                                    cursor: req.status === 'rejected' ? 'not-allowed' : 'pointer',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    transition: 'all 0.2s ease',
                                                    boxShadow: req.status === 'rejected' ? 
                                                        '0 2px 8px rgba(148, 163, 184, 0.2)' : 
                                                        '0 2px 8px rgba(239, 68, 68, 0.2)',
                                                    minWidth: '28px',
                                                    minHeight: '28px',
                                                    opacity: req.status === 'rejected' ? 0.6 : 1
                                                }}
                                                onMouseEnter={(e) => {
                                                    if (req.status !== 'rejected') {
                                                        e.target.style.transform = 'translateY(-1px)';
                                                        e.target.style.boxShadow = '0 4px 12px rgba(239, 68, 68, 0.3)';
                                                    }
                                                }}
                                                onMouseLeave={(e) => {
                                                    if (req.status !== 'rejected') {
                                                        e.target.style.transform = 'translateY(0)';
                                                        e.target.style.boxShadow = '0 2px 8px rgba(239, 68, 68, 0.2)';
                                                    }
                                                }}
                                            >
                                                {actionLoadingId === req.id && actionType === 'rejected' ? (
                                                    <div className="loading-dots">
                                                        <div className="dot"></div>
                                                        <div className="dot"></div>
                                                        <div className="dot"></div>
                                                    </div>
                                                ) : (
                                                    <svg width="14" height="14" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                        <path d="M6 6L14 14M14 6L6 14" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
                                                    </svg>
                                                )}
                                            </button>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleDelete(req.id); }}
                                                aria-label="Delete"
                                                style={{
                                                    background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                                                    color: 'white',
                                                    border: 'none',
                                                    borderRadius: '6px',
                                                    padding: '0.3rem 0.5rem',
                                                    cursor: 'pointer',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    gap: '0.2rem',
                                                    transition: 'all 0.2s ease',
                                                    boxShadow: '0 2px 8px rgba(239, 68, 68, 0.2)',
                                                    fontSize: '0.7rem',
                                                    fontWeight: '600',
                                                    minHeight: '28px'
                                                }}
                                                onMouseEnter={(e) => {
                                                    e.target.style.transform = 'translateY(-1px)';
                                                    e.target.style.boxShadow = '0 4px 12px rgba(239, 68, 68, 0.3)';
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.target.style.transform = 'translateY(0)';
                                                    e.target.style.boxShadow = '0 2px 8px rgba(239, 68, 68, 0.2)';
                                                }}
                                            >
                                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                                Delete
                                            </button>
                                        </div>
                                    </td>
                                    </tr>
                            ))}
                        </tbody>
                    </table>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', justifyContent: 'flex-end', padding: '0.75rem' }}>
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page <= 1}
              style={{ padding: '0.4rem 0.8rem', borderRadius: 6, border: '1px solid #e2cfa3', background: page <= 1 ? '#f5f5f5' : '#fff', color: '#3F2E1E' }}
            >Prev</button>
            <span style={{ fontSize: '0.9rem', color: '#3F2E1E' }}>Page {page} of {lastPage}</span>
            <button
              onClick={() => setPage(p => Math.min(lastPage, p + 1))}
              disabled={page >= lastPage}
              style={{ padding: '0.4rem 0.8rem', borderRadius: 6, border: '1px solid #e2cfa3', background: page >= lastPage ? '#f5f5f5' : '#fff', color: '#3F2E1E' }}
            >Next</button>
          </div>
                </div>
            </div>

            {/* Rejection Reason Modal */}
            {showRejectModal && rejectingRequest && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0,0,0,0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000,
                }} onClick={() => setShowRejectModal(false)}>
                    <div style={{
                        background: '#fff',
                        borderRadius: 12,
                        padding: '2rem',
                        minWidth: 400,
                        maxWidth: 500,
                        width: '90vw',
                        position: 'relative',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 16,
                    }} onClick={e => e.stopPropagation()}>
                        <h2 style={{ fontSize: 22, fontWeight: 700, color: '#3F2E1E', margin: 0 }}>
                            Reject Prayer Request
                        </h2>
                        <p style={{ fontSize: 16, color: '#5C4B38', margin: 0 }}>
                            Please provide a reason for rejecting <strong>{rejectingRequest.name}</strong>'s prayer request:
                        </p>
                        <textarea
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                            placeholder="Enter rejection reason..."
                            style={{
                                width: '100%',
                                minHeight: 100,
                                padding: 12,
                                border: '2px solid #f2e4ce',
                                borderRadius: 8,
                                fontSize: 14,
                                fontFamily: 'inherit',
                                resize: 'vertical',
                                outline: 'none',
                                transition: 'border-color 0.2s',
                            }}
                            onFocus={(e) => e.target.style.borderColor = '#CD8B3E'}
                            onBlur={(e) => e.target.style.borderColor = '#f2e4ce'}
                        />
                        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 8 }}>
                            <button
                                style={{
                                    background: '#e74c3c',
                                    color: '#fff',
                                    border: 'none',
                                    borderRadius: 8,
                                    padding: '10px 24px',
                                    fontWeight: 700,
                                    fontSize: 14,
                                    cursor: 'pointer',
                                    transition: 'background 0.2s'
                                }}
                                onClick={handleRejectConfirm}
                                disabled={actionLoadingId === rejectingRequest?.id}
                            >
                                {actionLoadingId === rejectingRequest?.id ? 'Rejecting...' : 'Reject Request'}
                            </button>
                            <button
                                style={{
                                    background: '#fff',
                                    color: '#CD8B3E',
                                    border: '2px solid #CD8B3E',
                                    borderRadius: 8,
                                    padding: '10px 24px',
                                    fontWeight: 700,
                                    fontSize: 14,
                                    cursor: 'pointer',
                                    transition: 'background 0.2s, color 0.2s'
                                }}
                                onClick={() => setShowRejectModal(false)}
                                disabled={actionLoadingId === rejectingRequest?.id}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {selectedRequest && (
                <PrayerRequestModal 
                    request={selectedRequest} 
                    onClose={() => setSelectedRequest(null)} 
                />
            )}
        </div>
        </>
    );
};

export default AdminPrayerRequest; 