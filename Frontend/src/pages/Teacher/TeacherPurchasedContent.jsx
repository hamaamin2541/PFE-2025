import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Button, Row, Col, Badge, Tabs, Tab, Spinner, Alert, Form, ProgressBar } from 'react-bootstrap';
import { BookOpen, GraduationCap, ClipboardCheck, Eye, Play, Award, Search, SortAsc, SortDesc, Clock } from 'lucide-react';
import { API_BASE_URL } from '../../config/api';
import { authAxios, isAuthenticated, isTeacher } from '../../utils/authUtils';
import { motion } from 'framer-motion';

export const TeacherPurchasedContent = () => {
  const [enrollments, setEnrollments] = useState([]);
  const [filteredEnrollments, setFilteredEnrollments] = useState([]);
  const [currentEnrollments, setCurrentEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(9);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchEnrollments = async () => {
      try {
        setLoading(true);

        // Vérifier si l'utilisateur est connecté et est un enseignant
        if (!isAuthenticated() || !isTeacher()) {
          console.error('User is not authenticated or not a teacher');
          navigate('/SeConnecter');
          return;
        }

        const api = authAxios();
        const response = await api.get(`${API_BASE_URL}/api/enrollments`);

        if (response.data.success) {
          setEnrollments(response.data.data);
        } else {
          setError('Erreur lors du chargement de vos contenus achetés');
        }
      } catch (err) {
        console.error('Error fetching enrollments:', err);
        setError('Erreur lors du chargement de vos contenus achetés');
      } finally {
        setLoading(false);
      }
    };

    fetchEnrollments();
  }, [navigate]);

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
  }, [enrollments, activeTab, searchTerm, sortBy, sortOrder]);

  // Pagination
  useEffect(() => {
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    setCurrentEnrollments(filteredEnrollments.slice(indexOfFirstItem, indexOfLastItem));
  }, [filteredEnrollments, currentPage, itemsPerPage]);

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchTerm, sortBy, sortOrder]);

  const handleContinueCourse = (enrollment) => {
    if (enrollment.itemType === 'course') {
      navigate(`/course/${enrollment.course._id}`);
    } else if (enrollment.itemType === 'formation') {
      navigate(`/formation/${enrollment.formation._id}`);
    } else if (enrollment.itemType === 'test') {
      navigate(`/test/${enrollment.test._id}`);
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
      <Card className="h-100 shadow-sm">
        <div className="position-relative">
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
                style={{ height: '200px', objectFit: 'cover' }}
                onError={(e) => {
                  const itemTypeText =
                    enrollment.itemType === 'course' ? 'Course' :
                    enrollment.itemType === 'formation' ? 'Formation' : 'Test';
                  e.target.src = `https://placehold.co/600x400?text=${itemTypeText}+Image`;
                }}
              />
            ) : (
              <div
                className="d-flex align-items-center justify-content-center bg-light"
                style={{ height: '200px' }}
              >
                {enrollment.itemType === 'course' ? (
                  <BookOpen size={40} className="text-muted" />
                ) : enrollment.itemType === 'formation' ? (
                  <GraduationCap size={40} className="text-muted" />
                ) : (
                  <ClipboardCheck size={40} className="text-muted" />
                )}
              </div>
            );
          })()}
        </div>
        <Card.Body>
          <div className="d-flex align-items-center mb-2">
            {enrollment.itemType === 'course' && <BookOpen size={16} className="me-2 text-success" />}
            {enrollment.itemType === 'test' && <ClipboardCheck size={16} className="me-2 text-danger" />}
            {enrollment.itemType === 'formation' && <GraduationCap size={16} className="me-2 text-purple" />}
            <Badge bg={
              enrollment.itemType === 'course' ? 'success' :
              enrollment.itemType === 'test' ? 'danger' : 'purple'
            }>
              {enrollment.itemType === 'course' ? 'Cours' :
               enrollment.itemType === 'formation' ? 'Formation' : 'Test'}
            </Badge>
          </div>
          <Card.Title>
            {enrollment.itemType === 'course' ? enrollment.course?.title :
             enrollment.itemType === 'formation' ? enrollment.formation?.title :
             enrollment.test?.title}
          </Card.Title>
          <Card.Text>
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
              <div className="d-flex justify-content-between align-items-center mb-2">
                <small>Difficulté:</small>
                <small className="fw-bold">{enrollment.test?.difficulty || 'Moyenne'}</small>
              </div>
              <div className="d-flex justify-content-between align-items-center">
                <small>Durée:</small>
                <small className="fw-bold">{enrollment.test?.duration || '30'} min</small>
              </div>
            </div>
          )}
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
        </Card.Body>
      </Card>
    );
  };

  return (
    <div className="teacher-purchased-content">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4>Mes Contenus Achetés</h4>
      </div>

      {/* Tabs for content type filtering */}
      <Tabs
        activeKey={activeTab}
        onSelect={(k) => setActiveTab(k)}
        className="mb-4"
      >
        <Tab eventKey="all" title="Tous">
          {/* All content will be shown here */}
        </Tab>
        <Tab eventKey="course" title="Cours">
          {/* Only courses will be shown here */}
        </Tab>
        <Tab eventKey="formation" title="Formations">
          {/* Only formations will be shown here */}
        </Tab>
        <Tab eventKey="test" title="Tests">
          {/* Only tests will be shown here */}
        </Tab>
      </Tabs>

      {/* Search and sort */}
      <div className="filters-container mb-4 p-3 bg-light rounded">
        <Row>
          <Col md={8}>
            <Form.Group className="mb-3 mb-md-0">
              <div className="input-group">
                <span className="input-group-text bg-white border-end-0">
                  <Search size={18} />
                </span>
                <Form.Control
                  type="text"
                  placeholder="Rechercher..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="border-start-0"
                />
              </div>
            </Form.Group>
          </Col>
          <Col md={4}>
            <div className="d-flex">
              <Form.Select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="me-2"
              >
                <option value="date">Date</option>
                <option value="title">Titre</option>
                <option value="progress">Progression</option>
              </Form.Select>
              <Button
                variant="light"
                onClick={toggleSortOrder}
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
          <p className="mt-3">Chargement de vos contenus achetés...</p>
        </div>
      ) : error ? (
        <Alert variant="danger">{error}</Alert>
      ) : filteredEnrollments.length === 0 ? (
        <div className="text-center p-5 bg-light rounded">
          <BookOpen size={48} className="text-muted mb-3" />
          <h4>Aucun contenu acheté</h4>
          <p className="text-muted">Vous n'avez pas encore acheté de contenu</p>
          <Button variant="primary" onClick={() => navigate('/NotreContenu')}>
            Découvrir des contenus
          </Button>
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

export default TeacherPurchasedContent;
