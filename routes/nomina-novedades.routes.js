/* ============================================================
   NOVEDADES - PROCESADOS MARGARITA
   Rutas del módulo de novedades de nómina
   ============================================================ */

const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');

const router = express.Router();

/* ============================================================
   CONFIGURACIÓN DE SOPORTES DE NOVEDADES
   ============================================================ */

const carpetaSoportesNovedades =
    path.join(
        __dirname,
        '../public/uploads/nomina/novedades/soportes'
    );

if (!fs.existsSync(carpetaSoportesNovedades)) {
    fs.mkdirSync(
        carpetaSoportesNovedades,
        { recursive: true }
    );
}


/* ============================================================
   MULTER
   ============================================================ */

const storageSoportes =
    multer.diskStorage({

        destination(req, file, cb) {

            cb(
                null,
                carpetaSoportesNovedades
            );

        },

        filename(req, file, cb) {

            const extension =
                path.extname(
                    file.originalname
                ).toLowerCase();

            const nombreArchivo =
                `incapacidad_${Date.now()}_${Math.round(
                    Math.random() * 100000
                )}${extension}`;

            cb(
                null,
                nombreArchivo
            );

        }

    });


const uploadSoporte =
    multer({

        storage: storageSoportes,

        limits: {
            fileSize: 10 * 1024 * 1024
        },

        fileFilter(req, file, cb) {

            const tiposPermitidos = [
                'application/pdf',
                'image/jpeg',
                'image/png'
            ];

            if (
                tiposPermitidos.includes(
                    file.mimetype
                )
            ) {

                cb(null, true);

            } else {

                cb(
                    new Error(
                        'El soporte debe ser PDF, JPG o PNG.'
                    )
                );

            }

        }

    });

const {
    proteger,
    soloRol
} = require('../middlewares/auth');


/* ============================================================
   PÁGINA PRINCIPAL DE NOVEDADES
   ============================================================ */

router.get(
    '/nomina/novedades',
    proteger,
    (req, res) => {

        res.sendFile(
            path.join(
                __dirname,
                '../public/nomina-novedades.html'
            )
        );

    }
);


/* ============================================================
   LISTAR NOVEDADES ACTIVAS
   ============================================================ */

router.get(
    '/api/nomina/novedades',
    proteger,
    async (req, res) => {

        try {

            const db = req.app.get('db');

            const rol = req.session.rol;
            const empleadoID = req.session.empleadoID;

            let sql = `
                SELECT
                    n.id,
                    n.empleado_id,

                    e.nombre AS empleado_nombre,
                    e.numero_documento,

                    n.tipo_novedad_id,

                    t.nombre AS tipo_novedad,
                    t.codigo AS codigo_novedad,
                    t.categoria,

                    n.fecha_inicio,
                    n.fecha_fin,
                    n.hora_inicio,
                    n.hora_fin,

                    n.cantidad_dias,
                    n.cantidad_horas,

                    n.motivo,
                    n.observacion,

                    n.estado,
                    n.observacion_rechazo,

                    n.usuario_creacion,
                    n.usuario_revision,

                    n.fecha_creacion,
                    n.fecha_revision

                FROM nomina_novedades n

                INNER JOIN empleados e
                    ON e.id = n.empleado_id

                INNER JOIN nomina_novedades_tipos t
                    ON t.id = n.tipo_novedad_id

                WHERE
                    (
                        n.estado = 'PENDIENTE'
                        OR
                        (
                            n.estado IN ('APROBADA', 'RECHAZADA')
                            AND n.fecha_revision IS NOT NULL
                            AND n.fecha_revision >= DATE_SUB(NOW(), INTERVAL 14 DAY)
                        )
                    )
            `;


            const parametros = [];


            /* =================================================
               AUXILIAR → SOLO SUS PROPIAS NOVEDADES
               ================================================= */

            if (rol === 'auxiliar') {

                sql += `
                    AND n.empleado_id = ?
                `;

                parametros.push(empleadoID);

            }


            sql += `
                ORDER BY n.fecha_creacion DESC
            `;


            const [novedades] =
                await db.query(
                    sql,
                    parametros
                );


            res.json({

                success: true,

                rol,

                novedades

            });


        } catch (error) {

            console.error(
                'ERROR LISTANDO NOVEDADES:',
                error
            );

            res.status(500).json({

                success: false,

                message:
                    'Error al consultar las novedades'

            });

        }

    }
);

/* ============================================================
   HISTORIAL / VENCIDAS
   ============================================================ */

router.get(
    '/api/nomina/novedades/historial',
    proteger,
    async (req, res) => {

        try {

            const db = req.app.get('db');

            const rol = req.session.rol;
            const empleadoID = req.session.empleadoID;


            const {
                buscar,
                tipo,
                estado,
                tipo_fecha,
                fecha,
                mes,
                ano,
                desde,
                hasta
            } = req.query;


            let sql = `
                SELECT
                    n.id,
                    n.empleado_id,

                    e.nombre AS empleado_nombre,
                    e.numero_documento,

                    n.tipo_novedad_id,

                    t.nombre AS tipo_novedad,
                    t.codigo AS codigo_novedad,
                    t.categoria,

                    n.fecha_inicio,
                    n.fecha_fin,
                    n.hora_inicio,
                    n.hora_fin,

                    n.cantidad_dias,
                    n.cantidad_horas,

                    n.motivo,
                    n.observacion,

                    n.estado,
                    n.observacion_rechazo,

                    n.usuario_creacion,
                    n.usuario_revision,

                    n.fecha_creacion,
                    n.fecha_revision

                FROM nomina_novedades n

                INNER JOIN empleados e
                    ON e.id = n.empleado_id

                INNER JOIN nomina_novedades_tipos t
                    ON t.id = n.tipo_novedad_id

                WHERE
                    n.estado IN ('APROBADA', 'RECHAZADA')

                    AND n.fecha_revision IS NOT NULL

                    AND n.fecha_revision < DATE_SUB(NOW(), INTERVAL 14 DAY)
            `;


            const parametros = [];


            /* =================================================
               AUXILIAR → SOLO SUS VENCIDAS
               ================================================= */

            if (rol === 'auxiliar') {

                sql += `
                    AND n.empleado_id = ?
                `;

                parametros.push(empleadoID);

            }


            /* =================================================
               BUSCADOR
               ================================================= */

            if (buscar && buscar.trim() !== '') {

                sql += `
                    AND (
                        e.nombre LIKE ?
                        OR e.numero_documento LIKE ?
                        OR t.nombre LIKE ?
                    )
                `;

                const texto =
                    `%${buscar.trim()}%`;

                parametros.push(
                    texto,
                    texto,
                    texto
                );

            }


            /* =================================================
               TIPO DE NOVEDAD
               ================================================= */

            if (tipo && tipo !== '') {

                sql += `
                    AND n.tipo_novedad_id = ?
                `;

                parametros.push(tipo);

            }


            /* =================================================
               ESTADO
               ================================================= */

            if (
                estado &&
                (
                    estado === 'APROBADA' ||
                    estado === 'RECHAZADA'
                )
            ) {

                sql += `
                    AND n.estado = ?
                `;

                parametros.push(estado);

            }


            /* =================================================
               FILTRO POR DÍA
               ================================================= */

            if (
                tipo_fecha === 'dia' &&
                fecha
            ) {

                sql += `
                    AND DATE(n.fecha_revision) = ?
                `;

                parametros.push(fecha);

            }


            /* =================================================
               FILTRO POR MES
               Formato esperado: YYYY-MM
               ================================================= */

            if (
                tipo_fecha === 'mes' &&
                mes
            ) {

                sql += `
                    AND DATE_FORMAT(
                        n.fecha_revision,
                        '%Y-%m'
                    ) = ?
                `;

                parametros.push(mes);

            }


            /* =================================================
               FILTRO POR AÑO
               ================================================= */

            if (
                tipo_fecha === 'ano' &&
                ano
            ) {

                sql += `
                    AND YEAR(n.fecha_revision) = ?
                `;

                parametros.push(ano);

            }


            /* =================================================
               FILTRO POR RANGO
               ================================================= */

            if (
                tipo_fecha === 'rango' &&
                desde &&
                hasta
            ) {

                sql += `
                    AND DATE(n.fecha_revision)
                        BETWEEN ? AND ?
                `;

                parametros.push(
                    desde,
                    hasta
                );

            }


            sql += `
                ORDER BY n.fecha_revision DESC
            `;


            const [novedades] =
                await db.query(
                    sql,
                    parametros
                );


            res.json({

                success: true,

                novedades

            });


        } catch (error) {

            console.error(
                'ERROR CONSULTANDO HISTORIAL:',
                error
            );

            res.status(500).json({

                success: false,

                message:
                    'Error al consultar el historial'

            });

        }

    }
);

