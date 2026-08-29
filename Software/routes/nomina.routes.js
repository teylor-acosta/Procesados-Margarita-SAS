const express = require('express');
const path = require('path');

const router = express.Router();

/* =========================================================
   💰 MÓDULO DE NÓMINA
   ========================================================= */

router.get('/nomina', (req, res) => {
    res.sendFile(
        path.join(__dirname, '../public/nomina.html')
    );
});


/* =========================================================
   ⚙️ CONFIGURACIÓN DE NÓMINA
   ========================================================= */

router.get('/nomina/configuracion', (req, res) => {
    res.sendFile(
        path.join(__dirname, '../public/nomina-configuracion.html')
    );
});


/* =========================================================
   📋 OBTENER PARÁMETROS GENERALES
   ========================================================= */

router.get('/api/nomina/configuracion/parametros', async (req, res) => {

    const db = req.app.get('db');

    try {

        const [rows] = await db.query(`
            SELECT
                id,
                codigo,
                nombre,
                descripcion,
                valor,
                tipo_dato,
                unidad,
                fecha_inicio,
                fecha_fin,
                activo
            FROM nomina_parametros
            WHERE activo = 1
            ORDER BY id ASC
        `);

        res.json({
            ok: true,
            parametros: rows
        });

    } catch (error) {

        console.error(
            '❌ Error obteniendo parámetros de nómina:',
            error
        );

        res.status(500).json({
            ok: false,
            error: 'No fue posible cargar los parámetros.'
        });

    }

});


/* =========================================================
   ✏️ ACTUALIZAR PARÁMETRO
   ========================================================= */

