
const express = require('express');
const router = express.Router();

const {
    proteger,
    soloAdminGeneral
} = require('../middlewares/auth');

// =========================================================
// 🔎 BÚSQUEDA DE EMPLEADOS PARA LIQUIDACIÓN
// =========================================================

router.get(
    '/api/nomina/buscar-empleados',
    proteger,
    soloAdminGeneral,
    async (req, res) => {
        try {
            const db = req.app.get('db');
            const buscar = (req.query.buscar || '').trim();
            const inicio = req.query.inicio;
            const fin = req.query.fin;

            if (buscar.length < 2) {
                return res.status(400).json({
                    success: false,
                    message: 'Escribe al menos dos caracteres para buscar.'
                });
            }

            const formatoFecha = /^\d{4}-\d{2}-\d{2}$/;

            if (
                !inicio ||
                !fin ||
                !formatoFecha.test(inicio) ||
                !formatoFecha.test(fin) ||
                inicio > fin
            ) {
                return res.status(400).json({
                    success: false,
                    message: 'Selecciona un período de liquidación válido.'
                });
            }

            const termino = `%${buscar}%`;

            const sql = `
                SELECT
                    e.id AS empleado_id,
                    e.codigo,
                    e.nombre,
                    e.tipo_documento,
                    e.numero_documento,
                    e.telefono,
                    e.email,
                    c.id AS contrato_id,
                    c.tipo_vinculacion,
                    c.tipo_contrato,
                    c.fecha_inicio,
                    c.fecha_fin
                FROM empleados e
                INNER JOIN contratos c
                    ON c.empleado_id = e.id
                WHERE
                    e.activo = 'SI'
                    AND c.tipo_vinculacion IN (
                        'Dependiente',
                        'Aprendiz Sena'
                    )
                    AND c.fecha_inicio <= ?
                    AND (
                        c.fecha_fin IS NULL
                        OR c.fecha_fin >= ?
                    )
                    AND (
                        e.nombre LIKE ?
                        OR e.numero_documento LIKE ?
                        OR e.codigo LIKE ?
                    )
                    AND c.id = (
                        SELECT c2.id
                        FROM contratos c2
                        WHERE c2.empleado_id = e.id
                          AND c2.tipo_vinculacion IN (
                              'Dependiente',
                              'Aprendiz Sena'
                          )
                          AND c2.fecha_inicio <= ?
                          AND (
                              c2.fecha_fin IS NULL
                              OR c2.fecha_fin >= ?
                          )
                        ORDER BY
                            c2.fecha_inicio DESC,
                            c2.id DESC
                        LIMIT 1
                    )
                ORDER BY e.nombre ASC
                LIMIT 20
            `;

            const [empleados] = await db.execute(sql, [
                fin,
                inicio,
                termino,
                termino,
                termino,
                fin,
                inicio
            ]);

            return res.json({
                success: true,
                total: empleados.length,
                empleados
            });

        } catch (error) {
            console.error(
                'ERROR BUSCANDO EMPLEADOS PARA LIQUIDACIÓN:',
                error
            );

            return res.status(500).json({
                success: false,
                message: 'Error al consultar los empleados.'
            });
        }
    }
);

// =========================================================
// ⚙️ CONSULTAR CONFIGURACIÓN PARA LIQUIDACIÓN
// Solo lectura. Respeta las vigencias históricas.
// =========================================================

