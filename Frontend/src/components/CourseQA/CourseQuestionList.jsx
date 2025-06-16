import React, { useState, useEffect } from 'react';
import { Card, Button, Form, ListGroup, Badge, Spinner, Alert } from 'react-bootstrap';
import { MessageCircle, CheckCircle, AlertTriangle, Plus, Search } from 'lucide-react';
import axios from 'axios';
import { API_BASE_URL } from '../../config/api';
import './CourseQA.css';

const CourseQuestionList = ({ courseId }) => {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showNewQuestionForm, setShowNewQuestionForm] = useState(false);
  const [newQuestion, setNewQuestion] = useState({ title: '', content: '' });
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all'); // 'all', 'resolved', 'unresolved'

  useEffect(() => {
    fetchQuestions();
  }, [courseId]);

  const fetchQuestions = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await axios.get(`${API_BASE_URL}/api/course-questions/course/${courseId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      setQuestions(response.data.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching questions:', err);
      setError('Impossible de charger les questions. Veuillez réessayer plus tard.');
    } finally {
      setLoading(false);
    }
  };

  const handleNewQuestionSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await axios.post(
        `${API_BASE_URL}/api/course-questions/course/${courseId}`,
        newQuestion,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      // Add the new question to the list
      setQuestions([response.data.data, ...questions]);
      
      // Reset form
      setNewQuestion({ title: '', content: '' });
      setShowNewQuestionForm(false);
      setError(null);
    } catch (err) {
      console.error('Error creating question:', err);
      setError('Impossible de créer la question. Veuillez réessayer plus tard.');
    } finally {
      setLoading(false);
    }
  };

  const filteredQuestions = questions.filter(question => {
    // Apply search filter
    const matchesSearch = 
      question.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      question.content.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Apply status filter
    if (filter === 'all') return matchesSearch;
    if (filter === 'resolved') return matchesSearch && question.isResolved;
    if (filter === 'unresolved') return matchesSearch && !question.isResolved;
    
    return matchesSearch;
  });

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="course-qa-container">
      <Card className="mb-4">
        <Card.Header className="d-flex justify-content-between align-items-center">
          <h5 className="mb-0">
            <MessageCircle size={20} className="me-2" />
            Questions et Réponses
          </h5>
          <Button 
            variant="primary" 
            size="sm"
            onClick={() => setShowNewQuestionForm(!showNewQuestionForm)}
          >
            <Plus size={16} className="me-1" />
            Poser une question
          </Button>
        </Card.Header>
        <Card.Body>
          {showNewQuestionForm && (
            <Form onSubmit={handleNewQuestionSubmit} className="mb-4">
              <Form.Group className="mb-3">
                <Form.Label>Titre de la question</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Entrez un titre clair pour votre question"
                  value={newQuestion.title}
                  onChange={(e) => setNewQuestion({ ...newQuestion, title: e.target.value })}
                  required
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Contenu de la question</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  placeholder="Décrivez votre question en détail"
                  value={newQuestion.content}
                  onChange={(e) => setNewQuestion({ ...newQuestion, content: e.target.value })}
                  required
                />
              </Form.Group>
              <div className="d-flex justify-content-end">
                <Button 
                  variant="secondary" 
                  className="me-2"
                  onClick={() => {
                    setShowNewQuestionForm(false);
                    setNewQuestion({ title: '', content: '' });
                  }}
                >
                  Annuler
                </Button>
                <Button variant="primary" type="submit" disabled={loading}>
                  {loading ? (
                    <>
                      <Spinner as="span" animation="border" size="sm" className="me-2" />
                      Envoi...
                    </>
                  ) : (
                    'Poser la question'
                  )}
                </Button>
              </div>
            </Form>
          )}

          <div className="mb-3 d-flex justify-content-between">
            <Form.Group className="search-container">
              <div className="position-relative">
                
                <Form.Control
                  className='px-5'
                  type="text"
                  placeholder="Rechercher une question..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <Search size={16} className="search-icon" />
                
              </div>
            </Form.Group>
            <div className="filter-buttons">
              <Button
                variant={filter === 'all' ? 'primary' : 'outline-primary'}
                size="sm"
                onClick={() => setFilter('all')}
                className="me-2"
              >
                Toutes
              </Button>
              <Button
                variant={filter === 'resolved' ? 'success' : 'outline-success'}
                size="sm"
                onClick={() => setFilter('resolved')}
                className="me-2"
              >
                Résolues
              </Button>
              <Button
                variant={filter === 'unresolved' ? 'warning' : 'outline-warning'}
                size="sm"
                onClick={() => setFilter('unresolved')}
              >
                Non résolues
              </Button>
            </div>
          </div>

          {error && <Alert variant="danger">{error}</Alert>}

          {loading ? (
            <div className="text-center my-4">
              <Spinner animation="border" variant="primary" />
              <p className="mt-2">Chargement des questions...</p>
            </div>
          ) : filteredQuestions.length === 0 ? (
            <div className="text-center my-4">
              <MessageCircle size={40} className="text-muted mb-2" />
              <p>Aucune question pour le moment. Soyez le premier à poser une question !</p>
            </div>
          ) : (
            <ListGroup variant="flush">
              {filteredQuestions.map((question) => (
                <ListGroup.Item key={question._id} className="question-item">
                  <div className="d-flex justify-content-between align-items-start">
                    <div>
                      <h6 className="mb-1">
                        {question.title}
                        {question.isResolved && (
                          <Badge bg="success" className="ms-2">
                            <CheckCircle size={12} className="me-1" />
                            Résolu
                          </Badge>
                        )}
                        {question.isInappropriate && (
                          <Badge bg="danger" className="ms-2">
                            <AlertTriangle size={12} className="me-1" />
                            Signalé
                          </Badge>
                        )}
                      </h6>
                      <p className="text-muted small mb-1">
                        Posée par {question.user?.fullName || 'Utilisateur'} 
                        {question.user?.role === 'assistant' && (
                          <Badge bg="info" className="ms-1">Assistant</Badge>
                        )}
                        {question.user?.role === 'teacher' && (
                          <Badge bg="primary" className="ms-1">Professeur</Badge>
                        )}
                        {question.user?.role === 'admin' && (
                          <Badge bg="dark" className="ms-1">Admin</Badge>
                        )}
                        <span className="mx-2">•</span>
                        {formatDate(question.createdAt)}
                      </p>
                      <p className="question-content">{question.content}</p>
                      <div className="question-stats">
                        <span className="me-3">
                          <MessageCircle size={14} className="me-1" />
                          {question.answers?.length || 0} réponses
                        </span>
                        <span>
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="me-1">
                            <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                            <circle cx="12" cy="12" r="3" />
                          </svg>
                          {question.views} vues
                        </span>
                      </div>
                    </div>
                    <Button
                      variant="outline-primary"
                      size="sm"
                      href={`/course-question/${question._id}`}
                    >
                      Voir
                    </Button>
                  </div>
                </ListGroup.Item>
              ))}
            </ListGroup>
          )}
        </Card.Body>
      </Card>
    </div>
  );
};

export default CourseQuestionList;
