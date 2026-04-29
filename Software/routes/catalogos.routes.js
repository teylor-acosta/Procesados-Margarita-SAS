const express = require('express');
const router = express.Router();

const { proteger } = require('../middlewares/auth');

// ============================================
// 🔥 AREAS
// ============================================
router.get('/api/areas', proteger, (req, res) => {

    const db = req.app.get('db');

    db.query("SELECT id, nombre FROM areas", (err, results) => {
        if (err) return res.json([]);
        res.json(results);
    });
});

// ============================================
// 🔥 SEDES
// ============================================
router.get('/api/sedes', proteger, (req, res) => {

    const db = req.app.get('db');

    db.query("SELECT id, nombre FROM sedes", (err, results) => {
        if (err) return res.json([]);
        res.json(results);
    });
});

// ============================================
// 🔥 CARGOS
// ============================================
router.get('/api/cargos', proteger, (req, res) => {

    const db = req.app.get('db');

    db.query("SELECT id, nombre FROM cargos", (err, results) => {
        if (err) return res.json([]);
        res.json(results);
    });
});

module.exports = router;