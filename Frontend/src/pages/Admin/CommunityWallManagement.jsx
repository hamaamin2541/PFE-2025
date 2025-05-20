import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Table, Badge, Spinner, Alert, Modal, Tabs, Tab } from 'react-bootstrap';
import { CheckCircle, XCircle, Eye, MessageSquare, ThumbsUp, Heart, Clock, AlertTriangle, Image as ImageIcon } from 'lucide-react';
import axios from 'axios';
import { API_BASE_URL } from '../../config/api';
import './CommunityWallManagement.css';

const CommunityWallManagement = () => {
  const [pendingPosts, setPendingPosts] = useState([]);
  const [approvedPosts, setApprovedPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showPostModal, setShowPostModal] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [activeTab, setActiveTab] = useState('pending');
  const [pendingComments, setPendingComments] = useState([]);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch pending posts
      const pendingResponse = await axios.get(
        `${API_BASE_URL}/api/posts/pending`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      if (pendingResponse.data.success) {
        setPendingPosts(pendingResponse.data.data);
      }

      // Fetch approved posts
      const approvedResponse = await axios.get(
        `${API_BASE_URL}/api/posts/approved`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      if (approvedResponse.data.success) {
        setApprovedPosts(approvedResponse.data.data);
      }

      // Extract pending comments from all posts
      const allPosts = [
        ...(pendingResponse.data.data || []),
        ...(approvedResponse.data.data || [])
      ];

      const pendingCommentsArray = [];
      allPosts.forEach(post => {
        post.comments.forEach(comment => {
          if (comment.status === 'pending') {
            pendingCommentsArray.push({
              ...comment,
              postId: post._id,
              postContent: post.content.substring(0, 50) + (post.content.length > 50 ? '...' : '')
            });
          }
        });
      });

      setPendingComments(pendingCommentsArray);
    } catch (error) {
      console.error('Error fetching posts:', error);
      setError('Erreur lors du chargement des posts. Veuillez réessayer.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdatePostStatus = async (postId, status) => {
    try {
      setError(null);

      const response = await axios.put(
        `${API_BASE_URL}/api/posts/${postId}/status`,
        { status },
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      if (response.data.success) {
        setSuccess(`Post ${status === 'approved' ? 'approuvé' : 'rejeté'} avec succès`);

        // Update state
        if (status === 'approved') {
          setPendingPosts(prevPosts => prevPosts.filter(post => post._id !== postId));
          setApprovedPosts(prevPosts => [response.data.data, ...prevPosts]);
        } else {
          setPendingPosts(prevPosts => prevPosts.filter(post => post._id !== postId));
        }

        // Close modal if open
        if (showPostModal && selectedPost && selectedPost._id === postId) {
          setShowPostModal(false);
          setSelectedPost(null);
        }

        // Clear success message after 3 seconds
        setTimeout(() => {
          setSuccess(null);
        }, 3000);
      }
    } catch (error) {
      console.error('Error updating post status:', error);
      setError('Erreur lors de la mise à jour du statut du post. Veuillez réessayer.');
    }
  };

  const handleUpdateCommentStatus = async (postId, commentId, status) => {
    try {
      setError(null);

      const response = await axios.put(
        `${API_BASE_URL}/api/posts/comments/${commentId}/status`,
        { status },
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      if (response.data.success) {
        setSuccess(`Commentaire ${status === 'approved' ? 'approuvé' : 'rejeté'} avec succès`);

        // Update pending comments list
        setPendingComments(prevComments =>
          prevComments.filter(comment => comment._id !== commentId)
        );

        // Update comments in posts
        const updatePostComments = (posts) => {
          return posts.map(post => {
            if (post._id === postId) {
              return {
                ...post,
                comments: post.comments.map(comment =>
                  comment._id === commentId
                    ? { ...comment, status }
                    : comment
                )
              };
            }
            return post;
          });
        };

        setPendingPosts(updatePostComments);
        setApprovedPosts(updatePostComments);

        // Clear success message after 3 seconds
        setTimeout(() => {
          setSuccess(null);
        }, 3000);
      }
    } catch (error) {
      console.error('Error updating comment status:', error);
      setError('Erreur lors de la mise à jour du statut du commentaire. Veuillez réessayer.');
    }
  };

  const handleViewPost = (post) => {
    setSelectedPost(post);
    setShowPostModal(true);
  };

  const renderPostsTable = (posts, isPending = true) => {
    return (
      <Table responsive striped hover className="posts-table">
        <thead>
          <tr>
            <th>Auteur</th>
            <th>Contenu</th>
            <th>Date</th>
            <th>Interactions</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {posts.length === 0 ? (
            <tr>
              <td colSpan="5" className="text-center py-3">
                Aucun post {isPending ? 'en attente' : 'approuvé'} pour le moment
              </td>
            </tr>
          ) : (
            posts.map(post => (
              <tr key={post._id}>
                <td>
                  <div className="d-flex align-items-center">
                    <div className="avatar-sm me-2">
                      {post.user.profileImage ? (
                        <img
                          src={`${API_BASE_URL}/${post.user.profileImage}`}
                          alt={post.user.fullName}
                          className="rounded-circle"
                          onError={(e) => {
                            e.target.src = "https://via.placeholder.com/30";
                          }}
                        />
                      ) : (
                        <div className="avatar-placeholder-sm rounded-circle">
                          {post.user.fullName.charAt(0)}
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="fw-bold">{post.user.fullName}</div>
                      <small className="text-muted">
                        {post.user.role === 'teacher' ? 'Enseignant' :
                         post.user.role === 'assistant' ? 'Assistant' : 'Étudiant'}
                      </small>
                    </div>
                  </div>
                </td>
                <td>
                  <div className="post-content-preview">
                    {post.content.substring(0, 100)}
                    {post.content.length > 100 ? '...' : ''}
                  </div>
                  {post.image && (
                    <Badge bg="info" className="mt-1">
                      <ImageIcon size={12} className="me-1" />
                      Image jointe
                    </Badge>
                  )}
                </td>
                <td>
                  {new Date(post.createdAt).toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </td>
                <td>
                  <div className="d-flex align-items-center">
                    <div className="me-3 d-flex align-items-center">
                      <ThumbsUp size={14} className="me-1" style={{ color: '#1877F2' }} />
                      <span className="fw-bold">{post.reactionCounts?.like || 0}</span>
                    </div>
                    <div className="me-3 d-flex align-items-center">
                      <Heart size={14} className="me-1" style={{ color: '#E41E3F' }} />
                      <span className="fw-bold">{post.reactionCounts?.love || 0}</span>
                    </div>
                    <div className="me-3">
                      <small className="text-muted">({post.totalReactions || 0} total)</small>
                    </div>
                    <div>
                      <MessageSquare size={14} className="me-1" />
                      <span>{post.comments ? post.comments.length : 0}</span>
                    </div>
                  </div>
                </td>
                <td>
                  <div className="d-flex">
                    <Button
                      variant="outline-secondary"
                      size="sm"
                      className="me-2"
                      onClick={() => handleViewPost(post)}
                    >
                      <Eye size={16} />
                    </Button>

                    {isPending && (
                      <>
                        <Button
                          variant="outline-success"
                          size="sm"
                          className="me-2"
                          onClick={() => handleUpdatePostStatus(post._id, 'approved')}
                        >
                          <CheckCircle size={16} />
                        </Button>
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => handleUpdatePostStatus(post._id, 'rejected')}
                        >
                          <XCircle size={16} />
                        </Button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </Table>
    );
  };

  const renderCommentsTable = (comments) => {
    return (
      <Table responsive striped hover className="comments-table">
        <thead>
          <tr>
            <th>Auteur</th>
            <th>Commentaire</th>
            <th>Post</th>
            <th>Date</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {comments.length === 0 ? (
            <tr>
              <td colSpan="5" className="text-center py-3">
                Aucun commentaire en attente pour le moment
              </td>
            </tr>
          ) : (
            comments.map(comment => (
              <tr key={comment._id}>
                <td>
                  <div className="d-flex align-items-center">
                    <div className="avatar-sm me-2">
                      {comment.user.profileImage ? (
                        <img
                          src={`${API_BASE_URL}/${comment.user.profileImage}`}
                          alt={comment.user.fullName}
                          className="rounded-circle"
                          onError={(e) => {
                            e.target.src = "https://via.placeholder.com/30";
                          }}
                        />
                      ) : (
                        <div className="avatar-placeholder-sm rounded-circle">
                          {comment.user.fullName.charAt(0)}
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="fw-bold">{comment.user.fullName}</div>
                      <small className="text-muted">
                        {comment.user.role === 'teacher' ? 'Enseignant' :
                         comment.user.role === 'assistant' ? 'Assistant' : 'Étudiant'}
                      </small>
                    </div>
                  </div>
                </td>
                <td>
                  <div className="comment-content-preview">
                    {comment.content}
                  </div>
                </td>
                <td>
                  <div className="post-reference">
                    {comment.postContent}
                  </div>
                </td>
                <td>
                  {new Date(comment.createdAt).toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </td>
                <td>
                  <div className="d-flex">
                    <Button
                      variant="outline-success"
                      size="sm"
                      className="me-2"
                      onClick={() => handleUpdateCommentStatus(comment.postId, comment._id, 'approved')}
                    >
                      <CheckCircle size={16} />
                    </Button>
                    <Button
                      variant="outline-danger"
                      size="sm"
                      onClick={() => handleUpdateCommentStatus(comment.postId, comment._id, 'rejected')}
                    >
                      <XCircle size={16} />
                    </Button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </Table>
    );
  };

  return (
    <Container fluid className="py-4">
      <h4 className="mb-4">Gestion du Mur Communautaire</h4>

      {error && (
        <Alert variant="danger" onClose={() => setError(null)} dismissible>
          {error}
        </Alert>
      )}

      {success && (
        <Alert variant="success" onClose={() => setSuccess(null)} dismissible>
          {success}
        </Alert>
      )}

      <Card className="shadow-sm mb-4">
        <Card.Body>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h5 className="mb-0">Modération du contenu</h5>
            <Button
              variant="outline-primary"
              size="sm"
              onClick={fetchPosts}
              disabled={isLoading}
            >
              {isLoading ? (
                <Spinner
                  as="span"
                  animation="border"
                  size="sm"
                  role="status"
                  aria-hidden="true"
                />
              ) : (
                'Rafraîchir'
              )}
            </Button>
          </div>

          <Tabs
            activeKey={activeTab}
            onSelect={(k) => setActiveTab(k)}
            className="mb-3"
          >
            <Tab
              eventKey="pending"
              title={
                <span>
                  Posts en attente
                  {pendingPosts.length > 0 && (
                    <Badge bg="danger" pill className="ms-2">
                      {pendingPosts.length}
                    </Badge>
                  )}
                </span>
              }
            >
              {renderPostsTable(pendingPosts, true)}
            </Tab>
            <Tab
              eventKey="comments"
              title={
                <span>
                  Commentaires en attente
                  {pendingComments.length > 0 && (
                    <Badge bg="danger" pill className="ms-2">
                      {pendingComments.length}
                    </Badge>
                  )}
                </span>
              }
            >
              {renderCommentsTable(pendingComments)}
            </Tab>
            <Tab eventKey="approved" title="Posts approuvés">
              {renderPostsTable(approvedPosts, false)}
            </Tab>
          </Tabs>
        </Card.Body>
      </Card>

      {/* Post Detail Modal */}
      <Modal
        show={showPostModal}
        onHide={() => setShowPostModal(false)}
        size="lg"
        centered
      >
        {selectedPost && (
          <>
            <Modal.Header closeButton>
              <Modal.Title>Détail du Post</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <div className="d-flex align-items-center mb-3">
                <div className="avatar-md me-3">
                  {selectedPost.user.profileImage ? (
                    <img
                      src={`${API_BASE_URL}/${selectedPost.user.profileImage}`}
                      alt={selectedPost.user.fullName}
                      className="rounded-circle"
                      onError={(e) => {
                        e.target.src = "https://via.placeholder.com/50";
                      }}
                    />
                  ) : (
                    <div className="avatar-placeholder-md rounded-circle">
                      {selectedPost.user.fullName.charAt(0)}
                    </div>
                  )}
                </div>
                <div>
                  <h5 className="mb-0">{selectedPost.user.fullName}</h5>
                  <div className="text-muted">
                    {selectedPost.user.role === 'teacher' ? 'Enseignant' :
                     selectedPost.user.role === 'assistant' ? 'Assistant' : 'Étudiant'}
                    <span className="mx-1">•</span>
                    <Clock size={14} className="me-1" />
                    {new Date(selectedPost.createdAt).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                </div>
              </div>

              <div className="post-content-full mb-4">
                {selectedPost.content}
              </div>

              {selectedPost.image && (
                <div className="post-image-full mb-4">
                  <img
                    src={`${API_BASE_URL}/${selectedPost.image}`}
                    alt="Post attachment"
                    className="img-fluid rounded"
                    onError={(e) => {
                      e.target.src = "https://via.placeholder.com/600x400?text=Image+non+disponible";
                    }}
                  />
                </div>
              )}

              <div className="post-stats d-flex align-items-center mb-3 p-3 bg-light rounded">
                <div className="me-3 d-flex align-items-center">
                  <ThumbsUp size={16} className="me-1" style={{ color: '#1877F2' }} />
                  <span className="fw-bold fs-5">{selectedPost.reactionCounts?.like || 0}</span>
                </div>
                <div className="me-3 d-flex align-items-center">
                  <Heart size={16} className="me-1" style={{ color: '#E41E3F' }} />
                  <span className="fw-bold fs-5">{selectedPost.reactionCounts?.love || 0}</span>
                </div>
                <div className="me-3">
                  <span className="text-muted">Total: {selectedPost.totalReactions || 0} réactions</span>
                </div>
                <div>
                  <MessageSquare size={16} className="me-1" />
                  <span>{selectedPost.comments ? selectedPost.comments.length : 0} commentaires</span>
                </div>
              </div>

              <hr />

              <h6 className="mb-3">Commentaires</h6>

              {selectedPost.comments && selectedPost.comments.length > 0 ? (
                selectedPost.comments.map(comment => (
                  <div key={comment._id} className="comment-item mb-3">
                    <div className="d-flex">
                      <div className="avatar-sm me-2">
                        {comment.user.profileImage ? (
                          <img
                            src={`${API_BASE_URL}/${comment.user.profileImage}`}
                            alt={comment.user.fullName}
                            className="rounded-circle"
                            onError={(e) => {
                              e.target.src = "https://via.placeholder.com/30";
                            }}
                          />
                        ) : (
                          <div className="avatar-placeholder-sm rounded-circle">
                            {comment.user.fullName.charAt(0)}
                          </div>
                        )}
                      </div>
                      <div className="ms-2 flex-grow-1">
                        <div className="d-flex justify-content-between align-items-start">
                          <div>
                            <h6 className="mb-0">{comment.user.fullName}</h6>
                            <small className="text-muted">
                              {new Date(comment.createdAt).toLocaleDateString('fr-FR', {
                                day: 'numeric',
                                month: 'short',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </small>
                          </div>
                          <Badge bg={
                            comment.status === 'approved' ? 'success' :
                            comment.status === 'rejected' ? 'danger' : 'warning'
                          }>
                            {comment.status === 'approved' ? 'Approuvé' :
                             comment.status === 'rejected' ? 'Rejeté' : 'En attente'}
                          </Badge>
                        </div>
                        <div className="comment-bubble mt-1">
                          {comment.content}
                        </div>

                        {comment.status === 'pending' && (
                          <div className="mt-2">
                            <Button
                              variant="outline-success"
                              size="sm"
                              className="me-2"
                              onClick={() => handleUpdateCommentStatus(selectedPost._id, comment._id, 'approved')}
                            >
                              <CheckCircle size={14} className="me-1" />
                              Approuver
                            </Button>
                            <Button
                              variant="outline-danger"
                              size="sm"
                              onClick={() => handleUpdateCommentStatus(selectedPost._id, comment._id, 'rejected')}
                            >
                              <XCircle size={14} className="me-1" />
                              Rejeter
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-muted">Aucun commentaire pour ce post</p>
              )}
            </Modal.Body>
            <Modal.Footer>
              {selectedPost.status === 'pending' && (
                <>
                  <Button
                    variant="success"
                    onClick={() => handleUpdatePostStatus(selectedPost._id, 'approved')}
                  >
                    <CheckCircle size={16} className="me-1" />
                    Approuver
                  </Button>
                  <Button
                    variant="danger"
                    onClick={() => handleUpdatePostStatus(selectedPost._id, 'rejected')}
                  >
                    <XCircle size={16} className="me-1" />
                    Rejeter
                  </Button>
                </>
              )}
              <Button variant="secondary" onClick={() => setShowPostModal(false)}>
                Fermer
              </Button>
            </Modal.Footer>
          </>
        )}
      </Modal>
    </Container>
  );
};

export default CommunityWallManagement;
