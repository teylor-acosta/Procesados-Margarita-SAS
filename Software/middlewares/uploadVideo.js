const multer = require("multer");
const path = require("path");
const fs = require("fs");

// ==========================================
// CREAR CARPETA SI NO EXISTE
// ==========================================

const carpetaDestino = path.join(
    __dirname,
    "../public/uploads/videos/induccion"
);

if (!fs.existsSync(carpetaDestino)) {

    fs.mkdirSync(carpetaDestino, {
        recursive: true
    });

}

// ==========================================
// CONFIGURACIÓN
// ==========================================

const storage = multer.diskStorage({

    destination(req, file, cb) {

        cb(null, carpetaDestino);

    },

    filename(req, file, cb) {

        const nombre =

            Date.now() +
            "-" +
            file.originalname.replace(/\s+/g, "_");

        cb(null, nombre);

    }

});

// ==========================================
// VALIDAR SOLO VIDEOS
// ==========================================

const fileFilter = (req, file, cb) => {

    if (file.mimetype.startsWith("video/")) {

        cb(null, true);

    } else {

        cb(new Error("Solo se permiten videos."));

    }

};

// ==========================================

module.exports = multer({

    storage,

    fileFilter,

    limits: {

        fileSize: 1024 * 1024 * 500 // 500 MB

    }

});