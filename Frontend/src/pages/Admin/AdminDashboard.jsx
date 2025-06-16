import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Table, Badge, Spinner } from 'react-bootstrap';
import {
  Users, BookOpen, FileText, GraduationCap, DollarSign,
  MessageSquare, AlertTriangle, BarChart2, PieChart, TrendingUp
} from 'lucide-react';
import axios from 'axios';
import { API_BASE_URL } from '../../config/api';
import { Link } from 'react-router-dom';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';
import './AdminDashboard.css';

// Enregistrer les composants ChartJS
ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeChart, setActiveChart] = useState('enrollments');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');

        // Try to fetch stats from the API
        try {
          const response = await axios.get(`${API_BASE_URL}/api/admin/dashboard`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });

          if (response.data.success) {
            console.log(response.data.data);
            setStats(response.data.data);
            return;
          }
        } catch (apiError) {
          console.error('API error:', apiError);
          // Continue to fallback data if API fails
        }

        // Fallback: Use mock data if API call fails
        console.log('Using mock data for dashboard');
      /*  const mockData = {
          counts: {
            users: { total: 120, students: 100, teachers: 19, admin: 1 },
            content: { total: 45, courses: 25, tests: 15, formations: 5 },
            revenue: 1250.75,
            enrollments: 85,
            complaints: { total: 8, pending: 3, resolved: 5 },
            contactMessages: { total: 15, unread: 4 },
            messages: 32
          },
          recent: {
            users: [
              { fullName: 'John Doe', email: 'john@example.com', role: 'student', createdAt: new Date() },
              { fullName: 'Jane Smith', email: 'jane@example.com', role: 'teacher', createdAt: new Date() }
            ],
            complaints: [
              { subject: 'Course Issue', type: 'technical', status: 'pending', createdAt: new Date() },
              { subject: 'Payment Problem', type: 'billing', status: 'resolved', createdAt: new Date() }
            ],
            contactMessages: []
          },
          charts: {
            usersByRole: [
              { role: 'student', count: 100 },
              { role: 'teacher', count: 19 },
              { role: 'admin', count: 1 }
            ],
            contentByType: [
              { type: 'courses', count: 25 },
              { type: 'tests', count: 15 },
              { type: 'formations', count: 5 }
            ],
            enrollmentsByMonth: {
              months: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
              counts: [5, 8, 12, 15, 20, 25]
            },
            revenueByMonth: {
              months: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
              revenues: [150, 220, 310, 380, 450, 520]
            }
          }
        };*/

      } catch (err) {
        console.error('Error in dashboard component:', err);
        setError('Une erreur est survenue lors du chargement du tableau de bord');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '80vh' }}>
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Chargement...</span>
        </Spinner>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="mt-5">
        <Card className="text-center p-4 bg-light">
          <Card.Body>
            <Card.Title className="text-danger">Erreur</Card.Title>
            <Card.Text>{error}</Card.Text>
            <Button variant="primary" onClick={() => window.location.reload()}>
              Réessayer
            </Button>
          </Card.Body>
        </Card>
      </Container>
    );
  }

  if (!stats) {
    return null;
  }

  // Données pour le graphique des utilisateurs par rôle
  const userRoleData = {
    labels: stats.charts.usersByRole.map(item => item.role),
    datasets: [
      {
        data: stats.charts.usersByRole.map(item => item.count),
        backgroundColor: ['#4e73df', '#1cc88a', '#36b9cc'],
        hoverBackgroundColor: ['#2e59d9', '#17a673', '#2c9faf'],
        hoverBorderColor: 'rgba(234, 236, 244, 1)',
      },
    ],
  };

  // Données pour le graphique du contenu par type
  const contentTypeData = {
    labels: stats.charts.contentByType.map(item => item.type),
    datasets: [
      {
        data: stats.charts.contentByType.map(item => item.count),
        backgroundColor: ['#f6c23e', '#e74a3b', '#fd7e14'],
        hoverBackgroundColor: ['#dda20a', '#be2617', '#c96209'],
        hoverBorderColor: 'rgba(234, 236, 244, 1)',
      },
    ],
  };

  // Données pour le graphique des inscriptions par mois
  const enrollmentData = {
    labels: stats.charts.enrollmentsByMonth.months,
    datasets: [
      {
        label: 'Inscriptions',
        data: stats.charts.enrollmentsByMonth.counts,
        backgroundColor: 'rgba(78, 115, 223, 0.8)',
        borderColor: 'rgba(78, 115, 223, 1)',
        borderWidth: 1,
      },
    ],
  };

  // Données pour le graphique des revenus par mois
  const revenueData = {
    labels: stats.charts.revenueByMonth.months,
    datasets: [
      {
        label: 'Revenus (€)',
        data: stats.charts.revenueByMonth.revenues,
        backgroundColor: 'rgba(28, 200, 138, 0.8)',
        borderColor: 'rgba(28, 200, 138, 1)',
        borderWidth: 1,
      },
    ],
  };

  return (
    <Container fluid className="dashboard-container py-4 fade-in">
      <div className="dashboard-header mb-4">
        <div className="dashboard-header-content">
          <h1 className="dashboard-title">Tableau de bord d'administration</h1>
          <p className="dashboard-subtitle">Vue d'ensemble des statistiques et activités récentes</p>
        </div>
        <div className="dashboard-header-actions">
          <Link to="/admin/reports/users" className="btn btn-outline-primary btn-sm me-2 btn-with-icon">
            <span className="d-flex align-items-center">
              <BarChart2 size={16} className="me-1" />
              Rapports
            </span>
          </Link>
          <Link to="/admin/users/new" className="btn btn-primary btn-sm btn-with-icon">
            <span className="d-flex align-items-center">
              <Users size={16} className="me-1" />
              Nouvel utilisateur
            </span>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="stats-cards mb-4">
        <div className="stat-card">
          <div className="stat-card-header">
            <div>
              <h6 className="stat-card-title">Utilisateurs</h6>
              <h2 className="stat-card-value">{stats.counts.users.total}</h2>
            </div>
            <div className="stat-card-icon primary">
              <Users size={24} />
            </div>
          </div>
          <div className="stat-card-footer">
            <div className="stat-detail">
              <span className="stat-label">Étudiants:</span>
              <span className="stat-value">{stats.counts.users.students}</span>
            </div>
            <div className="stat-detail">
              <span className="stat-label">Professeurs:</span>
              <span className="stat-value">{stats.counts.users.teachers}</span>
            </div>
          </div>
        </div>

        <Link to="/admin/prof" style={{ textDecoration: 'none' }}>
          <div className="stat-card" style={{ cursor: 'pointer' }}>
            <div className="stat-card-header">
              <div>
                <h6 className="stat-card-title">Revenus</h6>
                <h2 className="stat-card-value">{stats.counts.revenue.toFixed(2)} €</h2>
              </div>
              <div className="stat-card-icon success">
                <DollarSign size={24} />
              </div>
            </div>
            <div className="stat-card-footer">
              <div className="stat-detail">
                <span className="stat-label">Inscriptions:</span>
                <span className="stat-value">{stats.counts.enrollments}</span>
              </div>
            </div>
          </div>
        </Link>
        <div className="stat-card">
          <div className="stat-card-header">
            <div>
              <h6 className="stat-card-title">Contenu</h6>
              <h2 className="stat-card-value">{stats.counts.content.total}</h2>
            </div>
            <div className="stat-card-icon info">
              <BookOpen size={24} />
            </div>
          </div>
          <div className="stat-card-footer">
            <div className="stat-detail">
              <span className="stat-label">Cours:</span>
              <span className="stat-value">{stats.counts.content.courses}</span>
            </div>
            <div className="stat-detail">
              <span className="stat-label">Tests:</span>
              <span className="stat-value">{stats.counts.content.tests}</span>
            </div>
            <div className="stat-detail">
              <span className="stat-label">Formations:</span>
              <span className="stat-value">{stats.counts.content.formations}</span>
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-header">
            <div>
              <h6 className="stat-card-title">Réclamations</h6>
              <h2 className="stat-card-value">{stats.counts.complaints.pending}</h2>
            </div>
            <div className="stat-card-icon warning">
              <AlertTriangle size={24} />
            </div>
          </div>
          <div className="stat-card-footer">
            <div className="stat-detail">
              <span className="stat-label">Total:</span>
              <span className="stat-value">{stats.counts.complaints.total}</span>
            </div>
            <div className="stat-detail">
              <span className="stat-label">Résolues:</span>
              <span className="stat-value">{stats.counts.complaints.resolved}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Dashboard Content */}
      <div className="dashboard-content">
        <Row className="gx-4">
          {/* Left Column */}
          <Col lg={8} className="pe-lg-4" style={{height:"500px"}}>
            {/* Activity Charts */}
            <div className="chart-card mb-4">
              <div className="chart-card-header">
                <h6 className="chart-card-title">Activité mensuelle</h6>
                <div className="chart-actions">
                  <Button
                    variant={activeChart === 'enrollments' ? 'info' : 'outline-info'}
                    size="sm"
                    className="me-2"
                    onClick={() => setActiveChart('enrollments')}
                  >
                    Inscriptions
                  </Button>
                  <Button
                    variant={activeChart === 'revenue' ? 'success' : 'outline-success'}
                    size="sm"
                    onClick={() => setActiveChart('revenue')}
                  >
                    Revenus
                  </Button>
                </div>
              </div>
              <div className="chart-card-body">
                <div className="chart-container">
                  <Bar
                    data={activeChart === 'enrollments' ? enrollmentData : revenueData}
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
                            precision: activeChart === 'revenue' ? 2 : 0
                          }
                        }
                      }
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Recent Users Table */}
            <div className="table-card mb-4">
              <div className="table-card-header">
                <h6 className="table-card-title">Utilisateurs récents</h6>
                <Link to="/admin/users" className="btn btn-sm btn-outline-primary">
                  Voir tous
                </Link>
              </div>
              <div className="table-card-body">
                <div className="table-responsive">
                  <Table hover className="table-striped">
                    <thead>
                      <tr>
                        <th>Nom</th>
                        <th>Email</th>
                        <th>Rôle</th>
                        <th>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.recent.users.map((user, index) => (
                        <tr key={index}>
                          <td>
                            <div className="d-flex align-items-center">
                              <div className="avatar-placeholder me-2">
                                {user.fullName.charAt(0).toUpperCase()}
                              </div>
                              <div>{user.fullName}</div>
                            </div>
                          </td>
                          <td>{user.email}</td>
                          <td>
                            <Badge bg={user.role === 'admin' ? 'danger' : user.role === 'teacher' ? 'primary' : 'success'}>
                              {user.role}
                            </Badge>
                          </td>
                          <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              </div>
            </div>

            {/* Recent Complaints Table */}
            <div className="table-card mb-4">
              <div className="table-card-header">
                <h6 className="table-card-title">Réclamations récentes</h6>
                <Link to="/admin/complaints" className="btn btn-sm btn-outline-primary">
                  Voir toutes
                </Link>
              </div>
              <div className="table-card-body">
                <div className="table-responsive">
                  <Table hover className="table-striped">
                    <thead>
                      <tr>
                        <th>Sujet</th>
                        <th>Type</th>
                        <th>Statut</th>
                        <th>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.recent.complaints.map((complaint, index) => (
                        <tr key={index}>
                          <td>{complaint.subject}</td>
                          <td>{complaint.type}</td>
                          <td>
                            <Badge bg={
                              complaint.status === 'pending' ? 'warning' :
                              complaint.status === 'in_progress' ? 'info' :
                              complaint.status === 'resolved' ? 'success' : 'danger'
                            }>
                              {complaint.status}
                            </Badge>
                          </td>
                          <td>{new Date(complaint.createdAt).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              </div>
            </div>
          </Col>

          {/* Right Column */}
          <Col lg={4} className="ps-lg-4" style={{height:"350px"}}>
            {/* Distribution Charts */}
            <div className="chart-card mb-4">
              <div className="chart-card-header">
                <h6 className="chart-card-title">Utilisateurs par rôle</h6>
              </div>
              <div className="chart-card-body">
                <div className="chart-container">
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

            <div className="chart-card mb-4">
              <div className="chart-card-header">
                <h6 className="chart-card-title">Contenu par type</h6>
              </div>
              <div className="chart-card-body">
                <div className="chart-container">
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

            {/* Quick Actions Card */}
            <div className="quick-actions-card mb-4">
              <div className="card-header">
                <h6 className="card-title">Actions rapides</h6>
              </div>
              <div className="card-body">
                <div className="action-buttons">
                  <Link to="/admin/users/new" className="btn btn-primary btn-action">
                    <Users size={18} />
                    <span>Ajouter un utilisateur</span>
                  </Link>
                  <Link to="/admin/courses/new" className="btn btn-success btn-action">
                    <BookOpen size={18} />
                    <span>Ajouter un cours</span>
                  </Link>
                  <Link to="/admin/complaints" className="btn btn-warning btn-action">
                    <AlertTriangle size={18} />
                    <span>Gérer les réclamations</span>
                  </Link>
                  <Link to="/admin/reports/users" className="btn btn-info btn-action">
                    <BarChart2 size={18} />
                    <span>Voir les rapports</span>
                  </Link>
                </div>
              </div>
            </div>
          </Col>
        </Row>
      </div>
    </Container>
  );
};

export default AdminDashboard;
