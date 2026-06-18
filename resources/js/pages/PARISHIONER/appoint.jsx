import React from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import '../../../css/appoint.css';
import '../../../css/pray.css';
import { useState, useEffect } from 'react';

// Define SVG Icons for sacraments
const BaptismIcon = <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-6 h-6 text-[#CD8B3E]"><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z" /></svg>;
const ConfirmationIcon = <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-6 h-6 text-[#CD8B3E]"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" /></svg>;
const EucharistIcon = <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-6 h-6 text-[#CD8B3E]"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" /></svg>;
const MatrimonyIcon = <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-6 h-6 text-[#CD8B3E]"><path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" /></svg>;
const ConfessionIcon = <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-6 h-6 text-[#CD8B3E]"><path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z" /></svg>;
const AnointingIcon = <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-6 h-6 text-[#CD8B3E]"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg>;

const Appoint = () => {
    const [selectedSacrament, setSelectedSacrament] = React.useState('');
    const [showCalendar, setShowCalendar] = React.useState(false);
    const [selectedDate, setSelectedDate] = React.useState(null);
    const [showTimeSlots, setShowTimeSlots] = useState(false);
    const [selectedTimeSlot, setSelectedTimeSlot] = useState(null);

    // Debug log to check selectedTimeSlot changes
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    const [sacraments, setSacraments] = useState([]);
    const [timeSlots, setTimeSlots] = useState([]);
    const [dateAvailability, setDateAvailability] = useState({});
    const [showConfirmation, setShowConfirmation] = useState(false);
    const [showSuccessMessage, setShowSuccessMessage] = useState(false);
    const [selectedSacramentRequirements, setSelectedSacramentRequirements] = useState([]);

    useEffect(() => {
      // Fetch sacraments
      fetch('/api/sacrament-types', {
        headers: {
          'Accept': 'application/json',
        },
        credentials: 'include',
      })
        .then(res => res.json())
        .then(data => setSacraments(data));

      // Fetch time slots
      fetch('/api/sacrament-appointments/available-slots', {
        headers: {
          'Accept': 'application/json',
        },
        credentials: 'include',
      })
        .then(res => res.json())
        .then(data => {
          setTimeSlots(data.slots || data); // Handle both new and old format
          setDateAvailability(data.date_availability || {});
        });
    }, []);

        // Update selected sacrament requirements whenever selection or sacraments list changes
        useEffect(() => {
            const sacr = sacraments.find(s => s.id === selectedSacrament);
            if (sacr && sacr.requirements) {
                const reqs = String(sacr.requirements)
                    .split('\n')
                    .map(r => r.trim())
                    .filter(Boolean);
                setSelectedSacramentRequirements(reqs);
            } else {
                setSelectedSacramentRequirements([]);
            }
        }, [selectedSacrament, sacraments]);

    // Helper function to parse time string and return minutes since midnight for sorting
    const parseStartTime = (timeString) => {
        if (!timeString) return 9999;
        
        // Extract start time (before " - ")
        const parts = timeString.split(' - ');
        const startTime = parts[0].trim();
        
        // Parse time format like "7:00 AM" or "07:00 AM"
        const match = startTime.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
        if (match) {
            let hour = parseInt(match[1], 10);
            const minute = parseInt(match[2], 10);
            const period = match[3].toUpperCase();
            
            // Convert to 24-hour format
            if (period === 'PM' && hour !== 12) {
                hour += 12;
            } else if (period === 'AM' && hour === 12) {
                hour = 0;
            }
            
            return hour * 60 + minute;
        }
        
        return 9999;
    };

    // Filter and sort available slots for the selected date (earliest first)
    const availableSlots = timeSlots
        .filter(slot => slot.date === selectedDate && slot.status === 'available')
        .sort((a, b) => {
            const timeA = parseStartTime(a.time);
            const timeB = parseStartTime(b.time);
            return timeA - timeB;
        });

    // Check if the selected date is fully booked
    const isDateFullyBooked = selectedDate && dateAvailability[selectedDate]?.is_fully_booked;

    // Helper function to format date as YYYY-MM-DD without timezone conversion
    const formatDateToString = (date) => {
        if (!date) return null;
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    // Helper function to format date for display without timezone conversion
    const formatDateForDisplay = (dateString) => {
        if (!dateString) return '';
        const [year, month, day] = dateString.split('-').map(Number);
        const date = new Date(year, month - 1, day);
        return date.toDateString();
    };

    const handleDateSelect = (date) => {
        setSelectedDate(date ? formatDateToString(date) : null); // "YYYY-MM-DD"
        setShowCalendar(false);
        setShowTimeSlots(true);
        setSelectedTimeSlot(null);
        setError(null);
        setSuccess(null);
    };

    const handleNextClick = () => {
        if (!selectedSacrament || !selectedDate || !selectedTimeSlot) {
            setError('Please select sacrament, date, and time slot.');
            return;
        }
        setError(null);
        setSuccess(null);
        setShowConfirmation(true);
    };

    const handleConfirmBooking = async () => {
        setShowConfirmation(false);
        setLoading(true);
        setError(null);
        setSuccess(null);

        try {
            const response = await fetch('/api/sacrament-appointments', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({
                    sacrament_type: selectedSacrament,
                    preferred_date: selectedDate,
                    time_slot_id: selectedTimeSlot,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to book appointment');
            }

            setSuccess('Appointment booked successfully!');
            setShowSuccessMessage(true);
            
            // Refresh available slots to reflect the booking
            fetch('/api/sacrament-appointments/available-slots', {
                headers: {
                    'Accept': 'application/json',
                },
                credentials: 'include',
            })
                .then(res => res.json())
                .then(data => {
                    setTimeSlots(data.slots || data);
                    setDateAvailability(data.date_availability || {});
                });
            
            setSelectedSacrament('');
            setSelectedDate(null);
            setSelectedTimeSlot(null);
            setShowCalendar(false);
            setShowTimeSlots(false);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleCancelConfirmation = () => {
        setShowConfirmation(false);
    };

    const handleCloseSuccessMessage = () => {
        setShowSuccessMessage(false);
        setSuccess(null);
    };

    return (
        <div className="appoint-page min-h-screen pb-20 bg-[#DED0B6]">
            {/* Header Section - match pray page design */}
            <section className="prayer-hero text-center">
                <div className="bg-white border border-[#f2e4ce] shadow-lg p-8 pb-10 w-full mt-6">
                    <h1 className="text-5xl font-extrabold text-[#3F2E1E] mb-3 tracking-tight font-['Times_New_Roman']">Schedule a Sacrament</h1>
                    <p className="text-lg text-[#5C4B38] max-w-2xl mx-auto leading-relaxed">
                        Schedule your sacrament appointment with us. Choose from our available sacraments and select your preferred date.
                    </p>
                </div>
            </section>

            {/* Main Content - below header, no negative margin */}
            <div className="flex flex-col md:flex-row gap-8 w-full max-w-6xl mx-auto mt-8">
                <div className="flex-1 space-y-8">
                    <div className="bg-white rounded-2xl border border-[#f2e4ce] shadow-lg p-8">
                        <h2 className="text-2xl font-semibold text-[#3F2E1E] mb-4">Choose a Sacrament</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {sacraments.map(sacrament => (
                                <button
                                    key={sacrament.id}
                                    onClick={() => {
                                        setSelectedSacrament(sacrament.id);
                                        setShowCalendar(true);
                                        setShowTimeSlots(false);
                                        setSelectedDate(null);
                                        setError(null);
                                        setSuccess(null);
                                    }}
                                    className={`sacrament-card p-4 border border-[#f2e4ce] rounded-lg text-left hover:border-[#CD8B3E] transition-colors ${
                                        selectedSacrament === sacrament.id ? 'ring-2 ring-[#CD8B3E] bg-[#CD8B3E]/5' : ''
                                    }`}
                                >
                                    <div className="flex items-center mb-2">
                                        <div className="p-2 rounded-full bg-[#FFEBC9] mr-3">{sacrament.icon}</div>
                                        <h3 className="font-medium text-[#3F2E1E]">{sacrament.name}</h3>
                                    </div>
                                    <p className="text-sm text-[#5C4B38]">{sacrament.description}</p>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Calendar always visible after sacrament selection */}
                    {selectedSacrament && (
                        <div className="bg-white rounded-2xl p-4 border border-[#f2e4ce] shadow-lg">
                            <h2 className="text-2xl font-semibold text-[#3F2E1E] mb-4">Select a Date</h2>
                            <div className="calendar-container">
                                <DatePicker
                                    selected={selectedDate ? (() => {
                                        const [year, month, day] = selectedDate.split('-').map(Number);
                                        return new Date(year, month - 1, day);
                                    })() : null}
                                    onChange={handleDateSelect}
                                    minDate={new Date()}
                                    inline
                                    className="w-full p-2 border border-[#f2e4ce] rounded-lg"
                                    calendarClassName="custom-calendar"
                                    dayClassName={(date) => {
                                        const today = new Date();
                                        today.setHours(0, 0, 0, 0);
                                        const dateStr = formatDateToString(date);
                                        const isToday = date.getFullYear() === today.getFullYear() && 
                                                       date.getMonth() === today.getMonth() && 
                                                       date.getDate() === today.getDate();
                                        const isSelected = selectedDate && dateStr === selectedDate;
                                        const dateForComparison = new Date(date);
                                        dateForComparison.setHours(0, 0, 0, 0);
                                        const isPast = dateForComparison < today;
                                        
                                        let className = 'custom-day';
                                        if (isToday) className += ' today';
                                        if (isSelected) className += ' selected';
                                        if (isPast) className += ' past';
                                        
                                        return className;
                                    }}
                                    renderCustomHeader={({
                                        monthDate,
                                        customHeaderCount,
                                        decreaseMonth,
                                        increaseMonth,
                                    }) => (
                                        <div className="custom-header">
                                            <button
                                                type="button"
                                                onClick={decreaseMonth}
                                                className="nav-button prev"
                                            >
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"/>
                                                </svg>
                                            </button>
                                            <h3 className="month-year">
                                                {monthDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                                            </h3>
                                            <button
                                                type="button"
                                                onClick={increaseMonth}
                                                className="nav-button next"
                                            >
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"/>
                                                </svg>
                                            </button>
                                        </div>
                                    )}
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* Time Slot Panel - only show if a date is selected */}
                {selectedSacrament && selectedDate && (
                    <div className="w-full md:w-[420px] bg-white border border-[#f2e4ce] shadow-lg rounded-2xl p-6 flex-shrink-0" style={{ minWidth: 340, marginTop: 0 }}>
                        <h2 className="text-xl font-bold text-[#B77B35] mb-2">Step 2: Select {selectedSacrament ? sacraments.find(s => s.id === selectedSacrament)?.name : ''} Schedule</h2>
                        <div className="text-[#3F2E1E] mb-2">
                            <span className="font-semibold">Date</span><br />
                            <span className="text-[#B77B35] text-lg font-bold">
                                {selectedDate ? formatDateForDisplay(selectedDate) : ''}
                            </span>
                        </div>
                        <div className="border-t border-[#e2cfa3] my-2"></div>
                        {isDateFullyBooked ? (
                            <div className="text-center py-8">
                                <div className="text-red-600 text-lg font-semibold mb-2">Fully Booked</div>
                                <p className="text-[#5C4B38]">This date is fully booked. Please select another date.</p>
                            </div>
                        ) : availableSlots.length > 0 ? (
                            <>
                        <div className="text-[#3F2E1E] text-center mb-2 font-medium">Please select on these available timeslots</div>
                        <div className="flex flex-col gap-3">
                                    {availableSlots.map(slot => (
                                <button
                                            key={slot.id}
                            onClick={() => setSelectedTimeSlot(slot.id)}
                            className={`w-full py-3 rounded-lg border text-lg font-semibold transition-all duration-200
                                                ${selectedTimeSlot === slot.id ? 'bg-[#CD8B3E] text-white border-[#CD8B3E]' : 'bg-white text-[#B77B35] border-[#CD8B3E] hover:bg-[#FFEBC9]'}`}
                        >
                            {slot.time}
                        </button>
                            ))}
                        </div>
                            </>
                        ) : (
                            <div className="text-center py-8">
                                <div className="text-[#5C4B38] text-lg font-semibold mb-2">No Available Slots</div>
                                <p className="text-[#5C4B38]">No time slots available for this date. Please select another date.</p>
                            </div>
                        )}
                        <button
                            className="w-full mt-6 bg-[#118B50] text-white py-3 px-4 rounded-lg hover:bg-[#0F7A45] transition-colors font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={!selectedTimeSlot || loading || isDateFullyBooked || availableSlots.length === 0}
                            onClick={handleNextClick}
                        >
                            {loading ? 'Booking...' : 'Book Now'}
                        </button>
                        {error && <p className="text-red-600 mt-2">{error}</p>}
                        {success && <p className="text-green-600 mt-2">{success}</p>}
                                                {/* Sacrament-specific requirements shown below the booking button */}
                                                {selectedSacrament && (
                                                    <div className="mt-4 bg-[#FFF6E5] p-3 rounded-lg text-[#5C4B38] border border-[#f2e4ce]">
                                                        <div className="font-semibold text-[#3F2E1E] mb-2">Requirements</div>
                                                        {selectedSacramentRequirements.length > 0 ? (
                                                            <ul className="list-disc list-inside text-sm space-y-1">
                                                                {selectedSacramentRequirements.map((req, idx) => (
                                                                    <li key={idx}>{req}</li>
                                                                ))}
                                                            </ul>
                                                        ) : (
                                                            <div className="text-sm">No specific requirements for this sacrament.</div>
                                                        )}
                                                        <div className="text-xs text-[#7a634a] mt-2">Please prepare the documents above and arrive a few minutes early.</div>
                                                    </div>
                                                )}
                    </div>
                )}
            </div>

            {/* Confirmation Modal */}
            {showConfirmation && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl border border-[#f2e4ce] shadow-2xl max-w-md w-full mx-4">
                        <div className="p-6">
                            {/* Header */}
                            <div className="text-center mb-6">
                                <div className="w-16 h-16 bg-[#FFEBC9] rounded-full flex items-center justify-center mx-auto mb-4">
                                    <svg className="w-8 h-8 text-[#CD8B3E]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <h3 className="text-2xl font-bold text-[#3F2E1E] mb-2 text-center">Confirm Your Appointment</h3>
                                <p className="text-[#5C4B38] text-center">Please review your appointment details before confirming</p>
                            </div>

                            {/* Appointment Details */}
                            <div className="bg-[#FFEBC9] rounded-lg p-4 mb-6">
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center">
                                        <span className="font-medium text-[#3F2E1E]">Sacrament:</span>
                                        <span className="font-bold text-[#CD8B3E]">
                                            {sacraments.find(s => s.id === selectedSacrament)?.name || 'N/A'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="font-medium text-[#3F2E1E]">Date:</span>
                                        <span className="font-bold text-[#CD8B3E]">
                                            {selectedDate ? (() => {
                                                const [year, month, day] = selectedDate.split('-').map(Number);
                                                const date = new Date(year, month - 1, day);
                                                return date.toLocaleDateString('en-US', {
                                                    weekday: 'long',
                                                    year: 'numeric',
                                                    month: 'long',
                                                    day: 'numeric'
                                                });
                                            })() : 'N/A'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="font-medium text-[#3F2E1E]">Time:</span>
                                        <span className="font-bold text-[#CD8B3E]">
                                            {timeSlots.find(slot => slot.id === selectedTimeSlot)?.time || 'N/A'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-3">
                                <button
                                    onClick={handleCancelConfirmation}
                                    className="flex-1 py-2 px-3 border border-[#CD8B3E] text-[#CD8B3E] rounded-lg hover:bg-[#FFEBC9] transition-colors font-medium text-sm"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleConfirmBooking}
                                    disabled={loading}
                                    className="flex-1 py-2 px-3 bg-[#118B50] text-white rounded-lg hover:bg-[#0F7A45] transition-colors font-bold disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                                >
                                    {loading ? 'Booking...' : 'Confirm Appointment'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

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
                            <h3 className="text-xl font-bold text-[#3F2E1E] mb-2">Appointment Confirmed!</h3>
                            <p className="text-[#5C4B38] mb-6">Your appointment has been successfully booked.</p>
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

// Add custom calendar styles
const calendarStyles = document.createElement('style');
calendarStyles.innerHTML = `
  .custom-calendar {
    background: #fff;
    border: 2px solid #f2e4ce;
    border-radius: 16px;
    padding: 20px;
    box-shadow: 0 8px 32px rgba(63, 46, 30, 0.1);
    font-family: 'Times New Roman', serif;
  }

  .custom-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    padding-bottom: 15px;
    border-bottom: 2px solid #f2e4ce;
  }

  .month-year {
    font-size: 1.5rem;
    font-weight: bold;
    color: #3F2E1E;
    margin: 0;
  }

  .nav-button {
    background: #CD8B3E;
    color: white;
    border: none;
    border-radius: 50%;
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s ease;
    box-shadow: 0 2px 8px rgba(205, 139, 62, 0.3);
  }

  .nav-button:hover {
    background: #B77B35;
    transform: scale(1.05);
    box-shadow: 0 4px 12px rgba(205, 139, 62, 0.4);
  }

  .custom-calendar .react-datepicker__day-names {
    display: flex;
    justify-content: space-between;
    margin-bottom: 10px;
  }

  .custom-calendar .react-datepicker__day-name {
    color: #CD8B3E;
    font-weight: bold;
    font-size: 0.9rem;
    width: 40px;
    text-align: center;
    padding: 8px 0;
  }

  .custom-calendar .react-datepicker__week {
    display: flex;
    justify-content: space-between;
    margin-bottom: 8px;
  }

  .custom-day {
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    cursor: pointer;
    transition: all 0.2s ease;
    font-weight: 500;
    color: #3F2E1E;
    border: 2px solid transparent;
  }

  .custom-day:hover {
    background: #FFEBC9;
    transform: scale(1.1);
    border-color: #CD8B3E;
  }

  .custom-day.today {
    background: #CD8B3E;
    color: white;
    font-weight: bold;
    box-shadow: 0 2px 8px rgba(205, 139, 62, 0.4);
  }

  .custom-day.selected {
    background: #B77B35;
    color: white;
    font-weight: bold;
    box-shadow: 0 4px 12px rgba(183, 123, 53, 0.5);
    transform: scale(1.1);
  }

  .custom-day.past {
    color: #ccc;
    cursor: not-allowed;
    background: #f8f8f8;
  }

  .custom-day.past:hover {
    background: #f8f8f8;
    transform: none;
    border-color: transparent;
  }

  .custom-calendar .react-datepicker__day--outside-month {
    color: #ddd;
  }

  .custom-calendar .react-datepicker__day--disabled {
    color: #ddd;
    cursor: not-allowed;
  }

  .custom-calendar .react-datepicker__day--disabled:hover {
    background: transparent;
    transform: none;
  }
`;

if (!document.head.querySelector('style[data-calendar-custom]')) {
  calendarStyles.setAttribute('data-calendar-custom', 'true');
  document.head.appendChild(calendarStyles);
}

export default Appoint;
