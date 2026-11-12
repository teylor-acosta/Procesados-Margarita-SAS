// ============================================================
// routes/nomina-novedades.routes.js
// BACKEND - NÓMINA NOVEDADES
// ============================================================

const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const multer = require('multer');

// ------------------------------------------------------------
// MULTER
// ------------------------------------------------------------
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = path.join(__dirname, '..', 'uploads', 'novedades');
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, unique + path.extname(file.originalname));
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const permitidos = /jpeg|jpg|png|pdf|doc|docx/i;
        if (permitidos.test(path.extname(file.originalname))) return cb(null, true);
        cb(new Error('Formato de archivo no permitido'));
    }
});

// ------------------------------------------------------------
// Helpers de sesión y roles
// ------------------------------------------------------------
function getDB(req) {
    return req.app.get('db');
}

function getRol(req) {
    return String((req.session && req.session.rol) || '').toUpperCase();
}

function esAdmin(req) {
    const rol = getRol(req);
    return rol.includes('ADMIN') || rol.includes('SUPER');
}

function sesionValida(req) {
    return !!(req.session && req.session.usuarioID);
}

function soloAdmin(req, res, next) {
    if (!sesionValida(req)) {
        return res.status(401).json({ success: false, message: 'Sesión no válida' });
    }
    if (!esAdmin(req)) {
        return res.status(403).json({ success: false, message: 'No autorizado' });
    }
    next();
}

function requiereSesion(req, res, next) {
    if (!sesionValida(req)) {
        return res.status(401).json({ success: false, message: 'Sesión no válida' });
    }
    next();
}

function normalizarBody(body) {
    const b = body || {};
    
    // Concatenar tipo_detalle en motivo
    let motivoFinal = b.motivo || b.concepto || '';
    const detalle = b.tipo_detalle || b.tipo_ausencia || b.tipo_incapacidad || b.tipo_permiso || b.tipo_licencia || b.tipo_hora;
    if (detalle) motivoFinal = `[${detalle}] ${motivoFinal}`.trim();

    // Concatenar valor y cuotas en observacion
    let obsFinal = b.observacion || '';
    if (b.valor || b.monto) obsFinal = `Valor: $${b.valor || b.monto} | ${obsFinal}`.trim();
    if (b.cuotas && b.cuotas > 1) obsFinal = `Cuotas: ${b.cuotas} | ${obsFinal}`.trim();

    return {
        tipo_novedad_id: b.tipo_novedad_id ? Number(b.tipo_novedad_id) : null,
        empleado_id: b.empleado_id ? Number(b.empleado_id) : null,
        fecha_inicio: b.fecha_inicio || b.fecha_permiso || b.fecha_trabajo || null,
        fecha_fin: b.fecha_fin || null,
        hora_inicio: b.hora_inicio || null,
        hora_fin: b.hora_fin || null,
        cantidad_dias: b.cantidad_dias ? Number(b.cantidad_dias) : null,
        cantidad_horas: b.cantidad_horas ? Number(b.cantidad_horas) : null,
        motivo: motivoFinal || null,
        observacion: obsFinal || null
    };
}

async function crearNovedad(req, data, soportes = []) {
    const db = getDB(req);
    
    const [result] = await db.query(`
        INSERT INTO nomina_novedades
        (empleado_id, tipo_novedad_id, fecha_inicio, fecha_fin,
         hora_inicio, hora_fin, cantidad_dias, cantidad_horas,
         motivo, observacion, estado, usuario_creacion, fecha_creacion)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'PENDIENTE', ?, NOW())
    `, [
        data.empleado_id, data.tipo_novedad_id, data.fecha_inicio, data.fecha_fin,
        data.hora_inicio, data.hora_fin, data.cantidad_dias, data.cantidad_horas,
        data.motivo, data.observacion, req.session.usuarioID
    ]);

    const novedadId = result.insertId;

    for (const s of soportes) {
        await db.query(`
            INSERT INTO nomina_novedades_soportes
            (novedad_id, nombre_archivo, ruta_archivo, tipo)
            VALUES (?, ?, ?, ?)
        `, [novedadId, s.originalname, `/uploads/novedades/${s.filename}`, s.mimetype]);
    }

    await db.query(`
        INSERT INTO nomina_novedades_historial
        (novedad_id, estado_anterior, estado_nuevo, usuario_id, fecha_registro)
        VALUES (?, NULL, 'PENDIENTE', ?, NOW())
    `, [novedadId, req.session.usuarioID]);

    return novedadId;
}

