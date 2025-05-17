import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Spinner, Alert, Badge } from 'react-bootstrap';
import { Award, Download, Share2, ArrowLeft } from 'lucide-react';
import axios from 'axios';
import { API_BASE_URL } from '../../config/api';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const MesCertificats = () => {
  const navigate = useNavigate();
  const [certificates, setCertificates] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCertificates = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const token = localStorage.getItem('token');
        if (!token) {
          setError('Vous devez être connecté pour accéder à cette page');
          setIsLoading(false);
          return;
        }

        const response = await axios.get(`${API_BASE_URL}/api/certificates/my-certificates`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.data.success) {
          setCertificates(response.data.data);
        } else {
          setError('Erreur lors du chargement des certificats');
        }
      } catch (err) {
        console.error('Error fetching certificates:', err);
        setError(err.response?.data?.message || 'Erreur lors du chargement des certificats');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCertificates();
  }, []);

  const handleDownloadCertificate = (certificateId) => {
    window.open(`${API_BASE_URL}/api/certificates/download/${certificateId}`, '_blank');
  };

  const handleShareCertificate = (certificateId) => {
    const verificationUrl = `${window.location.origin}/verify/certificate/${certificateId}`;
    
    // Use Web Share API if available
    if (navigator.share) {
      navigator.share({
        title: 'Mon certificat WeLearn',
        text: 'Consultez mon certificat de réussite sur WeLearn',
        url: verificationUrl
      })
      .catch(error => console.log('Error sharing:', error));
    } else {
      // Fallback to copying to clipboard
      navigator.clipboard.writeText(verificationUrl)
        .then(() => {
          alert('Lien de vérification copié dans le presse-papier');
        })
        .catch(err => {
          console.error('Failed to copy:', err);
          // Fallback for older browsers
          prompt('Copiez ce lien pour partager votre certificat:', verificationUrl);
        });
    }
  };

  const handleBackClick = () => {
    navigate('/dashboard-student');
  };

  if (isLoading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3">Chargement des certificats...</p>
      </Container>
    );
  }

  return (
    <Container className="py-5">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="mb-0">Mes Certificats</h1>
          <p className="text-muted">Tous vos certificats de réussite</p>
        </div>
        <Button variant="outline-primary" onClick={handleBackClick}>
          <ArrowLeft size={16} className="me-2" />
          Retour au tableau de bord
        </Button>
      </div>

      {error && (
        <Alert variant="danger">{error}</Alert>
      )}

      {certificates.length === 0 && !error ? (
        <Card className="text-center p-5 shadow-sm">
          <Card.Body>
            <Award size={48} className="text-muted mb-3" />
            <h4>Aucun certificat trouvé</h4>
            <p className="text-muted">
              Terminez des cours pour obtenir des certificats de réussite.
            </p>
            <Button 
              variant="primary" 
              onClick={() => navigate('/dashboard-student')}
            >
              Explorer les cours
            </Button>
          </Card.Body>
        </Card>
      ) : (
        <Row>
          {certificates.map((certificate, index) => {
            // Determine content title based on content type
            let contentTitle;
            if (certificate.contentType === 'course' && certificate.course) {
              contentTitle = certificate.course.title;
            } else if (certificate.contentType === 'test' && certificate.test) {
              contentTitle = certificate.test.title;
            } else if (certificate.contentType === 'formation' && certificate.formation) {
              contentTitle = certificate.formation.title;
            } else {
              contentTitle = 'Contenu non disponible';
            }

            // Format issue date
            const issueDate = new Date(certificate.issueDate).toLocaleDateString('fr-FR', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            });

            return (
              <Col md={6} lg={4} key={certificate._id} className="mb-4">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="h-100 shadow-sm certificate-card">
                    <Card.Header className="bg-primary text-white">
                      <div className="d-flex align-items-center">
                        <Award size={20} className="me-2" />
                        <span>Certificat de Réussite</span>
                      </div>
                    </Card.Header>
                    <Card.Body className="d-flex flex-column">
                      <div className="mb-3">
                        <Badge bg="info" className="mb-2">
                          {certificate.contentType === 'course' ? 'Cours' : 
                           certificate.contentType === 'formation' ? 'Formation' : 
                           certificate.contentType === 'test' ? 'Test' : 
                           certificate.contentType}
                        </Badge>
                        <h5 className="card-title">{contentTitle}</h5>
                        <p className="text-muted small mb-0">
                          Délivré le {issueDate}
                        </p>
                      </div>
                      
                      <div className="mt-auto">
                        <div className="d-flex gap-2">
                          <Button 
                            variant="primary" 
                            className="flex-grow-1"
                            onClick={() => handleDownloadCertificate(certificate.certificateId)}
                          >
                            <Download size={16} className="me-2" />
                            Télécharger
                          </Button>
                          <Button 
                            variant="outline-secondary"
                            onClick={() => handleShareCertificate(certificate.certificateId)}
                          >
                            <Share2 size={16} />
                          </Button>
                        </div>
                        <div className="mt-2 text-center">
                          <small className="text-muted">
                            ID: {certificate.certificateId}
                          </small>
                        </div>
                      </div>
                    </Card.Body>
                  </Card>
                </motion.div>
              </Col>
            );
          })}
        </Row>
      )}
    </Container>
  );
};

export default MesCertificats;
