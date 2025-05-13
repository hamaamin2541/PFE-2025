import React, { useState, useEffect } from 'react';
import { Container, Card, Row, Col, Button, Form, Alert, Spinner, Badge, ListGroup, Modal } from 'react-bootstrap';
import { ArrowLeft, Save, Trash2, Plus, Edit, X, Download, FileText, Video, Image, File } from 'lucide-react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../../../config/api';

const FormationDetail = ({ editMode }) => {
  const [formation, setFormation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [categories, setCategories] = useState([]);
  const [showModuleModal, setShowModuleModal] = useState(false);
  const [currentModule, setCurrentModule] = useState({
    title: '',
    description: '',
    duration: '',
    resources: []
  });
  const [editingModuleIndex, setEditingModuleIndex] = useState(-1);
  const [showResourceModal, setShowResourceModal] = useState(false);
  const [currentResource, setCurrentResource] = useState({
    name: '',
    type: 'pdf',
    file: null
  });
  const [editingResourceIndex, setEditingResourceIndex] = useState(-1);
  const [currentModuleIndex, setCurrentModuleIndex] = useState(-1);
  
  const { id } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    fetchFormation();
    fetchCategories();
  }, [id]);

  const fetchFormation = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${API_BASE_URL}/api/formations/${id}`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );

      if (response.data.success) {
        setFormation(response.data.data);
      } else {
        setError('Erreur lors du chargement de la formation');
      }
    } catch (err) {
      console.error('Error fetching formation:', err);
      setError('Erreur lors du chargement de la formation');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${API_BASE_URL}/api/categories`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );

      if (response.data.success) {
        setCategories(response.data.data);
      }
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormation(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleModuleInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentModule(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleResourceInputChange = (e) => {
    const { name, value, files } = e.target;
    
    if (name === 'file' && files && files.length > 0) {
      setCurrentResource(prev => ({
        ...prev,
        file: files[0]
      }));
    } else {
      setCurrentResource(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleAddModule = () => {
    setCurrentModule({
      title: '',
      description: '',
      duration: '',
      resources: []
    });
    setEditingModuleIndex(-1);
    setShowModuleModal(true);
  };

  const handleEditModule = (index) => {
    setCurrentModule({...formation.modules[index]});
    setEditingModuleIndex(index);
    setShowModuleModal(true);
  };

  const handleDeleteModule = (index) => {
    const updatedModules = [...formation.modules];
    updatedModules.splice(index, 1);
    setFormation(prev => ({
      ...prev,
      modules: updatedModules
    }));
  };

  const handleSaveModule = () => {
    if (editingModuleIndex >= 0) {
      // Edit existing module
      const updatedModules = [...formation.modules];
      updatedModules[editingModuleIndex] = currentModule;
      setFormation(prev => ({
        ...prev,
        modules: updatedModules
      }));
    } else {
      // Add new module
      setFormation(prev => ({
        ...prev,
        modules: [...prev.modules, currentModule]
      }));
    }
    setShowModuleModal(false);
  };

  const handleAddResource = (moduleIndex) => {
    setCurrentResource({
      name: '',
      type: 'pdf',
      file: null
    });
    setEditingResourceIndex(-1);
    setCurrentModuleIndex(moduleIndex);
    setShowResourceModal(true);
  };

  const handleEditResource = (moduleIndex, resourceIndex) => {
    const resource = formation.modules[moduleIndex].resources[resourceIndex];
    setCurrentResource({
      name: resource.name,
      type: resource.type,
      file: null // Can't edit file, only replace
    });
    setEditingResourceIndex(resourceIndex);
    setCurrentModuleIndex(moduleIndex);
    setShowResourceModal(true);
  };

  const handleDeleteResource = (moduleIndex, resourceIndex) => {
    const updatedModules = [...formation.modules];
    updatedModules[moduleIndex].resources.splice(resourceIndex, 1);
    setFormation(prev => ({
      ...prev,
      modules: updatedModules
    }));
  };

  const handleSaveResource = () => {
    if (!currentResource.name || !currentResource.type) {
      setError('Veuillez remplir tous les champs obligatoires');
      return;
    }

    const updatedModules = [...formation.modules];
    
    if (editingResourceIndex >= 0) {
      // Edit existing resource
      updatedModules[currentModuleIndex].resources[editingResourceIndex] = {
        ...updatedModules[currentModuleIndex].resources[editingResourceIndex],
        name: currentResource.name,
        type: currentResource.type,
        // Keep the existing file if no new file is selected
        ...(currentResource.file && { file: currentResource.file })
      };
    } else {
      // Add new resource
      if (!currentResource.file) {
        setError('Veuillez sélectionner un fichier');
        return;
      }
      
      // For new resources, we'll need to handle file upload when saving the formation
      updatedModules[currentModuleIndex].resources.push({
        name: currentResource.name,
        type: currentResource.type,
        file: currentResource.file,
        isNewFile: true // Mark as new file for later processing
      });
    }
    
    setFormation(prev => ({
      ...prev,
      modules: updatedModules
    }));
    
    setShowResourceModal(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formation.title || !formation.description || !formation.category || !formation.price || !formation.duration || formation.modules.length === 0) {
      setError('Veuillez remplir tous les champs obligatoires et ajouter au moins un module');
      return;
    }
    
    try {
      setSaving(true);
      const token = localStorage.getItem('token');
      
      // Create FormData for file uploads
      const formData = new FormData();
      formData.append('title', formation.title);
      formData.append('description', formation.description);
      formData.append('category', formation.category);
      formData.append('price', formation.price);
      formData.append('duration', formation.duration);
      formData.append('level', formation.level);
      formData.append('language', formation.language);
      
      // Handle modules and resources
      const modulesWithoutNewFiles = formation.modules.map(module => {
        // Filter out resources with isNewFile flag for separate handling
        const filteredResources = module.resources.filter(resource => !resource.isNewFile);
        return {
          ...module,
          resources: filteredResources
        };
      });
      
      formData.append('modules', JSON.stringify(modulesWithoutNewFiles));
      
      // Handle new resource files
      formation.modules.forEach((module, moduleIndex) => {
        module.resources.forEach((resource, resourceIndex) => {
          if (resource.isNewFile && resource.file) {
            formData.append('resources', resource.file);
            formData.append('moduleResources', JSON.stringify({
              moduleIndex,
              resourceIndex,
              name: resource.name,
              type: resource.type,
              fileName: resource.file.name
            }));
          }
        });
      });
      
      // If there's a new cover image
      if (formation.newCoverImage) {
        formData.append('coverImage', formation.newCoverImage);
      }
      
      const response = await axios.put(
        `${API_BASE_URL}/api/formations/${id}`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );
      
      if (response.data.success) {
        setSuccess('Formation mise à jour avec succès');
        setTimeout(() => {
          navigate('/admin/formations');
        }, 2000);
      } else {
        setError('Erreur lors de la mise à jour de la formation');
      }
    } catch (err) {
      console.error('Error updating formation:', err);
      setError('Erreur lors de la mise à jour de la formation');
    } finally {
      setSaving(false);
    }
  };

  const handleCoverImageChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setFormation(prev => ({
        ...prev,
        newCoverImage: e.target.files[0],
        coverImagePreview: URL.createObjectURL(e.target.files[0])
      }));
    }
  };

  if (loading) {
    return (
      <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '80vh' }}>
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Chargement...</span>
        </Spinner>
      </Container>
    );
  }

  if (error && !formation) {
    return (
      <Container className="mt-4">
        <Alert variant="danger">{error}</Alert>
        <Button as={Link} to="/admin/formations" variant="secondary">
          <ArrowLeft size={16} className="me-2" />
          Retour aux formations
        </Button>
      </Container>
    );
  }

  if (!formation) {
    return (
      <Container className="mt-4">
        <Alert variant="danger">Formation non trouvée</Alert>
        <Button as={Link} to="/admin/formations" variant="secondary">
          <ArrowLeft size={16} className="me-2" />
          Retour aux formations
        </Button>
      </Container>
    );
  }

  return (
    <Container fluid className="py-4">
      {success && (
        <Alert variant="success" onClose={() => setSuccess(null)} dismissible>
          {success}
        </Alert>
      )}
      
      {error && (
        <Alert variant="danger" onClose={() => setError(null)} dismissible>
          {error}
        </Alert>
      )}
      
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="mb-0">
          {editMode ? 'Modifier la formation' : 'Détails de la formation'}
        </h4>
        <div>
          <Button as={Link} to="/admin/formations" variant="outline-secondary" className="me-2">
            <ArrowLeft size={16} className="me-2" />
            Retour
          </Button>
          {editMode && (
            <Button variant="primary" onClick={handleSubmit} disabled={saving}>
              {saving ? (
                <>
                  <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-2" />
                  Enregistrement...
                </>
              ) : (
                <>
                  <Save size={16} className="me-2" />
                  Enregistrer
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      <Card className="shadow-sm mb-4">
        <Card.Body>
          <Form>
            <Row>
              <Col md={8}>
                <Form.Group className="mb-3">
                  <Form.Label>Titre</Form.Label>
                  <Form.Control
                    type="text"
                    name="title"
                    value={formation.title}
                    onChange={handleInputChange}
                    disabled={!editMode}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Catégorie</Form.Label>
                  {editMode ? (
                    <Form.Select
                      name="category"
                      value={formation.category}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="">Sélectionner une catégorie</option>
                      {categories.map(category => (
                        <option key={category._id} value={category.name}>
                          {category.name}
                        </option>
                      ))}
                    </Form.Select>
                  ) : (
                    <Form.Control
                      type="text"
                      value={formation.category}
                      disabled
                    />
                  )}
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={4}
                name="description"
                value={formation.description}
                onChange={handleInputChange}
                disabled={!editMode}
                required
              />
            </Form.Group>

            <Row>
              <Col md={3}>
                <Form.Group className="mb-3">
                  <Form.Label>Prix (€)</Form.Label>
                  <Form.Control
                    type="number"
                    min="0"
                    step="0.01"
                    name="price"
                    value={formation.price}
                    onChange={handleInputChange}
                    disabled={!editMode}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group className="mb-3">
                  <Form.Label>Durée</Form.Label>
                  <Form.Control
                    type="text"
                    name="duration"
                    value={formation.duration}
                    onChange={handleInputChange}
                    disabled={!editMode}
                    placeholder="ex: 10 heures"
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group className="mb-3">
                  <Form.Label>Niveau</Form.Label>
                  {editMode ? (
                    <Form.Select
                      name="level"
                      value={formation.level}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="Débutant">Débutant</option>
                      <option value="Intermédiaire">Intermédiaire</option>
                      <option value="Avancé">Avancé</option>
                      <option value="Expert">Expert</option>
                    </Form.Select>
                  ) : (
                    <Form.Control
                      type="text"
                      value={formation.level}
                      disabled
                    />
                  )}
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group className="mb-3">
                  <Form.Label>Langue</Form.Label>
                  {editMode ? (
                    <Form.Select
                      name="language"
                      value={formation.language}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="Français">Français</option>
                      <option value="Anglais">Anglais</option>
                      <option value="Arabe">Arabe</option>
                    </Form.Select>
                  ) : (
                    <Form.Control
                      type="text"
                      value={formation.language}
                      disabled
                    />
                  )}
                </Form.Group>
              </Col>
            </Row>

            <Row className="mb-4">
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Image de couverture</Form.Label>
                  {editMode && (
                    <Form.Control
                      type="file"
                      accept="image/*"
                      onChange={handleCoverImageChange}
                      className="mb-2"
                    />
                  )}
                  {(formation.coverImagePreview || formation.coverImage) && (
                    <div className="mt-2">
                      <img
                        src={formation.coverImagePreview || `${API_BASE_URL}/${formation.coverImage}`}
                        alt="Couverture"
                        style={{ maxWidth: '100%', maxHeight: '200px', objectFit: 'cover' }}
                        className="border rounded"
                      />
                    </div>
                  )}
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Professeur</Form.Label>
                  <div className="d-flex align-items-center">
                    {formation.teacher && (
                      <>
                        <div className="me-3">
                          {formation.teacher.profileImage ? (
                            <img
                              src={`${API_BASE_URL}/${formation.teacher.profileImage}`}
                              alt={formation.teacher.fullName}
                              style={{ width: '50px', height: '50px', borderRadius: '50%', objectFit: 'cover' }}
                            />
                          ) : (
                            <div
                              style={{
                                width: '50px',
                                height: '50px',
                                borderRadius: '50%',
                                backgroundColor: '#4361ee',
                                color: 'white',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 'bold'
                              }}
                            >
                              {formation.teacher.fullName.charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="fw-bold">{formation.teacher.fullName}</div>
                          <div className="text-muted small">{formation.teacher.email}</div>
                        </div>
                      </>
                    )}
                  </div>
                </Form.Group>
              </Col>
            </Row>

            <h5 className="mb-3">Modules</h5>
            {editMode && (
              <div className="mb-3">
                <Button variant="outline-primary" onClick={handleAddModule}>
                  <Plus size={16} className="me-2" />
                  Ajouter un module
                </Button>
              </div>
            )}

            {formation.modules.length === 0 ? (
              <Alert variant="info">Aucun module n'a été ajouté à cette formation.</Alert>
            ) : (
              <ListGroup className="mb-4">
                {formation.modules.map((module, index) => (
                  <ListGroup.Item key={index} className="border rounded mb-3 shadow-sm">
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <div>
                        <h6 className="mb-1">{module.title}</h6>
                        <div className="text-muted small">Durée: {module.duration}</div>
                      </div>
                      {editMode && (
                        <div>
                          <Button variant="outline-secondary" size="sm" className="me-2" onClick={() => handleEditModule(index)}>
                            <Edit size={14} />
                          </Button>
                          <Button variant="outline-danger" size="sm" onClick={() => handleDeleteModule(index)}>
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      )}
                    </div>
                    <p className="mb-3">{module.description}</p>
                    
                    <div>
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <h6 className="mb-0">Ressources</h6>
                        {editMode && (
                          <Button variant="outline-primary" size="sm" onClick={() => handleAddResource(index)}>
                            <Plus size={14} className="me-1" />
                            Ajouter
                          </Button>
                        )}
                      </div>
                      
                      {module.resources.length === 0 ? (
                        <div className="text-muted small">Aucune ressource disponible</div>
                      ) : (
                        <ListGroup variant="flush">
                          {module.resources.map((resource, resourceIndex) => (
                            <ListGroup.Item key={resourceIndex} className="py-2 px-0 border-0">
                              <div className="d-flex justify-content-between align-items-center">
                                <div className="d-flex align-items-center">
                                  {resource.type === 'video' ? (
                                    <Video size={18} className="me-2 text-primary" />
                                  ) : resource.type === 'pdf' ? (
                                    <FileText size={18} className="me-2 text-danger" />
                                  ) : resource.type === 'image' ? (
                                    <Image size={18} className="me-2 text-success" />
                                  ) : (
                                    <File size={18} className="me-2 text-secondary" />
                                  )}
                                  <span>{resource.name}</span>
                                </div>
                                <div>
                                  {!editMode && (
                                    <Button variant="outline-primary" size="sm" className="me-2" as="a" href={`${API_BASE_URL}/${resource.file}`} target="_blank" download>
                                      <Download size={14} />
                                    </Button>
                                  )}
                                  {editMode && (
                                    <>
                                      <Button variant="outline-secondary" size="sm" className="me-2" onClick={() => handleEditResource(index, resourceIndex)}>
                                        <Edit size={14} />
                                      </Button>
                                      <Button variant="outline-danger" size="sm" onClick={() => handleDeleteResource(index, resourceIndex)}>
                                        <X size={14} />
                                      </Button>
                                    </>
                                  )}
                                </div>
                              </div>
                            </ListGroup.Item>
                          ))}
                        </ListGroup>
                      )}
                    </div>
                  </ListGroup.Item>
                ))}
              </ListGroup>
            )}
          </Form>
        </Card.Body>
      </Card>

      {/* Module Modal */}
      <Modal show={showModuleModal} onHide={() => setShowModuleModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>{editingModuleIndex >= 0 ? 'Modifier le module' : 'Ajouter un module'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Titre</Form.Label>
              <Form.Control
                type="text"
                name="title"
                value={currentModule.title}
                onChange={handleModuleInputChange}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                name="description"
                value={currentModule.description}
                onChange={handleModuleInputChange}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Durée</Form.Label>
              <Form.Control
                type="text"
                name="duration"
                value={currentModule.duration}
                onChange={handleModuleInputChange}
                placeholder="ex: 2 heures"
                required
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModuleModal(false)}>
            Annuler
          </Button>
          <Button variant="primary" onClick={handleSaveModule}>
            Enregistrer
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Resource Modal */}
      <Modal show={showResourceModal} onHide={() => setShowResourceModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>{editingResourceIndex >= 0 ? 'Modifier la ressource' : 'Ajouter une ressource'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Nom</Form.Label>
              <Form.Control
                type="text"
                name="name"
                value={currentResource.name}
                onChange={handleResourceInputChange}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Type</Form.Label>
              <Form.Select
                name="type"
                value={currentResource.type}
                onChange={handleResourceInputChange}
                required
              >
                <option value="pdf">PDF</option>
                <option value="video">Vidéo</option>
                <option value="image">Image</option>
                <option value="document">Document</option>
                <option value="audio">Audio</option>
                <option value="other">Autre</option>
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Fichier</Form.Label>
              <Form.Control
                type="file"
                name="file"
                onChange={handleResourceInputChange}
                required={editingResourceIndex < 0}
              />
              {editingResourceIndex >= 0 && (
                <Form.Text className="text-muted">
                  Laissez vide pour conserver le fichier actuel
                </Form.Text>
              )}
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowResourceModal(false)}>
            Annuler
          </Button>
          <Button variant="primary" onClick={handleSaveResource}>
            Enregistrer
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default FormationDetail;
