const express = require('express');
const router = express.Router();

const bcrypt = require('bcrypt');
const db = require('../DB');

const {
    proteger,
    soloSuperAdmin
} = require('../middlewares/auth');


// ============================================
// 🔥 LISTAR USUARIOS
// ============================================

router.get(

    '/listar',

    proteger,

    soloSuperAdmin,

    async (req, res) => {

        try {

            const sql = `

                SELECT

                    u.ID,
                    u.Usuario,
                    u.password_hash,
                    u.bloqueado,
                    u.cambio_password,
                    u.fecha_creacion_password,
                    u.fecha_cambio_password,
                    u.fecha_ultimo_login,
                    u.intentos_fallidos,
                    u.primera_vez,

                    e.nombre,
                    e.numero_documento,
                    e.foto,

                    r.Nombre AS rol

                FROM usuarios u

                LEFT JOIN empleados e
                    ON u.empleado_id = e.id

                LEFT JOIN rol r
                    ON u.rol_id = r.ID

                ORDER BY u.ID DESC

            `;

            const [usuarios] =
                await db.query(sql);

            res.json({

                success: true,
                usuarios

            });

        } catch (error) {

            console.error(
                '🔥 ERROR LISTAR USUARIOS:',
                error
            );

            res.status(500).json({

                success: false,
                message: 'Error obteniendo usuarios'

            });

        }

    }

);


// ============================================
// 🔥 BLOQUEAR / DESBLOQUEAR
// ============================================

router.post(

    '/bloquear',

    proteger,

    soloSuperAdmin,

    async (req, res) => {

        try {

            const {
                id,
                bloqueado
            } = req.body;


            // ========================================
            // 🔥 ACTUALIZAR
            // ========================================

            if(bloqueado == 0){

                // DESBLOQUEAR

                await db.query(

                    `

                    UPDATE usuarios

                    SET

                        bloqueado = 0,

                        intentos_fallidos = 0

                    WHERE ID = ?

                    `,

                    [id]

                );

            }else{

                // BLOQUEAR

                await db.query(

                    `

                    UPDATE usuarios

                    SET

                        bloqueado = 1

                    WHERE ID = ?

                    `,

                    [id]

                );

            }


            res.json({

                success: true

            });

        } catch (error) {

            console.error(
                '🔥 ERROR BLOQUEAR:',
                error
            );

            res.status(500).json({

                success: false,
                message: 'Error actualizando usuario'

            });

        }

    }

);


// ============================================
// 🔥 RESET PASSWORD
// ============================================

router.post(

    '/reset-password',

    proteger,

    soloSuperAdmin,

    async (req, res) => {

        try {

            const { id } = req.body;

            // ========================================
            // 🔥 PASSWORD TEMPORAL
            // ========================================

            const nuevaPassword = 'Pm2026*';


            // ========================================
            // 🔥 HASH
            // ========================================

            const hash =
                await bcrypt.hash(
                    nuevaPassword,
                    10
                );


            // ========================================
            // 🔥 UPDATE
            // ========================================

            await db.query(

                `

                UPDATE usuarios

                SET

                    password_hash = ?,

                    cambio_password = 1,

                    

                    bloqueado = 0,

                    intentos_fallidos = 0,

                    fecha_creacion_password = NOW()

                WHERE ID = ?

                `,

                [
                    hash,
                    id
                ]

            );


            res.json({

                success: true,
                password: nuevaPassword

            });

        } catch (error) {

            console.error(
                '🔥 ERROR RESET PASSWORD:',
                error
            );

            res.status(500).json({

                success: false,
                message: 'Error reseteando contraseña'

            });

        }

    }

);

module.exports = router;