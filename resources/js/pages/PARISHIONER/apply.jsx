import React, { useState, useEffect } from 'react';
import '../../../css/apply.css';
import { api } from '../../utils/axios'; // adjust path as needed
import {
    smartSanitize,
    smartValidate,
    sanitizePhone,
    validateEmail,
    validatePhone
} from '../../utils/validation';
import useFormPersistence from '../../hooks/useFormPersistence';

const initialFormState = {
    first_name: '',
    last_name: '',
    birthdate: '',
    gender: '',
    email: '',
    phone: '',
    address: '',
    server_type: '',
    motivation: '',
    commitment: false,
};

const Apply = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [form, setForm, clearForm] = useFormPersistence('apply-form', initialFormState);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');
    const [serverTypes, setServerTypes] = useState([]);
    const [typesLoading, setTypesLoading] = useState(true);
    const [birthdateError, setBirthdateError] = useState('');

    useEffect(() => {
        const fetchServerTypes = async () => {
            setTypesLoading(true);
            try {
                const response = await api.get('/server-types');
                setServerTypes(Array.isArray(response.data) ? response.data : []);
            } catch (err) {
                setServerTypes([]);
            } finally {
                setTypesLoading(false);
            }
        };
        fetchServerTypes();
    }, []);

    const calculateAge = (birthdate) => {
        if (!birthdate) {
            return null;
        }
        const today = new Date();
        const birth = new Date(birthdate);
        let calculatedAge = today.getFullYear() - birth.getFullYear();
        const monthDiff = today.getMonth() - birth.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
            calculatedAge--;
        }
        return calculatedAge;
    };

    const handleChange = (e) => {
        const { id, value, type, checked } = e.target;
        let newValue = type === 'checkbox' ? checked : value;
        
        // Get label text if available
        const label = e.target.previousElementSibling?.textContent || e.target.closest('label')?.textContent || '';
        
        // Field-specific sanitization
        if (id === 'phone') {
            newValue = sanitizePhone(newValue);
        } else if (id === 'email') {
            // Don't sanitize email fields during typing - let user type freely
            newValue = newValue; // No sanitization for email during typing
        } else if (id === 'motivation') {
            // Don't sanitize motivation field during typing - let user type freely with spaces
            newValue = newValue; // No sanitization for motivation during typing
        } else if (id === 'address') {
            // Don't sanitize address field during typing - let user type freely with spaces
            newValue = newValue; // No sanitization for address during typing
        } else {
            // Use smart sanitize for name and other text fields
            newValue = smartSanitize(newValue, id, label);
        }

        setForm(prev => ({
            ...prev,
            [id]: type === 'checkbox' ? checked : newValue
        }));

        if (id === 'birthdate') {
            // Disallow today or future dates
            if (!value) {
                setBirthdateError('');
            } else {
                const today = new Date();
                const selected = new Date(value);
                today.setHours(0,0,0,0);
                selected.setHours(0,0,0,0);
                if (selected >= today) {
                    setBirthdateError('Birthdate cannot be today or a future date.');
                } else {
                    const calculatedAge = calculateAge(value);
                    
                    // Validate minimum age of 10 years
                    if (calculatedAge !== null && calculatedAge < 10) {
                        setBirthdateError('Minimum age requirement is 10 years old. Your age is ' + calculatedAge + ' years.');
                    } else {
                        setBirthdateError('');
                    }
                }
            }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        // Basic client-side validation
        const firstNameCheck = smartValidate(form.first_name, 'first_name', 'First Name');
        if (!firstNameCheck.valid) {
            setError(firstNameCheck.reason || 'Invalid first name');
            setLoading(false);
            return;
        }
        const lastNameCheck = smartValidate(form.last_name, 'last_name', 'Last Name');
        if (!lastNameCheck.valid) {
            setError(lastNameCheck.reason || 'Invalid last name');
            setLoading(false);
            return;
        }
        const emailCheck = validateEmail(form.email);
        if (!emailCheck.valid) {
            setError(emailCheck.reason);
            setLoading(false);
            return;
        }
        const phoneCheck = validatePhone(form.phone);
        if (!phoneCheck.valid) {
            setError(phoneCheck.reason);
            setLoading(false);
            return;
        }
        const addressCheck = smartValidate(form.address, 'address', 'Complete Address');
        if (!addressCheck.valid) {
            setError(addressCheck.reason || 'Invalid address');
            setLoading(false);
            return;
        }

        // Guard submit if birthdate is invalid (today/future)
        if (form.birthdate) {
            const today = new Date();
            const selected = new Date(form.birthdate);
            today.setHours(0,0,0,0);
            selected.setHours(0,0,0,0);
            if (selected >= today) {
                setLoading(false);
                setBirthdateError('Birthdate cannot be today or a future date.');
                return;
            }
        }

        // Guard submit if age is less than 10 years old
        if (form.birthdate) {
            const calculatedAge = calculateAge(form.birthdate);
            if (calculatedAge !== null && calculatedAge < 10) {
                setLoading(false);
                setBirthdateError('Minimum age requirement is 10 years old. Your age is ' + calculatedAge + ' years.');
                return;
            }
        }

        try {
            await api.post('/ministry-applicants', form);
            setSuccess('Application submitted successfully!');
            clearForm();
            setBirthdateError('');
        } catch (err) {
            if (err.response && err.response.data && err.response.data.errors) {
                // Handle backend validation errors
                if (err.response.data.errors.age) {
                    setBirthdateError(err.response.data.errors.age[0]);
                } else if (err.response.data.errors.birthdate) {
                    setBirthdateError(err.response.data.errors.birthdate[0]);
                } else {
                    const errorMessages = Object.values(err.response.data.errors).flat().join(' ');
                    setError(errorMessages);
                }
            } else {
                setError('Failed to submit application. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="apply-page min-h-screen pb-20">
            {/* Loading Overlay */}
            {loading && (
                <div className="loading-overlay">
                    <div className="spinner"></div>
                    <div className="loading-text">Submitting your application...</div>
                </div>
            )}
            {/* Popup Modal for Success */}
            {success && (
                <div className="popup-modal">
                    <div className="popup-content">
                        <h2 className="popup-title">Application Submitted!</h2>
                        <p className="popup-message">Your application has been submitted successfully. We will contact you for an interview after reviewing your application.</p>
                        <button className="popup-close" onClick={() => setSuccess('')}>Close</button>
                    </div>
                </div>
            )}
            <section className="apply-hero text-center">
                <div className="bg-white border border-[#f2e4ce] shadow-lg p-8 pb-10 w-full mt-6 relative">
                    <h1 className="text-5xl font-extrabold text-[#3F2E1E] mb-3 tracking-tight font-['Times_New_Roman']">Apply Ministry Member</h1>
                    <p className="text-lg text-[#5C4B38] max-w-2xl mx-auto leading-relaxed">
                        Join our ministry team and serve the church community. Fill out the form below to start your journey of service.
                    </p>
                </div>
            </section>

            <div className="bg-white border border-[#f2e4ce] rounded-2xl shadow-lg p-8 pb-10 w-full max-w-6xl mx-4 sm:mx-auto mt-6 md:-mt-16 apply-form-mobile">
                 <form className="space-y-4" onSubmit={handleSubmit}>
                       <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="first_name" className="block mb-2 text-sm font-medium text-[#3F2E1E]">First Name</label>
                            <input type="text" id="first_name" value={form.first_name} onChange={handleChange}
                                className="w-full p-3 border border-[#f2e4ce] rounded-lg focus:ring-2 focus:ring-[#CD8B3E] focus:border-[#CD8B3E]"
                                required />
                        </div>
                        <div>
                            <label htmlFor="last_name" className="block mb-2 text-sm font-medium text-[#3F2E1E]">Last Name</label>
                            <input type="text" id="last_name" value={form.last_name} onChange={handleChange}
                                className="w-full p-3 border border-[#f2e4ce] rounded-lg focus:ring-2 focus:ring-[#CD8B3E] focus:border-[#CD8B3E]"
                                required />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="birthdate" className="block mb-2 text-sm font-medium text-[#3F2E1E]">Date of Birth</label>
                            <input type="date" id="birthdate" value={form.birthdate} onChange={handleChange}
                                className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-[#CD8B3E] focus:border-[#CD8B3E] ${birthdateError ? 'border-red-500' : 'border-[#f2e4ce]'}`}
                                max={(new Date(Date.now() - 24*60*60*1000)).toISOString().split('T')[0]}
                                required />
                            {birthdateError && (
                                <div className="text-red-600 text-sm mt-1">{birthdateError}</div>
                            )}
                            {form.birthdate && !birthdateError && calculateAge(form.birthdate) >= 10 && (
                                <div className="text-green-600 text-sm mt-1">✓ Age requirement met</div>
                            )}
                        </div>
                        <div>
                            <label htmlFor="gender" className="block mb-2 text-sm font-medium text-[#3F2E1E]">Sex</label>
                            <select id="gender" value={form.gender} onChange={handleChange}
                                className="w-full p-3 border border-[#f2e4ce] rounded-lg focus:ring-2 focus:ring-[#CD8B3E] focus:border-[#CD8B3E]"
                                required>
                                <option value="">Select Sex</option>
                                <option value="male">Male</option>
                                <option value="female">Female</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label htmlFor="email" className="block mb-2 text-sm font-medium text-[#3F2E1E]">Email Address</label>
                        <input type="email" id="email" value={form.email} onChange={handleChange}
                            className="w-full p-3 border border-[#f2e4ce] rounded-lg focus:ring-2 focus:ring-[#CD8B3E] focus:border-[#CD8B3E]"
                            placeholder="Enter your email"
                            required />
                    </div>

                    <div>
                        <label htmlFor="phone" className="block mb-2 text-sm font-medium text-[#3F2E1E]">Contact Number</label>
                        <input type="tel" id="phone" value={form.phone} onChange={handleChange}
                            className="w-full p-3 border border-[#f2e4ce] rounded-lg focus:ring-2 focus:ring-[#CD8B3E] focus:border-[#CD8B3E]"
                            placeholder="Enter your contact number"
                            required />
                    </div>

                    <div>
                        <label htmlFor="address" className="block mb-2 text-sm font-medium text-[#3F2E1E]">Complete Address</label>
                        <textarea id="address" value={form.address} onChange={handleChange}
                            className="w-full p-3 border border-[#f2e4ce] rounded-lg focus:ring-2 focus:ring-[#CD8B3E] focus:border-[#CD8B3E]"
                            rows="2"
                            required></textarea>
                    </div>

                    <div>
                        <label htmlFor="server_type" className="block mb-2 text-sm font-medium text-[#3F2E1E]">Type of Server</label>
                        {typesLoading ? (
                            <div>Loading server types...</div>
                        ) : (
                            <select id="server_type" value={form.server_type} onChange={handleChange}
                                className="w-full p-3 border border-[#f2e4ce] rounded-lg focus:ring-2 focus:ring-[#CD8B3E] focus:border-[#CD8B3E]"
                                required>
                                <option value="">Select type of server</option>
                                {Array.isArray(serverTypes) && serverTypes.map(type => (
                                    <option key={type.id} value={type.name}>{type.name}</option>
                                ))}
                            </select>
                        )}
                    </div>

                    <div>
                        <label htmlFor="motivation" className="block mb-2 text-sm font-medium text-[#3F2E1E]">Why do you want to serve?</label>
                        <textarea id="motivation" value={form.motivation} onChange={handleChange}
                            className="w-full p-3 border border-[#f2e4ce] rounded-lg focus:ring-2 focus:ring-[#CD8B3E] focus:border-[#CD8B3E]"
                            rows="3"
                            placeholder="Share your motivation for wanting to serve in the church"
                            required></textarea>
                    </div>

                    <div className="flex items-center">
                        <input type="checkbox" id="commitment" checked={form.commitment} onChange={handleChange}
                            className="w-4 h-4 border border-[#f2e4ce] rounded focus:ring-[#CD8B3E] text-[#CD8B3E]"
                            required />
                        <label htmlFor="commitment" className="ml-2 text-sm text-[#3F2E1E]">
                            I commit to serving faithfully and following the church's guidelines
                        </label>
                    </div>

                    {error && <div className="text-red-600 text-center">{error}</div>}
                    {/* Remove inline success message */}
                    <button type="submit"
                        className="w-full bg-[#CD8B3E] text-white py-3 px-4 rounded-lg hover:bg-[#B77B35] transition duration-300"
                        disabled={loading}
                    >
                        {loading ? 'Submitting...' : 'Submit Application'}
                    </button>

                    <div className="text-center text-sm text-[#5C4B38]">
                        We will contact you for an interview after reviewing your application
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Apply;


