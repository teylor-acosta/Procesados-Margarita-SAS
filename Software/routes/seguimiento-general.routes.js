const express = require("express");
const router = express.Router();

const db = require("../DB");

const { proteger } = require("../middlewares/auth");

/* =====================================================
   EMPLEADOS
===================================================== */

router.get(
    "/api/seguimiento-general/empleados",
    proteger,
    async (req, res) => {

        try {

            const [empleados] = await db.query(`
    SELECT

        e.id,

        e.codigo,

        e.nombre,

        c.nombre AS cargo,

        a.nombre AS area,

        s.nombre AS sede

    FROM empleados e

    LEFT JOIN cargos c
        ON c.id = e.cargo_id

    LEFT JOIN areas a
        ON a.id = e.area_id

    LEFT JOIN sedes s
        ON s.id = e.sede_id

    WHERE e.activo='SI'

    ORDER BY e.nombre
`);

            res.json({

                success:true,

                empleados

            });

        } catch(error){

            console.log(error);

            res.status(500).json({

                success:false,

                message:error.message

            });

        }

    }
);

/* =====================================================
   RESUMEN GENERAL
===================================================== */

router.get(
    "/api/seguimiento-general/resumen",
    proteger,
    async (req, res) => {

        try {

            const [[empleados]] = await db.query(`
                SELECT COUNT(*) AS total
                FROM empleados
                WHERE activo='SI'
            `);

            const [[asignaciones]] = await db.query(`
                SELECT COUNT(*) AS total
                FROM asignaciones_capacitaciones
            `);

            const [[proceso]] = await db.query(`
                SELECT COUNT(*) AS total
                FROM asignaciones_capacitaciones
                WHERE estado='EN_PROCESO'
            `);

            const [[finalizadas]] = await db.query(`
                SELECT COUNT(*) AS total
                FROM asignaciones_capacitaciones
                WHERE estado='FINALIZADA'
            `);

            res.json({

                success: true,

                resumen: {

                    empleados: empleados.total,

                    asignaciones: asignaciones.total,

                    proceso: proceso.total,

                    finalizadas: finalizadas.total

                }

            });

        } catch (error) {

            console.log(error);

            res.status(500).json({

                success: false,

                message: error.message

            });

        }

    }
);

/* =====================================================
   DETALLE DEL EMPLEADO
===================================================== */

router.get(
    "/api/seguimiento-general/empleado/:id",
    proteger,
    async (req, res) => {

        try {

            const { id } = req.params;

            /* ==========================
               DATOS DEL EMPLEADO
            ========================== */

            const [[empleado]] = await db.query(`
                SELECT

                    e.id,
                    e.codigo,
                    e.nombre,

                    c.nombre AS cargo,
                    a.nombre AS area,
                    s.nombre AS sede

                FROM empleados e

                LEFT JOIN cargos c
                    ON c.id = e.cargo_id

                LEFT JOIN areas a
                    ON a.id = e.area_id

                LEFT JOIN sedes s
                    ON s.id = e.sede_id

                WHERE e.id = ?
            `,[id]);

            /* ==========================
               INDUCCIÓN
            ========================== */

            const [[induccion]] = await db.query(`
                SELECT

                    nota,

                    aprobado,

                    fecha_evaluacion,

                    intentos

                FROM resultados_evaluaciones

                WHERE usuario_id = (

                    SELECT id
                    FROM usuarios
                    WHERE empleado_id = ?

                )

                ORDER BY fecha_evaluacion DESC

                LIMIT 1
            `,[id]);

            /* ==========================
               CAPACITACIONES
            ========================== */

            const [capacitaciones] = await db.query(`
    SELECT

        ac.id,

        c.id AS capacitacion_id,

        c.nombre,

        c.descripcion,

        c.obligatorio,

        ac.estado,

        ac.fecha_asignacion,

        ac.fecha_limite

    FROM asignaciones_capacitaciones ac

    INNER JOIN capacitaciones c

        ON c.id = ac.capacitacion_id

    WHERE ac.empleado_id = ?

    ORDER BY ac.fecha_asignacion DESC
`, [id]);

            res.json({

                success:true,

                empleado,

                induccion,

                capacitaciones

            });

        } catch(error){

            console.log(error);

            res.status(500).json({

                success:false,

                message:error.message

            });

        }

    }
);

/* =====================================================
   CAPACITACIONES DEL EMPLEADO
===================================================== */

router.get(
    "/api/seguimiento-general/capacitaciones/:id",
    proteger,
    async (req, res) => {

        try {

            const { id } = req.params;

            // =========================================
            // RESUMEN
            // =========================================

            const [[resumen]] = await db.query(`

                SELECT

                    COUNT(*) AS asignadas,

                    SUM(
                        estado='EN_PROCESO'
                    ) AS proceso,

                    SUM(
                        estado='FINALIZADA'
                    ) AS finalizadas

                FROM asignaciones_capacitaciones

                WHERE empleado_id = ?

            `, [id]);

            // =========================================
            // LISTADO
            // =========================================

            const [capacitaciones] = await db.query(`

                SELECT

                    ac.id,

                    c.id AS capacitacion_id,

                    c.nombre,

                    c.descripcion,

                    ac.estado,

                    ac.fecha_asignacion,

                    ac.fecha_limite,

                    ac.obligatorio,

                    IFNULL(cp.progreso,0) AS progreso,

                    IFNULL(cp.capitulos_completados,0) AS capitulos_completados,

                    IFNULL(cp.capitulos_totales,0) AS capitulos_totales

                FROM asignaciones_capacitaciones ac

                INNER JOIN capacitaciones c

                    ON c.id = ac.capacitacion_id

                LEFT JOIN progreso_capacitaciones cp

                    ON cp.asignacion_id = ac.id

                WHERE ac.empleado_id = ?

                ORDER BY ac.fecha_asignacion DESC

            `, [id]);

            res.json({

                success: true,

                resumen: {

                    asignadas: resumen.asignadas || 0,

                    proceso: resumen.proceso || 0,

                    finalizadas: resumen.finalizadas || 0,

                    certificados: 0

                },

                capacitaciones

            });

        } catch (error) {

            console.log(error);

            res.status(500).json({

                success: false,

                message: error.message

            });

        }

    }
);

module.exports = router;