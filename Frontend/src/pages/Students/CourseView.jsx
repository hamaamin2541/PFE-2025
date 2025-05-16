import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Spinner, Alert, ProgressBar, Badge, Accordion, Toast, ToastContainer } from 'react-bootstrap';
import { ArrowLeft, BookOpen, Play, Download, Award, CheckCircle, FileText } from 'lucide-react';
import axios from 'axios';
import { API_BASE_URL } from '../../config/api';

const CourseView = () => {
  const { enrollmentId } = useParams();
  const navigate = useNavigate();
  const [enrollment, setEnrollment] = useState(null);
  const [course, setCourse] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeSection, setActiveSection] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);
  const [exportError, setExportError] = useState(null);
  const [exportResponse, setExportResponse] = useState(null);

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

  const updateProgress = async (newProgress) => {
    try {
      const token = localStorage.getItem('token');

      await axios.put(`${API_BASE_URL}/api/enrollments/${enrollmentId}`, {
        progress: newProgress,
        status: newProgress === 100 ? 'completed' : 'active'
      }, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      setProgress(newProgress);
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

  const handleSectionComplete = (sectionIndex) => {
    // Calculate new progress based on completed section
    const totalSections = course.sections.length;
    const newProgress = Math.min(Math.round(((sectionIndex + 1) / totalSections) * 100), 100);
    updateProgress(newProgress);
  };

  const handleBackClick = () => {
    navigate('/dashboard-student');
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
      </ToastContainer>

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
            {course.sections && course.sections.map((section, index) => (
              <Accordion.Item key={index} eventKey={index.toString()}>
                <Accordion.Header>
                  <div className="d-flex justify-content-between align-items-center w-100 pe-3">
                    <span>{section.title}</span>
                    {index < (progress / (100 / course.sections.length)) && (
                      <Badge bg="success" pill>Terminé</Badge>
                    )}
                  </div>
                </Accordion.Header>
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
                <Button variant="success" className="w-100 mt-3">
                  <Award size={16} className="me-2" />
                  Voir le certificat
                </Button>
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
