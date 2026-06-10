const express = require('express');
const router = express.Router();

const db = require('../DB');
const ExcelJS = require('exceljs');

const {
    proteger
} = require('../middlewares/auth');

/* =========================================
   DASHBOARD
========================================= */

router.get(
    '/api/capacitaciones/dashboard',
    proteger,
    async (req,res)=>{

        try{

            const [[totales]] =
            await db.query(`

                SELECT
                (
                    SELECT COUNT(*)
                    FROM certificados_usuario
                ) certificados,

                (
                    SELECT COUNT(*)
                    FROM usuarios
                ) usuarios

            `);

            const [[subCapitulos]] =
await db.query(`

    SELECT
        COUNT(*) total
    FROM sub_capitulos_induccion
    WHERE activo = 1

`);

const [[capitulos]] =
await db.query(`

    SELECT
        COUNT(*) total
    FROM capitulos_induccion
    WHERE activo = 1

`);

const totalSubCapitulos =
subCapitulos.total || 0;

const totalCapitulos =
capitulos.total || 0;

const totalElementos =
totalSubCapitulos +
totalCapitulos;

            const [progresos] =
await db.query(`

    SELECT

        u.ID,

        COUNT(
            DISTINCT pv.id
        ) vistos,

        CASE

            WHEN MAX(cu.id)
            IS NOT NULL

            THEN 1

            ELSE 0

        END certificado

    FROM usuarios u

    LEFT JOIN progreso_videos pv

        ON pv.usuario_id = u.ID

        AND pv.visto = 1

    LEFT JOIN certificados_usuario cu

        ON cu.usuario_id = u.ID

    GROUP BY u.ID

`);

            let completadas = 0;
let proceso = 0;
let pendientes = 0;

progresos.forEach(usuario => {

    const porcentaje =
    Math.round(

        (
            usuario.vistos /
            totalSubCapitulos
        ) * 100

    );

    const tieneCertificado =
        usuario.certificado === 1;

    if (tieneCertificado) {

        completadas++;

    }
    else if (porcentaje > 0) {

        proceso++;

    }
    else {

        pendientes++;

    }

});

            res.json({

                completadas,
                proceso,
                pendientes,

                certificados:
                totales.certificados

            });

        }catch(error){

            console.error(error);

            res.status(500).json({

                success:false

            });

        }

    }
);

/* =========================================
   SEGUIMIENTO
========================================= */

router.get(
    '/api/capacitaciones/seguimiento',
    proteger,
    async (req,res)=>{

        try{

            const [[subCapitulos]] =
            await db.query(`

                SELECT
                    COUNT(*) total
                FROM sub_capitulos_induccion
                WHERE activo = 1

            `);

            const [[capitulos]] =
            await db.query(`

                SELECT
                    COUNT(*) total
                FROM capitulos_induccion
                WHERE activo = 1

            `);

            const totalSubCapitulos =
            subCapitulos.total || 0;

            const totalCapitulos =
            capitulos.total || 0;

            const totalElementos =
            totalSubCapitulos +
            totalCapitulos;

            const [usuarios] =
            await db.query(`

                SELECT

                    u.ID,

                    u.Usuario,

                    e.codigo,

                    e.nombre,

                    COUNT(
                        DISTINCT pv.id
                    ) vistos,

                    COUNT(
                        DISTINCT
                        CASE
                            WHEN re.aprobado = 1
                            THEN re.capitulo_id
                        END
                    ) evaluaciones_aprobadas,

                    MAX(
                        re.nota
                    ) nota,

                    MAX(
                        re.aprobado
                    ) aprobado,

                    CASE

                        WHEN MAX(cu.id)
                        IS NOT NULL

                        THEN 1

                        ELSE 0

                    END certificado

                FROM usuarios u

                LEFT JOIN empleados e
                    ON e.id =
                    u.empleado_id

                LEFT JOIN progreso_videos pv
                    ON pv.usuario_id =
                    u.ID

                    AND pv.visto = 1

                LEFT JOIN resultados_evaluaciones re
                    ON re.usuario_id =
                    u.ID

                LEFT JOIN certificados_usuario cu
                    ON cu.usuario_id =
                    u.ID

                GROUP BY

                    u.ID,
                    u.Usuario,
                    e.codigo,
                    e.nombre

                ORDER BY
                CAST(
                    REPLACE(
                        e.codigo,
                        'EMP',
                        ''
                    )
                    AS UNSIGNED
                ) ASC

            `);

            const resultado =
            usuarios.map(usuario=>{

                let progreso =
                Math.round(

                    (
                        (
                            usuario.vistos +
                            usuario.evaluaciones_aprobadas
                        )
                        /
                        totalElementos
                    ) * 100

                );

                let estado =
                'Sin Iniciar';

                if(
                    usuario.certificado
                ){

                    progreso = 100;

                    estado =
                    'Completada';

                }
                else if(
                    progreso > 0
                ){

                    estado =
                    'En Proceso';

                }

                return{

                    codigo:
                    usuario.codigo || '',

                    empleado:
                    usuario.nombre || '',

                    usuario:
                    usuario.Usuario || '',

                    progreso,

                    evaluacion:
                    usuario.nota !== null
                    ?
                    (
                        usuario.aprobado
                        ?
                        `Aprobado (${usuario.nota})`
                        :
                        `Reprobado (${usuario.nota})`
                    )
                    :
                    'Pendiente',

                    certificado:
                    usuario.certificado
                    ?
                    'Sí'
                    :
                    'No',

                    estado

                };

            });

            res.json(
                resultado
            );

        }catch(error){

            console.error(error);

            res.status(500).json({

                success:false

            });

        }

    }
);
router.get(
    '/api/capacitaciones/detalle/:usuario',
    proteger,
    async(req,res)=>{

        try{

            const usuario =
            req.params.usuario;

            const [[empleado]] =
            await db.query(`

                SELECT

                    e.codigo,
                    e.nombre,

                    u.Usuario

                FROM usuarios u

                INNER JOIN empleados e
                    ON e.id =
                    u.empleado_id

                WHERE
                u.Usuario = ?

            `,[usuario]);

            const [[evaluacion]] =
            await db.query(`

                SELECT *

                FROM resultados_evaluaciones

                WHERE usuario_id = (

                    SELECT ID
                    FROM usuarios
                    WHERE Usuario = ?

                )

                ORDER BY fecha_evaluacion DESC

                LIMIT 1

            `,[usuario]);

            const [[certificado]] =
            await db.query(`

                SELECT *

                FROM certificados_usuario

                WHERE usuario_id = (

                    SELECT ID
                    FROM usuarios
                    WHERE Usuario = ?

                )

                LIMIT 1

            `,[usuario]);

            const [capitulos] =
            await db.query(`

                SELECT

                    s.id,

                    s.titulo,

                    CASE

                        WHEN pv.id IS NOT NULL

                        THEN 1

                        ELSE 0

                    END visto

                FROM sub_capitulos_induccion s

                LEFT JOIN progreso_videos pv

                    ON pv.sub_capitulo_id =
                    s.id

                    AND pv.usuario_id = (

                        SELECT ID
                        FROM usuarios
                        WHERE Usuario = ?

                    )

                WHERE s.activo = 1

                ORDER BY s.orden

            `,[usuario]);

            res.json({

                empleado,

                evaluacion,

                certificado,

                capitulos

            });

        }catch(error){

            console.error(error);

            res.status(500).json({

                success:false

            });

        }

    }
);

