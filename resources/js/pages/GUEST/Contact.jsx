import React, { useState } from 'react';
import '../../../css/about.css';
import '../../../css/profile.css';
import { api } from '../../utils/axios';
import SuccessPopup from '../../components/SuccessPopup';
import useFormPersistence from '../../hooks/useFormPersistence';

const initialFormState = {
    name: '',
    email: '',
    phone: '',
    message: ''
};

const Contact = () => {
    const [formData, setFormData, clearFormData] = useFormPersistence('contact-form', initialFormState);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitStatus, setSubmitStatus] = useState(null);
    const [showSuccessPopup, setShowSuccessPopup] = useState(false);
    const [successTitle, setSuccessTitle] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setSubmitStatus(null);

        try {
            // Send form data to backend
            const response = await api.post('/contact/send', formData);
            
            if (response.data.success) {
                setSubmitStatus('success');
                setSuccessTitle('Message Sent Successfully!');
                setSuccessMessage(response.data.message);
                setShowSuccessPopup(true);
                clearFormData(); // Clear form data from localStorage and state
            } else {
                setSubmitStatus('error');
                setSuccessTitle('Failed to Send Message');
                setSuccessMessage('Please try again later.');
                setShowSuccessPopup(true);
            }
        } catch (error) {
            console.error('Contact form error:', error);
            setSubmitStatus('error');
            setSuccessTitle('Network Error');
            setSuccessMessage('Please check your connection and try again.');
            setShowSuccessPopup(true);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <>
            <div className="about-page min-h-screen pb-20">
            {/* Contact Hero Section */}
            <section className="about-hero text-center">
                <div className="bg-white border border-[#f2e4ce] shadow-lg p-8 pb-10 w-full mt-16">
                    <h1 className="text-5xl font-extrabold text-[#3F2E1E] mb-3 tracking-tight font-['Times_New_Roman']">Contact Us</h1>
                    <p className="text-lg text-[#5C4B38] max-w-2xl mx-auto leading-relaxed">
                        Get in touch with the Diocesan Shrine of San Vicente Ferrer. We're here to assist you with your spiritual needs and church-related inquiries.
                    </p>
                    <hr className="theme-hr" />
                </div>
            </section>

            {/* Contact Form Section */}
            <div className="container-fluid px-5">
                <div className="row w-100 justify-content-center align-items-center mb-5 mt-0" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    {/* Send us Message Form */}
                    <div
                        style={{
                            width: '100%',
                            maxWidth: '600px',
                            display: 'flex',
                            justifyContent: 'center',
                            position: 'relative',
                            marginTop: '10px',
                        }}
                    >
                        <div
                            className="bg-white border border-[#f2e4ce] rounded-2xl shadow-lg"
                            style={{
                                width: '100%',
                                padding: '2rem 1.5rem 1.5rem 1.5rem',
                                minHeight: '700px',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                position: 'relative',
                            }}
                        >
                            <div className="text-center mb-4" style={{ width: '100%' }}>
                                <h2 className="text-3xl font-extrabold text-[#3F2E1E] mb-3 tracking-tight font-['Times_New_Roman']">Send us a Message</h2>
                                <p className="text-base text-[#5C4B38] max-w-xl mx-auto leading-relaxed">
                                    Have a question or need assistance? We'd love to hear from you.
                                </p>
                                <hr className="theme-hr" />
                            </div>

                            <form onSubmit={handleSubmit} style={{ width: '100%' }}>
                                {/* Full Name Field */}
                                <div style={{ marginBottom: '20px' }}>
                                    <label htmlFor="name" className="form-label text-[#3F2E1E] font-semibold" style={{ fontSize: '14px', marginBottom: '5px' }}>Full Name *</label>
                                    <input
                                        type="text"
                                        id="name"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleInputChange}
                                        className="form-control border border-[#f2e4ce] focus:border-[#CD8B3E] focus:ring-0"
                                        style={{ padding: '8px 12px', fontSize: '14px' }}
                                        required
                                    />
                                </div>

                                {/* Email Field */}
                                <div style={{ marginBottom: '20px' }}>
                                    <label htmlFor="email" className="form-label text-[#3F2E1E] font-semibold" style={{ fontSize: '14px', marginBottom: '5px' }}>Email Address *</label>
                                    <input
                                        type="email"
                                        id="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleInputChange}
                                        className="form-control border border-[#f2e4ce] focus:border-[#CD8B3E] focus:ring-0"
                                        style={{ padding: '8px 12px', fontSize: '14px' }}
                                        required
                                    />
                                </div>

                                {/* Phone Field */}
                                <div style={{ marginBottom: '20px' }}>
                                    <label htmlFor="phone" className="form-label text-[#3F2E1E] font-semibold" style={{ fontSize: '14px', marginBottom: '5px' }}>Phone Number</label>
                                    <input
                                        type="tel"
                                        id="phone"
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleInputChange}
                                        className="form-control border border-[#f2e4ce] focus:border-[#CD8B3E] focus:ring-0"
                                        style={{ padding: '8px 12px', fontSize: '14px' }}
                                    />
                                </div>


                                {/* Message Field */}
                                <div style={{ marginBottom: '20px' }}>
                                    <label htmlFor="message" className="form-label text-[#3F2E1E] font-semibold" style={{ fontSize: '14px', marginBottom: '5px' }}>Message *</label>
                                    <textarea
                                        id="message"
                                        name="message"
                                        value={formData.message}
                                        onChange={handleInputChange}
                                        className="form-control border border-[#f2e4ce] focus:border-[#CD8B3E] focus:ring-0"
                                        rows="6"
                                        placeholder="Please provide details about your inquiry..."
                                        style={{ padding: '8px 12px', fontSize: '14px' }}
                                        required
                                    ></textarea>
                                </div>

                                {submitStatus === 'success' && (
                                    <div className="alert alert-success bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-3">
                                        <svg className="w-5 h-5 inline mr-2" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                                        </svg>
                                        Thank you! Your message has been sent successfully.
                                    </div>
                                )}

                                {submitStatus === 'error' && (
                                    <div className="alert alert-error bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-3">
                                        <svg className="w-5 h-5 inline mr-2" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
                                        </svg>
                                        Sorry, there was an error sending your message. Please try again.
                                    </div>
                                )}

                                <div className="text-center">
                                    <button
                                        type="submit"
                                        className={`btn btn-primary border-0 px-8 py-3 rounded-lg font-semibold text-base transition-all duration-300 ${
                                            isSubmitting 
                                                ? 'bg-[#B77B35] cursor-not-allowed opacity-80' 
                                                : 'bg-[#CD8B3E] hover:bg-[#B77B35] hover:shadow-lg hover:-translate-y-0.5'
                                        }`}
                                        disabled={isSubmitting}
                                    >
                                        {isSubmitting ? (
                                            <div className="flex items-center justify-center">
                                                <svg 
                                                    className="animate-spin h-5 w-5 text-white mr-3" 
                                                    xmlns="http://www.w3.org/2000/svg" 
                                                    fill="none" 
                                                    viewBox="0 0 24 24"
                                                >
                                                    <circle 
                                                        className="opacity-25" 
                                                        cx="12" 
                                                        cy="12" 
                                                        r="10" 
                                                        stroke="currentColor" 
                                                        strokeWidth="4"
                                                    />
                                                    <path 
                                                        className="opacity-75" 
                                                        fill="currentColor" 
                                                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                                    />
                                                </svg>
                                                <span className="text-white font-medium">Sending Message...</span>
                                            </div>
                                        ) : (
                                            <div className="flex items-center justify-center">
                                                <svg 
                                                    className="h-5 w-5 text-white mr-2" 
                                                    fill="none" 
                                                    stroke="currentColor" 
                                                    viewBox="0 0 24 24"
                                                >
                                                    <path 
                                                        strokeLinecap="round" 
                                                        strokeLinejoin="round" 
                                                        strokeWidth={2} 
                                                        d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                                                    />
                                                </svg>
                                                <span className="text-white font-medium">Send Message</span>
                                            </div>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        {/* Success Popup */}
        <SuccessPopup
            isOpen={showSuccessPopup}
            onClose={() => setShowSuccessPopup(false)}
            title={successTitle}
            message={successMessage}
            duration={4000}
        />
        </>
    );
};

export default Contact;
