const express = require('express');
const bcrypt = require('bcrypt');
const router = express.Router();
const path = require('path');
const multer = require('multer');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const { proteger, soloSuperAdmin } = require('../middlewares/auth');
const db = require('../DB');

const carpetaFotos =
    path.join(
        __dirname,
        '../public/uploads/fotos'
    );

if (!fs.existsSync(carpetaFotos)) {

    fs.mkdirSync(
        carpetaFotos,
        { recursive:true }
    );

}

const storage =
    multer.diskStorage({

        destination(
            req,
            file,
            cb
        ) {

            cb(
                null,
                carpetaFotos
            );

        },

        filename(
            req,
            file,
            cb
        ) {

            const extension =
                path.extname(
                    file.originalname
                );

            cb(
                null,
                `perfil_${Date.now()}${extension}`
            );

        }

    });

const upload =
    multer({

        storage,

        limits: {
            fileSize:
            10 * 1024 * 1024
        }

    });
// ============================================
// 🔥 LISTAR SOLO ACTIVOS
// ============================================

router.get(

    '/api/empleados',

    proteger,

    soloSuperAdmin,

    async (req, res) => {

        try {

            const db = req.app.get('db');

            const sql = `

                SELECT 

                    e.*, 
                    a.nombre AS area,
                    s.nombre AS sede,
                    c.nombre AS cargo

                FROM empleados e

                LEFT JOIN areas a
                ON e.area_id = a.id

                LEFT JOIN sedes s
                ON e.sede_id = s.id

                LEFT JOIN cargos c
                ON e.cargo_id = c.id

                WHERE e.activo = 'SI'

            `;

            const [results] =
                await db.query(sql);

            res.json(results);

        } catch(error) {

            console.log(error);

            res.status(500).json([]);

        }

    }

);


// ============================================
// 🔥 ACTUALIZAR
// ============================================

router.put('/api/actualizar-empleado', async (req, res) => {

    try {

        const db = req.app.get('db');
        const e = req.body;

        const sql = `
        UPDATE empleados SET
            nombre=?,
            tipo_documento=?,
            numero_documento=?,
            rh=?,
            fecha_nacimiento=?,
            lugar_nacimiento=?,
            estado_civil=?,
            direccion=?,
            barrio_localidad=?,
            telefono=?,
            email=?,
            area_id=?,
            sede_id=?,
            cargo_id=?
        WHERE id=?
        `;

        await db.query(sql, [
            e.nombre,
            e.tipo_documento,
            e.numero_documento,
            e.rh,
            e.fecha_nacimiento,
            e.lugar_nacimiento,
            e.estado_civil,
            e.direccion,
            e.barrio_localidad,
            e.telefono,
            e.email,
            e.area_id || null,
            e.sede_id || null,
            e.cargo_id || null,
            e.id
        ]);

        // ============================================
        // 🔥 REGISTRAR ACTIVIDAD
        // ============================================

        await db.query(

            `INSERT INTO centro_actividad (

                empleado_id,
                usuario_id,
                accion,
                modulo,
                descripcion,
                color,
                icono

            )

            VALUES (?, ?, ?, ?, ?, ?, ?)`,

            [

                e.id,
                req.session.usuarioID || null,
                'ACTUALIZAR',
                'EMPLEADOS',
                `Se actualizó el empleado ${e.nombre}`,
                'azul',
                'fa-pen'

            ]

        );

        res.json({
            success: true
        });

    } catch (error) {

        console.log(error);

        res.status(500).json({
            success: false,
            error: error.message
        });

    }

});

// ============================================
// 🔥 DESACTIVAR EMPLEADO
// ============================================

