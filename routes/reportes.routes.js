// ============================================================
// routes/reportes.routes.js
// MÓDULO HISTORIAL Y REPORTES · PROCESADOS MARGARITA
// ============================================================

const express = require('express');
const path = require('path');
const router = express.Router();

// ------------------------------------------------------------
// Helpers generales
// ------------------------------------------------------------
function getDB(req) {
    return req.app.get('db');
}

function sesionValida(req) {
    return !!(req.session && req.session.usuarioID);
}

function getRol(req) {
    return String((req.session && req.session.rol) || '').toUpperCase();
}

function esAdmin(req) {
    const rol = getRol(req);
    return rol.includes('ADMIN') || rol.includes('SUPER');
}

function requiereSesion(req, res, next) {
    if (!sesionValida(req)) {
        return res.status(401).json({ ok: false, error: 'Sesión no válida' });
    }
    next();
}

// ------------------------------------------------------------
// Helper: construir filtro de fecha dinámico
// ------------------------------------------------------------
function construirFiltroFecha(campo, tipo_fecha, fecha, mes, ano, desde, hasta, params) {
    if (tipo_fecha === 'DIA' && fecha) {
        params.push(fecha);
        return ` AND DATE(${campo}) = ? `;
    }
    if (tipo_fecha === 'MES' && mes) {
        params.push(mes);
        return ` AND DATE_FORMAT(${campo}, '%Y-%m') = ? `;
    }
    if (tipo_fecha === 'ANO' && ano) {
        params.push(ano);
        return ` AND YEAR(${campo}) = ? `;
    }
    if (tipo_fecha === 'RANGO' && desde && hasta) {
        params.push(desde, hasta);
        return ` AND DATE(${campo}) BETWEEN ? AND ? `;
    }
    return '';
}

// ============================================================
// PÁGINA PRINCIPAL
// ============================================================
router.get('/nomina/reportes', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'reportes.html'));
});

// ============================================================
// KPIs DEL DASHBOARD
// ============================================================
router.get('/api/nomina/reportes/kpis', requiereSesion, async (req, res) => {
    const db = getDB(req);
    let conn = null;
    try {
        conn = await db.getConnection();

        const [novedades] = await conn.query(`
            SELECT
                COUNT(*) AS total,
                SUM(CASE WHEN estado = 'PENDIENTE' THEN 1 ELSE 0 END) AS pendientes,
                SUM(CASE WHEN estado = 'APROBADA' THEN 1 ELSE 0 END) AS aprobadas,
                SUM(CASE WHEN estado = 'EN_HISTORIAL' THEN 1 ELSE 0 END) AS historial
            FROM nomina_novedades
        `);

        const [prestamos] = await conn.query(`
            SELECT
                COUNT(*) AS total,
                SUM(CASE WHEN estado = 'ACTIVO' THEN 1 ELSE 0 END) AS activos,
                COALESCE(SUM(CASE WHEN estado = 'ACTIVO' THEN saldo_pendiente ELSE 0 END), 0) AS saldo
            FROM nomina_prestamos
        `);

        const [produccion] = await conn.query(`
            SELECT
                COUNT(*) AS total,
                COALESCE(SUM(total_pagar), 0) AS total_pagado
            FROM nomina_liquidaciones_produccion
            WHERE DATE_FORMAT(fecha_generacion, '%Y-%m') = DATE_FORMAT(CURDATE(), '%Y-%m')
        `);

        const [descuentos] = await conn.query(`
            SELECT
                COUNT(*) AS total,
                COALESCE(SUM(valor_descuento), 0) AS total_descontado
            FROM nomina_descuentos_prestamos
            WHERE DATE_FORMAT(fecha_descuento, '%Y-%m') = DATE_FORMAT(CURDATE(), '%Y-%m')
        `);

        return res.json({
            ok: true,
            kpis: {
                novedades: novedades[0],
                prestamos: prestamos[0],
                produccion: produccion[0],
                descuentos: descuentos[0]
            }
        });
    } catch (error) {
        console.error('❌ Error KPIs reportes:', error);
        return res.status(500).json({ ok: false, error: error.message });
    } finally {
        if (conn) conn.release();
    }
});

