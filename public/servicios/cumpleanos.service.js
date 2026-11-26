'use strict';
// ============================================================
// PROCESADOS MARGARITA S.A.S.
// SERVICIO CORPORATIVO DE CUMPLEAÑOS
// TRANSFORMÍN - RECURSOS HUMANOS
// ============================================================
const db = require('../../DB');
const nodemailer = require('nodemailer');
const cron = require('node-cron');
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
// ============================================================
// 01. CONFIGURACIÓN GENERAL
// ============================================================
const CONFIG = Object.freeze({
    zonaHoraria: 'America/Bogota',
    empresa: 'Procesados Margarita S.A.S.',
    mascota: 'Transformín',
    plantilla: path.join(
        __dirname,
        'plantillas',
        'felicitacion-cumpleanos.html'
    ),
    tarjeta: Object.freeze({
        ruta: path.join(
            __dirname,
            'plantillas',
            'tarjeta-cumpleanos.png'
        ),
        ancho: 2000,
        alto: 1294,
        centroX: 532,
        centroY: 610,
        anchoTexto: 804,
        altoTexto: 70,
        fuente: 'Arial',
        tamanoMaximo: 48,
        tamanoMinimo: 18,
        color: '#FFFFFF',
        cid: 'tarjeta-cumpleanos'
    }),
    smtp: Object.freeze({
        host: 'smtp.hostinger.com',
        port: 465,
        secure: true,
        connectionTimeout: 15000,
        greetingTimeout: 15000,
        socketTimeout: 30000
    }),
    frecuenciaRevision: '* * * * *',
    diasAnticipacionMaximos: 60,
    diasProximosCumpleanos: 30,
    horaPredeterminada: '08:00:00',
    maximoMensaje: 10000,
    maximoObservaciones: 10000
});
// ============================================================
// 02. ESTADO INTERNO DEL SERVICIO
// ============================================================
let tareaProgramada = null;
let procesoActivo = false;
let transportador = null;
// ============================================================
// 03. FUNCIONES DE FECHA Y HORA
// ============================================================
function fechaColombia(instante = new Date()) {
    const partes = new Intl.DateTimeFormat('en-CA', {
        timeZone: CONFIG.zonaHoraria,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    }).formatToParts(instante);
    const datos = Object.fromEntries(
        partes.map(parte => [
            parte.type,
            parte.value
        ])
    );
    return `${datos.year}-${datos.month}-${datos.day}`;
}
function horaColombia(instante = new Date()) {
    return new Intl.DateTimeFormat('en-GB', {
        timeZone: CONFIG.zonaHoraria,
        hour: '2-digit',
        minute: '2-digit',
        hourCycle: 'h23'
    }).format(instante);
}
function fechaHoraColombia() {
    const instante = new Date();
    const hora = new Intl.DateTimeFormat('en-GB', {
        timeZone: CONFIG.zonaHoraria,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hourCycle: 'h23'
    }).format(instante);
    return `${fechaColombia(instante)} ${hora}`;
}
function obtenerAnioActual() {
    return Number(
        fechaColombia().slice(0, 4)
    );
}
function obtenerMesActual() {
    return Number(
        fechaColombia().slice(5, 7)
    );
}
// ============================================================
// 04. FUNCIONES AUXILIARES
// ============================================================
function errorValidacion(mensaje, status = 400) {
    const error = new Error(mensaje);
    error.status = status;
    error.statusCode = status;
    return error;
}
function escaparHTML(valor) {
    return String(valor ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}
function normalizarTexto(valor) {
    return String(valor ?? '')
        .normalize('NFC')
        .trim();
}
function numero(valor, defecto = 0) {
    const resultado = Number(valor);
    return Number.isFinite(resultado)
        ? resultado
        : defecto;
}
function tienePropiedad(objeto, propiedad) {
    return Object.prototype.hasOwnProperty.call(
        objeto,
        propiedad
    );
}
function respuesta(mensaje, datos = {}) {
    return {
        success: true,
        mensaje,
        message: mensaje,
        ...datos
    };
}
function respuestaOmitida(mensaje, datos = {}) {
    return {
        success: false,
        omitido: true,
        mensaje,
        message: mensaje,
        ...datos
    };
}
// ============================================================
// 05. VALIDACIONES
// ============================================================
function validarCorreo(correo) {
    const valor = String(correo ?? '').trim();
    if (!valor || valor.length > 254) {
        return false;
    }
    return /^[^\s@<>(),;:"\\]+@[^\s@<>(),;:"\\]+\.[^\s@<>(),;:"\\]+$/
        .test(valor);
}
function validarEmpleadoId(id) {
    const resultado = Number(id);
    if (
        !Number.isSafeInteger(resultado) ||
        resultado <= 0
    ) {
        throw errorValidacion(
            'El identificador del colaborador no es válido.'
        );
    }
    return resultado;
}
function validarBooleano(valor, defecto = true) {
    if (valor === undefined) {
        return defecto ? 1 : 0;
    }
    if ([true, 1, '1', 'true'].includes(valor)) {
        return 1;
    }
    if ([false, 0, '0', 'false'].includes(valor)) {
        return 0;
    }
    throw errorValidacion(
        'El valor de activación no es válido.'
    );
}
function validarHora(hora) {
    if (hora == null || hora === '') {
        return null;
    }
    const valor = String(hora).trim();
    const expresion =
        /^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/;
    if (!expresion.test(valor)) {
        throw errorValidacion(
            'La hora de envío no es válida.'
        );
    }
    return valor.length === 5
        ? `${valor}:00`
        : valor;
}
function validarTexto(valor, maximo) {
    if (valor != null && typeof valor !== 'string') {
        throw errorValidacion(
            'El campo debe contener texto.'
        );
    }
    const texto = normalizarTexto(valor);
    if (texto.length > maximo) {
        throw errorValidacion(
            `El texto supera los ${maximo} caracteres permitidos.`
        );
    }
    return texto || null;
}
function validarDiasAnticipacion(valor) {
    if (valor == null || valor === '') {
        return null;
    }
    const dias = Number(valor);
    if (
        !Number.isInteger(dias) ||
        dias < 0 ||
        dias > CONFIG.diasAnticipacionMaximos
    ) {
        throw errorValidacion(
            'La anticipación debe estar entre 0 y 60 días.'
        );
    }
    return dias;
}
function validarMes(mes) {
    const resultado = Number(mes);
    if (
        !Number.isInteger(resultado) ||
        resultado < 1 ||
        resultado > 12
    ) {
        throw errorValidacion(
            'El mes seleccionado no es válido.'
        );
    }
    return resultado;
}
// ============================================================
// 06. CONTROL PREVENTIVO DE ENVÍOS
// ============================================================
function enviosHabilitados() {
    return process.env.TRANSFORMIN_ENVIO_HABILITADO
        === 'true';
}
// ============================================================
// 07. NORMALIZAR CONFIGURACIÓN INDIVIDUAL
// ============================================================
function normalizarConfiguracion(datos = {}) {
    if (
        !datos ||
        typeof datos !== 'object' ||
        Array.isArray(datos)
    ) {
        throw errorValidacion(
            'La configuración recibida no es válida.'
        );
    }
    const equivalencias = {
        alertaActiva: 'alerta_activa',
        felicitacionActiva: 'felicitacion_activa',
        diasAnticipacion: 'dias_anticipacion',
        horaEnvio: 'hora_envio',
        asuntoPersonalizado: 'asunto_personalizado',
        mensajePersonalizado: 'mensaje_personalizado',
        observaciones: 'observaciones'
    };
    const resultado = {};
    for (const [camelCase, snakeCase] of Object.entries(
        equivalencias
    )) {
        if (
            tienePropiedad(datos, camelCase) &&
            datos[camelCase] !== undefined
        ) {
            resultado[snakeCase] = datos[camelCase];
        } else if (
            tienePropiedad(datos, snakeCase) &&
            datos[snakeCase] !== undefined
        ) {
            resultado[snakeCase] = datos[snakeCase];
        }
    }
    return resultado;
}
// ============================================================
// 08. CÁLCULO DE CUMPLEAÑOS
// ============================================================
function construirFechaCumpleanos(anio, mes, dia) {
    anio = Number(anio);
    mes = validarMes(mes);
    dia = Number(dia);
    const maximoDiaOriginal = new Date(
        Date.UTC(2000, mes, 0)
    ).getUTCDate();
    if (
        !Number.isInteger(anio) ||
        anio < 1900 ||
        anio > 9999 ||
        !Number.isInteger(dia) ||
        dia < 1 ||
        dia > maximoDiaOriginal
    ) {
        throw errorValidacion(
            'La fecha de cumpleaños no es válida.'
        );
    }
    const ultimoDia = new Date(
        Date.UTC(anio, mes, 0)
    ).getUTCDate();
    // Para el 29 de febrero se utiliza el último
    // día de febrero cuando el año no es bisiesto.
    const diaValido = Math.min(
        dia,
        ultimoDia
    );
    return [
        String(anio).padStart(4, '0'),
        String(mes).padStart(2, '0'),
        String(diaValido).padStart(2, '0')
    ].join('-');
}
function calcularProximoCumpleanos(
    mes,
    dia,
    hoy = fechaColombia()
) {
    const anio = Number(
        hoy.slice(0, 4)
    );
    let fecha = construirFechaCumpleanos(
        anio,
        mes,
        dia
    );
    if (fecha < hoy) {
        fecha = construirFechaCumpleanos(
            anio + 1,
            mes,
            dia
        );
    }
    return fecha;
}
function calcularDiasRestantes(
    fecha,
    hoy = fechaColombia()
) {
    const inicio = Date.parse(
        `${hoy}T00:00:00Z`
    );
    const destino = Date.parse(
        `${fecha}T00:00:00Z`
    );
    if (
        !Number.isFinite(inicio) ||
        !Number.isFinite(destino)
    ) {
        throw errorValidacion(
            'No fue posible calcular los días restantes.'
        );
    }
    return Math.round(
        (destino - inicio) / 86400000
    );
}
// ============================================================
// 09. CONFIGURACIÓN GLOBAL
// ============================================================
async function obtenerConfiguracionGlobal(
    ejecutor = db
) {
    const [filas] = await ejecutor.execute(`

        SELECT

            id,

            recordatorios_activos,

            dias_anticipacion,

            felicitaciones_activas,

            hora_felicitaciones,

            avisos_admin_activos,

            correo_notificaciones

        FROM transformin_configuracion

        WHERE id = 1

        LIMIT 1

    `);
    const defecto = {
        id: 1,
        recordatorios_activos: 0,
        dias_anticipacion: 7,
        felicitaciones_activas: 0,
        hora_felicitaciones:
            CONFIG.horaPredeterminada,
        avisos_admin_activos: 0,
        correo_notificaciones: null
    };
    return {
        ...defecto,
        ...(filas[0] || {})
    };
}
// ============================================================
// 10. CONSULTA BASE DE RECURSOS HUMANOS
// ============================================================
async function consultarEmpleados(
    ejecutor = db,
    empleadoId = null
) {
    const parametros = [];
    let filtroEmpleado = '';
    if (empleadoId !== null) {
        filtroEmpleado = 'AND e.id = ?';
        parametros.push(
            validarEmpleadoId(empleadoId)
        );
    }
    const [empleados] = await ejecutor.execute(`

        SELECT

            e.id AS empleado_id,

            e.codigo,

            e.nombre,

            e.email,

            e.cargo_id,

            e.area_id,

            e.sede_id,

            MONTH(e.fecha_nacimiento) AS mes,

            DAY(e.fecha_nacimiento) AS dia,

            COALESCE(c.alerta_activa, 1)

                AS alerta_activa,

            COALESCE(c.felicitacion_activa, 1)

                AS felicitacion_activa,

            c.dias_anticipacion,

            c.hora_envio,

            c.asunto_personalizado,

            c.mensaje_personalizado,

            c.observaciones

        FROM empleados e

        LEFT JOIN transformin_cumpleanos_config c

            ON c.empleado_id = e.id

        WHERE e.activo = 'SI'

        AND e.fecha_nacimiento IS NOT NULL

        AND MONTH(e.fecha_nacimiento) BETWEEN 1 AND 12

        AND DAY(e.fecha_nacimiento) BETWEEN 1 AND 31

        ${filtroEmpleado}

        ORDER BY

            mes ASC,

            dia ASC,

            e.nombre ASC

    `, parametros);
    return empleados;
}
// ============================================================
// 11. NORMALIZAR INFORMACIÓN DEL COLABORADOR
// ============================================================
function normalizarEmpleado(
    empleado,
    configuracion,
    hoy = fechaColombia()
) {
    const empleadoId = Number(
        empleado.empleado_id
    );
    const mes = Number(empleado.mes);
    const dia = Number(empleado.dia);
    const fecha = calcularProximoCumpleanos(
        mes,
        dia,
        hoy
    );
    const diasRestantes = calcularDiasRestantes(
        fecha,
        hoy
    );
    const alertaActiva =
        Number(empleado.alerta_activa) === 1;
    const felicitacionActiva =
        Number(empleado.felicitacion_activa) === 1;
    const anticipacionPersonalizada =
        empleado.dias_anticipacion == null
            ? null
            : Number(empleado.dias_anticipacion);
    const horaPersonalizada =
        empleado.hora_envio || null;
    const anticipacion = Number(
        anticipacionPersonalizada ??
        configuracion.dias_anticipacion ??
        7
    );
    const horaEnvio =
        horaPersonalizada ||
        configuracion.hora_felicitaciones ||
        CONFIG.horaPredeterminada;
    const alertaDisponible =
        Number(configuracion.recordatorios_activos) === 1 &&
        alertaActiva &&
        diasRestantes >= 0 &&
        diasRestantes <= anticipacion;
    const correoDisponible = validarCorreo(
        empleado.email
    );
    const fechaAnual = construirFechaCumpleanos(
        Number(hoy.slice(0, 4)),
        mes,
        dia
    );
    return {
        ...empleado,
        id: empleadoId,
        empleado_id: empleadoId,
        empleadoId,
        nombre: normalizarTexto(empleado.nombre),
        nombre_completo:
            normalizarTexto(empleado.nombre),
        email: normalizarTexto(empleado.email) || null,
        mes,
        dia,
        fecha,
        fecha_anual: fechaAnual,
        proximo_cumpleanos: fecha,
        fecha_cumpleanos: fecha,
        dias_restantes: diasRestantes,
        diasRestantes,
        es_hoy: diasRestantes === 0,
        esHoy: diasRestantes === 0,
        origen: 'CUMPLEANOS',
        tipo: 'CUMPLEANOS',
        alerta_activa: alertaActiva,
        alertaActiva,
        felicitacion_activa: felicitacionActiva,
        felicitacionActiva,
        dias_anticipacion: anticipacion,
        diasAnticipacion: anticipacion,
        dias_anticipacion_personalizados:
            anticipacionPersonalizada,
        hora_envio: horaEnvio,
        horaEnvio,
        hora_envio_personalizada:
            horaPersonalizada,
        asuntoPersonalizado:
            empleado.asunto_personalizado || null,
        mensajePersonalizado:
            empleado.mensaje_personalizado || null,
        configuracion_personalizada: {
            alerta_activa: alertaActiva,
            felicitacion_activa: felicitacionActiva,
            dias_anticipacion:
                anticipacionPersonalizada,
            hora_envio:
                horaPersonalizada,
            asunto_personalizado:
                empleado.asunto_personalizado || null,
            mensaje_personalizado:
                empleado.mensaje_personalizado || null,
            observaciones:
                empleado.observaciones || null
        },
        alerta_disponible: alertaDisponible,
        alertaDisponible,
        correo_disponible: correoDisponible,
        correoDisponible,
        felicitaciones_globales_activas:
            Number(configuracion.felicitaciones_activas) === 1
    };
}
// ============================================================
// 12. OBTENER TODOS LOS CUMPLEAÑOS
// ============================================================
async function obtenerCumpleanos() {
    const hoy = fechaColombia();
    const [
        configuracion,
        empleados
    ] = await Promise.all([
        obtenerConfiguracionGlobal(),
        consultarEmpleados()
    ]);
    return empleados
        .map(empleado =>
            normalizarEmpleado(
                empleado,
                configuracion,
                hoy
            )
        )
        .sort((a, b) =>
            a.dias_restantes - b.dias_restantes ||
            a.nombre.localeCompare(
                b.nombre,
                'es'
            )
        );
}
// ============================================================
// 13. CUMPLEAÑOS DEL DÍA
// ============================================================
async function obtenerCumpleanosHoy() {
    const empleados = await obtenerCumpleanos();
    return empleados.filter(
        empleado => empleado.es_hoy
    );
}
// ============================================================
// 14. CUMPLEAÑOS POR MES
// ============================================================
async function obtenerCumpleanosMes(
    mes = obtenerMesActual(),
    anio = null
) {
    mes = validarMes(mes);
    if (anio !== null && anio !== undefined) {
        return obtenerCumpleanosCalendario(anio, mes);
    }
    const empleados = await obtenerCumpleanos();
    return empleados
        .filter(
            empleado => empleado.mes === mes
        )
        .sort((a, b) =>
            a.dia - b.dia ||
            a.nombre.localeCompare(
                b.nombre,
                'es'
            )
        );
}
// Consulta anual para el calendario, independiente de los envíos.
// Conserva la fecha de nacimiento de Recursos Humanos y no escribe en MySQL.
async function obtenerCumpleanosCalendario(anio = obtenerAnioActual(), mes = null) {
    anio = Number(anio);
    if (!Number.isInteger(anio) || anio < 1900 || anio > 9999) {
        throw errorValidacion('El año del calendario no es válido.');
    }
    if (mes !== null && mes !== undefined) mes = validarMes(mes);
    const hoy = fechaColombia();
    const empleados = await obtenerCumpleanos();
    return empleados.filter(e => mes == null || e.mes === mes).map(e => {
        const fecha = construirFechaCumpleanos(anio, e.mes, e.dia);
        const dias = calcularDiasRestantes(fecha, hoy);
        return {
            ...e,
            evento_id: `CUMPLEANOS-${e.empleado_id}-${anio}`,
            fecha, fecha_anual: fecha, fecha_cumpleanos: fecha,
            anio, mes: Number(fecha.slice(5, 7)), dia: Number(fecha.slice(8, 10)),
            dias_restantes: dias, diasRestantes: dias,
            es_hoy: dias === 0, esHoy: dias === 0,
            alerta_disponible: dias >= 0 && dias <= e.dias_anticipacion && e.alerta_activa && e.alerta_disponible && e.proximo_cumpleanos === fecha,
            alertaDisponible: dias >= 0 && dias <= e.dias_anticipacion && e.alerta_activa && e.alerta_disponible && e.proximo_cumpleanos === fecha,
            fechaEditable: false
        };
    }).sort((a, b) => a.fecha.localeCompare(b.fecha) || a.nombre.localeCompare(b.nombre, 'es'));
}
// ============================================================
// 15. PRÓXIMOS CUMPLEAÑOS
// ============================================================
async function obtenerProximosCumpleanos(
    dias = CONFIG.diasProximosCumpleanos
) {
    dias = Number(dias);
    if (
        !Number.isInteger(dias) ||
        dias < 0 ||
        dias > 366
    ) {
        throw errorValidacion(
            'El rango debe estar entre 0 y 366 días.'
        );
    }
    const empleados = await obtenerCumpleanos();
    return empleados.filter(
        empleado =>
            empleado.dias_restantes >= 0 &&
            empleado.dias_restantes <= dias
    );
}
// ============================================================
// 16. CONSULTAR COLABORADOR INDIVIDUAL
// ============================================================
async function obtenerEmpleado(
    empleadoId,
    ejecutor = db
) {
    empleadoId = validarEmpleadoId(empleadoId);
    const empleados = await consultarEmpleados(
        ejecutor,
        empleadoId
    );
    if (!empleados.length) {
        throw errorValidacion(
            'El colaborador no está activo o no tiene una fecha de nacimiento válida.',
            404
        );
    }
    const configuracion =
        await obtenerConfiguracionGlobal(
            ejecutor
        );
    return normalizarEmpleado(
        empleados[0],
        configuracion
    );
}
// ============================================================
// 17. CONFIGURACIÓN INDIVIDUAL PREDETERMINADA
// ============================================================
function configuracionIndividualPredeterminada() {
    return {
        alerta_activa: 1,
        felicitacion_activa: 1,
        dias_anticipacion: null,
        hora_envio: null,
        asunto_personalizado: null,
        mensaje_personalizado: null,
        observaciones: null
    };
}
function validarConfiguracionIndividual(config) {
    const alertaActiva = validarBooleano(
        config.alerta_activa
    );
    const felicitacionActiva = validarBooleano(
        config.felicitacion_activa
    );
    const dias = validarDiasAnticipacion(
        config.dias_anticipacion
    );
    const hora = validarHora(
        config.hora_envio
    );
    const asunto = validarTexto(
        config.asunto_personalizado,
        255
    );
    if (asunto && /[\r\n]/.test(asunto)) {
        throw errorValidacion(
            'El asunto contiene caracteres no permitidos.'
        );
    }
    const mensaje = validarTexto(
        config.mensaje_personalizado,
        CONFIG.maximoMensaje
    );
    const observaciones = validarTexto(
        config.observaciones,
        CONFIG.maximoObservaciones
    );
    return {
        alerta_activa: alertaActiva,
        felicitacion_activa: felicitacionActiva,
        dias_anticipacion: dias,
        hora_envio: hora,
        asunto_personalizado: asunto,
        mensaje_personalizado: mensaje,
        observaciones
    };
}
// ============================================================
// 18. REGISTRAR HISTORIAL DE CONFIGURACIÓN
// ============================================================
async function registrarHistorialConfiguracion(
    conexion,
    empleadoId,
    anterior,
    nueva,
    usuarioId = null
) {
    const cambios = [];
    for (const clave of Object.keys(nueva)) {
        if (
            String(anterior[clave] ?? '') !==
            String(nueva[clave] ?? '')
        ) {
            cambios.push(clave);
        }
    }
    if (!cambios.length) {
        return false;
    }
    const descripcion =
        'Actualización de configuración de cumpleaños: ' +
        cambios.join(', ');
    await conexion.execute(`

        INSERT INTO transformin_actividades_historial (

            origen,

            actividad_id,

            accion,

            datos_anteriores,

            datos_nuevos,

            descripcion,

            usuario_id

        )

        VALUES (

            'CUMPLEANOS',

            ?,

            'EDICION',

            ?,

            ?,

            ?,

            ?

        )

    `, [
        empleadoId,
        JSON.stringify(anterior),
        JSON.stringify(nueva),
        descripcion,
        usuarioId
    ]);
    return true;
}
// ============================================================
// 19. ACTUALIZAR CONFIGURACIÓN INDIVIDUAL
// ============================================================
async function actualizarConfiguracionEmpleado(
    empleadoId,
    datos = {},
    usuarioId = null
) {
    empleadoId = validarEmpleadoId(empleadoId);
    const datosNormalizados =
        normalizarConfiguracion(datos);
    if (!Object.keys(datosNormalizados).length) {
        throw errorValidacion(
            'No se recibieron campos válidos para actualizar.'
        );
    }
    const conexion = await db.getConnection();
    try {
        await conexion.beginTransaction();
        // Bloquear el registro del colaborador
        // durante la actualización.
        const [empleados] = await conexion.execute(`

            SELECT id

            FROM empleados

            WHERE id = ?

            AND activo = 'SI'

            AND fecha_nacimiento IS NOT NULL

            FOR UPDATE

        `, [empleadoId]);
        if (!empleados.length) {
            throw errorValidacion(
                'El colaborador no está disponible.',
                404
            );
        }
        const [filas] = await conexion.execute(`

            SELECT

                alerta_activa,

                felicitacion_activa,

                dias_anticipacion,

                hora_envio,

                asunto_personalizado,

                mensaje_personalizado,

                observaciones

            FROM transformin_cumpleanos_config

            WHERE empleado_id = ?

            LIMIT 1

            FOR UPDATE

        `, [empleadoId]);
        const anterior = {
            ...configuracionIndividualPredeterminada(),
            ...(filas[0] || {})
        };
        const nueva = validarConfiguracionIndividual({
            ...anterior,
            ...datosNormalizados
        });
        const valores = [
            nueva.alerta_activa,
            nueva.felicitacion_activa,
            nueva.dias_anticipacion,
            nueva.hora_envio,
            nueva.asunto_personalizado,
            nueva.mensaje_personalizado,
            nueva.observaciones,
            usuarioId
        ];
        await conexion.execute(`

            INSERT INTO transformin_cumpleanos_config (

                empleado_id,

                alerta_activa,

                felicitacion_activa,

                dias_anticipacion,

                hora_envio,

                asunto_personalizado,

                mensaje_personalizado,

                observaciones,

                actualizado_por

            )

            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)

            ON DUPLICATE KEY UPDATE

                alerta_activa = ?,

                felicitacion_activa = ?,

                dias_anticipacion = ?,

                hora_envio = ?,

                asunto_personalizado = ?,

                mensaje_personalizado = ?,

                observaciones = ?,

                actualizado_por = ?

        `, [
            empleadoId,
            ...valores,
            ...valores
        ]);
        await registrarHistorialConfiguracion(
            conexion,
            empleadoId,
            anterior,
            nueva,
            usuarioId
        );
        const empleado = await obtenerEmpleado(
            empleadoId,
            conexion
        );
        await conexion.commit();
        return respuesta(
            'Configuración de cumpleaños actualizada correctamente.',
            {
                empleado,
                configuracion: nueva
            }
        );
    } catch (error) {
        await conexion.rollback();
        throw error;
    } finally {
        conexion.release();
    }
}
// ============================================================
// 20. CONFIGURACIÓN SMTP HOSTINGER
// ============================================================
function obtenerTransportador() {
    if (transportador) {
        return transportador;
    }
    if (
        !process.env.EMAIL_USER ||
        !process.env.EMAIL_PASS
    ) {
        throw new Error(
            'No se encuentran configuradas las credenciales SMTP.'
        );
    }
    if (!validarCorreo(process.env.EMAIL_USER)) {
        throw new Error(
            'El correo SMTP configurado no es válido.'
        );
    }
    transportador = nodemailer.createTransport({
        host: CONFIG.smtp.host,
        port: CONFIG.smtp.port,
        secure: CONFIG.smtp.secure,
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        },
        connectionTimeout:
            CONFIG.smtp.connectionTimeout,
        greetingTimeout:
            CONFIG.smtp.greetingTimeout,
        socketTimeout:
            CONFIG.smtp.socketTimeout,
        disableFileAccess: true,
        disableUrlAccess: true,
        tls: {
            rejectUnauthorized: true
        }
    });
    return transportador;
}
// ============================================================
// 21. PERSONALIZACIÓN DE MENSAJES
// ============================================================
function reemplazarVariables(texto, empleado) {
    const variables = {
        NOMBRE: empleado.nombre,
        EMPRESA: CONFIG.empresa,
        MASCOTA: CONFIG.mascota,
        FECHA: fechaColombia()
    };
    return String(texto ?? '').replace(
        /\{\{([A-Z_]+)\}\}/g,
        (original, clave) =>
            tienePropiedad(variables, clave)
                ? String(variables[clave])
                : original
    );
}
function generarMensaje(empleado) {
    const asuntoPredeterminado =
        `¡Feliz cumpleaños, ${empleado.nombre}!`;
    const mensajePredeterminado =
        `En ${CONFIG.empresa} queremos celebrar ` +
        `este día tan especial contigo.\n\n` +
        `Agradecemos tu compromiso, dedicación y aporte ` +
        `a nuestra familia empresarial.\n\n` +
        `Transformín y todo nuestro equipo te desean ` +
        `un feliz cumpleaños, lleno de alegría, bienestar ` +
        `y nuevos logros.\n\n` +
        `¡Que este nuevo año de vida esté acompañado ` +
        `de grandes oportunidades y momentos especiales!`;
    const asunto = reemplazarVariables(
        empleado.asunto_personalizado ||
        asuntoPredeterminado,
        empleado
    );
    const mensaje = reemplazarVariables(
        empleado.mensaje_personalizado ||
        mensajePredeterminado,
        empleado
    );
    if (
        asunto.length > 255 ||
        /[\r\n]/.test(asunto)
    ) {
        throw errorValidacion(
            'El asunto personalizado no es válido.'
        );
    }
    if (mensaje.length > CONFIG.maximoMensaje) {
        throw errorValidacion(
            'El mensaje personalizado supera la longitud permitida.'
        );
    }
    return {
        asunto,
        mensaje
    };
}
// ============================================================
// 22. VALIDAR TARJETA CORPORATIVA
// ============================================================
async function validarTarjetaOriginal() {
    await fs.promises.access(
        CONFIG.tarjeta.ruta,
        fs.constants.R_OK
    );
    const metadata = await sharp(
        CONFIG.tarjeta.ruta
    ).metadata();
    if (
        metadata.width !== CONFIG.tarjeta.ancho ||
        metadata.height !== CONFIG.tarjeta.alto
    ) {
        throw new Error(
            'La tarjeta corporativa debe conservar una resolución de ' +
            `${CONFIG.tarjeta.ancho} x ` +
            `${CONFIG.tarjeta.alto} píxeles.`
        );
    }
    if (metadata.format !== 'png') {
        throw new Error(
            'La tarjeta corporativa debe estar en formato PNG.'
        );
    }
    return metadata;
}
// ============================================================
// 23. GENERAR TEXTO PERSONALIZADO CON SHARP
// ============================================================
async function generarTextoTarjeta(nombre) {
    const config = CONFIG.tarjeta;
    const nombreSeguro = escaparHTML(nombre);
    for (
        let tamano = config.tamanoMaximo;
        tamano >= config.tamanoMinimo;
        tamano -= 2
    ) {
        const resultado = await sharp({
            text: {
                text:
                    `<span foreground="${config.color}">` +
                    `${nombreSeguro}</span>`,
                font:
                    `${config.fuente} Bold ${tamano}`,
                dpi: 72,
                rgba: true
            }
        })
        .png()
        .toBuffer({
            resolveWithObject: true
        });
        if (
            resultado.info.width <= config.anchoTexto &&
            resultado.info.height <= config.altoTexto
        ) {
            return resultado;
        }
    }
    // Segunda alternativa:
    // permitir que un nombre extenso ocupe dos líneas.
    for (
        let tamano = 32;
        tamano >= config.tamanoMinimo;
        tamano -= 2
    ) {
        const resultado = await sharp({
            text: {
                text:
                    `<span foreground="${config.color}">` +
                    `${nombreSeguro}</span>`,
                font:
                    `${config.fuente} Bold ${tamano}`,
                width: config.anchoTexto,
                align: 'centre',
                wrap: 'word-char',
                dpi: 72,
                rgba: true
            }
        })
        .png()
        .toBuffer({
            resolveWithObject: true
        });
        if (
            resultado.info.width <= config.anchoTexto &&
            resultado.info.height <= config.altoTexto
        ) {
            return resultado;
        }
    }
    throw errorValidacion(
        'El nombre no cabe dentro del recuadro de la tarjeta.'
    );
}
// ============================================================
// 24. GENERAR TARJETA PERSONALIZADA
// ============================================================
async function generarTarjetaCumpleanos(nombre) {
    const config = CONFIG.tarjeta;
    const nombreNormalizado = normalizarTexto(nombre)
        .replace(/\s+/g, ' ')
        .toLocaleUpperCase('es-CO');
    if (!nombreNormalizado) {
        throw errorValidacion(
            'El nombre del colaborador es obligatorio.'
        );
    }
    if (nombreNormalizado.length > 150) {
        throw errorValidacion(
            'El nombre supera la longitud permitida.'
        );
    }
    await validarTarjetaOriginal();
    const texto = await generarTextoTarjeta(
        nombreNormalizado
    );
    const izquierda = Math.round(
        config.centroX -
        texto.info.width / 2
    );
    const superior = Math.round(
        config.centroY -
        texto.info.height / 2
    );
    if (
        izquierda < 0 ||
        superior < 0 ||
        izquierda + texto.info.width > config.ancho ||
        superior + texto.info.height > config.alto
    ) {
        throw new Error(
            'El texto supera los límites de la tarjeta.'
        );
    }
    return sharp(config.ruta)
        .composite([
            {
                input: texto.data,
                left: izquierda,
                top: superior
            }
        ])
        .png({
            compressionLevel: 9
        })
        .toBuffer();
}
// ============================================================
// 25. GENERAR TARJETA DESDE EL ID DEL COLABORADOR
// ============================================================
async function generarTarjetaEmpleado(empleadoId) {
    const empleado = await obtenerEmpleado(
        empleadoId
    );
    return generarTarjetaCumpleanos(
        empleado.nombre
    );
}
// ============================================================
// 26. PLANTILLA HTML DE RESPALDO
// ============================================================
function obtenerPlantillaRespaldo() {
    return `

        <!DOCTYPE html>

        <html lang="es">

        <head>

            <meta charset="UTF-8">

            <meta
                name="viewport"
                content="width=device-width, initial-scale=1.0"
            >

            <title>Felicitación de cumpleaños</title>

        </head>

        <body style="
            margin:0;
            padding:20px;
            background:#f3f7f6;
            font-family:Arial,sans-serif;
        ">

            <table
                role="presentation"
                width="100%"
                cellspacing="0"
                cellpadding="0"
                style="max-width:760px;margin:auto;background:#ffffff;"
            >

                <tr>

                    <td style="
                        background:#0b2345;
                        padding:25px;
                        text-align:center;
                        color:#ffffff;
                    ">

                        <h2 style="margin:0;">

                            {{EMPRESA}}

                        </h2>

                        <p>

                            Transformamos materiales,
                            construimos futuro.

                        </p>

                    </td>

                </tr>

                <tr>

                    <td>

                        <img
                            src="cid:tarjeta-cumpleanos"
                            alt="Feliz cumpleaños, {{NOMBRE}}"
                            width="760"
                            style="
                                display:block;
                                width:100%;
                                height:auto;
                            "
                        >

                    </td>

                </tr>

                <tr>

                    <td style="
                        padding:30px;
                        text-align:center;
                    ">

                        <h1 style="color:#0b2345;">

                            ¡Feliz cumpleaños!

                        </h1>

                        <h2 style="color:#16a34a;">

                            {{NOMBRE}}

                        </h2>

                        <div style="
                            color:#334155;
                            line-height:1.8;
                            font-size:16px;
                        ">

                            {{MENSAJE}}

                        </div>

                    </td>

                </tr>

                <tr>

                    <td style="
                        padding:25px;
                        text-align:center;
                        background:#0b2345;
                        color:#ffffff;
                    ">

                        <strong>

                            {{EMPRESA}}

                        </strong>

                        <p>

                            Bienestar y Gestión Humana

                        </p>

                        <p>

                            Con los mejores deseos de
                            {{MASCOTA}}.

                        </p>

                        <p>

                            {{FECHA}}

                        </p>

                    </td>

                </tr>

            </table>

        </body>

        </html>

    `;
}
// ============================================================
// 27. GENERAR CORREO HTML
// ============================================================
async function generarHTML(empleado, mensaje) {
    let plantilla;
    try {
        plantilla = await fs.promises.readFile(
            CONFIG.plantilla,
            'utf8'
        );
    } catch (error) {
        if (error.code !== 'ENOENT') {
            throw error;
        }
        plantilla = obtenerPlantillaRespaldo();
    }
    if (!plantilla.trim()) {
        throw new Error(
            'La plantilla de felicitaciones está vacía.'
        );
    }
    const variables = {
        NOMBRE:
            escaparHTML(empleado.nombre),
        MENSAJE:
            escaparHTML(mensaje)
                .replace(/\r?\n/g, '<br>'),
        EMPRESA:
            escaparHTML(CONFIG.empresa),
        MASCOTA:
            escaparHTML(CONFIG.mascota),
        FECHA:
            escaparHTML(fechaColombia())
    };
    return plantilla.replace(
        /\{\{([A-Z_]+)\}\}/g,
        (original, clave) =>
            tienePropiedad(variables, clave)
                ? variables[clave]
                : original
    );
}
// ============================================================
// 28. REFERENCIA ÚNICA DE FELICITACIÓN
// ============================================================
function generarReferencia(
    empleadoId,
    anio = obtenerAnioActual()
) {
    empleadoId = validarEmpleadoId(empleadoId);
    return `CUMPLEANOS-${empleadoId}-${anio}`;
}
// ============================================================
// 29. CONSULTAR NOTIFICACIÓN EXISTENTE
// ============================================================
async function obtenerNotificacionExistente(
    conexion,
    referencia
) {
    const [registros] = await conexion.execute(`

        SELECT

            id,

            estado,

            intentos,

            fecha_envio,

            error_detalle

        FROM transformin_notificaciones

        WHERE referencia_externa = ?

        AND tipo = 'CUMPLEANOS'

        ORDER BY

            CASE estado

                WHEN 'ENVIADO' THEN 1

                WHEN 'PENDIENTE' THEN 2

                WHEN 'CANCELADO' THEN 3

                ELSE 4

            END,

            id DESC

        LIMIT 1

    `, [referencia]);
    return registros[0] || null;
}
// ============================================================
// 30. REGISTRAR INTENTO DE FELICITACIÓN
// ============================================================
async function registrarIntentoEnvio(
    conexion,
    empleado,
    contenido,
    referencia,
    existente
) {
    const fechaProgramada =
        `${fechaColombia()} ${

            validarHora(empleado.hora_envio) ||

            CONFIG.horaPredeterminada

        }`;
    if (existente) {
        await conexion.execute(`

            UPDATE transformin_notificaciones

            SET

                destinatario = ?,

                asunto = ?,

                mensaje = ?,

                estado = 'PENDIENTE',

                fecha_programada = ?,

                fecha_envio = NULL,

                intentos = intentos + 1,

                error_detalle = NULL

            WHERE id = ?

        `, [
            empleado.email,
            contenido.asunto,
            contenido.mensaje,
            fechaProgramada,
            existente.id
        ]);
        return existente.id;
    }
    const [resultado] = await conexion.execute(`

        INSERT INTO transformin_notificaciones (

            tipo,

            destinatario,

            asunto,

            mensaje,

            estado,

            fecha_programada,

            intentos,

            referencia_externa

        )

        VALUES (

            'CUMPLEANOS',

            ?, ?, ?,

            'PENDIENTE',

            ?,

            1,

            ?

        )

    `, [
        empleado.email,
        contenido.asunto,
        contenido.mensaje,
        fechaProgramada,
        referencia
    ]);
    return resultado.insertId;
}
// ============================================================
// 31. REGISTRAR ENVÍO EXITOSO
// ============================================================
async function registrarEnvioExitoso(
    conexion,
    notificacionId
) {
    await conexion.execute(`

        UPDATE transformin_notificaciones

        SET

            estado = 'ENVIADO',

            fecha_envio = ?,

            error_detalle = NULL

        WHERE id = ?

    `, [
        fechaHoraColombia(),
        notificacionId
    ]);
}
// ============================================================
// 32. REGISTRAR ERROR DE ENVÍO
// ============================================================
async function registrarErrorEnvio(
    conexion,
    notificacionId,
    error,
    smtpIniciado
) {
    if (!notificacionId) {
        return;
    }
    // Cuando el resultado del SMTP es incierto,
    // no se debe reenviar automáticamente.
    const estado = smtpIniciado
        ? 'PENDIENTE'
        : 'ERROR';
    const detalle = String(
        error.message || 'Error de envío.'
    ).slice(0, 1000);
    await conexion.execute(`

        UPDATE transformin_notificaciones

        SET

            estado = ?,

            error_detalle = ?

        WHERE id = ?

    `, [
        estado,
        detalle,
        notificacionId
    ]);
}
// ============================================================
// 33. ENVIAR FELICITACIÓN PERSONALIZADA
// ============================================================
async function enviarFelicitacion(
    empleadoId,
    opciones = {}
) {
    empleadoId = validarEmpleadoId(empleadoId);
    if (!enviosHabilitados()) {
        return respuestaOmitida(
            'Los envíos reales de felicitaciones están deshabilitados.'
        );
    }
    const manual = opciones.manual === true;
    const referencia = generarReferencia(
        empleadoId
    );
    let conexion = await db.getConnection();
    let bloqueo = false;
    let notificacionId = null;
    let smtpIniciado = false;
    try {
        // Bloqueo distribuido en MySQL.
        // Evita envíos simultáneos desde varios procesos.
        const [resultadoBloqueo] =
            await conexion.execute(
                'SELECT GET_LOCK(?, 0) AS adquirido',
                [referencia]
            );
        bloqueo =
            Number(resultadoBloqueo[0]?.adquirido) === 1;
        if (!bloqueo) {
            return respuestaOmitida(
                'Ya existe un envío en proceso.'
            );
        }
        // Consultar nuevamente la información después
        // de adquirir el bloqueo.
        const empleado = await obtenerEmpleado(
            empleadoId,
            conexion
        );
        const configuracion =
            await obtenerConfiguracionGlobal(
                conexion
            );
        if (
            !manual &&
            Number(configuracion.felicitaciones_activas) !== 1
        ) {
            return respuestaOmitida(
                'Las felicitaciones automáticas están desactivadas.'
            );
        }
        if (!empleado.felicitacion_activa) {
            return respuestaOmitida(
                'Las felicitaciones están desactivadas para este colaborador.'
            );
        }
        if (!empleado.es_hoy) {
            return respuestaOmitida(
                'El colaborador no cumple años hoy.'
            );
        }
        if (
            referencia !== generarReferencia(empleadoId)
        ) {
            return respuestaOmitida(
                'La fecha del envío ha cambiado.'
            );
        }
        if (!validarCorreo(empleado.email)) {
            throw errorValidacion(
                'El colaborador no tiene un correo electrónico válido.'
            );
        }
        const horaProgramada = String(
            empleado.hora_envio ||
            CONFIG.horaPredeterminada
        ).slice(0, 5);
        if (
            !manual &&
            horaColombia() < horaProgramada
        ) {
            return respuestaOmitida(
                'Todavía no es la hora programada para el envío.'
            );
        }
        const existente =
            await obtenerNotificacionExistente(
                conexion,
                referencia
            );
        if (existente?.estado === 'ENVIADO') {
            return respuesta(
                'La felicitación ya fue enviada durante este año.',
                {
                    duplicado: true,
                    enviado: false,
                    notificacionId: existente.id
                }
            );
        }
        if (existente?.estado === 'PENDIENTE') {
            return respuestaOmitida(
                'Existe un envío pendiente de revisión.'
            );
        }
        if (existente?.estado === 'CANCELADO') {
            return respuestaOmitida(
                'El envío fue cancelado anteriormente.'
            );
        }
        if (
            existente?.estado === 'ERROR' &&
            !manual
        ) {
            return respuestaOmitida(
                'El envío presenta un error que requiere revisión.'
            );
        }
        const contenido = generarMensaje(
            empleado
        );
        // Registrar el intento antes de generar
        // la tarjeta o establecer la conexión SMTP.
        notificacionId = await registrarIntentoEnvio(
            conexion,
            empleado,
            contenido,
            referencia,
            existente
        );
        const [
            html,
            tarjetaPersonalizada
        ] = await Promise.all([
            generarHTML(
                empleado,
                contenido.mensaje
            ),
            generarTarjetaCumpleanos(
                empleado.nombre
            )
        ]);
        const smtp = obtenerTransportador();
        // Segunda comprobación preventiva.
        if (!enviosHabilitados()) {
            throw new Error(
                'Los envíos fueron deshabilitados antes de iniciar SMTP.'
            );
        }
        const empleadoActual = await obtenerEmpleado(
            empleadoId,
            conexion
        );
        if (
            !empleadoActual.es_hoy ||
            !empleadoActual.felicitacion_activa ||
            empleadoActual.email !== empleado.email
        ) {
            throw new Error(
                'La configuración del colaborador cambió antes del envío.'
            );
        }
        if (
            !manual &&
            !empleadoActual.felicitaciones_globales_activas
        ) {
            throw new Error(
                'Las felicitaciones automáticas fueron desactivadas.'
            );
        }
        smtpIniciado = true;
        const resultado = await smtp.sendMail({
            from: {
                name: CONFIG.empresa,
                address: process.env.EMAIL_USER
            },
            to: {
                address: empleado.email.trim()
            },
            subject: contenido.asunto,
            text: contenido.mensaje,
            html,
            disableFileAccess: true,
            disableUrlAccess: true,
            attachments: [
                {
                    filename: 'feliz-cumpleanos.png',
                    content: tarjetaPersonalizada,
                    contentType: 'image/png',
                    contentDisposition: 'inline',
                    cid: CONFIG.tarjeta.cid
                }
            ]
        });
        if (
            !Array.isArray(resultado.accepted) ||
            resultado.accepted.length === 0
        ) {
            throw new Error(
                'El servidor SMTP no aceptó el destinatario.'
            );
        }
        await registrarEnvioExitoso(
            conexion,
            notificacionId
        );
        return respuesta(
            'Felicitación aceptada por el servidor de correo.',
            {
                enviado: true,
                duplicado: false,
                empleadoId,
                notificacionId,
                messageId: resultado.messageId
            }
        );
    } catch (error) {
        if (notificacionId) {
            try {
                await registrarErrorEnvio(
                    conexion,
                    notificacionId,
                    error,
                    smtpIniciado
                );
            } catch (errorRegistro) {
                console.error(
                    '[Transformín] Error registrando notificación:',
                    errorRegistro.code || 'ERROR_REGISTRO'
                );
            }
        }
        throw error;
    } finally {
        if (bloqueo && conexion) {
            try {
                const [liberacion] =
                    await conexion.execute(
                        'SELECT RELEASE_LOCK(?) AS liberado',
                        [referencia]
                    );
                if (
                    Number(liberacion[0]?.liberado) !== 1
                ) {
                    conexion.destroy();
                    conexion = null;
                }
            } catch {
                conexion.destroy();
                conexion = null;
            }
        }
        if (conexion) {
            conexion.release();
        }
    }
}
// ============================================================
// 34. PROCESAR FELICITACIONES AUTOMÁTICAS
// ============================================================
async function procesarFelicitacionesAutomaticas() {
    if (procesoActivo) {
        return respuestaOmitida(
            'Ya existe un proceso automático en ejecución.'
        );
    }
    if (!enviosHabilitados()) {
        return respuestaOmitida(
            'Los envíos automáticos están deshabilitados.'
        );
    }
    procesoActivo = true;
    const resumen = {
        success: true,
        fecha: fechaColombia(),
        revisados: 0,
        enviados: 0,
        omitidos: 0,
        duplicados: 0,
        errores: 0
    };
    try {
        const configuracion =
            await obtenerConfiguracionGlobal();
        if (
            Number(configuracion.felicitaciones_activas) !== 1
        ) {
            return {
                ...resumen,
                omitido: true,
                mensaje:
                    'Las felicitaciones automáticas están desactivadas.'
            };
        }
        const empleados =
            await obtenerCumpleanosHoy();
        for (const empleado of empleados) {
            resumen.revisados++;
            if (
                !enviosHabilitados() ||
                fechaColombia() !== resumen.fecha
            ) {
                break;
            }
            const horaProgramada = String(
                empleado.hora_envio ||
                CONFIG.horaPredeterminada
            ).slice(0, 5);
            if (
                !empleado.felicitacion_activa ||
                !empleado.correo_disponible ||
                horaColombia() < horaProgramada
            ) {
                resumen.omitidos++;
                continue;
            }
            try {
                const resultado =
                    await enviarFelicitacion(
                        empleado.empleado_id
                    );
                if (resultado.duplicado) {
                    resumen.duplicados++;
                } else if (
                    resultado.success &&
                    resultado.enviado
                ) {
                    resumen.enviados++;
                } else {
                    resumen.omitidos++;
                }
            } catch (error) {
                resumen.errores++;
                console.error(
                    '[Transformín] Error procesando felicitación:',
                    empleado.empleado_id,
                    error.code || 'ERROR_ENVIO'
                );
            }
        }
        resumen.success = resumen.errores === 0;
        if (
            resumen.enviados > 0 ||
            resumen.errores > 0
        ) {
            console.log(
                '[Transformín] Resumen de felicitaciones:',
                resumen
            );
        }
        return resumen;
    } finally {
        procesoActivo = false;
    }
}
// ============================================================
// 35. CONSULTAR HISTORIAL DE FELICITACIONES
// ============================================================
async function obtenerHistorialFelicitaciones() {
    const [registros] = await db.execute(`

        SELECT

            id,

            tipo,

            destinatario,

            asunto,

            estado,

            DATE_FORMAT(

                fecha_programada,

                '%Y-%m-%d %H:%i:%s'

            ) AS fecha_programada,

            DATE_FORMAT(

                fecha_envio,

                '%Y-%m-%d %H:%i:%s'

            ) AS fecha_envio,

            intentos,

            error_detalle,

            referencia_externa,

            created_at,

            updated_at

        FROM transformin_notificaciones

        WHERE tipo = 'CUMPLEANOS'

        ORDER BY

            created_at DESC,

            id DESC

        LIMIT 200

    `);
    return registros.map(registro => ({
        ...registro,
        intentos: numero(registro.intentos),
        fecha:
            registro.fecha_envio ||
            registro.fecha_programada ||
            registro.created_at,
        origen: 'CUMPLEANOS'
    }));
}
// ============================================================
// 36. INDICADORES DE CUMPLEAÑOS
// ============================================================
async function obtenerIndicadores() {
    const hoy = fechaColombia();
    const anioActual = hoy.slice(0, 4);
    const mesActual = Number(
        hoy.slice(5, 7)
    );
    const [
        empleados,
        resultadoNotificaciones
    ] = await Promise.all([
        obtenerCumpleanos(),
        db.execute(`

            SELECT

                COUNT(

                    DISTINCT CASE

                        WHEN estado = 'ENVIADO'

                        THEN referencia_externa

                    END

                ) AS enviados,

                COALESCE(

                    SUM(estado = 'PENDIENTE'),

                    0

                ) AS pendientes,

                COALESCE(

                    SUM(estado = 'ERROR'),

                    0

                ) AS errores,

                COALESCE(

                    SUM(estado = 'CANCELADO'),

                    0

                ) AS cancelados

            FROM transformin_notificaciones

            WHERE tipo = 'CUMPLEANOS'

            AND referencia_externa LIKE ?

        `, [
            `CUMPLEANOS-%-${anioActual}`
        ])
    ]);
    const registros = resultadoNotificaciones[0];
    const notificaciones = registros[0] || {};
    return {
        totalCumpleanos:
            empleados.length,
        totalColaboradores:
            empleados.length,
        cumpleanosHoy:
            empleados.filter(
                empleado => empleado.es_hoy
            ).length,
        cumpleanosMes:
            empleados.filter(
                empleado => empleado.mes === mesActual
            ).length,
        proximosCumpleanos:
            empleados.filter(
                empleado =>
                    empleado.dias_restantes >= 0 &&
                    empleado.dias_restantes <=
                        CONFIG.diasProximosCumpleanos
            ).length,
        alertasActivas:
            empleados.filter(
                empleado => empleado.alerta_disponible
            ).length,
        alertasConfiguradas:
            empleados.filter(
                empleado => empleado.alerta_activa
            ).length,
        felicitacionesActivas:
            empleados.filter(
                empleado => empleado.felicitacion_activa
            ).length,
        felicitacionesEnviadas:
            numero(notificaciones.enviados),
        felicitacionesPendientes:
            numero(notificaciones.pendientes),
        felicitacionesConError:
            numero(notificaciones.errores),
        felicitacionesCanceladas:
            numero(notificaciones.cancelados),
        colaboradoresSinCorreo:
            empleados.filter(
                empleado => !empleado.correo_disponible
            ).length,
        enviosHabilitados:
            enviosHabilitados(),
        integrado: true,
        fecha: hoy,
        anio: Number(anioActual)
    };
}
// ============================================================
// 37. CONSULTAR ALERTAS ACTIVAS
// ============================================================
async function obtenerAlertasCumpleanos() {
    const empleados = await obtenerCumpleanos();
    return empleados
        .filter(
            empleado => empleado.alerta_disponible
        )
        .map(empleado => ({
            id:
                `CUMPLEANOS-${empleado.empleado_id}`,
            empleado_id:
                empleado.empleado_id,
            nombre:
                empleado.nombre,
            titulo:
                empleado.es_hoy
                    ? `Hoy cumple años ${empleado.nombre}`
                    : `Próximo cumpleaños: ${empleado.nombre}`,
            fecha:
                empleado.fecha,
            dias_restantes:
                empleado.dias_restantes,
            tipo: 'CUMPLEANOS',
            origen: 'CUMPLEANOS',
            prioridad:
                empleado.es_hoy
                    ? 'ALTA'
                    : 'MEDIA',
            mensaje:
                empleado.es_hoy
                    ? 'El colaborador cumple años hoy.'
                    : `Faltan ${empleado.dias_restantes} días para su cumpleaños.`
        }));
}
// ============================================================
// 38. PREVISUALIZAR FELICITACIÓN
// ============================================================
async function previsualizarFelicitacion(
    empleadoId
) {
    const empleado = await obtenerEmpleado(
        empleadoId
    );
    const contenido = generarMensaje(
        empleado
    );
    const [
        html,
        tarjeta
    ] = await Promise.all([
        generarHTML(
            empleado,
            contenido.mensaje
        ),
        generarTarjetaCumpleanos(
            empleado.nombre
        )
    ]);
    return {
        success: true,
        empleado,
        asunto: contenido.asunto,
        mensaje: contenido.mensaje,
        html,
        tarjeta,
        contentType: 'image/png',
        envioReal: false
    };
}
// ============================================================
// 39. INICIAR PROGRAMADOR AUTOMÁTICO
// ============================================================
function iniciarProgramador() {
    if (tareaProgramada) {
        return tareaProgramada;
    }
    if (!cron.validate(CONFIG.frecuenciaRevision)) {
        throw new Error(
            'La frecuencia del programador no es válida.'
        );
    }
    tareaProgramada = cron.schedule(
        CONFIG.frecuenciaRevision,
        async () => {
            try {
                await procesarFelicitacionesAutomaticas();
            } catch (error) {
                console.error(
                    '[Transformín] Error del programador:',
                    error.code || 'ERROR_PROGRAMADOR'
                );
            }
        },
        {
            timezone: CONFIG.zonaHoraria,
            noOverlap: true,
            name: 'transformin-cumpleanos'
        }
    );
    console.log(
        '[Transformín] Programador de cumpleaños iniciado.'
    );
    if (!enviosHabilitados()) {
        console.log(
            '[Transformín] Envíos reales deshabilitados.'
        );
    }
    return tareaProgramada;
}
// ============================================================
// 40. DETENER PROGRAMADOR AUTOMÁTICO
// ============================================================
async function detenerProgramador() {
    if (!tareaProgramada) {
        return false;
    }
    const tarea = tareaProgramada;
    tareaProgramada = null;
    await tarea.destroy();
    console.log(
        '[Transformín] Programador de cumpleaños detenido.'
    );
    return true;
}
// ============================================================
// 41. VERIFICAR CONEXIÓN SMTP
// ============================================================
async function verificarSMTP() {
    const smtp = obtenerTransportador();
    await smtp.verify();
    return respuesta(
        'Conexión SMTP verificada correctamente.',
        {
            conectado: true,
            host: CONFIG.smtp.host,
            puerto: CONFIG.smtp.port,
            seguro: CONFIG.smtp.secure,
            enviosHabilitados:
                enviosHabilitados(),
            envioReal: false
        }
    );
}
// ============================================================
// 42. ESTADO GENERAL DEL SERVICIO
// ============================================================
async function obtenerEstadoServicio() {
    const configuracion =
        await obtenerConfiguracionGlobal();
    let tarjetaDisponible = false;
    let plantillaDisponible = false;
    try {
        await validarTarjetaOriginal();
        tarjetaDisponible = true;
    } catch {
        tarjetaDisponible = false;
    }
    try {
        await fs.promises.access(
            CONFIG.plantilla,
            fs.constants.R_OK
        );
        plantillaDisponible = true;
    } catch {
        plantillaDisponible = false;
    }
    return {
        success: true,
        servicio: 'Transformín - Cumpleaños',
        empresa: CONFIG.empresa,
        zonaHoraria: CONFIG.zonaHoraria,
        fecha: fechaColombia(),
        hora: horaColombia(),
        programadorActivo:
            tareaProgramada !== null,
        procesoActivo,
        enviosHabilitados:
            enviosHabilitados(),
        felicitacionesAutomaticas:
            Number(configuracion.felicitaciones_activas) === 1,
        recordatoriosActivos:
            Number(configuracion.recordatorios_activos) === 1,
        smtpConfigurado:
            Boolean(
                process.env.EMAIL_USER &&
                process.env.EMAIL_PASS
            ),
        tarjetaDisponible,
        plantillaDisponible
    };
}
// ============================================================
// 43. EXPORTACIÓN DEL SERVICIO
// ============================================================
module.exports = {
    CONFIG,
    // Configuración.
    obtenerConfiguracionGlobal,
    actualizarConfiguracionEmpleado,
    normalizarConfiguracion,
    // Recursos Humanos.
    obtenerCumpleanos,
    obtenerCumpleanosHoy,
    obtenerCumpleanosMes,
    obtenerCumpleanosCalendario,
    obtenerProximosCumpleanos,
    obtenerEmpleado,
    obtenerAlertasCumpleanos,
    // Tarjetas y felicitaciones.
    generarTarjetaCumpleanos,
    generarTarjetaEmpleado,
    generarMensaje,
    generarHTML,
    previsualizarFelicitacion,
    enviarFelicitacion,
    procesarFelicitacionesAutomaticas,
    // Historial e indicadores.
    obtenerHistorialFelicitaciones,
    obtenerIndicadores,
    obtenerEstadoServicio,
    // Programador.
    iniciarProgramador,
    detenerProgramador,
    // SMTP.
    verificarSMTP,
    enviosHabilitados,
    // Fecha y hora.
    fechaColombia,
    horaColombia,
    fechaHoraColombia,
    obtenerAnioActual,
    obtenerMesActual,
    construirFechaCumpleanos,
    calcularProximoCumpleanos,
    calcularDiasRestantes
};
// ============================================================
// FIN DEL SERVICIO CORPORATIVO DE CUMPLEAÑOS
// PROCESADOS MARGARITA S.A.S.
// TRANSFORMÍN
// ============================================================