import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const protect = async (req, res, next) => {
  console.log('Auth middleware called');
  try {
    let token;

    if (req.headers.authorization?.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
      console.log('Token found in authorization header');
    }

    if (!token) {
      console.log('No token provided');
      return res.status(401).json({
        success: false,
        message: 'Not authorized - No token provided'
      });
    }

    console.log('Verifying token...');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Token verified, user ID:', decoded.id);

    const user = await User.findById(decoded.id);

    if (!user) {
      console.log('User not found with ID:', decoded.id);
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    console.log('User authenticated:', user.email, 'Role:', user.role);
    req.user = user;
    next();
  } catch (error) {
    console.error('Auth error:', error);
    return res.status(401).json({
      success: false,
      message: 'Authentication failed'
    });
  }
};

export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'User role is not authorized to access this route'
      });
    }
    next();
  };
};

// Middleware spécifique pour les administrateurs
export const adminOnly = (req, res, next) => {
  console.log('Admin middleware called, user role:', req.user.role);
  if (req.user.role !== 'admin') {
    console.log('Access denied: User is not an admin');
    return res.status(403).json({
      success: false,
      message: 'Cette route est réservée aux administrateurs'
    });
  }
  console.log('Admin access granted');
  next();
};
