import React, { useState, useEffect, useRef } from 'react';
import { Container, Form, Button, Alert, Row, Col, Card, Badge } from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';
import { Upload, Video, BookOpen, FileText, Image as ImageIcon, File, X, Plus } from 'lucide-react';
import axios from 'axios';
import { API_BASE_URL } from '../../config/api';

const EditCourse = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);
  const [sections, setSections] = useState([]);

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
  const languages = ['Français', 'Anglais', 'Arabe'];
  const levels = ['Débutant', 'Intermédiaire', 'Avancé'];

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${API_BASE_URL}/api/courses/${id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.data.success) {
          setCourse(response.data.data);
          setSections(response.data.data.sections || []);
        } else {
          setError('Failed to fetch course details');
        }
      } catch (err) {
        console.error('Error fetching course:', err);
        setError(err.response?.data?.message || 'Failed to fetch course');
        if (err.response?.status === 404) {
          navigate('/dashboard-teacher');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchCourse();
  }, [id, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();

      // Add basic course info
      formData.append('title', course.title);
      formData.append('description', course.description);
      formData.append('category', course.category);
      formData.append('price', course.price);
      formData.append('language', course.language);
      formData.append('level', course.level);

      // Add cover image if changed
      if (course.newCoverImage) {
        formData.append('coverImage', course.newCoverImage);
      }

      // Add sections data
      if (sections.length > 0) {
        formData.append('sections', JSON.stringify(sections));
      }

      const response = await axios.put(
        `${API_BASE_URL}/api/courses/${id}`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      if (response.data.success) {
        navigate('/dashboard-teacher');
      }
    } catch (err) {
      console.error('Update error:', err);
      setError(err.response?.data?.message || 'Failed to update course');
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setCourse(prev => ({
        ...prev,
        newCoverImage: file,
        coverImagePreview: URL.createObjectURL(file)
      }));
    }
  };

  const handleAddSection = () => {
    setSections([...sections, {
      title: '',
      description: '',
      resources: []
    }]);
  };

  const handleRemoveSection = (index) => {
    const updatedSections = sections.filter((_, i) => i !== index);
    setSections(updatedSections);
  };

  const handleSectionChange = (index, e) => {
    const updatedSections = [...sections];
    updatedSections[index][e.target.name] = e.target.value;
    setSections(updatedSections);
  };

  const handleFileUpload = (sectionIndex, type, e) => {
    const files = Array.from(e.target.files);
    const validFiles = files.filter(file => {
      // Add your file validation logic here
      return true;
    });

    if (validFiles.length > 0) {
      const updatedSections = [...sections];
      validFiles.forEach(file => {
        updatedSections[sectionIndex].resources.push({
          file,
          type,
          name: file.name,
          size: file.size
        });
      });
      setSections(updatedSections);
    }
  };

  const handleRemoveResource = (sectionIndex, resourceIndex) => {
    const updatedSections = [...sections];
    updatedSections[sectionIndex].resources.splice(resourceIndex, 1);
    setSections(updatedSections);
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <Alert variant="danger">{error}</Alert>;
  if (!course) return <Alert variant="warning">Course not found</Alert>;

  return (
    <Container className="py-4">
      <h2>Modifier le cours</h2>
      <Form onSubmit={handleSubmit}>
        <Row>
          <Col md={8}>
            <Card className="mb-4">
              <Card.Body>
                <Card.Title className="d-flex align-items-center">
                  <BookOpen size={20} className="me-2" />
                  Informations de base
                </Card.Title>

                <Form.Group className="mb-3">
                  <Form.Label>Titre du cours</Form.Label>
                  <Form.Control
                    type="text"
                    value={course?.title || ''}
                    onChange={(e) => setCourse({...course, title: e.target.value})}
                    required
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Description</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={5}
                    value={course?.description || ''}
                    onChange={(e) => setCourse({...course, description: e.target.value})}
                    required
                  />
                </Form.Group>
              </Card.Body>
            </Card>

            {/* Sections Card */}
            <Card className="mb-4">
              <Card.Body>
                <Card.Title className="d-flex align-items-center mb-4">
                  <Plus size={20} className="me-2" />
                  Programme du cours
                </Card.Title>

                {sections.map((section, sectionIndex) => (
                  <div key={sectionIndex} className="mb-4 p-3 border rounded">
                    {/* Section Title and Description */}
                    <Form.Group className="mb-3">
                      <Form.Label>Titre de la section</Form.Label>
                      <Form.Control
                        type="text"
                        name="title"
                        value={section.title}
                        onChange={(e) => handleSectionChange(sectionIndex, e)}
                      />
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label>Description de la section</Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={3}
                        name="description"
                        value={section.description}
                        onChange={(e) => handleSectionChange(sectionIndex, e)}
                      />
                    </Form.Group>

                    {/* Resource Upload Buttons */}
                    <div className="mb-4">
                      <h6 className="mb-3">Ressources :</h6>
                      <div className="d-flex flex-wrap gap-3 mb-3">
                        {/* Video Upload */}
                        <div>
                          <Form.Label className="d-block mb-1">Vidéo</Form.Label>
                          <Button
                            variant="outline-primary"
                            size="sm"
                            onClick={() => document.getElementById(`video-upload-${sectionIndex}`).click()}
                          >
                            <Video size={16} className="me-1" />
                            Ajouter vidéo
                          </Button>
                          <Form.Control
                            id={`video-upload-${sectionIndex}`}
                            type="file"
                            accept="video/*"
                            onChange={(e) => handleFileUpload(sectionIndex, 'video', e)}
                            className="d-none"
                          />
                        </div>

                        {/* Document Upload */}
                        <div>
                          <Form.Label className="d-block mb-1">Documents</Form.Label>
                          <Button
                            variant="outline-secondary"
                            size="sm"
                            onClick={() => document.getElementById(`document-upload-${sectionIndex}`).click()}
                          >
                            <FileText size={16} className="me-1" />
                            Ajouter PDF/DOC
                          </Button>
                          <Form.Control
                            id={`document-upload-${sectionIndex}`}
                            type="file"
                            accept=".pdf,.doc,.docx"
                            onChange={(e) => handleFileUpload(sectionIndex, 'document', e)}
                            className="d-none"
                          />
                        </div>
                      </div>

                      {/* Display Resources */}
                      {section.resources.length > 0 && (
                        <div className="mt-3">
                          <h6>Ressources ajoutées :</h6>
                          <div className="d-flex flex-wrap gap-2">
                            {section.resources.map((resource, resourceIndex) => (
                              <Badge
                                key={resourceIndex}
                                bg="light"
                                text="dark"
                                className="d-flex align-items-center p-2"
                              >
                                {resource.type === 'video' ? <Video size={16} className="me-1" /> : <FileText size={16} className="me-1" />}
                                <span className="me-2">{resource.name}</span>
                                <X
                                  size={14}
                                  className="cursor-pointer"
                                  onClick={() => handleRemoveResource(sectionIndex, resourceIndex)}
                                />
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleRemoveSection(sectionIndex)}
                    >
                      Supprimer cette section
                    </Button>
                  </div>
                ))}

                <Button
                  variant="outline-primary"
                  onClick={handleAddSection}
                  className="mt-2"
                >
                  <Plus size={16} className="me-1" />
                  Ajouter une section
                </Button>
              </Card.Body>
            </Card>
          </Col>

          <Col md={4}>
            <Card className="mb-4">
              <Card.Body>
                <Card.Title>Paramètres du cours</Card.Title>

                <Form.Group className="mb-3">
                  <Form.Label>Catégorie</Form.Label>
                  <Form.Select
                    value={course?.category || ''}
                    onChange={(e) => setCourse({...course, category: e.target.value})}
                  >
                    <option value="">Sélectionnez une catégorie</option>
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </Form.Select>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Niveau</Form.Label>
                  <Form.Select
                    value={course?.level || ''}
                    onChange={(e) => setCourse({...course, level: e.target.value})}
                  >
                    <option value="">Sélectionnez un niveau</option>
                    {levels.map((level) => (
                      <option key={level} value={level}>{level}</option>
                    ))}
                  </Form.Select>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Langue</Form.Label>
                  <Form.Select
                    value={course?.language || ''}
                    onChange={(e) => setCourse({...course, language: e.target.value})}
                  >
                    <option value="">Sélectionnez une langue</option>
                    {languages.map((lang) => (
                      <option key={lang} value={lang}>{lang}</option>
                    ))}
                  </Form.Select>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Prix (€)</Form.Label>
                  <Form.Control
                    type="number"
                    value={course?.price || ''}
                    onChange={(e) => setCourse({...course, price: e.target.value})}
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Image de couverture</Form.Label>
                  <div className="d-flex align-items-center">
                    <Button
                      variant="outline-primary"
                      onClick={() => fileInputRef.current.click()}
                    >
                      <Upload className="me-2" />
                      Choisir une image
                    </Button>
                    <Form.Control
                      type="file"
                      ref={fileInputRef}
                      onChange={handleImageChange}
                      accept="image/*"
                      style={{ display: 'none' }}
                    />
                  </div>
                  {(course?.coverImagePreview || course?.coverImage) && (
                    <img
                      src={course.coverImagePreview || `${API_BASE_URL}/${course.coverImage}`}
                      alt="Preview"
                      className="img-fluid mt-2"
                      style={{ maxHeight: '200px' }}
                    />
                  )}
                </Form.Group>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        <div className="d-flex gap-2 justify-content-end">
          <Button variant="secondary" onClick={() => navigate('/dashboard-teacher')}>
            Annuler
          </Button>
          <Button variant="primary" type="submit">
            Enregistrer les modifications
          </Button>
        </div>
      </Form>
    </Container>
  );
};

export default EditCourse;
