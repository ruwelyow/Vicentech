import React, { useState } from 'react';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
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

      // Send password reset request
      const response = await fetch('/password/email', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': csrfToken,
          'X-Requested-With': 'XMLHttpRequest',
        },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.message || 'Failed to send reset email.');
        return;
      }
      setMessage('Password reset email sent! Check your inbox for further instructions.');
      setEmail('');
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#e8d7b9' }}>
      <div className="bg-white border border-[#f2e4ce] shadow-lg rounded-2xl p-6 w-full max-w-xs mx-auto">
        <h1 className="text-3xl font-bold text-[#3F2E1E] mb-2 text-center">Forgot Password</h1>
        <p class="text-[#5C4B38] text-center mb-6">Forgot your password?</p>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block mb-2 text-sm font-medium text-[#3F2E1E]">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full p-3 border border-[#f2e4ce] rounded-lg focus:ring-2 focus:ring-[#CD8B3E] focus:border-[#CD8B3E]"
              required
              disabled={loading}
            />
          </div>
          {error && <div className="text-center text-red-600 font-semibold">{error}</div>}
          {message && <div className="text-center text-[#B77B35] font-semibold">{message}</div>}
          <button
            type="submit"
            className="w-full bg-[#CD8B3E] text-white py-3 px-4 rounded-lg hover:bg-[#B77B35] transition duration-300 font-bold"
            disabled={loading}
          >
            {loading ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ForgotPassword; 