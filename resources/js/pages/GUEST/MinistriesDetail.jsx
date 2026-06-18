import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../utils/axios';
import '../../../css/home.css';

const MinistriesDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [ministry, setMinistry] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/ministries/${id}`)
      .then(res => {
        setMinistry(res.data);
        setLoading(false);
      })
      .catch(() => {
        setMinistry(null);
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '80vh',
        flexDirection: 'column',
        gap: '1rem',
        background: '#DED0B6',
        padding: '2rem 0'
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
          Loading ministry...
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

  if (!ministry) {
    return (
      <div style={{ minHeight: '100vh', background: '#DED0B6', padding: '2rem 0', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ color: '#3F2E1E', marginBottom: '1rem' }}>Ministry Not Found</h2>
          <button
            onClick={() => navigate('/')}
            style={{
              background: '#fff',
              color: '#CD8B3E',
              border: '2px solid #CD8B3E',
              borderRadius: 8,
              padding: '12px 36px',
              fontSize: '1.1rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  const imageSrc = ministry.image_data && ministry.image_mime
    ? `data:${ministry.image_mime};base64,${ministry.image_data}`
    : 'https://placehold.co/600x400?text=Ministry';

  return (
    <div style={{ minHeight: '100vh', background: '#DED0B6', padding: '2rem 0' }}>
      <div style={{ 
        maxWidth: 1100, 
        margin: '100px auto 0 auto', 
        background: '#fff', 
        borderRadius: 18, 
        boxShadow: '0 4px 24px rgba(205,139,62,0.10)', 
        border: '2px solid #f2e4ce', 
        overflow: 'hidden', 
        padding: '2rem 1.5rem' 
      }}>
        {/* Back Button */}
        <button
          onClick={() => navigate('/')}
          style={{
            background: 'transparent',
            color: '#CD8B3E',
            border: '2px solid #CD8B3E',
            borderRadius: 8,
            padding: '8px 20px',
            fontSize: '0.95rem',
            fontWeight: 600,
            cursor: 'pointer',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.2s',
          }}
          onMouseOver={e => { 
            e.target.style.background = '#CD8B3E'; 
            e.target.style.color = '#fff'; 
          }}
          onMouseOut={e => { 
            e.target.style.background = 'transparent'; 
            e.target.style.color = '#CD8B3E'; 
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
          Back to Home
        </button>

        {/* Ministry Name */}
        <h1 style={{ 
          color: '#3F2E1E', 
          fontFamily: 'Merriweather, serif', 
          fontWeight: 900, 
          fontSize: '2.5rem', 
          marginBottom: 8, 
          letterSpacing: 0.5, 
          textAlign: 'center' 
        }}>
          {ministry.name}
        </h1>

        {/* Image Section */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          marginBottom: 28, 
          background: '#fff', 
          borderRadius: 12 
        }}>
          <img
            src={imageSrc}
            alt={ministry.name}
            style={{ 
              width: '100%', 
              maxWidth: 600, 
              height: 'auto', 
              maxHeight: 500,
              objectFit: 'cover', 
              background: '#fff', 
              borderRadius: 12,
              boxShadow: '0 4px 24px rgba(205,139,62,0.10)'
            }}
            draggable="false"
            onContextMenu={(e) => e.preventDefault()}
          />
        </div>

        {/* Divider */}
        <hr style={{
          width: '70%', 
          margin: '0 auto 24px auto', 
          border: 'none', 
          borderTop: '2px solid #CD8B3E', 
          opacity: 0.5, 
          borderRadius: 2
        }} />

        {/* Description Section */}
        {ministry.description && (
          <div style={{ 
            color: '#5C4B38', 
            fontSize: '1.13rem', 
            lineHeight: 1.8, 
            fontFamily: 'Georgia, serif', 
            background: 'rgba(205,139,62,0.06)', 
            borderRadius: 10, 
            padding: '1.2rem 1.5rem', 
            boxShadow: '0 2px 8px rgba(205,139,62,0.06)', 
            textAlign: 'justify', 
            maxWidth: 900, 
            margin: '0 auto',
            whiteSpace: 'pre-wrap'
          }}>
            {ministry.description}
          </div>
        )}

        {!ministry.description && (
          <div style={{ 
            color: '#888', 
            fontSize: '1.05rem', 
            textAlign: 'center', 
            fontFamily: 'Georgia, serif',
            fontStyle: 'italic',
            padding: '2rem'
          }}>
            No description available for this ministry.
          </div>
        )}
      </div>
    </div>
  );
};

export default MinistriesDetail;