async function verificarPassword(db, userId, password) {
    const [rows] = await db.query(`SELECT password_hash FROM usuarios WHERE id = ? LIMIT 1`, [userId]);
    if (!rows.length) return false;
    const hash = rows[0].password_hash;
    if (typeof hash === 'string' && hash.startsWith('$2')) {
        try {
            const bcrypt = require('bcrypt');
            return await bcrypt.compare(password, hash);
        } catch (e) { return false; }
    }
    return String(hash) === String(password);
}

// ============================================================
// 🔹 HISTORIAL
// ============================================================

router.get('/historial', requiereSesion, async (req, res) => {
    try {
        const db = getDB(req);
        const { buscar, tipo, estado, tipo_fecha, fecha, mes, ano, desde, hasta } = req.query;

        let sql = `
            SELECT n.*, e.nombre AS empleado_nombre,
                   e.numero_documento, t.nombre AS tipo_novedad, t.categoria,
                   n.id AS id_historial
            FROM nomina_novedades n
            LEFT JOIN empleados e ON e.id = n.empleado_id
            LEFT JOIN nomina_novedades_tipos t ON t.id = n.tipo_novedad_id
            WHERE n.estado = 'EN_HISTORIAL'
        `;
        const params = [];

        if (!esAdmin(req)) {
            sql += ` AND n.empleado_id = ?`;
            params.push(req.session.empleadoID);
        }

        if (buscar) {
            sql += ` AND (e.nombre LIKE ? OR e.numero_documento LIKE ? OR t.nombre LIKE ?)`;
            const like = `%${buscar}%`;
            params.push(like, like, like);
        }
        if (tipo) { sql += ` AND n.tipo_novedad_id = ?`; params.push(tipo); }
        if (estado) { sql += ` AND n.estado = ?`; params.push(estado); }
        
        if (tipo_fecha === 'dia' && fecha) { sql += ` AND DATE(n.fecha_inicio) = ?`; params.push(fecha); }
        else if (tipo_fecha === 'mes' && mes) { sql += ` AND DATE_FORMAT(n.fecha_inicio, '%Y-%m') = ?`; params.push(mes); }
        else if (tipo_fecha === 'ano' && ano) { sql += ` AND YEAR(n.fecha_inicio) = ?`; params.push(ano); }
        else if (tipo_fecha === 'rango' && desde && hasta) { sql += ` AND DATE(n.fecha_inicio) BETWEEN ? AND ?`; params.push(desde, hasta); }

        sql += ` ORDER BY n.fecha_creacion DESC`;

        const [rows] = await db.query(sql, params);
        res.json({ success: true, novedades: rows });
    } catch (err) {
        console.error('Error GET /historial:', err);
        res.status(500).json({ success: false, message: err.message });
    }
});

