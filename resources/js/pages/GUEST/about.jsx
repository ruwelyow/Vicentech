import React, { useEffect, useState } from 'react';
import '../../../css/about.css';
import { api } from '../../utils/axios';

const About = () => {
    const [rectors, setRectors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchRectors = async () => {
            setLoading(true);
            setError('');
            try {
                console.log('About page: Fetching shrine rectors...');
                const res = await api.get('/shrine-rectors');
                console.log('About page: API response:', res.data);
                const rectorsArr = Array.isArray(res.data) ? res.data : (Array.isArray(res.data.data) ? res.data.data : []);
                console.log('About page: Processed rectors:', rectorsArr);
                setRectors(rectorsArr);
            } catch (err) {
                console.error('About page: Error fetching rectors:', err);
                setError('Failed to fetch rectors.');
            } finally {
                setLoading(false);
            }
        };
        fetchRectors();
    }, []);

    const currentRectors = (Array.isArray(rectors) ? rectors : []).filter(r => r.type === 'current');
    const pastRectors = (Array.isArray(rectors) ? rectors : []).filter(r => r.type === 'past');

    console.log('About page render:', {
        loading,
        error,
        rectorsCount: rectors.length,
        currentRectorsCount: currentRectors.length,
        pastRectorsCount: pastRectors.length,
        rectors: rectors
    });

    return (
        <div className="about-page min-h-screen pb-20">
            {/* Current Rectors Section */}
            <section className="about-hero text-center">
                <div className="bg-white border border-[#f2e4ce] shadow-lg p-8 pb-10 w-full mt-16">
                    <h1 className="text-5xl font-extrabold text-[#3F2E1E] mb-3 tracking-tight font-['Times_New_Roman']">Current Shrine Rectors</h1>
                    <p className="text-lg text-[#5C4B38] max-w-2xl mx-auto leading-relaxed">
                        Meet our dedicated parish priests who currently serve and guide our community with faith and devotion.
                    </p>
                </div>
            </section>
            <div className="container-fluid px-5">
                {loading && <div className="text-center my-8">Loading...</div>}
                {error && <div className="text-center my-8 text-red-600">{error}</div>}
                <div className="row w-100 justify-content-center align-items-center mb-5 mt-0" id="current-rectors" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    {currentRectors.map((rector, idx) => (
                        <div
                            key={rector.id || idx}
                            style={{
                                width: '100%',
                                maxWidth: '420px',
                                marginLeft: idx === 1 ? '20px' : 0,
                                marginRight: idx === 0 ? '20px' : 0,
                                display: 'flex',
                                justifyContent: 'center',
                                position: 'relative',
                                marginTop: '60px',
                            }}
                        >
                            <div
                                className="bg-white border border-[#f2e4ce] rounded-2xl shadow-lg profile-card"
                                style={{
                                    width: '100%',
                                    padding: '2rem 1.5rem 1.5rem 1.5rem',
                                    maxWidth: '420px',
                                    minHeight: '480px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    position: 'relative',
                                }}
                            >
                                <div style={{
                                    position: 'absolute',
                                    top: '-60px',
                                    left: '50%',
                                    transform: 'translateX(-50%)',
                                    background: '#fff',
                                    borderRadius: '50%',
                                    padding: '6px',
                                    boxShadow: '0 2px 8px #e2cfa3',
                                }}>
                                    <img
                                        className="priest-image"
                                        src={rector.image ? `/storage/${rector.image}` : '/images/priest1.png'}
                                        alt={rector.name}
                                        style={{ width: '180px', height: '180px', borderRadius: '50%', border: '3px solid #e2cfa3', objectFit: 'cover' }}
                                        onError={e => { e.target.onerror = null; e.target.src = '/images/priest1.png'; }}
                                    />
                                </div>
                                <div style={{ marginTop: '140px', textAlign: 'center', width: '100%' }}>
                                    <h3 style={{ fontSize: '1.3rem', fontWeight: 700, color: '#3F2E1E', marginBottom: '0.3rem' }}>{rector.name}</h3>
                                    <div style={{ color: '#CD8B3E', fontWeight: 600, fontSize: '1.05rem', marginBottom: '0.2rem', textTransform: 'uppercase', letterSpacing: '1px' }}>{rector.title}</div>
                                    <div style={{ color: '#5C4B38', fontSize: '0.98rem', marginBottom: '0.7rem' }}>{rector.years}</div>
                                    <hr style={{ borderColor: '#f2e4ce', width: '100%', margin: '0.8rem 0' }} />
                                    <div style={{ color: '#5C4B38', fontSize: '0.98rem', textAlign: 'center', width: '100%' }}>
                                        <p style={{ margin: 0 }}><strong>Ordination Date:</strong> {rector.ordination_date}</p>
                                        <p style={{ marginTop: '0.7rem', color: '#888', fontWeight: 400 }}>{rector.description}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
                {/* Past Rectors Section */}
                <section className="past-rectors mt-20">
                    <div className="text-center mb-8 flex flex-col items-center">
                        <h2 className="text-4xl font-bold text-[#3F2E1E] mb-3 font-['Times_New_Roman']">Past Shrine Rectors</h2>
                        <hr
                            style={{
                                width: '20%',
                                margin: '0 auto 32px',
                                borderTop: '2px solid #CD8B3E',
                                borderRight: 'none',
                                borderBottom: 'none',
                                borderLeft: 'none',
                                opacity: 0.5,
                                borderRadius: 2,
                            }}
                        />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 px-4">
                        {pastRectors.map((rector, idx) => (
                            <div className="past-rector-card" key={rector.id || idx} style={{ background: '#fff', borderRadius: '18px', boxShadow: '0 4px 18px rgba(205,139,62,0.10)', border: '1.5px solid #f2e4ce', padding: '2.2rem 1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', transition: 'transform 0.3s', minHeight: '400px', height: '400px' }}>
                                <img 
                                    style={{ width: '110px', height: '110px', borderRadius: '50%', border: '3px solid #e2cfa3', marginBottom: '0.5rem', marginTop: '0.5rem', objectFit: 'cover', boxShadow: '0 2px 8px #e2cfa3' }} 
                                    src={rector.image ? `/storage/${rector.image}` : '/images/priest1.png'} 
                                    alt={rector.name}
                                    onError={e => { e.target.onerror = null; e.target.src = '/images/priest1.png'; }}
                                />
                                <div style={{ marginTop: '0.5rem', width: '100%' }}>
                                    <h3 style={{ fontSize: '1.3rem', fontWeight: 700, color: '#3F2E1E', marginBottom: '0.3rem', textAlign: 'center' }}>{rector.name}</h3>
                                    <div style={{ color: '#CD8B3E', fontWeight: 600, fontSize: '1.05rem', marginBottom: '0.2rem', textAlign: 'center', textTransform: 'uppercase', letterSpacing: '1px' }}>{rector.title}</div>
                                    <div style={{ color: '#5C4B38', fontSize: '0.98rem', marginBottom: '0.7rem', textAlign: 'center' }}>{rector.years}</div>
                                    <hr style={{ borderColor: '#f2e4ce', width: '100%', margin: '0.8rem 0' }} />
                                    <div style={{ color: '#5C4B38', fontSize: '0.98rem', textAlign: 'center', width: '100%' }}>
                                        <p style={{ margin: 0 }}><strong>Ordination Date:</strong> {rector.ordination_date}</p>
                                        <p style={{ marginTop: '0.7rem' }}>{rector.description}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            </div>
        </div>
    );
};

export default About;
