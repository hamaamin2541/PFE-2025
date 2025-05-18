import React, { useState } from 'react';
import { Modal, Button, Form, Alert, Spinner } from 'react-bootstrap';
import { Users, Calendar, Mail, BookOpen, BookCopy } from 'lucide-react';
import axios from 'axios';
import { API_BASE_URL } from '../../config/api';

const StudySessionInvite = ({ show, onHide, courseId, formationId, contentType, onSuccess }) => {
  const [guestEmail, setGuestEmail] = useState('');
  const [scheduleSession, setScheduleSession] = useState(false);
  const [scheduledTime, setScheduledTime] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!guestEmail.trim()) {
      setError('Veuillez entrer l\'email de votre ami');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');

      // Create payload based on content type
      const payload = {
        guestEmail
      };

      // Add the appropriate content ID
      if (formationId) {
        payload.formationId = formationId;
      } else {
        payload.courseId = courseId;
      }

      // Add scheduled time if enabled
      if (scheduleSession && scheduledTime) {
        payload.scheduledTime = new Date(scheduledTime).toISOString();
      }

      const response = await axios.post(
        `${API_BASE_URL}/api/study-sessions`,
        payload,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.data.success) {
        setSuccess(true);

        // Call the success callback if provided
        if (onSuccess) {
          onSuccess(response.data.data);
        }

        // Reset form after a delay
        setTimeout(() => {
          setGuestEmail('');
          setScheduleSession(false);
          setScheduledTime('');
          setSuccess(false);
          onHide();
        }, 2000);
      }
    } catch (error) {
      console.error('Error creating study session:', error);

      if (error.response && error.response.data && error.response.data.message) {
        setError(error.response.data.message);
      } else {
        setError('Une erreur est survenue lors de la création de la session d\'étude');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate minimum date-time for scheduling (now + 15 minutes)
  const getMinDateTime = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() + 15);
    return now.toISOString().slice(0, 16); // Format: YYYY-MM-DDTHH:MM
  };

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title className="d-flex align-items-center">
          {formationId ? (
            <BookCopy size={20} className="me-2 text-info" />
          ) : (
            <BookOpen size={20} className="me-2 text-primary" />
          )}
          Étudier {formationId ? 'la formation' : 'le cours'} avec un ami
        </Modal.Title>
      </Modal.Header>

      <Modal.Body>
        {success ? (
          <Alert variant="success">
            Invitation envoyée avec succès! Votre ami recevra une notification.
          </Alert>
        ) : (
          <Form onSubmit={handleSubmit}>
            {error && (
              <Alert variant="danger">{error}</Alert>
            )}

            <Form.Group className="mb-3">
              <Form.Label>Email de votre ami</Form.Label>
              <div className="input-group">
                <span className="input-group-text">
                  <Mail size={16} />
                </span>
                <Form.Control
                  type="email"
                  placeholder="ami@exemple.com"
                  value={guestEmail}
                  onChange={(e) => setGuestEmail(e.target.value)}
                  required
                />
              </div>
              <Form.Text className="text-muted">
                Votre ami doit être inscrit sur la plateforme.
              </Form.Text>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Check
                type="checkbox"
                label="Planifier une session pour plus tard"
                checked={scheduleSession}
                onChange={(e) => setScheduleSession(e.target.checked)}
              />
            </Form.Group>

            {scheduleSession && (
              <Form.Group className="mb-3">
                <Form.Label>Date et heure</Form.Label>
                <div className="input-group">
                  <span className="input-group-text">
                    <Calendar size={16} />
                  </span>
                  <Form.Control
                    type="datetime-local"
                    value={scheduledTime}
                    onChange={(e) => setScheduledTime(e.target.value)}
                    min={getMinDateTime()}
                    required={scheduleSession}
                  />
                </div>
                <Form.Text className="text-muted">
                  Choisissez une date et une heure pour votre session d'étude.
                </Form.Text>
              </Form.Group>
            )}
          </Form>
        )}
      </Modal.Body>

      <Modal.Footer>
        <Button variant="secondary" onClick={onHide} disabled={isLoading}>
          Annuler
        </Button>

        {!success && (
          <Button
            variant="primary"
            onClick={handleSubmit}
            disabled={isLoading || !guestEmail.trim() || (scheduleSession && !scheduledTime)}
          >
            {isLoading ? (
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
              'Envoyer l\'invitation'
            )}
          </Button>
        )}
      </Modal.Footer>
    </Modal>
  );
};

export default StudySessionInvite;