router.put('/api/desactivar-empleado', async (req, res) => {

    try {

        const db = req.app.get('db');

        const {

            id,
            motivo_desactivacion,
            observacion_desactivacion

        } = req.body;

        // ============================================
        // DESACTIVAR EMPLEADO
        // ============================================

        await db.query(

            `
            UPDATE empleados
            SET

                activo = 'NO',
                fecha_desactivacion = NOW(),
                motivo_desactivacion = ?,
                observacion_desactivacion = ?

            WHERE id = ?
            `,

            [

                motivo_desactivacion || null,
                observacion_desactivacion || null,
                id

            ]

        );

        // ============================================
        // BLOQUEAR USUARIO ASOCIADO
        // ============================================

        await db.query(

            `
            UPDATE usuarios
            SET bloqueado = 1
            WHERE empleado_id = ?
            `,

            [id]

        );

        // ============================================
        // REGISTRAR ACTIVIDAD
        // ============================================

        await db.query(

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

                id,

                req.session.usuario?.id || null,

                'DESACTIVAR',

                'EMPLEADOS',

                `Empleado desactivado. Motivo: ${motivo_desactivacion || 'Sin motivo'}`,

                'rojo',

                'fa-user-slash'

            ]

        );

        res.json({

            success: true

        });

    } catch(error){

        console.log(error);

        res.status(500).json({

            success: false,
            error: error.message

        });

    }

});


// ============================================
// 🔥 ACTIVAR EMPLEADO
// ============================================

router.put('/api/activar-empleado', async (req, res) => {

    try {

        const db = req.app.get('db');

        const { id } = req.body;

        // ============================================
        // ACTIVAR EMPLEADO
        // ============================================

        await db.query(

            `
            UPDATE empleados
            SET activo = 'SI'
            WHERE id = ?
            `,

            [id]

        );

        // ============================================
        // DESBLOQUEAR USUARIO ASOCIADO
        // ============================================

        await db.query(

            `
            UPDATE usuarios
            SET bloqueado = 0
            WHERE empleado_id = ?
            `,

            [id]

        );

        // ============================================
        // REGISTRAR ACTIVIDAD
        // ============================================

        await db.query(

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

                id,

                req.session.usuario?.id || null,

                'ACTIVAR',

                'EMPLEADOS',

                'Se reactivó un empleado',

                'verde',

                'fa-user-check'

            ]

        );

        res.json({

            success: true

        });

    } catch(error){

        console.log(error);

        res.status(500).json({

            success: false,
            error: error.message

        });

    }

});


// ============================================
// 🔥 EMPLEADOS INACTIVOS
// ============================================

// ============================================
// 🔥 EMPLEADOS INACTIVOS
// ============================================

router.get(

    '/api/empleados-inactivos',

    async (req, res) => {

        try {

            const db = req.app.get('db');

            const sql = `

                SELECT

                    e.id,
                    e.codigo,
                    e.nombre,
                    e.numero_documento,
                    e.tipo_documento,

                    e.area_id,
                    e.sede_id,
                    e.cargo_id,

                    e.motivo_desactivacion,
                    e.observacion_desactivacion,
                    e.fecha_desactivacion,

                    a.nombre AS area,
                    s.nombre AS sede,
                    c.nombre AS cargo,

                    u.Usuario AS usuario_sistema,
                    u.bloqueado

                FROM empleados e

                LEFT JOIN areas a
                    ON e.area_id = a.id

                LEFT JOIN sedes s
                    ON e.sede_id = s.id

                LEFT JOIN cargos c
                    ON e.cargo_id = c.id

                LEFT JOIN usuarios u
                    ON e.id = u.empleado_id

                WHERE e.activo = 'NO'

                ORDER BY
                    e.fecha_desactivacion DESC

            `;

            const [results] =
                await db.query(sql);

            res.json(results);

        } catch(error) {

            console.log(error);

            res.status(500).json([]);

        }

    }

);
// ============================================
// 🔥 CREAR
// ============================================

