/* ============================================================
   NOVEDADES - PROCESADOS MARGARITA
   Rutas del módulo de novedades de nómina
   ============================================================ */

const express = require('express');
const path = require('path');

const router = express.Router();

const {
    proteger,
    soloRol
} = require('../middlewares/auth');


/* ============================================================
   PÁGINA PRINCIPAL DE NOVEDADES
   ============================================================ */

router.get(
    '/nomina/novedades',
    proteger,
    (req, res) => {

        res.sendFile(
            path.join(
                __dirname,
                '../public/nomina-novedades.html'
            )
        );

    }
);


/* ============================================================
   LISTAR NOVEDADES
   ============================================================ */

router.get(
    '/api/nomina/novedades',
    proteger,
    async (req, res) => {

        try {

            const db = req.app.get('db');

            const [novedades] = await db.query(`
                SELECT
                    n.id,
                    n.empleado_id,
                    e.nombre AS empleado_nombre,
                    e.numero_documento,

                    n.tipo_novedad_id,
                    t.nombre AS tipo_novedad,
                    t.codigo AS codigo_novedad,
                    t.categoria,

                    n.fecha_inicio,
                    n.fecha_fin,
                    n.hora_inicio,
                    n.hora_fin,
                    n.cantidad_dias,
                    n.cantidad_horas,

                    n.motivo,
                    n.observacion,

                    n.estado,
                    n.observacion_rechazo,

                    n.usuario_creacion,
                    n.usuario_revision,

                    n.fecha_creacion,
                    n.fecha_revision

                FROM nomina_novedades n

                INNER JOIN empleados e
                    ON e.id = n.empleado_id

                INNER JOIN nomina_novedades_tipos t
                    ON t.id = n.tipo_novedad_id

                ORDER BY n.fecha_creacion DESC
            `);

            res.json({
                success: true,
                novedades
            });

        } catch (error) {

            console.error(
                'ERROR LISTANDO NOVEDADES:',
                error
            );

            res.status(500).json({
                success: false,
                message: 'Error al consultar las novedades'
            });

        }

    }
);

/* ============================================================
   TIPOS DE NOVEDAD ACTIVOS
   ============================================================ */

router.get(
    '/api/nomina/novedades/tipos',
    proteger,
    async (req, res) => {

        try {

            const db = req.app.get('db');

            const [tipos] = await db.query(`
                SELECT
                    id,
                    nombre,
                    codigo,
                    categoria,
                    descripcion,
                    permite_empleado,
                    requiere_soporte,
                    requiere_aprobacion
                FROM nomina_novedades_tipos
                WHERE activo = 1
                ORDER BY categoria ASC, nombre ASC
            `);

            res.json({
                success: true,
                tipos
            });

        } catch (error) {

            console.error(
                'ERROR CARGANDO TIPOS DE NOVEDAD:',
                error
            );

            res.status(500).json({
                success: false,
                message: 'Error al cargar los tipos de novedad'
            });

        }

    }
);


/* ============================================================
   EXPORTAR
   ============================================================ */

module.exports = router;