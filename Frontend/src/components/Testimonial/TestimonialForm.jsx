import React, { useState } from 'react';
import { Modal, Form, Button, Alert } from 'react-bootstrap';
import { FaStar } from 'react-icons/fa';
import axios from 'axios';
import { API_BASE_URL } from '../../config/api';
import './TestimonialForm.css';

const TestimonialForm = ({ show, handleClose, onTestimonialSubmit }) => {
  const [formData, setFormData] = useState({
    message: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const { message } = formData;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!message) {
      setError('Veuillez saisir votre témoignage');
      return;
    }

    setLoading(true);
    setError('');

    try {
      console.log('Sending testimonial data:', formData);

      // Create a mock response for offline mode
      let response;

      // Get user info from localStorage if available
      const userData = JSON.parse(localStorage.getItem('user')) || {};
      const userRole = localStorage.getItem('userRole') || 'Utilisateur';

      // Create testimonial data with user info
      const testimonialData = {
        name: userData.fullName || 'Utilisateur anonyme',
        role: userRole,
        message: formData.message,
        rating: 5 // Default rating
      };

      // Send the testimonial to the server
      response = await axios.post(`${API_BASE_URL}/api/testimonials`, testimonialData, {
        timeout: 8000 // Use axios timeout instead of AbortController
      });

      console.log('Response:', response.data);

      if (response.data.success) {
        setSuccess(true);

        // Create a testimonial object to pass back to the parent
        const newTestimonial = {
          id: Date.now(), // Use timestamp as temporary ID
          name: testimonialData.name,
          role: testimonialData.role,
          text: testimonialData.message,
          rating: testimonialData.rating,
          avatar: "https://randomuser.me/api/portraits/men/32.jpg", // Default avatar
          isNew: true // Flag to identify newly added testimonials
        };

        // Pass the testimonial data to the parent component
        if (onTestimonialSubmit) {
          onTestimonialSubmit(newTestimonial);
        }

        // Reset form after successful submission
        setFormData({
          message: ''
        });

        // Close modal after 3 seconds
        setTimeout(() => {
          handleClose();
          setSuccess(false);
        }, 3000);
      }
    } catch (err) {
      console.error('Error submitting testimonial:', err);

      setError(
        'Une erreur est survenue lors de l\'envoi de votre témoignage. Veuillez réessayer.'
      );

      // Don't show success or close the modal on error
      setSuccess(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal show={show} onHide={handleClose} centered className="testimonial-modal">
      <Modal.Header closeButton>
        <Modal.Title>Partagez votre témoignage</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {error && <Alert variant="danger">{error}</Alert>}
        {success && (
          <Alert variant="success">
            <div className="d-flex align-items-center">
              <div className="me-3">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="12" r="12" fill="#28a745" fillOpacity="0.2"/>
                  <path d="M8 12L11 15L16 9" stroke="#28a745" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div>
                <strong>Merci pour votre témoignage !</strong>
                <p className="mb-0">Votre témoignage a été soumis et sera visible après approbation.</p>
              </div>
            </div>
          </Alert>
        )}

        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-4">
            <Form.Label>Votre témoignage*</Form.Label>
            <Form.Control
              as="textarea"
              name="message"
              value={message}
              onChange={handleChange}
              placeholder="Partagez votre expérience avec notre plateforme..."
              rows={6}
              required
            />
          </Form.Group>

          <div className="d-grid gap-2">
            <Button
              variant="primary"
              type="submit"
              disabled={loading}
              className="btn-success"
            >
              {loading ? 'Envoi en cours...' : 'Envoyer mon témoignage'}
            </Button>
          </div>
        </Form>
      </Modal.Body>
    </Modal>
  );
};

export default TestimonialForm;
