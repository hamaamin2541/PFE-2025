import React, { useState } from "react";
import { Container, Row, Col, Card, Form, Button, Alert, Spinner } from "react-bootstrap";
import {
  Facebook,
  Instagram,
  Linkedin,
  Twitter,
  Send,
  MapPin,
  Mail,
  Phone,
  Clock,
  CheckCircle
} from 'lucide-react';
import axios from 'axios';
import { API_BASE_URL } from '../../config/api';
import SocialCardsCarousel from "./SocialCardsCarousel";
import FAQ from '../FAQ';
import Footer from '../Footer/Footer';
import "./Contact.css";

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });

  const [formStatus, setFormStatus] = useState({
    submitted: false,
    success: false,
    message: '',
    loading: false
  });

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [id.replace('form', '').toLowerCase()]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setFormStatus({
        submitted: true,
        success: false,
        message: '',
        loading: true
      });

      // Envoyer les données au serveur
      const response = await axios.post(`${API_BASE_URL}/api/contact`, formData);

      console.log(formData);
      if (response.data.success) {
        setFormStatus({
          submitted: true,
          success: true,
          message: 'Votre message a été envoyé avec succès. Nous vous répondrons dans les plus brefs délais.',
          loading: false
        });

        // Réinitialiser le formulaire après l'envoi réussi
        setTimeout(() => {
          setFormData({
            name: '',
            email: '',
            subject: '',
            message: ''
          });

          setFormStatus(prev => ({
            ...prev,
            submitted: false
          }));
        }, 5000);
      } else {
        setFormStatus({
          submitted: true,
          success: false,
          message: response.data.message || 'Une erreur est survenue lors de l\'envoi du message.',
          loading: false
        });
      }
    } catch (error) {
      console.error('Error sending contact message:', error);
      setFormStatus({
        submitted: true,
        success: false,
        message: error.response?.data?.message || 'Une erreur est survenue lors de l\'envoi du message.',
        loading: false
      });
    }
  };

  return (
    <>
      <Container fluid className="contact-container py-5">
        <Container>
          {/* Header Section */}
          <div className="contact-header">
            <h2 className="contact-title">Contactez-nous</h2>
            <p className="contact-subtitle">Nous sommes là pour répondre à vos questions et vous accompagner dans votre parcours d'apprentissage.</p>

            <div className="social-icons">
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="social-icon">
                <Facebook size={20} />
              </a>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="social-icon">
                <Instagram size={20} />
              </a>
              <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="social-icon">
                <Linkedin size={20} />
              </a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="social-icon">
                <Twitter size={20} />
              </a>
            </div>
          </div>

          <Row className="g-4">
            {/* Contact Form */}
            <Col lg={6}>
              <div className="contact-form-section">
                <Card className="contact-form-card">
                  <Card.Body>
                    <h3 className="section-title">Envoyez-nous un message</h3>

                    {formStatus.submitted && (
                      <Alert variant={formStatus.success ? "success" : "danger"} className="d-flex align-items-center">
                        {formStatus.success ? <CheckCircle size={18} className="me-2" /> : null}
                        {formStatus.message}
                      </Alert>
                    )}

                    <Form onSubmit={handleSubmit} className="mt-4">
                      <Form.Group className="mb-3" controlId="formName">
                        <Form.Label>Nom complet</Form.Label>
                        <Form.Control
                          type="text"
                          placeholder="Votre nom"
                          value={formData.name}
                          onChange={handleChange}
                          required
                        />
                      </Form.Group>

                      <Form.Group className="mb-3" controlId="formEmail">
                        <Form.Label>Email</Form.Label>
                        <Form.Control
                          type="email"
                          placeholder="Votre email"
                          value={formData.email}
                          onChange={handleChange}
                          required
                        />
                      </Form.Group>

                      <Form.Group className="mb-3" controlId="formSubject">
                        <Form.Label>Sujet</Form.Label>
                        <Form.Control
                          type="text"
                          placeholder="Sujet de votre message"
                          value={formData.subject}
                          onChange={handleChange}
                          required
                        />
                      </Form.Group>

                      <Form.Group className="mb-4" controlId="formMessage">
                        <Form.Label>Message</Form.Label>
                        <Form.Control
                          as="textarea"
                          rows={5}
                          placeholder="Écrivez votre message ici..."
                          value={formData.message}
                          onChange={handleChange}
                          required
                        />
                      </Form.Group>

                      <Button
                        type="submit"
                        className="submit-button w-100 d-flex align-items-center justify-content-center gap-2"
                        disabled={formStatus.loading}
                      >
                        {formStatus.loading ? (
                          <>
                            <Spinner animation="border" size="sm" />
                            <span className="ms-2">Envoi en cours...</span>
                          </>
                        ) : (
                          <>
                            <Send size={18} />
                            Envoyer le message
                          </>
                        )}
                      </Button>
                    </Form>

                    <div className="mt-4">
                      <SocialCardsCarousel />
                    </div>
                  </Card.Body>
                </Card>
              </div>
            </Col>

            {/* Map and Info */}
            <Col lg={6}>
              <div className="map-section mb-4">
                <Card className="map-card">
                  <iframe
                    title="Google Maps"
                    src="https://www.google.com/maps/embed?pb=!1m14!1m12!1m3!1d6494.483020546631!2d11.03233982042808!3d35.5230290425795!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!5e0!3m2!1sfr!2stn!4v1749030677129!5m2!1sfr!2stn"
                    className="map-iframe"
                    allowFullScreen=""
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  ></iframe>
                </Card>
              </div>              
              <div className="info-section h-100">
                <Card className="info-card">
                  <Card.Body>
                    <h3 className="section-title">Informations de contact</h3>

                    <div className="contact-info-list mt-4">
                      <div className="contact-info-item">
                        <div className="contact-info-icon">
                          <MapPin size={22} />
                        </div>
                        <div className="contact-info-content">
                          <h5>Adresse</h5>
                          <p>123 Rue de l'Éducation, Tunis, Tunisie</p>
                        </div>
                      </div>

                      <div className="contact-info-item">
                        <div className="contact-info-icon">
                          <Mail size={22} />
                        </div>
                        <div className="contact-info-content">
                          <h5>Email</h5>
                          <p>contact@welearn.com</p>
                        </div>
                      </div>

                      <div className="contact-info-item">
                        <div className="contact-info-icon">
                          <Phone size={22} />
                        </div>
                        <div className="contact-info-content">
                          <h5>Téléphone</h5>
                          <p>+216 71 123 456</p>
                        </div>
                      </div>

                      <div className="contact-info-item">
                        <div className="contact-info-icon">
                          <Clock size={22} />
                        </div>
                        <div className="contact-info-content">
                          <h5>Heures d'ouverture</h5>
                          <p>Lundi - Vendredi: 9h00 - 18h00</p>
                          <p>Samedi: 9h00 - 13h00</p>
                        </div>
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </div>
            </Col>
          </Row>

          {/* About Section */}
          <div className="about-section mt-5">
            <Card className="about-card">
              <Card.Body>
                <h3 className="about-title">À propos de nous</h3>
                <p className="about-text">
                  Nous sommes une équipe passionnée par l'éducation et l'innovation. Notre mission est de rendre l'apprentissage accessible à tous, peu importe où ils se trouvent. Nous croyons que l'éducation est un droit fondamental et que chacun devrait avoir accès à des ressources pédagogiques de qualité.
                </p>

                <h4 className="about-subtitle">Notre histoire</h4>
                <p className="about-text">
                  Depuis notre lancement en 2023, nous avons aidé des milliers d'apprenants à atteindre leurs objectifs professionnels grâce à des cours de qualité, des outils interactifs, et une communauté engagée. Notre plateforme a été créée par des passionnés d'éducation qui souhaitaient révolutionner la façon dont les gens apprennent en ligne.
                </p>

                <h4 className="about-subtitle">Nos valeurs</h4>
                <ul className="about-text values-list">
                  <li>Accessibilité à l'éducation pour tous</li>
                  <li>Qualité et innovation dans nos contenus</li>
                  <li>Communauté et entraide entre apprenants</li>
                  <li>Transparence et confiance dans nos relations</li>
                  <li>Apprentissage continu et adaptation</li>
                </ul>
              </Card.Body>
            </Card>
          </div>

          
        </Container>
      </Container>
      <FAQ />
      <Footer />
    </>
  );
};

export default Contact;