router.post(
    '/api/crear-empleado',
    proteger,
    soloSuperAdmin,
    async (req, res) => {

        try {

            const db = req.app.get('db');
            const e = req.body;

            const nombreCompleto =
                `${e.nombres || ''} ${e.apellidos || ''}`
                    .replace(/\s+/g, ' ')
                    .trim();

            const [rows] = await db.query(
                "SELECT codigo FROM empleados ORDER BY id DESC LIMIT 1"
            );

            let nuevoCodigo = "EMP1";

            if (rows.length > 0 && rows[0].codigo) {

                const ultimo = rows[0].codigo;

                const numero =
                    parseInt(
                        ultimo.replace("EMP", "")
                    ) || 0;

                nuevoCodigo =
                    "EMP" + (numero + 1);

            }

            const sql = `

                INSERT INTO empleados (

                    codigo,
                    nombre,
                    tipo_documento,
                    numero_documento,
                    rh,
                    fecha_nacimiento,
                    lugar_nacimiento,
                    estado_civil,
                    direccion,
                    barrio_localidad,
                    telefono,
                    email,
                    area_id,
                    sede_id,
                    cargo_id,
                    activo

                )

                VALUES (

                    ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'SI'

                )

            `;

            const [result] = await db.query(

                sql,

                [
                    nuevoCodigo,
                    nombreCompleto,
                    e.tipo_documento,
                    e.numero_documento,
                    e.rh,
                    e.fecha_nacimiento,
                    e.lugar_nacimiento,
                    e.estado_civil,
                    e.direccion,
                    e.barrio_localidad,
                    e.telefono,
                    e.email,
                    e.area_id || null,
                    e.sede_id || null,
                    e.cargo_id || null
                ]

            );

            await db.query(

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

                    result.insertId,

                    req.session.usuarioID || null,

                    'CREAR',

                    'EMPLEADOS',

                    `Se creó el empleado ${nombreCompleto}`,

                    'verde',

                    'fa-user-plus'

                ]

            );

            res.json({

                success: true,

                codigo: nuevoCodigo

            });

        } catch(error){

            console.log(error);

            res.status(500).json({

                success: false,

                error: error.message

            });

        }

    }

);

// ============================================
// 🔥 FILTROS
// ============================================

router.get(

    '/api/filtros-empleado',

    proteger,

    soloSuperAdmin,

    async (req, res) => {

        try {

            const db = req.app.get('db');

            // ============================================
            // 🔥 ÁREAS
            // ============================================

            const [areas] = await db.query(
                "SELECT id, nombre FROM areas"
            );

            // ============================================
            // 🔥 SEDES
            // ============================================

            const [sedes] = await db.query(
                "SELECT id, nombre FROM sedes"
            );

            // ============================================
            // 🔥 CARGOS
            // ============================================

            const [cargos] = await db.query(
                "SELECT id, nombre FROM cargos"
            );

            // ============================================
            // 🔥 RESPUESTA
            // ============================================

            res.json({

                areas,
                sedes,
                cargos

            });

        } catch(error){

            console.log(error);

            res.status(500).json({

                success: false,
                error: error.message

            });

        }

    }

);
/* =========================================
   🔥 OBTENER EMPLEADO POR ID
========================================= */

