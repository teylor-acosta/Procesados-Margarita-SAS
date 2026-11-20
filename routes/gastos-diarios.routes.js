
const express = require('express');
const router = express.Router();
const path = require('path');

/* =========================================================
   PROCESADOS MARGARITA S.A.S.
   MÓDULO DE GASTOS DIARIOS (INGRESOS Y EGRESOS)
   ========================================================= */

// ============================================================
// 1. OBTENER MOVIMIENTOS POR FECHA
// ============================================================

router.get('/api/gastos-diarios', async (req, res) => {
    const db = req.app.get('db');
    const fecha = req.query.fecha;

    if (!fecha) {
        return res.status(400).json({
            ok: false,
            mensaje: 'Debe proporcionar una fecha.'
        });
    }

    try {
        const [rows] = await db.query(`
            SELECT
                id,
                codigo_gasto,
                nombre_gasto,
                tipo,
                categoria,
                monto,
                DATE_FORMAT(fecha_registro, '%Y-%m-%d') AS fecha_registro,
                prestamo_id,
                origen,
                novedad_id
            FROM gastos_diarios
            WHERE fecha_registro = ?
            ORDER BY id DESC
        `, [fecha]);

        let totalIngresos = 0;
        let totalEgresos = 0;

        rows.forEach(r => {
            const monto = parseFloat(r.monto) || 0;

            if ((r.tipo || 'EGRESO') === 'INGRESO') {
                totalIngresos += monto;
            } else {
                totalEgresos += monto;
            }
        });

        res.json({
            ok: true,
            data: rows,
            resumen: {
                ingresos: totalIngresos,
                egresos: totalEgresos,
                saldo: totalIngresos - totalEgresos
            }
        });

    } catch (error) {
        console.error(
            'Error al obtener movimientos diarios:',
            error
        );

        res.status(500).json({
            ok: false,
            mensaje: 'Error al consultar la base de datos.'
        });
    }
});

// ============================================================
// 2. REGISTRAR UN NUEVO MOVIMIENTO
// ============================================================

router.post('/api/gastos-diarios', async (req, res) => {
    const db = req.app.get('db');

    const {
        codigo_gasto,
        nombre_gasto,
        tipo,
        categoria,
        monto,
        fecha_registro,
        prestamo_id,
        origen,
        novedad_id
    } = req.body;

    if (
        !codigo_gasto ||
        !nombre_gasto ||
        monto === undefined ||
        monto === null ||
        monto === '' ||
        !fecha_registro
    ) {
        return res.status(400).json({
            ok: false,
            mensaje: 'Faltan campos obligatorios.'
        });
    }

    const montoNumerico = Number(monto);

    if (!Number.isFinite(montoNumerico) || montoNumerico <= 0) {
        return res.status(400).json({
            ok: false,
            mensaje: 'El monto debe ser un número mayor que cero.'
        });
    }

    const tipoFinal =
        String(tipo || '').toUpperCase() === 'INGRESO'
            ? 'INGRESO'
            : 'EGRESO';

    try {
        const origenFinal =
            origen || (novedad_id ? 'NOVEDAD' : 'MANUAL');

        const novedadFinal = novedad_id || null;

        const [result] = await db.query(`
            INSERT INTO gastos_diarios
            (
                codigo_gasto,
                nombre_gasto,
                tipo,
                categoria,
                monto,
                fecha_registro,
                prestamo_id,
                origen,
                novedad_id,
                created_at,
                updated_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
        `, [
            codigo_gasto,
            nombre_gasto,
            tipoFinal,
            categoria || null,
            montoNumerico,
            fecha_registro,
            prestamo_id || null,
            origenFinal,
            novedadFinal
        ]);

        res.status(201).json({
            ok: true,
            mensaje: 'Movimiento registrado correctamente.',
            id: result.insertId
        });

    } catch (error) {
        console.error(
            'Error al guardar movimiento:',
            error
        );

        res.status(500).json({
            ok: false,
            mensaje: 'No se pudo guardar el movimiento.'
        });
    }
});

// ============================================================
// 3. ELIMINAR UN MOVIMIENTO
// ============================================================

router.delete('/api/gastos-diarios/:id', async (req, res) => {
    const db = req.app.get('db');
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({
            ok: false,
            mensaje: 'ID inválido.'
        });
    }

    try {
        const [result] = await db.query(
            'DELETE FROM gastos_diarios WHERE id = ?',
            [id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                ok: false,
                mensaje: 'El movimiento no existe.'
            });
        }

        res.json({
            ok: true,
            mensaje: 'Movimiento eliminado correctamente.'
        });

    } catch (error) {
        console.error(
            'Error al eliminar movimiento:',
            error
        );

        res.status(500).json({
            ok: false,
            mensaje: 'No se pudo eliminar el movimiento.'
        });
    }
});

// ============================================================
// 4. PRÉSTAMOS ACTIVOS REGISTRADOS HOY
// ============================================================

router.get(
    '/api/gastos-diarios/prestamos-aprobados',
    async (req, res) => {
        const db = req.app.get('db');

        try {
            const [rows] = await db.query(`
                SELECT
                    p.id,
                    p.valor_prestamo AS monto,
                    e.nombre AS empleado_nombre
                FROM nomina_prestamos p
                LEFT JOIN empleados e
                    ON p.empleado_id = e.id
                WHERE p.estado = 'ACTIVO'
                  AND p.fecha_prestamo = CURDATE()
                ORDER BY p.id DESC
            `);

            res.json({
                ok: true,
                data: rows
            });

        } catch (error) {
            console.error(
                'Error al cargar los préstamos:',
                error
            );

            res.status(500).json({
                ok: false,
                mensaje: 'No se pudieron cargar los préstamos.',
                data: []
            });
        }
    }
);

