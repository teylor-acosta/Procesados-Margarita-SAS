const express = require('express');
const router = express.Router();

const db = require('../DB');


/* =========================================
   👤 OBTENER EMPLEADO
========================================= */

router.get('/api/empleado/:id', async (req, res) => {

    try {

        const { id } = req.params;

        const [empleados] = await db.query(`

            SELECT 
                e.*,

                c.nombre AS cargo,
                a.nombre AS area,
                s.nombre AS sede

            FROM empleados e

            LEFT JOIN cargos c
            ON e.cargo_id = c.id

            LEFT JOIN areas a
            ON e.area_id = a.id

            LEFT JOIN sedes s
            ON e.sede_id = s.id

            WHERE e.id = ?

        `, [id]);

        if (empleados.length === 0) {

            return res.json({
                ok: false
            });

        }

        res.json({

            ok: true,
            empleado: empleados[0]

        });

    } catch (error) {

        console.log(error);

        res.status(500).json({

            ok: false,
            mensaje: 'Error servidor',
            error: error.message

        });

    }

});

module.exports = router;