import React, { useState, useEffect, useRef } from 'react';
import {
  Container,
  Row,
  Col,
  Card,
  Nav,
  ProgressBar,
  Button,
  Image,
  Modal,
  Form,
  Dropdown,
  Alert
} from 'react-bootstrap';
import {
  BookOpen,
  DollarSign,
  BarChart2,
  MessageSquare,
  Star,
  Settings,
  HelpCircle,
  Plus,
  Upload,
  GraduationCap,
  ClipboardCheck,
  ShoppingBag
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTeacher } from '../../context/TeacherContext';
import { API_BASE_URL } from '../../config/api';
import './DashboardTeacher.css';
import { authAxios, isAuthenticated, isTeacher } from '../../utils/authUtils';
import { TeacherAnalytics } from './TeacherAnalytics';
import TeacherMessages from './TeacherMessages';
import AddCourse from './AddCourse';
import AddFormation from './AddFormation';
import AddTextAdvice from './conseiltest/AddTextAdvice';
import AddVideoAdvice from './conseiltest/AddVideoAdvice';
import AddTest from './conseiltest/AddTest';
import TeacherContent from './TeacherContent';
import TeacherPurchasedContent from './TeacherPurchasedContent';
import TeacherSettings from './TeacherSettings';

const DashboardTeacher = () => {
  const { teacherData, updateTeacherData } = useTeacher();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState(location.state?.activeTab || 'courses');
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalEarnings: 0,
    avgRating: 0,
    coursesPublished: 0
  });
  const [authError, setAuthError] = useState(null);
  const navigate = useNavigate();

  // Load stored teacher data when dashboard loads
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      const storedImage = localStorage.getItem('teacherProfileImage');
      const storedPercentage = localStorage.getItem('profileCompletionPercentage');

      // Only update if the data is different from what's already in context
      if (storedImage &&
          (teacherData.profileImage !== storedImage ||
           teacherData.profileCompletionPercentage !== parseInt(storedPercentage || '0'))) {

        console.log('Loading stored teacher data from localStorage');
        updateTeacherData({
          profileImage: storedImage,
          profileCompletionPercentage: parseInt(storedPercentage || '0')
        });
      }
    }
  }, []); // Remove updateTeacherData from dependencies

  // Vérifier l'authentification et le rôle au chargement du composant
  useEffect(() => {
    if (!isAuthenticated()) {
      setAuthError('Vous devez être connecté pour accéder à cette page');
      setTimeout(() => navigate('/SeConnecter'), 2000);
      return;
    }

    if (!isTeacher()) {
      setAuthError('Vous devez être un enseignant pour accéder à cette page');
      setTimeout(() => navigate('/Accueil'), 2000);
      return;
    }
  }, [navigate]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Vérifier si l'utilisateur est connecté et est un enseignant
        if (!isAuthenticated() || !isTeacher()) {
          console.error('User is not authenticated or not a teacher');
          navigate('/SeConnecter');
          return;
        }

        const api = authAxios();
        const response = await api.get(`${API_BASE_URL}/api/courses/teacher/analytics`);

        if (response.data.success) {
          setStats({
            totalStudents: response.data.data.totalStudents || 0,
            totalEarnings: response.data.data.totalRevenue || 0,
            avgRating: response.data.data.averageRating || 0,
            coursesPublished: (response.data.data.totalCourses || 0) +
                             (response.data.data.totalTests || 0) +
                             (response.data.data.totalFormations || 0)
          });
        }
      } catch (error) {
        console.error('Error fetching teacher stats:', error);
        // Set default values if fetch fails
        setStats({
          totalStudents: 0,
          totalEarnings: 0,
          avgRating: 0,
          coursesPublished: 0
        });

        if (error.response && (error.response.status === 401 || error.response.status === 403)) {
          // Rediriger vers la page de connexion si l'authentification a échoué
          navigate('/SeConnecter');
        }
      }
    };

    fetchStats();
  }, [navigate]);

  const renderContent = () => {
    switch (activeTab) {
      case 'analytics':
        return <TeacherAnalytics />;
      case 'messages':
        // Pass any teacherId from location state to the TeacherMessages component
        return <TeacherMessages teacherId={location.state?.teacherId} />;
      case 'settings':
        return <TeacherSettings />;
      case 'add-course':
        return <AddCourse />;
      case 'add-formation':
        return <AddFormation />;
      case 'add-advice':
        return <AddTextAdvice />;
      case 'add-video-advice':
        return <AddVideoAdvice />;
      case 'add-test':
        return <AddTest />;
      case 'purchased-content':
        return <TeacherPurchasedContent />;
      default:
        return <TeacherContent />;
    }
  };

  // Afficher un message d'erreur si l'authentification échoue
  if (authError) {
    return (
      <Container className="mt-5">
        <Alert variant="danger">
          {authError}
          <div className="mt-3">
            Redirection en cours...
          </div>
        </Alert>
      </Container>
    );
  }

  return (
    <Container fluid className="teacher-dashboard px-0">
      <Row className="g-0">
        <Col md={3} className="teacher-sidebar">
          <div className="profile-section text-center p-4">
            <div className="avatar mb-3">
              <Image
                src={
                  teacherData.profileImage
                    ? (teacherData.profileImage.startsWith('http')
                        ? teacherData.profileImage
                        : `${API_BASE_URL}/${teacherData.profileImage}`)
                    : '/images/default-profile.jpg'
                }
                alt="Profile"
                roundedCircle
                width={120}
                height={120}
                style={{ objectFit: 'cover' }}
                onError={(e) => {
                  e.target.src = '/images/default-profile.jpg';
                  console.log('Image load error, using default image');
                }}
                onLoad={() => console.log('Profile image loaded successfully')}
              />
            </div>
            <h5>{teacherData.fullName || 'Loading...'}</h5>
            <p className="text-muted">{teacherData.role || 'Enseignant'}</p>
            <div className="rating mb-3">
              <span className="ms-1">{teacherData.rating || '0'}</span>
            </div>
            <div className="profile-completion mb-3">
              <div className="d-flex justify-content-between align-items-center mb-1">
                <small className="text-white">Profil complété</small>
                <small className="text-white">{teacherData.profileCompletionPercentage || 0}%</small>
              </div>
              <ProgressBar
                now={parseInt(teacherData.profileCompletionPercentage) || 0}
                variant={parseInt(teacherData.profileCompletionPercentage) === 100 ? "success" : "info"}
                className="profile-progress"
                style={{ height: '8px' }}
              />
              {parseInt(teacherData.profileCompletionPercentage) < 100 && (
                <small className="text-white-50 mt-1 d-block">
                  Complétez votre profil dans Paramètres
                </small>
              )}
            </div>
          </div>
          <div>
            <Nav variant="pills" className="flex-column">
              <Nav.Item>
                <Nav.Link
                  active={activeTab === 'courses'}
                  onClick={() => setActiveTab('courses')}
                >
                  <BookOpen size={18} className="me-2" />
                  Mes cours
                </Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link
                  active={activeTab === 'purchased-content'}
                  onClick={() => setActiveTab('purchased-content')}
                >
                  <ShoppingBag size={18} className="me-2" />
                  Contenus Achetés
                </Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link
                  active={activeTab === 'analytics'}
                  onClick={() => setActiveTab('analytics')}
                >
                  <BarChart2 size={18} className="me-2" />
                  Analytics
                </Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link
                  active={activeTab === 'messages'}
                  onClick={() => setActiveTab('messages')}
                >
                  <MessageSquare size={18} className="me-2" />
                  Messages
                </Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link
                  active={activeTab === 'settings'}
                  onClick={() => setActiveTab('settings')}
                >
                  <Settings size={18} className="me-2" />
                  Paramètres
                </Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link
                  active={activeTab === 'add-course'}
                  onClick={() => setActiveTab('add-course')}
                >
                  <Plus size={18} className="me-2" />
                  Nouveau cours
                </Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link
                  active={activeTab === 'add-formation'}
                  onClick={() => setActiveTab('add-formation')}
                >
                  <GraduationCap size={18} className="me-2" />
                  Ajouter une formation
                </Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link
                  active={activeTab === 'add-test'}
                  onClick={() => setActiveTab('add-test')}
                >
                  <ClipboardCheck size={18} className="me-2" />
                  Ajouter un test
                </Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link
                  active={activeTab === 'add-advice'}
                  onClick={() => setActiveTab('add-advice')}
                >
                  <Plus size={18} className="me-2" />
                  Nouveau Conseil
                </Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link
                  active={activeTab === 'add-video-advice'}
                  onClick={() => setActiveTab('add-video-advice')}
                >
                  <Plus size={18} className="me-2" />
                  Ajouter Conseil Vidéo
                </Nav.Link>
              </Nav.Item>
            </Nav>
          </div>
        </Col>

        <Col md={9} className="teacher-content">
          <div className="dashboard-header p-4">
            <h2>
              {activeTab === 'courses' && `Mes Contenus`}
              {activeTab === 'purchased-content' && 'Contenus Achetés'}
              {activeTab === 'analytics' && 'Analytics'}
              {activeTab === 'messages' && 'Messages'}
              {activeTab === 'settings' && 'Paramètres'}
              {activeTab === 'add-course' && 'Nouveau cours'}
              {activeTab === 'add-formation' && 'Ajouter une formation'}
              {activeTab === 'add-advice' && 'Nouveau Conseil'}
              {activeTab === 'add-video-advice' && 'Conseil Vidéo'}
              {activeTab === 'add-test' && 'Ajouter un test'}
            </h2>
          </div>

          <div className="dashboard-content p-4">
            {renderContent()}
          </div>
        </Col>
      </Row>
    </Container>
  );
};

export default DashboardTeacher;
