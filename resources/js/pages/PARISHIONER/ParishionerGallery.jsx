import React, { useEffect, useState } from 'react';
import '../../../css/mass.css';
import { api } from '../../utils/axios';

const ParishionerGallery = () => {
  const [albums, setAlbums] = useState([]);
  const [activeAlbumId, setActiveAlbumId] = useState(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(null);
  const [isImageLoading, setIsImageLoading] = useState(true);
  const [isChangingImage, setIsChangingImage] = useState(false);

  useEffect(() => {
    api.get('/admin/albums')
      .then(res => {
        let albumsArr = [];
        if (Array.isArray(res.data)) {
          albumsArr = res.data;
        } else if (res.data && Array.isArray(res.data.data)) {
          albumsArr = res.data.data;
        } else {
          albumsArr = [];
        }
        setAlbums(albumsArr);
      })
      .catch(() => setAlbums([]));
  }, []);

  const activeAlbum = albums.find(a => a.id === activeAlbumId);

  const handleImageLoad = (index) => {
    setIsImageLoading(false);
  };

  const handleImageChange = (newIndex) => {
    setIsChangingImage(true);
    setSelectedImageIndex(newIndex);
    setTimeout(() => setIsChangingImage(false), 300);
  };

  // Function to truncate text
  const truncateText = (text, maxLength = 50) => {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  return (
    <div className="gallery-page min-h-screen pb-20">
      <section className="gallery-hero text-center">
        <div className="bg-white border border-[#f2e4ce] shadow-lg p-8 pb-10 w-full mt-6">
          <h1 className="text-5xl font-extrabold text-[#3F2E1E] mb-3 tracking-tight font-['Times_New_Roman']">Gallery Albums</h1>
          <p className="text-lg text-[#5C4B38] max-w-2xl mx-auto leading-relaxed">
            Browse memorable moments and parish events captured in our albums.
          </p>
        </div>
      </section>
      <div className="bg-white border border-[#f2e4ce] rounded-2xl shadow-lg p-8 max-w-6xl mx-auto -mt-16">
        {!activeAlbumId ? (
          albums.length === 0 ? (
            <div className="text-center text-[#5C4B38] text-lg my-20">
              <div className="mb-4">
                <svg className="w-16 h-16 mx-auto text-[#CD8B3E]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              No albums available yet.
            </div>
          ) : (
            <div className="gallery-masonry">
              {albums.map((album, idx) => (
                <div
                  key={album.id}
                  className="gallery-item"
                  onClick={() => setActiveAlbumId(album.id)}
                >
                  <div className="gallery-thumbnail">
                    {album.images[0] ? (
                      <img
                        src={album.images[0].image_data ? `data:${album.images[0].image_mime};base64,${album.images[0].image_data}` : 'https://placehold.co/320x120?text=No+Image'}
                        alt={album.title}
                        className="gallery-img"
                      />
                    ) : (
                      <div className="gallery-no-image">
                        <svg className="w-16 h-16 text-[#CD8B3E]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="gallery-info">
                    <h3 className="gallery-name">{truncateText(album.title, 25)}</h3>
                    <p className="gallery-desc">{truncateText(album.description, 45)}</p>
                    <div className="gallery-meta">
                      <span className="gallery-count">{album.images.length} photos</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          <div>
            <div className="album-header-modern">
              <button
                onClick={() => setActiveAlbumId(null)}
                className="back-button-modern"
                aria-label="Back to albums"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div className="album-info-modern">
                <h2 className="album-title-modern">{activeAlbum?.title}</h2>
                {activeAlbum?.description && (
                  <p className="album-description-modern">{activeAlbum.description}</p>
                )}
                <div className="album-stats">
                  <span className="photo-count">{activeAlbum?.images.length} photos</span>
                </div>
              </div>
            </div>
            {activeAlbum?.images.length === 0 ? (
              <div className="empty-album-state">
                <svg className="w-20 h-20 mx-auto text-[#CD8B3E] mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="text-[#5C4B38] text-lg">No images in this album yet.</p>
              </div>
            ) : (
              <div className="album-photos-grid">
                {activeAlbum.images.map((img, idx) => (
                  <div
                    key={img.id}
                    className="photo-item"
                    onClick={() => setSelectedImageIndex(idx)}
                  >
                    <div className="photo-container">
                      <img
                        src={img.image_data ? `data:${img.image_mime};base64,${img.image_data}` : 'https://placehold.co/400x300?text=No+Image'}
                        alt={img.title || 'Album image'}
                        className="photo-image"
                        onLoad={() => handleImageLoad(idx)}
                      />
                      <div className="photo-overlay">
                        <div className="photo-info">
                          <span className="photo-number">{idx + 1}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Image Preview Modal */}
      {selectedImageIndex !== null && activeAlbum && (
        <div 
          className="modal-overlay-simple" 
          onClick={() => setSelectedImageIndex(null)}
        >
          <div 
            className={`modal-content-simple ${isChangingImage ? 'changing' : ''}`}
            onClick={e => e.stopPropagation()} 
          >
            <div className="modal-controls">
              <button
                onClick={() => setSelectedImageIndex(null)}
                className="modal-close-simple"
                aria-label="Close modal"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="image-navigation">
              {selectedImageIndex > 0 && (
                <button
                  onClick={e => { 
                    e.stopPropagation(); 
                    handleImageChange(selectedImageIndex - 1);
                  }}
                  className="nav-button-left"
                  aria-label="Previous image"
                >
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
              )}
              <div className="image-display">
                <img
                  src={activeAlbum.images[selectedImageIndex].image_data ? `data:${activeAlbum.images[selectedImageIndex].image_mime};base64,${activeAlbum.images[selectedImageIndex].image_data}` : 'https://placehold.co/400x300?text=No+Image'}
                  alt={activeAlbum.images[selectedImageIndex].title}
                  className="modal-image-large"
                />
              </div>
              {selectedImageIndex < activeAlbum.images.length - 1 && (
                <button
                  onClick={e => { 
                    e.stopPropagation(); 
                    handleImageChange(selectedImageIndex + 1);
                  }}
                  className="nav-button-right"
                  aria-label="Next image"
                >
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              )}
            </div>
            <div className="image-info-simple">
              <div className="image-title-simple">
                {activeAlbum.images[selectedImageIndex].title || 'Untitled'}
              </div>
              <div className="image-counter-simple">
                {selectedImageIndex + 1} of {activeAlbum.images.length}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ParishionerGallery; 