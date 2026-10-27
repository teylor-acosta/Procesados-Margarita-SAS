const express = require('express');

const router = express.Router();

const { proteger } = require('../middlewares/auth');


// ============================================
// 🔥 GET AREAS
// ============================================

router.get(
    '/api/areas',
    proteger,

    async (req, res) => {

        try{

            const db =
                req.app.get('db');

            const [results] =
                await db.query(`

                    SELECT
                        id,
                        nombre,
                        activo

                    FROM areas

                    ORDER BY nombre ASC

                `);

            res.json(results);

        }catch(error){

            console.error(error);

            res.json([]);

        }

    }
);


// ============================================
// 🔥 GET SEDES
// ============================================

router.get(
    '/api/sedes',
    proteger,

    async (req, res) => {

        try{

            const db =
                req.app.get('db');

            const [results] =
                await db.query(`

                    SELECT
                        id,
                        nombre,
                        activo

                    FROM sedes

                    ORDER BY nombre ASC

                `);

            res.json(results);

        }catch(error){

            console.error(error);

            res.json([]);

        }

    }
);


// ============================================
// 🔥 GET CARGOS
// ============================================

router.get(
    '/api/cargos',
    proteger,

    async (req, res) => {

        try{

            const db =
                req.app.get('db');

            const [results] =
                await db.query(`

                    SELECT
                        id,
                        nombre,
                        activo

                    FROM cargos

                    ORDER BY nombre ASC

                `);

            res.json(results);

        }catch(error){

            console.error(error);

            res.json([]);

        }

    }
);


// ============================================
// 🔥 TODOS LOS CATALOGOS
// ============================================

router.get(
    '/api/catalogos',
    proteger,

    async (req, res) => {

        try{

            const db =
                req.app.get('db');

            const [areas] =
                await db.query(`

                    SELECT
                        id,
                        nombre,
                        activo

                    FROM areas

                    ORDER BY nombre ASC

                `);

            const [sedes] =
                await db.query(`

                    SELECT
                        id,
                        nombre,
                        activo

                    FROM sedes

                    ORDER BY nombre ASC

                `);

            const [cargos] =
                await db.query(`

                    SELECT
                        id,
                        nombre,
                        activo

                    FROM cargos

                    ORDER BY nombre ASC

                `);

            res.json({

                areas,
                sedes,
                cargos

            });

        }catch(error){

            console.error(error);

            res.status(500).json({

                areas: [],
                sedes: [],
                cargos: []

            });

        }

    }
);


// ============================================
// 🔥 CREAR AREA
// ============================================

router.post(
    '/api/areas',
    proteger,

    async (req, res) => {

        try{

            const db =
                req.app.get('db');

            const { nombre } =
                req.body;

            await db.query(`

                INSERT INTO areas
                (
                    nombre,
                    activo
                )

                VALUES
                (
                    ?,
                    'SI'
                )

            `,[nombre]);

            res.json({

                success:true

            });

        }catch(error){

            console.error(error);

            res.status(500).json({

                success:false

            });

        }

    }
);


// ============================================
// 🔥 CREAR SEDE
// ============================================

router.post(
    '/api/sedes',
    proteger,

    async (req, res) => {

        try{

            const db =
                req.app.get('db');

            const { nombre } =
                req.body;

            await db.query(`

                INSERT INTO sedes
                (
                    nombre,
                    activo
                )

                VALUES
                (
                    ?,
                    'SI'
                )

            `,[nombre]);

            res.json({

                success:true

            });

        }catch(error){

            console.error(error);

            res.status(500).json({

                success:false

            });

        }

    }
);


// ============================================
// 🔥 CREAR CARGO
// ============================================

router.post(
    '/api/cargos',
    proteger,

    async (req, res) => {

        try{

            const db =
                req.app.get('db');

            const { nombre } =
                req.body;

            await db.query(`

                INSERT INTO cargos
                (
                    nombre,
                    activo
                )

                VALUES
                (
                    ?,
                    'SI'
                )

            `,[nombre]);

            res.json({

                success:true

            });

        }catch(error){

            console.error(error);

            res.status(500).json({

                success:false

            });

        }

    }
);


// ============================================
// 🔥 EDITAR AREA
// ============================================

router.put(
    '/api/catalogos/area/:id',
    proteger,

    async (req, res) => {

        try{

            const db =
                req.app.get('db');

            const { nombre } =
                req.body;

            const { id } =
                req.params;

            await db.query(`

                UPDATE areas

                SET nombre = ?

                WHERE id = ?

            `,[nombre,id]);

            res.json({

                success:true

            });

        }catch(error){

            console.error(error);

            res.status(500).json({

                success:false

            });

        }

    }
);


// ============================================
// 🔥 EDITAR SEDE
// ============================================

