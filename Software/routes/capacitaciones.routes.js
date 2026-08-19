const express = require('express');
const router = express.Router();

const path = require("path");

const db = require('../DB');
const ExcelJS = require('exceljs');

const {
    proteger
} = require('../middlewares/auth');

const uploadVideo = require("../middlewares/uploadVideo");

const uploadMaterialApoyo = require("../middlewares/uploadMaterialApoyo");
const uploadCapacitacion =
require("../middlewares/uploadCapacitacion");

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

// =========================================
// CENTRO DE CAPACITACIONES
// =========================================

router.get(
    "/centro-capacitaciones",
    proteger,
    (req, res) => {

        res.sendFile(
            path.join(
                __dirname,
                "../public/centro-capacitaciones.html"
            )
        );

    }
);

router.get(
    "/administrar-capacitaciones",
    proteger,
    (req, res) => {

        res.sendFile(
            path.join(
                __dirname,
                "../public/administrar-capacitaciones.html"
            )
        );

    }
);

router.get(
    "/mis-capacitaciones",
    proteger,
    (req, res) => {

        res.sendFile(
            path.join(
                __dirname,
                "../public/mis-capacitaciones.html"
            )
        );

    }
);

router.get(
    "/seguimiento-general",
    proteger,
    (req, res) => {

        res.sendFile(
            path.join(
                __dirname,
                "../public/seguimiento-general.html"
            )
        );

    }
);

router.get(
    "/administrar-induccion",
    (req, res) => {

        res.sendFile(
            path.join(
                __dirname,
                "../public/administrar-induccion.html"
            )
        );

    }
);

router.get(
    "/administrar-curso/:id",
    proteger,
    (req, res) => {

        res.sendFile(
            path.join(
                __dirname,
                "../public/administrar-curso.html"
            )
        );

    }
);

router.get(
    "/administrar-material-apoyo",
    proteger,
    (req,res)=>{

        res.sendFile(

            path.join(

                __dirname,

                "../public/administrar-material-apoyo.html"

            )

        );

    }
);

// ==========================================
// LISTAR CURSOS
// ==========================================

router.get(
    "/api/cursos",
    proteger,
    async (req, res) => {

        try {

            const [rows] = await db.query(

                `
                SELECT

                    c.*,

                    COUNT(DISTINCT cc.id) AS contenido,

                    COUNT(DISTINCT ca.id) AS empleados

                FROM cursos c

                LEFT JOIN curso_contenido cc
                    ON cc.curso_id = c.id

                LEFT JOIN curso_asignados ca
                    ON ca.curso_id = c.id

                GROUP BY c.id

                ORDER BY c.fecha_creacion DESC
                `

            );

            res.json({

                success: true,

                cursos: rows

            });

        } catch (error) {

            console.error(error);

            res.status(500).json({

                success:false,

                mensaje:"Error obteniendo cursos."

            });

        }

    }
);

// ==========================================
// CREAR CURSO
// ==========================================

router.post(
    "/api/cursos",
    proteger,
    uploadCapacitacion.single("imagen"),
    async (req, res) => {

        try {

            const {

                titulo,
                descripcion,
                estado,
                obligatorio,
                fecha_limite

            } = req.body;

            let imagen = "";

            if (req.file) {

                imagen =
                "/uploads/capacitaciones/" +
                req.file.filename;

            }

            await db.query(

                `
                INSERT INTO cursos
                (

                    titulo,
                    descripcion,
                    imagen,
                    estado,
                    obligatorio,
                    fecha_limite,
                    creado_por,
                    tipo

                )

                VALUES
                (

                    ?,?,?,?,?,?,?,?

                )
                `,

                [

                    titulo,
                    descripcion,
                    imagen,
                    estado,
                    obligatorio,
                    fecha_limite,
                    req.session.usuarioID,
                    "EMPRESA"

                ]

            );

            res.json({

                success: true,
                mensaje: "Capacitación creada correctamente."

            });

        } catch (error) {

            console.error(error);

            res.status(500).json({

                success: false,
                mensaje: error.message

            });

        }

    }

);

router.get("/api/induccion-general", proteger, async (req, res) => {

    try {

        const [[resultado]] = await db.query(`

            SELECT

                COUNT(DISTINCT sc.id) AS modulos,

                COUNT(DISTINCT u.ID) AS empleados

            FROM sub_capitulos_induccion sc

            LEFT JOIN usuarios u
                ON 1 = 1

            WHERE sc.activo = 1

        `);

        res.json({

            success: true,

            induccion: {

                titulo: "Inducción General",

                estado: "ACTIVA",

                contenido: resultado.modulos,

                empleados: resultado.empleados

            }

        });

    } catch (error) {

        console.error(error);

        res.status(500).json({

            success: false

        });

    }

});

router.get(
    "/api/capitulos-induccion",
    proteger,
    async (req,res)=>{

        try{

            const [capitulos] =
            await db.query(`

                SELECT *
                FROM capitulos_induccion
                WHERE activo = 1
                ORDER BY orden ASC

            `);

            res.json({

                success:true,

                capitulos

            });

        }catch(error){

            console.error(error);

            res.json({

                success:false

            });

        }

    }
);

// ==========================================
// OBTENER UN CAPÍTULO
// ==========================================

router.get(
    "/api/capitulos-induccion/:id",
    proteger,
    async (req,res)=>{

        try{

            const {id}=req.params;

            const [[capitulo]] =
            await db.query(

                `
                SELECT *
                FROM capitulos_induccion
                WHERE id = ?
                `,

                [id]

            );

            res.json({

                success:true,

                capitulo

            });

        }catch(error){

            console.error(error);

            res.json({

                success:false

            });

        }

    }
);

// ==========================================
// ACTUALIZAR CAPÍTULO
// ==========================================

