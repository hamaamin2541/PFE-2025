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
  Dropdown
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
  ClipboardCheck
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTeacher } from '../../context/TeacherContext';
import { API_BASE_URL } from '../../config/api';
import './DashboardTeacher.css';
import { TeacherAnalytics } from './TeacherAnalytics';
import TeacherMessages from './TeacherMessages';
import AddCourse from './AddCourse';
import AddFormation from './AddFormation';
import AddTextAdvice from './conseiltest/AddTextAdvice';
import AddVideoAdvice from './conseiltest/AddVideoAdvice';
import AddTest from './conseiltest/AddTest';
import TeacherContent from './TeacherContent';
import TeacherSettings from './TeacherSettings';

const DashboardTeacher = () => {
  const { teacherData } = useTeacher();
  const [activeTab, setActiveTab] = useState('courses');
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalEarnings: 0,
    avgRating: 0,
    coursesPublished: 0
  });
  const navigate = useNavigate();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE_URL}/api/courses/teacher/analytics`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setStats({
              totalStudents: data.data.totalStudents || 0,
              totalEarnings: data.data.totalRevenue || 0,
              avgRating: data.data.averageRating || 0,
              coursesPublished: (data.data.totalCourses || 0) +
                               (data.data.totalTests || 0) +
                               (data.data.totalFormations || 0)
            });
          }
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
      }
    };

    fetchStats();
  }, []);

  const renderContent = () => {
    switch (activeTab) {
      case 'analytics':
        return <TeacherAnalytics />;
      case 'messages':
        return <TeacherMessages />;
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
      default:
        return <TeacherContent />;
    }
  };

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
                }}
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
                now={teacherData.profileCompletionPercentage || 0}
                variant={teacherData.profileCompletionPercentage === 100 ? "success" : "info"}
                className="profile-progress"
                style={{ height: '8px' }}
              />
              {teacherData.profileCompletionPercentage < 100 && (
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