router.put(
    '/api/catalogos/sede/:id',
    proteger,

    async (req, res) => {

        try{

            const db =
                req.app.get('db');

            const { nombre } =
                req.body;

            const { id } =
                req.params;

            await db.query(`

                UPDATE sedes

                SET nombre = ?

                WHERE id = ?

            `,[nombre,id]);

            res.json({

                success:true

            });

        }catch(error){

            console.error(error);

            res.status(500).json({

                success:false

            });

        }

    }
);


// ============================================
// 🔥 EDITAR CARGO
// ============================================

router.put(
    '/api/catalogos/cargo/:id',
    proteger,

    async (req, res) => {

        try{

            const db =
                req.app.get('db');

            const { nombre } =
                req.body;

            const { id } =
                req.params;

            await db.query(`

                UPDATE cargos

                SET nombre = ?

                WHERE id = ?

            `,[nombre,id]);

            res.json({

                success:true

            });

        }catch(error){

            console.error(error);

            res.status(500).json({

                success:false

            });

        }

    }
);


// ============================================
// 🔥 CAMBIAR ESTADO AREA
// ============================================

router.put(
    '/api/catalogos/estado/area/:id',
    proteger,

    async (req, res) => {

        try{

            const db =
                req.app.get('db');

            const { id } =
                req.params;

            const [[area]] =
                await db.query(`

                    SELECT activo

                    FROM areas

                    WHERE id = ?

                `,[id]);

            const nuevoEstado =

                area.activo == 'SI'
                ? 'NO'
                : 'SI';

            await db.query(`

                UPDATE areas

                SET activo = ?

                WHERE id = ?

            `,[nuevoEstado,id]);

            res.json({

                success:true

            });

        }catch(error){

            console.error(error);

            res.status(500).json({

                success:false

            });

        }

    }
);


// ============================================
// 🔥 CAMBIAR ESTADO SEDE
// ============================================

router.put(
    '/api/catalogos/estado/sede/:id',
    proteger,

    async (req, res) => {

        try{

            const db =
                req.app.get('db');

            const { id } =
                req.params;

            const [[sede]] =
                await db.query(`

                    SELECT activo

                    FROM sedes

                    WHERE id = ?

                `,[id]);

            const nuevoEstado =

                sede.activo == 'SI'
                ? 'NO'
                : 'SI';

            await db.query(`

                UPDATE sedes

                SET activo = ?

                WHERE id = ?

            `,[nuevoEstado,id]);

            res.json({

                success:true

            });

        }catch(error){

            console.error(error);

            res.status(500).json({

                success:false

            });

        }

    }
);


// ============================================
// 🔥 CAMBIAR ESTADO CARGO
// ============================================

router.put(
    '/api/catalogos/estado/cargo/:id',
    proteger,

    async (req, res) => {

        try{

            const db =
                req.app.get('db');

            const { id } =
                req.params;

            const [[cargo]] =
                await db.query(`

                    SELECT activo

                    FROM cargos

                    WHERE id = ?

                `,[id]);

            const nuevoEstado =

                cargo.activo == 'SI'
                ? 'NO'
                : 'SI';

            await db.query(`

                UPDATE cargos

                SET activo = ?

                WHERE id = ?

            `,[nuevoEstado,id]);

            res.json({

                success:true

            });

        }catch(error){

            console.error(error);

            res.status(500).json({

                success:false

            });

        }

    }
);

// ============================================
// 🔥 ESTADISTICAS ERP
// ============================================

router.get(
    '/api/dashboard-estadisticas',
    proteger,

    async (req, res) => {

        try{

            const db =
                req.app.get('db');


            // ====================================
            // 🔥 EMPLEADOS
            // ====================================

            const [[empleados]] =
                await db.query(`

                    SELECT COUNT(*) total

                    FROM empleados

                    WHERE activo = 'ACTIVO'

                `);


            // ====================================
            // 🔥 DOCUMENTOS
            // ====================================

            let totalDocumentos = 0;

            try{

                const [[documentos]] =
                    await db.query(`

                        SELECT COUNT(*) total

                        FROM documentos_empleados

                    `);

                totalDocumentos =
                    documentos.total || 0;

            }catch{


                totalDocumentos = 0;

            }


            // ====================================
            // 🔥 ACTIVIDAD
            // ====================================

            let totalActividad = 0;

            try{

                const [[actividad]] =
                    await db.query(`

                        SELECT COUNT(*) total

                        FROM logs_sistema

                    `);

                totalActividad =
                    actividad.total || 0;

            }catch{

                totalActividad = 0;

            }


            // ====================================
            // 🔥 RESPONSE
            // ====================================

            res.json({

                success:true,

                empleados:
                    empleados.total || 0,

                documentos:
                    totalDocumentos,

                actividad:
                    totalActividad

            });

        }catch(error){

            console.error(error);

            res.status(500).json({

                success:false

            });

        }

    }
);
module.exports = router;