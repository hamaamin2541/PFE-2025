import React, { useState, useEffect } from 'react';
import { Container, Card, Table, Button, Badge, Spinner, Form, Row, Col, Alert, Modal } from 'react-bootstrap';
import { Search, Plus, Edit, Trash2, Eye, ArrowLeft, Check, X } from 'lucide-react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../../../config/api';

const FormationManagement = ({ newFormation, viewMode, editMode }) => {
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
  const [formationToDelete, setFormationToDelete] = useState(null);
  const [categories, setCategories] = useState([]);
  const [currentFormation, setCurrentFormation] = useState({
    title: '',
    description: '',
    category: '',
    price: 0,
    duration: '',
    level: 'Débutant',
    language: 'Français',
    modules: []
  });
  
  const { id } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    if (viewMode || editMode) {
      if (id) {
        fetchFormationById(id);
      }
    } else if (newFormation) {
      setLoading(false);
    } else {
      fetchFormations();
    }
    
    // Fetch categories for dropdown
    fetchCategories();
  }, [id, viewMode, editMode, newFormation]);

  const fetchFormations = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${API_BASE_URL}/api/formations?page=${currentPage}&sort=${sortField}&direction=${sortDirection}&search=${searchTerm}`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );

      if (response.data.success) {
        setFormations(response.data.data);
        // If pagination info is available in the response
        if (response.data.pagination) {
          setTotalPages(response.data.pagination.totalPages);
        }
      } else {
        setError('Erreur lors du chargement des formations');
      }
    } catch (err) {
      console.error('Error fetching formations:', err);
      setError('Erreur lors du chargement des formations');
    } finally {
      setLoading(false);
    }
  };

  const fetchFormationById = async (formationId) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${API_BASE_URL}/api/formations/${formationId}`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );

      if (response.data.success) {
        setCurrentFormation(response.data.data);
      } else {
        setError('Erreur lors du chargement de la formation');
      }
    } catch (err) {
      console.error('Error fetching formation:', err);
      setError('Erreur lors du chargement de la formation');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${API_BASE_URL}/api/categories`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );

      if (response.data.success) {
        setCategories(response.data.data);
      }
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchFormations();
  };

  const handleSort = (field) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
    setCurrentPage(1);
    fetchFormations();
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    fetchFormations();
  };

  const handleDeleteClick = (formation) => {
    setFormationToDelete(formation);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.delete(
        `${API_BASE_URL}/api/formations/${formationToDelete._id}`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );

      if (response.data.success) {
        setSuccess('Formation supprimée avec succès');
        setShowDeleteModal(false);
        fetchFormations();
      } else {
        setError('Erreur lors de la suppression de la formation');
      }
    } catch (err) {
      console.error('Error deleting formation:', err);
      setError('Erreur lors de la suppression de la formation');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '80vh' }}>
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Chargement...</span>
        </Spinner>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="mt-4">
        <Alert variant="danger" onClose={() => setError(null)} dismissible>
          {error}
        </Alert>
      </Container>
    );
  }

  // View for listing all formations
  return (
    <Container fluid className="py-4">
      {success && (
        <Alert variant="success" onClose={() => setSuccess(null)} dismissible>
          {success}
        </Alert>
      )}
      
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="mb-0">Gestion des formations</h4>
        <Link to="/admin/formations/new" className="btn btn-primary">
          <Plus size={16} className="me-2" />
          Ajouter une formation
        </Link>
      </div>

      <Card className="shadow-sm mb-4">
        <Card.Body>
          <Form onSubmit={handleSearch} className="mb-4">
            <Row>
              <Col md={8}>
                <Form.Group className="mb-0">
                  <div className="input-group">
                    <Form.Control
                      type="text"
                      placeholder="Rechercher une formation..."
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

          <div className="table-responsive">
            <Table hover className="align-middle">
              <thead>
                <tr>
                  <th onClick={() => handleSort('title')} style={{ cursor: 'pointer' }}>
                    Titre {sortField === 'title' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th onClick={() => handleSort('teacher')} style={{ cursor: 'pointer' }}>
                    Professeur {sortField === 'teacher' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th onClick={() => handleSort('category')} style={{ cursor: 'pointer' }}>
                    Catégorie {sortField === 'category' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th onClick={() => handleSort('price')} style={{ cursor: 'pointer' }}>
                    Prix {sortField === 'price' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th onClick={() => handleSort('level')} style={{ cursor: 'pointer' }}>
                    Niveau {sortField === 'level' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th onClick={() => handleSort('createdAt')} style={{ cursor: 'pointer' }}>
                    Date {sortField === 'createdAt' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {formations.length > 0 ? (
                  formations.map((formation) => (
                    <tr key={formation._id}>
                      <td>{formation.title}</td>
                      <td>{formation.teacher?.fullName || 'N/A'}</td>
                      <td>{formation.category}</td>
                      <td>{formation.price} €</td>
                      <td>{formation.level}</td>
                      <td>{new Date(formation.createdAt).toLocaleDateString()}</td>
                      <td>
                        <div className="d-flex gap-2">
                          <Button variant="outline-primary" size="sm" as={Link} to={`/admin/formations/${formation._id}`}>
                            <Eye size={16} />
                          </Button>
                          <Button variant="outline-secondary" size="sm" as={Link} to={`/admin/formations/edit/${formation._id}`}>
                            <Edit size={16} />
                          </Button>
                          <Button variant="outline-danger" size="sm" onClick={() => handleDeleteClick(formation)}>
                            <Trash2 size={16} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="text-center py-4">
                      Aucune formation trouvée
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="d-flex justify-content-center mt-4">
              <ul className="pagination">
                <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                  <button className="page-link" onClick={() => handlePageChange(currentPage - 1)}>
                    Précédent
                  </button>
                </li>
                {[...Array(totalPages).keys()].map((page) => (
                  <li key={page + 1} className={`page-item ${currentPage === page + 1 ? 'active' : ''}`}>
                    <button className="page-link" onClick={() => handlePageChange(page + 1)}>
                      {page + 1}
                    </button>
                  </li>
                ))}
                <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                  <button className="page-link" onClick={() => handlePageChange(currentPage + 1)}>
                    Suivant
                  </button>
                </li>
              </ul>
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Confirmer la suppression</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Êtes-vous sûr de vouloir supprimer la formation <strong>{formationToDelete?.title}</strong> ?
          Cette action est irréversible.
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
    </Container>
  );
};

export default FormationManagement;
