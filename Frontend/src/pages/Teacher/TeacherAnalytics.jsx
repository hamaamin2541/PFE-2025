import React, { useEffect, useState } from 'react';
import { Card, OverlayTrigger, Tooltip, Dropdown } from 'react-bootstrap';
import {
  Users, BookOpen, DollarSign, Star, BarChart2, TrendingUp,
  ClipboardCheck, GraduationCap, Eye, Calendar, PieChart,
  MoreHorizontal, Download, RefreshCw, HelpCircle, Filter
} from 'lucide-react';
import {
  BarChart, Bar, LineChart, Line, PieChart as RechartsPieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  Legend, ResponsiveContainer, AreaChart, Area
} from 'recharts';
import { API_BASE_URL } from '../../config/api';
import './TeacherAnalytics.css';

// Placeholder component for empty charts
const PlaceholderChart = ({ icon: Icon, title, subtitle }) => (
  <div className="placeholder-chart">
    <Icon size={48} className="placeholder-chart-icon" />
    <div className="placeholder-chart-title">{title}</div>
    <div className="placeholder-chart-subtitle">{subtitle || "Aucune donnée disponible"}</div>
  </div>
);

// Loading component
const LoadingOverlay = ({ message = "Chargement des données..." }) => (
  <div className="loading-overlay">
    <div className="loading-container">
      <div className="loading-spinner"></div>
      <div className="loading-text">{message}</div>
    </div>
  </div>
);

// Custom tooltip component for charts
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="custom-tooltip">
        <p className="custom-tooltip-label">{label}</p>
        <p className="custom-tooltip-value">{payload[0].value}</p>
      </div>
    );
  }
  return null;
};

// Custom function to format data for charts if needed
const formatChartData = (data) => {
  return data;
};

