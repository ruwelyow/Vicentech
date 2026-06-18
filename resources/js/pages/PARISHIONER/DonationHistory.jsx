import React, { useEffect, useState } from 'react';
import '../../../css/events.css';
import { api } from '../../utils/axios';
import { getUser } from '../../utils/auth';

const DonationHistory = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchHistory = async () => {
    setLoading(true);
    setError(null);
    try {
      // Try to get currently stored user
      let user = getUser();

      // If no user is stored, attempt a lightweight /me call to populate it
      if (!user) {
        try {
          const meRes = await api.get('/me');
          user = meRes.data;
          localStorage.setItem('user', JSON.stringify(user));
        } catch (_e) {
          // If we can't get user, we'll bail with empty history
          setHistory([]);
          setLoading(false);
          return;
        }
      }

      const res = await api.get('/donations');
      const list = Array.isArray(res.data) ? res.data : [];

      // Filter to donations that belong to this user and are verified by staff
      const filtered = list.filter(d => {
        // donation may use `email` and `verified` fields
        return (d.email === user.email) && (d.verified === true || d.verified === 1);
      }).map(d => ({
        date: d.created_at ? new Date(d.created_at).toLocaleDateString() : (d.date || ''),
        amount: d.amount,
        purpose: d.purpose_name || d.category || d.purpose || 'Donation',
        raw: d
      }));

      setHistory(filtered);
    } catch (err) {
      console.error('Failed to fetch donation history', err);
      setError('Failed to load donation history');
      setHistory([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();

    // Listen for staff verification events to refresh list
    const handler = () => fetchHistory();
    window.addEventListener('donationVerified', handler);

    return () => {
      window.removeEventListener('donationVerified', handler);
    };
  }, []);

  return (
    <div className="events-page">
      <section className="events-hero text-center">
        <div className="bg-white border border-[#f2e4ce] shadow-lg p-8 pb-10 w-full mt-6">
          <h1 className="text-5xl font-extrabold text-[#3F2E1E] mb-3 tracking-tight font-['Times_New_Roman']">Donation History</h1>
          <p className="text-lg text-[#5C4B38] max-w-2xl mx-auto leading-relaxed">
            View your complete donation history.
          </p>
        </div>
      </section>
      <div className="bg-white border border-[#f2e4ce] rounded-2xl shadow-lg p-8 max-w-3xl mx-auto -mt-16">
        <table className="w-full text-left rounded-2xl overflow-hidden">
          <thead>
            <tr className="bg-[#FFF6E5] text-[#3F2E1E]">
              <th className="py-3 px-4 font-semibold text-lg border-b border-[#f2e4ce]">Date</th>
              <th className="py-3 px-4 font-semibold text-lg border-b border-[#f2e4ce]">Amount</th>
              <th className="py-3 px-4 font-semibold text-lg border-b border-[#f2e4ce]">Purpose</th>
            </tr>
          </thead>
          <tbody>
            {history.length === 0 ? (
              <tr><td colSpan="3" className="text-center py-6 text-[#B77B35]">No donations yet.</td></tr>
            ) : (
              history.map((d, idx) => (
                <tr key={idx} className="hover:bg-[#FFF6E5] transition">
                  <td className="py-3 px-4 border-b border-[#f2e4ce] text-[#5C4B38]">{d.date}</td>
                  <td className="py-3 px-4 border-b border-[#f2e4ce] text-[#5C4B38]">₱{d.amount}</td>
                  <td className="py-3 px-4 border-b border-[#f2e4ce] text-[#5C4B38]">{d.purpose}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DonationHistory; 