const express = require('express');
const router = express.Router();
const path = require('path');

/* =========================================================
   💸 MÓDULO DE GASTOS DIARIOS
   ========================================================= */

// =========================================================
// 1. OBTENER GASTOS POR FECHA (Para la tabla principal)
// =========================================================
router.get('/api/gastos-diarios', async (req, res) => {
    const db = req.app.get('db');
    const fecha = req.query.fecha;

    if (!fecha) {
        return res.status(400).json({ ok: false, mensaje: 'Debe proporcionar una fecha.' });
    }

    try {
        const [rows] = await db.query(`
            SELECT 
                id, 
                codigo_gasto, 
                nombre_gasto, 
                monto, 
                DATE_FORMAT(fecha_registro, '%Y-%m-%d') AS fecha_registro, 
                prestamo_id 
            FROM gastos_diarios 
            WHERE fecha_registro = ?
            ORDER BY id DESC
        `, [fecha]);

        res.json({
            ok: true,
            data: rows
        });

    } catch (error) {
        console.error('❌ Error al obtener gastos diarios:', error);
        res.status(500).json({ ok: false, mensaje: 'Error al consultar la base de datos.' });
    }
});

// =========================================================
// 2. REGISTRAR UN NUEVO GASTO
// =========================================================
router.post('/api/gastos-diarios', async (req, res) => {
    const db = req.app.get('db');
    const {
        codigo_gasto,
        nombre_gasto,
        monto,
        fecha_registro,
        prestamo_id
    } = req.body;

    // Validaciones básicas
    if (!codigo_gasto || !nombre_gasto || !monto || !fecha_registro) {
        return res.status(400).json({ ok: false, mensaje: 'Faltan campos obligatorios.' });
    }

    try {
        const [result] = await db.query(`
            INSERT INTO gastos_diarios 
            (codigo_gasto, nombre_gasto, monto, fecha_registro, prestamo_id) 
            VALUES (?, ?, ?, ?, ?)
        `, [
            codigo_gasto,
            nombre_gasto,
            monto,
            fecha_registro,
            prestamo_id || null
        ]);

        res.status(201).json({
            ok: true,
            mensaje: 'Gasto registrado correctamente.',
            id: result.insertId
        });

    } catch (error) {
        console.error('❌ Error al guardar gasto:', error);
        res.status(500).json({ ok: false, mensaje: 'No se pudo guardar el gasto.' });
    }
});

// =========================================================
// 3. ELIMINAR UN GASTO
// =========================================================
router.delete('/api/gastos-diarios/:id', async (req, res) => {
    const db = req.app.get('db');
    const id = req.params.id;

    if (!id || isNaN(id)) {
        return res.status(400).json({ ok: false, mensaje: 'ID inválido.' });
    }

    try {
        const [result] = await db.query('DELETE FROM gastos_diarios WHERE id = ?', [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ ok: false, mensaje: 'El gasto no existe.' });
        }

        res.json({
            ok: true,
            mensaje: 'Gasto eliminado correctamente.'
        });

    } catch (error) {
        console.error('❌ Error al eliminar gasto:', error);
        res.status(500).json({ ok: false, mensaje: 'No se pudo eliminar el gasto.' });
    }
});

// =========================================================
// 4. OBTENER PRÉSTAMOS APROBADOS (Para el Select del formulario)
// =========================================================
router.get('/api/gastos-diarios/prestamos-aprobados', async (req, res) => {
    const db = req.app.get('db');

    try {
        const [rows] = await db.query(`
            SELECT 
                p.id, 
                p.monto, 
                e.nombre AS empleado_nombre 
            FROM nomina_prestamos p
            LEFT JOIN empleados e ON p.empleado_id = e.id
            WHERE p.estado = 'aprobado' 
              AND p.fecha_aprobacion = CURDATE()
        `);

        res.json({
            ok: true,
            data: rows
        });

    } catch (error) {
        console.warn('⚠️ No se pudieron cargar los préstamos:', error.message);
        res.json({ ok: true, data: [] }); 
    }
});

