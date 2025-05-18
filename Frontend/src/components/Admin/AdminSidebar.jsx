import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, BookOpen, MessageSquare, AlertTriangle,
  BarChart2, FileText, Settings, LogOut, ChevronDown, ChevronRight,
  Mail, Database, Download, Share2
} from 'lucide-react';
import { Collapse } from 'react-bootstrap';

const AdminSidebar = ({ onLogout }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [openMenus, setOpenMenus] = useState({
    content: false,
    reports: false
  });

  const toggleMenu = (menu) => {
    setOpenMenus(prev => ({
      ...prev,
      [menu]: !prev[menu]
    }));
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  const isMenuActive = (paths) => {
    return paths.some(path => location.pathname.includes(path));
  };

  return (
    <div className="admin-sidebar">
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <span className="logo-icon">WL</span>
          <span className="logo-text">WeLearn</span>
        </div>
      </div>

      <div className="sidebar-content">
        <div className="sidebar-section">
          <div className="sidebar-section-title">PRINCIPAL</div>
          <ul className="sidebar-menu">
            <li className="sidebar-menu-item">
              <Link
                to="/admin/dashboard"
                className={`sidebar-menu-link ${isActive('/admin/dashboard') ? 'active' : ''}`}
              >
                <LayoutDashboard size={18} className="sidebar-menu-icon" />
                <span className="sidebar-menu-text">Tableau de bord</span>
              </Link>
            </li>

            <li className="sidebar-menu-item">
              <Link
                to="/admin/users"
                className={`sidebar-menu-link ${isActive('/admin/users') ? 'active' : ''}`}
              >
                <Users size={18} className="sidebar-menu-icon" />
                <span className="sidebar-menu-text">Utilisateurs</span>
              </Link>
            </li>

            <li className="sidebar-menu-item">
              <Link
                to="/admin/assistants"
                className={`sidebar-menu-link ${isActive('/admin/assistants') ? 'active' : ''}`}
              >
                <Users size={18} className="sidebar-menu-icon" />
                <span className="sidebar-menu-text">Assistants</span>
              </Link>
            </li>

            <li className="sidebar-menu-item">
              <div
                className={`sidebar-menu-link ${isMenuActive(['/admin/courses', '/admin/tests', '/admin/formations']) ? 'active-parent' : ''}`}
                onClick={() => {
                  toggleMenu('content');
                  // Navigate to courses page when clicking on the main menu item
                  navigate('/admin/courses');
                }}
              >
                <div className="sidebar-menu-link-content">
                  <BookOpen size={18} className="sidebar-menu-icon" />
                  <span className="sidebar-menu-text">Contenu</span>
                </div>
                <div className="sidebar-menu-arrow">
                  {openMenus.content ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                </div>
              </div>
              <Collapse in={openMenus.content}>
                <ul className="sidebar-submenu">
                  <li className="sidebar-submenu-item">
                    <Link
                      to="/admin/courses"
                      className={`sidebar-submenu-link ${isActive('/admin/courses') ? 'active' : ''}`}
                    >
                      <span className="sidebar-submenu-text">Cours</span>
                    </Link>
                  </li>
                  <li className="sidebar-submenu-item">
                    <Link
                      to="/admin/tests"
                      className={`sidebar-submenu-link ${isActive('/admin/tests') ? 'active' : ''}`}
                    >
                      <span className="sidebar-submenu-text">Tests</span>
                    </Link>
                  </li>
                  <li className="sidebar-submenu-item">
                    <Link
                      to="/admin/formations"
                      className={`sidebar-submenu-link ${isActive('/admin/formations') ? 'active' : ''}`}
                    >
                      <span className="sidebar-submenu-text">Formations</span>
                    </Link>
                  </li>
                </ul>
              </Collapse>
            </li>
          </ul>
        </div>

        <div className="sidebar-section">
          <div className="sidebar-section-title">COMMUNICATION</div>
          <ul className="sidebar-menu">
            <li className="sidebar-menu-item">
              <Link
                to="/admin/complaints"
                className={`sidebar-menu-link ${isActive('/admin/complaints') ? 'active' : ''}`}
              >
                <AlertTriangle size={18} className="sidebar-menu-icon" />
                <span className="sidebar-menu-text">Réclamations</span>
              </Link>
            </li>

            <li className="sidebar-menu-item">
              <Link
                to="/admin/messages"
                className={`sidebar-menu-link ${isActive('/admin/messages') ? 'active' : ''}`}
              >
                <MessageSquare size={18} className="sidebar-menu-icon" />
                <span className="sidebar-menu-text">Messages</span>
              </Link>
            </li>

            <li className="sidebar-menu-item">
              <Link
                to="/admin/contact"
                className={`sidebar-menu-link ${isActive('/admin/contact') ? 'active' : ''}`}
              >
                <Mail size={18} className="sidebar-menu-icon" />
                <span className="sidebar-menu-text">Contact</span>
              </Link>
            </li>

            <li className="sidebar-menu-item">
              <Link
                to="/admin/user-experiences"
                className={`sidebar-menu-link ${isActive('/admin/user-experiences') ? 'active' : ''}`}
              >
                <MessageSquare size={18} className="sidebar-menu-icon" />
                <span className="sidebar-menu-text">Expériences Utilisateurs</span>
              </Link>
            </li>

            <li className="sidebar-menu-item">
              <Link
                to="/admin/community-wall"
                className={`sidebar-menu-link ${isActive('/admin/community-wall') ? 'active' : ''}`}
              >
                <Share2 size={18} className="sidebar-menu-icon" />
                <span className="sidebar-menu-text">Mur Communautaire</span>
              </Link>
            </li>
          </ul>
        </div>

        <div className="sidebar-section">
          <div className="sidebar-section-title">ANALYSE</div>
          <ul className="sidebar-menu">
            <li className="sidebar-menu-item">
              <div
                className={`sidebar-menu-link ${isMenuActive(['/admin/reports']) ? 'active-parent' : ''}`}
                onClick={() => {
                  toggleMenu('reports');
                  // Navigate to reports/users page when clicking on the main menu item
                  navigate('/admin/reports/users');
                }}
              >
                <div className="sidebar-menu-link-content">
                  <BarChart2 size={18} className="sidebar-menu-icon" />
                  <span className="sidebar-menu-text">Rapports</span>
                </div>
                <div className="sidebar-menu-arrow">
                  {openMenus.reports ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                </div>
              </div>
              <Collapse in={openMenus.reports}>
                <ul className="sidebar-submenu">
                  <li className="sidebar-submenu-item">
                    <Link
                      to="/admin/reports/users"
                      className={`sidebar-submenu-link ${isActive('/admin/reports/users') ? 'active' : ''}`}
                    >
                      <span className="sidebar-submenu-text">Utilisateurs</span>
                    </Link>
                  </li>
                  <li className="sidebar-submenu-item">
                    <Link
                      to="/admin/reports/sales"
                      className={`sidebar-submenu-link ${isActive('/admin/reports/sales') ? 'active' : ''}`}
                    >
                      <span className="sidebar-submenu-text">Ventes</span>
                    </Link>
                  </li>
                  <li className="sidebar-submenu-item">
                    <Link
                      to="/admin/reports/content"
                      className={`sidebar-submenu-link ${isActive('/admin/reports/content') ? 'active' : ''}`}
                    >
                      <span className="sidebar-submenu-text">Contenu</span>
                    </Link>
                  </li>
                </ul>
              </Collapse>
            </li>
          </ul>
        </div>

        <div className="sidebar-section">
          <div className="sidebar-section-title">SYSTÈME</div>
          <ul className="sidebar-menu">

            <li className="sidebar-menu-item">
              <Link
                to="/admin/exports"
                className={`sidebar-menu-link ${isActive('/admin/exports') ? 'active' : ''}`}
              >
                <Download size={18} className="sidebar-menu-icon" />
                <span className="sidebar-menu-text">Exportations</span>
              </Link>
            </li>

            <li className="sidebar-menu-item">
              <Link
                to="/admin/settings"
                className={`sidebar-menu-link ${isActive('/admin/settings') ? 'active' : ''}`}
              >
                <Settings size={18} className="sidebar-menu-icon" />
                <span className="sidebar-menu-text">Paramètres</span>
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="sidebar-footer">
        <button
          className="sidebar-logout-button"
          onClick={onLogout}
        >
          <LogOut size={18} className="sidebar-logout-icon" />
          <span className="sidebar-logout-text">Déconnexion</span>
        </button>
      </div>
    </div>
  );
};

export default AdminSidebar;
