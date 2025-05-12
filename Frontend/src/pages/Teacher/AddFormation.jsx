import React, { useState } from 'react';
import { Form, Button, Container, Row, Col, Card, Alert } from 'react-bootstrap';
import { Plus, Upload, Film, FileText, Image, Music, File } from 'lucide-react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../../config/api';

const AddFormation = () => {
  const navigate = useNavigate();
  const [formationData, setFormationData] = useState({
    title: '',
    description: '',
    category: '',
    price: '',
    duration: '',
    level: 'Débutant',
    language: 'Français',
    coverImage: null,
    coverImagePreview: null,
    modules: [{ title: '', description: '', duration: '', resources: [] }]
  });

  // State to track module resources
  const [moduleResources, setModuleResources] = useState([]);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const categories = [
    'Développement Web',
    'Développement Mobile',
    'Systèmes d\'Information',
    'Intelligence Artificielle',
    'Certifications Informatiques',
    'Design & UX',
    'Marketing Digital',
    'Business & Entrepreneuriat',
    'Leadership',
    'Langues'
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormationData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormationData(prev => ({
        ...prev,
        coverImage: file,
        coverImagePreview: URL.createObjectURL(file)
      }));
    }
  };

  const handleModuleChange = (index, field, value) => {
    const updatedModules = [...formationData.modules];
    updatedModules[index][field] = value;
    setFormationData(prev => ({
      ...prev,
      modules: updatedModules
    }));
  };

  const addModule = () => {
    setFormationData(prev => ({
      ...prev,
      modules: [...prev.modules, { title: '', description: '', duration: '', resources: [] }]
    }));
  };

  const removeModule = (index) => {
    const updatedModules = [...formationData.modules];
    updatedModules.splice(index, 1);

    // Also remove any resources associated with this module
    const updatedResources = moduleResources.filter(resource => resource.moduleIndex !== index);

    // Update indices for resources of modules that come after the removed one
    const adjustedResources = updatedResources.map(resource => {
      if (resource.moduleIndex > index) {
        return { ...resource, moduleIndex: resource.moduleIndex - 1 };
      }
      return resource;
    });

    setModuleResources(adjustedResources);
    setFormationData(prev => ({
      ...prev,
      modules: updatedModules
    }));
  };

  // Handle resource file selection
  const handleResourceUpload = (e, moduleIndex) => {
    const files = Array.from(e.target.files);

    files.forEach(file => {
      // Determine file type based on extension
      const extension = file.name.split('.').pop().toLowerCase();
      let fileType = 'other';

      if (['mp4', 'webm', 'ogg', 'mov'].includes(extension)) {
        fileType = 'video';
      } else if (extension === 'pdf') {
        fileType = 'pdf';
      } else if (['doc', 'docx', 'txt', 'ppt', 'pptx', 'xls', 'xlsx'].includes(extension)) {
        fileType = 'document';
      } else if (['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'].includes(extension)) {
        fileType = 'image';
      } else if (['mp3', 'wav', 'ogg'].includes(extension)) {
        fileType = 'audio';
      }

      // Create a resource object
      const newResource = {
        moduleIndex,
        fileName: file.name,
        name: file.name.split('.')[0], // Default name is the filename without extension
        type: fileType,
        file: file,
        size: file.size
      };

      // Add to moduleResources state
      setModuleResources(prev => [...prev, newResource]);
    });
  };

  // Remove a resource
  const removeResource = (moduleIndex, resourceIndex) => {
    // Find the resource to remove
    const resourceToRemove = moduleResources.find(
      (r, idx) => r.moduleIndex === moduleIndex && idx === resourceIndex
    );

    if (resourceToRemove) {
      // Filter out the resource
      const updatedResources = moduleResources.filter(
        (r, idx) => !(r.moduleIndex === moduleIndex && idx === resourceIndex)
      );

      setModuleResources(updatedResources);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();

      // Add basic formation info
      Object.keys(formationData).forEach(key => {
        if (key !== 'coverImage' && key !== 'coverImagePreview' && key !== 'modules' && formationData[key]) {
          formData.append(key, formationData[key]);
        }
      });

      // Add cover image
      if (formationData.coverImage) {
        formData.append('coverImage', formationData.coverImage);
      }

      // Add modules as JSON string (without the file objects)
      if (formationData.modules.length > 0) {
        // Create a clean version of modules without file objects
        const cleanModules = formationData.modules.map(module => ({
          title: module.title,
          description: module.description,
          duration: module.duration,
          // Don't include resources here, they'll be handled separately
        }));

        formData.append('modules', JSON.stringify(cleanModules));
      }

      // Add resource files and metadata
      if (moduleResources.length > 0) {
        // Add each resource file
        moduleResources.forEach(resource => {
          if (resource.file) {
            formData.append('resources', resource.file);
          }
        });

        // Add resource metadata
        const resourcesMetadata = moduleResources.map(resource => ({
          moduleIndex: resource.moduleIndex,
          name: resource.name,
          type: resource.type,
          fileName: resource.fileName
        }));

        formData.append('moduleResources', JSON.stringify(resourcesMetadata));
      }

      const response = await axios.post(`${API_BASE_URL}/api/formations`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.data.success) {
        setSuccess(true);
        setTimeout(() => {
          navigate('/dashboard-teacher');
        }, 2000);
      }
    } catch (err) {
      console.error('Error creating formation:', err);
      setError(err.response?.data?.message || 'Une erreur est survenue lors de la création de la formation');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Container fluid>
      <h2 className="mb-4">Ajouter une formation</h2>

      {error && <Alert variant="danger">{error}</Alert>}
      {success && <Alert variant="success">Formation créée avec succès!</Alert>}

      <Form onSubmit={handleSubmit}>
        <Row>
          <Col md={8}>
            <Card className="mb-4">
              <Card.Body>
                <Card.Title>Informations générales</Card.Title>

                <Form.Group className="mb-3">
                  <Form.Label>Titre de la formation</Form.Label>
                  <Form.Control
                    type="text"
                    name="title"
                    value={formationData.title}
                    onChange={handleChange}
                    required
                    placeholder="Ex: Formation Développeur Web Full Stack"
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Description</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={4}
                    name="description"
                    value={formationData.description}
                    onChange={handleChange}
                    required
                    placeholder="Décrivez le contenu et les objectifs de la formation"
                  />
                </Form.Group>

                <Card.Title className="mt-4">Modules de la formation</Card.Title>

                {formationData.modules.map((module, index) => (
                  <Card key={index} className="mb-3">
                    <Card.Body>
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <h6>Module {index + 1}</h6>
                        {formationData.modules.length > 1 && (
                          <Button
                            variant="outline-danger"
                            size="sm"
                            onClick={() => removeModule(index)}
                          >
                            Supprimer
                          </Button>
                        )}
                      </div>

                      <Form.Group className="mb-2">
                        <Form.Label>Titre du module</Form.Label>
                        <Form.Control
                          type="text"
                          value={module.title}
                          onChange={(e) => handleModuleChange(index, 'title', e.target.value)}
                          required
                          placeholder="Ex: Introduction à HTML/CSS"
                        />
                      </Form.Group>

                      <Form.Group className="mb-2">
                        <Form.Label>Description</Form.Label>
                        <Form.Control
                          as="textarea"
                          rows={2}
                          value={module.description}
                          onChange={(e) => handleModuleChange(index, 'description', e.target.value)}
                          required
                          placeholder="Décrivez le contenu de ce module"
                        />
                      </Form.Group>

                      <Form.Group className="mb-2">
                        <Form.Label>Durée (heures)</Form.Label>
                        <Form.Control
                          type="number"
                          value={module.duration}
                          onChange={(e) => handleModuleChange(index, 'duration', e.target.value)}
                          required
                          placeholder="Ex: 10"
                        />
                      </Form.Group>

                      {/* Resources Section */}
                      <Form.Group className="mb-2">
                        <Form.Label>Ressources</Form.Label>
                        <div className="d-flex align-items-center mb-2">
                          <Button
                            variant="outline-primary"
                            size="sm"
                            onClick={() => document.getElementById(`resourceInput-${index}`).click()}
                            className="me-2"
                          >
                            <Upload size={16} className="me-1" />
                            Ajouter des ressources
                          </Button>
                          <Form.Control
                            type="file"
                            id={`resourceInput-${index}`}
                            onChange={(e) => handleResourceUpload(e, index)}
                            multiple
                            style={{ display: 'none' }}
                          />
                          <small className="text-muted">
                            Vidéos, PDFs, documents, images, etc.
                          </small>
                        </div>

                        {/* Display uploaded resources */}
                        {moduleResources.filter(resource => resource.moduleIndex === index).length > 0 && (
                          <div className="resource-list mt-2">
                            <h6>Ressources téléchargées:</h6>
                            <ul className="list-group">
                              {moduleResources
                                .filter(resource => resource.moduleIndex === index)
                                .map((resource, resourceIndex) => (
                                  <li key={resourceIndex} className="list-group-item d-flex justify-content-between align-items-center">
                                    <div>
                                      <span className="me-2">
                                        {resource.type === 'video' && <Film size={16} />}
                                        {resource.type === 'pdf' && <FileText size={16} />}
                                        {resource.type === 'document' && <FileText size={16} />}
                                        {resource.type === 'image' && <Image size={16} />}
                                        {resource.type === 'audio' && <Music size={16} />}
                                        {resource.type === 'other' && <File size={16} />}
                                      </span>
                                      <span>{resource.name}</span>
                                      <small className="text-muted ms-2">
                                        ({(resource.size / 1024 / 1024).toFixed(2)} MB)
                                      </small>
                                    </div>
                                    <Button
                                      variant="outline-danger"
                                      size="sm"
                                      onClick={() => removeResource(index, resourceIndex)}
                                    >
                                      Supprimer
                                    </Button>
                                  </li>
                                ))}
                            </ul>
                          </div>
                        )}
                      </Form.Group>
                    </Card.Body>
                  </Card>
                ))}

                <Button
                  variant="outline-primary"
                  onClick={addModule}
                  className="mt-2"
                >
                  <Plus size={16} className="me-1" />
                  Ajouter un module
                </Button>
              </Card.Body>
            </Card>
          </Col>

          <Col md={4}>
            <Card className="mb-4">
              <Card.Body>
                <Card.Title>Paramètres de la formation</Card.Title>

                <Form.Group className="mb-3">
                  <Form.Label>Catégorie</Form.Label>
                  <Form.Select
                    name="category"
                    value={formationData.category}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Sélectionnez une catégorie</option>
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </Form.Select>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Prix (€)</Form.Label>
                  <Form.Control
                    type="number"
                    name="price"
                    value={formationData.price}
                    onChange={handleChange}
                    required
                    placeholder="Ex: 1200"
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Durée totale (mois)</Form.Label>
                  <Form.Control
                    type="number"
                    name="duration"
                    value={formationData.duration}
                    onChange={handleChange}
                    required
                    placeholder="Ex: 6"
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Niveau</Form.Label>
                  <Form.Select
                    name="level"
                    value={formationData.level}
                    onChange={handleChange}
                    required
                  >
                    <option value="Débutant">Débutant</option>
                    <option value="Intermédiaire">Intermédiaire</option>
                    <option value="Avancé">Avancé</option>
                    <option value="Expert">Expert</option>
                  </Form.Select>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Langue</Form.Label>
                  <Form.Select
                    name="language"
                    value={formationData.language}
                    onChange={handleChange}
                    required
                  >
                    <option value="Français">Français</option>
                    <option value="Anglais">Anglais</option>
                    <option value="Arabe">Arabe</option>
                    <option value="Espagnol">Espagnol</option>
                  </Form.Select>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Image de couverture</Form.Label>
                  <div className="d-flex align-items-center">
                    <Button
                      variant="outline-secondary"
                      onClick={() => document.getElementById('coverImageInput').click()}
                      className="me-2"
                    >
                      <Upload size={16} className="me-1" />
                      Choisir une image
                    </Button>
                    <Form.Control
                      type="file"
                      id="coverImageInput"
                      onChange={handleImageChange}
                      accept="image/*"
                      style={{ display: 'none' }}
                    />
                    <span className="text-muted small">
                      {formationData.coverImage ? formationData.coverImage.name : 'Aucun fichier choisi'}
                    </span>
                  </div>

                  {formationData.coverImagePreview && (
                    <div className="mt-2">
                      <img
                        src={formationData.coverImagePreview}
                        alt="Aperçu"
                        className="img-thumbnail"
                        style={{ maxHeight: '150px' }}
                      />
                    </div>
                  )}
                </Form.Group>
              </Card.Body>
            </Card>

            <div className="d-grid gap-2">
              <Button
                variant="primary"
                type="submit"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Création en cours...' : 'Créer la formation'}
              </Button>
              <Button
                variant="outline-secondary"
                onClick={() => navigate('/dashboard-teacher')}
              >
                Annuler
              </Button>
            </div>
          </Col>
        </Row>
      </Form>
    </Container>
  );
};

export default AddFormation;
