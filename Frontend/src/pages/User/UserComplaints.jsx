import React, { useState, useEffect } from 'react';
import { Container, Card, Table, Button, Badge, Form, Row, Col, Alert, Modal, Spinner } from 'react-bootstrap';
import { Plus, Eye, ArrowLeft, MessageSquare, FileText, Paperclip } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../../config/api';
import './UserComplaints.css';

const UserComplaints = () => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showNewComplaintForm, setShowNewComplaintForm] = useState(false);
  const [showComplaintDetail, setShowComplaintDetail] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [newComment, setNewComment] = useState('');
  const [addingComment, setAddingComment] = useState(false);
  const [formData, setFormData] = useState({
    subject: '',
    description: '',
    type: 'general',
    attachments: []
  });
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    fetchComplaints();
  }, []);

  const fetchComplaints = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/SeConnecter');
        return;
      }

      const response = await axios.get(`${API_BASE_URL}/api/complaints/my-complaints`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.data.success) {
        setComplaints(response.data.data);
      } else {
        setError('Erreur lors du chargement des réclamations');
      }
    } catch (err) {
      console.error('Error fetching complaints:', err);
      setError('Erreur lors du chargement des réclamations');
    } finally {
      setLoading(false);
    }
  };

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
      const token = localStorage.getItem('token');
      
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
        setSuccess('Réclamation créée avec succès');
        setFormData({
          subject: '',
          description: '',
          type: 'general',
          attachments: []
        });
        setShowNewComplaintForm(false);
        fetchComplaints();
      } else {
        setError('Erreur lors de la création de la réclamation');
      }
    } catch (err) {
      console.error('Error creating complaint:', err);
      setError('Erreur lors de la création de la réclamation');
    } finally {
      setSubmitting(false);
    }
  };

  const handleViewComplaint = async (complaintId) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await axios.get(
        `${API_BASE_URL}/api/complaints/${complaintId}`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      
      if (response.data.success) {
        setSelectedComplaint(response.data.data);
        setShowComplaintDetail(true);
      } else {
        setError('Erreur lors du chargement des détails de la réclamation');
      }
    } catch (err) {
      console.error('Error fetching complaint details:', err);
      setError('Erreur lors du chargement des détails de la réclamation');
    } finally {
      setLoading(false);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    
    try {
      setAddingComment(true);
      const token = localStorage.getItem('token');
      
      const response = await axios.post(
        `${API_BASE_URL}/api/complaints/${selectedComplaint._id}/comments`,
        { text: newComment },
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      
      if (response.data.success) {
        setSelectedComplaint(response.data.data);
        setNewComment('');
      } else {
        setError('Erreur lors de l\'ajout du commentaire');
      }
    } catch (err) {
      console.error('Error adding comment:', err);
      setError('Erreur lors de l\'ajout du commentaire');
    } finally {
      setAddingComment(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return <Badge bg="warning">En attente</Badge>;
      case 'in_progress':
        return <Badge bg="info">En cours</Badge>;
      case 'resolved':
        return <Badge bg="success">Résolu</Badge>;
      case 'rejected':
        return <Badge bg="danger">Rejeté</Badge>;
      default:
        return <Badge bg="secondary">Inconnu</Badge>;
    }
  };

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'low':
        return <Badge bg="success">Faible</Badge>;
      case 'medium':
        return <Badge bg="info">Moyenne</Badge>;
      case 'high':
        return <Badge bg="warning">Élevée</Badge>;
      case 'urgent':
        return <Badge bg="danger">Urgente</Badge>;
      default:
        return <Badge bg="secondary">Inconnue</Badge>;
    }
  };

  if (loading && complaints.length === 0) {
    return (
      <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '80vh' }}>
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Chargement...</span>
        </Spinner>
      </Container>
    );
  }

  return (
    <Container className="py-4">
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
      
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="mb-0">Mes Réclamations</h4>
          <p className="text-muted">Gérez vos réclamations et suivez leur statut</p>
        </div>
        <Button 
          variant="primary" 
          onClick={() => setShowNewComplaintForm(true)}
          className="d-flex align-items-center"
        >
          <Plus size={16} className="me-2" />
          Nouvelle réclamation
        </Button>
      </div>
      
      {complaints.length === 0 ? (
        <Card className="text-center p-5">
          <Card.Body>
            <MessageSquare size={48} className="text-muted mb-3" />
            <h5>Aucune réclamation</h5>
            <p className="text-muted">Vous n'avez pas encore créé de réclamation.</p>
            <Button 
              variant="primary" 
              onClick={() => setShowNewComplaintForm(true)}
            >
              Créer une réclamation
            </Button>
          </Card.Body>
        </Card>
      ) : (
        <Card>
          <Card.Body>
            <div className="table-responsive">
              <Table hover>
                <thead>
                  <tr>
                    <th>Sujet</th>
                    <th>Type</th>
                    <th>Statut</th>
                    <th>Priorité</th>
                    <th>Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {complaints.map(complaint => (
                    <tr key={complaint._id}>
                      <td>{complaint.subject}</td>
                      <td>{complaint.type}</td>
                      <td>{getStatusBadge(complaint.status)}</td>
                      <td>{getPriorityBadge(complaint.priority)}</td>
                      <td>{new Date(complaint.createdAt).toLocaleDateString()}</td>
                      <td>
                        <Button 
                          variant="outline-primary" 
                          size="sm"
                          onClick={() => handleViewComplaint(complaint._id)}
                        >
                          <Eye size={16} />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          </Card.Body>
        </Card>
      )}
      
      {/* Modal pour créer une nouvelle réclamation */}
      <Modal 
        show={showNewComplaintForm} 
        onHide={() => setShowNewComplaintForm(false)}
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>Nouvelle réclamation</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Sujet</Form.Label>
              <Form.Control
                type="text"
                name="subject"
                value={formData.subject}
                onChange={handleInputChange}
                isInvalid={!!formErrors.subject}
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
                <option value="general">Général</option>
                <option value="technical">Technique</option>
                <option value="billing">Facturation</option>
                <option value="content">Contenu</option>
                <option value="other">Autre</option>
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
          <Button variant="secondary" onClick={() => setShowNewComplaintForm(false)}>
            Annuler
          </Button>
          <Button 
            variant="primary" 
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
      
      {/* Modal pour afficher les détails d'une réclamation */}
      <Modal 
        show={showComplaintDetail} 
        onHide={() => setShowComplaintDetail(false)}
        size="lg"
      >
        {selectedComplaint && (
          <>
            <Modal.Header closeButton>
              <Modal.Title>{selectedComplaint.subject}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <div className="d-flex justify-content-between mb-3">
                <div>
                  <Badge bg="secondary" className="me-2">Type: {selectedComplaint.type}</Badge>
                  {getStatusBadge(selectedComplaint.status)}
                  {' '}
                  {getPriorityBadge(selectedComplaint.priority)}
                </div>
                <small className="text-muted">
                  Créée le {new Date(selectedComplaint.createdAt).toLocaleDateString()}
                </small>
              </div>
              
              <Card className="mb-4">
                <Card.Body>
                  <Card.Title>Description</Card.Title>
                  <Card.Text>{selectedComplaint.description}</Card.Text>
                </Card.Body>
              </Card>
              
              {selectedComplaint.attachments && selectedComplaint.attachments.length > 0 && (
                <Card className="mb-4">
                  <Card.Body>
                    <Card.Title>Pièces jointes</Card.Title>
                    <div className="d-flex flex-wrap gap-2 mt-2">
                      {selectedComplaint.attachments.map((attachment, index) => (
                        <Button 
                          key={index}
                          variant="outline-secondary"
                          size="sm"
                          as="a"
                          href={`${API_BASE_URL}/${attachment.file}`}
                          target="_blank"
                          className="d-flex align-items-center"
                        >
                          <Paperclip size={14} className="me-1" />
                          {attachment.name}
                        </Button>
                      ))}
                    </div>
                  </Card.Body>
                </Card>
              )}
              
              <Card>
                <Card.Body>
                  <Card.Title>Commentaires</Card.Title>
                  
                  {selectedComplaint.comments && selectedComplaint.comments.length > 0 ? (
                    <div className="comments-container mt-3">
                      {selectedComplaint.comments.map((comment, index) => (
                        <div key={index} className="comment-item mb-3">
                          <div className="d-flex align-items-center mb-2">
                            <div className="comment-avatar me-2">
                              {comment.user.profileImage ? (
                                <img 
                                  src={`${API_BASE_URL}/${comment.user.profileImage}`}
                                  alt={comment.user.fullName}
                                  className="rounded-circle"
                                  width="32"
                                  height="32"
                                />
                              ) : (
                                <div className="avatar-placeholder">
                                  {comment.user.fullName.charAt(0).toUpperCase()}
                                </div>
                              )}
                            </div>
                            <div>
                              <div className="fw-bold">{comment.user.fullName}</div>
                              <small className="text-muted">
                                {new Date(comment.date).toLocaleString()}
                              </small>
                            </div>
                          </div>
                          <div className="comment-content p-3 bg-light rounded">
                            {comment.text}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted mt-3">Aucun commentaire pour le moment.</p>
                  )}
                  
                  <div className="add-comment mt-4">
                    <Form.Group>
                      <Form.Label>Ajouter un commentaire</Form.Label>
                      <div className="d-flex">
                        <Form.Control
                          as="textarea"
                          rows={2}
                          value={newComment}
                          onChange={(e) => setNewComment(e.target.value)}
                          placeholder="Écrivez votre commentaire ici..."
                          className="me-2"
                        />
                        <Button 
                          variant="primary"
                          onClick={handleAddComment}
                          disabled={!newComment.trim() || addingComment}
                          style={{ alignSelf: 'flex-end' }}
                        >
                          {addingComment ? (
                            <Spinner
                              as="span"
                              animation="border"
                              size="sm"
                              role="status"
                              aria-hidden="true"
                            />
                          ) : (
                            'Envoyer'
                          )}
                        </Button>
                      </div>
                    </Form.Group>
                  </div>
                </Card.Body>
              </Card>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={() => setShowComplaintDetail(false)}>
                Fermer
              </Button>
            </Modal.Footer>
          </>
        )}
      </Modal>
    </Container>
  );
};

export default UserComplaints;
