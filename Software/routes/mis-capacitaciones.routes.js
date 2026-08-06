const express = require("express");

const router = express.Router();

const { proteger } = require("../middlewares/auth");

// ==============================================
// OBTENER MIS CAPACITACIONES
// ==============================================

router.get("/api/mis-capacitaciones", proteger, async (req, res) => {

    try {

        const db = req.app.get("db");

        const empleadoID = req.session.empleadoID;

        const sql = `

            SELECT

                ac.id,

                ac.estado,

                ac.fecha_asignacion,

                ac.fecha_limite,

                c.id AS capacitacion_id,

                c.nombre,

                c.descripcion,

                c.imagen,

                c.obligatorio,

                c.intensidad_horaria

            FROM asignaciones_capacitaciones ac

            INNER JOIN capacitaciones c

                ON c.id = ac.capacitacion_id

            WHERE ac.empleado_id = ?

            ORDER BY ac.fecha_asignacion DESC

        `;

        const [rows] = await db.query(sql, [empleadoID]);

        res.json({

            success: true,

            capacitaciones: rows

        });

    }

    catch(error){

        console.error(error);

        res.status(500).json({

            success:false,

            message:"Error obteniendo capacitaciones."

        });

    }

});

module.exports = router;