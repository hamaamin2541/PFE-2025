// Overview.jsx
import React from 'react';
import { Card, Row, Col, ProgressBar } from 'react-bootstrap';
import { Activity, Calendar, Users } from 'lucide-react';
import './DashboardStudent';

const Overview = () => {
  return (
    <div className="overview-container">
      <h3 className="overview-title">Vue d'ensemble</h3>
      
      <Row className="mb-4">
        <Col md={4}>
          <Card className="overview-card">
            <Card.Body>
              <div className="card-icon">
                <Activity size={24} />
              </div>
              <h5 className="card-title">Activités récentes</h5>
              <p className="card-text">Vous avez 5 activités en cours. Cliquez pour voir les détails.</p>
              <ProgressBar now={60} label="60%" className="activity-progress" />
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={4}>
          <Card className="overview-card">
            <Card.Body>
              <div className="card-icon">
                <Calendar size={24} />
              </div>
              <h5 className="card-title">Calendrier</h5>
              <p className="card-text">Votre prochain événement aura lieu dans 3 jours.</p>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={4}>
          <Card className="overview-card">
            <Card.Body>
              <div className="card-icon">
                <Users size={24} />
              </div>
              <h5 className="card-title">Mes cours</h5>
              <p className="card-text">Vous êtes inscrit à 7 cours cette année. Suivez vos progrès.</p>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row>
        <Col md={6}>
          <Card className="overview-summary-card">
            <Card.Body>
              <h5 className="card-title">Résumé des évaluations</h5>
              <p className="card-text">Votre moyenne générale est de 88%. Vous avez besoin de travailler sur les cours de physique et de chimie.</p>
            </Card.Body>
          </Card>
        </Col>

        <Col md={6}>
          <Card className="overview-summary-card">
            <Card.Body>
              <h5 className="card-title">Progrès des tests</h5>
              <p className="card-text">Vous avez terminé 4/5 des tests. Vous devez passer le dernier test avant la fin de la semaine.</p>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Overview;
