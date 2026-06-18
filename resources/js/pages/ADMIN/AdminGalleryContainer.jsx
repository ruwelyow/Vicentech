import React, { useState, useEffect, useCallback } from 'react';
import AdminGallery from './AdminGallery';
import { api } from '../../utils/axios';

const AdminGalleryContainer = () => {
  const [albums, setAlbums] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [activeAlbumId, setActiveAlbumId] = useState(null);
  const [addingAlbum, setAddingAlbum] = useState(false);
  const [albumFields, setAlbumFields] = useState({ title: '', description: '' });
  const [editingAlbumId, setEditingAlbumId] = useState(null);
  const [editingAlbumFields, setEditingAlbumFields] = useState({ title: '', description: '' });
  const [addingImagesToAlbumId, setAddingImagesToAlbumId] = useState(null);
  
  const [newImages, setNewImages] = useState([]);

  const fetchAlbums = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/albums');
      let albumsArr = [];
      if (Array.isArray(response.data)) {
        albumsArr = response.data;
      } else if (response.data && Array.isArray(response.data.data)) {
        albumsArr = response.data.data;
      } else {
        albumsArr = [];
      }
      setAlbums(albumsArr);
    } catch (err) {
      setError('Failed to fetch albums.');
      setAlbums([]);
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAlbums();
  }, [fetchAlbums]);

  const handleAddAlbum = () => {
    setAddingAlbum(true);
    setEditingAlbumId(null);
  };

  const handleSaveAlbum = async () => {
    try {
      await api.post('/admin/albums', albumFields);
      setAddingAlbum(false);
      setAlbumFields({ title: '', description: '' });
      fetchAlbums();
      setError(null);
    } catch (err) {
      console.error('Save album error:', err);
      if (err.response && err.response.data) {
        if (typeof err.response.data.message === 'string') {
          setError(err.response.data.message);
        } else {
          const messages = Object.values(err.response.data.errors || {}).flat();
          setError(messages.join(' ') || 'Failed to save album. An unknown error occurred.');
        }
      } else {
        setError('Failed to save album. Please check your network connection and try again.');
      }
    }
  };

  const handleEditAlbum = (album) => {
    setEditingAlbumId(album.id);
    setEditingAlbumFields({ title: album.title, description: album.description });
    setAddingAlbum(false);
  };

  const handleSaveEditAlbum = async () => {
    try {
      await api.put(`/admin/albums/${editingAlbumId}`, editingAlbumFields);
      setEditingAlbumId(null);
      setEditingAlbumFields({ title: '', description: '' });
      fetchAlbums();
    } catch (err) {
      setError('Failed to update album.');
      console.error(err);
    }
  };

  const handleDeleteAlbum = async (albumId) => {
    if (window.confirm('Are you sure you want to delete this album?')) {
      try {
        await api.delete(`/admin/albums/${albumId}`);
        fetchAlbums();
      } catch (err) {
        setError('Failed to delete album.');
        console.error(err);
      }
    }
  };

  const handleAddImagesToAlbum = (albumId) => {
    setAddingImagesToAlbumId(albumId);
    setNewImages([]);
  };

  const handleAlbumImageFilesChange = (e) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files).map(file => ({
        file,
        preview: URL.createObjectURL(file),
        title: file.name.split('.').slice(0, -1).join('.') || file.name
      }));
      setNewImages(filesArray);
    }
  };
  
  const handleNewImageMetaChange = (index, field, value) => {
    const updatedImages = [...newImages];
    updatedImages[index] = { ...updatedImages[index], [field]: value };
    setNewImages(updatedImages);
  };

  const handleSaveAlbumImages = async () => {
    if (newImages.length === 0) {
      setError("Please select images to upload.");
      return;
    }

    const formData = new FormData();
    newImages.forEach((img) => {
      formData.append('images[]', img.file);
      formData.append('titles[]', img.title);
    });

    try {
      setLoading(true);
      await api.post(`/admin/albums/${addingImagesToAlbumId}/images`, formData, {
        onUploadProgress: (progressEvent) => {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          console.log(`Container gallery upload progress: ${progress}%`);
        }
      });

      newImages.forEach(img => URL.revokeObjectURL(img.preview));
      setAddingImagesToAlbumId(null);
      setNewImages([]);
      fetchAlbums();
      setError(null);
    } catch (err) {
      setError('Failed to upload images.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteImageFromAlbum = async (albumId, imageId) => {
    if (window.confirm('Are you sure you want to delete this image?')) {
      try {
        await api.delete(`/admin/albums/${albumId}/images/${imageId}`);
        fetchAlbums();
      } catch (err) {
        setError('Failed to delete image.');
        console.error(err);
      }
    }
  };

  const handleUpdateImage = async (imageId, data) => {
    try {
      await api.put(`/admin/albums/images/${imageId}`, data);
      fetchAlbums(); // Re-fetch albums to show updated image data
    } catch (err) {
      setError('Failed to update image.');
      console.error(err);
    }
  };

  if (loading) return <div className="loading-users">Loading gallery...</div>;

  return (
    <>
      {error && <p style={{ color: '#dc3545', backgroundColor: '#f8d7da', border: '1px solid #f5c6cb', padding: '1rem', borderRadius: '8px', marginBottom: '1rem' }}>{error}</p>}
      <AdminGallery
        albums={albums}
        activeAlbumId={activeAlbumId}
        addingAlbum={addingAlbum}
        albumFields={albumFields}
        editingAlbumId={editingAlbumId}
        editingAlbumFields={editingAlbumFields}
        addingImagesToAlbumId={addingImagesToAlbumId}
        newImages={newImages}
        handleDeleteImageFromAlbum={handleDeleteImageFromAlbum}
        handleUpdateImage={handleUpdateImage}
        setActiveAlbumId={setActiveAlbumId}
        setAlbumFields={setAlbumFields}
        handleAddAlbum={handleAddAlbum}
        handleSaveAlbum={handleSaveAlbum}
        setAddingAlbum={setAddingAlbum}
        handleEditAlbum={handleEditAlbum}
        setEditingAlbumFields={setEditingAlbumFields}
        handleSaveEditAlbum={handleSaveEditAlbum}
        setEditingAlbumId={setEditingAlbumId}
        handleAddImagesToAlbum={handleAddImagesToAlbum}
        handleAlbumImageFilesChange={handleAlbumImageFilesChange}
        handleNewImageMetaChange={handleNewImageMetaChange}
        handleSaveAlbumImages={handleSaveAlbumImages}
        setAddingImagesToAlbumId={setAddingImagesToAlbumId}
        handleDeleteAlbum={handleDeleteAlbum}
      />
    </>
  );
};

export default AdminGalleryContainer; 