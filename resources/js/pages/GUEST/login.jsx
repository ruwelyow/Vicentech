import React, { useState, useEffect } from 'react';
import '../../../css/login.css';
import { useNavigate, Link, useSearchParams, useLocation } from 'react-router-dom';
import { auth, getCsrfToken } from '../../utils/axios';

const Login = () => {
    const [formData, setFormData] = useState({ email: '', password: '' }); // 'email' can also be username
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const location = useLocation();
    
    // Get redirect parameters
    const redirect = searchParams.get('redirect');
    const massId = searchParams.get('mass_id');
    
    // Check for message from location state (e.g., from chatbot redirect)
    useEffect(() => {
        if (location.state?.message) {
            setError(location.state.message);
        }
    }, [location.state]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.id]: e.target.value });    
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            // Always (re)fetch CSRF cookie before attempting login (cache-busted)
            await auth.get(`/sanctum/csrf-cookie?ts=${Date.now()}`, { withCredentials: true });

            const loginValue = formData.email.trim();
            if (!loginValue || !formData.password) {
                setError('Please enter your email/username and password.');
                setLoading(false);
                return;
            }

            // Decide whether input is email or username
            const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(loginValue);
            const payloadBase = isEmail
                ? { email: loginValue, password: formData.password }
                : { username: loginValue, password: formData.password };

            // Try to fetch token from server endpoint as well (extra safety)
            let token = getCsrfToken();
            try {
                const tRes = await fetch('/csrf-token', { credentials: 'include', headers: { 'X-Requested-With': 'XMLHttpRequest' } });
                if (tRes.ok) {
                    const t = await tRes.json();
                    token = t.csrf_token || token;
                }
            } catch (_) {}

            const payload = { ...payloadBase, _token: token };
            console.debug('[Login] payload', payload);

            // Attempt login and get user data
            let response;
            try {
                response = await auth.post('/login', payload, { headers: token ? { 'X-CSRF-TOKEN': token, 'X-XSRF-TOKEN': token } : {} });
            } catch (err) {
                // Handle potential CSRF mismatch by refreshing CSRF cookie once and retrying
                const status = err.response?.status;
                const message = err.response?.data?.message || '';
                if (status === 419 || /csrf/i.test(message)) {
                    try {
                        await auth.get(`/sanctum/csrf-cookie?ts=${Date.now()}`, { withCredentials: true });
                        response = await auth.post('/login', payload, { headers: token ? { 'X-CSRF-TOKEN': token, 'X-XSRF-TOKEN': token } : {} });
                    } catch (retryErr) {
                        throw retryErr;
                    }
                } else {
                    throw err;
                }
            }
            const { user } = response.data;

            const buildFullName = (u) => {
                const parts = [u?.first_name, u?.middle_name, u?.last_name, u?.suffix].filter(Boolean);
                return parts.join(' ').trim();
            };

            // Check if user account is deactivated
            if (user.status === 'inactive') {
                setError('Your account has been deactivated. Please contact an administrator for assistance.');
                localStorage.removeItem('user');
                return;
            }

            // Add login timestamp for deactivation detection
            const userWithLoginTime = {
                ...user,
                name: user?.name || buildFullName(user) || 'User Name',
                lastLoginTime: new Date().toISOString()
            };
            
            localStorage.setItem('user', JSON.stringify(userWithLoginTime));
            window.dispatchEvent(new Event('userLogin'));
            setSuccess(true);

            // Check if this is a redirect from mass-attendance
            if (redirect === 'mass-attendance' && massId) {
                navigate(`/mass-attendance/${massId}`);
            } else if (location.state?.redirectTo) {
                // Redirect back to the page they came from (e.g., home page)
                navigate(location.state.redirectTo);
            } else if (user.is_admin) {
                navigate('/admin/dashboard');
            } else if (user.is_staff) {
                navigate('/staff/dashboard');
            } else if (user.is_priest === 1 || user.is_priest === true || user.is_priest === '1') {
                navigate('/priest/dashboard');
            } else {
                navigate('/dashboard');
            }
        } catch (err) {
            console.error('Authentication error:', err);
            const resp = err.response?.data;
            
            // Check for unverified email error
            if (resp?.message === 'You must verify your email before logging in.' && formData.email) {
                // Optionally, trigger resend OTP here (or let OTP page handle it)
                navigate('/otp-verification', { state: { email: formData.email } });
                return;
            }
            
            // Check for deactivated account error
            if (resp?.message && (
                resp.message.toLowerCase().includes('deactivated') ||
                resp.message.toLowerCase().includes('inactive') ||
                resp.message.toLowerCase().includes('account disabled') ||
                resp.message.toLowerCase().includes('account suspended')
            )) {
                setError('Your account has been deactivated. Please contact an administrator for assistance.');
                return;
            }
            
            if (resp?.errors) {
                // collect first validation messages
                const messages = Object.values(resp.errors).flat().join('\n');
                setError(messages || resp.message || 'Validation failed');
            } else {
                setError(resp?.message || 'Authentication failed. Please try again.');
            }
            localStorage.removeItem('user');
        } finally {
            setLoading(false);
        }
    };
    
    return (
        <div className="login-page min-h-screen flex items-center justify-center">
            <div className="bg-white border border-[#f2e4ce] rounded-2xl shadow-lg p-8 w-full max-w-md">
                <h1 className="text-3xl font-bold text-[#3F2E1E] mb-2 text-center">Login</h1>
                <p className="text-[#5C4B38] text-center mb-6">Sign in to your account</p>

                {error && <div className="text-red-600 text-sm mb-4 text-center">{error}</div>}
                {success && <div className="text-green-600 text-sm mb-4 text-center">Login successful! Redirecting...</div>}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="email" className="block mb-2 text-sm font-medium text-[#3F2E1E]">Email or Username</label>
                            <input
                                type="text"
                                id="email"
                                className="w-full p-3 border border-[#f2e4ce] rounded-lg focus:ring-2 focus:ring-[#CD8B3E] focus:border-[#CD8B3E]"
                                placeholder="Enter your email or username"
                                value={formData.email}
                                onChange={handleChange}
                                required
                            />
                    </div>

                    <div>
                        <label htmlFor="password" className="block mb-2 text-sm font-medium text-[#3F2E1E]">Password</label>
                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                id="password"
                                className="w-full p-3 pr-10 border border-[#f2e4ce] rounded-lg focus:ring-2 focus:ring-[#CD8B3E] focus:border-[#CD8B3E]"
                                placeholder="Enter your password"
                                value={formData.password}
                                onChange={handleChange}
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(prev => !prev)}
                                className="absolute right-3 top-3 text-sm text-[#3F2E1E] hover:text-[#CD8B3E]"
                                tabIndex={-1}
                            >
                                {showPassword ? 'Hide' : 'Show'}
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className={`w-full bg-[#CD8B3E] text-white py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition duration-300 ${
                            loading ? 'opacity-60 cursor-not-allowed' : 'hover:bg-[#B77B35]'
                        }`}
                    >
                        {loading && (
                            <svg
                                className="w-5 h-5 animate-spin text-white"
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                            >
                                <circle
                                    className="opacity-25"
                                    cx="12"
                                    cy="12"
                                    r="10"
                                    stroke="currentColor"
                                    strokeWidth="4"
                                />
                                <path
                                    className="opacity-75"
                                    fill="currentColor"
                                    d="M4 12a8 8 0 018-8v8z"
                                />
                            </svg>
                        )}
                        {loading ? 'Signing in...' : 'Sign In'}
                    </button>

                    <div className="text-center text-sm text-[#5C4B38]">
                        <Link to="/forgot-password" className="text-[#CD8B3E] hover:text-[#B77B35]">Forgot Password?</Link>
                    </div>

                    <p className="text-center text-sm text-[#5C4B38]">
                        Don't have an account?{' '}
                        <Link to="/register" className="text-[#CD8B3E] hover:text-[#B77B35]">
                            Sign up
                        </Link>
                    </p>
                </form>
            </div>
        </div>
    );
};

export default Login;
