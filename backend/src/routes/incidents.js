const express = require('express');
const router = express.Router();
const { createIncident, getIncidents, updateIncident } = require('../controllers/incidentController');
const { authenticate, authorize } = require('../middleware/auth');
const { requireFields, sanitizeInput } = require('../middleware/validate');

// GET /api/incidents - Liste des incidents
router.get('/', authenticate, authorize('employee', 'admin'), getIncidents);

// POST /api/incidents - Signaler un incident
router.post(
  '/',
  authenticate,
  authorize('employee', 'admin'),
  sanitizeInput,
  requireFields(['roomId', 'description']),
  createIncident
);

// PUT /api/incidents/:id - Mettre à jour un incident
router.put(
  '/:id',
  authenticate,
  authorize('employee', 'admin'),
  sanitizeInput,
  updateIncident
);

module.exports = router;
