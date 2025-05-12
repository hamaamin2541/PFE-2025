import User from '../models/User.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const generateToken = (id, role) => {
  return jwt.sign(
    { id, role },
    process.env.JWT_SECRET,
    { expiresIn: '30d' }  // Using string timespan format
  );
};

export const register = async (req, res) => {
  try {
    const { fullName, email, password, role, studentCard, teacherId } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'User already exists' });
    }

    const user = await User.create({
      fullName,
      email,
      password,
      role,
      ...(role === 'student' && { studentCard }),
      ...(role === 'teacher' && { teacherId })
    });

    const token = generateToken(user._id, user.role);
    user.password = undefined;

    res.status(201).json({
      success: true,
      token,
      user
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

export const createAdmin = async (req, res) => {
  try {
    const { fullName, email, password, secretKey } = req.body;

    // Vérifier la clé secrète (à définir dans votre fichier .env)
    if (secretKey !== process.env.ADMIN_SECRET_KEY) {
      return res.status(401).json({
        success: false,
        message: 'Clé secrète invalide'
      });
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'Un utilisateur avec cet email existe déjà'
      });
    }

    const user = await User.create({
      fullName,
      email,
      password,
      role: 'admin'
    });

    const token = generateToken(user._id, user.role);
    user.password = undefined;

    res.status(201).json({
      success: true,
      token,
      user,
      message: 'Compte administrateur créé avec succès'
    });
  } catch (error) {
    console.error('Create admin error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
console.log(email,password);

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    const user = await User.findOne({ email })
console.log(user);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials user'
      });
    }else{

    const isMatch = await bcrypt.compare(req.body.password, user.password);
    console.log(isMatch);
    
    if (isMatch) {
       const token = generateToken(user._id, user.role);
    user.password = undefined;

   return  res.status(200).json({
      success: true,
      token,
      user
    });
    
    }else{

     return res.status(401).json({
        success: false,
        message: 'Invalid credentials password'
      });
}
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};
