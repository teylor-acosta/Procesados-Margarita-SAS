const express = require("express");
const router = express.Router();

const db = require("../DB");
const { proteger } = require("../middlewares/auth");

// ==========================================
// LISTAR EVALUACIONES
// ==========================================

router.get(
    "/api/cursos/:curso/evaluaciones",
    proteger,
    async (req, res) => {

        try{

            const { curso } = req.params;

            const [evaluaciones] =
            await db.query(

                `
                SELECT
                    *
                FROM evaluaciones_curso
                WHERE

                    curso_id = ?

                    AND activo = 1

                ORDER BY

                    orden ASC,

                    id ASC
                `,

                [curso]

            );

            res.json({

                success:true,

                evaluaciones

            });

        }catch(error){

            console.error(error);

            res.status(500).json({

                success:false,

                mensaje:
                "Error obteniendo las evaluaciones."

            });

        }

    }
);

// ==========================================
// CREAR EVALUACIÓN
// ==========================================

router.post(
    "/api/cursos/:curso/evaluaciones",
    proteger,
    async (req, res) => {

        try {

            const { curso } = req.params;

            const {
    capitulo_id,
    titulo,
    descripcion,
    porcentaje_aprobacion,
    intentos,
    orden
} = req.body;

            await db.query(
                `
                INSERT INTO evaluaciones_curso
(
    curso_id,
    capitulo_id,
    titulo,
    descripcion,
    porcentaje_aprobacion,
    intentos,
    orden,
    usuario_creador
)
VALUES
(?, ?, ?, ?, ?, ?, ?, ?)
                `,
                [
    curso,
    capitulo_id,
    titulo,
    descripcion,
    porcentaje_aprobacion,
    intentos,
    orden,
    req.session.usuarioID
]
            );

            res.json({
                success: true,
                mensaje: "Evaluación creada correctamente."
            });

        } catch (error) {

            console.error(error);

            res.status(500).json({
                success: false,
                mensaje: "Error al crear la evaluación."
            });

        }

    }
);

// ==========================================
// OBTENER EVALUACIÓN DE UNA CAPACITACIÓN
// ==========================================

router.get(
    "/api/cursos/:curso/evaluacion",
    proteger,
    async (req, res) => {

        try {

            const { curso } = req.params;

            // Buscar la evaluación activa del curso
            const [evaluaciones] = await db.query(
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
                WHERE curso_id = ?
                AND activo = 1
                ORDER BY orden ASC, id ASC
                LIMIT 1
                `,
                [curso]
            );

            // La capacitación no tiene evaluación
            if (!evaluaciones.length) {

                return res.json({
                    success: true,
                    tieneEvaluacion: false
                });

            }

            const evaluacion = evaluaciones[0];

            // ==========================================
            // OBTENER PREGUNTAS
            // ==========================================

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
                ORDER BY orden ASC, id ASC
                `,
                [evaluacion.id]
            );

            res.json({

                success: true,

                tieneEvaluacion: true,

                evaluacion,

                preguntas

            });

        } catch (error) {

            console.error(
                "ERROR OBTENIENDO EVALUACIÓN:",
                error
            );

            res.status(500).json({

                success: false,

                mensaje:
                    "Error obteniendo la evaluación."

            });

        }

    }
);

// ==========================================
// ELIMINAR EVALUACIÓN
// ==========================================

router.delete(
    "/api/evaluaciones/:id",
    proteger,
    async (req, res) => {

        const connection = await db.getConnection();

        try{

            await connection.beginTransaction();

            const { id } = req.params;

            // ==========================================
            // OBTENER PREGUNTAS
            // ==========================================

            const [preguntas] = await connection.query(

                `
                SELECT id
                FROM preguntas_curso
                WHERE evaluacion_id = ?
                `,

                [id]

            );

            // ==========================================
            // ELIMINAR RESPUESTAS
            // ==========================================

            for(const pregunta of preguntas){

                await connection.query(

                    `
                    DELETE FROM respuestas_curso
                    WHERE pregunta_id = ?
                    `,

                    [pregunta.id]

                );

            }

            // ==========================================
            // ELIMINAR PREGUNTAS
            // ==========================================

            await connection.query(

                `
                DELETE FROM preguntas_curso
                WHERE evaluacion_id = ?
                `,

                [id]

            );

            // ==========================================
            // ELIMINAR EVALUACIÓN
            // ==========================================

            await connection.query(

                `
                DELETE FROM evaluaciones_curso
                WHERE id = ?
                `,

                [id]

            );

            await connection.commit();

            res.json({

                success:true,

                mensaje:"Evaluación eliminada."

            });

        }catch(error){

            await connection.rollback();

            console.error(error);

            res.status(500).json({

                success:false,

                mensaje:error.message

            });

        }finally{

            connection.release();

        }

    }

);

