const express = require('express');
const authRoutes = require('../routes/authRoutes');
const userRoutes = require('../routes/userRoutes');
const restaurantRoutes = require('../routes/restaurantRoutes');
const categoryRoutes = require('../routes/categoryRoutes');
const dishRoutes = require('../routes/dishRoutes');
const orderRoutes = require('../routes/orderRoutes');
const statsRoutes = require('../routes/statsRoutes');

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/restaurants', restaurantRoutes);
router.use('/categories', categoryRoutes);
router.use('/dishes', dishRoutes);
router.use('/orders', orderRoutes);
router.use('/stats', statsRoutes);

module.exports = router;
