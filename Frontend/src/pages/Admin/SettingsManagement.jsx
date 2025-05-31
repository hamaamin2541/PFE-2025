import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Spinner, Tab, Nav } from 'react-bootstrap';
import { Save, RefreshCw, Server, Shield, Bell, Mail, Globe, User, Blocks } from 'lucide-react';
import axios from 'axios';
import { API_BASE_URL } from '../../config/api';
import './SettingsManagement.css'; // Import custom styles    

const SettingsManagement = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [settings, setSettings] = useState({
    general: {
      siteName: 'WeLearn',
      siteDescription: 'Plateforme d\'apprentissage en ligne',
      contactEmail: 'contact@welearn.com',
      supportEmail: 'support@welearn.com',
      maintenanceMode: false
    },
    security: {
      passwordMinLength: 8,
      passwordRequireUppercase: true,
      passwordRequireNumber: true,
      passwordRequireSymbol: true,
      sessionTimeout: 60,
      maxLoginAttempts: 5,
      twoFactorAuth: false
    },
    notifications: {
      emailNotifications: true,
      adminNewUserNotification: true,
      adminNewOrderNotification: true,
      adminNewComplaintNotification: true,
      userWelcomeEmail: true,
      userOrderConfirmation: true,
      userComplaintUpdate: true
    },
    email: {
      smtpServer: 'smtp.example.com',
      smtpPort: 587,
      smtpUsername: 'smtp@example.com',
      smtpPassword: '********',
      smtpEncryption: 'tls',
      emailFromName: 'WeLearn',
      emailFromAddress: 'noreply@welearn.com'
    }
  });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);

        // Get token from localStorage
        const token = localStorage.getItem('token');
        if (!token) {
          setError('Vous devez être connecté pour accéder aux paramètres');
          setLoading(false);
          return;
        }

        const response = await axios.get(`${API_BASE_URL}/api/settings`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        if (response.data.success) {
          setSettings(response.data.data);
        } else {
          setError('Erreur lors du chargement des paramètres');
        }

        setLoading(false);
      } catch (err) {
        console.error('Error fetching settings:', err);
        setError('Une erreur est survenue lors du chargement des paramètres');
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const handleInputChange = (section, field, value) => {
    setSettings(prevSettings => ({
      ...prevSettings,
      [section]: {
        ...prevSettings[section],
        [field]: value
      }
    }));
  };

  const handleSaveSettings = async (section) => {
    try {
      setSaving(true);
      setError(null);

      // Get token from localStorage
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Vous devez être connecté pour modifier les paramètres');
        setSaving(false);
        return;
      }

      // Send only the section data that needs to be updated
      const response = await axios.put(
        `${API_BASE_URL}/api/settings/${section}`,
        settings[section],
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        setSuccessMessage(`Paramètres ${getSectionName(section)} mis à jour avec succès`);
      } else {
        setError('Erreur lors de la sauvegarde des paramètres');
      }

      setSaving(false);

      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
    } catch (err) {
      console.error('Error saving settings:', err);
      setError('Une erreur est survenue lors de la sauvegarde des paramètres');
      setSaving(false);
    }
  };

  const getSectionName = (section) => {
    switch (section) {
      case 'general': return 'généraux';
      case 'security': return 'de sécurité';
      case 'notifications': return 'de notifications';
      case 'email': return 'd\'email';
      default: return '';
    }
  };

  if (loading) {
    return (
      <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '50vh' }}>
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Chargement...</span>
        </Spinner>
      </Container>
    );
  }
  return (
    <Container fluid className="settings-container">
      <div className="settings-header">
        <h4>Paramètres du système</h4>
        {successMessage && (
        <Alert variant="success" onClose={() => setSuccessMessage('')} dismissible>
          {successMessage}
        </Alert>
      )}

      {error && (
        <Alert variant="danger" onClose={() => setError(null)} dismissible>
          {error}
        </Alert>
      )}
      </div>

      
      <div className="settings-content">
      <Tab.Container defaultActiveKey="notifications">
        <Row>
          <Col md={3}>
            <Card className="shadow-sm mb-4">
              <Card.Body className="p-3">
                <Nav variant="pills" className="flex-column gap-2">
                  <Nav.Item>
                    <Nav.Link
                      eventKey="general"
                      className="d-flex align-items-center"
                      style={{
                        padding: '1rem',
                        backgroundColor: '#f8f9fa',
                        color: '#212529',
                        fontWeight: 600,
                        borderRadius: '0.5rem',
                        border: '1px solid #e9ecef'
                      }}
                    >
                      <Globe size={16} className="me-2" />
                      <span>Paramètres généraux</span>
                    </Nav.Link>
                  </Nav.Item>
                  <Nav.Item>
                    <Nav.Link
                      eventKey="security"
                      className="d-flex align-items-center"
                      style={{
                        padding: '1rem',
                        backgroundColor: '#f8f9fa',
                        color: '#212529',
                        fontWeight: 600,
                        borderRadius: '0.5rem',
                        border: '1px solid #e9ecef'
                      }}
                    >
                      <Shield size={16} className="me-2" />
                      <span>Paramètres de sécurité</span>
                    </Nav.Link>
                  </Nav.Item>
                  <Nav.Item>
                    <Nav.Link
                      eventKey="notifications"
                      className="d-flex align-items-center"
                      style={{
                        padding: '1rem',
                        backgroundColor: '#4361ee',
                        color: '#ffffff',
                        fontWeight: 600,
                        borderRadius: '0.5rem',
                        border: '1px solid #e9ecef'
                      }}
                    >
                      <Bell size={16} className="me-2" />
                      <span>Paramètres de notifications</span>
                    </Nav.Link>
                  </Nav.Item>
                  <Nav.Item>
                    <Nav.Link
                      eventKey="email"
                      className="d-flex align-items-center"
                      style={{
                        padding: '1rem',
                        backgroundColor: '#f8f9fa',
                        color: '#212529',
                        fontWeight: 600,
                        borderRadius: '0.5rem',
                        border: '1px solid #e9ecef'
                      }}
                    >
                      <Mail size={16} className="me-2" />
                      <span>Paramètres d'email</span>
                    </Nav.Link>
                  </Nav.Item>
                </Nav>
              </Card.Body>
            </Card>
          </Col>

          <Col md={9}>
            <Card className="shadow-sm">
              <Card.Body>
                <Tab.Content>
                  {/* General Settings */}
                  <Tab.Pane eventKey="general">
                    <h5 className="mb-4">Paramètres généraux</h5>
                    <Form>
                      <Row>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label>Nom du site</Form.Label>
                            <Form.Control
                              type="text"
                              value={settings.general.siteName}
                              onChange={(e) => handleInputChange('general', 'siteName', e.target.value)}
                            />
                          </Form.Group>
                        </Col>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label>Email de contact</Form.Label>
                            <Form.Control
                              type="email"
                              value={settings.general.contactEmail}
                              onChange={(e) => handleInputChange('general', 'contactEmail', e.target.value)}
                            />
                          </Form.Group>
                        </Col>
                      </Row>

                      <Form.Group className="mb-3">
                        <Form.Label>Description du site</Form.Label>
                        <Form.Control
                          as="textarea"
                          rows={3}
                          value={settings.general.siteDescription}
                          onChange={(e) => handleInputChange('general', 'siteDescription', e.target.value)}
                        />
                      </Form.Group>

                      <Row>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label>Email de support</Form.Label>
                            <Form.Control
                              type="email"
                              value={settings.general.supportEmail}
                              onChange={(e) => handleInputChange('general', 'supportEmail', e.target.value)}
                            />
                          </Form.Group>
                        </Col>
                        <Col md={6}>
                          <Form.Group className="mb-3 mt-md-4">
                            <Form.Check
                              type="switch"
                              id="maintenance-mode"
                              label="Mode maintenance"
                              checked={settings.general.maintenanceMode}
                              onChange={(e) => handleInputChange('general', 'maintenanceMode', e.target.checked)}
                            />
                          </Form.Group>
                        </Col>
                      </Row>

                      <div className="d-flex justify-content-end mt-3">
                        <Button
                          variant="primary"
                          onClick={() => handleSaveSettings('general')}
                          disabled={saving}
                        >
                          {saving ? (
                            <>
                              <Spinner
                                as="span"
                                animation="border"
                                size="sm"
                                role="status"
                                aria-hidden="true"
                                className="me-2"
                              />
                              Sauvegarde...
                            </>
                          ) : (
                            <>
                              <Save size={16} className="me-2" />
                              Enregistrer
                            </>
                          )}
                        </Button>
                      </div>
                    </Form>
                  </Tab.Pane>

                  {/* Security Settings */}
                  <Tab.Pane eventKey="security">
                    <h5 className="mb-4">Paramètres de sécurité</h5>
                    <Form>
                      <Row>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label>Longueur minimale du mot de passe</Form.Label>
                            <Form.Control
                              type="number"
                              min="6"
                              max="32"
                              value={settings.security.passwordMinLength}
                              onChange={(e) => handleInputChange('security', 'passwordMinLength', parseInt(e.target.value))}
                            />
                          </Form.Group>
                        </Col>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label>Délai d'expiration de session (minutes)</Form.Label>
                            <Form.Control
                              type="number"
                              min="5"
                              value={settings.security.sessionTimeout}
                              onChange={(e) => handleInputChange('security', 'sessionTimeout', parseInt(e.target.value))}
                            />
                          </Form.Group>
                        </Col>
                      </Row>

                      <Row>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label>Nombre maximal de tentatives de connexion</Form.Label>
                            <Form.Control
                              type="number"
                              min="1"
                              max="10"
                              value={settings.security.maxLoginAttempts}
                              onChange={(e) => handleInputChange('security', 'maxLoginAttempts', parseInt(e.target.value))}
                            />
                          </Form.Group>
                        </Col>
                        <Col md={6}>
                          <Form.Group className="mb-3 mt-md-4">
                            <Form.Check
                              type="switch"
                              id="two-factor-auth"
                              label="Authentification à deux facteurs"
                              checked={settings.security.twoFactorAuth}
                              onChange={(e) => handleInputChange('security', 'twoFactorAuth', e.target.checked)}
                            />
                          </Form.Group>
                        </Col>
                      </Row>

                      <h6 className="mt-4 mb-3">Exigences de mot de passe</h6>
                      <Row>
                        <Col md={4}>
                          <Form.Group className="mb-3">
                            <Form.Check
                              type="switch"
                              id="password-uppercase"
                              label="Majuscule requise"
                              checked={settings.security.passwordRequireUppercase}
                              onChange={(e) => handleInputChange('security', 'passwordRequireUppercase', e.target.checked)}
                            />
                          </Form.Group>
                        </Col>
                        <Col md={4}>
                          <Form.Group className="mb-3">
                            <Form.Check
                              type="switch"
                              id="password-number"
                              label="Chiffre requis"
                              checked={settings.security.passwordRequireNumber}
                              onChange={(e) => handleInputChange('security', 'passwordRequireNumber', e.target.checked)}
                            />
                          </Form.Group>
                        </Col>
                        <Col md={4}>
                          <Form.Group className="mb-3">
                            <Form.Check
                              type="switch"
                              id="password-symbol"
                              label="Symbole requis"
                              checked={settings.security.passwordRequireSymbol}
                              onChange={(e) => handleInputChange('security', 'passwordRequireSymbol', e.target.checked)}
                            />
                          </Form.Group>
                        </Col>
                      </Row>

                      <div className="d-flex justify-content-end mt-3">
                        <Button
                          variant="primary"
                          onClick={() => handleSaveSettings('security')}
                          disabled={saving}
                        >
                          {saving ? (
                            <>
                              <Spinner
                                as="span"
                                animation="border"
                                size="sm"
                                role="status"
                                aria-hidden="true"
                                className="me-2"
                              />
                              Sauvegarde...
                            </>
                          ) : (
                            <>
                              <Save size={16} className="me-2" />
                              Enregistrer
                            </>
                          )}
                        </Button>
                      </div>
                    </Form>
                  </Tab.Pane>

                  {/* Notifications Settings */}
                  <Tab.Pane eventKey="notifications">
                    <h5 className="mb-4">Paramètres de notifications</h5>
                    <Form>
                      <Form.Group className="mb-4">
                        <Form.Check
                          type="switch"
                          id="email-notifications"
                          label="Activer les notifications par email"
                          checked={settings.notifications.emailNotifications}
                          onChange={(e) => handleInputChange('notifications', 'emailNotifications', e.target.checked)}
                        />
                      </Form.Group>

                      <h6 className="mb-3">Notifications administrateur</h6>
                      <Row>
                        <Col md={4}>
                          <Form.Group className="mb-3">
                            <Form.Check
                              type="switch"
                              id="admin-new-user"
                              label="Nouvel utilisateur"
                              checked={settings.notifications.adminNewUserNotification}
                              onChange={(e) => handleInputChange('notifications', 'adminNewUserNotification', e.target.checked)}
                            />
                          </Form.Group>
                        </Col>
                        <Col md={4}>
                          <Form.Group className="mb-3">
                            <Form.Check
                              type="switch"
                              id="admin-new-order"
                              label="Nouvelle commande"
                              checked={settings.notifications.adminNewOrderNotification}
                              onChange={(e) => handleInputChange('notifications', 'adminNewOrderNotification', e.target.checked)}
                            />
                          </Form.Group>
                        </Col>
                        <Col md={4}>
                          <Form.Group className="mb-3">
                            <Form.Check
                              type="switch"
                              id="admin-new-complaint"
                              label="Nouvelle réclamation"
                              checked={settings.notifications.adminNewComplaintNotification}
                              onChange={(e) => handleInputChange('notifications', 'adminNewComplaintNotification', e.target.checked)}
                            />
                          </Form.Group>
                        </Col>
                      </Row>

                      <h6 className="mt-4 mb-3">Notifications utilisateur</h6>
                      <Row>
                        <Col md={4}>
                          <Form.Group className="mb-3">
                            <Form.Check
                              type="switch"
                              id="user-welcome"
                              label="Email de bienvenue"
                              checked={settings.notifications.userWelcomeEmail}
                              onChange={(e) => handleInputChange('notifications', 'userWelcomeEmail', e.target.checked)}
                            />
                          </Form.Group>
                        </Col>
                        <Col md={4}>
                          <Form.Group className="mb-3">
                            <Form.Check
                              type="switch"
                              id="user-order"
                              label="Confirmation de commande"
                              checked={settings.notifications.userOrderConfirmation}
                              onChange={(e) => handleInputChange('notifications', 'userOrderConfirmation', e.target.checked)}
                            />
                          </Form.Group>
                        </Col>
                        <Col md={4}>
                          <Form.Group className="mb-3">
                            <Form.Check
                              type="switch"
                              id="user-complaint"
                              label="Mise à jour de réclamation"
                              checked={settings.notifications.userComplaintUpdate}
                              onChange={(e) => handleInputChange('notifications', 'userComplaintUpdate', e.target.checked)}
                            />
                          </Form.Group>
                        </Col>
                      </Row>

                      <div className="d-flex justify-content-end mt-3">
                        <Button
                          variant="primary"
                          onClick={() => handleSaveSettings('notifications')}
                          disabled={saving}
                        >
                          {saving ? (
                            <>
                              <Spinner
                                as="span"
                                animation="border"
                                size="sm"
                                role="status"
                                aria-hidden="true"
                                className="me-2"
                              />
                              Sauvegarde...
                            </>
                          ) : (
                            <>
                              <Save size={16} className="me-2" />
                              Enregistrer
                            </>
                          )}
                        </Button>
                      </div>
                    </Form>
                  </Tab.Pane>

                  {/* Email Settings */}
                  <Tab.Pane eventKey="email">
                    <h5 className="mb-4">Paramètres d'email</h5>
                    <Form>
                      <Row>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label>Serveur SMTP</Form.Label>
                            <Form.Control
                              type="text"
                              value={settings.email.smtpServer}
                              onChange={(e) => handleInputChange('email', 'smtpServer', e.target.value)}
                            />
                          </Form.Group>
                        </Col>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label>Port SMTP</Form.Label>
                            <Form.Control
                              type="number"
                              value={settings.email.smtpPort}
                              onChange={(e) => handleInputChange('email', 'smtpPort', parseInt(e.target.value))}
                            />
                          </Form.Group>
                        </Col>
                      </Row>

                      <Row>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label>Nom d'utilisateur SMTP</Form.Label>
                            <Form.Control
                              type="text"
                              value={settings.email.smtpUsername}
                              onChange={(e) => handleInputChange('email', 'smtpUsername', e.target.value)}
                            />
                          </Form.Group>
                        </Col>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label>Mot de passe SMTP</Form.Label>
                            <Form.Control
                              type="password"
                              value={settings.email.smtpPassword}
                              onChange={(e) => handleInputChange('email', 'smtpPassword', e.target.value)}
                            />
                          </Form.Group>
                        </Col>
                      </Row>

                      <Row>
                        <Col md={4}>
                          <Form.Group className="mb-3">
                            <Form.Label>Chiffrement SMTP</Form.Label>
                            <Form.Select
                              value={settings.email.smtpEncryption}
                              onChange={(e) => handleInputChange('email', 'smtpEncryption', e.target.value)}
                            >
                              <option value="none">Aucun</option>
                              <option value="ssl">SSL</option>
                              <option value="tls">TLS</option>
                            </Form.Select>
                          </Form.Group>
                        </Col>
                        <Col md={4}>
                          <Form.Group className="mb-3">
                            <Form.Label>Nom d'expéditeur</Form.Label>
                            <Form.Control
                              type="text"
                              value={settings.email.emailFromName}
                              onChange={(e) => handleInputChange('email', 'emailFromName', e.target.value)}
                            />
                          </Form.Group>
                        </Col>
                        <Col md={4}>
                          <Form.Group className="mb-3">
                            <Form.Label>Adresse d'expéditeur</Form.Label>
                            <Form.Control
                              type="email"
                              value={settings.email.emailFromAddress}
                              onChange={(e) => handleInputChange('email', 'emailFromAddress', e.target.value)}
                            />
                          </Form.Group>
                        </Col>
                      </Row>

                      <div className="d-flex justify-content-between mt-3">
                        <Button
                          variant="outline-secondary"
                          onClick={async () => {
                            try {
                              setSaving(true);
                              const token = localStorage.getItem('token');
                              if (!token) {
                                setError('Vous devez être connecté pour tester la configuration');
                                setSaving(false);
                                return;
                              }

                              const response = await axios.post(
                                `${API_BASE_URL}/api/settings/test-email`,
                                {},
                                {
                                  headers: {
                                    Authorization: `Bearer ${token}`
                                  }
                                }
                              );

                              if (response.data.success) {
                                setSuccessMessage('Test de configuration email réussi');
                              } else {
                                setError('Erreur lors du test de la configuration email');
                              }
                              setSaving(false);
                            } catch (err) {
                              console.error('Error testing email config:', err);
                              setError('Erreur lors du test de la configuration email');
                              setSaving(false);
                            }
                          }}
                          disabled={saving}
                        >
                          {saving ? (
                            <>
                              <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-2" />
                              Test en cours...
                            </>
                          ) : (
                            <>
                              <RefreshCw size={16} className="me-2" />
                              Tester la connexion
                            </>
                          )}
                        </Button>

                        <Button
                          variant="primary"
                          onClick={() => handleSaveSettings('email')}
                          disabled={saving}
                        >
                          {saving ? (
                            <>
                              <Spinner
                                as="span"
                                animation="border"
                                size="sm"
                                role="status"
                                aria-hidden="true"
                                className="me-2"
                              />
                              Sauvegarde...
                            </>
                          ) : (
                            <>
                              <Save size={16} className="me-2" />
                              Enregistrer
                            </>
                          )}
                        </Button>
                      </div>
                    </Form>
                  </Tab.Pane>
                </Tab.Content>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Tab.Container>
      </div>
    </Container>
  );
};

export default SettingsManagement;
