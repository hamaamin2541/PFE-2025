import React, { useState, useEffect } from 'react';
import { FaStar } from 'react-icons/fa';
import axios from 'axios';
import { API_BASE_URL } from '../../config/api';
import './StarRating.css';

const StarRating = () => {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [averageRating, setAverageRating] = useState(0);
  const [totalRatings, setTotalRatings] = useState(0);
  const [hasRated, setHasRated] = useState(false);
  const [message, setMessage] = useState('');
  const [showMessage, setShowMessage] = useState(false);

  // Récupérer la note moyenne et le nombre total de notes au chargement
  useEffect(() => {
    const fetchRatings = async () => {
      try {
        // Utiliser un timeout pour éviter que la requête ne bloque trop longtemps
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);

        const response = await axios.get(`${API_BASE_URL}/api/ratings`, {
          signal: controller.signal
        }).catch(error => {
          if (error.name === 'AbortError' || error.code === 'ERR_NETWORK') {
            console.warn('Connexion au serveur impossible, utilisation des valeurs par défaut');
            return { data: { success: false } };
          }
          throw error;
        });

        clearTimeout(timeoutId);

        if (response.data && response.data.success) {
          setAverageRating(response.data.averageRating || 0);
          setTotalRatings(response.data.totalRatings || 0);
        } else {
          console.warn('Utilisation des valeurs par défaut pour les notes');
          // Valeurs par défaut en cas d'erreur
          setAverageRating(4.5);
          setTotalRatings(120);
        }
      } catch (error) {
        console.error('Erreur lors de la récupération des notes:', error);
        // Valeurs par défaut en cas d'erreur
        setAverageRating(4.5);
        setTotalRatings(120);
      }
    };

    // Vérifier si l'utilisateur a déjà noté
    const checkUserRating = () => {
      const hasUserRated = localStorage.getItem('userHasRated');
      if (hasUserRated === 'true') {
        setHasRated(true);
        const userRating = localStorage.getItem('userRating');
        if (userRating) {
          setRating(parseInt(userRating));
        }
      }
    };

    fetchRatings();
    checkUserRating();
  }, []);

  const handleRating = async (ratingValue) => {
    setRating(ratingValue);

    // Enregistrer localement que l'utilisateur a noté
    localStorage.setItem('userHasRated', 'true');
    localStorage.setItem('userRating', ratingValue.toString());
    setHasRated(true);

    // Mettre à jour les statistiques localement immédiatement
    updateLocalStats(ratingValue);

    // Afficher le message de remerciement immédiatement
    setMessage('Merci pour votre note !');
    setShowMessage(true);
    setTimeout(() => {
      setShowMessage(false);
    }, 3000);

    // Si l'utilisateur est connecté, envoyer la note au serveur
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    try {
      // Utiliser un timeout pour éviter que la requête ne bloque trop longtemps
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);

      if (user && user._id) {
        // Envoyer la note au serveur
        const response = await axios.post(`${API_BASE_URL}/api/ratings`, {
          userId: user._id,
          rating: ratingValue
        }, {
          signal: controller.signal
        }).catch(error => {
          if (error.name === 'AbortError' || error.code === 'ERR_NETWORK') {
            console.warn('Connexion au serveur impossible, la note est enregistrée localement');
            return { data: { success: false } };
          }
          throw error;
        });

        clearTimeout(timeoutId);

        if (response.data && response.data.success) {
          // Mettre à jour les statistiques avec les données du serveur
          setAverageRating(response.data.averageRating || 0);
          setTotalRatings(response.data.totalRatings || 0);
        }
      } else {
        // Pour les utilisateurs non connectés
        try {
          // Tenter d'envoyer une note anonyme
          const response = await axios.post(`${API_BASE_URL}/api/ratings`, {
            rating: ratingValue
          }, {
            signal: controller.signal
          }).catch(error => {
            if (error.name === 'AbortError' || error.code === 'ERR_NETWORK') {
              console.warn('Connexion au serveur impossible, la note est enregistrée localement');
              return { data: { success: false } };
            }
            throw error;
          });

          clearTimeout(timeoutId);

          if (response.data && response.data.success) {
            // Mettre à jour les statistiques avec les données du serveur
            setAverageRating(response.data.averageRating || 0);
            setTotalRatings(response.data.totalRatings || 0);
          }
        } catch (anonymousError) {
          console.warn('Erreur lors de l\'envoi de la note anonyme:', anonymousError);
          // La mise à jour locale a déjà été faite
        }
      }
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement de la note:', error);
      // La mise à jour locale a déjà été faite
    }
  };

  // Fonction pour mettre à jour les statistiques localement
  const updateLocalStats = (ratingValue) => {
    const newTotal = totalRatings + 1;
    const newAverage = ((averageRating * totalRatings) + ratingValue) / newTotal;
    setAverageRating(newAverage);
    setTotalRatings(newTotal);
  };

  return (
    <div className="star-rating-container">
      <div className="rating-header">
        <h3>Évaluez notre plateforme</h3>
        <p>Votre avis nous aide à améliorer nos services</p>
      </div>

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
                disabled={hasRated}
              />
              <FaStar
                className="star"
                color={ratingValue <= (hover || rating) ? "#ffc107" : "#e4e5e9"}
                size={30}
                onMouseEnter={() => !hasRated && setHover(ratingValue)}
                onMouseLeave={() => !hasRated && setHover(0)}
              />
            </label>
          );
        })}
      </div>

      {showMessage && (
        <div className="rating-message">
          {message}
        </div>
      )}

      <div className="rating-stats">
        <div className="average-rating">
          <span className="rating-number">{averageRating.toFixed(1)}</span>
          <FaStar color="#ffc107" />
        </div>
        <div className="total-ratings">
          {totalRatings} {totalRatings > 1 ? 'évaluations' : 'évaluation'}
        </div>
      </div>

      {hasRated && (
        <div className="user-rating">
          Votre note: {rating} <FaStar color="#ffc107" size={14} />
        </div>
      )}
    </div>
  );
};

export default StarRating;
