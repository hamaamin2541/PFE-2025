import './Navbar.css';
import React, { useState, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Dropdown } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import i18next from 'i18next';
import {
  Home,
  Mail,
  UserRound,
  Languages,
  ListTodo,
  Presentation,
  LayoutDashboard,
  LogOut,
  LogIn,
  UserPlus,
  ChevronDown,
  Users,
} from 'lucide-react';
import logo from '../../Assets/logo.png';

const Navbar = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const navigate = useNavigate();
  const { t } = useTranslation();

  // Check login status whenever component mounts and token changes
  useEffect(() => {
    const checkLoginStatus = () => {
      const token = localStorage.getItem('token');
      const userRole = localStorage.getItem('userRole');
      setIsLoggedIn(!!(token && userRole));
    };

    checkLoginStatus();

    // Listen for custom login/logout events
    window.addEventListener('loginStateChange', checkLoginStatus);

    // Add scroll event listener
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);

    return () => {
      window.removeEventListener('loginStateChange', checkLoginStatus);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    setIsLoggedIn(false);
    // Dispatch custom event to notify other components
    window.dispatchEvent(new Event('loginStateChange'));
    navigate('/');
  };

  const handleNavigation = () => {
    // Check both possible sources of user role
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const userRoleFromStorage = localStorage.getItem('userRole');
    const role = user.role || userRoleFromStorage;

    if (role === 'teacher') {
      navigate('/dashboard-teacher');
    } else if (role === 'student' || role === 'assistant') {
      // Both students and assistants use the student dashboard
      navigate('/dashboard-student');
    } else if (role === 'admin') {
      navigate('/admin/dashboard');
    }
  };

  const handleLanguageChange = (lang) => {
    i18next.changeLanguage(lang);
  };

  const handleDeleteAccount = async () => {
    if (window.confirm(t('Are you sure you want to delete your account?'))) {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/users/delete', {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json();
        if (data.success) {
          alert(t('Account deleted successfully.'));
          handleLogout();
        } else {
          alert(data.message || t('Failed to delete account.'));
        }
      } catch (error) {
        alert(t('An error occurred while deleting your account.'));
      }
    }
  };

  return (
    <nav className={`navbar navbar-expand-lg navbar-dark navbar-custom ${scrolled ? 'scrolled' : ''}`}>
      <div className="container-fluid">
        <Link className="navbar-custom-brand fw-bold text-light" to="/">
          <img src={logo} alt="Logo" className="navbar-custom-logo" />
        </Link>

        <button
          className="navbar-toggler"
          type="button"
          onClick={() => setExpanded(!expanded)}
          aria-controls="navbarNav"
          aria-expanded={expanded}
          aria-label="Toggle navigation"
          data-bs-toggle="collapse"
          data-bs-target="#navbarNav"
        >
          <span className="navbar-custom-toggler-icon"></span>
        </button>

        <div className={`collapse navbar-collapse ${expanded ? 'show' : ''}`} id="navbarNav">
          <ul className="navbar-nav ms-auto">            <li className="navbar-custom-nav-item">
              <NavLink
                className="navbar-custom-nav-link"
                to="/Accueil"
                onClick={() => setExpanded(false)}
              >
                <Home className="navbar-icon" size={18} />
                {t('Accueil')}
              </NavLink>
            </li>

            <li className="navbar-custom-nav-item">
              <NavLink
                className="navbar-custom-nav-link"
                to="/Contact"
                onClick={() => setExpanded(false)}
              >
                <Mail className="navbar-icon" size={18} />
                {t('Contact')}
              </NavLink>
            </li>

            <li className="navbar-custom-nav-item">
              <NavLink
                className="navbar-custom-nav-link"
                to="/NotreContenu"
                onClick={() => setExpanded(false)}
              >
                <ListTodo className="navbar-icon" size={18} />
                {t('Notre Contenu')}
              </NavLink>
            </li>

            <li className="navbar-custom-nav-item">
              <NavLink
                className="navbar-custom-nav-link"
                to="/NosProfesseurs"
                onClick={() => setExpanded(false)}
              >
                <Presentation className="navbar-icon" size={18} />
                {t('Nos Professeurs')}
              </NavLink>
            </li>

            {isLoggedIn && (
              <li className="navbar-custom-nav-item">
                <NavLink
                  className="navbar-custom-nav-link"
                  to="/community-wall"
                  onClick={() => setExpanded(false)}
                >
                  <Users className="navbar-icon" size={18} />
                  Mur Communautaire
                </NavLink>
              </li>
            )}

            <li className="navbar-custom-nav-item">
              <Dropdown>
                <Dropdown.Toggle variant="outline-light" className="navbar-custom-dropdown-toggle">
                  <UserRound className="navbar-icon" size={18} />
                  {t('Mon Compte')}
                </Dropdown.Toggle>
                <Dropdown.Menu>
                  {isLoggedIn ? (
                    <>
                      <Dropdown.Item
                        onClick={() => {
                         handleNavigation()
                          setExpanded(false);
                        }}
                      >
                        
                        <span className="navbar-icon"><LayoutDashboard size={16} /> {t('Dashboard')}</span>
                      </Dropdown.Item>
                      <Dropdown.Item
                        onClick={() => {
                          handleLogout();
                          setExpanded(false);
                        }}
                        className="text-danger"
                      >                        
                        <span className="navbar-icon"><LogOut  size={16} /> {t('Déconnexion')}</span>
                      </Dropdown.Item>
                    </>
                  ) : (
                    <>
                      <Dropdown.Item
                        onClick={() => {
                          navigate('/SeConnecter');
                          setExpanded(false);
                        }}
                      >
                        <span className="navbar-icon"><LogIn  size={16} />{t('connexion')}</span>
                      </Dropdown.Item>
                      <Dropdown.Item
                        onClick={() => {
                          navigate('/Register');
                          setExpanded(false);
                        }}
                      >
                        <span className="navbar-icon"><UserPlus size={16} />{t('inscription')}</span>
                      </Dropdown.Item>
                    </>
                  )}
                </Dropdown.Menu>
              </Dropdown>
            </li>

            <li className="navbar-custom-nav-item">
              <Dropdown>
                <Dropdown.Toggle variant="outline-light" className="navbar-custom-dropdown-toggle">
                  <Languages className="navbar-icon" size={18} />
                  {i18next.language ? i18next.language.toUpperCase() : 'LANG'}
                </Dropdown.Toggle>
                <Dropdown.Menu>                  <Dropdown.Item
                    onClick={() => {
                      handleLanguageChange('fr');
                      setExpanded(false);
                    }}
                  >
                    <span className="navbar-icon">🇫🇷 Français </span> 
                  </Dropdown.Item>                  <Dropdown.Item
                    onClick={() => {
                      handleLanguageChange('ar');
                      setExpanded(false);
                    }}
                  >
                    <span className="navbar-icon">🇹🇳 العربية</span>
                  </Dropdown.Item>
                  <Dropdown.Item
                    onClick={() => {
                      handleLanguageChange('en');
                      setExpanded(false);
                    }}
                  >
                    <span className="navbar-icon">🇬🇧 English</span>
                  </Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;