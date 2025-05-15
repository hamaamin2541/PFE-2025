import User from '../models/User.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import  nodemailer from 'nodemailer'
 import generator from  'generate-password';
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: "lamarimedamin1@gmail.com",
        pass: "ccrg mggr wfrk djyh", 
    },
    tls: {
        rejectUnauthorized: false,
    },
});


const generateToken = (id, role) => {
  return jwt.sign(
    { id, role },
    process.env.JWT_SECRET,
    { expiresIn: '30d' }  
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

export const add_newuser = async (req, res) => {
  try {

    const { fullName, email, role, studentCard, teacherId } = req.body;
    let password = generator.generate({
	length: 10,
	numbers: true
});
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


 transporter.sendMail({
                from: 'Admin Salle',
                to: email,
                subject: 'Confirmation de votre compte',
                html: `
             
<html >
<head>
    
    <style>
        body {
            font-family: Arial, sans-serif;
            background-color: #fce4ec; /* Light pink background */
            margin: 0;
            padding: 0;
        }
        .container {
            width: 100%;
            max-width: 600px;
            margin: 20px auto;
            background-color: #ffffff;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        .header {
            background-color: #f48fb1; /* Soft pink header */
            color: white;
            padding: 20px;
            text-align: center;
            border-radius: 8px 8px 0 0;
        }
        .content {
            padding: 20px;
        }
        .button {
            background-color: #f48fb1;
            color: white;
            padding: 15px 20px;
            text-decoration: none;
            border-radius: 5px;
            display: inline-block;
            margin: 20px 0;
        }
        .social-icons {
            text-align: center;
            padding: 10px;
        }
        .social-icons img {
            margin: 0 10px;
            width: 32px;
            height: 32px;
        }
        .footer {
            text-align: center;
            padding: 20px;
            font-size: 14px;
            color: #777777;
            border-top: 1px solid #eeeeee;
        }
        .footer p {
            margin: 5px 0;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Bienvenue chez <strong>Bambino</strong>, ${fullName} !</h1>
        </div>
        <div class="content">
            <p>Merci de nous avoir rejoints! Nous sommes ravis de vous accueillir dans notre communauté.</p>
            <p>Pour activer votre compte, veuillez utiliser le code de confirmation ci-dessous :</p>
          
            <p>Nous sommes impatients de vous offrir nos meilleurs services. Si vous avez des questions ou des préoccupations, n'hésitez pas à nous contacter.</p>
            <p>Si vous n'avez pas demandé cette inscription, veuillez ignorer cet e-mail.</p>
            <a href="#" class="button">Activer mon compte</a>
        </div>
        <p> votre password :${password}</p>

        <!-- Social Media Section -->
        <div class="social-icons">
            <a href="https://facebook.com/"><img src="https://upload.wikimedia.org/wikipedia/commons/5/51/Facebook_f_logo_%282019%29.svg" alt="Facebook"></a>
            <a href="https://instagram.com/"><img src="https://upload.wikimedia.org/wikipedia/commons/a/a5/Instagram_icon.png" alt="Instagram"></a>
            <a href="https://twitter.com/"><img src="https://upload.wikimedia.org/wikipedia/en/6/60/Twitter_Logo_as_of_2021.svg" alt="Twitter"></a>
            <a href="https://whatsapp.com/"><img src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg" alt="WhatsApp"></a>
        </div>

        <!-- Footer -->
        <div class="footer">
            <p>Merci de nous avoir choisis!</p>
            <p>&copy; 2024 Bambino. Tous droits réservés.</p>
            <p>Tel: 27 233 234</p>
        </div>
    </div>
</body>
</html>

                `,
            }, async (err) => {
                if (err) {
                    console.log(err);
                    return res.status(400).json(err);
                } else {
                    
                 
return     res.status(201).json({
      success: true,
      token,
      user
    }); }
            });
        






  } catch (error) {
    console.log('Create user error:', error);
    
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
