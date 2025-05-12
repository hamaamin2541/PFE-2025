import React, { useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import './PurchaseCourseForm.css';

const PurchaseCourseForm = ({ selectedCourse }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name || !email || !paymentMethod || (paymentMethod === 'creditCard' && (!cardNumber || !expiryDate || !cvv))) {
      setErrorMessage('Veuillez remplir tous les champs.');
    } else {
      setErrorMessage('');
      alert(`Achat du cours "${selectedCourse.titre}" effectué avec succès !`);
    }
  };

  return (
    <div className="container d-flex justify-content-center align-items-center min-vh-100 bg-light">
      <div className="card shadow-lg p-4" style={{ width: '100%', maxWidth: '500px' }}>
        <h3 className="text-center mb-4 text-primary">Achat du cours</h3>
        <h5 className="text-center text-dark mb-4">{selectedCourse?.titre || 'Cours sélectionné'}</h5>

        <form onSubmit={handleSubmit}>
          <h6 className="mb-3 text-secondary">Informations personnelles</h6>
          <div className="mb-3">
            <label htmlFor="name" className="form-label">Nom complet</label>
            <input
              type="text"
              id="name"
              className="form-control"
              placeholder="Entrez votre nom"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="mb-3">
            <label htmlFor="email" className="form-label">Adresse email</label>
            <input
              type="email"
              id="email"
              className="form-control"
              placeholder="Entrez votre email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <h6 className="mt-4 mb-3 text-secondary">Méthode de paiement</h6>
          <div className="mb-3">
            <select
              id="paymentMethod"
              className="form-select"
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
            >
              <option value="">-- Choisir une méthode --</option>
              <option value="creditCard">Carte de crédit</option>
              <option value="paypal">PayPal</option>
            </select>
          </div>

          {paymentMethod === 'creditCard' && (
            <>
              <div className="mb-3">
                <label htmlFor="cardNumber" className="form-label">Numéro de carte</label>
                <input
                  type="text"
                  id="cardNumber"
                  className="form-control"
                  placeholder="1234 5678 9012 3456"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value)}
                />
              </div>
              <div className="mb-3 d-flex gap-2">
                <input
                  type="text"
                  className="form-control"
                  placeholder="MM/AA"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                />
                <input
                  type="text"
                  className="form-control"
                  placeholder="CVV"
                  value={cvv}
                  onChange={(e) => setCvv(e.target.value)}
                />
              </div>
            </>
          )}

          {paymentMethod === 'paypal' && (
            <div className="alert alert-info">
              Vous serez redirigé vers PayPal pour finaliser le paiement.
            </div>
          )}

          {errorMessage && <div className="text-danger mb-3">{errorMessage}</div>}

          <button
            type="submit"
            className="btn btn-primary w-100 mt-2"
            style={{ transition: '0.3s' }}
          >
            Acheter maintenant
          </button>
        </form>
      </div>
    </div>
  );
};

export default PurchaseCourseForm;
