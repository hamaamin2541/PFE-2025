import React, { useState, useEffect } from 'react';
import { Form, Button, Container, Row, Col, Card, Alert } from 'react-bootstrap';
import { Plus, Upload, Film, FileText, Image, Music, File, Trash2 } from 'lucide-react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../../config/api';

const EditFormation = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    modules: []
  });
  
  // State to track module resources
  const [moduleResources, setModuleResources] = useState([]);
  const [existingResources, setExistingResources] = useState([]);

  useEffect(() => {
    const fetchFormation = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        const response = await axios.get(`${API_BASE_URL}/api/formations/${id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.data.success) {
          const formation = response.data.data;
          
          // Extract existing resources from modules
          const resources = [];
          formation.modules.forEach((module, moduleIndex) => {
            if (module.resources && module.resources.length > 0) {
              module.resources.forEach(resource => {
                resources.push({
                  ...resource,
                  moduleIndex,
                  isExisting: true
                });
              });
            }
          });
          
          setExistingResources(resources);
          
          setFormationData({
            title: formation.title,
            description: formation.description,
            category: formation.category,
            price: formation.price,
            duration: formation.duration,
            level: formation.level,
            language: formation.language,
            coverImagePreview: formation.coverImage ? `${API_BASE_URL}/${formation.coverImage}` : null,
            modules: formation.modules || []
          });
        } else {
          setError('Erreur lors de la récupération de la formation');
        }
      } catch (err) {
        console.error('Error fetching formation:', err);
        setError(err.response?.data?.message || 'Une erreur est survenue lors de la récupération de la formation');
      } finally {
        setLoading(false);
      }
    };

    fetchFormation();
  }, [id]);

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
    updatedModules[index] = {
      ...updatedModules[index],
      [field]: value
    };
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
    const updatedExistingResources = existingResources.filter(resource => resource.moduleIndex !== index);
    
    // Update indices for resources of modules that come after the removed one
    const adjustedResources = updatedResources.map(resource => {
      if (resource.moduleIndex > index) {
        return { ...resource, moduleIndex: resource.moduleIndex - 1 };
      }
      return resource;
    });
    
    const adjustedExistingResources = updatedExistingResources.map(resource => {
      if (resource.moduleIndex > index) {
        return { ...resource, moduleIndex: resource.moduleIndex - 1 };
      }
      return resource;
    });
    
    setModuleResources(adjustedResources);
    setExistingResources(adjustedExistingResources);
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
  
  // Remove a new resource
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
  
  // Remove an existing resource
  const removeExistingResource = (moduleIndex, resourceName) => {
    const updatedResources = existingResources.filter(
      resource => !(resource.moduleIndex === moduleIndex && resource.name === resourceName)
    );
    
    setExistingResources(updatedResources);
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

      // Add cover image if changed
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
      
      // Add existing resources metadata
      if (existingResources.length > 0) {
        formData.append('existingResources', JSON.stringify(existingResources));
        formData.append('keepExistingResources', 'true');
      }

      const response = await axios.put(`${API_BASE_URL}/api/formations/${id}`, formData, {
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
      console.error('Error updating formation:', err);
      setError(err.response?.data?.message || 'Une erreur est survenue lors de la mise à jour de la formation');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return <Container className="mt-5"><div>Chargement...</div></Container>;
  }

  return (
    <Container className="mt-5 mb-5">
      <h2 className="mb-4">Modifier la formation</h2>

      {error && <Alert variant="danger">{error}</Alert>}
      {success && <Alert variant="success">Formation mise à jour avec succès!</Alert>}

      <Form onSubmit={handleSubmit}>
        <Row>
          <Col md={8}>
            <Card className="mb-4">
              <Card.Body>
                <h4 className="mb-3">Informations générales</h4>
                <Form.Group className="mb-3">
                  <Form.Label>Titre</Form.Label>
                  <Form.Control
                    type="text"
                    name="title"
                    value={formationData.title}
                    onChange={handleChange}
                    required
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Description</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    name="description"
                    value={formationData.description}
                    onChange={handleChange}
                    required
                  />
                </Form.Group>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Catégorie</Form.Label>
                      <Form.Control
                        type="text"
                        name="category"
                        value={formationData.category}
                        onChange={handleChange}
                        required
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Prix (€)</Form.Label>
                      <Form.Control
                        type="number"
                        name="price"
                        value={formationData.price}
                        onChange={handleChange}
                        required
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Row>
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>Durée</Form.Label>
                      <Form.Control
                        type="text"
                        name="duration"
                        value={formationData.duration}
                        onChange={handleChange}
                        required
                        placeholder="Ex: 10 heures"
                      />
                    </Form.Group>
                  </Col>
                  <Col md={4}>
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
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={4}>
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
                      </Form.Select>
                    </Form.Group>
                  </Col>
                </Row>
              </Card.Body>
            </Card>

            <Card className="mb-4">
              <Card.Body>
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h4>Modules</h4>
                  <Button variant="primary" onClick={addModule}>
                    <Plus size={16} className="me-1" />
                    Ajouter un module
                  </Button>
                </div>

                {formationData.modules.map((module, index) => (
                  <Card key={index} className="mb-3">
                    <Card.Body>
                      <div className="d-flex justify-content-between align-items-center mb-3">
                        <h5>Module {index + 1}</h5>
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => removeModule(index)}
                        >
                          <Trash2 size={16} className="me-1" />
                          Supprimer
                        </Button>
                      </div>

                      <Form.Group className="mb-2">
                        <Form.Label>Titre</Form.Label>
                        <Form.Control
                          type="text"
                          value={module.title}
                          onChange={(e) => handleModuleChange(index, 'title', e.target.value)}
                          required
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
                        
                        {/* Display existing resources */}
                        {existingResources.filter(resource => resource.moduleIndex === index).length > 0 && (
                          <div className="resource-list mt-2">
                            <h6>Ressources existantes:</h6>
                            <ul className="list-group">
                              {existingResources
                                .filter(resource => resource.moduleIndex === index)
                                .map((resource, resourceIndex) => (
                                  <li key={`existing-${resourceIndex}`} className="list-group-item d-flex justify-content-between align-items-center">
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
                                    </div>
                                    <Button
                                      variant="outline-danger"
                                      size="sm"
                                      onClick={() => removeExistingResource(index, resource.name)}
                                    >
                                      Supprimer
                                    </Button>
                                  </li>
                                ))}
                            </ul>
                          </div>
                        )}
                        
                        {/* Display newly uploaded resources */}
                        {moduleResources.filter(resource => resource.moduleIndex === index).length > 0 && (
                          <div className="resource-list mt-2">
                            <h6>Nouvelles ressources:</h6>
                            <ul className="list-group">
                              {moduleResources
                                .filter(resource => resource.moduleIndex === index)
                                .map((resource, resourceIndex) => (
                                  <li key={`new-${resourceIndex}`} className="list-group-item d-flex justify-content-between align-items-center">
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
              </Card.Body>
            </Card>
          </Col>

          <Col md={4}>
            <Card className="mb-4">
              <Card.Body>
                <h4 className="mb-3">Image de couverture</h4>
                <Form.Group className="mb-3">
                  <Form.Label>Image</Form.Label>
                  <Form.Control
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                  />
                  <Form.Text className="text-muted">
                    Format recommandé: 16:9, max 2MB
                  </Form.Text>
                </Form.Group>

                {formationData.coverImagePreview && (
                  <div className="mt-3">
                    <p>Aperçu:</p>
                    <img
                      src={formationData.coverImagePreview}
                      alt="Cover preview"
                      className="img-fluid rounded"
                    />
                  </div>
                )}
              </Card.Body>
            </Card>

            <div className="d-grid gap-2">
              <Button
                variant="primary"
                type="submit"
                disabled={isSubmitting}
                className="py-2"
              >
                {isSubmitting ? 'Mise à jour...' : 'Mettre à jour la formation'}
              </Button>
              <Button
                variant="outline-secondary"
                onClick={() => navigate('/dashboard-teacher')}
                className="py-2"
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

export default EditFormation;
