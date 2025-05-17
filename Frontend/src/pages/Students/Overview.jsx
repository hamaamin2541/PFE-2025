// Overview.jsx
import React, { useState, useEffect } from 'react';
import { Card, Row, Col, ProgressBar, Spinner, Alert, Badge } from 'react-bootstrap';
import { Activity, Calendar, Users, Award, Star, Trophy, Flame, Clock } from 'lucide-react';
import { useGamification } from '../../context/GamificationContext';
import { useStudyTime } from '../../context/StudyTimeContext';
import BadgeList from '../../components/Gamification/BadgeList';
import PointsDisplay from '../../components/Gamification/PointsDisplay';
import Leaderboard from '../../components/Gamification/Leaderboard';
import WeeklyStudyStats from '../../components/StudyStats/WeeklyStudyStats';
import HistoricalStudyStats from '../../components/StudyStats/HistoricalStudyStats';
import './DashboardStudent';

const Overview = () => {
  const { points, badges, streak, isLoading, error, refreshGamificationData } = useGamification();
  const [currentUserId, setCurrentUserId] = useState(null);

  useEffect(() => {
    // Get current user ID from localStorage
    const userData = localStorage.getItem('studentData');
    if (userData) {
      try {
        const parsedData = JSON.parse(userData);
        setCurrentUserId(parsedData._id);
      } catch (e) {
        console.error('Error parsing student data:', e);
      }
    }
  }, []);

  return (
    <div className="overview-container">
      <h3 className="overview-title">Vue d'ensemble</h3>

      {isLoading ? (
        <Card className="text-center p-4 mb-4">
          <Spinner animation="border" variant="primary" />
          <p className="mt-3 mb-0">Chargement des données...</p>
        </Card>
      ) : error ? (
        <Alert variant="danger" className="mb-4">
          {error}
        </Alert>
      ) : (
        <>
          <Row className="mb-4">
            <Col md={4}>
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
                    Continuez à compléter des cours et des quiz pour en gagner plus!
                  </p>
                </Card.Body>
              </Card>
            </Col>

            <Col md={4}>
              <Card className="overview-card">
                <Card.Body>
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <div className="card-icon">
                      <Award size={24} />
                    </div>
                    <Badge bg="primary" pill className="px-3 py-2">
                      {badges.length}
                    </Badge>
                  </div>
                  <h5 className="card-title">Badges</h5>
                  <p className="card-text">
                    Vous avez débloqué <strong>{badges.length}</strong> badges.
                    Explorez vos réalisations ci-dessous!
                  </p>
                </Card.Body>
              </Card>
            </Col>

            <Col md={4}>
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
                    Vous êtes connecté depuis <strong>{streak?.currentStreak || 0}</strong> jours consécutifs.
                    Record: <strong>{streak?.highestStreak || 0}</strong> jours.
                  </p>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          <Row className="mb-4">
            <Col md={12}>
              <WeeklyStudyStats />
            </Col>
          </Row>

          <Row className="mb-4">
            <Col md={12}>
              <Card>
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

          <Row className="mb-4">
            <Col md={12}>
              <HistoricalStudyStats weekCount={4} />
            </Col>
          </Row>

          <Row>
            <Col md={6}>
              <Card className="overview-summary-card h-100">
                <Card.Header className="d-flex align-items-center">
                  <Activity size={18} className="me-2" />
                  <span>Activités récentes</span>
                </Card.Header>
                <Card.Body>
                  <p className="card-text">
                    Continuez à apprendre pour gagner plus de points et débloquer des badges!
                  </p>
                  <ul className="activity-list">
                    <li>Terminez un cours: <strong>+50 points</strong></li>
                    <li>Réussissez un quiz: <strong>+30 points</strong></li>
                    <li>Complétez une leçon: <strong>+10 points</strong></li>
                    <li>Connectez-vous chaque jour: <strong>Série de connexion</strong></li>
                  </ul>
                </Card.Body>
              </Card>
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
