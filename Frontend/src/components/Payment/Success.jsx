import React, { useState, useEffect } from 'react';
import { Button } from 'react-bootstrap';
import { ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Success = () => {
  const navigate = useNavigate();

  const handleCourseClick = () => {
    navigate('/dashboard-student');
  };

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      flexDirection: 'column',
      marginTop: '4rem'
    }}>
      <h1>✅ Paiement réussi</h1>
      <Button 
        variant="primary" 
        size="sm"
        className="d-flex align-items-center"
        onClick={handleCourseClick}
        style={{ marginTop: '2rem' }}
      >
        Voir le cours
        <ArrowRight size={16} className="ms-1" />
      </Button>
    </div>
  );
};

export default Success;