import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../../css/profile.css';
import Navbar from '../../components/Navbar';
import SuccessPopup from '../../components/SuccessPopup';
import api from '../../utils/axios';
import ReactDOM from 'react-dom';
import { smartSanitize, smartValidate } from '../../utils/validation';

// Membership status configuration (matching admin membership)
const MEMBERSHIP_STATUSES = [
  { label: 'Active Member', value: 'active', color: 'green', bgColor: '#22c55e', textColor: '#ffffff', borderColor: '#16a34a' },
  { label: 'Inactive Member', value: 'inactive', color: 'yellow', bgColor: '#f59e0b', textColor: '#ffffff', borderColor: '#d97706' },
  { label: 'Visitor', value: 'visitor', color: 'blue', bgColor: '#3b82f6', textColor: '#ffffff', borderColor: '#2563eb' },
  { label: 'New Member', value: 'new_member', color: 'purple', bgColor: '#9333ea', textColor: '#ffffff', borderColor: '#7c3aed' },
  { label: 'Transferred Out', value: 'transferred_out', color: 'gray', bgColor: '#6b7280', textColor: '#ffffff', borderColor: '#4b5563' },
  { label: 'Deceased', value: 'deceased', color: 'gray', bgColor: '#6b7280', textColor: '#ffffff', borderColor: '#4b5563' },
  { label: 'Suspended', value: 'suspended', color: 'red', bgColor: '#ef4444', textColor: '#ffffff', borderColor: '#dc2626' },
];

// Helper function to get membership status label
const getMembershipStatusLabel = (status) => {
  if (!status) return 'New Member'; // Default for new users
  const statusConfig = MEMBERSHIP_STATUSES.find(s => s.value === status);
  return statusConfig ? statusConfig.label : 'Unknown';
};

// Helper function to get membership status styling
const getMembershipStatusStyle = (status) => {
  if (!status) {
    // Default styling for new_member
    const defaultStatus = MEMBERSHIP_STATUSES.find(s => s.value === 'new_member');
    return {
      background: defaultStatus.bgColor,
      color: defaultStatus.textColor,
      border: `1px solid ${defaultStatus.borderColor}`,
    };
  }
  const statusConfig = MEMBERSHIP_STATUSES.find(s => s.value === status);
  if (statusConfig) {
    return {
      background: statusConfig.bgColor,
      color: statusConfig.textColor,
      border: `1px solid ${statusConfig.borderColor}`,
    };
  }
  // Fallback styling
  return {
    background: 'rgba(107, 114, 128, 0.1)',
    color: '#6b7280',
    border: '1px solid rgba(107, 114, 128, 0.2)',
  };
};

