
const express = require('express');
const router = express.Router();

const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const {
    proteger,
    soloSuperAdmin
} = require('../middlewares/auth');

// ============================================
// CONFIGURACIÓN DE ARCHIVOS PRIVADOS
// ============================================

const carpetaDocumentos = path.join(
    __dirname,
    '..',
    'storage',
    'documentos'
);

fs.mkdirSync(carpetaDocumentos, { recursive: true });

const almacenamiento = multer.diskStorage({

    destination: (req, file, cb) => {
        cb(null, carpetaDocumentos);
    },

    filename: (req, file, cb) => {

        const nombre = crypto.randomUUID() + '.pdf';

        cb(null, nombre);
    }

});

const subirPDF = multer({

    storage: almacenamiento,

    limits: {
        fileSize: 20 * 1024 * 1024
    },

    fileFilter: (req, file, cb) => {

        const extension = path.extname(file.originalname).toLowerCase();

        if (
            file.mimetype !== 'application/pdf' ||
            extension !== '.pdf'
        ) {
            return cb(new Error('Solo se permiten archivos PDF.'));
        }

        cb(null, true);
    }

});


// ============================================
// FUNCIONES AUXILIARES
// ============================================

const eliminarArchivo = (archivo) => {

    if (archivo && fs.existsSync(archivo)) {
        fs.unlinkSync(archivo);
    }

};


// ============================================
// 1. CONSULTAR DOCUMENTOS VIGENTES
// ============================================

router.get(
    '/api/documentos-lectura/vigentes',
    proteger,
    async (req, res) => {

        try {

            const db = req.app.get('db');

            const empleadoID = req.session.empleadoID;

            const [documentos] = await db.query(`

                SELECT
                    d.id AS documento_id,
                    d.titulo,
                    d.descripcion,
                    d.estado,
                    v.id AS version_id,
                    v.numero_version,
                    v.fecha_publicacion,
                    a.id AS aceptacion_id,
                    a.fecha_aceptacion

                FROM documentos_lectura d

                INNER JOIN versiones_documentos v
                    ON d.version_actual_id = v.id

                LEFT JOIN aceptaciones_documentos a
                    ON a.version_id = v.id
                    AND a.empleado_id = ?

                WHERE d.estado = 'ACTIVO'
                    AND v.estado = 'VIGENTE'

                ORDER BY d.fecha_creacion DESC

            `, [empleadoID]);

            res.json({
                success: true,
                documentos
            });

        } catch (error) {

            console.error('ERROR DOCUMENTOS VIGENTES:', error);

            res.status(500).json({
                success: false,
                message: 'Error al consultar los documentos.'
            });

        }

    }
);


// ============================================
// 2. CREAR DOCUMENTO Y PRIMERA VERSIÓN
// ============================================

router.post(
    '/api/documentos-lectura',
    proteger,
    soloSuperAdmin,
    (req, res, next) => {

        subirPDF.single('archivo')(req, res, (error) => {

            if (error) {

                return res.status(400).json({
                    success: false,
                    message: error.message
                });

            }

            next();

        });

    },
    async (req, res) => {

        let conexion;
        let archivo = req.file?.path;

        try {

            const db = req.app.get('db');

            const { titulo, descripcion } = req.body;

            if (!titulo || !titulo.trim() || !req.file) {

                eliminarArchivo(archivo);

                return res.status(400).json({
                    success: false,
                    message: 'El título y el archivo PDF son obligatorios.'
                });

            }

            conexion = await db.getConnection();

            await conexion.beginTransaction();

            const [documento] = await conexion.query(`

                INSERT INTO documentos_lectura
                (titulo, descripcion, estado)

                VALUES (?, ?, 'ACTIVO')

            `, [
                titulo.trim(),
                descripcion || null
            ]);

            const documentoID = documento.insertId;

            const ruta = path.relative(
                path.join(__dirname, '..'),
                archivo
            ).replace(/\\/g, '/');

            const [version] = await conexion.query(`

                INSERT INTO versiones_documentos
                (
                    documento_id,
                    numero_version,
                    nombre_archivo,
                    ruta_archivo,
                    estado,
                    publicado_por,
                    fecha_publicacion
                )

                VALUES (?, 1, ?, ?, 'VIGENTE', ?, NOW())

            `, [
                documentoID,
                req.file.originalname,
                ruta,
                req.session.usuarioID
            ]);

            await conexion.query(`

                UPDATE documentos_lectura
                SET version_actual_id = ?
                WHERE id = ?

            `, [
                version.insertId,
                documentoID
            ]);

            await conexion.commit();

            res.status(201).json({
                success: true,
                message: 'Documento publicado correctamente.',
                documento_id: documentoID,
                version_id: version.insertId
            });

        } catch (error) {

            if (conexion) {
                await conexion.rollback();
            }

            eliminarArchivo(archivo);

            console.error('ERROR CREAR DOCUMENTO:', error);

            res.status(500).json({
                success: false,
                message: 'No se pudo publicar el documento.'
            });

        } finally {

            if (conexion) conexion.release();

        }

    }
);