// ============================================================
// REPORTE 1: NOVEDADES
// ============================================================
router.get('/api/nomina/reportes/novedades', requiereSesion, async (req, res) => {
    const db = getDB(req);
    let conn = null;
    try {
        conn = await db.getConnection();

        const { buscar, tipo, estado, tipo_fecha, fecha, mes, ano, desde, hasta } = req.query;
        const params = [];

        let sql = `
            SELECT
                n.id,
                e.nombre AS empleado,
                e.numero_documento,
                t.nombre AS tipo_novedad,
                t.categoria,
                n.fecha_inicio,
                n.fecha_fin,
                n.cantidad_dias,
                n.cantidad_horas,
                n.motivo,
                n.estado,
                n.fecha_creacion
            FROM nomina_novedades n
            LEFT JOIN empleados e ON e.id = n.empleado_id
            LEFT JOIN nomina_novedades_tipos t ON t.id = n.tipo_novedad_id
            WHERE 1 = 1
        `;

        if (!esAdmin(req)) {
            sql += ` AND n.empleado_id = ? `;
            params.push(req.session.empleadoID);
        }

        if (buscar) {
            const like = `%${buscar}%`;
            sql += ` AND (e.nombre LIKE ? OR e.numero_documento LIKE ? OR t.nombre LIKE ?) `;
            params.push(like, like, like);
        }
        if (tipo)   { sql += ` AND t.nombre = ? `; params.push(tipo); }
        if (estado) { sql += ` AND n.estado = ? `; params.push(estado); }

        sql += construirFiltroFecha('n.fecha_inicio', tipo_fecha, fecha, mes, ano, desde, hasta, params);

        sql += ` ORDER BY n.fecha_creacion DESC LIMIT 500 `;

        const [rows] = await conn.query(sql, params);
        return res.json({ ok: true, novedades: rows });
    } catch (error) {
        console.error('❌ Error reporte novedades:', error);
        return res.status(500).json({ ok: false, error: error.message });
    } finally {
        if (conn) conn.release();
    }
});

// ============================================================
// REPORTE 2: PRÉSTAMOS
// ============================================================
router.get('/api/nomina/reportes/prestamos', requiereSesion, async (req, res) => {
    const db = getDB(req);
    let conn = null;
    try {
        conn = await db.getConnection();

        const { buscar, estado, tipo_fecha, fecha, mes, ano, desde, hasta } = req.query;
        const params = [];

        let sql = `
            SELECT
                p.id,
                e.nombre AS empleado,
                e.numero_documento,
                p.fecha_prestamo,
                p.valor_prestamo,
                p.valor_interes,
                p.saldo_pendiente,
                p.estado,
                p.medio_desembolso,
                (SELECT COUNT(*) FROM nomina_prestamos_cuotas c WHERE c.prestamo_id = p.id) AS total_cuotas,
                (SELECT COUNT(*) FROM nomina_prestamos_cuotas c WHERE c.prestamo_id = p.id AND c.estado = 'PAGADA') AS cuotas_pagadas
            FROM nomina_prestamos p
            INNER JOIN empleados e ON e.id = p.empleado_id
            WHERE 1 = 1
        `;

        if (buscar) {
            const like = `%${buscar}%`;
            sql += ` AND (e.nombre LIKE ? OR e.numero_documento LIKE ?) `;
            params.push(like, like);
        }
        if (estado) { sql += ` AND p.estado = ? `; params.push(estado); }

        sql += construirFiltroFecha('p.fecha_prestamo', tipo_fecha, fecha, mes, ano, desde, hasta, params);
        sql += ` ORDER BY p.fecha_prestamo DESC LIMIT 500 `;

        const [rows] = await conn.query(sql, params);
        return res.json({ ok: true, prestamos: rows });
    } catch (error) {
        console.error('❌ Error reporte préstamos:', error);
        return res.status(500).json({ ok: false, error: error.message });
    } finally {
        if (conn) conn.release();
    }
});

// ============================================================
// REPORTE 3: MOVIMIENTOS DE PRÉSTAMOS
// ============================================================
router.get('/api/nomina/reportes/movimientos', requiereSesion, async (req, res) => {
    const db = getDB(req);
    let conn = null;
    try {
        conn = await db.getConnection();

        const { buscar, tipo, tipo_fecha, fecha, mes, ano, desde, hasta } = req.query;
        const params = [];

        let sql = `
            SELECT
                m.id,
                p.id AS prestamo_id,
                e.nombre AS empleado,
                e.numero_documento,
                m.tipo_movimiento,
                m.fecha_movimiento,
                m.valor,
                m.medio_pago,
                m.observacion
            FROM nomina_prestamos_movimientos m
            INNER JOIN nomina_prestamos p ON p.id = m.prestamo_id
            INNER JOIN empleados e ON e.id = p.empleado_id
            WHERE 1 = 1
        `;

        if (buscar) {
            const like = `%${buscar}%`;
            sql += ` AND (e.nombre LIKE ? OR e.numero_documento LIKE ?) `;
            params.push(like, like);
        }
        if (tipo) { sql += ` AND m.tipo_movimiento = ? `; params.push(tipo); }

        sql += construirFiltroFecha('m.fecha_movimiento', tipo_fecha, fecha, mes, ano, desde, hasta, params);
        sql += ` ORDER BY m.fecha_movimiento DESC LIMIT 500 `;

        const [rows] = await conn.query(sql, params);
        return res.json({ ok: true, movimientos: rows });
    } catch (error) {
        console.error('❌ Error reporte movimientos:', error);
        return res.status(500).json({ ok: false, error: error.message });
    } finally {
        if (conn) conn.release();
    }
});

