const express = require("express");
const router = express.Router();

const db = require("../DB");
const { proteger } = require("../middlewares/auth");


// ==========================================================
// OBTENER EVALUACIÓN PARA EL USUARIO
// ==========================================================

router.get(
    "/api/evaluaciones/:evaluacionId/presentar",
    proteger,
    async (req, res) => {

        try {

            const { evaluacionId } = req.params;

            const [evaluacion] = await db.query(
                `
                SELECT
                    id,
                    curso_id,
                    capitulo_id,
                    titulo,
                    descripcion,
                    porcentaje_aprobacion,
                    intentos,
                    orden
                FROM evaluaciones_curso
                WHERE id = ?
                AND activo = 1
                `,
                [evaluacionId]
            );

            if (evaluacion.length === 0) {

                return res.status(404).json({
                    success: false,
                    mensaje: "La evaluación no existe."
                });

            }

            const [preguntas] = await db.query(
                `
                SELECT
                    id,
                    pregunta,
                    orden,
                    tipo,
                    puntaje,
                    obligatoria
                FROM preguntas_curso
                WHERE evaluacion_id = ?
                AND activo = 1
                ORDER BY orden ASC
                `,
                [evaluacionId]
            );

            for (const pregunta of preguntas) {

                const [opciones] = await db.query(
                    `
                    SELECT
                        id,
                        respuesta,
                        orden,
                        fila,
                        columna
                    FROM respuestas_curso
                    WHERE pregunta_id = ?
                    ORDER BY orden ASC
                    `,
                    [pregunta.id]
                );

                pregunta.opciones = opciones;

            }

            res.json({

                success: true,

                evaluacion: evaluacion[0],

                preguntas

            });

        } catch (error) {

            console.error(
                "ERROR OBTENIENDO EVALUACIÓN:",
                error
            );

            res.status(500).json({

                success: false,

                mensaje: error.message

            });

        }

    }
);


// ==========================================================
// PRESENTAR EVALUACIÓN
// ==========================================================