export const TeacherAnalytics = () => {
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalCourses: 0,
    totalTests: 0,
    totalFormations: 0,
    totalRevenue: 0,
    averageRating: 0,
    totalViews: 0,
    courseViews: [],
    isLoading: true,
    error: null
  });

  // Chart data state
  const [chartData, setChartData] = useState({
    revenueData: [],
    enrollmentData: [],
    contentDistribution: []
  });

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE_URL}/api/courses/teacher/analytics`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const { data } = await response.json();

        // Update stats with data from the API
        setStats({
          totalStudents: data.totalStudents || 0,
          totalCourses: data.totalCourses || 0,
          totalTests: data.totalTests || 0,
          totalFormations: data.totalFormations || 0,
          totalRevenue: data.totalRevenue || 0,
          averageRating: parseFloat(data.averageRating) || 0,
          totalViews: data.totalViews || 0,
          courseViews: data.courseViews || [],
          isLoading: false,
          error: null
        });

        // Update chart data with data from the API
        setChartData({
          revenueData: data.revenueData || [],
          enrollmentData: data.enrollmentData || [],
          contentDistribution: data.contentDistribution || []
        });

        console.log('Analytics data loaded:', data);
      } catch (error) {
        console.error('Failed to fetch analytics:', error);
        setStats(prev => ({
          ...prev,
          isLoading: false,
          error: error.message
        }));

        // Set fallback data for charts if API call fails
        setChartData({
          revenueData: Array(12).fill(0).map((_, i) => ({
            name: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'][i],
            revenue: 0
          })),
          enrollmentData: ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map(day => ({
            name: day,
            enrollments: 0
          })),
          contentDistribution: [
            { name: 'Cours', value: 0 },
            { name: 'Tests', value: 0 },
            { name: 'Formations', value: 0 }
          ]
        });
      }
    };

    fetchAnalytics();
  }, []);

  // Define tooltip components for each card
  const renderTooltip = (props, content) => (
    <Tooltip id="button-tooltip" {...props}>
      {content}
    </Tooltip>
  );

  // Colors for charts
  const COLORS = ['#4361ee', '#2ecc71', '#00c2ff', '#e74c3c', '#764ba2', '#f39c12'];

  return (
    <div className="analytics-dashboard">
      {/* Dashboard Header */}
      <div className="analytics-header">
        <h2 className="analytics-title">Tableau de bord</h2>
        <p className="analytics-subtitle">Aperçu de vos performances et statistiques</p>
        {stats.error && (
          <div className="alert alert-danger mt-3">
            <strong>Erreur:</strong> {stats.error}
          </div>
        )}
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        {/* Students Card */}
        <OverlayTrigger
          placement="top"
          delay={{ show: 250, hide: 400 }}
          overlay={(props) => renderTooltip(props, "Nombre total d'étudiants qui ont acheté vos cours, tests ou formations")}
        >
          <Card className="stat-card stat-card-students">
            <div className="stat-card-content">
              <div className="stat-card-info">
                <div className="stat-card-label">Étudiants</div>
                <div className="stat-card-value">{stats.totalStudents}</div>
              </div>
              <div className="stat-icon-container">
                <Users size={24} className="text-primary" />
              </div>
            </div>
          </Card>
        </OverlayTrigger>

        {/* Views Card */}
        <OverlayTrigger
          placement="top"
          delay={{ show: 250, hide: 400 }}
          overlay={(props) => renderTooltip(props, "Nombre total de vues de vos cours")}
        >
          <Card className="stat-card stat-card-views">
            <div className="stat-card-content">
              <div className="stat-card-info">
                <div className="stat-card-label">Vues</div>
                <div className="stat-card-value">{stats.totalViews}</div>
              </div>
              <div className="stat-icon-container">
                <Eye size={24} className="text-success" />
              </div>
            </div>
          </Card>
        </OverlayTrigger>

        {/* Courses Card */}
        <OverlayTrigger
          placement="top"
          delay={{ show: 250, hide: 400 }}
          overlay={(props) => renderTooltip(props, "Nombre total de cours que vous avez publiés")}
        >
          <Card className="stat-card stat-card-courses">
            <div className="stat-card-content">
              <div className="stat-card-info">
                <div className="stat-card-label">Cours</div>
                <div className="stat-card-value">{stats.totalCourses}</div>
              </div>
              <div className="stat-icon-container">
                <BookOpen size={24} className="text-accent" />
              </div>
            </div>
          </Card>
        </OverlayTrigger>

        {/* Tests Card */}
        <OverlayTrigger
          placement="top"
          delay={{ show: 250, hide: 400 }}
          overlay={(props) => renderTooltip(props, "Nombre total de tests que vous avez publiés")}
        >
          <Card className="stat-card stat-card-tests">
            <div className="stat-card-content">
              <div className="stat-card-info">
                <div className="stat-card-label">Tests</div>
                <div className="stat-card-value">{stats.totalTests}</div>
              </div>
              <div className="stat-icon-container">
                <ClipboardCheck size={24} className="text-danger" />
              </div>
            </div>
          </Card>
        </OverlayTrigger>

        {/* Formations Card */}
        <OverlayTrigger
          placement="top"
          delay={{ show: 250, hide: 400 }}
          overlay={(props) => renderTooltip(props, "Nombre total de formations que vous avez publiées")}
        >
          <Card className="stat-card stat-card-formations">
            <div className="stat-card-content">
              <div className="stat-card-info">
                <div className="stat-card-label">Formations</div>
                <div className="stat-card-value">{stats.totalFormations}</div>
              </div>
              <div className="stat-icon-container">
                <GraduationCap size={24} className="text-purple" />
              </div>
            </div>
          </Card>
        </OverlayTrigger>

        {/* Revenue Card */}
        <OverlayTrigger
          placement="top"
          delay={{ show: 250, hide: 400 }}
          overlay={(props) => renderTooltip(props, "Revenus totaux de vos cours, tests et formations")}
        >
          <Card className="stat-card stat-card-revenue">
            <div className="stat-card-content">
              <div className="stat-card-info">
                <div className="stat-card-label">Revenus</div>
                <div className="stat-card-value">{stats.totalRevenue}€</div>
              </div>
              <div className="stat-icon-container">
                <DollarSign size={24} className="text-warning" />
              </div>
            </div>
          </Card>
        </OverlayTrigger>

        {/* Rating Card */}
        <OverlayTrigger
          placement="top"
          delay={{ show: 250, hide: 400 }}
          overlay={(props) => renderTooltip(props, "Note moyenne attribuée par vos étudiants")}
        >
          <Card className="stat-card stat-card-rating">
            <div className="stat-card-content">
              <div className="stat-card-info">
                <div className="stat-card-label">Note</div>
                <div className="stat-card-value">{stats.averageRating}</div>
              </div>
              <div className="stat-icon-container">
                <Star size={24} className="text-info" />
              </div>
            </div>
          </Card>
        </OverlayTrigger>
      </div>

      {/* Charts Section */}
      <div className="chart-section">
        <div className="chart-card">
          <div className="chart-card-header">
            <div className="chart-card-title">Vues des cours</div>
            <div className="chart-card-actions">
              <Dropdown>
                <Dropdown.Toggle variant="light" size="sm" id="dropdown-views">
                  <MoreHorizontal size={16} />
                </Dropdown.Toggle>
                <Dropdown.Menu>
                  <Dropdown.Item><Download size={14} className="me-2" /> Exporter</Dropdown.Item>
                  <Dropdown.Item><RefreshCw size={14} className="me-2" /> Actualiser</Dropdown.Item>
                  <Dropdown.Item><HelpCircle size={14} className="me-2" /> Aide</Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown>
            </div>
          </div>
          <div className="chart-card-body" style={{ position: 'relative' }}>
            {stats.isLoading && <LoadingOverlay message="Chargement des vues..." />}
            {!stats.isLoading && stats.courseViews && stats.courseViews.length > 0 ? (
              <div className="course-views-chart">
                {stats.courseViews.map((course, index) => (
                  <div key={course.id} className="course-view-item">
                    <div className="course-view-header">
                      <div className="course-view-title">{course.title}</div>
                      <div className="course-view-count">{course.views} vues</div>
                    </div>
                    <div className="course-view-progress">
                      <div
                        className="course-view-progress-bar"
                        style={{
                          width: `${Math.min(100, (course.views / (stats.totalViews || 1)) * 100)}%`
                        }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              !stats.isLoading && (
                <PlaceholderChart
                  icon={TrendingUp}
                  title="Aucune vue de cours"
                  subtitle="Les vues de vos cours s'afficheront ici une fois que vous aurez des visiteurs"
                />
              )
            )}
          </div>
        </div>
      </div>

      <div className="chart-section">
        <div className="chart-card">
          <div className="chart-card-header">
            <div className="chart-card-title">Inscriptions récentes</div>
            <div className="chart-card-actions">
              <Dropdown>
                <Dropdown.Toggle variant="light" size="sm" id="dropdown-enrollments">
                  <Filter size={16} />
                </Dropdown.Toggle>
                <Dropdown.Menu>
                  <Dropdown.Item>Cette semaine</Dropdown.Item>
                  <Dropdown.Item>Ce mois</Dropdown.Item>
                  <Dropdown.Item>Cette année</Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown>
            </div>
          </div>
          <div className="chart-card-body" style={{ position: 'relative' }}>
            {stats.isLoading && <LoadingOverlay message="Chargement des inscriptions..." />}
            {!stats.isLoading && chartData.enrollmentData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData.enrollmentData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <RechartsTooltip content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="custom-tooltip">
                          <p className="custom-tooltip-label">{label}</p>
                          <p className="custom-tooltip-value">{payload[0].value} inscriptions</p>
                        </div>
                      );
                    }
                    return null;
                  }} />
                  <Bar dataKey="enrollments" fill="#4361ee" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              !stats.isLoading && (
                <PlaceholderChart
                  icon={BarChart2}
                  title="Aucune inscription récente"
                  subtitle="Les inscriptions s'afficheront ici une fois que des étudiants s'inscriront à vos cours"
                />
              )
            )}
          </div>
        </div>
      </div>

      <div className="chart-section">
        <div className="chart-card">
          <div className="chart-card-header">
            <div className="chart-card-title">Revenus mensuels</div>
            <div className="chart-card-actions">
              <Dropdown>
                <Dropdown.Toggle variant="light" size="sm" id="dropdown-revenue">
                  <Calendar size={16} />
                </Dropdown.Toggle>
                <Dropdown.Menu>
                  <Dropdown.Item>3 derniers mois</Dropdown.Item>
                  <Dropdown.Item>6 derniers mois</Dropdown.Item>
                  <Dropdown.Item>Année complète</Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown>
            </div>
          </div>
          <div className="chart-card-body" style={{ position: 'relative' }}>
            {stats.isLoading && <LoadingOverlay message="Chargement des revenus..." />}
            {!stats.isLoading && chartData.revenueData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData.revenueData}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f39c12" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#f39c12" stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <RechartsTooltip content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="custom-tooltip">
                          <p className="custom-tooltip-label">{label}</p>
                          <p className="custom-tooltip-value">{payload[0].value}€</p>
                        </div>
                      );
                    }
                    return null;
                  }} />
                  <Area type="monotone" dataKey="revenue" stroke="#f39c12" fillOpacity={1} fill="url(#colorRevenue)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              !stats.isLoading && (
                <PlaceholderChart
                  icon={DollarSign}
                  title="Aucun revenu enregistré"
                  subtitle="Les revenus s'afficheront ici une fois que vous aurez des ventes"
                />
              )
            )}
          </div>
        </div>
      </div>

      <div className="chart-section">
        <div className="chart-card">
          <div className="chart-card-header">
            <div className="chart-card-title">Distribution du contenu</div>
          </div>
          <div className="chart-card-body" style={{ position: 'relative' }}>
            {stats.isLoading && <LoadingOverlay message="Chargement de la distribution..." />}
            {!stats.isLoading && chartData.contentDistribution.length > 0 &&
             chartData.contentDistribution.some(item => item.value > 0) ? (
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPieChart>
                  <Pie
                    data={chartData.contentDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {chartData.contentDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Legend />
                </RechartsPieChart>
              </ResponsiveContainer>
            ) : (
              !stats.isLoading && (
                <PlaceholderChart
                  icon={PieChart}
                  title="Aucun contenu"
                  subtitle="La distribution de votre contenu s'affichera ici une fois que vous aurez publié des cours, tests ou formations"
                />
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherAnalytics;