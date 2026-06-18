import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import SuccessPopup from '../../components/SuccessPopup';

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

const ResetPassword = () => {
  const query = useQuery();
  const token = query.get('token') || '';
  const emailFromUrl = query.get('email') || '';
  const [email, setEmail] = useState(emailFromUrl);
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPasswordReqs, setShowPasswordReqs] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [successTitle, setSuccessTitle] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const navigate = useNavigate();

  // Password requirements
  const passwordRequirements = [
    {
      label: "At least 8 characters",
      test: (pw) => pw.length >= 8,
    },
    {
      label: "At least one uppercase letter",
      test: (pw) => /[A-Z]/.test(pw),
    },
    {
      label: "At least one lowercase letter",
      test: (pw) => /[a-z]/.test(pw),
    },
    {
      label: "At least one number",
      test: (pw) => /[0-9]/.test(pw),
    },
    {
      label: "At least one special character",
      test: (pw) => /[^A-Za-z0-9]/.test(pw),
    },
  ];

  const passwordChecks = passwordRequirements.map(req => req.test(password));
  const allPasswordValid = passwordChecks.every(Boolean);
  const passwordsMatch = password && password === passwordConfirmation;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    
    if (password !== passwordConfirmation) {
      setError('Passwords do not match.');
      return;
    }
    
    if (!allPasswordValid) {
      setError('Please ensure your password meets all requirements.');
      return;
    }
    
    setLoading(true);
    try {
      // Get CSRF token
      const csrfResponse = await fetch('/csrf-token', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'X-Requested-With': 'XMLHttpRequest',
        },
      });
      const csrfData = await csrfResponse.json();
      const csrfToken = csrfData.csrf_token;

      // Send reset password request
      const response = await fetch('/password/reset', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': csrfToken,
          'X-Requested-With': 'XMLHttpRequest',
        },
        body: JSON.stringify({
          token,
          email,
          password,
          password_confirmation: passwordConfirmation,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.message || 'Failed to reset password.');
        return;
      }
      setMessage('');
      setSuccessTitle('Password Reset');
      setSuccessMessage('Your password was reset successfully. Please log in.');
      setShowSuccessPopup(true);
      setTimeout(() => navigate('/login'), 1500);
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-8" style={{ background: '#e8d7b9' }}>
      <div className="bg-white border border-[#f2e4ce] shadow-lg rounded-2xl p-10 w-full max-w-md mx-auto">
        <h1 className="text-3xl font-extrabold text-[#3F2E1E] mb-6 text-center font-['Times_New_Roman']">Reset Password</h1>
        
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="email" className="block mb-2 text-sm font-medium text-[#3F2E1E]">Email Address</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full p-3 border border-[#f2e4ce] rounded-lg focus:ring-2 focus:ring-[#CD8B3E] focus:border-[#CD8B3E]"
              placeholder="Enter your email"
              required
              disabled={loading}
            />
          </div>

          <div>
            <label htmlFor="password" className="block mb-2 text-sm font-medium text-[#3F2E1E]">New Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                onFocus={() => setShowPasswordReqs(true)}
                className="w-full p-3 pr-12 border border-[#f2e4ce] rounded-lg focus:ring-2 focus:ring-[#CD8B3E] focus:border-[#CD8B3E]"
                placeholder="Enter your new password"
                required
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                disabled={loading}
              >
                {showPassword ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
            
            {/* Password Requirements */}
            {showPasswordReqs && (
              <div className="mt-3 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Password Requirements:</h4>
                <ul className="space-y-1">
                  {passwordRequirements.map((req, index) => (
                    <li key={index} className={`text-xs flex items-center ${
                      passwordChecks[index] ? 'text-green-600' : 'text-gray-500'
                    }`}>
                      <span className="mr-2">
                        {passwordChecks[index] ? (
                          <svg width="12" height="12" fill="none" viewBox="0 0 12 12">
                            <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" fill="none"/>
                          </svg>
                        ) : (
                          <svg width="12" height="12" fill="none" viewBox="0 0 12 12">
                            <circle cx="6" cy="6" r="4" stroke="currentColor" strokeWidth="2" fill="none"/>
                          </svg>
                        )}
                      </span>
                      {req.label}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div>
            <label htmlFor="passwordConfirmation" className="block mb-2 text-sm font-medium text-[#3F2E1E]">Confirm New Password</label>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                id="passwordConfirmation"
                value={passwordConfirmation}
                onChange={e => setPasswordConfirmation(e.target.value)}
                className="w-full p-3 pr-12 border border-[#f2e4ce] rounded-lg focus:ring-2 focus:ring-[#CD8B3E] focus:border-[#CD8B3E]"
                placeholder="Confirm your new password"
                required
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                disabled={loading}
              >
                {showConfirmPassword ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
            {passwordConfirmation && (
              <div className={`text-xs mt-1 flex items-center ${
                passwordsMatch ? 'text-green-600' : 'text-red-500'
              }`}>
                <span className="mr-1">
                  {passwordsMatch ? (
                    <svg width="12" height="12" fill="none" viewBox="0 0 12 12">
                      <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" fill="none"/>
                    </svg>
                  ) : (
                    <svg width="12" height="12" fill="none" viewBox="0 0 12 12">
                      <circle cx="6" cy="6" r="4" stroke="currentColor" strokeWidth="2" fill="none"/>
                    </svg>
                  )}
                </span>
                {passwordsMatch ? 'Passwords match' : 'Passwords do not match'}
              </div>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-red-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-red-700 text-sm font-medium">{error}</span>
              </div>
            </div>
          )}

          {/* Success Message */}
          {message && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-green-700 text-sm font-medium">{message}</span>
              </div>
            </div>
          )}

          <button
            type="submit"
            className={`w-full py-3 px-4 rounded-lg font-bold transition duration-300 ${
              loading || !allPasswordValid || !passwordsMatch || !email
                ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                : 'bg-[#CD8B3E] text-white hover:bg-[#B77B35]'
            }`}
            disabled={loading || !allPasswordValid || !passwordsMatch || !email}
          >
            {loading ? 'Resetting Password...' : 'Reset Password'}
          </button>
        </form>
      </div>
      {/* Success Popup */}
      <SuccessPopup
        isOpen={showSuccessPopup}
        onClose={() => setShowSuccessPopup(false)}
        title={successTitle}
        message={successMessage}
        duration={1500}
      />
    </div>
  );
};

export default ResetPassword; 