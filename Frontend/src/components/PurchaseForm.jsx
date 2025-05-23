import React, { useState } from 'react';
import { Form, Button, Row, Col, Alert, Spinner } from 'react-bootstrap';
import { API_BASE_URL } from '../config/api';
import axios from 'axios';

const PurchaseForm = ({ item, itemType = 'course', onPurchaseComplete, onCancel }) => {
  const [formData, setFormData] = useState({
    cardNumber: '',
    cardName: '',
    expiryDate: '',
    cvv: '',
    savePaymentInfo: false
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });

    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: null
      });
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Card number validation (16 digits)
    if (!formData.cardNumber.trim() || !/^\d{16}$/.test(formData.cardNumber.replace(/\s/g, ''))) {
      newErrors.cardNumber = 'Numéro de carte invalide (16 chiffres requis)';
    }

    // Card name validation
    if (!formData.cardName.trim()) {
      newErrors.cardName = 'Nom sur la carte requis';
    }

    // Expiry date validation (MM/YY format)
    if (!formData.expiryDate.trim() || !/^\d{2}\/\d{2}$/.test(formData.expiryDate)) {
      newErrors.expiryDate = 'Date d\'expiration invalide (format MM/YY)';
    } else {
      // Check if card is not expired
      const [month, year] = formData.expiryDate.split('/');
      const expiryDate = new Date(2000 + parseInt(year), parseInt(month) - 1, 1);
      const today = new Date();

      if (expiryDate < today) {
        newErrors.expiryDate = 'Carte expirée';
      }
    }

    // CVV validation (3 or 4 digits)
    if (!formData.cvv.trim() || !/^\d{3,4}$/.test(formData.cvv)) {
      newErrors.cvv = 'CVV invalide (3 ou 4 chiffres)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');

      if (!token) {
        setError('Vous devez être connecté pour acheter un cours');
        setIsSubmitting(false);
        return;
      }

      try {
        // Nous ne vérifions plus si l'utilisateur est déjà inscrit
        // pour permettre des achats multiples du même contenu

        // Validate item data
        if (!item || !item._id) {
          console.error('Invalid item data:', item);
          setError('Données invalides. Veuillez réessayer.');
          setIsSubmitting(false);
          return;
        }

        // Validate the item type
        if (!['course', 'formation', 'test'].includes(itemType)) {
          console.error('Invalid item type:', itemType);
          setError(`Type d'élément invalide: ${itemType}`);
          setIsSubmitting(false);
          return;
        }

        // Log the request data for debugging
        console.log('Purchase request data:', {
          itemId: item._id,
          itemType: itemType,
          itemTitle: item.title
        });

        // Make API call to purchase the item
        console.log(`Making API call to ${API_BASE_URL}/api/enrollments with type: ${itemType}`);
        console.log('Item ID:', item._id);
        console.log('Item Type:', itemType);

        // Ensure we're using the correct API URL
        const apiUrl = `${API_BASE_URL}/api/enrollments`;
        console.log('Full API URL:', apiUrl);

        // Log the token (first 10 chars only for security)
        if (token) {
          console.log('Token available:', token.substring(0, 10) + '...');
        } else {
          console.log('No token available!');
        }

        const response = await axios.post(
          apiUrl,
          {
            itemId: item._id,
            itemType: itemType // 'course', 'formation', or 'test'
          },
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            timeout: 30000 // 30 second timeout
          }
        );

        if (response.data.success) {
          // Call the onPurchaseComplete callback
          onPurchaseComplete();
        } else {
          setError(response.data.message || 'Une erreur est survenue lors de l\'achat');
        }
      } catch (err) {
        // Log the full error for debugging
        console.error('Purchase error details:', err);

        // Handle error responses from the server
        if (err.response) {
          console.log('Server error status:', err.response.status);
          console.log('Server error headers:', err.response.headers);
          console.log('Server error data:', err.response.data);

          if (err.response.data && err.response.data.message) {
            setError(err.response.data.message);
          } else if (err.response.status === 500) {
            setError(`Erreur serveur lors de l'achat du ${itemType === 'course' ? 'cours' :
                                                          itemType === 'formation' ? 'de la formation' :
                                                          'du test'}. Veuillez réessayer.`);
          } else {
            setError(`Erreur ${err.response.status}: Une erreur est survenue lors de l'achat`);
          }
        } else if (err.request) {
          // The request was made but no response was received
          console.log('Error request:', err.request);
          setError('Aucune réponse du serveur. Veuillez vérifier votre connexion et réessayer.');
        } else {
          // Something happened in setting up the request
          console.log('Error message:', err.message);
          setError('Une erreur de connexion est survenue. Veuillez réessayer.');
        }
      }
    } catch (err) {
      console.error('Error purchasing course:', err);
      setError(err.response?.data?.message || 'Une erreur est survenue lors de l\'achat');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <div className="mb-4">
        <h5>Détails de l'achat</h5>
        <div className="d-flex align-items-center mb-3">
          {item.coverImage ? (
            <img
              src={`${API_BASE_URL}/${item.coverImage}`}
              alt={item.title}
              className="rounded me-3"
              style={{ width: '80px', height: '60px', objectFit: 'cover' }}
              onError={(e) => {
                e.target.src = `https://placehold.co/80x60?text=${itemType.charAt(0).toUpperCase() + itemType.slice(1)}`;
              }}
            />
          ) : (
            <div
              className="bg-light rounded me-3 d-flex align-items-center justify-content-center"
              style={{ width: '80px', height: '60px' }}
            >
              <span className="text-muted small">No image</span>
            </div>
          )}
          <div>
            <h6 className="mb-1">{item.title}</h6>
            <div className="d-flex align-items-center">
              <span className="text-primary fw-bold me-2">{item.price}€</span>
              <span className="badge bg-secondary">{itemType === 'course' ? 'Cours' : itemType === 'formation' ? 'Formation' : 'Test'}</span>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <Alert variant="danger" className="mb-4">
          {error}
        </Alert>
      )}

      <Form onSubmit={handleSubmit}>
        <h5 className="mb-3">Informations de paiement</h5>

        <Form.Group className="mb-3">
          <Form.Label>Numéro de carte</Form.Label>
          <Form.Control
            type="text"
            name="cardNumber"
            value={formData.cardNumber}
            onChange={handleChange}
            placeholder="1234 5678 9012 3456"
            isInvalid={!!errors.cardNumber}
            maxLength="19"
          />
          <Form.Control.Feedback type="invalid">
            {errors.cardNumber}
          </Form.Control.Feedback>
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>Nom sur la carte</Form.Label>
          <Form.Control
            type="text"
            name="cardName"
            value={formData.cardName}
            onChange={handleChange}
            placeholder="John Doe"
            isInvalid={!!errors.cardName}
          />
          <Form.Control.Feedback type="invalid">
            {errors.cardName}
          </Form.Control.Feedback>
        </Form.Group>

        <Row>
          <Col md={6}>
            <Form.Group className="mb-3">
              <Form.Label>Date d'expiration</Form.Label>
              <Form.Control
                type="text"
                name="expiryDate"
                value={formData.expiryDate}
                onChange={handleChange}
                placeholder="MM/YY"
                isInvalid={!!errors.expiryDate}
                maxLength="5"
              />
              <Form.Control.Feedback type="invalid">
                {errors.expiryDate}
              </Form.Control.Feedback>
            </Form.Group>
          </Col>
          <Col md={6}>
            <Form.Group className="mb-3">
              <Form.Label>CVV</Form.Label>
              <Form.Control
                type="text"
                name="cvv"
                value={formData.cvv}
                onChange={handleChange}
                placeholder="123"
                isInvalid={!!errors.cvv}
                maxLength="4"
              />
              <Form.Control.Feedback type="invalid">
                {errors.cvv}
              </Form.Control.Feedback>
            </Form.Group>
          </Col>
        </Row>

        <Form.Group className="mb-4">
          <Form.Check
            type="checkbox"
            name="savePaymentInfo"
            checked={formData.savePaymentInfo}
            onChange={handleChange}
            label="Sauvegarder mes informations de paiement pour mes prochains achats"
          />
        </Form.Group>

        <div className="d-flex justify-content-between">
          <Button variant="outline-secondary" onClick={onCancel}>
            Annuler
          </Button>
          <Button variant="primary" type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Spinner
                  as="span"
                  animation="border"
                  size="sm"
                  role="status"
                  aria-hidden="true"
                  className="me-2"
                />
                Traitement en cours...
              </>
            ) : (
              `Payer ${item.price}€`
            )}
          </Button>
        </div>
      </Form>
    </div>
  );
};

export default PurchaseForm;
