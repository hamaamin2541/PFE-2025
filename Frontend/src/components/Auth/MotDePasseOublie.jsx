import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaSpinner, FaEnvelope, FaArrowLeft, FaUserGraduate, FaCheckCircle, FaExternalLinkAlt } from 'react-icons/fa';
import { API_BASE_URL } from '../../config/api';
import './Auth.css';

function MotDePasseOublie() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [emailPreviewUrl, setEmailPreviewUrl] = useState('');
  const [checkingPreview, setCheckingPreview] = useState(false);

  // Function to check for email preview URL
  const checkForEmailPreview = async () => {
    if (!success) return;

    try {
      setCheckingPreview(true);
      const response = await fetch(`${API_BASE_URL}/api/auth/last-email-preview`);
      const data = await response.json();

      if (data.success && data.previewUrl) {
        setEmailPreviewUrl(data.previewUrl);
      }
    } catch (err) {
      console.error('Error fetching email preview:', err);
    } finally {
      setCheckingPreview(false);
    }
  };

  // Check for email preview URL when success state changes
  useEffect(() => {
    if (success) {
      // Wait a moment for the backend to process the email
      const timer = setTimeout(() => {
        checkForEmailPreview();
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [success]);

  const handleChange = (e) => {
    setEmail(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    if (!email) {
      setError('Veuillez entrer votre adresse email');
      setIsLoading(false);
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Veuillez entrer une adresse email valide');
      setIsLoading(false);
      return;
    }

    try {
      console.log(`Sending password reset request for email: ${email}`);
      console.log(`API URL: ${API_BASE_URL}/api/auth/reset-password-request`);

      // This endpoint needs to be implemented in the backend
      const response = await fetch(`${API_BASE_URL}/api/auth/reset-password-request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email })
      });

      const data = await response.json();
      console.log('Password reset response:', data);
      console.log('Response status:', response.status);

      if (!response.ok) {
        console.error('Password reset request failed:', data);
        throw new Error(data.message || 'Erreur lors de la demande de réinitialisation');
      }

      console.log('Password reset request successful');
      // Show success message
      setSuccess(true);
    } catch (err) {
      console.error('Password reset request error:', err);
      // Even if the email doesn't exist, we show a success message for security reasons
      setSuccess(true);
    } finally {
      setIsLoading(false);
    }
  };

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
          <h2 className="auth-title">Réinitialisation du mot de passe</h2>
          <p className="auth-subtitle">
            {!success
              ? "Entrez votre adresse email pour recevoir un lien de réinitialisation"
              : "Vérifiez votre boîte de réception pour les instructions"
            }
          </p>
        </div>

        {error && <div className="auth-alert auth-alert-danger">{error}</div>}

        {!success ? (
          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="email" className="form-label">
                <FaEnvelope className="me-2" style={{ color: 'var(--primary-color)' }} />
                Email
              </label>
              <input
                type="email"
                className="form-control"
                id="email"
                value={email}
                onChange={handleChange}
                placeholder="ex: nom@example.com"
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
                  Envoi en cours...
                </>
              ) : 'Envoyer le lien de réinitialisation'}
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
              Si un compte est associé à l'adresse <strong>{email}</strong>, vous recevrez un email avec les instructions pour réinitialiser votre mot de passe.
            </p>
            <p className="mb-4">
              Vérifiez votre boîte de réception et vos spams.
            </p>

            {/* Email Preview Link (Development Only) */}
            {emailPreviewUrl && (
              <div className="email-preview-box mb-4 p-3" style={{ backgroundColor: '#f8f9fa', borderRadius: '8px', border: '1px solid #ddd' }}>
                <p className="mb-2"><strong>Mode Développement:</strong> Cliquez sur le lien ci-dessous pour voir l'email de réinitialisation:</p>
                <a
                  href={emailPreviewUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="preview-link d-flex align-items-center justify-content-center"
                  style={{ color: 'var(--primary-color)', textDecoration: 'underline' }}
                >
                  <FaExternalLinkAlt className="me-2" />
                  Voir l'email de réinitialisation
                </a>
              </div>
            )}

            {checkingPreview && (
              <div className="mb-4">
                <FaSpinner className="fa-spin me-2" />
                Recherche de l'aperçu d'email...
              </div>
            )}

            <Link to="/SeConnecter" className="auth-btn d-inline-block">
              Retour à la connexion
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

export default MotDePasseOublie;
