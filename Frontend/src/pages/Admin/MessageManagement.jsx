import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Button, Form, InputGroup, Badge, Pagination, Spinner, Alert, Modal, Tabs, Tab } from 'react-bootstrap';
import { Search, Eye, Trash2, Send, Filter, MessageSquare, Users, UserCheck, User, Star, Shield } from 'lucide-react';
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
  const [activeFolder, setActiveFolder] = useState('inbox');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [messageToDelete, setMessageToDelete] = useState(null);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // New message modal state
  const [showNewMessageModal, setShowNewMessageModal] = useState(false);
  const [newMessage, setNewMessage] = useState({
    subject: '',
    content: '',
    recipientType: 'all',
    recipients: []
  });
  const [users, setUsers] = useState([]);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [selectedTab, setSelectedTab] = useState('all');

  useEffect(() => {
    fetchMessages();
  }, [currentPage, searchTerm, statusFilter, activeFolder]);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      // Fetch real messages from the API
      const response = await axios.get(`${API_BASE_URL}/api/messages?folder=${activeFolder}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.data.success) {
        let fetchedMessages = response.data.data;

        // Filter by search term if provided
        if (searchTerm) {
          fetchedMessages = fetchedMessages.filter(message =>
            message.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            message.content?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            message.sender?.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            message.sender?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            message.recipient?.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            message.recipient?.email?.toLowerCase().includes(searchTerm.toLowerCase())
          );
        }

        // Filter by read/unread status if provided
        if (statusFilter) {
          const isRead = statusFilter === 'read';
          fetchedMessages = fetchedMessages.filter(message => message.read === isRead);
        }

        // Format messages for display
        const formattedMessages = fetchedMessages.map(message => ({
          ...message,
          status: message.read ? 'read' : 'unread',
          // Add empty replies array if not present (for compatibility with existing code)
          replies: message.replies || []
        }));

        setMessages(formattedMessages);
        setTotalPages(Math.ceil(formattedMessages.length / 10) || 1);
      }
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
      const token = localStorage.getItem('token');

      // Move the message to trash instead of deleting it completely
      await axios.put(`${API_BASE_URL}/api/messages/${messageToDelete._id}/trash`, {}, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      // Remove the message from the current view (unless we're in trash folder)
      if (activeFolder !== 'trash') {
        setMessages(prevMessages => prevMessages.filter(message => message._id !== messageToDelete._id));
      } else {
        // If we're in trash folder, just refresh the messages
        fetchMessages();
      }

      setSuccessMessage('Message déplacé vers la corbeille');

    } catch (err) {
      console.error('Error moving message to trash:', err);
      setError('Une erreur est survenue lors de la suppression du message');
    } finally {
      handleCloseDeleteModal();
    }
  };

  const handleShowMessageModal = async (message) => {
    setSelectedMessage(message);
    setReplyText('');
    setShowMessageModal(true);

    // Mark as read if unread and not in sent folder
    if (message.status === 'unread' && activeFolder !== 'sent') {
      try {
        const token = localStorage.getItem('token');
        await axios.put(`${API_BASE_URL}/api/messages/${message._id}/read`, {}, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        // Update the message in the list
        setMessages(prevMessages =>
          prevMessages.map(m =>
            m._id === message._id ? { ...m, status: 'read', read: true } : m
          )
        );
      } catch (err) {
        console.error('Error marking message as read:', err);
      }
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
      const token = localStorage.getItem('token');

      // Create a new message as a reply
      const replyData = {
        recipientId: selectedMessage.sender._id,
        subject: `Re: ${selectedMessage.subject}`,
        content: replyText
      };

      const response = await axios.post(`${API_BASE_URL}/api/messages`, replyData, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.data.success) {
        setSuccessMessage('Réponse envoyée avec succès');
        setReplyText('');
        setShowMessageModal(false);

        // Refresh messages if we're in the sent folder
        if (activeFolder === 'sent') {
          fetchMessages();
        }
      }
    } catch (err) {
      console.error('Error sending reply:', err);
      setError(err.response?.data?.message || 'Une erreur est survenue lors de l\'envoi de la réponse');
    }
  };

  // Fetch users for the new message modal
  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/api/admin/users`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.data.success) {
        setUsers(response.data.data);
      }
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Une erreur est survenue lors du chargement des utilisateurs');
    }
  };

  // Open new message modal and fetch users
  const handleNewMessage = () => {
    fetchUsers();
    setNewMessage({
      subject: '',
      content: '',
      recipientType: 'all',
      recipients: []
    });
    setSelectedTab('all');
    setShowNewMessageModal(true);
  };

  // Handle input changes for new message form
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewMessage(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle recipient selection
  const handleRecipientSelection = (e) => {
    const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
    setNewMessage(prev => ({
      ...prev,
      recipients: selectedOptions
    }));
  };

  // Handle tab change
  const handleTabChange = (tab) => {
    setSelectedTab(tab);
    setNewMessage(prev => ({
      ...prev,
      recipientType: tab,
      recipients: []
    }));
  };

  // Send a new message
  const handleSendMessage = async (e) => {
    e.preventDefault();

    if (!newMessage.subject || !newMessage.content) {
      setError('Veuillez remplir tous les champs');
      return;
    }

    try {
      setSendingMessage(true);
      const token = localStorage.getItem('token');

      // Prepare the request data based on the selected tab
      const messageData = {
        subject: newMessage.subject,
        content: newMessage.content
      };

      if (selectedTab === 'specific') {
        if (newMessage.recipients.length === 0) {
          setError('Veuillez sélectionner au moins un destinataire');
          setSendingMessage(false);
          return;
        }
        messageData.recipients = newMessage.recipients;
      } else {
        messageData.recipientType = selectedTab;
      }

      const response = await axios.post(`${API_BASE_URL}/api/messages/admin/send`, messageData, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.data.success) {
        setSuccessMessage(`Message envoyé avec succès à ${response.data.data.recipientCount} destinataire(s)`);
        setShowNewMessageModal(false);

        // Refresh messages if we're in the sent folder
        if (activeFolder === 'sent') {
          fetchMessages();
        }
      }
    } catch (err) {
      console.error('Error sending message:', err);
      setError(err.response?.data?.message || 'Une erreur est survenue lors de l\'envoi du message');
    } finally {
      setSendingMessage(false);
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
          <Button variant="primary" onClick={handleNewMessage}>
            <Send size={16} className="me-2" />
            Nouveau message
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

          <Row className="mb-3">
            <Col md={12} className="mb-3">
              <div className="d-flex">
                <Button
                  variant={activeFolder === 'inbox' ? 'primary' : 'outline-primary'}
                  className="me-2"
                  onClick={() => setActiveFolder('inbox')}
                >
                  <MessageSquare size={16} className="me-1" />
                  Boîte de réception
                </Button>
                <Button
                  variant={activeFolder === 'sent' ? 'primary' : 'outline-primary'}
                  className="me-2"
                  onClick={() => setActiveFolder('sent')}
                >
                  <Send size={16} className="me-1" />
                  Messages envoyés
                </Button>
                <Button
                  variant={activeFolder === 'starred' ? 'primary' : 'outline-primary'}
                  className="me-2"
                  onClick={() => setActiveFolder('starred')}
                >
                  <Star size={16} className="me-1" />
                  Favoris
                </Button>
                <Button
                  variant={activeFolder === 'trash' ? 'primary' : 'outline-primary'}
                  onClick={() => setActiveFolder('trash')}
                >
                  <Trash2 size={16} className="me-1" />
                  Corbeille
                </Button>
              </div>
            </Col>
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
                    {activeFolder === 'sent' ? <th>Destinataire(s)</th> : <th>Expéditeur</th>}
                    <th>Sujet</th>
                    {activeFolder !== 'sent' && <th>Statut</th>}
                    <th>Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {messages.length > 0 ? (
                    messages.map((message) => (
                      <tr key={message._id} className={message.status === 'unread' && activeFolder !== 'sent' ? 'table-primary' : ''}>
                        <td>
                          {activeFolder === 'sent' ? (
                            message.recipientCount > 1 ? (
                              `${message.recipientCount} destinataires`
                            ) : (
                              message.recipient?.fullName || 'Destinataire'
                            )
                          ) : (
                            message.sender?.fullName || 'Expéditeur'
                          )}
                        </td>
                        <td>{message.subject}</td>
                        {activeFolder !== 'sent' && (
                          <td>
                            <Badge bg={message.status === 'unread' ? 'primary' : 'secondary'}>
                              {message.status === 'unread' ? 'Non lu' : 'Lu'}
                            </Badge>
                          </td>
                        )}
                        <td>{new Date(message.createdAt).toLocaleDateString()} {new Date(message.createdAt).toLocaleTimeString()}</td>
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
                      <td colSpan={activeFolder === 'sent' ? 4 : 5} className="text-center">
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
                {activeFolder === 'sent' ? (
                  <>
                    <div>
                      <strong>À:</strong> {selectedMessage.recipientCount > 1
                        ? `${selectedMessage.recipientCount} destinataires`
                        : `${selectedMessage.recipient?.fullName || 'Destinataire'} (${selectedMessage.recipient?.email || 'Email non disponible'})`}
                    </div>
                    <div><strong>De:</strong> Vous (Admin)</div>
                  </>
                ) : (
                  <div><strong>De:</strong> {selectedMessage.sender?.fullName || 'Expéditeur'} ({selectedMessage.sender?.email || 'Email non disponible'})</div>
                )}
                <div><strong>Date:</strong> {new Date(selectedMessage.createdAt).toLocaleDateString()} {new Date(selectedMessage.createdAt).toLocaleTimeString()}</div>
                <div><strong>Sujet:</strong> {selectedMessage.subject}</div>
              </div>

              <div className="message-content p-3 bg-light rounded mb-4">
                {selectedMessage.content}
              </div>

              {/* Only show reply form if we're not in sent folder */}
              {activeFolder !== 'sent' && (
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
              )}

              {/* Show info message for admin messages sent to non-admin users */}
              {selectedMessage.fromAdmin && activeFolder === 'sent' && (
                <div className="alert alert-info">
                  Ce message a été envoyé en tant qu'administrateur aux utilisateurs non-administrateurs. Ces destinataires ne peuvent pas y répondre.
                </div>
              )}
            </div>
          )}
        </Modal.Body>
      </Modal>

      {/* New Message Modal */}
      <Modal
        show={showNewMessageModal}
        onHide={() => setShowNewMessageModal(false)}
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>
            <div className="d-flex align-items-center">
              <Send size={20} className="me-2" />
              Nouveau message
            </div>
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {error && (
            <Alert variant="danger" onClose={() => setError(null)} dismissible>
              {error}
            </Alert>
          )}

          <Form onSubmit={handleSendMessage}>
            <Tabs
              activeKey={selectedTab}
              onSelect={handleTabChange}
              className="mb-3"
            >
              <Tab
                eventKey="all"
                title={
                  <div className="d-flex align-items-center">
                    <Users size={16} className="me-1" />
                    Tous les utilisateurs
                  </div>
                }
              />
              <Tab
                eventKey="students"
                title={
                  <div className="d-flex align-items-center">
                    <User size={16} className="me-1" />
                    Étudiants
                  </div>
                }
              />
              <Tab
                eventKey="teachers"
                title={
                  <div className="d-flex align-items-center">
                    <UserCheck size={16} className="me-1" />
                    Professeurs
                  </div>
                }
              />
              <Tab
                eventKey="admins"
                title={
                  <div className="d-flex align-items-center">
                    <Shield size={16} className="me-1" />
                    Administrateurs
                  </div>
                }
              />
              <Tab
                eventKey="specific"
                title={
                  <div className="d-flex align-items-center">
                    <Users size={16} className="me-1" />
                    Utilisateurs spécifiques
                  </div>
                }
              />
            </Tabs>

            {selectedTab === 'specific' && (
              <Form.Group className="mb-3">
                <Form.Label>Destinataires</Form.Label>
                <Form.Select
                  multiple
                  size={5}
                  value={newMessage.recipients}
                  onChange={handleRecipientSelection}
                  required={selectedTab === 'specific'}
                >
                  {users.map(user => (
                    <option key={user._id} value={user._id}>
                      {user.fullName} ({user.email}) - {user.role === 'student' ? 'Étudiant' : user.role === 'teacher' ? 'Professeur' : 'Admin'}
                    </option>
                  ))}
                </Form.Select>
                <Form.Text className="text-muted">
                  Maintenez la touche Ctrl (ou Cmd sur Mac) pour sélectionner plusieurs destinataires.
                </Form.Text>
              </Form.Group>
            )}

            <Form.Group className="mb-3">
              <Form.Label>Sujet</Form.Label>
              <Form.Control
                type="text"
                name="subject"
                value={newMessage.subject}
                onChange={handleInputChange}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Message</Form.Label>
              <Form.Control
                as="textarea"
                rows={5}
                name="content"
                value={newMessage.content}
                onChange={handleInputChange}
                required
              />
            </Form.Group>

            <div className="d-flex justify-content-end">
              <Button
                variant="secondary"
                className="me-2"
                onClick={() => setShowNewMessageModal(false)}
                disabled={sendingMessage}
              >
                Annuler
              </Button>
              <Button
                variant="primary"
                type="submit"
                disabled={sendingMessage}
              >
                {sendingMessage ? 'Envoi en cours...' : 'Envoyer'}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>
    </Container>
  );
};

export default MessageManagement;
