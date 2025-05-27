import './NotreContenu.css';
import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Button, Card, Form, Badge, Spinner } from 'react-bootstrap';
import { Search } from 'react-bootstrap-icons';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../config/api';
import FAQ from '../components/FAQ';
import { Modal } from 'react-bootstrap';
import Footer from '../components/Footer/Footer';
import PurchaseForm from '../components/PurchaseForm';


const categories = {
  'Développement Web': ['HTML & CSS', 'JavaScript', 'React', 'Node.js', 'PHP', 'Python Web'],
  'Développement Mobile': ['Android', 'iOS', 'React Native', 'Flutter', 'Xamarin'],
  'Systèmes d\'Information': ['Bases de données', 'Cybersécurité', 'Cloud Computing', 'DevOps'],
  'Intelligence Artificielle': ['Machine Learning', 'Deep Learning', 'NLP', 'Computer Vision'],
  'Certifications Informatiques': ['AWS Certified', 'Google IT Support', 'Cisco CCNA', 'Microsoft Azure'],
  'Design & UX': ['UI Design', 'UX Research', 'Graphic Design', 'Adobe Suite'],
  'Marketing Digital': ['SEO', 'Social Media', 'Content Marketing', 'Google Ads'],
  'Business & Entrepreneuriat': ['Gestion de projet', 'Startup', 'Business Model', 'Finance'],
  'Leadership': ['Gestion d\'équipe', 'Communication', 'Développement personnel', 'Négociation'],
  'Langues': ['Anglais', 'Français', 'Arabe', 'Espagnol', 'Allemand']
};

const courses = {
  // Développement Web
  'HTML & CSS': ['Créer des sites web modernes', 'CSS Flexbox & Grid', 'Responsive Web Design'],
  'JavaScript': ['JavaScript de A à Z', 'Projets pratiques en JS', 'ES6 et au-delà'],
  'React': ['React pour débutants', 'React avancé avec hooks', 'Redux & Context API'],
  'Node.js': ['Node.js complet', 'Créer API avec Express', 'Microservices avec Node.js'],
  'PHP': ['PHP 8 pour débutants', 'Laravel Framework', 'WordPress Development'],
  'Python Web': ['Django Framework', 'Flask pour débutants', 'FastAPI moderne'],

  // Développement Mobile
  'Android': ['Android Studio', 'Kotlin pour Android', 'Architecture Android moderne'],
  'iOS': ['Swift pour débutants', 'SwiftUI', 'iOS App Development'],
  'React Native': ['React Native fondamentaux', 'Apps multiplateformes', 'Navigation & State'],
  'Flutter': ['Flutter pour débutants', 'Dart Programming', 'UI/UX avec Flutter'],
  'Xamarin': ['Xamarin.Forms', 'C# pour mobile', 'MVVM avec Xamarin'],

  // Systèmes d'Information
  'Bases de données': ['MySQL pour débutants', 'MongoDB Essentials', 'PostgreSQL avancé'],
  'Cybersécurité': ['Introduction à la cybersécurité', 'Sécurité des réseaux', 'Ethical Hacking'],
  'Cloud Computing': ['AWS Fondamentaux', 'Introduction à Azure', 'Google Cloud Platform'],
  'DevOps': ['Docker & Kubernetes', 'CI/CD Pipelines', 'Infrastructure as Code'],

  // Intelligence Artificielle
  'Machine Learning': ['ML pour débutants', 'Scikit-learn', 'Algorithmes de ML'],
  'Deep Learning': ['Neural Networks', 'TensorFlow', 'PyTorch'],
  'NLP': ['Traitement du langage naturel', 'Chatbots', 'Analyse de sentiment'],
  'Computer Vision': ['OpenCV', 'Reconnaissance d\'images', 'Détection d\'objets'],

  // Certifications Informatiques
  'AWS Certified': ['AWS Cloud Practitioner', 'AWS Solutions Architect', 'AWS Developer'],
  'Google IT Support': ['Google IT Support Pro Certificate', 'Google Cloud Engineer'],
  'Cisco CCNA': ['Formation complète CCNA', 'Réseaux Cisco', 'Sécurité réseau'],
  'Microsoft Azure': ['AZ-900 Fundamentals', 'Azure Administrator', 'Azure Developer'],

  // Design & UX
  'UI Design': ['Principes de design UI', 'Figma Masterclass', 'Design Systems'],
  'UX Research': ['Méthodes de recherche UX', 'Tests utilisateurs', 'Prototypage'],
  'Graphic Design': ['Adobe Photoshop', 'Illustrator', 'Design graphique'],
  'Adobe Suite': ['Maîtriser Adobe CC', 'After Effects', 'Premiere Pro'],

  // Marketing Digital
  'SEO': ['SEO pour débutants', 'Référencement avancé', 'Stratégie de contenu'],
  'Social Media': ['Marketing sur Instagram', 'Facebook Ads', 'LinkedIn pour business'],
  'Content Marketing': ['Stratégie de contenu', 'Copywriting', 'Storytelling'],
  'Google Ads': ['Google Ads pour débutants', 'Campagnes avancées', 'Analytics'],

  // Business & Entrepreneuriat
  'Gestion de projet': ['Méthodologie Agile', 'SCRUM', 'Gestion de projet IT'],
  'Startup': ['Lean Startup', 'Pitch Deck', 'Financement de startup'],
  'Business Model': ['Business Model Canvas', 'Validation d\'idées', 'Stratégie d\'entreprise'],
  'Finance': ['Finance pour entrepreneurs', 'Comptabilité de base', 'Analyse financière'],

  // Leadership
  'Gestion d\'équipe': ['Leadership pour managers', 'Gestion de conflits', 'Motivation d\'équipe'],
  'Communication': ['Communication efficace', 'Techniques de présentation', 'Prise de parole'],
  'Développement personnel': ['Productivité & Time Management', 'Mindfulness', 'Gestion du stress'],
  'Négociation': ['Art de la négociation', 'Techniques de persuasion', 'Résolution de conflits'],

  // Langues
  'Anglais': ['Anglais des affaires', 'Conversation courante', 'Préparation TOEFL/IELTS'],
  'Français': ['Français pour débutants', 'Grammaire avancée', 'Français des affaires'],
  'Arabe': ['Arabe moderne standard', 'Dialectes arabes', 'Arabe des affaires'],
  'Espagnol': ['Espagnol pour débutants', 'Conversation courante', 'Espagnol professionnel'],
  'Allemand': ['Allemand A1-A2', 'Allemand B1-B2', 'Allemand des affaires']
};

