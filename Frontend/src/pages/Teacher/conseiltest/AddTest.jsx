import React, { useState } from 'react';
import { Form, Button, Container, Row, Col, Card, Alert, Badge } from 'react-bootstrap';
import { Plus, Upload, X, Film, FileText, Image, Music, File } from 'lucide-react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../../../config/api';

const AddTest = () => {
  const navigate = useNavigate();
  const [testData, setTestData] = useState({
    title: '',
    description: '',
    category: '',
    duration: 30, // Default duration in minutes
    difficulty: 'Débutant',
    price: 0,
    coverImage: null,
    coverImagePreview: null,
    questions: [{ text: '', answers: [{ text: '' }, { text: '' }], correctAnswer: 0 }]
  });
  const [resources, setResources] = useState([]);
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

  const handleTestChange = (e, index, field, answerIndex) => {
    const newTestData = { ...testData };

    if (field === 'question') {
      newTestData.questions[index].text = e.target.value;
    } else if (field === 'answer') {
      newTestData.questions[index].answers[answerIndex].text = e.target.value;
    } else if (field === 'correctAnswer') {
      newTestData.questions[index].correctAnswer = parseInt(e.target.value);
    }

    setTestData(newTestData);
  };

  const addQuestion = () => {
    setTestData({
      ...testData,
      questions: [
        ...testData.questions,
        { text: '', answers: [{ text: '' }, { text: '' }], correctAnswer: 0 }
      ]
    });
  };

  const removeQuestion = (index) => {
    if (testData.questions.length > 1) {
      const updatedQuestions = [...testData.questions];
      updatedQuestions.splice(index, 1);
      setTestData(prev => ({
        ...prev,
        questions: updatedQuestions
      }));
    }
  };

  const addAnswer = (questionIndex) => {
    const newTestData = { ...testData };
    newTestData.questions[questionIndex].answers.push({ text: '' });
    setTestData(newTestData);
  };

  const removeAnswer = (questionIndex, answerIndex) => {
    if (testData.questions[questionIndex].answers.length > 2) {
      const newTestData = { ...testData };
      newTestData.questions[questionIndex].answers.splice(answerIndex, 1);

      // Adjust correctAnswer if needed
      if (newTestData.questions[questionIndex].correctAnswer >= answerIndex) {
        newTestData.questions[questionIndex].correctAnswer = Math.max(0, newTestData.questions[questionIndex].correctAnswer - 1);
      }

      setTestData(newTestData);
    }
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

  // Remove a resource
  const removeResource = (resourceIndex) => {
    setResources(prev => prev.filter((_, index) => index !== resourceIndex));
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

      // Add cover image
      if (testData.coverImage) {
        formData.append('coverImage', testData.coverImage);
      }

      // Add questions as JSON string
      if (testData.questions.length > 0) {
        formData.append('questions', JSON.stringify(testData.questions));
      }

      // Add resource files and metadata
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

      const response = await axios.post(`${API_BASE_URL}/api/tests`, formData, {
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
      console.error('Error creating test:', err);
      setError(err.response?.data?.message || 'Une erreur est survenue lors de la création du test');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Container fluid>

      {error && <Alert variant="danger">{error}</Alert>}
      {success && <Alert variant="success">Test créé avec succès!</Alert>}

      <Form onSubmit={handleSubmit}>
        <Row>
          <Col md={8}>
            <Card className="mb-4 ">
              <Card.Body>
                <Card.Title>Informations générales</Card.Title>

                <Form.Group className="mb-3">
                  <Form.Label>Titre du test</Form.Label>
                  <Form.Control
                    type="text"
                    name="title"
                    value={testData.title}
                    onChange={handleChange}
                    required
                    placeholder="Ex: Test de compétences en JavaScript"
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
                    placeholder="Décrivez l'objectif et le contenu du test"
                  />
                </Form.Group>

                <Card.Title className="mt-4">Questions</Card.Title>

                {testData.questions.map((question, qIndex) => (
                  <Card key={qIndex} className="mb-3">
                    <Card.Header className="d-flex justify-content-between align-items-center">
                      <h6 className="mb-0">Question {qIndex + 1}</h6>
                      {testData.questions.length > 1 && (
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => removeQuestion(qIndex)}
                        >
                          <X size={16} />
                        </Button>
                      )}
                    </Card.Header>
                    <Card.Body>
                      <Form.Group className="mb-3">
                        <Form.Label>Texte de la question</Form.Label>
                        <Form.Control
                          type="text"
                          value={question.text}
                          onChange={(e) => handleTestChange(e, qIndex, 'question')}
                          required
                          placeholder="Ex: Quelle est la syntaxe correcte pour déclarer une variable en JavaScript?"
                        />
                      </Form.Group>

                      <Form.Group className="mb-3">
                        <Form.Label>Réponses</Form.Label>
                        {question.answers.map((answer, aIndex) => (
                          <div key={aIndex} className="d-flex mb-2 align-items-center">
                            <Form.Check
                              type="radio"
                              id={`q${qIndex}-a${aIndex}`}
                              name={`correctAnswer-${qIndex}`}
                              className="me-2"
                              checked={question.correctAnswer === aIndex}
                              onChange={() => {
                                const newTestData = { ...testData };
                                newTestData.questions[qIndex].correctAnswer = aIndex;
                                setTestData(newTestData);
                              }}
                            />
                            <Form.Control
                              type="text"
                              value={answer.text}
                              onChange={(e) => handleTestChange(e, qIndex, 'answer', aIndex)}
                              required
                              placeholder={`Réponse ${aIndex + 1}`}
                              className="me-2"
                            />
                            {question.answers.length > 2 && (
                              <Button
                                variant="outline-danger"
                                size="sm"
                                onClick={() => removeAnswer(qIndex, aIndex)}
                              >
                                <X size={14} />
                              </Button>
                            )}
                          </div>
                        ))}
                        <div className="mt-2">
                          <Button
                            variant="outline-secondary"
                            size="sm"
                            onClick={() => addAnswer(qIndex)}
                          >
                            <Plus size={14} className="me-1" />
                            Ajouter une réponse
                          </Button>
                          <Badge bg="info" className="ms-3">
                            Sélectionnez la réponse correcte avec le bouton radio
                          </Badge>
                        </div>
                      </Form.Group>
                    </Card.Body>
                  </Card>
                ))}

                <Button
                  variant="outline-primary"
                  onClick={addQuestion}
                  className="mt-2"
                >
                  <Plus size={16} className="me-1" />
                  Ajouter une question
                </Button>
              </Card.Body>
            </Card>
          </Col>

          <Col md={4}>
            <Card className="mb-4">
              <Card.Body>
                <Card.Title>Paramètres du test</Card.Title>

                <Form.Group className="mb-3">
                  <Form.Label>Catégorie</Form.Label>
                  <Form.Select
                    name="category"
                    value={testData.category}
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
                  <Form.Label>Durée (minutes)</Form.Label>
                  <Form.Control
                    type="number"
                    name="duration"
                    value={testData.duration}
                    onChange={handleChange}
                    required
                    min="1"
                    max="180"
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Prix (€)</Form.Label>
                  <Form.Control
                    type="number"
                    name="price"
                    value={testData.price}
                    onChange={handleChange}
                    required
                    min="0"
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Niveau de difficulté</Form.Label>
                  <Form.Select
                    name="difficulty"
                    value={testData.difficulty}
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
                  <Form.Label>Ressources supplémentaires</Form.Label>
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

                  {/* Display uploaded resources */}
                  {resources.length > 0 && (
                    <div className="resource-list mt-2">
                      <h6>Ressources téléchargées:</h6>
                      <ul className="list-group">
                        {resources.map((resource, index) => (
                          <li key={index} className="list-group-item d-flex justify-content-between align-items-center">
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
                              <X size={14} />
                            </Button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
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
                      {testData.coverImage ? testData.coverImage.name : 'Aucun fichier choisi'}
                    </span>
                  </div>

                  {testData.coverImagePreview && (
                    <div className="mt-2">
                      <img
                        src={testData.coverImagePreview}
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
                {isSubmitting ? 'Création en cours...' : 'Créer le test'}
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

export default AddTest;