/* ============================================================
   TIPOS DE NOVEDAD ACTIVOS
   ============================================================ */

router.get(
    '/api/nomina/novedades/tipos',
    proteger,
    async (req, res) => {

        try {

            const db = req.app.get('db');

            const [tipos] = await db.query(`
                SELECT
                    id,
                    nombre,
                    codigo,
                    categoria,
                    descripcion,
                    permite_empleado,
                    requiere_soporte,
                    requiere_aprobacion
                FROM nomina_novedades_tipos
                WHERE activo = 1
                ORDER BY categoria ASC, nombre ASC
            `);

            res.json({
                success: true,
                tipos
            });

        } catch (error) {

            console.error(
                'ERROR CARGANDO TIPOS DE NOVEDAD:',
                error
            );

            res.status(500).json({
                success: false,
                message: 'Error al cargar los tipos de novedad'
            });

        }

    }
);

/* ============================================================
   CREAR NOVEDAD - INCAPACIDAD
   ============================================================ */

router.post(
    '/api/nomina/novedades/incapacidad',
    proteger,
    uploadSoporte.single('soporte'),
    async (req, res) => {

        const db =
            req.app.get('db');

        let connection = null;

        try {

            const usuarioId =
                req.session.usuarioID;

            const empleadoId =
                req.session.empleadoID;


            /* ====================================================
               VALIDAR SESIÓN
               ==================================================== */

            if (!usuarioId || !empleadoId) {

                if (req.file) {
                    fs.unlinkSync(
                        req.file.path
                    );
                }

                return res.status(401).json({
                    success: false,
                    message:
                        'La sesión del usuario no es válida.'
                });

            }


            /* ====================================================
               DATOS RECIBIDOS
               ==================================================== */

            const {
                tipo_novedad_id,
                tipo_incapacidad,
                fecha_inicio,
                fecha_fin,
                cantidad_dias,
                observacion
            } = req.body;


            /* ====================================================
               VALIDACIONES
               ==================================================== */

            if (!tipo_novedad_id) {

                return res.status(400).json({
                    success: false,
                    message:
                        'No se recibió el tipo de novedad.'
                });

            }


            if (!tipo_incapacidad) {

                return res.status(400).json({
                    success: false,
                    message:
                        'Debes seleccionar el tipo de incapacidad.'
                });

            }


            if (!fecha_inicio) {

                return res.status(400).json({
                    success: false,
                    message:
                        'Debes indicar la fecha de inicio.'
                });

            }


            if (!fecha_fin) {

                return res.status(400).json({
                    success: false,
                    message:
                        'Debes indicar la fecha de finalización.'
                });

            }


            if (
                !cantidad_dias ||
                Number(cantidad_dias) <= 0
            ) {

                return res.status(400).json({
                    success: false,
                    message:
                        'La cantidad de días no es válida.'
                });

            }


            if (!req.file) {

                return res.status(400).json({
                    success: false,
                    message:
                        'Debes adjuntar el soporte médico.'
                });

            }


            /* ====================================================
               OBTENER CONEXIÓN
               ==================================================== */

            connection =
                await db.getConnection();

            await connection.beginTransaction();


            /* ====================================================
               VALIDAR TIPO DE NOVEDAD
               ==================================================== */

            const [tipos] =
                await connection.query(
                    `
                    SELECT
                        id,
                        codigo,
                        requiere_soporte,
                        requiere_aprobacion,
                        activo
                    FROM nomina_novedades_tipos
                    WHERE id = ?
                    LIMIT 1
                    `,
                    [
                        tipo_novedad_id
                    ]
                );


            if (!tipos.length) {

                throw new Error(
                    'El tipo de novedad no existe.'
                );

            }


            const tipoNovedad =
                tipos[0];


            if (
                tipoNovedad.codigo !==
                'INCAPACIDAD'
            ) {

                throw new Error(
                    'El tipo de novedad seleccionado no corresponde a una incapacidad.'
                );

            }


            if (
                Number(
                    tipoNovedad.activo
                ) !== 1
            ) {

                throw new Error(
                    'El tipo de novedad está inactivo.'
                );

            }


            /* ====================================================
               CREAR NOVEDAD PRINCIPAL
               ==================================================== */

            const [resultadoNovedad] =
    await connection.query(
        `
        INSERT INTO nomina_novedades (
            empleado_id,
            tipo_novedad_id,
            fecha_inicio,
            fecha_fin,
            cantidad_dias,
            motivo,
            observacion,
            estado,
            usuario_creacion,
            fecha_creacion
        )
        VALUES (
            ?,
            ?,
            ?,
            ?,
            ?,
            ?,
            ?,
            'APROBADA',
            ?,
            NOW()
        )
        `,
        [
            empleadoId,
            tipo_novedad_id,
            fecha_inicio,
            fecha_fin,
            cantidad_dias,
            'Incapacidad',
            observacion || null,
            usuarioId
        ]
    );


            const novedadId =
                resultadoNovedad.insertId;


            /* ====================================================
               CREAR INFORMACIÓN ESPECÍFICA
               ==================================================== */

            await connection.query(
                `
                INSERT INTO nomina_novedades_incapacidades (
                    novedad_id,
                    empleado_id,
                    tipo_incapacidad,
                    fecha_inicio,
                    fecha_fin,
                    cantidad_dias,
                    observacion,
                    usuario_id,
                    fecha_registro
                )
                VALUES (
                    ?,
                    ?,
                    ?,
                    ?,
                    ?,
                    ?,
                    ?,
                    ?,
                    NOW()
                )
                `,
                [
                    novedadId,
                    empleadoId,
                    tipo_incapacidad,
                    fecha_inicio,
                    fecha_fin,
                    cantidad_dias,
                    observacion || null,
                    usuarioId
                ]
            );


            /* ====================================================
               GUARDAR SOPORTE
               ==================================================== */

            const extension =
                path.extname(
                    req.file.originalname
                )
                .replace('.', '')
                .toLowerCase();


            const rutaArchivo =
                `/uploads/nomina/novedades/soportes/${req.file.filename}`;


            await connection.query(
                `
                INSERT INTO nomina_novedades_soportes (
                    novedad_id,
                    nombre_archivo,
                    nombre_original,
                    extension,
                    tipo_mime,
                    ruta_archivo,
                    usuario_id,
                    fecha_subida
                )
                VALUES (
                    ?,
                    ?,
                    ?,
                    ?,
                    ?,
                    ?,
                    ?,
                    NOW()
                )
                `,
                [
                    novedadId,
                    req.file.filename,
                    req.file.originalname,
                    extension,
                    req.file.mimetype,
                    rutaArchivo,
                    usuarioId
                ]
            );


            /* ====================================================
               CONFIRMAR
               ==================================================== */

            await connection.commit();


            res.status(201).json({
                success: true,
                message:
                    'La incapacidad fue registrada correctamente y quedó pendiente de aprobación.',
                novedad_id:
                    novedadId
            });


        } catch (error) {

            console.error(
                'ERROR REGISTRANDO INCAPACIDAD:',
                error
            );


            /* ====================================================
               DESHACER TRANSACCIÓN
               ==================================================== */

            if (connection) {

                try {

                    await connection.rollback();

                } catch (rollbackError) {

                    console.error(
                        'ERROR ROLLBACK:',
                        rollbackError
                    );

                }

            }


            /* ====================================================
               ELIMINAR ARCHIVO SI FALLÓ
               ==================================================== */

            if (req.file) {

                try {

                    if (
                        fs.existsSync(
                            req.file.path
                        )
                    ) {

                        fs.unlinkSync(
                            req.file.path
                        );

                    }

                } catch (fileError) {

                    console.error(
                        'ERROR ELIMINANDO SOPORTE:',
                        fileError
                    );

                }

            }


            res.status(500).json({
                success: false,
                message:
                    error.message ||
                    'No fue posible registrar la incapacidad.'
            });


        } finally {

            if (connection) {
                connection.release();
            }

        }

    }
);

