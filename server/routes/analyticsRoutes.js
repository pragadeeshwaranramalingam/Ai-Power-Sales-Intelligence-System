const express = require('express');
const router = express.Router();
const { getOverviewMetrics, getConversions } = require('../controllers/analyticsController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/overview', getOverviewMetrics);
router.get('/conversions', getConversions);

module.exports = router;
