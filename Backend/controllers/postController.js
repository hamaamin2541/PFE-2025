import Post from '../models/Post.js';
import User from '../models/User.js';
import mongoose from 'mongoose';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = 'uploads/posts';
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'post-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// File filter for images
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Seules les images sont autorisées!'), false);
  }
};

export const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// Create a new post
export const createPost = async (req, res) => {
  try {
    const { content } = req.body;
    
    if (!content) {
      return res.status(400).json({
        success: false,
        message: 'Le contenu du post est requis'
      });
    }
    
    const post = new Post({
      user: req.user._id,
      content
    });
    
    // Add image if uploaded
    if (req.file) {
      post.image = req.file.path;
    }
    
    await post.save();
    
    // Populate user information
    const populatedPost = await Post.findById(post._id).populate({
      path: 'user',
      select: 'fullName profileImage role'
    });
    
    res.status(201).json({
      success: true,
      data: populatedPost,
      message: 'Post créé avec succès et en attente d\'approbation'
    });
  } catch (error) {
    console.error('Error creating post:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création du post',
      error: error.message
    });
  }
};

// Get all approved posts
export const getApprovedPosts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    const posts = await Post.find({ status: 'approved' })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate({
        path: 'user',
        select: 'fullName profileImage role'
      })
      .populate({
        path: 'comments.user',
        select: 'fullName profileImage role'
      });
    
    const total = await Post.countDocuments({ status: 'approved' });
    
    res.status(200).json({
      success: true,
      data: posts,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error getting approved posts:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des posts',
      error: error.message
    });
  }
};

// Get all pending posts (admin only)
export const getPendingPosts = async (req, res) => {
  try {
    const posts = await Post.find({ status: 'pending' })
      .sort({ createdAt: -1 })
      .populate({
        path: 'user',
        select: 'fullName profileImage role'
      });
    
    res.status(200).json({
      success: true,
      data: posts
    });
  } catch (error) {
    console.error('Error getting pending posts:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des posts en attente',
      error: error.message
    });
  }
};

// Update post status (admin only)
export const updatePostStatus = async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Statut invalide'
      });
    }
    
    const post = await Post.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    ).populate({
      path: 'user',
      select: 'fullName profileImage role'
    });
    
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post non trouvé'
      });
    }
    
    res.status(200).json({
      success: true,
      data: post,
      message: `Post ${status === 'approved' ? 'approuvé' : 'rejeté'} avec succès`
    });
  } catch (error) {
    console.error('Error updating post status:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour du statut du post',
      error: error.message
    });
  }
};

// Add a comment to a post
export const addComment = async (req, res) => {
  try {
    const { content } = req.body;
    
    if (!content) {
      return res.status(400).json({
        success: false,
        message: 'Le contenu du commentaire est requis'
      });
    }
    
    const post = await Post.findById(req.params.id);
    
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post non trouvé'
      });
    }
    
    // Add comment to post
    post.comments.push({
      user: req.user._id,
      content
    });
    
    await post.save();
    
    // Get the newly added comment
    const newComment = post.comments[post.comments.length - 1];
    
    // Populate user information for the new comment
    const populatedPost = await Post.findById(post._id).populate({
      path: 'comments.user',
      select: 'fullName profileImage role'
    });
    
    const populatedComment = populatedPost.comments.find(
      comment => comment._id.toString() === newComment._id.toString()
    );
    
    res.status(201).json({
      success: true,
      data: populatedComment,
      message: 'Commentaire ajouté avec succès et en attente d\'approbation'
    });
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'ajout du commentaire',
      error: error.message
    });
  }
};

// Update comment status (admin only)
export const updateCommentStatus = async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Statut invalide'
      });
    }
    
    const post = await Post.findOne({
      'comments._id': req.params.commentId
    });
    
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Commentaire non trouvé'
      });
    }
    
    // Update comment status
    const comment = post.comments.id(req.params.commentId);
    comment.status = status;
    comment.updatedAt = Date.now();
    
    await post.save();
    
    res.status(200).json({
      success: true,
      data: comment,
      message: `Commentaire ${status === 'approved' ? 'approuvé' : 'rejeté'} avec succès`
    });
  } catch (error) {
    console.error('Error updating comment status:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour du statut du commentaire',
      error: error.message
    });
  }
};

// Add a reaction to a post
export const addReaction = async (req, res) => {
  try {
    const { type } = req.body;
    
    if (!['like', 'love', 'haha', 'wow', 'sad', 'angry'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Type de réaction invalide'
      });
    }
    
    const post = await Post.findById(req.params.id);
    
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post non trouvé'
      });
    }
    
    // Check if user already reacted
    const existingReaction = post.reactions.find(
      reaction => reaction.user.toString() === req.user._id.toString()
    );
    
    if (existingReaction) {
      // Update existing reaction
      existingReaction.type = type;
      existingReaction.createdAt = Date.now();
    } else {
      // Add new reaction
      post.reactions.push({
        user: req.user._id,
        type
      });
    }
    
    await post.save();
    
    res.status(200).json({
      success: true,
      data: {
        reactionCounts: post.reactionCounts,
        totalReactions: post.totalReactions
      },
      message: 'Réaction ajoutée avec succès'
    });
  } catch (error) {
    console.error('Error adding reaction:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'ajout de la réaction',
      error: error.message
    });
  }
};

// Remove a reaction from a post
export const removeReaction = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post non trouvé'
      });
    }
    
    // Remove user's reaction
    post.reactions = post.reactions.filter(
      reaction => reaction.user.toString() !== req.user._id.toString()
    );
    
    await post.save();
    
    res.status(200).json({
      success: true,
      data: {
        reactionCounts: post.reactionCounts,
        totalReactions: post.totalReactions
      },
      message: 'Réaction supprimée avec succès'
    });
  } catch (error) {
    console.error('Error removing reaction:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression de la réaction',
      error: error.message
    });
  }
};
