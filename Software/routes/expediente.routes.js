const express = require('express');
const router = express.Router();

const db = require('../DB');


/* =========================================
   👤 OBTENER EMPLEADO
========================================= */

router.get('/api/empleado/:id', async (req, res) => {

    try {

        const { id } = req.params;

        const sql = `

            SELECT 
                e.*,

                c.cargo AS cargo,
                a.area AS area,
                s.sede AS sede

            FROM empleados e

            LEFT JOIN cargos c
            ON e.cargo_id = c.id

            LEFT JOIN areas a
            ON e.area_id = a.id

            LEFT JOIN sedes s
            ON e.sede_id = s.id

            WHERE e.id = $1

        `;

        const empleados = await db.query(sql, [id]);

        if (empleados.rows.length === 0) {

            return res.json({
                ok: false
            });

        }

        res.json({

            ok: true,
            empleado: empleados.rows[0]

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