// Script pour créer un compte administrateur
// Exécutez ce script avec : node createAdminScript.js

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

// Charger les variables d'environnement
dotenv.config();

// Définir le schéma utilisateur
const userSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['student', 'teacher', 'assistant', 'admin'],
    required: true
  },
  profileImage: String,
  specialty: String,
  bio: String,
  phone: String
}, {
  timestamps: true
});

// Middleware pour hacher le mot de passe avant de sauvegarder
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Créer le modèle User
const User = mongoose.model('User', userSchema);

// Fonction pour créer un administrateur
async function createAdmin() {
  try {
    // Se connecter à MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB Connected');

    // Vérifier si un administrateur existe déjà
    const adminExists = await User.findOne({ role: 'admin' });

    if (adminExists) {
      console.log('Un administrateur existe déjà:');
      console.log(`Email: ${adminExists.email}`);
      console.log(`Nom: ${adminExists.fullName}`);
      console.log(`ID: ${adminExists._id}`);

      // Réinitialiser le mot de passe
      adminExists.password = 'admin123';
      await adminExists.save();
      console.log('Mot de passe réinitialisé à: admin123');

      mongoose.disconnect();
      return;
    }

    // Créer un nouvel administrateur
    const adminData = {
      fullName: 'Admin',
      email: 'admin@welearn.com',
      password: 'admin123',
      role: 'admin',
      isVerified: true // Set admin account as verified by default
    };

    const admin = new User(adminData);
    await admin.save();

    console.log('Administrateur créé avec succès:');
    console.log(`Email: ${adminData.email}`);
    console.log(`Mot de passe: ${adminData.password}`);
    console.log(`ID: ${admin._id}`);

    mongoose.disconnect();
  } catch (error) {
    console.error('Erreur lors de la création de l\'administrateur:');
    console.error(error);
    process.exit(1);
  }
}

// Exécuter la fonction
createAdmin();
