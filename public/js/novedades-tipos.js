(function (global) {
    'use strict';

    /* ============================================================
       1. CATÁLOGO DE TIPOS DE NOVEDAD
       Estructura alineada con la tabla nomina_novedades_tipos
       ============================================================ */

    const TIPOS_NOVEDAD_FALLBACK = Object.freeze([

        // --- ASISTENCIA ---
        {
            id: 1,
            codigo: 'ASISTENCIA',
            nombre: 'Ausencia',
            categoria: 'ASISTENCIA',
            descripcion: 'Ausencia justificada o injustificada.',
            permite_empleado: 1,
            requiere_soporte: 1,
            requiere_aprobacion: 1,
            icono: 'fa-user-clock'
        },

        // --- DESCUENTOS ---
        {
            id: 2,
            codigo: 'DESCUENTOS',
            nombre: 'Descuento autorizado',
            categoria: 'DESCUENTOS',
            descripcion: 'Descuentos por libranzas, embargos o autorizaciones.',
            permite_empleado: 1,
            requiere_soporte: 1,
            requiere_aprobacion: 1,
            icono: 'fa-hand-holding-dollar'
        },

        // --- INGRESOS ---
        {
            id: 3,
            codigo: 'INGRESOS',
            nombre: 'Ingreso variable',
            categoria: 'INGRESOS',
            descripcion: 'Bonificaciones, comisiones o pagos adicionales.',
            permite_empleado: 1,
            requiere_soporte: 0,
            requiere_aprobacion: 1,
            icono: 'fa-arrow-trend-up'
        },

        // --- PRESTAMOS ---
        {
            id: 4,
            codigo: 'PRESTAMOS',
            nombre: 'Anticipo de salario',
            categoria: 'PRESTAMOS',
            descripcion: 'Adelanto de nómina a empleados.',
            permite_empleado: 1,
            requiere_soporte: 0,
            requiere_aprobacion: 1,
            icono: 'fa-money-bill-wave'
        },
        {
            id: 5,
            codigo: 'PRESTAMOS',
            nombre: 'Solicitud de préstamo',
            categoria: 'PRESTAMOS',
            descripcion: 'Solicitud formal de préstamo a la empresa.',
            permite_empleado: 1,
            requiere_soporte: 1,
            requiere_aprobacion: 1,
            icono: 'fa-file-signature'
        },

        // --- SALUD ---
        {
            id: 6,
            codigo: 'SALUD',
            nombre: 'Incapacidad',
            categoria: 'SALUD',
            descripcion: 'Incapacidad médica, ARL o licencia por enfermedad.',
            permite_empleado: 1,
            requiere_soporte: 1,
            requiere_aprobacion: 1,
            icono: 'fa-briefcase-medical'
        },

        // --- TIEMPO ---
        {
            id: 7,
            codigo: 'TIEMPO',
            nombre: 'Horas extra y recargos',
            categoria: 'TIEMPO',
            descripcion: 'Horas adicionales, nocturnas, dominicales y festivos.',
            permite_empleado: 1,
            requiere_soporte: 0,
            requiere_aprobacion: 1,
            icono: 'fa-clock'
        },
        {
            id: 8,
            codigo: 'TIEMPO',
            nombre: 'Licencia',
            categoria: 'TIEMPO',
            descripcion: 'Licencia de maternidad o paternidad.',
            permite_empleado: 0,
            requiere_soporte: 0,
            requiere_aprobacion: 1,
            icono: 'fa-baby'
        },
        {
            id: 9,
            codigo: 'TIEMPO',
            nombre: 'Permiso',
            categoria: 'TIEMPO',
            descripcion: 'Permiso remunerado, no remunerado o compensatorio.',
            permite_empleado: 1,
            requiere_soporte: 0,
            requiere_aprobacion: 1,
            icono: 'fa-calendar-check'
        }

    ]);


    /* ============================================================
       2. CATÁLOGO DE TIPOS DE RECARGO / HORA EXTRA
       Estructura alineada con nomina_tipos_horas_extra
       y nomina_tipos_recargos
       ============================================================ */

    const TIPOS_HORA_FALLBACK = Object.freeze([

        // --- HORAS EXTRA ---
        {
            id: 1,
            codigo: 'HED',
            nombre: 'Hora extra diurna',
            tipo: 'HORA_EXTRA',
            porcentaje_recargo: 25,
            factor_pago: 1.25
        },
        {
            id: 2,
            codigo: 'HEN',
            nombre: 'Hora extra nocturna',
            tipo: 'HORA_EXTRA',
            porcentaje_recargo: 75,
            factor_pago: 1.75
        },
        {
            id: 3,
            codigo: 'HEDD',
            nombre: 'Hora extra diurna dominical/festiva',
            tipo: 'HORA_EXTRA',
            porcentaje_recargo: 100,
            factor_pago: 2.00
        },
        {
            id: 4,
            codigo: 'HEND',
            nombre: 'Hora extra nocturna dominical/festiva',
            tipo: 'HORA_EXTRA',
            porcentaje_recargo: 150,
            factor_pago: 2.50
        },

        // --- RECARGOS ---
        {
            id: 5,
            codigo: 'RN',
            nombre: 'Recargo nocturno',
            tipo: 'RECARGO',
            porcentaje_recargo: 35,
            factor_pago: 1.35
        },
        {
            id: 6,
            codigo: 'RDF',
            nombre: 'Recargo dominical/festivo',
            tipo: 'RECARGO',
            porcentaje_recargo: 75,
            factor_pago: 1.75
        },
        {
            id: 7,
            codigo: 'RNDF',
            nombre: 'Recargo nocturno dominical/festivo',
            tipo: 'RECARGO',
            porcentaje_recargo: 110,
            factor_pago: 2.10
        }

    ]);


    /* ============================================================
       3. TIPOS DE INCAPACIDAD
       ============================================================ */

    const TIPOS_INCAPACIDAD_FALLBACK = Object.freeze([
        { codigo: 'ENFERMEDAD_GENERAL', nombre: 'Enfermedad general' },
        { codigo: 'ACCIDENTE_TRABAJO', nombre: 'Accidente de trabajo' },
        { codigo: 'ENFERMEDAD_LABORAL', nombre: 'Enfermedad laboral' },
        { codigo: 'ACCIDENTE_ORIGEN_COMUN', nombre: 'Accidente de origen común' },
        { codigo: 'LICENCIA_MATERNIDAD', nombre: 'Licencia de maternidad' },
        { codigo: 'LICENCIA_PATERNIDAD', nombre: 'Licencia de paternidad' }
    ]);


    /* ============================================================
       4. TIPOS DE PERMISO
       ============================================================ */

    const TIPOS_PERMISO_FALLBACK = Object.freeze([
        { codigo: 'REMUNERADO', nombre: 'Permiso remunerado' },
        { codigo: 'NO_REMUNERADO', nombre: 'Permiso no remunerado' },
        { codigo: 'COMPENSATORIO', nombre: 'Permiso compensatorio' }
    ]);


    /* ============================================================
       5. TIPOS DE AUSENCIA
       ============================================================ */

    const TIPOS_AUSENCIA_FALLBACK = Object.freeze([
        { codigo: 'JUSTIFICADA', nombre: 'Ausencia justificada' },
        { codigo: 'INJUSTIFICADA', nombre: 'Ausencia injustificada' }
    ]);


    /* ============================================================
       6. TIPOS DE LICENCIA
       ============================================================ */

    const TIPOS_LICENCIA_FALLBACK = Object.freeze([
        { codigo: 'MATERNIDAD', nombre: 'Licencia de maternidad' },
        { codigo: 'PATERNIDAD', nombre: 'Licencia de paternidad' }
    ]);


    /* ============================================================
       7. ESTADOS DE NOVEDAD
       ============================================================ */

    const ESTADOS_NOVEDAD = Object.freeze({

        PENDIENTE: {
            codigo: 'PENDIENTE',
            etiqueta: 'Pendiente',
            clase: 'pendiente',
            icono: 'fa-clock',
            color: '#f97316'
        },

        APROBADA: {
            codigo: 'APROBADA',
            etiqueta: 'Aprobada',
            clase: 'aprobada',
            icono: 'fa-circle-check',
            color: '#16a34a'
        },

        RECHAZADA: {
            codigo: 'RECHAZADA',
            etiqueta: 'Rechazada',
            clase: 'rechazada',
            icono: 'fa-circle-xmark',
            color: '#ef4444'
        },

        ANULADA: {
            codigo: 'ANULADA',
            etiqueta: 'Anulada',
            clase: 'anulada',
            icono: 'fa-ban',
            color: '#64748b'
        },

        PROCESADA: {
            codigo: 'PROCESADA',
            etiqueta: 'Procesada',
            clase: 'procesada',
            icono: 'fa-check-double',
            color: '#0e7490'
        }

    });


    /* ============================================================
       8. HELPERS DE CONSULTA
       ============================================================ */

    const NovedadesCatalogo = {

        // Buscar tipo de novedad por ID
        buscarPorId(id) {
            return TIPOS_NOVEDAD_FALLBACK.find(t => String(t.id) === String(id)) || null;
        },

        // Buscar tipo de novedad por código (ej. 'ASISTENCIA')
        buscarPorCodigo(codigo) {
            return TIPOS_NOVEDAD_FALLBACK.find(t => t.codigo === codigo) || null;
        },

        // Buscar tipo de novedad por nombre
        buscarPorNombre(nombre) {
            return TIPOS_NOVEDAD_FALLBACK.find(t => t.nombre === nombre) || null;
        },

        // Obtener tipos agrupados por categoría
        agruparPorCategoria() {
            return TIPOS_NOVEDAD_FALLBACK.reduce((acc, tipo) => {
                if (!acc[tipo.categoria]) acc[tipo.categoria] = [];
                acc[tipo.categoria].push(tipo);
                return acc;
            }, {});
        },

        // Obtener todos los códigos de categoría únicos
        categoriasUnicas() {
            return [...new Set(TIPOS_NOVEDAD_FALLBACK.map(t => t.categoria))].sort();
        },

        // Obtener estado por código
        obtenerEstado(codigo) {
            return ESTADOS_NOVEDAD[String(codigo || '').toUpperCase()] || null;
        },

        // Buscar tipo de hora/recargo por código
        buscarHoraPorCodigo(codigo) {
            return TIPOS_HORA_FALLBACK.find(t => t.codigo === codigo) || null;
        },

        // Filtrar horas extra o recargos
        filtrarHorasPorTipo(tipo) {
            return TIPOS_HORA_FALLBACK.filter(t => t.tipo === tipo);
        }

    };


    /* ============================================================
       9. EXPOSICIÓN GLOBAL
       ============================================================ */

    global.NOVEDADES_TIPOS = TIPOS_NOVEDAD_FALLBACK;
    global.NOVEDADES_TIPOS_HORA = TIPOS_HORA_FALLBACK;
    global.NOVEDADES_TIPOS_INCAPACIDAD = TIPOS_INCAPACIDAD_FALLBACK;
    global.NOVEDADES_TIPOS_PERMISO = TIPOS_PERMISO_FALLBACK;
    global.NOVEDADES_TIPOS_AUSENCIA = TIPOS_AUSENCIA_FALLBACK;
    global.NOVEDADES_TIPOS_LICENCIA = TIPOS_LICENCIA_FALLBACK;
    global.NOVEDADES_ESTADOS = ESTADOS_NOVEDAD;
    global.NovedadesCatalogo = NovedadesCatalogo;

})(window);