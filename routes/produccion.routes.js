const express = require('express');
const router = express.Router();

function getDB(req) {
    return req.app.get('db');
}

const asyncHandler = (fn) => (req, res, next) =>
    Promise.resolve(fn(req, res, next)).catch(next);

// ======================================================================
// 1. GET COLABORADORES
// ======================================================================
router.get('/api/nomina/produccion/colaboradores', asyncHandler(async (req, res) => {
    const db = getDB(req);

    const sql = `
        SELECT 
            c.id AS contrato_id,
            c.empleado_id AS empleado_id,
            e.*, 
            c.tipo_vinculacion
        FROM contratos c
        INNER JOIN empleados e ON e.id = c.empleado_id
        WHERE c.tipo_vinculacion = 'INDEPENDIENTE'
    `;

    const [rows] = await db.query(sql);

    const colaboradores = rows.map((r) => {
        const nombres = r.nombres || r.nombre || r.primer_nombre || '';
        const apellidos = r.apellidos || r.apellido || r.primer_apellido || '';
        
        return {
            contratoId: r.contrato_id,
            empleadoId: r.empleado_id,
            nombre: `${nombres} ${apellidos}`.trim() || 'Empleado sin nombre',
            documento: r.documento || r.cedula || r.identificacion || '—',
            tipoVinculacion: r.tipo_vinculacion || 'INDEPENDIENTE',
        };
    });

    res.json({ ok: true, colaboradores });
}));

// ======================================================================
// 2. GET MATERIALES
// ======================================================================
router.get('/api/nomina/produccion/materiales', asyncHandler(async (req, res) => {
    const db = getDB(req);
    const [rows] = await db.query(`SELECT * FROM nomina_materiales`);

    const materiales = rows.map((r) => {
        const precio = r.tarifa_kilo || r.precio || r.valor || r.tarifa || r.precio_kilo || 0;
        return {
            materialId: r.id || r.material_id,
            nombreMaterial: r.nombre || r.descripcion || r.material || 'Material',
            tarifaKilo: Number(precio) || 0,
        };
    });

    res.json({ ok: true, materiales });
}));

// ======================================================================
// 3. GET KILOS (CORREGIDO PARA USAR contrato_id)
// ======================================================================
router.get('/api/nomina/produccion/kilos', asyncHandler(async (req, res) => {
    const db = getDB(req);
    const contratoId = Number(req.query.contratoId);
    const desde = req.query.desde;
    const hasta = req.query.hasta;

    if (!contratoId || !desde || !hasta) return res.status(400).json({ ok: false, msg: 'Faltan parámetros' });

    const [rows] = await db.query(`
        SELECT material_id, SUM(kilos) AS total_kilos
        FROM produccion
        WHERE contrato_id = ? AND fecha BETWEEN ? AND ?
        GROUP BY material_id
    `, [contratoId, desde, hasta]);

    const kilosPorMaterial = {};
    rows.forEach((r) => { kilosPorMaterial[r.material_id] = Number(r.total_kilos) || 0; });

    res.json({ ok: true, kilosPorMaterial });
}));

// ======================================================================
// 4. POST LIQUIDAR
// ======================================================================
router.post('/api/nomina/produccion/liquidar', asyncHandler(async (req, res) => {
    const db = getDB(req);
    const { contratoId, periodoInicio, periodoFin, totalKilos, totalPagar, detalle } = req.body;
    const usuarioId = req.session?.usuarioID || null;

    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();

        const [result] = await conn.query(`
            INSERT INTO nomina_liquidaciones_produccion 
            (contrato_id, usuario_id, periodo_inicio, periodo_fin, total_kilos, total_pagar)
            VALUES (?, ?, ?, ?, ?, ?)
        `, [Number(contratoId), usuarioId, periodoInicio, periodoFin, Number(totalKilos), Number(totalPagar)]);

        const liquidacionId = result.insertId;
        const filas = detalle.map((d) => [
            liquidacionId, Number(d.materialId), String(d.material), Number(d.kilos), Number(d.tarifaKilo), Number(d.subtotal)
        ]);

        await conn.query(`
            INSERT INTO nomina_liquidaciones_produccion_detalle 
            (liquidacion_id, material_id, material_nombre, kilos, tarifa_kilo, subtotal)
            VALUES ?
        `, [filas]);

        await conn.commit();
        res.status(201).json({ ok: true, liquidacionId });
    } catch (error) {
        await conn.rollback();
        res.status(500).json({ ok: false, msg: error.message });
    } finally {
        conn.release();
    }
}));

// ======================================================================
// 5. GET HISTORIAL
// ======================================================================
router.get('/api/nomina/produccion/liquidaciones', asyncHandler(async (req, res) => {
    const db = getDB(req);

    const [rows] = await db.query(`
        SELECT l.id, l.contrato_id, e.*, l.periodo_inicio, l.periodo_fin, l.total_kilos, l.total_pagar, l.fecha_generacion
        FROM nomina_liquidaciones_produccion l
        LEFT JOIN contratos c ON c.id = l.contrato_id
        LEFT JOIN empleados e ON e.id = c.empleado_id
        ORDER BY l.fecha_generacion DESC LIMIT 100
    `);

    const liquidaciones = rows.map((r) => {
        const nombres = r.nombres || r.nombre || r.primer_nombre || '';
        const apellidos = r.apellidos || r.apellido || r.primer_apellido || '';
        return {
            liquidacionId: r.id,
            colaborador: `${nombres} ${apellidos}`.trim() || 'Desconocido',
            periodoInicio: r.periodo_inicio,
            periodoFin: r.periodo_fin,
            totalKilos: Number(r.total_kilos) || 0,
            totalPagar: Number(r.total_pagar) || 0,
            fechaGeneracion: r.fecha_generacion,
        };
    });

    res.json({ ok: true, liquidaciones });
}));

module.exports = router;