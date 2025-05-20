import User from '../models/User.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import generator from 'generate-password';
import crypto from 'crypto';
import sendNewPassword  from '../utils/forgotPassword.js';

// Create a nodemailer transporter using ethereal email for testing
// This will create a temporary test email account for development
async function createTestEmailAccount() {
  try {
    // Generate a test SMTP service account from ethereal.email
    const testAccount = await nodemailer.createTestAccount();
    console.log('Created test email account:');
    console.log('- Email:', testAccount.user);
    console.log('- Password:', testAccount.pass);

    // Create a transporter using the test account
    const testTransporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });

    console.log('Test email transporter created successfully');
    return testTransporter;
  } catch (error) {
    console.error('Failed to create test email account:', error);

    // Fallback to environment variables if test account creation fails
    console.log('Falling back to configured email settings');
    return nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE || "gmail",
      host: process.env.EMAIL_HOST || "smtp.gmail.com",
      port: parseInt(process.env.EMAIL_PORT || "465"),
      secure: process.env.EMAIL_SECURE === "false" ? false : true,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      tls: {
        rejectUnauthorized: false
      },
      debug: process.env.NODE_ENV === 'development'
    });
  }
}

// Initialize the transporter
let transporter;
createTestEmailAccount().then(t => {
  transporter = t;
  console.log('Email transporter initialized');
});


/**
 * Generate a JWT token for authentication
 * @param {string} id - User ID
 * @param {string} role - User role
 * @returns {string} JWT token
 */
