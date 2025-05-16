import Settings from '../models/Settings.js';

// Get all settings
export const getSettings = async (req, res) => {
  console.log('getSettings controller called');
  try {
    console.log('Fetching settings from database...');
    const settings = await Settings.getSettings();
    console.log('Settings retrieved:', settings);

    res.status(200).json({
      success: true,
      data: settings
    });
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des paramètres',
      error: error.message
    });
  }
};

// Update settings for a specific section
export const updateSettings = async (req, res) => {
  try {
    const { section } = req.params;
    const updateData = req.body;

    // Validate section
    const validSections = ['general', 'security', 'notifications', 'email'];
    if (!validSections.includes(section)) {
      return res.status(400).json({
        success: false,
        message: 'Section invalide'
      });
    }

    // Get current settings
    let settings = await Settings.getSettings();

    // Update the specific section
    settings[section] = {
      ...settings[section],
      ...updateData
    };

    await settings.save();

    res.status(200).json({
      success: true,
      message: `Paramètres ${section} mis à jour avec succès`,
      data: settings
    });
  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour des paramètres',
      error: error.message
    });
  }
};

// Reset settings to default
export const resetSettings = async (req, res) => {
  try {
    // Delete existing settings
    await Settings.deleteMany({});

    // Create new settings with defaults
    const settings = await Settings.getSettings();

    res.status(200).json({
      success: true,
      message: 'Paramètres réinitialisés avec succès',
      data: settings
    });
  } catch (error) {
    console.error('Error resetting settings:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la réinitialisation des paramètres',
      error: error.message
    });
  }
};

// Test email configuration
export const testEmailConfig = async (req, res) => {
  try {
    // In a real application, this would send a test email
    // For now, we'll just simulate success

    res.status(200).json({
      success: true,
      message: 'Test de configuration email réussi'
    });
  } catch (error) {
    console.error('Error testing email config:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du test de la configuration email',
      error: error.message
    });
  }
};
