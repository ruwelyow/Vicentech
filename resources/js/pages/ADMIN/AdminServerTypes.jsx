import React, { useEffect, useState } from 'react';
import { api } from '../../utils/axios';

const AdminServerTypes = () => {
    const [serverTypes, setServerTypes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [saving, setSaving] = useState(false);

    const fetchServerTypes = async () => {
        setLoading(true);
        try {
            const response = await api.get('/admin/server-types');
            setServerTypes(response.data);
            setError('');
        } catch (err) {
            setError('Failed to fetch server types.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchServerTypes();
    }, []);

    const handleToggle = async (id, enabled) => {
        setSaving(true);
        try {
            await api.patch(`/admin/server-types/${id}`, { enabled: !enabled });
            fetchServerTypes();
        } catch (err) {
            setError('Failed to update server type.');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id, name) => {
        if (!window.confirm(`Are you sure you want to delete "${name}"? This cannot be undone.`)) return;
        setSaving(true);
        try {
            await api.delete(`/admin/server-types/${id}`);
            fetchServerTypes();
        } catch (err) {
            setError('Failed to delete server type.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="staff-main-content">
            <h1>Manage Ministry Server Types</h1>
            {error && <div className="text-red-600 mb-2">{error}</div>}
            {loading ? (
                <div>Loading...</div>
            ) : (
                <div className="recent-activities">
                    <table className="server-types-table">
                        <thead>
                            <tr>
                                <th>Type</th>
                                <th>Enabled</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {serverTypes.map(type => (
                                <tr key={type.id}>
                                    <td>{type.name}</td>
                                    <td style={{ textAlign: 'center' }}>
                                        {type.enabled ? (
                                            <span style={{ color: 'green', fontWeight: 'bold' }}>Enabled</span>
                                        ) : (
                                            <span style={{ color: 'gray' }}>Disabled</span>
                                        )}
                                    </td>
                                    <td style={{ textAlign: 'center' }}>
                                        <button
                                            onClick={() => handleToggle(type.id, type.enabled)}
                                            disabled={saving}
                                            style={{
                                                background: type.enabled ? '#eab308' : '#22c55e',
                                                color: '#fff',
                                                border: 'none',
                                                borderRadius: 4,
                                                padding: '6px 16px',
                                                cursor: 'pointer',
                                                fontWeight: 'bold',
                                                marginRight: 8,
                                            }}
                                        >
                                            {type.enabled ? 'Disable' : 'Enable'}
                                        </button>
                                        <button
                                            onClick={() => handleDelete(type.id, type.name)}
                                            disabled={saving}
                                            style={{
                                                background: '#ef4444',
                                                color: '#fff',
                                                border: 'none',
                                                borderRadius: 4,
                                                padding: '6px 16px',
                                                cursor: 'pointer',
                                                fontWeight: 'bold',
                                            }}
                                        >
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default AdminServerTypes; 