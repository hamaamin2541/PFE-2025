import React, { useState, useEffect } from 'react';
import { Button } from 'react-bootstrap';
import { ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Success = () => {
  const navigate = useNavigate();

  const handleCourseClick = () => {
    // Get user role from localStorage
    const userRole = localStorage.getItem('userRole');

    // Redirect based on role
    if (userRole === 'student') {
      navigate('/dashboard-student');
    } else if (userRole === 'teacher') {
      navigate('/dashboard-teacher');
    } else {
      // Fallback in case role is not found
      console.error('User role not found');
      navigate('/');
    }
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