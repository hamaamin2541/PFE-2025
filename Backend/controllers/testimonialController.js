import Testimonial from '../models/Testimonial.js';

// Créer un nouveau témoignage
export const createTestimonial = async (req, res) => {
  try {
    const { name, role, message, rating } = req.body;

    if (!name || !role || !message || !rating) {
      return res.status(400).json({
        success: false,
        message: 'Veuillez remplir tous les champs requis'
      });
    }

    // Créer le témoignage
    const testimonial = new Testimonial({
      name,
      role,
      message,
      rating: Number(rating),
      // Si l'utilisateur est connecté, on ajoute son ID
      user: req.user ? req.user._id : null
    });

    await testimonial.save();

    res.status(201).json({
      success: true,
      data: testimonial,
      message: 'Votre témoignage a été soumis avec succès et sera publié après modération'
    });
  } catch (error) {
    console.error('Error creating testimonial:', error);
    res.status(500).json({
      success: false,
      message: 'Une erreur est survenue lors de la création du témoignage',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Erreur serveur'
    });
  }
};

// Obtenir tous les témoignages approuvés (public)
export const getApprovedTestimonials = async (req, res) => {
  try {
    const testimonials = await Testimonial.find({ approved: true })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: testimonials.length,
      data: testimonials
    });
  } catch (error) {
    console.error('Error fetching testimonials:', error);
    res.status(500).json({
      success: false,
      message: 'Une erreur est survenue lors de la récupération des témoignages',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Erreur serveur'
    });
  }
};

// Obtenir tous les témoignages (admin)
export const getAllTestimonials = async (req, res) => {
  try {
    const testimonials = await Testimonial.find()
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: testimonials.length,
      data: testimonials
    });
  } catch (error) {
    console.error('Error fetching testimonials:', error);
    res.status(500).json({
      success: false,
      message: 'Une erreur est survenue lors de la récupération des témoignages',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Erreur serveur'
    });
  }
};

// Approuver ou rejeter un témoignage (admin)
export const updateTestimonialStatus = async (req, res) => {
  try {
    const { approved } = req.body;

    if (approved === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Le statut d\'approbation est requis'
      });
    }

    const testimonial = await Testimonial.findByIdAndUpdate(
      req.params.id,
      { approved },
      { new: true, runValidators: true }
    );

    if (!testimonial) {
      return res.status(404).json({
        success: false,
        message: 'Témoignage non trouvé'
      });
    }

    res.status(200).json({
      success: true,
      data: testimonial,
      message: `Témoignage ${approved ? 'approuvé' : 'rejeté'} avec succès`
    });
  } catch (error) {
    console.error('Error updating testimonial status:', error);
    res.status(500).json({
      success: false,
      message: 'Une erreur est survenue lors de la mise à jour du statut',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Erreur serveur'
    });
  }
};

// Supprimer un témoignage (admin)
export const deleteTestimonial = async (req, res) => {
  try {
    const testimonial = await Testimonial.findById(req.params.id);

    if (!testimonial) {
      return res.status(404).json({
        success: false,
        message: 'Témoignage non trouvé'
      });
    }

    await Testimonial.deleteOne({ _id: testimonial._id });

    res.status(200).json({
      success: true,
      message: 'Témoignage supprimé avec succès'
    });
  } catch (error) {
    console.error('Error deleting testimonial:', error);
    res.status(500).json({
      success: false,
      message: 'Une erreur est survenue lors de la suppression du témoignage',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Erreur serveur'
    });
  }
};
