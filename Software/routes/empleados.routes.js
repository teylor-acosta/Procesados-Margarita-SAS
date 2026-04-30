const express = require('express');
const router = express.Router();

const { proteger, soloSuperAdmin } = require('../middlewares/auth');

// ============================================
// 🔥 LISTAR SOLO ACTIVOS
// ============================================

router.get('/api/empleados', proteger, soloSuperAdmin, (req, res) => {

    const db = req.app.get('db');

    const sql = `
    SELECT e.*, 
           a.nombre AS area,
           s.nombre AS sede,
           c.nombre AS cargo
    FROM empleados e
    LEFT JOIN areas a ON e.area_id = a.id
    LEFT JOIN sedes s ON e.sede_id = s.id
    LEFT JOIN cargos c ON e.cargo_id = c.id
    WHERE e.activo = 'SI'   -- 🔥 CLAVE
    `;

    db.query(sql, (err, results) => {
        if (err) return res.json([]);
        res.json(results);
    });

});


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
            res.json({ success: true });
        }
    );
});


// ============================================
// 🔥 EMPLEADOS INACTIVOS
// ============================================

router.get('/api/empleados-inactivos', (req, res) => {

    const db = req.app.get('db');

    const sql = `
    SELECT 
        e.*,
        a.nombre AS area,
        s.nombre AS sede,
        c.nombre AS cargo
    FROM empleados e
    LEFT JOIN areas a ON e.area_id = a.id
    LEFT JOIN sedes s ON e.sede_id = s.id
    LEFT JOIN cargos c ON e.cargo_id = c.id
    WHERE e.activo = 'NO'
    `;

    db.query(sql, (err, results) => {
        if (err) return res.json([]);
        res.json(results);
    });

});


// ============================================
// 🔥 CREAR
// ============================================

router.post('/api/crear-empleado', proteger, soloSuperAdmin, (req, res) => {

    const db = req.app.get('db');
    const e = req.body;

    db.query("SELECT codigo FROM empleados ORDER BY id DESC LIMIT 1", (err, result) => {

        if (err) {
            console.error(err);
            return res.json({ success: false });
        }

        let nuevoCodigo = "EMP1";

        if (result.length > 0 && result[0].codigo) {

            const ultimo = result[0].codigo;
            const numero = parseInt(ultimo.replace("EMP", "")) || 0;

            nuevoCodigo = "EMP" + (numero + 1);
        }

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
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'SI')
        `;

        db.query(sql, [
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
        ], (err) => {

            if (err) {
                console.error(err);
                return res.json({ success: false });
            }

            res.json({
                success: true,
                codigo: nuevoCodigo
            });

        });

    });

});


// ============================================
// 🔥 FILTROS
// ============================================

router.get('/api/filtros-empleado', proteger, soloSuperAdmin, (req, res) => {

    const db = req.app.get('db');

    const data = {};

    db.query("SELECT id, nombre FROM areas", (err, areas) => {
        data.areas = areas || [];

        db.query("SELECT id, nombre FROM sedes", (err, sedes) => {
            data.sedes = sedes || [];

            db.query("SELECT id, nombre FROM cargos", (err, cargos) => {
                data.cargos = cargos || [];

                res.json(data);
            });
        });
    });

});

module.exports = router;