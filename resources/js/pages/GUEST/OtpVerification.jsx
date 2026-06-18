import React, { useState, useEffect, useRef } from 'react';
import api, { auth } from '../../utils/axios';
import { useLocation, useNavigate } from 'react-router-dom';
import '../../../css/register.css'; // Import the CSS file

const OtpVerification = () => {
    // Format timer as MM:SS
    const formatTimer = (seconds) => {
        const m = Math.floor(seconds / 60).toString().padStart(2, '0');
        const s = (seconds % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    };
    const [otp, setOtp] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [resending, setResending] = useState(false);
    const [loading, setLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [timer, setTimer] = useState(180); // 3 minutes in seconds
    const timerRef = useRef();
    const navigate = useNavigate();
    const location = useLocation();
    const email = location.state?.email;

    if (!email) {
        // Redirect back to registration if email is not available
        navigate('/register');
        return null;
    }

    // Start timer on mount or when resend is triggered
    useEffect(() => {
        if (timer > 0) {
            timerRef.current = setInterval(() => {
                setTimer((prev) => prev - 1);
            }, 1000);
        }
        return () => clearInterval(timerRef.current);
    }, [timer]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        try {
            await api.post('/otp/verify', { email, otp });
            
            // Fetch the authenticated user and persist locally
            try {
                const me = await api.get('/me', { withCredentials: true });
                if (me && me.data) {
                    const buildFullName = (u) => {
                        const parts = [u?.first_name, u?.middle_name, u?.last_name, u?.suffix].filter(Boolean);
                        return parts.join(' ').trim();
                    };
                    const normalized = { ...me.data, name: me.data?.name || buildFullName(me.data) || 'User Name' };
                    localStorage.setItem('user', JSON.stringify(normalized));
                    window.dispatchEvent(new Event('userLogin'));
                }
            } catch (e) {
                // Non-fatal: continue navigation even if /api/me fails
                console.warn('Failed to fetch current user after OTP verify:', e);
            }

            setSuccess('Email verified successfully! You are now logged in.');

            // Check if this is a redirect from mass-attendance
            const redirect = location.state?.redirect;
            const massId = location.state?.massId;

            if (redirect === 'mass-attendance' && massId) {
                setTimeout(() => navigate(`/mass-attendance/${massId}`), 2000);
            } else {
                // Redirect to home or dashboard after a delay
                setTimeout(() => navigate('/'), 2000);
            }
        } catch (err) {
            setError(err.response?.data?.message || 'An error occurred during verification.');
        } finally {
            setLoading(false);
        }
    };

    // Reset timer when resend is triggered
    const handleResendOtp = async () => {
        setResending(true);
        setError('');
        setSuccess('');
        try {
            await api.post('/otp/resend', { email });
            setSuccess('A new OTP has been sent to your email address.');
            setTimer(180); // Reset timer to 3 minutes
        } catch (err) {
            setError(err.response?.data?.message || 'An error occurred while resending OTP.');
        } finally {
            setResending(false);
        }
    };

    const modal = showModal && (
        <div style={{
            position: 'fixed',
            top: 0, left: 0, width: '100vw', height: '100vh',
            background: 'rgba(44,44,44,0.25)',
            backdropFilter: 'blur(6px)',
            WebkitBackdropFilter: 'blur(6px)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
        }}>
            <div style={{
                background: '#fff',
                borderRadius: 16,
                boxShadow: '0 8px 32px rgba(60,40,20,0.18)',
                padding: '2.5rem 2.5rem 2rem 2.5rem',
                minWidth: 320,
                maxWidth: 400,
                width: '100%',
                textAlign: 'center'
            }}>
                <h2 style={{ color: '#3F2E1E', fontWeight: 700, fontSize: '1.5rem', marginBottom: 8 }}>
                    Certificate Request Submitted
                </h2>
                <p style={{ color: '#5C4B38', fontSize: 16, marginBottom: 24 }}>
                    Your request has been received. We will contact you soon!
                </p>
                <button
                    style={{
                        background: '#CD8B3E',
                        color: '#fff',
                        border: 'none',
                        borderRadius: 8,
                        padding: '10px 32px',
                        fontWeight: 700,
                        fontSize: 16,
                        cursor: 'pointer',
                        boxShadow: '0 2px 8px rgba(205,139,62,0.10)',
                        transition: 'background 0.2s'
                    }}
                    onClick={() => setShowModal(false)}
                >
                    Close
                </button>
            </div>
        </div>
    );

    return (
        <div className="login-page">
            <div className="bg-white border border-[#f2e4ce] rounded-2xl shadow-lg p-8 w-full max-w-md">
                <h1 className="text-3xl font-bold text-[#3F2E1E] mb-2 text-center">Verify Your Email</h1>
                <p className="text-[#5C4B38] text-center mb-6">
                    An OTP has been sent to <strong>{email}</strong>. Please enter it below.
                </p>


                {error && <div className="text-red-500 mb-4 text-center">{error}</div>}
                {success && <div className="text-green-600 mb-4 text-center">{success}</div>}
                {timer <= 0 && !success && (
                    <div className="text-red-500 mb-4 text-center">OTP has expired. Please resend to get a new OTP.</div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="otp" className="block mb-2 text-sm font-medium text-[#3F2E1E]">One-Time Password (OTP)</label>
                        <input
                            id="otp"
                            type="text"
                            value={otp}
                            onChange={(e) => setOtp(e.target.value)}
                            placeholder="Enter 6-digit OTP"
                            maxLength="6"
                            required
                            className="w-full p-3 border border-[#f2e4ce] rounded-lg focus:ring-2 focus:ring-[#CD8B3E] focus:border-[#CD8B3E] text-center"
                            disabled={timer <= 0 || loading}
                        />
                    </div>

                    {loading && (
                        <div style={{
                            position: 'fixed',
                            top: 0, left: 0, width: '100vw', height: '100vh',
                            background: 'rgba(44,44,44,0.15)',
                            backdropFilter: 'blur(2px)',
                            WebkitBackdropFilter: 'blur(2px)',
                            zIndex: 2000,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <div className="loader"></div>
                            <style>{`
                                .loader {
                                    border: 6px solid #f3f3f3;
                                    border-top: 6px solid #CD8B3E;
                                    border-radius: 50%;
                                    width: 48px;
                                    height: 48px;
                                    animation: spin 1s linear infinite;
                                }
                                @keyframes spin {
                                    0% { transform: rotate(0deg); }
                                    100% { transform: rotate(360deg); }
                                }
                            `}</style>
                        </div>
                    )}

                    <button
                        type="submit"
                        className="w-full bg-[#CD8B3E] text-white py-3 px-4 rounded-lg hover:bg-[#B77B35] transition duration-300"
                        disabled={loading || timer <= 0}
                    >
                        {loading ? 'Verifying...' : 'Verify Account'}
                    </button>
                </form>

                <div className="text-center mt-4">
                    <button
                        onClick={handleResendOtp}
                        disabled={resending || timer > 0}
                        className="text-sm text-[#CD8B3E] hover:text-[#B77B35] disabled:opacity-50"
                    >
                        {resending
                            ? 'Resending...'
                            : timer > 0
                                ? `Resend OTP (${formatTimer(timer)})`
                                : 'Resend OTP'}
                    </button>
                </div>
            </div>
            {modal}
        </div>
    );
};

export default OtpVerification;