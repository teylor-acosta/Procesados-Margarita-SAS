const express = require('express');
const router = express.Router();

const db = require('../DB');

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

            const totalSubCapitulos =
            subCapitulos.total || 1;

            const [progresos] =
            await db.query(`

                SELECT

                    u.ID,

                    COUNT(pv.id) vistos

                FROM usuarios u

                LEFT JOIN progreso_videos pv
                    ON pv.usuario_id = u.ID
                    AND pv.visto = 1

                GROUP BY u.ID

            `);

            let completadas = 0;
            let proceso = 0;
            let pendientes = 0;

            progresos.forEach(usuario=>{

                const porcentaje =
                Math.round(
                    (
                        usuario.vistos /
                        totalSubCapitulos
                    ) * 100
                );

                if(porcentaje >= 100){

                    completadas++;

                }
                else if(
                    porcentaje > 0
                ){

                    proceso++;

                }
                else{

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

            const totalSubCapitulos =
            subCapitulos.total || 1;

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
                        usuario.vistos /
                        totalSubCapitulos
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

module.exports = router;