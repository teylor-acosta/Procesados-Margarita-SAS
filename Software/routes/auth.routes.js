const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');

const { proteger } = require('../middlewares/auth');

const SALT_ROUNDS = 10;

// ============================================
// 🔥 LOGIN
// ============================================

router.post('/api/login', async (req, res) => {

    const db = req.app.get('db');
    const { usuario, password } = req.body;

    const sql = `
    SELECT u.*, r.nombre as rol, e.activo, e.id as empleado_id
    FROM usuarios u
    JOIN rol r ON u.rol_id = r.id
    JOIN empleados e ON u.empleado_id = e.id
    WHERE u.Usuario = ?
    `;

    db.query(sql, [usuario], async (err, results) => {

        if (err) {
            console.error("🔥 ERROR SQL LOGIN:", err);
            return res.status(500).json({ success: false });
        }

        if (results.length === 0) {
            return res.json({ success: false, message: "usuario no encontrado" });
        }

        const user = results[0];

        try {

            const passwordMatch = await bcrypt.compare(password, user.password_hash);

            if (!passwordMatch) {
                return res.json({ success: false, message: "contraseña incorrecta" });
            }

            req.session.usuarioID = user.ID || user.id;
            req.session.empleadoID = user.empleado_id;
            req.session.rol = user.rol;

            if (parseInt(user.cambio_password) === 1) {
                return req.session.save(() => {
                    res.json({ success: true, redirect: "/cambiar-password" });
                });
            }

            const sqlCheck = `
                SELECT 
                    (SELECT COUNT(*) FROM capitulos_induccion WHERE activo = 1) as total,
                    (SELECT COUNT(DISTINCT capitulo_id) 
                        FROM resultados_evaluaciones 
                        WHERE usuario_id = ? AND aprobado = 1) as aprobados,
                    (SELECT COUNT(*) 
                        FROM certificados_usuario 
                        WHERE usuario_id = ?) as tiene_certificado
            `;

            db.query(sqlCheck, [req.session.usuarioID, req.session.usuarioID], (err2, results2) => {

                let destino = "/dashboard";

                if (!err2 && results2.length > 0) {

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
                    res.json({ success: true, redirect: destino });
                });

            });

        } catch (e) {
            console.error(e);
            return res.status(500).json({ success: false });
        }

    });

});


// ============================================
// 🔥 /api/me
// ============================================

router.get('/api/me', proteger, (req, res) => {

    const db = req.app.get('db');
    const usuario_id = req.session.usuarioID;

    const sql = `
        SELECT 
            e.nombre,
            e.numero_documento,
            c.nombre as cargo,
            u.cambio_password,
            e.foto,

            (SELECT COUNT(*) FROM capitulos_induccion WHERE activo = 1) as total,
            (SELECT COUNT(DISTINCT capitulo_id) 
                FROM resultados_evaluaciones 
                WHERE usuario_id = ? AND aprobado = 1) as aprobados,
            (SELECT COUNT(*) 
                FROM certificados_usuario 
                WHERE usuario_id = ?) as tiene_certificado

        FROM usuarios u
        JOIN empleados e ON u.empleado_id = e.id
        LEFT JOIN cargos c ON e.cargo_id = c.id
        WHERE u.id = ?
    `;

    db.query(sql, [usuario_id, usuario_id, usuario_id], (err, results) => {

        if (err || results.length === 0) {
            return res.json({ success: false });
        }

        const u = results[0];

        const completo = u.aprobados >= u.total;
        const tieneCertificado = u.tiene_certificado > 0;

        let redirect = "/dashboard";

        if (tieneCertificado) redirect = "/dashboard";
        else if (parseInt(u.cambio_password) === 1) redirect = "/cambiar-password";
        else if (!completo) redirect = "/induccion";
        else redirect = "/firma";

        res.json({
            success: true,
            usuario: u,
            completo,
            tiene_certificado: tieneCertificado,
            redirect
        });

    });

});


// ============================================
// 🔥 RECUPERAR PASSWORD
// ============================================

router.post('/api/recuperar', async (req, res) => {

    const db = req.app.get('db');
    const { documento } = req.body;

    const sql = `
        SELECT u.id 
        FROM usuarios u 
        JOIN empleados e ON u.empleado_id = e.id 
        WHERE e.numero_documento = ?
    `;

    db.query(sql, [documento], async (err, results) => {

        if (err || results.length === 0) {
            return res.json({ success: false, message: "no encontrado" });
        }

        const hashedTempPass = await bcrypt.hash('123456', SALT_ROUNDS);

        db.query(`
            UPDATE usuarios 
            SET password_hash = ?, cambio_password = 1 
            WHERE id = ?
        `, [hashedTempPass, results[0].id], (errU) => {

            if (errU) return res.json({ success: false });

            res.json({ success: true, message: "contraseña temporal: 123456" });

        });

    });

});


// ============================================
// 🔥 CAMBIAR PASSWORD
// ============================================

router.post('/api/cambiar-password', proteger, async (req, res) => {

    const db = req.app.get('db');
    const { password } = req.body;

    const hash = await bcrypt.hash(password, SALT_ROUNDS);

    db.query(`
        UPDATE usuarios 
        SET password_hash = ?, cambio_password = 0 
        WHERE id = ?
    `, [hash, req.session.usuarioID], (err) => {

        if (err) return res.json({ success: false });

        req.session.destroy(() => {
            res.json({ success: true, redirect: "/login" });
        });

    });

});


// ============================================
// 🔥 LOGOUT
// ============================================

router.get('/logout', (req, res) => {

    req.session.destroy(err => {

        if (err) {
            console.error("Error cerrando sesión:", err);
            return res.redirect('/dashboard');
        }

        res.clearCookie('connect.sid');
        res.redirect('/login');

    });

});

module.exports = router;