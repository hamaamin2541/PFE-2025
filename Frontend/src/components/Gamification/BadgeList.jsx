import React from 'react';
import { Row, Col, Card } from 'react-bootstrap';
import BadgeItem from './BadgeItem';
import './BadgeList.css';

const BadgeList = ({ badges, emptyMessage = "Aucun badge obtenu pour le moment." }) => {
  if (!badges || badges.length === 0) {
    return (
      <Card className="text-center p-4 empty-badge-card">
        <p className="text-muted mb-0">{emptyMessage}</p>
        <p className="text-muted small">Complétez des cours et des quiz pour gagner des badges!</p>
      </Card>
    );
  }

  return (
    <Row xs={2} md={3} lg={4} className="g-3">
      {badges.map((badge, index) => (
        <Col key={index}>
          <BadgeItem badge={badge} size="lg" />
        </Col>
      ))}
    </Row>
  );
};

export default BadgeList;
