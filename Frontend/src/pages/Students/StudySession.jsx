import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Alert, Spinner, Badge } from 'react-bootstrap';
import { ArrowLeft, Users, Clock, Calendar } from 'lucide-react';
import axios from 'axios';
import { API_BASE_URL } from '../../config/api';
import SynchronizedVideoPlayer from '../../components/StudyWithFriend/SynchronizedVideoPlayer';
import StudySessionChat from '../../components/StudyWithFriend/StudySessionChat';
import io from 'socket.io-client';
import './StudySession.css';

const StudySession = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [studySession, setStudySession] = useState(null);
  const [course, setCourse] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [socket, setSocket] = useState(null);
  const [activeSection, setActiveSection] = useState(0);
  const [activeResource, setActiveResource] = useState(null);

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

        if (userResponse.data.success) {
          setCurrentUser(userResponse.data.data.user);
        }

        // Get study session data
        const sessionResponse = await axios.get(`${API_BASE_URL}/api/study-sessions/${sessionId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (sessionResponse.data.success) {
          const session = sessionResponse.data.data;
          setStudySession(session);
          setCourse(session.course);
          
          // Set first section as active by default
          if (session.course && session.course.sections && session.course.sections.length > 0) {
            setActiveSection(0);
            
            // Set first video resource as active by default
            const firstSection = session.course.sections[0];
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

  const isHost = currentUser && studySession.host._id === currentUser._id;
  const partner = isHost ? studySession.guest : studySession.host;

  return (
    <Container className="py-4 study-session-container">
      <Button variant="outline-primary" className="mb-4" onClick={handleBackClick}>
        <ArrowLeft size={16} className="me-2" />
        Retour au tableau de bord
      </Button>

      <div className="session-header mb-4">
        <div>
          <h2>{course.title}</h2>
          <div className="d-flex align-items-center mb-3">
            <Badge bg="primary" className="me-2">Session d'étude</Badge>
            <Badge bg="info" className="me-2">
              <Users size={14} className="me-1" />
              {isHost ? 'Vous êtes l\'hôte' : 'Vous êtes invité'}
            </Badge>
            {studySession.scheduledTime && (
              <Badge bg="secondary">
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
      </div>

      <Row>
        <Col lg={8}>
          {activeResource && activeResource.type === 'video' ? (
            <SynchronizedVideoPlayer
              resource={activeResource}
              socket={socket}
              sessionId={sessionId}
              isHost={isHost}
            />
          ) : (
            <Card className="mb-4">
              <Card.Body className="text-center py-5">
                <p className="mb-3">Sélectionnez une ressource vidéo pour commencer à étudier ensemble.</p>
                {activeResource && (
                  <Button
                    variant="outline-primary"
                    onClick={() => window.open(`${API_BASE_URL}/${activeResource.file}`, '_blank')}
                  >
                    Ouvrir la ressource sélectionnée
                  </Button>
                )}
              </Card.Body>
            </Card>
          )}

          <Card className="mb-4">
            <Card.Header>
              <h5 className="mb-0">Contenu du cours</h5>
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
                                    activeResource && activeResource._id === resource._id ? 'active' : ''
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
        </Col>
        
        <Col lg={4}>
          <StudySessionChat
            sessionId={sessionId}
            socket={socket}
            currentUser={currentUser}
          />
        </Col>
      </Row>
    </Container>
  );
};

export default StudySession;
