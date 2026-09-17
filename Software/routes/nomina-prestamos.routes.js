/* ============================================================
   PRÉSTAMOS - PROCESADOS MARGARITA
   Rutas del módulo de préstamos
   ============================================================ */

const express = require('express');
const path = require('path');

const router = express.Router();

/* ============================================================
   PÁGINA PRINCIPAL DE PRÉSTAMOS
   ============================================================ */

router.get('/nomina/prestamos', (req, res) => {

    res.sendFile(
        path.join(
            __dirname,
            '../public/nomina-prestamos.html'
        )
    );

});

/* ============================================================
   INDICADORES DEL DASHBOARD
   ============================================================ */

router.get('/nomina/prestamos/indicadores', async (req, res) => {

    const db = req.app.get('db');

    let connection = null;

    try {

        connection = await db.getConnection();


        /* ====================================================
           FECHAS DE REFERENCIA
           ==================================================== */

        const ahora = new Date();

        const inicioMesActual =
            new Date(
                ahora.getFullYear(),
                ahora.getMonth(),
                1
            );

        const inicioMesAnterior =
            new Date(
                ahora.getFullYear(),
                ahora.getMonth() - 1,
                1
            );

        const finMesAnterior =
            new Date(
                ahora.getFullYear(),
                ahora.getMonth(),
                0,
                23,
                59,
                59
            );


        const fechaInicioActual =
            formatearFechaSQL(inicioMesActual);

        const fechaInicioAnterior =
            formatearFechaSQL(inicioMesAnterior);

        const fechaFinAnterior =
            formatearFechaSQL(finMesAnterior);


        /* ====================================================
           1. PRÉSTAMOS ACTIVOS
           ==================================================== */

        const [prestamosActivosActual] =
            await connection.query(`
                SELECT COUNT(*) AS total
                FROM nomina_prestamos
                WHERE estado = 'ACTIVO'
            `);


        const [prestamosActivosAnterior] =
            await connection.query(`
                SELECT COUNT(*) AS total
                FROM nomina_prestamos
                WHERE estado = 'ACTIVO'
                  AND fecha_prestamo < ?
            `, [
                fechaInicioActual
            ]);


        /* ====================================================
           2. CAPITAL DESEMBOLSADO
           
           Se compara lo desembolsado:
           - durante el mes actual
           - durante el mes anterior
           ==================================================== */

        const [capitalActual] =
            await connection.query(`
                SELECT
                    COALESCE(
                        SUM(valor_prestamo),
                        0
                    ) AS total
                FROM nomina_prestamos
                WHERE fecha_prestamo >= ?
            `, [
                fechaInicioActual
            ]);


        const [capitalAnterior] =
            await connection.query(`
                SELECT
                    COALESCE(
                        SUM(valor_prestamo),
                        0
                    ) AS total
                FROM nomina_prestamos
                WHERE fecha_prestamo >= ?
                  AND fecha_prestamo < ?
            `, [
                fechaInicioAnterior,
                fechaInicioActual
            ]);


        /* ====================================================
           3. SALDO POR COBRAR
           ==================================================== */

        const [saldoActual] =
            await connection.query(`
                SELECT
                    COALESCE(
                        SUM(saldo_pendiente),
                        0
                    ) AS total
                FROM nomina_prestamos
                WHERE estado = 'ACTIVO'
            `);


        /*
         * Para el mes anterior reconstruimos el saldo
         * tomando los préstamos existentes hasta ese corte
         * y descontando los movimientos registrados hasta
         * esa fecha.
         */

        const [saldoAnteriorPrestamos] =
            await connection.query(`
                SELECT
                    p.id,
                    p.valor_prestamo,
                    p.valor_interes
                FROM nomina_prestamos p
                WHERE p.fecha_prestamo <= ?
            `, [
                fechaFinAnterior
            ]);


        let saldoAnterior = 0;


        for (const prestamo of saldoAnteriorPrestamos) {

            const totalPrestamo =
                Number(prestamo.valor_prestamo || 0) +
                Number(prestamo.valor_interes || 0);


            const [movimientos] =
                await connection.query(`
                    SELECT
                        COALESCE(
                            SUM(valor),
                            0
                        ) AS total
                    FROM nomina_prestamos_movimientos
                    WHERE prestamo_id = ?
                      AND fecha_movimiento <= ?
                      AND tipo_movimiento IN (
                          'PAGO_CUOTA',
                          'ABONO_EXTRAORDINARIO',
                          'CANCELACION_ANTICIPADA'
                      )
                `, [
                    prestamo.id,
                    `${fechaFinAnterior} 23:59:59`
                ]);


            const pagado =
                Number(
                    movimientos[0]?.total || 0
                );


            saldoAnterior +=
                Math.max(
                    totalPrestamo - pagado,
                    0
                );

        }


        /* ====================================================
           4. CUOTAS PENDIENTES
           ==================================================== */

        const [cuotasActuales] =
            await connection.query(`
                SELECT COUNT(*) AS total
                FROM nomina_prestamos_cuotas c
                INNER JOIN nomina_prestamos p
                    ON p.id = c.prestamo_id
                WHERE c.estado IN (
                    'PENDIENTE',
                    'VENCIDA',
                    'APLAZADA'
                )
                  AND p.estado = 'ACTIVO'
            `);


        /*
         * Para el mes anterior contamos las cuotas que ya
         * existían en ese momento y descontamos los pagos
         * registrados hasta el cierre del mes.
         */

        const [cuotasAnteriores] =
            await connection.query(`
                SELECT
                    c.id
                FROM nomina_prestamos_cuotas c
                INNER JOIN nomina_prestamos p
                    ON p.id = c.prestamo_id
                WHERE p.fecha_prestamo <= ?
                  AND c.fecha_programada <= ?
            `, [
                fechaFinAnterior,
                fechaFinAnterior
            ]);


        let cuotasPendientesAnterior =
            cuotasAnteriores.length;


        for (const cuota of cuotasAnteriores) {

            const [pago] =
                await connection.query(`
                    SELECT COUNT(*) AS total
                    FROM nomina_prestamos_movimientos
                    WHERE cuota_id = ?
                      AND fecha_movimiento <= ?
                      AND tipo_movimiento = 'PAGO_CUOTA'
                `, [
                    cuota.id,
                    `${fechaFinAnterior} 23:59:59`
                ]);


            if (Number(pago[0]?.total || 0) > 0) {

                cuotasPendientesAnterior--;

            }

        }


        /* ====================================================
           CALCULAR VARIACIONES
           ==================================================== */

        const activosActual =
            Number(
                prestamosActivosActual[0]?.total || 0
            );

        const activosAnterior =
            Number(
                prestamosActivosAnterior[0]?.total || 0
            );


        const capitalDesembolsadoActual =
            Number(
                capitalActual[0]?.total || 0
            );

        const capitalDesembolsadoAnterior =
            Number(
                capitalAnterior[0]?.total || 0
            );


        const saldoPendienteActual =
            Number(
                saldoActual[0]?.total || 0
            );


        const cuotasPendientesActual =
            Number(
                cuotasActuales[0]?.total || 0
            );


        /* ====================================================
   HISTÓRICO ÚLTIMOS 6 MESES
   ==================================================== */

const historico = [];

const nombresMeses = [
    'Ene',
    'Feb',
    'Mar',
    'Abr',
    'May',
    'Jun',
    'Jul',
    'Ago',
    'Sep',
    'Oct',
    'Nov',
    'Dic'
];

const fechaBase = new Date(
    ahora.getFullYear(),
    ahora.getMonth(),
    1
);


/* ====================================================
   RECORRER LOS ÚLTIMOS 6 MESES
   ==================================================== */

for (let i = 5; i >= 0; i--) {

    const inicioMes = new Date(
        fechaBase.getFullYear(),
        fechaBase.getMonth() - i,
        1
    );

    const finMes = new Date(
        fechaBase.getFullYear(),
        fechaBase.getMonth() - i + 1,
        0,
        23,
        59,
        59
    );

    const finSQL =
        formatearFechaSQL(finMes);


    /* =================================================
       PRÉSTAMOS Y SALDO HISTÓRICO
       ================================================= */

    const [prestamosHistoricos] =
        await connection.query(`
            SELECT
                p.id,
                p.valor_prestamo,
                p.valor_interes,

                COALESCE(
                    SUM(
                        CASE
                            WHEN m.tipo_movimiento IN (
                                'PAGO_CUOTA',
                                'ABONO_EXTRAORDINARIO',
                                'CANCELACION_ANTICIPADA'
                            )
                            THEN m.valor
                            ELSE 0
                        END
                    ),
                    0
                ) AS total_pagado

            FROM nomina_prestamos p

            LEFT JOIN nomina_prestamos_movimientos m
                ON m.prestamo_id = p.id
                AND m.fecha_movimiento <= ?

            WHERE p.fecha_prestamo <= ?

            GROUP BY
                p.id,
                p.valor_prestamo,
                p.valor_interes
        `, [
            `${finSQL} 23:59:59`,
            finSQL
        ]);


    let activosHistoricos = 0;
    let saldoHistorico = 0;
    let capitalHistorico = 0;


    for (const prestamo of prestamosHistoricos) {

        const capitalPrestamo =
            Number(
                prestamo.valor_prestamo || 0
            );

        const interesPrestamo =
            Number(
                prestamo.valor_interes || 0
            );

        const totalPrestamo =
            capitalPrestamo +
            interesPrestamo;

        const totalPagado =
            Number(
                prestamo.total_pagado || 0
            );

        const saldoPrestamo =
            Math.max(
                totalPrestamo - totalPagado,
                0
            );


        capitalHistorico +=
            capitalPrestamo;


        saldoHistorico +=
            saldoPrestamo;


        /*
         * Un préstamo se considera activo en ese momento
         * si todavía tenía saldo pendiente.
         */

        if (saldoPrestamo > 0.01) {

            activosHistoricos++;

        }

    }


    /* =================================================
       CUOTAS PENDIENTES AL CIERRE DEL MES
       ================================================= */

    const [cuotasHistoricas] =
        await connection.query(`
            SELECT
                c.id,

                COALESCE(
                    SUM(
                        CASE
                            WHEN m.tipo_movimiento = 'PAGO_CUOTA'
                            THEN 1
                            ELSE 0
                        END
                    ),
                    0
                ) AS pagos

            FROM nomina_prestamos_cuotas c

            INNER JOIN nomina_prestamos p
                ON p.id = c.prestamo_id

            LEFT JOIN nomina_prestamos_movimientos m
                ON m.cuota_id = c.id
                AND m.fecha_movimiento <= ?

            WHERE p.fecha_prestamo <= ?

              AND c.estado <> 'ANULADA'

            GROUP BY
                c.id
        `, [
            `${finSQL} 23:59:59`,
            finSQL
        ]);


    let cuotasHistoricasPendientes = 0;


    for (const cuota of cuotasHistoricas) {

        if (
            Number(cuota.pagos || 0) === 0
        ) {

            cuotasHistoricasPendientes++;

        }

    }


    /* =================================================
       GUARDAR MES
       ================================================= */

    historico.push({

        mes:
            nombresMeses[
                inicioMes.getMonth()
            ],

        año:
            inicioMes.getFullYear(),

        prestamos_activos:
            activosHistoricos,

        capital_desembolsado:
            capitalHistorico,

        saldo_por_cobrar:
            saldoHistorico,

        cuotas_pendientes:
            cuotasHistoricasPendientes

    });

}


/* ====================================================
   RESPUESTA FINAL
   ==================================================== */

res.json({

    ok: true,

    indicadores: {

        prestamos_activos: {

            actual:
                activosActual,

            anterior:
                activosAnterior,

            variacion:
                calcularVariacion(
                    activosActual,
                    activosAnterior
                )

        },


        capital_desembolsado: {

            actual:
                capitalDesembolsadoActual,

            anterior:
                capitalDesembolsadoAnterior,

            variacion:
                calcularVariacion(
                    capitalDesembolsadoActual,
                    capitalDesembolsadoAnterior
                )

        },


        saldo_por_cobrar: {

            actual:
                saldoPendienteActual,

            anterior:
                saldoAnterior,

            variacion:
                calcularVariacion(
                    saldoPendienteActual,
                    saldoAnterior
                )

        },


        cuotas_pendientes: {

            actual:
                cuotasPendientesActual,

            anterior:
                cuotasPendientesAnterior,

            variacion:
                calcularVariacion(
                    cuotasPendientesActual,
                    cuotasPendientesAnterior
                )

        },


        historico

    }

});


        connection.release();
        connection = null;


    } catch (error) {

        console.error(
            '❌ Error obteniendo indicadores de préstamos:',
            error
        );


        if (connection) {
            connection.release();
        }


        return res.status(500).json({

            ok: false,

            error:
                error.message ||
                'No fue posible obtener los indicadores.'

        });

    }

});


