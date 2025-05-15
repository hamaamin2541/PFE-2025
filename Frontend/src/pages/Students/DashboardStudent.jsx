// DashboardStudent.jsx
import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Nav, Button, Image, Card, ProgressBar, Badge, Table, Spinner } from 'react-bootstrap';
import { Home, BookOpen, CheckCircle, MessageSquare, Settings, Bell, Play, Award, Download, FileText } from 'lucide-react';
import { useStudent } from '../../context/StudentContext';
import { useFormation } from '../../context/FormationContext';
import { useLocation, useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../../config/api';
import Overview from './Overview';  // Assurez-vous d'avoir ces composants créés
import Courses from './MesCours';
import Tests from './Tests';
import Messages from './Messages';
import SettingsPage from './Parametres';
import './DashboardStudent.css';  // Ajouter votre CSS si nécessaire
import { initializeNewStudent } from '../../services/studentInitializer';
import Parametres from './Parametres';

const DashboardStudent = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(location.state?.activeTab || 'overview');
  const [profileImage, setProfileImage] = useState("https://randomuser.me/api/portraits/men/32.jpg");
  const { studentData, updateStudentData } = useStudent();
  const { formations, updateFormations } = useFormation();
  const [isNewStudent, setIsNewStudent] = useState(true);
  const [courses, setCourses] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [error, setError] = useState(null);
  const [isLoadingEnrollments, setIsLoadingEnrollments] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [personalInfo, setPersonalInfo] = useState({
    fullName: '',
    email: '',
    phone: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [exports, setExports] = useState([]);
  const [isLoadingExports, setIsLoadingExports] = useState(false);

  const getFullImageUrl = (imageUrl) => {
    if (!imageUrl) return "https://randomuser.me/api/portraits/men/32.jpg";
    if (imageUrl.startsWith('http')) return imageUrl;
    // Make sure the path starts with a slash
    const imagePath = imageUrl.startsWith('/') ? imageUrl : `/${imageUrl}`;
    return `${API_BASE_URL}${imagePath}`;
  };

  useEffect(() => {
    const fetchStudentData = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE_URL}/api/users/dashboard`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          credentials: 'include'
        });

        const data = await response.json();

        if (response.ok) {
          // Initialize empty data for new users
          const userData = data.data || initializeNewStudent;
          // Store in localStorage for other components
          localStorage.setItem('studentData', JSON.stringify(userData));
          // Store user role for context providers
          localStorage.setItem('userRole', 'student');
          updateStudentData(userData);
          setIsNewStudent(true);
          // Initialize notifications from userData or empty array
          setNotifications(userData.notifications || []);
        }
      } catch (error) {
        console.error('Error fetching student data:', error);
        // Set default empty data on error
        updateStudentData(initializeNewStudent);
        setNotifications([]);
      }
    };

    fetchStudentData();
  }, []);

  useEffect(() => {
    // Try to get user data from different sources
    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    const studentData = JSON.parse(localStorage.getItem('studentData') || '{}');

    // Use the first available user ID
    const userId = userData?._id || studentData?._id;

    if (userId) {
      console.log('Calling updateFormations with userId:', userId);
      updateFormations(userId);
    } else {
      console.log('No user ID found for fetching formations');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // Fetch enrollments for the logged-in user
    const fetchEnrollments = async () => {
      try {
        setIsLoadingEnrollments(true);
        const token = localStorage.getItem('token');

        if (!token) {
          setError('Vous devez être connecté pour accéder à vos cours');
          setIsLoadingEnrollments(false);
          return;
        }

        const response = await fetch(`${API_BASE_URL}/api/enrollments`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        const data = await response.json();

        if (data.success) {
          setEnrollments(data.data);

          // Extract courses from enrollments
          const coursesFromEnrollments = data.data.filter(
            enrollment => enrollment.itemType === 'course' && enrollment.course
          );
          setCourses(coursesFromEnrollments);
        } else {
          setError('Erreur lors du chargement de vos cours');
        }
      } catch (err) {
        console.error('Error fetching enrollments:', err);
        setError('Erreur lors du chargement de vos cours');
      } finally {
        setIsLoadingEnrollments(false);
      }
    };

    fetchEnrollments();
  }, []);

  useEffect(() => {
    // Fetch exports for the logged-in user
    const fetchExports = async () => {
      try {
        setIsLoadingExports(true);
        const token = localStorage.getItem('token');

        if (!token) {
          setIsLoadingExports(false);
          return;
        }

        const response = await fetch(`${API_BASE_URL}/api/exports/my-exports`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        const data = await response.json();

        if (data.success) {
          setExports(data.data);
        }
      } catch (err) {
        console.error('Error fetching exports:', err);
      } finally {
        setIsLoadingExports(false);
      }
    };

    fetchExports();
  }, []);

  useEffect(() => {
    if (studentData?.profileImage) {
      setProfileImage(getFullImageUrl(studentData.profileImage));
    }
  }, [studentData]);

  const handleProfileImageChange = (newImageUrl) => {
    if (newImageUrl) {
      setProfileImage(newImageUrl);
      // Update in context/state
      updateStudentData(prev => ({
        ...prev,
        profileImage: newImageUrl
      }));
    }
  };

  const handleUpdatePersonalInfo = async (updatedInfo) => {
    try {
      const token = localStorage.getItem('token');

      // Use AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      try {
        const response = await fetch(`${API_BASE_URL}/api/users/update-profile`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(updatedInfo),
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (response.ok) {
          const data = await response.json();
          updateStudentData(data);
          setPersonalInfo(data);
          alert('Informations mises à jour avec succès!');
        } else {
          throw new Error('Failed to update profile');
        }
      } catch (fetchError) {
        clearTimeout(timeoutId);

        if (fetchError.name === 'AbortError') {
          console.warn('Request timed out');
          // Still update the UI optimistically
          const updatedData = { ...studentData, ...updatedInfo };
          updateStudentData(updatedData);
          setPersonalInfo(updatedData);
          alert('Mise à jour enregistrée localement (mode hors ligne)');
        } else {
          throw fetchError;
        }
      }
    } catch (error) {
      console.error('Error updating personal info:', error);
      alert('Erreur lors de la mise à jour des informations');
    }
  };

  const handlePasswordChange = async (passwordData) => {
    try {
      const token = localStorage.getItem('token');

      // Use AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      try {
        const response = await fetch(`${API_BASE_URL}/api/users/change-password`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(passwordData),
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (response.ok) {
          alert('Mot de passe modifié avec succès!');
        } else {
          throw new Error('Failed to change password');
        }
      } catch (fetchError) {
        clearTimeout(timeoutId);

        if (fetchError.name === 'AbortError') {
          console.warn('Request timed out');
          alert('Le serveur ne répond pas. Veuillez réessayer plus tard.');
        } else {
          throw fetchError;
        }
      }
    } catch (error) {
      console.error('Error changing password:', error);
      alert('Erreur lors du changement de mot de passe');
    }
  };

  const handleFormSubmit = async (formData) => {
    try {
      setIsSubmitting(true);
      const token = localStorage.getItem('token');

      // Use AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      try {
        const response = await fetch(`${API_BASE_URL}/api/users/update-profile`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({
            fullName: formData.fullName,
            email: formData.email
          }),
          signal: controller.signal
        });

        clearTimeout(timeoutId);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Failed to update profile');
        }

        if (data.success && data.data) {
          updateStudentData(data.data);
          setPersonalInfo(data.data);
          alert('Profil mis à jour avec succès!');
        } else {
          throw new Error('Invalid response format');
        }
      } catch (fetchError) {
        clearTimeout(timeoutId);

        if (fetchError.name === 'AbortError') {
          console.warn('Request timed out');
          // Update UI optimistically
          const updatedData = {
            ...studentData,
            fullName: formData.fullName,
            email: formData.email
          };
          updateStudentData(updatedData);
          setPersonalInfo(updatedData);
          alert('Profil mis à jour localement (mode hors ligne)');
        } else {
          throw fetchError;
        }
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Erreur lors de la mise à jour: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderNewStudentWelcome = () => {
    if (!isNewStudent) return null;

    return (
      <div className="welcome-message text-center p-5">
        <h2>Bienvenue {studentData?.fullName}!</h2>
        <p>Commencez votre parcours d'apprentissage en suivant ces étapes:</p>
        <div className="getting-started-steps mt-4">
          <div className="step">
            <BookOpen size={24} />
            <h5>Explorez les cours</h5>
            <p>Parcourez notre catalogue de formations</p>
          </div>
          <div className="step">
            <CheckCircle size={24} />
            <h5>Complétez votre profil</h5>
            <p>Ajoutez vos informations et préférences</p>
          </div>
        </div>
      </div>
    );
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return <Overview />;
      case 'courses':
        return <Courses />;
      case 'tests':
        return <Tests />;
      case 'messages':
        return <Messages />;
      case 'parametres':
        return <Parametres
          currentProfileImage={profileImage}
          onProfileImageChange={handleProfileImageChange}
          onSubmit={handleFormSubmit}
          isSubmitting={isSubmitting}
          initialData={studentData}
        />;
      default:
        return null;
    }
  };

  const renderFormations = () => {
    const formationEnrollments = enrollments.filter(enrollment => enrollment.itemType === 'formation' && enrollment.formation);

    return (
      <div className="formations-section mt-4">
        <h3>Mes Formations</h3>
        {isLoadingEnrollments ? (
          <p className="text-center">Chargement de vos formations...</p>
        ) : formationEnrollments.length === 0 ? (
          <p className="text-center">Aucune formation trouvée. Inscrivez-vous à une formation pour commencer !</p>
        ) : (
          <Row>
            {formationEnrollments.slice(0, 3).map((enrollment) => (
              <Col key={enrollment._id} md={4} className="mb-4">
                <Card className="h-100 shadow-sm">
                  {enrollment.formation?.coverImage ? (
                    <Card.Img
                      variant="top"
                      src={`${API_BASE_URL}/${enrollment.formation.coverImage}`}
                      style={{ height: '160px', objectFit: 'cover' }}
                      onError={(e) => {
                        e.target.src = "https://placehold.co/600x400?text=Formation";
                      }}
                    />
                  ) : (
                    <div
                      className="bg-light d-flex align-items-center justify-content-center"
                      style={{ height: '160px' }}
                    >
                      <BookOpen size={48} className="text-muted" />
                    </div>
                  )}
                  <Card.Body className="d-flex flex-column">
                    <div className="d-flex justify-content-between mb-2">
                      <Badge bg="warning">Formation</Badge>
                      <Badge bg={enrollment.status === 'completed' ? 'success' : 'info'}>
                        {enrollment.status === 'completed' ? 'Terminé' : 'En cours'}
                      </Badge>
                    </div>
                    <Card.Title>{enrollment.formation?.title}</Card.Title>
                    <Card.Text className="flex-grow-1 small text-muted">
                      {enrollment.formation?.description && enrollment.formation.description.length > 100
                        ? enrollment.formation.description.substring(0, 100) + '...'
                        : enrollment.formation?.description}
                    </Card.Text>
                    <div className="mb-3">
                      <div className="d-flex justify-content-between align-items-center mb-1">
                        <small>Progression</small>
                        <small>{enrollment.progress}%</small>
                      </div>
                      <ProgressBar
                        now={enrollment.progress}
                        variant={enrollment.progress === 100 ? "success" : "warning"}
                        style={{ height: '8px' }}
                      />
                    </div>
                    <Button
                      variant={enrollment.status === 'completed' ? 'outline-success' : 'warning'}
                      className="mt-auto d-flex align-items-center justify-content-center"
                      onClick={() => navigate(`/formation/${enrollment._id}`)}
                    >
                      {enrollment.status === 'completed' ? (
                        <>
                          <Award size={16} className="me-2" />
                          Voir le certificat
                        </>
                      ) : (
                        <>
                          <Play size={16} className="me-2" />
                          Continuer
                        </>
                      )}
                    </Button>
                  </Card.Body>
                </Card>
              </Col>
            ))}
            {formationEnrollments.length > 3 && (
              <Col xs={12} className="text-center mt-3">
                <Button variant="outline-warning" onClick={() => setActiveTab('formations')}>
                  Voir toutes mes formations ({formationEnrollments.length})
                </Button>
              </Col>
            )}
          </Row>
        )}
      </div>
    );
  };

  const renderCourses = () => {
    const courseEnrollments = enrollments.filter(enrollment => enrollment.itemType === 'course' && enrollment.course);

    return (
      <div className="courses-section mt-4">
        <h3>Mes Cours</h3>
        {isLoadingEnrollments ? (
          <p className="text-center">Chargement de vos cours...</p>
        ) : courseEnrollments.length === 0 ? (
          <p className="text-center">Aucun cours trouvé. Inscrivez-vous à un cours pour commencer !</p>
        ) : (
          <Row>
            {courseEnrollments.slice(0, 3).map((enrollment) => (
              <Col key={enrollment._id} md={4} className="mb-4">
                <Card className="h-100 shadow-sm">
                  {enrollment.course?.coverImage ? (
                    <Card.Img
                      variant="top"
                      src={`${API_BASE_URL}/${enrollment.course.coverImage}`}
                      style={{ height: '160px', objectFit: 'cover' }}
                      onError={(e) => {
                        e.target.src = "https://placehold.co/600x400?text=Course";
                      }}
                    />
                  ) : (
                    <div
                      className="bg-light d-flex align-items-center justify-content-center"
                      style={{ height: '160px' }}
                    >
                      <BookOpen size={48} className="text-muted" />
                    </div>
                  )}
                  <Card.Body className="d-flex flex-column">
                    <div className="d-flex justify-content-between mb-2">
                      <Badge bg="primary">Cours</Badge>
                      <Badge bg={enrollment.status === 'completed' ? 'success' : 'info'}>
                        {enrollment.status === 'completed' ? 'Terminé' : 'En cours'}
                      </Badge>
                    </div>
                    <Card.Title>{enrollment.course?.title}</Card.Title>
                    <Card.Text className="flex-grow-1 small text-muted">
                      {enrollment.course?.description && enrollment.course.description.length > 100
                        ? enrollment.course.description.substring(0, 100) + '...'
                        : enrollment.course?.description}
                    </Card.Text>
                    <div className="mb-3">
                      <div className="d-flex justify-content-between align-items-center mb-1">
                        <small>Progression</small>
                        <small>{enrollment.progress}%</small>
                      </div>
                      <ProgressBar
                        now={enrollment.progress}
                        variant={enrollment.progress === 100 ? "success" : "primary"}
                        style={{ height: '8px' }}
                      />
                    </div>
                    <Button
                      variant={enrollment.status === 'completed' ? 'outline-success' : 'primary'}
                      className="mt-auto d-flex align-items-center justify-content-center"
                      onClick={() => navigate(`/course/${enrollment._id}`)}
                    >
                      {enrollment.status === 'completed' ? (
                        <>
                          <Award size={16} className="me-2" />
                          Voir le certificat
                        </>
                      ) : (
                        <>
                          <Play size={16} className="me-2" />
                          Continuer
                        </>
                      )}
                    </Button>
                  </Card.Body>
                </Card>
              </Col>
            ))}
            {courseEnrollments.length > 3 && (
              <Col xs={12} className="text-center mt-3">
                <Button variant="outline-primary" onClick={() => setActiveTab('courses')}>
                  Voir tous mes cours ({courseEnrollments.length})
                </Button>
              </Col>
            )}
          </Row>
        )}
      </div>
    );
  };

  const handleDownloadExport = async (exportId) => {
    try {
      const token = localStorage.getItem('token');

      if (!token) {
        alert('Vous devez être connecté pour télécharger ce fichier');
        return;
      }

      // Open in a new tab with token in query params
      window.open(`${API_BASE_URL}/api/exports/download/${exportId}?token=${token}`, '_blank');
    } catch (err) {
      console.error('Error downloading export:', err);
      alert('Erreur lors du téléchargement du fichier');
    }
  };

  const renderExports = () => {
    return (
      <div className="exports-section mt-4">
        <h3>Mes Exportations</h3>
        {isLoadingExports ? (
          <div className="text-center">
            <Spinner animation="border" size="sm" className="me-2" />
            <span>Chargement de vos exportations...</span>
          </div>
        ) : exports.length === 0 ? (
          <p className="text-center">Aucune exportation trouvée.</p>
        ) : (
          <div className="table-responsive">
            <Table hover striped>
              <thead>
                <tr>
                  <th>Contenu</th>
                  <th>Type</th>
                  <th>Format</th>
                  <th>Date</th>
                  <th>Statut</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {exports.map((exportItem) => (
                  <tr key={exportItem._id}>
                    <td>
                      {exportItem.content?.title || 'Contenu non disponible'}
                    </td>
                    <td>
                      <Badge bg={
                        exportItem.contentType === 'course' ? 'primary' :
                        exportItem.contentType === 'formation' ? 'warning' : 'info'
                      }>
                        {exportItem.contentType === 'course' ? 'Cours' :
                         exportItem.contentType === 'formation' ? 'Formation' : 'Test'}
                      </Badge>
                    </td>
                    <td>{exportItem.format.toUpperCase()}</td>
                    <td>{new Date(exportItem.exportDate).toLocaleDateString()}</td>
                    <td>
                      <Badge bg={
                        exportItem.status === 'completed' ? 'success' :
                        exportItem.status === 'pending' ? 'warning' : 'danger'
                      }>
                        {exportItem.status === 'completed' ? 'Terminé' :
                         exportItem.status === 'pending' ? 'En cours' : 'Échoué'}
                      </Badge>
                    </td>
                    <td>
                      {exportItem.status === 'completed' ? (
                        <Button
                          variant="outline-primary"
                          size="sm"
                          onClick={() => handleDownloadExport(exportItem._id)}
                        >
                          <Download size={16} />
                        </Button>
                      ) : (
                        <Button variant="outline-secondary" size="sm" disabled>
                          <Download size={16} />
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        )}
      </div>
    );
  };

  const renderTests = () => {
    const testEnrollments = enrollments.filter(enrollment => enrollment.itemType === 'test' && enrollment.test);

    return (
      <div className="tests-section mt-4">
        <h3>Mes Tests</h3>
        {isLoadingEnrollments ? (
          <p className="text-center">Chargement de vos tests...</p>
        ) : testEnrollments.length === 0 ? (
          <p className="text-center">Aucun test trouvé. Inscrivez-vous à un test pour commencer !</p>
        ) : (
          <Row>
            {testEnrollments.slice(0, 3).map((enrollment) => (
              <Col key={enrollment._id} md={4} className="mb-4">
                <Card className="h-100 shadow-sm">
                  {enrollment.test?.coverImage ? (
                    <Card.Img
                      variant="top"
                      src={`${API_BASE_URL}/${enrollment.test.coverImage}`}
                      style={{ height: '160px', objectFit: 'cover' }}
                      onError={(e) => {
                        e.target.src = "https://placehold.co/600x400?text=Test";
                      }}
                    />
                  ) : (
                    <div
                      className="bg-light d-flex align-items-center justify-content-center"
                      style={{ height: '160px' }}
                    >
                      <BookOpen size={48} className="text-muted" />
                    </div>
                  )}
                  <Card.Body className="d-flex flex-column">
                    <div className="d-flex justify-content-between mb-2">
                      <Badge bg="info">Test</Badge>
                      <Badge bg={enrollment.status === 'completed' ? 'success' : 'info'}>
                        {enrollment.status === 'completed' ? 'Terminé' : 'À passer'}
                      </Badge>
                    </div>
                    <Card.Title>{enrollment.test?.title}</Card.Title>
                    <Card.Text className="flex-grow-1 small text-muted">
                      {enrollment.test?.description && enrollment.test.description.length > 100
                        ? enrollment.test.description.substring(0, 100) + '...'
                        : enrollment.test?.description}
                    </Card.Text>
                    <div className="mb-3">
                      <div className="d-flex justify-content-between align-items-center mb-1">
                        <small>Difficulté</small>
                        <small>{enrollment.test?.difficulty || 'Moyenne'}</small>
                      </div>
                      <div className="d-flex justify-content-between align-items-center">
                        <small>Durée</small>
                        <small>{enrollment.test?.duration || '30'} min</small>
                      </div>
                    </div>
                    <Button
                      variant={enrollment.status === 'completed' ? 'outline-success' : 'info'}
                      className="mt-auto d-flex align-items-center justify-content-center"
                      onClick={() => navigate(`/test/${enrollment._id}`)}
                    >
                      {enrollment.status === 'completed' ? (
                        <>
                          <Award size={16} className="me-2" />
                          Voir les résultats
                        </>
                      ) : (
                        <>
                          <Play size={16} className="me-2" />
                          Passer le test
                        </>
                      )}
                    </Button>
                  </Card.Body>
                </Card>
              </Col>
            ))}
            {testEnrollments.length > 3 && (
              <Col xs={12} className="text-center mt-3">
                <Button variant="outline-info" onClick={() => setActiveTab('tests')}>
                  Voir tous mes tests ({testEnrollments.length})
                </Button>
              </Col>
            )}
          </Row>
        )}
      </div>
    );
  };

  const renderNotifications = () => (
    <div className="notification-dropdown" style={{ display: showNotifications ? 'block' : 'none' }}>
      {notifications.length > 0 ? (
        notifications.map((notif, index) => (
          <div key={index} className="notification-item p-2">
            <p className="mb-1">{notif.message}</p>
            <small className="text-muted">{notif.time}</small>
          </div>
        ))
      ) : (
        <p className="text-center p-3">Aucune notification</p>
      )}
    </div>
  );

  return (
    <Container fluid className="teacher-dashboard px-0">
      <Row className="g-0">
        {/* Sidebar */}
        <Col md={3} className="teacher-sidebar">
          <div className="profile-section text-center p-4">
            <div className="avatar mb-3">
              <Image
                src={"https://randomuser.me/api/portraits/men/32.jpg"}
                alt="Profile"
                roundedCircle
                width={120}
                height={120}
              />
            </div>
            <h5>{studentData?.fullName || 'Loading...'}</h5>
            <p className="text-muted">{studentData?.role || 'Étudiant'}</p>
            <div className="rating mb-3">
              <span className="ms-1">{studentData?.rating || '4.7'}</span>
            </div>
          </div>

          {/* Sidebar Navigation */}
          <Nav variant="pills" className="flex-column">
            <Nav.Item>
              <Nav.Link active={activeTab === 'overview'} onClick={() => setActiveTab('overview')}>
                <Home size={18} className="me-2" />
                Vue d'ensemble
              </Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link active={activeTab === 'courses'} onClick={() => setActiveTab('courses')}>
                <BookOpen size={18} className="me-2" />
                Mes Cours
              </Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link active={activeTab === 'tests'} onClick={() => setActiveTab('tests')}>
                <CheckCircle size={18} className="me-2" />
                Tests
              </Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link active={activeTab === 'messages'} onClick={() => setActiveTab('messages')}>
                <MessageSquare size={18} className="me-2" />
                Messages
              </Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link active={activeTab === 'parametres'} onClick={() => setActiveTab('parametres')}>
                <Settings size={18} className="me-2" />
                Paramètres
              </Nav.Link>
            </Nav.Item>
          </Nav>
        </Col>

        {/* Main content */}
        <Col md={9} className="teacher-content">
          <div className="dashboard-header p-4">
            <div className="d-flex justify-content-between align-items-center">
              <h2>{activeTab === 'overview' && 'Vue d\'ensemble'}
                  {activeTab === 'courses' && 'Mes Cours'}
                  {activeTab === 'tests' && 'Tests'}
                  {activeTab === 'messages' && 'Messages'}
                  {activeTab === 'settings' && 'Paramètres'}
              </h2>
              <div className="d-flex align-items-center">
                <div className="notification-icon me-3 position-relative">
                  <Bell
                    size={20}
                    className="cursor-pointer"
                    onClick={() => setShowNotifications(!showNotifications)}
                  />
                  {notifications.length > 0 && (
                    <span className="notification-badge">{notifications.length}</span>
                  )}
                  {renderNotifications()}
                </div>
                <div className="profile d-flex align-items-center">
                  <Image src={"https://randomuser.me/api/portraits/men/32.jpg"} roundedCircle width={40} height={40} className="me-2" />
                  <div>
                    <div className="profile-name">{studentData?.fullName || 'Loading...'}</div>
                    <small className="text-muted">{studentData?.studentCard || '#ID'}</small>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Displaying content based on activeTab */}
          <div className="dashboard-content p-4">
            {renderNewStudentWelcome()}
            {renderContent()}
            {renderFormations()}
            {renderCourses()}
            {renderTests()}
            {renderExports()}
          </div>
        </Col>
      </Row>
    </Container>
  );
};

export default DashboardStudent;