const NotreContenu = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const [selectedCategory, setSelectedCategory] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredCourses, setFilteredCourses] = useState([]);
  const [allCourses, setAllCourses] = useState([]);
  const [categorizedCourses, setCategorizedCourses] = useState({});
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [selectedFormation, setSelectedFormation] = useState(null);
  const [selectedTest, setSelectedTest] = useState(null);
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [showFormationModal, setShowFormationModal] = useState(false);
  const [showTestModal, setShowTestModal] = useState(false);
  const [showPurchaseForm, setShowPurchaseForm] = useState(false);
  const [currentItemType, setCurrentItemType] = useState('course'); // 'course', 'formation', or 'test'
  const [showPurchaseSuccess, setShowPurchaseSuccess] = useState(false);
  const [formations, setFormations] = useState([]);
  const [tests, setTests] = useState([]);
  const [displayCount, setDisplayCount] = useState(10); // For controlling the number of displayed courses


  // Fetch all courses, tests, and formations from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);

        // Fetch courses
        const coursesResponse = await axios.get(`${API_BASE_URL}/api/courses`);

        // Fetch formations
        const formationsResponse = await axios.get(`${API_BASE_URL}/api/formations`);

        // Fetch tests
        const testsResponse = await axios.get(`${API_BASE_URL}/api/tests`);

        if (coursesResponse.data.success) {
          setAllCourses(coursesResponse.data.data);

          // Organize courses by category
          const coursesByCategory = {};

          // Initialize all categories from the predefined list
          Object.keys(categories).forEach(category => {
            coursesByCategory[category] = [];
          });

          // Add courses to their respective categories
          coursesResponse.data.data.forEach(course => {
            if (!coursesByCategory[course.category]) {
              coursesByCategory[course.category] = [];
            }
            coursesByCategory[course.category].push(course);
          });

          setCategorizedCourses(coursesByCategory);
        } else {
          setError('Erreur lors du chargement des cours');
        }

        // Set formations data
        if (formationsResponse.data.success) {
          setFormations(formationsResponse.data.data);
        }

        // Set tests data
        if (testsResponse.data.success) {
          setTests(testsResponse.data.data);
        }

      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Erreur lors du chargement des données');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Reset state when navigating to this page
  useEffect(() => {
    setSelectedCategory(null);
    setSearchTerm('');
  }, [location]);

  // Filter courses, tests, and formations based on search
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredCourses([]);
      return;
    }

    // Filter courses
    const filteredCoursesList = allCourses.filter(course =>
      course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (course.teacher?.fullName && course.teacher.fullName.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    // Filter tests and add a type property
    const filteredTests = tests.filter(test =>
      test.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      test.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      test.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (test.teacher?.fullName && test.teacher.fullName.toLowerCase().includes(searchTerm.toLowerCase()))
    ).map(test => ({ ...test, type: 'test' }));

    // Filter formations and add a type property
    const filteredFormations = formations.filter(formation =>
      formation.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      formation.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      formation.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (formation.teacher?.fullName && formation.teacher.fullName.toLowerCase().includes(searchTerm.toLowerCase()))
    ).map(formation => ({ ...formation, type: 'formation' }));

    // Combine all filtered results
    const allFiltered = [
      ...filteredCoursesList.map(course => ({ ...course, type: 'course' })),
      ...filteredTests,
      ...filteredFormations
    ];

    setFilteredCourses(allFiltered);
  }, [searchTerm, allCourses, tests, formations]);

  const handleCategoryClick = (category) => {
    setSelectedCategory(category === selectedCategory ? null : category);
  };



  // Handle course selection
  const handleCourseSelect = async (course) => {
    try {
      // Fetch the latest course data from the public endpoint to increment views
      const response = await axios.get(`${API_BASE_URL}/api/courses/public/${course._id}`);
      if (response.data.success) {
        setSelectedCourse(response.data.data);
      } else {
        setSelectedCourse(course);
      }
      setShowCourseModal(true);
    } catch (error) {
      console.error('Error fetching course details:', error);
      // Fallback to using the provided course data
      setSelectedCourse(course);
      setShowCourseModal(true);
    }
  };

  return (
    <>
    <div className="explore-hero py-5 mb-4">
        <center><h1 className="hero-title">Développez vos compétences</h1></center>
        <center><p className="hero-subtitle">Apprenez avec les meilleurs instructeurs</p></center>

        <Form className="search-form mt-4">
          <div className="search-input-container">
            <Search className="search-icon" />
            <Form.Control
              type="text"
              placeholder="Rechercher des cours..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
          <Button
            variant="primary"
            className="search-button"
            onClick={(e) => {
              e.preventDefault();
              // Search is already handled by useEffect
            }}
          >
            Rechercher
          </Button>
        </Form>
      </div>
    <Container className="notre-contenu-container position-relative">
      

      {error && (
        <div className="alert alert-danger text-center mb-4">
          {error}
        </div>
      )}

      {/* Category Selection */}
      <div className="category-selection mb-4">
        <Form.Select 
          size="lg"
          value={selectedCategory || ''}
          onChange={(e) => setSelectedCategory(e.target.value || null)}
          className="w-75 mx-auto"
        >
          <option value="">Tous les cours</option>
          {Object.keys(categorizedCourses).map((category) => (
            <option key={category} value={category}>
              {category} ({categorizedCourses[category] ? categorizedCourses[category].length : 0} cours)
            </option>
          ))}
        </Form.Select>
      </div>

      {/* Display Logic for All Courses */}
      {!isLoading && !searchTerm && !selectedCategory && (
        <div className="mt-4 animate-slide">
          <h3 className="mb-4">Découvrez nos cours exclusifs</h3>
          <Row>
            {allCourses.slice(-displayCount).map((course) => (
              <Col key={course._id} md={6} lg={4} className="mb-4">
                <Card className="course-card h-100 shadow-sm hover-effect">
                  {/* Existing course card content */}
                  {course.coverImage && (
                    <Card.Img
                      variant="top"
                      src={`${API_BASE_URL}/${course.coverImage}`}
                      onError={(e) => {
                        e.target.src = "https://placehold.co/600x400?text=Course+Image";
                      }}
                      style={{ height: '180px', objectFit: 'cover' }}
                    />
                  )}
                  <Card.Body className="d-flex flex-column">
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <Badge bg="primary" className="mb-2">{course.category}</Badge>
                      <Badge bg="secondary">{course.level}</Badge>
                    </div>
                    <Card.Title className="h5 mb-2">{course.title}</Card.Title>
                    <Card.Text className="text-muted small mb-2">
                      {course.description.length > 100
                        ? course.description.substring(0, 100) + '...'
                        : course.description}
                    </Card.Text>

                    <div className="mt-auto">
                      <div className="d-flex align-items-center mb-2">
                        <img
                          src={course.teacher?.profileImage
                            ? `${API_BASE_URL}/${course.teacher.profileImage}`
                            : "https://placehold.co/30x30?text=T"}
                          alt={course.teacher?.fullName || "Teacher"}
                          className="rounded-circle me-2"
                          width="30"
                          height="30"
                          onError={(e) => {
                            e.target.src = "https://placehold.co/30x30?text=T";
                          }}
                        />
                        <span className="small">{course.teacher?.fullName || "Professeur"}</span>
                      </div>
                      <div className="d-flex justify-content-between align-items-center">
                        <Button
                          variant="success"
                          size="sm"
                          onClick={() => handleCourseSelect(course)}
                        >
                          Voir le cours
                        </Button>
                        <span className="text-primary fw-bold">{course.price}€</span>
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
          
          {/* Load More Button */}
          {allCourses.length > displayCount && (
            <div className="text-center mt-4">
              <Button
                variant="outline-primary"
                onClick={() => setDisplayCount(prev => prev + 10)}
                className="px-4 py-2"
              >
                Afficher plus de cours
                <span className="ms-2 small">
                  ({Math.min(displayCount, allCourses.length)}/{allCourses.length})
                </span>
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Loading state */}
      {isLoading && (
        <div className="text-center my-5">
          <Spinner animation="border" variant="primary" />
          <p className="mt-3">Chargement des cours...</p>
        </div>
      )}

      {/* Display filtered results if there's a search term */}
      {!isLoading && searchTerm && (
        <Row className="mt-4 animate-slide">
          {filteredCourses.length > 0 ? (
            filteredCourses.map((item) => (
              <Col key={item._id} md={6} lg={4} className="mb-4">
                <Card className="course-card h-100 shadow-sm hover-effect">
                  {item.coverImage && (
                    <Card.Img
                      variant="top"
                      src={`${API_BASE_URL}/${item.coverImage}`}
                      onError={(e) => {
                        e.target.src = `https://placehold.co/600x400?text=${encodeURIComponent(item.type === 'course' ? 'Cours' : item.type === 'formation' ? 'Formation' : 'Test')}`;
                      }}
                      style={{ height: '180px', objectFit: 'cover' }}
                    />
                  )}
                  <Card.Body className="d-flex flex-column">
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <Badge
                        bg={item.type === 'course' ? 'primary' : item.type === 'formation' ? 'warning' : 'info'}
                        className="mb-2"
                      >
                        {item.type === 'course' ? 'Cours' : item.type === 'formation' ? 'Formation' : 'Test'}
                      </Badge>
                      <Badge bg="secondary">
                        {item.level || item.difficulty || ''}
                      </Badge>
                    </div>
                    <Card.Title className="h5 mb-2">{item.title}</Card.Title>
                    <Card.Text className="text-muted small mb-2">
                      {item.description.length > 100
                        ? item.description.substring(0, 100) + '...'
                        : item.description}
                    </Card.Text>

                    <div className="mt-auto">
                      <div className="d-flex align-items-center mb-2">
                        <img
                          src={item.teacher?.profileImage
                            ? `${API_BASE_URL}/${item.teacher.profileImage}`
                            : "https://placehold.co/30x30?text=T"}
                          alt={item.teacher?.fullName || "Teacher"}
                          className="rounded-circle me-2"
                          width="30"
                          height="30"
                          onError={(e) => {
                            e.target.src = "https://placehold.co/30x30?text=T";
                          }}
                        />
                        <span className="small">{item.teacher?.fullName || "Professeur"}</span>
                      </div>
                      <div className="d-flex justify-content-between align-items-center">
                        <Button
                          variant="success"
                          size="sm"
                          onClick={() => {
                            if (item.type === 'course') {
                              handleCourseSelect(item);
                            } else if (item.type === 'formation') {
                              navigate(`/formations/${item._id}`);
                            } else if (item.type === 'test') {
                              navigate(`/tests/${item._id}`);
                            }
                          }}
                        >
                          {item.type === 'course' ? 'Voir le cours' :
                           item.type === 'formation' ? 'Voir la formation' :
                           'Commencer le test'}
                        </Button>
                        {item.type === 'test' ? (
                          <span className="text-success fw-bold">{item.duration} min</span>
                        ) : (
                          <span className="text-primary fw-bold">{item.price}€</span>
                        )}
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            ))
          ) : (
            <Col xs={12} className="text-center">
              <p>Aucun résultat trouvé pour "{searchTerm}"</p>
            </Col>
          )}
        </Row>
      )}

      {/* Show category-based content when no search */}
      {!isLoading && !searchTerm && selectedCategory && (
        <div className="mt-4 animate-slide">
          <h3 className="mb-4">{selectedCategory}</h3>
          {categorizedCourses[selectedCategory] && categorizedCourses[selectedCategory].length > 0 ? (
            <Row>
              {categorizedCourses[selectedCategory].map((course) => (
                <Col key={course._id} md={6} lg={4} className="mb-4">
                  <Card className="course-card h-100 shadow-sm hover-effect">
                    {course.coverImage && (
                      <Card.Img
                        variant="top"
                        src={`${API_BASE_URL}/${course.coverImage}`}
                        onError={(e) => {
                          e.target.src = "https://placehold.co/600x400?text=Course+Image";
                        }}
                        style={{ height: '180px', objectFit: 'cover' }}
                      />
                    )}
                    <Card.Body className="d-flex flex-column">
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <Badge bg="primary" className="mb-2">{course.category}</Badge>
                        <Badge bg="secondary">{course.level}</Badge>
                      </div>
                      <Card.Title className="h5 mb-2">{course.title}</Card.Title>
                      <Card.Text className="text-muted small mb-2">
                        {course.description.length > 100
                          ? course.description.substring(0, 100) + '...'
                          : course.description}
                      </Card.Text>

                      <div className="mt-auto">
                        <div className="d-flex align-items-center mb-2">
                          <img
                            src={course.teacher?.profileImage
                              ? `${API_BASE_URL}/${course.teacher.profileImage}`
                              : "https://placehold.co/30x30?text=T"}
                            alt={course.teacher?.fullName || "Teacher"}
                            className="rounded-circle me-2"
                            width="30"
                            height="30"
                            onError={(e) => {
                              e.target.src = "https://placehold.co/30x30?text=T";
                            }}
                          />
                          <span className="small">{course.teacher?.fullName || "Professeur"}</span>
                        </div>
                        <div className="d-flex justify-content-between align-items-center">
                          <Button
                            variant="success"
                            size="sm"
                            onClick={() => handleCourseSelect(course)}
                          >
                            Voir le cours
                          </Button>
                          <span className="text-primary fw-bold">{course.price}€</span>
                        </div>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              ))}
            </Row>
          ) : (
            <div className="text-center p-5 bg-light rounded">
              <p className="mb-3">Aucun cours disponible dans cette catégorie pour le moment</p>
              <Button
                variant="outline-primary"
                onClick={() => setSelectedCategory(null)}
              >
                Retourner à toutes les catégories
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Formation Section */}
      {!isLoading && !searchTerm && !selectedCategory && (
        <div className="mt-5 pt-4 animate-slide">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h3>Nos Formations</h3>
            <Button
              variant="outline-primary"
              onClick={() => navigate('/formations')}
            >
              Voir toutes les formations
            </Button>
          </div>

          <Row>
            {formations.length > 0 ? (
              formations.slice(0, 3).map((formation) => (
                <Col key={formation._id} md={6} lg={4} className="mb-4">
                  <Card className="course-card h-100 shadow-sm hover-effect">
                    {formation.coverImage ? (
                      <Card.Img
                        variant="top"
                        src={`${API_BASE_URL}/${formation.coverImage}`}
                        style={{ height: '180px', objectFit: 'cover' }}
                        onError={(e) => {
                          e.target.src = "https://placehold.co/600x400?text=Formation";
                        }}
                      />
                    ) : (
                      <Card.Img
                        variant="top"
                        src={`https://placehold.co/600x400?text=${encodeURIComponent(formation.title)}`}
                        style={{ height: '180px', objectFit: 'cover' }}
                      />
                    )}
                    <Card.Body className="d-flex flex-column">
                      <Badge bg="warning" className="mb-2">Formation Certifiante</Badge>
                      <Card.Title className="h5 mb-2">{formation.title}</Card.Title>
                      <Card.Text className="text-muted small mb-2">
                        {formation.description.length > 100
                          ? formation.description.substring(0, 100) + '...'
                          : formation.description}
                      </Card.Text>

                      <div className="mt-auto">
                        <div className="d-flex align-items-center mb-2">
                          <img
                            src={formation.teacher?.profileImage
                              ? `${API_BASE_URL}/${formation.teacher.profileImage}`
                              : "https://placehold.co/30x30?text=T"}
                            alt={formation.teacher?.fullName || "Teacher"}
                            className="rounded-circle me-2"
                            width="30"
                            height="30"
                            onError={(e) => {
                              e.target.src = "https://placehold.co/30x30?text=T";
                            }}
                          />
                          <span className="small">{formation.teacher?.fullName || "Professeur"}</span>
                        </div>
                        <div className="d-flex justify-content-between align-items-center">
                          <Button
                            variant="success"
                            size="sm"
                            onClick={() => {
                              setSelectedFormation(formation);
                              setCurrentItemType('formation');
                              setShowPurchaseForm(true);
                            }}
                          >
                            Acheter la formation
                          </Button>
                          <span className="text-primary fw-bold">{formation.price}€</span>
                        </div>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              ))
            ) : (
              <Col xs={12} className="text-center">
                <p>Aucune formation disponible pour le moment</p>
              </Col>
            )}
          </Row>

          <div className="text-center mt-3">
            <Button
              variant="link"
              onClick={() => navigate('/formations')}
            >
              Découvrir toutes nos formations
            </Button>
          </div>
        </div>
      )}

      {/* Tests Section */}
      {!isLoading && !searchTerm && !selectedCategory && (
        <div className="mt-5 pt-4 animate-slide">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h3>Nos Tests d'Évaluation</h3>
            <Button
              variant="outline-primary"
              onClick={() => navigate('/tests')}
            >
              Voir tous les tests
            </Button>
          </div>

          <Row>
            {tests.length > 0 ? (
              tests.slice(0, 3).map((test) => (
                <Col key={test._id} md={6} lg={4} className="mb-4">
                  <Card className="course-card h-100 shadow-sm hover-effect">
                    {test.coverImage ? (
                      <Card.Img
                        variant="top"
                        src={`${API_BASE_URL}/${test.coverImage}`}
                        style={{ height: '180px', objectFit: 'cover' }}
                        onError={(e) => {
                          e.target.src = "https://placehold.co/600x400?text=Test";
                        }}
                      />
                    ) : (
                      <Card.Img
                        variant="top"
                        src={`https://placehold.co/600x400?text=${encodeURIComponent(test.title)}`}
                        style={{ height: '180px', objectFit: 'cover' }}
                      />
                    )}
                    <Card.Body className="d-flex flex-column">
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <Badge bg="info" className="mb-2">Test</Badge>
                        <Badge bg="secondary">{test.difficulty}</Badge>
                      </div>
                      <Card.Title className="h5 mb-2">{test.title}</Card.Title>
                      <Card.Text className="text-muted small mb-2">
                        {test.description.length > 100
                          ? test.description.substring(0, 100) + '...'
                          : test.description}
                      </Card.Text>

                      <div className="mt-auto">
                        <div className="d-flex align-items-center mb-2">
                          <img
                            src={test.teacher?.profileImage
                              ? `${API_BASE_URL}/${test.teacher.profileImage}`
                              : "https://placehold.co/30x30?text=T"}
                            alt={test.teacher?.fullName || "Teacher"}
                            className="rounded-circle me-2"
                            width="30"
                            height="30"
                            onError={(e) => {
                              e.target.src = "https://placehold.co/30x30?text=T";
                            }}
                          />
                          <span className="small">{test.teacher?.fullName || "Professeur"}</span>
                        </div>
                        <div className="d-flex justify-content-between align-items-center">
                          <Button
                            variant="success"
                            size="sm"
                            onClick={() => {
                              setSelectedTest(test);
                              setCurrentItemType('test');
                              setShowPurchaseForm(true);
                            }}
                          >
                            Acheter le test
                          </Button>
                          <span className="text-success fw-bold">
                            {test.duration} min
                          </span>
                        </div>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              ))
            ) : (
              <Col xs={12} className="text-center">
                <p>Aucun test disponible pour le moment</p>
              </Col>
            )}
          </Row>

          <div className="text-center mt-3">
            <Button
              variant="link"
              onClick={() => navigate('/tests')}
            >
              Découvrir tous nos tests d'évaluation
            </Button>
          </div>
        </div>
      )}


      
      
      

      {/* Course Detail Modal */}
      <Modal
        show={showCourseModal}
        onHide={() => setShowCourseModal(false)}
        size="lg"
        centered
      >
        {selectedCourse && (
          <>
            <Modal.Header closeButton>
              <Modal.Title>{selectedCourse.title}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <Row>
                <Col md={6}>
                  {selectedCourse.coverImage ? (
                    <img
                      src={`${API_BASE_URL}/${selectedCourse.coverImage}`}
                      alt={selectedCourse.title}
                      className="img-fluid rounded mb-3"
                      style={{ maxHeight: '250px', width: '100%', objectFit: 'cover' }}
                      onError={(e) => {
                        e.target.src = "https://placehold.co/600x400?text=Course+Image";
                      }}
                    />
                  ) : (
                    <div
                      className="bg-light rounded d-flex justify-content-center align-items-center mb-3"
                      style={{ height: '250px' }}
                    >
                      <p className="text-muted">Pas d'image disponible</p>
                    </div>
                  )}
                </Col>
                <Col md={6}>
                  <h5>Détails du cours</h5>
                  <p><strong>Catégorie:</strong> {selectedCourse.category}</p>
                  <p><strong>Niveau:</strong> {selectedCourse.level}</p>
                  <p><strong>Langue:</strong> {selectedCourse.language}</p>
                  <p><strong>Prix:</strong> <span className="text-primary fw-bold">{selectedCourse.price}€</span></p>

                  <div className="d-flex align-items-center mt-3 mb-3">
                    <img
                      src={selectedCourse.teacher?.profileImage
                        ? `${API_BASE_URL}/${selectedCourse.teacher.profileImage}`
                        : "https://placehold.co/40x40?text=T"}
                      alt={selectedCourse.teacher?.fullName || "Teacher"}
                      className="rounded-circle me-2"
                      width="40"
                      height="40"
                      onError={(e) => {
                        e.target.src = "https://placehold.co/40x40?text=T";
                      }}
                    />
                    <div>
                      <p className="mb-0 fw-bold">{selectedCourse.teacher?.fullName || "Professeur"}</p>
                      <small className="text-muted">Instructeur</small>
                    </div>
                  </div>
                </Col>
              </Row>

              <div className="mt-4">
                <h5>Description</h5>
                <p>{selectedCourse.description}</p>
              </div>

              {selectedCourse.sections && selectedCourse.sections.length > 0 && (
                <div className="mt-4">
                  <h5>Contenu du cours</h5>
                  <div className="accordion">
                    {selectedCourse.sections.map((section, index) => (
                      <div className="card mb-2" key={index}>
                        <div className="card-header bg-light">
                          <h6 className="mb-0">{section.title}</h6>
                        </div>
                        <div className="card-body">
                          <p>{section.description}</p>
                          {section.resources && section.resources.length > 0 && (
                            <ul className="list-group">
                              {section.resources.map((resource, idx) => (
                                <li className="list-group-item d-flex justify-content-between align-items-center" key={idx}>
                                  {resource.name}
                                  <Badge bg="info">{resource.type}</Badge>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={() => setShowCourseModal(false)}>
                Retour
              </Button>
              <Button
                variant="primary"
                onClick={() => {
                  setShowCourseModal(false);
                  setShowPurchaseForm(true);
                }}
              >
                Acheter ({selectedCourse.price}€)
              </Button>
            </Modal.Footer>
          </>
        )}
      </Modal>

      {/* Purchase Form Modal */}
      <Modal
        show={showPurchaseForm}
        onHide={() => setShowPurchaseForm(false)}
        size="lg"
        centered
      >
        {(selectedCourse || selectedFormation || selectedTest) && (
          <>
            <Modal.Header closeButton>
              <Modal.Title>
                {selectedCourse && `Acheter le cours: ${selectedCourse.title}`}
                {selectedFormation && `Acheter la formation: ${selectedFormation.title}`}
                {selectedTest && `Acheter le test: ${selectedTest.title}`}
              </Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <PurchaseForm
                item={selectedCourse || selectedFormation || selectedTest}
                itemType={
                  selectedCourse ? 'course' :
                  selectedFormation ? 'formation' :
                  'test'
                }
                onPurchaseComplete={() => {
                  setShowPurchaseForm(false);
                  setShowPurchaseSuccess(true);
                }}
                onCancel={() => {
                  setShowPurchaseForm(false);
                  if (selectedCourse) setShowCourseModal(true);
                  // Reset selected items
                  if (!selectedCourse) {
                    setSelectedFormation(null);
                    setSelectedTest(null);
                  }
                }}
              />
            </Modal.Body>
          </>
        )}
      </Modal>

      {/* Purchase Success Modal */}
      <Modal
        show={showPurchaseSuccess}
        onHide={() => {
          setShowPurchaseSuccess(false);
          setSelectedCourse(null);
          setSelectedFormation(null);
          setSelectedTest(null);
        }}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Achat réussi!</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="text-center mb-4">
            <div className="mb-3">
              <span className="text-success" style={{ fontSize: '3rem' }}>✓</span>
            </div>
            <h5>Félicitations!</h5>
            <p>
              {selectedCourse && "Vous avez acheté le cours avec succès."}
              {selectedFormation && "Vous avez acheté la formation avec succès."}
              {selectedTest && "Vous avez acheté le test avec succès."}
              {!selectedCourse && !selectedFormation && !selectedTest && "Votre achat a été effectué avec succès."}
            </p>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => {
              setShowPurchaseSuccess(false);
              setSelectedCourse(null);
              setSelectedFormation(null);
              setSelectedTest(null);
            }}
          >
            Retour au contenu
          </Button>
          <Button
            variant="primary"
            onClick={() => {
              setShowPurchaseSuccess(false);
              setSelectedCourse(null);
              setSelectedFormation(null);
              setSelectedTest(null);
              navigate('/dashboard-student');
            }}
          >
            Voir dans mon tableau de bord
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
    <FAQ />
    < Footer/>
    </>
  );
};

export default NotreContenu;