/* ============================================================
   CALCULAR VARIACIÓN PORCENTUAL
   ============================================================ */

function calcularVariacion(actual, anterior) {

    actual =
        Number(actual || 0);

    anterior =
        Number(anterior || 0);


    if (anterior === 0) {

        if (actual === 0) {
            return 0;
        }

        return 100;

    }


    return Math.round(
        (
            (actual - anterior) /
            anterior
        ) * 100
    );

}

/* ============================================================
   LISTAR EMPLEADOS ACTIVOS PARA PRÉSTAMOS
   ============================================================ */

router.get('/nomina/prestamos/empleados', async (req, res) => {

    const db = req.app.get('db');

    try {

        const [empleados] = await db.query(`
            SELECT
                id,
                codigo,
                nombre,
                tipo_documento,
                numero_documento
            FROM empleados
            WHERE activo = 'SI'
            ORDER BY nombre ASC
        `);

        return res.json({
            ok: true,
            empleados
        });

    } catch (error) {

        console.error(
            '❌ Error consultando empleados para préstamos:',
            error
        );

        return res.status(500).json({
            ok: false,
            error: 'No fue posible cargar los empleados.'
        });

    }

});

/* ============================================================
   LISTAR PRÉSTAMOS
   ============================================================ */

router.get('/nomina/prestamos/lista', async (req, res) => {

    const db = req.app.get('db');

    let connection = null;

    try {

        connection = await db.getConnection();

        const [prestamos] = await connection.query(`
            SELECT
                p.id,
                p.empleado_id,
                e.nombre AS empleado,
                e.numero_documento,

                p.fecha_prestamo,
                p.valor_prestamo,
                p.tiene_interes,
                p.tipo_interes,
                p.valor_interes,
                p.porcentaje_interes,
                p.medio_desembolso,
                p.estado,
                p.saldo_pendiente,
                p.fecha_finalizacion,

                (
                    SELECT COUNT(*)
                    FROM nomina_prestamos_cuotas c
                    WHERE c.prestamo_id = p.id
                ) AS total_cuotas,

                (
                    SELECT COUNT(*)
                    FROM nomina_prestamos_cuotas c
                    WHERE c.prestamo_id = p.id
                    AND c.estado = 'PAGADA'
                ) AS cuotas_pagadas,

                (
                    SELECT c.id
                    FROM nomina_prestamos_cuotas c
                    WHERE c.prestamo_id = p.id
                    AND c.estado = 'PENDIENTE'
                    ORDER BY c.fecha_programada ASC
                    LIMIT 1
                ) AS proxima_cuota_id,

                (
                    SELECT c.numero_cuota
                    FROM nomina_prestamos_cuotas c
                    WHERE c.prestamo_id = p.id
                    AND c.estado = 'PENDIENTE'
                    ORDER BY c.fecha_programada ASC
                    LIMIT 1
                ) AS proxima_cuota_numero,

                (
                    SELECT c.fecha_programada
                    FROM nomina_prestamos_cuotas c
                    WHERE c.prestamo_id = p.id
                    AND c.estado = 'PENDIENTE'
                    ORDER BY c.fecha_programada ASC
                    LIMIT 1
                ) AS proxima_cuota_fecha,

                (
    SELECT
        GREATEST(
            c.valor_cuota -
            COALESCE(
                (
                    SELECT SUM(m.valor)
                    FROM nomina_prestamos_movimientos m
                    WHERE m.cuota_id = c.id
                      AND m.tipo_movimiento IN (
    'ABONO_EXTRAORDINARIO',
    'PAGO_CUOTA'
)
                ),
                0
            ),
            0
        )
    FROM nomina_prestamos_cuotas c
    WHERE c.prestamo_id = p.id
      AND c.estado IN (
          'PENDIENTE',
          'VENCIDA'
      )
    ORDER BY
        c.fecha_programada ASC,
        c.numero_cuota ASC
    LIMIT 1
) AS proxima_cuota_valor

            FROM nomina_prestamos p

            INNER JOIN empleados e
                ON e.id = p.empleado_id

            ORDER BY
                CASE
                    WHEN p.estado = 'ACTIVO' THEN 1
                    WHEN p.estado = 'PAGADO' THEN 2
                    WHEN p.estado = 'CANCELADO' THEN 3
                    WHEN p.estado = 'ANULADO' THEN 4
                    ELSE 5
                END,
                p.fecha_prestamo DESC
        `);

        connection.release();
        connection = null;

        return res.json({
            ok: true,
            prestamos
        });

    } catch (error) {

        console.error(
            '❌ Error consultando préstamos:',
            error
        );

        if (connection) {
            connection.release();
        }

        return res.status(500).json({
            ok: false,
            error:
                error.message ||
                'Error interno al consultar los préstamos.'
        });
    }

});


/* ============================================================
   DETALLE DE UN PRÉSTAMO
   ============================================================ */

