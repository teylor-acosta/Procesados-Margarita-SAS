const express = require('express');
const router = express.Router();

const db = require('../DB');

const { proteger } = require('../middlewares/auth');

/* ===========================================================
   OBTENER MENÚ SEGÚN EL ROL
=========================================================== */

router.get(

    '/menu',

    proteger,

    async (req, res) => {

        try {

            const rolID = req.session.rolID;
            const pagina = req.query.tipo || 'ERP';

            if (!rolID) {

                return res.status(401).json({

                    success: false,

                    message: 'Rol no encontrado en la sesión.'

                });

            }

            const sql = `

                SELECT

                    m.id,

                    m.nombre,

                    m.ruta,

                    m.icono,

                    m.padre_id,

                    m.tipo,

                    m.orden

                FROM modulos m

                INNER JOIN permisos_roles pr

                    ON pr.modulo_id = m.id

                WHERE

    pr.rol_id = ?

    AND pr.activo = 1

    AND m.activo = 1

    AND m.tipo = ?

                ORDER BY

                    m.tipo,

                    m.padre_id,

                    m.orden,

                    m.nombre

            `;

            const [modulos] =
    await db.query(

        sql,

        [

            rolID,

            pagina

        ]

    );

// ==========================================
// CREAR MAPA DE MÓDULOS
// ==========================================

const mapa = {};

modulos.forEach(modulo => {

    modulo.hijos = [];

    mapa[modulo.id] = modulo;

});

// ==========================================
// CONSTRUIR ÁRBOL
// ==========================================

const menu = [];

modulos.forEach(modulo => {

    if (modulo.padre_id === null) {

        menu.push(modulo);

    } else {

        const padre = mapa[modulo.padre_id];

        if (padre) {

            padre.hijos.push(modulo);

        }

    }

});

// ==========================================
// RESPUESTA
// ==========================================

res.json({

    success: true,

    menu

});

        }

        catch (error) {

            console.error(

                'ERROR SIDEBAR:',

                error

            );

            res.status(500).json({

                success: false,

                message: 'Error obteniendo el menú.'

            });

        }

    }

);

module.exports = router;