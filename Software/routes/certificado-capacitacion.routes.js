const express = require("express");
const router = express.Router();

const db = require("../DB");
const {
    proteger,
    soloAdmin,
    soloSuperAdmin
} = require("../middlewares/auth");
const path = require("path");
const fs = require("fs");
const multer = require("multer");

// ============================================
// CONFIGURACIÓN MULTER
// ============================================

const storage = multer.diskStorage({

    destination: (req, file, cb) => {

        const cursoId = req.params.cursoId;

        const carpeta = path.join(

            __dirname,
            "../public/uploads/certificados",
            `curso_${cursoId}`

        );

        if (!fs.existsSync(carpeta)) {

            fs.mkdirSync(carpeta, {
                recursive: true
            });

        }

        cb(null, carpeta);

    },

    filename: (req, file, cb) => {

        const extension = path.extname(file.originalname);

        cb(null, file.fieldname + extension);

    }

});

const upload = multer({
    storage
});

// ============================================
// OBTENER CONFIGURACIÓN
// ============================================

router.get(
    "/api/certificados/:cursoId",
    proteger,
    async (req, res) => {

        try {

            const [rows] = await db.query(

                `
                SELECT *
                FROM certificados_curso
                WHERE curso_id = ?
                LIMIT 1
                `,

                [req.params.cursoId]

            );

            if (rows.length === 0) {

                return res.json(null);

            }

            res.json(rows[0]);

        }

        catch (error) {

            console.error(error);

            res.status(500).json({

                mensaje: "Error obteniendo configuración"

            });

        }

    }

);

// ============================================
// GUARDAR CONFIGURACIÓN
// ============================================

router.post(
    "/api/certificados",
    proteger,
    async (req, res) => {

        try {

            const {

    curso_id,
    texto_certificado,
    mostrar_qr,
    mostrar_sello,
    configuracion

} = req.body;

            const [existe] = await db.query(

                `
                SELECT id
                FROM certificados_curso
                WHERE curso_id=?
                LIMIT 1
                `,

                [curso_id]

            );

            if (existe.length > 0) {

                await db.query(

                    `
                    UPDATE certificados_curso

SET

    texto_certificado=?,
    mostrar_qr=?,
    mostrar_sello=?,
    configuracion=?

WHERE curso_id=?
                    `,

                    [

    texto_certificado,
    mostrar_qr,
    mostrar_sello,
    configuracion,
    curso_id

]

                );

            }

            else {

                await db.query(

                    `
                    INSERT INTO certificados_curso(

    curso_id,
    texto_certificado,
    mostrar_qr,
    mostrar_sello,
    configuracion,
    activo,
    fecha_creacion

)

                    VALUES(?,?,?,?,?,1,NOW())
                    `,

                    [

    curso_id,
    texto_certificado,
    mostrar_qr,
    mostrar_sello,
    configuracion

]

                );

            }

            res.json({

                ok: true,
                mensaje: "Configuración guardada."

            });

        }

        catch (error) {

            console.error(error);

            res.status(500).json({

                ok: false,
                mensaje: "Error guardando configuración."

            });

        }

    }

);

// ============================================
// SUBIR ARCHIVOS DEL CERTIFICADO
// ============================================

