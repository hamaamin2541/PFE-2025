import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Button, Form, InputGroup, Badge, Pagination, Spinner, Alert, Modal } from 'react-bootstrap';
import { Search, Eye, Trash2, Send, Filter, MessageSquare } from 'lucide-react';
import axios from 'axios';
import { API_BASE_URL } from '../../config/api';

const MessageManagement = () => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [messageToDelete, setMessageToDelete] = useState(null);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    fetchMessages();
  }, [currentPage, searchTerm, statusFilter]);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      // In a real application, this would be an API call to get messages
      // For now, we'll simulate it with mock data
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Mock data
      const mockMessages = [
        {
          _id: '1',
          sender: { _id: 'user1', fullName: 'John Doe', email: 'john@example.com' },
          subject: 'Question about course',
          content: 'I have a question about the JavaScript course. When will the next module be available?',
          status: 'unread',
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
          replies: []
        },
        {
          _id: '2',
          sender: { _id: 'user2', fullName: 'Jane Smith', email: 'jane@example.com' },
          subject: 'Technical issue',
          content: 'I cannot access the video lectures. The player shows an error.',
          status: 'read',
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
          replies: [
            {
              _id: 'reply1',
              sender: { _id: 'admin', fullName: 'Admin', email: 'admin@example.com' },
              content: 'We are looking into this issue. Please try clearing your browser cache.',
              createdAt: new Date(Date.now() - 1000 * 60 * 60 * 12) // 12 hours ago
            }
          ]
        },
        {
          _id: '3',
          sender: { _id: 'user3', fullName: 'Robert Johnson', email: 'robert@example.com' },
          subject: 'Payment confirmation',
          content: 'I made a payment for the premium subscription but haven\'t received confirmation.',
          status: 'unread',
          createdAt: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
          replies: []
        }
      ];
      
      // Filter by search term
      let filteredMessages = mockMessages;
      if (searchTerm) {
        filteredMessages = filteredMessages.filter(message => 
          message.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
          message.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
          message.sender.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          message.sender.email.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }
      
      // Filter by status
      if (statusFilter) {
        filteredMessages = filteredMessages.filter(message => message.status === statusFilter);
      }
      
      setMessages(filteredMessages);
      setTotalPages(Math.ceil(filteredMessages.length / 10) || 1);
      
    } catch (err) {
      console.error('Error fetching messages:', err);
      setError('Une erreur est survenue lors du chargement des messages');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchMessages();
  };

  const handleStatusFilterChange = (e) => {
    setStatusFilter(e.target.value);
    setCurrentPage(1);
  };

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
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
      // In a real application, this would be an API call to delete the message
      // For now, we'll just simulate it
      
      // Remove the message from the local state
      setMessages(prevMessages => prevMessages.filter(message => message._id !== messageToDelete._id));
      setSuccessMessage('Message supprimé avec succès');
      
    } catch (err) {
      console.error('Error deleting message:', err);
      setError('Une erreur est survenue lors de la suppression du message');
    } finally {
      handleCloseDeleteModal();
    }
  };

  const handleShowMessageModal = (message) => {
    setSelectedMessage(message);
    setReplyText('');
    setShowMessageModal(true);
    
    // Mark as read if unread
    if (message.status === 'unread') {
      setMessages(prevMessages => 
        prevMessages.map(m => 
          m._id === message._id ? { ...m, status: 'read' } : m
        )
      );
    }
  };

  const handleCloseMessageModal = () => {
    setShowMessageModal(false);
    setSelectedMessage(null);
    setReplyText('');
  };

  const handleSendReply = async () => {
    if (!replyText.trim()) return;
    
    try {
      // In a real application, this would be an API call to send the reply
      // For now, we'll just simulate it
      
      const newReply = {
        _id: `reply${Date.now()}`,
        sender: { _id: 'admin', fullName: 'Admin', email: 'admin@example.com' },
        content: replyText,
        createdAt: new Date()
      };
      
      // Add the reply to the message
      setMessages(prevMessages => 
        prevMessages.map(message => 
          message._id === selectedMessage._id 
            ? { ...message, replies: [...message.replies, newReply] } 
            : message
        )
      );
      
      setSuccessMessage('Réponse envoyée avec succès');
      setReplyText('');
      
    } catch (err) {
      console.error('Error sending reply:', err);
      setError('Une erreur est survenue lors de l\'envoi de la réponse');
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

  return (
    <Container fluid className="py-4">
      <Card className="shadow mb-4">
        <Card.Header className="py-3 d-flex flex-row align-items-center justify-content-between">
          <h6 className="m-0 font-weight-bold text-primary">Gestion des messages</h6>
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
              <Form onSubmit={handleSearch}>
                <InputGroup>
                  <Form.Control
                    placeholder="Rechercher par sujet, contenu ou expéditeur"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <Button variant="primary" type="submit">
                    <Search size={16} />
                  </Button>
                </InputGroup>
              </Form>
            </Col>
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
                    <th>Expéditeur</th>
                    <th>Sujet</th>
                    <th>Statut</th>
                    <th>Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {messages.length > 0 ? (
                    messages.map((message) => (
                      <tr key={message._id} className={message.status === 'unread' ? 'table-primary' : ''}>
                        <td>{message.sender.fullName}</td>
                        <td>{message.subject}</td>
                        <td>
                          <Badge bg={message.status === 'unread' ? 'primary' : 'secondary'}>
                            {message.status === 'unread' ? 'Non lu' : 'Lu'}
                          </Badge>
                        </td>
                        <td>{message.createdAt.toLocaleDateString()} {message.createdAt.toLocaleTimeString()}</td>
                        <td>
                          <Button 
                            variant="info" 
                            size="sm" 
                            className="me-1"
                            onClick={() => handleShowMessageModal(message)}
                          >
                            <Eye size={16} />
                          </Button>
                          <Button 
                            variant="danger" 
                            size="sm"
                            onClick={() => handleShowDeleteModal(message)}
                          >
                            <Trash2 size={16} />
                          </Button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="text-center">
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
      
      {/* Modal de suppression */}
      <Modal show={showDeleteModal} onHide={handleCloseDeleteModal}>
        <Modal.Header closeButton>
          <Modal.Title>Confirmer la suppression</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {messageToDelete && (
            <p>
              Êtes-vous sûr de vouloir supprimer le message <strong>"{messageToDelete.subject}"</strong> ?
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
      
      {/* Modal d'affichage/réponse de message */}
      <Modal show={showMessageModal} onHide={handleCloseMessageModal} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            <div className="d-flex align-items-center">
              <MessageSquare size={20} className="me-2" />
              {selectedMessage?.subject}
            </div>
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedMessage && (
            <div>
              <div className="message-info mb-3">
                <div><strong>De:</strong> {selectedMessage.sender.fullName} ({selectedMessage.sender.email})</div>
                <div><strong>Date:</strong> {selectedMessage.createdAt.toLocaleDateString()} {selectedMessage.createdAt.toLocaleTimeString()}</div>
              </div>
              
              <div className="message-content p-3 bg-light rounded mb-4">
                {selectedMessage.content}
              </div>
              
              {selectedMessage.replies.length > 0 && (
                <div className="message-replies mb-4">
                  <h6 className="mb-3">Réponses précédentes</h6>
                  {selectedMessage.replies.map((reply, index) => (
                    <div key={reply._id} className="reply p-3 bg-light rounded mb-2 ms-4">
                      <div className="reply-info mb-2 text-muted">
                        <small>
                          <strong>{reply.sender.fullName}</strong> - {reply.createdAt.toLocaleDateString()} {reply.createdAt.toLocaleTimeString()}
                        </small>
                      </div>
                      <div className="reply-content">
                        {reply.content}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              <div className="reply-form">
                <h6 className="mb-3">Répondre</h6>
                <Form.Group className="mb-3">
                  <Form.Control
                    as="textarea"
                    rows={4}
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Écrivez votre réponse ici..."
                  />
                </Form.Group>
                <div className="d-flex justify-content-end">
                  <Button 
                    variant="primary" 
                    onClick={handleSendReply}
                    disabled={!replyText.trim()}
                  >
                    <Send size={16} className="me-2" />
                    Envoyer
                  </Button>
                </div>
              </div>
            </div>
          )}
        </Modal.Body>
      </Modal>
    </Container>
  );
};

export default MessageManagement;
