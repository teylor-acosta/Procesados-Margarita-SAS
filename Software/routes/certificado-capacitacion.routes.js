const express = require("express");
const router = express.Router();

const db = require("../DB");
const {
    proteger,
    soloAdmin,
    soloSuperAdmin
} = require("../middlewares/auth");
const path = require("path");
const fs = require("fs");
const multer = require("multer");

// ============================================
// CONFIGURACIÓN MULTER
// ============================================

const storage = multer.diskStorage({

    destination: (req, file, cb) => {

        const cursoId = req.params.cursoId;

        const carpeta = path.join(

            __dirname,
            "../public/uploads/certificados",
            `curso_${cursoId}`

        );

        if (!fs.existsSync(carpeta)) {

            fs.mkdirSync(carpeta, {
                recursive: true
            });

        }

        cb(null, carpeta);

    },

    filename: (req, file, cb) => {

        const extension = path.extname(file.originalname);

        cb(null, file.fieldname + extension);

    }

});

const upload = multer({
    storage
});

// ============================================
// OBTENER CONFIGURACIÓN
// ============================================

router.get(
    "/api/certificados/:cursoId",
    proteger,
    async (req, res) => {

        try {

            const [rows] = await db.query(

                `
                SELECT *
                FROM certificados_curso
                WHERE curso_id = ?
                LIMIT 1
                `,

                [req.params.cursoId]

            );

            if (rows.length === 0) {

                return res.json(null);

            }

            res.json(rows[0]);

        }

        catch (error) {

            console.error(error);

            res.status(500).json({

                mensaje: "Error obteniendo configuración"

            });

        }

    }

);

// ============================================
// GUARDAR CONFIGURACIÓN
// ============================================

router.post(
    "/api/certificados",
    proteger,
    async (req, res) => {

        try {

            const {

    curso_id,
    texto_certificado,
    mostrar_qr,
    mostrar_sello,
    configuracion

} = req.body;

            const [existe] = await db.query(

                `
                SELECT id
                FROM certificados_curso
                WHERE curso_id=?
                LIMIT 1
                `,

                [curso_id]

            );

            if (existe.length > 0) {

                await db.query(

                    `
                    UPDATE certificados_curso

SET

    texto_certificado=?,
    mostrar_qr=?,
    mostrar_sello=?,
    configuracion=?

WHERE curso_id=?
                    `,

                    [

    texto_certificado,
    mostrar_qr,
    mostrar_sello,
    configuracion,
    curso_id

]

                );

            }

            else {

                await db.query(

                    `
                    INSERT INTO certificados_curso(

    curso_id,
    texto_certificado,
    mostrar_qr,
    mostrar_sello,
    configuracion,
    activo,
    fecha_creacion

)

                    VALUES(?,?,?,?,?,1,NOW())
                    `,

                    [

    curso_id,
    texto_certificado,
    mostrar_qr,
    mostrar_sello,
    configuracion

]

                );

            }

            res.json({

                ok: true,
                mensaje: "Configuración guardada."

            });

        }

        catch (error) {

            console.error(error);

            res.status(500).json({

                ok: false,
                mensaje: "Error guardando configuración."

            });

        }

    }

);

// ============================================
// SUBIR ARCHIVOS DEL CERTIFICADO
// ============================================

router.post(

    "/api/certificados/upload/:cursoId",

    proteger,

    upload.fields([

        {

            name: "plantilla",
            maxCount: 1

        },

        {

            name: "firma_izquierda",
            maxCount: 1

        },

        {

            name: "firma_derecha",
            maxCount: 1

        },

        {

            name: "sello",
            maxCount: 1

        }

    ]),

    async (req, res) => {

        try {

            const cursoId = req.params.cursoId;

            const archivos = req.files;

            let plantilla = null;
            let firmaIzquierda = null;
            let firmaDerecha = null;
            let sello = null;

            if (archivos.plantilla) {

                plantilla =
                    `/uploads/certificados/curso_${cursoId}/${archivos.plantilla[0].filename}`;

            }

            if (archivos.firma_izquierda) {

                firmaIzquierda =
                    `/uploads/certificados/curso_${cursoId}/${archivos.firma_izquierda[0].filename}`;

            }

            if (archivos.firma_derecha) {

                firmaDerecha =
                    `/uploads/certificados/curso_${cursoId}/${archivos.firma_derecha[0].filename}`;

            }

            if (archivos.sello) {

                sello =
                    `/uploads/certificados/curso_${cursoId}/${archivos.sello[0].filename}`;

            }

            const [existe] = await db.query(

                `
                SELECT id
                FROM certificados_curso
                WHERE curso_id=?
                LIMIT 1
                `,

                [cursoId]

            );

            if (existe.length === 0) {

                await db.query(

                    `
                    INSERT INTO certificados_curso(

                        curso_id,
                        plantilla,
                        firma_izquierda,
                        firma_derecha,
                        sello,
                        activo,
                        fecha_creacion

                    )

                    VALUES(?,?,?,?,?,1,NOW())
                    `,

                    [

                        cursoId,
                        plantilla,
                        firmaIzquierda,
                        firmaDerecha,
                        sello

                    ]

                );

            }

            else {

                const campos = [];
                const valores = [];

                if (plantilla) {

                    campos.push("plantilla=?");
                    valores.push(plantilla);

                }

                if (firmaIzquierda) {

                    campos.push("firma_izquierda=?");
                    valores.push(firmaIzquierda);

                }

                if (firmaDerecha) {

                    campos.push("firma_derecha=?");
                    valores.push(firmaDerecha);

                }

                if (sello) {

                    campos.push("sello=?");
                    valores.push(sello);

                }

                if (campos.length > 0) {

                    valores.push(cursoId);

                    await db.query(

                        `
                        UPDATE certificados_curso

                        SET ${campos.join(",")}

                        WHERE curso_id=?
                        `,

                        valores

                    );

                }

            }

            res.json({

                ok: true,
                mensaje: "Archivos cargados correctamente."

            });

        }

        catch (error) {

            console.error(error);

            res.status(500).json({

                ok: false,
                mensaje: "Error subiendo archivos.",
                error: error.message

            });

        }

    }

);

module.exports = router;