const Profile = () => {
  const [user, setUser] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [showFamilyForm, setShowFamilyForm] = useState(false);
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [familyForm, setFamilyForm] = useState({ family_name: '', address: '', phone: '', email: '', family_notes: '', relationship_role: 'Father' });
  const [familyMembers, setFamilyMembers] = useState([]);
  
  const navigate = useNavigate();
  const familySectionRef = useRef(null);
  
  // Success popup states
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [successTitle, setSuccessTitle] = useState('');
  
  // Deactivate account states
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [deactivating, setDeactivating] = useState(false);

  // Helper function to show success popup
  const showSuccess = (title, message) => {
    setSuccessTitle(title);
    setSuccessMessage(message);
    setShowSuccessPopup(true);
  };

  const hideSuccess = () => {
    setShowSuccessPopup(false);
  };

  // Helper function to format date
  const formatDate = (dateString) => {
    if (!dateString) return '';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return dateString; // Return original if formatting fails
    }
  };

  // Sacrament history state
  const [sacramentHistory, setSacramentHistory] = useState([]);
  const [loadingSacraments, setLoadingSacraments] = useState(false);
  const [errorSacraments, setErrorSacraments] = useState('');

  // Donation history for profile card (fetched from API, verified only)
  const [donationHistory, setDonationHistory] = useState([]);
  const [loadingDonations, setLoadingDonations] = useState(false);
  const [errorDonations, setErrorDonations] = useState('');

  const fetchDonationHistory = async () => {
    if (!user || !user.email) {
      setDonationHistory([]);
      return;
    }
    setLoadingDonations(true);
    setErrorDonations('');
    try {
      const res = await api.get('/donations');
      const list = Array.isArray(res.data) ? res.data : [];
      const filtered = list.filter(d => d.email === user.email && (d.verified === true || d.verified === 1))
        .map(d => ({
          date: d.created_at ? d.created_at.split('T')[0] : (d.date || ''),
          amount: d.amount,
          purpose: d.category || d.purpose || 'Donation',
          raw: d
        }));
      setDonationHistory(filtered);
    } catch (err) {
      console.error('Failed to load donation history', err);
      setErrorDonations('Failed to load donations');
      setDonationHistory([]);
    } finally {
      setLoadingDonations(false);
    }
  };

  // Fetch sacrament history from API
  const fetchSacramentHistory = async () => {
    if (!user) {
      setSacramentHistory([]);
      return;
    }
    setLoadingSacraments(true);
    setErrorSacraments('');
    try {
      console.log('Profile.jsx: Fetching sacrament history for user:', user.id);
      const res = await api.get('/sacrament-history');
      console.log('Profile.jsx: Sacrament history response:', res.data);
      setSacramentHistory(res.data || []);
    } catch (err) {
      console.error('Profile.jsx: Failed to load sacrament history:', err);
      console.error('Profile.jsx: Error details:', {
        message: err.message,
        status: err.response?.status,
        data: err.response?.data,
        url: err.config?.url
      });
      setErrorSacraments(`Failed to load sacrament history: ${err.response?.data?.message || err.message}`);
      setSacramentHistory([]);
    } finally {
      setLoadingSacraments(false);
    }
  };


  // Family Grouping state
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [pendingSentInvites, setPendingSentInvites] = useState([]); // invitations sent by me
  const [loadingFamily, setLoadingFamily] = useState(false);
  const [loadingInvites, setLoadingInvites] = useState(false);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [errorFamily, setErrorFamily] = useState('');
  const [errorInvites, setErrorInvites] = useState('');
  const [errorSearch, setErrorSearch] = useState('');
  
  // Multiple families state
  const [userFamilies, setUserFamilies] = useState([]);
  const [selectedFamilyId, setSelectedFamilyId] = useState(null);
  const [showCreateOwnFamilyForm, setShowCreateOwnFamilyForm] = useState(false);
  const [creatingOwnFamily, setCreatingOwnFamily] = useState(false);
  

  // Search logic (API)
  useEffect(() => {
    let active = true;
    if (searchTerm.length > 0) {
      setLoadingSearch(true);
      setErrorSearch('');
      api.get('/parishioners', { params: { search: searchTerm } })
        .then(res => {
          if (!active) return;
          
          // Check if we're inviting to a secondary family (own family)
          const selectedFamily = userFamilies.find(f => f.id === selectedFamilyId);
          const isSecondaryFamily = selectedFamily && !selectedFamily.is_primary;
          const originalFamilyId = user?.family_id; // User's original family ID
          
          // Filter to only valid results (exclude self and current family members)
          // If inviting to secondary family, show members from original family but mark them as not invitable
          const filtered = res.data.filter(p => {
            // Basic filters
            if (p.is_admin || p.is_staff || p.is_priest) return false;
            if (p.id === user?.id) return false; // Prevent searching own account
            if (familyMembers.some(f => f.family_member_id === p.id || f.id === p.id)) return false;
            
            return true;
          }).map(p => {
            // Mark members from original family as not invitable if inviting to secondary family
            if (isSecondaryFamily && originalFamilyId && p.family_id === originalFamilyId) {
              p.cannotInvite = true;
              p.cannotInviteReason = 'Member from your original family';
            }
            return p;
          });
          setSearchResults(filtered);
        })
        .catch(err => { 
          if (active) {
            setErrorSearch('Search failed');
          }
        })
        .finally(() => { if (active) setLoadingSearch(false); });
    } else {
      setSearchResults([]);
    }
    return () => { active = false; };
  }, [searchTerm, familyMembers, pendingSentInvites, user, selectedFamilyId, userFamilies]);

  // Accept/Reject invitation (API)

  // Send invitation (API)
  const handleSendInvite = async (parishioner, relationship) => {
    try {
      // Get the selected family ID to send invitation to
      const selectedFamily = userFamilies.find(f => f.id === selectedFamilyId);
      const targetFamilyId = selectedFamily?.id || user?.family_id;
      
      const response = await api.post('/family-invitations', {
        invitee_id: parishioner.id,
        relationship,
        family_id: targetFamilyId // Send the selected family ID
      });
      setSearchTerm('');
      setSearchResults([]);
      fetchInvitations();
      setShowInviteForm(false);
      
      // Show different message if inviting a family head
      if (parishioner.is_family_head && parishioner.family_id) {
        showSuccess('Invitation Sent!', `Successfully sent ${relationship} invitation to ${parishioner.name}. They will keep their primary family and be linked to yours via relationship.`);
      } else {
        showSuccess('Invitation Sent!', `Successfully sent ${relationship} invitation to ${parishioner.name}.`);
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to send invitation';
      alert(errorMessage);
      
      // If the error is about needing to create a family first, show the create family modal
      if (errorMessage.includes('create a family first')) {
        setShowFamilyForm(false);
        setShowFamilyForm(true); // Show the family form to create a family
      }
      
      // If the error is about not being a family head, close the invite form
      if (errorMessage.includes('Only family heads can invite')) {
        setShowInviteForm(false);
      }
    }
  };

  // Add relationship selection per search result (keyed by parishioner id)
  const [inviteRelationshipById, setInviteRelationshipById] = useState({});

  // Get available relationships based on family head's role
  // Also filters out Mother/Father if they already exist in the family
  // And filters out Father/Mother if the invitee is already a Father/Mother in their own family
  // Also filters based on gender (male can't be Wife/Daughter/Mother, female can't be Husband/Son/Father)
  const getAvailableRelationships = (headRole, inviteeRole = null, inviteeGender = null) => {
    if (!headRole) return ['Father', 'Mother', 'Sibling', 'Spouse', 'Child'];
    
    const roleMap = {
      'Father': ['Wife', 'Son', 'Daughter', 'Sibling'],
      'Mother': ['Husband', 'Son', 'Daughter', 'Sibling'],
      'Son': ['Father', 'Mother', 'Sibling'],
      'Daughter': ['Father', 'Mother', 'Sibling'],
      'Sibling': ['Father', 'Mother', 'Sibling']
    };
    
    let availableRelationships = roleMap[headRole] || ['Father', 'Mother', 'Sibling', 'Spouse', 'Child'];
    
    // Filter out Mother/Father/Husband/Wife if they already exist in the family
    // These relationships should be unique (only one per family)
    const uniqueRelationships = ['Mother', 'Father', 'Husband', 'Wife'];
    const existingRelationships = new Set();
    
    // Check primary family members
    if (user?.family_id && familyMembers) {
      familyMembers.forEach(member => {
        if (member.relationship_to_head && uniqueRelationships.includes(member.relationship_to_head)) {
          existingRelationships.add(member.relationship_to_head);
        }
        // Also check the relationship field for linked members
        if (member.relationship && uniqueRelationships.includes(member.relationship)) {
          existingRelationships.add(member.relationship);
        }
      });
    }
    
    // Filter out relationships that already exist in the family
    availableRelationships = availableRelationships.filter(rel => !existingRelationships.has(rel));
    
    // Filter out Father/Mother/Husband/Wife if the invitee is already a Father/Mother in their own family
    if (inviteeRole) {
      if (inviteeRole === 'Father') {
        // If invitee is already a Father, they cannot be invited as Father or Husband
        availableRelationships = availableRelationships.filter(rel => rel !== 'Father' && rel !== 'Husband');
      } else if (inviteeRole === 'Mother') {
        // If invitee is already a Mother, they cannot be invited as Mother or Wife
        availableRelationships = availableRelationships.filter(rel => rel !== 'Mother' && rel !== 'Wife');
      }
    }
    
    // Filter based on gender
    if (inviteeGender) {
      if (inviteeGender.toLowerCase() === 'male' || inviteeGender.toLowerCase() === 'm') {
        // Male cannot be Wife, Daughter, or Mother
        availableRelationships = availableRelationships.filter(rel => 
          rel !== 'Wife' && rel !== 'Daughter' && rel !== 'Mother'
        );
      } else if (inviteeGender.toLowerCase() === 'female' || inviteeGender.toLowerCase() === 'f') {
        // Female cannot be Husband, Son, or Father
        availableRelationships = availableRelationships.filter(rel => 
          rel !== 'Husband' && rel !== 'Son' && rel !== 'Father'
        );
      }
    }
    
    return availableRelationships;
  };

  useEffect(() => {
    const loadUserData = async () => {
      // Load from localStorage first for quick display
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        const userData = JSON.parse(storedUser);
        setUser(userData);
        setEditForm({
          name: userData.name || '',
          phone: userData.phone || '',
          gender: userData.gender || '',
          birthdate: userData.birthdate ? userData.birthdate.split('T')[0] : '',
          address: userData.address || '',
          profileImageFile: null,
          profileImagePreview: null
        });
        
        // Fetch latest user data from API to ensure we have current membership_status and relationship_to_head
        try {
          const response = await api.get('/user');
          if (response.data) {
            const updatedUser = response.data;
            setUser(updatedUser);
            // Update localStorage with latest data
            localStorage.setItem('user', JSON.stringify(updatedUser));
            // Update edit form if needed
            setEditForm(prev => ({
              ...prev,
              name: updatedUser.name || prev.name,
              phone: updatedUser.phone || prev.phone,
              gender: updatedUser.gender || prev.gender,
              birthdate: updatedUser.birthdate ? updatedUser.birthdate.split('T')[0] : prev.birthdate,
              address: updatedUser.address || prev.address,
            }));
          }
        } catch (error) {
          console.error('Failed to fetch user data:', error);
          // Continue with localStorage data if API call fails
        }
        
        // Fetch all user families (primary and secondary) and invitations from API
        fetchUserFamilies();
        fetchInvitations();
        // fetch donation history for profile card
        fetchDonationHistory();
        // fetch sacrament history for profile card
        fetchSacramentHistory();
      } else {
        navigate('/login');
      }
    };
    
    loadUserData();
  }, [navigate]);

  // Refresh donation history when user changes or when staff verifies a donation
  useEffect(() => {
    if (user && user.email) fetchDonationHistory();

    const handler = () => fetchDonationHistory();
    window.addEventListener('donationVerified', handler);
    return () => window.removeEventListener('donationVerified', handler);
  }, [user]);

  // Refresh sacrament history when user changes
  useEffect(() => {
    if (user && user.id) {
      console.log('Profile.jsx: User changed, fetching sacrament history for:', user.id);
      fetchSacramentHistory();
    }

    // Listen for sacrament history updates
    const handler = () => {
      console.log('Profile.jsx: Sacrament history updated event received');
      fetchSacramentHistory();
    };
    window.addEventListener('sacramentHistoryUpdated', handler);
    return () => window.removeEventListener('sacramentHistoryUpdated', handler);
  }, [user]);

  const handleEditToggle = () => {
    setIsEditing(!isEditing);
    if (!isEditing && user) {
      setEditForm({
        name: user.name || '',
        phone: user.phone || '',
        gender: user.gender || '',
        birthdate: user.birthdate ? user.birthdate.split('T')[0] : '',
        address: user.address || '',
        profileImageFile: null,
        profileImagePreview: null
      });
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Get label text if available
    const label = e.target.previousElementSibling?.textContent || e.target.closest('label')?.textContent || '';
    
    // For phone field, only allow numbers and limit to 11 digits
    if (name === 'phone') {
      const numericValue = value.replace(/[^0-9]/g, '').slice(0, 11);
      setEditForm(prev => ({
        ...prev,
        [name]: numericValue
      }));
    } else {
      // Use smart sanitize for name, address, and other fields
      const sanitizedValue = smartSanitize(value, name, label);
      setEditForm(prev => ({
        ...prev,
        [name]: sanitizedValue
      }));
    }
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      const csrfResponse = await fetch('/csrf-token', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'X-Requested-With': 'XMLHttpRequest',
        },
      });
      const csrfData = await csrfResponse.json();
      const csrfToken = csrfData.csrf_token;

      // Create FormData object to handle file upload
      const formData = new FormData();
      formData.append('name', editForm.name);
      formData.append('phone', editForm.phone);
      formData.append('gender', editForm.gender);
      formData.append('birthdate', editForm.birthdate);
      formData.append('address', editForm.address);
      
      // Append profile image if it exists
      if (editForm.profileImageFile) {
        console.log('Uploading profile image:', editForm.profileImageFile.name);
        formData.append('profile_image', editForm.profileImageFile);
      }

      console.log('Sending profile update request...');
      const response = await fetch('/api/update-profile', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'X-CSRF-TOKEN': csrfToken,
          'X-Requested-With': 'XMLHttpRequest',
        },
        body: formData
      });

      const data = await response.json();
      console.log('Profile update response:', data);

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update profile');
      }

      // Update the user data with the new profile image URL
      const newUserData = {
        ...user,
        ...data.user,
        family_members: familyMembers
      };
      
      console.log('Updating user data:', newUserData);
      setUser(newUserData);
      localStorage.setItem('user', JSON.stringify(newUserData));
      setIsEditing(false);
      setEditForm(prev => ({ ...prev, profileImageFile: null, profileImagePreview: null }));
      
      // Show success popup
      const hasImageUpdate = editForm.profileImageFile;
      const hasDetailsUpdate = editForm.name !== user?.name || 
                              editForm.phone !== user?.phone || 
                              editForm.gender !== user?.gender || 
                              editForm.birthdate !== (user?.birthdate ? user.birthdate.split('T')[0] : '') || 
                              editForm.address !== user?.address;
      
      if (hasImageUpdate && hasDetailsUpdate) {
        showSuccess('Profile Updated!', 'Your profile photo and personal details have been updated successfully.');
      } else if (hasImageUpdate) {
        showSuccess('Photo Updated!', 'Your profile photo has been updated successfully.');
      } else if (hasDetailsUpdate) {
        showSuccess('Details Updated!', 'Your personal details have been updated successfully.');
      } else {
        showSuccess('Profile Updated!', 'Your profile has been updated successfully.');
      }
    } catch (err) {
      console.error('Profile update failed:', err);
      alert(err.message || 'Failed to update profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    if (user) {
      setEditForm({
        name: user.name || '',
        phone: user.phone || '',
        gender: user.gender || '',
        birthdate: user.birthdate ? user.birthdate.split('T')[0] : '',
        address: user.address || '',
        profileImageFile: null,
        profileImagePreview: null
      });
    }
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      const csrfResponse = await fetch('/csrf-token', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'X-Requested-With': 'XMLHttpRequest',
        },
      });
      const csrfData = await csrfResponse.json();
      const csrfToken = csrfData.csrf_token;

      const response = await fetch('/logout', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': csrfToken,
          'X-Requested-With': 'XMLHttpRequest',
        },
      });

      if (!response.ok) {
        throw new Error('Logout failed with status ' + response.status);
      }

      localStorage.removeItem('user');
      window.dispatchEvent(new Event('userLogout'));
      navigate('/');
    } catch (err) {
      console.error('Logout failed:', err);
    } finally {
      setLoggingOut(false);
    }
  };

  const handleDeactivateAccount = async () => {
    setDeactivating(true);
    try {
      const csrfResponse = await fetch('/csrf-token', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'X-Requested-With': 'XMLHttpRequest',
        },
      });
      const csrfData = await csrfResponse.json();
      const csrfToken = csrfData.csrf_token;

      console.log('Deactivating user account:', user); // Debug log
      
      const requestBody = {
        status: 'inactive',
        deactivate: true
      };
      console.log('Sending deactivation request:', requestBody); // Debug log

      const response = await fetch(`/api/users/${user.id}`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': csrfToken,
          'X-Requested-With': 'XMLHttpRequest',
        },
        body: JSON.stringify(requestBody),
      });

      console.log('Deactivation response status:', response.status); // Debug log
      const data = await response.json();
      console.log('Deactivation response data:', data); // Debug log

      if (!response.ok) {
        throw new Error(data.error || data.message || 'Failed to deactivate account');
      }

      // Show success message
      showSuccess('Account Deactivated', 'Your account has been successfully deactivated. You will be logged out.');
      
      // Close modal
      setShowDeactivateModal(false);
      
      // Logout after a short delay
      setTimeout(() => {
        localStorage.removeItem('user');
        window.dispatchEvent(new Event('userLogout'));
        navigate('/');
      }, 2000);
      
    } catch (err) {
      console.error('Deactivate account failed:', err);
      alert(err.message || 'Failed to deactivate account. Please try again.');
    } finally {
      setDeactivating(false);
    }
  };

  const calculateAge = (birthdate) => {
    if (!birthdate) return '';
    const today = new Date();
    const birthDate = new Date(birthdate);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  // Show appropriate form based on user's family status
  const handleAddFamily = () => {
    // Check if user is head of the currently selected family
    const selectedFamily = userFamilies.find(f => f.id === selectedFamilyId);
    const isHeadOfSelectedFamily = selectedFamily?.is_head || (user?.is_family_head && selectedFamily?.is_primary);
    
    if (selectedFamily) {
      if (isHeadOfSelectedFamily) {
        // User is family head of selected family, show invite form
        setShowInviteForm(true);
      } else {
        // User is a family member (not head), show message
        alert('Only the family head can invite new members to the family. Please contact your family head if you need to add someone.');
      }
    } else if (user?.family_id) {
      // Fallback: check primary family head status
      if (user?.is_family_head) {
        setShowInviteForm(true);
      } else {
        alert('Only the family head can invite new members to the family. Please contact your family head if you need to add someone.');
      }
    } else {
      // User doesn't have a family, show create family form
      setShowFamilyForm(true);
    }
  };


  const handleFamilyInput = (e) => {
    const { name, value } = e.target;
    setFamilyForm(prev => ({ ...prev, [name]: value }));
  };

  const handlePhoneInput = (e) => {
    const value = e.target.value;
    // Only allow numeric input
    const numericValue = value.replace(/[^0-9]/g, '');
    // Limit to 11 digits
    const limitedValue = numericValue.slice(0, 11);
    setFamilyForm(prev => ({ ...prev, phone: limitedValue }));
  };

  const handleFamilySave = async (e) => {
    e.preventDefault();
    
    try {
      // Create family in database
      const response = await api.post('/families', {
        family_name: familyForm.family_name || `${user.name}'s Family`,
        address: familyForm.address || user.address || '',
        phone: familyForm.phone || user.phone || '',
        email: familyForm.email || user.email || '',
        family_notes: familyForm.family_notes || `Family created by ${user.name}`,
        family_status: 'active',
        family_role: 'head', // Always 'head' when creating family
        relationship_to_head: familyForm.relationship_role || 'Father' // Store the relationship role
      });

      if (response.data.success) {
        // Fetch updated user data from API to get the latest relationship_to_head
        try {
          const userResponse = await api.get('/user');
          if (userResponse.data) {
            const updatedUserData = userResponse.data;
            setUser(updatedUserData);
            localStorage.setItem('user', JSON.stringify(updatedUserData));
          } else {
            // Fallback: Update user data manually
            const updatedUserData = {
              ...user,
              family_id: response.data.data.id,
              is_family_head: true,
              family_role: 'head',
              relationship_to_head: familyForm.relationship_role || 'Father'
            };
            setUser(updatedUserData);
            localStorage.setItem('user', JSON.stringify(updatedUserData));
          }
        } catch (error) {
          console.error('Failed to fetch updated user data:', error);
          // Fallback: Update user data manually
          const updatedUserData = {
            ...user,
            family_id: response.data.data.id,
            is_family_head: true,
            family_role: 'head',
            relationship_to_head: familyForm.relationship_role || 'Father'
          };
          setUser(updatedUserData);
          localStorage.setItem('user', JSON.stringify(updatedUserData));
        }
        
        // Refresh family members
        fetchFamilyMembers();
        
        setShowFamilyForm(false);
        setFamilyForm({ family_name: '', address: '', phone: '', email: '', family_notes: '', relationship_role: 'Father' });
        
        showSuccess('Family Created', 'Your family was created successfully. You can now invite other parishioners to join your family.');
      } else {
        alert('Failed to create family: ' + (response.data.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error creating family:', error);
      const errorMessage = error.response?.data?.message || error.message;
      alert('Failed to create family: ' + errorMessage);
      
      // If the error is about already being part of a family, close the form
      if (errorMessage.includes('already part of a family')) {
        setShowFamilyForm(false);
      }
    }
  };

  const handleFamilyCancel = () => {
    setShowFamilyForm(false);
    setFamilyForm({ family_name: '', address: '', phone: '', email: '', family_notes: '', relationship_role: 'Father' });
  };

  const getProfileImageUrl = (imageUrl, memberName) => {
    if (!imageUrl) return `https://ui-avatars.com/api/?name=${encodeURIComponent(memberName || 'User')}&background=F9E4C8&color=333&size=256`;
    if (imageUrl.startsWith('data:')) return imageUrl; // For preview images
    if (imageUrl.startsWith('http')) return imageUrl; // Already absolute URL
    
    // Handle relative paths from Laravel storage
    if (imageUrl.startsWith('storage/')) {
      return `${window.location.origin}/${imageUrl}`;
    }
    
    // Handle other relative paths
    if (imageUrl.startsWith('/')) {
      return `${window.location.origin}${imageUrl}`;
    }
    
    // Default fallback
    return imageUrl;
  };

  // Fetch all families for the user (primary and secondary)
  const fetchUserFamilies = async () => {
    setLoadingFamily(true);
    setErrorFamily('');
    try {
      const res = await api.get('/user/families');
      if (res.data.success) {
        const families = res.data.data || [];
        setUserFamilies(families);
        
        // Set selected family to primary family if available, otherwise first family
        if (families.length > 0) {
          const primaryFamily = families.find(f => f.is_primary) || families[0];
          setSelectedFamilyId(primaryFamily.id);
          // Fetch members for selected family
          await fetchFamilyMembersForFamily(primaryFamily.id);
        } else {
          setSelectedFamilyId(null);
          setFamilyMembers([]);
        }
      }
    } catch (err) {
      console.error('Failed to fetch user families:', err);
      setErrorFamily('Failed to load families');
      // Fallback to old method if new endpoint fails
      fetchFamilyMembers();
    } finally {
      setLoadingFamily(false);
    }
  };

  // Fetch family members for a specific family
  const fetchFamilyMembersForFamily = async (familyId) => {
    try {
      // Refresh families list first to get latest data
      const res = await api.get('/user/families');
      if (res.data.success) {
        const families = res.data.data || [];
        setUserFamilies(families);
        
        const family = families.find(f => f.id === familyId);
        if (family) {
          setFamilyMembers(family.members || []);
        } else {
          // Fallback: fetch from old endpoint
          const fallbackRes = await api.get('/family-members');
          setFamilyMembers(Array.isArray(fallbackRes.data) ? fallbackRes.data : []);
        }
      }
    } catch (err) {
      console.error('Failed to fetch family members:', err);
      // Fallback: fetch from old endpoint
      try {
        const fallbackRes = await api.get('/family-members');
        setFamilyMembers(Array.isArray(fallbackRes.data) ? fallbackRes.data : []);
      } catch (fallbackErr) {
        setFamilyMembers([]);
      }
    }
  };

  // Fetch family members from API (now returns all in family group)
  const fetchFamilyMembers = async () => {
    setLoadingFamily(true);
    setErrorFamily('');
    try {
      const res = await api.get('/family-members');
      // Ensure familyMembers is always an array
      setFamilyMembers(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      setErrorFamily('Failed to load family members');
      setFamilyMembers([]); // Set to empty array on error
    } finally {
      setLoadingFamily(false);
    }
  };
  
  // Handle creating own family group (for children)
  const handleCreateOwnFamily = async (e) => {
    e.preventDefault();
    setCreatingOwnFamily(true);
    
    try {
      // Automatically determine relationship based on user's current relationship or gender
      // Son -> Father, Daughter -> Mother in their new family group
      let relationshipToHead = 'Father'; // Default
      const userRelationship = user?.relationship_to_head?.toLowerCase();
      const userGender = user?.gender?.toLowerCase();
      
      if (userRelationship === 'son' || (userGender === 'male' && userRelationship !== 'daughter')) {
        relationshipToHead = 'Father';
      } else if (userRelationship === 'daughter' || userGender === 'female') {
        relationshipToHead = 'Mother';
      }
      
      const response = await api.post('/families', {
        family_name: familyForm.family_name || `${user.name}'s Family`,
        address: familyForm.address || user.address || '',
        phone: familyForm.phone || user.phone || '',
        email: familyForm.email || user.email || '',
        is_secondary_family: true, // Mark as secondary family
        relationship_to_head: relationshipToHead, // Set relationship in new family (Son->Father, Daughter->Mother)
        newsletter_subscribed: true,
        volunteer_family: false,
      });

      if (response.data.success) {
        showSuccess('Family Created!', 'Your own family group has been created successfully!');
        setShowCreateOwnFamilyForm(false);
        setFamilyForm({ family_name: '', address: '', phone: '', email: '' });
        
        // Refresh families list
        await fetchUserFamilies();
        
        // Select the newly created family
        if (response.data.data) {
          setSelectedFamilyId(response.data.data.id);
        }
      }
    } catch (err) {
      // Show detailed error message
      let errorMessage = 'Failed to create family group';
      if (err.response?.data) {
        if (err.response.data.errors) {
          // Validation errors
          const errors = err.response.data.errors;
          errorMessage = Object.values(errors).flat().join('\n');
        } else if (err.response.data.message) {
          errorMessage = err.response.data.message;
        }
      }
      console.error('Family creation error:', err.response?.data || err);
      alert(errorMessage);
    } finally {
      setCreatingOwnFamily(false);
    }
  };
  
  // Handle family tab switch
  const handleFamilyTabSwitch = async (familyId) => {
    setSelectedFamilyId(familyId);
    await fetchFamilyMembersForFamily(familyId);
  };

  // Fetch invitations from API
  const fetchInvitations = async () => {
    setLoadingInvites(true);
    setErrorInvites('');
    try {
      const res = await api.get('/family-invitations');
      if (user && user.id) {
        setPendingSentInvites(res.data.filter(i => i.inviter_id === user.id && i.status === 'pending'));
      }
    } catch (err) {
      setErrorInvites('Failed to load invitations');
    } finally {
      setLoadingInvites(false);
    }
  };


  useEffect(() => {
    if (user && user.id) {
      fetchUserFamilies();
      fetchInvitations();
    }
  }, [user]);


  // Listen for family deletion event to refresh family members
  useEffect(() => {
    const handleFamilyDeleted = async () => {
      if (user && user.id) {
        // Fetch latest user data from API to ensure we have current family_id and other fields
        try {
          const response = await api.get('/user');
          if (response.data) {
            const updatedUser = response.data;
            setUser(updatedUser);
            // Update localStorage with latest data
            localStorage.setItem('user', JSON.stringify(updatedUser));
            // Update edit form if needed
            setEditForm(prev => ({
              ...prev,
              name: updatedUser.name || prev.name,
              phone: updatedUser.phone || prev.phone,
              gender: updatedUser.gender || prev.gender,
              birthdate: updatedUser.birthdate ? updatedUser.birthdate.split('T')[0] : prev.birthdate,
              address: updatedUser.address || prev.address,
            }));
          }
        } catch (error) {
          console.error('Failed to fetch user data after family deletion:', error);
        }
        
        // Refresh families and invitations
        fetchUserFamilies();
        fetchInvitations();
      }
    };
    
    window.addEventListener('familyDeleted', handleFamilyDeleted);
    return () => {
      window.removeEventListener('familyDeleted', handleFamilyDeleted);
    };
  }, [user]);

  // Scroll to family grouping if triggered by notification
  useEffect(() => {
    const handleFamilyNotification = () => {
      if (familySectionRef.current) {
        familySectionRef.current.scrollIntoView({ behavior: 'smooth' });
        // Optionally highlight
        familySectionRef.current.classList.add('highlight-family-group');
        setTimeout(() => {
          familySectionRef.current.classList.remove('highlight-family-group');
        }, 2000);
      }
    };
    window.addEventListener('goToFamilyGrouping', handleFamilyNotification);
    return () => {
      window.removeEventListener('goToFamilyGrouping', handleFamilyNotification);
    };
  }, []);

  // Helper: Determine if current user is family head
  const isFamilyHead = user?.is_family_head || (familyMembers.length > 0 && familyMembers[0].id === user?.id);

  // Remove a family member (head only) - handles both primary family members and linked relationships
  const handleRemoveMember = async (memberId, isLinkedViaRelationship = false) => {
    // Find the member to be removed
    const memberToRemove = familyMembers.find(m => m.id === memberId);
    
    // Get the currently selected family to determine if this is a secondary family
    const selectedFamily = userFamilies.find(f => f.id === selectedFamilyId);
    const isSecondaryFamily = selectedFamily && !selectedFamily.is_primary;
    
    // Prevent removing primary family members who are family heads (same family)
    // But allow removing linked family members even if they are family heads of their own families
    if (!isLinkedViaRelationship && memberToRemove && memberToRemove.is_family_head && memberToRemove.family_id === user?.family_id) {
      alert('Cannot remove the family head from your primary family. Please contact support if you need to transfer family head status.');
      return;
    }
    
    const confirmMessage = isLinkedViaRelationship 
      ? 'Are you sure you want to remove this linked family relationship?'
      : 'Are you sure you want to remove this member from your family group?';
    
    if (!window.confirm(confirmMessage)) return;
    
    try {
      if (isLinkedViaRelationship) {
        // Remove linked family relationship
        await api.post('/family-members/remove-relationship', { member_id: memberId });
      } else {
        // Remove family member - pass family_id if removing from secondary family
        const url = isSecondaryFamily && selectedFamily
          ? `/family-members/${memberId}?family_id=${selectedFamily.id}`
          : `/family-members/${memberId}`;
        await api.delete(url);
      }
      
      // Refresh the family members list
      if (selectedFamilyId) {
        await fetchUserFamilies();
      } else {
        fetchFamilyMembers();
      }
      
      showSuccess('Member Removed', isLinkedViaRelationship 
        ? 'The linked family relationship has been removed.' 
        : 'The member has been removed from your family group.');
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.response?.data?.error || 'Failed to remove member.';
      alert(errorMessage);
    }
  };

  // Leave the family group (member only - not for family heads)
  const handleLeaveGroup = async () => {
    if (!window.confirm('Are you sure you want to leave this family group?')) return;
    
    try {
      // Get the selected family ID to know which family to leave
      const selectedFamily = userFamilies.find(f => f.id === selectedFamilyId);
      const familyId = selectedFamily?.id || user?.family_id;
      
      await api.post('/family-members/leave', {
        family_id: familyId // Send which family to leave
      });
      fetchFamilyMembers();
      await fetchUserFamilies(); // Refresh families list
      showSuccess('Left Family Group', 'You have left the family group.');
      window.location.reload();
    } catch (err) {
      const errorMessage = err.response?.data?.error || err.response?.data?.message || 'Failed to leave the group. Please contact your administrator.';
      alert(errorMessage);
    }
  };

  if (!user) {
    return (
      <div className="profile-bg">
        <div className="profile-card" style={{textAlign: 'center', fontSize: '1.2rem', color: '#CD8B3E'}}>
          Loading profile...
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="profile-bg-container">
        <div className="profile-bg">
          <div className="profile-grid-layout responsive-profile-grid">
            {/* Left Column: Profile Card */}
            <div className="profile-left-col responsive-profile-left-col">
              <div className="profile-main-card">
                <div className="profile-header-gold">
                  <div className="profile-header-img">
                    {isEditing ? (
                      <>
                        <div className="profile-img-upload">
                          <img
                            src={getProfileImageUrl(editForm.profileImagePreview || user?.profile_image)}
                            alt="Profile"
                            className="profile-img-large"
                            onError={(e) => {
                              console.error('Profile image failed to load:', e.target.src);
                              e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}&background=F9E4C8&color=333&size=256`;
                            }}
                          />
                        </div>
                        <label htmlFor="profile-image-input" className="profile-img-edit-btn">
                          Insert Photo
                        </label>
                        <input
                          type="file"
                          id="profile-image-input"
                          accept="image/*"
                          className="hidden"
                          onChange={e => {
                            const file = e.target.files[0];
                            if (file) {
                              console.log('Selected file:', file.name);
                              setEditForm(prev => ({ ...prev, profileImageFile: file }));
                              const reader = new FileReader();
                              reader.onload = ev => {
                                console.log('File preview loaded');
                                setEditForm(prev => ({ ...prev, profileImagePreview: ev.target.result }));
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                      </>
                    ) : (
                      <img
                        src={getProfileImageUrl(user?.profile_image)}
                        alt="Profile"
                        className="profile-img-large"
                        onError={(e) => {
                          console.error('Profile image failed to load:', e.target.src);
                          e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}&background=F9E4C8&color=333&size=256`;
                        }}
                      />
                    )}
                  </div>
                  <div className="profile-header-info">
                    <div className="profile-header-name">{user?.name || 'User Name'}</div>
                    <div className="profile-header-role">Parishioner</div>
                    <div className="profile-header-status">
                      <span 
                        className="profile-status-badge" 
                        style={getMembershipStatusStyle(user?.membership_status || 'new_member')}
                      >
                        {getMembershipStatusLabel(user?.membership_status || 'new_member')}
                      </span>
                    </div>
                  </div>
                  <div className="profile-header-actions" style={{display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'flex-start'}}>
                    <button onClick={handleEditToggle} className="profile-update-btn">Update Profile</button>
                    <button 
                      onClick={() => setShowDeactivateModal(true)} 
                      className="profile-deactivate-btn"
                      style={{
                        background: '#dc2626',
                        color: 'white',
                        border: 'none',
                        borderRadius: '15px',
                        padding: '0.3rem 0.8rem',
                        fontSize: '0.7rem',
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.background = '#b91c1c';
                        e.target.style.transform = 'translateY(-2px)';
                        e.target.style.boxShadow = '0 6px 20px rgba(220, 38, 38, 0.3)';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.background = '#dc2626';
                        e.target.style.transform = 'translateY(0)';
                        e.target.style.boxShadow = 'none';
                      }}
                    >
                      Deactivate Account
                    </button>
                  </div>
                </div>
                <div className="profile-details-section">
                  <div className="profile-details-title">Personal details</div>
                  <div className="profile-details-container">
                    <div className="profile-details-list">
                      <div className="profile-detail-card"><b>Email:</b> {user?.email}</div>
                      {isEditing ? (
                        <>
                          <div className="profile-detail-card"><b>Name:</b> <input className="input-edit" type="text" name="name" value={editForm.name} onChange={handleInputChange} /></div>
                          <div className="profile-detail-card"><b>Phone:</b> <input className="input-edit" type="tel" name="phone" value={editForm.phone} onChange={handleInputChange} pattern="[0-9]{11}" inputMode="numeric" maxLength="11" /></div>
                          <div className="profile-detail-card"><b>Gender:</b> <select className="input-edit" name="gender" value={editForm.gender} onChange={handleInputChange}>
                            <option value="">Select</option>
                            <option value="male">Male</option>
                            <option value="female">Female</option>
                          </select></div>
                          <div className="profile-detail-card"><b>Birthdate:</b> <input className="input-edit" type="date" name="birthdate" value={editForm.birthdate} onChange={handleInputChange} /></div>
                          <div className="profile-detail-card"><b>Address:</b> <input className="input-edit" type="text" name="address" value={editForm.address} onChange={handleInputChange} /></div>
                        </>
                      ) : (
                        <>
                          <div className="profile-detail-card"><b>Name:</b> {user?.name}</div>
                          <div className="profile-detail-card"><b>Phone:</b> {user?.phone}</div>
                          <div className="profile-detail-card"><b>Gender:</b> {user?.gender}</div>
                          <div className="profile-detail-card"><b>Birthdate:</b> {user?.birthdate?.split('T')[0]}</div>
                          <div className="profile-detail-card"><b>Address:</b> {user?.address}</div>
                        </>
                      )}
                    </div>
                  </div>
                  {isEditing && (
                    <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'center', gap: '1rem' }}>
                      <button onClick={handleSaveProfile} disabled={isSaving} className="profile-save-btn profile-action-btn">
                        {isSaving ? 'Saving...' : 'Save'}
                      </button>
                      <button onClick={handleCancelEdit} className="profile-cancel-btn profile-action-btn">
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column: Sacrament and Donation History */}
            <div className="profile-right-col responsive-profile-right-col">
              <div className="profile-section">
                <div className="profile-section-header gold">Sacrament History</div>
                <div className="history-modern-container">
                  {loadingSacraments ? (
                    <div className="history-empty-state">
                      <div className="history-empty-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                          <polyline points="14,2 14,8 20,8"/>
                          <line x1="16" y1="13" x2="8" y2="13"/>
                          <line x1="16" y1="17" x2="8" y2="17"/>
                          <polyline points="10,9 9,9 8,9"/>
                        </svg>
                      </div>
                      <h3>Loading...</h3>
                      <p>Fetching your sacrament records</p>
                    </div>
                  ) : errorSacraments ? (
                    <div className="history-empty-state">
                      <div className="history-empty-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                          <polyline points="14,2 14,8 20,8"/>
                          <line x1="16" y1="13" x2="8" y2="13"/>
                          <line x1="16" y1="17" x2="8" y2="17"/>
                          <polyline points="10,9 9,9 8,9"/>
                        </svg>
                      </div>
                      <h3>Error Loading Sacraments</h3>
                      <p>{errorSacraments}</p>
                    </div>
                  ) : sacramentHistory.length === 0 ? (
                    <div className="history-empty-state">
                      <div className="history-empty-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                          <polyline points="14,2 14,8 20,8"/>
                          <line x1="16" y1="13" x2="8" y2="13"/>
                          <line x1="16" y1="17" x2="8" y2="17"/>
                          <polyline points="10,9 9,9 8,9"/>
                        </svg>
                      </div>
                      <h3>No Sacraments Yet</h3>
                      <p>Your sacrament records will appear here</p>
                    </div>
                  ) : (
                    <div className="history-cards-grid">
                      {sacramentHistory.slice(0, 2).map((s, idx) => (
                        <div className="history-card sacrament-card" key={idx}>
                          <div className="history-card-header">
                            <div className="history-card-icon">
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                                <path d="M2 17l10 5 10-5"/>
                                <path d="M2 12l10 5 10-5"/>
                              </svg>
                            </div>
                            <div className="history-card-title">{s.type}</div>
                          </div>
                          <div className="history-card-content">
                            <div className="history-card-item">
                              <span className="history-label">Date:</span>
                              <span className="history-value">{formatDate(s.date)}</span>
                            </div>
                            <div className="history-card-item">
                              <span className="history-label">Parish:</span>
                              <span className="history-value">{s.parish}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="profile-section-footer">
                  <button className="profile-viewall-btn" onClick={() => navigate('/sacrament-history')}>View All</button>
                </div>
              </div>

              <div className="profile-section">
                <div className="profile-section-header gold">Donation History</div>
                <div className="history-modern-container">
                  {donationHistory.length === 0 ? (
                    <div className="history-empty-state">
                      <div className="history-empty-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                        </svg>
                      </div>
                      <h3>No Donations Yet</h3>
                      <p>Your donation records will appear here</p>
                    </div>
                  ) : (
                    <div className="history-cards-grid">
                      {donationHistory.slice(0, 2).map((d, idx) => (
                        <div className="history-card donation-card" key={idx}>
                          <div className="history-card-header">
                            <div className="history-card-icon">
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                              </svg>
                            </div>
                            <div className="history-card-title">₱{d.amount}</div>
                          </div>
                          <div className="history-card-content">
                            <div className="history-card-item">
                              <span className="history-label">Date:</span>
                              <span className="history-value">{d.date}</span>
                            </div>
                            <div className="history-card-item">
                              <span className="history-label">Purpose:</span>
                              <span className="history-value">{d.purpose}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="profile-section-footer">
                  <button className="profile-viewall-btn" onClick={() => navigate('/donation-history')}>View All</button>
                </div>
              </div>
            </div>

            {/* Family Grouping Section - now full width below both columns */}
            <div className="family-grouping-fullwidth" ref={familySectionRef}>
              <div className="profile-section family-grouping-section">
                <div className="profile-section-header gold" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                  <span style={{ fontSize: '1.2rem', fontWeight: '700', letterSpacing: '-0.3px', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>Family Grouping</span>
                  <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    {/* Show "Create Own Family Group" button for children who don't have a secondary family yet */}
                    {(() => {
                      // Check if user is a child in ANY family (primary or secondary/extended)
                      // First check the currently selected family, then check primary family
                      const selectedFamily = userFamilies.find(f => f.id === selectedFamilyId);
                      let userRelationship = '';
                      let userFamilyRole = '';
                      let isChildInAnyFamily = false;
                      
                      // Check if user is a child in ANY family they belong to
                      // First check primary family
                      const primaryFamilyRole = (user?.family_role || '').toString().toLowerCase().trim();
                      const primaryRelationship = (user?.relationship_to_head || '').toString().toLowerCase().trim();
                      const isChildInPrimary = primaryFamilyRole === 'child' || 
                                              primaryRelationship === 'son' || 
                                              primaryRelationship === 'daughter';
                      
                      // Then check all secondary/extended families
                      let isChildInSecondary = false;
                      if (Array.isArray(userFamilies) && userFamilies.length > 0) {
                        for (const family of userFamilies) {
                          if (!family.is_primary) {
                            const userInFamily = family.members?.find(m => m.id === user?.id);
                            if (userInFamily) {
                              const relationship = (userInFamily.relationship_to_head || '').toString().toLowerCase().trim();
                              const familyRole = (userInFamily.family_role || '').toString().toLowerCase().trim();
                              if (familyRole === 'child' || relationship === 'son' || relationship === 'daughter') {
                                isChildInSecondary = true;
                                break;
                              }
                            }
                          }
                        }
                      }
                      
                      // User is a child if they are a child in primary OR any secondary family
                      isChildInAnyFamily = isChildInPrimary || isChildInSecondary;
                      
                      // User must be part of at least one family
                      const hasFamily = !!user?.family_id || (Array.isArray(userFamilies) && userFamilies.length > 0);
                      
                      // Check if user already has a secondary family where they are the head
                      const hasSecondaryFamily = Array.isArray(userFamilies) && userFamilies.length > 0 && 
                                                 userFamilies.some(f => !f.is_primary && f.is_head);
                      
                      // Also check if user is already a family head (in primary family)
                      const isAlreadyHead = user?.is_family_head === true || user?.is_family_head === 1;
                      
                      // Show button if: user is a child in any family, has a family, not already a head, and doesn't have secondary family
                      const shouldShow = isChildInAnyFamily && hasFamily && !isAlreadyHead && !hasSecondaryFamily;
                      
                      return shouldShow;
                    })() && (
                      <button 
                        onClick={() => setShowCreateOwnFamilyForm(true)}
                        className="profile-update-btn"
                        style={{
                          background: '#F5F5DC',
                          color: 'black',
                          border: 'none',
                          borderRadius: '25px',
                          padding: '0.7rem 1.8rem',
                          fontSize: '0.95rem',
                          fontWeight: '600',
                          cursor: 'pointer',
                          transition: 'all 0.3s ease'
                        }}
                      >
                        Create Own Family Group
                      </button>
                    )}
                    {(() => {
                      // Show Family Head Management button if user is head of the selected family
                      const selectedFamily = userFamilies.find(f => f.id === selectedFamilyId);
                      const isHeadOfSelectedFamily = selectedFamily?.is_head || (user?.is_family_head && selectedFamily?.is_primary);
                      return isHeadOfSelectedFamily ? (
                        <button 
                          onClick={() => {
                            const url = selectedFamily?.is_primary 
                              ? '/family-head-management'
                              : `/family-head-management?family_id=${selectedFamily.id}`;
                            navigate(url);
                          }}
                          className="profile-update-btn"
                          style={{
                            background: '#F5F5DC',
                            color: 'black',
                            border: 'none',
                            borderRadius: '25px',
                            padding: '0.7rem 1.8rem',
                            fontSize: '0.95rem',
                            fontWeight: '600',
                            cursor: 'pointer',
                            transition: 'all 0.3s ease'
                          }}
                        >
                          Family Head Management
                        </button>
                      ) : null;
                    })()}
                  </div>
                </div>
                
                {/* Family Tabs - Show when user has multiple families */}
                {userFamilies.length > 1 && (
                  <div style={{ 
                    display: 'flex', 
                    gap: '0.5rem', 
                    padding: '1rem 2.5rem 0 2.5rem',
                    borderBottom: '2px solid #f3f4f6',
                    flexWrap: 'wrap'
                  }}>
                    {userFamilies.map((family) => (
                      <button
                        key={family.id}
                        onClick={() => handleFamilyTabSwitch(family.id)}
                        style={{
                          padding: '0.75rem 1.5rem',
                          fontSize: '0.95rem',
                          fontWeight: '600',
                          cursor: 'pointer',
                          border: 'none',
                          background: selectedFamilyId === family.id ? '#CD8B3E' : 'transparent',
                          color: selectedFamilyId === family.id ? 'white' : '#6b7280',
                          borderBottom: selectedFamilyId === family.id ? '3px solid #CD8B3E' : '3px solid transparent',
                          transition: 'all 0.3s ease',
                          borderRadius: '8px 8px 0 0',
                          position: 'relative',
                          bottom: '-2px'
                        }}
                        onMouseEnter={(e) => {
                          if (selectedFamilyId !== family.id) {
                            e.target.style.background = '#f9fafb';
                            e.target.style.color = '#374151';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (selectedFamilyId !== family.id) {
                            e.target.style.background = 'transparent';
                            e.target.style.color = '#6b7280';
                          }
                        }}
                      >
                        {family.is_primary ? 'Original Family' : family.family_name || 'My Family Group'}
                        {family.is_head && (
                          <span style={{ marginLeft: '0.5rem', fontSize: '0.85rem' }}>👑</span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
                <div className="family-grouping-content one-col-grouping">
                  {loadingFamily ? (
                    <div className="text-center py-2">Loading...</div>
                  ) : errorFamily ? (
                    <div className="text-center py-2 text-red-500">{errorFamily}</div>
                  ) : (
                    <div>
                      <div className="family-members-row">
                        {/* Display current user first if they're part of the selected family */}
                        {(() => {
                          const selectedFamily = userFamilies.find(f => f.id === selectedFamilyId);
                          const isInSelectedFamily = selectedFamily && (
                            (selectedFamily.is_primary && user?.family_id === selectedFamily.id) ||
                            (!selectedFamily.is_primary && selectedFamily.members?.some(m => m.id === user?.id))
                          );
                          return isInSelectedFamily ? (
                          <div className="family-member-card">
                            <div className="family-member-avatar">
                              {getProfileImageUrl(user?.profile_image) ? (
                                <img
                                  src={getProfileImageUrl(user?.profile_image)}
                                  alt={user?.name}
                                  className="family-member-img"
                                  onError={e => {
                                    e.target.onerror = null;
                                    e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}&background=F9E4C8&color=333&size=128`;
                                  }}
                                />
                              ) : (
                                <div style={{ fontSize: '2.7rem', fontWeight: '800', color: '#CD8B3E' }}>
                                  {user?.name ? user.name.split(' ').map(n => n.charAt(0)).join('').toUpperCase() : '?'}
                                </div>
                              )}
                            </div>
                            <div className="family-member-name">{user?.name} <span style={{fontSize: '0.7rem', color: '#5C4B38', fontWeight: 'normal'}}>(You)</span></div>
                            {/* Tags container for consistent alignment */}
                            <div style={{ 
                              display: 'flex', 
                              flexDirection: 'column', 
                              alignItems: 'center', 
                              gap: '0.25rem',
                              width: '100%',
                              marginTop: '0.25rem'
                            }}>
                              {/* Display family role */}
                              {(() => {
                                const selectedFamily = userFamilies.find(f => f.id === selectedFamilyId);
                                let displayRole = null;
                                let isHeadOfThisFamily = false;
                                
                                if (selectedFamily?.is_primary) {
                                  // Primary family - use user's direct properties
                                  // Handle both boolean true and integer 1 from database
                                  isHeadOfThisFamily = user?.is_family_head === true || user?.is_family_head === 1;
                                  displayRole = user?.family_role;
                                } else {
                                  // Secondary family - check pivot data from members array
                                  const userInFamily = selectedFamily?.members?.find(m => m.id === user?.id);
                                  if (userInFamily) {
                                    // Handle both boolean true and integer 1 from database
                                    isHeadOfThisFamily = userInFamily.is_family_head === true || userInFamily.is_family_head === 1;
                                    displayRole = userInFamily.family_role;
                                  } else {
                                    // Fallback: check is_head flag from family object
                                    isHeadOfThisFamily = selectedFamily?.is_head === true || selectedFamily?.is_head === 1;
                                    displayRole = isHeadOfThisFamily ? 'head' : 'member';
                                  }
                                }
                                
                                return displayRole ? (
                                  <div style={{ 
                                    fontSize: '0.75rem', 
                                    color: '#CD8B3E', 
                                    fontWeight: '600',
                                    textTransform: 'capitalize',
                                    padding: '0.125rem 0.5rem',
                                    background: '#FFF6E5',
                                    borderRadius: '12px',
                                    display: 'inline-block',
                                    border: '1px solid #f2e4ce'
                                  }}>
                                    {/* Only show Family Head badge if user is actually head of THIS family */}
                                    {/* isHeadOfThisFamily already handles both true and 1 values */}
                                    {displayRole === 'head' && isHeadOfThisFamily ? '👑 Family Head' : 
                                     displayRole === 'head' && !isHeadOfThisFamily ? '👤 Member' : // Invited family head - show as Member
                                     displayRole === 'spouse' ? '💑 Spouse' :
                                     displayRole === 'child' ? '👶 Child' :
                                     displayRole === 'parent' ? '👴 Parent' :
                                     displayRole === 'sibling' ? '👫 Sibling' :
                                     displayRole === 'other' ? '👤 Other' :
                                     displayRole}
                                  </div>
                                ) : null;
                              })()}
                              {/* Display relationship role (e.g., Father, Mother) */}
                              {(() => {
                                const selectedFamily = userFamilies.find(f => f.id === selectedFamilyId);
                                // For secondary families, get relationship from pivot table (members array)
                                // For primary families, use user's relationship_to_head from users table
                                let relationshipToDisplay = null;
                                
                                if (selectedFamily && !selectedFamily.is_primary) {
                                  // Secondary family - find user in members array to get pivot relationship
                                  const userInFamily = selectedFamily.members?.find(m => m.id === user?.id);
                                  relationshipToDisplay = userInFamily?.relationship_to_head;
                                } else {
                                  // Primary family - use user's relationship_to_head
                                  relationshipToDisplay = user?.relationship_to_head;
                                }
                                
                                return relationshipToDisplay ? (
                                  <div style={{ 
                                    fontSize: '0.7rem', 
                                    color: '#3F2E1E', 
                                    fontWeight: '500',
                                    padding: '0.125rem 0.5rem',
                                    background: '#F5F5DC',
                                    borderRadius: '8px',
                                    display: 'inline-block',
                                    border: '1px solid #f2e4ce'
                                  }}>
                                    {relationshipToDisplay}
                                  </div>
                                ) : null;
                              })()}
                            </div>
                          </div>
                        ) : null;
                        })()}
                        {Array.isArray(familyMembers) && familyMembers
                          .filter(member => member.id !== user?.id) // Filter out current user to prevent duplicates
                          .filter((member, index, self) => 
                            // Remove duplicates based on member ID
                            index === self.findIndex(m => m.id === member.id)
                          )
                          .map((member, idx) => {
                          const imgUrl = getProfileImageUrl(member.profile_image, member.name);
                          const name = member.name;
                          const isLinkedViaRelationship = member.is_linked_via_relationship;
                          const relationship = member.relationship || member.relationship_to_head;
                          const familyRole = member.family_role;
                          
                          return (
                            <div className="family-member-card" key={idx}>
                              <div className="family-member-avatar">
                                {imgUrl ? (
                                  <img
                                    src={imgUrl}
                                    alt={name}
                                    className="family-member-img"
                                    onError={e => {
                                      e.target.onerror = null;
                                      e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'User')}&background=F9E4C8&color=333&size=128`;
                                    }}
                                  />
                                ) : (
                                  <div style={{ fontSize: '2.7rem', fontWeight: '800', color: '#CD8B3E' }}>
                                    {name ? name.split(' ').map(n => n.charAt(0)).join('').toUpperCase() : '?'}
                                  </div>
                                )}
                              </div>
                              <div className="family-member-name">{name}</div>
                              {/* Tags container for consistent alignment */}
                              <div style={{ 
                                display: 'flex', 
                                flexDirection: 'column', 
                                alignItems: 'center', 
                                gap: '0.25rem',
                                width: '100%',
                                marginTop: '0.25rem'
                              }}>
                                {/* Display family role */}
                                {/* Only show Family Head badge if member.is_family_head is true (from pivot table) */}
                                {/* This ensures invited family heads don't show Family Head badge in invited families */}
                                {familyRole ? (
                                  <div style={{ 
                                    fontSize: '0.75rem', 
                                    color: '#CD8B3E', 
                                    fontWeight: '600',
                                    textTransform: 'capitalize',
                                    padding: '0.125rem 0.5rem',
                                    background: '#FFF6E5',
                                    borderRadius: '12px',
                                    display: 'inline-block',
                                    border: '1px solid #f2e4ce'
                                  }}>
                                    {/* Check member.is_family_head to determine if they're head of THIS family */}
                                    {/* Use truthy check since DB might return 1/0 instead of true/false */}
                                    {familyRole === 'head' && (member.is_family_head === true || member.is_family_head === 1) ? '👑 Family Head' : 
                                     familyRole === 'head' && !(member.is_family_head === true || member.is_family_head === 1) ? '👤 Member' : // Invited family head - show as Member
                                     familyRole === 'spouse' ? '💑 Spouse' :
                                     familyRole === 'child' ? '👶 Child' :
                                     familyRole === 'parent' ? '👴 Parent' :
                                     familyRole === 'sibling' ? '👫 Sibling' :
                                     familyRole === 'other' ? '👤 Other' :
                                     familyRole}
                                  </div>
                                ) : null}
                                {/* Display relationship role (e.g., Father, Mother) */}
                                {relationship ? (
                                  <div style={{ 
                                    fontSize: '0.7rem', 
                                    color: isLinkedViaRelationship ? '#9333ea' : '#3F2E1E', 
                                    fontWeight: '500',
                                    padding: '0.125rem 0.5rem',
                                    background: isLinkedViaRelationship ? '#f3e8ff' : '#F5F5DC',
                                    borderRadius: '8px',
                                    display: 'inline-block',
                                    border: '1px solid #f2e4ce',
                                    fontStyle: isLinkedViaRelationship ? 'italic' : 'normal'
                                  }}>
                                    {relationship}
                                  </div>
                                ) : null}
                                {/* Show indicator if this is a linked relationship (not primary family) */}
                                {isLinkedViaRelationship ? (
                                  <div style={{ 
                                    fontSize: '0.65rem', 
                                    color: '#6b7280', 
                                    fontStyle: 'italic'
                                  }}>
                                    Linked Family
                                  </div>
                                ) : null}
                              </div>
                              {/* Action buttons - Only show Remove button if current user is head of the SELECTED family */}
                              {/* For invited family heads, they can only leave, not remove members */}
                              {(() => {
                                const selectedFamily = userFamilies.find(f => f.id === selectedFamilyId);
                                const isHeadOfSelectedFamily = selectedFamily?.is_head || (user?.is_family_head && selectedFamily?.is_primary);
                                // Only show remove button if user is head of THIS family and it's not themselves
                                return isHeadOfSelectedFamily && member.id !== user?.id && (isLinkedViaRelationship || !member.is_family_head || member.family_id !== user?.family_id) ? (
                                  <button 
                                    className="family-remove-btn" 
                                    onClick={() => handleRemoveMember(member.id, isLinkedViaRelationship)} 
                                    style={{
                                      marginTop: 'auto',
                                      color: '#b91c1c', 
                                      border: '1px solid #b91c1c', 
                                      background: 'white', 
                                      borderRadius: 4, 
                                      padding: '4px 12px', 
                                      cursor: 'pointer',
                                      fontSize: '0.875rem',
                                      fontWeight: '500'
                                    }}
                                  >
                                    Remove
                                  </button>
                                ) : null;
                              })()}
                            </div>
                          );
                        })}
                        {/* Add Button - Only show for family heads of the selected family */}
                        {(() => {
                          const selectedFamily = userFamilies.find(f => f.id === selectedFamilyId);
                          const isHeadOfSelectedFamily = selectedFamily?.is_head || (user?.is_family_head && selectedFamily?.is_primary);
                          return isHeadOfSelectedFamily ? (
                            <div className="netflix-add-btn-row family-add-btn-in-row">
                              <button className="netflix-add-btn" onClick={handleAddFamily}>
                                <span className="netflix-add-plus">+</span>
                              </button>
                              <div className="netflix-add-label">
                                Invite Family Member
                              </div>
                            </div>
                          ) : null;
                        })()}
                      </div>
                      {/* Leave button is only for members (not family heads) - show for both primary and secondary families */}
                      {(() => {
                        const selectedFamily = userFamilies.find(f => f.id === selectedFamilyId);
                        const isPrimaryFamily = selectedFamily?.is_primary;
                        const isSecondaryFamily = selectedFamily && !selectedFamily.is_primary;
                        const isHeadOfSelectedFamily = selectedFamily?.is_head || (user?.is_family_head && isPrimaryFamily);
                        
                        // Show leave button if:
                        // 1. User is not the head of the selected family
                        // 2. For primary family: user has a family_id
                        // 3. For secondary family: user is a member of that secondary family
                        const canLeave = !isHeadOfSelectedFamily && (
                          (isPrimaryFamily && user?.family_id) || 
                          (isSecondaryFamily && selectedFamily?.members?.some(m => m.id === user?.id))
                        );
                        
                        return canLeave ? (
                        <div style={{marginTop: '20px', display: 'flex', justifyContent: 'center'}}>
                          <button 
                            className="family-leave-btn" 
                            onClick={handleLeaveGroup} 
                            style={{
                              color: '#b91c1c', 
                              border: '1px solid #b91c1c', 
                              background: 'white', 
                              borderRadius: 4, 
                              padding: '8px 24px', 
                              cursor: 'pointer',
                              fontSize: '14px',
                              fontWeight: '500',
                              transition: 'all 0.3s ease',
                              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
                            }}
                            onMouseOver={(e) => {
                              e.currentTarget.style.background = '#b91c1c';
                              e.currentTarget.style.color = 'white';
                              e.currentTarget.style.boxShadow = '0 4px 8px rgba(185, 28, 28, 0.2)';
                            }}
                            onMouseOut={(e) => {
                              e.currentTarget.style.background = 'white';
                              e.currentTarget.style.color = '#b91c1c';
                              e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
                            }}
                          >
                            Leave Family Group
                          </button>
                        </div>
                      ) : null;
                      })()}
                    </div>
                  )}
                  {Array.isArray(familyMembers) && familyMembers.length === 0 && !loadingFamily && (
                    <div className="text-center py-4">
                      {!user?.family_id && (!userFamilies || userFamilies.length === 0) ? (
                        <div className="netflix-add-btn-row family-add-btn-in-row" style={{ justifyContent: 'center', margin: '0 auto' }}>
                          <button className="netflix-add-btn" onClick={() => setShowFamilyForm(true)}>
                            <span className="netflix-add-plus">+</span>
                          </button>
                          <div className="netflix-add-label">
                            Create Family
                          </div>
                        </div>
                      ) : (
                        <div className="text-gray-500 mb-4" style={{ marginBottom: '1rem' }}>No family members yet.</div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>


            
          </div>
        </div>
        {/* Invite Modal Popup - moved outside profile-bg */}
      </div>
      
      {/* Create Own Family Group Modal */}
      {showCreateOwnFamilyForm && ReactDOM.createPortal(
        <div className="invite-modal-overlay" onClick={() => setShowCreateOwnFamilyForm(false)}>
          <div className="invite-modal" onClick={e => e.stopPropagation()}>
            <button className="invite-modal-close" onClick={() => setShowCreateOwnFamilyForm(false)}>&times;</button>
            <div className="family-invite-search-card" style={{boxShadow: 'none', background: 'none', border: 'none', padding: 0}}>
              <div className="family-invite-search-title">Create Your Own Family Group</div>
              <p style={{ fontSize: '0.9rem', color: '#6b7280', marginBottom: '1.5rem', textAlign: 'center' }}>
                As a child, you can create your own family group while remaining part of your original family.
              </p>
              <form onSubmit={handleCreateOwnFamily} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%' }}>
                <div>
                  <label style={{ display: 'block', fontWeight: 600, color: '#3F2E1E', marginBottom: '0.5rem' }}>Family Name *</label>
                  <input
                    type="text"
                    name="family_name"
                    value={familyForm.family_name}
                    onChange={handleFamilyInput}
                    placeholder="Enter your family name"
                    required
                    className="input-edit"
                    style={{ width: '100%', padding: '0.75rem', borderRadius: 8, border: '1.5px solid #e2cfa3', fontSize: 14, color: '#3F2E1E', background: '#fff', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontWeight: 600, color: '#3F2E1E', marginBottom: '0.5rem' }}>Family Address</label>
                  <input
                    type="text"
                    name="address"
                    value={familyForm.address}
                    onChange={handleFamilyInput}
                    placeholder="Enter family address"
                    className="input-edit"
                    style={{ width: '100%', padding: '0.75rem', borderRadius: 8, border: '1.5px solid #e2cfa3', fontSize: 14, color: '#3F2E1E', background: '#fff', boxSizing: 'border-box' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontWeight: 600, color: '#3F2E1E', marginBottom: '0.5rem' }}>Phone</label>
                    <input
                      type="tel"
                      name="phone"
                      value={familyForm.phone}
                      onChange={handlePhoneInput}
                      placeholder="Phone number (11 digits)"
                      maxLength="11"
                      inputMode="numeric"
                      pattern="[0-9]{11}"
                      className="input-edit"
                      style={{ width: '100%', padding: '0.75rem', borderRadius: 8, border: '1.5px solid #e2cfa3', fontSize: 14, color: '#3F2E1E', background: '#fff', boxSizing: 'border-box' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontWeight: 600, color: '#3F2E1E', marginBottom: '0.5rem' }}>Email</label>
                    <input
                      type="email"
                      name="email"
                      value={familyForm.email}
                      onChange={handleFamilyInput}
                      placeholder="Email address"
                      className="input-edit"
                      style={{ width: '100%', padding: '0.75rem', borderRadius: 8, border: '1.5px solid #e2cfa3', fontSize: 14, color: '#3F2E1E', background: '#fff', boxSizing: 'border-box' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem', alignItems: 'center', flexDirection: 'column' }}>
                  <button 
                    type="submit" 
                    disabled={creatingOwnFamily}
                    className="invite-send-btn"
                    style={{ 
                      background: creatingOwnFamily ? '#9ca3af' : '#CD8B3E', 
                      color: 'white', 
                      padding: '0.625rem 1.5rem', 
                      borderRadius: '0.5rem', 
                      border: 'none', 
                      fontWeight: 600, 
                      width: '100%', 
                      fontSize: '0.875rem',
                      cursor: creatingOwnFamily ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {creatingOwnFamily ? 'Creating...' : 'Create Family Group'}
                  </button>
                  <button 
                    type="button" 
                    onClick={() => {
                      setShowCreateOwnFamilyForm(false);
                      setFamilyForm({ family_name: '', address: '', phone: '', email: '' });
                    }}
                    className="invite-cancel-btn"
                    style={{ background: '#6b7280', color: 'white', padding: '0.625rem 1.5rem', borderRadius: '0.5rem', border: 'none', fontWeight: 600, width: '100%', fontSize: '0.875rem' }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>,
        document.body
      )}

      {showFamilyForm && ReactDOM.createPortal(
        <div className="invite-modal-overlay" onClick={handleFamilyCancel}>
          <div className="invite-modal" onClick={e => e.stopPropagation()}>
            <button className="invite-modal-close" onClick={handleFamilyCancel}>&times;</button>
            <div className="family-invite-search-card" style={{boxShadow: 'none', background: 'none', border: 'none', padding: 0}}>
              <div className="family-invite-search-title">Create Your Family</div>
              <form onSubmit={handleFamilySave} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%' }}>
                <div>
                  <label style={{ display: 'block', fontWeight: 600, color: '#3F2E1E', marginBottom: '0.5rem' }}>Family Name *</label>
                  <input
                    type="text"
                    name="family_name"
                    value={familyForm.family_name}
                    onChange={handleFamilyInput}
                    placeholder="Enter your family name"
                    required
                    className="input-edit"
                    style={{ width: '100%', padding: '0.75rem', borderRadius: 8, border: '1.5px solid #e2cfa3', fontSize: 14, color: '#3F2E1E', background: '#fff', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontWeight: 600, color: '#3F2E1E', marginBottom: '0.5rem' }}>Family Address</label>
                  <input
                    type="text"
                    name="address"
                    value={familyForm.address}
                    onChange={handleFamilyInput}
                    placeholder="Enter family address"
                    className="input-edit"
                    style={{ width: '100%', padding: '0.75rem', borderRadius: 8, border: '1.5px solid #e2cfa3', fontSize: 14, color: '#3F2E1E', background: '#fff', boxSizing: 'border-box' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontWeight: 600, color: '#3F2E1E', marginBottom: '0.5rem' }}>Phone</label>
                    <input
                      type="tel"
                      name="phone"
                      value={familyForm.phone}
                      onChange={handleFamilyInput}
                      placeholder="Phone number"
                      className="input-edit"
                      style={{ width: '100%', padding: '0.75rem', borderRadius: 8, border: '1.5px solid #e2cfa3', fontSize: 14, color: '#3F2E1E', background: '#fff', boxSizing: 'border-box' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontWeight: 600, color: '#3F2E1E', marginBottom: '0.5rem' }}>Email</label>
                    <input
                      type="email"
                      name="email"
                      value={familyForm.email}
                      onChange={handleFamilyInput}
                      placeholder="Email address"
                      className="input-edit"
                      style={{ width: '100%', padding: '0.75rem', borderRadius: 8, border: '1.5px solid #e2cfa3', fontSize: 14, color: '#3F2E1E', background: '#fff', boxSizing: 'border-box' }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontWeight: 600, color: '#3F2E1E', marginBottom: '0.5rem' }}>Your Role in the Family *</label>
                  <select
                    name="relationship_role"
                    value={familyForm.relationship_role}
                    onChange={handleFamilyInput}
                    required
                    className="input-edit"
                    style={{ width: '100%', padding: '0.75rem', borderRadius: 8, border: '1.5px solid #e2cfa3', fontSize: 14, color: '#3F2E1E', background: '#fff', boxSizing: 'border-box' }}
                  >
                    <option value="Father">Father</option>
                    <option value="Mother">Mother</option>
                    <option value="Son">Son</option>
                    <option value="Daughter">Daughter</option>
                    <option value="Sibling">Sibling</option>
                  </select>
                  <p style={{ fontSize: '0.75rem', color: '#5C4B38', marginTop: '0.25rem', marginBottom: 0 }}>
                    Select your role in this family. You will automatically become the Family Head and can invite members based on your role.
                  </p>
                </div>

                <div>
                  <label style={{ display: 'block', fontWeight: 600, color: '#3F2E1E', marginBottom: '0.5rem' }}>Family Notes</label>
                  <textarea
                    name="family_notes"
                    value={familyForm.family_notes}
                    onChange={handleFamilyInput}
                    placeholder="Any additional notes about your family"
                    rows={3}
                    className="input-edit"
                    style={{ width: '100%', padding: '0.75rem', borderRadius: 8, border: '1.5px solid #e2cfa3', fontSize: 14, color: '#3F2E1E', background: '#fff', boxSizing: 'border-box', resize: 'vertical' }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem', alignItems: 'center', flexDirection: 'column' }}>
                  <button 
                    type="submit" 
                    className="invite-send-btn"
                    style={{ background: '#10b981', color: 'white', padding: '0.625rem 1.5rem', borderRadius: '0.5rem', border: 'none', fontWeight: 600, width: '100%', fontSize: '0.875rem' }}
                  >
                    Create Family
                  </button>
                  <button 
                    type="button" 
                    onClick={handleFamilyCancel} 
                    className="profile-cancel-btn family-invite-cancel-btn"
                    style={{ background: '#eee', color: '#3F2E1E', padding: '0.625rem 1.5rem', borderRadius: '0.5rem', border: 'none', fontWeight: 600, width: '100%', fontSize: '0.875rem' }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Invite Parishioner Modal */}
      {showInviteForm && ReactDOM.createPortal(
        <div className="invite-modal-overlay" onClick={() => setShowInviteForm(false)}>
          <div className="invite-modal" onClick={e => e.stopPropagation()}>
            <button className="invite-modal-close" onClick={() => setShowInviteForm(false)}>&times;</button>
            <div className="family-invite-search-card" style={{boxShadow: 'none', background: 'none', border: 'none', padding: 0}}>
              <div className="family-invite-search-title">Invite a Parishioner</div>
              <div className="family-invite-search-row">
                <input
                  type="text"
                  placeholder="Search parishioner by name or email..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="input-edit family-invite-search-input"
                />
                <button className="profile-cancel-btn family-invite-cancel-btn" onClick={() => setShowInviteForm(false)}>Cancel</button>
              </div>
              {loadingSearch ? (
                <div className="text-center py-2">Searching...</div>
              ) : errorSearch ? (
                <div className="text-center py-2 text-red-500">{errorSearch}</div>
              ) : searchResults.length > 0 ? (
                <div className="search-results-list">
                  {searchResults.map(p => {
                    const isPending = p.pending_invited_by_me || pendingSentInvites.some(i => i.invitee_id === p.id && i.status === 'pending');
                    const cannotInvite = p.cannotInvite || false;
                    return (
                      <div key={p.id} className="search-result-item" style={cannotInvite ? { opacity: 0.6 } : {}}>
                        <div className="search-result-info">
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <div className="font-semibold text-[#3F2E1E]">{p.name}</div>
                            {p.is_family_head && p.family_id && (
                              <span style={{
                                fontSize: '0.7rem',
                                padding: '0.125rem 0.375rem',
                                borderRadius: '8px',
                                background: '#f3e8ff',
                                color: '#7c3aed',
                                fontWeight: '600'
                              }}>
                                👑 Family Head
                              </span>
                            )}
                            {cannotInvite && (
                              <span style={{
                                fontSize: '0.7rem',
                                padding: '0.125rem 0.375rem',
                                borderRadius: '8px',
                                background: '#fee2e2',
                                color: '#dc2626',
                                fontWeight: '600'
                              }}>
                                Cannot Invite
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-[#5C4B38]">{p.email}</div>
                          {p.is_family_head && p.family_id && !cannotInvite && (
                            <div className="text-xs" style={{ color: '#9333ea', fontStyle: 'italic', marginTop: '0.25rem' }}>
                              Note: They have their own family but can be linked to yours
                            </div>
                          )}
                          {cannotInvite && (
                            <div className="text-xs" style={{ color: '#dc2626', fontStyle: 'italic', marginTop: '0.25rem' }}>
                              {p.cannotInviteReason || 'Cannot be invited to your own family'}
                            </div>
                          )}
                          {!isPending && !cannotInvite && (
                            <select
                              value={inviteRelationshipById[p.id] || ''}
                              onChange={e => setInviteRelationshipById(prev => ({ ...prev, [p.id]: e.target.value }))}
                              className="invite-relationship-select"
                            >
                              <option value="">Relationship</option>
                              {(() => {
                                // Get the user's role in the currently selected family (the family they're inviting to)
                                // This ensures the relationship options match their role in that specific family
                                const selectedFamily = userFamilies.find(f => f.id === selectedFamilyId);
                                let headRole = null;
                                
                                if (selectedFamily) {
                                  if (selectedFamily.is_primary) {
                                    // Primary family - use user's relationship_to_head from users table
                                    headRole = user?.relationship_to_head;
                                  } else {
                                    // Secondary/extended family - get user's role from members array (pivot data)
                                    const userInFamily = selectedFamily.members?.find(m => m.id === user?.id);
                                    headRole = userInFamily?.relationship_to_head;
                                  }
                                }
                                
                                // Fallback to user's relationship if we couldn't find it
                                if (!headRole) {
                                  headRole = user?.relationship_to_head;
                                }
                                
                                return getAvailableRelationships(headRole, p.relationship_to_head, p.gender).map(rel => (
                                  <option key={rel} value={rel}>{rel}</option>
                                ));
                              })()}
                            </select>
                          )}
                        </div>
                        {isPending ? (
                          <div className="invite-pending-badge">
                            Invitation Pending
                          </div>
                        ) : cannotInvite ? (
                          <div style={{
                            padding: '0.5rem 1rem',
                            borderRadius: '8px',
                            background: '#f3f4f6',
                            color: '#6b7280',
                            fontSize: '0.875rem',
                            fontWeight: '500',
                            cursor: 'not-allowed'
                          }}>
                            Cannot Invite
                          </div>
                        ) : (
                          <button
                            className="invite-send-btn"
                            disabled={!inviteRelationshipById[p.id]}
                            onClick={() => handleSendInvite(p, inviteRelationshipById[p.id])}
                          >
                            Invite
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-2 text-gray-500">No results found.</div>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}




      {/* Deactivate Account Confirmation Modal */}
      {showDeactivateModal && ReactDOM.createPortal(
        <div className="invite-modal-overlay" onClick={() => setShowDeactivateModal(false)}>
          <div className="invite-modal" onClick={e => e.stopPropagation()}>
            <button className="invite-modal-close" onClick={() => setShowDeactivateModal(false)}>&times;</button>
            <div className="family-invite-search-card" style={{boxShadow: 'none', background: 'none', border: 'none', padding: 0}}>
              <div className="family-invite-search-title" style={{color: '#dc2626'}}>⚠️ Deactivate Account</div>
              <div style={{textAlign: 'center', marginBottom: '1.5rem'}}>
                <p style={{color: '#374151', fontSize: '16px', lineHeight: '1.6', marginBottom: '1rem'}}>
                  Are you sure you want to deactivate your account?
                </p>
                <div style={{background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '1rem', marginBottom: '1rem'}}>
                  <p style={{color: '#dc2626', fontSize: '14px', margin: 0, fontWeight: '500'}}>
                    <strong>Warning:</strong> This action will:
                  </p>
                  <ul style={{color: '#dc2626', fontSize: '14px', margin: '0.5rem 0 0 1rem', padding: 0}}>
                    <li>Deactivate your account immediately</li>
                    <li>Log you out of the system</li>
                    <li>Prevent you from accessing your account</li>
                    <li>Require admin approval to reactivate</li>
                  </ul>
              </div>
                <p style={{color: '#6b7280', fontSize: '14px', margin: 0}}>
                  This action cannot be undone. Please contact support if you need help.
                </p>
                  </div>
              <div style={{display: 'flex', gap: '0.75rem', justifyContent: 'flex-end'}}>
                  <button 
                  onClick={handleDeactivateAccount}
                  disabled={deactivating}
                  style={{
                    background: deactivating ? '#9ca3af' : '#dc2626',
                    color: 'white',
                    padding: '0.75rem 1.5rem',
                    borderRadius: '8px',
                    border: 'none',
                    fontWeight: '600',
                    fontSize: '14px',
                    cursor: deactivating ? 'not-allowed' : 'pointer',
                    transition: 'all 0.3s ease'
                  }}
                >
                  {deactivating ? 'Deactivating...' : 'Yes, Deactivate Account'}
                  </button>
                  <button 
                  onClick={() => setShowDeactivateModal(false)}
                  disabled={deactivating}
                  style={{
                    background: '#6b7280',
                    color: 'white',
                    padding: '0.75rem 1.5rem',
                    borderRadius: '8px',
                    border: 'none',
                    fontWeight: '600',
                    fontSize: '14px',
                    cursor: deactivating ? 'not-allowed' : 'pointer',
                    transition: 'all 0.3s ease'
                  }}
                  >
                    Cancel
                  </button>
                </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Success Popup */}
      <SuccessPopup
        isOpen={showSuccessPopup}
        onClose={hideSuccess}
        title={successTitle}
        message={successMessage}
        duration={4000}
      />
    </>
  );
};

export default Profile;