router.get('/nomina/prestamos/:id', async (req, res) => {

    const db = req.app.get('db');

    let connection = null;

    try {

        const prestamoId =
            Number(req.params.id);

        if (
            !Number.isInteger(prestamoId) ||
            prestamoId <= 0
        ) {

            return res.status(400).json({
                ok: false,
                error: 'ID de préstamo no válido.'
            });

        }

        connection =
            await db.getConnection();


        /* ====================================================
           INFORMACIÓN DEL PRÉSTAMO
           ==================================================== */

        const [prestamos] =
            await connection.query(
                `
                SELECT
                    p.id,
                    p.empleado_id,

                    e.nombre AS empleado,
                    e.tipo_documento,
                    e.numero_documento,

                    p.fecha_prestamo,
                    p.valor_prestamo,
                    p.tiene_interes,
                    p.tipo_interes,
                    p.valor_interes,
                    p.porcentaje_interes,
                    p.medio_desembolso,
                    p.observacion,
                    p.estado,
                    p.saldo_pendiente,
                    p.fecha_finalizacion,

                    p.usuario_registro,
                    p.fecha_registro

                FROM nomina_prestamos p

                INNER JOIN empleados e
                    ON e.id = p.empleado_id

                WHERE p.id = ?

                LIMIT 1
                `,
                [prestamoId]
            );


        if (prestamos.length === 0) {

            connection.release();
            connection = null;

            return res.status(404).json({
                ok: false,
                error: 'El préstamo no existe.'
            });

        }


        const prestamo =
            prestamos[0];


        /* ====================================================
           CUOTAS DEL PRÉSTAMO
           ==================================================== */

        const [cuotas] =
    await connection.query(
        `
        SELECT
            c.id,
            c.prestamo_id,
            c.numero_cuota,
            c.fecha_programada,
            c.valor_capital,
            c.valor_interes,
            c.valor_cuota,
            c.estado,
            c.fecha_pago,
            c.observacion,
            c.fecha_registro,

            GREATEST(
                c.valor_cuota -
                COALESCE(
                    (
                        SELECT SUM(m.valor)
                        FROM nomina_prestamos_movimientos m
                        WHERE m.cuota_id = c.id
                          AND m.tipo_movimiento IN (
                            'ABONO_EXTRAORDINARIO',
                            'PAGO_CUOTA'
                          )
                    ),
                    0
                ),
                0
            ) AS saldo_cuota

        FROM nomina_prestamos_cuotas c

        WHERE c.prestamo_id = ?

        ORDER BY
            c.numero_cuota ASC
        `,
        [prestamoId]
    );


        /* ====================================================
           MOVIMIENTOS DEL PRÉSTAMO
           ==================================================== */

        const [movimientos] =
            await connection.query(
                `
                SELECT
                    m.id,
                    m.prestamo_id,
                    m.cuota_id,
                    m.tipo_movimiento,
                    m.fecha_movimiento,
                    m.valor,
                    m.valor_capital,
                    m.valor_interes,
                    m.medio_pago,
                    m.observacion,
                    m.usuario_id,
                    m.fecha_registro

                FROM nomina_prestamos_movimientos m

                WHERE m.prestamo_id = ?

                ORDER BY
                    m.fecha_movimiento DESC,
                    m.id DESC
                `,
                [prestamoId]
            );


        connection.release();
        connection = null;


        return res.json({
            ok: true,
            prestamo,
            cuotas,
            movimientos
        });


    } catch (error) {

        console.error(
            '❌ Error consultando detalle del préstamo:',
            error
        );


        if (connection) {
            connection.release();
        }


        return res.status(500).json({
            ok: false,
            error:
                error.message ||
                'No fue posible consultar el detalle del préstamo.'
        });

    }

});

/* ============================================================
   REGISTRAR PAGO DE CUOTA
   ============================================================ */

router.post('/nomina/prestamos/:id/pagar-cuota', async (req, res) => {

    const db = req.app.get('db');
    const usuarioId = req.session.usuarioID;

    if (!usuarioId) {
        return res.status(401).json({
            ok: false,
            error: 'La sesión del usuario no es válida.'
        });
    }

    let connection = null;

    try {

        const prestamoId = Number(req.params.id);

        const {
            cuota_id,
            fecha_pago,
            medio_pago,
            observacion
        } = req.body;


        /* ====================================================
           VALIDACIONES
           ==================================================== */

        if (!Number.isInteger(prestamoId) || prestamoId <= 0) {
            return res.status(400).json({
                ok: false,
                error: 'El préstamo indicado no es válido.'
            });
        }

        const cuotaId = Number(cuota_id);

        if (!Number.isInteger(cuotaId) || cuotaId <= 0) {
            return res.status(400).json({
                ok: false,
                error: 'Debe seleccionar una cuota válida.'
            });
        }

        if (!fecha_pago) {
            return res.status(400).json({
                ok: false,
                error: 'Debe indicar la fecha del pago.'
            });
        }

        if (
            medio_pago !== 'TRANSFERENCIA' &&
            medio_pago !== 'EFECTIVO'
        ) {
            return res.status(400).json({
                ok: false,
                error: 'Debe seleccionar un medio de pago válido.'
            });
        }


        /* ====================================================
           CONEXIÓN
           ==================================================== */

        connection = await db.getConnection();

        await connection.beginTransaction();


        /* ====================================================
           CONSULTAR PRÉSTAMO
           BLOQUEADO PARA EVITAR PAGOS DUPLICADOS
           ==================================================== */

        const [prestamos] = await connection.query(`
            SELECT
                id,
                empleado_id,
                valor_prestamo,
                valor_interes,
                saldo_pendiente,
                estado
            FROM nomina_prestamos
            WHERE id = ?
            LIMIT 1
            FOR UPDATE
        `, [
            prestamoId
        ]);


        if (!prestamos.length) {

            await connection.rollback();
            connection.release();
            connection = null;

            return res.status(404).json({
                ok: false,
                error: 'El préstamo no existe.'
            });
        }


        const prestamo = prestamos[0];


        /* ====================================================
           VALIDAR ESTADO DEL PRÉSTAMO
           ==================================================== */

        if (prestamo.estado !== 'ACTIVO') {

            await connection.rollback();
            connection.release();
            connection = null;

            return res.status(400).json({
                ok: false,
                error:
                    'Solo se pueden registrar pagos en préstamos activos.'
            });
        }


        /* ====================================================
           CONSULTAR CUOTA
           ==================================================== */

        const [cuotas] = await connection.query(`
            SELECT
                id,
                prestamo_id,
                numero_cuota,
                fecha_programada,
                valor_capital,
                valor_interes,
                valor_cuota,
                estado,
                fecha_pago
            FROM nomina_prestamos_cuotas
            WHERE id = ?
              AND prestamo_id = ?
            LIMIT 1
            FOR UPDATE
        `, [
            cuotaId,
            prestamoId
        ]);


        if (!cuotas.length) {

            await connection.rollback();
            connection.release();
            connection = null;

            return res.status(404).json({
                ok: false,
                error: 'La cuota seleccionada no pertenece a este préstamo.'
            });
        }


        const cuota = cuotas[0];


        /* ====================================================
           VALIDAR ESTADO DE LA CUOTA
           ==================================================== */

        if (
            cuota.estado !== 'PENDIENTE' &&
            cuota.estado !== 'VENCIDA'
        ) {

            await connection.rollback();
            connection.release();
            connection = null;

            return res.status(400).json({
                ok: false,
                error:
                    'La cuota seleccionada no está disponible para pago.'
            });
        }


       /* ====================================================
   VALIDAR SALDO
   ==================================================== */

const saldoActual =
    Number(prestamo.saldo_pendiente || 0);


/* ====================================================
   CALCULAR ABONOS EXTRAORDINARIOS DE LA CUOTA
   ==================================================== */

const [abonosCuota] =
    await connection.query(`
        SELECT
            COALESCE(
                SUM(valor),
                0
            ) AS total_abonado
        FROM nomina_prestamos_movimientos
        WHERE cuota_id = ?
  AND tipo_movimiento IN (
      'ABONO_EXTRAORDINARIO',
      'PAGO_CUOTA'
  )
    `, [
        cuotaId
    ]);


const totalAbonadoCuota =
    Number(
        abonosCuota[0]?.total_abonado || 0
    );


/* ====================================================
   CALCULAR SALDO REAL DE LA CUOTA
   ==================================================== */

const valorOriginalCuota =
    Number(
        cuota.valor_cuota || 0
    );


const valorPago =
    Math.max(
        valorOriginalCuota -
        totalAbonadoCuota,
        0
    );


if (valorPago <= 0) {

    await connection.rollback();
    connection.release();
    connection = null;

    return res.status(400).json({
        ok: false,
        error:
            'Esta cuota ya fue cubierta mediante abonos extraordinarios.'
    });

}


if (saldoActual <= 0) {

    await connection.rollback();
    connection.release();
    connection = null;

    return res.status(400).json({
        ok: false,
        error:
            'El préstamo ya no tiene saldo pendiente.'
    });
}

        if (saldoActual <= 0) {

            await connection.rollback();
            connection.release();
            connection = null;

            return res.status(400).json({
                ok: false,
                error:
                    'El préstamo ya no tiene saldo pendiente.'
            });
        }


        /* ====================================================
           NUEVO SALDO
           ==================================================== */

        const nuevoSaldo =
            Math.max(
                saldoActual - valorPago,
                0
            );


        const nuevoEstadoPrestamo =
            nuevoSaldo <= 0.01
                ? 'PAGADO'
                : 'ACTIVO';


        /* ====================================================
           MARCAR CUOTA COMO PAGADA
           ==================================================== */

        await connection.query(`
            UPDATE nomina_prestamos_cuotas
            SET
                estado = 'PAGADA',
                fecha_pago = ?,
                observacion = ?
            WHERE id = ?
              AND prestamo_id = ?
        `, [
            fecha_pago,
            observacion || null,
            cuotaId,
            prestamoId
        ]);


        /* ====================================================
           REGISTRAR MOVIMIENTO
           ==================================================== */

        await connection.query(`
            INSERT INTO nomina_prestamos_movimientos (
                prestamo_id,
                cuota_id,
                tipo_movimiento,
                fecha_movimiento,
                valor,
                valor_capital,
                valor_interes,
                medio_pago,
                observacion,
                usuario_id,
                fecha_registro
            )
            VALUES (
                ?,
                ?,
                'PAGO_CUOTA',
                NOW(),
                ?,
                ?,
                ?,
                ?,
                ?,
                ?,
                NOW()
            )
        `, [
            prestamoId,
            cuotaId,
            valorPago,
            Number(cuota.valor_capital || 0),
            Number(cuota.valor_interes || 0),
            medio_pago,
            observacion || null,
            usuarioId
        ]);


        /* ====================================================
           ACTUALIZAR PRÉSTAMO
           ==================================================== */

        await connection.query(`
            UPDATE nomina_prestamos
            SET
                saldo_pendiente = ?,
                estado = ?
            WHERE id = ?
        `, [
            nuevoSaldo,
            nuevoEstadoPrestamo,
            prestamoId
        ]);


        /* ====================================================
           CONFIRMAR
           ==================================================== */

        await connection.commit();

        connection.release();
        connection = null;


        return res.json({
            ok: true,
            mensaje:
                nuevoEstadoPrestamo === 'PAGADO'
                    ? 'Pago registrado. El préstamo ha sido pagado completamente.'
                    : 'Pago de cuota registrado correctamente.',
            pago: {
                prestamo_id: prestamoId,
                cuota_id: cuotaId,
                numero_cuota: cuota.numero_cuota,
                valor: valorPago,
                saldo_anterior: saldoActual,
                saldo_nuevo: nuevoSaldo,
                estado_prestamo: nuevoEstadoPrestamo
            }
        });


    } catch (error) {

        console.error(
            '❌ Error registrando pago de cuota:',
            error
        );


        if (connection) {

            try {
                await connection.rollback();
            } catch (rollbackError) {

                console.error(
                    '❌ Error en rollback del pago:',
                    rollbackError
                );
            }

            connection.release();
        }


        return res.status(500).json({
            ok: false,
            error:
                error.message ||
                'Error interno al registrar el pago de la cuota.'
        });
    }

});