router.post(

    "/api/certificados/upload/:cursoId",

    proteger,

    upload.fields([

        {

            name: "plantilla",
            maxCount: 1

        },

        {

            name: "firma_izquierda",
            maxCount: 1

        },

        {

            name: "firma_derecha",
            maxCount: 1

        },

        {

            name: "sello",
            maxCount: 1

        }

    ]),

    async (req, res) => {

        try {

            const cursoId = req.params.cursoId;

            const archivos = req.files;

            let plantilla = null;
            let firmaIzquierda = null;
            let firmaDerecha = null;
            let sello = null;

            if (archivos.plantilla) {

                plantilla =
                    `/uploads/certificados/curso_${cursoId}/${archivos.plantilla[0].filename}`;

            }

            if (archivos.firma_izquierda) {

                firmaIzquierda =
                    `/uploads/certificados/curso_${cursoId}/${archivos.firma_izquierda[0].filename}`;

            }

            if (archivos.firma_derecha) {

                firmaDerecha =
                    `/uploads/certificados/curso_${cursoId}/${archivos.firma_derecha[0].filename}`;

            }

            if (archivos.sello) {

                sello =
                    `/uploads/certificados/curso_${cursoId}/${archivos.sello[0].filename}`;

            }

            const [existe] = await db.query(

                `
                SELECT id
                FROM certificados_curso
                WHERE curso_id=?
                LIMIT 1
                `,

                [cursoId]

            );

            if (existe.length === 0) {

                await db.query(

                    `
                    INSERT INTO certificados_curso(

                        curso_id,
                        plantilla,
                        firma_izquierda,
                        firma_derecha,
                        sello,
                        activo,
                        fecha_creacion

                    )

                    VALUES(?,?,?,?,?,1,NOW())
                    `,

                    [

                        cursoId,
                        plantilla,
                        firmaIzquierda,
                        firmaDerecha,
                        sello

                    ]

                );

            }

            else {

                const campos = [];
                const valores = [];

                if (plantilla) {

                    campos.push("plantilla=?");
                    valores.push(plantilla);

                }

                if (firmaIzquierda) {

                    campos.push("firma_izquierda=?");
                    valores.push(firmaIzquierda);

                }

                if (firmaDerecha) {

                    campos.push("firma_derecha=?");
                    valores.push(firmaDerecha);

                }

                if (sello) {

                    campos.push("sello=?");
                    valores.push(sello);

                }

                if (campos.length > 0) {

                    valores.push(cursoId);

                    await db.query(

                        `
                        UPDATE certificados_curso

                        SET ${campos.join(",")}

                        WHERE curso_id=?
                        `,

                        valores

                    );

                }

            }

            res.json({

                ok: true,
                mensaje: "Archivos cargados correctamente."

            });

        }

        catch (error) {

            console.error(error);

            res.status(500).json({

                ok: false,
                mensaje: "Error subiendo archivos.",
                error: error.message

            });

        }

    }

);

// ==========================================================
// GENERAR CERTIFICADO DE UNA CAPACITACIÓN
// ==========================================================

