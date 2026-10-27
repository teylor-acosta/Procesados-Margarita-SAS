const express = require('express');
const router = express.Router();
const db = require('../DB');

router.get('/', async (req, res) => {

    try {

        const [[usuariosRegistrados]] = await db.query(`
            SELECT COUNT(*) total
            FROM usuarios
        `);

        const [[usuariosActivos]] = await db.query(`
            SELECT COUNT(*) total
            FROM usuarios
            WHERE bloqueado = 0
        `);

        const [[rolesConfigurados]] = await db.query(`
            SELECT COUNT(*) total
            FROM rol
            WHERE activo = 1
        `);

        const [[accesosHoy]] = await db.query(`
            SELECT COUNT(*) total
            FROM centro_actividad
            WHERE DATE(fecha)=CURDATE()
        `);

        const [[ultimoUsuario]] = await db.query(`
            SELECT Usuario
            FROM usuarios
            ORDER BY ID DESC
            LIMIT 1
        `);

        const [[permisosAsignados]] = await db.query(`
            SELECT COUNT(*) total
            FROM permisos_roles
            WHERE activo = 1
        `);

        const [[ultimoAcceso]] = await db.query(`
            SELECT
                Usuario,
                fecha_ultimo_login
            FROM usuarios
            WHERE fecha_ultimo_login IS NOT NULL
            ORDER BY fecha_ultimo_login DESC
            LIMIT 1
        `);

        const [[ultimaActividad]] = await db.query(`
            SELECT
                accion,
                fecha
            FROM centro_actividad
            ORDER BY fecha DESC
            LIMIT 1
        `);

        res.json({

            usuariosRegistrados:
                usuariosRegistrados.total,

            usuariosActivos:
                usuariosActivos.total,

            rolesConfigurados:
                rolesConfigurados.total,

            accesosHoy:
                accesosHoy.total,

            ultimoUsuario:
                ultimoUsuario?.Usuario || 'N/A',

            permisosAsignados:
                permisosAsignados.total,

            ultimoAcceso:
                ultimoAcceso?.fecha_ultimo_login || null,

            ultimaActividad:
                ultimaActividad?.accion || 'Sin registros'

        });

    } catch(error){

        console.error(error);

        res.status(500).json({
            error:error.message
        });

    }

});

module.exports = router;