// ============================================================
// REPORTE 4: LIQUIDACIONES DE PRODUCCIÓN (CORREGIDO ✅)
// ============================================================
router.get('/api/nomina/reportes/produccion', requiereSesion, async (req, res) => {
    const db = getDB(req);
    let conn = null;
    try {
        conn = await db.getConnection();

        const { buscar, tipo_fecha, fecha, mes, ano, desde, hasta } = req.query;
        const params = [];

        let sql = `
            SELECT
                l.id,
                COALESCE(e.nombre, '') AS colaborador,
                e.numero_documento,
                l.periodo_inicio,
                l.periodo_fin,
                l.total_kilos,
                l.total_pagar,
                l.fecha_generacion
            FROM nomina_liquidaciones_produccion l
            LEFT JOIN contratos c ON c.id = l.contrato_id
            LEFT JOIN empleados e ON e.id = c.empleado_id
            WHERE 1 = 1
        `;

        if (buscar) {
            const like = `%${buscar}%`;
            sql += ` AND (e.nombre LIKE ? OR e.numero_documento LIKE ?) `;
            params.push(like, like);
        }

        sql += construirFiltroFecha('l.fecha_generacion', tipo_fecha, fecha, mes, ano, desde, hasta, params);
        sql += ` ORDER BY l.fecha_generacion DESC LIMIT 500 `;

        const [rows] = await conn.query(sql, params);
        return res.json({ ok: true, produccion: rows });
    } catch (error) {
        console.error('❌ Error reporte producción:', error);
        return res.status(500).json({ ok: false, error: error.message });
    } finally {
        if (conn) conn.release();
    }
});

// ============================================================
// REPORTE 5: DESCUENTOS DE NÓMINA
// ============================================================
router.get('/api/nomina/reportes/descuentos', requiereSesion, async (req, res) => {
    const db = getDB(req);
    let conn = null;
    try {
        conn = await db.getConnection();

        const { buscar, tipo, tipo_fecha, fecha, mes, ano, desde, hasta } = req.query;
        const params = [];

        let sql = `
            SELECT
                d.id,
                e.nombre AS empleado,
                e.numero_documento,
                d.fecha_descuento,
                d.tipo_periodo,
                d.saldo_inicial,
                d.valor_descuento,
                d.saldo_final,
                d.observacion
            FROM nomina_descuentos_prestamos d
            INNER JOIN empleados e ON e.id = d.empleado_id
            WHERE 1 = 1
        `;

        if (buscar) {
            const like = `%${buscar}%`;
            sql += ` AND (e.nombre LIKE ? OR e.numero_documento LIKE ?) `;
            params.push(like, like);
        }
        if (tipo) { sql += ` AND d.tipo_periodo = ? `; params.push(tipo); }

        sql += construirFiltroFecha('d.fecha_descuento', tipo_fecha, fecha, mes, ano, desde, hasta, params);
        sql += ` ORDER BY d.fecha_descuento DESC LIMIT 500 `;

        const [rows] = await conn.query(sql, params);
        return res.json({ ok: true, descuentos: rows });
    } catch (error) {
        console.error('❌ Error reporte descuentos:', error);
        return res.status(500).json({ ok: false, error: error.message });
    } finally {
        if (conn) conn.release();
    }
});

// ============================================================
// 🔒 REPORTE 6: LIQUIDACIÓN DE NÓMINA (RESERVADO)
// ============================================================
// (Mismo bloque comentado que ya tienes, sin cambios)
// ...

