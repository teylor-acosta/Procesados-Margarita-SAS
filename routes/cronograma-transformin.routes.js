









"use strict";

// ============================================================
// CRONOGRAMA DE TRANSFORMÍN
// Procesados Margarita S.A.S.
// Backend: Express, MySQL, ExcelJS, Sharp y Nodemailer
// ============================================================

const express = require("express");
const multer = require("multer");
const path = require("path");

const pool = require("../DB");

const excelService = require(
    "../public/servicios/cronograma-excel.service"
);

const cumpleanosService = require(
    "../public/servicios/cumpleanos.service"
);

const fechasService = require("../public/servicios/transformin-fechas.service");
const router = express.Router();

// ============================================================
// 1. CONFIGURACIÓN GENERAL
// ============================================================

const ESTADOS = Object.freeze([
    "PENDIENTE",
    "EN_PROCESO",
    "COMPLETADA",
    "CANCELADA"
]);

const TIPOS = Object.freeze([
    "AMBIENTAL",
    "INSTITUCIONAL",
    "CELEBRACION",
    "OTRO"
]);

const TIPOS_INSTITUCIONALES = Object.freeze([
    ...TIPOS,
    "CUMPLEANOS"
]);

const PRIORIDADES = Object.freeze([
    "BAJA",
    "MEDIA",
    "ALTA"
]);

const ROLES_AUTORIZADOS = Object.freeze([
    "admin",
    "administrador",
    "superadmin",
    "superadministrador"
]);

const MESES = Object.freeze([
    "Enero",
    "Febrero",
    "Marzo",
    "Abril",
    "Mayo",
    "Junio",
    "Julio",
    "Agosto",
    "Septiembre",
    "Octubre",
    "Noviembre",
    "Diciembre"
]);

const SEMANAS_POR_MES = Object.freeze([
    5, 4, 5, 5, 4, 5,
    5, 4, 5, 4, 5, 5
]);

const ZONA_HORARIA = "America/Bogota";

const MAXIMO_ARCHIVO = 5 * 1024 * 1024;

const ANIO_MINIMO = fechasService.ANIO_MIN;

const CODIGO_FORMATO = "FT-SST-147";

// ============================================================
// 2. AUTENTICACIÓN Y AUTORIZACIÓN
// ============================================================

function obtenerUsuario(req) {

    const sesion = req.session;

    if (!sesion || !sesion.usuarioID) {
        return null;
    }

    return {
        id: sesion.usuarioID,
        empleadoID: sesion.empleadoID || null,
        rolID: sesion.rolID || null,
        rol: sesion.rol || ""
    };

}

function requiereAutenticacion(req, res, next) {

    const usuario = obtenerUsuario(req);

    if (!usuario) {

        return res.status(401).json({
            success: false,
            message: "Debes iniciar sesión."
        });

    }

    req.usuarioCronograma = usuario;

    next();

}

function requiereAdministrador(req, res, next) {

    const usuario = req.usuarioCronograma;

    const rol = String(usuario?.rol || "")
        .trim()
        .toLowerCase();

    if (!ROLES_AUTORIZADOS.includes(rol)) {

        return res.status(403).json({
            success: false,
            message:
                "No tienes permisos para administrar el Cronograma de Transformín."
        });

    }

    next();

}

// ============================================================
// 3. CABECERAS DE SEGURIDAD
// ============================================================

router.use((req, res, next) => {

    res.setHeader(
        "Cache-Control",
        "no-store, no-cache, must-revalidate, private"
    );

    res.setHeader(
        "Pragma",
        "no-cache"
    );

    res.setHeader(
        "Expires",
        "0"
    );

    res.setHeader(
        "X-Content-Type-Options",
        "nosniff"
    );

    next();

});

router.use(
    requiereAutenticacion,
    requiereAdministrador
);

// ============================================================
// 4. FUNCIONES AUXILIARES
// ============================================================

function errorValidacion(mensaje, status = 400) {

    const error = new Error(mensaje);

    error.status = status;

    return error;

}

function fechaColombia() {

    const partes = new Intl.DateTimeFormat("en-CA", {
        timeZone: ZONA_HORARIA,
        year: "numeric",
        month: "2-digit",
        day: "2-digit"
    }).formatToParts(new Date());

    const valores = Object.fromEntries(
        partes.map(parte => [
            parte.type,
            parte.value
        ])
    );

    return `${valores.year}-${valores.month}-${valores.day}`;

}

function anioActual() {

    return Number(
        fechaColombia().slice(0, 4)
    );

}

function mesActual() {

    return Number(
        fechaColombia().slice(5, 7)
    );

}

function validarAnio(valor, minimo = ANIO_MINIMO) {

    const anio = Number(

        valor === undefined ||
        valor === null ||
        valor === ""

            ? anioActual()

            : valor

    );

    if (
        !Number.isInteger(anio) ||
        anio < minimo ||
        anio > fechasService.ANIO_MAX
    ) {

        throw errorValidacion(
            "El año seleccionado no es válido."
        );

    }

    return anio;

}

function validarId(valor) {

    const id = Number(valor);

    if (
        !Number.isSafeInteger(id) ||
        id <= 0
    ) {

        throw errorValidacion(
            "El identificador no es válido."
        );

    }

    return id;

}

function validarMes(valor) {

    const mes = Number(valor);

    if (
        !Number.isInteger(mes) ||
        mes < 1 ||
        mes > 12
    ) {

        throw errorValidacion(
            "El mes seleccionado no es válido."
        );

    }

    return mes;

}

function validarSemana(mes, valor) {

    const mesValidado = validarMes(mes);

    const semana = Number(valor);

    const maximo =
        SEMANAS_POR_MES[mesValidado - 1];

    if (
        !Number.isInteger(semana) ||
        semana < 1 ||
        semana > maximo
    ) {

        throw errorValidacion(
            "La semana no existe en el formato corporativo."
        );

    }

    return semana;

}

function fechaValida(valor) {

    if (
        typeof valor !== "string" ||
        !/^\d{4}-\d{2}-\d{2}$/.test(valor)
    ) {

        return false;

    }

    const [anio, mes, dia] = valor
        .split("-")
        .map(Number);

    if (anio < 1000 || anio > 9999) {
        return false;
    }

    const fecha = new Date(
        Date.UTC(anio, mes - 1, dia)
    );

    return (
        fecha.getUTCFullYear() === anio &&
        fecha.getUTCMonth() === mes - 1 &&
        fecha.getUTCDate() === dia
    );

}

function normalizarTexto(valor, maximo = 255) {

    return String(valor ?? "")
        .trim()
        .slice(0, maximo);

}

function normalizarEnum(valor) {

    return String(valor ?? "")
        .trim()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toUpperCase()
        .replace(/[\s-]+/g, "_");

}

function normalizarBooleano(valor) {

    if (
        valor === true ||
        valor === 1 ||
        valor === "1" ||
        valor === "true"
    ) {

        return 1;

    }

    if (
        valor === false ||
        valor === 0 ||
        valor === "0" ||
        valor === "false"
    ) {

        return 0;

    }

    throw errorValidacion(
        "El valor de configuración no es válido."
    );

}

function numero(valor) {

    const resultado = Number(valor);

    return Number.isFinite(resultado)
        ? resultado
        : 0;

}

function validarEstado(valor) {

    const estado = normalizarEnum(valor);

    if (!ESTADOS.includes(estado)) {

        throw errorValidacion(
            "El estado de la actividad no es válido."
        );

    }

    return estado;

}

function validarTipo(valor) {

    const tipo = normalizarEnum(valor);

    if (!TIPOS.includes(tipo)) {

        throw errorValidacion(
            "El tipo de actividad no es válido."
        );

    }

    return tipo;

}

function validarTipoInstitucional(valor) {

    const tipo = normalizarEnum(valor);

    if (!TIPOS_INSTITUCIONALES.includes(tipo)) {

        throw errorValidacion(
            "El tipo de actividad institucional no es válido."
        );

    }

    return tipo;

}

function validarPrioridad(valor) {

    let prioridad = normalizarEnum(valor);

    // Compatibilidad con versiones anteriores.

    if (prioridad === "NORMAL") {
        prioridad = "MEDIA";
    }

    if (prioridad === "URGENTE") {
        prioridad = "ALTA";
    }

    if (!PRIORIDADES.includes(prioridad)) {

        throw errorValidacion(
            "La prioridad no es válida."
        );

    }

    return prioridad;

}

function porcentaje(completadas, programadas) {

    const total = numero(programadas);

    const realizadas = numero(completadas);

    if (total <= 0) {
        return 0;
    }

    return Number(
        ((realizadas / total) * 100).toFixed(2)
    );

}

function actividadVencida(actividad) {

    return Boolean(

        actividad.fecha &&

        actividad.fecha < fechaColombia() &&

        ![
            "COMPLETADA",
            "CANCELADA"
        ].includes(actividad.estado)

    );

}

function presentarActividadManual(actividad) {

    const vencida = actividadVencida(actividad);

    return {
        ...actividad,
        origen: "MANUAL",
        vencida,
        estadoVisual: vencida
            ? "VENCIDA"
            : actividad.estado
    };

}

function obtenerCampo(datos, ...campos) {

    for (const campo of campos) {

        if (
            Object.prototype.hasOwnProperty.call(
                datos,
                campo
            )
        ) {

            return datos[campo];

        }

    }

    return undefined;

}

// ============================================================
// 5. MANEJO CENTRALIZADO DE ERRORES
// ============================================================

function responderError(res, error) {

    const estado = Number(
        error.status ||
        error.statusCode ||
        500
    );

    const permitidos = [
        400,
        401,
        403,
        404,
        409,
        413,
        415,
        422,
        429,
        503
    ];

    let codigo = permitidos.includes(estado)
        ? estado
        : 500;

    let mensaje = error.message;

    if (error.code === "ER_DUP_ENTRY") {

        codigo = 409;

        mensaje =
            "Ya existe un registro con estos datos.";

    }

    if (
        error.code === "ER_NO_REFERENCED_ROW_2" ||
        error.code === "ER_ROW_IS_REFERENCED_2"
    ) {

        codigo = 409;

        mensaje =
            "La operación no puede realizarse debido a registros relacionados.";

    }

    if (codigo === 500) {

        console.error(
            "[CRONOGRAMA TRANSFORMÍN]",
            error
        );

        mensaje =
            "Ocurrió un error procesando la solicitud.";

    }

    return res.status(codigo).json({
        success: false,
        message: mensaje
    });

}

function ejecutar(funcion) {

    return async (req, res, next) => {

        try {

            await funcion(req, res, next);

        } catch (error) {

            if (res.headersSent) {

                return next(error);

            }

            return responderError(res, error);

        }

    };

}

// ============================================================
// 6. TRANSACCIONES MYSQL
// ============================================================

async function transaccion(funcion) {

    const conexion = await pool.getConnection();

    try {

        await conexion.beginTransaction();

        const resultado = await funcion(conexion);

        await conexion.commit();

        return resultado;

    } catch (error) {

        try {

            await conexion.rollback();

        } catch (errorRollback) {

            console.error(
                "[TRANSFORMÍN] Error de rollback:",
                errorRollback.message
            );

        }

        throw error;

    } finally {

        conexion.release();

    }

}

// ============================================================
// 7. VALIDACIÓN DE ACTIVIDADES MANUALES
// ============================================================

function normalizarActividad(datos = {}) {

    const actividad = {

        nombre: normalizarTexto(
            datos.nombre,
            180
        ),

        fecha: datos.fecha || "",

        tipo: validarTipo(
            datos.tipo || "OTRO"
        ),

        responsable: normalizarTexto(
            datos.responsable,
            180
        ),

        estado: validarEstado(
            datos.estado || "PENDIENTE"
        ),

        fechaPreparacion:

            obtenerCampo(
                datos,
                "fechaPreparacion",
                "fecha_preparacion"
            ) || null,

        prioridad: validarPrioridad(
            datos.prioridad || "MEDIA"
        ),

        descripcion: normalizarTexto(
            datos.descripcion,
            5000
        ),

        observaciones: normalizarTexto(
            datos.observaciones,
            5000
        )

    };

    if (!actividad.nombre) {

        throw errorValidacion(
            "El nombre de la actividad es obligatorio."
        );

    }

    if (!fechaValida(actividad.fecha)) {

        throw errorValidacion(
            "La fecha de la actividad no es válida."
        );

    }

    if (
        actividad.fechaPreparacion &&
        !fechaValida(actividad.fechaPreparacion)
    ) {

        throw errorValidacion(
            "La fecha de preparación no es válida."
        );

    }

    if (
        actividad.fechaPreparacion &&
        actividad.fechaPreparacion > actividad.fecha
    ) {

        throw errorValidacion(
            "La preparación no puede ser posterior a la actividad."
        );

    }

    return actividad;

}

function parametrosActividad(actividad) {

    return [

        actividad.nombre,
        actividad.fecha,
        actividad.tipo,
        actividad.responsable || null,
        actividad.estado,
        actividad.fechaPreparacion,
        actividad.prioridad,
        actividad.descripcion || null,
        actividad.observaciones || null

    ];

}

// ============================================================
// 8. AUDITORÍA Y TRAZABILIDAD
// ============================================================

