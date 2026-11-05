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

const carpetaSoportesNovedades = path.join(__dirname, '../public/uploads/nomina/novedades/soportes');

if (!fs.existsSync(carpetaSoportesNovedades)) {
    fs.mkdirSync(carpetaSoportesNovedades, { recursive: true });
}

/* ============================================================
   MULTER
   ============================================================ */

const storageSoportes = multer.diskStorage({
    destination(req, file, cb) {
        cb(null, carpetaSoportesNovedades);
    },
    filename(req, file, cb) {
        const extension = path.extname(file.originalname).toLowerCase();
        const nombreArchivo = `soporte_${Date.now()}_${Math.round(Math.random() * 100000)}${extension}`;
        cb(null, nombreArchivo);
    }
});

const uploadSoporte = multer({
    storage: storageSoportes,
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter(req, file, cb) {
        const tiposPermitidos = ['application/pdf', 'image/jpeg', 'image/png'];
        if (tiposPermitidos.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('El soporte debe ser PDF, JPG o PNG.'));
        }
    }
});

const { proteger } = require('../middlewares/auth');

/* ============================================================
   HELPERS DE RESPUESTA
   ============================================================ */

const responderOk = (res, data = {}, status = 200) => res.status(status).json({ success: true, ...data });
const responderError = (res, message, status = 500, extra = {}) => res.status(status).json({ success: false, message, ...extra });

/* ============================================================
   🔥 HELPER: DETERMINAR SI EL USUARIO VE TODAS LAS NOVEDADES
   Admin y Super Admin ven todo. Cualquier otro rol solo ve lo suyo.
   ============================================================ */

const ROLES_ACCESO_TOTAL = ['admin', 'super admin', 'superadmin', 'administrador', 'super administrador'];

function tieneAccesoTotal(rol) {
    if (!rol) return false;
    const limpio = String(rol).toLowerCase().trim().replace(/\s+/g, ' ');
    return ROLES_ACCESO_TOTAL.includes(limpio);
}

/* ============================================================
   HELPER: REGISTRAR AUDITORÍA
   ============================================================ */

async function registrarHistorial(connection, { novedadId, estadoAnterior, estadoNuevo, usuarioId, comentario }) {
    try {
        await connection.query(
            `INSERT INTO nomina_novedades_historial (novedad_id, estado_anterior, estado_nuevo, usuario_id, comentario, fecha_cambio) 
             VALUES (?, ?, ?, ?, ?, NOW())`,
            [novedadId, estadoAnterior || null, estadoNuevo, usuarioId || null, comentario || null]
        );
    } catch (error) {
        console.error('⚠️ No se pudo registrar historial:', error.message);
    }
}

/* ============================================================
   HELPER: GENERAR CSV
   ============================================================ */

const escapeCsv = (valor) => {
    if (valor === null || valor === undefined) return '';
    return `"${String(valor).replace(/"/g, '""')}"`;
};

const generarCSV = (filas, columnas) => {
    const encabezado = columnas.map((c) => escapeCsv(c.titulo)).join(',');
    const cuerpo = filas.map((fila) => columnas.map((c) => escapeCsv(fila[c.campo])).join(',')).join('\n');
    return '\uFEFF' + encabezado + '\n' + cuerpo;
};

/* ============================================================
   RUTA: PÁGINA PRINCIPAL HTML
   ============================================================ */

router.get('/nomina/novedades', proteger, (req, res) => {
    // Convertimos el rol a minúsculas para evitar errores
    const rol = (req.session.rol || '').toLowerCase().trim();
    
    if (rol === 'auxiliar') {
        res.sendFile(path.join(__dirname, '../public/mis-novedades.html'));
    } else {
        res.sendFile(path.join(__dirname, '../public/nomina-novedades.html'));
    }
});

/* ============================================================
   RUTA: LISTAR NOVEDADES ACTIVAS
   ============================================================ */

router.get('/api/nomina/novedades', proteger, async (req, res) => {
    try {
        const db = req.app.get('db');
        const rol = req.session.rol;
        const empleadoID = req.session.empleadoID;

        let sql = `
            SELECT n.id, n.empleado_id,
                   e.nombre AS empleado_nombre, e.numero_documento,
                   n.tipo_novedad_id, t.nombre AS tipo_novedad, t.codigo AS codigo_novedad, t.categoria,
                   n.fecha_inicio, n.fecha_fin, n.hora_inicio, n.hora_fin,
                   n.cantidad_dias, n.cantidad_horas, n.motivo, n.observacion,
                   n.estado, n.observacion_rechazo,
                   n.usuario_creacion, n.usuario_revision,
                   n.fecha_creacion, n.fecha_revision
            FROM nomina_novedades n
            INNER JOIN empleados e ON e.id = n.empleado_id
            INNER JOIN nomina_novedades_tipos t ON t.id = n.tipo_novedad_id
            WHERE (
                n.estado = 'PENDIENTE'
                OR (n.estado IN ('APROBADA', 'RECHAZADA') AND n.fecha_revision IS NOT NULL AND n.fecha_revision >= DATE_SUB(NOW(), INTERVAL 14 DAY))
            )
        `;

        const parametros = [];

        // 🔥 SOLO Admin / Super Admin ven todas. El resto ve solo sus novedades.
        if (!tieneAccesoTotal(rol)) {
            sql += ` AND n.empleado_id = ? `;
            parametros.push(empleadoID);
        }

        sql += ` ORDER BY n.fecha_creacion DESC `;

        const [novedades] = await db.query(sql, parametros);
        res.json({ success: true, rol, novedades });

    } catch (error) {
        console.error('ERROR LISTANDO NOVEDADES:', error);
        responderError(res, 'Error al consultar las novedades', 500);
    }
});

/* ============================================================
   RUTA: HISTORIAL / VENCIDAS
   ============================================================ */

