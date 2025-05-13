import React, { useState, useEffect } from 'react';
import { FaStar } from 'react-icons/fa';
import axios from 'axios';
import { API_BASE_URL } from '../../config/api';
import { Alert, Button } from 'react-bootstrap';
import './TeacherRating.css';

const TeacherRating = ({ teacherId }) => {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [averageRating, setAverageRating] = useState(0);
  const [totalRatings, setTotalRatings] = useState(0);
  const [userRating, setUserRating] = useState(0);
  const [hasRated, setHasRated] = useState(false);
  const [message, setMessage] = useState('');
  const [showMessage, setShowMessage] = useState(false);
  const [error, setError] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    // Vérifier si l'utilisateur est connecté
    const token = localStorage.getItem('token');
    setIsLoggedIn(!!token);

    // Récupérer la note moyenne du professeur
    fetchTeacherRating();
  }, [teacherId]);

  const fetchTeacherRating = async () => {
    try {
      const token = localStorage.getItem('token');
      let response;

      if (token) {
        // Si l'utilisateur est connecté, récupérer également sa note
        response = await axios.get(`${API_BASE_URL}/api/teacher-ratings/${teacherId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.data.success) {
          setAverageRating(parseFloat(response.data.data.averageRating));
          setTotalRatings(response.data.data.totalRatings);
          
          // Si l'utilisateur a déjà noté ce professeur
          if (response.data.data.userRating) {
            setUserRating(response.data.data.userRating);
            setRating(response.data.data.userRating);
            setHasRated(true);
          }
        }
      } else {
        // Si l'utilisateur n'est pas connecté, récupérer seulement la note moyenne
        response = await axios.get(`${API_BASE_URL}/api/teacher-ratings/${teacherId}/average`);
        
        if (response.data.success) {
          setAverageRating(parseFloat(response.data.data.averageRating));
          setTotalRatings(response.data.data.totalRatings);
        }
      }
    } catch (err) {
      console.error('Erreur lors de la récupération de la note du professeur:', err);
      // En cas d'erreur, définir des valeurs par défaut
      setAverageRating(0);
      setTotalRatings(0);
    }
  };

  const handleRating = async (ratingValue) => {
    if (!isLoggedIn) {
      setError('Vous devez être connecté pour noter un professeur');
      setTimeout(() => setError(''), 3000);
      return;
    }

    setRating(ratingValue);

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_BASE_URL}/api/teacher-ratings`,
        {
          teacherId,
          rating: ratingValue
        },
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        setAverageRating(parseFloat(response.data.data.averageRating));
        setTotalRatings(response.data.data.totalRatings);
        setUserRating(ratingValue);
        setHasRated(true);
        setMessage('Merci pour votre note !');
        setShowMessage(true);
        setTimeout(() => setShowMessage(false), 3000);
      }
    } catch (err) {
      console.error('Erreur lors de l\'ajout de la note:', err);
      setError(err.response?.data?.message || 'Une erreur est survenue lors de l\'ajout de la note');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleResetRating = () => {
    setHasRated(false);
    setRating(0);
  };

  return (
    <div className="teacher-rating-container">
      <div className="rating-header">
        <h5>Évaluez ce professeur</h5>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}
      {showMessage && <Alert variant="success">{message}</Alert>}

      <div className="stars-container">
        {[...Array(5)].map((star, index) => {
          const ratingValue = index + 1;

          return (
            <label key={index}>
              <input
                type="radio"
                name="rating"
                value={ratingValue}
                onClick={() => handleRating(ratingValue)}
                disabled={hasRated && !isLoggedIn}
              />
              <FaStar
                className="star"
                color={ratingValue <= (hover || rating) ? "#ffc107" : "#e4e5e9"}
                size={24}
                onMouseEnter={() => !hasRated && setHover(ratingValue)}
                onMouseLeave={() => !hasRated && setHover(0)}
              />
            </label>
          );
        })}
      </div>

      <div className="rating-stats">
        <div className="average-rating">
          <span className="rating-number">{averageRating.toFixed(1)}</span>
          <FaStar color="#ffc107" />
        </div>
        <div className="total-ratings">
          {totalRatings} {totalRatings > 1 ? 'évaluations' : 'évaluation'}
        </div>
      </div>

      {hasRated && isLoggedIn && (
        <div className="user-rating-actions">
          <div className="user-rating">
            Votre note: {userRating} <FaStar color="#ffc107" size={14} />
          </div>
          <Button 
            variant="outline-secondary" 
            size="sm" 
            onClick={handleResetRating}
            className="mt-2"
          >
            Modifier votre note
          </Button>
        </div>
      )}

      {!isLoggedIn && (
        <div className="login-prompt mt-2">
          <small className="text-muted">Connectez-vous pour noter ce professeur</small>
        </div>
      )}
    </div>
  );
};

export default TeacherRating;
