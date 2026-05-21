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

    service: 'gmail',

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
                e.activo,
                e.id as empleado_id

            FROM usuarios u

            JOIN rol r
            ON u.rol_id = r.id

            JOIN empleados e
            ON u.empleado_id = e.id

            WHERE u.Usuario = ?

        `;

        const [results] =
            await db.query(sql, [usuario]);

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
                message:
                    'Empleado inactivo. Comuníquese con el administrador.'

            });

        }

        // =========================================
        // 🔐 VALIDAR PASSWORD
        // =========================================

        const passwordMatch =
            await bcrypt.compare(

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

        req.session.usuarioID =
            user.ID || user.id;

        req.session.empleadoID =
            user.empleado_id;

        req.session.rol =
            user.rol;

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

        const [results2] =
            await db.query(

                sqlCheck,

                [
                    req.session.usuarioID,
                    req.session.usuarioID
                ]

            );

        let destino = "/dashboard";

        if (results2.length > 0) {

            const total =
                results2[0].total || 0;

            const aprobados =
                results2[0].aprobados || 0;

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

    }

    catch (error) {

        console.error(
            '🔥 ERROR LOGIN COMPLETO:',
            error
        );

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

        const usuario_id =
            req.session.usuarioID;

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

        const [results] =
            await db.query(

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

        const total =
            u.total || 0;

        const aprobados =
            u.aprobados || 0;

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

    }

    catch (error) {

        console.error(error);

        res.status(500).json({

            success: false

        });

    }

});

// ============================================
// 🔥 RECUPERAR PASSWORD TOKEN
// ============================================

router.post('/api/recuperar', async (req, res) => {

    try {

        const db = req.app.get('db');

        const { documento } =
            req.body;

        const sql = `

            SELECT 

                u.id,
                e.nombre,
                e.email

            FROM usuarios u

            JOIN empleados e
            ON u.empleado_id = e.id

            WHERE e.numero_documento = ?

        `;

        const [results] =
            await db.query(sql, [documento]);

        if (results.length === 0) {

            return res.json({

                success: true,

                message:
                    'Si la cuenta existe se enviará un correo.'

            });

        }

        const usuario =
            results[0];

        // =========================================
        // 🔥 TOKEN
        // =========================================

        const token = crypto

            .randomBytes(32)

            .toString('hex');

        // =========================================
        // 🔥 GUARDAR TOKEN
        // =========================================

        await db.query(

            `

            UPDATE usuarios

            SET

                token_reset = ?,

                token_expira =
                    DATE_ADD(NOW(), INTERVAL 10 MINUTE)

            WHERE id = ?

            `,

            [
                token,
                usuario.id
            ]

        );

        // =========================================
        // 🔥 LINK
        // =========================================

        const resetLink = `https://procesadosmargaritasas.com/reset/${token}`;

        

        // =========================================
        // 🔥 EMAIL
        // =========================================

        try {

            await transporter.sendMail({

                from: process.env.EMAIL_USER,

                to: usuario.email,

                subject:
                    'Recuperación de contraseña ERP',

                html: `

                    <div style="
                        font-family:Arial;
                        padding:20px;
                    ">

                        <h2>
                            Recuperación de acceso
                        </h2>

                        <p>
                            Hola ${usuario.nombre}.
                        </p>

                        <p>
                            Haz clic aquí:
                        </p>

                        <a
                            href="${resetLink}"

                            style="
                                display:inline-block;
                                padding:12px 25px;
                                background:#2563eb;
                                color:white;
                                text-decoration:none;
                                border-radius:10px;
                                font-weight:bold;
                            "
                        >
                            Restablecer contraseña
                        </a>

                    </div>

                `

            });

        }

        catch(error){

            console.log(
                '🔥 ERROR EMAIL:',
                error
            );

            return res.status(500).json({

                success:false,
                message:'Error enviando correo'

            });

        }

        res.json({

            success:true,

            message:
                'Si la cuenta existe se enviará un correo.'

        });

    }

    catch (error) {

        console.error(
            '🔥 ERROR RECUPERAR:',
            error
        );

        res.status(500).json({

            success:false,
            message:'Error interno del servidor'

        });

    }

});

// ============================================
// 🔥 CAMBIAR PASSWORD LOGUEADO
// ============================================

router.post(
    '/api/cambiar-password',
    proteger,
    async (req, res) => {

        try {

            const db =
                req.app.get('db');

            const {
                nuevaPassword
            } = req.body;

            // ========================================
            // VALIDAR
            // ========================================

            if (!nuevaPassword) {

                return res.status(400).json({

                    success:false,
                    message:'Password requerida'

                });

            }

            // ========================================
            // HASH
            // ========================================

            const hash =
                await bcrypt.hash(
                    nuevaPassword,
                    SALT_ROUNDS
                );

            // ========================================
            // UPDATE
            // ========================================

            await db.query(

                `
                UPDATE usuarios

                SET

                    password_hash = ?,

                    cambio_password = 0,

                    primera_vez = 0,

                    fecha_cambio_password = NOW()

                WHERE id = ?
                `,

                [

                    hash,
                    req.session.usuarioID

                ]

            );

            res.json({

                success:true,
                redirect:'/induccion'

            });

        }

        catch (error) {

            console.error(
                '🔥 ERROR CAMBIAR PASSWORD:',
                error
            );

            res.status(500).json({

                success:false,
                message:'Error interno del servidor'

            });

        }

    }
);

// ============================================
// 🔥 LOGOUT
// ============================================

router.get('/logout', (req, res) => {

    console.log('🔥 Logout iniciado');

    console.log('Session antes:', req.session);

    req.session.destroy(err => {

        if (err) {

            console.error(
                "Error cerrando sesión:",
                err
            );

            return res.redirect('/dashboard');

        }

        console.log('✅ Sesión destruida');

        res.clearCookie('connect.sid');

        res.redirect('/login');

    });

});

// ============================================
// 🔥 RESET PASSWORD TOKEN
// ============================================

router.post('/api/reset-password', async (req, res) => {

    try {

        const db = req.app.get('db');

        const {

            token,
            password

        } = req.body;

        // ========================================
        // VALIDAR
        // ========================================

        if (!token || !password) {

            return res.status(400).json({

                success:false,
                message:'Datos incompletos'

            });

        }

        // ========================================
        // BUSCAR TOKEN
        // ========================================

        const sql = `

            SELECT *

            FROM usuarios

            WHERE token_reset = ?

            AND token_expira > NOW()

        `;

        const [results] =
            await db.query(sql, [token]);

        if (results.length === 0) {

            return res.status(400).json({

                success:false,
                message:
                    'El enlace expiró o no es válido'

            });

        }

        const usuario =
            results[0];

        // ========================================
        // HASH
        // ========================================

        const hash =
            await bcrypt.hash(

                password,
                SALT_ROUNDS

            );

        // ========================================
        // UPDATE
        // ========================================

        await db.query(

            `

            UPDATE usuarios

            SET

                password_hash = ?,

                token_reset = NULL,

                token_expira = NULL,

                cambio_password = 0,

                primera_vez = 0,

                fecha_cambio_password = NOW()

            WHERE id = ?

            `,

            [

                hash,
                usuario.id

            ]

        );

        res.json({

            success:true,
            message:'Contraseña actualizada'

        });

    }

    catch (error) {

        console.error(

            '🔥 ERROR RESET PASSWORD:',
            error

        );

        res.status(500).json({

            success:false,
            message:'Error interno del servidor'

        });

    }

});

module.exports = router;