/* ============================================================
   CREAR NOVEDAD - AUSENCIA
   SOLO SUPERADMIN
   ============================================================ */

router.post(
    '/api/nomina/novedades/ausencia',
    proteger,
    uploadSoporte.single('soporte'),
    async (req, res) => {

        const db = req.app.get('db');
        let connection = null;

        try {

            /* ====================================================
               VALIDAR ROL
               ==================================================== */

            const rol =
                String(req.session.rol || '')
                    .trim()
                    .toUpperCase();

            if (rol !== 'SUPERADMIN') {

                if (req.file) {
                    try {
                        if (fs.existsSync(req.file.path)) {
                            fs.unlinkSync(req.file.path);
                        }
                    } catch (e) {
                        console.error(
                            'Error eliminando soporte:',
                            e
                        );
                    }
                }

                return res.status(403).json({
                    success: false,
                    message:
                        'Solo el Superadmin puede registrar ausencias.'
                });
            }


            /* ====================================================
               USUARIO QUE REGISTRA
               ==================================================== */

            const usuarioId =
                req.session.usuarioID ||
                req.session.usuarioId ||
                req.session.id;


            /* ====================================================
               DATOS RECIBIDOS
               ==================================================== */

            const {
                empleado_id,
                tipo_novedad_id,
                tipo_ausencia,
                fecha_inicio,
                fecha_fin,
                cantidad_dias,
                motivo,
                observacion
            } = req.body;


            /* ====================================================
               VALIDAR EMPLEADO
               ==================================================== */

            const empleadoId =
                Number(empleado_id);

            if (!empleadoId) {

                return res.status(400).json({
                    success: false,
                    message:
                        'Debes seleccionar el empleado al que se asignará la ausencia.'
                });
            }


            /* ====================================================
               VALIDAR TIPO DE AUSENCIA
               ==================================================== */

            if (
                ![
                    'JUSTIFICADA',
                    'INJUSTIFICADA'
                ].includes(tipo_ausencia)
            ) {

                return res.status(400).json({
                    success: false,
                    message:
                        'Debes seleccionar si la ausencia es justificada o injustificada.'
                });
            }


            /* ====================================================
               VALIDAR FECHAS
               ==================================================== */

            if (
                !fecha_inicio ||
                !fecha_fin
            ) {

                return res.status(400).json({
                    success: false,
                    message:
                        'Debes indicar la fecha de inicio y finalización.'
                });
            }


            /* ====================================================
               VALIDAR DÍAS
               ==================================================== */

            const dias =
                Number(cantidad_dias);

            if (
                !dias ||
                dias <= 0
            ) {

                return res.status(400).json({
                    success: false,
                    message:
                        'La cantidad de días no es válida.'
                });
            }


            /* ====================================================
               VALIDAR MOTIVO
               ==================================================== */

            if (
                !motivo ||
                !motivo.trim()
            ) {

                return res.status(400).json({
                    success: false,
                    message:
                        'Debes indicar el motivo de la ausencia.'
                });
            }


            /* ====================================================
               SOPORTE PARA JUSTIFICADA
               ==================================================== */

            if (
                tipo_ausencia === 'JUSTIFICADA' &&
                !req.file
            ) {

                return res.status(400).json({
                    success: false,
                    message:
                        'Debes adjuntar el soporte de la ausencia justificada.'
                });
            }


            /* ====================================================
               CONEXIÓN
               ==================================================== */

            connection =
                await db.getConnection();

            await connection.beginTransaction();


            /* ====================================================
               VALIDAR EMPLEADO
               ==================================================== */

            const [empleados] =
                await connection.query(
                    `
                    SELECT id
                    FROM empleados
                    WHERE id = ?
                    LIMIT 1
                    `,
                    [empleadoId]
                );

            if (!empleados.length) {

                throw new Error(
                    'El empleado seleccionado no existe.'
                );
            }


            /* ====================================================
               VALIDAR TIPO DE NOVEDAD
               ==================================================== */

            const [tipos] =
                await connection.query(
                    `
                    SELECT
                        id,
                        codigo,
                        activo
                    FROM nomina_novedades_tipos
                    WHERE id = ?
                    LIMIT 1
                    `,
                    [tipo_novedad_id]
                );

            if (!tipos.length) {

                throw new Error(
                    'El tipo de novedad seleccionado no existe.'
                );
            }


            const tipoNovedad =
                tipos[0];


            if (
                Number(tipoNovedad.activo) !== 1
            ) {

                throw new Error(
                    'El tipo de novedad está inactivo.'
                );
            }


            /* ====================================================
               CREAR NOVEDAD PRINCIPAL
               ==================================================== */

            const [resultado] =
                await connection.query(
                    `
                    INSERT INTO nomina_novedades (
                        empleado_id,
                        tipo_novedad_id,
                        fecha_inicio,
                        fecha_fin,
                        cantidad_dias,
                        motivo,
                        observacion,
                        estado,
                        usuario_creacion,
                        usuario_revision,
                        fecha_creacion,
                        fecha_revision
                    )
                    VALUES (
                        ?,
                        ?,
                        ?,
                        ?,
                        ?,
                        ?,
                        ?,
                        'APROBADA',
                        ?,
                        ?,
                        NOW(),
                        NOW()
                    )
                    `,
                    [
                        empleadoId,
                        tipo_novedad_id,
                        fecha_inicio,
                        fecha_fin,
                        dias,
                        motivo.trim(),
                        observacion?.trim() || null,
                        usuarioId,
                        usuarioId
                    ]
                );


            const novedadId =
                resultado.insertId;


            /* ====================================================
               CREAR DETALLE DE AUSENCIA
               ==================================================== */

            await connection.query(
                `
                INSERT INTO nomina_novedades_ausencias (
                    novedad_id,
                    empleado_id,
                    tipo_ausencia,
                    fecha_inicio,
                    fecha_fin,
                    cantidad_dias,
                    motivo,
                    observacion,
                    usuario_id,
                    fecha_registro
                )
                VALUES (
                    ?,
                    ?,
                    ?,
                    ?,
                    ?,
                    ?,
                    ?,
                    ?,
                    ?,
                    NOW()
                )
                `,
                [
                    novedadId,
                    empleadoId,
                    tipo_ausencia,
                    fecha_inicio,
                    fecha_fin,
                    dias,
                    motivo.trim(),
                    observacion?.trim() || null,
                    usuarioId
                ]
            );


            /* ====================================================
               GUARDAR SOPORTE
               ==================================================== */

            if (
                tipo_ausencia === 'JUSTIFICADA' &&
                req.file
            ) {

                const extension =
                    path.extname(
                        req.file.originalname
                    )
                    .replace('.', '')
                    .toLowerCase();


                const rutaArchivo =
                    `/uploads/nomina/novedades/soportes/${req.file.filename}`;


                await connection.query(
                    `
                    INSERT INTO nomina_novedades_soportes (
                        novedad_id,
                        nombre_archivo,
                        nombre_original,
                        extension,
                        tipo_mime,
                        ruta_archivo,
                        usuario_id,
                        fecha_subida
                    )
                    VALUES (
                        ?,
                        ?,
                        ?,
                        ?,
                        ?,
                        ?,
                        ?,
                        NOW()
                    )
                    `,
                    [
                        novedadId,
                        req.file.filename,
                        req.file.originalname,
                        extension,
                        req.file.mimetype,
                        rutaArchivo,
                        usuarioId
                    ]
                );
            }


            /* ====================================================
               CONFIRMAR
               ==================================================== */

            await connection.commit();


            return res.status(201).json({
                success: true,
                message:
                    'Ausencia registrada y aprobada correctamente.',
                novedad_id:
                    novedadId
            });


        } catch (error) {

            console.error(
                'ERROR REGISTRANDO AUSENCIA:',
                error
            );


            if (connection) {

                try {
                    await connection.rollback();
                } catch (rollbackError) {
                    console.error(
                        'Error en rollback:',
                        rollbackError
                    );
                }
            }


            if (req.file) {

                try {

                    if (
                        fs.existsSync(
                            req.file.path
                        )
                    ) {
                        fs.unlinkSync(
                            req.file.path
                        );
                    }

                } catch (fileError) {

                    console.error(
                        'Error eliminando archivo:',
                        fileError
                    );
                }
            }


            return res.status(500).json({
                success: false,
                message:
                    error.message ||
                    'No fue posible registrar la ausencia.'
            });

        } finally {

            if (connection) {
                connection.release();
            }

        }
    }
);

