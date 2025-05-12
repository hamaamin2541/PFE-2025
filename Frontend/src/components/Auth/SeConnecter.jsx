import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaSpinner, FaEnvelope, FaLock, FaUserGraduate } from 'react-icons/fa';
import { API_BASE_URL } from '../../config/api';
import './Auth.css';

function SeConnecter({ onCloseModal }) {
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { id, value } = e.target;
    if (id === 'emailOrPhone') {
      setEmailOrPhone(value);
    } else if (id === 'password') {
      setPassword(value);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    if (!emailOrPhone || !password) {
      setError('Veuillez remplir tous les champs');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: emailOrPhone,
          password: password
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Erreur lors de la connexion');
      }

      if (data.success && data.token) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('userRole', data.user.role);
        localStorage.setItem('user', JSON.stringify(data.user));

        // Dispatch custom event
        window.dispatchEvent(new Event('loginStateChange'));

        // Close modal if exists
        if (onCloseModal) onCloseModal();

        // Navigate based on role
        if (data.user.role === 'admin') {
          navigate('/admin/dashboard');
        } else if (data.user.role === 'student') {
          navigate('/dashboard-student');
        } else if (data.user.role === 'teacher') {
          navigate('/dashboard-teacher');
        }
      }
    } catch (err) {
      console.error('Login error:', err);
      setError(err.message || 'Une erreur est survenue lors de la connexion');
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
          <h2 className="auth-title">Connexion</h2>
          <p className="auth-subtitle">Accédez à votre espace d'apprentissage</p>
        </div>

        {error && <div className="auth-alert auth-alert-danger">{error}</div>}

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="mb-3">
            <label htmlFor="emailOrPhone" className="form-label">
              <FaEnvelope className="me-2" style={{ color: 'var(--primary-color)' }} />
              Email
            </label>
            <input
              type="text"
              className="form-control"
              id="emailOrPhone"
              value={emailOrPhone}
              onChange={handleChange}
              placeholder="ex: nom@example.com"
              required
            />
          </div>

          <div className="mb-3">
            <label htmlFor="password" className="form-label">
              <FaLock className="me-2" style={{ color: 'var(--primary-color)' }} />
              Mot de passe
            </label>
            <input
              type="password"
              className="form-control"
              id="password"
              value={password}
              onChange={handleChange}
              placeholder="Votre mot de passe"
              required
            />
          </div>

          <div className="mb-4 text-end">
            <Link to="/mot-de-passe-oublie" className="auth-link">Mot de passe oublié ?</Link>
          </div>

          <button
            type="submit"
            className="auth-btn w-100"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <FaSpinner className="fa-spin me-2" />
                Connexion...
              </>
            ) : 'Se connecter'}
          </button>

          <div className="mt-4 text-center">
            <p>Vous n'avez pas de compte ? <Link to="/Register" className="auth-link">Inscrivez-vous</Link></p>
          </div>
        </form>
      </div>
    </div>
  );
}

export default SeConnecter;