// ============================================================
// EXPORTAR CSV POR TIPO
// ============================================================
router.get('/api/nomina/reportes/exportar/:tipo', requiereSesion, async (req, res) => {
    const db = getDB(req);
    const tipo = String(req.params.tipo || '').toLowerCase();
    let conn = null;
    try {
        conn = await db.getConnection();

        const { tipo_fecha, fecha, mes, ano, desde, hasta, buscar, estado, tipo: tipoFiltro } = req.query;
        const params = [];
        let sql = '';
        let columnas = [];
        let mapear = null;

        // ----------------------------------------------------
        // NOVEDADES
        // ----------------------------------------------------
        if (tipo === 'novedades') {
            columnas = [
                'ID', 'Empleado', 'Documento', 'Tipo', 'Categoría',
                'Inicio', 'Fin', 'Días', 'Horas', 'Estado', 'Registro'
            ];
            sql = `
                SELECT
                    n.id, e.nombre AS empleado, e.numero_documento,
                    t.nombre AS tipo, t.categoria,
                    n.fecha_inicio, n.fecha_fin, n.cantidad_dias,
                    n.cantidad_horas, n.estado, n.fecha_creacion
                FROM nomina_novedades n
                LEFT JOIN empleados e ON e.id = n.empleado_id
                LEFT JOIN nomina_novedades_tipos t ON t.id = n.tipo_novedad_id
                WHERE 1 = 1
            `;
            if (!esAdmin(req)) {
                sql += ` AND n.empleado_id = ? `;
                params.push(req.session.empleadoID);
            }
            if (buscar) {
                const l = `%${buscar}%`;
                sql += ` AND (e.nombre LIKE ? OR e.numero_documento LIKE ?)`;
                params.push(l, l);
            }
            if (estado) { sql += ` AND n.estado = ? `; params.push(estado); }
            sql += construirFiltroFecha('n.fecha_inicio', tipo_fecha, fecha, mes, ano, desde, hasta, params);
            sql += ` ORDER BY n.fecha_creacion DESC`;
            mapear = r => [
                r.id, r.empleado, r.numero_documento, r.tipo, r.categoria,
                r.fecha_inicio, r.fecha_fin, r.cantidad_dias,
                r.cantidad_horas, r.estado, r.fecha_creacion
            ];
        }

        // ----------------------------------------------------
        // PRÉSTAMOS
        // ----------------------------------------------------
        else if (tipo === 'prestamos') {
            columnas = [
                'ID', 'Empleado', 'Documento', 'Fecha', 'Valor',
                'Interés', 'Saldo', 'Estado', 'Cuotas', 'Pagadas'
            ];
            sql = `
                SELECT
                    p.id, e.nombre AS empleado, e.numero_documento,
                    p.fecha_prestamo, p.valor_prestamo, p.valor_interes,
                    p.saldo_pendiente, p.estado,
                    (SELECT COUNT(*) FROM nomina_prestamos_cuotas c WHERE c.prestamo_id = p.id) AS total_cuotas,
                    (SELECT COUNT(*) FROM nomina_prestamos_cuotas c WHERE c.prestamo_id = p.id AND c.estado = 'PAGADA') AS cuotas_pagadas
                FROM nomina_prestamos p
                INNER JOIN empleados e ON e.id = p.empleado_id
                WHERE 1 = 1
            `;
            if (buscar) {
                const l = `%${buscar}%`;
                sql += ` AND (e.nombre LIKE ? OR e.numero_documento LIKE ?)`;
                params.push(l, l);
            }
            if (estado) { sql += ` AND p.estado = ? `; params.push(estado); }
            sql += construirFiltroFecha('p.fecha_prestamo', tipo_fecha, fecha, mes, ano, desde, hasta, params);
            sql += ` ORDER BY p.fecha_prestamo DESC`;
            mapear = r => [
                r.id, r.empleado, r.numero_documento, r.fecha_prestamo,
                r.valor_prestamo, r.valor_interes, r.saldo_pendiente,
                r.estado, r.total_cuotas, r.cuotas_pagadas
            ];
        }

        // ----------------------------------------------------
        // MOVIMIENTOS
        // ----------------------------------------------------
        else if (tipo === 'movimientos') {
            columnas = [
                'ID', 'Empleado', 'Documento', 'Tipo', 'Fecha',
                'Valor', 'Medio', 'Observación'
            ];
            sql = `
                SELECT
                    m.id, e.nombre AS empleado, e.numero_documento,
                    m.tipo_movimiento, m.fecha_movimiento, m.valor,
                    m.medio_pago, m.observacion
                FROM nomina_prestamos_movimientos m
                INNER JOIN nomina_prestamos p ON p.id = m.prestamo_id
                INNER JOIN empleados e ON e.id = p.empleado_id
                WHERE 1 = 1
            `;
            if (buscar) {
                const l = `%${buscar}%`;
                sql += ` AND (e.nombre LIKE ? OR e.numero_documento LIKE ?)`;
                params.push(l, l);
            }
            if (tipoFiltro) { sql += ` AND m.tipo_movimiento = ? `; params.push(tipoFiltro); }
            sql += construirFiltroFecha('m.fecha_movimiento', tipo_fecha, fecha, mes, ano, desde, hasta, params);
            sql += ` ORDER BY m.fecha_movimiento DESC`;
            mapear = r => [
                r.id, r.empleado, r.numero_documento, r.tipo_movimiento,
                r.fecha_movimiento, r.valor, r.medio_pago, r.observacion
            ];
        }

        // ----------------------------------------------------
        // PRODUCCIÓN (CORREGIDO ✅)
        // ----------------------------------------------------
        else if (tipo === 'produccion') {
            columnas = [
                'ID', 'Colaborador', 'Documento', 'Periodo inicio',
                'Periodo fin', 'Total kilos', 'Total pagar', 'Fecha generación'
            ];
            sql = `
                SELECT
                    l.id,
                    COALESCE(e.nombre, '') AS colaborador,
                    e.numero_documento,
                    l.periodo_inicio, l.periodo_fin,
                    l.total_kilos, l.total_pagar, l.fecha_generacion
                FROM nomina_liquidaciones_produccion l
                LEFT JOIN contratos c ON c.id = l.contrato_id
                LEFT JOIN empleados e ON e.id = c.empleado_id
                WHERE 1 = 1
            `;
            if (buscar) {
                const l = `%${buscar}%`;
                sql += ` AND (e.nombre LIKE ? OR e.numero_documento LIKE ?)`;
                params.push(l, l);
            }
            sql += construirFiltroFecha('l.fecha_generacion', tipo_fecha, fecha, mes, ano, desde, hasta, params);
            sql += ` ORDER BY l.fecha_generacion DESC`;
            mapear = r => [
                r.id, r.colaborador, r.numero_documento,
                r.periodo_inicio, r.periodo_fin,
                r.total_kilos, r.total_pagar, r.fecha_generacion
            ];
        }

        // ----------------------------------------------------
        // DESCUENTOS
        // ----------------------------------------------------
        else if (tipo === 'descuentos') {
            columnas = [
                'ID', 'Empleado', 'Documento', 'Fecha', 'Quincena',
                'Saldo inicial', 'Descontado', 'Saldo final', 'Observación'
            ];
            sql = `
                SELECT
                    d.id, e.nombre AS empleado, e.numero_documento,
                    d.fecha_descuento, d.tipo_periodo,
                    d.saldo_inicial, d.valor_descuento, d.saldo_final,
                    d.observacion
                FROM nomina_descuentos_prestamos d
                INNER JOIN empleados e ON e.id = d.empleado_id
                WHERE 1 = 1
            `;
            if (buscar) {
                const l = `%${buscar}%`;
                sql += ` AND (e.nombre LIKE ? OR e.numero_documento LIKE ?)`;
                params.push(l, l);
            }
            if (tipoFiltro) { sql += ` AND d.tipo_periodo = ? `; params.push(tipoFiltro); }
            sql += construirFiltroFecha('d.fecha_descuento', tipo_fecha, fecha, mes, ano, desde, hasta, params);
            sql += ` ORDER BY d.fecha_descuento DESC`;
            mapear = r => [
                r.id, r.empleado, r.numero_documento, r.fecha_descuento,
                r.tipo_periodo, r.saldo_inicial, r.valor_descuento,
                r.saldo_final, r.observacion
            ];
        }

        else {
            return res.status(400).json({ ok: false, error: 'Tipo de reporte no soportado' });
        }

        const [rows] = await conn.query(sql, params);

        // Construir CSV
        let csv = '\uFEFF' + columnas.join(';') + '\n';
        rows.forEach(r => {
            csv += mapear(r)
                .map(v => `"${String(v ?? '').replace(/"/g, '""')}"`)
                .join(';') + '\n';
        });

        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader(
            'Content-Disposition',
            `attachment; filename="${tipo}_${new Date().toISOString().slice(0, 10)}.csv"`
        );
        return res.send(csv);

    } catch (error) {
        console.error('❌ Error exportando CSV:', error);
        return res.status(500).json({ ok: false, error: error.message });
    } finally {
        if (conn) conn.release();
    }
});

module.exports = router;