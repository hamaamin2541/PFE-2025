import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Button, Spinner, Alert, Badge, Table } from 'react-bootstrap';
import { Users, Calendar, Clock, CheckCircle, X, BookOpen, BookCopy, ArrowRight, MessageSquare } from 'lucide-react';
import axios from 'axios';
import { API_BASE_URL } from '../../config/api';
import { useNavigate } from 'react-router-dom';
import './StudySessions.css';

const StudySessions = () => {
  const navigate = useNavigate();
  const [studySessions, setStudySessions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionInProgress, setActionInProgress] = useState(null);

  useEffect(() => {
    fetchStudySessions();
  }, []);

  const fetchStudySessions = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');

      if (!token) {
        setError('Vous devez être connecté pour accéder à vos sessions d\'étude');
        setIsLoading(false);
        return;
      }

      const response = await axios.get(`${API_BASE_URL}/api/study-sessions`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.data.success) {
        setStudySessions(response.data.data);
      } else {
        setError('Erreur lors du chargement des sessions d\'étude');
      }
    } catch (err) {
      console.error('Error fetching study sessions:', err);
      setError('Erreur lors du chargement des sessions d\'étude');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAcceptInvitation = async (sessionId) => {
    try {
      setActionInProgress(sessionId);
      const token = localStorage.getItem('token');

      const response = await axios.put(
        `${API_BASE_URL}/api/study-sessions/${sessionId}/accept`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.data.success) {
        // Update the local state to reflect the change
        setStudySessions(prevSessions =>
          prevSessions.map(session =>
            session._id === sessionId
              ? { ...session, status: 'active' }
              : session
          )
        );
      }
    } catch (err) {
      console.error('Error accepting invitation:', err);
      alert('Erreur lors de l\'acceptation de l\'invitation');
    } finally {
      setActionInProgress(null);
    }
  };

  const handleCancelSession = async (sessionId) => {
    try {
      setActionInProgress(sessionId);
      const token = localStorage.getItem('token');

      const response = await axios.put(
        `${API_BASE_URL}/api/study-sessions/${sessionId}/cancel`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.data.success) {
        // Update the local state to reflect the change
        setStudySessions(prevSessions =>
          prevSessions.map(session =>
            session._id === sessionId
              ? { ...session, status: 'cancelled' }
              : session
          )
        );
      }
    } catch (err) {
      console.error('Error cancelling session:', err);
      alert('Erreur lors de l\'annulation de la session');
    } finally {
      setActionInProgress(null);
    }
  };

  const handleJoinSession = (sessionId) => {
    // Navigate to the study session page with a query parameter to focus on the chat
    navigate(`/study-session/${sessionId}?focus=chat`);
  };

  // Format date for scheduled sessions
  const formatScheduledTime = (dateString) => {
    if (!dateString) return 'Non planifiée';
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  // Separate sessions into pending invitations and active/other sessions
  const pendingInvitations = studySessions.filter(
    session => session.status === 'pending' && session.guest?._id === localStorage.getItem('userId')
  );

  const activeSessions = studySessions.filter(
    session => session.status === 'active' || session.status === 'pending' && session.guest?._id !== localStorage.getItem('userId')
  );

  const pastSessions = studySessions.filter(
    session => session.status === 'completed' || session.status === 'cancelled'
  );

  if (isLoading) {
    return (
      <div className="text-center p-5">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Chargement...</span>
        </Spinner>
        <p className="mt-3">Chargement de vos sessions d'étude...</p>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="danger">{error}</Alert>
    );
  }

  return (
    <div className="study-sessions-container">

      {studySessions.length === 0 ? (
        <Alert variant="info">
          Vous n'avez pas encore de sessions d'étude. Vous pouvez inviter un ami à étudier avec vous depuis la page d'un cours.
        </Alert>
      ) : (
        <>
          {/* Pending Invitations Section */}
          {pendingInvitations.length > 0 && (
            <Card className="mb-4">
              <Card.Header className="bg-warning text-white">
                <h5 className="mb-0">Invitations en attente</h5>
              </Card.Header>
              <Card.Body>
                <Table responsive hover>
                  <thead>
                    <tr>
                      <th>Cours</th>
                      <th>Invité par</th>
                      <th>Date prévue</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingInvitations.map(session => (
                      <tr key={session._id}>
                        <td>
                          <div className="d-flex align-items-center">
                            {session.contentType === 'formation' ? (
                              <>
                                <BookCopy size={18} className="me-2 text-info" />
                                {session.formation?.title || session.content?.title || 'Formation non disponible'}
                              </>
                            ) : (
                              <>
                                <BookOpen size={18} className="me-2 text-primary" />
                                {session.course?.title || session.content?.title || 'Cours non disponible'}
                              </>
                            )}
                          </div>
                        </td>
                        <td>{session.host?.fullName || 'Utilisateur inconnu'}</td>
                        <td>{formatScheduledTime(session.scheduledTime)}</td>
                        <td>
                          <Button
                            variant="success"
                            size="sm"
                            className="me-2"
                            onClick={() => handleAcceptInvitation(session._id)}
                            disabled={actionInProgress === session._id}
                          >
                            {actionInProgress === session._id ? (
                              <Spinner animation="border" size="sm" />
                            ) : (
                              <><CheckCircle size={14} className="me-1" /> Accepter</>
                            )}
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => handleCancelSession(session._id)}
                            disabled={actionInProgress === session._id}
                          >
                            {actionInProgress === session._id ? (
                              <Spinner animation="border" size="sm" />
                            ) : (
                              <><X size={14} className="me-1" /> Refuser</>
                            )}
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </Card.Body>
            </Card>
          )}

          {/* Active Sessions Section */}
          {activeSessions.length > 0 && (
            <Card className="mb-4">
              <Card.Header className="bg-primary text-white">
                <h5 className="mb-0">Sessions actives</h5>
              </Card.Header>
              <Card.Body>
                <Row>
                  {activeSessions.map(session => (
                    <Col md={6} lg={4} key={session._id} className="mb-3">
                      <Card className="h-100 shadow-sm">
                        <Card.Body>
                          <div className="d-flex justify-content-between mb-2">
                            <Badge bg="primary">Session d'étude</Badge>
                            <Badge bg={session.status === 'active' ? 'success' : 'warning'}>
                              {session.status === 'active' ? 'Active' : 'En attente'}
                            </Badge>
                          </div>
                          <Card.Title>
                            {session.contentType === 'formation'
                              ? (session.formation?.title || session.content?.title || 'Formation non disponible')
                              : (session.course?.title || session.content?.title || 'Cours non disponible')
                            }
                          </Card.Title>
                          <div className="mb-3">
                            <div className="d-flex align-items-center mb-2">
                              <Users size={16} className="me-2 text-muted" />
                              <small>
                                {session.host?._id === localStorage.getItem('userId')
                                  ? `Avec: ${session.guest?.fullName || 'Invité'}`
                                  : `Avec: ${session.host?.fullName || 'Hôte'}`}
                              </small>
                            </div>
                            {session.scheduledTime && (
                              <div className="d-flex align-items-center mb-2">
                                <Calendar size={16} className="me-2 text-muted" />
                                <small>{formatScheduledTime(session.scheduledTime)}</small>
                              </div>
                            )}
                            <div className="d-flex align-items-center">
                              <Clock size={16} className="me-2 text-muted" />
                              <small>Créée le {new Date(session.createdAt).toLocaleDateString()}</small>
                            </div>
                          </div>
                          <div className="d-grid gap-2">
                            <Button
                              variant="success"
                              size="lg"
                              className="join-session-btn"
                              onClick={() => handleJoinSession(session._id)}
                            >
                              <ArrowRight size={16} className="me-2" />
                              Rejoindre la session maintenant
                            </Button>
                            <div className="d-flex justify-content-between mt-2">
                              <Button
                                variant="outline-primary"
                                className="flex-grow-1 me-2"
                                onClick={() => {
                                  if (session.contentType === 'formation') {
                                    if (session.formation && session.formation._id) {
                                      navigate(`/formations`);
                                    } else if (session.content && session.content._id) {
                                      navigate(`/formations`);
                                    } else {
                                      alert('Information de la formation non disponible');
                                    }
                                  } else {
                                    if (session.course && session.course._id) {
                                      navigate(`/course/${session.course._id}`);
                                    } else if (session.content && session.content._id) {
                                      navigate(`/course/${session.content._id}`);
                                    } else {
                                      alert('Information du cours non disponible');
                                    }
                                  }
                                }}
                                disabled={
                                  (session.contentType === 'formation' && !session.formation && !session.content) ||
                                  (session.contentType !== 'formation' && !session.course && !session.content)
                                }
                              >
                                {session.contentType === 'formation' ? (
                                  <>
                                    <BookCopy size={16} className="me-1" />
                                    Voir la formation
                                  </>
                                ) : (
                                  <>
                                    <BookOpen size={16} className="me-1" />
                                    Voir le cours
                                  </>
                                )}
                              </Button>
                              <Button
                                variant="outline-danger"
                                className="flex-grow-1"
                                onClick={() => handleCancelSession(session._id)}
                                disabled={actionInProgress === session._id}
                              >
                                {actionInProgress === session._id ? (
                                  <Spinner animation="border" size="sm" />
                                ) : (
                                  'Annuler'
                                )}
                              </Button>
                            </div>
                          </div>
                        </Card.Body>
                      </Card>
                    </Col>
                  ))}
                </Row>
              </Card.Body>
            </Card>
          )}

          {/* Past Sessions Section */}
          {pastSessions.length > 0 && (
            <Card>
              <Card.Header className="bg-secondary text-white">
                <h5 className="mb-0">Sessions passées</h5>
              </Card.Header>
              <Card.Body>
                <Table responsive hover>
                  <thead>
                    <tr>
                      <th>Cours</th>
                      <th>Avec</th>
                      <th>Statut</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pastSessions.map(session => (
                      <tr key={session._id}>
                        <td>
                          {session.contentType === 'formation'
                            ? (
                              <div className="d-flex align-items-center">
                                <BookCopy size={16} className="me-2 text-info" />
                                {session.formation?.title || session.content?.title || 'Formation non disponible'}
                              </div>
                            )
                            : (
                              <div className="d-flex align-items-center">
                                <BookOpen size={16} className="me-2 text-primary" />
                                {session.course?.title || session.content?.title || 'Cours non disponible'}
                              </div>
                            )
                          }
                        </td>
                        <td>
                          {session.host?._id === localStorage.getItem('userId')
                            ? session.guest?.fullName || 'Invité'
                            : session.host?.fullName || 'Hôte'}
                        </td>
                        <td>
                          <Badge bg={session.status === 'completed' ? 'success' : 'danger'}>
                            {session.status === 'completed' ? 'Terminée' : 'Annulée'}
                          </Badge>
                        </td>
                        <td>{new Date(session.createdAt).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </Card.Body>
            </Card>
          )}
        </>
      )}
    </div>
  );
};

export default StudySessions;