router.post(
    "/api/capacitaciones/:capacitacionId/generar-certificado",
    proteger,
    async (req, res) => {

        try {

            const capacitacionId = req.params.capacitacionId;
            const usuarioId = req.session.usuarioID;

            // ==================================================
            // 1. OBTENER CAPACITACIÓN
            // ==================================================

            const [capacitaciones] = await db.query(
    `
    SELECT
    id,
    titulo AS nombre
FROM cursos
WHERE id = ?
LIMIT 1
    `,
    [capacitacionId]
);

            if (capacitaciones.length === 0) {

                return res.status(404).json({
                    success: false,
                    mensaje: "La capacitación no existe."
                });

            }

            const capacitacion = capacitaciones[0];


            // ==================================================
            // 2. VERIFICAR ASIGNACIÓN DEL USUARIO
            // ==================================================

            const [asignaciones] = await db.query(
                `
                SELECT
                    id,
                    estado
                FROM asignaciones_capacitaciones
                WHERE capacitacion_id = ?
                AND empleado_id = (
                    SELECT empleado_id
                    FROM usuarios
                    WHERE id = ?
                )
                LIMIT 1
                `,
                [
                    capacitacionId,
                    usuarioId
                ]
            );

            if (asignaciones.length === 0) {

                return res.status(403).json({
                    success: false,
                    mensaje: "No tienes esta capacitación asignada."
                });

            }

            const asignacion = asignaciones[0];


            // ==================================================
            // 3. VERIFICAR PROGRESO
            // ==================================================

            const [progresos] = await db.query(
                `
                SELECT
                    porcentaje,
                    capitulos_completados,
                    total_capitulos,
                    nota_final,
                    aprobado,
                    fecha_finalizacion
                FROM progreso_capacitaciones
                WHERE asignacion_id = ?
                LIMIT 1
                `,
                [asignacion.id]
            );

            if (progresos.length === 0) {

                return res.status(400).json({
                    success: false,
                    mensaje: "No existe progreso registrado para esta capacitación."
                });

            }

            const progreso = progresos[0];


            // ==================================================
            // 4. VERIFICAR QUE TERMINÓ LA CAPACITACIÓN
            // ==================================================

            if (
                Number(progreso.porcentaje) < 100 ||
                Number(progreso.capitulos_completados) <
                Number(progreso.total_capitulos)
            ) {

                return res.status(400).json({
                    success: false,
                    mensaje: "Debes completar toda la capacitación antes de generar el certificado."
                });

            }


            // ==================================================
            // 5. CONSULTAR EVALUACIONES DEL CURSO
            // ==================================================

            const [evaluaciones] = await db.query(
                `
                SELECT
                    id,
                    porcentaje_aprobacion
                FROM evaluaciones_curso
                WHERE curso_id = ?
                AND activo = 1
                ORDER BY orden ASC, id ASC
                `,
                [capacitacionId]
            );


            // ==================================================
            // 6. SI EXISTE EVALUACIÓN,
            //    OBTENER LA MEJOR NOTA APROBADA
            // ==================================================

            let notaFinal = Number(progreso.nota_final) || 0;

            if (evaluaciones.length > 0) {

                const idsEvaluaciones =
                    evaluaciones.map(e => e.id);

                const placeholders =
                    idsEvaluaciones.map(() => '?').join(',');

                const [resultados] = await db.query(
                    `
                    SELECT
                        MAX(puntaje) AS mejor_nota
                    FROM evaluaciones_usuario
                    WHERE usuario_id = ?
                    AND evaluacion_id IN (${placeholders})
                    AND aprobado = 1
                    `,
                    [
                        usuarioId,
                        ...idsEvaluaciones
                    ]
                );

                if (
                    resultados.length > 0 &&
                    resultados[0].mejor_nota !== null
                ) {

                    notaFinal =
                        Number(resultados[0].mejor_nota);

                }

            }


            // ==================================================
            // 7. CONSULTAR CONFIGURACIÓN DEL CERTIFICADO
            // ==================================================

            const [configuraciones] = await db.query(
                `
                SELECT *
                FROM certificados_curso
                WHERE curso_id = ?
                AND activo = 1
                LIMIT 1
                `,
                [capacitacionId]
            );

            if (configuraciones.length === 0) {

                return res.status(400).json({
                    success: false,
                    mensaje: "Esta capacitación no tiene configurado un certificado."
                });

            }

            const configuracion =
                configuraciones[0];


            // ==================================================
            // 8. GENERAR CÓDIGO ÚNICO
            // ==================================================

            const codigo =
                `CERT-CAP-${capacitacionId}-${usuarioId}-${Date.now()}`;


            // ==================================================
            // 9. REGISTRAR CERTIFICADO
            // ==================================================

            const [certificadoExistente] = await db.query(
                `
                SELECT id
                FROM certificados_usuario
                WHERE usuario_id = ?
                AND codigo_certificado LIKE ?
                LIMIT 1
                `,
                [
                    usuarioId,
                    `CERT-CAP-${capacitacionId}-${usuarioId}-%`
                ]
            );


            if (certificadoExistente.length > 0) {

                await db.query(
                    `
                    UPDATE certificados_usuario
                    SET
                        nota_final = ?,
                        fecha_emision = NOW(),
                        codigo_certificado = ?
                    WHERE id = ?
                    `,
                    [
                        notaFinal,
                        codigo,
                        certificadoExistente[0].id
                    ]
                );

            } else {

                await db.query(
    `
    INSERT INTO certificados_usuario
    (
        usuario_id,
        curso_id,
        nota_final,
        fecha_emision,
        codigo_certificado
    )
    VALUES
    (?, ?, ?, NOW(), ?)
    `,
    [
        usuarioId,
        capacitacionId,
        notaFinal,
        codigo
    ]
);

            }


            // ==================================================
            // 10. ACTUALIZAR PROGRESO
            // ==================================================

            await db.query(
                `
                UPDATE progreso_capacitaciones
                SET
                    nota_final = ?,
                    aprobado = 1,
                    fecha_finalizacion = NOW(),
                    ultima_actividad = NOW()
                WHERE asignacion_id = ?
                `,
                [
                    notaFinal,
                    asignacion.id
                ]
            );


            // ==================================================
            // 11. ACTUALIZAR ASIGNACIÓN
            // ==================================================

            await db.query(
                `
                UPDATE asignaciones_capacitaciones
                SET estado = 'FINALIZADA'
                WHERE id = ?
                `,
                [asignacion.id]
            );


            // ==================================================
            // 12. RESPUESTA
            // ==================================================

            res.json({

                success: true,

                mensaje:
                    "Capacitación finalizada correctamente.",

                certificado: {

                    codigo: codigo,

                    capacitacion:
                        capacitacion.nombre,

                    nota:
                        notaFinal,

                    fecha_emision:
                        new Date(),

                    mostrar_qr:
                        configuracion.mostrar_qr,

                    mostrar_sello:
                        configuracion.mostrar_sello,

                    plantilla:
                        configuracion.plantilla,

                    firma_izquierda:
                        configuracion.firma_izquierda,

                    firma_derecha:
                        configuracion.firma_derecha,

                    sello:
                        configuracion.sello,

                    texto:
                        configuracion.texto_certificado,

                    configuracion:
                        configuracion.configuracion

                }

            });

        } catch (error) {

            console.error(
                "🔥 ERROR GENERANDO CERTIFICADO:",
                error
            );

            res.status(500).json({

                success: false,

                mensaje:
                    "Error generando el certificado.",

                error:
                    error.message

            });

        }

    }
);


