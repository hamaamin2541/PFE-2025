import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Button, Row, Col, Badge, Dropdown, Modal, Alert, Tabs, Tab, Spinner } from 'react-bootstrap';
import { BookOpen, MoreVertical, Edit, Trash2, GraduationCap, ClipboardCheck, Eye } from 'lucide-react';
import { API_BASE_URL } from '../../config/api';
import { authAxios, isAuthenticated, isTeacher } from '../../utils/authUtils';

export const TeacherContent = () => {
  const [courses, setCourses] = useState([]);
  const [tests, setTests] = useState([]);
  const [formations, setFormations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [itemTypeToDelete, setItemTypeToDelete] = useState(null);
  const [deleteError, setDeleteError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchContent = async () => {
      try {
        setLoading(true);

        // Vérifier si l'utilisateur est connecté et est un enseignant
        if (!isAuthenticated() || !isTeacher()) {
          console.error('User is not authenticated or not a teacher');
          navigate('/SeConnecter');
          return;
        }

        const api = authAxios();

        // Fetch all content types in parallel
        const [coursesResponse, testsResponse, formationsResponse] = await Promise.all([
          api.get(`${API_BASE_URL}/api/courses/teacher-courses`),
          api.get(`${API_BASE_URL}/api/tests/teacher/tests`),
          api.get(`${API_BASE_URL}/api/formations/teacher/formations`)
        ]);

        console.log('Courses:', coursesResponse.data);
        console.log('Tests:', testsResponse.data);
        console.log('Formations:', formationsResponse.data);

        setCourses(coursesResponse.data.data || []);
        setTests(testsResponse.data.data || []);
        setFormations(formationsResponse.data.data || []);
      } catch (error) {
        console.error('Error fetching content:', error);
        if (error.response && (error.response.status === 401 || error.response.status === 403)) {
          // Rediriger vers la page de connexion si l'authentification a échoué
          navigate('/SeConnecter');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchContent();
  }, [navigate]);

  const handleDelete = async (id, type) => {
    try {
      const api = authAxios();
      let endpoint;

      switch (type) {
        case 'course':
          endpoint = `${API_BASE_URL}/api/courses/${id}`;
          break;
        case 'test':
          endpoint = `${API_BASE_URL}/api/tests/${id}`;
          break;
        case 'formation':
          endpoint = `${API_BASE_URL}/api/formations/${id}`;
          break;
        default:
          throw new Error('Invalid content type');
      }

      const response = await api.delete(endpoint);

      if (response.data.success) {
        // Update the state based on the type
        if (type === 'course') {
          setCourses(prevCourses => prevCourses.filter(course => course._id !== id));
        } else if (type === 'test') {
          setTests(prevTests => prevTests.filter(test => test._id !== id));
        } else if (type === 'formation') {
          setFormations(prevFormations => prevFormations.filter(formation => formation._id !== id));
        }

        setShowDeleteModal(false);
        setDeleteError(null);
      } else {
        setDeleteError(response.data.message || `Erreur lors de la suppression du ${type}`);
      }
    } catch (error) {
      console.error(`Error deleting ${type}:`, error);
      setDeleteError(
        error.response?.data?.message ||
        `Une erreur est survenue lors de la suppression du ${type}`
      );

      if (error.response && (error.response.status === 401 || error.response.status === 403)) {
        // Rediriger vers la page de connexion si l'authentification a échoué
        navigate('/SeConnecter');
      }
    }
  };

  const handleEdit = (id, type) => {
    switch (type) {
      case 'course':
        navigate(`/dashboard-teacher/edit-course/${id}`);
        break;
      case 'test':
        navigate(`/dashboard-teacher/edit-test/${id}`);
        break;
      case 'formation':
        navigate(`/dashboard-teacher/edit-formation/${id}`);
        break;
      default:
        console.error('Invalid content type');
    }
  };

  // Get all content items based on active tab
  const getContentItems = () => {
    switch (activeTab) {
      case 'courses':
        return courses.map(item => ({ ...item, type: 'course' }));
      case 'tests':
        return tests.map(item => ({ ...item, type: 'test' }));
      case 'formations':
        return formations.map(item => ({ ...item, type: 'formation' }));
      case 'all':
      default:
        return [
          ...courses.map(item => ({ ...item, type: 'course' })),
          ...tests.map(item => ({ ...item, type: 'test' })),
          ...formations.map(item => ({ ...item, type: 'formation' }))
        ];
    }
  };

  // Render content item card
  const renderContentCard = (item, type) => {
    const itemType = type || item.type;

    return (
      <Col md={4} key={item._id} className="mb-4">
        <Card className="h-100">
          <div className="position-relative">
            {item.coverImage && (
              <Card.Img
                variant="top"
                src={`${API_BASE_URL}/${item.coverImage}`}
                style={{ height: '200px', objectFit: 'cover' }}
              />
            )}
            <Dropdown className="position-absolute top-0 end-0 m-2">
              <Dropdown.Toggle variant="light" size="sm" className="">
                <MoreVertical size={16} />
              </Dropdown.Toggle>
              <Dropdown.Menu className='me-4'>
                <Dropdown.Item onClick={() => handleEdit(item._id, itemType)}>
                  <Edit size={16} />
                  Modifier
                </Dropdown.Item>
                <Dropdown.Item
                  className="text-danger"
                  onClick={() => {
                    setItemToDelete(item);
                    setItemTypeToDelete(itemType);
                    setShowDeleteModal(true);
                  }}
                >
                  <Trash2 size={16} className="me-2" />
                  Supprimer
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
          </div>
          <Card.Body>
            <div className="d-flex align-items-center mb-2">
              {itemType === 'course' && <BookOpen size={16} className="me-2 text-success" />}
              {itemType === 'test' && <ClipboardCheck size={16} className="me-2 text-danger" />}
              {itemType === 'formation' && <GraduationCap size={16} className="me-2 text-purple" />}
              <Badge bg={
                itemType === 'course' ? 'success' :
                itemType === 'test' ? 'danger' : 'purple'
              }>
                {itemType === 'course' ? 'Cours' :
                 itemType === 'test' ? 'Test' : 'Formation'}
              </Badge>
            </div>
            <Card.Title>{item.title}</Card.Title>
            <Card.Text>{item.description}</Card.Text>
            <div className="d-flex justify-content-between align-items-center">
              <Badge bg="info">{item.category}</Badge>
              {itemType === 'course' && <Badge bg="secondary">{item.language}</Badge>}
              {itemType === 'test' && <Badge bg="secondary">{item.difficulty}</Badge>}
              {itemType === 'formation' && <Badge bg="secondary">{item.level}</Badge>}
            </div>
            <div className="mt-3">
              {itemType === 'course' && <small className="text-muted">Niveau: {item.level}</small>}
              {itemType === 'test' && <small className="text-muted">Durée: {item.duration} min</small>}
              {itemType === 'formation' && <small className="text-muted">Durée: {item.duration}</small>}
              <div className="d-flex justify-content-between align-items-center mt-2">
                <div className="fw-bold">{item.price}€</div>
                {itemType === 'course' && (
                  <div className="d-flex align-items-center">
                    <Eye size={16} className="text-success me-1" />
                    <small>{item.views || 0} vues</small>
                  </div>
                )}
              </div>
            </div>
          </Card.Body>
        </Card>
      </Col>
    );
  };

  return (
    <div className="teacher-content">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4>Mes Contenus Publiés</h4>
      </div>

      <Tabs
        activeKey={activeTab}
        onSelect={(k) => setActiveTab(k)}
        className="mb-4"
      >
        <Tab eventKey="all" title="Tous">
          {/* All content will be shown here */}
        </Tab>
        <Tab eventKey="courses" title={`Cours (${courses.length})`}>
          {/* Only courses will be shown here */}
        </Tab>
        <Tab eventKey="tests" title={`Tests (${tests.length})`}>
          {/* Only tests will be shown here */}
        </Tab>
        <Tab eventKey="formations" title={`Formations (${formations.length})`}>
          {/* Only formations will be shown here */}
        </Tab>
      </Tabs>

      <Row>
        {loading ? (
          <div>Chargement...</div>
        ) : getContentItems().length === 0 ? (
          <Col xs={12}>
            <Card className="text-center p-5">
              <BookOpen size={48} className="mx-auto text-muted mb-3" />
              <h5>Aucun contenu publié</h5>
              <p className="text-muted">Commencez par créer votre premier contenu</p>
            </Card>
          </Col>
        ) : (
          getContentItems().map(item => renderContentCard(item))
        )}
      </Row>

      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Confirmer la suppression</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {deleteError && (
            <Alert variant="danger" className="mb-3">
              {deleteError}
            </Alert>
          )}
          Êtes-vous sûr de vouloir supprimer {itemTypeToDelete === 'course' ? 'le cours' :
                                             itemTypeToDelete === 'test' ? 'le test' : 'la formation'}
          "{itemToDelete?.title}" ?
          Cette action est irréversible.
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => {
            setShowDeleteModal(false);
            setDeleteError(null);
          }}>
            Annuler
          </Button>
          <Button
            variant="danger"
            onClick={() => handleDelete(itemToDelete?._id, itemTypeToDelete)}
          >
            Supprimer
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default TeacherContent;
