const express = require('express');

const router = express.Router();

const path = require('path');

const {
    proteger
} = require('../middlewares/auth');

// ============================================
// CENTRO DE CAPACITACIONES
// ============================================

router.get(

    '/centro-capacitaciones',

    proteger,

    (req, res) => {

        res.sendFile(

            path.join(

                __dirname,

                '../public/centro-capacitaciones.html'

            )

        );

    }

);
// ==========================================
// CREAR CURSO
// ==========================================

router.post(
    "/api/cursos",
    proteger,
    async (req, res) => {

        try {

            const {

                titulo,
                descripcion,
                fecha_limite,
                estado,
                obligatorio

            } = req.body;

            const [resultado] = await db.query(

                `
                INSERT INTO cursos
                (
                    titulo,
                    descripcion,
                    estado,
                    obligatorio,
                    fecha_limite,
                    creado_por
                )
                VALUES
                (
                    ?, ?, ?, ?, ?, ?
                )
                `,

                [

                    titulo,
                    descripcion,
                    estado,
                    obligatorio,
                    fecha_limite || null,
                    req.session.usuarioID

                ]

            );

            res.json({

                success: true,

                id: resultado.insertId,

                mensaje: "Capacitación creada correctamente."

            });

        } catch (error) {

            console.error(error);

            res.status(500).json({

                success: false,

                mensaje: "Error al crear la capacitación."

            });

        }

    }
);

module.exports = router;