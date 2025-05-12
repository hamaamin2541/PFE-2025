import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, Link } from 'react-router-dom';
import { Container, Navbar, Nav, Dropdown, Button, Spinner } from 'react-bootstrap';
import { Bell, User, Menu, X, MessageSquare, AlertTriangle } from 'lucide-react';
import AdminSidebar from '../../components/Admin/AdminSidebar';
import axios from 'axios';
import { API_BASE_URL } from '../../config/api';
import './AdminStyles.css';

const AdminLayout = () => {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [unreadNotifications, setUnreadNotifications] = useState({
    complaints: 0,
    messages: 0,
    contacts: 0
  });

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/SeConnecter');
          return;
        }

        // Get user data from localStorage instead of making an API call
        const userData = JSON.parse(localStorage.getItem('user'));
        const userRole = localStorage.getItem('userRole');

        if (!userData || !userRole) {
          navigate('/SeConnecter');
          return;
        }

        // Vérifier si l'utilisateur est un administrateur
        if (userRole !== 'admin') {
          navigate('/');
          return;
        }

        setUser(userData);
        setLoading(false);
      } catch (err) {
        console.error('Error checking auth:', err);
        navigate('/SeConnecter');
        setLoading(false);
      }
    };

    checkAuth();
  }, [navigate]);

  useEffect(() => {
    // Fonction pour récupérer les notifications non lues
    const fetchUnreadNotifications = async () => {
      try {
        const token = localStorage.getItem('token');

        // Récupérer les réclamations en attente
        const complaintsResponse = await axios.get(`${API_BASE_URL}/api/complaints?status=pending&limit=1`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        // Récupérer les messages non lus
        const messagesResponse = await axios.get(`${API_BASE_URL}/api/messages/unread/count`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        // Récupérer les messages de contact non lus
        const contactsResponse = await axios.get(`${API_BASE_URL}/api/contact?status=unread&limit=1`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        setUnreadNotifications({
          complaints: complaintsResponse.data.pagination?.total || 0,
          messages: messagesResponse.data.count || 0,
          contacts: contactsResponse.data.pagination?.total || 0
        });
      } catch (err) {
        console.error('Error fetching notifications:', err);
      }
    };

    if (user) {
      fetchUnreadNotifications();

      // Mettre à jour les notifications toutes les 5 minutes
      const interval = setInterval(fetchUnreadNotifications, 5 * 60 * 1000);

      return () => clearInterval(interval);
    }
  }, [user]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    localStorage.removeItem('user');
    navigate('/SeConnecter');
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  if (loading) {
    return (
      <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '100vh' }}>
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Chargement...</span>
        </Spinner>
      </Container>
    );
  }

  const totalNotifications = unreadNotifications.complaints + unreadNotifications.messages + unreadNotifications.contacts;

  return (
    <div className="admin-layout">
      {/* Sidebar Overlay (visible on mobile when sidebar is open) */}
      <div
        className={`sidebar-overlay ${sidebarOpen ? 'visible' : ''}`}
        onClick={() => setSidebarOpen(false)}
      ></div>

      {/* Sidebar */}
      <div className={`admin-sidebar-container ${sidebarOpen ? 'open' : 'closed'}`}>
        <AdminSidebar onLogout={handleLogout} />
      </div>

      {/* Main Content */}
      <div className="admin-content-container">
        {/* Top Navigation Bar */}
        <Navbar bg="white" expand="lg" className="admin-navbar border-bottom shadow-sm">
          <Container fluid>
            {/* Sidebar Toggle Button */}
            <Button
              variant="light"
              className="sidebar-toggle border-0 me-3 d-flex align-items-center justify-content-center"
              onClick={toggleSidebar}
              aria-label="Toggle sidebar"
            >
              {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </Button>

            {/* Brand Logo and Title */}
            <Navbar.Brand as={Link} to="/admin/dashboard" className="fw-bold d-flex align-items-center">
              <span className="brand-logo me-2">WL</span>
              <span className="brand-text">Administration</span>
            </Navbar.Brand>

            {/* Right Navigation Items */}
            <Nav className="ms-auto d-flex align-items-center">
              {/* Notifications Dropdown */}
              <Dropdown align="end" className="me-3">
                <Dropdown.Toggle variant="light" id="dropdown-notifications" className="notification-toggle border-0 position-relative">
                  <Bell size={20} />
                  {totalNotifications > 0 && (
                    <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger notification-badge">
                      {totalNotifications > 99 ? '99+' : totalNotifications}
                    </span>
                  )}
                </Dropdown.Toggle>

                <Dropdown.Menu className="dropdown-menu-end shadow notification-menu">
                  <Dropdown.Header className="notification-header">Notifications</Dropdown.Header>

                  <div className="notification-list">
                    {unreadNotifications.complaints > 0 && (
                      <Dropdown.Item onClick={() => navigate('/admin/complaints')} className="notification-item">
                        <div className="d-flex align-items-center">
                          <div className="notification-icon warning">
                            <AlertTriangle size={16} />
                          </div>
                          <div className="notification-content">
                            <div className="notification-title">Réclamations en attente</div>
                            <div className="notification-text">{unreadNotifications.complaints} réclamation(s) non traitée(s)</div>
                          </div>
                        </div>
                      </Dropdown.Item>
                    )}

                    {unreadNotifications.messages > 0 && (
                      <Dropdown.Item onClick={() => navigate('/admin/messages')} className="notification-item">
                        <div className="d-flex align-items-center">
                          <div className="notification-icon primary">
                            <MessageSquare size={16} />
                          </div>
                          <div className="notification-content">
                            <div className="notification-title">Messages non lus</div>
                            <div className="notification-text">{unreadNotifications.messages} message(s) non lu(s)</div>
                          </div>
                        </div>
                      </Dropdown.Item>
                    )}

                    {unreadNotifications.contacts > 0 && (
                      <Dropdown.Item onClick={() => navigate('/admin/contact')} className="notification-item">
                        <div className="d-flex align-items-center">
                          <div className="notification-icon info">
                            <MessageSquare size={16} />
                          </div>
                          <div className="notification-content">
                            <div className="notification-title">Messages de contact</div>
                            <div className="notification-text">{unreadNotifications.contacts} message(s) non lu(s)</div>
                          </div>
                        </div>
                      </Dropdown.Item>
                    )}

                    {totalNotifications === 0 && (
                      <div className="notification-empty">
                        <p>Aucune notification</p>
                      </div>
                    )}
                  </div>

                  <Dropdown.Divider />
                  <Dropdown.Item className="notification-footer">
                    Voir toutes les notifications
                  </Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown>

              {/* User Profile Dropdown */}
              <Dropdown align="end">
                <Dropdown.Toggle variant="light" id="dropdown-user" className="user-toggle border-0 d-flex align-items-center">
                  <div className="user-avatar">
                    {user?.profileImage ? (
                      <img
                        src={`${API_BASE_URL}/${user.profileImage}`}
                        alt={user.fullName}
                        className="rounded-circle"
                      />
                    ) : (
                      <div className="avatar-placeholder">
                        {user?.fullName?.charAt(0) || 'A'}
                      </div>
                    )}
                  </div>
                  <span className="user-name d-none d-md-inline">{user?.fullName}</span>
                </Dropdown.Toggle>

                <Dropdown.Menu className="dropdown-menu-end shadow user-menu">
                  <div className="user-info">
                    <div className="user-name">{user?.fullName}</div>
                    <div className="user-email">{user?.email}</div>
                  </div>
                  <Dropdown.Divider />
                  <Dropdown.Item onClick={() => navigate('/admin/profile')} className="user-menu-item">
                    <User size={16} className="me-2" />
                    Profil
                  </Dropdown.Item>
                  <Dropdown.Item onClick={() => navigate('/admin/settings')} className="user-menu-item">
                    <User size={16} className="me-2" />
                    Paramètres
                  </Dropdown.Item>
                  <Dropdown.Divider />
                  <Dropdown.Item onClick={handleLogout} className="user-menu-item">
                    <User size={16} className="me-2" />
                    Déconnexion
                  </Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown>
            </Nav>
          </Container>
        </Navbar>

        {/* Main Content Area */}
        <div className="admin-content">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;
