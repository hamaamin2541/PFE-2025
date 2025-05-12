import Complaint from '../models/Complaint.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Ensure uploads directory exists
const uploadsDir = join(__dirname, '../uploads/complaints');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function(req, file, cb) {
    cb(null, `complaint-${Date.now()}-${file.originalname}`);
  }
});

export const upload = multer({ storage: storage });

// Créer une nouvelle réclamation
export const createComplaint = async (req, res) => {
  try {
    const { subject, description, type, relatedItem } = req.body;
    
    // Créer la réclamation
    const complaint = new Complaint({
      user: req.user._id,
      subject,
      description,
      type,
      relatedItem: relatedItem ? JSON.parse(relatedItem) : undefined
    });
    
    // Ajouter les pièces jointes si elles existent
    if (req.files && req.files.length > 0) {
      complaint.attachments = req.files.map(file => ({
        name: file.originalname,
        file: file.path,
        type: file.mimetype,
        size: file.size
      }));
    }
    
    await complaint.save();
    
    res.status(201).json({
      success: true,
      data: complaint,
      message: 'Réclamation créée avec succès'
    });
  } catch (error) {
    console.error('Error creating complaint:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Obtenir toutes les réclamations (admin)
export const getAllComplaints = async (req, res) => {
  try {
    const { status, priority, type, sort = '-createdAt' } = req.query;
    
    // Construire la requête
    let query = {};
    
    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (type) query.type = type;
    
    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;
    
    const complaints = await Complaint.find(query)
      .populate('user', 'fullName email profileImage')
      .populate('assignedTo', 'fullName email profileImage')
      .sort(sort)
      .skip(skip)
      .limit(limit);
    
    const total = await Complaint.countDocuments(query);
    
    res.status(200).json({
      success: true,
      data: complaints,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching complaints:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Obtenir les réclamations d'un utilisateur
export const getUserComplaints = async (req, res) => {
  try {
    const complaints = await Complaint.find({ user: req.user._id })
      .populate('assignedTo', 'fullName')
      .sort('-createdAt');
    
    res.status(200).json({
      success: true,
      data: complaints
    });
  } catch (error) {
    console.error('Error fetching user complaints:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Obtenir une réclamation par ID
export const getComplaintById = async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id)
      .populate('user', 'fullName email profileImage')
      .populate('assignedTo', 'fullName email profileImage')
      .populate('comments.user', 'fullName email profileImage role');
    
    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'Réclamation non trouvée'
      });
    }
    
    // Vérifier si l'utilisateur est autorisé à voir cette réclamation
    if (req.user.role !== 'admin' && complaint.user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Non autorisé à accéder à cette réclamation'
      });
    }
    
    res.status(200).json({
      success: true,
      data: complaint
    });
  } catch (error) {
    console.error('Error fetching complaint:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Mettre à jour le statut d'une réclamation (admin)
export const updateComplaintStatus = async (req, res) => {
  try {
    const { status, priority, assignedTo } = req.body;
    
    const complaint = await Complaint.findById(req.params.id);
    
    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'Réclamation non trouvée'
      });
    }
    
    // Mettre à jour les champs
    if (status) {
      complaint.status = status;
      if (status === 'resolved') {
        complaint.resolvedAt = Date.now();
      }
    }
    
    if (priority) complaint.priority = priority;
    if (assignedTo) complaint.assignedTo = assignedTo;
    
    await complaint.save();
    
    res.status(200).json({
      success: true,
      data: complaint,
      message: 'Réclamation mise à jour avec succès'
    });
  } catch (error) {
    console.error('Error updating complaint:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Ajouter un commentaire à une réclamation
export const addComment = async (req, res) => {
  try {
    const { text } = req.body;
    
    if (!text) {
      return res.status(400).json({
        success: false,
        message: 'Le commentaire ne peut pas être vide'
      });
    }
    
    const complaint = await Complaint.findById(req.params.id);
    
    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'Réclamation non trouvée'
      });
    }
    
    // Vérifier si l'utilisateur est autorisé à commenter cette réclamation
    if (req.user.role !== 'admin' && complaint.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Non autorisé à commenter cette réclamation'
      });
    }
    
    complaint.comments.push({
      user: req.user._id,
      text
    });
    
    await complaint.save();
    
    // Récupérer la réclamation avec les commentaires populés
    const updatedComplaint = await Complaint.findById(req.params.id)
      .populate('comments.user', 'fullName email profileImage role');
    
    res.status(200).json({
      success: true,
      data: updatedComplaint.comments[updatedComplaint.comments.length - 1],
      message: 'Commentaire ajouté avec succès'
    });
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
