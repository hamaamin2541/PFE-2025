import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Form, Table, Badge, Modal, Spinner, Alert, Tabs, Tab } from 'react-bootstrap';
import { Plus, Eye, Paperclip, Send, Download } from 'lucide-react';
import axios from 'axios';
import { API_BASE_URL } from '../../config/api';

const UserComplaints = () => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showComplaintModal, setShowComplaintModal] = useState(false);
  const [showNewComplaintModal, setShowNewComplaintModal] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [newComment, setNewComment] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [formData, setFormData] = useState({
    subject: '',
    description: '',
    type: 'technical',
    relatedItem: {
      itemType: '',
      itemId: ''
    },
    attachments: []
  });
  const [courses, setCourses] = useState([]);
  const [tests, setTests] = useState([]);
  const [formations, setFormations] = useState([]);

  useEffect(() => {
    fetchComplaints();
    fetchUserContent();
  }, []);

  const fetchComplaints = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await axios.get(`${API_BASE_URL}/api/complaints/my-complaints`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.data.success) {
        setComplaints(response.data.data);
      } else {
        setError('Erreur lors de la récupération des réclamations');
      }
    } catch (err) {
      console.error('Error fetching complaints:', err);
      setError(err.response?.data?.message || 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserContent = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // Récupérer les cours de l'utilisateur
      const coursesResponse = await axios.get(`${API_BASE_URL}/api/enrollments/my-courses`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      // Récupérer les tests de l'utilisateur
      const testsResponse = await axios.get(`${API_BASE_URL}/api/enrollments/my-tests`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      // Récupérer les formations de l'utilisateur
      const formationsResponse = await axios.get(`${API_BASE_URL}/api/enrollments/my-formations`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (coursesResponse.data.success) {
        setCourses(coursesResponse.data.data);
      }
      
      if (testsResponse.data.success) {
        setTests(testsResponse.data.data);
      }
      
      if (formationsResponse.data.success) {
        setFormations(formationsResponse.data.data);
      }
    } catch (err) {
      console.error('Error fetching user content:', err);
    }
  };

  const handleShowComplaintModal = async (complaint) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/api/complaints/${complaint._id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.data.success) {
        setSelectedComplaint(response.data.data);
        setShowComplaintModal(true);
      }
    } catch (err) {
      console.error('Error fetching complaint details:', err);
      setError(err.response?.data?.message || 'Une erreur est survenue');
    }
  };

  const handleCloseComplaintModal = () => {
    setShowComplaintModal(false);
    setSelectedComplaint(null);
    setNewComment('');
  };

  const handleShowNewComplaintModal = () => {
    setShowNewComplaintModal(true);
  };

  const handleCloseNewComplaintModal = () => {
    setShowNewComplaintModal(false);
    setFormData({
      subject: '',
      description: '',
      type: 'technical',
      relatedItem: {
        itemType: '',
        itemId: ''
      },
      attachments: []
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleRelatedItemChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'itemType') {
      setFormData(prev => ({
        ...prev,
        relatedItem: {
          ...prev.relatedItem,
          itemType: value,
          itemId: ''
        }
      }));
    } else if (name === 'itemId') {
      setFormData(prev => ({
        ...prev,
        relatedItem: {
          ...prev.relatedItem,
          itemId: value
        }
      }));
    }
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setFormData(prev => ({
      ...prev,
      attachments: files
    }));
  };

  const handleSubmitComplaint = async (e) => {
    e.preventDefault();
    
    try {
      const token = localStorage.getItem('token');
      const formDataToSend = new FormData();
      
      // Ajouter les champs de base
      formDataToSend.append('subject', formData.subject);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('type', formData.type);
      
      // Ajouter l'élément associé si présent
      if (formData.relatedItem.itemType && formData.relatedItem.itemId) {
        formDataToSend.append('relatedItem', JSON.stringify(formData.relatedItem));
      }
      
      // Ajouter les pièces jointes
      formData.attachments.forEach(file => {
        formDataToSend.append('attachments', file);
      });
      
      const response = await axios.post(`${API_BASE_URL}/api/complaints`, formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.data.success) {
        setSuccessMessage('Réclamation créée avec succès');
        handleCloseNewComplaintModal();
        fetchComplaints();
      }
    } catch (err) {
      console.error('Error creating complaint:', err);
      setError(err.response?.data?.message || 'Une erreur est survenue lors de la création de la réclamation');
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    
    if (!newComment.trim()) {
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_BASE_URL}/api/complaints/${selectedComplaint._id}/comments`,
        { text: newComment },
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        // Mettre à jour les commentaires dans le state
        setSelectedComplaint(prev => ({
          ...prev,
          comments: [...prev.comments, response.data.data]
        }));
        setNewComment('');
      }
    } catch (err) {
      console.error('Error adding comment:', err);
      setError(err.response?.data?.message || 'Une erreur est survenue lors de l\'ajout du commentaire');
    }
  };

  // Fonction pour formater la date
  const formatDate = (dateString) => {
    const options = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Fonction pour obtenir la couleur du badge en fonction du statut
  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'pending':
        return 'warning';
      case 'in_progress':
        return 'info';
      case 'resolved':
        return 'success';
      case 'rejected':
        return 'danger';
      default:
        return 'secondary';
    }
  };

  return (
    <Container className="py-4">
      <Card className="shadow mb-4">
        <Card.Header className="py-3 d-flex flex-row align-items-center justify-content-between">
          <h5 className="m-0 font-weight-bold">Mes réclamations</h5>
          <Button variant="primary" onClick={handleShowNewComplaintModal}>
            <Plus size={16} className="me-1" />
            Nouvelle réclamation
          </Button>
        </Card.Header>
        <Card.Body>
          {successMessage && (
            <Alert variant="success" onClose={() => setSuccessMessage('')} dismissible>
              {successMessage}
            </Alert>
          )}
          
          {error && (
            <Alert variant="danger" onClose={() => setError(null)} dismissible>
              {error}
            </Alert>
          )}
          
          {loading ? (
            <div className="text-center py-4">
              <Spinner animation="border" role="status">
                <span className="visually-hidden">Chargement...</span>
              </Spinner>
            </div>
          ) : (
            <>
              {complaints.length > 0 ? (
                <Table responsive hover>
                  <thead>
                    <tr>
                      <th>Sujet</th>
                      <th>Type</th>
                      <th>Statut</th>
                      <th>Date</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {complaints.map((complaint) => (
                      <tr key={complaint._id}>
                        <td>{complaint.subject}</td>
                        <td>{complaint.type}</td>
                        <td>
                          <Badge bg={getStatusBadgeColor(complaint.status)}>
                            {complaint.status}
                          </Badge>
                        </td>
                        <td>{formatDate(complaint.createdAt)}</td>
                        <td>
                          <Button 
                            variant="info" 
                            size="sm" 
                            onClick={() => handleShowComplaintModal(complaint)}
                          >
                            <Eye size={16} />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              ) : (
                <div className="text-center py-4">
                  <p className="mb-3">Vous n'avez pas encore de réclamations</p>
                  <Button variant="primary" onClick={handleShowNewComplaintModal}>
                    <Plus size={16} className="me-1" />
                    Créer une réclamation
                  </Button>
                </div>
              )}
            </>
          )}
        </Card.Body>
      </Card>
      
      {/* Modal de détails de réclamation */}
      <Modal show={showComplaintModal} onHide={handleCloseComplaintModal} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Détails de la réclamation</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedComplaint && (
            <Tabs defaultActiveKey="details" className="mb-3">
              <Tab eventKey="details" title="Détails">
                <h5>{selectedComplaint.subject}</h5>
                <Badge bg={getStatusBadgeColor(selectedComplaint.status)} className="mb-3">
                  {selectedComplaint.status}
                </Badge>
                
                <Row className="mb-3">
                  <Col md={6}>
                    <p><strong>Type:</strong> {selectedComplaint.type}</p>
                  </Col>
                  <Col md={6}>
                    <p><strong>Date de création:</strong> {formatDate(selectedComplaint.createdAt)}</p>
                    {selectedComplaint.resolvedAt && (
                      <p><strong>Date de résolution:</strong> {formatDate(selectedComplaint.resolvedAt)}</p>
                    )}
                  </Col>
                </Row>
                
                <div className="mb-3">
                  <h6>Description:</h6>
                  <p className="p-3 bg-light rounded">{selectedComplaint.description}</p>
                </div>
                
                {selectedComplaint.attachments && selectedComplaint.attachments.length > 0 && (
                  <div className="mb-3">
                    <h6>Pièces jointes:</h6>
                    <ul className="list-group">
                      {selectedComplaint.attachments.map((attachment, index) => (
                        <li key={index} className="list-group-item d-flex justify-content-between align-items-center">
                          <div>
                            <Paperclip size={16} className="me-2" />
                            {attachment.name}
                          </div>
                          <Button 
                            variant="outline-primary" 
                            size="sm"
                            href={`${API_BASE_URL}/${attachment.file}`}
                            target="_blank"
                          >
                            <Download size={16} />
                          </Button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </Tab>
              
              <Tab eventKey="comments" title="Commentaires">
                <div className="comments-section">
                  {selectedComplaint.comments && selectedComplaint.comments.length > 0 ? (
                    <div className="comments-list mb-4">
                      {selectedComplaint.comments.map((comment, index) => (
                        <div key={index} className={`comment-item p-3 mb-3 rounded ${comment.user.role === 'admin' ? 'bg-light-blue' : 'bg-light'}`}>
                          <div className="d-flex justify-content-between">
                            <div className="d-flex align-items-center">
                              {comment.user.profileImage ? (
                                <img 
                                  src={`${API_BASE_URL}/${comment.user.profileImage}`} 
                                  alt={comment.user.fullName}
                                  className="rounded-circle me-2"
                                  style={{ width: '30px', height: '30px', objectFit: 'cover' }}
                                />
                              ) : (
                                <div 
                                  className="rounded-circle bg-secondary d-flex align-items-center justify-content-center me-2"
                                  style={{ width: '30px', height: '30px' }}
                                >
                                  <span className="text-white" style={{ fontSize: '12px' }}>
                                    {comment.user.fullName.charAt(0).toUpperCase()}
                                  </span>
                                </div>
                              )}
                              <div>
                                <strong>{comment.user.fullName}</strong>
                                <Badge 
                                  bg={comment.user.role === 'admin' ? 'danger' : 'primary'} 
                                  className="ms-2"
                                >
                                  {comment.user.role}
                                </Badge>
                              </div>
                            </div>
                            <small className="text-muted">
                              {formatDate(comment.date)}
                            </small>
                          </div>
                          <p className="mt-2 mb-0">{comment.text}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4 mb-4">
                      <p className="text-muted">Aucun commentaire pour le moment</p>
                    </div>
                  )}
                  
                  <Form onSubmit={handleAddComment}>
                    <Form.Group className="mb-3">
                      <Form.Label>Ajouter un commentaire</Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={3}
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Écrivez votre commentaire ici..."
                        required
                      />
                    </Form.Group>
                    <Button 
                      variant="primary" 
                      type="submit"
                      className="w-100"
                    >
                      <Send size={16} className="me-2" />
                      Envoyer
                    </Button>
                  </Form>
                </div>
              </Tab>
            </Tabs>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseComplaintModal}>
            Fermer
          </Button>
        </Modal.Footer>
      </Modal>
      
      {/* Modal de nouvelle réclamation */}
      <Modal show={showNewComplaintModal} onHide={handleCloseNewComplaintModal}>
        <Modal.Header closeButton>
          <Modal.Title>Nouvelle réclamation</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleSubmitComplaint}>
            <Form.Group className="mb-3">
              <Form.Label>Sujet</Form.Label>
              <Form.Control
                type="text"
                name="subject"
                value={formData.subject}
                onChange={handleInputChange}
                placeholder="Entrez le sujet de votre réclamation"
                required
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Type de réclamation</Form.Label>
              <Form.Select
                name="type"
                value={formData.type}
                onChange={handleInputChange}
                required
              >
                <option value="course">Cours</option>
                <option value="teacher">Enseignant</option>
                <option value="payment">Paiement</option>
                <option value="technical">Technique</option>
                <option value="other">Autre</option>
              </Form.Select>
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Élément concerné (optionnel)</Form.Label>
              <Row>
                <Col>
                  <Form.Select
                    name="itemType"
                    value={formData.relatedItem.itemType}
                    onChange={handleRelatedItemChange}
                  >
                    <option value="">Sélectionner un type</option>
                    <option value="course">Cours</option>
                    <option value="test">Test</option>
                    <option value="formation">Formation</option>
                  </Form.Select>
                </Col>
                <Col>
                  <Form.Select
                    name="itemId"
                    value={formData.relatedItem.itemId}
                    onChange={handleRelatedItemChange}
                    disabled={!formData.relatedItem.itemType}
                  >
                    <option value="">Sélectionner un élément</option>
                    {formData.relatedItem.itemType === 'course' && courses.map(course => (
                      <option key={course._id} value={course._id}>{course.title}</option>
                    ))}
                    {formData.relatedItem.itemType === 'test' && tests.map(test => (
                      <option key={test._id} value={test._id}>{test.title}</option>
                    ))}
                    {formData.relatedItem.itemType === 'formation' && formations.map(formation => (
                      <option key={formation._id} value={formation._id}>{formation.title}</option>
                    ))}
                  </Form.Select>
                </Col>
              </Row>
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={4}
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Décrivez votre problème en détail"
                required
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Pièces jointes (optionnel)</Form.Label>
              <Form.Control
                type="file"
                multiple
                onChange={handleFileChange}
              />
              <Form.Text className="text-muted">
                Vous pouvez ajouter jusqu'à 5 fichiers (images, PDF, etc.)
              </Form.Text>
            </Form.Group>
            
            <div className="d-grid">
              <Button variant="primary" type="submit">
                Soumettre la réclamation
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>
    </Container>
  );
};

export default UserComplaints;
