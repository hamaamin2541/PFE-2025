import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

const sendMailContact = async (name, email, subject, message) => {
    try {
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.Gmail,
                pass: process.env.gmailApp,
            },
        });

        const mailOptions = {
            from: `"WeLearn Support" <${process.env.Gemail}>`,
            to: process.env.Gmail,
            subject: `New Contact Message: ${subject}`,
            text: `
Name: ${name}
Email: ${email}
Subject: ${subject}
Message: ${message}
  `,
            html: `
  <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
    <h2 style="color: #0078D7;">New Contact Message Received</h2>
    <p><strong>Name:</strong> ${name}</p>
    <p><strong>Email:</strong> <a href="mailto:${email}" style="color: #0078D7;">${email}</a></p>
    <p><strong>Subject:</strong> ${subject}</p>
    <p><strong>Message:</strong></p>
    <div style="padding: 10px; background-color: #f9f9f9; border-left: 4px solid #0078D7;">
      <p>${message.replace(/\n/g, '<br>')}</p>
    </div>
    <hr style="border:none; border-top:1px solid #eee; margin: 20px 0;">
    <p style="font-size: 0.9em; color: #888;">This message was sent from the Airbus website contact form.</p>
  </div>
  `
        };

        await transporter.sendMail(mailOptions);
        console.log('Email sent successfully!');
    } catch (error) {
        console.error('Error sending email:', error);
        throw new Error('Failed to send email');
    }
};

export default sendMailContact;
