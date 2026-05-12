const express = require('express');
const router = express.Router();
const path = require('path');

const db = require('../DB');


/* =========================================
   📄 VISTA
========================================= */

router.get('/documentacion-empleados', (req, res) => {

    res.sendFile(
        path.join(__dirname, '../public/documentacion-empleados.html')
    );

});


/* =========================================
   🔥 API EMPLEADOS DOCUMENTACION
========================================= */

router.get('/api/documentacion-empleados', (req, res) => {

    const sql = `
    
        SELECT 
            e.id,
            e.codigo,
            e.nombre,
            e.numero_documento,
            e.tipo_documento,
            e.rh,
            e.fecha_nacimiento,
            e.lugar_nacimiento,
            e.estado_civil,
            e.direccion,
            e.barrio_localidad,
            e.telefono,
            e.email,
            e.foto,
            e.activo,

            c.nombre AS cargo,
            a.nombre AS area,
            s.nombre AS sede

        FROM empleados e

        LEFT JOIN cargos c
        ON e.cargo_id = c.id

        LEFT JOIN areas a
        ON e.area_id = a.id

        LEFT JOIN sedes s
        ON e.sede_id = s.id

        WHERE e.activo = 'SI'

        ORDER BY e.nombre ASC
    
    `;

    db.query(sql, (error, resultados) => {

        if (error) {

            console.log("🔥 ERROR SQL:");
            console.log(error);

            return res.status(500).json({
                ok:false,
                mensaje:'Error servidor'
            });

        }

        const empleados = resultados.map(emp => {

            let progreso = Math.floor(Math.random() * 100);

            let estadoDocumental = 'Pendiente';
            let colorEstado = 'warning';

            if (progreso >= 100) {

                estadoDocumental = 'Completo';
                colorEstado = 'success';

            }

            if (progreso <= 40) {

                estadoDocumental = 'Incompleto';
                colorEstado = 'danger';

            }

            return {

                ...emp,

                progreso,
                estadoDocumental,
                colorEstado

            };

        });

        res.json({

            ok:true,
            empleados

        });

    });

});


module.exports = router;