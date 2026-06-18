import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../../utils/axios';
import { isAuthenticated, getUser } from '../../utils/auth';
import '../../../css/prayerRequest.css';
import { format } from 'date-fns';
import useFormPersistence from '../../hooks/useFormPersistence';

const initialFormState = {
    title: '',
    request: ''
};

const PrayerRequest = () => {
    const [formData, setFormData, clearFormData] = useFormPersistence('prayer-request-form', initialFormState);
    const { title, request } = formData;
    const setTitle = (value) => setFormData(prev => ({ ...prev, title: value }));
    const setRequest = (value) => setFormData(prev => ({ ...prev, request: value }));
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [approvedRequests, setApprovedRequests] = useState([]);
    const [showForm, setShowForm] = useState(false);

    const fetchApprovedRequests = useCallback(async () => {
        try {
            const response = await api.get('/approved-prayer-requests');
            setApprovedRequests(Array.isArray(response.data) ? response.data : (Array.isArray(response.data.data) ? response.data.data : []));
        } catch (err) {
            console.error('Failed to fetch approved requests:', err);
        }
    }, []);

    useEffect(() => {
        fetchApprovedRequests();
    }, [fetchApprovedRequests]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess(false);
        setLoading(true);
      
        try {
          // Check if user is authenticated
          if (!isAuthenticated()) {
            setError('You must be logged in to submit a prayer request. Please log in and try again.');
            setLoading(false);
            return;
          }

          // Post the prayer request (CSRF token handled by axios interceptor)
          await api.post('/prayer-request', {
            title,
            request,
          });
      
          setSuccess(true);
          clearFormData(); // Clear form data from localStorage and state
          setShowForm(false); // Close the modal on success
        } catch (err) {
          console.error('Prayer request error:', err);
          
          if (err.response?.status === 401) {
            setError('Your session has expired. Please log in again and try submitting your prayer request.');
            // Clear invalid auth data
            localStorage.removeItem('user');
          } else if (err.response?.status === 419) {
            setError('Security token expired. Please refresh the page and try again.');
          } else if (err.response?.data?.message) {
            setError(err.response.data.message);
          } else {
            setError('Failed to create prayer request. Please try again.');
          }
        } finally {
          setLoading(false);
        }
      };
      
      console.log('approvedRequests:', approvedRequests);
    
    return (
        <div className="prayer-page min-h-screen pb-20">
            <section className="prayer-hero text-center">
                <div className="bg-white border border-[#f2e4ce] shadow-lg p-8 pb-10 w-full mt-6">
                    <h1 className="text-5xl font-extrabold text-[#3F2E1E] mb-3 tracking-tight font-['Times_New_Roman']">Prayer Request</h1>
                    <p className="text-lg text-[#5C4B38] max-w-2xl mx-auto leading-relaxed">
                        Share your prayer intentions with us. We will include them in our daily prayers and masses.
                    </p>
                </div>
            </section>

            {/* Only the Community Prayers container remains, with the message inside as a column */}
            <div
                className="approved-requests-container"
                style={{
                    position: 'relative',
                    maxWidth: '1400px',
                    width: '95vw',
                    margin: '2.5rem auto',
                    background: '#fff',
                    borderRadius: '1.5rem',
                    boxShadow: '0 6px 24px rgba(0,0,0,0.10)',
                    padding: '3rem 2rem',
                    display: 'flex',
                    flexDirection: 'row',
                    gap: '2.5rem',
                    flexWrap: 'wrap',
                }}
            >
                {/* Left: Value of Praying message (inside container) */}
                <div style={{flex: 1, minWidth: 280, maxWidth: 400, alignSelf: 'flex-start', background: '#FFF8E1', borderRadius: '1rem', boxShadow: '0 2px 8px rgba(205,139,62,0.07)', padding: '2rem', marginTop: '6rem'}}>
                    <h3 style={{color: '#CD8B3E', fontWeight: 700, fontSize: '1.4rem', marginBottom: '1rem'}}>The Value of Praying</h3>
                    <p style={{color: '#5C4B38', fontSize: '1.1rem', lineHeight: 1.7}}>
                        Prayer is a powerful way to connect with God, seek guidance, and find peace in our hearts. Through prayer, we support one another, express gratitude, and ask for strength in times of need. Your intentions, shared here, become part of a community of faith and hope.
                    </p>
                </div>
                {/* Right: Community Prayers list */}
                <div style={{flex: 2, minWidth: 0}}>
                    <div className="flex items-center justify-between w-full" style={{marginBottom: '2rem'}}>
                        <h2 className="approved-requests-title" style={{fontSize: '2rem', fontWeight: 700, color: '#CD8B3E', margin: 0}}>
                            Community Prayers
                        </h2>
                        {isAuthenticated() ? (
                            <button
                                className="bg-[#CD8B3E] text-white px-4 py-2 rounded-lg shadow hover:bg-[#B77B35] transition text-sm font-semibold"
                                onClick={() => setShowForm(true)}
                            >
                                Create Prayer Request
                            </button>
                        ) : (
                            <div className="text-center">
                                <p className="text-sm text-[#5C4B38] mb-2">You must be logged in to submit a prayer request</p>
                                <button
                                    className="bg-[#CD8B3E] text-white px-4 py-2 rounded-lg shadow hover:bg-[#B77B35] transition text-sm font-semibold"
                                    onClick={() => window.location.href = '/login'}
                                >
                                    Log In
                                </button>
                            </div>
                        )}
                    </div>
                    <div className="approved-requests-list w-full" style={{maxWidth: '900px', margin: '0 auto'}}>
                        {approvedRequests.length > 0 ? (
                            approvedRequests.map(req => (
                                <div key={req.id} className="approved-request-item">
                                    {req.title && (
                                        <div className="font-bold text-lg text-[#3F2E1E] mb-1 flex items-center gap-2">
                                            <img src="/images/praying hands.png" alt="Praying Hands" style={{width: 32, height: 32, marginRight: 8, display: 'inline-block', verticalAlign: 'middle'}} />
                                            {req.title}
                                        </div>
                                    )}
                                    <p className="request-text-public">"{req.request}"</p>
                                    <div className="request-meta">
                                        <span>Prayed for by: <strong>{req.name}</strong></span>
                                        <span>Approved on: {format(new Date(req.updated_at), 'MMM dd, yyyy')}</span>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="no-approved-requests">No community prayers to display at this time.</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Prayer Request Form as Modal */}
            {showForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
                    <div className="bg-white rounded-lg shadow-lg p-6 max-w-lg w-full relative">
                        <button
                            className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 text-2xl font-bold"
                            onClick={() => setShowForm(false)}
                            aria-label="Close"
                        >
                            &times;
                        </button>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <label htmlFor="prayer-title" className="block mb-2 text-sm font-medium text-[#3F2E1E]">Prayer Title</label>
                                <input
                                    id="prayer-title"
                                    name="prayer-title"
                                    type="text"
                                    value={title}
                                    onChange={e => setTitle(e.target.value)}
                                    className="w-full p-3 border border-[#f2e4ce] rounded-lg focus:ring-2 focus:ring-[#CD8B3E] focus:border-[#CD8B3E]"
                                    placeholder="Enter a title for your prayer..."
                                    required
                                />
                            </div>
                            <div>
                                <label htmlFor="request" className="block mb-2 text-sm font-medium text-[#3F2E1E]">Prayer Request</label>
                                <textarea
                                    id="request"
                                    name="request"
                                    value={request}
                                    onChange={(e) => setRequest(e.target.value)}
                                    rows="4"
                                    className="w-full p-3 border border-[#f2e4ce] rounded-lg focus:ring-2 focus:ring-[#CD8B3E] focus:border-[#CD8B3E]"
                                    placeholder="Please share your prayer intention..."
                                    required
                                ></textarea>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className={`w-full bg-[#CD8B3E] text-white py-3 px-4 rounded-lg transition duration-300 ${
                                    loading ? 'opacity-60 cursor-not-allowed' : 'hover:bg-[#B77B35]'
                                }`}
                            >
                                {loading ? 'Submitting...' : 'Create Prayer Request'}
                            </button>

                            {success && (
                                <p className="text-center text-sm text-green-600">
                                    Your prayer request has been submitted successfully.
                                </p>
                            )}

                            {error && (
                                <p className="text-center text-sm text-red-600">
                                    {error}
                                </p>
                            )}

                            <p className="text-center text-sm text-[#5C4B38]">
                                Your prayer request will be included in our daily prayers and masses
                            </p>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PrayerRequest;
