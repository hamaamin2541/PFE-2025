// DashboardStudent.jsx
import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Nav, Button, Image, Card, ProgressBar, Badge, Table, Spinner } from 'react-bootstrap';
import { Home, BookOpen, CheckCircle, MessageSquare, Settings, Bell, Play, Award, Download, Star, Users, HelpCircle, Share2 } from 'lucide-react';
import { useStudent } from '../../context/StudentContext';
import { useFormation } from '../../context/FormationContext';
import { useGamification } from '../../context/GamificationContext';
import PointsDisplay from '../../components/Gamification/PointsDisplay';
import { useLocation, useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../../config/api';
import Overview from './Overview';
import Courses from './MesCours';
import Tests from './Tests';
import Messages from './Messages';
import Parametres from './Parametres';
import MesContenus from './MesContenus';
import StudySessions from './StudySessions';
import AssistantDashboard from '../../components/Assistant/AssistantDashboard';
import CommunityWall from '../../pages/CommunityWall';
import './StudentDashboard.css';  // Nouveau fichier CSS correspondant au style enseignant
import '../../components/Assistant/AssistantDashboard.css';
import { initializeNewStudent } from '../../services/studentInitializer';
const DashboardStudent = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(location.state?.activeTab || 'overview');
  const [profileImage, setProfileImage] = useState("https://randomuser.me/api/portraits/men/32.jpg");
  const { studentData, updateStudentData } = useStudent();
  const { formations, updateFormations } = useFormation();
  const { points, badges, refreshGamificationData } = useGamification();
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
          localStorage.setItem('userId', userData._id);
          updateStudentData(userData);
          setIsNewStudent(true);
          // Initialize notifications from userData or empty array
          setNotifications(userData.notifications || []);

          // Refresh gamification data after student data is loaded
          refreshGamificationData();

          // Fetch study session invitations
          fetchStudySessionInvitations(token);
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

  // Function to fetch study session invitations
  const fetchStudySessionInvitations = async (token) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/study-sessions`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (data.success) {
        // Filter for pending invitations where the current user is the guest
        const userId = localStorage.getItem('userId');
        const pendingInvitations = data.data.filter(
          session => session.status === 'pending' && session.guest?._id === userId
        );

        // Add study session invitations to notifications
        if (pendingInvitations.length > 0) {
          const studySessionNotifications = pendingInvitations.map(invitation => ({
            message: `Vous avez une invitation à étudier "${invitation.course?.title}" avec ${invitation.host?.fullName}`,
            time: new Date(invitation.createdAt).toLocaleString(),
            type: 'study-session',
            id: invitation._id,
            action: () => setActiveTab('studySessions')
          }));

          setNotifications(prevNotifications => [
            ...studySessionNotifications,
            ...prevNotifications
          ]);
        }
      }
    } catch (error) {
      console.error('Error fetching study sessions:', error);
    }
  };

  useEffect(() => {
    // Try to get user data from different sources
    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    const studentData = JSON.parse(localStorage.getItem('studentData') || '{}');

    // Use the first available user ID
    const userId = userData?._id || studentData?._id;

    let isMounted = true;

    if (userId && isMounted) {
      console.log('Calling updateFormations with userId:', userId);
      // Wrap in try/catch to prevent unhandled promise rejections
      try {
        updateFormations(userId);
      } catch (error) {
        console.log('Error updating formations, will use mock data:', error);
      }
    } else {
      console.log('No user ID found for fetching formations');
    }

    // Cleanup function to prevent state updates after unmount
    return () => {
      isMounted = false;
    };
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

  // Check if the current user is an assistant
  const isAssistantUser = () => {
    // Try to get the role from multiple sources to ensure it works
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const userRole = localStorage.getItem('userRole');
    const studentData = JSON.parse(localStorage.getItem('studentData') || '{}');

    // Check all possible sources for the assistant role
    return user.role === 'assistant' ||
           userRole === 'assistant' ||
           studentData.role === 'assistant';
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return <Overview />;
      case 'contenus':
        return <MesContenus />;
      case 'messages':
        // Pass the teacherId from location.state to the Messages component
        return <Messages teacherId={location.state?.teacherId} />;
      case 'parametres':
        return <Parametres
          currentProfileImage={profileImage}
          onProfileImageChange={handleProfileImageChange}
          onSubmit={handleFormSubmit}
          isSubmitting={isSubmitting}
          initialData={studentData}
        />;
      case 'studySessions':
        return <StudySessions />;
      case 'communityWall':
        return <CommunityWall />;
      case 'assistant':
        return <AssistantDashboard />;
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

      // Try multiple download methods for better browser compatibility
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
        try {
          const response = await fetch(downloadUrl, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });

          if (!response.ok) throw new Error('Network response was not ok');

          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.style.display = 'none';
          a.href = url;
          // Use a timestamp to avoid browser caching issues
          a.download = `export-${exportId}-${Date.now()}.file`;
          document.body.appendChild(a);
          a.click();

          // Clean up
          setTimeout(() => {
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
          }, 100);
        } catch (fetchError) {
          console.error('Fetch error:', fetchError);

          // Method 3: iframe approach
          try {
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
          } catch (iframeError) {
            console.error('iframe error:', iframeError);
            // Final fallback
            window.location.href = downloadUrl;
          }
        }
      }
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
          <div
            key={index}
            className="notification-item"
            onClick={() => {
              if (notif.action) {
                notif.action();
                setShowNotifications(false);
              }
            }}
          >
            <div className="d-flex justify-content-between align-items-center mb-1">
              <p>{notif.message}</p>
              {notif.type === 'study-session' && (
                <Badge bg="warning" pill>Session</Badge>
              )}
            </div>
            <div className="d-flex justify-content-between align-items-center">
              <small>{notif.time}</small>
              {notif.type === 'study-session' && (
                <small className="text-primary">Cliquez pour voir l'invitation</small>
              )}
            </div>
          </div>
        ))
      ) : (
        <div className="no-notifications">
          <p>Aucune notification</p>
        </div>
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
                src={`${profileImage}`}
                alt="Profile"
                roundedCircle
                width={120}
                height={120}
              />
            </div>
            <h5 className='TitleSideBar'>{studentData?.fullName || 'Loading...'}</h5>
            <p className="text-muted">{studentData?.role || 'Étudiant'}</p>

            {/* Points Display */}
            <div className="points-display mb-3">
              <PointsDisplay points={points} size="md" showTooltip={true} />
            </div>

            {/* Badges Display */}
            <div className="badges-display mb-3">
              <Badge bg="info" pill className="px-3 py-2">
                <Award size={16} className="me-1" />
                {badges?.length || 0} badges
              </Badge>
            </div>
            <div className="profile-completion mb-3">
              <div className="d-flex justify-content-between align-items-center mb-1">
                <small className="text-white">Profil complété</small>
                <small className="text-white">{studentData?.profileCompletionPercentage || 0}%</small>
              </div>
              <ProgressBar
                now={parseInt(studentData?.profileCompletionPercentage) || 0}
                variant={parseInt(studentData?.profileCompletionPercentage) === 100 ? "success" : "info"}
                className="profile-progress"
                style={{ height: '8px' }}
              />
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
              <Nav.Link active={activeTab === 'contenus'} onClick={() => setActiveTab('contenus')}>
                <BookOpen size={18} className="me-2" />
                Mes Contenus
              </Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link onClick={() => navigate('/mes-certificats')}>
                <Award size={18} className="me-2" />
                Mes Certificats
              </Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link active={activeTab === 'studySessions'} onClick={() => setActiveTab('studySessions')}>
                <Users size={18} className="me-2" />
                Sessions d'étude
              </Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link active={activeTab === 'communityWall'} onClick={() => setActiveTab('communityWall')}>
                <Share2 size={18} className="me-2" />
                Mur Communautaire
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

            {/* Assistant Dashboard Tab - Only visible for assistant users */}
            {isAssistantUser() && (
              <Nav.Item className="mt-4">
                <div className="assistant-role-divider mb-2">
                  <span className="badge bg-info px-3 py-2">Fonctions Assistant</span>
                </div>
                <Nav.Link
                  active={activeTab === 'assistant'}
                  onClick={() => setActiveTab('assistant')}
                  className="assistant-nav-link"
                >
                  <HelpCircle size={18} className="me-2" />
                  Tableau Assistant
                </Nav.Link>
              </Nav.Item>
            )}
          </Nav>
        </Col>

        {/* Main content */}
        <Col md={9} className="teacher-content">          <div className="dashboard-header">
            <div className="header-container">
              <h2>
                {activeTab === 'overview' && 'Vue d\'ensemble'}
                {activeTab === 'contenus' && 'Mes Contenus'}
                {activeTab === 'messages' && 'Messages'}
                {activeTab === 'parametres' && 'Paramètres'}
                {activeTab === 'studySessions' && 'Sessions d\'étude'}
                {activeTab === 'communityWall' && 'Mur Communautaire'}
                {activeTab === 'assistant' && 'Tableau de Bord Assistant'}
              </h2>              <div className="right-section">
                <div className={`notification-icon ${notifications.length > 0 ? 'has-notifications' : ''}`}>
                  <Bell
                    className="cursor-pointer"
                    onClick={() => setShowNotifications(!showNotifications)}
                  />
                  {notifications.length > 0 && (
                    <span className="notification-badge">{notifications.length}</span>
                  )}
                  {renderNotifications()}
                </div>
                <div className="profile">
                  <Image src={profileImage} roundedCircle width={40} height={40} />
                  <div className="profile-info">
                    <span className="profile-name">{studentData?.fullName || 'Loading...'}</span>
                    <small>{studentData?.studentCard || '#ID'}</small>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Displaying content based on activeTab */}
          <div className="dashboard-content p-4">
            {renderContent()}
          </div>
        </Col>
      </Row>
    </Container>
  );
};

export default DashboardStudent;