router.put(
    "/api/capitulos-induccion/:id",
    proteger,
    async (req,res)=>{

        try{

            const{id}=req.params;

            const{

                numeroCapitulo,
                titulo,
                descripcion,
                porcentaje,
                orden

            }=req.body;

            await db.query(

                `
                UPDATE capitulos_induccion

                SET

                    numero_capitulo=?,
                    titulo=?,
                    descripcion=?,
                    porcentaje_aprobacion=?,
                    orden=?

                WHERE id=?
                `,

                [

                    numeroCapitulo,
                    titulo,
                    descripcion,
                    porcentaje,
                    orden,
                    id

                ]

            );

            res.json({

                success:true

            });

        }catch(error){

            console.error(error);

            res.json({

                success:false

            });

        }

    }
);

// ==========================================
// ELIMINAR CAPÍTULO
// ==========================================

router.delete(
    "/api/capitulos-induccion/:id",
    proteger,
    async(req,res)=>{

        try{

            const {id}=req.params;

            await db.query(

                `
                UPDATE capitulos_induccion
                SET activo = 0
                WHERE id = ?
                `,

                [id]

            );

            res.json({

                success:true

            });

        }catch(error){

            console.error(error);

            res.json({

                success:false

            });

        }

    }
);
// ==========================================
// CREAR CAPÍTULO
// ==========================================

router.post(
    "/api/capitulos-induccion",
    proteger,
    async (req, res) => {

        try{

            const{

                numeroCapitulo,

                titulo,

                descripcion,

                porcentaje,

                orden

            } = req.body;

            const [resultado] = await db.query(

    `
    INSERT INTO capitulos_induccion
    (

        numero_capitulo,
        titulo,
        descripcion,
        porcentaje_aprobacion,
        orden,
        activo

    )

    VALUES
    (

        ?, ?, ?, ?, ?, 1

    )
    `,

    [

        numeroCapitulo,
        titulo,
        descripcion,
        porcentaje,
        orden

    ]

);

// ==========================================
// CREAR EVALUACIÓN AUTOMÁTICAMENTE
// ==========================================

await db.query(

    `
    INSERT INTO evaluaciones_induccion
    (

        capitulo_id,
        nombre,
        descripcion,
        porcentaje_aprobacion,
        estado

    )

    VALUES
    (

        ?, ?, ?, ?, 'ACTIVA'

    )
    `,

    [

        resultado.insertId,
        `Evaluación - ${titulo}`,
        `Evaluación correspondiente al capítulo ${titulo}`,
        porcentaje

    ]

);

            res.json({

                success:true

            });

        }catch(error){

            console.error(error);

            res.json({

                success:false

            });

        }

    }
);

// ==========================================
// ADMINISTRAR CAPACITACIONES
// ==========================================

router.get(
    "/api/administrar-capacitaciones",
    proteger,
    async (req, res) => {

        try {

            // ============================
            // INDUCCIÓN GENERAL
            // ============================

            const [[induccion]] =
            await db.query(`

                SELECT

    COUNT(DISTINCT sc.id) AS modulos,

    COUNT(DISTINCT u.ID) AS empleados,

    (
        SELECT COUNT(*)
        FROM certificados_usuario cu
        INNER JOIN usuarios us
            ON us.ID = cu.usuario_id
        INNER JOIN empleados e
            ON e.id = us.empleado_id
        WHERE e.activo = 1
    ) AS certificados

FROM sub_capitulos_induccion sc

CROSS JOIN usuarios u

INNER JOIN empleados e
    ON e.id = u.empleado_id

WHERE

    sc.activo = 1

    AND e.activo = 1
            `);

            // ============================
            // CURSOS
            // ============================

            const [cursos] =
            await db.query(`

                SELECT

                    c.id,

                    c.titulo,

                    c.estado,

                    COUNT(DISTINCT cc.id) contenido,

                    COUNT(DISTINCT ca.id) empleados

                FROM cursos c

                LEFT JOIN curso_contenido cc

                    ON cc.curso_id = c.id

                LEFT JOIN curso_asignados ca

                    ON ca.curso_id = c.id

                GROUP BY c.id

                ORDER BY c.fecha_creacion DESC

            `);

            // ============================
            // LISTA FINAL
            // ============================

            const capacitaciones = [

                {

                    id:0,

                    tipo:"SISTEMA",

                    titulo:"Inducción General",

                    estado:"ACTIVO",

                    contenido:
                    induccion.modulos,

                    empleados:
                    induccion.empleados,

                    certificados:
                    induccion.certificados

                },

                ...cursos.map(c=>({

                    id:c.id,

                    tipo:"CURSO",

                    titulo:c.titulo,

                    estado:c.estado,

                    contenido:c.contenido,

                    empleados:c.empleados

                }))

            ];

            // ============================
            // DASHBOARD
            // ============================

            res.json({

                success:true,

                dashboard:{

                    totalCapacitaciones:
                    capacitaciones.length,

                    totalAsignados:
                    capacitaciones.reduce(

                        (t,c)=>t+c.empleados,

                        0

                    ),

                    totalActivas:
                    capacitaciones.filter(

                        c=>c.estado==="ACTIVO"

                    ).length,

                    totalFinalizadas:
                    induccion.certificados

                },

                capacitaciones

            });

        } catch (error) {

            console.error(error);

            res.status(500).json({

                success:false

            });

        }

    }
);
// ==========================================
// LISTAR SUBCAPÍTULOS
// ==========================================

