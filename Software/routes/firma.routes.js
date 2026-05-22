const express = require('express');
const router = express.Router();

const { proteger } = require('../middlewares/auth');

// ============================================
// 🔥 GUARDAR FIRMA
// ============================================

router.post('/api/guardar-firma', proteger, async (req, res) => {

    try {

        console.log("🔥 INICIANDO GUARDADO FIRMA");

        const db = req.app.get('db');

        const { firma_data } = req.body;

        const usuario_id =
            req.session.usuarioID;

        const empleado_id =
            req.session.empleadoID;

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

        // ============================================
        // 🔥 GUARDAR FIRMA
        // ============================================

        console.log("🔥 GUARDANDO FIRMA");

        const sql = `
            INSERT INTO firmas_usuario 

            (
                usuario_id,
                firma_data,
                fecha_firma,
                ip_address
            )

            VALUES (?, ?, NOW(), ?)

            ON DUPLICATE KEY UPDATE

                firma_data = VALUES(firma_data),
                fecha_firma = NOW(),
                ip_address = VALUES(ip_address)
        `;

        await db.query(

            sql,

            [
                usuario_id,
                firma_data,
                ip
            ]

        );

        console.log("🔥 FIRMA GUARDADA");

        // ============================================
        // 🔥 GUARDAR INDUCCION
        // ============================================

        console.log("🔥 GUARDANDO INDUCCION");

        const sqlInduccion = `
            INSERT INTO inducciones 

            (
                empleado_id,
                tipo,
                fecha,
                calificacion,
                firmado
            )

            SELECT 

                ?,
                'induccion_completa',
                CURDATE(),

                (
                    SELECT AVG(nota) 
                    FROM resultados_evaluaciones 
                    WHERE usuario_id = ? 
                    AND aprobado = 1
                ),

                1

            WHERE NOT EXISTS (

                SELECT 1 

                FROM inducciones 

                WHERE empleado_id = ? 
                AND tipo = 'induccion_completa'

            )
        `;

        await db.query(

            sqlInduccion,

            [
                empleado_id,
                usuario_id,
                empleado_id
            ]

        );

        console.log("🔥 INDUCCION GUARDADA");

        // ============================================
        // 🔥 GENERAR CERTIFICADO
        // ============================================

        console.log("🔥 ENTRANDO A GENERAR CERTIFICADO");

        const sqlPromedio = `
            SELECT AVG(nota) as promedio
            FROM resultados_evaluaciones
            WHERE usuario_id = ?
            AND aprobado = 1
        `;

        const [promedioResult] = await db.query(
            sqlPromedio,
            [usuario_id]
        );

        console.log("🔥 PROMEDIO:", promedioResult);

        const promedio =
            promedioResult[0]?.promedio || 0;

        const codigo =
            'CERT-' + Date.now();

        console.log("🔥 CODIGO:", codigo);

        const sqlCertificado = `
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
                fecha_emision = NOW(),
                codigo_certificado = VALUES(codigo_certificado)
        `;

        console.log("🔥 EJECUTANDO INSERT CERTIFICADO");

        await db.query(

            sqlCertificado,

            [
                usuario_id,
                promedio,
                codigo
            ]

        );

        console.log("🔥 CERTIFICADO GUARDADO");

        // ============================================
        // 🔥 RESPUESTA
        // ============================================

        res.json({

            success: true

        });

    } catch(err) {

        console.error("🔥 ERROR GUARDAR FIRMA COMPLETO:");
        console.log(err);

        res.status(500).json({

            success: false,
            message: err.message

        });

    }

});

// ============================================
// 🔥 OBTENER FIRMA
// ============================================

router.get('/api/obtener-firma', proteger, async (req, res) => {

    try {

        const db = req.app.get('db');

        const usuario_id =
            req.session.usuarioID;

        const sql = `
            SELECT firma_data 

            FROM firmas_usuario 

            WHERE usuario_id = ?
        `;

        const [result] = await db.query(
            sql,
            [usuario_id]
        );

        if (result.length > 0) {

            return res.json({

                success: true,
                firma: result[0].firma_data

            });

        }

        res.json({

            success: false,
            firma: null

        });

    } catch(err) {

        console.error(err);

        res.status(500).json({

            success: false

        });

    }

});


// ============================================
// 🔥 VERIFICAR INDUCCIÓN COMPLETADA
// ============================================

router.get('/api/induccion-completada', proteger, async (req, res) => {

    try {

        const db = req.app.get('db');

        const usuario_id =
            req.session.usuarioID;

        const sql = `
            SELECT 

                (
                    SELECT COUNT(*) 
                    FROM capitulos_induccion 
                    WHERE activo = 1
                ) as total,

                (
                    SELECT COUNT(DISTINCT capitulo_id) 
                    FROM resultados_evaluaciones 
                    WHERE usuario_id = ? 
                    AND aprobado = 1
                ) as aprobados,

                (
                    SELECT firmado 
                    FROM inducciones 
                    WHERE empleado_id = ? 
                    AND tipo = 'induccion_completa' 
                    LIMIT 1
                ) as firmado
        `;
        
        const [results] = await db.query(

            sql,

            [
                usuario_id,
                req.session.empleadoID
            ]

        );

        const total =
            results[0]?.total || 0;

        const aprobados =
            results[0]?.aprobados || 0;

        const firmado =
            results[0]?.firmado || 0;

        const completada =
            aprobados >= total &&
            total > 0;
        
        res.json({ 

            success: true,

            completada,

            firmado: firmado === 1,

            total,

            aprobados

        });

    } catch(err) {

        console.error(err);

        res.status(500).json({

            success: false

        });

    }

});

module.exports = router;