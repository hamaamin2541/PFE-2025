import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Button, Form, InputGroup, Modal, Badge, Pagination, Spinner, Alert } from 'react-bootstrap';
import { Search, Edit, Trash2, Eye, UserPlus, Filter } from 'lucide-react';
import axios from 'axios';
import { API_BASE_URL } from '../../config/api';
import { Link } from 'react-router-dom';

const UserManagement = () => {
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
      const response = await axios.put(`${API_BASE_URL}/api/admin/users/${selectedUser._id}`, formData, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.data.success) {
        setSuccessMessage('Utilisateur mis à jour avec succès');
        fetchUsers();
        handleCloseUserModal();
      }
    } catch (err) {
      console.error('Error updating user:', err);
      setError(err.response?.data?.message || 'Une erreur est survenue lors de la mise à jour');
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
      <Card className="shadow mb-4">
        <Card.Header className="py-3 d-flex flex-row align-items-center justify-content-between">
          <h6 className="m-0 font-weight-bold text-primary">Gestion des utilisateurs</h6>
          <Button variant="primary" size="sm">
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
          
          <Row className="mb-3">
            <Col md={6}>
              <Form onSubmit={handleSearch}>
                <InputGroup>
                  <Form.Control
                    placeholder="Rechercher par nom ou email"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <Button variant="primary" type="submit">
                    <Search size={16} />
                  </Button>
                </InputGroup>
              </Form>
            </Col>
            <Col md={6}>
              <InputGroup>
                <InputGroup.Text>
                  <Filter size={16} />
                </InputGroup.Text>
                <Form.Select
                  value={roleFilter}
                  onChange={handleRoleFilterChange}
                >
                  <option value="">Tous les rôles</option>
                  <option value="student">Étudiants</option>
                  <option value="teacher">Enseignants</option>
                  <option value="admin">Administrateurs</option>
                </Form.Select>
              </InputGroup>
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
              <Table responsive hover>
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
                          <Badge bg={
                            user.role === 'admin' ? 'danger' : 
                            user.role === 'teacher' ? 'primary' : 
                            'success'
                          }>
                            {user.role}
                          </Badge>
                        </td>
                        <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                        <td>
                          <Button 
                            variant="info" 
                            size="sm" 
                            className="me-1"
                            onClick={() => handleShowUserModal(user)}
                          >
                            <Eye size={16} />
                          </Button>
                          <Button 
                            variant="warning" 
                            size="sm" 
                            className="me-1"
                            onClick={() => handleShowUserModal(user, true)}
                          >
                            <Edit size={16} />
                          </Button>
                          <Button 
                            variant="danger" 
                            size="sm"
                            onClick={() => handleShowDeleteModal(user)}
                          >
                            <Trash2 size={16} />
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
      
      {/* Modal de suppression */}
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
      
      {/* Modal d'affichage/édition d'utilisateur */}
      <Modal show={showUserModal} onHide={handleCloseUserModal} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            {editMode ? 'Modifier l\'utilisateur' : 'Détails de l\'utilisateur'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedUser && (
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
                  <Button variant="secondary" onClick={handleCloseUserModal} className="me-2">
                    Annuler
                  </Button>
                  <Button variant="primary" type="submit">
                    Enregistrer
                  </Button>
                </div>
              </Form>
            ) : (
              <div>
                <Row>
                  <Col md={4}>
                    <div className="text-center mb-3">
                      {selectedUser.profileImage ? (
                        <img
                          src={`${API_BASE_URL}/${selectedUser.profileImage}`}
                          alt={selectedUser.fullName}
                          className="img-fluid rounded-circle"
                          style={{ width: '150px', height: '150px', objectFit: 'cover' }}
                        />
                      ) : (
                        <div
                          className="bg-secondary rounded-circle d-flex align-items-center justify-content-center mx-auto"
                          style={{ width: '150px', height: '150px' }}
                        >
                          <span className="text-white" style={{ fontSize: '3rem' }}>
                            {selectedUser.fullName.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                      <Badge 
                        bg={
                          selectedUser.role === 'admin' ? 'danger' : 
                          selectedUser.role === 'teacher' ? 'primary' : 
                          'success'
                        }
                        className="mt-2"
                      >
                        {selectedUser.role}
                      </Badge>
                    </div>
                  </Col>
                  <Col md={8}>
                    <h4>{selectedUser.fullName}</h4>
                    <p className="text-muted">{selectedUser.email}</p>
                    
                    {selectedUser.phone && (
                      <p><strong>Téléphone:</strong> {selectedUser.phone}</p>
                    )}
                    
                    {selectedUser.specialty && (
                      <p><strong>Spécialité:</strong> {selectedUser.specialty}</p>
                    )}
                    
                    <p><strong>Date d'inscription:</strong> {new Date(selectedUser.createdAt).toLocaleDateString()}</p>
                    
                    {selectedUser.bio && (
                      <>
                        <h5 className="mt-3">Biographie</h5>
                        <p>{selectedUser.bio}</p>
                      </>
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
