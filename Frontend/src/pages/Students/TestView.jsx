import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Spinner, Alert, ProgressBar, Badge, Form, Toast, ToastContainer } from 'react-bootstrap';
import { ArrowLeft, Clock, Award, CheckCircle, AlertCircle, ChevronLeft, ChevronRight, Save, Download, FileText } from 'lucide-react';
import axios from 'axios';
import { API_BASE_URL, api } from '../../config/api';
import { useGamification } from '../../context/GamificationContext';
import { useStudyTime } from '../../context/StudyTimeContext';
import { useStudyTimeTracking } from '../../services/studyTimeService';

const TestView = () => {
  const { enrollmentId } = useParams();
  const navigate = useNavigate();
  const { refreshGamificationData } = useGamification();
  const { refreshWeeklyStats } = useStudyTime();
  const [enrollment, setEnrollment] = useState(null);
  const [test, setTest] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(null);
  const [testStarted, setTestStarted] = useState(false);
  const [testCompleted, setTestCompleted] = useState(false);
  const [score, setScore] = useState(null);
  const [progress, setProgress] = useState(0);
  const [isGeneratingCertificate, setIsGeneratingCertificate] = useState(false);
  const [certificateSuccess, setCertificateSuccess] = useState(false);
  const [certificateError, setCertificateError] = useState(null);
  const [certificateData, setCertificateData] = useState(null);
  const [activeStudyTime, setActiveStudyTime] = useState(null);
  const studyTimeTrackingRef = useRef(null);

  // Initialize study time tracking
  useEffect(() => {
    if (test && test._id) {
      // Create a tracking object
      studyTimeTrackingRef.current = useStudyTimeTracking('test', test._id);

      // Start tracking when component mounts
      const startTracking = async () => {
        const session = await studyTimeTrackingRef.current.startTracking();
        setActiveStudyTime(session);
      };

      startTracking();

      // End tracking when component unmounts
      return () => {
        if (studyTimeTrackingRef.current) {
          studyTimeTrackingRef.current.endTracking(testCompleted);
        }
      };
    }
  }, [test, testCompleted]);

  useEffect(() => {
    const fetchEnrollment = async () => {
      try {
        setIsLoading(true);
        const token = localStorage.getItem('token');

        if (!token) {
          setError('Vous devez être connecté pour accéder à ce test');
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
          if (response.data.data.itemType === 'test' && response.data.data.test) {
            setTest(response.data.data.test);
            setProgress(response.data.data.progress || 0);

            // If test is already completed
            if (response.data.data.progress === 100) {
              setTestCompleted(true);
              setScore(response.data.data.score || 0);
            }
          } else {
            setError('Ce n\'est pas un test valide');
          }
        } else {
          setError('Erreur lors du chargement du test');
        }
      } catch (err) {
        console.error('Error fetching test:', err);
        setError('Erreur lors du chargement du test');
      } finally {
        setIsLoading(false);
      }
    };

    fetchEnrollment();
  }, [enrollmentId]);

  // Timer for test
  useEffect(() => {
    let timer;
    if (testStarted && !testCompleted && timeLeft > 0) {
      timer = setTimeout(() => {
        setTimeLeft(timeLeft - 1);
      }, 1000);
    } else if (testStarted && timeLeft === 0 && !testCompleted) {
      // Auto-submit when time is up
      handleSubmitTest();
    }

    return () => clearTimeout(timer);
  }, [testStarted, timeLeft, testCompleted]);

  const startTest = () => {
    setTestStarted(true);
    setTimeLeft(test.duration * 60); // Convert minutes to seconds
  };

  const handleAnswerChange = (questionId, answer) => {
    setAnswers({
      ...answers,
      [questionId]: answer
    });
  };

  const handleNextQuestion = () => {
    if (currentQuestion < test.questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const handlePrevQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const handleSubmitTest = async () => {
    try {
      // Calculate score
      let correctAnswers = 0;
      test.questions.forEach(question => {
        if (answers[question._id] === question.correctAnswer) {
          correctAnswers++;
        }
      });

      const scorePercentage = Math.round((correctAnswers / test.questions.length) * 100);

      // Update enrollment with score and progress
      await api.put(`/api/enrollments/${enrollmentId}`, {
        progress: 100,
        status: 'completed',
        score: scorePercentage
      });

      setTestCompleted(true);
      setScore(scorePercentage);
      setProgress(100);

      // Refresh gamification data after test completion
      console.log('Test completed! Refreshing gamification data...');

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
    } catch (err) {
      console.error('Error submitting test:', err);
    }
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

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  };

  const handleResourceClick = (resource) => {
    // If the resource has a file path, download it
    if (resource.file) {
      // Get the token for authentication
      const token = localStorage.getItem('token');

      // Method 1: Use the new secure document download endpoint
      if (resource._id && test._id) {
        // Construct the secure URL with authentication
        const secureUrl = `${API_BASE_URL}/api/documents/download/test/${test._id}/${resource._id}`;
        console.log("Downloading resource securely from:", secureUrl);

        // Create a form for authenticated download
        const form = document.createElement('form');
        form.method = 'GET';
        form.action = secureUrl;
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
      } else {
        // Fallback to direct file download if IDs are missing
        // Extract the filename from the path
        const filename = resource.file.split('/').pop();

        // Use the simpler filename-based endpoint
        const resourceUrl = `${API_BASE_URL}/api/documents/download-file/${filename}`;
        console.log("Downloading resource from:", resourceUrl);

        // Create a form for authenticated download
        const form = document.createElement('form');
        form.method = 'GET';
        form.action = resourceUrl;
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
      }
    }
  };

  if (isLoading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3">Chargement du test...</p>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="py-5">
        <Alert variant="danger">{error}</Alert>
        <Button variant="outline-primary" onClick={handleBackClick}>
          <ArrowLeft size={16} className="me-2" />
          Retour aux tests
        </Button>
      </Container>
    );
  }

  if (!test) {
    return (
      <Container className="py-5">
        <Alert variant="warning">Test non trouvé</Alert>
        <Button variant="outline-primary" onClick={handleBackClick}>
          <ArrowLeft size={16} className="me-2" />
          Retour aux tests
        </Button>
      </Container>
    );
  }

  // Test completed view
  if (testCompleted) {
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
          Retour aux tests
        </Button>

        <Card className="text-center p-4">
          <div className="mb-4">
            <Award size={64} className={score >= 70 ? "text-success" : "text-warning"} />
          </div>
          <h2 className="mb-3">Test terminé !</h2>
          <h4 className="mb-4">Votre score: <span className={score >= 70 ? "text-success" : "text-warning"}>{score}%</span></h4>

          {score >= 70 ? (
            <>
              <Alert variant="success">
                <CheckCircle size={20} className="me-2" />
                Félicitations ! Vous avez réussi le test.
              </Alert>

              <div className="mt-4 d-flex justify-content-center gap-3">
                <Button
                  variant="success"
                  onClick={handleGenerateCertificate}
                  disabled={isGeneratingCertificate}
                >
                  <Award size={16} className="me-2" />
                  {isGeneratingCertificate ? 'Génération...' : 'Obtenir mon certificat'}
                </Button>

                <Button variant="outline-primary" onClick={handleBackClick}>
                  Retour au tableau de bord
                </Button>
              </div>

              {/* Resources section for completed test */}
              {test.resources && test.resources.length > 0 && (
                <div className="mt-4">
                  <h5>Ressources du test</h5>
                  <p className="text-muted">Vous pouvez télécharger ces ressources pour référence.</p>
                  <div className="list-group">
                    {test.resources.map((resource, idx) => (
                      <Button
                        key={idx}
                        variant="outline-info"
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
            </>
          ) : (
            <>
              <Alert variant="warning">
                <AlertCircle size={20} className="me-2" />
                Vous n'avez pas atteint le score minimum requis. Vous pouvez réessayer plus tard.
              </Alert>

              <Button variant="primary" className="mt-4" onClick={handleBackClick}>
                Retour au tableau de bord
              </Button>

              {/* Resources section for failed test */}
              {test.resources && test.resources.length > 0 && (
                <div className="mt-4">
                  <h5>Ressources du test</h5>
                  <p className="text-muted">Vous pouvez télécharger ces ressources pour vous aider à vous préparer.</p>
                  <div className="list-group">
                    {test.resources.map((resource, idx) => (
                      <Button
                        key={idx}
                        variant="outline-info"
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
            </>
          )}
        </Card>
      </Container>
    );
  }

  // Test not started view
  if (!testStarted) {
    return (
      <Container className="py-5">
        <Button variant="outline-primary" className="mb-4" onClick={handleBackClick}>
          <ArrowLeft size={16} className="me-2" />
          Retour aux tests
        </Button>

        <Row>
          <Col md={8} className="mx-auto">
            <Card>
              <Card.Body className="text-center p-5">
                <h2 className="mb-4">{test.title}</h2>
                <p className="mb-4">{test.description}</p>

                <div className="d-flex justify-content-center mb-4">
                  <Badge bg="info" className="me-2 p-2">
                    <Clock size={16} className="me-1" />
                    Durée: {test.duration} minutes
                  </Badge>
                  <Badge bg="secondary" className="p-2">
                    Questions: {test.questions.length}
                  </Badge>
                </div>

                <Alert variant="warning">
                  <AlertCircle size={20} className="me-2" />
                  Une fois que vous commencez le test, le chronomètre démarre. Vous ne pourrez pas mettre en pause.
                </Alert>

                {/* Resources section */}
                {test.resources && test.resources.length > 0 && (
                  <div className="mt-4">
                    <h5>Ressources du test</h5>
                    <p className="text-muted">Vous pouvez télécharger ces ressources avant de commencer le test.</p>
                    <div className="list-group">
                      {test.resources.map((resource, idx) => (
                        <Button
                          key={idx}
                          variant="outline-info"
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
                  variant="primary"
                  size="lg"
                  className="mt-4"
                  onClick={startTest}
                >
                  Commencer le test
                </Button>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    );
  }

  // Active test view
  const question = test.questions[currentQuestion];

  return (
    <Container className="py-5">
      <Row>
        <Col md={8} className="mx-auto">
          <Card>
            <Card.Header className="d-flex justify-content-between align-items-center">
              <div>
                <h5 className="mb-0">Question {currentQuestion + 1} sur {test.questions.length}</h5>
              </div>
              <div className="d-flex align-items-center">
                <Clock size={16} className="me-1 text-danger" />
                <span className={timeLeft < 60 ? "text-danger fw-bold" : ""}>
                  Temps restant: {formatTime(timeLeft)}
                </span>
                <Badge bg="primary" className="ms-3 px-2">
                  Session d'étude active
                </Badge>
              </div>
            </Card.Header>
            <Card.Body>
              <h4 className="mb-4">{question.text}</h4>

              <Form>
                {question.options.map((option, index) => (
                  <Form.Check
                    key={index}
                    type="radio"
                    id={`option-${index}`}
                    label={option}
                    name={`question-${question._id}`}
                    className="mb-3 p-2 border rounded"
                    checked={answers[question._id] === option}
                    onChange={() => handleAnswerChange(question._id, option)}
                  />
                ))}
              </Form>
            </Card.Body>
            <Card.Footer className="d-flex justify-content-between">
              <Button
                variant="outline-secondary"
                onClick={handlePrevQuestion}
                disabled={currentQuestion === 0}
              >
                <ChevronLeft size={16} className="me-1" />
                Précédent
              </Button>

              {currentQuestion < test.questions.length - 1 ? (
                <Button
                  variant="primary"
                  onClick={handleNextQuestion}
                >
                  Suivant
                  <ChevronRight size={16} className="ms-1" />
                </Button>
              ) : (
                <Button
                  variant="success"
                  onClick={handleSubmitTest}
                >
                  <Save size={16} className="me-1" />
                  Terminer le test
                </Button>
              )}
            </Card.Footer>
          </Card>

          <div className="mt-4">
            <ProgressBar
              now={(currentQuestion + 1) / test.questions.length * 100}
              variant="info"
              className="mb-2"
            />
            <div className="d-flex justify-content-between">
              <small>Question 1</small>
              <small>Question {test.questions.length}</small>
            </div>
          </div>
        </Col>
      </Row>
    </Container>
  );
};

export default TestView;
