const express = require('express');
const router = express.Router();

const { proteger, soloSuperAdmin } = require('../middlewares/auth');

// ============================================
// 🔥 LISTAR EMPLEADOS
// ============================================

router.get('/api/empleados', proteger, soloSuperAdmin, (req, res) => {

    const db = req.app.get('db');

    db.query("SELECT * FROM empleados", (err, results) => {
        if (err) return res.json([]);
        res.json(results);
    });

});

// ============================================
// 🔥 CREAR EMPLEADO
// ============================================

router.post('/api/crear-empleado', proteger, soloSuperAdmin, (req, res) => {

    const db = req.app.get('db');
    const e = req.body;

    const sql = `
    INSERT INTO empleados (
        nombre, tipo_documento, numero_documento, rh,
        fecha_nacimiento, lugar_nacimiento, estado_civil,
        direccion, barrio_localidad, telefono, email, activo
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'SI')
    `;

    db.query(sql, [
        e.nombre,
        e.tipo_documento,
        e.numero_documento,
        e.rh,
        e.fecha_nacimiento,
        e.lugar_nacimiento,
        e.estado_civil,
        e.direccion,
        e.barrio_localidad,
        e.telefono,
        e.email
    ], (err) => {

        if (err) {
            console.error(err);
            return res.json({ success: false });
        }

        res.json({ success: true });

    });

});

module.exports = router;