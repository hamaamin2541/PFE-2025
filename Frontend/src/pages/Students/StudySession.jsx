import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Alert, Spinner, Badge, Toast, ToastContainer } from 'react-bootstrap';
import { ArrowLeft, Users, Clock, Calendar, MessageSquare, Download, BookOpen, BookCopy } from 'lucide-react';
import axios from 'axios';
import { API_BASE_URL } from '../../config/api';
import SynchronizedVideoPlayer from '../../components/StudyWithFriend/SynchronizedVideoPlayer';
import StudySessionChat from '../../components/StudyWithFriend/StudySessionChat';
import io from 'socket.io-client';
import './StudySession.css';

const StudySession = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const messageInputRef = useRef(null);
  const [studySession, setStudySession] = useState(null);
  const [course, setCourse] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [socket, setSocket] = useState(null);
  const [activeSection, setActiveSection] = useState(0);
  const [activeResource, setActiveResource] = useState(null);
  const [showWelcomeToast, setShowWelcomeToast] = useState(false);
  const [partnerName, setPartnerName] = useState('');

  // Initialize socket connection
  useEffect(() => {
    const newSocket = io(API_BASE_URL);
    setSocket(newSocket);

    // Clean up on unmount
    return () => {
      newSocket.disconnect();
    };
  }, []);

  // Join the study session room when socket and sessionId are available
  useEffect(() => {
    if (socket && sessionId) {
      socket.emit('join-study-session', sessionId);
    }
  }, [socket, sessionId]);

  // Check if we should focus on the chat
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const focusChat = searchParams.get('focus') === 'chat';

    if (focusChat) {
      setShowWelcomeToast(true);
      // We'll focus on the chat input after the component is fully loaded
    }
  }, [location.search]);

  // Fetch study session data
  useEffect(() => {
    const fetchStudySession = async () => {
      try {
        setIsLoading(true);
        const token = localStorage.getItem('token');

        if (!token) {
          setError('Vous devez être connecté pour accéder à cette session');
          setIsLoading(false);
          return;
        }

        // Get current user info
        const userResponse = await axios.get(`${API_BASE_URL}/api/users/dashboard`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (userResponse.data.success && userResponse.data.data && userResponse.data.data.user) {
          setCurrentUser(userResponse.data.data.user);
        } else {
          console.warn('User data not available or in unexpected format');
        }

        // Get study session data
        const sessionResponse = await axios.get(`${API_BASE_URL}/api/study-sessions/${sessionId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (sessionResponse.data.success && sessionResponse.data.data) {
          const session = sessionResponse.data.data;

          // Ensure all required data is present
          if (!session.host || (!session.course && !session.content)) {
            throw new Error('Study session data is incomplete');
          }

          setStudySession(session);

          // Use the content field which contains either course or formation data
          if (session.content) {
            setCourse(session.content);
          } else if (session.course) {
            setCourse(session.course);
          } else if (session.formation) {
            setCourse(session.formation);
          } else {
            throw new Error('No content available for this study session');
          }

          // Determine partner name for welcome message - with null checks
          const currentUserId = userResponse.data?.data?.user?._id;
          const isUserHost = currentUserId && session.host && session.host._id === currentUserId;

          // Make sure both host and guest exist
          if (isUserHost && session.guest) {
            setPartnerName(session.guest.fullName || 'Invité');
          } else if (session.host) {
            setPartnerName(session.host.fullName || 'Hôte');
          } else {
            setPartnerName('Partenaire')
          }

          // Set first section as active by default
          const contentObj = session.content || session.course || session.formation;

          if (contentObj && contentObj.sections && contentObj.sections.length > 0) {
            setActiveSection(0);

            // Set first video resource as active by default
            const firstSection = contentObj.sections[0];
            if (firstSection.resources && firstSection.resources.length > 0) {
              const videoResource = firstSection.resources.find(r => r.type === 'video');
              if (videoResource) {
                setActiveResource(videoResource);
              }
            }
          }
        } else {
          setError('Erreur lors du chargement de la session d\'étude');
        }
      } catch (err) {
        console.error('Error fetching study session:', err);
        setError('Erreur lors du chargement de la session d\'étude');
      } finally {
        setIsLoading(false);
      }
    };

    fetchStudySession();
  }, [sessionId]);

  // Focus on the message input when the component is fully loaded
  useEffect(() => {
    if (!isLoading && showWelcomeToast) {
      // Use a timeout to ensure the DOM is fully rendered
      setTimeout(() => {
        const messageInput = document.getElementById('message-input');
        if (messageInput) {
          messageInput.focus();
        }
      }, 1000);
    }
  }, [isLoading, showWelcomeToast]);

  const handleBackClick = () => {
    navigate('/dashboard-student');
  };

  const handleSectionClick = (index) => {
    setActiveSection(index);

    // Set first video resource as active by default for the selected section
    if (course && course.sections && course.sections[index]) {
      const section = course.sections[index];
      if (section.resources && section.resources.length > 0) {
        const videoResource = section.resources.find(r => r.type === 'video');
        if (videoResource) {
          setActiveResource(videoResource);
        } else {
          setActiveResource(section.resources[0]);
        }
      } else {
        setActiveResource(null);
      }
    }
  };

  const handleResourceClick = (resource) => {
    setActiveResource(resource);
  };

  // Format date for scheduled sessions
  const formatScheduledTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  if (isLoading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Chargement...</span>
        </Spinner>
        <p className="mt-3">Chargement de la session d'étude...</p>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="py-5">
        <Alert variant="danger">{error}</Alert>
        <Button variant="primary" onClick={handleBackClick}>
          <ArrowLeft size={16} className="me-2" />
          Retour au tableau de bord
        </Button>
      </Container>
    );
  }

  if (!studySession || !course) {
    return (
      <Container className="py-5">
        <Alert variant="warning">Session d'étude non trouvée</Alert>
        <Button variant="primary" onClick={handleBackClick}>
          <ArrowLeft size={16} className="me-2" />
          Retour au tableau de bord
        </Button>
      </Container>
    );
  }

  // Safely determine if the current user is the host with proper null checks
  const isHost = currentUser && studySession?.host?._id && currentUser._id === studySession.host._id;

  // Safely determine the partner with proper null checks
  let partner = { fullName: 'Partenaire', email: '' };
  if (isHost && studySession?.guest) {
    partner = studySession.guest;
  } else if (studySession?.host) {
    partner = studySession.host;
  }

  return (
    <Container fluid className="py-4 study-session-container">
      <ToastContainer position="top-end" className="p-3" style={{ zIndex: 1060 }}>
        <Toast
          show={showWelcomeToast}
          onClose={() => setShowWelcomeToast(false)}
          delay={5000}
          autohide
          bg="success"
        >
          <Toast.Header closeButton={true}>
            <strong className="me-auto">Session d'étude démarrée</strong>
          </Toast.Header>
          <Toast.Body className="text-white">
            <p className="mb-1">Vous êtes maintenant en session d'étude avec {partnerName}.</p>
            <p className="mb-0">Envoyez un message pour commencer à discuter!</p>
          </Toast.Body>
        </Toast>
      </ToastContainer>

      <Row className="mb-4">
        <Col>
          <Button variant="outline-primary" onClick={handleBackClick}>
            <ArrowLeft size={16} className="me-2" />
            Retour au tableau de bord
          </Button>
        </Col>
      </Row>

      <Row className="session-header mb-4">
        <Col>
          <div className="d-flex justify-content-between align-items-start">
            <div>
              <h2>{course.title}</h2>
              <div className="d-flex align-items-center mb-3 flex-wrap">
                <Badge bg="primary" className="me-2 mb-2">Session d'étude</Badge>
                {studySession.contentType === 'formation' ? (
                  <Badge bg="info" className="me-2 mb-2">
                    <BookCopy size={14} className="me-1" />
                    Formation
                  </Badge>
                ) : (
                  <Badge bg="primary" className="me-2 mb-2">
                    <BookOpen size={14} className="me-1" />
                    Cours
                  </Badge>
                )}
                <Badge bg="info" className="me-2 mb-2">
                  <Users size={14} className="me-1" />
                  {isHost ? 'Vous êtes l\'hôte' : 'Vous êtes invité'}
                </Badge>
                {studySession.scheduledTime && (
                  <Badge bg="secondary" className="me-2 mb-2">
                    <Calendar size={14} className="me-1" />
                    {formatScheduledTime(studySession.scheduledTime)}
                  </Badge>
                )}
              </div>
              <p className="mb-1">
                <strong>Étudier avec:</strong> {partner.fullName} ({partner.email})
              </p>
              <p className="text-muted">
                <Clock size={14} className="me-1" />
                Session créée le {new Date(studySession.createdAt).toLocaleDateString()}
              </p>
            </div>
            <div className="d-none d-md-block">
              <Button
                variant="success"
                size="lg"
                onClick={() => document.getElementById('message-input').focus()}
              >
                <MessageSquare size={18} className="me-2" />
                Envoyer un message
              </Button>
            </div>
          </div>
        </Col>
      </Row>

      <Row>
        <Col lg={8}>
          {/* Course Content Tabs */}
          <Card className="mb-4 course-content-card">
            <Card.Header>
              <h5 className="mb-0">
                {studySession.contentType === 'formation' ? (
                  <>
                    <BookCopy size={16} className="me-2 text-info" />
                    Contenu de la formation
                  </>
                ) : (
                  <>
                    <BookOpen size={16} className="me-2 text-primary" />
                    Contenu du cours
                  </>
                )}
              </h5>
            </Card.Header>
            <Card.Body>
              <div className="course-sections">
                {course.sections.map((section, index) => (
                  <div key={index} className="course-section mb-3">
                    <div
                      className={`section-header ${activeSection === index ? 'active' : ''}`}
                      onClick={() => handleSectionClick(index)}
                    >
                      <h6 className="mb-0">{section.title}</h6>
                    </div>

                    {activeSection === index && (
                      <div className="section-content mt-2">
                        <p>{section.description}</p>

                        {section.resources && section.resources.length > 0 ? (
                          <div className="resources-list">
                            <h6 className="mb-2">Ressources:</h6>
                            <div className="list-group">
                              {section.resources.map((resource, resIndex) => (
                                <button
                                  key={resIndex}
                                  className={`list-group-item list-group-item-action d-flex justify-content-between align-items-center ${
                                    activeResource && activeResource.file === resource.file ? 'active' : ''
                                  }`}
                                  onClick={() => handleResourceClick(resource)}
                                >
                                  <span>{resource.name}</span>
                                  <Badge bg={resource.type === 'video' ? 'danger' : 'info'}>
                                    {resource.type}
                                  </Badge>
                                </button>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <p className="text-muted">Aucune ressource disponible pour cette section</p>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </Card.Body>
          </Card>

          {/* Resource Viewer */}
          {activeResource && activeResource.type === 'video' ? (
            <SynchronizedVideoPlayer
              resource={activeResource}
              socket={socket}
              sessionId={sessionId}
              isHost={isHost}
            />
          ) : (
            <Card className="mb-4">
              <Card.Header>
                <h5 className="mb-0">
                  {activeResource ? `Ressource: ${activeResource.name}` : 'Aucune ressource sélectionnée'}
                </h5>
              </Card.Header>
              <Card.Body className="text-center py-5">
                {activeResource ? (
                  <>
                    <p className="mb-3">
                      Vous avez sélectionné une ressource de type {activeResource.type}.
                    </p>
                    <Button
                      variant="primary"
                      size="lg"
                      onClick={() => {
                        // Create an anchor element
                        const a = document.createElement('a');

                        // Extract the filename from the path
                        const filename = activeResource.file.split('/').pop();

                        // Construct the correct URL
                        const resourceUrl = `${API_BASE_URL}/uploads/courses/resources/${filename}`;

                        console.log("Downloading resource from:", resourceUrl);

                        a.href = resourceUrl;
                        a.download = activeResource.name || filename;
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                      }}
                    >
                      <Download size={16} className="me-2" />
                      Télécharger la ressource
                    </Button>
                  </>
                ) : (
                  <p className="mb-3">Sélectionnez une ressource dans le contenu du cours pour commencer à étudier ensemble.</p>
                )}
              </Card.Body>
            </Card>
          )}
        </Col>

        <Col lg={4}>
          <div className="sticky-top" style={{ top: '20px' }}>
            <Card className="chat-card">
              <Card.Header className="bg-primary text-white">
                <h5 className="mb-0 d-flex align-items-center">
                  <MessageSquare size={18} className="me-2" />
                  Discussion avec {partner.fullName}
                </h5>
              </Card.Header>
              <Card.Body className="p-0">
                <StudySessionChat
                  sessionId={sessionId}
                  socket={socket}
                  currentUser={currentUser}
                />
              </Card.Body>
            </Card>
          </div>
        </Col>
      </Row>
    </Container>
  );
};

export default StudySession;
