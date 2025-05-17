import React, { useState } from 'react';
import { Card, ProgressBar, Button, Spinner, Alert } from 'react-bootstrap';
import { Clock, Award, TrendingUp, Target } from 'lucide-react';
import { useStudyTime } from '../../context/StudyTimeContext';
import './WeeklyStudyStats.css';

const WeeklyStudyStats = () => {
  const { 
    weeklyStats, 
    isLoading, 
    error, 
    refreshWeeklyStats 
  } = useStudyTime();
  
  const [showGoalSetting, setShowGoalSetting] = useState(false);
  const [weeklyGoal, setWeeklyGoal] = useState(
    localStorage.getItem('weeklyStudyGoal') 
      ? parseInt(localStorage.getItem('weeklyStudyGoal')) 
      : 180 // Default: 3 hours
  );
  
  const handleGoalChange = (e) => {
    const value = parseInt(e.target.value);
    setWeeklyGoal(value);
    localStorage.setItem('weeklyStudyGoal', value.toString());
  };
  
  const toggleGoalSetting = () => {
    setShowGoalSetting(!showGoalSetting);
  };
  
  // Calculate progress towards goal
  const goalProgress = weeklyStats?.userStats?.totalMinutes 
    ? Math.min(Math.round((weeklyStats.userStats.totalMinutes / weeklyGoal) * 100), 100)
    : 0;
  
  if (isLoading) {
    return (
      <Card className="weekly-stats-card text-center p-4 mb-4">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3 mb-0">Chargement des statistiques...</p>
      </Card>
    );
  }
  
  if (error) {
    return (
      <Alert variant="danger" className="mb-4">
        {error}
        <Button 
          variant="outline-danger" 
          size="sm" 
          className="ms-3"
          onClick={refreshWeeklyStats}
        >
          Réessayer
        </Button>
      </Alert>
    );
  }
  
  return (
    <Card className="weekly-stats-card mb-4">
      <Card.Header className="d-flex justify-content-between align-items-center">
        <div className="d-flex align-items-center">
          <Clock size={18} className="me-2" />
          <span>Statistiques d'étude hebdomadaires</span>
        </div>
        <Button 
          variant="outline-primary" 
          size="sm"
          onClick={refreshWeeklyStats}
        >
          Actualiser
        </Button>
      </Card.Header>
      
      <Card.Body>
        <div className="study-time-display mb-4">
          <h2 className="study-time-value">
            {weeklyStats?.userStats?.formattedTime || '0h 0min'}
          </h2>
          <p className="study-time-label mb-0">
            Temps d'étude cette semaine
          </p>
        </div>
        
        <div className="stats-grid mb-4">
          <div className="stat-item">
            <div className="stat-icon">
              <Award size={24} />
            </div>
            <div className="stat-content">
              <h5 className="stat-value">{weeklyStats?.userStats?.completedCount || 0}</h5>
              <p className="stat-label mb-0">Contenus terminés</p>
            </div>
          </div>
          
          <div className="stat-item">
            <div className="stat-icon">
              <TrendingUp size={24} />
            </div>
            <div className="stat-content">
              <h5 className="stat-value">
                {weeklyStats?.percentile ? `${weeklyStats.percentile}%` : 'N/A'}
              </h5>
              <p className="stat-label mb-0">
                {weeklyStats?.percentile 
                  ? `Devant ${weeklyStats.percentile}% des étudiants` 
                  : 'Pas assez de données'}
              </p>
            </div>
          </div>
        </div>
        
        {/* Goal Progress */}
        <div className="goal-section mb-3">
          <div className="d-flex justify-content-between align-items-center mb-2">
            <div className="d-flex align-items-center">
              <Target size={18} className="me-2" />
              <span>Objectif hebdomadaire: {Math.floor(weeklyGoal / 60)}h {weeklyGoal % 60}min</span>
            </div>
            <Button 
              variant="link" 
              size="sm" 
              onClick={toggleGoalSetting}
              className="p-0"
            >
              {showGoalSetting ? 'Fermer' : 'Modifier'}
            </Button>
          </div>
          
          <ProgressBar 
            now={goalProgress} 
            label={`${goalProgress}%`}
            variant={goalProgress >= 100 ? 'success' : 'primary'}
            className="goal-progress-bar"
          />
          
          {showGoalSetting && (
            <div className="goal-setting-form mt-3">
              <label htmlFor="weeklyGoal" className="form-label">
                Définir un nouvel objectif (en minutes)
              </label>
              <div className="d-flex">
                <input
                  type="number"
                  className="form-control me-2"
                  id="weeklyGoal"
                  value={weeklyGoal}
                  onChange={handleGoalChange}
                  min="30"
                  step="30"
                />
                <Button 
                  variant="outline-secondary" 
                  size="sm"
                  onClick={toggleGoalSetting}
                >
                  Enregistrer
                </Button>
              </div>
              <div className="form-text">
                Suggestions: 180 (3h), 300 (5h), 420 (7h)
              </div>
            </div>
          )}
        </div>
        
        {/* Platform comparison */}
        <div className="platform-comparison">
          <p className="text-muted mb-1">
            Moyenne de la plateforme: {Math.floor(weeklyStats?.platformStats?.averageMinutes / 60 || 0)}h {weeklyStats?.platformStats?.averageMinutes % 60 || 0}min
          </p>
          <p className="text-muted mb-0">
            Basé sur {weeklyStats?.platformStats?.userCount || 0} utilisateurs actifs cette semaine
          </p>
        </div>
      </Card.Body>
    </Card>
  );
};

export default WeeklyStudyStats;
