import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import CookieConsent from './CookieConsent';
import axios from 'axios';
import { api } from '../utils/axios';

// Import your components/pages
import Appoint from '../pages/PARISHIONER/appoint';
import About from '../pages/GUEST/about';
import Contact from '../pages/GUEST/Contact';
import Apply from '../pages/PARISHIONER/apply';
import Login from '../pages/GUEST/login';
import Request from '../pages/PARISHIONER/prayerRequest';
import Register from '../pages/GUEST/register';
import Home from '../pages/GUEST/home';
import SearchPage from '../pages/GUEST/SearchPage';
import Pray from '../pages/GUEST/pray';
import Events from '../pages/GUEST/events';
import JoinEvent from '../pages/GUEST/join-event';
import MassSchedule from '../pages/GUEST/mass-schedule';
import CertificateRequest from '../pages/PARISHIONER/certificateRequest';
import Give from '../pages/PARISHIONER/Give';
import Profile from '../pages/PARISHIONER/Profile';
import PriestProfile from '../pages/PRIEST/PriestProfile';
import AdminDashboard from '../pages/ADMIN/adminDashboard';
import StaffDashboard from '../pages/STAFF/staffDashboard';
import CertificateGenerator from '../pages/STAFF/CertificateGenerator';
import StaffCertificates from '../pages/STAFF/StaffCertificates';
import RoleRoute from '../src/RoleRoute';
import PARISHIONERGALLERY from '../pages/PARISHIONER/ParishionerGallery';
import PriestDashboard from '../pages/PRIEST/priestDashboard';
import AdminProfile from '../pages/ADMIN/AdminProfile';
import StaffProfile from '../pages/STAFF/StaffProfile';
import AdminUsers from '../pages/ADMIN/AdminUsers';
import AdminMembership from '../pages/ADMIN/AdminMembership';
import AdminGalleryContainer from '../pages/ADMIN/AdminGalleryContainer';
import AdminEventsContainer from '../pages/ADMIN/AdminEventsContainer';
import AdminAnnouncements from '../pages/ADMIN/AdminAnnouncements';
import AdminRequests from '../pages/ADMIN/AdminPrayerRequest';
import AdminLayout from './AdminLayout';
import StaffLayoutWithRouting from './StaffLayoutWithRouting';
import Notifications from './Notifications';
import AdminMinistryApplicants from '../pages/ADMIN/AdminMinistryApplicants';
import OtpVerification from '../pages/GUEST/OtpVerification';
import AdminServerTypes from '../pages/ADMIN/AdminServerTypes';
import AdminNews from '../pages/ADMIN/AdminNews';
import HistoricalProfile from '../pages/GUEST/HistoricalProfile';
import NewsDetail from '../pages/GUEST/NewsDetail';
import News from '../pages/GUEST/News';
import ChangePassword from '../pages/PARISHIONER/ChangePassword';
import SacramentHistory from '../pages/PARISHIONER/SacramentHistory';
import DonationHistory from '../pages/PARISHIONER/DonationHistory';
import ForgotPassword from '../pages/GUEST/ForgotPassword';
import ResetPassword from '../pages/GUEST/ResetPassword';
import ShrineRectorsAdmin from '../pages/admin/ShrineRectorsAdmin';
import AdminMassSchedule from '../pages/ADMIN/AdminMassSchedule';
import Calendar from '../pages/Calendar';
import AdminAnalyticsReporting from '../pages/ADMIN/AdminAnalyticsReporting';
import AdminMinistriesContainer from '../pages/ADMIN/AdminMinistriesContainer';
import MassAttendance from '../pages/PARISHIONER/MassAttendance';
import FamilyHeadManagement from '../pages/PARISHIONER/FamilyHeadManagement';
import StaffRecords from '../pages/STAFF/StaffRecords';
import StaffMortuary from '../pages/STAFF/StaffMortuary';
import StaffSacraments from '../pages/STAFF/StaffSacraments';
import PriestCalendar from '../pages/STAFF/PriestCalendar';
import StaffGive from '../pages/STAFF/StaffGive';
import UserStatusChecker from './UserStatusChecker';
import NotFound from './NotFound';
import GlobalFamilyInvitationModal from './GlobalFamilyInvitationModal';
import GlobalSacramentRequirementsModal from './GlobalSacramentRequirementsModal';
import Ministries from '../pages/GUEST/Ministries';
import MinistriesDetail from '../pages/GUEST/MinistriesDetail';