router.get('/api/nomina/novedades/historial', proteger, async (req, res) => {
    try {
        const db = req.app.get('db');
        const rol = req.session.rol;
        const empleadoID = req.session.empleadoID;

        const { buscar, tipo, estado, tipo_fecha, fecha, mes, ano, desde, hasta } = req.query;

        let sql = `
            SELECT n.id, n.empleado_id, e.nombre AS empleado_nombre, e.numero_documento,
                   n.tipo_novedad_id, t.nombre AS tipo_novedad, t.codigo AS codigo_novedad, t.categoria,
                   n.fecha_inicio, n.fecha_fin, n.hora_inicio, n.hora_fin,
                   n.cantidad_dias, n.cantidad_horas, n.motivo, n.observacion,
                   n.estado, n.observacion_rechazo, n.usuario_creacion, n.usuario_revision,
                   n.fecha_creacion, n.fecha_revision
            FROM nomina_novedades n
            INNER JOIN empleados e ON e.id = n.empleado_id
            INNER JOIN nomina_novedades_tipos t ON t.id = n.tipo_novedad_id
            WHERE n.estado IN ('APROBADA', 'RECHAZADA')
              AND n.fecha_revision IS NOT NULL
              AND n.fecha_revision < DATE_SUB(NOW(), INTERVAL 14 DAY)
        `;

        const parametros = [];

        // 🔥 Filtro por rol
        if (!tieneAccesoTotal(rol)) {
            sql += ` AND n.empleado_id = ? `;
            parametros.push(empleadoID);
        }

        if (buscar && buscar.trim() !== '') {
            sql += ` AND (e.nombre LIKE ? OR e.numero_documento LIKE ? OR t.nombre LIKE ?) `;
            const texto = `%${buscar.trim()}%`;
            parametros.push(texto, texto, texto);
        }

        if (tipo) { sql += ` AND n.tipo_novedad_id = ? `; parametros.push(tipo); }
        if (estado && ['APROBADA', 'RECHAZADA'].includes(estado)) { sql += ` AND n.estado = ? `; parametros.push(estado); }
        if (tipo_fecha === 'dia' && fecha) { sql += ` AND DATE(n.fecha_revision) = ? `; parametros.push(fecha); }
        if (tipo_fecha === 'mes' && mes) { sql += ` AND DATE_FORMAT(n.fecha_revision, '%Y-%m') = ? `; parametros.push(mes); }
        if (tipo_fecha === 'ano' && ano) { sql += ` AND YEAR(n.fecha_revision) = ? `; parametros.push(ano); }
        if (tipo_fecha === 'rango' && desde && hasta) { sql += ` AND DATE(n.fecha_revision) BETWEEN ? AND ? `; parametros.push(desde, hasta); }

        sql += ` ORDER BY n.fecha_revision DESC `;

        const [novedades] = await db.query(sql, parametros);
        res.json({ success: true, novedades });

    } catch (error) {
        console.error('ERROR CONSULTANDO HISTORIAL:', error);
        responderError(res, 'Error al consultar el historial', 500);
    }
});

/* ============================================================
   RUTA: TIPOS DE NOVEDAD ACTIVOS
   ============================================================ */

router.get('/api/nomina/novedades/tipos', proteger, async (req, res) => {
    try {
        const db = req.app.get('db');
        const [tipos] = await db.query(`
            SELECT id, nombre, codigo, categoria, descripcion, permite_empleado, requiere_soporte, requiere_aprobacion
            FROM nomina_novedades_tipos WHERE activo = 1 ORDER BY categoria ASC, nombre ASC
        `);
        res.json({ success: true, tipos });
    } catch (error) {
        console.error('ERROR CARGANDO TIPOS:', error);
        responderError(res, 'Error al cargar los tipos de novedad', 500);
    }
});

/* ============================================================
   KPIs PARA EL DASHBOARD
   ============================================================ */

router.get('/api/nomina/novedades/kpis', proteger, async (req, res) => {
    try {
        const db = req.app.get('db');
        const rol = req.session.rol;
        const empleadoID = req.session.empleadoID;

        // 🔥 Solo Admin / Super Admin cuentan todo
        const filtroAuxiliar = !tieneAccesoTotal(rol) ? ' AND empleado_id = ? ' : '';
        const paramsAux = !tieneAccesoTotal(rol) ? [empleadoID] : [];

        const [pendientes] = await db.query(`SELECT COUNT(*) AS total FROM nomina_novedades WHERE estado = 'PENDIENTE' ${filtroAuxiliar}`, paramsAux);
        const [aprobadas] = await db.query(`SELECT COUNT(*) AS total FROM nomina_novedades WHERE estado = 'APROBADA' AND fecha_revision >= DATE_SUB(NOW(), INTERVAL 14 DAY) ${filtroAuxiliar}`, paramsAux);
        const [rechazadas] = await db.query(`SELECT COUNT(*) AS total FROM nomina_novedades WHERE estado = 'RECHAZADA' AND fecha_revision >= DATE_SUB(NOW(), INTERVAL 14 DAY) ${filtroAuxiliar}`, paramsAux);
        const [historial] = await db.query(`SELECT COUNT(*) AS total FROM nomina_novedades WHERE estado IN ('APROBADA', 'RECHAZADA') AND fecha_revision < DATE_SUB(NOW(), INTERVAL 14 DAY) ${filtroAuxiliar}`, paramsAux);

        return responderOk(res, {
            kpis: {
                pendientes: Number(pendientes[0].total || 0),
                aprobadas: Number(aprobadas[0].total || 0),
                rechazadas: Number(rechazadas[0].total || 0),
                historial: Number(historial[0].total || 0)
            }
        });

    } catch (error) {
        console.error('ERROR KPIs:', error);
        return responderError(res, 'No fue posible obtener los indicadores.', 500);
    }
});

/* ============================================================
   DETALLE DE NOVEDAD
   ============================================================ */

router.get('/api/nomina/novedades/:id', proteger, async (req, res) => {
    try {
        const db = req.app.get('db');
        const novedadId = Number(req.params.id);
        const rol = req.session.rol;
        const empleadoID = req.session.empleadoID;

        const [rows] = await db.query(`
            SELECT n.*, 
                   e.nombre AS empleado_nombre, e.numero_documento, 
                   t.nombre AS tipo_novedad, t.codigo AS codigo_novedad, t.categoria
            FROM nomina_novedades n
            INNER JOIN empleados e ON e.id = n.empleado_id
            INNER JOIN nomina_novedades_tipos t ON t.id = n.tipo_novedad_id
            WHERE n.id = ? LIMIT 1
        `, [novedadId]);

        if (!rows.length) return responderError(res, 'Novedad no encontrada.', 404);

        const novedad = rows[0];

        // 🔥 Validar que el usuario pueda ver esta novedad
        if (!tieneAccesoTotal(rol) && Number(novedad.empleado_id) !== Number(empleadoID)) {
            return responderError(res, 'Novedad no encontrada.', 404);
        }

        let soportes = [];
        try {
            const [s] = await db.query(
                `SELECT id, nombre_archivo, nombre_original, extension, tipo_mime, ruta_archivo, fecha_subida 
                 FROM nomina_novedades_soportes WHERE novedad_id = ? ORDER BY fecha_subida DESC`, 
                [novedadId]
            );
            soportes = s;
        } catch (e) {}

        let historial = [];
        try {
            const [h] = await db.query(
                `SELECT id, estado_anterior, estado_nuevo, usuario_id, comentario, fecha_cambio 
                 FROM nomina_novedades_historial WHERE novedad_id = ? ORDER BY fecha_cambio ASC`, 
                [novedadId]
            );
            historial = h;
        } catch (e) {}

        return responderOk(res, { novedad, soportes, historial });

    } catch (error) {
        console.error('ERROR DETALLE NOVEDAD:', error);
        return responderError(res, 'No fue posible obtener el detalle.', 500);
    }
});