/* ============================================================
   REGISTRAR ABONO EXTRAORDINARIO
   ============================================================ */

router.post(
    '/nomina/prestamos/:id/abono-extraordinario',
    async (req, res) => {

        const db = req.app.get('db');

        const usuarioId =
            req.session.usuarioID;


        if (!usuarioId) {

            return res.status(401).json({
                ok: false,
                error:
                    'La sesión del usuario no es válida.'
            });

        }


        let connection = null;


        try {

            const prestamoId =
                Number(req.params.id);


            const {
                valor,
                fecha_abono,
                medio_pago,
                observacion
            } = req.body;


            /* =================================================
               VALIDACIONES
               ================================================= */

            if (
                !Number.isInteger(prestamoId) ||
                prestamoId <= 0
            ) {

                return res.status(400).json({
                    ok: false,
                    error:
                        'El préstamo indicado no es válido.'
                });

            }


            const valorAbono =
                Number(valor);


            if (
                !Number.isFinite(valorAbono) ||
                valorAbono <= 0
            ) {

                return res.status(400).json({
                    ok: false,
                    error:
                        'El valor del abono debe ser mayor que cero.'
                });

            }


            if (!fecha_abono) {

                return res.status(400).json({
                    ok: false,
                    error:
                        'Debe indicar la fecha del abono.'
                });

            }


            if (
                medio_pago !== 'TRANSFERENCIA' &&
                medio_pago !== 'EFECTIVO'
            ) {

                return res.status(400).json({
                    ok: false,
                    error:
                        'Debe seleccionar un medio de pago válido.'
                });

            }


            /* =================================================
               CONEXIÓN
               ================================================= */

            connection =
                await db.getConnection();


            await connection.beginTransaction();


            /* =================================================
               CONSULTAR PRÉSTAMO Y BLOQUEARLO
               ================================================= */

            const [prestamos] =
                await connection.query(
                    `
                    SELECT
                        id,
                        empleado_id,
                        valor_prestamo,
                        valor_interes,
                        saldo_pendiente,
                        estado
                    FROM nomina_prestamos
                    WHERE id = ?
                    LIMIT 1
                    FOR UPDATE
                    `,
                    [
                        prestamoId
                    ]
                );


            if (!prestamos.length) {

                await connection.rollback();

                connection.release();

                connection = null;

                return res.status(404).json({
                    ok: false,
                    error:
                        'El préstamo no existe.'
                });

            }


            const prestamo =
                prestamos[0];


            /* =================================================
               VALIDAR ESTADO
               ================================================= */

            if (
                prestamo.estado !== 'ACTIVO'
            ) {

                await connection.rollback();

                connection.release();

                connection = null;

                return res.status(400).json({
                    ok: false,
                    error:
                        'Solo se pueden registrar abonos en préstamos activos.'
                });

            }


            /* =================================================
               SALDO ACTUAL
               ================================================= */

            const saldoActual =
                Number(
                    prestamo.saldo_pendiente || 0
                );


            if (saldoActual <= 0) {

                await connection.rollback();

                connection.release();

                connection = null;

                return res.status(400).json({
                    ok: false,
                    error:
                        'El préstamo ya no tiene saldo pendiente.'
                });

            }


            /* =================================================
               EL ABONO NO PUEDE CANCELAR TODO EL PRÉSTAMO
               ================================================= */

            if (
                valorAbono >= saldoActual
            ) {

                await connection.rollback();

                connection.release();

                connection = null;

                return res.status(400).json({
                    ok: false,
                    error:
                        'El abono debe ser menor al saldo pendiente. Para cancelar todo el saldo se utilizará la cancelación anticipada.'
                });

            }


            /* =================================================
               CONSULTAR CUOTAS PENDIENTES
               ================================================= */

            const [cuotas] =
                await connection.query(
                    `
                    SELECT
                        id,
                        prestamo_id,
                        numero_cuota,
                        fecha_programada,
                        valor_capital,
                        valor_interes,
                        valor_cuota,
                        estado
                    FROM nomina_prestamos_cuotas
                    WHERE prestamo_id = ?
                      AND estado IN (
                          'PENDIENTE',
                          'VENCIDA'
                      )
                    ORDER BY
                        fecha_programada ASC,
                        numero_cuota ASC
                    FOR UPDATE
                    `,
                    [
                        prestamoId
                    ]
                );


            if (!cuotas.length) {

                await connection.rollback();

                connection.release();

                connection = null;

                return res.status(400).json({
                    ok: false,
                    error:
                        'El préstamo no tiene cuotas pendientes disponibles para aplicar el abono.'
                });

            }


            /* =================================================
               APLICAR ABONO A LAS CUOTAS
               ================================================= */

            let restanteAbono =
                valorAbono;


            const cuotasAfectadas = [];


            for (
                const cuota of cuotas
            ) {

                if (
                    restanteAbono <= 0
                ) {
                    break;
                }


                /* =============================================
                   CONSULTAR ABONOS PREVIOS DE ESTA CUOTA
                   ============================================= */

                const [abonosPrevios] =
                    await connection.query(
                        `
                        SELECT
                            COALESCE(
                                SUM(valor),
                                0
                            ) AS total_abonado
                        FROM nomina_prestamos_movimientos
                        WHERE cuota_id = ?
                          AND tipo_movimiento =
                              'ABONO_EXTRAORDINARIO'
                        `,
                        [
                            cuota.id
                        ]
                    );


                const totalAbonado =
                    Number(
                        abonosPrevios[0]?.total_abonado || 0
                    );


                /* =============================================
                   VALOR ORIGINAL DE LA CUOTA
                   ============================================= */

                const valorCuota =
                    Number(
                        cuota.valor_cuota || 0
                    );


                /* =============================================
                   SALDO REAL DE ESTA CUOTA
                   ============================================= */

                const saldoCuota =
                    Math.max(
                        valorCuota -
                        totalAbonado,
                        0
                    );


                /* =============================================
                   SI YA ESTÁ CUBIERTA, CONTINUAR
                   ============================================= */

                if (
                    saldoCuota <= 0
                ) {
                    continue;
                }


                /* =============================================
                   VALOR QUE SE APLICA A ESTA CUOTA
                   ============================================= */

                const valorAplicado =
                    Math.min(
                        restanteAbono,
                        saldoCuota
                    );


                if (
                    valorAplicado <= 0
                ) {
                    continue;
                }


                /* =============================================
                   REGISTRAR MOVIMIENTO
                   ============================================= */

                await connection.query(
                    `
                    INSERT INTO nomina_prestamos_movimientos (
                        prestamo_id,
                        cuota_id,
                        tipo_movimiento,
                        fecha_movimiento,
                        valor,
                        valor_capital,
                        valor_interes,
                        medio_pago,
                        observacion,
                        usuario_id,
                        fecha_registro
                    )
                    VALUES (
                        ?,
                        ?,
                        'ABONO_EXTRAORDINARIO',
                        ?,
                        ?,
                        ?,
                        0,
                        ?,
                        ?,
                        ?,
                        NOW()
                    )
                    `,
                    [
                        prestamoId,
                        cuota.id,
                        `${fecha_abono} 00:00:00`,
                        valorAplicado,
                        valorAplicado,
                        medio_pago,
                        observacion || null,
                        usuarioId
                    ]
                );


                /* =============================================
                   GUARDAR INFORMACIÓN DE LA CUOTA AFECTADA
                   ============================================= */

                cuotasAfectadas.push({
                    cuota_id:
                        cuota.id,

                    numero_cuota:
                        cuota.numero_cuota,

                    valor_abonado:
                        valorAplicado,

                    saldo_anterior:
                        saldoCuota,

                    saldo_nuevo:
                        Math.max(
                            saldoCuota -
                            valorAplicado,
                            0
                        )
                });


                /* =============================================
                   RESTAR DEL ABONO
                   ============================================= */

                restanteAbono -=
                    valorAplicado;

            }


            /* =================================================
               VALIDAR QUE TODO EL ABONO HAYA SIDO APLICADO
               ================================================= */

            if (
                restanteAbono > 0.01
            ) {

                await connection.rollback();

                connection.release();

                connection = null;

                return res.status(400).json({
                    ok: false,
                    error:
                        'El valor del abono supera el saldo disponible de las cuotas pendientes.'
                });

            }


            /* =================================================
               NUEVO SALDO DEL PRÉSTAMO
               ================================================= */

            const nuevoSaldo =
                Math.max(
                    saldoActual -
                    valorAbono,
                    0
                );


            /* =================================================
               ACTUALIZAR SALDO
               ================================================= */

            await connection.query(
                `
                UPDATE nomina_prestamos
                SET
                    saldo_pendiente = ?
                WHERE id = ?
                `,
                [
                    nuevoSaldo,
                    prestamoId
                ]
            );


            /* =================================================
               CONFIRMAR
               ================================================= */

            await connection.commit();


            connection.release();

            connection = null;


            /* =================================================
               RESPUESTA
               ================================================= */

            return res.json({

                ok: true,

                mensaje:
                    'Abono extraordinario registrado correctamente.',

                abono: {

                    prestamo_id:
                        prestamoId,

                    valor:
                        valorAbono,

                    saldo_anterior:
                        saldoActual,

                    saldo_nuevo:
                        nuevoSaldo,

                    cuotas_afectadas:
                        cuotasAfectadas

                }

            });


        } catch (error) {

            console.error(
                '❌ Error registrando abono extraordinario:',
                error
            );


            if (connection) {

                try {

                    await connection.rollback();

                } catch (rollbackError) {

                    console.error(
                        '❌ Error en rollback del abono:',
                        rollbackError
                    );

                }


                connection.release();

            }


            return res.status(500).json({

                ok: false,

                error:
                    error.message ||
                    'Error interno al registrar el abono extraordinario.'

            });

        }

    }
);

