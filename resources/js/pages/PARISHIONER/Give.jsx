import React, { useState, useEffect } from 'react';
import { api } from '../../utils/axios';
import '../../../css/give.css'; // Ensure custom CSS is imported
import useFormPersistence from '../../hooks/useFormPersistence';

// Define SVG Icons separately for better readability and to avoid parsing issues
const ChurchBuildingIcon = <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-6 h-6 text-[#CD8B3E]"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 21v-4.719c0-.404.081-.81.294-1.168.524-.954 1.48-1.594 2.57-1.664v-1.921c0-.404.081-.81.294-1.168C12.48 9.594 13.436 8.954 14.526 8.884v-1.92c0-.404.081-.81.294-1.168C16.48 4.594 17.436 3.954 18.526 3.884V2.25M8.25 21h8.25m-4.5 0H3.375m8.25 0h7.5m-9-15 4.75 4.75M9 14.25l-4.75 4.75M17.25 14.25l-4.75 4.75M12 18V9" /></svg>;
const CharityIcon = <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-6 h-6 text-[#CD8B3E]"><path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" /></svg>;
const MissionIcon = <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-6 h-6 text-[#CD8B3E]"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>;
const GeneralFundIcon = <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-6 h-6 text-[#CD8B3E]"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.794 2.105 4.5 4.5 0 00-1.8-1.896V19.5" /><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 10.5h15m-15 0a2.25 2.25 0 00-2.25 2.25v2.25a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 15v-2.25a2.25 2.25 0 00-2.25-2.25h-15z" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 11.25V9" /></svg>;
const OtherIcon = <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-6 h-6 text-[#CD8B3E]"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;

const initialFormState = {
  name: '',
  email: '',
  amount: '',
  reference: '',
};

const Give = () => {
  const [donationPurposes, setDonationPurposes] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null); // will store the full purpose object
  const [showDonationForm, setShowDonationForm] = useState(false);
  const [receiptFile, setReceiptFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [donationPictures, setDonationPictures] = useState([]);
  const [donationPicturesLoading, setDonationPicturesLoading] = useState(true);
  const [gcashAccounts, setGcashAccounts] = useState([]);
  const [gcashAccountsLoading, setGcashAccountsLoading] = useState(true);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [formData, setFormData, clearFormData] = useFormPersistence('give-form', initialFormState);

  useEffect(() => {
    const fetchDonationPurposes = async () => {
      try {
        const response = await fetch('/api/donation-purposes');
        const data = await response.json();
        setDonationPurposes(data);
      } catch (error) {
        console.error('Failed to fetch donation purposes', error);
      }
    };

    const fetchDonationPictures = async () => {
      try {
        setDonationPicturesLoading(true);
        const response = await fetch('/api/donation-pictures');
        const data = await response.json();
        // The API already returns only enabled pictures
        setDonationPictures(data);
      } catch (error) {
        console.error('Failed to fetch donation pictures', error);
        setDonationPictures([]);
      } finally {
        setDonationPicturesLoading(false);
      }
    };

    const fetchGcashAccounts = async () => {
      try {
        setGcashAccountsLoading(true);
        const response = await fetch('/api/gcash-accounts');
        const data = await response.json();
        // The API already returns only enabled accounts
        setGcashAccounts(data);
      } catch (error) {
        console.error('Failed to fetch GCash accounts', error);
        setGcashAccounts([]);
      } finally {
        setGcashAccountsLoading(false);
      }
    };

    fetchDonationPurposes();
    fetchDonationPictures();
    fetchGcashAccounts();
  }, []);

  const handleCategoryClick = (categoryId) => {
    const selected = donationPurposes.find(p => p.id === categoryId);
    setSelectedCategory(selected); // store the full object
    setFormData(prev => ({ ...prev, amount: '' }));
    setShowDonationForm(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e) => {
    setReceiptFile(e.target.files[0]);
  };

  const handleCloseSuccessMessage = () => {
    setShowSuccessMessage(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate reference number
    if (!formData.reference || formData.reference.length !== 13 || !/^\d{13}$/.test(formData.reference)) {
      alert('Please enter a valid 13-digit reference number.');
      return;
    }
    // Require receipt upload
    if (!receiptFile) {
      alert('Please upload a receipt or screenshot of your payment.');
      return;
    }
    
    setIsSubmitting(true);
    try {
      const payload = new FormData();
      payload.append('name', formData.name);
      payload.append('email', formData.email);
      payload.append('amount', formData.amount);
      payload.append('reference', formData.reference);
      payload.append('category', selectedCategory?.id || 'general-fund');
      payload.append('purpose_name', selectedCategory?.name || '');
      // Receipt is required above; append confidently
      payload.append('receipt', receiptFile);

      // CSRF token handled by axios interceptor
      const res = await api.post('/donations', payload, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      const data = res.data;

      console.log('Donation submitted:', data);
      setShowSuccessMessage(true);
      setSelectedCategory(null);
      clearFormData(); // Clear form data from localStorage and state
      setShowDonationForm(false);
      setReceiptFile(null);

      window.dispatchEvent(new Event('donationsUpdated'));
    } catch (err) {
      console.error('Donation submission failed', err);
      let errorMessage = 'Failed to submit donation. Please try again.';
      if (err.response?.status === 419) {
        errorMessage = 'Security token expired. Please refresh the page and try again.';
      } else if (err.response?.status === 422) {
        // Validation errors
        const errors = err.response.data.errors;
        if (errors) {
          const errorMessages = Object.values(errors).flat();
          errorMessage = errorMessages.join(' ');
        } else {
          errorMessage = err.response.data.message || 'Please check your input and try again.';
        }
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      }
      alert(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="give-page min-h-screen pb-20 bg-[#DED0B6]">
      <section className="give-hero text-center pt-16 pb-8">
        <div className="bg-white border border-[#f2e4ce] shadow-lg p-8 pb-10 w-full mt-6">
          <h1 className="text-5xl font-extrabold text-[#3F2E1E] mb-3 tracking-tight font-['Times_New_Roman']">Support Our Mission</h1>
          <p className="text-lg text-[#5C4B38] max-w-2xl mx-auto leading-relaxed">
            Your generosity fuels our mission, enabling us to serve and uplift our community. Every contribution makes a difference.
          </p>
        </div>
      </section>
      <div className="bg-white border border-[#f2e4ce] rounded-2xl shadow-lg p-8 max-w-6xl mx-auto mt-8">
        <div className="space-y-8">
          <div className="bg-white rounded-lg">
            <h2 className="text-2xl font-semibold text-[#3F2E1E] mb-4">Donate online</h2>
            <div className="text-center">
              {donationPicturesLoading ? (
                <div className="mx-auto w-72 h-72 border-4 border-[#f2e4ce] p-3 rounded-xl shadow-md flex items-center justify-center bg-gray-50">
                  <div className="text-[#5C4B38]">Loading donation images...</div>
                </div>
              ) : donationPictures.length > 0 ? (
                <div className="space-y-4">
                  {donationPictures.map((picture, index) => {
                    // Construct image URL properly
                    let imageUrl = '';
                    if (picture.image_path) {
                      if (picture.image_path.startsWith('http://') || picture.image_path.startsWith('https://')) {
                        imageUrl = picture.image_path;
                      } else if (picture.image_path.startsWith('/')) {
                        imageUrl = `${window.location.origin}${picture.image_path}`;
                      } else {
                        imageUrl = `${window.location.origin}/${picture.image_path}`;
                      }
                    }
                    
                    return (
                      <div key={picture.id} className="mb-4">
                        <img 
                          src={imageUrl} 
                          alt={`Donation QR Code ${index + 1}`} 
                          className="mx-auto w-72 h-72 object-contain border-4 border-[#f2e4ce] p-3 rounded-xl shadow-md" 
                          onError={(e) => {
                            console.error('Failed to load donation image:', {
                              id: picture.id,
                              image_path: picture.image_path,
                              constructed_url: imageUrl,
                              src: e.target.src
                            });
                            e.target.style.display = 'none';
                          }}
                          onLoad={() => {
                            console.log('Successfully loaded donation QR code:', {
                              id: picture.id,
                              url: imageUrl
                            });
                          }}
                        />
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="mx-auto w-72 h-72 border-4 border-[#f2e4ce] p-3 rounded-xl shadow-md flex items-center justify-center bg-gray-50">
                  <div className="text-[#5C4B38] text-center">
                    <div className="text-4xl mb-2">📱</div>
                    <div>GCash QR Code</div>
                    <div className="text-sm mt-2">QR code will be displayed here</div>
                  </div>
                </div>
              )}
              <p className="text-lg text-[#5C4B38] mb-2">Scan the QR code above to make a direct donation through GCash.</p>
              {gcashAccountsLoading ? (
                <div className="text-md text-[#5C4B38] mt-2">Loading account details...</div>
              ) : gcashAccounts.length > 0 ? (
                gcashAccounts.map((account, index) => (
                  <div key={account.id} className="mb-2">
                    <p className="text-md text-[#5C4B38] mt-2">Account Name: <span className="font-semibold">{account.account_name}</span></p>
                    <p className="text-md text-[#5C4B38]">Account Number: <span className="font-semibold">{account.account_number}</span></p>
                  </div>
                ))
              ) : (
                <>
                  <p className="text-md text-[#5C4B38] mt-2">Account Name: <span className="font-semibold">[Your GCash Name]</span></p>
                  <p className="text-md text-[#5C4B38]">Account Number: <span className="font-semibold">[Your GCash Number]</span></p>
                </>
              )}
            </div>
          </div>

          <div className="bg-white rounded-lg">
            <h2 className="text-2xl font-semibold text-[#3F2E1E] mb-4">Choose Your Donation Purpose</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {donationPurposes.map(purpose => (
                <button
                  key={purpose.id}
                  onClick={() => handleCategoryClick(purpose.id)}
                  className={`sacrament-card p-4 border border-[#f2e4ce] rounded-lg text-left hover:border-[#CD8B3E] transition-colors ${
                    selectedCategory === purpose.id ? 'ring-2 ring-[#CD8B3E] bg-[#CD8B3E]/5' : ''
                  }`}
                >
                  <div className="flex items-center mb-2">
                    <div className="p-2 rounded-full bg-[#FFEBC9] mr-3">{ChurchBuildingIcon}</div>
                    <h3 className="font-medium text-[#3F2E1E]">{purpose.name}</h3>
                  </div>
                  <p className="text-sm text-[#5C4B38]">{purpose.description}</p>
                </button>
              ))}
            </div>
          </div>

          {showDonationForm && (
            <div className="bg-white rounded-lg">
              <h2 className="text-2xl font-semibold text-[#3F2E1E] mb-4">Your Donation Details</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-[#3F2E1E] mb-2">Email Address</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full p-3 border border-[#f2e4ce] rounded-lg focus:ring-2 focus:ring-[#CD8B3E] focus:border-[#CD8B3E]"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-[#3F2E1E] mb-2">Full Name</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full p-3 border border-[#f2e4ce] rounded-lg focus:ring-2 focus:ring-[#CD8B3E] focus:border-[#CD8B3E]"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="amount" className="block text-sm font-medium text-[#3F2E1E] mb-2">Amount</label>
                  <input
                    type="number"
                    id="amount"
                    name="amount"
                    value={formData.amount}
                    onChange={handleInputChange}
                    className="w-full p-3 border border-[#f2e4ce] rounded-lg focus:ring-2 focus:ring-[#CD8B3E] focus:border-[#CD8B3E]"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="reference" className="block text-sm font-medium text-[#3F2E1E] mb-2">Reference Number (13 digits)</label>
                  <input
                    type="text"
                    id="reference"
                    name="reference"
                    value={formData.reference}
                    onChange={handleInputChange}
                    className="w-full p-3 border border-[#f2e4ce] rounded-lg focus:ring-2 focus:ring-[#CD8B3E] focus:border-[#CD8B3E]"
                    placeholder="Enter 13-digit reference number"
                    pattern="[0-9]{13}"
                    maxLength="13"
                    required
                  />
                  <p className="text-xs text-[#5C4B38] mt-1">Must be exactly 13 digits</p>
                </div>
                <div>
                  <label htmlFor="receipt" className="block text-sm font-medium text-[#3F2E1E] mb-2">Upload Receipt / Screenshot (required)</label>
                  <input
                    type="file"
                    id="receipt"
                    name="receipt"
                    accept="image/*,application/pdf"
                    onChange={handleFileChange}
                    className="w-full p-3 border border-[#f2e4ce] rounded-lg bg-white"
                    required
                  />
                  {receiptFile && (
                    <p className="text-xs text-[#5C4B38] mt-1">Selected: {receiptFile.name}</p>
                  )}
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`w-full bg-[#118B50] text-white py-3 px-4 rounded-lg transition duration-300 ${
                    isSubmitting ? 'opacity-60 cursor-not-allowed' : 'hover:bg-[#0F7A45]'
                  }`}
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Donation'}
                </button>
                <p className="text-center text-sm text-[#5C4B38]">
                  You will receive a confirmation email with your donation receipt
                </p>
              </form>
            </div>
          )}

          <div className="text-center text-[#5C4B38] p-6 rounded-lg border border-[#f2e4ce] bg-white">
            <p className="mb-2 text-lg">Your donation is tax-deductible and will be used to support our shrine's mission.</p>
            <p className="text-md">For questions about donations, please contact us at <span className="text-[#CD8B3E] font-semibold">donations@sanvicenteferrer.com</span></p>
          </div>
        </div>
      </div>

      {/* Success Message Modal */}
      {showSuccessMessage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl border border-[#f2e4ce] shadow-2xl max-w-md w-full mx-4">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-[#3F2E1E] mb-2">Donation Submitted!</h3>
              <p className="text-[#5C4B38] mb-6">Thank you for your donation! Your receipt has been submitted.</p>
              <button
                onClick={handleCloseSuccessMessage}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Give;