// =========================================================
// 5. IMPORTAR GASTOS MASIVAMENTE DESDE EXCEL
// =========================================================
router.post('/api/gastos-diarios/importar', async (req, res) => {
    const db = req.app.get('db');
    const { gastos } = req.body;

    if (!gastos || !Array.isArray(gastos) || gastos.length === 0) {
        return res.status(400).json({ ok: false, mensaje: 'No se enviaron datos válidos para importar.' });
    }

    let connection;
    try {
        connection = await db.getConnection();
        await connection.beginTransaction();

        const values = gastos.map(g => [
            g.codigo_gasto || g.Codigo || g.codigo || 'S/C', 
            g.nombre_gasto || g.Nombre || g.nombre || 'Sin nombre',
            parseFloat(g.monto || g.Monto || g.valor || 0),
            g.fecha_registro || g.Fecha || g.fecha || new Date().toISOString().split('T')[0],
            g.prestamo_id || null
        ]);

        await connection.query(
            `INSERT INTO gastos_diarios (codigo_gasto, nombre_gasto, monto, fecha_registro, prestamo_id) VALUES ?`,
            [values]
        );

        await connection.commit();
        res.json({ 
            ok: true, 
            mensaje: `${values.length} gastos importados correctamente.` 
        });

    } catch (error) {
        if (connection) await connection.rollback();
        console.error('❌ Error al importar Excel:', error);
        res.status(500).json({ ok: false, mensaje: 'Error al insertar los datos en la base de datos.' });
    } finally {
        if (connection) connection.release();
    }
});

// =========================================================
// 6. EXPORTAR GASTOS A CSV (CORREGIDO)
// =========================================================
router.get('/api/gastos-diarios/exportar', async (req, res) => {
    const db = req.app.get('db');
    const fecha = req.query.fecha;

    if (!fecha) {
        return res.status(400).json({ ok: false, mensaje: 'Debe proporcionar una fecha para exportar.' });
    }

    try {
        const [rows] = await db.query(`
            SELECT 
                id, 
                codigo_gasto, 
                nombre_gasto, 
                monto, 
                DATE_FORMAT(fecha_registro, '%Y-%m-%d') AS fecha_registro, 
                prestamo_id 
            FROM gastos_diarios 
            WHERE fecha_registro = ?
            ORDER BY id DESC
        `, [fecha]);

        // --- CONSTRUCCIÓN DEL CSV ---
        // Usamos coma (,) como separador estándar para Excel
        let csv = '\uFEFF'; // BOM para UTF-8 (acentos)
        csv += 'ID,Codigo,Descripcion,Monto,Fecha,Prestamo_ID\n';
        
        rows.forEach(r => {
            // Limpiamos comillas dobles dentro del texto para evitar errores
            const codigo = String(r.codigo_gasto || '').replace(/"/g, '""');
            const nombre = String(r.nombre_gasto || '').replace(/"/g, '""');
            
            csv += `${r.id},"${codigo}","${nombre}",${r.monto},${r.fecha_registro},${r.prestamo_id || ''}\n`;
        });

        // --- ENCABEZADOS DE DESCARGA ---
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="gastos_${fecha}.csv"`);
        
        return res.status(200).send(csv);

    } catch (error) {
        console.error('❌ Error al exportar CSV:', error);
        return res.status(500).json({ ok: false, mensaje: 'Error al generar el archivo.' });
    }
});

/* =========================================================
   🖥️ RUTA PARA MOSTRAR LA VISTA HTML
   ========================================================= */
router.get('/nomina/gastos-diarios', (req, res) => {
    if (!req.session || !req.session.usuarioID) {
        return res.redirect('/login');
    }
    
    res.sendFile(path.join(__dirname, '../public/gastos-diarios.html'));
});

module.exports = router;