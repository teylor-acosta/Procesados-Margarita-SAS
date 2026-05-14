const express = require('express');
const router = express.Router();

const { proteger } = require('../middlewares/auth');

// ============================================
// 🔥 CAPITULOS INDUCCIÓN
// ============================================

router.get('/api/capitulos-induccion', proteger, async (req, res) => {

    const db = req.app.get('db');

    const sql = `
        SELECT 
            c.*,

            (
                SELECT COUNT(*) 
                FROM sub_capitulos_induccion 
                WHERE capitulo_id = c.id 
                AND activo = true
            ) as total_videos,

            (
                SELECT COUNT(*) 
                FROM progreso_videos p
                WHERE p.usuario_id = $1
                AND p.sub_capitulo_id IN (
                    SELECT id 
                    FROM sub_capitulos_induccion 
                    WHERE capitulo_id = c.id
                )
            ) as videos_vistos,

            COALESCE((
                SELECT aprobado 
                FROM resultados_evaluaciones
                WHERE usuario_id = $1
                AND capitulo_id = c.id
                LIMIT 1
            ), false) as aprobado,

            (
                SELECT nota 
                FROM resultados_evaluaciones
                WHERE usuario_id = $1
                AND capitulo_id = c.id
                LIMIT 1
            ) as nota

        FROM capitulos_induccion c

        WHERE c.activo = true

        ORDER BY c.orden ASC
    `;

    try {

        const results = await db.query(sql, [
            req.session.usuarioID
        ]);

        res.json({
            success: true,
            capitulos: results.rows
        });

    } catch (err) {

        console.error("Error en capitulos-induccion:", err);

        res.json({
            success: false,
            error: err.message
        });

    }

});

// ============================================
// 🔥 SUBCAPITULOS
// ============================================

router.get('/api/sub-capitulos/:capituloId', proteger, async (req, res) => {

    const db = req.app.get('db');

    const sql = `
        SELECT 
            s.*,

            COALESCE((
                SELECT visto 
                FROM progreso_videos
                WHERE usuario_id = $1
                AND sub_capitulo_id = s.id
            ), false) as visto

        FROM sub_capitulos_induccion s

        WHERE s.capitulo_id = $2
        AND s.activo = true

        ORDER BY s.orden ASC
    `;

    try {

        const results = await db.query(sql, [
            req.session.usuarioID,
            req.params.capituloId
        ]);

        res.json({
            success: true,
            sub_capitulos: results.rows
        });

    } catch (err) {

        console.error("Error sub-capitulos:", err);

        res.json({
            success: false,
            error: err.message
        });

    }

});

// ============================================
// 🔥 MARCAR VIDEO VISTO
// ============================================

router.post('/api/marcar-visto', proteger, async (req, res) => {

    const db = req.app.get('db');

    const { sub_capitulo_id } = req.body;

    const sql = `
        INSERT INTO progreso_videos (
            usuario_id,
            sub_capitulo_id,
            visto,
            fecha_visto
        )

        VALUES (
            $1,
            $2,
            true,
            NOW()
        )

        ON CONFLICT (usuario_id, sub_capitulo_id)

        DO UPDATE SET
            visto = true,
            fecha_visto = NOW()
    `;

    try {

        await db.query(sql, [
            req.session.usuarioID,
            sub_capitulo_id
        ]);

        res.json({
            success: true
        });

    } catch (err) {

        console.error("Error marcar-visto:", err);

        res.json({
            success: false,
            error: err.message
        });

    }

});

module.exports = router;