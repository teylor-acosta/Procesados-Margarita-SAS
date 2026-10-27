const express = require("express");
const router = express.Router();

const db = require("../DB");
const { proteger } = require("../middlewares/auth");

// ==========================================
// OBTENER PREGUNTAS
// ==========================================

router.get(
    "/api/preguntas-induccion/:evaluacionId",
    async(req,res)=>{

        try{

            const {evaluacionId}=req.params;

            const [preguntas]=await db.query(
                `
                SELECT *
                FROM preguntas_induccion
                WHERE evaluacion_id=?
                AND activo=1
                ORDER BY orden ASC
                `,
                [evaluacionId]
            );

            res.json({

                success:true,

                preguntas

            });

        }catch(error){

            console.error(error);

            res.json({

                success:false,

                mensaje:"Error al consultar."

            });

        }

    }
);

// ==========================================
// CREAR PREGUNTA
// ==========================================

router.post(
    "/api/preguntas-induccion",
    proteger,
    async(req,res)=>{

        try{

            const{

                capitulo_id,
                evaluacion_id,
                pregunta,
                opcion_a,
                opcion_b,
                opcion_c,
                opcion_d,
                respuesta_correcta,
                puntos,
                orden

            } = req.body;

            if(

                !capitulo_id ||
                !evaluacion_id ||
                !pregunta

            ){

                return res.json({

                    success:false,

                    mensaje:"Faltan datos."

                });

            }

            const [resultado]=await db.query(

                `

                INSERT INTO preguntas_induccion
                (

                    capitulo_id,
                    evaluacion_id,
                    pregunta,
                    opcion_a,
                    opcion_b,
                    opcion_c,
                    opcion_d,
                    respuesta_correcta,
                    puntos,
                    orden

                )

                VALUES
                (

                    ?,?,?,?,?,?,?,?,?,?

                )

                `,

                [

                    capitulo_id,
                    evaluacion_id,
                    pregunta,
                    opcion_a,
                    opcion_b,
                    opcion_c,
                    opcion_d,
                    respuesta_correcta,
                    puntos || 1,
                    orden || 1

                ]

            );

            res.json({

                success:true,

                id:resultado.insertId

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
// OBTENER PREGUNTA
// ==========================================

router.get(
    "/api/preguntas-induccion/pregunta/:id",
    proteger,
    async(req,res)=>{

        try{

            const{id}=req.params;

            const[[pregunta]]=await db.query(

                `

                SELECT *

                FROM preguntas_induccion

                WHERE id=?

                LIMIT 1

                `,

                [id]

            );

            res.json({

                success:true,

                pregunta

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
// ACTUALIZAR PREGUNTA
// ==========================================

router.put(
    "/api/preguntas-induccion/:id",
    proteger,
    async(req,res)=>{

        try{

            const{id}=req.params;

            const{

                pregunta,
                opcion_a,
                opcion_b,
                opcion_c,
                opcion_d,
                respuesta_correcta,
                puntos,
                orden,
                estado

            }=req.body;

            await db.query(

                `

                UPDATE preguntas_induccion

                SET

                    pregunta=?,

                    opcion_a=?,

                    opcion_b=?,

                    opcion_c=?,

                    opcion_d=?,

                    respuesta_correcta=?,

                    puntos=?,

                    orden=?,

                    estado=?

                WHERE id=?

                `,

                [

                    pregunta,
                    opcion_a,
                    opcion_b,
                    opcion_c,
                    opcion_d,
                    respuesta_correcta,
                    puntos,
                    orden,
                    estado,
                    id

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
// ELIMINAR PREGUNTA
// ==========================================

router.delete(
    "/api/preguntas-induccion/:id",
    proteger,
    async(req,res)=>{

        try{

            const{id}=req.params;

            await db.query(

                `

                UPDATE preguntas_induccion

                SET activo=0

                WHERE id=?

                `,

                [id]

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

module.exports = router;