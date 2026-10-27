const express = require('express');
const router = express.Router();

const {
    proteger,
    soloSuperAdmin
} = require('../middlewares/auth');

const db = require('../DB');


/* =========================================
   🔥 VISTA
========================================= */

router.get(
    '/centro-actividad',
    proteger,
    soloSuperAdmin,
    (req, res) => {

        res.sendFile(
            'centro-actividad.html',
            {
                root: 'public'
            }
        );

    }
);


/* =========================================
   🔥 OBTENER ACTIVIDADES
========================================= */

router.get(
    '/api/centro-actividad',
    proteger,
    soloSuperAdmin,

    async (req, res) => {

        try {

            const sql = `

                SELECT
                    ca.*,
                    e.nombre AS empleado_nombre,
                    u.usuario AS usuario_nombre

                FROM centro_actividad ca

                LEFT JOIN empleados e
                ON ca.empleado_id = e.id

                LEFT JOIN usuarios u
                ON ca.usuario_id = u.id

                ORDER BY ca.fecha DESC

            `;

            const [results] =
                await db.query(sql);

            res.json({

                ok: true,
                actividades: results

            });

        } catch(err) {

            console.log(err);

            res.status(500).json({

                ok: false,
                error: err.message

            });

        }

    }
);

module.exports = router;