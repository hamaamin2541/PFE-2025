"use client"

import { useState, useEffect, useRef } from "react"
import { Container, Card, Button, Form, Alert, Spinner, Badge } from "react-bootstrap"
import { MessageSquare, Heart, ThumbsUp, Send, ImageIcon, AlertTriangle, Clock, ThumbsDown } from "lucide-react"
import axios from "axios"
import { API_BASE_URL } from "../config/api"
import io from "socket.io-client"
import "./CommunityWall.css"
import { SafeImage } from "../components/SafeImage"

const CommunityWall = () => {
  const [posts, setPosts] = useState([])
  const [newPostContent, setNewPostContent] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [selectedImage, setSelectedImage] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [socket, setSocket] = useState(null)
  const fileInputRef = useRef(null)

  // Initialize socket connection
  useEffect(() => {
    const newSocket = io(API_BASE_URL)
    setSocket(newSocket)

    // Join community wall room
    newSocket.emit("join-community-wall")

    // Clean up on unmount
    return () => {
      newSocket.disconnect()
    }
  }, [])

  // Set up socket event listeners
  useEffect(() => {
    if (!socket) return

    // Listen for new posts
    socket.on("post-created", (newPost) => {
      if (newPost.status === "approved") {
        // Ensure reactionCounts exists
        const reactionCounts = newPost.reactionCounts || {}

        // Calculate totals for the new post
        const totalReactions = Object.values(reactionCounts).reduce((sum, count) => {
          return sum + (typeof count === "number" ? count : 0)
        }, 0)

        const approvedCommentsCount = newPost.comments
          ? newPost.comments.filter((comment) => comment.status === "approved").length
          : 0

        const processedPost = {
          ...newPost,
          reactionCounts,
          totalReactions,
          approvedCommentsCount,
        }

        setPosts((prevPosts) => [processedPost, ...prevPosts])
      }
    })

    // Listen for new comments
    socket.on("comment-added", ({ postId, comment }) => {
      if (comment.status === "approved") {
        setPosts((prevPosts) =>
          prevPosts.map((post) => {
            if (post._id === postId) {
              const updatedComments = [...post.comments, comment]
              const approvedCommentsCount = updatedComments.filter((c) => c.status === "approved").length

              return {
                ...post,
                comments: updatedComments,
                approvedCommentsCount,
              }
            }
            return post
          }),
        )
      }
    })

    // Listen for new reactions
    socket.on("reaction-added", ({ postId, reactionCounts, totalReactions }) => {
      setPosts((prevPosts) =>
        prevPosts.map((post) => (post._id === postId ? { ...post, reactionCounts, totalReactions } : post)),
      )
    })

    return () => {
      socket.off("post-created")
      socket.off("comment-added")
      socket.off("reaction-added")
    }
  }, [socket])

  // Fetch posts on component mount
  useEffect(() => {
    fetchPosts()
  }, [page])

  const fetchPosts = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await axios.get(`${API_BASE_URL}/api/posts/approved?page=${page}&limit=10`)

      if (response.data.success) {
        // Add debugging to see the actual data structure
        console.log("API Response:", response.data.data)
        console.log("First post raw data:", response.data.data[0])

        // Process posts to ensure totals are calculated
        const processedPosts = response.data.data.map((post) => {
          let reactionCounts = {}
          let totalReactions = 0

          // Try multiple possible data structures
          if (post.reactionCounts && typeof post.reactionCounts === "object") {
            // Structure 1: { reactionCounts: { like: 5, love: 2 } }
            reactionCounts = post.reactionCounts
            totalReactions = Object.values(reactionCounts).reduce((sum, count) => sum + (count || 0), 0)
          } else if (post.reactions && Array.isArray(post.reactions)) {
            // Structure 2: { reactions: [{ type: 'like' }, { type: 'love' }] }
            reactionCounts = post.reactions.reduce((counts, reaction) => {
              counts[reaction.type] = (counts[reaction.type] || 0) + 1
              return counts
            }, {})
            totalReactions = post.reactions.length
          } else {
            // Structure 3: { likes: 5, loves: 2 } or similar
            const possibleFields = ["like", "likes", "love", "loves", "thumbsUp", "heart"]
            possibleFields.forEach((field) => {
              if (post[field] !== undefined) {
                const normalizedField = field.replace("s", "").replace("thumbsUp", "like").replace("heart", "love")
                reactionCounts[normalizedField] = post[field] || 0
                totalReactions += post[field] || 0
              }
            })
          }

          const approvedCommentsCount = post.comments
            ? post.comments.filter((comment) => comment.status === "approved").length
            : 0

          return {
            ...post,
            reactionCounts,
            totalReactions,
            approvedCommentsCount,
          }
        })

        console.log("Processed posts:", processedPosts)

        if (page === 1) {
          setPosts(processedPosts)
        } else {
          setPosts((prevPosts) => [...prevPosts, ...processedPosts])
        }

        setHasMore(page < response.data.pagination.pages)
      }
    } catch (error) {
      console.error("Error fetching posts:", error)
      setError("Erreur lors du chargement des posts. Veuillez réessayer.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setSelectedImage(file)

      // Create preview
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleRemoveImage = () => {
    setSelectedImage(null)
    setImagePreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleSubmitPost = async (e) => {
    e.preventDefault()

    if (!newPostContent.trim()) {
      setError("Le contenu du post ne peut pas être vide")
      return
    }

    try {
      setIsSubmitting(true)
      setError(null)

      const token = localStorage.getItem("token")

      // Create form data for multipart/form-data
      const formData = new FormData()
      formData.append("content", newPostContent)
      if (selectedImage) {
        formData.append("image", selectedImage)
      }

      const response = await axios.post(`${API_BASE_URL}/api/posts`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      })

      if (response.data.success) {
        setSuccess("Post créé avec succès et en attente d'approbation")
        setNewPostContent("")
        setSelectedImage(null)
        setImagePreview(null)

        // Emit socket event for new post
        if (socket) {
          socket.emit("new-post", response.data.data)
        }

        // Clear success message after 3 seconds
        setTimeout(() => {
          setSuccess(null)
        }, 3000)
      }
    } catch (error) {
      console.error("Error creating post:", error)
      setError("Erreur lors de la création du post. Veuillez réessayer.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleAddComment = async (postId, commentContent) => {
    if (!commentContent.trim()) return

    try {
      const token = localStorage.getItem("token")

      const response = await axios.post(
        `${API_BASE_URL}/api/posts/${postId}/comments`,
        { content: commentContent },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      )

      if (response.data.success) {
        // Emit socket event for new comment
        if (socket) {
          socket.emit("new-comment", {
            postId,
            comment: response.data.data,
          })
        }

        // Show success message
        setSuccess("Commentaire ajouté avec succès et en attente d'approbation")

        // Clear success message after 3 seconds
        setTimeout(() => {
          setSuccess(null)
        }, 3000)
      }
    } catch (error) {
      console.error("Error adding comment:", error)
      setError("Erreur lors de l'ajout du commentaire. Veuillez réessayer.")

      // Clear error message after 3 seconds
      setTimeout(() => {
        setError(null)
      }, 3000)
    }
  }

  const [pendingReactions, setPendingReactions] = useState({})

  const handleAddReaction = async (postId, reactionType) => {
    try {
      const token = localStorage.getItem("token")

      // Mark this reaction as pending
      setPendingReactions((prev) => ({
        ...prev,
        [`${postId}-${reactionType}`]: true,
      }))

      // Optimistically update UI immediately for better user experience
      // Find the post and its current reaction counts
      const targetPost = posts.find((post) => post._id === postId)
      if (targetPost) {
        // Create a copy of the current reaction counts
        const updatedReactionCounts = { ...targetPost.reactionCounts }

        // Check if this reaction type already exists
        const currentCount = updatedReactionCounts[reactionType] || 0
        updatedReactionCounts[reactionType] = currentCount + 1

        // Calculate new total reactions
        const newTotalReactions = Object.values(updatedReactionCounts).reduce((sum, count) => sum + count, 0)

        // Update state immediately for responsive UI
        setPosts((prevPosts) =>
          prevPosts.map((post) =>
            post._id === postId
              ? {
                  ...post,
                  reactionCounts: updatedReactionCounts,
                  totalReactions: newTotalReactions,
                }
              : post,
          ),
        )
      }

      // Send request to server in background
      const response = await axios.post(
        `${API_BASE_URL}/api/posts/${postId}/reactions`,
        { type: reactionType },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      )

      if (response.data.success) {
        console.log("Reaction added successfully:", response.data.data)
        console.log(response.data.data.reactionCounts)
        // Update with actual server data
        setPosts((prevPosts) =>
          prevPosts.map((post) =>
            post._id === postId
              ? {
                  ...post,
                  reactionCounts: response.data.data.reactionCounts,
                  totalReactions: response.data.data.totalReactions,
                }
              : post,
          ),
        )

        // Emit socket event for new reaction to update all users in real-time
        if (socket) {
          socket.emit("new-reaction", {
            postId,
            reactionCounts: response.data.data.reactionCounts,
            totalReactions: response.data.data.totalReactions,
          })
        }
      }
    } catch (error) {
      console.error("Error adding reaction:", error)
      // Show error briefly without requiring user dismissal
      setError("Erreur lors de l'ajout de la réaction. Veuillez réessayer.")

      // Clear error message after 3 seconds
      setTimeout(() => {
        setError(null)
      }, 3000)
    } finally {
      // Clear pending state for this reaction
      setPendingReactions((prev) => {
        const updated = { ...prev }
        delete updated[`${postId}-${reactionType}`]
        return updated
      })
    }
  }

  const handleLoadMore = () => {
    setPage((prevPage) => prevPage + 1)
  }

  const renderReactionButtons = (post) => {
    const reactionTypes = [
      { type: "like", icon: <ThumbsUp size={16} />, label: "J'aime", activeColor: "#1877F2" },
      { type: "love", icon: <ThumbsDown size={16} />, label: "J'aime pas", activeColor: "#6c757d" },
    ]

    
    const token = localStorage.getItem('token');
    const userId = token ? JSON.parse(atob(token.split('.')[1])).id : null;

    return (
      <div className="reaction-buttons">
        {reactionTypes.map((reaction) => {
          // Check if this reaction has any counts
          const hasReactions = post.reactionCounts && post.reactionCounts[reaction.type] > 0
          // Get the count for this reaction type
          const reactionCount = hasReactions ? post.reactionCounts[reaction.type] : 0
          // Check if this reaction is currently being saved
          const isPending = pendingReactions[`${post._id}-${reaction.type}`]

          return (
            <Button
              key={reaction.type}
              variant={hasReactions ? "primary" : "light"}
              size="sm"
              className={`reaction-button ${hasReactions ? "active-reaction" : ""}`}
              onClick={() => handleAddReaction(post._id, reaction.type)}
              disabled={isPending}
              style={{
                borderColor: hasReactions ? reaction.activeColor : "",
                backgroundColor: hasReactions ? `${reaction.activeColor}20` : "",
                color: hasReactions ? reaction.activeColor : "",
              }}
            >
              {isPending ? (
                <Spinner
                  as="span"
                  animation="border"
                  size="sm"
                  role="status"
                  aria-hidden="true"
                  className="me-1"
                  style={{ width: "14px", height: "14px" }}
                />
              ) : (
                reaction.icon
              )}
              <span className="ms-1">{reaction.label}</span>
              <Badge
                bg={hasReactions ? "primary" : "secondary"}
                pill
                className="ms-1"
                style={{
                  backgroundColor: hasReactions ? reaction.activeColor : "#6c757d",
                  opacity: hasReactions ? 1 : 0.7,
                }}
              >
                {reactionCount}
              </Badge>
            </Button>
          )
        })}
      </div>
    )
  }

  return (
    <>
      <div className="title-container text-center">
        <h2>Mur Communautaire</h2>
        <p className="text-muted">
          Partagez vos pensées, posez des questions et connectez-vous avec d'autres apprenants
        </p>
      </div>
      <Container className="community-wall-container py-4">
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
        <Card className="mb-4 shadow-sm">
          <Card.Body>
            <h5 className="mb-3">Créer un nouveau post</h5>
            <Form onSubmit={handleSubmitPost}>
              <Form.Group className="mb-3">
                <Form.Control
                  as="textarea"
                  rows={3}
                  placeholder="Partagez vos pensées ou posez une question..."
                  value={newPostContent}
                  onChange={(e) => setNewPostContent(e.target.value)}
                  disabled={isSubmitting}
                />
              </Form.Group>

              {imagePreview && (
                <div className="image-preview-container mb-3">
                  <img src={imagePreview || "/placeholder.svg"} alt="Preview" className="image-preview" />
                  <Button variant="danger" size="sm" className="remove-image-btn" onClick={handleRemoveImage}>
                    &times;
                  </Button>
                </div>
              )}

              <div className="d-flex justify-content-between align-items-center">
                <Button
                  variant="outline-secondary"
                  onClick={() => fileInputRef.current.click()}
                  disabled={isSubmitting}
                >
                  <ImageIcon size={16} className="me-1" />
                  Ajouter une image
                </Button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageChange}
                  accept="image/*"
                  style={{ display: "none" }}
                />

                <Button type="submit" variant="primary" disabled={isSubmitting || !newPostContent.trim()}>
                  {isSubmitting ? (
                    <>
                      <Spinner
                        as="span"
                        animation="border"
                        size="sm"
                        role="status"
                        aria-hidden="true"
                        className="me-1"
                      />
                      Envoi...
                    </>
                  ) : (
                    <>
                      <Send size={16} className="me-1" />
                      Publier
                    </>
                  )}
                </Button>
              </div>
              <small className="text-muted d-block mt-2">
                <AlertTriangle size={14} className="me-1" />
                Les posts sont soumis à l'approbation d'un administrateur avant d'être publiés
              </small>
            </Form>
          </Card.Body>
        </Card>
        <div className="posts-container">
          {posts.length === 0 && !isLoading ? (
            <div className="text-center py-5">
              <p className="mb-0">Aucun post pour le moment. Soyez le premier à partager quelque chose !</p>
            </div>
          ) : (
            posts.map((post) => (
              <PostCard
                key={post._id}
                post={post}
                onAddComment={handleAddComment}
                renderReactionButtons={renderReactionButtons}
              />
            ))
          )}

          {isLoading && (
            <div className="text-center py-3">
              <Spinner animation="border" role="status">
                <span className="visually-hidden">Chargement...</span>
              </Spinner>
            </div>
          )}

          {hasMore && !isLoading && (
            <div className="text-center mt-3 mb-5">
              <Button variant="outline-primary" onClick={handleLoadMore}>
                Charger plus de posts
              </Button>
            </div>
          )}
        </div>{" "}
      </Container>
    </>
  )
}

const PostCard = ({ post, onAddComment, renderReactionButtons }) => {
  const [commentContent, setCommentContent] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmitComment = async (e) => {
    e.preventDefault()

    if (!commentContent.trim()) return

    setIsSubmitting(true)
    await onAddComment(post._id, commentContent)
    setCommentContent("")
    setIsSubmitting(false)
  }

  return (
    <Card className="mb-3 shadow-sm post-card">
      <Card.Body>
        <div className="d-flex align-items-center mb-3">
          <div className="post-avatar">
            {post.user.profileImage ? (
              <SafeImage
                src={`${API_BASE_URL}/${post.user.profileImage}`}
                alt={post.user.fullName}
                className="rounded-circle"
                fallbackType="avatar"
                initials={post.user.fullName.charAt(0)}
              />
            ) : (
              <div className="avatar-placeholder rounded-circle">{post.user.fullName.charAt(0)}</div>
            )}
          </div>
          <div className="ms-2">
            <h6 className="mb-0">{post.user.fullName}</h6>
            <small className="text-muted">
              {post.user.role === "teacher" ? "Enseignant" : post.user.role === "assistant" ? "Assistant" : "Étudiant"}
              <span className="mx-1">•</span>
              <Clock size={12} className="me-1" />
              {new Date(post.createdAt).toLocaleDateString("fr-FR", {
                day: "numeric",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </small>
          </div>
        </div>

        <div className="post-content mb-3">{post.content}</div>

        {post.image && (
          <div className="post-image mb-3">
            <SafeImage
              src={`${API_BASE_URL}/${post.image}`}
              alt="Post attachment"
              className="img-fluid rounded"
              fallbackType="image"
            />
          </div>
        )}

        <div className="post-stats d-flex align-items-center mb-3">
          <div className="me-3 d-flex align-items-center">
            <ThumbsUp size={14} className="me-1" style={{ color: "#1877F2" }} />
            <small className="reaction-count">{(post.reactionCounts && post.reactionCounts.like) || 0}</small>
          </div>
          <div className="me-3 d-flex align-items-center">
            <ThumbsDown size={14} className="me-1" style={{ color: "#6c757d" }} />
            <small className="reaction-count">{(post.reactionCounts && post.reactionCounts.love) || 0}</small>
          </div>
          <div className="me-3">
            <small className="text-muted">{post.totalReactions || 0} réactions totales</small>
          </div>
          <div>
            <MessageSquare size={14} className="me-1" />
            <small>{post.approvedCommentsCount || 0} commentaires</small>
          </div>
        </div>

        <hr />

        {renderReactionButtons(post)}

        <hr />

        <div className="comments-section">
          <h6 className="mb-3">Commentaires</h6>

          {post.comments && post.comments.filter((comment) => comment.status === "approved").length > 0 ? (
            post.comments
              .filter((comment) => comment.status === "approved")
              .map((comment) => (
                <div key={comment._id} className="comment mb-3">
                  <div className="d-flex">
                    <div className="comment-avatar">
                      {comment.user.profileImage ? (
                        <SafeImage
                          src={`${API_BASE_URL}/${comment.user.profileImage}`}
                          alt={comment.user.fullName}
                          className="rounded-circle"
                          fallbackType="avatar"
                          initials={comment.user.fullName.charAt(0)}
                        />
                      ) : (
                        <div className="avatar-placeholder-sm rounded-circle">{comment.user.fullName.charAt(0)}</div>
                      )}
                    </div>
                    <div className="ms-2 comment-content">
                      <div className="comment-bubble">
                        <h6 className="mb-1">{comment.user.fullName}</h6>
                        <p className="mb-1">{comment.content}</p>
                      </div>
                      <small className="text-muted">
                        {new Date(comment.createdAt).toLocaleDateString("fr-FR", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </small>
                    </div>
                  </div>
                </div>
              ))
          ) : (
            <p className="text-muted">Aucun commentaire pour le moment</p>
          )}

          <Form onSubmit={handleSubmitComment} className="mt-3">
            <div className="d-flex">
              <Form.Control
                type="text"
                placeholder="Ajouter un commentaire..."
                value={commentContent}
                onChange={(e) => setCommentContent(e.target.value)}
                disabled={isSubmitting}
                className="me-2"
              />
              <Button type="submit" variant="primary" disabled={isSubmitting || !commentContent.trim()}>
                {isSubmitting ? (
                  <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" />
                ) : (
                  <Send size={16} />
                )}
              </Button>
            </div>
            <small className="text-muted d-block mt-1">
              <AlertTriangle size={12} className="me-1" />
              Les commentaires sont soumis à l'approbation d'un administrateur
            </small>
          </Form>
        </div>
      </Card.Body>
    </Card>
  )
}

export default CommunityWall
