/**
 * Génère un mot de passe aléatoire conforme aux exigences de sécurité
 * 8 caractères min, 1 majuscule, 1 minuscule, 1 chiffre, 1 caractère spécial
 * @param {number} length - Longueur du mot de passe (défaut: 12)
 * @returns {string} Mot de passe généré
 */
const generatePassword = (length = 12) => {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const specials = '@$!%*?&#+_-';

  // Garantir au moins un caractère de chaque type
  let password = '';
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += specials[Math.floor(Math.random() * specials.length)];

  // Compléter avec des caractères aléatoires
  const allChars = uppercase + lowercase + numbers + specials;
  for (let i = password.length; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }

  // Mélanger le mot de passe
  return password
    .split('')
    .sort(() => Math.random() - 0.5)
    .join('');
};

module.exports = { generatePassword };
