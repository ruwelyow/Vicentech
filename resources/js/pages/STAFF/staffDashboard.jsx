import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../../css/staffDashboard.css';
import StaffSidebar from '../../components/StaffSidebar';
import StaffMortuary from './StaffMortuary';
import StaffCertificates from './StaffCertificates';
import StaffSacraments from './StaffSacraments';
import StaffRecords from './StaffRecords';
import PriestCalendar from './PriestCalendar';
import StaffGive from './StaffGive';
import { initialMortuaryData } from '../../data/mortuaryData';
import { performLogout } from '../../utils/logout';

const CERT_STORAGE_KEY = 'certificatesData';
const SACRAMENT_STORAGE_KEY = 'sacramentsData';

// SVG icons for staff dashboard
const DashboardIcon = (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="#806c4b" className="w-6 h-6">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.5V6.75A2.25 2.25 0 015.25 4.5h13.5A2.25 2.25 0 0121 6.75v6.75m-18 0v4.5A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75v-4.5m-18 0h18" />
  </svg>
);

const MortuaryIcon = (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="#806c4b" className="w-6 h-6">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z" />
  </svg>
);

const CertificateIcon = (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="#806c4b" className="w-6 h-6">
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
  </svg>
);

const SacramentIcon = (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="#806c4b" className="w-6 h-6">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V19.5a2.25 2.25 0 002.25 2.25h.75M4.5 6.75h9.75a2.25 2.25 0 012.25 2.25v9.75m-9.75 0h9.75" />
  </svg>
);