router.get(
    "/api/subcapitulos-induccion",
    proteger,
    async(req,res)=>{

        try{

            const [subcapitulos] =
            await db.query(`

                SELECT

                    s.*,

                    c.titulo AS capitulo

                FROM sub_capitulos_induccion s

                INNER JOIN capitulos_induccion c

                    ON c.id = s.capitulo_id

                WHERE

                    s.activo = 1

                ORDER BY

                    c.orden,

                    s.orden

            `);

            res.json({

                success:true,

                subcapitulos

            });

        }catch(error){

            console.error(error);

            res.json({

                success:false

            });

        }

    }
);

// ==========================================
// SUBCAPÍTULOS POR CAPÍTULO
// ==========================================

router.get(
    "/api/subcapitulos-induccion/capitulo/:id",
    proteger,
    async(req,res)=>{

        try{

            const { id } = req.params;

            const [subcapitulos] =
            await db.query(

                `
                SELECT
                    id,
                    numero_sub_capitulo,
                    titulo
                FROM sub_capitulos_induccion
                WHERE
                    capitulo_id = ?
                    AND activo = 1
                ORDER BY orden ASC
                `,

                [id]

            );

            res.json({

                success:true,

                subcapitulos

            });

        }catch(error){

            console.error(error);

            res.status(500).json({

                success:false

            });

        }

    }
);

// ==========================================
// OBTENER UN SUBCAPÍTULO
// ==========================================

router.get(
    "/api/subcapitulos-induccion/:id",
    proteger,
    async(req,res)=>{

        try{

            const {id}=req.params;

            const [[subcapitulo]] =
            await db.query(

                `
                SELECT *
                FROM sub_capitulos_induccion
                WHERE id = ?
                `,

                [id]

            );

            res.json({

                success:true,

                subcapitulo

            });

        }catch(error){

            console.error(error);

            res.json({

                success:false

            });

        }

    }
);

// ==========================================
// CREAR SUBCAPÍTULO
// ==========================================

router.post(
    "/api/subcapitulos-induccion",
    proteger,
    uploadVideo.single("archivoVideo"),
    async(req,res)=>{

        try{

            const{

                capitulo_id,
                numero_sub_capitulo,
                titulo,
                descripcion,
                tipo_video,
                duracion_minutos,
                orden,
                url_video

            } = req.body;

            let rutaVideo = "";

            if(
                tipo_video === "local"
                &&
                req.file
            ){

                rutaVideo =
                `/uploads/videos/induccion/${req.file.filename}`;

            }

            if(
                tipo_video === "youtube"
            ){

                rutaVideo =
                url_video;

            }

            await db.query(

                `
                INSERT INTO sub_capitulos_induccion
                (

                    capitulo_id,
                    numero_sub_capitulo,
                    titulo,
                    descripcion,
                    url_video,
                    tipo_video,
                    duracion_minutos,
                    orden,
                    activo

                )

                VALUES
                (

                    ?,?,?,?,?,?,?,?,1

                )
                `,

                [

                    capitulo_id,
                    numero_sub_capitulo,
                    titulo,
                    descripcion,
                    rutaVideo,
                    tipo_video,
                    duracion_minutos,
                    orden

                ]

            );

            res.json({

                success:true

            });

        }catch(error){

            console.error(error);

            res.status(500).json({

                success:false

            });

        }

    }
);

// ==========================================
// ACTUALIZAR SUBCAPÍTULO
// ==========================================

router.put(
    "/api/subcapitulos-induccion/:id",
    proteger,
    uploadVideo.single("archivoVideo"),
    async(req,res)=>{

        try{

            const { id } = req.params;

            const{

                capitulo_id,
                numero_sub_capitulo,
                titulo,
                descripcion,
                tipo_video,
                duracion_minutos,
                orden,
                url_video

            } = req.body;

            // ==========================================
// OBTENER VIDEO ACTUAL
// ==========================================

const [[videoActual]] =
await db.query(

    `
    SELECT url_video
    FROM sub_capitulos_induccion
    WHERE id = ?
    `,
    [id]

);

let rutaVideo =
videoActual.url_video;

// ==========================================
// VIDEO LOCAL
// ==========================================

if(tipo_video === "local"){

    if(req.file){

        rutaVideo =
        `/uploads/videos/induccion/${req.file.filename}`;

    }

}

// ==========================================
// YOUTUBE
// ==========================================

if(tipo_video === "youtube"){

    rutaVideo =
    url_video;

}

            await db.query(

                `
                UPDATE sub_capitulos_induccion

                SET

                    capitulo_id = ?,

                    numero_sub_capitulo = ?,

                    titulo = ?,

                    descripcion = ?,

                    url_video = ?,

                    tipo_video = ?,

                    duracion_minutos = ?,

                    orden = ?

                WHERE id = ?
                `,

                [

                    capitulo_id,

                    numero_sub_capitulo,

                    titulo,

                    descripcion,

                    rutaVideo,

                    tipo_video,

                    duracion_minutos,

                    orden,

                    id

                ]

            );

            res.json({

                success:true

            });

        }catch(error){

            console.error(error);

            res.status(500).json({

                success:false

            });

        }

    }
);

// ==========================================
// ELIMINAR SUBCAPÍTULO
// ==========================================

router.delete(
    "/api/subcapitulos-induccion/:id",
    proteger,
    async(req,res)=>{

        try{

            const { id } = req.params;

            await db.query(

                `
                UPDATE sub_capitulos_induccion
                SET activo = 0
                WHERE id = ?
                `,

                [id]

            );

            res.json({

                success:true

            });

        }catch(error){

            console.error(error);

            res.status(500).json({

                success:false

            });

        }

    }
);

// ==========================================
// OBTENER MATERIAL POR ID
// ==========================================

