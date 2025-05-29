import React, { useState } from 'react';
import { Modal, Form, Button, Alert, Spinner } from 'react-bootstrap';
import { API_BASE_URL } from '../../config/api';
import axios from 'axios';
import './ReclamationForm.css';

const ReclamationForm = ({ show, handleClose }) => {
  const [formData, setFormData] = useState({
    subject: '',
    description: '',
    type: 'other',
    attachments: []
  });
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e) => {
    setFormData(prev => ({
      ...prev,
      attachments: e.target.files
    }));
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.subject.trim()) errors.subject = 'Le sujet est requis';
    if (!formData.description.trim()) errors.description = 'La description est requise';
    if (!formData.type) errors.type = 'Le type est requis';

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      setSubmitting(true);
      setError(null);

      const token = localStorage.getItem('token');

      if (!token) {
        setError('Vous devez être connecté pour soumettre une réclamation');
        return;
      }

      const formDataToSend = new FormData();
      formDataToSend.append('subject', formData.subject);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('type', formData.type);

      if (formData.attachments && formData.attachments.length > 0) {
        for (let i = 0; i < formData.attachments.length; i++) {
          formDataToSend.append('attachments', formData.attachments[i]);
        }
      }

      const response = await axios.post(
        `${API_BASE_URL}/api/complaints`,
        formDataToSend,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      if (response.data.success) {
        setSuccess('Votre réclamation a été soumise avec succès. Notre équipe la traitera dans les plus brefs délais.');
        setFormData({
          subject: '',
          description: '',
          type: 'other',
          attachments: []
        });

        // Close the modal after 3 seconds
        setTimeout(() => {
          handleClose();
          setSuccess(null);
        }, 3000);
      } else {
        setError('Une erreur est survenue lors de la soumission de votre réclamation');
      }
    } catch (err) {
      console.error('Error submitting complaint:', err);
      if (err.response?.status === 401) {
        setError('Vous devez être connecté pour soumettre une réclamation');
      } else {
        setError('Une erreur est survenue lors de la soumission de votre réclamation');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      show={show}
      onHide={handleClose}
      size="lg"
      centered
      className="reclamation-modal"
    >
      <Modal.Header closeButton>
        <Modal.Title>Soumettre une réclamation</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {error && (
          <Alert variant="danger" onClose={() => setError(null)} dismissible>
            {error}
          </Alert>
        )}

        {success && (
          <Alert variant="success" onClose={() => setSuccess(null)} dismissible>
            {success}
          </Alert>
        )}

        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3">
            <Form.Label>Sujet</Form.Label>
            <Form.Control
              type="text"
              name="subject"
              value={formData.subject}
              onChange={handleInputChange}
              isInvalid={!!formErrors.subject}
              placeholder="Entrez le sujet de votre réclamation"
            />
            <Form.Control.Feedback type="invalid">
              {formErrors.subject}
            </Form.Control.Feedback>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Type</Form.Label>
            <Form.Select
              name="type"
              value={formData.type}
              onChange={handleInputChange}
              isInvalid={!!formErrors.type}
            >
              <option value="other">Général</option>
              <option value="technical">Technique</option>
              <option value="payment">Facturation</option>
              <option value="course">Cours</option>
              <option value="teacher">Professeur</option>
            </Form.Select>
            <Form.Control.Feedback type="invalid">
              {formErrors.type}
            </Form.Control.Feedback>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Description</Form.Label>
            <Form.Control
              as="textarea"
              rows={5}
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              isInvalid={!!formErrors.description}
              placeholder="Décrivez votre problème en détail"
            />
            <Form.Control.Feedback type="invalid">
              {formErrors.description}
            </Form.Control.Feedback>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Pièces jointes (facultatif)</Form.Label>
            <Form.Control
              type="file"
              multiple
              onChange={handleFileChange}
            />
            <Form.Text className="text-muted">
              Vous pouvez joindre jusqu'à 5 fichiers (max 5 Mo chacun)
            </Form.Text>
          </Form.Group>
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button className='btn-danger' onClick={handleClose}>
          Annuler
        </Button>
        <Button
          className='btn-success'
          onClick={handleSubmit}
          disabled={submitting}
        >
          {submitting ? (
            <>
              <Spinner
                as="span"
                animation="border"
                size="sm"
                role="status"
                aria-hidden="true"
                className="me-2"
              />
              Envoi en cours...
            </>
          ) : (
            'Envoyer'
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default ReclamationForm;
