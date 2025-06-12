import React, { useState, useRef } from 'react';
import { Card, Form, Button, Image, Modal, Row, Col, Alert } from 'react-bootstrap';
import { Upload, User, Mail, Lock, Save, Camera, Shield, Eye, EyeOff } from 'lucide-react';
import './DashboardStudent.css';


const Parametres = ({
  currentProfileImage,
  onProfileImageChange,
  onSubmit,
  isSubmitting,
  initialData
}) => {
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [previewImage, setPreviewImage] = useState(currentProfileImage);
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    fullName: initialData?.fullName || '',
    email: initialData?.email || '',
    // Add other fields as needed
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: ''
  });

  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false
  });

  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedImage(file);
      setPreviewImage(URL.createObjectURL(file));
      setShowImageModal(true);
    }
  };

  const handleSaveImage = async () => {
    if (selectedImage) {
      try {
        const formData = new FormData();
        formData.append('profileImage', selectedImage);

        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:5000/api/users/profile-image', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData
        });

        const data = await response.json();
        if (response.ok) {
          onProfileImageChange(data.data.profileImage);
          setShowImageModal(false);
        } else {
          throw new Error(data.message);
        }
      } catch (error) {
        alert('Error uploading image: ' + error.message);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccessMessage('');
    setErrorMessage('');

    try {
      await onSubmit(formData);
      setSuccessMessage('Vos informations ont été mises à jour avec succès!');

      // Effacer le message de succès après 5 secondes
      setTimeout(() => {
        setSuccessMessage('');
      }, 5000);
    } catch (error) {
      setErrorMessage('Une erreur est survenue lors de la mise à jour de vos informations.');
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const togglePasswordVisibility = (field) => {
    setShowPassword(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setSuccessMessage('');
    setErrorMessage('');

    if (!passwordData.currentPassword || !passwordData.newPassword) {
      setErrorMessage('Veuillez remplir tous les champs du formulaire de mot de passe.');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/users/change-password', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(passwordData)
      });

      const data = await response.json();
      if (response.ok) {
        setSuccessMessage('Votre mot de passe a été mis à jour avec succès!');
        setPasswordData({ currentPassword: '', newPassword: '' });

        // Effacer le message de succès après 5 secondes
        setTimeout(() => {
          setSuccessMessage('');
        }, 5000);
      } else {
        throw new Error(data.message || 'Erreur lors du changement de mot de passe');
      }
    } catch (error) {
      setErrorMessage(error.message || 'Une erreur est survenue lors de la mise à jour de votre mot de passe.');
    }
  };

  return (
    <div className="settings-page">

      {successMessage && (
        <Alert variant="success" className="mb-4 d-flex align-items-center">
          <Shield className="me-2" size={20} />
          {successMessage}
        </Alert>
      )}

      {errorMessage && (
        <Alert variant="danger" className="mb-4 d-flex align-items-center">
          <Shield className="me-2" size={20} />
          {errorMessage}
        </Alert>
      )}

      <Row>
        <Col lg={4} md={5} className="mb-4 mb-md-0">
          <Card className="profile-card text-center h-100" style={{ borderRadius: 'var(--border-radius-lg)', boxShadow: 'var(--shadow-md)' }}>
            <Card.Body className="d-flex flex-column align-items-center">
              <div className="profile-image-container mb-4 position-relative">
                <Image
                  src={previewImage}
                  roundedCircle
                  width={150}
                  height={150}
                  className="profile-image"
                  style={{
                    objectFit: 'cover',
                    border: '4px solid var(--white)',
                    boxShadow: 'var(--shadow-md)'
                  }}
                />
                <Button
                  variant="primary"
                  size="sm"
                  className="change-photo-btn position-absolute d-flex align-items-center justify-content-center"
                  onClick={() => fileInputRef.current.click()}
                  style={{
                    bottom: '0',
                    right: '0',
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%'
                  }}
                >
                  <Camera size={18} />
                </Button>
                <Form.Control
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageChange}
                  accept="image/*"
                  style={{ display: 'none' }}
                />
              </div>

              <h4 className="mb-1">{formData.fullName || 'Votre nom'}</h4>
              <p className="text-muted mb-4">{formData.email || 'votre.email@exemple.com'}</p>

              <div className="profile-stats w-100 mb-3">
                <Row className="text-center">
                  <Col xs={4}>
                    <div className="stat-value fw-bold">{initialData?.points || 0}</div>
                    <div className="stat-label small text-muted">Points</div>
                  </Col>
                  <Col xs={4}>
                    <div className="stat-value fw-bold">{initialData?.badges?.length || 0}</div>
                    <div className="stat-label small text-muted">Badges</div>
                  </Col>
                  <Col xs={4}>
                    <div className="stat-value fw-bold">{initialData?.streak?.currentStreak || 0}</div>
                    <div className="stat-label small text-muted">Série</div>
                  </Col>
                </Row>
              </div>

              <p className="text-muted small mb-0">
                Membre depuis {new Date().toLocaleDateString()}
              </p>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={8} md={7}>
          <Card className="mb-4" style={{ borderRadius: 'var(--border-radius-lg)', boxShadow: 'var(--shadow-md)' }}>
            <Card.Body>
              <div className="d-flex align-items-center mb-4">
                <User size={24} className="me-3 text-primary" />
                <h4 className="mb-0">Informations personnelles</h4>
              </div>

              <Form onSubmit={handleSubmit}>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-4">
                      <Form.Label className="fw-medium">Nom complet</Form.Label>
                      <div className="input-group">
                        <span className="input-group-text" style={{ backgroundColor: 'var(--light-gray)' }}>
                          <User size={18} color="var(--gray)" />
                        </span>
                        <Form.Control
                          type="text"
                          name="fullName"
                          value={formData.fullName}
                          onChange={handleChange}
                          placeholder="Votre nom complet"
                          style={{
                            borderTopRightRadius: 'var(--border-radius-md)',
                            borderBottomRightRadius: 'var(--border-radius-md)',
                            borderLeft: 'none'
                          }}
                        />
                      </div>
                    </Form.Group>
                  </Col>

                  <Col md={6}>
                    <Form.Group className="mb-4">
                      <Form.Label className="fw-medium">Email</Form.Label>
                      <div className="input-group">
                        <span className="input-group-text" style={{ backgroundColor: 'var(--light-gray)' }}>
                          <Mail size={18} color="var(--gray)" />
                        </span>
                        <Form.Control
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleChange}
                          placeholder="votre.email@exemple.com"
                          style={{
                            borderTopRightRadius: 'var(--border-radius-md)',
                            borderBottomRightRadius: 'var(--border-radius-md)',
                            borderLeft: 'none'
                          }}
                        />
                      </div>
                    </Form.Group>
                  </Col>
                </Row>

                <Button
                  variant="primary"
                  type="submit"
                  disabled={isSubmitting}
                  className="d-flex align-items-center"
                  style={{ borderRadius: 'var(--border-radius-md)' }}
                >
                  <Save size={18} className="me-2" />
                  {isSubmitting ? 'Enregistrement...' : 'Enregistrer les modifications'}
                </Button>
              </Form>
            </Card.Body>
          </Card>

          <Card style={{ borderRadius: 'var(--border-radius-lg)', boxShadow: 'var(--shadow-md)' }}>
            <Card.Body>
              <div className="d-flex align-items-center mb-4">
                <Lock size={24} className="me-3 text-primary" />
                <h4 className="mb-0">Sécurité</h4>
              </div>

              <Form onSubmit={handlePasswordChange}>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-4">
                      <Form.Label className="fw-medium">Mot de passe actuel</Form.Label>
                      <div className="input-group">
                        <span className="input-group-text" style={{ backgroundColor: 'var(--light-gray)' }}>
                          <Lock size={18} color="var(--gray)" />
                        </span>
                        <Form.Control
                          type={showPassword.current ? "text" : "password"}
                          value={passwordData.currentPassword}
                          onChange={(e) => setPasswordData({
                            ...passwordData,
                            currentPassword: e.target.value
                          })}
                          placeholder="Votre mot de passe actuel"
                          style={{
                            borderTopRightRadius: '0',
                            borderBottomRightRadius: '0',
                            borderLeft: 'none',
                            borderRight: 'none'
                          }}
                        />
                        <Button
                          variant="outline-secondary"
                          onClick={() => togglePasswordVisibility('current')}
                          style={{
                            borderTopRightRadius: 'var(--border-radius-md)',
                            borderBottomRightRadius: 'var(--border-radius-md)'
                          }}
                        >
                          {showPassword.current ? <EyeOff size={18} /> : <Eye size={18} />}
                        </Button>
                      </div>
                    </Form.Group>
                  </Col>

                  <Col md={6}>
                    <Form.Group className="mb-4">
                      <Form.Label className="fw-medium">Nouveau mot de passe</Form.Label>
                      <div className="input-group">
                        <span className="input-group-text" style={{ backgroundColor: 'var(--light-gray)' }}>
                          <Lock size={18} color="var(--gray)" />
                        </span>
                        <Form.Control
                          type={showPassword.new ? "text" : "password"}
                          value={passwordData.newPassword}
                          onChange={(e) => setPasswordData({
                            ...passwordData,
                            newPassword: e.target.value
                          })}
                          placeholder="Votre nouveau mot de passe"
                          style={{
                            borderTopRightRadius: '0',
                            borderBottomRightRadius: '0',
                            borderLeft: 'none',
                            borderRight: 'none'
                          }}
                        />
                        <Button
                          variant="outline-secondary"
                          onClick={() => togglePasswordVisibility('new')}
                          style={{
                            borderTopRightRadius: 'var(--border-radius-md)',
                            borderBottomRightRadius: 'var(--border-radius-md)'
                          }}
                        >
                          {showPassword.new ? <EyeOff size={18} /> : <Eye size={18} />}
                        </Button>
                      </div>
                    </Form.Group>
                  </Col>
                </Row>

                <Button
                  variant="primary"
                  type="submit"
                  className="d-flex align-items-center"
                  style={{ borderRadius: 'var(--border-radius-md)' }}
                >
                  <Shield size={18} className="me-2" />
                  Mettre à jour le mot de passe
                </Button>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Modal pour prévisualiser la nouvelle image */}
      <Modal
        show={showImageModal}
        onHide={() => setShowImageModal(false)}
        centered
        size="md"
      >
        <Modal.Header
          closeButton
          style={{
            backgroundColor: 'var(--primary-color)',
            color: 'var(--white)',
            borderBottom: 'none'
          }}
        >
          <Modal.Title className="d-flex align-items-center">
            <Camera size={20} className="me-2" />
            Prévisualisation de la photo
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-center p-5">
          <Image
            src={previewImage}
            roundedCircle
            width={200}
            height={200}
            className="mb-4"
            style={{
              objectFit: 'cover',
              border: '4px solid var(--white)',
              boxShadow: 'var(--shadow-md)'
            }}
          />
          <p className="text-muted mb-0">
            Cette image sera utilisée comme photo de profil.
          </p>
        </Modal.Body>
        <Modal.Footer style={{ borderTop: 'none' }}>
          <Button
            variant="outline-secondary"
            onClick={() => setShowImageModal(false)}
            className="d-flex align-items-center"
            style={{ borderRadius: 'var(--border-radius-md)' }}
          >
            Annuler
          </Button>
          <Button
            variant="primary"
            onClick={handleSaveImage}
            className="d-flex align-items-center"
            style={{ borderRadius: 'var(--border-radius-md)' }}
          >
            <Save size={18} className="me-2" />
            Enregistrer
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

Parametres.defaultProps = {
  currentProfileImage: "https://randomuser.me/api/portraits/men/32.jpg",
  onProfileImageChange: () => console.warn('onProfileImageChange not provided'),
  onSubmit: () => {},
  isSubmitting: false,
  initialData: {}
};

export default Parametres;