// ============================================
// 3. SUBIR NUEVA VERSIÓN COMO BORRADOR
// ============================================

router.post(
    '/api/documentos-lectura/:id/versiones',
    proteger,
    soloSuperAdmin,
    (req, res, next) => {

        subirPDF.single('archivo')(req, res, (error) => {

            if (error) {
                return res.status(400).json({
                    success: false,
                    message: error.message
                });
            }

            next();

        });

    },
    async (req, res) => {

        let conexion;
        const archivo = req.file?.path;

        try {

            const db = req.app.get('db');
            const documentoID = Number(req.params.id);

            if (!Number.isInteger(documentoID) || documentoID <= 0) {
                eliminarArchivo(archivo);

                return res.status(400).json({
                    success: false,
                    message: 'Identificador de documento inválido.'
                });
            }

            if (!req.file) {
                return res.status(400).json({
                    success: false,
                    message: 'Debes seleccionar un archivo PDF.'
                });
            }

            conexion = await db.getConnection();
            await conexion.beginTransaction();

            const [documentos] = await conexion.query(`
                SELECT id, estado
                FROM documentos_lectura
                WHERE id = ?
                FOR UPDATE
            `, [documentoID]);

            if (
                documentos.length === 0 ||
                documentos[0].estado !== 'ACTIVO'
            ) {
                throw new Error('Documento inexistente o inactivo.');
            }

            const [versiones] = await conexion.query(`
                SELECT COALESCE(MAX(numero_version), 0) + 1 AS siguiente
                FROM versiones_documentos
                WHERE documento_id = ?
            `, [documentoID]);

            const siguienteVersion = versiones[0].siguiente;

            const ruta = path.relative(
                path.join(__dirname, '..'),
                archivo
            ).replace(/\\/g, '/');

            const [nuevaVersion] = await conexion.query(`
                INSERT INTO versiones_documentos
                (
                    documento_id,
                    numero_version,
                    nombre_archivo,
                    ruta_archivo,
                    estado
                )
                VALUES (?, ?, ?, ?, 'BORRADOR')
            `, [
                documentoID,
                siguienteVersion,
                req.file.originalname,
                ruta
            ]);

            await conexion.commit();

            res.status(201).json({
                success: true,
                message: 'Nueva versión guardada como borrador. La versión vigente no ha sido modificada.',
                version: siguienteVersion,
                version_id: nuevaVersion.insertId
            });

        } catch (error) {

            if (conexion) {
                await conexion.rollback();
            }

            eliminarArchivo(archivo);

            console.error('ERROR NUEVA VERSION:', error);

            res.status(500).json({
                success: false,
                message: error.message || 'No se pudo guardar la nueva versión.'
            });

        } finally {

            if (conexion) conexion.release();

        }

    }
);


// ============================================
// 4. PUBLICAR UNA VERSIÓN BORRADOR
// ============================================