router.get(
    "/api/material-apoyo/:id",
    proteger,
    async (req, res) => {

        try {

            const [rows] = await db.query(

                `
                SELECT *
                FROM material_apoyo
                WHERE id = ?
                LIMIT 1
                `,

                [req.params.id]

            );

            if (rows.length === 0) {

                return res.json({

                    success: false

                });

            }

            res.json({

                success: true,
                material: rows[0]

            });

        } catch (error) {

            console.error(error);

            res.status(500).json({

                success: false

            });

        }

    }

);


// ==========================================
// ACTUALIZAR MATERIAL DE APOYO
// ==========================================

router.put(
    "/api/material-apoyo/:id",
    proteger,
    uploadMaterialApoyo.single("archivoMaterial"),
    async (req, res) => {

        try {

            const {

                titulo,
                descripcion,
                tipoAsignacion,
                capitulo_id,
                sub_capitulo_id,
                orden,
                obligatorio

            } = req.body;

            const id = req.params.id;

            // Obtener el material actual
            const [rows] = await db.query(

                `
                SELECT *
                FROM material_apoyo
                WHERE id = ?
                `,

                [id]

            );

            if (rows.length === 0) {

                return res.json({

                    success: false,
                    mensaje: "El material no existe."

                });

            }

            const material = rows[0];

            let nombreArchivo = material.nombre_archivo;
            let rutaArchivo = material.ruta_archivo;
            let tipoArchivo = material.tipo_archivo;
            let tamano = material.tamano;

            // Si el usuario subió un archivo nuevo
            if (req.file) {

                nombreArchivo = req.file.originalname;

                rutaArchivo =
                    `/uploads/material-apoyo/${req.file.filename}`;

                tipoArchivo =
                    req.file.originalname
                        .split(".")
                        .pop()
                        .toLowerCase();

                tamano = req.file.size;

            }

            await db.query(

                `
                UPDATE material_apoyo
                SET

                    titulo=?,
                    descripcion=?,
                    tipo_asignacion=?,
                    capitulo_id=?,
                    sub_capitulo_id=?,
                    nombre_archivo=?,
                    ruta_archivo=?,
                    tipo_archivo=?,
                    tamano=?,
                    orden=?,
                    obligatorio=?

                WHERE id=?
                `,

                [

                    titulo,
                    descripcion,
                    tipoAsignacion,
                    capitulo_id || null,
                    sub_capitulo_id || null,
                    nombreArchivo,
                    rutaArchivo,
                    tipoArchivo,
                    tamano,
                    orden,
                    obligatorio,
                    id

                ]

            );

            res.json({

                success: true,
                mensaje: "Material actualizado correctamente."

            });

        } catch (error) {

            console.error(error);

            res.status(500).json({

                success: false,
                mensaje: "Error al actualizar el material."

            });

        }

    }

);

// ==========================================
// CREAR MATERIAL DE APOYO
// ==========================================

router.post(
    "/api/material-apoyo",
    proteger,
    uploadMaterialApoyo.single("archivoMaterial"),
    async(req,res)=>{

        try{

            const{

                titulo,
                descripcion,
                tipoAsignacion,
                capitulo_id,
                sub_capitulo_id,
                orden,
                obligatorio

            } = req.body;

            let rutaArchivo = "";
            let nombreArchivo = "";
            let tipoArchivo = "";
            let tamano = 0;

            if(req.file){

                rutaArchivo =
                `/uploads/material-apoyo/${req.file.filename}`;

                nombreArchivo =
                req.file.originalname;

                tipoArchivo =
path.extname(req.file.originalname)
    .replace(".", "")
    .toLowerCase();

                tamano =
                req.file.size;

            }

            await db.query(

                `
                INSERT INTO material_apoyo
                (

                    titulo,
                    descripcion,
                    tipo_asignacion,
                    capitulo_id,
                    sub_capitulo_id,
                    nombre_archivo,
                    ruta_archivo,
                    tipo_archivo,
                    tamano,
                    orden,
                    obligatorio,
                    activo,
                    usuario_creador

                )

                VALUES
                (

                    ?,?,?,?,?,?,?,?,?,?,?,1,?

                )
                `,

                [

                    titulo,
                    descripcion,
                    tipoAsignacion,
                    capitulo_id || null,
                    sub_capitulo_id || null,
                    nombreArchivo,
                    rutaArchivo,
                    tipoArchivo,
                    tamano,
                    orden,
                    obligatorio,
                    req.session.usuarioID

                ]

            );

            res.json({

                success:true,

                mensaje:"Material registrado correctamente."

            });

        }catch(error){

            console.error(error);

            res.status(500).json({

                success:false,

                mensaje:"Error al registrar el material."

            });

        }

    }
);


// ==========================================
// LISTAR MATERIAL DE APOYO
// ==========================================

router.get(
    "/api/material-apoyo",
    proteger,
    async (req, res) => {

        try {

            const [materiales] = await db.query(`
                SELECT
                    m.*,
                    c.titulo AS capitulo,
                    s.titulo AS subcapitulo
                FROM material_apoyo m
                LEFT JOIN capitulos_induccion c
                    ON c.id = m.capitulo_id
                LEFT JOIN sub_capitulos_induccion s
                    ON s.id = m.sub_capitulo_id
                WHERE m.activo = 1
                ORDER BY c.numero_capitulo, m.orden
            `);

            res.json({
                success: true,
                materiales
            });

        } catch (error) {

            console.error(error);

            res.status(500).json({
                success: false,
                mensaje: "Error al cargar materiales."
            });

        }

    }
);

// ==========================================
// INFORMACIÓN DEL CURSO
// ==========================================

router.get(
    "/api/curso/:id",
    proteger,
    async (req, res) => {

        try {

            const { id } = req.params;

            const [[curso]] =
            await db.query(

                `
                SELECT *
                FROM cursos
                WHERE id = ?
                `,

                [id]

            );

            if (!curso) {

                return res.json({

                    success: false

                });

            }

            res.json({

                success: true,

                curso

            });

        } catch (error) {

            console.error(error);

            res.status(500).json({

                success: false

            });

        }

    }

);

