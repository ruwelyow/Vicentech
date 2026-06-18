import React, { useEffect, useState } from 'react';
import { Pencil, Trash, PowerOff } from 'lucide-react';
import '../../../css/AdminUsers.css';
import { smartSanitize, smartValidate, sanitizePhone, sanitizeUsername, validateEmail, validatePhone, validatePassword } from '../../utils/validation';
import axios from '../../utils/axios'; // This is actually 'api' instance

const ROLES = [
  { label: 'Parishioner', value: 'parishioner' },
  { label: 'Staff', value: 'staff' },
  { label: 'Admin', value: 'admin' },
  { label: 'Priest', value: 'priest' },
];

const FILTERS = [
  { label: 'All', value: 'all' },
  ...ROLES,
];

const initialForm = {
  first_name: '',
  middle_name: '',
  last_name: '',
  suffix: '',
  email: '',
  username: '',
  password: '',
  password_confirmation: '',
  Sex: 'male',
  address: '',
  phone: '',
  birthdate: '',
  role: '',
};

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [guestVisits, setGuestVisits] = useState([]);
  const [guestVisitsLoading, setGuestVisitsLoading] = useState(true);
  const [guestPage, setGuestPage] = useState(1);
  const guestVisitsPerPage = 10;
  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showActivateConfirm, setShowActivateConfirm] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [editUser, setEditUser] = useState(null);
  const [deleteUser, setDeleteUser] = useState(null);
  const [activateUser, setActivateUser] = useState(null);
  const [deactivating, setDeactivating] = useState(false);
  const [activating, setActivating] = useState(false);
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [addLoading, setAddLoading] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({
    first_name: null,
    middle_name: null,
    last_name: null,
    suffix: null
  });
  const [birthdateError, setBirthdateError] = useState(null);
  const [showPasswordReqs, setShowPasswordReqs] = useState(false);
  const [isCheckingName, setIsCheckingName] = useState(false);
  const [nameAvailable, setNameAvailable] = useState(null); // true = available, false = exists, null = unchecked/unknown
  const [nameError, setNameError] = useState(null);
  
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
  const passwordChecks = passwordRequirements.map(req => req.test(form.password));
  const allPasswordValid = passwordChecks.every(Boolean);
  const passwordsMatch = form.password && form.password === form.password_confirmation;
  
  // Calculate age from birthdate
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
  
  // Allow only letters, spaces, and periods on keydown; permit navigation and editing keys
  const allowLettersOnlyKeyDown = (e) => {
    const allowedControlKeys = [
      'Backspace', 'Delete', 'Tab', 'Enter', 'Escape', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'
    ];
    const isCtrlMeta = e.ctrlKey || e.metaKey;
    // Allow common shortcuts (copy, paste, cut, select all, undo/redo)
    if (isCtrlMeta && ['a','c','v','x','z','y'].includes(e.key.toLowerCase())) {
      return;
    }
    if (allowedControlKeys.includes(e.key)) {
      return;
    }
    // Allow space and period
    if (e.key === ' ' || e.key === '.') {
      return;
    }
    // Allow letters A-Z only
    if (!/^[a-zA-Z]$/.test(e.key)) {
      e.preventDefault();
    }
  };
  
  // Sanitize pasted content to letters, spaces, and periods only
  const handleNamePaste = (e) => {
    e.preventDefault();
    const pasted = (e.clipboardData || window.clipboardData).getData('text');
    const cleaned = pasted.replace(/[^a-zA-Z\s.]/g, '');
    const target = e.target;
    const { selectionStart, selectionEnd, value } = target;
    const newValue = value.slice(0, selectionStart) + cleaned + value.slice(selectionEnd);
    const name = target.name;
    setForm(prev => ({ ...prev, [name]: newValue }));
  };
  
  const validateBirthdate = (birthdate) => {
    if (!birthdate) {
      setBirthdateError(null);
      return;
    }

    // Check if the date string is valid
    const selectedDate = new Date(birthdate);
    if (isNaN(selectedDate.getTime())) {
      setBirthdateError("Invalid date format");
      return;
    }

    const today = new Date();
    
    // Reset time to compare only dates
    today.setHours(0, 0, 0, 0);
    selectedDate.setHours(0, 0, 0, 0);

    // Check if date is today or in the future
    if (selectedDate >= today) {
      setBirthdateError("Cannot select present day or future dates");
      return;
    }

    // Validate minimum age of 10 years
    const calculatedAge = calculateAge(birthdate);
    if (calculatedAge !== null && calculatedAge !== '' && calculatedAge < 10) {
      setBirthdateError('Minimum age requirement is 10 years old. Your age is ' + calculatedAge + ' years.');
      return;
    }

    // If all validations pass, clear error
    setBirthdateError(null);
  };

  // Check if the full name already exists using separate fields
  const checkNameAvailability = async (payload) => {
    // Build a payload from separate fields
    let reqBody = {};
    const maybe = (v) => (v && v.trim().length > 0 ? v.trim() : undefined);
    const normalizeSuffix = (s) => s ? s.replace(/\./g, '').trim() : s;
    
    if (payload && (payload.first_name || payload.last_name)) {
      reqBody = {
        ...(maybe(payload.first_name) ? { first_name: maybe(payload.first_name) } : {}),
        ...(maybe(payload.middle_name) ? { middle_name: maybe(payload.middle_name) } : {}),
        ...(maybe(payload.last_name) ? { last_name: maybe(payload.last_name) } : {}),
        ...(maybe(payload.suffix) ? { suffix: normalizeSuffix(maybe(payload.suffix)) } : {}),
      };
      
      // Also include a combined `name` string
      const fVal = maybe(payload.first_name) || '';
      const mVal = maybe(payload.middle_name) || '';
      const lVal = maybe(payload.last_name) || '';
      const sRaw = maybe(payload.suffix);
      const sVal = sRaw ? normalizeSuffix(sRaw) : '';
      const nameParts = [];
      if (fVal) nameParts.push(fVal);
      if (mVal) nameParts.push(mVal);
      if (lVal) nameParts.push(lVal);
      if (sVal) nameParts.push(sVal);
      const combinedName = nameParts.join(' ').trim();
      if (combinedName) reqBody.name = combinedName;
    } else {
      setNameError(null);
      setNameAvailable(null);
      return;
    }

    setIsCheckingName(true);
    setNameError(null);
    try {
      // If a suffix was provided, perform two checks: with-suffix and without-suffix
      if (reqBody.suffix) {
        const reqWith = { ...reqBody };
        const reqWithout = { ...reqBody };
        delete reqWithout.suffix;
        if (reqWith.name) {
          const parts = reqWith.name.split(' ').map(p => p.trim()).filter(Boolean);
          const normalizedSuffix = reqWith.suffix && String(reqWith.suffix).trim();
          if (normalizedSuffix && parts[parts.length - 1] && parts[parts.length - 1].toLowerCase() === normalizedSuffix.toLowerCase()) {
            parts.pop();
            reqWithout.name = parts.join(' ').trim();
          }
        }

        const [respWith, respWithout] = await Promise.all([
          axios.post('/check-name', reqWith).catch(e => ({ error: e })),
          axios.post('/check-name', reqWithout).catch(e => ({ error: e })),
        ]);

        const withExists = respWith && respWith.data && typeof respWith.data.exists !== 'undefined' ? respWith.data.exists : null;
        const withoutExists = respWithout && respWithout.data && typeof respWithout.data.exists !== 'undefined' ? respWithout.data.exists : null;

        if (withExists === true) {
          setNameAvailable(false);
          setNameError('Full name already registered');
          return true;
        }

        if (withExists === false && withoutExists === true) {
          setNameAvailable(true);
          setNameError(null);
          return false;
        }

        if (withoutExists === true) {
          setNameAvailable(false);
          setNameError('Full name already registered');
          return true;
        }

        if (withExists === false || withoutExists === false) {
          setNameAvailable(true);
          setNameError(null);
          return false;
        }

        setNameAvailable(null);
        setNameError('Could not validate name');
        return null;
      }

      // No suffix provided — single request is sufficient
      const resp = await axios.post('/check-name', reqBody);
      if (resp && resp.data && typeof resp.data.exists !== 'undefined') {
        if (resp.data.exists) {
          setNameAvailable(false);
          setNameError('Full name already registered');
        } else {
          setNameAvailable(true);
          setNameError(null);
        }
        return resp.data.exists;
      } else {
        setNameAvailable(null);
        setNameError('Could not validate name');
        return null;
      }
    } catch (err) {
      console.error('Error checking name availability:', err);
      setNameAvailable(null);
      setNameError('Could not validate name (network or server error)');
      throw err;
    } finally {
      setIsCheckingName(false);
    }
  };

  // Trigger name availability checks when the user has entered first and last name
  const shouldCheckName = () => {
    const f = form.first_name?.trim();
    const l = form.last_name?.trim();
    return !!(f && l);
  };
  const [userPage, setUserPage] = useState(1);
  const usersPerPage = 10;

  useEffect(() => {
    fetch('http://localhost:8000/sanctum/csrf-cookie', {
      credentials: 'include'
    });
  }, []);

  const fetchUsers = () => {
    setLoading(true);
    fetch('/api/all-users')
      .then(res => res.json())
      .then(data => {
        console.log('Fetched users data:', data); // Debug log
        setUsers(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  const fetchGuestVisits = () => {
    setGuestVisitsLoading(true);
    fetch(`/api/admin/guest-visits?all=true`, { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        // Get all records for client-side pagination
        const items = Array.isArray(data) ? data : [];
        setGuestVisits(items);
        setGuestVisitsLoading(false);
        // Reset to page 1 when data is loaded
        setGuestPage(1);
      })
      .catch(() => setGuestVisitsLoading(false));
  };

  useEffect(() => {
    fetchUsers();
    fetchGuestVisits();
  }, []);

  // Validate birthdate whenever it changes
  useEffect(() => {
    if (form.birthdate) {
      validateBirthdate(form.birthdate);
    } else {
      setBirthdateError(null);
    }
  }, [form.birthdate]);

  // Client-side pagination for guest visits
  const guestVisitsLastPage = Math.max(1, Math.ceil(guestVisits.length / guestVisitsPerPage));
  const paginatedGuestVisits = guestVisits.slice(
    (guestPage - 1) * guestVisitsPerPage,
    guestPage * guestVisitsPerPage
  );

  // Helper function to check if user is deactivated
  const isUserDeactivated = (user) => {
    return user.status === 'inactive';
  };

  const filteredUsers = users.filter(user => {
    if (roleFilter === 'all') return true;
    if (roleFilter === 'admin') return user.is_admin;
    if (roleFilter === 'staff') return user.is_staff;
    if (roleFilter === 'priest') return user.is_priest;
    if (roleFilter === 'parishioner') return !user.is_admin && !user.is_staff && !user.is_priest;
    return true;
  });

  const userLastPage = Math.max(1, Math.ceil(filteredUsers.length / usersPerPage));
  const paginatedUsers = filteredUsers.slice((userPage - 1) * usersPerPage, userPage * usersPerPage);

  if (loading) return <div className="loading-users">Loading users...</div>;

  // Responsive styles
  const containerStyle = {
    margin: '1.5rem auto',
    padding: '1.5rem',
    maxWidth: '100%',
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
    maxWidth: '1200px',
    marginLeft: 'auto',
    marginRight: 'auto',
    width: '100%',
    boxSizing: 'border-box',
  };

  const tableWrapperStyle = {
    background: 'white',
    borderRadius: '0.75rem',
    border: '1.5px solid #f2e4ce',
    boxShadow: '0 4px 12px rgba(60, 47, 30, 0.08)',
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
    zIndex: 3000,
    padding: '20px',
    overflowY: 'auto',
  };

  const modalContentStyle = {
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
  };

  // Handle form input changes with sanitization
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    // Get label text if available
    const label = e.target.previousElementSibling?.textContent || e.target.closest('label')?.textContent || '';
    let newValue = value;
    
    // For phone field, only allow numbers and limit to 11 digits
    if (name === 'phone') {
      newValue = value.replace(/[^0-9]/g, '').slice(0, 11);
    }
    // For name fields, use smart sanitize (letters, spaces, and periods)
    else if (['first_name', 'middle_name', 'last_name', 'suffix'].includes(name)) {
      newValue = smartSanitize(value, name, label);
      
      // Clear any previous errors since invalid characters are now filtered out
      setFieldErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
    // For email fields, don't sanitize during typing - let user type freely
    else if (name === 'email') {
      newValue = value; // No sanitization for email during typing
    }
    // For address fields, use smart sanitize
    else if (name === 'address') {
      newValue = smartSanitize(value, name, label);
    }
    // For username
    else if (name === 'username') {
      newValue = sanitizeUsername(value);
    }
    // For other fields, use smart sanitize as well
    else {
      newValue = smartSanitize(value, name, label);
    }
    
    setForm(prev => ({ ...prev, [name]: newValue }));
    
    // Validate birthdate in real-time (validate with the new value directly)
    if (name === 'birthdate') {
      validateBirthdate(newValue);
    }
  };

  // Handle add user submit
  const handleAddUser = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setAddLoading(false); // Ensure loading is false at start

    // Clear previous field errors
    setFieldErrors({
      first_name: null,
      middle_name: null,
      last_name: null,
      suffix: null
    });

    // Prevent submission if name already exists
    if (nameAvailable === false) {
      setError('A user with that full name already exists. Please verify the name or add a suffix.');
      return;
    }

    // Validate name fields and set field errors
    const firstNameCheck = smartValidate(form.first_name, 'first_name', 'First Name');
    if (!firstNameCheck.valid) {
      setFieldErrors(prev => ({ ...prev, first_name: firstNameCheck.reason || 'Invalid first name' }));
      setError(firstNameCheck.reason || 'Please fix the errors in the form');
      return;
    }

    const lastNameCheck = smartValidate(form.last_name, 'last_name', 'Last Name');
    if (!lastNameCheck.valid) {
      setFieldErrors(prev => ({ ...prev, last_name: lastNameCheck.reason || 'Invalid last name' }));
      setError(lastNameCheck.reason || 'Please fix the errors in the form');
      return;
    }

    if (form.middle_name && form.middle_name.trim()) {
      const middleNameCheck = smartValidate(form.middle_name, 'middle_name', 'Middle Name');
      if (!middleNameCheck.valid) {
        setFieldErrors(prev => ({ ...prev, middle_name: middleNameCheck.reason || 'Invalid middle name' }));
        setError(middleNameCheck.reason || 'Please fix the errors in the form');
        return;
      }
    }

    if (form.suffix && form.suffix.trim()) {
      // Suffix validation - allow letters and periods only
      const suffixCheck = smartValidate(form.suffix, 'suffix', 'Suffix');
      if (!suffixCheck.valid) {
        setFieldErrors(prev => ({ ...prev, suffix: suffixCheck.reason || 'Invalid suffix' }));
        setError(suffixCheck.reason || 'Please fix the errors in the form');
        return;
      }
    }

    // Validate birthdate - check if it's set and valid
    if (!form.birthdate) {
      setError('Birthdate is required');
      return;
    }
    
    // Re-validate birthdate on submit - validate directly (don't rely on async state)
    const selectedDate = new Date(form.birthdate);
    
    // Check if date is valid
    if (isNaN(selectedDate.getTime())) {
      setBirthdateError("Invalid date format");
      setError('Please select a valid birth date.');
      setAddLoading(false);
      return;
    }
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    selectedDate.setHours(0, 0, 0, 0);
    
    // Check if date is today or in the future
    if (selectedDate >= today) {
      setBirthdateError("Cannot select present day or future dates");
      setError('Please select a valid birth date (cannot be present day or future dates).');
      setAddLoading(false);
      return;
    }

    // Validate minimum age of 10 years
    const calculatedAge = calculateAge(form.birthdate);
    if (calculatedAge !== null && calculatedAge !== '' && calculatedAge < 10) {
      setBirthdateError('Minimum age requirement is 10 years old. Your age is ' + calculatedAge + ' years.');
      setError('Minimum age requirement is 10 years old. Your age is ' + calculatedAge + ' years.');
      setAddLoading(false);
      return;
    }
    
    // Also check if there's already a birthdateError state (from real-time validation)
    if (birthdateError) {
      setError(birthdateError || 'Please select a valid birth date.');
      setAddLoading(false);
      return;
    }

    // Validate address
    const addressCheck = smartValidate(form.address, 'address', 'Complete Address');
    if (!addressCheck.valid) {
      setError(addressCheck.reason || 'Invalid address');
      return;
    }

    const emailCheck = validateEmail(form.email);
    if (!emailCheck.valid) { 
      setError(emailCheck.reason); 
      return; 
    }

    const passCheck = validatePassword(form.password);
    if (!passCheck.valid) { 
      setError(passCheck.reason); 
      return; 
    }

    const phoneCheck = validatePhone(form.phone);
    if (!phoneCheck.valid) { 
      setError(phoneCheck.reason); 
      return; 
    }

    setAddLoading(true);
    // Build submission payload to match backend (separate fields supported)
    const maybe = (v) => (v && v.trim().length > 0 ? v.trim() : undefined);
    const payload = {
      ...(maybe(form.first_name) ? { first_name: maybe(form.first_name) } : {}),
      ...(maybe(form.middle_name) ? { middle_name: maybe(form.middle_name) } : {}),
      ...(maybe(form.last_name) ? { last_name: maybe(form.last_name) } : {}),
      ...(maybe(form.suffix) ? { suffix: maybe(form.suffix) } : {}),
      email: form.email,
      password: form.password,
      password_confirmation: form.password_confirmation,
      phone: form.phone,
      gender: form.Sex,
      birthdate: form.birthdate,
      address: form.address,
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
        // Laravel validation errors
        if (data.errors) {
          setError(Object.values(data.errors).map(arr => arr.join(' ')).join('\n'));
        } else {
          setError(data.message || 'Failed to add user.');
        }
      } else {
        setSuccess('User added successfully!');
        setShowAdd(false);
        setForm(initialForm);
        setNameAvailable(null);
        setNameError(null);
        setIsCheckingName(false);
        setFieldErrors({
          first_name: null,
          middle_name: null,
          last_name: null,
          suffix: null
        });
        setBirthdateError(null);
        fetchUsers();
      }
    } catch (err) {
      setError('Network error.');
    }
    setAddLoading(false);
  };

  // Handle edit user submit
  const handleEditUser = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Client-side validation
    const nameCheck = smartValidate(form.name, 'name', 'Name');
    if (!nameCheck.valid) { setError(nameCheck.reason || 'Invalid name'); return; }

    const emailCheck = validateEmail(form.email);
    if (!emailCheck.valid) { setError(emailCheck.reason); return; }

    const phoneCheck = validatePhone(form.phone);
    if (!phoneCheck.valid) { setError(phoneCheck.reason); return; }

    const addressCheck = smartValidate(form.address, 'address', 'Address');
    if (!addressCheck.valid) { setError(addressCheck.reason || 'Invalid address'); return; }

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
      is_priest: form.role === 'priest'
    };

    // Only include password if it's provided
    if (form.password) {
      const passCheck = validatePassword(form.password);
      if (!passCheck.valid) { setError(passCheck.reason); setEditLoading(false); return; }
      payload.password = form.password;
      payload.password_confirmation = form.password_confirmation;
    }

    try {
      const res = await fetch(`/api/users/${editUser.id}`, {
        method: 'PUT',
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

  // Handle deactivate user
  const handleDeactivateUser = () => {
    setShowDeleteConfirm(true);
  };

  const confirmDeactivate = async () => {
    setError('');
    setSuccess('');
    setDeactivating(true);
    
    console.log('Deactivating user:', deleteUser); // Debug log
    
    try {
      // Try using the existing delete endpoint but with a deactivate flag
      const requestBody = {
        status: 'inactive',
        deactivate: true
      };
      console.log('Sending deactivation request:', requestBody); // Debug log
      
      const res = await fetch(`/api/users/${deleteUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(requestBody),
      });
      
      console.log('Deactivation response status:', res.status); // Debug log
      const data = await res.json();
      console.log('Deactivation response data:', data); // Debug log
      
      if (!res.ok) {
        setError(data.message || 'Failed to deactivate user.');
      } else {
        setSuccess('User account deactivated successfully!');
        setShowDelete(false);
        setDeleteUser(null);
        
        // Update the user in the local state immediately
        setUsers(prevUsers => 
          prevUsers.map(user => 
            user.id === deleteUser.id 
              ? { ...user, status: 'inactive' }
              : user
          )
        );
        
        // Dispatch deactivation event to notify logged-in users
        const eventDetail = { 
          userId: deleteUser.id,
          userName: deleteUser.name,
          deactivatedAt: new Date().toISOString()
        };
        console.log('AdminUsers: Dispatching userDeactivated event:', eventDetail);
        window.dispatchEvent(new CustomEvent('userDeactivated', { 
          detail: eventDetail
        }));
        
        // Also fetch fresh data from server
        fetchUsers();
      }
    } catch (err) {
      console.error('Deactivation error:', err); // Debug log
      setError('Network error.');
    }
    setDeactivating(false);
    setShowDeleteConfirm(false);
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(false);
  };

  // Handle activate user - show confirmation first
  const handleActivateUser = (user) => {
    setActivateUser(user);
    setShowActivateConfirm(true);
    setError('');
    setSuccess('');
  };

  // Confirm activate user
  const confirmActivate = async () => {
    setError('');
    setSuccess('');
    setActivating(true);
    
    try {
      const res = await fetch(`/api/users/${activateUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          status: 'active',
          activate: true
        }),
      });
      const data = await res.json();
      console.log('Activation response:', data); // Debug log
      if (!res.ok) {
        setError(data.message || 'Failed to activate user.');
      } else {
        setSuccess('User account activated successfully!');
        
        // Update the user in the local state immediately
        setUsers(prevUsers => 
          prevUsers.map(u => 
            u.id === activateUser.id 
              ? { ...u, status: 'active' }
              : u
          )
        );
        
        // Also fetch fresh data from server
        fetchUsers();
      }
    } catch (err) {
      setError('Network error.');
    }
    setActivating(false);
    setShowActivateConfirm(false);
    setActivateUser(null);
  };

  // Cancel activate
  const cancelActivate = () => {
    setShowActivateConfirm(false);
    setActivateUser(null);
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
      birthdate: user.birthdate || '1990-01-01',
      role: user.is_admin ? 'admin' : user.is_staff ? 'staff' : user.is_priest ? 'priest' : 'parishioner',
    });
    setShowEdit(true);
    setError('');
    setSuccess('');
  };

  // Open deactivate modal
  const openDeactivate = (user) => {
    setDeleteUser(user);
    setShowDelete(true);
    setError('');
    setSuccess('');
  };

  return (
    <>
      {/* Deactivate Confirmation Modal */}
      {showDeleteConfirm && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(0,0,0,0.5)',
          zIndex: 10000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <div style={{
            background: 'white',
            borderRadius: 12,
            padding: '2rem',
            maxWidth: 500,
            width: '90%',
            textAlign: 'center',
            boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚠️</div>
            <h3 style={{ color: '#dc2626', marginBottom: '1rem', fontSize: '1.5rem', fontWeight: '700' }}>
              Deactivate Account
            </h3>
            <p style={{ color: '#374151', marginBottom: '1rem', lineHeight: 1.6, fontSize: '16px' }}>
              Are you sure you want to deactivate <strong>{deleteUser?.name}</strong>'s account?
            </p>
            <div style={{background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '1rem', marginBottom: '1.5rem'}}>
              <p style={{color: '#dc2626', fontSize: '14px', margin: 0, fontWeight: '500'}}>
                <strong>Warning:</strong> This action will:
              </p>
              <ul style={{color: '#dc2626', fontSize: '14px', margin: '0.5rem 0 0 1rem', padding: 0, textAlign: 'left'}}>
                <li>Deactivate the user's account immediately</li>
                <li>Prevent the user from logging in</li>
                <li>Keep all user data intact</li>
                <li>Require admin approval to reactivate</li>
              </ul>
            </div>
            <p style={{ color: '#6b7280', fontSize: '14px', margin: 0 }}>
              This action can be reversed by an admin if needed.
            </p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '1.5rem' }}>
              <button
                onClick={cancelDelete}
                disabled={deactivating}
                style={{
                  background: '#f8f9fa',
                  color: '#6c757d',
                  border: '1px solid #dee2e6',
                  borderRadius: 8,
                  padding: '0.75rem 1.5rem',
                  fontWeight: 600,
                  cursor: deactivating ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                Cancel
              </button>
              <button
                onClick={confirmDeactivate}
                disabled={deactivating}
                style={{
                  background: deactivating ? '#9ca3af' : '#dc2626',
                  color: 'white',
                  border: 'none',
                  borderRadius: 8,
                  padding: '0.75rem 1.5rem',
                  fontWeight: 600,
                  cursor: deactivating ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                {deactivating ? 'Deactivating...' : 'Yes, Deactivate Account'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Activate Confirmation Modal */}
      {showActivateConfirm && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(0,0,0,0.5)',
          zIndex: 10000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <div style={{
            background: 'white',
            borderRadius: 12,
            padding: '2rem',
            maxWidth: 500,
            width: '90%',
            textAlign: 'center',
            boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✅</div>
            <h3 style={{ color: '#16a34a', marginBottom: '1rem', fontSize: '1.5rem', fontWeight: '700' }}>
              Activate Account
            </h3>
            <p style={{ color: '#374151', marginBottom: '1rem', lineHeight: 1.6, fontSize: '16px' }}>
              Are you sure you want to activate <strong>{activateUser?.name}</strong>'s account?
            </p>
            <div style={{background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '1rem', marginBottom: '1.5rem'}}>
              <p style={{color: '#16a34a', fontSize: '14px', margin: 0, fontWeight: '500'}}>
                <strong>This action will:</strong>
              </p>
              <ul style={{color: '#16a34a', fontSize: '14px', margin: '0.5rem 0 0 1rem', padding: 0, textAlign: 'left'}}>
                <li>Reactivate the user's account immediately</li>
                <li>Allow the user to log in again</li>
                <li>Restore full access to the system</li>
                <li>Keep all user data intact</li>
              </ul>
            </div>
            <p style={{ color: '#6b7280', fontSize: '14px', margin: 0 }}>
              The user will be able to access their account immediately after activation.
            </p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '1.5rem' }}>
              <button
                onClick={cancelActivate}
                disabled={activating}
                style={{
                  background: '#f8f9fa',
                  color: '#6c757d',
                  border: '1px solid #dee2e6',
                  borderRadius: 8,
                  padding: '0.75rem 1.5rem',
                  fontWeight: 600,
                  cursor: activating ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                Cancel
              </button>
              <button
                onClick={confirmActivate}
                disabled={activating}
                style={{
                  background: activating ? '#9ca3af' : '#16a34a',
                  color: 'white',
                  border: 'none',
                  borderRadius: 8,
                  padding: '0.75rem 1.5rem',
                  fontWeight: 600,
                  cursor: activating ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                {activating ? 'Activating...' : 'Yes, Activate Account'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="sacraments-container responsive-admin-users" style={{ ...containerStyle, maxWidth: 1200, minHeight: '100vh', padding: '1.5rem', margin: '0 auto', overflowX: 'auto' }}>
      <style>{`
        @media (max-width: 600px) {
          .responsive-admin-users {
            width: 95vw !important;
            max-width: 100vw !important;
            margin-left: auto !important;
            margin-right: auto !important;
            padding-left: 1rem !important;
            padding-right: 1rem !important;
          }
        }
      `}</style>
      <style>{`
        @media (max-width: 600px) {
          .responsive-admin-users {
            width: 95vw !important;
            max-width: 100vw !important;
            margin-left: auto !important;
            margin-right: auto !important;
            padding-left: 1rem !important;
            padding-right: 1rem !important;
          }
        }
      `}</style>
      {error && <div className="error-msg" style={{ whiteSpace: 'pre-line' }}>{error}</div>}
      {success && <div className="success-msg">{success}</div>}

      <div className="sacraments-header" style={headerStyle}>
        <h1 className="sacraments-title" style={{ fontSize: '2rem', width: '100%' }}>Manage Users</h1>
        <div className="filter-bar" style={filterBarStyle}>
          <label htmlFor="roleFilter" style={{ marginRight: '8px', fontWeight: 600, color: '#3F2E1E' }}>Filter by Role:</label>
          <select id="roleFilter" value={roleFilter} onChange={e => setRoleFilter(e.target.value)} style={{ padding: '6px 12px', borderRadius: 6, border: '1.5px solid #e2cfa3', fontSize: 14, color: '#3F2E1E', background: '#fff', minWidth: 120 }}>
            {FILTERS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
          </select>
          <button
            onClick={() => { setShowAdd(true); setForm(initialForm); setError(''); setSuccess(''); }}
            className="add-btn management-btn primary"
            style={{ minHeight: 44, fontWeight: 600, fontSize: '0.95rem', borderRadius: '0.5rem', boxShadow: '0 2px 4px rgba(205, 139, 62, 0.1)', background: '#CD8B3E', color: 'white', padding: '0.625rem 1rem', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', maxWidth: 180 }}
          >
            + Add Account
          </button>
        </div>
      </div>

      <div className="user-table-wrapper" style={tableWrapperStyle}>
        <div style={{ width: '100%' }}>
          <table className="user-table responsive-table" style={{ ...tableStyle, fontSize: '0.95rem', minWidth: 500 }}>
            <thead>
              <tr style={{ background: '#f9f6f2' }}>
                <th style={{ padding: '0.5rem', minWidth: 40 }}>#</th>
                <th style={{ padding: '0.5rem', minWidth: 120 }}>Name</th>
                <th style={{ padding: '0.5rem', minWidth: 140 }}>Email</th>
                <th style={{ padding: '0.5rem', minWidth: 80 }}>Sex</th>
                <th style={{ padding: '0.5rem', minWidth: 120 }}>Address</th>
                <th style={{ padding: '0.5rem', minWidth: 80 }}>Role</th>
                <th style={{ padding: '0.5rem', minWidth: 100 }}>Status</th>
                <th style={{ padding: '0.5rem', minWidth: 120 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '1rem' }}>No users found.</td>
                </tr>
              )}
              {paginatedUsers.map((user, idx) => (
                <tr key={user.id} style={{ borderBottom: '1px solid #f2e4ce', opacity: isUserDeactivated(user) ? 0.7 : 1 }}>
                  <td style={{ padding: '0.5rem' }}>{(userPage - 1) * usersPerPage + idx + 1}</td>
                  <td style={{ padding: '0.5rem', wordBreak: 'break-word' }}>{user.name}</td>
                  <td style={{ padding: '0.5rem', wordBreak: 'break-word' }}>{user.email}</td>
                  <td style={{ padding: '0.5rem' }}>{user.Sex || user.gender}</td>
                  <td style={{ padding: '0.5rem', wordBreak: 'break-word' }}>{user.address}</td>
                  <td style={{ padding: '0.5rem' }}>{user.is_admin ? 'Admin' : user.is_staff ? 'Staff' : user.is_priest ? 'Priest' : 'Parishioner'}</td>
                  <td style={{ padding: '0.5rem' }}>
                    <span style={{
                      padding: '0.25rem 0.5rem',
                      borderRadius: '12px',
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      background: isUserDeactivated(user) ? '#fef2f2' : '#f0fdf4',
                      color: isUserDeactivated(user) ? '#dc2626' : '#16a34a',
                      border: `1px solid ${isUserDeactivated(user) ? '#fecaca' : '#bbf7d0'}`
                    }}>
                      {isUserDeactivated(user) ? 'Deactivated' : 'Active'}
                    </span>
                  </td>
                  <td style={{ padding: '0.5rem' }}>
                    <div className="flex gap-2" style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <button
                        onClick={() => openEdit(user)}
                        className="text-blue-600 hover:text-blue-800 cursor-pointer"
                        style={{ minWidth: 32, minHeight: 32, borderRadius: 6, background: '#f2f2f2', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        title="Edit User"
                      >
                        <Pencil size={18} />
                      </button>
                      {isUserDeactivated(user) ? (
                        <button
                          onClick={() => handleActivateUser(user)}
                          disabled={activating}
                          className="text-green-600 hover:text-green-800 cursor-pointer"
                          style={{ 
                            minWidth: 32, 
                            minHeight: 32, 
                            borderRadius: 6, 
                            background: '#f0fdf4', 
                            border: '1px solid #bbf7d0', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            opacity: activating ? 0.5 : 1
                          }}
                          title="Activate Account"
                        >
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M9 12l2 2l4-4"/>
                            <circle cx="12" cy="12" r="9"/>
                          </svg>
                        </button>
                      ) : (
                        <button
                          onClick={() => openDeactivate(user)}
                          className="text-red-600 hover:text-red-800 cursor-pointer"
                          style={{ minWidth: 32, minHeight: 32, borderRadius: 6, background: '#f2f2f2', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          title="Deactivate Account"
                        >
                          <PowerOff size={18} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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

      {/* Guest Cookie Consents */}
      <div className="user-table-wrapper" style={{ ...tableWrapperStyle, marginTop: '2rem' }}>
        <div style={{ 
          background: 'rgb(205, 139, 62)', 
          borderRadius: '1rem 1rem 0 0', 
          padding: '1.5rem 2rem', 
          margin: '-1rem -1rem 1rem -1rem',
          color: 'white',
          textAlign: 'left',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{
            position: 'absolute',
            top: '-50%',
            right: '-20%',
            width: '100px',
            height: '100px',
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '50%',
            transform: 'rotate(45deg)'
          }}></div>
          <div style={{
            position: 'absolute',
            bottom: '-30%',
            left: '-10%',
            width: '80px',
            height: '80px',
            background: 'rgba(255, 255, 255, 0.08)',
            borderRadius: '50%',
            transform: 'rotate(-30deg)'
          }}></div>
          <h2 style={{ 
            fontSize: '1.5rem', 
            fontWeight: '800', 
            margin: '0',
            textShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
            position: 'relative',
            zIndex: 1
          }}>
          Guest Cookie Consents
          </h2>
          
        </div>
        <div style={{ padding: '1rem' }}>
          {guestVisitsLoading ? (
            <div style={{ padding: '0.75rem' }}>Loading guest visits...</div>
          ) : (
            <div style={{ width: '100%' }}>
              <table className="user-table responsive-table" style={{ ...tableStyle, fontSize: '0.9rem', minWidth: 1000 }}>
                <thead>
                  <tr style={{ background: '#f9f6f2' }}>
                    <th style={{ padding: '0.5rem', minWidth: 160 }}>Visit Start</th>
                    <th style={{ padding: '0.5rem', minWidth: 160 }}>Visit End</th>
                    <th style={{ padding: '0.5rem', minWidth: 100 }}>Duration</th>
                    <th style={{ padding: '0.5rem', minWidth: 120 }}>IP Address</th>
                    <th style={{ padding: '0.5rem', minWidth: 200 }}>Pages Viewed</th>
                    <th style={{ padding: '0.5rem', minWidth: 200 }}>Cookie ID</th>
                  </tr>
                </thead>
                <tbody>
                  {guestVisits.length === 0 && (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', padding: '1rem' }}>No guest consents found.</td>
                    </tr>
                  )}
                  {paginatedGuestVisits.map((v, idx) => {
                    const formatDuration = (seconds) => {
                      if (!seconds) return '-';
                      const hours = Math.floor(seconds / 3600);
                      const minutes = Math.floor((seconds % 3600) / 60);
                      const secs = seconds % 60;
                      if (hours > 0) {
                        return `${hours}h ${minutes}m ${secs}s`;
                      } else if (minutes > 0) {
                        return `${minutes}m ${secs}s`;
                      } else {
                        return `${secs}s`;
                      }
                    };

                    const formatPagesViewed = (pages) => {
                      if (!pages || !Array.isArray(pages) || pages.length === 0) return '-';
                      if (pages.length === 1) return pages[0];
                      return `${pages.length} pages (${pages.slice(0, 2).join(', ')}${pages.length > 2 ? '...' : ''})`;
                    };

                    return (
                      <tr key={v.id} style={{ borderBottom: '1px solid #f2e4ce' }}>
                        <td style={{ padding: '0.5rem', whiteSpace: 'nowrap' }}>
                          {v.visit_start ? new Date(v.visit_start).toLocaleString() : (v.accepted_at || v.created_at)}
                        </td>
                        <td style={{ padding: '0.5rem', whiteSpace: 'nowrap' }}>
                          {v.visit_end ? new Date(v.visit_end).toLocaleString() : '-'}
                        </td>
                        <td style={{ padding: '0.5rem', whiteSpace: 'nowrap' }}>
                          {formatDuration(v.session_duration)}
                        </td>
                        <td style={{ padding: '0.5rem' }}>{v.ip_address || '-'}</td>
                        <td style={{ padding: '0.5rem', wordBreak: 'break-word' }} title={Array.isArray(v.pages_viewed) ? v.pages_viewed.join(', ') : ''}>
                          {formatPagesViewed(v.pages_viewed)}
                        </td>
                        <td style={{ padding: '0.5rem', wordBreak: 'break-word', fontFamily: 'monospace' }}>{v.cookie_id}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem', flexWrap: 'wrap' }}>
                <div style={{ fontSize: '0.9rem', color: '#3F2E1E' }}>
                  Showing {guestVisits.length === 0 ? 0 : (guestPage - 1) * guestVisitsPerPage + 1} to {Math.min(guestPage * guestVisitsPerPage, guestVisits.length)} of {guestVisits.length} entries
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <button
                    onClick={() => { if (guestPage > 1) setGuestPage(guestPage - 1); }}
                    disabled={guestPage <= 1}
                    style={{ 
                      padding: '0.4rem 0.8rem', 
                      borderRadius: 6, 
                      border: '1px solid #e2cfa3', 
                      background: guestPage <= 1 ? '#f5f5f5' : '#fff', 
                      color: guestPage <= 1 ? '#999' : '#3F2E1E',
                      cursor: guestPage <= 1 ? 'not-allowed' : 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >Previous</button>
                  <span style={{ fontSize: '0.9rem', color: '#3F2E1E', minWidth: '100px', textAlign: 'center' }}>
                    Page {guestPage} of {guestVisitsLastPage}
                  </span>
                  <button
                    onClick={() => { if (guestPage < guestVisitsLastPage) setGuestPage(guestPage + 1); }}
                    disabled={guestPage >= guestVisitsLastPage}
                    style={{ 
                      padding: '0.4rem 0.8rem', 
                      borderRadius: 6, 
                      border: '1px solid #e2cfa3', 
                      background: guestPage >= guestVisitsLastPage ? '#f5f5f5' : '#fff', 
                      color: guestPage >= guestVisitsLastPage ? '#999' : '#3F2E1E',
                      cursor: guestPage >= guestVisitsLastPage ? 'not-allowed' : 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >Next</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add User Modal */}
      {showAdd && (
        <div style={modalStyle}>
          <div style={modalContentStyle}>
            <div style={{ 
              background: 'linear-gradient(135deg, #CD8B3E 0%, #B77B35 100%)', 
              borderRadius: '1rem 1rem 0 0', 
              padding: '1.5rem 2rem', 
              margin: '-2rem -2rem 1.5rem -2rem',
              color: 'white',
              textAlign: 'center',
              position: 'relative',
              overflow: 'hidden'
            }}>
              <div style={{
                position: 'absolute',
                top: '-50%',
                right: '-20%',
                width: '100px',
                height: '100px',
                background: 'rgba(255, 255, 255, 0.1)',
                borderRadius: '50%',
                transform: 'rotate(45deg)'
              }}></div>
              <div style={{
                position: 'absolute',
                bottom: '-30%',
                left: '-10%',
                width: '80px',
                height: '80px',
                background: 'rgba(255, 255, 255, 0.08)',
                borderRadius: '50%',
                transform: 'rotate(-30deg)'
              }}></div>
              <h2 style={{ 
                fontSize: '1.8rem', 
                fontWeight: '800', 
                margin: '0',
                textShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                position: 'relative',
                zIndex: 1
              }}>
                Add New User
              </h2>
              <p style={{ 
                fontSize: '0.9rem', 
                margin: '0.5rem 0 0 0', 
                opacity: 0.9,
                position: 'relative',
                zIndex: 1
              }}>
                Create a new user account with role assignment
              </p>
            </div>
            <form onSubmit={handleAddUser} autoComplete="off" className="space-y-4" style={{ width: '100%', maxWidth: 500, margin: '0 auto' }}>
              {error && <div className="text-red-500 mb-4 text-center" style={{ padding: '0.75rem', background: '#fee', borderRadius: '0.5rem', border: '1px solid #fcc' }}>{error}</div>}
              {success && <div className="text-green-600 mb-4 text-center" style={{ padding: '0.75rem', background: '#efe', borderRadius: '0.5rem', border: '1px solid #cfc' }}>{success}</div>}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="first_name" className="block mb-2 text-sm font-medium text-[#3F2E1E]">First Name</label>
                  <input
                    type="text"
                    id="first_name"
                    name="first_name"
                    value={form.first_name}
                    onChange={handleFormChange}
                    onKeyDown={allowLettersOnlyKeyDown}
                    onPaste={handleNamePaste}
                    onBlur={() => {
                      if (shouldCheckName()) {
                        checkNameAvailability({
                          first_name: form.first_name?.trim() || '',
                          middle_name: form.middle_name?.trim() || '',
                          last_name: form.last_name?.trim() || '',
                          suffix: form.suffix?.trim() || ''
                        });
                      }
                    }}
                    className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-[#CD8B3E] focus:border-[#CD8B3E] ${
                      fieldErrors.first_name ? 'border-red-500' : 'border-[#f2e4ce]'
                    }`}
                    placeholder="Enter first name"
                    required
                    disabled={addLoading}
                  />
                  {fieldErrors.first_name && (
                    <div className="mt-1 text-xs text-red-500 flex items-center">
                      <span style={{display:'inline-block',width:16}}>
                        <svg width="16" height="16" fill="none" viewBox="0 0 16 16">
                          <circle cx="8" cy="8" r="6" stroke="#ef4444" strokeWidth="2" fill="none"/>
                        </svg>
                      </span>
                      {fieldErrors.first_name}
                    </div>
                  )}
                  {isCheckingName && (
                    <div className="mt-1 text-xs text-[#5C4B38] flex items-center">
                      <span style={{display:'inline-block',width:16}}>
                        <svg width="16" height="16" fill="none" viewBox="0 0 16 16" className="animate-spin">
                          <circle cx="8" cy="8" r="6" stroke="#5C4B38" strokeWidth="2" strokeDasharray="8 8" fill="none"/>
                        </svg>
                      </span>
                      Checking name availability...
                    </div>
                  )}
                  {nameError && (
                    <div className="mt-1 text-xs text-red-500 flex items-center">
                      <span style={{display:'inline-block',width:16}}>
                        <svg width="16" height="16" fill="none" viewBox="0 0 16 16">
                          <circle cx="8" cy="8" r="6" stroke="#ef4444" strokeWidth="2" fill="none"/>
                        </svg>
                      </span>
                      {nameError}
                    </div>
                  )}
                  {nameAvailable === true && !isCheckingName && !nameError && (
                    <div className="mt-1 text-xs text-green-600 flex items-center">
                      <span style={{display:'inline-block',width:16}}>
                        <svg width="16" height="16" fill="none" viewBox="0 0 16 16">
                          <path d="M4 8.5l3 3 5-5" stroke="#16a34a" strokeWidth="2" fill="none"/>
                        </svg>
                      </span>
                      Name available
                    </div>
                  )}
                </div>

                <div>
                  <label htmlFor="last_name" className="block mb-2 text-sm font-medium text-[#3F2E1E]">Last Name</label>
                  <input
                    type="text"
                    id="last_name"
                    name="last_name"
                    value={form.last_name}
                    onChange={handleFormChange}
                    onKeyDown={allowLettersOnlyKeyDown}
                    onPaste={handleNamePaste}
                    onBlur={() => {
                      if (shouldCheckName()) {
                        checkNameAvailability({
                          first_name: form.first_name?.trim() || '',
                          middle_name: form.middle_name?.trim() || '',
                          last_name: form.last_name?.trim() || '',
                          suffix: form.suffix?.trim() || ''
                        });
                      }
                    }}
                    className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-[#CD8B3E] focus:border-[#CD8B3E] ${
                      fieldErrors.last_name ? 'border-red-500' : 'border-[#f2e4ce]'
                    }`}
                    placeholder="Enter last name"
                    required
                    disabled={addLoading}
                  />
                  {fieldErrors.last_name && <p className="text-sm text-red-500 mt-1">{fieldErrors.last_name}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="middle_name" className="block mb-2 text-sm font-medium text-[#3F2E1E]">Middle Name (optional)</label>
                  <input
                    type="text"
                    id="middle_name"
                    name="middle_name"
                    value={form.middle_name}
                    onChange={handleFormChange}
                    onKeyDown={allowLettersOnlyKeyDown}
                    onPaste={handleNamePaste}
                    onBlur={() => {
                      if (shouldCheckName()) {
                        checkNameAvailability({
                          first_name: form.first_name?.trim() || '',
                          middle_name: form.middle_name?.trim() || '',
                          last_name: form.last_name?.trim() || '',
                          suffix: form.suffix?.trim() || ''
                        });
                      }
                    }}
                    className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-[#CD8B3E] focus:border-[#CD8B3E] ${
                      fieldErrors.middle_name ? 'border-red-500' : 'border-[#f2e4ce]'
                    }`}
                    placeholder="Enter middle name"
                    disabled={addLoading}
                  />
                  {fieldErrors.middle_name && <p className="text-sm text-red-500 mt-1">{fieldErrors.middle_name}</p>}
                </div>
                <div>
                  <label htmlFor="suffix" className="block mb-2 text-sm font-medium text-[#3F2E1E]">Suffix (optional)</label>
                  <input
                    type="text"
                    id="suffix"
                    name="suffix"
                    value={form.suffix}
                    onChange={handleFormChange}
                    onKeyDown={allowLettersOnlyKeyDown}
                    onPaste={handleNamePaste}
                    onBlur={() => {
                      if (shouldCheckName()) {
                        checkNameAvailability({
                          first_name: form.first_name?.trim() || '',
                          middle_name: form.middle_name?.trim() || '',
                          last_name: form.last_name?.trim() || '',
                          suffix: form.suffix?.trim() || ''
                        });
                      }
                    }}
                    className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-[#CD8B3E] focus:border-[#CD8B3E] ${
                      fieldErrors.suffix ? 'border-red-500' : 'border-[#f2e4ce]'
                    }`}
                    placeholder="Jr., Sr., III, etc."
                    disabled={addLoading}
                  />
                  {fieldErrors.suffix && <p className="text-sm text-red-500 mt-1">{fieldErrors.suffix}</p>}
                </div>
              </div>

              <div>
                <label htmlFor="email" className="block mb-2 text-sm font-medium text-[#3F2E1E]">Email Address</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={form.email}
                  onChange={handleFormChange}
                  className="w-full p-3 border border-[#f2e4ce] rounded-lg focus:ring-2 focus:ring-[#CD8B3E] focus:border-[#CD8B3E]"
                  placeholder="Enter email"
                  required
                  disabled={addLoading}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="phone" className="block mb-2 text-sm font-medium text-[#3F2E1E]">Phone Number</label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={form.phone}
                    onChange={handleFormChange}
                    pattern="[0-9]{11}"
                    inputMode="numeric"
                    className="w-full p-3 border border-[#f2e4ce] rounded-lg focus:ring-2 focus:ring-[#CD8B3E] focus:border-[#CD8B3E]"
                    placeholder="Enter phone number"
                    required
                    disabled={addLoading}
                  />
                </div>

                <div>
                  <label htmlFor="sex" className="block mb-2 text-sm font-medium text-[#3F2E1E]">Sex</label>
                  <select
                    id="sex"
                    name="Sex"
                    value={form.Sex}
                    onChange={handleFormChange}
                    className="w-full p-3 border border-[#f2e4ce] rounded-lg focus:ring-2 focus:ring-[#CD8B3E] focus:border-[#CD8B3E]"
                    required
                    disabled={addLoading}
                  >
                    <option value="">Select sex</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="birthdate" className="block mb-2 text-sm font-medium text-[#3F2E1E]">Date of Birth</label>
                  <input
                    type="date"
                    id="birthdate"
                    name="birthdate"
                    value={form.birthdate}
                    onChange={handleFormChange}
                    onBlur={(e) => {
                      if (e.target.value) {
                        validateBirthdate(e.target.value);
                      }
                    }}
                    max={(() => {
                      const yesterday = new Date();
                      yesterday.setDate(yesterday.getDate() - 1);
                      return yesterday.toISOString().split('T')[0];
                    })()}
                    className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-[#CD8B3E] focus:border-[#CD8B3E] ${
                      birthdateError ? 'border-red-500' : 'border-[#f2e4ce]'
                    }`}
                    required
                    disabled={addLoading}
                  />
                  {birthdateError ? (
                    <p className="text-sm text-red-500 mt-1">{birthdateError}</p>
                  ) : form.birthdate ? (
                    <p className="text-sm text-[#5C4B38] mt-1">Age: {calculateAge(form.birthdate)} years old</p>
                  ) : null}
                </div>

                <div>
                  <label htmlFor="password" className="block mb-2 text-sm font-medium text-[#3F2E1E]">Password</label>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    value={form.password}
                    onChange={handleFormChange}
                    className="w-full p-3 border border-[#f2e4ce] rounded-lg focus:ring-2 focus:ring-[#CD8B3E] focus:border-[#CD8B3E]"
                    placeholder="Create a password"
                    required
                    disabled={addLoading}
                    autoComplete="new-password"
                    onFocus={() => setShowPasswordReqs(true)}
                    onBlur={() => { if (!form.password) setShowPasswordReqs(false); }}
                  />
                  {(showPasswordReqs || form.password) && (
                    <div className="mt-2">
                      <ul className="text-xs text-[#5C4B38]">
                        {passwordRequirements.map((req, idx) => (
                          <li key={req.label} className={passwordChecks[idx] ? "text-green-600 flex items-center" : "text-red-500 flex items-center"}>
                            <span style={{display:'inline-block',width:16}}>
                              {passwordChecks[idx] ? (
                                <svg width="16" height="16" fill="none" viewBox="0 0 16 16"><path d="M4 8.5l3 3 5-5" stroke="#16a34a" strokeWidth="2" fill="none"/></svg>
                              ) : (
                                <svg width="16" height="16" fill="none" viewBox="0 0 16 16"><circle cx="8" cy="8" r="6" stroke="#ef4444" strokeWidth="2" fill="none"/></svg>
                              )}
                            </span>
                            {req.label}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label htmlFor="password_confirmation" className="block mb-2 text-sm font-medium text-[#3F2E1E]">Confirm Password</label>
                <input
                  type="password"
                  id="password_confirmation"
                  name="password_confirmation"
                  value={form.password_confirmation}
                  onChange={handleFormChange}
                  className="w-full p-3 border border-[#f2e4ce] rounded-lg focus:ring-2 focus:ring-[#CD8B3E] focus:border-[#CD8B3E]"
                  placeholder="Confirm your password"
                  required
                  disabled={addLoading}
                  autoComplete="new-password"
                />
                {form.password_confirmation && (
                  <div className={passwordsMatch ? "text-green-600 text-xs mt-1 flex items-center" : "text-red-500 text-xs mt-1 flex items-center"}>
                    <span style={{display:'inline-block',width:16}}>
                      {passwordsMatch ? (
                        <svg width="16" height="16" fill="none" viewBox="0 0 16 16"><path d="M4 8.5l3 3 5-5" stroke="#16a34a" strokeWidth="2" fill="none"/></svg>
                      ) : (
                        <svg width="16" height="16" fill="none" viewBox="0 0 16 16"><circle cx="8" cy="8" r="6" stroke="#ef4444" strokeWidth="2" fill="none"/></svg>
                      )}
                    </span>
                    {passwordsMatch ? "Passwords match" : "Passwords do not match"}
                  </div>
                )}
              </div>

              <div>
                <label htmlFor="address" className="block mb-2 text-sm font-medium text-[#3F2E1E]">Complete Address</label>
                <textarea
                  id="address"
                  name="address"
                  value={form.address}
                  onChange={handleFormChange}
                  className="w-full p-3 border border-[#f2e4ce] rounded-lg focus:ring-2 focus:ring-[#CD8B3E] focus:border-[#CD8B3E]"
                  rows="3"
                  placeholder="Enter complete address"
                  required
                  disabled={addLoading}
                ></textarea>
              </div>

              <div>
                <label htmlFor="role" className="block mb-2 text-sm font-medium text-[#3F2E1E]">Role</label>
                <select
                  id="role"
                  name="role"
                  value={form.role}
                  onChange={handleFormChange}
                  className="w-full p-3 border border-[#f2e4ce] rounded-lg focus:ring-2 focus:ring-[#CD8B3E] focus:border-[#CD8B3E]"
                  required
                  disabled={addLoading}
                >
                <option value="">Select Role</option>
                {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', alignItems: 'center' }}>
                <button type="submit" className="primary" style={{ background: '#CD8B3E', color: 'white', padding: '0.75rem 1.5rem', borderRadius: '0.5rem', border: 'none', fontWeight: 600, width: '100%' }} disabled={addLoading}>
                  {addLoading ? (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}>
                      <span className="spinner" style={{ width: 20, height: 20, border: '3px solid #fff', borderTop: '3px solid #CD8B3E', borderRadius: '50%', animation: 'spin 1s linear infinite', display: 'inline-block' }}></span>
                      Adding...
                    </span>
                  ) : 'Add User'}
                </button>
                <button type="button" onClick={() => {
                  setShowAdd(false);
                  setForm(initialForm);
                  setNameAvailable(null);
                  setNameError(null);
                  setIsCheckingName(false);
                  setFieldErrors({
                    first_name: null,
                    middle_name: null,
                    last_name: null,
                    suffix: null
                  });
                  setBirthdateError(null);
                  setError('');
                  setSuccess('');
                }} style={{ background: '#eee', color: '#3F2E1E', padding: '0.75rem 1.5rem', borderRadius: '0.5rem', border: 'none', fontWeight: 600, width: '100%' }} disabled={addLoading}>Cancel</button>
              </div>
            </form>
            {/* Spinner animation style */}
            <style>{`
              @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
            `}</style>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEdit && (
        <div style={modalStyle}>
          <div style={modalContentStyle}>
            <div style={{ 
              background: 'rgb(205, 139, 62)', 
              borderRadius: '1rem 1rem 0 0', 
              padding: '1.5rem 2rem', 
              margin: '-2rem -2rem 1.5rem -2rem',
              color: 'white',
              textAlign: 'center',
              position: 'relative',
              overflow: 'hidden'
            }}>
              <div style={{
                position: 'absolute',
                top: '-50%',
                right: '-20%',
                width: '100px',
                height: '100px',
                background: 'rgba(255, 255, 255, 0.1)',
                borderRadius: '50%',
                transform: 'rotate(45deg)'
              }}></div>
              <div style={{
                position: 'absolute',
                bottom: '-30%',
                left: '-10%',
                width: '80px',
                height: '80px',
                background: 'rgba(255, 255, 255, 0.08)',
                borderRadius: '50%',
                transform: 'rotate(-30deg)'
              }}></div>
              <h2 style={{ 
                fontSize: '1.8rem', 
                fontWeight: '800', 
                margin: '0',
                textShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                position: 'relative',
                zIndex: 1
              }}>
                Edit User
              </h2>
              <p style={{ 
                fontSize: '0.9rem', 
                margin: '0.5rem 0 0 0', 
                opacity: 0.9,
                position: 'relative',
                zIndex: 1
              }}>
                Update user information and role assignment
              </p>
            </div>
            <form onSubmit={handleEditUser} className="edit-user-form" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%', maxWidth: 500, margin: '0 auto', paddingBottom: '1rem' }}>
              <input type="text" name="name" value={form.name} onChange={handleFormChange} placeholder="Name" required disabled={editLoading} />
              <input type="email" name="email" value={form.email} onChange={handleFormChange} placeholder="Email" required disabled={editLoading} />
              <input type="text" name="username" value={form.username} onChange={handleFormChange} placeholder="Username" disabled={editLoading} />
              <input type="password" name="password" value={form.password} onChange={handleFormChange} placeholder="New Password (leave blank to keep current)" disabled={editLoading} />
              <input type="password" name="password_confirmation" value={form.password_confirmation} onChange={handleFormChange} placeholder="Confirm New Password" disabled={editLoading} />
              <label htmlFor="edit-sex-select" style={{ fontWeight: 600, color: '#3F2E1E' }}>Sex:</label>
              <select id="edit-sex-select" name="Sex" value={form.Sex} onChange={handleFormChange} required disabled={editLoading} style={{ padding: '0.5rem', borderRadius: 6, border: '1.5px solid #e2cfa3', fontSize: 14, color: '#3F2E1E', background: '#fff', minWidth: 120 }}>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
              <input type="text" name="address" value={form.address} onChange={handleFormChange} placeholder="Address" disabled={editLoading} />
              <input type="text" name="phone" value={form.phone} onChange={handleFormChange} placeholder="Phone" disabled={editLoading} />
              <input type="date" name="birthdate" value={form.birthdate} onChange={handleFormChange} required disabled={editLoading} />
              <select name="role" value={form.role} onChange={handleFormChange} required disabled={editLoading} style={{ padding: '0.5rem', borderRadius: 6, border: '1.5px solid #e2cfa3', fontSize: 14, color: '#3F2E1E', background: '#fff', minWidth: 120 }}>
                <option value="">Select Role</option>
                {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', alignItems: 'center' }}>
                <button type="submit" className="primary" style={{ background: '#CD8B3E', color: 'white', padding: '0.625rem 1.5rem', borderRadius: '0.5rem', border: 'none', fontWeight: 600, width: '100%' }} disabled={editLoading}>
                  {editLoading ? (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}>
                      <span className="spinner" style={{ width: 20, height: 20, border: '3px solid #fff', borderTop: '3px solid #CD8B3E', borderRadius: '50%', animation: 'spin 1s linear infinite', display: 'inline-block' }}></span>
                      Updating...
                    </span>
                  ) : 'Update User'}
                </button>
                <button type="button" onClick={() => setShowEdit(false)} style={{ background: '#eee', color: '#3F2E1E', padding: '0.625rem 1.5rem', borderRadius: '0.5rem', border: 'none', fontWeight: 600, width: '100%' }} disabled={editLoading}>Cancel</button>
              </div>
            </form>
            {error && <div className="error-msg" style={{ color: 'red', marginTop: '1rem' }}>{error}</div>}
          </div>
        </div>
      )}

      {/* Deactivate User Modal */}
      {showDelete && (
        <div style={modalStyle}>
          <div style={modalContentStyle}>
            <div style={{ 
              background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)', 
              borderRadius: '1rem 1rem 0 0', 
              padding: '1.5rem 2rem', 
              margin: '-2rem -2rem 1.5rem -2rem',
              color: 'white',
              textAlign: 'center',
              position: 'relative',
              overflow: 'hidden'
            }}>
              <div style={{
                position: 'absolute',
                top: '-50%',
                right: '-20%',
                width: '100px',
                height: '100px',
                background: 'rgba(255, 255, 255, 0.1)',
                borderRadius: '50%',
                transform: 'rotate(45deg)'
              }}></div>
              <div style={{
                position: 'absolute',
                bottom: '-30%',
                left: '-10%',
                width: '80px',
                height: '80px',
                background: 'rgba(255, 255, 255, 0.08)',
                borderRadius: '50%',
                transform: 'rotate(-30deg)'
              }}></div>
              <h2 style={{ 
                fontSize: '1.8rem', 
                fontWeight: '800', 
                margin: '0',
                textShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                position: 'relative',
                zIndex: 1
              }}>
                ⚠️ Deactivate Account
              </h2>
              <p style={{ 
                fontSize: '0.9rem', 
                margin: '0.5rem 0 0 0', 
                opacity: 0.9,
                position: 'relative',
                zIndex: 1
              }}>
                Temporarily disable user account access
              </p>
            </div>
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <p style={{ fontSize: '1rem', color: '#3F2E1E', marginBottom: '0.4rem' }}>
                Are you sure you want to deactivate <strong>{deleteUser?.name}</strong>'s account?
              </p>
              <p style={{ fontSize: '0.85rem', color: '#666', marginBottom: '0.8rem' }}>
                Email: {deleteUser?.email}
              </p>
              <div style={{background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '1rem', marginBottom: '1rem'}}>
                <p style={{color: '#dc2626', fontSize: '14px', margin: 0, fontWeight: '500'}}>
                  <strong>This action will:</strong>
                </p>
                <ul style={{color: '#dc2626', fontSize: '14px', margin: '0.5rem 0 0 1rem', padding: 0, textAlign: 'left'}}>
                  <li>Deactivate the user's account immediately</li>
                  <li>Prevent the user from logging in</li>
                  <li>Keep all user data intact</li>
                  <li>Allow admin to reactivate later if needed</li>
                </ul>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <button 
                onClick={handleDeactivateUser} 
                className="primary" 
                style={{ background: '#DC2626', color: 'white', padding: '0.625rem 1.5rem', borderRadius: '0.5rem', border: 'none', fontWeight: 600, width: '100%' }} 
                disabled={deactivating}
              >
                {deactivating ? (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}>
                    <span className="spinner" style={{ width: 20, height: 20, border: '3px solid #fff', borderTop: '3px solid #DC2626', borderRadius: '50%', animation: 'spin 1s linear infinite', display: 'inline-block' }}></span>
                    Deactivating...
                  </span>
                ) : 'Deactivate Account'}
              </button>
              <button 
                type="button" 
                onClick={() => setShowDelete(false)} 
                style={{ background: '#eee', color: '#3F2E1E', padding: '0.625rem 1.5rem', borderRadius: '0.5rem', border: 'none', fontWeight: 600, width: '100%' }} 
                disabled={deactivating}
              >
                Cancel
              </button>
            </div>
            {error && <div className="error-msg" style={{ color: 'red', marginTop: '1rem' }}>{error}</div>}
          </div>
        </div>
      )}
    </div>
    </>
  );
};

export default AdminUsers;
