import React, { useEffect, useState } from 'react';
import SuccessPopup from '../../components/SuccessPopup';
import { Pencil, Trash } from 'lucide-react';
import '../../../css/AdminMembership.css';
import { authenticatedRequest } from '../../utils/csrf';
import { api } from '../../utils/axios';

// Add CSS for loading spinner animation
const spinnerStyle = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

// Inject the CSS
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = spinnerStyle;
  document.head.appendChild(style);
}

const PARISHIONER_STATUSES = [
  { label: 'Active Member', value: 'active', color: 'green' },
  { label: 'Inactive Member', value: 'inactive', color: 'yellow' },
  { label: 'Visitor', value: 'visitor', color: 'blue' },
  { label: 'New Member', value: 'new_member', color: 'purple' },
];

const FAMILY_ROLES = [
  { label: 'Family Head', value: 'head', color: 'purple' },
  { label: 'Spouse', value: 'spouse', color: 'blue' },
  { label: 'Child', value: 'child', color: 'green' },
  { label: 'Parent', value: 'parent', color: 'orange' },
  { label: 'Sibling', value: 'sibling', color: 'teal' },
  { label: 'Other', value: 'other', color: 'gray' },
  // Invitation system roles
  { label: 'Father', value: 'Father', color: 'purple' },
  { label: 'Mother', value: 'Mother', color: 'pink' },
  { label: 'Sibling', value: 'Sibling', color: 'teal' },
  { label: 'Spouse', value: 'Spouse', color: 'blue' },
  { label: 'Child', value: 'Child', color: 'green' },
];

const FAMILY_STATUSES = [
  { label: 'Active Family', value: 'active', color: 'green' },
  { label: 'Inactive Family', value: 'inactive', color: 'yellow' },
  { label: 'Transferred Family', value: 'transferred', color: 'blue' },
];

const ROLES = [
  { label: 'Admin', value: 'admin' },
  { label: 'Staff', value: 'staff' },
  { label: 'Priest', value: 'priest' },
  { label: 'Parishioner', value: 'parishioner' },
];

const FILTERS = [
  { label: 'All', value: 'all' },
  ...PARISHIONER_STATUSES,
];

const initialForm = {
  name: '',
  email: '',
  phone: '',
  address: '',
  birthdate: '1990-01-01',
  membership_status: 'new_member',
  membership_date: '',
  last_attendance: '',
  baptismal_parish: '',
  confirmation_parish: '',
  ministry_involvements: [],
  membership_notes: '',
  newsletter_subscribed: true,
  volunteer_interest: false,
};

