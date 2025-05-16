import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../../config/api';
import { Container, Row, Col, ListGroup, InputGroup, Form, Button, Modal, Alert } from 'react-bootstrap';
import { Search, Mail, Inbox, Send, Trash2, Star, Archive, X, ArrowLeft, Plus } from 'lucide-react';

const TeacherMessages = ({ teacherId }) => {
  const [activeFolder, setActiveFolder] = useState('inbox');
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Reply functionality
  const [showReplyModal, setShowReplyModal] = useState(false);
  const [replyMessage, setReplyMessage] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  const [replyError, setReplyError] = useState(null);
  const [replySuccess, setReplySuccess] = useState(null);

  // New message functionality
  const [showNewMessageModal, setShowNewMessageModal] = useState(false);
  const [newMessage, setNewMessage] = useState({
    recipientId: '',
    subject: '',
    content: ''
  });
  const [teachers, setTeachers] = useState([]);
  const [students, setStudents] = useState([]);
  const [recipientType, setRecipientType] = useState('teacher');
  const [sendingMessage, setSendingMessage] = useState(false);

  // Handle teacherId prop if provided
  useEffect(() => {
    if (teacherId) {
      fetchTeachers();
      setRecipientType('teacher');
      setNewMessage(prev => ({
        ...prev,
        recipientId: teacherId
      }));
      setShowNewMessageModal(true);
    }
  }, [teacherId]);

  // Fetch messages from API
  const fetchMessages = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      if (!token) {
        setError('Vous devez être connecté pour voir vos messages');
        setLoading(false);
        return;
      }

      const response = await axios.get(`${API_BASE_URL}/api/messages?folder=${activeFolder}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.data.success) {
        setMessages(response.data.data);
        setError(null);
      }
    } catch (err) {
      console.error('Error fetching messages:', err);
      setError('Erreur lors du chargement des messages');
    } finally {
      setLoading(false);
    }
  };

  // Mark message as read when selected
  const handleSelectMessage = async (message) => {
    setSelectedMessage(message);

    // If message is unread, mark it as read
    if (!message.read && activeFolder === 'inbox') {
      try {
        const token = localStorage.getItem('token');
        await axios.put(`${API_BASE_URL}/api/messages/${message._id}/read`, {}, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        // Update the message in the list
        setMessages(prevMessages =>
          prevMessages.map(msg =>
            msg._id === message._id ? { ...msg, read: true } : msg
          )
        );
      } catch (err) {
        console.error('Error marking message as read:', err);
      }
    }
  };

  // Load messages when folder changes
  useEffect(() => {
    fetchMessages();
  }, [activeFolder]);

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  // Handle opening the reply modal
  const handleOpenReply = () => {
    setReplyMessage('');
    setReplyError(null);
    setReplySuccess(null);
    setShowReplyModal(true);
  };

  // Handle sending a reply
  const handleSendReply = async () => {
    if (!replyMessage.trim()) {
      setReplyError('Veuillez saisir un message');
      return;
    }

    try {
      setSendingReply(true);
      setReplyError(null);

      const token = localStorage.getItem('token');

      // Create a new message as a reply
      const replyData = {
        recipientId: selectedMessage.sender._id,
        subject: `Re: ${selectedMessage.subject}`,
        content: replyMessage
      };

      const response = await axios.post(`${API_BASE_URL}/api/messages`, replyData, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.data.success) {
        setReplySuccess('Réponse envoyée avec succès');

        // Close the modal after a delay
        setTimeout(() => {
          setShowReplyModal(false);
          setReplySuccess(null);

          // Refresh sent messages if we're in the sent folder
          if (activeFolder === 'sent') {
            fetchMessages();
          }
        }, 1500);
      }
    } catch (err) {
      console.error('Error sending reply:', err);
      setReplyError(err.response?.data?.message || 'Erreur lors de l\'envoi de la réponse');
    } finally {
      setSendingReply(false);
    }
  };

  // Fetch teachers for the new message modal
  const fetchTeachers = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/users/byRole/teacher`);

      if (response.data.success) {
        setTeachers(response.data.data);
      }
    } catch (err) {
      console.error('Error fetching teachers:', err);
    }
  };

  // Fetch students for the new message modal
  const fetchStudents = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/users/byRole/student`);

      if (response.data.success) {
        setStudents(response.data.data);
      }
    } catch (err) {
      console.error('Error fetching students:', err);
    }
  };

  // Open new message modal and fetch recipients
  const handleNewMessage = () => {
    fetchTeachers();
    fetchStudents();
    setShowNewMessageModal(true);
  };

  // Handle recipient type change
  const handleRecipientTypeChange = (type) => {
    setRecipientType(type);
    setNewMessage(prev => ({
      ...prev,
      recipientId: ''
    }));
  };

  // Handle input changes for new message form
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewMessage(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Send a new message
  const handleSendMessage = async (e) => {
    e.preventDefault();

    if (!newMessage.recipientId || !newMessage.subject || !newMessage.content) {
      setError('Veuillez remplir tous les champs');
      return;
    }

    try {
      setSendingMessage(true);
      const token = localStorage.getItem('token');

      const response = await axios.post(`${API_BASE_URL}/api/messages`, newMessage, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.data.success) {
        // Close modal and reset form
        setShowNewMessageModal(false);

        // Reset the form
        setNewMessage({
          recipientId: '',
          subject: '',
          content: ''
        });

        // Refresh messages to update the list
        fetchMessages();
      }
    } catch (err) {
      console.error('Error sending message:', err);
      setError('Erreur lors de l\'envoi du message');
    } finally {
      setSendingMessage(false);
    }
  };

  // Filter messages based on search term
  const filteredMessages = messages.filter(message =>
    message.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    message.content?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (activeFolder === 'inbox' && message.sender?.fullName?.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (activeFolder === 'sent' && message.recipient?.fullName?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <Container fluid className="p-4">
      <Row style={{ height: 'calc(100vh - 100px)' }}>
        {/* Folders Sidebar */}
        <Col md={2} className="border-end">
          <div className="folders-sidebar">
            <h5 className="mb-3">Messages</h5>
            <Button
              variant="primary"
              className="w-100 mb-3"
              onClick={handleNewMessage}
            >
              <Plus size={16} className="me-2" />
              Nouveau message
            </Button>
            <ListGroup variant="flush">
              <ListGroup.Item
                action
                active={activeFolder === 'inbox'}
                onClick={() => setActiveFolder('inbox')}
              >
                <Inbox size={16} className="me-2" />
                Boîte de réception
              </ListGroup.Item>
              <ListGroup.Item
                action
                active={activeFolder === 'sent'}
                onClick={() => setActiveFolder('sent')}
              >
                <Send size={16} className="me-2" />
                Envoyés
              </ListGroup.Item>
              <ListGroup.Item
                action
                active={activeFolder === 'trash'}
                onClick={() => setActiveFolder('trash')}
              >
                <Trash2 size={16} className="me-2" />
                Corbeille
              </ListGroup.Item>
            </ListGroup>
          </div>
        </Col>

        {/* Message List */}
        <Col md={3} className="border-end p-0">
          <div className="message-list">
            <div className="p-3 border-bottom">
              <InputGroup>
                <InputGroup.Text>
                  <Search size={16} />
                </InputGroup.Text>
                <Form.Control
                  placeholder="Rechercher des messages..."
                  onChange={handleSearch}
                />
              </InputGroup>
            </div>

            {loading ? (
              <div className="text-center p-4 text-muted">
                <p className="mt-2">Chargement des messages...</p>
              </div>
            ) : filteredMessages.length === 0 ? (
              <div className="text-center p-4 text-muted">
                <Mail size={40} />
                <p className="mt-2">Aucun message</p>
              </div>
            ) : (
              <ListGroup variant="flush">
                {filteredMessages.map((message) => (
                  <ListGroup.Item
                    key={message._id}
                    action
                    active={selectedMessage?._id === message._id}
                    onClick={() => handleSelectMessage(message)}
                    className={`border-bottom ${!message.read && activeFolder === 'inbox' ? 'fw-bold' : ''}`}
                  >
                    <div className="d-flex justify-content-between align-items-start">
                      <div>
                        <h6 className="mb-1">{message.subject}</h6>
                        <small>
                          {activeFolder === 'sent'
                            ? `À: ${message.recipient?.fullName || 'Destinataire'}`
                            : `De: ${message.sender?.fullName || 'Expéditeur'}`
                          }
                        </small>
                      </div>
                      <small className="text-muted">
                        {new Date(message.createdAt).toLocaleDateString()}
                      </small>
                    </div>
                  </ListGroup.Item>
                ))}
              </ListGroup>
            )}
          </div>
        </Col>

        {/* Message Content */}
        <Col md={7} className="p-0">
          {selectedMessage ? (
            <div className="p-4">
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h4>{selectedMessage.subject}</h4>
                <div>
                  <Button
                    variant="light"
                    size="sm"
                    className="me-2"
                    onClick={async () => {
                      try {
                        const token = localStorage.getItem('token');
                        await axios.put(`${API_BASE_URL}/api/messages/${selectedMessage._id}/star`, {}, {
                          headers: { 'Authorization': `Bearer ${token}` }
                        });

                        // Update the message in the list
                        setMessages(prevMessages =>
                          prevMessages.map(msg =>
                            msg._id === selectedMessage._id ? { ...msg, starred: !msg.starred } : msg
                          )
                        );

                        // Update selected message
                        setSelectedMessage(prev => ({ ...prev, starred: !prev.starred }));
                      } catch (err) {
                        console.error('Error toggling star:', err);
                      }
                    }}
                  >
                    <Star size={16} fill={selectedMessage.starred ? "#f4c150" : "none"} />
                  </Button>
                  <Button
                    variant="light"
                    size="sm"
                    className="me-2"
                    onClick={async () => {
                      try {
                        const token = localStorage.getItem('token');
                        await axios.put(`${API_BASE_URL}/api/messages/${selectedMessage._id}/trash`, {}, {
                          headers: { 'Authorization': `Bearer ${token}` }
                        });

                        // Remove the message from the current list
                        setMessages(prevMessages =>
                          prevMessages.filter(msg => msg._id !== selectedMessage._id)
                        );

                        // Clear selected message
                        setSelectedMessage(null);
                      } catch (err) {
                        console.error('Error moving to trash:', err);
                      }
                    }}
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
              </div>

              <div className="d-flex justify-content-between align-items-center mb-4">
                <div className="d-flex align-items-center">
                  <div className="avatar me-2">
                    <img
                      src={activeFolder === 'sent'
                        ? `${API_BASE_URL}/${selectedMessage.recipient?.profileImage || 'images/default-profile.jpg'}`
                        : `${API_BASE_URL}/${selectedMessage.sender?.profileImage || 'images/default-profile.jpg'}`
                      }
                      alt="Avatar"
                      className="rounded-circle"
                      width="40"
                      height="40"
                      onError={(e) => {
                        e.target.src = "https://randomuser.me/api/portraits/men/32.jpg";
                      }}
                    />
                  </div>
                  <div>
                    <div>
                      {activeFolder === 'sent'
                        ? selectedMessage.recipient?.fullName || 'Destinataire'
                        : selectedMessage.sender?.fullName || 'Expéditeur'
                      }
                    </div>
                    <small className="text-muted">
                      {activeFolder === 'sent' ? 'De moi' : 'À moi'}
                    </small>
                  </div>
                </div>
                <small className="text-muted">
                  {new Date(selectedMessage.createdAt).toLocaleString()}
                </small>
              </div>

              <div className="message-content p-3 border rounded mb-4">
                <p>{selectedMessage.content}</p>
                <p>Cordialement,</p>
                <p>{activeFolder === 'sent' ? 'Moi' : selectedMessage.sender?.fullName || 'Expéditeur'}</p>
              </div>

              {activeFolder === 'inbox' && (
                <div className="mt-3">
                  {!selectedMessage.fromAdmin ? (
                    <Button
                      variant="primary"
                      onClick={handleOpenReply}
                    >
                      <Send size={16} className="me-2" />
                      Répondre
                    </Button>
                  ) : (
                    <div className="alert alert-info">
                      Ce message a été envoyé par un administrateur et ne peut pas recevoir de réponse.
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="text-center p-5 text-muted">
              <Mail size={48} />
              <h5 className="mt-3">Sélectionnez un message pour le lire</h5>
            </div>
          )}
        </Col>
      </Row>

      {/* Reply Modal */}
      <Modal show={showReplyModal} onHide={() => setShowReplyModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>
            <div className="d-flex align-items-center">
              <ArrowLeft className="me-2" />
              Répondre à {selectedMessage?.sender?.fullName}
            </div>
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {replyError && (
            <Alert variant="danger" className="mb-3">
              {replyError}
            </Alert>
          )}

          {replySuccess && (
            <Alert variant="success" className="mb-3">
              {replySuccess}
            </Alert>
          )}

          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Sujet</Form.Label>
              <Form.Control
                type="text"
                value={selectedMessage ? `Re: ${selectedMessage.subject}` : ''}
                disabled
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Message</Form.Label>
              <Form.Control
                as="textarea"
                rows={5}
                value={replyMessage}
                onChange={(e) => setReplyMessage(e.target.value)}
                placeholder="Écrivez votre réponse ici..."
                disabled={sendingReply}
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowReplyModal(false)} disabled={sendingReply}>
            Annuler
          </Button>
          <Button
            variant="primary"
            onClick={handleSendReply}
            disabled={sendingReply || !replyMessage.trim()}
          >
            {sendingReply ? 'Envoi en cours...' : 'Envoyer'}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* New Message Modal */}
      <Modal
        show={showNewMessageModal}
        onHide={() => setShowNewMessageModal(false)}
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>Nouveau message</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {error && (
            <div className="alert alert-danger">{error}</div>
          )}
          <Form onSubmit={handleSendMessage}>
            <div className="mb-3">
              <div className="btn-group w-100 mb-3">
                <button
                  type="button"
                  className={`btn ${recipientType === 'teacher' ? 'btn-primary' : 'btn-outline-primary'}`}
                  onClick={() => handleRecipientTypeChange('teacher')}
                >
                  Professeurs
                </button>
                <button
                  type="button"
                  className={`btn ${recipientType === 'student' ? 'btn-primary' : 'btn-outline-primary'}`}
                  onClick={() => handleRecipientTypeChange('student')}
                >
                  Étudiants
                </button>
              </div>
            </div>

            <Form.Group className="mb-3">
              <Form.Label>Destinataire</Form.Label>
              {recipientType === 'teacher' ? (
                <Form.Select
                  name="recipientId"
                  value={newMessage.recipientId}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Sélectionnez un professeur</option>
                  {teachers.map(teacher => (
                    <option key={teacher._id} value={teacher._id}>
                      {teacher.fullName}
                    </option>
                  ))}
                </Form.Select>
              ) : (
                <Form.Select
                  name="recipientId"
                  value={newMessage.recipientId}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Sélectionnez un étudiant</option>
                  {students.map(student => (
                    <option key={student._id} value={student._id}>
                      {student.fullName}
                    </option>
                  ))}
                </Form.Select>
              )}
            </Form.Group>

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

export default TeacherMessages;