async function registrarHistorial(

    conexion,

    {
        origen,
        actividadId,
        accion,
        anterior = null,
        nuevo = null,
        descripcion = null,
        usuarioId = null
    }

) {

    await conexion.query(

        `
        INSERT INTO transformin_actividades_historial (

            origen,
            actividad_id,
            accion,
            estado_anterior,
            estado_nuevo,
            datos_anteriores,
            datos_nuevos,
            descripcion,
            usuario_id

        )

        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,

        [

            origen,

            actividadId,

            accion,

            anterior?.estado || null,

            nuevo?.estado || null,

            anterior
                ? JSON.stringify(anterior)
                : null,

            nuevo
                ? JSON.stringify(nuevo)
                : null,

            descripcion,

            usuarioId

        ]

    );

}

function determinarAccion(anterior, nuevo) {

    if (!anterior) {
        return "CREACION";
    }

    if (!nuevo) {
        return "ELIMINACION";
    }

    if (
        anterior.estado !== nuevo.estado &&
        nuevo.estado === "COMPLETADA"
    ) {

        return "COMPLETADA";

    }

    if (
        anterior.estado !== nuevo.estado &&
        nuevo.estado === "CANCELADA"
    ) {

        return "CANCELACION";

    }

    if (
        anterior.fecha &&
        nuevo.fecha &&
        anterior.fecha !== nuevo.fecha
    ) {

        return "REPROGRAMACION";

    }

    if (
        anterior.estado !== nuevo.estado
    ) {

        return "CAMBIO_ESTADO";

    }

    return "EDICION";

}

// ============================================================
// 9. CONFIGURACIÓN DE MULTER PARA EXCEL
// ============================================================

const upload = multer({

    storage: multer.memoryStorage(),

    limits: {

        fileSize: MAXIMO_ARCHIVO,

        files: 1,

        fields: 5,

        parts: 6

    },

    fileFilter(req, file, callback) {

        const extension = path
            .extname(file.originalname || "")
            .toLowerCase();

        if (extension !== ".xlsx") {

            return callback(

                errorValidacion(
                    "Solo se permiten archivos Excel .xlsx.",
                    415
                )

            );

        }

        callback(null, true);

    }

});

function obtenerArchivoExcel(req) {

    if (
        !req.file ||
        !Buffer.isBuffer(req.file.buffer) ||
        !req.file.buffer.length
    ) {

        throw errorValidacion(
            "No se recibió un archivo Excel válido."
        );

    }

    if (
        req.file.buffer.length > MAXIMO_ARCHIVO
    ) {

        throw errorValidacion(
            "El archivo supera el tamaño máximo de 5 MB.",
            413
        );

    }

    return req.file;

}

function obtenerAnioImportacion(req) {

    return validarAnio(

        req.body?.anio ??

        req.body?.anioImportar ??

        req.body?.anioImportacion ??

        req.body?.anioImportarExcel ??

        req.query?.anio

    );

}

// ============================================================
// 10. VISTA PRINCIPAL DEL CRONOGRAMA
// ============================================================

router.get("/", (req, res) => {

    res.sendFile(

        path.join(

            __dirname,

            "../public/cronograma-transformin.html"

        )

    );

});

// ============================================================
// 11. CONSULTA BASE DE ACTIVIDADES MANUALES
// ============================================================

const SELECT_ACTIVIDADES = `
    SELECT
        id,
        nombre,

        DATE_FORMAT(
            fecha,
            '%Y-%m-%d'
        ) AS fecha,

        tipo,
        responsable,
        estado,

        DATE_FORMAT(
            fecha_preparacion,
            '%Y-%m-%d'
        ) AS fechaPreparacion,

        prioridad,
        descripcion,
        observaciones,
        created_at,
        updated_at

    FROM transformin_actividades
`;

// ============================================================
// 12. CONSULTAR ACTIVIDAD INDIVIDUAL
// ============================================================

async function obtenerActividadManual(
    conexion,
    id,
    bloquear = false
) {

    id = validarId(id);

    const [filas] = await conexion.query(
        `
        ${SELECT_ACTIVIDADES}

        WHERE id = ?

        LIMIT 1

        ${bloquear ? "FOR UPDATE" : ""}
        `,
        [id]
    );

    if (!filas.length) {

        throw errorValidacion(
            "La actividad solicitada no existe.",
            404
        );

    }

    return presentarActividadManual(
        filas[0]
    );

}

// ============================================================
// 13. CONSULTAR TODAS LAS ACTIVIDADES MANUALES
// ============================================================

router.get(
    "/api/actividades",

    ejecutar(async (req, res) => {

        const {
            mes,
            anio,
            estado,
            tipo,
            prioridad,
            buscar
        } = req.query;

        let sql = `
            ${SELECT_ACTIVIDADES}
            WHERE 1 = 1
        `;

        const parametros = [];

        // ----------------------------------------------------
        // FILTRO POR AÑO
        // ----------------------------------------------------

        if (
            anio !== undefined &&
            anio !== ""
        ) {

            const anioValidado =
                validarAnio(anio);

            sql += `
                AND YEAR(fecha) = ?
            `;

            parametros.push(
                anioValidado
            );

        }

        // ----------------------------------------------------
        // FILTRO POR MES
        // ----------------------------------------------------

        if (
            mes !== undefined &&
            mes !== ""
        ) {

            sql += `
                AND MONTH(fecha) = ?
            `;

            parametros.push(
                validarMes(mes)
            );

        }

        // ----------------------------------------------------
        // FILTRO POR ESTADO
        // ----------------------------------------------------

        if (estado) {

            const estadoFiltro =
                normalizarEnum(estado);

            if (estadoFiltro === "VENCIDA") {

                sql += `
                    AND fecha < ?

                    AND estado NOT IN (
                        'COMPLETADA',
                        'CANCELADA'
                    )
                `;

                parametros.push(
                    fechaColombia()
                );

            } else {

                sql += `
                    AND estado = ?
                `;

                parametros.push(
                    validarEstado(estadoFiltro)
                );

            }

        }

        // ----------------------------------------------------
        // FILTRO POR TIPO
        // ----------------------------------------------------

        if (tipo) {

            sql += `
                AND tipo = ?
            `;

            parametros.push(
                validarTipo(tipo)
            );

        }

        // ----------------------------------------------------
        // FILTRO POR PRIORIDAD
        // ----------------------------------------------------

        if (prioridad) {

            sql += `
                AND prioridad = ?
            `;

            parametros.push(
                validarPrioridad(prioridad)
            );

        }

        // ----------------------------------------------------
        // BÚSQUEDA GENERAL
        // ----------------------------------------------------

        const textoBusqueda =
            normalizarTexto(buscar, 180);

        if (textoBusqueda) {

            const termino =
                `%${textoBusqueda}%`;

            sql += `
                AND (
                    nombre LIKE ?
                    OR responsable LIKE ?
                    OR descripcion LIKE ?
                    OR observaciones LIKE ?
                    OR tipo LIKE ?
                )
            `;

            parametros.push(
                termino,
                termino,
                termino,
                termino,
                termino
            );

        }

        // ----------------------------------------------------
        // ORDENAMIENTO
        // ----------------------------------------------------

        sql += `
            ORDER BY

                fecha ASC,

                CASE prioridad
                    WHEN 'ALTA' THEN 1
                    WHEN 'MEDIA' THEN 2
                    WHEN 'BAJA' THEN 3
                    ELSE 4
                END,

                id ASC
        `;

        const [filas] = await pool.query(
            sql,
            parametros
        );

        const actividades = filas.map(
            presentarActividadManual
        );

        res.json({

            success: true,

            total: actividades.length,

            actividades

        });

    })
);

// ============================================================
// 14. CONSULTAR PRÓXIMAS ACTIVIDADES
// ============================================================

router.get(
    "/api/proximas",

    ejecutar(async (req, res) => {

        const hoy = fechaColombia();

        const anio = req.query.anio
            ? validarAnio(req.query.anio)
            : null;

        let limite = Number(
            req.query.limite || 10
        );

        if (
            !Number.isInteger(limite) ||
            limite < 1 ||
            limite > 100
        ) {

            throw errorValidacion(
                "El límite debe estar entre 1 y 100."
            );

        }

        let sql = `
            ${SELECT_ACTIVIDADES}

            WHERE fecha >= ?

            AND estado NOT IN (
                'COMPLETADA',
                'CANCELADA'
            )
        `;

        const parametros = [hoy];

        if (anio !== null) {

            sql += `
                AND YEAR(fecha) = ?
            `;

            parametros.push(anio);

        }

        sql += `
            ORDER BY

                fecha ASC,

                CASE prioridad
                    WHEN 'ALTA' THEN 1
                    WHEN 'MEDIA' THEN 2
                    WHEN 'BAJA' THEN 3
                    ELSE 4
                END,

                id ASC

            LIMIT ?
        `;

        parametros.push(limite);

        const [filas] = await pool.query(
            sql,
            parametros
        );

        const actividades = filas.map(
            presentarActividadManual
        );

        res.json({

            success: true,

            fecha: hoy,

            total: actividades.length,

            actividades,

            proximas: actividades

        });

    })
);

// ============================================================
// 15. CONSULTAR UNA ACTIVIDAD POR ID
// ============================================================

router.get(
    "/api/actividades/:id",

    ejecutar(async (req, res) => {

        const id = validarId(
            req.params.id
        );

        const actividad =
            await obtenerActividadManual(
                pool,
                id
            );

        res.json({

            success: true,

            actividad

        });

    })
);

// ============================================================
// 16. REGISTRAR NUEVA ACTIVIDAD MANUAL
// ============================================================

router.post(
    "/api/actividades",

    ejecutar(async (req, res) => {

        const datos = req.body || {};

        const actividad =
            normalizarActividad(datos);

        validarAnio(
            actividad.fecha.slice(0, 4)
        );

        const resultado = await transaccion(
            async conexion => {

                const [insercion] =
                    await conexion.query(
                        `
                        INSERT INTO transformin_actividades (

                            nombre,
                            fecha,
                            tipo,
                            responsable,
                            estado,
                            fecha_preparacion,
                            prioridad,
                            descripcion,
                            observaciones

                        )

                        VALUES (
                            ?, ?, ?, ?, ?,
                            ?, ?, ?, ?
                        )
                        `,
                        parametrosActividad(
                            actividad
                        )
                    );

                const actividadId =
                    insercion.insertId;

                const nuevaActividad =
                    await obtenerActividadManual(
                        conexion,
                        actividadId
                    );

                await registrarHistorial(
                    conexion,
                    {

                        origen: "MANUAL",

                        actividadId,

                        accion: "CREACION",

                        anterior: null,

                        nuevo: nuevaActividad,

                        descripcion:
                            "Registro de una nueva actividad manual.",

                        usuarioId:
                            req.usuarioCronograma.id

                    }
                );

                return nuevaActividad;

            }
        );

        res.status(201).json({

            success: true,

            id: resultado.id,

            actividad: resultado,

            message:
                "Actividad registrada correctamente.",

            mensaje:
                "Actividad registrada correctamente."

        });

    })
);

// ============================================================
// 17. COMBINAR DATOS DE UNA ACTIVIDAD EXISTENTE
// ============================================================

function combinarActividadManual(
    anterior,
    datos = {}
) {

    const camposPermitidos = [

        "nombre",
        "fecha",
        "tipo",
        "responsable",
        "estado",
        "prioridad",
        "descripcion",
        "observaciones"

    ];

    const resultado = {

        nombre: anterior.nombre,

        fecha: anterior.fecha,

        tipo: anterior.tipo,

        responsable: anterior.responsable,

        estado: anterior.estado,

        fechaPreparacion:
            anterior.fechaPreparacion,

        prioridad: anterior.prioridad,

        descripcion: anterior.descripcion,

        observaciones: anterior.observaciones

    };

    for (const campo of camposPermitidos) {

        if (
            Object.prototype.hasOwnProperty.call(
                datos,
                campo
            ) &&
            datos[campo] !== undefined
        ) {

            resultado[campo] =
                datos[campo];

        }

    }

    const fechaPreparacion =
        obtenerCampo(
            datos,
            "fechaPreparacion",
            "fecha_preparacion"
        );

    if (fechaPreparacion !== undefined) {

        resultado.fechaPreparacion =
            fechaPreparacion;

    }

    return normalizarActividad(
        resultado
    );

}

// ============================================================
// 18. DETECTAR MODIFICACIONES REALES
// ============================================================

function detectarCambiosActividad(
    anterior,
    nueva
) {

    const campos = [

        "nombre",
        "fecha",
        "tipo",
        "responsable",
        "estado",
        "fechaPreparacion",
        "prioridad",
        "descripcion",
        "observaciones"

    ];

    return campos.filter(campo => {

        const valorAnterior = String(
            anterior[campo] ?? ""
        );

        const valorNuevo = String(
            nueva[campo] ?? ""
        );

        return valorAnterior !== valorNuevo;

    });

}

// ============================================================
// 19. ACTUALIZAR ACTIVIDAD MANUAL
// ============================================================

async function actualizarActividadManual(
    req,
    res
) {

    const id = validarId(
        req.params.id
    );

    const datos = req.body || {};

    if (
        typeof datos !== "object" ||
        Array.isArray(datos)
    ) {

        throw errorValidacion(
            "Los datos de la actividad no son válidos."
        );

    }

    const resultado = await transaccion(
        async conexion => {

            // Bloquear el registro durante la edición.

            const anterior =
                await obtenerActividadManual(
                    conexion,
                    id,
                    true
                );

            const actividad =
                combinarActividadManual(
                    anterior,
                    datos
                );

            validarAnio(
                actividad.fecha.slice(0, 4)
            );

            const cambios =
                detectarCambiosActividad(
                    anterior,
                    actividad
                );

            if (!cambios.length) {

                return {

                    modificada: false,

                    actividad: anterior,

                    cambios: []

                };

            }

            await conexion.query(
                `
                UPDATE transformin_actividades

                SET

                    nombre = ?,

                    fecha = ?,

                    tipo = ?,

                    responsable = ?,

                    estado = ?,

                    fecha_preparacion = ?,

                    prioridad = ?,

                    descripcion = ?,

                    observaciones = ?

                WHERE id = ?
                `,
                [

                    ...parametrosActividad(
                        actividad
                    ),

                    id

                ]
            );

            const nueva =
                await obtenerActividadManual(
                    conexion,
                    id
                );

            const accion =
                determinarAccion(
                    anterior,
                    nueva
                );

            await registrarHistorial(
                conexion,
                {

                    origen: "MANUAL",

                    actividadId: id,

                    accion,

                    anterior,

                    nuevo: nueva,

                    descripcion:
                        "Actualización de actividad. Campos modificados: " +
                        cambios.join(", "),

                    usuarioId:
                        req.usuarioCronograma.id

                }
            );

            return {

                modificada: true,

                actividad: nueva,

                cambios

            };

        }
    );

    const mensaje = resultado.modificada

        ? "Actividad actualizada correctamente."

        : "No se encontraron cambios para guardar.";

    res.json({

        success: true,

        ...resultado,

        message: mensaje,

        mensaje

    });

}

// ============================================================
// 20. RUTAS DE EDICIÓN DE ACTIVIDADES
// ============================================================

router.put(
    "/api/actividades/:id",

    ejecutar(
        actualizarActividadManual
    )
);

router.patch(
    "/api/actividades/:id",

    ejecutar(
        actualizarActividadManual
    )
);

// ============================================================
// 21. CAMBIAR ESTADO DE UNA ACTIVIDAD
// ============================================================

async function cambiarEstadoActividadManual(

    id,

    nuevoEstado,

    usuarioId,

    observaciones = undefined

) {

    id = validarId(id);

    nuevoEstado = validarEstado(
        nuevoEstado
    );

    return transaccion(
        async conexion => {

            const anterior =
                await obtenerActividadManual(
                    conexion,
                    id,
                    true
                );

            const nuevasObservaciones =

                observaciones === undefined

                    ? anterior.observaciones

                    : normalizarTexto(
                        observaciones,
                        5000
                    ) || null;

            const mismoEstado =

                anterior.estado === nuevoEstado;

            const mismasObservaciones =

                String(
                    anterior.observaciones ?? ""
                ) ===

                String(
                    nuevasObservaciones ?? ""
                );

            if (
                mismoEstado &&
                mismasObservaciones
            ) {

                return {

                    modificada: false,

                    actividad: anterior

                };

            }

            // Una actividad cancelada debe reabrirse
            // antes de marcarse como completada.

            if (

                anterior.estado === "CANCELADA" &&

                nuevoEstado === "COMPLETADA"

            ) {

                throw errorValidacion(
                    "Debes reabrir la actividad antes de completarla.",
                    409
                );

            }

            await conexion.query(
                `
                UPDATE transformin_actividades

                SET

                    estado = ?,

                    observaciones = ?

                WHERE id = ?
                `,
                [

                    nuevoEstado,

                    nuevasObservaciones,

                    id

                ]
            );

            const nueva =
                await obtenerActividadManual(
                    conexion,
                    id
                );

            let accion =
                determinarAccion(
                    anterior,
                    nueva
                );

            if (

                [
                    "CANCELADA",
                    "COMPLETADA"
                ].includes(anterior.estado) &&

                [
                    "PENDIENTE",
                    "EN_PROCESO"
                ].includes(nuevoEstado)

            ) {

                accion = "RESTAURACION";

            }

            await registrarHistorial(
                conexion,
                {

                    origen: "MANUAL",

                    actividadId: id,

                    accion,

                    anterior,

                    nuevo: nueva,

                    descripcion:

                        mismoEstado

                            ? "Actualización de observaciones."

                            : `Cambio de estado: ${anterior.estado} a ${nuevoEstado}.`,

                    usuarioId

                }
            );

            return {

                modificada: true,

                actividad: nueva

            };

        }
    );

}

// ============================================================
// 22. RUTA PARA CAMBIAR EL ESTADO
// ============================================================

async function actualizarEstadoManual(
    req,
    res
) {

    const id = validarId(
        req.params.id
    );

    const datos = req.body || {};

    const nuevoEstado =
        obtenerCampo(
            datos,
            "estado",
            "nuevoEstado",
            "nuevo_estado"
        );

    if (!nuevoEstado) {

        throw errorValidacion(
            "Debes seleccionar un estado."
        );

    }

    const resultado =
        await cambiarEstadoActividadManual(

            id,

            nuevoEstado,

            req.usuarioCronograma.id,

            datos.observaciones

        );

    const mensaje = resultado.modificada

        ? "Estado actualizado correctamente."

        : "La actividad ya tiene el estado seleccionado.";

    res.json({

        success: true,

        modificada: resultado.modificada,

        estado:
            resultado.actividad.estado,

        actividad:
            resultado.actividad,

        message: mensaje,

        mensaje

    });

}

router.patch(
    "/api/actividades/:id/estado",

    ejecutar(
        actualizarEstadoManual
    )
);

router.put(
    "/api/actividades/:id/estado",

    ejecutar(
        actualizarEstadoManual
    )
);

// ============================================================
// 23. MARCAR ACTIVIDAD COMO COMPLETADA
// ============================================================

async function completarActividadManual(
    req,
    res
) {

    const id = validarId(
        req.params.id
    );

    const resultado =
        await cambiarEstadoActividadManual(

            id,

            "COMPLETADA",

            req.usuarioCronograma.id,

            req.body?.observaciones

        );

    const mensaje = resultado.modificada

        ? "Actividad marcada como completada correctamente."

        : "La actividad ya se encuentra completada.";

    res.json({

        success: true,

        modificada:
            resultado.modificada,

        completada: true,

        estado: "COMPLETADA",

        actividad:
            resultado.actividad,

        message: mensaje,

        mensaje

    });

}

// Compatibilidad con las distintas versiones
// del JavaScript del cronograma.

router.patch(
    "/api/actividades/:id/completar",

    ejecutar(
        completarActividadManual
    )
);

router.put(
    "/api/actividades/:id/completar",

    ejecutar(
        completarActividadManual
    )
);

router.post(
    "/api/actividades/:id/completar",

    ejecutar(
        completarActividadManual
    )
);

// ============================================================
// 24. REABRIR ACTIVIDAD
// ============================================================

router.patch(
    "/api/actividades/:id/reabrir",

    ejecutar(async (req, res) => {

        const id = validarId(
            req.params.id
        );

        const resultado =
            await cambiarEstadoActividadManual(

                id,

                "PENDIENTE",

                req.usuarioCronograma.id,

                req.body?.observaciones

            );

        const mensaje = resultado.modificada

            ? "Actividad reabierta correctamente."

            : "La actividad ya se encuentra pendiente.";

        res.json({

            success: true,

            modificada:
                resultado.modificada,

            estado: "PENDIENTE",

            actividad:
                resultado.actividad,

            message: mensaje,

            mensaje

        });

    })
);

// ============================================================
// 25. CANCELAR ACTIVIDAD
// ============================================================

router.patch(
    "/api/actividades/:id/cancelar",

    ejecutar(async (req, res) => {

        const id = validarId(
            req.params.id
        );

        const resultado =
            await cambiarEstadoActividadManual(

                id,

                "CANCELADA",

                req.usuarioCronograma.id,

                req.body?.observaciones

            );

        const mensaje = resultado.modificada

            ? "Actividad cancelada correctamente."

            : "La actividad ya se encuentra cancelada.";

        res.json({

            success: true,

            modificada:
                resultado.modificada,

            estado: "CANCELADA",

            actividad:
                resultado.actividad,

            message: mensaje,

            mensaje

        });

    })
);

// ============================================================
// 26. REPROGRAMAR ACTIVIDAD MANUAL
// ============================================================

router.patch(
    "/api/actividades/:id/reprogramar",

    ejecutar(async (req, res) => {

        const id = validarId(
            req.params.id
        );

        const datos = req.body || {};

        const nuevaFecha =
            obtenerCampo(
                datos,
                "fecha",
                "nuevaFecha",
                "nueva_fecha"
            );

        if (!fechaValida(nuevaFecha)) {

            throw errorValidacion(
                "La nueva fecha no es válida."
            );

        }

        validarAnio(
            nuevaFecha.slice(0, 4)
        );

        const resultado = await transaccion(
            async conexion => {

                const anterior =
                    await obtenerActividadManual(
                        conexion,
                        id,
                        true
                    );

                if (

                    anterior.estado === "COMPLETADA" ||

                    anterior.estado === "CANCELADA"

                ) {

                    throw errorValidacion(
                        "Debes reabrir la actividad antes de reprogramarla.",
                        409
                    );

                }

                let fechaPreparacion =
                    obtenerCampo(
                        datos,
                        "fechaPreparacion",
                        "fecha_preparacion"
                    );

                if (
                    fechaPreparacion === undefined
                ) {

                    fechaPreparacion =
                        anterior.fechaPreparacion;

                }

                fechaPreparacion =
                    fechaPreparacion || null;

                if (

                    fechaPreparacion &&

                    !fechaValida(fechaPreparacion)

                ) {

                    throw errorValidacion(
                        "La fecha de preparación no es válida."
                    );

                }

                if (

                    fechaPreparacion &&

                    fechaPreparacion > nuevaFecha

                ) {

                    throw errorValidacion(
                        "La preparación no puede ser posterior a la nueva fecha."
                    );

                }

                const observaciones =

                    datos.observaciones === undefined

                        ? anterior.observaciones

                        : normalizarTexto(
                            datos.observaciones,
                            5000
                        ) || null;

                if (

                    anterior.fecha === nuevaFecha &&

                    anterior.fechaPreparacion ===
                        fechaPreparacion &&

                    String(
                        anterior.observaciones ?? ""
                    ) === String(
                        observaciones ?? ""
                    )

                ) {

                    return {

                        modificada: false,

                        actividad: anterior

                    };

                }

                await conexion.query(
                    `
                    UPDATE transformin_actividades

                    SET

                        fecha = ?,

                        fecha_preparacion = ?,

                        observaciones = ?

                    WHERE id = ?
                    `,
                    [

                        nuevaFecha,

                        fechaPreparacion,

                        observaciones,

                        id

                    ]
                );

                const nueva =
                    await obtenerActividadManual(
                        conexion,
                        id
                    );

                await registrarHistorial(
                    conexion,
                    {

                        origen: "MANUAL",

                        actividadId: id,

                        accion: "REPROGRAMACION",

                        anterior,

                        nuevo: nueva,

                        descripcion:
                            `Actividad reprogramada del ${anterior.fecha} al ${nuevaFecha}.`,

                        usuarioId:
                            req.usuarioCronograma.id

                    }
                );

                return {

                    modificada: true,

                    actividad: nueva

                };

            }
        );

        const mensaje = resultado.modificada

            ? "Actividad reprogramada correctamente."

            : "No se encontraron cambios en la programación.";

        res.json({

            success: true,

            ...resultado,

            message: mensaje,

            mensaje

        });

    })
);

// ============================================================
// 27. ELIMINAR ACTIVIDAD MANUAL
// ============================================================

router.delete(
    "/api/actividades/:id",

    ejecutar(async (req, res) => {

        const id = validarId(
            req.params.id
        );

        const resultado = await transaccion(
            async conexion => {

                const anterior =
                    await obtenerActividadManual(
                        conexion,
                        id,
                        true
                    );

                // Evitar eliminar actividades vinculadas
                // al cronograma corporativo FT-SST-147.

                const [vinculadas] =
                    await conexion.query(
                        `
                        SELECT id

                        FROM transformin_ft147_actividades

                        WHERE actividad_calendario_id = ?

                        LIMIT 1

                        FOR UPDATE
                        `,
                        [id]
                    );

                if (vinculadas.length) {

                    throw errorValidacion(
                        "La actividad está vinculada al cronograma institucional. Debes gestionar primero su vinculación.",
                        409
                    );

                }

                // Registrar la información completa
                // antes de eliminar el registro.

                await registrarHistorial(
                    conexion,
                    {

                        origen: "MANUAL",

                        actividadId: id,

                        accion: "ELIMINACION",

                        anterior,

                        nuevo: null,

                        descripcion:
                            `Eliminación de la actividad: ${anterior.nombre}.`,

                        usuarioId:
                            req.usuarioCronograma.id

                    }
                );

                const [eliminacion] =
                    await conexion.query(
                        `
                        DELETE FROM transformin_actividades

                        WHERE id = ?
                        `,
                        [id]
                    );

                if (
                    eliminacion.affectedRows !== 1
                ) {

                    throw errorValidacion(
                        "No fue posible eliminar la actividad.",
                        409
                    );

                }

                return {

                    id,

                    nombre: anterior.nombre

                };

            }
        );

        res.json({

            success: true,

            eliminada: true,

            actividad: resultado,

            message:
                "Actividad eliminada correctamente.",

            mensaje:
                "Actividad eliminada correctamente."

        });

    })
);

// ============================================================
// 28. CONSULTAR INDICADORES DE ACTIVIDADES MANUALES
// ============================================================

async function obtenerIndicadoresManuales(
    anio = anioActual()
) {

    anio = validarAnio(anio);

    const hoy = fechaColombia();

    const [filas] = await pool.query(
        `
        SELECT

            COUNT(*) AS total,

            COALESCE(
                SUM(
                    estado = 'PENDIENTE'
                ),
                0
            ) AS pendientes,

            COALESCE(
                SUM(
                    estado = 'EN_PROCESO'
                ),
                0
            ) AS enProceso,

            COALESCE(
                SUM(
                    estado = 'COMPLETADA'
                ),
                0
            ) AS completadas,

            COALESCE(
                SUM(
                    estado = 'CANCELADA'
                ),
                0
            ) AS canceladas,

            COALESCE(
                SUM(

                    fecha < ?

                    AND estado NOT IN (
                        'COMPLETADA',
                        'CANCELADA'
                    )

                ),
                0
            ) AS vencidas,

            COALESCE(
                SUM(

                    fecha >= ?

                    AND estado NOT IN (
                        'COMPLETADA',
                        'CANCELADA'
                    )

                ),
                0
            ) AS proximas,

            COALESCE(
                SUM(

                    fecha = ?

                    AND estado NOT IN (
                        'COMPLETADA',
                        'CANCELADA'
                    )

                ),
                0
            ) AS actividadesHoy

        FROM transformin_actividades

        WHERE YEAR(fecha) = ?
        `,
        [

            hoy,

            hoy,

            hoy,

            anio

        ]
    );

    const datos = filas[0] || {};

    const total = numero(
        datos.total
    );

    const completadas = numero(
        datos.completadas
    );

    return {

        anio,

        total,

        totalActividades: total,

        pendientes:
            numero(datos.pendientes),

        enProceso:
            numero(datos.enProceso),

        completadas,

        canceladas:
            numero(datos.canceladas),

        vencidas:
            numero(datos.vencidas),

        proximas:
            numero(datos.proximas),

        actividadesHoy:
            numero(datos.actividadesHoy),

        porcentaje:
            porcentaje(
                completadas,
                total
            )

    };

}

// ============================================================
// 29. INDICADORES MENSUALES DE ACTIVIDADES MANUALES
// ============================================================

async function obtenerIndicadoresMensualesManuales(
    anio = anioActual()
) {

    anio = validarAnio(anio);

    const [filas] = await pool.query(
        `
        SELECT

            MONTH(fecha) AS mes,

            COUNT(*) AS total,

            COALESCE(
                SUM(
                    estado = 'PENDIENTE'
                ),
                0
            ) AS pendientes,

            COALESCE(
                SUM(
                    estado = 'EN_PROCESO'
                ),
                0
            ) AS enProceso,

            COALESCE(
                SUM(
                    estado = 'COMPLETADA'
                ),
                0
            ) AS completadas,

            COALESCE(
                SUM(
                    estado = 'CANCELADA'
                ),
                0
            ) AS canceladas

        FROM transformin_actividades

        WHERE YEAR(fecha) = ?

        GROUP BY MONTH(fecha)

        ORDER BY mes ASC
        `,
        [anio]
    );

    const registros = new Map(

        filas.map(fila => [

            Number(fila.mes),

            fila

        ])

    );

    return MESES.map(
        (nombre, indice) => {

            const mes = indice + 1;

            const datos =
                registros.get(mes) || {};

            const total =
                numero(datos.total);

            const completadas =
                numero(datos.completadas);

            return {

                mes,

                nombre,

                total,

                programadas: total,

                completadas,

                realizadas: completadas,

                pendientes:
                    numero(datos.pendientes),

                enProceso:
                    numero(datos.enProceso),

                canceladas:
                    numero(datos.canceladas),

                porcentaje:
                    porcentaje(
                        completadas,
                        total
                    )

            };

        }
    );

}

// ============================================================
// 30. RUTA DE INDICADORES MANUALES
// ============================================================

router.get(
    "/api/indicadores/manuales",

    ejecutar(async (req, res) => {

        const anio = validarAnio(
            req.query.anio
        );

        const [

            indicadores,

            mensual

        ] = await Promise.all([

            obtenerIndicadoresManuales(
                anio
            ),

            obtenerIndicadoresMensualesManuales(
                anio
            )

        ]);

        res.json({

            success: true,

            anio,

            indicadores,

            mensual

        });

    })
);

// ============================================================
// 31. CONSULTAR CRONOGRAMA INSTITUCIONAL
// ============================================================

async function consultarCronogramaInstitucional(req, res) {

    const anio = validarAnio(req.query.anio);

    const resultado = await excelService
        .obtenerCronograma(anio);

    const actividades = (resultado?.actividades || []).map(a => ({
        ...a, actividadId: a.id, actividad_institucional_id: a.id,
        fechaSugerida: fechasService.obtenerFechaSugerida(a.actividad, anio),
        semanas: (a.semanas || []).map(s => ({...s, semanaId: s.id, semana_id: s.id,
            actividad_institucional_id: a.id}))
    }));

    res.json({

        ...resultado,

        success: true,

        anio,

        codigo: CODIGO_FORMATO,

        total: actividades.length,

        actividades

    });

}

router.get(
    [
        "/api/institucional",
        "/api/ft-sst-147"
    ],
    ejecutar(consultarCronogramaInstitucional)
);

// ============================================================
// 32. CONSULTAR ACTIVIDAD INSTITUCIONAL INDIVIDUAL
// ============================================================

async function obtenerActividadInstitucional(
    conexion,
    id,
    bloquear = false
) {

    id = validarId(id);

    const [filas] = await conexion.query(
        `
        SELECT

            a.*,

            c.anio,

            c.codigo_formato,

            c.version_formato,

            c.estado AS estado_cronograma,

            DATE_FORMAT(
                a.fecha_exacta,
                '%Y-%m-%d'
            ) AS fecha_exacta

        FROM transformin_ft147_actividades a

        INNER JOIN transformin_ft147_cronogramas c

            ON c.id = a.cronograma_id

        WHERE a.id = ?

        LIMIT 1

        ${bloquear ? "FOR UPDATE" : ""}
        `,
        [id]
    );

    if (!filas.length) {

        throw errorValidacion(
            "La actividad institucional no existe.",
            404
        );

    }

    const actividad = filas[0];

    const [semanas] = await conexion.query(
        `
        SELECT

            id,

            actividad_id,

            mes,

            semana_mes,

            marca_original,

            programada,

            estado,

            DATE_FORMAT(
                fecha_programada,
                '%Y-%m-%d'
            ) AS fecha_programada,

            DATE_FORMAT(
                fecha_realizacion,
                '%Y-%m-%d'
            ) AS fecha_realizacion,

            observaciones,

            actualizado_por,

            created_at,

            updated_at

        FROM transformin_ft147_semanas

        WHERE actividad_id = ?

        ORDER BY
            mes ASC,
            semana_mes ASC

        ${bloquear ? "FOR UPDATE" : ""}
        `,
        [id]
    );

    const programaciones = semanas.map(semana => ({

        ...semana,

        mes: Number(semana.mes),

        semana_mes: Number(semana.semana_mes),

        programada: Number(semana.programada),

        nombre_mes: MESES[Number(semana.mes) - 1]

    }));

    const programadas = programaciones.filter(
        semana => semana.programada === 1
    );

    const completadas = programadas.filter(
        semana => semana.estado === "COMPLETADA"
    );

    const canceladas = programadas.filter(
        semana => semana.estado === "CANCELADA"
    );

    const pendientes = programadas.filter(
        semana => ![
            "COMPLETADA",
            "CANCELADA"
        ].includes(semana.estado)
    );

    return {

        ...actividad,

        anio: Number(actividad.anio),

        origen: "FT147",

        nombre:
            actividad.equipo ||
            actividad.actividad,

        fecha:
            actividad.fecha_exacta || null,

        observaciones:
            actividad.notas || null,

        totalProgramadas:
            programadas.length,

        totalCompletadas:
            completadas.length,

        totalPendientes:
            pendientes.length,

        totalCanceladas:
            canceladas.length,

        porcentaje: porcentaje(
            completadas.length,
            programadas.length
        ),

        semanas: programaciones

    };

}

// ============================================================
// 33. VALIDAR ESTADO DEL CRONOGRAMA
// ============================================================

function verificarCronogramaEditable(actividad) {

    if (!actividad) {

        throw errorValidacion(
            "No se encontró el cronograma institucional.",
            404
        );

    }

    if (actividad.estado_cronograma === "CERRADO") {

        throw errorValidacion(
            "El cronograma está cerrado y no admite modificaciones.",
            409
        );

    }

    return true;

}

// ============================================================
// 34. CONSULTAR ACTIVIDAD INSTITUCIONAL POR ID
// ============================================================

router.get(
    [
        "/api/institucional/:id",
        "/api/ft-sst-147/:id"
    ],

    ejecutar(async (req, res) => {

        const id = validarId(req.params.id);

        const actividad =
            await obtenerActividadInstitucional(
                pool,
                id
            );

        res.json({

            success: true,

            actividad

        });

    })
);

// ============================================================
// 35. VALIDAR INFORMACIÓN INSTITUCIONAL
// ============================================================

function normalizarActividadInstitucional(
    anterior,
    datos = {}
) {

    if (
        !datos ||
        typeof datos !== "object" ||
        Array.isArray(datos)
    ) {

        throw errorValidacion(
            "Los datos institucionales no son válidos."
        );

    }

    function valor(campos, defecto) {

        const resultado = obtenerCampo(
            datos,
            ...campos
        );

        return resultado === undefined
            ? defecto
            : resultado;

    }

    const actividad = {

        equipo: normalizarTexto(
            valor(
                ["equipo", "nombre"],
                anterior.equipo
            ),
            255
        ),

        actividad: normalizarTexto(
            valor(
                ["actividad"],
                anterior.actividad
            ),
            255
        ),

        descripcion: normalizarTexto(
            valor(
                ["descripcion"],
                anterior.descripcion
            ),
            10000
        ),

        frecuencia: normalizarTexto(
            valor(
                ["frecuencia"],
                anterior.frecuencia
            ),
            100
        ),

        responsable: normalizarTexto(
            valor(
                ["responsable"],
                anterior.responsable
            ),
            500
        ),

        tipo: validarTipoInstitucional(
            valor(
                ["tipo"],
                anterior.tipo || "OTRO"
            )
        ),

        prioridad: validarPrioridad(
            valor(
                ["prioridad"],
                anterior.prioridad || "MEDIA"
            )
        ),

        fecha_exacta: valor(
            ["fecha_exacta", "fechaExacta", "fecha"],
            anterior.fecha_exacta
        ) || null,

        notas: normalizarTexto(
            valor(
                ["notas", "observaciones"],
                anterior.notas
            ),
            10000
        )

    };

    if (!actividad.equipo) {

        throw errorValidacion(
            "El nombre del equipo o evento es obligatorio."
        );

    }

    if (!actividad.actividad) {

        throw errorValidacion(
            "La actividad institucional es obligatoria."
        );

    }

    if (actividad.fecha_exacta) {

        if (!fechaValida(actividad.fecha_exacta)) {

            throw errorValidacion(
                "La fecha exacta no es válida."
            );

        }

        if (
            Number(actividad.fecha_exacta.slice(0, 4)) !==
            Number(anterior.anio)
        ) {

            throw errorValidacion(
                "La fecha debe pertenecer al año del cronograma."
            );

        }

    }

    // El estado general depende de las semanas.
    // No se modifica directamente desde este formulario.

    if (
        datos.estado !== undefined &&
        normalizarEnum(datos.estado) !== anterior.estado
    ) {

        throw errorValidacion(
            "El estado institucional debe actualizarse desde el seguimiento semanal."
        );

    }

    return actividad;

}

// ============================================================
// 36. DETECTAR CAMBIOS INSTITUCIONALES
// ============================================================

function detectarCambiosInstitucionales(
    anterior,
    nueva
) {

    const campos = [

        "equipo",
        "actividad",
        "descripcion",
        "frecuencia",
        "responsable",
        "tipo",
        "prioridad",
        "fecha_exacta",
        "notas"

    ];

    return campos.filter(campo =>

        String(anterior[campo] ?? "") !==
        String(nueva[campo] ?? "")

    );

}

// ============================================================
// 37. EDITAR ACTIVIDAD INSTITUCIONAL
// ============================================================

async function editarActividadInstitucional(req, res) {

    const id = validarId(req.params.id);

    const resultado = await transaccion(
        async conexion => {

            const anterior =
                await obtenerActividadInstitucional(
                    conexion,
                    id,
                    true
                );

            verificarCronogramaEditable(anterior);

            const datos = {...(req.body || {})};
            if (datos.restablecerFecha === true) {
                const sugerida = fechasService.obtenerFechaSugerida(anterior.actividad, Number(anterior.anio));
                if (!sugerida) throw errorValidacion("La actividad no tiene fecha sugerida.");
                datos.fecha_exacta = sugerida;
            }
            const actividad =
                normalizarActividadInstitucional(
                    anterior,
                    datos
                );

            const cambios =
                detectarCambiosInstitucionales(
                    anterior,
                    actividad
                );

            if (!cambios.length) {

                return {

                    modificada: false,

                    actividad: anterior,

                    cambios: []

                };

            }

            await conexion.query(
                `
                UPDATE transformin_ft147_actividades

                SET

                    equipo = ?,

                    actividad = ?,

                    descripcion = ?,

                    frecuencia = ?,

                    responsable = ?,

                    tipo = ?,

                    prioridad = ?,

                    fecha_exacta = ?,

                    notas = ?

                WHERE id = ?
                `,
                [

                    actividad.equipo,

                    actividad.actividad,

                    actividad.descripcion || null,

                    actividad.frecuencia || null,

                    actividad.responsable || null,

                    actividad.tipo,

                    actividad.prioridad,

                    actividad.fecha_exacta,

                    actividad.notas || null,

                    id

                ]
            );

            const nueva =
                await obtenerActividadInstitucional(
                    conexion,
                    id
                );

            const accion =

                anterior.fecha_exacta !== nueva.fecha_exacta

                    ? "REPROGRAMACION"

                    : "EDICION";

            await registrarHistorial(
                conexion,
                {

                    origen: "FT147",

                    actividadId: id,

                    accion,

                    anterior,

                    nuevo: nueva,

                    descripcion:
                        "Edición institucional. Campos modificados: " +
                        cambios.join(", "),

                    usuarioId:
                        req.usuarioCronograma.id

                }
            );

            return {

                modificada: true,

                actividad: nueva,

                cambios

            };

        }
    );

    const mensaje = resultado.modificada

        ? "Actividad institucional actualizada correctamente."

        : "No se encontraron cambios para guardar.";

    res.json({

        success: true,

        ...resultado,

        message: mensaje,

        mensaje

    });

}

// ============================================================
// 38. RUTAS DE EDICIÓN INSTITUCIONAL
// ============================================================

router.put(
    [
        "/api/institucional/:id",
        "/api/ft-sst-147/:id"
    ],
    ejecutar(editarActividadInstitucional)
);

router.patch(
    [
        "/api/institucional/:id",
        "/api/ft-sst-147/:id"
    ],
    ejecutar(editarActividadInstitucional)
);

// ============================================================
// 38A. ASIGNACIÓN INICIAL DE FECHAS FALTANTES (ACCIÓN EXPLÍCITA)
// ============================================================
router.post("/api/institucional/fechas/asignar", ejecutar(async (req, res) => {
    const anio = validarAnio(req.body?.anio);
    const resultado = await transaccion(async conexion => {
        const [filas] = await conexion.query(`
            SELECT a.id FROM transformin_ft147_actividades a
            JOIN transformin_ft147_cronogramas c ON c.id = a.cronograma_id
            WHERE c.anio = ? AND c.codigo_formato = ? AND c.estado <> 'CERRADO'
              AND a.fecha_exacta IS NULL AND a.estado IN ('PENDIENTE','EN_PROCESO')
            ORDER BY a.id FOR UPDATE`, [anio, CODIGO_FORMATO]);
        let asignadas = 0, omitidas = 0;
        for (const fila of filas) {
            const anterior = await obtenerActividadInstitucional(conexion, fila.id, true);
            verificarCronogramaEditable(anterior);
            const fecha = fechasService.obtenerFechaSugerida(anterior.actividad, anio);
            const [historial] = await conexion.query(`SELECT id FROM transformin_actividades_historial
                WHERE origen = 'FT147' AND actividad_id = ? AND accion = 'REPROGRAMACION' LIMIT 1`, [fila.id]);
            if (!fecha || historial.length || anterior.fecha_exacta) { omitidas++; continue; }
            await conexion.query("UPDATE transformin_ft147_actividades SET fecha_exacta = ? WHERE id = ?", [fecha, fila.id]);
            const nuevo = await obtenerActividadInstitucional(conexion, fila.id);
            await registrarHistorial(conexion, {origen: "FT147", actividadId: fila.id,
                accion: "REPROGRAMACION", anterior, nuevo, descripcion: "Asignación inicial de fecha sugerida",
                usuarioId: req.usuarioCronograma.id});
            asignadas++;
        }
        return {asignadas, omitidas};
    });
    res.json({success: true, anio, ...resultado});
}));

// ============================================================
// 39. CALCULAR ESTADO GENERAL INSTITUCIONAL
// ============================================================

function calcularEstadoInstitucional(semanas = []) {

    const programadas = semanas.filter(
        semana => Number(semana.programada) === 1
    );

    if (!programadas.length) {

        return "PENDIENTE";

    }

    const todasCompletadas = programadas.every(
        semana => semana.estado === "COMPLETADA"
    );

    if (todasCompletadas) {

        return "COMPLETADA";

    }

    const todasCanceladas = programadas.every(
        semana => semana.estado === "CANCELADA"
    );

    if (todasCanceladas) {

        return "CANCELADA";

    }

    const tieneAvance = programadas.some(
        semana => [

            "COMPLETADA",

            "EN_PROCESO",

            "CANCELADA"

        ].includes(semana.estado)
    );

    return tieneAvance

        ? "EN_PROCESO"

        : "PENDIENTE";

}

// ============================================================
// 40. ACTUALIZAR ESTADO GENERAL INSTITUCIONAL
// ============================================================

async function actualizarEstadoInstitucional(
    conexion,
    actividadId
) {

    const [semanas] = await conexion.query(
        `
        SELECT

            id,

            programada,

            estado

        FROM transformin_ft147_semanas

        WHERE actividad_id = ?

        FOR UPDATE
        `,
        [actividadId]
    );

    const estadoGeneral =
        calcularEstadoInstitucional(semanas);

    await conexion.query(
        `
        UPDATE transformin_ft147_actividades

        SET estado = ?

        WHERE id = ?
        `,
        [

            estadoGeneral,

            actividadId

        ]
    );

    return estadoGeneral;

}

// ============================================================
// 41. CONSULTAR PROGRAMACIÓN SEMANAL
// ============================================================

router.get(
    [
        "/api/institucional/:id/semanas",
        "/api/ft-sst-147/:id/semanas"
    ],

    ejecutar(async (req, res) => {

        const id = validarId(req.params.id);

        const actividad =
            await obtenerActividadInstitucional(
                pool,
                id
            );

        res.json({

            success: true,

            actividad,

            total: actividad.semanas.length,

            semanas: actividad.semanas,

            indicadores: {

                programadas:
                    actividad.totalProgramadas,

                completadas:
                    actividad.totalCompletadas,

                pendientes:
                    actividad.totalPendientes,

                canceladas:
                    actividad.totalCanceladas,

                porcentaje:
                    actividad.porcentaje

            }

        });

    })
);

// ============================================================
// 42. CONSULTAR UNA SEMANA ESPECÍFICA
// ============================================================

async function obtenerSemanaInstitucional(
    conexion,
    actividadId,
    semanaId,
    bloquear = false
) {

    actividadId = validarId(actividadId);

    semanaId = validarId(semanaId);

    const [filas] = await conexion.query(
        `
        SELECT

            id,

            actividad_id,

            mes,

            semana_mes,

            marca_original,

            programada,

            estado,

            DATE_FORMAT(
                fecha_programada,
                '%Y-%m-%d'
            ) AS fecha_programada,

            DATE_FORMAT(
                fecha_realizacion,
                '%Y-%m-%d'
            ) AS fecha_realizacion,

            observaciones,

            actualizado_por,

            created_at,

            updated_at

        FROM transformin_ft147_semanas

        WHERE id = ?

        AND actividad_id = ?

        LIMIT 1

        ${bloquear ? "FOR UPDATE" : ""}
        `,
        [

            semanaId,

            actividadId

        ]
    );

    if (!filas.length) {

        throw errorValidacion(
            "La programación semanal no existe.",
            404
        );

    }

    return {

        ...filas[0],

        mes: Number(filas[0].mes),

        semana_mes: Number(filas[0].semana_mes),

        programada: Number(filas[0].programada)

    };

}

// ============================================================
// 43. CAMBIAR ESTADO DE PROGRAMACIÓN SEMANAL
// ============================================================

async function cambiarEstadoSemanaInstitucional(
    actividadId,
    semanaId,
    datos,
    usuarioId
) {

    actividadId = validarId(actividadId);

    semanaId = validarId(semanaId);

    const estado = validarEstado(
        obtenerCampo(
            datos,
            "estado",
            "nuevoEstado",
            "nuevo_estado"
        )
    );

    return transaccion(
        async conexion => {

            const actividad =
                await obtenerActividadInstitucional(
                    conexion,
                    actividadId,
                    true
                );

            verificarCronogramaEditable(actividad);

            const anterior =
                await obtenerSemanaInstitucional(
                    conexion,
                    actividadId,
                    semanaId,
                    true
                );

            if (anterior.programada !== 1) {

                throw errorValidacion(
                    "La semana debe estar programada antes de registrar su cumplimiento.",
                    409
                );

            }

            if (

                anterior.estado === "CANCELADA" &&

                estado === "COMPLETADA"

            ) {

                throw errorValidacion(
                    "Debes reabrir la programación antes de completarla.",
                    409
                );

            }

            let fechaRealizacion = null;

            if (estado === "COMPLETADA") {

                const fechaRecibida = obtenerCampo(
                    datos,
                    "fechaRealizacion",
                    "fecha_realizacion"
                );

                fechaRealizacion =

                    fechaRecibida ||

                    (
                        anterior.estado === "COMPLETADA"
                            ? anterior.fecha_realizacion
                            : null
                    ) ||

                    fechaColombia();

                if (!fechaValida(fechaRealizacion)) {

                    throw errorValidacion(
                        "La fecha de realización no es válida."
                    );

                }

                if (fechaRealizacion > fechaColombia()) {

                    throw errorValidacion(
                        "La fecha de realización no puede ser futura."
                    );

                }

            }

            const observaciones =

                datos.observaciones === undefined

                    ? anterior.observaciones

                    : normalizarTexto(
                        datos.observaciones,
                        10000
                    ) || null;

            const mismoEstado =

                anterior.estado === estado;

            const mismaFecha =

                anterior.fecha_realizacion === fechaRealizacion;

            const mismasObservaciones =

                String(anterior.observaciones ?? "") ===
                String(observaciones ?? "");

            if (

                mismoEstado &&

                mismaFecha &&

                mismasObservaciones

            ) {

                return {

                    modificada: false,

                    estado,

                    estadoGeneral: actividad.estado,

                    fechaRealizacion,

                    semana: anterior,

                    actividad

                };

            }

            await conexion.query(
                `
                UPDATE transformin_ft147_semanas

                SET

                    estado = ?,

                    fecha_realizacion = ?,

                    observaciones = ?,

                    actualizado_por = ?

                WHERE id = ?

                AND actividad_id = ?
                `,
                [

                    estado,

                    fechaRealizacion,

                    observaciones,

                    usuarioId,

                    semanaId,

                    actividadId

                ]
            );

            const estadoGeneral =
                await actualizarEstadoInstitucional(
                    conexion,
                    actividadId
                );

            const nuevaSemana =
                await obtenerSemanaInstitucional(
                    conexion,
                    actividadId,
                    semanaId
                );

            const actividadActualizada =
                await obtenerActividadInstitucional(
                    conexion,
                    actividadId
                );

            let accion = determinarAccion(
                anterior,
                nuevaSemana
            );

            if (

                [
                    "COMPLETADA",
                    "CANCELADA"
                ].includes(anterior.estado) &&

                [
                    "PENDIENTE",
                    "EN_PROCESO"
                ].includes(estado)

            ) {

                accion = "RESTAURACION";

            }

            await registrarHistorial(
                conexion,
                {

                    origen: "FT147",

                    actividadId,

                    accion,

                    anterior,

                    nuevo: nuevaSemana,

                    descripcion:
                        `Seguimiento de ${MESES[anterior.mes - 1]}, ` +
                        `semana ${anterior.semana_mes}: ` +
                        `${anterior.estado} a ${estado}.`,

                    usuarioId

                }
            );

            return {

                modificada: true,

                estado,

                estadoGeneral,

                fechaRealizacion,

                semana: nuevaSemana,

                actividad: actividadActualizada

            };

        }
    );

}

// ============================================================
// 44. RUTAS PARA ACTUALIZAR ESTADO SEMANAL
// ============================================================

async function actualizarEstadoSemanal(req, res) {

    const actividadId = validarId(
        req.params.id
    );

    const semanaId = validarId(
        req.params.semanaId
    );

    const resultado =
        await cambiarEstadoSemanaInstitucional(

            actividadId,

            semanaId,

            req.body || {},

            req.usuarioCronograma.id

        );

    const mensaje = resultado.modificada

        ? "Seguimiento semanal actualizado correctamente."

        : "No se encontraron cambios en el seguimiento.";

    res.json({

        success: true,

        ...resultado,

        message: mensaje,

        mensaje

    });

}

router.patch(
    [
        "/api/institucional/:id/semanas/:semanaId",
        "/api/ft-sst-147/:id/semanas/:semanaId"
    ],
    ejecutar(actualizarEstadoSemanal)
);

router.put(
    [
        "/api/institucional/:id/semanas/:semanaId",
        "/api/ft-sst-147/:id/semanas/:semanaId"
    ],
    ejecutar(actualizarEstadoSemanal)
);

// ============================================================
// 45. MARCAR SEMANA COMO COMPLETADA
// ============================================================

async function completarSemanaInstitucional(req, res) {

    const resultado =
        await cambiarEstadoSemanaInstitucional(

            req.params.id,

            req.params.semanaId,

            {

                ...(req.body || {}),

                estado: "COMPLETADA"

            },

            req.usuarioCronograma.id

        );

    res.json({

        success: true,

        ...resultado,

        completada: true,

        message:
            "Programación semanal marcada como completada.",

        mensaje:
            "Programación semanal marcada como completada."

    });

}

router.patch(
    [
        "/api/institucional/:id/semanas/:semanaId/completar",
        "/api/ft-sst-147/:id/semanas/:semanaId/completar"
    ],
    ejecutar(completarSemanaInstitucional)
);

// ============================================================
// 46. VALIDAR FECHA DE PROGRAMACIÓN
// ============================================================

function validarFechaProgramacion(
    fecha,
    anio,
    mes
) {

    if (fecha === null || fecha === "") {

        return null;

    }

    if (!fechaValida(fecha)) {

        throw errorValidacion(
            "La fecha de programación no es válida."
        );

    }

    const anioFecha = Number(
        fecha.slice(0, 4)
    );

    const mesFecha = Number(
        fecha.slice(5, 7)
    );

    if (anioFecha !== Number(anio)) {

        throw errorValidacion(
            "La fecha debe pertenecer al año del cronograma."
        );

    }

    if (mesFecha !== Number(mes)) {

        throw errorValidacion(
            "La fecha debe pertenecer al mes seleccionado."
        );

    }

    return fecha;

}

// ============================================================
// 47. CREAR O MODIFICAR PROGRAMACIÓN SEMANAL
// ============================================================

async function guardarProgramacionSemanal(req, res) {

    const actividadId = validarId(
        req.params.id
    );

    const datos = req.body || {};

    const mes = validarMes(datos.mes);

    const semanaMes = validarSemana(

        mes,

        obtenerCampo(
            datos,
            "semanaMes",
            "semana_mes",
            "semana"
        )

    );

    const programadaRecibida = obtenerCampo(
        datos,
        "programada",
        "activa"
    );

    const programada =

        programadaRecibida === undefined

            ? 1

            : normalizarBooleano(programadaRecibida);

    const resultado = await transaccion(
        async conexion => {

            const actividad =
                await obtenerActividadInstitucional(
                    conexion,
                    actividadId,
                    true
                );

            verificarCronogramaEditable(actividad);

            const [filas] = await conexion.query(
                `
                SELECT

                    id,

                    actividad_id,

                    mes,

                    semana_mes,

                    marca_original,

                    programada,

                    estado,

                    DATE_FORMAT(
                        fecha_programada,
                        '%Y-%m-%d'
                    ) AS fecha_programada,

                    DATE_FORMAT(
                        fecha_realizacion,
                        '%Y-%m-%d'
                    ) AS fecha_realizacion,

                    observaciones

                FROM transformin_ft147_semanas

                WHERE actividad_id = ?

                AND mes = ?

                AND semana_mes = ?

                LIMIT 1

                FOR UPDATE
                `,
                [

                    actividadId,

                    mes,

                    semanaMes

                ]
            );

            const anterior = filas[0] || null;

            const fechaRecibida = obtenerCampo(
                datos,
                "fechaProgramada",
                "fecha_programada",
                "fecha"
            );

            const fechaProgramada = programada

                ? validarFechaProgramacion(

                    fechaRecibida === undefined

                        ? anterior?.fecha_programada || null

                        : fechaRecibida,

                    actividad.anio,

                    mes

                )

                : null;

            if (!anterior && !programada) {

                return {

                    modificada: false,

                    creada: false,

                    actividad,

                    semana: null,

                    estadoGeneral: actividad.estado

                };

            }

            const mismaProgramacion = anterior &&

                Number(anterior.programada) === programada &&

                anterior.fecha_programada === fechaProgramada;

            if (mismaProgramacion) {

                return {

                    modificada: false,

                    creada: false,

                    actividad,

                    semana: anterior,

                    estadoGeneral: actividad.estado

                };

            }

            if (

                anterior &&

                [
                    "COMPLETADA",
                    "CANCELADA"
                ].includes(anterior.estado)

            ) {

                throw errorValidacion(
                    "Debes reabrir la programación antes de modificarla.",
                    409
                );

            }

            // Las marcas X importadas se conservan.
            // Solo se convierten en P cuando el administrador
            // activa expresamente la programación.

            const marcaOriginal = programada

                ? "P"

                : (
                    anterior?.marca_original === "X"
                        ? "X"
                        : null
                );

            const estado =

                programada &&

                anterior?.estado === "EN_PROCESO"

                    ? "EN_PROCESO"

                    : "PENDIENTE";

            let semanaId;

            if (anterior) {

                semanaId = anterior.id;

                await conexion.query(
                    `
                    UPDATE transformin_ft147_semanas

                    SET

                        marca_original = ?,

                        programada = ?,

                        estado = ?,

                        fecha_programada = ?,

                        fecha_realizacion = NULL,

                        actualizado_por = ?

                    WHERE id = ?

                    AND actividad_id = ?
                    `,
                    [

                        marcaOriginal,

                        programada,

                        estado,

                        fechaProgramada,

                        req.usuarioCronograma.id,

                        semanaId,

                        actividadId

                    ]
                );

            } else {

                const [insercion] =
                    await conexion.query(
                        `
                        INSERT INTO transformin_ft147_semanas (

                            actividad_id,

                            mes,

                            semana_mes,

                            marca_original,

                            programada,

                            estado,

                            fecha_programada,

                            actualizado_por

                        )

                        VALUES (
                            ?, ?, ?, ?, ?, ?, ?, ?
                        )
                        `,
                        [

                            actividadId,

                            mes,

                            semanaMes,

                            marcaOriginal,

                            programada,

                            estado,

                            fechaProgramada,

                            req.usuarioCronograma.id

                        ]
                    );

                semanaId = insercion.insertId;

            }

            const estadoGeneral =
                await actualizarEstadoInstitucional(
                    conexion,
                    actividadId
                );

            const nuevaSemana =
                await obtenerSemanaInstitucional(
                    conexion,
                    actividadId,
                    semanaId
                );

            const actividadActualizada =
                await obtenerActividadInstitucional(
                    conexion,
                    actividadId
                );

            await registrarHistorial(
                conexion,
                {

                    origen: "FT147",

                    actividadId,

                    accion: anterior

                        ? "REPROGRAMACION"

                        : "CREACION",

                    anterior,

                    nuevo: nuevaSemana,

                    descripcion:

                        `Programación institucional de ${MESES[mes - 1]}, ` +

                        `semana ${semanaMes}. ` +

                        (
                            programada

                                ? "Programación activa."

                                : "Programación desactivada."
                        ),

                    usuarioId:
                        req.usuarioCronograma.id

                }
            );

            return {

                modificada: true,

                creada: !anterior,

                semana: nuevaSemana,

                actividad: actividadActualizada,

                estadoGeneral

            };

        }
    );

    const mensaje = resultado.modificada

        ? "Programación semanal guardada correctamente."

        : "No se encontraron cambios en la programación.";

    res.status(
        resultado.creada ? 201 : 200
    ).json({

        success: true,

        ...resultado,

        message: mensaje,

        mensaje

    });

}

// ============================================================
// 48. RUTAS DE PROGRAMACIÓN SEMANAL
// ============================================================

router.put(
    [
        "/api/institucional/:id/programacion",
        "/api/ft-sst-147/:id/programacion"
    ],
    ejecutar(guardarProgramacionSemanal)
);

router.post(
    [
        "/api/institucional/:id/programacion",
        "/api/ft-sst-147/:id/programacion"
    ],
    ejecutar(guardarProgramacionSemanal)
);

// ============================================================
// 49. DESACTIVAR PROGRAMACIÓN SEMANAL
// ============================================================

router.delete(
    [
        "/api/institucional/:id/semanas/:semanaId",
        "/api/ft-sst-147/:id/semanas/:semanaId"
    ],

    ejecutar(async (req, res) => {

        const actividadId = validarId(
            req.params.id
        );

        const semanaId = validarId(
            req.params.semanaId
        );

        const resultado = await transaccion(
            async conexion => {

                const actividad =
                    await obtenerActividadInstitucional(
                        conexion,
                        actividadId,
                        true
                    );

                verificarCronogramaEditable(actividad);

                const anterior =
                    await obtenerSemanaInstitucional(
                        conexion,
                        actividadId,
                        semanaId,
                        true
                    );

                if (

                    [
                        "COMPLETADA",
                        "CANCELADA"
                    ].includes(anterior.estado)

                ) {

                    throw errorValidacion(
                        "Debes reabrir la programación antes de desactivarla.",
                        409
                    );

                }

                if (anterior.programada === 0) {

                    return {

                        modificada: false,

                        actividad,

                        semana: anterior

                    };

                }

                // No se elimina físicamente el registro.
                // Se conserva la trazabilidad institucional.

                await conexion.query(
                    `
                    UPDATE transformin_ft147_semanas

                    SET

                        programada = 0,

                        estado = 'PENDIENTE',

                        marca_original = CASE

                            WHEN marca_original = 'X'
                                THEN 'X'

                            ELSE NULL

                        END,

                        fecha_programada = NULL,

                        fecha_realizacion = NULL,

                        actualizado_por = ?

                    WHERE id = ?

                    AND actividad_id = ?
                    `,
                    [

                        req.usuarioCronograma.id,

                        semanaId,

                        actividadId

                    ]
                );

                await actualizarEstadoInstitucional(
                    conexion,
                    actividadId
                );

                const nuevaSemana =
                    await obtenerSemanaInstitucional(
                        conexion,
                        actividadId,
                        semanaId
                    );

                await registrarHistorial(
                    conexion,
                    {

                        origen: "FT147",

                        actividadId,

                        accion: "REPROGRAMACION",

                        anterior,

                        nuevo: nuevaSemana,

                        descripcion:
                            `Desactivación de la programación de ` +
                            `${MESES[anterior.mes - 1]}, ` +
                            `semana ${anterior.semana_mes}.`,

                        usuarioId:
                            req.usuarioCronograma.id

                    }
                );

                const actividadActualizada =
                    await obtenerActividadInstitucional(
                        conexion,
                        actividadId
                    );

                return {

                    modificada: true,

                    actividad: actividadActualizada,

                    semana: nuevaSemana

                };

            }
        );

        res.json({

            success: true,

            ...resultado,

            message:
                "Programación semanal desactivada correctamente.",

            mensaje:
                "Programación semanal desactivada correctamente."

        });

    })
);

// ============================================================
// 50. PREVISUALIZAR ARCHIVO EXCEL CORPORATIVO
// ============================================================

async function previsualizarExcel(req, res) {

    const archivo = obtenerArchivoExcel(req);

    const anio = obtenerAnioImportacion(req);

    const resultado = await excelService
        .previsualizarExcel(

            archivo.buffer,

            archivo.originalname,

            anio

        );

    const registros =

        resultado.registros ||

        resultado.actividades ||

        [];

    const errores = resultado.errores || [];

    const advertencias =
        resultado.advertencias || [];

    const totalErrores = numero(

        resultado.totalErrores ??

        errores.length

    );

    const totalValidos = numero(

        resultado.totalValidos ??

        registros.length

    );

    const importacionValida =

        resultado.success !== false &&

        resultado.valido !== false &&

        totalErrores === 0 &&

        totalValidos > 0;

    res.json({

        ...resultado,

        success: resultado.success !== false,

        valido: importacionValida,

        importacionValida,

        codigo: CODIGO_FORMATO,

        anio,

        nombreArchivo: archivo.originalname,

        registros,

        actividades: registros,

        errores,

        advertencias,

        totalRegistros: numero(

            resultado.totalRegistros ??

            registros.length

        ),

        totalValidos,

        totalErrores,

        totalAdvertencias: numero(

            resultado.totalAdvertencias ??

            advertencias.length

        ),

        message: importacionValida

            ? "Archivo Excel validado correctamente."

            : "Revisa los resultados de validación antes de importar.",

        mensaje: importacionValida

            ? "Archivo Excel validado correctamente."

            : "Revisa los resultados de validación antes de importar."

    });

}

// ============================================================
// 51. RUTAS DE PREVISUALIZACIÓN EXCEL
// ============================================================

router.post(
    [
        "/api/excel/preview",
        "/api/ft-sst-147/preview",
        "/api/ft-sst-147/excel/preview"
    ],

    upload.single("archivo"),

    ejecutar(previsualizarExcel)
);

// ============================================================
// 52. IMPORTAR CRONOGRAMA CORPORATIVO
// ============================================================

async function importarExcel(req, res) {

    const archivo = obtenerArchivoExcel(req);

    const anio = obtenerAnioImportacion(req);

    // El servicio vuelve a validar el archivo y utiliza
    // una transacción antes de modificar la base de datos.

    const resultado = await excelService
        .importarExcel(

            archivo.buffer,

            archivo.originalname,

            anio,

            req.usuarioCronograma.id

        );

    const importados = numero(

        resultado.importados ??

        resultado.insertados ??

        0

    );

    const actualizados = numero(
        resultado.actualizados
    );

    const duplicados = numero(
        resultado.duplicados
    );

    const omitidos = numero(
        resultado.omitidos
    );

    const mensaje =

        resultado.message ||

        resultado.mensaje ||

        "Importación del cronograma procesada correctamente.";

    res.status(

        resultado.success === false

            ? 422

            : 200

    ).json({

        ...resultado,

        success: resultado.success !== false,

        anio,

        codigo: CODIGO_FORMATO,

        importados,

        insertados: importados,

        actualizados,

        duplicados,

        omitidos,

        message: mensaje,

        mensaje

    });

}

// ============================================================
// 53. RUTAS DE IMPORTACIÓN EXCEL
// ============================================================

router.post(
    [
        "/api/excel/importar",
        "/api/ft-sst-147/importar",
        "/api/ft-sst-147/excel/importar"
    ],

    upload.single("archivo"),

    ejecutar(importarExcel)
);

// ============================================================
// 54. EXPORTAR CRONOGRAMA EN FORMATO FT-SST-147
// ============================================================

async function exportarExcel(req, res) {

    const anio = validarAnio(
        req.query.anio
    );

    const resultado = await excelService
        .exportarExcel(anio);

    const buffer = Buffer.isBuffer(resultado)

        ? resultado

        : resultado?.buffer;

    if (

        !Buffer.isBuffer(buffer) ||

        !buffer.length

    ) {

        throw new Error(
            "El servicio no generó un archivo Excel válido."
        );

    }

    const nombreArchivo =
        `FT-SST-147-Cronograma-Transformin-${anio}.xlsx`;

    const contentType =
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

    res.setHeader(
        "Content-Type",
        contentType
    );

    res.setHeader(
        "Content-Disposition",
        `attachment; filename="${nombreArchivo}"`
    );

    res.setHeader(
        "Content-Length",
        buffer.length
    );

    res.setHeader(
        "Cache-Control",
        "no-store, private"
    );

    res.send(buffer);

}

// ============================================================
// 55. RUTAS DE EXPORTACIÓN EXCEL
// ============================================================

router.get(
    [
        "/api/excel/exportar",
        "/api/ft-sst-147/exportar",
        "/api/ft-sst-147/excel/exportar"
    ],

    ejecutar(exportarExcel)
);

// ============================================================
// 56. CONSULTAR HISTORIAL DE IMPORTACIONES
// ============================================================

async function consultarHistorialImportaciones(
    req,
    res
) {

    const anio = validarAnio(
        req.query.anio
    );

    const resultado = await excelService
        .obtenerHistorialImportaciones(anio);

    const historial = Array.isArray(resultado)

        ? resultado

        : resultado?.historial || [];

    res.json({

        success: true,

        anio,

        codigo: CODIGO_FORMATO,

        total: historial.length,

        historial

    });

}

router.get(
    [
        "/api/excel/historial",
        "/api/ft-sst-147/excel/historial"
    ],

    ejecutar(consultarHistorialImportaciones)
);

// ============================================================
// 57. CONSULTAR RESUMEN INSTITUCIONAL
// ============================================================

router.get(
    "/api/institucional/resumen/anual",

    ejecutar(async (req, res) => {

        const anio = validarAnio(
            req.query.anio
        );

        const resultado = await excelService
            .obtenerCronograma(anio);

        const actividades =
            resultado?.actividades || [];

        const resumen = {

            totalActividades:
                actividades.length,

            pendientes:
                actividades.filter(
                    actividad =>
                        actividad.estado === "PENDIENTE"
                ).length,

            enProceso:
                actividades.filter(
                    actividad =>
                        actividad.estado === "EN_PROCESO"
                ).length,

            completadas:
                actividades.filter(
                    actividad =>
                        actividad.estado === "COMPLETADA"
                ).length,

            canceladas:
                actividades.filter(
                    actividad =>
                        actividad.estado === "CANCELADA"
                ).length

        };

        res.json({

            success: true,

            anio,

            codigo: CODIGO_FORMATO,

            resumen,

            indicadores:
                resultado?.indicadores || null

        });

    })
);

// ============================================================
// 58. CONSULTAR EVENTOS INSTITUCIONALES DEL CALENDARIO
// ============================================================

router.get(
    "/api/institucional/calendario/eventos",

    ejecutar(async (req, res) => {

        const anio = validarAnio(
            req.query.anio
        );

        const mes = req.query.mes

            ? validarMes(req.query.mes)

            : null;

        const resultado = await excelService
            .obtenerCronograma(anio);

        const actividades =
            resultado?.actividades || [];

        const eventos = [];

        const eventosSinFecha = [];

        for (const actividad of actividades) {

            const semanas =
                actividad.semanas || [];

            // Mostrar la fecha exacta sin duplicar una programación semanal fechada.
            const fechaExacta = actividad.fecha_exacta || null;
            // Una referencia puede representar una única programación del mismo mes.
            const programadas = semanas.filter(s => Number(s.programada) === 1);
            const semanaReferencia = fechaValida(fechaExacta) &&
                Number(fechaExacta.slice(0, 4)) === anio &&
                programadas.length === 1 && !programadas[0].fecha_programada &&
                Number(programadas[0].mes) === Number(fechaExacta.slice(5, 7))
                ? programadas[0] : null;
            const tipo = normalizarEnum(actividad.tipo);
            const tipoCalendario = TIPOS_INSTITUCIONALES.includes(tipo) ? tipo : "OTRO";
            if (fechaValida(fechaExacta) && Number(fechaExacta.slice(0, 4)) === anio &&
                (mes === null || Number(fechaExacta.slice(5, 7)) === mes) &&
                !semanaReferencia && !semanas.some(s => Number(s.programada) === 1 && s.fecha_programada === fechaExacta)) {
                eventos.push({id: `FT147-${actividad.id}-FECHA`, actividadId: actividad.id,
                    actividad_institucional_id: actividad.id, actividad_id: actividad.id, semanaId: null, semana_id: null,
                    origen: "FT147", nombre: actividad.actividad || actividad.equipo,
                    descripcion: actividad.descripcion || "", responsable: actividad.responsable,
                    tipo: tipoCalendario, prioridad: actividad.prioridad || "MEDIA",
                    estado: actividad.estado, fecha: fechaExacta, anio,
                    mes: Number(fechaExacta.slice(5, 7)), observaciones: actividad.notas || null});
            }

            for (const semana of semanas) {

                if (Number(semana.programada) !== 1) {

                    continue;

                }



                // Se utiliza únicamente una fecha
                // registrada expresamente.
                // No se inventan fechas para las semanas.

                const fecha =
                    fechaValida(semana.fecha_programada) && Number(semana.fecha_programada.slice(0, 4)) === anio
                        ? semana.fecha_programada : (semana === semanaReferencia ? fechaExacta : null);
                const mesEvento = fecha ? Number(fecha.slice(5, 7)) : Number(semana.mes);
                if (mes !== null && mesEvento !== mes) continue;

                const evento = {

                    id:
                        `FT147-${actividad.id}-${semana.id}`,

                    actividadId:
                        actividad.id,

                    actividad_id: actividad.id,
                    actividad_institucional_id: actividad.id,
                    semana_id: semana.id,
                    semanaId:
                        semana.id,

                    origen:
                        "FT147",

                    nombre:
                        actividad.equipo ||
                        actividad.actividad,

                    descripcion:
                        actividad.descripcion ||
                        actividad.actividad,

                    responsable:
                        actividad.responsable,

                    tipo:
                        tipoCalendario,

                    prioridad:
                        actividad.prioridad || "MEDIA",

                    estado:
                        semana.estado,

                    fecha,

                    anio,

                    mes: mesEvento,
                    mesProgramacion: Number(semana.mes),

                    semanaMes:
                        Number(semana.semana_mes),

                    fechaRealizacion:
                        semana.fecha_realizacion || null,

                    observaciones:
                        semana.observaciones ||
                        actividad.notas ||
                        null,

                    vencida: Boolean(

                        fecha &&

                        fecha < fechaColombia() &&

                        ![
                            "COMPLETADA",
                            "CANCELADA"
                        ].includes(semana.estado)

                    )

                };

                if (fecha) {

                    eventos.push(evento);

                } else if (!["COMPLETADA", "CANCELADA"].includes(semana.estado)) {

                    eventosSinFecha.push({ ...evento,
                        fechaSugerida: fechasService.obtenerFechaSugerida(actividad.actividad, anio),
                        fechaExactaActividad: fechaExacta
                    });

                }

            }

        }

        eventos.sort(
            (a, b) =>
                a.fecha.localeCompare(b.fecha) ||
                a.nombre.localeCompare(b.nombre, "es")
        );

        eventosSinFecha.sort(
            (a, b) =>
                a.mes - b.mes ||
                a.semanaMes - b.semanaMes ||
                a.nombre.localeCompare(b.nombre, "es")
        );

        res.json({

            success: true,

            anio,

            mes,

            total:
                eventos.length +
                eventosSinFecha.length,

            totalConFecha:
                eventos.length,

            totalSinFecha:
                eventosSinFecha.length,

            eventos,

            eventosSinFecha

        });

    })
);

// ============================================================
// 59. CONFIGURACIÓN DE INDICADORES INSTITUCIONALES
// ============================================================

function crearIndicadorInstitucional() {

    return {

        programadas: 0,

        completadas: 0,

        realizadas: 0,

        pendientes: 0,

        enProceso: 0,

        canceladas: 0,

        sinClasificar: 0,

        sin_clasificar: 0,

        porcentaje: 0

    };

}

// ============================================================
// 60. NORMALIZAR INDICADORES INSTITUCIONALES
// ============================================================

function normalizarIndicadorInstitucional(
    datos = {}
) {

    const programadas = numero(
        datos.programadas
    );

    const completadas = numero(

        datos.completadas ??

        datos.realizadas

    );

    const sinClasificar = numero(

        datos.sinClasificar ??

        datos.sin_clasificar

    );

    return {

        programadas,

        completadas,

        realizadas: completadas,

        pendientes:
            numero(datos.pendientes),

        enProceso:
            numero(datos.enProceso),

        canceladas:
            numero(datos.canceladas),

        sinClasificar,

        sin_clasificar: sinClasificar,

        porcentaje: porcentaje(
            completadas,
            programadas
        )

    };

}

// ============================================================
// 61. OBTENER INDICADORES ANUALES INSTITUCIONALES
// ============================================================

async function obtenerIndicadoresAnuales(
    anio = anioActual()
) {

    anio = validarAnio(anio);

    const resultado = await excelService
        .obtenerCronograma(anio);

    const actividades =
        resultado?.actividades || [];

    const anual =
        crearIndicadorInstitucional();

    const mensual = MESES.map(
        (nombre, indice) => ({

            mes: indice + 1,

            nombre,

            ...crearIndicadorInstitucional()

        })
    );

    const hoy = fechaColombia();

    const anioHoy = Number(
        hoy.slice(0, 4)
    );

    const mesHoy = Number(
        hoy.slice(5, 7)
    );

    const cumplimientoAlCorte = {

        fecha: hoy,

        programadas: 0,

        completadas: 0,

        realizadas: 0,

        pendientes: 0,

        canceladas: 0,

        porcentaje: 0,

        aplica: false

    };

    // --------------------------------------------------------
    // RECORRER ACTIVIDADES INSTITUCIONALES
    // --------------------------------------------------------

    for (const actividad of actividades) {

        const semanas =
            actividad.semanas || [];

        for (const semana of semanas) {

            const mes = Number(
                semana.mes
            );

            if (
                !Number.isInteger(mes) ||
                mes < 1 ||
                mes > 12
            ) {

                continue;

            }

            const indicadorMes =
                mensual[mes - 1];

            const programada =
                Number(semana.programada) === 1;

            const marca =
                normalizarEnum(
                    semana.marca_original
                );

            const estado =
                normalizarEnum(
                    semana.estado
                );

            // ------------------------------------------------
            // MARCAS SIN CLASIFICAR
            // ------------------------------------------------

            if (!programada) {

                if (marca === "X") {

                    anual.sinClasificar++;

                    indicadorMes.sinClasificar++;

                }

                continue;

            }

            // ------------------------------------------------
            // PROGRAMACIONES ANUALES Y MENSUALES
            // ------------------------------------------------

            anual.programadas++;

            indicadorMes.programadas++;

            switch (estado) {

                case "COMPLETADA":

                    anual.completadas++;

                    indicadorMes.completadas++;

                    break;

                case "CANCELADA":

                    anual.canceladas++;

                    indicadorMes.canceladas++;

                    break;

                case "EN_PROCESO":

                    anual.enProceso++;

                    indicadorMes.enProceso++;

                    anual.pendientes++;

                    indicadorMes.pendientes++;

                    break;

                default:

                    anual.pendientes++;

                    indicadorMes.pendientes++;

                    break;

            }

            // ------------------------------------------------
            // DETERMINAR SI CORRESPONDE AL CORTE ACTUAL
            // ------------------------------------------------

            let correspondeAlCorte = false;

            if (semana.fecha_programada) {

                const fechaProgramada = String(
                    semana.fecha_programada
                ).slice(0, 10);

                if (fechaValida(fechaProgramada)) {

                    correspondeAlCorte =
                        fechaProgramada <= hoy;

                }

            } else {

                // Si no existe una fecha exacta,
                // solo se incluyen meses ya finalizados.

                correspondeAlCorte =

                    anio < anioHoy ||

                    (
                        anio === anioHoy &&
                        mes < mesHoy
                    );

            }

            if (!correspondeAlCorte) {

                continue;

            }

            cumplimientoAlCorte.programadas++;

            if (estado === "COMPLETADA") {

                const fechaRealizacion =
                    semana.fecha_realizacion

                        ? String(
                            semana.fecha_realizacion
                        ).slice(0, 10)

                        : null;

                if (

                    !fechaRealizacion ||

                    (
                        fechaValida(fechaRealizacion) &&
                        fechaRealizacion <= hoy
                    )

                ) {

                    cumplimientoAlCorte.completadas++;

                } else {

                    cumplimientoAlCorte.pendientes++;

                }

            } else if (estado === "CANCELADA") {

                cumplimientoAlCorte.canceladas++;

            } else {

                cumplimientoAlCorte.pendientes++;

            }

        }

    }

    // --------------------------------------------------------
    // CALCULAR PORCENTAJE ANUAL
    // --------------------------------------------------------

    const indicadorAnual =
        normalizarIndicadorInstitucional(
            anual
        );

    // --------------------------------------------------------
    // CALCULAR PORCENTAJES MENSUALES
    // --------------------------------------------------------

    const indicadoresMensuales = mensual.map(
        indicador => ({

            mes: indicador.mes,

            nombre: indicador.nombre,

            ...normalizarIndicadorInstitucional(
                indicador
            ),

            aplica:
                indicador.programadas > 0

        })
    );

    // --------------------------------------------------------
    // CALCULAR CUMPLIMIENTO AL CORTE
    // --------------------------------------------------------

    cumplimientoAlCorte.realizadas =
        cumplimientoAlCorte.completadas;

    cumplimientoAlCorte.porcentaje =
        porcentaje(

            cumplimientoAlCorte.completadas,

            cumplimientoAlCorte.programadas

        );

    cumplimientoAlCorte.aplica =
        cumplimientoAlCorte.programadas > 0;

    return {

        success: true,

        anio,

        codigo: CODIGO_FORMATO,

        fechaActualizacion: hoy,

        totalActividadesInstitucionales:
            actividades.length,

        anual: indicadorAnual,

        mensual: indicadoresMensuales,

        cumplimientoAlCorte,

        avanceAnual:
            indicadorAnual.porcentaje,

        programadasAnuales:
            indicadorAnual.programadas,

        completadasAnuales:
            indicadorAnual.completadas,

        pendientesAnuales:
            indicadorAnual.pendientes,

        canceladasAnuales:
            indicadorAnual.canceladas,

        sinClasificar:
            indicadorAnual.sinClasificar

    };

}

// ============================================================
// 62. RUTA DE CUMPLIMIENTO ANUAL
// ============================================================

async function consultarCumplimientoAnual(
    req,
    res
) {

    const anio = validarAnio(
        req.query.anio
    );

    const resultado =
        await obtenerIndicadoresAnuales(
            anio
        );

    res.json({

        ...resultado,

        success: true,

        cumplimiento: resultado

    });

}

// Ruta principal y compatibilidad con versiones anteriores.

router.get(
    [

        "/api/indicadores/anuales",

        "/api/cumplimiento",

        "/api/cumplimiento/anual"

    ],

    ejecutar(
        consultarCumplimientoAnual
    )
);

// ============================================================
// 63. CONSULTAR CUMPLIMIENTO MENSUAL
// ============================================================

router.get(
    "/api/indicadores/mensuales",

    ejecutar(async (req, res) => {

        const anio = validarAnio(
            req.query.anio
        );

        const resultado =
            await obtenerIndicadoresAnuales(
                anio
            );

        const mes = req.query.mes

            ? validarMes(req.query.mes)

            : null;

        const mensual = mes

            ? resultado.mensual.filter(
                indicador =>
                    indicador.mes === mes
            )

            : resultado.mensual;

        res.json({

            success: true,

            anio,

            mes,

            mensual,

            indicadores: mensual

        });

    })
);

// ============================================================
// 64. CONSULTAR CUMPLIMIENTO AL CORTE
// ============================================================

router.get(
    "/api/indicadores/corte",

    ejecutar(async (req, res) => {

        const anio = validarAnio(
            req.query.anio
        );

        const resultado =
            await obtenerIndicadoresAnuales(
                anio
            );

        res.json({

            success: true,

            anio,

            cumplimientoAlCorte:
                resultado.cumplimientoAlCorte

        });

    })
);

// ============================================================
// 65. NORMALIZAR INDICADORES DE CUMPLEAÑOS
// ============================================================

function normalizarIndicadoresCumpleanos(
    datos = {}
) {

    return {

        ...datos,

        totalCumpleanos: numero(

            datos.totalCumpleanos ??

            datos.totalColaboradores

        ),

        totalColaboradores: numero(

            datos.totalColaboradores ??

            datos.totalCumpleanos

        ),

        cumpleanosHoy:
            numero(datos.cumpleanosHoy),

        cumpleanosMes:
            numero(datos.cumpleanosMes),

        proximosCumpleanos:
            numero(datos.proximosCumpleanos),

        alertasActivas:
            numero(datos.alertasActivas),

        alertasConfiguradas:
            numero(datos.alertasConfiguradas),

        felicitacionesEnviadas:
            numero(datos.felicitacionesEnviadas),

        felicitacionesPendientes:
            numero(datos.felicitacionesPendientes),

        felicitacionesConError:
            numero(datos.felicitacionesConError),

        felicitacionesCanceladas:
            numero(datos.felicitacionesCanceladas),

        colaboradoresSinCorreo:
            numero(datos.colaboradoresSinCorreo)

    };

}

// ============================================================
// 66. INDICADORES GENERALES DEL CRONOGRAMA
// ============================================================

router.get(
    "/api/indicadores",

    ejecutar(async (req, res) => {

        const anio = validarAnio(
            req.query.anio
        );

        const [

            manuales,

            institucional,

            datosCumpleanos

        ] = await Promise.all([

            obtenerIndicadoresManuales(
                anio
            ),

            obtenerIndicadoresAnuales(
                anio
            ),

            cumpleanosService
                .obtenerIndicadores()

        ]);

        const cumpleanos =
            normalizarIndicadoresCumpleanos(
                datosCumpleanos
            );

        const indicadores = {

            // ACTIVIDADES MANUALES

            total:
                manuales.total,

            totalActividades:
                manuales.total,

            proximas:
                manuales.proximas,

            totalProximas:
                manuales.proximas,

            completadas:
                manuales.completadas,

            totalCompletadas:
                manuales.completadas,

            pendientes:
                manuales.pendientes,

            totalPendientes:
                manuales.pendientes,

            enProceso:
                manuales.enProceso,

            totalEnProceso:
                manuales.enProceso,

            canceladas:
                manuales.canceladas,

            totalCanceladas:
                manuales.canceladas,

            vencidas:
                manuales.vencidas,

            totalVencidas:
                manuales.vencidas,

            actividadesHoy:
                manuales.actividadesHoy,

            // CUMPLEAÑOS

            totalCumpleanos:
                cumpleanos.totalCumpleanos,

            totalColaboradores:
                cumpleanos.totalColaboradores,

            cumpleanosHoy:
                cumpleanos.cumpleanosHoy,

            cumpleanosMes:
                cumpleanos.cumpleanosMes,

            proximosCumpleanos:
                cumpleanos.proximosCumpleanos,

            felicitacionesEnviadas:
                cumpleanos.felicitacionesEnviadas,

            alertasActivas:
                cumpleanos.alertasActivas,

            // CUMPLIMIENTO INSTITUCIONAL

            avanceAnual:
                institucional.anual.porcentaje,

            porcentajeAnual:
                institucional.anual.porcentaje,

            programadasAnuales:
                institucional.anual.programadas,

            completadasAnuales:
                institucional.anual.completadas,

            pendientesAnuales:
                institucional.anual.pendientes,

            canceladasAnuales:
                institucional.anual.canceladas,

            totalMarcasSinClasificar:
                institucional.anual.sinClasificar,

            cumplimientoCorte:
                institucional
                    .cumplimientoAlCorte
                    .porcentaje,

            programadasCorte:
                institucional
                    .cumplimientoAlCorte
                    .programadas,

            completadasCorte:
                institucional
                    .cumplimientoAlCorte
                    .completadas

        };

        res.json({

            success: true,

            anio,

            fechaActualizacion:
                fechaColombia(),

            indicadores,

            manuales,

            institucional,

            cumpleanos,

            cumplimiento: institucional

        });

    })
);

// ============================================================
// 67. NORMALIZAR LISTADOS DE CUMPLEAÑOS
// ============================================================

function obtenerListaCumpleanos(resultado) {

    if (Array.isArray(resultado)) {

        return resultado;

    }

    if (Array.isArray(resultado?.cumpleanos)) {

        return resultado.cumpleanos;

    }

    if (Array.isArray(resultado?.empleados)) {

        return resultado.empleados;

    }

    if (Array.isArray(resultado?.alertas)) {

        return resultado.alertas;

    }

    throw new Error(
        "El servicio de cumpleaños devolvió un listado no válido."
    );

}

// ============================================================
// 68. NORMALIZAR COLABORADOR PARA EL FRONTEND
// ============================================================

function presentarCumpleanos(
    colaborador
) {

    const empleadoId = validarId(

        colaborador.empleado_id ??

        colaborador.empleadoId ??

        colaborador.id

    );

    const nombre =

        colaborador.nombre ||

        colaborador.nombre_completo ||

        "Colaborador";

    const fecha =

        colaborador.fecha ||

        colaborador.proximo_cumpleanos ||

        null;

    const alertaActiva =

        colaborador.alerta_activa === true ||

        Number(
            colaborador.alerta_activa ??
            colaborador.alertaActiva
        ) === 1;

    const felicitacionActiva =

        colaborador.felicitacion_activa === true ||

        Number(
            colaborador.felicitacion_activa ??
            colaborador.felicitacionActiva
        ) === 1;

    return {

        ...colaborador,

        id: empleadoId,

        empleado_id: empleadoId,

        empleadoId,

        nombre,

        nombre_completo: nombre,

        origen: "CUMPLEANOS",

        tipo: "CUMPLEANOS",

        fecha,

        email:
            colaborador.email || null,

        dias_restantes: numero(

            colaborador.dias_restantes ??

            colaborador.diasRestantes

        ),

        alerta_activa:
            alertaActiva,

        alertaActiva,

        felicitacion_activa:
            felicitacionActiva,

        felicitacionActiva,

        correo_disponible: Boolean(

            colaborador.correo_disponible ??

            colaborador.correoDisponible

        )

    };

}

// ============================================================
// 69. CONSULTAR CUMPLEAÑOS DESDE RECURSOS HUMANOS
// ============================================================

router.get(
    "/api/cumpleanos",

    ejecutar(async (req, res) => {

        const [

            resultado,

            datosIndicadores

        ] = await Promise.all([

            cumpleanosService
                .obtenerCumpleanos(),

            cumpleanosService
                .obtenerIndicadores()

        ]);

        let cumpleanos =
            obtenerListaCumpleanos(
                resultado
            ).map(
                presentarCumpleanos
            );

        const mes = req.query.mes

            ? validarMes(req.query.mes)

            : null;

        const buscar = normalizarTexto(
            req.query.buscar,
            180
        ).toLocaleLowerCase("es");

        const periodo = normalizarEnum(
            req.query.periodo || "TODOS"
        );

        if (
            ![
                "TODOS",
                "HOY",
                "PROXIMOS"
            ].includes(periodo)
        ) {

            throw errorValidacion(
                "El periodo de cumpleaños no es válido."
            );

        }

        // ----------------------------------------------------
        // FILTRO POR MES
        // ----------------------------------------------------

        if (mes !== null) {

            cumpleanos = cumpleanos.filter(
                persona =>
                    Number(persona.mes) === mes
            );

        }

        // ----------------------------------------------------
        // FILTRO POR NOMBRE
        // ----------------------------------------------------

        if (buscar) {

            cumpleanos = cumpleanos.filter(
                persona => {

                    const nombre = String(
                        persona.nombre || ""
                    ).toLocaleLowerCase("es");

                    const codigo = String(
                        persona.codigo || ""
                    ).toLocaleLowerCase("es");

                    return (

                        nombre.includes(buscar) ||

                        codigo.includes(buscar)

                    );

                }
            );

        }

        // ----------------------------------------------------
        // FILTRO DE CUMPLEAÑOS DEL DÍA
        // ----------------------------------------------------

        if (periodo === "HOY") {

            cumpleanos = cumpleanos.filter(
                persona =>
                    persona.dias_restantes === 0
            );

        }

        // ----------------------------------------------------
        // FILTRO DE PRÓXIMOS CUMPLEAÑOS
        // ----------------------------------------------------

        if (periodo === "PROXIMOS") {

            cumpleanos = cumpleanos.filter(
                persona =>

                    persona.dias_restantes >= 0 &&

                    persona.dias_restantes <= 30

            );

        }

        cumpleanos.sort(
            (a, b) =>

                a.dias_restantes -
                b.dias_restantes ||

                a.nombre.localeCompare(
                    b.nombre,
                    "es"
                )

        );

        res.json({

            success: true,

            integrado: true,

            origen: "RECURSOS_HUMANOS",

            fecha: fechaColombia(),

            total: cumpleanos.length,

            cumpleanos,

            indicadores:
                normalizarIndicadoresCumpleanos(
                    datosIndicadores
                )

        });

    })
);

// ============================================================
// 70. CONSULTAR INDICADORES DE CUMPLEAÑOS
// ============================================================

router.get(
    "/api/cumpleanos/indicadores",

    ejecutar(async (req, res) => {

        const resultado =
            await cumpleanosService
                .obtenerIndicadores();

        const indicadores =
            normalizarIndicadoresCumpleanos(
                resultado
            );

        res.json({

            success: true,

            integrado: true,

            fecha: fechaColombia(),

            ...indicadores,

            indicadores

        });

    })
);

// ============================================================
// 71. CONSULTAR CUMPLEAÑOS DEL DÍA
// ============================================================

router.get(
    "/api/cumpleanos/hoy",

    ejecutar(async (req, res) => {

        const resultado =
            await cumpleanosService
                .obtenerCumpleanosHoy();

        const cumpleanos =
            obtenerListaCumpleanos(
                resultado
            ).map(
                presentarCumpleanos
            );

        res.json({

            success: true,

            integrado: true,

            fecha: fechaColombia(),

            total: cumpleanos.length,

            cumpleanos

        });

    })
);

// ============================================================
// 72. CONSULTAR CUMPLEAÑOS DEL MES
// ============================================================

router.get(
    "/api/cumpleanos/mes",

    ejecutar(async (req, res) => {

        const mes = validarMes(

            req.query.mes ??

            mesActual()

        );

        const resultado =
            await cumpleanosService
                .obtenerCumpleanosMes(
                    mes
                );

        const cumpleanos =
            obtenerListaCumpleanos(
                resultado
            ).map(
                presentarCumpleanos
            );

        res.json({

            success: true,

            integrado: true,

            mes,

            nombreMes:
                MESES[mes - 1],

            total: cumpleanos.length,

            cumpleanos

        });

    })
);

// ============================================================
// 73. CONSULTAR PRÓXIMOS CUMPLEAÑOS
// ============================================================

router.get(
    "/api/cumpleanos/proximos",

    ejecutar(async (req, res) => {

        const dias = Number(

            req.query.dias ??

            30

        );

        if (

            !Number.isInteger(dias) ||

            dias < 0 ||

            dias > 365

        ) {

            throw errorValidacion(
                "El número de días debe estar entre 0 y 365."
            );

        }

        const resultado =
            await cumpleanosService
                .obtenerProximosCumpleanos(
                    dias
                );

        const cumpleanos =
            obtenerListaCumpleanos(
                resultado
            ).map(
                presentarCumpleanos
            );

        res.json({

            success: true,

            integrado: true,

            dias,

            total: cumpleanos.length,

            cumpleanos

        });

    })
);

// ============================================================
// 74. CONSULTAR ALERTAS DE CUMPLEAÑOS
// ============================================================

router.get(
    "/api/cumpleanos/alertas",

    ejecutar(async (req, res) => {

        const resultado =
            await cumpleanosService
                .obtenerAlertasCumpleanos();

        const alertas =
            obtenerListaCumpleanos(
                resultado
            );

        res.json({

            success: true,

            integrado: true,

            fecha: fechaColombia(),

            total: alertas.length,

            alertas

        });

    })
);

// ============================================================
// 75. CONSULTAR ESTADO DEL SERVICIO DE CUMPLEAÑOS
// ============================================================

router.get(
    [

        "/api/cumpleanos/servicio",

        "/api/cumpleanos/servicio/estado"

    ],

    ejecutar(async (req, res) => {

        const estado =
            await cumpleanosService
                .obtenerEstadoServicio();

        res.json({

            ...estado,

            success: true,

            estado

        });

    })
);

// ============================================================
// 76. CONSULTAR HISTORIAL DE FELICITACIONES
// ============================================================

router.get(
    "/api/cumpleanos/historial",

    ejecutar(async (req, res) => {

        const resultado =
            await cumpleanosService
                .obtenerHistorialFelicitaciones();

        const historial = Array.isArray(resultado)

            ? resultado

            : resultado?.historial || [];

        res.json({

            success: true,

            total: historial.length,

            historial

        });

    })
);

// ============================================================
// 77. CONSULTAR EVENTOS DE CUMPLEAÑOS PARA EL CALENDARIO
// ============================================================

router.get(
    "/api/cumpleanos/calendario/eventos",

    ejecutar(async (req, res) => {

        const anio = validarAnio(
            req.query.anio
        );

        const mes = req.query.mes

            ? validarMes(req.query.mes)

            : null;

        const resultado =
            await cumpleanosService
                .obtenerCumpleanos();

        const colaboradores =
            obtenerListaCumpleanos(
                resultado
            );

        const eventos = [];

        for (const registro of colaboradores) {

            const persona =
                presentarCumpleanos(
                    registro
                );

            const mesCumpleanos = Number(
                persona.mes
            );

            const diaCumpleanos = Number(
                persona.dia
            );

            if (

                !Number.isInteger(mesCumpleanos) ||

                mesCumpleanos < 1 ||

                mesCumpleanos > 12 ||

                !Number.isInteger(diaCumpleanos) ||

                diaCumpleanos < 1 ||

                diaCumpleanos > 31

            ) {

                continue;

            }

            if (

                mes !== null &&

                mesCumpleanos !== mes

            ) {

                continue;

            }

            let fecha =

                `${anio}-` +

                `${String(mesCumpleanos).padStart(2, "0")}-` +

                `${String(diaCumpleanos).padStart(2, "0")}`;

            // Cumpleaños del 29 de febrero:
            // utilizar el 28 en años no bisiestos.

            if (

                mesCumpleanos === 2 &&

                diaCumpleanos === 29 &&

                !fechaValida(fecha)

            ) {

                fecha = `${anio}-02-28`;

            }

            if (!fechaValida(fecha)) {

                continue;

            }

            eventos.push({

                id:
                    `CUMPLEANOS-${persona.empleado_id}-${anio}`,

                empleadoId:
                    persona.empleado_id,

                empleado_id:
                    persona.empleado_id,

                origen:
                    "CUMPLEANOS",

                tipo:
                    "CUMPLEANOS",

                nombre:
                    `Cumpleaños de ${persona.nombre}`,

                nombreColaborador:
                    persona.nombre,

                fecha,

                anio,

                mes:
                    mesCumpleanos,

                dia:
                    Number(fecha.slice(8, 10)),

                responsable:
                    "Gestión Humana",

                prioridad:
                    "MEDIA",

                estado: null,

                descripcion:
                    "Cumpleaños de colaborador registrado en Recursos Humanos.",

                observaciones:
                    persona.observaciones || null,

                alertaActiva:
                    persona.alertaActiva,

                felicitacionActiva:
                    persona.felicitacionActiva,

                correoDisponible:
                    persona.correo_disponible,

                editable: true,

                fechaEditable: false

            });

        }

        eventos.sort(
            (a, b) =>

                a.fecha.localeCompare(b.fecha) ||

                a.nombre.localeCompare(
                    b.nombre,
                    "es"
                )

        );

        res.json({

            success: true,

            integrado: true,

            anio,

            mes,

            total: eventos.length,

            eventos

        });

    })
);

// ============================================================
// 78. CONSULTAR CONFIGURACIÓN INDIVIDUAL DE CUMPLEAÑOS
// ============================================================

async function consultarCumpleanosIndividual(
    req,
    res
) {

    const empleadoId = validarId(
        req.params.empleadoId
    );

    const resultado =
        await cumpleanosService
            .obtenerEmpleado(
                empleadoId
            );

    const empleado =
        presentarCumpleanos(

            resultado?.empleado ||

            resultado

        );

    const configuracion =

        empleado.configuracion_personalizada ||

        {

            alerta_activa:
                empleado.alerta_activa,

            felicitacion_activa:
                empleado.felicitacion_activa,

            dias_anticipacion:
                empleado.dias_anticipacion_personalizados
                ?? null,

            hora_envio:
                empleado.hora_envio_personalizada
                ?? null,

            asunto_personalizado:
                empleado.asunto_personalizado
                ?? null,

            mensaje_personalizado:
                empleado.mensaje_personalizado
                ?? null,

            observaciones:
                empleado.observaciones
                ?? null

        };

    res.json({

        success: true,

        integrado: true,

        empleado,

        colaborador: empleado,

        cumpleanos: empleado,

        configuracion

    });

}

// Las rutas estáticas anteriores deben permanecer
// antes de esta ruta dinámica.

router.get(
    [

        "/api/cumpleanos/:empleadoId",

        "/api/cumpleanos/:empleadoId/configuracion"

    ],

    ejecutar(
        consultarCumpleanosIndividual
    )
);

// ============================================================
// 79. NORMALIZIZAR CONFIGURACIÓN INDIVIDUAL
// ============================================================

function normalizarDatosCumpleanos(
    datos = {}
) {

    if (

        !datos ||

        typeof datos !== "object" ||

        Array.isArray(datos)

    ) {

        throw errorValidacion(
            "Los datos de configuración no son válidos."
        );

    }

    const equivalencias = {

        alertaActiva: [

            "alertaActiva",

            "alerta_activa"

        ],

        felicitacionActiva: [

            "felicitacionActiva",

            "felicitacion_activa"

        ],

        diasAnticipacion: [

            "diasAnticipacion",

            "dias_anticipacion"

        ],

        horaEnvio: [

            "horaEnvio",

            "hora_envio"

        ],

        asuntoPersonalizado: [

            "asuntoPersonalizado",

            "asunto_personalizado"

        ],

        mensajePersonalizado: [

            "mensajePersonalizado",

            "mensaje_personalizado"

        ],

        observaciones: [

            "observaciones"

        ]

    };

    const configuracion = {};

    for (

        const [campo, alternativas]

        of Object.entries(equivalencias)

    ) {

        const valor = obtenerCampo(
            datos,
            ...alternativas
        );

        if (valor !== undefined) {

            configuracion[campo] =
                valor;

        }

    }

    if (
        !Object.keys(configuracion).length
    ) {

        throw errorValidacion(
            "No se recibieron campos de configuración válidos."
        );

    }

    // --------------------------------------------------------
    // VALIDAR INTERRUPTORES
    // --------------------------------------------------------

    if (
        configuracion.alertaActiva !== undefined
    ) {

        configuracion.alertaActiva =

            normalizarBooleano(
                configuracion.alertaActiva
            ) === 1;

    }

    if (
        configuracion.felicitacionActiva !== undefined
    ) {

        configuracion.felicitacionActiva =

            normalizarBooleano(
                configuracion.felicitacionActiva
            ) === 1;

    }

    // --------------------------------------------------------
    // VALIDAR DÍAS DE ANTICIPACIÓN
    // --------------------------------------------------------

    if (
        configuracion.diasAnticipacion !== undefined
    ) {

        if (

            configuracion.diasAnticipacion === null ||

            configuracion.diasAnticipacion === ""

        ) {

            // Heredar configuración global.

            configuracion.diasAnticipacion =
                null;

        } else {

            const dias = Number(
                configuracion.diasAnticipacion
            );

            if (

                !Number.isInteger(dias) ||

                dias < 0 ||

                dias > 60

            ) {

                throw errorValidacion(
                    "Los días de anticipación deben estar entre 0 y 60."
                );

            }

            configuracion.diasAnticipacion =
                dias;

        }

    }

    // --------------------------------------------------------
    // VALIDAR HORA DE ENVÍO
    // --------------------------------------------------------

    if (
        configuracion.horaEnvio !== undefined
    ) {

        if (

            configuracion.horaEnvio === null ||

            configuracion.horaEnvio === ""

        ) {

            // Heredar configuración global.

            configuracion.horaEnvio = null;

        } else {

            const hora = String(
                configuracion.horaEnvio
            ).trim();

            if (

                !/^([01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/
                    .test(hora)

            ) {

                throw errorValidacion(
                    "La hora de envío no es válida."
                );

            }

            configuracion.horaEnvio =
                hora.slice(0, 5);

        }

    }

    // --------------------------------------------------------
    // VALIDAR TEXTOS PERSONALIZADOS
    // --------------------------------------------------------

    const camposTexto = {

        asuntoPersonalizado: 255,

        mensajePersonalizado: 10000,

        observaciones: 10000

    };

    for (

        const [campo, maximo]

        of Object.entries(camposTexto)

    ) {

        if (
            configuracion[campo] === undefined
        ) {

            continue;

        }

        if (

            configuracion[campo] === null ||

            configuracion[campo] === ""

        ) {

            configuracion[campo] = null;

            continue;

        }

        if (
            typeof configuracion[campo] !== "string"
        ) {

            throw errorValidacion(
                `El campo ${campo} debe contener texto.`
            );

        }

        const texto =
            configuracion[campo].trim();

        if (texto.length > maximo) {

            throw errorValidacion(
                `El campo ${campo} supera la longitud permitida.`
            );

        }

        configuracion[campo] =
            texto || null;

    }

    return configuracion;

}

// ============================================================
// 80. ACTUALIZAR CONFIGURACIÓN INDIVIDUAL
// ============================================================

async function actualizarCumpleanosIndividual(
    req,
    res
) {

    const empleadoId = validarId(
        req.params.empleadoId
    );

    const configuracion =
        normalizarDatosCumpleanos(
            req.body || {}
        );

    // El servicio realiza la transacción,
    // actualiza la configuración y registra la auditoría.
    // No se vuelve a registrar aquí para evitar duplicados.

    const resultado =
        await cumpleanosService
            .actualizarConfiguracionEmpleado(

                empleadoId,

                configuracion,

                req.usuarioCronograma.id

            );

    if (resultado?.success === false) {

        throw errorValidacion(

            resultado.message ||

            resultado.mensaje ||

            "No fue posible actualizar la configuración."

        );

    }

    const empleadoActualizado =

        resultado?.empleado ||

        await cumpleanosService
            .obtenerEmpleado(
                empleadoId
            );

    const empleado =
        presentarCumpleanos(
            empleadoActualizado
        );

    const mensaje =

        resultado?.message ||

        resultado?.mensaje ||

        "Configuración de cumpleaños actualizada correctamente.";

    res.json({

        ...resultado,

        success: true,

        integrado: true,

        empleado,

        colaborador: empleado,

        cumpleanos: empleado,

        configuracion:

            resultado?.configuracion ||

            empleado.configuracion_personalizada ||

            null,

        message: mensaje,

        mensaje

    });

}

// ============================================================
// 81. RUTAS PARA EDITAR CUMPLEAÑOS
// ============================================================

router.put(
    [

        "/api/cumpleanos/:empleadoId",

        "/api/cumpleanos/:empleadoId/configuracion"

    ],

    ejecutar(
        actualizarCumpleanosIndividual
    )
);

router.patch(
    [

        "/api/cumpleanos/:empleadoId",

        "/api/cumpleanos/:empleadoId/configuracion"

    ],

    ejecutar(
        actualizarCumpleanosIndividual
    )
);

// ============================================================
// 82. ACTUALIZAR ÚNICAMENTE ALERTA INDIVIDUAL
// ============================================================

router.patch(
    "/api/cumpleanos/:empleadoId/alerta",

    ejecutar(async (req, res) => {

        const valor = obtenerCampo(

            req.body || {},

            "alertaActiva",

            "alerta_activa",

            "activa"

        );

        if (valor === undefined) {

            throw errorValidacion(
                "Debes indicar el estado de la alerta."
            );

        }

        req.body = {

            alertaActiva: valor

        };

        await actualizarCumpleanosIndividual(
            req,
            res
        );

    })
);

// ============================================================
// 83. ACTUALIZAR ÚNICAMENTE FELICITACIÓN INDIVIDUAL
// ============================================================

router.patch(
    "/api/cumpleanos/:empleadoId/felicitacion",

    ejecutar(async (req, res) => {

        const valor = obtenerCampo(

            req.body || {},

            "felicitacionActiva",

            "felicitacion_activa",

            "activa"

        );

        if (valor === undefined) {

            throw errorValidacion(
                "Debes indicar el estado de la felicitación."
            );

        }

        req.body = {

            felicitacionActiva: valor

        };

        await actualizarCumpleanosIndividual(
            req,
            res
        );

    })
);

// ============================================================
// 84. CONFIGURACIÓN GENERAL PREDETERMINADA
// ============================================================

const CONFIGURACION_PREDETERMINADA = Object.freeze({

    id: 1,

    recordatorios_activos: 0,

    dias_anticipacion: 7,

    felicitaciones_activas: 0,

    hora_felicitaciones: "08:00",

    avisos_admin_activos: 0,

    correo_notificaciones: null

});

// ============================================================
// 85. VERIFICAR DISPONIBILIDAD DE ENVÍOS REALES
// ============================================================

function enviosTransforminHabilitados() {

    return String(

        process.env.TRANSFORMIN_ENVIO_HABILITADO || "false"

    ).trim().toLowerCase() === "true";

}

// ============================================================
// 86. PRESENTAR CONFIGURACIÓN GENERAL
// ============================================================

function presentarConfiguracionGeneral(datos = {}) {

    const configuracion = {

        ...CONFIGURACION_PREDETERMINADA,

        ...datos

    };

    const hora = String(

        configuracion.hora_felicitaciones || "08:00"

    ).slice(0, 5);

    return {

        ...configuracion,

        id: 1,

        recordatorios_activos:
            Number(configuracion.recordatorios_activos) === 1
                ? 1
                : 0,

        dias_anticipacion:
            Number(configuracion.dias_anticipacion),

        felicitaciones_activas:
            Number(configuracion.felicitaciones_activas) === 1
                ? 1
                : 0,

        hora_felicitaciones: hora,

        avisos_admin_activos:
            Number(configuracion.avisos_admin_activos) === 1
                ? 1
                : 0,

        correo_notificaciones:
            configuracion.correo_notificaciones || null,

        // Compatibilidad con el frontend.

        recordatoriosActivos:
            Number(configuracion.recordatorios_activos) === 1,

        diasAnticipacion:
            Number(configuracion.dias_anticipacion),

        felicitacionesActivas:
            Number(configuracion.felicitaciones_activas) === 1,

        horaFelicitaciones: hora,

        avisosAdminActivos:
            Number(configuracion.avisos_admin_activos) === 1,

        correoNotificaciones:
            configuracion.correo_notificaciones || "",

        enviosHabilitados:
            enviosTransforminHabilitados(),

        zonaHoraria:
            ZONA_HORARIA

    };

}

// ============================================================
// 87. CONSULTAR CONFIGURACIÓN GENERAL EN MYSQL
// ============================================================

async function obtenerConfiguracionGeneral(
    conexion = pool,
    bloquear = false
) {

    const [filas] = await conexion.query(
        `
        SELECT

            id,

            recordatorios_activos,

            dias_anticipacion,

            felicitaciones_activas,

            TIME_FORMAT(
                hora_felicitaciones,
                '%H:%i'
            ) AS hora_felicitaciones,

            avisos_admin_activos,

            correo_notificaciones,

            created_at,

            updated_at

        FROM transformin_configuracion

        WHERE id = 1

        LIMIT 1

        ${bloquear ? "FOR UPDATE" : ""}
        `
    );

    return presentarConfiguracionGeneral(

        filas[0] ||

        CONFIGURACION_PREDETERMINADA

    );

}

// ============================================================
// 88. RUTA PARA CONSULTAR CONFIGURACIÓN GENERAL
// ============================================================

router.get(
    "/api/configuracion",

    ejecutar(async (req, res) => {

        const configuracion =
            await obtenerConfiguracionGeneral();

        res.json({

            success: true,

            configuracion,

            enviosHabilitados:
                enviosTransforminHabilitados(),

            zonaHoraria:
                ZONA_HORARIA

        });

    })
);

// ============================================================
// 89. VALIDAR CORREO ELECTRÓNICO
// ============================================================

function validarCorreoNotificaciones(valor) {

    if (

        valor === undefined ||

        valor === null ||

        valor === ""

    ) {

        return null;

    }

    if (typeof valor !== "string") {

        throw errorValidacion(
            "El correo electrónico no es válido."
        );

    }

    const correo = valor.trim();

    if (!correo) {

        return null;

    }

    if (

        correo.length > 180 ||

        !/^[^\s@<>;,]+@[^\s@<>;,]+\.[^\s@<>;,]+$/
            .test(correo)

    ) {

        throw errorValidacion(
            "El correo de notificaciones no es válido."
        );

    }

    return correo;

}

// ============================================================
// 90. VALIDAR HORA DE FELICITACIONES
// ============================================================

function validarHoraFelicitaciones(valor) {

    const hora = String(
        valor ?? ""
    ).trim();

    if (

        !/^([01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/
            .test(hora)

    ) {

        throw errorValidacion(
            "La hora de felicitaciones no es válida."
        );

    }

    return hora.slice(0, 5);

}

// ============================================================
// 91. NORMALIZAR CONFIGURACIÓN GENERAL
// ============================================================

function normalizarConfiguracionGeneral(
    anterior,
    datos = {}
) {

    if (

        !datos ||

        typeof datos !== "object" ||

        Array.isArray(datos)

    ) {

        throw errorValidacion(
            "Los datos de configuración no son válidos."
        );

    }

    function valor(campos, defecto) {

        const recibido = obtenerCampo(
            datos,
            ...campos
        );

        return recibido === undefined

            ? defecto

            : recibido;

    }

    const recordatoriosActivos =
        normalizarBooleano(

            valor(

                [
                    "recordatoriosActivos",
                    "recordatorios_activos"
                ],

                anterior.recordatorios_activos

            )

        );

    const felicitacionesActivas =
        normalizarBooleano(

            valor(

                [
                    "felicitacionesActivas",
                    "felicitaciones_activas"
                ],

                anterior.felicitaciones_activas

            )

        );

    const avisosAdminActivos =
        normalizarBooleano(

            valor(

                [
                    "avisosAdminActivos",
                    "avisos_admin_activos"
                ],

                anterior.avisos_admin_activos

            )

        );

    const diasRecibidos = valor(

        [
            "diasAnticipacion",
            "dias_anticipacion"
        ],

        anterior.dias_anticipacion

    );

    if (

        diasRecibidos === null ||

        diasRecibidos === "" ||

        typeof diasRecibidos === "boolean"

    ) {

        throw errorValidacion(
            "Debes indicar los días de anticipación."
        );

    }

    const diasAnticipacion = Number(
        diasRecibidos
    );

    if (

        !Number.isInteger(diasAnticipacion) ||

        diasAnticipacion < 0 ||

        diasAnticipacion > 60

    ) {

        throw errorValidacion(
            "Los días de anticipación deben estar entre 0 y 60."
        );

    }

    const horaFelicitaciones =
        validarHoraFelicitaciones(

            valor(

                [
                    "horaFelicitaciones",
                    "hora_felicitaciones"
                ],

                anterior.hora_felicitaciones

            )

        );

    const correoNotificaciones =
        validarCorreoNotificaciones(

            valor(

                [
                    "correoNotificaciones",
                    "correo_notificaciones"
                ],

                anterior.correo_notificaciones

            )

        );

    if (

        avisosAdminActivos === 1 &&

        !correoNotificaciones

    ) {

        throw errorValidacion(
            "Debes registrar un correo para los avisos administrativos."
        );

    }

    return {

        recordatorios_activos:
            recordatoriosActivos,

        dias_anticipacion:
            diasAnticipacion,

        felicitaciones_activas:
            felicitacionesActivas,

        hora_felicitaciones:
            horaFelicitaciones,

        avisos_admin_activos:
            avisosAdminActivos,

        correo_notificaciones:
            correoNotificaciones

    };

}

// ============================================================
// 92. GUARDAR CONFIGURACIÓN GENERAL
// ============================================================

async function guardarConfiguracionGeneral(
    req,
    res
) {

    const datos = req.body || {};

    const configuracion = await transaccion(
        async conexion => {

            // Garantizar que exista el registro único.
            // No se sobrescribe la configuración existente.

            await conexion.query(
                `
                INSERT INTO transformin_configuracion (
                    id
                )

                VALUES (1)

                ON DUPLICATE KEY UPDATE
                    id = id
                `
            );

            const anterior =
                await obtenerConfiguracionGeneral(
                    conexion,
                    true
                );

            const nueva =
                normalizarConfiguracionGeneral(
                    anterior,
                    datos
                );

            await conexion.query(
                `
                UPDATE transformin_configuracion

                SET

                    recordatorios_activos = ?,

                    dias_anticipacion = ?,

                    felicitaciones_activas = ?,

                    hora_felicitaciones = ?,

                    avisos_admin_activos = ?,

                    correo_notificaciones = ?

                WHERE id = 1
                `,
                [

                    nueva.recordatorios_activos,

                    nueva.dias_anticipacion,

                    nueva.felicitaciones_activas,

                    nueva.hora_felicitaciones,

                    nueva.avisos_admin_activos,

                    nueva.correo_notificaciones

                ]
            );

            return obtenerConfiguracionGeneral(
                conexion
            );

        }
    );

    const advertencias = [];

    if (

        configuracion.felicitacionesActivas &&

        !enviosTransforminHabilitados()

    ) {

        advertencias.push(

            "Las felicitaciones están configuradas, pero los envíos reales permanecen deshabilitados en el servidor."

        );

    }

    res.json({

        success: true,

        configuracion,

        advertencias,

        enviosHabilitados:
            enviosTransforminHabilitados(),

        message:
            "Configuración guardada correctamente.",

        mensaje:
            "Configuración guardada correctamente."

    });

}

// ============================================================
// 93. RUTAS PARA GUARDAR CONFIGURACIÓN
// ============================================================

router.put(
    "/api/configuracion",

    ejecutar(
        guardarConfiguracionGeneral
    )
);

router.patch(
    "/api/configuracion",

    ejecutar(
        guardarConfiguracionGeneral
    )
);

// ============================================================
// 94. RESTABLECER CONFIGURACIÓN GENERAL
// ============================================================

router.post(
    "/api/configuracion/restablecer",

    ejecutar(async (req, res) => {

        if (req.body?.confirmar !== true) {

            throw errorValidacion(
                "Debes confirmar el restablecimiento de la configuración."
            );

        }

        req.body = {

            recordatoriosActivos: false,

            diasAnticipacion: 7,

            felicitacionesActivas: false,

            horaFelicitaciones: "08:00",

            avisosAdminActivos: false,

            correoNotificaciones: null

        };

        await guardarConfiguracionGeneral(
            req,
            res
        );

    })
);

// ============================================================
// 95. VALIDAR IMAGEN PNG GENERADA
// ============================================================

function validarTarjetaPNG(resultado) {

    const buffer = Buffer.isBuffer(resultado)

        ? resultado

        : resultado?.buffer;

    if (

        !Buffer.isBuffer(buffer) ||

        buffer.length < 8

    ) {

        throw new Error(
            "No fue posible generar una tarjeta válida."
        );

    }

    const firmaPNG = Buffer.from([

        137,

        80,

        78,

        71,

        13,

        10,

        26,

        10

    ]);

    if (

        !buffer.subarray(0, 8).equals(firmaPNG)

    ) {

        throw new Error(
            "La tarjeta generada no corresponde a una imagen PNG."
        );

    }

    return buffer;

}

// ============================================================
// 96. ENVIAR TARJETA PNG AL NAVEGADOR
// ============================================================

function responderTarjetaPNG(
    res,
    tarjeta,
    empleadoId,
    descargar = false
) {

    const buffer =
        validarTarjetaPNG(tarjeta);

    const nombreArchivo =

        `tarjeta-transformin-${empleadoId}.png`;

    res.setHeader(
        "Content-Type",
        "image/png"
    );

    res.setHeader(
        "Content-Disposition",

        `${descargar ? "attachment" : "inline"}; filename="${nombreArchivo}"`
    );

    res.setHeader(
        "Content-Length",
        buffer.length
    );

    res.setHeader(
        "Cache-Control",
        "no-store, private"
    );

    res.setHeader(
        "X-Content-Type-Options",
        "nosniff"
    );

    return res.send(buffer);

}

// ============================================================
// 97. GENERAR TARJETA PERSONALIZADA
// ============================================================

async function generarTarjetaCumpleanos(
    req,
    res
) {

    const empleadoId = validarId(
        req.params.empleadoId
    );

    const tarjeta = await cumpleanosService
        .generarTarjetaEmpleado(
            empleadoId
        );

    const descargar =

        req.query.descargar === "1" ||

        req.query.descargar === "true";

    return responderTarjetaPNG(

        res,

        tarjeta,

        empleadoId,

        descargar

    );

}

// ============================================================
// 98. RUTAS DE TARJETAS PERSONALIZADAS
// ============================================================

router.get(
    [

        "/api/cumpleanos/:empleadoId/tarjeta",

        "/api/cumpleanos/:empleadoId/tarjeta/preview"

    ],

    ejecutar(
        generarTarjetaCumpleanos
    )
);

// ============================================================
// 99. DESCARGAR TARJETA PERSONALIZADA
// ============================================================

router.get(
    "/api/cumpleanos/:empleadoId/tarjeta/descargar",

    ejecutar(async (req, res) => {

        const empleadoId = validarId(
            req.params.empleadoId
        );

        const tarjeta = await cumpleanosService
            .generarTarjetaEmpleado(
                empleadoId
            );

        return responderTarjetaPNG(

            res,

            tarjeta,

            empleadoId,

            true

        );

    })
);

// ============================================================
// 100. PREVISUALIZAR FELICITACIÓN COMPLETA
// ============================================================

async function previsualizarFelicitacion(
    req,
    res
) {

    const empleadoId = validarId(
        req.params.empleadoId
    );

    const resultado =
        await cumpleanosService
            .previsualizarFelicitacion(
                empleadoId
            );

    if (resultado?.success === false) {

        throw errorValidacion(

            resultado.message ||

            resultado.mensaje ||

            "No fue posible generar la previsualización."

        );

    }

    const empleado =
        presentarCumpleanos(

            resultado.empleado ||

            await cumpleanosService
                .obtenerEmpleado(empleadoId)

        );

    const tarjeta =
        validarTarjetaPNG(
            resultado.tarjeta
        );

    // La imagen se entrega en Base64 únicamente
    // para la previsualización administrativa.
    // Esta operación no realiza ningún envío SMTP.

    res.json({

        success: true,

        empleado,

        asunto:
            resultado.asunto || "",

        mensaje:
            resultado.mensaje || "",

        html:
            resultado.html || "",

        tarjetaBase64:
            tarjeta.toString("base64"),

        contentType:
            "image/png",

        tarjetaUrl:

            `/cronograma-transformin/api/cumpleanos/${empleadoId}/tarjeta`,

        envioReal: false,

        enviosHabilitados:
            enviosTransforminHabilitados(),

        message:
            "Previsualización generada correctamente."

    });

}

// ============================================================
// 101. RUTAS DE PREVISUALIZACIÓN DE FELICITACIONES
// ============================================================

router.get(
    [

        "/api/cumpleanos/:empleadoId/preview",

        "/api/cumpleanos/:empleadoId/felicitacion/preview"

    ],

    ejecutar(
        previsualizarFelicitacion
    )
);

// ============================================================
// 102. ENVÍO MANUAL CONTROLADO DE FELICITACIONES
// ============================================================

async function enviarFelicitacionManual(
    req,
    res
) {

    const empleadoId = validarId(
        req.params.empleadoId
    );

    // Primera barrera de seguridad.
    // Los envíos deben estar habilitados en el servidor.

    if (!enviosTransforminHabilitados()) {

        throw errorValidacion(

            "Los envíos reales de felicitaciones están deshabilitados en el servidor.",

            503

        );

    }

    // Segunda barrera de seguridad.
    // El administrador debe confirmar expresamente el envío.

    if (req.body?.confirmar !== true) {

        throw errorValidacion(
            "Debes confirmar el envío de la felicitación."
        );

    }

    // El destinatario se obtiene exclusivamente
    // desde Recursos Humanos.
    // No se acepta un correo arbitrario desde el frontend.

    const empleado =
        await cumpleanosService
            .obtenerEmpleado(
                empleadoId
            );

    const colaborador =
        presentarCumpleanos(empleado);

    if (!colaborador.felicitacionActiva) {

        throw errorValidacion(

            "Las felicitaciones están desactivadas para este colaborador.",

            409

        );

    }

    if (!colaborador.correo_disponible) {

        throw errorValidacion(
            "El colaborador no tiene un correo electrónico disponible."
        );

    }

    if (colaborador.dias_restantes !== 0) {

        throw errorValidacion(

            "El envío manual únicamente está disponible el día del cumpleaños.",

            409

        );

    }

    // El servicio verifica nuevamente las condiciones,
    // controla los duplicados y registra la notificación.

    const resultado =
        await cumpleanosService
            .enviarFelicitacion(

                empleadoId,

                {

                    manual: true,

                    usuarioId:
                        req.usuarioCronograma.id

                }

            );

    if (resultado?.duplicado === true) {

        return res.json({

            ...resultado,

            success: true,

            enviado: false,

            duplicado: true,

            message:
                "La felicitación ya fue enviada anteriormente.",

            mensaje:
                "La felicitación ya fue enviada anteriormente."

        });

    }

    if (

        resultado?.success === false ||

        resultado?.enviado !== true

    ) {

        return res.status(409).json({

            ...resultado,

            success: false,

            enviado: false,

            message:

                resultado?.message ||

                resultado?.mensaje ||

                "El servicio no confirmó el envío de la felicitación."

        });

    }

    res.json({

        ...resultado,

        success: true,

        enviado: true,

        duplicado: false,

        empleadoId,

        message:
            "Felicitación enviada correctamente.",

        mensaje:
            "Felicitación enviada correctamente."

    });

}

// ============================================================
// 103. RUTAS DE ENVÍO MANUAL
// ============================================================

router.post(
    [

        "/api/cumpleanos/:empleadoId/enviar",

        "/api/cumpleanos/:empleadoId/felicitacion/enviar"

    ],

    ejecutar(
        enviarFelicitacionManual
    )
);

// ============================================================
// 104. VERIFICAR CONEXIÓN SMTP
// ============================================================

async function verificarConexionSMTP(
    req,
    res
) {

    // Esta operación verifica la conexión.
    // No envía mensajes a ningún destinatario.

    const resultado =
        await cumpleanosService
            .verificarSMTP();

    const conectado =

        resultado === true ||

        (

            resultado?.success === true &&

            resultado?.conectado !== false

        );

    if (!conectado) {

        return res.status(503).json({

            success: false,

            conectado: false,

            envioReal: false,

            enviosHabilitados:
                enviosTransforminHabilitados(),

            message:
                "No fue posible verificar la conexión SMTP."

        });

    }

    res.json({

        success: true,

        conectado: true,

        envioReal: false,

        enviosHabilitados:
            enviosTransforminHabilitados(),

        host:
            resultado?.host || "smtp.hostinger.com",

        puerto:
            resultado?.puerto || 465,

        seguro:
            resultado?.seguro !== false,

        message:
            "Conexión SMTP verificada correctamente.",

        mensaje:
            "Conexión SMTP verificada correctamente."

    });

}

// ============================================================
// 105. RUTAS DE VERIFICACIÓN SMTP
// ============================================================

router.post(
    [

        "/api/cumpleanos/smtp/verificar",

        "/api/smtp/verificar"

    ],

    ejecutar(
        verificarConexionSMTP
    )
);

// ============================================================
// 106. CONSULTAR ESTADO GENERAL DE NOTIFICACIONES
// ============================================================

router.get(
    "/api/notificaciones/estado",

    ejecutar(async (req, res) => {

        const [

            configuracion,

            servicio

        ] = await Promise.all([

            obtenerConfiguracionGeneral(),

            cumpleanosService
                .obtenerEstadoServicio()

        ]);

        res.json({

            success: true,

            fecha:
                fechaColombia(),

            zonaHoraria:
                ZONA_HORARIA,

            configuracion,

            servicio,

            enviosHabilitados:
                enviosTransforminHabilitados()

        });

    })
);

// ============================================================
// 107. VALIDAR LÍMITE DE REGISTROS
// ============================================================

function validarLimiteHistorial(
    valor,
    defecto = 200,
    maximo = 500
) {

    const limite = Number(

        valor === undefined ||

        valor === null ||

        valor === ""

            ? defecto

            : valor

    );

    if (

        !Number.isInteger(limite) ||

        limite < 1 ||

        limite > maximo

    ) {

        throw errorValidacion(
            `El límite debe estar entre 1 y ${maximo}.`
        );

    }

    return limite;

}

// ============================================================
// 108. VALIDAR FILTRO DE FECHAS
// ============================================================

function validarPeriodoHistorial(
    desde,
    hasta
) {

    if (

        desde &&

        !fechaValida(desde)

    ) {

        throw errorValidacion(
            "La fecha inicial no es válida."
        );

    }

    if (

        hasta &&

        !fechaValida(hasta)

    ) {

        throw errorValidacion(
            "La fecha final no es válida."
        );

    }

    if (

        desde &&

        hasta &&

        desde > hasta

    ) {

        throw errorValidacion(
            "La fecha inicial no puede ser posterior a la fecha final."
        );

    }

    return {

        desde: desde || null,

        hasta: hasta || null

    };

}

// ============================================================
// 109. HISTORIAL GENERAL DE NOTIFICACIONES
// ============================================================

async function consultarHistorialNotificaciones(
    req,
    res
) {

    const limite =
        validarLimiteHistorial(
            req.query.limite
        );

    const periodo =
        validarPeriodoHistorial(

            req.query.desde,

            req.query.hasta

        );

    let sql = `
        SELECT

            id,

            actividad_id,

            tipo,

            destinatario,

            asunto,

            estado,

            intentos,

            fecha_programada,

            fecha_envio,

            referencia_externa,

            created_at,

            updated_at,

            COALESCE(

                fecha_envio,

                fecha_programada,

                created_at

            ) AS fecha

        FROM transformin_notificaciones

        WHERE 1 = 1
    `;

    const parametros = [];

    // --------------------------------------------------------
    // FILTRO POR TIPO DE NOTIFICACIÓN
    // --------------------------------------------------------

    if (req.query.tipo) {

        const tipo = normalizarEnum(
            req.query.tipo
        );

        const tiposPermitidos = [

            "ACTIVIDAD",

            "RECORDATORIO",

            "CUMPLEANOS",

            "ADMINISTRATIVA"

        ];

        if (!tiposPermitidos.includes(tipo)) {

            throw errorValidacion(
                "El tipo de notificación no es válido."
            );

        }

        sql += `
            AND tipo = ?
        `;

        parametros.push(tipo);

    }

    // --------------------------------------------------------
    // FILTRO POR ESTADO
    // --------------------------------------------------------

    if (req.query.estado) {

        const estado = normalizarEnum(
            req.query.estado
        );

        const estadosPermitidos = [

            "PENDIENTE",

            "ENVIADO",

            "ERROR",

            "CANCELADO"

        ];

        if (!estadosPermitidos.includes(estado)) {

            throw errorValidacion(
                "El estado de notificación no es válido."
            );

        }

        sql += `
            AND estado = ?
        `;

        parametros.push(estado);

    }

    // --------------------------------------------------------
    // FILTRO POR ACTIVIDAD
    // --------------------------------------------------------

    if (req.query.actividadId) {

        sql += `
            AND actividad_id = ?
        `;

        parametros.push(

            validarId(
                req.query.actividadId
            )

        );

    }

    // --------------------------------------------------------
    // FILTRO POR AÑO
    // --------------------------------------------------------

    if (req.query.anio) {

        sql += `
            AND YEAR(

                COALESCE(

                    fecha_envio,

                    fecha_programada,

                    created_at

                )

            ) = ?
        `;

        parametros.push(

            validarAnio(
                req.query.anio
            )

        );

    }

    // --------------------------------------------------------
    // FILTRO POR FECHA INICIAL
    // --------------------------------------------------------

    if (periodo.desde) {

        sql += `
            AND DATE(

                COALESCE(

                    fecha_envio,

                    fecha_programada,

                    created_at

                )

            ) >= ?
        `;

        parametros.push(
            periodo.desde
        );

    }

    // --------------------------------------------------------
    // FILTRO POR FECHA FINAL
    // --------------------------------------------------------

    if (periodo.hasta) {

        sql += `
            AND DATE(

                COALESCE(

                    fecha_envio,

                    fecha_programada,

                    created_at

                )

            ) <= ?
        `;

        parametros.push(
            periodo.hasta
        );

    }

    // --------------------------------------------------------
    // BÚSQUEDA GENERAL
    // --------------------------------------------------------

    const buscar = normalizarTexto(
        req.query.buscar,
        180
    );

    if (buscar) {

        const termino =
            `%${buscar}%`;

        sql += `
            AND (

                destinatario LIKE ?

                OR asunto LIKE ?

                OR referencia_externa LIKE ?

            )
        `;

        parametros.push(

            termino,

            termino,

            termino

        );

    }

    // --------------------------------------------------------
    // ORDENAMIENTO Y LÍMITE
    // --------------------------------------------------------

    sql += `
        ORDER BY

            fecha DESC,

            id DESC

        LIMIT ?
    `;

    parametros.push(limite);

    const [filas] = await pool.query(
        sql,
        parametros
    );

    const historial = filas.map(
        notificacion => ({

            ...notificacion,

            intentos:
                numero(notificacion.intentos)

        })
    );

    res.json({

        success: true,

        total:
            historial.length,

        limite,

        historial,

        notificaciones:
            historial

    });

}

// ============================================================
// 110. RUTAS DE HISTORIAL DE NOTIFICACIONES
// ============================================================

router.get(
    [

        "/api/historial",

        "/api/historial/notificaciones",

        "/api/notificaciones"

    ],

    ejecutar(
        consultarHistorialNotificaciones
    )
);

// ============================================================
// 111. CONSULTAR NOTIFICACIÓN INDIVIDUAL
// ============================================================

router.get(
    "/api/notificaciones/:id",

    ejecutar(async (req, res) => {

        const id = validarId(
            req.params.id
        );

        const [filas] = await pool.query(
            `
            SELECT

                id,

                actividad_id,

                tipo,

                destinatario,

                asunto,

                mensaje,

                estado,

                intentos,

                fecha_programada,

                fecha_envio,

                referencia_externa,

                created_at,

                updated_at

            FROM transformin_notificaciones

            WHERE id = ?

            LIMIT 1
            `,
            [id]
        );

        if (!filas.length) {

            throw errorValidacion(

                "La notificación solicitada no existe.",

                404

            );

        }

        res.json({

            success: true,

            notificacion: {

                ...filas[0],

                intentos:
                    numero(filas[0].intentos)

            }

        });

    })
);

// ============================================================
// 112. INDICADORES DE NOTIFICACIONES
// ============================================================

router.get(
    "/api/indicadores/notificaciones",

    ejecutar(async (req, res) => {

        const anio = validarAnio(
            req.query.anio
        );

        const [filas] = await pool.query(
            `
            SELECT

                COUNT(*) AS total,

                COALESCE(
                    SUM(
                        estado = 'PENDIENTE'
                    ),
                    0
                ) AS pendientes,

                COALESCE(
                    SUM(
                        estado = 'ENVIADO'
                    ),
                    0
                ) AS enviadas,

                COALESCE(
                    SUM(
                        estado = 'ERROR'
                    ),
                    0
                ) AS errores,

                COALESCE(
                    SUM(
                        estado = 'CANCELADO'
                    ),
                    0
                ) AS canceladas,

                COALESCE(
                    SUM(

                        tipo = 'CUMPLEANOS'

                        AND estado = 'ENVIADO'

                    ),
                    0
                ) AS felicitacionesEnviadas

            FROM transformin_notificaciones

            WHERE YEAR(

                COALESCE(

                    fecha_envio,

                    fecha_programada,

                    created_at

                )

            ) = ?
            `,
            [anio]
        );

        const datos = filas[0] || {};

        const indicadores = {

            total:
                numero(datos.total),

            pendientes:
                numero(datos.pendientes),

            enviadas:
                numero(datos.enviadas),

            errores:
                numero(datos.errores),

            canceladas:
                numero(datos.canceladas),

            felicitacionesEnviadas:
                numero(datos.felicitacionesEnviadas),

            porcentajeEnvio:
                porcentaje(

                    datos.enviadas,

                    datos.total

                )

        };

        res.json({

            success: true,

            anio,

            indicadores

        });

    })
);

// ============================================================
// 113. HISTORIAL DE MODIFICACIONES DE ACTIVIDADES
// ============================================================

async function consultarHistorialActividades(
    req,
    res
) {

    const limite =
        validarLimiteHistorial(
            req.query.limite
        );

    const periodo =
        validarPeriodoHistorial(

            req.query.desde,

            req.query.hasta

        );

    let sql = `
        SELECT

            id,

            origen,

            actividad_id,

            accion,

            estado_anterior,

            estado_nuevo,

            descripcion,

            usuario_id,

            created_at AS fecha

        FROM transformin_actividades_historial

        WHERE 1 = 1
    `;

    const parametros = [];

    // --------------------------------------------------------
    // FILTRO POR ORIGEN
    // --------------------------------------------------------

    if (req.query.origen) {

        const origen = normalizarEnum(
            req.query.origen
        );

        const origenesPermitidos = [

            "MANUAL",

            "FT147",

            "CUMPLEANOS"

        ];

        if (!origenesPermitidos.includes(origen)) {

            throw errorValidacion(
                "El origen del registro no es válido."
            );

        }

        sql += `
            AND origen = ?
        `;

        parametros.push(origen);

    }

    // --------------------------------------------------------
    // FILTRO POR ACTIVIDAD
    // --------------------------------------------------------

    if (req.query.actividadId) {

        sql += `
            AND actividad_id = ?
        `;

        parametros.push(

            validarId(
                req.query.actividadId
            )

        );

    }

    // --------------------------------------------------------
    // FILTRO POR USUARIO
    // --------------------------------------------------------

    if (req.query.usuarioId) {

        sql += `
            AND usuario_id = ?
        `;

        parametros.push(

            validarId(
                req.query.usuarioId
            )

        );

    }

    // --------------------------------------------------------
    // FILTRO POR ACCIÓN
    // --------------------------------------------------------

    if (req.query.accion) {

        const accion = normalizarEnum(
            req.query.accion
        );

        const accionesPermitidas = [

            "CREACION",

            "EDICION",

            "CAMBIO_ESTADO",

            "COMPLETADA",

            "REPROGRAMACION",

            "CANCELACION",

            "ELIMINACION",

            "RESTAURACION"

        ];

        if (!accionesPermitidas.includes(accion)) {

            throw errorValidacion(
                "La acción del historial no es válida."
            );

        }

        sql += `
            AND accion = ?
        `;

        parametros.push(accion);

    }

    // --------------------------------------------------------
    // FILTRO POR FECHAS
    // --------------------------------------------------------

    if (periodo.desde) {

        sql += `
            AND DATE(created_at) >= ?
        `;

        parametros.push(
            periodo.desde
        );

    }

    if (periodo.hasta) {

        sql += `
            AND DATE(created_at) <= ?
        `;

        parametros.push(
            periodo.hasta
        );

    }

    // --------------------------------------------------------
    // FILTRO POR AÑO DEL REGISTRO DE AUDITORÍA
    // --------------------------------------------------------

    if (req.query.anio) {

        sql += `
            AND YEAR(created_at) = ?
        `;

        parametros.push(

            validarAnio(
                req.query.anio
            )

        );

    }

    // --------------------------------------------------------
    // BÚSQUEDA POR DESCRIPCIÓN
    // --------------------------------------------------------

    const buscar = normalizarTexto(
        req.query.buscar,
        180
    );

    if (buscar) {

        sql += `
            AND descripcion LIKE ?
        `;

        parametros.push(
            `%${buscar}%`
        );

    }

    // --------------------------------------------------------
    // ORDENAMIENTO
    // --------------------------------------------------------

    sql += `
        ORDER BY

            created_at DESC,

            id DESC

        LIMIT ?
    `;

    parametros.push(limite);

    const [historial] = await pool.query(
        sql,
        parametros
    );

    res.json({

        success: true,

        total:
            historial.length,

        limite,

        historial,

        registros:
            historial

    });

}

// ============================================================
// 114. RUTAS DE HISTORIAL DE ACTIVIDADES
// ============================================================

router.get(
    [

        "/api/historial/actividades",

        "/api/auditoria"

    ],

    ejecutar(
        consultarHistorialActividades
    )
);

// ============================================================
// 115. NORMALIZAR INFORMACIÓN JSON DEL HISTORIAL
// ============================================================

function interpretarJSONHistorial(valor) {

    if (

        valor === null ||

        valor === undefined

    ) {

        return null;

    }

    if (Buffer.isBuffer(valor)) {

        valor = valor.toString("utf8");

    }

    if (typeof valor === "object") {

        return valor;

    }

    if (typeof valor === "string") {

        try {

            return JSON.parse(valor);

        } catch {

            return null;

        }

    }

    return null;

}

// ============================================================
// 116. CONSULTAR DETALLE DE AUDITORÍA
// ============================================================

router.get(
    [

        "/api/historial/actividades/:id",

        "/api/auditoria/:id"

    ],

    ejecutar(async (req, res) => {

        const id = validarId(
            req.params.id
        );

        const [filas] = await pool.query(
            `
            SELECT

                id,

                origen,

                actividad_id,

                accion,

                estado_anterior,

                estado_nuevo,

                datos_anteriores,

                datos_nuevos,

                descripcion,

                usuario_id,

                created_at AS fecha

            FROM transformin_actividades_historial

            WHERE id = ?

            LIMIT 1
            `,
            [id]
        );

        if (!filas.length) {

            throw errorValidacion(

                "El registro de auditoría no existe.",

                404

            );

        }

        const registro = filas[0];

        res.json({

            success: true,

            registro: {

                ...registro,

                datos_anteriores:
                    interpretarJSONHistorial(
                        registro.datos_anteriores
                    ),

                datos_nuevos:
                    interpretarJSONHistorial(
                        registro.datos_nuevos
                    )

            }

        });

    })
);

// ============================================================
// 117. CONSULTAR HISTORIAL DE UNA ACTIVIDAD MANUAL
// ============================================================

router.get(
    "/api/actividades/:id/historial",

    ejecutar(async (req, res) => {

        const id = validarId(
            req.params.id
        );

        const limite =
            validarLimiteHistorial(
                req.query.limite
            );

        const [historial] = await pool.query(
            `
            SELECT

                id,

                origen,

                actividad_id,

                accion,

                estado_anterior,

                estado_nuevo,

                descripcion,

                usuario_id,

                created_at AS fecha

            FROM transformin_actividades_historial

            WHERE origen = 'MANUAL'

            AND actividad_id = ?

            ORDER BY

                created_at DESC,

                id DESC

            LIMIT ?
            `,
            [

                id,

                limite

            ]
        );

        res.json({

            success: true,

            actividadId: id,

            origen: "MANUAL",

            total:
                historial.length,

            historial

        });

    })
);

// ============================================================
// 118. HISTORIAL DE ACTIVIDAD INSTITUCIONAL
// ============================================================

router.get(
    [

        "/api/institucional/:id/historial",

        "/api/ft-sst-147/:id/historial"

    ],

    ejecutar(async (req, res) => {

        const id = validarId(
            req.params.id
        );

        const limite =
            validarLimiteHistorial(
                req.query.limite
            );

        const [historial] = await pool.query(
            `
            SELECT

                id,

                origen,

                actividad_id,

                accion,

                estado_anterior,

                estado_nuevo,

                descripcion,

                usuario_id,

                created_at AS fecha

            FROM transformin_actividades_historial

            WHERE origen = 'FT147'

            AND actividad_id = ?

            ORDER BY

                created_at DESC,

                id DESC

            LIMIT ?
            `,
            [

                id,

                limite

            ]
        );

        res.json({

            success: true,

            actividadId: id,

            origen: "FT147",

            total:
                historial.length,

            historial

        });

    })
);

// ============================================================
// 119. HISTORIAL INDIVIDUAL DE CUMPLEAÑOS
// ============================================================

router.get(
    "/api/cumpleanos/:empleadoId/historial",

    ejecutar(async (req, res) => {

        const empleadoId = validarId(
            req.params.empleadoId
        );

        const limite =
            validarLimiteHistorial(
                req.query.limite
            );

        const [historial] = await pool.query(
            `
            SELECT

                id,

                origen,

                actividad_id,

                accion,

                descripcion,

                usuario_id,

                created_at AS fecha

            FROM transformin_actividades_historial

            WHERE origen = 'CUMPLEANOS'

            AND actividad_id = ?

            ORDER BY

                created_at DESC,

                id DESC

            LIMIT ?
            `,
            [

                empleadoId,

                limite

            ]
        );

        const [felicitaciones] = await pool.query(
            `
            SELECT

                id,

                tipo,

                destinatario,

                asunto,

                estado,

                intentos,

                fecha_programada,

                fecha_envio,

                referencia_externa,

                COALESCE(

                    fecha_envio,

                    fecha_programada,

                    created_at

                ) AS fecha

            FROM transformin_notificaciones

            WHERE tipo = 'CUMPLEANOS'

            AND referencia_externa LIKE ?

            ORDER BY

                fecha DESC,

                id DESC

            LIMIT ?
            `,
            [

                `CUMPLEANOS-${empleadoId}-%`,

                limite

            ]
        );

        res.json({

            success: true,

            empleadoId,

            origen: "CUMPLEANOS",

            totalCambios:
                historial.length,

            totalFelicitaciones:
                felicitaciones.length,

            historial,

            felicitaciones

        });

    })
);

// ============================================================
// 120. COMPROBAR DISPONIBILIDAD DEL MÓDULO
// ============================================================

router.get(
    "/api/estado",

    ejecutar(async (req, res) => {

        const [resultado] = await pool.query(
            `
            SELECT 1 AS conectado
            `
        );

        const conexionMySQL =

            Number(
                resultado[0]?.conectado
            ) === 1;

        const servicioCumpleanos =
            await cumpleanosService
                .obtenerEstadoServicio();

        res.json({

            success: true,

            modulo:
                "Cronograma de Transformín",

            empresa:
                "Procesados Margarita S.A.S.",

            formato:
                CODIGO_FORMATO,

            fecha:
                fechaColombia(),

            zonaHoraria:
                ZONA_HORARIA,

            servicios: {

                mysql:
                    conexionMySQL,

                excel:
                    typeof excelService
                        .previsualizarExcel === "function" &&

                    typeof excelService
                        .importarExcel === "function" &&

                    typeof excelService
                        .exportarExcel === "function",

                recursosHumanos:
                    typeof cumpleanosService
                        .obtenerCumpleanos === "function",

                tarjetas:
                    typeof cumpleanosService
                        .generarTarjetaEmpleado === "function",

                felicitaciones:
                    typeof cumpleanosService
                        .enviarFelicitacion === "function",

                enviosHabilitados:
                    enviosTransforminHabilitados()

            },

            cumpleanos:
                servicioCumpleanos

        });

    })
);

// ============================================================
// 121. COMPROBAR TABLAS REQUERIDAS
// ============================================================

router.get(
    "/api/diagnostico",

    ejecutar(async (req, res) => {

        const tablasRequeridas = [

            "empleados",

            "transformin_actividades",

            "transformin_configuracion",

            "transformin_notificaciones",

            "transformin_cumpleanos_config",

            "transformin_actividades_historial",

            "transformin_ft147_cronogramas",

            "transformin_ft147_actividades",

            "transformin_ft147_semanas",

            "transformin_ft147_importaciones"

        ];

        const marcadores = tablasRequeridas
            .map(() => "?")
            .join(", ");

        const [filas] = await pool.query(
            `
            SELECT

                TABLE_NAME AS nombre

            FROM INFORMATION_SCHEMA.TABLES

            WHERE TABLE_SCHEMA = DATABASE()

            AND TABLE_NAME IN (
                ${marcadores}
            )
            `,
            tablasRequeridas
        );

        const existentes = new Set(

            filas.map(
                fila => fila.nombre
            )

        );

        const tablas = tablasRequeridas.map(
            nombre => ({

                nombre,

                disponible:
                    existentes.has(nombre)

            })
        );

        const faltantes = tablas.filter(
            tabla => !tabla.disponible
        );

        const servicios = {

            excel: [

                "obtenerCronograma",

                "previsualizarExcel",

                "importarExcel",

                "exportarExcel",

                "obtenerHistorialImportaciones"

            ].map(nombre => ({

                nombre,

                disponible:

                    typeof excelService[nombre] ===
                    "function"

            })),

            cumpleanos: [

                "obtenerCumpleanos",

                "obtenerCumpleanosHoy",

                "obtenerCumpleanosMes",

                "obtenerProximosCumpleanos",

                "obtenerEmpleado",

                "actualizarConfiguracionEmpleado",

                "obtenerIndicadores",

                "obtenerAlertasCumpleanos",

                "obtenerHistorialFelicitaciones",

                "generarTarjetaEmpleado",

                "previsualizarFelicitacion",

                "enviarFelicitacion",

                "obtenerEstadoServicio",

                "verificarSMTP"

            ].map(nombre => ({

                nombre,

                disponible:

                    typeof cumpleanosService[nombre] ===
                    "function"

            }))

        };

        const serviciosCompletos = [

            ...servicios.excel,

            ...servicios.cumpleanos

        ].every(
            servicio => servicio.disponible
        );

        const estructuraDisponible =

            faltantes.length === 0 &&

            serviciosCompletos;

        res.status(

            estructuraDisponible

                ? 200

                : 503

        ).json({

            success:
                estructuraDisponible,

            modulo:
                "Cronograma de Transformín",

            fecha:
                fechaColombia(),

            tablas,

            totalTablas:
                tablas.length,

            tablasDisponibles:
                tablas.length - faltantes.length,

            tablasFaltantes:
                faltantes,

            servicios,

            serviciosCompletos,

            enviosHabilitados:
                enviosTransforminHabilitados(),

            message:

                estructuraDisponible

                    ? "Las tablas y funciones requeridas están disponibles."

                    : "Existen tablas o funciones pendientes de configuración."

        });

    })
);

// ============================================================
// 122. MANEJO DE RUTAS API INEXISTENTES
// ============================================================

router.use(
    "/api",

    (req, res) => {

        return res.status(404).json({

            success: false,

            message:
                "La ruta solicitada del Cronograma de Transformín no existe.",

            metodo:
                req.method

        });

    }
);

// ============================================================
// 123. MANEJO DE ERRORES DE MULTER
// ============================================================

router.use(
    (error, req, res, next) => {

        if (res.headersSent) {

            return next(error);

        }

        if (error instanceof multer.MulterError) {

            switch (error.code) {

                case "LIMIT_FILE_SIZE":

                    return res.status(413).json({

                        success: false,

                        message:
                            "El archivo Excel supera el tamaño máximo permitido de 5 MB."

                    });

                case "LIMIT_FILE_COUNT":

                    return res.status(400).json({

                        success: false,

                        message:
                            "Solo se permite importar un archivo Excel a la vez."

                    });

                case "LIMIT_UNEXPECTED_FILE":

                    return res.status(400).json({

                        success: false,

                        message:
                            "El archivo debe enviarse mediante el campo archivo."

                    });

                case "LIMIT_FIELD_COUNT":

                case "LIMIT_PART_COUNT":

                    return res.status(400).json({

                        success: false,

                        message:
                            "La solicitud contiene demasiados campos."

                    });

                case "LIMIT_FIELD_VALUE":

                    return res.status(413).json({

                        success: false,

                        message:
                            "Uno de los campos supera el tamaño permitido."

                    });

                default:

                    return res.status(400).json({

                        success: false,

                        message:
                            "No fue posible procesar el archivo Excel."

                    });

            }

        }

        return responderError(
            res,
            error
        );

    }
);

// ============================================================
// 124. EXPORTACIÓN DEFINITIVA DEL ROUTER
// ============================================================

module.exports = router;