router.put(
    '/api/nomina/configuracion/parametros/:id',
    async (req, res) => {

        const db = req.app.get('db');

        const parametroId = Number(req.params.id);

        const {
            valor,
            fecha_inicio
        } = req.body;


        /* =====================================================
           VALIDACIONES
           ===================================================== */

        if (!parametroId || Number.isNaN(parametroId)) {

            return res.status(400).json({
                ok: false,
                error: 'ID de parámetro inválido.'
            });

        }


        if (
            valor === undefined ||
            valor === null ||
            String(valor).trim() === ''
        ) {

            return res.status(400).json({
                ok: false,
                error: 'Debes ingresar un valor.'
            });

        }


        if (!fecha_inicio) {

            return res.status(400).json({
                ok: false,
                error: 'Debes seleccionar la fecha de vigencia.'
            });

        }


        /* =====================================================
           VALIDAR FORMATO DE FECHA
           ===================================================== */

        const fechaNuevaTexto = String(fecha_inicio).substring(0, 10);

        if (!/^\d{4}-\d{2}-\d{2}$/.test(fechaNuevaTexto)) {

            return res.status(400).json({
                ok: false,
                error: 'La fecha de vigencia no tiene un formato válido.'
            });

        }


        let connection;


        try {

            connection = await db.getConnection();

            await connection.beginTransaction();


            /* =================================================
               🔎 BUSCAR PARÁMETRO ACTUAL
               ================================================= */

            const [actualRows] = await connection.query(`
    SELECT
        id,
        codigo,
        nombre,
        descripcion,
        valor,
        tipo_dato,
        unidad,
        DATE_FORMAT(fecha_inicio, '%Y-%m-%d') AS fecha_inicio,
        DATE_FORMAT(fecha_fin, '%Y-%m-%d') AS fecha_fin,
        activo
    FROM nomina_parametros
    WHERE id = ?
    LIMIT 1
`, [parametroId]);


            if (actualRows.length === 0) {

                await connection.rollback();

                return res.status(404).json({
                    ok: false,
                    error: 'El parámetro no existe.'
                });

            }


            const actual = actualRows[0];

/* =================================================
   📅 VALIDAR FECHAS
   ================================================= */

const fechaNuevaTexto = String(fecha_inicio).substring(0, 10);

const fechaActualTexto = String(actual.fecha_inicio).substring(0, 10);

const fechaNueva = new Date(
    `${fechaNuevaTexto}T00:00:00`
);

const fechaActual = new Date(
    `${fechaActualTexto}T00:00:00`
);


/* =================================================
   🔎 VALIDAR QUE LAS FECHAS SEAN VÁLIDAS
   ================================================= */

if (
    Number.isNaN(fechaNueva.getTime()) ||
    Number.isNaN(fechaActual.getTime())
) {

    await connection.rollback();

    return res.status(400).json({
        ok: false,
        error: 'No fue posible validar las fechas.'
    });

}


/* =================================================
   🚫 LA NUEVA FECHA DEBE SER POSTERIOR
   ================================================= */

if (fechaNueva <= fechaActual) {

    await connection.rollback();

    return res.status(400).json({
        ok: false,
        error:
            'La nueva fecha debe ser posterior a la vigencia actual.'
    });

}


            /* =================================================
               🔒 CERRAR VIGENCIA ANTERIOR
               
               Ejemplo:

               Actual:
               01/01/2026

               Nueva:
               01/09/2026

               Entonces la anterior queda:

               01/01/2026 → 31/08/2026
               ================================================= */

            const fechaFinAnterior =
                new Date(fechaNueva);

            fechaFinAnterior.setDate(
                fechaFinAnterior.getDate() - 1
            );


            const fechaFinAnteriorSQL =
                fechaFinAnterior
                    .toISOString()
                    .substring(0, 10);


            await connection.query(`
                UPDATE nomina_parametros
                SET
                    fecha_fin = ?,
                    activo = 0,
                    updated_at = NOW()
                WHERE id = ?
            `, [
                fechaFinAnteriorSQL,
                parametroId
            ]);


            /* =================================================
               ➕ CREAR NUEVA VIGENCIA
               ================================================= */

            await connection.query(`
                INSERT INTO nomina_parametros
                (
                    codigo,
                    nombre,
                    descripcion,
                    valor,
                    tipo_dato,
                    unidad,
                    fecha_inicio,
                    fecha_fin,
                    activo,
                    created_at,
                    updated_at
                )
                VALUES
                (
                    ?,
                    ?,
                    ?,
                    ?,
                    ?,
                    ?,
                    ?,
                    NULL,
                    1,
                    NOW(),
                    NOW()
                )
            `, [

                actual.codigo,
                actual.nombre,
                actual.descripcion,
                String(valor).trim(),
                actual.tipo_dato,
                actual.unidad,
                fechaNuevaTexto

            ]);


            /* =================================================
               💾 CONFIRMAR TRANSACCIÓN
               ================================================= */

            await connection.commit();


            /* =================================================
               ✅ RESPUESTA
               ================================================= */

            res.json({

                ok: true,

                mensaje:
                    'Parámetro actualizado correctamente.',

                fecha_anterior_fin:
                    fechaFinAnteriorSQL

            });


        } catch (error) {

            if (connection) {

                await connection.rollback();

            }


            console.error(
                '❌ Error actualizando parámetro:',
                error
            );


            res.status(500).json({

                ok: false,

                error:
                    'No fue posible actualizar el parámetro.'

            });


        } finally {

            if (connection) {

                connection.release();

            }

        }

    }
);


/* =========================================================
   📊 OBTENER HISTORIAL DE UN PARÁMETRO
   =========================================================

   Esta ruta nos va a servir después para mostrar el historial
   de cambios de cada parámetro.
   ========================================================= */

router.get(
    '/api/nomina/configuracion/parametros/:id/historial',
    async (req, res) => {

        const db = req.app.get('db');

        const parametroId = Number(req.params.id);


        if (!parametroId || Number.isNaN(parametroId)) {

            return res.status(400).json({

                ok: false,

                error:
                    'ID de parámetro inválido.'

            });

        }


        try {

            const [rows] = await db.query(`

                SELECT

                    id,
                    codigo,
                    nombre,
                    descripcion,
                    valor,
                    tipo_dato,
                    unidad,
                    fecha_inicio,
                    fecha_fin,
                    activo,
                    created_at,
                    updated_at

                FROM nomina_parametros

                WHERE codigo = (

                    SELECT codigo

                    FROM nomina_parametros

                    WHERE id = ?

                    LIMIT 1

                )

                ORDER BY fecha_inicio DESC

            `, [parametroId]);


            res.json({

                ok: true,

                historial: rows

            });


        } catch (error) {

            console.error(
                '❌ Error obteniendo historial:',
                error
            );


            res.status(500).json({

                ok: false,

                error:
                    'No fue posible obtener el historial.'

            });

        }

    }
);

// =========================================================
// ⏱️ OBTENER TIPOS DE HORAS EXTRA
// =========================================================

