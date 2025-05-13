import axios from 'axios';

/**
 * Configure les en-têtes d'authentification pour les requêtes axios
 * @returns {Object} Headers avec le token d'authentification
 */
export const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  };
};

/**
 * Vérifie si l'utilisateur est connecté
 * @returns {Boolean} True si l'utilisateur est connecté
 */
export const isAuthenticated = () => {
  return !!localStorage.getItem('token');
};

/**
 * Récupère les données de l'utilisateur connecté
 * @returns {Object} Données de l'utilisateur
 */
export const getCurrentUser = () => {
  const userString = localStorage.getItem('user');
  if (!userString) return null;
  
  try {
    return JSON.parse(userString);
  } catch (error) {
    console.error('Error parsing user data:', error);
    return null;
  }
};

/**
 * Vérifie si l'utilisateur a un rôle spécifique
 * @param {String} role - Le rôle à vérifier
 * @returns {Boolean} True si l'utilisateur a le rôle spécifié
 */
export const hasRole = (role) => {
  const user = getCurrentUser();
  return user && user.role === role;
};

/**
 * Vérifie si l'utilisateur est un enseignant
 * @returns {Boolean} True si l'utilisateur est un enseignant
 */
export const isTeacher = () => {
  return hasRole('teacher');
};

/**
 * Vérifie si l'utilisateur est un étudiant
 * @returns {Boolean} True si l'utilisateur est un étudiant
 */
export const isStudent = () => {
  return hasRole('student');
};

/**
 * Vérifie si l'utilisateur est un administrateur
 * @returns {Boolean} True si l'utilisateur est un administrateur
 */
export const isAdmin = () => {
  return hasRole('admin');
};

/**
 * Crée une instance axios avec les en-têtes d'authentification
 * @returns {Object} Instance axios configurée
 */
export const authAxios = () => {
  const token = localStorage.getItem('token');
  
  const instance = axios.create({
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  // Intercepteur pour gérer les erreurs d'authentification
  instance.interceptors.response.use(
    response => response,
    error => {
      if (error.response && (error.response.status === 401 || error.response.status === 403)) {
        console.log('Authentication error:', error.response.data);
        // Vous pouvez rediriger vers la page de connexion ici si nécessaire
      }
      return Promise.reject(error);
    }
  );
  
  return instance;
};

export default {
  getAuthHeaders,
  isAuthenticated,
  getCurrentUser,
  hasRole,
  isTeacher,
  isStudent,
  isAdmin,
  authAxios
};
