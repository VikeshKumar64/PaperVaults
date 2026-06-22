const express = require('express');
const router = express.Router();
const { adminLogin } = require('../controllers/authController');

// POST /api/auth/login
router.post('/login', adminLogin);

module.exports = router;
