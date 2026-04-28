const express = require('express');
const router = express.Router();

const { proteger } = require('../middlewares/auth');

// ============================================
// 🔥 GUARDAR FIRMA
// ============================================

router.post('/api/guardar-firma', proteger, (req, res) => {

    const db = req.app.get('db');

    const { firma_data } = req.body;
    const usuario_id = req.session.usuarioID;
    const empleado_id = req.session.empleadoID;

    const ip =
        req.headers['x-forwarded-for'] ||
        req.socket.remoteAddress ||
        '';

    if (!firma_data) {
        return res.json({ success: false, message: "No se recibió la firma" });
    }

    const sql = `
        INSERT INTO firmas_usuario (usuario_id, firma_data, fecha_firma, ip_address)
        VALUES (?, ?, NOW(), ?)
        ON DUPLICATE KEY UPDATE
            firma_data = VALUES(firma_data),
            fecha_firma = NOW(),
            ip_address = VALUES(ip_address)
    `;

    db.query(sql, [usuario_id, firma_data, ip], (err) => {

        if (err) {
            console.error("Error al guardar firma:", err);
            return res.json({ success: false, message: "Error al guardar la firma" });
        }

        const sqlInduccion = `
            INSERT INTO inducciones (empleado_id, tipo, fecha, calificacion, firmado)
            SELECT ?, 'induccion_completa', CURDATE(),
            (SELECT AVG(nota) 
             FROM resultados_evaluaciones 
             WHERE usuario_id = ? AND aprobado = 1),
            1
            WHERE NOT EXISTS (
                SELECT 1 
                FROM inducciones 
                WHERE empleado_id = ? AND tipo = 'induccion_completa'
            )
        `;

        db.query(sqlInduccion, [empleado_id, usuario_id, empleado_id], (errInd) => {

            if (errInd) {
                console.error("Error al registrar inducción:", errInd);
            }

            res.json({ success: true });

        });

    });

});


// ============================================
// 🔥 OBTENER FIRMA
// ============================================

router.get('/api/obtener-firma', proteger, (req, res) => {

    const db = req.app.get('db');
    const usuario_id = req.session.usuarioID;

    const sql = `
        SELECT firma_data 
        FROM firmas_usuario 
        WHERE usuario_id = ?
    `;

    db.query(sql, [usuario_id], (err, result) => {

        if (err) {
            console.error(err);
            return res.json({ success: false });
        }

        if (result.length > 0) {
            return res.json({
                success: true,
                firma: result[0].firma_data
            });
        }

        res.json({ success: false, firma: null });

    });

});


// ============================================
// 🔥 VERIFICAR INDUCCIÓN COMPLETADA
// ============================================

router.get('/api/induccion-completada', proteger, (req, res) => {

    const db = req.app.get('db');
    const usuario_id = req.session.usuarioID;

    const sql = `
        SELECT 
            (SELECT COUNT(*) FROM capitulos_induccion WHERE activo = 1) as total,
            (SELECT COUNT(DISTINCT capitulo_id) 
                FROM resultados_evaluaciones 
                WHERE usuario_id = ? AND aprobado = 1) as aprobados,
            (SELECT firmado 
                FROM inducciones 
                WHERE empleado_id = ? AND tipo = 'induccion_completa' 
                LIMIT 1) as firmado
    `;
    
    db.query(sql, [usuario_id, req.session.empleadoID], (err, results) => {

        if (err) {
            return res.json({ success: false });
        }
        
        const total = results[0]?.total || 0;
        const aprobados = results[0]?.aprobados || 0;
        const firmado = results[0]?.firmado || 0;

        const completada = aprobados >= total && total > 0;
        
        res.json({ 
            success: true, 
            completada: completada,
            firmado: firmado === 1,
            total: total,
            aprobados: aprobados
        });

    });

});

module.exports = router;