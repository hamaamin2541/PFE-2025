import React, { useState, useRef } from 'react';
import { Container, Form, Button, Row, Col, Card, Alert, Badge, ProgressBar } from 'react-bootstrap';
import { Upload, Video, BookOpen, FileText, Image as ImageIcon, File, X, Plus } from 'lucide-react';
import { Formik } from 'formik';
import * as Yup from 'yup';
import axios from 'axios';
import './AddCourse.css';

const AddCourse = () => {
  const [previewImage, setPreviewImage] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [submitStatus, setSubmitStatus] = useState(null);
  const [sections, setSections] = useState([{
    title: '',
    description: '',
    resources: []
  }]);
  const [courseData, setCourseData] = useState({
    title: '',
    description: '',
    category: '',
    price: '',
    coverImage: null,
  });

  const fileInputRef = useRef(null);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setCourseData({
        ...courseData,
        coverImage: file
      });
    }
  };

  const fileConfig = {
    video: {
      types: ['video/mp4', 'video/webm', 'video/ogg'],
      maxSize: 50 * 1024 * 1024, // 50MB
      icon: <Video size={16} className="me-1" />
    },
    document: {
      types: [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ],
      maxSize: 10 * 1024 * 1024, // 10MB
      icon: <FileText size={16} className="me-1" />
    },
    presentation: {
      types: [
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation'
      ],
      maxSize: 20 * 1024 * 1024, // 20MB
      icon: <File size={16} className="me-1" />
    },
    image: {
      types: ['image/jpeg', 'image/png', 'image/gif'],
      maxSize: 5 * 1024 * 1024, // 5MB
      icon: <ImageIcon size={16} className="me-1" />
    }
  };

  const courseSchema = Yup.object().shape({
    title: Yup.string().required('Le titre est requis'),
    description: Yup.string().required('La description est requise'),
    category: Yup.string().required('La catégorie est requise'),
    price: Yup.number().min(0, 'Le prix ne peut pas être négatif').required('Le prix est requis'),
    language: Yup.string().required('La langue est requise'),
    level: Yup.string().required('Le niveau est requis'),
  });

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
    const config = fileConfig[type];

    const validFiles = files.filter(file => {
      const isValidType = config.types.includes(file.type);
      const isValidSize = file.size <= config.maxSize;

      if (!isValidType) {
        alert(`Type de fichier non supporté pour ${file.name}. Seuls ${config.types.join(', ')} sont acceptés.`);
      }

      if (!isValidSize) {
        alert(`Fichier trop volumineux pour ${file.name}. Taille max: ${config.maxSize / (1024 * 1024)}MB`);
      }

      return isValidType && isValidSize;
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

  const getFileIcon = (type) => {
    switch(type) {
      case 'video': return <Video size={16} className="me-1" />;
      case 'document': return <FileText size={16} className="me-1" />;
      case 'presentation': return <File size={16} className="me-1" />;
      case 'image': return <ImageIcon size={16} className="me-1" />;
      default: return <File size={16} className="me-1" />;
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleSubmit = async (values, { setSubmitting, resetForm }) => {
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();

      // Add basic course info
      Object.keys(values).forEach(key => {
        if (values[key]) {
          formData.append(key, values[key]);
        }
      });

      // Add cover image
      if (courseData.coverImage) {
        formData.append('coverImage', courseData.coverImage);
      }

      // Add sections as JSON string
      if (sections.length > 0) {
        formData.append('sections', JSON.stringify(sections));
      }

      const response = await axios.post('http://localhost:5000/api/courses', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.data.success) {
        setSubmitStatus({ success: true, message: 'Cours créé avec succès!' });
        resetForm();
        setSections([{ title: '', description: '', resources: [] }]);
      }
    } catch (error) {
      console.error('Error creating course:', error);
      setSubmitStatus({
        success: false,
        message: error.response?.data?.message || 'Erreur lors de la création du cours'
      });
    } finally {
      setSubmitting(false);
      setUploadProgress(0);
    }
  };

  return (
    <Container className="add-course-container py-5">
      <h2 className="mb-4 text-center">Créer un nouveau cours</h2>

      <Formik
        initialValues={{
          title: '',
          description: '',
          category: '',
          price: '',
          language: '',
          level: '',
          thumbnail: null,
        }}
        validationSchema={courseSchema}
        onSubmit={handleSubmit}
      >
        {({ values, errors, touched, handleChange, handleSubmit, isSubmitting, setFieldValue }) => (
          <Form onSubmit={handleSubmit}>
            {submitStatus && (
              <Alert variant={submitStatus.success ? 'success' : 'danger'}>
                {submitStatus.message}
              </Alert>
            )}

            {uploadProgress > 0 && (
              <ProgressBar
                now={uploadProgress}
                label={`${uploadProgress}%`}
                className="mb-3"
              />
            )}

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
                        name="title"
                        value={values.title}
                        onChange={handleChange}
                        isInvalid={touched.title && !!errors.title}
                      />
                      <Form.Control.Feedback type="invalid">{errors.title}</Form.Control.Feedback>
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label>Description</Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={5}
                        name="description"
                        value={values.description}
                        onChange={handleChange}
                        isInvalid={touched.description && !!errors.description}
                      />
                      <Form.Control.Feedback type="invalid">{errors.description}</Form.Control.Feedback>
                    </Form.Group>
                  </Card.Body>
                </Card>

                <Card className="mb-4">
                  <Card.Body>
                    <Card.Title className="d-flex align-items-center mb-4">
                      <Plus size={20} className="me-2" />
                      Programme du cours
                    </Card.Title>

                    {sections.map((section, sectionIndex) => (
                      <div key={sectionIndex} className="mb-4 p-3 border rounded">
                        <Form.Group className="mb-3">
                          <Form.Label>Titre de la section</Form.Label>
                          <Form.Control
                            type="text"
                            name="title"
                            value={section.title}
                            onChange={(e) => handleSectionChange(sectionIndex, e)}
                            placeholder="Titre de la section"
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
                            placeholder="Description de la section"
                          />
                        </Form.Group>

                        <div className="mb-4">
                          <h6 className="mb-3">Ajouter des ressources :</h6>

                          <div className="d-flex flex-wrap gap-3 mb-3">
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
                                multiple
                              />
                            </div>

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
                                multiple
                              />
                            </div>

                            <div>
                              <Form.Label className="d-block mb-1">Présentations</Form.Label>
                              <Button
                                variant="outline-success"
                                size="sm"
                                onClick={() => document.getElementById(`presentation-upload-${sectionIndex}`).click()}
                              >
                                <File size={16} className="me-1" />
                                Ajouter PPT
                              </Button>
                              <Form.Control
                                id={`presentation-upload-${sectionIndex}`}
                                type="file"
                                accept=".ppt,.pptx"
                                onChange={(e) => handleFileUpload(sectionIndex, 'presentation', e)}
                                className="d-none"
                                multiple
                              />
                            </div>

                            <div>
                              <Form.Label className="d-block mb-1">Images</Form.Label>
                              <Button
                                variant="outline-info"
                                size="sm"
                                onClick={() => document.getElementById(`image-upload-${sectionIndex}`).click()}
                              >
                                <ImageIcon size={16} className="me-1" />
                                Ajouter images
                              </Button>
                              <Form.Control
                                id={`image-upload-${sectionIndex}`}
                                type="file"
                                accept="image/*"
                                onChange={(e) => handleFileUpload(sectionIndex, 'image', e)}
                                className="d-none"
                                multiple
                              />
                            </div>
                          </div>

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
                                    {getFileIcon(resource.type)}
                                    <span className="me-2 text-truncate" style={{ maxWidth: '150px' }}>
                                      {resource.name}
                                    </span>
                                    <small className="me-2 text-muted">
                                      ({formatFileSize(resource.size)})
                                    </small>
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
                        name="category"
                        value={values.category}
                        onChange={handleChange}
                        isInvalid={touched.category && !!errors.category}
                      >
                        <option value="">Sélectionnez une catégorie</option>
                        {categories.map((cat) => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </Form.Select>
                      <Form.Control.Feedback type="invalid">{errors.category}</Form.Control.Feedback>
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label>Niveau</Form.Label>
                      <Form.Select
                        name="level"
                        value={values.level}
                        onChange={handleChange}
                        isInvalid={touched.level && !!errors.level}
                      >
                        <option value="">Sélectionnez un niveau</option>
                        {levels.map((level) => (
                          <option key={level} value={level}>{level}</option>
                        ))}
                      </Form.Select>
                      <Form.Control.Feedback type="invalid">{errors.level}</Form.Control.Feedback>
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label>Langue</Form.Label>
                      <Form.Select
                        name="language"
                        value={values.language}
                        onChange={handleChange}
                        isInvalid={touched.language && !!errors.language}
                      >
                        <option value="">Sélectionnez une langue</option>
                        {languages.map((lang) => (
                          <option key={lang} value={lang}>{lang}</option>
                        ))}
                      </Form.Select>
                      <Form.Control.Feedback type="invalid">{errors.language}</Form.Control.Feedback>
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label>Prix (€)</Form.Label>
                      <Form.Control
                        type="number"
                        name="price"
                        value={values.price}
                        onChange={handleChange}
                        isInvalid={touched.price && !!errors.price}
                      />
                      <Form.Control.Feedback type="invalid">{errors.price}</Form.Control.Feedback>
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
                        {courseData.coverImage && (
                          <span className="ms-3 text-success">
                            Image sélectionnée: {courseData.coverImage.name}
                          </span>
                        )}
                      </div>
                      <small className="text-muted d-block mt-2">
                        Format recommandé: JPG, PNG. Taille max: 2MB
                      </small>
                    </Form.Group>
                  </Card.Body>
                </Card>
              </Col>
            </Row>

            <Button
              variant="primary"
              type="submit"
              disabled={isSubmitting}
              className="w-100 mt-3"
            >
              {isSubmitting ? 'Publication en cours...' : 'Publier le cours'}
            </Button>
          </Form>
        )}
      </Formik>
    </Container>
  );
};

export default AddCourse;