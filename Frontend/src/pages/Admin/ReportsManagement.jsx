import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Form, Spinner, Tab, Nav, Alert } from 'react-bootstrap';
import { BarChart2, PieChart, TrendingUp, Download, Calendar, Filter, RefreshCw, Users, BookOpen, DollarSign } from 'lucide-react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title, PointElement, LineElement } from 'chart.js';
import { Pie, Bar, Line } from 'react-chartjs-2';
import axios from 'axios';
import { API_BASE_URL } from '../../config/api';

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
      
      // In a real application, this would be an API call with date range parameters
      // For now, we'll just simulate a delay and use mock data
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock data for reports
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
      setLoading(false);
    } catch (err) {
      console.error('Error fetching report data:', err);
      setError('Une erreur est survenue lors du chargement des données de rapport');
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

  const handleExport = (reportType) => {
    // In a real application, this would trigger a download
    // For now, we'll just show a success message
    setSuccessMessage(`Exportation du rapport ${reportType} démarrée`);
    
    // Clear success message after 3 seconds
    setTimeout(() => {
      setSuccessMessage('');
    }, 3000);
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
        label: 'Revenus (€)',
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
              <Form.Group>
                <Form.Label>Période</Form.Label>
                <Form.Select
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
                </Form.Select>
              </Form.Group>
            </Col>
            
            {dateRange === 'custom' && (
              <Col md={4}>
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
            
            <Col md={dateRange === 'custom' ? 2 : 6} className="text-end">
              <Button
                variant="outline-primary"
                className="me-2"
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
            </Col>
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
                <Row>
                  <Col md={4} className="mb-4">
                    <Card className="shadow-sm h-100">
                      <Card.Body>
                        <div className="d-flex justify-content-between align-items-center mb-4">
                          <h5 className="card-title">Statistiques des utilisateurs</h5>
                          <Button
                            variant="outline-primary"
                            size="sm"
                            onClick={() => handleExport('utilisateurs')}
                          >
                            <Download size={16} />
                          </Button>
                        </div>
                        <div className="stats-container">
                          <div className="stat-item mb-3">
                            <div className="stat-label">Total des utilisateurs</div>
                            <div className="stat-value">{reportData.users.totalUsers}</div>
                          </div>
                          <div className="stat-item mb-3">
                            <div className="stat-label">Nouveaux utilisateurs</div>
                            <div className="stat-value">{reportData.users.newUsers}</div>
                          </div>
                          <div className="stat-item">
                            <div className="stat-label">Répartition par rôle</div>
                            <div className="chart-container" style={{ height: '250px' }}>
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
                                        padding: 15
                                      }
                                    }
                                  }
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                  
                  <Col md={8} className="mb-4">
                    <Card className="shadow-sm h-100">
                      <Card.Body>
                        <div className="d-flex justify-content-between align-items-center mb-4">
                          <h5 className="card-title">Évolution des utilisateurs</h5>
                        </div>
                        <div className="chart-container" style={{ height: '350px' }}>
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
                <Row>
                  <Col md={4} className="mb-4">
                    <Card className="shadow-sm h-100">
                      <Card.Body>
                        <div className="d-flex justify-content-between align-items-center mb-4">
                          <h5 className="card-title">Statistiques du contenu</h5>
                          <Button
                            variant="outline-primary"
                            size="sm"
                            onClick={() => handleExport('contenu')}
                          >
                            <Download size={16} />
                          </Button>
                        </div>
                        <div className="stats-container">
                          <div className="stat-item mb-3">
                            <div className="stat-label">Total du contenu</div>
                            <div className="stat-value">{reportData.content.totalContent}</div>
                          </div>
                          <div className="stat-item">
                            <div className="stat-label">Répartition par type</div>
                            <div className="chart-container" style={{ height: '250px' }}>
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
                                        padding: 15
                                      }
                                    }
                                  }
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                  
                  <Col md={8} className="mb-4">
                    <Card className="shadow-sm h-100">
                      <Card.Body>
                        <div className="d-flex justify-content-between align-items-center mb-4">
                          <h5 className="card-title">Évolution du contenu</h5>
                        </div>
                        <div className="chart-container" style={{ height: '350px' }}>
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
                <Row>
                  <Col md={4} className="mb-4">
                    <Card className="shadow-sm h-100">
                      <Card.Body>
                        <div className="d-flex justify-content-between align-items-center mb-4">
                          <h5 className="card-title">Statistiques des ventes</h5>
                          <Button
                            variant="outline-primary"
                            size="sm"
                            onClick={() => handleExport('ventes')}
                          >
                            <Download size={16} />
                          </Button>
                        </div>
                        <div className="stats-container">
                          <div className="stat-item mb-3">
                            <div className="stat-label">Total des ventes</div>
                            <div className="stat-value">{reportData.sales.totalSales}</div>
                          </div>
                          <div className="stat-item mb-3">
                            <div className="stat-label">Revenus totaux</div>
                            <div className="stat-value">{reportData.sales.totalRevenue.toFixed(2)} €</div>
                          </div>
                          <div className="stat-item">
                            <div className="stat-label">Ventes par mois</div>
                            <div className="chart-container" style={{ height: '250px' }}>
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
                          </div>
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                  
                  <Col md={8} className="mb-4">
                    <Card className="shadow-sm h-100">
                      <Card.Body>
                        <div className="d-flex justify-content-between align-items-center mb-4">
                          <h5 className="card-title">Évolution des revenus</h5>
                        </div>
                        <div className="chart-container" style={{ height: '350px' }}>
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
