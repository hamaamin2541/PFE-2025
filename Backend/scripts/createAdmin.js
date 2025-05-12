import mongoose from 'mongoose';
import dotenv from 'dotenv';
import colors from 'colors';
import bcrypt from 'bcryptjs';

// Charger les variables d'environnement
dotenv.config();

// Importer le modèle User
import User from '../models/User.js';

// Fonction pour créer un administrateur
async function createAdmin() {
  try {
    // Se connecter à MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB Connected'.cyan.underline);

    // Vérifier si un administrateur existe déjà
    const adminExists = await User.findOne({ role: 'admin' });
    
    if (adminExists) {
      console.log('Un administrateur existe déjà:'.yellow);
      console.log(`Email: ${adminExists.email}`.green);
      console.log(`Nom: ${adminExists.fullName}`.green);
      console.log(`ID: ${adminExists._id}`.green);
      
      // Demander confirmation pour réinitialiser le mot de passe
      console.log('\nVoulez-vous réinitialiser le mot de passe? (y/n)'.yellow);
      process.stdin.once('data', async (data) => {
        const input = data.toString().trim().toLowerCase();
        
        if (input === 'y' || input === 'yes') {
          // Réinitialiser le mot de passe
          adminExists.password = 'admin123';
          await adminExists.save();
          console.log('Mot de passe réinitialisé à: admin123'.green);
        }
        
        mongoose.disconnect();
        process.exit(0);
      });
      
      return;
    }

    // Créer un nouvel administrateur
    const adminData = {
      fullName: 'Admin',
      email: 'admin@welearn.com',
      password: 'admin123',
      role: 'admin'
    };

    const admin = new User(adminData);
    await admin.save();

    console.log('Administrateur créé avec succès:'.green);
    console.log(`Email: ${adminData.email}`.cyan);
    console.log(`Mot de passe: ${adminData.password}`.cyan);
    console.log(`ID: ${admin._id}`.cyan);

    mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Erreur lors de la création de l\'administrateur:'.red.bold);
    console.error(error);
    process.exit(1);
  }
}

// Exécuter la fonction
createAdmin();
