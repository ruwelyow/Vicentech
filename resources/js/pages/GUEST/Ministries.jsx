import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../utils/axios';
import '../../../css/home.css';

const Ministries = () => {
  const navigate = useNavigate();
  const [ministries, setMinistries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/ministries')
      .then(res => {
        setMinistries(Array.isArray(res.data) ? res.data : []);
        setLoading(false);
      })
      .catch(() => {
        setMinistries([]);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '80vh',
        flexDirection: 'column',
        gap: '1rem'
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '3px solid #f3f3f3',
          borderTop: '3px solid #CD8B3E',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
        }}></div>
        <div style={{ color: '#5C4B38', fontSize: '1.1rem', fontWeight: 500 }}>
          Loading ministries...
        </div>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <main style={{ background: '#fff', minHeight: '100vh', padding: '2rem 0' }}>
      <div style={{ 
        maxWidth: '1200px', 
        margin: '0 auto', 
        padding: '0 1.5rem',
        width: '100%',
        boxSizing: 'border-box'
      }}>
        {/* Header */}
        <div style={{ 
          textAlign: 'center', 
          marginBottom: '3rem',
          paddingTop: '2rem'
        }}>
          <h1 style={{ 
            color: '#3F2E1E', 
            fontFamily: 'Merriweather, serif', 
            fontWeight: 500, 
            fontSize: '2.5rem', 
            letterSpacing: 0.5, 
            marginBottom: '0.5rem'
          }}>
            MINISTRIES
          </h1>
          <hr style={{ 
            width: '20%', 
            margin: '0 auto 1rem', 
            borderTop: '2px solid #CD8B3E', 
            opacity: 0.5, 
            borderRadius: 2 
          }} />
          <p style={{ 
            color: '#5C4B38', 
            fontSize: '1.1rem', 
            fontStyle: 'italic',
            maxWidth: '600px',
            margin: '0 auto'
          }}>
            "In prayer and service together, we become the hands and feet of Christ."
          </p>
        </div>

        {/* Ministries Grid */}
        {ministries.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '4rem 2rem',
            background: 'linear-gradient(135deg, #fafbfc 0%, #f8f9fa 100%)',
            borderRadius: '20px',
            border: '1px solid rgba(205, 139, 62, 0.08)',
          }}>
            <h3 style={{ 
              fontSize: '1.5rem', 
              fontWeight: '700', 
              color: '#2d3748', 
              marginBottom: '0.75rem'
            }}>
              No Ministries Available
            </h3>
            <p style={{ 
              color: '#718096', 
              fontSize: '1rem',
              lineHeight: '1.6'
            }}>
              Ministries will be displayed here once they are added.
            </p>
          </div>
        ) : (
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', 
            gap: '2rem',
            padding: '0.5rem'
          }}>
            {ministries.map((ministry) => {
              const imageSrc = ministry.image_data && ministry.image_mime
                ? `data:${ministry.image_mime};base64,${ministry.image_data}`
                : 'https://placehold.co/400x300?text=Ministry';
              
              return (
                <div 
                  key={ministry.id} 
                  style={{ 
                    background: '#fff',
                    borderRadius: '16px',
                    border: '1px solid rgba(205, 139, 62, 0.1)',
                    padding: '0',
                    boxShadow: '0 4px 20px rgba(205, 139, 62, 0.08)',
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                    transition: 'all 0.3s ease',
                    position: 'relative',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = '0 12px 40px rgba(205, 139, 62, 0.15)';
                    e.currentTarget.style.borderColor = 'rgba(205, 139, 62, 0.2)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 20px rgba(205, 139, 62, 0.08)';
                    e.currentTarget.style.borderColor = 'rgba(205, 139, 62, 0.1)';
                  }}
                  onClick={() => navigate(`/ministries/${ministry.id}`)}
                >
                  {/* Image Section */}
                  <div style={{ 
                    position: 'relative',
                    width: '100%', 
                    height: '250px', 
                    overflow: 'hidden',
                    background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)'
                  }}>
                    <img
                      src={imageSrc}
                      alt={ministry.name}
                      style={{ 
                        width: '100%', 
                        height: '100%', 
                        objectFit: 'cover',
                        transition: 'transform 0.3s ease'
                      }}
                    />
                  </div>

                  {/* Content Section */}
                  <div style={{ padding: '1.5rem' }}>
                    {/* Ministry Name */}
                    <h3 style={{ 
                      margin: '0 0 1rem 0', 
                      color: '#2d3748', 
                      fontSize: '1.5rem', 
                      fontWeight: '700',
                      lineHeight: '1.3',
                      letterSpacing: '-0.025em'
                    }}>
                      {ministry.name}
                    </h3>
                    
                    {/* Description */}
                    {ministry.description && (
                      <p style={{ 
                        margin: '0', 
                        color: '#4a5568', 
                        fontSize: '1rem',
                        lineHeight: '1.6',
                        textAlign: 'justify'
                      }}>
                        {ministry.description}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Back Button */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          marginTop: '3rem' 
        }}>
          <button
            style={{
              background: '#fff',
              color: '#CD8B3E',
              border: '2px solid #CD8B3E',
              borderRadius: 8,
              padding: '12px 36px',
              fontSize: '1.1rem',
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: '0 1px 4px rgba(205,139,62,0.10)',
              letterSpacing: 1,
              transition: 'background 0.2s, color 0.2s',
            }}
            onClick={() => navigate('/')}
            onMouseOver={e => { 
              e.target.style.background = '#CD8B3E'; 
              e.target.style.color = '#fff'; 
            }}
            onMouseOut={e => { 
              e.target.style.background = '#fff'; 
              e.target.style.color = '#CD8B3E'; 
            }}
          >
            Back to Home
          </button>
        </div>
      </div>
    </main>
  );
};

export default Ministries;

