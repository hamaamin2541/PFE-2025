import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Button, Form, InputGroup, Modal, Badge, Pagination, Spinner, Alert } from 'react-bootstrap';
import { Search, Filter, Eye, Check, X, Trash2, Star, Calendar, User } from 'lucide-react';
import axios from 'axios';
import { API_BASE_URL } from '../../config/api';
import './AdminStyles.css';

const TestimonialManagement = () => {
  const [testimonials, setTestimonials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showTestimonialModal, setShowTestimonialModal] = useState(false);
  const [selectedTestimonial, setSelectedTestimonial] = useState(null);

  useEffect(() => {
    fetchTestimonials();
  }, [statusFilter]);

  const fetchTestimonials = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await axios.get(`${API_BASE_URL}/api/testimonials/admin`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.data.success) {
        let filteredTestimonials = response.data.data;
        
        // Apply status filter if set
        if (statusFilter === 'approved') {
          filteredTestimonials = filteredTestimonials.filter(t => t.approved);
        } else if (statusFilter === 'pending') {
          filteredTestimonials = filteredTestimonials.filter(t => !t.approved);
        }
        
        setTestimonials(filteredTestimonials);
      } else {
        setError('Erreur lors de la récupération des témoignages');
      }
    } catch (err) {
      console.error('Error fetching testimonials:', err);
      setError(err.response?.data?.message || 'Une erreur est survenue lors de la récupération des témoignages');
    } finally {
      setLoading(false);
    }
  };

  const handleShowTestimonialModal = (testimonial) => {
    setSelectedTestimonial(testimonial);
    setShowTestimonialModal(true);
  };

  const handleCloseTestimonialModal = () => {
    setShowTestimonialModal(false);
    setSelectedTestimonial(null);
  };

  const handleStatusChange = async (id, approved) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(
        `${API_BASE_URL}/api/testimonials/admin/${id}`,
        { approved },
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        setSuccessMessage(`Témoignage ${approved ? 'approuvé' : 'rejeté'} avec succès`);
        
        // Update the testimonial in the state
        setTestimonials(prevTestimonials => 
          prevTestimonials.map(t => 
            t._id === id ? { ...t, approved } : t
          )
        );
        
        // Clear success message after 3 seconds
        setTimeout(() => {
          setSuccessMessage('');
        }, 3000);
      }
    } catch (err) {
      console.error('Error updating testimonial status:', err);
      setError(err.response?.data?.message || 'Une erreur est survenue lors de la mise à jour du statut');
      
      // Clear error message after 3 seconds
      setTimeout(() => {
        setError(null);
      }, 3000);
    }
  };

  const handleDeleteTestimonial = async (id) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce témoignage ?')) {
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      const response = await axios.delete(
        `${API_BASE_URL}/api/testimonials/admin/${id}`,
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        setSuccessMessage('Témoignage supprimé avec succès');
        
        // Remove the testimonial from the state
        setTestimonials(prevTestimonials => 
          prevTestimonials.filter(t => t._id !== id)
        );
        
        // Close modal if open
        if (selectedTestimonial && selectedTestimonial._id === id) {
          handleCloseTestimonialModal();
        }
        
        // Clear success message after 3 seconds
        setTimeout(() => {
          setSuccessMessage('');
        }, 3000);
      }
    } catch (err) {
      console.error('Error deleting testimonial:', err);
      setError(err.response?.data?.message || 'Une erreur est survenue lors de la suppression du témoignage');
      
      // Clear error message after 3 seconds
      setTimeout(() => {
        setError(null);
      }, 3000);
    }
  };

  // Filter testimonials based on search term
  const filteredTestimonials = testimonials.filter(testimonial => 
    testimonial.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    testimonial.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
    testimonial.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Render stars for rating
  const renderStars = (rating) => {
    return Array(5).fill(0).map((_, i) => (
      <Star 
        key={i} 
        size={16} 
        fill={i < rating ? "#FFD700" : "none"} 
        stroke={i < rating ? "#FFD700" : "#6c757d"}
      />
    ));
  };

  return (
    <Container fluid className="py-4">
      <Card className="shadow mb-4">
        <Card.Header className="py-3 d-flex flex-row align-items-center justify-content-between">
          <h6 className="m-0 font-weight-bold text-primary">Gestion des témoignages</h6>
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

          <div className="mb-4 d-flex flex-column flex-md-row justify-content-between">
            <div className="mb-3 mb-md-0">
              <InputGroup>
                <InputGroup.Text>
                  <Search size={16} />
                </InputGroup.Text>
                <Form.Control
                  placeholder="Rechercher un témoignage..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </InputGroup>
            </div>
            <div className="d-flex">
              <Form.Select
                className="me-2"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{ maxWidth: '200px' }}
              >
                <option value="">Tous les statuts</option>
                <option value="approved">Approuvés</option>
                <option value="pending">En attente</option>
              </Form.Select>
              <Button variant="outline-secondary" onClick={() => fetchTestimonials()}>
                <Filter size={16} className="me-1" />
                Filtrer
              </Button>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-4">
              <Spinner animation="border" role="status">
                <span className="visually-hidden">Chargement...</span>
              </Spinner>
            </div>
          ) : (
            <>
              <div className="table-responsive">
                <Table hover>
                  <thead>
                    <tr>
                      <th>Nom</th>
                      <th>Rôle</th>
                      <th>Message</th>
                      <th>Note</th>
                      <th>Statut</th>
                      <th>Date</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTestimonials.length > 0 ? (
                      filteredTestimonials.map((testimonial) => (
                        <tr key={testimonial._id}>
                          <td>{testimonial.name}</td>
                          <td>{testimonial.role}</td>
                          <td>
                            {testimonial.message.length > 50
                              ? `${testimonial.message.substring(0, 50)}...`
                              : testimonial.message}
                          </td>
                          <td className="d-flex">
                            {renderStars(testimonial.rating)}
                          </td>
                          <td>
                            <Badge bg={testimonial.approved ? 'success' : 'warning'}>
                              {testimonial.approved ? 'Approuvé' : 'En attente'}
                            </Badge>
                          </td>
                          <td>{new Date(testimonial.createdAt).toLocaleDateString()}</td>
                          <td>
                            <Button
                              variant="info"
                              size="sm"
                              className="me-1"
                              onClick={() => handleShowTestimonialModal(testimonial)}
                            >
                              <Eye size={16} />
                            </Button>
                            {!testimonial.approved && (
                              <Button
                                variant="success"
                                size="sm"
                                className="me-1"
                                onClick={() => handleStatusChange(testimonial._id, true)}
                              >
                                <Check size={16} />
                              </Button>
                            )}
                            {testimonial.approved && (
                              <Button
                                variant="warning"
                                size="sm"
                                className="me-1"
                                onClick={() => handleStatusChange(testimonial._id, false)}
                              >
                                <X size={16} />
                              </Button>
                            )}
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() => handleDeleteTestimonial(testimonial._id)}
                            >
                              <Trash2 size={16} />
                            </Button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="7" className="text-center">
                          Aucun témoignage trouvé
                        </td>
                      </tr>
                    )}
                  </tbody>
                </Table>
              </div>
            </>
          )}
        </Card.Body>
      </Card>

      {/* Modal pour afficher les détails d'un témoignage */}
      <Modal show={showTestimonialModal} onHide={handleCloseTestimonialModal} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Détails du témoignage</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedTestimonial && (
            <div>
              <div className="testimonial-detail-header mb-4">
                <div className="d-flex align-items-center mb-3">
                  <div className="avatar-placeholder me-3">
                    {selectedTestimonial.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h5 className="mb-0">{selectedTestimonial.name}</h5>
                    <p className="text-muted mb-0">{selectedTestimonial.role}</p>
                  </div>
                </div>
                <div className="d-flex align-items-center mb-3">
                  <div className="me-3 d-flex align-items-center">
                    <User size={16} className="me-1" />
                    <span>ID: {selectedTestimonial._id}</span>
                  </div>
                  <div className="me-3 d-flex align-items-center">
                    <Calendar size={16} className="me-1" />
                    <span>Date: {new Date(selectedTestimonial.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="d-flex align-items-center">
                    <Badge bg={selectedTestimonial.approved ? 'success' : 'warning'}>
                      {selectedTestimonial.approved ? 'Approuvé' : 'En attente'}
                    </Badge>
                  </div>
                </div>
                <div className="d-flex align-items-center">
                  <div className="me-2">Note:</div>
                  <div className="d-flex">
                    {renderStars(selectedTestimonial.rating)}
                  </div>
                </div>
              </div>
              <div className="testimonial-detail-content p-3 bg-light rounded">
                <p className="mb-0">{selectedTestimonial.message}</p>
              </div>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          {selectedTestimonial && (
            <>
              {!selectedTestimonial.approved ? (
                <Button 
                  variant="success" 
                  onClick={() => {
                    handleStatusChange(selectedTestimonial._id, true);
                    handleCloseTestimonialModal();
                  }}
                >
                  <Check size={16} className="me-1" />
                  Approuver
                </Button>
              ) : (
                <Button 
                  variant="warning" 
                  onClick={() => {
                    handleStatusChange(selectedTestimonial._id, false);
                    handleCloseTestimonialModal();
                  }}
                >
                  <X size={16} className="me-1" />
                  Rejeter
                </Button>
              )}
              <Button 
                variant="danger" 
                onClick={() => {
                  handleDeleteTestimonial(selectedTestimonial._id);
                }}
              >
                <Trash2 size={16} className="me-1" />
                Supprimer
              </Button>
            </>
          )}
          <Button variant="secondary" onClick={handleCloseTestimonialModal}>
            Fermer
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default TestimonialManagement;