/* ============================================================
   CREAR NOVEDAD - PERMISO
   ============================================================ */

router.post(
    '/api/nomina/novedades/permiso',
    proteger,
    async (req, res) => {

        const db = req.app.get('db');

        let connection = null;

        try {

            const usuarioId =
                req.session.usuarioID;

            const empleadoId =
                req.session.empleadoID;


            /* ====================================================
               VALIDAR SESIÓN
               ==================================================== */

            if (!usuarioId || !empleadoId) {

                return res.status(401).json({
                    success: false,
                    message:
                        'La sesión del usuario no es válida.'
                });

            }


            /* ====================================================
               DATOS RECIBIDOS
               ==================================================== */

            const {
                tipo_novedad_id,
                tipo_permiso,
                fecha_permiso,
                hora_inicio,
                hora_fin,
                cantidad_horas,
                motivo,
                observacion
            } = req.body;


            /* ====================================================
               VALIDACIONES
               ==================================================== */

            if (!tipo_novedad_id) {

                return res.status(400).json({
                    success: false,
                    message:
                        'No se recibió el tipo de novedad.'
                });

            }


            if (!tipo_permiso) {

                return res.status(400).json({
                    success: false,
                    message:
                        'Debes seleccionar el tipo de permiso.'
                });

            }


            const tiposPermisoPermitidos = [
                'REMUNERADO',
                'NO_REMUNERADO',
                'COMPENSATORIO'
            ];

            if (
                !tiposPermisoPermitidos.includes(
                    tipo_permiso
                )
            ) {

                return res.status(400).json({
                    success: false,
                    message:
                        'El tipo de permiso no es válido.'
                });

            }


            if (!fecha_permiso) {

                return res.status(400).json({
                    success: false,
                    message:
                        'Debes indicar la fecha del permiso.'
                });

            }


            if (!hora_inicio) {

                return res.status(400).json({
                    success: false,
                    message:
                        'Debes indicar la hora de inicio.'
                });

            }


            if (!hora_fin) {

                return res.status(400).json({
                    success: false,
                    message:
                        'Debes indicar la hora de finalización.'
                });

            }


            if (
                !cantidad_horas ||
                Number(cantidad_horas) <= 0
            ) {

                return res.status(400).json({
                    success: false,
                    message:
                        'La cantidad de horas no es válida.'
                });

            }


            if (!motivo || !motivo.trim()) {

                return res.status(400).json({
                    success: false,
                    message:
                        'Debes indicar el motivo del permiso.'
                });

            }


            /* ====================================================
               OBTENER CONEXIÓN
               ==================================================== */

            connection =
                await db.getConnection();

            await connection.beginTransaction();


            /* ====================================================
               VALIDAR TIPO DE NOVEDAD
               ==================================================== */

            const [tipos] =
                await connection.query(
                    `
                    SELECT
                        id,
                        codigo,
                        requiere_aprobacion,
                        activo
                    FROM nomina_novedades_tipos
                    WHERE id = ?
                    LIMIT 1
                    `,
                    [
                        tipo_novedad_id
                    ]
                );


            if (!tipos.length) {

                throw new Error(
                    'El tipo de novedad no existe.'
                );

            }


            const tipoNovedad =
                tipos[0];


            if (
                tipoNovedad.codigo !==
                'PERMISO'
            ) {

                throw new Error(
                    'El tipo de novedad seleccionado no corresponde a un permiso.'
                );

            }


            if (
                Number(tipoNovedad.activo) !== 1
            ) {

                throw new Error(
                    'El tipo de novedad está inactivo.'
                );

            }


            /* ====================================================
               CREAR NOVEDAD PRINCIPAL
               ==================================================== */

            const [resultadoNovedad] =
                await connection.query(
                    `
                    INSERT INTO nomina_novedades (
                        empleado_id,
                        tipo_novedad_id,
                        fecha_inicio,
                        fecha_fin,
                        cantidad_dias,
                        cantidad_horas,
                        motivo,
                        observacion,
                        estado,
                        usuario_creacion,
                        fecha_creacion
                    )
                    VALUES (
                        ?,
                        ?,
                        ?,
                        ?,
                        ?,
                        ?,
                        ?,
                        ?,
                        'PENDIENTE',
                        ?,
                        NOW()
                    )
                    `,
                    [
                        empleadoId,
                        tipo_novedad_id,
                        fecha_permiso,
                        fecha_permiso,
                        1,
                        cantidad_horas,
                        motivo,
                        observacion || null,
                        usuarioId
                    ]
                );


            const novedadId =
                resultadoNovedad.insertId;


            /* ====================================================
               CREAR INFORMACIÓN ESPECÍFICA DEL PERMISO
               ==================================================== */

            await connection.query(
                `
                INSERT INTO nomina_novedades_permisos (
                    novedad_id,
                    empleado_id,
                    tipo_permiso,
                    fecha_permiso,
                    hora_inicio,
                    hora_fin,
                    cantidad_horas,
                    motivo,
                    observacion,
                    usuario_id,
                    fecha_registro
                )
                VALUES (
                    ?,
                    ?,
                    ?,
                    ?,
                    ?,
                    ?,
                    ?,
                    ?,
                    ?,
                    ?,
                    NOW()
                )
                `,
                [
                    novedadId,
                    empleadoId,
                    tipo_permiso,
                    fecha_permiso,
                    hora_inicio,
                    hora_fin,
                    cantidad_horas,
                    motivo,
                    observacion || null,
                    usuarioId
                ]
            );


            /* ====================================================
               CONFIRMAR
               ==================================================== */

            await connection.commit();


            res.status(201).json({
                success: true,
                message:
                    'El permiso fue registrado correctamente y quedó pendiente de aprobación.',
                novedad_id:
                    novedadId
            });


        } catch (error) {

            console.error(
                'ERROR REGISTRANDO PERMISO:',
                error
            );


            if (connection) {

                try {

                    await connection.rollback();

                } catch (rollbackError) {

                    console.error(
                        'ERROR ROLLBACK:',
                        rollbackError
                    );

                }

            }


            res.status(500).json({
                success: false,
                message:
                    error.message ||
                    'No fue posible registrar el permiso.'
            });


        } finally {

            if (connection) {
                connection.release();
            }

        }

    }
);

