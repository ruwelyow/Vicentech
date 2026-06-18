import React, { useState, useEffect } from 'react';
import '../../../css/mass.css';

// Fallback data in case API fails
const fallbackSchedules = [
    { day: 'Sunday', time: '6:00 AM', type: 'Regular Mass', celebrant: 'Rev. Fr. [name]' },
    { day: 'Sunday', time: '8:00 AM', type: 'Regular Mass', celebrant: 'Rev. Fr. [name]' },
    { day: 'Sunday', time: '10:00 AM', type: 'Regular Mass', celebrant: 'Rev. Fr. [name]' },
    { day: 'Monday', time: '6:00 AM', type: 'Regular Mass', celebrant: 'Rev. Fr. [name]' },
    { day: 'Tuesday', time: '6:00 AM', type: 'Regular Mass', celebrant: 'Rev. Fr. [name]' },
    { day: 'Wednesday', time: '6:00 AM', type: 'Regular Mass', celebrant: 'Rev. Fr. [name]' },
    { day: 'Thursday', time: '6:00 AM', type: 'Regular Mass', celebrant: 'Rev. Fr. [name]' },
    { day: 'Friday', time: '6:00 AM', type: 'Regular Mass', celebrant: 'Rev. Fr. [name]' },
    { day: 'Saturday', time: '6:00 AM', type: 'Regular Mass', celebrant: 'Rev. Fr. [name]' },
    { day: 'Saturday', time: '5:00 PM', type: 'Anticipated Mass', celebrant: 'Rev. Fr. [name]' },
];

const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const groupByDay = (schedules) => {
    return schedules.reduce((acc, curr) => {
        if (!acc[curr.day]) acc[curr.day] = [];
        acc[curr.day].push(curr);
        return acc;
    }, {});
};

const MassSchedule = () => {
    const [massSchedules, setMassSchedules] = useState(fallbackSchedules);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSchedules = async () => {
            try {
                const response = await fetch('/api/mass-schedules');
                if (response.ok) {
                    const data = await response.json();
                    // Format time for display (convert from HH:mm to h:mm AM/PM)
                    const formattedData = data.map(schedule => ({
                        ...schedule,
                        time: schedule.start_time && schedule.end_time 
                            ? `${formatTime(schedule.start_time)} - ${formatTime(schedule.end_time)}`
                            : formatTime(schedule.time || schedule.start_time)
                    }));
                    setMassSchedules(formattedData);
                } else {
                    console.warn('Failed to fetch schedules, using fallback data');
                }
            } catch (error) {
                console.error('Error fetching mass schedules:', error);
                // Keep fallback data
            } finally {
                setLoading(false);
            }
        };

        fetchSchedules();
    }, []);

    // Function to format time from 24-hour to 12-hour format
    const formatTime = (timeString) => {
        try {
            const [hours, minutes] = timeString.split(':');
            const hour = parseInt(hours);
            const ampm = hour >= 12 ? 'PM' : 'AM';
            const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
            return `${displayHour}:${minutes} ${ampm}`;
        } catch (error) {
            return timeString; // Return original if formatting fails
        }
    };

    const groupedSchedules = groupByDay(massSchedules);

    if (loading) {
        return (
            <div className="mass-schedule-page min-h-screen pb-20">
                <section className="mass-schedule-hero text-center">
                    <div className="bg-white border border-[#f2e4ce] shadow-lg p-8 pb-10 w-full mt-6">
                        <h1 className="text-5xl font-extrabold text-[#3F2E1E] mb-3 tracking-tight font-['Times_New_Roman']">Mass Schedule</h1>
                        <p className="text-lg text-[#5C4B38] max-w-2xl mx-auto leading-relaxed">
                            Loading mass schedules...
                        </p>
                    </div>
                </section>
            </div>
        );
    }

    return (
        <div className="mass-schedule-page min-h-screen pb-20">
            <section className="mass-schedule-hero text-center">
                <div className="bg-white border border-[#f2e4ce] shadow-lg p-8 pb-10 w-full mt-6">
                    <h1 className="text-5xl font-extrabold text-[#3F2E1E] mb-3 tracking-tight font-['Times_New_Roman']">Mass Schedule</h1>
                    <p className="text-lg text-[#5C4B38] max-w-2xl mx-auto leading-relaxed">
                        Join us in the celebration of the Holy Eucharist. Everyone is welcome to attend our regular and special mass offerings throughout the week.
                    </p>
                </div>
            </section>

            <div className="bg-white border border-[#f2e4ce] rounded-2xl shadow-lg p-8 max-w-6xl mx-4 sm:mx-auto -mt-16">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {daysOfWeek.map(day => (
                        <div key={day} className="flex flex-col">
                            <h2 className="text-2xl font-bold text-center text-[#3F2E1E] mb-4 border-b-2 border-[#f2e4ce] pb-2">{day}</h2>
                            <ul className="space-y-3">
                                {(groupedSchedules[day] || []).map((schedule, idx) => (
                                    <li key={`${day}-${idx}`} className="bg-[#FFF6E5] border border-[#f3ddbe] p-4 rounded-lg">
                                        <p className="text-md font-semibold text-[#3F2E1E]">{schedule.time}</p>
                                        <p className="text-sm text-[#6B4E2E]">{schedule.type}</p>
                                        <p className="text-sm text-[#8B6B46] italic">{schedule.celebrant}</p>
                                    </li>
                                ))}
                                {(groupedSchedules[day] || []).length === 0 && (
                                    <li className="text-center text-sm text-gray-400 italic">No Mass Scheduled</li>
                                )}
                            </ul>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default MassSchedule;