const generateToken = (id, role) => {
  return jwt.sign(
    { id, role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

export const register = async (req, res) => {
  try {
    const { fullName, email, password, role, studentCard, teacherId } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'User already exists' });
    }

    // Generate a 6-digit verification code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    // Set expiration time (24 hours from now)
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const user = await User.create({
      fullName,
      email,
      password,
      role,
      verificationCode,
      verificationExpires,
      isVerified: false,
      ...(role === 'student' && { studentCard }),
      ...(role === 'teacher' && { teacherId })
    });

    // Send verification email
    try {
      console.log(`Sending verification email to: ${email}`);

      const mailOptions = {
        from: `${process.env.EMAIL_FROM_NAME || 'WeLearn'} <${process.env.EMAIL_USER}>`,
        to: email,
        subject: 'Vérification de votre compte',
        html: `
          <html>
          <head>
            <style>
              body {
                font-family: Arial, sans-serif;
                background-color: #f4f4f4;
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
                background-color: #4361ee;
                color: white;
                padding: 20px;
                text-align: center;
                border-radius: 8px 8px 0 0;
              }
              .content {
                padding: 20px;
              }
              .verification-code {
                font-size: 24px;
                font-weight: bold;
                text-align: center;
                margin: 20px 0;
                padding: 10px;
                background-color: #f0f0f0;
                border-radius: 5px;
                letter-spacing: 5px;
              }
              .button {
                background-color: #4361ee;
                color: white;
                padding: 15px 20px;
                text-decoration: none;
                border-radius: 5px;
                display: inline-block;
                margin: 20px 0;
              }
              .footer {
                text-align: center;
                padding: 20px;
                font-size: 14px;
                color: #777777;
                border-top: 1px solid #eeeeee;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Bienvenue chez WeLearn, ${fullName} !</h1>
              </div>
              <div class="content">
                <p>Merci de vous être inscrit sur notre plateforme. Pour activer votre compte, veuillez utiliser le code de vérification ci-dessous :</p>
                <div class="verification-code">${verificationCode}</div>
                <p>Ce code est valable pendant 24 heures.</p>
                <p>Si vous n'avez pas créé de compte sur notre plateforme, veuillez ignorer cet e-mail.</p>
              </div>
              <div class="footer">
                <p>&copy; 2024 WeLearn. Tous droits réservés.</p>
              </div>
            </div>
          </body>
          </html>
        `
      };

      const info = await transporter.sendMail(mailOptions);
      console.log('Verification email sent successfully');
      console.log('Message ID:', info.messageId);
    } catch (emailError) {
      console.error('Error sending verification email:', emailError);
      // Continue with the response even if email fails
    }

    // Don't send token yet since the account is not verified
    user.password = undefined;

    res.status(201).json({
      success: true,
      message: 'Account created successfully. Please check your email for verification code.',
      user: {
        _id: user._id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        isVerified: user.isVerified
      }
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

    // Generate a 6-digit verification code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    // Set expiration time (24 hours from now)
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const user = await User.create({
      fullName,
      email,
      password,
      role,
      verificationCode,
      verificationExpires,
      isVerified: false,
      ...(role === 'student' && { studentCard }),
      ...(role === 'teacher' && { teacherId })
    });

    const token = generateToken(user._id, user.role);
    user.password = undefined;


    // Send welcome email with better error handling
    try {
      console.log(`Attempting to send welcome email to: ${email}`);

      const mailOptions = {
        from: `${process.env.EMAIL_FROM_NAME || 'WeLearn'} <${process.env.EMAIL_USER}>`,
        to: email,
        subject: 'Confirmation de votre compte',
        html: `
          <html>
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
                      <div style="font-size: 24px; font-weight: bold; text-align: center; margin: 20px 0; padding: 10px; background-color: #f0f0f0; border-radius: 5px; letter-spacing: 5px;">
                        ${verificationCode}
                      </div>
                      <p>Ce code est valable pendant 24 heures.</p>
                      <p>Votre mot de passe temporaire est : <strong>${password}</strong></p>
                      <p>Nous vous recommandons de changer ce mot de passe après votre première connexion.</p>
                      <p>Nous sommes impatients de vous offrir nos meilleurs services. Si vous avez des questions ou des préoccupations, n'hésitez pas à nous contacter.</p>
                      <p>Si vous n'avez pas demandé cette inscription, veuillez ignorer cet e-mail.</p>
                  </div>

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
        `
      };

      const info = await transporter.sendMail(mailOptions);
      console.log('Welcome email sent successfully');
      console.log('Message ID:', info.messageId);

      return res.status(201).json({
        success: true,
        token,
        user
      });
    } catch (emailError) {
      console.error('Error sending welcome email:', emailError);

      // Still return success since the user was created
      return res.status(201).json({
        success: true,
        token,
        user,
        emailSent: false,
        emailError: emailError.message
      });
    }







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
      role: 'admin',
      isVerified: true // Set admin account as verified by default
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
    } else {
      const isMatch = await bcrypt.compare(req.body.password, user.password);
      console.log(isMatch);

      if (isMatch) {
        // Check if the account is verified - bypass for admin accounts
        if (!user.isVerified && user.role !== 'admin') {
          return res.status(403).json({
            success: false,
            message: 'Account not verified',
            requiresVerification: true,
            userId: user._id
          });
        }

        // If it's an admin account, automatically mark it as verified
        if (user.role === 'admin' && !user.isVerified) {
          user.isVerified = true;
          await user.save();
          console.log('Admin account automatically verified during login');
        }

        const token = generateToken(user._id, user.role);
        user.password = undefined;

        return res.status(200).json({
          success: true,
          token,
          user
        });
      } else {
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

// Password reset request
export const resetPasswordRequest = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    // Find user by email
    const user = await User.findOne({ email });

    // Even if user doesn't exist, we don't want to reveal that for security reasons
    if (!user) {
      return res.status(200).json({
        success: true,
        message: 'If an account with that email exists, a password reset link has been sent.'
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = Date.now() + 3600000; // 1 hour from now

    // Save token to user
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = resetTokenExpiry;
    await user.save();

    // Create reset URL - make sure to use the correct port (5173 for Vite dev server)
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password/${resetToken}`;
    console.log(`Generated reset URL: ${resetUrl}`);

    // Send email with better error handling
    try {
      console.log(`Attempting to send password reset email to: ${email}`);

      // Make sure transporter is initialized
      if (!transporter) {
        console.log('Transporter not initialized yet, creating it now...');
        transporter = await createTestEmailAccount();
      }

      const mailOptions = {
        from: '"WeLearn Password Reset" <reset@welearn.com>',
        to: email,
        subject: 'Réinitialisation de votre mot de passe',
        html: `
          <html>
          <head>
            <style>
              body {
                font-family: Arial, sans-serif;
                background-color: #f4f4f4;
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
                background-color: #4361ee;
                color: white;
                padding: 20px;
                text-align: center;
                border-radius: 8px 8px 0 0;
              }
              .content {
                padding: 20px;
              }
              .button {
                background-color: #4361ee;
                color: white;
                padding: 15px 20px;
                text-decoration: none;
                border-radius: 5px;
                display: inline-block;
                margin: 20px 0;
              }
              .footer {
                text-align: center;
                padding: 20px;
                font-size: 14px;
                color: #777777;
                border-top: 1px solid #eeeeee;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Réinitialisation de votre mot de passe</h1>
              </div>
              <div class="content">
                <p>Vous avez demandé la réinitialisation de votre mot de passe.</p>
                <p>Cliquez sur le bouton ci-dessous pour créer un nouveau mot de passe :</p>
                <a href="${resetUrl}" class="button">Réinitialiser mon mot de passe</a>
                <p>Ce lien expirera dans 1 heure.</p>
                <p>Si vous n'avez pas demandé cette réinitialisation, veuillez ignorer cet e-mail.</p>
              </div>
              <div class="footer">
                <p>&copy; 2024 WeLearn. Tous droits réservés.</p>
              </div>
            </div>
          </body>
          </html>
        `,
        // Add plain text version for better deliverability
        text: `
          Réinitialisation de votre mot de passe

          Vous avez demandé la réinitialisation de votre mot de passe.

          Pour créer un nouveau mot de passe, veuillez cliquer sur le lien ci-dessous ou le copier dans votre navigateur :

          ${resetUrl}

          Ce lien expirera dans 1 heure.

          Si vous n'avez pas demandé cette réinitialisation, veuillez ignorer cet e-mail.

          © 2024 WeLearn. Tous droits réservés.
        `
      };

      const info = await transporter.sendMail(mailOptions);
      console.log('Password reset email sent successfully');
      console.log('Message ID:', info.messageId);

      // Get the preview URL for Ethereal emails
      const previewUrl = nodemailer.getTestMessageUrl(info);
      console.log('Preview URL:', previewUrl);

      // Store the preview URL in a global variable or database for access
      global.lastEmailPreviewUrl = previewUrl;
      console.log('IMPORTANT: To view the email, open this URL in your browser:', previewUrl);

    } catch (emailError) {
      console.error('Error sending password reset email:', emailError);
      // We still return success to the client for security reasons
      // but log the error for debugging
    }

    res.status(200).json({
      success: true,
      message: 'If an account with that email exists, a password reset link has been sent.'
    });
  } catch (error) {
    console.error('Password reset request error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Reset password with token
// Verify account with code
export const verifyAccount = async (req, res) => {
  try {
    const { userId, verificationCode } = req.body;

    if (!userId || !verificationCode) {
      return res.status(400).json({
        success: false,
        message: 'User ID and verification code are required'
      });
    }

    // Find user by ID
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if already verified
    if (user.isVerified) {
      return res.status(400).json({
        success: false,
        message: 'Account is already verified'
      });
    }

    // Check if verification code is valid and not expired
    if (user.verificationCode !== verificationCode) {
      return res.status(400).json({
        success: false,
        message: 'Invalid verification code'
      });
    }

    if (user.verificationExpires < Date.now()) {
      return res.status(400).json({
        success: false,
        message: 'Verification code has expired'
      });
    }

    // Mark account as verified
    user.isVerified = true;
    user.verificationCode = undefined;
    user.verificationExpires = undefined;
    await user.save();

    // Generate token now that the account is verified
    const token = generateToken(user._id, user.role);
    user.password = undefined;

    // Send confirmation email
    try {
      console.log(`Sending verification confirmation email to: ${user.email}`);

      const mailOptions = {
        from: `${process.env.EMAIL_FROM_NAME || 'WeLearn'} <${process.env.EMAIL_USER}>`,
        to: user.email,
        subject: 'Compte vérifié avec succès',
        html: `
          <html>
          <head>
            <style>
              body {
                font-family: Arial, sans-serif;
                background-color: #f4f4f4;
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
                background-color: #4361ee;
                color: white;
                padding: 20px;
                text-align: center;
                border-radius: 8px 8px 0 0;
              }
              .content {
                padding: 20px;
              }
              .footer {
                text-align: center;
                padding: 20px;
                font-size: 14px;
                color: #777777;
                border-top: 1px solid #eeeeee;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Compte vérifié avec succès</h1>
              </div>
              <div class="content">
                <p>Félicitations ${user.fullName} ! Votre compte a été vérifié avec succès.</p>
                <p>Vous pouvez maintenant vous connecter et accéder à toutes les fonctionnalités de notre plateforme.</p>
              </div>
              <div class="footer">
                <p>&copy; 2024 WeLearn. Tous droits réservés.</p>
              </div>
            </div>
          </body>
          </html>
        `
      };

      const info = await transporter.sendMail(mailOptions);
      console.log('Verification confirmation email sent successfully');
      console.log('Message ID:', info.messageId);
    } catch (emailError) {
      console.error('Error sending verification confirmation email:', emailError);
      // Continue with the response even if email fails
    }

    return res.status(200).json({
      success: true,
      message: 'Account verified successfully',
      token,
      user: {
        _id: user._id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        isVerified: user.isVerified
      }
    });
  } catch (error) {
    console.error('Account verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Resend verification code
export const resendVerificationCode = async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    // Find user by ID
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if already verified
    if (user.isVerified) {
      return res.status(400).json({
        success: false,
        message: 'Account is already verified'
      });
    }

    // Generate a new verification code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    // Set new expiration time (24 hours from now)
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    // Update user with new verification code
    user.verificationCode = verificationCode;
    user.verificationExpires = verificationExpires;
    await user.save();

    // Send new verification email
    try {
      console.log(`Resending verification email to: ${user.email}`);

      const mailOptions = {
        from: `${process.env.EMAIL_FROM_NAME || 'WeLearn'} <${process.env.EMAIL_USER}>`,
        to: user.email,
        subject: 'Nouveau code de vérification',
        html: `
          <html>
          <head>
            <style>
              body {
                font-family: Arial, sans-serif;
                background-color: #f4f4f4;
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
                background-color: #4361ee;
                color: white;
                padding: 20px;
                text-align: center;
                border-radius: 8px 8px 0 0;
              }
              .content {
                padding: 20px;
              }
              .verification-code {
                font-size: 24px;
                font-weight: bold;
                text-align: center;
                margin: 20px 0;
                padding: 10px;
                background-color: #f0f0f0;
                border-radius: 5px;
                letter-spacing: 5px;
              }
              .footer {
                text-align: center;
                padding: 20px;
                font-size: 14px;
                color: #777777;
                border-top: 1px solid #eeeeee;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Nouveau code de vérification</h1>
              </div>
              <div class="content">
                <p>Voici votre nouveau code de vérification pour activer votre compte :</p>
                <div class="verification-code">${verificationCode}</div>
                <p>Ce code est valable pendant 24 heures.</p>
              </div>
              <div class="footer">
                <p>&copy; 2024 WeLearn. Tous droits réservés.</p>
              </div>
            </div>
          </body>
          </html>
        `
      };

      const info = await transporter.sendMail(mailOptions);
      console.log('New verification email sent successfully');
      console.log('Message ID:', info.messageId);
    } catch (emailError) {
      console.error('Error sending new verification email:', emailError);
      return res.status(500).json({
        success: false,
        message: 'Failed to send verification email'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'New verification code sent successfully'
    });
  } catch (error) {
    console.error('Resend verification code error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    console.log(`Reset password request received with token: ${token.substring(0, 10)}...`);

    if (!token || !newPassword) {
      console.log('Missing token or new password');
      return res.status(400).json({
        success: false,
        message: 'Token and new password are required'
      });
    }

    // Find user with valid token
    console.log(`Looking for user with reset token: ${token.substring(0, 10)}...`);
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      console.log('No user found with valid token');
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired token'
      });
    }

    console.log(`Found user: ${user.email} with valid reset token`);

    // Update password
    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    // Send confirmation email with better error handling
    try {
      console.log(`Attempting to send password change confirmation email to: ${user.email}`);

      const mailOptions = {
        from: `${process.env.EMAIL_FROM_NAME || 'WeLearn'} <${process.env.EMAIL_USER}>`,
        to: user.email,
        subject: 'Votre mot de passe a été modifié',
        html: `
          <html>
          <head>
            <style>
              body {
                font-family: Arial, sans-serif;
                background-color: #f4f4f4;
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
                background-color: #4361ee;
                color: white;
                padding: 20px;
                text-align: center;
                border-radius: 8px 8px 0 0;
              }
              .content {
                padding: 20px;
              }
              .footer {
                text-align: center;
                padding: 20px;
                font-size: 14px;
                color: #777777;
                border-top: 1px solid #eeeeee;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Mot de passe modifié avec succès</h1>
              </div>
              <div class="content">
                <p>Votre mot de passe a été modifié avec succès.</p>
                <p>Si vous n'avez pas effectué cette action, veuillez contacter notre support immédiatement.</p>
              </div>
              <div class="footer">
                <p>&copy; 2024 WeLearn. Tous droits réservés.</p>
              </div>
            </div>
          </body>
          </html>
        `
      };

      const info = await transporter.sendMail(mailOptions);
      console.log('Password change confirmation email sent successfully');
      console.log('Message ID:', info.messageId);
    } catch (emailError) {
      console.error('Error sending password change confirmation email:', emailError);
      // Continue with the response even if email fails
    }

    console.log('Password reset successful for user:', user.email);
    res.status(200).json({
      success: true,
      message: 'Password has been reset successfully'
    });
  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Send a new password to user's email
export const sendPasswordToEmail = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    // Find user by email
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Generate a new random password
    const newPassword = generator.generate({
      length: 12,
      numbers: true,
      symbols: true,
      uppercase: true,
      lowercase: true,
      strict: true
    });

    // Update user's password in the database
    user.password = newPassword;
    await user.save();

    // Send the new password to the user's email
    try {
      console.log(`Sending new password to: ${user.email}`);

      await sendNewPassword(user.fullName, user.email, newPassword);

      console.log('New password email sent successfully');

      return res.status(200).json({
        success: true,
        message: 'A new password has been sent to your email'
      });
    } catch (emailError) {
      console.error('Error sending new password email:', emailError);

      // Revert the password change if email fails
      const oldUser = await User.findOne({ email });
      if (oldUser) {
        oldUser.password = user.password; // Revert to previous password hash
        await oldUser.save();
      }

      return res.status(500).json({
        success: false,
        message: 'Failed to send new password email'
      });
    }
  } catch (error) {
    console.error('Send password to email error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};
