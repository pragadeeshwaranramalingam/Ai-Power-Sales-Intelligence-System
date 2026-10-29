const express = require('express');
const router = express.Router();
const multer = require('multer');
const {
  getLeads,
  getLeadById,
  createLead,
  updateLead,
  deleteLead,
  addActivity,
  getActivities,
  getLeadInsights,
  importLeads,
  exportLeads
} = require('../controllers/leadController');
const { protect } = require('../middleware/auth');
const { validateLead } = require('../validators/leadValidator');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// Protected routes
router.use(protect);

router.route('/')
  .get(getLeads)
  .post(validateLead, createLead);

router.get('/export', exportLeads);
router.post('/import', upload.single('file'), importLeads);

router.route('/:id')
  .get(getLeadById)
  .put(updateLead)
  .delete(deleteLead);

router.route('/:id/activities')
  .get(getActivities)
  .post(addActivity);

router.get('/:id/insights', getLeadInsights);

module.exports = router;