// ============================================
// 🎓 EMITIR CERTIFICADO DE CAPACITACIÓN
// ============================================

router.post(
    "/api/certificados-capacitacion/emitir",
    proteger,
    async (req, res) => {

        try {

            const usuario_id = req.session.usuarioID;
            const { curso_id } = req.body;

            // ============================================
            // VALIDAR CURSO
            // ============================================

            if (!curso_id) {

                return res.status(400).json({
                    success: false,
                    mensaje: "No se recibió el curso."
                });

            }

            // ============================================
            // OBTENER CAPACITACIÓN
            // ============================================

            const [capacitaciones] = await db.query(
                `
                SELECT
                    id,
                    nombre,
                    descripcion
                FROM capacitaciones
                WHERE id = ?
                LIMIT 1
                `,
                [curso_id]
            );

            if (capacitaciones.length === 0) {

                return res.status(404).json({
                    success: false,
                    mensaje: "No se encontró la capacitación."
                });

            }

            const capacitacion = capacitaciones[0];

            // ============================================
            // BUSCAR ASIGNACIÓN DEL USUARIO
            // ============================================

            const [asignaciones] = await db.query(
                `
                SELECT
                    id,
                    estado
                FROM asignaciones_capacitaciones
                WHERE capacitacion_id = ?
                AND empleado_id = (
                    SELECT empleado_id
                    FROM usuarios
                    WHERE id = ?
                )
                LIMIT 1
                `,
                [
                    curso_id,
                    usuario_id
                ]
            );

            if (asignaciones.length === 0) {

                return res.status(403).json({
                    success: false,
                    mensaje: "La capacitación no está asignada a este usuario."
                });

            }

            const asignacion = asignaciones[0];

            // ============================================
            // OBTENER PROGRESO
            // ============================================

            const [progreso] = await db.query(
                `
                SELECT
                    porcentaje,
                    capitulos_completados,
                    total_capitulos,
                    nota_final,
                    aprobado,
                    fecha_finalizacion
                FROM progreso_capacitaciones
                WHERE asignacion_id = ?
                LIMIT 1
                `,
                [asignacion.id]
            );

            if (progreso.length === 0) {

                return res.status(400).json({
                    success: false,
                    mensaje: "La capacitación todavía no registra progreso."
                });

            }

            const progresoUsuario = progreso[0];

            // ============================================
            // VERIFICAR QUE TERMINÓ LA CAPACITACIÓN
            // ============================================

            if (
                Number(progresoUsuario.porcentaje) < 100 ||
                Number(progresoUsuario.capitulos_completados) <
                Number(progresoUsuario.total_capitulos)
            ) {

                return res.status(400).json({
                    success: false,
                    mensaje: "Debes completar toda la capacitación antes de generar el certificado."
                });

            }

            // ============================================
            // BUSCAR EVALUACIONES DEL CURSO
            // ============================================

            const [evaluaciones] = await db.query(
                `
                SELECT
                    id,
                    porcentaje_aprobacion,
                    activo
                FROM evaluaciones_curso
                WHERE curso_id = ?
                AND activo = 1
                ORDER BY orden ASC, id ASC
                `,
                [curso_id]
            );

            let notaFinal = 0;

            // ============================================
            // SI TIENE EVALUACIÓN
            // ============================================

            if (evaluaciones.length > 0) {

                const evaluacionIds =
                    evaluaciones.map(e => e.id);

                const placeholders =
                    evaluacionIds.map(() => "?").join(",");

                const [resultados] = await db.query(
                    `
                    SELECT
                        evaluacion_id,
                        puntaje,
                        aprobado,
                        fecha_presentacion
                    FROM evaluaciones_usuario
                    WHERE usuario_id = ?
                    AND evaluacion_id IN (${placeholders})
                    ORDER BY fecha_presentacion DESC
                    `,
                    [
                        usuario_id,
                        ...evaluacionIds
                    ]
                );

                if (resultados.length === 0) {

                    return res.status(400).json({
                        success: false,
                        mensaje: "Debes presentar la evaluación antes de generar el certificado."
                    });

                }

                // Tomamos el resultado más reciente de cada evaluación
                const resultadosFinales = [];

                for (const evaluacion of evaluaciones) {

                    const resultado =
                        resultados.find(
                            r =>
                                Number(r.evaluacion_id) ===
                                Number(evaluacion.id)
                        );

                    if (!resultado) {

                        return res.status(400).json({
                            success: false,
                            mensaje:
                                "Debes completar todas las evaluaciones antes de generar el certificado."
                        });

                    }

                    if (Number(resultado.aprobado) !== 1) {

                        return res.status(400).json({
                            success: false,
                            mensaje:
                                "Debes aprobar todas las evaluaciones antes de generar el certificado."
                        });

                    }

                    resultadosFinales.push(
                        Number(resultado.puntaje)
                    );

                }

                // Promedio de las evaluaciones
                notaFinal =
                    resultadosFinales.reduce(
                        (a, b) => a + b,
                        0
                    ) /
                    resultadosFinales.length;

            }

            // ============================================
            // SI NO TIENE EVALUACIÓN
            // ============================================

            else {

                notaFinal =
                    Number(progresoUsuario.nota_final) || 0;

            }

            // ============================================
            // CONSULTAR CONFIGURACIÓN DEL CERTIFICADO
            // ============================================

            const [configuracion] = await db.query(
                `
                SELECT *
                FROM certificados_curso
                WHERE curso_id = ?
                AND activo = 1
                LIMIT 1
                `,
                [curso_id]
            );

            if (configuracion.length === 0) {

                return res.status(400).json({
                    success: false,
                    mensaje:
                        "Esta capacitación no tiene configurado un certificado."
                });

            }

            const certificadoConfig =
                configuracion[0];

            // ============================================
            // GENERAR CÓDIGO ÚNICO
            // ============================================

            const codigo =
                `CERT-CAP-${curso_id}-${usuario_id}-${Date.now()}`;

            // ============================================
            // FECHA DE EMISIÓN
            // ============================================

            const fechaEmision = new Date();

            // ============================================
            // GUARDAR / ACTUALIZAR CERTIFICADO
            // ============================================

            /*
             * IMPORTANTE:
             *
             * certificados_usuario actualmente
             * pertenece al flujo de inducción.
             *
             * Por eso NO insertamos aquí todavía.
             *
             * Primero devolvemos todos los datos
             * necesarios para que el certificado
             * de capacitación tenga su propio registro.
             */

            res.json({

                success: true,

                mensaje:
                    "Certificado listo para generar.",

                certificado: {

                    usuario_id,

                    curso_id,

                    nombre_capacitacion:
                        capacitacion.nombre,

                    nota_final:
                        Number(notaFinal).toFixed(2),

                    fecha_emision:
                        fechaEmision,

                    codigo_certificado:
                        codigo,

                    plantilla:
                        certificadoConfig.plantilla,

                    mostrar_qr:
                        Boolean(certificadoConfig.mostrar_qr),

                    mostrar_sello:
                        Boolean(certificadoConfig.mostrar_sello),

                    texto_certificado:
                        certificadoConfig.texto_certificado,

                    firma_izquierda:
                        certificadoConfig.firma_izquierda,

                    firma_derecha:
                        certificadoConfig.firma_derecha,

                    sello:
                        certificadoConfig.sello,

                    configuracion:
                        certificadoConfig.configuracion

                }

            });

        }

        catch (error) {

            console.error(
                "🔥 ERROR EMITIENDO CERTIFICADO CAPACITACIÓN:",
                error
            );

            res.status(500).json({

                success: false,

                mensaje:
                    "Error generando el certificado.",

                error:
                    error.message

            });

        }

    }
);

