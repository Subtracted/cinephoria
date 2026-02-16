const express = require('express');
const router = express.Router();
const { sendContact } = require('../controllers/contactController');
const { requireFields, sanitizeInput } = require('../middleware/validate');

// POST /api/contacts - Envoyer un message de contact
router.post(
  '/',
  sanitizeInput,
  requireFields(['title', 'description']),
  sendContact
);

module.exports = router;
