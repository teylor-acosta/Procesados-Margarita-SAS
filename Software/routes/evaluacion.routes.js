const express = require('express');
const router = express.Router();

const { proteger } = require('../middlewares/auth');

// ============================================
// 🔥 OBTENER PREGUNTAS
// ============================================

router.get('/api/preguntas-evaluacion/:capituloId', proteger, async (req, res) => {

    const db = req.app.get('db');

    const sql = `
        SELECT 
            id,
            pregunta,
            opcion_a,
            opcion_b,
            opcion_c,
            opcion_d,
            respuesta_correcta,
            puntos 

        FROM preguntas_induccion 

        WHERE capitulo_id = $1
    `;

    try {

        const results = await db.query(sql, [
            req.params.capituloId
        ]);

        res.json({
            success: true,
            preguntas: results.rows
        });

    } catch (err) {

        console.error("Error al cargar preguntas:", err);

        res.json({
            success: false,
            message: err.message
        });

    }

});


// ============================================
// 🔥 GUARDAR EVALUACIÓN
// ============================================

router.post('/api/guardar-evaluacion', proteger, async (req, res) => {

    const db = req.app.get('db');

    const { capitulo_id, respuestas } = req.body;

    const usuario_id = req.session.usuarioID;

    if (!capitulo_id || !respuestas) {

        return res.json({
            success: false,
            message: "Datos incompletos"
        });

    }

    try {

        // =========================================
        // 🔥 OBTENER PREGUNTAS
        // =========================================

        const sqlGetPreguntas = `
            SELECT 
                id,
                respuesta_correcta 

            FROM preguntas_induccion 

            WHERE capitulo_id = $1
        `;

        const preguntasResult = await db.query(
            sqlGetPreguntas,
            [capitulo_id]
        );

        const preguntas = preguntasResult.rows;

        if (preguntas.length === 0) {

            return res.json({
                success: false,
                message: "No hay preguntas para este capítulo"
            });

        }

        // =========================================
        // 🔥 CALCULAR NOTA
        // =========================================

        let aciertos = 0;

        preguntas.forEach(p => {

            const respuestaUsuario =
                respuestas[p.id];

            if (
                respuestaUsuario &&
                respuestaUsuario === p.respuesta_correcta
            ) {

                aciertos++;

            }

        });

        const nota = Math.round(
            (aciertos / preguntas.length) * 100
        );

        const aprobado =
            nota >= 70;

        // =========================================
        // 🔥 VALIDAR EXISTENTE
        // =========================================

        const sqlCheck = `
            SELECT id

            FROM resultados_evaluaciones

            WHERE usuario_id = $1
            AND capitulo_id = $2
        `;

        const existingResult = await db.query(
            sqlCheck,
            [
                usuario_id,
                capitulo_id
            ]
        );

        const existing =
            existingResult.rows;

        // =========================================
        // 🔥 INSERT / UPDATE
        // =========================================

        if (existing.length > 0) {

            const sqlUpdate = `
                UPDATE resultados_evaluaciones

                SET
                    nota = $1,
                    aprobado = $2,
                    fecha_evaluacion = NOW()

                WHERE usuario_id = $3
                AND capitulo_id = $4
            `;

            await db.query(sqlUpdate, [

                nota,
                aprobado,
                usuario_id,
                capitulo_id

            ]);

        } else {

            const sqlInsert = `
                INSERT INTO resultados_evaluaciones (

                    usuario_id,
                    capitulo_id,
                    nota,
                    aprobado,
                    fecha_evaluacion

                )

                VALUES (

                    $1,
                    $2,
                    $3,
                    $4,
                    NOW()

                )
            `;

            await db.query(sqlInsert, [

                usuario_id,
                capitulo_id,
                nota,
                aprobado

            ]);

        }

        // =========================================
        // 🔥 VALIDAR INDUCCIÓN COMPLETA
        // =========================================

        const sqlTotal = `
            SELECT COUNT(*) as total

            FROM capitulos_induccion

            WHERE activo = true
        `;

        const totalResult =
            await db.query(sqlTotal);

        const sqlAprobados = `
            SELECT COUNT(*) as aprobados

            FROM resultados_evaluaciones

            WHERE usuario_id = $1
            AND aprobado = true
        `;

        const aprobadosResult =
            await db.query(sqlAprobados, [
                usuario_id
            ]);

        const totalCapitulos =
            totalResult.rows[0]?.total || 0;

        const totalAprobados =
            aprobadosResult.rows[0]?.aprobados || 0;

        // =========================================
        // 🔥 ACTUALIZAR USUARIO
        // =========================================

        if (
            totalAprobados >= totalCapitulos &&
            totalCapitulos > 0
        ) {

            await db.query(

                `
                UPDATE usuarios

                SET primera_vez = false

                WHERE id = $1
                `,

                [usuario_id]

            );

        }

        // =========================================
        // 🔥 RESPUESTA
        // =========================================

        res.json({

            success: true,
            nota,
            aprobado

        });

    } catch (err) {

        console.error("Error guardar evaluación:", err);

        res.json({

            success: false,
            message: err.message

        });

    }

});

module.exports = router;