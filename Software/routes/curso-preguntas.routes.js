const express = require("express");
const router = express.Router();

const db = require("../DB");
const { proteger } = require("../middlewares/auth");


// ==========================================
// OBTENER PREGUNTAS DE UNA EVALUACIÓN
// ==========================================

router.get(
    "/api/evaluaciones/:evaluacionId/preguntas",
    proteger,
    async (req, res) => {

        try{

            const { evaluacionId } = req.params;

            const [preguntas] = await db.query(

                `
                SELECT *
                FROM preguntas_curso
                WHERE evaluacion_id = ?
                ORDER BY orden
                `,

                [evaluacionId]

            );

            for(const pregunta of preguntas){

                const [respuestas] = await db.query(

    `
    SELECT *
    FROM respuestas_curso
    WHERE pregunta_id = ?
    ORDER BY orden
    `,

    [pregunta.id]

);

// ==========================================
// PREGUNTAS NORMALES
// ==========================================

if(
    pregunta.tipo !== "CUADRICULA_OPCIONES" &&
    pregunta.tipo !== "CUADRICULA_CASILLAS"
){

    pregunta.opciones = respuestas.map(respuesta => ({

        texto: respuesta.respuesta,

        correcta: respuesta.correcta == 1

    }));

}

// ==========================================
// CUADRÍCULAS
// ==========================================

else{

    pregunta.opciones = [];

    pregunta.filas = [
        ...new Set(
            respuestas.map(r => r.fila)
        )
    ];

    pregunta.columnas = [
        ...new Set(
            respuestas.map(r => r.columna)
        )
    ];

}

            }

            const preguntasFormateadas = preguntas.map(p => ({

    id: p.id,

    pregunta: p.pregunta,

    descripcion: "",

    tipo: p.tipo,

    puntaje: p.puntaje,

    orden: p.orden,

    obligatoria: p.obligatoria == 1,

    configuracionAbierta: true,

    opciones: p.opciones,

    filas: p.filas || [],

    columnas: p.columnas || []

}));

res.json({

    success: true,

    preguntas: preguntasFormateadas

});
        }catch(error){

            console.error(error);

            res.status(500).json({

                success:false,

                mensaje:error.message

            });

        }

    }

);

// ==========================================
// GUARDAR PREGUNTAS DE UNA EVALUACIÓN
// ==========================================

router.post(
    "/api/evaluaciones/:evaluacionId/preguntas",
    proteger,
    async (req, res) => {

        const connection = await db.getConnection();

        try{

            await connection.beginTransaction();

            const { evaluacionId } = req.params;

            const { preguntas } = req.body;
            // ==========================================
// PREGUNTAS EXISTENTES EN LA BASE DE DATOS
// ==========================================

const [preguntasBD] = await connection.query(

    `
    SELECT id
    FROM preguntas_curso
    WHERE evaluacion_id = ?
    `,

    [evaluacionId]

);

const idsFrontend = preguntas
    .filter(p => p.id)
    .map(p => Number(p.id));

const preguntasEliminadas = preguntasBD.filter(

    p => !idsFrontend.includes(p.id)

);

// ==========================================
// ELIMINAR PREGUNTAS BORRADAS
// ==========================================

for (const pregunta of preguntasEliminadas) {

    await connection.query(

        `
        DELETE FROM respuestas_curso
        WHERE pregunta_id = ?
        `,

        [pregunta.id]

    );

}

for (const pregunta of preguntasEliminadas) {

    await connection.query(

        `
        DELETE FROM preguntas_curso
        WHERE id = ?
        `,

        [pregunta.id]

    );

}

            for (let i = 0; i < preguntas.length; i++) {

    const pregunta = preguntas[i];

    let preguntaId;

if (pregunta.id) {

    await connection.query(

        `
        UPDATE preguntas_curso
        SET
            pregunta = ?,
            orden = ?,
            tipo = ?,
            puntaje = ?,
            obligatoria = ?
        WHERE id = ?
        `,

        [
            pregunta.pregunta,
            i + 1,
            pregunta.tipo,
            pregunta.puntaje,
            pregunta.obligatoria ? 1 : 0,
            pregunta.id
        ]

    );

    preguntaId = pregunta.id;

} else {

    const [resultado] = await connection.query(

        `
        INSERT INTO preguntas_curso
        (
            evaluacion_id,
            pregunta,
            orden,
            tipo,
            puntaje,
            obligatoria
        )
        VALUES
        (?, ?, ?, ?, ?, ?)
        `,

        [
            evaluacionId,
            pregunta.pregunta,
            i + 1,
            pregunta.tipo,
            pregunta.puntaje,
            pregunta.obligatoria ? 1 : 0
        ]

    );

    preguntaId = resultado.insertId;

}

if (pregunta.id) {

    await connection.query(

        `
        DELETE FROM respuestas_curso
        WHERE pregunta_id = ?
        `,

        [preguntaId]

    );

}

    // ==========================================
// GUARDAR OPCIONES NORMALES
// ==========================================

if (
    pregunta.tipo !== "CUADRICULA_OPCIONES" &&
    pregunta.tipo !== "CUADRICULA_CASILLAS"
) {

    if (pregunta.opciones && pregunta.opciones.length > 0) {

        for (let j = 0; j < pregunta.opciones.length; j++) {

            const opcion = pregunta.opciones[j];

            await connection.query(

                `
                INSERT INTO respuestas_curso
                (
                    pregunta_id,
                    respuesta,
                    orden,
                    correcta
                )
                VALUES
                (?, ?, ?, ?)
                `,

                [
                    preguntaId,
                    opcion.texto,
                    j + 1,
                    opcion.correcta ? 1 : 0
                ]

            );

        }

    }

}

// ==========================================
// GUARDAR CUADRÍCULAS
// ==========================================

else {

    let orden = 1;

    for (const fila of pregunta.filas) {

        for (const columna of pregunta.columnas) {

            await connection.query(

                `
                INSERT INTO respuestas_curso
                (
                    pregunta_id,
                    fila,
                    columna,
                    orden,
                    correcta
                )
                VALUES
                (?, ?, ?, ?, ?)
                `,

                [
                    preguntaId,
                    fila,
                    columna,
                    orden++,
                    0
                ]

            );

        }

    }

}

}

            await connection.commit();

            res.json({

                success:true,

                mensaje:"Datos recibidos correctamente."

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

module.exports = router;