import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FaSpinner, FaCheckCircle, FaExclamationTriangle, FaArrowLeft, FaRedo } from 'react-icons/fa';
import { API_BASE_URL } from '../../config/api';
import './Auth.css';

function VerifyAccount() {
  const [verificationCode, setVerificationCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [userId, setUserId] = useState('');
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Check if we have userId in the location state
    if (location.state && location.state.userId) {
      setUserId(location.state.userId);
    } else {
      // If no userId is provided, redirect to login
      navigate('/SeConnecter');
    }
  }, [location, navigate]);

  const handleChange = (e) => {
    setVerificationCode(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    if (!verificationCode) {
      setError('Veuillez entrer le code de vérification');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/verify-account`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          verificationCode
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Erreur lors de la vérification');
      }

      // Store token and user data
      localStorage.setItem('token', data.token);
      localStorage.setItem('userRole', data.user.role);
      localStorage.setItem('user', JSON.stringify(data.user));

      // Dispatch custom event
      window.dispatchEvent(new Event('loginStateChange'));

      setSuccess(true);

      // Redirect after a short delay
      setTimeout(() => {
        // Navigate based on role
        if (data.user.role === 'admin') {
          navigate('/admin/dashboard');
        } else if (data.user.role === 'student') {
          navigate('/dashboard-student');
        } else if (data.user.role === 'teacher') {
          navigate('/dashboard-teacher');
        }
      }, 2000);
    } catch (err) {
      console.error('Verification error:', err);
      setError(err.message || 'Une erreur est survenue lors de la vérification');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    setResendLoading(true);
    setError('');
    setResendSuccess(false);

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/resend-verification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Erreur lors de l\'envoi du code');
      }

      setResendSuccess(true);
    } catch (err) {
      console.error('Resend code error:', err);
      setError(err.message || 'Une erreur est survenue lors de l\'envoi du code');
    } finally {
      setResendLoading(false);
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
          {success ? (
            <FaCheckCircle size={40} className="mb-3" style={{ color: 'var(--success-color)' }} />
          ) : (
            <FaExclamationTriangle size={40} className="mb-3" style={{ color: 'var(--primary-color)' }} />
          )}
          <h2 className="auth-title">
            {success ? 'Compte vérifié' : 'Vérification du compte'}
          </h2>
          <p className="auth-subtitle">
            {success 
              ? 'Votre compte a été vérifié avec succès' 
              : 'Veuillez entrer le code de vérification envoyé à votre adresse email'
            }
          </p>
        </div>

        {error && <div className="auth-alert auth-alert-danger">{error}</div>}
        {resendSuccess && <div className="auth-alert auth-alert-success">Un nouveau code a été envoyé à votre adresse email</div>}

        {!success ? (
          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="verificationCode" className="form-label">
                Code de vérification
              </label>
              <input
                type="text"
                className="form-control"
                id="verificationCode"
                value={verificationCode}
                onChange={handleChange}
                placeholder="Entrez le code à 6 chiffres"
                maxLength={6}
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
                  Vérification...
                </>
              ) : 'Vérifier le compte'}
            </button>

            <div className="mt-3 text-center">
              <button
                type="button"
                className="btn btn-link auth-link"
                onClick={handleResendCode}
                disabled={resendLoading}
              >
                {resendLoading ? (
                  <>
                    <FaSpinner className="fa-spin me-2" />
                    Envoi en cours...
                  </>
                ) : (
                  <>
                    <FaRedo className="me-2" />
                    Renvoyer le code
                  </>
                )}
              </button>
            </div>

            <div className="mt-4 text-center">
              <button
                type="button"
                className="btn btn-link auth-link"
                onClick={() => navigate('/SeConnecter')}
              >
                <FaArrowLeft className="me-2" />
                Retour à la connexion
              </button>
            </div>
          </form>
        ) : (
          <div className="text-center">
            <p className="mb-4">
              Vous allez être redirigé vers votre tableau de bord...
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default VerifyAccount;
