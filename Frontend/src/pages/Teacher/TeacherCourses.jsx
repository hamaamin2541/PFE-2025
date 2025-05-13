import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Button, Row, Col, Badge, Dropdown, Modal, Alert } from 'react-bootstrap';
import { BookOpen, MoreVertical, Edit, Trash2 } from 'lucide-react';
import axios from 'axios';
import { API_BASE_URL } from '../../config/api';

export const TeacherCourses = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [courseToDelete, setCourseToDelete] = useState(null);
  const [deleteError, setDeleteError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${API_BASE_URL}/api/courses/teacher-courses`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        setCourses(response.data.data);
      } catch (error) {
        console.error('Error fetching courses:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, []);

  const handleDelete = async (courseId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.delete(`${API_BASE_URL}/api/courses/${courseId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.data.success) {
        setCourses(prevCourses => prevCourses.filter(course => course._id !== courseId));
        setShowDeleteModal(false);
        setDeleteError(null);
      } else {
        setDeleteError(response.data.message || 'Erreur lors de la suppression du cours');
      }
    } catch (error) {
      console.error('Error deleting course:', error);
      setDeleteError(
        error.response?.data?.message ||
        'Une erreur est survenue lors de la suppression du cours'
      );
    }
  };

  const handleEdit = (courseId) => {
    navigate(`/dashboard-teacher/edit-course/${courseId}`);
  };

  return (
    <div className="teacher-courses">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4>Mes Cours Publiés</h4>
      </div>

      <Row>
        {loading ? (
          <div>Chargement...</div>
        ) : courses.length === 0 ? (
          <Col xs={12}>
            <Card className="text-center p-5">
              <BookOpen size={48} className="mx-auto text-muted mb-3" />
              <h5>Aucun cours publié</h5>
              <p className="text-muted">Commencez par créer votre premier cours</p>
            </Card>
          </Col>
        ) : (
          courses.map(course => (
            <Col md={4} key={course._id} className="mb-4">
              <Card className="h-100">
                <div className="position-relative">
                  {course.coverImage && (
                    <Card.Img
                      variant="top"
                      src={`${API_BASE_URL}/${course.coverImage}`}
                      style={{ height: '200px', objectFit: 'cover' }}
                    />
                  )}
                  <Dropdown className="position-absolute top-0 end-0 m-2">
                    <Dropdown.Toggle variant="light" size="sm" className="rounded-circle">
                      <MoreVertical size={16} />
                    </Dropdown.Toggle>
                    <Dropdown.Menu>
                      <Dropdown.Item onClick={() => handleEdit(course._id)}>
                        <Edit size={16} className="me-2" />
                        Modifier
                      </Dropdown.Item>
                      <Dropdown.Item
                        className="text-danger"
                        onClick={() => {
                          setCourseToDelete(course);
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
                  <Card.Title>{course.title}</Card.Title>
                  <Card.Text>{course.description}</Card.Text>
                  <div className="d-flex justify-content-between align-items-center">
                    <Badge bg="info">{course.category}</Badge>
                    <Badge bg="secondary">{course.language}</Badge>
                  </div>
                  <div className="mt-3">
                    <small className="text-muted">Niveau: {course.level}</small>
                    <div className="fw-bold">{course.price}€</div>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          ))
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
          Êtes-vous sûr de vouloir supprimer le cours "{courseToDelete?.title}" ?
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
            onClick={() => handleDelete(courseToDelete?._id)}
          >
            Supprimer
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default TeacherCourses;