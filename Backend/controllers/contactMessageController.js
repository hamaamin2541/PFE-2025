import ContactMessage from '../models/ContactMessage.js';

import sendMailContact from '../utils/sendMailContact.js';

// Créer un nouveau message de contact
export const createContactMessage = async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;

    if (!name || !email || !subject || !message) {
      return res.status(400).json({
        success: false,
        message: 'Veuillez remplir tous les champs'
      });
    }

    const contactMessage = new ContactMessage({
      name,
      email,
      subject,
      message
    });

    await contactMessage.save();

    sendMailContact(name, email, subject, message);
    console.log("email sent");
    res.status(201).json({
      success: true,
      message: 'Votre message a été envoyé avec succès'
    });
  } catch (error) {
    console.error('Error creating contact message:', error);
    res.status(500).json({
      success: false,
      message: 'Une erreur est survenue lors de l\'envoi du message'
    });
  }
};

// Obtenir tous les messages de contact (admin)
export const getAllContactMessages = async (req, res) => {
  try {
    const { status, sort = '-createdAt' } = req.query;

    // Construire la requête
    let query = {};

    if (status) query.status = status;

    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    const messages = await ContactMessage.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limit);

    const total = await ContactMessage.countDocuments(query);

    res.status(200).json({
      success: true,
      data: messages,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching contact messages:', error);
    res.status(500).json({
      success: false,
      message: 'Une erreur est survenue lors de la récupération des messages'
    });
  }
};

// Obtenir un message de contact par ID (admin)
export const getContactMessageById = async (req, res) => {
  try {
    const message = await ContactMessage.findById(req.params.id);

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message non trouvé'
      });
    }

    // Marquer comme lu si ce n'est pas déjà fait
    if (message.status === 'unread') {
      message.status = 'read';
      await message.save();
    }

    res.status(200).json({
      success: true,
      data: message
    });
  } catch (error) {
    console.error('Error fetching contact message:', error);
    res.status(500).json({
      success: false,
      message: 'Une erreur est survenue lors de la récupération du message'
    });
  }
};

// Mettre à jour le statut d'un message de contact (admin)
export const updateContactMessageStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Le statut est requis'
      });
    }

    const message = await ContactMessage.findById(req.params.id);

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message non trouvé'
      });
    }

    message.status = status;
    await message.save();

    res.status(200).json({
      success: true,
      data: message,
      message: 'Statut mis à jour avec succès'
    });
  } catch (error) {
    console.error('Error updating contact message status:', error);
    res.status(500).json({
      success: false,
      message: 'Une erreur est survenue lors de la mise à jour du statut'
    });
  }
};

// Répondre à un message de contact (admin)
export const replyToContactMessage = async (req, res) => {
  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({
        success: false,
        message: 'Le texte de la réponse est requis'
      });
    }

    const message = await ContactMessage.findById(req.params.id);

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message non trouvé'
      });
    }

    // Mettre à jour le message avec la réponse
    message.reply = {
      text,
      date: Date.now(),
      sentBy: req.user._id
    };

    message.status = 'replied';
    await message.save();

    // Fonctionnalité d'envoi d'email désactivée
    // Pour activer cette fonctionnalité, installez nodemailer avec npm install nodemailer
    // et décommentez le code suivant :
    // await sendReplyEmail(message.email, message.name, text);

    res.status(200).json({
      success: true,
      data: message,
      message: 'Réponse envoyée avec succès'
    });
  } catch (error) {
    console.error('Error replying to contact message:', error);
    res.status(500).json({
      success: false,
      message: 'Une erreur est survenue lors de l\'envoi de la réponse'
    });
  }
};

// Supprimer un message de contact (admin)
export const deleteContactMessage = async (req, res) => {
  try {
    const result = await ContactMessage.findByIdAndDelete(req.params.id);

    if (!result) {
      return res.status(404).json({
        success: false,
        message: 'Message non trouvé'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Message supprimé avec succès'
    });
  } catch (error) {
    console.error('Error deleting contact message:', error);
    res.status(500).json({
      success: false,
      message: 'Une erreur est survenue lors de la suppression du message'
    });
  }
};
