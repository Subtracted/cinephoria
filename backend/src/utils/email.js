const nodemailer = require('nodemailer');
require('dotenv').config();

// Configuration du transporteur email
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: process.env.SMTP_PORT || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

/**
 * Envoie un email de confirmation d'inscription
 * @param {string} to - Adresse email du destinataire
 * @param {string} firstName - Prénom de l'utilisateur
 */
const sendWelcomeEmail = async (to, firstName) => {
  const mailOptions = {
    from: `"Cinéphoria" <${process.env.EMAIL_FROM || 'noreply@cinephoria.fr'}>`,
    to,
    subject: 'Bienvenue chez Cinéphoria !',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #1a1a2e; color: #e0e0e0; padding: 30px; border-radius: 10px;">
        <h1 style="color: #4ade80; text-align: center;">🎬 Cinéphoria</h1>
        <h2>Bonjour ${firstName},</h2>
        <p>Bienvenue sur Cinéphoria ! Votre compte a été créé avec succès.</p>
        <p>Vous pouvez dès maintenant réserver vos places de cinéma et profiter de nos séances.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.FRONTEND_URL}" style="background: #4ade80; color: #1a1a2e; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">Découvrir nos films</a>
        </div>
        <p style="color: #888; font-size: 12px; text-align: center;">© 2026 Cinéphoria - Tous droits réservés</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`[Email] Email de bienvenue envoyé à ${to}`);
  } catch (error) {
    console.error(`[Email] Erreur d'envoi à ${to}:`, error.message);
  }
};

/**
 * Envoie un email avec un nouveau mot de passe généré
 * @param {string} to - Adresse email
 * @param {string} newPassword - Nouveau mot de passe généré
 */
const sendPasswordResetEmail = async (to, newPassword) => {
  const mailOptions = {
    from: `"Cinéphoria" <${process.env.EMAIL_FROM || 'noreply@cinephoria.fr'}>`,
    to,
    subject: 'Réinitialisation de votre mot de passe - Cinéphoria',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #1a1a2e; color: #e0e0e0; padding: 30px; border-radius: 10px;">
        <h1 style="color: #4ade80; text-align: center;">🎬 Cinéphoria</h1>
        <h2>Réinitialisation de mot de passe</h2>
        <p>Votre mot de passe a été réinitialisé. Voici votre nouveau mot de passe temporaire :</p>
        <div style="background: #16213e; padding: 15px; border-radius: 5px; text-align: center; margin: 20px 0;">
          <code style="font-size: 18px; color: #4ade80;">${newPassword}</code>
        </div>
        <p><strong>Important :</strong> Vous devrez obligatoirement modifier ce mot de passe lors de votre prochaine connexion.</p>
        <p style="color: #888; font-size: 12px; text-align: center;">© 2026 Cinéphoria - Tous droits réservés</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`[Email] Email de réinitialisation envoyé à ${to}`);
  } catch (error) {
    console.error(`[Email] Erreur d'envoi à ${to}:`, error.message);
  }
};

/**
 * Envoie un email de contact au support Cinéphoria
 * @param {Object} data - Données du formulaire de contact
 */
const sendContactEmail = async (data) => {
  const mailOptions = {
    from: `"Cinéphoria Contact" <${process.env.EMAIL_FROM || 'noreply@cinephoria.fr'}>`,
    to: process.env.SMTP_USER || 'contact@cinephoria.fr',
    subject: `[Contact] ${data.title}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2>Nouveau message de contact</h2>
        <p><strong>De :</strong> ${data.username || 'Anonyme'} ${data.email ? `(${data.email})` : ''}</p>
        <p><strong>Objet :</strong> ${data.title}</p>
        <hr/>
        <p>${data.description}</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('[Email] Email de contact envoyé');
  } catch (error) {
    console.error('[Email] Erreur d\'envoi du contact:', error.message);
  }
};

module.exports = { sendWelcomeEmail, sendPasswordResetEmail, sendContactEmail };
