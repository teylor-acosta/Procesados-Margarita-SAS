const express = require("express");
const router = express.Router();

const db = require("../DB");

const { proteger } = require("../middlewares/auth");

const uploadMaterialApoyo =
require("../middlewares/uploadMaterialApoyo");

const path = require("path");
const fs = require("fs");

// ==========================================
// LISTAR MATERIAL DE APOYO DEL CURSO
// ==========================================

router.get(
    "/api/cursos/:curso/materiales",
    proteger,
    async (req, res) => {

        try {

            const { curso } =
            req.params;

            const [materiales] =
            await db.query(

                `
                SELECT

                    m.*,

                    c.titulo
                    AS capitulo,

                    s.titulo
                    AS subcapitulo

                FROM material_apoyo_curso m

                LEFT JOIN capitulos_curso c

                    ON c.id =
                    m.capitulo_id

                LEFT JOIN sub_capitulos_curso s

                    ON s.id =
                    m.sub_capitulo_id

                WHERE

                    m.curso_id = ?

                    AND m.activo = 1

                ORDER BY

                    m.orden ASC,

                    m.fecha_subida DESC
                `,

                [curso]

            );

            res.json({

                success: true,

                materiales

            });

        } catch (error) {

            console.error(error);

            res.status(500).json({

                success: false,

                mensaje:
                "Error obteniendo los materiales."

            });

        }

    }
);

// ==========================================
// CREAR MATERIAL DE APOYO DEL CURSO
// ==========================================

router.post(
    "/api/cursos/:curso/materiales",
    proteger,
    uploadMaterialApoyo.single("archivoMaterial"),
    async (req, res) => {

        try {

            const { curso } = req.params;

            const {

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

            if (req.file) {

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
                INSERT INTO material_apoyo_curso
                (

                    curso_id,
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

                    ?,?,?,?,?,?,?,?,?,?,?,?,1,?

                )
                `,

                [

                    curso,
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

                success: true,

                mensaje:
                "Material registrado correctamente."

            });

        } catch (error) {

            console.error(error);

            res.status(500).json({

                success: false,

                mensaje:
                "Error al registrar el material."

            });

        }

    }
);

// ==========================================
// OBTENER MATERIAL POR ID
// ==========================================

router.get(
    "/api/cursos/materiales/:id",
    proteger,
    async (req, res) => {

        try {

            const { id } = req.params;

            const [material] = await db.query(

                `
                SELECT
                    *
                FROM material_apoyo_curso
                WHERE
                    id = ?
                    AND activo = 1
                LIMIT 1
                `,

                [id]

            );

            if (material.length === 0) {

                return res.status(404).json({

                    success: false,
                    mensaje: "Material no encontrado."

                });

            }

            res.json({

                success: true,
                material: material[0]

            });

        } catch (error) {

            console.error(error);

            res.status(500).json({

                success: false,
                mensaje: "Error al obtener el material."

            });

        }

    }
);

// ==========================================
// ACTUALIZAR MATERIAL DE APOYO
// ==========================================

router.put(
    "/api/cursos/materiales/:id",
    proteger,
    uploadMaterialApoyo.single("archivoMaterial"),
    async (req, res) => {

        const conexion = await db.getConnection();

        try {

            await conexion.beginTransaction();

            const { id } = req.params;

            const {

                titulo,
                descripcion,
                tipoAsignacion,
                capitulo_id,
                sub_capitulo_id,
                orden,
                obligatorio

            } = req.body;

            const [materialActual] = await conexion.query(

                `
                SELECT *
                FROM material_apoyo_curso
                WHERE id = ?
                LIMIT 1
                `,

                [id]

            );

            if (materialActual.length === 0) {

                await conexion.rollback();

                return res.status(404).json({

                    success: false,
                    mensaje: "Material no encontrado."

                });

            }

            let nombreArchivo = materialActual[0].nombre_archivo;
            let rutaArchivo = materialActual[0].ruta_archivo;
            let tipoArchivo = materialActual[0].tipo_archivo;
            let tamano = materialActual[0].tamano;

            if (req.file) {

                nombreArchivo = req.file.originalname;

                rutaArchivo =
                    `/uploads/material-apoyo/${req.file.filename}`;

                tipoArchivo =
                    path.extname(req.file.originalname)
                        .replace(".", "")
                        .toLowerCase();

                tamano = req.file.size;

            }

            await conexion.query(

                `
                UPDATE material_apoyo_curso
                SET

                    titulo = ?,
                    descripcion = ?,
                    tipo_asignacion = ?,
                    capitulo_id = ?,
                    sub_capitulo_id = ?,
                    nombre_archivo = ?,
                    ruta_archivo = ?,
                    tipo_archivo = ?,
                    tamano = ?,
                    orden = ?,
                    obligatorio = ?

                WHERE id = ?
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

            await conexion.commit();

            res.json({

                success: true,
                mensaje: "Material actualizado correctamente."

            });

        } catch (error) {

            await conexion.rollback();

            console.error(error);

            res.status(500).json({

                success: false,
                mensaje: "Error al actualizar el material."

            });

        } finally {

            conexion.release();

        }

    }
);

// ==========================================
// ELIMINAR MATERIAL DE APOYO
// ==========================================

router.delete(
    "/api/cursos/materiales/:id",
    proteger,
    async (req, res) => {

        const conexion = await db.getConnection();

        try {

            await conexion.beginTransaction();

            const { id } = req.params;

            const [material] = await conexion.query(

                `
                SELECT ruta_archivo
                FROM material_apoyo_curso
                WHERE id = ?
                LIMIT 1
                `,

                [id]

            );

            if (material.length === 0) {

                await conexion.rollback();

                return res.status(404).json({

                    success: false,
                    mensaje: "Material no encontrado."

                });

            }

            // Eliminar archivo físico
            if (material[0].ruta_archivo) {

                const ruta = path.join(
                    __dirname,
                    "..",
                    "public",
                    material[0].ruta_archivo
                );

                if (fs.existsSync(ruta)) {
                    fs.unlinkSync(ruta);
                }

            }

            // Eliminar registro
            await conexion.query(

                `
                DELETE FROM material_apoyo_curso
                WHERE id = ?
                `,

                [id]

            );

            await conexion.commit();

            res.json({

                success: true,
                mensaje: "Material eliminado correctamente."

            });

        } catch (error) {

            await conexion.rollback();

            console.error(error);

            res.status(500).json({

                success: false,
                mensaje: "Error al eliminar el material."

            });

        } finally {

            conexion.release();

        }

    }
);

module.exports = router;