/* ============================================================
   APROBAR NOVEDAD
   ============================================================ */

router.patch('/api/nomina/novedades/:id/aprobar', proteger, async (req, res) => {
    const db = req.app.get('db');
    let connection = null;

    try {
        const novedadId = Number(req.params.id);
        const usuarioId = req.session.usuarioID;

        connection = await db.getConnection();
        await connection.beginTransaction();

        const [rows] = await connection.query(`SELECT id, estado FROM nomina_novedades WHERE id = ? FOR UPDATE`, [novedadId]);

        if (!rows.length) throw new Error('Novedad no encontrada.');
        const estadoActual = rows[0].estado;

        if (estadoActual === 'APROBADA') throw new Error('La novedad ya está aprobada.');
        if (['RECHAZADA', 'ANULADA'].includes(estadoActual)) throw new Error(`No se puede aprobar una novedad en estado ${estadoActual}.`);

        await connection.query(`
            UPDATE nomina_novedades 
            SET estado = 'APROBADA', usuario_revision = ?, fecha_revision = NOW(), observacion_rechazo = NULL 
            WHERE id = ?
        `, [usuarioId, novedadId]);

        await registrarHistorial(connection, {
            novedadId, estadoAnterior: estadoActual, estadoNuevo: 'APROBADA', usuarioId, comentario: req.body?.comentario || 'Aprobación manual'
        });

        await connection.commit();
        return responderOk(res, { message: 'Novedad aprobada correctamente.', novedad_id: novedadId });

    } catch (error) {
        if (connection) try { await connection.rollback(); } catch (_) {}
        return responderError(res, error.message || 'No fue posible aprobar la novedad.', 400);
    } finally {
        if (connection) connection.release();
    }
});

/* ============================================================
   RECHAZAR NOVEDAD
   ============================================================ */

router.patch('/api/nomina/novedades/:id/rechazar', proteger, async (req, res) => {
    const observacion = String(req.body?.observacion || '').trim();
    if (!observacion) return responderError(res, 'Debes indicar la observación del rechazo.', 400);

    const db = req.app.get('db');
    let connection = null;

    try {
        const novedadId = Number(req.params.id);
        const usuarioId = req.session.usuarioID;

        connection = await db.getConnection();
        await connection.beginTransaction();

        const [rows] = await connection.query(`SELECT id, estado FROM nomina_novedades WHERE id = ? FOR UPDATE`, [novedadId]);
        if (!rows.length) throw new Error('Novedad no encontrada.');
        const estadoActual = rows[0].estado;

        if (estadoActual === 'RECHAZADA') throw new Error('La novedad ya está rechazada.');
        if (estadoActual === 'ANULADA') throw new Error('No se puede rechazar una novedad anulada.');

        await connection.query(`
            UPDATE nomina_novedades 
            SET estado = 'RECHAZADA', usuario_revision = ?, fecha_revision = NOW(), observacion_rechazo = ? 
            WHERE id = ?
        `, [usuarioId, observacion, novedadId]);

        await registrarHistorial(connection, {
            novedadId, estadoAnterior: estadoActual, estadoNuevo: 'RECHAZADA', usuarioId, comentario: observacion
        });

        await connection.commit();
        return responderOk(res, { message: 'Novedad rechazada correctamente.', novedad_id: novedadId });

    } catch (error) {
        if (connection) try { await connection.rollback(); } catch (_) {}
        return responderError(res, error.message || 'No fue posible rechazar la novedad.', 400);
    } finally {
        if (connection) connection.release();
    }
});

/* ============================================================
   ANULAR NOVEDAD
   ============================================================ */

router.patch('/api/nomina/novedades/:id/anular', proteger, async (req, res) => {
    const db = req.app.get('db');
    let connection = null;

    try {
        const novedadId = Number(req.params.id);
        const usuarioId = req.session.usuarioID;
        const motivo = String(req.body?.motivo || '').trim();

        if (!motivo) return responderError(res, 'Debes indicar el motivo de la anulación.', 400);

        connection = await db.getConnection();
        await connection.beginTransaction();

        const [rows] = await connection.query(`SELECT id, estado FROM nomina_novedades WHERE id = ? FOR UPDATE`, [novedadId]);
        if (!rows.length) throw new Error('Novedad no encontrada.');
        const estadoActual = rows[0].estado;

        if (estadoActual === 'ANULADA') throw new Error('La novedad ya está anulada.');

        await connection.query(`
            UPDATE nomina_novedades 
            SET estado = 'ANULADA', usuario_revision = ?, fecha_revision = NOW(), observacion_rechazo = ? 
            WHERE id = ?
        `, [usuarioId, motivo, novedadId]);

        await registrarHistorial(connection, {
            novedadId, estadoAnterior: estadoActual, estadoNuevo: 'ANULADA', usuarioId, comentario: motivo
        });

        await connection.commit();
        return responderOk(res, { message: 'Novedad anulada correctamente.', novedad_id: novedadId });

    } catch (error) {
        if (connection) try { await connection.rollback(); } catch (_) {}
        return responderError(res, error.message || 'No fue posible anular la novedad.', 400);
    } finally {
        if (connection) connection.release();
    }
});

/* ============================================================
   VALIDAR CIERRE DE PERÍODO
   ============================================================ */

router.post('/api/nomina/novedades/cierre-periodo/validar', proteger, async (req, res) => {
    const periodo = String(req.body?.periodo || '').trim();
    if (!/^\d{4}-\d{2}$/.test(periodo)) {
        return responderError(res, 'El período debe tener el formato YYYY-MM.', 400);
    }

    try {
        const db = req.app.get('db');
        const [pendientes] = await db.query(`
            SELECT id, empleado_id, tipo_novedad_id, estado 
            FROM nomina_novedades 
            WHERE DATE_FORMAT(fecha_inicio, '%Y-%m') = ? AND estado = 'PENDIENTE'
        `, [periodo]);

        return responderOk(res, {
            periodo,
            puede_cerrar: pendientes.length === 0,
            pendientes
        });

    } catch (error) {
        console.error('ERROR VALIDANDO CIERRE:', error);
        return responderError(res, 'No fue posible validar el cierre.', 500);
    }
});

