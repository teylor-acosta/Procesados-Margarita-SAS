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

// =====================================================
// CAPACITACIONES DISPONIBLES PARA ASIGNACIÓN
// =====================================================

router.get(
    "/api/seguimiento-general/capacitaciones",
    proteger,
    async (req, res) => {

        try {

            const [capacitaciones] = await db.query(`
                SELECT
                    id,
                    nombre,
                    descripcion,
                    obligatorio,
                    fecha_limite
                FROM capacitaciones
                WHERE estado = 'ACTIVO'
                ORDER BY nombre ASC
            `);

            res.json({
                success: true,
                capacitaciones
            });

        } catch (error) {

            console.error(
                "ERROR OBTENIENDO CAPACITACIONES:",
                error
            );

            res.status(500).json({
                success: false,
                capacitaciones: [],
                message: error.message
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
    WHERE estado <> 'ANULADA'
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
   CERTIFICADOS
========================== */

const [[certificados]] = await db.query(`
    SELECT COUNT(*) AS total
    FROM certificados_capacitacion cc
    INNER JOIN usuarios u
        ON u.id = cc.usuario_id
    WHERE u.empleado_id = ?
`, [id]);

            /* ==========================
   CAPACITACIONES / CURSOS
========================== */

const [capacitaciones] = await db.query(`
    SELECT
        ac.id,
        c.id AS capacitacion_id,
        c.titulo AS nombre,
        c.descripcion,
        c.obligatorio,

        ac.estado,
        ac.fecha_asignacion,
        ac.fecha_limite,

        /* Total de capítulos */
        (
            SELECT COUNT(*)
            FROM capitulos_curso cc
            WHERE cc.curso_id = c.id
        ) AS capitulos_totales,

        /* Total de videos */
        (
            SELECT COUNT(*)
            FROM sub_capitulos_curso sc
            INNER JOIN capitulos_curso cc
                ON cc.id = sc.capitulo_id
            WHERE cc.curso_id = c.id
        ) AS videos_totales

    FROM asignaciones_capacitaciones ac

    INNER JOIN cursos c
        ON c.id = ac.capacitacion_id

    WHERE ac.empleado_id = ?

    ORDER BY ac.fecha_asignacion DESC
`, [id]);

            res.json({

    success: true,

    empleado,

    induccion,

    certificados: Number(certificados.total || 0),

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

        SUM(
            estado IN ('PENDIENTE', 'EN_PROCESO')
        ) AS asignadas,

        SUM(
            estado = 'EN_PROCESO'
        ) AS proceso,

        SUM(
            estado = 'FINALIZADA'
        ) AS finalizadas

    FROM asignaciones_capacitaciones

    WHERE empleado_id = ?

`, [id]);

// =========================================
// CERTIFICADOS DE CAPACITACIÓN
// =========================================

const [[certificados]] = await db.query(
    `
    SELECT COUNT(*) AS total
    FROM certificados_capacitacion cc
    INNER JOIN usuarios u
        ON u.id = cc.usuario_id
    WHERE u.empleado_id = ?
    `,
    [id]
);


            // =========================================
            // LISTADO
            // =========================================

           const [capacitaciones] = await db.query(`

    SELECT

    ac.id,

    c.id AS capacitacion_id,

    c.titulo AS nombre,

    c.descripcion,

    c.obligatorio,

    ac.estado,

    ac.fecha_asignacion,

    ac.fecha_limite,

    cp.fecha_finalizacion,

    IFNULL(cp.porcentaje, 0) AS progreso,

    IFNULL(cp.capitulos_completados, 0) AS capitulos_completados,

    (
        SELECT COUNT(*)
        FROM capitulos_curso cc
        WHERE cc.curso_id = c.id
    ) AS capitulos_totales

FROM asignaciones_capacitaciones ac

INNER JOIN cursos c
    ON c.id = ac.capacitacion_id

LEFT JOIN progreso_capacitaciones cp
    ON cp.asignacion_id = ac.id

WHERE ac.empleado_id = ?

ORDER BY ac.fecha_asignacion DESC

`, [id]);

            // =========================================
            // RESPUESTA
            // =========================================

            res.json({

                success: true,

                resumen: {

                    asignadas: resumen.asignadas || 0,

                    proceso: resumen.proceso || 0,

                    finalizadas: resumen.finalizadas || 0,

                    certificados: certificados.total || 0

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

/* =====================================================
   ASIGNAR CAPACITACIÓN
===================================================== */

router.post(
    "/api/seguimiento-general/asignar-capacitacion",
    proteger,
    async (req, res) => {

        const connection = await db.getConnection();

        try {

            const {
    capacitacion_id,
    capacitacion_ids,
    empleados
} = req.body;
            // =========================================
// CAPACITACIONES SELECCIONADAS
// =========================================

const capacitacionesIds =
    Array.isArray(capacitacion_ids)
        ? capacitacion_ids
        : capacitacion_id
            ? [capacitacion_id]
            : [];

if (capacitacionesIds.length === 0) {
    return res.status(400).json({
        success: false,
        message: "Debe seleccionar al menos una capacitación."
    });
}

            if (
                !Array.isArray(empleados) ||
                empleados.length === 0
            ) {

                return res.status(400).json({

                    success: false,

                    message: "Debe seleccionar al menos un empleado."

                });

            }


            // =========================================
// VERIFICAR CAPACITACIONES
// =========================================

const [capacitaciones] =
    await connection.query(`
        SELECT
            id,
            titulo AS nombre,
            obligatorio,
            fecha_limite
        FROM cursos
        WHERE id IN (?)
          AND estado = 'ACTIVO'
    `, [capacitacionesIds]);

if (
    capacitaciones.length !==
    capacitacionesIds.length
) {
    return res.status(404).json({
        success: false,
        message:
            "Una o más capacitaciones no existen o están inactivas."
    });
}


            // =========================================
            // USUARIO QUE REALIZA LA ASIGNACIÓN
            // =========================================

            const asignadoPor =
                req.session.usuarioID;


            // =========================================
            // INICIAR TRANSACCIÓN
            // =========================================

            await connection.beginTransaction();


            let asignados = 0;
            let existentes = 0;


            // =========================================
// PROCESAR CAPACITACIONES
// =========================================

for (const capacitacion of capacitaciones) {

    // =========================================
    // PROCESAR EMPLEADOS
    // =========================================

    for (const empleadoId of empleados) {

        // -------------------------------------
        // VERIFICAR EMPLEADO
        // -------------------------------------

        const [[empleado]] =
            await connection.query(`
                SELECT id
                FROM empleados
                WHERE id = ?
                  AND activo = 'SI'
            `, [empleadoId]);

        if (!empleado) {
            continue;
        }

        // -------------------------------------
        // VERIFICAR SI YA ESTÁ ASIGNADA
        // -------------------------------------

        // -------------------------------------
// VERIFICAR SI YA ESTÁ ASIGNADA
// -------------------------------------

const [[existente]] =
    await connection.query(`
        SELECT
            id,
            estado
        FROM asignaciones_capacitaciones
        WHERE capacitacion_id = ?
          AND empleado_id = ?
        LIMIT 1
    `, [
        capacitacion.id,
        empleadoId
    ]);


// -------------------------------------
// SI YA EXISTE UNA ASIGNACIÓN
// -------------------------------------

if (existente) {

    // =====================================
    // SI ESTABA ANULADA → REACTIVARLA
    // =====================================

    if (existente.estado === "ANULADA") {

        await connection.query(`
            UPDATE asignaciones_capacitaciones
            SET
                estado = 'PENDIENTE',
                asignado_por = ?,
                fecha_asignacion = NOW(),
                obligatorio = ?,
                fecha_limite = ?
            WHERE id = ?
        `, [
            asignadoPor,
            capacitacion.obligatorio ? 1 : 0,
            capacitacion.fecha_limite || null,
            existente.id
        ]);

        asignados++;

        continue;
    }


    // =====================================
    // SI YA ESTÁ ACTIVA O FINALIZADA
    // NO CREAR OTRA
    // =====================================

    existentes++;

    continue;
}

        // -------------------------------------
        // CREAR ASIGNACIÓN
        // -------------------------------------

        await connection.query(`
            INSERT INTO asignaciones_capacitaciones (
                capacitacion_id,
                empleado_id,
                asignado_por,
                fecha_asignacion,
                estado,
                obligatorio,
                fecha_limite
            )
            VALUES (
                ?,
                ?,
                ?,
                NOW(),
                'PENDIENTE',
                ?,
                ?
            )
        `, [
            capacitacion.id,
            empleadoId,
            asignadoPor,
            capacitacion.obligatorio ? 1 : 0,
            capacitacion.fecha_limite || null
        ]);

        asignados++;
    }
}

            // =========================================
            // CONFIRMAR
            // =========================================

            await connection.commit();


            res.json({

                success: true,

                message:
                    "Proceso de asignación completado.",

                resultados: {

                    asignados,

                    existentes

                }

            });


        } catch (error) {

            await connection.rollback();

            console.error(
                "ERROR ASIGNANDO CAPACITACIÓN:",
                error
            );

            res.status(500).json({

                success: false,

                message: error.message

            });


        } finally {

            connection.release();

        }

    }
);

/* =====================================================
   ANULAR ASIGNACIÓN DE CAPACITACIÓN
===================================================== */

router.patch(
    "/api/seguimiento-general/anular-asignacion/:id",
    proteger,
    async (req, res) => {

        try {

            const { id } = req.params;

            // =========================================
            // BUSCAR LA ASIGNACIÓN
            // =========================================

            const [[asignacion]] = await db.query(`
                SELECT
                    id,
                    empleado_id,
                    capacitacion_id,
                    estado
                FROM asignaciones_capacitaciones
                WHERE id = ?
                LIMIT 1
            `, [id]);

            if (!asignacion) {

                return res.status(404).json({
                    success: false,
                    message: "La asignación no existe."
                });

            }

            // =========================================
            // NO ANULAR UNA CAPACITACIÓN FINALIZADA
            // =========================================

            if (asignacion.estado === "FINALIZADA") {

                return res.status(400).json({
                    success: false,
                    message:
                        "No se puede anular una capacitación que ya fue finalizada."
                });

            }

            // =========================================
            // VERIFICAR SI YA ESTÁ ANULADA
            // =========================================

            if (asignacion.estado === "ANULADA") {

                return res.status(400).json({
                    success: false,
                    message:
                        "Esta asignación ya se encuentra anulada."
                });

            }

            // =========================================
            // ANULAR ASIGNACIÓN
            // =========================================

            await db.query(`
                UPDATE asignaciones_capacitaciones
                SET estado = 'ANULADA'
                WHERE id = ?
            `, [id]);

            // =========================================
            // RESPUESTA
            // =========================================

            res.json({
                success: true,
                message:
                    "La asignación fue anulada correctamente."
            });

        } catch (error) {

            console.error(
                "ERROR ANULANDO ASIGNACIÓN:",
                error
            );

            res.status(500).json({
                success: false,
                message: error.message
            });

        }

    }
);

module.exports = router;