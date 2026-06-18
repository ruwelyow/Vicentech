import React, { useState, useMemo, useEffect, useRef } from 'react';
import '../../../css/certificateRequest.css';
import { api } from '../../utils/axios'; // Make sure this import is present

const CertificateRequest = () => {
    // Calculate minimum date (tomorrow) - only calculate once
    const minDate = useMemo(() => {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        return tomorrow.toISOString().split('T')[0];
    }, []);

    // Get current user from localStorage
    const [currentUser, setCurrentUser] = useState(null);
    const [familyMembers, setFamilyMembers] = useState([]);
    const [loadingFamily, setLoadingFamily] = useState(false);
    // If user has family_id, default to 'family_member', otherwise 'myself'
    const [requestFor, setRequestFor] = useState('myself'); // 'myself' or 'family_member'
    const [selectedFamilyMember, setSelectedFamilyMember] = useState(null);
    const [hasFamilyGroup, setHasFamilyGroup] = useState(false);
    const [pendingRecipients, setPendingRecipients] = useState([]); // Array of user IDs with pending requests
    const [currentUserHasPending, setCurrentUserHasPending] = useState(false);
    const [othersNameWarning, setOthersNameWarning] = useState(null); // Warning for "Request for Others"

    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        birthdate: '',
        email: '',
        phone: '',
        address: '',
        certificateType: '',
        purpose: '',
        dateNeeded: '',
        additionalInfo: '',
        recipientUserId: null
    });
    const [loading, setLoading] = useState(false);
    const [showPopup, setShowPopup] = useState(false);
    const [hasPendingRequest, setHasPendingRequest] = useState(false);
    const [pendingRequestInfo, setPendingRequestInfo] = useState(null);
    const [checkingPending, setCheckingPending] = useState(true);
    
    // Certificate validation states
    const [showValidation, setShowValidation] = useState(false);
    const [validationData, setValidationData] = useState({
        referenceNumber: ''
    });
    const [validationResult, setValidationResult] = useState(null);
    const [validationLoading, setValidationLoading] = useState(false);

    // Check for pending requests
    const checkPendingRequest = async (user = null, email = null) => {
        setCheckingPending(true);
        try {
            const checkUser = user || currentUser;
            const checkEmail = email || formData.email || checkUser?.email;
            
            if (!checkUser && !checkEmail) {
                setHasPendingRequest(false);
                setCheckingPending(false);
                return;
            }
            
            const params = checkUser ? {} : { email: checkEmail };
            const response = await api.get('/certificate-requests/check-pending', { params });
            
            if (response.data.has_pending) {
                setHasPendingRequest(true);
                setPendingRequestInfo(response.data.pending_request);
            } else {
                setHasPendingRequest(false);
                setPendingRequestInfo(null);
            }
        } catch (error) {
            console.error('Error checking pending requests:', error);
            // Don't block the form if check fails
            setHasPendingRequest(false);
        } finally {
            setCheckingPending(false);
        }
    };

    // Load user and family members on mount
    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            const userData = JSON.parse(storedUser);
            setCurrentUser(userData);
            
            // Check if user has a family group
            const userHasFamily = !!userData.family_id;
            setHasFamilyGroup(userHasFamily);
            
            // Always pre-fill email and phone (these are for the requester, not recipient)
            setFormData(prev => ({
                ...prev,
                email: userData.email || '',
                phone: userData.phone || ''
            }));
            
            // If user has family group, default to 'family_member', otherwise 'myself'
            if (userHasFamily) {
                setRequestFor('family_member');
            } else {
                setRequestFor('myself');
                // Pre-fill form with user's own data only if not in family group
                setFormData(prev => ({
                    ...prev,
                    firstName: userData.name ? userData.name.split(' ')[0] : '',
                    lastName: userData.name ? userData.name.split(' ').slice(1).join(' ') : '',
                    birthdate: userData.birthdate ? userData.birthdate.split('T')[0] : '',
                    address: userData.address || ''
                }));
            }

            // Fetch family members if user has a family (includes current user now)
            if (userHasFamily) {
                fetchFamilyMembers();
            }
            
            // Check for pending requests after user data is loaded
            setTimeout(() => {
                checkPendingRequest(userData, userData.email);
            }, 500);
        }
    }, []);

    // Re-check pending requests when email changes (for non-logged-in users)
    useEffect(() => {
        if (!currentUser && formData.email) {
            const timeoutId = setTimeout(() => {
                checkPendingRequest(null, formData.email);
            }, 1000); // Debounce
            
            return () => clearTimeout(timeoutId);
        }
    }, [formData.email]);

    // Fetch family members and check pending requests
    const fetchFamilyMembers = async () => {
        setLoadingFamily(true);
        try {
            const response = await api.get('/family-members');
            const members = response.data || [];
            setFamilyMembers(members);
            
            // Check pending requests for all family members (including current user)
            if (members.length > 0) {
                const recipientIds = members.map(m => m.id);
                try {
                    const pendingResponse = await api.post('/certificate-requests/check-pending-for-recipients', {
                        recipient_user_ids: recipientIds
                    });
                    const pendingIds = pendingResponse.data.pending_recipients || [];
                    setPendingRecipients(pendingIds);
                    
                    // Check if current user has pending request
                    if (currentUser && pendingIds.includes(currentUser.id)) {
                        setCurrentUserHasPending(true);
                    } else {
                        setCurrentUserHasPending(false);
                    }
                } catch (error) {
                    console.error('Failed to check pending requests:', error);
                }
            }
        } catch (error) {
            console.error('Failed to fetch family members:', error);
            setFamilyMembers([]);
        } finally {
            setLoadingFamily(false);
        }
    };

    // Check pending request by name for "Request for Others"
    const checkPendingByName = async (firstName, lastName) => {
        if (!firstName || !lastName || firstName.trim() === '' || lastName.trim() === '') {
            setOthersNameWarning(null);
            return;
        }
        
        try {
            const response = await api.post('/certificate-requests/check-pending-by-name', {
                firstName: firstName.trim(),
                lastName: lastName.trim()
            });
            
            if (response.data.has_pending) {
                setOthersNameWarning({
                    message: `There is already a pending certificate request for ${firstName} ${lastName}. Please wait for it to be processed.`,
                    pendingRequest: response.data.pending_request
                });
            } else {
                setOthersNameWarning(null);
            }
        } catch (error) {
            console.error('Failed to check pending by name:', error);
            setOthersNameWarning(null);
        }
    };

    // Auto-select current user when family members are loaded and user has family group
    // Only if current user doesn't have pending request
    useEffect(() => {
        if (hasFamilyGroup && currentUser && familyMembers.length > 0 && !selectedFamilyMember && requestFor === 'family_member' && !currentUserHasPending) {
            const currentUserMember = familyMembers.find(m => m.id === currentUser.id);
            if (currentUserMember && !pendingRecipients.includes(currentUserMember.id)) {
                setSelectedFamilyMember(currentUserMember);
                setFormData(prev => ({
                    ...prev,
                    firstName: currentUserMember.name ? currentUserMember.name.split(' ')[0] : '',
                    lastName: currentUserMember.name ? currentUserMember.name.split(' ').slice(1).join(' ') : '',
                    birthdate: currentUserMember.birthdate ? currentUserMember.birthdate.split('T')[0] : '',
                    address: currentUserMember.address || '',
                    recipientUserId: currentUserMember.id
                }));
            }
        }
    }, [hasFamilyGroup, currentUser, familyMembers, selectedFamilyMember, requestFor, currentUserHasPending, pendingRecipients]);

    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (nameCheckTimeoutRef.current) {
                clearTimeout(nameCheckTimeoutRef.current);
            }
        };
    }, []);

    // Handle request for selection change
    const handleRequestForChange = (e) => {
        const value = e.target.value;
        setRequestFor(value);
        setSelectedFamilyMember(null);
        
        if (value === 'myself') {
            // Reset to user's own data
            if (currentUser) {
                setFormData(prev => ({
                    ...prev,
                    firstName: currentUser.name ? currentUser.name.split(' ')[0] : '',
                    lastName: currentUser.name ? currentUser.name.split(' ').slice(1).join(' ') : '',
                    birthdate: currentUser.birthdate ? currentUser.birthdate.split('T')[0] : '',
                    email: currentUser.email || '',
                    phone: currentUser.phone || '',
                    address: currentUser.address || '',
                    recipientUserId: null
                }));
            }
        } else if (value === 'family_member') {
            // Clear recipient-specific fields but keep contact info
            // User will select from family members dropdown
            setFormData(prev => ({
                ...prev,
                firstName: '',
                lastName: '',
                birthdate: '',
                address: '',
                recipientUserId: null
                // Keep email and phone as requester's contact info
            }));
        } else if (value === 'others') {
            // Clear recipient-specific fields but keep contact info
            // User will manually enter recipient information
            setFormData(prev => ({
                ...prev,
                firstName: '',
                lastName: '',
                birthdate: '',
                address: '',
                recipientUserId: null
                // Keep email and phone as requester's contact info
            }));
            // Clear name warning when switching to others
            setOthersNameWarning(null);
        }
    };

    // Handle family member selection
    const handleFamilyMemberSelect = (e) => {
        const memberId = e.target.value;
        if (!memberId || memberId === '') {
            setSelectedFamilyMember(null);
            setFormData(prev => ({
                ...prev,
                firstName: '',
                lastName: '',
                birthdate: '',
                address: '',
                recipientUserId: null
            }));
            return;
        }

        const member = familyMembers.find(m => m.id === parseInt(memberId));
        if (member) {
            setSelectedFamilyMember(member);
            // Auto-fill form with family member's data
            setFormData(prev => ({
                ...prev,
                firstName: member.name ? member.name.split(' ')[0] : '',
                lastName: member.name ? member.name.split(' ').slice(1).join(' ') : '',
                birthdate: member.birthdate ? member.birthdate.split('T')[0] : '',
                address: member.address || '',
                recipientUserId: member.id
                // Keep requester's email and phone for contact
            }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Check for pending request for "Request for Others" before submitting
        if (requestFor === 'others' && othersNameWarning) {
            alert(othersNameWarning.message);
            return;
        }
        
        // Check if selected family member has pending request
        if (requestFor === 'family_member' && selectedFamilyMember && pendingRecipients.includes(selectedFamilyMember.id)) {
            alert(`There is already a pending certificate request for ${selectedFamilyMember.name}. Please wait for it to be processed.`);
            return;
        }
        
        setLoading(true);
        let requestSuccessful = false;
        
        try {
            // Prepare request data
            // Explicitly set recipientUserId based on requestFor value
            let recipientUserId = null;
            if (requestFor === 'family_member' && selectedFamilyMember) {
                recipientUserId = selectedFamilyMember.id;
            }
            
            const requestData = {
                ...formData,
                recipientUserId: recipientUserId // Explicitly set to null for "myself" and "others"
            };
            
            // Log for debugging (remove in production)
            console.log('Submitting certificate request:', {
                requestFor,
                recipientUserId,
                hasSelectedFamilyMember: !!selectedFamilyMember
            });
            
            const response = await api.post('/certificate-requests', requestData);
            // Request was successful (2xx status)
            requestSuccessful = true;
            setShowPopup(true);
            
            // Refresh pending recipients list if user has family group
            if (hasFamilyGroup && familyMembers.length > 0) {
                const recipientIds = familyMembers.map(m => m.id);
                try {
                    const pendingResponse = await api.post('/certificate-requests/check-pending-for-recipients', {
                        recipient_user_ids: recipientIds
                    });
                    const pendingIds = pendingResponse.data.pending_recipients || [];
                    setPendingRecipients(pendingIds);
                    
                    // Update current user pending status
                    if (currentUser && pendingIds.includes(currentUser.id)) {
                        setCurrentUserHasPending(true);
                    } else {
                        setCurrentUserHasPending(false);
                    }
                } catch (error) {
                    console.error('Failed to refresh pending requests:', error);
                }
            }
            
            // Clear name warning if it was for "others"
            if (requestFor === 'others') {
                setOthersNameWarning(null);
            }
            
            // Clear form data safely
            try {
                if (typeof clearFormData === 'function') {
                    clearFormData();
                } else {
                    // Reset form manually if clearFormData doesn't exist
                    const resetData = {
                        firstName: '',
                        lastName: '',
                        birthdate: '',
                        email: currentUser?.email || '',
                        phone: currentUser?.phone || '',
                        address: '',
                        certificateType: '',
                        purpose: '',
                        dateNeeded: '',
                        additionalInfo: '',
                        recipientUserId: null
                    };
                    setFormData(resetData);
                    setRequestFor(hasFamilyGroup ? 'family_member' : 'myself');
                    setSelectedFamilyMember(null);
                }
            } catch (clearError) {
                console.warn('Error clearing form data:', clearError);
                // Still reset form manually
                const resetData = {
                    firstName: '',
                    lastName: '',
                    birthdate: '',
                    email: currentUser?.email || '',
                    phone: currentUser?.phone || '',
                    address: '',
                    certificateType: '',
                    purpose: '',
                    dateNeeded: '',
                    additionalInfo: '',
                    recipientUserId: null
                };
                setFormData(resetData);
                setRequestFor(hasFamilyGroup ? 'family_member' : 'myself');
                setSelectedFamilyMember(null);
                setOthersNameWarning(null);
            }
        } catch (error) {
            // Handle pending request error (409 Conflict)
            if (error.response?.status === 409 && error.response?.data?.error) {
                setHasPendingRequest(true);
                setPendingRequestInfo(error.response.data.pending_request);
                alert(error.response.data.error);
                return;
            }
            
            // Check if the error is actually a successful response (2xx status)
            // Sometimes axios interceptors can cause successful requests to be caught
            if (error.response) {
                const status = error.response.status;
                // If status is 2xx (success), treat it as success
                if (status >= 200 && status < 300) {
                    requestSuccessful = true;
                    setShowPopup(true);
                    
                    // Mark as having pending request after successful submission
                    setHasPendingRequest(true);
                    checkPendingRequest(); // Refresh pending status
                    
                    // Clear form data
                    const resetData = {
                        firstName: '',
                        lastName: '',
                        birthdate: '',
                        email: currentUser?.email || '',
                        phone: currentUser?.phone || '',
                        address: '',
                        certificateType: '',
                        purpose: '',
                        dateNeeded: '',
                        additionalInfo: '',
                        recipientUserId: null
                    };
                    setFormData(resetData);
                    setRequestFor(hasFamilyGroup ? 'family_member' : 'myself');
                    setSelectedFamilyMember(null);
                } else {
                    // Only show error for actual failures (4xx, 5xx)
                    console.error('Request failed:', error.response.data);
                    // DO NOT show alert - the request might still succeed
                    // Only log the error for debugging
                }
            } else {
                // Network error or other issues - but don't show alert
                // The request might have actually succeeded
                console.error('Request error:', error.message);
            }
        } finally {
            setLoading(false);
        }
    };

    // Debounce timer for name checking
    const nameCheckTimeoutRef = useRef(null);

    const handleChange = (e) => {
        const { name, value } = e.target;
        const updatedFormData = {
            ...formData,
            [name]: value
        };
        setFormData(updatedFormData);
        
        // Check pending by name for "Request for Others" as user types
        if (requestFor === 'others' && (name === 'firstName' || name === 'lastName')) {
            // Clear previous timeout
            if (nameCheckTimeoutRef.current) {
                clearTimeout(nameCheckTimeoutRef.current);
            }
            
            // Set new timeout
            nameCheckTimeoutRef.current = setTimeout(() => {
                const firstName = name === 'firstName' ? value : updatedFormData.firstName;
                const lastName = name === 'lastName' ? value : updatedFormData.lastName;
                checkPendingByName(firstName, lastName);
            }, 500);
        }
    };

    // Certificate validation handlers
    const handleValidationChange = (e) => {
        const { name, value } = e.target;
        setValidationData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleValidateCertificate = async (e) => {
        e.preventDefault();
        if (!validationData.referenceNumber.trim()) {
            alert('Please enter the certificate number from the "No." field');
            return;
        }

        setValidationLoading(true);
        try {
            // Trim and encode the reference number properly
            const referenceNumber = validationData.referenceNumber.trim();
            // Use encodeURIComponent to properly encode the reference number for URL
            const encodedReference = encodeURIComponent(referenceNumber);
            const response = await api.get(`/certificate-validation/${encodedReference}`);
            setValidationResult(response.data);
        } catch (error) {
            if (error.response?.status === 404) {
                setValidationResult({ error: 'Certificate not found. Please check the certificate number from the "No." field on your certificate.' });
            } else {
                setValidationResult({ error: 'Failed to validate certificate. Please try again.' });
            }
        } finally {
            setValidationLoading(false);
        }
    };

    const resetValidation = () => {
        setValidationData({ referenceNumber: '' });
        setValidationResult(null);
        setShowValidation(false);
    };

    return (
        <div className="certificate-page min-h-screen pb-20">
            {/* Loading Overlay */}
            {loading && (
                <div className="loading-overlay">
                    <div className="spinner"></div>
                    <div className="loading-text">Submitting your request...</div>
                </div>
            )}
            {/* Popup Modal */}
            {showPopup && (
                <div className="popup-modal">
                    <div className="popup-content">
                        <h2 className="popup-title">Request Submitted!</h2>
                        <p className="popup-message">Your certificate request has been submitted successfully. We will contact you for pickup or delivery arrangements.</p>
                        <button className="popup-close" onClick={() => setShowPopup(false)}>Close</button>
                    </div>
                </div>
            )}
            <section className="certificate-hero text-center">
                <div className="bg-white border border-[#f2e4ce] shadow-lg p-8 pb-10 w-full mt-6 relative">
                    {/* Validate Certificate Button - Desktop: Upper Right, Mobile: Below Text */}
                    <div className="absolute top-6 right-6 desktop-validate-btn">
                        <button
                            onClick={() => setShowValidation(!showValidation)}
                            className="bg-[#CD8B3E] text-white px-6 py-3 rounded-lg hover:bg-[#B77B35] transition duration-300 font-medium"
                        >
                            Validate Certificate
                        </button>
                    </div>
                    
                    <h1 className="text-5xl font-extrabold text-[#3F2E1E] mb-3 tracking-tight font-['Times_New_Roman']">Certificate Request</h1>
                    <p className="text-lg text-[#5C4B38] max-w-2xl mx-auto leading-relaxed">
                        Request your church certificates and documents. Fill out the form below to process your request.
                    </p>
                    
                    {/* Validate Certificate Button - Mobile: Below Text */}
                    <div className="mobile-validate-btn mt-6">
                        <button
                            onClick={() => setShowValidation(!showValidation)}
                            className="bg-[#CD8B3E] text-white px-6 py-3 rounded-lg hover:bg-[#B77B35] transition duration-300 font-medium w-full max-w-xs mx-auto"
                        >
                            Validate Certificate
                        </button>
                    </div>
                </div>
            </section>

            {/* Certificate Request Form */}
            <div className={`bg-white border border-[#f2e4ce] rounded-2xl shadow-lg p-8 max-w-6xl mx-auto -mt-16 certificate-form-container ${showValidation ? 'blur-sm' : ''}`}>
                {/* Pending Request Warning - Only show for "Request for Myself" */}
                {!hasFamilyGroup && hasPendingRequest && pendingRequestInfo && requestFor === 'myself' && (
                    <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-4 mb-6">
                        <div className="flex items-start">
                            <div className="text-yellow-600 text-2xl mr-3">⚠️</div>
                            <div className="flex-1">
                                <h3 className="text-lg font-semibold text-yellow-800 mb-2">
                                    Pending Certificate Request
                                </h3>
                                <p className="text-yellow-700 mb-2">
                                    You already have a pending certificate request. Please wait for it to be processed (approved, rejected, or completed) before submitting a new request.
                                </p>
                                <div className="text-sm text-yellow-600 mt-2">
                                    <strong>Pending Request:</strong> {pendingRequestInfo.certificate_type} - 
                                    Requested on {pendingRequestInfo.created_at ? new Date(pendingRequestInfo.created_at).toLocaleDateString() : 'N/A'}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
                
                {checkingPending && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 text-center">
                        <p className="text-blue-700">Checking for pending requests...</p>
                    </div>
                )}
                
                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Request For Selection - Show for all logged-in users */}
                    {currentUser && (
                        <div className="bg-[#FFF6E5] border-2 border-[#CD8B3E] rounded-lg p-4 mb-6">
                            <label htmlFor="requestFor" className="block mb-3 text-sm font-semibold text-[#3F2E1E]">
                                Request Certificate For:
                            </label>
                            <select
                                id="requestFor"
                                name="requestFor"
                                value={requestFor}
                                onChange={handleRequestForChange}
                                className="w-full p-3 border border-[#f2e4ce] rounded-lg focus:ring-2 focus:ring-[#CD8B3E] focus:border-[#CD8B3E] bg-white"
                            >
                                {!hasFamilyGroup && !currentUserHasPending && <option value="myself">Request for Myself</option>}
                                {hasFamilyGroup && <option value="family_member">Request for a Family Member</option>}
                                <option value="others">Request for Others</option>
                            </select>
                            
                            {/* Family Member Selection - Show when "Request for Family Member" is selected and user has family members */}
                            {requestFor === 'family_member' && familyMembers.length > 0 && (
                                <div className="mt-4">
                                    <label htmlFor="familyMember" className="block mb-2 text-sm font-medium text-[#3F2E1E]">
                                        Select Family Member:
                                    </label>
                                    {loadingFamily ? (
                                        <div className="text-sm text-[#5C4B38]">Loading family members...</div>
                                    ) : (
                                        <select
                                            id="familyMember"
                                            name="familyMember"
                                            value={selectedFamilyMember?.id || ''}
                                            onChange={handleFamilyMemberSelect}
                                            className="w-full p-3 border border-[#f2e4ce] rounded-lg focus:ring-2 focus:ring-[#CD8B3E] focus:border-[#CD8B3E] bg-white"
                                            required={requestFor === 'family_member'}
                                        >
                                            <option value="">-- Select Family Member --</option>
                                            {familyMembers.map((member) => {
                                                const hasPending = pendingRecipients.includes(member.id);
                                                const isCurrentUser = member.id === currentUser?.id;
                                                return (
                                                    <option 
                                                        key={member.id} 
                                                        value={member.id}
                                                        disabled={hasPending}
                                                    >
                                                        {member.name} {isCurrentUser ? '(Myself)' : ''} {member.relationship ? `(${member.relationship})` : ''} {hasPending ? '- Has Pending Request' : ''}
                                                    </option>
                                                );
                                            })}
                                        </select>
                                    )}
                                    <p className="text-xs text-[#5C4B38] mt-2">
                                        Your contact information (email and phone) will be used for notifications about this request.
                                    </p>
                                </div>
                            )}
                            
                            {/* Message when "Request for Family Member" is selected but no family members */}
                            {requestFor === 'family_member' && !loadingFamily && familyMembers.length === 0 && (
                                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                                    <p className="text-sm text-yellow-800">
                                        You don't have any family members. Please select "Request for Others" to manually enter the recipient's information.
                                    </p>
                                </div>
                            )}
                            
                            {/* Message when all family members have pending requests */}
                            {requestFor === 'family_member' && !loadingFamily && familyMembers.length > 0 && 
                             familyMembers.filter(m => !pendingRecipients.includes(m.id)).length === 0 && (
                                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                                    <p className="text-sm text-yellow-800">
                                        All family members (including yourself) already have pending certificate requests. Please wait for them to be processed or select "Request for Others" to request for someone outside your family.
                                    </p>
                                </div>
                            )}
                            
                            {/* Info message about disabled options */}
                            {requestFor === 'family_member' && !loadingFamily && familyMembers.length > 0 && 
                             pendingRecipients.length > 0 && familyMembers.filter(m => !pendingRecipients.includes(m.id)).length > 0 && (
                                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                    <p className="text-xs text-blue-800">
                                        Note: Family members with pending requests are disabled and cannot be selected.
                                    </p>
                                </div>
                            )}
                            
                            {/* Message when "Request for Others" is selected */}
                            {requestFor === 'others' && (
                                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                    <p className="text-sm text-blue-800">
                                        Please fill in the recipient's information below. Your contact information (email and phone) will be used for notifications about this request.
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="firstName" className="block mb-2 text-sm font-medium text-[#3F2E1E]">
                                First Name {(requestFor === 'family_member' && selectedFamilyMember) || requestFor === 'others' ? <span className="text-xs text-[#5C4B38]">(of certificate recipient)</span> : ''}
                            </label>
                            <input
                                type="text"
                                id="firstName"
                                name="firstName"
                                value={formData.firstName}
                                onChange={handleChange}
                                className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-[#CD8B3E] focus:border-[#CD8B3E] ${
                                    othersNameWarning ? 'border-yellow-400 bg-yellow-50' : 'border-[#f2e4ce]'
                                }`}
                                required
                            />
                        </div>
                        <div>
                            <label htmlFor="lastName" className="block mb-2 text-sm font-medium text-[#3F2E1E]">
                                Last Name {(requestFor === 'family_member' && selectedFamilyMember) || requestFor === 'others' ? <span className="text-xs text-[#5C4B38]">(of certificate recipient)</span> : ''}
                            </label>
                            <input
                                type="text"
                                id="lastName"
                                name="lastName"
                                value={formData.lastName}
                                onChange={handleChange}
                                className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-[#CD8B3E] focus:border-[#CD8B3E] ${
                                    othersNameWarning ? 'border-yellow-400 bg-yellow-50' : 'border-[#f2e4ce]'
                                }`}
                                required
                            />
                        </div>
                    </div>
                    
                    {/* Warning for "Request for Others" if name already has pending request */}
                    {requestFor === 'others' && othersNameWarning && (
                        <div className="bg-yellow-50 border-2 border-yellow-400 rounded-lg p-4">
                            <div className="flex items-start">
                                <div className="text-yellow-600 text-xl mr-3">⚠️</div>
                                <div className="flex-1">
                                    <p className="text-sm font-semibold text-yellow-800 mb-1">
                                        Pending Request Found
                                    </p>
                                    <p className="text-sm text-yellow-700">
                                        {othersNameWarning.message}
                                    </p>
                                    {othersNameWarning.pendingRequest && (
                                        <p className="text-xs text-yellow-600 mt-2">
                                            Request Type: {othersNameWarning.pendingRequest.certificate_type} | 
                                            Requested on: {othersNameWarning.pendingRequest.created_at ? new Date(othersNameWarning.pendingRequest.created_at).toLocaleDateString() : 'N/A'}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="birthdate" className="block mb-2 text-sm font-medium text-[#3F2E1E]">
                                Date of Birth {requestFor === 'family_member' && selectedFamilyMember && <span className="text-xs text-[#5C4B38]">(of certificate recipient)</span>}
                            </label>
                            <input
                                type="date"
                                id="birthdate"
                                name="birthdate"
                                value={formData.birthdate}
                                onChange={handleChange}
                                className="w-full p-3 border border-[#f2e4ce] rounded-lg focus:ring-2 focus:ring-[#CD8B3E] focus:border-[#CD8B3E]"
                                required
                            />
                        </div>
                        <div>
                            <label htmlFor="certificateType" className="block mb-2 text-sm font-medium text-[#3F2E1E]">Type of Certificate</label>
                            <select
                                id="certificateType"
                                name="certificateType"
                                value={formData.certificateType}
                                onChange={handleChange}
                                className="w-full p-3 border border-[#f2e4ce] rounded-lg focus:ring-2 focus:ring-[#CD8B3E] focus:border-[#CD8B3E]"
                                required
                            >
                                <option value="">Select certificate type</option>
                                <option value="baptism">Baptismal Certificate</option>
                                <option value="confirmation">Confirmation Certificate</option>
                                <option value="marriage">Marriage Certificate</option>
                                <option value="death">Death Certificate</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label htmlFor="email" className="block mb-2 text-sm font-medium text-[#3F2E1E]">
                            Contact Email Address {requestFor === 'family_member' && selectedFamilyMember && <span className="text-xs text-[#5C4B38]">(Your email for notifications)</span>}
                        </label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            className="w-full p-3 border border-[#f2e4ce] rounded-lg focus:ring-2 focus:ring-[#CD8B3E] focus:border-[#CD8B3E]"
                            required
                        />
                        {requestFor === 'family_member' && selectedFamilyMember && (
                            <p className="text-xs text-[#5C4B38] mt-1">
                                This email will be used to contact you about the certificate request for {selectedFamilyMember.name}.
                            </p>
                        )}
                    </div>

                    <div>
                        <label htmlFor="phone" className="block mb-2 text-sm font-medium text-[#3F2E1E]">
                            Contact Number {requestFor === 'family_member' && selectedFamilyMember && <span className="text-xs text-[#5C4B38]">(Your phone for notifications)</span>}
                        </label>
                        <input
                            type="tel"
                            id="phone"
                            name="phone"
                            value={formData.phone}
                            onChange={handleChange}
                            className="w-full p-3 border border-[#f2e4ce] rounded-lg focus:ring-2 focus:ring-[#CD8B3E] focus:border-[#CD8B3E]"
                            required
                        />
                        {requestFor === 'family_member' && selectedFamilyMember && (
                            <p className="text-xs text-[#5C4B38] mt-1">
                                This phone number will be used to contact you about the certificate request.
                            </p>
                        )}
                    </div>

                    <div>
                        <label htmlFor="address" className="block mb-2 text-sm font-medium text-[#3F2E1E]">
                            {requestFor === 'family_member' && selectedFamilyMember 
                                ? `Complete Address (for ${selectedFamilyMember.name})` 
                                : 'Complete Address'}
                        </label>
                        <textarea
                            id="address"
                            name="address"
                            value={formData.address}
                            onChange={handleChange}
                            className="w-full p-3 border border-[#f2e4ce] rounded-lg focus:ring-2 focus:ring-[#CD8B3E] focus:border-[#CD8B3E]"
                            rows="2"
                            required
                        ></textarea>
                        {requestFor === 'family_member' && selectedFamilyMember && (
                            <p className="text-xs text-[#5C4B38] mt-1">
                                Address for {selectedFamilyMember.name} (the certificate recipient).
                            </p>
                        )}
                    </div>

                    <div>
                        <label htmlFor="purpose" className="block mb-2 text-sm font-medium text-[#3F2E1E]">Purpose of Request</label>
                        <textarea
                            id="purpose"
                            name="purpose"
                            value={formData.purpose}
                            onChange={handleChange}
                            className="w-full p-3 border border-[#f2e4ce] rounded-lg focus:ring-2 focus:ring-[#CD8B3E] focus:border-[#CD8B3E]"
                            rows="2"
                            placeholder="Please specify the purpose of your certificate request"
                            required
                        ></textarea>
                    </div>

                    <div>
                        <label htmlFor="dateNeeded" className="block mb-2 text-sm font-medium text-[#3F2E1E]">Date Needed</label>
                        <input
                            type="date"
                            id="dateNeeded"
                            name="dateNeeded"
                            value={formData.dateNeeded}
                            onChange={handleChange}
                            min={minDate}
                            className="w-full p-3 border border-[#f2e4ce] rounded-lg focus:ring-2 focus:ring-[#CD8B3E] focus:border-[#CD8B3E]"
                            required
                        />
                        <p className="text-xs text-[#5C4B38] mt-1">Please select a future date (tomorrow or later)</p>
                    </div>

                    <div>
                        <label htmlFor="additionalInfo" className="block mb-2 text-sm font-medium text-[#3F2E1E]">Additional Information</label>
                        <textarea
                            id="additionalInfo"
                            name="additionalInfo"
                            value={formData.additionalInfo}
                            onChange={handleChange}
                            className="w-full p-3 border border-[#f2e4ce] rounded-lg focus:ring-2 focus:ring-[#CD8B3E] focus:border-[#CD8B3E]"
                            rows="3"
                            placeholder="Any additional information that might help process your request"
                        ></textarea>
                    </div>

                    <button
                        type="submit"
                        disabled={
                            checkingPending || 
                            (requestFor === 'family_member' && selectedFamilyMember && pendingRecipients.includes(selectedFamilyMember.id)) ||
                            (requestFor === 'others' && othersNameWarning)
                        }
                        className={`w-full py-3 px-4 rounded-lg transition duration-300 ${
                            checkingPending || 
                            (requestFor === 'family_member' && selectedFamilyMember && pendingRecipients.includes(selectedFamilyMember.id)) ||
                            (requestFor === 'others' && othersNameWarning)
                                ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                                : 'bg-[#CD8B3E] text-white hover:bg-[#B77B35]'
                        }`}
                    >
                        {checkingPending 
                            ? 'Checking...' 
                            : (requestFor === 'family_member' && selectedFamilyMember && pendingRecipients.includes(selectedFamilyMember.id))
                                ? 'Cannot Submit - Selected Member Has Pending Request'
                                : (requestFor === 'others' && othersNameWarning)
                                    ? 'Cannot Submit - Duplicate Name Found'
                                    : 'Submit Request'
                        }
                    </button>

                    <div className="text-center text-sm text-[#5C4B38]">
                        We will process your request and contact you for pickup or delivery arrangements
                    </div>
                    </form>
                </div>

            {/* Certificate Validation Popup */}
            {showValidation && (
                <div className="fixed inset-0 bg-black bg-opacity-30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-8">
                            {/* Close Button */}
                            <div className="flex justify-end mb-4">
                                <button
                                    onClick={() => setShowValidation(false)}
                                    className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
                                >
                                    ×
                                </button>
                            </div>
                            
                            <h2 className="text-3xl font-bold text-[#3F2E1E] mb-6 text-center">Certificate Validation</h2>
                            <p className="text-[#5C4B38] text-center mb-6">
                                Enter the certificate number from the "No." field on your certificate to verify its authenticity and view certificate details.
                            </p>
                            
                            <form onSubmit={handleValidateCertificate} className="space-y-4">
                                <div className="max-w-md mx-auto">
                                    <label htmlFor="referenceNumber" className="block mb-2 text-sm font-medium text-[#3F2E1E]">
                                        Certificate Number (No. field)
                                    </label>
                                    <input
                                        type="text"
                                        id="referenceNumber"
                                        name="referenceNumber"
                                        value={validationData.referenceNumber}
                                        onChange={handleValidationChange}
                                        className="w-full p-3 border border-[#f2e4ce] rounded-lg focus:ring-2 focus:ring-[#CD8B3E] focus:border-[#CD8B3E] text-center font-mono"
                                        placeholder="Enter the certificate number from the 'No.' field (e.g., BAP-2025-0007)"
                                        required
                                    />
                                    <p className="text-xs text-gray-500 mt-2 text-center">
                                        Enter the number shown in the "No." field on your certificate
                                    </p>
                                </div>
                                
                                <div className="text-center">
                                    <button
                                        type="submit"
                                        disabled={validationLoading}
                                        className="bg-[#CD8B3E] text-white py-3 px-8 rounded-lg hover:bg-[#B77B35] transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {validationLoading ? 'Validating...' : 'Validate Certificate'}
                                    </button>
                                </div>
                            </form>

                            {/* Validation Result */}
                            {validationResult && (
                                <div className="mt-8">
                                    {validationResult.error ? (
                                        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
                                            <div className="text-red-600 text-lg font-medium mb-2">❌ Validation Failed</div>
                                            <p className="text-red-700">{validationResult.error}</p>
                                        </div>
                                    ) : (
                                        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                                            <div className="text-green-600 text-lg font-medium mb-4 text-center">✅ Certificate Valid</div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="bg-white p-4 rounded-lg border">
                                                    <h3 className="font-semibold text-[#3F2E1E] mb-3">Certificate Details</h3>
                                                    <div className="space-y-2 text-sm">
                                                        <div><strong>Type:</strong> {validationResult.certificate_type}</div>
                                                        <div><strong>Recipient:</strong> {validationResult.recipient_name}</div>
                                                        <div><strong>Date:</strong> {new Date(validationResult.certificate_date).toLocaleDateString()}</div>
                                                        <div><strong>Priest:</strong> {validationResult.priest_name}</div>
                                                        <div><strong>Certificate No.:</strong> <span className="font-mono bg-gray-100 px-2 py-1 rounded">{validationResult.certificate_number || validationResult.unique_reference}</span></div>
                                                        <div><strong>Status:</strong> <span className="text-green-600 font-medium">{validationResult.status}</span></div>
                                                    </div>
                                                </div>
                                                <div className="bg-white p-4 rounded-lg border">
                                                    <h3 className="font-semibold text-[#3F2E1E] mb-3">Security Information</h3>
                                                    <div className="space-y-2 text-sm">
                                                        <div><strong>Generated:</strong> {new Date(validationResult.created_at).toLocaleDateString()}</div>
                                                        <div><strong>Last Updated:</strong> {new Date(validationResult.updated_at).toLocaleDateString()}</div>
                                                        {validationResult.emailed_at && (
                                                            <div><strong>Email Sent:</strong> {new Date(validationResult.emailed_at).toLocaleDateString()}</div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="mt-4 text-center">
                                                <button
                                                    onClick={resetValidation}
                                                    className="bg-gray-500 text-white py-2 px-4 rounded-lg hover:bg-gray-600 transition duration-300"
                                                >
                                                    Validate Another Certificate
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CertificateRequest; 