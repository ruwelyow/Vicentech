    const handleDelete = (scheduleId) => {
        setDeleteScheduleId(scheduleId);
        setShowDeleteConfirm(true);
    };
import React, { useState, useEffect } from 'react';
import { api } from '../../utils/axios';
import '../../../css/AdminMassSchedule.css';

const AdminMassSchedule = () => {
    const [schedules, setSchedules] = useState([]);
    const [priests, setPriests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showDayModal, setShowDayModal] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deleteScheduleId, setDeleteScheduleId] = useState(null);
    const [editingSchedule, setEditingSchedule] = useState(null);
    const [selectedDay, setSelectedDay] = useState(null);
    const [formData, setFormData] = useState({
        day: 'Sunday',
        start_time: '',
        end_time: '',
        type: 'Regular Mass',
        celebrant: '',
        celebrant_type: 'priest', // 'priest' or 'custom'
        custom_celebrant: '',
        is_active: true
    });
    const [errors, setErrors] = useState({});
    const [dayModalLoading, setDayModalLoading] = useState(false);
    const [dayModalSuccess, setDayModalSuccess] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isMainSubmitting, setIsMainSubmitting] = useState(false);

    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const massTypes = ['Regular Mass', 'Anticipated Mass', 'Special Mass', 'Wedding Mass', 'Funeral Mass'];

    // Function to format time from 24-hour to 12-hour format with AM/PM
    const formatTime = (timeString) => {
        if (!timeString) return '';
        try {
            const [hours, minutes] = timeString.split(':');
            const hour = parseInt(hours);
            const ampm = hour >= 12 ? 'PM' : 'AM';
            const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
            return `${displayHour}:${minutes} ${ampm}`;
        } catch (error) {
            return timeString; // Return original if formatting fails
        }
    };

    useEffect(() => {
        fetchSchedules();
        fetchPriests();
    }, []);

    const fetchSchedules = async () => {
        try {
            setLoading(true);
            const response = await api.get('/admin/mass-schedules');
            setSchedules(response.data);
        } catch (error) {
            console.error('Error fetching schedules:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchPriests = async () => {
        try {
            const response = await api.get('/priests');
            if (response.data.success) {
                setPriests(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching priests:', error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrors({});
        setIsMainSubmitting(true);

        // Client-side validation
        const newErrors = {};
        if (!formData.start_time) newErrors.start_time = ['Start time is required'];
        if (!formData.end_time) newErrors.end_time = ['End time is required'];
        if (!formData.type) newErrors.type = ['Mass type is required'];
        
        // Validate celebrant based on type
        if (formData.celebrant_type === 'priest') {
            if (!formData.celebrant) newErrors.celebrant = ['Please select a priest'];
        } else if (formData.celebrant_type === 'custom') {
            if (!formData.custom_celebrant.trim()) newErrors.custom_celebrant = ['Please enter celebrant name'];
        }
        
        if (formData.start_time && formData.end_time && formData.start_time >= formData.end_time) {
            newErrors.end_time = ['End time must be after start time'];
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            setIsMainSubmitting(false);
            return;
        }

        try {
            // Determine celebrant name
            let celebrantName = '';
            if (formData.celebrant_type === 'priest') {
                const selectedPriest = priests.find(p => p.id == formData.celebrant || p.id === formData.celebrant);
                celebrantName = selectedPriest?.name || formData.celebrant || '';
            } else {
                celebrantName = formData.custom_celebrant?.trim() || '';
            }
            
            // Ensure times are in 24-hour format (H:i) before sending
            const submitData = {
                day: formData.day,
                start_time: convertTo24Hour(formData.start_time),
                end_time: convertTo24Hour(formData.end_time),
                type: formData.type || 'Regular Mass',
                celebrant: celebrantName,
                is_active: formData.is_active !== false // Ensure boolean
            };
            
            // Log data being sent for debugging
            console.log('Submitting mass schedule:', submitData);
            
            if (editingSchedule) {
                await api.patch(`/mass-schedules/${editingSchedule.id}`, submitData);
            } else {
                await api.post('/mass-schedules', submitData);
            }
            
            await fetchSchedules();
            resetForm();
            setShowModal(false);
        } catch (error) {
            console.error('Error saving schedule:', error);
            if (error.response?.data?.errors) {
                console.error('Validation errors:', error.response.data.errors);
                setErrors(error.response.data.errors);
            } else if (error.response?.data?.message) {
                setErrors({ general: [error.response.data.message] });
            } else {
                setErrors({ general: ['Failed to save mass schedule. Please try again.'] });
            }
        } finally {
            setIsMainSubmitting(false);
        }
    };


    const cancelDelete = () => {
        setShowDeleteConfirm(false);
        setDeleteScheduleId(null);
    };

    const handleToggleActive = async (schedule) => {
        try {
            await api.patch(`/mass-schedules/${schedule.id}/toggle-active`);
            await fetchSchedules();
        } catch (error) {
            console.error('Error toggling schedule status:', error);
        }
    };

    const resetForm = () => {
        setFormData({
            day: 'Sunday',
            start_time: '',
            end_time: '',
            type: 'Regular Mass',
            celebrant: '',
            celebrant_type: 'priest',
            custom_celebrant: '',
            is_active: true
        });
        setEditingSchedule(null);
        setErrors({});
    };

    const handleSubmitDay = async (e) => {
        e.preventDefault();
        setErrors({});
        setIsSubmitting(true);

        // Client-side validation
        const newErrors = {};
        if (!formData.start_time) newErrors.start_time = ['Start time is required'];
        if (!formData.end_time) newErrors.end_time = ['End time is required'];
        
        // Validate celebrant based on type
        if (formData.celebrant_type === 'priest') {
            if (!formData.celebrant) newErrors.celebrant = ['Please select a priest'];
        } else if (formData.celebrant_type === 'custom') {
            if (!formData.custom_celebrant.trim()) newErrors.custom_celebrant = ['Please enter celebrant name'];
        }
        
        if (formData.start_time && formData.end_time && formData.start_time >= formData.end_time) {
            newErrors.end_time = ['End time must be after start time'];
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            setIsSubmitting(false);
            return;
        }

        // Prepare form data with defaults for optional fields
        // Ensure times are in 24-hour format (H:i) before sending
        const submitData = {
            ...formData,
            start_time: convertTo24Hour(formData.start_time),
            end_time: convertTo24Hour(formData.end_time),
            type: formData.type || 'Regular Mass', // Default if empty
            celebrant: formData.celebrant_type === 'priest' 
                ? priests.find(p => p.id == formData.celebrant)?.name || formData.celebrant
                : formData.custom_celebrant
        };

        try {
            await api.post('/mass-schedules', submitData);
            await fetchSchedules();
            resetForm();
            setShowDayModal(false);
        } catch (error) {
            if (error.response?.data?.errors) {
                setErrors(error.response.data.errors);
            } else {
                console.error('Error saving schedule:', error);
                setErrors({ general: ['Failed to save mass schedule. Please try again.'] });
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCloseModal = () => {
        setShowModal(false);
        resetForm();
    };

    const handleCloseDayModal = () => {
        setShowDayModal(false);
        setSelectedDay(null);
        resetForm();
    };

    const handleEditDay = (day) => {
        setSelectedDay(day);
        setFormData(prev => ({
            ...prev,
            day: day
        }));
        setShowDayModal(true);
    };

    // Helper function to convert time to 24-hour format (H:i) - hours:minutes only
    const convertTo24Hour = (timeString) => {
        if (!timeString) return '';
        
        // Remove any whitespace
        timeString = timeString.trim();
        
        // If in 24-hour format with seconds (HH:MM:SS), remove seconds
        const matchWithSeconds = timeString.match(/^(\d{2}):(\d{2}):(\d{2})$/);
        if (matchWithSeconds) {
            return `${matchWithSeconds[1]}:${matchWithSeconds[2]}`;
        }
        
        // If already in 24-hour format (HH:MM), return as is
        if (/^\d{2}:\d{2}$/.test(timeString)) {
            return timeString;
        }
        
        // If in 12-hour format with AM/PM, convert it
        const match12Hour = timeString.match(/(\d{1,2}):(\d{2})(?::\d{2})?\s*(AM|PM)/i);
        if (match12Hour) {
            let hours = parseInt(match12Hour[1]);
            const minutes = match12Hour[2];
            const period = match12Hour[3].toUpperCase();
            
            if (period === 'PM' && hours !== 12) {
                hours += 12;
            } else if (period === 'AM' && hours === 12) {
                hours = 0;
            }
            return `${hours.toString().padStart(2, '0')}:${minutes}`;
        }
        
        // Return original if format not recognized (will be caught by backend validation)
        return timeString;
    };

    const handleEdit = (schedule) => {
        setEditingSchedule(schedule);
        // Ensure times are in 24-hour format for HTML time input
        const startTime = convertTo24Hour(schedule.start_time || schedule.time || '');
        const endTime = convertTo24Hour(schedule.end_time || '');
        
        // Find the priest by name if celebrant_type is priest
        let celebrantId = '';
        let celebrantType = 'priest';
        
        // Check if celebrant matches any priest name
        const matchingPriest = priests.find(p => p.name === schedule.celebrant);
        if (matchingPriest) {
            celebrantId = matchingPriest.id;
            celebrantType = 'priest';
        } else if (schedule.celebrant) {
            // If no match found, assume it's a custom celebrant
            celebrantType = 'custom';
            celebrantId = '';
        }
        
        setFormData({
            day: schedule.day,
            start_time: startTime,
            end_time: endTime,
            type: schedule.type || 'Regular Mass',
            celebrant: celebrantId,
            celebrant_type: celebrantType,
            custom_celebrant: celebrantType === 'custom' ? schedule.celebrant : '',
            is_active: schedule.is_active !== false
        });
        setShowModal(true);
    };

    const confirmDelete = async () => {
        if (!deleteScheduleId) return;
        
        try {
            await api.delete(`/mass-schedules/${deleteScheduleId}`);
            await fetchSchedules();
        } catch (error) {
            console.error('Error deleting schedule:', error);
            alert('Failed to delete schedule. Please try again.');
        } finally {
            setShowDeleteConfirm(false);
            setDeleteScheduleId(null);
        }
    };

    const groupSchedulesByDay = (schedules) => {
        return schedules.reduce((acc, schedule) => {
            if (!acc[schedule.day]) {
                acc[schedule.day] = [];
            }
            acc[schedule.day].push(schedule);
            return acc;
        }, {});
    };

    const groupedSchedules = groupSchedulesByDay(schedules);

    if (loading) return <div className="loading-users">Loading mass schedules...</div>;

    return (
        <>
            {/* Full Screen Loading Overlay - Similar to Events Design */}
            {(isSubmitting || isMainSubmitting) && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '100vw',
                    height: '100vh',
                    background: 'rgba(255,255,255,0.6)',
                    zIndex: 9999,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backdropFilter: 'blur(6px)',
                    WebkitBackdropFilter: 'blur(6px)',
                }}>
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 16,
                    }}>
                        <svg style={{ width: 64, height: 64, color: '#CD8B3E', marginBottom: 12 }} viewBox="0 0 50 50">
                            <circle cx="25" cy="25" r="20" fill="none" stroke="#CD8B3E" strokeWidth="6" strokeDasharray="31.4 31.4" strokeLinecap="round">
                                <animateTransform attributeName="transform" type="rotate" from="0 25 25" to="360 25 25" dur="1s" repeatCount="indefinite" />
                            </circle>
                        </svg>
                        <div style={{ color: '#3F2E1E', fontWeight: 600, fontSize: 20, letterSpacing: 1 }}>
                            {isSubmitting ? 'Adding mass time...' : 'Saving mass schedule...'}
                        </div>
                    </div>
                </div>
            )}

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
                            Are you sure you want to delete this mass schedule? This action cannot be undone.
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

            <div className="sacraments-container responsive-admin-mass-schedule" style={{ maxWidth: '90%', width: '95%', minHeight: '100vh', padding: '1.5rem', margin: '0 auto' }}>
            <style>{`
                @media (max-width: 600px) {
                        .responsive-admin-mass-schedule {
                            width: 95vw !important;
                            max-width: 100vw !important;
                            margin-left: auto !important;
                            margin-right: auto !important;
                            padding-left: 1rem !important;
                            padding-right: 1rem !important;
                    }
                }
            `}</style>
                
                <div className="sacraments-header" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'flex-start', width: '100%' }}>
                    <h1 className="sacraments-title" style={{ fontSize: '2rem', width: '100%' }}>Mass Schedule Management</h1>
                        <button 
                            onClick={() => setShowModal(true)}
                        className="add-btn management-btn primary"
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
                            width: 'auto', 
                            maxWidth: 200,
                            marginBottom: '1.5rem'
                        }}
                    >
                        + Add Schedule
                        </button>
            </div>

                {/* Mass Schedule Grid */}
                <div className="user-table-wrapper" style={{ 
                    background: 'white',
                    borderRadius: '0.75rem',
                    border: '1.5px solid #f2e4ce',
                    overflowX: 'auto',
                    boxShadow: '0 4px 12px rgba(60, 47, 30, 0.08)',
                    width: '100%',
                    boxSizing: 'border-box',
                    marginTop: '1rem',
                    padding: '1.5rem'
                }}>
                        <div style={{ 
                            display: 'grid', 
                            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', 
                            gap: '2rem',
                            padding: '0.5rem'
                        }}>
                            {daysOfWeek.map(day => (
                                <div 
                                    key={day} 
                                    style={{ 
                                        background: '#fff',
                                        borderRadius: '16px',
                                        border: '1px solid rgba(205, 139, 62, 0.1)',
                                        padding: '0',
                                        boxShadow: '0 4px 20px rgba(205, 139, 62, 0.08)',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        overflow: 'hidden',
                                        transition: 'all 0.3s ease',
                                        minHeight: '280px',
                                        position: 'relative'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.transform = 'translateY(-4px)';
                                        e.currentTarget.style.boxShadow = '0 12px 40px rgba(205, 139, 62, 0.15)';
                                        e.currentTarget.style.borderColor = 'rgba(205, 139, 62, 0.2)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.transform = 'translateY(0)';
                                        e.currentTarget.style.boxShadow = '0 4px 20px rgba(205, 139, 62, 0.08)';
                                        e.currentTarget.style.borderColor = 'rgba(205, 139, 62, 0.1)';
                                    }}
                                >
                                    {/* Header Section with Day Badge */}
                                    <div style={{ 
                                        background: 'linear-gradient(135deg, #CD8B3E 0%, #B77B35 100%)',
                                        padding: '1.5rem',
                                        display: 'flex', 
                                        justifyContent: 'space-between', 
                                        alignItems: 'center',
                                        position: 'relative',
                                        overflow: 'hidden'
                                    }}>
                                        {/* Background Pattern */}
                                        <div style={{
                                            position: 'absolute',
                                            top: '-50%',
                                            right: '-20%',
                                            width: '100%',
                                            height: '200%',
                                            background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)',
                                            pointerEvents: 'none'
                                        }}></div>
                                        
                                        <h3 style={{ 
                                            margin: '0', 
                                            color: 'white', 
                                            fontSize: '1.4rem', 
                                            fontWeight: '700',
                                            letterSpacing: '-0.025em',
                                            position: 'relative',
                                            textShadow: '0 1px 2px rgba(0,0,0,0.1)'
                                        }}>
                                            {day}
                                        </h3>
                                <button 
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleEditDay(day);
                                            }}
                                            style={{ 
                                                background: 'rgba(255, 255, 255, 0.2)', 
                                                color: 'white', 
                                                border: '1px solid rgba(255, 255, 255, 0.3)', 
                                                borderRadius: '8px', 
                                                padding: '0.5rem 1rem', 
                                                fontWeight: '600', 
                                                fontSize: '0.8rem', 
                                                cursor: 'pointer',
                                                transition: 'all 0.2s ease',
                                                backdropFilter: 'blur(10px)',
                                                position: 'relative'
                                            }}
                                            onMouseEnter={(e) => {
                                                e.target.style.background = 'rgba(255, 255, 255, 0.3)';
                                                e.target.style.transform = 'translateY(-1px)';
                                            }}
                                            onMouseLeave={(e) => {
                                                e.target.style.background = 'rgba(255, 255, 255, 0.2)';
                                                e.target.style.transform = 'translateY(0)';
                                            }}
                                    title={`Add time for ${day}`}
                                >
                                    + Add Time
                                </button>
                            </div>
                                    {/* Content Section */}
                                    <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1 }}>
                                {(groupedSchedules[day] || []).map(schedule => (
                                    <div 
                                        key={schedule.id} 
                                                style={{ 
                                                    background: schedule.is_active ? 
                                                        'linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%)' : 
                                                        'linear-gradient(135deg, #fef2f2 0%, #fef7f7 100%)',
                                                    borderRadius: '12px',
                                                    border: schedule.is_active ? 
                                                        '1px solid rgba(34, 197, 94, 0.2)' : 
                                                        '1px solid rgba(239, 68, 68, 0.2)',
                                                    padding: '1rem',
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    gap: '0.75rem',
                                                    transition: 'all 0.2s ease',
                                                    position: 'relative',
                                                    overflow: 'hidden'
                                                }}
                                                onMouseEnter={(e) => {
                                                    e.currentTarget.style.transform = 'translateY(-1px)';
                                                    e.currentTarget.style.boxShadow = schedule.is_active ? 
                                                        '0 4px 12px rgba(34, 197, 94, 0.15)' : 
                                                        '0 4px 12px rgba(239, 68, 68, 0.15)';
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.currentTarget.style.transform = 'translateY(0)';
                                                    e.currentTarget.style.boxShadow = 'none';
                                                }}
                                            >
                                                {/* Status Badge */}
                                                <div style={{
                                                    position: 'absolute',
                                                    top: '8px',
                                                    right: '8px',
                                                    background: schedule.is_active ? 
                                                        'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)' : 
                                                        'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                                                    color: 'white',
                                                    borderRadius: '6px',
                                                    padding: '2px 6px',
                                                    fontSize: '0.7rem',
                                                    fontWeight: '600',
                                                    letterSpacing: '0.5px',
                                                    textTransform: 'uppercase',
                                                    boxShadow: schedule.is_active ? 
                                                        '0 2px 8px rgba(34, 197, 94, 0.3)' : 
                                                        '0 2px 8px rgba(239, 68, 68, 0.3)'
                                                }}>
                                                    {schedule.is_active ? 'Active' : 'Inactive'}
                                                </div>

                                                {/* Time Display */}
                                                <div style={{ 
                                                    fontSize: '1.1rem', 
                                                    fontWeight: '700', 
                                                    color: '#2d3748',
                                                    letterSpacing: '-0.025em',
                                                    marginBottom: '0.5rem'
                                                }}>
                                                {formatTime(schedule.start_time || schedule.time)} 
                                                {schedule.end_time && ` - ${formatTime(schedule.end_time)}`}
                                            </div>

                                                {/* Schedule Details */}
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', marginBottom: '1rem' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                        <div style={{
                                                            width: '6px',
                                                            height: '6px',
                                                            borderRadius: '50%',
                                                            background: '#CD8B3E'
                                                        }}></div>
                                                        <span style={{ 
                                                            color: '#4a5568', 
                                                            fontSize: '0.85rem',
                                                            fontWeight: '500'
                                                        }}>
                                                            {schedule.type}
                                                        </span>
                                            </div>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                        <div style={{
                                                            width: '6px',
                                                            height: '6px',
                                                            borderRadius: '50%',
                                                            background: '#68d391'
                                                        }}></div>
                                                        <span style={{ 
                                                            color: '#4a5568', 
                                                            fontSize: '0.85rem',
                                                            fontWeight: '500'
                                                        }}>
                                                            {schedule.celebrant}
                                                        </span>
                                        </div>
                                                </div>

                                                {/* Action Buttons */}
                                                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                            <button 
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleEdit(schedule);
                                                        }}
                                                        style={{ 
                                                            background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', 
                                                            color: 'white', 
                                                            border: 'none', 
                                                            borderRadius: '6px', 
                                                            padding: '0.4rem', 
                                                            cursor: 'pointer',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            transition: 'all 0.2s ease',
                                                            boxShadow: '0 2px 8px rgba(59, 130, 246, 0.2)'
                                                        }}
                                                        onMouseEnter={(e) => {
                                                            e.target.style.transform = 'translateY(-1px)';
                                                            e.target.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.3)';
                                                        }}
                                                        onMouseLeave={(e) => {
                                                            e.target.style.transform = 'translateY(0)';
                                                            e.target.style.boxShadow = '0 2px 8px rgba(59, 130, 246, 0.2)';
                                                        }}
                                                title="Edit"
                                            >
                                                        <svg style={{ width: '14px', height: '14px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.536L16.732 3.732z" />
                                                </svg>
                                            </button>
                                            <button 
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleToggleActive(schedule);
                                                        }}
                                                        style={{ 
                                                            background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', 
                                                            color: 'white', 
                                                            border: 'none', 
                                                            borderRadius: '6px', 
                                                            padding: '0.4rem', 
                                                            cursor: 'pointer',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            transition: 'all 0.2s ease',
                                                            boxShadow: '0 2px 8px rgba(245, 158, 11, 0.2)'
                                                        }}
                                                        onMouseEnter={(e) => {
                                                            e.target.style.transform = 'translateY(-1px)';
                                                            e.target.style.boxShadow = '0 4px 12px rgba(245, 158, 11, 0.3)';
                                                        }}
                                                        onMouseLeave={(e) => {
                                                            e.target.style.transform = 'translateY(0)';
                                                            e.target.style.boxShadow = '0 2px 8px rgba(245, 158, 11, 0.2)';
                                                        }}
                                                title={schedule.is_active ? 'Deactivate' : 'Activate'}
                                            >
                                                {schedule.is_active ? (
                                                            <svg style={{ width: '14px', height: '14px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                    </svg>
                                                ) : (
                                                            <svg style={{ width: '14px', height: '14px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                                                    </svg>
                                                )}
                                            </button>
                                            <button 
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setDeleteScheduleId(schedule.id);
                                                            setShowDeleteConfirm(true);
                                                        }}
                                                        style={{ 
                                                            background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)', 
                                                            color: 'white', 
                                                            border: 'none', 
                                                            borderRadius: '6px', 
                                                            padding: '0.4rem', 
                                                            cursor: 'pointer',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            transition: 'all 0.2s ease',
                                                            boxShadow: '0 2px 8px rgba(239, 68, 68, 0.2)'
                                                        }}
                                                        onMouseEnter={(e) => {
                                                            e.target.style.transform = 'translateY(-1px)';
                                                            e.target.style.boxShadow = '0 4px 12px rgba(239, 68, 68, 0.3)';
                                                        }}
                                                        onMouseLeave={(e) => {
                                                            e.target.style.transform = 'translateY(0)';
                                                            e.target.style.boxShadow = '0 2px 8px rgba(239, 68, 68, 0.2)';
                                                        }}
                                                title="Delete"
                                            >
                                                        <svg style={{ width: '14px', height: '14px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                ))}
                                {(groupedSchedules[day] || []).length === 0 && (
                                            <div style={{ 
                                                textAlign: 'center', 
                                                padding: '2rem 1rem',
                                                background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
                                                borderRadius: '12px',
                                                border: '1px dashed rgba(205, 139, 62, 0.3)',
                                                position: 'relative'
                                            }}>
                                                <div style={{
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    width: '48px',
                                                    height: '48px',
                                                    background: 'rgba(205, 139, 62, 0.1)',
                                                    borderRadius: '50%',
                                                    margin: '0 auto 1rem',
                                                    border: '1px solid rgba(205, 139, 62, 0.2)'
                                                }}>
                                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" style={{
                                                        width: '24px',
                                                        height: '24px',
                                                        color: '#CD8B3E',
                                                        strokeWidth: '1.5'
                                                    }}>
                                                        <circle cx="12" cy="12" r="10"/>
                                                        <polyline points="12,6 12,12 16,14"/>
                                                    </svg>
                                                </div>
                                                <div style={{ 
                                                    color: '#718096', 
                                                    fontSize: '0.9rem',
                                                    fontWeight: '500'
                                                }}>
                                                    No mass scheduled
                                                </div>
                                                <div style={{ 
                                                    color: '#a0aec0', 
                                                    fontSize: '0.8rem',
                                                    marginTop: '0.25rem'
                                                }}>
                                                    Click "Add Time" to schedule
                                                </div>
                                            </div>
                                )}
                            </div>
                        </div>
                            ))}
                        </div>
            </div>

            {/* Modal */}
            {showModal && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '100vw',
                    height: '100vh',
                    background: 'rgba(44, 44, 44, 0.25)',
                    backdropFilter: 'blur(6px)',
                    WebkitBackdropFilter: 'blur(6px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 3000,
                }} onClick={handleCloseModal}>
                    <div style={{
                        background: '#fff',
                        borderRadius: 18,
                        boxShadow: '0 8px 32px rgba(60,40,20,0.18)',
                        padding: '1.5rem',
                        minWidth: 800,
                        maxWidth: 900,
                        width: '90vw',
                        maxHeight: '90vh',
                        overflow: 'visible',
                        position: 'relative',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 18,
                    }} onClick={(e) => e.stopPropagation()}>
                        <div style={{ 
                            background: '#CD8B3E', 
                            borderRadius: '12px 12px 0 0', 
                            padding: '1.5rem 2rem', 
                            margin: '-1.5rem -1.5rem 0 -1.5rem',
                            color: 'white',
                            textAlign: 'center',
                            position: 'relative'
                        }}>
                            <h2 style={{ 
                                fontSize: '1.5rem', 
                                fontWeight: '700', 
                                margin: '0 0 0.5rem 0',
                                color: 'white'
                            }}>
                                {editingSchedule ? 'Edit Mass Schedule' : 'Add New Mass Schedule'}
                            </h2>
                            <p style={{ 
                                fontSize: '0.875rem', 
                                margin: '0', 
                                color: 'white',
                                opacity: 0.9
                            }}>
                                {editingSchedule ? 'Update the mass schedule information' : 'Create a new mass schedule for your parish'}
                            </p>
                            <button 
                                onClick={handleCloseModal}
                                title="Close"
                                style={{
                                    position: 'absolute',
                                    top: '1rem',
                                    right: '1rem',
                                    background: 'rgba(255, 255, 255, 0.1)',
                                    border: '1px solid rgba(255, 255, 255, 0.2)',
                                    borderRadius: '50%',
                                    width: '32px',
                                    height: '32px',
                                    color: 'white',
                                    fontSize: '1.2rem',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    transition: 'all 0.2s',
                                    fontWeight: 'bold'
                                }}
                                onMouseEnter={(e) => {
                                    e.target.style.background = 'rgba(255, 255, 255, 0.2)';
                                    e.target.style.borderColor = 'rgba(255, 255, 255, 0.3)';
                                }}
                                onMouseLeave={(e) => {
                                    e.target.style.background = 'rgba(255, 255, 255, 0.1)';
                                    e.target.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                                }}
                            >
                                ×
                            </button>
                        </div>
                        
                        <div style={{ 
                            background: '#FFF6E5', 
                            borderRadius: '0 0 12px 12px', 
                            padding: '1rem', 
                            marginBottom: 0, 
                            width: '100%',
                            boxSizing: 'border-box'
                        }}>
                            <form onSubmit={handleSubmit} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {dayModalLoading && (
                                <div className="loading-users" style={{marginBottom: 10}}>Saving schedule...</div>
                            )}
                            {dayModalSuccess && (
                                <div className="success-message" style={{marginBottom: 10, padding: '10px', backgroundColor: '#e6ffe6', border: '1px solid #b2f2b2', borderRadius: '4px', color: '#228B22'}}>
                                    {dayModalSuccess}
                                </div>
                            )}
                            {errors.general && (
                                <div className="error-message general-error" style={{marginBottom: '15px', padding: '10px', backgroundColor: '#fee', border: '1px solid #fcc', borderRadius: '4px', color: '#c33'}}>
                                    {errors.general[0]}
                                </div>
                            )}
                            <div style={{ width: '100%' }}>
                                <label style={{ display: 'block', fontWeight: 600, color: '#3F2E1E', marginBottom: '0.25rem', fontSize: '13px' }}>Day</label>
                                <select
                                    value={formData.day}
                                    onChange={(e) => setFormData({...formData, day: e.target.value})}
                                    style={{ 
                                        width: '100%', 
                                        padding: '0.5rem', 
                                        borderRadius: 8, 
                                        border: '1.5px solid #e2cfa3', 
                                        fontSize: 13, 
                                        color: '#3F2E1E', 
                                        background: '#fff',
                                        boxSizing: 'border-box',
                                        outline: 'none',
                                        transition: 'border-color 0.2s'
                                    }}
                                >
                                    {daysOfWeek.map(day => (
                                        <option key={day} value={day}>{day}</option>
                                    ))}
                                </select>
                                {errors.day && <span style={{ color: '#dc3545', fontSize: '0.875rem', marginTop: '0.25rem', display: 'block' }}>{errors.day[0]}</span>}
                            </div>

                            <div style={{ width: '100%' }}>
                                <label style={{ display: 'block', fontWeight: 600, color: '#3F2E1E', marginBottom: '0.25rem', fontSize: '13px' }}>Start Time</label>
                                <input
                                    type="time"
                                    value={formData.start_time}
                                    onChange={(e) => setFormData({...formData, start_time: e.target.value})}
                                    required
                                    style={{ 
                                        width: '100%', 
                                        padding: '0.5rem', 
                                        borderRadius: 8, 
                                        border: '1.5px solid #e2cfa3', 
                                        fontSize: 13, 
                                        color: '#3F2E1E', 
                                        background: '#fff',
                                        boxSizing: 'border-box',
                                        outline: 'none',
                                        transition: 'border-color 0.2s'
                                    }}
                                />
                                {errors.start_time && <span style={{ color: '#dc3545', fontSize: '0.875rem', marginTop: '0.25rem', display: 'block' }}>{errors.start_time[0]}</span>}
                            </div>

                            <div style={{ width: '100%' }}>
                                <label style={{ display: 'block', fontWeight: 600, color: '#3F2E1E', marginBottom: '0.25rem', fontSize: '13px' }}>End Time</label>
                                <input
                                    type="time"
                                    value={formData.end_time}
                                    onChange={(e) => setFormData({...formData, end_time: e.target.value})}
                                    required
                                    style={{ 
                                        width: '100%', 
                                        padding: '0.5rem', 
                                        borderRadius: 8, 
                                        border: '1.5px solid #e2cfa3', 
                                        fontSize: 13, 
                                        color: '#3F2E1E', 
                                        background: '#fff',
                                        boxSizing: 'border-box',
                                        outline: 'none',
                                        transition: 'border-color 0.2s'
                                    }}
                                />
                                {errors.end_time && <span style={{ color: '#dc3545', fontSize: '0.875rem', marginTop: '0.25rem', display: 'block' }}>{errors.end_time[0]}</span>}
                            </div>

                            <div style={{ width: '100%' }}>
                                <label style={{ display: 'block', fontWeight: 600, color: '#3F2E1E', marginBottom: '0.25rem', fontSize: '13px' }}>Mass Type</label>
                                <select
                                    value={formData.type}
                                    onChange={(e) => setFormData({...formData, type: e.target.value})}
                                    required
                                    style={{ 
                                        width: '100%', 
                                        padding: '0.5rem', 
                                        borderRadius: 8, 
                                        border: '1.5px solid #e2cfa3', 
                                        fontSize: 13, 
                                        color: '#3F2E1E', 
                                        background: '#fff',
                                        boxSizing: 'border-box',
                                        outline: 'none',
                                        transition: 'border-color 0.2s'
                                    }}
                                >
                                    {massTypes.map(type => (
                                        <option key={type} value={type}>{type}</option>
                                    ))}
                                </select>
                                {errors.type && <span style={{ color: '#dc3545', fontSize: '0.875rem', marginTop: '0.25rem', display: 'block' }}>{errors.type[0]}</span>}
                            </div>

                            <div style={{ width: '100%' }}>
                                <label style={{ display: 'block', fontWeight: 600, color: '#3F2E1E', marginBottom: '0.25rem', fontSize: '13px' }}>Celebrant Type</label>
                                <select
                                    value={formData.celebrant_type}
                                    onChange={(e) => setFormData({
                                        ...formData, 
                                        celebrant_type: e.target.value,
                                        celebrant: '',
                                        custom_celebrant: ''
                                    })}
                                    style={{ 
                                        width: '100%', 
                                        padding: '0.5rem', 
                                        borderRadius: 8, 
                                        border: '1.5px solid #e2cfa3', 
                                        fontSize: 13, 
                                        color: '#3F2E1E', 
                                        background: '#fff',
                                        boxSizing: 'border-box',
                                        outline: 'none',
                                        transition: 'border-color 0.2s'
                                    }}
                                >
                                    <option value="priest">Select from Priests</option>
                                    <option value="custom">Custom Celebrant</option>
                                </select>
                            </div>

                            {formData.celebrant_type === 'priest' ? (
                                <div style={{ width: '100%' }}>
                                    <label style={{ display: 'block', fontWeight: 600, color: '#3F2E1E', marginBottom: '0.25rem', fontSize: '13px' }}>Select Priest</label>
                                    <select
                                        value={formData.celebrant}
                                        onChange={(e) => setFormData({...formData, celebrant: e.target.value})}
                                        required
                                        style={{ 
                                            width: '100%', 
                                            padding: '0.75rem', 
                                            borderRadius: 8, 
                                            border: '1.5px solid #e2cfa3', 
                                            fontSize: 14, 
                                            color: '#3F2E1E', 
                                            background: '#fff',
                                            boxSizing: 'border-box'
                                        }}
                                    >
                                        <option value="">Choose a priest...</option>
                                        {priests.map(priest => (
                                            <option key={priest.id} value={priest.id}>{priest.name}</option>
                                        ))}
                                    </select>
                                    {errors.celebrant && <span style={{ color: '#dc3545', fontSize: '0.875rem', marginTop: '0.25rem', display: 'block' }}>{errors.celebrant[0]}</span>}
                                </div>
                            ) : (
                                <div style={{ width: '100%' }}>
                                    <label style={{ display: 'block', fontWeight: 600, color: '#3F2E1E', marginBottom: '0.25rem', fontSize: '13px' }}>Custom Celebrant Name</label>
                                    <input
                                        type="text"
                                        value={formData.custom_celebrant}
                                        onChange={(e) => setFormData({...formData, custom_celebrant: e.target.value})}
                                        placeholder="Rev. Fr. [name]"
                                        required
                                        style={{ 
                                            width: '100%', 
                                            padding: '0.75rem', 
                                            borderRadius: 8, 
                                            border: '1.5px solid #e2cfa3', 
                                            fontSize: 14, 
                                            color: '#3F2E1E', 
                                            background: '#fff',
                                            boxSizing: 'border-box'
                                        }}
                                    />
                                    {errors.custom_celebrant && <span style={{ color: '#dc3545', fontSize: '0.875rem', marginTop: '0.25rem', display: 'block' }}>{errors.custom_celebrant[0]}</span>}
                                </div>
                            )}

                            <div style={{ width: '100%' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, color: '#3F2E1E', fontSize: '13px' }}>
                                    <input
                                        type="checkbox"
                                        checked={formData.is_active}
                                        onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                                        style={{ 
                                            width: '16px', 
                                            height: '16px', 
                                            accentColor: '#14b8a6',
                                            cursor: 'pointer'
                                        }}
                                    />
                                    Active
                                </label>
                            </div>

                            <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem', alignItems: 'center' }}>
                                <button 
                                    type="button" 
                                    onClick={handleCloseModal}
                                    style={{ background: '#e5e7eb', color: '#374151', padding: '0.5rem 0.75rem', borderRadius: '8px', border: 'none', fontWeight: 600, width: '100%', fontSize: '13px', cursor: 'pointer', transition: 'all 0.2s' }}
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit" 
                                    disabled={isMainSubmitting}
                                    style={{ background: '#CD8B3E', color: 'white', padding: '0.5rem 0.75rem', borderRadius: '8px', border: 'none', fontWeight: 600, width: '100%', fontSize: '13px', cursor: 'pointer', transition: 'all 0.2s' }}
                                >
                                    {isMainSubmitting ? 'Saving...' : (editingSchedule ? 'Update Schedule' : 'Add Schedule')}
                                </button>
                            </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Day Edit Modal */}
            {showDayModal && (
                <div className="modal-overlay" onClick={handleCloseDayModal}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Add Mass Time - {selectedDay}</h2>
                            <button className="modal-close" onClick={handleCloseDayModal}>×</button>
                        </div>
                        
                        <form onSubmit={handleSubmitDay} className="schedule-form">
                            {errors.general && (
                                <div className="error-message general-error" style={{marginBottom: '15px', padding: '10px', backgroundColor: '#fee', border: '1px solid #fcc', borderRadius: '4px', color: '#c33'}}>
                                    {errors.general[0]}
                                </div>
                            )}
                            <div className="form-group">
                                <label htmlFor="day-start-time">Mass Start Time *</label>
                                <input
                                    type="time"
                                    id="day-start-time"
                                    value={formData.start_time}
                                    onChange={(e) => setFormData({...formData, start_time: e.target.value})}
                                    className={errors.start_time ? 'error' : ''}
                                    required
                                />
                                {errors.start_time && <span className="error-message">{errors.start_time[0]}</span>}
                            </div>

                            <div className="form-group">
                                <label htmlFor="day-end-time">Mass End Time *</label>
                                <input
                                    type="time"
                                    id="day-end-time"
                                    value={formData.end_time}
                                    onChange={(e) => setFormData({...formData, end_time: e.target.value})}
                                    className={errors.end_time ? 'error' : ''}
                                    required
                                />
                                {errors.end_time && <span className="error-message">{errors.end_time[0]}</span>}
                            </div>

                            <div className="form-group">
                                <label htmlFor="day-type">Mass Type (Optional)</label>
                                <select
                                    id="day-type"
                                    value={formData.type}
                                    onChange={(e) => setFormData({...formData, type: e.target.value})}
                                    className={errors.type ? 'error' : ''}
                                >
                                    <option value="">Select Mass Type (Optional)</option>
                                    {massTypes.map(type => (
                                        <option key={type} value={type}>{type}</option>
                                    ))}
                                </select>
                                {errors.type && <span className="error-message">{errors.type[0]}</span>}
                            </div>

                            <div className="form-group">
                                <label htmlFor="day-celebrant-type">Celebrant Type *</label>
                                <select
                                    id="day-celebrant-type"
                                    value={formData.celebrant_type}
                                    onChange={(e) => setFormData({
                                        ...formData, 
                                        celebrant_type: e.target.value,
                                        celebrant: '',
                                        custom_celebrant: ''
                                    })}
                                    className="form-control"
                                >
                                    <option value="priest">Select from Priests</option>
                                    <option value="custom">Custom Celebrant</option>
                                </select>
                            </div>

                            {formData.celebrant_type === 'priest' ? (
                                <div className="form-group">
                                    <label htmlFor="day-celebrant">Select Priest *</label>
                                    <select
                                        id="day-celebrant"
                                        value={formData.celebrant}
                                        onChange={(e) => setFormData({...formData, celebrant: e.target.value})}
                                        className={errors.celebrant ? 'error' : ''}
                                        required
                                    >
                                        <option value="">Choose a priest...</option>
                                        {priests.map(priest => (
                                            <option key={priest.id} value={priest.id}>{priest.name}</option>
                                        ))}
                                    </select>
                                    {errors.celebrant && <span className="error-message">{errors.celebrant[0]}</span>}
                                </div>
                            ) : (
                                <div className="form-group">
                                    <label htmlFor="day-custom-celebrant">Custom Celebrant Name *</label>
                                    <input
                                        type="text"
                                        id="day-custom-celebrant"
                                        value={formData.custom_celebrant}
                                        onChange={(e) => setFormData({...formData, custom_celebrant: e.target.value})}
                                        className={errors.custom_celebrant ? 'error' : ''}
                                        placeholder="Rev. Fr. [name]"
                                        required
                                    />
                                    {errors.custom_celebrant && <span className="error-message">{errors.custom_celebrant[0]}</span>}
                                </div>
                            )}

                            <div className="form-actions">
                                <button type="button" className="btn-secondary" onClick={handleCloseDayModal}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn-primary" disabled={isSubmitting}>
                                    {isSubmitting ? 'Adding...' : 'Add Time'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
        </>
    );
};

export default AdminMassSchedule;