/* ============================================================
   EJECUTAR CIERRE DE PERÍODO
   ============================================================ */

router.post('/api/nomina/novedades/cierre-periodo', proteger, async (req, res) => {
    const periodo = String(req.body?.periodo || '').trim();
    if (!/^\d{4}-\d{2}$/.test(periodo)) {
        return responderError(res, 'El período debe tener el formato YYYY-MM.', 400);
    }

    const db = req.app.get('db');
    let connection = null;

    try {
        const usuarioId = req.session.usuarioID;
        connection = await db.getConnection();
        await connection.beginTransaction();

        const [pendientes] = await connection.query(`
            SELECT COUNT(*) AS total 
            FROM nomina_novedades 
            WHERE DATE_FORMAT(fecha_inicio, '%Y-%m') = ? AND estado = 'PENDIENTE'
        `, [periodo]);

        if (Number(pendientes[0].total) > 0) {
            throw new Error('No se puede cerrar el período: existen novedades pendientes.');
        }

        await connection.query(`
            UPDATE nomina_novedades 
            SET estado = 'PROCESADA' 
            WHERE DATE_FORMAT(fecha_inicio, '%Y-%m') = ? AND estado = 'APROBADA'
        `, [periodo]);

        await connection.query(`
            INSERT INTO nomina_cierres_nomina (periodo, usuario_id, fecha_cierre) 
            VALUES (?, ?, NOW()) 
            ON DUPLICATE KEY UPDATE usuario_id = VALUES(usuario_id), fecha_cierre = VALUES(fecha_cierre)
        `, [periodo, usuarioId]);

        await connection.commit();
        return responderOk(res, { message: 'Período cerrado correctamente.', periodo });

    } catch (error) {
        if (connection) try { await connection.rollback(); } catch (_) {}
        return responderError(res, error.message || 'No fue posible cerrar el período.', 400);
    } finally {
        if (connection) connection.release();
    }
});

/* ============================================================
   EXPORTAR NOVEDADES A CSV
   ============================================================ */

router.get('/api/nomina/novedades/exportar', proteger, async (req, res) => {
    try {
        const db = req.app.get('db');
        const rol = req.session.rol;
        const empleadoID = req.session.empleadoID;
        const filtros = [];
        const params = [];

        if (!tieneAccesoTotal(rol)) { filtros.push('n.empleado_id = ?'); params.push(empleadoID); }
        if (req.query.estado) { filtros.push('n.estado = ?'); params.push(req.query.estado); }
        if (req.query.tipo) { filtros.push('n.tipo_novedad_id = ?'); params.push(req.query.tipo); }
        if (req.query.mes) { filtros.push("DATE_FORMAT(n.fecha_inicio, '%Y-%m') = ?"); params.push(req.query.mes); }

        const where = filtros.length ? 'WHERE ' + filtros.join(' AND ') : '';

        const [rows] = await db.query(`
            SELECT n.id, e.nombre AS empleado, e.numero_documento, t.nombre AS tipo_novedad, t.categoria,
                   n.fecha_inicio, n.fecha_fin, n.cantidad_dias, n.cantidad_horas, n.estado,
                   n.observacion_rechazo, n.fecha_creacion, n.fecha_revision
            FROM nomina_novedades n
            INNER JOIN empleados e ON e.id = n.empleado_id
            INNER JOIN nomina_novedades_tipos t ON t.id = n.tipo_novedad_id
            ${where} ORDER BY n.fecha_creacion DESC
        `, params);

        const columnas = [
            { titulo: 'ID', campo: 'id' }, { titulo: 'Empleado', campo: 'empleado' },
            { titulo: 'Documento', campo: 'numero_documento' }, { titulo: 'Tipo', campo: 'tipo_novedad' },
            { titulo: 'Categoría', campo: 'categoria' }, { titulo: 'Fecha inicio', campo: 'fecha_inicio' },
            { titulo: 'Fecha fin', campo: 'fecha_fin' }, { titulo: 'Días', campo: 'cantidad_dias' },
            { titulo: 'Horas', campo: 'cantidad_horas' }, { titulo: 'Estado', campo: 'estado' },
            { titulo: 'Observación', campo: 'observacion_rechazo' }, { titulo: 'Creación', campo: 'fecha_creacion' }
        ];

        const csv = generarCSV(rows, columnas);
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="novedades_${new Date().toISOString().slice(0, 10)}.csv"`);
        return res.send(csv);

    } catch (error) {
        console.error('ERROR EXPORTANDO:', error);
        return responderError(res, 'No fue posible exportar las novedades.', 500);
    }
});

/* ============================================================
   EXPORTAR HISTORIAL A CSV
   ============================================================ */

router.get('/api/nomina/novedades/historial/exportar', proteger, async (req, res) => {
    try {
        const db = req.app.get('db');
        const rol = req.session.rol;
        const empleadoID = req.session.empleadoID;
        
        const filtros = [
            `n.estado IN ('APROBADA', 'RECHAZADA')`, 
            `n.fecha_revision IS NOT NULL`, 
            `n.fecha_revision < DATE_SUB(NOW(), INTERVAL 14 DAY)`
        ];
        const params = [];

        if (!tieneAccesoTotal(rol)) { filtros.push('n.empleado_id = ?'); params.push(empleadoID); }
        if (req.query.estado) { filtros.push('n.estado = ?'); params.push(req.query.estado); }
        if (req.query.tipo) { filtros.push('n.tipo_novedad_id = ?'); params.push(req.query.tipo); }

        const where = 'WHERE ' + filtros.join(' AND ');

        const [rows] = await db.query(`
            SELECT n.id, e.nombre AS empleado, e.numero_documento, t.nombre AS tipo_novedad,
                   n.fecha_inicio, n.fecha_fin, n.cantidad_dias, n.cantidad_horas, n.estado,
                   n.observacion_rechazo, n.fecha_revision
            FROM nomina_novedades n
            INNER JOIN empleados e ON e.id = n.empleado_id
            INNER JOIN nomina_novedades_tipos t ON t.id = n.tipo_novedad_id
            ${where} ORDER BY n.fecha_revision DESC
        `, params);

        const columnas = [
            { titulo: 'ID', campo: 'id' }, { titulo: 'Empleado', campo: 'empleado' },
            { titulo: 'Documento', campo: 'numero_documento' }, { titulo: 'Tipo', campo: 'tipo_novedad' },
            { titulo: 'Fecha inicio', campo: 'fecha_inicio' }, { titulo: 'Fecha fin', campo: 'fecha_fin' },
            { titulo: 'Días', campo: 'cantidad_dias' }, { titulo: 'Horas', campo: 'cantidad_horas' },
            { titulo: 'Estado', campo: 'estado' }, { titulo: 'Observación', campo: 'observacion_rechazo' },
            { titulo: 'Fecha revisión', campo: 'fecha_revision' }
        ];

        const csv = generarCSV(rows, columnas);
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="historial_novedades_${new Date().toISOString().slice(0, 10)}.csv"`);
        return res.send(csv);

    } catch (error) {
        console.error('ERROR EXPORTANDO HISTORIAL:', error);
        return responderError(res, 'No fue posible exportar el historial.', 500);
    }
});

/* ============================================================
   CREAR NOVEDAD - INCAPACIDAD
   ============================================================ */

router.post('/api/nomina/novedades/incapacidad', proteger, uploadSoporte.single('soporte'), async (req, res) => {
    const db = req.app.get('db');
    let connection = null;

    try {
        const usuarioId = req.session.usuarioID;
        const empleadoId = req.session.empleadoID;

        if (!usuarioId || !empleadoId) {
            if (req.file) fs.unlinkSync(req.file.path);
            return responderError(res, 'La sesión del usuario no es válida.', 401);
        }

        const { tipo_novedad_id, tipo_incapacidad, fecha_inicio, fecha_fin, cantidad_dias, observacion } = req.body;

        if (!tipo_novedad_id) return responderError(res, 'No se recibió el tipo de novedad.', 400);
        if (!tipo_incapacidad) return responderError(res, 'Debes seleccionar el tipo de incapacidad.', 400);
        if (!fecha_inicio) return responderError(res, 'Debes indicar la fecha de inicio.', 400);
        if (!fecha_fin) return responderError(res, 'Debes indicar la fecha de finalización.', 400);
        if (!cantidad_dias || Number(cantidad_dias) <= 0) return responderError(res, 'La cantidad de días no es válida.', 400);
        if (!req.file) return responderError(res, 'Debes adjuntar el soporte médico.', 400);

        connection = await db.getConnection();
        await connection.beginTransaction();

        const [resultadoNovedad] = await connection.query(`
            INSERT INTO nomina_novedades (empleado_id, tipo_novedad_id, fecha_inicio, fecha_fin, cantidad_dias, motivo, observacion, estado, usuario_creacion, fecha_creacion)
            VALUES (?, ?, ?, ?, ?, ?, ?, 'APROBADA', ?, NOW())
        `, [empleadoId, tipo_novedad_id, fecha_inicio, fecha_fin, cantidad_dias, 'Incapacidad', observacion || null, usuarioId]);

        const novedadId = resultadoNovedad.insertId;

        await connection.query(`
            INSERT INTO nomina_novedades_incapacidades (novedad_id, empleado_id, tipo_incapacidad, fecha_inicio, fecha_fin, cantidad_dias, observacion, usuario_id, fecha_registro)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
        `, [novedadId, empleadoId, tipo_incapacidad, fecha_inicio, fecha_fin, cantidad_dias, observacion || null, usuarioId]);

        const extension = path.extname(req.file.originalname).replace('.', '').toLowerCase();
        const rutaArchivo = `/uploads/nomina/novedades/soportes/${req.file.filename}`;

        await connection.query(`
            INSERT INTO nomina_novedades_soportes (novedad_id, nombre_archivo, nombre_original, extension, tipo_mime, ruta_archivo, usuario_id, fecha_subida)
            VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
        `, [novedadId, req.file.filename, req.file.originalname, extension, req.file.mimetype, rutaArchivo, usuarioId]);

        await registrarHistorial(connection, { novedadId, estadoAnterior: null, estadoNuevo: 'APROBADA', usuarioId, comentario: 'Creación (incapacidad)' });

        await connection.commit();
        return responderOk(res, { message: 'La incapacidad fue registrada correctamente.', novedad_id: novedadId }, 201);

    } catch (error) {
        console.error('ERROR REGISTRANDO INCAPACIDAD:', error);
        if (connection) try { await connection.rollback(); } catch (e) {}
        if (req.file) try { if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path); } catch (e) {}
        return responderError(res, error.message || 'No fue posible registrar la incapacidad.', 500);
    } finally {
        if (connection) connection.release();
    }
});

/* ============================================================
   CREAR NOVEDAD - PERMISO
   ============================================================ */

router.post('/api/nomina/novedades/permiso', proteger, async (req, res) => {
    const db = req.app.get('db');
    let connection = null;

    try {
        const usuarioId = req.session.usuarioID;
        const empleadoId = req.session.empleadoID;

        if (!usuarioId || !empleadoId) return responderError(res, 'La sesión del usuario no es válida.', 401);

        const { tipo_novedad_id, tipo_permiso, fecha_permiso, hora_inicio, hora_fin, cantidad_horas, motivo, observacion } = req.body;

        if (!tipo_novedad_id) return responderError(res, 'No se recibió el tipo de novedad.', 400);
        if (!['REMUNERADO', 'NO_REMUNERADO', 'COMPENSATORIO'].includes(tipo_permiso)) return responderError(res, 'El tipo de permiso no es válido.', 400);
        if (!fecha_permiso) return responderError(res, 'Debes indicar la fecha del permiso.', 400);
        if (!hora_inicio || !hora_fin) return responderError(res, 'Debes indicar la hora de inicio y finalización.', 400);
        if (!cantidad_horas || Number(cantidad_horas) <= 0) return responderError(res, 'La cantidad de horas no es válida.', 400);
        if (!motivo || !motivo.trim()) return responderError(res, 'Debes indicar el motivo del permiso.', 400);

        connection = await db.getConnection();
        await connection.beginTransaction();

        const [resultadoNovedad] = await connection.query(`
            INSERT INTO nomina_novedades (empleado_id, tipo_novedad_id, fecha_inicio, fecha_fin, cantidad_dias, cantidad_horas, motivo, observacion, estado, usuario_creacion, fecha_creacion)
            VALUES (?, ?, ?, ?, 1, ?, ?, ?, 'PENDIENTE', ?, NOW())
        `, [empleadoId, tipo_novedad_id, fecha_permiso, fecha_permiso, cantidad_horas, motivo, observacion || null, usuarioId]);

        const novedadId = resultadoNovedad.insertId;

        await connection.query(`
            INSERT INTO nomina_novedades_permisos (novedad_id, empleado_id, tipo_permiso, fecha_permiso, hora_inicio, hora_fin, cantidad_horas, motivo, observacion, usuario_id, fecha_registro)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
        `, [novedadId, empleadoId, tipo_permiso, fecha_permiso, hora_inicio, hora_fin, cantidad_horas, motivo, observacion || null, usuarioId]);

        await registrarHistorial(connection, { novedadId, estadoAnterior: null, estadoNuevo: 'PENDIENTE', usuarioId, comentario: 'Creación (permiso)' });

        await connection.commit();
        return responderOk(res, { message: 'El permiso fue registrado correctamente.', novedad_id: novedadId }, 201);

    } catch (error) {
        console.error('ERROR REGISTRANDO PERMISO:', error);
        if (connection) try { await connection.rollback(); } catch (e) {}
        return responderError(res, error.message || 'No fue posible registrar el permiso.', 500);
    } finally {
        if (connection) connection.release();
    }
});

/* ============================================================
   CREAR NOVEDAD - AUSENCIA
   ============================================================ */

router.post('/api/nomina/novedades/ausencia', proteger, uploadSoporte.single('soporte'), async (req, res) => {
    const db = req.app.get('db');
    let connection = null;

    try {
        const usuarioId = req.session.usuarioID;
        const empleadoId = req.session.empleadoID;

        if (!usuarioId || !empleadoId) {
            if (req.file) fs.unlinkSync(req.file.path);
            return responderError(res, 'La sesión del usuario no es válida.', 401);
        }

        const { tipo_novedad_id, tipo_ausencia, fecha_inicio, fecha_fin, cantidad_dias, motivo, observacion } = req.body;

        if (!tipo_novedad_id) return responderError(res, 'No se recibió el tipo de novedad.', 400);
        if (!['JUSTIFICADA', 'INJUSTIFICADA'].includes(tipo_ausencia)) return responderError(res, 'El tipo de ausencia no es válido.', 400);
        if (!fecha_inicio || !fecha_fin) return responderError(res, 'Debes indicar el rango de fechas.', 400);
        if (!cantidad_dias || Number(cantidad_dias) <= 0) return responderError(res, 'La cantidad de días no es válida.', 400);
        if (!motivo || !motivo.trim()) return responderError(res, 'Debes indicar el motivo.', 400);

        if (tipo_ausencia === 'JUSTIFICADA' && !req.file) return responderError(res, 'Debes adjuntar el soporte para una ausencia justificada.', 400);
        if (tipo_ausencia === 'INJUSTIFICADA' && req.file) fs.unlinkSync(req.file.path);

        connection = await db.getConnection();
        await connection.beginTransaction();

        const [resultadoNovedad] = await connection.query(`
            INSERT INTO nomina_novedades (empleado_id, tipo_novedad_id, fecha_inicio, fecha_fin, cantidad_dias, motivo, observacion, estado, usuario_creacion, fecha_creacion)
            VALUES (?, ?, ?, ?, ?, ?, ?, 'PENDIENTE', ?, NOW())
        `, [empleadoId, tipo_novedad_id, fecha_inicio, fecha_fin, cantidad_dias, motivo, observacion || null, usuarioId]);

        const novedadId = resultadoNovedad.insertId;

        await connection.query(`
            INSERT INTO nomina_novedades_ausencias (novedad_id, empleado_id, tipo_ausencia, fecha_inicio, fecha_fin, cantidad_dias, motivo, observacion, usuario_id, fecha_registro)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
        `, [novedadId, empleadoId, tipo_ausencia, fecha_inicio, fecha_fin, cantidad_dias, motivo, observacion || null, usuarioId]);

        if (tipo_ausencia === 'JUSTIFICADA' && req.file) {
            const extension = path.extname(req.file.originalname).replace('.', '').toLowerCase();
            const rutaArchivo = `/uploads/nomina/novedades/soportes/${req.file.filename}`;
            await connection.query(`
                INSERT INTO nomina_novedades_soportes (novedad_id, nombre_archivo, nombre_original, extension, tipo_mime, ruta_archivo, usuario_id, fecha_subida)
                VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
            `, [novedadId, req.file.filename, req.file.originalname, extension, req.file.mimetype, rutaArchivo, usuarioId]);
        }

        await registrarHistorial(connection, { novedadId, estadoAnterior: null, estadoNuevo: 'PENDIENTE', usuarioId, comentario: 'Creación (ausencia)' });

        await connection.commit();
        return responderOk(res, { message: 'La ausencia fue registrada correctamente.', novedad_id: novedadId }, 201);

    } catch (error) {
        console.error('ERROR REGISTRANDO AUSENCIA:', error);
        if (connection) try { await connection.rollback(); } catch (e) {}
        if (req.file) try { if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path); } catch (e) {}
        return responderError(res, error.message || 'No fue posible registrar la ausencia.', 500);
    } finally {
        if (connection) connection.release();
    }
});

/* ============================================================
   CREAR NOVEDAD - LICENCIA
   ============================================================ */

router.post('/api/nomina/novedades/licencia', proteger, async (req, res) => {
    const db = req.app.get('db');
    let connection = null;

    try {
        const usuarioId = req.session.usuarioID;
        if (!usuarioId) return responderError(res, 'La sesión no es válida.', 401);

        const { tipo_novedad_id, empleado_id, tipo_licencia, fecha_inicio, fecha_fin, cantidad_dias, motivo, observacion } = req.body;

        if (!tipo_novedad_id) return responderError(res, 'No se recibió el tipo de novedad.', 400);
        if (!tipo_licencia) return responderError(res, 'El tipo de licencia es obligatorio.', 400);
        
        // 🔥 SE ELIMINÓ LA RESTRICCIÓN (Antes solo dejaba MATERNIDAD y PATERNIDAD)
        // Ahora acepta LUTO, CITA_MEDICA, VOTO, etc.
        
        if (!fecha_inicio || !fecha_fin) return responderError(res, 'Debes indicar el rango de fechas.', 400);
        if (!cantidad_dias || Number(cantidad_dias) <= 0) return responderError(res, 'La cantidad de días no es válida.', 400);

        // 🔥 Si es Admin/Super Admin puede elegir empleado; si no, usa el de la sesión
        const rolLimpio = String(req.session.rol || '').toLowerCase().trim().replace(/\s+/g, ' ');
        const esAdmin = ROLES_ACCESO_TOTAL.includes(rolLimpio);

        const empleadoFinal = esAdmin
            ? Number(empleado_id || req.session.empleadoID)
            : Number(req.session.empleadoID);

        if (!empleadoFinal) return responderError(res, 'No se pudo determinar el empleado.', 400);

        // Si el frontend envía observación pero no motivo, usamos la observación como motivo principal
        const motivoFinal = motivo || observacion || 'Licencia/Permiso legal';
        const observacionFinal = observacion || null;

        connection = await db.getConnection();
        await connection.beginTransaction();

        const [resultadoNovedad] = await connection.query(`
            INSERT INTO nomina_novedades (empleado_id, tipo_novedad_id, fecha_inicio, fecha_fin, cantidad_dias, motivo, observacion, estado, usuario_creacion, usuario_revision, fecha_creacion, fecha_revision)
            VALUES (?, ?, ?, ?, ?, ?, ?, 'APROBADA', ?, ?, NOW(), NOW())
        `, [empleadoFinal, tipo_novedad_id, fecha_inicio, fecha_fin, cantidad_dias, motivoFinal, observacionFinal, usuarioId, usuarioId]);

        const novedadId = resultadoNovedad.insertId;

        await connection.query(`
            INSERT INTO nomina_novedades_licencias (novedad_id, empleado_id, tipo_licencia, fecha_inicio, fecha_fin, cantidad_dias, motivo, observacion, usuario_id, fecha_registro)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
        `, [novedadId, empleadoFinal, tipo_licencia, fecha_inicio, fecha_fin, cantidad_dias, motivoFinal, observacionFinal, usuarioId]);

        await registrarHistorial(connection, { novedadId, estadoAnterior: null, estadoNuevo: 'APROBADA', usuarioId, comentario: `Creación (${tipo_licencia})` });

        await connection.commit();
        return responderOk(res, { message: 'La licencia fue registrada y aprobada.', novedad_id: novedadId }, 201);

    } catch (error) {
        if (connection) try { await connection.rollback(); } catch (_) {}
        return responderError(res, error.message || 'No fue posible registrar la licencia.', 500);
    } finally {
        if (connection) connection.release();
    }
});

