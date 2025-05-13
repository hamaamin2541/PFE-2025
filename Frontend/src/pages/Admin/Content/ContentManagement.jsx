import React, { useState, useEffect } from 'react';
import { Container, Card, Nav, Table, Button, Badge, Spinner, Form, Row, Col, Alert, Modal } from 'react-bootstrap';
import { Search, Eye, Edit, Trash2, ArrowLeft, Check, X } from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../../../config/api';

const ContentManagement = () => {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState(() => {
    // Set the active tab based on the current route
    if (location.pathname.includes('/admin/tests')) {
      return 'tests';
    } else if (location.pathname.includes('/admin/formations')) {
      return 'formations';
    } else if (location.pathname.includes('/admin/courses')) {
      return 'courses';
    } else {
      // Default to courses for /admin/content or any other path
      return 'courses';
    }
  });
  const [courses, setCourses] = useState([]);
  const [tests, setTests] = useState([]);
  const [formations, setFormations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sortField, setSortField] = useState('createdAt');
  const [sortDirection, setSortDirection] = useState('desc');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    // Update active tab when route changes
    if (location.pathname.includes('/admin/tests')) {
      setActiveTab('tests');
    } else if (location.pathname.includes('/admin/formations')) {
      setActiveTab('formations');
    } else if (location.pathname.includes('/admin/courses')) {
      setActiveTab('courses');
    } else if (location.pathname.includes('/admin/content')) {
      // Keep the current tab for /admin/content
      // This allows the content page to show the last selected tab
    }
  }, [location.pathname]);

  // No need to handle /admin/content navigation anymore as we're directly navigating to specific content types

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    fetchContent();
  }, [activeTab, currentPage, sortField, sortDirection, location.pathname]);

  const fetchContent = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      let endpoint = '';

      // Navigation is now handled by the dedicated useEffect hook

      switch (activeTab) {
        case 'courses':
          endpoint = `${API_BASE_URL}/api/courses?page=${currentPage}&sort=${sortField}&direction=${sortDirection}&search=${searchTerm}`;
          break;
        case 'tests':
          endpoint = `${API_BASE_URL}/api/tests?page=${currentPage}&sort=${sortField}&direction=${sortDirection}&search=${searchTerm}`;
          break;
        case 'formations':
          endpoint = `${API_BASE_URL}/api/formations?page=${currentPage}&sort=${sortField}&direction=${sortDirection}&search=${searchTerm}`;
          break;
        default:
          endpoint = `${API_BASE_URL}/api/courses?page=${currentPage}&sort=${sortField}&direction=${sortDirection}&search=${searchTerm}`;
      }

      const response = await axios.get(endpoint, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.data.success) {
        switch (activeTab) {
          case 'courses':
            setCourses(response.data.data);
            break;
          case 'tests':
            setTests(response.data.data);
            break;
          case 'formations':
            setFormations(response.data.data);
            break;
        }

        // If pagination info is available in the response
        if (response.data.pagination) {
          setTotalPages(response.data.pagination.totalPages);
        }
      } else {
        setError(`Erreur lors du chargement des ${getContentTypeName()}`);
      }
    } catch (err) {
      console.error(`Error fetching ${activeTab}:`, err);
      setError(`Erreur lors du chargement des ${getContentTypeName()}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchItemDetails = async (id) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      let endpoint = '';

      switch (activeTab) {
        case 'courses':
          endpoint = `${API_BASE_URL}/api/courses/${id}`;
          break;
        case 'tests':
          endpoint = `${API_BASE_URL}/api/tests/${id}`;
          break;
        case 'formations':
          endpoint = `${API_BASE_URL}/api/formations/${id}`;
          break;
      }

      const response = await axios.get(endpoint, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.data.success) {
        setSelectedItem(response.data.data);
        setShowDetailModal(true);
      } else {
        setError(`Erreur lors du chargement des détails`);
      }
    } catch (err) {
      console.error(`Error fetching details:`, err);
      setError(`Erreur lors du chargement des détails`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (item) => {
    setItemToDelete(item);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      let endpoint = '';

      switch (activeTab) {
        case 'courses':
          endpoint = `${API_BASE_URL}/api/courses/${itemToDelete._id}`;
          break;
        case 'tests':
          endpoint = `${API_BASE_URL}/api/tests/${itemToDelete._id}`;
          break;
        case 'formations':
          endpoint = `${API_BASE_URL}/api/formations/${itemToDelete._id}`;
          break;
      }

      const response = await axios.delete(endpoint, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.data.success) {
        setSuccess(`${getSingularContentTypeName()} supprimé avec succès`);
        setShowDeleteModal(false);

        // Update the state to remove the deleted item
        switch (activeTab) {
          case 'courses':
            setCourses(courses.filter(course => course._id !== itemToDelete._id));
            break;
          case 'tests':
            setTests(tests.filter(test => test._id !== itemToDelete._id));
            break;
          case 'formations':
            setFormations(formations.filter(formation => formation._id !== itemToDelete._id));
            break;
        }
      } else {
        setError(`Erreur lors de la suppression du ${getSingularContentTypeName()}`);
      }
    } catch (err) {
      console.error(`Error deleting ${activeTab}:`, err);
      setError(`Erreur lors de la suppression du ${getSingularContentTypeName()}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchContent();
  };

  const handleSort = (field) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
    setCurrentPage(1);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const getContentTypeName = () => {
    switch (activeTab) {
      case 'courses':
        return 'cours';
      case 'tests':
        return 'tests';
      case 'formations':
        return 'formations';
      default:
        return 'contenus';
    }
  };

  const getSingularContentTypeName = () => {
    switch (activeTab) {
      case 'courses':
        return 'cours';
      case 'tests':
        return 'test';
      case 'formations':
        return 'formation';
      default:
        return 'contenu';
    }
  };

  const renderContentTable = () => {
    let items = [];
    switch (activeTab) {
      case 'courses':
        items = courses;
        break;
      case 'tests':
        items = tests;
        break;
      case 'formations':
        items = formations;
        break;
    }

    return (
      <div className="table-responsive">
        <Table hover>
          <thead>
            <tr>
              <th onClick={() => handleSort('title')} style={{ cursor: 'pointer' }}>
                Titre {sortField === 'title' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th>Enseignant</th>
              <th onClick={() => handleSort('category')} style={{ cursor: 'pointer' }}>
                Catégorie {sortField === 'category' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th onClick={() => handleSort('price')} style={{ cursor: 'pointer' }}>
                Prix {sortField === 'price' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th onClick={() => handleSort('createdAt')} style={{ cursor: 'pointer' }}>
                Date {sortField === 'createdAt' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.length > 0 ? (
              items.map((item) => (
                <tr key={item._id}>
                  <td>{item.title}</td>
                  <td>{item.teacher?.fullName || 'N/A'}</td>
                  <td>{item.category}</td>
                  <td>{item.price} €</td>
                  <td>{new Date(item.createdAt).toLocaleDateString()}</td>
                  <td>
                    <div className="d-flex gap-2">
                      <Button variant="outline-primary" size="sm" onClick={() => fetchItemDetails(item._id)}>
                        <Eye size={16} />
                      </Button>
                      <Button variant="outline-danger" size="sm" onClick={() => handleDeleteClick(item)}>
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="text-center py-4">
                  Aucun {getSingularContentTypeName()} trouvé
                </td>
              </tr>
            )}
          </tbody>
        </Table>
      </div>
    );
  };

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    return (
      <div className="d-flex justify-content-center mt-4">
        <ul className="pagination">
          <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
            <button
              className="page-link"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              Précédent
            </button>
          </li>
          {[...Array(totalPages).keys()].map(page => (
            <li key={page + 1} className={`page-item ${currentPage === page + 1 ? 'active' : ''}`}>
              <button
                className="page-link"
                onClick={() => handlePageChange(page + 1)}
              >
                {page + 1}
              </button>
            </li>
          ))}
          <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
            <button
              className="page-link"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              Suivant
            </button>
          </li>
        </ul>
      </div>
    );
  };

  return (
    <Container fluid className="py-4">
      {success && (
        <Alert variant="success" onClose={() => setSuccess(null)} dismissible>
          {success}
        </Alert>
      )}

      {error && (
        <Alert variant="danger" onClose={() => setError(null)} dismissible>
          {error}
        </Alert>
      )}

      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="mb-0">Gestion du contenu</h4>
      </div>

      <Card className="shadow-sm mb-4">
        <Card.Header>
          <Nav variant="tabs" className="card-header-tabs">
            <Nav.Item>
              <Nav.Link
                active={activeTab === 'courses'}
                onClick={() => {
                  setActiveTab('courses');
                  navigate('/admin/courses');
                }}
              >
                Cours
              </Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link
                active={activeTab === 'tests'}
                onClick={() => {
                  setActiveTab('tests');
                  navigate('/admin/tests');
                }}
              >
                Tests
              </Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link
                active={activeTab === 'formations'}
                onClick={() => {
                  setActiveTab('formations');
                  navigate('/admin/formations');
                }}
              >
                Formations
              </Nav.Link>
            </Nav.Item>
          </Nav>
        </Card.Header>
        <Card.Body>
          <Form onSubmit={handleSearch} className="mb-4">
            <Row>
              <Col md={8}>
                <Form.Group className="mb-0">
                  <div className="input-group">
                    <Form.Control
                      type="text"
                      placeholder={`Rechercher un ${getSingularContentTypeName()}...`}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <Button variant="primary" type="submit">
                      <Search size={16} />
                    </Button>
                  </div>
                </Form.Group>
              </Col>
            </Row>
          </Form>

          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" role="status">
                <span className="visually-hidden">Chargement...</span>
              </Spinner>
            </div>
          ) : (
            renderContentTable()
          )}

          {renderPagination()}
        </Card.Body>
      </Card>

      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Confirmer la suppression</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Êtes-vous sûr de vouloir supprimer {itemToDelete?.title} ? Cette action est irréversible.
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Annuler
          </Button>
          <Button variant="danger" onClick={handleDeleteConfirm}>
            Supprimer
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Detail Modal */}
      <Modal
        show={showDetailModal}
        onHide={() => setShowDetailModal(false)}
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>{selectedItem?.title}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedItem && (
            <div>
              <p><strong>Description:</strong> {selectedItem.description}</p>
              <p><strong>Catégorie:</strong> {selectedItem.category}</p>
              <p><strong>Prix:</strong> {selectedItem.price} €</p>
              <p><strong>Enseignant:</strong> {selectedItem.teacher?.fullName || 'N/A'}</p>
              <p><strong>Date de création:</strong> {new Date(selectedItem.createdAt).toLocaleDateString()}</p>

              {activeTab === 'courses' && selectedItem.sections && (
                <div>
                  <h5 className="mt-4">Sections</h5>
                  {selectedItem.sections.map((section, index) => (
                    <div key={index} className="mb-3">
                      <h6>{section.title}</h6>
                      <p>{section.description}</p>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'tests' && selectedItem.questions && (
                <div>
                  <h5 className="mt-4">Questions</h5>
                  {selectedItem.questions.map((question, index) => (
                    <div key={index} className="mb-3">
                      <h6>Question {index + 1}: {question.text}</h6>
                      <ul>
                        {question.answers.map((answer, ansIndex) => (
                          <li key={ansIndex}>
                            {answer.text} {ansIndex === question.correctAnswer && <Badge bg="success">Correcte</Badge>}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'formations' && selectedItem.modules && (
                <div>
                  <h5 className="mt-4">Modules</h5>
                  {selectedItem.modules.map((module, index) => (
                    <div key={index} className="mb-3">
                      <h6>{module.title}</h6>
                      <p>{module.description}</p>
                      <p><strong>Durée:</strong> {module.duration}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDetailModal(false)}>
            Fermer
          </Button>
          <Button
            variant="danger"
            onClick={() => {
              setShowDetailModal(false);
              handleDeleteClick(selectedItem);
            }}
          >
            Supprimer
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default ContentManagement;
