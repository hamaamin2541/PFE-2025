import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Form, Spinner, Tab, Nav, Alert } from 'react-bootstrap';
import {
  BarChart2, PieChart, Download, RefreshCw, Users, BookOpen, DollarSign,
  UserPlus, GraduationCap, ShoppingCart, CreditCard
} from 'lucide-react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title, PointElement, LineElement } from 'chart.js';
import { Pie, Bar, Line } from 'react-chartjs-2';
import axios from 'axios';
import { API_BASE_URL } from '../../config/api';
import './ReportsStyles.css';

// Register ChartJS components
ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  PointElement,
  LineElement
);

const ReportsManagement = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [dateRange, setDateRange] = useState('last30days');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [reportData, setReportData] = useState({
    users: {
      totalUsers: 0,
      newUsers: 0,
      usersByRole: [],
      usersByMonth: { months: [], counts: [] }
    },
    content: {
      totalContent: 0,
      contentByType: [],
      contentByMonth: { months: [], counts: [] }
    },
    sales: {
      totalRevenue: 0,
      totalSales: 0,
      salesByMonth: { months: [], counts: [] },
      revenueByMonth: { months: [], revenues: [] }
    }
  });

  useEffect(() => {
    fetchReportData();
  }, [dateRange, customStartDate, customEndDate]);

  const fetchReportData = async () => {
    try {
      setLoading(true);

      const token = localStorage.getItem('token');

      if (!token) {
        setError('Vous devez être connecté pour accéder aux rapports');
        setLoading(false);
        return;
      }

      // Construire les paramètres de requête
      const params = new URLSearchParams();
      params.append('dateRange', dateRange);

      if (dateRange === 'custom' && customStartDate && customEndDate) {
        params.append('startDate', customStartDate);
        params.append('endDate', customEndDate);
      }

      // Appel à l'API pour récupérer les données de rapport
      const response = await axios.get(`${API_BASE_URL}/api/admin/reports?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.data.success) {
        setReportData(response.data.data);
      } else {
        setError(response.data.message || 'Erreur lors de la récupération des données');
      }

      setLoading(false);
    } catch (err) {
      console.error('Error fetching report data:', err);

      // En cas d'erreur, utiliser des données de démonstration
      const mockData = {
        users: {
          totalUsers: 1250,
          newUsers: 85,
          usersByRole: [
            { role: 'student', count: 1050 },
            { role: 'teacher', count: 180 },
            { role: 'admin', count: 20 }
          ],
          usersByMonth: {
            months: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
            counts: [45, 52, 68, 74, 62, 90, 85, 95, 110, 120, 135, 150]
          }
        },
        content: {
          totalContent: 320,
          contentByType: [
            { type: 'courses', count: 180 },
            { type: 'tests', count: 95 },
            { type: 'formations', count: 45 }
          ],
          contentByMonth: {
            months: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
            counts: [12, 15, 18, 22, 25, 28, 30, 32, 35, 38, 42, 45]
          }
        },
        sales: {
          totalRevenue: 45250.75,
          totalSales: 850,
          salesByMonth: {
            months: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
            counts: [35, 42, 55, 62, 70, 75, 80, 85, 90, 95, 105, 110]
          },
          revenueByMonth: {
            months: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
            revenues: [1850, 2250, 3100, 3500, 3800, 4200, 4500, 4800, 5100, 5400, 5750, 6000]
          }
        }
      };

      setReportData(mockData);
      setError('Impossible de se connecter au serveur. Affichage des données de démonstration.');
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      await fetchReportData();
      setSuccessMessage('Données de rapport actualisées avec succès');

      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
    } catch (err) {
      console.error('Error refreshing report data:', err);
      setError('Une erreur est survenue lors de l\'actualisation des données');
    } finally {
      setRefreshing(false);
    }
  };

  const handleExport = async (reportType) => {
    try {
      const token = localStorage.getItem('token');

      if (!token) {
        setError('Vous devez être connecté pour exporter les rapports');
        return;
      }

      setSuccessMessage(`Préparation de l'exportation du rapport ${reportType}...`);

      // Préparer les données pour la requête d'exportation
      const requestData = {
        reportType: reportType === 'utilisateurs' ? 'users' :
                    reportType === 'contenu' ? 'courses' :
                    reportType === 'ventes' ? 'sales' : 'users',
        format: 'pdf', // Format par défaut
        dateRange: dateRange
      };

      // Ajouter les dates personnalisées si nécessaire
      if (dateRange === 'custom' && customStartDate && customEndDate) {
        requestData.startDate = customStartDate;
        requestData.endDate = customEndDate;
      }

      // Appel à l'API pour générer le rapport
      const response = await axios.post(
        `${API_BASE_URL}/api/exports/report`,
        requestData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        setSuccessMessage(`Exportation du rapport ${reportType} démarrée. Le fichier sera disponible dans la section Exportations.`);
      } else {
        setError(response.data.message || 'Erreur lors de l\'exportation du rapport');
      }

      // Effacer le message de succès après 5 secondes
      setTimeout(() => {
        setSuccessMessage('');
      }, 5000);
    } catch (err) {
      console.error('Error exporting report:', err);
      setError('Une erreur est survenue lors de l\'exportation du rapport');

      // Effacer le message d'erreur après 5 secondes
      setTimeout(() => {
        setError('');
      }, 5000);
    }
  };

  // Chart data for users by role
  const userRoleData = {
    labels: reportData.users.usersByRole.map(item => item.role),
    datasets: [
      {
        data: reportData.users.usersByRole.map(item => item.count),
        backgroundColor: ['#4e73df', '#1cc88a', '#36b9cc'],
        hoverBackgroundColor: ['#2e59d9', '#17a673', '#2c9faf'],
        hoverBorderColor: 'rgba(234, 236, 244, 1)',
      },
    ],
  };

  // Chart data for content by type
  const contentTypeData = {
    labels: reportData.content.contentByType.map(item => item.type),
    datasets: [
      {
        data: reportData.content.contentByType.map(item => item.count),
        backgroundColor: ['#f6c23e', '#e74a3b', '#fd7e14'],
        hoverBackgroundColor: ['#dda20a', '#be2617', '#c96209'],
        hoverBorderColor: 'rgba(234, 236, 244, 1)',
      },
    ],
  };

  // Chart data for users by month
  const usersByMonthData = {
    labels: reportData.users.usersByMonth.months,
    datasets: [
      {
        label: 'Nouveaux utilisateurs',
        data: reportData.users.usersByMonth.counts,
        backgroundColor: 'rgba(78, 115, 223, 0.8)',
        borderColor: 'rgba(78, 115, 223, 1)',
        borderWidth: 1,
      },
    ],
  };

  // Chart data for content by month
  const contentByMonthData = {
    labels: reportData.content.contentByMonth.months,
    datasets: [
      {
        label: 'Nouveau contenu',
        data: reportData.content.contentByMonth.counts,
        backgroundColor: 'rgba(246, 194, 62, 0.8)',
        borderColor: 'rgba(246, 194, 62, 1)',
        borderWidth: 1,
      },
    ],
  };

  // Chart data for sales by month
  const salesByMonthData = {
    labels: reportData.sales.salesByMonth.months,
    datasets: [
      {
        label: 'Ventes',
        data: reportData.sales.salesByMonth.counts,
        backgroundColor: 'rgba(28, 200, 138, 0.8)',
        borderColor: 'rgba(28, 200, 138, 1)',
        borderWidth: 1,
      },
    ],
  };

  // Chart data for revenue by month
  const revenueByMonthData = {
    labels: reportData.sales.revenueByMonth.months,
    datasets: [
      {
        label: 'Revenus ((dt))',
        data: reportData.sales.revenueByMonth.revenues,
        fill: false,
        backgroundColor: 'rgba(231, 74, 59, 0.8)',
        borderColor: 'rgba(231, 74, 59, 1)',
        tension: 0.1,
      },
    ],
  };

  if (loading) {
    return (
      <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '50vh' }}>
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Chargement...</span>
        </Spinner>
      </Container>
    );
  }

  return (
    <Container fluid className="py-4">
      <h4 className="mb-4">Rapports analytiques</h4>

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

      <Card className="shadow-sm mb-4">
        <Card.Body>
          <Row className="align-items-center">
            <Col md={6}>
              <div className="d-flex align-items-center">
                <div className="period-label me-3">Période</div>
                <select
                  className="form-select period-select"
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value)}
                >
                  <option value="last7days">7 derniers jours</option>
                  <option value="last30days">30 derniers jours</option>
                  <option value="last90days">90 derniers jours</option>
                  <option value="thisMonth">Ce mois-ci</option>
                  <option value="lastMonth">Mois dernier</option>
                  <option value="thisYear">Cette année</option>
                  <option value="lastYear">Année dernière</option>
                  <option value="custom">Période personnalisée</option>
                </select>
                <Button
                  variant="outline-secondary"
                  className="refresh-button ms-3"
                  onClick={handleRefresh}
                  disabled={refreshing}
                >
                  {refreshing ? (
                    <Spinner
                      as="span"
                      animation="border"
                      size="sm"
                      role="status"
                      aria-hidden="true"
                    />
                  ) : (
                    <RefreshCw size={16} />
                  )}
                </Button>
              </div>
            </Col>

            {dateRange === 'custom' && (
              <Col md={6}>
                <Row>
                  <Col>
                    <Form.Group>
                      <Form.Label>Début</Form.Label>
                      <Form.Control
                        type="date"
                        value={customStartDate}
                        onChange={(e) => setCustomStartDate(e.target.value)}
                      />
                    </Form.Group>
                  </Col>
                  <Col>
                    <Form.Group>
                      <Form.Label>Fin</Form.Label>
                      <Form.Control
                        type="date"
                        value={customEndDate}
                        onChange={(e) => setCustomEndDate(e.target.value)}
                      />
                    </Form.Group>
                  </Col>
                </Row>
              </Col>
            )}
          </Row>
        </Card.Body>
      </Card>

      <Tab.Container defaultActiveKey="users">
        <Row>
          <Col md={12} className="mb-4">
            <Nav variant="tabs">
              <Nav.Item>
                <Nav.Link eventKey="users" className="d-flex align-items-center">
                  <Users size={16} className="me-2" />
                  <span>Utilisateurs</span>
                </Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey="content" className="d-flex align-items-center">
                  <BookOpen size={16} className="me-2" />
                  <span>Contenu</span>
                </Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey="sales" className="d-flex align-items-center">
                  <DollarSign size={16} className="me-2" />
                  <span>Ventes</span>
                </Nav.Link>
              </Nav.Item>
            </Nav>
          </Col>

          <Col md={12}>
            <Tab.Content>
              {/* Users Report */}
              <Tab.Pane eventKey="users">
                <div className="section-header">
                  <div className="d-flex justify-content-between align-items-center">
                    <h3>Statistiques des utilisateurs</h3>
                    <Button
                      variant="outline-primary"
                      className="export-button-lg"
                      onClick={() => handleExport('utilisateurs')}
                    >
                      <Download size={16} className="me-2" />
                      <span>Exporter</span>
                    </Button>
                  </div>
                  <div className="section-divider"></div>
                </div>

                <Row className="stats-summary">
                  <Col md={6} lg={3} className="mb-4">
                    <Card className="stat-card">
                      <Card.Body>
                        <div className="stat-card-content">
                          <div className="stat-card-icon users-icon">
                            <Users size={24} />
                          </div>
                          <div>
                            <div className="stat-card-label">Total utilisateurs</div>
                            <div className="stat-card-value">
                              {reportData.users.totalUsers}
                            </div>
                          </div>
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>

                  <Col md={6} lg={3} className="mb-4">
                    <Card className="stat-card">
                      <Card.Body>
                        <div className="stat-card-content">
                          <div className="stat-card-icon new-users-icon">
                            <UserPlus size={24} />
                          </div>
                          <div>
                            <div className="stat-card-label">Nouveaux</div>
                            <div className="stat-card-value">
                              {reportData.users.newUsers}
                            </div>
                          </div>
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>

                  <Col md={6} lg={3} className="mb-4">
                    <Card className="stat-card">
                      <Card.Body>
                        <div className="stat-card-content">
                          <div className="stat-card-icon students-icon">
                            <GraduationCap size={24} />
                          </div>
                          <div>
                            <div className="stat-card-label">Étudiants</div>
                            <div className="stat-card-value">
                              {reportData.users.usersByRole.find(r => r.role === 'student')?.count || 0}
                            </div>
                          </div>
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>

                  <Col md={6} lg={3} className="mb-4">
                    <Card className="stat-card">
                      <Card.Body>
                        <div className="stat-card-content">
                          <div className="stat-card-icon teachers-icon">
                            <BookOpen size={24} />
                          </div>
                          <div>
                            <div className="stat-card-label">Enseignants</div>
                            <div className="stat-card-value">
                              {reportData.users.usersByRole.find(r => r.role === 'teacher')?.count || 0}
                            </div>
                          </div>
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                </Row>

                <Row>
                  <Col md={5} className="mb-4">
                    <Card className="h-100">
                      <Card.Header>
                        <h5 className="card-title mb-0">Répartition par rôle</h5>
                      </Card.Header>
                      <Card.Body>
                        <div className="chart-container" style={{ height: '300px' }}>
                          <Pie
                            data={userRoleData}
                            options={{
                              maintainAspectRatio: false,
                              responsive: true,
                              plugins: {
                                legend: {
                                  position: 'bottom',
                                  labels: {
                                    boxWidth: 12,
                                    padding: 15,
                                    font: {
                                      size: 12
                                    }
                                  }
                                }
                              }
                            }}
                          />
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>

                  <Col md={7} className="mb-4">
                    <Card className="h-100">
                      <Card.Header>
                        <h5 className="card-title mb-0">Évolution des utilisateurs</h5>
                      </Card.Header>
                      <Card.Body>
                        <div className="chart-container" style={{ height: '300px' }}>
                          <Bar
                            data={usersByMonthData}
                            options={{
                              maintainAspectRatio: false,
                              responsive: true,
                              plugins: {
                                legend: {
                                  display: false
                                },
                                tooltip: {
                                  mode: 'index',
                                  intersect: false,
                                }
                              },
                              scales: {
                                y: {
                                  beginAtZero: true,
                                  ticks: {
                                    precision: 0
                                  }
                                }
                              }
                            }}
                          />
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                </Row>
              </Tab.Pane>

              {/* Content Report */}
              <Tab.Pane eventKey="content">
                <div className="section-header">
                  <div className="d-flex justify-content-between align-items-center">
                    <h3>Statistiques du contenu</h3>
                    <Button
                      variant="outline-primary"
                      className="export-button-lg"
                      onClick={() => handleExport('contenu')}
                    >
                      <Download size={16} className="me-2" />
                      <span>Exporter</span>
                    </Button>
                  </div>
                  <div className="section-divider"></div>
                </div>

                <Row className="stats-summary">
                  <Col md={6} lg={4} className="mb-4">
                    <Card className="stat-card">
                      <Card.Body>
                        <div className="stat-card-content">
                          <div className="stat-card-icon courses-icon">
                            <BookOpen size={24} />
                          </div>
                          <div>
                            <div className="stat-card-label">Cours</div>
                            <div className="stat-card-value">
                              {reportData.content.contentByType.find(t => t.type === 'courses')?.count || 0}
                            </div>
                          </div>
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>

                  <Col md={6} lg={4} className="mb-4">
                    <Card className="stat-card">
                      <Card.Body>
                        <div className="stat-card-content">
                          <div className="stat-card-icon tests-icon">
                            <PieChart size={24} />
                          </div>
                          <div>
                            <div className="stat-card-label">Tests</div>
                            <div className="stat-card-value">
                              {reportData.content.contentByType.find(t => t.type === 'tests')?.count || 0}
                            </div>
                          </div>
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>

                  <Col md={6} lg={4} className="mb-4">
                    <Card className="stat-card">
                      <Card.Body>
                        <div className="stat-card-content">
                          <div className="stat-card-icon formations-icon">
                            <BarChart2 size={24} />
                          </div>
                          <div>
                            <div className="stat-card-label">Formations</div>
                            <div className="stat-card-value">
                              {reportData.content.contentByType.find(t => t.type === 'formations')?.count || 0}
                            </div>
                          </div>
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                </Row>

                <Row>
                  <Col md={5} className="mb-4">
                    <Card className="h-100">
                      <Card.Header>
                        <h5 className="card-title mb-0">Répartition par type</h5>
                      </Card.Header>
                      <Card.Body>
                        <div className="chart-container" style={{ height: '300px' }}>
                          <Pie
                            data={contentTypeData}
                            options={{
                              maintainAspectRatio: false,
                              responsive: true,
                              plugins: {
                                legend: {
                                  position: 'bottom',
                                  labels: {
                                    boxWidth: 12,
                                    padding: 15,
                                    font: {
                                      size: 12
                                    }
                                  }
                                }
                              }
                            }}
                          />
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>

                  <Col md={7} className="mb-4">
                    <Card className="h-100">
                      <Card.Header>
                        <h5 className="card-title mb-0">Évolution du contenu</h5>
                      </Card.Header>
                      <Card.Body>
                        <div className="chart-container" style={{ height: '300px' }}>
                          <Bar
                            data={contentByMonthData}
                            options={{
                              maintainAspectRatio: false,
                              responsive: true,
                              plugins: {
                                legend: {
                                  display: false
                                },
                                tooltip: {
                                  mode: 'index',
                                  intersect: false,
                                }
                              },
                              scales: {
                                y: {
                                  beginAtZero: true,
                                  ticks: {
                                    precision: 0
                                  }
                                }
                              }
                            }}
                          />
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                </Row>
              </Tab.Pane>

              {/* Sales Report */}
              <Tab.Pane eventKey="sales">
                <div className="section-header">
                  <div className="d-flex justify-content-between align-items-center">
                    <h3>Statistiques des ventes</h3>
                    <Button
                      variant="outline-primary"
                      className="export-button-lg"
                      onClick={() => handleExport('ventes')}
                    >
                      <Download size={16} className="me-2" />
                      <span>Exporter</span>
                    </Button>
                  </div>
                  <div className="section-divider"></div>
                </div>

                <Row className="stats-summary">
                  <Col md={6} lg={6} className="mb-4">
                    <Card className="stat-card">
                      <Card.Body>
                        <div className="stat-card-content">
                          <div className="stat-card-icon sales-icon">
                            <ShoppingCart size={24} />
                          </div>
                          <div>
                            <div className="stat-card-label">Total des ventes</div>
                            <div className="stat-card-value">
                              {reportData.sales.totalSales}
                            </div>
                          </div>
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>

                  <Col md={6} lg={6} className="mb-4">
                    <Card className="stat-card">
                      <Card.Body>
                        <div className="stat-card-content">
                          <div className="stat-card-icon revenue-icon">
                            <CreditCard size={24} />
                          </div>
                          <div>
                            <div className="stat-card-label">Revenus totaux</div>
                            <div className="stat-card-value">
                              {reportData.sales.totalRevenue.toFixed(2)} €
                            </div>
                          </div>
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                </Row>

                <Row>
                  <Col md={5} className="mb-4">
                    <Card className="h-100">
                      <Card.Header>
                        <h5 className="card-title mb-0">Ventes par mois</h5>
                      </Card.Header>
                      <Card.Body>
                        <div className="chart-container" style={{ height: '300px' }}>
                          <Bar
                            data={salesByMonthData}
                            options={{
                              maintainAspectRatio: false,
                              responsive: true,
                              plugins: {
                                legend: {
                                  display: false
                                }
                              },
                              scales: {
                                y: {
                                  beginAtZero: true,
                                  ticks: {
                                    precision: 0
                                  }
                                }
                              }
                            }}
                          />
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>

                  <Col md={7} className="mb-4">
                    <Card className="h-100">
                      <Card.Header>
                        <h5 className="card-title mb-0">Évolution des revenus</h5>
                      </Card.Header>
                      <Card.Body>
                        <div className="chart-container" style={{ height: '300px' }}>
                          <Line
                            data={revenueByMonthData}
                            options={{
                              maintainAspectRatio: false,
                              responsive: true,
                              plugins: {
                                legend: {
                                  display: false
                                },
                                tooltip: {
                                  mode: 'index',
                                  intersect: false,
                                }
                              },
                              scales: {
                                y: {
                                  beginAtZero: true
                                }
                              }
                            }}
                          />
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                </Row>
              </Tab.Pane>
            </Tab.Content>
          </Col>
        </Row>
      </Tab.Container>
    </Container>
  );
};

export default ReportsManagement;
