import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../utils/axios';
import '../../../css/events.css';

const JoinEvent = () => {
    const { eventId } = useParams();
    const navigate = useNavigate();
    const [event, setEvent] = useState(null);
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [isAlreadyRegistered, setIsAlreadyRegistered] = useState(false);

    useEffect(() => {
        fetchData();
    }, [eventId]);

    const fetchData = async () => {
        try {
            // Fetch event details (includes is_registered if user is authenticated)
            const eventResponse = await api.get(`/events/${eventId}`);
            setEvent(eventResponse.data);
            
            // Check if user is already registered (from event response)
            if (eventResponse.data?.is_registered) {
                setIsAlreadyRegistered(true);
            }

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
            setError('Failed to load event details');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setError('');

        try {
            // Prepare registration data from user info
            const nameParts = user.name ? user.name.split(' ') : ['', ''];
            const firstName = nameParts[0] || '';
            const lastName = nameParts.slice(1).join(' ') || '';

            const registrationData = {
                first_name: firstName,
                last_name: lastName,
                email: user.email || '',
                phone: user.phone || '',
                address: user.address || '',
                terms_accepted: true
            };

            const response = await api.post(`/events/${eventId}/join`, registrationData);
            
            // Mark as registered
            setIsAlreadyRegistered(true);
            
            // Send analytics data for event registration
            try {
                await api.post('/analytics/event-registration', {
                    event_id: eventId,
                    event_title: event?.title || 'Unknown Event',
                    registration_date: new Date().toISOString(),
                    participant_data: {
                        name: user.name,
                        email: user.email,
                        phone: user.phone,
                        address: user.address
                    }
                });
            } catch (analyticsError) {
                console.warn('Analytics tracking failed:', analyticsError);
                // Don't show error to user, just log it
            }
            
            setSuccess(true);
            
            // Redirect to events page after 2 seconds
            setTimeout(() => {
                navigate('/events');
            }, 2000);

        } catch (error) {
            console.error('Error submitting registration:', error);
            setError(error.response?.data?.message || 'Failed to submit registration. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#CD8B3E] mx-auto"></div>
                    <p className="mt-4 text-[#5C4B38]">Loading event details...</p>
                </div>
            </div>
        );
    }

    if (!event) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-red-600 mb-4">Event Not Found</h2>
                    <p className="text-[#5C4B38] mb-4">The requested event could not be found.</p>
                    <button 
                        onClick={() => navigate('/events')}
                        className="bg-[#3F2E1E] text-white px-6 py-2 rounded-lg hover:bg-[#2A1F15] transition-colors"
                    >
                        View Events
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
                    <h2 className="text-2xl font-bold text-green-600 mb-4">Registration Confirmed!</h2>
                    <p className="text-[#5C4B38] mb-4">
                        Thank you for registering for {event.title}. You will receive a confirmation email shortly.
                    </p>
                    <p className="text-sm text-[#5C4B38]">Redirecting to events page...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-2xl mx-auto px-4">
                <div className="bg-white rounded-lg shadow-lg p-8">
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold text-[#3F2E1E] mb-2">Event Registration</h1>
                        <p className="text-[#5C4B38]">Please confirm your registration details</p>
                    </div>

                    {/* Event Details */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
                        <h3 className="text-lg font-semibold text-blue-800 mb-3">Event Details</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <span className="font-medium text-gray-700">Event:</span>
                                <p className="text-gray-600">{event.title}</p>
                            </div>
                            <div>
                                <span className="font-medium text-gray-700">Date:</span>
                                <p className="text-gray-600">
                                    {event.date ? new Date(event.date).toLocaleDateString('en-US', {
                                        weekday: 'long',
                                        year: 'numeric',
                                        month: 'long', 
                                        day: 'numeric'
                                    }) : 'Date TBA'}
                                </p>
                            </div>
                            <div>
                                <span className="font-medium text-gray-700">Time:</span>
                                <p className="text-gray-600">{event.time || 'Time TBA'}</p>
                            </div>
                            <div>
                                <span className="font-medium text-gray-700">Location:</span>
                                <p className="text-gray-600">{event.location || 'Location TBA'}</p>
                            </div>
                        </div>
                        {event.description && (
                            <div className="mt-4">
                                <span className="font-medium text-gray-700">Description:</span>
                                <p className="text-gray-600 mt-1">{event.description}</p>
                            </div>
                        )}
                    </div>

                    {/* Login Required Section */}
                    {!user ? (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-8">
                            <div className="text-center">
                                <div className="text-yellow-600 text-4xl mb-4">🔐</div>
                                <h3 className="text-lg font-semibold text-yellow-800 mb-3">Login Required</h3>
                                <p className="text-yellow-700 mb-4">
                                    Please log in to register for this event. Your information will be automatically filled in after login.
                                </p>
                                <div className="space-x-4">
                                    <button
                                        onClick={() => navigate(`/login?redirect=events&event_id=${eventId}`)}
                                        className="px-6 py-3 bg-[#3F2E1E] text-white rounded-lg hover:bg-[#2A1F15] transition-colors"
                                    >
                                        Login to Register
                                    </button>
                                    <button
                                        onClick={() => navigate('/events')}
                                        className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                                    >
                                        View Events
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
                                <div>
                                    <span className="font-medium text-gray-700">Phone:</span>
                                    <p className="text-gray-600">{user?.phone || 'Not provided'}</p>
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

                    {user && isAlreadyRegistered && (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-8">
                            <div className="text-center">
                                <div className="text-green-600 text-4xl mb-4">✓</div>
                                <h3 className="text-lg font-semibold text-green-800 mb-3">Already Registered</h3>
                                <p className="text-green-700 mb-4">
                                    You are already registered for this event. Thank you for your registration!
                                </p>
                                <button
                                    onClick={() => navigate('/events')}
                                    className="px-6 py-3 bg-[#3F2E1E] text-white rounded-lg hover:bg-[#2A1F15] transition-colors"
                                >
                                    View Events
                                </button>
                            </div>
                        </div>
                    )}

                    {user && !isAlreadyRegistered && (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                <p className="text-yellow-800 text-sm">
                                    <strong>Note:</strong> By confirming your registration, you agree to attend the event as scheduled. 
                                    You will receive a confirmation email shortly. Please arrive on time and follow all event guidelines.
                                </p>
                            </div>

                            <div className="flex justify-center space-x-4">
                                <button
                                    type="button"
                                    onClick={() => navigate('/events')}
                                    className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="px-8 py-3 bg-[#3F2E1E] text-white rounded-lg hover:bg-[#2A1F15] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    {submitting ? 'Registering...' : 'Confirm Registration'}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

export default JoinEvent;
