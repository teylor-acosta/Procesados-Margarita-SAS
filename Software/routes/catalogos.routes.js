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


// ============================================
// 🔥 TODOS LOS CATALOGOS
// ============================================

router.get('/api/catalogos', proteger, async (req, res) => {

    try {

        const db = req.app.get('db');

        const [areas] = await db.query(
            "SELECT id, nombre FROM areas"
        );

        const [sedes] = await db.query(
            "SELECT id, nombre FROM sedes"
        );

        const [cargos] = await db.query(
            "SELECT id, nombre FROM cargos"
        );

        res.json({

            areas,
            sedes,
            cargos

        });

    } catch(error) {

        console.error(error);

        res.status(500).json({

            areas: [],
            sedes: [],
            cargos: []

        });

    }

});

module.exports = router;