router.get('/api/empleado/:id', async (req, res) => {

    try {

        const { id } = req.params;

        const sql = `

            SELECT 

                e.*,

                a.nombre AS area,
                s.nombre AS sede,
                c.nombre AS cargo

            FROM empleados e

            LEFT JOIN areas a
            ON e.area_id = a.id

            LEFT JOIN sedes s
            ON e.sede_id = s.id

            LEFT JOIN cargos c
            ON e.cargo_id = c.id

            WHERE e.id = ?

        `;

        const [results] = await db.query(sql, [id]);

        if (results.length === 0) {

            return res.json({
                ok: false,
                mensaje: 'Empleado no encontrado'
            });

        }

        res.json({
            ok: true,
            empleado: results[0]
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

// ============================================
// 🔥 DASHBOARD ESTADISTICAS
// ============================================

router.get('/api/dashboard-estadisticas', async (req, res) => {

    try {

        const db = req.app.get('db');

        // ====================================
        // EMPLEADOS ACTIVOS
        // ====================================

        const [empleados] = await db.query(`
            SELECT COUNT(*) AS total
            FROM empleados
            WHERE activo = 'SI'
        `);

        // ====================================
        // DOCUMENTOS
        // ====================================

        const [documentos] = await db.query(`
    SELECT COUNT(*) AS total
    FROM documentos_empleado
`);

        // ====================================
        // ACTIVIDAD
        // ====================================

        const [actividad] = await db.query(`
            SELECT COUNT(*) AS total
            FROM centro_actividad
        `);

        res.json({

            success: true,

            empleados:
                empleados[0].total,

            documentos:
                documentos[0].total,

            actividad:
                actividad[0].total

        });

    } catch(error){

        console.log(error);

        res.status(500).json({

            success: false

        });

    }

});

/* =========================================
   ACTUALIZAR FOTO PERFIL
========================================= */

router.post(
    '/api/perfil/foto',
    proteger,
    upload.single('foto'),
    async (req, res) => {

        console.log("=================================");
        console.log("ENTRO A SUBIR FOTO");
        console.log("SESSION:", req.session.usuarioID);
        console.log("FILE:", req.file);
        console.log("BODY:", req.body);
        console.log("=================================");

        try {

            const db =
                req.app.get('db');

            const empleadoID =
                req.session.empleadoID;

            if (!req.file) {

                return res.status(400).json({

                    success:false,
                    message:'No se recibió imagen'

                });

            }

            await db.query(

                `
                UPDATE empleados
                SET foto = ?
                WHERE id = ?
                `,

                [
                    req.file.filename,
                    empleadoID
                ]

            );

            res.json({

                success:true,

                foto:
                req.file.filename

            });

        } catch(error) {

            console.error(error);

            res.status(500).json({

                success:false,
                message:error.message

            });

        }

    }
);
router.get(
    '/api/perfil/pdf',
    proteger,
    async (req, res) => {

        try {

            const db =
                req.app.get('db');

            const usuarioId =
                req.session.usuarioID;

            const empleadoId =
                req.session.empleadoID;

            const [empleadoRows] =
                await db.query(`
                    SELECT
                        e.*,
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
                    WHERE e.id = ?
                `, [empleadoId]);

            if (!empleadoRows.length) {

                return res.status(404).json({
                    success: false,
                    message: 'Empleado no encontrado'
                });

            }

            const empleado =
                empleadoRows[0];

            const [firmaRows] =
                await db.query(`
                    SELECT firma_data
                    FROM firmas_usuario
                    WHERE usuario_id = ?
                    LIMIT 1
                `, [usuarioId]);

            const firma =
                firmaRows[0]?.firma_data || null;

            const doc =
                new PDFDocument({
                    margin: 40,
                    size: 'A4'
                });

            res.setHeader(
                'Content-Type',
                'application/pdf'
            );

            res.setHeader(
                'Content-Disposition',
                `attachment; filename=Perfil_${empleado.codigo}.pdf`
            );

            doc.pipe(res);

            // ============================================
            // MARCA DE AGUA
            // ============================================

            const logoPath =
                path.join(
                    __dirname,
                    '../public/img/logo de procesados solo.jpg'
                );

            if (fs.existsSync(logoPath)) {

                doc.opacity(0.08);

                doc.image(
                    logoPath,
                    110,
                    180,
                    {
                        width: 350
                    }
                );

                doc.opacity(1);
            }

            // ============================================
            // TITULO
            // ============================================

            doc
                .fillColor('#02412e')
                .fontSize(26)
                .text(
                    'PROCESADOS MARGARITA SAS',
                    {
                        align: 'center'
                    }
                );

            doc
                .fontSize(18)
                .text(
                    'PERFIL DEL EMPLEADO',
                    {
                        align: 'center'
                    }
                );

            doc.moveDown(2);

            // ============================================
            // FOTO EMPLEADO
            // ============================================

            try {

                if (
                    empleado.foto &&
                    empleado.foto.startsWith('data:image')
                ) {

                    const fotoBase64 =
                        empleado.foto.split(',')[1];

                    const fotoBuffer =
                        Buffer.from(
                            fotoBase64,
                            'base64'
                        );

                    doc.image(
                        fotoBuffer,
                        450,
                        95,
                        {
                            width: 90,
                            height: 90
                        }
                    );

                }

            } catch (err) {

                console.log(
                    'No se pudo cargar la foto:',
                    err.message
                );

            }

            // ============================================
            // FECHA BONITA
            // ============================================

            const fechaNacimiento =
                empleado.fecha_nacimiento
                ? new Date(
                    empleado.fecha_nacimiento
                  )
                    .toISOString()
                    .split('T')[0]
                : '';

            // ============================================
            // DATOS EMPLEADO
            // ============================================

            doc
                .fillColor('black')
                .fontSize(12);

            const datos = [

                `Código: ${empleado.codigo || ''}`,
                `Nombre: ${empleado.nombre || ''}`,
                `Tipo Documento: ${empleado.tipo_documento || ''}`,
                `Documento: ${empleado.numero_documento || ''}`,
                `RH: ${empleado.rh || ''}`,
                `Fecha Nacimiento: ${fechaNacimiento}`,
                `Lugar Nacimiento: ${empleado.lugar_nacimiento || ''}`,
                `Estado Civil: ${empleado.estado_civil || ''}`,
                `Dirección: ${empleado.direccion || ''}`,
                `Barrio: ${empleado.barrio_localidad || ''}`,
                `Teléfono: ${empleado.telefono || ''}`,
                `Email: ${empleado.email || ''}`,
                `Área: ${empleado.area || ''}`,
                `Cargo: ${empleado.cargo || ''}`,
                `Sede: ${empleado.sede || ''}`

            ];

            datos.forEach(texto => {

                doc.text(texto);

            });

            doc.moveDown(2);

            // ============================================
            // FIRMA
            // ============================================

            doc
                .fontSize(13)
                .text('Firma registrada:');

            if (firma) {

                try {

                    const firmaBase64 =
                        firma.split(',')[1];

                    const firmaBuffer =
                        Buffer.from(
                            firmaBase64,
                            'base64'
                        );

                    const posicionFirma =
                        doc.y + 5;

                    doc.image(
                        firmaBuffer,
                        60,
                        posicionFirma,
                        {
                            width: 170
                        }
                    );

                    doc.y =
                        posicionFirma + 80;

                    doc.text(
                        '____________________________',
                        60
                    );

                    doc.text(
                        empleado.nombre,
                        60
                    );

                } catch (err) {

                    doc.text(
                        'No fue posible mostrar la firma.'
                    );

                }

            } else {

                doc.text(
                    'No registra firma.'
                );

            }

            doc.moveDown(2);

            // ============================================
            // PIE DE PAGINA
            // ============================================

            doc
                .fontSize(10)
                .fillColor('gray')
                .text(
                    `Generado el ${new Date().toLocaleString('es-CO')}`
                );

            doc.moveDown();

            doc
                .fontSize(9)
                .fillColor('#555')
                .text(
                    'Este documento fue generado automáticamente por el ERP de Procesados Margarita SAS.',
                    {
                        align: 'center'
                    }
                );

            doc.end();

        } catch (error) {

            console.error(
                'Error generando PDF:',
                error
            );

            res.status(500).json({
                success: false,
                message: error.message
            });

        }

    }
);

router.post(
    '/api/perfil/cambiar-password',
    proteger,
    async (req, res) => {

        try {

            const db =
                req.app.get('db');

            const usuarioId =
                req.session.usuarioID;

            const {
                actual,
                nueva
            } = req.body;

            if (!actual || !nueva) {

                return res.status(400).json({
                    success: false,
                    message: 'Debe ingresar la contraseña actual y la nueva.'
                });

            }

            const [rows] =
                await db.query(
                    `
                    SELECT password_hash
                    FROM usuarios
                    WHERE ID = ?
                    `,
                    [usuarioId]
                );

            if (!rows.length) {

                return res.status(404).json({
                    success: false,
                    message: 'Usuario no encontrado'
                });

            }

            const usuario =
                rows[0];

            const coincide =
                await bcrypt.compare(
                    actual,
                    usuario.password_hash
                );

            if (!coincide) {

                return res.status(400).json({
                    success: false,
                    message: 'La contraseña actual es incorrecta'
                });

            }

            const hash = await bcrypt.hash(
    nueva,
    10
);

            await db.query(
                `
                UPDATE usuarios
                SET
                    password_hash = ?,
                    fecha_cambio_password = NOW()
                WHERE ID = ?
                `,
                [
                    hash,
                    usuarioId
                ]
            );

            res.json({
                success: true,
                message: 'Contraseña actualizada correctamente'
            });

        } catch (error) {

            console.error(
                '🔥 ERROR CAMBIANDO PASSWORD PERFIL:',
                error
            );

            res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });

        }

    }
);
module.exports = router;
