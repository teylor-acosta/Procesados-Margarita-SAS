const express = require('express');
const router = express.Router();

const { proteger } = require('../middlewares/auth');

// ============================================
// 🔥 CAPITULOS INDUCCIÓN
// ============================================

router.get('/api/capitulos-induccion', proteger, (req, res) => {

    const db = req.app.get('db');

    const sql = `
        SELECT c.*, 
        (SELECT COUNT(*) FROM sub_capitulos_induccion WHERE capitulo_id = c.id AND activo = 1) as total_videos,
        (SELECT COUNT(*) FROM progreso_videos p WHERE p.usuario_id = ? AND p.sub_capitulo_id IN (SELECT id FROM sub_capitulos_induccion WHERE capitulo_id = c.id)) as videos_vistos,
        COALESCE((SELECT aprobado FROM resultados_evaluaciones WHERE usuario_id = ? AND capitulo_id = c.id LIMIT 1), 0) as aprobado,
        (SELECT nota FROM resultados_evaluaciones WHERE usuario_id = ? AND capitulo_id = c.id LIMIT 1) as nota
        FROM capitulos_induccion c 
        WHERE c.activo = 1 
        ORDER BY c.orden ASC
    `;

    db.query(sql, [
        req.session.usuarioID,
        req.session.usuarioID,
        req.session.usuarioID
    ], (err, results) => {

        if (err) {
            console.error("Error en capitulos-induccion:", err);
            return res.json({ success: false, error: err.message });
        }

        res.json({ success: true, capitulos: results });

    });

});

// ============================================
// 🔥 SUBCAPITULOS
// ============================================

router.get('/api/sub-capitulos/:capituloId', proteger, (req, res) => {

    const db = req.app.get('db');

    const sql = `
        SELECT s.*, 
        COALESCE((SELECT visto FROM progreso_videos WHERE usuario_id = ? AND sub_capitulo_id = s.id), 0) as visto 
        FROM sub_capitulos_induccion s 
        WHERE s.capitulo_id = ? AND s.activo = 1 
        ORDER BY s.orden ASC
    `;

    db.query(sql, [req.session.usuarioID, req.params.capituloId], (err, results) => {

        if (err) return res.json({ success: false });

        res.json({ success: true, sub_capitulos: results });

    });

});

// ============================================
// 🔥 MARCAR VIDEO VISTO
// ============================================

router.post('/api/marcar-visto', proteger, (req, res) => {

    const db = req.app.get('db');
    const { sub_capitulo_id } = req.body;

    const sql = `
        INSERT INTO progreso_videos (usuario_id, sub_capitulo_id, visto, fecha_visto) 
        VALUES (?, ?, 1, NOW()) 
        ON DUPLICATE KEY UPDATE visto = 1, fecha_visto = NOW()
    `;

    db.query(sql, [req.session.usuarioID, sub_capitulo_id], (err) => {

        if (err) return res.json({ success: false });

        res.json({ success: true });

    });

});

module.exports = router;