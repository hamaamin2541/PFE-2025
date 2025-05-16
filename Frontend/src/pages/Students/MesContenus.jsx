// MesContenus.jsx
import React, { useState, useEffect } from 'react';
import { Card, Button, Container, Row, Col, Form, Modal, Spinner, Alert, Badge, ProgressBar, Nav } from 'react-bootstrap';
import { motion } from 'framer-motion';
import { Play, BookOpen, Clock, Award, CheckCircle, Filter, Search, SortAsc, SortDesc } from 'lucide-react';
import axios from 'axios';
import { API_BASE_URL } from '../../config/api';
import { useNavigate } from 'react-router-dom';
import './DashboardStudent.css';


const MesContenus = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Toutes');
  const [selectedStatus, setSelectedStatus] = useState('Tous');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');
  const [activeTab, setActiveTab] = useState('all');
  const [enrollments, setEnrollments] = useState([]);
  const [filteredEnrollments, setFilteredEnrollments] = useState([]);
  const [currentEnrollments, setCurrentEnrollments] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(9);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [categories, setCategories] = useState([]);
  const navigate = useNavigate();

  // Fetch enrollments from API
  useEffect(() => {
    const fetchEnrollments = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');

        if (!token) {
          setError('Vous devez être connecté pour voir vos contenus');
          setLoading(false);
          return;
        }

        const response = await axios.get(`${API_BASE_URL}/api/enrollments`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.data.success) {
          const allEnrollments = response.data.data;
          setEnrollments(allEnrollments);

          // Extract unique categories
          const uniqueCategories = new Set();
          allEnrollments.forEach(enrollment => {
            if (enrollment.itemType === 'course' && enrollment.course?.category) {
              uniqueCategories.add(enrollment.course.category);
            } else if (enrollment.itemType === 'formation' && enrollment.formation?.category) {
              uniqueCategories.add(enrollment.formation.category);
            } else if (enrollment.itemType === 'test' && enrollment.test?.category) {
              uniqueCategories.add(enrollment.test.category);
            }
          });

          setCategories(['Toutes', ...Array.from(uniqueCategories)]);
          setError(null);
        }
      } catch (err) {
        console.error('Error fetching enrollments:', err);
        setError('Erreur lors du chargement de vos contenus');
      } finally {
        setLoading(false);
      }
    };

    fetchEnrollments();
  }, []);

  // Filter and sort enrollments
  useEffect(() => {
    let filtered = [...enrollments];

    // Filter by tab (content type)
    if (activeTab !== 'all') {
      filtered = filtered.filter(enrollment => enrollment.itemType === activeTab);
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(enrollment => {
        const title =
          enrollment.itemType === 'course' ? enrollment.course?.title :
          enrollment.itemType === 'formation' ? enrollment.formation?.title :
          enrollment.test?.title;

        return title && title.toLowerCase().includes(searchTerm.toLowerCase());
      });
    }

    // Filter by category
    if (selectedCategory !== 'Toutes') {
      filtered = filtered.filter(enrollment => {
        const category =
          enrollment.itemType === 'course' ? enrollment.course?.category :
          enrollment.itemType === 'formation' ? enrollment.formation?.category :
          enrollment.test?.category;

        return category === selectedCategory;
      });
    }

    // Filter by status
    if (selectedStatus !== 'Tous') {
      filtered = filtered.filter(enrollment => enrollment.status === selectedStatus);
    }

    // Sort enrollments
    filtered.sort((a, b) => {
      let valueA, valueB;

      if (sortBy === 'date') {
        valueA = new Date(a.enrollmentDate);
        valueB = new Date(b.enrollmentDate);
      } else if (sortBy === 'title') {
        valueA = a.itemType === 'course' ? a.course?.title :
                a.itemType === 'formation' ? a.formation?.title :
                a.test?.title;
        valueB = b.itemType === 'course' ? b.course?.title :
                b.itemType === 'formation' ? b.formation?.title :
                b.test?.title;
      } else if (sortBy === 'progress') {
        valueA = a.progress;
        valueB = b.progress;
      }

      if (sortOrder === 'asc') {
        return valueA > valueB ? 1 : -1;
      } else {
        return valueA < valueB ? 1 : -1;
      }
    });

    setFilteredEnrollments(filtered);
  }, [enrollments, activeTab, searchTerm, selectedCategory, selectedStatus, sortBy, sortOrder]);

  // Pagination
  useEffect(() => {
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    setCurrentEnrollments(filteredEnrollments.slice(indexOfFirstItem, indexOfLastItem));
  }, [filteredEnrollments, currentPage, itemsPerPage]);

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchTerm, selectedCategory, selectedStatus, sortBy, sortOrder]);

  const handleContinueCourse = (enrollment) => {
    if (enrollment.itemType === 'course') {
      navigate(`/course/${enrollment._id}`);
    } else if (enrollment.itemType === 'formation') {
      navigate(`/formation/${enrollment._id}`);
    } else if (enrollment.itemType === 'test') {
      navigate(`/test/${enrollment._id}`);
    }
  };

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const toggleSortOrder = () => {
    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
  };

  // Render content card based on enrollment type
  const renderContentCard = (enrollment) => {
    return (
      <div className="course-card">
        {(() => {
          // Get the appropriate cover image based on item type
          const coverImage =
            enrollment.itemType === 'course' ? enrollment.course?.coverImage :
            enrollment.itemType === 'formation' ? enrollment.formation?.coverImage :
            enrollment.test?.coverImage;

          return coverImage ? (
            <img
              className="course-image w-100"
              src={`${API_BASE_URL}/${coverImage}`}
              onError={(e) => {
                const itemTypeText =
                  enrollment.itemType === 'course' ? 'Course' :
                  enrollment.itemType === 'formation' ? 'Formation' : 'Test';
                e.target.src = `https://placehold.co/600x400?text=${itemTypeText}+Image`;
              }}
              alt="Content cover"
            />
          ) : (
            <div
              className="d-flex align-items-center justify-content-center bg-light course-image"
            >
              {enrollment.itemType === 'course' ? (
                <BookOpen size={40} className="text-muted" />
              ) : enrollment.itemType === 'formation' ? (
                <BookOpen size={40} className="text-muted" />
              ) : (
                <CheckCircle size={40} className="text-muted" />
              )}
            </div>
          );
        })()}
        <div className="course-body">
          <div className="mb-2 d-flex justify-content-between">
            <span
              className="course-category me-2"
              style={{
                backgroundColor:
                  enrollment.itemType === 'course' ? 'var(--primary-color)' :
                  enrollment.itemType === 'formation' ? 'var(--success-color)' : 'var(--warning-color)'
              }}
            >
              {enrollment.itemType === 'course' ? 'Cours' :
               enrollment.itemType === 'formation' ? 'Formation' : 'Test'}
            </span>
            <span
              className="course-category"
              style={{
                backgroundColor: enrollment.status === 'completed' ? 'var(--success-color)' : 'var(--accent-color)'
              }}
            >
              {enrollment.status === 'completed' ? 'Terminé' : 'En cours'}
            </span>
          </div>

          <h3 className="course-title">
            {enrollment.itemType === 'course' ? enrollment.course?.title :
             enrollment.itemType === 'formation' ? enrollment.formation?.title :
             enrollment.test?.title}
          </h3>

          <p className="card-description mb-3">
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
          </p>

          <div className="course-meta mb-3">
            <Clock size={14} className="me-1" />
            <span>Inscrit le {new Date(enrollment.enrollmentDate).toLocaleDateString()}</span>
          </div>

          {enrollment.itemType !== 'test' ? (
            <div className="course-progress">
              <div className="d-flex justify-content-between mb-1">
                <small>Progression</small>
                <small>{enrollment.progress}%</small>
              </div>
              <ProgressBar
                now={enrollment.progress}
                variant={
                  enrollment.progress >= 75 ? 'success' :
                  enrollment.progress >= 50 ? 'info' :
                  enrollment.progress >= 25 ? 'warning' : 'danger'
                }
                style={{ height: '8px', borderRadius: '4px' }}
              />
            </div>
          ) : (
            <div className="mb-3">
              <div className="d-flex justify-content-between align-items-center mb-2" style={{ color: 'var(--dark-gray)' }}>
                <div className="d-flex align-items-center">
                  <span className="me-1" style={{
                    width: '10px',
                    height: '10px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--warning-color)',
                    display: 'inline-block'
                  }}></span>
                  <small>Difficulté:</small>
                </div>
                <small className="fw-bold">{enrollment.test?.difficulty || 'Moyenne'}</small>
              </div>
              <div className="d-flex justify-content-between align-items-center" style={{ color: 'var(--dark-gray)' }}>
                <div className="d-flex align-items-center">
                  <span className="me-1" style={{
                    width: '10px',
                    height: '10px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--primary-color)',
                    display: 'inline-block'
                  }}></span>
                  <small>Durée:</small>
                </div>
                <small className="fw-bold">{enrollment.test?.duration || '30'} min</small>
              </div>
            </div>
          )}

          <div className="course-action">
            <Button
              variant={enrollment.status === 'completed' ? 'outline-success' :
                enrollment.itemType === 'course' ? 'primary' :
                enrollment.itemType === 'formation' ? 'success' : 'warning'
              }
              className="w-100 d-flex align-items-center justify-content-center mt-3"
              onClick={() => handleContinueCourse(enrollment)}
            >
              {enrollment.status === 'completed' ? (
                <>
                  <Award size={16} className="me-2" />
                  {enrollment.itemType === 'test' ? 'Voir les résultats' : 'Voir le certificat'}
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
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="mes-contenus">
      {/* Tabs for content type filtering */}
      <div className="mb-4">
        <Nav
          variant="pills"
          className="content-tabs"
          style={{
            backgroundColor: 'var(--white)',
            padding: '0.5rem',
            borderRadius: 'var(--border-radius-lg)',
            boxShadow: 'var(--shadow-sm)'
          }}
        >
          <Nav.Item>
            <Nav.Link
              active={activeTab === 'all'}
              onClick={() => setActiveTab('all')}
              className="d-flex align-items-center"
            >
              <BookOpen size={18} className="me-2" />
              Tous
            </Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link
              active={activeTab === 'course'}
              onClick={() => setActiveTab('course')}
              className="d-flex align-items-center"
            >
              <BookOpen size={18} className="me-2" />
              Cours
            </Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link
              active={activeTab === 'formation'}
              onClick={() => setActiveTab('formation')}
              className="d-flex align-items-center"
            >
              <BookOpen size={18} className="me-2" />
              Formations
            </Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link
              active={activeTab === 'test'}
              onClick={() => setActiveTab('test')}
              className="d-flex align-items-center"
            >
              <CheckCircle size={18} className="me-2" />
              Tests
            </Nav.Link>
          </Nav.Item>
        </Nav>
      </div>

      {/* Search and filters */}
      <div
        className="filters-container mb-4 p-3"
        style={{
          backgroundColor: 'var(--white)',
          borderRadius: 'var(--border-radius-lg)',
          boxShadow: 'var(--shadow-sm)'
        }}
      >
        <Row>
          <Col md={4}>
            <Form.Group className="mb-3 mb-md-0">
              <div className="input-group">
                <span className="input-group-text" style={{ backgroundColor: 'var(--light-gray)', border: 'none' }}>
                  <Search size={18} color="var(--gray)" />
                </span>
                <Form.Control
                  type="text"
                  placeholder="Rechercher..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{
                    backgroundColor: 'var(--light-gray)',
                    border: 'none',
                    boxShadow: 'none'
                  }}
                />
              </div>
            </Form.Group>
          </Col>
          <Col md={3}>
            <Form.Group className="mb-3 mb-md-0">
              <Form.Select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                style={{
                  backgroundColor: 'var(--light-gray)',
                  border: 'none',
                  boxShadow: 'none'
                }}
              >
                {categories.map((category, index) => (
                  <option key={index} value={category}>{category}</option>
                ))}
              </Form.Select>
            </Form.Group>
          </Col>
          <Col md={3}>
            <Form.Group className="mb-3 mb-md-0">
              <Form.Select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                style={{
                  backgroundColor: 'var(--light-gray)',
                  border: 'none',
                  boxShadow: 'none'
                }}
              >
                <option value="Tous">Tous les statuts</option>
                <option value="in-progress">En cours</option>
                <option value="completed">Terminé</option>
              </Form.Select>
            </Form.Group>
          </Col>
          <Col md={2}>
            <div className="d-flex">
              <Form.Select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="me-2"
                style={{
                  backgroundColor: 'var(--light-gray)',
                  border: 'none',
                  boxShadow: 'none'
                }}
              >
                <option value="date">Date</option>
                <option value="title">Titre</option>
                <option value="progress">Progression</option>
              </Form.Select>
              <Button
                variant="light"
                onClick={toggleSortOrder}
                style={{
                  backgroundColor: 'var(--light-gray)',
                  border: 'none',
                  boxShadow: 'none'
                }}
              >
                {sortOrder === 'asc' ? <SortAsc size={18} /> : <SortDesc size={18} />}
              </Button>
            </div>
          </Col>
        </Row>
      </div>

      {/* Content display */}
      {loading ? (
        <div className="text-center p-5">
          <Spinner animation="border" variant="primary" />
          <p className="mt-3">Chargement de vos contenus...</p>
        </div>
      ) : error ? (
        <Alert variant="danger">{error}</Alert>
      ) : filteredEnrollments.length === 0 ? (
        <div className="dashboard-card text-center py-5">
          <BookOpen size={48} className="text-muted mb-3" />
          <h4>Aucun contenu trouvé</h4>
          <p className="text-muted">Essayez de modifier vos critères de recherche ou inscrivez-vous à de nouveaux contenus</p>
        </div>
      ) : (
        <>
          <Row className="g-4">
            {currentEnrollments.map((enrollment, index) => (
              <Col key={enrollment._id} xs={12} md={6} lg={4}>
                <motion.div
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                >
                  {renderContentCard(enrollment)}
                </motion.div>
              </Col>
            ))}
          </Row>

          {/* Pagination */}
          {filteredEnrollments.length > itemsPerPage && (
            <div className="d-flex justify-content-center mt-4">
              <nav>
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

                  {Array.from({ length: Math.ceil(filteredEnrollments.length / itemsPerPage) }).map((_, index) => (
                    <li
                      key={index}
                      className={`page-item ${currentPage === index + 1 ? 'active' : ''}`}
                    >
                      <button
                        className="page-link"
                        onClick={() => handlePageChange(index + 1)}
                      >
                        {index + 1}
                      </button>
                    </li>
                  ))}

                  <li className={`page-item ${currentPage === Math.ceil(filteredEnrollments.length / itemsPerPage) ? 'disabled' : ''}`}>
                    <button
                      className="page-link"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === Math.ceil(filteredEnrollments.length / itemsPerPage)}
                    >
                      Suivant
                    </button>
                  </li>
                </ul>
              </nav>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default MesContenus;
