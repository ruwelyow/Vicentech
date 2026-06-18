import React, { useState } from "react";
import "../../../css/login.css";
import { useNavigate, useSearchParams } from "react-router-dom";
import axios, { auth } from '../../utils/axios';
import { smartSanitize, smartValidate } from '../../utils/validation';
import useFormPersistence from '../../hooks/useFormPersistence';

const initialFormState = {
    first_name: "",
    middle_name: "",
    last_name: "",
    suffix: "",
    email: "",
    password: "",
    password_confirmation: "",
    phone: "",
    sex: "",
    birthdate: "",
    address: "",
};

const Register = () => {
    // Persist form data but exclude password fields for security
    const [formData, setFormData, clearFormData] = useFormPersistence('register-form', initialFormState);
    const [fieldErrors, setFieldErrors] = useState({
        first_name: null,
        middle_name: null,
        last_name: null,
        suffix: null
    });
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isCheckingName, setIsCheckingName] = useState(false);
    const [nameError, setNameError] = useState(null);
    const [nameAvailable, setNameAvailable] = useState(null); // true = available, false = exists, null = unchecked/unknown
    const [birthdateError, setBirthdateError] = useState(null);

    // Allow only letters and spaces on keydown; permit navigation and editing keys
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
        // Allow space
        if (e.key === ' ') {
            return;
        }
        // Allow letters A-Z only
        if (!/^[a-zA-Z]$/.test(e.key)) {
            e.preventDefault();
        }
    };

    // Sanitize pasted content to letters and spaces only
    const handleNamePaste = (e) => {
        e.preventDefault();
        const pasted = (e.clipboardData || window.clipboardData).getData('text');
        const cleaned = pasted.replace(/[^a-zA-Z\s]/g, '');
        const target = e.target;
        const { selectionStart, selectionEnd, value } = target;
        const newValue = value.slice(0, selectionStart) + cleaned + value.slice(selectionEnd);
        const name = target.name;
        setFormData(prev => ({ ...prev, [name]: newValue }));
    };

    // Password requirements state
    const [showPasswordReqs, setShowPasswordReqs] = useState(false);
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
    const passwordChecks = passwordRequirements.map(req => req.test(formData.password));
    const allPasswordValid = passwordChecks.every(Boolean);
    const passwordsMatch = formData.password && formData.password === formData.password_confirmation;
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    
    // Get redirect parameters
    const redirect = searchParams.get('redirect');
    const massId = searchParams.get('mass_id');

    const handleChange = (e) => {
        const { name, value } = e.target;
        
        // Get label text if available
        const label = e.target.previousElementSibling?.textContent || '';
        
        // Use smart sanitization based on field type
        let sanitizedValue = value;
        
        // For phone field, only allow numbers and limit to 11 digits
        if (name === 'phone') {
            sanitizedValue = value.replace(/[^0-9]/g, '').slice(0, 11);
        }
        // For name fields, use smart sanitize (letters and spaces only)
        else if (['first_name', 'middle_name', 'last_name', 'suffix'].includes(name)) {
            sanitizedValue = smartSanitize(value, name, label);
            
            // Clear any previous errors since invalid characters are now filtered out
            setFieldErrors(prev => ({
                ...prev,
                [name]: null
            }));
        }
        // For email fields, don't sanitize during typing - let user type freely
        else if (name === 'email') {
            sanitizedValue = value; // No sanitization for email during typing
        }
        // For address fields, use smart sanitize
        else if (name === 'address') {
            sanitizedValue = smartSanitize(value, name, label);
        }
        // For other fields, use smart sanitize as well
        else {
            sanitizedValue = smartSanitize(value, name, label);
        }
        
        setFormData(prev => ({ ...prev, [name]: sanitizedValue }));
        
        // Validate birthdate in real-time
        if (name === 'birthdate') {
            validateBirthdate(sanitizedValue);
        }
    };

    const validateBirthdate = (birthdate) => {
        if (!birthdate) {
            setBirthdateError(null);
            return;
        }

        const today = new Date();
        const selectedDate = new Date(birthdate);
        
        // Reset time to compare only dates
        today.setHours(0, 0, 0, 0);
        selectedDate.setHours(0, 0, 0, 0);

        if (selectedDate >= today) {
            setBirthdateError("Cannot select present day or future dates");
        } else {
            setBirthdateError(null);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);
        setIsLoading(true);

        // Validate name fields
        const firstNameCheck = smartValidate(formData.first_name, 'first_name', 'First Name');
        if (!firstNameCheck.valid) {
            setError(firstNameCheck.reason || 'Invalid first name');
            setIsLoading(false);
            return;
        }

        const lastNameCheck = smartValidate(formData.last_name, 'last_name', 'Last Name');
        if (!lastNameCheck.valid) {
            setError(lastNameCheck.reason || 'Invalid last name');
            setIsLoading(false);
            return;
        }

        if (formData.middle_name) {
            const middleNameCheck = smartValidate(formData.middle_name, 'middle_name', 'Middle Name');
            if (!middleNameCheck.valid) {
                setError(middleNameCheck.reason || 'Invalid middle name');
                setIsLoading(false);
                return;
            }
        }

        // Validate address
        const addressCheck = smartValidate(formData.address, 'address', 'Complete Address');
        if (!addressCheck.valid) {
            setError(addressCheck.reason || 'Invalid address');
            setIsLoading(false);
            return;
        }

        // prevent submission if name already exists
        if (nameAvailable === false) {
            setError('A user with that full name already exists. Please verify the name or add a suffix.');
            setIsLoading(false);
            return;
        }

        // prevent submission if birthdate is invalid
        if (birthdateError) {
            setError('Please select a valid birth date (cannot be present day or future dates).');
            setIsLoading(false);
            return;
        }

        // Build submission payload to match backend (separate fields supported)
        const maybe = (v) => (v && v.trim().length > 0 ? v.trim() : undefined);
        const submitPayload = {
            ...(maybe(formData.first_name) ? { first_name: maybe(formData.first_name) } : {}),
            ...(maybe(formData.middle_name) ? { middle_name: maybe(formData.middle_name) } : {}),
            ...(maybe(formData.last_name) ? { last_name: maybe(formData.last_name) } : {}),
            ...(maybe(formData.suffix) ? { suffix: maybe(formData.suffix) } : {}),
            email: formData.email,
            password: formData.password,
            password_confirmation: formData.password_confirmation,
            phone: formData.phone,
            gender: formData.sex,
            birthdate: formData.birthdate,
            address: formData.address,
        };

        // If name availability is unknown (null), attempt a quick check before submitting
        const hasNameParts = (formData.first_name?.trim() || '') && (formData.last_name?.trim() || '');
        if (nameAvailable === null && hasNameParts) {
            try {
                // Use the returned result instead of relying on state (state updates are async)
                const exists = await checkNameAvailability({
                    first_name: formData.first_name.trim(),
                    middle_name: formData.middle_name?.trim() || '',
                    last_name: formData.last_name.trim(),
                    suffix: formData.suffix?.trim() || ''
                });
                if (exists === true) {
                    setError('A user with that full name already exists. Please verify the name or add a different suffix.');
                    setIsLoading(false);
                    return;
                }
            } catch (err) {
                // network error checking name - continue but warn
                console.warn('Name check failed, continuing with registration:', err);
            }
        }

        // Minimum loading time for better UX (similar to admin events)
        const minWait = new Promise(resolve => setTimeout(resolve, 2000));

        try {
            // Use auth (web) client for register route (no /api baseURL)
            await auth.post("/register", submitPayload);
            
            // Wait for minimum loading time
            await minWait;

            setSuccess("Registration successful! Redirecting to verify your email...");
            clearFormData(); // Clear form data after successful registration
            setTimeout(() => {
                // Pass redirect parameters to OTP verification
                const otpState = { email: formData.email };
                if (redirect === 'mass-attendance' && massId) {
                    otpState.redirect = redirect;
                    otpState.massId = massId;
                }
                navigate("/otp-verification", { state: otpState });
            }, 2000);
            
        } catch (err) {
            // Wait for minimum loading time even on error
            await minWait;
            
            console.error("Registration error:", err);
            if (err.response && err.response.data && err.response.data.errors) {
                // Flatten all error messages into a single string
                const errorMessages = Object.values(err.response.data.errors).flat().join(" ");
                setError(errorMessages);
            } else if (err.response && err.response.data && err.response.data.message) {
                setError(err.response.data.message);
            } else {
                setError("Something went wrong.");
            }
        } finally {
            setIsLoading(false);
        }
    };

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

    // Check if the full name already exists using separate fields (or a single name if needed)
    // Backend endpoint POST /check-name accepts either { name } or { first_name, middle_name, last_name, suffix }
    const checkNameAvailability = async (payload) => {
        // Build a payload from separate fields if a string wasn't provided
        let reqBody = {};
        if (typeof payload === 'string') {
            const trimmed = payload.trim();
            if (!trimmed) {
                setNameError(null);
                setNameAvailable(null);
                return;
            }
            reqBody = { name: trimmed };
        } else if (payload && (payload.first_name || payload.last_name)) {
            // Only include non-empty fields to satisfy backend 'sometimes|nullable' cleanly
            const maybe = (v) => (v && v.trim().length > 0 ? v.trim() : undefined);
            const normalizeSuffix = (s) => s ? s.replace(/\./g, '').trim() : s;
            reqBody = {
                ...(maybe(payload.first_name) ? { first_name: maybe(payload.first_name) } : {}),
                ...(maybe(payload.middle_name) ? { middle_name: maybe(payload.middle_name) } : {}),
                ...(maybe(payload.last_name) ? { last_name: maybe(payload.last_name) } : {}),
                // normalize common suffix input like "jr." -> "jr" so server matching is consistent
                ...(maybe(payload.suffix) ? { suffix: normalizeSuffix(maybe(payload.suffix)) } : {}),
            };
            // Also include a combined `name` string (first + middle + last + suffix)
            // so the server can match variants (for example user typed "mart neil" in
            // the first name field while the DB has first="mart" middle="neil").
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
            // If a suffix was provided, perform two checks: with-suffix and without-suffix.
            // This lets us treat "Mart Tabernilla Jr" as available when the DB only
            // has "Mart Tabernilla" without suffix.
            if (reqBody.suffix) {
                const reqWith = { ...reqBody };
                // build a request without suffix
                const reqWithout = { ...reqBody };
                delete reqWithout.suffix;
                // also remove the suffix token from combined name if present
                if (reqWith.name) {
                    // safest: build without the last part if it equals the suffix
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

                // If the with-suffix call returned a structured response, use it.
                const withExists = respWith && respWith.data && typeof respWith.data.exists !== 'undefined' ? respWith.data.exists : null;
                const withoutExists = respWithout && respWithout.data && typeof respWithout.data.exists !== 'undefined' ? respWithout.data.exists : null;

                // Debug logs (can be removed later)
                console.log('checkNameAvailability: withSuffix=', reqWith, 'resp=', respWith && respWith.data);
                console.log('checkNameAvailability: withoutSuffix=', reqWithout, 'resp=', respWithout && respWithout.data);

                if (withExists === true) {
                    setNameAvailable(false);
                    setNameError('Full name already registered');
                    return true;
                }

                // If withExists === false but withoutExists === true, then suffix makes it unique
                if (withExists === false && withoutExists === true) {
                    setNameAvailable(true);
                    setNameError(null);
                    return false;
                }

                // Fallback: if any check says exists, honor it
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

    // Trigger name availability checks when the user has entered first and last name.
    // If middle name or suffix are also provided, they will be included in the
    // payload so the server can take them into account (e.g., "jr.").
    // This avoids forcing the user to always type a middle/suffix before checking.
    const shouldCheckName = () => {
        const f = formData.first_name?.trim();
        const l = formData.last_name?.trim();
        return !!(f && l);
    };

    

    return (
        <>
            {/* Full Screen Loading Overlay - Same as Admin Events */}
            {isLoading && (
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
                        <svg style={{ width: 64, height: 64, color: '#CD8B3E', marginBottom: 12 }} viewBox="0 0 50 50">
                            <circle cx="25" cy="25" r="20" fill="none" stroke="#CD8B3E" strokeWidth="6" strokeDasharray="31.4 31.4" strokeLinecap="round">
                                <animateTransform attributeName="transform" type="rotate" from="0 25 25" to="360 25 25" dur="1s" repeatCount="indefinite" />
                            </circle>
                        </svg>
                        <div style={{ color: '#3F2E1E', fontWeight: 600, fontSize: 20, letterSpacing: 1 }}>
                            Creating your account...
                        </div>
                    </div>

                </div>
            )}
            
            <div className="login-page min-h-screen flex items-start justify-center pt-24">
                <div className="bg-white border border-[#f2e4ce] rounded-2xl shadow-lg p-8 w-full max-w-lg">
                <h1 className="text-3xl font-bold text-[#3F2E1E] mb-2 text-center">Create Account</h1>
                <p className="text-[#5C4B38] text-center mb-6">
                    Sign up to create your account
                </p>

                {error && <div className="text-red-500 mb-4 text-center">{error}</div>}
                {success && <div className="text-green-600 mb-4 text-center">{success}</div>}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="first_name" className="block mb-2 text-sm font-medium text-[#3F2E1E]">First Name</label>
                            <input
                                type="text"
                                id="first_name"
                                name="first_name"
                                value={formData.first_name}
                                onChange={handleChange}
                                onKeyDown={allowLettersOnlyKeyDown}
                                onPaste={handleNamePaste}
                                onBlur={() => {
                                    if (shouldCheckName()) {
                                        checkNameAvailability({
                                            first_name: formData.first_name?.trim() || '',
                                            middle_name: formData.middle_name?.trim() || '',
                                            last_name: formData.last_name?.trim() || '',
                                            suffix: formData.suffix?.trim() || ''
                                        });
                                    }
                                }}
                                className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-[#CD8B3E] focus:border-[#CD8B3E] ${
                                    fieldErrors.first_name ? 'border-red-500' : 'border-[#f2e4ce]'
                                }`}
                                placeholder="Enter your first name"
                                required
                                disabled={isLoading}
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
                                value={formData.last_name}
                                onChange={handleChange}
                                onKeyDown={allowLettersOnlyKeyDown}
                                onPaste={handleNamePaste}
                                onBlur={() => {
                                    if (shouldCheckName()) {
                                        checkNameAvailability({
                                            first_name: formData.first_name?.trim() || '',
                                            middle_name: formData.middle_name?.trim() || '',
                                            last_name: formData.last_name?.trim() || '',
                                            suffix: formData.suffix?.trim() || ''
                                        });
                                    }
                                }}
                                className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-[#CD8B3E] focus:border-[#CD8B3E] ${
                                    fieldErrors.last_name ? 'border-red-500' : 'border-[#f2e4ce]'
                                }`}
                                placeholder="Enter your last name"
                                required
                                disabled={isLoading}
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
                                value={formData.middle_name}
                                onChange={handleChange}
                                onKeyDown={allowLettersOnlyKeyDown}
                                onPaste={handleNamePaste}
                                onBlur={() => {
                                    if (shouldCheckName()) {
                                        checkNameAvailability({
                                            first_name: formData.first_name?.trim() || '',
                                            middle_name: formData.middle_name?.trim() || '',
                                            last_name: formData.last_name?.trim() || '',
                                            suffix: formData.suffix?.trim() || ''
                                        });
                                    }
                                }}
                                className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-[#CD8B3E] focus:border-[#CD8B3E] ${
                                    fieldErrors.middle_name ? 'border-red-500' : 'border-[#f2e4ce]'
                                }`}
                                placeholder="Enter your middle name"
                                disabled={isLoading}
                            />
                            {fieldErrors.middle_name && <p className="text-sm text-red-500 mt-1">{fieldErrors.middle_name}</p>}
                        </div>
                        <div>
                            <label htmlFor="suffix" className="block mb-2 text-sm font-medium text-[#3F2E1E]">Suffix (optional)</label>
                            <input
                                type="text"
                                id="suffix"
                                name="suffix"
                                value={formData.suffix}
                                onChange={handleChange}
                                onKeyDown={allowLettersOnlyKeyDown}
                                onPaste={handleNamePaste}
                                onBlur={() => {
                                    if (shouldCheckName()) {
                                        checkNameAvailability({
                                            first_name: formData.first_name?.trim() || '',
                                            middle_name: formData.middle_name?.trim() || '',
                                            last_name: formData.last_name?.trim() || '',
                                            suffix: formData.suffix?.trim() || ''
                                        });
                                    }
                                }}
                                className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-[#CD8B3E] focus:border-[#CD8B3E] ${
                                    fieldErrors.suffix ? 'border-red-500' : 'border-[#f2e4ce]'
                                }`}
                                placeholder="Jr., Sr., III, etc."
                                disabled={isLoading}
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
                            value={formData.email}
                            onChange={handleChange}
                            className="w-full p-3 border border-[#f2e4ce] rounded-lg focus:ring-2 focus:ring-[#CD8B3E] focus:border-[#CD8B3E]"
                            placeholder="Enter your email"
                            required
                            disabled={isLoading}
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="phone" className="block mb-2 text-sm font-medium text-[#3F2E1E]">Phone Number</label>
                            <input
                                type="tel"
                                id="phone"
                                name="phone"
                                value={formData.phone}
                                onChange={handleChange}
                                pattern="[0-9]{11}"
                                inputMode="numeric"
                                className="w-full p-3 border border-[#f2e4ce] rounded-lg focus:ring-2 focus:ring-[#CD8B3E] focus:border-[#CD8B3E]"
                                placeholder="Enter your phone number"
                                required
                                disabled={isLoading}
                            />
                        </div>

                        <div>
                            <label htmlFor="sex" className="block mb-2 text-sm font-medium text-[#3F2E1E]">Sex</label>
                            <select
                                id="sex"
                                name="sex"
                                value={formData.sex}
                                onChange={handleChange}
                                className="w-full p-3 border border-[#f2e4ce] rounded-lg focus:ring-2 focus:ring-[#CD8B3E] focus:border-[#CD8B3E]"
                                required
                                disabled={isLoading}
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
                                value={formData.birthdate}
                                onChange={handleChange}
                                className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-[#CD8B3E] focus:border-[#CD8B3E] ${
                                    birthdateError ? 'border-red-500' : 'border-[#f2e4ce]'
                                }`}
                                required
                                disabled={isLoading}
                            />
                            {birthdateError && (
                                <p className="text-sm text-red-500 mt-1">{birthdateError}</p>
                            )}
                            {formData.birthdate && !birthdateError && (
                                <p className="text-sm text-[#5C4B38] mt-1">Age: {calculateAge(formData.birthdate)} years old</p>
                            )}
                        </div>

                        <div>
                            <label htmlFor="password" className="block mb-2 text-sm font-medium text-[#3F2E1E]">Password</label>
                            <input
                                type="password"
                                id="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                className="w-full p-3 border border-[#f2e4ce] rounded-lg focus:ring-2 focus:ring-[#CD8B3E] focus:border-[#CD8B3E]"
                                placeholder="Create a password"
                                required
                                disabled={isLoading}
                                autoComplete="new-password"
                                onFocus={() => setShowPasswordReqs(true)}
                                onBlur={() => { if (!formData.password) setShowPasswordReqs(false); }}
                            />
                            {(showPasswordReqs || formData.password) && (
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
                            value={formData.password_confirmation}
                            onChange={handleChange}
                            className="w-full p-3 border border-[#f2e4ce] rounded-lg focus:ring-2 focus:ring-[#CD8B3E] focus:border-[#CD8B3E]"
                            placeholder="Confirm your password"
                            required
                            disabled={isLoading}
                            autoComplete="new-password"
                        />
                        {formData.password_confirmation && (
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
                            value={formData.address}
                            onChange={handleChange}
                            className="w-full p-3 border border-[#f2e4ce] rounded-lg focus:ring-2 focus:ring-[#CD8B3E] focus:border-[#CD8B3E]"
                            rows="3"
                            placeholder="Enter your complete address"
                            required
                            disabled={isLoading}
                        ></textarea>
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-[#CD8B3E] text-white py-3 px-4 rounded-lg hover:bg-[#B77B35] transition duration-300"
                        disabled={isLoading}
                    >
                        {isLoading ? 'Creating Account...' : 'Create Account'}
                    </button>

                    <p className="text-center text-sm text-[#5C4B38]">
                        Already have an account?{' '}
                        <a href="/login" className="text-[#CD8B3E] hover:text-[#B77B35]">
                            Sign in
                        </a>
                    </p>
                </form>
                </div>
            </div>
        </>
    );
};

export default Register;