/* ============================================================
   CREAR NOVEDAD - AUSENCIA
   ============================================================ */

router.post(
    '/api/nomina/novedades/ausencia',
    proteger,
    uploadSoporte.single('soporte'),
    async (req, res) => {

        const db = req.app.get('db');
        let connection = null;

        try {

            const usuarioId =
                req.session.usuarioID;

            const empleadoId =
                req.session.empleadoID;


            /* ====================================================
               VALIDAR SESIÓN
               ==================================================== */

            if (!usuarioId || !empleadoId) {

                if (req.file) {
                    fs.unlinkSync(req.file.path);
                }

                return res.status(401).json({
                    success: false,
                    message:
                        'La sesión del usuario no es válida.'
                });
            }


            /* ====================================================
               DATOS RECIBIDOS
               ==================================================== */

            const {
                tipo_novedad_id,
                tipo_ausencia,
                fecha_inicio,
                fecha_fin,
                cantidad_dias,
                motivo,
                observacion
            } = req.body;


            /* ====================================================
               VALIDACIONES
               ==================================================== */

            if (!tipo_novedad_id) {

                return res.status(400).json({
                    success: false,
                    message:
                        'No se recibió el tipo de novedad.'
                });
            }


            if (
                !tipo_ausencia ||
                ![
                    'JUSTIFICADA',
                    'INJUSTIFICADA'
                ].includes(tipo_ausencia)
            ) {

                return res.status(400).json({
                    success: false,
                    message:
                        'Debes seleccionar un tipo de ausencia válido.'
                });
            }


            if (!fecha_inicio) {

                return res.status(400).json({
                    success: false,
                    message:
                        'Debes indicar la fecha de inicio.'
                });
            }


            if (!fecha_fin) {

                return res.status(400).json({
                    success: false,
                    message:
                        'Debes indicar la fecha de finalización.'
                });
            }


            if (
                !cantidad_dias ||
                Number(cantidad_dias) <= 0
            ) {

                return res.status(400).json({
                    success: false,
                    message:
                        'La cantidad de días no es válida.'
                });
            }


            if (!motivo || !motivo.trim()) {

                return res.status(400).json({
                    success: false,
                    message:
                        'Debes indicar el motivo de la ausencia.'
                });
            }


            /*
             * Si es JUSTIFICADA debe tener soporte.
             */

            if (
                tipo_ausencia === 'JUSTIFICADA' &&
                !req.file
            ) {

                return res.status(400).json({
                    success: false,
                    message:
                        'Debes adjuntar el soporte de la ausencia justificada.'
                });
            }


            /*
             * Si es INJUSTIFICADA no necesitamos soporte.
             */

            if (
                tipo_ausencia === 'INJUSTIFICADA' &&
                req.file
            ) {

                fs.unlinkSync(req.file.path);
            }


            /* ====================================================
               OBTENER CONEXIÓN
               ==================================================== */

            connection =
                await db.getConnection();

            await connection.beginTransaction();


            /* ====================================================
               VALIDAR TIPO DE NOVEDAD
               ==================================================== */

            const [tipos] =
                await connection.query(
                    `
                    SELECT
                        id,
                        codigo,
                        requiere_aprobacion,
                        activo
                    FROM nomina_novedades_tipos
                    WHERE id = ?
                    LIMIT 1
                    `,
                    [
                        tipo_novedad_id
                    ]
                );


            if (!tipos.length) {

                throw new Error(
                    'El tipo de novedad no existe.'
                );
            }


            const tipoNovedad =
                tipos[0];


            if (
                tipoNovedad.codigo !==
                'ASISTENCIA'
            ) {

                throw new Error(
                    'El tipo de novedad seleccionado no corresponde a una ausencia.'
                );
            }


            if (
                Number(
                    tipoNovedad.activo
                ) !== 1
            ) {

                throw new Error(
                    'El tipo de novedad está inactivo.'
                );
            }


            /* ====================================================
               CREAR NOVEDAD PRINCIPAL
               ==================================================== */

            const [resultadoNovedad] =
                await connection.query(
                    `
                    INSERT INTO nomina_novedades (
                        empleado_id,
                        tipo_novedad_id,
                        fecha_inicio,
                        fecha_fin,
                        cantidad_dias,
                        motivo,
                        observacion,
                        estado,
                        usuario_creacion,
                        fecha_creacion
                    )
                    VALUES (
                        ?,
                        ?,
                        ?,
                        ?,
                        ?,
                        ?,
                        ?,
                        'PENDIENTE',
                        ?,
                        NOW()
                    )
                    `,
                    [
                        empleadoId,
                        tipo_novedad_id,
                        fecha_inicio,
                        fecha_fin,
                        cantidad_dias,
                        motivo,
                        observacion || null,
                        usuarioId
                    ]
                );


            const novedadId =
                resultadoNovedad.insertId;


            /* ====================================================
               CREAR INFORMACIÓN ESPECÍFICA DE LA AUSENCIA
               ==================================================== */

            await connection.query(
                `
                INSERT INTO nomina_novedades_ausencias (
                    novedad_id,
                    empleado_id,
                    tipo_ausencia,
                    fecha_inicio,
                    fecha_fin,
                    cantidad_dias,
                    motivo,
                    observacion,
                    usuario_id,
                    fecha_registro
                )
                VALUES (
                    ?,
                    ?,
                    ?,
                    ?,
                    ?,
                    ?,
                    ?,
                    ?,
                    ?,
                    NOW()
                )
                `,
                [
                    novedadId,
                    empleadoId,
                    tipo_ausencia,
                    fecha_inicio,
                    fecha_fin,
                    cantidad_dias,
                    motivo,
                    observacion || null,
                    usuarioId
                ]
            );


            /* ====================================================
               GUARDAR SOPORTE
               ==================================================== */

            if (
                tipo_ausencia === 'JUSTIFICADA' &&
                req.file
            ) {

                const extension =
                    path.extname(
                        req.file.originalname
                    )
                    .replace('.', '')
                    .toLowerCase();


                const rutaArchivo =
                    `/uploads/nomina/novedades/soportes/${req.file.filename}`;


                await connection.query(
                    `
                    INSERT INTO nomina_novedades_soportes (
                        novedad_id,
                        nombre_archivo,
                        nombre_original,
                        extension,
                        tipo_mime,
                        ruta_archivo,
                        usuario_id,
                        fecha_subida
                    )
                    VALUES (
                        ?,
                        ?,
                        ?,
                        ?,
                        ?,
                        ?,
                        ?,
                        NOW()
                    )
                    `,
                    [
                        novedadId,
                        req.file.filename,
                        req.file.originalname,
                        extension,
                        req.file.mimetype,
                        rutaArchivo,
                        usuarioId
                    ]
                );
            }


            /* ====================================================
               CONFIRMAR TRANSACCIÓN
               ==================================================== */

            await connection.commit();


            res.status(201).json({
                success: true,
                message:
                    'La ausencia fue registrada correctamente y quedó aprobada.',
                novedad_id:
                    novedadId
            });


        } catch (error) {

            console.error(
                'ERROR REGISTRANDO AUSENCIA:',
                error
            );


            /* ====================================================
               DESHACER TRANSACCIÓN
               ==================================================== */

            if (connection) {

                try {

                    await connection.rollback();

                } catch (rollbackError) {

                    console.error(
                        'ERROR ROLLBACK:',
                        rollbackError
                    );
                }
            }


            /* ====================================================
               ELIMINAR ARCHIVO SI FALLÓ
               ==================================================== */

            if (req.file) {

                try {

                    if (
                        fs.existsSync(
                            req.file.path
                        )
                    ) {

                        fs.unlinkSync(
                            req.file.path
                        );
                    }

                } catch (fileError) {

                    console.error(
                        'ERROR ELIMINANDO SOPORTE:',
                        fileError
                    );
                }
            }


            res.status(500).json({
                success: false,
                message:
                    error.message ||
                    'No fue posible registrar la ausencia.'
            });


        } finally {

            if (connection) {
                connection.release();
            }
        }
    }
);