router.get('/api/nomina/configuracion/horas-extra', async (req, res) => {

    const db = req.app.get('db');

    try {

        const [rows] = await db.query(`
            SELECT
                id,
                codigo,
                nombre,
                descripcion,
                tipo_jornada,
                tipo_dia,
                porcentaje_recargo,
                factor_pago,
                formula,
                hora_inicio,
                hora_fin,
                requiere_autorizacion,
                limite_diario,
                limite_semanal,
                fecha_inicio,
                fecha_fin,
                activo
            FROM nomina_tipos_horas_extra
            WHERE activo = 1
            ORDER BY id ASC
        `);

        res.json({
            ok: true,
            data: rows
        });

    } catch (error) {

        console.error(
            '❌ Error obteniendo tipos de horas extra:',
            error
        );

        res.status(500).json({
            ok: false,
            mensaje: 'No fue posible cargar las horas extra.',
            error: error.message
        });

    }

});

// =========================================================
// ✏️ ACTUALIZAR TIPO DE HORA EXTRA
// =========================================================

router.put(
    '/api/nomina/configuracion/horas-extra/:id',
    async (req, res) => {

        const db = req.app.get('db');

        const id = Number(req.params.id);

        const {
            porcentaje_recargo,
            formula,
            requiere_autorizacion,
            limite_diario,
            limite_semanal,
            fecha_inicio,
            descripcion
        } = req.body;


        // =================================================
        // VALIDAR ID
        // =================================================

        if (!id || !Number.isInteger(id)) {

            return res.status(400).json({
                ok: false,
                mensaje: 'ID de hora extra inválido.'
            });

        }


        // =================================================
        // VALIDAR FECHA
        // =================================================

        if (!fecha_inicio) {

            return res.status(400).json({
                ok: false,
                mensaje: 'Debe indicar la fecha de vigencia.'
            });

        }


        const fechaNueva = String(fecha_inicio)
            .substring(0, 10);


        if (!/^\d{4}-\d{2}-\d{2}$/.test(fechaNueva)) {

            return res.status(400).json({
                ok: false,
                mensaje: 'La fecha de vigencia no tiene un formato válido.'
            });

        }


        // =================================================
        // VALIDAR PORCENTAJE
        // =================================================

        if (
            porcentaje_recargo === undefined ||
            porcentaje_recargo === null ||
            String(porcentaje_recargo).trim() === ''
        ) {

            return res.status(400).json({
                ok: false,
                mensaje: 'Debe ingresar el porcentaje de recargo.'
            });

        }


        const porcentaje = Number(
            String(porcentaje_recargo)
                .replace(',', '.')
        );


        if (
            Number.isNaN(porcentaje) ||
            porcentaje < 0 ||
            porcentaje > 1000
        ) {

            return res.status(400).json({
                ok: false,
                mensaje: 'El porcentaje de recargo no es válido.'
            });

        }


        // =================================================
        // 🧮 CONVERTIR PORCENTAJE A FACTOR
        //
        // 25%  → 1.25
        // 75%  → 1.75
        // 115% → 2.15
        // 165% → 2.65
        // =================================================

        const factorPago =
            1 + (porcentaje / 100);


        // =================================================
        // VALIDAR LÍMITE DIARIO
        // =================================================

        let limiteDiario = null;

        if (
            limite_diario !== undefined &&
            limite_diario !== null &&
            String(limite_diario).trim() !== ''
        ) {

            limiteDiario = Number(limite_diario);

            if (
                Number.isNaN(limiteDiario) ||
                !Number.isInteger(limiteDiario) ||
                limiteDiario < 0
            ) {

                return res.status(400).json({
                    ok: false,
                    mensaje: 'El límite diario debe ser un número entero de horas.'
                });

            }

        }


        // =================================================
        // VALIDAR LÍMITE SEMANAL
        // =================================================

        let limiteSemanal = null;

        if (
            limite_semanal !== undefined &&
            limite_semanal !== null &&
            String(limite_semanal).trim() !== ''
        ) {

            limiteSemanal = Number(limite_semanal);

            if (
                Number.isNaN(limiteSemanal) ||
                !Number.isInteger(limiteSemanal) ||
                limiteSemanal < 0
            ) {

                return res.status(400).json({
                    ok: false,
                    mensaje: 'El límite semanal debe ser un número entero de horas.'
                });

            }

        }


        // =================================================
        // VALIDAR RELACIÓN DE LÍMITES
        // =================================================

        if (
            limiteDiario !== null &&
            limiteSemanal !== null &&
            limiteDiario > limiteSemanal
        ) {

            return res.status(400).json({
                ok: false,
                mensaje: 'El límite diario no puede ser mayor que el límite semanal.'
            });

        }


        let connection;


        try {

            connection = await db.getConnection();

            await connection.beginTransaction();


            // =================================================
            // 🔎 OBTENER REGISTRO ACTUAL
            // =================================================

            const [rows] = await connection.query(`

                SELECT
                    id,
                    codigo,
                    nombre,
                    descripcion,
                    tipo_jornada,
                    tipo_dia,
                    porcentaje_recargo,
                    factor_pago,
                    formula,
                    requiere_autorizacion,
                    limite_diario,
                    limite_semanal,
                    fecha_inicio,
                    fecha_fin,
                    activo

                FROM nomina_tipos_horas_extra

                WHERE id = ?

                LIMIT 1

            `, [id]);


            if (rows.length === 0) {

                await connection.rollback();

                return res.status(404).json({
                    ok: false,
                    mensaje: 'La hora extra no existe.'
                });

            }


            const actual = rows[0];


            // =================================================
            // 📅 OBTENER FECHA ACTUAL
            // =================================================

            const fechaActual =
                actual.fecha_inicio instanceof Date

                    ? actual.fecha_inicio
                        .toISOString()
                        .substring(0, 10)

                    : String(actual.fecha_inicio)
                        .substring(0, 10);


            // =================================================
            // 🚫 LA NUEVA FECHA DEBE SER POSTERIOR
            // =================================================

            if (fechaNueva <= fechaActual) {

                await connection.rollback();

                return res.status(400).json({

                    ok: false,

                    mensaje:
                        `La nueva fecha debe ser posterior a ${fechaActual}.`

                });

            }


            // =================================================
            // 📅 CALCULAR FIN DE VIGENCIA ANTERIOR
            // =================================================

            const fechaObj =
                new Date(`${fechaNueva}T00:00:00`);


            fechaObj.setDate(
                fechaObj.getDate() - 1
            );


            const fechaFinAnterior =
                fechaObj
                    .toISOString()
                    .substring(0, 10);


            // =================================================
            // 🔒 CERRAR REGISTRO ANTERIOR
            // =================================================

            await connection.query(`

                UPDATE nomina_tipos_horas_extra

                SET
                    fecha_fin = ?,
                    activo = 0,
                    updated_at = NOW()

                WHERE id = ?

            `, [
                fechaFinAnterior,
                id
            ]);


            // =================================================
            // ➕ CREAR NUEVA VIGENCIA
            //
            // IMPORTANTE:
            // Nombre, tipo_jornada y tipo_dia
            // vienen del registro anterior.
            //
            // El usuario NO puede modificarlos.
            //
            // hora_inicio y hora_fin ya NO se utilizan.
            // =================================================

            await connection.query(`

                INSERT INTO nomina_tipos_horas_extra
                (
                    codigo,
                    nombre,
                    descripcion,
                    tipo_jornada,
                    tipo_dia,
                    porcentaje_recargo,
                    factor_pago,
                    formula,
                    requiere_autorizacion,
                    limite_diario,
                    limite_semanal,
                    fecha_inicio,
                    fecha_fin,
                    activo,
                    created_at,
                    updated_at
                )

                VALUES
                (
                    ?,
                    ?,
                    ?,
                    ?,
                    ?,
                    ?,
                    ?,
                    ?,
                    ?,
                    ?,
                    ?,
                    ?,
                    NULL,
                    1,
                    NOW(),
                    NOW()
                )

            `, [

                // Código original
                actual.codigo,

                // Nombre original
                actual.nombre,

                // Descripción
                descripcion !== undefined
                    ? (
                        descripcion === null ||
                        String(descripcion).trim() === ''
                            ? null
                            : String(descripcion).trim()
                    )
                    : actual.descripcion,

                // Tipo de jornada original
                actual.tipo_jornada,

                // Tipo de día original
                actual.tipo_dia,

                // 25 → 0.2500
                porcentaje / 100,

                // 25 → 1.2500
                factorPago,

                // Fórmula original
                formula !== undefined
                    ? (
                        formula === null ||
                        String(formula).trim() === ''
                            ? null
                            : String(formula).trim()
                    )
                    : actual.formula,

                // Switch
                requiere_autorizacion
                    ? 1
                    : 0,

                // Límite diario
                limiteDiario,

                // Límite semanal
                limiteSemanal,

                // Nueva vigencia
                fechaNueva

            ]);


            // =================================================
            // 💾 CONFIRMAR
            // =================================================

            await connection.commit();


            console.log(
                `✅ Hora extra ${actual.codigo} actualizada correctamente.`
            );


            // =================================================
            // ✅ RESPUESTA
            // =================================================

            return res.json({

                ok: true,

                mensaje:
                    'Hora extra actualizada correctamente.',

                codigo:
                    actual.codigo,

                porcentaje_recargo:
                    porcentaje,

                factor_pago:
                    factorPago,

                requiere_autorizacion:
                    requiere_autorizacion ? 1 : 0,

                limite_diario:
                    limiteDiario,

                limite_semanal:
                    limiteSemanal,

                fecha_anterior_fin:
                    fechaFinAnterior,

                nueva_fecha_inicio:
                    fechaNueva

            });


        } catch (error) {


            if (connection) {

                try {

                    await connection.rollback();

                } catch (rollbackError) {

                    console.error(
                        '❌ Error haciendo rollback:',
                        rollbackError
                    );

                }

            }


            console.error(
                '❌ Error actualizando hora extra:',
                error
            );


            return res.status(500).json({

                ok: false,

                mensaje:
                    'No fue posible actualizar la hora extra.',

                error:
                    error.message

            });


        } finally {

            if (connection) {

                connection.release();

            }

        }

    }
);

