import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Table, Badge, Spinner } from 'react-bootstrap';
import { Users, DollarSign, BarChart2 } from 'lucide-react';
import axios from 'axios';
import { API_BASE_URL } from '../../config/api';
import { Link } from 'react-router-dom';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Bar } from 'react-chartjs-2';
import './AdminDashboard.css';

// Enregistrer les composants ChartJS
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const TeacherRevenueDashboard = () => {
    const [revenueData, setRevenueData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchRevenueData = async () => {
            try {
                setLoading(true);
                const token = localStorage.getItem('token');

                const response = await axios.get(`${API_BASE_URL}/api/admin/prof`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (response.data.success) {
                    setRevenueData(response.data.data);
                } else {
                    setError('Erreur lors de la récupération des données');
                }
            } catch (err) {
                console.error('Error fetching teacher revenue:', err);
                setError('Une erreur est survenue lors du chargement des données de revenus');
            } finally {
                setLoading(false);
            }
        };

        fetchRevenueData();
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

    if (!revenueData) {
        return null;
    }

    // Calculer les statistiques globales
    const totalRevenue = revenueData.reduce((sum, teacher) => sum + teacher.totalRevenue, 0);
    const totalTeachers = revenueData.length;

    // Données pour le graphique des revenus par professeur
    const revenueChartData = {
        labels: revenueData.map(teacher => teacher.fullName),
        datasets: [
            {
                label: 'Revenus (€)',
                data: revenueData.map(teacher => teacher.totalRevenue),
                backgroundColor: 'rgba(78, 115, 223, 0.8)',
                borderColor: 'rgba(78, 115, 223, 1)',
                borderWidth: 1,
            },
        ],
    };

    return (
        <Container fluid className="dashboard-container py-4 fade-in">
            <div className="dashboard-header mb-4">
                <div className="dashboard-header-content">
                    <h1 className="dashboard-title">Tableau de bord des revenus des professeurs</h1>
                    <p className="dashboard-subtitle">Vue d'ensemble des revenus générés par les professeurs</p>
                </div>
                <div className="dashboard-header-actions">
                    <Link to="/admin/reports/teachers" className="btn btn-outline-primary btn-sm me-2 btn-with-icon">
            <span className="d-flex align-items-center">
              <BarChart2 size={16} className="me-1" />
              Rapports détaillés
            </span>
                    </Link>
                    <Link to="/admin/users/new" className="btn btn-primary btn-sm btn-with-icon">
            <span className="d-flex align-items-center">
              <Users size={16} className="me-1" />
              Ajouter un professeur
            </span>
                    </Link>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="stats-cards mb-4">
                <div className="stat-card">
                    <div className="stat-card-header">
                        <div>
                            <h6 className="stat-card-title">Revenus totaux</h6>
                            <h2 className="stat-card-value">{totalRevenue.toFixed(2)} €</h2>
                        </div>
                        <div className="stat-card-icon success">
                            <DollarSign size={24} />
                        </div>
                    </div>
                    <div className="stat-card-footer">
                        <div className="stat-detail">
                            <span className="stat-label">Inscriptions:</span>
                            <span className="stat-value">
                {revenueData.reduce((sum, teacher) => sum + teacher.enrollmentCount, 0)}
              </span>
                        </div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-card-header">
                        <div>
                            <h6 className="stat-card-title">Professeurs</h6>
                            <h2 className="stat-card-value">{totalTeachers}</h2>
                        </div>
                        <div className="stat-card-icon primary">
                            <Users size={24} />
                        </div>
                    </div>
                    <div className="stat-card-footer">
                        <div className="stat-detail">
                            <span className="stat-label">Actifs:</span>
                            <span className="stat-value">{totalTeachers}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Dashboard Content */}
            <div className="dashboard-content">
                <Row className="gx-4">
                    {/* Left Column */}
                    <Col lg={8} className="pe-lg-4">
                        {/* Revenue Chart */}
                        <div className="chart-card mb-4">
                            <div className="chart-card-header">
                                <h6 className="chart-card-title">Revenus par professeur</h6>
                            </div>
                            <div className="chart-card-body">
                                <div className="chart-container">
                                    <Bar
                                        data={revenueChartData}
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
                                                        precision: 2
                                                    }
                                                },
                                                x: {
                                                    ticks: {
                                                        autoSkip: false,
                                                        maxRotation: 45,
                                                        minRotation: 45
                                                    }
                                                }
                                            }
                                        }}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Teachers Revenue Table */}
                        <div className="table-card mb-4">
                            <div className="table-card-header">
                                <h6 className="table-card-title">Revenus des professeurs</h6>
                                <Link to="/admin/teachers" className="btn btn-sm btn-outline-primary">
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
                                            <th>Revenus (€)</th>
                                            <th>Inscriptions</th>
                                        </tr>
                                        </thead>
                                        <tbody>
                                        {revenueData.map((teacher, index) => (
                                            <tr key={index}>
                                                <td>
                                                    <div className="d-flex align-items-center">
                                                        <div className="avatar-placeholder me-2">
                                                            {teacher.fullName.charAt(0).toUpperCase()}
                                                        </div>
                                                        <div>{teacher.fullName}</div>
                                                    </div>
                                                </td>
                                                <td>{teacher.email}</td>
                                                <td>
                                                    <Badge bg="success">{teacher.totalRevenue.toFixed(2)} €</Badge>
                                                </td>
                                                <td>{teacher.enrollmentCount}</td>
                                            </tr>
                                        ))}
                                        </tbody>
                                    </Table>
                                </div>
                            </div>
                        </div>
                    </Col>

                    {/* Right Column */}
                    <Col lg={4} className="ps-lg-4">
                        {/* Quick Actions Card */}
                        <div className="quick-actions-card mb-4">
                            <div className="card-header">
                                <h6 className="card-title">Actions rapides</h6>
                            </div>
                            <div className="card-body">
                                <div className="action-buttons">
                                    <Link to="/admin/users/new" className="btn btn-primary btn-action">
                                        <Users size={18} />
                                        <span>Ajouter un professeur</span>
                                    </Link>
                                    <Link to="/admin/courses/new" className="btn btn-success btn-action">
                                        <DollarSign size={18} />
                                        <span>Ajouter un cours</span>
                                    </Link>
                                    <Link to="/admin/reports/teachers" className="btn btn-info btn-action">
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

export default TeacherRevenueDashboard;