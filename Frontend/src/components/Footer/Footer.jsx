import React from 'react';
import { Link } from 'react-router-dom';
import {
  FaFacebookF, FaTwitter, FaInstagram, FaLinkedinIn, FaYoutube,
  FaMapMarkerAlt, FaPhone, FaEnvelope, FaClock
} from 'react-icons/fa';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="container">
        <div className="row">
          {/* About Column */}
          <div className="col-md-3 mb-4">
            <h5 className="footer-title">We Learn</h5>
            <p className="footer-description">
              Plateforme d'apprentissage en ligne offrant des cours de qualité dans divers domaines. Notre mission est de rendre l'éducation accessible à tous.
            </p>
            <div className="footer-social">
              <a href="#" className="social-icon"><FaFacebookF /></a>
              <a href="#" className="social-icon"><FaTwitter /></a>
              <a href="#" className="social-icon"><FaInstagram /></a>
              <a href="#" className="social-icon"><FaLinkedinIn /></a>
              <a href="#" className="social-icon"><FaYoutube /></a>
            </div>
          </div>

          {/* Quick Links Column */}
          <div className="col-md-3 mb-4">
            <h5 className="footer-title">Liens Rapides</h5>
            <ul className="footer-links">
              <li><Link to="/Accueil">Accueil</Link></li>
              <li><Link to="/Contact">Contact</Link></li>
              <li><Link to="/NotreContenu">Notre Contenu</Link></li>
              <li><Link to="/NosProfesseurs">Nos Professeurs</Link></li>
              <li><Link to="/community-wall">Mur Communautaire</Link></li>
            </ul>
          </div>

          {/* Categories Column */}
          <div className="col-md-3 mb-4">
            <h5 className="footer-title">Catégories</h5>
            <ul className="footer-links">
              <li><Link to="/category/development">Développement</Link></li>
              <li><Link to="/category/business">Business</Link></li>
              <li><Link to="/category/design">Design</Link></li>
              <li><Link to="/category/marketing">Marketing</Link></li>
              <li><Link to="/category/languages">Langues</Link></li>
            </ul>
          </div>

          {/* Contact Column */}
          <div className="col-md-3 mb-4">
            <h5 className="footer-title">Contactez-nous</h5>
            <div className="contact-info">
              <p><FaMapMarkerAlt className="me-2" /> 123 Rue de l'Éducation, Tunis</p>
              <p><FaPhone className="me-2" /> +216 27 405 306</p>
              <p><FaEnvelope className="me-2" /> lamarimedamin1@gmail.com</p>
              <p><FaClock className="me-2" /> Lun-Ven: 9h-18h</p>
            </div>
          </div>
        </div>

        <hr className="footer-divider" />

        <div className="footer-bottom">
          <div className="row align-items-center">
            <div className="col-md-6">
              <p className="footer-copyright">© {new Date().getFullYear()} We Learn. Tous droits réservés.</p>
            </div>
            <div className="col-md-6">
              <div className="footer-bottom-links text-md-end">
                <Link to="/privacy">Politique de confidentialité</Link>
                <span className="mx-2">|</span>
                <Link to="/terms">CGU</Link>
                <span className="mx-2">|</span>
                <Link to="/cookies">Cookies</Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;