// ==========================================
// OBTENER CURSO
// ==========================================

router.get(
    "/api/curso/:id",
    proteger,
    async(req,res)=>{

        try{

            const [curso] =
            await db.query(

                `
                SELECT *
                FROM cursos
                WHERE id=?
                LIMIT 1
                `,

                [

                    req.params.id

                ]

            );

            if(curso.length===0){

                return res.json({

                    success:false

                });

            }

            res.json({

                success:true,

                curso:curso[0]

            });

        }catch(error){

            console.error(error);

            res.status(500).json({

                success:false

            });

        }

    }
);

// ==========================================
// LISTAR CAPÍTULOS DEL CURSO
// ==========================================

router.get(
    "/api/cursos/:cursoId/capitulos",
    proteger,
    async (req, res) => {

        try {

            const [capitulos] = await db.query(

                `
                SELECT *
                FROM capitulos_curso
                WHERE curso_id = ?
                ORDER BY orden, numero_capitulo
                `,

                [

                    req.params.cursoId

                ]

            );

            res.json({

                success: true,

                capitulos

            });

        } catch (error) {

            console.error(error);

            res.status(500).json({

                success: false

            });

        }

    }

);

// ==========================================
// CREAR CAPÍTULO DEL CURSO
// ==========================================

router.post(
    "/api/cursos/:cursoId/capitulos",
    proteger,
    async(req,res)=>{

        try{

            const{

                numero,
                titulo,
                descripcion,
                orden,
                porcentaje

            } = req.body;

            await db.query(

                `
                INSERT INTO capitulos_curso
                (

                    curso_id,
                    numero_capitulo,
                    titulo,
                    descripcion,
                    orden,
                    porcentaje_aprobacion

                )

                VALUES
                (?,?,?,?,?,?)

                `,

                [

                    req.params.cursoId,
                    numero,
                    titulo,
                    descripcion,
                    orden,
                    porcentaje

                ]

            );

            res.json({

                success:true

            });

        }catch(error){

            console.error(error);

            res.status(500).json({

                success:false

            });

        }

    }
);

// ==========================================
// ACTUALIZAR CAPÍTULO
// ==========================================

router.put(

    "/api/cursos/:cursoId/capitulos/:id",

    proteger,

    async(req,res)=>{

        try{

            const {

                numero,
                titulo,
                descripcion,
                orden,
                porcentaje

            } = req.body;

            await db.query(

                `

                UPDATE capitulos_curso

                SET

                    numero_capitulo = ?,
                    titulo = ?,
                    descripcion = ?,
                    orden = ?,
                    porcentaje_aprobacion = ?

                WHERE id = ?
                AND curso_id = ?

                `,

                [

                    numero,
                    titulo,
                    descripcion,
                    orden,
                    porcentaje,
                    req.params.id,
                    req.params.cursoId

                ]

            );

            res.json({

                success:true

            });

        }catch(error){

            console.error(error);

            res.status(500).json({

                success:false,

                mensaje:"Error al actualizar el capítulo."

            });

        }

    }

);

// ==========================================
// LISTAR SUBCAPÍTULOS
// ==========================================

router.get(
    "/api/capitulos/:id/subcapitulos",
    proteger,
    async(req,res)=>{

        try{

            const [subcapitulos] =
            await db.query(

                `
                SELECT *
                FROM sub_capitulos_curso
                WHERE capitulo_id = ?
                ORDER BY orden,
                numero_subcapitulo
                `,

                [

                    req.params.id

                ]

            );

            res.json({

                success:true,

                subcapitulos

            });

        }catch(error){

            console.error(error);

            res.status(500).json({

                success:false

            });

        }

    }
);

// ==========================================
// LISTAR TODOS LOS SUBCAPÍTULOS DEL CURSO
// ==========================================

router.get(
    "/api/cursos/:cursoId/subcapitulos",
    proteger,
    async(req,res)=>{

        try{

            const [subcapitulos] =
            await db.query(

                `
                SELECT

                    sc.*,

                    c.numero_capitulo,

                    c.titulo AS capitulo

                FROM sub_capitulos_curso sc

                INNER JOIN capitulos_curso c

                    ON c.id = sc.capitulo_id

                WHERE c.curso_id = ?

                ORDER BY

                    c.numero_capitulo,

                    sc.numero_subcapitulo

                `,

                [

                    req.params.cursoId

                ]

            );

            res.json({

                success:true,

                subcapitulos

            });

        }catch(error){

            console.error(error);

            res.status(500).json({

                success:false

            });

        }

    }
);
// ==========================================
// OBTENER CAPÍTULO
// ==========================================

router.get(
    "/api/capitulos/:id",
    proteger,
    async(req,res)=>{

        try{

            const [capitulo]=
            await db.query(

                `
                SELECT *
                FROM capitulos_curso
                WHERE id=?
                `,

                [

                    req.params.id

                ]

            );

            if(capitulo.length===0){

                return res.json({

                    success:false

                });

            }

            res.json({

                success:true,

                capitulo:capitulo[0]

            });

        }catch(error){

            console.error(error);

            res.status(500).json({

                success:false

            });

        }

    }
);

// ==========================================
// CREAR SUBCAPÍTULO DEL CURSO
// ==========================================

