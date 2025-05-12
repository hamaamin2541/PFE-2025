import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Button, Form, InputGroup, Modal, Badge, Pagination, Spinner, Alert, Tabs, Tab } from 'react-bootstrap';
import { Search, Filter, Eye, MessageSquare, Send, Paperclip, Download } from 'lucide-react';
import axios from 'axios';
import { API_BASE_URL } from '../../config/api';

const ComplaintManagement = () => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [showComplaintModal, setShowComplaintModal] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [newComment, setNewComment] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [statusUpdateData, setStatusUpdateData] = useState({
    status: '',
    priority: ''
  });

  useEffect(() => {
    fetchComplaints();
  }, [currentPage, statusFilter, priorityFilter, typeFilter]);

  const fetchComplaints = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      let url = `${API_BASE_URL}/api/complaints?page=${currentPage}`;
      if (statusFilter) url += `&status=${statusFilter}`;
      if (priorityFilter) url += `&priority=${priorityFilter}`;
      if (typeFilter) url += `&type=${typeFilter}`;
      
      const response = await axios.get(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.data.success) {
        setComplaints(response.data.data);
        setTotalPages(response.data.pagination.pages);
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

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const handleStatusFilterChange = (e) => {
    setStatusFilter(e.target.value);
    setCurrentPage(1);
  };

  const handlePriorityFilterChange = (e) => {
    setPriorityFilter(e.target.value);
    setCurrentPage(1);
  };

  const handleTypeFilterChange = (e) => {
    setTypeFilter(e.target.value);
    setCurrentPage(1);
  };

  const handleShowComplaintModal = async (complaint) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/api/complaints/${complaint._id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.data.success) {
        setSelectedComplaint(response.data.data);
        setStatusUpdateData({
          status: response.data.data.status,
          priority: response.data.data.priority
        });
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

  const handleStatusChange = (e) => {
    setStatusUpdateData(prev => ({
      ...prev,
      status: e.target.value
    }));
  };

  const handlePriorityChange = (e) => {
    setStatusUpdateData(prev => ({
      ...prev,
      priority: e.target.value
    }));
  };

  const handleUpdateStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(
        `${API_BASE_URL}/api/complaints/${selectedComplaint._id}/status`,
        statusUpdateData,
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        setSuccessMessage('Statut mis à jour avec succès');
        setSelectedComplaint(response.data.data);
        fetchComplaints();
      }
    } catch (err) {
      console.error('Error updating complaint status:', err);
      setError(err.response?.data?.message || 'Une erreur est survenue lors de la mise à jour');
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

  // Pagination items
  const paginationItems = [];
  for (let number = 1; number <= totalPages; number++) {
    paginationItems.push(
      <Pagination.Item 
        key={number} 
        active={number === currentPage}
        onClick={() => handlePageChange(number)}
      >
        {number}
      </Pagination.Item>
    );
  }

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

  // Fonction pour obtenir la couleur du badge en fonction de la priorité
  const getPriorityBadgeColor = (priority) => {
    switch (priority) {
      case 'low':
        return 'success';
      case 'medium':
        return 'info';
      case 'high':
        return 'warning';
      case 'urgent':
        return 'danger';
      default:
        return 'secondary';
    }
  };

  return (
    <Container fluid className="py-4">
      <Card className="shadow mb-4">
        <Card.Header className="py-3 d-flex flex-row align-items-center justify-content-between">
          <h6 className="m-0 font-weight-bold text-primary">Gestion des réclamations</h6>
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
          
          <Row className="mb-3">
            <Col md={4}>
              <InputGroup>
                <InputGroup.Text>
                  <Filter size={16} />
                </InputGroup.Text>
                <Form.Select
                  value={statusFilter}
                  onChange={handleStatusFilterChange}
                >
                  <option value="">Tous les statuts</option>
                  <option value="pending">En attente</option>
                  <option value="in_progress">En cours</option>
                  <option value="resolved">Résolu</option>
                  <option value="rejected">Rejeté</option>
                </Form.Select>
              </InputGroup>
            </Col>
            <Col md={4}>
              <InputGroup>
                <InputGroup.Text>
                  <Filter size={16} />
                </InputGroup.Text>
                <Form.Select
                  value={priorityFilter}
                  onChange={handlePriorityFilterChange}
                >
                  <option value="">Toutes les priorités</option>
                  <option value="low">Basse</option>
                  <option value="medium">Moyenne</option>
                  <option value="high">Haute</option>
                  <option value="urgent">Urgente</option>
                </Form.Select>
              </InputGroup>
            </Col>
            <Col md={4}>
              <InputGroup>
                <InputGroup.Text>
                  <Filter size={16} />
                </InputGroup.Text>
                <Form.Select
                  value={typeFilter}
                  onChange={handleTypeFilterChange}
                >
                  <option value="">Tous les types</option>
                  <option value="course">Cours</option>
                  <option value="teacher">Enseignant</option>
                  <option value="payment">Paiement</option>
                  <option value="technical">Technique</option>
                  <option value="other">Autre</option>
                </Form.Select>
              </InputGroup>
            </Col>
          </Row>
          
          {loading ? (
            <div className="text-center py-4">
              <Spinner animation="border" role="status">
                <span className="visually-hidden">Chargement...</span>
              </Spinner>
            </div>
          ) : (
            <>
              <Table responsive hover>
                <thead>
                  <tr>
                    <th>Sujet</th>
                    <th>Utilisateur</th>
                    <th>Type</th>
                    <th>Statut</th>
                    <th>Priorité</th>
                    <th>Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {complaints.length > 0 ? (
                    complaints.map((complaint) => (
                      <tr key={complaint._id}>
                        <td>{complaint.subject}</td>
                        <td>{complaint.user.fullName}</td>
                        <td>{complaint.type}</td>
                        <td>
                          <Badge bg={getStatusBadgeColor(complaint.status)}>
                            {complaint.status}
                          </Badge>
                        </td>
                        <td>
                          <Badge bg={getPriorityBadgeColor(complaint.priority)}>
                            {complaint.priority}
                          </Badge>
                        </td>
                        <td>{new Date(complaint.createdAt).toLocaleDateString()}</td>
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
                    ))
                  ) : (
                    <tr>
                      <td colSpan="7" className="text-center">
                        Aucune réclamation trouvée
                      </td>
                    </tr>
                  )}
                </tbody>
              </Table>
              
              <div className="d-flex justify-content-center mt-4">
                <Pagination>
                  <Pagination.First onClick={() => handlePageChange(1)} disabled={currentPage === 1} />
                  <Pagination.Prev onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} />
                  {paginationItems}
                  <Pagination.Next onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages} />
                  <Pagination.Last onClick={() => handlePageChange(totalPages)} disabled={currentPage === totalPages} />
                </Pagination>
              </div>
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
                <div className="d-flex mb-3">
                  <Badge bg={getStatusBadgeColor(selectedComplaint.status)} className="me-2">
                    {selectedComplaint.status}
                  </Badge>
                  <Badge bg={getPriorityBadgeColor(selectedComplaint.priority)}>
                    {selectedComplaint.priority}
                  </Badge>
                </div>
                
                <Row className="mb-3">
                  <Col md={6}>
                    <p><strong>Utilisateur:</strong> {selectedComplaint.user.fullName}</p>
                    <p><strong>Email:</strong> {selectedComplaint.user.email}</p>
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
                
                <div className="mt-4">
                  <h6>Mettre à jour le statut:</h6>
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Statut</Form.Label>
                        <Form.Select
                          value={statusUpdateData.status}
                          onChange={handleStatusChange}
                        >
                          <option value="pending">En attente</option>
                          <option value="in_progress">En cours</option>
                          <option value="resolved">Résolu</option>
                          <option value="rejected">Rejeté</option>
                        </Form.Select>
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Priorité</Form.Label>
                        <Form.Select
                          value={statusUpdateData.priority}
                          onChange={handlePriorityChange}
                        >
                          <option value="low">Basse</option>
                          <option value="medium">Moyenne</option>
                          <option value="high">Haute</option>
                          <option value="urgent">Urgente</option>
                        </Form.Select>
                      </Form.Group>
                    </Col>
                  </Row>
                  <Button 
                    variant="primary" 
                    onClick={handleUpdateStatus}
                    className="w-100"
                  >
                    Mettre à jour
                  </Button>
                </div>
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
                      <MessageSquare size={32} className="text-muted mb-2" />
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
    </Container>
  );
};

export default ComplaintManagement;