router.post(
    "/api/evaluaciones/:evaluacionId/presentar",
    proteger,
    async (req, res) => {

        const connection = await db.getConnection();

        try {

            await connection.beginTransaction();

            const { evaluacionId } = req.params;

            const usuarioId =
                req.session.usuarioID;

            const { respuestas } = req.body;


            // ==================================================
            // OBTENER EVALUACIÓN
            // ==================================================

            const [evaluaciones] =
                await connection.query(
                    `
                    SELECT
                        id,
                        curso_id,
                        porcentaje_aprobacion,
                        intentos
                    FROM evaluaciones_curso
                    WHERE id = ?
                    AND activo = 1
                    `,
                    [evaluacionId]
                );

            if (evaluaciones.length === 0) {

                throw new Error(
                    "La evaluación no existe."
                );

            }

            const evaluacion =
                evaluaciones[0];


            // ==================================================
            // CONTAR INTENTOS
            // ==================================================

            const [intentosBD] =
                await connection.query(
                    `
                    SELECT COUNT(*) AS total
                    FROM evaluaciones_usuario
                    WHERE usuario_id = ?
                    AND evaluacion_id = ?
                    `,
                    [
                        usuarioId,
                        evaluacionId
                    ]
                );

            const numeroIntento =
                intentosBD[0].total + 1;


            // ==================================================
            // VALIDAR INTENTOS
            // ==================================================

            if (
                evaluacion.intentos &&
                numeroIntento > evaluacion.intentos
            ) {

                throw new Error(
                    "Has alcanzado el número máximo de intentos."
                );

            }


            // ==================================================
            // OBTENER PREGUNTAS CORRECTAS
            // ==================================================

            const [preguntas] =
                await connection.query(
                    `
                    SELECT
                        id,
                        tipo,
                        puntaje
                    FROM preguntas_curso
                    WHERE evaluacion_id = ?
                    AND activo = 1
                    `,
                    [evaluacionId]
                );


            // ==================================================
            // CREAR INTENTO
            // ==================================================

            const [resultadoIntento] =
                await connection.query(
                    `
                    INSERT INTO evaluaciones_usuario
                    (
                        usuario_id,
                        evaluacion_id,
                        intento,
                        puntaje,
                        aprobado,
                        fecha_presentacion
                    )
                    VALUES (?, ?, ?, 0, 0, NOW())
                    `,
                    [
                        usuarioId,
                        evaluacionId,
                        numeroIntento
                    ]
                );

            const evaluacionUsuarioId =
                resultadoIntento.insertId;


            // ==================================================
            // GUARDAR RESPUESTAS
            // ==================================================

            for (const respuesta of respuestas || []) {

                await connection.query(
                    `
                    INSERT INTO respuestas_evaluacion_curso
                    (
                        evaluacion_usuario_id,
                        pregunta_id,
                        respuesta
                    )
                    VALUES (?, ?, ?)
                    `,
                    [
                        evaluacionUsuarioId,
                        respuesta.pregunta_id,
                        respuesta.respuesta
                    ]
                );

            }


            // ==================================================
            // CALCULAR PUNTAJE
            // ==================================================

            let puntosObtenidos = 0;
            let puntosTotales = 0;


            for (const pregunta of preguntas) {

                puntosTotales +=
                    Number(pregunta.puntaje || 0);


                const respuestaUsuario =
                    (respuestas || []).find(
                        r =>
                            Number(r.pregunta_id) ===
                            Number(pregunta.id)
                    );


                if (!respuestaUsuario) {
                    continue;
                }


                // ==============================================
                // OBTENER RESPUESTAS CORRECTAS
                // ==============================================

                const [correctas] =
                    await connection.query(
                        `
                        SELECT respuesta
                        FROM respuestas_curso
                        WHERE pregunta_id = ?
                        AND correcta = 1
                        `,
                        [pregunta.id]
                    );


                if (!correctas.length) {
                    continue;
                }


                const respuestasCorrectas =
                    correctas.map(
                        r =>
                            String(r.respuesta)
                            .trim()
                            .toLowerCase()
                    );


                const respuestaDada =
                    String(
                        respuestaUsuario.respuesta ?? ""
                    )
                    .trim()
                    .toLowerCase();


                if (
                    respuestasCorrectas.includes(
                        respuestaDada
                    )
                ) {

                    puntosObtenidos +=
                        Number(pregunta.puntaje || 0);

                }

            }


            // ==================================================
            // CALCULAR NOTA
            // ==================================================

            let nota = 0;

            if (puntosTotales > 0) {

                nota =
                    (
                        puntosObtenidos /
                        puntosTotales
                    ) * 100;

            }


            nota =
                Number(nota.toFixed(2));


            const aprobado =
                nota >=
                Number(
                    evaluacion.porcentaje_aprobacion
                )
                    ? 1
                    : 0;


            // ==================================================
            // ACTUALIZAR INTENTO
            // ==================================================

            await connection.query(
                `
                UPDATE evaluaciones_usuario
                SET
                    puntaje = ?,
                    aprobado = ?
                WHERE id = ?
                `,
                [
                    nota,
                    aprobado,
                    evaluacionUsuarioId
                ]
            );


            await connection.commit();


            res.json({

                success: true,

                evaluacion_usuario_id:
                    evaluacionUsuarioId,

                intento:
                    numeroIntento,

                nota,

                aprobado: aprobado === 1,

                mensaje:
                    aprobado
                        ? "Evaluación aprobada."
                        : "Evaluación no aprobada."

            });


        } catch (error) {

            await connection.rollback();

            console.error(
                "ERROR PRESENTANDO EVALUACIÓN:",
                error
            );

            res.status(500).json({

                success: false,

                mensaje: error.message

            });

        } finally {

            connection.release();

        }

    }
);


module.exports = router;