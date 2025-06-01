import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Button, Form, InputGroup, Modal, Badge, Pagination, Spinner, Alert } from 'react-bootstrap';
import { Search, Filter, Eye, MessageSquare, Send, Trash2 } from 'lucide-react';
import axios from 'axios';
import { API_BASE_URL } from '../../config/api';
import './ContactMessageManagement.css'; // Import custom CSS for styling

const ContactMessageManagement = () => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [messageToDelete, setMessageToDelete] = useState(null);

  useEffect(() => {
    fetchMessages();
  }, [currentPage, statusFilter]);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      let url = `${API_BASE_URL}/api/contact?page=${currentPage}`;
      if (statusFilter) url += `&status=${statusFilter}`;
      
      const response = await axios.get(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.data.success) {
        setMessages(response.data.data);
        setTotalPages(response.data.pagination.pages);
      } else {
        setError('Erreur lors de la récupération des messages');
      }
    } catch (err) {
      console.error('Error fetching contact messages:', err);
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

  const handleShowMessageModal = async (message) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/api/contact/${message._id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.data.success) {
        setSelectedMessage(response.data.data);
        setShowMessageModal(true);
      }
    } catch (err) {
      console.error('Error fetching message details:', err);
      setError(err.response?.data?.message || 'Une erreur est survenue');
    }
  };

  const handleCloseMessageModal = () => {
    setShowMessageModal(false);
    setSelectedMessage(null);
    setReplyText('');
  };

  const handleShowDeleteModal = (message) => {
    setMessageToDelete(message);
    setShowDeleteModal(true);
  };

  const handleCloseDeleteModal = () => {
    setShowDeleteModal(false);
    setMessageToDelete(null);
  };

  const handleDeleteMessage = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.delete(`${API_BASE_URL}/api/contact/${messageToDelete._id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.data.success) {
        setSuccessMessage('Message supprimé avec succès');
        fetchMessages();
      }
    } catch (err) {
      console.error('Error deleting message:', err);
      setError(err.response?.data?.message || 'Une erreur est survenue lors de la suppression');
    } finally {
      handleCloseDeleteModal();
    }
  };

  const handleSendReply = async (e) => {
    e.preventDefault();
    
    if (!replyText.trim()) {
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_BASE_URL}/api/contact/${selectedMessage._id}/reply`,
        { text: replyText },
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        setSuccessMessage('Réponse envoyée avec succès');
        setSelectedMessage(response.data.data);
        fetchMessages();
        handleCloseMessageModal();
      }
    } catch (err) {
      console.error('Error sending reply:', err);
      setError(err.response?.data?.message || 'Une erreur est survenue lors de l\'envoi de la réponse');
    }
  };

  const handleUpdateStatus = async (messageId, status) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(
        `${API_BASE_URL}/api/contact/${messageId}/status`,
        { status },
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        setSuccessMessage('Statut mis à jour avec succès');
        fetchMessages();
      }
    } catch (err) {
      console.error('Error updating message status:', err);
      setError(err.response?.data?.message || 'Une erreur est survenue lors de la mise à jour');
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
      case 'unread':
        return 'danger';
      case 'read':
        return 'warning';
      case 'replied':
        return 'success';
      case 'archived':
        return 'secondary';
      default:
        return 'secondary';
    }
  };

  return (
    <Container fluid className="py-4">
      <Card className="shadow mb-4">
        <Card.Header className="py-3 d-flex flex-row align-items-center justify-content-between">
          <h4 className="m-0 font-weight-bold text-primary p-3">Gestion des messages de contact</h4>
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
            <Col md={6}>
              <InputGroup>
                <InputGroup.Text>
                  <Filter size={16} />
                </InputGroup.Text>
                <Form.Select
                  value={statusFilter}
                  onChange={handleStatusFilterChange}
                >
                  <option value="">Tous les statuts</option>
                  <option value="unread">Non lus</option>
                  <option value="read">Lus</option>
                  <option value="replied">Répondus</option>
                  <option value="archived">Archivés</option>
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
                    <th>Nom</th>
                    <th>Email</th>
                    <th>Sujet</th>
                    <th>Statut</th>
                    <th>Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {messages.length > 0 ? (
                    messages.map((message) => (
                      <tr key={message._id}>
                        <td>{message.name}</td>
                        <td>{message.email}</td>
                        <td>{message.subject}</td>
                        <td>
                          <Badge bg={getStatusBadgeColor(message.status)}>
                            {message.status}
                          </Badge>
                        </td>
                        <td>{formatDate(message.createdAt)}</td>
                        <td>
                          <Button 
                            variant="info" 
                            size="sm" 
                            className="me-1"
                            onClick={() => handleShowMessageModal(message)}
                          >
                            <Eye size={16} />
                          </Button>
                          {message.status !== 'archived' && (
                            <Button 
                              variant="secondary" 
                              size="sm"
                              className="me-1"
                              onClick={() => handleUpdateStatus(message._id, 'archived')}
                              title="Archiver"
                            >
                              <MessageSquare size={16} />
                            </Button>
                          )}
                          <Button 
                            variant="danger" 
                            size="sm"
                            onClick={() => handleShowDeleteModal(message)}
                            title="Supprimer"
                          >
                            <Trash2 size={16} />
                          </Button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="text-center">
                        Aucun message trouvé
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
      
      {/* Modal de détails du message */}
      <Modal show={showMessageModal} onHide={handleCloseMessageModal} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Détails du message</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedMessage && (
            <>
              <div className="mb-4">
  <div className="mb-3">
    <h6>Subject:</h6>
    <p className="p-3 bg-light rounded">{selectedMessage.subject}</p>
  </div>

  <div className="mb-3">
    <h6>Status:</h6>
    <Badge bg={getStatusBadgeColor(selectedMessage.status)} className="badge-content p-2">
      {selectedMessage.status}
    </Badge>
  </div>

  <div className="mb-3">
    <h6>Name:</h6>
    <p className="p-3 bg-light rounded">{selectedMessage.name}</p>
  </div>

  <div className="mb-3">
    <h6>Email:</h6>
    <p className="p-3 bg-light rounded">{selectedMessage.email}</p>
  </div>

  <div className="mb-3">
    <h6>Date:</h6>
    <p className="p-3 bg-light rounded">{formatDate(selectedMessage.createdAt)}</p>
  </div>

  <div className="mb-3">
    <h6>Message:</h6>
    <p className="p-3 bg-light rounded">{selectedMessage.message}</p>
  </div>
                
                {selectedMessage.reply && (
                  <div className="mb-3">
                    <h6>Réponse:</h6>
                    <div className="p-3 bg-light-blue rounded">
                      <p>{selectedMessage.reply.text}</p>
                      <small className="text-muted">
                        Envoyé le {formatDate(selectedMessage.reply.date)}
                      </small>
                    </div>
                  </div>
                )}
              </div>
              
              {selectedMessage.status !== 'replied' && (
                <Form onSubmit={handleSendReply}>
                  <Form.Group className="mb-3">
                    <Form.Label>Répondre</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={3}
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="Écrivez votre réponse ici..."
                      required
                    />
                  </Form.Group>
                  <Button 
                    variant="primary" 
                    type="submit"
                    className="w-100"
                  >
                    <Send size={16} className="me-2" />
                    Envoyer la réponse
                  </Button>
                </Form>
              )}
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button className="btn-danger" onClick={handleCloseMessageModal}>
            Fermer
          </Button>
        </Modal.Footer>
      </Modal>
      
      {/* Modal de suppression */}
      <Modal show={showDeleteModal} onHide={handleCloseDeleteModal}>
        <Modal.Header closeButton>
          <Modal.Title>Confirmer la suppression</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {messageToDelete && (
            <p>
              Êtes-vous sûr de vouloir supprimer le message de <strong>{messageToDelete.name}</strong> ?
              Cette action est irréversible.
            </p>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseDeleteModal}>
            Annuler
          </Button>
          <Button variant="danger" onClick={handleDeleteMessage}>
            Supprimer
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default ContactMessageManagement;
