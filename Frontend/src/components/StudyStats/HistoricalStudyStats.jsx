import React, { useEffect } from 'react';
import { Card, Spinner, Alert, Button } from 'react-bootstrap';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { History } from 'lucide-react';
import { useStudyTime } from '../../context/StudyTimeContext';
import { formatStudyTime } from '../../services/studyTimeService';

const HistoricalStudyStats = ({ weekCount = 4 }) => {
  const { 
    historicalStats, 
    isLoading, 
    error, 
    fetchHistoricalStats 
  } = useStudyTime();
  
  useEffect(() => {
    fetchHistoricalStats(weekCount);
  }, [weekCount]);
  
  // Format data for the chart
  const formatChartData = () => {
    if (!historicalStats || historicalStats.length === 0) {
      return [];
    }
    
    return historicalStats.map(week => ({
      name: `Semaine ${week.weekNumber}`,
      minutes: week.totalMinutes,
      completed: week.completedCount
    })).reverse(); // Most recent week last
  };
  
  const chartData = formatChartData();
  
  if (isLoading) {
    return (
      <Card className="text-center p-4 mb-4">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3 mb-0">Chargement de l'historique...</p>
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
          onClick={() => fetchHistoricalStats(weekCount)}
        >
          Réessayer
        </Button>
      </Alert>
    );
  }
  
  return (
    <Card className="mb-4">
      <Card.Header className="d-flex justify-content-between align-items-center">
        <div className="d-flex align-items-center">
          <History size={18} className="me-2" />
          <span>Historique d'étude ({weekCount} semaines)</span>
        </div>
        <Button 
          variant="outline-primary" 
          size="sm"
          onClick={() => fetchHistoricalStats(weekCount)}
        >
          Actualiser
        </Button>
      </Card.Header>
      
      <Card.Body>
        {chartData.length === 0 ? (
          <div className="text-center py-4">
            <p className="mb-0">Pas de données d'étude disponibles pour les {weekCount} dernières semaines.</p>
          </div>
        ) : (
          <>
            <div style={{ width: '100%', height: 300 }}>
              <ResponsiveContainer>
                <BarChart
                  data={chartData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis 
                    label={{ 
                      value: 'Minutes d\'étude', 
                      angle: -90, 
                      position: 'insideLeft' 
                    }} 
                  />
                  <Tooltip 
                    formatter={(value, name) => {
                      if (name === 'minutes') {
                        return [formatStudyTime(value), 'Temps d\'étude'];
                      }
                      return [value, 'Contenus terminés'];
                    }}
                  />
                  <Bar 
                    dataKey="minutes" 
                    fill="#3a86ff" 
                    name="Temps d'étude" 
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
            
            <div className="mt-4">
              <h5>Résumé</h5>
              <ul className="list-unstyled">
                {chartData.map((week, index) => (
                  <li key={index} className="mb-2">
                    <strong>{week.name}:</strong> {formatStudyTime(week.minutes)}, 
                    {week.completed} contenu{week.completed !== 1 ? 's' : ''} terminé{week.completed !== 1 ? 's' : ''}
                  </li>
                ))}
              </ul>
            </div>
          </>
        )}
      </Card.Body>
    </Card>
  );
};

export default HistoricalStudyStats;