/* ============================================================
   APLAZAR CUOTA
   ============================================================ */

router.post(
    '/nomina/prestamos/:id/aplazar-cuota',
    async (req, res) => {

        const db = req.app.get('db');
        const usuarioId = req.session.usuarioID;

        if (!usuarioId) {
            return res.status(401).json({
                ok: false,
                error: 'La sesión del usuario no es válida.'
            });
        }

        let connection = null;

        try {

            const prestamoId =
                Number(req.params.id);

            const {
    cuota_id,
    valor_descontar,
    opcion_aplazamiento,
    medio_pago,
    fecha_aplazamiento,
    fecha_reprogramada,
    observacion
} = req.body;


            /* =================================================
               VALIDACIONES BÁSICAS
               ================================================= */

            if (
                !Number.isInteger(prestamoId) ||
                prestamoId <= 0
            ) {
                return res.status(400).json({
                    ok: false,
                    error: 'El préstamo indicado no es válido.'
                });
            }


            const cuotaId =
                Number(cuota_id);

            if (
                !Number.isInteger(cuotaId) ||
                cuotaId <= 0
            ) {
                return res.status(400).json({
                    ok: false,
                    error: 'La cuota indicada no es válida.'
                });
            }


            const valorDescontar =
                Number(valor_descontar);


            if (
                !Number.isFinite(valorDescontar) ||
                valorDescontar < 0
            ) {
                return res.status(400).json({
                    ok: false,
                    error:
                        'El valor a descontar debe ser mayor o igual a cero.'
                });
            }


            const opcionesPermitidas = [
                'ACUMULAR',
                'MANTENER_VALOR_NORMAL',
                'REPROGRAMAR'
            ];


            if (
                !opcionesPermitidas.includes(
                    opcion_aplazamiento
                )
            ) {
                return res.status(400).json({
                    ok: false,
                    error:
                        'La opción de aplazamiento no es válida.'
                });
            }


            if (
                medio_pago !== 'TRANSFERENCIA' &&
                medio_pago !== 'EFECTIVO'
            ) {
                return res.status(400).json({
                    ok: false,
                    error:
                        'Debe seleccionar un medio de pago válido.'
                });
            }


            if (!fecha_aplazamiento) {
                return res.status(400).json({
                    ok: false,
                    error:
                        'Debe indicar la fecha del aplazamiento.'
                });
            }

            if (
    opcion_aplazamiento === 'REPROGRAMAR' &&
    !fecha_reprogramada
) {
    return res.status(400).json({
        ok: false,
        error: 'Debe seleccionar la fecha en la que se cobrará el saldo reprogramado.'
    });
}


            /* =================================================
               CONEXIÓN
               ================================================= */

            connection =
                await db.getConnection();

            await connection.beginTransaction();


            /* =================================================
               CONSULTAR Y BLOQUEAR PRÉSTAMO
               ================================================= */

            const [prestamos] =
                await connection.query(
                    `
                    SELECT
                        id,
                        empleado_id,
                        valor_prestamo,
                        saldo_pendiente,
                        estado
                    FROM nomina_prestamos
                    WHERE id = ?
                    LIMIT 1
                    FOR UPDATE
                    `,
                    [
                        prestamoId
                    ]
                );


            if (!prestamos.length) {

                await connection.rollback();
                connection.release();
                connection = null;

                return res.status(404).json({
                    ok: false,
                    error: 'El préstamo no existe.'
                });
            }


            const prestamo =
                prestamos[0];


            /* =================================================
               VALIDAR ESTADO DEL PRÉSTAMO
               ================================================= */

            if (prestamo.estado !== 'ACTIVO') {

                await connection.rollback();
                connection.release();
                connection = null;

                return res.status(400).json({
                    ok: false,
                    error:
                        'Solo se pueden aplazar cuotas de préstamos activos.'
                });
            }


            /* =================================================
               CONSULTAR CUOTA Y BLOQUEARLA
               ================================================= */

            const [cuotas] =
                await connection.query(
                    `
                    SELECT
                        id,
                        prestamo_id,
                        numero_cuota,
                        fecha_programada,
                        valor_capital,
                        valor_interes,
                        valor_cuota,
                        estado
                    FROM nomina_prestamos_cuotas
                    WHERE id = ?
                      AND prestamo_id = ?
                    LIMIT 1
                    FOR UPDATE
                    `,
                    [
                        cuotaId,
                        prestamoId
                    ]
                );


            if (!cuotas.length) {

                await connection.rollback();
                connection.release();
                connection = null;

                return res.status(404).json({
                    ok: false,
                    error:
                        'La cuota no pertenece al préstamo indicado.'
                });
            }


            const cuota =
                cuotas[0];


            /* =================================================
               VALIDAR ESTADO DE CUOTA
               ================================================= */

            if (
                cuota.estado !== 'PENDIENTE' &&
                cuota.estado !== 'VENCIDA'
            ) {

                await connection.rollback();
                connection.release();
                connection = null;

                return res.status(400).json({
                    ok: false,
                    error:
                        'Solo se pueden aplazar cuotas pendientes o vencidas.'
                });
            }


            /* =================================================
               CALCULAR SALDO REAL DE LA CUOTA
               
               Se tienen en cuenta abonos extraordinarios
               previamente registrados sobre esta cuota.
               ================================================= */

            const [abonos] =
                await connection.query(
                    `
                    SELECT
                        COALESCE(
                            SUM(valor),
                            0
                        ) AS total_abonado
                    FROM nomina_prestamos_movimientos
                    WHERE cuota_id = ?
                      AND prestamo_id = ?
                      AND tipo_movimiento = 'ABONO_EXTRAORDINARIO'
                    `,
                    [
                        cuotaId,
                        prestamoId
                    ]
                );


            const totalAbonado =
                Number(
                    abonos[0]?.total_abonado || 0
                );


            const valorOriginalCuota =
                Number(
                    cuota.valor_cuota || 0
                );


            const saldoCuota =
                Math.max(
                    valorOriginalCuota -
                    totalAbonado,
                    0
                );


            /* =================================================
               VALIDAR VALOR A DESCONTAR
               ================================================= */

            if (
                valorDescontar >
                saldoCuota
            ) {

                await connection.rollback();
                connection.release();
                connection = null;

                return res.status(400).json({
                    ok: false,
                    error:
                        'El valor a descontar no puede superar el saldo pendiente de la cuota.'
                });
            }


            /* =================================================
               CALCULAR VALOR APLAZADO
               ================================================= */

            const valorAplazado =
                Math.max(
                    saldoCuota -
                    valorDescontar,
                    0
                );


            if (valorAplazado <= 0) {

                await connection.rollback();
                connection.release();
                connection = null;

                return res.status(400).json({
                    ok: false,
                    error:
                        'No existe un valor pendiente para aplazar.'
                });
            }


            /* =================================================
               BUSCAR SIGUIENTE CUOTA
               ================================================= */

            const [siguientesCuotas] =
                await connection.query(
                    `
                    SELECT
                        id,
                        numero_cuota,
                        fecha_programada,
                        valor_cuota,
                        valor_capital,
                        valor_interes,
                        estado
                    FROM nomina_prestamos_cuotas
                    WHERE prestamo_id = ?
                      AND numero_cuota > ?
                      AND estado IN (
                          'PENDIENTE',
                          'VENCIDA'
                      )
                    ORDER BY
                        numero_cuota ASC
                    LIMIT 1
                    FOR UPDATE
                    `,
                    [
                        prestamoId,
                        cuota.numero_cuota
                    ]
                );


            const siguienteCuota =
                siguientesCuotas.length
                    ? siguientesCuotas[0]
                    : null;


            /* =================================================
               OPCIÓN: ACUMULAR
               
               El saldo aplazado se suma a la siguiente
               cuota existente.
               ================================================= */

            if (
                opcion_aplazamiento ===
                'ACUMULAR'
            ) {

                if (!siguienteCuota) {

                    await connection.rollback();
                    connection.release();
                    connection = null;

                    return res.status(400).json({
                        ok: false,
                        error:
                            'No existe una siguiente cuota disponible para acumular el valor aplazado.'
                    });
                }


                const nuevoValorCuota =
                    Number(
                        siguienteCuota.valor_cuota
                    ) +
                    valorAplazado;


                await connection.query(
                    `
                    UPDATE nomina_prestamos_cuotas
                    SET
                        valor_cuota = ?,
                        observacion = CONCAT(
                            COALESCE(observacion, ''),
                            CASE
                                WHEN COALESCE(observacion, '') = ''
                                THEN ''
                                ELSE ' | '
                            END,
                            'Incluye aplazamiento de cuota #',
                            ?
                        )
                    WHERE id = ?
                    `,
                    [
                        nuevoValorCuota,
                        cuota.numero_cuota,
                        siguienteCuota.id
                    ]
                );
            }


            /* =================================================
               OPCIÓN: MANTENER VALOR NORMAL
               
               La cuota siguiente conserva su valor normal
               y se crea una nueva cuota al final por el
               valor aplazado.
               ================================================= */

            if (
    opcion_aplazamiento ===
    'MANTENER_VALOR_NORMAL'
) {

    /* =================================================
       OBTENER LAS DOS ÚLTIMAS CUOTAS
       ================================================= */

    const [ultimasCuotas] =
        await connection.query(
            `
            SELECT
                numero_cuota,
                fecha_programada,
                valor_cuota
            FROM nomina_prestamos_cuotas
            WHERE prestamo_id = ?
            ORDER BY
                numero_cuota DESC
            LIMIT 2
            FOR UPDATE
            `,
            [
                prestamoId
            ]
        );


    if (
        !ultimasCuotas ||
        ultimasCuotas.length === 0
    ) {

        await connection.rollback();
        connection.release();
        connection = null;

        return res.status(400).json({
            ok: false,
            error:
                'No fue posible determinar las fechas de las cuotas del préstamo.'
        });
    }


    /* =================================================
       DETERMINAR LA ÚLTIMA CUOTA
       ================================================= */

    const ultima =
        ultimasCuotas[0];


    const nuevaNumeroCuota =
        Number(
            ultima.numero_cuota
        ) + 1;


    /* =================================================
       DETERMINAR LA PERIODICIDAD
       
       Si hay dos cuotas:
       - diferencia cercana a 15 días = QUINCENAL
       - diferencia mayor = MENSUAL
       ================================================= */

    let nuevaFecha;


    if (
        ultimasCuotas.length >= 2
    ) {

        const anterior =
            ultimasCuotas[1];


        const fechaAnterior =
            new Date(
                `${anterior.fecha_programada}T00:00:00`
            );


        const fechaUltima =
            new Date(
                `${ultima.fecha_programada}T00:00:00`
            );


        const diferenciaDias =
            Math.round(
                (
                    fechaUltima.getTime() -
                    fechaAnterior.getTime()
                ) /
                (
                    1000 *
                    60 *
                    60 *
                    24
                )
            );


        /* =============================================
           QUINCENAL
           ============================================= */

        if (
            diferenciaDias >= 13 &&
            diferenciaDias <= 17
        ) {

            nuevaFecha =
                sumarDias(
                    fechaUltima,
                    15
                );

        }

        /* =============================================
           MENSUAL
           ============================================= */

        else {

            nuevaFecha =
                sumarMes(
                    fechaUltima
                );

        }

    } else {

        await connection.rollback();
        connection.release();
        connection = null;

        return res.status(400).json({
            ok: false,
            error:
                'No hay suficientes cuotas para determinar la periodicidad del préstamo.'
        });
    }


    /* =================================================
       CREAR LA NUEVA CUOTA
       
       Esta cuota contiene únicamente
       el valor que fue aplazado.
       ================================================= */

    await connection.query(
        `
        INSERT INTO nomina_prestamos_cuotas (
            prestamo_id,
            numero_cuota,
            fecha_programada,
            valor_capital,
            valor_interes,
            valor_cuota,
            estado,
            fecha_pago,
            observacion,
            fecha_registro
        )
        VALUES (
            ?,
            ?,
            ?,
            ?,
            0,
            ?,
            'PENDIENTE',
            NULL,
            ?,
            NOW()
        )
        `,
        [
            prestamoId,

            nuevaNumeroCuota,

            formatearFechaSQL(
                nuevaFecha
            ),

            valorAplazado,

            valorAplazado,

            `Cuota generada por aplazamiento de cuota #${cuota.numero_cuota}`
        ]
    );


    /* =================================================
       ACTUALIZAR FECHA DE FINALIZACIÓN DEL PRÉSTAMO
       ================================================= */

    await connection.query(
        `
        UPDATE nomina_prestamos
        SET
            fecha_finalizacion = ?
        WHERE id = ?
        `,
        [
            formatearFechaSQL(
                nuevaFecha
            ),

            prestamoId
        ]
    );
}


            /* =================================================
               OPCIÓN: REPROGRAMAR MANUALMENTE
               
               No se modifica automáticamente la fecha.
               Solo se registra el aplazamiento para que
               posteriormente pueda hacerse la
               reprogramación manual.
               ================================================= */

            if (
    opcion_aplazamiento ===
    'REPROGRAMAR'
) {

    /* =================================================
       CREAR CUOTA EN LA FECHA SELECCIONADA
       ================================================= */

    const [ultimaCuotaResult] =
        await connection.query(
            `
            SELECT
                numero_cuota
            FROM nomina_prestamos_cuotas
            WHERE prestamo_id = ?
            ORDER BY numero_cuota DESC
            LIMIT 1
            FOR UPDATE
            `,
            [prestamoId]
        );

    const nuevaNumeroCuota =
        ultimaCuotaResult.length > 0
            ? Number(
                ultimaCuotaResult[0].numero_cuota
            ) + 1
            : 1;


    /* =================================================
       CREAR CUOTA REPROGRAMADA
       ================================================= */

    await connection.query(
        `
        INSERT INTO nomina_prestamos_cuotas (
            prestamo_id,
            numero_cuota,
            fecha_programada,
            valor_capital,
            valor_interes,
            valor_cuota,
            estado,
            fecha_pago,
            observacion,
            fecha_registro
        )
        VALUES (
            ?,
            ?,
            ?,
            ?,
            0,
            ?,
            'PENDIENTE',
            NULL,
            ?,
            NOW()
        )
        `,
        [
            prestamoId,
            nuevaNumeroCuota,
            fecha_reprogramada,
            valorAplazado,
            valorAplazado,
            `Saldo reprogramado de cuota #${cuota.numero_cuota} para el ${fecha_reprogramada}`
        ]
    );


    /* =================================================
       ACTUALIZAR FECHA FINAL DEL PRÉSTAMO
       SOLO SI LA NUEVA FECHA ES POSTERIOR
       ================================================= */

    await connection.query(
        `
        UPDATE nomina_prestamos
        SET
            fecha_finalizacion =
                CASE
                    WHEN fecha_finalizacion IS NULL
                         OR fecha_finalizacion < ?
                    THEN ?
                    ELSE fecha_finalizacion
                END
        WHERE id = ?
        `,
        [
            fecha_reprogramada,
            fecha_reprogramada,
            prestamoId
        ]
    );
}


            /* =================================================
               REGISTRAR MOVIMIENTO DE APLAZAMIENTO
               ================================================= */

            await connection.query(
                `
                INSERT INTO nomina_prestamos_movimientos (
                    prestamo_id,
                    cuota_id,
                    tipo_movimiento,
                    fecha_movimiento,
                    valor,
                    valor_capital,
                    valor_interes,
                    medio_pago,
                    observacion,
                    usuario_id,
                    fecha_registro
                )
                VALUES (
                    ?,
                    ?,
                    'APLAZAMIENTO',
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
                    prestamoId,
                    cuotaId,
                    `${fecha_aplazamiento} 00:00:00`,
                    valorAplazado,
                    valorAplazado,
                    0,
                    medio_pago,
                    observacion ||
                        `Aplazamiento de cuota #${cuota.numero_cuota}`,
                    usuarioId
                ]
            );


            /* =================================================
               REGISTRAR EL PAGO PARCIAL DE LA CUOTA
               ================================================= */

            if (valorDescontar > 0) {

                await connection.query(
                    `
                    INSERT INTO nomina_prestamos_movimientos (
                        prestamo_id,
                        cuota_id,
                        tipo_movimiento,
                        fecha_movimiento,
                        valor,
                        valor_capital,
                        valor_interes,
                        medio_pago,
                        observacion,
                        usuario_id,
                        fecha_registro
                    )
                    VALUES (
                        ?,
                        ?,
                        'PAGO_CUOTA',
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
                        prestamoId,
                        cuotaId,
                        `${fecha_aplazamiento} 00:00:00`,
                        valorDescontar,
                        valorDescontar,
                        0,
                        medio_pago,
                        'Pago realizado al momento de aplazar la cuota',
                        usuarioId
                    ]
                );
            }


            /* =================================================
               ACTUALIZAR ESTADO DE LA CUOTA ORIGINAL
               
               Si quedó completamente cubierta por el pago
               actual no tendría sentido aplazar, por eso
               aquí siempre queda pendiente del valor
               aplazado.
               ================================================= */

            await connection.query(
                `
                UPDATE nomina_prestamos_cuotas
                SET
                    estado = 'APLAZADA',
                    fecha_pago = NULL,
                    observacion = CONCAT(
                        COALESCE(observacion, ''),
                        CASE
                            WHEN COALESCE(observacion, '') = ''
                            THEN ''
                            ELSE ' | '
                        END,
                        'Aplazada. Valor aplazado: ',
                        ?
                    )
                WHERE id = ?
                `,
                [
                    valorAplazado,
                    cuotaId
                ]
            );


            /* =================================================
               ACTUALIZAR SALDO DEL PRÉSTAMO
               
               El aplazamiento NO reduce el saldo del préstamo.
               Solo mueve la obligación de una cuota a otra.
               
               El valor descontado sí representa un pago real.
               ================================================= */

            const nuevoSaldoPrestamo =
                Math.max(
                    Number(
                        prestamo.saldo_pendiente || 0
                    ) -
                    valorDescontar,
                    0
                );


            await connection.query(
                `
                UPDATE nomina_prestamos
                SET
                    saldo_pendiente = ?
                WHERE id = ?
                `,
                [
                    nuevoSaldoPrestamo,
                    prestamoId
                ]
            );


            /* =================================================
               CONFIRMAR
               ================================================= */

            await connection.commit();

            connection.release();
            connection = null;


            return res.json({
                ok: true,
                mensaje:
                    'Aplazamiento registrado correctamente.',
                aplazamiento: {
                    prestamo_id:
                        prestamoId,
                    cuota_id:
                        cuotaId,
                    cuota:
                        cuota.numero_cuota,
                    valor_original:
                        valorOriginalCuota,
                    valor_descontado:
                        valorDescontar,
                    valor_aplazado:
                        valorAplazado,
                    opcion:
                        opcion_aplazamiento,
                    saldo_prestamo:
                        nuevoSaldoPrestamo
                }
            });


        } catch (error) {

            console.error(
                '❌ Error registrando aplazamiento:',
                error
            );


            if (connection) {

                try {
                    await connection.rollback();
                } catch (rollbackError) {
                    console.error(
                        '❌ Error en rollback del aplazamiento:',
                        rollbackError
                    );
                }

                connection.release();
            }


            return res.status(500).json({
                ok: false,
                error:
                    error.message ||
                    'Error interno al registrar el aplazamiento.'
            });
        }
    }
);


/* ============================================================
   CREAR PRÉSTAMO
   ============================================================ */

router.post('/nomina/prestamos', async (req, res) => {

    const db = req.app.get('db');
    const usuarioId = req.session.usuarioID;

    if (!usuarioId) {
        return res.status(401).json({
            ok: false,
            error: 'La sesión del usuario no es válida.'
        });
    }

    let connection = null;

    try {

        const {
    empleado_id,
    fecha_prestamo,
    valor_prestamo,
    tiene_interes,
    porcentaje_interes,
    medio_desembolso,
    periodicidad,
    valor_cuota,
    cantidad_cuotas,
    fecha_primera_cuota,
    observacion
} = req.body;


        /* ====================================================
           VALIDACIONES BÁSICAS
           ==================================================== */

        if (!empleado_id) {
            return res.status(400).json({
                ok: false,
                error: 'Debe seleccionar un empleado.'
            });
        }

        if (!fecha_prestamo) {
            return res.status(400).json({
                ok: false,
                error: 'Debe indicar la fecha del préstamo.'
            });
        }

        if (!valor_prestamo || Number(valor_prestamo) <= 0) {
            return res.status(400).json({
                ok: false,
                error: 'El valor del préstamo debe ser mayor que cero.'
            });
        }

        if (!medio_desembolso) {
            return res.status(400).json({
                ok: false,
                error: 'Debe seleccionar el medio de desembolso.'
            });
        }

        if (!periodicidad) {
            return res.status(400).json({
                ok: false,
                error: 'Debe seleccionar la periodicidad.'
            });
        }

        if (!valor_cuota || Number(valor_cuota) <= 0) {
            return res.status(400).json({
                ok: false,
                error: 'El valor de la cuota debe ser mayor que cero.'
            });
        }

        if (!fecha_primera_cuota) {
            return res.status(400).json({
                ok: false,
                error: 'Debe indicar la fecha de la primera cuota.'
            });
        }

        if (
            Number(tiene_interes) === 1 ||
            tiene_interes === true
        ) {

            if (
                porcentaje_interes === undefined ||
                porcentaje_interes === null ||
                Number(porcentaje_interes) <= 0
            ) {
                return res.status(400).json({
                    ok: false,
                    error: 'Debe indicar el porcentaje de interés pactado.'
                });
            }

        }


        /* ====================================================
           VALIDAR EMPLEADO
           ==================================================== */

        connection = await db.getConnection();

        const [empleados] = await connection.query(`
    SELECT
        id,
        nombre,
        numero_documento
    FROM empleados
    WHERE id = ?
    LIMIT 1
`, [empleado_id]);


        if (!empleados.length) {

            connection.release();
            connection = null;

            return res.status(404).json({
                ok: false,
                error: 'El empleado seleccionado no existe.'
            });

        }


        const empleado = empleados[0];


        /* ====================================================
           PREPARAR VALORES
           ==================================================== */

        const tieneInteresBoolean =
            tiene_interes === true ||
            Number(tiene_interes) === 1;


        const porcentajeInteres =
            tieneInteresBoolean
                ? Number(porcentaje_interes || 0)
                : 0;


        /*
         * Inicialmente dejamos el cálculo del interés
         * basado en el porcentaje pactado.
         *
         * El valor total se manejará a partir de:
         *
         * capital + interés
         *
         * posteriormente podremos precisar la regla
         * financiera según el tipo de interés acordado.
         */

        const capital = Number(valor_prestamo);

        const valorInteres =
            tieneInteresBoolean
                ? capital * (porcentajeInteres / 100)
                : 0;


        const valorTotal =
            capital + valorInteres;


        /* ====================================================
           VALIDAR VALOR DE CUOTA
           ==================================================== */

        /* ====================================================
   VALIDAR VALOR Y CANTIDAD DE CUOTAS
   ==================================================== */

const cuota = Number(valor_cuota);
const cantidadCuotas = Number(cantidad_cuotas);

if (cuota <= 0) {

    connection.release();
    connection = null;

    return res.status(400).json({
        ok: false,
        error: 'El valor de la cuota debe ser mayor que cero.'
    });

}

if (
    !Number.isInteger(cantidadCuotas) ||
    cantidadCuotas <= 0
) {

    connection.release();
    connection = null;

    return res.status(400).json({
        ok: false,
        error:
            'La cantidad de cuotas debe ser un número entero mayor que cero.'
    });

}


/*
 * Total que cubrirían todas las cuotas configuradas.
 */
const totalConfigurado =
    cuota * cantidadCuotas;


/*
 * Total cubierto antes de la última cuota.
 */
const totalSinUltima =
    cuota * (cantidadCuotas - 1);


/*
 * Valor que tendría que tener la última cuota.
 */
const ultimaCuota =
    valorTotal - totalSinUltima;


/*
 * Las cuotas configuradas no alcanzan
 * para cubrir la obligación completa.
 */
if (totalConfigurado < valorTotal) {

    connection.release();
    connection = null;

    return res.status(400).json({
        ok: false,
        error:
            `La cantidad de cuotas no alcanza para cubrir el total ` +
            `del préstamo. Con ${cantidadCuotas} cuotas de ` +
            `$${cuota.toLocaleString('es-CO')} se cubrirían ` +
            `$${totalConfigurado.toLocaleString('es-CO')}.`
    });

}


/*
 * La cantidad de cuotas es excesiva.
 * La última cuota nunca puede ser $0 o negativa.
 */
if (ultimaCuota <= 0) {

    connection.release();
    connection = null;

    return res.status(400).json({
        ok: false,
        error:
            'La cantidad de cuotas es demasiado alta para el valor de la cuota.'
    });

}


        /* ====================================================
           INICIAR TRANSACCIÓN
           ==================================================== */

        await connection.beginTransaction();


        /* ====================================================
           CREAR PRÉSTAMO
           ==================================================== */

        const [resultadoPrestamo] = await connection.query(
            `
            INSERT INTO nomina_prestamos (
                empleado_id,
                fecha_prestamo,
                valor_prestamo,
                tiene_interes,
                tipo_interes,
                valor_interes,
                porcentaje_interes,
                observacion,
                medio_desembolso,
                estado,
                saldo_pendiente,
                fecha_finalizacion,
                usuario_registro,
                fecha_registro
            )
            VALUES (
    ?, ?, ?, ?, ?, ?, ?, ?, ?,
    'ACTIVO',
    ?,
    NULL,
    ?,
    NOW()
)

            `,
            [
    empleado_id,
    fecha_prestamo,
    capital,
    tieneInteresBoolean ? 1 : 0,
    tieneInteresBoolean ? 'PORCENTAJE' : null,
    valorInteres,
    porcentajeInteres,
    observacion || null,
    medio_desembolso,
    valorTotal,
    usuarioId
]
        );


        const prestamoId =
            resultadoPrestamo.insertId;

        /* ====================================================
   GENERAR CUOTAS
   ==================================================== */

let saldo = valorTotal;
let numeroCuota = 1;

let fechaCuota =
    new Date(`${fecha_primera_cuota}T00:00:00`);

for (let i = 1; i <= cantidadCuotas; i++) {

    let valorCuotaActual;

    if (i < cantidadCuotas) {
        valorCuotaActual = cuota;
    } else {
        valorCuotaActual = saldo;
    }

    const valorInteresCuota = 0;

    const valorCapitalCuota =
        valorCuotaActual - valorInteresCuota;

    await connection.query(
        `
        INSERT INTO nomina_prestamos_cuotas (
            prestamo_id,
            numero_cuota,
            fecha_programada,
            valor_capital,
            valor_interes,
            valor_cuota,
            estado,
            fecha_pago,
            observacion,
            fecha_registro
        )
        VALUES (
            ?, ?, ?, ?, ?, ?,
            'PENDIENTE',
            NULL,
            NULL,
            NOW()
        )
        `,
        [
            prestamoId,
            numeroCuota,
            formatearFechaSQL(fechaCuota),
            valorCapitalCuota,
            valorInteresCuota,
            valorCuotaActual
        ]
    );

    saldo -= valorCuotaActual;
    numeroCuota++;

    if (periodicidad === 'QUINCENAL') {
        fechaCuota = sumarDias(fechaCuota, 15);
    } else if (periodicidad === 'MENSUAL') {
        fechaCuota = sumarMes(fechaCuota);
    } else {
        throw new Error('Periodicidad de préstamo no válida.');
    }
}

        /* ====================================================
   ACTUALIZAR FECHA DE FINALIZACIÓN
   ==================================================== */

let fechaFinalizacion =
    new Date(fecha_primera_cuota);

for (let i = 1; i < cantidadCuotas; i++) {

    if (periodicidad === 'QUINCENAL') {
        fechaFinalizacion =
            sumarDias(fechaFinalizacion, 15);

    } else if (periodicidad === 'MENSUAL') {
        fechaFinalizacion =
            sumarMes(fechaFinalizacion);

    } else {
        throw new Error(
            'Periodicidad de préstamo no válida.'
        );
    }
}


        await connection.query(
            `
            UPDATE nomina_prestamos
            SET fecha_finalizacion = ?
            WHERE id = ?
            `,
            [
                formatearFechaSQL(fechaFinalizacion),
                prestamoId
            ]
        );


        /* ====================================================
           CONFIRMAR
           ==================================================== */

        await connection.commit();


        connection.release();
        connection = null;


        return res.status(201).json({
            ok: true,
            mensaje: 'Préstamo creado correctamente.',
            prestamo: {
                id: prestamoId,
                empleado_id,
                empleado: empleado.nombre,
                valor_prestamo: capital,
                valor_interes: valorInteres,
                valor_total: valorTotal,
                porcentaje_interes: porcentajeInteres,
                periodicidad,
                valor_cuota: cuota
            }
        });


    } catch (error) {

        console.error(
            '❌ Error creando préstamo:',
            error
        );


        if (connection) {

            try {
                await connection.rollback();
            } catch (rollbackError) {
                console.error(
                    '❌ Error en rollback:',
                    rollbackError
                );
            }

            connection.release();
        }


        return res.status(500).json({
            ok: false,
            error:
                error.message ||
                'Error interno al crear el préstamo.'
        });

    }

});


/* ============================================================
   FUNCIONES AUXILIARES
   ============================================================ */

function formatearFechaSQL(fecha) {

    const year =
        fecha.getFullYear();

    const month =
        String(
            fecha.getMonth() + 1
        ).padStart(2, '0');

    const day =
        String(
            fecha.getDate()
        ).padStart(2, '0');

    return `${year}-${month}-${day}`;
}


function sumarDias(fecha, dias) {

    const nuevaFecha =
        new Date(fecha);

    nuevaFecha.setDate(
        nuevaFecha.getDate() + dias
    );

    return nuevaFecha;
}


function sumarMes(fecha) {

    const nuevaFecha =
        new Date(fecha);

    const diaOriginal =
        nuevaFecha.getDate();

    nuevaFecha.setMonth(
        nuevaFecha.getMonth() + 1
    );

    /*
     * Evita problemas con fechas como
     * 31 de enero → febrero.
     */

    if (
        nuevaFecha.getDate() !== diaOriginal
    ) {

        nuevaFecha.setDate(0);

    }

    return nuevaFecha;
}


/* ============================================================
   EXPORTAR ROUTER
   ============================================================ */

module.exports = router;