// ==========================================================
// 📜 MOSTRAR PÁGINA DEL CERTIFICADO
// ==========================================================

router.get(
    "/certificado-capacitacion/:id",
    proteger,
    (req, res) => {

        res.sendFile(
            path.join(
                __dirname,
                "../public/certificado-capacitacion.html"
            )
        );

    }
);

// ==========================================================
// 🔐 VALIDAR CERTIFICADO MEDIANTE TOKEN
// ==========================================================

router.get(
    "/api/validar-certificado/:token",
    async (req, res) => {

        try {

            const token =
                req.params.token;


            // ============================================
            // VALIDAR TOKEN
            // ============================================

            if (!token || token.length < 32) {

                return res.status(400).json({

                    success: false,

                    valido: false,

                    mensaje:
                        "Token de validación inválido."

                });

            }


            // ============================================
            // BUSCAR CERTIFICADO POR TOKEN
            // ============================================

            const [certificados] =
                await db.query(
                    `
                    SELECT

                        cu.id,

                        cu.codigo_certificado,

                        cu.nota_final,

                        cu.fecha_emision,

                        cu.fecha_vencimiento,

                        c.titulo AS nombre_capacitacion,

                        c.descripcion AS descripcion_capacitacion,

                        e.nombre AS nombre_empleado

                    FROM certificados_usuario cu

                    INNER JOIN cursos c
                        ON c.id = cu.curso_id

                    INNER JOIN usuarios u
                        ON u.ID = cu.usuario_id

                    INNER JOIN empleados e
                        ON e.id = u.empleado_id

                    WHERE cu.token_validacion = ?

                    LIMIT 1
                    `,
                    [
                        token
                    ]
                );


            // ============================================
            // CERTIFICADO NO ENCONTRADO
            // ============================================

            if (certificados.length === 0) {

                return res.status(404).json({

                    success: true,

                    valido: false,

                    mensaje:
                        "El certificado no existe o no es válido."

                });

            }


            const certificado =
                certificados[0];


            // ============================================
            // RESPUESTA PÚBLICA
            // ============================================

            return res.json({

                success: true,

                valido: true,

                certificado: {

                    codigo:
                        certificado.codigo_certificado,

                    nombre_empleado:
                        certificado.nombre_empleado,

                    nombre_capacitacion:
                        certificado.nombre_capacitacion,

                    descripcion:
                        certificado.descripcion_capacitacion,

                    nota:
                        Number(
                            certificado.nota_final
                        ).toFixed(2),

                    fecha_emision:
                        certificado.fecha_emision,

                    fecha_vencimiento:
                        certificado.fecha_vencimiento

                }

            });

        }

        catch (error) {

            console.error(
                "🔥 ERROR VALIDANDO CERTIFICADO:",
                error
            );


            return res.status(500).json({

                success: false,

                valido: false,

                mensaje:
                    "No fue posible validar el certificado."

            });

        }

    }
);

