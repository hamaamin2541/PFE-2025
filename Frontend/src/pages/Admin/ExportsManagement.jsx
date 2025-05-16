import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Table, Form, Alert, Spinner, Badge, Modal, Nav, Tab } from 'react-bootstrap';
import { Download, FileText, Calendar, Filter, Clock, CheckCircle, XCircle, RefreshCw, Plus, User, Book, FileBox } from 'lucide-react';
import axios from 'axios';
import { API_BASE_URL } from '../../config/api';

const ExportsManagement = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [exports, setExports] = useState([]);
  const [studentExports, setStudentExports] = useState([]);
  const [loadingStudentExports, setLoadingStudentExports] = useState(true);
  const [showNewExportModal, setShowNewExportModal] = useState(false);
  const [exportType, setExportType] = useState('users');
  const [dateRange, setDateRange] = useState('all');
  const [format, setFormat] = useState('csv');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [generating, setGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState('admin');

  useEffect(() => {
    fetchExports();
    fetchStudentExports();
  }, []);

  const fetchExports = async () => {
    try {
      setLoading(true);

      const token = localStorage.getItem('token');

      if (!token) {
        setError('Vous devez être connecté pour accéder aux exportations');
        setLoading(false);
        return;
      }

      try {
        // Get admin exports (reports)
        console.log('Fetching exports with token:', token);
        const response = await axios.get(`${API_BASE_URL}/api/exports`, {
          headers: {
            'Authorization': `Bearer ${token}`
          },
          validateStatus: function (status) {
            return status < 500; // Only reject if the status code is greater than or equal to 500
          }
        });

        if (response.data.success) {
          // Filter to only show report exports
          const reportExports = response.data.data.filter(exp => exp.contentType === 'report');

          // Format the data
          const formattedExports = reportExports.map(exp => ({
            _id: exp._id,
            name: exp.fileName,
            type: exp.reportType || 'unknown',
            format: exp.format,
            status: exp.status,
            size: `${(exp.fileSize / 1024).toFixed(2)} KB`,
            records: '-', // This information is not available directly
            createdAt: new Date(exp.exportDate || exp.createdAt),
            completedAt: exp.status === 'completed' ? new Date(exp.updatedAt) : null,
            fileName: exp.fileName,
            filePath: exp.filePath
          }));

          setExports(formattedExports);
        } else {
          console.error('Error in response:', response.data);
          setError('Erreur lors de la récupération des exportations');
        }
      } catch (apiError) {
        console.error('API Error:', apiError);

        // If we can't get real data, use mock data for demonstration
        const mockExports = [
          {
            id: '1',
            name: 'users_export_20230601',
            type: 'users',
            format: 'csv',
            status: 'completed',
            size: '1.2 MB',
            records: 120,
            createdAt: new Date(2023, 5, 1, 14, 30),
            completedAt: new Date(2023, 5, 1, 14, 32)
          },
          {
            id: '2',
            name: 'courses_export_20230615',
            type: 'courses',
            format: 'xlsx',
            status: 'completed',
            size: '3.5 MB',
            records: 45,
            createdAt: new Date(2023, 5, 15, 10, 15),
            completedAt: new Date(2023, 5, 15, 10, 18)
          }
        ];

        setExports(mockExports);
        setError('Impossible de se connecter au serveur. Affichage des données de démonstration.');
      }

      setLoading(false);
    } catch (err) {
      console.error('Error fetching exports:', err);
      setError('Une erreur est survenue lors du chargement des exportations');
      setLoading(false);
    }
  };

  const handleCloseNewExportModal = () => {
    setShowNewExportModal(false);
    setExportType('users');
    setDateRange('all');
    setFormat('csv');
    setCustomStartDate('');
    setCustomEndDate('');
  };

  const handleShowNewExportModal = () => {
    setShowNewExportModal(true);
  };

  const handleGenerateExport = async () => {
    try {
      setGenerating(true);

      const token = localStorage.getItem('token');

      if (!token) {
        setError('Vous devez être connecté pour générer une exportation');
        setGenerating(false);
        return;
      }

      // Prepare request data
      const requestData = {
        reportType: exportType,
        format: format,
        dateRange: dateRange
      };

      // Add custom date range if selected
      if (dateRange === 'custom') {
        if (!customStartDate || !customEndDate) {
          setError('Veuillez sélectionner une date de début et de fin');
          setGenerating(false);
          return;
        }
        requestData.startDate = customStartDate;
        requestData.endDate = customEndDate;
      }

      // Call the API to generate the report
      console.log('Generating report with token:', token);
      const response = await axios.post(
        `${API_BASE_URL}/api/exports/report`,
        requestData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          validateStatus: function (status) {
            return status < 500; // Only reject if the status code is greater than or equal to 500
          }
        }
      );

      if (response.data.success) {
        setSuccessMessage('Exportation générée avec succès. Le fichier sera disponible dans quelques instants.');

        // Add the new export to the list
        const newExport = {
          _id: response.data.data._id,
          name: response.data.data.fileName,
          type: response.data.data.reportType,
          format: response.data.data.format,
          status: 'pending',
          size: '0 KB',
          records: '-',
          createdAt: new Date(),
          completedAt: null,
          fileName: response.data.data.fileName,
          filePath: response.data.data.filePath
        };

        setExports([newExport, ...exports]);

        // Close the modal
        handleCloseNewExportModal();

        // Refresh the exports list after a delay to get the updated status
        setTimeout(() => {
          fetchExports();
        }, 5000);
      } else {
        setError(response.data.message || 'Erreur lors de la génération de l\'exportation');
      }

      setGenerating(false);

      // Clear success message after 5 seconds
      setTimeout(() => {
        setSuccessMessage('');
      }, 5000);
    } catch (err) {
      console.error('Error generating export:', err);
      setError(err.response?.data?.message || 'Une erreur est survenue lors de la génération de l\'exportation');
      setGenerating(false);
    }
  };

  const handleDownload = async (exportItem) => {
    try {
      const token = localStorage.getItem('token');

      if (!token) {
        setError('Vous devez être connecté pour télécharger ce fichier');
        return;
      }

      // For mock data, create and download a sample file
      if (exportItem.id) {
        // This is mock data, create a sample file for download
        const content = `Sample ${exportItem.type} export data\n`;
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);

        // Create a temporary link and trigger download
        const a = document.createElement('a');
        a.href = url;
        a.download = `${exportItem.name}.${exportItem.format}`;
        document.body.appendChild(a);
        a.click();

        // Clean up
        setTimeout(() => {
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }, 100);

        setSuccessMessage(`Téléchargement de ${exportItem.name}.${exportItem.format} démarré`);
      } else {
        // For real data with _id, use a direct AJAX request with proper headers
        setSuccessMessage(`Préparation du téléchargement de ${exportItem.fileName || exportItem._id}.${exportItem.format}...`);

        try {
          // Create a hidden form for POST download request
          const form = document.createElement('form');
          form.method = 'GET';
          form.action = `${API_BASE_URL}/api/exports/download/${exportItem._id}`;
          form.target = '_blank';

          // Add token as hidden field
          const tokenField = document.createElement('input');
          tokenField.type = 'hidden';
          tokenField.name = 'token';
          tokenField.value = token;
          form.appendChild(tokenField);

          // Submit the form
          document.body.appendChild(form);
          form.submit();

          // Clean up
          setTimeout(() => {
            document.body.removeChild(form);
          }, 100);

          setSuccessMessage(`Téléchargement de ${exportItem.fileName || exportItem._id}.${exportItem.format} démarré`);
        } catch (downloadError) {
          console.error('Error initiating download:', downloadError);

          // Fallback to direct link
          const downloadUrl = `${API_BASE_URL}/api/exports/download/${exportItem._id}?token=${token}`;

          // Try using fetch API as another fallback
          console.log('Downloading with fetch API, token:', token);
          fetch(downloadUrl, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`
            }
          })
          .then(response => {
            if (!response.ok) throw new Error('Network response was not ok');
            return response.blob();
          })
          .then(blob => {
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = exportItem.fileName || `export-${exportItem._id}.${exportItem.format}`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            setSuccessMessage(`Téléchargement de ${exportItem.fileName || exportItem._id}.${exportItem.format} démarré`);
          })
          .catch(fetchError => {
            console.error('Fetch error:', fetchError);
            // Last resort: window.open
            window.open(downloadUrl, '_blank');
          });
        }
      }

      // Clear success message after 5 seconds
      setTimeout(() => {
        setSuccessMessage('');
      }, 5000);
    } catch (err) {
      console.error('Error downloading export:', err);
      setError('Erreur lors du téléchargement de l\'exportation');
    }
  };

  const formatDate = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString() + ' ' + new Date(date).toLocaleTimeString();
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'completed':
        return <Badge bg="success">Terminé</Badge>;
      case 'pending':
        return <Badge bg="warning">En cours</Badge>;
      case 'failed':
        return <Badge bg="danger">Échoué</Badge>;
      default:
        return <Badge bg="secondary">{status}</Badge>;
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'users':
        return <User size={16} className="text-primary" />;
      case 'courses':
        return <Book size={16} className="text-success" />;
      case 'sales':
        return <FileText size={16} className="text-warning" />;
      case 'complaints':
        return <FileText size={16} className="text-danger" />;
      case 'course':
        return <Book size={16} className="text-primary" />;
      case 'formation':
        return <FileBox size={16} className="text-warning" />;
      case 'test':
        return <FileText size={16} className="text-info" />;
      default:
        return <FileText size={16} />;
    }
  };

  const fetchStudentExports = async () => {
    try {
      setLoadingStudentExports(true);

      const token = localStorage.getItem('token');

      if (!token) {
        setLoadingStudentExports(false);
        return;
      }

      try {
        console.log('Fetching student exports with token:', token);
        const response = await axios.get(`${API_BASE_URL}/api/exports`, {
          headers: {
            'Authorization': `Bearer ${token}`
          },
          validateStatus: function (status) {
            return status < 500; // Only reject if the status code is greater than or equal to 500
          }
        });

        if (response.data.success) {
          // Filter to only show non-report exports (student content exports)
          const contentExports = response.data.data.filter(exp => exp.contentType !== 'report');
          setStudentExports(contentExports);
        } else {
          console.error('Error fetching student exports:', response.data);
        }
      } catch (apiError) {
        console.error('API Error fetching student exports:', apiError);

        // Use mock data if API fails
        const mockStudentExports = [
          {
            _id: 's1',
            contentType: 'course',
            format: 'pdf',
            status: 'completed',
            fileName: 'course_export_123.pdf',
            fileSize: 1024 * 500, // 500KB
            exportDate: new Date(),
            user: {
              fullName: 'Jean Dupont',
              email: 'jean@example.com'
            },
            content: {
              title: 'Introduction à JavaScript'
            }
          },
          {
            _id: 's2',
            contentType: 'formation',
            format: 'zip',
            status: 'completed',
            fileName: 'formation_export_456.zip',
            fileSize: 1024 * 1200, // 1.2MB
            exportDate: new Date(),
            user: {
              fullName: 'Marie Martin',
              email: 'marie@example.com'
            },
            content: {
              title: 'Formation complète en développement web'
            }
          }
        ];

        setStudentExports(mockStudentExports);
      }

      setLoadingStudentExports(false);
    } catch (err) {
      console.error('Error fetching student exports:', err);
      setLoadingStudentExports(false);
    }
  };

  // We're now using the unified handleDownload function for both admin and student exports

  return (
    <Container fluid className="py-4">
      <Card className="shadow mb-4">
        <Card.Header className="py-3 d-flex flex-row align-items-center justify-content-between">
          <h6 className="m-0 font-weight-bold text-primary">Gestion des exportations</h6>
          <Button variant="primary" size="sm" onClick={handleShowNewExportModal}>
            <Plus size={16} className="me-1" />
            Nouvelle exportation
          </Button>
        </Card.Header>
        <Card.Body>
          {successMessage && (
            <Alert variant="success" onClose={() => setSuccessMessage('')} dismissible>
              {successMessage}
            </Alert>
          )}

          {error && (
            <Alert variant="danger" onClose={() => setError(null)} dismissible>
              {error}
            </Alert>
          )}

          <Tab.Container id="exports-tabs" activeKey={activeTab} onSelect={(k) => setActiveTab(k)}>
            <Nav variant="tabs" className="mb-3">
              <Nav.Item>
                <Nav.Link eventKey="admin">Exportations administratives</Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey="student">Exportations des étudiants</Nav.Link>
              </Nav.Item>
            </Nav>

            <Tab.Content>
              <Tab.Pane eventKey="admin">
                {loading ? (
                  <div className="text-center py-4">
                    <Spinner animation="border" role="status">
                      <span className="visually-hidden">Chargement...</span>
                    </Spinner>
                  </div>
                ) : (
                  <div className="table-responsive">
                    <Table hover>
                      <thead>
                        <tr>
                          <th>Nom</th>
                          <th>Type</th>
                          <th>Format</th>
                          <th>Taille</th>
                          <th>Enregistrements</th>
                          <th>Date de création</th>
                          <th>Statut</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {exports.length > 0 ? (
                          exports.map((exportItem) => (
                            <tr key={exportItem._id || exportItem.id}>
                              <td className="d-flex align-items-center">
                                {getTypeIcon(exportItem.type)}
                                <span className="ms-2">{exportItem.name}</span>
                              </td>
                              <td>
                                {exportItem.type === 'users' ? 'Utilisateurs' :
                                 exportItem.type === 'courses' ? 'Cours' :
                                 exportItem.type === 'sales' ? 'Ventes' :
                                 exportItem.type === 'complaints' ? 'Réclamations' : exportItem.type}
                              </td>
                              <td>{exportItem.format.toUpperCase()}</td>
                              <td>{exportItem.size}</td>
                              <td>{exportItem.records}</td>
                              <td>{formatDate(exportItem.createdAt)}</td>
                              <td>{getStatusBadge(exportItem.status)}</td>
                              <td>
                                {exportItem.status === 'completed' ? (
                                  <Button
                                    variant="outline-primary"
                                    size="sm"
                                    onClick={() => handleDownload(exportItem)}
                                    title="Télécharger"
                                  >
                                    <Download size={16} />
                                  </Button>
                                ) : exportItem.status === 'pending' ? (
                                  <Button
                                    variant="outline-warning"
                                    size="sm"
                                    onClick={() => fetchExports()}
                                    title="Rafraîchir"
                                  >
                                    <RefreshCw size={16} />
                                  </Button>
                                ) : (
                                  <Button
                                    variant="outline-secondary"
                                    size="sm"
                                    disabled
                                    title="Téléchargement non disponible"
                                  >
                                    <Download size={16} />
                                  </Button>
                                )}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="8" className="text-center">
                              Aucune exportation trouvée
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </Table>
                  </div>
                )}
              </Tab.Pane>

              <Tab.Pane eventKey="student">
                {loadingStudentExports ? (
                  <div className="text-center py-4">
                    <Spinner animation="border" role="status">
                      <span className="visually-hidden">Chargement...</span>
                    </Spinner>
                  </div>
                ) : (
                  <div className="table-responsive">
                    <Table hover>
                      <thead>
                        <tr>
                          <th>Étudiant</th>
                          <th>Contenu</th>
                          <th>Type</th>
                          <th>Format</th>
                          <th>Taille</th>
                          <th>Date d'exportation</th>
                          <th>Statut</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {studentExports.length > 0 ? (
                          studentExports.map((exportItem) => (
                            <tr key={exportItem._id}>
                              <td>{exportItem.user?.fullName || 'Utilisateur inconnu'}</td>
                              <td>{exportItem.content?.title || 'Contenu non disponible'}</td>
                              <td className="d-flex align-items-center">
                                {getTypeIcon(exportItem.contentType)}
                                <span className="ms-2">
                                  {exportItem.contentType === 'course' ? 'Cours' :
                                   exportItem.contentType === 'formation' ? 'Formation' : 'Test'}
                                </span>
                              </td>
                              <td>{exportItem.format.toUpperCase()}</td>
                              <td>{(exportItem.fileSize / 1024).toFixed(2)} KB</td>
                              <td>{formatDate(exportItem.exportDate)}</td>
                              <td>{getStatusBadge(exportItem.status)}</td>
                              <td>
                                {exportItem.status === 'completed' ? (
                                  <Button
                                    variant="outline-primary"
                                    size="sm"
                                    onClick={() => handleDownload(exportItem)}
                                  >
                                    <Download size={16} />
                                  </Button>
                                ) : (
                                  <Button
                                    variant="outline-secondary"
                                    size="sm"
                                    disabled
                                  >
                                    <Download size={16} />
                                  </Button>
                                )}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="8" className="text-center">
                              Aucune exportation d'étudiant trouvée
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </Table>
                  </div>
                )}
              </Tab.Pane>
            </Tab.Content>
          </Tab.Container>
        </Card.Body>
      </Card>

      {/* Modal for new export */}
      <Modal show={showNewExportModal} onHide={handleCloseNewExportModal}>
        <Modal.Header closeButton>
          <Modal.Title>Nouvelle exportation</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Type d'exportation</Form.Label>
              <Form.Select
                value={exportType}
                onChange={(e) => setExportType(e.target.value)}
              >
                <option value="users">Utilisateurs</option>
                <option value="courses">Cours</option>
                <option value="sales">Ventes</option>
                <option value="complaints">Réclamations</option>
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Période</Form.Label>
              <Form.Select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
              >
                <option value="all">Toutes les données</option>
                <option value="today">Aujourd'hui</option>
                <option value="yesterday">Hier</option>
                <option value="last7days">7 derniers jours</option>
                <option value="last30days">30 derniers jours</option>
                <option value="thisMonth">Ce mois-ci</option>
                <option value="lastMonth">Mois dernier</option>
                <option value="custom">Période personnalisée</option>
              </Form.Select>
            </Form.Group>

            {dateRange === 'custom' && (
              <Row className="mb-3">
                <Col>
                  <Form.Group>
                    <Form.Label>Date de début</Form.Label>
                    <Form.Control
                      type="date"
                      value={customStartDate}
                      onChange={(e) => setCustomStartDate(e.target.value)}
                    />
                  </Form.Group>
                </Col>
                <Col>
                  <Form.Group>
                    <Form.Label>Date de fin</Form.Label>
                    <Form.Control
                      type="date"
                      value={customEndDate}
                      onChange={(e) => setCustomEndDate(e.target.value)}
                    />
                  </Form.Group>
                </Col>
              </Row>
            )}

            <Form.Group className="mb-3">
              <Form.Label>Format</Form.Label>
              <Form.Select
                value={format}
                onChange={(e) => setFormat(e.target.value)}
              >
                <option value="csv">CSV</option>
                <option value="xlsx">Excel (XLSX)</option>
                <option value="json">JSON</option>
                <option value="pdf">PDF</option>
              </Form.Select>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseNewExportModal}>
            Annuler
          </Button>
          <Button
            variant="primary"
            onClick={handleGenerateExport}
            disabled={generating || (dateRange === 'custom' && (!customStartDate || !customEndDate))}
          >
            {generating ? (
              <>
                <Spinner
                  as="span"
                  animation="border"
                  size="sm"
                  role="status"
                  aria-hidden="true"
                  className="me-2"
                />
                Génération...
              </>
            ) : (
              <>
                <Download size={16} className="me-2" />
                Générer
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default ExportsManagement;
