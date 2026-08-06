const express = require("express");
const router = express.Router();

const db = require("../DB");
const { proteger } = require("../middlewares/auth");

router.get(
    "/api/evaluaciones-induccion",
    proteger,
    async (req, res) => {

        try {

            const [evaluaciones] = await db.query(

                `
                SELECT

    e.id,

    e.capitulo_id,

    c.titulo AS capitulo,

    e.nombre,

    e.descripcion,

    e.porcentaje_aprobacion,

    e.estado,

    e.fecha_creacion,

    COUNT(p.id) AS preguntas

FROM evaluaciones_induccion e

INNER JOIN capitulos_induccion c

    ON c.id=e.capitulo_id

LEFT JOIN preguntas_induccion p

    ON p.evaluacion_id=e.id

    AND p.activo=1

GROUP BY

    e.id,

    e.capitulo_id,

    c.titulo,

    e.nombre,

    e.descripcion,

    e.porcentaje_aprobacion,

    e.estado,

    e.fecha_creacion

ORDER BY

    c.orden,

    e.id
                `

            );

            res.json({

                success: true,
                evaluaciones

            });

        } catch (error) {

            console.error(error);

            res.status(500).json({

                success: false,
                mensaje: error.message

            });

        }

    }
);

router.post(
    "/api/evaluaciones-induccion",
    proteger,
    async (req, res) => {

        const conexion = await db.getConnection();

        try {

            await conexion.beginTransaction();

            const {

                capitulo_id,
                nombre,
                descripcion,
                porcentaje_aprobacion,
                preguntas

            } = req.body;

            if (!capitulo_id || !nombre) {

                await conexion.rollback();

                return res.json({

                    success: false,
                    mensaje: "Faltan datos."

                });

            }

            const [resultado] = await conexion.query(

                `
                INSERT INTO evaluaciones_induccion
                (

                    capitulo_id,
                    nombre,
                    descripcion,
                    porcentaje_aprobacion,
                    estado,
                    fecha_creacion

                )

                VALUES
                (

                    ?,?,?,?,'ACTIVA',NOW()

                )
                `,

                [

                    capitulo_id,
                    nombre,
                    descripcion,
                    porcentaje_aprobacion || 70

                ]

            );

            const evaluacion_id = resultado.insertId;

            for (const pregunta of preguntas) {

                await conexion.query(

                    `
                    INSERT INTO preguntas_induccion
                    (

                        capitulo_id,
                        evaluacion_id,
                        pregunta,
                        opcion_a,
                        opcion_b,
                        opcion_c,
                        opcion_d,
                        respuesta_correcta,
                        puntos,
                        orden

                    )

                    VALUES
                    (

                        ?,?,?,?,?,?,?,?,?,?

                    )
                    `,

                    [

                        capitulo_id,
                        evaluacion_id,
                        pregunta.pregunta,
                        pregunta.opcion_a,
                        pregunta.opcion_b,
                        pregunta.opcion_c,
                        pregunta.opcion_d,
                        pregunta.respuesta_correcta,
                        pregunta.puntos,
                        pregunta.orden

                    ]

                );

            }

            await conexion.commit();

            res.json({

                success: true,
                id: evaluacion_id

            });

        } catch (error) {

            await conexion.rollback();

            console.error(error);

            res.status(500).json({

                success: false,
                mensaje: error.message

            });

        } finally {

            conexion.release();

        }

    }
);

router.get(
    "/api/evaluaciones-induccion/:id",
    proteger,
    async (req, res) => {

        try {

            const { id } = req.params;

            const [[evaluacion]] = await db.query(

                `
                SELECT *
                FROM evaluaciones_induccion
                WHERE id=?
                LIMIT 1
                `,

                [id]

            );

            const [preguntas] = await db.query(

                `
                SELECT *

                FROM preguntas_induccion

                WHERE evaluacion_id=?

                ORDER BY orden
                `,

                [id]

            );

            res.json({

                success: true,

                evaluacion,

                preguntas

            });

        } catch (error) {

            console.error(error);

            res.status(500).json({

                success: false,
                mensaje: error.message

            });

        }

    }
);
router.put(
    "/api/evaluaciones-induccion/:id",
    proteger,
    async (req, res) => {

        const conexion = await db.getConnection();

        try {

            await conexion.beginTransaction();

            const { id } = req.params;

            const {

                capitulo_id,
                nombre,
                descripcion,
                porcentaje_aprobacion,
                preguntas

            } = req.body;

            await conexion.query(

                `
                UPDATE evaluaciones_induccion

                SET

                    capitulo_id=?,
                    nombre=?,
                    descripcion=?,
                    porcentaje_aprobacion=?

                WHERE id=?
                `,

                [

                    capitulo_id,
                    nombre,
                    descripcion,
                    porcentaje_aprobacion,
                    id

                ]

            );

            await conexion.query(

                `
                DELETE FROM preguntas_induccion
                WHERE evaluacion_id=?
                `,

                [id]

            );

            for(const pregunta of preguntas){

                await conexion.query(

                    `
                    INSERT INTO preguntas_induccion
                    (

                        capitulo_id,
                        evaluacion_id,
                        pregunta,
                        opcion_a,
                        opcion_b,
                        opcion_c,
                        opcion_d,
                        respuesta_correcta,
                        puntos,
                        orden

                    )

                    VALUES
                    (

                        ?,?,?,?,?,?,?,?,?,?

                    )
                    `,

                    [

                        capitulo_id,
                        id,
                        pregunta.pregunta,
                        pregunta.opcion_a,
                        pregunta.opcion_b,
                        pregunta.opcion_c,
                        pregunta.opcion_d,
                        pregunta.respuesta_correcta,
                        pregunta.puntos,
                        pregunta.orden

                    ]

                );

            }

            await conexion.commit();

            res.json({

                success:true

            });

        }catch(error){

            await conexion.rollback();

            console.error(error);

            res.status(500).json({

                success:false,

                mensaje:error.message

            });

        }finally{

            conexion.release();

        }

    }
);

router.delete(
    "/api/evaluaciones-induccion/:id",
    proteger,
    async (req, res) => {

        try {

            const { id } = req.params;

            await db.query(

    `
    DELETE FROM preguntas_induccion
    WHERE evaluacion_id=?
    `,

    [id]

);

await db.query(

    `
    DELETE FROM evaluaciones_induccion
    WHERE id=?
    `,

    [id]

);

            res.json({

                success: true

            });

        } catch (error) {

            console.error(error);

            res.status(500).json({

                success: false,
                mensaje: error.message

            });

        }

    }
);
module.exports = router;