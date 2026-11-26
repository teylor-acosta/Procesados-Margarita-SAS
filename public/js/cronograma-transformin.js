/* ============================================================
   CRONOGRAMA DE TRANSFORMÍN
   PROCESADOS MARGARITA S.A.S.
   Archivo: cronograma-transformin.js
   Formato institucional: FT-SST-147
   Versión: 2.0.1
   Actualización: 25/11/2026
   PARTE 01 - CONFIGURACIÓN GENERAL
============================================================ */
(() => {
    'use strict';
    // ========================================================
    // 01. CONFIGURACIÓN GENERAL
    // ========================================================
    const CONFIG = Object.freeze({
        API: '/cronograma-transformin/api',
        EMPRESA: 'Procesados Margarita S.A.S.',
        MASCOTA: 'Transformín',
        CODIGO_FORMATO: 'FT-SST-147',
        VERSION_FORMATO: '001',
        ZONA_HORARIA: 'America/Bogota',
        LOCALE: 'es-CO',
        ANIO_MINIMO: 1900,
        ANIO_MAXIMO: 9999,
        MAX_ARCHIVO: 5 * 1024 * 1024,
        MAX_FILAS_EXCEL: 36,
        REGISTROS_POR_PAGINA: 8,
        REGISTROS_HISTORIAL: 10,
        REGISTROS_CUMPLEANOS: 12,
        TIEMPO_PETICION: 30000,
        TIEMPO_ARCHIVOS: 120000,
        DURACION_TOAST: 5500
    });
    const API = CONFIG.API;
    const ZONA_HORARIA = CONFIG.ZONA_HORARIA;
    const MAX_ARCHIVO = CONFIG.MAX_ARCHIVO;
    // ========================================================
    // 02. RUTAS DEL BACKEND
    // ========================================================
    const RUTAS = Object.freeze({
        // Estado general del módulo
        estado: '/estado',
        diagnostico: '/diagnostico',
        // Actividades manuales
        actividades: '/actividades',
        proximas: '/proximas',
        actividad: id =>
            `/actividades/${encodeURIComponent(id)}`,
        estadoActividad: id =>
            `/actividades/${encodeURIComponent(id)}/estado`,
        completar: id =>
            `/actividades/${encodeURIComponent(id)}/completar`,
        reabrir: id =>
            `/actividades/${encodeURIComponent(id)}/reabrir`,
        cancelar: id =>
            `/actividades/${encodeURIComponent(id)}/cancelar`,
        reprogramar: id =>
            `/actividades/${encodeURIComponent(id)}/reprogramar`,
        historialActividad: id =>
            `/actividades/${encodeURIComponent(id)}/historial`,
        // Cronograma institucional FT-SST-147
        institucional: '/institucional',
        asignarFechasInstitucionales: '/institucional/fechas/asignar',
        formatoInstitucional: '/ft-sst-147',
        actividadInstitucional: id =>
            `/institucional/${encodeURIComponent(id)}`,
        semanasInstitucionales: id =>
            `/institucional/${encodeURIComponent(id)}/semanas`,
        semanaInstitucional: (id, semanaId) =>
            `/institucional/${encodeURIComponent(id)}` +
            `/semanas/${encodeURIComponent(semanaId)}`,
        completarSemana: (id, semanaId) =>
            `/institucional/${encodeURIComponent(id)}` +
            `/semanas/${encodeURIComponent(semanaId)}/completar`,
        programacionInstitucional: id =>
            `/institucional/${encodeURIComponent(id)}/programacion`,
        resumenInstitucional:
            '/institucional/resumen/anual',
        calendarioInstitucional:
            '/institucional/calendario/eventos',
        historialInstitucional: id =>
            `/institucional/${encodeURIComponent(id)}/historial`,
        // Indicadores generales e institucionales
        indicadores: '/indicadores',
        indicadoresManuales: '/indicadores/manuales',
        cumplimiento: '/indicadores/anuales',
        indicadoresAnuales: '/indicadores/anuales',
        indicadoresMensuales: '/indicadores/mensuales',
        indicadoresCorte: '/indicadores/corte',
        indicadoresNotificaciones:
            '/indicadores/notificaciones',
        // Recursos Humanos y cumpleaños
        cumpleanos: '/cumpleanos',
        cumpleanosHoy: '/cumpleanos/hoy',
        cumpleanosMes: '/cumpleanos/mes',
        cumpleanosProximos: '/cumpleanos/proximos',
        alertasCumpleanos: '/cumpleanos/alertas',
        indicadoresCumpleanos:
            '/cumpleanos/indicadores',
        calendarioCumpleanos:
            '/cumpleanos/calendario/eventos',
        servicioCumpleanos:
            '/cumpleanos/servicio/estado',
        historialFelicitaciones:
            '/cumpleanos/historial',
        empleadoCumpleanos: id =>
            `/cumpleanos/${encodeURIComponent(id)}`,
        // Configuración individual de cumpleaños
        configurarCumpleanos: id =>
            `/cumpleanos/${encodeURIComponent(id)}/configuracion`,
        configurarAlerta: id =>
            `/cumpleanos/${encodeURIComponent(id)}/alerta`,
        configurarFelicitacion: id =>
            `/cumpleanos/${encodeURIComponent(id)}/felicitacion`,
        // Tarjetas personalizadas de Transformín
        tarjetaCumpleanos: id =>
            `/cumpleanos/${encodeURIComponent(id)}/tarjeta`,
        descargarTarjeta: id =>
            `/cumpleanos/${encodeURIComponent(id)}/tarjeta/descargar`,
        // Felicitaciones y notificaciones
        previewFelicitacion: id =>
            `/cumpleanos/${encodeURIComponent(id)}/felicitacion/preview`,
        enviarFelicitacion: id =>
            `/cumpleanos/${encodeURIComponent(id)}/felicitacion/enviar`,
        historialCumpleanos: id =>
            `/cumpleanos/${encodeURIComponent(id)}/historial`,
        // Configuración general
        configuracion: '/configuracion',
        restablecerConfiguracion:
            '/configuracion/restablecer',
        verificarSMTP: '/smtp/verificar',
        estadoNotificaciones: '/notificaciones/estado',
        // Historial y auditoría
        historial: '/historial/notificaciones',
        historialActividades: '/historial/actividades',
        auditoria: '/auditoria',
        detalleAuditoria: id =>
            `/auditoria/${encodeURIComponent(id)}`,
        detalleNotificacion: id =>
            `/notificaciones/${encodeURIComponent(id)}`,
        // Importación y exportación Excel
        excelPreview: '/excel/preview',
        excelImportar: '/excel/importar',
        excelExportar: '/excel/exportar',
        excelHistorial: '/excel/historial'
    });
    // ========================================================
    // 03. CONSTANTES DEL CALENDARIO
    // ========================================================
    const MESES = Object.freeze([
        'Enero',
        'Febrero',
        'Marzo',
        'Abril',
        'Mayo',
        'Junio',
        'Julio',
        'Agosto',
        'Septiembre',
        'Octubre',
        'Noviembre',
        'Diciembre'
    ]);
    const MESES_CORTOS = Object.freeze([
        'Ene', 'Feb', 'Mar', 'Abr',
        'May', 'Jun', 'Jul', 'Ago',
        'Sep', 'Oct', 'Nov', 'Dic'
    ]);
    const DIAS_SEMANA = Object.freeze([
        'Lunes',
        'Martes',
        'Miércoles',
        'Jueves',
        'Viernes',
        'Sábado',
        'Domingo'
    ]);
    // Distribución semanal del formato institucional.
    // Se conserva la estructura original del FT-SST-147.
    const SEMANAS_POR_MES = Object.freeze({
        1: 5,
        2: 4,
        3: 5,
        4: 5,
        5: 4,
        6: 5,
        7: 5,
        8: 4,
        9: 5,
        10: 4,
        11: 5,
        12: 5
    });
    // ========================================================
    // 04. TIPOS DE ACTIVIDADES
    // ========================================================
    const TIPOS = Object.freeze({
        AMBIENTAL: 'Ambiental',
        INSTITUCIONAL: 'Institucional',
        CELEBRACION: 'Celebración',
        CUMPLEANOS: 'Cumpleaños',
        OTRO: 'Otro'
    });
    const TIPOS_MANUALES = Object.freeze([
        'AMBIENTAL',
        'INSTITUCIONAL',
        'CELEBRACION',
        'OTRO'
    ]);
    const TIPOS_INSTITUCIONALES = Object.freeze([
        'AMBIENTAL',
        'INSTITUCIONAL',
        'CELEBRACION',
        'CUMPLEANOS',
        'OTRO'
    ]);
    const ICONOS_TIPO = Object.freeze({
        AMBIENTAL: 'fa-leaf',
        INSTITUCIONAL: 'fa-building',
        CELEBRACION: 'fa-calendar-star',
        CUMPLEANOS: 'fa-cake-candles',
        OTRO: 'fa-calendar-days'
    });
    // ========================================================
    // 05. ESTADOS DEL SISTEMA
    // ========================================================
    const ESTADOS = Object.freeze({
        PENDIENTE: 'Pendiente',
        EN_PROCESO: 'En proceso',
        COMPLETADA: 'Completada',
        CANCELADA: 'Cancelada',
        VENCIDA: 'Vencida',
        REPROGRAMADA: 'Reprogramada',
        ENVIADO: 'Enviado',
        ERROR: 'Error',
        CANCELADO: 'Cancelado',
        ACTIVO: 'Activo',
        BORRADOR: 'Borrador',
        CERRADO: 'Cerrado',
        INICIADA: 'Iniciada',
        FALLIDA: 'Fallida'
    });
    // Estados permitidos para actividades editables
    const ESTADOS_EDITABLES = Object.freeze([
        'PENDIENTE',
        'EN_PROCESO',
        'COMPLETADA',
        'CANCELADA'
    ]);
    // Estados de correos y notificaciones
    const ESTADOS_NOTIFICACION = Object.freeze([
        'PENDIENTE',
        'ENVIADO',
        'ERROR',
        'CANCELADO'
    ]);
    // Prioridades compatibles con el backend
    const PRIORIDADES = Object.freeze({
        BAJA: 'Baja',
        MEDIA: 'Media',
        ALTA: 'Alta'
    });
    // Origen de los registros
    const ORIGENES = Object.freeze({
        MANUAL: 'Actividad manual',
        FT147: 'FT-SST-147',
        CUMPLEANOS: 'Recursos Humanos'
    });
    // Acciones registradas en el historial
    const ACCIONES_HISTORIAL = Object.freeze({
        CREACION: 'Creación',
        EDICION: 'Edición',
        CAMBIO_ESTADO: 'Cambio de estado',
        COMPLETADA: 'Actividad completada',
        REPROGRAMACION: 'Reprogramación',
        CANCELACION: 'Cancelación',
        ELIMINACION: 'Eliminación',
        RESTAURACION: 'Restauración'
    });
    // Clasificación de notificaciones
    const TIPOS_NOTIFICACION = Object.freeze({
        ACTIVIDAD: 'Actividad',
        RECORDATORIO: 'Recordatorio',
        CUMPLEANOS: 'Cumpleaños',
        ADMINISTRATIVA: 'Administrativa'
    });
    // Convenciones del documento institucional.
    // La marca X no se considera una actividad realizada.
    const MARCAS_EXCEL = Object.freeze({
        P: 'Programada',
        R: 'Realizada',
        X: 'Sin clasificar'
    });
    // ========================================================
    // 06. REFERENCIAS AL DOCUMENTO
    // ========================================================
    const $ = id => document.getElementById(id);
    const $$ = (selector, contexto = document) =>
        Array.from(contexto.querySelectorAll(selector));
    // ========================================================
    // 07. ESTADO CENTRALIZADO DEL MÓDULO
    // ========================================================
    const fechaInicial = hoy();
    const estado = {
        // Periodo seleccionado
        anio: Number(fechaInicial.substring(0, 4)),
        fechaCalendario: new Date(`${fechaInicial}T12:00:00`),
        fechaSeleccionada: fechaInicial,
        // Actividades manuales
        actividades: [],
        filtradas: [],
        actividadSeleccionada: null,
        // Actividades institucionales FT-SST-147
        institucionales: [],
        institucionalesFiltradas: [],
        institucionalSeleccionada: null,
        cronogramaInstitucional: null,
        semanasSeleccionadas: [],
        semanaSeleccionada: null,
        eventosInstitucionales: [],
        eventosSinFecha: [],
        // Recursos Humanos y cumpleaños
        cumpleanos: [],
        cumpleanosFiltrados: [],
        cumpleanosHoy: [],
        alertasCumpleanos: [],
        eventosCumpleanos: [],
        cumpleanosSeleccionado: null,
        indicadoresCumpleanos: {},
        integradoRH: null,
        // Indicadores de cumplimiento
        indicadores: {},
        cumplimiento: null,
        indicadoresManuales: {},
        indicadoresInstitucionales: {},
        indicadoresNotificaciones: {},
        // Configuración de servicios
        configuracion: null,
        servicioCumpleanos: null,
        estadoSMTP: null,
        // Estado inicial seguro.
        // El valor real se consulta desde el servidor.
        enviosHabilitados: false,
        // Historiales y auditoría
        historial: [],
        historialFiltrado: [],
        historialActividades: [],
        historialActividadesFiltrado: [],
        historialImportaciones: [],
        notificacionSeleccionada: null,
        // Paginación de registros
        pagina: 1,
        porPagina: CONFIG.REGISTROS_POR_PAGINA,
        paginaInstitucional: 1,
        paginaCumpleanos: 1,
        paginaHistorial: 1,
        paginaAuditoria: 1,
        paginaImportaciones: 1,
        // Importación del documento Excel
        archivoExcel: null,
        importacion: null,
        importacionValida: false,
        importando: false,
        validandoExcel: false,
        versionImportacion: 0,
        // Exportación institucional
        exportando: false,
        resumenExportacion: null,
        // Tarjetas personalizadas
        tarjetaURL: null,
        tarjetaBlob: null,
        tarjetaEmpleadoId: null,
        tarjetaCargando: false,
        versionTarjeta: 0,
        // Estado general de la interfaz
        cargando: false,
        guardando: false,
        iniciado: false,
        inicializando: false,
        conectado: null,
        erroresCarga: [],
        versionCarga: 0,
        operacionesActivas: 0
    };
    // ========================================================
    // CONTROL DE PETICIONES Y OPERACIONES CONCURRENTES
    // ========================================================
    // Permite cancelar consultas anteriores y evitar
    // respuestas desactualizadas en la interfaz.
    const peticionesActivas = new Map();
    // Evita ejecutar simultáneamente una misma operación.
    const operacionesBloqueadas = new Set();
    // ========================================================
    // 08. FUNCIONES DE FECHA Y HORA DE COLOMBIA
    // ========================================================
    function hoy() {
        const partes = new Intl.DateTimeFormat('en-CA', {
            timeZone: ZONA_HORARIA,
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        }).formatToParts(new Date());
        const obtener = tipo =>
            partes.find(parte => parte.type === tipo)?.value;
        return [
            obtener('year'),
            obtener('month'),
            obtener('day')
        ].join('-');
    }
    function anioActual() {
        return Number(hoy().substring(0, 4));
    }
    function mesActual() {
        return Number(hoy().substring(5, 7));
    }
    function horaColombia() {
        return new Intl.DateTimeFormat(CONFIG.LOCALE, {
            timeZone: ZONA_HORARIA,
            hour: '2-digit',
            minute: '2-digit',
            hourCycle: 'h23'
        }).format(new Date());
    }
    // Construye una fecha sin conversiones de zona horaria.
    function fechaLocal(anio, mes, dia) {
        return [
            String(anio).padStart(4, '0'),
            String(mes).padStart(2, '0'),
            String(dia).padStart(2, '0')
        ].join('-');
    }
    // Normaliza fechas recibidas desde el backend.
    function fechaISO(valor) {
        if (!valor) return '';
        if (valor instanceof Date) {
            if (Number.isNaN(valor.getTime())) return '';
            const partes = new Intl.DateTimeFormat('en-CA', {
                timeZone: ZONA_HORARIA,
                year: 'numeric',
                month: '2-digit',
                day: '2-digit'
            }).formatToParts(valor);
            const obtener = tipo =>
                partes.find(p => p.type === tipo)?.value;
            return [
                obtener('year'),
                obtener('month'),
                obtener('day')
            ].join('-');
        }
        const coincidencia = String(valor)
            .match(/^\d{4}-\d{2}-\d{2}/);
        if (!coincidencia) return '';
        return fechaValida(coincidencia[0])
            ? coincidencia[0]
            : '';
    }
    // Valida fechas reales, incluyendo años bisiestos.
    function fechaValida(valor) {
        if (
            typeof valor !== 'string' ||
            !/^\d{4}-\d{2}-\d{2}$/.test(valor)
        ) {
            return false;
        }
        const [anio, mes, dia] = valor.split('-').map(Number);
        if (
            anio < 1000 ||
            anio > 9999 ||
            mes < 1 ||
            mes > 12 ||
            dia < 1 ||
            dia > 31
        ) {
            return false;
        }
        const fecha = new Date(Date.UTC(anio, mes - 1, dia));
        return (
            fecha.getUTCFullYear() === anio &&
            fecha.getUTCMonth() === mes - 1 &&
            fecha.getUTCDate() === dia
        );
    }
    // Formato de presentación DD/MM/AAAA.
    function fechaBonita(valor, alternativa = 'Sin fecha exacta') {
        const fecha = fechaISO(valor);
        if (!fecha) return alternativa;
        const [anio, mes, dia] = fecha.split('-');
        return `${dia}/${mes}/${anio}`;
    }
    // Formato de fecha extendido en español.
    function fechaLarga(valor) {
        const fecha = fechaISO(valor);
        if (!fecha) return 'Fecha no disponible';
        const [anio, mes, dia] = fecha.split('-').map(Number);
        return new Intl.DateTimeFormat(CONFIG.LOCALE, {
            timeZone: 'UTC',
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        }).format(
            new Date(Date.UTC(anio, mes - 1, dia, 12))
        );
    }
    // Presentación de fechas y horas de MySQL.
    function fechaHoraBonita(valor) {
        if (!valor) return 'No disponible';
        const cadena = String(valor).trim();
        // DATETIME sin zona horaria.
        // Conserva la hora local entregada por el servidor.
        const local = cadena.match(
            /^(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2})(?::\d{2})?$/
        );
        if (
            local &&
            fechaValida(local[1]) &&
            normalizarHora(local[2])
        ) {
            return `${fechaBonita(local[1])} · ${local[2]}`;
        }
        const fecha = new Date(valor);
        if (Number.isNaN(fecha.getTime())) {
            return fechaBonita(valor, 'No disponible');
        }
        return new Intl.DateTimeFormat(CONFIG.LOCALE, {
            timeZone: ZONA_HORARIA,
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).format(fecha);
    }
    // Normaliza horas en formato HH:MM.
    function normalizarHora(valor, alternativa = '') {
        const hora = String(valor ?? '').trim();
        if (
            !/^([01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/.test(hora)
        ) {
            return alternativa;
        }
        return hora.substring(0, 5);
    }
    // Calcula la diferencia entre dos fechas.
    function diferenciaDias(inicio, fin) {
        const primera = fechaISO(inicio);
        const segunda = fechaISO(fin);
        if (!primera || !segunda) return null;
        const fecha1 = Date.parse(`${primera}T00:00:00Z`);
        const fecha2 = Date.parse(`${segunda}T00:00:00Z`);
        return Math.round((fecha2 - fecha1) / 86400000);
    }
    // Suma o resta días sin modificar la fecha original.
    function sumarDias(fecha, cantidad) {
        const valor = fechaISO(fecha);
        if (!valor) return '';
        const resultado = new Date(`${valor}T12:00:00Z`);
        resultado.setUTCDate(
            resultado.getUTCDate() + numero(cantidad)
        );
        if (Number.isNaN(resultado.getTime())) return '';
        const salida = resultado.toISOString().substring(0, 10);
        return fechaValida(salida) ? salida : '';
    }
    // Compatibilidad con años anteriores y posteriores.
    function validarAnio(valor) {
        const anio = Number(valor);
        if (
            !Number.isInteger(anio) ||
            anio < CONFIG.ANIO_MINIMO ||
            anio > CONFIG.ANIO_MAXIMO
        ) {
            throw new Error(
                `Selecciona un año entre ${CONFIG.ANIO_MINIMO} ` +
                `y ${CONFIG.ANIO_MAXIMO}.`
            );
        }
        return anio;
    }
    // ========================================================
    // 09. NORMALIZACIÓN Y SEGURIDAD DE DATOS
    // ========================================================
    // Escapa contenido antes de insertarlo en plantillas HTML.
    function escapar(valor) {
        return String(valor ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }
    // Normaliza textos para búsquedas y comparaciones.
    function normalizar(valor) {
        return String(valor ?? '')
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase()
            .trim();
    }
    // Genera nombres de clases CSS seguros.
    function clase(valor) {
        return normalizar(valor)
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');
    }
    // Convierte valores a mayúsculas.
    function mayusculas(valor, alternativa = '') {
        return String(valor ?? alternativa)
            .trim()
            .toUpperCase();
    }
    // Convierte valores numéricos evitando NaN e Infinity.
    function numero(valor, alternativa = 0) {
        if (
            valor === null ||
            valor === undefined ||
            valor === ''
        ) {
            return alternativa;
        }
        const resultado = Number(valor);
        return Number.isFinite(resultado)
            ? resultado
            : alternativa;
    }
    // Normaliza números enteros.
    function entero(valor, alternativa = 0) {
        const resultado = Number(valor);
        return Number.isInteger(resultado)
            ? resultado
            : alternativa;
    }
    // Compatibilidad con booleanos de JavaScript y MySQL.
    function booleano(valor) {
        if (valor === true || valor === 1) return true;
        if (typeof valor === 'string') {
            return [
                '1',
                'true',
                'si',
                'sí'
            ].includes(valor.trim().toLowerCase());
        }
        return false;
    }
    // Limita la longitud de los campos de texto.
    function textoLimpio(valor, maximo = 5000) {
        return String(valor ?? '')
            .trim()
            .substring(0, maximo);
    }
    // Convierte campos vacíos a null.
    function valorNullable(valor) {
        const resultado = String(valor ?? '').trim();
        return resultado || null;
    }
    // Garantiza que el resultado sea un arreglo.
    function lista(valor) {
        return Array.isArray(valor) ? valor : [];
    }
    // Garantiza que el resultado sea un objeto.
    function objeto(valor) {
        return (
            valor &&
            typeof valor === 'object' &&
            !Array.isArray(valor)
        ) ? valor : {};
    }
    // Obtiene un campo utilizando nombres alternativos.
    function obtenerCampo(datos, ...campos) {
        if (!datos) return undefined;
        for (const campo of campos) {
            if (
                Object.prototype.hasOwnProperty.call(datos, campo) &&
                datos[campo] !== undefined
            ) {
                return datos[campo];
            }
        }
        return undefined;
    }
    // Extrae arreglos de diferentes estructuras de respuesta.
    function extraerLista(datos, ...campos) {
        if (Array.isArray(datos)) return datos;
        for (const campo of campos) {
            if (Array.isArray(datos?.[campo])) {
                return datos[campo];
            }
        }
        return [];
    }
    // ========================================================
    // VALIDACIÓN SEGURA DE IDENTIFICADORES
    //
    // Los identificadores se conservan como cadenas para evitar
    // pérdidas de precisión con BIGINT de MySQL.
    //
    // No se aceptan valores undefined, null, vacíos, negativos,
    // decimales ni referencias compuestas como ID de registro.
    // ========================================================
    function validarId(valor) {
        const id = String(valor ?? '').trim();
        if (!/^[1-9]\d*$/.test(id)) {
            throw new Error(
                'El identificador del registro no es válido.'
            );
        }
        return id;
    }
    // Comprueba un identificador sin generar excepciones.
    function esIdValido(valor) {
        try {
            validarId(valor);
            return true;
        } catch {
            return false;
        }
    }
    // Selecciona el primer identificador válido.
    // Permite comprobar campos alternativos de una respuesta.
    function primerIdValido(...valores) {
        for (const valor of valores) {
            if (esIdValido(valor)) {
                return validarId(valor);
            }
        }
        return null;
    }
    // Validación básica de direcciones de correo.
    function correoValido(valor) {
        const correo = String(valor ?? '').trim();
        return (
            correo.length <= 254 &&
            /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)
        );
    }
    // Genera las iniciales de los colaboradores.
    function iniciales(nombre) {
        const palabras = String(nombre ?? '')
            .trim()
            .split(/\s+/)
            .filter(Boolean);
        return palabras
            .slice(0, 2)
            .map(palabra => palabra.charAt(0).toUpperCase())
            .join('') || 'RH';
    }
    // Compatibilidad con prioridades anteriores.
    function normalizarPrioridad(valor) {
        const prioridad = mayusculas(valor, 'MEDIA');
        if (prioridad === 'NORMAL') return 'MEDIA';
        if (prioridad === 'URGENTE') return 'ALTA';
        return Object.prototype.hasOwnProperty.call(
            PRIORIDADES,
            prioridad
        ) ? prioridad : 'MEDIA';
    }
    // Identifica el origen real de una actividad.
    function normalizarOrigen(valor) {
        const origen = mayusculas(valor, 'MANUAL');
        if (
            origen === 'FT-SST-147' ||
            origen === 'FT_SST_147' ||
            origen === 'FT147'
        ) {
            return 'FT147';
        }
        if (
            origen === 'CUMPLEANOS' ||
            origen === 'CUMPLEAÑOS' ||
            origen === 'RH'
        ) {
            return 'CUMPLEANOS';
        }
        if (origen === 'MANUAL') {
            return 'MANUAL';
        }
        return 'DESCONOCIDO';
    }
    // ========================================================
    // 10. MANIPULACIÓN SEGURA DE LA INTERFAZ
    // ========================================================
    // Actualiza contenido de texto sin interpretar HTML.
    function texto(id, valor) {
        const nodo = $(id);
        if (nodo) {
            nodo.textContent = String(valor ?? '');
        }
    }
    // Actualiza varios elementos simultáneamente.
    function textos(ids, valor) {
        lista(ids).forEach(id => texto(id, valor));
    }
    // Inserta plantillas HTML generadas por el módulo.
    // Los valores dinámicos deben pasar por escapar().
    function html(id, contenido) {
        const nodo = $(id);
        if (nodo) {
            nodo.innerHTML = contenido;
        }
    }
    // Obtiene el valor de un campo.
    function campo(id) {
        return String($(id)?.value ?? '').trim();
    }
    // Actualiza el valor de un campo.
    function setCampo(id, valor) {
        const nodo = $(id);
        if (nodo) {
            nodo.value = valor ?? '';
        }
    }
    // Consulta el estado de un checkbox.
    function marcado(id) {
        return Boolean($(id)?.checked);
    }
    // Actualiza el estado de un checkbox.
    function setMarcado(id, valor) {
        const nodo = $(id);
        if (nodo) {
            nodo.checked = booleano(valor);
        }
    }
    // Controla la visibilidad de los componentes.
    // Compatible con las reglas finales del CSS.
    function visible(id, mostrar) {
        const nodo = $(id);
        if (!nodo) return;
        nodo.hidden = !mostrar;
        if (mostrar) {
            nodo.classList.remove('d-none');
        }
        nodo.setAttribute('aria-hidden', String(!mostrar));
    }
    // Deshabilita controles durante las operaciones.
    function deshabilitar(id, valor = true) {
        const nodo = $(id);
        if (nodo) {
            nodo.disabled = Boolean(valor);
        }
    }
    // Habilita controles de la interfaz.
    function habilitar(id, valor = true) {
        deshabilitar(id, !valor);
    }
    // Actualiza o elimina atributos HTML.
    function atributo(id, nombre, valor) {
        const nodo = $(id);
        if (!nodo) return;
        if (valor === null || valor === undefined) {
            nodo.removeAttribute(nombre);
            return;
        }
        nodo.setAttribute(nombre, String(valor));
    }
    // Limpia el contenido de un elemento.
    function limpiarContenido(id) {
        const nodo = $(id);
        if (nodo) {
            nodo.replaceChildren();
        }
    }
    // Restablece los campos y validaciones de un formulario.
    function limpiarFormulario(id) {
        const formulario = $(id);
        if (!formulario) return;
        formulario.reset();
        formulario.classList.remove('was-validated');
        $$('.is-invalid, .is-valid', formulario)
            .forEach(elemento => {
                elemento.classList.remove(
                    'is-invalid',
                    'is-valid'
                );
            });
    }
    // Muestra mensajes de validación de formularios.
    function mostrarErrorFormulario(id, mensaje) {
        texto(id, mensaje);
        visible(id, Boolean(mensaje));
        if (mensaje) {
            atributo(id, 'role', 'alert');
        }
    }
    // Oculta mensajes de validación anteriores.
    function limpiarErrorFormulario(id) {
        mostrarErrorFormulario(id, '');
    }
    // Controla campos dependientes de una condición.
    function mostrarCampoCondicional(
        contenedorId,
        campos,
        mostrar
    ) {
        visible(contenedorId, mostrar);
        lista(campos).forEach(id => {
            deshabilitar(id, !mostrar);
        });
    }
    // ========================================================
    // 11. EVENTOS Y CONTROL DE EJECUCIÓN
    // ========================================================
    // Vincula eventos únicamente a elementos existentes.
    function enlazar(id, evento, funcion, opciones) {
        const nodo = $(id);
        if (!nodo || typeof funcion !== 'function') return;
        nodo.addEventListener(evento, funcion, opciones);
    }
    // Vincula un mismo evento a varios elementos.
    function enlazarVarios(ids, evento, funcion) {
        lista(ids).forEach(id => {
            enlazar(id, evento, funcion);
        });
    }
    // Captura errores síncronos y asíncronos de eventos.
    function eventoSeguro(funcion) {
        return function (...argumentos) {
            Promise.resolve()
                .then(() => funcion.apply(this, argumentos))
                .catch(manejarError);
        };
    }
    // Evita ejecutar búsquedas y filtros repetidamente
    // mientras el usuario continúa escribiendo.
    function debounce(funcion, demora = 250) {
        let temporizador;
        return function (...argumentos) {
            clearTimeout(temporizador);
            temporizador = setTimeout(() => {
                Promise.resolve()
                    .then(() => funcion.apply(this, argumentos))
                    .catch(manejarError);
            }, demora);
        };
    }
    // ========================================================
    // CONTROL DE OPERACIONES SIMULTÁNEAS
    //
    // Evita guardar dos veces una actividad, ejecutar varias
    // importaciones o solicitar repetidamente una operación
    // desde la interfaz.
    //
    // La prevención definitiva de duplicados debe realizarse
    // también en el backend y la base de datos.
    // ========================================================
    async function ejecutarOperacion(
        clave,
        funcion,
        botones = []
    ) {
        if (operacionesBloqueadas.has(clave)) {
            return;
        }
        operacionesBloqueadas.add(clave);
        const estadosAnteriores = new Map();
        lista(botones).forEach(id => {
            const nodo = $(id);
            if (!nodo) return;
            estadosAnteriores.set(id, nodo.disabled);
            nodo.disabled = true;
            nodo.setAttribute('aria-busy', 'true');
        });
        try {
            return await funcion();
        } finally {
            operacionesBloqueadas.delete(clave);
            estadosAnteriores.forEach((anterior, id) => {
                const nodo = $(id);
                if (!nodo) return;
                nodo.disabled = anterior;
                nodo.removeAttribute('aria-busy');
            });
        }
    }
    // ========================================================
    // 12. INDICADORES, PORCENTAJES Y ESTADOS VISUALES
    // ========================================================
    // Limita un número dentro de un intervalo.
    function limitar(valor, minimo, maximo) {
        return Math.min(
            maximo,
            Math.max(minimo, numero(valor))
        );
    }
    // Calcula porcentajes de cumplimiento.
    function porcentaje(realizadas, programadas) {
        const total = numero(programadas);
        const completadas = numero(realizadas);
        if (total <= 0) return 0;
        return limitar(
            Math.round(completadas / total * 10000) / 100,
            0,
            100
        );
    }
    // Formatea porcentajes según la configuración colombiana.
    function porcentajeTexto(valor) {
        return `${limitar(valor, 0, 100).toLocaleString(
            CONFIG.LOCALE,
            {
                maximumFractionDigits: 2
            }
        )}%`;
    }
    // Formatea valores numéricos.
    function numeroTexto(valor) {
        return numero(valor).toLocaleString(CONFIG.LOCALE);
    }
    // Actualiza las barras de cumplimiento.
    function actualizarBarra(id, valor) {
        const nodo = $(id);
        if (!nodo) return;
        const progreso = limitar(valor, 0, 100);
        nodo.style.width = `${progreso}%`;
        const contenedor = nodo.closest('[role="progressbar"]');
        if (contenedor) {
            contenedor.setAttribute(
                'aria-valuenow',
                String(progreso)
            );
            contenedor.setAttribute('aria-valuemin', '0');
            contenedor.setAttribute('aria-valuemax', '100');
        }
    }
    // Actualiza una barra y su contenedor.
    function actualizarProgreso(
        contenedorId,
        barraId,
        valor
    ) {
        const progreso = limitar(valor, 0, 100);
        actualizarBarra(barraId, progreso);
        atributo(
            contenedorId,
            'aria-valuenow',
            progreso
        );
    }
    // Determina el estado visual de una actividad.
    // No modifica automáticamente su estado en MySQL.
    function estadoVisual(actividad) {
        const registro = objeto(actividad);
        const actual = mayusculas(
            registro.estado,
            'PENDIENTE'
        );
        const fecha = fechaISO(
            registro.fecha ||
            registro.fecha_programada ||
            registro.fechaProgramada
        );
        if (
            ['PENDIENTE', 'EN_PROCESO'].includes(actual) &&
            fecha &&
            fecha < hoy()
        ) {
            return 'VENCIDA';
        }
        return actual;
    }
    // ========================================================
    // ETIQUETAS VISUALES COMPATIBLES CON EL CSS
    // ========================================================
    // Etiqueta de estado.
    // Se conserva la clase original y se incorpora data-estado.
    function badgeEstado(valor) {
        const actual = mayusculas(valor, 'PENDIENTE');
        const estadoCSS = clase(actual);
        return `
            <span
                class="badge-estado ${estadoCSS}"
                data-estado="${estadoCSS}"
            >
                ${escapar(ESTADOS[actual] || actual)}
            </span>
        `;
    }
    // Etiqueta de tipo de actividad.
    function badgeTipo(valor) {
        const tipo = mayusculas(valor, 'OTRO');
        return `
            <span class="badge-tipo ${clase(tipo)}">
                ${escapar(TIPOS[tipo] || tipo)}
            </span>
        `;
    }
    // Etiqueta de origen del registro.
    function badgeOrigen(valor) {
        const origen = normalizarOrigen(valor);
        return `
            <span class="badge-origen ${clase(origen)}">
                ${escapar(ORIGENES[origen] || 'Desconocido')}
            </span>
        `;
    }
    // Etiqueta de prioridad BAJA, MEDIA o ALTA.
    function badgePrioridad(valor) {
        const prioridad = normalizarPrioridad(valor);
        return `
            <span class="badge-prioridad ${clase(prioridad)}">
                ${escapar(PRIORIDADES[prioridad])}
            </span>
        `;
    }
    // ========================================================
    // 13. ESTADOS VACÍOS Y ERRORES VISUALES
    // ========================================================
    // Genera un estado vacío compatible con el CSS del módulo.
    function estadoVacio(
        titulo = 'No hay registros',
        descripcion = 'No se encontraron resultados.',
        icono = 'fa-folder-open'
    ) {
        return `
            <div class="estado-vacio">
                <div class="estado-vacio-icono">
                    <i class="fas ${clase(icono)}"
                       aria-hidden="true"></i>
                </div>
                <h4>${escapar(titulo)}</h4>
                <p>${escapar(descripcion)}</p>
            </div>
        `;
    }
    // Muestra un estado vacío dentro de una tabla.
    function tablaVacia(
        id,
        mensaje = 'No se encontraron registros.',
        icono = 'fa-folder-open'
    ) {
        const cuerpo = $(id);
        if (!cuerpo) return;
        const columnas = cuerpo.closest('table')
            ?.querySelectorAll('thead th').length || 1;
        cuerpo.innerHTML = `
            <tr>
                <td colspan="${columnas}"
                    class="tabla-estado-vacio">
                    ${estadoVacio(
                        'Sin registros',
                        mensaje,
                        icono
                    )}
                </td>
            </tr>
        `;
    }
    // Presenta errores independientes por sección.
    function mostrarErrorSeccion(
        id,
        mensaje = 'No fue posible consultar la información.'
    ) {
        html(
            id,
            estadoVacio(
                'Información no disponible',
                mensaje,
                'fa-circle-exclamation'
            )
        );
    }
    // Presenta un indicador de carga dentro de una tabla.
    function tablaCargando(id) {
        const cuerpo = $(id);
        if (!cuerpo) return;
        const columnas = cuerpo.closest('table')
            ?.querySelectorAll('thead th').length || 1;
        cuerpo.innerHTML = `
            <tr>
                <td colspan="${columnas}"
                    class="tabla-estado-vacio">
                    <div class="estado-cargando">
                        <span class="spinner-border spinner-border-sm"
                              aria-hidden="true"></span>
                        <span>Consultando información...</span>
                    </div>
                </td>
            </tr>
        `;
    }
    // ========================================================
    // 14. CONSTRUCCIÓN DE CONSULTAS AL BACKEND
    // ========================================================
    // Construye parámetros de consulta de forma segura.
    // Omite valores vacíos, pero conserva valores como 0 y false.
    function conParametros(ruta, parametros = {}) {
        const [direccion, consulta = ''] = ruta.split('?');
        const resultado = new URLSearchParams(consulta);
        Object.entries(parametros).forEach(([clave, valor]) => {
            if (
                valor === undefined ||
                valor === null ||
                valor === ''
            ) {
                return;
            }
            resultado.set(clave, String(valor));
        });
        const cadena = resultado.toString();
        return cadena
            ? `${direccion}?${cadena}`
            : direccion;
    }
    // Agrega el periodo institucional seleccionado.
    // Compatible con años anteriores y posteriores.
    function conAnio(ruta, anio = estado.anio) {
        return conParametros(ruta, {
            anio: validarAnio(anio)
        });
    }
    // ========================================================
    // 15. CLASE PERSONALIZADA DE ERRORES DEL BACKEND
    // ========================================================
    class ErrorAPI extends Error {
        constructor(mensaje, status = 0, datos = null) {
            super(mensaje);
            this.name = 'ErrorAPI';
            this.status = status;
            this.datos = datos;
        }
    }
    // Obtiene el mensaje entregado por el servidor.
    function mensajeRespuesta(datos, alternativa) {
        const mensaje =
            datos?.message ||
            datos?.mensaje ||
            datos?.error;
        return typeof mensaje === 'string'
            ? mensaje
            : alternativa;
    }
    // Traduce los códigos HTTP a mensajes comprensibles.
    function mensajeHTTP(status) {
        const mensajes = {
            400: 'Los datos enviados no son válidos.',
            401: 'Tu sesión ha expirado. Inicia sesión nuevamente.',
            403: 'No tienes permisos para realizar esta operación.',
            404: 'El registro o servicio solicitado no existe.',
            405: 'El método solicitado no está permitido.',
            408: 'Se agotó el tiempo de espera de la solicitud.',
            409: 'La operación presenta un conflicto con los registros existentes.',
            413: 'El archivo supera el tamaño máximo permitido.',
            415: 'El formato del archivo no es compatible.',
            422: 'No fue posible validar la información enviada.',
            429: 'Demasiadas solicitudes. Intenta nuevamente más tarde.',
            500: 'Ocurrió un error interno en el servidor.',
            502: 'El servidor no está disponible temporalmente.',
            503: 'El servicio solicitado no está disponible.',
            504: 'El servidor tardó demasiado en responder.'
        };
        return mensajes[status] ||
            `No fue posible completar la solicitud (${status}).`;
    }
    // ========================================================
    // 16. PETICIONES HTTP CENTRALIZADAS
    //
    // Compatible con:
    // - GET: consulta de información.
    // - POST: creación de registros.
    // - PUT: actualización de registros.
    // - PATCH: actualización parcial.
    // - DELETE: eliminación de registros.
    // - FormData: importación de documentos Excel.
    //
    // Conserva las sesiones del ERP mediante same-origin.
    // ========================================================
    async function peticion(ruta, opciones = {}) {
        const {
            tiempo = CONFIG.TIEMPO_PETICION,
            clavePeticion = null,
            cancelarAnterior = false,
            signal: signalExterna,
            ...opcionesFetch
        } = opciones;
        // Solo permite rutas relativas del módulo.
        if (
            typeof ruta !== 'string' ||
            !ruta.startsWith('/') ||
            ruta.startsWith('//')
        ) {
            throw new Error('Ruta del servicio no válida.');
        }
        const controlador = new AbortController();
        let agotado = false;
        let temporizador;
        const cancelar = () => controlador.abort();
        // Integra señales externas de cancelación.
        if (signalExterna?.aborted) {
            controlador.abort();
        } else {
            signalExterna?.addEventListener(
                'abort',
                cancelar,
                { once: true }
            );
        }
        // Evita que una consulta anterior sobrescriba
        // información correspondiente a una consulta nueva.
        if (clavePeticion) {
            if (cancelarAnterior) {
                peticionesActivas
                    .get(clavePeticion)
                    ?.abort();
            }
            peticionesActivas.set(
                clavePeticion,
                controlador
            );
        }
        try {
            // Configuración general de la solicitud.
            const configuracion = {
                method: 'GET',
                credentials: 'same-origin',
                cache: 'no-store',
                ...opcionesFetch,
                signal: controlador.signal
            };
            const headers = new Headers(
                opcionesFetch.headers || {}
            );
            headers.set('Accept', 'application/json');
            // Compatibilidad con importación de archivos.
            if (configuracion.body instanceof FormData) {
                // El navegador genera automáticamente
                // el Content-Type y boundary del formulario.
                headers.delete('Content-Type');
            } else if (
                configuracion.body !== undefined &&
                configuracion.body !== null
            ) {
                headers.set(
                    'Content-Type',
                    'application/json'
                );
                if (typeof configuracion.body !== 'string') {
                    configuracion.body = JSON.stringify(
                        configuracion.body
                    );
                }
            }
            configuracion.headers = headers;
            // Control del tiempo máximo de respuesta.
            temporizador = setTimeout(() => {
                agotado = true;
                controlador.abort();
            }, tiempo);
            const respuesta = await fetch(
                `${API}${ruta}`,
                configuracion
            );
            const tipo = respuesta.headers.get(
                'content-type'
            ) || '';
            // Sesión expirada.
            if (respuesta.status === 401) {
                throw new ErrorAPI(
                    mensajeHTTP(401),
                    401
                );
            }
            // Permisos insuficientes.
            if (respuesta.status === 403) {
                throw new ErrorAPI(
                    mensajeHTTP(403),
                    403
                );
            }
            // Operación exitosa sin contenido.
            if (respuesta.status === 204) {
                return {
                    success: true
                };
            }
            let datos = null;
            // Procesamiento seguro de respuestas JSON.
            if (
                tipo.includes('application/json') ||
                tipo.includes('+json')
            ) {
                try {
                    datos = await respuesta.json();
                } catch (error) {
                    if (error.name === 'AbortError') {
                        throw error;
                    }
                    throw new ErrorAPI(
                        'El servidor devolvió una respuesta JSON no válida.',
                        respuesta.status
                    );
                }
            }
            // Procesamiento de errores HTTP.
            if (!respuesta.ok) {
                throw new ErrorAPI(
                    mensajeRespuesta(
                        datos,
                        mensajeHTTP(respuesta.status)
                    ),
                    respuesta.status,
                    datos
                );
            }
            // Detecta páginas HTML u otros formatos
            // inesperados entregados por el servidor.
            if (datos === null) {
                throw new ErrorAPI(
                    'El servidor devolvió un formato de respuesta inesperado.',
                    respuesta.status
                );
            }
            // Detecta operaciones rechazadas por el backend.
            if (datos.success === false) {
                throw new ErrorAPI(
                    mensajeRespuesta(
                        datos,
                        'No fue posible completar la operación.'
                    ),
                    respuesta.status,
                    datos
                );
            }
            return datos;
        } catch (error) {
            // Tiempo de espera agotado.
            if (error.name === 'AbortError' && agotado) {
                throw new ErrorAPI(
                    'El servidor tardó demasiado en responder. Intenta nuevamente.',
                    408
                );
            }
            // Cancelación voluntaria de una consulta.
            if (error.name === 'AbortError') {
                throw error;
            }
            // Error de conexión con el ERP.
            if (error instanceof TypeError) {
                throw new ErrorAPI(
                    'No fue posible establecer comunicación con el ERP.',
                    0
                );
            }
            throw error;
        } finally {
            // Libera temporizadores y referencias.
            clearTimeout(temporizador);
            signalExterna?.removeEventListener(
                'abort',
                cancelar
            );
            // No elimina una consulta nueva que utilice
            // la misma clave de una consulta anterior.
            if (
                clavePeticion &&
                peticionesActivas.get(clavePeticion) === controlador
            ) {
                peticionesActivas.delete(clavePeticion);
            }
        }
    }
    // ========================================================
    // 17. CANCELACIÓN DE CONSULTAS ACTIVAS
    // ========================================================
    // Cancela una consulta específica.
    function cancelarPeticion(clave) {
        const controlador = peticionesActivas.get(clave);
        if (controlador) {
            controlador.abort();
            peticionesActivas.delete(clave);
        }
    }
    // Cancela las consultas registradas.
    // Se utiliza principalmente al cambiar el año
    // o abandonar el módulo.
    function cancelarConsultasActivas() {
        peticionesActivas.forEach(controlador => {
            controlador.abort();
        });
        peticionesActivas.clear();
    }
    // ========================================================
    // 18. CONSULTA Y DESCARGA DE ARCHIVOS
    //
    // Compatible con:
    // - Documentos Excel FT-SST-147.
    // - Tarjetas PNG de cumpleaños.
    // - Archivos generados desde el backend.
    // ========================================================
    async function obtenerArchivo(
        ruta,
        tipoEsperado,
        opciones = {}
    ) {
        if (
            typeof ruta !== 'string' ||
            !ruta.startsWith('/') ||
            ruta.startsWith('//')
        ) {
            throw new Error('Ruta del archivo no válida.');
        }
        const controlador = new AbortController();
        const signalExterna = opciones.signal;
        const cancelar = () => controlador.abort();
        let agotado = false;
        // Control de cancelación externa.
        if (signalExterna?.aborted) {
            controlador.abort();
        } else {
            signalExterna?.addEventListener(
                'abort',
                cancelar,
                { once: true }
            );
        }
        const temporizador = setTimeout(() => {
            agotado = true;
            controlador.abort();
        }, CONFIG.TIEMPO_ARCHIVOS);
        try {
            const respuesta = await fetch(
                `${API}${ruta}`,
                {
                    method: 'GET',
                    credentials: 'same-origin',
                    cache: 'no-store',
                    signal: controlador.signal,
                    headers: {
                        Accept: tipoEsperado || '*/*'
                    }
                }
            );
            const tipo = respuesta.headers.get(
                'content-type'
            ) || '';
            // Procesa errores entregados por el backend.
            if (!respuesta.ok) {
                let datos = null;
                if (tipo.includes('json')) {
                    datos = await respuesta
                        .json()
                        .catch(error => {
                            if (error.name === 'AbortError') {
                                throw error;
                            }
                            return null;
                        });
                }
                throw new ErrorAPI(
                    mensajeRespuesta(
                        datos,
                        mensajeHTTP(respuesta.status)
                    ),
                    respuesta.status,
                    datos
                );
            }
            // Evita descargar páginas HTML como documentos.
            if (
                tipoEsperado &&
                !tipo.includes(tipoEsperado)
            ) {
                throw new Error(
                    'El servidor devolvió un formato de archivo inesperado.'
                );
            }
            const archivo = await respuesta.blob();
            // Verifica que el archivo tenga contenido.
            if (!archivo.size) {
                throw new Error(
                    'El archivo recibido está vacío.'
                );
            }
            return archivo;
        } catch (error) {
            if (error.name === 'AbortError' && agotado) {
                throw new ErrorAPI(
                    'Se agotó el tiempo de espera del archivo.',
                    408
                );
            }
            throw error;
        } finally {
            clearTimeout(temporizador);
            signalExterna?.removeEventListener(
                'abort',
                cancelar
            );
        }
    }
    // Descarga archivos generados por el backend.
    function descargarBlob(archivo, nombre) {
        if (!(archivo instanceof Blob)) {
            throw new Error(
                'El archivo solicitado no está disponible.'
            );
        }
        if (!archivo.size) {
            throw new Error(
                'El archivo solicitado está vacío.'
            );
        }
        // Elimina caracteres incompatibles con nombres
        // de archivos en Windows y otros sistemas.
        const nombreSeguro = String(
            nombre || 'archivo'
        )
            .replace(/[\\/:*?"<>|\x00-\x1F]/g, '-')
            .trim() || 'archivo';
        const url = URL.createObjectURL(archivo);
        const enlace = document.createElement('a');
        enlace.href = url;
        enlace.download = nombreSeguro;
        enlace.style.display = 'none';
        try {
            document.body.appendChild(enlace);
            enlace.click();
        } finally {
            enlace.remove();
            // Libera la memoria utilizada por el archivo.
            setTimeout(() => {
                URL.revokeObjectURL(url);
            }, 1000);
        }
    }
    // Presenta el tamaño de archivos en B, KB o MB.
    function tamanoArchivo(bytes) {
        const valor = Math.max(0, numero(bytes));
        if (valor < 1024) {
            return `${valor} B`;
        }
        if (valor < 1024 * 1024) {
            return `${(valor / 1024).toFixed(2)} KB`;
        }
        return `${(valor / (1024 * 1024)).toFixed(2)} MB`;
    }
    // ========================================================
    // 19. SISTEMA CENTRALIZADO DE NOTIFICACIONES TOAST
    //
    // Compatible con Bootstrap y el CSS personalizado.
    //
    // Tipos:
    // - exito
    // - error
    // - advertencia
    // - info
    // ========================================================
    function notificar(mensaje, tipo = 'exito') {
        // Compatibilidad con llamadas anteriores.
        if (tipo === true) tipo = 'error';
        if (tipo === false) tipo = 'exito';
        const configuraciones = {
            exito: {
                titulo: 'Operación exitosa',
                icono: 'fa-circle-check'
            },
            error: {
                titulo: 'Error',
                icono: 'fa-circle-exclamation'
            },
            advertencia: {
                titulo: 'Advertencia',
                icono: 'fa-triangle-exclamation'
            },
            info: {
                titulo: 'Información',
                icono: 'fa-circle-info'
            }
        };
        const categoria = Object.prototype.hasOwnProperty.call(
            configuraciones,
            tipo
        ) ? tipo : 'info';
        const config = configuraciones[categoria];
        const contenedor = $('contenedorToasts');
        const contenido = String(
            mensaje || 'Información no disponible.'
        );
        // Alternativa cuando Bootstrap no está disponible.
        if (!contenedor || !window.bootstrap?.Toast) {
            anunciar(contenido);
            if (categoria === 'error') {
                console.error(contenido);
            } else {
                console.info(contenido);
            }
            window.alert(contenido);
            return;
        }
        // Crea una notificación independiente.
        const nodo = document.createElement('div');
        nodo.className =
            `toast cronograma-toast toast-${categoria}`;
        nodo.dataset.estado = categoria;
        nodo.setAttribute(
            'role',
            categoria === 'error' ? 'alert' : 'status'
        );
        nodo.setAttribute(
            'aria-live',
            categoria === 'error' ? 'assertive' : 'polite'
        );
        nodo.setAttribute('aria-atomic', 'true');
        // Todos los mensajes dinámicos se escapan antes
        // de incorporarse al contenido HTML.
        nodo.innerHTML = `
            <div class="toast-header">
                <div class="toast-icono ${categoria}">
                    <i class="fas ${config.icono}"
                       aria-hidden="true"></i>
                </div>

                <strong class="me-auto">
                    ${escapar(config.titulo)}
                </strong>

                <button type="button"
                        class="btn-close"
                        data-bs-dismiss="toast"
                        aria-label="Cerrar notificación">
                </button>
            </div>

            <div class="toast-body">
                ${escapar(contenido)}
            </div>
        `;
        contenedor.appendChild(nodo);
        // Inicializa la notificación mediante Bootstrap.
        const instancia = new window.bootstrap.Toast(
            nodo,
            {
                autohide: true,
                delay: categoria === 'error'
                    ? 8500
                    : CONFIG.DURACION_TOAST
            }
        );
        // Elimina las notificaciones cerradas para evitar
        // acumulación innecesaria de elementos en el DOM.
        nodo.addEventListener(
            'hidden.bs.toast',
            () => {
                instancia.dispose();
                nodo.remove();
            },
            { once: true }
        );
        instancia.show();
    }
    // Anuncia mensajes mediante la región accesible del módulo.
    function anunciar(mensaje) {
        texto(
            'anunciosCronograma',
            mensaje
        );
    }
    // ========================================================
    // 20. MANEJO GENERAL DE ERRORES
    // ========================================================
    // Centraliza los errores producidos por las operaciones.
    function manejarError(error) {
        // Las consultas canceladas voluntariamente
        // no deben generar notificaciones de error.
        if (error?.name === 'AbortError') {
            return;
        }
        console.error(
            '[Cronograma Transformín]',
            error
        );
        const mensaje =
            error?.message ||
            'Ocurrió un error inesperado.';
        notificar(mensaje, 'error');
    }
    // Presenta una alerta general dentro del módulo.
    function mostrarErrorGeneral(mensaje) {
        texto(
            'mensajeErrorCronograma',
            mensaje
        );
        visible(
            'alertaErrorCronograma',
            Boolean(mensaje)
        );
    }
    // Limpia las alertas generales anteriores.
    function limpiarErrorGeneral() {
        mostrarErrorGeneral('');
    }
    // ========================================================
    // 21. ESTADOS DE CARGA
    // ========================================================
    // Controla las operaciones activas del módulo.
    // El indicador permanece visible mientras exista
    // al menos una operación pendiente de finalizar.
    function cargando(valor) {
        if (valor) {
            estado.operacionesActivas += 1;
        } else {
            estado.operacionesActivas = Math.max(
                0,
                estado.operacionesActivas - 1
            );
        }
        estado.cargando = estado.operacionesActivas > 0;
        visible(
            'cronogramaLoading',
            estado.cargando
        );
        deshabilitar(
            'btnActualizarDatos',
            estado.cargando
        );
        atributo(
            'contenidoPrincipal',
            'aria-busy',
            estado.cargando
        );
    }
    // Ejecuta una operación mostrando el indicador de carga.
    // Garantiza su cierre incluso cuando ocurre un error.
    async function conCarga(funcion) {
        cargando(true);
        try {
            return await funcion();
        } finally {
            cargando(false);
        }
    }
    // Cambia temporalmente el contenido de un botón
    // mientras se ejecuta una operación.
    function botonCargando(
        id,
        activo,
        mensaje = 'Procesando...'
    ) {
        const boton = $(id);
        if (!boton) return;
        if (activo) {
            // Evita sobrescribir el contenido original.
            if (boton.dataset.cargando === 'true') {
                return;
            }
            boton.dataset.htmlOriginal = boton.innerHTML;
            boton.dataset.disabledOriginal =
                String(boton.disabled);
            boton.dataset.cargando = 'true';
            boton.disabled = true;
            boton.setAttribute('aria-busy', 'true');
            boton.innerHTML = `
                <span class="spinner-border spinner-border-sm"
                      aria-hidden="true"></span>
                <span>${escapar(mensaje)}</span>
            `;
        } else {
            if (boton.dataset.cargando !== 'true') {
                return;
            }
            // Recupera los iconos y textos originales.
            boton.innerHTML =
                boton.dataset.htmlOriginal || '';
            boton.disabled =
                boton.dataset.disabledOriginal === 'true';
            delete boton.dataset.htmlOriginal;
            delete boton.dataset.disabledOriginal;
            delete boton.dataset.cargando;
            boton.removeAttribute('aria-busy');
        }
    }
    // ========================================================
    // 22. GESTIÓN DE VENTANAS MODALES
    //
    // Compatible con Bootstrap 5 y los estilos personalizados
    // del archivo cronograma-transformin.css.
    // ========================================================
    // Obtiene o inicializa una instancia de modal.
    function modal(id) {
        const nodo = $(id);
        if (!nodo) {
            console.warn(
                `[Transformín] Modal no encontrado: ${id}`
            );
            return null;
        }
        if (!window.bootstrap?.Modal) {
            console.error(
                '[Transformín] Bootstrap Modal no está disponible.'
            );
            return null;
        }
        return window.bootstrap.Modal.getOrCreateInstance(
            nodo,
            {
                backdrop: true,
                keyboard: true,
                focus: true
            }
        );
    }
    // Abre una ventana modal existente.
    function abrirModal(id) {
        const instancia = modal(id);
        if (!instancia) {
            notificar(
                'No fue posible abrir la ventana solicitada.',
                'error'
            );
            return false;
        }
        instancia.show();
        return true;
    }
    // Cierra una ventana modal sin crear otra instancia.
    function cerrarModal(id) {
        const nodo = $(id);
        if (!nodo || !window.bootstrap?.Modal) {
            return;
        }
        window.bootstrap.Modal
            .getInstance(nodo)
            ?.hide();
    }
    // Cambia de modal esperando que finalice
    // la transición de cierre del modal anterior.
    function cambiarModal(actualId, siguienteId) {
        if (actualId === siguienteId) {
            abrirModal(siguienteId);
            return;
        }
        const actual = $(actualId);
        const siguiente = $(siguienteId);
        if (!siguiente) {
            notificar(
                'La ventana solicitada no está disponible.',
                'error'
            );
            return;
        }
        if (
            !actual ||
            !actual.classList.contains('show')
        ) {
            abrirModal(siguienteId);
            return;
        }
        const instancia =
            window.bootstrap?.Modal?.getInstance(actual);
        if (!instancia) {
            notificar(
                'No fue posible cambiar de ventana.',
                'advertencia'
            );
            return;
        }
        actual.addEventListener(
            'hidden.bs.modal',
            () => abrirModal(siguienteId),
            { once: true }
        );
        instancia.hide();
    }
    // Configura los eventos generales de las ventanas modales.
    function configurarModales() {
        $$('.modal').forEach(elemento => {
            // Evita registrar eventos más de una vez.
            if (
                elemento.dataset.transforminModalConfigurado
                === 'true'
            ) {
                return;
            }
            elemento.dataset.transforminModalConfigurado =
                'true';
            // Restablece la posición de desplazamiento
            // cuando se abre una ventana.
            elemento.addEventListener(
                'shown.bs.modal',
                () => {
                    const dialogo = elemento.querySelector(
                        '.modal-dialog'
                    );
                    const cuerpo = elemento.querySelector(
                        '.modal-body'
                    );
                    elemento.scrollTop = 0;
                    if (dialogo) {
                        dialogo.scrollTop = 0;
                    }
                    if (cuerpo) {
                        cuerpo.scrollTop = 0;
                    }
                }
            );
            // Limpia las validaciones visuales al cerrar.
            elemento.addEventListener(
                'hidden.bs.modal',
                () => {
                    $$('.is-invalid, .is-valid', elemento)
                        .forEach(campo => {
                            campo.classList.remove(
                                'is-invalid',
                                'is-valid'
                            );
                        });
                    $$('form.was-validated', elemento)
                        .forEach(formulario => {
                            formulario.classList.remove(
                                'was-validated'
                            );
                        });
                }
            );
        });
    }
    // ========================================================
    // 23. SISTEMA DE PAGINACIÓN REUTILIZABLE
    //
    // Utilizado en:
    // - Actividades manuales.
    // - Actividades institucionales FT-SST-147.
    // - Directorio de cumpleaños.
    // - Historial de notificaciones.
    // - Historial de actividades.
    // - Historial de importaciones.
    // - Auditoría.
    // ========================================================
    // Divide los registros en páginas.
    function paginar(registros, pagina = 1, limite = 8) {
        const datos = lista(registros);
        const porPagina = Math.max(
            1,
            entero(limite, 8)
        );
        const total = datos.length;
        const totalPaginas = Math.max(
            1,
            Math.ceil(total / porPagina)
        );
        const paginaActual = limitar(
            entero(pagina, 1),
            1,
            totalPaginas
        );
        const inicio = (paginaActual - 1) * porPagina;
        const fin = Math.min(
            inicio + porPagina,
            total
        );
        return {
            registros: datos.slice(inicio, fin),
            pagina: paginaActual,
            totalPaginas,
            total,
            inicio,
            fin,
            porPagina
        };
    }
    // Genera los botones de navegación entre páginas.
    function pintarPaginacionGeneral(
        id,
        pagina,
        totalPaginas
    ) {
        const contenedor = $(id);
        if (!contenedor) return;
        totalPaginas = Math.max(
            1,
            entero(totalPaginas, 1)
        );
        pagina = limitar(
            entero(pagina, 1),
            1,
            totalPaginas
        );
        // No muestra controles si solo existe una página.
        if (totalPaginas <= 1) {
            contenedor.replaceChildren();
            return;
        }
        const desde = Math.max(1, pagina - 2);
        const hasta = Math.min(
            totalPaginas,
            pagina + 2
        );
        // Botón de página anterior.
        let contenido = `
            <button type="button"
                    class="btn-paginacion"
                    data-pagina="${pagina - 1}"
                    aria-label="Página anterior"
                    ${pagina <= 1 ? 'disabled' : ''}>
                <i class="fas fa-chevron-left"
                   aria-hidden="true"></i>
            </button>
        `;
        // Acceso directo a la primera página.
        if (desde > 1) {
            contenido += `
                <button type="button"
                        class="btn-paginacion"
                        data-pagina="1"
                        aria-label="Página 1">
                    1
                </button>
            `;
            if (desde > 2) {
                contenido += `
                    <span class="paginacion-separador"
                          aria-hidden="true">
                        …
                    </span>
                `;
            }
        }
        // Páginas cercanas a la página seleccionada.
        for (
            let actual = desde;
            actual <= hasta;
            actual++
        ) {
            const seleccionada = actual === pagina;
            contenido += `
                <button type="button"
                        class="btn-paginacion
                               ${seleccionada ? 'activo' : ''}"
                        data-pagina="${actual}"
                        aria-label="Página ${actual}"
                        ${seleccionada
                            ? 'aria-current="page"'
                            : ''}>
                    ${actual}
                </button>
            `;
        }
        // Acceso directo a la última página.
        if (hasta < totalPaginas) {
            if (hasta < totalPaginas - 1) {
                contenido += `
                    <span class="paginacion-separador"
                          aria-hidden="true">
                        …
                    </span>
                `;
            }
            contenido += `
                <button type="button"
                        class="btn-paginacion"
                        data-pagina="${totalPaginas}"
                        aria-label="Página ${totalPaginas}">
                    ${totalPaginas}
                </button>
            `;
        }
        // Botón de página siguiente.
        contenido += `
            <button type="button"
                    class="btn-paginacion"
                    data-pagina="${pagina + 1}"
                    aria-label="Página siguiente"
                    ${pagina >= totalPaginas ? 'disabled' : ''}>
                <i class="fas fa-chevron-right"
                   aria-hidden="true"></i>
            </button>
        `;
        contenedor.innerHTML = contenido;
    }
    // Actualiza el contador de resultados.
    function pintarContador(
        id,
        resultado,
        nombre = 'registros'
    ) {
        if (!resultado?.total) {
            texto(id, `0 ${nombre}`);
            return;
        }
        texto(
            id,
            `Mostrando ${resultado.inicio + 1}–` +
            `${resultado.fin} de ${resultado.total} ${nombre}`
        );
    }
    // Configura la navegación mediante delegación de eventos.
    function enlazarPaginacion(id, funcion) {
        if (typeof funcion !== 'function') return;
        enlazar(
            id,
            'click',
            eventoSeguro(async evento => {
                const boton = evento.target.closest(
                    'button[data-pagina]'
                );
                if (!boton || boton.disabled) return;
                const pagina = entero(
                    boton.dataset.pagina,
                    0
                );
                if (pagina < 1) return;
                await funcion(pagina);
            })
        );
    }
    // ========================================================
    // 24. FECHA ACTUAL EN LA INTERFAZ
    //
    // La fecha y hora se presentan utilizando la zona horaria
    // oficial configurada para Colombia.
    // ========================================================
    function actualizarFechaInterfaz() {
        const fecha = new Intl.DateTimeFormat(
            CONFIG.LOCALE,
            {
                timeZone: ZONA_HORARIA,
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric'
            }
        ).format(new Date());
        const fechaFormateada =
            fecha.charAt(0).toUpperCase() +
            fecha.substring(1);
        // Actualiza las fechas del encabezado.
        textos(
            [
                'fechaActual',
                'fechaActualCronograma'
            ],
            fechaFormateada
        );
        // Actualiza el año del pie de página.
        texto(
            'anioFooter',
            anioActual()
        );
        // Actualiza la hora institucional.
        texto(
            'horaActualCronograma',
            horaColombia()
        );
    }
    // ========================================================
    // 25. SELECTOR DEL PERIODO INSTITUCIONAL
    //
    // Compatible con:
    // - Año 2026.
    // - Año 2027.
    // - Años posteriores.
    //
    // No requiere modificar el código cada año.
    // ========================================================
    // Localiza el selector principal del periodo.
    function obtenerSelectorAnio() {
        return $('selectorAnio') ||
            $('anioCronograma') ||
            $('filtroAnio');
    }
    // Garantiza que el año seleccionado exista
    // dentro de las opciones del control.
    function asegurarOpcionAnio(selector, anio) {
        if (!selector) return;
        const periodo = String(anio);
        if (selector.tagName === 'SELECT') {
            const existe = Array.from(selector.options)
                .some(opcion => opcion.value === periodo);
            if (!existe) {
                const opcion = document.createElement(
                    'option'
                );
                opcion.value = periodo;
                opcion.textContent = periodo;
                selector.appendChild(opcion);
            }
        }
        selector.value = periodo;
    }
    // Sincroniza los controles asociados al año seleccionado.
    function sincronizarPeriodo() {
        asegurarOpcionAnio(
            obtenerSelectorAnio(),
            estado.anio
        );
        // Sincroniza importaciones, exportaciones e historial.
        [
            'anioImportarExcel',
            'anioExportarExcel',
            'anioHistorialImportaciones'
        ].forEach(id => {
            asegurarOpcionAnio(
                $(id),
                estado.anio
            );
        });
        // Actualiza las etiquetas institucionales.
        textos(
            [
                'anioSeguimiento',
                'anioFormatoInstitucional',
                'institucionalAnioEdicion'
            ],
            estado.anio
        );
    }
    // Restablece la paginación de todas las secciones.
    function reiniciarPaginaciones() {
        estado.pagina = 1;
        estado.paginaInstitucional = 1;
        estado.paginaCumpleanos = 1;
        estado.paginaHistorial = 1;
        estado.paginaAuditoria = 1;
        estado.paginaImportaciones = 1;
    }
    // Configura el selector principal de años.
    function configurarSelectorAnio() {
        const selector = obtenerSelectorAnio();
        if (!selector) return;
        // Evita duplicar los eventos del selector.
        if (
            selector.dataset.transforminAnioConfigurado
            === 'true'
        ) {
            sincronizarPeriodo();
            return;
        }
        selector.dataset.transforminAnioConfigurado =
            'true';
        if (selector.tagName === 'SELECT') {
            selector.replaceChildren();
            // Genera opciones desde el año mínimo
            // hasta el año máximo permitido.
            const limite = Math.min(
                CONFIG.ANIO_MAXIMO,
                Math.max(
                    CONFIG.ANIO_MINIMO,
                    CONFIG.ANIO_MAXIMO
                )
            );
            for (
                let anio = CONFIG.ANIO_MINIMO;
                anio <= limite;
                anio++
            ) {
                const opcion = document.createElement(
                    'option'
                );
                opcion.value = String(anio);
                opcion.textContent = String(anio);
                selector.appendChild(opcion);
            }
        } else {
            // Compatibilidad con campos numéricos.
            selector.min = CONFIG.ANIO_MINIMO;
            selector.max = CONFIG.ANIO_MAXIMO;
            selector.step = '1';
        }
        sincronizarPeriodo();
        const aplicar = eventoSeguro(async evento => {
            evento?.preventDefault();
            await cambiarAnio(selector.value);
        });
        const botonAplicar = $('btnAplicarAnio');
        if (botonAplicar) {
            botonAplicar.addEventListener(
                'click',
                aplicar
            );
            // Permite aplicar el periodo mediante Enter.
            selector.addEventListener(
                'keydown',
                evento => {
                    if (evento.key === 'Enter') {
                        aplicar(evento);
                    }
                }
            );
        } else {
            // Alternativa cuando no existe botón de aplicación.
            selector.addEventListener(
                'change',
                aplicar
            );
        }
    }
    // ========================================================
    // CAMBIO DEL PERIODO INSTITUCIONAL
    //
    // Evita mezclar información de diferentes años.
    // Cancela consultas anteriores y restablece los registros
    // asociados al periodo seleccionado.
    // ========================================================
    async function cambiarAnio(valor) {
        const selector = obtenerSelectorAnio();
        // Impide cambiar de periodo durante operaciones
        // que pueden modificar información institucional.
        if (
            estado.guardando ||
            estado.importando ||
            estado.exportando ||
            estado.validandoExcel
        ) {
            asegurarOpcionAnio(
                selector,
                estado.anio
            );
            notificar(
                'Espera a que finalice la operación actual.',
                'advertencia'
            );
            return;
        }
        let anio;
        try {
            anio = validarAnio(valor);
        } catch (error) {
            asegurarOpcionAnio(
                selector,
                estado.anio
            );
            throw error;
        }
        // No realiza consultas innecesarias.
        if (anio === estado.anio) {
            sincronizarPeriodo();
            return;
        }
        // Cancela las consultas del periodo anterior.
        cancelarConsultasActivas();
        // Invalida las respuestas de cargas anteriores.
        estado.versionCarga += 1;
        // Actualiza el año seleccionado.
        estado.anio = anio;
        const mes = estado.fechaCalendario.getMonth();
        estado.fechaCalendario = new Date(
            anio,
            mes,
            1,
            12
        );
        estado.fechaSeleccionada = fechaLocal(
            anio,
            mes + 1,
            1
        );
        // ====================================================
        // LIMPIEZA DE DATOS DEL PERIODO ANTERIOR
        // ====================================================
        // Actividades manuales.
        estado.actividades = [];
        estado.filtradas = [];
        estado.actividadSeleccionada = null;
        // Actividades institucionales.
        estado.institucionales = [];
        estado.institucionalesFiltradas = [];
        estado.institucionalSeleccionada = null;
        estado.cronogramaInstitucional = null;
        // Seguimiento semanal.
        estado.semanasSeleccionadas = [];
        estado.semanaSeleccionada = null;
        // Eventos del calendario.
        estado.eventosInstitucionales = [];
        estado.eventosSinFecha = [];
        estado.eventosCumpleanos = [];
        // Indicadores correspondientes al periodo.
        estado.cumplimiento = null;
        estado.indicadores = {};
        estado.indicadoresManuales = {};
        estado.indicadoresInstitucionales = {};
        estado.indicadoresNotificaciones = {};
        // Historiales y resultados filtrados.
        estado.historial = [];
        estado.historialFiltrado = [];
        estado.historialActividades = [];
        estado.historialActividadesFiltrado = [];
        estado.historialImportaciones = [];
        estado.notificacionSeleccionada = null;
        // Restablece el resumen de exportación.
        estado.resumenExportacion = null;
        // Restablece las páginas de resultados.
        reiniciarPaginaciones();
        // Limpia documentos pendientes de importación.
        limpiarImportacion();
        // Sincroniza los selectores y etiquetas.
        sincronizarPeriodo();
        // Consulta nuevamente la información del ERP.
        await actualizarTodo();
    }
    // ========================================================
    // 26. CONFIGURACIÓN DE PRIORIDADES
    //
    // Valores oficiales compatibles con el backend:
    // BAJA, MEDIA y ALTA.
    //
    // NORMAL y URGENTE se normalizan mediante la función
    // normalizarPrioridad() definida en la parte 02.
    // ========================================================
    function configurarPrioridades() {
        const selector = $('prioridadActividad');
        if (!selector) return;
        const valorAnterior = normalizarPrioridad(
            selector.value
        );
        selector.replaceChildren();
        Object.entries(PRIORIDADES)
            .forEach(([valor, etiqueta]) => {
                const opcion = document.createElement(
                    'option'
                );
                opcion.value = valor;
                opcion.textContent = etiqueta;
                selector.appendChild(opcion);
            });
        selector.value = valorAnterior;
    }
    // ========================================================
    // 27. CONFIGURACIÓN DE TIPOS DE ACTIVIDADES MANUALES
    //
    // Los cumpleaños provenientes de Recursos Humanos
    // se gestionan desde su propio componente.
    // ========================================================
    function configurarTiposActividad() {
        const selector = $('tipoActividad');
        if (!selector) return;
        const anterior = selector.value;
        selector.replaceChildren();
        TIPOS_MANUALES.forEach(tipo => {
            const opcion = document.createElement(
                'option'
            );
            opcion.value = tipo;
            opcion.textContent = TIPOS[tipo];
            selector.appendChild(opcion);
        });
        selector.value = TIPOS_MANUALES.includes(anterior)
            ? anterior
            : 'OTRO';
    }
    // ========================================================
    // 28. NAVEGACIÓN ENTRE PESTAÑAS
    //
    // Conserva los identificadores originales del HTML.
    // Utiliza las instancias de Bootstrap Tab.
    // ========================================================
    // Abre una pestaña del módulo.
    function abrirPestana(id) {
        const pestana = $(id);
        if (!pestana) {
            console.warn(
                `[Transformín] Pestaña no encontrada: ${id}`
            );
            return;
        }
        if (!window.bootstrap?.Tab) {
            console.warn(
                '[Transformín] Bootstrap Tab no está disponible.'
            );
            return;
        }
        window.bootstrap.Tab
            .getOrCreateInstance(pestana)
            .show();
    }
    // Navega desde la agenda hacia las actividades manuales.
    function mostrarTodasActividades() {
        abrirPestana('tab-actividades');
    }
    // Navega hacia el directorio de cumpleaños.
    function mostrarCumpleanos() {
        abrirPestana('tab-cumpleanos');
    }
    // Navega hacia la configuración de recordatorios.
    function mostrarRecordatorios() {
        abrirPestana('tab-recordatorios');
    }
    // Navega hacia el historial del módulo.
    function mostrarHistorial() {
        abrirPestana('tab-historial');
    }
    // ========================================================
    // 29. IDENTIFICACIÓN SEGURA DE ACTIVIDADES
    //
    // Formatos de referencia:
    //
    // MANUAL:15
    // FT147:27
    // FT147:27:150
    // CUMPLEANOS:35
    //
    // En FT147:
    // - Primer identificador: actividad institucional.
    // - Segundo identificador: programación semanal.
    //
    // Los identificadores deben corresponder a registros
    // reales entregados por el backend.
    // ========================================================
    function claveActividad(actividad) {
        const registro = objeto(actividad);
        const origen = normalizarOrigen(
            registro.origen
        );
        if (origen === 'DESCONOCIDO') {
            return '';
        }
        let id = null;
        let semanaId = null;
        switch (origen) {
            // Actividades manuales.
            case 'MANUAL':
                id = primerIdValido(
                    registro.id,
                    registro.actividad_id
                );
                break;
            // Actividades institucionales FT-SST-147.
            case 'FT147': {
                const referenciaActividad =
                    registro.actividad_institucional_id ??
                    registro.actividad_id ??
                    registro.actividadInstitucionalId ??
                    registro.actividadId ??
                    registro.id;
                id = primerIdValido(
                    referenciaActividad
                );
                const referenciaSemana =
                    registro.semana_id ??
                    registro.semanaId ??
                    registro.programacion_id ??
                    registro.programacionId;
                if (
                    referenciaSemana !== undefined &&
                    referenciaSemana !== null &&
                    referenciaSemana !== ''
                ) {
                    semanaId = primerIdValido(
                        referenciaSemana
                    );
                    // No convierte una programación inválida
                    // en una referencia de actividad general.
                    if (!semanaId) {
                        return '';
                    }
                }
                break;
            }
            // Colaboradores de Recursos Humanos.
            case 'CUMPLEANOS':
                id = primerIdValido(
                    registro.empleado_id ??
                    registro.empleadoId ??
                    registro.id
                );
                break;
        }
        // Impide generar referencias con undefined,
        // null, identificadores vacíos o valores inválidos.
        if (!id) {
            return '';
        }
        return semanaId
            ? `${origen}:${id}:${semanaId}`
            : `${origen}:${id}`;
    }
    // ========================================================
    // INTERPRETACIÓN DE REFERENCIAS COMPUESTAS
    //
    // Valida el origen, el identificador principal y,
    // cuando corresponde, el identificador semanal.
    //
    // No realiza consultas HTTP con referencias inválidas.
    // ========================================================
    function interpretarClave(clave) {
        const valor = String(clave ?? '').trim();
        if (!valor) return null;
        const partes = valor.split(':');
        // Solo admite referencias de dos o tres componentes.
        if (
            partes.length < 2 ||
            partes.length > 3 ||
            !partes[0].trim()
        ) {
            return null;
        }
        const origen = normalizarOrigen(
            partes[0]
        );
        if (
            ![
                'MANUAL',
                'FT147',
                'CUMPLEANOS'
            ].includes(origen)
        ) {
            return null;
        }
        // Valida el identificador principal.
        const id = primerIdValido(
            partes[1]
        );
        if (!id) return null;
        let semanaId = null;
        // Solo las actividades institucionales pueden
        // incluir un identificador de programación semanal.
        if (partes.length === 3) {
            if (origen !== 'FT147') {
                return null;
            }
            semanaId = primerIdValido(
                partes[2]
            );
            if (!semanaId) {
                return null;
            }
        }
        return {
            origen,
            id,
            semanaId
        };
    }
    // ========================================================
    // 29. CONTINUACIÓN - BÚSQUEDA SEGURA DE ACTIVIDADES
    //
    // Localiza registros dentro del estado centralizado.
    // Diferencia actividades manuales, institucionales
    // y colaboradores provenientes de Recursos Humanos.
    // ========================================================
    function buscarActividad(clave) {
        const referencia = interpretarClave(clave);
        if (!referencia) return null;
        switch (referencia.origen) {
            // Actividades manuales.
            case 'MANUAL':
                return estado.actividades.find(
                    actividad =>
                        String(actividad.id) === referencia.id
                ) || null;
            // Actividades institucionales FT-SST-147.
            case 'FT147':
                return estado.institucionales.find(
                    actividad =>
                        String(actividad.id) === referencia.id
                ) || null;
            // Colaboradores de Recursos Humanos.
            case 'CUMPLEANOS':
                return estado.cumpleanos.find(
                    persona =>
                        String(
                            persona.empleado_id ??
                            persona.id
                        ) === referencia.id
                ) || null;
            default:
                return null;
        }
    }
    // ========================================================
    // FUNCIONES COMPLEMENTARIAS DE IDENTIFICACIÓN
    // ========================================================
    // Mantiene la compatibilidad con las funciones del archivo
    // corregido que utilizan idValido().
    function idValido(...valores) {
        return primerIdValido(...valores);
    }
    // Localiza una programación semanal dentro de una
    // actividad institucional previamente consultada.
    function buscarSemanaInstitucional(
        actividad,
        semanaId
    ) {
        const id = primerIdValido(semanaId);
        if (!actividad || !id) return null;
        return lista(actividad.semanas).find(
            semana =>
                primerIdValido(semana.id) === id
        ) || null;
    }
    // ========================================================
    // 30. ESTADO DE CONEXIÓN CON EL ERP
    //
    // Actualiza los indicadores visuales de conexión.
    // No confunde la disponibilidad del módulo con
    // la habilitación de los envíos automáticos.
    // ========================================================
    function actualizarEstadoConexion(
        conectado,
        mensaje = ''
    ) {
        estado.conectado = conectado;
        const etiqueta = conectado
            ? 'Conectado'
            : 'No disponible';
        texto(
            'estadoConexionERP',
            etiqueta
        );
        texto(
            'estadoModuloTexto',
            mensaje || (
                conectado
                    ? 'Módulo conectado con el ERP'
                    : 'No fue posible conectar con el ERP'
            )
        );
        atributo(
            'estadoConexionERP',
            'data-estado',
            conectado ? 'activo' : 'error'
        );
    }
    // Actualiza los indicadores de servicios individuales.
    function actualizarEstadoServicio(
        id,
        disponible,
        mensaje = ''
    ) {
        const nodo = $(id);
        if (!nodo) return;
        let etiqueta;
        let estadoServicio;
        if (disponible === true) {
            etiqueta = 'Disponible';
            estadoServicio = 'activo';
        } else if (disponible === false) {
            etiqueta = 'No disponible';
            estadoServicio = 'inactivo';
        } else {
            etiqueta = 'Sin verificar';
            estadoServicio = 'pendiente';
        }
        nodo.textContent = mensaje || etiqueta;
        nodo.dataset.estado = estadoServicio;
    }
    // Consulta el estado general del módulo.
    async function verificarEstadoModulo() {
        try {
            const datos = await peticion(
                RUTAS.estado,
                {
                    clavePeticion: 'estado-modulo',
                    cancelarAnterior: true
                }
            );
            actualizarEstadoConexion(true);
            const servicios = objeto(
                datos.servicios
            );
            // Compatibilidad con los nombres utilizados
            // por el servicio de documentos Excel.
            const excel = obtenerCampo(
                servicios,
                'excel',
                'cronogramaExcel'
            );
            // Disponibilidad de Recursos Humanos.
            const rh = obtenerCampo(
                servicios,
                'cumpleanos',
                'recursosHumanos'
            );
            if (typeof excel === 'boolean') {
                actualizarEstadoServicio(
                    'estadoServicioExcel',
                    excel
                );
            }
            if (typeof rh === 'boolean') {
                actualizarEstadoServicio(
                    'estadoServicioRH',
                    rh
                );
            }
            // El estado de SMTP y del programador de
            // cumpleaños se consulta desde sus propias rutas.
            // No se habilitan automáticamente desde aquí.
            return datos;
        } catch (error) {
            if (error.name === 'AbortError') {
                throw error;
            }
            actualizarEstadoConexion(
                false,
                error.message
            );
            throw error;
        }
    }
    // ========================================================
    // 31. NORMALIZACIÓN DE ACTIVIDADES MANUALES
    //
    // Convierte las respuestas del backend en una estructura
    // uniforme para tablas, calendario, agenda e indicadores.
    //
    // Conserva los campos adicionales recibidos del servidor.
    // ========================================================
    function normalizarActividadManual(datos) {
        datos = objeto(datos);
        return {
            ...datos,
            // Identificador real de la actividad.
            id: primerIdValido(
                datos.id,
                datos.actividad_id
            ),
            origen: 'MANUAL',
            nombre:
                datos.nombre ||
                'Actividad sin nombre',
            // Fecha principal de la actividad.
            fecha: fechaISO(
                datos.fecha
            ),
            // Fecha de preparación previa.
            fecha_preparacion: fechaISO(
                datos.fecha_preparacion
            ),
            tipo: mayusculas(
                datos.tipo,
                'OTRO'
            ),
            estado: mayusculas(
                datos.estado,
                'PENDIENTE'
            ),
            prioridad: normalizarPrioridad(
                datos.prioridad
            ),
            responsable:
                datos.responsable || '',
            descripcion:
                datos.descripcion || '',
            observaciones:
                datos.observaciones || ''
        };
    }
    // ========================================================
    // 32. NORMALIZACIÓN DE PROGRAMACIONES SEMANALES
    //
    // Una actividad institucional puede tener múltiples
    // programaciones distribuidas durante el año.
    //
    // El identificador de la programación semanal debe
    // permanecer separado del ID de la actividad principal.
    // ========================================================
    function normalizarSemana(datos) {
        datos = objeto(datos);
        return {
            ...datos,
            // Identificador de la programación semanal.
            id: primerIdValido(
                datos.semana_id,
                datos.programacion_id,
                datos.semanaId,
                datos.programacionId,
                datos.id
            ),
            // Identificador de la actividad institucional.
            actividad_institucional_id: primerIdValido(
                datos.actividad_institucional_id,
                datos.actividad_id
            ),
            // Mes de programación.
            mes: entero(
                datos.mes
            ),
            // Semana correspondiente dentro del mes.
            semana_mes: entero(
                datos.semana_mes ??
                datos.semana
            ),
            // Indica si la semana está programada.
            programada: booleano(
                datos.programada
            ),
            // Conserva la marca original del Excel.
            marca_original: mayusculas(
                datos.marca_original
            ),
            // Estado de cumplimiento de la semana.
            estado: mayusculas(
                datos.estado ??
                datos.estado_semana,
                'PENDIENTE'
            ),
            // Fecha exacta programada, cuando existe.
            fecha_programada: fechaISO(
                datos.fecha_programada
            ),
            // Fecha de realización efectiva.
            fecha_realizacion: fechaISO(
                datos.fecha_realizacion
            ),
            observaciones:
                datos.observaciones || ''
        };
    }
    // ========================================================
    // 33. NORMALIZACIÓN DE ACTIVIDADES INSTITUCIONALES
    //
    // Formato institucional FT-SST-147.
    //
    // Conserva:
    // - Equipo o nombre de la actividad.
    // - Descripción.
    // - Frecuencia.
    // - Responsable.
    // - Programaciones semanales.
    // - Marcas originales del documento Excel.
    // - Estados de cumplimiento.
    // - Observaciones.
    // ========================================================
    function normalizarActividadInstitucional(datos) {
        datos = objeto(datos);
        // Identificador de la actividad principal.
        const idActividad = primerIdValido(
            datos.actividad_institucional_id,
            datos.actividad_id,
            datos.actividadInstitucionalId,
            datos.actividadId,
            datos.id
        );
        // Normaliza las programaciones semanales.
        const semanas = extraerLista(
            datos,
            'semanas',
            'programaciones'
        ).map(registro => {
            const semana = normalizarSemana(registro);
            return {
                ...semana,
                actividad_institucional_id:
                    semana.actividad_institucional_id ??
                    idActividad
            };
        });
        // ====================================================
        // CÁLCULO DE PROGRAMACIONES
        // ====================================================
        // Solo se contabilizan semanas programadas.
        const programadas = semanas.filter(
            semana => semana.programada
        );
        // Programaciones realizadas.
        const completadas = programadas.filter(
            semana =>
                semana.estado === 'COMPLETADA'
        );
        // Programaciones pendientes o en proceso.
        const pendientes = programadas.filter(
            semana => [
                'PENDIENTE',
                'EN_PROCESO'
            ].includes(semana.estado)
        );
        // Programaciones canceladas.
        const canceladas = programadas.filter(
            semana =>
                semana.estado === 'CANCELADA'
        );
        // ====================================================
        // ESTRUCTURA NORMALIZADA
        // ====================================================
        return {
            ...datos,
            // ID de la actividad institucional.
            id: idActividad,
            actividad_institucional_id: idActividad,
            origen: 'FT147',
            nombre:
                datos.equipo ||
                datos.nombre ||
                datos.actividad ||
                'Actividad institucional sin nombre',
            equipo:
                datos.equipo || '',
            actividad:
                datos.actividad || '',
            descripcion:
                datos.descripcion || '',
            frecuencia:
                datos.frecuencia || '',
            responsable:
                datos.responsable || '',
            tipo: mayusculas(
                datos.tipo,
                'OTRO'
            ),
            prioridad: normalizarPrioridad(
                datos.prioridad
            ),
            estado: mayusculas(
                datos.estado,
                'PENDIENTE'
            ),
            // Conserva las fechas exactas cuando existen.
            // No inventa fechas para semanas sin día definido.
            fecha: fechaISO(
                datos.fecha_exacta ||
                datos.fecha
            ),
            fecha_exacta: fechaISO(
                datos.fecha_exacta ||
                datos.fecha
            ),
            observaciones:
                datos.notas ||
                datos.observaciones ||
                '',
            // Programaciones semanales normalizadas.
            semanas,
            // Indicadores individuales de la actividad.
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
            )
        };
    }
    // ========================================================
    // VALIDACIÓN DE REGISTROS RECIBIDOS
    //
    // Permite detectar registros sin identificadores válidos
    // sin eliminarlos silenciosamente de los indicadores.
    //
    // Las operaciones de edición, eliminación y seguimiento
    // deberán exigir un identificador real.
    // ========================================================
    function revisarIdentificadoresRegistros(
        registros,
        origen
    ) {
        const datos = lista(registros);
        const invalidos = datos.filter(
            registro => !esIdValido(registro.id)
        );
        if (invalidos.length > 0) {
            console.warn(
                `[Transformín] ${origen}: ` +
                `${invalidos.length} registro(s) ` +
                'sin identificador válido.'
            );
        }
        return {
            total: datos.length,
            validos: datos.length - invalidos.length,
            invalidos: invalidos.length
        };
    }
    // ========================================================
    // 34. CONSULTAR ACTIVIDADES MANUALES
    //
    // Obtiene las actividades correspondientes al año
    // seleccionado y actualiza los filtros de la interfaz.
    // ========================================================
    async function cargarActividades() {
        const anio = estado.anio;
        const datos = await peticion(
            conAnio(
                RUTAS.actividades,
                anio
            ),
            {
                clavePeticion:
                    'actividades-manuales',
                cancelarAnterior: true
            }
        );
        // Impide utilizar datos de un año anterior
        // cuando el usuario cambia de periodo.
        if (anio !== estado.anio) {
            return;
        }
        // Normaliza los registros recibidos.
        estado.actividades = extraerLista(
            datos,
            'actividades',
            'registros',
            'data'
        ).map(
            normalizarActividadManual
        );
        // Comprueba la integridad de los identificadores.
        revisarIdentificadoresRegistros(
            estado.actividades,
            'Actividades manuales'
        );
        // Aplica los filtros y actualiza la tabla.
        aplicarFiltrosActividades();
        return estado.actividades;
    }
    // ========================================================
    // 35. CONSULTAR CRONOGRAMA INSTITUCIONAL
    //
    // Consulta las actividades del formato FT-SST-147.
    // Compatible con años anteriores y posteriores.
    //
    // Conserva la identidad documental, las actividades
    // institucionales y las programaciones semanales.
    // ========================================================
    async function cargarInstitucional() {
        const anio = estado.anio;
        const datos = await peticion(
            conAnio(
                RUTAS.institucional,
                anio
            ),
            {
                clavePeticion:
                    'actividades-institucionales',
                cancelarAnterior: true
            }
        );
        // Descarta respuestas de un periodo diferente.
        if (anio !== estado.anio) {
            return;
        }
        // Identidad del documento institucional.
        estado.cronogramaInstitucional =
            datos.cronograma || null;
        // Actividades y programaciones.
        estado.institucionales = extraerLista(
            datos,
            'actividades',
            'registros'
        ).map(
            normalizarActividadInstitucional
        );
        // Comprueba los identificadores principales.
        revisarIdentificadoresRegistros(
            estado.institucionales,
            'Actividades institucionales FT-SST-147'
        );
        // Comprueba las programaciones semanales.
        const programaciones =
            estado.institucionales.flatMap(
                actividad => lista(actividad.semanas)
            );
        // Solo se revisan las semanas programadas,
        // ya que una celda vacía puede no tener registro.
        revisarIdentificadoresRegistros(
            programaciones.filter(
                semana => semana.programada
            ),
            'Programaciones semanales FT-SST-147'
        );
        // Actualiza la información del documento.
        pintarIdentidadInstitucional();
        // Actualiza los filtros y la tabla institucional.
        aplicarFiltrosInstitucionales();
        return estado.institucionales;
    }
    // ========================================================
    // 36. IDENTIDAD DEL DOCUMENTO INSTITUCIONAL
    //
    // Gestiona los datos generales del formato FT-SST-147
    // y los indicadores consolidados del periodo.
    // ========================================================
    // Determina si el documento se encuentra cerrado.
    function cronogramaCerrado() {
        return mayusculas(
            estado.cronogramaInstitucional?.estado
        ) === 'CERRADO';
    }
    // Actualiza la identidad y los indicadores del documento.
    function pintarIdentidadInstitucional() {
        const documento =
            estado.cronogramaInstitucional;
        // ====================================================
        // INFORMACIÓN GENERAL DEL DOCUMENTO
        // ====================================================
        const estadoDocumento = documento
            ? mayusculas(
                documento.estado,
                'BORRADOR'
            )
            : 'SIN_IMPORTAR';
        // Versión institucional.
        texto(
            'versionFormatoInstitucional',
            documento?.version_formato ||
            CONFIG.VERSION_FORMATO
        );
        // Año del documento.
        texto(
            'anioFormatoInstitucional',
            estado.anio
        );
        // Estado documental.
        texto(
            'estadoFormatoInstitucional',
            documento
                ? ESTADOS[estadoDocumento] ||
                  estadoDocumento
                : 'Sin importar'
        );
        atributo(
            'estadoFormatoInstitucional',
            'data-estado',
            clase(estadoDocumento)
        );
        // ====================================================
        // ESTADO DE DISPONIBILIDAD DEL CRONOGRAMA
        // ====================================================
        texto(
            'estadoCronogramaInstitucional',
            documento
                ? 'Cronograma institucional disponible'
                : 'No existe un cronograma para este año'
        );
        atributo(
            'estadoCronogramaInstitucional',
            'data-estado',
            documento ? 'activo' : 'pendiente'
        );
        // ====================================================
        // TOTAL DE ACTIVIDADES INSTITUCIONALES
        // ====================================================
        texto(
            'totalActividadesInstitucionales',
            numeroTexto(
                estado.institucionales.length
            )
        );
        // ====================================================
        // CONSOLIDACIÓN DE PROGRAMACIONES
        // ====================================================
        const resumen = estado.institucionales.reduce(
            (total, actividad) => {
                total.programadas += numero(
                    actividad.totalProgramadas
                );
                total.completadas += numero(
                    actividad.totalCompletadas
                );
                total.pendientes += numero(
                    actividad.totalPendientes
                );
                total.canceladas += numero(
                    actividad.totalCanceladas
                );
                return total;
            },
            {
                programadas: 0,
                completadas: 0,
                pendientes: 0,
                canceladas: 0
            }
        );
        // Total de programaciones.
        texto(
            'totalProgramacionesInstitucionales',
            numeroTexto(
                resumen.programadas
            )
        );
        // Total de programaciones realizadas.
        texto(
            'totalRealizadasInstitucionales',
            numeroTexto(
                resumen.completadas
            )
        );
        // Total de programaciones pendientes.
        texto(
            'totalPendientesInstitucionales',
            numeroTexto(
                resumen.pendientes
            )
        );
        // Total de programaciones canceladas.
        // Se actualiza únicamente si el elemento existe.
        texto(
            'totalCanceladasInstitucionales',
            numeroTexto(
                resumen.canceladas
            )
        );
    }
    // ========================================================
    // 37. FILTROS DE ACTIVIDADES MANUALES
    //
    // Permite consultar actividades mediante:
    // - Nombre.
    // - Descripción.
    // - Responsable.
    // - Observaciones.
    // - Mes.
    // - Estado.
    // - Tipo de actividad.
    // ========================================================
    function aplicarFiltrosActividades(
        reiniciarPagina = true
    ) {
        const busqueda = normalizar(
            campo('buscarActividad')
        );
        const mes = campo('filtroMes');
        const filtroEstado = campo('filtroEstado');
        const tipo = campo('filtroTipo');
        estado.filtradas = lista(
            estado.actividades
        ).filter(actividad => {
            // Construye el contenido utilizado en la búsqueda.
            const contenido = normalizar([
                actividad.nombre,
                actividad.descripcion,
                actividad.responsable,
                actividad.observaciones
            ].join(' '));
            // Filtro de búsqueda general.
            if (
                busqueda &&
                !contenido.includes(busqueda)
            ) {
                return false;
            }
            // Filtro correspondiente al mes seleccionado.
            if (mes && mes !== 'TODOS') {
                const fecha = fechaISO(
                    actividad.fecha
                );
                if (
                    !fecha ||
                    Number(fecha.substring(5, 7)) !==
                    Number(mes)
                ) {
                    return false;
                }
            }
            // Filtro correspondiente al estado.
            if (
                filtroEstado &&
                filtroEstado !== 'TODOS'
            ) {
                const coincide =
                    filtroEstado === 'VENCIDA'
                        ? estadoVisual(actividad) === 'VENCIDA'
                        : actividad.estado === filtroEstado;
                if (!coincide) return false;
            }
            // Filtro correspondiente al tipo.
            if (
                tipo &&
                tipo !== 'TODOS' &&
                actividad.tipo !== tipo
            ) {
                return false;
            }
            return true;
        });
        // Ordena por fecha y posteriormente por nombre.
        // Las actividades sin fecha aparecen al final.
        estado.filtradas.sort((a, b) => {
            const fechaA =
                fechaISO(a.fecha) || '9999-12-31';
            const fechaB =
                fechaISO(b.fecha) || '9999-12-31';
            return fechaA.localeCompare(fechaB) ||
                String(a.nombre ?? '').localeCompare(
                    String(b.nombre ?? ''),
                    CONFIG.LOCALE
                );
        });
        // Reinicia la página cuando cambian los filtros.
        if (reiniciarPagina) {
            estado.pagina = 1;
        }
        pintarActividades();
    }
    // Restablece los filtros de actividades manuales.
    function limpiarFiltrosActividades() {
        [
            'buscarActividad',
            'filtroMes',
            'filtroEstado',
            'filtroTipo'
        ].forEach(id => {
            const nodo = $(id);
            if (!nodo) return;
            if (nodo.tagName === 'SELECT') {
                nodo.selectedIndex = 0;
            } else {
                nodo.value = '';
            }
        });
        estado.pagina = 1;
        aplicarFiltrosActividades();
    }
    // ========================================================
    // 38. BOTONES DE ACCIONES REUTILIZABLES
    //
    // Conserva los atributos data-accion y data-clave.
    //
    // Los eventos se gestionan mediante delegación,
    // evitando registrar eventos independientes para
    // cada botón generado dinámicamente.
    // ========================================================
    function botonAccion(
        accion,
        clave,
        icono,
        titulo,
        estilo = '',
        desactivado = false
    ) {
        // Comprueba la referencia antes de permitir acciones.
        const referencia = interpretarClave(clave);
        const bloqueado =
            Boolean(desactivado) ||
            !referencia;
        const tituloFinal = !referencia
            ? 'Identificador del registro no disponible'
            : titulo;
        return `
            <button
                type="button"
                class="btn-tabla-accion ${escapar(estilo)}"
                data-accion="${escapar(accion)}"
                data-clave="${escapar(clave)}"
                title="${escapar(tituloFinal)}"
                aria-label="${escapar(tituloFinal)}"
                ${bloqueado ? 'disabled aria-disabled="true"' : ''}
            >
                <i class="fas ${clase(icono)}"
                   aria-hidden="true"></i>
            </button>
        `;
    }
    // ========================================================
    // 39. RENDERIZAR TABLA DE ACTIVIDADES MANUALES
    //
    // Estructura correspondiente al HTML:
    //
    // 01. Actividad.
    // 02. Fecha.
    // 03. Tipo.
    // 04. Responsable.
    // 05. Estado.
    // 06. Acciones.
    //
    // La prioridad se conserva dentro de la columna
    // de actividad para evitar generar una séptima
    // columna que no existe en el encabezado HTML.
    // ========================================================
    function pintarActividades() {
        const resultado = paginar(
            estado.filtradas,
            estado.pagina,
            estado.porPagina
        );
        estado.pagina = resultado.pagina;
        // ====================================================
        // TABLA SIN RESULTADOS
        // ====================================================
        if (!resultado.total) {
            tablaVacia(
                'tablaActividadesBody',
                'No existen actividades para los filtros seleccionados.',
                'fa-calendar-days'
            );
        } else {
            // ================================================
            // GENERACIÓN DE REGISTROS
            // ================================================
            html(
                'tablaActividadesBody',
                resultado.registros.map(actividad => {
                    const clave = claveActividad(
                        actividad
                    );
                    const finalizada = [
                        'COMPLETADA',
                        'CANCELADA'
                    ].includes(actividad.estado);
                    return `
                        <tr>

                            <!-- 01. ACTIVIDAD -->

                            <td>
                                <div class="actividad-nombre">

                                    <strong>
                                        ${escapar(
                                            actividad.nombre
                                        )}
                                    </strong>

                                    <small>
                                        ${escapar(
                                            actividad.descripcion ||
                                            'Actividad manual'
                                        )}
                                    </small>

                                    <div class="actividad-prioridad">
                                        ${badgePrioridad(
                                            actividad.prioridad
                                        )}
                                    </div>

                                </div>
                            </td>

                            <!-- 02. FECHA -->

                            <td>
                                ${fechaBonita(
                                    actividad.fecha
                                )}
                            </td>

                            <!-- 03. TIPO -->

                            <td>
                                ${badgeTipo(
                                    actividad.tipo
                                )}
                            </td>

                            <!-- 04. RESPONSABLE -->

                            <td>
                                ${escapar(
                                    actividad.responsable ||
                                    'Sin asignar'
                                )}
                            </td>

                            <!-- 05. ESTADO -->

                            <td>
                                ${badgeEstado(
                                    estadoVisual(actividad)
                                )}
                            </td>

                            <!-- 06. ACCIONES -->

                            <td>
                                <div class="tabla-acciones">

                                    ${botonAccion(
                                        'ver',
                                        clave,
                                        'fa-eye',
                                        'Ver actividad',
                                        'btn-ver'
                                    )}

                                    ${botonAccion(
                                        'editar',
                                        clave,
                                        'fa-pen-to-square',
                                        'Editar actividad',
                                        'btn-editar'
                                    )}

                                    ${botonAccion(
                                        'completar',
                                        clave,
                                        'fa-check',
                                        'Marcar como completada',
                                        'btn-completar',
                                        finalizada
                                    )}

                                    ${botonAccion(
                                        'estado',
                                        clave,
                                        'fa-arrows-rotate',
                                        'Cambiar estado',
                                        'btn-estado'
                                    )}

                                    ${botonAccion(
                                        'eliminar',
                                        clave,
                                        'fa-trash',
                                        'Eliminar actividad',
                                        'btn-eliminar'
                                    )}

                                </div>
                            </td>

                        </tr>
                    `;
                }).join('')
            );
        }
        // ====================================================
        // CONTADOR DE RESULTADOS
        // ====================================================
        pintarContador(
            'contadorResultados',
            resultado,
            'actividades'
        );
        // ====================================================
        // PAGINACIÓN
        // ====================================================
        pintarPaginacionGeneral(
            'paginacionActividades',
            resultado.pagina,
            resultado.totalPaginas
        );
    }
    // ========================================================
    // 40. FILTROS DE ACTIVIDADES INSTITUCIONALES
    //
    // Formato FT-SST-147.
    //
    // Permite filtrar mediante:
    // - Equipo o evento.
    // - Actividad.
    // - Descripción.
    // - Frecuencia.
    // - Responsable.
    // - Mes programado.
    // - Estado de cumplimiento.
    //
    // La marca X se conserva como marca sin clasificar.
    // No se contabiliza automáticamente como realizada.
    // ========================================================
    function aplicarFiltrosInstitucionales(
        reiniciarPagina = true
    ) {
        const busqueda = normalizar(
            campo('buscarInstitucional')
        );
        const mes = campo(
            'filtroInstitucionalMes'
        );
        const filtroEstado = campo(
            'filtroInstitucionalEstado'
        );
        estado.institucionalesFiltradas = lista(
            estado.institucionales
        ).filter(actividad => {
            // ================================================
            // BÚSQUEDA GENERAL
            // ================================================
            const contenido = normalizar([
                actividad.equipo,
                actividad.actividad,
                actividad.nombre,
                actividad.descripcion,
                actividad.frecuencia,
                actividad.responsable,
                actividad.observaciones
            ].join(' '));
            if (
                busqueda &&
                !contenido.includes(busqueda)
            ) {
                return false;
            }
            // ================================================
            // FILTRO POR MES
            // ================================================
            const semanas = lista(
                actividad.semanas
            );
            if (mes && mes !== 'TODOS') {
                const tieneProgramacion = semanas.some(
                    semana =>
                        Number(semana.mes) === Number(mes) &&
                        (
                            booleano(semana.programada) ||
                            semana.marca_original === 'X'
                        )
                );
                if (!tieneProgramacion) {
                    return false;
                }
            }
            // ================================================
            // FILTRO POR ESTADO
            // ================================================
            if (
                filtroEstado &&
                filtroEstado !== 'TODOS'
            ) {
                const coincide =
                    filtroEstado === 'VENCIDA'
                        ? semanas.some(
                            semana =>
                                booleano(semana.programada) &&
                                estadoVisual(semana) === 'VENCIDA'
                        )
                        : actividad.estado === filtroEstado;
                if (!coincide) {
                    return false;
                }
            }
            return true;
        });
        // Conserva el orden institucional recibido
        // desde el backend y el documento Excel.
        if (reiniciarPagina) {
            estado.paginaInstitucional = 1;
        }
        pintarInstitucional();
    }
    // ========================================================
    // LIMPIAR FILTROS INSTITUCIONALES
    // ========================================================
    function limpiarFiltrosInstitucionales() {
        setCampo(
            'buscarInstitucional',
            ''
        );
        [
            'filtroInstitucionalMes',
            'filtroInstitucionalEstado'
        ].forEach(id => {
            const nodo = $(id);
            if (nodo) {
                nodo.selectedIndex = 0;
            }
        });
        estado.paginaInstitucional = 1;
        aplicarFiltrosInstitucionales();
    }
    // ========================================================
    // 41. RESUMEN DE MESES PROGRAMADOS
    //
    // Identifica los meses que contienen programaciones.
    // Evita mostrar meses duplicados o valores inválidos.
    //
    // Las marcas X no se consideran automáticamente
    // programaciones confirmadas.
    // ========================================================
    function pintarMesesProgramados(actividad) {
        const semanas = lista(
            actividad?.semanas
        );
        const meses = [
            ...new Set(
                semanas
                    .filter(
                        semana =>
                            booleano(semana.programada)
                    )
                    .map(
                        semana =>
                            entero(semana.mes)
                    )
                    .filter(
                        mes =>
                            mes >= 1 &&
                            mes <= 12
                    )
            )
        ].sort((a, b) => a - b);
        // No existen programaciones para la actividad.
        if (!meses.length) {
            return `
                <span class="text-muted">
                    Sin programación
                </span>
            `;
        }
        // Genera etiquetas compactas para cada mes.
        return `
            <div class="meses-programados">

                ${meses.map(mes => `
                    <span
                        class="mes-programado"
                        title="${escapar(MESES[mes - 1])}"
                    >
                        ${escapar(MESES_CORTOS[mes - 1])}
                    </span>
                `).join('')}

            </div>
        `;
    }
    // ========================================================
    // 42. RENDERIZAR TABLA INSTITUCIONAL FT-SST-147
    //
    // Estructura correspondiente al HTML:
    //
    // 01. Equipo / Evento.
    // 02. Actividad.
    // 03. Frecuencia.
    // 04. Responsable.
    // 05. Avance.
    // 06. Estado.
    // 07. Acciones.
    //
    // Se conserva una celda independiente para cada
    // encabezado del documento institucional.
    //
    // Los meses programados se muestran dentro de
    // la columna de frecuencia.
    // ========================================================
    function pintarInstitucional() {
        const resultado = paginar(
            estado.institucionalesFiltradas,
            estado.paginaInstitucional,
            estado.porPagina
        );
        estado.paginaInstitucional =
            resultado.pagina;
        // ====================================================
        // TABLA INSTITUCIONAL SIN REGISTROS
        // ====================================================
        if (!resultado.total) {
            tablaVacia(
                'tablaInstitucionalBody',
                'No hay actividades institucionales para este periodo o los filtros seleccionados.',
                'fa-file-excel'
            );
        } else {
            // ================================================
            // GENERACIÓN DE FILAS INSTITUCIONALES
            // ================================================
            html(
                'tablaInstitucionalBody',
                resultado.registros.map(actividad => {
                    // Identificador de actividad institucional.
                    const clave = claveActividad(
                        actividad
                    );
                    // ========================================
                    // INDICADORES INDIVIDUALES
                    // ========================================
                    const programadas = Math.max(
                        0,
                        entero(
                            actividad.totalProgramadas
                        )
                    );
                    const completadas = Math.max(
                        0,
                        entero(
                            actividad.totalCompletadas
                        )
                    );
                    const avance = porcentaje(
                        completadas,
                        programadas
                    );
                    // ========================================
                    // IDENTIDAD DE LA ACTIVIDAD
                    // ========================================
                    const equipo =
                        actividad.equipo ||
                        actividad.nombre ||
                        'Sin equipo definido';
                    const nombreActividad =
                        actividad.actividad ||
                        actividad.descripcion ||
                        actividad.nombre ||
                        'Actividad sin descripción';
                    const descripcion =
                        actividad.descripcion &&
                        actividad.descripcion !== nombreActividad
                            ? actividad.descripcion
                            : '';
                    // ========================================
                    // GENERACIÓN DE LA FILA
                    // ========================================
                    return `
                        <tr>

                            <!-- 01. EQUIPO / EVENTO -->

                            <td>
                                <div class="actividad-nombre">

                                    <strong>
                                        ${escapar(equipo)}
                                    </strong>

                                </div>
                            </td>

                            <!-- 02. ACTIVIDAD -->

                            <td>
                                <div class="actividad-nombre">

                                    <strong>
                                        ${escapar(nombreActividad)}
                                    </strong>

                                    ${descripcion ? `
                                        <small>
                                            ${escapar(descripcion)}
                                        </small>
                                    ` : ''}

                                </div>
                            </td>

                            <!-- 03. FRECUENCIA -->

                            <td>
                                <div class="institucional-frecuencia">

                                    <span>
                                        ${escapar(
                                            actividad.frecuencia ||
                                            'Sin definir'
                                        )}
                                    </span>

                                    ${pintarMesesProgramados(
                                        actividad
                                    )}

                                </div>
                            </td>

                            <!-- 04. RESPONSABLE -->

                            <td>
                                ${escapar(
                                    actividad.responsable ||
                                    'Sin asignar'
                                )}
                            </td>

                            <!-- 05. AVANCE -->

                            <td>
                                <div class="seguimiento-tabla">

                                    <strong>
                                        ${numeroTexto(completadas)}
                                        /
                                        ${numeroTexto(programadas)}
                                    </strong>

                                    <div
                                        class="progress"
                                        role="progressbar"
                                        aria-label="Cumplimiento de la actividad"
                                        aria-valuemin="0"
                                        aria-valuemax="100"
                                        aria-valuenow="${avance}"
                                    >

                                        <div
                                            class="progress-bar"
                                            style="width:${avance}%"
                                        ></div>

                                    </div>

                                    <small>
                                        ${porcentajeTexto(avance)}
                                    </small>

                                </div>
                            </td>

                            <!-- 06. ESTADO -->

                            <td>
                                ${badgeEstado(
                                    actividad.estado
                                )}
                            </td>

                            <!-- 07. ACCIONES -->

                            <td>
                                <div class="tabla-acciones">

                                    ${botonAccion(
                                        'ver',
                                        clave,
                                        'fa-eye',
                                        'Ver actividad institucional',
                                        'btn-ver'
                                    )}

                                    ${botonAccion(
                                        'editar',
                                        clave,
                                        'fa-pen-to-square',
                                        'Editar actividad institucional',
                                        'btn-editar',
                                        cronogramaCerrado()
                                    )}

                                    ${botonAccion(
                                        'seguimiento',
                                        clave,
                                        'fa-list-check',
                                        'Seguimiento semanal',
                                        'btn-seguimiento'
                                    )}

                                </div>
                            </td>

                        </tr>
                    `;
                }).join('')
            );
        }
        // ====================================================
        // CONTADOR DE ACTIVIDADES INSTITUCIONALES
        // ====================================================
        pintarContador(
            'contadorInstitucional',
            resultado,
            'actividades institucionales'
        );
        // ====================================================
        // PAGINACIÓN INSTITUCIONAL
        // ====================================================
        pintarPaginacionGeneral(
            'paginacionInstitucional',
            resultado.pagina,
            resultado.totalPaginas
        );
    }
    // ========================================================
    // 43. CONSULTAR UNA ACTIVIDAD MANUAL
    // ========================================================
    async function obtenerActividadManual(id) {
        const datos = await peticion(
            RUTAS.actividad(validarId(id))
        );
        return normalizarActividadManual(
            datos.actividad ||
            datos.registro ||
            datos
        );
    }
    // ========================================================
    // 44. ABRIR FORMULARIO DE NUEVA ACTIVIDAD
    // ========================================================
    function nuevaActividad(fecha = null) {
        limpiarFormulario('formActividad');
        limpiarErrorFormulario('errorActividad');
        estado.actividadSeleccionada = null;
        texto(
            'modalActividadTitulo',
            'Nueva actividad'
        );
        setCampo('actividadId', '');
        // Utiliza la fecha seleccionada en el calendario.
        const fechaSugerida = fechaISO(
            fecha || estado.fechaSeleccionada
        );
        setCampo(
            'fechaActividad',
            fechaSugerida ||
            fechaLocal(estado.anio, 1, 1)
        );
        // Valores iniciales del formulario.
        setCampo('tipoActividad', 'OTRO');
        setCampo('prioridadActividad', 'MEDIA');
        setCampo('estadoActividad', 'PENDIENTE');
        abrirModal('modalActividad');
    }
    // ========================================================
    // 45. EDITAR ACTIVIDAD MANUAL
    //
    // Consulta la información actualizada desde MySQL
    // antes de cargar los datos en el formulario.
    // ========================================================
    async function editarActividadManual(id) {
        const actividad = await obtenerActividadManual(id);
        estado.actividadSeleccionada = actividad;
        limpiarFormulario('formActividad');
        limpiarErrorFormulario('errorActividad');
        texto(
            'modalActividadTitulo',
            'Editar actividad'
        );
        // Identificador del registro.
        setCampo('actividadId', actividad.id);
        // Información principal.
        setCampo('nombreActividad', actividad.nombre);
        setCampo('fechaActividad', actividad.fecha);
        setCampo('tipoActividad', actividad.tipo);
        // Responsable de la actividad.
        setCampo(
            'responsableActividad',
            actividad.responsable
        );
        // Estado y prioridad.
        setCampo('estadoActividad', actividad.estado);
        setCampo('prioridadActividad', actividad.prioridad);
        // Compatibilidad con los campos de preparación.
        setCampo(
            'fechaPreparacion',
            actividad.fecha_preparacion
        );
        setCampo(
            'fechaPreparacionActividad',
            actividad.fecha_preparacion
        );
        // Información complementaria.
        setCampo(
            'descripcionActividad',
            actividad.descripcion
        );
        setCampo(
            'observacionesActividad',
            actividad.observaciones
        );
        abrirModal('modalActividad');
    }
    // ========================================================
    // 46. VALIDAR FORMULARIO DE ACTIVIDAD
    //
    // Comprueba los datos antes de enviarlos al backend.
    //
    // Las validaciones del frontend complementan las
    // validaciones obligatorias del servidor.
    // ========================================================
    function obtenerDatosActividad() {
        const datos = {
            nombre: campo('nombreActividad'),
            fecha: campo('fechaActividad'),
            tipo: campo('tipoActividad'),
            responsable: valorNullable(
                campo('responsableActividad')
            ),
            estado: campo('estadoActividad'),
            prioridad: normalizarPrioridad(
                campo('prioridadActividad')
            ),
            fecha_preparacion: valorNullable(
                campo('fechaPreparacionActividad') ||
                campo('fechaPreparacion')
            ),
            descripcion: valorNullable(
                campo('descripcionActividad')
            ),
            observaciones: valorNullable(
                campo('observacionesActividad')
            )
        };
        // ====================================================
        // VALIDAR NOMBRE
        // ====================================================
        if (!datos.nombre || datos.nombre.length > 180) {
            throw new Error(
                'Ingresa un nombre válido de máximo 180 caracteres.'
            );
        }
        // ====================================================
        // VALIDAR FECHA PRINCIPAL
        // ====================================================
        if (!fechaValida(datos.fecha)) {
            throw new Error(
                'Selecciona una fecha válida.'
            );
        }
        // ====================================================
        // VALIDAR PERIODO INSTITUCIONAL
        //
        // Impide registrar una actividad en un año diferente
        // al periodo actualmente seleccionado.
        // ====================================================
        if (
            Number(datos.fecha.substring(0, 4)) !==
            estado.anio
        ) {
            throw new Error(
                'La fecha debe pertenecer al año seleccionado.'
            );
        }
        // ====================================================
        // VALIDAR TIPO DE ACTIVIDAD
        // ====================================================
        if (!TIPOS_MANUALES.includes(datos.tipo)) {
            throw new Error(
                'Selecciona un tipo de actividad válido.'
            );
        }
        // ====================================================
        // VALIDAR ESTADO
        // ====================================================
        if (!ESTADOS_EDITABLES.includes(datos.estado)) {
            throw new Error(
                'Selecciona un estado válido.'
            );
        }
        // ====================================================
        // VALIDAR FECHA DE PREPARACIÓN
        //
        // La preparación puede realizarse antes o durante
        // la fecha de la actividad, pero nunca después.
        // ====================================================
        if (
            datos.fecha_preparacion &&
            (
                !fechaValida(datos.fecha_preparacion) ||
                datos.fecha_preparacion > datos.fecha
            )
        ) {
            throw new Error(
                'La preparación no puede ser posterior a la actividad.'
            );
        }
        return datos;
    }
    // ========================================================
    // 47. GUARDAR ACTIVIDAD MANUAL
    //
    // POST: creación de una actividad.
    // PUT: actualización de una actividad existente.
    //
    // Evita solicitudes duplicadas desde el formulario
    // mientras se encuentra una operación en ejecución.
    // ========================================================
    async function guardarActividad(evento) {
        evento?.preventDefault();
        // Evita guardar varias veces el mismo formulario.
        if (estado.guardando) return;
        limpiarErrorFormulario('errorActividad');
        try {
            // Valida la información del formulario.
            const datos = obtenerDatosActividad();
            // Si existe un ID, corresponde a una edición.
            const id = campo('actividadId');
            estado.guardando = true;
            botonCargando(
                'btnGuardarActividad',
                true,
                'Guardando...'
            );
            // Selecciona la ruta y el método HTTP.
            const respuesta = await peticion(
                id
                    ? RUTAS.actividad(validarId(id))
                    : RUTAS.actividades,
                {
                    method: id ? 'PUT' : 'POST',
                    body: datos
                }
            );
            // Cierra el formulario después de guardar.
            cerrarModal('modalActividad');
            // Presenta el mensaje entregado por el servidor.
            notificar(
                mensajeRespuesta(
                    respuesta,
                    id
                        ? 'Actividad actualizada correctamente.'
                        : 'Actividad registrada correctamente.'
                )
            );
            // Actualiza los componentes relacionados
            // con la gestión de actividades.
            await actualizarGestionActividades();
        } catch (error) {
            // Conserva el mensaje dentro del formulario.
            mostrarErrorFormulario(
                'errorActividad',
                error.message
            );
            // Registra y presenta el error correspondiente.
            manejarError(error);
        } finally {
            // Restablece el estado de la operación.
            estado.guardando = false;
            botonCargando(
                'btnGuardarActividad',
                false
            );
        }
    }
    // ========================================================
    // 48. CONFIRMAR ELIMINACIÓN DE ACTIVIDAD
    //
    // Solicita confirmación antes de enviar una operación
    // de eliminación al servidor.
    // ========================================================
    function confirmarEliminarActividad(id) {
        const actividad = buscarActividad(
            `MANUAL:${id}`
        );
        // Comprueba que el registro se encuentre disponible.
        if (!actividad) {
            throw new Error(
                'No se encontró la actividad seleccionada.'
            );
        }
        // Conserva el identificador de la actividad.
        setCampo(
            'actividadEliminarId',
            actividad.id
        );
        // Presenta el nombre del registro seleccionado.
        texto(
            'nombreActividadEliminar',
            actividad.nombre
        );
        abrirModal('modalEliminarActividad');
    }
    // ========================================================
    // 49. ELIMINAR ACTIVIDAD MANUAL
    //
    // Utiliza el método DELETE de la API.
    //
    // La autorización, integridad referencial y auditoría
    // deben ser controladas por el backend.
    // ========================================================
    async function eliminarActividad() {
        // Comprueba el identificador antes de consultar.
        const id = validarId(
            campo('actividadEliminarId')
        );
        return ejecutarOperacion(
            'eliminar-actividad',
            async () => {
                // Solicita la eliminación al servidor.
                const respuesta = await peticion(
                    RUTAS.actividad(id),
                    {
                        method: 'DELETE'
                    }
                );
                // Cierra la ventana de confirmación.
                cerrarModal('modalEliminarActividad');
                // Presenta el resultado de la operación.
                notificar(
                    mensajeRespuesta(
                        respuesta,
                        'Actividad eliminada correctamente.'
                    )
                );
                // Actualiza la información relacionada.
                await actualizarGestionActividades();
            }
        );
    }
    // ========================================================
    // 50. CONSULTAR ACTIVIDAD INSTITUCIONAL
    //
    // Consulta la actividad principal y sus programaciones.
    // Mantiene separados los identificadores de actividades
    // institucionales y registros semanales.
    // ========================================================
    async function obtenerActividadInstitucional(id) {
        const datos = await peticion(
            RUTAS.actividadInstitucional(
                validarId(id)
            )
        );
        const actividad = normalizarActividadInstitucional(
            datos.actividad ||
            datos.registro ||
            datos
        );
        // Consulta las programaciones por separado cuando
        // el backend no las incluye en la respuesta principal.
        if (
            !Array.isArray(datos.actividad?.semanas) &&
            !Array.isArray(datos.semanas) &&
            !actividad.semanas.length
        ) {
            const respuestaSemanas = await peticion(
                RUTAS.semanasInstitucionales(id)
            );
            return normalizarActividadInstitucional({
                ...actividad,
                semanas: extraerLista(
                    respuestaSemanas,
                    'semanas',
                    'programaciones'
                )
            });
        }
        // Compatibilidad con respuestas que entregan
        // las programaciones en una propiedad independiente.
        if (Array.isArray(datos.semanas)) {
            return normalizarActividadInstitucional({
                ...actividad,
                semanas: datos.semanas
            });
        }
        return actividad;
    }
    // ========================================================
    // 51. EDITAR ACTIVIDAD INSTITUCIONAL
    //
    // Consulta los datos actuales del registro antes
    // de abrir el formulario de edición.
    //
    // Los cronogramas cerrados no pueden modificarse.
    // ========================================================
    async function editarActividadInstitucional(id) {
        if (cronogramaCerrado()) {
            throw new Error(
                'El cronograma seleccionado se encuentra cerrado.'
            );
        }
        const actividad =
            await obtenerActividadInstitucional(id);
        // Conserva la actividad seleccionada.
        estado.institucionalSeleccionada = actividad;
        // Restablece el formulario.
        limpiarFormulario(
            'formActividadInstitucional'
        );
        limpiarErrorFormulario(
            'errorInstitucional'
        );
        // Actualiza el encabezado de la ventana.
        texto(
            'modalInstitucionalTitulo',
            'Editar actividad institucional'
        );
        texto(
            'institucionalAnioEdicion',
            estado.anio
        );
        // ====================================================
        // IDENTIFICACIÓN DEL REGISTRO
        // ====================================================
        setCampo(
            'institucionalId',
            actividad.id
        );
        // ====================================================
        // INFORMACIÓN DEL FORMATO FT-SST-147
        // ====================================================
        setCampo(
            'institucionalEquipo',
            actividad.equipo
        );
        setCampo(
            'institucionalActividad',
            actividad.actividad
        );
        setCampo(
            'institucionalFrecuencia',
            actividad.frecuencia
        );
        setCampo(
            'institucionalResponsable',
            actividad.responsable
        );
        // ====================================================
        // CLASIFICACIÓN DE LA ACTIVIDAD
        // ====================================================
        setCampo(
            'institucionalTipo',
            actividad.tipo
        );
        setCampo(
            'institucionalPrioridad',
            actividad.prioridad
        );
        // ====================================================
        // FECHA Y ESTADO
        // ====================================================
        setCampo(
            'institucionalFechaExacta',
            actividad.fecha_exacta
        );
        setCampo(
            'institucionalEstado',
            actividad.estado
        );
        // ====================================================
        // INFORMACIÓN COMPLEMENTARIA
        // ====================================================
        setCampo(
            'institucionalDescripcion',
            actividad.descripcion
        );
        setCampo(
            'institucionalObservaciones',
            actividad.observaciones
        );
        // Limita la edición al año activo y permite recuperar la fecha sugerida.
        atributo('institucionalFechaExacta', 'min', `${estado.anio}-01-01`);
        atributo('institucionalFechaExacta', 'max', `${estado.anio}-12-31`);
        const sugerida = estado.institucionales.find(item => item.id === actividad.id)?.fechaSugerida;
        const botonFecha = $('btnRestablecerFechaInstitucional');
        if (botonFecha) {
            botonFecha.disabled = !fechaISO(sugerida);
            botonFecha.onclick = () => setCampo('institucionalFechaExacta', fechaISO(sugerida));
        }
        // Abre el formulario institucional.
        abrirModal(
            'modalActividadInstitucional'
        );
    }
    // ========================================================
    // 52. GUARDAR ACTIVIDAD INSTITUCIONAL
    //
    // Actualiza los registros institucionales mediante PUT.
    //
    // Conserva la estructura del formato FT-SST-147,
    // los responsables, las fechas y las observaciones.
    // ========================================================
    async function guardarActividadInstitucional(evento) {
        evento?.preventDefault();
        // Evita solicitudes duplicadas.
        if (estado.guardando) return;
        // Impide modificar documentos cerrados.
        if (cronogramaCerrado()) {
            throw new Error(
                'No se puede modificar un cronograma cerrado.'
            );
        }
        // Valida el identificador institucional.
        const id = validarId(
            campo('institucionalId')
        );
        // ====================================================
        // OBTENER INFORMACIÓN DEL FORMULARIO
        // ====================================================
        const datos = {
            equipo: valorNullable(
                campo('institucionalEquipo')
            ),
            actividad: campo(
                'institucionalActividad'
            ),
            descripcion: valorNullable(
                campo('institucionalDescripcion')
            ),
            frecuencia: valorNullable(
                campo('institucionalFrecuencia')
            ),
            responsable: valorNullable(
                campo('institucionalResponsable')
            ),
            tipo: campo(
                'institucionalTipo'
            ),
            prioridad: normalizarPrioridad(
                campo('institucionalPrioridad')
            ),
            fecha_exacta: valorNullable(
                campo('institucionalFechaExacta')
            ),
            notas: valorNullable(
                campo('institucionalObservaciones')
            )
        };
        // ====================================================
        // VALIDAR ACTIVIDAD
        // ====================================================
        if (!datos.actividad) {
            throw new Error(
                'La descripción de la actividad es obligatoria.'
            );
        }
        // ====================================================
        // VALIDAR TIPO INSTITUCIONAL
        // ====================================================
        if (!TIPOS_INSTITUCIONALES.includes(datos.tipo)) {
            throw new Error(
                'El tipo de actividad institucional no es válido.'
            );
        }
        // ====================================================
        // VALIDAR FECHA EXACTA
        //
        // La fecha exacta es opcional.
        // Si se registra, debe pertenecer al año seleccionado.
        //
        // No se asignan fechas artificiales a las actividades
        // que solamente tienen una programación semanal.
        // ====================================================
        if (
            datos.fecha_exacta &&
            (
                !fechaValida(datos.fecha_exacta) ||
                Number(datos.fecha_exacta.substring(0, 4)) !==
                    estado.anio
            )
        ) {
            throw new Error(
                'La fecha exacta debe pertenecer al año seleccionado.'
            );
        }
        // ====================================================
        // BLOQUEAR FORMULARIO DURANTE EL GUARDADO
        // ====================================================
        estado.guardando = true;
        botonCargando(
            'btnGuardarInstitucional',
            true,
            'Guardando...'
        );
        try {
            // Actualiza la actividad en el backend.
            const respuesta = await peticion(
                RUTAS.actividadInstitucional(id),
                {
                    method: 'PUT',
                    body: datos
                }
            );
            // Cierra el formulario después de guardar.
            cerrarModal(
                'modalActividadInstitucional'
            );
            // Presenta la confirmación del servidor.
            notificar(
                mensajeRespuesta(
                    respuesta,
                    'Actividad institucional actualizada.'
                )
            );
            // Actualiza las tablas, calendario e indicadores
            // relacionados con la gestión de actividades.
            await actualizarGestionActividades();
        } finally {
            // Restablece los controles incluso si
            // la operación genera un error.
            estado.guardando = false;
            botonCargando(
                'btnGuardarInstitucional',
                false
            );
        }
    }
    // ========================================================
    // 53. ABRIR SEGUIMIENTO SEMANAL
    //
    // Presenta las programaciones correspondientes a una
    // actividad institucional y sus indicadores individuales.
    //
    // Incluye:
    // - Programaciones registradas.
    // - Programaciones completadas.
    // - Programaciones pendientes.
    // - Programaciones canceladas.
    // - Porcentaje de cumplimiento.
    // ========================================================
    async function abrirSeguimientoSemanal(id) {
        const actividad =
            await obtenerActividadInstitucional(id);
        // Conserva la actividad y sus programaciones.
        estado.institucionalSeleccionada = actividad;
        estado.semanasSeleccionadas =
            actividad.semanas;
        // ====================================================
        // IDENTIFICACIÓN DE LA ACTIVIDAD
        // ====================================================
        setCampo(
            'seguimientoActividadId',
            actividad.id
        );
        texto(
            'seguimientoActividadNombre',
            actividad.nombre
        );
        texto(
            'seguimientoActividadResponsable',
            actividad.responsable || 'Sin asignar'
        );
        // Estado general de la actividad.
        html(
            'seguimientoActividadEstado',
            badgeEstado(actividad.estado)
        );
        // ====================================================
        // INDICADORES DE SEGUIMIENTO SEMANAL
        // ====================================================
        texto(
            'semanasProgramadas',
            actividad.totalProgramadas
        );
        texto(
            'semanasCompletadas',
            actividad.totalCompletadas
        );
        texto(
            'semanasPendientes',
            actividad.totalPendientes
        );
        texto(
            'semanasCanceladas',
            actividad.totalCanceladas
        );
        // ====================================================
        // PORCENTAJE DE CUMPLIMIENTO
        // ====================================================
        texto(
            'porcentajeSeguimientoSemanal',
            porcentajeTexto(actividad.porcentaje)
        );
        actualizarProgreso(
            'progresoSeguimientoSemanal',
            'barraSeguimientoSemanal',
            actividad.porcentaje
        );
        // ====================================================
        // CONTROL DE CRONOGRAMAS CERRADOS
        // ====================================================
        visible(
            'alertaSeguimientoCerrado',
            cronogramaCerrado()
        );
        deshabilitar(
            'btnNuevaProgramacion',
            cronogramaCerrado()
        );
        // Genera la tabla de seguimiento.
        pintarSeguimientoSemanal();
        // Abre la ventana correspondiente.
        abrirModal(
            'modalSeguimientoSemanal'
        );
    }
    // ========================================================
    // 54. RENDERIZAR SEGUIMIENTO SEMANAL
    //
    // Presenta las programaciones registradas para cada
    // actividad del documento institucional FT-SST-147.
    //
    // Conserva las marcas originales del Excel y diferencia
    // las fechas programadas de las fechas de realización.
    // ========================================================
    function pintarSeguimientoSemanal() {
        const actividad =
            estado.institucionalSeleccionada;
        if (!actividad) return;
        // ====================================================
        // OBTENER FILTROS
        // ====================================================
        const mes = campo(
            'filtroSeguimientoMes'
        );
        const filtroEstado = campo(
            'filtroSeguimientoEstado'
        );
        // ====================================================
        // FILTRAR PROGRAMACIONES
        // ====================================================
        const semanas = actividad.semanas
            .filter(semana => {
                // Filtra por mes.
                if (
                    mes &&
                    mes !== 'TODOS' &&
                    semana.mes !== Number(mes)
                ) {
                    return false;
                }
                // Filtra por estado.
                if (
                    filtroEstado &&
                    filtroEstado !== 'TODOS' &&
                    semana.estado !== filtroEstado
                ) {
                    return false;
                }
                return true;
            })
            // Orden cronológico por mes y semana.
            .sort(
                (a, b) =>
                    a.mes - b.mes ||
                    a.semana_mes - b.semana_mes
            );
        // ====================================================
        // CONTADOR DE PROGRAMACIONES
        // ====================================================
        texto(
            'contadorSeguimientoSemanal',
            `${semanas.length} programaciones`
        );
        // ====================================================
        // TABLA SIN REGISTROS
        // ====================================================
        if (!semanas.length) {
            tablaVacia(
                'tablaSeguimientoSemanal',
                'No hay programaciones semanales registradas.'
            );
            return;
        }
        // ====================================================
        // GENERACIÓN DE LA TABLA SEMANAL
        //
        // Columnas:
        // 01. Mes.
        // 02. Semana.
        // 03. Marca original.
        // 04. Fecha programada.
        // 05. Fecha de realización.
        // 06. Estado.
        // 07. Acciones.
        // ====================================================
        html(
            'tablaSeguimientoSemanal',
            semanas.map(semana => {
                // Referencia compuesta:
                // FT147:actividad_id:semana_id
                const clave =
                    `FT147:${actividad.id}:${semana.id}`;
                // Controla las acciones de edición
                // cuando el documento está cerrado.
                const bloqueada = cronogramaCerrado();
                return `
                    <tr>

                        <!-- 01. MES -->

                        <td>
                            ${escapar(
                                MESES[semana.mes - 1]
                            )}
                        </td>

                        <!-- 02. SEMANA -->

                        <td>
                            Semana ${semana.semana_mes}
                        </td>

                        <!-- 03. MARCA ORIGINAL DEL EXCEL -->

                        <td>
                            <span class="convencion-marca
                                ${clase(semana.marca_original)}">

                                ${escapar(
                                    semana.marca_original || '—'
                                )}

                            </span>
                        </td>

                        <!-- 04. FECHA PROGRAMADA -->

                        <td>
                            ${fechaBonita(
                                semana.fecha_programada
                            )}
                        </td>

                        <!-- 05. FECHA DE REALIZACIÓN -->

                        <td>
                            ${fechaBonita(
                                semana.fecha_realizacion,
                                'Sin realizar'
                            )}
                        </td>

                        <!-- 06. ESTADO -->

                        <td>
                            ${
                                semana.programada
                                    ? badgeEstado(
                                        estadoVisual(semana)
                                    )
                                    : '<span class="text-muted">No programada</span>'
                            }
                        </td>

                        <!-- 07. ACCIONES -->

                        <td>
                            <div class="tabla-acciones">

                                <!-- COMPLETAR PROGRAMACIÓN -->

                                ${botonAccion(
                                    'completar-semana',
                                    clave,
                                    'fa-check',
                                    'Completar programación',
                                    'btn-completar',
                                    bloqueada ||
                                    !semana.programada ||
                                    [
                                        'COMPLETADA',
                                        'CANCELADA'
                                    ].includes(semana.estado)
                                )}

                                <!-- CAMBIAR ESTADO -->

                                ${botonAccion(
                                    'estado-semana',
                                    clave,
                                    'fa-arrows-rotate',
                                    'Cambiar estado',
                                    'btn-estado',
                                    bloqueada ||
                                    !semana.programada
                                )}

                                <!-- EDITAR PROGRAMACIÓN -->

                                ${botonAccion(
                                    'editar-programacion',
                                    clave,
                                    'fa-calendar-pen',
                                    'Editar programación',
                                    'btn-editar',
                                    bloqueada
                                )}

                            </div>
                        </td>

                    </tr>
                `;
            }).join('')
        );
    }
    // ========================================================
    // 55. ABRIR CAMBIO DE ESTADO
    //
    // Diferencia actividades manuales e institucionales.
    // Los cumpleaños provenientes de Recursos Humanos
    // no admiten cambios de estado manuales.
    // ========================================================
    async function abrirCambioEstado(
        clave,
        nuevoEstado = null
    ) {
        const referencia = interpretarClave(clave);
        if (!referencia) {
            throw new Error(
                'La actividad seleccionada no es válida.'
            );
        }
        let actividad;
        let semana = null;
        // ====================================================
        // ACTIVIDADES MANUALES
        // ====================================================
        if (referencia.origen === 'MANUAL') {
            actividad = await obtenerActividadManual(
                referencia.id
            );
        // ====================================================
        // ACTIVIDADES INSTITUCIONALES FT-SST-147
        // ====================================================
        } else if (referencia.origen === 'FT147') {
            if (cronogramaCerrado()) {
                throw new Error(
                    'El cronograma institucional está cerrado.'
                );
            }
            actividad = await obtenerActividadInstitucional(
                referencia.id
            );
            // Compara identificadores normalizados para evitar
            // incompatibilidades entre números y cadenas.
            semana = buscarSemanaInstitucional(
                actividad,
                referencia.semanaId
            );
            if (!semana || !semana.programada) {
                throw new Error(
                    'Selecciona una programación semanal activa.'
                );
            }
        } else {
            throw new Error(
                'Este registro no admite cambios de estado manuales.'
            );
        }
        // ====================================================
        // PREPARAR FORMULARIO
        // ====================================================
        limpiarFormulario('formCambiarEstado');
        estado.actividadSeleccionada = actividad;
        estado.semanaSeleccionada = semana;
        // Identificador de la actividad principal.
        setCampo(
            'estadoActividadId',
            actividad.id
        );
        // Origen de la actividad.
        setCampo(
            'estadoActividadOrigen',
            referencia.origen
        );
        // Identificador independiente de la semana.
        setCampo(
            'estadoSemanaId',
            semana?.id || ''
        );
        // Nombre de la actividad seleccionada.
        texto(
            'estadoActividadNombre',
            actividad.nombre
        );
        // Estado inicial del formulario.
        setCampo(
            'nuevoEstadoActividad',
            nuevoEstado ||
            semana?.estado ||
            actividad.estado
        );
        // Fecha de realización.
        setCampo(
            'fechaRealizacionEstado',
            semana?.fecha_realizacion || hoy()
        );
        // Observaciones del seguimiento semanal.
        setCampo(
            'observacionesEstado',
            semana?.observaciones || ''
        );
        // Actualiza los campos condicionales.
        actualizarCamposCambioEstado();
        // ====================================================
        // GESTIÓN DE VENTANAS MODALES
        //
        // Evita superponer ventanas y fondos de Bootstrap.
        // ====================================================
        if (
            $('modalSeguimientoSemanal')
                ?.classList.contains('show')
        ) {
            cambiarModal(
                'modalSeguimientoSemanal',
                'modalCambiarEstado'
            );
        } else if (
            $('modalDetalleEvento')
                ?.classList.contains('show')
        ) {
            cambiarModal(
                'modalDetalleEvento',
                'modalCambiarEstado'
            );
        } else {
            abrirModal('modalCambiarEstado');
        }
    }
    // ========================================================
    // 56. CAMPOS CONDICIONALES DE CAMBIO DE ESTADO
    //
    // Muestra únicamente los campos correspondientes
    // al origen y estado seleccionado.
    // ========================================================
    function actualizarCamposCambioEstado() {
        const nuevoEstado = campo(
            'nuevoEstadoActividad'
        );
        const institucional =
            campo('estadoActividadOrigen') === 'FT147';
        const completada =
            nuevoEstado === 'COMPLETADA';
        const cancelada =
            nuevoEstado === 'CANCELADA';
        // ====================================================
        // FECHA DE REALIZACIÓN
        //
        // Se solicita cuando una programación institucional
        // se marca como completada.
        // ====================================================
        mostrarCampoCondicional(
            'grupoFechaRealizacion',
            ['fechaRealizacionEstado'],
            institucional && completada
        );
        // ====================================================
        // OBSERVACIONES
        //
        // Se encuentran disponibles para el seguimiento
        // de actividades institucionales.
        // ====================================================
        mostrarCampoCondicional(
            'grupoObservacionesEstado',
            ['observacionesEstado'],
            institucional
        );
        // ====================================================
        // AVISOS SEGÚN EL ESTADO SELECCIONADO
        // ====================================================
        visible(
            'avisoCompletarActividad',
            completada
        );
        visible(
            'avisoCancelarActividad',
            cancelada
        );
    }
    // ========================================================
    // 57. GUARDAR CAMBIO DE ESTADO
    //
    // Utiliza PATCH para actualizar únicamente el estado
    // y los campos correspondientes al seguimiento.
    //
    // No modifica los demás datos de la actividad.
    // ========================================================
    async function guardarCambioEstado(evento) {
        evento?.preventDefault();
        // Evita solicitudes duplicadas.
        if (estado.guardando) return;
        // ====================================================
        // IDENTIFICACIÓN DE LA ACTIVIDAD
        // ====================================================
        const id = validarId(
            campo('estadoActividadId')
        );
        const origen = campo(
            'estadoActividadOrigen'
        );
        const nuevoEstado = campo(
            'nuevoEstadoActividad'
        );
        // Valida los estados permitidos por el módulo.
        if (!ESTADOS_EDITABLES.includes(nuevoEstado)) {
            throw new Error(
                'Selecciona un estado válido.'
            );
        }
        let ruta;
        const datos = {
            estado: nuevoEstado
        };
        // ====================================================
        // CAMBIO DE ESTADO DE ACTIVIDAD MANUAL
        // ====================================================
        if (origen === 'MANUAL') {
            ruta = RUTAS.estadoActividad(id);
        // ====================================================
        // CAMBIO DE ESTADO DE PROGRAMACIÓN INSTITUCIONAL
        // ====================================================
        } else if (origen === 'FT147') {
            if (cronogramaCerrado()) {
                throw new Error(
                    'El cronograma se encuentra cerrado.'
                );
            }
            // Valida el identificador semanal por separado.
            const semanaId = validarId(
                campo('estadoSemanaId')
            );
            ruta = RUTAS.semanaInstitucional(
                id,
                semanaId
            );
            // Observaciones del seguimiento.
            datos.observaciones = valorNullable(
                campo('observacionesEstado')
            );
            // ================================================
            // VALIDAR FECHA DE REALIZACIÓN
            //
            // No permite registrar una actividad como
            // realizada en una fecha futura.
            // ================================================
            if (nuevoEstado === 'COMPLETADA') {
                const fecha = campo(
                    'fechaRealizacionEstado'
                );
                if (
                    !fechaValida(fecha) ||
                    fecha > hoy()
                ) {
                    throw new Error(
                        'Selecciona una fecha de realización válida y no futura.'
                    );
                }
                // Conserva el nombre del parámetro
                // esperado por el backend.
                datos.fechaRealizacion = fecha;
            }
        } else {
            throw new Error(
                'El origen de la actividad no es válido.'
            );
        }
        // ====================================================
        // BLOQUEAR OPERACIÓN
        // ====================================================
        estado.guardando = true;
        botonCargando(
            'btnConfirmarCambioEstado',
            true,
            'Actualizando...'
        );
        try {
            // Actualiza el estado mediante PATCH.
            const respuesta = await peticion(
                ruta,
                {
                    method: 'PATCH',
                    body: datos
                }
            );
            // Cierra la ventana después de guardar.
            cerrarModal('modalCambiarEstado');
            // Presenta el mensaje del servidor.
            notificar(
                mensajeRespuesta(
                    respuesta,
                    'Estado actualizado correctamente.'
                )
            );
            // Actualiza los componentes relacionados.
            await actualizarGestionActividades();
        } finally {
            // Restablece los controles incluso cuando
            // la solicitud genera un error.
            estado.guardando = false;
            botonCargando(
                'btnConfirmarCambioEstado',
                false
            );
        }
    }
    // ========================================================
    // 58. CONFIGURAR SEMANAS SEGÚN EL MES
    //
    // Utiliza SEMANAS_POR_MES definido en la parte 01.
    //
    // Conserva la distribución institucional del Excel,
    // sin sustituirla por semanas ISO del calendario.
    // ========================================================
    function configurarSemanasProgramacion(
        semanaSeleccionada = null
    ) {
        const selector = $('programacionSemana');
        if (!selector) return;
        const mes = entero(
            campo('programacionMes')
        );
        // Elimina las opciones anteriores.
        selector.replaceChildren();
        // ====================================================
        // OPCIÓN INICIAL
        // ====================================================
        const opcionInicial =
            document.createElement('option');
        opcionInicial.value = '';
        opcionInicial.textContent =
            'Selecciona una semana';
        selector.appendChild(opcionInicial);
        // ====================================================
        // CANTIDAD DE SEMANAS INSTITUCIONALES
        // ====================================================
        const cantidad =
            SEMANAS_POR_MES[mes] || 0;
        // Genera las semanas correspondientes al mes.
        for (
            let semana = 1;
            semana <= cantidad;
            semana++
        ) {
            const opcion =
                document.createElement('option');
            opcion.value = String(semana);
            opcion.textContent =
                `Semana ${semana}`;
            selector.appendChild(opcion);
        }
        // Deshabilita el selector si no existe un mes válido.
        selector.disabled = cantidad === 0;
        // Recupera la semana seleccionada durante una edición.
        if (semanaSeleccionada) {
            const semana = entero(
                semanaSeleccionada
            );
            if (semana >= 1 && semana <= cantidad) {
                selector.value = String(semana);
            }
        }
    }
    // ========================================================
    // 59. ABRIR PROGRAMACIÓN SEMANAL
    //
    // Permite crear o editar una programación dentro
    // de una actividad institucional existente.
    //
    // No modifica la identidad de una programación
    // semanal que ya se encuentra registrada.
    // ========================================================
    function abrirProgramacionSemanal(
        actividadId,
        semanaId = null
    ) {
        // ====================================================
        // VALIDAR ESTADO DEL CRONOGRAMA
        // ====================================================
        if (cronogramaCerrado()) {
            throw new Error(
                'No se puede editar un cronograma cerrado.'
            );
        }
        const id = validarId(actividadId);
        const actividad =
            estado.institucionalSeleccionada;
        // Comprueba la actividad institucional seleccionada.
        if (
            !actividad ||
            String(actividad.id) !== id
        ) {
            throw new Error(
                'Selecciona una actividad institucional.'
            );
        }
        // ====================================================
        // IDENTIFICAR PROGRAMACIÓN EXISTENTE
        // ====================================================
        const semana = semanaId
            ? buscarSemanaInstitucional(
                actividad,
                semanaId
            )
            : null;
        // Evita convertir una edición con un identificador
        // incorrecto en una nueva programación.
        if (semanaId && !semana) {
            throw new Error(
                'No se encontró la programación semanal seleccionada.'
            );
        }
        // ====================================================
        // PREPARAR FORMULARIO
        // ====================================================
        limpiarFormulario(
            'formProgramacionSemanal'
        );
        estado.semanaSeleccionada = semana || null;
        // Título de la ventana.
        texto(
            'modalProgramacionTitulo',
            semana
                ? 'Editar programación semanal'
                : 'Nueva programación semanal'
        );
        // Nombre de la actividad.
        texto(
            'programacionActividadNombre',
            actividad.nombre
        );
        // Identificador principal.
        setCampo(
            'programacionActividadId',
            actividad.id
        );
        // Identificador semanal.
        setCampo(
            'programacionSemanaId',
            semana?.id || ''
        );
        // ====================================================
        // MES Y SEMANA DE PROGRAMACIÓN
        // ====================================================
        setCampo(
            'programacionMes',
            semana?.mes || ''
        );
        configurarSemanasProgramacion(
            semana?.semana_mes
        );
        // Fecha exacta opcional.
        setCampo(
            'programacionFecha',
            semana?.fecha_programada || ''
        );
        // Estado de programación.
        setMarcado(
            'programacionActiva',
            semana ? semana.programada : true
        );
        // ====================================================
        // PROTEGER IDENTIDAD DE PROGRAMACIONES EXISTENTES
        //
        // Durante la edición no permite modificar el mes
        // ni la semana que identifican la programación.
        // ====================================================
        deshabilitar(
            'programacionMes',
            Boolean(semana)
        );
        if (semana) {
            deshabilitar(
                'programacionSemana',
                true
            );
        }
        // Presenta la advertencia de desactivación.
        visible(
            'avisoDesactivarProgramacion',
            !marcado('programacionActiva')
        );
        // ====================================================
        // ABRIR VENTANA DE PROGRAMACIÓN
        // ====================================================
        cambiarModal(
            'modalSeguimientoSemanal',
            'modalProgramacionSemanal'
        );
    }
    // ========================================================
    // 60. GUARDAR PROGRAMACIÓN SEMANAL
    //
    // Registra o actualiza la programación de una actividad.
    //
    // Conserva los parámetros originales del backend:
    //
    // - mes
    // - semanaMes
    // - fechaProgramada
    // - programada
    //
    // La fecha exacta es opcional.
    // ========================================================
    async function guardarProgramacionSemanal(evento) {
        evento?.preventDefault();
        // Evita operaciones simultáneas de guardado.
        if (estado.guardando) return;
        // ====================================================
        // VALIDAR DISPONIBILIDAD DEL CRONOGRAMA
        // ====================================================
        if (cronogramaCerrado()) {
            throw new Error(
                'El cronograma institucional está cerrado.'
            );
        }
        // ====================================================
        // OBTENER INFORMACIÓN DEL FORMULARIO
        // ====================================================
        const id = validarId(
            campo('programacionActividadId')
        );
        const mes = entero(
            campo('programacionMes')
        );
        const semanaMes = entero(
            campo('programacionSemana')
        );
        const fechaProgramada = valorNullable(
            campo('programacionFecha')
        );
        const programada = marcado(
            'programacionActiva'
        );
        // ====================================================
        // VALIDAR MES
        // ====================================================
        if (mes < 1 || mes > 12) {
            throw new Error(
                'Selecciona un mes válido.'
            );
        }
        // ====================================================
        // VALIDAR SEMANA INSTITUCIONAL
        // ====================================================
        if (
            semanaMes < 1 ||
            semanaMes > SEMANAS_POR_MES[mes]
        ) {
            throw new Error(
                'Selecciona una semana válida para el mes.'
            );
        }
        // ====================================================
        // VALIDAR FECHA EXACTA DE PROGRAMACIÓN
        //
        // Si se registra una fecha, debe corresponder
        // al año y mes seleccionados.
        // ====================================================
        if (fechaProgramada) {
            if (!fechaValida(fechaProgramada)) {
                throw new Error(
                    'La fecha programada no es válida.'
                );
            }
            const anioFecha = Number(
                fechaProgramada.substring(0, 4)
            );
            const mesFecha = Number(
                fechaProgramada.substring(5, 7)
            );
            if (
                anioFecha !== estado.anio ||
                mesFecha !== mes
            ) {
                throw new Error(
                    'La fecha debe corresponder al año y mes seleccionados.'
                );
            }
        }
        // ====================================================
        // PROTEGER PROGRAMACIONES COMPLETADAS
        //
        // Una programación realizada no puede desactivarse
        // directamente. Primero debe reabrirse mediante
        // el procedimiento de cambio de estado.
        // ====================================================
        const existente =
            estado.semanaSeleccionada;
        if (
            existente?.estado === 'COMPLETADA' &&
            !programada
        ) {
            throw new Error(
                'Reabre la programación completada antes de desactivarla.'
            );
        }
        // ====================================================
        // PROTEGER IDENTIDAD DE PROGRAMACIONES EXISTENTES
        // ====================================================
        if (
            existente &&
            (
                Number(existente.mes) !== mes ||
                Number(existente.semana_mes) !== semanaMes
            )
        ) {
            throw new Error(
                'No se puede modificar el mes o la semana de una programación existente.'
            );
        }
        // ====================================================
        // BLOQUEAR FORMULARIO
        // ====================================================
        estado.guardando = true;
        botonCargando(
            'btnGuardarProgramacion',
            true,
            'Guardando...'
        );
        try {
            // ================================================
            // ENVIAR PROGRAMACIÓN AL BACKEND
            //
            // Se conserva PUT y la estructura original
            // de los datos esperados por la API.
            // ================================================
            const respuesta = await peticion(
                RUTAS.programacionInstitucional(id),
                {
                    method: 'PUT',
                    body: {
                        mes,
                        semanaMes,
                        fechaProgramada,
                        programada
                    }
                }
            );
            // Cierra el formulario después de guardar.
            cerrarModal('modalProgramacionSemanal');
            // Presenta el mensaje del servidor.
            notificar(
                mensajeRespuesta(
                    respuesta,
                    'Programación semanal actualizada.'
                )
            );
            // ================================================
            // ACTUALIZIZAR COMPONENTES RELACIONADOS
            //
            // Actividades institucionales.
            // Calendario mensual.
            // Agenda.
            // Indicadores de cumplimiento.
            // Seguimiento semanal.
            // ================================================
            await actualizarGestionActividades();
        } finally {
            // Restablece el estado de guardado.
            estado.guardando = false;
            botonCargando(
                'btnGuardarProgramacion',
                false
            );
        }
    }
    // ========================================================
    // 61. CONSULTAR EVENTOS INSTITUCIONALES
    //
    // Normaliza los identificadores de las actividades
    // institucionales y sus programaciones semanales.
    //
    // Conserva las actividades sin fecha exacta.
    // ========================================================
    function normalizarEventoInstitucional(evento) {
        evento = objeto(evento);
        // Identificador principal de la actividad.
        const id = primerIdValido(
            evento.actividad_institucional_id,
            evento.actividad_id,
            evento.actividadInstitucionalId,
            evento.actividadId,
            evento.id
        );
        // Identificador independiente de la programación.
        const semanaId = primerIdValido(
            evento.semana_id,
            evento.semanaId,
            evento.programacion_id,
            evento.programacionId
        );
        return {
            ...evento,
            origen: 'FT147',
            id,
            actividad_institucional_id: id,
            semana_id: semanaId,
            nombre:
                evento.nombre ||
                evento.equipo ||
                evento.actividad ||
                'Actividad institucional',
            fecha: fechaISO(
                evento.fecha ||
                evento.fecha_programada ||
                evento.fecha_exacta
            ),
            mes: entero(
                evento.mes
            ),
            semana_mes: entero(
                evento.semana_mes ??
                evento.semanaMes
            ),
            tipo: mayusculas(
                evento.tipo,
                'OTRO'
            ),
            estado: mayusculas(
                evento.estado,
                'PENDIENTE'
            ),
            prioridad: normalizarPrioridad(
                evento.prioridad
            ),
            responsable:
                evento.responsable || ''
        };
    }
    // Consulta el calendario institucional del año seleccionado.
    async function cargarCalendarioInstitucional() {
        const anio = estado.anio;
        const datos = await peticion(
            conAnio(
                RUTAS.calendarioInstitucional,
                anio
            ),
            {
                clavePeticion: 'calendario-institucional',
                cancelarAnterior: true
            }
        );
        // Evita utilizar respuestas de periodos anteriores.
        if (anio !== estado.anio) return;
        // ====================================================
        // EVENTOS CON FECHA EXACTA
        // ====================================================
        estado.eventosInstitucionales = extraerLista(
            datos,
            'eventos',
            'actividades'
        ).map(
            normalizarEventoInstitucional
        );
        // ====================================================
        // EVENTOS SIN FECHA EXACTA
        // ====================================================
        estado.eventosSinFecha = extraerLista(
            datos,
            'eventosSinFecha',
            'eventos_sin_fecha'
        ).map(
            normalizarEventoInstitucional
        );
        // ====================================================
        // DIAGNÓSTICO DE IDENTIFICADORES
        //
        // Los registros inválidos se conservan para revisión,
        // pero no se permite consultar su detalle.
        // ====================================================
        const invalidos = [
            ...estado.eventosInstitucionales,
            ...estado.eventosSinFecha
        ].filter(
            evento => !claveActividad(evento)
        );
        if (invalidos.length) {
            console.warn(
                '[Transformín] Eventos institucionales ' +
                'sin referencia válida:',
                invalidos.map(evento => ({
                    nombre: evento.nombre,
                    id: evento.id,
                    semana_id: evento.semana_id
                }))
            );
        }
        // Actualiza los componentes relacionados.
        pintarCalendario();
        pintarAgenda();
        pintarEventosSinFecha();
    }
    // ========================================================
    // 62. UNIFICAR EVENTOS DEL CALENDARIO
    //
    // Integra:
    // - Actividades manuales.
    // - Actividades institucionales FT-SST-147.
    // - Cumpleaños de colaboradores.
    //
    // Evita duplicados sin eliminar actividades diferentes
    // que se encuentren programadas para la misma fecha.
    // ========================================================
    // Categoría visual independiente del origen del registro.
    function tipoEventoCalendario(evento) {
        const nombre = normalizar(evento.nombre || evento.actividad);
        if (normalizarOrigen(evento.origen) === 'CUMPLEANOS' || /^cumpleanos\b/.test(nombre)) return 'CUMPLEANOS';
        if (/amor y la amistad|amor y amistad/.test(nombre)) return 'CELEBRACION';
        const tipo = normalizar(evento.tipo).toUpperCase();
        return Object.prototype.hasOwnProperty.call(TIPOS, tipo) ? tipo : 'OTRO';
    }
    function obtenerEventosCalendario() {
        const eventos = [
            ...estado.actividades,
            ...estado.eventosInstitucionales,
            ...estado.eventosCumpleanos
        ];
        const unicos = new Map();
        eventos.forEach((evento, indice) => {
            const fecha = fechaISO(evento.fecha);
            // Los eventos sin fecha exacta se presentan
            // en su sección independiente.
            if (!fecha) return;
            // Conserva únicamente el periodo seleccionado.
            if (
                Number(fecha.substring(0, 4)) !==
                estado.anio
            ) {
                return;
            }
            const referencia = claveActividad(evento);
            // Las referencias temporales solo se utilizan
            // para identificar visualmente registros inválidos.
            // Nunca se envían al backend.
            const clave = referencia
                ? `${referencia}:${fecha}`
                : `SIN-ID:${indice}:${fecha}`;
            unicos.set(clave, {
                ...evento,
                tipo: tipoEventoCalendario(evento),
                fecha
            });
        });
        return Array.from(unicos.values());
    }
    // ========================================================
    // 63. FILTRAR EVENTOS DEL CALENDARIO
    //
    // Permite filtrar por tipo y estado.
    //
    // Los cumpleaños provenientes de Recursos Humanos
    // no utilizan estados de cumplimiento institucional.
    // ========================================================
    function obtenerEventosFiltrados() {
        const tipo = campo(
            'filtroCalendarioTipo'
        );
        const filtroEstado = campo(
            'filtroCalendarioEstado'
        );
        return obtenerEventosCalendario().filter(
            evento => {
                // Filtro por tipo de evento.
                if (
                    tipo &&
                    tipo !== 'TODOS' &&
                    tipo !== evento.tipo
                ) {
                    return false;
                }
                // Filtro por estado.
                if (
                    filtroEstado &&
                    filtroEstado !== 'TODOS'
                ) {
                    if (
                        evento.origen === 'CUMPLEANOS'
                    ) {
                        return false;
                    }
                    const actual =
                        filtroEstado === 'VENCIDA'
                            ? estadoVisual(evento)
                            : evento.estado;
                    if (actual !== filtroEstado) {
                        return false;
                    }
                }
                return true;
            }
        );
    }
    // ========================================================
    // 64. RENDERIZAR EVENTO DEL CALENDARIO
    //
    // Conserva las clases utilizadas por el CSS.
    //
    // Los eventos sin identificador válido permanecen
    // visibles, pero sus acciones quedan deshabilitadas.
    // ========================================================
    function pintarEventoCalendario(evento) {
        const clave = claveActividad(evento);
        const tipo = tipoEventoCalendario(evento);
        const icono =
            ICONOS_TIPO[tipo] ||
            ICONOS_TIPO.OTRO;
        const titulo = clave
            ? evento.nombre
            : `${evento.nombre} - Identificador no disponible`;
        return `
            <button
                type="button"
                class="calendario-evento ${clase(tipo)} tipo-${clase(tipo)}"
                data-tipo="${tipo}"
                data-accion="ver"
                data-clave="${escapar(clave)}"
                title="${escapar(titulo)}"
                aria-label="${escapar(titulo)}"
                ${!clave ? 'disabled aria-disabled="true"' : ''}
            >

                <span class="calendario-evento-indicador">
                    <i class="fas ${icono}"
                       aria-hidden="true"></i>
                </span>

                <span class="calendario-evento-nombre">
                    ${escapar(evento.nombre)}
                </span>

            </button>
        `;
    }
    // ========================================================
    // 65. CONSTRUIR CALENDARIO MENSUAL
    //
    // Compatible con cualquier año permitido.
    //
    // Características:
    // - Semana de lunes a domingo.
    // - Identificación del día actual.
    // - Selección de fechas.
    // - Eventos diferenciados por tipo.
    // - Todos los eventos visibles por celda.
    // - Acceso a eventos adicionales mediante la agenda.
    // - Prevención de encabezados duplicados.
    // ========================================================
    function pintarCalendario() {
        const contenedor = $('calendarioGrid');
        if (!contenedor) return;
        const anio = estado.anio;
        const mes =
            estado.fechaCalendario.getMonth();
        // ====================================================
        // TÍTULO DEL MES
        // ====================================================
        texto(
            'tituloMesCalendario',
            `${MESES[mes]} de ${anio}`
        );
        // ====================================================
        // CALCULAR DISTRIBUCIÓN DEL MES
        // ====================================================
        const primerDia = new Date(
            Date.UTC(anio, mes, 1)
        );
        // Convierte el inicio de semana a lunes.
        const desplazamiento =
            (primerDia.getUTCDay() + 6) % 7;
        // Obtiene la cantidad real de días del mes.
        // Incluye correctamente los años bisiestos.
        const diasMes = new Date(
            Date.UTC(anio, mes + 1, 0)
        ).getUTCDate();
        // Completa las filas de siete días.
        const cantidadCeldas = Math.ceil(
            (desplazamiento + diasMes) / 7
        ) * 7;
        // ====================================================
        // AGRUPAR EVENTOS POR FECHA
        // ====================================================
        const eventos = obtenerEventosFiltrados();
        const porFecha = new Map();
        eventos.forEach(evento => {
            if (!porFecha.has(evento.fecha)) {
                porFecha.set(
                    evento.fecha,
                    []
                );
            }
            porFecha
                .get(evento.fecha)
                .push(evento);
        });
        const fechaActual = hoy();
        // ====================================================
        // ENCABEZADOS DE LOS DÍAS DE LA SEMANA
        //
        // Si el HTML ya contiene encabezados estáticos,
        // JavaScript no debe generarlos nuevamente.
        // ====================================================
        const encabezadoEstatico = Array.from(
            document.querySelectorAll(
                '.calendario-dias-semana'
            )
        ).some(
            encabezado =>
                !contenedor.contains(encabezado)
        );
        let contenido = encabezadoEstatico
            ? ''
            : DIAS_SEMANA.map(dia => `
                <div class="calendario-dia-semana">
                    ${escapar(dia.substring(0, 3))}
                </div>
            `).join('');
        // ====================================================
        // GENERAR CELDAS DEL CALENDARIO
        // ====================================================
        for (
            let indice = 0;
            indice < cantidadCeldas;
            indice++
        ) {
            const numeroDia =
                indice - desplazamiento + 1;
            const fecha = new Date(
                Date.UTC(anio, mes, numeroDia)
            );
            const fechaCelda = fechaLocal(
                fecha.getUTCFullYear(),
                fecha.getUTCMonth() + 1,
                fecha.getUTCDate()
            );
            // Identifica días del mes anterior o siguiente.
            const fueraMes =
                fecha.getUTCMonth() !== mes;
            // Identifica el día actual.
            const esHoy =
                fechaCelda === fechaActual;
            // Identifica el día seleccionado.
            const seleccionada =
                fechaCelda === estado.fechaSeleccionada;
            // Obtiene los eventos correspondientes al día.
            const registros =
                porFecha.get(fechaCelda) || [];
            // Impide seleccionar fechas de otro año
            // desde el calendario del periodo actual.
            const fueraAnio =
                fecha.getUTCFullYear() !== anio;
            // ================================================
            // CONSTRUIR CELDA
            // ================================================
            contenido += `
                <div
                    class="calendario-dia
                        ${fueraMes ? 'fuera-mes' : ''}
                        ${esHoy ? 'hoy' : ''}
                        ${seleccionada ? 'seleccionado' : ''}"
                    data-fecha="${fechaCelda}"
                >

                    <!-- NÚMERO DEL DÍA -->

                    <button
                        type="button"
                        class="calendario-numero-dia"
                        data-accion="seleccionar-fecha"
                        data-fecha="${fechaCelda}"
                        aria-label="${escapar(
                            fechaLarga(fechaCelda)
                        )}"
                        aria-pressed="${seleccionada}"
                        ${fueraAnio ? 'disabled' : ''}
                    >
                        ${fecha.getUTCDate()}
                    </button>

                    <!-- EVENTOS DEL DÍA -->

                    <div class="calendario-eventos">

                        ${registros
                            .map(pintarEventoCalendario)
                            .join('')}


                    </div>

                </div>
            `;
        }
        // ====================================================
        // ACTUALIZAR CALENDARIO
        // ====================================================
        contenedor.innerHTML = contenido;
        // Restringe la navegación al periodo seleccionado.
        deshabilitar(
            'btnMesAnterior',
            mes === 0 && estado.anio === CONFIG.ANIO_MINIMO
        );
        deshabilitar(
            'btnMesSiguiente',
            mes === 11 && estado.anio === CONFIG.ANIO_MAXIMO
        );
    }
    // ========================================================
    // 66. NAVEGACIÓN ENTRE MESES
    //
    // Mantiene sincronizados:
    // - Calendario mensual.
    // - Fecha seleccionada.
    // - Agenda del día.
    // - Actividades pendientes de fecha exacta.
    // ========================================================
    async function cambiarMes(cantidad) {
        const desplazamiento = Number(cantidad);
        if (!Number.isInteger(desplazamiento)) {
            return;
        }
        const mes =
            estado.fechaCalendario.getMonth() +
            desplazamiento;
        // Permite navegar entre años sin mezclar sus registros.
        if (mes < 0 || mes > 11) {
            const destino = new Date(estado.anio, mes, 1, 12);
            const anio = destino.getFullYear();
            if (anio < CONFIG.ANIO_MINIMO || anio > CONFIG.ANIO_MAXIMO) return;
            await cambiarAnio(anio);
            if (estado.anio !== anio) return;
            estado.fechaCalendario = destino;
            estado.fechaSeleccionada = fechaLocal(anio, destino.getMonth() + 1, 1);
            pintarCalendario(); pintarAgenda(); pintarEventosSinFecha();
            return;
        }
        estado.fechaCalendario = new Date(
            estado.anio,
            mes,
            1,
            12
        );
        estado.fechaSeleccionada = fechaLocal(
            estado.anio,
            mes + 1,
            1
        );
        pintarCalendario();
        pintarAgenda();
        pintarEventosSinFecha();
    }
    // ========================================================
    // REGRESAR AL DÍA ACTUAL
    //
    // Utiliza la fecha correspondiente a Colombia.
    // Cambia el periodo cuando sea necesario.
    // ========================================================
    async function irHoy() {
        const fecha = hoy();
        const anio = Number(
            fecha.substring(0, 4)
        );
        // Cambia el periodo si corresponde a otro año.
        if (anio !== estado.anio) {
            await cambiarAnio(anio);
        }
        // Si el cambio de año fue bloqueado,
        // conserva el calendario actual.
        if (estado.anio !== anio) return;
        estado.fechaCalendario = new Date(
            `${fecha}T12:00:00`
        );
        estado.fechaSeleccionada = fecha;
        pintarCalendario();
        pintarAgenda();
        pintarEventosSinFecha();
    }
    // ========================================================
    // SELECCIONAR UNA FECHA DEL CALENDARIO
    // ========================================================
    function seleccionarFecha(fecha) {
        if (!fechaValida(fecha)) return;
        // Comprueba que la fecha pertenezca
        // al periodo seleccionado.
        if (
            Number(fecha.substring(0, 4)) !==
            estado.anio
        ) {
            return;
        }
        estado.fechaSeleccionada = fecha;
        estado.fechaCalendario = new Date(
            `${fecha}T12:00:00`
        );
        pintarCalendario();
        pintarAgenda();
        pintarEventosSinFecha();
    }
    // ========================================================
    // 67. RENDERIZAR AGENDA DEL DÍA
    //
    // Presenta todos los eventos correspondientes
    // a la fecha seleccionada en el calendario.
    //
    // Incluye actividades manuales, institucionales
    // y cumpleaños provenientes de Recursos Humanos.
    // ========================================================
    function pintarAgenda() {
        const fecha =
            estado.fechaSeleccionada;
        // Actualiza el encabezado de la agenda.
        texto(
            'fechaAgendaSeleccionada',
            fechaLarga(fecha)
        );
        // Obtiene los eventos del día seleccionado.
        const eventos = obtenerEventosFiltrados()
            .filter(
                evento => evento.fecha === fecha
            );
        // ====================================================
        // AGENDA SIN ACTIVIDADES
        // ====================================================
        if (!eventos.length) {
            html(
                'listaAgenda',
                estadoVacio(
                    'Sin actividades',
                    'No hay eventos programados para este día.',
                    'fa-calendar-check'
                )
            );
            return;
        }
        // ====================================================
        // GENERAR EVENTOS DE LA AGENDA
        // ====================================================
        html(
            'listaAgenda',
            eventos.map(evento => {
                const tipo = mayusculas(
                    evento.tipo,
                    'OTRO'
                );
                const clave = claveActividad(evento);
                const icono =
                    ICONOS_TIPO[tipo] ||
                    ICONOS_TIPO.OTRO;
                return `
                    <button
                        type="button"
                        class="agenda-item ${clase(tipo)}"
                        data-accion="ver"
                        data-clave="${escapar(clave)}"
                        ${!clave
                            ? 'disabled aria-disabled="true"'
                            : ''}
                    >

                        <!-- ICONO DEL EVENTO -->

                        <span class="agenda-item-icono">

                            <i class="fas ${icono}"
                               aria-hidden="true"></i>

                        </span>

                        <!-- INFORMACIÓN DEL EVENTO -->

                        <span class="agenda-item-contenido">

                            <strong>
                                ${escapar(evento.nombre)}
                            </strong>

                            <small>
                                ${escapar(
                                    ORIGENES[evento.origen] ||
                                    'Actividad'
                                )}
                            </small>

                            ${
                                evento.responsable
                                    ? `
                                        <small>
                                            ${escapar(
                                                evento.responsable
                                            )}
                                        </small>
                                    `
                                    : ''
                            }

                            ${
                                !clave
                                    ? `
                                        <small class="text-muted">
                                            Identificador no disponible
                                        </small>
                                    `
                                    : ''
                            }

                        </span>

                        <!-- ESTADO DEL EVENTO -->

                        <span class="agenda-item-estado">

                            ${
                                evento.origen === 'CUMPLEANOS'
                                    ? badgeTipo('CUMPLEANOS')
                                    : badgeEstado(
                                        estadoVisual(evento)
                                    )
                            }

                        </span>

                    </button>
                `;
            }).join('')
        );
    }
    // ========================================================
    // 68. ACTIVIDADES SIN FECHA EXACTA
    //
    // Presenta las actividades institucionales que tienen
    // una programación semanal, pero no un día específico.
    //
    // No asigna fechas artificiales ni elimina registros
    // únicamente porque su identificador sea inválido.
    // ========================================================
    function pintarEventosSinFecha() {
        const mes =
            estado.fechaCalendario.getMonth() + 1;
        const tipo = campo(
            'filtroCalendarioTipo'
        );
        const filtroEstado = campo(
            'filtroCalendarioEstado'
        );
        // ====================================================
        // FILTRAR ACTIVIDADES
        // ====================================================
        const eventos = lista(
            estado.eventosSinFecha
        ).filter(evento => {
            // Oculta únicamente registros que ya tienen una fecha confirmada en el calendario.
            const clave = claveActividad(evento);
            if (clave && estado.eventosInstitucionales.some(registro =>
                claveActividad(registro) === clave && fechaValida(registro.fecha))) return false;
            // Filtra por mes cuando existe uno definido.
            if (
                evento.mes &&
                Number(evento.mes) !== mes
            ) {
                return false;
            }
            // Filtra por tipo.
            if (
                tipo &&
                tipo !== 'TODOS' &&
                evento.tipo !== tipo
            ) {
                return false;
            }
            // Filtra por estado.
            if (
                filtroEstado &&
                filtroEstado !== 'TODOS'
            ) {
                const actual =
                    filtroEstado === 'VENCIDA'
                        ? estadoVisual(evento)
                        : evento.estado;
                if (actual !== filtroEstado) {
                    return false;
                }
            }
            return true;
        });
        // ====================================================
        // MOSTRAR U OCULTAR CONTENEDOR
        // ====================================================
        visible(
            'contenedorEventosSinFecha',
            eventos.length > 0
        );
        // ====================================================
        // GENERAR TARJETAS
        // ====================================================
        html(
            'listaEventosSinFecha',
            eventos.map(evento => {
                const clave = claveActividad(evento);
                const semana = entero(
                    evento.semana_mes
                );
                const descripcion = semana > 0
                    ? `Semana ${semana} · Fecha exacta pendiente`
                    : 'Fecha exacta pendiente';
                return `
                    <button
                        type="button"
                        class="evento-sin-fecha"
                        data-accion="ver"
                        data-clave="${escapar(clave)}"
                        title="${escapar(
                            clave
                                ? evento.nombre
                                : 'Identificador no disponible'
                        )}"
                        ${!clave
                            ? 'disabled aria-disabled="true"'
                            : ''}
                    >

                        <!-- ICONO -->

                        <i class="fas fa-calendar-week"
                           aria-hidden="true"></i>

                        <!-- INFORMACIÓN -->

                        <span>

                            <strong>
                                ${escapar(evento.nombre)}
                            </strong>

                            <small>
                                ${escapar(descripcion)}
                            </small>

                            ${
                                !clave
                                    ? `
                                        <small class="text-muted">
                                            Registro pendiente de identificación
                                        </small>
                                    `
                                    : ''
                            }

                        </span>

                    </button>
                `;
            }).join('')
        );
    }
    // ========================================================
    // 69. CONSULTAR DETALLE DE UN EVENTO
    //
    // Diferencia los tres orígenes principales:
    //
    // MANUAL: actividad manual.
    // FT147: actividad institucional.
    // CUMPLEANOS: colaborador de Recursos Humanos.
    //
    // Valida los identificadores antes de realizar consultas.
    // ========================================================
    async function verDetalleEvento(clave) {
        const referencia = interpretarClave(clave);
        // ====================================================
        // VALIDAR REFERENCIA
        // ====================================================
        if (!referencia) {
            throw new Error(
                'No fue posible identificar el evento.'
            );
        }
        let actividad;
        let semana = null;
        // ====================================================
        // CONSULTAR ACTIVIDAD MANUAL
        // ====================================================
        if (referencia.origen === 'MANUAL') {
            actividad = await obtenerActividadManual(
                referencia.id
            );
        // ====================================================
        // CONSULTAR ACTIVIDAD INSTITUCIONAL
        // ====================================================
        } else if (referencia.origen === 'FT147') {
            actividad = await obtenerActividadInstitucional(
                referencia.id
            );
            // Utiliza la comparación normalizada de IDs
            // incorporada en la parte 05.
            if (referencia.semanaId) {
                semana = buscarSemanaInstitucional(
                    actividad,
                    referencia.semanaId
                );
                // No convierte una referencia semanal
                // inválida en una actividad general.
                if (!semana) {
                    throw new Error(
                        'No se encontró la programación semanal del evento.'
                    );
                }
            }
        // ====================================================
        // CONSULTAR CUMPLEAÑOS
        // ====================================================
        } else if (referencia.origen === 'CUMPLEANOS') {
            // Abre la configuración individual del colaborador.
            // No modifica ni activa los envíos automáticos.
            await abrirConfiguracionCumpleanos(
                referencia.id
            );
            return;
        }
        // ====================================================
        // COMPROBAR DISPONIBILIDAD DEL REGISTRO
        // ====================================================
        if (!actividad) {
            throw new Error(
                'El evento solicitado no está disponible.'
            );
        }
        // Conserva los registros seleccionados.
        estado.actividadSeleccionada = actividad;
        estado.semanaSeleccionada = semana;
        // ====================================================
        // IDENTIFICADORES DEL EVENTO
        // ====================================================
        setCampo(
            'detalleEventoId',
            actividad.id
        );
        setCampo(
            'detalleEventoOrigen',
            referencia.origen
        );
        setCampo(
            'detalleEventoSemanaId',
            semana?.id || ''
        );
        // ====================================================
        // INFORMACIÓN PRINCIPAL
        // ====================================================
        texto(
            'detalleEventoNombre',
            actividad.nombre
        );
        html(
            'detalleEventoTipo',
            badgeTipo(actividad.tipo)
        );
        texto(
            'detalleEventoOrigenTexto',
            ORIGENES[referencia.origen]
        );
        // Si existe una programación semanal, utiliza
        // exclusivamente la fecha correspondiente a ella.
        const fechaEvento = semana
            ? semana.fecha_programada
            : actividad.fecha;
        texto(
            'detalleEventoFecha',
            fechaBonita(
                fechaEvento,
                'Fecha exacta pendiente'
            )
        );
        texto(
            'detalleEventoResponsable',
            actividad.responsable || 'Sin asignar'
        );
        // ====================================================
        // ESTADO Y PRIORIDAD
        // ====================================================
        html(
            'detalleEventoEstado',
            badgeEstado(
                estadoVisual(
                    semana || actividad
                )
            )
        );
        html(
            'detalleEventoPrioridad',
            badgePrioridad(actividad.prioridad)
        );
        // ====================================================
        // DESCRIPCIÓN Y OBSERVACIONES
        // ====================================================
        texto(
            'detalleEventoDescripcion',
            actividad.descripcion ||
            actividad.actividad ||
            'Sin descripción'
        );
        texto(
            'detalleEventoObservaciones',
            semana?.observaciones ||
            actividad.observaciones ||
            'Sin observaciones'
        );
        // ====================================================
        // ICONO DEL EVENTO
        // ====================================================
        html(
            'detalleEventoIcono',
            `<i class="fas ${
                ICONOS_TIPO[actividad.tipo] ||
                ICONOS_TIPO.OTRO
            }" aria-hidden="true"></i>`
        );
        // ====================================================
        // INFORMACIÓN DE PROGRAMACIÓN SEMANAL
        // ====================================================
        visible(
            'detalleEventoProgramacion',
            Boolean(semana)
        );
        texto(
            'detalleEventoMes',
            semana
                ? MESES[semana.mes - 1] || 'Sin definir'
                : 'No aplica'
        );
        texto(
            'detalleEventoSemana',
            semana
                ? `Semana ${semana.semana_mes}`
                : 'No aplica'
        );
        texto(
            'detalleEventoFechaRealizacion',
            fechaBonita(
                semana?.fecha_realizacion,
                'Sin realizar'
            )
        );
        // ====================================================
        // CONTROL DE ACCIONES DISPONIBLES
        // ====================================================
        const actual =
            semana?.estado ||
            actividad.estado;
        const bloqueada =
            referencia.origen === 'FT147' &&
            cronogramaCerrado();
        const permiteCompletar =
            !bloqueada &&
            ![
                'COMPLETADA',
                'CANCELADA'
            ].includes(actual) &&
            (
                referencia.origen === 'MANUAL' ||
                Boolean(semana?.programada)
            );
        // Bloquea la edición de cronogramas cerrados.
        deshabilitar(
            'btnEditarEventoDetalle',
            bloqueada
        );
        // Muestra completar únicamente cuando corresponde.
        visible(
            'btnCompletarEventoDetalle',
            permiteCompletar
        );
        // Abre el detalle del evento.
        abrirModal('modalDetalleEvento');
    }
    // ========================================================
    // 70. ACCIONES DESDE EL DETALLE
    //
    // Permite editar o completar actividades directamente
    // desde la ventana de detalle del calendario.
    // ========================================================
    function obtenerClaveDetalle() {
        const origen = campo(
            'detalleEventoOrigen'
        );
        const id = campo(
            'detalleEventoId'
        );
        const semanaId = campo(
            'detalleEventoSemanaId'
        );
        const clave = semanaId
            ? `${origen}:${id}:${semanaId}`
            : `${origen}:${id}`;
        // No devuelve referencias inválidas.
        return interpretarClave(clave)
            ? clave
            : '';
    }
    // ========================================================
    // EDITAR EVENTO DESDE EL DETALLE
    // ========================================================
    async function editarEventoDetalle() {
        const referencia = interpretarClave(
            obtenerClaveDetalle()
        );
        if (!referencia) {
            throw new Error(
                'No se pudo identificar la actividad seleccionada.'
            );
        }
        // Protege los documentos institucionales cerrados.
        if (
            referencia.origen === 'FT147' &&
            cronogramaCerrado()
        ) {
            throw new Error(
                'El cronograma institucional está cerrado.'
            );
        }
        // ====================================================
        // EJECUTAR EDICIÓN SEGÚN EL ORIGEN
        // ====================================================
        const ejecutarEdicion = eventoSeguro(async () => {
            if (referencia.origen === 'MANUAL') {
                await editarActividadManual(
                    referencia.id
                );
            } else if (referencia.origen === 'FT147') {
                await editarActividadInstitucional(
                    referencia.id
                );
            }
        });
        const detalle = $('modalDetalleEvento');
        // ====================================================
        // EVITAR SUPERPOSICIÓN DE VENTANAS
        // ====================================================
        if (detalle?.classList.contains('show')) {
            detalle.addEventListener(
                'hidden.bs.modal',
                ejecutarEdicion,
                { once: true }
            );
            cerrarModal(
                'modalDetalleEvento'
            );
        } else {
            await ejecutarEdicion();
        }
    }
    // ========================================================
    // COMPLETAR EVENTO DESDE EL DETALLE
    // ========================================================
    async function completarEventoDetalle() {
        const clave = obtenerClaveDetalle();
        if (!clave) {
            throw new Error(
                'El evento no tiene una referencia válida.'
            );
        }
        await abrirCambioEstado(
            clave,
            'COMPLETADA'
        );
    }
    // ========================================================
    // 71. CONSULTAR INDICADORES GENERALES
    //
    // Recupera los indicadores de actividades manuales,
    // institucionales y cumpleaños de colaboradores.
    // ========================================================
    async function cargarIndicadores() {
        const anio = estado.anio;
        const datos = await peticion(
            conAnio(RUTAS.indicadores, anio),
            {
                clavePeticion: 'indicadores-generales',
                cancelarAnterior: true
            }
        );
        // Descarta respuestas de periodos anteriores.
        if (anio !== estado.anio) return;
        estado.indicadores = objeto(
            datos.indicadores
        );
        estado.indicadoresManuales = objeto(
            datos.manuales
        );
        estado.indicadoresInstitucionales = objeto(
            datos.institucional ||
            datos.cumplimiento
        );
        estado.indicadoresCumpleanos = objeto(
            datos.cumpleanos
        );
        // Actualiza las tarjetas generales.
        pintarIndicadores();
        // Actualiza el cumplimiento institucional cuando
        // la respuesta contiene los indicadores anuales.
        if (estado.indicadoresInstitucionales.anual) {
            estado.cumplimiento =
                estado.indicadoresInstitucionales;
            pintarCumplimiento();
        }
        return datos;
    }
    // ========================================================
    // 72. RENDERIZAR INDICADORES GENERALES
    //
    // Conserva los identificadores originales del HTML.
    // Utiliza los valores entregados por el backend.
    // ========================================================
    function pintarIndicadores() {
        const manuales =
            estado.indicadoresManuales;
        const indicadores =
            estado.indicadores;
        const cumpleanos =
            estado.indicadoresCumpleanos;
        // Total de actividades manuales.
        texto(
            'totalActividades',
            numeroTexto(
                manuales.totalActividades ??
                manuales.total ??
                indicadores.totalActividades ??
                estado.actividades.length
            )
        );
        // Actividades próximas.
        texto(
            'totalProximas',
            numeroTexto(
                manuales.proximas ??
                indicadores.totalProximas
            )
        );
        // Actividades completadas.
        texto(
            'totalCompletadas',
            numeroTexto(
                manuales.completadas ??
                indicadores.totalCompletadas
            )
        );
        // Actividades pendientes.
        texto(
            'totalPendientes',
            numeroTexto(
                manuales.pendientes ??
                indicadores.totalPendientes
            )
        );
        // Actividades vencidas.
        texto(
            'totalVencidas',
            numeroTexto(
                manuales.vencidas ??
                indicadores.totalVencidas
            )
        );
        // Actividades en proceso.
        texto(
            'totalEnProceso',
            numeroTexto(
                manuales.enProceso ??
                indicadores.totalEnProceso
            )
        );
        // Actividades canceladas.
        texto(
            'totalCanceladas',
            numeroTexto(
                manuales.canceladas ??
                indicadores.totalCanceladas
            )
        );
        // Total de colaboradores registrados.
        texto(
            'totalCumpleanos',
            numeroTexto(
                cumpleanos.totalColaboradores ??
                cumpleanos.totalCumpleanos ??
                indicadores.totalCumpleanos
            )
        );
        // Cumpleaños correspondientes al mes.
        texto(
            'cumpleanosMes',
            numeroTexto(
                cumpleanos.cumpleanosMes ??
                indicadores.cumpleanosMes
            )
        );
        // Cumpleaños correspondientes al día actual.
        texto(
            'cumpleanosHoy',
            numeroTexto(
                cumpleanos.cumpleanosHoy ??
                indicadores.cumpleanosHoy
            )
        );
        // Felicitaciones registradas como enviadas.
        texto(
            'felicitacionesEnviadas',
            numeroTexto(
                cumpleanos.felicitacionesEnviadas ??
                indicadores.felicitacionesEnviadas
            )
        );
    }
    // ========================================================
    // 73. CONSULTAR CUMPLIMIENTO INSTITUCIONAL
    //
    // Recupera los indicadores del FT-SST-147 para el
    // año seleccionado.
    //
    // Incluye cumplimiento anual, mensual y al corte.
    // ========================================================
    async function cargarCumplimiento() {
        const anio = estado.anio;
        const datos = await peticion(
            conAnio(
                RUTAS.indicadoresAnuales,
                anio
            ),
            {
                clavePeticion: 'cumplimiento-anual',
                cancelarAnterior: true
            }
        );
        // Evita mostrar información de otro periodo.
        if (anio !== estado.anio) return;
        estado.cumplimiento =
            datos.cumplimiento || datos;
        pintarCumplimiento();
        return estado.cumplimiento;
    }
    // ========================================================
    // 74. RENDERIZAR CUMPLIMIENTO ANUAL
    //
    // Fórmula:
    //
    // Cumplimiento = completadas / programadas * 100.
    //
    // Cuando no existen programaciones, presenta N/A.
    //
    // Las marcas sin clasificar se muestran por separado.
    // ========================================================
    function pintarCumplimiento() {
        const cumplimiento = objeto(
            estado.cumplimiento
        );
        const anual = objeto(
            cumplimiento.anual
        );
        const corte = objeto(
            cumplimiento.cumplimientoAlCorte
        );
        // ====================================================
        // INDICADORES ANUALES
        // ====================================================
        const programadas = numero(
            anual.programadas
        );
        const completadas = numero(
            anual.completadas ??
            anual.realizadas
        );
        const pendientes = numero(
            anual.pendientes
        );
        const canceladas = numero(
            anual.canceladas
        );
        // Calcula el porcentaje anual.
        const avanceAnual = porcentaje(
            completadas,
            programadas
        );
        // Encabezado del seguimiento.
        texto(
            'tituloSeguimientoAnual',
            `Seguimiento anual ${estado.anio}`
        );
        // Porcentaje general.
        texto(
            'porcentajeAnual',
            programadas > 0
                ? porcentajeTexto(avanceAnual)
                : 'N/A'
        );
        // Programaciones registradas.
        texto(
            'programadasAnuales',
            numeroTexto(programadas)
        );
        // Programaciones completadas.
        texto(
            'completadasAnuales',
            numeroTexto(completadas)
        );
        // Programaciones pendientes.
        texto(
            'pendientesAnuales',
            numeroTexto(pendientes)
        );
        // Programaciones canceladas.
        texto(
            'canceladasAnuales',
            numeroTexto(canceladas)
        );
        // ====================================================
        // MARCAS ORIGINALES SIN CLASIFICAR
        //
        // Conserva el indicador de marcas cuyo significado
        // todavía no ha sido confirmado institucionalmente.
        // ====================================================
        texto(
            'totalMarcasSinClasificar',
            numeroTexto(
                anual.sinClasificar ??
                anual.sin_clasificar
            )
        );
        // Descripción del avance anual.
        texto(
            'textoAvanceAnual',
            programadas
                ? `${completadas} de ${programadas} programaciones completadas durante el año.`
                : 'No hay programaciones institucionales registradas.'
        );
        // Actualiza la barra de cumplimiento anual.
        actualizarProgreso(
            'progresoAnual',
            'barraProgresoAnual',
            avanceAnual
        );
        // ====================================================
        // CUMPLIMIENTO AL CORTE
        //
        // Utiliza exclusivamente las programaciones que
        // el backend identifica como exigibles al corte.
        // ====================================================
        const programadasCorte = numero(
            corte.programadas
        );
        const completadasCorte = numero(
            corte.completadas ??
            corte.realizadas
        );
        const avanceCorte = porcentaje(
            completadasCorte,
            programadasCorte
        );
        // Porcentaje de cumplimiento al corte.
        texto(
            'porcentajeCorte',
            programadasCorte
                ? porcentajeTexto(avanceCorte)
                : 'N/A'
        );
        // Total de programaciones exigibles.
        texto(
            'programadasCorte',
            numeroTexto(programadasCorte)
        );
        // Total de programaciones realizadas al corte.
        texto(
            'completadasCorte',
            numeroTexto(completadasCorte)
        );
        // Fecha de referencia del seguimiento.
        texto(
            'fechaCorte',
            fechaBonita(
                corte.fecha || hoy()
            )
        );
        // Descripción del cumplimiento al corte.
        texto(
            'textoCumplimientoCorte',
            programadasCorte
                ? `${completadasCorte} de ${programadasCorte} programaciones exigibles a la fecha.`
                : 'No existen programaciones exigibles al corte.'
        );
        // Actualiza la barra de cumplimiento al corte.
        actualizarProgreso(
            'progresoCorte',
            'barraProgresoCorte',
            avanceCorte
        );
        // Actualiza el gráfico y la tabla mensual.
        pintarCumplimientoMensual(
            lista(cumplimiento.mensual)
        );
    }
    // ========================================================
    // 75. NORMALIZAR INDICADORES MENSUALES
    //
    // Garantiza que los doce meses del año estén presentes,
    // incluso cuando el backend no devuelve información
    // correspondiente a todos los meses.
    // ========================================================
    function normalizarIndicadoresMensuales(registros) {
        return MESES.map((nombre, indice) => {
            const mes = indice + 1;
            // Localiza la información del mes.
            const datos = lista(registros).find(
                registro =>
                    Number(registro.mes) === mes
            ) || {};
            const programadas = numero(
                datos.programadas
            );
            const completadas = numero(
                datos.completadas ??
                datos.realizadas
            );
            // Devuelve una estructura uniforme.
            return {
                mes,
                nombre,
                programadas,
                completadas,
                pendientes: numero(
                    datos.pendientes
                ),
                canceladas: numero(
                    datos.canceladas
                ),
                sinClasificar: numero(
                    datos.sinClasificar ??
                    datos.sin_clasificar
                ),
                porcentaje: porcentaje(
                    completadas,
                    programadas
                ),
                // Diferencia un mes sin programación
                // de un mes programado con avance del 0 %.
                aplica: programadas > 0
            };
        });
    }
    // ========================================================
    // 76. GRÁFICO DE CUMPLIMIENTO MENSUAL
    //
    // Compara las programaciones registradas y completadas.
    //
    // Conserva las clases utilizadas por el CSS:
    //
    // - grafico-mensual-scroll
    // - grafico-mensual-columnas
    // - grafico-mes
    // - grafico-mes-valor
    // - grafico-barras
    // - grafico-barra
    // - barra-programadas
    // - barra-completadas
    // - grafico-mes-nombre
    // ========================================================
    function pintarGraficoMensual(meses) {
        const contenedor = $(
            'graficoCumplimientoMensual'
        );
        if (!contenedor) return;
        // Calcula la escala máxima del gráfico.
        // El valor mínimo evita divisiones entre cero.
        const maximo = Math.max(
            1,
            ...meses.map(mes =>
                Math.max(
                    mes.programadas,
                    mes.completadas
                )
            )
        );
        // ====================================================
        // GENERAR GRÁFICO DE COLUMNAS
        // ====================================================
        contenedor.innerHTML = `
            <div class="grafico-mensual-scroll">

                <div class="grafico-mensual-columnas">

                    ${meses.map(mes => {
                        // Altura proporcional de las barras.
                        const alturaProgramadas =
                            mes.programadas / maximo * 100;
                        const alturaCompletadas =
                            mes.completadas / maximo * 100;
                        return `
                            <div
                                class="grafico-mes"
                                aria-label="${escapar(
                                    `${mes.nombre}: ${mes.programadas} programadas, ${mes.completadas} completadas`
                                )}"
                            >

                                <!-- PORCENTAJE MENSUAL -->

                                <div class="grafico-mes-valor">

                                    ${
                                        mes.aplica
                                            ? porcentajeTexto(
                                                mes.porcentaje
                                            )
                                            : 'N/A'
                                    }

                                </div>

                                <!-- CONTENEDOR DE BARRAS -->

                                <div
                                    class="grafico-barras"
                                    style="
                                        height:160px;
                                        display:flex;
                                        align-items:flex-end;
                                        justify-content:center;
                                        gap:5px;
                                    "
                                >

                                    <!-- PROGRAMADAS -->

                                    <div
                                        class="grafico-barra barra-programadas"
                                        style="
                                            height:${alturaProgramadas}%;
                                            width:22px;
                                            background:var(--ct-azul,#2563eb);
                                            border-radius:5px 5px 0 0;
                                        "
                                        title="${mes.programadas} programadas"
                                    ></div>

                                    <!-- COMPLETADAS -->

                                    <div
                                        class="grafico-barra barra-completadas"
                                        style="
                                            height:${alturaCompletadas}%;
                                            width:22px;
                                            background:var(--ct-verde,#16a34a);
                                            border-radius:5px 5px 0 0;
                                        "
                                        title="${mes.completadas} completadas"
                                    ></div>

                                </div>

                                <!-- NOMBRE DEL MES -->

                                <span class="grafico-mes-nombre">

                                    ${MESES_CORTOS[mes.mes - 1]}

                                </span>

                            </div>
                        `;
                    }).join('')}

                </div>

            </div>
        `;
    }
    // ========================================================
    // 77. TABLA DE CUMPLIMIENTO MENSUAL
    //
    // Presenta los doce meses del año con sus respectivos
    // indicadores de seguimiento institucional.
    //
    // Columnas:
    //
    // 01. Mes.
    // 02. Programadas.
    // 03. Completadas.
    // 04. Pendientes.
    // 05. Canceladas.
    // 06. Cumplimiento.
    // ========================================================
    function pintarCumplimientoMensual(registros) {
        const meses =
            normalizarIndicadoresMensuales(registros);
        // Actualiza el gráfico mensual.
        pintarGraficoMensual(meses);
        // ====================================================
        // LOCALIZAR TABLA
        //
        // Compatible con un elemento TABLE o TBODY.
        // Evita reemplazar accidentalmente los encabezados.
        // ====================================================
        const destino = $(
            'tablaCumplimientoMensual'
        );
        if (destino) {
            const cuerpo =
                destino.tagName === 'TABLE'
                    ? destino.tBodies[0] ||
                      destino.createTBody()
                    : destino;
            // ================================================
            // GENERAR FILAS MENSUALES
            // ================================================
            cuerpo.innerHTML = meses.map(mes => `
                <tr>

                    <!-- 01. MES -->

                    <td>
                        <strong>${mes.nombre}</strong>
                    </td>

                    <!-- 02. PROGRAMADAS -->

                    <td>
                        ${numeroTexto(mes.programadas)}
                    </td>

                    <!-- 03. COMPLETADAS -->

                    <td>
                        ${numeroTexto(mes.completadas)}
                    </td>

                    <!-- 04. PENDIENTES -->

                    <td>
                        ${numeroTexto(mes.pendientes)}
                    </td>

                    <!-- 05. CANCELADAS -->

                    <td>
                        ${numeroTexto(mes.canceladas)}
                    </td>

                    <!-- 06. CUMPLIMIENTO -->

                    <td>
                        <span class="cumplimiento-valor
                            ${
                                !mes.aplica
                                    ? 'sin-programacion'
                                    : mes.porcentaje === 100
                                        ? 'completo'
                                        : 'pendiente'
                            }">

                            ${
                                mes.aplica
                                    ? porcentajeTexto(
                                        mes.porcentaje
                                    )
                                    : 'N/A'
                            }

                        </span>
                    </td>

                </tr>
            `).join('');
        }
        // ====================================================
        // CONSOLIDAR TOTALES MENSUALES
        //
        // El porcentaje consolidado se calcula utilizando
        // los totales de programaciones y completadas.
        //
        // No utiliza un promedio simple de porcentajes.
        // ====================================================
        const totales = meses.reduce(
            (acumulado, mes) => ({
                programadas:
                    acumulado.programadas +
                    mes.programadas,
                completadas:
                    acumulado.completadas +
                    mes.completadas,
                pendientes:
                    acumulado.pendientes +
                    mes.pendientes,
                canceladas:
                    acumulado.canceladas +
                    mes.canceladas
            }),
            {
                programadas: 0,
                completadas: 0,
                pendientes: 0,
                canceladas: 0
            }
        );
        // ====================================================
        // ACTUALIZAR TOTALES DE LA TABLA
        // ====================================================
        texto(
            'totalMensualProgramadas',
            numeroTexto(totales.programadas)
        );
        texto(
            'totalMensualCompletadas',
            numeroTexto(totales.completadas)
        );
        texto(
            'totalMensualPendientes',
            numeroTexto(totales.pendientes)
        );
        texto(
            'totalMensualCanceladas',
            numeroTexto(totales.canceladas)
        );
        // Cumplimiento consolidado.
        texto(
            'totalMensualCumplimiento',
            totales.programadas
                ? porcentajeTexto(
                    porcentaje(
                        totales.completadas,
                        totales.programadas
                    )
                )
                : 'N/A'
        );
    }
    // ========================================================
    // 78. ACTUALIZACIÓN DESPUÉS DE UNA OPERACIÓN
    //
    // Sincroniza los componentes después de crear,
    // editar, eliminar o cambiar el estado de una actividad.
    //
    // Promise.allSettled permite actualizar los componentes
    // disponibles aunque alguna consulta genere un error.
    // ========================================================
    async function actualizarGestionActividades() {
        const consultas = await Promise.allSettled([
            // Actividades manuales.
            cargarActividades(),
            // Actividades institucionales.
            cargarInstitucional(),
            // Eventos institucionales.
            cargarCalendarioInstitucional(),
            // Indicadores generales.
            cargarIndicadores()
        ]);
        // ====================================================
        // ACTUALIZAR COMPONENTES VISUALES
        // ====================================================
        pintarCalendario();
        pintarAgenda();
        pintarEventosSinFecha();
        // ====================================================
        // IDENTIFICAR ERRORES DE ACTUALIZACIÓN
        //
        // Las consultas canceladas voluntariamente no
        // se consideran errores de funcionamiento.
        // ====================================================
        const errores = consultas.filter(
            resultado =>
                resultado.status === 'rejected' &&
                resultado.reason?.name !== 'AbortError'
        );
        // ====================================================
        // REGISTRAR ERRORES PARCIALES
        // ====================================================
        if (errores.length) {
            errores.forEach(resultado => {
                console.error(
                    '[Transformín] Error de actualización:',
                    resultado.reason
                );
            });
            // Diferencia un error de actualización visual
            // de un error en la operación ya realizada.
            notificar(
                'La operación se realizó, pero no fue posible actualizar toda la información.',
                'advertencia'
            );
        }
    }
    // ========================================================
    // 79. CONTROL CENTRALIZADO DE ACCIONES
    //
    // Gestiona las acciones de actividades manuales,
    // institucionales y cumpleaños de Recursos Humanos.
    // ========================================================
    async function ejecutarAccionActividad(accion, clave) {
        const referencia = interpretarClave(clave);
        if (!referencia) {
            throw new Error(
                'La referencia del registro no es válida.'
            );
        }
        switch (accion) {
            // CONSULTAR DETALLE.
            case 'ver':
                await verDetalleEvento(clave);
                break;
            // EDITAR REGISTRO SEGÚN SU ORIGEN.
            case 'editar':
                if (referencia.origen === 'MANUAL') {
                    await editarActividadManual(
                        referencia.id
                    );
                } else if (referencia.origen === 'FT147') {
                    await editarActividadInstitucional(
                        referencia.id
                    );
                } else if (
                    referencia.origen === 'CUMPLEANOS'
                ) {
                    await abrirConfiguracionCumpleanos(
                        referencia.id
                    );
                }
                break;
            // COMPLETAR ACTIVIDAD MANUAL.
            case 'completar':
                if (referencia.origen !== 'MANUAL') {
                    throw new Error(
                        'Las actividades institucionales se completan desde el seguimiento semanal.'
                    );
                }
                await abrirCambioEstado(
                    clave,
                    'COMPLETADA'
                );
                break;
            // CAMBIAR ESTADO.
            case 'estado':
                await abrirCambioEstado(clave);
                break;
            // ELIMINAR ACTIVIDAD MANUAL.
            case 'eliminar':
                if (referencia.origen !== 'MANUAL') {
                    throw new Error(
                        'Solo las actividades manuales pueden eliminarse desde esta opción.'
                    );
                }
                confirmarEliminarActividad(
                    referencia.id
                );
                break;
            // ABRIR SEGUIMIENTO INSTITUCIONAL.
            case 'seguimiento':
                if (referencia.origen !== 'FT147') {
                    return;
                }
                await abrirSeguimientoSemanal(
                    referencia.id
                );
                break;
            // COMPLETAR PROGRAMACIÓN SEMANAL.
            case 'completar-semana':
                if (
                    referencia.origen !== 'FT147' ||
                    !referencia.semanaId
                ) {
                    return;
                }
                await abrirCambioEstado(
                    clave,
                    'COMPLETADA'
                );
                break;
            // CAMBIAR ESTADO DE PROGRAMACIÓN SEMANAL.
            case 'estado-semana':
                if (
                    referencia.origen !== 'FT147' ||
                    !referencia.semanaId
                ) {
                    return;
                }
                await abrirCambioEstado(clave);
                break;
            // EDITAR PROGRAMACIÓN SEMANAL.
            case 'editar-programacion':
                if (
                    referencia.origen !== 'FT147' ||
                    !referencia.semanaId
                ) {
                    return;
                }
                abrirProgramacionSemanal(
                    referencia.id,
                    referencia.semanaId
                );
                break;
            // DIAGNÓSTICO DE ACCIONES DESCONOCIDAS.
            default:
                console.warn(
                    '[Transformín] Acción desconocida:',
                    accion
                );
        }
    }
    // ========================================================
    // 80. EVENTOS DELEGADOS DE ACTIVIDADES
    //
    // Registra los eventos sobre contenedores permanentes.
    //
    // Permite que los botones generados dinámicamente
    // continúen funcionando después de actualizar las
    // tablas, el calendario o la agenda.
    // ========================================================
    function configurarAccionesActividades() {
        const contenedores = [
            'tablaActividadesBody',
            'tablaInstitucionalBody',
            'tablaSeguimientoSemanal',
            'calendarioGrid',
            'listaAgenda',
            'listaEventosSinFecha'
        ];
        contenedores.forEach(id => {
            enlazar(
                id,
                'click',
                eventoSeguro(async evento => {
                    // Localiza el botón correspondiente,
                    // incluso cuando se pulsa su icono.
                    const boton = evento.target.closest(
                        '[data-accion]'
                    );
                    // Ignora botones inexistentes o bloqueados.
                    if (!boton || boton.disabled) {
                        return;
                    }
                    const accion =
                        boton.dataset.accion;
                    // ========================================
                    // SELECCIONAR FECHA DEL CALENDARIO
                    //
                    // Esta acción no requiere un identificador
                    // de actividad ni una referencia compuesta.
                    // ========================================
                    if (
                        accion === 'seleccionar-fecha'
                    ) {
                        seleccionarFecha(
                            boton.dataset.fecha
                        );
                        return;
                    }
                    // ========================================
                    // EJECUTAR ACCIÓN DEL REGISTRO
                    // ========================================
                    await ejecutarAccionActividad(
                        accion,
                        boton.dataset.clave
                    );
                })
            );
        });
    }
    // ========================================================
    // 81. CONFIGURACIÓN DE FILTROS Y PAGINACIONES
    //
    // Centraliza los filtros de:
    //
    // - Actividades manuales.
    // - Actividades institucionales.
    // - Seguimiento semanal.
    // - Calendario mensual.
    //
    // Utiliza debounce para evitar ejecutar búsquedas
    // innecesarias mientras el usuario está escribiendo.
    // ========================================================
    function configurarFiltrosActividades() {
        // ====================================================
        // BÚSQUEDA DE ACTIVIDADES MANUALES
        // ====================================================
        enlazar(
            'buscarActividad',
            'input',
            debounce(() =>
                aplicarFiltrosActividades()
            )
        );
        // ====================================================
        // FILTROS DE ACTIVIDADES MANUALES
        // ====================================================
        enlazarVarios(
            [
                'filtroMes',
                'filtroEstado',
                'filtroTipo'
            ],
            'change',
            () => aplicarFiltrosActividades()
        );
        // Restablece los filtros.
        enlazar(
            'btnLimpiarFiltros',
            'click',
            limpiarFiltrosActividades
        );
        // ====================================================
        // PAGINACIÓN DE ACTIVIDADES MANUALES
        // ====================================================
        enlazarPaginacion(
            'paginacionActividades',
            pagina => {
                estado.pagina = pagina;
                pintarActividades();
            }
        );
        // ====================================================
        // BÚSQUEDA DE ACTIVIDADES INSTITUCIONALES
        // ====================================================
        enlazar(
            'buscarInstitucional',
            'input',
            debounce(() =>
                aplicarFiltrosInstitucionales()
            )
        );
        // ====================================================
        // FILTROS INSTITUCIONALES FT-SST-147
        // ====================================================
        enlazarVarios(
            [
                'filtroInstitucionalMes',
                'filtroInstitucionalEstado'
            ],
            'change',
            () => aplicarFiltrosInstitucionales()
        );
        // Restablece los filtros institucionales.
        enlazar(
            'btnLimpiarInstitucional',
            'click',
            limpiarFiltrosInstitucionales
        );
        // ====================================================
        // PAGINACIÓN INSTITUCIONAL
        // ====================================================
        enlazarPaginacion(
            'paginacionInstitucional',
            pagina => {
                estado.paginaInstitucional = pagina;
                pintarInstitucional();
            }
        );
        // ====================================================
        // FILTROS DE SEGUIMIENTO SEMANAL
        // ====================================================
        enlazarVarios(
            [
                'filtroSeguimientoMes',
                'filtroSeguimientoEstado'
            ],
            'change',
            pintarSeguimientoSemanal
        );
        // ====================================================
        // FILTROS DEL CALENDARIO
        //
        // Actualiza simultáneamente el calendario, la agenda
        // y las actividades pendientes de fecha exacta.
        // ====================================================
        enlazarVarios(
            [
                'filtroCalendarioTipo',
                'filtroCalendarioEstado'
            ],
            'change',
            () => {
                pintarCalendario();
                pintarAgenda();
                pintarEventosSinFecha();
            }
        );
    }
    // ========================================================
    // 82. CONFIGURAR NAVEGACIÓN DEL CALENDARIO
    //
    // Gestiona los botones de navegación mensual,
    // regreso al día actual y consulta de actividades.
    // ========================================================
    function configurarCalendario() {
        // Navegar al mes anterior.
        enlazar(
            'btnMesAnterior',
            'click',
            eventoSeguro(() => cambiarMes(-1))
        );
        // Navegar al mes siguiente.
        enlazar(
            'btnMesSiguiente',
            'click',
            eventoSeguro(() => cambiarMes(1))
        );
        // Regresar a la fecha actual.
        enlazar(
            'btnIrHoy',
            'click',
            eventoSeguro(irHoy)
        );
        // Abrir la pestaña de actividades manuales.
        enlazar(
            'btnVerTodasActividades',
            'click',
            mostrarTodasActividades
        );
    }
    // ========================================================
    // 83. CONFIGURAR FORMULARIOS DE ACTIVIDADES
    //
    // Conecta los formularios y botones con las funciones
    // responsables de consultar y modificar los registros.
    // ========================================================
    function configurarFormulariosActividades() {
        // ====================================================
        // ABRIR FORMULARIO DE NUEVA ACTIVIDAD
        // ====================================================
        enlazarVarios(
            [
                'btnNuevaActividad',
                'btnNuevaActividadTabla'
            ],
            'click',
            () => nuevaActividad()
        );
        // ====================================================
        // GUARDAR ACTIVIDAD MANUAL
        // ====================================================
        enlazar(
            'formActividad',
            'submit',
            eventoSeguro(guardarActividad)
        );
        // ====================================================
        // GUARDAR ACTIVIDAD INSTITUCIONAL
        // ====================================================
        enlazar(
            'formActividadInstitucional',
            'submit',
            eventoSeguro(
                guardarActividadInstitucional
            )
        );
        // ====================================================
        // GUARDAR CAMBIO DE ESTADO
        // ====================================================
        enlazar(
            'formCambiarEstado',
            'submit',
            eventoSeguro(guardarCambioEstado)
        );
        // Actualiza los campos según el estado seleccionado.
        enlazar(
            'nuevoEstadoActividad',
            'change',
            actualizarCamposCambioEstado
        );
        // ====================================================
        // GUARDAR PROGRAMACIÓN SEMANAL
        // ====================================================
        enlazar(
            'formProgramacionSemanal',
            'submit',
            eventoSeguro(
                guardarProgramacionSemanal
            )
        );
        // Actualiza las semanas disponibles según el mes.
        enlazar(
            'programacionMes',
            'change',
            () => configurarSemanasProgramacion()
        );
        // ====================================================
        // ACTIVAR O DESACTIVAR PROGRAMACIÓN
        // ====================================================
        enlazar(
            'programacionActiva',
            'change',
            () => {
                visible(
                    'avisoDesactivarProgramacion',
                    !marcado('programacionActiva')
                );
            }
        );
        // ====================================================
        // CREAR NUEVA PROGRAMACIÓN SEMANAL
        // ====================================================
        enlazar(
            'btnNuevaProgramacion',
            'click',
            eventoSeguro(() => {
                const actividad =
                    estado.institucionalSeleccionada;
                if (!actividad) {
                    throw new Error(
                        'Selecciona una actividad institucional.'
                    );
                }
                abrirProgramacionSemanal(
                    actividad.id
                );
            })
        );
        // ====================================================
        // ACTUALIZAR SEGUIMIENTO SEMANAL
        //
        // Consulta nuevamente los datos del registro
        // seleccionado desde el backend.
        // ====================================================
        enlazar(
            'btnActualizarSeguimientoSemanal',
            'click',
            eventoSeguro(async () => {
                const id = campo(
                    'seguimientoActividadId'
                );
                if (id) {
                    await abrirSeguimientoSemanal(id);
                }
            })
        );
        // ====================================================
        // ACTUALIZAR CRONOGRAMA INSTITUCIONAL
        //
        // Sincroniza las actividades institucionales,
        // los eventos del calendario y el cumplimiento.
        // ====================================================
        enlazar(
            'btnActualizarInstitucional',
            'click',
            eventoSeguro(async () => {
                await conCarga(async () => {
                    await cargarInstitucional();
                    await cargarCalendarioInstitucional();
                    await cargarCumplimiento();
                });
                notificar(
                    'Cronograma institucional actualizado.'
                );
            })
        );
        // Asignación inicial explícita: el servidor protege las fechas existentes.
        enlazar('btnAsignarFechasInstitucionales', 'click', eventoSeguro(async () => {
            if (cronogramaCerrado()) throw new Error('El cronograma está cerrado.');
            const anio = estado.anio;
            if (!window.confirm(`¿Asignar las fechas sugeridas faltantes de ${anio}?`)) return;
            await ejecutarOperacion('asignar-fechas-institucionales', async () => {
                const respuesta = await peticion(RUTAS.asignarFechasInstitucionales, {method: 'POST', body: {anio}});
                notificar(`Fechas asignadas: ${numero(respuesta.asignadas)}. Omitidas: ${numero(respuesta.omitidas)}.`);
                await actualizarGestionActividades();
            }, ['btnAsignarFechasInstitucionales']);
        }));
        // ====================================================
        // EDITAR ACTIVIDAD DESDE EL DETALLE DEL EVENTO
        // ====================================================
        enlazar(
            'btnEditarEventoDetalle',
            'click',
            eventoSeguro(editarEventoDetalle)
        );
        // ====================================================
        // COMPLETAR ACTIVIDAD DESDE EL DETALLE
        // ====================================================
        enlazar(
            'btnCompletarEventoDetalle',
            'click',
            eventoSeguro(completarEventoDetalle)
        );
        // ====================================================
        // CONFIRMAR ELIMINACIÓN DE ACTIVIDAD
        //
        // Conserva la compatibilidad con los diferentes
        // identificadores del botón de confirmación.
        // ====================================================
        const modalEliminar = $(
            'modalEliminarActividad'
        );
        const botonEliminar =
            $('btnConfirmarEliminar') ||
            $('btnConfirmarEliminarActividad') ||
            modalEliminar?.querySelector(
                '.modal-footer .btn-danger'
            );
        if (botonEliminar) {
            botonEliminar.addEventListener(
                'click',
                eventoSeguro(eliminarActividad)
            );
        }
    }
    // ========================================================
    // 84. RUTAS DE RECURSOS HUMANOS Y NOTIFICACIONES
    // ========================================================
    const RUTAS_RH = {
        cumpleanos: '/cumpleanos',
        indicadores: '/cumpleanos/indicadores',
        alertas: '/cumpleanos/alertas',
        servicio: '/cumpleanos/servicio',
        calendario: '/cumpleanos/calendario/eventos',
        configuracion: '/configuracion',
        restablecer: '/configuracion/restablecer',
        smtp: '/cumpleanos/smtp/verificar',
        empleado: id =>
            `/cumpleanos/${encodeURIComponent(id)}`,
        configuracionEmpleado: id =>
            `/cumpleanos/${encodeURIComponent(id)}/configuracion`,
        tarjeta: id =>
            `/cumpleanos/${encodeURIComponent(id)}/tarjeta`,
        descargarTarjeta: id =>
            `/cumpleanos/${encodeURIComponent(id)}/tarjeta/descargar`,
        historial: '/cumpleanos/historial'
    };
    // ========================================================
    // 85. ESTADO COMPLEMENTARIO DE RECURSOS HUMANOS
    //
    // Conserva la información de los colaboradores,
    // configuraciones individuales, tarjetas y alertas.
    //
    // Los envíos reales permanecen deshabilitados hasta
    // consultar la configuración autorizada del servidor.
    // ========================================================
    Object.assign(estado, {
        cumpleanos: [],
        cumpleanosFiltrados: [],
        eventosCumpleanos: [],
        alertasCumpleanos: [],
        indicadoresCumpleanos: {},
        cumpleanosSeleccionado: null,
        paginaCumpleanos: 1,
        porPaginaCumpleanos: 9,
        configuracionRecordatorios: null,
        servicioCumpleanos: null,
        enviosHabilitados: false,
        tarjetaEmpleadoId: null,
        tarjetaURL: null,
        tarjetaBlob: null,
        tarjetaVersion: 0,
        controladorTarjeta: null,
        verificandoSMTP: false,
        guardandoCumpleanos: false,
        guardandoConfiguracion: false
    });
    // ========================================================
    // 86. FUNCIONES AUXILIARES DE RECURSOS HUMANOS
    // ========================================================
    // Convierte valores provenientes de MySQL o del backend
    // en valores booleanos utilizados por la interfaz.
    function booleanoRH(valor, predeterminado = false) {
        if (
            valor === undefined ||
            valor === null ||
            valor === ''
        ) {
            return predeterminado;
        }
        return [
            true,
            1,
            '1',
            'true',
            'SI',
            'SÍ'
        ].includes(valor);
    }
    // Convierte un valor en entero conservando los nulos.
    // Es utilizado para configuraciones personalizadas
    // y días de anticipación.
    function enteroNullableRH(valor) {
        if (
            valor === undefined ||
            valor === null ||
            valor === ''
        ) {
            return null;
        }
        const resultado = Number(valor);
        return Number.isInteger(resultado)
            ? resultado
            : null;
    }
    // Valida una hora en formato de 24 horas: HH:mm.
    function horaValidaRH(valor) {
        return /^([01]\d|2[0-3]):[0-5]\d$/.test(
            String(valor || '')
        );
    }
    // Convierte las horas provenientes de MySQL
    // del formato HH:mm:ss al formato HH:mm.
    function normalizarHoraRH(valor) {
        if (!valor) return '';
        const hora = String(valor).substring(0, 5);
        return horaValidaRH(hora)
            ? hora
            : '';
    }
    // Comprueba el formato básico del correo electrónico.
    // La existencia y disponibilidad del correo deben
    // verificarse mediante el servicio correspondiente.
    function correoValidoRH(valor) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
            String(valor || '').trim()
        );
    }
    // Genera las iniciales del colaborador para
    // representar su avatar dentro de la interfaz.
    function inicialesEmpleado(nombre) {
        const palabras = String(nombre || '')
            .trim()
            .split(/\s+/)
            .filter(Boolean);
        return palabras
            .slice(0, 2)
            .map(palabra =>
                palabra.charAt(0).toUpperCase()
            )
            .join('') || 'RH';
    }
    // Genera nombres seguros para los archivos de tarjetas.
    // Elimina caracteres especiales, espacios y tildes.
    function nombreArchivoSeguroRH(nombre) {
        return String(nombre || 'colaborador')
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-zA-Z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '')
            .toLowerCase()
            .substring(0, 100);
    }
    // ========================================================
    // 87. NORMALIZACIÓN DE CUMPLEAÑOS
    //
    // Unifica los datos provenientes de Recursos Humanos
    // y las configuraciones individuales de Transformín.
    //
    // Conserva:
    //
    // - Identificador del colaborador.
    // - Nombre completo.
    // - Área y cargo.
    // - Correo electrónico.
    // - Fecha de nacimiento.
    // - Próximo cumpleaños.
    // - Días restantes.
    // - Configuración de alertas.
    // - Configuración de felicitaciones.
    // - Hora personalizada.
    // - Asunto y mensaje personalizados.
    // ========================================================
    function normalizarCumpleanos(datos = {}) {
        const configuracion =
            datos.configuracion_personalizada ||
            datos.configuracion ||
            {};
        // ====================================================
        // IDENTIFICADOR DEL COLABORADOR
        // ====================================================
        const id =
            datos.empleado_id ??
            datos.empleadoId ??
            datos.id;
        // ====================================================
        // CORREO ELECTRÓNICO
        // ====================================================
        const correo = String(
            datos.email ||
            datos.correo ||
            ''
        ).trim();
        // ====================================================
        // FECHAS DE CUMPLEAÑOS
        // ====================================================
        const fechaNacimiento = fechaISO(
            datos.fecha_nacimiento
        );
        const fechaCumpleanos = fechaISO(
            datos.proximo_cumpleanos ||
            datos.fecha_cumpleanos ||
            datos.fecha
        );
        const fechaAnual = fechaISO(
            datos.fecha_anual
        );
        // ====================================================
        // DÍAS RESTANTES PARA EL CUMPLEAÑOS
        // ====================================================
        const diasRestantes = enteroNullableRH(
            datos.dias_restantes ??
            datos.diasRestantes
        );
        // ====================================================
        // CONFIGURACIONES PERSONALIZADAS
        // ====================================================
        const diasPersonalizados =
            datos.dias_anticipacion_personalizados !== undefined
                ? datos.dias_anticipacion_personalizados
                : configuracion.dias_anticipacion;
        const horaPersonalizada =
            datos.hora_envio_personalizada !== undefined
                ? datos.hora_envio_personalizada
                : configuracion.hora_envio;
        // ====================================================
        // ESTRUCTURA NORMALIZADA DEL COLABORADOR
        // ====================================================
        return {
            ...datos,
            id: id == null ? '' : String(id),
            empleado_id: id == null ? '' : String(id),
            origen: 'CUMPLEANOS',
            tipo: 'CUMPLEANOS',
            // INFORMACIÓN PERSONAL.
            nombre:
                datos.nombre_completo ||
                datos.nombre ||
                'Colaborador',
            // INFORMACIÓN LABORAL.
            area:
                datos.area_nombre ||
                datos.nombre_area ||
                datos.area ||
                'Sin área asignada',
            cargo:
                datos.cargo_nombre ||
                datos.nombre_cargo ||
                datos.cargo ||
                'Sin cargo registrado',
            // INFORMACIÓN DE CONTACTO.
            correo,
            email: correo,
            correoDisponible: correoValidoRH(correo),
            // INFORMACIÓN DE CUMPLEAÑOS.
            fecha_nacimiento: fechaNacimiento,
            fecha: fechaCumpleanos,
            fecha_anual: fechaAnual,
            fecha_cumpleanos: fechaCumpleanos,
            diasRestantes,
            // IDENTIFICACIÓN DE CUMPLEAÑOS DEL DÍA.
            esHoy: booleanoRH(
                datos.es_hoy ??
                datos.esHoy,
                diasRestantes === 0
            ),
            // CONFIGURACIÓN INDIVIDUAL DE ALERTAS.
            alertaActiva: booleanoRH(
                datos.alerta_activa ??
                datos.alertaActiva ??
                configuracion.alerta_activa,
                true
            ),
            // CONFIGURACIÓN INDIVIDUAL DE FELICITACIONES.
            felicitacionActiva: booleanoRH(
                datos.felicitacion_activa ??
                datos.felicitacionActiva ??
                configuracion.felicitacion_activa,
                true
            ),
            // ANTICIPACIÓN GENERAL.
            diasAnticipacion: enteroNullableRH(
                datos.dias_anticipacion ??
                datos.diasAnticipacion
            ),
            // ANTICIPACIÓN PERSONALIZADA.
            diasPersonalizados: enteroNullableRH(
                diasPersonalizados
            ),
            // HORA GENERAL DE ENVÍO.
            horaEnvio: normalizarHoraRH(
                datos.hora_envio ??
                datos.horaEnvio
            ),
            // HORA PERSONALIZADA DE ENVÍO.
            horaPersonalizada: normalizarHoraRH(
                horaPersonalizada
            ),
            // ASUNTO PERSONALIZADO DEL CORREO.
            asuntoPersonalizado:
                datos.asunto_personalizado ??
                datos.asuntoPersonalizado ??
                configuracion.asunto_personalizado ??
                '',
            // MENSAJE PERSONALIZADO DE FELICITACIÓN.
            mensajePersonalizado:
                datos.mensaje_personalizado ??
                datos.mensajePersonalizado ??
                configuracion.mensaje_personalizado ??
                '',
            // OBSERVACIONES ADICIONALES.
            observaciones:
                datos.observaciones ??
                configuracion.observaciones ??
                ''
        };
    }
    // ========================================================
    // 88. CONSULTAR CUMPLEAÑOS DE COLABORADORES ACTIVOS
    //
    // Consulta los colaboradores entregados por la API
    // de integración con Recursos Humanos.
    //
    // El backend debe aplicar la validación de empleados
    // activos y los permisos de acceso correspondientes.
    // ========================================================
    async function cargarCumpleanos() {
        try {
            // Consulta la información de Recursos Humanos.
            const datos = await peticion(
                RUTAS_RH.cumpleanos,
                {
                    clavePeticion: 'cumpleanos',
                    cancelarAnterior: true
                }
            );
            // =================================================
            // NORMALIZAR COLABORADORES
            // =================================================
            estado.cumpleanos = extraerLista(
                datos,
                'cumpleanos',
                'empleados',
                'colaboradores'
            )
                .map(normalizarCumpleanos)
                .filter(empleado =>
                    esIdValido(empleado.id)
                );
            // =================================================
            // INDICADORES DE CUMPLEAÑOS
            // =================================================
            estado.indicadoresCumpleanos =
                datos.indicadores || {};
            // =================================================
            // ESTADO DE INTEGRACIÓN CON RECURSOS HUMANOS
            // =================================================
            pintarIntegracionRH(
                datos.integrado !== false
            );
            // =================================================
            // ACTUALIZAR COMPONENTES DE LA INTERFAZ
            // =================================================
            aplicarFiltrosCumpleanos();
            pintarIndicadoresCumpleanos();
            pintarCumpleanosHoy();
            return estado.cumpleanos;
        } catch (error) {
            // Ignora los errores producidos por solicitudes
            // canceladas voluntariamente.
            if (error.name !== 'AbortError') {
                pintarIntegracionRH(false);
                html(
                    'listaCumpleanos',
                    estadoVacio(
                        'Información no disponible',
                        'No fue posible consultar los colaboradores de Recursos Humanos.',
                        'fa-triangle-exclamation'
                    )
                );
            }
            // Permite que el controlador general gestione
            // los errores de inicialización o actualización.
            throw error;
        }
    }
    // ========================================================
    // 89. ESTADO VISUAL DE INTEGRACIÓN CON RH
    //
    // Actualiza los indicadores de conexión del módulo.
    //
    // Incluye data-estado para mantener compatibilidad
    // con los estilos corregidos del CSS.
    // ========================================================
    function pintarIntegracionRH(integrado) {
        // ====================================================
        // MENSAJE GENERAL DE INTEGRACIÓN
        // ====================================================
        texto(
            'estadoIntegracionRH',
            integrado
                ? 'Conectado con Recursos Humanos'
                : 'No fue posible consultar Recursos Humanos'
        );
        // ====================================================
        // ESTADO DEL SERVICIO
        // ====================================================
        texto(
            'estadoServicioRH',
            integrado
                ? 'Disponible'
                : 'No disponible'
        );
        // ====================================================
        // INDICADOR VISUAL DE ESTADO
        // ====================================================
        const badge = $('badgeIntegracionRH');
        if (badge) {
            // Elimina los estilos anteriores.
            badge.classList.remove(
                'bg-success',
                'bg-danger',
                'bg-warning',
                'bg-secondary'
            );
            // Aplica el estilo correspondiente.
            badge.classList.add(
                integrado
                    ? 'bg-success'
                    : 'bg-danger'
            );
            // Actualiza el texto visible.
            badge.textContent = integrado
                ? 'Integrado'
                : 'Sin conexión';
            // Compatibilidad con el CSS del módulo.
            badge.dataset.estado = integrado
                ? 'activo'
                : 'error';
        }
    }
    // ========================================================
    // 90. CONSULTAR INDICADORES DE CUMPLEAÑOS
    //
    // Recupera las estadísticas de cumpleaños,
    // alertas y felicitaciones desde el backend.
    // ========================================================
    async function cargarIndicadoresCumpleanos() {
        const datos = await peticion(
            RUTAS_RH.indicadores
        );
        // Conserva la compatibilidad con respuestas
        // directas y respuestas agrupadas.
        estado.indicadoresCumpleanos =
            datos.indicadores ||
            datos;
        // Actualiza los indicadores visuales.
        pintarIndicadoresCumpleanos();
        return estado.indicadoresCumpleanos;
    }
    // ========================================================
    // 91. RENDERIZAR INDICADORES DE CUMPLEAÑOS
    //
    // Presenta:
    //
    // - Total de colaboradores.
    // - Cumpleaños del mes.
    // - Cumpleaños del día.
    // - Felicitaciones enviadas.
    // - Alertas configuradas.
    // - Felicitaciones activas.
    // - Felicitaciones con errores.
    // ========================================================
    function pintarIndicadoresCumpleanos() {
        const indicadores =
            estado.indicadoresCumpleanos || {};
        const empleados = estado.cumpleanos;
        // ====================================================
        // IDENTIFICAR MES ACTUAL EN COLOMBIA
        // ====================================================
        const mesActual = Number(
            hoy().substring(5, 7)
        );
        // ====================================================
        // CALCULAR CUMPLEAÑOS DEL MES
        //
        // Se utiliza como respaldo cuando el servidor
        // no proporciona este indicador.
        // ====================================================
        const cumpleanosMes = empleados.filter(
            empleado => {
                const fecha =
                    empleado.fecha_nacimiento ||
                    empleado.fecha_anual ||
                    empleado.fecha;
                // Evita errores cuando un colaborador
                // no tiene una fecha registrada.
                if (!fecha || !fechaValida(fecha)) {
                    return false;
                }
                return Number(
                    fecha.substring(5, 7)
                ) === mesActual;
            }
        ).length;
        // ====================================================
        // TOTAL DE COLABORADORES
        // ====================================================
        texto(
            'totalCumpleanos',
            numeroTexto(
                indicadores.totalColaboradores ??
                indicadores.totalCumpleanos ??
                empleados.length
            )
        );
        // ====================================================
        // CUMPLEAÑOS DEL MES
        // ====================================================
        texto(
            'cumpleanosMes',
            numeroTexto(
                indicadores.cumpleanosMes ??
                cumpleanosMes
            )
        );
        // ====================================================
        // CUMPLEAÑOS DEL DÍA
        // ====================================================
        texto(
            'cumpleanosHoy',
            numeroTexto(
                indicadores.cumpleanosHoy ??
                empleados.filter(
                    empleado => empleado.esHoy
                ).length
            )
        );
        // ====================================================
        // FELICITACIONES ENVIADAS
        //
        // El valor debe provenir del historial registrado
        // por el servicio de notificaciones del backend.
        // ====================================================
        texto(
            'felicitacionesEnviadas',
            numeroTexto(
                indicadores.felicitacionesEnviadas
            )
        );
        // ====================================================
        // TOTAL DE ALERTAS CONFIGURADAS
        // ====================================================
        texto(
            'totalAlertasCumpleanos',
            numeroTexto(
                indicadores.alertasConfiguradas ??
                empleados.filter(
                    empleado => empleado.alertaActiva
                ).length
            )
        );
        // ====================================================
        // TOTAL DE FELICITACIONES ACTIVAS
        //
        // Representa configuraciones individuales activas.
        // No significa que el envío real esté habilitado.
        // ====================================================
        texto(
            'totalFelicitacionesActivas',
            numeroTexto(
                indicadores.felicitacionesActivas ??
                empleados.filter(
                    empleado => empleado.felicitacionActiva
                ).length
            )
        );
        // ====================================================
        // TOTAL DE FELICITACIONES CON ERRORES
        // ====================================================
        texto(
            'totalFelicitacionesError',
            numeroTexto(
                indicadores.felicitacionesConError
            )
        );
    }
    // ========================================================
    // 92. FILTROS DE CUMPLEAÑOS
    //
    // Permite buscar colaboradores por nombre, área,
    // cargo y correo electrónico.
    //
    // También permite filtrar por mes y proximidad.
    // ========================================================
    function aplicarFiltrosCumpleanos(
        reiniciarPagina = true
    ) {
        const busqueda = normalizar(
            campo('buscarCumpleanos')
        );
        const mes = campo(
            'filtroCumpleanosMes'
        );
        const periodo = String(
            campo('filtroCumpleanosPeriodo') ||
            'TODOS'
        ).toUpperCase();
        estado.cumpleanosFiltrados =
            estado.cumpleanos.filter(empleado => {
                // BÚSQUEDA GENERAL DEL COLABORADOR.
                const contenido = normalizar([
                    empleado.nombre,
                    empleado.area,
                    empleado.cargo,
                    empleado.correo
                ].join(' '));
                if (
                    busqueda &&
                    !contenido.includes(busqueda)
                ) {
                    return false;
                }
                // OBTENER FECHA DE REFERENCIA.
                const fecha =
                    empleado.fecha_nacimiento ||
                    empleado.fecha_anual ||
                    empleado.fecha ||
                    '';
                // FILTRAR POR MES.
                if (
                    mes &&
                    mes !== 'TODOS' &&
                    (
                        !fechaValida(fecha) ||
                        Number(fecha.substring(5, 7)) !==
                            Number(mes)
                    )
                ) {
                    return false;
                }
                // FILTRAR CUMPLEAÑOS DEL DÍA.
                if (
                    periodo === 'HOY' &&
                    !empleado.esHoy
                ) {
                    return false;
                }
                // FILTRAR PRÓXIMOS 30 DÍAS.
                if (
                    ['PROXIMOS', 'PROXIMOS30']
                        .includes(periodo)
                ) {
                    if (
                        empleado.diasRestantes === null ||
                        empleado.diasRestantes < 0 ||
                        empleado.diasRestantes > 30
                    ) {
                        return false;
                    }
                }
                return true;
            });
        // ====================================================
        // ORDENAR RESULTADOS
        //
        // Los cumpleaños más próximos aparecen primero.
        // Cuando coinciden, se ordenan alfabéticamente.
        // ====================================================
        estado.cumpleanosFiltrados.sort(
            (a, b) =>
                (a.diasRestantes ?? Infinity) -
                (b.diasRestantes ?? Infinity) ||
                a.nombre.localeCompare(
                    b.nombre,
                    'es-CO'
                )
        );
        // Reinicia la paginación al modificar los filtros.
        if (reiniciarPagina) {
            estado.paginaCumpleanos = 1;
        }
        pintarCumpleanos();
    }
    // ========================================================
    // 93. LIMPIAR FILTROS DE CUMPLEAÑOS
    //
    // Restablece la búsqueda y los selectores sin modificar
    // la información almacenada de los colaboradores.
    // ========================================================
    function limpiarFiltrosCumpleanos() {
        setCampo('buscarCumpleanos', '');
        [
            'filtroCumpleanosMes',
            'filtroCumpleanosPeriodo'
        ].forEach(id => {
            const selector = $(id);
            if (selector) {
                selector.selectedIndex = 0;
            }
        });
        aplicarFiltrosCumpleanos();
    }
    // ========================================================
    // 94. TEXTO DE PROXIMIDAD DEL CUMPLEAÑOS
    //
    // Genera mensajes según la cantidad de días restantes
    // para el próximo cumpleaños del colaborador.
    // ========================================================
    function textoProximidadCumpleanos(empleado) {
        if (empleado.esHoy) {
            return 'Cumpleaños hoy';
        }
        const dias = empleado.diasRestantes;
        // FECHA NO DISPONIBLE.
        if (dias === null || dias === undefined) {
            return 'Fecha no disponible';
        }
        // CUMPLEAÑOS DEL DÍA SIGUIENTE.
        if (dias === 1) {
            return 'Cumpleaños mañana';
        }
        // PRÓXIMO CUMPLEAÑOS.
        if (dias >= 0) {
            return `Faltan ${dias} días`;
        }
        return 'Consultar próxima celebración';
    }
    // ========================================================
    // 95. ESTADOS DE ALERTAS Y FELICITACIONES
    //
    // Genera indicadores visuales independientes para
    // las configuraciones individuales de cada colaborador.
    //
    // Una felicitación configurada como activa no implica
    // que el servidor tenga habilitado el envío real.
    // ========================================================
    function badgeConfiguracionCumpleanos(
        activo,
        textoActivo,
        textoInactivo
    ) {
        return `
            <span
                class="cumpleanos-configuracion-estado
                    ${activo ? 'activo' : 'inactivo'}"
                data-estado="${activo ? 'activo' : 'inactivo'}"
            >

                <i class="fas ${
                    activo
                        ? 'fa-circle-check'
                        : 'fa-circle-minus'
                }" aria-hidden="true"></i>

                ${escapar(
                    activo
                        ? textoActivo
                        : textoInactivo
                )}

            </span>
        `;
    }
    // ========================================================
    // 96. RENDERIZAR TARJETA DE COLABORADOR
    //
    // Presenta la información laboral, cumpleaños,
    // correo electrónico y configuración individual.
    //
    // Conserva las clases del CSS de Transformín.
    // ========================================================
    function crearTarjetaColaborador(empleado) {
        const identificadorValido = esIdValido(
            empleado.id
        );
        return `
            <article class="cumpleanos-card
                ${empleado.esHoy ? 'cumpleanos-hoy' : ''}">

                <!-- =======================================
                     ENCABEZADO DEL COLABORADOR
                ======================================== -->

                <div class="cumpleanos-card-header">

                    <!-- AVATAR -->

                    <div class="cumpleanos-avatar">
                        ${escapar(
                            inicialesEmpleado(empleado.nombre)
                        )}
                    </div>

                    <!-- IDENTIDAD LABORAL -->

                    <div class="cumpleanos-card-identidad">

                        <h3>
                            ${escapar(empleado.nombre)}
                        </h3>

                        <span>
                            ${escapar(empleado.area)}
                        </span>

                        <small>
                            ${escapar(empleado.cargo)}
                        </small>

                    </div>

                </div>

                <!-- =======================================
                     INFORMACIÓN DEL CUMPLEAÑOS
                ======================================== -->

                <div class="cumpleanos-card-body">

                    <!-- FECHA DEL PRÓXIMO CUMPLEAÑOS -->

                    <div class="cumpleanos-fecha">

                        <i class="fas fa-cake-candles"
                           aria-hidden="true"></i>

                        <div>

                            <small>Próximo cumpleaños</small>

                            <strong>
                                ${escapar(
                                    fechaBonita(empleado.fecha)
                                )}
                            </strong>

                        </div>

                    </div>

                    <!-- PROXIMIDAD DEL CUMPLEAÑOS -->

                    <div class="cumpleanos-proximidad
                        ${empleado.esHoy ? 'es-hoy' : ''}">

                        ${escapar(
                            textoProximidadCumpleanos(
                                empleado
                            )
                        )}

                    </div>

                    <!-- CORREO ELECTRÓNICO -->

                    <div class="cumpleanos-correo">

                        <i class="fas fa-envelope"
                           aria-hidden="true"></i>

                        <span>
                            ${escapar(
                                empleado.correo ||
                                'Sin correo registrado'
                            )}
                        </span>

                    </div>

                    <!-- ===================================
                         CONFIGURACIÓN INDIVIDUAL
                    ==================================== -->

                    <div class="cumpleanos-estados">

                        ${badgeConfiguracionCumpleanos(
                            empleado.alertaActiva,
                            'Alerta activa',
                            'Alerta desactivada'
                        )}

                        ${badgeConfiguracionCumpleanos(
                            empleado.felicitacionActiva,
                            'Felicitación activa',
                            'Felicitación desactivada'
                        )}

                    </div>

                    <!-- AVISO DE CORREO NO DISPONIBLE -->

                    ${
                        !empleado.correoDisponible
                            ? `
                                <div class="cumpleanos-aviso">

                                    <i class="fas fa-circle-info"
                                       aria-hidden="true"></i>

                                    No dispone de un correo válido
                                    para felicitaciones automáticas.

                                </div>
                            `
                            : ''
                    }

                </div>

                <!-- =======================================
                     ACCIONES DEL COLABORADOR
                ======================================== -->

                <div class="cumpleanos-card-footer">

                    <!-- CONFIGURACIÓN INDIVIDUAL -->

                    <button
                        type="button"
                        class="btn btn-outline-primary"
                        data-accion="editar-cumpleanos"
                        data-empleado-id="${escapar(empleado.id)}"
                        ${!identificadorValido ? 'disabled' : ''}
                    >

                        <i class="fas fa-gear"
                           aria-hidden="true"></i>

                        Configurar

                    </button>

                    <!-- VISTA PREVIA DE TARJETA -->

                    <button
                        type="button"
                        class="btn btn-outline-success"
                        data-accion="ver-tarjeta"
                        data-empleado-id="${escapar(empleado.id)}"
                        ${!identificadorValido ? 'disabled' : ''}
                    >

                        <i class="fas fa-image"
                           aria-hidden="true"></i>

                        Ver tarjeta

                    </button>

                </div>

            </article>
        `;
    }
    // ========================================================
    // 97. LISTADO Y PAGINACIÓN DE CUMPLEAÑOS
    //
    // Utiliza las funciones generales de paginación
    // definidas en la parte 04.
    //
    // Mantiene una paginación independiente de las
    // actividades manuales e institucionales.
    // ========================================================
    function pintarCumpleanos() {
        const resultado = paginar(
            estado.cumpleanosFiltrados,
            estado.paginaCumpleanos,
            estado.porPaginaCumpleanos
        );
        // SINCRONIZAR PÁGINA ACTUAL.
        estado.paginaCumpleanos =
            resultado.pagina;
        // ACTUALIZAR CONTADOR GENERAL.
        texto(
            'contadorCumpleanos',
            `${resultado.total} colaboradores`
        );
        // ====================================================
        // MOSTRAR RESULTADOS
        // ====================================================
        if (!resultado.total) {
            html(
                'listaCumpleanos',
                estadoVacio(
                    'Sin cumpleaños encontrados',
                    'No hay colaboradores que coincidan con los filtros seleccionados.',
                    'fa-cake-candles'
                )
            );
        } else {
            html(
                'listaCumpleanos',
                resultado.registros
                    .map(crearTarjetaColaborador)
                    .join('')
            );
        }
        // ====================================================
        // ACTUALIZAR CONTADOR DE RESULTADOS
        // ====================================================
        pintarContador(
            'contadorResultadosCumpleanos',
            resultado,
            'colaboradores'
        );
        // ====================================================
        // ACTUALIZAR CONTROLES DE PAGINACIÓN
        // ====================================================
        pintarPaginacionGeneral(
            'paginacionCumpleanos',
            resultado.pagina,
            resultado.totalPaginas
        );
    }
    // ========================================================
    // 98. CUMPLEAÑOS DEL DÍA
    //
    // Identifica los colaboradores que cumplen años hoy.
    //
    // Permite consultar su tarjeta personalizada sin
    // realizar automáticamente un envío de correo.
    // ========================================================
    function pintarCumpleanosHoy() {
        const empleados = estado.cumpleanos.filter(
            empleado => empleado.esHoy
        );
        // Oculta la sección cuando no hay cumpleaños.
        visible(
            'contenedorCumpleanosHoy',
            empleados.length > 0
        );
        // ====================================================
        // GENERAR LISTADO DE CUMPLEAÑOS DEL DÍA
        // ====================================================
        html(
            'listaCumpleanosHoy',
            empleados.map(empleado => `
                <div class="cumpleanos-hoy-item">

                    <!-- AVATAR -->

                    <div class="cumpleanos-avatar">
                        ${escapar(
                            inicialesEmpleado(empleado.nombre)
                        )}
                    </div>

                    <!-- INFORMACIÓN DEL COLABORADOR -->

                    <div class="cumpleanos-hoy-info">

                        <strong>
                            ${escapar(empleado.nombre)}
                        </strong>

                        <small>
                            ${escapar(empleado.area)}
                        </small>

                    </div>

                    <!-- CONSULTAR TARJETA PERSONALIZADA -->

                    <button
                        type="button"
                        class="btn btn-outline-success"
                        data-accion="ver-tarjeta"
                        data-empleado-id="${escapar(empleado.id)}"
                        ${!esIdValido(empleado.id) ? 'disabled' : ''}
                    >

                        <i class="fas fa-image"
                           aria-hidden="true"></i>

                        Ver tarjeta

                    </button>

                </div>
            `).join('')
        );
    }
    // ========================================================
    // 99. CONSULTAR ALERTAS DE CUMPLEAÑOS
    //
    // Recupera las alertas generadas por el backend según
    // la configuración general e individual.
    //
    // La anticipación y los permisos de acceso deben
    // validarse desde el servidor.
    // ========================================================
    async function cargarAlertasCumpleanos() {
        const datos = await peticion(
            RUTAS_RH.alertas
        );
        // NORMALIZAR ALERTAS RECIBIDAS.
        estado.alertasCumpleanos = extraerLista(
            datos,
            'alertas',
            'cumpleanos',
            'empleados'
        ).map(normalizarCumpleanos);
        // ACTUALIZAR INTERFAZ.
        pintarAlertasCumpleanos();
        return estado.alertasCumpleanos;
    }
    // ========================================================
    // 100. RENDERIZAR ALERTAS DE CUMPLEAÑOS
    //
    // Presenta las alertas correspondientes a colaboradores
    // cuya configuración individual se encuentra activa.
    //
    // Permite acceder directamente a su configuración.
    // ========================================================
    function pintarAlertasCumpleanos() {
        const alertas =
            estado.alertasCumpleanos.filter(
                empleado => empleado.alertaActiva
            );
        // ====================================================
        // ESTADO VACÍO
        // ====================================================
        if (!alertas.length) {
            html(
                'listaAlertasCumpleanos',
                estadoVacio(
                    'Sin alertas próximas',
                    'No hay cumpleaños dentro del periodo de anticipación configurado.',
                    'fa-bell-slash'
                )
            );
            return;
        }
        // ====================================================
        // GENERAR ALERTAS
        // ====================================================
        html(
            'listaAlertasCumpleanos',
            alertas.map(empleado => `
                <div class="cumpleanos-alerta-item">

                    <!-- ICONO SEGÚN PROXIMIDAD -->

                    <div class="cumpleanos-alerta-icono">

                        <i class="fas ${
                            empleado.esHoy
                                ? 'fa-cake-candles'
                                : 'fa-bell'
                        }" aria-hidden="true"></i>

                    </div>

                    <!-- INFORMACIÓN DE LA ALERTA -->

                    <div class="cumpleanos-alerta-info">

                        <strong>
                            ${escapar(empleado.nombre)}
                        </strong>

                        <span>
                            ${escapar(
                                textoProximidadCumpleanos(
                                    empleado
                                )
                            )}
                        </span>

                        <small>
                            ${escapar(
                                fechaBonita(empleado.fecha)
                            )}
                        </small>

                    </div>

                    <!-- CONFIGURACIÓN INDIVIDUAL -->

                    <button
                        type="button"
                        class="btn-tabla-accion btn-editar"
                        data-accion="editar-cumpleanos"
                        data-empleado-id="${escapar(empleado.id)}"
                        title="Configurar alerta"
                        aria-label="Configurar alerta"
                        ${!esIdValido(empleado.id) ? 'disabled' : ''}
                    >

                        <i class="fas fa-gear"
                           aria-hidden="true"></i>

                    </button>

                </div>
            `).join('')
        );
    }
    // ========================================================
    // 101. INTEGRACIÓN DE CUMPLEAÑOS CON EL CALENDARIO
    //
    // Consulta los cumpleaños correspondientes al año
    // seleccionado en el Cronograma de Transformín.
    //
    // Compatible con años anteriores y posteriores,
    // siempre que el backend genere las fechas del periodo.
    //
    // Los cumpleaños provenientes de Recursos Humanos
    // se mantienen separados de las actividades manuales
    // y las programaciones institucionales FT-SST-147.
    // ========================================================
    async function cargarCalendarioCumpleanos() {
        const anio = estado.anio;
        // ====================================================
        // CONSULTAR EVENTOS DE CUMPLEAÑOS
        // ====================================================
        const datos = await peticion(
            conAnio(
                RUTAS_RH.calendario,
                anio
            ),
            {
                clavePeticion: 'calendario-cumpleanos',
                cancelarAnterior: true
            }
        );
        // Evita mostrar respuestas de un periodo anterior.
        if (anio !== estado.anio) return;
        // ====================================================
        // NORMALIZAR EVENTOS
        // ====================================================
        estado.eventosCumpleanos = extraerLista(
            datos,
            'eventos',
            'cumpleanos'
        ).map(evento => ({
            ...evento,
            // IDENTIFICADOR DEL COLABORADOR.
            id: String(
                evento.empleado_id ??
                evento.empleadoId ??
                evento.id ??
                ''
            ),
            // ORIGEN DEL EVENTO.
            origen: 'CUMPLEANOS',
            // TIPO UTILIZADO POR EL CALENDARIO.
            tipo: 'CUMPLEANOS',
            // NOMBRE DEL COLABORADOR.
            nombre:
                evento.nombre ||
                evento.nombre_completo ||
                evento.titulo ||
                'Cumpleaños de colaborador',
            // FECHA CORRESPONDIENTE AL PERIODO.
            fecha: fechaISO(
                evento.fecha ||
                evento.fecha_anual
            ),
            // ÁREA RESPONSABLE.
            responsable: 'Recursos Humanos',
            // DESCRIPCIÓN DEL EVENTO.
            descripcion:
                evento.descripcion ||
                'Cumpleaños registrado en Recursos Humanos'
        })).filter(evento =>
            // Valida el identificador del colaborador.
            esIdValido(evento.id) &&
            // Valida la fecha del evento.
            fechaValida(evento.fecha) &&
            // Comprueba que pertenezca al año consultado.
            Number(evento.fecha.substring(0, 4)) === anio
        );
        // ====================================================
        // ACTUALIZAR CALENDARIO Y AGENDA
        // ====================================================
        pintarCalendario();
        pintarAgenda();
        return estado.eventosCumpleanos;
    }
    // ========================================================
    // 102. CONSULTAR CONFIGURACIÓN INDIVIDUAL
    //
    // Recupera la información del colaborador y su
    // configuración personalizada desde el backend.
    // ========================================================
    async function obtenerConfiguracionCumpleanos(id) {
        const empleadoId = validarId(id);
        const datos = await peticion(
            RUTAS_RH.configuracionEmpleado(empleadoId)
        );
        // Recupera la información del colaborador.
        const empleado =
            datos.empleado ||
            datos.colaborador ||
            datos.cumpleanos ||
            datos;
        // Normaliza la información y configuración individual.
        return normalizarCumpleanos({
            ...empleado,
            configuracion_personalizada:
                empleado.configuracion_personalizada ||
                datos.configuracion ||
                {}
        });
    }
    // ========================================================
    // 103. ABRIR CONFIGURACIÓN INDIVIDUAL
    //
    // Permite configurar:
    //
    // - Alertas individuales.
    // - Felicitaciones automáticas.
    // - Días de anticipación.
    // - Hora personalizada de envío.
    // - Asunto personalizado.
    // - Mensaje personalizado.
    // - Observaciones administrativas.
    //
    // Los datos provenientes de Recursos Humanos
    // permanecen protegidos contra modificaciones.
    // ========================================================
    async function abrirConfiguracionCumpleanos(id) {
        // CONSULTAR INFORMACIÓN DEL COLABORADOR.
        const empleado =
            await obtenerConfiguracionCumpleanos(id);
        estado.cumpleanosSeleccionado = empleado;
        // ====================================================
        // PREPARAR FORMULARIO
        // ====================================================
        limpiarFormulario('formEditarCumpleanos');
        limpiarErrorFormulario('errorCumpleanos');
        texto(
            'modalEditarCumpleanosTitulo',
            'Configurar cumpleaños'
        );
        // ====================================================
        // IDENTIFICADOR DEL COLABORADOR
        // ====================================================
        setCampo(
            'cumpleanosEmpleadoId',
            empleado.id
        );
        // ====================================================
        // INFORMACIÓN PERSONAL Y LABORAL
        // ====================================================
        texto(
            'cumpleanosEmpleadoAvatar',
            inicialesEmpleado(empleado.nombre)
        );
        texto(
            'cumpleanosEmpleadoNombre',
            empleado.nombre
        );
        texto(
            'cumpleanosEmpleadoArea',
            empleado.area
        );
        texto(
            'cumpleanosEmpleadoCargo',
            empleado.cargo
        );
        // ====================================================
        // FECHA Y CORREO PROVENIENTES DE RECURSOS HUMANOS
        // ====================================================
        setCampo(
            'cumpleanosFecha',
            empleado.fecha
        );
        setCampo(
            'cumpleanosCorreo',
            empleado.correo
        );
        // ====================================================
        // CONFIGURACIÓN INDIVIDUAL DE ALERTAS
        // ====================================================
        setMarcado(
            'cumpleanosAlertaActiva',
            empleado.alertaActiva
        );
        // ====================================================
        // CONFIGURACIÓN INDIVIDUAL DE FELICITACIONES
        // ====================================================
        setMarcado(
            'cumpleanosFelicitacionActiva',
            empleado.felicitacionActiva
        );
        // ====================================================
        // DÍAS DE ANTICIPACIÓN PERSONALIZADOS
        //
        // Un campo vacío indica que se utilizará
        // la configuración general del módulo.
        // ====================================================
        setCampo(
            'cumpleanosDiasAnticipacion',
            empleado.diasPersonalizados ?? ''
        );
        // ====================================================
        // HORA PERSONALIZADA DE ENVÍO
        // ====================================================
        setCampo(
            'cumpleanosHoraEnvio',
            empleado.horaPersonalizada || ''
        );
        // ====================================================
        // ASUNTO PERSONALIZADO
        // ====================================================
        setCampo(
            'cumpleanosAsunto',
            empleado.asuntoPersonalizado
        );
        // ====================================================
        // MENSAJE PERSONALIZADO
        // ====================================================
        setCampo(
            'cumpleanosMensaje',
            empleado.mensajePersonalizado
        );
        // ====================================================
        // OBSERVACIONES ADMINISTRATIVAS
        // ====================================================
        setCampo(
            'cumpleanosObservaciones',
            empleado.observaciones
        );
        // ====================================================
        // PROTEGER INFORMACIÓN DE RECURSOS HUMANOS
        //
        // La fecha y el correo no deben modificarse
        // directamente desde el Cronograma de Transformín.
        // ====================================================
        [
            'cumpleanosFecha',
            'cumpleanosCorreo'
        ].forEach(idCampo => {
            const elemento = $(idCampo);
            if (elemento) {
                elemento.readOnly = true;
            }
        });
        // ====================================================
        // ADVERTENCIA DE CORREO NO DISPONIBLE
        // ====================================================
        visible(
            'alertaCumpleanosSinCorreo',
            !empleado.correoDisponible
        );
        // Actualiza los valores heredados y personalizados.
        actualizarConfiguracionIndividualVisual();
        // Abre la ventana de configuración.
        abrirModal('modalEditarCumpleanos');
    }
    // ========================================================
    // 104. MOSTRAR CONFIGURACIÓN HEREDADA
    //
    // Determina los valores efectivos de configuración
    // utilizados para cada colaborador.
    //
    // Prioridad:
    //
    // 1. Configuración individual.
    // 2. Configuración general.
    // 3. Configuración disponible del colaborador.
    // 4. Valores predeterminados.
    // ========================================================
    function actualizarConfiguracionIndividualVisual() {
        const empleado =
            estado.cumpleanosSeleccionado;
        if (!empleado) return;
        const configuracion =
            estado.configuracionRecordatorios || {};
        // ====================================================
        // CONSULTAR VALORES DEL FORMULARIO
        // ====================================================
        const diasCampo = campo(
            'cumpleanosDiasAnticipacion'
        );
        const horaCampo = campo(
            'cumpleanosHoraEnvio'
        );
        // ====================================================
        // DETERMINAR ANTICIPACIÓN EFECTIVA
        //
        // Conserva el valor 0 como una configuración válida.
        //
        // Si no existe ninguna configuración disponible,
        // utiliza siete días como valor visual predeterminado.
        // ====================================================
        const diasEfectivos =
            diasCampo !== ''
                ? Number(diasCampo)
                : configuracion.diasAnticipacion ??
                  empleado.diasAnticipacion ??
                  7;
        // ====================================================
        // DETERMINAR HORA EFECTIVA
        //
        // Si no existe una hora personalizada o general,
        // utiliza las 08:00 como valor visual predeterminado.
        // ====================================================
        const horaEfectiva =
            horaCampo ||
            configuracion.horaFelicitaciones ||
            empleado.horaEnvio ||
            '08:00';
        // ====================================================
        // MOSTRAR CONFIGURACIÓN EFECTIVA
        // ====================================================
        texto(
            'cumpleanosAnticipacionEfectiva',
            `${diasEfectivos} días de anticipación`
        );
        texto(
            'cumpleanosHoraEfectiva',
            `${horaEfectiva} — hora de Colombia`
        );
        // ====================================================
        // VERIFICAR ESTADO INDIVIDUAL
        // ====================================================
        const activa = marcado(
            'cumpleanosFelicitacionActiva'
        );
        let mensaje;
        // ====================================================
        // ESTADO 01: FELICITACIÓN INDIVIDUAL DESACTIVADA
        // ====================================================
        if (!activa) {
            mensaje =
                'Felicitación individual desactivada.';
        // ====================================================
        // ESTADO 02: CORREO ELECTRÓNICO NO DISPONIBLE
        // ====================================================
        } else if (!empleado.correoDisponible) {
            mensaje =
                'Pendiente de registrar un correo válido en Recursos Humanos.';
        // ====================================================
        // ESTADO 03: ENVÍOS REALES DESHABILITADOS
        // ====================================================
        } else if (!estado.enviosHabilitados) {
            mensaje =
                'Configurada, pero los envíos reales están deshabilitados en el servidor.';
        // ====================================================
        // ESTADO 04: FELICITACIONES GENERALES DESACTIVADAS
        // ====================================================
        } else if (
            !configuracion.felicitacionesActivas
        ) {
            mensaje =
                'Configurada, pero las felicitaciones generales están desactivadas.';
        // ====================================================
        // ESTADO 05: FELICITACIÓN AUTOMÁTICA HABILITADA
        // ====================================================
        } else {
            mensaje =
                'Felicitación automática habilitada según la programación del servidor.';
        }
        // Actualiza el mensaje informativo del formulario.
        texto(
            'cumpleanosEstadoEnvioIndividual',
            mensaje
        );
    }
    // ========================================================
    // 105. VALIDAR CONFIGURACIÓN INDIVIDUAL
    //
    // Valida los campos antes de enviarlos al backend.
    //
    // Límites:
    //
    // - Anticipación: entre 0 y 60 días.
    // - Hora: formato de 24 horas.
    // - Asunto: máximo 255 caracteres.
    // - Mensaje: máximo 10.000 caracteres.
    // - Observaciones: máximo 10.000 caracteres.
    // ========================================================
    function obtenerDatosConfiguracionCumpleanos() {
        // ====================================================
        // RECUPERAR INFORMACIÓN DEL FORMULARIO
        // ====================================================
        const dias = campo(
            'cumpleanosDiasAnticipacion'
        );
        const hora = campo(
            'cumpleanosHoraEnvio'
        );
        const asunto = campo(
            'cumpleanosAsunto'
        );
        const mensaje = campo(
            'cumpleanosMensaje'
        );
        const observaciones = campo(
            'cumpleanosObservaciones'
        );
        // ====================================================
        // VALIDAR DÍAS DE ANTICIPACIÓN
        //
        // Un valor vacío permite heredar la configuración
        // general del Cronograma de Transformín.
        // ====================================================
        if (
            dias !== '' &&
            (
                !Number.isInteger(Number(dias)) ||
                Number(dias) < 0 ||
                Number(dias) > 60
            )
        ) {
            throw new Error(
                'Los días de anticipación deben estar entre 0 y 60.'
            );
        }
        // ====================================================
        // VALIDAR HORA PERSONALIZADA
        // ====================================================
        if (
            hora &&
            !horaValidaRH(hora)
        ) {
            throw new Error(
                'Selecciona una hora de envío válida.'
            );
        }
        // ====================================================
        // VALIDAR LONGITUD DEL ASUNTO
        // ====================================================
        if (asunto.length > 255) {
            throw new Error(
                'El asunto no puede superar los 255 caracteres.'
            );
        }
        // ====================================================
        // VALIDAR LONGITUD DEL MENSAJE
        // ====================================================
        if (mensaje.length > 10000) {
            throw new Error(
                'El mensaje no puede superar los 10.000 caracteres.'
            );
        }
        // ====================================================
        // VALIDAR LONGITUD DE LAS OBSERVACIONES
        // ====================================================
        if (observaciones.length > 10000) {
            throw new Error(
                'Las observaciones no pueden superar los 10.000 caracteres.'
            );
        }
        // ====================================================
        // CONSTRUIR DATOS PARA EL BACKEND
        //
        // Los campos personalizados vacíos se envían
        // como null para permitir la configuración heredada.
        //
        // No se envían modificaciones de nombre, fecha
        // de nacimiento, cargo, área o correo electrónico.
        // ====================================================
        return {
            // ACTIVACIÓN INDIVIDUAL DE ALERTAS.
            alerta_activa: marcado(
                'cumpleanosAlertaActiva'
            ),
            // ACTIVACIÓN INDIVIDUAL DE FELICITACIONES.
            felicitacion_activa: marcado(
                'cumpleanosFelicitacionActiva'
            ),
            // DÍAS DE ANTICIPACIÓN.
            dias_anticipacion:
                dias === ''
                    ? null
                    : Number(dias),
            // HORA PERSONALIZADA.
            hora_envio:
                hora || null,
            // ASUNTO PERSONALIZADO.
            asunto_personalizado:
                asunto || null,
            // MENSAJE PERSONALIZADO.
            mensaje_personalizado:
                mensaje || null,
            // OBSERVACIONES ADMINISTRATIVAS.
            observaciones:
                observaciones || null
        };
    }
    // ========================================================
    // 106. GUARDAR CONFIGURACIÓN INDIVIDUAL
    //
    // Actualiza la configuración del colaborador
    // mediante una solicitud PUT.
    //
    // No realiza envíos inmediatos de felicitaciones.
    //
    // El envío automático corresponde al servicio
    // programado que se ejecuta en el backend.
    // ========================================================
    async function guardarConfiguracionCumpleanos(evento) {
        evento?.preventDefault();
        // Evita solicitudes simultáneas de guardado.
        if (estado.guardandoCumpleanos) return;
        // Limpia mensajes de error anteriores.
        limpiarErrorFormulario('errorCumpleanos');
        try {
            // ================================================
            // VALIDAR IDENTIFICADOR DEL COLABORADOR
            // ================================================
            const id = validarId(
                campo('cumpleanosEmpleadoId')
            );
            // ================================================
            // VALIDAR CONFIGURACIÓN PERSONALIZADA
            // ================================================
            const datos =
                obtenerDatosConfiguracionCumpleanos();
            // ================================================
            // BLOQUEAR OPERACIÓN DE GUARDADO
            // ================================================
            estado.guardandoCumpleanos = true;
            botonCargando(
                'btnGuardarCumpleanos',
                true,
                'Guardando...'
            );
            // ================================================
            // ENVIAR CONFIGURACIÓN AL BACKEND
            //
            // Conserva la ruta y estructura original
            // de la configuración individual.
            // ================================================
            const respuesta = await peticion(
                RUTAS_RH.configuracionEmpleado(id),
                {
                    method: 'PUT',
                    body: datos
                }
            );
            // ================================================
            // CERRAR VENTANA DE CONFIGURACIÓN
            // ================================================
            cerrarModal('modalEditarCumpleanos');
            // ================================================
            // MOSTRAR CONFIRMACIÓN
            // ================================================
            notificar(
                mensajeRespuesta(
                    respuesta,
                    'Configuración del colaborador actualizada correctamente.'
                )
            );
            // ================================================
            // ACTUALIZAR MÓDULO DE CUMPLEAÑOS
            //
            // Sincroniza la información mediante la función
            // general de actualización del módulo.
            // ================================================
            await actualizarModuloCumpleanos();
        } catch (error) {
            // ================================================
            // MOSTRAR ERROR DENTRO DEL FORMULARIO
            // ================================================
            mostrarErrorFormulario(
                'errorCumpleanos',
                error.message
            );
            // Gestiona el error mediante el controlador general.
            manejarError(error);
        } finally {
            // ================================================
            // RESTABLECER ESTADO DEL FORMULARIO
            //
            // Se ejecuta independientemente del resultado
            // de la solicitud al backend.
            // ================================================
            estado.guardandoCumpleanos = false;
            botonCargando(
                'btnGuardarCumpleanos',
                false
            );
        }
    }
    // ========================================================
    // 107. LIBERAR RECURSOS DE TARJETAS
    //
    // Cancela solicitudes pendientes y libera las imágenes
    // temporales almacenadas en la memoria del navegador.
    //
    // Evita conservar imágenes de colaboradores anteriores.
    // ========================================================
    function liberarTarjeta() {
        // CANCELAR SOLICITUD ACTIVA.
        if (estado.controladorTarjeta) {
            estado.controladorTarjeta.abort();
            estado.controladorTarjeta = null;
        }
        // LIBERAR URL TEMPORAL DE LA IMAGEN.
        if (estado.tarjetaURL) {
            URL.revokeObjectURL(
                estado.tarjetaURL
            );
            estado.tarjetaURL = null;
        }
        // LIMPIAR ARCHIVO ALMACENADO.
        estado.tarjetaBlob = null;
        // LIMPIAR CONTENEDOR DE IMAGEN.
        const imagen = $('imagenTarjetaCumpleanos');
        if (imagen) {
            imagen.removeAttribute('src');
            imagen.hidden = true;
        }
        // DESHABILITAR DESCARGA.
        deshabilitar(
            'btnDescargarTarjetaCumpleanos',
            true
        );
    }
    // ========================================================
    // 108. ESTADOS VISUALES DE LA TARJETA
    //
    // Estados disponibles:
    //
    // - cargando: generación de la imagen.
    // - disponible: imagen generada correctamente.
    // - error: problema durante la generación.
    //
    // Actualiza los mensajes, indicadores y botones.
    // ========================================================
    function pintarEstadoTarjeta(
        tipo,
        mensaje = ''
    ) {
        const cargando = tipo === 'cargando';
        const disponible = tipo === 'disponible';
        const error = tipo === 'error';
        // ====================================================
        // CONTROLAR VISIBILIDAD DE LOS COMPONENTES
        // ====================================================
        visible(
            'tarjetaCumpleanosEstado',
            !disponible
        );
        visible(
            'spinnerTarjetaCumpleanos',
            cargando
        );
        visible(
            'imagenTarjetaCumpleanos',
            disponible
        );
        visible(
            'errorTarjetaCumpleanos',
            error
        );
        // ====================================================
        // TÍTULO DEL ESTADO ACTUAL
        // ====================================================
        texto(
            'tituloEstadoTarjeta',
            cargando
                ? 'Generando tarjeta personalizada'
                : error
                    ? 'No fue posible generar la tarjeta'
                    : 'Tarjeta disponible'
        );
        // ====================================================
        // MENSAJE INFORMATIVO
        // ====================================================
        texto(
            'mensajeEstadoTarjeta',
            mensaje ||
            (
                cargando
                    ? 'Preparando la imagen de Transformín para el colaborador.'
                    : ''
            )
        );
        // ====================================================
        // MENSAJE DE ERROR
        // ====================================================
        texto(
            'errorTarjetaCumpleanos',
            error ? mensaje : ''
        );
        // ====================================================
        // CONTROLAR BOTONES
        //
        // No permite regenerar durante una solicitud activa.
        // La descarga solo está disponible cuando existe
        // una imagen generada correctamente.
        // ====================================================
        deshabilitar(
            'btnRegenerarTarjetaCumpleanos',
            cargando
        );
        deshabilitar(
            'btnDescargarTarjetaCumpleanos',
            !disponible
        );
    }
    // ========================================================
    // 109. CONSULTAR IMAGEN PNG DESDE EL SERVIDOR
    //
    // Solicita al backend la tarjeta personalizada
    // correspondiente al colaborador seleccionado.
    //
    // La generación de la imagen se realiza en el servidor.
    //
    // El frontend únicamente recibe, valida y presenta
    // el archivo PNG generado.
    // ========================================================
    async function solicitarTarjetaCumpleanos(
        id,
        signal
    ) {
        // ====================================================
        // VALIDAR IDENTIFICADOR DEL COLABORADOR
        // ====================================================
        const empleadoId = validarId(id);
        // ====================================================
        // CONSULTAR TARJETA PERSONALIZADA
        //
        // credentials: conserva la sesión autenticada.
        // cache: evita recuperar imágenes desactualizadas.
        // signal: permite cancelar solicitudes pendientes.
        // Accept: solicita exclusivamente una imagen PNG.
        // ====================================================
        const respuesta = await fetch(
            `${API}${RUTAS_RH.tarjeta(empleadoId)}`,
            {
                method: 'GET',
                credentials: 'same-origin',
                cache: 'no-store',
                signal,
                headers: {
                    Accept: 'image/png'
                }
            }
        );
        // ====================================================
        // VALIDAR RESPUESTA HTTP
        // ====================================================
        if (!respuesta.ok) {
            let mensaje =
                `No fue posible generar la tarjeta (${respuesta.status}).`;
            const tipo =
                respuesta.headers.get('content-type') || '';
            // Recupera el mensaje detallado del backend
            // cuando la respuesta de error utiliza JSON.
            if (tipo.includes('application/json')) {
                const datos = await respuesta
                    .json()
                    .catch(() => ({}));
                mensaje =
                    datos.mensaje ||
                    datos.message ||
                    datos.error ||
                    mensaje;
            }
            throw new Error(mensaje);
        }
        // ====================================================
        // VALIDAR TIPO DE CONTENIDO
        //
        // Evita interpretar respuestas HTML, JSON u otros
        // archivos como imágenes de cumpleaños.
        // ====================================================
        const tipoContenido =
            respuesta.headers.get('content-type') || '';
        if (!tipoContenido.includes('image/png')) {
            throw new Error(
                'El servidor no devolvió una imagen PNG válida.'
            );
        }
        // ====================================================
        // CONVERTIR RESPUESTA EN ARCHIVO BINARIO
        // ====================================================
        const imagen = await respuesta.blob();
        // ====================================================
        // VALIDAR CONTENIDO DEL ARCHIVO
        // ====================================================
        if (!imagen.size) {
            throw new Error(
                'La tarjeta generada se encuentra vacía.'
            );
        }
        // Devuelve el archivo para su previsualización.
        return imagen;
    }
    // ========================================================
    // 110. GENERAR PREVISUALIZACIÓN DE TARJETA
    //
    // Solicita la imagen personalizada y la presenta
    // dentro de la ventana modal.
    //
    // Utiliza un controlador de cancelación y un número
    // de versión para evitar que una respuesta anterior
    // sustituya la tarjeta del colaborador actual.
    // ========================================================
    async function generarPrevisualizacionTarjeta(id) {
        // ====================================================
        // LIBERAR TARJETA ANTERIOR
        // ====================================================
        liberarTarjeta();
        // ====================================================
        // IDENTIFICAR NUEVA SOLICITUD
        // ====================================================
        const version = ++estado.tarjetaVersion;
        const controlador = new AbortController();
        estado.controladorTarjeta = controlador;
        // Mostrar estado de generación.
        pintarEstadoTarjeta('cargando');
        try {
            // ================================================
            // SOLICITAR IMAGEN PERSONALIZADA
            // ================================================
            const imagen = await solicitarTarjetaCumpleanos(
                id,
                controlador.signal
            );
            // Ignora respuestas de solicitudes anteriores.
            if (version !== estado.tarjetaVersion) {
                return;
            }
            // ================================================
            // ALMACENAR ARCHIVO PARA DESCARGA
            // ================================================
            estado.tarjetaBlob = imagen;
            // ================================================
            // GENERAR URL TEMPORAL
            // ================================================
            estado.tarjetaURL =
                URL.createObjectURL(imagen);
            // ================================================
            // LOCALIZAR CONTENEDOR DE IMAGEN
            // ================================================
            const elemento = $(
                'imagenTarjetaCumpleanos'
            );
            if (!elemento) {
                throw new Error(
                    'No se encontró el contenedor de la tarjeta.'
                );
            }
            // ================================================
            // ASIGNAR IMAGEN GENERADA
            // ================================================
            elemento.src = estado.tarjetaURL;
            // Texto alternativo para accesibilidad.
            elemento.alt =
                `Tarjeta de cumpleaños de ${
                    estado.cumpleanosSeleccionado?.nombre ||
                    'colaborador'
                }`;
            // ================================================
            // COMPROBAR DECODIFICACIÓN DE LA IMAGEN
            //
            // Espera a que el navegador pueda interpretar
            // correctamente el archivo recibido.
            // ================================================
            if (typeof elemento.decode === 'function') {
                await elemento.decode();
            }
            // Comprueba nuevamente la versión activa.
            if (version !== estado.tarjetaVersion) {
                return;
            }
            // ================================================
            // MOSTRAR TARJETA DISPONIBLE
            // ================================================
            pintarEstadoTarjeta('disponible');
        } catch (error) {
            // ================================================
            // IGNORAR SOLICITUDES CANCELADAS
            // ================================================
            if (
                error.name === 'AbortError' ||
                version !== estado.tarjetaVersion
            ) {
                return;
            }
            // ================================================
            // LIBERAR RECURSOS DE LA SOLICITUD FALLIDA
            // ================================================
            liberarTarjeta();
            // ================================================
            // MOSTRAR ERROR DE GENERACIÓN
            // ================================================
            pintarEstadoTarjeta(
                'error',
                error.message
            );
        } finally {
            // ================================================
            // RESTABLECER CONTROLADOR DE SOLICITUD
            //
            // Solo elimina el controlador correspondiente
            // a esta operación.
            // ================================================
            if (
                estado.controladorTarjeta === controlador
            ) {
                estado.controladorTarjeta = null;
            }
        }
    }
    // ========================================================
    // 111. ABRIR MODAL DE TARJETA PERSONALIZADA
    //
    // Consulta la información oficial del colaborador
    // y abre la ventana de previsualización.
    //
    // Permite acceder desde:
    //
    // - Listado general de colaboradores.
    // - Cumpleaños del día.
    // - Configuración individual.
    //
    // No realiza envíos automáticos ni modifica
    // la información de Recursos Humanos.
    // ========================================================
    async function abrirTarjetaCumpleanos(
        id,
        desdeConfiguracion = false
    ) {
        // ====================================================
        // CONSULTAR INFORMACIÓN DEL COLABORADOR
        // ====================================================
        const empleado =
            await obtenerConfiguracionCumpleanos(id);
        // ====================================================
        // ALMACENAR COLABORADOR SELECCIONADO
        // ====================================================
        estado.cumpleanosSeleccionado = empleado;
        estado.tarjetaEmpleadoId = empleado.id;
        // ====================================================
        // IDENTIFICADOR DEL COLABORADOR
        // ====================================================
        setCampo(
            'tarjetaCumpleanosEmpleadoId',
            empleado.id
        );
        // ====================================================
        // TÍTULO DEL MODAL
        // ====================================================
        texto(
            'modalTarjetaTitulo',
            'Tarjeta de cumpleaños de Transformín'
        );
        // ====================================================
        // NOMBRE DEL COLABORADOR
        // ====================================================
        texto(
            'tarjetaCumpleanosNombre',
            empleado.nombre
        );
        // ====================================================
        // FECHA DE CUMPLEAÑOS
        // ====================================================
        texto(
            'tarjetaCumpleanosFecha',
            fechaBonita(empleado.fecha)
        );
        // ====================================================
        // BOTÓN PARA REGRESAR A CONFIGURACIÓN
        //
        // Solo se muestra cuando la tarjeta fue abierta
        // desde la configuración individual.
        // ====================================================
        visible(
            'btnVolverConfiguracionCumpleanos',
            desdeConfiguracion
        );
        // Mostrar indicador de generación.
        pintarEstadoTarjeta('cargando');
        // ====================================================
        // CONTROLAR TRANSICIÓN ENTRE VENTANAS MODALES
        //
        // Evita abrir simultáneamente la configuración
        // individual y la previsualización de tarjeta.
        // ====================================================
        if (
            desdeConfiguracion &&
            $('modalEditarCumpleanos')
                ?.classList.contains('show')
        ) {
            cambiarModal(
                'modalEditarCumpleanos',
                'modalTarjetaCumpleanos'
            );
        } else {
            abrirModal(
                'modalTarjetaCumpleanos'
            );
        }
        // ====================================================
        // GENERAR PREVISUALIZACIÓN PERSONALIZADA
        // ====================================================
        await generarPrevisualizacionTarjeta(
            empleado.id
        );
    }
    // ========================================================
    // 112. PREVISUALIZAR DESDE CONFIGURACIÓN
    //
    // Permite consultar la tarjeta personalizada
    // directamente desde la configuración individual.
    //
    // Utiliza el nombre oficial registrado en RH.
    //
    // No guarda cambios pendientes del formulario,
    // no modifica al colaborador y no envía correos.
    // ========================================================
    async function previsualizarTarjetaDesdeConfiguracion() {
        // ====================================================
        // VALIDAR IDENTIFICADOR DEL COLABORADOR
        // ====================================================
        const id = validarId(
            campo('cumpleanosEmpleadoId')
        );
        // ====================================================
        // ABRIR TARJETA DESDE CONFIGURACIÓN INDIVIDUAL
        // ====================================================
        await abrirTarjetaCumpleanos(
            id,
            true
        );
    }
    // ========================================================
    // 113. REGENERAR TARJETA
    //
    // Solicita nuevamente la tarjeta personalizada del
    // colaborador seleccionado.
    // ========================================================
    async function regenerarTarjetaCumpleanos() {
        const id = validarId(
            estado.tarjetaEmpleadoId ||
            campo('tarjetaCumpleanosEmpleadoId')
        );
        await generarPrevisualizacionTarjeta(id);
    }
    // ========================================================
    // 114. DESCARGAR TARJETA PERSONALIZADA
    //
    // Descarga la imagen PNG previamente generada.
    // No requiere una nueva solicitud al servidor.
    // ========================================================
    function descargarTarjetaCumpleanos() {
        // Verificar disponibilidad de la imagen.
        if (
            !estado.tarjetaBlob ||
            !estado.tarjetaURL
        ) {
            notificar(
                'Primero debes generar la tarjeta.',
                'advertencia'
            );
            return;
        }
        // Obtener información del colaborador.
        const empleado =
            estado.cumpleanosSeleccionado;
        // Generar un nombre de archivo seguro.
        const nombre = nombreArchivoSeguroRH(
            empleado?.nombre
        );
        // Crear enlace temporal de descarga.
        const enlace =
            document.createElement('a');
        enlace.href = estado.tarjetaURL;
        enlace.download =
            `Transformin-Cumpleanos-${nombre}.png`;
        // Ejecutar descarga y eliminar enlace temporal.
        document.body.appendChild(enlace);
        enlace.click();
        enlace.remove();
    }
    // ========================================================
    // 115. REGRESAR A CONFIGURACIÓN INDIVIDUAL
    //
    // Cierra la previsualización y regresa al formulario
    // de configuración del colaborador.
    // ========================================================
    function volverConfiguracionCumpleanos() {
        cambiarModal(
            'modalTarjetaCumpleanos',
            'modalEditarCumpleanos'
        );
    }
    // ========================================================
    // 116. NORMALIZACIÓN DE CONFIGURACIÓN GENERAL
    //
    // Unifica los nombres de propiedades provenientes
    // del backend y de la base de datos MySQL.
    //
    // Conserva la configuración general de:
    //
    // - Recordatorios.
    // - Días de anticipación.
    // - Felicitaciones automáticas.
    // - Hora de envío.
    // - Avisos administrativos.
    // - Correo de notificaciones.
    // ========================================================
    function normalizarConfiguracionRecordatorios(
        datos = {}
    ) {
        return {
            // ACTIVACIÓN GENERAL DE RECORDATORIOS.
            recordatoriosActivos: booleanoRH(
                datos.recordatorios_activos ??
                datos.recordatoriosActivos
            ),
            // DÍAS DE ANTICIPACIÓN.
            // Valor predeterminado: siete días.
            diasAnticipacion:
                enteroNullableRH(
                    datos.dias_anticipacion ??
                    datos.diasAnticipacion
                ) ?? 7,
            // ACTIVACIÓN GENERAL DE FELICITACIONES.
            felicitacionesActivas: booleanoRH(
                datos.felicitaciones_activas ??
                datos.felicitacionesActivas
            ),
            // HORA GENERAL DE FELICITACIONES.
            // Valor predeterminado: 08:00.
            horaFelicitaciones:
                normalizarHoraRH(
                    datos.hora_felicitaciones ??
                    datos.horaFelicitaciones
                ) || '08:00',
            // ACTIVACIÓN DE AVISOS ADMINISTRATIVOS.
            avisosAdminActivos: booleanoRH(
                datos.avisos_admin_activos ??
                datos.avisosAdminActivos
            ),
            // CORREO DESTINATARIO DE NOTIFICACIONES.
            correoNotificaciones:
                datos.correo_notificaciones ??
                datos.correoNotificaciones ??
                ''
        };
    }
    // ========================================================
    // 117. CONSULTAR CONFIGURACIÓN GENERAL
    //
    // Recupera las preferencias almacenadas en el backend.
    //
    // También consulta si el servidor tiene habilitados
    // los envíos reales de correos electrónicos.
    //
    // La configuración visual no puede habilitar por sí
    // sola los envíos desactivados en el servidor.
    // ========================================================
    async function cargarConfiguracion() {
        // Consultar configuración almacenada.
        const datos = await peticion(
            RUTAS_RH.configuracion
        );
        // Normalizar respuesta del backend.
        estado.configuracionRecordatorios =
            normalizarConfiguracionRecordatorios(
                datos.configuracion ||
                datos
            );
        // Consultar autorización de envíos reales.
        estado.enviosHabilitados = booleanoRH(
            datos.enviosHabilitados ??
            datos.envios_habilitados
        );
        // Actualizar formulario general.
        pintarConfiguracionRecordatorios();
        // Actualizar indicadores del servicio.
        pintarEstadoEnvios();
        return estado.configuracionRecordatorios;
    }
    // ========================================================
    // 118. RENDERIZAR CONFIGURACIÓN GENERAL
    //
    // Sincroniza los campos del formulario con los
    // valores almacenados en la configuración general.
    // ========================================================
    function pintarConfiguracionRecordatorios() {
        const configuracion =
            estado.configuracionRecordatorios;
        // Evita modificar el formulario cuando todavía
        // no existe una configuración disponible.
        if (!configuracion) return;
        // ====================================================
        // ACTIVAR RECORDATORIOS GENERALES
        // ====================================================
        setMarcado(
            'activarRecordatorios',
            configuracion.recordatoriosActivos
        );
        // ====================================================
        // DÍAS DE ANTICIPACIÓN
        // ====================================================
        setCampo(
            'diasAnticipacion',
            configuracion.diasAnticipacion
        );
        // ====================================================
        // ACTIVAR FELICITACIONES AUTOMÁTICAS
        // ====================================================
        setMarcado(
            'activarFelicitaciones',
            configuracion.felicitacionesActivas
        );
        // ====================================================
        // HORA GENERAL DE ENVÍO
        // ====================================================
        setCampo(
            'horaFelicitaciones',
            configuracion.horaFelicitaciones
        );
        // ====================================================
        // ACTIVAR AVISOS ADMINISTRATIVOS
        // ====================================================
        setMarcado(
            'activarAvisosAdmin',
            configuracion.avisosAdminActivos
        );
        // ====================================================
        // CORREO ADMINISTRATIVO DE NOTIFICACIONES
        // ====================================================
        setCampo(
            'correoNotificaciones',
            configuracion.correoNotificaciones
        );
        // Actualizar campos condicionales.
        actualizarCamposRecordatorios();
    }
    // ========================================================
    // 119. CAMPOS CONDICIONALES DE RECORDATORIOS
    //
    // Controla los campos obligatorios dependiendo de
    // las funcionalidades activadas por el usuario.
    //
    // También muestra la advertencia correspondiente
    // cuando los envíos reales están deshabilitados.
    // ========================================================
    function actualizarCamposRecordatorios() {
        // ====================================================
        // ESTADO DE AVISOS ADMINISTRATIVOS
        // ====================================================
        const avisos = marcado(
            'activarAvisosAdmin'
        );
        const correo = $('correoNotificaciones');
        // El correo es obligatorio cuando los avisos
        // administrativos se encuentran activados.
        if (correo) {
            correo.required = avisos;
        }
        // ====================================================
        // ESTADO DE RECORDATORIOS
        // ====================================================
        const recordatorios = marcado(
            'activarRecordatorios'
        );
        // ====================================================
        // ESTADO DE FELICITACIONES
        // ====================================================
        const felicitaciones = marcado(
            'activarFelicitaciones'
        );
        // Localizar campos de configuración.
        const dias = $('diasAnticipacion');
        const hora = $('horaFelicitaciones');
        // ====================================================
        // CONTROLAR CAMPOS OBLIGATORIOS
        // ====================================================
        if (dias) {
            dias.required = recordatorios;
        }
        if (hora) {
            hora.required = felicitaciones;
        }
        // ====================================================
        // ADVERTENCIA DE ENVÍOS DESHABILITADOS
        //
        // Se conserva visible mientras el servidor
        // no tenga habilitados los envíos reales.
        // ====================================================
        visible(
            'alertaEnviosDeshabilitados',
            !estado.enviosHabilitados
        );
    }
    // ========================================================
    // 120. VALIDAR CONFIGURACIÓN GENERAL
    //
    // Comprueba los datos antes de realizar la solicitud
    // de actualización al backend.
    //
    // Validaciones:
    //
    // - Anticipación entre 0 y 60 días.
    // - Hora válida en formato HH:mm.
    // - Correo administrativo válido.
    // - Longitud máxima del correo: 180 caracteres.
    // ========================================================
    function obtenerDatosConfiguracionGeneral() {
        // ====================================================
        // RECUPERAR INFORMACIÓN DEL FORMULARIO
        // ====================================================
        const dias = campo('diasAnticipacion');
        const hora = campo('horaFelicitaciones');
        const correo = campo(
            'correoNotificaciones'
        );
        const avisosAdmin = marcado(
            'activarAvisosAdmin'
        );
        // ====================================================
        // VALIDAR DÍAS DE ANTICIPACIÓN
        //
        // Se permite el valor 0 para recordatorios
        // correspondientes al mismo día.
        // ====================================================
        if (
            dias === '' ||
            !Number.isInteger(Number(dias)) ||
            Number(dias) < 0 ||
            Number(dias) > 60
        ) {
            throw new Error(
                'La anticipación debe estar entre 0 y 60 días.'
            );
        }
        // ====================================================
        // VALIDAR HORA GENERAL DE FELICITACIONES
        // ====================================================
        if (!horaValidaRH(hora)) {
            throw new Error(
                'Selecciona una hora válida para las felicitaciones.'
            );
        }
        // ====================================================
        // VALIDAR CORREO ADMINISTRATIVO OBLIGATORIO
        // ====================================================
        if (
            avisosAdmin &&
            !correoValidoRH(correo)
        ) {
            throw new Error(
                'Registra un correo válido para recibir avisos administrativos.'
            );
        }
        // ====================================================
        // VALIDAR CORREO OPCIONAL
        //
        // Si el usuario registra un correo, debe ser válido
        // aunque los avisos administrativos estén apagados.
        // ====================================================
        if (
            correo &&
            !correoValidoRH(correo)
        ) {
            throw new Error(
                'El correo de notificaciones no es válido.'
            );
        }
        // ====================================================
        // VALIDAR LONGITUD DEL CORREO
        // ====================================================
        if (correo.length > 180) {
            throw new Error(
                'El correo no puede superar los 180 caracteres.'
            );
        }
        // ====================================================
        // CONSTRUIR CONFIGURACIÓN PARA EL BACKEND
        //
        // Conserva los nombres originales de las propiedades
        // utilizadas por las rutas y la base de datos.
        // ====================================================
        return {
            // ACTIVAR RECORDATORIOS.
            recordatorios_activos: marcado(
                'activarRecordatorios'
            ),
            // DÍAS DE ANTICIPACIÓN.
            dias_anticipacion: Number(dias),
            // ACTIVAR FELICITACIONES AUTOMÁTICAS.
            felicitaciones_activas: marcado(
                'activarFelicitaciones'
            ),
            // HORA GENERAL DE FELICITACIONES.
            hora_felicitaciones: hora,
            // ACTIVAR AVISOS ADMINISTRATIVOS.
            avisos_admin_activos: avisosAdmin,
            // CORREO ADMINISTRATIVO.
            correo_notificaciones: correo || null
        };
    }
    // ========================================================
    // 121. GUARDAR CONFIGURACIÓN GENERAL
    //
    // Actualiza la configuración mediante una solicitud PUT.
    //
    // Controla solicitudes simultáneas, mensajes de error,
    // advertencias del servidor y actualización del módulo.
    //
    // Guardar las preferencias no equivale a enviar
    // inmediatamente un correo electrónico.
    // ========================================================
    async function guardarConfiguracion(evento) {
        // Evitar el envío tradicional del formulario.
        evento?.preventDefault();
        // ====================================================
        // PREVENIR GUARDADOS SIMULTÁNEOS
        // ====================================================
        if (estado.guardandoConfiguracion) {
            return;
        }
        // Ocultar mensajes de operaciones anteriores.
        visible(
            'mensajeConfiguracionRecordatorios',
            false
        );
        try {
            // ================================================
            // VALIDAR INFORMACIÓN DEL FORMULARIO
            // ================================================
            const datos =
                obtenerDatosConfiguracionGeneral();
            // ================================================
            // BLOQUEAR OPERACIÓN DE GUARDADO
            // ================================================
            estado.guardandoConfiguracion = true;
            botonCargando(
                'btnGuardarConfiguracion',
                true,
                'Guardando...'
            );
            // ================================================
            // ACTUALIZAR CONFIGURACIÓN EN EL BACKEND
            // ================================================
            const respuesta = await peticion(
                RUTAS_RH.configuracion,
                {
                    method: 'PUT',
                    body: datos
                }
            );
            // ================================================
            // SINCRONIZAR CONFIGURACIÓN LOCAL
            //
            // Prioriza los valores confirmados por el servidor.
            // ================================================
            estado.configuracionRecordatorios =
                normalizarConfiguracionRecordatorios(
                    respuesta.configuracion ||
                    datos
                );
            // ================================================
            // ACTUALIZAR ESTADO DE ENVÍOS REALES
            //
            // Solo modifica este indicador cuando el backend
            // devuelve explícitamente su estado.
            // ================================================
            if (
                respuesta.enviosHabilitados !== undefined
            ) {
                estado.enviosHabilitados = booleanoRH(
                    respuesta.enviosHabilitados
                );
            }
            // ================================================
            // ACTUALIZAR INTERFAZ
            // ================================================
            pintarConfiguracionRecordatorios();
            pintarEstadoEnvios();
            // ================================================
            // MOSTRAR MENSAJE DE CONFIRMACIÓN
            // ================================================
            const mensaje = mensajeRespuesta(
                respuesta,
                'Configuración guardada correctamente.'
            );
            texto(
                'mensajeConfiguracionRecordatorios',
                mensaje
            );
            visible(
                'mensajeConfiguracionRecordatorios',
                true
            );
            notificar(mensaje);
            // ================================================
            // PROCESAR ADVERTENCIAS DEL SERVIDOR
            //
            // Permite informar sobre SMTP, configuración
            // incompleta o envíos reales deshabilitados.
            // ================================================
            const advertencias = Array.isArray(
                respuesta.advertencias
            )
                ? respuesta.advertencias
                : [];
            advertencias.forEach(advertencia => {
                notificar(
                    typeof advertencia === 'string'
                        ? advertencia
                        : advertencia.mensaje ||
                          'Revisa la configuración del servicio.',
                    'advertencia'
                );
            });
            // ================================================
            // ACTUALIZAR MÓDULO DE CUMPLEAÑOS
            //
            // Sincroniza la información relacionada con
            // la configuración recién almacenada.
            // ================================================
            await actualizarModuloCumpleanos();
        } catch (error) {
            // ================================================
            // MOSTRAR ERROR DE CONFIGURACIÓN
            // ================================================
            texto(
                'mensajeConfiguracionRecordatorios',
                error.message
            );
            visible(
                'mensajeConfiguracionRecordatorios',
                true
            );
            manejarError(error);
        } finally {
            // ================================================
            // RESTABLECER ESTADO DE GUARDADO
            //
            // Se ejecuta independientemente del resultado
            // de la operación.
            // ================================================
            estado.guardandoConfiguracion = false;
            botonCargando(
                'btnGuardarConfiguracion',
                false
            );
        }
    }
    // ========================================================
    // 122. CONFIRMAR RESTABLECIMIENTO
    //
    // Solicita confirmación antes de restablecer las
    // preferencias generales del módulo.
    // ========================================================
    function confirmarRestablecimientoConfiguracion() {
        limpiarErrorFormulario(
            'errorRestablecerConfiguracion'
        );
        abrirModal(
            'modalRestablecerConfiguracion'
        );
    }
    // ========================================================
    // 123. RESTABLECER CONFIGURACIÓN GENERAL
    //
    // Recupera los valores predeterminados establecidos
    // por el backend.
    //
    // Controla operaciones simultáneas y actualiza los
    // componentes relacionados con cumpleaños.
    // ========================================================
    async function restablecerConfiguracion() {
        // PREVENIR OPERACIONES SIMULTÁNEAS.
        if (estado.guardandoConfiguracion) return;
        estado.guardandoConfiguracion = true;
        botonCargando(
            'btnConfirmarRestablecimiento',
            true,
            'Restableciendo...'
        );
        try {
            // ================================================
            // SOLICITAR RESTABLECIMIENTO AL BACKEND
            // ================================================
            const respuesta = await peticion(
                RUTAS_RH.restablecer,
                {
                    method: 'POST',
                    body: {
                        confirmar: true
                    }
                }
            );
            // ================================================
            // CERRAR VENTANA DE CONFIRMACIÓN
            // ================================================
            cerrarModal(
                'modalRestablecerConfiguracion'
            );
            // ================================================
            // NOTIFICAR RESULTADO
            // ================================================
            notificar(
                mensajeRespuesta(
                    respuesta,
                    'Configuración general restablecida.'
                )
            );
            // ================================================
            // RECARGAR CONFIGURACIÓN GENERAL
            // ================================================
            await cargarConfiguracion();
            // ================================================
            // SINCRONIZAR MÓDULO DE CUMPLEAÑOS
            // ================================================
            await actualizarModuloCumpleanos();
        } catch (error) {
            // MOSTRAR ERROR EN LA VENTANA DE CONFIRMACIÓN.
            mostrarErrorFormulario(
                'errorRestablecerConfiguracion',
                error.message
            );
            manejarError(error);
        } finally {
            // RESTABLECER CONTROLES DE LA OPERACIÓN.
            estado.guardandoConfiguracion = false;
            botonCargando(
                'btnConfirmarRestablecimiento',
                false
            );
        }
    }
    // ========================================================
    // 124. CONSULTAR ESTADO DEL SERVICIO
    //
    // Consulta el estado real del servicio de cumpleaños
    // que se ejecuta en el servidor.
    //
    // Permite conocer:
    //
    // - Disponibilidad del servicio.
    // - Autorización de envíos reales.
    // - Estado del programador automático.
    //
    // El frontend no inicia directamente el programador.
    // ========================================================
    async function cargarEstadoServicioCumpleanos() {
        // CONSULTAR ESTADO DESDE EL BACKEND.
        const datos = await peticion(
            RUTAS_RH.servicio
        );
        // ====================================================
        // NORMALIZAR RESPUESTA DEL SERVICIO
        // ====================================================
        estado.servicioCumpleanos =
            datos.servicio ||
            datos.estadoServicio ||
            datos;
        const servicio =
            estado.servicioCumpleanos;
        // ====================================================
        // CONSULTAR AUTORIZACIÓN DE ENVÍOS REALES
        // ====================================================
        const habilitado =
            servicio.enviosHabilitados ??
            servicio.envios_habilitados ??
            datos.enviosHabilitados;
        // Actualiza el estado únicamente cuando el servidor
        // proporciona explícitamente esta información.
        if (habilitado !== undefined) {
            estado.enviosHabilitados =
                booleanoRH(habilitado);
        }
        // ====================================================
        // ACTUALIZAR INDICADORES VISUALES
        // ====================================================
        pintarEstadoEnvios();
        pintarEstadoProgramador();
        return servicio;
    }
    // ========================================================
    // 125. ESTADO GENERAL DE ENVÍOS
    //
    // Diferencia la configuración general de felicitaciones
    // de la autorización real de envío del servidor.
    //
    // Incluye atributos data-estado para mantener
    // compatibilidad con el CSS corregido.
    // ========================================================
    function pintarEstadoEnvios() {
        const habilitado =
            estado.enviosHabilitados;
        const configuracion =
            estado.configuracionRecordatorios || {};
        let mensaje;
        // ====================================================
        // ESTADO 01: ENVÍOS REALES DESHABILITADOS
        // ====================================================
        if (!habilitado) {
            mensaje =
                'Los envíos reales están deshabilitados en el servidor. Puedes configurar alertas y generar tarjetas sin enviar correos.';
        // ====================================================
        // ESTADO 02: FELICITACIONES DESACTIVADAS
        // ====================================================
        } else if (
            !configuracion.felicitacionesActivas
        ) {
            mensaje =
                'El servidor permite envíos, pero las felicitaciones automáticas están desactivadas.';
        // ====================================================
        // ESTADO 03: FELICITACIONES CONFIGURADAS
        // ====================================================
        } else {
            mensaje =
                'Las felicitaciones automáticas están configuradas para ejecutarse según el horario establecido.';
        }
        // ====================================================
        // ACTUALIZAR MENSAJE GENERAL
        // ====================================================
        texto(
            'estadoEnviosCumpleanosTexto',
            mensaje
        );
        visible(
            'contenedorEstadoEnviosCumpleanos',
            true
        );
        // ====================================================
        // MOSTRAR ADVERTENCIA DE ENVÍOS DESHABILITADOS
        // ====================================================
        visible(
            'alertaEnviosDeshabilitados',
            !habilitado
        );
        // ====================================================
        // ACTUALIZAR BADGE DEL SERVICIO
        // ====================================================
        const badge = $('badgeEnviosCumpleanos');
        if (badge) {
            // ELIMINAR ESTILOS ANTERIORES.
            badge.classList.remove(
                'bg-success',
                'bg-warning',
                'bg-secondary'
            );
            // DETERMINAR ESTADO EFECTIVO.
            const activo =
                habilitado &&
                configuracion.felicitacionesActivas;
            // APLICAR CLASE VISUAL.
            badge.classList.add(
                activo
                    ? 'bg-success'
                    : 'bg-secondary'
            );
            // COMPATIBILIDAD CON EL CSS CORREGIDO.
            badge.dataset.estado =
                activo
                    ? 'activo'
                    : 'inactivo';
            // ACTUALIZAR TEXTO DEL INDICADOR.
            badge.textContent =
                activo
                    ? 'Configurado'
                    : 'Desactivado';
        }
        // ====================================================
        // ACTUALIZAR CONFIGURACIÓN INDIVIDUAL
        // ====================================================
        actualizarConfiguracionIndividualVisual();
    }
    // ========================================================
    // 126. ESTADO DEL PROGRAMADOR AUTOMÁTICO
    //
    // Consulta la información reportada por el servidor
    // sobre el programador de felicitaciones.
    //
    // Estados disponibles:
    //
    // - Activo.
    // - Inactivo.
    // - Sin confirmar.
    //
    // No inicia ni detiene directamente Node-Cron.
    // ========================================================
    function pintarEstadoProgramador() {
        const servicio =
            estado.servicioCumpleanos || {};
        const programador =
            servicio.programador || {};
        // ====================================================
        // NORMALIZAR ESTADO REPORTADO POR EL BACKEND
        // ====================================================
        const estadoReportado =
            servicio.programadorActivo ??
            servicio.programadorIniciado ??
            servicio.programador_activo ??
            programador.activo ??
            programador.iniciado;
        // ====================================================
        // DETERMINAR ESTADO DEL PROGRAMADOR
        // ====================================================
        const activo =
            booleanoRH(estadoReportado);
        const conocido =
            estadoReportado !== undefined &&
            estadoReportado !== null;
        let mensaje;
        // ====================================================
        // ESTADO 01: ENVÍOS DESHABILITADOS
        // ====================================================
        if (!estado.enviosHabilitados) {
            mensaje =
                'Envíos reales deshabilitados';
        // ====================================================
        // ESTADO 02: ESTADO NO CONFIRMADO
        // ====================================================
        } else if (!conocido) {
            mensaje =
                'Estado del programador no confirmado';
        // ====================================================
        // ESTADO 03: PROGRAMADOR ACTIVO O DETENIDO
        // ====================================================
        } else {
            mensaje = activo
                ? 'Programador automático en ejecución'
                : 'Programador automático detenido';
        }
        // ====================================================
        // ACTUALIZAR DESCRIPCIÓN DEL PROGRAMADOR
        // ====================================================
        texto(
            'estadoProgramadorTransformin',
            mensaje
        );
        // ====================================================
        // ACTUALIZAR BADGE DEL PROGRAMADOR
        // ====================================================
        const badge = $(
            'badgeProgramadorTransformin'
        );
        if (badge) {
            // ELIMINAR CLASES ANTERIORES.
            badge.classList.remove(
                'bg-success',
                'bg-warning',
                'bg-secondary'
            );
            // DETERMINAR DISPONIBILIDAD OPERATIVA.
            const operativo =
                estado.enviosHabilitados &&
                conocido &&
                activo;
            // APLICAR ESTILO VISUAL.
            badge.classList.add(
                operativo
                    ? 'bg-success'
                    : 'bg-secondary'
            );
            // ================================================
            // COMPATIBILIDAD CON EL CSS CORREGIDO
            // ================================================
            badge.dataset.estado =
                operativo
                    ? 'activo'
                    : !conocido &&
                      estado.enviosHabilitados
                        ? 'pendiente'
                        : 'inactivo';
            // ================================================
            // ACTUALIZAR TEXTO DEL INDICADOR
            // ================================================
            badge.textContent =
                operativo
                    ? 'Activo'
                    : !conocido &&
                      estado.enviosHabilitados
                        ? 'Sin confirmar'
                        : 'Inactivo';
        }
    }
    // ========================================================
    // 127. ESTADOS VISUALES DEL SERVICIO SMTP
    //
    // Centraliza los estados del servicio de correo.
    //
    // Estados:
    //
    // - pendiente: todavía no se ha verificado.
    // - verificando: comprobación en ejecución.
    // - conectado: conexión confirmada.
    // - error: problema durante la comprobación.
    //
    // Utiliza clases Bootstrap y atributos data-estado
    // compatibles con el CSS de Transformín.
    // ========================================================
    function pintarEstadoSMTP(
        tipo,
        mensaje
    ) {
        // ====================================================
        // ACTUALIZAR MENSAJE DEL SERVICIO
        // ====================================================
        texto(
            'estadoSMTP',
            mensaje
        );
        // ====================================================
        // LOCALIZAR INDICADOR VISUAL
        // ====================================================
        const badge = $('badgeEstadoSMTP');
        if (!badge) return;
        // ====================================================
        // ELIMINAR ESTILOS ANTERIORES
        // ====================================================
        badge.classList.remove(
            'bg-success',
            'bg-danger',
            'bg-warning',
            'bg-secondary'
        );
        // ====================================================
        // DEFINIR ESTADOS DISPONIBLES
        // ====================================================
        const estadosSMTP = {
            // VERIFICACIÓN EN EJECUCIÓN.
            verificando: {
                clase: 'bg-warning',
                texto: 'Verificando'
            },
            // CONEXIÓN CONFIRMADA.
            conectado: {
                clase: 'bg-success',
                texto: 'Conectado'
            },
            // ERROR DE CONEXIÓN.
            error: {
                clase: 'bg-danger',
                texto: 'Error'
            },
            // CONEXIÓN PENDIENTE DE VERIFICACIÓN.
            pendiente: {
                clase: 'bg-secondary',
                texto: 'Sin verificar'
            }
        };
        // ====================================================
        // OBTENER CONFIGURACIÓN DEL ESTADO ACTUAL
        // ====================================================
        const configuracion =
            estadosSMTP[tipo] ||
            estadosSMTP.pendiente;
        // ====================================================
        // APLICAR CLASE VISUAL
        // ====================================================
        badge.classList.add(
            configuracion.clase
        );
        // ====================================================
        // COMPATIBILIDAD CON LOS ESTILOS DEL MÓDULO
        // ====================================================
        badge.dataset.estado = ({
            conectado: 'activo',
            error: 'error',
            verificando: 'advertencia',
            pendiente: 'pendiente'
        })[tipo] || 'pendiente';
        // ====================================================
        // ACTUALIZAR TEXTO DEL BADGE
        // ====================================================
        badge.textContent =
            configuracion.texto;
    }
    // ========================================================
    // 128. VERIFICAR CONEXIÓN SMTP HOSTINGER
    //
    // Solicita al backend comprobar la conexión con
    // el servidor SMTP configurado.
    //
    // La comprobación debe realizarse desde el servidor,
    // utilizando las credenciales almacenadas de forma segura.
    //
    // No se exponen contraseñas SMTP en el frontend.
    //
    // Esta operación está destinada a verificar la conexión,
    // no a enviar correos de felicitación.
    // ========================================================
    async function verificarSMTP() {
        // ====================================================
        // PREVENIR VERIFICACIONES SIMULTÁNEAS
        // ====================================================
        if (estado.verificandoSMTP) return;
        estado.verificandoSMTP = true;
        // ====================================================
        // BLOQUEAR BOTÓN DURANTE LA VERIFICACIÓN
        // ====================================================
        botonCargando(
            'btnVerificarSMTP',
            true,
            'Verificando...'
        );
        // ====================================================
        // MOSTRAR ESTADO DE VERIFICACIÓN
        // ====================================================
        pintarEstadoSMTP(
            'verificando',
            'Comprobando la conexión con el servidor de correo.'
        );
        try {
            // ================================================
            // SOLICITAR VERIFICACIÓN AL BACKEND
            // ================================================
            const respuesta = await peticion(
                RUTAS_RH.smtp,
                {
                    method: 'POST'
                }
            );
            // ================================================
            // NORMALIZAR RESPUESTA DEL SERVICIO SMTP
            // ================================================
            const resultado =
                respuesta.smtp ||
                respuesta.resultado ||
                respuesta;
            // ================================================
            // COMPROBAR RESULTADO DE LA VERIFICACIÓN
            // ================================================
            const verificado =
                resultado.conectado ??
                resultado.verificado ??
                resultado.disponible ??
                resultado.success ??
                respuesta.success;
            // ================================================
            // VALIDAR CONFIRMACIÓN DEL SERVIDOR
            // ================================================
            if (!booleanoRH(verificado)) {
                throw new Error(
                    resultado.mensaje ||
                    resultado.message ||
                    'El servidor no confirmó la conexión SMTP.'
                );
            }
            // ================================================
            // MOSTRAR CONEXIÓN CONFIRMADA
            // ================================================
            pintarEstadoSMTP(
                'conectado',
                'Conexión SMTP verificada correctamente. No se ha enviado ningún correo.'
            );
            // ================================================
            // MOSTRAR SERVIDOR SMTP
            // ================================================
            texto(
                'smtpServidor',
                resultado.host ||
                resultado.servidor ||
                'smtp.hostinger.com'
            );
            // ================================================
            // MOSTRAR PUERTO SMTP
            // ================================================
            texto(
                'smtpPuerto',
                resultado.port ||
                resultado.puerto ||
                '465'
            );
            // ================================================
            // MOSTRAR PROTOCOLO DE SEGURIDAD
            // ================================================
            texto(
                'smtpSeguridad',
                'SSL/TLS'
            );
            // ================================================
            // REGISTRAR FECHA Y HORA DE VERIFICACIÓN
            //
            // Utiliza la zona horaria de Colombia.
            // ================================================
            texto(
                'ultimaVerificacionSMTP',
                new Intl.DateTimeFormat(
                    'es-CO',
                    {
                        timeZone: 'America/Bogota',
                        dateStyle: 'short',
                        timeStyle: 'short'
                    }
                ).format(new Date())
            );
            // ================================================
            // ACTUALIZAR ESTADO GENERAL DEL SERVICIO
            // ================================================
            texto(
                'estadoServicioCorreo',
                'SMTP verificado'
            );
            // ================================================
            // NOTIFICAR VERIFICACIÓN EXITOSA
            // ================================================
            notificar(
                'Conexión SMTP verificada correctamente.'
            );
        } catch (error) {
            // ================================================
            // MOSTRAR ERROR DE CONEXIÓN
            // ================================================
            pintarEstadoSMTP(
                'error',
                error.message
            );
            // ================================================
            // ACTUALIZAR ESTADO DEL SERVICIO
            // ================================================
            texto(
                'estadoServicioCorreo',
                'Error de conexión'
            );
            // ================================================
            // GESTIONAR ERROR MEDIANTE CONTROLADOR GENERAL
            // ================================================
            manejarError(error);
        } finally {
            // ================================================
            // RESTABLECER ESTADO DE VERIFICACIÓN
            // ================================================
            estado.verificandoSMTP = false;
            // ================================================
            // HABILITAR NUEVAMENTE EL BOTÓN
            // ================================================
            botonCargando(
                'btnVerificarSMTP',
                false
            );
        }
    }
    // ========================================================
    // 129. ACTUALIZACIÓN INTEGRAL DE CUMPLEAÑOS
    //
    // Actualiza simultáneamente los colaboradores,
    // indicadores, alertas, calendario y estado del servicio.
    //
    // Promise.allSettled permite continuar aunque alguna
    // de las consultas presente errores.
    // ========================================================
    async function actualizarModuloCumpleanos() {
        // CONSULTAR SIMULTÁNEAMENTE LOS COMPONENTES.
        const resultados = await Promise.allSettled([
            cargarCumpleanos(),
            cargarIndicadoresCumpleanos(),
            cargarAlertasCumpleanos(),
            cargarCalendarioCumpleanos(),
            cargarEstadoServicioCumpleanos()
        ]);
        // ====================================================
        // ACTUALIZAR COMPONENTES VISUALES
        // ====================================================
        pintarIndicadoresCumpleanos();
        pintarCalendario();
        pintarAgenda();
        // ====================================================
        // IDENTIFICAR CONSULTAS FALLIDAS
        //
        // Las solicitudes canceladas intencionalmente
        // no se consideran errores del módulo.
        // ====================================================
        const errores = resultados.filter(
            resultado =>
                resultado.status === 'rejected' &&
                resultado.reason?.name !== 'AbortError'
        );
        // ====================================================
        // REGISTRAR ERRORES EN CONSOLA
        // ====================================================
        errores.forEach(resultado => {
            console.error(
                '[Transformín - Recursos Humanos]',
                resultado.reason
            );
        });
        // ====================================================
        // MOSTRAR ADVERTENCIA DE ACTUALIZACIÓN PARCIAL
        // ====================================================
        if (errores.length) {
            notificar(
                'Algunos datos de Recursos Humanos no pudieron actualizarse.',
                'advertencia'
            );
        }
        // ====================================================
        // DEVOLVER RESULTADO DE LA ACTUALIZACIÓN
        // ====================================================
        return {
            success: errores.length === 0,
            errores: errores.length
        };
    }
    // ========================================================
    // 130. ACCIONES DE CUMPLEAÑOS
    //
    // Centraliza las acciones disponibles para cada
    // colaborador registrado en Recursos Humanos.
    //
    // Acciones disponibles:
    //
    // - Editar configuración individual.
    // - Consultar tarjeta personalizada.
    //
    // Valida el identificador antes de consultar el backend.
    // ========================================================
    async function ejecutarAccionCumpleanos(
        accion,
        empleadoId
    ) {
        // VALIDAR IDENTIFICADOR DEL COLABORADOR.
        const id = validarId(empleadoId);
        // ====================================================
        // EJECUTAR ACCIÓN SOLICITADA
        // ====================================================
        switch (accion) {
            // ================================================
            // CONFIGURACIÓN INDIVIDUAL
            // ================================================
            case 'editar-cumpleanos':
            case 'configurar-cumpleanos':
                await abrirConfiguracionCumpleanos(id);
                break;
            // ================================================
            // CONSULTAR TARJETA PERSONALIZADA
            // ================================================
            case 'ver-tarjeta':
            case 'tarjeta-cumpleanos':
                await abrirTarjetaCumpleanos(id);
                break;
            // ================================================
            // ACCIÓN NO RECONOCIDA
            // ================================================
            default:
                console.warn(
                    '[Transformín] Acción de cumpleaños desconocida:',
                    accion
                );
        }
    }
    // ========================================================
    // 131. EVENTOS DELEGADOS DE CUMPLEAÑOS
    //
    // Configura los eventos de los botones generados
    // dinámicamente dentro de los listados.
    //
    // La delegación permite conservar los eventos cuando
    // se actualizan los filtros, tarjetas o paginación.
    // ========================================================
    function configurarAccionesCumpleanos() {
        // ====================================================
        // CONTENEDORES CON ACCIONES DISPONIBLES
        // ====================================================
        [
            'listaCumpleanos',
            'listaCumpleanosHoy',
            'listaAlertasCumpleanos'
        ].forEach(id => {
            // CONFIGURAR EVENTO CLICK DEL CONTENEDOR.
            enlazar(
                id,
                'click',
                eventoSeguro(async evento => {
                    // ========================================
                    // IDENTIFICAR BOTÓN SELECCIONADO
                    // ========================================
                    const boton = evento.target.closest(
                        '[data-accion][data-empleado-id]'
                    );
                    // Ignorar elementos sin acciones y
                    // botones que se encuentren deshabilitados.
                    if (!boton || boton.disabled) {
                        return;
                    }
                    // ========================================
                    // EJECUTAR ACCIÓN DEL COLABORADOR
                    // ========================================
                    await ejecutarAccionCumpleanos(
                        boton.dataset.accion,
                        boton.dataset.empleadoId
                    );
                })
            );
        });
    }
    // ========================================================
    // 132. CONFIGURAR FILTROS DE CUMPLEAÑOS
    //
    // Conecta los campos de búsqueda, selectores,
    // botón de limpieza y controles de paginación.
    //
    // Utiliza debounce para evitar renderizaciones
    // excesivas durante la escritura.
    // ========================================================
    function configurarFiltrosCumpleanos() {
        // ====================================================
        // BÚSQUEDA GENERAL DE COLABORADORES
        // ====================================================
        enlazar(
            'buscarCumpleanos',
            'input',
            debounce(() =>
                aplicarFiltrosCumpleanos()
            )
        );
        // ====================================================
        // FILTROS POR MES Y PERIODO
        // ====================================================
        enlazarVarios(
            [
                'filtroCumpleanosMes',
                'filtroCumpleanosPeriodo'
            ],
            'change',
            () => aplicarFiltrosCumpleanos()
        );
        // ====================================================
        // RESTABLECER FILTROS
        // ====================================================
        enlazar(
            'btnLimpiarCumpleanos',
            'click',
            limpiarFiltrosCumpleanos
        );
        // ====================================================
        // CONFIGURAR PAGINACIÓN
        //
        // Actualiza la página seleccionada sin consultar
        // nuevamente la información del backend.
        // ====================================================
        enlazarPaginacion(
            'paginacionCumpleanos',
            pagina => {
                estado.paginaCumpleanos = pagina;
                pintarCumpleanos();
            }
        );
    }
    // ========================================================
    // 133. CONFIGURAR FORMULARIO INDIVIDUAL
    //
    // Conecta los eventos del formulario de configuración
    // personalizada de cada colaborador.
    //
    // Actualiza los valores efectivos cuando se modifican
    // las preferencias individuales.
    // ========================================================
    function configurarFormularioCumpleanos() {
        // ====================================================
        // GUARDAR CONFIGURACIÓN INDIVIDUAL
        // ====================================================
        enlazar(
            'formEditarCumpleanos',
            'submit',
            eventoSeguro(
                guardarConfiguracionCumpleanos
            )
        );
        // ====================================================
        // ACTUALIZAR CONFIGURACIÓN VISUAL
        //
        // Reacciona a cambios en alertas, felicitaciones,
        // anticipación y hora personalizada.
        // ====================================================
        enlazarVarios(
            [
                'cumpleanosAlertaActiva',
                'cumpleanosFelicitacionActiva',
                'cumpleanosDiasAnticipacion',
                'cumpleanosHoraEnvio'
            ],
            'change',
            actualizarConfiguracionIndividualVisual
        );
        // ====================================================
        // ACTUALIZAR ANTICIPACIÓN EN TIEMPO REAL
        // ====================================================
        enlazar(
            'cumpleanosDiasAnticipacion',
            'input',
            actualizarConfiguracionIndividualVisual
        );
        // ====================================================
        // PREVISUALIZAR TARJETA PERSONALIZADA
        //
        // La previsualización no realiza envíos de correo
        // ni guarda automáticamente el formulario.
        // ====================================================
        enlazar(
            'btnPrevisualizarTarjeta',
            'click',
            eventoSeguro(
                previsualizarTarjetaDesdeConfiguracion
            )
        );
    }
    // ========================================================
    // 134. CONFIGURAR MODAL DE TARJETAS
    //
    // Conecta las acciones de regeneración, descarga,
    // regreso a configuración y liberación de recursos.
    //
    // Cancela las solicitudes pendientes cuando se cierra
    // el modal de previsualización.
    // ========================================================
    function configurarModalTarjetas() {
        // ====================================================
        // REGENERAR TARJETA PERSONALIZADA
        // ====================================================
        enlazar(
            'btnRegenerarTarjetaCumpleanos',
            'click',
            eventoSeguro(
                regenerarTarjetaCumpleanos
            )
        );
        // ====================================================
        // DESCARGAR TARJETA EN FORMATO PNG
        // ====================================================
        enlazar(
            'btnDescargarTarjetaCumpleanos',
            'click',
            descargarTarjetaCumpleanos
        );
        // ====================================================
        // REGRESAR A CONFIGURACIÓN INDIVIDUAL
        // ====================================================
        enlazar(
            'btnVolverConfiguracionCumpleanos',
            'click',
            volverConfiguracionCumpleanos
        );
        // ====================================================
        // LIBERAR RECURSOS AL CERRAR EL MODAL
        //
        // Incrementa la versión para invalidar respuestas
        // pendientes de solicitudes anteriores.
        // ====================================================
        enlazar(
            'modalTarjetaCumpleanos',
            'hidden.bs.modal',
            () => {
                // INVALIDAR SOLICITUDES ANTERIORES.
                estado.tarjetaVersion++;
                // LIBERAR IMÁGENES Y CONTROLADORES.
                liberarTarjeta();
                // LIMPIAR COLABORADOR DE LA TARJETA.
                estado.tarjetaEmpleadoId = null;
            }
        );
        // ====================================================
        // LIBERAR RECURSOS AL ABANDONAR LA PÁGINA
        // ====================================================
        window.addEventListener(
            'pagehide',
            liberarTarjeta
        );
    }
    // ========================================================
    // 135. CONFIGURAR FORMULARIO GENERAL
    //
    // Conecta los eventos de configuración general de
    // recordatorios, felicitaciones y avisos administrativos.
    //
    // También integra el restablecimiento de preferencias
    // y la comprobación de la conexión SMTP.
    // ========================================================
    function configurarFormularioRecordatorios() {
        // ====================================================
        // GUARDAR CONFIGURACIÓN GENERAL
        // ====================================================
        enlazar(
            'formConfiguracionRecordatorios',
            'submit',
            eventoSeguro(
                guardarConfiguracion
            )
        );
        // ====================================================
        // ACTUALIZAR CAMPOS CONDICIONALES
        //
        // Reacciona a la activación y desactivación de
        // las funcionalidades generales del módulo.
        // ====================================================
        enlazarVarios(
            [
                'activarRecordatorios',
                'activarFelicitaciones',
                'activarAvisosAdmin'
            ],
            'change',
            actualizarCamposRecordatorios
        );
        // ====================================================
        // SOLICITAR CONFIRMACIÓN DE RESTABLECIMIENTO
        // ====================================================
        enlazar(
            'btnRestablecerConfiguracion',
            'click',
            confirmarRestablecimientoConfiguracion
        );
        // ====================================================
        // CONFIRMAR RESTABLECIMIENTO DE PREFERENCIAS
        // ====================================================
        enlazar(
            'btnConfirmarRestablecimiento',
            'click',
            eventoSeguro(
                restablecerConfiguracion
            )
        );
        // ====================================================
        // VERIFICAR CONEXIÓN SMTP
        //
        // Solicita al backend comprobar la disponibilidad
        // del servicio de correo electrónico.
        // ====================================================
        enlazar(
            'btnVerificarSMTP',
            'click',
            eventoSeguro(
                verificarSMTP
            )
        );
    }
    // ========================================================
    // 136. CONFIGURAR BOTONES DE ACTUALIZACIÓN
    //
    // Conecta los botones de actualización general de
    // cumpleaños y actualización independiente de alertas.
    // ========================================================
    function configurarActualizacionesCumpleanos() {
        // ACTUALIZAR MÓDULO COMPLETO DE CUMPLEAÑOS.
        enlazar(
            'btnActualizarCumpleanos',
            'click',
            eventoSeguro(async () => {
                const resultado = await conCarga(
                    actualizarModuloCumpleanos
                );
                // Notificar únicamente cuando la actualización
                // se completa correctamente.
                if (resultado?.success) {
                    notificar(
                        'Información de cumpleaños actualizada correctamente.'
                    );
                }
            })
        );
        // ACTUALIZAR EXCLUSIVAMENTE LAS ALERTAS.
        enlazar(
            'btnActualizarAlertasCumpleanos',
            'click',
            eventoSeguro(async () => {
                await cargarAlertasCumpleanos();
                notificar(
                    'Alertas de cumpleaños actualizadas.'
                );
            })
        );
    }
    // ========================================================
    // 137. CONFIGURACIÓN CENTRALIZADA DE RECURSOS HUMANOS
    //
    // Agrupa la configuración de eventos correspondientes
    // al módulo de cumpleaños de Transformín.
    //
    // Esta función se utiliza durante la inicialización
    // general del Cronograma de Transformín.
    // ========================================================
    function configurarModuloCumpleanos() {
        // CONFIGURAR ACCIONES DE LOS COLABORADORES.
        configurarAccionesCumpleanos();
        // CONFIGURAR BÚSQUEDA, FILTROS Y PAGINACIÓN.
        configurarFiltrosCumpleanos();
        // CONFIGURAR FORMULARIO INDIVIDUAL.
        configurarFormularioCumpleanos();
        // CONFIGURAR MODAL DE TARJETAS PERSONALIZADAS.
        configurarModalTarjetas();
        // CONFIGURAR RECORDATORIOS Y FELICITACIONES.
        configurarFormularioRecordatorios();
        // CONFIGURAR BOTONES DE ACTUALIZACIÓN.
        configurarActualizacionesCumpleanos();
        // ESTABLECER ESTADO INICIAL DEL SERVICIO SMTP.
        //
        // No se considera conectado hasta que el servidor
        // confirme correctamente la verificación.
        pintarEstadoSMTP(
            'pendiente',
            'Conexión SMTP pendiente de verificación.'
        );
    }
    // ========================================================
    // 138. CARGA INICIAL DE RECURSOS HUMANOS
    //
    // Recupera la configuración general y el estado
    // del servicio de cumpleaños.
    //
    // Posteriormente actualiza los colaboradores,
    // indicadores, alertas y calendario.
    //
    // Promise.allSettled permite continuar cuando una
    // de las consultas presenta inconvenientes.
    // ========================================================
    async function inicializarRecursosHumanos() {
        // CONSULTAR CONFIGURACIÓN Y ESTADO DEL SERVICIO.
        const resultados = await Promise.allSettled([
            cargarConfiguracion(),
            cargarEstadoServicioCumpleanos()
        ]);
        // REGISTRAR POSIBLES ERRORES DE INICIALIZACIÓN.
        resultados.forEach(resultado => {
            if (resultado.status === 'rejected') {
                console.error(
                    '[Transformín] Configuración de Recursos Humanos:',
                    resultado.reason
                );
            }
        });
        // ACTUALIZAR INFORMACIÓN COMPLETA DE CUMPLEAÑOS.
        return actualizarModuloCumpleanos();
    }
    /* ========================================================
       MÓDULO DOCUMENTAL DEL CRONOGRAMA DE TRANSFORMÍN

       FORMATO INSTITUCIONAL FT-SST-147

       FUNCIONALIDADES:

       - Importación de archivos Excel.
       - Validación previa de documentos.
       - Previsualización de actividades.
       - Exportación de cronogramas.
       - Historial de importaciones.
       - Historial de notificaciones.
       - Auditoría de actividades.
       - Compatibilidad con diferentes años.
    ======================================================== */
    // ========================================================
    // 139. CONFIGURACIÓN DEL FORMATO INSTITUCIONAL FT-SST-147
    //
    // Define las características del documento oficial
    // utilizado por el Cronograma de Transformín.
    //
    // Object.freeze evita modificaciones accidentales
    // de las propiedades de configuración.
    // ========================================================
    const CONFIG_EXCEL_FT147 = Object.freeze({
        // CÓDIGO DEL DOCUMENTO INSTITUCIONAL.
        codigo: 'FT-SST-147',
        // VERSIÓN DEL FORMATO.
        version: '001',
        // NOMBRE OFICIAL DEL DOCUMENTO.
        nombre: 'Cronograma de Actividades para Transformín',
        // EXTENSIÓN DE ARCHIVO PERMITIDA.
        extension: '.xlsx',
        // TAMAÑO MÁXIMO PERMITIDO: 5 MB.
        maximoBytes: 5 * 1024 * 1024,
        // CAPACIDAD MÁXIMA DEL FORMATO INSTITUCIONAL.
        maximoActividades: 36,
        // AÑO MÍNIMO ADMITIDO.
        anioMinimo: 1900,
        // TIPO MIME DE LOS ARCHIVOS EXCEL XLSX.
        contentType:
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });
    // ========================================================
    // 140. RUTAS DE EXCEL, HISTORIALES Y AUDITORÍA
    //
    // Centraliza las rutas utilizadas por el módulo
    // documental del Cronograma de Transformín.
    //
    // Estas rutas son relativas a la API principal.
    // ========================================================
    const RUTAS_DOCUMENTALES = Object.freeze({
        // VALIDAR Y PREVISUALIZAR ARCHIVO EXCEL.
        previsualizar: '/excel/preview',
        // IMPORTAR ACTIVIDADES INSTITUCIONALES.
        importar: '/excel/importar',
        // EXPORTAR CRONOGRAMA INSTITUCIONAL.
        exportar: '/excel/exportar',
        // CONSULTAR HISTORIAL DE IMPORTACIONES.
        importaciones: '/excel/historial',
        // CONSULTAR ACTIVIDADES INSTITUCIONALES.
        institucional: '/institucional',
        // CONSULTAR HISTORIAL DE NOTIFICACIONES.
        notificaciones: '/historial',
        // CONSULTAR INDICADORES DE NOTIFICACIONES.
        indicadoresNotificaciones:
            '/indicadores/notificaciones',
        // CONSULTAR HISTORIAL Y AUDITORÍA DE ACTIVIDADES.
        auditoria: '/historial/actividades',
        // CONSULTAR DETALLE DE UNA NOTIFICACIÓN.
        detalleNotificacion: id =>
            `/notificaciones/${encodeURIComponent(id)}`
    });
    // ========================================================
    // 141. ESTADO COMPLEMENTARIO DEL MÓDULO DOCUMENTAL
    //
    // Amplía el objeto principal de estado sin reemplazar
    // las propiedades de los módulos anteriores.
    //
    // Gestiona archivos, importaciones, exportaciones,
    // historiales, indicadores y paginaciones independientes.
    // ========================================================
    Object.assign(estado, {
        // ====================================================
        // ESTADO DE ARCHIVOS EXCEL
        // ====================================================
        // Archivo seleccionado por el usuario.
        archivoExcelSeleccionado: null,
        // Resultado de la previsualización del archivo.
        importacion: null,
        // Indica si la importación superó las validaciones.
        importacionValida: false,
        // Año correspondiente a la validación realizada.
        anioImportacionValidado: null,
        // Identificador de versión de la importación.
        // Permite distinguir solicitudes consecutivas.
        versionImportacion: 0,
        // Controlador para cancelar solicitudes pendientes.
        controladorImportacion: null,
        // ====================================================
        // CONTROL DE OPERACIONES DOCUMENTALES
        // ====================================================
        // Validación de Excel en ejecución.
        validandoExcel: false,
        // Importación de Excel en ejecución.
        importandoExcel: false,
        // Exportación de Excel en ejecución.
        exportandoExcel: false,
        // Información de la exportación seleccionada.
        resumenExportacion: null,
        // ====================================================
        // HISTORIALES DEL CRONOGRAMA
        // ====================================================
        // Historial de notificaciones y felicitaciones.
        historialNotificaciones: [],
        // Historial de modificaciones de actividades.
        historialActividades: [],
        // Historial de archivos Excel importados.
        historialImportaciones: [],
        // Indicadores generales de notificaciones.
        indicadoresNotificaciones: {},
        // ====================================================
        // PAGINACIÓN INDEPENDIENTE DE HISTORIALES
        // ====================================================
        paginaHistorialNotificaciones: 1,
        paginaHistorialActividades: 1,
        paginaHistorialImportaciones: 1,
        // Cantidad de registros por página.
        porPaginaHistorial: 10
    });
    // ========================================================
    // 142. VALIDAR AÑO DEL DOCUMENTO INSTITUCIONAL
    //
    // Comprueba que el año seleccionado sea un número
    // entero dentro del intervalo permitido.
    //
    // Compatible con años anteriores y posteriores,
    // hasta el límite técnico establecido de 9999.
    // ========================================================
    function validarAnioDocumental(valor) {
        // CONVERTIR VALOR A NÚMERO.
        const anio = Number(valor);
        // VALIDAR FORMATO Y RANGO DEL AÑO.
        if (
            !Number.isInteger(anio) ||
            anio < CONFIG_EXCEL_FT147.anioMinimo ||
            anio > 9999
        ) {
            throw new Error(
                'Selecciona un año válido para el cronograma institucional.'
            );
        }
        // DEVOLVER AÑO VALIDADO.
        return anio;
    }
    // ========================================================
    // 143. NORMALIZAR TAMAÑO DEL ARCHIVO
    //
    // Convierte el tamaño de un archivo expresado
    // en bytes a una representación comprensible.
    //
    // Unidades disponibles:
    //
    // - B: bytes.
    // - KB: kilobytes.
    // - MB: megabytes.
    // ========================================================
    function formatearTamanoExcel(bytes) {
        const cantidad = Number(bytes) || 0;
        // ARCHIVOS INFERIORES A 1 KB.
        if (cantidad < 1024) {
            return `${cantidad} B`;
        }
        // ARCHIVOS INFERIORES A 1 MB.
        if (cantidad < 1024 * 1024) {
            return `${(
                cantidad / 1024
            ).toFixed(1)} KB`;
        }
        // ARCHIVOS IGUALES O SUPERIORES A 1 MB.
        return `${(
            cantidad / (1024 * 1024)
        ).toFixed(2)} MB`;
    }
    // ========================================================
    // 144. FORMATEAR FECHAS DE HISTORIALES
    //
    // Normaliza las fechas provenientes de MySQL,
    // registros de auditoría, notificaciones e importaciones.
    //
    // Utiliza el formato regional de Colombia.
    //
    // Conserva las fechas locales sin zona horaria para
    // evitar desplazamientos incorrectos de horas.
    // ========================================================
    function fechaHoraHistorial(valor) {
        // CONTROLAR FECHAS NO DISPONIBLES.
        if (!valor) return 'Sin registro';
        const original = String(valor);
        // ====================================================
        // FECHAS LOCALES SIN ZONA HORARIA
        //
        // Ejemplos:
        //
        // 2026-11-25 08:30:00
        // 2026-11-25T08:30:00
        //
        // Se presentan tal como fueron entregadas
        // por el servidor, sin conversiones adicionales.
        // ====================================================
        const coincidencia = original.match(
            /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::\d{2})?$/
        );
        if (coincidencia) {
            const [
                ,
                anio,
                mes,
                dia,
                hora,
                minuto
            ] = coincidencia;
            return `${dia}/${mes}/${anio} ${hora}:${minuto}`;
        }
        // ====================================================
        // FECHAS SIN COMPONENTE DE HORA
        // ====================================================
        if (
            /^\d{4}-\d{2}-\d{2}$/.test(original)
        ) {
            return fechaBonita(original);
        }
        // ====================================================
        // CONVERTIR FECHAS CON ZONA HORARIA
        // ====================================================
        const fecha = new Date(valor);
        // CONSERVAR VALOR ORIGINAL SI NO ES INTERPRETABLE.
        if (Number.isNaN(fecha.getTime())) {
            return original;
        }
        // ====================================================
        // FORMATEAR FECHA Y HORA PARA COLOMBIA
        // ====================================================
        return new Intl.DateTimeFormat(
            'es-CO',
            {
                timeZone: 'America/Bogota',
                dateStyle: 'short',
                timeStyle: 'short'
            }
        ).format(fecha);
    }
    // ========================================================
    // 145. VALIDAR ARCHIVO EXCEL SELECCIONADO
    //
    // Comprueba la existencia, extensión y tamaño del archivo.
    // Solo admite documentos XLSX de máximo 5 MB.
    // ========================================================
    function validarArchivoInstitucional(archivo) {
        if (!(archivo instanceof File)) {
            throw new Error(
                'Selecciona un archivo Excel.'
            );
        }
        const nombre = archivo.name.toLowerCase();
        // VALIDAR EXTENSIÓN DEL DOCUMENTO.
        if (
            !nombre.endsWith(
                CONFIG_EXCEL_FT147.extension
            )
        ) {
            throw new Error(
                'Únicamente se permiten archivos Excel con extensión .xlsx.'
            );
        }
        // IMPEDIR LA IMPORTACIÓN DE ARCHIVOS VACÍOS.
        if (!archivo.size) {
            throw new Error(
                'El archivo seleccionado se encuentra vacío.'
            );
        }
        // VALIDAR TAMAÑO MÁXIMO PERMITIDO.
        if (
            archivo.size >
            CONFIG_EXCEL_FT147.maximoBytes
        ) {
            throw new Error(
                'El archivo no puede superar los 5 MB.'
            );
        }
        return archivo;
    }
    // ========================================================
    // 146. CONFIGURAR SELECTORES DE AÑO
    //
    // Genera dinámicamente los años disponibles.
    //
    // Compatible con años anteriores y posteriores.
    // Incluye cinco años adicionales respecto al año actual
    // y conserva el periodo seleccionado cuando es superior.
    // ========================================================
    function prepararSelectorAnioDocumental(
        id,
        seleccionado = estado.anio
    ) {
        const selector = $(id);
        if (!selector) return;
        const anio = validarAnioDocumental(
            seleccionado
        );
        // GENERAR OPCIONES CUANDO EL ELEMENTO ES UN SELECT.
        if (selector.tagName === 'SELECT') {
            const anioActual = Number(
                hoy().substring(0, 4)
            );
            // ESTABLECER LÍMITE DE AÑOS DISPONIBLES.
            const limite = Math.min(
                9999,
                Math.max(
                    CONFIG.ANIO_MAXIMO,
                    anio
                )
            );
            const opciones = [];
            // GENERAR OPCIONES DESDE EL AÑO MÍNIMO.
            for (
                let periodo =
                    CONFIG_EXCEL_FT147.anioMinimo;
                periodo <= limite;
                periodo++
            ) {
                opciones.push(
                    `<option value="${periodo}">
                        ${periodo}
                    </option>`
                );
            }
            selector.innerHTML = opciones.join('');
        }
        // ESTABLECER EL AÑO SELECCIONADO.
        selector.value = String(anio);
    }
    // ========================================================
    // 147. CONSTRUIR FORMULARIO MULTIPART
    //
    // Prepara el documento Excel y el año seleccionado
    // para enviarlos al backend mediante FormData.
    //
    // Conserva los nombres de los campos originales:
    //
    // - archivo
    // - anio
    // ========================================================
    function crearFormularioInstitucional(
        archivo,
        anio
    ) {
        // VALIDAR ARCHIVO Y PERIODO.
        validarArchivoInstitucional(archivo);
        const periodo =
            validarAnioDocumental(anio);
        // CREAR FORMULARIO MULTIPART.
        const formulario = new FormData();
        // ADJUNTAR DOCUMENTO EXCEL.
        formulario.append(
            'archivo',
            archivo,
            archivo.name
        );
        // ADJUNTAR AÑO DEL CRONOGRAMA.
        formulario.append(
            'anio',
            String(periodo)
        );
        return formulario;
    }
    // ========================================================
    // 148. PETICIÓN MULTIPART AL SERVIDOR
    //
    // Envía archivos Excel al backend conservando
    // la sesión autenticada del usuario.
    //
    // Permite cancelar solicitudes de validación.
    //
    // No establece manualmente Content-Type porque
    // el navegador genera automáticamente el boundary
    // correspondiente al formulario multipart.
    // ========================================================
    async function peticionExcelDocumental(
        ruta,
        formulario,
        signal
    ) {
        // REALIZAR SOLICITUD AL BACKEND.
        const respuesta = await fetch(
            `${API}${ruta}`,
            {
                method: 'POST',
                credentials: 'same-origin',
                cache: 'no-store',
                headers: {
                    Accept: 'application/json'
                },
                body: formulario,
                signal
            }
        );
        // ====================================================
        // VALIDAR TIPO DE RESPUESTA
        //
        // Evita interpretar páginas HTML de inicio de sesión
        // o respuestas inesperadas como documentos JSON.
        // ====================================================
        const tipo =
            respuesta.headers.get('content-type') || '';
        if (!tipo.includes('application/json')) {
            throw new Error(
                respuesta.status === 401 ||
                respuesta.redirected
                    ? 'La sesión ha expirado. Inicia sesión nuevamente.'
                    : 'El servidor devolvió una respuesta no válida.'
            );
        }
        // CONVERTIR RESPUESTA A JSON.
        const datos = await respuesta.json();
        // ====================================================
        // CONTROLAR ERRORES DE VALIDACIÓN DOCUMENTAL
        //
        // El servidor puede devolver HTTP 400 o 422 junto
        // con el detalle de validación de un Excel inválido.
        //
        // En estos casos se conserva la respuesta para
        // mostrar los errores específicos del documento.
        // ====================================================
        const validacionDocumental =
            ruta === RUTAS_DOCUMENTALES.previsualizar &&
            [400, 422].includes(respuesta.status) &&
            (
                Array.isArray(datos.errores) ||
                datos.valido === false
            );
        // ====================================================
        // CONTROLAR ERRORES GENERALES DEL SERVIDOR
        // ====================================================
        if (
            !validacionDocumental &&
            (
                !respuesta.ok ||
                datos.success === false
            )
        ) {
            throw new Error(
                datos.mensaje ||
                datos.message ||
                datos.error ||
                `Error HTTP ${respuesta.status}`
            );
        }
        // DEVOLVER RESULTADO DE LA OPERACIÓN.
        return datos;
    }
    // ========================================================
    // 149. CANCELAR VALIDACIÓN ANTERIOR
    //
    // Cancela una solicitud pendiente cuando el usuario
    // cambia el documento o el año de importación.
    //
    // Incrementa la versión para invalidar respuestas
    // correspondientes a documentos anteriores.
    // ========================================================
    function cancelarValidacionExcel() {
        // INVALIDAR VERSIÓN ANTERIOR.
        estado.versionImportacion++;
        // CANCELAR SOLICITUD ACTIVA.
        if (estado.controladorImportacion) {
            estado.controladorImportacion.abort();
            estado.controladorImportacion = null;
        }
        // RESTABLECER ESTADO DE VALIDACIÓN.
        estado.validandoExcel = false;
    }
    // ========================================================
    // 150. CONTROL VISUAL DE PASOS DE IMPORTACIÓN
    //
    // Gestiona las tres etapas del proceso:
    //
    // 1. Selección del archivo.
    // 2. Validación y previsualización.
    // 3. Confirmación de importación.
    //
    // Incluye atributos de accesibilidad.
    // ========================================================
    function pintarPasoImportacion(paso) {
        const pasos = [
            'pasoImportacionArchivo',
            'pasoImportacionValidacion',
            'pasoImportacionConfirmacion'
        ];
        pasos.forEach((id, indice) => {
            const elemento = $(id);
            if (!elemento) return;
            // IDENTIFICAR PASO ACTUAL.
            elemento.classList.toggle(
                'activo',
                indice + 1 === paso
            );
            // IDENTIFICAR PASOS COMPLETADOS.
            elemento.classList.toggle(
                'completado',
                indice + 1 < paso
            );
            // ACTUALIZAR ATRIBUTOS DE ACCESIBILIDAD.
            if (indice + 1 === paso) {
                elemento.setAttribute(
                    'aria-current',
                    'step'
                );
            } else {
                elemento.removeAttribute(
                    'aria-current'
                );
            }
        });
    }
    // ========================================================
    // 151. INVALIDAR PREVISUALIZACIÓN ANTERIOR
    //
    // Elimina los resultados de una validación anterior.
    //
    // Impide confirmar una importación cuando se ha
    // modificado el archivo o el periodo seleccionado.
    // ========================================================
    function invalidarPrevisualizacionExcel() {
        // CANCELAR VALIDACIONES PENDIENTES.
        cancelarValidacionExcel();
        // LIMPIAR INFORMACIÓN DE IMPORTACIÓN.
        estado.importacion = null;
        estado.importacionValida = false;
        estado.anioImportacionValidado = null;
        // ====================================================
        // OCULTAR RESULTADOS ANTERIORES
        // ====================================================
        visible(
            'resumenImportacionExcel',
            false
        );
        visible(
            'contenedorErroresImportacion',
            false
        );
        visible(
            'contenedorAdvertenciasImportacion',
            false
        );
        visible(
            'resultadoImportacionExcel',
            false
        );
        // ====================================================
        // LIMPIAR TABLAS Y LISTADOS
        // ====================================================
        html('tablaPreviewExcel', '');
        html('listaErroresImportacion', '');
        html('listaAdvertenciasImportacion', '');
        // ====================================================
        // CONTROLAR BOTONES DE IMPORTACIÓN
        //
        // La confirmación permanece deshabilitada hasta
        // completar una nueva validación satisfactoria.
        // ====================================================
        deshabilitar(
            'btnConfirmarImportacion',
            true
        );
        deshabilitar(
            'btnValidarExcel',
            !estado.archivoExcelSeleccionado
        );
        // ACTUALIZAR ESTADO DE CONFIRMACIÓN.
        texto(
            'estadoConfirmacionImportacion',
            'Pendiente de validación'
        );
    }
    // ========================================================
    // 152. LIMPIAR PROCESO DE IMPORTACIÓN
    //
    // Restablece completamente el formulario documental
    // sin modificar los registros almacenados en MySQL.
    //
    // Impide limpiar el formulario mientras se encuentra
    // una importación en ejecución.
    // ========================================================
    function limpiarImportacionDocumental() {
        // PROTEGER IMPORTACIONES EN EJECUCIÓN.
        if (estado.importandoExcel) return;
        // ELIMINAR ARCHIVO SELECCIONADO.
        estado.archivoExcelSeleccionado = null;
        // INVALIDAR RESULTADOS ANTERIORES.
        invalidarPrevisualizacionExcel();
        // ====================================================
        // LIMPIAR CAMPO DE ARCHIVO
        // ====================================================
        setCampo('archivoExcel', '');
        texto('nombreArchivoExcel', '');
        texto('tamanoArchivoExcel', '');
        // ====================================================
        // RESTABLECER MENSAJES INFORMATIVOS
        // ====================================================
        texto(
            'estadoArchivoExcel',
            'Ningún archivo seleccionado'
        );
        texto(
            'textoValidacionExcel',
            'Selecciona el documento institucional para iniciar.'
        );
        // ====================================================
        // OCULTAR COMPONENTES DE VALIDACIÓN
        // ====================================================
        visible(
            'contenedorArchivoSeleccionado',
            false
        );
        visible(
            'errorImportacionExcel',
            false
        );
        visible(
            'estadoValidacionExcel',
            false
        );
        // ====================================================
        // RESTABLECER INDICADORES DE IMPORTACIÓN
        //
        // Incluye registros, programaciones, errores,
        // advertencias y resultados de almacenamiento.
        // ====================================================
        [
            'totalImportacionRegistros',
            'totalImportacionValidos',
            'totalImportacionErrores',
            'totalImportacionAdvertencias',
            'totalProgramacionesImportacion',
            'totalRealizadasImportacion',
            'totalPendientesImportacion',
            'totalSinClasificarImportacion',
            'totalImportacionInsertadas',
            'totalImportacionActualizadas',
            'totalImportacionOmitidas'
        ].forEach(id => texto(id, '0'));
        // REGRESAR AL PRIMER PASO.
        pintarPasoImportacion(1);
    }
    // ========================================================
    // 153. ABRIR MODAL DE IMPORTACIÓN
    //
    // Prepara el formulario institucional antes de abrir
    // la ventana de importación del documento FT-SST-147.
    //
    // Utiliza inicialmente el año seleccionado en el
    // Cronograma de Transformín.
    // ========================================================
    function abrirImportacionDocumental() {
        // IMPEDIR APERTURA DURANTE UNA IMPORTACIÓN ACTIVA.
        if (estado.importandoExcel) return;
        // LIMPIAR INFORMACIÓN ANTERIOR.
        limpiarImportacionDocumental();
        // PREPARAR SELECTOR DEL AÑO DE IMPORTACIÓN.
        prepararSelectorAnioDocumental(
            'anioImportarExcel'
        );
        // ABRIR VENTANA MODAL.
        abrirModal('modalImportarExcel');
    }
    // ========================================================
    // 154. MOSTRAR ERROR DE IMPORTACIÓN
    //
    // Centraliza la presentación de errores documentales.
    //
    // Muestra el mensaje dentro del modal y mediante
    // el sistema general de notificaciones del módulo.
    // ========================================================
    function mostrarErrorImportacionExcel(mensaje) {
        // ACTUALIZAR MENSAJE DEL FORMULARIO.
        texto(
            'errorImportacionExcel',
            mensaje
        );
        // MOSTRAR CONTENEDOR DE ERROR.
        visible(
            'errorImportacionExcel',
            true
        );
        // GENERAR NOTIFICACIÓN GENERAL.
        notificar(
            mensaje,
            'error'
        );
    }
    // ========================================================
    // 155. SELECCIONAR ARCHIVO INSTITUCIONAL
    // ========================================================
    function seleccionarArchivoInstitucional(archivo) {
        if (estado.importandoExcel) return;
        try {
            validarArchivoInstitucional(archivo);
            estado.archivoExcelSeleccionado = archivo;
            invalidarPrevisualizacionExcel();
            visible('errorImportacionExcel', false);
            visible(
                'contenedorArchivoSeleccionado',
                true
            );
            // Mostrar información del archivo seleccionado.
            texto(
                'nombreArchivoExcel',
                archivo.name
            );
            texto(
                'tamanoArchivoExcel',
                formatearTamanoExcel(archivo.size)
            );
            texto(
                'estadoArchivoExcel',
                'Archivo seleccionado'
            );
            texto(
                'textoValidacionExcel',
                'El archivo está listo para ser validado.'
            );
            deshabilitar('btnValidarExcel', false);
            pintarPasoImportacion(2);
            // Compatibilidad con la interfaz anterior,
            // que no dispone de un botón independiente
            // para iniciar la validación.
            if (!$('btnValidarExcel')) {
                void validarExcelInstitucional();
            }
        } catch (error) {
            limpiarImportacionDocumental();
            mostrarErrorImportacionExcel(
                error.message
            );
        }
    }
    // ========================================================
    // 156. QUITAR ARCHIVO SELECCIONADO
    //
    // Limpia el archivo y los resultados de validación.
    // No modifica los registros almacenados en MySQL.
    // ========================================================
    function quitarArchivoInstitucional() {
        if (estado.importandoExcel) return;
        limpiarImportacionDocumental();
    }
    // ========================================================
    // 157. CAMBIO DEL AÑO DE IMPORTACIÓN
    //
    // Invalida los resultados anteriores cuando cambia
    // el año seleccionado para la importación.
    // ========================================================
    function cambiarAnioImportacionDocumental() {
        if (estado.importandoExcel) return;
        invalidarPrevisualizacionExcel();
        if (estado.archivoExcelSeleccionado) {
            texto(
                'textoValidacionExcel',
                'El año cambió. Debes validar nuevamente el archivo.'
            );
            pintarPasoImportacion(2);
            if (!$('btnValidarExcel')) {
                void validarExcelInstitucional();
            }
        }
    }
    // ========================================================
    // 158. NORMALIZAR MENSAJES DE VALIDACIÓN
    //
    // Unifica los mensajes recibidos desde el backend.
    // Incluye información de fila, columna y descripción.
    // ========================================================
    function normalizarMensajeExcel(mensaje) {
        if (typeof mensaje === 'string') {
            return mensaje;
        }
        if (!mensaje) {
            return 'Detalle no disponible.';
        }
        const fila =
            mensaje.fila ??
            mensaje.row ??
            mensaje.numeroFila;
        const columna =
            mensaje.columna ??
            mensaje.celda;
        const detalle =
            mensaje.mensaje ||
            mensaje.message ||
            mensaje.error ||
            mensaje.detalle ||
            'Revisar información del documento.';
        return [
            fila ? `Fila ${fila}` : '',
            columna ? `Columna ${columna}` : '',
            detalle
        ].filter(Boolean).join(' — ');
    }
    // ========================================================
    // 159. RENDERIZAR ERRORES Y ADVERTENCIAS
    //
    // Presenta los mensajes de validación dentro del modal.
    // Escapa el contenido recibido para evitar insertar
    // directamente código HTML procedente del documento.
    // ========================================================
    function pintarMensajesExcel(
        idLista,
        idContenedor,
        mensajes
    ) {
        const lista = Array.isArray(mensajes)
            ? mensajes
            : [];
        visible(
            idContenedor,
            lista.length > 0
        );
        html(
            idLista,
            lista.map(mensaje => `
                <li>
                    ${escapar(
                        normalizarMensajeExcel(mensaje)
                    )}
                </li>
            `).join('')
        );
    }
    // ========================================================
    // 160. NORMALIZAR REGISTROS DE PREVISUALIZACIÓN
    //
    // Unifica las actividades y programaciones semanales
    // recibidas desde el servicio de importación Excel.
    //
    // Conserva las marcas institucionales:
    //
    // P: Programada.
    // R: Realizada.
    //
    // Las marcas sin clasificar no se contabilizan
    // automáticamente como actividades realizadas.
    // ========================================================
    function normalizarRegistroExcel(registro = {}) {
        const semanas = Array.isArray(registro.semanas)
            ? registro.semanas
            : Array.isArray(registro.programaciones)
                ? registro.programaciones
                : [];
        // ====================================================
        // CONTABILIZAR PROGRAMACIONES
        // ====================================================
        const programadas = semanas.filter(
            semana =>
                booleanoRH(semana.programada) ||
                (
                    semana.programada == null &&
                    ['P', 'R'].includes(
                        String(
                            semana.marca_original ||
                            semana.marca ||
                            ''
                        ).toUpperCase()
                    )
                )
        ).length;
        // ====================================================
        // CONTABILIZAR ACTIVIDADES REALIZADAS
        // ====================================================
        const realizadas = semanas.filter(
            semana =>
                semana.estado === 'COMPLETADA' ||
                String(
                    semana.marca_original ||
                    semana.marca ||
                    ''
                ).toUpperCase() === 'R'
        ).length;
        // ====================================================
        // CONSTRUIR REGISTRO NORMALIZADO
        // ====================================================
        return {
            ...registro,
            // Equipo, evento o nombre institucional.
            equipo:
                registro.equipo ||
                registro.nombre ||
                registro.actividad ||
                'Sin identificar',
            // Descripción de la actividad.
            descripcion:
                registro.descripcion ||
                registro.actividad ||
                'Sin descripción',
            // Frecuencia de ejecución.
            frecuencia:
                registro.frecuencia ||
                'No definida',
            // Responsable de la actividad.
            responsable:
                registro.responsable ||
                'Sin responsable',
            // Programaciones semanales originales.
            semanas,
            // Total de programaciones.
            programadas: numero(
                registro.totalProgramadas ??
                registro.programadas ??
                programadas
            ),
            // Total de actividades realizadas.
            realizadas: numero(
                registro.totalCompletadas ??
                registro.realizadas ??
                realizadas
            ),
            // Estado de validación del registro.
            valido:
                registro.valido !== false &&
                !(
                    Array.isArray(registro.errores) &&
                    registro.errores.length
                )
        };
    }
    // ========================================================
    // 161. NORMALIZAR RESPUESTA DE PREVISUALIZACIÓN
    //
    // Recupera registros, errores, advertencias e indicadores
    // generales entregados por el servicio documental.
    //
    // No autoriza la importación si el backend no confirma
    // expresamente que el documento es válido.
    // ========================================================
    function normalizarPrevisualizacionExcel(
        respuesta = {}
    ) {
        const datos =
            respuesta.preview ||
            respuesta.previsualizacion ||
            respuesta;
        // ====================================================
        // NORMALIZAR REGISTROS
        // ====================================================
        const registros = extraerLista(
            datos,
            'registros',
            'actividades',
            'filas'
        ).map(normalizarRegistroExcel);
        // ====================================================
        // RECUPERAR ERRORES Y ADVERTENCIAS
        // ====================================================
        const errores = Array.isArray(datos.errores)
            ? datos.errores
            : [];
        const advertencias = Array.isArray(
            datos.advertencias
        )
            ? datos.advertencias
            : [];
        // ====================================================
        // CALCULAR TOTALES
        // ====================================================
        const totalErrores = numero(
            datos.totalErrores ??
            errores.length
        );
        const totalValidos = numero(
            datos.totalValidos ??
            registros.filter(
                registro => registro.valido
            ).length
        );
        // ====================================================
        // RECUPERAR INDICADORES INSTITUCIONALES
        // ====================================================
        const indicadores =
            datos.indicadores?.anual ||
            datos.indicadores ||
            {};
        // ====================================================
        // CONSTRUIR RESULTADO NORMALIZADO
        // ====================================================
        return {
            ...datos,
            registros,
            errores,
            advertencias,
            totalRegistros: numero(
                datos.totalRegistros ??
                registros.length
            ),
            totalValidos,
            totalErrores,
            totalAdvertencias: numero(
                datos.totalAdvertencias ??
                advertencias.length
            ),
            indicadores,
            // La importación solamente se habilita cuando:
            //
            // 1. El backend confirma la validez.
            // 2. La respuesta no indica un fallo.
            // 3. No existen errores de validación.
            // 4. Existe al menos un registro válido.
            valido:
                datos.valido === true &&
                respuesta.success !== false &&
                totalErrores === 0 &&
                totalValidos > 0
        };
    }
    // ========================================================
    // 162. RENDERIZAR TABLA DE PREVISUALIZACIÓN
    //
    // Presenta las actividades encontradas en el Excel
    // antes de almacenarlas en la base de datos.
    //
    // Conserva las seis columnas de previsualización.
    // ========================================================
    function pintarTablaPrevisualizacionExcel(
        registros
    ) {
        // MOSTRAR ESTADO VACÍO.
        if (!registros.length) {
            html(
                'tablaPreviewExcel',
                `
                    <tr>
                        <td colspan="6"
                            class="text-center">

                            No se encontraron actividades válidas.

                        </td>
                    </tr>
                `
            );
            return;
        }
        // ====================================================
        // GENERAR FILAS DE PREVISUALIZACIÓN
        // ====================================================
        html(
            'tablaPreviewExcel',
            registros.map(registro => `
                <tr>

                    <!-- COLUMNA 01: EQUIPO O EVENTO -->

                    <td>
                        <strong>
                            ${escapar(registro.equipo)}
                        </strong>
                    </td>

                    <!-- COLUMNA 02: ACTIVIDAD -->

                    <td>
                        ${escapar(registro.descripcion)}
                    </td>

                    <!-- COLUMNA 03: FRECUENCIA -->

                    <td>
                        ${escapar(registro.frecuencia)}
                    </td>

                    <!-- COLUMNA 04: RESPONSABLE -->

                    <td>
                        ${escapar(registro.responsable)}
                    </td>

                    <!-- COLUMNA 05: PROGRAMACIONES -->

                    <td>
                        <strong>
                            ${registro.programadas}
                        </strong>

                        <small class="d-block text-muted">
                            ${registro.realizadas} realizadas
                        </small>
                    </td>

                    <!-- COLUMNA 06: VALIDACIÓN -->

                    <td>
                        <span class="badge ${
                            registro.valido
                                ? 'bg-success'
                                : 'bg-danger'
                        }">

                            ${
                                registro.valido
                                    ? 'Válido'
                                    : 'Revisar'
                            }

                        </span>
                    </td>

                </tr>
            `).join('')
        );
    }
    // ========================================================
    // 163. RENDERIZAR RESUMEN DE PREVISUALIZACIÓN
    //
    // Actualiza los indicadores generales del documento.
    //
    // Presenta registros válidos, errores, advertencias,
    // programaciones y marcas sin clasificar.
    // ========================================================
    function pintarResumenImportacionExcel(datos) {
        visible(
            'resumenImportacionExcel',
            true
        );
        // ====================================================
        // INDICADORES DE VALIDACIÓN
        // ====================================================
        texto(
            'totalImportacionRegistros',
            datos.totalRegistros
        );
        texto(
            'totalImportacionValidos',
            datos.totalValidos
        );
        texto(
            'totalImportacionErrores',
            datos.totalErrores
        );
        texto(
            'totalImportacionAdvertencias',
            datos.totalAdvertencias
        );
        // ====================================================
        // INDICADORES DE PROGRAMACIÓN INSTITUCIONAL
        // ====================================================
        const indicadores =
            datos.indicadores || {};
        texto(
            'totalProgramacionesImportacion',
            numero(indicadores.programadas)
        );
        texto(
            'totalRealizadasImportacion',
            numero(
                indicadores.completadas ??
                indicadores.realizadas
            )
        );
        texto(
            'totalPendientesImportacion',
            numero(indicadores.pendientes)
        );
        texto(
            'totalSinClasificarImportacion',
            numero(
                indicadores.sinClasificar ??
                indicadores.sin_clasificar
            )
        );
        // ====================================================
        // PRESENTAR ERRORES DEL DOCUMENTO
        // ====================================================
        pintarMensajesExcel(
            'listaErroresImportacion',
            'contenedorErroresImportacion',
            datos.errores
        );
        // ====================================================
        // PRESENTAR ADVERTENCIAS DEL DOCUMENTO
        // ====================================================
        pintarMensajesExcel(
            'listaAdvertenciasImportacion',
            'contenedorAdvertenciasImportacion',
            datos.advertencias
        );
        // ====================================================
        // PRESENTAR TABLA DE ACTIVIDADES
        // ====================================================
        pintarTablaPrevisualizacionExcel(
            datos.registros
        );
        // ====================================================
        // ACTUALIZAR ESTADO DE CONFIRMACIÓN
        // ====================================================
        texto(
            'estadoConfirmacionImportacion',
            datos.valido
                ? 'Documento validado correctamente'
                : 'Documento pendiente de correcciones'
        );
        // Bloquear la confirmación si existen errores.
        deshabilitar(
            'btnConfirmarImportacion',
            !datos.valido
        );
        // Avanzar al paso de confirmación únicamente
        // cuando la validación sea satisfactoria.
        pintarPasoImportacion(
            datos.valido ? 3 : 2
        );
    }
    // ========================================================
    // 164. VALIDAR Y PREVISUALIZAR EXCEL
    //
    // Ejecuta la validación del documento institucional
    // mediante el servicio documental del backend.
    //
    // Controla solicitudes simultáneas, cambios de archivo,
    // cambios de año y respuestas desactualizadas.
    //
    // Esta operación no almacena actividades en MySQL.
    // ========================================================
    async function validarExcelInstitucional() {
        // ====================================================
        // PREVENIR OPERACIONES SIMULTÁNEAS
        // ====================================================
        if (
            estado.validandoExcel ||
            estado.importandoExcel
        ) {
            return;
        }
        let archivo;
        let anio;
        // ====================================================
        // VALIDAR ARCHIVO Y AÑO
        // ====================================================
        try {
            archivo = validarArchivoInstitucional(
                estado.archivoExcelSeleccionado
            );
            anio = validarAnioDocumental(
                campo('anioImportarExcel')
            );
        } catch (error) {
            mostrarErrorImportacionExcel(
                error.message
            );
            return;
        }
        // ====================================================
        // INVALIDAR RESULTADOS ANTERIORES
        // ====================================================
        invalidarPrevisualizacionExcel();
        const version =
            estado.versionImportacion;
        // Crear controlador para cancelar la solicitud.
        const controlador =
            new AbortController();
        estado.controladorImportacion =
            controlador;
        estado.validandoExcel = true;
        // ====================================================
        // ACTUALIZAR ESTADO VISUAL
        // ====================================================
        visible(
            'errorImportacionExcel',
            false
        );
        visible(
            'estadoValidacionExcel',
            true
        );
        texto(
            'textoValidacionExcel',
            'Verificando la estructura del formato FT-SST-147...'
        );
        botonCargando(
            'btnValidarExcel',
            true,
            'Validando...'
        );
        try {
            // ================================================
            // PREPARAR FORMULARIO MULTIPART
            // ================================================
            const formulario =
                crearFormularioInstitucional(
                    archivo,
                    anio
                );
            // ================================================
            // SOLICITAR VALIDACIÓN AL BACKEND
            // ================================================
            const respuesta =
                await peticionExcelDocumental(
                    RUTAS_DOCUMENTALES.previsualizar,
                    formulario,
                    controlador.signal
                );
            // ================================================
            // COMPROBAR VIGENCIA DE LA RESPUESTA
            //
            // Ignorar respuestas correspondientes a:
            //
            // - Una versión anterior.
            // - Otro archivo seleccionado.
            // - Otro año de importación.
            // ================================================
            if (
                version !== estado.versionImportacion ||
                archivo !== estado.archivoExcelSeleccionado ||
                anio !== Number(
                    campo('anioImportarExcel')
                )
            ) {
                return;
            }
            // ================================================
            // NORMALIZAR RESPUESTA DEL SERVIDOR
            // ================================================
            const datos =
                normalizarPrevisualizacionExcel(
                    respuesta
                );
            // ================================================
            // ALMACENAR RESULTADO TEMPORAL
            // ================================================
            estado.importacion = datos;
            estado.importacionValida =
                datos.valido;
            estado.anioImportacionValidado =
                datos.valido ? anio : null;
            // ================================================
            // RENDERIZAR RESULTADOS DE VALIDACIÓN
            // ================================================
            pintarResumenImportacionExcel(datos);
            // ================================================
            // ACTUALIZAR MENSAJE DE VALIDACIÓN
            // ================================================
            texto(
                'textoValidacionExcel',
                datos.valido
                    ? 'Validación finalizada correctamente.'
                    : 'El archivo contiene información que debe revisarse.'
            );
            // ================================================
            // NOTIFICAR RESULTADO DE LA OPERACIÓN
            // ================================================
            notificar(
                datos.valido
                    ? 'Documento institucional validado correctamente.'
                    : 'Revisa los errores del documento antes de importar.',
                datos.valido
                    ? 'exito'
                    : 'advertencia'
            );
        } catch (error) {
            // ================================================
            // IGNORAR SOLICITUDES CANCELADAS
            // ================================================
            if (
                error.name === 'AbortError' ||
                version !== estado.versionImportacion
            ) {
                return;
            }
            // ================================================
            // INVALIDAR IMPORTACIÓN
            // ================================================
            estado.importacionValida = false;
            // ================================================
            // PRESENTAR ERROR DE VALIDACIÓN
            // ================================================
            mostrarErrorImportacionExcel(
                error.message
            );
        } finally {
            // ================================================
            // RESTABLECER CONTROLADOR Y BOTÓN
            //
            // Solo modifica el controlador correspondiente
            // a la solicitud actual.
            // ================================================
            if (
                estado.controladorImportacion ===
                controlador
            ) {
                estado.controladorImportacion = null;
                estado.validandoExcel = false;
                botonCargando(
                    'btnValidarExcel',
                    false
                );
            }
        }
    }
    // ========================================================
    // 165. BLOQUEAR CONTROLES DURANTE IMPORTACIÓN
    //
    // Impide modificar el archivo, cambiar el año o cerrar
    // el modal mientras se procesa la importación.
    // ========================================================
    function bloquearControlesImportacion(bloquear) {
        // BLOQUEAR CONTROLES DEL FORMULARIO.
        [
            'archivoExcel',
            'anioImportarExcel',
            'btnQuitarArchivoExcel',
            'btnValidarExcel'
        ].forEach(id => {
            deshabilitar(id, bloquear);
        });
        // ====================================================
        // CONTROLAR BOTÓN DE CONFIRMACIÓN
        //
        // Permanece deshabilitado cuando existe una operación
        // activa o cuando el documento no ha sido validado.
        // ====================================================
        deshabilitar(
            'btnConfirmarImportacion',
            bloquear ||
            !estado.importacionValida
        );
        // ====================================================
        // CONTROLAR BOTONES DE CIERRE DEL MODAL
        // ====================================================
        const modalExcel =
            $('modalImportarExcel');
        modalExcel
            ?.querySelectorAll(
                '[data-bs-dismiss="modal"]'
            )
            .forEach(boton => {
                boton.disabled = bloquear;
            });
        // ====================================================
        // RESTAURAR CONTROLES DESPUÉS DE LA OPERACIÓN
        // ====================================================
        if (!bloquear) {
            restaurarControlesExcelFinal();
        }
    }
    // ========================================================
    // 166. NORMALIZAR RESULTADO DE IMPORTACIÓN
    //
    // Unifica las propiedades recibidas desde el backend
    // para presentar los resultados de almacenamiento.
    //
    // Incluye:
    //
    // - Actividades insertadas.
    // - Actividades actualizadas.
    // - Actividades omitidas.
    // - Mensaje de confirmación.
    // ========================================================
    function normalizarResultadoImportacion(
        respuesta = {}
    ) {
        // RECUPERAR RESULTADO DEL SERVIDOR.
        const datos =
            respuesta.resultado ||
            respuesta;
        return {
            // NUEVOS REGISTROS ALMACENADOS.
            insertadas: numero(
                datos.insertadas ??
                datos.insertados ??
                datos.importados
            ),
            // REGISTROS EXISTENTES ACTUALIZADOS.
            actualizadas: numero(
                datos.actualizadas ??
                datos.actualizados
            ),
            // REGISTROS OMITIDOS O DUPLICADOS.
            omitidas: numero(
                datos.omitidas ??
                datos.omitidos ??
                datos.duplicados
            ),
            // MENSAJE GENERAL DE LA OPERACIÓN.
            mensaje:
                datos.mensaje ||
                datos.message ||
                respuesta.mensaje ||
                respuesta.message ||
                'Importación procesada correctamente.'
        };
    }
    // ========================================================
    // 167. MOSTRAR RESULTADO DE IMPORTACIÓN
    //
    // Presenta los resultados confirmados por el backend
    // después de procesar el documento institucional.
    //
    // No permite confirmar nuevamente la misma importación
    // sin realizar otra validación.
    // ========================================================
    function pintarResultadoImportacion(datos) {
        // MOSTRAR CONTENEDOR DE RESULTADOS.
        visible(
            'resultadoImportacionExcel',
            true
        );
        // ====================================================
        // MENSAJE GENERAL DE IMPORTACIÓN
        // ====================================================
        texto(
            'mensajeResultadoImportacion',
            datos.mensaje
        );
        // ====================================================
        // TOTAL DE ACTIVIDADES INSERTADAS
        // ====================================================
        texto(
            'totalImportacionInsertadas',
            datos.insertadas
        );
        // ====================================================
        // TOTAL DE ACTIVIDADES ACTUALIZADAS
        // ====================================================
        texto(
            'totalImportacionActualizadas',
            datos.actualizadas
        );
        // ====================================================
        // TOTAL DE ACTIVIDADES OMITIDAS
        // ====================================================
        texto(
            'totalImportacionOmitidas',
            datos.omitidas
        );
        // ====================================================
        // ACTUALIZAR ESTADO GENERAL DE CONFIRMACIÓN
        // ====================================================
        texto(
            'estadoConfirmacionImportacion',
            'Importación finalizada'
        );
        // ====================================================
        // ACTUALIZAR ESTADO DEL DOCUMENTO
        // ====================================================
        texto(
            'estadoArchivoExcel',
            'Documento procesado'
        );
        // ====================================================
        // IMPEDIR CONFIRMACIONES REPETIDAS
        // ====================================================
        deshabilitar(
            'btnConfirmarImportacion',
            true
        );
    }
    // ========================================================
    // 168. CONFIRMAR IMPORTACIÓN INSTITUCIONAL
    //
    // Envía el documento Excel previamente validado al
    // backend para realizar el almacenamiento definitivo.
    //
    // Controles principales:
    //
    // - Prevención de solicitudes simultáneas.
    // - Validación previa obligatoria.
    // - Comprobación del año seleccionado.
    // - Bloqueo temporal del formulario.
    // - Actualización posterior del ERP.
    // - Manejo de errores.
    // ========================================================
    async function importarExcelInstitucional() {
        // ====================================================
        // PREVENIR OPERACIONES SIMULTÁNEAS
        // ====================================================
        if (
            estado.importandoExcel ||
            estado.validandoExcel
        ) {
            return;
        }
        // ====================================================
        // COMPROBAR VALIDACIÓN PREVIA DEL DOCUMENTO
        // ====================================================
        if (
            !estado.importacionValida ||
            !estado.importacion ||
            !estado.archivoExcelSeleccionado
        ) {
            mostrarErrorImportacionExcel(
                'Primero debes seleccionar y validar el archivo Excel.'
            );
            return;
        }
        // ====================================================
        // VALIDAR AÑO DE IMPORTACIÓN
        // ====================================================
        let anio;
        try {
            anio = validarAnioDocumental(
                campo('anioImportarExcel')
            );
            // COMPROBAR QUE EL AÑO NO HAYA CAMBIADO
            // DESPUÉS DE VALIDAR EL DOCUMENTO.
            if (
                anio !==
                estado.anioImportacionValidado
            ) {
                invalidarPrevisualizacionExcel();
                throw new Error(
                    'El año de importación cambió. Valida nuevamente el archivo.'
                );
            }
        } catch (error) {
            mostrarErrorImportacionExcel(
                error.message
            );
            return;
        }
        // ====================================================
        // ESTABLECER ESTADO DE IMPORTACIÓN ACTIVA
        // ====================================================
        estado.importandoExcel = true;
        // BLOQUEAR CONTROLES DEL FORMULARIO.
        bloquearControlesImportacion(true);
        // MOSTRAR ESTADO DE CARGA EN EL BOTÓN.
        botonCargando(
            'btnConfirmarImportacion',
            true,
            'Importando...'
        );
        // OCULTAR ERRORES DE OPERACIONES ANTERIORES.
        visible(
            'errorImportacionExcel',
            false
        );
        try {
            // ================================================
            // PREPARAR DOCUMENTO Y AÑO
            // ================================================
            const formulario =
                crearFormularioInstitucional(
                    estado.archivoExcelSeleccionado,
                    anio
                );
            // ================================================
            // ENVIAR DOCUMENTO AL BACKEND
            //
            // El almacenamiento definitivo y las reglas
            // de duplicados corresponden al servidor.
            // ================================================
            const respuesta =
                await peticionExcelDocumental(
                    RUTAS_DOCUMENTALES.importar,
                    formulario
                );
            // ================================================
            // NORMALIZAR RESULTADOS DEL SERVIDOR
            // ================================================
            const resultado =
                normalizarResultadoImportacion(
                    respuesta
                );
            // ================================================
            // INVALIDAR AUTORIZACIÓN DE IMPORTACIÓN
            //
            // Evita reutilizar la validación anterior
            // después de completar el almacenamiento.
            // ================================================
            estado.importacionValida = false;
            estado.anioImportacionValidado = null;
            // ================================================
            // PRESENTAR RESULTADOS DE IMPORTACIÓN
            // ================================================
            pintarResultadoImportacion(
                resultado
            );
            // ================================================
            // MOSTRAR NOTIFICACIÓN DE CONFIRMACIÓN
            // ================================================
            notificar(resultado.mensaje);
            // ================================================
            // ACTUALIZAR INFORMACIÓN DEL ERP
            //
            // El registro ya fue importado.
            // Los errores de actualización de interfaz
            // no deben presentarse como errores de importación.
            // ================================================
            await actualizarDespuesImportacion(anio);
            // ================================================
            // COMPATIBILIDAD CON INTERFACES ANTERIORES
            //
            // Cierra el modal cuando no existe un
            // contenedor independiente de resultados.
            // ================================================
            if (!$('resultadoImportacionExcel')) {
                cerrarModal('modalImportarExcel');
            }
        } catch (error) {
            // ================================================
            // MOSTRAR ERROR DE LA OPERACIÓN
            // ================================================
            mostrarErrorImportacionExcel(
                error.message
            );
        } finally {
            // ================================================
            // RESTABLECER ESTADO DE IMPORTACIÓN
            // ================================================
            estado.importandoExcel = false;
            // ================================================
            // RESTAURAR BOTÓN DE CONFIRMACIÓN
            // ================================================
            botonCargando(
                'btnConfirmarImportacion',
                false
            );
            // ================================================
            // RESTABLECER CONTROLES DEL FORMULARIO
            // ================================================
            bloquearControlesImportacion(false);
        }
    }
    // ========================================================
    // 169. ACTUALIZAR ERP DESPUÉS DE IMPORTAR
    //
    // Sincroniza los componentes relacionados con el
    // cronograma institucional después de una importación.
    //
    // Actualiza:
    //
    // - Historial de importaciones.
    // - Historial de actividades.
    // - Cronograma institucional.
    // - Actividades generales.
    // - Indicadores.
    // - Cumplimiento.
    // - Calendario.
    // - Agenda.
    //
    // Solo actualiza los componentes del periodo activo
    // cuando coincide con el año del documento importado.
    // ========================================================
    async function actualizarDespuesImportacion(anio) {
        // ====================================================
        // ACTUALIZAR HISTORIALES GENERALES
        // ====================================================
        const tareas = [
            cargarHistorialImportaciones(),
            cargarHistorialActividades()
        ];
        // ====================================================
        // COMPROBAR COINCIDENCIA DEL PERIODO
        // ====================================================
        if (Number(estado.anio) === Number(anio)) {
            // ================================================
            // ACTUALIZAR CRONOGRAMA INSTITUCIONAL
            // ================================================
            if (
                typeof cargarInstitucional === 'function'
            ) {
                tareas.push(
                    cargarInstitucional()
                );
            }
            // ================================================
            // ACTUALIZAR COMPONENTES GENERALES
            // ================================================
            tareas.push(
                cargarActividades(),
                cargarIndicadores(),
                cargarCumplimiento()
            );
        }
        // ====================================================
        // EJECUTAR ACTUALIZACIONES SIMULTÁNEAMENTE
        //
        // Promise.allSettled permite obtener el resultado
        // individual de todas las consultas.
        // ====================================================
        const resultados =
            await Promise.allSettled(tareas);
        // ====================================================
        // IDENTIFICAR ACTUALIZACIONES FALLIDAS
        // ====================================================
        const errores = resultados.filter(
            resultado =>
                resultado.status === 'rejected'
        );
        // ====================================================
        // INFORMAR ACTUALIZACIONES PARCIALES
        //
        // Una consulta fallida no significa necesariamente
        // que el almacenamiento del documento haya fallado.
        // ====================================================
        if (errores.length) {
            console.warn(
                '[Transformín] Actualización posterior a la importación:',
                errores
            );
            notificar(
                'El documento fue importado, pero algunos datos de la interfaz requieren actualización.',
                'advertencia'
            );
        }
        // ====================================================
        // ACTUALIZAR CALENDARIO Y AGENDA
        // ====================================================
        if (Number(estado.anio) === Number(anio)) {
            pintarCalendario();
            pintarAgenda();
        }
    }
    // ========================================================
    // 170. CONFIGURAR ZONA DE ARRASTRE DE ARCHIVOS
    //
    // Permite seleccionar el documento institucional mediante:
    //
    // - Clic sobre la zona de importación.
    // - Selección mediante teclado.
    // - Arrastrar y soltar archivos.
    // - Selector tradicional de archivos.
    //
    // Solo permite seleccionar un documento a la vez.
    // ========================================================
    function configurarZonaImportacionExcel() {
        // ====================================================
        // LOCALIZAR ELEMENTOS DEL FORMULARIO
        // ====================================================
        const zona = $('zonaImportacion');
        const input = $('archivoExcel');
        // EVITAR ERRORES SI NO EXISTEN LOS ELEMENTOS.
        if (!zona || !input) return;
        // ====================================================
        // CONFIGURAR TIPO DE ARCHIVO ADMITIDO
        // ====================================================
        input.accept = '.xlsx';
        // IMPEDIR SELECCIÓN MÚLTIPLE.
        input.multiple = false;
        // ====================================================
        // SELECCIONAR ARCHIVO MEDIANTE CLIC
        // ====================================================
        zona.addEventListener(
            'click',
            evento => {
                // Evitar selecciones durante la importación
                // y llamadas repetidas al selector de archivos.
                if (
                    estado.importandoExcel ||
                    evento.target === input
                ) {
                    return;
                }
                input.click();
            }
        );
        // ====================================================
        // SELECCIONAR ARCHIVO MEDIANTE TECLADO
        //
        // Permite utilizar Enter o la barra espaciadora.
        // ====================================================
        zona.addEventListener(
            'keydown',
            evento => {
                if (
                    estado.importandoExcel ||
                    !['Enter', ' '].includes(
                        evento.key
                    )
                ) {
                    return;
                }
                evento.preventDefault();
                input.click();
            }
        );
        // ====================================================
        // DETECTAR ARCHIVO ARRASTRADO SOBRE LA ZONA
        //
        // Agrega la clase visual dragover para indicar
        // que el documento puede soltarse.
        // ====================================================
        zona.addEventListener(
            'dragover',
            evento => {
                evento.preventDefault();
                if (estado.importandoExcel) {
                    return;
                }
                zona.classList.add('dragover');
            }
        );
        // ====================================================
        // RETIRAR ESTADO VISUAL DE ARRASTRE
        // ====================================================
        zona.addEventListener(
            'dragleave',
            evento => {
                // Mantener el estado visual cuando el cursor
                // se desplaza entre elementos internos.
                if (
                    evento.relatedTarget &&
                    zona.contains(
                        evento.relatedTarget
                    )
                ) {
                    return;
                }
                zona.classList.remove('dragover');
            }
        );
        // ====================================================
        // RECIBIR ARCHIVO MEDIANTE ARRASTRAR Y SOLTAR
        // ====================================================
        zona.addEventListener(
            'drop',
            evento => {
                // Impedir que el navegador abra directamente
                // el documento arrastrado.
                evento.preventDefault();
                zona.classList.remove('dragover');
                // IMPEDIR CAMBIOS DURANTE LA IMPORTACIÓN.
                if (estado.importandoExcel) {
                    return;
                }
                // RECUPERAR ARCHIVOS SELECCIONADOS.
                const archivos =
                    evento.dataTransfer?.files;
                if (!archivos?.length) return;
                // ============================================
                // VALIDAR CANTIDAD DE ARCHIVOS
                // ============================================
                if (archivos.length > 1) {
                    mostrarErrorImportacionExcel(
                        'Selecciona únicamente un archivo Excel.'
                    );
                    return;
                }
                // ============================================
                // PROCESAR DOCUMENTO SELECCIONADO
                // ============================================
                seleccionarArchivoInstitucional(
                    archivos[0]
                );
            }
        );
        // ====================================================
        // DETECTAR SELECCIÓN TRADICIONAL DE ARCHIVOS
        // ====================================================
        input.addEventListener(
            'change',
            evento => {
                // RECUPERAR DOCUMENTO SELECCIONADO.
                const archivo =
                    evento.target.files?.[0];
                if (!archivo) return;
                // PROCESAR DOCUMENTO.
                seleccionarArchivoInstitucional(
                    archivo
                );
                // Permite seleccionar nuevamente
                // el mismo archivo después de corregirlo.
                evento.target.value = '';
            }
        );
    }
    // ========================================================
    // 171. ABRIR MODAL DE EXPORTACIÓN
    //
    // Prepara el selector de año, limpia los resultados
    // anteriores y consulta el resumen del periodo.
    // ========================================================
    async function abrirExportacionDocumental() {
        // Preparar selector del periodo institucional.
        prepararSelectorAnioDocumental(
            'anioExportarExcel'
        );
        // Limpiar información de exportaciones anteriores.
        estado.resumenExportacion = null;
        visible(
            'errorExportacionExcel',
            false
        );
        // Abrir ventana modal de exportación.
        abrirModal('modalExportarExcel');
        // Consultar información del periodo seleccionado.
        await cargarResumenExportacion();
    }
    // ========================================================
    // 172. NOMBRE DEL DOCUMENTO EXPORTADO
    //
    // Genera un nombre institucional que identifica
    // el formato FT-SST-147 y el año correspondiente.
    //
    // Ejemplos:
    // FT-SST-147-Cronograma-Transformin-2026.xlsx
    // FT-SST-147-Cronograma-Transformin-2027.xlsx
    // ========================================================
    function nombreExportacionInstitucional(anio) {
        return `FT-SST-147-Cronograma-Transformin-${anio}.xlsx`;
    }
    // ========================================================
    // 173. CONSULTAR RESUMEN DE EXPORTACIÓN
    //
    // Recupera las actividades institucionales del año
    // seleccionado antes de generar el documento Excel.
    //
    // Consulta:
    // - Total de actividades institucionales.
    // - Total de programaciones.
    // - Total de actividades completadas.
    // - Porcentaje de cumplimiento.
    // - Existencia del cronograma.
    // - Capacidad máxima del formato FT-SST-147.
    // ========================================================
    async function cargarResumenExportacion() {
        // Validar año seleccionado.
        const anio = validarAnioDocumental(
            campo('anioExportarExcel')
        );
        // Limpiar resumen anterior.
        estado.resumenExportacion = null;
        // Bloquear exportación mientras se consulta el resumen.
        deshabilitar(
            'btnConfirmarExportacion',
            true
        );
        // Ocultar errores anteriores.
        visible(
            'errorExportacionExcel',
            false
        );
        try {
            // ================================================
            // CONSULTAR CRONOGRAMA INSTITUCIONAL
            // ================================================
            const respuesta = await peticion(
                conAnio(
                    RUTAS_DOCUMENTALES.institucional,
                    anio
                )
            );
            // ================================================
            // COMPROBAR VIGENCIA DEL PERIODO
            //
            // Ignora respuestas correspondientes a otro año
            // cuando el usuario cambia el selector.
            // ================================================
            if (
                anio !== Number(
                    campo('anioExportarExcel')
                )
            ) {
                return;
            }
            // ================================================
            // RECUPERAR ACTIVIDADES INSTITUCIONALES
            // ================================================
            const actividades = extraerLista(
                respuesta,
                'actividades',
                'registros'
            );
            // ================================================
            // RECUPERAR INDICADORES ANUALES
            // ================================================
            const indicadores =
                respuesta.indicadores?.anual ||
                respuesta.indicadores ||
                {};
            // ================================================
            // TOTAL DE ACTIVIDADES REGISTRADAS
            // ================================================
            const total = numero(
                respuesta.total ??
                actividades.length
            );
            // ================================================
            // TOTAL DE PROGRAMACIONES SEMANALES
            // ================================================
            const programadas = numero(
                indicadores.programadas
            );
            // ================================================
            // TOTAL DE PROGRAMACIONES COMPLETADAS
            // ================================================
            const completadas = numero(
                indicadores.completadas ??
                indicadores.realizadas
            );
            // ================================================
            // CONSTRUIR RESUMEN DE EXPORTACIÓN
            // ================================================
            estado.resumenExportacion = {
                // Año correspondiente al documento.
                anio,
                // Total de actividades institucionales.
                total,
                // Total de programaciones semanales.
                programadas,
                // Total de programaciones completadas.
                completadas,
                // Porcentaje de cumplimiento anual.
                // Prioriza el indicador entregado por el backend.
                porcentaje:
                    indicadores.porcentaje ??
                    porcentaje(
                        completadas,
                        programadas
                    ),
                // Comprobar existencia del cronograma.
                cronogramaExiste:
                    respuesta.cronograma != null ||
                    total > 0,
                // Verificar capacidad del formato FT-SST-147.
                superaCapacidad:
                    total >
                    CONFIG_EXCEL_FT147.maximoActividades
            };
            // ================================================
            // ACTUALIZAR RESUMEN VISUAL
            // ================================================
            pintarResumenExportacion();
        } catch (error) {
            // Ignorar errores de consultas desactualizadas.
            if (
                anio !== Number(
                    campo('anioExportarExcel')
                )
            ) {
                return;
            }
            // Mostrar mensaje de error.
            texto(
                'errorExportacionExcel',
                error.message
            );
            visible(
                'errorExportacionExcel',
                true
            );
        }
    }
    // ========================================================
    // 174. RENDERIZAR RESUMEN DE EXPORTACIÓN
    //
    // Presenta los indicadores del periodo seleccionado.
    //
    // Controla la disponibilidad del botón de exportación
    // según la existencia de registros y la capacidad
    // máxima del documento institucional.
    // ========================================================
    function pintarResumenExportacion() {
        const datos =
            estado.resumenExportacion;
        // Evitar renderizar información inexistente.
        if (!datos) return;
        // Mostrar contenedor del resumen.
        visible(
            'resumenExportacionExcel',
            true
        );
        // ====================================================
        // TOTAL DE ACTIVIDADES INSTITUCIONALES
        // ====================================================
        texto(
            'totalActividadesExportacion',
            datos.total
        );
        // ====================================================
        // TOTAL DE PROGRAMACIONES
        // ====================================================
        texto(
            'totalProgramadasExportacion',
            datos.programadas
        );
        // ====================================================
        // TOTAL DE PROGRAMACIONES COMPLETADAS
        // ====================================================
        texto(
            'totalCompletadasExportacion',
            datos.completadas
        );
        // ====================================================
        // PORCENTAJE DE CUMPLIMIENTO
        // ====================================================
        texto(
            'porcentajeExportacion',
            porcentajeTexto(
                datos.porcentaje
            )
        );
        // ====================================================
        // NOMBRE DEL DOCUMENTO INSTITUCIONAL
        // ====================================================
        texto(
            'nombreArchivoExportacion',
            nombreExportacionInstitucional(
                datos.anio
            )
        );
        // ====================================================
        // ADVERTENCIA DE CRONOGRAMA SIN REGISTROS
        //
        // Se muestra cuando el periodo no tiene cronograma
        // o no contiene actividades institucionales.
        // ====================================================
        visible(
            'alertaExportacionSinRegistros',
            !datos.cronogramaExiste ||
            datos.total === 0
        );
        // ====================================================
        // ADVERTENCIA DE CAPACIDAD INSTITUCIONAL
        //
        // El formato FT-SST-147 admite un máximo
        // de 36 actividades institucionales.
        // ====================================================
        visible(
            'alertaCapacidadExportacion',
            datos.superaCapacidad
        );
        // ====================================================
        // CONTROLAR BOTÓN DE CONFIRMACIÓN
        //
        // Impide exportar cuando:
        // - No existe un cronograma institucional.
        // - Se supera la capacidad máxima del formato.
        // - No existen actividades registradas.
        // ====================================================
        deshabilitar(
            'btnConfirmarExportacion',
            !datos.cronogramaExiste ||
            datos.superaCapacidad ||
            datos.total === 0
        );
    }
    // ========================================================
    // 175. OBTENER NOMBRE DESDE CONTENT-DISPOSITION
    //
    // Recupera el nombre del archivo entregado por el backend
    // mediante el encabezado HTTP Content-Disposition.
    //
    // Admite nombres convencionales y nombres UTF-8.
    //
    // Elimina caracteres incompatibles con nombres de
    // archivos y conserva únicamente documentos .xlsx.
    // ========================================================
    function obtenerNombreArchivoExportado(
        encabezado,
        predeterminado
    ) {
        // Normalizar encabezado recibido.
        const valor = String(
            encabezado || ''
        );
        // ====================================================
        // BUSCAR NOMBRE CODIFICADO EN UTF-8
        // ====================================================
        const utf8 = valor.match(
            /filename\*=UTF-8''([^;]+)/i
        );
        // Establecer nombre alternativo.
        let nombre = predeterminado;
        // ====================================================
        // DECODIFICAR NOMBRE UTF-8
        // ====================================================
        if (utf8) {
            try {
                nombre = decodeURIComponent(
                    utf8[1]
                );
            } catch {
                // Conservar nombre institucional si falla
                // la decodificación del encabezado.
                nombre = predeterminado;
            }
        } else {
            // ================================================
            // BUSCAR NOMBRE CONVENCIONAL
            // ================================================
            const coincidencia = valor.match(
                /filename="?([^";]+)"?/i
            );
            if (coincidencia) {
                nombre = coincidencia[1];
            }
        }
        // ====================================================
        // LIMPIAR CARACTERES NO PERMITIDOS
        //
        // Elimina separadores de rutas, caracteres de control
        // y símbolos incompatibles con nombres de archivos.
        // ====================================================
        nombre = nombre
            .replace(/[\\/:*?"<>|]/g, '-')
            .replace(/[\x00-\x1F\x7F]/g, '')
            .trim();
        // ====================================================
        // VALIDAR EXTENSIÓN DEL DOCUMENTO
        //
        // Utiliza el nombre institucional predeterminado
        // cuando el servidor entrega otra extensión.
        // ====================================================
        if (
            !nombre.toLowerCase().endsWith('.xlsx')
        ) {
            return predeterminado;
        }
        // Devolver nombre de archivo normalizado.
        return nombre;
    }
    // ========================================================
    // 176. SOLICITAR EXCEL AL SERVIDOR
    //
    // Solicita el documento institucional correspondiente
    // al año seleccionado y verifica el archivo recibido.
    // ========================================================
    async function solicitarExcelExportado(anio) {
        const respuesta = await fetch(
            `${API}${conAnio(
                RUTAS_DOCUMENTALES.exportar,
                anio
            )}`,
            {
                method: 'GET',
                credentials: 'same-origin',
                cache: 'no-store',
                headers: {
                    Accept:
                        CONFIG_EXCEL_FT147.contentType
                }
            }
        );
        // Obtener tipo de contenido de la respuesta.
        const tipo =
            respuesta.headers.get('content-type') || '';
        // ====================================================
        // CONTROLAR ERRORES DEL SERVIDOR
        // ====================================================
        if (!respuesta.ok) {
            let mensaje =
                `No fue posible exportar el documento (${respuesta.status}).`;
            if (tipo.includes('application/json')) {
                const datos = await respuesta
                    .json()
                    .catch(() => ({}));
                mensaje =
                    datos.mensaje ||
                    datos.message ||
                    datos.error ||
                    mensaje;
            }
            throw new Error(mensaje);
        }
        // ====================================================
        // VALIDAR TIPO DE DOCUMENTO RECIBIDO
        //
        // Evita descargar respuestas HTML o JSON
        // como si fueran documentos Excel.
        // ====================================================
        if (
            !tipo.includes(
                CONFIG_EXCEL_FT147.contentType
            ) &&
            !tipo.includes(
                'application/octet-stream'
            )
        ) {
            throw new Error(
                'El servidor no devolvió un documento Excel válido.'
            );
        }
        // ====================================================
        // CONVERTIR RESPUESTA EN ARCHIVO BINARIO
        // ====================================================
        const archivo = await respuesta.blob();
        // Impedir la descarga de documentos vacíos.
        if (!archivo.size) {
            throw new Error(
                'El documento exportado está vacío.'
            );
        }
        // ====================================================
        // COMPROBAR FIRMA BINARIA DEL DOCUMENTO
        //
        // Los archivos XLSX utilizan un contenedor ZIP.
        // Su encabezado habitual comienza con PK.
        // Esta comprobación es preliminar y no garantiza
        // por sí sola la integridad completa del documento.
        // ====================================================
        const firma = new Uint8Array(
            await archivo
                .slice(0, 4)
                .arrayBuffer()
        );
        if (
            firma[0] !== 0x50 ||
            firma[1] !== 0x4B ||
            firma[2] !== 0x03 ||
            firma[3] !== 0x04
        ) {
            throw new Error(
                'El archivo recibido no tiene una estructura XLSX reconocible.'
            );
        }
        // ====================================================
        // OBTENER NOMBRE DEL DOCUMENTO
        //
        // Prioriza el nombre proporcionado por el servidor.
        // Si no existe, utiliza el nombre institucional
        // generado automáticamente según el año.
        // ====================================================
        const nombre =
            obtenerNombreArchivoExportado(
                respuesta.headers.get(
                    'content-disposition'
                ),
                nombreExportacionInstitucional(
                    anio
                )
            );
        // Devolver archivo y nombre de descarga.
        return {
            archivo,
            nombre
        };
    }
    // ========================================================
    // 177. DESCARGAR ARCHIVO GENERADO
    //
    // Genera una URL temporal para descargar el documento
    // Excel recibido desde el servidor.
    //
    // Libera posteriormente los recursos utilizados.
    // ========================================================
    function descargarArchivoDocumental(
        archivo,
        nombre
    ) {
        // Crear URL temporal del documento.
        const url =
            URL.createObjectURL(archivo);
        // Crear enlace temporal de descarga.
        const enlace =
            document.createElement('a');
        enlace.href = url;
        enlace.download = nombre;
        // Agregar enlace al documento.
        document.body.appendChild(enlace);
        // Iniciar descarga.
        enlace.click();
        // Eliminar enlace temporal.
        enlace.remove();
        // ====================================================
        // LIBERAR RECURSOS
        //
        // Se conserva temporalmente la URL para permitir
        // que el navegador inicie la descarga.
        // ====================================================
        window.setTimeout(() => {
            URL.revokeObjectURL(url);
        }, 30000);
    }
    // ========================================================
    // 178. EXPORTAR FORMATO INSTITUCIONAL
    //
    // Ejecuta la generación y descarga definitiva del
    // documento institucional FT-SST-147.
    //
    // Controles:
    //
    // - Validación del periodo seleccionado.
    // - Existencia del cronograma institucional.
    // - Capacidad máxima del formato.
    // - Prevención de exportaciones simultáneas.
    // - Validación del archivo recibido.
    // - Restauración de controles.
    // ========================================================
    async function exportarExcelInstitucional(
        evento
    ) {
        // Evitar envío tradicional del formulario.
        evento?.preventDefault();
        // Impedir exportaciones simultáneas.
        if (estado.exportandoExcel) return;
        let anio;
        // ====================================================
        // VALIDAR CONDICIONES DE EXPORTACIÓN
        // ====================================================
        try {
            // Validar año seleccionado.
            anio = validarAnioDocumental(
                campo('anioExportarExcel')
            );
            // Recuperar resumen previamente consultado.
            const resumen =
                estado.resumenExportacion;
            // =================================================
            // COMPROBAR VIGENCIA DEL RESUMEN
            //
            // Impide utilizar información correspondiente
            // a un periodo diferente.
            // =================================================
            if (
                !resumen ||
                resumen.anio !== anio
            ) {
                throw new Error(
                    'Espera a que finalice la consulta del periodo seleccionado.'
                );
            }
            // =================================================
            // COMPROBAR EXISTENCIA DE ACTIVIDADES
            // =================================================
            if (
                !resumen.cronogramaExiste ||
                resumen.total === 0
            ) {
                throw new Error(
                    'No hay actividades institucionales para exportar.'
                );
            }
            // =================================================
            // VALIDAR CAPACIDAD DEL FORMATO FT-SST-147
            //
            // Impide generar documentos que superen
            // la capacidad institucional establecida.
            // =================================================
            if (resumen.superaCapacidad) {
                throw new Error(
                    'El cronograma supera la capacidad del formato institucional. No se exportarán registros incompletos.'
                );
            }
        } catch (error) {
            // Mostrar error dentro del formulario.
            texto(
                'errorExportacionExcel',
                error.message
            );
            visible(
                'errorExportacionExcel',
                true
            );
            // Mostrar advertencia general.
            notificar(
                error.message,
                'advertencia'
            );
            return;
        }
        // ====================================================
        // ESTABLECER ESTADO DE EXPORTACIÓN ACTIVA
        // ====================================================
        estado.exportandoExcel = true;
        // Bloquear selector de año.
        deshabilitar(
            'anioExportarExcel',
            true
        );
        // Mostrar estado de carga.
        botonCargando(
            'btnConfirmarExportacion',
            true,
            'Exportando...'
        );
        // Ocultar errores anteriores.
        visible(
            'errorExportacionExcel',
            false
        );
        try {
            // ================================================
            // SOLICITAR DOCUMENTO AL SERVIDOR
            // ================================================
            const resultado =
                await solicitarExcelExportado(
                    anio
                );
            // ================================================
            // INICIAR DESCARGA DEL DOCUMENTO
            // ================================================
            descargarArchivoDocumental(
                resultado.archivo,
                resultado.nombre
            );
            // ================================================
            // FINALIZAR ESTADO ACTIVO ANTES DE CERRAR
            //
            // Evita que el evento hide.bs.modal impida
            // el cierre programático después de exportar.
            // ================================================
            estado.exportandoExcel = false;
            cerrarModal(
                'modalExportarExcel'
            );
            // ================================================
            // NOTIFICAR RESULTADO
            //
            // Confirma la generación del archivo y el inicio
            // de la descarga, no su almacenamiento local.
            // ================================================
            notificar(
                'Documento FT-SST-147 generado correctamente. Se inició su descarga.'
            );
        } catch (error) {
            // ================================================
            // MOSTRAR ERROR DE EXPORTACIÓN
            // ================================================
            texto(
                'errorExportacionExcel',
                error.message
            );
            visible(
                'errorExportacionExcel',
                true
            );
            // Gestionar error mediante controlador general.
            manejarError(error);
        } finally {
            // ================================================
            // RESTABLECER ESTADO DE EXPORTACIÓN
            // ================================================
            estado.exportandoExcel = false;
            // Habilitar nuevamente el selector de año.
            deshabilitar(
                'anioExportarExcel',
                false
            );
            // Restaurar botón de exportación.
            botonCargando(
                'btnConfirmarExportacion',
                false
            );
            // Actualizar disponibilidad de exportación.
            pintarResumenExportacion();
        }
    }
    // ========================================================
    // 179. CONFIGURAR EVENTOS DE IMPORTACIÓN
    //
    // Conecta los botones, selectores y ventanas modales
    // correspondientes a la importación institucional.
    // ========================================================
    function configurarImportacionDocumental() {
        // ====================================================
        // BOTONES DE APERTURA DEL MODAL
        //
        // Permite abrir la importación desde diferentes
        // secciones del Cronograma de Transformín.
        // ====================================================
        [
            'btnImportarExcel',
            'btnImportarExcelCard'
        ].forEach(id => {
            enlazar(
                id,
                'click',
                abrirImportacionDocumental
            );
        });
        // ====================================================
        // VALIDAR DOCUMENTO EXCEL
        // ====================================================
        enlazar(
            'btnValidarExcel',
            'click',
            eventoSeguro(
                validarExcelInstitucional
            )
        );
        // ====================================================
        // QUITAR ARCHIVO SELECCIONADO
        // ====================================================
        enlazar(
            'btnQuitarArchivoExcel',
            'click',
            quitarArchivoInstitucional
        );
        // ====================================================
        // DETECTAR CAMBIO DEL AÑO DE IMPORTACIÓN
        //
        // Invalida los resultados de validaciones anteriores.
        // ====================================================
        enlazar(
            'anioImportarExcel',
            'change',
            cambiarAnioImportacionDocumental
        );
        // ====================================================
        // CONFIRMAR IMPORTACIÓN DEFINITIVA
        // ====================================================
        enlazar(
            'btnConfirmarImportacion',
            'click',
            eventoSeguro(
                importarExcelInstitucional
            )
        );
        // ====================================================
        // PROTEGER MODAL DURANTE IMPORTACIÓN
        //
        // Impide cerrar la ventana mientras se procesa
        // el almacenamiento del documento.
        // ====================================================
        enlazar(
            'modalImportarExcel',
            'hide.bs.modal',
            evento => {
                if (estado.importandoExcel) {
                    evento.preventDefault();
                }
            }
        );
        // ====================================================
        // LIMPIAR INFORMACIÓN AL CERRAR EL MODAL
        //
        // Elimina archivos temporales y resultados de
        // validación sin modificar la base de datos.
        // ====================================================
        enlazar(
            'modalImportarExcel',
            'hidden.bs.modal',
            limpiarImportacionDocumental
        );
        // ====================================================
        // CONFIGURAR SELECCIÓN Y ARRASTRE DE ARCHIVOS
        // ====================================================
        configurarZonaImportacionExcel();
    }
    // ========================================================
    // 180. CONFIGURAR EVENTOS DE EXPORTACIÓN
    //
    // Conecta los controles correspondientes a la
    // generación y descarga del documento institucional.
    //
    // Compatible con botones independientes y formularios
    // tradicionales de exportación.
    // ========================================================
    function configurarExportacionDocumental() {
        // ====================================================
        // BOTONES DE APERTURA DEL MODAL
        // ====================================================
        [
            'btnExportarExcel',
            'btnExportarExcelCard'
        ].forEach(id => {
            enlazar(
                id,
                'click',
                eventoSeguro(
                    abrirExportacionDocumental
                )
            );
        });
        // ====================================================
        // ACTUALIZAR RESUMEN AL CAMBIAR DE AÑO
        // ====================================================
        enlazar(
            'anioExportarExcel',
            'change',
            eventoSeguro(
                cargarResumenExportacion
            )
        );
        // ====================================================
        // LOCALIZAR FORMULARIO DE EXPORTACIÓN
        // ====================================================
        const formulario =
            $('formExportarExcel');
        // ====================================================
        // CONFIGURAR ENVÍO DEL FORMULARIO
        // ====================================================
        if (formulario) {
            enlazar(
                'formExportarExcel',
                'submit',
                eventoSeguro(
                    exportarExcelInstitucional
                )
            );
            // Localizar botón de confirmación.
            const boton =
                $('btnConfirmarExportacion');
            // ================================================
            // COMPATIBILIDAD CON BOTONES INDEPENDIENTES
            //
            // Solo agrega el evento click cuando el botón
            // no genera automáticamente el submit del
            // formulario correspondiente.
            //
            // Evita registrar dos eventos innecesarios
            // para la misma operación.
            // ================================================
            if (
                boton &&
                (
                    boton.type !== 'submit' ||
                    boton.form !== formulario
                )
            ) {
                enlazar(
                    'btnConfirmarExportacion',
                    'click',
                    eventoSeguro(
                        exportarExcelInstitucional
                    )
                );
            }
        } else {
            // ================================================
            // COMPATIBILIDAD SIN FORMULARIO
            // ================================================
            enlazar(
                'btnConfirmarExportacion',
                'click',
                eventoSeguro(
                    exportarExcelInstitucional
                )
            );
        }
        // ====================================================
        // PROTEGER MODAL DURANTE EXPORTACIÓN
        //
        // Impide cerrar manualmente la ventana mientras
        // se genera el documento institucional.
        // ====================================================
        enlazar(
            'modalExportarExcel',
            'hide.bs.modal',
            evento => {
                if (estado.exportandoExcel) {
                    evento.preventDefault();
                }
            }
        );
    }
    // ========================================================
    // 181. ETIQUETAS DE HISTORIALES
    //
    // Centraliza las etiquetas de actividades, notificaciones,
    // importaciones, estados y acciones de auditoría.
    // ========================================================
    const ETIQUETAS_HISTORIAL = Object.freeze({
        // ORÍGENES DE LOS REGISTROS.
        MANUAL: 'Actividad manual',
        FT147: 'Institucional FT-SST-147',
        CUMPLEANOS: 'Cumpleaños',
        // TIPOS DE NOTIFICACIONES.
        ACTIVIDAD: 'Actividad',
        RECORDATORIO: 'Recordatorio',
        ADMINISTRATIVA: 'Administrativa',
        // ESTADOS DE LOS REGISTROS.
        PENDIENTE: 'Pendiente',
        EN_PROCESO: 'En proceso',
        ENVIADO: 'Enviado',
        ERROR: 'Error',
        CANCELADO: 'Cancelado',
        CANCELADA: 'Cancelada',
        COMPLETADA: 'Completada',
        INICIADA: 'Iniciada',
        FALLIDA: 'Fallida',
        // ACCIONES DEL HISTORIAL DE AUDITORÍA.
        CREACION: 'Creación',
        EDICION: 'Edición',
        CAMBIO_ESTADO: 'Cambio de estado',
        REPROGRAMACION: 'Reprogramación',
        CANCELACION: 'Cancelación',
        ELIMINACION: 'Eliminación',
        RESTAURACION: 'Restauración'
    });
    // ========================================================
    // 182. OBTENER ETIQUETA DE HISTORIAL
    //
    // Convierte los valores técnicos almacenados en la
    // base de datos en etiquetas comprensibles.
    //
    // Si el valor no está registrado, conserva su contenido
    // reemplazando los guiones bajos por espacios.
    // ========================================================
    function etiquetaHistorial(valor) {
        if (!valor) return '—';
        const clave =
            String(valor).toUpperCase();
        return ETIQUETAS_HISTORIAL[clave] ||
            String(valor)
                .replace(/_/g, ' ');
    }
    // ========================================================
    // 183. BADGES DE ESTADO DOCUMENTAL
    //
    // Genera indicadores visuales para representar los
    // estados de notificaciones, importaciones y auditoría.
    //
    // Verde: operación completada.
    // Rojo: error o fallo.
    // Amarillo: pendiente.
    // Azul: operación en proceso.
    // Gris: cancelado o estado no clasificado.
    // ========================================================
    function badgeHistorialDocumental(valor) {
        const clave = String(
            valor || ''
        ).toUpperCase();
        // ASOCIAR ESTADOS CON CLASES VISUALES.
        const clases = {
            ENVIADO: 'bg-success',
            COMPLETADA: 'bg-success',
            ERROR: 'bg-danger',
            FALLIDA: 'bg-danger',
            PENDIENTE: 'bg-warning text-dark',
            INICIADA: 'bg-primary',
            EN_PROCESO: 'bg-primary',
            CANCELADA: 'bg-secondary',
            CANCELADO: 'bg-secondary'
        };
        // GENERAR BADGE CON CONTENIDO ESCAPADO.
        return `
            <span class="badge ${
                clases[clave] || 'bg-secondary'
            }">

                ${escapar(
                    etiquetaHistorial(valor)
                )}

            </span>
        `;
    }
    // ========================================================
    // 184. CONSTRUIR FILTROS DE CONSULTA
    //
    // Construye dinámicamente los parámetros utilizados
    // en las solicitudes de historiales al backend.
    //
    // Omite filtros vacíos, indefinidos o establecidos
    // con el valor TODOS.
    //
    // URLSearchParams permite codificar correctamente
    // los caracteres especiales de los filtros.
    // ========================================================
    function construirRutaHistorial(
        ruta,
        filtros = {}
    ) {
        // CREAR CONTENEDOR DE PARÁMETROS.
        const parametros =
            new URLSearchParams();
        // RECORRER FILTROS DISPONIBLES.
        Object.entries(filtros)
            .forEach(([clave, valor]) => {
                // IGNORAR FILTROS SIN VALOR.
                if (
                    valor === undefined ||
                    valor === null ||
                    valor === '' ||
                    valor === 'TODOS'
                ) {
                    return;
                }
                // AGREGAR FILTRO A LA CONSULTA.
                parametros.set(
                    clave,
                    String(valor)
                );
            });
        // CONVERTIR PARÁMETROS A CADENA DE CONSULTA.
        const consulta =
            parametros.toString();
        // DEVOLVER RUTA CON FILTROS CUANDO EXISTAN.
        return consulta
            ? `${ruta}?${consulta}`
            : ruta;
    }
    // ========================================================
    // 185. VALIDAR INTERVALOS DE FECHAS
    //
    // Comprueba que la fecha inicial no sea posterior
    // a la fecha final del intervalo seleccionado.
    //
    // La comparación utiliza fechas normalizadas
    // con formato YYYY-MM-DD.
    //
    // Permite consultar utilizando únicamente una
    // fecha inicial o una fecha final.
    // ========================================================
    function validarFechasHistorial(
        desde,
        hasta
    ) {
        if (
            desde &&
            hasta &&
            desde > hasta
        ) {
            throw new Error(
                'La fecha inicial no puede ser posterior a la fecha final.'
            );
        }
    }
    // ========================================================
    // 186. PAGINACIÓN DE HISTORIALES
    //
    // Divide los registros en páginas independientes.
    //
    // Calcula:
    // - Total de registros.
    // - Página actual.
    // - Total de páginas.
    // - Registro inicial.
    // - Registro final.
    // - Registros correspondientes a la página actual.
    //
    // Evita acceder a páginas fuera del intervalo disponible.
    // ========================================================
    function paginarHistorialDocumental(
        registros,
        pagina,
        cantidad
    ) {
        // TOTAL DE REGISTROS DISPONIBLES.
        const total = registros.length;
        // CANTIDAD DE REGISTROS POR PÁGINA.
        const porPagina = Math.max(
            1,
            Number(cantidad) || 10
        );
        // CALCULAR TOTAL DE PÁGINAS.
        const totalPaginas = Math.max(
            1,
            Math.ceil(total / porPagina)
        );
        // NORMALIZAR PÁGINA SOLICITADA.
        const actual = Math.min(
            totalPaginas,
            Math.max(
                1,
                Number(pagina) || 1
            )
        );
        // CALCULAR POSICIÓN INICIAL.
        const inicio =
            (actual - 1) * porPagina;
        // DEVOLVER RESULTADO DE PAGINACIÓN.
        return {
            // Total general de registros.
            total,
            // Página actual.
            pagina: actual,
            // Cantidad total de páginas.
            totalPaginas,
            // Número del primer registro visible.
            desde: total
                ? inicio + 1
                : 0,
            // Número del último registro visible.
            hasta: Math.min(
                inicio + porPagina,
                total
            ),
            // Registros correspondientes a la página.
            registros: registros.slice(
                inicio,
                inicio + porPagina
            )
        };
    }
    // ========================================================
    // 187. RENDERIZAR PAGINACIÓN DOCUMENTAL
    //
    // Genera los controles de navegación de los historiales.
    //
    // Incluye:
    // - Botón de página anterior.
    // - Páginas cercanas a la página actual.
    // - Botón de página siguiente.
    // - Identificación visual de la página activa.
    // - Atributos de accesibilidad.
    // ========================================================
    function pintarPaginacionDocumental(
        id,
        resultado
    ) {
        // COMPROBAR EXISTENCIA DEL CONTENEDOR.
        if (!$(id)) return;
        // OCULTAR PAGINACIÓN CUANDO SOLO EXISTE UNA PÁGINA.
        if (resultado.totalPaginas <= 1) {
            html(id, '');
            return;
        }
        // CONTENEDOR DE BOTONES.
        const paginas = [];
        // CALCULAR PRIMERA PÁGINA VISIBLE.
        const inicio = Math.max(
            1,
            resultado.pagina - 2
        );
        // CALCULAR ÚLTIMA PÁGINA VISIBLE.
        const final = Math.min(
            resultado.totalPaginas,
            resultado.pagina + 2
        );
        // ====================================================
        // BOTÓN DE PÁGINA ANTERIOR
        //
        // Se deshabilita cuando el usuario se encuentra
        // en la primera página.
        // ====================================================
        paginas.push(`
            <button
                type="button"
                class="btn btn-sm btn-outline-secondary"
                data-pagina="${resultado.pagina - 1}"
                aria-label="Página anterior"
                ${resultado.pagina === 1 ? 'disabled' : ''}
            >

                <i class="fas fa-chevron-left"
                   aria-hidden="true"></i>

            </button>
        `);
        // ====================================================
        // GENERAR BOTONES NUMÉRICOS
        //
        // Presenta hasta cinco páginas alrededor
        // de la página actualmente seleccionada.
        // ====================================================
        for (
            let pagina = inicio;
            pagina <= final;
            pagina++
        ) {
            paginas.push(`
                <button
                    type="button"
                    class="btn btn-sm ${
                        pagina === resultado.pagina
                            ? 'btn-primary active'
                            : 'btn-outline-secondary'
                    }"
                    data-pagina="${pagina}"
                    ${
                        pagina === resultado.pagina
                            ? 'aria-current="page"'
                            : ''
                    }
                >

                    ${pagina}

                </button>
            `);
        }
        // ====================================================
        // BOTÓN DE PÁGINA SIGUIENTE
        //
        // Se deshabilita cuando el usuario se encuentra
        // en la última página disponible.
        // ====================================================
        paginas.push(`
            <button
                type="button"
                class="btn btn-sm btn-outline-secondary"
                data-pagina="${resultado.pagina + 1}"
                aria-label="Página siguiente"
                ${
                    resultado.pagina >= resultado.totalPaginas
                        ? 'disabled'
                        : ''
                }
            >

                <i class="fas fa-chevron-right"
                   aria-hidden="true"></i>

            </button>
        `);
        // RENDERIZAR CONTROLES DE PAGINACIÓN.
        html(id, paginas.join(''));
    }
    // ========================================================
    // 188. RENDERIZAR CONTADORES DE HISTORIALES
    //
    // Informa cuántos registros se están visualizando
    // respecto al total de resultados disponibles.
    //
    // Ejemplo:
    // Mostrando 1–10 de 37 registros.
    // ========================================================
    function pintarContadorDocumental(
        id,
        resultado
    ) {
        texto(
            id,
            resultado.total
                ? `Mostrando ${resultado.desde}–${resultado.hasta} de ${resultado.total} registros`
                : 'Sin registros disponibles'
        );
    }
    // ========================================================
    // 189. ESTADO VACÍO DE TABLAS
    //
    // Genera una fila informativa cuando un historial
    // no contiene registros disponibles.
    //
    // Permite personalizar:
    // - Cantidad de columnas.
    // - Título del mensaje.
    // - Descripción informativa.
    // - Icono representativo.
    //
    // Escapa el contenido antes de insertarlo en el HTML.
    // ========================================================
    function filaHistorialVacia(
        columnas,
        titulo,
        descripcion,
        icono = 'fa-clock-rotate-left'
    ) {
        return `
            <tr>

                <td colspan="${columnas}">

                    <div class="estado-vacio">

                        <i class="fas ${escapar(icono)}"
                           aria-hidden="true"></i>

                        <strong>
                            ${escapar(titulo)}
                        </strong>

                        <p>
                            ${escapar(descripcion)}
                        </p>

                    </div>

                </td>

            </tr>
        `;
    }
    // ========================================================
    // 190. FILTROS DEL HISTORIAL DE NOTIFICACIONES
    //
    // Recupera los filtros seleccionados por el usuario.
    // Valida el intervalo de fechas antes de consultar.
    // Limita la consulta a 500 registros.
    // ========================================================
    function obtenerFiltrosNotificaciones() {
        const desde = campo(
            'filtroNotificacionDesde'
        );
        const hasta = campo(
            'filtroNotificacionHasta'
        );
        // Validar intervalo de fechas.
        validarFechasHistorial(
            desde,
            hasta
        );
        // Construir filtros de consulta.
        return {
            anio: estado.anio,
            buscar: campo(
                'buscarNotificacion'
            ),
            tipo: campo(
                'filtroNotificacionTipo'
            ),
            estado: campo(
                'filtroNotificacionEstado'
            ),
            desde,
            hasta,
            limite: 500
        };
    }
    // ========================================================
    // 191. NORMALIZAR REGISTRO DE NOTIFICACIÓN
    //
    // Unifica las propiedades recibidas desde el backend.
    // Conserva los datos originales del registro.
    //
    // Incluye destinatario, asunto, mensaje, estado,
    // fecha, intentos de envío y detalle de errores.
    // ========================================================
    function normalizarNotificacion(
        registro = {}
    ) {
        return {
            ...registro,
            // Identificador de la notificación.
            id: String(
                registro.id ?? ''
            ),
            // Tipo de notificación.
            tipo:
                registro.tipo ||
                'ACTIVIDAD',
            // Correo electrónico del destinatario.
            destinatario:
                registro.destinatario ||
                registro.correo ||
                'Sin destinatario',
            // Asunto del correo electrónico.
            asunto:
                registro.asunto ||
                'Sin asunto',
            // Contenido de la notificación.
            mensaje:
                registro.mensaje ||
                '',
            // Estado actual del envío.
            estado:
                registro.estado ||
                'PENDIENTE',
            // Priorizar fecha de envío y programación.
            fecha:
                registro.fecha_envio ||
                registro.fecha_programada ||
                registro.created_at ||
                registro.fecha ||
                '',
            // Cantidad de intentos realizados.
            intentos: numero(
                registro.intentos
            ),
            // Información del error registrado.
            error:
                registro.error_detalle ||
                registro.error ||
                ''
        };
    }
    // ========================================================
    // 192. CONSULTAR HISTORIAL DE NOTIFICACIONES
    //
    // Consulta los registros de notificaciones mediante
    // los filtros seleccionados.
    //
    // Cancela solicitudes anteriores para evitar mostrar
    // resultados correspondientes a filtros desactualizados.
    // ========================================================
    async function cargarHistorialNotificaciones() {
        // Recuperar filtros seleccionados.
        const filtros =
            obtenerFiltrosNotificaciones();
        // Construir ruta de consulta.
        const ruta =
            construirRutaHistorial(
                RUTAS_DOCUMENTALES.notificaciones,
                filtros
            );
        try {
            // Consultar información del backend.
            const datos = await peticion(
                ruta,
                {
                    clavePeticion:
                        'historial-notificaciones',
                    cancelarAnterior: true
                }
            );
            // Normalizar registros recibidos.
            estado.historialNotificaciones =
                extraerLista(
                    datos,
                    'historial',
                    'notificaciones',
                    'registros'
                ).map(normalizarNotificacion);
            // Regresar a la primera página.
            estado.paginaHistorialNotificaciones = 1;
            // Actualizar tabla de notificaciones.
            pintarHistorialNotificaciones();
            // Devolver registros consultados.
            return estado.historialNotificaciones;
        } catch (error) {
            // No mostrar errores de solicitudes canceladas.
            if (error.name !== 'AbortError') {
                html(
                    'tablaHistorialBody',
                    filaHistorialVacia(
                        5,
                        'Historial no disponible',
                        'No fue posible consultar las notificaciones.',
                        'fa-triangle-exclamation'
                    )
                );
            }
            throw error;
        }
    }
    // ========================================================
    // 193. RENDERIZAR HISTORIAL DE NOTIFICACIONES
    //
    // Genera las filas de la tabla de notificaciones.
    //
    // Conserva las cinco columnas:
    //
    // 1. Fecha.
    // 2. Tipo.
    // 3. Destinatario.
    // 4. Asunto y detalle.
    // 5. Estado.
    //
    // Incluye paginación y contador de resultados.
    // ========================================================
    function pintarHistorialNotificaciones() {
        // Obtener registros de la página actual.
        const resultado =
            paginarHistorialDocumental(
                estado.historialNotificaciones,
                estado.paginaHistorialNotificaciones,
                estado.porPaginaHistorial
            );
        // Actualizar página normalizada.
        estado.paginaHistorialNotificaciones =
            resultado.pagina;
        // ====================================================
        // MOSTRAR ESTADO VACÍO
        // ====================================================
        if (!resultado.total) {
            html(
                'tablaHistorialBody',
                filaHistorialVacia(
                    5,
                    'Sin notificaciones registradas',
                    'Las notificaciones aparecerán cuando sean procesadas por el servidor.',
                    'fa-envelope-open'
                )
            );
        } else {
            // =================================================
            // GENERAR FILAS DEL HISTORIAL
            // =================================================
            html(
                'tablaHistorialBody',
                resultado.registros.map(registro => `
                    <tr>

                        <!-- FECHA DE LA NOTIFICACIÓN -->

                        <td>
                            ${escapar(
                                fechaHoraHistorial(
                                    registro.fecha
                                )
                            )}
                        </td>

                        <!-- TIPO DE NOTIFICACIÓN -->

                        <td>
                            ${escapar(
                                etiquetaHistorial(
                                    registro.tipo
                                )
                            )}
                        </td>

                        <!-- DESTINATARIO -->

                        <td>
                            ${escapar(
                                registro.destinatario
                            )}
                        </td>

                        <!-- ASUNTO Y BOTÓN DE DETALLE -->

                        <td>

                            <strong>
                                ${escapar(
                                    registro.asunto
                                )}
                            </strong>

                            <button
                                type="button"
                                class="btn btn-sm btn-link d-block p-0"
                                data-accion="detalle-notificacion"
                                data-notificacion-id="${escapar(registro.id)}"
                            >

                                Ver detalle

                            </button>

                        </td>

                        <!-- ESTADO DEL ENVÍO -->

                        <td>

                            ${badgeHistorialDocumental(
                                registro.estado
                            )}

                        </td>

                    </tr>
                `).join('')
            );
        }
        // ====================================================
        // ACTUALIZAR CONTADOR DE RESULTADOS
        // ====================================================
        pintarContadorDocumental(
            'contadorHistorialNotificaciones',
            resultado
        );
        // ====================================================
        // ACTUALIZAR PAGINACIÓN
        // ====================================================
        pintarPaginacionDocumental(
            'paginacionHistorialNotificaciones',
            resultado
        );
    }
    // ========================================================
    // 194. CONSULTAR DETALLE DE NOTIFICACIÓN
    //
    // Recupera la información completa de una notificación
    // mediante su identificador.
    //
    // Presenta el contenido del correo, las fechas,
    // el destinatario, los intentos y los errores.
    // ========================================================
    async function abrirDetalleNotificacion(id) {
        // Validar identificador del registro.
        const identificador = validarId(id);
        // Consultar detalle desde el backend.
        const datos = await peticion(
            RUTAS_DOCUMENTALES.detalleNotificacion(
                identificador
            )
        );
        // Normalizar información recibida.
        const registro = normalizarNotificacion(
            datos.notificacion ||
            datos.registro ||
            datos
        );
        // ====================================================
        // INFORMACIÓN GENERAL DE LA NOTIFICACIÓN
        //
        // Los mensajes se insertan como texto.
        // No se ejecuta HTML recibido desde la base de datos.
        // ====================================================
        texto(
            'detalleNotificacionId',
            registro.id
        );
        texto(
            'detalleNotificacionDestinatario',
            registro.destinatario
        );
        texto(
            'detalleNotificacionTipo',
            etiquetaHistorial(registro.tipo)
        );
        // ====================================================
        // FECHA PROGRAMADA
        // ====================================================
        texto(
            'detalleNotificacionFechaProgramada',
            fechaHoraHistorial(
                registro.fecha_programada
            )
        );
        // ====================================================
        // FECHA REAL DE ENVÍO
        // ====================================================
        texto(
            'detalleNotificacionFechaEnvio',
            fechaHoraHistorial(
                registro.fecha_envio
            )
        );
        // ====================================================
        // ESTADO VISUAL DE LA NOTIFICACIÓN
        // ====================================================
        html(
            'detalleNotificacionEstado',
            badgeHistorialDocumental(
                registro.estado
            )
        );
        // ====================================================
        // CANTIDAD DE INTENTOS
        // ====================================================
        texto(
            'detalleNotificacionIntentos',
            registro.intentos
        );
        // ====================================================
        // ASUNTO DEL CORREO
        // ====================================================
        texto(
            'detalleNotificacionAsunto',
            registro.asunto
        );
        // ====================================================
        // CONTENIDO DEL MENSAJE
        // ====================================================
        texto(
            'detalleNotificacionMensaje',
            registro.mensaje ||
            'No hay contenido disponible.'
        );
        // ====================================================
        // INFORMACIÓN DE ERRORES
        // ====================================================
        texto(
            'detalleNotificacionError',
            registro.error
        );
        // Mostrar errores únicamente cuando existan.
        visible(
            'contenedorErrorNotificacion',
            Boolean(registro.error)
        );
        // ====================================================
        // ABRIR MODAL DE DETALLE
        //
        // Si la interfaz no dispone del modal, presenta
        // el asunto y estado mediante una notificación.
        // ====================================================
        if ($('modalDetalleNotificacion')) {
            abrirModal(
                'modalDetalleNotificacion'
            );
        } else {
            notificar(
                `${registro.asunto} — ${etiquetaHistorial(registro.estado)}`
            );
        }
    }
    // ========================================================
    // 195. CONSULTAR INDICADORES DE NOTIFICACIONES
    //
    // Recupera los indicadores correspondientes al año
    // seleccionado en el Cronograma de Transformín.
    // ========================================================
    async function cargarIndicadoresNotificaciones() {
        // Consultar indicadores del backend.
        const datos = await peticion(
            conAnio(
                RUTAS_DOCUMENTALES.indicadoresNotificaciones
            )
        );
        // Almacenar indicadores recibidos.
        estado.indicadoresNotificaciones =
            datos.indicadores ||
            datos;
        // Actualizar representación visual.
        pintarIndicadoresNotificaciones();
        // Devolver indicadores consultados.
        return estado.indicadoresNotificaciones;
    }
    // ========================================================
    // 196. RENDERIZAR INDICADORES DE NOTIFICACIONES
    //
    // Actualiza los indicadores generales:
    //
    // - Total de notificaciones.
    // - Notificaciones enviadas.
    // - Notificaciones pendientes.
    // - Notificaciones con errores.
    // - Notificaciones canceladas.
    // - Porcentaje de éxito de envío.
    //
    // La tasa de éxito se calcula exclusivamente
    // sobre los envíos procesados.
    // ========================================================
    function pintarIndicadoresNotificaciones() {
        // Recuperar indicadores almacenados.
        const datos =
            estado.indicadoresNotificaciones || {};
        // ====================================================
        // TOTAL DE NOTIFICACIONES ENVIADAS
        // ====================================================
        const enviadas = numero(
            datos.enviadas ??
            datos.enviados ??
            datos.totalEnviadas
        );
        // ====================================================
        // TOTAL DE NOTIFICACIONES PENDIENTES
        // ====================================================
        const pendientes = numero(
            datos.pendientes ??
            datos.totalPendientes
        );
        // ====================================================
        // TOTAL DE NOTIFICACIONES CON ERRORES
        // ====================================================
        const errores = numero(
            datos.errores ??
            datos.conError ??
            datos.totalErrores
        );
        // ====================================================
        // TOTAL DE NOTIFICACIONES CANCELADAS
        // ====================================================
        const canceladas = numero(
            datos.canceladas ??
            datos.cancelados ??
            datos.totalCanceladas
        );
        // ====================================================
        // TOTAL GENERAL DE NOTIFICACIONES
        //
        // Prioriza el total entregado por el backend.
        // Si no existe, calcula la suma de los estados.
        // ====================================================
        const total = numero(
            datos.total ??
            datos.totalNotificaciones ??
            (
                enviadas +
                pendientes +
                errores +
                canceladas
            )
        );
        // ====================================================
        // CALCULAR NOTIFICACIONES PROCESADAS
        //
        // No incluye notificaciones pendientes o canceladas.
        // ====================================================
        const procesadas =
            enviadas + errores;
        // ====================================================
        // CALCULAR TASA DE ÉXITO
        //
        // Fórmula:
        //
        // Enviadas / (Enviadas + Errores) × 100
        //
        // Cuando no existen envíos procesados, devuelve null
        // para representar el indicador como N/A.
        // ====================================================
        const tasa = procesadas
            ? (enviadas / procesadas) * 100
            : null;
        // ====================================================
        // ACTUALIZIZAR INDICADORES VISUALES
        // ====================================================
        texto(
            'totalNotificaciones',
            total
        );
        texto(
            'totalNotificacionesEnviadas',
            enviadas
        );
        texto(
            'totalNotificacionesPendientes',
            pendientes
        );
        texto(
            'totalNotificacionesErrores',
            errores
        );
        texto(
            'totalNotificacionesCanceladas',
            canceladas
        );
        // ====================================================
        // MOSTRAR PORCENTAJE DE ÉXITO
        // ====================================================
        texto(
            'porcentajeEnvioNotificaciones',
            tasa === null
                ? 'N/A'
                : porcentajeTexto(tasa)
        );
        // ====================================================
        // ACTUALIZAR BARRA DE PROGRESO
        //
        // Limita el ancho visual entre 0 y 100%.
        // ====================================================
        const barra =
            $('barraProgresoNotificaciones');
        if (barra) {
            const valor = Math.min(
                100,
                Math.max(
                    0,
                    tasa ?? 0
                )
            );
            barra.style.width = `${valor}%`;
            // Actualizar atributo de accesibilidad.
            barra.setAttribute(
                'aria-valuenow',
                String(valor)
            );
        }
        // ====================================================
        // ACTUALIZAR CONTENEDOR DE PROGRESO
        // ====================================================
        const progreso =
            $('progresoNotificaciones');
        if (progreso) {
            progreso.setAttribute(
                'aria-valuenow',
                String(tasa ?? 0)
            );
        }
    }
    // ========================================================
    // 197. LIMPIAR FILTROS DE NOTIFICACIONES
    //
    // Restablece los campos de búsqueda, fechas,
    // tipo de notificación y estado.
    //
    // Posteriormente consulta nuevamente el historial
    // correspondiente al periodo activo.
    //
    // No elimina registros de la base de datos.
    // ========================================================
    async function limpiarFiltrosNotificaciones() {
        // ====================================================
        // LIMPIAR CAMPOS DE TEXTO Y FECHAS
        // ====================================================
        [
            'buscarNotificacion',
            'filtroNotificacionDesde',
            'filtroNotificacionHasta'
        ].forEach(id => {
            setCampo(id, '');
        });
        // ====================================================
        // RESTABLECER SELECTORES
        // ====================================================
        [
            'filtroNotificacionTipo',
            'filtroNotificacionEstado'
        ].forEach(id => {
            const selector = $(id);
            if (selector) {
                selector.selectedIndex = 0;
            }
        });
        // ====================================================
        // CONSULTAR HISTORIAL SIN FILTROS ADICIONALES
        // ====================================================
        await cargarHistorialNotificaciones();
    }
    // ========================================================
    // 198. FILTROS DEL HISTORIAL DE ACTIVIDADES
    //
    // Recupera los filtros seleccionados por el usuario.
    // Permite consultar movimientos por año, origen,
    // acción, búsqueda e intervalo de fechas.
    // ========================================================
    function obtenerFiltrosAuditoria() {
        // Recuperar fecha inicial.
        const desde = campo(
            'filtroHistorialDesde'
        );
        // Recuperar fecha final.
        const hasta = campo(
            'filtroHistorialHasta'
        );
        // Validar intervalo de fechas seleccionado.
        validarFechasHistorial(
            desde,
            hasta
        );
        // Construir filtros de consulta.
        return {
            // Periodo activo del cronograma.
            anio: estado.anio,
            // Origen de la actividad.
            origen: campo(
                'filtroHistorialOrigen'
            ),
            // Tipo de acción realizada.
            accion: campo(
                'filtroHistorialAccion'
            ),
            // Búsqueda de movimientos.
            buscar: campo(
                'buscarHistorialActividad'
            ),
            // Intervalo de fechas.
            desde,
            hasta,
            // Límite de registros solicitados al backend.
            limite: 500
        };
    }
    // ========================================================
    // 199. NORMALIZAR REGISTROS DE AUDITORÍA
    //
    // Unifica las propiedades recibidas desde el backend.
    //
    // Conserva la información original del registro y
    // permite utilizar diferentes nombres de propiedades.
    //
    // Incluye:
    //
    // - Identificador.
    // - Origen.
    // - Acción realizada.
    // - Fecha del movimiento.
    // - Estado anterior.
    // - Estado nuevo.
    // - Descripción.
    // - Usuario responsable.
    // ========================================================
    function normalizarRegistroAuditoria(
        registro = {}
    ) {
        return {
            // Conservar propiedades originales.
            ...registro,
            // Identificador del movimiento.
            id: String(
                registro.id ?? ''
            ),
            // Origen de la actividad.
            origen:
                registro.origen ||
                'MANUAL',
            // Acción realizada sobre el registro.
            accion:
                registro.accion ||
                '',
            // Fecha de creación del movimiento.
            fecha:
                registro.created_at ||
                registro.fecha ||
                '',
            // Estado anterior de la actividad.
            estadoAnterior:
                registro.estado_anterior ??
                registro.estadoAnterior ??
                '',
            // Nuevo estado de la actividad.
            estadoNuevo:
                registro.estado_nuevo ??
                registro.estadoNuevo ??
                '',
            // Descripción del movimiento registrado.
            descripcion:
                registro.descripcion ||
                registro.detalle ||
                'Sin descripción',
            // =================================================
            // IDENTIFICAR USUARIO RESPONSABLE
            //
            // Prioriza el nombre del usuario.
            // Si no está disponible, utiliza su identificador.
            // =================================================
            usuario:
                registro.nombre_usuario ||
                registro.usuario_nombre ||
                registro.usuario ||
                (
                    registro.usuario_id
                        ? `Usuario #${registro.usuario_id}`
                        : 'No identificado'
                )
        };
    }
    // ========================================================
    // 200. CONSULTAR AUDITORÍA DE ACTIVIDADES
    //
    // Consulta el historial de modificaciones mediante
    // los filtros seleccionados por el usuario.
    //
    // Cancela solicitudes anteriores para evitar mostrar
    // resultados correspondientes a filtros desactualizados.
    //
    // Después de consultar:
    //
    // - Normaliza los registros.
    // - Actualiza el estado del módulo.
    // - Restablece la paginación.
    // - Renderiza la tabla.
    // ========================================================
    async function cargarHistorialActividades() {
        // ====================================================
        // CONSTRUIR RUTA DE CONSULTA
        // ====================================================
        const ruta =
            construirRutaHistorial(
                RUTAS_DOCUMENTALES.auditoria,
                obtenerFiltrosAuditoria()
            );
        try {
            // ================================================
            // CONSULTAR REGISTROS DEL BACKEND
            // ================================================
            const datos = await peticion(
                ruta,
                {
                    clavePeticion:
                        'historial-actividades',
                    cancelarAnterior: true
                }
            );
            // ================================================
            // NORMALIZAR REGISTROS DE AUDITORÍA
            // ================================================
            estado.historialActividades =
                extraerLista(
                    datos,
                    'historial',
                    'registros',
                    'actividades'
                ).map(normalizarRegistroAuditoria);
            // ================================================
            // RESTABLECER PÁGINA ACTUAL
            // ================================================
            estado.paginaHistorialActividades = 1;
            // ================================================
            // ACTUALIZAR TABLA DE AUDITORÍA
            // ================================================
            pintarHistorialActividades();
            // Devolver registros consultados.
            return estado.historialActividades;
        } catch (error) {
            // ================================================
            // CONTROLAR ERRORES DE CONSULTA
            //
            // Las solicitudes canceladas no se presentan
            // como errores del historial.
            // ================================================
            if (error.name !== 'AbortError') {
                html(
                    'tablaHistorialActividadesBody',
                    filaHistorialVacia(
                        7,
                        'Auditoría no disponible',
                        'No fue posible consultar los cambios registrados.',
                        'fa-triangle-exclamation'
                    )
                );
            }
            // Propagar error al controlador correspondiente.
            throw error;
        }
    }
    // ========================================================
    // 201. RENDERIZAR AUDITORÍA DE ACTIVIDADES
    //
    // Genera las filas del historial de actividades.
    //
    // Conserva las siete columnas institucionales:
    //
    // 1. Fecha.
    // 2. Origen.
    // 3. Acción.
    // 4. Estado anterior.
    // 5. Estado nuevo.
    // 6. Descripción.
    // 7. Usuario responsable.
    //
    // Incluye estados visuales, paginación y contador.
    // ========================================================
    function pintarHistorialActividades() {
        // ====================================================
        // OBTENER REGISTROS DE LA PÁGINA ACTUAL
        // ====================================================
        const resultado =
            paginarHistorialDocumental(
                estado.historialActividades,
                estado.paginaHistorialActividades,
                estado.porPaginaHistorial
            );
        // Actualizar página normalizada.
        estado.paginaHistorialActividades =
            resultado.pagina;
        // ====================================================
        // MOSTRAR ESTADO VACÍO
        // ====================================================
        if (!resultado.total) {
            html(
                'tablaHistorialActividadesBody',
                filaHistorialVacia(
                    7,
                    'Sin movimientos registrados',
                    'Los cambios de actividades aparecerán en este historial.',
                    'fa-clipboard-list'
                )
            );
        } else {
            // ================================================
            // GENERAR FILAS DEL HISTORIAL DE ACTIVIDADES
            // ================================================
            html(
                'tablaHistorialActividadesBody',
                resultado.registros.map(registro => `
                    <tr>

                        <!-- COLUMNA 01: FECHA -->

                        <td>

                            ${escapar(
                                fechaHoraHistorial(
                                    registro.fecha
                                )
                            )}

                        </td>

                        <!-- COLUMNA 02: ORIGEN -->

                        <td>

                            ${escapar(
                                etiquetaHistorial(
                                    registro.origen
                                )
                            )}

                        </td>

                        <!-- COLUMNA 03: ACCIÓN REALIZADA -->

                        <td>

                            <strong>
                                ${escapar(
                                    etiquetaHistorial(
                                        registro.accion
                                    )
                                )}
                            </strong>

                        </td>

                        <!-- COLUMNA 04: ESTADO ANTERIOR -->

                        <td>

                            ${
                                registro.estadoAnterior
                                    ? badgeHistorialDocumental(
                                        registro.estadoAnterior
                                    )
                                    : '—'
                            }

                        </td>

                        <!-- COLUMNA 05: ESTADO NUEVO -->

                        <td>

                            ${
                                registro.estadoNuevo
                                    ? badgeHistorialDocumental(
                                        registro.estadoNuevo
                                    )
                                    : '—'
                            }

                        </td>

                        <!-- COLUMNA 06: DESCRIPCIÓN -->

                        <td>

                            ${escapar(
                                registro.descripcion
                            )}

                        </td>

                        <!-- COLUMNA 07: USUARIO RESPONSABLE -->

                        <td>

                            ${escapar(
                                registro.usuario
                            )}

                        </td>

                    </tr>
                `).join('')
            );
        }
        // ====================================================
        // ACTUALIZAR CONTADOR DE RESULTADOS
        //
        // Informa cuántos registros se encuentran visibles
        // respecto al total de movimientos consultados.
        // ====================================================
        pintarContadorDocumental(
            'contadorHistorialActividades',
            resultado
        );
        // ====================================================
        // ACTUALIZAR PAGINACIÓN
        //
        // Genera los controles de navegación correspondientes
        // al historial de actividades.
        // ====================================================
        pintarPaginacionDocumental(
            'paginacionHistorialActividades',
            resultado
        );
    }
    // ========================================================
    // 202. LIMPIAR FILTROS DE AUDITORÍA
    //
    // Restablece los campos de búsqueda, fechas, origen
    // y tipo de acción del historial de actividades.
    //
    // Consulta nuevamente los movimientos del periodo activo.
    //
    // Esta operación no elimina ni modifica los registros
    // almacenados en la base de datos.
    // ========================================================
    async function limpiarFiltrosAuditoria() {
        // ====================================================
        // LIMPIAR CAMPOS DE BÚSQUEDA Y FECHAS
        // ====================================================
        [
            'buscarHistorialActividad',
            'filtroHistorialDesde',
            'filtroHistorialHasta'
        ].forEach(id => {
            setCampo(id, '');
        });
        // ====================================================
        // RESTABLECER SELECTORES DE ORIGEN Y ACCIÓN
        // ====================================================
        [
            'filtroHistorialOrigen',
            'filtroHistorialAccion'
        ].forEach(id => {
            const selector = $(id);
            if (selector) {
                selector.selectedIndex = 0;
            }
        });
        // ====================================================
        // CONSULTAR HISTORIAL SIN FILTROS ADICIONALES
        // ====================================================
        await cargarHistorialActividades();
    }
    // ========================================================
    // 203. NORMALIZAR HISTORIAL DE IMPORTACIONES
    //
    // Unifica las propiedades recibidas desde el backend.
    // Conserva la información original de cada importación
    // y admite diferentes nombres de propiedades.
    // ========================================================
    function normalizarRegistroImportacion(
        registro = {}
    ) {
        return {
            ...registro,
            // Identificador de la importación.
            id: String(
                registro.id ?? ''
            ),
            // Fecha de procesamiento del documento.
            fecha:
                registro.fecha ||
                registro.created_at ||
                '',
            // Nombre del archivo institucional importado.
            archivo:
                registro.nombre_archivo ||
                registro.nombreArchivo ||
                registro.archivo ||
                'Documento institucional',
            // Cantidad de filas leídas desde el Excel.
            leidas: numero(
                registro.filas_leidas ??
                registro.leidas
            ),
            // Cantidad de registros nuevos insertados.
            insertadas: numero(
                registro.filas_insertadas ??
                registro.insertadas
            ),
            // Cantidad de registros existentes actualizados.
            actualizadas: numero(
                registro.filas_actualizadas ??
                registro.actualizadas
            ),
            // Cantidad de registros omitidos.
            omitidas: numero(
                registro.filas_omitidas ??
                registro.omitidas
            ),
            // Estado del proceso de importación.
            estado:
                registro.estado ||
                'INICIADA',
            // Información de errores registrados.
            error:
                registro.detalle_error ||
                registro.error ||
                ''
        };
    }
    // ========================================================
    // 204. CONSULTAR HISTORIAL DE IMPORTACIONES
    //
    // Recupera las importaciones institucionales del año
    // seleccionado, utilizando el periodo activo cuando
    // no existe un año seleccionado específicamente.
    //
    // Compatible con años anteriores y posteriores.
    // ========================================================
    async function cargarHistorialImportaciones() {
        // Validar periodo seleccionado.
        const anio = validarAnioDocumental(
            campo('anioHistorialImportaciones') ||
            estado.anio
        );
        try {
            // ================================================
            // CONSULTAR HISTORIAL DESDE EL BACKEND
            //
            // Cancela solicitudes anteriores mediante
            // el controlador general de peticiones.
            // ================================================
            const datos = await peticion(
                conAnio(
                    RUTAS_DOCUMENTALES.importaciones,
                    anio
                ),
                {
                    clavePeticion:
                        'historial-importaciones',
                    cancelarAnterior: true
                }
            );
            // ================================================
            // NORMALIZAR REGISTROS RECIBIDOS
            // ================================================
            estado.historialImportaciones =
                extraerLista(
                    datos,
                    'historial',
                    'importaciones',
                    'registros'
                ).map(normalizarRegistroImportacion);
            // Restablecer página del historial.
            estado.paginaHistorialImportaciones = 1;
            // Actualizar representación visual.
            pintarHistorialImportaciones();
            // Devolver registros consultados.
            return estado.historialImportaciones;
        } catch (error) {
            // ================================================
            // CONTROLAR ERRORES DE CONSULTA
            //
            // Las solicitudes canceladas no se muestran
            // como errores de funcionamiento.
            // ================================================
            if (error.name !== 'AbortError') {
                html(
                    'tablaHistorialImportacionesBody',
                    filaHistorialVacia(
                        7,
                        'Historial no disponible',
                        'No fue posible consultar las importaciones del periodo.',
                        'fa-triangle-exclamation'
                    )
                );
            }
            // Propagar error al controlador correspondiente.
            throw error;
        }
    }
    // ========================================================
    // 205. RENDERIZAR HISTORIAL DE IMPORTACIONES
    //
    // Genera las filas correspondientes a los documentos
    // institucionales importados en el sistema.
    //
    // Estructura de siete columnas:
    //
    // 1. Fecha.
    // 2. Archivo.
    // 3. Filas leídas.
    // 4. Registros insertados.
    // 5. Registros actualizados.
    // 6. Registros omitidos.
    // 7. Estado.
    //
    // Incluye información de errores, contador y paginación.
    // ========================================================
    function pintarHistorialImportaciones() {
        // ================================================
        // OBTENER REGISTROS DE LA PÁGINA ACTUAL
        // ================================================
        const resultado =
            paginarHistorialDocumental(
                estado.historialImportaciones,
                estado.paginaHistorialImportaciones,
                estado.porPaginaHistorial
            );
        // Actualizar página normalizada.
        estado.paginaHistorialImportaciones =
            resultado.pagina;
        // ================================================
        // MOSTRAR ESTADO VACÍO DEL HISTORIAL
        // ================================================
        if (!resultado.total) {
            html(
                'tablaHistorialImportacionesBody',
                filaHistorialVacia(
                    7,
                    'Sin importaciones registradas',
                    'Todavía no se han importado documentos para el periodo seleccionado.',
                    'fa-file-excel'
                )
            );
        } else {
            // ================================================
            // GENERAR FILAS DEL HISTORIAL
            // ================================================
            html(
                'tablaHistorialImportacionesBody',
                resultado.registros.map(registro => `
                    <tr>

                        <!-- COLUMNA 01: FECHA -->

                        <td>

                            ${escapar(
                                fechaHoraHistorial(
                                    registro.fecha
                                )
                            )}

                        </td>

                        <!-- COLUMNA 02: ARCHIVO INSTITUCIONAL -->

                        <td>

                            <div class="historial-archivo">

                                <i class="fas fa-file-excel text-success"
                                   aria-hidden="true"></i>

                                <span>

                                    ${escapar(
                                        registro.archivo
                                    )}

                                </span>

                            </div>

                        </td>

                        <!-- COLUMNA 03: FILAS LEÍDAS -->

                        <td>
                            ${registro.leidas}
                        </td>

                        <!-- COLUMNA 04: REGISTROS INSERTADOS -->

                        <td>
                            ${registro.insertadas}
                        </td>

                        <!-- COLUMNA 05: REGISTROS ACTUALIZADOS -->

                        <td>
                            ${registro.actualizadas}
                        </td>

                        <!-- COLUMNA 06: REGISTROS OMITIDOS -->

                        <td>
                            ${registro.omitidas}
                        </td>

                        <!-- COLUMNA 07: ESTADO DE IMPORTACIÓN -->

                        <td>

                            ${badgeHistorialDocumental(
                                registro.estado
                            )}

                            ${
                                registro.error
                                    ? `
                                        <small class="d-block text-danger mt-1">

                                            ${escapar(
                                                registro.error
                                            )}

                                        </small>
                                    `
                                    : ''
                            }

                        </td>

                    </tr>
                `).join('')
            );
        }
        // ================================================
        // ACTUALIZAR CONTADOR DE RESULTADOS
        // ================================================
        pintarContadorDocumental(
            'contadorHistorialImportaciones',
            resultado
        );
        // ================================================
        // ACTUALIZAR PAGINACIÓN DEL HISTORIAL
        // ================================================
        pintarPaginacionDocumental(
            'paginacionHistorialImportaciones',
            resultado
        );
    }
    // ========================================================
    // 206. ACTUALIZACIÓN GENERAL DE HISTORIALES
    //
    // Actualiza simultáneamente los historiales documentales
    // y los indicadores generales de notificaciones.
    //
    // Utiliza Promise.allSettled para permitir que las
    // consultas independientes finalicen aunque alguna falle.
    //
    // Las solicitudes canceladas no se contabilizan como
    // errores generales de actualización.
    // ========================================================
    async function actualizarHistorialesDocumentales() {
        // ================================================
        // EJECUTAR CONSULTAS EN PARALELO
        // ================================================
        const resultados =
            await Promise.allSettled([
                // Historial de notificaciones.
                cargarHistorialNotificaciones(),
                // Historial de actividades y auditoría.
                cargarHistorialActividades(),
                // Historial de documentos institucionales.
                cargarHistorialImportaciones(),
                // Indicadores generales de notificaciones.
                cargarIndicadoresNotificaciones()
            ]);
        // ================================================
        // IDENTIFICAR CONSULTAS CON ERRORES
        // ================================================
        const errores = resultados.filter(
            resultado =>
                resultado.status === 'rejected' &&
                resultado.reason?.name !== 'AbortError'
        );
        // ================================================
        // REGISTRAR ERRORES EN CONSOLA
        //
        // Facilita el diagnóstico de consultas fallidas
        // sin detener los demás componentes.
        // ================================================
        errores.forEach(resultado => {
            console.error(
                '[Transformín - Historiales]',
                resultado.reason
            );
        });
        // ================================================
        // NOTIFICAR ACTUALIZACIÓN PARCIAL
        // ================================================
        if (errores.length) {
            notificar(
                'Algunos historiales no pudieron actualizarse.',
                'advertencia'
            );
        }
        // ================================================
        // DEVOLVER RESULTADO GENERAL
        // ================================================
        return {
            // Indica si hubo errores distintos de cancelaciones.
            success: errores.length === 0,
            // Cantidad de consultas con errores.
            errores: errores.length
        };
    }
    // ========================================================
    // 207. CONFIGURAR PAGINACIÓN DE HISTORIALES
    //
    // Configura la navegación mediante delegación de eventos.
    //
    // Permite utilizar los mismos controles para:
    //
    // - Historial de notificaciones.
    // - Historial de actividades.
    // - Historial de importaciones.
    //
    // Valida el número de página antes de ejecutar
    // la función correspondiente.
    // ========================================================
    function enlazarPaginacionDocumental(
        id,
        callback
    ) {
        // Registrar evento sobre el contenedor.
        enlazar(
            id,
            'click',
            evento => {
                // ============================================
                // IDENTIFICAR BOTÓN DE PAGINACIÓN
                //
                // Permite seleccionar el botón incluso cuando
                // el usuario pulsa directamente sobre un icono.
                // ============================================
                const boton =
                    evento.target.closest(
                        '[data-pagina]'
                    );
                // Ignorar elementos inválidos o deshabilitados.
                if (
                    !boton ||
                    boton.disabled
                ) {
                    return;
                }
                // Obtener número de página solicitado.
                const pagina = Number(
                    boton.dataset.pagina
                );
                // ============================================
                // VALIDAR PÁGINA Y EJECUTAR CALLBACK
                // ============================================
                if (
                    Number.isInteger(pagina) &&
                    pagina > 0
                ) {
                    callback(pagina);
                }
            }
        );
    }
    // ========================================================
    // 208. EVENTOS DEL HISTORIAL DE NOTIFICACIONES
    //
    // Configura los controles de actualización, búsqueda,
    // filtros, detalles y paginación de las notificaciones.
    // ========================================================
    function configurarHistorialNotificaciones() {
        // Actualizar historial de notificaciones.
        enlazar(
            'btnActualizarHistorial',
            'click',
            eventoSeguro(async () => {
                await cargarHistorialNotificaciones();
                notificar(
                    'Historial de notificaciones actualizado.'
                );
            })
        );
        // Actualizar indicadores generales de notificaciones.
        enlazar(
            'btnActualizarIndicadoresNotificaciones',
            'click',
            eventoSeguro(
                cargarIndicadoresNotificaciones
            )
        );
        // Aplicar filtros seleccionados.
        enlazar(
            'btnFiltrarNotificaciones',
            'click',
            eventoSeguro(
                cargarHistorialNotificaciones
            )
        );
        // Restablecer filtros del historial.
        enlazar(
            'btnLimpiarNotificaciones',
            'click',
            eventoSeguro(
                limpiarFiltrosNotificaciones
            )
        );
        // ====================================================
        // BÚSQUEDA MEDIANTE TECLA ENTER
        //
        // Permite consultar las notificaciones directamente
        // desde el campo de búsqueda sin pulsar Filtrar.
        // ====================================================
        enlazar(
            'buscarNotificacion',
            'keydown',
            eventoSeguro(async evento => {
                if (evento.key !== 'Enter') {
                    return;
                }
                evento.preventDefault();
                await cargarHistorialNotificaciones();
            })
        );
        // ====================================================
        // CONSULTAR DETALLE DE NOTIFICACIÓN
        //
        // Utiliza delegación de eventos para identificar
        // los botones generados dinámicamente en la tabla.
        // ====================================================
        enlazar(
            'tablaHistorialBody',
            'click',
            eventoSeguro(async evento => {
                const boton =
                    evento.target.closest(
                        '[data-accion="detalle-notificacion"]'
                    );
                if (!boton) return;
                await abrirDetalleNotificacion(
                    boton.dataset.notificacionId
                );
            })
        );
        // ====================================================
        // PAGINACIÓN DEL HISTORIAL DE NOTIFICACIONES
        //
        // Actualiza la página seleccionada y vuelve a
        // representar los registros almacenados.
        // ====================================================
        enlazarPaginacionDocumental(
            'paginacionHistorialNotificaciones',
            pagina => {
                estado.paginaHistorialNotificaciones =
                    pagina;
                pintarHistorialNotificaciones();
            }
        );
    }
    // ========================================================
    // 209. EVENTOS DE AUDITORÍA
    //
    // Configura los controles correspondientes al historial
    // de modificaciones de actividades institucionales
    // y actividades manuales.
    // ========================================================
    function configurarHistorialActividades() {
        // Actualizar historial de actividades.
        enlazar(
            'btnActualizarHistorialActividades',
            'click',
            eventoSeguro(async () => {
                await cargarHistorialActividades();
                notificar(
                    'Historial de actividades actualizado.'
                );
            })
        );
        // Aplicar filtros de auditoría.
        enlazar(
            'btnFiltrarHistorialActividades',
            'click',
            eventoSeguro(
                cargarHistorialActividades
            )
        );
        // Restablecer filtros de auditoría.
        enlazar(
            'btnLimpiarHistorialActividades',
            'click',
            eventoSeguro(
                limpiarFiltrosAuditoria
            )
        );
        // ====================================================
        // FILTRAR AUTOMÁTICAMENTE POR ORIGEN
        //
        // Actualiza el historial cuando se selecciona
        // un origen diferente de actividad.
        // ====================================================
        enlazar(
            'filtroHistorialOrigen',
            'change',
            eventoSeguro(
                cargarHistorialActividades
            )
        );
        // ====================================================
        // BÚSQUEDA MEDIANTE TECLA ENTER
        // ====================================================
        enlazar(
            'buscarHistorialActividad',
            'keydown',
            eventoSeguro(async evento => {
                if (evento.key !== 'Enter') {
                    return;
                }
                evento.preventDefault();
                await cargarHistorialActividades();
            })
        );
        // ====================================================
        // PAGINACIÓN DEL HISTORIAL DE ACTIVIDADES
        // ====================================================
        enlazarPaginacionDocumental(
            'paginacionHistorialActividades',
            pagina => {
                estado.paginaHistorialActividades =
                    pagina;
                pintarHistorialActividades();
            }
        );
    }
    // ========================================================
    // 210. EVENTOS DEL HISTORIAL DE IMPORTACIONES
    //
    // Configura el selector de año, la actualización
    // del historial y la navegación entre páginas.
    //
    // Compatible con años anteriores y posteriores,
    // según los límites definidos en la configuración.
    // ========================================================
    function configurarHistorialImportaciones() {
        // Preparar selector del periodo documental.
        prepararSelectorAnioDocumental(
            'anioHistorialImportaciones'
        );
        // ====================================================
        // ACTUALIZAR HISTORIAL DE IMPORTACIONES
        // ====================================================
        enlazar(
            'btnActualizarHistorialImportaciones',
            'click',
            eventoSeguro(async () => {
                await cargarHistorialImportaciones();
                notificar(
                    'Historial de importaciones actualizado.'
                );
            })
        );
        // ====================================================
        // DETECTAR CAMBIO DEL AÑO SELECCIONADO
        //
        // Consulta las importaciones correspondientes
        // al nuevo periodo seleccionado.
        // ====================================================
        enlazar(
            'anioHistorialImportaciones',
            'change',
            eventoSeguro(
                cargarHistorialImportaciones
            )
        );
        // ====================================================
        // PAGINACIÓN DEL HISTORIAL DE IMPORTACIONES
        // ====================================================
        enlazarPaginacionDocumental(
            'paginacionHistorialImportaciones',
            pagina => {
                estado.paginaHistorialImportaciones =
                    pagina;
                pintarHistorialImportaciones();
            }
        );
    }
    // ========================================================
    // 211. SINCRONIZAR PERIODO DOCUMENTAL
    //
    // Mantiene sincronizados los selectores documentales
    // con el año activo del Cronograma de Transformín.
    //
    // Protege las operaciones de importación y exportación
    // para evitar cambios de periodo mientras se ejecutan.
    // ========================================================
    function sincronizarAnioDocumental() {
        // Validar año activo del cronograma.
        const anio = validarAnioDocumental(
            estado.anio
        );
        // ====================================================
        // SINCRONIZAR HISTORIAL DE IMPORTACIONES
        // ====================================================
        prepararSelectorAnioDocumental(
            'anioHistorialImportaciones',
            anio
        );
        // ====================================================
        // SINCRONIZAR PERIODO DE IMPORTACIÓN
        //
        // Solo modifica el selector cuando:
        //
        // - No existe una importación activa.
        // - El modal de importación no está abierto.
        //
        // Invalida la previsualización anterior para evitar
        // utilizar datos correspondientes a otro periodo.
        // ====================================================
        if (
            !estado.importandoExcel &&
            !$('modalImportarExcel')
                ?.classList.contains('show')
        ) {
            prepararSelectorAnioDocumental(
                'anioImportarExcel',
                anio
            );
            invalidarPrevisualizacionExcel();
        }
        // ====================================================
        // SINCRONIZAR PERIODO DE EXPORTACIÓN
        //
        // Solo modifica el selector cuando:
        //
        // - No existe una exportación activa.
        // - El modal de exportación no está abierto.
        //
        // Limpia el resumen anterior para impedir que
        // se exporte información de otro periodo.
        // ====================================================
        if (
            !estado.exportandoExcel &&
            !$('modalExportarExcel')
                ?.classList.contains('show')
        ) {
            prepararSelectorAnioDocumental(
                'anioExportarExcel',
                anio
            );
            estado.resumenExportacion = null;
        }
    }
    // ========================================================
    // 212. CONFIGURACIÓN CENTRALIZADA DOCUMENTAL
    //
    // Centraliza la configuración de todos los componentes
    // relacionados con la gestión documental.
    //
    // Componentes:
    //
    // 01. Importación institucional.
    // 02. Exportación institucional.
    // 03. Historial de notificaciones.
    // 04. Historial de actividades y auditoría.
    // 05. Historial de importaciones.
    // 06. Sincronización del periodo documental.
    //
    // Esta función será ejecutada por el configurador
    // general durante la inicialización del módulo.
    // ========================================================
    function configurarModuloDocumental() {
        // Configurar importación Excel FT-SST-147.
        configurarImportacionDocumental();
        // Configurar exportación Excel FT-SST-147.
        configurarExportacionDocumental();
        // Configurar historial de notificaciones.
        configurarHistorialNotificaciones();
        // Configurar historial de actividades.
        configurarHistorialActividades();
        // Configurar historial de importaciones.
        configurarHistorialImportaciones();
        // Sincronizar selectores con el periodo activo.
        sincronizarAnioDocumental();
    }
    // ========================================================
    // 213. INICIALIZACIÓN DOCUMENTAL
    //
    // Inicializa la información documental correspondiente
    // al periodo activo del Cronograma de Transformín.
    //
    // Consulta los historiales e indicadores utilizando
    // la función de actualización centralizada.
    //
    // Devuelve el resultado de las consultas para que
    // el inicializador general pueda evaluar su estado.
    // ========================================================
    async function inicializarModuloDocumental() {
        // Sincronizar periodo antes de consultar información.
        sincronizarAnioDocumental();
        // Actualizar historiales e indicadores documentales.
        return actualizarHistorialesDocumentales();
    }
    // ========================================================
    // 214. CONFIGURACIÓN FINAL DE INICIALIZACIÓN
    //
    // Define los parámetros generales de funcionamiento,
    // actualización automática, diagnóstico y periodos
    // disponibles del Cronograma de Transformín.
    // ========================================================
    const CONFIG_INICIALIZACION = Object.freeze({
        // Identificador de la página dentro del ERP.
        pagina: 'cronograma-transformin',
        // Zona horaria institucional de Colombia.
        zonaHoraria: 'America/Bogota',
        // Actualización general cada dos minutos.
        intervaloActualizacion: 120000,
        // Actualización de fecha y hora cada minuto.
        intervaloFecha: 60000,
        // Tiempo establecido para el diagnóstico.
        tiempoDiagnostico: 15000,
        // Primer año permitido por el sistema.
        anioMinimo: 1900,
        // Último año permitido por el sistema.
        anioMaximo: 9999,
        // Control de mensajes adicionales de depuración.
        depuracion: false
    });
    // ========================================================
    // 215. ESTADO GENERAL DE INICIALIZACIÓN
    //
    // Amplía el estado principal del módulo sin eliminar
    // las propiedades configuradas anteriormente.
    //
    // Permite controlar la inicialización, actualización,
    // conexión, diagnóstico y cambios de periodo.
    // ========================================================
    Object.assign(estado, {
        // Indica si el módulo terminó su inicialización.
        inicializado: false,
        // Controla el proceso de inicialización activo.
        inicializando: false,
        // Indica si los eventos generales fueron configurados.
        eventosGeneralesConfigurados: false,
        // Controla las actualizaciones generales activas.
        actualizandoGeneral: false,
        // Controla el proceso de cambio de año.
        cambiandoAnio: false,
        // Referencia al intervalo de actualización general.
        intervaloGeneral: null,
        // Referencia al intervalo de fecha y hora.
        intervaloFecha: null,
        // Fecha y hora de la última actualización.
        ultimaActualizacion: null,
        // Resultado del diagnóstico general del ERP.
        diagnosticoERP: null,
        // Versión interna del periodo seleccionado.
        versionPeriodo: 0,
        // Estado de conexión informado por el navegador.
        conexionDisponible: navigator.onLine,
        // Registro de errores durante la inicialización.
        erroresInicializacion: []
    });
    // ========================================================
    // 216. REGISTRO INTERNO DE EVENTOS
    //
    // Utiliza WeakMap para almacenar los eventos registrados
    // sobre cada elemento de la interfaz.
    //
    // Evita registrar nuevamente un evento que ya tenga
    // la misma combinación de tipo y clave.
    //
    // Facilita el mantenimiento de los eventos generales
    // y evita ejecuciones duplicadas.
    // ========================================================
    const eventosFinalesRegistrados = new WeakMap();
    function enlazarEventoFinal(
        id,
        evento,
        clave,
        callback
    ) {
        // ====================================================
        // LOCALIZAR ELEMENTO DE LA INTERFAZ
        //
        // Admite identificadores HTML y referencias directas
        // a elementos del documento.
        // ====================================================
        const elemento =
            typeof id === 'string'
                ? $(id)
                : id;
        // ====================================================
        // VALIDAR ELEMENTO Y FUNCIÓN
        // ====================================================
        if (
            !elemento ||
            typeof callback !== 'function'
        ) {
            return false;
        }
        // ====================================================
        // RECUPERAR EVENTOS REGISTRADOS
        // ====================================================
        let registros =
            eventosFinalesRegistrados.get(
                elemento
            );
        // Crear registro cuando el elemento todavía
        // no tiene eventos almacenados.
        if (!registros) {
            registros = new Set();
            eventosFinalesRegistrados.set(
                elemento,
                registros
            );
        }
        // ====================================================
        // GENERAR IDENTIFICADOR ÚNICO DEL EVENTO
        //
        // Ejemplos:
        // click:actualizar-general
        // change:cambiar-periodo
        // ====================================================
        const identificador =
            `${evento}:${clave}`;
        // ====================================================
        // PREVENIR EVENTOS DUPLICADOS
        // ====================================================
        if (
            registros.has(identificador)
        ) {
            return false;
        }
        // ====================================================
        // REGISTRAR EVENTO EN EL ELEMENTO
        // ====================================================
        elemento.addEventListener(
            evento,
            callback
        );
        // Almacenar identificador del evento registrado.
        registros.add(identificador);
        // Confirmar registro satisfactorio.
        return true;
    }
    // ========================================================
    // 217. EJECUCIÓN SEGURA DE FUNCIONES
    //
    // Ejecuta funciones síncronas y asíncronas mediante
    // un controlador común.
    //
    // Permite identificar funciones no disponibles,
    // operaciones canceladas y errores de ejecución.
    //
    // Devuelve un resultado estructurado para facilitar
    // el diagnóstico general del módulo.
    // ========================================================
    async function ejecutarFuncionFinal(
        nombre,
        funcion,
        ...argumentos
    ) {
        // ====================================================
        // COMPROBAR DISPONIBILIDAD DE LA FUNCIÓN
        //
        // Evita intentar ejecutar funciones inexistentes
        // o referencias que no sean ejecutables.
        // ====================================================
        if (typeof funcion !== 'function') {
            console.warn(
                `[Transformín] Función no disponible: ${nombre}`
            );
            return {
                success: false,
                nombre,
                omitida: true,
                mensaje:
                    'La función no está disponible.'
            };
        }
        try {
            // ================================================
            // EJECUTAR FUNCIÓN SOLICITADA
            //
            // Admite cualquier cantidad de argumentos.
            // Espera el resultado cuando la función
            // realiza una operación asíncrona.
            // ================================================
            const resultado =
                await funcion(...argumentos);
            // ================================================
            // NORMALIZAR RESULTADO DE EJECUCIÓN
            //
            // Respeta el indicador success cuando la
            // función devuelve un resultado estructurado.
            // ================================================
            return {
                success:
                    resultado?.success !== false,
                nombre,
                resultado
            };
        } catch (error) {
            // ================================================
            // CONTROLAR OPERACIONES CANCELADAS
            //
            // Una solicitud cancelada no se considera
            // un error general de funcionamiento.
            // ================================================
            if (error.name === 'AbortError') {
                return {
                    success: false,
                    nombre,
                    cancelada: true
                };
            }
            // ================================================
            // REGISTRAR ERROR EN CONSOLA
            //
            // Identifica el componente que presentó
            // dificultades durante su ejecución.
            // ================================================
            console.error(
                `[Transformín] ${nombre}:`,
                error
            );
            // ================================================
            // DEVOLVER RESULTADO DEL ERROR
            //
            // Conserva el objeto original del error
            // para facilitar su diagnóstico posterior.
            // ================================================
            return {
                success: false,
                nombre,
                error,
                mensaje:
                    error.message ||
                    'Error inesperado.'
            };
        }
    }
    // ========================================================
    // 218. EJECUTAR GRUPO DE CONSULTAS
    //
    // Ejecuta simultáneamente un conjunto de funciones
    // independientes mediante Promise.all.
    //
    // Cada función utiliza el controlador seguro definido
    // anteriormente, permitiendo gestionar individualmente
    // sus resultados y errores.
    //
    // Devuelve:
    //
    // - Estado general de ejecución.
    // - Resultados individuales.
    // - Errores identificados.
    // - Cantidad de funciones completadas.
    // - Total de funciones ejecutadas.
    // ========================================================
    async function ejecutarGrupoFinal(tareas = []) {
        // ====================================================
        // EJECUTAR TAREAS EN PARALELO
        //
        // Cada tarea contiene:
        //
        // nombre: identificación del componente.
        // funcion: referencia a la función ejecutable.
        // argumentos: parámetros opcionales.
        // ====================================================
        const resultados =
            await Promise.all(
                tareas.map(tarea =>
                    ejecutarFuncionFinal(
                        tarea.nombre,
                        tarea.funcion,
                        ...(tarea.argumentos || [])
                    )
                )
            );
        // ====================================================
        // IDENTIFICAR RESULTADOS CON ERRORES
        //
        // Excluye las operaciones canceladas del registro
        // general de errores.
        // ====================================================
        const errores = resultados.filter(
            resultado =>
                !resultado.success &&
                !resultado.cancelada
        );
        // ====================================================
        // CONSTRUIR RESULTADO GENERAL DEL GRUPO
        // ====================================================
        return {
            // Indica si existen errores no cancelados.
            success: errores.length === 0,
            // Resultados individuales de las funciones.
            resultados,
            // Funciones que presentaron errores.
            errores,
            // Cantidad de funciones completadas.
            completadas: resultados.filter(
                resultado => resultado.success
            ).length,
            // Cantidad total de funciones procesadas.
            total: resultados.length
        };
    }
    // ========================================================
    // 219. CONTROL GENERAL DE ERRORES
    //
    // Permite mostrar y ocultar la alerta general del módulo
    // cuando se presentan dificultades durante las consultas,
    // actualizaciones o inicialización del cronograma.
    // ========================================================
    function mostrarErrorGeneralCronograma(
        mensaje
    ) {
        // Mostrar mensaje recibido o mensaje predeterminado.
        texto(
            'mensajeErrorCronograma',
            mensaje ||
            'No fue posible actualizar toda la información.'
        );
        // Mostrar contenedor general de errores.
        visible(
            'alertaErrorCronograma',
            true
        );
    }
    // ========================================================
    // OCULTAR ALERTA GENERAL DE ERRORES
    //
    // Limpia el mensaje anterior y oculta la alerta.
    // No modifica los registros ni el estado de la base
    // de datos.
    // ========================================================
    function ocultarErrorGeneralCronograma() {
        // Ocultar contenedor de errores.
        visible(
            'alertaErrorCronograma',
            false
        );
        // Limpiar mensaje anterior.
        texto(
            'mensajeErrorCronograma',
            ''
        );
    }
    // ========================================================
    // 220. ACTUALIZAR ESTADO VISUAL DEL MÓDULO
    //
    // Actualiza el mensaje general de funcionamiento
    // del Cronograma de Transformín.
    //
    // Estados disponibles:
    //
    // correcto: funcionamiento satisfactorio.
    // error: dificultad durante una operación.
    // advertencia: funcionamiento con observaciones.
    // normal: estado informativo o pendiente.
    // ========================================================
    function actualizarEstadoModuloFinal(
        mensaje,
        tipo = 'normal'
    ) {
        // Actualizar mensaje del estado general.
        texto(
            'estadoModuloTexto',
            mensaje
        );
        // Localizar elemento correspondiente.
        const elemento =
            $('estadoModuloTexto');
        // Evitar errores cuando el elemento no existe.
        if (!elemento) return;
        // ====================================================
        // ELIMINAR ESTILOS DEL ESTADO ANTERIOR
        //
        // Evita conservar simultáneamente clases de colores
        // correspondientes a diferentes estados.
        // ====================================================
        elemento.classList.remove(
            'text-success',
            'text-danger',
            'text-warning',
            'text-muted'
        );
        // ====================================================
        // ASOCIAR ESTADOS CON CLASES VISUALES
        // ====================================================
        const clases = {
            correcto: 'text-success',
            error: 'text-danger',
            advertencia: 'text-warning',
            normal: 'text-muted'
        };
        // ====================================================
        // APLICAR ESTADO VISUAL CORRESPONDIENTE
        //
        // Utiliza el estado normal cuando el tipo recibido
        // no corresponde a un estado reconocido.
        // ====================================================
        elemento.classList.add(
            clases[tipo] ||
            clases.normal
        );
    }
    // ========================================================
    // 221. ESTADO VISUAL DE SERVICIOS
    //
    // Actualiza los indicadores visuales correspondientes
    // a los servicios del Cronograma de Transformín.
    //
    // Permite representar:
    //
    // - Servicios disponibles.
    // - Servicios con errores.
    // - Servicios con advertencias.
    // - Servicios pendientes de verificación.
    //
    // Conserva los iconos existentes y sincroniza el
    // atributo data-estado con las reglas del CSS.
    // ========================================================
    function pintarEstadoServicioFinal(
        id,
        mensaje,
        tipo = 'normal'
    ) {
        // Localizar indicador del servicio.
        const elemento = $(id);
        // Evitar errores cuando el indicador no existe.
        if (!elemento) return;
        // ====================================================
        // CONSERVAR ICONO ORIGINAL DEL SERVICIO
        //
        // Evita eliminar los iconos de Font Awesome cuando
        // se actualiza el mensaje del indicador.
        // ====================================================
        const icono =
            elemento.querySelector('i');
        if (icono) {
            elemento.replaceChildren(
                icono,
                document.createTextNode(
                    ` ${mensaje}`
                )
            );
        } else {
            elemento.textContent = mensaje;
        }
        // ====================================================
        // SINCRONIZAR ESTADO CON EL CSS
        //
        // Permite aplicar los estilos definidos mediante
        // selectores del atributo data-estado.
        // ====================================================
        elemento.dataset.estado = ({
            correcto: 'activo',
            error: 'error',
            advertencia: 'advertencia',
            normal: 'pendiente'
        })[tipo] || 'pendiente';
        // ====================================================
        // ELIMINAR CLASES VISUALES ANTERIORES
        //
        // Limpia colores de fondo y texto para impedir
        // conflictos entre diferentes estados del servicio.
        // ====================================================
        elemento.classList.remove(
            'bg-success',
            'bg-danger',
            'bg-warning',
            'bg-secondary',
            'text-dark',
            'text-white',
            'text-success',
            'text-danger',
            'text-warning',
            'text-muted'
        );
        // ====================================================
        // DEFINIR CLASES VISUALES POR ESTADO
        // ====================================================
        const clases = {
            // Servicio disponible.
            correcto: [
                'bg-success',
                'text-white'
            ],
            // Servicio con errores.
            error: [
                'bg-danger',
                'text-white'
            ],
            // Servicio con observaciones.
            advertencia: [
                'bg-warning',
                'text-dark'
            ],
            // Servicio pendiente de verificación.
            normal: [
                'bg-secondary',
                'text-white'
            ]
        };
        // ====================================================
        // APLICAR CLASES DEL ESTADO ACTUAL
        //
        // Utiliza el estado normal cuando el tipo recibido
        // no está definido en las clases disponibles.
        // ====================================================
        elemento.classList.add(
            ...(clases[tipo] || clases.normal)
        );
    }
    // ========================================================
    // 222. ACTUALIZAR FECHA Y HORA INSTITUCIONAL
    //
    // Obtiene la fecha y hora actuales utilizando la zona
    // horaria institucional America/Bogota.
    //
    // Mantiene la presentación en español de Colombia
    // independientemente de la zona horaria configurada
    // en el navegador del usuario.
    //
    // Actualiza:
    //
    // - Fecha general.
    // - Fecha del cronograma.
    // - Hora actual.
    // - Hora institucional.
    // - Año del pie de página.
    // ========================================================
    function actualizarFechaInstitucionalFinal() {
        // Obtener fecha y hora actuales.
        const fecha = new Date();
        // ====================================================
        // FORMATEAR FECHA INSTITUCIONAL
        //
        // Ejemplo:
        // miércoles, 25 de noviembre de 2026.
        // ====================================================
        const fechaCompleta =
            new Intl.DateTimeFormat(
                'es-CO',
                {
                    timeZone:
                        CONFIG_INICIALIZACION.zonaHoraria,
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                }
            ).format(fecha);
        // ====================================================
        // FORMATEAR HORA INSTITUCIONAL
        //
        // Utiliza el formato de doce horas con indicación
        // de mañana o tarde.
        // ====================================================
        const horaCompleta =
            new Intl.DateTimeFormat(
                'es-CO',
                {
                    timeZone:
                        CONFIG_INICIALIZACION.zonaHoraria,
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true
                }
            ).format(fecha);
        // ====================================================
        // NORMALIZAR PRESENTACIÓN DE LA FECHA
        //
        // Convierte la primera letra del día de la semana
        // en mayúscula para mejorar su presentación.
        // ====================================================
        const fechaFormateada =
            fechaCompleta.charAt(0).toUpperCase() +
            fechaCompleta.slice(1);
        // ====================================================
        // ACTUALIZAR CONTENEDORES DE FECHA
        //
        // Mantiene compatibilidad con los diferentes
        // identificadores existentes en la interfaz.
        // ====================================================
        [
            'fechaActual',
            'fechaActualCronograma',
            'fechaCronograma'
        ].forEach(id => {
            texto(
                id,
                fechaFormateada
            );
        });
        // ====================================================
        // ACTUALIZAR CONTENEDORES DE HORA
        // ====================================================
        [
            'horaActual',
            'horaActualCronograma'
        ].forEach(id => {
            texto(
                id,
                horaCompleta
            );
        });
        // ====================================================
        // ACTUALIZAR AÑO DEL PIE DE PÁGINA
        //
        // Utiliza el año actual de Colombia.
        // No depende del periodo seleccionado en el
        // cronograma institucional.
        // ====================================================
        texto(
            'anioFooter',
            Number(hoy().substring(0, 4))
        );
        // ====================================================
        // ACTUALIZIZAR FUNCIONES DE FECHA EXISTENTES
        //
        // Conserva la compatibilidad con la función
        // definida anteriormente en el módulo.
        //
        // Comprueba su disponibilidad antes de ejecutarla.
        // ====================================================
        if (
            typeof actualizarFechaInterfaz ===
            'function'
        ) {
            actualizarFechaInterfaz();
        }
    }
    // ========================================================
    // 223. OBTENER AÑO ACTUAL DE COLOMBIA
    //
    // Obtiene el año actual utilizando la zona horaria
    // institucional America/Bogota.
    //
    // Evita diferencias ocasionadas por la configuración
    // regional del navegador o del equipo del usuario.
    // ========================================================
    function obtenerAnioInstitucionalActual() {
        return Number(
            new Intl.DateTimeFormat(
                'en',
                {
                    timeZone:
                        CONFIG_INICIALIZACION.zonaHoraria,
                    year: 'numeric'
                }
            ).format(new Date())
        );
    }
    // ========================================================
    // 224. VALIDAR PERIODO ANUAL
    //
    // Comprueba que el periodo seleccionado sea un número
    // entero y se encuentre dentro de los límites definidos
    // en la configuración general del cronograma.
    //
    // Año mínimo: 1900.
    // Año máximo: 9999.
    //
    // Esta validación permite trabajar con años posteriores
    // sin modificar manualmente el código cada año.
    // ========================================================
    function validarPeriodoFinal(valor) {
        // Convertir el valor recibido en número.
        const anio = Number(valor);
        // Validar formato y límites permitidos.
        if (
            !Number.isInteger(anio) ||
            anio <
                CONFIG_INICIALIZACION.anioMinimo ||
            anio >
                CONFIG_INICIALIZACION.anioMaximo
        ) {
            throw new Error(
                'Selecciona un periodo anual válido.'
            );
        }
        // Devolver año validado.
        return anio;
    }
    // ========================================================
    // 225. PREPARAR SELECTOR PRINCIPAL DE AÑO
    //
    // Genera dinámicamente las opciones del selector
    // principal del Cronograma de Transformín.
    //
    // Conserva el periodo activo cuando es válido.
    //
    // Incluye los años comprendidos entre el periodo
    // mínimo permitido y cinco años posteriores al actual.
    //
    // Si el periodo seleccionado supera ese intervalo,
    // amplía las opciones hasta incluirlo.
    // ========================================================
    function prepararSelectorPrincipalFinal() {
        // Localizar selector principal de año.
        const selector = $('selectorAnio');
        // Obtener año actual de Colombia.
        const actual =
            obtenerAnioInstitucionalActual();
        // Variable correspondiente al periodo seleccionado.
        let seleccionado;
        // ====================================================
        // VALIDAR PERIODO ACTIVO
        //
        // Prioriza el año almacenado en el estado general.
        // Si no existe, utiliza el año actual.
        // ====================================================
        try {
            seleccionado =
                validarPeriodoFinal(
                    estado.anio || actual
                );
        } catch {
            // Recuperar un periodo válido cuando el valor
            // almacenado no cumple las condiciones.
            seleccionado = Math.max(
                actual,
                CONFIG_INICIALIZACION.anioMinimo
            );
        }
        // ====================================================
        // ACTUALIZAR ESTADO GENERAL
        // ====================================================
        estado.anio = seleccionado;
        // Evitar errores si el selector no existe.
        if (!selector) return;
        // ====================================================
        // GENERAR OPCIONES DEL SELECTOR
        //
        // Solo genera elementos option cuando el control
        // corresponde a un elemento SELECT.
        // ====================================================
        if (selector.tagName === 'SELECT') {
            // Contenedor de opciones disponibles.
            const opciones = [];
            // ================================================
            // CALCULAR ÚLTIMO AÑO DISPONIBLE
            //
            // Incluye todos los años permitidos.
            // Conserva periodos seleccionados más amplios
            // sin superar el límite máximo configurado.
            // ================================================
            const limite = Math.min(
                CONFIG_INICIALIZACION.anioMaximo,
                Math.max(
                    CONFIG.ANIO_MAXIMO,
                    seleccionado
                )
            );
            // ================================================
            // GENERAR PERIODOS ANUALES
            // ================================================
            for (
                let anio =
                    CONFIG_INICIALIZACION.anioMinimo;
                anio <= limite;
                anio++
            ) {
                opciones.push(`
                    <option value="${anio}">
                        ${anio}
                    </option>
                `);
            }
            // Incorporar opciones al selector principal.
            selector.innerHTML =
                opciones.join('');
        }
        // ====================================================
        // ESTABLECER PERIODO SELECCIONADO
        //
        // Compatible con elementos SELECT e INPUT.
        // ====================================================
        selector.value =
            String(seleccionado);
    }
    // ========================================================
    // 226. SINCRONIZAR AÑO EN TODA LA INTERFAZ
    //
    // Mantiene actualizado el periodo activo en los
    // componentes principales del Cronograma de Transformín.
    //
    // Sincroniza:
    //
    // - Selector principal de año.
    // - Seguimiento institucional.
    // - Formato institucional FT-SST-147.
    // - Formulario de edición institucional.
    // - Selectores del módulo documental.
    //
    // Admite elementos INPUT, SELECT y contenedores de texto.
    // ========================================================
    function sincronizarPeriodoGeneral() {
        // ====================================================
        // VALIDAR PERIODO ACTIVO
        // ====================================================
        const anio =
            validarPeriodoFinal(
                estado.anio
            );
        // ====================================================
        // ACTUALIZAR SELECTOR PRINCIPAL
        // ====================================================
        setCampo(
            'selectorAnio',
            anio
        );
        // ====================================================
        // SINCRONIZAR COMPONENTES INSTITUCIONALES
        //
        // Actualiza el año de los componentes que utilizan
        // el periodo general del cronograma.
        // ====================================================
        [
            'anioSeguimiento',
            'anioFormatoInstitucional',
            'institucionalAnioEdicion'
        ].forEach(id => {
            // Localizar elemento correspondiente.
            const elemento = $(id);
            // Ignorar elementos que no estén disponibles.
            if (!elemento) return;
            // ================================================
            // ACTUALIZAR CAMPOS DE FORMULARIO
            //
            // Los elementos INPUT y SELECT utilizan
            // la propiedad value.
            // ================================================
            if (
                ['INPUT', 'SELECT'].includes(
                    elemento.tagName
                )
            ) {
                elemento.value = String(anio);
            } else {
                // ============================================
                // ACTUALIZAR CONTENEDORES INFORMATIVOS
                //
                // Los demás elementos utilizan textContent
                // para representar el periodo seleccionado.
                // ============================================
                elemento.textContent =
                    String(anio);
            }
        });
        // ====================================================
        // SINCRONIZAR MÓDULO DOCUMENTAL
        //
        // Utiliza la función definida en la sección 211.
        //
        // Mantiene coordinados los periodos de importación,
        // exportación e historial documental, respetando
        // las condiciones de protección de operaciones.
        // ====================================================
        sincronizarAnioDocumental();
    }
    // ========================================================
    // 227. COMPROBAR FORMULARIOS ABIERTOS
    //
    // Detecta si existe una ventana modal abierta o
    // en proceso de apertura dentro de la interfaz.
    //
    // Esta función permite que otras operaciones comprueben
    // si el usuario está utilizando un formulario antes de
    // realizar actualizaciones o cambios generales.
    //
    // Devuelve:
    //
    // true: existe una ventana modal abierta.
    // false: no se encontraron ventanas modales abiertas.
    // ========================================================
    function existeFormularioAbiertoFinal() {
        return Boolean(
            document.querySelector(
                '.modal.show, .modal.showing'
            )
        );
    }
    // ========================================================
    // 228. COMPROBAR OPERACIONES EN CURSO
    //
    // Detecta si existen operaciones activas dentro del módulo.
    // Permite evitar actualizaciones automáticas o cambios de
    // periodo mientras se está procesando información.
    // ========================================================
    function existenOperacionesPendientesFinal() {
        return Boolean(
            // Inicialización general del cronograma.
            estado.inicializando ||
            // Actualización general de información.
            estado.actualizandoGeneral ||
            // Cambio del periodo anual.
            estado.cambiandoAnio ||
            // Importación de documentos institucionales.
            estado.importandoExcel ||
            // Validación de documentos Excel.
            estado.validandoExcel ||
            // Exportación del formato FT-SST-147.
            estado.exportandoExcel ||
            // Creación o modificación de actividades.
            estado.guardandoActividad ||
            // Guardado de configuración general.
            estado.guardandoConfiguracion ||
            // Configuración individual de cumpleaños.
            estado.guardandoCumpleanos ||
            // Actualización de actividades institucionales.
            estado.guardandoInstitucional ||
            // Guardado de programaciones semanales.
            estado.guardandoProgramacion ||
            // Eliminación de actividades.
            estado.eliminandoActividad
        );
    }
    // ========================================================
    // 229. DIAGNÓSTICO DEL SERVIDOR
    //
    // Consulta el endpoint de diagnóstico del Cronograma
    // de Transformín para obtener información general
    // sobre la disponibilidad del backend.
    //
    // Incluye:
    //
    // - Conservación de la sesión del ERP.
    // - Control de tiempo máximo de respuesta.
    // - Validación de permisos.
    // - Validación del formato JSON.
    // - Control de respuestas HTTP.
    // - Almacenamiento del resultado del diagnóstico.
    // - Liberación del temporizador.
    // ========================================================
    async function consultarDiagnosticoFinal() {
        // ====================================================
        // CREAR CONTROLADOR DE CANCELACIÓN
        //
        // Permite cancelar la consulta cuando el servidor
        // supera el tiempo máximo establecido.
        // ====================================================
        const controlador =
            new AbortController();
        // ====================================================
        // CONFIGURAR TIEMPO MÁXIMO DE RESPUESTA
        //
        // Utiliza el tiempo establecido en la configuración
        // general de inicialización.
        // ====================================================
        const temporizador =
            window.setTimeout(
                () => controlador.abort(),
                CONFIG_INICIALIZACION.tiempoDiagnostico
            );
        try {
            // ================================================
            // CONSULTAR ENDPOINT DE DIAGNÓSTICO
            //
            // Ruta:
            // /cronograma-transformin/api/diagnostico
            //
            // Conserva las credenciales de la sesión actual
            // y evita utilizar respuestas almacenadas en caché.
            // ================================================
            const respuesta = await fetch(
                `${API}/diagnostico`,
                {
                    method: 'GET',
                    credentials: 'same-origin',
                    cache: 'no-store',
                    headers: {
                        Accept: 'application/json'
                    },
                    signal: controlador.signal
                }
            );
            // ================================================
            // OBTENER TIPO DE CONTENIDO DE LA RESPUESTA
            // ================================================
            const tipo =
                respuesta.headers.get(
                    'content-type'
                ) || '';
            // ================================================
            // VALIDAR SESIÓN Y PERMISOS
            //
            // HTTP 401: sesión no autorizada.
            // HTTP 403: acceso denegado.
            //
            // Una redirección también se considera una
            // respuesta no válida para este diagnóstico.
            // ================================================
            if (
                respuesta.status === 401 ||
                respuesta.status === 403 ||
                respuesta.redirected
            ) {
                throw new Error(
                    'La sesión no está disponible o no cuenta con los permisos necesarios.'
                );
            }
            // ================================================
            // VALIDAR FORMATO DE RESPUESTA
            //
            // Impide procesar documentos HTML u otros
            // contenidos como si fueran respuestas JSON.
            // ================================================
            if (
                !tipo.includes(
                    'application/json'
                )
            ) {
                throw new Error(
                    'El diagnóstico devolvió una respuesta no válida.'
                );
            }
            // ================================================
            // PROCESAR RESPUESTA DEL SERVIDOR
            // ================================================
            const datos =
                await respuesta.json();
            // ================================================
            // ALMACENAR RESULTADO DEL DIAGNÓSTICO
            //
            // Permite consultar posteriormente el resultado
            // desde otros componentes del cronograma.
            // ================================================
            estado.diagnosticoERP = datos;
            // ================================================
            // CONTROLAR DIAGNÓSTICO CON OBSERVACIONES
            //
            // El servidor puede estar disponible y responder
            // correctamente a nivel de conexión, aunque
            // alguno de sus servicios presente dificultades.
            //
            // Por esta razón se diferencia entre:
            //
            // success: resultado del diagnóstico.
            // disponible: existencia de una respuesta válida.
            // ================================================
            if (
                !respuesta.ok ||
                datos.success === false
            ) {
                return {
                    ...datos,
                    success: false,
                    disponible: true
                };
            }
            // ================================================
            // DEVOLVER DIAGNÓSTICO SATISFACTORIO
            //
            // Conserva las propiedades entregadas por el
            // backend y normaliza el resultado general.
            // ================================================
            return {
                ...datos,
                success: true,
                disponible: true
            };
        } catch (error) {
            // ================================================
            // CONTROLAR TIEMPO DE ESPERA AGOTADO
            //
            // Convierte la cancelación por tiempo máximo
            // en un mensaje comprensible para el usuario.
            // ================================================
            if (error.name === 'AbortError') {
                throw new Error(
                    'El servidor tardó demasiado en responder.'
                );
            }
            // ================================================
            // PROPAGAR OTROS ERRORES
            //
            // Permite que el controlador general determine
            // cómo representar el error en la interfaz.
            // ================================================
            throw error;
        } finally {
            // ================================================
            // LIBERAR TEMPORIZADOR
            //
            // Se ejecuta independientemente del resultado
            // de la consulta para evitar temporizadores
            // innecesarios.
            // ================================================
            window.clearTimeout(
                temporizador
            );
        }
    }
    // ========================================================
    // 230. NORMALIZAR ESTADO DE SERVICIOS
    //
    // Interpreta los diferentes formatos utilizados por
    // el backend para representar el estado de un servicio.
    //
    // Resultados posibles:
    //
    // true: servicio disponible o activo.
    // false: servicio no disponible o inactivo.
    // null: estado desconocido o sin verificar.
    //
    // Admite valores booleanos, numéricos, cadenas de texto
    // y objetos con propiedades de disponibilidad.
    // ========================================================
    function interpretarEstadoServicioFinal(
        servicio
    ) {
        // ====================================================
        // INTERPRETAR VALORES POSITIVOS DIRECTOS
        // ====================================================
        if (
            servicio === true ||
            servicio === 1
        ) {
            return true;
        }
        // ====================================================
        // INTERPRETAR VALORES NEGATIVOS DIRECTOS
        // ====================================================
        if (
            servicio === false ||
            servicio === 0
        ) {
            return false;
        }
        // ====================================================
        // INTERPRETAR OBJETOS DE ESTADO
        //
        // Permite trabajar con diferentes estructuras
        // entregadas por los servicios del backend.
        //
        // Ejemplos:
        //
        // { disponible: true }
        // { operativo: true }
        // { success: false }
        // { correcto: true }
        // { activo: false }
        // ====================================================
        if (
            servicio &&
            typeof servicio === 'object'
        ) {
            // Recuperar propiedad de estado disponible.
            const valor =
                servicio.disponible ??
                servicio.operativo ??
                servicio.success ??
                servicio.correcto ??
                servicio.activo;
            // ================================================
            // NORMALIZIZAR VALOR INTERNO
            //
            // Utiliza nuevamente esta función para
            // interpretar el valor de la propiedad.
            // ================================================
            if (valor !== undefined) {
                return interpretarEstadoServicioFinal(
                    valor
                );
            }
            // El objeto no contiene un estado reconocido.
            return null;
        }
        // ====================================================
        // NORMALIZAR VALORES DE TEXTO
        //
        // Convierte el contenido a mayúsculas para permitir
        // comparaciones independientes de su escritura.
        // ====================================================
        const valor = String(
            servicio ?? ''
        ).toUpperCase();
        // ====================================================
        // IDENTIFICAR ESTADOS POSITIVOS
        //
        // Reconoce diferentes representaciones utilizadas
        // para indicar que un servicio está disponible.
        // ====================================================
        if (
            [
                'OK',
                'TRUE',
                '1',
                'SI',
                'ACTIVO',
                'DISPONIBLE',
                'OPERATIVO',
                'CONECTADO'
            ].includes(valor)
        ) {
            return true;
        }
        // ====================================================
        // IDENTIFICAR ESTADOS NEGATIVOS
        //
        // Reconoce diferentes representaciones utilizadas
        // para indicar que un servicio está desactivado
        // o presenta dificultades.
        // ====================================================
        if (
            [
                'FALSE',
                '0',
                'NO',
                'ERROR',
                'INACTIVO',
                'DESCONECTADO',
                'NO_DISPONIBLE'
            ].includes(valor)
        ) {
            return false;
        }
        // ====================================================
        // ESTADO DESCONOCIDO
        //
        // No se considera activo ni inactivo un servicio
        // cuyo estado no puede determinarse.
        //
        // Permite representarlo posteriormente como
        // pendiente de verificación.
        // ====================================================
        return null;
    }
    // ========================================================
    // 228. COMPROBAR OPERACIONES EN CURSO
    //
    // Detecta si existen operaciones activas dentro del módulo.
    // Permite evitar actualizaciones automáticas o cambios de
    // periodo mientras se está procesando información.
    // ========================================================
    function existenOperacionesPendientesFinal() {
        return Boolean(
            // Inicialización general del cronograma.
            estado.inicializando ||
            // Actualización general de información.
            estado.actualizandoGeneral ||
            // Cambio del periodo anual.
            estado.cambiandoAnio ||
            // Importación de documentos institucionales.
            estado.importandoExcel ||
            // Validación de documentos Excel.
            estado.validandoExcel ||
            // Exportación del formato FT-SST-147.
            estado.exportandoExcel ||
            // Creación o modificación de actividades.
            estado.guardandoActividad ||
            // Guardado de configuración general.
            estado.guardandoConfiguracion ||
            // Configuración individual de cumpleaños.
            estado.guardandoCumpleanos ||
            // Actualización de actividades institucionales.
            estado.guardandoInstitucional ||
            // Guardado de programaciones semanales.
            estado.guardandoProgramacion ||
            // Eliminación de actividades.
            estado.eliminandoActividad
        );
    }
    // ========================================================
    // 229. DIAGNÓSTICO DEL SERVIDOR
    //
    // Consulta el endpoint de diagnóstico del Cronograma
    // de Transformín para obtener información general
    // sobre la disponibilidad del backend.
    //
    // Incluye:
    //
    // - Conservación de la sesión del ERP.
    // - Control de tiempo máximo de respuesta.
    // - Validación de permisos.
    // - Validación del formato JSON.
    // - Control de respuestas HTTP.
    // - Almacenamiento del resultado del diagnóstico.
    // - Liberación del temporizador.
    // ========================================================
    async function consultarDiagnosticoFinal() {
        // ====================================================
        // CREAR CONTROLADOR DE CANCELACIÓN
        //
        // Permite cancelar la consulta cuando el servidor
        // supera el tiempo máximo establecido.
        // ====================================================
        const controlador =
            new AbortController();
        // ====================================================
        // CONFIGURAR TIEMPO MÁXIMO DE RESPUESTA
        //
        // Utiliza el tiempo establecido en la configuración
        // general de inicialización.
        // ====================================================
        const temporizador =
            window.setTimeout(
                () => controlador.abort(),
                CONFIG_INICIALIZACION.tiempoDiagnostico
            );
        try {
            // ================================================
            // CONSULTAR ENDPOINT DE DIAGNÓSTICO
            //
            // Ruta:
            // /cronograma-transformin/api/diagnostico
            //
            // Conserva las credenciales de la sesión actual
            // y evita utilizar respuestas almacenadas en caché.
            // ================================================
            const respuesta = await fetch(
                `${API}/diagnostico`,
                {
                    method: 'GET',
                    credentials: 'same-origin',
                    cache: 'no-store',
                    headers: {
                        Accept: 'application/json'
                    },
                    signal: controlador.signal
                }
            );
            // ================================================
            // OBTENER TIPO DE CONTENIDO DE LA RESPUESTA
            // ================================================
            const tipo =
                respuesta.headers.get(
                    'content-type'
                ) || '';
            // ================================================
            // VALIDAR SESIÓN Y PERMISOS
            //
            // HTTP 401: sesión no autorizada.
            // HTTP 403: acceso denegado.
            //
            // Una redirección también se considera una
            // respuesta no válida para este diagnóstico.
            // ================================================
            if (
                respuesta.status === 401 ||
                respuesta.status === 403 ||
                respuesta.redirected
            ) {
                throw new Error(
                    'La sesión no está disponible o no cuenta con los permisos necesarios.'
                );
            }
            // ================================================
            // VALIDAR FORMATO DE RESPUESTA
            //
            // Impide procesar documentos HTML u otros
            // contenidos como si fueran respuestas JSON.
            // ================================================
            if (
                !tipo.includes(
                    'application/json'
                )
            ) {
                throw new Error(
                    'El diagnóstico devolvió una respuesta no válida.'
                );
            }
            // ================================================
            // PROCESAR RESPUESTA DEL SERVIDOR
            // ================================================
            const datos =
                await respuesta.json();
            // ================================================
            // ALMACENAR RESULTADO DEL DIAGNÓSTICO
            //
            // Permite consultar posteriormente el resultado
            // desde otros componentes del cronograma.
            // ================================================
            estado.diagnosticoERP = datos;
            // ================================================
            // CONTROLAR DIAGNÓSTICO CON OBSERVACIONES
            //
            // El servidor puede estar disponible y responder
            // correctamente a nivel de conexión, aunque
            // alguno de sus servicios presente dificultades.
            //
            // Por esta razón se diferencia entre:
            //
            // success: resultado del diagnóstico.
            // disponible: existencia de una respuesta válida.
            // ================================================
            if (
                !respuesta.ok ||
                datos.success === false
            ) {
                return {
                    ...datos,
                    success: false,
                    disponible: true
                };
            }
            // ================================================
            // DEVOLVER DIAGNÓSTICO SATISFACTORIO
            //
            // Conserva las propiedades entregadas por el
            // backend y normaliza el resultado general.
            // ================================================
            return {
                ...datos,
                success: true,
                disponible: true
            };
        } catch (error) {
            // ================================================
            // CONTROLAR TIEMPO DE ESPERA AGOTADO
            //
            // Convierte la cancelación por tiempo máximo
            // en un mensaje comprensible para el usuario.
            // ================================================
            if (error.name === 'AbortError') {
                throw new Error(
                    'El servidor tardó demasiado en responder.'
                );
            }
            // ================================================
            // PROPAGAR OTROS ERRORES
            //
            // Permite que el controlador general determine
            // cómo representar el error en la interfaz.
            // ================================================
            throw error;
        } finally {
            // ================================================
            // LIBERAR TEMPORIZADOR
            //
            // Se ejecuta independientemente del resultado
            // de la consulta para evitar temporizadores
            // innecesarios.
            // ================================================
            window.clearTimeout(
                temporizador
            );
        }
    }
    // ========================================================
    // 230. NORMALIZAR ESTADO DE SERVICIOS
    //
    // Interpreta los diferentes formatos utilizados por
    // el backend para representar el estado de un servicio.
    //
    // Resultados posibles:
    //
    // true: servicio disponible o activo.
    // false: servicio no disponible o inactivo.
    // null: estado desconocido o sin verificar.
    //
    // Admite valores booleanos, numéricos, cadenas de texto
    // y objetos con propiedades de disponibilidad.
    // ========================================================
    function interpretarEstadoServicioFinal(
        servicio
    ) {
        // ====================================================
        // INTERPRETAR VALORES POSITIVOS DIRECTOS
        // ====================================================
        if (
            servicio === true ||
            servicio === 1
        ) {
            return true;
        }
        // ====================================================
        // INTERPRETAR VALORES NEGATIVOS DIRECTOS
        // ====================================================
        if (
            servicio === false ||
            servicio === 0
        ) {
            return false;
        }
        // ====================================================
        // INTERPRETAR OBJETOS DE ESTADO
        //
        // Permite trabajar con diferentes estructuras
        // entregadas por los servicios del backend.
        //
        // Ejemplos:
        //
        // { disponible: true }
        // { operativo: true }
        // { success: false }
        // { correcto: true }
        // { activo: false }
        // ====================================================
        if (
            servicio &&
            typeof servicio === 'object'
        ) {
            // Recuperar propiedad de estado disponible.
            const valor =
                servicio.disponible ??
                servicio.operativo ??
                servicio.success ??
                servicio.correcto ??
                servicio.activo;
            // ================================================
            // NORMALIZIZAR VALOR INTERNO
            //
            // Utiliza nuevamente esta función para
            // interpretar el valor de la propiedad.
            // ================================================
            if (valor !== undefined) {
                return interpretarEstadoServicioFinal(
                    valor
                );
            }
            // El objeto no contiene un estado reconocido.
            return null;
        }
        // ====================================================
        // NORMALIZAR VALORES DE TEXTO
        //
        // Convierte el contenido a mayúsculas para permitir
        // comparaciones independientes de su escritura.
        // ====================================================
        const valor = String(
            servicio ?? ''
        ).toUpperCase();
        // ====================================================
        // IDENTIFICAR ESTADOS POSITIVOS
        //
        // Reconoce diferentes representaciones utilizadas
        // para indicar que un servicio está disponible.
        // ====================================================
        if (
            [
                'OK',
                'TRUE',
                '1',
                'SI',
                'ACTIVO',
                'DISPONIBLE',
                'OPERATIVO',
                'CONECTADO'
            ].includes(valor)
        ) {
            return true;
        }
        // ====================================================
        // IDENTIFICAR ESTADOS NEGATIVOS
        //
        // Reconoce diferentes representaciones utilizadas
        // para indicar que un servicio está desactivado
        // o presenta dificultades.
        // ====================================================
        if (
            [
                'FALSE',
                '0',
                'NO',
                'ERROR',
                'INACTIVO',
                'DESCONECTADO',
                'NO_DISPONIBLE'
            ].includes(valor)
        ) {
            return false;
        }
        // ====================================================
        // ESTADO DESCONOCIDO
        //
        // No se considera activo ni inactivo un servicio
        // cuyo estado no puede determinarse.
        //
        // Permite representarlo posteriormente como
        // pendiente de verificación.
        // ====================================================
        return null;
    }
    // ========================================================
    // 231. PINTAR RESULTADO DE DIAGNÓSTICO
    //
    // Representa visualmente el estado de los servicios
    // consultados mediante el diagnóstico del servidor.
    //
    // Servicios:
    // - Conexión general con el ERP.
    // - Procesamiento de documentos Excel.
    // - Integración con Recursos Humanos.
    // - Servicio de correo electrónico SMTP.
    // ========================================================
    function pintarDiagnosticoFinal(datos = {}) {
        // Recuperar servicios informados por el backend.
        const servicios =
            datos.servicios || {};
        // ====================================================
        // NORMALIZAR DISPONIBILIDAD DEL SERVICIO EXCEL
        //
        // Admite diferentes propiedades de respuesta
        // relacionadas con el procesamiento documental.
        // ====================================================
        const excel =
            interpretarEstadoServicioFinal(
                servicios.excel ??
                servicios.cronogramaExcel ??
                datos.excel
            );
        // ====================================================
        // NORMALIZAR INTEGRACIÓN CON RECURSOS HUMANOS
        //
        // Comprueba la disponibilidad del servicio utilizado
        // para consultar colaboradores y cumpleaños.
        // ====================================================
        const recursosHumanos =
            interpretarEstadoServicioFinal(
                servicios.recursosHumanos ??
                servicios.rh ??
                servicios.cumpleanos ??
                datos.cumpleanos
            );
        // ====================================================
        // ACTUALIZAR ESTADO DE CONEXIÓN CON EL ERP
        // ====================================================
        pintarEstadoServicioFinal(
            'estadoConexionERP',
            datos.success
                ? 'Conectado'
                : 'Requiere revisión',
            datos.success
                ? 'correcto'
                : 'advertencia'
        );
        // ====================================================
        // ACTUALIZAR ESTADO DEL SERVICIO EXCEL
        //
        // Disponible: servicio confirmado.
        // No disponible: servicio con dificultades.
        // Sin verificar: estado desconocido.
        // ====================================================
        pintarEstadoServicioFinal(
            'estadoServicioExcel',
            excel === true
                ? 'Disponible'
                : excel === false
                    ? 'No disponible'
                    : 'Sin verificar',
            excel === true
                ? 'correcto'
                : excel === false
                    ? 'error'
                    : 'normal'
        );
        // ====================================================
        // ACTUALIZAR ESTADO DE RECURSOS HUMANOS
        //
        // Representa la disponibilidad de la integración
        // utilizada por el módulo de cumpleaños.
        // ====================================================
        pintarEstadoServicioFinal(
            'estadoServicioRH',
            recursosHumanos === true
                ? 'Integrado'
                : recursosHumanos === false
                    ? 'No disponible'
                    : 'Sin verificar',
            recursosHumanos === true
                ? 'correcto'
                : recursosHumanos === false
                    ? 'error'
                    : 'normal'
        );
        // ====================================================
        // NORMALIZAR ESTADO DEL SERVICIO SMTP
        //
        // La disponibilidad de Nodemailer no demuestra
        // que exista una conexión SMTP operativa.
        //
        // El estado debe proceder de una verificación
        // efectiva informada por el backend.
        // ====================================================
        const smtp =
            interpretarEstadoServicioFinal(
                datos.smtpVerificado ??
                servicios.smtp?.verificado
            );
        // ====================================================
        // ACTUALIZAR ESTADO VISUAL DEL CORREO ELECTRÓNICO
        //
        // Verificado: conexión SMTP confirmada.
        // Requiere revisión: verificación no satisfactoria.
        // Sin verificar: todavía no existe confirmación.
        // ====================================================
        pintarEstadoServicioFinal(
            'estadoServicioCorreo',
            smtp === true
                ? 'Verificado'
                : smtp === false
                    ? 'Requiere revisión'
                    : 'Sin verificar',
            smtp === true
                ? 'correcto'
                : smtp === false
                    ? 'advertencia'
                    : 'normal'
        );
    }
    // ========================================================
    // 232. VERIFICAR ESTADO GENERAL DEL ERP
    //
    // Ejecuta el diagnóstico general del servidor y actualiza
    // los indicadores visuales correspondientes.
    //
    // Cuando la consulta falla, representa la conexión como
    // no disponible y los demás servicios como pendientes
    // de verificación.
    // ========================================================
    async function verificarEstadoERPFinal() {
        try {
            // ================================================
            // CONSULTAR DIAGNÓSTICO DEL SERVIDOR
            // ================================================
            const datos =
                await consultarDiagnosticoFinal();
            // Actualizar indicadores visuales.
            pintarDiagnosticoFinal(datos);
            // Devolver información recibida.
            return datos;
        } catch (error) {
            // ================================================
            // REPRESENTAR ERROR DE CONEXIÓN
            // ================================================
            pintarEstadoServicioFinal(
                'estadoConexionERP',
                'Sin conexión',
                'error'
            );
            // ================================================
            // RESTABLECER ESTADOS DE SERVICIOS
            //
            // Si el diagnóstico no está disponible,
            // no se puede confirmar el estado individual
            // de los demás servicios.
            // ================================================
            [
                'estadoServicioExcel',
                'estadoServicioRH',
                'estadoServicioCorreo'
            ].forEach(id => {
                pintarEstadoServicioFinal(
                    id,
                    'Sin verificar',
                    'normal'
                );
            });
            // Propagar error al controlador general.
            throw error;
        }
    }
    // ========================================================
    // 233. REGISTRAR ÚLTIMA ACTUALIZACIÓN
    //
    // Almacena la fecha y hora en la que se ejecuta
    // el registro de actualización del cronograma.
    //
    // Utiliza la zona horaria institucional America/Bogota
    // y el formato regional español de Colombia.
    // ========================================================
    function registrarActualizacionFinal() {
        // Registrar fecha y hora en el estado general.
        estado.ultimaActualizacion =
            new Date();
        // ====================================================
        // FORMATEAR FECHA Y HORA DE ACTUALIZACIÓN
        //
        // Incluye día, mes, año, hora, minutos y segundos.
        // ====================================================
        const fecha =
            new Intl.DateTimeFormat(
                'es-CO',
                {
                    timeZone:
                        CONFIG_INICIALIZACION.zonaHoraria,
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit'
                }
            ).format(
                estado.ultimaActualizacion
            );
        // ====================================================
        // ACTUALIZAR CONTENEDORES DE LA INTERFAZ
        //
        // Mantiene la compatibilidad con los identificadores
        // utilizados para mostrar la última actualización.
        // ====================================================
        [
            'ultimaActualizacion',
            'ultimaActualizacionCronograma',
            'fechaActualizacion'
        ].forEach(id => {
            texto(
                id,
                fecha
            );
        });
    }
    // ========================================================
    // 234. ACTUALIZAR INFORMACIÓN INSTITUCIONAL
    //
    // Consulta las actividades institucionales del periodo
    // activo mediante el controlador seguro de funciones.
    //
    // Conserva la lógica existente del formato FT-SST-147
    // y permite informar si la consulta fue satisfactoria.
    // ========================================================
    async function actualizarInstitucionalFinal() {
        // ====================================================
        // EJECUTAR CONSULTA INSTITUCIONAL
        //
        // Comprueba que la función cargarInstitucional
        // esté disponible antes de solicitar su ejecución.
        // ====================================================
        const resultado =
            await ejecutarFuncionFinal(
                'Cronograma institucional',
                typeof cargarInstitucional === 'function'
                    ? cargarInstitucional
                    : null
            );
        // ====================================================
        // CONTROLAR CONSULTA NO SATISFACTORIA
        //
        // Actualiza el indicador institucional cuando
        // la información no pudo ser recuperada.
        // ====================================================
        if (!resultado.success) {
            texto(
                'estadoCronogramaInstitucional',
                'Información no disponible'
            );
            return resultado;
        }
        // ====================================================
        // CONFIRMAR ACTUALIZACIÓN INSTITUCIONAL
        // ====================================================
        texto(
            'estadoCronogramaInstitucional',
            'Información actualizada'
        );
        // Devolver resultado al controlador general.
        return resultado;
    }
    // ========================================================
    // 235. ACTUALIZAR CALENDARIO Y AGENDA
    //
    // Actualiza la representación visual del calendario
    // mensual y la agenda correspondiente al periodo activo.
    //
    // Comprueba la disponibilidad de las funciones antes
    // de ejecutarlas para evitar errores de referencia.
    // ========================================================
    function actualizarCalendarioFinal() {
        // ================================================
        // ACTUALIZAR CALENDARIO MENSUAL
        //
        // Representa las actividades disponibles en el
        // estado general del Cronograma de Transformín.
        // ================================================
        if (
            typeof pintarCalendario ===
            'function'
        ) {
            pintarCalendario();
        }
        // ================================================
        // ACTUALIZAR AGENDA
        //
        // Actualiza las actividades correspondientes
        // a la fecha seleccionada en el calendario.
        // ================================================
        if (
            typeof pintarAgenda ===
            'function'
        ) {
            pintarAgenda();
        }
    }
    // ========================================================
    // 236. CONSULTAS PRINCIPALES DEL PERIODO
    //
    // Ejecuta las consultas principales correspondientes
    // al año seleccionado en el Cronograma de Transformín.
    //
    // Componentes:
    //
    // 01. Actividades manuales.
    // 02. Cronograma institucional FT-SST-147.
    // 03. Indicadores generales.
    // 04. Cumplimiento anual.
    //
    // Comprueba que el periodo no haya cambiado durante
    // la ejecución de las consultas antes de actualizar
    // nuevamente el calendario y la agenda.
    // ========================================================
    async function cargarPeriodoGeneralFinal() {
        // ================================================
        // CONSERVAR VERSIÓN DEL PERIODO
        //
        // Permite identificar cambios de periodo realizados
        // mientras las consultas se encuentran en ejecución.
        // ================================================
        const version =
            estado.versionPeriodo;
        // ================================================
        // CONSERVAR AÑO DE LA CONSULTA
        //
        // Compatible con años anteriores y posteriores.
        // ================================================
        const anio =
            Number(estado.anio);
        // ================================================
        // EJECUTAR CONSULTAS PRINCIPALES EN PARALELO
        //
        // Utiliza el controlador seguro definido en la
        // sección 218 para gestionar los resultados
        // individuales de cada componente.
        // ================================================
        const resultado =
            await ejecutarGrupoFinal([
                // ========================================
                // CONSULTA 01: ACTIVIDADES MANUALES
                //
                // Recupera las actividades registradas
                // manualmente en el cronograma.
                // ========================================
                {
                    nombre: 'Actividades manuales',
                    funcion:
                        typeof cargarActividades === 'function'
                            ? cargarActividades
                            : null
                },
                // ========================================
                // CONSULTA 02: CRONOGRAMA INSTITUCIONAL
                //
                // Recupera las actividades correspondientes
                // al formato institucional FT-SST-147.
                // ========================================
                {
                    nombre: 'Cronograma institucional',
                    funcion:
                        typeof cargarInstitucional === 'function'
                            ? cargarInstitucional
                            : null
                },
                // ========================================
                // CONSULTA 03: INDICADORES GENERALES
                //
                // Actualiza la información estadística
                // correspondiente al periodo seleccionado.
                // ========================================
                {
                    nombre: 'Indicadores generales',
                    funcion:
                        typeof cargarIndicadores === 'function'
                            ? cargarIndicadores
                            : null
                },
                // ========================================
                // CONSULTA 04: CUMPLIMIENTO ANUAL
                //
                // Recupera la información de seguimiento
                // y cumplimiento del cronograma anual.
                // ========================================
                {
                    nombre: 'Calendario institucional',
                    funcion: cargarCalendarioInstitucional
                },
                {
                    nombre: 'Calendario de cumpleaños',
                    funcion: cargarCalendarioCumpleanos
                },
                {
                    nombre: 'Cumplimiento anual',
                    funcion:
                        typeof cargarCumplimiento === 'function'
                            ? cargarCumplimiento
                            : null
                }
            ]);
        // ================================================
        // COMPROBAR VIGENCIA DEL PERIODO CONSULTADO
        //
        // Si el usuario cambió de año durante la ejecución
        // de las consultas, se evita ejecutar la actualización
        // final del calendario con el resultado anterior.
        // ================================================
        if (
            version !== estado.versionPeriodo ||
            anio !== Number(estado.anio)
        ) {
            return {
                // La actualización no fue completada.
                success: false,
                // Identificar resultado como cancelado.
                cancelada: true,
                // No registrar el cambio de periodo
                // como un error de funcionamiento.
                errores: []
            };
        }
        // ================================================
        // ACTUALIZAR CALENDARIO Y AGENDA
        //
        // Ejecuta la actualización visual cuando el
        // periodo consultado continúa siendo el activo.
        // ================================================
        actualizarCalendarioFinal();
        // ================================================
        // DEVOLVER RESULTADO GENERAL
        //
        // Permite que el inicializador principal evalúe
        // los resultados de las consultas ejecutadas.
        // ================================================
        return resultado;
    }
    // ========================================================
    // 237. ACTUALIZAR RECURSOS HUMANOS
    // ========================================================
    async function actualizarRecursosHumanosFinal() {
        // ====================================================
        // CONSULTA PRINCIPAL DE COLABORADORES
        //
        // Comprueba que la función cargarCumpleanos esté
        // disponible antes de solicitar su ejecución.
        // ====================================================
        const tareas = [
            {
                nombre: 'Cumpleaños de colaboradores',
                funcion:
                    typeof cargarCumpleanos === 'function'
                        ? cargarCumpleanos
                        : null
            }
        ];
        // ====================================================
        // CONSULTAR ALERTAS DE CUMPLEAÑOS
        //
        // Incorpora la consulta de alertas cuando la
        // función correspondiente está disponible.
        //
        // Permite actualizar la información relacionada
        // con los próximos cumpleaños de colaboradores.
        // ====================================================
        if (
            typeof cargarAlertasCumpleanos ===
            'function'
        ) {
            tareas.push({
                nombre: 'Alertas de cumpleaños',
                funcion:
                    cargarAlertasCumpleanos
            });
        }
        // ====================================================
        // CONSULTAR INDICADORES DE CUMPLEAÑOS
        //
        // Recupera los indicadores disponibles mediante
        // la función desarrollada en el módulo de
        // Recursos Humanos.
        // ====================================================
        if (
            typeof cargarIndicadoresCumpleanos ===
            'function'
        ) {
            tareas.push({
                nombre: 'Indicadores de cumpleaños',
                funcion:
                    cargarIndicadoresCumpleanos
            });
        }
        // ====================================================
        // EJECUTAR CONSULTAS EN PARALELO
        //
        // Utiliza ejecutarGrupoFinal para gestionar
        // individualmente los resultados de cada consulta.
        // ====================================================
        const resultado =
            await ejecutarGrupoFinal(tareas);
        // ====================================================
        // ACTUALIZAR ESTADO VISUAL DE RECURSOS HUMANOS
        //
        // Información disponible:
        // Las consultas ejecutadas fueron satisfactorias.
        //
        // Requiere revisión:
        // Una o varias consultas presentaron dificultades.
        //
        // Utiliza la función de representación visual
        // definida en la sección 221.
        // ====================================================
        pintarEstadoServicioFinal(
            'estadoServicioRH',
            resultado.success
                ? 'Información disponible'
                : 'Requiere revisión',
            resultado.success
                ? 'correcto'
                : 'advertencia'
        );
        // ====================================================
        // ACTUALIZAR CALENDARIO Y AGENDA
        //
        // Actualiza la representación visual del calendario
        // después de consultar la información de cumpleaños.
        //
        // Conserva la integración con las actividades
        // manuales e institucionales del cronograma.
        // ====================================================
        actualizarCalendarioFinal();
        // ====================================================
        // DEVOLVER RESULTADO GENERAL
        //
        // Permite que el inicializador general compruebe
        // el resultado de las consultas de Recursos Humanos.
        // ====================================================
        return resultado;
    }
    // ========================================================
    // 238. ACTUALIZAR CONFIGURACIÓN DE RECORDATORIOS
    //
    // Consulta la configuración general de recordatorios,
    // el estado del programador automático de cumpleaños
    // y el estado del servicio de notificaciones.
    //
    // Componentes:
    //
    // 01. Configuración general de recordatorios.
    // 02. Estado del programador de cumpleaños.
    // 03. Estado del servicio de notificaciones.
    //
    // Esta función consulta información del backend.
    // No activa ni ejecuta directamente envíos de correo.
    // ========================================================
    async function actualizarRecordatoriosFinal() {
        // ====================================================
        // CONSULTAR CONFIGURACIÓN GENERAL
        //
        // Recupera la configuración almacenada mediante
        // la función cargarConfiguracion.
        //
        // Comprueba su disponibilidad antes de ejecutar
        // la consulta correspondiente.
        // ====================================================
        const tareas = [
            {
                nombre: 'Configuración de recordatorios',
                funcion:
                    typeof cargarConfiguracion === 'function'
                        ? cargarConfiguracion
                        : null
            }
        ];
        // ====================================================
        // CONSULTAR ESTADO DEL PROGRAMADOR AUTOMÁTICO
        //
        // Recupera la información del servicio encargado
        // de gestionar los cumpleaños de colaboradores.
        //
        // La función correspondiente debe interpretar
        // los datos informados por el backend.
        //
        // El estado del programador no debe confundirse
        // con la autorización de envíos reales de correo.
        // ====================================================
        if (
            typeof cargarEstadoServicioCumpleanos ===
            'function'
        ) {
            tareas.push({
                nombre: 'Estado del programador',
                funcion:
                    cargarEstadoServicioCumpleanos
            });
        }
        // ====================================================
        // CONSULTAR ESTADO DE NOTIFICACIONES
        //
        // Incorpora la consulta del estado de notificaciones
        // cuando la función correspondiente está disponible.
        //
        // Mantiene compatibilidad con los componentes
        // adicionales del sistema de notificaciones.
        // ====================================================
        if (
            typeof cargarEstadoNotificaciones ===
            'function'
        ) {
            tareas.push({
                nombre: 'Estado de notificaciones',
                funcion:
                    cargarEstadoNotificaciones
            });
        }
        // ====================================================
        // EJECUTAR CONSULTAS Y DEVOLVER RESULTADOS
        //
        // Permite actualizar los componentes de manera
        // independiente mediante el controlador general.
        //
        // Devuelve los resultados al inicializador
        // principal del Cronograma de Transformín.
        // ====================================================
        return ejecutarGrupoFinal(tareas);
    }
    // ========================================================
    // 239. ACTUALIZACIÓN GENERAL DEL CRONOGRAMA
    // ========================================================
    async function actualizarCronogramaFinal(
        opciones = {}
    ) {
        // ====================================================
        // CONFIGURAR OPCIONES DE ACTUALIZACIÓN
        // ====================================================
        // Determinar si la actualización es silenciosa.
        const silenciosa =
            opciones.silenciosa === true;
        // Determinar si se deben consultar los historiales.
        const incluirHistoriales =
            opciones.historiales !== false;
        // Determinar si se debe consultar la configuración.
        const incluirConfiguracion =
            opciones.configuracion !== false;
        // ====================================================
        // PREVENIR ACTUALIZACIONES SIMULTÁNEAS
        //
        // Evita ejecutar una actualización general cuando
        // existe otra actualización activa o se está
        // realizando un cambio de periodo anual.
        // ====================================================
        if (
            estado.actualizandoGeneral ||
            estado.cambiandoAnio
        ) {
            return {
                success: false,
                ocupada: true
            };
        }
        // ====================================================
        // COMPROBAR CONEXIÓN DE RED
        //
        // Verifica el estado de conexión informado por
        // el navegador antes de consultar el backend.
        // ====================================================
        if (!navigator.onLine) {
            mostrarErrorGeneralCronograma(
                'No hay conexión de red disponible.'
            );
            return {
                success: false,
                sinConexion: true
            };
        }
        // ====================================================
        // PROTEGER FORMULARIOS ABIERTOS
        //
        // Las actualizaciones silenciosas se aplazan cuando
        // existe una ventana modal abierta.
        //
        // Evita interrumpir innecesariamente la interacción
        // del usuario con los formularios del cronograma.
        // ====================================================
        if (
            silenciosa &&
            existeFormularioAbiertoFinal()
        ) {
            return {
                success: false,
                aplazada: true
            };
        }
        // ====================================================
        // REGISTRAR ACTUALIZACIÓN ACTIVA
        // ====================================================
        estado.actualizandoGeneral = true;
        // Ocultar mensajes de errores anteriores.
        ocultarErrorGeneralCronograma();
        // ====================================================
        // ACTIVAR ESTADO DE CARGA DEL BOTÓN
        //
        // Solo modifica el botón de actualización cuando
        // la operación no corresponde a una actualización
        // silenciosa.
        // ====================================================
        if (!silenciosa) {
            botonCargando(
                'btnActualizarDatos',
                true,
                'Actualizando...'
            );
        }
        // Actualizar indicador general del módulo.
        actualizarEstadoModuloFinal(
            'Actualizando información...'
        );
        try {
            // ================================================
            // DEFINIR CONSULTAS PRINCIPALES
            //
            // Estas consultas se ejecutan mediante el
            // controlador general de tareas independientes.
            // ================================================
            const tareas = [
                // ============================================
                // CONSULTA 01: DIAGNÓSTICO ERP
                //
                // Comprueba la disponibilidad general
                // del servidor y sus servicios.
                // ============================================
                {
                    nombre: 'Diagnóstico ERP',
                    funcion:
                        verificarEstadoERPFinal
                },
                // ============================================
                // CONSULTA 02: INFORMACIÓN ANUAL
                //
                // Actualiza las actividades y los indicadores
                // correspondientes al periodo seleccionado.
                // ============================================
                {
                    nombre: 'Información anual',
                    funcion:
                        cargarPeriodoGeneralFinal
                },
                // ============================================
                // CONSULTA 03: RECURSOS HUMANOS
                //
                // Actualiza la información de colaboradores,
                // cumpleaños, alertas e indicadores.
                // ============================================
                {
                    nombre: 'Recursos Humanos',
                    funcion:
                        actualizarRecursosHumanosFinal
                }
            ];
            // ================================================
            // INCORPORAR CONFIGURACIÓN DE RECORDATORIOS
            //
            // Consulta la configuración y el estado del
            // programador cuando esta opción está habilitada.
            // ================================================
            if (incluirConfiguracion) {
                tareas.push({
                    nombre: 'Recordatorios',
                    funcion:
                        actualizarRecordatoriosFinal
                });
            }
            // ================================================
            // INCORPORAR HISTORIALES Y AUDITORÍA
            //
            // Permite excluir estas consultas cuando no
            // resulta necesario actualizar los historiales.
            // ================================================
            if (incluirHistoriales) {
                tareas.push({
                    nombre: 'Historiales y auditoría',
                    funcion:
                        actualizarHistorialesDocumentales
                });
            }
            // ================================================
            // EJECUTAR CONSULTAS GENERALES
            //
            // Gestiona individualmente los resultados
            // mediante la función ejecutarGrupoFinal.
            // ================================================
            const resultado =
                await ejecutarGrupoFinal(tareas);
            // ================================================
            // ALMACENAR ERRORES IDENTIFICADOS
            //
            // Conserva las observaciones para facilitar
            // el diagnóstico general del cronograma.
            // ================================================
            estado.erroresInicializacion =
                resultado.errores;
            // ================================================
            // ACTUALIZAR CALENDARIO Y AGENDA
            //
            // Representa nuevamente la información después
            // de finalizar las consultas generales.
            // ================================================
            actualizarCalendarioFinal();
            // ================================================
            // CONTROLAR ACTUALIZACIÓN SATISFACTORIA
            // ================================================
            if (resultado.success) {
                // Registrar fecha y hora de actualización.
                registrarActualizacionFinal();
                // Actualizar estado visual del módulo.
                actualizarEstadoModuloFinal(
                    'Información actualizada',
                    'correcto'
                );
                // Mostrar confirmación en actualizaciones
                // realizadas manualmente.
                if (!silenciosa) {
                    notificar(
                        'Información del cronograma actualizada correctamente.'
                    );
                }
            } else {
                // ============================================
                // CONTROLAR ACTUALIZACIÓN PARCIAL
                //
                // Identifica los componentes que presentaron
                // dificultades sin ocultar la información
                // recuperada satisfactoriamente.
                // ============================================
                actualizarEstadoModuloFinal(
                    'Actualización parcial',
                    'advertencia'
                );
                // Recuperar nombres de servicios con errores.
                const nombres =
                    resultado.errores.map(
                        error => error.nombre
                    ).join(', ');
                // Mostrar información general de diagnóstico.
                mostrarErrorGeneralCronograma(
                    `Algunos servicios requieren revisión: ${nombres}.`
                );
                // Mostrar advertencia únicamente cuando
                // la actualización no es silenciosa.
                if (!silenciosa) {
                    notificar(
                        'La actualización finalizó con servicios pendientes de revisión.',
                        'advertencia'
                    );
                }
            }
            // ================================================
            // DEVOLVER RESULTADO GENERAL
            // ================================================
            return resultado;
        } catch (error) {
            // ================================================
            // CONTROLAR ERRORES GENERALES DE ACTUALIZACIÓN
            // ================================================
            actualizarEstadoModuloFinal(
                'Error de actualización',
                'error'
            );
            // Mostrar descripción del error.
            mostrarErrorGeneralCronograma(
                error.message
            );
            // Ejecutar controlador general de errores
            // cuando la actualización es manual.
            if (!silenciosa) {
                manejarError(error);
            }
            // Devolver resultado no satisfactorio.
            return {
                success: false,
                error
            };
        } finally {
            // ================================================
            // LIBERAR ESTADO DE ACTUALIZACIÓN
            //
            // Se ejecuta independientemente del resultado
            // para permitir futuras actualizaciones.
            // ================================================
            estado.actualizandoGeneral = false;
            // ================================================
            // RESTABLECER BOTÓN DE ACTUALIZACIÓN
            // ================================================
            if (!silenciosa) {
                botonCargando(
                    'btnActualizarDatos',
                    false
                );
            }
        }
    }
    // ========================================================
    // 240. REINICIAR PAGINACIONES AL CAMBIAR AÑO
    //
    // Restablece las paginaciones de los diferentes módulos
    // cuando el usuario selecciona un nuevo periodo anual.
    //
    // Evita conservar páginas correspondientes a registros
    // del periodo anterior.
    // ========================================================
    function reiniciarPaginacionesFinal() {
        // Paginación de actividades manuales.
        estado.pagina = 1;
        // Paginación de actividades institucionales.
        estado.paginaInstitucional = 1;
        // Paginación de colaboradores y cumpleaños.
        estado.paginaCumpleanos = 1;
        // Paginación del historial de notificaciones.
        estado.paginaHistorialNotificaciones = 1;
        // Paginación del historial de actividades.
        estado.paginaHistorialActividades = 1;
        // Paginación del historial de importaciones Excel.
        estado.paginaHistorialImportaciones = 1;
    }
    // ========================================================
    // 241. CAMBIAR PERIODO DEL CALENDARIO
    //
    // Ajusta el calendario al nuevo año seleccionado,
    // conservando el mes que estaba visualizando el usuario.
    //
    // Compatible con años anteriores y posteriores.
    //
    // Si la fecha almacenada no es válida, utiliza la fecha
    // actual como referencia para determinar el mes.
    // ========================================================
    function ajustarCalendarioPeriodoFinal(anio) {
        // ====================================================
        // VALIDAR FECHA ACTUAL DEL CALENDARIO
        //
        // Comprueba que la fecha almacenada corresponda
        // a una instancia válida del objeto Date.
        // ====================================================
        const fechaActual =
            estado.fechaCalendario instanceof Date &&
            !Number.isNaN(
                estado.fechaCalendario.getTime()
            )
                ? estado.fechaCalendario
                : new Date();
        // ====================================================
        // ESTABLECER NUEVO PERIODO DEL CALENDARIO
        //
        // Conserva el mes seleccionado anteriormente.
        // Establece el primer día del mes a las 12:00.
        //
        // La actualización visual se realiza posteriormente
        // mediante las funciones de calendario y agenda.
        // ====================================================
        estado.fechaCalendario =
            new Date(
                anio,
                fechaActual.getMonth(),
                1,
                12,
                0,
                0
            );
    }
    // ========================================================
    // 242. LIMPIAR INFORMACIÓN DEL PERIODO ANTERIOR
    //
    // Restablece los datos temporales almacenados en el
    // frontend antes de consultar un nuevo periodo anual.
    //
    // Componentes:
    //
    // 01. Actividades manuales.
    // 02. Actividades filtradas.
    // 03. Actividades institucionales FT-SST-147.
    // 04. Historial de notificaciones.
    // 05. Historial de actividades y auditoría.
    // 06. Historial de importaciones Excel.
    // 07. Resumen de exportación.
    // 08. Indicadores de notificaciones.
    // 09. Paginaciones.
    // 10. Previsualización documental.
    //
    // IMPORTANTE:
    //
    // Esta función únicamente limpia información temporal
    // de la interfaz. No elimina registros de MySQL ni
    // modifica los documentos institucionales almacenados.
    // ========================================================
    function limpiarPeriodoAnteriorFinal() {
        // ====================================================
        // LIMPIAR ACTIVIDADES MANUALES
        // ====================================================
        estado.actividades = [];
        estado.filtradas = [];
        // ====================================================
        // LIMPIAR ACTIVIDADES INSTITUCIONALES
        //
        // Restablece las colecciones utilizadas para
        // representar el formato institucional FT-SST-147.
        // ====================================================
        estado.institucionales = [];
        estado.actividadesInstitucionales = [];
        estado.eventosInstitucionales = [];
        estado.eventosSinFecha = [];
        estado.eventosCumpleanos = [];
        // ====================================================
        // LIMPIAR HISTORIALES DEL PERIODO ANTERIOR
        // ====================================================
        estado.historialNotificaciones = [];
        estado.historialActividades = [];
        estado.historialImportaciones = [];
        // ====================================================
        // RESTABLECER RESUMEN DE EXPORTACIÓN
        //
        // Evita conservar el resumen correspondiente
        // a un documento institucional de otro periodo.
        // ====================================================
        estado.resumenExportacion = null;
        // ====================================================
        // LIMPIAR INDICADORES DE NOTIFICACIONES
        // ====================================================
        estado.indicadoresNotificaciones = {};
        // ====================================================
        // REINICIAR PAGINACIONES
        //
        // Utiliza la función definida en la sección 240.
        // ====================================================
        reiniciarPaginacionesFinal();
        // ====================================================
        // LIMPIAR TABLAS DE LA INTERFAZ
        //
        // Elimina temporalmente las filas representadas
        // en las tablas correspondientes al periodo anterior.
        //
        // Las tablas se completarán nuevamente cuando
        // finalicen las consultas del nuevo año.
        // ====================================================
        [
            // Tabla de actividades manuales.
            'tablaActividadesBody',
            // Tabla institucional FT-SST-147.
            'tablaInstitucionalBody',
            // Tabla del historial de notificaciones.
            'tablaHistorialBody',
            // Tabla del historial de actividades.
            'tablaHistorialActividadesBody',
            // Tabla del historial de importaciones.
            'tablaHistorialImportacionesBody'
        ].forEach(id => {
            html(id, '');
        });
        // ====================================================
        // LIMPIAR CONTROLES DE PAGINACIÓN
        //
        // Elimina los botones de navegación correspondientes
        // a las cantidades de registros del año anterior.
        // ====================================================
        [
            // Paginación de actividades manuales.
            'paginacionActividades',
            // Paginación de actividades institucionales.
            'paginacionInstitucional',
            // Paginación de notificaciones.
            'paginacionHistorialNotificaciones',
            // Paginación de auditoría.
            'paginacionHistorialActividades',
            // Paginación de importaciones.
            'paginacionHistorialImportaciones'
        ].forEach(id => {
            html(id, '');
        });
        // ====================================================
        // INVALIDAR PREVISUALIZACIÓN DE EXCEL
        //
        // Evita utilizar una previsualización documental
        // validada previamente para otro periodo anual.
        //
        // El documento deberá validarse nuevamente antes
        // de realizar una importación correspondiente al
        // nuevo año seleccionado.
        // ====================================================
        invalidarPrevisualizacionExcel();
    }
    // ========================================================
    // 243. APLICAR AÑO SELECCIONADO
    //
    // Ejecuta el cambio de periodo anual, protege las
    // operaciones activas y actualiza la información
    // correspondiente al nuevo año seleccionado.
    // ========================================================
    async function aplicarPeriodoAnualFinal() {
        // Impedir cambios durante operaciones activas.
        if (
            existenOperacionesPendientesFinal()
        ) {
            notificar(
                'Espera a que finalice la operación actual.',
                'advertencia'
            );
            return;
        }
        // Proteger los formularios abiertos.
        if (
            existeFormularioAbiertoFinal()
        ) {
            notificar(
                'Cierra el formulario abierto antes de cambiar el año.',
                'advertencia'
            );
            return;
        }
        // ====================================================
        // VALIDAR AÑO SELECCIONADO
        // ====================================================
        let anio;
        try {
            anio = validarPeriodoFinal(
                campo('selectorAnio')
            );
        } catch (error) {
            manejarError(error);
            return;
        }
        // ====================================================
        // ACTUALIZAR EL MISMO PERIODO
        //
        // Si el año seleccionado coincide con el año activo,
        // realiza una actualización general sin limpiar
        // innecesariamente la información existente.
        // ====================================================
        if (
            anio === Number(estado.anio)
        ) {
            await actualizarCronogramaFinal();
            return;
        }
        // ====================================================
        // REGISTRAR CAMBIO DE PERIODO
        // ====================================================
        estado.cambiandoAnio = true;
        estado.versionPeriodo++;
        // Deshabilitar temporalmente el selector anual.
        deshabilitar(
            'selectorAnio',
            true
        );
        // Activar indicador de carga del botón Aplicar.
        botonCargando(
            'btnAplicarAnio',
            true,
            'Aplicando...'
        );
        // Informar el periodo que se está consultando.
        actualizarEstadoModuloFinal(
            `Consultando periodo ${anio}...`
        );
        try {
            // ================================================
            // ESTABLECER NUEVO PERIODO ANUAL
            // ================================================
            estado.anio = anio;
            // Limpiar información temporal del año anterior.
            limpiarPeriodoAnteriorFinal();
            // Ajustar calendario conservando el mes.
            ajustarCalendarioPeriodoFinal(anio);
            // Sincronizar componentes de la interfaz.
            sincronizarPeriodoGeneral();
            // ================================================
            // CONSULTAR INFORMACIÓN DEL NUEVO PERIODO
            //
            // Ejecuta las consultas de manera independiente
            // mediante el controlador general de tareas.
            // ================================================
            const resultado =
                await ejecutarGrupoFinal([
                    // Actividades e indicadores anuales.
                    {
                        nombre: 'Información del periodo',
                        funcion:
                            cargarPeriodoGeneralFinal
                    },
                    // Historiales y auditoría documental.
                    {
                        nombre: 'Historiales del periodo',
                        funcion:
                            actualizarHistorialesDocumentales
                    },
                    // Colaboradores y cumpleaños.
                    {
                        nombre: 'Recursos Humanos',
                        funcion:
                            actualizarRecursosHumanosFinal
                    }
                ]);
            // ================================================
            // ACTUALIZAR CALENDARIO Y AGENDA
            // ================================================
            actualizarCalendarioFinal();
            // ================================================
            // CONTROLAR ACTUALIZACIÓN SATISFACTORIA
            // ================================================
            if (resultado.success) {
                // Ocultar alertas anteriores.
                ocultarErrorGeneralCronograma();
                // Registrar fecha y hora de actualización.
                registrarActualizacionFinal();
                // Actualizar estado general del periodo.
                actualizarEstadoModuloFinal(
                    `Periodo ${anio} actualizado`,
                    'correcto'
                );
                // Informar resultado satisfactorio.
                notificar(
                    `Cronograma del año ${anio} actualizado correctamente.`
                );
            } else {
                // ============================================
                // CONTROLAR ACTUALIZACIÓN PARCIAL
                //
                // Conserva los datos recuperados correctamente
                // e informa que existen consultas pendientes
                // de revisión.
                // ============================================
                actualizarEstadoModuloFinal(
                    `Periodo ${anio}: actualización parcial`,
                    'advertencia'
                );
                mostrarErrorGeneralCronograma(
                    `No fue posible consultar toda la información del año ${anio}.`
                );
            }
        } catch (error) {
            // ================================================
            // CONTROLAR ERRORES DEL CAMBIO DE PERIODO
            // ================================================
            mostrarErrorGeneralCronograma(
                error.message
            );
            manejarError(error);
        } finally {
            // ================================================
            // LIBERAR CONTROLES DE LA INTERFAZ
            //
            // Se ejecuta independientemente del resultado
            // para permitir nuevos cambios de periodo.
            // ================================================
            estado.cambiandoAnio = false;
            // Habilitar nuevamente el selector anual.
            deshabilitar(
                'selectorAnio',
                false
            );
            // Restablecer el botón Aplicar.
            botonCargando(
                'btnAplicarAnio',
                false
            );
        }
    }
    // ========================================================
    // 244. CONFIGURAR EVENTOS DEL SELECTOR ANUAL
    //
    // Configura los eventos del selector principal de año,
    // el botón Aplicar y la navegación mediante teclado.
    //
    // Utiliza el registro de eventos finales para evitar
    // registrar varias veces el mismo controlador.
    // ========================================================
    function configurarEventosPeriodoFinal() {
        // Localizar botón de aplicación del periodo.
        const botonAplicar =
            $('btnAplicarAnio');
        // ====================================================
        // CONFIGURAR BOTÓN APLICAR AÑO
        // ====================================================
        if (botonAplicar) {
            enlazarEventoFinal(
                botonAplicar,
                'click',
                'aplicar-periodo',
                eventoSeguro(
                    aplicarPeriodoAnualFinal
                )
            );
        }
        // ====================================================
        // CONFIGURAR CAMBIO DEL SELECTOR ANUAL
        //
        // Si no existe un botón Aplicar, ejecuta directamente
        // el cambio de periodo.
        //
        // Si existe el botón, informa que el nuevo periodo
        // está pendiente de confirmación.
        // ====================================================
        enlazarEventoFinal(
            'selectorAnio',
            'change',
            'seleccionar-periodo',
            eventoSeguro(async () => {
                // Aplicación automática sin botón.
                if (!botonAplicar) {
                    await aplicarPeriodoAnualFinal();
                    return;
                }
                // Obtener periodo seleccionado.
                const seleccionado =
                    Number(
                        campo('selectorAnio')
                    );
                // Informar cambio pendiente de aplicación.
                if (
                    seleccionado !==
                    Number(estado.anio)
                ) {
                    actualizarEstadoModuloFinal(
                        'Periodo pendiente de aplicar',
                        'advertencia'
                    );
                }
            })
        );
        // ====================================================
        // APLICAR PERIODO MEDIANTE TECLA ENTER
        //
        // Facilita la navegación mediante teclado y evita
        // el comportamiento predeterminado del formulario.
        // ====================================================
        enlazarEventoFinal(
            'selectorAnio',
            'keydown',
            'aplicar-periodo-teclado',
            eventoSeguro(async evento => {
                // Ignorar teclas diferentes de Enter.
                if (
                    evento.key !== 'Enter'
                ) {
                    return;
                }
                // Evitar comportamiento predeterminado.
                evento.preventDefault();
                // Aplicar periodo seleccionado.
                await aplicarPeriodoAnualFinal();
            })
        );
    }
    // ========================================================
    // 245. OBTENER PESTAÑA ACTIVA
    //
    // Identifica la pestaña actualmente seleccionada
    // mediante los atributos de navegación de Bootstrap.
    //
    // Utiliza la pestaña del calendario como valor
    // predeterminado cuando no encuentra una activa.
    // ========================================================
    function obtenerPestanaActivaFinal() {
        // Buscar pestaña activa.
        const activa =
            document.querySelector(
                '[data-bs-toggle="tab"].active, ' +
                '[data-bs-toggle="pill"].active'
            );
        // Devolver identificador de la pestaña.
        return activa?.id ||
            'tab-calendario';
    }
    // ========================================================
    // 246. ACTUALIZAR PESTAÑA SELECCIONADA
    //
    // Actualiza los componentes correspondientes a la
    // pestaña seleccionada por el usuario.
    //
    // Evita ejecutar consultas adicionales durante:
    //
    // - Inicialización general.
    // - Actualización general del cronograma.
    // - Cambio de periodo anual.
    //
    // Componentes disponibles:
    //
    // 01. Calendario.
    // 02. Actividades manuales e institucionales.
    // 03. Cumpleaños.
    // 04. Recordatorios.
    // 05. Historiales.
    // ========================================================
    async function actualizarPestanaFinal(id) {
        // ====================================================
        // COMPROBAR OPERACIONES GENERALES ACTIVAS
        // ====================================================
        if (
            estado.inicializando ||
            estado.actualizandoGeneral ||
            estado.cambiandoAnio
        ) {
            return;
        }
        // ====================================================
        // IDENTIFICAR PESTAÑA SELECCIONADA
        // ====================================================
        switch (id) {
            // ================================================
            // PESTAÑA 01: CALENDARIO
            //
            // Actualiza la representación visual del
            // calendario mensual y la agenda.
            // ================================================
            case 'tab-calendario':
                actualizarCalendarioFinal();
                break;
            // ================================================
            // PESTAÑA 02: ACTIVIDADES
            //
            // Consulta las actividades manuales y las
            // actividades institucionales FT-SST-147.
            // ================================================
            case 'tab-actividades':
                await ejecutarGrupoFinal([
                    // Actividades manuales.
                    {
                        nombre: 'Actividades manuales',
                        funcion:
                            typeof cargarActividades === 'function'
                                ? cargarActividades
                                : null
                    },
                    // Actividades institucionales.
                    {
                        nombre: 'Actividades institucionales',
                        funcion:
                            typeof cargarInstitucional === 'function'
                                ? cargarInstitucional
                                : null
                    }
                ]);
                break;
            // ================================================
            // PESTAÑA 03: CUMPLEAÑOS
            //
            // Actualiza colaboradores, indicadores y alertas
            // correspondientes a Recursos Humanos.
            // ================================================
            case 'tab-cumpleanos':
                await actualizarRecursosHumanosFinal();
                break;
            // ================================================
            // PESTAÑA 04: RECORDATORIOS
            //
            // Consulta la configuración de recordatorios
            // y el estado del programador automático.
            // ================================================
            case 'tab-recordatorios':
                await actualizarRecordatoriosFinal();
                break;
            // ================================================
            // PESTAÑA 05: HISTORIALES
            //
            // Actualiza notificaciones, auditoría,
            // importaciones e indicadores documentales.
            // ================================================
            case 'tab-historial':
                await actualizarHistorialesDocumentales();
                break;
            // ================================================
            // PESTAÑA NO RECONOCIDA
            //
            // No ejecuta consultas adicionales.
            // ================================================
            default:
                break;
        }
    }
    // ========================================================
    // 247. CONFIGURAR NAVEGACIÓN POR PESTAÑAS
    //
    // Configura los eventos de navegación de Bootstrap.
    // Actualiza la información correspondiente a cada pestaña
    // cuando el usuario accede a ella.
    // ========================================================
    function configurarPestanasFinal() {
        // Identificadores de las pestañas principales.
        const pestanas = [
            'tab-calendario',
            'tab-actividades',
            'tab-cumpleanos',
            'tab-recordatorios',
            'tab-historial'
        ];
        // Registrar los eventos de navegación.
        pestanas.forEach(id => {
            enlazarEventoFinal(
                id,
                'shown.bs.tab',
                'actualizar-pestana',
                eventoSeguro(async evento => {
                    // Actualizar la pestaña seleccionada.
                    await actualizarPestanaFinal(
                        evento.target.id
                    );
                })
            );
        });
    }
    // ========================================================
    // 248. CONFIGURAR PRIORIDADES COMPATIBLES
    //
    // Garantiza que los selectores de prioridades utilicen
    // los valores compatibles con el backend y MySQL.
    //
    // Valores permitidos:
    //
    // BAJA
    // MEDIA
    // ALTA
    //
    // Compatibilidad con valores anteriores:
    //
    // NORMAL  -> MEDIA
    // URGENTE -> ALTA
    //
    // Evita errores HTTP 400 ocasionados por prioridades
    // que no corresponden a los valores permitidos.
    // ========================================================
    function configurarPrioridadesFinal() {
        // Definir prioridades válidas.
        const prioridadesValidas = [
            {
                valor: 'BAJA',
                etiqueta: 'Baja'
            },
            {
                valor: 'MEDIA',
                etiqueta: 'Media'
            },
            {
                valor: 'ALTA',
                etiqueta: 'Alta'
            }
        ];
        // Identificadores de selectores compatibles.
        const selectores = [
            'actividadPrioridad',
            'prioridadActividad',
            'institucionalPrioridad',
            'filtroPrioridad'
        ];
        // ====================================================
        // RECORRER SELECTORES DE PRIORIDAD
        // ====================================================
        selectores.forEach(id => {
            // Localizar selector correspondiente.
            const selector = $(id);
            // Validar existencia y tipo de elemento.
            if (
                !selector ||
                selector.tagName !== 'SELECT'
            ) {
                return;
            }
            // Conservar prioridad seleccionada anteriormente.
            let anterior = selector.value;
            // ================================================
            // CONVERTIR PRIORIDADES ANTERIORES
            // ================================================
            if (anterior === 'NORMAL') {
                anterior = 'MEDIA';
            }
            if (anterior === 'URGENTE') {
                anterior = 'ALTA';
            }
            // ================================================
            // GENERAR OPCIONES COMPATIBLES
            // ================================================
            const opciones =
                prioridadesValidas.map(
                    prioridad => `
                        <option value="${prioridad.valor}">
                            ${prioridad.etiqueta}
                        </option>
                    `
                );
            // ================================================
            // INCORPORAR OPCIÓN GENERAL PARA FILTROS
            //
            // El filtro permite consultar todas las
            // prioridades sin aplicar una específica.
            // ================================================
            if (id === 'filtroPrioridad') {
                opciones.unshift(`
                    <option value="">
                        Todas las prioridades
                    </option>
                `);
            }
            // Incorporar opciones al selector.
            selector.innerHTML =
                opciones.join('');
            // ================================================
            // RESTABLECER PRIORIDAD SELECCIONADA
            //
            // Conserva el valor anterior cuando es válido.
            //
            // Formularios: MEDIA como valor predeterminado.
            // Filtros: todas las prioridades.
            // ================================================
            selector.value =
                prioridadesValidas.some(
                    prioridad =>
                        prioridad.valor === anterior
                )
                    ? anterior
                    : id === 'filtroPrioridad'
                        ? ''
                        : 'MEDIA';
        });
    }
    // ========================================================
    // 249. COMPATIBILIDAD DEL FILTRO DE CUMPLEAÑOS
    //
    // Normaliza el valor utilizado para consultar los
    // cumpleaños próximos de los colaboradores.
    //
    // Valor anterior: PROXIMOS.
    // Valor compatible: PROXIMOS30.
    //
    // Conserva las demás opciones existentes del selector.
    // ========================================================
    function configurarFiltroCumpleanosFinal() {
        // Localizar selector de periodo de cumpleaños.
        const selector =
            $('filtroCumpleanosPeriodo');
        // Evitar errores si el selector no existe.
        if (!selector) return;
        // Recorrer opciones disponibles.
        Array.from(selector.options)
            .forEach(opcion => {
                // Actualizar únicamente el valor anterior.
                if (
                    opcion.value === 'PROXIMOS'
                ) {
                    opcion.value =
                        'PROXIMOS30';
                }
            });
    }
    // ========================================================
    // 250. COMPATIBILIDAD DE BOTONES Y FORMULARIOS
    //
    // Establece explícitamente el tipo button para los
    // controles que no deben enviar formularios.
    //
    // Evita recargas inesperadas de la página al utilizar
    // botones de actualización, importación, exportación,
    // validación y generación de tarjetas.
    //
    // Los botones destinados a guardar formularios
    // conservan su tipo submit original.
    // ========================================================
    function configurarBotonesFinal() {
        // Identificadores de botones de acción.
        const botones = [
            // Actualización general del cronograma.
            'btnActualizarDatos',
            // Aplicación del periodo anual.
            'btnAplicarAnio',
            // Reintentar consultas.
            'btnReintentarCronograma',
            // Importación y exportación institucional.
            'btnImportarExcel',
            'btnExportarExcel',
            // Validación y selección de archivos.
            'btnValidarExcel',
            'btnQuitarArchivoExcel',
            // Actualización del formato institucional.
            'btnActualizarInstitucional',
            // Actualización de cumpleaños y alertas.
            'btnActualizarCumpleanos',
            'btnActualizarAlertasCumpleanos',
            // Actualización de historiales.
            'btnActualizarHistorial',
            'btnActualizarHistorialActividades',
            'btnActualizarHistorialImportaciones',
            // Generación y descarga de tarjetas.
            'btnRegenerarTarjetaCumpleanos',
            'btnDescargarTarjetaCumpleanos'
        ];
        // ====================================================
        // NORMALIZAR TIPO DE BOTÓN
        // ====================================================
        botones.forEach(id => {
            // Localizar elemento correspondiente.
            const elemento = $(id);
            // Modificar únicamente elementos BUTTON.
            if (
                elemento?.tagName === 'BUTTON'
            ) {
                elemento.type = 'button';
            }
        });
        // Los formularios de guardado conservan
        // sus botones submit originales.
    }
    // ========================================================
    // 251. EVITAR ENVÍOS AUTOMÁTICOS DE FORMULARIOS
    //
    // Previene el comportamiento predeterminado del navegador
    // cuando se envían los formularios del cronograma.
    //
    // Permite conservar las operaciones asíncronas mediante
    // JavaScript y las peticiones correspondientes al backend.
    //
    // No elimina los controladores de guardado existentes.
    // Únicamente evita la navegación o recarga tradicional
    // producida por el envío de formularios HTML.
    // ========================================================
    function configurarFormulariosFinal() {
        // Identificadores de formularios protegidos.
        const formularios = [
            // Creación y edición de actividades.
            'formActividad',
            // Cambio de estado de actividades.
            'formEstadoActividad',
            // Edición de actividades institucionales.
            'formInstitucional',
            // Configuración de programación semanal.
            'formProgramacionSemanal',
            // Configuración individual de cumpleaños.
            'formConfiguracionCumpleanos',
            // Configuración general de recordatorios.
            'formConfiguracionRecordatorios',
            // Exportación institucional FT-SST-147.
            'formExportarExcel'
        ];
        // ====================================================
        // CONFIGURAR EVENTOS DE FORMULARIOS
        // ====================================================
        formularios.forEach(id => {
            // Localizar formulario correspondiente.
            const formulario = $(id);
            // Ignorar formularios no disponibles.
            if (!formulario) return;
            // Registrar evento sin duplicar controladores.
            enlazarEventoFinal(
                formulario,
                'submit',
                'evitar-navegacion',
                evento => {
                    // Evitar recarga tradicional de la página.
                    evento.preventDefault();
                }
            );
        });
    }
    // ========================================================
    // 252. COMPATIBILIDAD DE MODALES
    //
    // Garantiza la compatibilidad entre las clases utilizadas
    // en las diferentes versiones del HTML y CSS.
    //
    // Actualiza las dimensiones de los modales mediante
    // Bootstrap y controla su estado visual al cerrarlos.
    // ========================================================
    function configurarModalesFinal() {
        // Obtener todos los modales disponibles.
        const modales =
            document.querySelectorAll(
                '.modal'
            );
        modales.forEach(elemento => {
            // ================================================
            // COMPATIBILIDAD DE CLASES CSS
            //
            // Conserva ambas denominaciones utilizadas
            // durante las revisiones del módulo.
            // ================================================
            if (
                elemento.classList.contains(
                    'cronograma-modal'
                ) ||
                elemento.classList.contains(
                    'modal-cronograma'
                )
            ) {
                elemento.classList.add(
                    'cronograma-modal',
                    'modal-cronograma'
                );
            }
            // ================================================
            // AJUSTAR DIMENSIONES DEL MODAL
            //
            // Bootstrap recalcula la posición del modal
            // después de completar su apertura.
            // ================================================
            enlazarEventoFinal(
                elemento,
                'shown.bs.modal',
                'ajustar-modal',
                () => {
                    if (
                        window.bootstrap?.Modal
                    ) {
                        const instancia =
                            bootstrap.Modal.getInstance(
                                elemento
                            );
                        instancia?.handleUpdate();
                    }
                }
            );
            // ================================================
            // RESTAURAR ESTADO VISUAL AL CERRAR
            //
            // Elimina la clase general únicamente cuando
            // no quedan otros modales abiertos.
            // ================================================
            enlazarEventoFinal(
                elemento,
                'hidden.bs.modal',
                'restaurar-accesibilidad',
                () => {
                    if (
                        !document.querySelector(
                            '.modal.show'
                        )
                    ) {
                        document.body.classList.remove(
                            'cronograma-modal-abierto'
                        );
                    }
                }
            );
        });
    }
    // ========================================================
    // 253. CONTROL DE APERTURA DE MODALES
    //
    // Mantiene sincronizado el estado general del documento
    // con la apertura y cierre de las ventanas modales.
    //
    // Permite que el CSS aplique estilos específicos mientras
    // el usuario interactúa con una ventana modal.
    // ========================================================
    function configurarAperturaModalesFinal() {
        // ================================================
        // DETECTAR APERTURA DE MODALES
        // ================================================
        enlazarEventoFinal(
            document,
            'show.bs.modal',
            'estado-modal-abierto',
            () => {
                document.body.classList.add(
                    'cronograma-modal-abierto'
                );
            }
        );
        // ================================================
        // DETECTAR CIERRE DE MODALES
        //
        // Conserva la clase general cuando todavía existe
        // otra ventana modal abierta.
        // ================================================
        enlazarEventoFinal(
            document,
            'hidden.bs.modal',
            'estado-modal-cerrado',
            () => {
                if (
                    !document.querySelector(
                        '.modal.show'
                    )
                ) {
                    document.body.classList.remove(
                        'cronograma-modal-abierto'
                    );
                }
            }
        );
    }
    // ========================================================
    // 254. VERIFICAR DEPENDENCIAS DEL FRONTEND
    //
    // Comprueba la disponibilidad de las tecnologías
    // necesarias para el funcionamiento del cronograma.
    //
    // Dependencias verificadas:
    //
    // 01. Fetch API.
    // 02. FormData.
    // 03. AbortController.
    // 04. Bootstrap Modal.
    // 05. Bootstrap Tab.
    //
    // Devuelve un resultado estructurado con los errores
    // identificados durante la comprobación.
    // ========================================================
    function verificarDependenciasFinal() {
        // Almacenar dependencias no disponibles.
        const errores = [];
        // ================================================
        // VERIFICAR FETCH API
        //
        // Necesaria para realizar consultas al backend.
        // ================================================
        if (
            typeof fetch !== 'function'
        ) {
            errores.push(
                'Fetch API no disponible.'
            );
        }
        // ================================================
        // VERIFICAR FORMDATA
        //
        // Necesaria para enviar formularios y archivos
        // institucionales al servidor.
        // ================================================
        if (
            typeof FormData !== 'function'
        ) {
            errores.push(
                'FormData no disponible.'
            );
        }
        // ================================================
        // VERIFICAR ABORTCONTROLLER
        //
        // Necesario para cancelar peticiones anteriores
        // y controlar tiempos máximos de respuesta.
        // ================================================
        if (
            typeof AbortController !== 'function'
        ) {
            errores.push(
                'AbortController no disponible.'
            );
        }
        // ================================================
        // VERIFICAR BOOTSTRAP MODAL
        //
        // Necesario para gestionar ventanas modales.
        // ================================================
        if (
            !window.bootstrap?.Modal
        ) {
            errores.push(
                'Bootstrap Modal no está disponible.'
            );
        }
        // ================================================
        // VERIFICAR BOOTSTRAP TAB
        //
        // Necesario para gestionar las pestañas del módulo.
        // ================================================
        if (
            !window.bootstrap?.Tab
        ) {
            errores.push(
                'Bootstrap Tab no está disponible.'
            );
        }
        // ================================================
        // DEVOLVER RESULTADO DE VERIFICACIÓN
        // ================================================
        return {
            success: errores.length === 0,
            errores
        };
    }
    // ========================================================
    // 255. VERIFICAR ELEMENTOS PRINCIPALES DEL HTML
    //
    // Comprueba que los identificadores utilizados por
    // JavaScript estén disponibles en el documento HTML.
    //
    // Diferencia entre elementos obligatorios y opcionales
    // para facilitar el diagnóstico de la inicialización.
    // ========================================================
    function verificarElementosFinal() {
        // ================================================
        // ELEMENTOS OBLIGATORIOS
        //
        // Controles principales necesarios para las
        // funcionalidades del Cronograma de Transformín.
        // ================================================
        const obligatorios = [
            // Selector principal del periodo anual.
            'selectorAnio',
            // Contenedor del calendario mensual.
            'calendarioGrid',
            // Tabla de actividades manuales.
            'tablaActividadesBody',
            // Tabla institucional FT-SST-147.
            'tablaInstitucionalBody',
            // Contenedor de colaboradores y cumpleaños.
            'listaCumpleanos',
            // Formulario de configuración de recordatorios.
            'formConfiguracionRecordatorios',
            // Tabla del historial de notificaciones.
            'tablaHistorialBody',
            // Modal de importación institucional.
            'modalImportarExcel',
            // Modal de exportación institucional.
            'modalExportarExcel',
            // Selector de archivos Excel.
            'archivoExcel'
        ];
        // ================================================
        // ELEMENTOS OPCIONALES
        //
        // Controles complementarios cuya ausencia se
        // registra como advertencia de diagnóstico.
        // ================================================
        const opcionales = [
            // Aplicar periodo anual.
            'btnAplicarAnio',
            // Actualizar información general.
            'btnActualizarDatos',
            // Reintentar consultas.
            'btnReintentarCronograma',
            // Historial de actividades y auditoría.
            'tablaHistorialActividadesBody',
            // Historial de importaciones institucionales.
            'tablaHistorialImportacionesBody',
            // Modal de detalle de notificaciones.
            'modalDetalleNotificacion',
            // Estado de conexión con el ERP.
            'estadoConexionERP',
            // Estado del servicio Excel.
            'estadoServicioExcel',
            // Estado de Recursos Humanos.
            'estadoServicioRH',
            // Estado del servicio de correo electrónico.
            'estadoServicioCorreo'
        ];
        // ================================================
        // IDENTIFICAR ELEMENTOS OBLIGATORIOS FALTANTES
        // ================================================
        const faltantes =
            obligatorios.filter(
                id => !$(id)
            );
        // ================================================
        // IDENTIFICAR ELEMENTOS OPCIONALES FALTANTES
        // ================================================
        const opcionalesFaltantes =
            opcionales.filter(
                id => !$(id)
            );
        // ================================================
        // REGISTRAR ERRORES DE ELEMENTOS OBLIGATORIOS
        // ================================================
        if (faltantes.length) {
            console.error(
                '[Transformín] Elementos HTML requeridos no encontrados:',
                faltantes
            );
        }
        // ================================================
        // REGISTRAR ADVERTENCIAS DE ELEMENTOS OPCIONALES
        // ================================================
        if (opcionalesFaltantes.length) {
            console.warn(
                '[Transformín] Elementos HTML opcionales no encontrados:',
                opcionalesFaltantes
            );
        }
        // ================================================
        // DEVOLVER RESULTADO DEL DIAGNÓSTICO
        //
        // Los elementos opcionales faltantes no modifican
        // directamente el indicador success.
        // ================================================
        return {
            success: faltantes.length === 0,
            faltantes,
            opcionalesFaltantes
        };
    }
    // ========================================================
    // 256. DETECTAR IDENTIFICADORES HTML DUPLICADOS
    //
    // Identifica elementos que utilizan el mismo atributo ID
    // dentro del documento HTML.
    //
    // Los identificadores duplicados pueden ocasionar:
    //
    // - Eventos asociados al elemento incorrecto.
    // - Actualización incorrecta de formularios.
    // - Problemas al abrir ventanas modales.
    // - Consultas incorrectas de elementos.
    // - Inconsistencias durante la inicialización.
    //
    // Esta función detecta y registra los duplicados.
    // No modifica automáticamente los identificadores.
    // ========================================================
    function verificarIdsDuplicadosFinal() {
        // Almacenar identificadores y cantidad de apariciones.
        const encontrados =
            new Map();
        // Almacenar identificadores duplicados.
        const duplicados = [];
        // ================================================
        // RECORRER ELEMENTOS CON ATRIBUTO ID
        // ================================================
        document.querySelectorAll(
            '[id]'
        ).forEach(elemento => {
            // Obtener identificador del elemento.
            const id = elemento.id;
            // Incrementar cantidad de apariciones.
            encontrados.set(
                id,
                (
                    encontrados.get(id) || 0
                ) + 1
            );
        });
        // ================================================
        // IDENTIFICAR REGISTROS DUPLICADOS
        //
        // Un identificador se considera duplicado cuando
        // aparece más de una vez dentro del documento.
        // ================================================
        encontrados.forEach(
            (cantidad, id) => {
                if (cantidad > 1) {
                    duplicados.push({
                        id,
                        cantidad
                    });
                }
            }
        );
        // ================================================
        // REGISTRAR ADVERTENCIAS EN CONSOLA
        //
        // Permite identificar el ID duplicado y la cantidad
        // de elementos que utilizan dicho identificador.
        // ================================================
        if (duplicados.length) {
            console.warn(
                '[Transformín] Identificadores HTML duplicados:',
                duplicados
            );
        }
        // ================================================
        // DEVOLVER IDENTIFICADORES DUPLICADOS
        // ================================================
        return duplicados;
    }
    // ========================================================
    // 257. RESOLVER FUNCIONES DE CONFIGURACIÓN
    //
    // Centraliza las funciones responsables de configurar
    // los eventos de los diferentes módulos del cronograma.
    //
    // Utiliza los nombres reales de las funciones existentes
    // para evitar advertencias de funciones no disponibles.
    //
    // Módulos integrados:
    //
    // 01. Calendario y agenda.
    // 02. Actividades manuales.
    // 03. Actividades institucionales FT-SST-147.
    // 04. Cumpleaños de colaboradores.
    // 05. Tarjetas de felicitación.
    // 06. Configuración de recordatorios.
    // 07. Importación y exportación Excel.
    // 08. Historiales y auditoría.
    // ========================================================
    function obtenerConfiguradoresFinal() {
        return [
            // ================================================
            // CONFIGURADOR 01: CALENDARIO
            //
            // Configura la navegación mensual, selección
            // de fechas y eventos asociados al calendario.
            // ================================================
            {
                nombre: 'Eventos del calendario',
                funcion: configurarCalendario
            },
            // ================================================
            // CONFIGURADOR 02: ACTIVIDADES
            //
            // Integra las acciones, filtros y formularios
            // de las actividades manuales e institucionales.
            //
            // Conserva las funcionalidades del formato
            // institucional FT-SST-147.
            // ================================================
            {
                nombre:
                    'Eventos de actividades manuales e institucionales',
                funcion: () => {
                    // Configurar acciones de actividades.
                    configurarAccionesActividades();
                    // Configurar filtros de búsqueda.
                    configurarFiltrosActividades();
                    // Configurar formularios de actividades.
                    configurarFormulariosActividades();
                }
            },
            // ================================================
            // CONFIGURADOR 03: CUMPLEAÑOS Y RECORDATORIOS
            //
            // Centraliza los eventos correspondientes
            // al módulo de Recursos Humanos.
            //
            // Incluye la configuración individual de
            // cumpleaños, tarjetas y recordatorios.
            // ================================================
            {
                nombre:
                    'Eventos de cumpleaños, tarjetas y recordatorios',
                funcion: configurarModuloCumpleanos
            },
            // ================================================
            // CONFIGURADOR 04: GESTIÓN DOCUMENTAL
            //
            // Configura los eventos relacionados con
            // importación, exportación, historiales
            // y auditoría del cronograma.
            // ================================================
            {
                nombre:
                    'Excel, historiales y auditoría',
                funcion: configurarModuloDocumental
            }
        ];
    }
    // ========================================================
    // 258. CONFIGURAR EVENTOS DE MÓDULOS
    //
    // Ejecuta los configuradores definidos anteriormente.
    //
    // Utiliza un conjunto Set para evitar ejecutar varias
    // veces una misma referencia de función durante esta
    // operación de configuración.
    //
    // Registra individualmente los resultados y errores
    // para facilitar el diagnóstico de inicialización.
    // ========================================================
    async function configurarModulosFinal() {
        // Obtener configuradores disponibles.
        const configuradores =
            obtenerConfiguradoresFinal();
        // Registrar referencias de funciones ejecutadas.
        const funcionesEjecutadas =
            new Set();
        // Almacenar resultados de configuración.
        const resultados = [];
        // ====================================================
        // RECORRER CONFIGURADORES
        // ====================================================
        for (
            const configurador
            of configuradores
        ) {
            // ================================================
            // IGNORAR CONFIGURADORES OPCIONALES NO DISPONIBLES
            // ================================================
            if (
                !configurador.funcion &&
                configurador.opcional
            ) {
                continue;
            }
            // ================================================
            // EVITAR EJECUCIÓN REPETIDA DE FUNCIONES
            // ================================================
            if (
                funcionesEjecutadas.has(
                    configurador.funcion
                )
            ) {
                continue;
            }
            // ================================================
            // EJECUTAR CONFIGURADOR
            //
            // Utiliza el controlador general para gestionar
            // el resultado de cada función.
            // ================================================
            const resultado =
                await ejecutarFuncionFinal(
                    configurador.nombre,
                    configurador.funcion
                );
            // Almacenar resultado de configuración.
            resultados.push(resultado);
            // ================================================
            // REGISTRAR FUNCIÓN EJECUTADA
            // ================================================
            if (
                typeof configurador.funcion ===
                'function'
            ) {
                funcionesEjecutadas.add(
                    configurador.funcion
                );
            }
        }
        // ====================================================
        // IDENTIFICAR ERRORES DE CONFIGURACIÓN
        // ====================================================
        const errores =
            resultados.filter(
                resultado =>
                    !resultado.success
            );
        // ====================================================
        // DEVOLVER RESULTADO GENERAL
        //
        // success:
        // Indica si todos los configuradores finalizaron
        // satisfactoriamente.
        //
        // resultados:
        // Contiene los resultados individuales.
        //
        // errores:
        // Contiene las configuraciones no satisfactorias.
        // ====================================================
        return {
            success: errores.length === 0,
            resultados,
            errores
        };
    }
    // ========================================================
    // 259. CONFIGURAR BOTONES GENERALES
    //
    // Registra los eventos de los botones principales
    // de actualización y recuperación del cronograma.
    //
    // Utiliza enlazarEventoFinal para controlar el registro
    // de eventos y evitar controladores repetidos.
    // ========================================================
    function configurarBotonesGeneralesFinal() {
        // ====================================================
        // BOTÓN ACTUALIZAR INFORMACIÓN GENERAL
        //
        // Ejecuta la actualización integral del cronograma
        // mediante actualizarCronogramaFinal.
        // ====================================================
        enlazarEventoFinal(
            'btnActualizarDatos',
            'click',
            'actualizar-general',
            eventoSeguro(async () => {
                await actualizarCronogramaFinal();
            })
        );
        // ====================================================
        // BOTÓN REINTENTAR CONSULTAS
        //
        // Permite ejecutar nuevamente las consultas
        // cuando el módulo presenta errores de conexión
        // o dificultades durante una actualización.
        // ====================================================
        enlazarEventoFinal(
            'btnReintentarCronograma',
            'click',
            'reintentar-general',
            eventoSeguro(async () => {
                await actualizarCronogramaFinal();
            })
        );
    }
    // ========================================================
    // 260. ESTADO DE CONEXIÓN DEL NAVEGADOR
    //
    // Gestiona la pérdida de conectividad detectada
    // por el navegador.
    //
    // Actualiza los indicadores visuales del ERP e informa
    // al usuario que los datos visibles pueden encontrarse
    // desactualizados.
    //
    // No elimina la información previamente consultada.
    // No modifica registros almacenados en MySQL.
    // ========================================================
    function gestionarConexionPerdidaFinal() {
        // ====================================================
        // REGISTRAR PÉRDIDA DE CONECTIVIDAD
        // ====================================================
        estado.conexionDisponible = false;
        // ====================================================
        // ACTUALIZAR INDICADOR DE CONEXIÓN DEL ERP
        //
        // Representa visualmente la interrupción
        // de la conexión de red.
        // ====================================================
        pintarEstadoServicioFinal(
            'estadoConexionERP',
            'Sin conexión',
            'error'
        );
        // ====================================================
        // ACTUALIZAR ESTADO GENERAL DEL MÓDULO
        // ====================================================
        actualizarEstadoModuloFinal(
            'Conexión de red interrumpida',
            'advertencia'
        );
        // ====================================================
        // MOSTRAR ADVERTENCIA GENERAL
        //
        // Informa que la información visible corresponde
        // a los últimos datos recuperados correctamente.
        // ====================================================
        mostrarErrorGeneralCronograma(
            'Se perdió la conexión de red. Los datos visibles pueden estar desactualizados.'
        );
        // ====================================================
        // MOSTRAR NOTIFICACIÓN DE CONECTIVIDAD
        // ====================================================
        notificar(
            'Conexión de red interrumpida.',
            'advertencia'
        );
    }
    // ========================================================
    // 261. RESTABLECIMIENTO DE CONEXIÓN
    //
    // Recupera la comunicación con el ERP después de una
    // interrupción de la conexión de red.
    //
    // Protege los formularios abiertos y las operaciones
    // pendientes antes de actualizar la información.
    // ========================================================
    async function gestionarConexionRestablecidaFinal() {
        // Registrar recuperación de la conexión.
        estado.conexionDisponible = true;
        // Informar que se está verificando el servidor.
        actualizarEstadoModuloFinal(
            'Verificando conexión con el ERP...'
        );
        // Evitar interrumpir operaciones activas.
        if (
            existeFormularioAbiertoFinal() ||
            existenOperacionesPendientesFinal()
        ) {
            notificar(
                'Conexión de red restablecida. Puedes continuar con la operación actual.'
            );
            return;
        }
        // Actualizar información sin interrumpir al usuario.
        await actualizarCronogramaFinal({
            silenciosa: true,
            historiales: true,
            configuracion: false
        });
    }
    // ========================================================
    // 262. CONFIGURAR EVENTOS DE CONECTIVIDAD
    //
    // Registra los eventos online y offline del navegador.
    //
    // Permite detectar automáticamente la pérdida y
    // recuperación de la conexión de red.
    // ========================================================
    function configurarConexionFinal() {
        // Detectar pérdida de conexión.
        enlazarEventoFinal(
            window,
            'offline',
            'conexion-perdida',
            gestionarConexionPerdidaFinal
        );
        // Detectar recuperación de conexión.
        enlazarEventoFinal(
            window,
            'online',
            'conexion-restablecida',
            eventoSeguro(
                gestionarConexionRestablecidaFinal
            )
        );
    }
    // ========================================================
    // 263. ACTUALIZACIÓN AUTOMÁTICA CONTROLADA
    //
    // Actualiza periódicamente la información del cronograma
    // sin necesidad de recargar completamente la página.
    //
    // Condiciones para ejecutar la actualización:
    //
    // 01. El módulo debe estar inicializado.
    // 02. La página debe estar visible.
    // 03. Debe existir conexión de red.
    // 04. No deben existir formularios abiertos.
    // 05. No deben existir operaciones pendientes.
    //
    // Protege la configuración de recordatorios mientras
    // el administrador se encuentra modificándola.
    // ========================================================
    async function actualizacionAutomaticaFinal() {
        // Comprobar condiciones de actualización.
        if (
            !estado.inicializado ||
            document.hidden ||
            !navigator.onLine ||
            existeFormularioAbiertoFinal() ||
            existenOperacionesPendientesFinal()
        ) {
            return;
        }
        // Identificar pestaña actualmente seleccionada.
        const pestana =
            obtenerPestanaActivaFinal();
        // Evitar sobrescribir configuraciones que
        // el administrador esté modificando.
        if (
            pestana === 'tab-recordatorios'
        ) {
            return;
        }
        // Ejecutar actualización silenciosa.
        //
        // Los historiales solamente se consultan cuando
        // el usuario está visualizando dicha pestaña.
        //
        // La configuración general permanece sin cambios.
        await actualizarCronogramaFinal({
            silenciosa: true,
            historiales:
                pestana === 'tab-historial',
            configuracion: false
        });
    }
    // ========================================================
    // 264. INICIAR TEMPORIZADORES
    //
    // Configura los intervalos responsables de actualizar
    // periódicamente la información y la fecha institucional.
    //
    // Detiene los temporizadores anteriores antes de
    // crear nuevos intervalos.
    //
    // Evita consultas repetidas por temporizadores duplicados.
    // ========================================================
    function iniciarTemporizadoresFinal() {
        // Eliminar temporizadores anteriores.
        detenerTemporizadoresFinal();
        // ====================================================
        // TEMPORIZADOR DE ACTUALIZACIÓN GENERAL
        //
        // Utiliza el intervalo establecido en
        // CONFIG_INICIALIZACION.intervaloActualizacion.
        //
        // Registra posibles errores en la consola sin
        // interrumpir el funcionamiento de la interfaz.
        // ====================================================
        estado.intervaloGeneral =
            window.setInterval(
                () => {
                    void actualizacionAutomaticaFinal()
                        .catch(error => {
                            console.warn(
                                '[Transformín] Actualización automática:',
                                error
                            );
                        });
                },
                CONFIG_INICIALIZACION.intervaloActualizacion
            );
        // ====================================================
        // TEMPORIZADOR DE FECHA INSTITUCIONAL
        //
        // Mantiene actualizada la representación de la fecha
        // mediante la configuración general del módulo.
        // ====================================================
        estado.intervaloFecha =
            window.setInterval(
                actualizarFechaInstitucionalFinal,
                CONFIG_INICIALIZACION.intervaloFecha
            );
    }
    // ========================================================
    // 265. DETENER TEMPORIZADORES
    //
    // Libera los intervalos activos del cronograma.
    //
    // Permite reiniciar los temporizadores sin duplicarlos
    // y facilita la liberación de recursos del navegador.
    // ========================================================
    function detenerTemporizadoresFinal() {
        // ====================================================
        // DETENER ACTUALIZACIÓN GENERAL
        // ====================================================
        if (
            estado.intervaloGeneral !== null
        ) {
            window.clearInterval(
                estado.intervaloGeneral
            );
            estado.intervaloGeneral = null;
        }
        // ====================================================
        // DETENER ACTUALIZACIÓN DE FECHA
        // ====================================================
        if (
            estado.intervaloFecha !== null
        ) {
            window.clearInterval(
                estado.intervaloFecha
            );
            estado.intervaloFecha = null;
        }
    }
    // ========================================================
    // 266. CONTROL DE VISIBILIDAD DE LA PÁGINA
    //
    // Actualiza la información cuando el usuario regresa
    // a la pestaña del Cronograma de Transformín.
    //
    // Evita consultas innecesarias cuando la página está
    // oculta o existen operaciones pendientes.
    // ========================================================
    function configurarVisibilidadFinal() {
        enlazarEventoFinal(
            document,
            'visibilitychange',
            'visibilidad-cronograma',
            eventoSeguro(async () => {
                // Verificar visibilidad e inicialización.
                if (
                    document.hidden ||
                    !estado.inicializado
                ) {
                    return;
                }
                // Actualizar fecha institucional.
                actualizarFechaInstitucionalFinal();
                // Proteger formularios y operaciones activas.
                if (
                    existeFormularioAbiertoFinal() ||
                    existenOperacionesPendientesFinal()
                ) {
                    return;
                }
                // Recuperar fecha de la última actualización.
                const ultima =
                    estado.ultimaActualizacion
                        instanceof Date
                        ? estado.ultimaActualizacion.getTime()
                        : 0;
                // Calcular tiempo transcurrido.
                const diferencia =
                    Date.now() - ultima;
                // Actualizar únicamente cuando se cumpla
                // el intervalo de actualización configurado.
                if (
                    diferencia >=
                    CONFIG_INICIALIZACION.intervaloActualizacion
                ) {
                    await actualizacionAutomaticaFinal();
                }
            })
        );
    }
    // ========================================================
    // 267. CORRECCIÓN DE ACTUALIZACIÓN POSTIMPORTACIÓN
    //
    // Actualiza los componentes afectados después de
    // importar el documento institucional FT-SST-147.
    //
    // Conserva la independencia entre el periodo activo
    // y el periodo seleccionado para la importación.
    //
    // Componentes:
    //
    // 01. Cronograma institucional.
    // 02. Información general del periodo.
    // 03. Historial de importaciones.
    // 04. Auditoría de actividades.
    // ========================================================
    async function refrescarImportacionFinal(anio) {
        // Validar periodo del documento importado.
        const periodo =
            validarPeriodoFinal(anio);
        // Almacenar consultas necesarias.
        const tareas = [];
        // ====================================================
        // ACTUALIZAR INFORMACIÓN DEL PERIODO ACTIVO
        //
        // Solamente actualiza el cronograma principal cuando
        // el año importado coincide con el año visualizado.
        // ====================================================
        if (
            periodo === Number(estado.anio)
        ) {
            tareas.push({
                nombre: 'Cronograma importado',
                funcion:
                    cargarPeriodoGeneralFinal
            });
        }
        // ====================================================
        // ACTUALIZAR HISTORIAL DE IMPORTACIONES
        //
        // Comprueba si el historial está mostrando el mismo
        // periodo correspondiente al documento importado.
        // ====================================================
        if (
            Number(
                campo('anioHistorialImportaciones') ||
                estado.anio
            ) === periodo
        ) {
            tareas.push({
                nombre: 'Historial de importaciones',
                funcion:
                    cargarHistorialImportaciones
            });
        }
        // ====================================================
        // ACTUALIZAR AUDITORÍA
        //
        // Consulta los movimientos registrados después
        // de realizar la importación institucional.
        // ====================================================
        tareas.push({
            nombre: 'Auditoría',
            funcion:
                cargarHistorialActividades
        });
        // Ejecutar consultas correspondientes.
        const resultado =
            await ejecutarGrupoFinal(tareas);
        // Informar dificultades de actualización sin
        // confundirlas con un error de importación.
        if (!resultado.success) {
            notificar(
                'La importación se realizó, pero algunos datos requieren actualización.',
                'advertencia'
            );
        }
        // Devolver resultado de actualización.
        return resultado;
    }
    // ========================================================
    // 268. CORRECCIÓN DE CONTROLES DE IMPORTACIÓN
    //
    // Restablece los controles del formulario de Excel
    // según el estado actual del archivo seleccionado.
    //
    // Evita habilitar la confirmación de importación
    // cuando el documento todavía no ha sido validado.
    // ========================================================
    function restaurarControlesExcelFinal() {
        // No modificar controles durante una operación activa.
        if (
            estado.importandoExcel ||
            estado.validandoExcel
        ) {
            return;
        }
        // ====================================================
        // BOTÓN VALIDAR DOCUMENTO
        //
        // Disponible únicamente cuando existe un archivo
        // Excel seleccionado.
        // ====================================================
        deshabilitar(
            'btnValidarExcel',
            !estado.archivoExcelSeleccionado
        );
        // ====================================================
        // BOTÓN CONFIRMAR IMPORTACIÓN
        //
        // Disponible únicamente cuando la validación
        // del documento ha sido satisfactoria.
        // ====================================================
        deshabilitar(
            'btnConfirmarImportacion',
            !estado.importacionValida
        );
        // ====================================================
        // BOTÓN QUITAR ARCHIVO
        //
        // Permite retirar el documento seleccionado.
        // ====================================================
        deshabilitar(
            'btnQuitarArchivoExcel',
            !estado.archivoExcelSeleccionado
        );
        // Habilitar selector del periodo de importación.
        deshabilitar(
            'anioImportarExcel',
            false
        );
    }
    // ========================================================
    // 269. SINCRONIZAR CONTROLES DEL MODAL EXCEL
    //
    // Configura los eventos de apertura y cierre de los
    // modales de importación y exportación institucional.
    //
    // Mantiene sincronizados los botones, validaciones
    // y resúmenes documentales.
    // ========================================================
    function configurarCompatibilidadExcelFinal() {
        // ====================================================
        // APERTURA DEL MODAL DE IMPORTACIÓN
        // ====================================================
        enlazarEventoFinal(
            'modalImportarExcel',
            'shown.bs.modal',
            'restaurar-controles-excel',
            restaurarControlesExcelFinal
        );
        // ====================================================
        // CIERRE DEL MODAL DE IMPORTACIÓN
        //
        // Restablece los controles según el estado actual
        // de la operación documental.
        // ====================================================
        enlazarEventoFinal(
            'modalImportarExcel',
            'hidden.bs.modal',
            'limpiar-controles-excel',
            restaurarControlesExcelFinal
        );
        // ====================================================
        // APERTURA DEL MODAL DE EXPORTACIÓN
        //
        // Representa nuevamente el resumen documental
        // cuando existe información previamente consultada.
        // ====================================================
        enlazarEventoFinal(
            'modalExportarExcel',
            'shown.bs.modal',
            'sincronizar-exportacion',
            () => {
                if (
                    estado.resumenExportacion
                ) {
                    pintarResumenExportacion();
                }
            }
        );
    }
    // ========================================================
    // 270. LIBERAR RECURSOS TEMPORALES
    //
    // Libera los recursos utilizados por el cronograma
    // cuando corresponde finalizar su utilización.
    //
    // Recursos gestionados:
    //
    // 01. Temporizadores de actualización.
    // 02. Temporizador de fecha institucional.
    // 03. Validaciones pendientes de Excel.
    // 04. Previsualizaciones de tarjetas.
    // 05. Recursos temporales de cumpleaños.
    //
    // No elimina registros de la base de datos.
    // ========================================================
    function liberarRecursosFinal() {
        // Detener temporizadores activos.
        detenerTemporizadoresFinal();
        // ====================================================
        // CANCELAR VALIDACIÓN PENDIENTE DE EXCEL
        // ====================================================
        if (
            typeof cancelarValidacionExcel ===
            'function'
        ) {
            cancelarValidacionExcel();
        }
        // ====================================================
        // LIBERAR RECURSOS DE TARJETAS
        // ====================================================
        if (
            typeof liberarTarjeta ===
            'function'
        ) {
            liberarTarjeta();
        }
        // ====================================================
        // LIBERAR RECURSOS ADICIONALES DE CUMPLEAÑOS
        //
        // Mantiene compatibilidad cuando existe una función
        // adicional para liberar tarjetas de felicitación.
        // ====================================================
        if (
            typeof liberarTarjetaCumpleanos ===
            'function'
        ) {
            liberarTarjetaCumpleanos();
        }
    }
    // ========================================================
    // 271. CONTROL DE SALIDA Y REGRESO A LA PÁGINA
    //
    // Libera los recursos cuando el usuario abandona la
    // página y restablece los temporizadores cuando regresa.
    //
    // Compatible con la caché de navegación del navegador.
    // ========================================================
    function configurarCicloPaginaFinal() {
        // Liberar recursos al abandonar la página.
        enlazarEventoFinal(
            window,
            'pagehide',
            'liberar-recursos',
            liberarRecursosFinal
        );
        // Restaurar recursos al regresar a la página.
        enlazarEventoFinal(
            window,
            'pageshow',
            'restaurar-recursos',
            eventoSeguro(async evento => {
                // Comprobar que la página fue recuperada
                // desde la caché y estaba inicializada.
                if (
                    !evento.persisted ||
                    !estado.inicializado
                ) {
                    return;
                }
                // Restablecer temporizadores.
                iniciarTemporizadoresFinal();
                // Actualizar fecha institucional.
                actualizarFechaInstitucionalFinal();
                // Actualizar información cuando no existan
                // operaciones pendientes.
                if (
                    !existenOperacionesPendientesFinal()
                ) {
                    await actualizacionAutomaticaFinal();
                }
            })
        );
    }
    // ========================================================
    // 272. ACCESIBILIDAD DE ESTADOS DINÁMICOS
    //
    // Configura atributos ARIA para facilitar la lectura
    // de mensajes, errores y estados dinámicos mediante
    // tecnologías de asistencia.
    //
    // No modifica la apariencia visual del módulo.
    // ========================================================
    function configurarAccesibilidadFinal() {
        // ====================================================
        // CONFIGURAR ANUNCIOS DEL CRONOGRAMA
        // ====================================================
        const anuncios =
            $('anunciosCronograma');
        if (anuncios) {
            // Anunciar cambios sin interrumpir al usuario.
            anuncios.setAttribute(
                'aria-live',
                'polite'
            );
            // Leer el contenido completo del anuncio.
            anuncios.setAttribute(
                'aria-atomic',
                'true'
            );
        }
        // ====================================================
        // CONFIGURAR ALERTAS DE ERROR
        // ====================================================
        const error =
            $('alertaErrorCronograma');
        if (error) {
            // Identificar el elemento como alerta.
            error.setAttribute(
                'role',
                'alert'
            );
        }
        // ====================================================
        // CONFIGURAR ESTADO GENERAL DEL MÓDULO
        // ====================================================
        const estadoModulo =
            $('estadoModuloTexto');
        if (estadoModulo) {
            // Identificar el elemento como indicador de estado.
            estadoModulo.setAttribute(
                'role',
                'status'
            );
            // Anunciar actualizaciones del estado general.
            estadoModulo.setAttribute(
                'aria-live',
                'polite'
            );
        }
    }
    // ========================================================
    // 273. DIAGNÓSTICO DE FUNCIONES COMPARTIDAS
    //
    // Comprueba que las funciones principales utilizadas
    // por los diferentes módulos estén disponibles.
    //
    // Permite identificar funciones faltantes antes de
    // ejecutar la inicialización general del cronograma.
    //
    // Componentes verificados:
    //
    // 01. Utilidades generales.
    // 02. Peticiones al backend.
    // 03. Manipulación de elementos HTML.
    // 04. Validación de información.
    // 05. Notificaciones y errores.
    // 06. Ventanas modales.
    // 07. Actividades manuales e institucionales.
    // 08. Recursos Humanos.
    // 09. Configuración de recordatorios.
    // 10. Indicadores y cumplimiento.
    // 11. Calendario y agenda.
    // ========================================================
    function verificarFuncionesCompartidasFinal() {
        // ====================================================
        // COMPROBAR DISPONIBILIDAD DE FUNCIONES
        // ====================================================
        const funciones = {
            // Localización de elementos HTML.
            $:
                typeof $ === 'function',
            // Comunicación con el backend.
            peticion:
                typeof peticion === 'function',
            // Actualización de contenido de texto.
            texto:
                typeof texto === 'function',
            // Actualización de contenido HTML.
            html:
                typeof html === 'function',
            // Obtener valores de formularios.
            campo:
                typeof campo === 'function',
            // Establecer valores de formularios.
            setCampo:
                typeof setCampo === 'function',
            // Controlar visibilidad de elementos.
            visible:
                typeof visible === 'function',
            // Escapar contenido dinámico.
            escapar:
                typeof escapar === 'function',
            // Normalización de valores numéricos.
            numero:
                typeof numero === 'function',
            // Notificaciones de la interfaz.
            notificar:
                typeof notificar === 'function',
            // Gestión centralizada de errores.
            manejarError:
                typeof manejarError === 'function',
            // Ejecución controlada de eventos.
            eventoSeguro:
                typeof eventoSeguro === 'function',
            // Indicadores de carga de botones.
            botonCargando:
                typeof botonCargando === 'function',
            // Apertura de ventanas modales.
            abrirModal:
                typeof abrirModal === 'function',
            // Cierre de ventanas modales.
            cerrarModal:
                typeof cerrarModal === 'function',
            // Extracción de listas de respuestas.
            extraerLista:
                typeof extraerLista === 'function',
            // Validación de identificadores.
            validarId:
                typeof validarId === 'function',
            // Normalización de valores booleanos de RH.
            booleanoRH:
                typeof booleanoRH === 'function',
            // Incorporación del periodo anual en consultas.
            conAnio:
                typeof conAnio === 'function',
            // Consulta de actividades manuales.
            cargarActividades:
                typeof cargarActividades === 'function',
            // Consulta del formato institucional FT-SST-147.
            cargarInstitucional:
                typeof cargarInstitucional === 'function',
            // Consulta de cumpleaños de colaboradores.
            cargarCumpleanos:
                typeof cargarCumpleanos === 'function',
            // Consulta de configuración de recordatorios.
            cargarConfiguracion:
                typeof cargarConfiguracion === 'function',
            // Consulta de indicadores generales.
            cargarIndicadores:
                typeof cargarIndicadores === 'function',
            // Consulta de cumplimiento anual.
            cargarCumplimiento:
                typeof cargarCumplimiento === 'function',
            // Representación del calendario mensual.
            pintarCalendario:
                typeof pintarCalendario === 'function',
            // Representación de la agenda.
            pintarAgenda:
                typeof pintarAgenda === 'function'
        };
        // ====================================================
        // IDENTIFICAR FUNCIONES FALTANTES
        //
        // Convierte el objeto de funciones verificadas en
        // una lista y recupera únicamente los nombres de
        // aquellas que no se encuentran disponibles.
        // ====================================================
        const faltantes =
            Object.entries(funciones)
                .filter(
                    ([, disponible]) =>
                        !disponible
                )
                .map(
                    ([nombre]) => nombre
                );
        // ====================================================
        // REGISTRAR ERRORES DE COMPATIBILIDAD
        // ====================================================
        if (faltantes.length) {
            console.error(
                '[Transformín] Funciones compartidas faltantes:',
                faltantes
            );
        }
        // ====================================================
        // DEVOLVER RESULTADO DEL DIAGNÓSTICO
        //
        // success:
        // Indica si todas las funciones están disponibles.
        //
        // funciones:
        // Contiene el resultado individual de cada función.
        //
        // faltantes:
        // Contiene los nombres de las funciones no disponibles.
        // ====================================================
        return {
            success: faltantes.length === 0,
            funciones,
            faltantes
        };
    }
    // ========================================================
    // 274. CONFIGURACIÓN GENERAL DE EVENTOS
    //
    // Centraliza la configuración de eventos generales
    // del Cronograma de Transformín.
    //
    // Evita repetir la configuración cuando los eventos
    // generales ya fueron registrados anteriormente.
    // ========================================================
    function configurarEventosGeneralesFinal() {
        // Impedir configuraciones repetidas.
        if (
            estado.eventosGeneralesConfigurados
        ) {
            return;
        }
        // ====================================================
        // CONFIGURAR EVENTOS DEL PERIODO ANUAL
        // ====================================================
        configurarEventosPeriodoFinal();
        // ====================================================
        // CONFIGURAR BOTONES GENERALES
        // ====================================================
        configurarBotonesGeneralesFinal();
        // ====================================================
        // CONFIGURAR NAVEGACIÓN ENTRE PESTAÑAS
        // ====================================================
        configurarPestanasFinal();
        // ====================================================
        // CONFIGURAR COMPATIBILIDAD DE MODALES
        // ====================================================
        configurarModalesFinal();
        // ====================================================
        // CONFIGURAR APERTURA Y CIERRE DE MODALES
        // ====================================================
        configurarAperturaModalesFinal();
        // ====================================================
        // CONFIGURAR EVENTOS DE CONECTIVIDAD
        // ====================================================
        configurarConexionFinal();
        // ====================================================
        // CONFIGURAR VISIBILIDAD DE LA PÁGINA
        // ====================================================
        configurarVisibilidadFinal();
        // ====================================================
        // CONFIGURAR CICLO DE VIDA DE LA PÁGINA
        // ====================================================
        configurarCicloPaginaFinal();
        // ====================================================
        // CONFIGURAR COMPATIBILIDAD DOCUMENTAL EXCEL
        // ====================================================
        configurarCompatibilidadExcelFinal();
        // ====================================================
        // CONFIGURAR PROTECCIÓN DE FORMULARIOS
        // ====================================================
        configurarFormulariosFinal();
        // ====================================================
        // CONFIGURAR ACCESIBILIDAD DE LA INTERFAZ
        // ====================================================
        configurarAccesibilidadFinal();
        // ====================================================
        // REGISTRAR CONFIGURACIÓN COMPLETADA
        //
        // Evita ejecutar nuevamente la configuración
        // general durante futuras actualizaciones.
        // ====================================================
        estado.eventosGeneralesConfigurados = true;
    }
    // ========================================================
    // 275. PREPARAR INTERFAZ ANTES DE CONSULTAR DATOS
    //
    // Establece las condiciones iniciales de la interfaz
    // antes de ejecutar las consultas al backend.
    //
    // Componentes preparados:
    //
    // 01. Selector principal del periodo anual.
    // 02. Prioridades compatibles.
    // 03. Filtros de cumpleaños.
    // 04. Botones y controles.
    // 05. Fecha institucional.
    // 06. Sincronización del periodo.
    // 07. Importación documental.
    // 08. Indicadores de servicios.
    // 09. Estado general de inicialización.
    // ========================================================
    function prepararInterfazFinal() {
        // ====================================================
        // PREPARAR SELECTOR PRINCIPAL DE AÑO
        //
        // Compatible con años anteriores y posteriores.
        // ====================================================
        prepararSelectorPrincipalFinal();
        // ====================================================
        // CONFIGURAR PRIORIDADES
        //
        // Valores permitidos: BAJA, MEDIA y ALTA.
        // ====================================================
        configurarPrioridadesFinal();
        // ====================================================
        // CONFIGURAR FILTROS DE CUMPLEAÑOS
        // ====================================================
        configurarFiltroCumpleanosFinal();
        // ====================================================
        // NORMALIZAR BOTONES DE LA INTERFAZ
        // ====================================================
        configurarBotonesFinal();
        // ====================================================
        // ACTUALIZAR FECHA INSTITUCIONAL
        // ====================================================
        actualizarFechaInstitucionalFinal();
        // ====================================================
        // SINCRONIZAR PERIODO ANUAL
        // ====================================================
        sincronizarPeriodoGeneral();
        // ====================================================
        // LIMPIAR ESTADO DE IMPORTACIÓN DOCUMENTAL
        //
        // Restablece la información temporal de Excel
        // antes de iniciar las consultas generales.
        // ====================================================
        limpiarImportacionDocumental();
        // ====================================================
        // RESTAURAR CONTROLES DE IMPORTACIÓN EXCEL
        // ====================================================
        restaurarControlesExcelFinal();
        // ====================================================
        // OCULTAR MENSAJES DE ERRORES ANTERIORES
        // ====================================================
        ocultarErrorGeneralCronograma();
        // ====================================================
        // ESTADO INICIAL DE CONEXIÓN CON EL ERP
        // ====================================================
        pintarEstadoServicioFinal(
            'estadoConexionERP',
            'Verificando...'
        );
        // ====================================================
        // ESTADO INICIAL DEL SERVICIO EXCEL
        // ====================================================
        pintarEstadoServicioFinal(
            'estadoServicioExcel',
            'Verificando...'
        );
        // ====================================================
        // ESTADO INICIAL DE RECURSOS HUMANOS
        // ====================================================
        pintarEstadoServicioFinal(
            'estadoServicioRH',
            'Verificando...'
        );
        // ====================================================
        // ESTADO INICIAL DEL SERVICIO DE CORREO
        //
        // No realiza envíos ni confirma la disponibilidad
        // del servidor SMTP antes de verificarlo.
        // ====================================================
        pintarEstadoServicioFinal(
            'estadoServicioCorreo',
            'Sin verificar'
        );
        // ====================================================
        // ESTABLECER ESTADO GENERAL DE INICIALIZACIÓN
        // ====================================================
        actualizarEstadoModuloFinal(
            'Inicializando cronograma...'
        );
    }
    // ========================================================
    // 276. INICIALIZACIÓN PRINCIPAL
    //
    // Coordina la inicialización completa del frontend.
    //
    // Verifica las dependencias, funciones compartidas,
    // elementos HTML, identificadores duplicados, eventos,
    // servicios del ERP y temporizadores.
    // ========================================================
    async function inicializarCronogramaTransforminFinal() {
        // Verificar que corresponde a la página del módulo.
        if (
            document.body?.dataset.pagina !==
            CONFIG_INICIALIZACION.pagina
        ) {
            return;
        }
        // Evitar inicializaciones simultáneas o repetidas.
        if (
            estado.inicializado ||
            estado.inicializando
        ) {
            return;
        }
        // Registrar inicialización activa.
        estado.inicializando = true;
        let cargaActivada = false;
        try {
            // ================================================
            // VERIFICAR DEPENDENCIAS DEL FRONTEND
            // ================================================
            const dependencias =
                verificarDependenciasFinal();
            if (!dependencias.success) {
                throw new Error(
                    dependencias.errores.join(' ')
                );
            }
            // ================================================
            // VERIFICAR FUNCIONES COMPARTIDAS
            // ================================================
            const funciones =
                verificarFuncionesCompartidasFinal();
            if (!funciones.success) {
                throw new Error(
                    `Funciones JavaScript faltantes: ${funciones.faltantes.join(', ')}.`
                );
            }
            // ================================================
            // ACTIVAR INDICADOR GENERAL DE CARGA
            // ================================================
            if (
                typeof cargando === 'function'
            ) {
                cargando(true);
                cargaActivada = true;
            }
            // ================================================
            // VERIFICAR ELEMENTOS DEL DOCUMENTO HTML
            // ================================================
            const elementos =
                verificarElementosFinal();
            // ================================================
            // DETECTAR IDENTIFICADORES HTML DUPLICADOS
            // ================================================
            const duplicados =
                verificarIdsDuplicadosFinal();
            // ================================================
            // PREPARAR INTERFAZ DEL CRONOGRAMA
            // ================================================
            prepararInterfazFinal();
            // ================================================
            // CONFIGURAR EVENTOS GENERALES
            // ================================================
            configurarEventosGeneralesFinal();
            // ================================================
            // CONFIGURAR MÓDULOS DEL CRONOGRAMA
            //
            // Calendario, actividades, cumpleaños,
            // recordatorios, Excel e historiales.
            // ================================================
            const configuracion =
                await configurarModulosFinal();
            // Se considera inicializado el frontend
            // cuando sus eventos ya fueron registrados.
            // Esto no significa que el backend esté operativo.
            estado.inicializado = true;
            // ================================================
            // EJECUTAR CONSULTAS INICIALES
            //
            // Actualiza la información sin generar mensajes
            // innecesarios durante la apertura del módulo.
            // ================================================
            const resultado =
                await actualizarCronogramaFinal({
                    silenciosa: true,
                    historiales: true,
                    configuracion: true
                });
            // ================================================
            // INICIAR TEMPORIZADORES
            // ================================================
            iniciarTemporizadoresFinal();
            // ================================================
            // REGISTRAR INCIDENCIAS DE INICIALIZACIÓN
            // ================================================
            const incidencias = [];
            // Verificar elementos HTML faltantes.
            if (!elementos.success) {
                incidencias.push(
                    `Elementos HTML faltantes: ${elementos.faltantes.join(', ')}.`
                );
            }
            // Verificar identificadores duplicados.
            if (duplicados.length) {
                incidencias.push(
                    'Existen identificadores HTML duplicados.'
                );
            }
            // Verificar configuración de eventos.
            if (!configuracion.success) {
                incidencias.push(
                    'Algunos eventos de los módulos requieren revisión.'
                );
            }
            // Verificar consultas de servicios.
            if (!resultado.success) {
                incidencias.push(
                    'Algunos servicios del ERP no pudieron consultarse.'
                );
            }
            // ================================================
            // INICIALIZACIÓN CON OBSERVACIONES
            //
            // Conserva disponible la información recuperada
            // y registra los componentes que requieren
            // revisión en la consola del navegador.
            // ================================================
            if (incidencias.length) {
                actualizarEstadoModuloFinal(
                    'Módulo iniciado con observaciones',
                    'advertencia'
                );
                mostrarErrorGeneralCronograma(
                    incidencias.join(' ')
                );
                console.warn(
                    '[Transformín] Inicialización con observaciones:',
                    {
                        elementos,
                        duplicados,
                        configuracion,
                        resultado
                    }
                );
            } else {
                // ============================================
                // INICIALIZACIÓN SATISFACTORIA
                // ============================================
                actualizarEstadoModuloFinal(
                    'Cronograma operativo',
                    'correcto'
                );
                console.info(
                    '[Transformín] Inicialización completada.'
                );
            }
        } catch (error) {
            // ================================================
            // CONTROLAR ERRORES DE INICIALIZACIÓN
            // ================================================
            estado.inicializado = false;
            console.error(
                '[Transformín] Error de inicialización:',
                error
            );
            // Actualizar estado general del módulo.
            actualizarEstadoModuloFinal(
                'Error de inicialización',
                'error'
            );
            // Mostrar descripción del error.
            mostrarErrorGeneralCronograma(
                error.message ||
                'No fue posible iniciar el módulo.'
            );
            // Mostrar notificación cuando esté disponible.
            if (
                typeof notificar === 'function'
            ) {
                notificar(
                    'No fue posible iniciar completamente el cronograma.',
                    'error'
                );
            }
        } finally {
            // ================================================
            // LIBERAR ESTADO DE INICIALIZACIÓN
            // ================================================
            estado.inicializando = false;
            // Desactivar indicador general de carga.
            if (
                cargaActivada &&
                typeof cargando === 'function'
            ) {
                cargando(false);
            }
        }
    }
    // ========================================================
    // 277. DIAGNÓSTICO LOCAL PARA DESARROLLO
    //
    // Recupera información sobre el estado del frontend
    // para facilitar la identificación de inconsistencias.
    //
    // No modifica registros ni ejecuta operaciones
    // de escritura sobre la base de datos.
    // ========================================================
    function obtenerDiagnosticoLocalFinal() {
        return {
            // Identificación del módulo.
            modulo:
                'Cronograma de Transformín',
            empresa:
                'Procesados Margarita S.A.S.',
            formato:
                'FT-SST-147',
            // Periodo anual activo.
            anio:
                estado.anio,
            // Estado de inicialización.
            inicializado:
                estado.inicializado,
            inicializando:
                estado.inicializando,
            // Estado de conexión del navegador.
            conexion:
                navigator.onLine,
            // Última actualización registrada.
            ultimaActualizacion:
                estado.ultimaActualizacion,
            // Diagnóstico de dependencias.
            dependencias:
                verificarDependenciasFinal(),
            // Diagnóstico de elementos HTML.
            elementos:
                verificarElementosFinal(),
            // Diagnóstico de funciones JavaScript.
            funciones:
                verificarFuncionesCompartidasFinal(),
            // Diagnóstico de identificadores duplicados.
            idsDuplicados:
                verificarIdsDuplicadosFinal()
        };
    }
    // ========================================================
    // 278. HABILITAR DIAGNÓSTICO DE DESARROLLO
    //
    // Expone una función de diagnóstico únicamente cuando
    // la configuración de depuración está habilitada.
    //
    // Uso desde la consola del navegador:
    //
    // TransforminDiagnostico.consultar()
    //
    // Mantener deshabilitado en producción cuando
    // no sea necesario realizar pruebas.
    // ========================================================
    if (
        CONFIG_INICIALIZACION.depuracion
    ) {
        Object.defineProperty(
            window,
            'TransforminDiagnostico',
            {
                configurable: true,
                enumerable: false,
                writable: false,
                value: Object.freeze({
                    consultar:
                        obtenerDiagnosticoLocalFinal
                })
            }
        );
    }
    // ========================================================
    // 279. EJECUTAR CUANDO EL DOCUMENTO ESTÉ DISPONIBLE
    //
    // Garantiza que la inicialización del cronograma
    // se ejecute cuando el documento HTML esté disponible.
    //
    // Compatible con scripts cargados antes o después
    // del evento DOMContentLoaded.
    // ========================================================
    function iniciarDocumentoFinal() {
        void inicializarCronogramaTransforminFinal()
            .catch(error => {
                console.error(
                    '[Transformín] Error general:',
                    error
                );
            });
    }
    // ========================================================
    // COMPROBAR ESTADO DEL DOCUMENTO
    // ========================================================
    if (
        document.readyState === 'loading'
    ) {
        // Esperar a que el documento esté disponible.
        document.addEventListener(
            'DOMContentLoaded',
            iniciarDocumentoFinal,
            {
                once: true
            }
        );
    } else {
        // El documento ya está disponible.
        iniciarDocumentoFinal();
    }
})();