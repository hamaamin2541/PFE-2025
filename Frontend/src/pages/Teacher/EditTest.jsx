import React, { useState, useEffect } from 'react';
import { Form, Button, Container, Row, Col, Card, Alert } from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';
import { Film, FileText, Image, Music, File, Upload } from 'lucide-react';
import axios from 'axios';
import { API_BASE_URL } from '../../config/api';

const EditTest = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [testData, setTestData] = useState({
    title: '',
    description: '',
    category: '',
    price: '',
    duration: '',
    difficulty: 'Facile',
    coverImage: null,
    coverImagePreview: null,
    questions: []
  });

  const [resources, setResources] = useState([]);
  const [existingResources, setExistingResources] = useState([]);

  useEffect(() => {
    const fetchTest = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        const response = await axios.get(`${API_BASE_URL}/api/tests/${id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.data.success) {
          const test = response.data.data;
          // S'assurer que chaque question a un tableau d'options valide
          const questions = test.questions || [];
          const formattedQuestions = questions.map(q => {
            // Si la question n'a pas d'options ou si ce n'est pas un tableau, initialiser avec un tableau vide
            if (!q.options || !Array.isArray(q.options)) {
              return {
                ...q,
                options: ['', '', '', ''],
                correctAnswer: 0
              };
            }
            return q;
          });

          setTestData({
            title: test.title,
            description: test.description,
            category: test.category,
            price: test.price || 0,
            duration: test.duration,
            difficulty: test.difficulty,
            coverImagePreview: test.coverImage ? `${API_BASE_URL}/${test.coverImage}` : null,
            questions: formattedQuestions
          });

          // Set existing resources
          if (test.resources && test.resources.length > 0) {
            setExistingResources(test.resources.map(resource => ({
              ...resource,
              isExisting: true
            })));
          }
        } else {
          setError('Erreur lors de la récupération du test');
        }
      } catch (err) {
        console.error('Error fetching test:', err);
        setError(err.response?.data?.message || 'Une erreur est survenue lors de la récupération du test');
      } finally {
        setLoading(false);
      }
    };

    fetchTest();
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setTestData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setTestData(prev => ({
        ...prev,
        coverImage: file,
        coverImagePreview: URL.createObjectURL(file)
      }));
    }
  };

  const handleQuestionChange = (index, field, value) => {
    const updatedQuestions = [...testData.questions];
    updatedQuestions[index] = {
      ...updatedQuestions[index],
      [field]: value
    };
    setTestData(prev => ({
      ...prev,
      questions: updatedQuestions
    }));
  };

  const handleOptionChange = (questionIndex, optionIndex, value) => {
    const updatedQuestions = [...testData.questions];

    // S'assurer que la question a un tableau d'options
    if (!updatedQuestions[questionIndex].options) {
      updatedQuestions[questionIndex].options = ['', '', '', ''];
    }

    updatedQuestions[questionIndex].options[optionIndex] = value;
    setTestData(prev => ({
      ...prev,
      questions: updatedQuestions
    }));
  };

  const handleCorrectAnswerChange = (questionIndex, optionIndex) => {
    const updatedQuestions = [...testData.questions];
    updatedQuestions[questionIndex].correctAnswer = optionIndex;
    setTestData(prev => ({
      ...prev,
      questions: updatedQuestions
    }));
  };

  // Handle resource file selection
  const handleResourceUpload = (e) => {
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
        fileName: file.name,
        name: file.name.split('.')[0], // Default name is the filename without extension
        type: fileType,
        file: file,
        size: file.size
      };

      // Add to resources state
      setResources(prev => [...prev, newResource]);
    });
  };

  // Remove a new resource
  const removeResource = (resourceIndex) => {
    setResources(prev => prev.filter((_, index) => index !== resourceIndex));
  };

  // Remove an existing resource
  const removeExistingResource = (resourceName) => {
    setExistingResources(prev => prev.filter(resource => resource.name !== resourceName));
  };

  const addQuestion = () => {
    setTestData(prev => ({
      ...prev,
      questions: [
        ...prev.questions,
        {
          question: '',
          options: ['', '', '', ''],
          correctAnswer: 0
        }
      ]
    }));
  };

  // Fonction pour initialiser les options manquantes
  const initializeOptions = (question) => {
    if (!question.options || !Array.isArray(question.options)) {
      question.options = ['', '', '', ''];
    }
    return question;
  };

  const removeQuestion = (index) => {
    const updatedQuestions = [...testData.questions];
    updatedQuestions.splice(index, 1);
    setTestData(prev => ({
      ...prev,
      questions: updatedQuestions
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();

      // Add basic test info
      Object.keys(testData).forEach(key => {
        if (key !== 'coverImage' && key !== 'coverImagePreview' && key !== 'questions' && testData[key]) {
          formData.append(key, testData[key]);
        }
      });

      // Add cover image if changed
      if (testData.coverImage) {
        formData.append('coverImage', testData.coverImage);
      }

      // Add questions as JSON string
      if (testData.questions.length > 0) {
        formData.append('questions', JSON.stringify(testData.questions));
      }

      // Add new resource files and metadata
      if (resources.length > 0) {
        // Add each resource file
        resources.forEach(resource => {
          if (resource.file) {
            formData.append('resources', resource.file);
          }
        });

        // Add resource metadata
        const resourcesMetadata = resources.map(resource => ({
          name: resource.name,
          type: resource.type,
          fileName: resource.fileName
        }));

        formData.append('resources', JSON.stringify(resourcesMetadata));
      }

      // Handle existing resources
      if (existingResources.length > 0) {
        formData.append('keepExistingResources', 'true');
      } else {
        formData.append('removeAllResources', 'true');
      }

      const response = await axios.put(`${API_BASE_URL}/api/tests/${id}`, formData, {
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
      console.error('Error updating test:', err);
      setError(err.response?.data?.message || 'Une erreur est survenue lors de la mise à jour du test');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return <Container className="mt-5"><div>Chargement...</div></Container>;
  }

  return (
    <Container className="mt-5 mb-5">
      <h2 className="mb-4">Modifier le test</h2>

      {error && <Alert variant="danger">{error}</Alert>}
      {success && <Alert variant="success">Test mis à jour avec succès!</Alert>}

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
                    value={testData.title}
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
                    value={testData.description}
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
                        value={testData.category}
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
                        value={testData.price}
                        onChange={handleChange}
                        required
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Durée (minutes)</Form.Label>
                      <Form.Control
                        type="number"
                        name="duration"
                        value={testData.duration}
                        onChange={handleChange}
                        required
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Difficulté</Form.Label>
                      <Form.Select
                        name="difficulty"
                        value={testData.difficulty}
                        onChange={handleChange}
                        required
                      >
                        <option value="Facile">Facile</option>
                        <option value="Moyen">Moyen</option>
                        <option value="Difficile">Difficile</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                </Row>
              </Card.Body>
            </Card>

            <Card className="mb-4">
              <Card.Body>
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h4>Questions</h4>
                  <Button variant="primary" onClick={addQuestion}>
                    Ajouter une question
                  </Button>
                </div>

                {testData.questions.map((question, index) => (
                  <Card key={index} className="mb-3">
                    <Card.Body>
                      <div className="d-flex justify-content-between align-items-center mb-3">
                        <h5>Question {index + 1}</h5>
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => removeQuestion(index)}
                        >
                          Supprimer
                        </Button>
                      </div>

                      <Form.Group className="mb-3">
                        <Form.Label>Question</Form.Label>
                        <Form.Control
                          type="text"
                          value={question.question}
                          onChange={(e) => handleQuestionChange(index, 'question', e.target.value)}
                          required
                        />
                      </Form.Group>

                      <Form.Group className="mb-3">
                        <Form.Label>Options</Form.Label>
                        {question.options && question.options.length > 0 ? question.options.map((option, optionIndex) => (
                          <div key={optionIndex} className="d-flex align-items-center mb-2">
                            <Form.Check
                              type="radio"
                              name={`correctAnswer-${index}`}
                              checked={question.correctAnswer === optionIndex}
                              onChange={() => handleCorrectAnswerChange(index, optionIndex)}
                              className="me-2"
                            />
                            <Form.Control
                              type="text"
                              value={option}
                              onChange={(e) => handleOptionChange(index, optionIndex, e.target.value)}
                              placeholder={`Option ${optionIndex + 1}`}
                              required
                            />
                          </div>
                        )) : (
                          <div className="alert alert-warning">
                            Aucune option disponible. Veuillez ajouter une nouvelle question.
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

                {testData.coverImagePreview && (
                  <div className="mt-3">
                    <p>Aperçu:</p>
                    <img
                      src={testData.coverImagePreview}
                      alt="Cover preview"
                      className="img-fluid rounded"
                    />
                  </div>
                )}
              </Card.Body>
            </Card>

            <Card className="mb-4">
              <Card.Body>
                <h4 className="mb-3">Ressources supplémentaires</h4>
                <Form.Group className="mb-3">
                  <div className="d-flex align-items-center mb-2">
                    <Button
                      variant="outline-primary"
                      size="sm"
                      onClick={() => document.getElementById('resourceInput').click()}
                      className="me-2"
                    >
                      <Upload size={16} className="me-1" />
                      Ajouter des ressources
                    </Button>
                    <Form.Control
                      type="file"
                      id="resourceInput"
                      onChange={handleResourceUpload}
                      multiple
                      style={{ display: 'none' }}
                    />
                    <small className="text-muted">
                      Vidéos, PDFs, documents, images, etc.
                    </small>
                  </div>

                  {/* Display existing resources */}
                  {existingResources.length > 0 && (
                    <div className="resource-list mt-2">
                      <h6>Ressources existantes:</h6>
                      <ul className="list-group">
                        {existingResources.map((resource, index) => (
                          <li key={`existing-${index}`} className="list-group-item d-flex justify-content-between align-items-center">
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
                              onClick={() => removeExistingResource(resource.name)}
                            >
                              Supprimer
                            </Button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Display newly uploaded resources */}
                  {resources.length > 0 && (
                    <div className="resource-list mt-2">
                      <h6>Nouvelles ressources:</h6>
                      <ul className="list-group">
                        {resources.map((resource, index) => (
                          <li key={`new-${index}`} className="list-group-item d-flex justify-content-between align-items-center">
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
                              onClick={() => removeResource(index)}
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

            <div className="d-grid gap-2">
              <Button
                variant="primary"
                type="submit"
                disabled={isSubmitting}
                className="py-2"
              >
                {isSubmitting ? 'Mise à jour...' : 'Mettre à jour le test'}
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

export default EditTest;
