const multer = require("multer");
const path = require("path");
const fs = require("fs");

const carpetaDestino = path.join(
    __dirname,
    "../public/uploads/capacitaciones"
);

if (!fs.existsSync(carpetaDestino)) {

    fs.mkdirSync(carpetaDestino, {
        recursive: true
    });

}

const storage = multer.diskStorage({

    destination(req, file, cb) {

        cb(null, carpetaDestino);

    },

    filename(req, file, cb) {

        cb(

            null,

            Date.now() +
            "-" +
            file.originalname.replace(/\s+/g, "_")

        );

    }

});

const fileFilter = (req, file, cb) => {

    if (file.mimetype.startsWith("image/")) {

        cb(null, true);

    } else {

        cb(new Error("Solo imágenes"));

    }

};

module.exports = multer({

    storage,

    fileFilter,

    limits: {

        fileSize: 5 * 1024 * 1024

    }

});