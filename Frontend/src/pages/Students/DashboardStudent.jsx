// DashboardStudent.jsx
import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Nav, Button, Image, Card, ProgressBar, Badge } from 'react-bootstrap';
import { Home, BookOpen, CheckCircle, MessageSquare, Settings, Bell, Play, Award } from 'lucide-react';
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
  const [error, setError] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [personalInfo, setPersonalInfo] = useState({
    fullName: '',
    email: '',
    phone: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

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
        const response = await fetch('http://localhost:5000/api/users/dashboard', {
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
    // Simulate fetching courses for the logged-in user
    if (studentData && studentData.courses) {
      setCourses(studentData.courses);
    }
  }, [studentData]);

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
      const response = await fetch('http://localhost:5000/api/users/update-profile', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updatedInfo)
      });

      if (response.ok) {
        const data = await response.json();
        updateStudentData(data);
        setPersonalInfo(data);
        alert('Informations mises à jour avec succès!');
      }
    } catch (error) {
      console.error('Error updating personal info:', error);
      alert('Erreur lors de la mise à jour des informations');
    }
  };

  const handlePasswordChange = async (passwordData) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/users/change-password', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(passwordData)
      });

      if (response.ok) {
        alert('Mot de passe modifié avec succès!');
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

      const response = await fetch('http://localhost:5000/api/users/update-profile', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          fullName: formData.fullName,
          email: formData.email
        })
      });

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
    return (
      <div className="formations-section mt-4">
        <h3>Mes Formations</h3>
        {formations.length === 0 ? (
          <p className="text-center">Aucune formation trouvée. Inscrivez-vous à une formation pour commencer !</p>
        ) : (
          <Row>
            {formations.map((formation) => (
              <Col key={formation._id} md={4} className="mb-4">
                <Card className="h-100 shadow-sm">
                  {formation.formation?.coverImage ? (
                    <Card.Img
                      variant="top"
                      src={`${API_BASE_URL}/${formation.formation.coverImage}`}
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
                      <Badge bg={formation.status === 'completed' ? 'success' : 'info'}>
                        {formation.status === 'completed' ? 'Terminé' : 'En cours'}
                      </Badge>
                    </div>
                    <Card.Title>{formation.title}</Card.Title>
                    <Card.Text className="flex-grow-1 small text-muted">
                      {formation.description && formation.description.length > 100
                        ? formation.description.substring(0, 100) + '...'
                        : formation.description}
                    </Card.Text>
                    <div className="mb-3">
                      <div className="d-flex justify-content-between align-items-center mb-1">
                        <small>Progression</small>
                        <small>{formation.progress}%</small>
                      </div>
                      <ProgressBar
                        now={formation.progress}
                        variant={formation.progress === 100 ? "success" : "warning"}
                        style={{ height: '8px' }}
                      />
                    </div>
                    <Button
                      variant={formation.status === 'completed' ? 'outline-success' : 'warning'}
                      className="mt-auto d-flex align-items-center justify-content-center"
                      onClick={() => navigate(`/formation/${formation._id}`)}
                    >
                      {formation.status === 'completed' ? (
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
          </Row>
        )}
      </div>
    );
  };

  const renderCourses = () => {
    return (
      <div className="courses-section mt-4">
        <h3>Mes Cours</h3>
        {courses.length === 0 ? (
          <p className="text-center">Aucun cours trouvé. Inscrivez-vous à un cours pour commencer !</p>
        ) : (
          <Row>
            {courses.map((course) => (
              <Col key={course.id} md={4} className="mb-4">
                <Card>
                  <Card.Body>
                    <Card.Title>{course.title}</Card.Title>
                    <Card.Text>{course.description}</Card.Text>
                  </Card.Body>
                </Card>
              </Col>
            ))}
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
            {renderContent()}
            {renderFormations()}
            {renderCourses()}
          </div>
        </Col>
      </Row>
    </Container>
  );
};

export default DashboardStudent;
