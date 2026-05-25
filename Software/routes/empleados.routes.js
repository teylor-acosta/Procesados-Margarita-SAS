const express = require('express');
const router = express.Router();
const path = require('path');
const { proteger, soloSuperAdmin } = require('../middlewares/auth');
const db = require('../DB');

// ============================================
// 🔥 LISTAR SOLO ACTIVOS
// ============================================

router.get(

    '/api/empleados',

    proteger,

    soloSuperAdmin,

    async (req, res) => {

        try {

            const db = req.app.get('db');

            const sql = `

                SELECT 

                    e.*, 
                    a.nombre AS area,
                    s.nombre AS sede,
                    c.nombre AS cargo

                FROM empleados e

                LEFT JOIN areas a
                ON e.area_id = a.id

                LEFT JOIN sedes s
                ON e.sede_id = s.id

                LEFT JOIN cargos c
                ON e.cargo_id = c.id

                WHERE e.activo = 'SI'

            `;

            const [results] =
                await db.query(sql);

            res.json(results);

        } catch(error) {

            console.log(error);

            res.status(500).json([]);

        }

    }

);


// ============================================
// 🔥 ACTUALIZAR
// ============================================

router.put('/api/actualizar-empleado', (req, res) => {

    const db = req.app.get('db');
    const e = req.body;

    const sql = `
    UPDATE empleados SET
        nombre=?,
        tipo_documento=?,
        numero_documento=?,
        rh=?,
        fecha_nacimiento=?,
        lugar_nacimiento=?,
        estado_civil=?,
        direccion=?,
        barrio_localidad=?,
        telefono=?,
        email=?,
        area_id=?,
        sede_id=?,
        cargo_id=?
    WHERE id=?
    `;

    db.query(sql, [
        e.nombre,
        e.tipo_documento,
        e.numero_documento,
        e.rh,
        e.fecha_nacimiento,
        e.lugar_nacimiento,
        e.estado_civil,
        e.direccion,
        e.barrio_localidad,
        e.telefono,
        e.email,
        e.area_id,
        e.sede_id,
        e.cargo_id,
        e.id
    ], (err) => {

        if (err) return res.json({ success: false });
        // ============================================
// 🔥 REGISTRAR ACTIVIDAD
// ============================================

db.query(

    `INSERT INTO centro_actividad (

        empleado_id,
        usuario_id,
        accion,
        modulo,
        descripcion,
        color,
        icono

    )

    VALUES (?, ?, ?, ?, ?, ?, ?)`,
    
    [

        e.id,
        req.session.usuario?.id || null,
        'ACTUALIZAR',
        'EMPLEADOS',
        `Se actualizó el empleado ${e.nombre}`,
        'azul',
        'fa-pen'

    ]

);
        res.json({ success: true });
    });
});


// ============================================
// 🔥 DESACTIVAR
// ============================================

router.put('/api/desactivar-empleado', (req, res) => {

    const db = req.app.get('db');

    db.query(
        "UPDATE empleados SET activo='NO' WHERE id=?",
        [req.body.id],
        err => {
            if (err) return res.json({ success: false });
            // ============================================
// 🔥 REGISTRAR ACTIVIDAD
// ============================================

db.query(

    `INSERT INTO centro_actividad (

        empleado_id,
        usuario_id,
        accion,
        modulo,
        descripcion,
        color,
        icono

    )

    VALUES (?, ?, ?, ?, ?, ?, ?)`,
    
    [

        req.body.id,
        req.session.usuario?.id || null,
        'DESACTIVAR',
        'EMPLEADOS',
        'Empleado desactivado',
        'rojo',
        'fa-user-slash'

    ]

);
            res.json({ success: true });
        }
    );
});


// ============================================
// 🔥 ACTIVAR
// ============================================

router.put('/api/activar-empleado', (req, res) => {

    const db = req.app.get('db');

    db.query(
        "UPDATE empleados SET activo='SI' WHERE id=?",
        [req.body.id],
        err => {
            if (err) return res.json({ success: false });
            // ============================================
// 🔥 REGISTRAR ACTIVIDAD
// ============================================

db.query(

    `INSERT INTO centro_actividad (

        empleado_id,
        usuario_id,
        accion,
        modulo,
        descripcion,
        color,
        icono

    )

    VALUES (?, ?, ?, ?, ?, ?, ?)`,

    [

        req.body.id,

        req.session.usuario?.id || null,

        'ACTIVAR',

        'EMPLEADOS',

        'Se reactivó un empleado',

        'verde',

        'fa-user-check'

    ]

);
            res.json({ success: true });
        }
    );
});


// ============================================
// 🔥 EMPLEADOS INACTIVOS
// ============================================

