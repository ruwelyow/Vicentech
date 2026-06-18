import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../../utils/axios';
import '../../../css/home.css';

const NewsDetail = () => {
  const { id } = useParams();
  const [news, setNews] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.get(`/news/${id}`)
      .then(res => setNews(res.data))
      .catch(() => setNews(null))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #DED0B6 0%, #F5E6D3 100%)',
      fontSize: '1.3rem',
      fontWeight: '600',
      color: '#CD8B3E',
      textShadow: '0 2px 4px rgba(0,0,0,0.1)',
      letterSpacing: '1px'
    }}>
      Loading...
    </div>
  );
  if (!news) return null;

  return (
    <div style={{ minHeight: '100vh', background: '#DED0B6', padding: '2rem 0' }}>
      <div style={{ maxWidth: 1100, margin: '100px auto 0 auto', background: '#fff', borderRadius: 18, boxShadow: '0 4px 24px rgba(205,139,62,0.10)', border: '2px solid #f2e4ce', overflow: 'hidden', padding: '2rem 1.5rem' }}>
        <h1 style={{ color: '#3F2E1E', fontFamily: 'Merriweather, serif', fontWeight: 900, fontSize: '2.2rem', marginBottom: 8, letterSpacing: 0.5, textAlign: 'center' }}>{news.title}</h1>
        <div style={{ color: '#888', fontSize: '1.05rem', marginBottom: 24, textAlign: 'center', fontFamily: 'Georgia, serif' }}>
          Published: {news.date || news.created_at?.split('T')[0]}
        </div>
        {news.image && (
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 28, background: '#fff', borderRadius: 12, boxShadow: '0 4px 18px rgba(205,139,62,0.13)' }}>
            <img
              src={news.image.startsWith('data:') ? news.image : `/storage/${news.image}`}
              alt={news.title}
              style={{ width: '100%', maxWidth: 1000, height: 520, objectFit: 'cover', background: '#fff', borderRadius: 12 }}
            />
          </div>
        )}
        <hr style={{width: '70%', margin: '0 auto 24px auto', border: 'none', borderTop: '2px solid #CD8B3E', opacity: 0.5, borderRadius: 2}} />
        <div style={{ color: '#5C4B38', fontSize: '1.13rem', lineHeight: 1.8, fontFamily: 'Georgia, serif', background: 'rgba(205,139,62,0.06)', borderRadius: 10, padding: '1.2rem 1.5rem', boxShadow: '0 2px 8px rgba(205,139,62,0.06)', textAlign: 'justify', maxWidth: 900, margin: '0 auto' }}>
          {news.content || news.description || news.quote || 'No content.'}
        </div>
      </div>
    </div>
  );
};

export default NewsDetail; 