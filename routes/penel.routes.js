const express = require('express');
const router = express.Router();
const path = require('path');
const { proteger } = require('../middlewares/auth');

// 🔥 PANEL GENERAL
router.get('/panel', proteger, (req, res) => {
    res.sendFile(path.join(__dirname, '../public', 'panel.html'));
});

module.exports = router;