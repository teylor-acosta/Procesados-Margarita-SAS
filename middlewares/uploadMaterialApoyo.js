const multer = require("multer");
const path = require("path");
const fs = require("fs");

// ==========================================
// CREAR CARPETA SI NO EXISTE
// ==========================================

const carpetaDestino = path.join(

    __dirname,

    "../public/uploads/material-apoyo"

);

if(!fs.existsSync(carpetaDestino)){

    fs.mkdirSync(

        carpetaDestino,

        {

            recursive:true

        }

    );

}

// ==========================================
// CONFIGURACIÓN
// ==========================================

const storage = multer.diskStorage({

    destination(req,file,cb){

        cb(

            null,

            carpetaDestino

        );

    },

    filename(req,file,cb){

        const nombre =

            Date.now()

            +

            "-"

            +

            file.originalname.replace(/\s+/g,"_");

        cb(

            null,

            nombre

        );

    }

});

// ==========================================
// VALIDAR ARCHIVOS
// ==========================================

const fileFilter = (req,file,cb)=>{

    const permitidos = [

        "application/pdf",

        "application/msword",

        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",

        "application/vnd.ms-powerpoint",

        "application/vnd.openxmlformats-officedocument.presentationml.presentation",

        "application/vnd.ms-excel",

        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"

    ];

    if(

        permitidos.includes(

            file.mimetype

        )

    ){

        cb(

            null,

            true

        );

    }else{

        cb(

            new Error(

                "Tipo de archivo no permitido."

            )

        );

    }

};

// ==========================================

module.exports = multer({

    storage,

    fileFilter,

    limits:{

        fileSize:

        50 *

        1024 *

        1024

    }

});