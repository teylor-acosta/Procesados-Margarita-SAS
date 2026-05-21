const express = require('express');

const router = express.Router();

const db = require('../DB');


router.get('/api/empleado/:id', async (req, res) => {

    try {

        console.log('🔥 ENTRANDO');

        const id = req.params.id;

        const [rows] = await db.query(

            'SELECT * FROM empleados WHERE id = ?',

            [id]

        );

        console.log(rows);

        res.json({

            ok: true,

            empleado: rows[0]

        });

    } catch(error){

        console.log(error);

        res.status(500).json({

            ok: false,

            mensaje: 'Error servidor',

            error: error.message

        });

    }

});

module.exports = router;