router.get(
    '/api/nomina/liquidacion/configuracion',
    proteger,
    soloAdminGeneral,
    async (req, res) => {
        try {
            const db = req.app.get('db');

            const inicio = String(
                req.query.inicio || ''
            ).trim();

            const fin = String(
                req.query.fin || ''
            ).trim();

            const formatoFecha = /^\d{4}-\d{2}-\d{2}$/;

            if (
                !formatoFecha.test(inicio) ||
                !formatoFecha.test(fin) ||
                inicio > fin
            ) {
                return res.status(400).json({
                    ok: false,
                    mensaje: 'Debes indicar un período válido con formato YYYY-MM-DD.'
                });
            }

            // Busca todas las vigencias que se cruzan
            // con el período de liquidación.
            const condicionVigencia = `
                WHERE fecha_inicio <= ?
                  AND (
                      fecha_fin IS NULL
                      OR fecha_fin >= ?
                  )
            `;

            const parametros = [fin, inicio];

            const consultas = await Promise.all([

                // PARÁMETROS GENERALES
                db.query(`
                    SELECT
                        id,
                        codigo,
                        nombre,
                        descripcion,
                        valor,
                        tipo_dato,
                        unidad,
                        DATE_FORMAT(
                            fecha_inicio, '%Y-%m-%d'
                        ) AS fecha_inicio,
                        DATE_FORMAT(
                            fecha_fin, '%Y-%m-%d'
                        ) AS fecha_fin,
                        activo
                    FROM nomina_parametros
                    ${condicionVigencia}
                    ORDER BY codigo, fecha_inicio, id
                `, parametros),

                // SALARIOS MÍNIMOS
                db.query(`
                    SELECT
                        id,
                        valor,
                        DATE_FORMAT(
                            fecha_inicio, '%Y-%m-%d'
                        ) AS fecha_inicio,
                        DATE_FORMAT(
                            fecha_fin, '%Y-%m-%d'
                        ) AS fecha_fin,
                        activo,
                        observacion
                    FROM nomina_salario_minimo
                    ${condicionVigencia}
                    ORDER BY fecha_inicio, id
                `, parametros),

                // AUXILIO DE TRANSPORTE
                db.query(`
                    SELECT
                        id,
                        valor,
                        salario_maximo_aplica,
                        DATE_FORMAT(
                            fecha_inicio, '%Y-%m-%d'
                        ) AS fecha_inicio,
                        DATE_FORMAT(
                            fecha_fin, '%Y-%m-%d'
                        ) AS fecha_fin,
                        activo,
                        observacion
                    FROM nomina_auxilio_transporte
                    ${condicionVigencia}
                    ORDER BY fecha_inicio, id
                `, parametros),

                // TIPOS DE HORAS EXTRA
                db.query(`
                    SELECT
                        id,
                        codigo,
                        nombre,
                        descripcion,
                        tipo_jornada,
                        tipo_dia,
                        porcentaje_recargo,
                        factor_pago,
                        formula,
                        hora_inicio,
                        hora_fin,
                        requiere_autorizacion,
                        limite_diario,
                        limite_semanal,
                        DATE_FORMAT(
                            fecha_inicio, '%Y-%m-%d'
                        ) AS fecha_inicio,
                        DATE_FORMAT(
                            fecha_fin, '%Y-%m-%d'
                        ) AS fecha_fin,
                        activo
                    FROM nomina_tipos_horas_extra
                    ${condicionVigencia}
                    ORDER BY codigo, fecha_inicio, id
                `, parametros),

                // TIPOS DE RECARGOS
                db.query(`
                    SELECT
                        id,
                        codigo,
                        nombre,
                        descripcion,
                        porcentaje_recargo,
                        factor_pago,
                        formula,
                        DATE_FORMAT(
                            fecha_inicio, '%Y-%m-%d'
                        ) AS fecha_inicio,
                        DATE_FORMAT(
                            fecha_fin, '%Y-%m-%d'
                        ) AS fecha_fin,
                        activo
                    FROM nomina_tipos_recargos
                    ${condicionVigencia}
                    ORDER BY codigo, fecha_inicio, id
                `, parametros)

            ]);

            const [parametrosRows] = consultas[0];
            const [salariosRows] = consultas[1];
            const [auxiliosRows] = consultas[2];
            const [horasExtraRows] = consultas[3];
            const [recargosRows] = consultas[4];

            return res.json({
                ok: true,
                periodo: {
                    inicio,
                    fin
                },
                configuracion: {
                    parametros: parametrosRows,
                    salarios_minimos: salariosRows,
                    auxilios_transporte: auxiliosRows,
                    horas_extra: horasExtraRows,
                    recargos: recargosRows
                }
            });

        } catch (error) {
            console.error(
                'ERROR CONSULTANDO CONFIGURACIÓN PARA LIQUIDACIÓN:',
                error
            );

            return res.status(500).json({
                ok: false,
                mensaje: 'No fue posible consultar la configuración del período.',
                error: error.message
            });
        }
    }
);


