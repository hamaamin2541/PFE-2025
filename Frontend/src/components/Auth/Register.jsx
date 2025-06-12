import React, { useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import {
  FaUser, FaEnvelope, FaLock, FaIdCard, FaCreditCard, FaUserTag,
  FaSpinner, FaUserGraduate, FaChalkboardTeacher, FaCalendarAlt
} from 'react-icons/fa';
import { Link, useNavigate } from 'react-router-dom';
import { initializeNewStudent } from '../../services/studentInitializer';
import './Auth.css';

const Register = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: '',
    studentCard: '',
    teacherId: '',
    cardNumber: '',
    expiryMonth: '',
    expiryYear: '',
    securityCode: '',
    cardHolderName: ''
  });

  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [userId, setUserId] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const { fullName, email, password, confirmPassword, role, studentCard, teacherId, cardNumber, expiryMonth, expiryYear, securityCode, cardHolderName } = formData;

    if (!role) {
      setError('Veuillez sélectionner un rôle');
      setIsLoading(false);
      return;
    }

    if (fullName.length < 3 || /\d/.test(fullName)) {
      setError("Le nom complet doit contenir au moins 3 caractères sans chiffres");
      setIsLoading(false);
      return;
    }

    if (!email.includes('@')) {
      setError("Veuillez saisir une adresse email valide");
      setIsLoading(false);
      return;
    }

    if (password.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caractères");
      setIsLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas");
      setIsLoading(false);
      return;
    }


    if (role === 'student') {
      if (!/^\d{8}$/.test(studentCard)) {
        setError("Le numéro de la carte étudiant doit contenir exactement 8 chiffres");
        setIsLoading(false);
        return;
      }
    }

    if (role === 'teacher') {
      if (!/^[A-Za-z0-9]{5,}$/.test(teacherId)) {
        setError("L'identifiant enseignant est invalide");
        setIsLoading(false);
        return;
      }

      if (!/^\d{16}$/.test(cardNumber.replace(/\s/g, ''))) {
        setError("Le numéro de carte bancaire doit contenir 16 chiffres");
        setIsLoading(false);
        return;
      }

      if (!/^\d{2}$/.test(expiryMonth) || !/^\d{2}$/.test(expiryYear)) {
        setError("Date d'expiration invalide (format MM/YY)");
        setIsLoading(false);
        return;
      }

      if (!/^\d{3}$/.test(securityCode)) {
        setError("Code de sécurité invalide (3 chiffres)");
        setIsLoading(false);
        return;
      }

      if (cardHolderName.trim().length < 3) {
        setError("Le nom du titulaire est invalide");
        setIsLoading(false);
        return;
      }
    }

    try {
      // Create the request body with only the needed fields
      const requestBody = {
        fullName,
        email,
        password,
        role,
        ...(role === 'student' && {
          studentCard,
          ...initializeNewStudent // Initialize empty data
        }),
        ...(role === 'teacher' && {
          teacherId,
          paymentInfo: {
            cardNumber: cardNumber.replace(/\s/g, ''),
            expiryMonth,
            expiryYear,
            securityCode,
            cardHolderName
          }
        })
      };

      const response = await fetch('http://localhost:5001/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      const data = await response.json();

      if (response.ok) {
        // Check if we need to verify the account
        if (data.user && !data.user.isVerified) {
          setSuccess(true);
          setUserId(data.user._id);

          // Show success message for 3 seconds before redirecting to verification page
          setTimeout(() => {
            navigate('/verify-account', { state: { userId: data.user._id } });
          }, 3000);
        } else {
          // If account doesn't need verification (unlikely with our new system)
          // localStorage.setItem('token', data.token);
          // localStorage.setItem('userRole', data.user.role);
          // localStorage.setItem('user', JSON.stringify(data.user));
          // Navigate based on role
          // if (data.user.role === 'teacher') {
          //   navigate('/dashboard-teacher');
          // } else if (data.user.role === 'student') {
          //   navigate('/dashboard-student');
          // }
        }
      } else {
        setError(data.message || 'Erreur lors de l\'inscription');
      }
    } catch (error) {
      setError('Erreur de connexion au serveur');
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

      <div className="auth-card auth-card-wide">
        <div className="auth-header">
          {formData.role === 'teacher' ? (
            <FaChalkboardTeacher size={40} className="mb-3" style={{ color: 'var(--secondary-color)' }} />
          ) : (
            <FaUserGraduate size={40} className="mb-3" style={{ color: 'var(--primary-color)' }} />
          )}
          <h2 className="auth-title">Créer un compte</h2>
          <p className="auth-subtitle">Rejoignez notre communauté d'apprentissage</p>
        </div>

        {error && <div className="auth-alert auth-alert-danger">{error}</div>}
        {success && (
          <div className="auth-alert auth-alert-success">
            Compte créé avec succès ! Veuillez vérifier votre email pour le code de vérification.
            Vous allez être redirigé vers la page de vérification...
          </div>
        )}

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="row">
            <div className="col-md-6">
              <div className="mb-3">
                <label className="form-label">
                  <FaUser className="me-2" style={{ color: 'var(--primary-color)' }} />
                  Nom complet
                </label>
                <input
                  type="text"
                  className="form-control"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  placeholder="Entrez votre nom complet"
                />
              </div>

              <div className="mb-3">
                <label className="form-label">
                  <FaEnvelope className="me-2" style={{ color: 'var(--primary-color)' }} />
                  Adresse Email
                </label>
                <input
                  type="email"
                  className="form-control"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="exemple@email.com"
                />
              </div>
            </div>

            <div className="col-md-6">
              <div className="mb-3">
                <label className="form-label">
                  <FaLock className="me-2" style={{ color: 'var(--primary-color)' }} />
                  Mot de passe
                </label>
                <input
                  type="password"
                  className="form-control"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Créez un mot de passe sécurisé"
                />
              </div>

              <div className="mb-3">
                <label className="form-label">
                  <FaLock className="me-2" style={{ color: 'var(--primary-color)' }} />
                  Confirmer le mot de passe
                </label>
                <input
                  type="password"
                  className="form-control"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Confirmez votre mot de passe"
                />
              </div>
            </div>
          </div>

          <div className="mb-3">
            <label className="form-label">
              <FaUserTag className="me-2" style={{ color: 'var(--primary-color)' }} />
              Rôle
            </label>
            <select className="form-select" name="role" value={formData.role} onChange={handleChange}>
              <option value="">-- Sélectionnez un rôle --</option>
              <option value="student">Étudiant</option>
              <option value="teacher">Enseignant</option>
            </select>
          </div>

          {/* Si étudiant : numéro carte */}
          {formData.role === 'student' && (
            <div className="mb-4">
              <label className="form-label">
                <FaIdCard className="me-2" style={{ color: 'var(--primary-color)' }} />
                Numéro carte étudiant
              </label>
              <input
                type="text"
                className="form-control"
                name="studentCard"
                value={formData.studentCard}
                onChange={handleChange}
                placeholder="Entrez votre numéro de carte étudiant"
              />
            </div>
          )}

          {/* Si enseignant : identifiant et infos paiement */}
          {formData.role === 'teacher' && (
            <>
              <div className="mb-3">
                <label className="form-label">
                  <FaIdCard className="me-2" style={{ color: 'var(--secondary-color)' }} />
                  Identifiant enseignant
                </label>
                <input
                  type="text"
                  className="form-control"
                  name="teacherId"
                  value={formData.teacherId}
                  onChange={handleChange}
                  placeholder="Votre identifiant d'enseignant"
                />
              </div>

              <div className="mb-3">
                <label className="form-label">
                  <FaCreditCard className="me-2" style={{ color: 'var(--secondary-color)' }} />
                  Numéro carte bancaire
                </label>
                <input
                  type="text"
                  className="form-control"
                  name="cardNumber"
                  value={formData.cardNumber}
                  onChange={handleChange}
                  maxLength="16"
                  placeholder="XXXX XXXX XXXX XXXX"
                />
              </div>

              <div className="row">
                <div className="col-md-4 mb-3">
                  <label className="form-label">
                    <FaCalendarAlt className="me-2" style={{ color: 'var(--secondary-color)' }} />
                    Mois
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    name="expiryMonth"
                    value={formData.expiryMonth}
                    onChange={handleChange}
                    placeholder="MM"
                    maxLength="2"
                  />
                </div>
                <div className="col-md-4 mb-3">
                  <label className="form-label">Année</label>
                  <input
                    type="text"
                    className="form-control"
                    name="expiryYear"
                    value={formData.expiryYear}
                    onChange={handleChange}
                    placeholder="YY"
                    maxLength="2"
                  />
                </div>
                <div className="col-md-4 mb-3">
                  <label className="form-label">Code</label>
                  <input
                    type="text"
                    className="form-control"
                    name="securityCode"
                    value={formData.securityCode}
                    onChange={handleChange}
                    placeholder="CVV"
                    maxLength="3"
                  />
                </div>
              </div>

              <div className="mb-4">
                <label className="form-label">
                  <FaUser className="me-2" style={{ color: 'var(--secondary-color)' }} />
                  Nom du titulaire
                </label>
                <input
                  type="text"
                  className="form-control"
                  name="cardHolderName"
                  value={formData.cardHolderName}
                  onChange={handleChange}
                  placeholder="Nom tel qu'il apparaît sur la carte"
                />
              </div>
            </>
          )}

          <button type="submit" className="auth-btn w-100" disabled={isLoading}>
            {isLoading ? (
              <>
                <FaSpinner className="fa-spin me-2" />
                Inscription en cours...
              </>
            ) : 'S\'inscrire'}
          </button>

          <div className="mt-4 text-center">
            <p>Vous avez déjà un compte ? <Link to="/SeConnecter" className="auth-link">Connectez-vous</Link></p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register;
