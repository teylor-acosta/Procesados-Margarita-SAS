const express = require('express');
const router = express.Router();

const { proteger } = require('../middlewares/auth');

// ============================================
// 🔥 SUBIR FOTO PERFIL
// ============================================

router.post('/api/subir-foto', proteger, async (req, res) => {

    try {

        const db = req.app.get('db');

        const { foto } = req.body;

        const sql = `
            UPDATE empleados e

            JOIN usuarios u 
            ON u.empleado_id = e.id

            SET e.foto = ?

            WHERE u.id = ?
        `;

        await db.query(
            sql,
            [
                foto,
                req.session.usuarioID
            ]
        );

        res.json({
            success: true
        });

    } catch (error) {

        console.error(
            '🔥 ERROR SUBIR FOTO:',
            error
        );

        res.status(500).json({
            success: false,
            error: error.message
        });

    }

});

module.exports = router;