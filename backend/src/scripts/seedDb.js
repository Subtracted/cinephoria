/**
 * Script de seed de la base de données
 * Génère les hash bcrypt corrects pour les mots de passe
 * Usage : npm run db:seed
 */

const bcrypt = require('bcrypt');
const { pool, query } = require('../config/db');
require('dotenv').config();

const SALT_ROUNDS = 10;

const seedDatabase = async () => {
  try {
    console.log('🌱 Début du seed de la base de données...\n');

    // Hash des mots de passe
    const adminPassword = await bcrypt.hash('Admin@1234', SALT_ROUNDS);
    const employeePassword = await bcrypt.hash('Employe@1234', SALT_ROUNDS);
    const userPassword = await bcrypt.hash('User@1234', SALT_ROUNDS);

    console.log('🔐 Mots de passe hashés');

    // Mise à jour des mots de passe admin
    await query(
      `UPDATE users SET password = $1 WHERE email = 'admin@cinephoria.fr'`,
      [adminPassword]
    );
    console.log('✅ Admin : admin@cinephoria.fr / Admin@1234');

    // Mise à jour des mots de passe employés
    const employees = [
      'employe.nantes@cinephoria.fr',
      'employe.bordeaux@cinephoria.fr',
      'employe.paris@cinephoria.fr',
      'employe.toulouse@cinephoria.fr',
      'employe.lille@cinephoria.fr',
      'employe.charleroi@cinephoria.fr',
      'employe.liege@cinephoria.fr',
    ];

    for (const email of employees) {
      await query(`UPDATE users SET password = $1 WHERE email = $2`, [employeePassword, email]);
    }
    console.log('✅ Employés : Employe@1234');

    // Mise à jour du mot de passe utilisateur test
    await query(
      `UPDATE users SET password = $1 WHERE email = 'user@test.fr'`,
      [userPassword]
    );
    console.log('✅ Utilisateur : user@test.fr / User@1234');

    console.log('\n🎉 Seed terminé avec succès !');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur lors du seed :', error.message);
    process.exit(1);
  }
};

seedDatabase();
