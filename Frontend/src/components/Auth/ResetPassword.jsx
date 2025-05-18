import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { FaSpinner, FaLock, FaUserGraduate, FaCheckCircle, FaArrowLeft } from 'react-icons/fa';
import { API_BASE_URL } from '../../config/api';
import './Auth.css';

function ResetPassword() {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [tokenValid, setTokenValid] = useState(true);
  const { token } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    // Validate token on component mount
    // This is a placeholder - in a real implementation, you would verify the token with the backend
    if (!token) {
      setTokenValid(false);
      setError('Token de réinitialisation invalide ou expiré');
    }
  }, [token]);

  const handleChange = (e) => {
    const { id, value } = e.target;
    if (id === 'newPassword') {
      setNewPassword(value);
    } else if (id === 'confirmPassword') {
      setConfirmPassword(value);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Validate passwords
    if (!newPassword || !confirmPassword) {
      setError('Veuillez remplir tous les champs');
      setIsLoading(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      setIsLoading(false);
      return;
    }

    if (newPassword.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          newPassword
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Erreur lors de la réinitialisation du mot de passe');
      }

      // Show success message
      setSuccess(true);
      
      // Redirect to login page after 3 seconds
      setTimeout(() => {
        navigate('/SeConnecter');
      }, 3000);
    } catch (err) {
      console.error('Password reset error:', err);
      setError(err.message || 'Une erreur est survenue lors de la réinitialisation du mot de passe');
    } finally {
      setIsLoading(false);
    }
  };

  if (!tokenValid) {
    return (
      <div className="auth-container">
        <div className="auth-background">
          <div className="shape shape-1"></div>
          <div className="shape shape-2"></div>
          <div className="shape shape-3"></div>
        </div>

        <div className="auth-card">
          <div className="auth-header">
            <FaUserGraduate size={40} className="mb-3" style={{ color: 'var(--primary-color)' }} />
            <h2 className="auth-title">Lien invalide</h2>
            <p className="auth-subtitle">Ce lien de réinitialisation est invalide ou a expiré</p>
          </div>

          <div className="text-center mt-4">
            <Link to="/mot-de-passe-oublie" className="auth-btn d-inline-block">
              Demander un nouveau lien
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-background">
        <div className="shape shape-1"></div>
        <div className="shape shape-2"></div>
        <div className="shape shape-3"></div>
      </div>

      <div className="auth-card">
        <div className="auth-header">
          <FaUserGraduate size={40} className="mb-3" style={{ color: 'var(--primary-color)' }} />
          <h2 className="auth-title">Nouveau mot de passe</h2>
          <p className="auth-subtitle">
            {!success 
              ? "Créez un nouveau mot de passe pour votre compte" 
              : "Votre mot de passe a été réinitialisé avec succès"
            }
          </p>
        </div>

        {error && <div className="auth-alert auth-alert-danger">{error}</div>}

        {!success ? (
          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="mb-3">
              <label htmlFor="newPassword" className="form-label">
                <FaLock className="me-2" style={{ color: 'var(--primary-color)' }} />
                Nouveau mot de passe
              </label>
              <input
                type="password"
                className="form-control"
                id="newPassword"
                value={newPassword}
                onChange={handleChange}
                placeholder="Entrez votre nouveau mot de passe"
                required
              />
            </div>

            <div className="mb-4">
              <label htmlFor="confirmPassword" className="form-label">
                <FaLock className="me-2" style={{ color: 'var(--primary-color)' }} />
                Confirmer le mot de passe
              </label>
              <input
                type="password"
                className="form-control"
                id="confirmPassword"
                value={confirmPassword}
                onChange={handleChange}
                placeholder="Confirmez votre nouveau mot de passe"
                required
              />
            </div>

            <button
              type="submit"
              className="auth-btn w-100"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <FaSpinner className="fa-spin me-2" />
                  Réinitialisation en cours...
                </>
              ) : 'Réinitialiser le mot de passe'}
            </button>

            <div className="mt-4 text-center">
              <Link to="/SeConnecter" className="auth-link d-flex align-items-center justify-content-center">
                <FaArrowLeft className="me-2" />
                Retour à la page de connexion
              </Link>
            </div>
          </form>
        ) : (
          <div className="text-center">
            <div className="success-icon mb-4">
              <FaCheckCircle size={60} style={{ color: 'var(--success-color)' }} />
            </div>
            <p className="mb-4">
              Votre mot de passe a été réinitialisé avec succès. Vous allez être redirigé vers la page de connexion.
            </p>
            <Link to="/SeConnecter" className="auth-btn d-inline-block">
              Se connecter maintenant
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

export default ResetPassword;
