import './NosProfesseurs.css';
import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../config/api';
import { Row, Col, Card, Button, Alert, Modal } from 'react-bootstrap';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

import FAQ from '../components/FAQ';
import TeacherRating from '../components/Rating/TeacherRating';
import Footer from '../components/Footer/Footer';


function NosProfesseurs() {
  const navigate = useNavigate();
  const [teachers, setTeachers] = useState([]);
  const [teachersLoading, setTeachersLoading] = useState(true);
  const [textAdvice, setTextAdvice] = useState([]);
  const [videoAdvice, setVideoAdvice] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState(null);

  const handleContactTeacher = (teacherId) => {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    if (!token) {
      // Redirect to login page if not logged in
      navigate('/SeConnecter');
      return;
    }

    // Get current user data from localStorage
    const userData = JSON.parse(localStorage.getItem('user') || '{}');

    // Check if the current user is trying to contact themselves
    if (userData._id === teacherId) {
      // Show an alert or handle this case as needed
      alert('Vous ne pouvez pas vous envoyer un message à vous-même.');
      return;
    }

    // Redirect to the appropriate dashboard based on user role
    if (userData.role === 'teacher') {
      navigate('/dashboard-teacher', { state: { activeTab: 'messages', teacherId } });
    } else {
      // Default to student dashboard for students and other roles
      navigate('/dashboard-student', { state: { activeTab: 'messages', teacherId } });
    }
  };

  const handleRateTeacher = (teacher) => {
    setSelectedTeacher(teacher);
    setShowRatingModal(true);
  };

  const handleCloseRatingModal = () => {
    setShowRatingModal(false);
    setSelectedTeacher(null);
  };

  useEffect(() => {
    const fetchTeachers = async () => {
      try {
        setTeachersLoading(true);
        const response = await axios.get(`${API_BASE_URL}/api/users/byRole/teacher`);
        if (response.data.success) {
          setTeachers(response.data.data);
        }
      } catch (err) {
        console.error('Error fetching teachers:', err);
        setError('Erreur lors du chargement des professeurs');
      } finally {
        setTeachersLoading(false);
      }
    };

    fetchTeachers();
  }, []);

  useEffect(() => {
    const fetchAdvice = async () => {
      try {
        setLoading(true);
        // Changed endpoint to match backend route
        const response = await axios.get(`${API_BASE_URL}/api/teacher-advice/all`);
        if (response.data.success) {
          const adviceWithTeachers = response.data.data;

          // Process video advice data
          const videoAdviceData = adviceWithTeachers.filter(advice => advice.type === 'video');

          // Log video advice data for debugging
          console.log('Video advice data:', videoAdviceData);

          // Validate video paths and add fallback if needed
          const processedVideoAdvice = videoAdviceData.map(advice => {
            console.log(`Processing video advice: ${advice._id}, videoPath: ${advice.videoPath}`);

            // If videoPath doesn't exist or is invalid, add a flag
            if (!advice.videoPath || typeof advice.videoPath !== 'string') {
              console.log(`Invalid video path for advice ${advice._id}`);
              return { ...advice, videoPathInvalid: true };
            }

            // Make sure the path is properly formatted
            if (!advice.videoPath.startsWith('/uploads/videos/') && advice.videoPath.includes('video-')) {
              console.log(`Fixing video path format for advice ${advice._id}`);
              const filename = advice.videoPath.split('/').pop();
              advice.videoPath = `/uploads/videos/${filename}`;
              console.log(`Updated path: ${advice.videoPath}`);
            }

            return advice;
          });

          setTextAdvice(adviceWithTeachers.filter(advice => advice.type === 'text'));
          setVideoAdvice(processedVideoAdvice);
        }
        setError(null);
      } catch (err) {
        setError('Erreur lors du chargement des conseils des professeurs');
        console.error('Error fetching advice:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAdvice();
  }, []);

  const renderTextAdvice = () => (
    <div className="row mt-5">
      <h3 className="text-center mb-4">Conseils Textuels des Professeurs</h3>
      {textAdvice.length > 0 ? (
        textAdvice.map((advice) => (
          <div className="col-md-4 mb-4" key={advice._id}>
            <div className="card shadow-sm text-advice-card">
              <div className="card-body">
                <div className="d-flex align-items-center mb-3">
                  {advice.teacher?.profileImage && (
                    <img
                      src={`${API_BASE_URL}/${advice.teacher.profileImage}`}
                      alt={advice.teacher?.fullName || 'Professeur'}
                      className="rounded-circle me-3"
                      width="50"
                      height="50"
                      onError={(e) => {
                        e.target.src = '/images/default-profile.jpg';
                      }}
                    />
                  )}
                  <div>
                    <h5 className="card-title mb-0 text-primary">
                      {advice.teacher?.fullName || 'Professeur'}
                    </h5>
                    <small className="text-muted d-block">
                      {advice.teacher?.specialty || 'Enseignant'}
                    </small>
                  </div>
                </div>
                <div className="advice-content p-3 bg-light rounded">
                  <p className="card-text">{advice.content}</p>
                </div>
                <div className="d-flex justify-content-end mt-3">
                  <small className="text-muted">
                    {new Date(advice.createdAt).toLocaleDateString()}
                  </small>
                </div>
              </div>
            </div>
          </div>
        ))
      ) : (
        <div className="col-12 text-center p-5 bg-light rounded">
          <p className="mb-0">Aucun conseil textuel disponible pour le moment.</p>
        </div>
      )}
    </div>
  );

  const renderVideoAdvice = () => (
    <div className="row mt-5">
      <h3 className="text-center mb-4">Conseils Vidéo des Professeurs</h3>
      {videoAdvice.length > 0 ? (
        videoAdvice.map((advice) => (
          <div className="col-md-4 mb-4" key={advice._id}>
            <div className="card shadow-sm video-advice-card">
              <div className="card-body">
                <div className="d-flex align-items-center mb-3">
                  {advice.teacher?.profileImage && (
                    <img
                      src={`${API_BASE_URL}/${advice.teacher.profileImage}`}
                      alt={advice.teacher?.fullName || 'Professeur'}
                      className="rounded-circle me-3"
                      width="50"
                      height="50"
                      onError={(e) => {
                        e.target.src = '/images/default-profile.jpg';
                      }}
                    />
                  )}
                  <div>
                    <h5 className="card-title mb-0 text-primary">
                      {advice.teacher?.fullName || 'Professeur'}
                    </h5>
                    <small className="text-muted d-block">
                      {advice.teacher?.specialty || 'Enseignant'}
                    </small>
                  </div>
                </div>
                <div className="ratio ratio-16x9 mb-3 video-container">
                  {advice.videoPath && !advice.videoPathInvalid ? (
                    <div className="video-wrapper">
                      <video
                        id={`video-${advice._id}`}
                        controls
                        className="w-100 rounded"
                        poster="/images/video-placeholder.jpg"
                        preload="metadata"
                        onError={(e) => {
                          // Try to fetch the video directly to check if it exists
                          fetch(`${API_BASE_URL}${advice.videoPath}`)
                            .then(response => {
                              console.log(`Video fetch response for ${advice._id}:`, response.status, response.statusText);
                              if (!response.ok) {
                                console.error(`Video file not found at ${API_BASE_URL}${advice.videoPath}`);
                              }
                            })
                            .catch(err => {
                              console.error(`Error fetching video ${advice._id}:`, err);
                            });

                          // Log detailed error information
                          console.error('Video loading error:', {
                            videoId: advice._id,
                            videoPath: advice.videoPath,
                            constructedUrl: `${API_BASE_URL}${advice.videoPath}`
                          });

                          // Replace the video element with an error message
                          const errorDiv = document.createElement('div');
                          errorDiv.className = 'video-error-message';
                          errorDiv.innerHTML = `
                            <div class="d-flex flex-column align-items-center justify-content-center h-100">
                              <i class="bi bi-exclamation-triangle text-warning mb-2" style="font-size: 2rem;"></i>
                              <p class="mb-2">La vidéo n'a pas pu être chargée.</p>
                              <small class="text-muted">Chemin: ${advice.videoPath}</small>
                            </div>
                          `;
                          e.target.parentNode.replaceChild(errorDiv, e.target);
                        }}
                      >
                        {/* Use a single source with the correct path */}
                        <source
                          src={`${API_BASE_URL}${advice.videoPath}`}
                          type="video/mp4"
                        />
                        Votre navigateur ne supporte pas la lecture de vidéos.
                      </video>
                    </div>
                  ) : (
                    <div className="video-error-message">
                      <div className="d-flex flex-column align-items-center justify-content-center h-100">
                        <i className="bi bi-exclamation-triangle text-warning mb-2" style={{ fontSize: '2rem' }}></i>
                        <p className="mb-2">Aucune vidéo disponible</p>
                        <small className="text-muted">
                          {advice.videoPathInvalid
                            ? "Le format de la vidéo n'est pas supporté"
                            : "Le chemin de la vidéo est manquant"}
                        </small>
                      </div>
                    </div>
                  )}
                </div>
                <h6 className="video-title">{advice.title || 'Conseil vidéo'}</h6>
                <p className="card-text">{advice.content}</p>
                <div className="d-flex justify-content-between align-items-center mt-3">
                  <small className="text-muted">
                    {new Date(advice.createdAt).toLocaleDateString()}
                  </small>
                  {advice.videoPath && !advice.videoPathInvalid && (
                    <Button
                      variant="outline-primary"
                      size="sm"
                      onClick={() => {
                        const videoElement = document.querySelector(`#video-${advice._id}`);
                        if (videoElement) {
                          videoElement.requestFullscreen().catch(err => {
                            console.error('Error attempting to enable fullscreen:', err);
                          });
                        }
                      }}
                    >
                      Plein écran
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))
      ) : (
        <div className="col-12 text-center p-5 bg-light rounded">
          <p className="mb-0">Aucun conseil vidéo disponible pour le moment.</p>
        </div>
      )}
    </div>
  );

  return (
    <>
    <div className="explore-hero">
      <h1 className="hero-title text-center">Nos Professeurs</h1>
      <p className="hero-subtitle text-center">Découvrez nos experts passionnés par l'enseignement</p>
      <div className="section-description">
        <p className="lead">
          La plateforme <strong>we learn</strong> rassemble les meilleurs professeurs et enseignants
          les plus qualifiés de tout le pays pour accompagner vos enfants vers la réussite.
        </p>
      </div>
    </div>

    <div className="container">
      <div className="row g-4">
        {teachersLoading ? (
          <div className="text-center w-100">
            <p>Chargement des professeurs...</p>
          </div>
        ) : teachers.length > 0 ? (
          teachers.map(teacher => (
            <Col key={teacher._id} md={4} className="mb-4">
              <Card className="h-100 teacher-card">
                <Card.Img
                  variant="top"
                  src={`${API_BASE_URL}/${teacher.profileImage}`}
                  onError={(e) => {
                    e.target.src = '/images/default-profile.jpg';
                  }}
                  className="teacher-image"
                />
                <Card.Body>
                  <Card.Title>{teacher.fullName}</Card.Title>
                  <Card.Subtitle className="mb-2 text-muted">
                    {teacher.specialty || 'Enseignant'} • {teacher.experience || 'Expérimenté'}
                  </Card.Subtitle>
                  <Card.Text>{teacher.bio || 'Professeur dévoué à l\'enseignement'}</Card.Text>
                  <div className="d-flex gap-2">
                    {(() => {
                      // Get current user data from localStorage
                      const userData = JSON.parse(localStorage.getItem('user') || '{}');
                      const isOwnProfile = userData._id === teacher._id;

                      return (
                        <Button
                          variant={isOwnProfile ? "outline-secondary" : "outline-primary"}
                          onClick={() => handleContactTeacher(teacher._id)}
                          disabled={isOwnProfile}
                          title={isOwnProfile ? "Vous ne pouvez pas vous contacter vous-même" : "Contacter ce professeur"}
                        >
                          {isOwnProfile ? "Votre profil" : "Contacter"}
                        </Button>
                      );
                    })()}
                    <Button
                      variant="outline-warning"
                      onClick={() => handleRateTeacher(teacher)}
                      title="Noter ce professeur"
                    >
                      Noter
                    </Button>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          ))
        ) : (
          <div className="text-center w-100">
            <p>Aucun professeur disponible pour le moment.</p>
          </div>
        )}
      </div>
    </div>

    {/* Full width advice section outside container */}
    <section className="teacher-advice-section">
      <div className="container">
        <h2 className="">Conseils Vidéo des Professeurs</h2>
        <div className="row g-4 mb-5">
          {/* Video advice content */}
          {videoAdvice.length > 0 ? (
            videoAdvice.map((advice) => (
              <div className="col-md-4 mb-4" key={advice._id}>
                <div className="card shadow-sm video-advice-card">
                  <div className="card-body">
                    <div className="d-flex align-items-center mb-3">
                      {advice.teacher?.profileImage && (
                        <img
                          src={`${API_BASE_URL}/${advice.teacher.profileImage}`}
                          alt={advice.teacher?.fullName || 'Professeur'}
                          className="rounded-circle me-3"
                          width="50"
                          height="50"
                          onError={(e) => {
                            e.target.src = '/images/default-profile.jpg';
                          }}
                        />
                      )}
                      <div>
                        <h5 className="card-title mb-0 text-primary">
                          {advice.teacher?.fullName || 'Professeur'}
                        </h5>
                        <small className="text-muted d-block">
                          {advice.teacher?.specialty || 'Enseignant'}
                        </small>
                      </div>
                    </div>
                    <div className="ratio ratio-16x9 mb-3 video-container">
                      {advice.videoPath && !advice.videoPathInvalid ? (
                        <div className="video-wrapper">
                          <video
                            id={`video-${advice._id}`}
                            controls
                            className="w-100 rounded"
                            poster="/images/video-placeholder.jpg"
                            preload="metadata"
                            onError={(e) => {
                              // Try to fetch the video directly to check if it exists
                              fetch(`${API_BASE_URL}${advice.videoPath}`)
                                .then(response => {
                                  console.log(`Video fetch response for ${advice._id}:`, response.status, response.statusText);
                                  if (!response.ok) {
                                    console.error(`Video file not found at ${API_BASE_URL}${advice.videoPath}`);
                                  }
                                })
                                .catch(err => {
                                  console.error(`Error fetching video ${advice._id}:`, err);
                              });

                              // Log detailed error information
                              console.error('Video loading error:', {
                                videoId: advice._id,
                                videoPath: advice.videoPath,
                                constructedUrl: `${API_BASE_URL}${advice.videoPath}`
                              });

                              // Replace the video element with an error message
                              const errorDiv = document.createElement('div');
                              errorDiv.className = 'video-error-message';
                              errorDiv.innerHTML = `
                                <div class="d-flex flex-column align-items-center justify-content-center h-100">
                                  <i class="bi bi-exclamation-triangle text-warning mb-2" style="font-size: 2rem;"></i>
                                  <p class="mb-2">La vidéo n'a pas pu être chargée.</p>
                                  <small class="text-muted">Chemin: ${advice.videoPath}</small>
                                </div>
                              `;
                              e.target.parentNode.replaceChild(errorDiv, e.target);
                            }}
                          >
                            {/* Use a single source with the correct path */}
                            <source
                              src={`${API_BASE_URL}${advice.videoPath}`}
                              type="video/mp4"
                            />
                            Votre navigateur ne supporte pas la lecture de vidéos.
                          </video>
                        </div>
                      ) : (
                        <div className="video-error-message">
                          <div className="d-flex flex-column align-items-center justify-content-center h-100">
                            <i className="bi bi-exclamation-triangle text-warning mb-2" style={{ fontSize: '2rem' }}></i>
                            <p className="mb-2">Aucune vidéo disponible</p>
                            <small className="text-muted">
                              {advice.videoPathInvalid
                                ? "Le format de la vidéo n'est pas supporté"
                                : "Le chemin de la vidéo est manquant"}
                            </small>
                          </div>
                        </div>
                      )}
                    </div>
                    <h6 className="video-title">{advice.title || 'Conseil vidéo'}</h6>
                    <p className="card-text">{advice.content}</p>
                    <div className="d-flex justify-content-between align-items-center mt-3">
                      <small className="text-muted">
                        {new Date(advice.createdAt).toLocaleDateString()}
                      </small>
                      {advice.videoPath && !advice.videoPathInvalid && (
                        <Button
                          variant="outline-primary"
                          size="sm"
                          onClick={() => {
                            const videoElement = document.querySelector(`#video-${advice._id}`);
                            if (videoElement) {
                              videoElement.requestFullscreen().catch(err => {
                                console.error('Error attempting to enable fullscreen:', err);
                              });
                            }
                          }}
                        >
                          Plein écran
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-12 text-center p-5 bg-light rounded">
              <p className="mb-0">Aucun conseil vidéo disponible pour le moment.</p>
            </div>
          )}
        </div>

        <h3 className="text-center">Conseils Textuels des Professeurs</h3>
        <div className="row g-4">
          {/* Text advice content */}
          {textAdvice.length > 0 ? (
            textAdvice.map((advice) => (
              <div className="col-md-4 mb-4" key={advice._id}>
                <div className="card shadow-sm text-advice-card">
                  <div className="card-body">
                    <div className="d-flex align-items-center mb-3">
                      {advice.teacher?.profileImage && (
                        <img
                          src={`${API_BASE_URL}/${advice.teacher.profileImage}`}
                          alt={advice.teacher?.fullName || 'Professeur'}
                          className="rounded-circle me-3"
                          width="50"
                          height="50"
                          onError={(e) => {
                            e.target.src = '/images/default-profile.jpg';
                          }}
                        />
                      )}
                      <div>
                        <h5 className="card-title mb-0 text-primary">
                          {advice.teacher?.fullName || 'Professeur'}
                        </h5>
                        <small className="text-muted d-block">
                          {advice.teacher?.specialty || 'Enseignant'}
                        </small>
                      </div>
                    </div>
                    <div className="advice-content p-3 bg-light rounded">
                      <p className="card-text">{advice.content}</p>
                    </div>
                    <div className="d-flex justify-content-end mt-3">
                      <small className="text-muted">
                        {new Date(advice.createdAt).toLocaleDateString()}
                      </small>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-12 text-center p-5 bg-light rounded">
              <p className="mb-0">Aucun conseil textuel disponible pour le moment.</p>
            </div>
          )}
        </div>
      </div>
    </section>

      {/* Modal de notation du professeur */}
      <Modal show={showRatingModal} onHide={handleCloseRatingModal} centered>
        <Modal.Header closeButton>
          <Modal.Title>Noter {selectedTeacher?.fullName || 'le professeur'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedTeacher && (
            <div className="text-center mb-4">
              <img
                src={`${API_BASE_URL}/${selectedTeacher.profileImage}`}
                alt={selectedTeacher.fullName}
                className="rounded-circle mb-3"
                style={{ width: '80px', height: '80px', objectFit: 'cover' }}
                onError={(e) => {
                  e.target.src = '/images/default-profile.jpg';
                }}
              />
              <h5>{selectedTeacher.fullName}</h5>
              <p className="text-muted">{selectedTeacher.specialty || 'Enseignant'}</p>

              <TeacherRating teacherId={selectedTeacher._id} />
            </div>
          )}
        </Modal.Body>
      </Modal>
      <div className="mt-5">
        <FAQ />
      </div>
      <Footer />
    </>
  );
}

export default NosProfesseurs;
