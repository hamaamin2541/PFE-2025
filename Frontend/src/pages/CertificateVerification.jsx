import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Spinner, Alert, Badge } from 'react-bootstrap';
import { ArrowLeft, Award, CheckCircle, XCircle } from 'lucide-react';
import axios from 'axios';
import { API_BASE_URL } from '../config/api';
import '../styles/CertificateVerification.css';

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
          <Card className="shadow certificate-verification-card">
            <Card.Header className="text-white text-center py-4" style={{ background: 'linear-gradient(45deg, #000000, #333333)' }}>
              <h4 className="mb-0 d-flex align-items-center justify-content-center">
                <Award size={28} className="me-2" />
                Vérification de Certificat
              </h4>
            </Card.Header>
            <Card.Body className="p-4">
              {error ? (
                <div className="text-center verification-error">
                  <div className="verification-icon-container mb-4">
                    <div className="verification-icon-circle bg-danger-light">
                      <XCircle size={72} className="text-danger" />
                    </div>
                  </div>
                  <h4 className="text-danger mb-3">Certificat Non Valide</h4>
                  <p className="text-muted mb-4">{error}</p>
                  <Alert variant="warning" className="border-warning">
                    <p className="mb-0">
                      Le certificat avec l'ID <strong className="text-dark">{certificateId}</strong> n'a pas pu être vérifié.
                    </p>
                  </Alert>
                </div>
              ) : (
                <div>
                  <div className="text-center verification-success mb-4">
                    <div className="verification-icon-container mb-4">
                      <div className="verification-icon-circle bg-success-light">
                        <CheckCircle size={72} className="text-success" />
                      </div>
                    </div>
                    <h4 className="text-success mb-2">Certificat Authentique</h4>
                    <p className="text-muted">Ce certificat a été vérifié et est authentique.</p>
                  </div>

                  <div className="certificate-details">
                    <div className="mb-4 p-4 border rounded bg-light certificate-info-card">
                      <h5 className="text-dark mb-4 border-bottom pb-2">Détails du Certificat</h5>

                      <Row className="mb-3">
                        <Col xs={12} className="mb-3">
                          <div className="certificate-recipient">
                            <div className="small text-muted mb-1">Délivré à</div>
                            <h5 className="mb-0">{certificate?.studentName}</h5>
                          </div>
                        </Col>

                        <Col xs={12} className="mb-3">
                          <div className="certificate-course">
                            <div className="small text-muted mb-1">Pour avoir complété</div>
                            <h6 className="mb-1">{certificate?.contentTitle}</h6>
                            <Badge bg="info" className="me-2">
                              {certificate?.contentType === 'course' ? 'Cours' :
                               certificate?.contentType === 'formation' ? 'Formation' :
                               certificate?.contentType === 'test' ? 'Test' :
                               certificate?.contentType}
                            </Badge>
                          </div>
                        </Col>
                      </Row>

                      <Row className="mb-3">
                        <Col sm={6} className="mb-3 mb-sm-0">
                          <div className="certificate-teacher">
                            <div className="small text-muted mb-1">Enseignant</div>
                            <div>{certificate?.teacherName}</div>
                          </div>
                        </Col>

                        <Col sm={6}>
                          <div className="certificate-date">
                            <div className="small text-muted mb-1">Date de Délivrance</div>
                            <div>{certificate?.issueDate}</div>
                          </div>
                        </Col>
                      </Row>

                      <div className="certificate-id mt-3 pt-3 border-top">
                        <div className="small text-muted mb-1">ID du Certificat</div>
                        <code className="certificate-id-code">{certificate?.certificateId}</code>
                      </div>
                    </div>

                    <div className="d-grid gap-2">
                      <Button
                        variant="success"
                        size="lg"
                        className="certificate-download-button"
                        onClick={handleDownloadCertificate}
                        style={{
                          background: 'linear-gradient(45deg, #28a745, #20c997)',
                          border: 'none',
                          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                          transition: 'all 0.3s ease'
                        }}
                      >
                        <Award size={20} className="me-2" />
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
