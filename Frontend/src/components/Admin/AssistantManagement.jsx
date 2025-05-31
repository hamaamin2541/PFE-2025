import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Badge, Spinner, Alert, Modal, Form } from 'react-bootstrap';
import { UserCheck, UserX, Award, CheckCircle, XCircle, Info } from 'lucide-react';
import axios from 'axios';
import { API_BASE_URL } from '../../config/api';
import './AssistantManagement.css';

const AssistantManagement = () => {
  const [assistants, setAssistants] = useState([]);
  const [eligibleStudents, setEligibleStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showPromoteModal, setShowPromoteModal] = useState(false);
  const [showDemoteModal, setShowDemoteModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showEligibilityModal, setShowEligibilityModal] = useState(false);
  const [eligibilityDetails, setEligibilityDetails] = useState(null);
  const [bypassEligibility, setBypassEligibility] = useState(false);

  useEffect(() => {
    fetchAssistants();
    fetchEligibleStudents();
  }, []);

  const fetchAssistants = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await axios.get(`${API_BASE_URL}/api/assistants`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      setAssistants(response.data.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching assistants:', err);
      setError('Impossible de charger les assistants. Veuillez réessayer plus tard.');
    } finally {
      setLoading(false);
    }
  };

  const fetchEligibleStudents = async () => {
    try {
      const token = localStorage.getItem('token');
      
      const response = await axios.get(`${API_BASE_URL}/api/assistants/eligible-students`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      setEligibleStudents(response.data.data);
    } catch (err) {
      console.error('Error fetching eligible students:', err);
    }
  };

  const handlePromoteStudent = async (userId) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      await axios.post(
        `${API_BASE_URL}/api/assistants/promote/${userId}`,
        { checkEligibility: !bypassEligibility },
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      // Refresh the lists
      await fetchAssistants();
      await fetchEligibleStudents();
      
      // Close the modal
      setShowPromoteModal(false);
      setSelectedUser(null);
      setBypassEligibility(false);
      setError(null);
    } catch (err) {
      console.error('Error promoting student:', err);
      setError(err.response?.data?.message || 'Impossible de promouvoir l\'étudiant. Veuillez réessayer plus tard.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoteAssistant = async (userId) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      await axios.post(
        `${API_BASE_URL}/api/assistants/demote/${userId}`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      // Refresh the lists
      await fetchAssistants();
      await fetchEligibleStudents();
      
      // Close the modal
      setShowDemoteModal(false);
      setSelectedUser(null);
      setError(null);
    } catch (err) {
      console.error('Error demoting assistant:', err);
      setError(err.response?.data?.message || 'Impossible de rétrograder l\'assistant. Veuillez réessayer plus tard.');
    } finally {
      setLoading(false);
    }
  };

  const checkEligibility = async (userId) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await axios.get(`${API_BASE_URL}/api/assistants/eligibility/${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      setEligibilityDetails(response.data.data);
      setShowEligibilityModal(true);
      setError(null);
    } catch (err) {
      console.error('Error checking eligibility:', err);
      setError('Impossible de vérifier l\'éligibilité. Veuillez réessayer plus tard.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="assistant-management-container">
      <h2 className="mb-4">Gestion des Assistants</h2>
      
      {error && <Alert variant="danger">{error}</Alert>}
      
      <Card className="mb-4">
        <Card.Header className="d-flex justify-content-between align-items-center">
          <h5 className="mb-0">
            <UserCheck size={20} className="me-2" />
            Assistants actuels
          </h5>
        </Card.Header>
        <Card.Body>
          {loading && assistants.length === 0 ? (
            <div className="text-center my-4">
              <Spinner animation="border" variant="primary" />
              <p className="mt-2">Chargement des assistants...</p>
            </div>
          ) : assistants.length === 0 ? (
            <div className="text-center my-4">
              <UserCheck size={40} className="text-muted mb-2" />
              <p>Aucun assistant pour le moment.</p>
            </div>
          ) : (
            <Table responsive hover>
              <thead>
                <tr>
                  <th>Nom</th>
                  <th>Email</th>
                  <th>Date de promotion</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {assistants.map((assistant) => (
                  <tr key={assistant._id}>
                    <td>
                      <div className="d-flex align-items-center">
                        {assistant.profileImage ? (
                          <img 
                            src={`${API_BASE_URL}/${assistant.profileImage}`} 
                            alt={assistant.fullName}
                            className="rounded-circle me-2"
                            width="30"
                            height="30"
                          />
                        ) : (
                          <div className="user-avatar me-2">
                            {assistant.fullName.charAt(0).toUpperCase()}
                          </div>
                        )}
                        {assistant.fullName}
                        <Badge bg="info" className="ms-2">Assistant</Badge>
                      </div>
                    </td>
                    <td>{assistant.email}</td>
                    <td>{new Date(assistant.updatedAt).toLocaleDateString('fr-FR')}</td>
                    <td>
                      <Button 
                        variant="outline-danger" 
                        size="sm"
                        onClick={() => {
                          setSelectedUser(assistant);
                          setShowDemoteModal(true);
                        }}
                      >
                        <UserX size={16} className="me-1" />
                        Rétrograder
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>
      
      <Card>
        <Card.Header className="d-flex justify-content-between align-items-center">
          <h5 className="mb-0">
            <Award size={20} className="me-2" />
            Étudiants éligibles
          </h5>
        </Card.Header>
        <Card.Body>
          {loading && eligibleStudents.length === 0 ? (
            <div className="text-center my-4">
              <Spinner animation="border" variant="primary" />
              <p className="mt-2">Recherche d'étudiants éligibles...</p>
            </div>
          ) : eligibleStudents.length === 0 ? (
            <div className="text-center my-4">
              <Award size={40} className="text-muted mb-2" />
              <p>Aucun étudiant éligible pour le moment.</p>
              <Button 
                variant="outline-primary"
                onClick={() => {
                  setShowPromoteModal(true);
                  setSelectedUser(null);
                }}
              >
                Promouvoir un étudiant manuellement
              </Button>
            </div>
          ) : (
            <>
              <p className="text-muted mb-3">
                Ces étudiants remplissent les critères pour devenir assistants :
                <ul>
                  <li>Ont complété au moins 3 cours</li>
                  <li>Ont une moyenne de quiz supérieure à 80%</li>
                  <li>Se sont connectés au moins 10 fois ces 2 dernières semaines</li>
                </ul>
              </p>
              <Table responsive hover>
                <thead>
                  <tr>
                    <th>Nom</th>
                    <th>Email</th>
                    <th>Cours complétés</th>
                    <th>Moyenne quiz</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {eligibleStudents.map((student) => (
                    <tr key={student._id}>
                      <td>
                        <div className="d-flex align-items-center">
                          {student.profileImage ? (
                            <img 
                              src={`${API_BASE_URL}/${student.profileImage}`} 
                              alt={student.fullName}
                              className="rounded-circle me-2"
                              width="30"
                              height="30"
                            />
                          ) : (
                            <div className="user-avatar me-2">
                              {student.fullName.charAt(0).toUpperCase()}
                            </div>
                          )}
                          {student.fullName}
                        </div>
                      </td>
                      <td>{student.email}</td>
                      <td>{student.eligibility.details.completedCourses}</td>
                      <td>{student.eligibility.details.averageQuizScore.toFixed(1)}%</td>
                      <td>
                        <Button 
                          variant="outline-primary" 
                          size="sm"
                          className="me-2"
                          onClick={() => {
                            setSelectedUser(student);
                            setShowPromoteModal(true);
                          }}
                        >
                          <UserCheck size={16} className="me-1" />
                          Promouvoir
                        </Button>
                        <Button 
                          variant="outline-info" 
                          size="sm"
                          onClick={() => checkEligibility(student._id)}
                        >
                          <Info size={16} className="me-1" />
                          Détails
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
              <div className="mt-3">
                <Button 
                  variant="outline-primary"
                  onClick={() => {
                    setShowPromoteModal(true);
                    setSelectedUser(null);
                  }}
                >
                  Promouvoir un autre étudiant
                </Button>
              </div>
            </>
          )}
        </Card.Body>
      </Card>
      
      {/* Promote Modal */}
      <Modal show={showPromoteModal} onHide={() => setShowPromoteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Promouvoir un étudiant</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedUser ? (
            <p>Êtes-vous sûr de vouloir promouvoir <strong>{selectedUser.fullName}</strong> au rôle d'assistant ?</p>
          ) : (
            <Form.Group className="mb-3">
              <Form.Label>ID de l'étudiant à promouvoir</Form.Label>
              <Form.Control 
                type="text" 
                placeholder="Entrez l'ID de l'étudiant"
                onChange={(e) => setSelectedUser({ _id: e.target.value })}
              />
              <Form.Text className="text-muted">
                Entrez l'ID de l'étudiant que vous souhaitez promouvoir.
              </Form.Text>
            </Form.Group>
          )}
          
          <Form.Check 
            type="checkbox"
            id="bypass-eligibility"
            label="Ignorer les critères d'éligibilité"
            checked={bypassEligibility}
            onChange={(e) => setBypassEligibility(e.target.checked)}
            className="mt-3"
          />
          <Form.Text className="text-muted">
            Cochez cette case pour promouvoir l'étudiant même s'il ne remplit pas tous les critères.
          </Form.Text>
        </Modal.Body>
        <Modal.Footer>
          <Button className='btn-danger' onClick={() => setShowPromoteModal(false)}>
            Annuler
          </Button>
          <Button 
            className='btn-success'
            onClick={() => handlePromoteStudent(selectedUser?._id)}
            disabled={loading || !selectedUser}
          >
            {loading ? (
              <>
                <Spinner as="span" animation="border" size="sm" className="me-2" />
                Promotion...
              </>
            ) : (
              'Promouvoir'
            )}
          </Button>
        </Modal.Footer>
      </Modal>
      
      {/* Demote Modal */}
      <Modal show={showDemoteModal} onHide={() => setShowDemoteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Rétrograder un assistant</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Êtes-vous sûr de vouloir rétrograder <strong>{selectedUser?.fullName}</strong> au rôle d'étudiant ?</p>
        </Modal.Body>
        <Modal.Footer>
          <Button className='btn-danger' onClick={() => setShowDemoteModal(false)}>
            Annuler
          </Button>
          <Button 
            className='btn-success' 
            onClick={() => handleDemoteAssistant(selectedUser?._id)}
            disabled={loading}
          >
            {loading ? (
              <>
                <Spinner as="span" animation="border" size="sm" className="me-2" />
                Rétrogradation...
              </>
            ) : (
              'Rétrograder'
            )}
          </Button>
        </Modal.Footer>
      </Modal>
      
      {/* Eligibility Details Modal */}
      <Modal show={showEligibilityModal} onHide={() => setShowEligibilityModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Détails d'éligibilité</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {eligibilityDetails && (
            <div>
              <h5>{eligibilityDetails.user.fullName}</h5>
              <p className="text-muted">{eligibilityDetails.user.email}</p>
              
              <div className="eligibility-status mb-3">
                <h6>Statut d'éligibilité:</h6>
                {eligibilityDetails.eligibility.eligible ? (
                  <Badge bg="success" className="p-2">
                    <CheckCircle size={16} className="me-1" />
                    Éligible
                  </Badge>
                ) : (
                  <Badge bg="danger" className="p-2">
                    <XCircle size={16} className="me-1" />
                    Non éligible
                  </Badge>
                )}
              </div>
              
              <Table bordered>
                <thead>
                  <tr>
                    <th>Critère</th>
                    <th>Requis</th>
                    <th>Actuel</th>
                    <th>Statut</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Cours complétés</td>
                    <td>≥ 3</td>
                    <td>{eligibilityDetails.eligibility.details.completedCourses}</td>
                    <td>
                      {eligibilityDetails.eligibility.details.hasCompletedThreeCourses ? (
                        <CheckCircle size={16} className="text-success" />
                      ) : (
                        <XCircle size={16} className="text-danger" />
                      )}
                    </td>
                  </tr>
                  <tr>
                    <td>Moyenne des quiz</td>
                    <td>≥ 80%</td>
                    <td>{eligibilityDetails.eligibility.details.averageQuizScore.toFixed(1)}%</td>
                    <td>
                      {eligibilityDetails.eligibility.details.hasHighQuizScore ? (
                        <CheckCircle size={16} className="text-success" />
                      ) : (
                        <XCircle size={16} className="text-danger" />
                      )}
                    </td>
                  </tr>
                  <tr>
                    <td>Activité récente</td>
                    <td>≥ 10 connexions</td>
                    <td>{eligibilityDetails.eligibility.details.recentActivity}</td>
                    <td>
                      {eligibilityDetails.eligibility.details.hasRecentLogins ? (
                        <CheckCircle size={16} className="text-success" />
                      ) : (
                        <XCircle size={16} className="text-danger" />
                      )}
                    </td>
                  </tr>
                </tbody>
              </Table>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowEligibilityModal(false)}>
            Fermer
          </Button>
          {eligibilityDetails && !eligibilityDetails.eligibility.eligible && (
            <Button 
              className='btn-success' 
              onClick={() => {
                setShowEligibilityModal(false);
                setSelectedUser(eligibilityDetails.user);
                setBypassEligibility(true);
                setShowPromoteModal(true);
              }}
            >
              Promouvoir quand même
            </Button>
          )}
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default AssistantManagement;
