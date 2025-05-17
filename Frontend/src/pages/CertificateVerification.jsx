import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Spinner, Alert, Badge } from 'react-bootstrap';
import { ArrowLeft, Award, CheckCircle, XCircle } from 'lucide-react';
import axios from 'axios';
import { API_BASE_URL } from '../config/api';

const CertificateVerification = () => {
  const { certificateId } = useParams();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [certificate, setCertificate] = useState(null);

  useEffect(() => {
    const verifyCertificate = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await axios.get(`${API_BASE_URL}/api/certificates/verify/${certificateId}`);

        if (response.data.success) {
          setCertificate(response.data.data);
        } else {
          setError('Certificat non valide ou introuvable');
        }
      } catch (err) {
        console.error('Error verifying certificate:', err);
        setError(err.response?.data?.message || 'Erreur lors de la vérification du certificat');
      } finally {
        setIsLoading(false);
      }
    };

    if (certificateId) {
      verifyCertificate();
    } else {
      setError('ID de certificat manquant');
      setIsLoading(false);
    }
  }, [certificateId]);

  const handleDownloadCertificate = () => {
    window.open(`${API_BASE_URL}/api/certificates/download/${certificateId}`, '_blank');
  };

  const handleBackClick = () => {
    navigate('/');
  };

  if (isLoading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3">Vérification du certificat...</p>
      </Container>
    );
  }

  return (
    <Container className="py-5">
      <Row className="justify-content-center">
        <Col md={8} lg={6}>
          <Card className="shadow-sm">
            <Card.Header className="bg-primary text-white text-center py-3">
              <h4 className="mb-0">
                <Award size={24} className="me-2" />
                Vérification de Certificat
              </h4>
            </Card.Header>
            <Card.Body className="p-4">
              {error ? (
                <div className="text-center">
                  <XCircle size={64} className="text-danger mb-3" />
                  <h5 className="text-danger">Certificat Non Valide</h5>
                  <p>{error}</p>
                  <Alert variant="warning">
                    Le certificat avec l'ID <strong>{certificateId}</strong> n'a pas pu être vérifié.
                  </Alert>
                </div>
              ) : (
                <div>
                  <div className="text-center mb-4">
                    <CheckCircle size={64} className="text-success mb-3" />
                    <h5 className="text-success">Certificat Authentique</h5>
                    <p className="text-muted">Ce certificat a été vérifié et est authentique.</p>
                  </div>

                  <div className="certificate-details">
                    <div className="mb-3 p-3 border rounded bg-light">
                      <h6 className="text-primary mb-3">Détails du Certificat</h6>
                      
                      <div className="mb-2">
                        <strong>ID du Certificat:</strong>
                        <div>{certificate?.certificateId}</div>
                      </div>
                      
                      <div className="mb-2">
                        <strong>Délivré à:</strong>
                        <div>{certificate?.studentName}</div>
                      </div>
                      
                      <div className="mb-2">
                        <strong>Type de Contenu:</strong>
                        <div>
                          <Badge bg="info">
                            {certificate?.contentType === 'course' ? 'Cours' : 
                             certificate?.contentType === 'formation' ? 'Formation' : 
                             certificate?.contentType === 'test' ? 'Test' : 
                             certificate?.contentType}
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="mb-2">
                        <strong>Titre:</strong>
                        <div>{certificate?.contentTitle}</div>
                      </div>
                      
                      <div className="mb-2">
                        <strong>Enseignant:</strong>
                        <div>{certificate?.teacherName}</div>
                      </div>
                      
                      <div className="mb-2">
                        <strong>Date de Délivrance:</strong>
                        <div>{certificate?.issueDate}</div>
                      </div>
                    </div>
                    
                    <div className="d-grid gap-2">
                      <Button 
                        variant="primary" 
                        onClick={handleDownloadCertificate}
                      >
                        <Award size={16} className="me-2" />
                        Télécharger le Certificat
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </Card.Body>
            <Card.Footer className="bg-white text-center py-3">
              <Button variant="outline-secondary" onClick={handleBackClick}>
                <ArrowLeft size={16} className="me-2" />
                Retour à l'accueil
              </Button>
            </Card.Footer>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default CertificateVerification;
