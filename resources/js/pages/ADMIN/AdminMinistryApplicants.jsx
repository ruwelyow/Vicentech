import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../../utils/axios';
import '../../../css/AdminMinistryApplicants.css';

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

const AdminMinistryApplicants = () => {
    const [applicants, setApplicants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [filter, setFilter] = useState('all');
    const [pendingCount, setPendingCount] = useState(0);
    const [selectedApplicant, setSelectedApplicant] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [serverTypes, setServerTypes] = useState([]);
    const [serverTypesLoading, setServerTypesLoading] = useState(true);
    const [serverTypesError, setServerTypesError] = useState('');
    const [serverTypeSaving, setServerTypeSaving] = useState(false);
    const [newServerType, setNewServerType] = useState('');
    const [addTypeLoading, setAddTypeLoading] = useState(false);
    const [showServerTypes, setShowServerTypes] = useState(false);
    const [deletingId, setDeletingId] = useState(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [actionLoadingId, setActionLoadingId] = useState(null);
    const [actionType, setActionType] = useState(null);
    const [actionTarget, setActionTarget] = useState(null);
    const [showActionConfirm, setShowActionConfirm] = useState(false);
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [rejectReason, setRejectReason] = useState('');
    const [rejectingApplicant, setRejectingApplicant] = useState(null);
    const [showDeleteServerTypeConfirm, setShowDeleteServerTypeConfirm] = useState(false);
    const [serverTypeToDelete, setServerTypeToDelete] = useState(null);
    const [appPage, setAppPage] = useState(1);
    const applicantsPerPage = 10;

    const fetchApplicants = useCallback(async () => {
        setLoading(true);
        try {
            const params = filter === 'all' ? {} : { status: filter };
            const response = await api.get('/admin/ministry-applicants', { params });
            setApplicants(response.data);
            setError('');
        } catch (err) {
            setError('Failed to fetch applicants. Please try again later.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [filter]);

    const fetchPendingCount = useCallback(async () => {
        try {
            const response = await api.get('/admin/ministry-applicants-pending-count');
            setPendingCount(response.data.pending);
        } catch (err) {
            setPendingCount(0);
        }
    }, []);

    const fetchServerTypes = async () => {
        setServerTypesLoading(true);
        try {
            const response = await api.get('/admin/server-types');
            setServerTypes(Array.isArray(response.data) ? response.data : []);
            setServerTypesError('');
        } catch (err) {
            setServerTypesError('Failed to fetch server types.');
        } finally {
            setServerTypesLoading(false);
        }
    };

    useEffect(() => {
        fetchApplicants();
    }, [fetchApplicants]);

    useEffect(() => {
        fetchPendingCount();
    }, [fetchPendingCount, applicants]);

    useEffect(() => {
        fetchServerTypes();
    }, []);

    const handleUpdateStatus = async (id, status, rejectionReason = null) => {
        setActionLoadingId(id);
        setActionType(status);
        try {
            console.log("Updating status to:", status);
            const payload = { status };
            if (status === 'rejected' && rejectionReason) {
                payload.rejection_reason = rejectionReason;
            }
            await api.patch(`/admin/ministry-applicants/${id}`, payload);
            fetchApplicants(); // Refresh the list
            fetchPendingCount(); // Refresh the badge
            showToast(`Application ${status} successfully`, 'success');
        } catch (err) {
            setError(`Failed to ${status} application. Please try again.`);
            console.error(err);
            showToast(`Failed to ${status} application`, 'error');
        } finally {
            setActionLoadingId(null);
            setActionType(null);
        }
    };

    const handleRejectClick = (applicant) => {
        setRejectingApplicant(applicant);
        setRejectReason('');
        setShowRejectModal(true);
    };

    const handleRejectConfirm = async () => {
        if (!rejectReason.trim()) {
            showToast('Please provide a reason for rejection', 'error');
            return;
        }
        
        await handleUpdateStatus(rejectingApplicant.id, 'rejected', rejectReason);
        setShowRejectModal(false);
        setRejectingApplicant(null);
        setRejectReason('');
    };

    const handleViewDetails = async (id) => {
        try {
            const response = await api.get(`/admin/ministry-applicants/${id}`);
            setSelectedApplicant(response.data);
            setShowModal(true);
            // Notify sidebar to update badge if marked as read
            window.dispatchEvent(new Event('ministryApplicantUpdated'));
        } catch (err) {
            setError('Failed to load applicant details.');
        }
    };

    const handleDeleteServerType = (id, name) => {
        setServerTypeToDelete({ id, name });
        setShowDeleteServerTypeConfirm(true);
    };

    const confirmDeleteServerType = async () => {
        if (!serverTypeToDelete) return;
        setServerTypeSaving(true);
        try {
            await api.delete(`/admin/server-types/${serverTypeToDelete.id}`);
            fetchServerTypes();
            showToast('Server type deleted', 'success');
            setShowDeleteServerTypeConfirm(false);
            setServerTypeToDelete(null);
        } catch (err) {
            setServerTypesError('Failed to delete server type.');
            showToast('Failed to delete server type', 'error');
        } finally {
            setServerTypeSaving(false);
        }
    };

    const cancelDeleteServerType = () => {
        setShowDeleteServerTypeConfirm(false);
        setServerTypeToDelete(null);
    };

    const handleToggleServerType = async (id, enabled, name) => {
        const action = enabled ? 'disable' : 'enable';
        if (!window.confirm(`Are you sure you want to ${action} "${name}"?`)) return;
        setServerTypeSaving(true);
        try {
            await api.patch(`/admin/server-types/${id}`, { enabled: !enabled });
            fetchServerTypes();
            showToast(`Server type ${action}d`, 'success');
        } catch (err) {
            setServerTypesError(`Failed to ${action} server type.`);
            showToast(`Failed to ${action} server type`, 'error');
        } finally {
            setServerTypeSaving(false);
        }
    };

    const handleAddServerType = async (e) => {
        e.preventDefault();
        if (!newServerType.trim()) return;
        setAddTypeLoading(true);
        try {
            await api.post('/admin/server-types', { name: newServerType });
            setNewServerType('');
            fetchServerTypes();
            showToast('Server type added successfully', 'success');
        } catch (err) {
            console.error('Error adding server type:', err);
            if (err.response?.status === 422) {
                const errors = err.response.data.errors;
                if (errors?.name) {
                    setServerTypesError(`Validation error: ${errors.name[0]}`);
                } else {
                    setServerTypesError('Validation error occurred. Please check your input.');
                }
            } else if (err.response?.status === 401) {
                setServerTypesError('You are not authenticated. Please log in again.');
            } else if (err.response?.status === 403) {
                setServerTypesError('You do not have permission to perform this action.');
            } else {
                setServerTypesError('Failed to add server type.');
            }
        } finally {
            setAddTypeLoading(false);
        }
    };

    const handleDeleteClick = (applicant) => {
        setDeleteTarget(applicant);
        setShowDeleteConfirm(true);
    };

    const handleConfirmDelete = async () => {
        setDeletingId(deleteTarget.id);
        try {
            await api.delete(`/admin/ministry-applicants/${deleteTarget.id}`);
            // Remove from UI
            setApplicants(applicants.filter(app => app.id !== deleteTarget.id));
            setShowDeleteConfirm(false);
            setDeleteTarget(null);
        } catch (err) {
            alert('Failed to delete applicant.');
        } finally {
            setDeletingId(null);
        }
    };

    const cancelDelete = () => {
        setShowDeleteConfirm(false);
        setDeleteTarget(null);
    };

    const filteredApplicants = Array.isArray(applicants)
        ? applicants
        : [];
    // Sort: pending first, then newest by created_at
    const sortedApplicants = [...filteredApplicants].sort((a, b) => {
        const ap = a.status === 'pending' ? 0 : 1;
        const bp = b.status === 'pending' ? 0 : 1;
        if (ap !== bp) return ap - bp;
        const ad = a.created_at ? new Date(a.created_at).getTime() : 0;
        const bd = b.created_at ? new Date(b.created_at).getTime() : 0;
        return bd - ad;
    });
    const appLastPage = Math.max(1, Math.ceil(sortedApplicants.length / applicantsPerPage));
    const paginatedApplicants = sortedApplicants.slice((appPage - 1) * applicantsPerPage, appPage * applicantsPerPage);

    if (loading && !showServerTypes) return <div className="loading-users">Loading applicants...</div>;

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
                            Are you sure you want to delete this ministry applicant? This action cannot be undone.
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
                                onClick={handleConfirmDelete}
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

            {/* Delete Server Type Confirmation Modal */}
            {showDeleteServerTypeConfirm && serverTypeToDelete && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '100vw',
                    height: '100vh',
                    background: 'rgba(0,0,0,0.5)',
                    backdropFilter: 'blur(4px)',
                    zIndex: 3500,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}>
                    <div style={{
                        background: 'white',
                        borderRadius: 16,
                        padding: '2rem',
                        maxWidth: 450,
                        width: '90%',
                        textAlign: 'center',
                        boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
                        border: '1.5px solid #f2e4ce',
                    }}>
                        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚠️</div>
                        <h3 style={{ color: '#3F2E1E', marginBottom: '1rem', fontSize: '1.5rem', fontWeight: 700 }}>
                            Delete Server Type
                        </h3>
                        <p style={{ color: '#5C4B38', marginBottom: '2rem', lineHeight: 1.6, fontSize: '1rem' }}>
                            Are you sure you want to delete <strong style={{ color: '#3F2E1E' }}>"{serverTypeToDelete.name}"</strong>?
                            <br />
                            <span style={{ fontSize: '0.9rem', color: '#8B7355' }}>This action cannot be undone.</span>
                        </p>
                        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                            <button
                                onClick={cancelDeleteServerType}
                                disabled={serverTypeSaving}
                                style={{
                                    background: '#eee',
                                    color: '#666',
                                    border: 'none',
                                    borderRadius: 8,
                                    padding: '0.75rem 1.5rem',
                                    fontWeight: 700,
                                    fontSize: '1rem',
                                    cursor: serverTypeSaving ? 'not-allowed' : 'pointer',
                                    transition: 'all 0.2s',
                                    opacity: serverTypeSaving ? 0.6 : 1,
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmDeleteServerType}
                                disabled={serverTypeSaving}
                                style={{
                                    background: '#ef4444',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: 8,
                                    padding: '0.75rem 1.5rem',
                                    fontWeight: 700,
                                    fontSize: '1rem',
                                    cursor: serverTypeSaving ? 'not-allowed' : 'pointer',
                                    transition: 'all 0.2s',
                                    opacity: serverTypeSaving ? 0.7 : 1,
                                }}
                            >
                                {serverTypeSaving ? 'Deleting...' : 'Delete Server Type'}
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

            {showServerTypes && (
                <button
                    onClick={() => setShowServerTypes(false)}
                    style={{
                        position: 'relative',
                        left: 0,
                        marginBottom: 16,
                        background: '#fff',
                        color: '#CD8B3E',
                        border: '2px solid #CD8B3E',
                        borderRadius: 8,
                        padding: '8px 24px',
                        fontWeight: 700,
                        fontSize: 16,
                        boxShadow: '0 2px 8px rgba(205,139,62,0.06)',
                        cursor: 'pointer',
                        transition: 'background 0.2s, color 0.2s',
                        display: 'inline-block',
                    }}
                    onMouseOver={e => { e.target.style.background = '#CD8B3E'; e.target.style.color = '#fff'; }}
                    onMouseOut={e => { e.target.style.background = '#fff'; e.target.style.color = '#CD8B3E'; }}
                >
                    ← Back
                </button>
            )}
            <style>{`
                .requests-table tbody tr {
                    border-bottom: 1px solid #f2e4ce;
                    transition: background 0.15s;
                }
                .requests-table tbody td {
                    border-bottom: none;
                }
                .requests-table tbody tr:hover {
                    background: #f9f6f1;
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
            {!showServerTypes && (
                <div className="sacraments-header" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center', width: '100%' }}>
                    <h1 className="sacraments-title" style={{ fontSize: '2rem', width: '100%' }}>Manage Ministry Applicants</h1>
                    <div className="filter-bar" style={{
                        marginBottom: '1.5rem',
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '1rem',
                        alignItems: 'center',
                        background: '#fff',
                        border: '1.5px solid #f2e4ce',
                        borderRadius: '14px',
                        boxShadow: '0 2px 8px rgba(60, 47, 30, 0.07)',
                        padding: '0.7rem 1.2rem',
                        maxWidth: '1200px',
                        marginLeft: 'auto',
                        marginRight: 'auto',
                        width: '100%',
                        boxSizing: 'border-box'
                    }}>
                        <label htmlFor="statusFilter" style={{ marginRight: '8px', fontWeight: 600, color: '#3F2E1E' }}>Filter by Status:</label>
                        <select id="statusFilter" value={filter} onChange={e => setFilter(e.target.value)} style={{ padding: '6px 12px', borderRadius: 6, border: '1.5px solid #e2cfa3', fontSize: 14, color: '#3F2E1E', background: '#fff', minWidth: 120 }}>
                            <option value="all">All</option>
                            <option value="pending">Pending</option>
                            <option value="approved">Approved</option>
                            <option value="rejected">Rejected</option>
                        </select>
                        <button
                            onClick={() => setShowServerTypes(true)}
                            style={{
                                minHeight: 44,
                                fontWeight: 600,
                                fontSize: '0.95rem',
                                borderRadius: '0.5rem',
                                boxShadow: '0 2px 4px rgba(205, 139, 62, 0.1)',
                                background: '#CD8B3E',
                                color: 'white',
                                padding: '0.625rem 1rem',
                                border: 'none',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: '100%',
                                maxWidth: 180,
                                cursor: 'pointer',
                                transition: 'all 0.3s ease'
                            }}
                        >
                            Manage Server Types
                        </button>
                    </div>
                </div>
            )}
                {/* Server Types Management Section */}
                {showServerTypes && (
                    <div>
                        <div style={{ width: '100%', maxWidth: 700, margin: '0 auto', padding: 32 }}>
                            <h1 style={{ marginBottom: 18, textAlign: 'center', fontSize: '2rem', color: '#3F2E1E', fontWeight: 700 }}>Manage Ministry Server Types</h1>
                            <form onSubmit={handleAddServerType} style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
                                <input
                                    type="text"
                                    value={newServerType}
                                    onChange={e => setNewServerType(e.target.value)}
                                    placeholder="Add new server type"
                                    style={{ flex: 1, padding: 12, borderRadius: 8, border: '1.5px solid #f2e4ce', fontSize: '1rem', background: '#FFF6E5', color: '#3F2E1E' }}
                                    disabled={addTypeLoading}
                                />
                                <button
                                    type="submit"
                                    disabled={addTypeLoading || !newServerType.trim()}
                                    style={{ background: '#CD8B3E', color: '#fff', border: 'none', borderRadius: 8, padding: '12px 32px', fontWeight: 700, fontSize: 16, cursor: 'pointer', boxShadow: '0 2px 8px rgba(205,139,62,0.10)', transition: 'background 0.2s' }}
                                >
                                    {addTypeLoading ? 'Adding...' : 'Add'}
                                </button>
                            </form>
                            {serverTypesError && <div className="text-red-600 mb-2" style={{ textAlign: 'center' }}>{serverTypesError}</div>}
                            {serverTypesLoading ? (
                                <div style={{ textAlign: 'center' }}>Loading server types...</div>
                            ) : (
                                <table className="server-types-table" style={{ width: '100%', borderCollapse: 'collapse', background: '#fff', borderRadius: 12, overflow: 'hidden', boxShadow: '0 2px 12px rgba(205,139,62,0.07)' }}>
                                    <thead>
                                        <tr style={{ background: '#FFF6E5', color: '#3F2E1E', fontWeight: 700, fontSize: 17 }}>
                                            <th style={{ padding: '16px 12px', borderBottom: '2px solid #f2e4ce', textAlign: 'left', letterSpacing: 1 }}>Type</th>
                                            <th style={{ padding: '16px 12px', borderBottom: '2px solid #f2e4ce', textAlign: 'center', letterSpacing: 1 }}>Enabled</th>
                                            <th style={{ padding: '16px 12px', borderBottom: '2px solid #f2e4ce', textAlign: 'center', letterSpacing: 1 }}>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {Array.isArray(serverTypes) && serverTypes.map(type => (
                                            <tr key={type.id} style={{ borderBottom: '1px solid #f2e4ce', transition: 'background 0.15s' }}>
                                                <td style={{ padding: '14px 12px', color: '#3F2E1E', fontWeight: 600 }}>{type.name}</td>
                                                <td style={{ textAlign: 'center', fontWeight: 'bold', padding: '14px 12px' }}>
                                                    {type.enabled ? (
                                                        <span style={{ color: '#22c55e', fontWeight: 700, fontSize: 15 }}>Enabled</span>
                                                    ) : (
                                                        <span style={{ color: '#aaa', fontWeight: 700, fontSize: 15 }}>Disabled</span>
                                                    )}
                                                </td>
                                                <td style={{ textAlign: 'center', padding: '14px 12px' }}>
                                                    <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                                                        <button
                                                            onClick={() => handleToggleServerType(type.id, type.enabled, type.name)}
                                                            disabled={serverTypeSaving}
                                                            style={{ background: type.enabled ? '#eab308' : '#22c55e', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 28px', fontWeight: 700, fontSize: 15, cursor: 'pointer', boxShadow: '0 2px 8px rgba(205,139,62,0.10)', transition: 'background 0.2s' }}
                                                        >
                                                            {type.enabled ? 'Disable' : 'Enable'}
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteServerType(type.id, type.name)}
                                                            disabled={serverTypeSaving}
                                                            style={{ background: '#e74c3c', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 28px', fontWeight: 700, fontSize: 15, cursor: 'pointer', boxShadow: '0 2px 8px rgba(205,139,62,0.10)', transition: 'background 0.2s' }}
                                                        >
                                                            Delete
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                )}
                {/* Main Applicants Section (hidden when managing server types) */}
                {!showServerTypes && (
                    <>
                        {error && <p className="admin-error">{error}</p>}
                            <div className="user-table-wrapper" style={{ background: 'white', borderRadius: '1rem', border: '1.5px solid #f2e4ce', boxShadow: '0 4px 12px rgba(60, 47, 30, 0.08)', overflow: 'hidden', marginTop: '1.5rem' }}>
                                <div style={{ overflowX: 'auto', width: '100%' }}>
                                    <table className="user-table responsive-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.95rem', minWidth: 500 }}>
                                        <thead>
                                            <tr style={{ background: '#f9f6f2' }}>
                                                <th style={{ padding: '0.5rem', minWidth: 120 }}>Name</th>
                                                <th style={{ padding: '0.5rem', minWidth: 120 }}>Contact</th>
                                                <th style={{ padding: '0.5rem', minWidth: 120 }}>Ministry</th>
                                                <th style={{ padding: '0.5rem', minWidth: 120 }}>Applied At</th>
                                                <th style={{ padding: '0.5rem', minWidth: 80 }}>Status</th>
                                                <th style={{ padding: '0.5rem', minWidth: 120 }}>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredApplicants.length === 0 && (
                                                <tr>
                                                    <td colSpan={6} style={{ textAlign: 'center', padding: '1rem' }}>No ministry applicants found.</td>
                                                </tr>
                                            )}
                                            {filteredApplicants.length > 0 && paginatedApplicants.map(applicant => (
                                                <tr key={applicant.id} style={{ borderBottom: '1px solid #f2e4ce', cursor: 'pointer' }}
                                                    onClick={e => {
                                                        if (e.target.closest('.action-buttons')) return;
                                                        handleViewDetails(applicant.id);
                                                    }}
                                                >
                                                    <td style={{ padding: '0.5rem' }}>{applicant.first_name} {applicant.last_name}</td>
                                                    <td style={{ padding: '0.5rem' }}>
                                                        <div>{applicant.email}</div>
                                                        <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>{applicant.phone}</div>
                                                    </td>
                                                    <td style={{ padding: '0.5rem' }}>{applicant.server_type ?? 'N/A'}</td>
                                                    <td style={{ padding: '0.5rem' }}>{new Date(applicant.created_at).toLocaleDateString()}</td>
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
                                                            background: applicant.status === 'approved' ? 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)' :
                                                                      applicant.status === 'rejected' ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' :
                                                                      'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                                                            color: 'white',
                                                            borderColor: applicant.status === 'approved' ? '#16a34a' :
                                                                        applicant.status === 'rejected' ? '#dc2626' :
                                                                        '#d97706',
                                                            boxShadow: applicant.status === 'approved' ? '0 2px 8px rgba(34, 197, 94, 0.2)' :
                                                                      applicant.status === 'rejected' ? '0 2px 8px rgba(239, 68, 68, 0.2)' :
                                                                      '0 2px 8px rgba(245, 158, 11, 0.2)'
                                                        }}>
                                                            {applicant.status === 'approved' ? '✓ Approved' :
                                                             applicant.status === 'rejected' ? '✕ Rejected' :
                                                             '⏳ Pending'}
                                                        </span>
                                                    </td>
                                                    <td style={{ padding: '0.5rem' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'flex-start' }}>
                                                            <button
                                                                onClick={() => handleUpdateStatus(applicant.id, "approved")}
                                                                title="Approve"
                                                                disabled={applicant.status !== 'pending' || (actionLoadingId === applicant.id && actionType === 'approved')}
                                                                aria-label="Approve"
                                                                style={{
                                                                    background: applicant.status === 'approved' ? 
                                                                        'linear-gradient(135deg, #94a3b8 0%, #64748b 100%)' : 
                                                                        'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                                                                    color: 'white',
                                                                    border: 'none',
                                                                    borderRadius: '6px',
                                                                    padding: '0.3rem',
                                                                    cursor: applicant.status === 'approved' ? 'not-allowed' : 'pointer',
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    justifyContent: 'center',
                                                                    transition: 'all 0.2s ease',
                                                                    boxShadow: applicant.status === 'approved' ? 
                                                                        '0 2px 8px rgba(148, 163, 184, 0.2)' : 
                                                                        '0 2px 8px rgba(34, 197, 94, 0.2)',
                                                                    minWidth: '28px',
                                                                    minHeight: '28px',
                                                                    opacity: applicant.status === 'approved' ? 0.6 : 1
                                                                }}
                                                            >
                                                                {actionLoadingId === applicant.id && actionType === 'approved' ? (
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
                                                                onClick={() => handleRejectClick(applicant)}
                                                                title="Reject"
                                                                disabled={applicant.status !== 'pending' || (actionLoadingId === applicant.id && actionType === 'rejected')}
                                                                aria-label="Reject"
                                                                style={{
                                                                    background: applicant.status === 'rejected' ? 
                                                                        'linear-gradient(135deg, #94a3b8 0%, #64748b 100%)' : 
                                                                        'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                                                                    color: 'white',
                                                                    border: 'none',
                                                                    borderRadius: '6px',
                                                                    padding: '0.3rem',
                                                                    cursor: applicant.status === 'rejected' ? 'not-allowed' : 'pointer',
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    justifyContent: 'center',
                                                                    transition: 'all 0.2s ease',
                                                                    boxShadow: applicant.status === 'rejected' ? 
                                                                        '0 2px 8px rgba(148, 163, 184, 0.2)' : 
                                                                        '0 2px 8px rgba(239, 68, 68, 0.2)',
                                                                    minWidth: '28px',
                                                                    minHeight: '28px',
                                                                    opacity: applicant.status === 'rejected' ? 0.6 : 1
                                                                }}
                                                            >
                                                                {actionLoadingId === applicant.id && actionType === 'rejected' ? (
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
                                                                onClick={() => handleDeleteClick(applicant)}
                                                                disabled={deletingId === applicant.id}
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
                                                            >
                                                                {deletingId === applicant.id ? (
                                                                    <div className="loading-dots">
                                                                        <div className="dot"></div>
                                                                        <div className="dot"></div>
                                                                        <div className="dot"></div>
                                                                    </div>
                                                                ) : (
                                                                    <>
                                                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                                        </svg>
                                                                        Delete
                                                                    </>
                                                                )}
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                    </tbody>
                                </table>
                                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', justifyContent: 'flex-end', padding: '0.75rem' }}>
                                    <button
                                        onClick={() => setAppPage(p => Math.max(1, p - 1))}
                                        disabled={appPage <= 1}
                                        style={{ padding: '0.4rem 0.8rem', borderRadius: 6, border: '1px solid #e2cfa3', background: appPage <= 1 ? '#f5f5f5' : '#fff', color: '#3F2E1E' }}
                                    >Prev</button>
                                    <span style={{ fontSize: '0.9rem', color: '#3F2E1E' }}>Page {appPage} of {appLastPage}</span>
                                    <button
                                        onClick={() => setAppPage(p => Math.min(appLastPage, p + 1))}
                                        disabled={appPage >= appLastPage}
                                        style={{ padding: '0.4rem 0.8rem', borderRadius: 6, border: '1px solid #e2cfa3', background: appPage >= appLastPage ? '#f5f5f5' : '#fff', color: '#3F2E1E' }}
                                    >Next</button>
                                </div>
                                </div>
                            </div>
                        {/* Modal for applicant details */}
                        {showModal && selectedApplicant && (
                            <div className="modal-backdrop" onClick={() => setShowModal(false)}>
                                <div className="modal-content" onClick={e => e.stopPropagation()}>
                                    <div className="modal-header modern-modal-header">
                                        <div className="modal-title-group">
                                            <h3>Applicant Details: <span className="modal-name">{selectedApplicant.first_name} {selectedApplicant.last_name}</span></h3>
                                            <span className={`status-badge status-${selectedApplicant.status}`}>{selectedApplicant.status}</span>
                                        </div>
                                    </div>
                                    <div className="modal-body modern-modal-body">
                                        <div className="modal-details-list">
                                            <div className="modal-detail"><span className="detail-label">Date of Birth:</span> <span>{selectedApplicant.birthdate}</span></div>
                                            <div className="modal-detail"><span className="detail-label">Gender:</span> <span>{selectedApplicant.gender}</span></div>
                                            <div className="modal-detail"><span className="detail-label">Email:</span> <span>{selectedApplicant.email}</span></div>
                                            <div className="modal-detail"><span className="detail-label">Phone:</span> <span>{selectedApplicant.phone}</span></div>
                                            <div className="modal-detail"><span className="detail-label">Address:</span> <span>{selectedApplicant.address}</span></div>
                                            <div className="modal-detail"><span className="detail-label">Type of Server:</span> <span>{selectedApplicant.server_type ?? 'N/A'}</span></div>
                                            <div className="modal-detail"><span className="detail-label">Commitment:</span> <span>{selectedApplicant.commitment ? 'Yes' : 'No'}</span></div>
                                        </div>
                                        <div className="modal-divider" />
                                        <div className="request-full-text modern-request-full-text"><span className="detail-label">Motivation:</span> {selectedApplicant.motivation}</div>
                                    </div>
                                    <div className="modal-footer modern-modal-footer">
                                        <button className="btn-secondary modern-close-btn" onClick={() => setShowModal(false)}>Close</button>
                                    </div>
                                </div>
                            </div>
                        )}
                        {showDeleteConfirm && (
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
                            }} onClick={() => setShowDeleteConfirm(false)}>
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
                                    <h2 style={{ fontSize: 22, fontWeight: 700, color: '#3F2E1E', margin: 0, marginBottom: 8 }}>Confirm Deletion</h2>
                                    <p style={{ fontSize: 16, color: '#5C4B38', marginBottom: 18 }}>
                                        Are you sure you want to delete <b>{deleteTarget?.name}</b>?
                                    </p>
                                    <div style={{ display: 'flex', gap: 16, justifyContent: 'flex-end', marginTop: 8 }}>
                                        <button
                                            style={{ background: '#e74c3c', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 32px', fontWeight: 700, fontSize: 16, cursor: 'pointer', boxShadow: '0 2px 8px rgba(205,139,62,0.10)', transition: 'background 0.2s' }}
                                            onClick={handleConfirmDelete}
                                            disabled={!!deletingId}
                                        >
                                            {deletingId ? <span className="spinner"></span> : "Yes, Delete"}
                                        </button>
                                        <button
                                            style={{ background: '#fff', color: '#CD8B3E', border: '2px solid #CD8B3E', borderRadius: 8, padding: '10px 32px', fontWeight: 700, fontSize: 16, cursor: 'pointer', boxShadow: '0 2px 8px rgba(205,139,62,0.06)', transition: 'background 0.2s, color 0.2s' }}
                                            onClick={() => setShowDeleteConfirm(false)}
                                            disabled={!!deletingId}
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Rejection Reason Modal */}
                        {showRejectModal && rejectingApplicant && (
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
                                        Reject Application
                                    </h2>
                                    <p style={{ fontSize: 16, color: '#5C4B38', margin: 0 }}>
                                        Please provide a reason for rejecting <strong>{rejectingApplicant.first_name} {rejectingApplicant.last_name}</strong>'s ministry application:
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
                                            disabled={actionLoadingId === rejectingApplicant?.id}
                                        >
                                            {actionLoadingId === rejectingApplicant?.id ? 'Rejecting...' : 'Reject Application'}
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
                                            disabled={actionLoadingId === rejectingApplicant?.id}
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </>
    );
};

export default AdminMinistryApplicants; 