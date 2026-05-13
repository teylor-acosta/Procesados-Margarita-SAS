const express = require('express');
const router = express.Router();
const path = require('path');
const multer = require('multer');
const fs = require('fs');

const db = require('../DB');


/* =========================================
   📄 VISTA
========================================= */

router.get('/documentacion-empleados', (req, res) => {

    res.sendFile(
        path.join(
            __dirname,
            '../public/documentacion-empleados.html'
        )
    );

});


/* =========================================
   🔥 API EMPLEADOS DOCUMENTACION
========================================= */

router.get('/api/documentacion-empleados', (req, res) => {

    const sql = `
    
        SELECT 
            e.id,
            e.codigo,
            e.nombre,
            e.numero_documento,
            e.tipo_documento,
            e.rh,
            e.fecha_nacimiento,
            e.lugar_nacimiento,
            e.estado_civil,
            e.direccion,
            e.barrio_localidad,
            e.telefono,
            e.email,
            e.foto,
            e.activo,

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

        WHERE e.activo = 'SI'

        ORDER BY e.nombre ASC
    
    `;

    db.query(sql, (error, resultados) => {

        if (error) {

            console.log(error);

            return res.status(500).json({
                ok:false,
                mensaje:'Error servidor'
            });

        }

        const empleados = resultados.map(emp => {

            let progreso = Math.floor(Math.random() * 100);

            let estadoDocumental = 'Pendiente';
            let colorEstado = 'warning';

            if (progreso >= 100) {

                estadoDocumental = 'Completo';
                colorEstado = 'success';

            }

            if (progreso <= 40) {

                estadoDocumental = 'Incompleto';
                colorEstado = 'danger';

            }

            return {

                ...emp,

                progreso,
                estadoDocumental,
                colorEstado

            };

        });

        res.json({

            ok:true,
            empleados

        });

    });

});


/* =========================================
   📂 CONFIGURAR MULTER
========================================= */

const storage = multer.diskStorage({

    destination: (req, file, cb) => {

        try {

            const empleado_id =
                req.body.empleado_id;

            db.query(

                `

                SELECT
                    codigo,
                    nombre

                FROM empleados

                WHERE id = ?

                `,

                [empleado_id],

                (error, results) => {

                    if (error) {

                        console.log(error);

                        return cb(
                            new Error(
                                'Error SQL'
                            )
                        );

                    }

                    if (results.length === 0) {

                        return cb(
                            new Error(
                                'Empleado no encontrado'
                            )
                        );

                    }

                    const empleado = results[0];

                    const nombreLimpio =

                        empleado.nombre
                        .replace(/\s+/g, '-')
                        .toUpperCase();

                    const carpetaEmpleado =

                        path.join(

                            __dirname,
                            '../public/archivos-empleados',
                            `${empleado.codigo}-${nombreLimpio}`

                        );

                    /* =====================================
                       🔥 CREAR CARPETA
                    ===================================== */

                    if (!fs.existsSync(carpetaEmpleado)) {

                        fs.mkdirSync(
                            carpetaEmpleado,
                            { recursive:true }
                        );

                    }

                    cb(null, carpetaEmpleado);

                }

            );

        } catch (error) {

            console.log(error);

        }

    },

    filename: (req, file, cb) => {

        const nombreArchivo =

            Date.now() +
            '-' +
            file.originalname
            .replace(/\s+/g, '-');

        cb(null, nombreArchivo);

    }

});

const upload = multer({ storage });


/* =========================================
   📤 SUBIR DOCUMENTO
========================================= */

router.post(

    '/api/subir-documento',

    upload.single('archivo'),

    (req, res) => {

        const {

            empleado_id,
            categoria,
            tipo_documento

        } = req.body;

        if (!req.file) {

            return res.json({

                ok:false,
                mensaje:'Archivo requerido'

            });

        }

        const extension =
            req.file.originalname
            .split('.')
            .pop();

const rutaArchivo = req.file.path;

        const sql = `

            INSERT INTO documentos_empleado (

                empleado_id,
                categoria,
                tipo_documento,
                nombre_archivo,
                ruta_archivo,
                extension,
                estado

            )

            VALUES (?, ?, ?, ?, ?, ?, 'PENDIENTE')

        `;

        db.query(

            sql,

            [

                empleado_id,
                categoria || tipo_documento,
                tipo_documento,
                req.file.originalname,
                rutaArchivo,
                extension

            ],

            (error) => {

                if (error) {

                    console.log(error);

                    return res.json({

                        ok:false,
                        mensaje:'Error servidor'

                    });

                }

                /* =====================================
                   🔥 CENTRO ACTIVIDAD
                ===================================== */

                db.query(

                    `

                    INSERT INTO centro_actividad (

                        empleado_id,
                        usuario_id,
                        accion,
                        modulo,
                        descripcion,
                        color,
                        icono

                    )

                    VALUES (?, ?, ?, ?, ?, ?, ?)

                    `,

                    [

                        empleado_id,

                        req.session.usuario?.id || null,

                        'DOCUMENTO',

                        'DOCUMENTACION',

                        `Se subió el documento ${tipo_documento}`,

                        'morado',

                        'fa-file-upload'

                    ]

                );

                res.json({

                    ok:true,
                    mensaje:'Documento subido correctamente'

                });

            }

        );

    }

);


/* =========================================
   📄 OBTENER DOCUMENTOS EMPLEADO
========================================= */

router.get(

    '/api/documentos/:empleado_id',

    (req, res) => {

        const { empleado_id } = req.params;

        const sql = `

            SELECT *

            FROM documentos_empleado

            WHERE empleado_id = ?

            ORDER BY fecha_subida DESC

        `;

        db.query(

            sql,

            [empleado_id],

            (error, results) => {

                if (error) {

                    console.log(error);

                    return res.json({
                        ok:false
                    });

                }

                res.json({

                    ok:true,
                    documentos: results

                });

            }

        );

    }

);


/* =========================================
   👁️ VER DOCUMENTO
========================================= */

router.get(

    '/api/ver-documento/:id',

    (req, res) => {

        const { id } = req.params;

        db.query(

            `

            SELECT *

            FROM documentos_empleado

            WHERE id = ?

            
            `,

            [id],

            (error, results) => {

                if (error || results.length === 0) {

                    return res.send(
                        'Documento no encontrado'
                    );

                }

                const documento = results[0];

                const rutaCompleta = documento.ruta_archivo;

                res.sendFile(rutaCompleta);

            }

        );

    }

);


/* =========================================
   🗑️ ELIMINAR DOCUMENTO
========================================= */

router.delete(

    '/api/documento/:id',

    (req, res) => {

        const { id } = req.params;

        db.query(

            `

            SELECT *

            FROM documentos_empleado

            WHERE id = ?

            
            `,

            [id],

            (error, results) => {

                if (error || results.length === 0) {

                    return res.json({
                        ok:false
                    });

                }

                const documento = results[0];

                const rutaCompleta = path.join(

                    __dirname,
                    '../public',
                    documento.ruta_archivo

                );

                if (fs.existsSync(rutaCompleta)) {

                    fs.unlinkSync(rutaCompleta);

                }

                db.query(

                    `

                    DELETE FROM documentos_empleado

                    WHERE id = ?

                    
                    `,

                    [id],

                    () => {

                        res.json({

                            ok:true

                        });

                    }

                );

            }

        );

    }

);


module.exports = router;