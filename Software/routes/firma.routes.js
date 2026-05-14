const express = require('express');
const router = express.Router();

const { proteger } = require('../middlewares/auth');

// ============================================
// 🔥 GUARDAR FIRMA
// ============================================

router.post('/api/guardar-firma', proteger, async (req, res) => {

    const db = req.app.get('db');

    const { firma_data } = req.body;

    const usuario_id = req.session.usuarioID;
    const empleado_id = req.session.empleadoID;

    const ip =
        req.headers['x-forwarded-for'] ||
        req.socket.remoteAddress ||
        '';

    if (!firma_data) {

        return res.json({
            success: false,
            message: "No se recibió la firma"
        });

    }

    const sql = `
        INSERT INTO firmas_usuario (
            usuario_id,
            firma_data,
            fecha_firma,
            ip_address
        )

        VALUES (
            $1,
            $2,
            NOW(),
            $3
        )

        ON CONFLICT (usuario_id)

        DO UPDATE SET
            firma_data = EXCLUDED.firma_data,
            fecha_firma = NOW(),
            ip_address = EXCLUDED.ip_address
    `;

    try {

        await db.query(sql, [
            usuario_id,
            firma_data,
            ip
        ]);

        const sqlInduccion = `
            INSERT INTO inducciones (
                empleado_id,
                tipo,
                fecha,
                calificacion,
                firmado
            )

            SELECT
                $1,
                'induccion_completa',
                CURRENT_DATE,

                (
                    SELECT AVG(nota)
                    FROM resultados_evaluaciones
                    WHERE usuario_id = $2
                    AND aprobado = true
                ),

                true

            WHERE NOT EXISTS (
                SELECT 1
                FROM inducciones
                WHERE empleado_id = $3
                AND tipo = 'induccion_completa'
            )
        `;

        await db.query(sqlInduccion, [
            empleado_id,
            usuario_id,
            empleado_id
        ]);

        res.json({
            success: true
        });

    } catch (err) {

        console.error("Error al guardar firma:", err);

        res.json({
            success: false,
            message: "Error al guardar la firma"
        });

    }

});


// ============================================
// 🔥 OBTENER FIRMA
// ============================================

router.get('/api/obtener-firma', proteger, async (req, res) => {

    const db = req.app.get('db');

    const usuario_id = req.session.usuarioID;

    const sql = `
        SELECT firma_data
        FROM firmas_usuario
        WHERE usuario_id = $1
    `;

    try {

        const result = await db.query(sql, [
            usuario_id
        ]);

        if (result.rows.length > 0) {

            return res.json({
                success: true,
                firma: result.rows[0].firma_data
            });

        }

        res.json({
            success: false,
            firma: null
        });

    } catch (err) {

        console.error(err);

        res.json({
            success: false
        });

    }

});


// ============================================
// 🔥 VERIFICAR INDUCCIÓN COMPLETADA
// ============================================

router.get('/api/induccion-completada', proteger, async (req, res) => {

    const db = req.app.get('db');

    const usuario_id = req.session.usuarioID;

    const sql = `
        SELECT

            (
                SELECT COUNT(*)
                FROM capitulos_induccion
                WHERE activo = true
            ) as total,

            (
                SELECT COUNT(DISTINCT capitulo_id)
                FROM resultados_evaluaciones
                WHERE usuario_id = $1
                AND aprobado = true
            ) as aprobados,

            (
                SELECT firmado
                FROM inducciones
                WHERE empleado_id = $2
                AND tipo = 'induccion_completa'
                LIMIT 1
            ) as firmado
    `;

    try {

        const results = await db.query(sql, [
            usuario_id,
            req.session.empleadoID
        ]);

        const total = results.rows[0]?.total || 0;

        const aprobados = results.rows[0]?.aprobados || 0;

        const firmado = results.rows[0]?.firmado || false;

        const completada =
            aprobados >= total &&
            total > 0;

        res.json({
            success: true,
            completada: completada,
            firmado: firmado === true,
            total: total,
            aprobados: aprobados
        });

    } catch (err) {

        console.error(err);

        res.json({
            success: false
        });

    }

});

module.exports = router;