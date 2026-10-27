const express = require('express');
const router = express.Router();

const bcrypt = require('bcrypt');

const db = require('../DB');

const { proteger } = require('../middlewares/auth');

// ============================================
// 🔥 EMPLEADOS
// ============================================

router.get(
    '/empleados',
    proteger,
    async (req, res) => {

        try {

            const sql = `

                SELECT

                    id,
                    nombre,
                    numero_documento

                FROM empleados

                WHERE activo = 'SI'

                ORDER BY nombre ASC

            `;

            const [empleados] =
                await db.query(sql);

            res.json({

                success:true,
                empleados

            });

        } catch (error) {

            console.error(
                'ERROR EMPLEADOS:',
                error
            );

            res.status(500).json({

                success:false

            });

        }

    }
);

// ============================================
// 🔥 ROLES
// ============================================

router.get(
    '/roles',
    proteger,
    async (req, res) => {

        try {

            const sql = `

                SELECT

                    ID,
                    Nombre

                FROM rol

                ORDER BY Nombre ASC

            `;

            const [roles] =
                await db.query(sql);

            res.json({

                success:true,
                roles

            });

        } catch (error) {

            console.error(
                'ERROR ROLES:',
                error
            );

            res.status(500).json({

                success:false

            });

        }

    }
);

// ============================================
// 🔥 CREAR USUARIO
// ============================================

router.post(
    '/crear',
    proteger,
    async (req, res) => {

        try {

            const {

                empleado_id,
                rol_id,
                usuario,
                password,
                primera_vez,
                cambio_password,
                bloqueado

            } = req.body;

            // VALIDAR EXISTE

            const [existe] =
                await db.query(

                    `
                    SELECT ID
                    FROM usuarios
                    WHERE Usuario = ?
                    `,
                    [usuario]

                );

            if (existe.length > 0) {

                return res.json({

                    success:false,
                    message:'El usuario ya existe'

                });

            }

            // HASH

            const hash =
                await bcrypt.hash(password, 10);

            // INSERT

            await db.query(

                `
                INSERT INTO usuarios (

                    Usuario,
                    password_hash,
                    bloqueado,
                    cambio_password,
                    fecha_creacion_password,
                    rol_id,
                    empleado_id,
                    primera_vez

                )

                VALUES (?, ?, ?, ?, NOW(), ?, ?, ?)
                `,

                [

                    usuario,
                    hash,
                    bloqueado,
                    cambio_password,
                    rol_id,
                    empleado_id,
                    primera_vez

                ]

            );

            res.json({

                success:true

            });

        } catch (error) {

            console.error(
                'ERROR CREAR:',
                error
            );

            res.status(500).json({

                success:false,
                message:'Error creando usuario'

            });

        }

    }
);

module.exports = router;