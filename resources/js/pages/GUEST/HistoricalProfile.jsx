import React from 'react';
import '../../../css/home.css';

const HistoricalProfile = () => {
  return (
    <div style={{ minHeight: '100vh', background: '#DED0B6', padding: '2rem 0' }}>
      <div style={{ maxWidth: 1100, margin: '100px auto 0 auto', background: '#fff', borderRadius: 18, boxShadow: '0 4px 24px rgba(205,139,62,0.10)', border: '2px solid #f2e4ce', overflow: 'hidden', padding: '2rem 1.5rem' }}>
        <h1 style={{ color: '#3F2E1E', fontFamily: 'Merriweather, serif', fontWeight: 900, fontSize: '2.5rem', marginBottom: 8, letterSpacing: 0.5, textAlign: 'center' }}>
          454th Fiesta Señor: The Untold History of Faith
        </h1>
        <div style={{ color: '#888', fontSize: '1.05rem', marginBottom: 24, textAlign: 'center', fontFamily: 'Georgia, serif' }}>
          Published: January 16, 2019
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 28, background: '#fff', borderRadius: 12 }}>
          <img
            src="/images/SanVicente-Vested.jpg"
            alt="San Vicente Ferrer"
            style={{ width: '100%', maxWidth: 420, height: 600, objectFit: 'cover', background: '#fff', borderRadius: 12 }}
            draggable="false"
            onContextMenu={(e) => e.preventDefault()}
          />
        </div>
        <hr style={{width: '70%', margin: '0 auto 24px auto', border: 'none', borderTop: '2px solid #CD8B3E', opacity: 0.5, borderRadius: 2}} />
        <div style={{ color: '#5C4B38', fontSize: '1.13rem', lineHeight: 1.8, fontFamily: 'Georgia, serif', background: 'rgba(205,139,62,0.06)', borderRadius: 10, padding: '1.2rem 1.5rem', boxShadow: '0 2px 8px rgba(205,139,62,0.06)', textAlign: 'justify', maxWidth: 900, margin: '0 auto' }}>
        The parish church of San Vicente Ferrer in Mamatid, Cabuyao, traces its origins to the miraculous discovery of the patron saint’s image beneath a large tree on the church's current site. The villagers built a small chapel at the location, and later, the land was donated to the Church by the affluent Bella family of Cabuyao. On April 5, 1946, the chapel became a parish church under the Diocese of Lipa, Batangas. Devotion to San Vicente Ferrer flourished, spreading to neighboring towns and cities, with parishioners embracing the saint's habits, participating in the grand annual fiesta, and showing strong devotion through frequent confessions and the anointing of the sick.<br/><br/>
        Over time, a series of dedicated parish priests helped strengthen the Catholic presence in Mamatid, ensuring the area remained free from other religious sects until the early 1990s when new residents brought different church affiliations. The parish church and rectory were gradually expanded to meet the needs of the growing community. In recognition of its vibrant devotion, the parish was elevated to a diocesan shrine on March 26, 2010, continuing to serve as a center of faith and worship for the local and surrounding communities.
        </div>
       
        <div style={{
          background: 'rgba(205,139,62,0.06)',
          borderRadius: 10,
          padding: '1.2rem 1.5rem',
          boxShadow: '0 2px 8px rgba(205,139,62,0.06)',
          maxWidth: 900,
          margin: '0 auto',
          marginTop: 32,
          marginBottom: 32,
        }}>
          <div style={{ position: 'relative', display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
            <img
              src="/images/his.jpg"
              alt="Historical Profile"
              style={{
                width: '100%',
                maxWidth: 700,
                borderRadius: 18,
                boxShadow: '0 4px 24px rgba(205,139,62,0.10)',
                objectFit: 'cover',
                filter: 'sepia(0.55) contrast(1.05) brightness(0.95)',
                position: 'relative',
                zIndex: 1,
              }}
              draggable="false"
              onContextMenu={(e) => e.preventDefault()}
            />
            <div style={{
              position: 'absolute',
              top: 0,
              left: '50%',
              transform: 'translateX(-50%)',
              width: '100%',
              height: '100%',
              borderRadius: 18,
              pointerEvents: 'none',
              zIndex: 2,
              background: 'radial-gradient(ellipse at center, rgba(0,0,0,0) 60%, rgba(60,40,10,0.18) 100%)',
            }}></div>
          </div>
          <div style={{ color: '#5C4B38', fontSize: '1.13rem', lineHeight: 1.8, fontFamily: 'Georgia, serif', textAlign: 'justify' }}>
            The parish church of San Vicente Ferrer in Mamatid, Cabuyao, traces its origins to the miraculous discovery of the patron saint’s image beneath a large tree on the church's current site. The villagers built a small chapel at the location, and later, the land was donated to the Church by the affluent Bella family of Cabuyao. On April 5, 1946, the chapel became a parish church under the Diocese of Lipa, Batangas. Devotion to San Vicente Ferrer flourished, spreading to neighboring towns and cities, with parishioners embracing the saint's habits, participating in the grand annual fiesta, and showing strong devotion through frequent confessions and the anointing of the sick.<br/><br/>
            Over time, a series of dedicated parish priests helped strengthen the Catholic presence in Mamatid, ensuring the area remained free from other religious sects until the early 1990s when new residents brought different church affiliations. The parish church and rectory were gradually expanded to meet the needs of the growing community. In recognition of its vibrant devotion, the parish was elevated to a diocesan shrine on March 26, 2010, continuing to serve as a center of faith and worship for the local and surrounding communities.
          </div>
        </div>
      </div>
    </div>
  );
};

export default HistoricalProfile; 