/* ============================================================
   CREAR NOVEDAD - HORAS EXTRA / RECARGOS
   ============================================================ */

router.post('/api/nomina/novedades/horas-extra', proteger, async (req, res) => {
    const db = req.app.get('db');
    let connection = null;

    try {
        const usuarioId = req.session.usuarioID;
        const empleadoId = req.session.empleadoID;

        if (!usuarioId || !empleadoId) return responderError(res, 'La sesión no es válida.', 401);

        const { tipo_novedad_id, tipo_hora, fecha_trabajo, hora_inicio, hora_fin, cantidad_horas, observacion } = req.body;

        if (!tipo_novedad_id) return responderError(res, 'No se recibió el tipo de novedad.', 400);
        if (!tipo_hora) return responderError(res, 'Debes seleccionar el tipo de hora o recargo.', 400);
        if (!fecha_trabajo) return responderError(res, 'Debes indicar la fecha de trabajo.', 400);
        if (!hora_inicio || !hora_fin) return responderError(res, 'Debes indicar la hora de inicio y fin.', 400);
        if (!cantidad_horas || Number(cantidad_horas) <= 0) return responderError(res, 'La cantidad de horas no es válida.', 400);

        connection = await db.getConnection();
        await connection.beginTransaction();

        const [inicioHora, inicioMinuto] = hora_inicio.split(':').map(Number);
        const [finHora, finMinuto] = hora_fin.split(':').map(Number);
        const minutosInicio = (inicioHora * 60) + inicioMinuto;
        const minutosFin = (finHora * 60) + finMinuto;

        if (minutosFin <= minutosInicio) throw new Error('La hora de finalización debe ser posterior a la de inicio.');

        const horasCalculadas = (minutosFin - minutosInicio) / 60;

        if (Math.abs(horasCalculadas - Number(cantidad_horas)) > 0.01) {
            throw new Error('La cantidad de horas enviada no coincide con las horas de inicio y fin.');
        }

        const [resultadoNovedad] = await connection.query(`
            INSERT INTO nomina_novedades (empleado_id, tipo_novedad_id, fecha_inicio, fecha_fin, hora_inicio, hora_fin, cantidad_dias, cantidad_horas, motivo, observacion, estado, usuario_creacion, fecha_creacion)
            VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?, ?, 'PENDIENTE', ?, NOW())
        `, [empleadoId, tipo_novedad_id, fecha_trabajo, fecha_trabajo, hora_inicio, hora_fin, horasCalculadas, tipo_hora, observacion || null, usuarioId]);

        const novedadId = resultadoNovedad.insertId;

        await connection.query(`
            INSERT INTO nomina_novedades_horas_extra (novedad_id, empleado_id, tipo_hora, fecha_trabajo, hora_inicio, hora_fin, cantidad_horas, observacion, usuario_id, fecha_registro)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
        `, [novedadId, empleadoId, tipo_hora, fecha_trabajo, hora_inicio, hora_fin, horasCalculadas, observacion || null, usuarioId]);

        await registrarHistorial(connection, { novedadId, estadoAnterior: null, estadoNuevo: 'PENDIENTE', usuarioId, comentario: 'Creación (horas extra)' });

        await connection.commit();
        return responderOk(res, { message: 'Horas extra registradas correctamente.', novedad_id: novedadId, cantidad_horas: horasCalculadas }, 201);

    } catch (error) {
        if (connection) try { await connection.rollback(); } catch (_) {}
        return responderError(res, error.message || 'No fue posible registrar las horas extra.', 400);
    } finally {
        if (connection) connection.release();
    }
});

/* ============================================================
   CREAR NOVEDAD - DESCUENTO
   ============================================================ */

router.post('/api/nomina/novedades/descuento', proteger, uploadSoporte.single('soporte'), async (req, res) => {
    const db = req.app.get('db');
    let connection = null;

    try {
        const usuarioId = req.session.usuarioID;
        const empleadoId = req.session.empleadoID;

        if (!usuarioId || !empleadoId) {
            if (req.file) fs.unlinkSync(req.file.path);
            return responderError(res, 'La sesión no es válida.', 401);
        }

        const { tipo_novedad_id, concepto, valor, observacion } = req.body;

        if (!tipo_novedad_id || !concepto || !valor) {
            throw new Error('Faltan datos obligatorios del descuento.');
        }

        connection = await db.getConnection();
        await connection.beginTransaction();

        const [resultadoNovedad] = await connection.query(`
            INSERT INTO nomina_novedades (empleado_id, tipo_novedad_id, fecha_inicio, fecha_fin, motivo, observacion, estado, usuario_creacion, fecha_creacion)
            VALUES (?, ?, CURDATE(), CURDATE(), ?, ?, 'PENDIENTE', ?, NOW())
        `, [empleadoId, tipo_novedad_id, concepto, observacion || null, usuarioId]);

        const novedadId = resultadoNovedad.insertId;
        
        if (req.file) {
            const extension = path.extname(req.file.originalname).replace('.', '').toLowerCase();
            const rutaArchivo = `/uploads/nomina/novedades/soportes/${req.file.filename}`;
            await connection.query(`
                INSERT INTO nomina_novedades_soportes (novedad_id, nombre_archivo, nombre_original, extension, tipo_mime, ruta_archivo, usuario_id, fecha_subida)
                VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
            `, [novedadId, req.file.filename, req.file.originalname, extension, req.file.mimetype, rutaArchivo, usuarioId]);
        }

        await registrarHistorial(connection, { novedadId, estadoAnterior: null, estadoNuevo: 'PENDIENTE', usuarioId, comentario: 'Creación (descuento)' });

        await connection.commit();
        return responderOk(res, { message: 'Descuento registrado correctamente.', novedad_id: novedadId }, 201);

    } catch (error) {
        if (connection) try { await connection.rollback(); } catch (_) {}
        if (req.file) try { if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path); } catch (e) {}
        return responderError(res, error.message || 'No fue posible registrar el descuento.', 500);
    } finally {
        if (connection) connection.release();
    }
});