// ==========================================
// PRESENTAR EVALUACIÓN
// ==========================================

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


            // ==========================================
            // OBTENER EVALUACIÓN
            // ==========================================

            const [evaluaciones] =
                await connection.query(
                    `
                    SELECT
                        id,
                        curso_id,
                        titulo,
                        porcentaje_aprobacion,
                        intentos
                    FROM evaluaciones_curso
                    WHERE id = ?
                    AND activo = 1
                    LIMIT 1
                    `,
                    [evaluacionId]
                );


            if (!evaluaciones.length) {

                throw new Error(
                    "La evaluación no existe."
                );

            }


            const evaluacion =
                evaluaciones[0];


            // ==========================================
            // OBTENER PREGUNTAS
            // ==========================================

            const [preguntas] =
                await connection.query(
                    `
                    SELECT
                        id,
                        pregunta,
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


            if (!preguntas.length) {

                throw new Error(
                    "La evaluación no tiene preguntas."
                );

            }


            // ==========================================
            // VALIDAR INTENTOS
            // ==========================================

            const [intentosRealizados] =
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


            const totalIntentos =
                Number(
                    intentosRealizados[0].total
                );


            if (
                evaluacion.intentos &&
                totalIntentos >= evaluacion.intentos
            ) {

                throw new Error(
                    "Has alcanzado el número máximo de intentos."
                );

            }


            // ==========================================
            // CALCULAR PUNTAJE
            // ==========================================

            let puntajeObtenido = 0;

            let puntajeTotal = 0;


            for (const pregunta of preguntas) {

                const puntajePregunta =
                    Number(
                        pregunta.puntaje || 0
                    );

                puntajeTotal +=
                    puntajePregunta;


                const respuestaUsuario =
                    respuestas?.[pregunta.id];


                // ==========================================
                // GUARDAR RESPUESTA
                // ==========================================

                let respuestaGuardar = null;


                if (
                    Array.isArray(
                        respuestaUsuario
                    )
                ) {

                    respuestaGuardar =
                        JSON.stringify(
                            respuestaUsuario
                        );

                } else {

                    respuestaGuardar =
                        respuestaUsuario ??
                        null;

                }


                // ==========================================
                // INSERTAR RESPUESTA
                // ==========================================

                // Primero crearemos la evaluación_usuario
                // más abajo y luego utilizaremos su ID.

            }


            // ==========================================
            // CALCULAR PORCENTAJE
            // ==========================================

            let porcentaje = 0;

            if (puntajeTotal > 0) {

                porcentaje =
                    (
                        puntajeObtenido /
                        puntajeTotal
                    ) * 100;

            }


            porcentaje =
                Number(
                    porcentaje.toFixed(2)
                );


            const aprobado =
                porcentaje >=
                Number(
                    evaluacion.porcentaje_aprobacion || 0
                )
                    ? 1
                    : 0;


            // ==========================================
            // GUARDAR RESULTADO
            // ==========================================

            const [resultadoEvaluacion] =
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
                    VALUES
                    (?, ?, ?, ?, ?, NOW())
                    `,
                    [
                        usuarioId,
                        evaluacionId,
                        totalIntentos + 1,
                        porcentaje,
                        aprobado
                    ]
                );


            const evaluacionUsuarioId =
                resultadoEvaluacion.insertId;


            // ==========================================
            // GUARDAR RESPUESTAS
            // ==========================================

            for (const pregunta of preguntas) {

                const respuestaUsuario =
                    respuestas?.[pregunta.id];


                let respuestaGuardar;


                if (
                    Array.isArray(
                        respuestaUsuario
                    )
                ) {

                    respuestaGuardar =
                        JSON.stringify(
                            respuestaUsuario
                        );

                } else {

                    respuestaGuardar =
                        respuestaUsuario ??
                        null;

                }


                await connection.query(
                    `
                    INSERT INTO respuestas_evaluacion_curso
                    (
                        evaluacion_usuario_id,
                        pregunta_id,
                        respuesta
                    )
                    VALUES
                    (?, ?, ?)
                    `,
                    [
                        evaluacionUsuarioId,
                        pregunta.id,
                        respuestaGuardar
                    ]
                );

            }


            await connection.commit();


            // ==========================================
            // RESPUESTA
            // ==========================================

            res.json({

                success: true,

                evaluacionUsuarioId,

                puntaje: porcentaje,

                aprobado: aprobado === 1,

                intento:
                    totalIntentos + 1,

                cursoId:
                    evaluacion.curso_id

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