// ==========================================================
// VER CERTIFICADO GENERADO
// ==========================================================

router.get(
    "/api/certificados-capacitacion/:id",
    proteger,
    async (req, res) => {

        try {

            const certificadoId = req.params.id;
            const usuarioId = req.session.usuarioID;


            // ==================================================
            // 1. BUSCAR CERTIFICADO
            // ==================================================

            const [certificados] = await db.query(
                `
                SELECT
                    cu.id,
                    cu.usuario_id,
                    cu.curso_id,
                    cu.nota_final,
                    cu.fecha_emision,
                    cu.codigo_certificado,
                    cu.fecha_vencimiento,

                    c.titulo AS nombre_capacitacion,
                    c.descripcion AS descripcion_capacitacion,

                    e.nombre AS nombre_empleado

                FROM certificados_usuario cu

                INNER JOIN cursos c
                    ON c.id = cu.curso_id

                INNER JOIN usuarios u
                    ON u.ID = cu.usuario_id

                INNER JOIN empleados e
                    ON e.id = u.empleado_id

                WHERE cu.id = ?
                AND cu.usuario_id = ?

                LIMIT 1
                `,
                [
                    certificadoId,
                    usuarioId
                ]
            );


            // ==================================================
            // 2. VALIDAR CERTIFICADO
            // ==================================================

            if (certificados.length === 0) {

                return res.status(404).json({

                    success: false,

                    mensaje:
                        "Certificado no encontrado."

                });

            }


            const certificado = certificados[0];


            // ==================================================
            // 3. OBTENER CONFIGURACIÓN
            // ==================================================

            const [configuraciones] = await db.query(
                `
                SELECT
                    *
                FROM certificados_curso
                WHERE curso_id = ?
                AND activo = 1
                LIMIT 1
                `,
                [
                    certificado.curso_id
                ]
            );


            if (configuraciones.length === 0) {

                return res.status(404).json({

                    success: false,

                    mensaje:
                        "Este certificado no tiene configuración."

                });

            }


            const configuracion =
                configuraciones[0];


            // ==================================================
            // 4. RESPUESTA
            // ==================================================

            res.json({

                success: true,

                certificado: {

                    id:
                        certificado.id,

                    nombre_empleado:
                        certificado.nombre_empleado,

                    nombre_capacitacion:
                        certificado.nombre_capacitacion,

                    descripcion:
                        certificado.descripcion_capacitacion,

                    nota_final:
                        Number(
                            certificado.nota_final
                        ).toFixed(2),

                    fecha_emision:
                        certificado.fecha_emision,

                    fecha_vencimiento:
                        certificado.fecha_vencimiento,

                    codigo_certificado:
                        certificado.codigo_certificado,

                    plantilla:
                        configuracion.plantilla,

                    mostrar_qr:
                        Boolean(
                            configuracion.mostrar_qr
                        ),

                    mostrar_sello:
                        Boolean(
                            configuracion.mostrar_sello
                        ),

                    texto_certificado:
                        configuracion.texto_certificado,

                    firma_izquierda:
                        configuracion.firma_izquierda,

                    firma_derecha:
                        configuracion.firma_derecha,

                    sello:
                        configuracion.sello,

                    configuracion:
                        configuracion.configuracion

                }

            });

        }

        catch (error) {

            console.error(
                "🔥 ERROR OBTENIENDO CERTIFICADO:",
                error
            );

            res.status(500).json({

                success: false,

                mensaje:
                    "Error obteniendo el certificado.",

                error:
                    error.message

            });

        }

    }
);

module.exports = router;