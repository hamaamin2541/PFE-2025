import React, { useState, useEffect } from 'react';
import { Card, Table, Image, Spinner, Badge } from 'react-bootstrap';
import { Trophy, Award } from 'lucide-react';
import axios from 'axios';
import { API_BASE_URL } from '../../config/api';
import './Leaderboard.css';

const Leaderboard = ({ currentUserId }) => {
  const [leaderboard, setLeaderboard] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        setIsLoading(true);
        const token = localStorage.getItem('token');

        const response = await axios.get(`${API_BASE_URL}/api/gamification/leaderboard`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.data.success) {
          setLeaderboard(response.data.data);
        } else {
          throw new Error('Failed to fetch leaderboard');
        }
      } catch (error) {
        console.error('Error fetching leaderboard:', error);
        setError('Impossible de charger le classement');
      } finally {
        setIsLoading(false);
      }
    };

    fetchLeaderboard();
  }, []);

  // Get rank icon based on position
  const getRankIcon = (position) => {
    switch (position) {
      case 0:
        return <Trophy size={20} className="rank-icon rank-gold" />;
      case 1:
        return <Award size={20} className="rank-icon rank-silver" />;
      case 2:
        return <Award size={20} className="rank-icon rank-bronze" />;
      default:
        return <span className="rank-number">{position + 1}</span>;
    }
  };

  if (isLoading) {
    return (
      <Card className="leaderboard-card">
        <Card.Header className="d-flex align-items-center">
          <Trophy size={18} className="me-2" />
          <span>Classement</span>
        </Card.Header>
        <Card.Body className="text-center py-5">
          <Spinner animation="border" role="status" variant="primary" />
          <p className="mt-3 mb-0">Chargement du classement...</p>
        </Card.Body>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="leaderboard-card">
        <Card.Header className="d-flex align-items-center">
          <Trophy size={18} className="me-2" />
          <span>Classement</span>
        </Card.Header>
        <Card.Body className="text-center py-4">
          <p className="text-danger mb-0">{error}</p>
        </Card.Body>
      </Card>
    );
  }

  return (
    <Card className="leaderboard-card">
      <Card.Header className="d-flex align-items-center">
        <Trophy size={18} className="me-2" />
        <span>Classement</span>
      </Card.Header>
      <Card.Body className="p-0">
        <Table responsive hover className="mb-0">
          <thead>
            <tr>
              <th className="text-center">#</th>
              <th>Étudiant</th>
              <th className="text-center">Points</th>
              <th className="text-center">Badges</th>
            </tr>
          </thead>
          <tbody>
            {leaderboard.map((user, index) => (
              <tr
                key={user._id}
                className={user._id === currentUserId ? 'current-user-row' : ''}
              >
                <td className="text-center align-middle">
                  {getRankIcon(index)}
                </td>
                <td>
                  <div className="d-flex align-items-center">
                    <Image
                      src={user.profileImage ? `${API_BASE_URL}/${user.profileImage}` : "https://randomuser.me/api/portraits/men/32.jpg"}
                      roundedCircle
                      width={36}
                      height={36}
                      className="me-2"
                      onError={(e) => {
                        e.target.src = "https://randomuser.me/api/portraits/men/32.jpg";
                      }}
                    />
                    <div>
                      <div className="user-name">
                        {user.fullName}
                        {user._id === currentUserId && (
                          <Badge bg="info" pill className="ms-2 small">Vous</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="text-center align-middle">
                  <Badge
                    bg={index < 3 ? "warning" : "secondary"}
                    className="points-badge"
                  >
                    {user.points.toLocaleString()} pts
                  </Badge>
                </td>
                <td className="text-center align-middle">
                  <Badge bg="primary" pill>
                    {user.badges?.length || 0}
                  </Badge>
                </td>
              </tr>
            ))}

            {leaderboard.length === 0 && (
              <tr>
                <td colSpan={4} className="text-center py-4">
                  Aucun étudiant dans le classement pour le moment.
                </td>
              </tr>
            )}
          </tbody>
        </Table>
      </Card.Body>
    </Card>
  );
};

export default Leaderboard;