router.get(
    '/api/capacitaciones/exportar-excel',
    proteger,
    async(req,res)=>{

        try{

            const [[subCapitulos]] =
            await db.query(`

                SELECT
                    COUNT(*) total
                FROM sub_capitulos_induccion
                WHERE activo = 1

            `);

            const [[capitulos]] =
            await db.query(`

                SELECT
                    COUNT(*) total
                FROM capitulos_induccion
                WHERE activo = 1

            `);

            const totalElementos =

                (subCapitulos.total || 0)
                +
                (capitulos.total || 0);

            const [usuarios] =
            await db.query(`

                SELECT

                    e.codigo,

                    e.nombre,

                    u.Usuario,

                    COUNT(
                        DISTINCT pv.id
                    ) vistos,

                    COUNT(
                        DISTINCT
                        CASE
                            WHEN re.aprobado = 1
                            THEN re.capitulo_id
                        END
                    ) evaluaciones_aprobadas,

                    MAX(
                        re.nota
                    ) nota,

                    MAX(
                        re.aprobado
                    ) aprobado,

                    CASE

                        WHEN MAX(cu.id)
                        IS NOT NULL

                        THEN 1

                        ELSE 0

                    END certificado

                FROM usuarios u

                LEFT JOIN empleados e
                    ON e.id =
                    u.empleado_id

                LEFT JOIN progreso_videos pv
                    ON pv.usuario_id =
                    u.ID

                    AND pv.visto = 1

                LEFT JOIN resultados_evaluaciones re
                    ON re.usuario_id =
                    u.ID

                LEFT JOIN certificados_usuario cu
                    ON cu.usuario_id =
                    u.ID

                GROUP BY

                    e.codigo,
                    e.nombre,
                    u.Usuario

                ORDER BY
                CAST(
                    REPLACE(
                        e.codigo,
                        'EMP',
                        ''
                    )
                    AS UNSIGNED
                )

            `);

            const workbook =
            new ExcelJS.Workbook();

            const sheet =
            workbook.addWorksheet(
                'Capacitaciones'
            );

            sheet.columns = [

                {
                    header:'Código',
                    key:'codigo',
                    width:15
                },

                {
                    header:'Empleado',
                    key:'empleado',
                    width:40
                },

                {
                    header:'Usuario',
                    key:'usuario',
                    width:20
                },

                {
                    header:'Progreso',
                    key:'progreso',
                    width:15
                },

                {
                    header:'Evaluación',
                    key:'evaluacion',
                    width:20
                },

                {
                    header:'Certificado',
                    key:'certificado',
                    width:15
                },

                {
                    header:'Estado',
                    key:'estado',
                    width:20
                }

            ];

            usuarios.forEach(usuario=>{

                let progreso =
                Math.round(

                    (
                        (
                            usuario.vistos +
                            usuario.evaluaciones_aprobadas
                        )
                        /
                        totalElementos
                    ) * 100

                );

                let estado =
                'Sin Iniciar';

                if(usuario.certificado){

                    progreso = 100;

                    estado = 'Completada';

                }
                else if(
                    progreso > 0
                ){

                    estado =
                    'En Proceso';

                }

                sheet.addRow({

                    codigo:
                    usuario.codigo,

                    empleado:
                    usuario.nombre,

                    usuario:
                    usuario.Usuario,

                    progreso:
                    progreso + '%',

                    evaluacion:
                    usuario.nota
                    ?
                    usuario.nota
                    :
                    'Pendiente',

                    certificado:
                    usuario.certificado
                    ?
                    'Sí'
                    :
                    'No',

                    estado

                });

            });

            res.setHeader(

                'Content-Type',

                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'

            );

            res.setHeader(

                'Content-Disposition',

                'attachment; filename=capacitaciones.xlsx'

            );

            await workbook.xlsx.write(
                res
            );

            res.end();

        }catch(error){

            console.error(error);

            res.status(500).json({

                success:false

            });

        }

    }
);

module.exports = router;