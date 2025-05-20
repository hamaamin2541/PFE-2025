import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Spinner, Alert, ProgressBar, Badge, Accordion, Toast, ToastContainer } from 'react-bootstrap';
import { ArrowLeft, BookOpen, Play, Download, Award, CheckCircle, FileText, Users, Clock, HelpCircle } from 'lucide-react';
import RequestAssistantHelp from '../../components/Assistant/RequestAssistantHelp';
import axios from 'axios';
import { API_BASE_URL, api } from '../../config/api';
import StudySessionInvite from '../../components/StudyWithFriend/StudySessionInvite';
import CourseQuestionList from '../../components/CourseQA/CourseQuestionList';
import { useGamification } from '../../context/GamificationContext';
import { useStudyTime } from '../../context/StudyTimeContext';
import { useStudyTimeTracking } from '../../services/studyTimeService';
import '../../styles/CertificateVerification.css';

const CourseView = () => {
  const { enrollmentId } = useParams();
  const navigate = useNavigate();
  const { refreshGamificationData } = useGamification();
  const { refreshWeeklyStats } = useStudyTime();
  const [enrollment, setEnrollment] = useState(null);
  const [course, setCourse] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeSection, setActiveSection] = useState(0);
  const [progress, setProgress] = useState(0);
  const [completedSections, setCompletedSections] = useState([]);
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);
  const [exportError, setExportError] = useState(null);
  const [exportResponse, setExportResponse] = useState(null);
  const [isGeneratingCertificate, setIsGeneratingCertificate] = useState(false);
  const [certificateSuccess, setCertificateSuccess] = useState(false);
  const [showStudyInviteModal, setShowStudyInviteModal] = useState(false);
  const [studySessionCreated, setStudySessionCreated] = useState(null);
  const [showAssistantHelpModal, setShowAssistantHelpModal] = useState(false);
  const [certificateError, setCertificateError] = useState(null);
  const [certificateData, setCertificateData] = useState(null);
  const [activeStudyTime, setActiveStudyTime] = useState(null);
  const studyTimeTrackingRef = useRef(null);

  // Initialize study time tracking
  useEffect(() => {
    if (course && course._id) {
      // Create a tracking object
      studyTimeTrackingRef.current = useStudyTimeTracking('course', course._id);

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
  }, [course, progress]);

  useEffect(() => {
    const fetchEnrollment = async () => {
      try {
        setIsLoading(true);
        const token = localStorage.getItem('token');

        if (!token) {
          setError('Vous devez être connecté pour accéder à ce cours');
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
          if (response.data.data.itemType === 'course' && response.data.data.course) {
            setCourse(response.data.data.course);
            setProgress(response.data.data.progress || 0);
            // Set completed sections from enrollment data
            setCompletedSections(response.data.data.completedSections || []);
          } else {
            setError('Ce n\'est pas un cours valide');
          }
        } else {
          setError('Erreur lors du chargement du cours');
        }
      } catch (err) {
        console.error('Error fetching course:', err);
        setError('Erreur lors du chargement du cours');
      } finally {
        setIsLoading(false);
      }
    };

    fetchEnrollment();
  }, [enrollmentId]);

  // This function is used for marking the entire course as complete
  const updateProgress = async (newProgress) => {
    try {
      const isCompleting = newProgress === 100;

      // If completing the entire course, mark all sections as completed
      if (isCompleting && course && course.sections) {
        const allSectionIndices = course.sections.map((_, index) => index);

        await api.put(`/api/enrollments/${enrollmentId}`, {
          progress: newProgress,
          status: 'completed',
          completedSectionIndex: allSectionIndices[allSectionIndices.length - 1] // Mark the last section as completed
        });
      } else {
        await api.put(`/api/enrollments/${enrollmentId}`, {
          progress: newProgress,
          status: isCompleting ? 'completed' : 'active'
        });
      }

      setProgress(newProgress);

      // If the course is being completed, refresh gamification data to show new points/badges
      if (isCompleting) {
        console.log('Course completed! Refreshing gamification data...');

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
    // If the resource has a file path, download it
    if (resource.file) {
      // Create an anchor element for downloading
      const a = document.createElement('a');

      // Extract the filename from the path
      const filename = resource.file.split('/').pop();

      // Construct the correct URL
      const resourceUrl = `${API_BASE_URL}/uploads/courses/resources/${filename}`;

      console.log("Downloading resource from:", resourceUrl);

      a.href = resourceUrl;
      a.download = resource.name || filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  const handleSectionComplete = async (sectionIndex) => {
    try {
      // Calculate new progress based on completed section
      const totalSections = course.sections.length;
      const newProgress = Math.min(Math.round(((sectionIndex + 1) / totalSections) * 100), 100);

      // Send the completed section index to the backend
      await api.put(`/api/enrollments/${enrollmentId}`, {
        progress: newProgress,
        status: newProgress === 100 ? 'completed' : 'active',
        completedSectionIndex: sectionIndex
      });

      // Update local state
      setProgress(newProgress);

      // Update completed sections
      if (!completedSections.includes(sectionIndex)) {
        setCompletedSections([...completedSections, sectionIndex]);
      }

      // If the course is being completed, refresh gamification data
      if (newProgress === 100) {
        console.log('Course completed! Refreshing gamification data...');

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
      console.error('Error updating section completion:', err);
    }
  };

  const handleBackClick = () => {
    navigate('/dashboard-student');
  };

  const handleStudyInviteSuccess = (sessionData) => {
    setStudySessionCreated(sessionData);
    // Optionally navigate to the study session page
    // navigate(`/study-session/${sessionData._id}`);
  };

  const handleGenerateCertificate = async () => {
    try {
      setIsGeneratingCertificate(true);
      setCertificateError(null);

      const token = localStorage.getItem('token');

      if (!token) {
        setCertificateError('Vous devez être connecté pour générer un certificat. Veuillez vous reconnecter.');
        return;
      }

      // Make sure the enrollment ID is valid
      if (!enrollmentId) {
        setCertificateError('ID d\'inscription invalide. Veuillez rafraîchir la page et réessayer.');
        return;
      }

      console.log('Generating certificate for enrollment:', enrollmentId);

      // First check if certificate already exists
      const response = await axios.post(`${API_BASE_URL}/api/certificates/generate/${enrollmentId}`, {}, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.data.success) {
        setCertificateSuccess(true);
        setCertificateData(response.data.data);

        if (response.data.data && response.data.data.certificateId) {
          // Download the certificate
          const downloadUrl = `${API_BASE_URL}/api/certificates/download/${response.data.data.certificateId}`;
          console.log('Opening certificate download URL:', downloadUrl);
          window.open(downloadUrl, '_blank');
        } else {
          console.error('Certificate ID missing in response:', response.data);
          setCertificateError('Le certificat a été généré mais l\'ID est manquant. Veuillez réessayer.');
        }

        setTimeout(() => setCertificateSuccess(false), 5000);
      } else {
        setCertificateError(response.data.message || 'Erreur lors de la génération du certificat');
      }
    } catch (err) {
      console.error('Error generating certificate:', err);
      const errorMessage = err.response?.data?.message || 'Erreur lors de la génération du certificat. Veuillez réessayer.';
      setCertificateError(errorMessage);

      // If there's a network error, provide more specific guidance
      if (!err.response) {
        setCertificateError('Erreur de connexion au serveur. Veuillez vérifier votre connexion internet et réessayer.');
      }
    } finally {
      setIsGeneratingCertificate(false);
    }
  };

  const handleExportCourse = async (format = 'pdf') => {
    try {
      setIsExporting(true);
      setExportError(null);

      const token = localStorage.getItem('token');

      const response = await axios.post(`${API_BASE_URL}/api/exports`, {
        contentType: 'course',
        contentId: course._id,
        format: format
      }, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.data.success) {
        setExportSuccess(true);
        setExportResponse(response);

        // Wait a moment for the server to generate the file
        setTimeout(() => {
          // Try to download the file automatically
          if (response.data.data && response.data.data._id) {
            const exportId = response.data.data._id;
            const downloadUrl = `${API_BASE_URL}/api/exports/download/${exportId}?token=${token}`;

            // Method 1: Form submission approach
            try {
              // Create a hidden form for download request
              const form = document.createElement('form');
              form.method = 'GET';
              form.action = `${API_BASE_URL}/api/exports/download/${exportId}`;
              form.target = '_blank';

              // Add token as hidden field
              const tokenField = document.createElement('input');
              tokenField.type = 'hidden';
              tokenField.name = 'token';
              tokenField.value = token;
              form.appendChild(tokenField);

              // Submit the form
              document.body.appendChild(form);
              form.submit();

              // Clean up
              setTimeout(() => {
                document.body.removeChild(form);
              }, 100);
            } catch (formError) {
              console.error('Form submission error:', formError);

              // Method 2: Fetch API approach
              fetch(downloadUrl, {
                method: 'GET',
                headers: {
                  'Authorization': `Bearer ${token}`
                }
              })
              .then(response => {
                if (!response.ok) throw new Error('Network response was not ok');
                return response.blob();
              })
              .then(blob => {
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.style.display = 'none';
                a.href = url;
                a.download = `course-export-${Date.now()}.${format}`;
                document.body.appendChild(a);
                a.click();

                // Clean up
                setTimeout(() => {
                  window.URL.revokeObjectURL(url);
                  document.body.removeChild(a);
                }, 100);
              })
              .catch(fetchError => {
                console.error('Fetch error:', fetchError);

                // Method 3: iframe approach as fallback
                const iframe = document.createElement('iframe');
                iframe.style.display = 'none';
                document.body.appendChild(iframe);
                iframe.src = downloadUrl;

                // Clean up
                setTimeout(() => {
                  document.body.removeChild(iframe);
                }, 5000);

                // Method 4: Last resort - window.open
                window.open(downloadUrl, '_blank');
              });
            }
          }

          setTimeout(() => setExportSuccess(false), 5000);
        }, 1000); // Wait 1 second for the server to process
      } else {
        setExportError('Erreur lors de l\'exportation du cours');
      }
    } catch (err) {
      console.error('Error exporting course:', err);
      setExportError('Erreur lors de l\'exportation du cours');
    } finally {
      setIsExporting(false);
    }
  };

  if (isLoading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3">Chargement du cours...</p>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="py-5">
        <Alert variant="danger">{error}</Alert>
        <Button variant="outline-primary" onClick={handleBackClick}>
          <ArrowLeft size={16} className="me-2" />
          Retour aux cours
        </Button>
      </Container>
    );
  }

  if (!course) {
    return (
      <Container className="py-5">
        <Alert variant="warning">Cours non trouvé</Alert>
        <Button variant="outline-primary" onClick={handleBackClick}>
          <ArrowLeft size={16} className="me-2" />
          Retour aux cours
        </Button>
      </Container>
    );
  }

  return (
    <Container className="py-5">
      <ToastContainer position="top-end" className="p-3" style={{ zIndex: 1 }}>
        {exportSuccess && (
          <Toast bg="success" onClose={() => {
            setExportSuccess(false);
            setTimeout(() => setExportResponse(null), 500);
          }} show={exportSuccess} delay={5000} autohide>
            <Toast.Header>
              <strong className="me-auto">Exportation réussie</strong>
            </Toast.Header>
            <Toast.Body className="text-white">
              Le cours a été exporté avec succès. Le téléchargement devrait démarrer automatiquement.
              {exportResponse && exportResponse.data && exportResponse.data.data && exportResponse.data.data._id && (
                <div className="mt-2">
                  Si le téléchargement ne démarre pas, <a
                    href={`${API_BASE_URL}/api/exports/download/${exportResponse.data.data._id}?token=${localStorage.getItem('token')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-white font-weight-bold"
                    style={{ textDecoration: 'underline' }}
                  >
                    cliquez ici
                  </a> ou consultez votre tableau de bord.
                </div>
              )}
            </Toast.Body>
          </Toast>
        )}
        {exportError && (
          <Toast bg="danger" onClose={() => setExportError(null)} show={!!exportError} delay={5000} autohide>
            <Toast.Header>
              <strong className="me-auto">Erreur</strong>
            </Toast.Header>
            <Toast.Body className="text-white">
              {exportError}
            </Toast.Body>
          </Toast>
        )}
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

      {/* Study Session Invite Modal */}
      <StudySessionInvite
        show={showStudyInviteModal}
        onHide={() => setShowStudyInviteModal(false)}
        courseId={course?._id}
        onSuccess={handleStudyInviteSuccess}
      />

      {/* Request Assistant Help Modal */}
      <RequestAssistantHelp
        show={showAssistantHelpModal}
        onHide={() => setShowAssistantHelpModal(false)}
        courseId={course?._id}
        courseName={course?.title}
      />

      {studySessionCreated && (
        <Alert variant="success" dismissible onClose={() => setStudySessionCreated(null)}>
          <Alert.Heading>Invitation envoyée !</Alert.Heading>
          <p>
            Votre invitation à étudier ensemble a été envoyée avec succès.
          </p>
          <div className="d-flex justify-content-end">
            <Button
              variant="outline-success"
              onClick={() => navigate(`/study-session/${studySessionCreated._id}`)}
            >
              Accéder à la session
            </Button>
          </div>
        </Alert>
      )}

      <Button variant="outline-primary" className="mb-4" onClick={handleBackClick}>
        <ArrowLeft size={16} className="me-2" />
        Retour aux cours
      </Button>

      <Row>
        <Col md={8}>
          <h1 className="mb-3">{course.title}</h1>
          <div className="d-flex mb-4">
            <Badge bg="primary" className="me-2">Cours</Badge>
            {course.category && <Badge bg="secondary" className="me-2">{course.category}</Badge>}
            {course.level && <Badge bg="info">{course.level}</Badge>}
          </div>

          <Card className="mb-4">
            <Card.Body>
              <h5>Description</h5>
              <p>{course.description}</p>
            </Card.Body>
          </Card>

          <div className="mb-4">
            <h5 className="mb-3">Progression du cours</h5>
            <ProgressBar
              now={progress}
              variant={progress === 100 ? "success" : "primary"}
              label={`${progress}%`}
              className="mb-2"
              style={{ height: '25px' }}
            />
            {progress === 100 && (
              <div className="text-success d-flex align-items-center mt-2">
                <CheckCircle size={18} className="me-2" />
                <span>Cours terminé ! Félicitations !</span>
              </div>
            )}
          </div>

          <h5 className="mb-3">Contenu du cours</h5>
          <Accordion defaultActiveKey={activeSection.toString()}>
            {course.sections && course.sections.map((section, index) => {
              // Determine if this section is accessible
              // Section 0 (first section) is always accessible
              // Other sections are accessible only if the previous section is completed
              const isPreviousSectionCompleted = index === 0 || completedSections.includes(index - 1);
              const isSectionCompleted = completedSections.includes(index);
              const isSectionAccessible = isPreviousSectionCompleted;

              return (
                <Accordion.Item
                  key={index}
                  eventKey={isSectionAccessible ? index.toString() : ''}
                  className={!isSectionAccessible ? 'opacity-75' : ''}
                >
                  <Accordion.Header
                    onClick={(e) => {
                      if (!isSectionAccessible) {
                        e.preventDefault();
                        e.stopPropagation();
                        alert('Vous devez terminer le chapitre précédent avant d\'accéder à celui-ci.');
                      }
                    }}
                  >
                    <div className="d-flex justify-content-between align-items-center w-100 pe-3">
                      <span>
                        {section.title}
                        {!isSectionAccessible && (
                          <span className="ms-2 text-muted">
                            <i className="fas fa-lock"></i> (Verrouillé)
                          </span>
                        )}
                      </span>
                      <div>
                        {isSectionCompleted && (
                          <Badge bg="success" pill>Terminé</Badge>
                        )}
                        {!isSectionAccessible && (
                          <Badge bg="secondary" pill className="ms-2">Verrouillé</Badge>
                        )}
                      </div>
                    </div>
                  </Accordion.Header>
                  {isSectionAccessible && (
                    <Accordion.Body>
                      <p>{section.description}</p>

                      {section.resources && section.resources.length > 0 && (
                        <div className="mt-3">
                          <h6>Ressources</h6>
                          <div className="list-group">
                            {section.resources.map((resource, idx) => (
                              <Button
                                key={idx}
                                variant="outline-primary"
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
                        onClick={() => handleSectionComplete(index)}
                        disabled={isSectionCompleted}
                      >
                        <CheckCircle size={16} className="me-2" />
                        {isSectionCompleted ? 'Déjà terminé' : 'Marquer comme terminé'}
                      </Button>
                    </Accordion.Body>
                  )}
                </Accordion.Item>
              );
            })}
          </Accordion>

          {/* Course Q&A Section */}
          {course._id && <CourseQuestionList courseId={course._id} />}
        </Col>

        <Col md={4}>
          <Card className="sticky-top" style={{ top: '20px' }}>
            {course.coverImage ? (
              <Card.Img
                variant="top"
                src={`${API_BASE_URL}/${course.coverImage}`}
                style={{ height: '200px', objectFit: 'cover' }}
                onError={(e) => {
                  e.target.src = "https://placehold.co/600x400?text=Course+Image";
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
                <strong>Enseignant:</strong> {course.teacher?.fullName || "Non spécifié"}
              </div>
              <div className="mb-2">
                <strong>Langue:</strong> {course.language || "Non spécifié"}
              </div>
              <div className="mb-2">
                <strong>Niveau:</strong> {course.level || "Non spécifié"}
              </div>
              <div className="mb-2">
                <strong>Catégorie:</strong> {course.category || "Non spécifié"}
              </div>

              {progress === 100 ? (
                <div className="certificate-button-container mt-3 mb-2">
                  <div className="certificate-achievement p-2 text-center mb-2 bg-light rounded">
                    <Award size={24} className="text-success mb-1" />
                    <p className="mb-0 small">Félicitations ! Vous avez terminé ce cours.</p>
                  </div>
                  <Button
                    variant="success"
                    size="lg"
                    className="w-100 certificate-button d-flex align-items-center justify-content-center"
                    onClick={() => handleGenerateCertificate()}
                    style={{
                      background: 'linear-gradient(45deg, #28a745, #20c997)',
                      border: 'none',
                      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                      transition: 'all 0.3s ease'
                    }}
                  >
                    <Award size={20} className="me-2" />
                    <span>Télécharger mon certificat</span>
                  </Button>
                </div>
              ) : (
                <Button
                  variant="primary"
                  className="w-100 mt-3"
                  onClick={() => updateProgress(100)}
                >
                  <CheckCircle size={16} className="me-2" />
                  Marquer tout comme terminé
                </Button>
              )}

              <Button
                variant="outline-info"
                className="w-100 mt-2 d-flex align-items-center justify-content-center"
                onClick={() => setShowStudyInviteModal(true)}
              >
                <Users size={16} className="me-2" />
                Étudier avec un ami
              </Button>

              <Button
                variant="outline-secondary"
                className="w-100 mt-2 d-flex align-items-center justify-content-center"
                onClick={() => setShowAssistantHelpModal(true)}
              >
                <HelpCircle size={16} className="me-2" />
                Demander l'aide d'un assistant
              </Button>

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

              <hr className="my-3" />

              <h5>Exporter le cours</h5>
              <div className="d-grid gap-2">
                <Button
                  variant="outline-primary"
                  className="d-flex align-items-center justify-content-center"
                  onClick={() => handleExportCourse('pdf')}
                  disabled={isExporting}
                >
                  <FileText size={16} className="me-2" />
                  {isExporting ? 'Exportation en cours...' : 'Exporter en PDF'}
                </Button>
                <Button
                  variant="outline-secondary"
                  className="d-flex align-items-center justify-content-center"
                  onClick={() => handleExportCourse('zip')}
                  disabled={isExporting}
                >
                  <Download size={16} className="me-2" />
                  {isExporting ? 'Exportation en cours...' : 'Exporter avec ressources (ZIP)'}
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default CourseView;
