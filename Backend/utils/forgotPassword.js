import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();


// Function to send a new password to user's email
const sendNewPassword = async (userName, userEmail, newPassword) => {
    try {
        // Use the same environment variables as in authController.js
        const transporter = nodemailer.createTransport({
            service: process.env.EMAIL_SERVICE || 'gmail',
            host: process.env.EMAIL_HOST || 'smtp.gmail.com',
            port: parseInt(process.env.EMAIL_PORT || "465"),
            secure: process.env.EMAIL_SECURE === "false" ? false : true,
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
            tls: {
                rejectUnauthorized: false
            }
        });

        const mailOptions = {
            from: `"WeLearn Support" <${process.env.EMAIL_USER}>`,
            to: userEmail,
            subject: `Votre nouveau mot de passe WeLearn`,
            text: `
Bonjour ${userName},

Voici votre nouveau mot de passe pour accéder à votre compte WeLearn: ${newPassword}

Pour des raisons de sécurité, nous vous recommandons de changer ce mot de passe dès votre prochaine connexion.

Cordialement,
L'équipe WeLearn
            `,
            html: `
            <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
                <div style="background-color: #4361ee; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
                    <h1>Votre nouveau mot de passe</h1>
                </div>
                <div style="padding: 20px; background-color: #ffffff; border-radius: 0 0 8px 8px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);">
                    <p>Bonjour <strong>${userName}</strong>,</p>
                    <p>Voici votre nouveau mot de passe pour accéder à votre compte WeLearn:</p>
                    <div style="padding: 15px; background-color: #f9f9f9; border-left: 4px solid #4361ee; margin: 20px 0; font-family: monospace; font-size: 18px;">
                        ${newPassword}
                    </div>
                    <p>Pour des raisons de sécurité, nous vous recommandons de changer ce mot de passe dès votre prochaine connexion.</p>
                    <p>Si vous n'avez pas demandé ce nouveau mot de passe, veuillez contacter notre support immédiatement.</p>
                    <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; color: #888; font-size: 0.9em;">
                        <p>&copy; 2024 WeLearn. Tous droits réservés.</p>
                    </div>
                </div>
            </div>
            `
        };

        await transporter.sendMail(mailOptions);
        console.log('New password email sent successfully!');
        return true;
    } catch (error) {
        console.error('Error sending new password email:', error);
        throw new Error('Failed to send new password email');
    }
};

export default sendNewPassword;
