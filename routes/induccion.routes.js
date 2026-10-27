const express = require('express');
const router = express.Router();

const { proteger } = require('../middlewares/auth');

// ============================================
// 🔥 CAPITULOS INDUCCIÓN
// ============================================

router.get('/api/capitulos-induccion', proteger, async (req, res) => {

    try {

        const db = req.app.get('db');

        const sql = `
            SELECT c.*, 
            (SELECT COUNT(*) 
             FROM sub_capitulos_induccion 
             WHERE capitulo_id = c.id 
             AND activo = 1) as total_videos,

            (SELECT COUNT(*) 
             FROM progreso_videos p 
             WHERE p.usuario_id = ? 
             AND p.sub_capitulo_id IN (
                 SELECT id 
                 FROM sub_capitulos_induccion 
                 WHERE capitulo_id = c.id
             )) as videos_vistos,

            COALESCE(
                (
                    SELECT aprobado 
                    FROM resultados_evaluaciones 
                    WHERE usuario_id = ? 
                    AND capitulo_id = c.id 
                    LIMIT 1
                ), 
                0
            ) as aprobado,

            (
                SELECT nota 
                FROM resultados_evaluaciones 
                WHERE usuario_id = ? 
                AND capitulo_id = c.id 
                LIMIT 1
            ) as nota

            FROM capitulos_induccion c 

            WHERE c.activo = 1 

            ORDER BY c.orden ASC
        `;

        const [results] = await db.query(
            sql,
            [
                req.session.usuarioID,
                req.session.usuarioID,
                req.session.usuarioID
            ]
        );

        res.json({
            success: true,
            capitulos: results
        });

    } catch (error) {

        console.error(
            "🔥 ERROR CAPITULOS INDUCCION:",
            error
        );

        res.status(500).json({
            success: false,
            error: error.message
        });

    }

});


// ============================================
// 🔥 SUBCAPITULOS
// ============================================

router.get('/api/sub-capitulos/:capituloId', proteger, async (req, res) => {

    try {

        const db = req.app.get('db');

        const sql = `
            SELECT s.*, 

            COALESCE(
                (
                    SELECT visto 
                    FROM progreso_videos 
                    WHERE usuario_id = ? 
                    AND sub_capitulo_id = s.id
                ), 
                0
            ) as visto 

            FROM sub_capitulos_induccion s 

            WHERE s.capitulo_id = ? 
            AND s.activo = 1 

            ORDER BY s.orden ASC
        `;

        const [results] = await db.query(
            sql,
            [
                req.session.usuarioID,
                req.params.capituloId
            ]
        );

        res.json({
            success: true,
            sub_capitulos: results
        });

    } catch (error) {

        console.error(
            "🔥 ERROR SUBCAPITULOS:",
            error
        );

        res.status(500).json({
            success: false,
            error: error.message
        });

    }

});


// ============================================
// 🔥 MARCAR VIDEO VISTO
// ============================================

router.post('/api/marcar-visto', proteger, async (req, res) => {

    try {

        const db = req.app.get('db');

        const { sub_capitulo_id } = req.body;

        const sql = `
            INSERT INTO progreso_videos 
            (
                usuario_id, 
                sub_capitulo_id, 
                visto, 
                fecha_visto
            ) 

            VALUES (?, ?, 1, NOW()) 

            ON DUPLICATE KEY UPDATE 
                visto = 1, 
                fecha_visto = NOW()
        `;

        await db.query(
            sql,
            [
                req.session.usuarioID,
                sub_capitulo_id
            ]
        );

        res.json({
            success: true
        });

    } catch (error) {

        console.error(
            "🔥 ERROR MARCAR VISTO:",
            error
        );

        res.status(500).json({
            success: false,
            error: error.message
        });

    }

});

module.exports = router;