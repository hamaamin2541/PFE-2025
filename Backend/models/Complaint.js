import mongoose from 'mongoose';

const complaintSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  subject: {
    type: String,
    required: [true, 'Le sujet est requis'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'La description est requise']
  },
  // Type de réclamation
  type: {
    type: String,
    enum: ['course', 'teacher', 'payment', 'technical', 'other'],
    required: true
  },
  // Référence optionnelle à un cours, test ou formation
  relatedItem: {
    itemType: {
      type: String,
      enum: ['course', 'test', 'formation'],
      required: function() {
        return this.relatedItem.itemId != null;
      }
    },
    itemId: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'relatedItem.itemType'
    }
  },
  // Statut de la réclamation
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'resolved', 'rejected'],
    default: 'pending'
  },
  // Priorité de la réclamation
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  // Pièces jointes (fichiers)
  attachments: [{
    name: String,
    file: String,
    type: String,
    size: Number
  }],
  // Commentaires et réponses
  comments: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    text: {
      type: String,
      required: true
    },
    date: {
      type: Date,
      default: Date.now
    }
  }],
  // Date de résolution
  resolvedAt: {
    type: Date
  },
  // Administrateur qui a traité la réclamation
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

export default mongoose.model('Complaint', complaintSchema);
