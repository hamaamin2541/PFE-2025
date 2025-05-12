import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import "./Accueil.css";
import Picture1 from '../../Assets/Picture1.jpeg';
import Picture2 from '../../Assets/picture2.jpeg';
import Certif from '../../Assets/certification.jpeg';
import Cours from '../../Assets/Cours.jpeg';
import Time from '../../Assets/time.jpeg';
import Acces from '../../Assets/accessibilite.jpeg';
import FAQ from '../FAQ';
import StarRating from '../Rating/StarRating';
import {
  FaGraduationCap, FaBook, FaUsers, FaStar,
  FaFacebookF, FaTwitter, FaInstagram, FaLinkedinIn, FaYoutube,
  FaEnvelope, FaPhone, FaMapMarkerAlt, FaClock
} from 'react-icons/fa';

function Accueil() {
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState({ days: 2, hours: 8, minutes: 45, seconds: 30 });

  // Effet pour le compte à rebours
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(prevState => {
        let { days, hours, minutes, seconds } = prevState;

        if (seconds > 0) {
          seconds -= 1;
        } else {
          seconds = 59;
          if (minutes > 0) {
            minutes -= 1;
          } else {
            minutes = 59;
            if (hours > 0) {
              hours -= 1;
            } else {
              hours = 23;
              if (days > 0) {
                days -= 1;
              } else {
                // Le compte à rebours est terminé
                clearInterval(timer);
              }
            }
          }
        }

        return { days, hours, minutes, seconds };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Redirection vers la page de connexion (Login)
  const goToLogin = () => {
    navigate('/login');
  };

  // Redirection vers la page d'inscription (Register)
  const goToRegister = () => {
    navigate('/register');
  };

  // Données pour les témoignages
  const testimonials = [
    {
      id: 1,
      name: "Sophie Martin",
      role: "Étudiante en informatique",
      avatar: Picture1,
      rating: 5,
      text: "Les cours sont très bien structurés et les enseignants sont toujours disponibles pour répondre à mes questions. J'ai pu acquérir de nouvelles compétences rapidement."
    },
    {
      id: 2,
      name: "Thomas Dubois",
      role: "Professionnel en reconversion",
      avatar: Picture2,
      rating: 4,
      text: "Grâce à cette plateforme, j'ai pu me reconvertir dans le domaine du développement web. La flexibilité des cours m'a permis de continuer à travailler tout en étudiant."
    },
    {
      id: 3,
      name: "Amina Benali",
      role: "Étudiante en marketing",
      avatar: Picture1,
      rating: 5,
      text: "J'ai adoré les cours de marketing digital. Le contenu est à jour avec les dernières tendances et les exercices pratiques m'ont beaucoup aidée."
    }
  ];

  // Données pour les statistiques
  const stats = [
    { icon: <FaGraduationCap />, number: "10,000+", label: "Étudiants" },
    { icon: <FaBook />, number: "250+", label: "Cours" },
    { icon: <FaUsers />, number: "50+", label: "Professeurs" },
    { icon: <FaStar />, number: "4.8", label: "Note moyenne" }
  ];

  return (
    <div className="home-container">
      {/* Bannière de promotion */}
      <div className="promo-banner">
        <div className="promo-content">
          <div className="promo-text">
            <strong>Offre spéciale !</strong> 30% de réduction sur tous les cours jusqu'au
          </div>
          <div className="countdown">
            <div className="countdown-item">
              <div className="countdown-number">{countdown.days}</div>
              <div className="countdown-label">Jours</div>
            </div>
            <div className="countdown-item">
              <div className="countdown-number">{countdown.hours}</div>
              <div className="countdown-label">Heures</div>
            </div>
            <div className="countdown-item">
              <div className="countdown-number">{countdown.minutes}</div>
              <div className="countdown-label">Minutes</div>
            </div>
            <div className="countdown-item">
              <div className="countdown-number">{countdown.seconds}</div>
              <div className="countdown-label">Secondes</div>
            </div>
          </div>
          <button className="promo-btn" onClick={goToRegister}>En profiter maintenant</button>
        </div>
      </div>

      {/* Section Principale (Hero) */}
      <section className="hero">
        <div className="hero-content">
          <h1>Apprenez en ligne facilement, partout et à tout moment</h1>
          <p>Rejoignez une communauté dynamique et développez vos compétences.</p>
          <div className="hero-buttons">
            <button className="btn-secondary" onClick={goToRegister}>Rejoindre un cours</button>
          </div>
          <div className="hero-features">
            <span>✅ Formateurs experts</span>
            <span>✅ Vidéos premium</span>
            <span>✅ Tarifs accessibles</span>
          </div>
        </div>
        <div className="hero-images">
          <div className="circle-container yellow">
            <img src={Picture1} alt="Étudiant heureux" />
          </div>
          <div className="circle-container blue">
            <img src={Picture2} alt="Apprentissage en ligne" />
          </div>
        </div>
      </section>

      {/* Section Statistiques */}
      <section className="stats-section">
        <div className="stats-container">
          {stats.map((stat, index) => (
            <div className="stat-item" key={index}>
              <div className="stat-icon">{stat.icon}</div>
              <div className="stat-number">{stat.number}</div>
              <div className="stat-label">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Section Avantages */}
      <section className="about">
        <h2>Pourquoi nous choisir ?</h2>
        <div className="about-grid">
          <div className="about-item">
            <img src={Time} alt="Flexibilité horaire" />
            <h3>Flexibilité</h3>
            <p>Apprenez quand vous voulez, à votre rythme. Nos cours sont disponibles 24h/24 et 7j/7, vous permettant d'étudier selon votre emploi du temps.</p>
          </div>
          <div className="about-item">
            <img src={Certif} alt="Certification" />
            <h3>Certifications</h3>
            <p>Obtenez des diplômes reconnus par les professionnels du secteur. Nos certifications vous aideront à valoriser vos compétences sur le marché du travail.</p>
          </div>
          <div className="about-item">
            <img src={Cours} alt="Cours variés" />
            <h3>+250 Cours</h3>
            <p>Un large catalogue de formations dans divers domaines : informatique, langues, marketing, design, et bien plus encore. Trouvez le cours qui correspond à vos besoins.</p>
          </div>
          <div className="about-item">
            <img src={Acces} alt="Accessibilité" />
            <h3>Multiplateforme</h3>
            <p>Disponible sur tous vos appareils : ordinateur, tablette, smartphone. Notre plateforme s'adapte à tous les écrans pour une expérience optimale.</p>
          </div>
        </div>
      </section>

      {/* Section Témoignages */}
      <section className="testimonials">
        <h2 className="text-center">Ce que disent nos étudiants</h2>
        <div className="testimonial-carousel">
          <div className="row">
            {testimonials.map(testimonial => (
              <div className="col-md-4 mb-4" key={testimonial.id}>
                <div className="testimonial-card">
                  <div className="testimonial-content">
                    <p>{testimonial.text}</p>
                  </div>
                  <div className="testimonial-author">
                    <img
                      src={testimonial.avatar}
                      alt={testimonial.name}
                      className="testimonial-avatar"
                    />
                    <div className="testimonial-info">
                      <h4>{testimonial.name}</h4>
                      <p>{testimonial.role}</p>
                      <div className="testimonial-rating">
                        {[...Array(5)].map((_, i) => (
                          <FaStar key={i} style={{ opacity: i < testimonial.rating ? 1 : 0.3 }} />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section Partenaires */}
      <section className="partners-section">
        <h2>Nos partenaires</h2>
        <p className="partners-description">
          Nous collaborons avec des universités et entreprises de renom pour vous offrir des formations de qualité et reconnues dans le monde professionnel.
        </p>
        <div className="partners-logo-container">
          {/* Remplacez ces divs par de vraies images de logos quand disponibles */}
          <div className="partner-logo" style={{ width: '120px', height: '60px', background: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Logo 1</div>
          <div className="partner-logo" style={{ width: '120px', height: '60px', background: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Logo 2</div>
          <div className="partner-logo" style={{ width: '120px', height: '60px', background: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Logo 3</div>
          <div className="partner-logo" style={{ width: '120px', height: '60px', background: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Logo 4</div>
          <div className="partner-logo" style={{ width: '120px', height: '60px', background: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Logo 5</div>
        </div>
      </section>

      {/* Section d'Appel à l'Action */}
      <section className="cta">
        <h2>Prêt à commencer votre parcours d'apprentissage ?</h2>
        <button className="btn-primary" onClick={goToRegister}>
          S'inscrire maintenant
        </button>
      </section>

      {/* Section Évaluation */}
      <section className="rating-section">
        <h2 className="text-center">Votre avis compte</h2>
        <p className="text-center mb-5">Aidez-nous à améliorer notre plateforme en partageant votre expérience</p>
        <StarRating />
      </section>

      {/* Section FAQ */}
      <FAQ />

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <div className="row">
            <div className="col-md-4 mb-4">
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

            <div className="col-md-2 mb-4">
              <h5 className="footer-title">Liens rapides</h5>
              <ul className="footer-links">
                <li><a href="#">Accueil</a></li>
                <li><a href="#">Cours</a></li>
                <li><a href="#">Formations</a></li>
                <li><a href="#">Tests</a></li>
                <li><a href="#">Professeurs</a></li>
              </ul>
            </div>

            <div className="col-md-3 mb-4">
              <h5 className="footer-title">Contactez-nous</h5>
              <div className="contact-info">
                <p><FaMapMarkerAlt className="me-2" /> 123 Rue de l'Éducation, Tunis</p>
                <p><FaPhone className="me-2" /> +216 71 123 456</p>
                <p><FaEnvelope className="me-2" /> contact@welearn.com</p>
                <p><FaClock className="me-2" /> Lun-Ven: 9h-18h</p>
              </div>
            </div>

            <div className="col-md-3 mb-4">
              <h5 className="footer-title">Newsletter</h5>
              <p>Inscrivez-vous pour recevoir nos dernières actualités et offres spéciales.</p>
              <div className="newsletter-form">
                <input type="email" className="form-control mb-2" placeholder="Votre email" />
                <button type="submit" className="btn btn-primary">S'abonner</button>
              </div>
            </div>
          </div>

          <hr className="footer-divider" />

          <div className="footer-bottom">
            <p className="footer-copyright">© {new Date().getFullYear()} We Learn. Tous droits réservés.</p>
            <div className="footer-legal-links">
              <a href="#">Conditions d'utilisation</a>
              <a href="#">Politique de confidentialité</a>
              <a href="#">Cookies</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default Accueil;