import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Button, Form, Badge, Spinner, Alert, Row, Col } from 'react-bootstrap';
import { ArrowLeft, MessageCircle, CheckCircle, AlertTriangle, User } from 'lucide-react';
import axios from 'axios';
import { API_BASE_URL } from '../../config/api';
import './CourseQA.css';

const QuestionDetail = () => {
  const { questionId } = useParams();
  const navigate = useNavigate();
  
  const [question, setQuestion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newAnswer, setNewAnswer] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    // Get current user from localStorage
    const userString = localStorage.getItem('user');
    if (userString) {
      setCurrentUser(JSON.parse(userString));
    }
    
    fetchQuestion();
  }, [questionId]);

  const fetchQuestion = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await axios.get(`${API_BASE_URL}/api/course-questions/${questionId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      setQuestion(response.data.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching question:', err);
      setError('Impossible de charger la question. Veuillez réessayer plus tard.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitAnswer = async (e) => {
    e.preventDefault();
    
    if (!newAnswer.trim()) return;
    
    try {
      setSubmitting(true);
      const token = localStorage.getItem('token');
      
      const response = await axios.post(
        `${API_BASE_URL}/api/course-questions/${questionId}/answers`,
        { content: newAnswer },
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      // Update the question with the new answer
      setQuestion({
        ...question,
        answers: [...question.answers, response.data.data]
      });
      
      // Clear the form
      setNewAnswer('');
      setError(null);
    } catch (err) {
      console.error('Error submitting answer:', err);
      setError('Impossible d\'ajouter votre réponse. Veuillez réessayer plus tard.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleMarkAsResolved = async () => {
    try {
      setSubmitting(true);
      const token = localStorage.getItem('token');
      
      const response = await axios.put(
        `${API_BASE_URL}/api/course-questions/${questionId}/resolve`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      // Update the question
      setQuestion(response.data.data);
      setError(null);
    } catch (err) {
      console.error('Error marking as resolved:', err);
      setError('Impossible de marquer la question comme résolue. Veuillez réessayer plus tard.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleMarkAsInappropriate = async (answerId = null) => {
    try {
      setSubmitting(true);
      const token = localStorage.getItem('token');
      
      let url = `${API_BASE_URL}/api/course-questions/${questionId}/inappropriate`;
      if (answerId) {
        url = `${API_BASE_URL}/api/course-questions/${questionId}/answers/${answerId}/inappropriate`;
      }
      
      const response = await axios.put(
        url,
        { reason: 'Contenu inapproprié' },
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      // Update the question
      setQuestion(response.data.data);
      setError(null);
    } catch (err) {
      console.error('Error marking as inappropriate:', err);
      setError('Impossible de signaler le contenu. Veuillez réessayer plus tard.');
    } finally {
      setSubmitting(false);
    }
  };

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

  const canModerate = currentUser && ['teacher', 'assistant', 'admin'].includes(currentUser.role);
  const isAuthor = currentUser && question && currentUser._id === question.user._id;

  if (loading) {
    return (
      <div className="text-center my-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3">Chargement de la question...</p>
      </div>
    );
  }

  if (error) {
    return <Alert variant="danger">{error}</Alert>;
  }

  if (!question) {
    return <Alert variant="warning">Question non trouvée</Alert>;
  }

  return (
    <div className="question-detail-container">
      <Button 
        variant="outline-secondary" 
        className="mb-3"
        onClick={() => navigate(-1)}
      >
        <ArrowLeft size={16} className="me-2" />
        Retour
      </Button>
      
      <Card className="mb-4">
        <Card.Header className={`d-flex justify-content-between align-items-center ${question.isResolved ? 'bg-success text-white' : ''}`}>
          <h5 className="mb-0">
            {question.isResolved ? (
              <>
                <CheckCircle size={20} className="me-2" />
                Question résolue
              </>
            ) : (
              <>
                <MessageCircle size={20} className="me-2" />
                Question
              </>
            )}
          </h5>
          <div>
            {!question.isResolved && (isAuthor || canModerate) && (
              <Button 
                variant="success" 
                size="sm"
                onClick={handleMarkAsResolved}
                disabled={submitting}
                className="me-2"
              >
                <CheckCircle size={16} className="me-1" />
                Marquer comme résolu
              </Button>
            )}
            {canModerate && !question.isInappropriate && (
              <Button 
                variant="danger" 
                size="sm"
                onClick={() => handleMarkAsInappropriate()}
                disabled={submitting}
              >
                <AlertTriangle size={16} className="me-1" />
                Signaler
              </Button>
            )}
          </div>
        </Card.Header>
        <Card.Body>
          <Row>
            <Col md={1} className="text-center">
              {question.user.profileImage ? (
                <img 
                  src={`${API_BASE_URL}/${question.user.profileImage}`} 
                  alt={question.user.fullName}
                  className="rounded-circle"
                  width="50"
                  height="50"
                />
              ) : (
                <div className="rounded-circle bg-light d-flex align-items-center justify-content-center" style={{ width: '50px', height: '50px' }}>
                  <User size={24} />
                </div>
              )}
            </Col>
            <Col md={11}>
              <div className="d-flex align-items-center mb-2">
                <h5 className="mb-0">{question.title}</h5>
                {question.isInappropriate && (
                  <Badge bg="danger" className="ms-2">
                    <AlertTriangle size={12} className="me-1" />
                    Contenu signalé
                  </Badge>
                )}
              </div>
              <p className="text-muted small">
                Posée par {question.user.fullName} 
                {question.user.role === 'assistant' && (
                  <Badge bg="info" className="ms-1">Assistant</Badge>
                )}
                {question.user.role === 'teacher' && (
                  <Badge bg="primary" className="ms-1">Professeur</Badge>
                )}
                {question.user.role === 'admin' && (
                  <Badge bg="dark" className="ms-1">Admin</Badge>
                )}
                <span className="mx-2">•</span>
                {formatDate(question.createdAt)}
              </p>
              <div className={`question-content ${question.isInappropriate ? 'inappropriate-content' : ''}`}>
                {question.content}
              </div>
            </Col>
          </Row>
          
          <hr />
          
          <h6 className="mb-3">
            <MessageCircle size={16} className="me-2" />
            {question.answers.length} Réponses
          </h6>
          
          {question.answers.length === 0 ? (
            <div className="text-center my-4 text-muted">
              <p>Aucune réponse pour le moment. Soyez le premier à répondre !</p>
            </div>
          ) : (
            <div className="answer-container">
              {question.answers.map((answer) => (
                <div key={answer._id} className="answer-item">
                  <div className="answer-header">
                    <div className="d-flex align-items-center">
                      {answer.user.profileImage ? (
                        <img 
                          src={`${API_BASE_URL}/${answer.user.profileImage}`} 
                          alt={answer.user.fullName}
                          className="rounded-circle me-2"
                          width="30"
                          height="30"
                        />
                      ) : (
                        <div className="rounded-circle bg-light d-flex align-items-center justify-content-center me-2" style={{ width: '30px', height: '30px' }}>
                          <User size={16} />
                        </div>
                      )}
                      <div>
                        <span className="fw-bold">{answer.user.fullName}</span>
                        {answer.user.role === 'assistant' && (
                          <Badge bg="info" className="ms-1">Assistant</Badge>
                        )}
                        {answer.user.role === 'teacher' && (
                          <Badge bg="primary" className="ms-1">Professeur</Badge>
                        )}
                        {answer.user.role === 'admin' && (
                          <Badge bg="dark" className="ms-1">Admin</Badge>
                        )}
                        <div className="text-muted small">{formatDate(answer.createdAt)}</div>
                      </div>
                    </div>
                    {canModerate && !answer.isInappropriate && (
                      <Button 
                        variant="outline-danger" 
                        size="sm"
                        onClick={() => handleMarkAsInappropriate(answer._id)}
                        disabled={submitting}
                      >
                        <AlertTriangle size={14} className="me-1" />
                        Signaler
                      </Button>
                    )}
                  </div>
                  <div className={`answer-content ${answer.isInappropriate ? 'inappropriate-content' : ''}`}>
                    {answer.content}
                  </div>
                  {answer.isInappropriate && (
                    <div className="mt-2">
                      <Badge bg="danger">
                        <AlertTriangle size={12} className="me-1" />
                        Contenu signalé
                      </Badge>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
          
          {!question.isResolved && (
            <Form onSubmit={handleSubmitAnswer} className="answer-form mt-4">
              <Form.Group className="mb-3">
                <Form.Label>Votre réponse</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={4}
                  placeholder="Rédigez votre réponse ici..."
                  value={newAnswer}
                  onChange={(e) => setNewAnswer(e.target.value)}
                  required
                />
              </Form.Group>
              <Button 
                variant="primary" 
                type="submit" 
                disabled={submitting || !newAnswer.trim()}
              >
                {submitting ? (
                  <>
                    <Spinner as="span" animation="border" size="sm" className="me-2" />
                    Envoi...
                  </>
                ) : (
                  'Publier la réponse'
                )}
              </Button>
            </Form>
          )}
        </Card.Body>
      </Card>
    </div>
  );
};

export default QuestionDetail;
