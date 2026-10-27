const express = require("express");
const router = express.Router();

const db = require("../DB");
const { proteger } = require("../middlewares/auth");


// ==========================================================
// OBTENER INFORMACIÓN DE UNA EVALUACIÓN
// ==========================================================

router.get(
    "/api/evaluaciones-capacitacion/:evaluacionId",
    proteger,
    async (req, res) => {

        try {

            const { evaluacionId } = req.params;

            const [evaluaciones] = await db.query(

                `
                SELECT
                    e.id,
                    e.curso_id,
                    e.capitulo_id,
                    e.titulo,
                    e.descripcion,
                    e.porcentaje_aprobacion,
                    e.intentos,
                    e.activo,
                    c.nombre AS curso_nombre

                FROM evaluaciones_curso e

                INNER JOIN capacitaciones c
                    ON c.id = e.curso_id

                WHERE e.id = ?
                AND e.activo = 1

                LIMIT 1
                `,

                [evaluacionId]

            );


            if (evaluaciones.length === 0) {

                return res.status(404).json({

                    success: false,

                    mensaje:
                        "No se encontró la evaluación."

                });

            }


            res.json({

                success: true,

                evaluacion: evaluaciones[0]

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


// ==========================================================
// GUARDAR Y CALIFICAR EVALUACIÓN
// ==========================================================

router.post(
    "/api/evaluaciones-capacitacion/:evaluacionId/responder",
    proteger,
    async (req, res) => {

        const connection =
            await db.getConnection();


        try {

            await connection.beginTransaction();


            const {
                evaluacionId
            } = req.params;


            const {
                respuestas
            } = req.body;


            const usuarioId =
                req.session.usuarioID;


            // ==================================================
            // VALIDACIONES
            // ==================================================

            if (!usuarioId) {

                throw new Error(
                    "No se encontró el usuario de la sesión."
                );

            }


            if (
                !Array.isArray(respuestas)
            ) {

                throw new Error(
                    "Las respuestas no tienen un formato válido."
                );

            }


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
                        intentos,
                        activo

                    FROM evaluaciones_curso

                    WHERE id = ?

                    LIMIT 1
                    `,

                    [evaluacionId]

                );


            if (
                evaluaciones.length === 0
            ) {

                throw new Error(
                    "La evaluación no existe."
                );

            }


            const evaluacion =
                evaluaciones[0];


            if (
                Number(evaluacion.activo) !== 1
            ) {

                throw new Error(
                    "La evaluación no está activa."
                );

            }


            // ==================================================
            // VERIFICAR INTENTOS
            // ==================================================

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


            const maxIntentos =
                Number(
                    evaluacion.intentos || 0
                );


            if (
                maxIntentos > 0 &&
                totalIntentos >= maxIntentos
            ) {

                throw new Error(
                    "Has alcanzado el número máximo de intentos permitidos."
                );

            }


            // ==================================================
            // OBTENER PREGUNTAS
            // ==================================================

            const [preguntas] =
                await connection.query(

                    `
                    SELECT
                        id,
                        tipo,
                        puntaje,
                        obligatoria

                    FROM preguntas_curso

                    WHERE evaluacion_id = ?
                    AND activo = 1

                    ORDER BY orden ASC, id ASC
                    `,

                    [evaluacionId]

                );


            if (
                preguntas.length === 0
            ) {

                throw new Error(
                    "La evaluación no tiene preguntas configuradas."
                );

            }


            // ==================================================
            // CREAR MAPA DE RESPUESTAS DEL USUARIO
            // ==================================================

            const respuestasMapa =
                new Map();


            for (
                const respuesta
                of respuestas
            ) {

                if (
                    respuesta &&
                    respuesta.pregunta_id
                ) {

                    respuestasMapa.set(

                        Number(
                            respuesta.pregunta_id
                        ),

                        respuesta.respuesta

                    );

                }

            }


            // ==================================================
            // VALIDAR PREGUNTAS OBLIGATORIAS
            // ==================================================

            for (
                const pregunta
                of preguntas
            ) {

                if (
                    Number(
                        pregunta.obligatoria
                    ) === 1
                ) {

                    const respuesta =
                        respuestasMapa.get(
                            Number(pregunta.id)
                        );


                    if (
                        respuesta === undefined ||
                        respuesta === null ||
                        String(respuesta).trim() === ""
                    ) {

                        throw new Error(

                            `Debes responder la pregunta ${pregunta.id}.`

                        );

                    }

                }

            }


            // ==================================================
            // OBTENER RESPUESTAS CORRECTAS
            // ==================================================

            const preguntaIds =
                preguntas.map(
                    pregunta =>
                        pregunta.id
                );


            let opcionesCorrectas = [];


            if (
                preguntaIds.length > 0
            ) {

                const placeholders =
                    preguntaIds
                        .map(() => "?")
                        .join(",");


                const [correctas] =
                    await connection.query(

                        `
                        SELECT
                            pregunta_id,
                            respuesta,
                            fila,
                            columna,
                            correcta

                        FROM respuestas_curso

                        WHERE pregunta_id IN (${placeholders})
                        `,

                        preguntaIds

                    );


                opcionesCorrectas =
                    correctas;

            }


            // ==================================================
            // CALCULAR PUNTAJE
            // ==========================================================

            let puntosObtenidos = 0;

            let puntosTotales = 0;


            for (
                const pregunta
                of preguntas
            ) {

                const puntaje =
                    Number(
                        pregunta.puntaje || 0
                    );


                puntosTotales +=
                    puntaje;


                const respuestaUsuario =
                    respuestasMapa.get(
                        Number(pregunta.id)
                    );


                if (
                    respuestaUsuario === undefined ||
                    respuestaUsuario === null
                ) {

                    continue;

                }


                const opcionesPregunta =
                    opcionesCorrectas.filter(

                        opcion =>
                            Number(
                                opcion.pregunta_id
                            ) ===
                            Number(
                                pregunta.id
                            )

                    );


                if (
                    respuestaEsCorrecta(

                        pregunta,

                        respuestaUsuario,

                        opcionesPregunta

                    )
                ) {

                    puntosObtenidos +=
                        puntaje;

                }

            }


            // ==================================================
            // CALCULAR NOTA SOBRE 100
            // ==================================================

            let nota = 0;


            if (
                puntosTotales > 0
            ) {

                nota =
                    (
                        puntosObtenidos /
                        puntosTotales
                    ) * 100;

            }


            nota =
                Number(
                    nota.toFixed(2)
                );


            // ==================================================
            // DETERMINAR APROBACIÓN
            // ==================================================

            const porcentajeAprobacion =
                Number(
                    evaluacion.porcentaje_aprobacion || 0
                );


            const aprobado =
                nota >= porcentajeAprobacion
                    ? 1
                    : 0;


            // ==================================================
            // NÚMERO DEL INTENTO
            // ==================================================

            const intento =
                totalIntentos + 1;


            // ==================================================
            // GUARDAR EVALUACIÓN DEL USUARIO
            // ==================================================

            const [resultado] =
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
                        intento,
                        nota,
                        aprobado
                    ]

                );


            const evaluacionUsuarioId =
                resultado.insertId;


            // ==================================================
            // GUARDAR RESPUESTAS
            // ==================================================

            for (
                const respuesta
                of respuestas
            ) {

                if (
                    !respuesta ||
                    !respuesta.pregunta_id
                ) {

                    continue;

                }


                await connection.query(

                    `
                    INSERT INTO respuestas_evaluacion_curso
                    (
                        evaluacion_usuario_id,
                        pregunta_id,
                        respuesta,
                        fecha_respuesta
                    )

                    VALUES
                    (?, ?, ?, NOW())
                    `,

                    [
                        evaluacionUsuarioId,

                        respuesta.pregunta_id,

                        convertirRespuesta(
                            respuesta.respuesta
                        )

                    ]

                );

            }


            // ==================================================
            // ACTUALIZAR PROGRESO
            // ==================================================

            await actualizarProgreso(

                connection,

                usuarioId,

                evaluacion.curso_id,

                nota,

                aprobado

            );


            await connection.commit();


            // ==================================================
            // RESPUESTA
            // ==================================================

            res.json({

                success: true,

                aprobado:
                    Boolean(aprobado),

                nota,

                porcentaje_aprobacion:
                    porcentajeAprobacion,

                intento,

                evaluacion_usuario_id:
                    evaluacionUsuarioId,

                curso_id:
                    evaluacion.curso_id

            });


        } catch (error) {

            await connection.rollback();


            console.error(
                "ERROR RESPONDIENDO EVALUACIÓN:",
                error
            );


            res.status(400).json({

                success: false,

                mensaje:
                    error.message

            });


        } finally {

            connection.release();

        }

    }

);


// ==========================================================
// COMPARAR RESPUESTA
// ==========================================================

function respuestaEsCorrecta(

    pregunta,

    respuestaUsuario,

    opciones

) {

    // ======================================================
    // OPCIONES MÚLTIPLES / DESPLEGABLE
    // ======================================================

    if (

        pregunta.tipo ===
            "VARIAS_OPCIONES" ||

        pregunta.tipo ===
            "DESPLEGABLE"

    ) {

        const indice =
            Number(
                respuestaUsuario
            );


        const opcion =
            opciones[indice];


        if (!opcion) {

            return false;

        }


        return Number(
            opcion.correcta
        ) === 1;

    }


    // ======================================================
    // CASILLAS
    // ======================================================

    if (
        pregunta.tipo ===
        "CASILLAS"
    ) {

        let respuestasUsuario;


        try {

            respuestasUsuario =
                Array.isArray(
                    respuestaUsuario
                )

                    ? respuestaUsuario

                    : JSON.parse(
                        respuestaUsuario
                    );

        } catch {

            return false;

        }


        const correctas =
            opciones

                .map(
                    (opcion, index) =>
                        Number(
                            opcion.correcta
                        ) === 1
                            ? index
                            : null
                )

                .filter(
                    index =>
                        index !== null
                );


        const usuario =
            respuestasUsuario
                .map(
                    valor =>
                        Number(valor)
                )
                .sort(
                    (a, b) =>
                        a - b
                );


        const esperadas =
            correctas.sort(
                (a, b) =>
                    a - b
            );


        return (
            JSON.stringify(usuario) ===
            JSON.stringify(esperadas)
        );

    }


    // ======================================================
    // RESTO DE TIPOS
    // ======================================================

    return false;

}


// ==========================================================
// CONVERTIR RESPUESTA PARA BD
// ==========================================================

function convertirRespuesta(
    respuesta
) {

    if (
        respuesta === undefined ||
        respuesta === null
    ) {

        return null;

    }


    if (
        typeof respuesta === "object"
    ) {

        return JSON.stringify(
            respuesta
        );

    }


    return String(
        respuesta
    );

}


// ==========================================================
// ACTUALIZAR PROGRESO
// ==========================================================

async function actualizarProgreso(

    connection,

    usuarioId,

    cursoId,

    nota,

    aprobado

) {

    // ======================================================
    // BUSCAR ASIGNACIÓN
    // ======================================================

    const [asignaciones] =
        await connection.query(

            `
            SELECT a.id AS asignacion_id
            FROM asignaciones_capacitaciones a

            INNER JOIN empleados e
                ON e.id = a.empleado_id

            INNER JOIN usuarios u
                ON u.empleado_id = e.id

            WHERE a.capacitacion_id = ?
            AND u.id = ?

            LIMIT 1
            `,

            [
                cursoId,
                usuarioId
            ]

        );


    // ======================================================
    // VERIFICAR ASIGNACIÓN
    // ======================================================

    if (
        asignaciones.length === 0
    ) {

        console.warn(
            "No se encontró asignación para actualizar progreso."
        );

        return;

    }


    // ======================================================
    // OBTENER ID DE LA ASIGNACIÓN
    // ======================================================

    const asignacionId =
        asignaciones[0].asignacion_id;


    // ======================================================
    // ACTUALIZAR PROGRESO
    // ======================================================

    await connection.query(

        `
        UPDATE progreso_capacitaciones

        SET
            nota_final = ?,
            aprobado = ?,
            ultima_actividad = NOW()

        WHERE asignacion_id = ?
        `,

        [
            nota,
            aprobado,
            asignacionId
        ]

    );


    // ======================================================
    // IMPORTANTE
    // ======================================================
    // Aprobar una evaluación NO finaliza toda
    // la capacitación.
    //
    // La capacitación solamente se marcará como
    // FINALIZADA cuando el usuario complete el
    // último capítulo.
    // ======================================================

    console.log(
        "EVALUACIÓN PROCESADA. " +
        "La capacitación todavía no se finaliza."
    );

}

// ==========================================================
// VERIFICAR SI EL USUARIO YA APROBÓ UNA EVALUACIÓN
// ==========================================================

router.get(
    "/api/evaluaciones-capacitacion/:evaluacionId/aprobada",
    proteger,
    async (req, res) => {

        try {

            const evaluacionId =
                Number(req.params.evaluacionId);

            const usuarioId =
                req.session.usuarioID;


            // ==================================================
            // BUSCAR SI YA EXISTE UNA EVALUACIÓN APROBADA
            // ==================================================

            const [resultados] =
                await db.query(

                    `
                    SELECT
                        id,
                        puntaje,
                        aprobado,
                        fecha_presentacion

                    FROM evaluaciones_usuario

                    WHERE usuario_id = ?
                    AND evaluacion_id = ?
                    AND aprobado = 1

                    ORDER BY fecha_presentacion DESC

                    LIMIT 1
                    `,

                    [
                        usuarioId,
                        evaluacionId
                    ]

                );


            // ==================================================
            // NO APROBADA
            // ==================================================

            if (
                resultados.length === 0
            ) {

                return res.json({

                    success: true,

                    aprobada: false,

                    resultado: null

                });

            }


            // ==================================================
            // YA APROBADA
            // ==================================================

            res.json({

                success: true,

                aprobada: true,

                resultado:
                    resultados[0]

            });

        }
        catch(error) {

            console.error(
                "ERROR VERIFICANDO EVALUACIÓN:",
                error
            );

            res.status(500).json({

                success: false,

                mensaje:
                    "Error verificando la evaluación."

            });

        }

    }
);

module.exports = router;