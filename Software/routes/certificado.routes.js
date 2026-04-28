const express = require('express');
const router = express.Router();

const { proteger } = require('../middlewares/auth');

// ============================================
// 🔥 DATOS PARA EL CERTIFICADO
// ============================================

router.get('/api/datos-certificado', proteger, (req, res) => {

    const db = req.app.get('db');
    const usuario_id = req.session.usuarioID;
    
    const sql = `
        SELECT 
            e.nombre,
            e.numero_documento,
            c.nombre as cargo,
            (SELECT AVG(nota) FROM resultados_evaluaciones WHERE usuario_id = ? AND aprobado = 1) as nota_promedio,
            (SELECT fecha_firma FROM firmas_usuario WHERE usuario_id = ? ORDER BY fecha_firma DESC LIMIT 1) as fecha_firma,
            (SELECT fecha_evaluacion FROM resultados_evaluaciones WHERE usuario_id = ? AND aprobado = 1 ORDER BY fecha_evaluacion DESC LIMIT 1) as fecha_completado
        FROM usuarios u
        JOIN empleados e ON u.empleado_id = e.id
        LEFT JOIN cargos c ON e.cargo_id = c.id
        WHERE u.id = ?
    `;
    
    db.query(sql, [usuario_id, usuario_id, usuario_id, usuario_id], (err, results) => {

        if (err) {
            console.error("Error en datos-certificado:", err);
            return res.json({ success: false, error: err.message });
        }

        if (results.length === 0) {
            return res.json({ success: false, error: "No se encontraron datos del usuario" });
        }
        
        res.json({ success: true, datos: results[0] });

    });

});


// ============================================
// 🔥 GENERAR CERTIFICADO
// ============================================

router.post('/api/generar-certificado', proteger, (req, res) => {

    const db = req.app.get('db');
    const usuario_id = req.session.usuarioID;

    const sqlPromedio = `
        SELECT AVG(nota) as promedio 
        FROM resultados_evaluaciones 
        WHERE usuario_id = ? AND aprobado = 1
    `;

    db.query(sqlPromedio, [usuario_id], (err, result) => {

        if (err) {
            return res.json({ success: false });
        }

        const promedio = result[0]?.promedio || 0;
        const codigo = 'CERT-' + Date.now();

        const sqlInsert = `
            INSERT INTO certificados_usuario 
            (usuario_id, nota_final, fecha_emision, codigo_certificado)
            VALUES (?, ?, NOW(), ?)
            ON DUPLICATE KEY UPDATE
                nota_final = VALUES(nota_final),
                fecha_emision = NOW()
        `;

        db.query(sqlInsert, [usuario_id, promedio, codigo], (err2) => {

            if (err2) {
                console.error(err2);
                return res.json({ success: false });
            }

            res.json({ success: true, codigo });

        });

    });

});

module.exports = router;