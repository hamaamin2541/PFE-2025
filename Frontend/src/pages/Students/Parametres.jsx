import React, { useState, useRef } from 'react';
import { Card, Form, Button, Image, Modal } from 'react-bootstrap';
import { Upload } from 'lucide-react';

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
    await onSubmit(formData);
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
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
        alert('Mot de passe mis à jour avec succès!');
        setPasswordData({ currentPassword: '', newPassword: '' });
      } else {
        throw new Error(data.message || 'Erreur lors du changement de mot de passe');
      }
    } catch (error) {
      alert(error.message);
    }
  };

  return (
    <div className="teacher-settings">
      <h3>Paramètres du compte</h3>
      
      <Card className="mb-4">
        <Card.Body>
          <Card.Title>Photo de profil</Card.Title>
          <div className="d-flex align-items-center mb-3">
            <Image 
              src={previewImage} 
              roundedCircle 
              width={80} 
              height={80} 
              className="me-4"
            />
            <div>
              <Button 
                variant="outline-primary" 
                onClick={() => fileInputRef.current.click()}
              >
                <Upload size={16} className="me-2" />
                Changer la photo
              </Button>
              <Form.Control
                type="file"
                ref={fileInputRef}
                onChange={handleImageChange}
                accept="image/*"
                style={{ display: 'none' }}
              />
              <p className="text-muted mt-2 mb-0">
                Taille recommandée: 200x200 px
              </p>
            </div>
          </div>
        </Card.Body>
      </Card>

      <Card className="mb-4">
        <Card.Body>
          <Card.Title>Informations personnelles</Card.Title>
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Nom complet</Form.Label>
              <Form.Control
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Email</Form.Label>
              <Form.Control
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
              />
            </Form.Group>

            <Button 
              variant="primary" 
              type="submit" 
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Enregistrement...' : 'Enregistrer les modifications'}
            </Button>
          </Form>
        </Card.Body>
      </Card>

      <Card>
        <Card.Body>
          <Card.Title>Changer le mot de passe</Card.Title>
          <Form onSubmit={handlePasswordChange}>
            <Form.Group className="mb-3">
              <Form.Label>Mot de passe actuel</Form.Label>
              <Form.Control
                type="password"
                value={passwordData.currentPassword}
                onChange={(e) => setPasswordData({
                  ...passwordData,
                  currentPassword: e.target.value
                })}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Nouveau mot de passe</Form.Label>
              <Form.Control
                type="password"
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData({
                  ...passwordData,
                  newPassword: e.target.value
                })}
              />
            </Form.Group>
            <Button variant="primary" type="submit">
              Mettre à jour le mot de passe
            </Button>
          </Form>
        </Card.Body>
      </Card>

      {/* Modal pour prévisualiser la nouvelle image */}
      <Modal show={showImageModal} onHide={() => setShowImageModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Prévisualisation de la photo</Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-center">
          <Image 
            src={previewImage} 
            roundedCircle 
            width={200} 
            height={200} 
          />
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowImageModal(false)}>
            Annuler
          </Button>
          <Button variant="primary" onClick={handleSaveImage}>
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