router.post(

    "/api/cursos/:cursoId/subcapitulos",

    proteger,

    uploadVideo.single("archivoVideo"),

    async(req,res)=>{

        try{

            const{

    capitulo_id,
    numero,
    titulo,
    descripcion,
    duracion,
    orden,
    tipo_video,
    url_youtube

} = req.body;

let rutaVideo = "";

// ==========================================
// VIDEO LOCAL
// ==========================================

if(
    tipo_video === "local"
    &&
    req.file
){

    rutaVideo =
    `/uploads/videos/induccion/${req.file.filename}`;

}

// ==========================================
// VIDEO YOUTUBE
// ==========================================

if(
    tipo_video === "youtube"
){

    rutaVideo =
    url_youtube;

}

await db.query(

    `

    INSERT INTO sub_capitulos_curso
    (

        capitulo_id,
        numero_subcapitulo,
        titulo,
        descripcion,
        url_video,
        tipo_video,
        duracion_minutos,
        orden,
        activo

    )

    VALUES
    (

        ?,?,?,?,?,?,?,?,1

    )

    `,

    [

        capitulo_id,
        numero,
        titulo,
        descripcion,
        rutaVideo,
        tipo_video,
        duracion,
        orden

    ]

);

res.json({

    success:true,

    mensaje:"Subcapítulo creado correctamente."

});

        }catch(error){

            console.error(error);

            res.status(500).json({

                success:false

            });

        }

    }

);

// ==========================================
// OBTENER SUBCAPÍTULO
// ==========================================

router.get(

    "/api/subcapitulos/:id",

    proteger,

    async(req,res)=>{

        try{

            const [sub] = await db.query(

                `

                SELECT *

                FROM sub_capitulos_curso

                WHERE id = ?

                LIMIT 1

                `,

                [

                    req.params.id

                ]

            );

            if(sub.length===0){

                return res.json({

                    success:false

                });

            }

            res.json({

                success:true,

                subcapitulo:sub[0]

            });

        }catch(error){

            console.error(error);

            res.status(500).json({

                success:false

            });

        }

    }

);

// ==========================================
// OBTENER VIDEO DEL SUBCAPÍTULO
// ==========================================

router.get(
    "/api/subcapitulos/:id/video",
    proteger,
    async (req,res)=>{

        try{

            const [[video]] =
            await db.query(

                `
                SELECT

                    id,
                    tipo_video,
                    url_video

                FROM sub_capitulos_curso

                WHERE id = ?

                `,

                [
                    req.params.id
                ]

            );

            if(!video){

                return res.json({

                    success:false

                });

            }

            res.json({

                success:true,

                video

            });

        }catch(error){

            console.error(error);

            res.status(500).json({

                success:false

            });

        }

    }

);

// ==========================================
// ACTUALIZAR VIDEO DEL SUBCAPÍTULO
// ==========================================

router.put(

    "/api/subcapitulos/:id/video",

    proteger,

    uploadVideo.single("video"),

    async(req,res)=>{

        try{

            const{

                tipo_video,
                url_youtube

            } = req.body;

            const [[sub]] =
            await db.query(

                `

                SELECT

                    id,
                    url_video,
                    tipo_video

                FROM sub_capitulos_curso

                WHERE id=?

                `,

                [

                    req.params.id

                ]

            );

            if(!sub){

                return res.json({

                    success:false,

                    mensaje:"Subcapítulo no encontrado."

                });

            }

            let rutaVideo =
            sub.url_video;

            // ==========================
            // VIDEO LOCAL
            // ==========================

            if(tipo_video==="local"){

                if(req.file){

                    rutaVideo =
                    `/uploads/videos/induccion/${req.file.filename}`;

                }

            }

            // ==========================
            // YOUTUBE
            // ==========================

            if(tipo_video==="youtube"){

                rutaVideo =
                url_youtube;

            }

            await db.query(

                `

                UPDATE
                sub_capitulos_curso

                SET

                    tipo_video=?,
                    url_video=?

                WHERE id=?

                `,

                [

                    tipo_video,
                    rutaVideo,
                    req.params.id

                ]

            );

            res.json({

                success:true

            });

        }catch(error){

            console.error(error);

            res.status(500).json({

                success:false,

                mensaje:error.message

            });

        }

    }

);

// ==========================================
// ACTUALIZAR SUBCAPÍTULO
// ==========================================

router.put(

    "/api/subcapitulos/:id",

    proteger,

    uploadVideo.single("video"),

    async(req,res)=>{

        try{

            const{

                capitulo_id,
                numero,
                titulo,
                descripcion,
                duracion,
                orden,
                tipo_video,
                url_youtube

            } = req.body;

            // Obtener información actual
            const [actual] =
            await db.query(

                `

                SELECT *

                FROM sub_capitulos_curso

                WHERE id = ?

                LIMIT 1

                `,

                [

                    req.params.id

                ]

            );

            if(actual.length===0){

                return res.json({

                    success:false,

                    mensaje:"Subcapítulo no encontrado."

                });

            }

            let rutaVideo =
            actual[0].url_video;

            // ==========================
            // VIDEO LOCAL
            // ==========================

            if(
                tipo_video==="local"
            ){

                if(req.file){

                    rutaVideo =
                    `/uploads/videos/induccion/${req.file.filename}`;

                }

            }

            // ==========================
            // YOUTUBE
            // ==========================

            if(
                tipo_video==="youtube"
            ){

                rutaVideo =
                url_youtube;

            }

            await db.query(

                `

                UPDATE
                sub_capitulos_curso

                SET

                    capitulo_id=?,
                    numero_subcapitulo=?,
                    titulo=?,
                    descripcion=?,
                    duracion_minutos=?,
                    tipo_video=?,
                    url_video=?,
                    orden=?

                WHERE id=?

                `,

                [

                    capitulo_id,
                    numero,
                    titulo,
                    descripcion,
                    duracion,
                    tipo_video,
                    rutaVideo,
                    orden,
                    req.params.id

                ]

            );

            res.json({

                success:true

            });

        }catch(error){

            console.error(error);

            res.status(500).json({

                success:false,

                mensaje:error.message

            });

        }

    }

);