const StaffDashboard = () => {
  const [activeSection, setActiveSection] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);
  const [summary, setSummary] = useState({
    mortuaryRacks: 0,
    availableRacks: 0,
    pendingCertificates: 0,
    processingCertificates: 0,
    completedCertificates: 0,
    rejectedCertificates: 0,
    pendingSacraments: 0,
    processingSacraments: 0,
    approvedSacraments: 0,
    rejectedSacraments: 0,
  });
  const navigate = useNavigate();

  const recentRequests = [
    { id: 1, type: 'Certificate', detail: 'Baptismal Certificate - Juan Dela Cruz', status: 'Pending', date: '2024-03-15' },
    { id: 2, type: 'Sacrament', detail: 'Marriage - Maria Santos & Pedro Reyes', status: 'Approved', date: '2024-03-14' },
    { id: 3, type: 'Mortuary', detail: 'Rack B12 - Reserved', status: 'Active', date: '2024-03-13' },
    { id: 4, type: 'Certificate', detail: 'Marriage Certificate - Ana Garcia', status: 'Processing', date: '2024-03-12' },
  ];

  const loadDashboardSummary = () => {
    // Mortuary
    let mortuaryData = JSON.parse(localStorage.getItem('mortuaryData'));
    if (!mortuaryData) {
      mortuaryData = initialMortuaryData;
      localStorage.setItem('mortuaryData', JSON.stringify(mortuaryData));
    }
    const totalRacks = mortuaryData.racks.length;
    const availableRacks = mortuaryData.racks.filter(rack => rack.status === 'available').length;

    // Certificates
    let certs = JSON.parse(localStorage.getItem(CERT_STORAGE_KEY));
    if (!certs) certs = [];
    const pendingCertificates = certs.filter(c => c.status === 'pending').length;
    const processingCertificates = certs.filter(c => c.status === 'processing').length;
    const completedCertificates = certs.filter(c => c.status === 'completed').length;
    const rejectedCertificates = certs.filter(c => c.status === 'rejected').length;

    // Sacraments
    let sacs = JSON.parse(localStorage.getItem(SACRAMENT_STORAGE_KEY));
    if (!sacs) sacs = [];
    const pendingSacraments = sacs.filter(s => s.status === 'pending').length;
    const processingSacraments = sacs.filter(s => s.status === 'processing').length;
    const approvedSacraments = sacs.filter(s => s.status === 'approved').length;
    const rejectedSacraments = sacs.filter(s => s.status === 'rejected').length;

    setSummary(prev => ({
      ...prev,
      mortuaryRacks: totalRacks,
      availableRacks,
      pendingCertificates,
      processingCertificates,
      completedCertificates,
      rejectedCertificates,
      pendingSacraments,
      processingSacraments,
      approvedSacraments,
      rejectedSacraments,
    }));
  };

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user || !user.is_staff) {
      navigate('/');
    }
    loadDashboardSummary();
    window.addEventListener('mortuaryDataUpdated', loadDashboardSummary);
    window.addEventListener('certificatesDataUpdated', loadDashboardSummary);
    window.addEventListener('sacramentsDataUpdated', loadDashboardSummary);
    window.addEventListener('sacramentAppointmentUpdated', loadDashboardSummary);
    return () => {
      window.removeEventListener('mortuaryDataUpdated', loadDashboardSummary);
      window.removeEventListener('certificatesDataUpdated', loadDashboardSummary);
      window.removeEventListener('sacramentsDataUpdated', loadDashboardSummary);
      window.removeEventListener('sacramentAppointmentUpdated', loadDashboardSummary);
    };
    // eslint-disable-next-line
  }, []); // <-- Only run once on mount

  const handleLogout = async () => {
    await performLogout(navigate, setLoggingOut);
  };

  return (
    <div className="staff-dashboard">
      <StaffSidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        activeSection={activeSection}
        setActiveSection={setActiveSection}
        handleLogout={handleLogout}
        DashboardIcon={DashboardIcon}
        MortuaryIcon={MortuaryIcon}
        CertificateIcon={CertificateIcon}
        SacramentIcon={SacramentIcon}
      />
      
      <main 
        className="staff-main-content"
        style={{
          marginLeft: window.innerWidth <= 768 ? '0' : (sidebarOpen ? '280px' : '80px'),
          transition: 'margin-left 0.2s'
        }}
      >
        {activeSection === 'dashboard' && (
          <>
            <h1 style={{ 
              fontSize: '3.5rem', 
              fontWeight: '700', 
              color: '#3F2E1E',
              letterSpacing: '2px',
              textTransform: 'uppercase',
              textAlign: 'center',
              marginBottom: '0.5rem',
              marginTop: '0'
            }}>WELCOME STAFF!</h1>
            <p style={{
              fontSize: '1.125rem',
              color: '#5C4B38',
              textAlign: 'center',
              marginTop: '0.5rem',
              marginBottom: '2rem',
              lineHeight: '1.6'
            }}>Your central hub for managing all parish operations and services.</p>
            <div className="summary-cards">
              <div className="summary-card">
                <div className="card-value">{summary.mortuaryRacks}</div>
                <div className="card-label">Total Racks</div>
                <div className="card-sublabel">{summary.availableRacks} Available</div>
              </div>
              <div className="summary-card">
                <div className="card-value">{summary.pendingCertificates}</div>
                <div className="card-label">Pending Certificates</div>
              </div>
              <div className="summary-card">
                <div className="card-value">{summary.processingCertificates}</div>
                <div className="card-label">Processing Certificates</div>
              </div>
              <div className="summary-card">
                <div className="card-value">{summary.completedCertificates}</div>
                <div className="card-label">Completed Certificates</div>
              </div>
              <div className="summary-card">
                <div className="card-value">{summary.rejectedCertificates}</div>
                <div className="card-label">Rejected Certificates</div>
              </div>
              <div className="summary-card">
                <div className="card-value">{summary.pendingSacraments}</div>
                <div className="card-label">Pending Sacraments</div>
              </div>
              <div className="summary-card">
                <div className="card-value">{summary.processingSacraments}</div>
                <div className="card-label">Processing Sacraments</div>
              </div>
              <div className="summary-card">
                <div className="card-value">{summary.approvedSacraments}</div>
                <div className="card-label">Approved Sacraments</div>
              </div>
              <div className="summary-card">
                <div className="card-value">{summary.rejectedSacraments}</div>
                <div className="card-label">Rejected Sacraments</div>
              </div>
            </div>

            <div className="recent-activities">
              <h2>Recent Requests</h2>
              <div className="activities-table">
                <div className="table-header">
                  <div>Type</div>
                  <div>Detail</div>
                  <div>Status</div>
                  <div>Date</div>
                </div>
                {recentRequests.map((request) => (
                  <div key={request.id} className="table-row">
                    <div>{request.type}</div>
                    <div>{request.detail}</div>
                    <div>
                      <span className={`status-badge ${request.status.toLowerCase()}`}>
                        {request.status}
                      </span>
                    </div>
                    <div>{request.date}</div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
        
        {activeSection === 'mortuary' && <StaffMortuary />}
        {activeSection === 'certificates' && <StaffCertificates />}
        {activeSection === 'sacraments' && <StaffSacraments />}
        {activeSection === 'records' && <StaffRecords />}
        {activeSection === 'priest-calendar' && <PriestCalendar />}
        {activeSection === 'give' && <StaffGive />}
      </main>
      
      {loggingOut && (
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
            <svg style={{ width: 64, height: 64, color: '#806c4b', marginBottom: 12 }} viewBox="0 0 50 50">
              <circle cx="25" cy="25" r="20" fill="none" stroke="#806c4b" strokeWidth="6" strokeDasharray="31.4 31.4" strokeLinecap="round">
                <animateTransform attributeName="transform" type="rotate" from="0 25 25" to="360 25 25" dur="1s" repeatCount="indefinite" />
              </circle>
            </svg>
            <div style={{ color: '#3F2E1E', fontWeight: 600, fontSize: 20, letterSpacing: 1 }}>Logging out...</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffDashboard;