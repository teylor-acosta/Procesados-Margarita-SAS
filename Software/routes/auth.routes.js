const express = require('express');
const router = express.Router();

const bcrypt = require('bcrypt');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

require('dotenv').config();

const { proteger } = require('../middlewares/auth');

const SALT_ROUNDS = 10;

// ============================================
// 🔥 CONFIG EMAIL
// ============================================

const transporter = nodemailer.createTransport({
    host: "smtp.hostinger.com",
    port: 465,
    secure: true,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// ============================================
// 🔥 LOGIN
// ============================================

router.post('/api/login', async (req, res) => {
    try {
        const db = req.app.get('db');
        const { usuario, password } = req.body;

        const sql = `
    SELECT 
        u.*,
        r.nombre as rol,
        e.nombre as nombre,
        e.activo,
        e.id as empleado_id,
        u.bloqueado,
        u.intentos_fallidos,
        u.fecha_ultimo_login
    FROM usuarios u
    JOIN rol r ON u.rol_id = r.id
    JOIN empleados e ON u.empleado_id = e.id
    WHERE u.Usuario = ?
`;
        const [results] = await db.query(sql, [usuario]);

        if (results.length === 0) {
            return res.json({
                success: false,
                message: "Usuario no encontrado"
            });
        }

        const user = results[0];

        // =========================================
        // 🚫 EMPLEADO INACTIVO
        // =========================================

        if (user.activo === 'NO') {
            return res.json({
                success: false,
                inactivo: true,
                message: 'Empleado inactivo. Comuníquese con el administrador.'
            });
        }

        // =========================================
        // 🚫 USUARIO BLOQUEADO
        // =========================================

        if (parseInt(user.bloqueado) === 1) {
            return res.json({
                success: false,
                bloqueado: true,
                message: 'Usuario bloqueado por el administrador.'
            });
        }

        // =========================================
        // 🚫 BLOQUEO POR INTENTOS
        // =========================================

        if (parseInt(user.intentos_fallidos) >= 3) {
            await db.query(
                `UPDATE usuarios SET bloqueado = 1 WHERE ID = ?`,
                [user.ID]
            );

            return res.json({
                success: false,
                bloqueado: true,
                message: 'Usuario bloqueado por múltiples intentos fallidos.'
            });
        }

        // =========================================
        // 🔐 VALIDAR PASSWORD
        // =========================================

        const passwordMatch = await bcrypt.compare(password, user.password_hash);

        // =========================================
        // ❌ PASSWORD INCORRECTO
        // =========================================

        if (!passwordMatch) {
            // Sumar intentos
            await db.query(
                `UPDATE usuarios SET intentos_fallidos = intentos_fallidos + 1 WHERE ID = ?`,
                [user.ID]
            );

            // Consultar nuevos intentos
            const [nuevoIntento] = await db.query(
                `SELECT intentos_fallidos FROM usuarios WHERE ID = ?`,
                [user.ID]
            );

            const intentos = nuevoIntento[0].intentos_fallidos;

            // Bloquear si llega a 3
            if (intentos >= 3) {
                await db.query(
                    `UPDATE usuarios SET bloqueado = 1 WHERE ID = ?`,
                    [user.ID]
                );

                return res.json({
                    success: false,
                    bloqueado: true,
                    message: 'Usuario bloqueado por múltiples intentos fallidos.'
                });
            }

            return res.json({
                success: false,
                message: `Contraseña incorrecta. Intento ${intentos} de 3`
            });
        }

        // =========================================
        // 🔥 RESETEAR INTENTOS Y LOGIN
        // =========================================

        await db.query(
            `UPDATE usuarios SET intentos_fallidos = 0, fecha_ultimo_login = NOW() WHERE ID = ?`,
            [user.ID]
        );

        // =========================================
        // 🔥 CREAR SESIÓN
        // =========================================

        req.session.usuarioID = user.ID;
        req.session.empleadoID = user.empleado_id;
        req.session.rol = user.rol;

        // =========================================
        // 🔥 CAMBIO PASSWORD OBLIGATORIO
        // =========================================

        if (parseInt(user.cambio_password) === 1) {
            return req.session.save(() => {
                res.json({
                    success: true,
                    redirect: "/cambiar-password"
                });
            });
        }

        // =========================================
        // 🔥 VALIDAR INDUCCIÓN
        // =========================================

        const sqlCheck = `
            SELECT 
                (SELECT COUNT(DISTINCT capitulo_id) FROM preguntas_induccion) as total,
                (SELECT COUNT(DISTINCT capitulo_id) FROM resultados_evaluaciones WHERE usuario_id = ? AND aprobado = 1) as aprobados,
                (SELECT COUNT(*) FROM certificados_usuario WHERE usuario_id = ?) as tiene_certificado
        `;

        const [results2] = await db.query(sqlCheck, [req.session.usuarioID, req.session.usuarioID]);

        let destino = "/dashboard";

        if (results2.length > 0) {
            const total = results2[0].total || 0;
            const aprobados = results2[0].aprobados || 0;
            const tieneCertificado = results2[0].tiene_certificado > 0;

            if (tieneCertificado) {
                destino = "/dashboard";
            } else if (aprobados < total) {
                destino = "/induccion";
            } else {
                destino = "/firma";
            }
        }

        req.session.save(() => {
    res.json({
        success: true,
        redirect: destino,
        usuario: {
            id: user.ID,
            empleado_id: user.empleado_id,
            nombre: user.nombre,
            rol: user.rol,
            activo: user.activo,
            fecha_ultimo_login: user.fecha_ultimo_login
        }
    });
});

    } catch (error) {
        console.error('🔥 ERROR LOGIN COMPLETO:', error);
        return res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: error.message
        });
    }
});

// ============================================
// 🔥 /api/me (ACTUALIZADO CON CONTEOS MIGRADOS)
// ============================================

router.get('/api/me', proteger, async (req, res) => {
    try {
        const db = req.app.get('db');
        const usuario_id = req.session.usuarioID;

        const sql = `
            SELECT 
                e.codigo,
                e.nombre,
                e.tipo_documento,
                e.numero_documento,
                e.rh,
                e.fecha_nacimiento,
                e.lugar_nacimiento,
                e.estado_civil,
                e.direccion,
                e.barrio_localidad,
                e.telefono,
                e.email,
                e.activo,
                c.nombre as cargo,
                a.nombre as area,
                s.nombre as sede,
                u.cambio_password,
                e.foto,
                r.nombre as rol,
                
                /* Datos de progreso individuales */
                (SELECT COUNT(DISTINCT capitulo_id) FROM preguntas_induccion) as total,
                (SELECT COUNT(DISTINCT capitulo_id) FROM resultados_evaluaciones WHERE usuario_id = ? AND aprobado = 1) as aprobados,
                (SELECT COUNT(*) FROM certificados_usuario WHERE usuario_id = ?) as tiene_certificado,
                
                /* 📊 Conteos analíticos globales para las tarjetas del Dashboard */
                (SELECT COUNT(*) FROM empleados WHERE activo = 'SI') as total_empleados_activos,
                (SELECT COUNT(*) FROM usuarios) as total_usuarios_sistema,
                (SELECT COUNT(*) FROM capacitaciones WHERE estado_asistencia = 'ASISTIO') as total_capacitaciones_completadas,
                (SELECT COUNT(*) FROM certificados_usuario) as total_certificados_emitidos

            FROM usuarios u
            JOIN empleados e ON u.empleado_id = e.id
            LEFT JOIN cargos c ON e.cargo_id = c.id
            LEFT JOIN areas a ON e.area_id = a.id
            LEFT JOIN sedes s ON e.sede_id = s.id
            JOIN rol r ON u.rol_id = r.id
            WHERE u.id = ?
        `;

        const [results] = await db.query(sql, [usuario_id, usuario_id, usuario_id]);

        if (results.length === 0) {
            return res.json({ success: false });
        }

        const u = results[0];

        if (u.activo === 'NO') {
            req.session.destroy();
            return res.json({ success: false });
        }

        const total = u.total || 0;
        const aprobados = u.aprobados || 0;
        const tieneCertificado = (u.tiene_certificado || 0) > 0;
        const completo = aprobados >= total && total > 0;

        let redirect = "/dashboard";

        if (parseInt(u.cambio_password) === 1) {
            redirect = "/cambiar-password";
        } else if (!completo) {
            redirect = "/induccion";
        } else if (completo && !tieneCertificado) {
            redirect = "/firma";
        } else {
            redirect = "/dashboard";
        }

        res.json({
            success: true,
            usuario: u,
            completo,
            tiene_certificado: tieneCertificado,
            redirect,
            conteos: {
                empleados: u.total_empleados_activos || 0,
                usuarios: u.total_usuarios_sistema || 0,
                capacitaciones: u.total_capacitaciones_completadas || 0,
                certificates: u.total_certificados_emitidos || 0
            }
        });

    } catch (error) {
        console.error("🔥 ERROR EN /api/me:", error);
        res.status(500).json({ success: false });
    }
});

// ============================================
// 🔥 RECUPERAR PASSWORD TOKEN
// ============================================

