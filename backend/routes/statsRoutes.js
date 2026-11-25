const express = require('express');
const { getAdminStats, getPublicStats } = require('../controllers/statsController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

const router = express.Router();

router.get('/public', getPublicStats);
router.get('/admin', protect, authorize('admin'), getAdminStats);

module.exports = router;