router.get(

    '/api/empleados-inactivos',

    async (req, res) => {

        try {

            const db = req.app.get('db');

            const sql = `

                SELECT 
                    e.*,
                    a.nombre AS area,
                    s.nombre AS sede,
                    c.nombre AS cargo

                FROM empleados e

                LEFT JOIN areas a
                ON e.area_id = a.id

                LEFT JOIN sedes s
                ON e.sede_id = s.id

                LEFT JOIN cargos c
                ON e.cargo_id = c.id

                WHERE e.activo = 'NO'

            `;

            const [results] =
                await db.query(sql);

            res.json(results);

        } catch(error) {

            console.log(error);

            res.status(500).json([]);

        }

    }

);

// ============================================
// 🔥 CREAR
// ============================================

router.post(
    '/api/crear-empleado',
    proteger,
    soloSuperAdmin,
    async (req, res) => {

        try {

            const db = req.app.get('db');
            const e = req.body;

            // ============================================
            // 🔥 OBTENER ÚLTIMO CÓDIGO
            // ============================================

            const [rows] = await db.query(
                "SELECT codigo FROM empleados ORDER BY id DESC LIMIT 1"
            );

            let nuevoCodigo = "EMP1";

            if (rows.length > 0 && rows[0].codigo) {

                const ultimo = rows[0].codigo;

                const numero =
                    parseInt(
                        ultimo.replace("EMP", "")
                    ) || 0;

                nuevoCodigo =
                    "EMP" + (numero + 1);

            }

            // ============================================
            // 🔥 INSERTAR EMPLEADO
            // ============================================

            const sql = `

                INSERT INTO empleados (

                    codigo,
                    nombre,
                    tipo_documento,
                    numero_documento,
                    rh,
                    fecha_nacimiento,
                    lugar_nacimiento,
                    estado_civil,
                    direccion,
                    barrio_localidad,
                    telefono,
                    email,
                    area_id,
                    sede_id,
                    cargo_id,
                    activo

                )

                VALUES (

                    ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'SI'

                )

            `;

            const [result] = await db.query(

                sql,

                [
                    nuevoCodigo,
                    e.nombre,
                    e.tipo_documento,
                    e.numero_documento,
                    e.rh,
                    e.fecha_nacimiento,
                    e.lugar_nacimiento,
                    e.estado_civil,
                    e.direccion,
                    e.barrio_localidad,
                    e.telefono,
                    e.email,
                    e.area_id || null,
                    e.sede_id || null,
                    e.cargo_id || null
                ]

            );

            // ============================================
            // 🔥 REGISTRAR ACTIVIDAD
            // ============================================

            await db.query(

                `

                INSERT INTO centro_actividad (

                    empleado_id,
                    usuario_id,
                    accion,
                    modulo,
                    descripcion,
                    color,
                    icono

                )

                VALUES (?, ?, ?, ?, ?, ?, ?)

                `,

                [

                    result.insertId,

                    req.session.usuarioID || null,

                    'CREAR',

                    'EMPLEADOS',

                    `Se creó el empleado ${e.nombre}`,

                    'verde',

                    'fa-user-plus'

                ]

            );

            // ============================================
            // 🔥 RESPUESTA
            // ============================================

            res.json({

                success: true,

                codigo: nuevoCodigo

            });

        } catch(error){

            console.log(error);

            res.status(500).json({

                success: false,

                error: error.message

            });

        }

    }

);

// ============================================
// 🔥 FILTROS
// ============================================

router.get(

    '/api/filtros-empleado',

    proteger,

    soloSuperAdmin,

    async (req, res) => {

        try {

            const db = req.app.get('db');

            // ============================================
            // 🔥 ÁREAS
            // ============================================

            const [areas] = await db.query(
                "SELECT id, nombre FROM areas"
            );

            // ============================================
            // 🔥 SEDES
            // ============================================

            const [sedes] = await db.query(
                "SELECT id, nombre FROM sedes"
            );

            // ============================================
            // 🔥 CARGOS
            // ============================================

            const [cargos] = await db.query(
                "SELECT id, nombre FROM cargos"
            );

            // ============================================
            // 🔥 RESPUESTA
            // ============================================

            res.json({

                areas,
                sedes,
                cargos

            });

        } catch(error){

            console.log(error);

            res.status(500).json({

                success: false,
                error: error.message

            });

        }

    }

);
/* =========================================
   🔥 OBTENER EMPLEADO POR ID
========================================= */

router.get('/api/empleado/:id', async (req, res) => {

    try {

        const { id } = req.params;

        const sql = `

            SELECT 

                e.*,

                a.nombre AS area,
                s.nombre AS sede,
                c.nombre AS cargo

            FROM empleados e

            LEFT JOIN areas a
            ON e.area_id = a.id

            LEFT JOIN sedes s
            ON e.sede_id = s.id

            LEFT JOIN cargos c
            ON e.cargo_id = c.id

            WHERE e.id = ?

        `;

        const [results] = await db.query(sql, [id]);

        if (results.length === 0) {

            return res.json({
                ok: false,
                mensaje: 'Empleado no encontrado'
            });

        }

        res.json({
            ok: true,
            empleado: results[0]
        });

    } catch (error) {

        console.log(error);

        res.status(500).json({
            ok: false,
            mensaje: 'Error servidor',
            error: error.message
        });

    }

});

module.exports = router;