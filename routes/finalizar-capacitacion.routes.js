const express = require("express");
const router = express.Router();

const db = require("../DB");
const { proteger } = require("../middlewares/auth");


// ==========================================================
// FINALIZAR CAPACITACIÓN
// ==========================================================

router.post(
    "/api/capacitaciones/:cursoId/finalizar",
    proteger,
    async (req, res) => {

        const connection = await db.getConnection();

        try {

            await connection.beginTransaction();

            const cursoId = Number(req.params.cursoId);
            const usuarioId = req.session.usuarioID;


            // ==================================================
            // 1. OBTENER EMPLEADO DEL USUARIO
            // ==================================================

            const [usuario] = await connection.query(
                `
                SELECT
                    id,
                    empleado_id
                FROM usuarios
                WHERE id = ?
                LIMIT 1
                `,
                [usuarioId]
            );

            if (usuario.length === 0) {

                await connection.rollback();

                return res.status(404).json({
                    success: false,
                    mensaje: "No se encontró el usuario."
                });

            }

            const empleadoId = usuario[0].empleado_id;


            // ==================================================
            // 2. BUSCAR CAPACITACIÓN
            // ==================================================

            const [curso] = await connection.query(
                `
                SELECT
                    id,
                    nombre,
                    descripcion
                FROM capacitaciones
                WHERE id = ?
                LIMIT 1
                `,
                [cursoId]
            );

            if (curso.length === 0) {

                await connection.rollback();

                return res.status(404).json({
                    success: false,
                    mensaje: "La capacitación no existe."
                });

            }


            // ==================================================
            // 3. BUSCAR ASIGNACIÓN DEL EMPLEADO
            // ==================================================

            const [asignacion] = await connection.query(
                `
                SELECT
                    id,
                    capacitacion_id,
                    empleado_id,
                    estado
                FROM asignaciones_capacitaciones
                WHERE capacitacion_id = ?
                AND empleado_id = ?
                LIMIT 1
                `,
                [
                    cursoId,
                    empleadoId
                ]
            );

            if (asignacion.length === 0) {

                await connection.rollback();

                return res.status(403).json({
                    success: false,
                    mensaje:
                        "Esta capacitación no está asignada al usuario."
                });

            }

            const asignacionId =
                asignacion[0].id;


            // ==================================================
            // 4. OBTENER PROGRESO
            // ==================================================

            const [progreso] =
                await connection.query(
                    `
                    SELECT
                        id,
                        porcentaje,
                        capitulos_completados,
                        total_capitulos,
                        nota_final,
                        aprobado
                    FROM progreso_capacitaciones
                    WHERE asignacion_id = ?
                    LIMIT 1
                    `,
                    [asignacionId]
                );


            // ==================================================
            // 5. VERIFICAR QUE TERMINÓ TODOS LOS CAPÍTULOS
            // ==================================================

            if (
                progreso.length === 0 ||
                Number(progreso[0].porcentaje) < 100 ||
                Number(progreso[0].capitulos_completados) <
                Number(progreso[0].total_capitulos)
            ) {

                await connection.rollback();

                return res.status(400).json({
                    success: false,
                    mensaje:
                        "Aún no has completado todos los capítulos de la capacitación."
                });

            }


            // ==================================================
            // 6. BUSCAR EVALUACIONES DEL CURSO
            // ==================================================

            const [evaluaciones] =
                await connection.query(
                    `
                    SELECT
                        id,
                        capitulo_id,
                        titulo,
                        porcentaje_aprobacion,
                        intentos,
                        orden
                    FROM evaluaciones_curso
                    WHERE curso_id = ?
                    AND activo = 1
                    ORDER BY orden ASC, id ASC
                    `,
                    [cursoId]
                );


            // ==================================================
            // 7. COMPROBAR EVALUACIONES
            // ==================================================

            let evaluacionPendiente = null;
            let notaFinal = null;


            if (evaluaciones.length > 0) {

                for (const evaluacion of evaluaciones) {

                    const [resultado] =
                        await connection.query(
                            `
                            SELECT
                                id,
                                intento,
                                puntaje,
                                aprobado,
                                fecha_presentacion
                            FROM evaluaciones_usuario
                            WHERE usuario_id = ?
                            AND evaluacion_id = ?
                            ORDER BY
                                fecha_presentacion DESC,
                                id DESC
                            LIMIT 1
                            `,
                            [
                                usuarioId,
                                evaluacion.id
                            ]
                        );


                    // ==========================================
                    // EVALUACIÓN APROBADA
                    // ==========================================

                    if (
                        resultado.length > 0 &&
                        Number(resultado[0].aprobado) === 1
                    ) {

                        notaFinal =
                            Number(resultado[0].puntaje);

                    }

                    // ==========================================
                    // EVALUACIÓN PENDIENTE
                    // ==========================================

                    else {

                        evaluacionPendiente =
                            evaluacion;

                        break;

                    }

                }

            }


            // ==================================================
            // 8. SI FALTA EVALUACIÓN → ENVIAR A EVALUACIÓN
            // ==================================================

            if (evaluacionPendiente) {

                await connection.rollback();

                return res.json({

                    success: true,

                    requiereEvaluacion: true,

                    evaluacion: {

                        id:
                            evaluacionPendiente.id,

                        capitulo_id:
                            evaluacionPendiente.capitulo_id,

                        titulo:
                            evaluacionPendiente.titulo,

                        porcentaje_aprobacion:
                            evaluacionPendiente.porcentaje_aprobacion

                    }

                });

            }


            // ==================================================
            // 9. SI NO HAY EVALUACIÓN
            //    TOMAR NOTA DEL PROGRESO
            // ==================================================

            if (
                evaluaciones.length === 0
            ) {

                notaFinal =
                    Number(progreso[0].nota_final || 0);

            }


            // ==================================================
            // 10. CONSULTAR CONFIGURACIÓN DEL CERTIFICADO
            // ==================================================

            const [configuracionCertificado] =
                await connection.query(
                    `
                    SELECT
                        *
                    FROM certificados_curso
                    WHERE curso_id = ?
                    AND activo = 1
                    LIMIT 1
                    `,
                    [cursoId]
                );


            const certificadoConfig =
                configuracionCertificado.length > 0
                    ? configuracionCertificado[0]
                    : null;


            // ==================================================
            // 11. GENERAR CÓDIGO ÚNICO
            // ==================================================

            const codigo =
                "CERT-" +
                cursoId +
                "-" +
                usuarioId +
                "-" +
                Date.now();


            // ==================================================
            // 12. GUARDAR CERTIFICADO
            // ==================================================

            await connection.query(
                `
                INSERT INTO certificados_usuario
                (
                    usuario_id,
                    nota_final,
                    fecha_emision,
                    codigo_certificado
                )
                VALUES
                (?, ?, NOW(), ?)
                `,
                [
                    usuarioId,
                    notaFinal || 0,
                    codigo
                ]
            );


            // ==================================================
            // 13. ACTUALIZAR PROGRESO
            // ==================================================

            await connection.query(
                `
                UPDATE progreso_capacitaciones
                SET
                    porcentaje = 100,
                    nota_final = ?,
                    aprobado = 1,
                    fecha_finalizacion = NOW(),
                    ultima_actividad = NOW()
                WHERE id = ?
                `,
                [
                    notaFinal || 0,
                    progreso[0].id
                ]
            );


            // ==================================================
            // 14. ACTUALIZAR ASIGNACIÓN
            // ==========================================================

            await connection.query(
                `
                UPDATE asignaciones_capacitaciones
                SET
                    estado = 'FINALIZADA'
                WHERE id = ?
                `,
                [asignacionId]
            );


            // ==================================================
            // 15. CONFIRMAR
            // ==================================================

            await connection.commit();


            // ==================================================
            // 16. RESPUESTA
            // ==================================================

            res.json({

                success: true,

                requiereEvaluacion: false,

                certificado: {

                    codigo: codigo,

                    curso_id: cursoId,

                    nombre_capacitacion:
                        curso[0].nombre,

                    nota_final:
                        notaFinal || 0,

                    fecha_emision:
                        new Date(),

                    configuracion:
                        certificadoConfig

                }

            });


        } catch (error) {

            await connection.rollback();

            console.error(
                "🔥 ERROR FINALIZANDO CAPACITACIÓN:",
                error
            );

            res.status(500).json({

                success: false,

                mensaje:
                    "Error finalizando la capacitación.",

                error:
                    error.message

            });

        } finally {

            connection.release();

        }

    }
);


module.exports = router;