const AdminMembership = () => {
  // Helper functions for parishioner status
  const getParishionerStatusColor = (status) => {
    const statusConfig = PARISHIONER_STATUSES.find(s => s.value === status);
    return statusConfig ? statusConfig.color : 'gray';
  };

  const getParishionerStatusLabel = (status) => {
    const statusConfig = PARISHIONER_STATUSES.find(s => s.value === status);
    return statusConfig ? statusConfig.label : 'Unknown';
  };

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [editUser, setEditUser] = useState(null);
  const [deleteUser, setDeleteUser] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [editLoading, setEditLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [parishionerStats, setParishionerStats] = useState(null);
  const [userPage, setUserPage] = useState(1);
  const usersPerPage = 10;
  
  // Family management state
  const [families, setFamilies] = useState([]);
  const [familyStats, setFamilyStats] = useState(null);
  const [showFamilyManagement, setShowFamilyManagement] = useState(false);
  const [showAddFamily, setShowAddFamily] = useState(false);
  const [showEditFamily, setShowEditFamily] = useState(false);
  const [showAddMemberToFamily, setShowAddMemberToFamily] = useState(false);
  const [selectedFamily, setSelectedFamily] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [familyForm, setFamilyForm] = useState({
    family_name: '',
    address: '',
    phone: '',
    email: '',
    newsletter_subscribed: true,
    volunteer_family: false,
    family_status: 'active',
    family_role: 'head',
    relationship_to_head: '',
    is_family_head: false
  });
  const [familyLoading, setFamilyLoading] = useState(false);
  const [showFamilyDetail, setShowFamilyDetail] = useState(false);
  const [showDeleteFamilyConfirm, setShowDeleteFamilyConfirm] = useState(false);
  const [showRemoveMemberConfirm, setShowRemoveMemberConfirm] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState(null);

  // Success popup for family actions
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [successTitle, setSuccessTitle] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const openSuccess = (title, message) => {
    setSuccessTitle(title);
    setSuccessMessage(message);
    setShowSuccessPopup(true);
  };

  // Sacrament history state
  const [showSacramentHistory, setShowSacramentHistory] = useState(false);
  const [selectedUserForSacrament, setSelectedUserForSacrament] = useState(null);
  const [sacramentHistory, setSacramentHistory] = useState([]);
  const [sacramentHistoryLoading, setSacramentHistoryLoading] = useState(false);
  const [showAddSacrament, setShowAddSacrament] = useState(false);
  const [showEditSacrament, setShowEditSacrament] = useState(false);
  const [showDeleteSacrament, setShowDeleteSacrament] = useState(false);
  const [editingSacrament, setEditingSacrament] = useState(null);
  const [deletingSacrament, setDeletingSacrament] = useState(null);
  const [sacramentForm, setSacramentForm] = useState({
    type: '',
    date: '',
    parish: ''
  });
  const [sacramentTypes] = useState([
    'Baptism',
    'Confirmation',
    'Eucharist',
    'Reconciliation',
    'Anointing of the Sick',
    'Holy Orders',
    'Matrimony'
  ]);
  // ...existing code...
  


  useEffect(() => {
    fetch('http://localhost:8000/sanctum/csrf-cookie', {
      credentials: 'include'
    });
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/all-users');
      const data = await response.json();
      // Users already come with family data loaded from the API
      setUsers(data);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  useEffect(() => {
    const loadAllData = async () => {
      setLoading(true);
      try {
        await Promise.all([
          fetchUsers(),
          fetchParishionerStats(),
          fetchFamilies(),
          fetchFamilyStats()
        ]);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadAllData();
  }, []);

  // Update users when families change - but only if we're not already loading
  useEffect(() => {
    if (families.length > 0 && !loading) {
      fetchUsers();
    }
  }, [families, loading]);

  const fetchParishionerStats = async () => {
    try {
      const response = await authenticatedRequest('/api/admin/membership/statistics');
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setParishionerStats(data.data);
        } else {
          console.error('API returned error:', data.message);
          setParishionerStats({ active: 0, inactive: 0, visitor: 0, new_member: 0, total: 0 });
        }
      } else {
        console.error('Failed to fetch parishioner statistics:', response.status, response.statusText);
        setParishionerStats({ active: 0, inactive: 0, visitor: 0, new_member: 0, total: 0 });
      }
    } catch (error) {
      console.error('Failed to fetch parishioner statistics:', error);
      setParishionerStats({ active: 0, inactive: 0, visitor: 0, new_member: 0, total: 0 });
    }
  };

  // Sample data functionality removed - statuses are now manually managed

  // Family management functions
  const [familySearch, setFamilySearch] = useState('');

  const fetchFamilies = async () => {
    try {
      console.log('Fetching families from /api/admin/families...');
      const response = await api.get('/admin/families');
      console.log('Response data:', response.data);
      
      // Handle different response formats
      let familiesArray = [];
      const data = response.data;
      
      if (data.success && data.data) {
        familiesArray = Array.isArray(data.data) ? data.data : [];
      } else if (Array.isArray(data)) {
        familiesArray = data;
      } else if (data.data && Array.isArray(data.data)) {
        familiesArray = data.data;
      } else {
        console.warn('Unexpected response format:', data);
        familiesArray = [];
      }
      
      console.log('Setting families:', familiesArray.length, 'families found');
      setFamilies(familiesArray);
      
      if (familiesArray.length === 0) {
        console.log('No families found in database');
      }
      
      return familiesArray;
    } catch (error) {
      console.error('Failed to fetch families:', error);
      console.error('Error details:', error.response?.data || error.message);
      setFamilies([]);
      setError(`Error loading families: ${error.response?.data?.message || error.message}`);
      return [];
    }
  };

  const fetchFamilyStats = async () => {
    try {
      const response = await authenticatedRequest('/api/admin/families/statistics');
      if (response.ok) {
        const data = await response.json();
        setFamilyStats(data.data || data);
      } else {
        console.error('Failed to fetch family statistics:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Failed to fetch family statistics:', error);
    }
  };

  const handleAddFamily = async (e) => {
    e.preventDefault();
    setFamilyLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await authenticatedRequest('/api/admin/families', {
        method: 'POST',
        body: JSON.stringify(familyForm),
      });

      const data = await response.json();
      if (data.success) {
        setSuccess('Family created successfully!');
        setShowAddFamily(false);
        setFamilyForm({
          family_name: '',
          address: '',
          phone: '',
          email: '',
          newsletter_subscribed: true,
          volunteer_family: false,
          family_status: 'active'
        });
        fetchFamilies();
        fetchFamilyStats();
      } else {
        setError(data.message || 'Failed to create family');
      }
    } catch (error) {
      setError('Network error occurred');
    } finally {
      setFamilyLoading(false);
    }
  };

  const handleEditFamily = async (e) => {
    e.preventDefault();
    setFamilyLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await authenticatedRequest(`/api/admin/families/${selectedFamily.id}`, {
        method: 'PUT',
        body: JSON.stringify(familyForm),
      });

      const data = await response.json();
      if (data.success) {
        openSuccess('Family Updated', 'The family information was updated successfully.');
        setShowEditFamily(false);
        setSelectedFamily(null);
        setFamilyForm({
          family_name: '',
          address: '',
          phone: '',
          email: '',
          newsletter_subscribed: true,
          volunteer_family: false,
          family_status: 'active',
          family_role: 'head',
          relationship_to_head: '',
          is_family_head: false
        });
        fetchFamilies();
        fetchFamilyStats();
      } else {
        setError(data.message || 'Failed to update family');
      }
    } catch (error) {
      setError('Network error occurred');
    } finally {
      setFamilyLoading(false);
    }
  };

  const handleAddMemberToFamily = async (e) => {
    e.preventDefault();
    setFamilyLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await authenticatedRequest('/api/admin/families/add-member', {
        method: 'POST',
        body: JSON.stringify({
          family_id: selectedFamily?.id,
          user_id: selectedUser?.id,
          family_role: familyForm.family_role,
          relationship_to_head: familyForm.relationship_to_head,
          is_family_head: !!familyForm.is_family_head
        }),
      });

      const data = await response.json();
      if (response.ok && data.success) {
        openSuccess('Member Added', 'The member has been added to the family successfully.');
        setShowAddMemberToFamily(false);
        setSelectedUser(null);
        setUserSearchQuery('');
        setShowUserDropdown(false);
        // Reset family form
        setFamilyForm({
          family_name: '',
          address: '',
          phone: '',
          email: '',
          newsletter_subscribed: true,
          volunteer_family: false,
          family_status: 'active',
          family_role: 'head',
          relationship_to_head: '',
          is_family_head: false
        });
        // Store the current selected family ID before refresh
        const currentFamilyId = selectedFamily?.id;
        
        // Refresh data
        const [updatedFamilies] = await Promise.all([
          fetchFamilies(),
          fetchUsers(),
          fetchFamilyStats()
        ]);
        
        // If family detail was open, refresh it by re-selecting the family
        if (currentFamilyId && updatedFamilies) {
          const updatedFamily = updatedFamilies.find(f => f.id === currentFamilyId);
          if (updatedFamily) {
            setSelectedFamily(updatedFamily);
          }
        }
      } else {
        setError(data.message || 'Failed to add member to family');
      }
    } catch (error) {
      setError('Network error occurred');
    } finally {
      setFamilyLoading(false);
    }
  };

  const handleRemoveMemberFromFamily = (user) => {
    setMemberToRemove(user);
    setShowRemoveMemberConfirm(true);
  };

  const confirmRemoveMember = async () => {
    if (!memberToRemove) return;

    setFamilyLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await authenticatedRequest('/api/admin/families/remove-member', {
        method: 'POST',
        body: JSON.stringify({ user_id: memberToRemove.id }),
      });

      const data = await response.json();
      if (response.ok && data.success) {
        openSuccess('Member Removed', 'The member was removed from the family successfully.');
        setShowRemoveMemberConfirm(false);
        setMemberToRemove(null);
        fetchUsers();
        fetchFamilies();
        fetchFamilyStats();
      } else {
        setError(data.message || 'Failed to remove member from family');
      }
    } catch (error) {
      setError('Network error occurred');
    } finally {
      setFamilyLoading(false);
    }
  };

  const handleFamilyClick = (family) => {
    setSelectedFamily(family);
    setShowFamilyDetail(true);
  };

  const getFamilyRoleColor = (user) => {
    // Check if user has actual family relationship from invitation system
    if (user.family_relationship) {
      const relationship = user.family_relationship.relationship;
      switch(relationship) {
        case 'Father': return 'purple';
        case 'Mother': return 'pink';
        case 'Sibling': return 'teal';
        case 'Spouse': return 'blue';
        case 'Child': return 'green';
        default: return 'gray';
      }
    }
    
    // Check if user has family_member_relationship
    if (user.family_member_relationship) {
      const relationship = user.family_member_relationship.relationship;
      switch(relationship) {
        case 'Father': return 'purple';
        case 'Mother': return 'pink';
        case 'Sibling': return 'teal';
        case 'Spouse': return 'blue';
        case 'Child': return 'green';
        default: return 'gray';
      }
    }
    
    // Fallback to admin-assigned family_role
    const roleConfig = FAMILY_ROLES.find(r => r.value === user.family_role);
    return roleConfig ? roleConfig.color : 'gray';
  };

  const getFamilyRoleLabel = (user) => {
    // If user has no family_id, they shouldn't have a family role (primary check)
    if (!user.family_id) {
      return null; // No family role - will show "-"
    }
    
    // Check if user has actual family relationship from invitation system
    if (user.family_relationship) {
      const relationship = user.family_relationship.relationship;
      return relationship ? relationship.replace(/0$/, '') : relationship;
    }
    
    // Check if user has family_member_relationship
    if (user.family_member_relationship) {
      const relationship = user.family_member_relationship.relationship;
      return relationship ? relationship.replace(/0$/, '') : relationship;
    }
    
    // Fallback to admin-assigned family_role (only if they have a family_id)
    if (user.family_role) {
      const roleConfig = FAMILY_ROLES.find(r => r.value === user.family_role);
      if (roleConfig) {
        return roleConfig.label.replace(/0$/, '');
      }
      return user.family_role.replace(/0$/, '');
    }
    
    return null; // No family role
  };









  // Sacrament/parish record functionality removed per request


  const filteredUsers = users.filter(user => {
    // Only show parishioners (not admin, staff, or priest)
    if (user.is_admin || user.is_staff || user.is_priest) {
      return false;
    }
    
    // Apply status filter
    if (statusFilter === 'all') return true;
    return user.membership_status === statusFilter;
  });

  const userLastPage = Math.max(1, Math.ceil(filteredUsers.length / usersPerPage));
  const paginatedUsers = filteredUsers.slice((userPage - 1) * usersPerPage, userPage * usersPerPage);

  if (loading) return <div className="loading-users">Loading users...</div>;

  // Responsive styles
  const containerStyle = {
    margin: '1.5rem auto',
    padding: '1.5rem',
    maxWidth: '100%',
    overflowX: 'auto',
    boxSizing: 'border-box',
  };

  const headerStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    alignItems: 'center',
    width: '100%',
  };

  const filterBarStyle = {
    marginBottom: '1.5rem',
    display: 'flex',
    flexWrap: 'wrap',
    gap: '1rem',
    alignItems: 'center',
    background: '#fff',
    border: '1.5px solid #f2e4ce',
    borderRadius: '14px',
    boxShadow: '0 2px 8px rgba(60, 47, 30, 0.07)',
    padding: '0.7rem 1.2rem',
    maxWidth: '900px',
    marginLeft: 'auto',
    marginRight: 'auto',
    width: '100%',
    boxSizing: 'border-box',
  };

  const tableWrapperStyle = {
    background: 'white',
    borderRadius: '0.5rem',
    border: '1px solid #f2e4ce',
    overflowX: 'auto',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
    width: '100%',
    boxSizing: 'border-box',
    marginTop: '1rem',
  };

  const tableStyle = {
    width: '100%',
    minWidth: '600px',
    borderCollapse: 'collapse',
    background: '#fff',
    fontSize: '1rem',
  };

  const modalStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    backdropFilter: 'blur(5px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '20px',
  };

  const modalContentStyle = {
    background: 'white',
    border: '1px solid #f2e4ce',
    borderRadius: '1rem',
    boxShadow: '0 2px 8px rgba(60, 47, 30, 0.07)',
    padding: '1.5rem',
    maxWidth: '500px',
    width: '90%',
    maxHeight: '80vh',
    overflowY: 'auto',
    boxSizing: 'border-box',
  };

  // Handle form input changes
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    
    // For phone field, only allow numbers and limit to 11 digits
    if (name === 'phone') {
      const numericValue = value.replace(/[^0-9]/g, '').slice(0, 11);
      setForm(prev => ({ ...prev, [name]: numericValue }));
    } else {
      setForm(prev => ({ ...prev, [name]: value }));
    }
  };

  // Handle add member submit
  const handleAddMember = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setEditLoading(true);
    
    const payload = {
      name: form.name,
      email: form.email,
      phone: form.phone,
      gender: form.Sex,
      birthdate: form.birthdate,
      address: form.address,
      password: form.password,
      password_confirmation: form.password_confirmation,
      is_admin: form.role === 'admin',
      is_staff: form.role === 'staff',
      is_priest: form.role === 'priest'
    };

    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.errors) {
          setError(Object.values(data.errors).map(arr => arr.join(' ')).join('\n'));
        } else {
          setError(data.message || 'Failed to add member.');
        }
      } else {
        setSuccess('Member added successfully!');
        setShowEdit(false);
        setForm(initialForm);
        fetchUsers();
      }
    } catch (err) {
      setError('Network error.');
    }
    setEditLoading(false);
  };

    // Handle edit user submit
  const handleEditUser = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setEditLoading(true);
    
    const payload = {
      name: form.name,
      email: form.email,
      phone: form.phone,
      gender: form.Sex,
      birthdate: form.birthdate,
      address: form.address,
      is_admin: form.role === 'admin',
      is_staff: form.role === 'staff',
      is_priest: form.role === 'priest',
      membership_status: form.membership_status
    };

    // Only include password if it's provided
    if (form.password) {
      payload.password = form.password;
      payload.password_confirmation = form.password_confirmation;
    }

    try {
      const res = await authenticatedRequest(`/api/users/${editUser.id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.errors) {
          setError(Object.values(data.errors).map(arr => arr.join(' ')).join('\n'));
        } else {
          setError(data.message || 'Failed to update user.');
        }
      } else {
        setSuccess('User updated successfully!');
        setShowEdit(false);
        setEditUser(null);
        fetchUsers();
      }
    } catch (err) {
      setError('Network error.');
    }
    setEditLoading(false);
  };

  // Handle delete user
  const handleDeleteUser = async () => {
    setError('');
    setSuccess('');
    setDeleteLoading(true);
    
    try {
      const res = await authenticatedRequest(`/api/users/${deleteUser.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || 'Failed to delete user.');
      } else {
        setSuccess('User deleted successfully!');
        setShowDelete(false);
        setDeleteUser(null);
        fetchUsers();
      }
    } catch (err) {
      setError('Network error.');
    }
    setDeleteLoading(false);
  };

  // Open edit modal
  const openEdit = (user) => {
    setEditUser(user);
    setForm({
      name: user.name || '',
      email: user.email || '',
      username: user.username || '',
      password: '',
      password_confirmation: '',
      Sex: user.Sex || user.gender || 'male',
      address: user.address || '',
      phone: user.phone || '',
      birthdate: user.birthdate ? (user.birthdate.split('T')[0] || user.birthdate) : '1990-01-01',
      role: user.is_admin ? 'admin' : user.is_staff ? 'staff' : user.is_priest ? 'priest' : 'parishioner',
      membership_status: user.membership_status || 'new_member',
      membership_date: user.membership_date ? (user.membership_date.split('T')[0] || user.membership_date) : '',
      last_attendance: user.last_attendance ? (user.last_attendance.split('T')[0] || user.last_attendance) : '',
      baptismal_parish: user.baptismal_parish || '',
      confirmation_parish: user.confirmation_parish || '',
      ministry_involvements: Array.isArray(user.ministry_involvements) ? user.ministry_involvements : [],
      membership_notes: user.membership_notes || '',
      newsletter_subscribed: user.newsletter_subscribed !== undefined ? user.newsletter_subscribed : true,
      volunteer_interest: user.volunteer_interest || false,
    });
    setShowEdit(true);
    setError('');
    setSuccess('');
  };

  // Open delete modal
  const openDelete = (user) => {
    setDeleteUser(user);
    setShowDelete(true);
    setError('');
    setSuccess('');
  };

  // Sacrament history functions
  const fetchSacramentHistory = async (userId) => {
    setSacramentHistoryLoading(true);
    try {
      const response = await authenticatedRequest(`/api/admin/sacrament-history/user/${userId}`);
      const data = await response.json();
      if (data.success) {
        setSacramentHistory(data.history || []);
      } else {
        setError(data.error || 'Failed to fetch sacrament history');
        setSacramentHistory([]);
      }
    } catch (error) {
      console.error('Error fetching sacrament history:', error);
      setError('Failed to fetch sacrament history');
      setSacramentHistory([]);
    } finally {
      setSacramentHistoryLoading(false);
    }
  };

  const openSacramentHistory = async (user) => {
    setSelectedUserForSacrament(user);
    setShowSacramentHistory(true);
    await fetchSacramentHistory(user.id);
  };

  const handleAddSacrament = async (e) => {
    e.preventDefault();
    setError('');
    setSacramentHistoryLoading(true);
    try {
      const response = await authenticatedRequest('/api/admin/sacrament-history', {
        method: 'POST',
        body: JSON.stringify({
          user_id: selectedUserForSacrament.id,
          type: sacramentForm.type,
          date: sacramentForm.date,
          parish: sacramentForm.parish
        })
      });
      const data = await response.json();
      if (data.success) {
        setShowAddSacrament(false);
        setSacramentForm({ type: '', date: '', parish: '' });
        await fetchSacramentHistory(selectedUserForSacrament.id);
        setSuccess('Sacrament record added successfully!');
      } else {
        setError(data.error || 'Failed to add sacrament record');
      }
    } catch (error) {
      setError('Failed to add sacrament record');
    } finally {
      setSacramentHistoryLoading(false);
    }
  };

  const handleEditSacrament = async (e) => {
    e.preventDefault();
    setError('');
    setSacramentHistoryLoading(true);
    try {
      const response = await authenticatedRequest(`/api/admin/sacrament-history/${editingSacrament.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          type: sacramentForm.type,
          date: sacramentForm.date,
          parish: sacramentForm.parish
        })
      });
      const data = await response.json();
      if (data.success) {
        setShowEditSacrament(false);
        setEditingSacrament(null);
        setSacramentForm({ type: '', date: '', parish: '' });
        await fetchSacramentHistory(selectedUserForSacrament.id);
        setSuccess('Sacrament record updated successfully!');
      } else {
        setError(data.error || 'Failed to update sacrament record');
      }
    } catch (error) {
      setError('Failed to update sacrament record');
    } finally {
      setSacramentHistoryLoading(false);
    }
  };

  const handleDeleteSacrament = async () => {
    setError('');
    setSacramentHistoryLoading(true);
    try {
      const response = await authenticatedRequest(`/api/admin/sacrament-history/${deletingSacrament.id}`, {
        method: 'DELETE'
      });
      const data = await response.json();
      if (data.success) {
        setShowDeleteSacrament(false);
        setDeletingSacrament(null);
        await fetchSacramentHistory(selectedUserForSacrament.id);
        setSuccess('Sacrament record deleted successfully!');
      } else {
        setError(data.error || 'Failed to delete sacrament record');
      }
    } catch (error) {
      setError('Failed to delete sacrament record');
    } finally {
      setSacramentHistoryLoading(false);
    }
  };

  const openEditSacramentModal = (sacrament) => {
    setEditingSacrament(sacrament);
    setSacramentForm({
      type: sacrament.type,
      date: sacrament.date,
      parish: sacrament.parish
    });
    setShowEditSacrament(true);
  };

  const openDeleteSacramentModal = (sacrament) => {
    setDeletingSacrament(sacrament);
    setShowDeleteSacrament(true);
  };

  return (
    <div className="admin-membership-container">
      <style>{`
        /* Mobile-first responsive design */
        @media (max-width: 640px) {
          .membership-container {
            margin: 0 auto;
            padding-left: 0.5rem;
            padding-right: 0.5rem;
            max-width: calc(100% - 1rem);
          }
          .membership-card {
            margin: 0 auto;
            width: 100%;
            max-width: 100%;
            padding: 0.75rem !important;
          }
          .membership-table {
            margin: 0 auto;
            width: 100%;
            max-width: 100%;
          }
          .membership-card + .membership-card {
            margin-top: 1rem;
          }
          .membership-card h2,
          .membership-card h3 {
            font-size: 1rem !important;
            line-height: 1.4;
          }
          .filter-bar {
            flex-direction: column !important;
            gap: 0.75rem !important;
            align-items: stretch !important;
          }
          .filter-bar > * {
            width: 100% !important;
            max-width: none !important;
          }
          .stats-grid {
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 0.5rem !important;
          }
          .stats-item {
            padding: 0.5rem !important;
          }
          .stats-number {
            font-size: 1.25rem !important;
          }
          .stats-label {
            font-size: 0.75rem !important;
          }
        }
        @media (max-width: 768px) {
          .membership-container {
            margin: 0 auto;
            padding-left: 0.75rem;
            padding-right: 0.75rem;
            max-width: calc(100% - 1.5rem);
          }
          .membership-card {
            margin: 0 auto;
            width: 100%;
            max-width: 100%;
          }
          .membership-table {
            margin: 0 auto;
            width: 100%;
            max-width: 100%;
          }
          .stats-grid {
            grid-template-columns: repeat(3, 1fr) !important;
            gap: 0.75rem !important;
          }
        }
        @media (max-width: 480px) {
          .membership-container {
            padding-left: 0.25rem;
            padding-right: 0.25rem;
            max-width: calc(100% - 0.5rem);
          }
          .membership-card {
            padding: 0.5rem !important;
          }
          .stats-grid {
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 0.25rem !important;
          }
          .stats-item {
            padding: 0.25rem !important;
          }
          .stats-number {
            font-size: 1rem !important;
          }
          .stats-label {
            font-size: 0.625rem !important;
          }
        }
        
        /* Spinner animation for loading states */
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
      {error && <div className="error-msg" style={{ whiteSpace: 'pre-line' }}>{error}</div>}
      {success && <div className="success-msg">{success}</div>}

      <div className="membership-header">
        <h1 className="membership-title">Parishioner Membership Management</h1>
        <div className="membership-actions">
          <div className="membership-filters">
            <h3 className="filter-title">Filter by Status</h3>
            <div className="filter-buttons">
              {FILTERS.map(filter => (
                <button
                  key={filter.value}
                  onClick={() => setStatusFilter(filter.value)}
                  className={`filter-btn ${statusFilter === filter.value ? 'active' : ''}`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Parishioner Statistics Panel */}
      <div className="membership-stats">
        <div className="stat-card">
          <div className="stat-number">{parishionerStats?.active ?? 0}</div>
          <div className="stat-label">🟢 Active Members</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{parishionerStats?.inactive ?? 0}</div>
          <div className="stat-label">🟡 Inactive Members</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{parishionerStats?.visitor ?? 0}</div>
          <div className="stat-label">🔵 Visitors</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{parishionerStats?.new_member ?? 0}</div>
          <div className="stat-label">🟣 New Members</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{parishionerStats?.total ?? 0}</div>
          <div className="stat-label">👥 Total Parishioners</div>
        </div>
        
        </div>

      {/* Family Management Section */}
      <div className="membership-card" style={{ 
        background: 'linear-gradient(135deg, #fef9f0 0%, #fef3e7 100%)', 
        borderRadius: '12px', 
        padding: '1rem', 
        margin: '1rem 0', 
        border: '1px solid #e2cfa3',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ 
            fontSize: '1.125rem', 
            fontWeight: '700', 
            color: '#CD8B3E', 
            margin: 0
          }}>
            👨‍👩‍👧‍👦 Family Management System
          </h3>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={() => {
                const newState = !showFamilyManagement;
                setShowFamilyManagement(newState);
                // Fetch families when showing the management section
                if (newState) {
                  fetchFamilies();
                  fetchFamilyStats();
                }
              }}
              style={{ 
                padding: '0.5rem 1rem', 
                borderRadius: '6px', 
                border: '1px solid #CD8B3E', 
                background: showFamilyManagement ? '#CD8B3E' : '#fff', 
                color: showFamilyManagement ? '#fff' : '#CD8B3E',
                fontSize: '0.875rem',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              {showFamilyManagement ? 'Hide Families' : 'Show Families'}
            </button>
          </div>
        </div>

        {familyStats && (
          <div className="stats-grid" style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', 
            gap: '0.75rem',
            textAlign: 'center',
            marginBottom: '1rem'
          }}>
            <div className="stats-item" style={{ background: 'white', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2cfa3' }}>
              <div className="stats-number" style={{ fontSize: '1.25rem', fontWeight: '700', color: '#CD8B3E' }}>{familyStats.total_families}</div>
              <div className="stats-label" style={{ fontSize: '0.75rem', color: '#6c757d' }}>👨‍👩‍👧‍👦 Total Families</div>
            </div>
            <div className="stats-item" style={{ background: 'white', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2cfa3' }}>
              <div className="stats-number" style={{ fontSize: '1.25rem', fontWeight: '700', color: '#22c55e' }}>{familyStats.active_families}</div>
              <div className="stats-label" style={{ fontSize: '0.75rem', color: '#6c757d' }}>✅ Active Families</div>
            </div>
            <div className="stats-item" style={{ background: 'white', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2cfa3' }}>
              <div className="stats-number" style={{ fontSize: '1.25rem', fontWeight: '700', color: '#B77B35' }}>{familyStats.total_members}</div>
              <div className="stats-label" style={{ fontSize: '0.75rem', color: '#6c757d' }}>👥 Family Members</div>
            </div>
            <div className="stats-item" style={{ background: 'white', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2cfa3' }}>
              <div className="stats-number" style={{ fontSize: '1.25rem', fontWeight: '700', color: '#f59e0b' }}>{familyStats.unassigned_members}</div>
              <div className="stats-label" style={{ fontSize: '0.75rem', color: '#6c757d' }}>❓ Unassigned</div>
            </div>
            <div className="stats-item" style={{ background: 'white', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2cfa3' }}>
              <div className="stats-number" style={{ fontSize: '1.25rem', fontWeight: '700', color: '#d97706' }}>{familyStats.average_family_size}</div>
              <div className="stats-label" style={{ fontSize: '0.75rem', color: '#6c757d' }}>📊 Avg Size</div>
            </div>
          </div>
        )}

        {showFamilyManagement && (
          <div style={{ marginTop: '1rem' }}>
            <div style={{ 
              marginTop: '1rem', 
              padding: '0.75rem', 
              background: '#fef9f0', 
              borderRadius: '8px', 
              border: '1px solid #e2cfa3',
              fontSize: '0.75rem',
              color: '#3F2E1E'
            }}>
              <strong>🏠 Family Management Features:</strong> Group parishioners into families, manage family profiles, track family relationships, and monitor family engagement. Each family has a unique code and can have multiple members with different roles (head, spouse, child, etc.).
            </div>
            
            {/* Family List */}
            <div style={{ marginTop: '1rem' }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                marginBottom: '1rem' 
              }}>
                <h4 style={{ 
                  fontSize: '1rem', 
                  fontWeight: '600', 
                  color: '#CD8B3E', 
                  margin: 0 
                }}>
                  👨‍👩‍👧‍👦 Family List ({families.length})
                </h4>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <input
                    type="text"
                    value={familySearch}
                    onChange={(e) => setFamilySearch(e.target.value)}
                    placeholder="Search families (name, code, status, address)"
                    style={{
                      padding: '0.5rem 0.75rem',
                      borderRadius: '6px',
                      border: '1px solid #e2cfa3',
                      minWidth: 280
                    }}
                  />
                  <button
                    onClick={() => setShowAddFamily(true)}
                    style={{ 
                      padding: '0.5rem 1rem', 
                      borderRadius: '6px', 
                      border: '1px solid #CD8B3E', 
                      background: '#CD8B3E', 
                      color: '#fff',
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      cursor: 'pointer'
                    }}
                  >
                    + Add Family
                  </button>
                </div>
              </div>
              
              {families.length === 0 ? (
                <div style={{ 
                  textAlign: 'center', 
                  padding: '2rem', 
                  color: '#6b7280',
                  background: '#f9fafb',
                  borderRadius: '8px',
                  border: '1px solid #e5e7eb'
                }}>
                  <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>👨‍👩‍👧‍👦</div>
                  <div>No families found. Create your first family!</div>
                </div>
              ) : (
                // Filter families once, then render
                (() => {
                  const q = familySearch.trim().toLowerCase();
                  const filteredFamilies = !q ? families : families.filter((family) => {
                    const name = String(family.family_name || '').toLowerCase();
                    const code = String(family.family_code || '').toLowerCase();
                    const status = String(family.family_status || '').toLowerCase();
                    const address = String(family.address || '').toLowerCase();
                    const email = String(family.email || '').toLowerCase();
                    const phone = String(family.phone || '').toLowerCase();
                    return (
                      name.includes(q) ||
                      code.includes(q) ||
                      status.includes(q) ||
                      address.includes(q) ||
                      email.includes(q) ||
                      phone.includes(q)
                    );
                  });
                  return (
                    <div style={{ 
                      display: 'grid', 
                      gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', 
                      gap: '1rem' 
                    }}>
                      {filteredFamilies.map((family) => (
                        <div
                          key={family.id}
                          onClick={() => handleFamilyClick(family)}
                          style={{ 
                            background: '#fff',
                            border: '1px solid #e2cfa3',
                            borderRadius: '8px',
                            padding: '1rem',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                          }}
                          onMouseEnter={(e) => {
                            e.target.style.borderColor = '#CD8B3E';
                            e.target.style.boxShadow = '0 4px 12px rgba(205, 139, 62, 0.15)';
                            e.target.style.transform = 'translateY(-2px)';
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.borderColor = '#e2cfa3';
                            e.target.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
                            e.target.style.transform = 'translateY(0)';
                          }}
                        >
                          <div style={{ 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: 'flex-start',
                            marginBottom: '0.75rem'
                          }}>
                            <div>
                              <h5 style={{ 
                                fontSize: '1rem', 
                                fontWeight: '600', 
                                color: '#CD8B3E', 
                                margin: '0 0 0.25rem 0' 
                              }}>
                                {family.family_name || 'Unnamed Family'}
                              </h5>
                              <div style={{ 
                                fontSize: '0.75rem', 
                                color: '#6b7280',
                                fontFamily: 'monospace',
                                background: '#f1f5f9',
                                padding: '0.25rem 0.5rem',
                                borderRadius: '4px',
                                display: 'inline-block'
                              }}>
                                {family.family_code}
                              </div>
                            </div>
                            <span style={{ 
                              padding: '0.25rem 0.5rem', 
                              borderRadius: '12px', 
                              fontSize: '0.75rem', 
                              fontWeight: '600',
                              backgroundColor: family.family_status === 'active' ? '#10b981' : 
                                             family.family_status === 'inactive' ? '#f59e0b' : '#3b82f6',
                              color: 'white'
                            }}>
                              {family.family_status === 'active' ? 'Active' : 
                               family.family_status === 'inactive' ? 'Inactive' : 'Transferred'}
                            </span>
                          </div>
                          
                          <div style={{ 
                            display: 'grid', 
                            gridTemplateColumns: '1fr 1fr', 
                            gap: '0.5rem',
                            fontSize: '0.75rem',
                            color: '#6b7280'
                          }}>
                            <div>
                              <strong>Members:</strong> {family.members?.length || 0}
                            </div>
                            <div>
                              <strong>Address:</strong> {family.address ? 'Set' : 'Not set'}
                            </div>
                            <div>
                              <strong>Phone:</strong> {family.phone || 'Not set'}
                            </div>
                            <div>
                              <strong>Email:</strong> {family.email || 'Not set'}
                            </div>
                          </div>
                          
                          {family.members && family.members.length > 0 && (
                            <div style={{ 
                              marginTop: '0.75rem',
                              paddingTop: '0.75rem',
                              borderTop: '1px solid #e5e7eb'
                            }}>
                              <div style={{ 
                                fontSize: '0.75rem', 
                                fontWeight: '600', 
                                color: '#CD8B3E',
                                marginBottom: '0.5rem'
                              }}>
                                Family Members:
                              </div>
                              <div style={{ 
                                display: 'flex', 
                                flexWrap: 'wrap', 
                                gap: '0.25rem' 
                              }}>
                                {family.members.slice(0, 3).map((member) => (
                                  <span
                                    key={member.id}
                                    style={{ 
                                      padding: '0.125rem 0.375rem', 
                                      borderRadius: '8px', 
                                      fontSize: '0.625rem', 
                                      fontWeight: '500',
                                      backgroundColor: member.is_family_head ? '#8b5cf6' : '#e5e7eb',
                                      color: member.is_family_head ? 'white' : '#374151'
                                    }}
                                  >
                                    {member.name} {member.is_family_head ? '👑' : ''}
                                  </span>
                                ))}
                                {family.members.length > 3 && (
                                  <span style={{ 
                                    fontSize: '0.625rem', 
                                    color: '#6b7280',
                                    fontStyle: 'italic'
                                  }}>
                                    +{family.members.length - 3} more
                                  </span>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  );
                })()
              )}
            </div>
          </div>
        )}
      </div>



      <div className="user-table-wrapper membership-card membership-table" style={{...tableWrapperStyle, margin: '1rem 0' }}>
        <div style={{ overflowX: 'auto', width: '100%' }}>
          <table className="user-table responsive-table" style={{ ...tableStyle, fontSize: '0.875rem', minWidth: 600 }}>
            <thead>
              <tr style={{ 
                background: 'linear-gradient(to bottom, #FFF6E5, #f9f6f2)', 
                borderBottom: '2px solid #e2cfa3'
              }}>
                <th style={{ 
                  padding: '0.875rem 0.75rem', 
                  minWidth: 40, 
                  fontWeight: 700, 
                  color: '#3F2E1E',
                  fontSize: '0.875rem',
                  textAlign: 'left',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>#</th>
                <th style={{ 
                  padding: '0.875rem 0.75rem', 
                  minWidth: 120, 
                  fontWeight: 700, 
                  color: '#3F2E1E',
                  fontSize: '0.875rem',
                  textAlign: 'left',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>Name</th>
                <th style={{ 
                  padding: '0.875rem 0.75rem', 
                  minWidth: 140, 
                  fontWeight: 700, 
                  color: '#3F2E1E',
                  fontSize: '0.875rem',
                  textAlign: 'left',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>Email</th>
                <th style={{ 
                  padding: '0.875rem 0.75rem', 
                  minWidth: 80, 
                  fontWeight: 700, 
                  color: '#3F2E1E',
                  fontSize: '0.875rem',
                  textAlign: 'left',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>Sex</th>
                <th style={{ 
                  padding: '0.875rem 0.75rem', 
                  minWidth: 120, 
                  fontWeight: 700, 
                  color: '#3F2E1E',
                  fontSize: '0.875rem',
                  textAlign: 'left',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>Address</th>
                <th style={{ 
                  padding: '0.875rem 0.75rem', 
                  minWidth: 120, 
                  fontWeight: 700, 
                  color: '#3F2E1E',
                  fontSize: '0.875rem',
                  textAlign: 'left',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>Status</th>
                <th style={{ 
                  padding: '0.875rem 0.75rem', 
                  minWidth: 100, 
                  fontWeight: 700, 
                  color: '#3F2E1E',
                  fontSize: '0.875rem',
                  textAlign: 'left',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>Family</th>
                <th style={{ 
                  padding: '0.875rem 0.75rem', 
                  minWidth: 100, 
                  fontWeight: 700, 
                  color: '#3F2E1E',
                  fontSize: '0.875rem',
                  textAlign: 'left',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>Family Role</th>
                <th style={{ 
                  padding: '0.875rem 0.75rem', 
                  minWidth: 100, 
                  fontWeight: 700, 
                  color: '#3F2E1E',
                  fontSize: '0.875rem',
                  textAlign: 'left',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>History</th>
                <th style={{ 
                  padding: '0.875rem 0.75rem', 
                  minWidth: 100, 
                  fontWeight: 700, 
                  color: '#3F2E1E',
                  fontSize: '0.875rem',
                  textAlign: 'left',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>Last Online</th>
                <th style={{ 
                  padding: '0.875rem 0.75rem', 
                  minWidth: 120, 
                  fontWeight: 700, 
                  color: '#3F2E1E',
                  fontSize: '0.875rem',
                  textAlign: 'center',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={11} style={{ 
                    textAlign: 'center', 
                    padding: '2rem',
                    color: '#6b7280',
                    fontSize: '0.875rem'
                  }}>
                    No parishioners found.
                  </td>
                </tr>
              )}
              {paginatedUsers.map((user, idx) => (
                <tr 
                  key={user.id} 
                  style={{ 
                    borderBottom: '1px solid #f2e4ce',
                    transition: 'background-color 0.2s ease',
                    backgroundColor: idx % 2 === 0 ? '#ffffff' : '#fefefe'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#FFF6E5';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = idx % 2 === 0 ? '#ffffff' : '#fefefe';
                  }}
                >
                  <td style={{ 
                    padding: '0.875rem 0.75rem', 
                    color: '#6b7280',
                    fontSize: '0.875rem',
                    fontWeight: 500
                  }}>
                    {(userPage - 1) * usersPerPage + idx + 1}
                  </td>
                  <td style={{ 
                    padding: '0.875rem 0.75rem', 
                    wordBreak: 'break-word',
                    color: '#3F2E1E',
                    fontSize: '0.875rem',
                    fontWeight: 600
                  }}>
                    {user.name}
                  </td>
                  <td style={{ 
                    padding: '0.875rem 0.75rem', 
                    wordBreak: 'break-word',
                    color: '#3F2E1E',
                    fontSize: '0.875rem'
                  }}>
                    {user.email}
                  </td>
                  <td style={{ 
                    padding: '0.875rem 0.75rem',
                    color: '#6b7280',
                    fontSize: '0.875rem',
                    textTransform: 'capitalize'
                  }}>
                    {user.Sex || user.gender || '-'}
                  </td>
                  <td style={{ 
                    padding: '0.875rem 0.75rem', 
                    wordBreak: 'break-word',
                    color: '#6b7280',
                    fontSize: '0.875rem',
                    maxWidth: '200px'
                  }}>
                    {user.address || '-'}
                  </td>
                  <td style={{ padding: '0.875rem 0.75rem' }}>
                    <span 
                      style={{ 
                        padding: '0.375rem 0.75rem', 
                        borderRadius: '16px', 
                        fontSize: '0.75rem', 
                        fontWeight: '600',
                        backgroundColor: getParishionerStatusColor(user.membership_status || 'new_member'),
                        color: 'white',
                        display: 'inline-block',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {getParishionerStatusLabel(user.membership_status || 'new_member')}
                    </span>
                  </td>
                  <td style={{ padding: '0.875rem 0.75rem' }}>
                    {user.family_id ? (
                      <span style={{ 
                        fontSize: '0.875rem', 
                        color: '#0ea5e9',
                        fontWeight: 500
                      }}>
                        {user.family ? (
                          user.family.family_name || user.family.family_code || 'Family'
                        ) : (
                          'Family'
                        )}
                      </span>
                    ) : (
                      <span style={{ 
                        fontSize: '0.875rem', 
                        color: '#9ca3af',
                        fontStyle: 'italic'
                      }}>
                        Unassigned
                      </span>
                    )}
                  </td>
                  <td style={{ padding: '0.875rem 0.75rem' }}>
                    {(() => {
                      // Primary check: if no family_id, show "-" (default)
                      if (!user.family_id) {
                        return (
                          <span style={{ 
                            fontSize: '0.875rem', 
                            color: '#9ca3af'
                          }}>
                            -
                          </span>
                        );
                      }
                      
                      const roleLabel = getFamilyRoleLabel(user);
                      const isFamilyHead = user.is_family_head;
                      
                      if (roleLabel) {
                        return (
                          <span 
                            style={{ 
                              padding: '0.375rem 0.75rem', 
                              borderRadius: '16px', 
                              fontSize: '0.75rem', 
                              fontWeight: '600',
                              backgroundColor: getFamilyRoleColor(user),
                              color: 'white',
                              display: 'inline-block',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            {roleLabel}
                            {isFamilyHead && ' 👑'}
                          </span>
                        );
                      }
                      return (
                        <span style={{ 
                          fontSize: '0.875rem', 
                          color: '#9ca3af'
                        }}>
                          -
                        </span>
                      );
                    })()}
                  </td>
                  <td style={{ padding: '0.875rem 0.75rem' }}>
                    <button
                      onClick={() => openSacramentHistory(user)}
                      style={{ 
                        minWidth: 90, 
                        minHeight: 32, 
                        borderRadius: '16px', 
                        background: 'linear-gradient(135deg, #f3e8ff 0%, #e9d5ff 100%)', 
                        border: '1px solid #c084fc',
                        display: 'inline-flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        gap: '0.375rem',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        color: '#7c3aed',
                        padding: '0.375rem 0.75rem',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        boxShadow: '0 1px 2px rgba(124, 58, 237, 0.1)'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.background = 'linear-gradient(135deg, #e9d5ff 0%, #ddd6fe 100%)';
                        e.target.style.transform = 'translateY(-1px)';
                        e.target.style.boxShadow = '0 2px 4px rgba(124, 58, 237, 0.2)';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.background = 'linear-gradient(135deg, #f3e8ff 0%, #e9d5ff 100%)';
                        e.target.style.transform = 'translateY(0)';
                        e.target.style.boxShadow = '0 1px 2px rgba(124, 58, 237, 0.1)';
                      }}
                      title="View/Manage Sacrament History"
                    >
                      📿 History
                    </button>
                  </td>
                  <td style={{ 
                    padding: '0.875rem 0.75rem',
                    color: '#6b7280',
                    fontSize: '0.875rem'
                  }}>
                    {user.last_login_at ? (
                      <span style={{ color: '#059669', fontWeight: 500 }}>
                        {new Date(user.last_login_at).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric', 
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    ) : (
                      <span style={{ color: '#9ca3af', fontStyle: 'italic' }}>
                        Never
                      </span>
                    )}
                  </td>
                  <td style={{ padding: '0.875rem 0.75rem' }}>
                    <div className="flex gap-2" style={{ 
                      display: 'flex', 
                      gap: '0.5rem', 
                      flexWrap: 'wrap',
                      justifyContent: 'center',
                      alignItems: 'center'
                    }}>
                      <button
                        onClick={() => openEdit(user)}
                        style={{ 
                          minWidth: 36, 
                          minHeight: 36, 
                          borderRadius: '8px', 
                          background: '#eff6ff', 
                          border: '1px solid #bfdbfe',
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          color: '#2563eb'
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.background = '#dbeafe';
                          e.target.style.transform = 'translateY(-1px)';
                          e.target.style.boxShadow = '0 2px 4px rgba(37, 99, 235, 0.2)';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.background = '#eff6ff';
                          e.target.style.transform = 'translateY(0)';
                          e.target.style.boxShadow = 'none';
                        }}
                        title="Edit User"
                      >
                        <Pencil size={16} />
                      </button>
                      {user.family_id && (
                        <button
                          onClick={() => handleRemoveMemberFromFamily(user)}
                          style={{ 
                            minWidth: 36, 
                            minHeight: 36, 
                            borderRadius: '8px', 
                            background: '#fff7ed', 
                            border: '1px solid #fed7aa',
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            fontSize: '1.125rem'
                          }}
                          onMouseEnter={(e) => {
                            e.target.style.background = '#ffedd5';
                            e.target.style.transform = 'translateY(-1px)';
                            e.target.style.boxShadow = '0 2px 4px rgba(251, 146, 60, 0.2)';
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.background = '#fff7ed';
                            e.target.style.transform = 'translateY(0)';
                            e.target.style.boxShadow = 'none';
                          }}
                          title="Remove from Family"
                        >
                          👨‍👩‍👧‍👦
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', justifyContent: 'flex-end', padding: '0.75rem' }}>
        <button
          onClick={() => setUserPage(p => Math.max(1, p - 1))}
          disabled={userPage <= 1}
          style={{ padding: '0.4rem 0.8rem', borderRadius: 6, border: '1px solid #e2cfa3', background: userPage <= 1 ? '#f5f5f5' : '#fff', color: '#3F2E1E' }}
        >Prev</button>
        <span style={{ fontSize: '0.9rem', color: '#3F2E1E' }}>Page {userPage} of {userLastPage}</span>
        <button
          onClick={() => setUserPage(p => Math.min(userLastPage, p + 1))}
          disabled={userPage >= userLastPage}
          style={{ padding: '0.4rem 0.8rem', borderRadius: 6, border: '1px solid #e2cfa3', background: userPage >= userLastPage ? '#f5f5f5' : '#fff', color: '#3F2E1E' }}
        >Next</button>
      </div>
      </div>



      {/* Add Member Modal */}
      {showEdit && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(44, 44, 44, 0.25)',
          backdropFilter: 'blur(6px)',
          WebkitBackdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 3000,
        }}>
          <div style={{
            background: '#fff',
            borderRadius: 18,
            boxShadow: '0 8px 32px rgba(60,40,20,0.18)',
            padding: '1.5rem',
            minWidth: 800,
            maxWidth: 900,
            width: '90vw',
            maxHeight: '90vh',
            overflowY: 'auto',
            overflowX: 'hidden',
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            gap: 18,
          }}>
            <div style={{ 
              background: '#CD8B3E', 
              borderRadius: '12px 12px 0 0', 
              padding: '1.5rem 2rem', 
              margin: '-1.5rem -1.5rem 0 -1.5rem',
              color: 'white',
              textAlign: 'center',
              position: 'relative'
            }}>
              <h2 style={{ 
                fontSize: '1.5rem', 
                fontWeight: '700', 
                margin: '0 0 0.5rem 0',
                color: 'white'
              }}>
                {editUser ? 'Edit Member' : 'Add New Member'}
              </h2>
              <p style={{ 
                fontSize: '0.875rem', 
                margin: '0', 
                color: 'white',
                opacity: 0.9
              }}>
                {editUser ? 'Update the member information' : 'Create a new parishioner membership record'}
              </p>
              <button 
                onClick={() => {
                  setShowEdit(false);
                  setEditUser(null);
                  setForm(initialForm);
                }} 
                title="Close"
                style={{
                  position: 'absolute',
                  top: '1rem',
                  right: '1rem',
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  color: 'white',
                  fontSize: '1.2rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s',
                  fontWeight: 'bold'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = 'rgba(255, 255, 255, 0.2)';
                  e.target.style.borderColor = 'rgba(255, 255, 255, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'rgba(255, 255, 255, 0.1)';
                  e.target.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                }}
              >
                ×
              </button>
            </div>
            
            <div style={{ 
              background: '#FFF6E5', 
              borderRadius: '0 0 12px 12px', 
              padding: '1.5rem', 
              marginBottom: 0, 
              width: '100%',
              flex: 1,
              overflowY: 'auto'
            }}>
              <form onSubmit={editUser ? handleEditUser : handleAddMember} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%', minHeight: 'fit-content' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontWeight: 600, color: '#3F2E1E', marginBottom: '0.5rem' }}>Name *</label>
                    <input 
                      type="text" 
                      name="name" 
                      value={form.name} 
                      onChange={handleFormChange} 
                      placeholder="Full Name" 
                      required 
                      disabled={editLoading}
                      style={{ 
                        width: '100%', 
                        padding: '0.75rem', 
                        borderRadius: 8, 
                        border: '1.5px solid #e2cfa3', 
                        fontSize: 14, 
                        color: '#3F2E1E', 
                        background: '#fff',
                        boxSizing: 'border-box'
                      }} 
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontWeight: 600, color: '#3F2E1E', marginBottom: '0.5rem' }}>Email *</label>
                    <input 
                      type="email" 
                      name="email" 
                      value={form.email} 
                      onChange={handleFormChange} 
                      placeholder="Email Address" 
                      required 
                      disabled={editLoading}
                      style={{ 
                        width: '100%', 
                        padding: '0.75rem', 
                        borderRadius: 8, 
                        border: '1.5px solid #e2cfa3', 
                        fontSize: 14, 
                        color: '#3F2E1E', 
                        background: '#fff',
                        boxSizing: 'border-box'
                      }} 
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  {!editUser && (
                    <div>
                      <label style={{ display: 'block', fontWeight: 600, color: '#3F2E1E', marginBottom: '0.5rem' }}>Username</label>
                      <input 
                        type="text" 
                        name="username" 
                        value={form.username} 
                        onChange={handleFormChange} 
                        placeholder="Username" 
                        disabled={editLoading}
                        style={{ 
                          width: '100%', 
                          padding: '0.75rem', 
                          borderRadius: 8, 
                          border: '1.5px solid #e2cfa3', 
                          fontSize: 14, 
                          color: '#3F2E1E', 
                          background: '#fff',
                          boxSizing: 'border-box'
                        }} 
                      />
                    </div>
                  )}
                  <div>
                    <label style={{ display: 'block', fontWeight: 600, color: '#3F2E1E', marginBottom: '0.5rem' }}>Phone</label>
                    <input 
                      type="tel" 
                      name="phone" 
                      value={form.phone} 
                      onChange={handleFormChange} 
                      pattern="[0-9]{11}"
                      maxLength="11"
                      inputMode="numeric"
                      placeholder="Phone Number" 
                      disabled={editLoading}
                      style={{ 
                        width: '100%', 
                        padding: '0.75rem', 
                        borderRadius: 8, 
                        border: '1.5px solid #e2cfa3', 
                        fontSize: 14, 
                        color: '#3F2E1E', 
                        background: '#fff',
                        boxSizing: 'border-box'
                      }} 
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontWeight: 600, color: '#3F2E1E', marginBottom: '0.5rem' }}>Sex *</label>
                    <select 
                      name="Sex" 
                      value={form.Sex} 
                      onChange={handleFormChange} 
                      required 
                      disabled={editLoading}
                      style={{ 
                        width: '100%', 
                        padding: '0.75rem', 
                        borderRadius: 8, 
                        border: '1.5px solid #e2cfa3', 
                        fontSize: 14, 
                        color: '#3F2E1E', 
                        background: '#fff',
                        boxSizing: 'border-box'
                      }}
                    >
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontWeight: 600, color: '#3F2E1E', marginBottom: '0.5rem' }}>Role *</label>
                    <select 
                      name="role" 
                      value={form.role} 
                      onChange={handleFormChange} 
                      required 
                      disabled={editLoading}
                      style={{ 
                        width: '100%', 
                        padding: '0.75rem', 
                        borderRadius: 8, 
                        border: '1.5px solid #e2cfa3', 
                        fontSize: 14, 
                        color: '#3F2E1E', 
                        background: '#fff',
                        boxSizing: 'border-box'
                      }}
                    >
                      <option value="">Select Role</option>
                      {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontWeight: 600, color: '#3F2E1E', marginBottom: '0.5rem' }}>Address</label>
                  <input 
                    type="text" 
                    name="address" 
                    value={form.address} 
                    onChange={handleFormChange} 
                    placeholder="Address" 
                    disabled={editLoading}
                    style={{ 
                      width: '100%', 
                      padding: '0.75rem', 
                      borderRadius: 8, 
                      border: '1.5px solid #e2cfa3', 
                      fontSize: 14, 
                      color: '#3F2E1E', 
                      background: '#fff',
                      boxSizing: 'border-box'
                    }} 
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontWeight: 600, color: '#3F2E1E', marginBottom: '0.5rem' }}>Birthdate *</label>
                  <input 
                    type="date" 
                    name="birthdate" 
                    value={form.birthdate} 
                    onChange={handleFormChange} 
                    required 
                    disabled={editLoading}
                    style={{ 
                      width: '100%', 
                      padding: '0.75rem', 
                      borderRadius: 8, 
                      border: '1.5px solid #e2cfa3', 
                      fontSize: 14, 
                      color: '#3F2E1E', 
                      background: '#fff',
                      boxSizing: 'border-box'
                    }} 
                  />
                </div>

                {/* Membership Details Section */}
                <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '2px solid #e2cfa3' }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#3F2E1E', marginBottom: '1rem' }}>Membership Details</h3>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                      <label style={{ display: 'block', fontWeight: 600, color: '#3F2E1E', marginBottom: '0.5rem' }}>Membership Status</label>
                      <select 
                        name="membership_status" 
                        value={form.membership_status} 
                        onChange={handleFormChange} 
                        disabled={editLoading}
                        style={{ 
                          width: '100%', 
                          padding: '0.75rem', 
                          borderRadius: 8, 
                          border: '1.5px solid #e2cfa3', 
                          fontSize: 14, 
                          color: '#3F2E1E', 
                          background: '#fff',
                          boxSizing: 'border-box'
                        }}
                      >
                        {PARISHIONER_STATUSES.map(status => (
                          <option key={status.value} value={status.value}>{status.label}</option>
                        ))}
                      </select>
                    </div>
                    {!editUser && (
                      <div>
                        <label style={{ display: 'block', fontWeight: 600, color: '#3F2E1E', marginBottom: '0.5rem' }}>Membership Date</label>
                        <input 
                          type="date" 
                          name="membership_date" 
                          value={form.membership_date} 
                          onChange={handleFormChange} 
                          disabled={editLoading}
                          style={{ 
                            width: '100%', 
                            padding: '0.75rem', 
                            borderRadius: 8, 
                            border: '1.5px solid #e2cfa3', 
                            fontSize: 14, 
                            color: '#3F2E1E', 
                            background: '#fff',
                            boxSizing: 'border-box'
                          }} 
                        />
                      </div>
                    )}
                  </div>

                  {!editUser && (
                    <>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
                        <div>
                          <label style={{ display: 'block', fontWeight: 600, color: '#3F2E1E', marginBottom: '0.5rem' }}>Last Attendance</label>
                          <input 
                            type="date" 
                            name="last_attendance" 
                            value={form.last_attendance} 
                            onChange={handleFormChange} 
                            disabled={editLoading}
                            style={{ 
                              width: '100%', 
                              padding: '0.75rem', 
                              borderRadius: 8, 
                              border: '1.5px solid #e2cfa3', 
                              fontSize: 14, 
                              color: '#3F2E1E', 
                              background: '#fff',
                              boxSizing: 'border-box'
                            }} 
                          />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontWeight: 600, color: '#3F2E1E', marginBottom: '0.5rem' }}>Baptismal Parish</label>
                          <input 
                            type="text" 
                            name="baptismal_parish" 
                            value={form.baptismal_parish} 
                            onChange={handleFormChange} 
                            placeholder="Baptismal Parish" 
                            disabled={editLoading}
                            style={{ 
                              width: '100%', 
                              padding: '0.75rem', 
                              borderRadius: 8, 
                              border: '1.5px solid #e2cfa3', 
                              fontSize: 14, 
                              color: '#3F2E1E', 
                              background: '#fff',
                              boxSizing: 'border-box'
                            }} 
                          />
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
                        <div>
                          <label style={{ display: 'block', fontWeight: 600, color: '#3F2E1E', marginBottom: '0.5rem' }}>Confirmation Parish</label>
                          <input 
                            type="text" 
                            name="confirmation_parish" 
                            value={form.confirmation_parish} 
                            onChange={handleFormChange} 
                            placeholder="Confirmation Parish" 
                            disabled={editLoading}
                            style={{ 
                              width: '100%', 
                              padding: '0.75rem', 
                              borderRadius: 8, 
                              border: '1.5px solid #e2cfa3', 
                              fontSize: 14, 
                              color: '#3F2E1E', 
                              background: '#fff',
                              boxSizing: 'border-box'
                            }} 
                          />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontWeight: 600, color: '#3F2E1E', marginBottom: '0.5rem' }}>Ministry Involvements</label>
                          <input 
                            type="text" 
                            name="ministry_involvements" 
                            value={Array.isArray(form.ministry_involvements) ? form.ministry_involvements.join(', ') : form.ministry_involvements || ''} 
                            onChange={(e) => {
                              const value = e.target.value;
                              setForm(prev => ({ ...prev, ministry_involvements: value ? value.split(',').map(item => item.trim()).filter(item => item) : [] }));
                            }} 
                            placeholder="e.g., Choir, Youth Ministry" 
                            disabled={editLoading}
                            style={{ 
                              width: '100%', 
                              padding: '0.75rem', 
                              borderRadius: 8, 
                              border: '1.5px solid #e2cfa3', 
                              fontSize: 14, 
                              color: '#3F2E1E', 
                              background: '#fff',
                              boxSizing: 'border-box'
                            }} 
                          />
                        </div>
                      </div>

                      <div style={{ marginTop: '1rem' }}>
                        <label style={{ display: 'block', fontWeight: 600, color: '#3F2E1E', marginBottom: '0.5rem' }}>Membership Notes</label>
                        <textarea 
                          name="membership_notes" 
                          value={form.membership_notes} 
                          onChange={handleFormChange} 
                          placeholder="Additional notes about membership" 
                          disabled={editLoading}
                          rows={3}
                          style={{ 
                            width: '100%', 
                            padding: '0.75rem', 
                            borderRadius: 8, 
                            border: '1.5px solid #e2cfa3', 
                            fontSize: 14, 
                            color: '#3F2E1E', 
                            background: '#fff',
                            boxSizing: 'border-box',
                            resize: 'vertical'
                          }} 
                        />
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
                        <div>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, color: '#3F2E1E' }}>
                            <input 
                              type="checkbox" 
                              name="newsletter_subscribed" 
                              checked={form.newsletter_subscribed} 
                              onChange={(e) => setForm(prev => ({ ...prev, newsletter_subscribed: e.target.checked }))} 
                              disabled={editLoading}
                              style={{ width: '18px', height: '18px' }}
                            />
                            Newsletter Subscribed
                          </label>
                        </div>
                        <div>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, color: '#3F2E1E' }}>
                            <input 
                              type="checkbox" 
                              name="volunteer_interest" 
                              checked={form.volunteer_interest} 
                              onChange={(e) => setForm(prev => ({ ...prev, volunteer_interest: e.target.checked }))} 
                              disabled={editLoading}
                              style={{ width: '18px', height: '18px' }}
                            />
                            Volunteer Interest
                          </label>
                        </div>
                      </div>
                    </>
                  )}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontWeight: 600, color: '#3F2E1E', marginBottom: '0.5rem' }}>
                      {editUser ? 'New Password' : 'Password *'}
                    </label>
                    <input 
                      type="password" 
                      name="password" 
                      value={form.password} 
                      onChange={handleFormChange} 
                      placeholder={editUser ? "Leave blank to keep current" : "Enter password"} 
                      required={!editUser}
                      disabled={editLoading}
                      style={{ 
                        width: '100%', 
                        padding: '0.75rem', 
                        borderRadius: 8, 
                        border: '1.5px solid #e2cfa3', 
                        fontSize: 14, 
                        color: '#3F2E1E', 
                        background: '#fff',
                        boxSizing: 'border-box'
                      }} 
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontWeight: 600, color: '#3F2E1E', marginBottom: '0.5rem' }}>
                      {editUser ? 'Confirm Password' : 'Confirm Password *'}
                    </label>
                    <input 
                      type="password" 
                      name="password_confirmation" 
                      value={form.password_confirmation} 
                      onChange={handleFormChange} 
                      placeholder={editUser ? "Confirm new password" : "Confirm password"} 
                      required={!editUser}
                      disabled={editLoading}
                      style={{ 
                        width: '100%', 
                        padding: '0.75rem', 
                        borderRadius: 8, 
                        border: '1.5px solid #e2cfa3', 
                        fontSize: 14, 
                        color: '#3F2E1E', 
                        background: '#fff',
                        boxSizing: 'border-box'
                      }} 
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', justifyContent: 'center' }}>
                  <button 
                    type="submit" 
                    disabled={editLoading}
                    style={{ 
                      background: '#CD8B3E', 
                      color: 'white', 
                      padding: '0.75rem 2rem', 
                      borderRadius: 8, 
                      border: 'none', 
                      fontWeight: 600, 
                      fontSize: '1rem',
                      cursor: editLoading ? 'not-allowed' : 'pointer',
                      opacity: editLoading ? 0.7 : 1,
                      transition: 'all 0.2s'
                    }}
                  >
                    {editLoading ? (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}>
                        <span className="spinner" style={{ width: 20, height: 20, border: '3px solid #fff', borderTop: '3px solid #CD8B3E', borderRadius: '50%', animation: 'spin 1s linear infinite', display: 'inline-block' }}></span>
                        {editUser ? 'Updating...' : 'Adding...'}
                      </span>
                    ) : (editUser ? 'Update User' : 'Add Member')}
                  </button>
                  <button 
                    type="button" 
                    onClick={() => {
                      setShowEdit(false);
                      setEditUser(null);
                      setForm(initialForm);
                    }} 
                    disabled={editLoading}
                    style={{ 
                      background: '#f8f9fa', 
                      color: '#6c757d', 
                      padding: '0.75rem 2rem', 
                      borderRadius: 8, 
                      border: '1px solid #dee2e6', 
                      fontWeight: 600, 
                      fontSize: '1rem',
                      cursor: editLoading ? 'not-allowed' : 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
              
              {error && (
                <div style={{ 
                  color: '#dc3545', 
                  marginTop: '1rem', 
                  padding: '0.75rem', 
                  background: '#f8d7da', 
                  border: '1px solid #f5c6cb', 
                  borderRadius: 8,
                  fontSize: '0.875rem'
                }}>
                  {error}
                </div>
              )}
              {success && (
                <div style={{ 
                  color: '#155724', 
                  marginTop: '1rem', 
                  padding: '0.75rem', 
                  background: '#d4edda', 
                  border: '1px solid #c3e6cb', 
                  borderRadius: 8,
                  fontSize: '0.875rem'
                }}>
                  {success}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDelete && (
        <div style={modalStyle}>
          <div style={modalContentStyle}>
            <h2 className="text-3xl font-extrabold text-[#3F2E1E] mb-2" style={{ fontSize: '1.5rem', marginBottom: '0.8rem' }}>Delete User</h2>
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <div style={{ fontSize: '3rem', marginBottom: '0.8rem' }}>⚠️</div>
              <p style={{ fontSize: '1rem', color: '#3F2E1E', marginBottom: '0.4rem' }}>
                Are you sure you want to delete <strong>{deleteUser?.name}</strong>?
              </p>
              <p style={{ fontSize: '0.85rem', color: '#666', marginBottom: '0.8rem' }}>
                Email: {deleteUser?.email}
              </p>
              <p style={{ fontSize: '0.85rem', color: '#DC2626', fontWeight: 600 }}>
                This action cannot be undone!
              </p>
            </div>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <button 
                onClick={handleDeleteUser} 
                className="primary" 
                style={{ background: '#DC2626', color: 'white', padding: '0.625rem 1.5rem', borderRadius: '0.5rem', border: 'none', fontWeight: 600, width: '100%' }} 
                disabled={deleteLoading}
              >
                {deleteLoading ? (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}>
                    <span className="spinner" style={{ width: 20, height: 20, border: '3px solid #fff', borderTop: '3px solid #DC2626', borderRadius: '50%', animation: 'spin 1s linear infinite', display: 'inline-block' }}></span>
                    Deleting...
                  </span>
                ) : 'Delete User'}
              </button>
              <button 
                type="button" 
                onClick={() => setShowDelete(false)} 
                style={{ background: '#eee', color: '#3F2E1E', padding: '0.625rem 1.5rem', borderRadius: '0.5rem', border: 'none', fontWeight: 600, width: '100%' }} 
                disabled={deleteLoading}
              >
                Cancel
              </button>
            </div>
            {error && <div className="error-msg" style={{ color: 'red', marginTop: '1rem' }}>{error}</div>}
          </div>
        </div>
      )}

      {/* Add Family Modal */}
      {showAddFamily && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          backdropFilter: 'blur(5px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 3000,
          padding: '20px',
          overflowY: 'auto',
        }}>
          <div style={{
            background: '#FDFBF5',
            border: '1.5px solid #E2CFA3',
            borderRadius: '1rem',
            boxShadow: '0 8px 24px rgba(60, 47, 30, 0.12)',
            maxWidth: '700px',
            width: '90%',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxSizing: 'border-box',
            margin: '20px 0',
            position: 'relative',
            overflow: 'hidden'
          }}>
            {/* Header */}
            <div style={{
              background: '#CD8B3E',
              padding: '1.5rem 2rem',
              borderRadius: '1rem 1rem 0 0',
              position: 'relative'
            }}>
              <h2 style={{ 
                fontSize: '1.5rem', 
                marginBottom: '0.5rem', 
                fontWeight: '700', 
                color: 'white',
                textAlign: 'center',
                margin: 0
              }}>
                👨‍👩‍👧‍👦 Add New Family
              </h2>
              <p style={{
                fontSize: '0.9rem',
                color: 'white',
                textAlign: 'center',
                margin: '0.5rem 0 0 0',
                opacity: 0.9
              }}>
                Create a new family membership record
              </p>
              
              {/* Close Button */}
              <button
                onClick={() => setShowAddFamily(false)}
                style={{
                  position: 'absolute',
                  top: '1rem',
                  right: '1rem',
                  background: 'white',
                  border: 'none',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  fontSize: '1.2rem',
                  color: '#CD8B3E',
                  fontWeight: 'bold',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = 'scale(1.1)';
                  e.target.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'scale(1)';
                  e.target.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
                }}
              >
                ✕
              </button>
            </div>

            {/* Form Body */}
            <div style={{ padding: '2rem' }}>
              <form onSubmit={handleAddFamily} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%' }}>
                <div>
                  <label style={{ display: 'block', fontWeight: 600, color: '#3F2E1E', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Family Name *</label>
                  <input 
                    type="text" 
                    name="family_name" 
                    value={familyForm.family_name} 
                    onChange={(e) => setFamilyForm({...familyForm, family_name: e.target.value})} 
                    placeholder="Enter family name" 
                    required 
                    disabled={familyLoading}
                    style={{ 
                      width: '100%', 
                      padding: '0.75rem', 
                      borderRadius: 8, 
                      border: '1.5px solid #E2CFA3', 
                      fontSize: 14, 
                      color: '#3F2E1E', 
                      background: '#fff',
                      boxSizing: 'border-box'
                    }} 
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontWeight: 600, color: '#3F2E1E', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Address</label>
                  <input 
                    type="text" 
                    name="address" 
                    value={familyForm.address} 
                    onChange={(e) => setFamilyForm({...familyForm, address: e.target.value})} 
                    placeholder="Enter family address" 
                    disabled={familyLoading}
                    style={{ 
                      width: '100%', 
                      padding: '0.75rem', 
                      borderRadius: 8, 
                      border: '1.5px solid #E2CFA3', 
                      fontSize: 14, 
                      color: '#3F2E1E', 
                      background: '#fff',
                      boxSizing: 'border-box'
                    }} 
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontWeight: 600, color: '#3F2E1E', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Phone</label>
                    <input 
                      type="tel" 
                      name="phone" 
                      value={familyForm.phone} 
                      onChange={(e) => setFamilyForm({...familyForm, phone: e.target.value})} 
                      placeholder="Phone number" 
                      disabled={familyLoading}
                      style={{ 
                        width: '100%', 
                        padding: '0.75rem', 
                        borderRadius: 8, 
                        border: '1.5px solid #E2CFA3', 
                        fontSize: 14, 
                        color: '#3F2E1E', 
                        background: '#fff',
                        boxSizing: 'border-box'
                      }} 
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontWeight: 600, color: '#3F2E1E', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Email Address of the Family Head *</label>
                    <input 
                      type="email" 
                      name="email" 
                      value={familyForm.email} 
                      onChange={(e) => setFamilyForm({...familyForm, email: e.target.value})} 
                      placeholder="Email address of the family head" 
                      required
                      disabled={familyLoading}
                      style={{ 
                        width: '100%', 
                        padding: '0.75rem', 
                        borderRadius: 8, 
                        border: '1.5px solid #E2CFA3', 
                        fontSize: 14, 
                        color: '#3F2E1E', 
                        background: '#fff',
                        boxSizing: 'border-box'
                      }} 
                    />
                    <p style={{ fontSize: '0.75rem', color: '#5C4B38', marginTop: '0.25rem', marginBottom: 0 }}>
                      The user with this email will become the family head. The admin will not be added to the family.
                    </p>
                  </div>
                </div>


                {/* Action Buttons */}
                <div style={{ 
                  display: 'flex', 
                  gap: '1rem', 
                  marginTop: '1.5rem', 
                  justifyContent: 'center',
                  alignItems: 'center'
                }}>
                  <button 
                    type="submit" 
                    style={{ 
                      background: '#CD8B3E', 
                      color: 'white', 
                      padding: '0.75rem 2rem', 
                      borderRadius: '0.5rem', 
                      border: 'none', 
                      fontWeight: 600, 
                      fontSize: '0.875rem',
                      cursor: familyLoading ? 'not-allowed' : 'pointer',
                      opacity: familyLoading ? 0.7 : 1,
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                      transition: 'all 0.2s ease'
                    }} 
                    disabled={familyLoading}
                    onMouseEnter={(e) => {
                      if (!familyLoading) {
                        e.target.style.background = '#B87A2E';
                        e.target.style.transform = 'translateY(-1px)';
                        e.target.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!familyLoading) {
                        e.target.style.background = '#CD8B3E';
                        e.target.style.transform = 'translateY(0)';
                        e.target.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
                      }
                    }}
                  >
                    {familyLoading ? 'Creating...' : 'Add Family'}
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setShowAddFamily(false)} 
                    style={{ 
                      background: '#FDFBF5', 
                      color: '#3F2E1E', 
                      padding: '0.75rem 2rem', 
                      borderRadius: '0.5rem', 
                      border: '1.5px solid #E2CFA3', 
                      fontWeight: 600, 
                      fontSize: '0.875rem',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }} 
                    disabled={familyLoading}
                    onMouseEnter={(e) => {
                      e.target.style.background = '#F5F1E8';
                      e.target.style.borderColor = '#CD8B3E';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.background = '#FDFBF5';
                      e.target.style.borderColor = '#E2CFA3';
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
              
              {error && (
                <div style={{ 
                  color: '#dc2626', 
                  marginTop: '1rem', 
                  padding: '0.75rem',
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  borderRadius: '0.5rem',
                  fontSize: '0.9rem',
                  textAlign: 'center'
                }}>
                  ⚠️ {error}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Edit Family Modal */}
      {showEditFamily && selectedFamily && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          backdropFilter: 'blur(5px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 3000,
          padding: '20px',
          overflowY: 'auto',
        }}>
          <div style={{
            background: 'white',
            border: '1.5px solid #f2e4ce',
            borderRadius: '1rem',
            boxShadow: '0 8px 24px rgba(60, 47, 30, 0.12)',
            padding: '2rem',
            maxWidth: '700px',
            width: '90%',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxSizing: 'border-box',
            margin: '20px 0',
            position: 'relative',
          }}>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', fontWeight: '700', color: '#3F2E1E', textAlign: 'center' }}>
              ✏️ Edit Family
            </h2>
            <form onSubmit={handleEditFamily} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%' }}>
              <div>
                <label style={{ display: 'block', fontWeight: 600, color: '#3F2E1E', marginBottom: '0.5rem' }}>Family Name *</label>
                <input 
                  type="text" 
                  name="family_name" 
                  value={familyForm.family_name} 
                  onChange={(e) => setFamilyForm({...familyForm, family_name: e.target.value})} 
                  placeholder="Enter family name" 
                  required 
                  disabled={familyLoading}
                  style={{ 
                    width: '100%', 
                    padding: '0.75rem', 
                    borderRadius: 8, 
                    border: '1.5px solid #e2cfa3', 
                    fontSize: 14, 
                    color: '#3F2E1E', 
                    background: '#fff',
                    boxSizing: 'border-box'
                  }} 
                />
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: 600, color: '#3F2E1E', marginBottom: '0.5rem' }}>Address</label>
                <input 
                  type="text" 
                  name="address" 
                  value={familyForm.address} 
                  onChange={(e) => setFamilyForm({...familyForm, address: e.target.value})} 
                  placeholder="Enter family address" 
                  disabled={familyLoading}
                  style={{ 
                    width: '100%', 
                    padding: '0.75rem', 
                    borderRadius: 8, 
                    border: '1.5px solid #e2cfa3', 
                    fontSize: 14, 
                    color: '#3F2E1E', 
                    background: '#fff',
                    boxSizing: 'border-box'
                  }} 
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontWeight: 600, color: '#3F2E1E', marginBottom: '0.5rem' }}>Phone Number of the Family Head</label>
                  <input 
                    type="tel" 
                    name="phone" 
                    value={familyForm.phone} 
                    onChange={(e) => setFamilyForm({...familyForm, phone: e.target.value})} 
                    placeholder="Phone number" 
                    disabled={familyLoading}
                    style={{ 
                      width: '100%', 
                      padding: '0.75rem', 
                      borderRadius: 8, 
                      border: '1.5px solid #e2cfa3', 
                      fontSize: 14, 
                      color: '#3F2E1E', 
                      background: '#fff',
                      boxSizing: 'border-box'
                    }} 
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontWeight: 600, color: '#3F2E1E', marginBottom: '0.5rem' }}>Email</label>
                  <input 
                    type="email" 
                    name="email" 
                    value={familyForm.email} 
                    onChange={(e) => setFamilyForm({...familyForm, email: e.target.value})} 
                    placeholder="Email address" 
                    disabled={familyLoading}
                    style={{ 
                      width: '100%', 
                      padding: '0.75rem', 
                      borderRadius: 8, 
                      border: '1.5px solid #e2cfa3', 
                      fontSize: 14, 
                      color: '#3F2E1E', 
                      background: '#fff',
                      boxSizing: 'border-box'
                    }} 
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: 600, color: '#3F2E1E', marginBottom: '0.5rem' }}>Family Status</label>
                <select 
                  name="family_status" 
                  value={familyForm.family_status} 
                  onChange={(e) => setFamilyForm({...familyForm, family_status: e.target.value})} 
                  disabled={familyLoading}
                  style={{ 
                    width: '100%', 
                    padding: '0.75rem', 
                    borderRadius: 8, 
                    border: '1.5px solid #e2cfa3', 
                    fontSize: 14, 
                    color: '#3F2E1E', 
                    background: '#fff',
                    boxSizing: 'border-box'
                  }}
                >
                  {FAMILY_STATUSES.map(status => (
                    <option key={status.value} value={status.value}>{status.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: 600, color: '#3F2E1E', marginBottom: '0.5rem' }}>Family Notes</label>
                <textarea 
                  name="family_notes" 
                  value={familyForm.family_notes || ''} 
                  onChange={(e) => setFamilyForm({...familyForm, family_notes: e.target.value})} 
                  placeholder="Enter any additional notes about the family" 
                  rows={3}
                  disabled={familyLoading}
                  style={{ 
                    width: '100%', 
                    padding: '0.75rem', 
                    borderRadius: 8, 
                    border: '1.5px solid #e2cfa3', 
                    fontSize: 14, 
                    color: '#3F2E1E', 
                    background: '#fff',
                    boxSizing: 'border-box',
                    resize: 'vertical'
                  }} 
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem', justifyContent: 'center' }}>
                <button 
                  type="submit" 
                  style={{ 
                    background: '#0ea5e9', 
                    color: 'white', 
                    padding: '0.75rem 1.5rem', 
                    borderRadius: '0.5rem', 
                    border: 'none', 
                    fontWeight: 600, 
                    fontSize: '0.875rem',
                    cursor: familyLoading ? 'not-allowed' : 'pointer',
                    opacity: familyLoading ? 0.7 : 1
                  }} 
                  disabled={familyLoading}
                >
                  {familyLoading ? 'Updating...' : 'Update Family'}
                </button>
                <button 
                  type="button" 
                  onClick={() => {
                    setShowEditFamily(false);
                    setSelectedFamily(null);
                    setFamilyForm({
                      family_name: '',
                      address: '',
                      phone: '',
                      email: '',
                      newsletter_subscribed: true,
                      volunteer_family: false,
                      family_status: 'active',
                      family_role: 'head',
                      relationship_to_head: '',
                      is_family_head: false
                    });
                  }} 
                  style={{ 
                    background: '#eee', 
                    color: '#3F2E1E', 
                    padding: '0.75rem 1.5rem', 
                    borderRadius: '0.5rem', 
                    border: 'none', 
                    fontWeight: 600, 
                    fontSize: '0.875rem',
                    cursor: familyLoading ? 'not-allowed' : 'pointer'
                  }} 
                  disabled={familyLoading}
                >
                  Cancel
                </button>
              </div>
            </form>
            {error && <div className="error-msg" style={{ color: 'red', marginTop: '1rem', textAlign: 'center' }}>{error}</div>}
          </div>
        </div>
      )}

      {/* Add Member to Family Modal */}
      {showAddMemberToFamily && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          backdropFilter: 'blur(5px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 4000,
          padding: '20px',
          overflowY: 'auto',
        }}>
          <div style={{
            background: 'white',
            border: '1.5px solid #f2e4ce',
            borderRadius: '1rem',
            boxShadow: '0 8px 24px rgba(60, 47, 30, 0.12)',
            padding: '2rem',
            maxWidth: '600px',
            width: '90%',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxSizing: 'border-box',
            margin: '20px 0',
            position: 'relative',
          }}>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', fontWeight: '700', color: '#3F2E1E', textAlign: 'center' }}>
              ➕ Add Member to Family
            </h2>
            <form onSubmit={handleAddMemberToFamily} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%' }}>
              <div style={{ position: 'relative' }}>
                <label style={{ display: 'block', fontWeight: 600, color: '#3F2E1E', marginBottom: '0.5rem' }}>Select User *</label>
                <input
                  type="text"
                  value={selectedUser ? `${selectedUser.name} (${selectedUser.email})` : userSearchQuery}
                  onChange={(e) => {
                    const value = e.target.value;
                    setUserSearchQuery(value);
                    setShowUserDropdown(true);
                    // Clear selection if user is typing something different
                    if (selectedUser && (!value || !value.includes(selectedUser.name))) {
                      setSelectedUser(null);
                    }
                  }}
                  onFocus={() => {
                    if (userSearchQuery || !selectedUser) {
                      setShowUserDropdown(true);
                    }
                  }}
                  onBlur={() => {
                    // Delay to allow click on dropdown items
                    setTimeout(() => setShowUserDropdown(false), 200);
                  }}
                  placeholder={selectedUser ? "User selected" : "Type to search for a user..."}
                  disabled={familyLoading}
                  required={!selectedUser}
                  style={{ 
                    width: '100%', 
                    padding: '0.75rem', 
                    borderRadius: 8, 
                    border: '1.5px solid #e2cfa3', 
                    fontSize: 14, 
                    color: '#3F2E1E', 
                    background: selectedUser ? '#f0fdf4' : '#fff',
                    boxSizing: 'border-box'
                  }}
                />
                {showUserDropdown && userSearchQuery && (
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    background: 'white',
                    border: '1px solid #e2cfa3',
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                    maxHeight: '300px',
                    overflowY: 'auto',
                    zIndex: 5000,
                    marginTop: '4px'
                  }}>
                    {(() => {
                      const filteredUsers = users
                        .filter(user => 
                          !user.is_admin && 
                          !user.is_staff && 
                          !user.is_priest &&
                          (user.name?.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
                           user.email?.toLowerCase().includes(userSearchQuery.toLowerCase()))
                        );
                      
                      if (filteredUsers.length === 0) {
                        return (
                          <div style={{
                            padding: '1rem',
                            textAlign: 'center',
                            color: '#6b7280',
                            fontSize: '0.875rem'
                          }}>
                            No person found
                          </div>
                        );
                      }
                      
                      return filteredUsers.map(user => (
                        <div
                          key={user.id}
                          onClick={() => {
                            setSelectedUser(user);
                            setUserSearchQuery('');
                            setShowUserDropdown(false);
                          }}
                          style={{
                            padding: '0.75rem',
                            cursor: 'pointer',
                            borderBottom: '1px solid #f3f4f6',
                            transition: 'background-color 0.2s',
                            ':hover': {
                              backgroundColor: '#f9fafb'
                            }
                          }}
                          onMouseEnter={(e) => {
                            e.target.style.backgroundColor = '#f9fafb';
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.backgroundColor = 'white';
                          }}
                        >
                          <div style={{ fontWeight: '600', color: '#1f2937', fontSize: '0.875rem' }}>
                            {user.name}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>
                            {user.email}
                            {user.family_id && (
                              <span style={{ color: '#f59e0b', marginLeft: '0.5rem' }}>
                                - Already in a family
                              </span>
                            )}
                          </div>
                        </div>
                      ));
                    })()}
                  </div>
                )}
                {selectedUser && (
                  <input type="hidden" name="user_id" value={selectedUser.id} />
                )}
              </div>
              
              <div>
                <label style={{ display: 'block', fontWeight: 600, color: '#3F2E1E', marginBottom: '0.5rem' }}>Select Family *</label>
                <select 
                  value={selectedFamily?.id || ''} 
                  onChange={(e) => {
                    const family = families.find(f => f.id === parseInt(e.target.value));
                    setSelectedFamily(family);
                  }} 
                  required 
                  disabled={familyLoading}
                  style={{ 
                    width: '100%', 
                    padding: '0.75rem', 
                    borderRadius: 8, 
                    border: '1.5px solid #e2cfa3', 
                    fontSize: 14, 
                    color: '#3F2E1E', 
                    background: '#fff',
                    boxSizing: 'border-box'
                  }}
                >
                  <option value="">Select Family</option>
                  {families.map(family => (
                    <option key={family.id} value={family.id}>
                      {family.family_name} ({family.family_code})
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label style={{ display: 'block', fontWeight: 600, color: '#3F2E1E', marginBottom: '0.5rem' }}>Family Role *</label>
                <select 
                  name="family_role" 
                  value={familyForm.family_role || ''} 
                  onChange={(e) => setFamilyForm({...familyForm, family_role: e.target.value})} 
                  required 
                  disabled={familyLoading}
                  style={{ 
                    width: '100%', 
                    padding: '0.75rem', 
                    borderRadius: 8, 
                    border: '1.5px solid #e2cfa3', 
                    fontSize: 14, 
                    color: '#3F2E1E', 
                    background: '#fff',
                    boxSizing: 'border-box'
                  }}
                >
                  <option value="">Select Role</option>
                  {FAMILY_ROLES.map(role => (
                    <option key={role.value} value={role.value}>{role.label}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label style={{ display: 'block', fontWeight: 600, color: '#3F2E1E', marginBottom: '0.5rem' }}>Relationship to Family Head</label>
                <input 
                  type="text" 
                  name="relationship_to_head" 
                  value={familyForm.relationship_to_head || ''} 
                  onChange={(e) => setFamilyForm({...familyForm, relationship_to_head: e.target.value})} 
                  placeholder="e.g., Son, Daughter, Spouse" 
                  disabled={familyLoading}
                  style={{ 
                    width: '100%', 
                    padding: '0.75rem', 
                    borderRadius: 8, 
                    border: '1.5px solid #e2cfa3', 
                    fontSize: 14, 
                    color: '#3F2E1E', 
                    background: '#fff',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
              
              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, color: '#3F2E1E', cursor: 'pointer' }}>
                  <input 
                    type="checkbox" 
                    name="is_family_head" 
                    checked={familyForm.is_family_head || false} 
                    onChange={(e) => setFamilyForm({...familyForm, is_family_head: e.target.checked})} 
                    disabled={familyLoading}
                    style={{ cursor: 'pointer' }}
                  />
                  Is Family Head
                </label>
              </div>
              
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem', justifyContent: 'center' }}>
                <button 
                  type="submit" 
                  style={{ 
                    background: '#10b981', 
                    color: 'white', 
                    padding: '0.75rem 1.5rem', 
                    borderRadius: '0.5rem', 
                    border: 'none', 
                    fontWeight: 600, 
                    fontSize: '0.875rem',
                    cursor: familyLoading ? 'not-allowed' : 'pointer',
                    opacity: familyLoading ? 0.7 : 1
                  }} 
                  disabled={familyLoading}
                >
                  {familyLoading ? 'Adding...' : 'Add to Family'}
                </button>
                <button 
                  type="button" 
                  onClick={() => { 
                    setShowAddMemberToFamily(false); 
                    setSelectedUser(null); 
                    setSelectedFamily(null);
                    setUserSearchQuery('');
                    setShowUserDropdown(false);
                    setFamilyForm({
                      family_name: '',
                      address: '',
                      phone: '',
                      email: '',
                      newsletter_subscribed: true,
                      volunteer_family: false,
                      family_status: 'active',
                      family_role: 'head',
                      relationship_to_head: '',
                      is_family_head: false
                    });
                  }} 
                  style={{ 
                    background: '#eee', 
                    color: '#3F2E1E', 
                    padding: '0.75rem 1.5rem', 
                    borderRadius: '0.5rem', 
                    border: 'none', 
                    fontWeight: 600, 
                    fontSize: '0.875rem',
                    cursor: familyLoading ? 'not-allowed' : 'pointer'
                  }} 
                  disabled={familyLoading}
                >
                  Cancel
                </button>
              </div>
            </form>
            {error && <div className="error-msg" style={{ color: 'red', marginTop: '1rem', textAlign: 'center' }}>{error}</div>}
          </div>
        </div>
      )}

      {/* Family Detail Modal */}
      {showFamilyDetail && selectedFamily && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(44, 44, 44, 0.25)',
          backdropFilter: 'blur(6px)',
          WebkitBackdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 3000,
        }}>
          <div style={{
            background: '#fff',
            borderRadius: 18,
            boxShadow: '0 8px 32px rgba(60,40,20,0.18)',
            padding: '1.5rem',
            minWidth: 800,
            maxWidth: 1000,
            width: '90vw',
            maxHeight: '90vh',
            overflow: 'auto',
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            gap: 18,
          }}>
            <div style={{ 
              background: 'linear-gradient(135deg, #CD8B3E 0%, #B77B35 100%)', 
              borderRadius: '12px 12px 0 0', 
              padding: '1.5rem 2rem', 
              margin: '-1.5rem -1.5rem 0 -1.5rem',
              color: 'white',
              textAlign: 'center',
              position: 'relative'
            }}>
              <h2 style={{ 
                fontSize: '1.5rem', 
                fontWeight: '700', 
                margin: '0 0 0.5rem 0',
                color: 'white'
              }}>
                👨‍👩‍👧‍👦 {selectedFamily.family_name || 'Family Details'}
              </h2>
              <p style={{ 
                fontSize: '0.875rem', 
                margin: '0', 
                color: 'white',
                opacity: 0.9
              }}>
                Family Code: {selectedFamily.family_code}
              </p>
              <button 
                onClick={() => {
                  setShowFamilyDetail(false);
                  setSelectedFamily(null);
                }} 
                title="Close"
                style={{
                  position: 'absolute',
                  top: '1rem',
                  right: '1rem',
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  color: 'white',
                  fontSize: '1.2rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s',
                  fontWeight: 'bold'
                }}
              >
                ×
              </button>
            </div>
            
            <div style={{ 
              background: '#f8fafc', 
              borderRadius: '0 0 12px 12px', 
              padding: '1.5rem', 
              marginBottom: 0, 
              width: '100%'
            }}>
              {/* Family Information */}
              <div style={{ marginBottom: '2rem' }}>
                <h3 style={{ 
                  fontSize: '1.25rem', 
                  fontWeight: '600', 
                  color: '#CD8B3E', 
                  margin: '0 0 1rem 0',
                  borderBottom: '2px solid #CD8B3E',
                  paddingBottom: '0.5rem'
                }}>
                  📋 Family Information
                </h3>
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
                  gap: '1rem' 
                }}>
                  <div style={{ 
                    background: '#fff', 
                    padding: '1rem', 
                    borderRadius: '8px', 
                    border: '1px solid #e5e7eb' 
                  }}>
                    <div style={{ fontSize: '0.875rem', fontWeight: '600', color: '#374151', marginBottom: '0.25rem' }}>Family Name</div>
                    <div style={{ fontSize: '1rem', color: '#CD8B3E' }}>{selectedFamily.family_name || 'Not set'}</div>
                  </div>
                  <div style={{ 
                    background: '#fff', 
                    padding: '1rem', 
                    borderRadius: '8px', 
                    border: '1px solid #e5e7eb' 
                  }}>
                    <div style={{ fontSize: '0.875rem', fontWeight: '600', color: '#374151', marginBottom: '0.25rem' }}>Family Code</div>
                    <div style={{ fontSize: '1rem', color: '#CD8B3E', fontFamily: 'monospace' }}>{selectedFamily.family_code}</div>
                  </div>
                  <div style={{ 
                    background: '#fff', 
                    padding: '1rem', 
                    borderRadius: '8px', 
                    border: '1px solid #e5e7eb' 
                  }}>
                    <div style={{ fontSize: '0.875rem', fontWeight: '600', color: '#374151', marginBottom: '0.25rem' }}>Status</div>
                    <span style={{ 
                      padding: '0.25rem 0.5rem', 
                      borderRadius: '12px', 
                      fontSize: '0.75rem', 
                      fontWeight: '600',
                      backgroundColor: selectedFamily.family_status === 'active' ? '#10b981' : 
                                     selectedFamily.family_status === 'inactive' ? '#f59e0b' : '#3b82f6',
                      color: 'white'
                    }}>
                      {selectedFamily.family_status === 'active' ? 'Active' : 
                       selectedFamily.family_status === 'inactive' ? 'Inactive' : 'Transferred'}
                    </span>
                  </div>
                  <div style={{ 
                    background: '#fff', 
                    padding: '1rem', 
                    borderRadius: '8px', 
                    border: '1px solid #e5e7eb' 
                  }}>
                    <div style={{ fontSize: '0.875rem', fontWeight: '600', color: '#374151', marginBottom: '0.25rem' }}>Address</div>
                    <div style={{ fontSize: '1rem', color: '#3F2E1E' }}>{selectedFamily.address || 'Not set'}</div>
                  </div>
                  <div style={{ 
                    background: '#fff', 
                    padding: '1rem', 
                    borderRadius: '8px', 
                    border: '1px solid #e5e7eb' 
                  }}>
                    <div style={{ fontSize: '0.875rem', fontWeight: '600', color: '#374151', marginBottom: '0.25rem' }}>Phone</div>
                    <div style={{ fontSize: '1rem', color: '#3F2E1E' }}>{selectedFamily.phone || 'Not set'}</div>
                  </div>
                  <div style={{ 
                    background: '#fff', 
                    padding: '1rem', 
                    borderRadius: '8px', 
                    border: '1px solid #e5e7eb' 
                  }}>
                    <div style={{ fontSize: '0.875rem', fontWeight: '600', color: '#374151', marginBottom: '0.25rem' }}>Email</div>
                    <div style={{ fontSize: '1rem', color: '#3F2E1E' }}>{selectedFamily.email || 'Not set'}</div>
                  </div>
                </div>
              </div>

              {/* Family Members */}
              <div>
                <h3 style={{ 
                  fontSize: '1.25rem', 
                  fontWeight: '600', 
                  color: '#CD8B3E', 
                  margin: '0 0 1rem 0',
                  borderBottom: '2px solid #CD8B3E',
                  paddingBottom: '0.5rem'
                }}>
                  👥 Family Members ({selectedFamily.members?.length || 0})
                </h3>
                
                {selectedFamily.members && selectedFamily.members.length > 0 ? (
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
                    gap: '1rem' 
                  }}>
                    {selectedFamily.members.map((member) => (
                      <div
                        key={member.id}
                        style={{ 
                          background: '#fff',
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                          padding: '1rem',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                        }}
                      >
                        <div style={{ 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          alignItems: 'flex-start',
                          marginBottom: '0.75rem'
                        }}>
                          <div>
                            <h4 style={{ 
                              fontSize: '1rem', 
                              fontWeight: '600', 
                              color: '#CD8B3E', 
                              margin: '0 0 0.25rem 0' 
                            }}>
                              {member.name} {member.is_family_head && '👑'}
                            </h4>
                            <div style={{ 
                              fontSize: '0.75rem', 
                              color: '#6b7280' 
                            }}>
                              {member.email}
                            </div>
                          </div>
                          <span style={{ 
                            padding: '0.25rem 0.5rem', 
                            borderRadius: '12px', 
                            fontSize: '0.75rem', 
                            fontWeight: '600',
                            backgroundColor: member.is_family_head ? '#8b5cf6' : '#e5e7eb',
                            color: member.is_family_head ? 'white' : '#374151'
                          }}>
                            {member.family_role || 'Member'}
                          </span>
                        </div>
                        
                        <div style={{ 
                          display: 'grid', 
                          gridTemplateColumns: '1fr 1fr', 
                          gap: '0.5rem',
                          fontSize: '0.75rem',
                          color: '#6b7280'
                        }}>
                          <div>
                            <strong>Phone:</strong> {member.phone || 'Not set'}
                          </div>
                          <div>
                            <strong>Gender:</strong> {member.gender || 'Not set'}
                          </div>
                          <div>
                            <strong>Birthdate:</strong> {member.birthdate ? new Date(member.birthdate).toLocaleDateString() : 'Not set'}
                          </div>
                          <div>
                            <strong>Status:</strong> {member.membership_status || 'Not set'}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ 
                    textAlign: 'center', 
                    padding: '2rem', 
                    color: '#6b7280',
                    background: '#f9fafb',
                    borderRadius: '8px',
                    border: '1px solid #e5e7eb'
                  }}>
                    <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>👥</div>
                    <div>No family members found.</div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div style={{ 
                display: 'flex', 
                gap: '1rem', 
                marginTop: '2rem',
                justifyContent: 'center'
              }}>
                <button
                  onClick={() => {
                    // Populate form with selected family data
                    setFamilyForm({
                      family_name: selectedFamily.family_name || '',
                      address: selectedFamily.address || '',
                      phone: selectedFamily.phone || '',
                      email: selectedFamily.email || '',
                      newsletter_subscribed: selectedFamily.newsletter_subscribed ?? true,
                      volunteer_family: selectedFamily.volunteer_family ?? false,
                      family_status: selectedFamily.family_status || 'active',
                      family_notes: selectedFamily.family_notes || '',
                      family_role: 'head',
                      relationship_to_head: '',
                      is_family_head: false
                    });
                    setShowFamilyDetail(false);
                    setShowEditFamily(true);
                  }}
                  style={{ 
                    padding: '0.75rem 1.5rem', 
                    borderRadius: '8px', 
                    border: '1px solid #0ea5e9', 
                    background: '#0ea5e9', 
                    color: '#fff',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  ✏️ Edit Family
                </button>
                <button
                  onClick={() => {
                    // Keep selectedFamily when opening add member modal
                    setShowAddMemberToFamily(true);
                    setSelectedUser(null);
                    setUserSearchQuery('');
                    setShowUserDropdown(false);
                    setFamilyForm({
                      ...familyForm,
                      family_role: 'member',
                      relationship_to_head: '',
                      is_family_head: false
                    });
                  }}
                  style={{ 
                    padding: '0.75rem 1.5rem', 
                    borderRadius: '8px', 
                    border: '1px solid #10b981', 
                    background: '#10b981', 
                    color: '#fff',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  ➕ Add Member
                </button>
                <button
                  onClick={() => setShowDeleteFamilyConfirm(true)}
                  style={{ 
                    padding: '0.75rem 1.5rem', 
                    borderRadius: '8px', 
                    border: '1px solid #ef4444', 
                    background: '#ef4444', 
                    color: '#fff',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  🗑️ Delete Family
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Family Confirmation */}
      {showDeleteFamilyConfirm && selectedFamily && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(5px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3500
        }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: '1.5rem', width: 420 }}>
            <h3 style={{ marginTop: 0, marginBottom: 8 }}>Delete Family</h3>
            <p style={{ marginTop: 0 }}>Are you sure you want to delete the family "{selectedFamily.family_name}"? This will remove all family associations.</p>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16 }}>
              <button onClick={() => setShowDeleteFamilyConfirm(false)} style={{ padding: '0.5rem 1rem' }}>Cancel</button>
              <button
                onClick={async () => {
                  setFamilyLoading(true);
                  try {
                    const response = await authenticatedRequest(`/api/admin/families/${selectedFamily.id}`, { method: 'DELETE' });
                    const data = await response.json();
                    if (response.ok && data.success) {
                      openSuccess('Family Deleted', 'The family was deleted successfully.');
                      setShowDeleteFamilyConfirm(false);
                      setShowFamilyDetail(false);
                      setSelectedFamily(null);
                      fetchFamilies();
                      fetchFamilyStats();
                    } else {
                      setError(data.message || 'Failed to delete family');
                    }
                  } catch (_) {
                    setError('Failed to delete family');
                  } finally {
                    setFamilyLoading(false);
                  }
                }}
                style={{ padding: '0.5rem 1rem', background: '#ef4444', color: '#fff', border: 'none', borderRadius: 8 }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Remove Member from Family Confirmation */}
      {showRemoveMemberConfirm && memberToRemove && (
        <div style={{
          position: 'fixed', 
          top: 0, 
          left: 0, 
          right: 0, 
          bottom: 0,
          background: 'rgba(0,0,0,0.5)', 
          backdropFilter: 'blur(5px)',
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          zIndex: 3500
        }}>
          <div style={{ 
            background: '#fff', 
            borderRadius: 16, 
            padding: '2rem', 
            width: 450,
            boxShadow: '0 8px 24px rgba(60, 47, 30, 0.12)',
            border: '1.5px solid #f2e4ce'
          }}>
            <div style={{ 
              textAlign: 'center', 
              marginBottom: '1.5rem' 
            }}>
              <div style={{ 
                fontSize: '3rem', 
                marginBottom: '0.5rem' 
              }}>
                ⚠️
              </div>
              <h3 style={{ 
                marginTop: 0, 
                marginBottom: '0.5rem',
                fontSize: '1.5rem',
                fontWeight: '700',
                color: '#3F2E1E'
              }}>
                Remove Member from Family
              </h3>
            </div>
            <p style={{ 
              marginTop: 0,
              marginBottom: '1.5rem',
              fontSize: '1rem',
              color: '#6b7280',
              textAlign: 'center',
              lineHeight: '1.5'
            }}>
              Are you sure you want to remove <strong style={{ color: '#3F2E1E' }}>{memberToRemove.name}</strong> from their family? This action will remove all family associations for this member.
            </p>
            <div style={{ 
              display: 'flex', 
              gap: '0.75rem', 
              justifyContent: 'center', 
              marginTop: '1.5rem' 
            }}>
              <button 
                onClick={() => {
                  setShowRemoveMemberConfirm(false);
                  setMemberToRemove(null);
                }} 
                disabled={familyLoading}
                style={{ 
                  padding: '0.75rem 1.5rem',
                  background: '#eee',
                  color: '#3F2E1E',
                  border: 'none',
                  borderRadius: '0.5rem',
                  fontWeight: '600',
                  fontSize: '0.875rem',
                  cursor: familyLoading ? 'not-allowed' : 'pointer',
                  opacity: familyLoading ? 0.7 : 1
                }}
              >
                Cancel
              </button>
              <button
                onClick={confirmRemoveMember}
                disabled={familyLoading}
                style={{ 
                  padding: '0.75rem 1.5rem', 
                  background: '#ef4444', 
                  color: '#fff', 
                  border: 'none', 
                  borderRadius: '0.5rem',
                  fontWeight: '600',
                  fontSize: '0.875rem',
                  cursor: familyLoading ? 'not-allowed' : 'pointer',
                  opacity: familyLoading ? 0.7 : 1
                }}
              >
                {familyLoading ? 'Removing...' : 'Remove Member'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sacrament History Modal */}
      {showSacramentHistory && selectedUserForSacrament && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          backdropFilter: 'blur(5px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 3000,
          padding: '20px',
          overflowY: 'auto',
        }}>
          <div style={{
            background: '#fff',
            borderRadius: '1rem',
            boxShadow: '0 8px 32px rgba(60, 47, 30, 0.18)',
            padding: '1.5rem',
            maxWidth: '900px',
            width: '90%',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxSizing: 'border-box',
            position: 'relative',
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1.5rem',
              paddingBottom: '1rem',
              borderBottom: '2px solid #e2cfa3'
            }}>
              <div>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#3F2E1E', margin: 0 }}>
                  📿 Sacrament History
                </h2>
                <p style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.25rem', margin: 0 }}>
                  {selectedUserForSacrament.name} ({selectedUserForSacrament.email})
                </p>
              </div>
              <button
                onClick={() => {
                  setShowSacramentHistory(false);
                  setSelectedUserForSacrament(null);
                  setSacramentHistory([]);
                  setShowAddSacrament(false);
                  setShowEditSacrament(false);
                  setShowDeleteSacrament(false);
                  setError('');
                  setSuccess('');
                }}
                style={{
                  background: 'transparent',
                  border: 'none',
                  fontSize: '1.5rem',
                  cursor: 'pointer',
                  color: '#6b7280',
                  padding: '0.25rem 0.5rem',
                  borderRadius: '4px',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = '#f3f4f6';
                  e.target.style.color = '#3F2E1E';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'transparent';
                  e.target.style.color = '#6b7280';
                }}
              >
                ×
              </button>
            </div>

            {error && (
              <div style={{
                color: '#dc3545',
                marginBottom: '1rem',
                padding: '0.75rem',
                background: '#f8d7da',
                border: '1px solid #f5c6cb',
                borderRadius: 8,
                fontSize: '0.875rem'
              }}>
                {error}
              </div>
            )}
            {success && (
              <div style={{
                color: '#155724',
                marginBottom: '1rem',
                padding: '0.75rem',
                background: '#d4edda',
                border: '1px solid #c3e6cb',
                borderRadius: 8,
                fontSize: '0.875rem'
              }}>
                {success}
              </div>
            )}

            <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setShowAddSacrament(true);
                  setSacramentForm({ type: '', date: '', parish: '' });
                  setError('');
                  setSuccess('');
                }}
                style={{
                  background: '#CD8B3E',
                  color: 'white',
                  padding: '0.625rem 1.25rem',
                  borderRadius: 8,
                  border: 'none',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                ➕ Add Sacrament Record
              </button>
            </div>

            {sacramentHistoryLoading ? (
              <div style={{ textAlign: 'center', padding: '2rem' }}>
                <div className="spinner" style={{
                  width: 40,
                  height: 40,
                  border: '4px solid #f3f4f6',
                  borderTop: '4px solid #CD8B3E',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                  display: 'inline-block'
                }}></div>
                <p style={{ marginTop: '1rem', color: '#6b7280' }}>Loading sacrament history...</p>
              </div>
            ) : sacramentHistory.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
                <p>No sacrament records found.</p>
                <p style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>Click "Add Sacrament Record" to add one.</p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#FFF6E5', borderBottom: '2px solid #e2cfa3' }}>
                      <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 600, color: '#3F2E1E' }}>Type</th>
                      <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 600, color: '#3F2E1E' }}>Date</th>
                      <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 600, color: '#3F2E1E' }}>Parish</th>
                      <th style={{ padding: '0.75rem', textAlign: 'center', fontWeight: 600, color: '#3F2E1E' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sacramentHistory.map((sacrament) => (
                      <tr key={sacrament.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                        <td style={{ padding: '0.75rem', color: '#3F2E1E' }}>{sacrament.type}</td>
                        <td style={{ padding: '0.75rem', color: '#3F2E1E' }}>
                          {new Date(sacrament.date).toLocaleDateString()}
                        </td>
                        <td style={{ padding: '0.75rem', color: '#3F2E1E' }}>{sacrament.parish}</td>
                        <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                            <button
                              onClick={() => openEditSacramentModal(sacrament)}
                              style={{
                                background: '#f3f4f6',
                                border: 'none',
                                borderRadius: 4,
                                padding: '0.25rem 0.5rem',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}
                              title="Edit"
                            >
                              <Pencil size={16} />
                            </button>
                            <button
                              onClick={() => openDeleteSacramentModal(sacrament)}
                              style={{
                                background: '#fee2e2',
                                border: 'none',
                                borderRadius: 4,
                                padding: '0.25rem 0.5rem',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}
                              title="Delete"
                            >
                              <Trash size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add Sacrament Modal */}
      {showAddSacrament && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          backdropFilter: 'blur(5px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 4000,
          padding: '20px',
        }}>
          <div style={{
            background: '#fff',
            borderRadius: '1rem',
            boxShadow: '0 8px 32px rgba(60, 47, 30, 0.18)',
            padding: '1.5rem',
            maxWidth: '500px',
            width: '90%',
            boxSizing: 'border-box',
          }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#3F2E1E', marginBottom: '1rem' }}>
              Add Sacrament Record
            </h3>
            <form onSubmit={handleAddSacrament}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontWeight: 600, color: '#3F2E1E', marginBottom: '0.5rem' }}>
                  Type *
                </label>
                <select
                  name="type"
                  value={sacramentForm.type}
                  onChange={(e) => setSacramentForm(prev => ({ ...prev, type: e.target.value }))}
                  required
                  disabled={sacramentHistoryLoading}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    borderRadius: 8,
                    border: '1.5px solid #e2cfa3',
                    fontSize: 14,
                    color: '#3F2E1E',
                    background: '#fff',
                    boxSizing: 'border-box'
                  }}
                >
                  <option value="">Select Type</option>
                  {sacramentTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontWeight: 600, color: '#3F2E1E', marginBottom: '0.5rem' }}>
                  Date *
                </label>
                <input
                  type="date"
                  name="date"
                  value={sacramentForm.date}
                  onChange={(e) => setSacramentForm(prev => ({ ...prev, date: e.target.value }))}
                  required
                  disabled={sacramentHistoryLoading}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    borderRadius: 8,
                    border: '1.5px solid #e2cfa3',
                    fontSize: 14,
                    color: '#3F2E1E',
                    background: '#fff',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontWeight: 600, color: '#3F2E1E', marginBottom: '0.5rem' }}>
                  Parish *
                </label>
                <input
                  type="text"
                  name="parish"
                  value={sacramentForm.parish}
                  onChange={(e) => setSacramentForm(prev => ({ ...prev, parish: e.target.value }))}
                  required
                  placeholder="Parish name"
                  disabled={sacramentHistoryLoading}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    borderRadius: 8,
                    border: '1.5px solid #e2cfa3',
                    fontSize: 14,
                    color: '#3F2E1E',
                    background: '#fff',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddSacrament(false);
                    setSacramentForm({ type: '', date: '', parish: '' });
                  }}
                  disabled={sacramentHistoryLoading}
                  style={{
                    background: '#f3f4f6',
                    color: '#6c757d',
                    padding: '0.625rem 1.25rem',
                    borderRadius: 8,
                    border: 'none',
                    fontWeight: 600,
                    fontSize: '0.875rem',
                    cursor: sacramentHistoryLoading ? 'not-allowed' : 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={sacramentHistoryLoading}
                  style={{
                    background: '#CD8B3E',
                    color: 'white',
                    padding: '0.625rem 1.25rem',
                    borderRadius: 8,
                    border: 'none',
                    fontWeight: 600,
                    fontSize: '0.875rem',
                    cursor: sacramentHistoryLoading ? 'not-allowed' : 'pointer',
                    opacity: sacramentHistoryLoading ? 0.7 : 1
                  }}
                >
                  {sacramentHistoryLoading ? 'Adding...' : 'Add Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Sacrament Modal */}
      {showEditSacrament && editingSacrament && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          backdropFilter: 'blur(5px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 4000,
          padding: '20px',
        }}>
          <div style={{
            background: '#fff',
            borderRadius: '1rem',
            boxShadow: '0 8px 32px rgba(60, 47, 30, 0.18)',
            padding: '1.5rem',
            maxWidth: '500px',
            width: '90%',
            boxSizing: 'border-box',
          }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#3F2E1E', marginBottom: '1rem' }}>
              Edit Sacrament Record
            </h3>
            <form onSubmit={handleEditSacrament}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontWeight: 600, color: '#3F2E1E', marginBottom: '0.5rem' }}>
                  Type *
                </label>
                <select
                  name="type"
                  value={sacramentForm.type}
                  onChange={(e) => setSacramentForm(prev => ({ ...prev, type: e.target.value }))}
                  required
                  disabled={sacramentHistoryLoading}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    borderRadius: 8,
                    border: '1.5px solid #e2cfa3',
                    fontSize: 14,
                    color: '#3F2E1E',
                    background: '#fff',
                    boxSizing: 'border-box'
                  }}
                >
                  <option value="">Select Type</option>
                  {sacramentTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontWeight: 600, color: '#3F2E1E', marginBottom: '0.5rem' }}>
                  Date *
                </label>
                <input
                  type="date"
                  name="date"
                  value={sacramentForm.date}
                  onChange={(e) => setSacramentForm(prev => ({ ...prev, date: e.target.value }))}
                  required
                  disabled={sacramentHistoryLoading}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    borderRadius: 8,
                    border: '1.5px solid #e2cfa3',
                    fontSize: 14,
                    color: '#3F2E1E',
                    background: '#fff',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontWeight: 600, color: '#3F2E1E', marginBottom: '0.5rem' }}>
                  Parish *
                </label>
                <input
                  type="text"
                  name="parish"
                  value={sacramentForm.parish}
                  onChange={(e) => setSacramentForm(prev => ({ ...prev, parish: e.target.value }))}
                  required
                  placeholder="Parish name"
                  disabled={sacramentHistoryLoading}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    borderRadius: 8,
                    border: '1.5px solid #e2cfa3',
                    fontSize: 14,
                    color: '#3F2E1E',
                    background: '#fff',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowEditSacrament(false);
                    setEditingSacrament(null);
                    setSacramentForm({ type: '', date: '', parish: '' });
                  }}
                  disabled={sacramentHistoryLoading}
                  style={{
                    background: '#f3f4f6',
                    color: '#6c757d',
                    padding: '0.625rem 1.25rem',
                    borderRadius: 8,
                    border: 'none',
                    fontWeight: 600,
                    fontSize: '0.875rem',
                    cursor: sacramentHistoryLoading ? 'not-allowed' : 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={sacramentHistoryLoading}
                  style={{
                    background: '#CD8B3E',
                    color: 'white',
                    padding: '0.625rem 1.25rem',
                    borderRadius: 8,
                    border: 'none',
                    fontWeight: 600,
                    fontSize: '0.875rem',
                    cursor: sacramentHistoryLoading ? 'not-allowed' : 'pointer',
                    opacity: sacramentHistoryLoading ? 0.7 : 1
                  }}
                >
                  {sacramentHistoryLoading ? 'Updating...' : 'Update Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Sacrament Confirmation Modal */}
      {showDeleteSacrament && deletingSacrament && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          backdropFilter: 'blur(5px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 4000,
          padding: '20px',
        }}>
          <div style={{
            background: '#fff',
            borderRadius: '1rem',
            boxShadow: '0 8px 32px rgba(60, 47, 30, 0.18)',
            padding: '1.5rem',
            maxWidth: '400px',
            width: '90%',
            boxSizing: 'border-box',
          }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#3F2E1E', marginBottom: '1rem' }}>
              Delete Sacrament Record
            </h3>
            <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>
              Are you sure you want to delete this sacrament record?
            </p>
            <div style={{ background: '#f3f4f6', padding: '0.75rem', borderRadius: 8, marginBottom: '1.5rem' }}>
              <p style={{ margin: 0, fontWeight: 600, color: '#3F2E1E' }}>{deletingSacrament.type}</p>
              <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.875rem', color: '#6b7280' }}>
                {new Date(deletingSacrament.date).toLocaleDateString()} - {deletingSacrament.parish}
              </p>
            </div>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => {
                  setShowDeleteSacrament(false);
                  setDeletingSacrament(null);
                }}
                disabled={sacramentHistoryLoading}
                style={{
                  background: '#f3f4f6',
                  color: '#6c757d',
                  padding: '0.625rem 1.25rem',
                  borderRadius: 8,
                  border: 'none',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  cursor: sacramentHistoryLoading ? 'not-allowed' : 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteSacrament}
                disabled={sacramentHistoryLoading}
                style={{
                  background: '#ef4444',
                  color: 'white',
                  padding: '0.625rem 1.25rem',
                  borderRadius: 8,
                  border: 'none',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  cursor: sacramentHistoryLoading ? 'not-allowed' : 'pointer',
                  opacity: sacramentHistoryLoading ? 0.7 : 1
                }}
              >
                {sacramentHistoryLoading ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Popup */}
      <SuccessPopup
        isOpen={showSuccessPopup}
        onClose={() => setShowSuccessPopup(false)}
        title={successTitle}
        message={successMessage}
        duration={2500}
      />

    </div>
  );
};

export default AdminMembership;
