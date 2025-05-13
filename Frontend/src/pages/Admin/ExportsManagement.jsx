import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Table, Form, Alert, Spinner, Badge, Modal } from 'react-bootstrap';
import { Download, FileText, Calendar, Filter, Clock, CheckCircle, XCircle, RefreshCw, Plus } from 'lucide-react';
import axios from 'axios';
import { API_BASE_URL } from '../../config/api';

const ExportsManagement = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [exports, setExports] = useState([]);
  const [showNewExportModal, setShowNewExportModal] = useState(false);
  const [exportType, setExportType] = useState('users');
  const [dateRange, setDateRange] = useState('all');
  const [format, setFormat] = useState('csv');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    fetchExports();
  }, []);

  const fetchExports = async () => {
    try {
      setLoading(true);
      
      // In a real application, this would be an API call
      // For now, we'll just simulate a delay and use mock data
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Mock data for exports
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
        },
        {
          id: '3',
          name: 'sales_export_20230620',
          type: 'sales',
          format: 'csv',
          status: 'completed',
          size: '2.8 MB',
          records: 230,
          createdAt: new Date(2023, 5, 20, 16, 45),
          completedAt: new Date(2023, 5, 20, 16, 48)
        },
        {
          id: '4',
          name: 'complaints_export_20230625',
          type: 'complaints',
          format: 'json',
          status: 'failed',
          size: '-',
          records: 0,
          createdAt: new Date(2023, 5, 25, 9, 0),
          completedAt: null
        }
      ];
      
      setExports(mockExports);
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
      
      // In a real application, this would be an API call
      // For now, we'll just simulate a delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Create a new export object
      const now = new Date();
      const newExport = {
        id: `${exports.length + 1}`,
        name: `${exportType}_export_${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}`,
        type: exportType,
        format: format,
        status: 'completed',
        size: '1.5 MB',
        records: Math.floor(Math.random() * 200) + 50,
        createdAt: now,
        completedAt: new Date(now.getTime() + 2 * 60 * 1000) // 2 minutes later
      };
      
      // Add the new export to the list
      setExports([newExport, ...exports]);
      
      setSuccessMessage('Exportation générée avec succès');
      setGenerating(false);
      handleCloseNewExportModal();
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
    } catch (err) {
      console.error('Error generating export:', err);
      setError('Une erreur est survenue lors de la génération de l\'exportation');
      setGenerating(false);
    }
  };

  const handleDownload = (exportItem) => {
    // In a real application, this would trigger a download
    // For now, we'll just show a success message
    setSuccessMessage(`Téléchargement de ${exportItem.name}.${exportItem.format} démarré`);
    
    // Clear success message after 3 seconds
    setTimeout(() => {
      setSuccessMessage('');
    }, 3000);
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
        return <FileText size={16} className="text-primary" />;
      case 'courses':
        return <FileText size={16} className="text-success" />;
      case 'sales':
        return <FileText size={16} className="text-warning" />;
      case 'complaints':
        return <FileText size={16} className="text-danger" />;
      default:
        return <FileText size={16} />;
    }
  };

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
                      <tr key={exportItem.id}>
                        <td className="d-flex align-items-center">
                          {getTypeIcon(exportItem.type)}
                          <span className="ms-2">{exportItem.name}</span>
                        </td>
                        <td>{exportItem.type}</td>
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
                        Aucune exportation trouvée
                      </td>
                    </tr>
                  )}
                </tbody>
              </Table>
            </div>
          )}
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
