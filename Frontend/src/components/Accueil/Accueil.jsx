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
import TestimonialForm from '../Testimonial/TestimonialForm';
import ReclamationForm from '../Reclamation/ReclamationForm';
import { isAuthenticated } from '../../utils/authUtils';
import axios from 'axios';
import { API_BASE_URL } from '../../config/api';
import {
  FaGraduationCap, FaBook, FaUsers, FaStar, FaCommentAlt,
  FaFacebookF, FaTwitter, FaInstagram, FaLinkedinIn, FaYoutube,
  FaEnvelope, FaPhone, FaMapMarkerAlt, FaClock, FaExclamationTriangle,
  FaInfoCircle
} from 'react-icons/fa';

function Accueil() {
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState({ days: 2, hours: 8, minutes: 45, seconds: 30 });
  const [userAuthenticated, setUserAuthenticated] = useState(false);
  const [showTestimonialForm, setShowTestimonialForm] = useState(false);
  const [showReclamationForm, setShowReclamationForm] = useState(false);
  const [testimonialsList, setTestimonialsList] = useState([]);
  const [pendingTestimonials, setPendingTestimonials] = useState([]);
  const [statsData, setStatsData] = useState({
    students: 0,
    courses: 0,
    teachers: 0,
    avgRating: 0,
    isLoading: true,
    error: null
  });

  // Vérifier si l'utilisateur est connecté
  useEffect(() => {
    // Vérifier l'état d'authentification au chargement
    setUserAuthenticated(isAuthenticated());

    // Fonction pour vérifier l'état d'authentification
    const checkAuthStatus = () => {
      setUserAuthenticated(isAuthenticated());
    };

    // Écouter les changements dans le localStorage
    window.addEventListener('storage', checkAuthStatus);

    // Écouter un événement personnalisé pour l'authentification
    const handleAuthEvent = () => {
      setUserAuthenticated(isAuthenticated());
    };

    window.addEventListener('auth-change', handleAuthEvent);

    // Nettoyer les écouteurs d'événements
    return () => {
      window.removeEventListener('storage', checkAuthStatus);
      window.removeEventListener('auth-change', handleAuthEvent);
    };
  }, []);

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

  // Fetch stats data from the backend
  useEffect(() => {
    const fetchStatsData = async () => {
      try {
        setStatsData(prev => ({ ...prev, isLoading: true, error: null }));

        // Use public endpoints directly since admin endpoint requires authentication
        try {
          // Get users by role
          const studentsResponse = await axios.get(`${API_BASE_URL}/api/users/byRole/student`);
          const teachersResponse = await axios.get(`${API_BASE_URL}/api/users/byRole/teacher`);

          // Get all courses
          const coursesResponse = await axios.get(`${API_BASE_URL}/api/courses`);

          // Get average rating
          const ratingsResponse = await axios.get(`${API_BASE_URL}/api/ratings`);

          // Extract the counts from the responses
          const studentsCount = studentsResponse.data.data ? studentsResponse.data.data.length : 0;
          const teachersCount = teachersResponse.data.data ? teachersResponse.data.data.length : 0;
          const coursesCount = coursesResponse.data.data ? coursesResponse.data.data.length : 0;
          const avgRating = ratingsResponse.data.averageRating || 0;

          console.log('Stats data:', {
            students: studentsCount,
            teachers: teachersCount,
            courses: coursesCount,
            avgRating: avgRating
          });

          setStatsData({
            students: studentsCount,
            courses: coursesCount,
            teachers: teachersCount,
            avgRating: avgRating,
            isLoading: false,
            error: null
          });
        } catch (error) {
          console.error('Error fetching stats data:', error);

          // If API calls fail, use fallback data
          setStatsData({
            students: 100,
            courses: 50,
            teachers: 20,
            avgRating: 4.5,
            isLoading: false,
            error: null
          });
        }
      } catch (error) {
        console.error('Error in stats fetching process:', error);
        // Use fallback data instead of showing an error
        setStatsData({
          students: 100,
          courses: 50,
          teachers: 20,
          avgRating: 4.5,
          isLoading: false,
          error: null
        });
      }
    };

    fetchStatsData();
  }, []);

  // Fetch testimonials from the backend and local storage
  useEffect(() => {
    const fetchTestimonials = async () => {
      try {
        // Get approved testimonials from the backend
        const response = await axios.get(`${API_BASE_URL}/api/testimonials/approved`);

        if (response.data.success) {
          // Map the testimonials to match our frontend format
          const formattedTestimonials = response.data.data.map(testimonial => ({
            id: testimonial._id,
            name: testimonial.name,
            role: testimonial.role,
            text: testimonial.message,
            rating: testimonial.rating,
            avatar: testimonial.avatar || "https://randomuser.me/api/portraits/men/32.jpg",
            date: new Date(testimonial.createdAt)
          }));

          setTestimonialsList(formattedTestimonials);
        } else {
          console.error('Failed to fetch testimonials:', response.data.message);
          // Use fallback testimonials if fetch fails
          setTestimonialsList([
            {
              id: 1,
              name: "Sophie Martin",
              role: "Étudiante en informatique",
              avatar: Picture1,
              rating: 5,
              text: "Les cours sont très bien structurés et les enseignants sont toujours disponibles pour répondre à mes questions. J'ai pu acquérir de nouvelles compétences rapidement."
            }
          ]);
        }
      } catch (error) {
        console.error('Error fetching testimonials:', error);
        // Use fallback testimonials if fetch fails
        setTestimonialsList([
          {
            id: 1,
            name: "Sophie Martin",
            role: "Étudiante en informatique",
            avatar: Picture1,
            rating: 5,
            text: "Les cours sont très bien structurés et les enseignants sont toujours disponibles pour répondre à mes questions. J'ai pu acquérir de nouvelles compétences rapidement."
          }
        ]);
      }

      // Get pending testimonials from localStorage
      try {
        const storedTestimonials = localStorage.getItem('pendingTestimonials');
        if (storedTestimonials) {
          const parsedTestimonials = JSON.parse(storedTestimonials);
          setPendingTestimonials(parsedTestimonials);
        }
      } catch (error) {
        console.error('Error loading pending testimonials from localStorage:', error);
      }
    };

    fetchTestimonials();
  }, []);

  // Handle new testimonial submission
  const handleTestimonialSubmit = (newTestimonial) => {
    // Format the testimonial to match our display format
    const formattedTestimonial = {
      id: newTestimonial.id || Date.now(),
      name: newTestimonial.name,
      role: newTestimonial.role,
      text: newTestimonial.text || newTestimonial.message,
      rating: newTestimonial.rating,
      avatar: newTestimonial.avatar || "https://randomuser.me/api/portraits/men/32.jpg",
      isNew: true, // Flag to highlight the new testimonial
      date: new Date(),
      pending: true // Flag to indicate this is pending approval
    };

    // Add the new testimonial to the pending testimonials list
    const updatedPendingTestimonials = [formattedTestimonial, ...pendingTestimonials];
    setPendingTestimonials(updatedPendingTestimonials);

    // Store in localStorage to persist across page refreshes
    try {
      localStorage.setItem('pendingTestimonials', JSON.stringify(updatedPendingTestimonials));
    } catch (error) {
      console.error('Error saving pending testimonials to localStorage:', error);
    }

    // Note: The testimonial will be pending approval in the backend,
    // but we show it to the user immediately for better UX
    // It will only appear for other users after admin approval
  };

  // Données pour les statistiques
  const formatNumber = (num) => {
    if (num === 0) return "0";
    if (num < 1000) return num.toString();
    if (num < 10000) return num.toString() + "+";
    return Math.floor(num / 1000) + "k+";
  };

  const stats = [
    {
      icon: <FaGraduationCap />,
      number: statsData.isLoading ? "..." : formatNumber(statsData.students),
      label: "Étudiants",
      isLoading: statsData.isLoading
    },
    {
      icon: <FaBook />,
      number: statsData.isLoading ? "..." : formatNumber(statsData.courses),
      label: "Cours",
      isLoading: statsData.isLoading
    },
    {
      icon: <FaUsers />,
      number: statsData.isLoading ? "..." : formatNumber(statsData.teachers),
      label: "Professeurs",
      isLoading: statsData.isLoading
    },
    {
      icon: <FaStar />,
      number: statsData.isLoading ? "..." : (statsData.avgRating ? statsData.avgRating.toFixed(1) : "0"),
      label: "Note moyenne",
      isLoading: statsData.isLoading
    }
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
          {!userAuthenticated && (
            <button className="promo-btn" onClick={goToRegister}>En profiter maintenant</button>
          )}
        </div>
      </div>

      {/* Section Principale (Hero) */}
      <section className="hero">
        <div className="hero-content">
          <h1>Apprenez en ligne facilement, partout et à tout moment</h1>
          <p>Rejoignez une communauté dynamique et développez vos compétences.</p>
          {!userAuthenticated && (
            <div className="hero-buttons">
              <button className="btn-secondary" onClick={goToRegister}>Rejoindre un cours</button>
            </div>
          )}
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
        <div className="stats-row">
          {stats.map((stat, index) => (
            <div className="stat-item" key={index}>
              <div className={`stat-icon ${stat.isLoading ? 'pulse-animation' : ''}`}>{stat.icon}</div>
              <div className={`stat-number ${stat.isLoading ? 'pulse-animation' : ''}`}>{stat.number}</div>
              <div className="stat-label">{stat.label}</div>
            </div>
          ))}
        </div>
        {statsData.error && (
          <div className="stats-error">
            <p>{statsData.error}</p>
          </div>
        )}
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

        {/* Pending testimonials notice */}
        {pendingTestimonials.length > 0 && (
          <div className="pending-testimonials-notice mb-4">
            <div className="alert alert-info">
              <h5><FaInfoCircle className="me-2" /> Vos témoignages en attente d'approbation</h5>
              <p>Les témoignages ci-dessous sont visibles uniquement par vous et seront publiés après validation par un administrateur.</p>
            </div>
            <div className="row">
              {pendingTestimonials.map(testimonial => (
                <div className="col-md-4 mb-4" key={testimonial.id}>
                  <div className="testimonial-card new-testimonial">
                    <div className="testimonial-content">
                      <p>{testimonial.text}</p>
                      <span className="pending-badge">En attente d'approbation</span>
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
        )}

        {/* Approved testimonials */}
        <div className="testimonial-carousel">
          <div className="row">
            {testimonialsList.map(testimonial => (
              <div className="col-md-4 mb-4" key={testimonial.id}>
                <div className={`testimonial-card ${testimonial.isNew ? 'new-testimonial' : ''}`}>
                  <div className="testimonial-content">
                    <p>{testimonial.text}</p>
                    {testimonial.isNew && (
                      <span className="new-badge">Nouveau</span>
                    )}
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

        {/* Bouton pour partager un témoignage */}
        <div className="text-center mt-5 mb-4">
          <div className="testimonial-button-container">
            <button
              className="btn-testimonial"
              onClick={() => setShowTestimonialForm(true)}
            >
              <FaCommentAlt className="me-2" /> Ajouter votre témoignage
            </button>
          </div>
          <p className="mt-3 text-muted">Partagez votre expérience avec notre plateforme</p>
          <p className="small text-muted">Les témoignages sont soumis à validation avant d'être publiés</p>
        </div>

        {/* Modal pour le formulaire de témoignage */}
        <TestimonialForm
          show={showTestimonialForm}
          handleClose={() => setShowTestimonialForm(false)}
          onTestimonialSubmit={handleTestimonialSubmit}
        />
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
        {!userAuthenticated ? (
          <button className="btn-primary" onClick={goToRegister}>
            S'inscrire maintenant
          </button>
        ) : (
          <button className="btn-primary" onClick={() => navigate('/dashboard-student')}>
            Accéder à mon espace
          </button>
        )}
      </section>

      {/* Section Évaluation */}
      <section className="rating-section">
        <h2 className="text-center">Votre avis compte</h2>
        <p className="text-center mb-5">Aidez-nous à améliorer notre plateforme en partageant votre expérience</p>
        <StarRating />
      </section>

      {/* Section Réclamation */}
      <section className="reclamation-section">
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-md-8 text-center">
              <h2 className="section-title">Besoin d'aide ou rencontrez un problème ?</h2>
              <p className="section-subtitle mb-4">
                Notre équipe est à votre écoute pour résoudre tout problème que vous pourriez rencontrer.
              </p>
              <button
                className="btn-reclamation"
                onClick={() => setShowReclamationForm(true)}
              >
                <FaExclamationTriangle className="me-2" /> Soumettre une réclamation
              </button>
            </div>
          </div>
        </div>

        {/* Modal pour le formulaire de réclamation */}
        <ReclamationForm
          show={showReclamationForm}
          handleClose={() => setShowReclamationForm(false)}
        />
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
            <p className="footer-copyright">© {new Date().getFullYear()} We Learn. Tous droits réservés.</p>

          </div>
        </div>
      </footer>
    </div>
  );
}

export default Accueil;