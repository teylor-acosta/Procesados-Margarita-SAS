const express = require('express');
const router = express.Router();

const db = require('../DB');

const {
    proteger,
    soloSuperAdmin
} = require('../middlewares/auth');

/* =========================================
   OBTENER ROLES
========================================= */

router.get(
    '/api/roles-accesos/roles',
    proteger,
    soloSuperAdmin,
    async (req, res) => {

        try {

            const [roles] = await db.query(`

                SELECT

                    r.ID,
                    r.CodigoRol,
                    r.Nombre,
                    r.descripcion,

                    (
                        SELECT COUNT(*)
                        FROM usuarios u
                        WHERE u.rol_id = r.ID
                    ) AS total_usuarios,

                    (
                        SELECT COUNT(*)
                        FROM permisos_roles pr
                        WHERE pr.rol_id = r.ID
                        AND pr.activo = 1
                    ) AS total_modulos

                FROM rol r

                WHERE r.activo = 1

                ORDER BY r.Nombre ASC

            `);

            res.json({

                success: true,
                roles

            });

        } catch (error) {

            console.error(error);

            res.status(500).json({

                success: false

            });

        }

    }
);

/* =========================================
   OBTENER MODULOS
========================================= */

router.get(
    '/api/roles-accesos/modulos',
    proteger,
    soloSuperAdmin,
    async (req, res) => {

        try {

            const [modulos] = await db.query(`

                SELECT

                    id,
                    nombre,
                    ruta,
                    icono

                FROM modulos

                WHERE activo = 1

                ORDER BY nombre

            `);

            res.json({

                success: true,
                modulos

            });

        } catch (error) {

            console.error(error);

            res.status(500).json({

                success: false

            });

        }

    }
);

/* =========================================
   OBTENER PERMISOS DE UN ROL
========================================= */

router.get(
    '/api/roles-accesos/permisos/:rolId',
    proteger,
    soloSuperAdmin,
    async (req, res) => {

        try {

            const { rolId } = req.params;

            const [permisos] = await db.query(`

                SELECT

                    modulo_id

                FROM permisos_roles

                WHERE rol_id = ?
                AND activo = 1

            `,[rolId]);

            res.json({

                success:true,
                permisos

            });

        } catch(error){

            console.error(error);

            res.status(500).json({

                success:false

            });

        }

    }
);

/* =========================================
   CREAR ROL
========================================= */

router.post(
    '/api/roles-accesos/crear',
    proteger,
    soloSuperAdmin,
    async (req, res) => {

        try {

            const {

                codigo,
                nombre,
                descripcion

            } = req.body;

            const [existe] =
            await db.query(

                `
                SELECT ID
                FROM rol
                WHERE CodigoRol = ?
                `,
                [codigo]

            );

            if(existe.length > 0){

                return res.json({

                    success:false,
                    message:'El código ya existe'

                });

            }

            await db.query(

                `
                INSERT INTO rol
                (
                    CodigoRol,
                    Nombre,
                    descripcion,
                    activo
                )
                VALUES
                (
                    ?,
                    ?,
                    ?,
                    1
                )
                `,
                [

                    codigo,
                    nombre,
                    descripcion

                ]

            );

            res.json({

                success:true

            });

        } catch(error){

            console.error(error);

            res.status(500).json({

                success:false

            });

        }

    }
);

/* =========================================
   GUARDAR PERMISOS
========================================= */

router.post(
    '/api/roles-accesos/guardar',
    proteger,
    soloSuperAdmin,
    async (req, res) => {

        try {

            const {

                rol_id,
                modulos

            } = req.body;

            await db.query(

                `
                DELETE
                FROM permisos_roles
                WHERE rol_id = ?
                `,
                [rol_id]

            );

            for(const nombreModulo of modulos){

                const [moduloEncontrado] =
                await db.query(

                    `
                    SELECT id
                    FROM modulos
                    WHERE nombre = ?
                    LIMIT 1
                    `,
                    [nombreModulo]

                );

                if(moduloEncontrado.length > 0){

                    await db.query(

                        `
                        INSERT INTO permisos_roles
                        (
                            rol_id,
                            modulo_id,
                            activo
                        )
                        VALUES
                        (
                            ?,
                            ?,
                            1
                        )
                        `,
                        [

                            rol_id,
                            moduloEncontrado[0].id

                        ]

                    );

                }

            }

            res.json({

                success:true

            });

        } catch(error){

            console.error(error);

            res.status(500).json({

                success:false

            });

        }

    }
);

module.exports = router;