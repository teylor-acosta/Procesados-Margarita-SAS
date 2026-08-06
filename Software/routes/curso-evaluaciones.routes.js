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

module.exports = router;