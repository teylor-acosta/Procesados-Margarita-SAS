const express = require('express');
const router = express.Router();
const { proteger } = require('../middlewares/auth');

// ============================================
// 🔥 SUBIR FOTO PERFIL
// ============================================

router.post('/api/subir-foto', proteger, (req, res) => {

    const db = req.app.get('db');
    const { foto } = req.body;

    const sql = `
        UPDATE empleados e
        JOIN usuarios u ON u.empleado_id = e.id
        SET e.foto = $1
        WHERE u.id = $1
    `;

    db.query(sql, [foto, req.session.usuarioID], (err) => {

        if (err) {
            console.error(err);
            return res.json({ success: false });
        }

        res.json({ success: true });
    });

});

module.exports = router;