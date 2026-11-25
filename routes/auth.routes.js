
'use strict';
const express = require('express');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const { proteger } = require('../middlewares/auth');
require('dotenv').config();
const router = express.Router();
const SALT_ROUNDS = 10;
const MAX_INTENTOS = 3; // Se conserva el límite del ERP original.
const COOKIE_SESION = process.env.SESSION_COOKIE_NAME || 'connect.sid';
const RESPUESTA_RECUPERACION = 'Si la cuenta existe se enviará un correo.';
const transporter = nodemailer.createTransport({
    host: 'smtp.hostinger.com', port: 465, secure: true,
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
    tls: { rejectUnauthorized: true }
});
if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    transporter.verify().then(() => console.log('SMTP Hostinger conectado (auth.routes)'))
        .catch(error => console.error('SMTP auth.routes:', error.message));
}
function obtenerDB(req) {
    const db = req.app.get('db');
    if (!db || typeof db.query !== 'function') throw new Error('La conexión MySQL no está configurada en app.set("db", db).');
    return db;
}
function guardarSesion(req) {
    return new Promise((resolve, reject) => req.session.save(error => error ? reject(error) : resolve()));
}
function regenerarSesion(req) {
    return new Promise((resolve, reject) => req.session.regenerate(error => error ? reject(error) : resolve()));
}
function destruirSesion(req) {
    return new Promise((resolve, reject) => req.session.destroy(error => error ? reject(error) : resolve()));
}
function limpiarCookie(res) {
    res.clearCookie(COOKIE_SESION, { path: '/' });
}
function passwordValida(password) {
    return typeof password === 'string' && password.length >= 8 && Buffer.byteLength(password, 'utf8') <= 72;
}
function escaparHTML(valor) {
    return String(valor ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;')
        .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
async function tieneDocumentosPendientes(db, empleadoID) {
    const [documentos] = await db.query(`
        SELECT COUNT(*) AS pendientes
        FROM documentos_lectura d
        INNER JOIN versiones_documentos v ON d.version_actual_id = v.id
        LEFT JOIN aceptaciones_documentos a ON a.version_id = v.id AND a.empleado_id = ?
        WHERE d.estado = 'ACTIVO' AND v.estado = 'VIGENTE' AND a.id IS NULL
    `, [empleadoID]);
    return Number(documentos[0]?.pendientes || 0) > 0;
}
// === INICIO DE SESIÓN ===
router.post('/api/login', async (req, res) => {
    try {
        const db = obtenerDB(req);
        const { usuario, password } = req.body || {};
        if (typeof usuario !== 'string' || !usuario.trim() || typeof password !== 'string' || !password) {
            return res.status(400).json({ success: false, message: 'Ingrese usuario y contraseña.' });
        }
        const [results] = await db.query(`
            SELECT u.*, r.nombre AS rol, e.nombre AS nombre, e.activo,
                e.id AS empleado_id, u.bloqueado, u.intentos_fallidos, u.fecha_ultimo_login
            FROM usuarios u
            JOIN rol r ON u.rol_id = r.id
            JOIN empleados e ON u.empleado_id = e.id
            WHERE u.Usuario = ?
        `, [usuario.trim()]);
        if (!results.length) return res.json({ success: false, message: 'Usuario o contraseña incorrectos.' });
        const user = results[0];
        if (user.activo === 'NO') {
            return res.json({ success: false, inactivo: true, message: 'Empleado inactivo. Comuníquese con el administrador.' });
        }
        if (Number(user.bloqueado) === 1) {
            return res.json({ success: false, bloqueado: true, message: 'Usuario bloqueado por el administrador.' });
        }
        if (Number(user.intentos_fallidos) >= MAX_INTENTOS) {
            await db.query('UPDATE usuarios SET bloqueado = 1 WHERE ID = ?', [user.ID]);
            return res.json({ success: false, bloqueado: true, message: 'Usuario bloqueado por múltiples intentos fallidos.' });
        }
        const coincide = typeof user.password_hash === 'string' && await bcrypt.compare(password, user.password_hash);
        if (!coincide) {
            // Actualización atómica para evitar perder incrementos concurrentes.
            await db.query(`UPDATE usuarios SET intentos_fallidos = intentos_fallidos + 1,
                bloqueado = CASE WHEN intentos_fallidos + 1 >= ? THEN 1 ELSE bloqueado END
                WHERE ID = ?`, [MAX_INTENTOS, user.ID]);
            const [intentosRows] = await db.query('SELECT intentos_fallidos, bloqueado FROM usuarios WHERE ID = ?', [user.ID]);
            const intentos = Number(intentosRows[0]?.intentos_fallidos || MAX_INTENTOS);
            if (Number(intentosRows[0]?.bloqueado) === 1 || intentos >= MAX_INTENTOS) {
                return res.json({ success: false, bloqueado: true, message: 'Usuario bloqueado por múltiples intentos fallidos.' });
            }
            return res.json({ success: false, message: `Contraseña incorrecta. Intento ${intentos} de ${MAX_INTENTOS}` });
        }
        // Regenerar antes de crear la sesión evita reutilizar un identificador previo.
        await regenerarSesion(req);
        req.session.usuarioID = user.ID;
        req.session.empleadoID = user.empleado_id;
        req.session.rolID = user.rol_id;
        req.session.rol = user.rol;
        await db.query('UPDATE usuarios SET intentos_fallidos = 0, fecha_ultimo_login = NOW() WHERE ID = ?', [user.ID]);
        if (Number(user.cambio_password) === 1) {
            await guardarSesion(req);
            return res.json({ success: true, redirect: '/cambiar-password' });
        }
        const [evaluaciones] = await db.query(`
            SELECT
                (SELECT COUNT(*) FROM evaluaciones_induccion WHERE estado = 'ACTIVA') AS total,
                (SELECT COUNT(DISTINCT evaluacion_id) FROM resultados_evaluaciones
                    WHERE usuario_id = ? AND aprobado = 1) AS aprobados,
                (SELECT COUNT(*) FROM certificados_usuario WHERE usuario_id = ?) AS tiene_certificado
        `, [user.ID, user.ID]);
        const progreso = evaluaciones[0] || {};
        let destino = '/dashboard';
        if (Number(progreso.tiene_certificado || 0) > 0) destino = '/dashboard';
        else if (Number(progreso.aprobados || 0) < Number(progreso.total || 0)) destino = '/induccion';
        else destino = '/firma';
        await guardarSesion(req);
        return res.json({
            success: true, redirect: destino,
            usuario: {
                id: user.ID, empleado_id: user.empleado_id, rol_id: user.rol_id,
                nombre: user.nombre, rol: user.rol, activo: user.activo,
                fecha_ultimo_login: user.fecha_ultimo_login
            }
        });
    } catch (error) {
        console.error('Error en /api/login:', error);
        return res.status(500).json({ success: false, message: 'Error interno del servidor.' });
    }
});
// === DATOS DEL USUARIO AUTENTICADO ===
router.get('/api/me', proteger, async (req, res) => {
    try {
        const db = obtenerDB(req);
        const usuarioID = req.session.usuarioID;
        const [results] = await db.query(`
            SELECT e.codigo, e.nombre, e.tipo_documento, e.numero_documento,
                e.rh, e.fecha_nacimiento, e.lugar_nacimiento, e.estado_civil,
                e.direccion, e.barrio_localidad, e.telefono, e.email, e.activo,
                c.nombre AS cargo, a.nombre AS area, s.nombre AS sede,
                u.cambio_password, e.foto, r.nombre AS rol,
                (SELECT COUNT(DISTINCT capitulo_id) FROM preguntas_induccion) AS total,
                (SELECT COUNT(DISTINCT capitulo_id) FROM resultados_evaluaciones
                    WHERE usuario_id = ? AND aprobado = 1) AS aprobados,
                (SELECT COUNT(*) FROM certificados_usuario WHERE usuario_id = ?) AS tiene_certificado,
                (SELECT COUNT(*) FROM empleados WHERE activo = 'SI') AS total_empleados_activos,
                (SELECT COUNT(*) FROM usuarios WHERE bloqueado = 0) AS total_usuarios_sistema,
                (SELECT COUNT(*) FROM capacitaciones WHERE estado = 'ACTIVO') AS total_capacitaciones,
                (SELECT COUNT(*) FROM certificados_usuario) AS total_certificados_emitidos
            FROM usuarios u
            JOIN empleados e ON u.empleado_id = e.id
            LEFT JOIN cargos c ON e.cargo_id = c.id
            LEFT JOIN areas a ON e.area_id = a.id
            LEFT JOIN sedes s ON e.sede_id = s.id
            JOIN rol r ON u.rol_id = r.id
            WHERE u.id = ?
        `, [usuarioID, usuarioID, usuarioID]);
        if (!results.length) return res.json({ success: false });
        const u = results[0];
        if (u.activo === 'NO') {
            await destruirSesion(req);
            limpiarCookie(res);
            return res.json({ success: false });
        }
        const total = Number(u.total || 0);
        const aprobados = Number(u.aprobados || 0);
        const tieneCertificado = Number(u.tiene_certificado || 0) > 0;
        const completo = aprobados >= total && total > 0;
        let redirect = '/dashboard';
        if (Number(u.cambio_password) === 1) redirect = '/cambiar-password';
        else if (!completo) redirect = '/induccion';
        else if (!tieneCertificado) redirect = '/firma';
        if (redirect === '/dashboard' && await tieneDocumentosPendientes(db, req.session.empleadoID)) {
            redirect = '/documentos-lectura';
        }
        return res.json({
            success: true, usuario: u, completo, tiene_certificado: tieneCertificado, redirect,
            conteos: {
                empleados: u.total_empleados_activos || 0,
                usuarios: u.total_usuarios_sistema || 0,
                capacitaciones: u.total_capacitaciones || 0,
                certificates: u.total_certificados_emitidos || 0
            }
        });
    } catch (error) {
        console.error('Error en /api/me:', error);
        return res.status(500).json({ success: false });
    }
});
// === RECUPERACIÓN DE CONTRASEÑA ===
router.post('/api/recuperar', async (req, res) => {
    try {
        const db = obtenerDB(req);
        const { documento } = req.body || {};
        if (!documento || typeof documento !== 'string') {
            return res.status(400).json({ success: false, message: 'Debe ingresar el número de documento.' });
        }
        const [results] = await db.query(`
            SELECT u.id, e.nombre, e.email FROM usuarios u
            JOIN empleados e ON u.empleado_id = e.id
            WHERE e.numero_documento = ?
        `, [documento.trim()]);
        const usuario = results[0];
        if (!usuario?.email) return res.json({ success: true, message: RESPUESTA_RECUPERACION });
        const token = crypto.randomBytes(32).toString('hex');
        await db.query(`UPDATE usuarios SET token_reset = ?,
            token_expira = DATE_ADD(NOW(), INTERVAL 10 MINUTE) WHERE id = ?`, [token, usuario.id]);
        const baseUrl = (process.env.BASE_URL || 'https://procesadosmargaritasas.com').replace(/\/$/, '');
        const resetLink = `${baseUrl}/reset/${token}`;
        try {
            await transporter.sendMail({
                from: `"Procesados Margarita SAS" <${process.env.EMAIL_USER}>`,
                to: usuario.email,
                subject: 'Recuperación de contraseña ERP',
                html: `<div style="font-family:Arial;padding:20px">
                    <h2>Recuperación de acceso</h2>
                    <p>Hola ${escaparHTML(usuario.nombre)}.</p>
                    <p>Haz clic aquí para restablecer tu clave de acceso:</p>
                    <p><a href="${escaparHTML(resetLink)}" style="display:inline-block;padding:12px 25px;background:#2563eb;color:white;text-decoration:none;border-radius:10px;font-weight:bold">Restablecer contraseña</a></p>
                    <p style="color:#888;font-size:12px">Este enlace expira en 10 minutos.</p>
                </div>`
            });
        } catch (error) {
            console.error('Error al enviar recuperación:', error);
            await db.query('UPDATE usuarios SET token_reset = NULL, token_expira = NULL WHERE id = ? AND token_reset = ?', [usuario.id, token]);
        }
        return res.json({ success: true, message: RESPUESTA_RECUPERACION });
    } catch (error) {
        console.error('Error en /api/recuperar:', error);
        return res.status(500).json({ success: false, message: 'Error interno del servidor.' });
    }
});
// === CAMBIO DE CONTRASEÑA CON SESIÓN ACTIVA ===
router.post('/api/cambiar-password', proteger, async (req, res) => {
    try {
        const db = obtenerDB(req);
        const { nuevaPassword } = req.body || {};
        if (!passwordValida(nuevaPassword)) {
            return res.status(400).json({ success: false, message: 'La contraseña debe tener al menos 8 caracteres y no superar 72 bytes.' });
        }
        const hash = await bcrypt.hash(nuevaPassword, SALT_ROUNDS);
        await db.query(`UPDATE usuarios SET password_hash = ?, cambio_password = 0,
            primera_vez = 0, fecha_cambio_password = NOW() WHERE id = ?`, [hash, req.session.usuarioID]);
        await destruirSesion(req);
        limpiarCookie(res);
        return res.json({ success: true, redirect: '/login' });
    } catch (error) {
        console.error('Error en /api/cambiar-password:', error);
        return res.status(500).json({ success: false, message: 'Error interno del servidor.' });
    }
});
// === CIERRE DE SESIÓN ===
async function limpiarSesionCompleta(req, res) {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    try {
        if (req.session) await destruirSesion(req);
        limpiarCookie(res);
        if (req.xhr || req.headers.accept?.includes('json') || req.originalUrl.includes('/api/')) {
            return res.json({ success: true, redirect: '/login' });
        }
        return res.redirect('/login');
    } catch (error) {
        console.error('Error cerrando sesión:', error);
        return res.status(500).json({ success: false, message: 'No se pudo cerrar la sesión.' });
    }
}
router.all('/api/logout', limpiarSesionCompleta);
router.all('/logout', limpiarSesionCompleta);
// === RESTABLECER CONTRASEÑA CON TOKEN ===
router.post('/api/reset-password', async (req, res) => {
    try {
        const db = obtenerDB(req);
        const { token, password } = req.body || {};
        if (typeof token !== 'string' || !/^[a-f0-9]{64}$/i.test(token) || !passwordValida(password)) {
            return res.status(400).json({ success: false, message: 'Token inválido o contraseña no válida (mínimo 8 caracteres, máximo 72 bytes).' });
        }
        const [results] = await db.query(`SELECT id FROM usuarios
            WHERE token_reset = ? AND token_expira > NOW()`, [token]);
        if (!results.length) {
            return res.status(400).json({ success: false, message: 'El enlace expiró o no es válido.' });
        }
        const hash = await bcrypt.hash(password, SALT_ROUNDS);
        const [resultado] = await db.query(`UPDATE usuarios SET password_hash = ?, token_reset = NULL,
            token_expira = NULL, cambio_password = 0, primera_vez = 0,
            fecha_cambio_password = NOW() WHERE id = ? AND token_reset = ? AND token_expira > NOW()`,
        [hash, results[0].id, token]);
        if (!resultado.affectedRows) {
            return res.status(400).json({ success: false, message: 'El enlace expiró o no es válido.' });
        }
        return res.json({ success: true, message: 'Contraseña actualizada.' });
    } catch (error) {
        console.error('Error en /api/reset-password:', error);
        return res.status(500).json({ success: false, message: 'Error interno del servidor.' });
    }
});
module.exports = router;
