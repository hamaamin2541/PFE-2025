import './UserManagement.css';
import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Button, Form, InputGroup, Modal, Badge, Pagination, Spinner, Alert } from 'react-bootstrap';
import { Search, Edit, Trash2, Eye, UserPlus, Filter } from 'lucide-react';
import axios from 'axios';
import { API_BASE_URL } from '../../config/api';
import { Link } from 'react-router-dom';


const UserManagement = ({ newUser = false }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    role: '',
    specialty: '',
    bio: '',
    phone: ''
  });
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    fetchUsers();
  }, [currentPage, searchTerm, roleFilter]);

  // Show new user modal if newUser prop is true
  useEffect(() => {
    if (newUser) {
      setShowUserModal(true);
      setEditMode(true);
      setFormData({
        fullName: '',
        email: '',
        role: 'student',
        specialty: '',
        bio: '',
        phone: ''
      });
    }
  }, [newUser]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      let url = `${API_BASE_URL}/api/admin/users?page=${currentPage}`;
      if (searchTerm) url += `&search=${searchTerm}`;
      if (roleFilter) url += `&role=${roleFilter}`;

      const response = await axios.get(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.data.success) {
        setUsers(response.data.data);
        setTotalPages(response.data.pagination.pages);
      } else {
        setError('Erreur lors de la récupération des utilisateurs');
      }
    } catch (err) {
      console.error('Error fetching users:', err);
      setError(err.response?.data?.message || 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchUsers();
  };

  const handleRoleFilterChange = (e) => {
    setRoleFilter(e.target.value);
    setCurrentPage(1);
  };

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const handleShowDeleteModal = (user) => {
    setUserToDelete(user);
    setShowDeleteModal(true);
  };

  const handleCloseDeleteModal = () => {
    setShowDeleteModal(false);
    setUserToDelete(null);
  };

  const handleDeleteUser = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.delete(`${API_BASE_URL}/api/admin/users/${userToDelete._id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.data.success) {
        setSuccessMessage('Utilisateur supprimé avec succès');
        fetchUsers();
      }
    } catch (err) {
      console.error('Error deleting user:', err);
      setError(err.response?.data?.message || 'Une erreur est survenue lors de la suppression');
    } finally {
      handleCloseDeleteModal();
    }
  };

  const handleShowUserModal = async (user, edit = false) => {
    setSelectedUser(user);
    setEditMode(edit);

    if (edit) {
      setFormData({
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        specialty: user.specialty || '',
        bio: user.bio || '',
        phone: user.phone || ''
      });
    }

    setShowUserModal(true);
  };

  const handleCloseUserModal = () => {
    setShowUserModal(false);
    setSelectedUser(null);
    setEditMode(false);
    setFormData({
      fullName: '',
      email: '',
      role: '',
      specialty: '',
      bio: '',
      phone: ''
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();

    try {
      const token = localStorage.getItem('token');

      // If we have a selected user, update it, otherwise create a new one
      if (selectedUser) {
        const response = await axios.put(`${API_BASE_URL}/api/admin/users/${selectedUser._id}`, formData, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.data.success) {
          setSuccessMessage('Utilisateur mis à jour avec succès');
          fetchUsers();
          handleCloseUserModal();
        }
      } else {
        // Create new user
        const response = await axios.post(`${API_BASE_URL}/api/auth/add_newuser`, {
          ...formData,
          password: 'ChangeMe123!' // Default password that user will need to change
        }, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.data.success) {
          setSuccessMessage('Utilisateur créé avec succès');
          fetchUsers();
          handleCloseUserModal();
        }
      }
    } catch (err) {
      console.error('Error updating/creating user:', err);
      setError(err.response?.data?.message || 'Une erreur est survenue lors de l\'opération');
    }
  };

  // Pagination items
  const paginationItems = [];
  for (let number = 1; number <= totalPages; number++) {
    paginationItems.push(
      <Pagination.Item
        key={number}
        active={number === currentPage}
        onClick={() => handlePageChange(number)}
      >
        {number}
      </Pagination.Item>
    );
  }

  return (
    <Container fluid className="py-4">
      <Card className="user-management-card shadow mb-4">
        <Card.Header className="py-3">
          <h6 className="card-title">Gestion des utilisateurs</h6>
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              setShowUserModal(true);
              setEditMode(true);
              setFormData({
                fullName: '',
                email: '',
                role: 'student',
                specialty: '',
                bio: '',
                phone: ''
              });
            }}
          >
            <UserPlus size={16} className="me-1" />
            Ajouter un utilisateur
          </Button>
        </Card.Header>
        <Card.Body>
          {successMessage && (
            <Alert variant="success" onClose={() => setSuccessMessage('')} dismissible>
              {successMessage}
            </Alert>
          )}

          {error && (
            <Alert variant="danger" onClose={() => setError(null)} dismissible>
              {error}
            </Alert>
          )}

          <Row className="search-filter-section">
            <Col md={6}>
              <Form onSubmit={handleSearch}>
                <InputGroup>
                 <div className="d-flex align-items-center">
                  <Button variant="primary" type="submit" className="search-btn me-2">
                    <Search size={16} />
                  </Button>
                  <Form.Control
                    className="search-input"
                    placeholder="Rechercher par nom ou email"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>                 
                </InputGroup>
              </Form>
            </Col>
            <Col md={6}>
              <Form.Group className="position-relative">
    <InputGroup className="filter-group">
      <InputGroup.Text className="filter-icon-wrapper bg-primary text-white border-0">
        <Filter size={18} strokeWidth={2} />
      </InputGroup.Text>
      <Form.Select
        className="form-select ps-4 border-start-0"
        value={roleFilter}
        onChange={handleRoleFilterChange}
      >
        <option value="">Tous les rôles</option>
        <option value="student">Étudiants</option>
        <option value="teacher">Enseignants</option>
        <option value="admin">Administrateurs</option>
      </Form.Select>
    </InputGroup>
  </Form.Group>
            </Col>
          </Row>

          {loading ? (
            <div className="text-center py-4">
              <Spinner animation="border" role="status">
                <span className="visually-hidden">Chargement...</span>
              </Spinner>
            </div>
          ) : (
            <>
              <Table responsive hover className="users-table">
                <thead>
                  <tr>
                    <th>Nom</th>
                    <th>Email</th>
                    <th>Rôle</th>
                    <th>Date d'inscription</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.length > 0 ? (
                    users.map((user) => (
                      <tr key={user._id}>
                        <td>{user.fullName}</td>
                        <td>{user.email}</td>
                        <td>
                          <span className={`role-badge ${user.role}`}>
                            <span>{user.role}</span>
                          </span>
                        </td>
                        <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                        <td>
                          <Button
                            variant="info"
                            className="action-btn"
                            onClick={() => handleShowUserModal(user)}
                          >
                            <Eye />
                          </Button>
                          <Button
                            variant="warning"
                            className="action-btn"
                            onClick={() => handleShowUserModal(user, true)}
                          >
                            <Edit />
                          </Button>
                          <Button
                            variant="danger"
                            className="action-btn"
                            onClick={() => handleShowDeleteModal(user)}
                          >
                            <Trash2 />
                          </Button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="text-center">
                        Aucun utilisateur trouvé
                      </td>
                    </tr>
                  )}
                </tbody>
              </Table>

              <div className="d-flex justify-content-center mt-4">
                <Pagination>
                  <Pagination.First onClick={() => handlePageChange(1)} disabled={currentPage === 1} />
                  <Pagination.Prev onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} />
                  {paginationItems}
                  <Pagination.Next onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages} />
                  <Pagination.Last onClick={() => handlePageChange(totalPages)} disabled={currentPage === totalPages} />
                </Pagination>
              </div>
            </>
          )}
        </Card.Body>
      </Card>

      {/* Delete Modal */}
      <Modal show={showDeleteModal} onHide={handleCloseDeleteModal}>
        <Modal.Header closeButton>
          <Modal.Title>Confirmer la suppression</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {userToDelete && (
            <p>
              Êtes-vous sûr de vouloir supprimer l'utilisateur <strong>{userToDelete.fullName}</strong> ?
              Cette action est irréversible.
            </p>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseDeleteModal}>
            Annuler
          </Button>
          <Button variant="danger" onClick={handleDeleteUser}>
            Supprimer
          </Button>
        </Modal.Footer>
      </Modal>

      {/* User Modal */}
      <Modal 
        show={showUserModal} 
        onHide={handleCloseUserModal} 
        size="lg" 
        className="user-modal"
        animation={true}
        backdrop="static"
        keyboard={false}
      >
        <Modal.Header closeButton>
          <Modal.Title>
            {editMode
              ? (selectedUser ? 'Modifier l\'utilisateur' : 'Ajouter un nouvel utilisateur')
              : 'Détails de l\'utilisateur'
            }
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {(selectedUser || editMode) && (
            editMode ? (
              <Form onSubmit={handleUpdateUser}>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Nom complet</Form.Label>
                      <Form.Control
                        type="text"
                        name="fullName"
                        value={formData.fullName}
                        onChange={handleInputChange}
                        required
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Email</Form.Label>
                      <Form.Control
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Rôle</Form.Label>
                      <Form.Select
                        name="role"
                        value={formData.role}
                        onChange={handleInputChange}
                        required
                      >
                        <option value="student">Étudiant</option>
                        <option value="teacher">Enseignant</option>
                        <option value="admin">Administrateur</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Téléphone</Form.Label>
                      <Form.Control
                        type="text"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Form.Group className="mb-3">
                  <Form.Label>Spécialité</Form.Label>
                  <Form.Control
                    type="text"
                    name="specialty"
                    value={formData.specialty}
                    onChange={handleInputChange}
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Biographie</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    name="bio"
                    value={formData.bio}
                    onChange={handleInputChange}
                  />
                </Form.Group>

                <div className="d-flex justify-content-end">
                  <Button className='btn-danger me-2' onClick={handleCloseUserModal}>
                    Annuler
                  </Button>
                  <Button className='btn-success' type="submit">
                    Enregistrer
                  </Button>
                </div>
              </Form>
            ) : (
              <div className="user-details">
                <Row>
                  <Col md={4} className="text-center">
                    <div className="user-avatar-container mb-3">
                      {selectedUser.profileImage ? (
                        <img
                          src={`${API_BASE_URL}/${selectedUser.profileImage}`}
                          alt={selectedUser.fullName}
                          className="img-fluid rounded-circle user-avatar"
                        />
                      ) : (
                        <div className="avatar-placeholder">
                          <span>{selectedUser.fullName.charAt(0).toUpperCase()}</span>
                        </div>
                      )}
                      <Badge className={`role-badge ${selectedUser.role} mt-2`}>
                        {selectedUser.role}
                      </Badge>
                    </div>
                  </Col>
                  <Col md={8}>
                    <h4 className="user-name mb-2">{selectedUser.fullName}</h4>
                    <p className="user-email text-muted mb-3">{selectedUser.email}</p>

                    {selectedUser.phone && (
                      <div className="user-info-item">
                        <strong>Téléphone:</strong> {selectedUser.phone}
                      </div>
                    )}

                    {selectedUser.specialty && (
                      <div className="user-info-item">
                        <strong>Spécialité:</strong> {selectedUser.specialty}
                      </div>
                    )}

                    <div className="user-info-item">
                      <strong>Date d'inscription:</strong>{' '}
                      {new Date(selectedUser.createdAt).toLocaleDateString()}
                    </div>

                    {selectedUser.bio && (
                      <div className="user-bio mt-4">
                        <h5 className="bio-title">Biographie</h5>
                        <p className="bio-text">{selectedUser.bio}</p>
                      </div>
                    )}
                  </Col>
                </Row>
              </div>
            )
          )}
        </Modal.Body>
        {!editMode && (
          <Modal.Footer>
            <Button variant="secondary" onClick={handleCloseUserModal}>
              Fermer
            </Button>
            <Button
              variant="warning"
              onClick={() => setEditMode(true)}
            >
              <Edit size={16} className="me-1" />
              Modifier
            </Button>
          </Modal.Footer>
        )}
      </Modal>
    </Container>
  );
};

export default UserManagement;