router.get('/historial/exportar', requiereSesion, async (req, res) => {
    try {
        const db = getDB(req);
        let sql = `
            SELECT n.id, e.nombre AS empleado_nombre, e.numero_documento, t.nombre AS tipo_novedad,
                   n.fecha_inicio, n.fecha_fin, n.cantidad_dias, n.cantidad_horas, n.estado, n.fecha_creacion
            FROM nomina_novedades n
            LEFT JOIN empleados e ON e.id = n.empleado_id
            LEFT JOIN nomina_novedades_tipos t ON t.id = n.tipo_novedad_id
            WHERE n.estado = 'EN_HISTORIAL'
        `;
        const params = [];
        if (!esAdmin(req)) {
            sql += ` AND n.empleado_id = ?`;
            params.push(req.session.empleadoID);
        }
        sql += ` ORDER BY n.fecha_creacion DESC`;

        const [rows] = await db.query(sql, params);
        const cols = ['ID', 'Empleado', 'Documento', 'Tipo', 'Inicio', 'Fin', 'Días', 'Horas', 'Estado', 'Registro'];
        let csv = '\uFEFF' + cols.join(';') + '\n';
        rows.forEach(r => {
            csv += [r.id, r.empleado_nombre || '', r.numero_documento || '', r.tipo_novedad || '', r.fecha_inicio || '', r.fecha_fin || '', r.cantidad_dias || '', r.cantidad_horas || '', r.estado || '', r.fecha_creacion || ''].map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(';') + '\n';
        });
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="historial_${new Date().toISOString().slice(0,10)}.csv"`);
        res.send(csv);
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.put('/historial/:id/restaurar', requiereSesion, async (req, res) => {
    try {
        const db = getDB(req);
        if (!esAdmin(req)) {
            const [nov] = await db.query(`SELECT empleado_id FROM nomina_novedades WHERE id = ?`, [req.params.id]);
            if (!nov.length || Number(nov[0].empleado_id) !== Number(req.session.empleadoID)) return res.status(403).json({ success: false, message: 'No autorizado' });
        }
        await db.query(`UPDATE nomina_novedades SET estado = 'PENDIENTE', observacion_rechazo = NULL WHERE id = ?`, [req.params.id]);
        await db.query(`
            INSERT INTO nomina_novedades_historial 
            (novedad_id, estado_anterior, estado_nuevo, observacion, usuario_id, fecha_registro) 
            VALUES (?, 'EN_HISTORIAL', 'PENDIENTE', 'Restaurada', ?, NOW())
        `, [req.params.id, req.session.usuarioID]);
        
        res.json({ success: true, message: 'Restaurada' });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.delete('/historial/:id', requiereSesion, async (req, res) => {
    try {
        const db = getDB(req);
        const { password } = req.body;
        if (!password) return res.status(400).json({ success: false, message: 'Ingresa tu contraseña' });

        if (!esAdmin(req)) {
            const [nov] = await db.query(`SELECT empleado_id FROM nomina_novedades WHERE id = ?`, [req.params.id]);
            if (!nov.length || Number(nov[0].empleado_id) !== Number(req.session.empleadoID)) return res.status(403).json({ success: false, message: 'No autorizado' });
        }

        const passOk = await verificarPassword(db, req.session.usuarioID, password);
        if (!passOk) return res.status(403).json({ success: false, message: 'Contraseña incorrecta' });

        const [soportes] = await db.query(`SELECT ruta_archivo FROM nomina_novedades_soportes WHERE novedad_id = ?`, [req.params.id]);
        for (const s of soportes) {
            const filePath = path.join(__dirname, '..', s.ruta_archivo);
            if (fs.existsSync(filePath)) { try { fs.unlinkSync(filePath); } catch (e) {} }
        }
        await db.query(`DELETE FROM nomina_novedades_soportes WHERE novedad_id = ?`, [req.params.id]);
        await db.query(`DELETE FROM nomina_novedades_historial WHERE novedad_id = ?`, [req.params.id]);
        await db.query(`DELETE FROM nomina_novedades WHERE id = ?`, [req.params.id]);
        res.json({ success: true, message: 'Eliminado definitivamente' });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// ============================================================
// 🔹 NOVEDADES (CRUD)
// ============================================================

router.get('/', requiereSesion, async (req, res) => {
    try {
        const db = getDB(req);
        let sql = `
            SELECT n.*, e.nombre AS empleado_nombre, e.numero_documento, t.nombre AS tipo_novedad, t.categoria, n.id AS id_historial
            FROM nomina_novedades n
            LEFT JOIN empleados e ON e.id = n.empleado_id
            LEFT JOIN nomina_novedades_tipos t ON t.id = n.tipo_novedad_id
            WHERE n.estado <> 'EN_HISTORIAL'
        `;
        const params = [];
        if (!esAdmin(req)) { sql += ` AND n.empleado_id = ?`; params.push(req.session.empleadoID); }
        sql += ` ORDER BY n.fecha_creacion DESC`;
        const [rows] = await db.query(sql, params);
        res.json(rows);
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.get('/kpis', requiereSesion, async (req, res) => {
    try {
        const db = getDB(req);
        let sql = `SELECT estado, COUNT(*) AS total FROM nomina_novedades`;
        const params = [];
        if (!esAdmin(req)) { sql += ` WHERE empleado_id = ?`; params.push(req.session.empleadoID); }
        sql += ` GROUP BY estado`;
        const [rows] = await db.query(sql, params);
        const kpis = { pendientes: 0, aprobadas: 0, rechazadas: 0, historial: 0 };
        rows.forEach(r => {
            if (r.estado === 'PENDIENTE') kpis.pendientes = r.total;
            if (r.estado === 'APROBADA') kpis.aprobadas = r.total;
            if (r.estado === 'RECHAZADA') kpis.rechazadas = r.total;
            if (r.estado === 'EN_HISTORIAL') kpis.historial = r.total;
        });
        res.json({ success: true, kpis });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.get('/tipos', requiereSesion, async (req, res) => {
    try {
        const db = getDB(req);
        const [rows] = await db.query(`SELECT id, nombre, codigo, categoria, descripcion, permite_empleado, requiere_soporte, requiere_aprobacion FROM nomina_novedades_tipos WHERE activo = 1 ORDER BY categoria, nombre`);
        res.json({ success: true, tipos: rows });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.get('/:id', requiereSesion, async (req, res) => {
    try {
        const db = getDB(req);
        const [rows] = await db.query(`
            SELECT n.*, e.nombre AS empleado_nombre, e.numero_documento, t.nombre AS tipo_novedad, n.id AS id_historial
            FROM nomina_novedades n
            LEFT JOIN empleados e ON e.id = n.empleado_id
            LEFT JOIN nomina_novedades_tipos t ON t.id = n.tipo_novedad_id
            WHERE n.id = ?
        `, [req.params.id]);
        if (!rows.length) return res.status(404).json({ success: false, message: 'No encontrada' });
        if (!esAdmin(req) && Number(rows[0].empleado_id) !== Number(req.session.empleadoID)) return res.status(403).json({ success: false, message: 'No autorizado' });
        const [soportes] = await db.query(`SELECT * FROM nomina_novedades_soportes WHERE novedad_id = ?`, [req.params.id]);
        const [historial] = await db.query(`SELECT * FROM nomina_novedades_historial WHERE novedad_id = ? ORDER BY fecha_registro ASC`, [req.params.id]);
        res.json({ success: true, novedad: rows[0], soportes, historial });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// ============================================================
// 🔹 POST
// ============================================================

function forzarEmpleadoPropio(req, data) {
    if (!esAdmin(req)) data.empleado_id = req.session.empleadoID;
    return data;
}

router.post('/ausencia', requiereSesion, upload.single('soporte'), async (req, res) => {
    try { const id = await crearNovedad(req, forzarEmpleadoPropio(req, normalizarBody(req.body)), req.file ? [req.file] : []); res.json({ success: true, id }); } 
    catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.post('/incapacidad', requiereSesion, upload.single('soporte'), async (req, res) => {
    try { const id = await crearNovedad(req, forzarEmpleadoPropio(req, normalizarBody(req.body)), req.file ? [req.file] : []); res.json({ success: true, id }); } 
    catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.post('/permiso', requiereSesion, async (req, res) => {
    try { const id = await crearNovedad(req, forzarEmpleadoPropio(req, normalizarBody(req.body))); res.json({ success: true, id }); } 
    catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.post('/licencia', requiereSesion, async (req, res) => {
    try { const id = await crearNovedad(req, forzarEmpleadoPropio(req, normalizarBody(req.body))); res.json({ success: true, id }); } 
    catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.post('/vacaciones', requiereSesion, async (req, res) => {
    try {
        const data = forzarEmpleadoPropio(req, normalizarBody(req.body));
        if (!data.motivo) data.motivo = 'Vacaciones';
        const id = await crearNovedad(req, data); res.json({ success: true, id }); 
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.post('/horas-extra', requiereSesion, async (req, res) => {
    try { const id = await crearNovedad(req, forzarEmpleadoPropio(req, normalizarBody(req.body))); res.json({ success: true, id }); } 
    catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.post('/descuento', requiereSesion, upload.single('soporte'), async (req, res) => {
    try { const id = await crearNovedad(req, forzarEmpleadoPropio(req, normalizarBody(req.body)), req.file ? [req.file] : []); res.json({ success: true, id }); } 
    catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.post('/ingreso', requiereSesion, async (req, res) => {
    try { const id = await crearNovedad(req, forzarEmpleadoPropio(req, normalizarBody(req.body))); res.json({ success: true, id }); } 
    catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.post('/prestamo', requiereSesion, async (req, res) => {
    try { const id = await crearNovedad(req, forzarEmpleadoPropio(req, normalizarBody(req.body))); res.json({ success: true, id }); } 
    catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// ============================================================
// 🔹 PATCH (Solo Admin)
// ============================================================

router.patch('/:id/aprobar', soloAdmin, async (req, res) => {
    try {
        const db = getDB(req);
        const [actual] = await db.query(`SELECT estado FROM nomina_novedades WHERE id = ?`, [req.params.id]);
        if (!actual.length) return res.status(404).json({ success: false, message: 'No encontrada' });
        await db.query(`UPDATE nomina_novedades SET estado = 'APROBADA', usuario_revision = ?, fecha_revision = NOW() WHERE id = ?`, [req.session.usuarioID, req.params.id]);
        await db.query(`
            INSERT INTO nomina_novedades_historial 
            (novedad_id, estado_anterior, estado_nuevo, usuario_id, fecha_registro) 
            VALUES (?, ?, 'APROBADA', ?, NOW())
        `, [req.params.id, actual[0].estado, req.session.usuarioID]);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.patch('/:id/rechazar', soloAdmin, async (req, res) => {
    try {
        const db = getDB(req);
        const { observacion } = req.body;
        const [actual] = await db.query(`SELECT estado FROM nomina_novedades WHERE id = ?`, [req.params.id]);
        if (!actual.length) return res.status(404).json({ success: false, message: 'No encontrada' });
        await db.query(`UPDATE nomina_novedades SET estado = 'RECHAZADA', observacion_rechazo = ?, usuario_revision = ?, fecha_revision = NOW() WHERE id = ?`, [observacion || null, req.session.usuarioID, req.params.id]);
        await db.query(`
            INSERT INTO nomina_novedades_historial 
            (novedad_id, estado_anterior, estado_nuevo, observacion, usuario_id, fecha_registro) 
            VALUES (?, ?, 'RECHAZADA', ?, ?, NOW())
        `, [req.params.id, actual[0].estado, observacion || null, req.session.usuarioID]);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// ============================================================
// 🔹 DELETE (Solo Admin)
// ============================================================

router.delete('/:id', soloAdmin, async (req, res) => {
    try {
        const db = getDB(req);
        const [actual] = await db.query(`SELECT estado FROM nomina_novedades WHERE id = ?`, [req.params.id]);
        if (!actual.length) return res.status(404).json({ success: false, message: 'No encontrada' });
        await db.query(`UPDATE nomina_novedades SET estado = 'EN_HISTORIAL' WHERE id = ?`, [req.params.id]);
        await db.query(`
            INSERT INTO nomina_novedades_historial 
            (novedad_id, estado_anterior, estado_nuevo, usuario_id, fecha_registro) 
            VALUES (?, ?, 'EN_HISTORIAL', ?, NOW())
        `, [req.params.id, actual[0].estado, req.session.usuarioID]);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// ============================================================
// 🔹 CIERRE DE PERÍODO (Solo Admin)
// ============================================================

router.post('/cierre-periodo/validar', soloAdmin, async (req, res) => {
    try {
        const db = getDB(req);
        const [rows] = await db.query(`SELECT id FROM nomina_novedades WHERE estado = 'PENDIENTE' AND DATE_FORMAT(fecha_inicio, '%Y-%m') = ?`, [req.body.periodo]);
        res.json({ success: true, pendientes: rows });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.post('/cierre-periodo', soloAdmin, async (req, res) => {
    try {
        const db = getDB(req);
        const [result] = await db.query(`UPDATE nomina_novedades SET estado = 'PROCESADA' WHERE estado = 'APROBADA' AND DATE_FORMAT(fecha_inicio, '%Y-%m') = ?`, [req.body.periodo]);
        res.json({ success: true, actualizadas: result.affectedRows });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;