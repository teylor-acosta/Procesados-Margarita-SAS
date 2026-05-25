const express = require('express');

const router = express.Router();

const { proteger } = require('../middlewares/auth');


// ============================================
// 🔥 OBTENER AREAS
// ============================================

router.get('/api/areas', async (req, res) => {

    try{

        const db = req.app.get('db');

        const [results] = await db.query(`

            SELECT 
                id,
                nombre
            FROM areas
            ORDER BY nombre ASC

        `);

        res.json(results);

    }catch(error){

        console.error(error);

        res.json([]);

    }

});


// ============================================
// 🔥 OBTENER SEDES
// ============================================

router.get('/api/sedes', async (req, res) => {

    try{

        const db = req.app.get('db');

        const [results] = await db.query(`

            SELECT
                id,
                nombre
            FROM sedes
            ORDER BY nombre ASC

        `);

        res.json(results);

    }catch(error){

        console.error(error);

        res.json([]);

    }

});


// ============================================
// 🔥 OBTENER CARGOS
// ============================================

router.get('/api/cargos', async (req, res) => {

    try{

        const db = req.app.get('db');

        const [results] = await db.query(`

            SELECT
                id,
                nombre
            FROM cargos
            ORDER BY nombre ASC

        `);

        res.json(results);

    }catch(error){

        console.error(error);

        res.json([]);

    }

});


// ============================================
// 🔥 TODOS LOS CATALOGOS
// ============================================

router.get('/api/catalogos', async (req, res) => {

    try{

        const db = req.app.get('db');

        const [areas] = await db.query(`

            SELECT
                id,
                nombre
            FROM areas
            ORDER BY nombre ASC

        `);

        const [sedes] = await db.query(`

            SELECT
                id,
                nombre
            FROM sedes
            ORDER BY nombre ASC

        `);

        const [cargos] = await db.query(`

            SELECT
                id,
                nombre
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

            areas:[],
            sedes:[],
            cargos:[]

        });

    }

});


// ============================================
// 🔥 CREAR AREA
// ============================================

router.post('/api/areas', async (req, res) => {

    try{

        const { nombre } = req.body;

        const db = req.app.get('db');

        await db.query(`

            INSERT INTO areas(nombre)
            VALUES(?)

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

});


// ============================================
// 🔥 CREAR SEDE
// ============================================

router.post('/api/sedes', async (req, res) => {

    try{

        const { nombre } = req.body;

        const db = req.app.get('db');

        await db.query(`

            INSERT INTO sedes(nombre)
            VALUES(?)

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

});


// ============================================
// 🔥 CREAR CARGO
// ============================================

router.post('/api/cargos', async (req, res) => {

    try{

        const { nombre } = req.body;

        const db = req.app.get('db');

        await db.query(`

            INSERT INTO cargos(nombre)
            VALUES(?)

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

});


// ============================================
// 🔥 EDITAR AREA
// ============================================

router.put('/api/catalogos/area/:id', async (req, res) => {

    try{

        const { id } = req.params;

        const { nombre } = req.body;

        const db = req.app.get('db');

        await db.query(`

            UPDATE areas
            SET nombre = ?
            WHERE id = ?

        `,[nombre, id]);

        res.json({

            success:true

        });

    }catch(error){

        console.error(error);

        res.status(500).json({

            success:false

        });

    }

});


// ============================================
// 🔥 EDITAR SEDE
// ============================================

router.put('/api/catalogos/sede/:id', async (req, res) => {

    try{

        const { id } = req.params;

        const { nombre } = req.body;

        const db = req.app.get('db');

        await db.query(`

            UPDATE sedes
            SET nombre = ?
            WHERE id = ?

        `,[nombre, id]);

        res.json({

            success:true

        });

    }catch(error){

        console.error(error);

        res.status(500).json({

            success:false

        });

    }

});


// ============================================
// 🔥 EDITAR CARGO
// ============================================

router.put('/api/catalogos/cargo/:id', async (req, res) => {

    try{

        const { id } = req.params;

        const { nombre } = req.body;

        const db = req.app.get('db');

        await db.query(`

            UPDATE cargos
            SET nombre = ?
            WHERE id = ?

        `,[nombre, id]);

        res.json({

            success:true

        });

    }catch(error){

        console.error(error);

        res.status(500).json({

            success:false

        });

    }

});


// ============================================
// 🔥 CAMBIAR ESTADO
// ============================================

router.put('/api/catalogos/estado/:tipo/:id', async (req, res) => {

    try{

        const { tipo } = req.params;

        const { id } = req.params;

        let tabla = '';

        if(tipo === 'area'){

            tabla = 'areas';

        }

        if(tipo === 'sede'){

            tabla = 'sedes';

        }

        if(tipo === 'cargo'){

            tabla = 'cargos';

        }

        if(!tabla){

            return res.status(400).json({

                success:false

            });

        }


        // ====================================
        // 🔥 ELIMINAR
        // ====================================

        const db = req.app.get('db');

        await db.query(`

            DELETE FROM ${tabla}
            WHERE id = ?

        `,[id]);

        res.json({

            success:true

        });

    }catch(error){

        console.error(error);

        res.status(500).json({

            success:false

        });

    }

});


module.exports = router;