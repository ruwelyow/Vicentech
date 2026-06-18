import React, { useState, useEffect } from 'react';
import '../../../css/pray.css';

const Pray = () => {
  const [activeSection, setActiveSection] = useState('novena');
  const [showBackToTop, setShowBackToTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 300);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (sectionId) => {
    setActiveSection(sectionId);
    const element = document.getElementById(sectionId);
    element?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="prayer-page">
      {/* Hero Section */}
      <section className="prayer-hero text-center">
        <div className="bg-white border border-[#f2e4ce] shadow-lg p-8 pb-10 w-full mt-6">
          <h1 className="text-5xl font-extrabold text-[#3F2E1E] mb-3 tracking-tight font-['Times_New_Roman']">Daily Prayers</h1>
          <p className="text-lg text-[#5C4B38] max-w-2xl mx-auto leading-relaxed">
            Discover the powerful prayers dedicated to our patron saint. May these prayers bring you closer to God and strengthen your faith.
          </p>
        </div>
      </section>

      <div className="bg-white border border-[#f2e4ce] rounded-2xl shadow-lg p-8 max-w-6xl mx-auto -mt-16">
        {/* Quick Navigation */}
        <div className="prayer-nav">
          <button 
            onClick={() => scrollToSection('novena')}
            className={`prayer-nav-link ${activeSection === 'novena' ? 'active' : ''}`}
          >
            Novena
          </button>
          <button 
            onClick={() => scrollToSection('litany')}
            className={`prayer-nav-link ${activeSection === 'litany' ? 'active' : ''}`}
          >
            Litany
          </button>
          <button 
            onClick={() => scrollToSection('novena-basta')}
            className={`prayer-nav-link ${activeSection === 'novena-basta' ? 'active' : ''}`}
          >
            Novena Prayer
          </button>
          <button 
            onClick={() => scrollToSection('other-prayers')}
            className={`prayer-nav-link ${activeSection === 'other-prayers' ? 'active' : ''}`}
          >
            Other Prayers
          </button>
        </div>

        {/* Novena Section */}
        <section id="novena" className="prayer-section">
          <div className="prayer-section-header">
            <div className="prayer-section-icon">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <h2>Novena to San Vicente Ferrer</h2>
          </div>
          <div className="prayer-content">
            <p>O Glorious Saint Vincent Ferrer, you were chosen by God to be a light to the nations and a preacher of the Gospel to all peoples. Through your powerful intercession, we ask for your help in our present needs.</p>
            <p>We pray that through your example and intercession, we may be filled with the same zeal for souls that you had, and that we may be faithful to our Christian vocation.</p>
            <p>O Saint Vincent Ferrer, pray for us that we may be worthy of the promises of Christ.</p>
          </div>
        </section>

        {/* Litany Section */}
        <section id="litany" className="prayer-section">
          <div className="prayer-section-header">
            <div className="prayer-section-icon">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h2>Litany of San Vicente Ferrer</h2>
          </div>
          <div className="prayer-content">
            <div className="litany-grid">
              <div>
                <p>Lord, have mercy on us.</p>
                <p>Christ, have mercy on us.</p>
                <p>Lord, have mercy on us.</p>
                <p>Christ, hear us.</p>
                <p>Christ, graciously hear us.</p>
                <p>God the Father of Heaven, have mercy on us.</p>
                <p>God the Son, Redeemer of the world, have mercy on us.</p>
              </div>
              <div>
                <p>God the Holy Spirit, have mercy on us.</p>
                <p>Holy Trinity, one God, have mercy on us.</p>
                <p>Saint Vincent Ferrer, pray for us.</p>
                <p>Saint Vincent, most zealous preacher, pray for us.</p>
                <p>Saint Vincent, most faithful servant of God, pray for us.</p>
                <p>Saint Vincent, most humble of men, pray for us.</p>
                <p>Saint Vincent, most patient in suffering, pray for us.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Novena Prayer Section */}
        <section id="novena-basta" className="prayer-section">
          <div className="prayer-section-header">
            <div className="prayer-section-icon">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2>Novena Prayer</h2>
          </div>
          <div className="prayer-content">
            <p>O Glorious Saint Vincent Ferrer, you were known for your powerful preaching and miracles. We come to you with our petitions, trusting in your intercession.</p>
            <p>Through your prayers, may we receive the graces we need in our daily lives. Help us to grow in faith, hope, and charity, and to serve God with all our hearts.</p>
            <p>We ask for your special protection and guidance in all our needs, both spiritual and temporal.</p>
          </div>
        </section>

        {/* Other Prayers Section */}
        <section id="other-prayers" className="prayer-section">
          <div className="prayer-section-header">
            <div className="prayer-section-icon">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <h2>Other Prayers</h2>
          </div>
          <div className="prayer-content">
            <p>O Saint Vincent Ferrer, you were a great miracle worker and preacher. We ask for your intercession in our times of need.</p>
            <p>Help us to follow your example of holiness and dedication to God's work. May we be inspired by your life of prayer and service to others.</p>
            <p>We pray that through your powerful intercession, we may receive the graces we need to live as faithful followers of Christ.</p>
          </div>
        </section>
      </div>

      {/* Back to Top Button */}
      {showBackToTop && (
        <button 
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="back-to-top"
        >
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 10l7-7m0 0l7 7m-7-7v18" />
          </svg>
        </button>
      )}
    </div>
  );
};

export default Pray; 