/* ============================================================
   CREAR NOVEDAD - LICENCIA
   SOLO SUPERADMIN
   ============================================================ */

router.post(
    '/api/nomina/novedades/licencia',
    proteger,
    async (req, res) => {

        const db =
            req.app.get('db');

        let connection = null;


        try {

            /* ==========================================
   VALIDAR SUPERADMIN
   ========================================== */

const rol = String(
    req.session.rol || ''
)
    .trim()
    .toUpperCase();

if (rol !== 'SUPERADMIN') {

    return res.status(403).json({

        success: false,

        message:
            'Solo el SuperAdmin puede registrar licencias.'

    });

}


            const usuarioId =
                req.session.usuarioID;


            if (!usuarioId) {

                return res.status(401).json({

                    success: false,

                    message:
                        'La sesión del usuario no es válida.'

                });

            }


            /* ==========================================
               DATOS RECIBIDOS
               ========================================== */

            const {
                tipo_novedad_id,
                empleado_id,
                tipo_licencia,
                fecha_inicio,
                fecha_fin,
                cantidad_dias,
                motivo,
                observacion
            } = req.body;


            /* ==========================================
               VALIDACIONES
               ========================================== */

            if (!tipo_novedad_id) {

                return res.status(400).json({

                    success: false,

                    message:
                        'No se recibió el tipo de novedad.'

                });

            }


            if (!empleado_id) {

                return res.status(400).json({

                    success: false,

                    message:
                        'Debes seleccionar un empleado.'

                });

            }


            if (
                !tipo_licencia ||
                ![
                    'MATERNIDAD',
                    'PATERNIDAD'
                ].includes(tipo_licencia)
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        'El tipo de licencia no es válido.'

                });

            }


            if (!fecha_inicio) {

                return res.status(400).json({

                    success: false,

                    message:
                        'Debes indicar la fecha de inicio.'

                });

            }


            if (!fecha_fin) {

                return res.status(400).json({

                    success: false,

                    message:
                        'Debes indicar la fecha de finalización.'

                });

            }


            if (
                !cantidad_dias ||
                Number(cantidad_dias) <= 0
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        'La cantidad de días no es válida.'

                });

            }


            /* ==========================================
               CONEXIÓN
               ========================================== */

            connection =
                await db.getConnection();

            await connection.beginTransaction();


            /* ==========================================
               VALIDAR TIPO DE NOVEDAD
               ========================================== */

            const [tipos] =
                await connection.query(
                    `
                    SELECT
                        id,
                        codigo,
                        activo
                    FROM nomina_novedades_tipos
                    WHERE id = ?
                    LIMIT 1
                    `,
                    [
                        tipo_novedad_id
                    ]
                );


            if (!tipos.length) {

                throw new Error(
                    'El tipo de novedad no existe.'
                );

            }


            const tipoNovedad =
                tipos[0];


            if (
                tipoNovedad.codigo !==
                'LICENCIA'
            ) {

                throw new Error(
                    'El tipo de novedad seleccionado no corresponde a una licencia.'
                );

            }


            if (
                Number(
                    tipoNovedad.activo
                ) !== 1
            ) {

                throw new Error(
                    'El tipo de novedad está inactivo.'
                );

            }


            /* ==========================================
               VALIDAR EMPLEADO
               ========================================== */

            const [empleados] =
                await connection.query(
                    `
                    SELECT
                        id
                    FROM empleados
                    WHERE
                        id = ?
                        AND activo = 'SI'
                    LIMIT 1
                    `,
                    [
                        empleado_id
                    ]
                );


            if (!empleados.length) {

                throw new Error(
                    'El empleado seleccionado no existe o está inactivo.'
                );

            }


            /* ==========================================
               CREAR NOVEDAD PRINCIPAL
               APROBADA DIRECTAMENTE
               ========================================== */

            const [
                resultadoNovedad
            ] =
                await connection.query(
                    `
                    INSERT INTO nomina_novedades (
                        empleado_id,
                        tipo_novedad_id,
                        fecha_inicio,
                        fecha_fin,
                        cantidad_dias,
                        motivo,
                        observacion,
                        estado,
                        usuario_creacion,
                        usuario_revision,
                        fecha_creacion,
                        fecha_revision
                    )
                    VALUES (
                        ?,
                        ?,
                        ?,
                        ?,
                        ?,
                        ?,
                        ?,
                        'APROBADA',
                        ?,
                        ?,
                        NOW(),
                        NOW()
                    )
                    `,
                    [
                        empleado_id,
                        tipo_novedad_id,
                        fecha_inicio,
                        fecha_fin,
                        cantidad_dias,
                        motivo,
                        observacion || null,
                        usuarioId,
                        usuarioId
                    ]
                );


            const novedadId =
                resultadoNovedad.insertId;


            /* ==========================================
               GUARDAR DETALLE DE LICENCIA
               ========================================== */

            await connection.query(
                `
                INSERT INTO nomina_novedades_licencias (
                    novedad_id,
                    empleado_id,
                    tipo_licencia,
                    fecha_inicio,
                    fecha_fin,
                    cantidad_dias,
                    motivo,
                    observacion,
                    usuario_id,
                    fecha_registro
                )
                VALUES (
                    ?,
                    ?,
                    ?,
                    ?,
                    ?,
                    ?,
                    ?,
                    ?,
                    ?,
                    NOW()
                )
                `,
                [
                    novedadId,
                    empleado_id,
                    tipo_licencia,
                    fecha_inicio,
                    fecha_fin,
                    cantidad_dias,
                    motivo,
                    observacion || null,
                    usuarioId
                ]
            );


            /* ==========================================
               CONFIRMAR
               ========================================== */

            await connection.commit();


            res.status(201).json({

                success: true,

                message:
                    'La licencia fue registrada y aprobada correctamente.',

                novedad_id:
                    novedadId

            });


        } catch (error) {

            console.error(
                'ERROR REGISTRANDO LICENCIA:',
                error
            );


            if (connection) {

                try {

                    await connection.rollback();

                } catch (rollbackError) {

                    console.error(
                        'ERROR ROLLBACK LICENCIA:',
                        rollbackError
                    );

                }

            }


            res.status(500).json({

                success: false,

                message:
                    error.message ||
                    'No fue posible registrar la licencia.'

            });


        } finally {

            if (connection) {

                connection.release();

            }

        }

    }
);

