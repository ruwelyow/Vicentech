import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../utils/axios';

const MassAttendance = () => {
    const { massScheduleId } = useParams();
    const navigate = useNavigate();
    const [massSchedule, setMassSchedule] = useState(null);
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        fetchData();
    }, [massScheduleId]);

    const fetchData = async () => {
        try {
            // Fetch mass schedule details
            const scheduleResponse = await api.get(`/mass-schedules/${massScheduleId}`);
            setMassSchedule(scheduleResponse.data);

            // Try to fetch user data (will fail if not logged in)
            try {
                const userResponse = await api.get('/user');
                setUser(userResponse.data);
            } catch (userError) {
                // User is not logged in - this is expected
                console.log('User not logged in, will show login prompt');
                setUser(null);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
            setError('Failed to load mass schedule details');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setError('');

        try {
            const attendanceData = {
                mass_schedule_id: massScheduleId,
                name: user.name,
                email: user.email,
                address: user.address || '',
                phone: user.phone || '',
                number_of_people: 1,
                special_requests: '',
                attendance_date: new Date().toISOString().split('T')[0],
                is_confirmed: true
            };

            await api.post('/mass-attendance', attendanceData);
            setSuccess(true);
            
            // Redirect based on user role after 2 seconds
            setTimeout(() => {
                if (user.is_admin) {
                    navigate('/admin/analytics');
                } else if (user.is_staff) {
                    navigate('/staff/dashboard');
                } else if (user.is_priest) {
                    navigate('/priest/dashboard');
                } else {
                    navigate('/dashboard');
                }
            }, 2000);

        } catch (error) {
            console.error('Error submitting attendance:', error);
            setError('Failed to submit attendance. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading mass attendance form...</p>
                </div>
            </div>
        );
    }

    if (!massSchedule) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-red-600 mb-4">Mass Schedule Not Found</h2>
                    <p className="text-gray-600 mb-4">The requested mass schedule could not be found.</p>
                    <button 
                        onClick={() => navigate('/mass-schedule')}
                        className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600"
                    >
                        View Mass Schedule
                    </button>
                </div>
            </div>
        );
    }

    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center bg-white p-8 rounded-lg shadow-lg max-w-md mx-auto">
                    <div className="text-green-500 text-6xl mb-4">✓</div>
                    <h2 className="text-2xl font-bold text-green-600 mb-4">Attendance Confirmed!</h2>
                    <p className="text-gray-600 mb-4">
                        Thank you for confirming your attendance for the {massSchedule.type} on {massSchedule.day}.
                    </p>
                    <p className="text-sm text-gray-500">Redirecting to dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-2xl mx-auto px-4">
                <div className="bg-white rounded-lg shadow-lg p-8">
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold text-gray-800 mb-2">Mass Attendance Confirmation</h1>
                        <p className="text-gray-600">Please confirm your attendance details</p>
                    </div>

                    {/* Mass Schedule Info */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
                        <h3 className="text-lg font-semibold text-blue-800 mb-3">Mass Schedule Details</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <span className="font-medium text-gray-700">Day:</span>
                                <p className="text-gray-600">{massSchedule.day}</p>
                            </div>
                            <div>
                                <span className="font-medium text-gray-700">Time:</span>
                                <p className="text-gray-600">{massSchedule.start_time} - {massSchedule.end_time}</p>
                            </div>
                            <div>
                                <span className="font-medium text-gray-700">Type:</span>
                                <p className="text-gray-600">{massSchedule.type}</p>
                            </div>
                            <div>
                                <span className="font-medium text-gray-700">Celebrant:</span>
                                <p className="text-gray-600">{massSchedule.celebrant}</p>
                            </div>
                        </div>
                    </div>

                    {/* Login Required Section */}
                    {!user ? (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-8">
                            <div className="text-center">
                                <div className="text-yellow-600 text-4xl mb-4">🔐</div>
                                <h3 className="text-lg font-semibold text-yellow-800 mb-3">Login Required</h3>
                                <p className="text-yellow-700 mb-4">
                                    Please log in to register for mass attendance. Your information will be automatically filled in after login.
                                </p>
                                <div className="space-x-4">
                                    <button
                                        onClick={() => navigate(`/login?redirect=mass-attendance&mass_id=${massScheduleId}`)}
                                        className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                                    >
                                        Login to Register
                                    </button>
                                    <button
                                        onClick={() => navigate('/mass-schedule')}
                                        className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                                    >
                                        View Mass Schedule
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        /* User Information */
                        <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-8">
                            <h3 className="text-lg font-semibold text-green-800 mb-3">Your Information</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <span className="font-medium text-gray-700">Name:</span>
                                    <p className="text-gray-600">{user?.name || 'Not provided'}</p>
                                </div>
                                <div>
                                    <span className="font-medium text-gray-700">Email:</span>
                                    <p className="text-gray-600">{user?.email || 'Not provided'}</p>
                                </div>
                                <div className="md:col-span-2">
                                    <span className="font-medium text-gray-700">Address:</span>
                                    <p className="text-gray-600">{user?.address || 'Not provided'}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                            <p className="text-red-600">{error}</p>
                        </div>
                    )}

                    {user && (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                <p className="text-yellow-800 text-sm">
                                    <strong>Note:</strong> By confirming your attendance, you agree to attend the mass as scheduled. 
                                    Please arrive on time and follow all church guidelines.
                                </p>
                            </div>

                            <div className="flex justify-center space-x-4">
                                <button
                                    type="button"
                                    onClick={() => navigate('/mass-schedule')}
                                    className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="px-8 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    {submitting ? 'Confirming...' : 'Confirm Attendance'}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MassAttendance;