// ==========================================================
// MARCAR VIDEO / SUBCAPÍTULO COMO VISTO
// ==========================================================

router.post(
    "/api/cursos/:cursoId/progreso-video",
    proteger,
    async (req, res) => {

        try {

            const cursoId =
                Number(req.params.cursoId);

            const usuarioId =
                req.session.usuarioID;

            const {
                sub_capitulo_id
            } = req.body;


            // ======================================================
            // VALIDAR SUBCAPÍTULO
            // ======================================================

            if (!sub_capitulo_id) {

                return res.status(400).json({

                    success: false,

                    mensaje:
                        "No se recibió el subcapítulo."

                });

            }


            // ======================================================
            // VERIFICAR QUE EL SUBCAPÍTULO PERTENEZCA
            // A LA CAPACITACIÓN
            // ======================================================

            const [subcapitulos] =
                await db.query(

                    `
                    SELECT sc.id

                    FROM sub_capitulos_curso sc

                    INNER JOIN capitulos_curso c
                        ON c.id = sc.capitulo_id

                    WHERE sc.id = ?
                    AND c.curso_id = ?

                    LIMIT 1
                    `,

                    [
                        sub_capitulo_id,
                        cursoId
                    ]

                );


            if (
                subcapitulos.length === 0
            ) {

                return res.status(404).json({

                    success: false,

                    mensaje:
                        "El subcapítulo no pertenece a esta capacitación."

                });

            }


            // ======================================================
            // VERIFICAR SI YA EXISTE EL REGISTRO
            // ======================================================

            const [existente] =
                await db.query(

                    `
                    SELECT id
                    FROM progreso_videos

                    WHERE usuario_id = ?
                    AND sub_capitulo_id = ?

                    LIMIT 1
                    `,

                    [
                        usuarioId,
                        sub_capitulo_id
                    ]

                );


            // ======================================================
            // SI YA EXISTE → ACTUALIZAR
            // ======================================================

            if (
                existente.length > 0
            ) {

                await db.query(

                    `
                    UPDATE progreso_videos

                    SET
                        visto = 1,
                        fecha_visto = NOW()

                    WHERE id = ?
                    `,

                    [
                        existente[0].id
                    ]

                );

            }

            // ======================================================
            // SI NO EXISTE → INSERTAR
            // ======================================================

            else {

                await db.query(

                    `
                    INSERT INTO progreso_videos
                    (
                        usuario_id,
                        sub_capitulo_id,
                        visto,
                        fecha_visto
                    )

                    VALUES
                    (
                        ?, ?, 1, NOW()
                    )
                    `,

                    [
                        usuarioId,
                        sub_capitulo_id
                    ]

                );

            }


            res.json({

                success: true,

                mensaje:
                    "Video marcado como visto."

            });


        }
        catch (error) {

            console.error(
                "ERROR GUARDANDO PROGRESO DEL VIDEO:",
                error
            );


            res.status(500).json({

                success: false,

                mensaje:
                    "Error guardando el progreso del video."

            });

        }

    }
);


// ==========================================================
// OBTENER VIDEOS VISTOS
// ==========================================================

router.get(
    "/api/cursos/:cursoId/progreso-videos",
    proteger,
    async (req, res) => {

        try {

            const cursoId =
                Number(req.params.cursoId);

            const usuarioId =
                req.session.usuarioID;


            const [videos] =
                await db.query(

                    `
                    SELECT
                        pv.id,
                        pv.sub_capitulo_id,
                        pv.visto,
                        pv.fecha_visto

                    FROM progreso_videos pv

                    INNER JOIN sub_capitulos_curso sc
                        ON sc.id = pv.sub_capitulo_id

                    INNER JOIN capitulos_curso c
                        ON c.id = sc.capitulo_id

                    WHERE pv.usuario_id = ?
                    AND c.curso_id = ?
                    AND pv.visto = 1

                    ORDER BY
                        pv.sub_capitulo_id ASC
                    `,

                    [
                        usuarioId,
                        cursoId
                    ]

                );


            res.json({

                success: true,

                videos

            });


        }
        catch (error) {

            console.error(
                "ERROR OBTENIENDO VIDEOS VISTOS:",
                error
            );


            res.status(500).json({

                success: false,

                mensaje:
                    "Error obteniendo el progreso de los videos."

            });

        }

    }
);

// ==========================================================
// OBTENER PROGRESO DE CAPACITACIÓN
// ==========================================================

router.get(
    "/api/cursos/:cursoId/progreso",
    proteger,
    async (req, res) => {

        try {

            const cursoId =
                Number(req.params.cursoId);

            const usuarioId =
                req.session.usuarioID;


            // ======================================================
            // BUSCAR EMPLEADO DEL USUARIO
            // ======================================================

            const [usuarios] =
                await db.query(
                    `
                    SELECT empleado_id
                    FROM usuarios
                    WHERE id = ?
                    LIMIT 1
                    `,
                    [usuarioId]
                );


            if (usuarios.length === 0) {

                return res.status(404).json({
                    success: false,
                    mensaje: "No se encontró el usuario."
                });

            }


            const empleadoId =
                usuarios[0].empleado_id;


            // ======================================================
            // BUSCAR ASIGNACIÓN
            // ======================================================

            const [asignaciones] =
                await db.query(
                    `
                    SELECT id
                    FROM asignaciones_capacitaciones
                    WHERE capacitacion_id = ?
                    AND empleado_id = ?
                    LIMIT 1
                    `,
                    [
                        cursoId,
                        empleadoId
                    ]
                );


            if (asignaciones.length === 0) {

                return res.json({
                    success: true,
                    progreso: null
                });

            }


            const asignacionId =
                asignaciones[0].id;


            // ======================================================
            // OBTENER PROGRESO
            // ======================================================

            const [progreso] =
                await db.query(
                    `
                    SELECT
                        porcentaje,
                        capitulos_completados,
                        total_capitulos,
                        ultimo_capitulo,
                        fecha_inicio,
                        ultima_actividad
                    FROM progreso_capacitaciones
                    WHERE asignacion_id = ?
                    LIMIT 1
                    `,
                    [asignacionId]
                );


            // ======================================================
            // RESPUESTA
            // ======================================================

            if (progreso.length === 0) {

                return res.json({
                    success: true,
                    progreso: null
                });

            }


            res.json({

                success: true,

                progreso: progreso[0]

            });


        } catch (error) {

            console.error(
                "ERROR OBTENIENDO PROGRESO:",
                error
            );

            res.status(500).json({

                success: false,

                mensaje: error.message

            });

        }

    }
);



