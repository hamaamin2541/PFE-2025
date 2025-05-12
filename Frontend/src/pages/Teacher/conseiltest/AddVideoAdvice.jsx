import React, { useState } from 'react';
import { Form, Button, Alert, ProgressBar } from 'react-bootstrap';
import axios from 'axios';
import { API_BASE_URL } from '../../../config/api';

const AddVideoAdvice = () => {
  const [videoFile, setVideoFile] = useState(null);
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState(null);

  const handleVideoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      const validTypes = ['video/mp4', 'video/webm', 'video/quicktime'];
      if (!validTypes.includes(file.type)) {
        setMessage({
          type: 'danger',
          text: 'Format de fichier non supporté. Utilisez MP4, WebM ou MOV.'
        });
        return;
      }

      // Validate file size (100MB max)
      if (file.size > 100 * 1024 * 1024) {
        setMessage({
          type: 'danger',
          text: 'La taille du fichier ne doit pas dépasser 100MB'
        });
        return;
      }

      setVideoFile(file);
      setMessage(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!videoFile || !description.trim()) {
      setMessage({
        type: 'danger',
        text: 'La description et la vidéo sont obligatoires'
      });
      return;
    }

    setLoading(true);
    setMessage(null);

    const formData = new FormData();
    formData.append('content', description.trim());
    formData.append('type', 'video');
    // Ensure this field name matches the one expected in the multer configuration
    formData.append('video', videoFile);

    try {
      const token = localStorage.getItem('token');

      // Log FormData contents
      for (let pair of formData.entries()) {
        console.log('FormData field:', pair[0], pair[1]);
      }

      const response = await axios.post(
        `${API_BASE_URL}/api/teacher-advice`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          },
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            setProgress(percentCompleted);
          }
        }
      );

      if (response.data.success) {
        setMessage({ type: 'success', text: 'Vidéo conseil ajoutée avec succès!' });
        setVideoFile(null);
        setDescription('');
        setProgress(0);
      }
    } catch (error) {
      console.error('Error details:', error.response?.data);
      setMessage({
        type: 'danger',
        text: error.response?.data?.message || 'Erreur lors de l\'ajout du conseil vidéo'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4">
      <h2 className="mb-4">Ajouter un conseil vidéo</h2>

      {message && (
        <Alert variant={message.type} className="mb-4">
          {message.text}
        </Alert>
      )}

      <Form onSubmit={handleSubmit}>
        <Form.Group className="mb-3">
          <Form.Label>Description du conseil</Form.Label>
          <Form.Control
            as="textarea"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            placeholder="Décrivez votre conseil..."
          />
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>Sélectionner une vidéo</Form.Label>
          <Form.Control
            type="file"
            accept="video/mp4,video/webm,video/quicktime"
            onChange={handleVideoUpload}
            required
          />
          <Form.Text className="text-muted">
            Formats supportés: MP4, WebM, MOV. Taille maximale: 100MB
          </Form.Text>
        </Form.Group>

        {progress > 0 && (
          <ProgressBar
            className="mb-3"
            now={progress}
            label={`${progress}%`}
            animated={progress < 100}
          />
        )}

        {videoFile && (
          <div className="mb-3">
            <strong>Fichier sélectionné:</strong> {videoFile.name} ({(videoFile.size / (1024 * 1024)).toFixed(2)} MB)
          </div>
        )}

        <Button
          type="submit"
          variant="primary"
          disabled={loading || !videoFile}
        >
          {loading ? 'Publication en cours...' : 'Publier le conseil'}
        </Button>
      </Form>
    </div>
  );
};

export default AddVideoAdvice;
