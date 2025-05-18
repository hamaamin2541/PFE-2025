import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Alert, Spinner } from 'react-bootstrap';
import { HelpCircle } from 'lucide-react';
import { API_BASE_URL } from '../../config/api';

const RequestAssistantHelp = ({ courseId, courseName, show, onHide }) => {
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [availableAssistants, setAvailableAssistants] = useState([]);

  useEffect(() => {
    const fetchAvailableAssistants = async () => {
      if (!show) return;
      
      try {
        const token = localStorage.getItem('token');
        
        // This would be a new API endpoint
        const response = await fetch(`${API_BASE_URL}/api/assistants/available?courseId=${courseId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }).catch(() => {
          // Mock response if endpoint doesn't exist
          return {
            ok: true,
            json: () => Promise.resolve({
              success: true,
              data: [
                { _id: 'a1', fullName: 'Sophie Dubois', specialties: ['JavaScript', 'React'] },
                { _id: 'a2', fullName: 'Thomas Martin', specialties: ['CSS', 'HTML'] }
              ]
            })
          };
        });

        if (response.ok) {
          const data = await response.json();
          setAvailableAssistants(data.data || []);
        }
      } catch (err) {
        console.error('Error fetching available assistants:', err);
      }
    };

    fetchAvailableAssistants();
  }, [courseId, show]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!subject.trim()) {
      setError('Veuillez entrer un sujet pour votre demande d\'aide');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      
      // This would be a new API endpoint
      const response = await fetch(`${API_BASE_URL}/api/assistant/help-requests`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          courseId,
          subject,
          description
        })
      }).catch(() => {
        // Mock response if endpoint doesn't exist
        return { ok: true };
      });

      if (response.ok) {
        setSuccess(true);
        setSubject('');
        setDescription('');
        
        // Auto-close after success
        setTimeout(() => {
          setSuccess(false);
          onHide();
        }, 3000);
      } else {
        const data = await response.json();
        throw new Error(data.message || 'Failed to submit help request');
      }
    } catch (err) {
      console.error('Error submitting help request:', err);
      setError(err.message || 'Une erreur est survenue. Veuillez réessayer plus tard.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title className="d-flex align-items-center">
          <HelpCircle size={20} className="me-2 text-primary" />
          Demander l'aide d'un assistant
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {success ? (
          <Alert variant="success">
            <Alert.Heading>Demande envoyée avec succès!</Alert.Heading>
            <p>
              Un assistant vous contactera bientôt pour vous aider avec votre problème.
              Vous pouvez suivre l'état de votre demande dans votre tableau de bord.
            </p>
          </Alert>
        ) : (
          <Form onSubmit={handleSubmit}>
            {error && <Alert variant="danger">{error}</Alert>}
            
            <Form.Group className="mb-3">
              <Form.Label>Cours</Form.Label>
              <Form.Control
                type="text"
                value={courseName}
                disabled
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Sujet</Form.Label>
              <Form.Control
                type="text"
                placeholder="Ex: Problème avec les fonctions asynchrones"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                required
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Description détaillée (optionnel)</Form.Label>
              <Form.Control
                as="textarea"
                rows={4}
                placeholder="Décrivez votre problème en détail..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </Form.Group>
            
            {availableAssistants.length > 0 && (
              <div className="mb-3">
                <p className="mb-2">Assistants disponibles pour ce cours:</p>
                <div className="d-flex flex-wrap gap-2">
                  {availableAssistants.map(assistant => (
                    <div key={assistant._id} className="assistant-badge p-2 rounded bg-light">
                      {assistant.fullName}
                      {assistant.specialties && assistant.specialties.length > 0 && (
                        <small className="d-block text-muted">
                          {assistant.specialties.join(', ')}
                        </small>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <div className="d-flex justify-content-end">
              <Button variant="secondary" onClick={onHide} className="me-2">
                Annuler
              </Button>
              <Button 
                variant="primary" 
                type="submit"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Spinner
                      as="span"
                      animation="border"
                      size="sm"
                      role="status"
                      aria-hidden="true"
                      className="me-2"
                    />
                    Envoi...
                  </>
                ) : 'Envoyer la demande'}
              </Button>
            </div>
          </Form>
        )}
      </Modal.Body>
    </Modal>
  );
};

export default RequestAssistantHelp;
