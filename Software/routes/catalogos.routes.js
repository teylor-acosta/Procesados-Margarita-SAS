const express = require('express');
const router = express.Router();

const { proteger } = require('../middlewares/auth');

// ============================================
// 🔥 AREAS
// ============================================

router.get('/api/areas', proteger, async (req, res) => {

    try {

        const db = req.app.get('db');

        const [results] = await db.query(
            "SELECT id, nombre FROM areas"
        );

        res.json(results);

    } catch(error) {

        console.error(error);

        res.json([]);

    }

});


// ============================================
// 🔥 SEDES
// ============================================

router.get('/api/sedes', proteger, async (req, res) => {

    try {

        const db = req.app.get('db');

        const [results] = await db.query(
            "SELECT id, nombre FROM sedes"
        );

        res.json(results);

    } catch(error) {

        console.error(error);

        res.json([]);

    }

});


// ============================================
// 🔥 CARGOS
// ============================================

router.get('/api/cargos', proteger, async (req, res) => {

    try {

        const db = req.app.get('db');

        const [results] = await db.query(
            "SELECT id, nombre FROM cargos"
        );

        res.json(results);

    } catch(error) {

        console.error(error);

        res.json([]);

    }

});

module.exports = router;