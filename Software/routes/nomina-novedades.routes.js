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
   LISTAR NOVEDADES ACTIVAS
   ============================================================ */

router.get(
    '/api/nomina/novedades',
    proteger,
    async (req, res) => {

        try {

            const db = req.app.get('db');

            const rol = req.session.rol;
            const empleadoID = req.session.empleadoID;

            let sql = `
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

                WHERE
                    (
                        n.estado = 'PENDIENTE'
                        OR
                        (
                            n.estado IN ('APROBADA', 'RECHAZADA')
                            AND n.fecha_revision IS NOT NULL
                            AND n.fecha_revision >= DATE_SUB(NOW(), INTERVAL 14 DAY)
                        )
                    )
            `;


            const parametros = [];


            /* =================================================
               AUXILIAR → SOLO SUS PROPIAS NOVEDADES
               ================================================= */

            if (rol === 'auxiliar') {

                sql += `
                    AND n.empleado_id = ?
                `;

                parametros.push(empleadoID);

            }


            sql += `
                ORDER BY n.fecha_creacion DESC
            `;


            const [novedades] =
                await db.query(
                    sql,
                    parametros
                );


            res.json({

                success: true,

                rol,

                novedades

            });


        } catch (error) {

            console.error(
                'ERROR LISTANDO NOVEDADES:',
                error
            );

            res.status(500).json({

                success: false,

                message:
                    'Error al consultar las novedades'

            });

        }

    }
);

/* ============================================================
   HISTORIAL / VENCIDAS
   ============================================================ */

router.get(
    '/api/nomina/novedades/historial',
    proteger,
    async (req, res) => {

        try {

            const db = req.app.get('db');

            const rol = req.session.rol;
            const empleadoID = req.session.empleadoID;


            const {
                buscar,
                tipo,
                estado,
                tipo_fecha,
                fecha,
                mes,
                ano,
                desde,
                hasta
            } = req.query;


            let sql = `
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

                WHERE
                    n.estado IN ('APROBADA', 'RECHAZADA')

                    AND n.fecha_revision IS NOT NULL

                    AND n.fecha_revision < DATE_SUB(NOW(), INTERVAL 14 DAY)
            `;


            const parametros = [];


            /* =================================================
               AUXILIAR → SOLO SUS VENCIDAS
               ================================================= */

            if (rol === 'auxiliar') {

                sql += `
                    AND n.empleado_id = ?
                `;

                parametros.push(empleadoID);

            }


            /* =================================================
               BUSCADOR
               ================================================= */

            if (buscar && buscar.trim() !== '') {

                sql += `
                    AND (
                        e.nombre LIKE ?
                        OR e.numero_documento LIKE ?
                        OR t.nombre LIKE ?
                    )
                `;

                const texto =
                    `%${buscar.trim()}%`;

                parametros.push(
                    texto,
                    texto,
                    texto
                );

            }


            /* =================================================
               TIPO DE NOVEDAD
               ================================================= */

            if (tipo && tipo !== '') {

                sql += `
                    AND n.tipo_novedad_id = ?
                `;

                parametros.push(tipo);

            }


            /* =================================================
               ESTADO
               ================================================= */

            if (
                estado &&
                (
                    estado === 'APROBADA' ||
                    estado === 'RECHAZADA'
                )
            ) {

                sql += `
                    AND n.estado = ?
                `;

                parametros.push(estado);

            }


            /* =================================================
               FILTRO POR DÍA
               ================================================= */

            if (
                tipo_fecha === 'dia' &&
                fecha
            ) {

                sql += `
                    AND DATE(n.fecha_revision) = ?
                `;

                parametros.push(fecha);

            }


            /* =================================================
               FILTRO POR MES
               Formato esperado: YYYY-MM
               ================================================= */

            if (
                tipo_fecha === 'mes' &&
                mes
            ) {

                sql += `
                    AND DATE_FORMAT(
                        n.fecha_revision,
                        '%Y-%m'
                    ) = ?
                `;

                parametros.push(mes);

            }


            /* =================================================
               FILTRO POR AÑO
               ================================================= */

            if (
                tipo_fecha === 'ano' &&
                ano
            ) {

                sql += `
                    AND YEAR(n.fecha_revision) = ?
                `;

                parametros.push(ano);

            }


            /* =================================================
               FILTRO POR RANGO
               ================================================= */

            if (
                tipo_fecha === 'rango' &&
                desde &&
                hasta
            ) {

                sql += `
                    AND DATE(n.fecha_revision)
                        BETWEEN ? AND ?
                `;

                parametros.push(
                    desde,
                    hasta
                );

            }


            sql += `
                ORDER BY n.fecha_revision DESC
            `;


            const [novedades] =
                await db.query(
                    sql,
                    parametros
                );


            res.json({

                success: true,

                novedades

            });


        } catch (error) {

            console.error(
                'ERROR CONSULTANDO HISTORIAL:',
                error
            );

            res.status(500).json({

                success: false,

                message:
                    'Error al consultar el historial'

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