// =========================================================
// 🌙 OBTENER RECARGOS VIGENTES
// =========================================================

router.get(
    '/api/nomina/configuracion/recargos',
    async (req, res) => {

        const db = req.app.get('db');

        try {

            const [rows] = await db.query(`
                SELECT
                    id,
                    codigo,
                    nombre,
                    descripcion,
                    porcentaje_recargo,
                    factor_pago,
                    formula,
                    fecha_inicio,
                    fecha_fin,
                    activo
                FROM nomina_tipos_recargos
                WHERE activo = 1
                ORDER BY codigo ASC
            `);

            res.json({
                ok: true,
                data: rows
            });

        } catch (error) {

            console.error(
                '❌ Error obteniendo recargos de nómina:',
                error
            );

            res.status(500).json({
                ok: false,
                mensaje:
                    'No fue posible cargar los recargos.',
                error:
                    error.message
            });

        }

    }
);

// =========================================================
// 🌙 ACTUALIZAR RECARGO
// =========================================================

router.put(
    '/api/nomina/configuracion/recargos/:codigo',
    async (req, res) => {

        const db = req.app.get('db');

        const codigo = String(
            req.params.codigo || ''
        ).trim();

        const {
            porcentaje_recargo,
            factor_pago,
            fecha_inicio
        } = req.body;


        // =====================================================
        // VALIDACIONES BÁSICAS
        // =====================================================

        if (!codigo) {

            return res.status(400).json({
                ok: false,
                mensaje: 'Código de recargo inválido.'
            });

        }


        if (
            porcentaje_recargo === undefined ||
            porcentaje_recargo === null ||
            Number.isNaN(
                Number(porcentaje_recargo)
            )
        ) {

            return res.status(400).json({
                ok: false,
                mensaje: 'Debe indicar el porcentaje de recargo.'
            });

        }


        if (
            factor_pago === undefined ||
            factor_pago === null ||
            Number.isNaN(
                Number(factor_pago)
            )
        ) {

            return res.status(400).json({
                ok: false,
                mensaje: 'Debe indicar el factor de pago.'
            });

        }


        if (!fecha_inicio) {

            return res.status(400).json({
                ok: false,
                mensaje: 'Debe indicar la nueva fecha de vigencia.'
            });

        }


        // =====================================================
        // CONVERTIR VALORES
        // =====================================================

        const porcentaje = Number(
            porcentaje_recargo
        );

        const factor = Number(
            factor_pago
        );


        if (porcentaje < 0) {

            return res.status(400).json({
                ok: false,
                mensaje: 'El porcentaje no puede ser negativo.'
            });

        }


        if (factor < 1) {

            return res.status(400).json({
                ok: false,
                mensaje: 'El factor de pago no puede ser menor que 1.'
            });

        }


        // =====================================================
        // CONEXIÓN Y TRANSACCIÓN
        // =====================================================

        let connection;

        try {

            connection =
                await db.getConnection();

            await connection.beginTransaction();


            // =================================================
            // 🔎 BUSCAR RECARGO ACTUAL
            // =================================================

            const [
                recargoRows
            ] = await connection.query(
                `
                SELECT
                    id,
                    codigo,
                    nombre,
                    descripcion,
                    porcentaje_recargo,
                    factor_pago,
                    formula,
                    fecha_inicio,
                    fecha_fin,
                    activo
                FROM nomina_tipos_recargos
                WHERE codigo = ?
                  AND activo = 1
                ORDER BY fecha_inicio DESC
                LIMIT 1
                `,
                [codigo]
            );


            if (
                recargoRows.length === 0
            ) {

                await connection.rollback();

                return res.status(404).json({
                    ok: false,
                    mensaje:
                        'No se encontró el recargo activo.'
                });

            }


            const actual =
                recargoRows[0];


            // =================================================
            // 📅 VALIDAR FECHA DE VIGENCIA
            // =================================================

            const fechaNueva =
                new Date(
                    `${fecha_inicio}T00:00:00`
                );


            const fechaActual =
                new Date(
                    `${String(actual.fecha_inicio)
                        .substring(0, 10)}T00:00:00`
                );


            if (
                Number.isNaN(
                    fechaNueva.getTime()
                )
            ) {

                await connection.rollback();

                return res.status(400).json({
                    ok: false,
                    mensaje:
                        'La nueva fecha de vigencia no es válida.'
                });

            }


            if (
                fechaNueva <= fechaActual
            ) {

                await connection.rollback();

                return res.status(400).json({
                    ok: false,
                    mensaje:
                        'La nueva fecha de vigencia debe ser posterior a la vigencia actual.'
                });

            }


            // =================================================
            // 📅 CALCULAR FECHA FINAL ANTERIOR
            // =================================================

            const fechaFinAnterior =
                new Date(fechaNueva);

            fechaFinAnterior.setDate(
                fechaFinAnterior.getDate() - 1
            );


            const fechaFinAnteriorSQL =
                fechaFinAnterior
                    .toISOString()
                    .substring(0, 10);


            // =================================================
// 🔒 CERRAR TODAS LAS VIGENCIAS ACTIVAS ANTERIORES
// =================================================

await connection.query(
    `
    UPDATE nomina_tipos_recargos
    SET
        fecha_fin = ?,
        activo = 0,
        updated_at = NOW()
    WHERE codigo = ?
      AND activo = 1
    `,
    [
        fechaFinAnteriorSQL,
        actual.codigo
    ]
);


            // =================================================
            // ➕ CREAR NUEVA VIGENCIA
            // =================================================

            await connection.query(
                `
                INSERT INTO nomina_tipos_recargos
                (
                    codigo,
                    nombre,
                    descripcion,
                    porcentaje_recargo,
                    factor_pago,
                    formula,
                    fecha_inicio,
                    fecha_fin,
                    activo,
                    created_at,
                    updated_at
                )
                VALUES
                (
                    ?, ?, ?, ?, ?, ?, ?, NULL, 1, NOW(), NOW()
                )
                `,
                [
                    actual.codigo,
                    actual.nombre,
                    actual.descripcion,
                    porcentaje,
                    factor,
                    actual.formula,
                    fecha_inicio
                ]
            );


            // =================================================
            // 💾 CONFIRMAR
            // =================================================

            await connection.commit();


            return res.json({

                ok: true,

                mensaje:
                    'Recargo actualizado correctamente.',

                codigo: actual.codigo,

                porcentaje_recargo:
                    porcentaje,

                factor_pago:
                    factor,

                fecha_anterior_fin:
                    fechaFinAnteriorSQL,

                nueva_fecha_inicio:
                    fecha_inicio

            });


        } catch (error) {


            if (connection) {
                await connection.rollback();
            }


            console.error(
                '❌ Error actualizando recargo:',
                error
            );


            return res.status(500).json({

                ok: false,

                mensaje:
                    'No fue posible actualizar el recargo.',

                error:
                    error.message

            });


        } finally {


            if (connection) {
                connection.release();
            }

        }

    }
);

