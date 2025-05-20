import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Button, Spinner, Alert, Badge } from 'react-bootstrap';
import { Sparkles, BookOpen, Star, ArrowRight, Award, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../../config/api';
import './CourseRecommendations.css';

/**
 * CourseRecommendations Component
 * 
 * Displays personalized course recommendations for the current user
 * 
 * @param {Object} props
 * @param {number} props.limit - Maximum number of recommendations to display
 * @param {boolean} props.showTitle - Whether to show the section title
 * @param {string} props.className - Additional CSS classes
 */
const CourseRecommendations = ({ limit = 3, showTitle = true, className = '' }) => {
  const [recommendations, setRecommendations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('Vous devez être connecté pour voir les recommandations');
        }
        
        const response = await fetch(`${API_BASE_URL}/api/recommendations?limit=${limit}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        const data = await response.json();
        
        if (response.ok && data.success) {
          setRecommendations(data.data);
        } else {
          throw new Error(data.message || 'Erreur lors du chargement des recommandations');
        }
      } catch (err) {
        console.error('Error fetching recommendations:', err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchRecommendations();
  }, [limit]);
  
  const handleCourseClick = (courseId) => {
    navigate(`/courses/${courseId}`);
  };
  
  // Format price to display with Euro symbol
  const formatPrice = (price) => {
    return `${price.toFixed(2)} €`;
  };
  
  // Get average rating for a course
  const getAverageRating = (ratings) => {
    if (!ratings || ratings.length === 0) return 0;
    const sum = ratings.reduce((total, rating) => total + rating.value, 0);
    return (sum / ratings.length).toFixed(1);
  };

  return (
    <div className={`course-recommendations ${className}`}>
      {showTitle && (
        <div className="section-header d-flex align-items-center mb-4">
          <Sparkles size={20} className="me-2 text-warning" />
          <h3 className="mb-0">Recommandé pour vous</h3>
        </div>
      )}
      
      {isLoading ? (
        <div className="text-center py-4">
          <Spinner animation="border" variant="primary" />
          <p className="mt-2 mb-0">Chargement des recommandations...</p>
        </div>
      ) : error ? (
        <Alert variant="warning">
          {error}
        </Alert>
      ) : recommendations.length === 0 ? (
        <Alert variant="info">
          Aucune recommandation disponible pour le moment. Explorez notre catalogue de cours !
        </Alert>
      ) : (
        <Row className="g-4">
          {recommendations.map((course) => (
            <Col key={course._id} md={12 / Math.min(limit, 3)} lg={12 / Math.min(limit, 4)}>
              <Card className="h-100 recommendation-card shadow-sm">
                {course.coverImage ? (
                  <Card.Img
                    variant="top"
                    src={`${API_BASE_URL}/${course.coverImage}`}
                    alt={course.title}
                    className="recommendation-image"
                    onError={(e) => {
                      e.target.src = "https://placehold.co/600x400?text=Course";
                    }}
                  />
                ) : (
                  <div className="recommendation-image-placeholder d-flex align-items-center justify-content-center bg-light">
                    <BookOpen size={48} className="text-muted" />
                  </div>
                )}
                
                <Card.Body className="d-flex flex-column">
                  <div className="mb-2">
                    <Badge bg="info" className="me-2">{course.category}</Badge>
                    <Badge bg="secondary">{course.level}</Badge>
                  </div>
                  
                  <Card.Title className="recommendation-title">{course.title}</Card.Title>
                  
                  <div className="mb-3 text-muted small">
                    <div className="d-flex align-items-center mb-1">
                      <Star size={14} className="me-1 text-warning" />
                      <span>{getAverageRating(course.ratings)} ({course.ratings?.length || 0} avis)</span>
                    </div>
                    <div className="d-flex align-items-center">
                      <Clock size={14} className="me-1" />
                      <span>{course.sections?.length || 0} sections</span>
                    </div>
                  </div>
                  
                  <Card.Text className="recommendation-description">
                    {course.description?.length > 100 
                      ? `${course.description.substring(0, 100)}...` 
                      : course.description}
                  </Card.Text>
                  
                  <div className="mt-auto d-flex justify-content-between align-items-center">
                    <span className="recommendation-price fw-bold">
                      {formatPrice(course.price)}
                    </span>
                    <Button 
                      variant="primary" 
                      size="sm"
                      className="d-flex align-items-center"
                      onClick={() => handleCourseClick(course._id)}
                    >
                      Voir le cours
                      <ArrowRight size={16} className="ms-1" />
                    </Button>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      )}
    </div>
  );
};

export default CourseRecommendations;
