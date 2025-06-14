import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Button, Spinner, Alert, Badge } from 'react-bootstrap';
import { Sparkles, BookOpen, Star, ArrowRight, Award, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../../config/api';

const Cancel = () => {
  const navigate = useNavigate();

  const handleCourseClick = () => {
    navigate('/notrecontenu');
  };

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      flexDirection: 'column',
      marginTop: '4rem'
    }}>
      <h1>❌ Paiement annulé</h1>
      <Button 
        variant="primary" 
        size="sm"
        className="d-flex align-items-center"
        onClick={handleCourseClick}
        style={{ marginTop: '2rem' }}
      >
        Réessayer
        <ArrowRight size={16} className="ms-1" />
      </Button>
    </div>
  );
};

export default Cancel;