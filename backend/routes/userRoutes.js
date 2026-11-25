const express = require('express');
const { getUsers, getUserById, toggleUserStatus, updateUserRole } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

const router = express.Router();

// Toutes les routes /api/users sont réservées aux administrateurs.
router.use(protect, authorize('admin'));

router.get('/', getUsers);
router.get('/:id', getUserById);
router.put('/:id/status', toggleUserStatus);
router.put('/:id/role', updateUserRole);

module.exports = router;
