import React from 'react';
import { Container, Row, Col, Card, Button } from 'react-bootstrap';
import { FaPlayCircle } from 'react-icons/fa';

const Tests = () => {
  const handleTestClick = (testName) => {
    alert(`Vous allez passer le ${testName}`);
  };

  const testCards = [
    {
      id: 1,
      title: "Test UX Design",
      image: "https://picsum.photos/300/200?random=1",
      description: "Test de conception d'expérience utilisateur"
    },
    {
      id: 2,
      title: "Test SEO",
      image: "https://picsum.photos/300/200?random=2",
      description: "Test de l'optimisation pour les moteurs de recherche"
    },
    {
      id: 3,
      title: "Test Gestion de Projet",
      image: "https://picsum.photos/300/200?random=3", 
      description: "Test de gestion de projet et d'équipe"
    }
  ];

  return (
    <Container className="tests-container py-5">
      <h2 className="text-center mb-4">Tests à Passer</h2>
      <Row className="g-4">
        {testCards.map(test => (
          <Col md={4} key={test.id}>
            <Card className="text-center shadow-lg">
              <Card.Img variant="top" src={test.image} alt={test.title} />
              <Card.Body>
                <Card.Title>{test.title}</Card.Title>
                <Button
                  variant="success"
                  size="lg"
                  className="mt-3 w-100 d-flex justify-content-center align-items-center btn-hover-effect"
                  onClick={() => handleTestClick(test.title)}
                >
                  <FaPlayCircle className="me-2" /> Passer le Test
                </Button>
              </Card.Body>
              <Card.Footer className="text-muted">{test.description}</Card.Footer>
            </Card>
          </Col>
        ))}
      </Row>
    </Container>
  );
};

export default Tests;