// =========================================================
// 🧮 PREPARAR PRELIQUIDACIÓN
// No guarda ni modifica información.
// =========================================================

router.post(
    '/api/nomina/liquidacion/preparar',
    proteger,
    soloAdminGeneral,
    async (req, res) => {
        try {
            const db = req.app.get('db');

            const {
                empleado_id,
                contrato_id,
                inicio,
                fin,
                tramos = []
            } = req.body;

            const formatoFecha = /^\d{4}-\d{2}-\d{2}$/;

            if (
                !Number.isInteger(Number(empleado_id)) ||
                !Number.isInteger(Number(contrato_id)) ||
                !formatoFecha.test(inicio || '') ||
                !formatoFecha.test(fin || '') ||
                inicio > fin
            ) {
                return res.status(400).json({
                    ok: false,
                    mensaje: 'Los datos del período o del empleado no son válidos.'
                });
            }

            // Consultar contrato
            const [contratos] = await db.query(`
                SELECT *
                FROM contratos
                WHERE id = ?
                  AND empleado_id = ?
                  AND fecha_inicio <= ?
                  AND (fecha_fin IS NULL OR fecha_fin >= ?)
                LIMIT 1
            `, [contrato_id, empleado_id, fin, inicio]);

            if (!contratos.length) {
                return res.status(404).json({
                    ok: false,
                    mensaje: 'No se encontró un contrato vigente para el período.'
                });
            }

            const contrato = contratos[0];

            // Consultar empleado
            const [empleados] = await db.query(`
                SELECT id, nombre, numero_documento, activo
                FROM empleados
                WHERE id = ?
                LIMIT 1
            `, [empleado_id]);

            if (!empleados.length) {
                return res.status(404).json({
                    ok: false,
                    mensaje: 'No se encontró el empleado.'
                });
            }

            // Obtener configuración vigente para el período.
            const [salarios] = await db.query(`
    SELECT
        valor,
        DATE_FORMAT(fecha_inicio, '%Y-%m-%d') AS fecha_inicio,
        DATE_FORMAT(fecha_fin, '%Y-%m-%d') AS fecha_fin
    FROM nomina_salario_minimo
    WHERE fecha_inicio <= ?
      AND (fecha_fin IS NULL OR fecha_fin >= ?)
      AND activo = 1
    ORDER BY fecha_inicio DESC, id DESC
`, [fin, inicio]);

            const [auxilios] = await db.query(`
    SELECT
        valor,
        salario_maximo_aplica,
        DATE_FORMAT(fecha_inicio, '%Y-%m-%d') AS fecha_inicio,
        DATE_FORMAT(fecha_fin, '%Y-%m-%d') AS fecha_fin
    FROM nomina_auxilio_transporte
    WHERE fecha_inicio <= ?
      AND (fecha_fin IS NULL OR fecha_fin >= ?)
      AND activo = 1
    ORDER BY fecha_inicio DESC, id DESC
`, [fin, inicio]);

            if (!salarios.length) {
                return res.status(400).json({
                    ok: false,
                    mensaje: 'No existe salario mínimo configurado para el período.'
                });
            }

            if (!auxilios.length) {
                return res.status(400).json({
                    ok: false,
                    mensaje: 'No existe auxilio de transporte configurado para el período.'
                });
            }

            // Por ahora exigimos una sola vigencia que cubra
            // todo el período. Luego implementaremos períodos
            // que atraviesen cambios de vigencia.
            const salarioMinimo = salarios.find(s =>
                String(s.fecha_inicio).substring(0, 10) <= inicio &&
                (!s.fecha_fin || String(s.fecha_fin).substring(0, 10) >= fin)
            );

            const auxilio = auxilios.find(a =>
                String(a.fecha_inicio).substring(0, 10) <= inicio &&
                (!a.fecha_fin || String(a.fecha_fin).substring(0, 10) >= fin)
            );

            if (!salarioMinimo || !auxilio) {
                return res.status(400).json({
                    ok: false,
                    mensaje: 'El período cruza un cambio de vigencia. Debemos dividir el cálculo por fechas.'
                });
            }

            const dias = Math.round(
                (new Date(`${fin}T00:00:00`) -
                 new Date(`${inicio}T00:00:00`)) / 86400000
            ) + 1;

            const minimo = Number(salarioMinimo.valor);
            const valorAuxilio = Number(auxilio.valor);
            const vinculacion = contrato.tipo_vinculacion;

            let salarioMensual = 0;
            let salarioPeriodo = 0;
            let auxilioPeriodo = 0;
            let detalleEtapas = [];

            if (vinculacion === 'Aprendiz Sena') {

                if (!Array.isArray(tramos) || !tramos.length) {
                    return res.status(400).json({
                        ok: false,
                        mensaje: 'Debes indicar las etapas del aprendiz.'
                    });
                }

                const fechas = new Set();

                for (const tramo of tramos) {
                    if (
                        !['lectiva', 'productiva'].includes(tramo.etapa) ||
                        !formatoFecha.test(tramo.desde || '') ||
                        !formatoFecha.test(tramo.hasta || '') ||
                        tramo.desde < inicio ||
                        tramo.hasta > fin ||
                        tramo.desde > tramo.hasta
                    ) {
                        return res.status(400).json({
                            ok: false,
                            mensaje: 'Hay un tramo de etapa inválido.'
                        });
                    }

                    const desde = new Date(`${tramo.desde}T00:00:00`);
                    const hasta = new Date(`${tramo.hasta}T00:00:00`);

                    let diasTramo = 0;

                    for (
                        let fecha = new Date(desde);
                        fecha <= hasta;
                        fecha.setDate(fecha.getDate() + 1)
                    ) {
                        const clave = fecha.toISOString().substring(0, 10);

                        if (fechas.has(clave)) {
                            return res.status(400).json({
                                ok: false,
                                mensaje: 'Los tramos tienen fechas superpuestas.'
                            });
                        }

                        fechas.add(clave);
                        diasTramo++;
                    }

                    const porcentaje =
                        tramo.etapa === 'lectiva' ? 0.75 : 1;

                    const valorMensual = minimo * porcentaje;
                    const valorTramo = (valorMensual / 30) * diasTramo;

                    salarioPeriodo += valorTramo;

                    detalleEtapas.push({
                        etapa: tramo.etapa,
                        desde: tramo.desde,
                        hasta: tramo.hasta,
                        dias: diasTramo,
                        porcentaje: porcentaje * 100,
                        valor: Math.round(valorTramo)
                    });
                }

                if (fechas.size !== dias) {
                    return res.status(400).json({
                        ok: false,
                        mensaje: 'Los tramos deben cubrir todos los días del período.'
                    });
                }

                salarioMensual = minimo;

            


} else if (vinculacion === 'Dependiente') {

    // El salario base se toma de Configuración de Nómina.
    salarioMensual = minimo;

    // Calcular salario correspondiente a los días del período.
    salarioPeriodo = (salarioMensual / 30) * dias;

    // El auxilio se aplica según el límite configurado.
    const salarioMaximo = Number(auxilio.salario_maximo_aplica);

    if (
        Number.isFinite(salarioMaximo) &&
        salarioMensual <= salarioMaximo
    ) {
        auxilioPeriodo = (valorAuxilio / 30) * dias;
    }

    detalleEtapas = [];

            } else {
                return res.status(400).json({
                    ok: false,
                    mensaje: 'La vinculación no está habilitada para liquidación.'
                });
            }


// =============================================
// CONSULTAR NOVEDADES APROBADAS DEL PERÍODO
// =============================================

const [novedadesAprobadas] = await db.query(`
    SELECT
        n.id,
        n.empleado_id,
        n.fecha_inicio,
        n.fecha_fin,
        n.cantidad_dias,
        n.cantidad_horas,
        n.motivo,
        n.observacion,
        n.estado,
        t.nombre AS tipo_novedad,
        t.codigo,
        t.categoria
    FROM nomina_novedades n
    INNER JOIN nomina_novedades_tipos t
        ON t.id = n.tipo_novedad_id
    WHERE n.empleado_id = ?
      AND n.estado = 'APROBADA'
      AND n.fecha_inicio <= ?
      AND (n.fecha_fin IS NULL OR n.fecha_fin >= ?)
    ORDER BY n.fecha_inicio ASC, n.id ASC
`, [empleado_id, fin, inicio]);

let otrosDevengados = 0;
let deduccionesNovedades = 0;
const detalleNovedades = [];
const novedadesPendientesCalculo = [];

for (const novedad of novedadesAprobadas) {

    // Extraer el valor guardado en observacion:
    // Ejemplo: Valor: $150000
    const coincidencia = String(novedad.observacion || '')
        .match(/Valor:\s*\$?\s*([\d.,]+)/i);

    const valor = coincidencia
        ? Number(coincidencia[1].replace(/[.,]/g, ''))
        : null;

    const codigo = String(novedad.codigo || '').toUpperCase();
    const categoria = String(novedad.categoria || '').toUpperCase();

    let tratamiento = 'PENDIENTE_DE_CALCULO';

    // INGRESO VARIABLE
    if (codigo === 'INGRESO_VARIABLE') {

        if (valor !== null && Number.isFinite(valor)) {
            otrosDevengados += valor;
            tratamiento = 'DEVENGADO';
        }

    // DESCUENTO AUTORIZADO
    } else if (codigo === 'DESCUENTO_AUTORIZADO') {

        if (valor !== null && Number.isFinite(valor)) {
            deduccionesNovedades += valor;
            tratamiento = 'DEDUCCION';
        }

    // ANTICIPO DE SALARIO
    } else if (codigo === 'ANTICIPO_SALARIO') {

        if (valor !== null && Number.isFinite(valor)) {
            deduccionesNovedades += valor;
            tratamiento = 'DEDUCCION';
        }

    // SOLICITUD DE PRÉSTAMO:
    // No se descuenta por el simple hecho de solicitarlo.
    } else if (codigo === 'SOLICITUD_PRESTAMO') {

        tratamiento = 'NO_DESCONTAR_SOLICITUD';

    }

    const detalle = {
        id: novedad.id,
        tipo: novedad.tipo_novedad,
        codigo,
        categoria,
        fecha_inicio: novedad.fecha_inicio,
        fecha_fin: novedad.fecha_fin,
        cantidad_dias: novedad.cantidad_dias,
        cantidad_horas: novedad.cantidad_horas,
        motivo: novedad.motivo,
        observacion: novedad.observacion,
        valor: valor,
        tratamiento
    };

    detalleNovedades.push(detalle);

    if (tratamiento === 'PENDIENTE_DE_CALCULO') {
        novedadesPendientesCalculo.push(detalle);
    }
}

// =============================================
// SEGURIDAD SOCIAL: SALUD Y PENSIÓN
// =============================================

let porcentajeSalud = 0;
let porcentajePension = 0;

let descuentoSalud = 0;
let descuentoPension = 0;

let ingresoBaseCotizacion = 0;

// Los aportes del trabajador se calculan
// para vinculación Dependiente.
if (vinculacion === 'Dependiente') {

    const [parametrosSeguridadSocial] = await db.query(`
        SELECT
            codigo,
            valor,
            DATE_FORMAT(fecha_inicio, '%Y-%m-%d') AS fecha_inicio,
            DATE_FORMAT(fecha_fin, '%Y-%m-%d') AS fecha_fin
        FROM nomina_parametros
        WHERE codigo IN (
            'PORCENTAJE_SALUD_TRABAJADOR',
            'PORCENTAJE_PENSION_TRABAJADOR'
        )
          AND fecha_inicio <= ?
          AND (fecha_fin IS NULL OR fecha_fin >= ?)
        ORDER BY fecha_inicio DESC, id DESC
    `, [inicio, fin]);

    const obtenerParametro = codigo =>
        parametrosSeguridadSocial.find(p =>
            p.codigo === codigo &&
            p.fecha_inicio <= inicio &&
            (!p.fecha_fin || p.fecha_fin >= fin)
        );

    const parametroSalud = obtenerParametro(
        'PORCENTAJE_SALUD_TRABAJADOR'
    );

    const parametroPension = obtenerParametro(
        'PORCENTAJE_PENSION_TRABAJADOR'
    );

    if (!parametroSalud || !parametroPension) {
        return res.status(400).json({
            ok: false,
            mensaje: 'No existen porcentajes de salud y pensión vigentes para todo el período.'
        });
    }

    porcentajeSalud = Number(parametroSalud.valor);
    porcentajePension = Number(parametroPension.valor);

    if (
        !Number.isFinite(porcentajeSalud) ||
        !Number.isFinite(porcentajePension) ||
        porcentajeSalud < 0 ||
        porcentajePension < 0
    ) {
        return res.status(400).json({
            ok: false,
            mensaje: 'Los porcentajes de seguridad social no son válidos.'
        });
    }

    // Por ahora se toma el salario del período como IBC.
    // El auxilio de transporte no integra esta base.
    ingresoBaseCotizacion = Math.round(salarioPeriodo);

    descuentoSalud = Math.round(
        ingresoBaseCotizacion * porcentajeSalud / 100
    );

    descuentoPension = Math.round(
        ingresoBaseCotizacion * porcentajePension / 100
    );
}

// =============================================
// TOTALES DE LA PRELIQUIDACIÓN
// =============================================

const totalDevengadoBase = Math.round(
    salarioPeriodo + auxilioPeriodo
);

const totalDevengados = Math.round(
    totalDevengadoBase + otrosDevengados
);

const totalSeguridadSocial =
    descuentoSalud + descuentoPension;

const totalDeducciones = Math.round(
    deduccionesNovedades + totalSeguridadSocial
);

const netoPagar = Math.round(
    totalDevengados - totalDeducciones
);


            return res.json({
                ok: true,
                empleado: empleados[0],
                contrato: {
                    id: contrato.id,
                    tipo_vinculacion: vinculacion,
                    tipo_contrato: contrato.tipo_contrato
                },
                periodo: {
                    inicio,
                    fin,
                    dias
                },
                
calculo: {
    salario_mensual: Math.round(salarioMensual),
    salario_periodo: Math.round(salarioPeriodo),
    auxilio_transporte: Math.round(auxilioPeriodo),

    total_devengado_base: totalDevengadoBase,
    otros_devengados: Math.round(otrosDevengados),
    total_devengados: totalDevengados,

    total_deducciones: totalDeducciones,
    neto_pagar: netoPagar,

    seguridad_social: {
    ingreso_base_cotizacion: ingresoBaseCotizacion,

    salud: {
        porcentaje: porcentajeSalud,
        valor: descuentoSalud
    },

    pension: {
        porcentaje: porcentajePension,
        valor: descuentoPension
    },

    total: totalSeguridadSocial
},

    etapas: detalleEtapas
},

novedades: {
    total: detalleNovedades.length,
    detalle: detalleNovedades,
    pendientes_calculo: novedadesPendientesCalculo
},

estado: 'PRELIQUIDACION'

            });

        } catch (error) {
            console.error('ERROR PREPARANDO PRELIQUIDACIÓN:', error);

            return res.status(500).json({
                ok: false,
                mensaje: 'No fue posible preparar la preliquidación.',
                error: error.message
            });
        }
    }
);


module.exports = router;
