const express = require('express');
const router = express.Router();

const path = require('path');
const fs = require('fs');

const multer = require('multer');

const db = require('../DB');


// ============================================
// 🔥 CONFIG MULTER
// ============================================

const storage = multer.diskStorage({

    destination: async (req, file, cb) => {

        const empleadoId = req.params.id;

        const ruta = path.join(
            __dirname,
            '../public/uploads/documentos',
            empleadoId.toString()
        );

        if (!fs.existsSync(ruta)) {

            fs.mkdirSync(ruta, {
                recursive: true
            });

        }

        cb(null, ruta);

    },

    filename: (req, file, cb) => {

        const nombre =
            Date.now() +
            path.extname(file.originalname);

        cb(null, nombre);

    }

});

const upload = multer({
    storage
});


// ============================================
// 🔥 OBTENER EMPLEADO
// ============================================

router.get('/api/empleado/:id', async (req, res) => {

    try {

        const id = req.params.id;

        const [rows] = await db.query(

            'SELECT * FROM empleados WHERE id = ?',

            [id]

        );

        res.json({

            ok: true,

            empleado: rows[0]

        });

    } catch(error){

        console.log(error);

        res.status(500).json({

            ok: false,

            mensaje: 'Error servidor',

            error: error.message

        });

    }

});


// ============================================
// 🔥 SUBIR DOCUMENTO
// ============================================

router.post(
    '/api/subir-documento/:id',
    upload.single('archivo'),
    async (req, res) => {

    try {

        const empleadoId =
            req.params.id;

        const {
            tipo_documento_id
        } = req.body;

        // ====================================
        // 🔥 BUSCAR TIPO DOCUMENTO
        // ====================================

        const [tipos] = await db.query(

            `
            SELECT *
            FROM tipos_documentos
            WHERE id = ?
            `,

            [tipo_documento_id]

        );

        if (tipos.length === 0) {

            return res.status(404).json({

                ok: false,
                mensaje: 'Tipo documento no existe'

            });

        }

        const tipo =
            tipos[0];

        // ====================================
        // 🔥 FECHA VENCIMIENTO
        // ====================================

        let fechaVencimiento = null;

        if (tipo.requiere_vigencia == 1) {

            const fecha =
                new Date();

            fecha.setDate(

                fecha.getDate() +
                (tipo.dias_vencimiento || 0)

            );

            fechaVencimiento =
                fecha.toISOString()
                .split('T')[0];

        }

        // ====================================
        // 🔥 DESACTIVAR ANTERIORES
        // ====================================

        await db.query(

            `
            UPDATE documentos_empleado
            SET activo = 0
            WHERE empleado_id = ?
            AND tipo_documento_id = ?
            `,

            [
                empleadoId,
                tipo_documento_id
            ]

        );

        // ====================================
        // 🔥 INSERTAR NUEVO
        // ====================================

        const rutaArchivo =

            `/uploads/documentos/${empleadoId}/${req.file.filename}`;

        await db.query(

            `
            INSERT INTO documentos_empleado
            (

                empleado_id,
                tipo_documento_id,
                categoria,
                tipo_documento,
                nombre_archivo,
                extension,
                estado,
                fecha_vencimiento,
                ruta_archivo,
                activo

            )

            VALUES
            (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `,

            [

                empleadoId,

                tipo_documento_id,

                'GENERAL',

                tipo.nombre,

                req.file.filename,

                path.extname(req.file.originalname),

                'APROBADO',

                fechaVencimiento,

                rutaArchivo,

                1

            ]

        );

        res.json({

            ok: true,
            mensaje: 'Documento subido'

        });

    } catch(error){

        console.log(error);

        res.status(500).json({

            ok: false,
            mensaje: 'Error servidor',
            error: error.message

        });

    }

});

module.exports = router;