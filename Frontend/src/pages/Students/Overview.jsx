// Overview.jsx
import React, { useState, useEffect } from 'react';
import { Card, Row, Col, ProgressBar, Spinner, Alert, Badge, Table, ListGroup } from 'react-bootstrap';
import { Activity, Calendar, Users, Award, Star, Trophy, Flame, Clock, BookOpen, CheckCircle, MessageSquare, BarChart2 } from 'lucide-react';
import { useGamification } from '../../context/GamificationContext';
import { useStudyTime } from '../../context/StudyTimeContext';
import { useStudent } from '../../context/StudentContext';
import BadgeList from '../../components/Gamification/BadgeList';
import PointsDisplay from '../../components/Gamification/PointsDisplay';
import Leaderboard from '../../components/Gamification/Leaderboard';
import WeeklyStudyStats from '../../components/StudyStats/WeeklyStudyStats';
import HistoricalStudyStats from '../../components/StudyStats/HistoricalStudyStats';
import { API_BASE_URL } from '../../config/api';
import './DashboardStudent';

const Overview = () => {
  const { points, badges, streak, isLoading: gamificationLoading, error: gamificationError, refreshGamificationData } = useGamification();
  const { studentData, updateStudentData } = useStudent();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);

  // Format date for display
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('fr-FR', options);
  };

  // Get content type icon
  const getContentTypeIcon = (type) => {
    switch (type) {
      case 'course':
        return <BookOpen size={16} className="me-1" />;
      case 'test':
        return <CheckCircle size={16} className="me-1" />;
      case 'formation':
        return <Users size={16} className="me-1" />;
      default:
        return <Activity size={16} className="me-1" />;
    }
  };

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        const token = localStorage.getItem('token');

        if (!token) {
          setError('Vous devez être connecté pour accéder à cette page');
          setIsLoading(false);
          return;
        }

        const response = await fetch(`${API_BASE_URL}/api/users/dashboard`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        const data = await response.json();

        if (response.ok && data.success) {
          setDashboardData(data.data);
          setCurrentUserId(data.data._id);

          // Update student context with the latest data
          updateStudentData(data.data);
        } else {
          throw new Error(data.message || 'Erreur lors du chargement des données');
        }
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError(err.message || 'Une erreur est survenue');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  return (
    <div className="overview-container">
      <h3 className="overview-title">Vue d'ensemble</h3>

      {isLoading || gamificationLoading ? (
        <Card className="text-center p-4 mb-4">
          <Spinner animation="border" variant="primary" />
          <p className="mt-3 mb-0">Chargement des données...</p>
        </Card>
      ) : error || gamificationError ? (
        <Alert variant="danger" className="mb-4">
          {error || gamificationError}
        </Alert>
      ) : (
        <>
          {/* Top Stats Cards */}
          <Row className="mb-4">
            <Col md={3}>
              <Card className="overview-card">
                <Card.Body>
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <div className="card-icon">
                      <Star size={24} />
                    </div>
                    <PointsDisplay points={points} size="lg" />
                  </div>
                  <h5 className="card-title">Points</h5>
                  <p className="card-text">
                    Vous avez accumulé <strong>{points.toLocaleString()}</strong> points.
                  </p>
                </Card.Body>
              </Card>
            </Col>

            <Col md={3}>
              <Card className="overview-card">
                <Card.Body>
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <div className="card-icon">
                      <BookOpen size={24} />
                    </div>
                    <Badge bg="info" pill className="px-3 py-2">
                      {dashboardData?.stats?.totalEnrollments || 0}
                    </Badge>
                  </div>
                  <h5 className="card-title">Contenus</h5>
                  <p className="card-text">
                    Vous êtes inscrit à <strong>{dashboardData?.stats?.totalEnrollments || 0}</strong> contenus.
                  </p>
                </Card.Body>
              </Card>
            </Col>

            <Col md={3}>
              <Card className="overview-card">
                <Card.Body>
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <div className="card-icon">
                      <MessageSquare size={24} />
                    </div>
                    <Badge bg="warning" pill className="px-3 py-2">
                      {dashboardData?.unreadMessages || 0}
                    </Badge>
                  </div>
                  <h5 className="card-title">Messages</h5>
                  <p className="card-text">
                    Vous avez <strong>{dashboardData?.unreadMessages || 0}</strong> messages non lus.
                  </p>
                </Card.Body>
              </Card>
            </Col>

            <Col md={3}>
              <Card className="overview-card">
                <Card.Body>
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <div className="card-icon">
                      <Flame size={24} />
                    </div>
                    <Badge bg="danger" pill className="px-3 py-2">
                      {streak?.currentStreak || 0} jours
                    </Badge>
                  </div>
                  <h5 className="card-title">Série actuelle</h5>
                  <p className="card-text">
                    Record: <strong>{streak?.highestStreak || 0}</strong> jours.
                  </p>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Progress Overview */}
          <Row className="mb-4">
            <Col md={12}>
              <Card>
                <Card.Header className="d-flex align-items-center">
                  <BarChart2 size={18} className="me-2" />
                  <span>Progression globale</span>
                </Card.Header>
                <Card.Body>
                  <Row>
                    <Col md={4}>
                      <div className="text-center mb-3">
                        <h5>Cours</h5>
                        <div className="d-flex justify-content-center align-items-center">
                          <div className="progress-circle">
                            <h3>{dashboardData?.stats?.completedCourses || 0}/{dashboardData?.stats?.totalCourses || 0}</h3>
                          </div>
                        </div>
                        <p className="mt-2">
                          {dashboardData?.stats?.totalCourses ?
                            `${Math.round((dashboardData.stats.completedCourses / dashboardData.stats.totalCourses) * 100)}% complété` :
                            'Aucun cours'}
                        </p>
                      </div>
                    </Col>
                    <Col md={4}>
                      <div className="text-center mb-3">
                        <h5>Tests</h5>
                        <div className="d-flex justify-content-center align-items-center">
                          <div className="progress-circle">
                            <h3>{dashboardData?.stats?.completedTests || 0}/{dashboardData?.stats?.totalTests || 0}</h3>
                          </div>
                        </div>
                        <p className="mt-2">
                          {dashboardData?.stats?.totalTests ?
                            `${Math.round((dashboardData.stats.completedTests / dashboardData.stats.totalTests) * 100)}% complété` :
                            'Aucun test'}
                        </p>
                      </div>
                    </Col>
                    <Col md={4}>
                      <div className="text-center mb-3">
                        <h5>Formations</h5>
                        <div className="d-flex justify-content-center align-items-center">
                          <div className="progress-circle">
                            <h3>{dashboardData?.stats?.completedFormations || 0}/{dashboardData?.stats?.totalFormations || 0}</h3>
                          </div>
                        </div>
                        <p className="mt-2">
                          {dashboardData?.stats?.totalFormations ?
                            `${Math.round((dashboardData.stats.completedFormations / dashboardData.stats.totalFormations) * 100)}% complété` :
                            'Aucune formation'}
                        </p>
                      </div>
                    </Col>
                  </Row>
                  <div className="mt-3">
                    <h6>Progression moyenne: {dashboardData?.stats?.averageProgress || 0}%</h6>
                    <ProgressBar
                      now={dashboardData?.stats?.averageProgress || 0}
                      variant={dashboardData?.stats?.averageProgress > 75 ? 'success' : dashboardData?.stats?.averageProgress > 50 ? 'info' : 'warning'}
                      className="mt-2"
                    />
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Weekly Study Stats */}
          <Row className="mb-4">
            <Col md={12}>
              <WeeklyStudyStats />
            </Col>
          </Row>

          {/* Recent Activity */}
          <Row className="mb-4">
            <Col md={6}>
              <Card className="h-100">
                <Card.Header className="d-flex align-items-center">
                  <Activity size={18} className="me-2" />
                  <span>Activités récentes</span>
                </Card.Header>
                <Card.Body>
                  {dashboardData?.recentActivity && dashboardData.recentActivity.length > 0 ? (
                    <ListGroup variant="flush">
                      {dashboardData.recentActivity.map((activity, index) => (
                        <ListGroup.Item key={index} className="d-flex justify-content-between align-items-center">
                          <div>
                            {getContentTypeIcon(activity.itemType)}
                            <span>{activity.contentTitle}</span>
                          </div>
                          <div className="d-flex align-items-center">
                            <Badge bg="info" className="me-2">{activity.progress}%</Badge>
                            <small className="text-muted">{formatDate(activity.updatedAt)}</small>
                          </div>
                        </ListGroup.Item>
                      ))}
                    </ListGroup>
                  ) : (
                    <p className="text-center text-muted">Aucune activité récente</p>
                  )}
                </Card.Body>
              </Card>
            </Col>

            <Col md={6}>
              <Card className="h-100">
                <Card.Header className="d-flex align-items-center">
                  <Award size={18} className="me-2" />
                  <span>Mes badges</span>
                </Card.Header>
                <Card.Body>
                  <BadgeList badges={badges} />
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Historical Stats and Leaderboard */}
          <Row>
            <Col md={6}>
              <HistoricalStudyStats weekCount={4} />
            </Col>
            <Col md={6}>
              <Leaderboard currentUserId={currentUserId} />
            </Col>
          </Row>
        </>
      )}
    </div>
  );
};

export default Overview;