router.post(
    '/api/documentos-lectura/versiones/:id/publicar',
    proteger,
    soloSuperAdmin,
    async (req, res) => {

        let conexion;

        try {

            const db = req.app.get('db');
            const versionID = Number(req.params.id);

            if (!Number.isInteger(versionID) || versionID <= 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Identificador de versión inválido.'
                });
            }

            conexion = await db.getConnection();
            await conexion.beginTransaction();

            const [versiones] = await conexion.query(`
                SELECT
                    v.id,
                    v.documento_id,
                    v.estado,
                    d.estado AS documento_estado,
                    d.version_actual_id
                FROM versiones_documentos v
                INNER JOIN documentos_lectura d
                    ON d.id = v.documento_id
                WHERE v.id = ?
                FOR UPDATE
            `, [versionID]);

            if (versiones.length === 0) {
                throw new Error('La versión no existe.');
            }

            const version = versiones[0];

            if (version.documento_estado !== 'ACTIVO') {
                throw new Error('El documento está inactivo.');
            }

            if (version.estado !== 'BORRADOR') {
                throw new Error('Solamente se pueden publicar versiones en estado BORRADOR.');
            }

            // La versión vigente anterior pasa al historial.
            await conexion.query(`
                UPDATE versiones_documentos
                SET
                    estado = 'HISTORICA',
                    retirado_por = ?,
                    fecha_retiro = NOW()
                WHERE documento_id = ?
                    AND estado = 'VIGENTE'
            `, [
                req.session.usuarioID,
                version.documento_id
            ]);

            // La nueva versión pasa a estar vigente.
            await conexion.query(`
                UPDATE versiones_documentos
                SET
                    estado = 'VIGENTE',
                    publicado_por = ?,
                    fecha_publicacion = NOW(),
                    retirado_por = NULL,
                    fecha_retiro = NULL
                WHERE id = ?
            `, [
                req.session.usuarioID,
                versionID
            ]);

            // Actualizar la versión actual del documento.
            await conexion.query(`
                UPDATE documentos_lectura
                SET version_actual_id = ?
                WHERE id = ?
            `, [
                versionID,
                version.documento_id
            ]);

            await conexion.commit();

            res.json({
                success: true,
                message: 'La versión se publicó correctamente.'
            });

        } catch (error) {

            if (conexion) {
                await conexion.rollback();
            }

            console.error('ERROR PUBLICAR VERSION:', error);

            res.status(400).json({
                success: false,
                message: error.message || 'No se pudo publicar la versión.'
            });

        } finally {

            if (conexion) conexion.release();

        }

    }
);


// ============================================
// 5. RETIRAR UNA VERSIÓN DE VIGENCIA
// ============================================

router.post(
    '/api/documentos-lectura/versiones/:id/retirar',
    proteger,
    soloSuperAdmin,
    async (req, res) => {

        let conexion;

        try {

            const db = req.app.get('db');
            const versionID = Number(req.params.id);

            if (!Number.isInteger(versionID) || versionID <= 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Identificador de versión inválido.'
                });
            }

            conexion = await db.getConnection();
            await conexion.beginTransaction();

            const [versiones] = await conexion.query(`
                SELECT
                    v.id,
                    v.documento_id,
                    v.estado,
                    d.version_actual_id
                FROM versiones_documentos v
                INNER JOIN documentos_lectura d
                    ON d.id = v.documento_id
                WHERE v.id = ?
                FOR UPDATE
            `, [versionID]);

            if (versiones.length === 0) {
                throw new Error('La versión no existe.');
            }

            const version = versiones[0];

            if (
                version.estado !== 'VIGENTE' ||
                Number(version.version_actual_id) !== versionID
            ) {
                throw new Error('Esta versión no es la versión vigente actual.');
            }

            // Conservar la trazabilidad del retiro.
            await conexion.query(`
                UPDATE versiones_documentos
                SET
                    estado = 'HISTORICA',
                    retirado_por = ?,
                    fecha_retiro = NOW()
                WHERE id = ?
            `, [
                req.session.usuarioID,
                versionID
            ]);

            // El documento queda sin versión vigente.
            await conexion.query(`
                UPDATE documentos_lectura
                SET version_actual_id = NULL
                WHERE id = ?
            `, [version.documento_id]);

            await conexion.commit();

            res.json({
                success: true,
                message: 'La versión fue retirada de vigencia correctamente.'
            });

        } catch (error) {

            if (conexion) {
                await conexion.rollback();
            }

            console.error('ERROR RETIRAR VERSION:', error);

            res.status(400).json({
                success: false,
                message: error.message || 'No se pudo retirar la versión.'
            });

        } finally {

            if (conexion) conexion.release();

        }

    }
);

// ============================================
// 4. CONSULTAR Y ABRIR PDF
// ============================================