router.post('/api/recuperar', async (req, res) => {
    try {
        const db = req.app.get('db');
        const { documento } = req.body;

        const sql = `
            SELECT u.id, e.nombre, e.email
            FROM usuarios u
            JOIN empleados e ON u.empleado_id = e.id
            WHERE e.numero_documento = ?
        `;

        const [results] = await db.query(sql, [documento]);

        if (results.length === 0) {
            return res.json({
                success: true,
                message: 'Si la cuenta existe se enviará un correo.'
            });
        }

        const usuario = results[0];
        const token = crypto.randomBytes(32).toString('hex');

        await db.query(
            `UPDATE usuarios SET token_reset = ?, token_expira = DATE_ADD(NOW(), INTERVAL 10 MINUTE) WHERE id = ?`,
            [token, usuario.id]
        );

        const resetLink = `https://procesadosmargaritasas.com/reset/${token}`;

        try {
            await transporter.sendMail({
                from: `"Procesados Margarita SAS" <${process.env.EMAIL_USER}>`,
                to: usuario.email,
                subject: 'Recuperación de contraseña ERP',
                html: `
                    <div style="font-family:Arial; padding:20px;">
                        <h2>Recuperación de acceso</h2>
                        <p>Hola ${usuario.nombre}.</p>
                        <p>Haz clic aquí para reestablecer tu clave de acceso:</p>
                        <br>
                        <a href="${resetLink}" style="display:inline-block; padding:12px 25px; background:#2563eb; color:white; text-decoration:none; border-radius:10px; font-weight:bold;">
                            Restablecer contraseña
                        </a>
                    </div>
                `
            });
        } catch(error) {
            console.log('🔥 ERROR EMAIL:', error);
            return res.status(500).json({
                success: false,
                message: 'Error enviando correo'
            });
        }

        res.json({
            success: true,
            message: 'Si la cuenta existe se enviará un correo.'
        });

    } catch (error) {
        console.error('🔥 ERROR RECUPERAR:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// ============================================
// 🔥 CAMBIAR PASSWORD LOGUEADO
// ============================================

router.post('/api/cambiar-password', proteger, async (req, res) => {
    try {
        const db = req.app.get('db');
        const { nuevaPassword } = req.body;

        if (!nuevaPassword) {
            return res.status(400).json({
                success: false,
                message: 'Password requerida'
            });
        }

        const hash = await bcrypt.hash(nuevaPassword, SALT_ROUNDS);

        await db.query(
            `UPDATE usuarios SET password_hash = ?, cambio_password = 0, primera_vez = 0, fecha_cambio_password = NOW() WHERE id = ?`,
            [hash, req.session.usuarioID]
        );

        res.json({
            success: true,
            redirect: '/induccion'
        });

    } catch (error) {
        console.error('🔥 ERROR CAMBIAR PASSWORD:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// ============================================
// 🔥 LOGOUT UNIFICADO (COMPATIBLE CON FETCH JSON)
// ============================================
const limpiarSesionCompleta = (req, res) => {
    console.log('🔥 Destruyendo sesión en backend...');
    
    // Forzamos cabeceras HTTP anti-caché en la respuesta
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    
    req.session.destroy(err => {
        if (err) {
            console.error("Error destruyendo req.session:", err);
            return res.status(500).json({ success: false, message: 'No se pudo cerrar la sesión' });
        }
        
        console.log('✅ Sesión eliminada de memoria del servidor.');
        
        // Limpiamos la cookie explícitamente asignándole ruta raíz
        res.clearCookie('connect.sid', { path: '/' });
        
        // Si la petición viene de nuestro fetch del Dashboard, respondemos JSON limpio
        if (req.xhr || req.headers.accept?.includes('json') || req.originalUrl.includes('/api/')) {
            return res.json({ success: true, redirect: '/login' });
        }
        
        // Caída por si entran manual por URL
        res.redirect('/login');
    });
};

// Escucha en ambos endpoints indistintamente (POST y GET)
router.all('/api/logout', limpiarSesionCompleta);
router.all('/logout', limpiarSesionCompleta);

// ============================================
// 🔥 RESET PASSWORD TOKEN
// ============================================

router.post('/api/reset-password', async (req, res) => {
    try {
        const db = req.app.get('db');
        const { token, password } = req.body;

        if (!token || !password) {
            return res.status(400).json({
                success: false,
                message: 'Datos incompletos'
            });
        }

        const sql = `
            SELECT * FROM usuarios 
            WHERE token_reset = ? AND token_expira > NOW()
        `;

        const [results] = await db.query(sql, [token]);

        if (results.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'El enlace expiró o no es válido'
            });
        }

        const usuario = results[0];
        const hash = await bcrypt.hash(password, SALT_ROUNDS);

        await db.query(
            `UPDATE usuarios SET password_hash = ?, token_reset = NULL, token_expira = NULL, cambio_password = 0, primera_vez = 0, fecha_cambio_password = NOW() WHERE id = ?`,
            [hash, usuario.id]
        );

        res.json({
            success: true,
            message: 'Contraseña actualizada'
        });

    } catch (error) {
        console.error('🔥 ERROR RESET PASSWORD:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

module.exports = router;