function AppContent() {
    const location = useLocation();
    // Check if user should see navbar based on their role and current route
    const shouldHideNavbar = () => {
        const user = JSON.parse(localStorage.getItem('user') || 'null');
        const pathname = location.pathname;
        
        // Always hide navbar for admin/staff/priest routes and mass-attendance
        if (
            pathname.startsWith('/admin/') ||
            pathname.startsWith('/staff/') ||
            pathname.startsWith('/priest/') ||
            pathname.startsWith('/mass-attendance/')
        ) {
            return true;
        }
        
        // Define all valid routes that should show navbar
        const validRoutes = [
            '/', '/about', '/contact', '/login', '/register', '/otp-verification',
            '/forgot-password', '/reset-password', '/search', '/pray', '/events',
            '/mass-schedule', '/gallery', '/news', '/calendar', '/ministries',
            '/appoint', '/apply', '/prayerRequest', '/certificate-request',
            '/give', '/profile', '/change-password', '/sacrament-history',
            '/donation-history', '/family-head-management', '/historical-profile',
            '/notifications', '/dashboard'
        ];
        
        // Check if current path matches any valid route pattern
        const matchesValidRoute = validRoutes.some(route => {
            // Exact match
            if (pathname === route) return true;
            // Pattern matches (for routes with params like /events/:id, /news/:id)
            if (pathname.startsWith('/events/') && route === '/events') return true;
            if (pathname.startsWith('/news/') && route === '/news') return true;
            return false;
        });
        
        // Hide navbar for 404/NotFound pages (any route that doesn't match valid routes and isn't admin/staff/priest)
        if (!matchesValidRoute && !pathname.startsWith('/priest/')) {
            return true;
        }
        
        // Hide navbar if user would see Access Denied page
        if (user) {
            let userRole = 'user';
            if (user.is_admin) userRole = 'admin';
            else if (user.is_staff) userRole = 'staff';
            else if (user.is_priest) userRole = 'priest';
            
            // Hide navbar for admin/staff/priest on parishioner routes (but NOT for regular users)
            if (userRole !== 'user' && (
                pathname === '/dashboard' ||
                pathname === '/appoint' ||
                pathname === '/apply' ||
                pathname === '/prayerRequest' ||
                pathname === '/certificate-request' ||
                pathname === '/give' ||
                pathname === '/profile' ||
                pathname === '/gallery' ||
                pathname === '/sacrament-history' ||
                pathname === '/donation-history' ||
                pathname === '/family-head-management'
            )) {
                return true;
            }
            
            // Hide navbar for parishioners on admin/staff/priest routes
            if (userRole === 'user' && (
                pathname.startsWith('/admin/') ||
                pathname.startsWith('/staff/') ||
                pathname.startsWith('/priest/')
            )) {
                return true;
            }
        }
        
        return false;
    };
    
    const hideNavbar = shouldHideNavbar();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Scroll to top on route change
    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [location.pathname]);

    const hasInitialized = useRef(false);
    useEffect(() => {
        if (hasInitialized.current) return;
        hasInitialized.current = true;
        // Initialize CSRF token and check authentication
        const initializeApp = async () => {
            // Skip auth check for clear guests to avoid 401 noise
            try {
                const cached = localStorage.getItem('user');
                if (!cached) {
                    setUser(null);
                    setLoading(false);
                    return;
                }
            } catch (_) {}
            try {
                await axios.get('/sanctum/csrf-cookie', { withCredentials: true });
                const res = await api.get('/me', { validateStatus: s => s === 200 || s === 401 });
                if (res.status === 200) {
                    const userData = res.data;
                    
                    // Check if user account is deactivated
                    if (userData.status === 'inactive') {
                        console.log('User account is deactivated, logging out');
                        setUser(null);
                        localStorage.removeItem('user');
                        window.dispatchEvent(new Event('userLogout'));
                    } else {
                        // Add login timestamp for deactivation detection
                        const userWithLoginTime = {
                            ...userData,
                            lastLoginTime: new Date().toISOString()
                        };
                        
                        setUser(userWithLoginTime);
                        localStorage.setItem('user', JSON.stringify(userWithLoginTime));
                    }
                } else {
                    setUser(null);
                    localStorage.removeItem('user');
                }
            } catch (err) {
                console.error('Auth check error:', err);
            } finally {
                setLoading(false);
            }
        };
        initializeApp();
    }, []);

    // Listen for user login/logout events
    useEffect(() => {
        const handleUserLogin = () => {
            const userData = localStorage.getItem('user');
            if (userData) {
                try {
                    setUser(JSON.parse(userData));
                } catch (e) {
                    console.error('Error parsing user data:', e);
                }
            }
        };

        const handleUserLogout = () => {
            setUser(null);
        };

        window.addEventListener('userLogin', handleUserLogin);
        window.addEventListener('userLogout', handleUserLogout);

        return () => {
            window.removeEventListener('userLogin', handleUserLogin);
            window.removeEventListener('userLogout', handleUserLogout);
        };
    }, []);

    if (loading) return <div>Loading...</div>;

    return (
        <>
            <UserStatusChecker />
            {!hideNavbar && <Navbar user={user} />}
            <CookieConsent user={user} />
            <div className="min-h-screen bg-gray-100">
                <Routes>
                    <Route path="/" element={<RoleRoute allowGuest={true}><Home /></RoleRoute>} />
                    <Route path="/about" element={<RoleRoute allowGuest={true}><About /></RoleRoute>} />
                    <Route path="/contact" element={<RoleRoute allowGuest={true}><Contact /></RoleRoute>} />
                    <Route path="/appoint" element={<RoleRoute allowedRoles={['user']}><Appoint /></RoleRoute>} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/forgot-password" element={<ForgotPassword />} />
                    <Route path="/reset-password" element={<ResetPassword />} />
                    <Route path="/apply" element={<RoleRoute allowedRoles={['user']}><Apply /></RoleRoute>} />
                    <Route path="/prayerRequest" element={<RoleRoute allowedRoles={['user']}><Request /></RoleRoute>} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/otp-verification" element={<OtpVerification />} />
                    <Route path="/search" element={<RoleRoute allowGuest={true}><SearchPage /></RoleRoute>} />
                    <Route path="/pray" element={<RoleRoute allowGuest={true}><Pray /></RoleRoute>} />
                    <Route path="/events" element={<RoleRoute allowGuest={true}><Events /></RoleRoute>} />
                    <Route path="/events/:eventId/join" element={<RoleRoute allowGuest={true}><JoinEvent /></RoleRoute>} />
                    <Route path="/mass-schedule" element={<RoleRoute allowGuest={true}><MassSchedule /></RoleRoute>} />
                    <Route path="/mass-attendance/:massScheduleId" element={<RoleRoute allowGuest={true}><MassAttendance /></RoleRoute>} />
                    <Route path="/certificate-request" element={<RoleRoute allowedRoles={['user']}><CertificateRequest /></RoleRoute>} />
                    <Route path="/give" element={<RoleRoute allowedRoles={['user']}><Give /></RoleRoute>} />
                    <Route path="/profile" element={<RoleRoute allowedRoles={['user']}><Profile /></RoleRoute>} />
                    <Route path="/priest/profile" element={<RoleRoute allowedRoles={['priest']}><PriestProfile /></RoleRoute>} />
                    <Route path="/notifications" element={<Notifications />} />
                    <Route path="/gallery" element={<RoleRoute allowGuest={true}><PARISHIONERGALLERY /></RoleRoute>} />
                    <Route path="/historical-profile" element={<HistoricalProfile />} />
                    <Route path="/news/:id" element={<RoleRoute allowGuest={true}><NewsDetail /></RoleRoute>} />
                    <Route path="/news" element={<RoleRoute allowGuest={true}><News /></RoleRoute>} />
                    <Route path="/change-password" element={<ChangePassword />} />
                    <Route path="/sacrament-history" element={<RoleRoute allowedRoles={['user']}><SacramentHistory /></RoleRoute>} />
                    <Route path="/donation-history" element={<RoleRoute allowedRoles={['user']}><DonationHistory /></RoleRoute>} />
                    <Route path="/family-head-management" element={<RoleRoute allowedRoles={['user']}><FamilyHeadManagement /></RoleRoute>} />
                    <Route path="/calendar" element={<RoleRoute allowGuest={true}><Calendar /></RoleRoute>} />
                    <Route path="/ministries" element={<RoleRoute allowGuest={true}><Ministries /></RoleRoute>} />
                    <Route path="/ministries/:id" element={<RoleRoute allowGuest={true}><MinistriesDetail /></RoleRoute>} />

                    <Route path="/admin/profile" element={<RoleRoute allowedRoles={['admin']}><AdminLayout><AdminProfile /></AdminLayout></RoleRoute>} />
                    <Route path="/admin/dashboard" element={<RoleRoute allowedRoles={['admin']}><AdminLayout><AdminDashboard /></AdminLayout></RoleRoute>} />
                    <Route path="/staff/profile" element={<RoleRoute allowedRoles={['staff']}><StaffLayoutWithRouting /></RoleRoute>} />
                    <Route path="/staff/dashboard" element={<RoleRoute allowedRoles={['staff']}><StaffLayoutWithRouting /></RoleRoute>} />
                    <Route path="/staff/certificates" element={<RoleRoute allowedRoles={['staff']}><StaffLayoutWithRouting /></RoleRoute>} />
                    <Route path="/staff/certificate-generator" element={<RoleRoute allowedRoles={['staff']}><CertificateGenerator /></RoleRoute>} />
                    <Route path="/staff/parish-records" element={<RoleRoute allowedRoles={['staff']}><StaffLayoutWithRouting /></RoleRoute>} />
                    <Route path="/staff/mortuary" element={<RoleRoute allowedRoles={['staff']}><StaffLayoutWithRouting /></RoleRoute>} />
                    <Route path="/staff/sacraments" element={<RoleRoute allowedRoles={['staff']}><StaffLayoutWithRouting /></RoleRoute>} />
                    <Route path="/staff/priest-calendar" element={<RoleRoute allowedRoles={['staff']}><StaffLayoutWithRouting /></RoleRoute>} />
                    <Route path="/staff/give" element={<RoleRoute allowedRoles={['staff']}><StaffLayoutWithRouting /></RoleRoute>} />
                    <Route path="/priest/dashboard" element={<RoleRoute allowedRoles={['priest']}><PriestDashboard /></RoleRoute>} />
                    <Route path="/dashboard" element={<RoleRoute allowedRoles={['user']}><Home /></RoleRoute>} />

                    <Route path="/admin/users" element={<RoleRoute allowedRoles={['admin']}><AdminLayout><AdminUsers /></AdminLayout></RoleRoute>} />
                    <Route path="/admin/membership" element={<RoleRoute allowedRoles={['admin']}><AdminLayout><AdminMembership /></AdminLayout></RoleRoute>} />
                    <Route path="/admin/gallery" element={<RoleRoute allowedRoles={['admin']}><AdminLayout><AdminGalleryContainer /></AdminLayout></RoleRoute>} />
                    <Route path="/admin/events" element={<RoleRoute allowedRoles={['admin']}><AdminLayout><AdminEventsContainer /></AdminLayout></RoleRoute>} />
                    <Route path="/admin/announcements" element={<RoleRoute allowedRoles={['admin']}><AdminLayout><AdminAnnouncements /></AdminLayout></RoleRoute>} />
                    <Route path="/admin/requests" element={<RoleRoute allowedRoles={['admin']}><AdminLayout><AdminRequests /></AdminLayout></RoleRoute>} />
                    <Route path="/admin/ministry-applicants" element={<RoleRoute allowedRoles={['admin']}><AdminLayout><AdminMinistryApplicants /></AdminLayout></RoleRoute>} />
                    <Route path="/admin/server-types" element={<RoleRoute allowedRoles={['admin']}><AdminLayout><AdminServerTypes /></AdminLayout></RoleRoute>} />
                    <Route path="/admin/news" element={<RoleRoute allowedRoles={['admin']}><AdminLayout><AdminNews /></AdminLayout></RoleRoute>} />
                    <Route path="/admin/shrine-rectors" element={<RoleRoute allowedRoles={['admin']}><AdminLayout><ShrineRectorsAdmin /></AdminLayout></RoleRoute>} />
                    <Route path="/admin/mass-schedule" element={<RoleRoute allowedRoles={['admin']}><AdminLayout><AdminMassSchedule /></AdminLayout></RoleRoute>} />
                    <Route path="/admin/analytics" element={<RoleRoute allowedRoles={['admin']}><AdminLayout><AdminAnalyticsReporting /></AdminLayout></RoleRoute>} />
                    <Route path="/admin/ministries" element={<RoleRoute allowedRoles={['admin']}><AdminLayout><AdminMinistriesContainer /></AdminLayout></RoleRoute>} />
                    
                    {/* Catch-all route for 404 errors */}
                    <Route path="*" element={<NotFound />} />
                </Routes>
            </div>
            <GlobalFamilyInvitationModal />
            <GlobalSacramentRequirementsModal />
        </>
    );
}

function App() {
    return (
        <Router>
            <AppContent />
        </Router>
    );
}

export default App;