/* ============================================================
   CREAR NOVEDAD - INGRESO
   ============================================================ */

router.post('/api/nomina/novedades/ingreso', proteger, async (req, res) => {
    const db = req.app.get('db');
    let connection = null;

    try {
        const usuarioId = req.session.usuarioID;
        const empleadoId = req.session.empleadoID;

        if (!usuarioId || !empleadoId) return responderError(res, 'La sesión no es válida.', 401);

        const { tipo_novedad_id, concepto, valor, observacion } = req.body;

        if (!tipo_novedad_id || !concepto || !valor) {
            throw new Error('Faltan datos obligatorios del ingreso.');
        }

        connection = await db.getConnection();
        await connection.beginTransaction();

        const [resultadoNovedad] = await connection.query(`
            INSERT INTO nomina_novedades (empleado_id, tipo_novedad_id, fecha_inicio, fecha_fin, motivo, observacion, estado, usuario_creacion, fecha_creacion)
            VALUES (?, ?, CURDATE(), CURDATE(), ?, ?, 'PENDIENTE', ?, NOW())
        `, [empleadoId, tipo_novedad_id, concepto, observacion || null, usuarioId]);

        const novedadId = resultadoNovedad.insertId;

        await registrarHistorial(connection, { novedadId, estadoAnterior: null, estadoNuevo: 'PENDIENTE', usuarioId, comentario: 'Creación (ingreso)' });

        await connection.commit();
        return responderOk(res, { message: 'Ingreso registrado correctamente.', novedad_id: novedadId }, 201);

    } catch (error) {
        if (connection) try { await connection.rollback(); } catch (_) {}
        return responderError(res, error.message || 'No fue posible registrar el ingreso.', 500);
    } finally {
        if (connection) connection.release();
    }
});

/* ============================================================
   CREAR NOVEDAD - PRÉSTAMO
   ============================================================ */

router.post('/api/nomina/novedades/prestamo', proteger, async (req, res) => {
    const db = req.app.get('db');
    let connection = null;

    try {
        const usuarioId = req.session.usuarioID;
        const empleadoId = req.session.empleadoID;

        if (!usuarioId || !empleadoId) return responderError(res, 'La sesión no es válida.', 401);

        const { tipo_novedad_id, monto, cuotas, observacion } = req.body;

        if (!tipo_novedad_id || !monto || !cuotas) {
            throw new Error('Faltan datos obligatorios del préstamo.');
        }

        connection = await db.getConnection();
        await connection.beginTransaction();

        const [resultadoNovedad] = await connection.query(`
            INSERT INTO nomina_novedades (empleado_id, tipo_novedad_id, fecha_inicio, fecha_fin, motivo, observacion, estado, usuario_creacion, fecha_creacion)
            VALUES (?, ?, CURDATE(), CURDATE(), 'Solicitud de préstamo', ?, 'PENDIENTE', ?, NOW())
        `, [empleadoId, tipo_novedad_id, observacion || null, usuarioId]);

        const novedadId = resultadoNovedad.insertId;

        await registrarHistorial(connection, { novedadId, estadoAnterior: null, estadoNuevo: 'PENDIENTE', usuarioId, comentario: 'Creación (préstamo)' });

        await connection.commit();
        return responderOk(res, { message: 'Préstamo registrado correctamente.', novedad_id: novedadId }, 201);

    } catch (error) {
        if (connection) try { await connection.rollback(); } catch (_) {}
        return responderError(res, error.message || 'No fue posible registrar el préstamo.', 500);
    } finally {
        if (connection) connection.release();
    }
});

/* ============================================================
   CONFIGURACIÓN: TIPOS DE HORAS EXTRA
   ============================================================ */

router.get('/api/nomina/configuracion/horas-extra', proteger, async (req, res) => {
    try {
        const db = req.app.get('db');
        const [rows] = await db.query(`
            SELECT id, codigo, nombre, descripcion, porcentaje_recargo, factor_pago, formula, 
                   limite_diario, limite_semanal, fecha_inicio, fecha_fin, activo
            FROM nomina_tipos_horas_extra WHERE activo = 1 ORDER BY id ASC
        `);
        res.json({ ok: true, data: rows });
    } catch (error) {
        return responderError(res, 'No fue posible cargar las horas extra.', 500);
    }
});

/* ============================================================
   CONFIGURACIÓN: TIPOS DE RECARGOS
   ============================================================ */

router.get('/api/nomina/configuracion/recargos', proteger, async (req, res) => {
    try {
        const db = req.app.get('db');
        const [rows] = await db.query(`
            SELECT id, codigo, nombre, descripcion, porcentaje_recargo, factor_pago, formula, 
                   fecha_inicio, fecha_fin, activo
            FROM nomina_tipos_recargos WHERE activo = 1 ORDER BY id ASC
        `);
        res.json({ ok: true, data: rows });
    } catch (error) {
        return responderError(res, 'No fue posible cargar los recargos.', 500);
    }
});

/* ============================================================
   ELIMINAR NOVEDAD (Físicamente de la base de datos)
   ============================================================ */

router.delete('/api/nomina/novedades/:id', proteger, async (req, res) => {
    const db = req.app.get('db');
    try {
        const novedadId = Number(req.params.id);
        
        await db.query('DELETE FROM nomina_novedades WHERE id = ?', [novedadId]);
        
        return responderOk(res, { message: 'Novedad eliminada permanentemente.' });
    } catch (error) {
        console.error('ERROR ELIMINANDO NOVEDAD:', error);
        return responderError(res, 'No fue posible eliminar la novedad.', 500);
    }
});

/* ============================================================
   EXPORT
   ============================================================ */

module.exports = router;