router.get(
    '/api/documentos-lectura/:id/archivo',
    proteger,
    async (req, res) => {

        try {

            const db = req.app.get('db');

            const versionID = Number(req.params.id);

            const esSuperAdmin =
                (req.session.rol || '').toLowerCase().trim() === 'superadmin';

            const [resultados] = await db.query(`

                SELECT
                    v.id,
                    v.ruta_archivo,
                    v.estado,
                    d.estado AS documento_estado,
                    d.version_actual_id

                FROM versiones_documentos v

                INNER JOIN documentos_lectura d
                    ON d.id = v.documento_id

                WHERE v.id = ?

            `, [versionID]);

            if (resultados.length === 0) {

                return res.status(404).json({
                    success: false,
                    message: 'Documento no encontrado.'
                });

            }

            const documento = resultados[0];

            if (!esSuperAdmin) {

                if (
                    documento.estado !== 'VIGENTE' ||
                    documento.documento_estado !== 'ACTIVO' ||
                    Number(documento.version_actual_id) !== versionID
                ) {

                    return res.status(403).json({
                        success: false,
                        message: 'No tienes permiso para consultar esta versión.'
                    });

                }

            }

            const ruta = path.resolve(
                __dirname,
                '..',
                documento.ruta_archivo
            );

            if (!ruta.startsWith(carpetaDocumentos + path.sep)) {

                return res.status(403).json({
                    success: false,
                    message: 'Ruta de documento no autorizada.'
                });

            }

            if (!fs.existsSync(ruta)) {

                return res.status(404).json({
                    success: false,
                    message: 'El archivo PDF no está disponible.'
                });

            }

            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', 'inline');

            res.sendFile(ruta);

        } catch (error) {

            console.error('ERROR ABRIR PDF:', error);

            res.status(500).json({
                success: false,
                message: 'No se pudo abrir el documento.'
            });

        }

    }
);


// ============================================
// 5. CONFIRMAR LECTURA
// ============================================

router.post(
    '/api/documentos-lectura/:id/aceptar',
    proteger,
    async (req, res) => {

        try {

            const db = req.app.get('db');

            const documentoID = Number(req.params.id);

            const empleadoID = req.session.empleadoID;
            const usuarioID = req.session.usuarioID;

            const [documentos] = await db.query(`

                SELECT
                    d.id,
                    v.id AS version_id

                FROM documentos_lectura d

                INNER JOIN versiones_documentos v
                    ON d.version_actual_id = v.id

                WHERE d.id = ?
                    AND d.estado = 'ACTIVO'
                    AND v.estado = 'VIGENTE'

            `, [documentoID]);

            if (documentos.length === 0) {

                return res.status(404).json({
                    success: false,
                    message: 'Documento vigente no encontrado.'
                });

            }

            const versionID = documentos[0].version_id;

            await db.query(`

                INSERT INTO aceptaciones_documentos
                (
                    documento_id,
                    version_id,
                    empleado_id,
                    usuario_id,
                    declaracion_aceptacion
                )

                VALUES (?, ?, ?, ?, ?)

            `, [
                documentoID,
                versionID,
                empleadoID,
                usuarioID,
                'Confirmo que he leído y comprendido el contenido del documento.'
            ]);

            res.json({
                success: true,
                message: 'Lectura confirmada correctamente.',
                fecha_aceptacion: new Date()
            });

        } catch (error) {

            if (error.code === 'ER_DUP_ENTRY') {

                return res.status(409).json({
                    success: false,
                    message: 'Ya confirmaste la lectura de esta versión.'
                });

            }

            console.error('ERROR ACEPTAR DOCUMENTO:', error);

            res.status(500).json({
                success: false,
                message: 'No se pudo registrar la aceptación.'
            });

        }

    }
);


// ============================================
// 6. HISTORIAL DE VERSIONES - SUPERADMIN
// ============================================

router.get(
    '/api/documentos-lectura/historial',
    proteger,
    soloSuperAdmin,
    async (req, res) => {

        try {

            const db = req.app.get('db');

            const [historial] = await db.query(`

    SELECT
        d.id AS documento_id,
        d.titulo,

        v.id AS version_id,
        v.numero_version,
        v.nombre_archivo,
        v.estado,
        v.fecha_publicacion,
        v.fecha_retiro,

        u.Usuario AS publicado_por,
        ur.Usuario AS retirado_por

    FROM documentos_lectura d

    INNER JOIN versiones_documentos v
        ON d.id = v.documento_id

    LEFT JOIN usuarios u
        ON v.publicado_por = u.ID

    LEFT JOIN usuarios ur
        ON v.retirado_por = ur.ID

    ORDER BY d.id DESC, v.numero_version DESC

`);

            res.json({
                success: true,
                historial
            });

        } catch (error) {

            console.error('ERROR HISTORIAL:', error);

            res.status(500).json({
                success: false,
                message: 'No se pudo consultar el historial.'
            });

        }

    }
);


module.exports = router;
