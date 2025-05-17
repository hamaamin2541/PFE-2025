import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Spinner, Alert, ProgressBar, Badge, Accordion, Toast, ToastContainer } from 'react-bootstrap';
import { ArrowLeft, BookOpen, Play, Download, Award, CheckCircle, Clock } from 'lucide-react';
import axios from 'axios';
import { API_BASE_URL, api } from '../../config/api';
import { useGamification } from '../../context/GamificationContext';
import { useStudyTime } from '../../context/StudyTimeContext';
import { useStudyTimeTracking } from '../../services/studyTimeService';

const FormationView = () => {
  const { enrollmentId } = useParams();
  const navigate = useNavigate();
  const { refreshGamificationData } = useGamification();
  const { refreshWeeklyStats } = useStudyTime();
  const [enrollment, setEnrollment] = useState(null);
  const [formation, setFormation] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeModule, setActiveModule] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isGeneratingCertificate, setIsGeneratingCertificate] = useState(false);
  const [certificateSuccess, setCertificateSuccess] = useState(false);
  const [certificateError, setCertificateError] = useState(null);
  const [certificateData, setCertificateData] = useState(null);
  const [activeStudyTime, setActiveStudyTime] = useState(null);
  const studyTimeTrackingRef = useRef(null);

  // Initialize study time tracking
  useEffect(() => {
    if (formation && formation._id) {
      // Create a tracking object
      studyTimeTrackingRef.current = useStudyTimeTracking('formation', formation._id);

      // Start tracking when component mounts
      const startTracking = async () => {
        const session = await studyTimeTrackingRef.current.startTracking();
        setActiveStudyTime(session);
      };

      startTracking();

      // End tracking when component unmounts
      return () => {
        if (studyTimeTrackingRef.current) {
          studyTimeTrackingRef.current.endTracking(progress === 100);
        }
      };
    }
  }, [formation, progress]);

  useEffect(() => {
    const fetchEnrollment = async () => {
      try {
        setIsLoading(true);
        const token = localStorage.getItem('token');

        if (!token) {
          setError('Vous devez être connecté pour accéder à cette formation');
          setIsLoading(false);
          return;
        }

        const response = await axios.get(`${API_BASE_URL}/api/enrollments/${enrollmentId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.data.success) {
          setEnrollment(response.data.data);
          if (response.data.data.itemType === 'formation' && response.data.data.formation) {
            setFormation(response.data.data.formation);
            setProgress(response.data.data.progress || 0);
          } else {
            setError('Ce n\'est pas une formation valide');
          }
        } else {
          setError('Erreur lors du chargement de la formation');
        }
      } catch (err) {
        console.error('Error fetching formation:', err);
        setError('Erreur lors du chargement de la formation');
      } finally {
        setIsLoading(false);
      }
    };

    fetchEnrollment();
  }, [enrollmentId]);

  const updateProgress = async (newProgress) => {
    try {
      const isCompleting = newProgress === 100;

      await api.put(`/api/enrollments/${enrollmentId}`, {
        progress: newProgress,
        status: isCompleting ? 'completed' : 'active'
      });

      setProgress(newProgress);

      // If the formation is being completed, refresh gamification data to show new points/badges
      if (isCompleting) {
        console.log('Formation completed! Refreshing gamification data...');

        // End the study time tracking with completion flag
        if (studyTimeTrackingRef.current) {
          await studyTimeTrackingRef.current.endTracking(true);

          // Start a new session for any additional time spent on the page
          const session = await studyTimeTrackingRef.current.startTracking();
          setActiveStudyTime(session);
        }

        // Refresh the weekly study stats
        setTimeout(() => refreshWeeklyStats(), 1500);

        setTimeout(() => refreshGamificationData(), 1000); // Small delay to allow backend to process
      }
    } catch (err) {
      console.error('Error updating progress:', err);
    }
  };

  const handleResourceClick = (resource) => {
    // If the resource has a file path, open it in a new tab
    if (resource.file) {
      window.open(`${API_BASE_URL}/${resource.file}`, '_blank');
    }
  };

  const handleModuleComplete = (moduleIndex) => {
    // Calculate new progress based on completed module
    const totalModules = formation.modules.length;
    const newProgress = Math.min(Math.round(((moduleIndex + 1) / totalModules) * 100), 100);
    updateProgress(newProgress);
  };

  const handleGenerateCertificate = async () => {
    try {
      setIsGeneratingCertificate(true);
      setCertificateError(null);

      const token = localStorage.getItem('token');

      // First check if certificate already exists
      const response = await axios.post(`${API_BASE_URL}/api/certificates/generate/${enrollmentId}`, {}, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.data.success) {
        setCertificateSuccess(true);
        setCertificateData(response.data.data);

        // Download the certificate
        window.open(`${API_BASE_URL}/api/certificates/download/${response.data.data.certificateId}`, '_blank');

        setTimeout(() => setCertificateSuccess(false), 5000);
      } else {
        setCertificateError('Erreur lors de la génération du certificat');
      }
    } catch (err) {
      console.error('Error generating certificate:', err);
      setCertificateError(err.response?.data?.message || 'Erreur lors de la génération du certificat');
    } finally {
      setIsGeneratingCertificate(false);
    }
  };

  const handleBackClick = () => {
    navigate('/dashboard-student');
  };

  if (isLoading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3">Chargement de la formation...</p>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="py-5">
        <Alert variant="danger">{error}</Alert>
        <Button variant="outline-primary" onClick={handleBackClick}>
          <ArrowLeft size={16} className="me-2" />
          Retour aux formations
        </Button>
      </Container>
    );
  }

  if (!formation) {
    return (
      <Container className="py-5">
        <Alert variant="warning">Formation non trouvée</Alert>
        <Button variant="outline-primary" onClick={handleBackClick}>
          <ArrowLeft size={16} className="me-2" />
          Retour aux formations
        </Button>
      </Container>
    );
  }

  return (
    <Container className="py-5">
      <ToastContainer position="top-end" className="p-3" style={{ zIndex: 1 }}>
        {certificateSuccess && (
          <Toast bg="success" onClose={() => {
            setCertificateSuccess(false);
            setTimeout(() => setCertificateData(null), 500);
          }} show={certificateSuccess} delay={5000} autohide>
            <Toast.Header>
              <strong className="me-auto">Certificat généré</strong>
            </Toast.Header>
            <Toast.Body className="text-white">
              Votre certificat a été généré avec succès. Le téléchargement devrait démarrer automatiquement.
              {certificateData && certificateData.certificateId && (
                <div className="mt-2">
                  Si le téléchargement ne démarre pas, <a
                    href={`${API_BASE_URL}/api/certificates/download/${certificateData.certificateId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-white font-weight-bold"
                    style={{ textDecoration: 'underline' }}
                  >
                    cliquez ici
                  </a>.
                </div>
              )}
            </Toast.Body>
          </Toast>
        )}
        {certificateError && (
          <Toast bg="danger" onClose={() => setCertificateError(null)} show={!!certificateError} delay={5000} autohide>
            <Toast.Header>
              <strong className="me-auto">Erreur</strong>
            </Toast.Header>
            <Toast.Body className="text-white">
              {certificateError}
            </Toast.Body>
          </Toast>
        )}
      </ToastContainer>

      <Button variant="outline-primary" className="mb-4" onClick={handleBackClick}>
        <ArrowLeft size={16} className="me-2" />
        Retour aux formations
      </Button>

      <Row>
        <Col md={8}>
          <h1 className="mb-3">{formation.title}</h1>
          <div className="d-flex mb-4">
            <Badge bg="warning" className="me-2">Formation</Badge>
            {formation.category && <Badge bg="secondary" className="me-2">{formation.category}</Badge>}
          </div>

          <Card className="mb-4">
            <Card.Body>
              <h5>Description</h5>
              <p>{formation.description}</p>
            </Card.Body>
          </Card>

          <div className="mb-4">
            <h5 className="mb-3">Progression de la formation</h5>
            <ProgressBar
              now={progress}
              variant={progress === 100 ? "success" : "warning"}
              label={`${progress}%`}
              className="mb-2"
              style={{ height: '25px' }}
            />
            {progress === 100 && (
              <div className="text-success d-flex align-items-center mt-2">
                <CheckCircle size={18} className="me-2" />
                <span>Formation terminée ! Félicitations !</span>
              </div>
            )}
          </div>

          <h5 className="mb-3">Modules de la formation</h5>
          <Accordion defaultActiveKey={activeModule.toString()}>
            {formation.modules && formation.modules.map((module, index) => (
              <Accordion.Item key={index} eventKey={index.toString()}>
                <Accordion.Header>
                  <div className="d-flex justify-content-between align-items-center w-100 pe-3">
                    <span>{module.title}</span>
                    {index < (progress / (100 / formation.modules.length)) && (
                      <Badge bg="success" pill>Terminé</Badge>
                    )}
                  </div>
                </Accordion.Header>
                <Accordion.Body>
                  <p>{module.description}</p>

                  {module.resources && module.resources.length > 0 && (
                    <div className="mt-3">
                      <h6>Ressources</h6>
                      <div className="list-group">
                        {module.resources.map((resource, idx) => (
                          <Button
                            key={idx}
                            variant="outline-warning"
                            className="list-group-item list-group-item-action d-flex justify-content-between align-items-center mb-2"
                            onClick={() => handleResourceClick(resource)}
                          >
                            <span>{resource.name}</span>
                            <div>
                              <Badge bg="info" className="me-2">{resource.type}</Badge>
                              <Download size={16} />
                            </div>
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}

                  <Button
                    variant="success"
                    className="mt-3"
                    onClick={() => handleModuleComplete(index)}
                  >
                    <CheckCircle size={16} className="me-2" />
                    Marquer comme terminé
                  </Button>
                </Accordion.Body>
              </Accordion.Item>
            ))}
          </Accordion>
        </Col>

        <Col md={4}>
          <Card className="sticky-top" style={{ top: '20px' }}>
            {formation.coverImage ? (
              <Card.Img
                variant="top"
                src={`${API_BASE_URL}/${formation.coverImage}`}
                style={{ height: '200px', objectFit: 'cover' }}
                onError={(e) => {
                  e.target.src = "https://placehold.co/600x400?text=Formation+Image";
                }}
              />
            ) : (
              <div
                className="bg-light d-flex align-items-center justify-content-center"
                style={{ height: '200px' }}
              >
                <BookOpen size={48} className="text-muted" />
              </div>
            )}
            <Card.Body>
              <h5>Informations</h5>
              <div className="mb-2">
                <strong>Formateur:</strong> {formation.teacher?.fullName || "Non spécifié"}
              </div>
              <div className="mb-2">
                <strong>Catégorie:</strong> {formation.category || "Non spécifié"}
              </div>
              <div className="mb-2">
                <strong>Durée estimée:</strong> {formation.duration || "Non spécifié"}
              </div>

              {progress === 100 ? (
                <Button
                  variant="success"
                  className="w-100 mt-3"
                  onClick={() => handleGenerateCertificate()}
                  disabled={isGeneratingCertificate}
                >
                  <Award size={16} className="me-2" />
                  {isGeneratingCertificate ? 'Génération...' : 'Voir le certificat'}
                </Button>
              ) : (
                <Button
                  variant="warning"
                  className="w-100 mt-3"
                  onClick={() => updateProgress(100)}
                >
                  <CheckCircle size={16} className="me-2" />
                  Marquer tout comme terminé
                </Button>
              )}

              {/* Study Time Indicator */}
              <div className="mt-3 p-2 border rounded bg-light">
                <div className="d-flex align-items-center mb-2">
                  <Clock size={16} className="me-2 text-primary" />
                  <small className="text-muted">Session d'étude en cours</small>
                </div>
                <div className="d-flex justify-content-center">
                  <Badge bg="primary" className="px-3 py-2">
                    Session active
                  </Badge>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default FormationView;
