const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');

const { proteger } = require('../middlewares/auth');

const SALT_ROUNDS = 10;


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
                e.activo,
                e.id as empleado_id

            FROM usuarios u

            JOIN rol r
            ON u.rol_id = r.id

            JOIN empleados e
            ON u.empleado_id = e.id

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
        // 🔐 VALIDAR PASSWORD
        // =========================================

        const passwordMatch = await bcrypt.compare(
            password,
            user.password_hash
        );

        if (!passwordMatch) {

            return res.json({
                success: false,
                message: "Contraseña incorrecta"
            });

        }

        // =========================================
        // 🔥 CREAR SESIÓN
        // =========================================

        req.session.usuarioID = user.ID || user.id;
        req.session.empleadoID = user.empleado_id;
        req.session.rol = user.rol;

        // =========================================
        // 🔥 CAMBIO PASSWORD
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

                (SELECT COUNT(*) 
                 FROM capitulos_induccion 
                 WHERE activo = 1) as total,

                (SELECT COUNT(DISTINCT capitulo_id) 
                 FROM resultados_evaluaciones 
                 WHERE usuario_id = ? 
                 AND aprobado = 1) as aprobados,

                (SELECT COUNT(*) 
                 FROM certificados_usuario 
                 WHERE usuario_id = ?) as tiene_certificado

        `;

        const [results2] = await db.query(
            sqlCheck,
            [
                req.session.usuarioID,
                req.session.usuarioID
            ]
        );

        let destino = "/dashboard";

        if (results2.length > 0) {

            const total = results2[0].total || 0;

            const aprobados = results2[0].aprobados || 0;

            const tieneCertificado =
                results2[0].tiene_certificado > 0;

            if (tieneCertificado) {

                destino = "/dashboard";

            }

            else if (aprobados < total) {

                destino = "/induccion";

            }

            else {

                destino = "/firma";

            }

        }

        req.session.save(() => {

            res.json({
                success: true,
                redirect: destino
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
// 🔥 /api/me
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

                (SELECT COUNT(*) 
                 FROM capitulos_induccion 
                 WHERE activo = 1) as total,

                (SELECT COUNT(DISTINCT capitulo_id) 
                 FROM resultados_evaluaciones 
                 WHERE usuario_id = ? 
                 AND aprobado = 1) as aprobados,

                (SELECT COUNT(*) 
                 FROM certificados_usuario 
                 WHERE usuario_id = ?) as tiene_certificado

            FROM usuarios u

            JOIN empleados e
            ON u.empleado_id = e.id

            LEFT JOIN cargos c
            ON e.cargo_id = c.id

            LEFT JOIN areas a
            ON e.area_id = a.id

            LEFT JOIN sedes s
            ON e.sede_id = s.id

            JOIN rol r
            ON u.rol_id = r.id

            WHERE u.id = ?

        `;

        const [results] = await db.query(
            sql,
            [
                usuario_id,
                usuario_id,
                usuario_id
            ]
        );

        if (results.length === 0) {

            return res.json({
                success: false
            });

        }

        const u = results[0];

        if (u.activo === 'NO') {

            req.session.destroy();

            return res.json({
                success: false
            });

        }

        const total = u.total || 0;

        const aprobados = u.aprobados || 0;

        const tieneCertificado =
            (u.tiene_certificado || 0) > 0;

        const completo =
            aprobados >= total && total > 0;

        let redirect = "/dashboard";

        if (parseInt(u.cambio_password) === 1) {

            redirect = "/cambiar-password";

        }

        else if (!completo) {

            redirect = "/induccion";

        }

        else if (!tieneCertificado) {

            redirect = "/firma";

        }

        res.json({

            success: true,

            usuario: u,

            completo,

            tiene_certificado: tieneCertificado,

            redirect

        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            success: false
        });

    }

});
// ============================================
// 🔥 RECUPERAR PASSWORD
// ============================================

// ============================================
// 🔥 RECUPERAR PASSWORD
// ============================================

router.post('/api/recuperar', async (req, res) => {

    try {

        const db = req.app.get('db');

        const { documento } = req.body;

        const sql = `

            SELECT u.id 

            FROM usuarios u 

            JOIN empleados e
            ON u.empleado_id = e.id 

            WHERE e.numero_documento = ?

        `;

        const [results] = await db.query(sql, [documento]);

        if (results.length === 0) {

            return res.json({
                success: false,
                message: "no encontrado"
            });

        }

        const hashedTempPass =
            await bcrypt.hash('123456', SALT_ROUNDS);

        await db.query(

            `

            UPDATE usuarios 

            SET 
                password_hash = ?,
                cambio_password = 1 

            WHERE id = ?

            `,

            [
                hashedTempPass,
                results[0].id
            ]

        );

        res.json({

            success: true,
            password: "123456"

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
// 🔥 CAMBIAR PASSWORD
// ============================================
// ============================================
// 🔥 CAMBIAR PASSWORD
// ============================================

router.post('/api/cambiar-password', proteger, async (req, res) => {

    try {

        const db = req.app.get('db');

        const { password } = req.body;

        const hash =
            await bcrypt.hash(password, SALT_ROUNDS);

        await db.query(

            `

            UPDATE usuarios 

            SET 
                password_hash = ?,
                cambio_password = 0 

            WHERE id = ?

            `,

            [
                hash,
                req.session.usuarioID
            ]

        );

        req.session.destroy(() => {

            res.json({

                success: true,
                redirect: "/login"

            });

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
// 🔥 LOGOUT
// ============================================

router.get('/logout', (req, res) => {

    req.session.destroy(err => {

        if (err) {

            console.error(
                "Error cerrando sesión:",
                err
            );

            return res.redirect('/dashboard');

        }

        res.clearCookie('connect.sid');

        res.redirect('/login');

    });

});

module.exports = router;