/* ============================================================
   CREAR NOVEDAD - HORAS EXTRA / RECARGOS
   ============================================================ */

/* ============================================================
   CREAR NOVEDAD - HORAS EXTRA / RECARGOS
   ============================================================ */

router.post(
    '/api/nomina/novedades/horas-extra',
    proteger,
    async (req, res) => {

        const db = req.app.get('db');

        let connection = null;

        try {

            /* ====================================================
               SESIÓN
               ==================================================== */

            const usuarioId =
                req.session.usuarioID;

            const empleadoId =
                req.session.empleadoID;


            if (!usuarioId || !empleadoId) {

                return res.status(401).json({

                    success: false,

                    message:
                        'La sesión del usuario no es válida.'

                });

            }


            /* ====================================================
               DATOS RECIBIDOS
               ==================================================== */

            const {
                tipo_novedad_id,
                tipo_hora,
                fecha_trabajo,
                hora_inicio,
                hora_fin,
                cantidad_horas,
                observacion
            } = req.body;


            /* ====================================================
               VALIDACIONES BÁSICAS
               ==================================================== */

            if (!tipo_novedad_id) {

                return res.status(400).json({

                    success: false,

                    message:
                        'No se recibió el tipo de novedad.'

                });

            }


            if (!tipo_hora) {

                return res.status(400).json({

                    success: false,

                    message:
                        'Debes seleccionar el tipo de hora o recargo.'

                });

            }


            if (!fecha_trabajo) {

                return res.status(400).json({

                    success: false,

                    message:
                        'Debes indicar la fecha de trabajo.'

                });

            }


            if (!hora_inicio || !hora_fin) {

                return res.status(400).json({

                    success: false,

                    message:
                        'Debes indicar la hora de inicio y finalización.'

                });

            }


            if (
                cantidad_horas === undefined ||
                cantidad_horas === null ||
                Number(cantidad_horas) <= 0
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        'La cantidad de horas no es válida.'

                });

            }


            /* ====================================================
               CONEXIÓN
               ==================================================== */

            connection =
                await db.getConnection();

            await connection.beginTransaction();


            /* ====================================================
               1. VALIDAR TIPO GENERAL DE NOVEDAD
               ==================================================== */

            const [tiposNovedad] =
                await connection.query(
                    `
                    SELECT
                        id,
                        codigo,
                        nombre,
                        requiere_aprobacion,
                        activo
                    FROM nomina_novedades_tipos
                    WHERE id = ?
                    LIMIT 1
                    `,
                    [
                        tipo_novedad_id
                    ]
                );


            if (!tiposNovedad.length) {

                throw new Error(
                    'El tipo de novedad seleccionado no existe.'
                );

            }


            const tipoNovedad =
                tiposNovedad[0];


            if (
                tipoNovedad.codigo !==
                'HORAS_EXTRA'
            ) {

                throw new Error(
                    'El tipo de novedad seleccionado no corresponde a horas extra y recargos.'
                );

            }


            if (
                Number(tipoNovedad.activo) !== 1
            ) {

                throw new Error(
                    'El tipo de novedad está inactivo.'
                );

            }


            /* ====================================================
               2. VALIDAR CONFIGURACIÓN
                  HORAS EXTRA O RECARGO
               ==================================================== */

            const [configHoras] =
                await connection.query(
                    `
                    SELECT
                        id,
                        codigo,
                        nombre,
                        tipo_jornada,
                        tipo_dia,
                        porcentaje_recargo,
                        factor_pago,
                        formula,
                        requiere_autorizacion,
                        limite_diario,
                        limite_semanal,
                        fecha_inicio,
                        fecha_fin,
                        activo
                    FROM nomina_tipos_horas_extra

                    WHERE codigo = ?

                    AND activo = 1

                    AND fecha_inicio <= ?

                    AND (
                        fecha_fin IS NULL
                        OR fecha_fin >= ?
                    )

                    ORDER BY fecha_inicio DESC

                    LIMIT 1
                    `,
                    [
                        tipo_hora,
                        fecha_trabajo,
                        fecha_trabajo
                    ]
                );


            const [configRecargos] =
                await connection.query(
                    `
                    SELECT
                        id,
                        codigo,
                        nombre,
                        porcentaje_recargo,
                        factor_pago,
                        formula,
                        fecha_inicio,
                        fecha_fin,
                        activo
                    FROM nomina_tipos_recargos

                    WHERE codigo = ?

                    AND activo = 1

                    AND fecha_inicio <= ?

                    AND (
                        fecha_fin IS NULL
                        OR fecha_fin >= ?
                    )

                    ORDER BY fecha_inicio DESC

                    LIMIT 1
                    `,
                    [
                        tipo_hora,
                        fecha_trabajo,
                        fecha_trabajo
                    ]
                );


            /* ====================================================
               3. DETERMINAR QUÉ CONFIGURACIÓN SE ENCONTRÓ
               ==================================================== */

            let configuracion = null;

            let tipoConfiguracion = null;


            if (configHoras.length) {

                configuracion =
                    configHoras[0];

                tipoConfiguracion =
                    'HORA_EXTRA';

            } else if (configRecargos.length) {

                configuracion =
                    configRecargos[0];

                tipoConfiguracion =
                    'RECARGO';

            }


            /* ====================================================
               4. VALIDAR QUE EL CÓDIGO EXISTA Y ESTÉ VIGENTE
               ==================================================== */

            if (!configuracion) {

                throw new Error(
                    `El código ${tipo_hora} no existe o no tiene una configuración vigente para la fecha ${fecha_trabajo}.`
                );

            }


            /* ====================================================
               5. CALCULAR HORAS EN BACKEND
                  NO CONFIAMOS EN EL VALOR DEL FRONTEND
               ==================================================== */

            const [inicioHora, inicioMinuto] =
                hora_inicio
                    .split(':')
                    .map(Number);


            const [finHora, finMinuto] =
                hora_fin
                    .split(':')
                    .map(Number);


            const minutosInicio =
                (inicioHora * 60) +
                inicioMinuto;


            const minutosFin =
                (finHora * 60) +
                finMinuto;


            if (
                minutosFin <=
                minutosInicio
            ) {

                throw new Error(
                    'La hora de finalización debe ser posterior a la hora de inicio.'
                );

            }


            const minutosTrabajados =
                minutosFin -
                minutosInicio;


            const horasCalculadas =
                minutosTrabajados / 60;


            const horasRecibidas =
                Number(cantidad_horas);


            /* ====================================================
               6. COMPROBAR QUE LAS HORAS NO FUERON ALTERADAS
               ==================================================== */

            if (
                Math.abs(
                    horasCalculadas -
                    horasRecibidas
                ) > 0.01
            ) {

                throw new Error(
                    'La cantidad de horas enviada no coincide con la hora de inicio y finalización.'
                );

            }


            /* ====================================================
               7. VALIDAR LÍMITE DIARIO
               ==================================================== */

            if (
                tipoConfiguracion ===
                    'HORA_EXTRA' &&
                configuracion.limite_diario !== null &&
                Number(configuracion.limite_diario) > 0 &&
                horasCalculadas >
                    Number(configuracion.limite_diario)
            ) {

                throw new Error(
                    `La cantidad de horas supera el límite diario configurado de ${configuracion.limite_diario} horas.`
                );

            }


            /* ====================================================
               8. CREAR NOVEDAD PRINCIPAL
               ==================================================== */

            const [
    resultadoNovedad
] =
    await connection.query(
        `
        INSERT INTO nomina_novedades (
            empleado_id,
            tipo_novedad_id,
            fecha_inicio,
            fecha_fin,
            hora_inicio,
            hora_fin,
            cantidad_dias,
            cantidad_horas,
            motivo,
            observacion,
            estado,
            usuario_creacion,
            fecha_creacion
        )
        VALUES (
            ?,
            ?,
            ?,
            ?,
            ?,
            ?,
            1,
            ?,
            ?,
            ?,
            'PENDIENTE',
            ?,
            NOW()
        )
        `,
        [
            empleadoId,
            tipo_novedad_id,
            fecha_trabajo,
            fecha_trabajo,
            hora_inicio,
            hora_fin,
            horasCalculadas,
            tipo_hora,
            observacion || null,
            usuarioId
        ]
    );


            const novedadId =
                resultadoNovedad.insertId;


            /* ====================================================
               9. CREAR DETALLE
               ==================================================== */

            await connection.query(
                `
                INSERT INTO nomina_novedades_horas_extra (
                    novedad_id,
                    empleado_id,
                    tipo_hora,
                    fecha_trabajo,
                    hora_inicio,
                    hora_fin,
                    cantidad_horas,
                    observacion,
                    usuario_id,
                    fecha_registro
                )
                VALUES (
                    ?,
                    ?,
                    ?,
                    ?,
                    ?,
                    ?,
                    ?,
                    ?,
                    ?,
                    NOW()
                )
                `,
                [
                    novedadId,
                    empleadoId,
                    tipo_hora,
                    fecha_trabajo,
                    hora_inicio,
                    hora_fin,
                    horasCalculadas,
                    observacion || null,
                    usuarioId
                ]
            );


            /* ====================================================
               10. CONFIRMAR
               ==================================================== */

            await connection.commit();


            return res.status(201).json({

                success: true,

                message:
                    'La novedad de horas extra o recargo fue registrada correctamente y quedó pendiente de aprobación.',

                novedad_id:
                    novedadId,

                tipo_hora:
                    configuracion.codigo,

                nombre_tipo:
                    configuracion.nombre,

                cantidad_horas:
                    horasCalculadas

            });


        } catch (error) {


            if (connection) {

                try {

                    await connection.rollback();

                } catch (rollbackError) {

                    console.error(
                        'Error realizando rollback:',
                        rollbackError
                    );

                }

            }


            console.error(
                '❌ ERROR REGISTRANDO HORAS EXTRA / RECARGO:',
                error
            );


            return res.status(400).json({

                success: false,

                message:
                    error.message ||
                    'No fue posible registrar la novedad.'

            });


        } finally {


            if (connection) {

                connection.release();

            }

        }

    }
);

// =========================================================
// 🌙 OBTENER TIPOS DE RECARGOS
// =========================================================

router.get(
    '/api/nomina/configuracion/recargos',
    async (req, res) => {

        const db = req.app.get('db');

        try {

            const [rows] = await db.query(`
                SELECT
                    id,
                    codigo,
                    nombre,
                    descripcion,
                    porcentaje_recargo,
                    factor_pago,
                    formula,
                    fecha_inicio,
                    fecha_fin,
                    activo
                FROM nomina_tipos_recargos
                WHERE activo = 1
                ORDER BY id ASC
            `);

            res.json({

                ok: true,

                data: rows

            });

        } catch (error) {

            console.error(
                '❌ Error obteniendo tipos de recargos:',
                error
            );

            res.status(500).json({

                ok: false,

                mensaje:
                    'No fue posible cargar los recargos.',

                error:
                    error.message

            });

        }

    }
);

module.exports = router;