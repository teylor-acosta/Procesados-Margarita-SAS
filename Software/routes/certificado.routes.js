const express = require('express');
const router = express.Router();

const { proteger } = require('../middlewares/auth');

// ============================================
// 🔥 DATOS PARA EL CERTIFICADO
// ============================================

router.get('/api/datos-certificado', proteger, async (req, res) => {

    try {

        const db = req.app.get('db');

        const usuario_id = req.session.usuarioID;
        
        const sql = `
            SELECT 
                e.nombre,
                e.numero_documento,
                c.nombre as cargo,

                (
                    SELECT AVG(nota) 
                    FROM resultados_evaluaciones 
                    WHERE usuario_id = ? 
                    AND aprobado = 1
                ) as nota_promedio,

                (
                    SELECT fecha_firma 
                    FROM firmas_usuario 
                    WHERE usuario_id = ? 
                    ORDER BY fecha_firma DESC 
                    LIMIT 1
                ) as fecha_firma,

                (
                    SELECT fecha_evaluacion 
                    FROM resultados_evaluaciones 
                    WHERE usuario_id = ? 
                    AND aprobado = 1 
                    ORDER BY fecha_evaluacion DESC 
                    LIMIT 1
                ) as fecha_completado

            FROM usuarios u

            JOIN empleados e 
            ON u.empleado_id = e.id

            LEFT JOIN cargos c 
            ON e.cargo_id = c.id

            WHERE u.id = ?
        `;
        
        const [results] = await db.query(
            sql,
            [
                usuario_id,
                usuario_id,
                usuario_id,
                usuario_id
            ]
        );

        if (results.length === 0) {

            return res.json({
                success: false,
                error: "No se encontraron datos del usuario"
            });

        }
        
        res.json({
            success: true,
            datos: results[0]
        });

    } catch(error) {

        console.error(
            "🔥 ERROR DATOS CERTIFICADO:",
            error
        );

        res.status(500).json({
            success: false,
            error: error.message
        });

    }

});


// ============================================
// 🔥 GENERAR CERTIFICADO
// ============================================

router.post('/api/generar-certificado', proteger, async (req, res) => {

    try {

        const db = req.app.get('db');

        const usuario_id = req.session.usuarioID;

        const sqlPromedio = `
            SELECT AVG(nota) as promedio 
            FROM resultados_evaluaciones 
            WHERE usuario_id = ? 
            AND aprobado = 1
        `;

        const [result] = await db.query(
            sqlPromedio,
            [usuario_id]
        );

        const promedio =
            result[0]?.promedio || 0;

        const codigo =
            'CERT-' + Date.now();

        const sqlInsert = `
            INSERT INTO certificados_usuario 
            (
                usuario_id,
                nota_final,
                fecha_emision,
                codigo_certificado
            )

            VALUES (?, ?, NOW(), ?)

            ON DUPLICATE KEY UPDATE

                nota_final = VALUES(nota_final),
                fecha_emision = NOW()
        `;

        await db.query(

            sqlInsert,

            [
                usuario_id,
                promedio,
                codigo
            ]

        );

        res.json({

            success: true,
            codigo

        });

    } catch(error) {

        console.error(
            '🔥 ERROR GENERAR CERTIFICADO:',
            error
        );

        res.status(500).json({

            success: false,
            error: error.message

        });

    }

});

module.exports = router;