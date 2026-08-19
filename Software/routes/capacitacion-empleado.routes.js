const express = require("express");

const router = express.Router();

const { proteger } = require("../middlewares/auth");

const db = require("../DB");

// ==============================================
// OBTENER UNA CAPACITACIÓN DEL EMPLEADO
// ==============================================

router.get(
    "/api/mi-capacitacion/:asignacionID",
    proteger,
    async (req, res) => {

        try {

            const empleadoID = req.session.empleadoID;

            const { asignacionID } = req.params;

            // ==========================================
            // VALIDAR ASIGNACIÓN
            // ==========================================

            const [asignaciones] = await db.query(`

                SELECT

                    ca.id AS curso_asignado_id,

                    ca.curso_id,

                    ca.estado,

                    ca.progreso,

                    ca.fecha_asignacion,

                    ca.fecha_inicio,

                    ca.fecha_final,

                    c.nombre,

                    c.descripcion,

                    c.imagen,

                    c.obligatorio,

                    c.intensidad_horaria

                FROM curso_asignados ca

                INNER JOIN cursos c
                    ON c.id = ca.curso_id

                WHERE ca.id = ?

                AND ca.empleado_id = ?

                LIMIT 1

            `, [

                asignacionID,

                empleadoID

            ]);


            // ==========================================
            // NO EXISTE
            // ==========================================

            if (asignaciones.length === 0) {

                return res.status(404).json({

                    success: false,

                    message:
                        "La capacitación no está asignada a este empleado."

                });

            }


            const curso = asignaciones[0];


            // ==========================================
            // CAPÍTULOS
            // ==========================================

            const [capitulos] = await db.query(`

                SELECT

                    id,

                    curso_id,

                    numero_capitulo,

                    titulo,

                    descripcion,

                    orden,

                    porcentaje_aprobacion

                FROM capitulos_curso

                WHERE curso_id = ?

                AND activo = 1

                ORDER BY orden ASC, id ASC

            `, [

                curso.curso_id

            ]);


            // ==========================================
            // SUBCAPÍTULOS
            // ==========================================

            for (const capitulo of capitulos) {

                const [subcapitulos] = await db.query(`

                    SELECT

                        id,

                        capitulo_id,

                        numero_subcapitulo,

                        titulo,

                        descripcion,

                        duracion_minutos,

                        tipo_video,

                        url_video,

                        orden

                    FROM sub_capitulos_curso

                    WHERE capitulo_id = ?

                    AND activo = 1

                    ORDER BY orden ASC, id ASC

                `, [

                    capitulo.id

                ]);


                capitulo.subcapitulos = subcapitulos;


                // ======================================
                // MATERIAL DE APOYO
                // ======================================

                const [materiales] = await db.query(`

                    SELECT

                        id,

                        titulo,

                        descripcion,

                        tipo_asignacion,

                        capitulo_id,

                        sub_capitulo_id,

                        nombre_archivo,

                        ruta_archivo,

                        tipo_archivo,

                        tamano,

                        orden,

                        obligatorio

                    FROM material_apoyo_curso

                    WHERE curso_id = ?

                    AND activo = 1

                    AND (

                        capitulo_id = ?

                        OR (

                            tipo_asignacion = 'CAPITULO'

                            AND capitulo_id = ?

                        )

                    )

                    ORDER BY orden ASC, id ASC

                `, [

                    curso.curso_id,

                    capitulo.id,

                    capitulo.id

                ]);


                capitulo.materiales = materiales;

            }


            // ==========================================
            // PROGRESO
            // ==========================================

            const [progreso] = await db.query(`

                SELECT

                    porcentaje,

                    capitulos_completados,

                    total_capitulos,

                    ultimo_capitulo,

                    nota_final,

                    aprobado,

                    fecha_inicio,

                    fecha_finalizacion,

                    ultima_actividad

                FROM progreso_capacitaciones

                WHERE asignacion_id = ?

                LIMIT 1

            `, [

                asignacionID

            ]);


            // ==========================================
            // RESPUESTA
            // ==========================================

            res.json({

                success: true,

                curso,

                progreso:

                    progreso.length > 0

                        ? progreso[0]

                        : null,

                capitulos

            });


        }

        catch (error) {

            console.error(
                "ERROR OBTENIENDO CAPACITACIÓN:",
                error
            );

            res.status(500).json({

                success: false,

                message:
                    "Error obteniendo la capacitación."

            });

        }

    }
);


module.exports = router;