// =========================================================
// 💰 SALARIO MÍNIMO LEGAL VIGENTE
// =========================================================

// ---------------------------------------------------------
// OBTENER SALARIO MÍNIMO ACTIVO
// ---------------------------------------------------------
router.get(
    '/api/nomina/configuracion/salarios',
    async (req, res) => {

        try {

            const [rows] = await db.query(`
                SELECT
                    id,
                    valor,
                    fecha_inicio,
                    fecha_fin,
                    activo,
                    observacion,
                    created_at,
                    updated_at
                FROM nomina_salario_minimo
                WHERE activo = 1
                ORDER BY fecha_inicio DESC, id DESC
            `);

            res.json({
                ok: true,
                data: rows
            });

        } catch (error) {

            console.error(
                '❌ Error cargando salario mínimo:',
                error
            );

            res.status(500).json({
                ok: false,
                error: error.message
            });

        }

    }
);


// ---------------------------------------------------------
// CREAR NUEVA VIGENCIA DE SALARIO MÍNIMO
// ---------------------------------------------------------
router.post(
    '/api/nomina/configuracion/salarios',
    async (req, res) => {

        const connection =
            await db.getConnection();

        try {

            const {
                valor,
                fecha_inicio,
                observacion
            } = req.body;


            // =============================================
            // VALIDACIONES
            // =============================================

            if (
                valor === undefined ||
                valor === null ||
                valor === '' ||
                !fecha_inicio
            ) {

                return res.status(400).json({
                    ok: false,
                    error:
                        'El valor y la fecha de inicio son obligatorios.'
                });

            }


            const nuevoValor =
                Number(valor);


            if (
                Number.isNaN(nuevoValor) ||
                nuevoValor <= 0
            ) {

                return res.status(400).json({
                    ok: false,
                    error:
                        'El valor del salario mínimo no es válido.'
                });

            }


            await connection.beginTransaction();


            // =============================================
            // BUSCAR VIGENCIA ACTUAL
            // =============================================

            const [actuales] =
                await connection.query(`
                    SELECT
                        id,
                        fecha_inicio
                    FROM nomina_salario_minimo
                    WHERE activo = 1
                    ORDER BY fecha_inicio DESC, id DESC
                    LIMIT 1
                `);


            // =============================================
            // VALIDAR FECHA
            // =============================================

            if (actuales.length > 0) {

                const fechaActual =
                    String(
                        actuales[0].fecha_inicio
                    ).substring(0, 10);


                if (
                    fecha_inicio <= fechaActual
                ) {

                    await connection.rollback();

                    return res.status(400).json({
                        ok: false,
                        error:
                            'La nueva fecha debe ser posterior a la vigencia actual.'
                    });

                }

            }


            // =============================================
            // CALCULAR FECHA FINAL ANTERIOR
            // =============================================

            let fechaFinAnterior = null;

            if (actuales.length > 0) {

                const fecha =
                    new Date(
                        `${fecha_inicio}T00:00:00`
                    );

                fecha.setDate(
                    fecha.getDate() - 1
                );

                fechaFinAnterior =
                    fecha.toISOString()
                        .substring(0, 10);


                // =========================================
                // CERRAR VIGENCIA ANTERIOR
                // =========================================

                await connection.query(`
                    UPDATE nomina_salario_minimo
                    SET
                        fecha_fin = ?,
                        activo = 0,
                        updated_at = NOW()
                    WHERE id = ?
                `, [
                    fechaFinAnterior,
                    actuales[0].id
                ]);

            }


            // =============================================
            // CREAR NUEVA VIGENCIA
            // =============================================

            await connection.query(`
                INSERT INTO nomina_salario_minimo
                (
                    valor,
                    fecha_inicio,
                    fecha_fin,
                    activo,
                    observacion,
                    created_at,
                    updated_at
                )
                VALUES
                (
                    ?,
                    ?,
                    NULL,
                    1,
                    ?,
                    NOW(),
                    NOW()
                )
            `, [
                nuevoValor,
                fecha_inicio,
                observacion || null
            ]);


            await connection.commit();


            res.json({
                ok: true,
                mensaje:
                    'Salario mínimo actualizado correctamente.'
            });


        } catch (error) {

            await connection.rollback();

            console.error(
                '❌ Error guardando salario mínimo:',
                error
            );

            res.status(500).json({
                ok: false,
                error: error.message
            });

        } finally {

            connection.release();

        }

    }
);

module.exports = router;