// ============================================================
// 5. IMPORTAR MASIVAMENTE DESDE EXCEL
// ============================================================

router.post('/api/gastos-diarios/importar', async (req, res) => {
    const db = req.app.get('db');
    const { gastos } = req.body;

    if (
        !Array.isArray(gastos) ||
        gastos.length === 0
    ) {
        return res.status(400).json({
            ok: false,
            mensaje: 'No se enviaron datos válidos para importar.'
        });
    }

    let connection;

    try {
        const values = gastos.map(g => {
            const tipoImport = String(
                g.tipo || g.Tipo || 'EGRESO'
            ).toUpperCase();

            const tipoFinal =
                tipoImport === 'INGRESO'
                    ? 'INGRESO'
                    : 'EGRESO';

            const montoImportado = Number(
                g.monto ?? g.Monto ?? g.valor ?? 0
            );

            if (
                !Number.isFinite(montoImportado) ||
                montoImportado <= 0
            ) {
                throw new Error(
                    'El archivo contiene un monto inválido.'
                );
            }

            return [
                g.codigo_gasto ||
                    g.Codigo ||
                    g.codigo ||
                    'S/C',

                g.nombre_gasto ||
                    g.Nombre ||
                    g.nombre ||
                    'Sin nombre',

                tipoFinal,

                g.categoria ||
                    g.Categoria ||
                    g.categoría ||
                    null,

                montoImportado,

                g.fecha_registro ||
                    g.Fecha ||
                    g.fecha ||
                    new Date().toISOString().split('T')[0],

                g.prestamo_id || null,

                'EXCEL',

                null
            ];
        });

        connection = await db.getConnection();

        await connection.beginTransaction();

        // Construir un grupo de marcadores por cada movimiento.
        // Compatible con consultas parametrizadas de MySQL.

        const placeholders = values
            .map(() => '(?, ?, ?, ?, ?, ?, ?, ?, ?)')
            .join(', ');

        const parametros = values.flat();

        const sql = `
            INSERT INTO gastos_diarios
            (
                codigo_gasto,
                nombre_gasto,
                tipo,
                categoria,
                monto,
                fecha_registro,
                prestamo_id,
                origen,
                novedad_id
            )
            VALUES ${placeholders}
        `;

        await connection.query(sql, parametros);

        await connection.commit();

        res.json({
            ok: true,
            mensaje:
                `${values.length} movimientos importados correctamente.`
        });

    } catch (error) {
        if (connection) {
            try {
                await connection.rollback();
            } catch (rollbackError) {
                console.error(
                    'Error al revertir la importación:',
                    rollbackError
                );
            }
        }

        console.error(
            'Error al importar Excel:',
            error
        );

        res.status(500).json({
            ok: false,
            mensaje: 'Error al insertar los datos en la base de datos.'
        });

    } finally {
        if (connection) {
            connection.release();
        }
    }
});

// ============================================================
// 6. EXPORTAR MOVIMIENTOS A CSV
// ============================================================

router.get('/api/gastos-diarios/exportar', async (req, res) => {
    const db = req.app.get('db');
    const fecha = req.query.fecha;

    if (!fecha) {
        return res.status(400).json({
            ok: false,
            mensaje: 'Debe proporcionar una fecha para exportar.'
        });
    }

    try {
        const [rows] = await db.query(`
            SELECT
                id,
                codigo_gasto,
                nombre_gasto,
                tipo,
                categoria,
                monto,
                DATE_FORMAT(fecha_registro, '%Y-%m-%d') AS fecha_registro,
                prestamo_id,
                origen,
                novedad_id
            FROM gastos_diarios
            WHERE fecha_registro = ?
            ORDER BY id DESC
        `, [fecha]);

        let csv = '\uFEFF';

        csv +=
            'ID,Codigo,Descripcion,Tipo,Categoria,Monto,Fecha,Origen,Prestamo_ID,Novedad_ID\n';

        rows.forEach(r => {
            const codigo = String(
                r.codigo_gasto || ''
            ).replace(/"/g, '""');

            const nombre = String(
                r.nombre_gasto || ''
            ).replace(/"/g, '""');

            const tipo = String(
                r.tipo || 'EGRESO'
            ).replace(/"/g, '""');

            const categoria = String(
                r.categoria || ''
            ).replace(/"/g, '""');

            const origen = String(
                r.origen || 'MANUAL'
            ).replace(/"/g, '""');

            csv +=
                `${r.id},` +
                `"${codigo}",` +
                `"${nombre}",` +
                `"${tipo}",` +
                `"${categoria}",` +
                `${r.monto},` +
                `${r.fecha_registro},` +
                `"${origen}",` +
                `${r.prestamo_id || ''},` +
                `${r.novedad_id || ''}\n`;
        });

        res.setHeader(
            'Content-Type',
            'text/csv; charset=utf-8'
        );

        res.setHeader(
            'Content-Disposition',
            `attachment; filename="movimientos_${fecha}.csv"`
        );

        return res.status(200).send(csv);

    } catch (error) {
        console.error(
            'Error al exportar CSV:',
            error
        );

        return res.status(500).json({
            ok: false,
            mensaje: 'Error al generar el archivo.'
        });
    }
});

// ============================================================
// 7. VISTA HTML
// ============================================================

router.get('/nomina/gastos-diarios', (req, res) => {
    if (!req.session || !req.session.usuarioID) {
        return res.redirect('/login');
    }

    res.sendFile(
        path.join(
            __dirname,
            '../public/gastos-diarios.html'
        )
    );
});

// ============================================================
// EXPORTACIÓN DEL ROUTER
// ============================================================

module.exports = router;
