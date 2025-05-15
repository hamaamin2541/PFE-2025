import React, { useState, useEffect } from 'react';
import { Card, Button, Container, Row, Col, Form, Modal, Spinner, Alert, Badge, ProgressBar } from 'react-bootstrap';
import { motion } from 'framer-motion';
import { Play, BookOpen, Clock, Award } from 'lucide-react';
import axios from 'axios';
import { API_BASE_URL } from '../../config/api';
import { useNavigate } from 'react-router-dom';
import './MesCours.css';

const MesCours = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Toutes');
  const [currentPage, setCurrentPage] = useState(1);
  const [enrollments, setEnrollments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [categories, setCategories] = useState([]);
  const navigate = useNavigate();
  const coursesPerPage = 6;

  useEffect(() => {
    const fetchEnrollments = async () => {
      try {
        setIsLoading(true);
        const token = localStorage.getItem('token');

        if (!token) {
          setError('Vous devez être connecté pour accéder à vos cours');
          setIsLoading(false);
          return;
        }

        const response = await axios.get(`${API_BASE_URL}/api/enrollments`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.data.success) {
          setEnrollments(response.data.data);

          // Extract unique categories from all item types
          const uniqueCategories = [...new Set(response.data.data.map(enrollment => {
            if (enrollment.itemType === 'course' && enrollment.course) {
              return enrollment.course.category;
            } else if (enrollment.itemType === 'formation' && enrollment.formation) {
              return enrollment.formation.category;
            } else if (enrollment.itemType === 'test' && enrollment.test) {
              return enrollment.test.category;
            }
            return null;
          }).filter(category => category !== null))];

          setCategories(uniqueCategories);
        } else {
          setError('Erreur lors du chargement de vos cours');
        }
      } catch (err) {
        console.error('Error fetching enrollments:', err);
        setError('Erreur lors du chargement de vos cours');
      } finally {
        setIsLoading(false);
      }
    };

    fetchEnrollments();
  }, []);

  // Filter enrollments based on search and category
  const filteredEnrollments = enrollments.filter(enrollment => {
    // Get the appropriate item based on type
    const item =
      enrollment.itemType === 'course' ? enrollment.course :
      enrollment.itemType === 'formation' ? enrollment.formation :
      enrollment.test;

    // Skip if item is null or undefined
    if (!item) return false;

    // Check category match
    const categoryMatch =
      selectedCategory === 'Toutes' ||
      item.category === selectedCategory;

    // Check search term match
    const searchMatch =
      item.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchTerm.toLowerCase());

    return categoryMatch && searchMatch;
  });

  // Pagination
  const indexOfLastCourse = currentPage * coursesPerPage;
  const indexOfFirstCourse = indexOfLastCourse - coursesPerPage;
  const currentEnrollments = filteredEnrollments.slice(indexOfFirstCourse, indexOfLastCourse);
  const totalPages = Math.ceil(filteredEnrollments.length / coursesPerPage);

  const handleCategoryChange = (e) => {
    setSelectedCategory(e.target.value);
    setCurrentPage(1); // Reset to first page after category change
  };

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const handleContinueCourse = (enrollment) => {
    // Navigate to the appropriate route based on item type
    if (enrollment.itemType === 'course') {
      navigate(`/course/${enrollment._id}`);
    } else if (enrollment.itemType === 'formation') {
      navigate(`/formation/${enrollment._id}`);
    } else if (enrollment.itemType === 'test') {
      navigate(`/test/${enrollment._id}`);
    }
  };

  return (
    <Container className="py-5">
      <h1 className="text-center mb-4 fw-bold">Mes Cours</h1>

      {isLoading ? (
        <div className="text-center my-5">
          <Spinner animation="border" variant="primary" />
          <p className="mt-3">Chargement de vos cours...</p>
        </div>
      ) : error ? (
        <Alert variant="danger" className="my-4">
          {error}
        </Alert>
      ) : enrollments.length === 0 ? (
        <div className="text-center my-5">
          <div className="mb-4">
            <BookOpen size={48} className="text-muted" />
          </div>
          <h4>Vous n'êtes inscrit à aucun cours pour le moment</h4>
          <p className="text-muted">Explorez notre catalogue de cours et commencez votre apprentissage dès aujourd'hui!</p>
          <Button
            variant="primary"
            className="mt-3"
            onClick={() => navigate('/notre-contenu')}
          >
            Découvrir les cours
          </Button>
        </div>
      ) : (
        <>
          {/* 🔎 Search + Category Filter */}
          <Row className="mb-5">
            <Col md={6}>
              <Form.Control
                type="text"
                placeholder="Rechercher un cours..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </Col>
            <Col md={6}>
              <Form.Select value={selectedCategory} onChange={handleCategoryChange}>
                <option value="Toutes">Toutes les catégories</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </Form.Select>
            </Col>
          </Row>

          {/* 🔥 Cours affichés */}
          <Row className="g-4">
            {currentEnrollments.length > 0 ? (
              currentEnrollments.map((enrollment, index) => (
                <Col key={enrollment._id} xs={12} md={6} lg={4}>
                  <motion.div
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: index * 0.2 }}
                  >
                    <Card className="h-100 shadow-sm border-0 card-hover">
                      {(() => {
                        // Get the appropriate cover image based on item type
                        const coverImage =
                          enrollment.itemType === 'course' ? enrollment.course?.coverImage :
                          enrollment.itemType === 'formation' ? enrollment.formation?.coverImage :
                          enrollment.test?.coverImage;

                        return coverImage ? (
                          <Card.Img
                            variant="top"
                            src={`${API_BASE_URL}/${coverImage}`}
                            style={{ height: '180px', objectFit: 'cover' }}
                            onError={(e) => {
                              const itemTypeText =
                                enrollment.itemType === 'course' ? 'Course' :
                                enrollment.itemType === 'formation' ? 'Formation' : 'Test';
                              e.target.src = `https://placehold.co/600x400?text=${itemTypeText}+Image`;
                            }}
                          />
                        ) : (
                          <div
                            className="bg-light d-flex align-items-center justify-content-center"
                            style={{ height: '180px' }}
                          >
                            <BookOpen size={48} className="text-muted" />
                          </div>
                        );
                      })()}
                      <Card.Body className="d-flex flex-column">
                        <div className="d-flex justify-content-between mb-2">
                          <div>
                            <Badge
                              bg={
                                enrollment.itemType === 'course' ? 'primary' :
                                enrollment.itemType === 'formation' ? 'warning' :
                                'info'
                              }
                              className="me-1"
                            >
                              {enrollment.itemType === 'course' ? 'Cours' :
                               enrollment.itemType === 'formation' ? 'Formation' :
                               'Test'}
                            </Badge>
                            {enrollment.itemType === 'course' && enrollment.course?.category && (
                              <Badge bg="secondary">{enrollment.course.category}</Badge>
                            )}
                            {enrollment.itemType === 'formation' && enrollment.formation?.category && (
                              <Badge bg="secondary">{enrollment.formation.category}</Badge>
                            )}
                            {enrollment.itemType === 'test' && enrollment.test?.category && (
                              <Badge bg="secondary">{enrollment.test.category}</Badge>
                            )}
                          </div>
                          <Badge bg={enrollment.status === 'completed' ? 'success' : 'info'}>
                            {enrollment.status === 'completed' ? 'Terminé' : 'En cours'}
                          </Badge>
                        </div>

                        <Card.Title>
                          {enrollment.itemType === 'course' && enrollment.course?.title}
                          {enrollment.itemType === 'formation' && enrollment.formation?.title}
                          {enrollment.itemType === 'test' && enrollment.test?.title}
                        </Card.Title>
                        <Card.Text className="flex-grow-1 small text-muted">
                          {enrollment.itemType === 'course' && enrollment.course?.description && (
                            enrollment.course.description.length > 100
                              ? enrollment.course.description.substring(0, 100) + '...'
                              : enrollment.course.description
                          )}
                          {enrollment.itemType === 'formation' && enrollment.formation?.description && (
                            enrollment.formation.description.length > 100
                              ? enrollment.formation.description.substring(0, 100) + '...'
                              : enrollment.formation.description
                          )}
                          {enrollment.itemType === 'test' && enrollment.test?.description && (
                            enrollment.test.description.length > 100
                              ? enrollment.test.description.substring(0, 100) + '...'
                              : enrollment.test.description
                          )}
                        </Card.Text>

                        <div className="mb-3">
                          <small className="text-muted d-flex align-items-center">
                            <Clock size={14} className="me-1" />
                            Dernière activité: {new Date(enrollment.lastAccessDate).toLocaleDateString()}
                          </small>
                        </div>

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
                          className="mt-auto btn-animated d-flex align-items-center justify-content-center"
                          onClick={() => handleContinueCourse(enrollment)}
                        >
                          {enrollment.status === 'completed' ? (
                            <>
                              <Award size={16} className="me-2" />
                              Voir le certificat
                            </>
                          ) : (
                            <>
                              <Play size={16} className="me-2" />
                              {enrollment.itemType === 'course' ? 'Continuer le cours' :
                               enrollment.itemType === 'formation' ? 'Continuer la formation' :
                               'Passer le test'}
                            </>
                          )}
                        </Button>
                      </Card.Body>
                    </Card>
                  </motion.div>
                </Col>
              ))
            ) : (
              <Col xs={12}>
                <p className="text-center">Aucun cours trouvé pour cette recherche 😕</p>
              </Col>
            )}
          </Row>

          {/* 🔥 Pagination */}
          {totalPages > 1 && (
            <div className="d-flex justify-content-center mt-4">
              {[...Array(totalPages)].map((_, idx) => (
                <Button
                  key={idx}
                  variant={currentPage === idx + 1 ? 'primary' : 'outline-primary'}
                  onClick={() => handlePageChange(idx + 1)}
                  className="mx-1"
                >
                  {idx + 1}
                </Button>
              ))}
            </div>
          )}
        </>
      )}
    </Container>
  );
};

export default MesCours;
