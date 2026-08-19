const express = require("express");

const router = express.Router();

const { proteger } = require("../middlewares/auth");

// ==============================================
// OBTENER MIS CAPACITACIONES
// ==============================================

router.get("/api/mis-capacitaciones", proteger, async (req, res) => {

    try {

        const db = req.app.get("db");

        const empleadoID = req.session.empleadoID;

console.log("=================================");
console.log("MIS CAPACITACIONES");
console.log("SESSION:", req.session);
console.log("EMPLEADO ID:", empleadoID);
console.log("=================================");
        const sql = `

    SELECT

        ac.id,
        ac.estado,
        ac.fecha_asignacion,
        ac.fecha_limite,

        c.id AS capacitacion_id,
        c.titulo AS nombre,
        c.descripcion,
        c.imagen,
        c.obligatorio,

        ca.id AS curso_asignado_id,
        ca.estado AS estado_curso,
        ca.progreso AS progreso_curso,
        ca.fecha_inicio AS curso_fecha_inicio,
        ca.fecha_final AS curso_fecha_final,

        -- ==========================================
        -- CERTIFICADO
        -- ==========================================

        cert.id AS certificado_id,
        cert.codigo_certificado,
        cert.nota_final AS nota_certificado,
        cert.fecha_emision AS certificado_fecha_emision,
        cert.fecha_vencimiento AS certificado_fecha_vencimiento

    FROM asignaciones_capacitaciones ac

    INNER JOIN cursos c
        ON c.id = ac.capacitacion_id

    LEFT JOIN curso_asignados ca
        ON ca.id = (
            SELECT ca2.id
            FROM curso_asignados ca2
            WHERE ca2.curso_id = ac.capacitacion_id
            AND ca2.empleado_id = ac.empleado_id
            ORDER BY ca2.id DESC
            LIMIT 1
        )

    LEFT JOIN certificados_usuario cert
        ON cert.usuario_id = (
            SELECT u.id
            FROM usuarios u
            WHERE u.empleado_id = ac.empleado_id
            LIMIT 1
        )
        AND cert.curso_id = c.id

    WHERE ac.empleado_id = ?

    ORDER BY ac.fecha_asignacion DESC

`;

        const [rows] = await db.query(sql, [empleadoID]);

        res.json({

            success: true,

            capacitaciones: rows

        });

    }

    catch(error){

        console.error(error);

        res.status(500).json({

            success:false,

            message:"Error obteniendo capacitaciones."

        });

    }

});


// ==============================================
// INICIAR CAPACITACIÓN
// ==============================================

router.post("/api/iniciar-capacitacion", proteger, async (req, res) => {

    try {

        const db = req.app.get("db");

        const empleadoID = req.session.empleadoID;

        const { asignacionID } = req.body;


        // ==========================================
        // VALIDAR ASIGNACIÓN
        // ==========================================

        if (!asignacionID) {

            return res.status(400).json({

                success: false,

                message: "No se recibió la asignación."

            });

        }


        // ==========================================
        // BUSCAR ASIGNACIÓN
        // ==========================================

        const [asignaciones] = await db.query(`

            SELECT

                id,

                capacitacion_id,

                estado

            FROM asignaciones_capacitaciones

            WHERE id = ?

            AND empleado_id = ?

        `, [

            asignacionID,

            empleadoID

        ]);


        if (asignaciones.length === 0) {

            return res.status(404).json({

                success: false,

                message: "La capacitación no está asignada a este empleado."

            });

        }


        const asignacion = asignaciones[0];


        // ==========================================
        // COMPROBAR SI YA EXISTE CURSO ASIGNADO
        // ==========================================

        const [cursosAsignados] = await db.query(`

            SELECT

                id,

                estado,

                progreso,

                fecha_inicio

            FROM curso_asignados

            WHERE curso_id = ?

            AND empleado_id = ?

            ORDER BY id DESC

            LIMIT 1

        `, [

            asignacion.capacitacion_id,

            empleadoID

        ]);


        // ==========================================
        // SI YA EXISTE
        // ==========================================

        // ==========================================
// SI YA EXISTE
// ==========================================

if (cursosAsignados.length > 0) {

    const cursoAsignado = cursosAsignados[0];

    // ======================================
    // PASAR A EN PROCESO
    // ======================================

    if (cursoAsignado.estado === "SIN_INICIAR") {

        await db.query(`

            UPDATE curso_asignados

            SET

                estado = 'EN_PROCESO',

                fecha_inicio = NOW()

            WHERE id = ?

        `, [

            cursoAsignado.id

        ]);

    }


    // ======================================
    // ACTUALIZAR ASIGNACIÓN
    // ======================================

    if (asignacion.estado === "PENDIENTE") {

        await db.query(`

            UPDATE asignaciones_capacitaciones

            SET estado = 'EN_PROCESO'

            WHERE id = ?

            AND empleado_id = ?

        `, [

            asignacionID,

            empleadoID

        ]);

    }


    // ======================================
    // COMPROBAR SI YA EXISTE EL PROGRESO
    // ======================================

    const [progresoExistente] = await db.query(`

        SELECT id

        FROM progreso_capacitaciones

        WHERE asignacion_id = ?

        LIMIT 1

    `, [

        asignacionID

    ]);


    // ======================================
    // CREAR PROGRESO SI NO EXISTE
    // ======================================

    if (progresoExistente.length === 0) {

        await db.query(`

            INSERT INTO progreso_capacitaciones (

                asignacion_id,

                porcentaje,

                capitulos_completados,

                total_capitulos,

                ultimo_capitulo,

                nota_final,

                aprobado,

                fecha_inicio,

                ultima_actividad

            )

            SELECT

                ?,

                0,

                0,

                COUNT(*),

                NULL,

                NULL,

                0,

                NOW(),

                NOW()

            FROM capitulos_curso

            WHERE curso_id = ?

            AND activo = 1

        `, [

            asignacionID,

            asignacion.capacitacion_id

        ]);

    }


    // ======================================
    // RESPUESTA
    // ======================================

    return res.json({

        success: true,

        message: "Capacitación lista para continuar.",

        cursoAsignadoID: cursoAsignado.id,

        estado: "EN_PROCESO",

        progreso: cursoAsignado.progreso || 0

    });

}

        // ==========================================
        // CREAR CURSO ASIGNADO
        // ==========================================

        const [resultado] = await db.query(`

            INSERT INTO curso_asignados (

                curso_id,

                empleado_id,

                intento,

                estado,

                progreso,

                fecha_inicio

            )

            VALUES (?, ?, 1, 'EN_PROCESO', 0, NOW())

        `, [

            asignacion.capacitacion_id,

            empleadoID

        ]);


        const cursoAsignadoID = resultado.insertId;


        // ==========================================
        // ACTUALIZAR ASIGNACIÓN ORIGINAL
        // ==========================================

        await db.query(`

            UPDATE asignaciones_capacitaciones

            SET estado = 'EN_PROCESO'

            WHERE id = ?

            AND empleado_id = ?

        `, [

            asignacionID,

            empleadoID

        ]);

        console.log("=================================");
console.log("VERIFICACIÓN PROGRESO");
console.log("ASIGNACION ID:", asignacionID);
console.log("CURSO ID:", asignacion.capacitacion_id);
console.log("CURSO ASIGNADO ID:", cursoAsignadoID);
console.log("=================================");


        // ==========================================
        // CREAR PROGRESO INICIAL
        // ==========================================

        await db.query(`

            INSERT INTO progreso_capacitaciones (

                asignacion_id,

                porcentaje,

                capitulos_completados,

                total_capitulos,

                ultimo_capitulo,

                nota_final,

                aprobado,

                fecha_inicio,

                ultima_actividad

            )

            SELECT

                ?,

                0,

                0,

                COUNT(*),

                NULL,

                NULL,

                0,

                NOW(),

                NOW()

            FROM capitulos_curso

            WHERE curso_id = ?

            AND activo = 1

        `, [

            cursoAsignadoID,

            asignacion.capacitacion_id

        ]);


        // ==========================================
        // RESPUESTA
        // ==========================================

        res.json({

            success: true,

            message: "Capacitación iniciada correctamente.",

            cursoAsignadoID,

            estado: "EN_PROCESO",

            progreso: 0

        });

    }

    catch(error){

        console.error(

            "ERROR INICIANDO CAPACITACIÓN:",

            error

        );

        res.status(500).json({

            success: false,

            message: "Error al iniciar la capacitación."

        });

    }

});