// ==========================================================
// GUARDAR PROGRESO DE CAPACITACIÓN
// ==========================================================

router.post(
    "/api/cursos/:cursoId/progreso",
    proteger,
    async (req, res) => {

        try {

            const cursoId =
                Number(req.params.cursoId);

            const usuarioId =
                req.session.usuarioID;

            const {
                capitulos_completados,
                ultimo_capitulo
            } = req.body;


            // ======================================================
            // BUSCAR EMPLEADO DEL USUARIO
            // ======================================================

            const [usuarios] =
                await db.query(

                    `
                    SELECT empleado_id
                    FROM usuarios
                    WHERE id = ?
                    LIMIT 1
                    `,

                    [usuarioId]

                );


            if (
                usuarios.length === 0
            ) {

                return res.status(404).json({

                    success: false,

                    mensaje:
                        "No se encontró el usuario."

                });

            }


            const empleadoId =
                usuarios[0].empleado_id;


            // ======================================================
            // BUSCAR ASIGNACIÓN
            // ======================================================

            const [asignaciones] =
                await db.query(

                    `
                    SELECT id
                    FROM asignaciones_capacitaciones

                    WHERE capacitacion_id = ?
                    AND empleado_id = ?

                    LIMIT 1
                    `,

                    [
                        cursoId,
                        empleadoId
                    ]

                );


            if (
                asignaciones.length === 0
            ) {

                return res.status(404).json({

                    success: false,

                    mensaje:
                        "No se encontró la asignación."

                });

            }


            const asignacionId =
                asignaciones[0].id;


            // ======================================================
            // TOTAL DE CAPÍTULOS
            // ======================================================

            const [[total]] =
                await db.query(

                    `
                    SELECT COUNT(*) AS total
                    FROM capitulos_curso
                    WHERE curso_id = ?
                    `,

                    [cursoId]

                );


            const totalCapitulos =
                Number(total.total || 0);


            const capitulosCompletados =
                Number(
                    capitulos_completados || 0
                );


            // ======================================================
            // CALCULAR PORCENTAJE
            // ======================================================

            const porcentaje =
                totalCapitulos > 0
                    ? Math.round(
                        (
                            capitulosCompletados /
                            totalCapitulos
                        ) * 100
                    )
                    : 0;


            // ======================================================
            // VERIFICAR SI YA EXISTE PROGRESO
            // ======================================================

            const [progresoExistente] =
                await db.query(

                    `
                    SELECT id
                    FROM progreso_capacitaciones

                    WHERE asignacion_id = ?

                    LIMIT 1
                    `,

                    [asignacionId]

                );


            // ======================================================
            // INSERTAR
            // ======================================================

            if (
                progresoExistente.length === 0
            ) {

                await db.query(

                    `
                    INSERT INTO progreso_capacitaciones
                    (
                        asignacion_id,
                        porcentaje,
                        capitulos_completados,
                        total_capitulos,
                        ultimo_capitulo,
                        fecha_inicio,
                        ultima_actividad
                    )

                    VALUES
                    (
                        ?, ?, ?, ?, ?, NOW(), NOW()
                    )
                    `,

                    [
                        asignacionId,
                        porcentaje,
                        capitulosCompletados,
                        totalCapitulos,
                        ultimo_capitulo || null
                    ]

                );

            }

            // ======================================================
            // ACTUALIZAR
            // ======================================================

            else {

                await db.query(

                    `
                    UPDATE progreso_capacitaciones

                    SET
                        porcentaje = ?,
                        capitulos_completados = ?,
                        total_capitulos = ?,
                        ultimo_capitulo = ?,
                        ultima_actividad = NOW()

                    WHERE asignacion_id = ?
                    `,

                    [
                        porcentaje,
                        capitulosCompletados,
                        totalCapitulos,
                        ultimo_capitulo || null,
                        asignacionId
                    ]

                );

            }


            // ======================================================
            // ACTUALIZAR ESTADO DE LA ASIGNACIÓN
            // ======================================================

            if (
                capitulosCompletados >=
                totalCapitulos
            ) {

                await db.query(

                    `
                    UPDATE asignaciones_capacitaciones

                    SET estado = 'FINALIZADA'

                    WHERE id = ?
                    `,

                    [asignacionId]

                );

            }

            else {

                await db.query(

                    `
                    UPDATE asignaciones_capacitaciones

                    SET estado = 'EN_PROCESO'

                    WHERE id = ?
                    `,

                    [asignacionId]

                );

            }


            res.json({

                success: true,

                porcentaje,

                capitulos_completados:
                    capitulosCompletados,

                total_capitulos:
                    totalCapitulos

            });


        } catch (error) {

            console.error(
                "ERROR GUARDANDO PROGRESO:",
                error
            );

            res.status(500).json({

                success: false,

                mensaje: error.message

            });

        }

    }
);

module.exports = router;