// ==============================================
// OBTENER CONTENIDO DE UNA CAPACITACIÓN
// ==============================================

router.get(
    "/api/capacitacion/:asignacionID",
    proteger,
    async (req, res) => {

        try {

            const db = req.app.get("db");

            const empleadoID = req.session.empleadoID;
            const { asignacionID } = req.params;

            // ==========================================
            // 1. VERIFICAR ASIGNACIÓN
            // ==========================================

            const [asignaciones] = await db.query(`

                SELECT

                    ca.id,
                    ca.curso_id,
                    ca.empleado_id,
                    ca.estado,
                    ca.progreso,
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


            if (asignaciones.length === 0) {

                return res.status(404).json({

                    success: false,

                    message:
                        "La capacitación no está asignada a este empleado."

                });

            }


            const curso = asignaciones[0];


            // ==========================================
            // 2. OBTENER CAPÍTULOS
            // ==========================================

            const [capitulos] = await db.query(`

                SELECT

                    id,
                    curso_id,
                    numero_capitulo,
                    titulo,
                    descripcion,
                    orden,
                    activo,
                    porcentaje_aprobacion

                FROM capitulos_curso

                WHERE curso_id = ?

                AND activo = 1

                ORDER BY orden ASC, id ASC

            `, [
                curso.curso_id
            ]);


            // ==========================================
            // 3. RECORRER CAPÍTULOS
            // ==========================================

            for (const capitulo of capitulos) {


                // ======================================
                // SUBCAPÍTULOS
                // ======================================

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
                        orden,
                        activo

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
                        curso_id,
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

                        (
                            tipo_asignacion = 'CAPITULO'
                            AND capitulo_id = ?
                        )

                        OR

                        (
                            tipo_asignacion = 'SUBCAPITULO'
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


                // ======================================
                // EVALUACIONES DEL CAPÍTULO
                // ======================================

                const [evaluaciones] = await db.query(`

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

                    AND capitulo_id = ?

                    AND activo = 1

                    ORDER BY orden ASC, id ASC

                `, [
                    curso.curso_id,
                    capitulo.id
                ]);


                capitulo.evaluaciones = evaluaciones;

            }


            // ==========================================
            // RESPUESTA
            // ==========================================

            res.json({

                success: true,

                curso: curso,

                capitulos: capitulos

            });

        }

        catch(error) {

            console.error(
                "ERROR OBTENIENDO CAPACITACIÓN:",
                error
            );

            res.status(500).json({

                success: false,

                message:
                    "Error obteniendo el contenido de la capacitación."

            });

        }

    }
);

module.exports = router;