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

        const db = req.app.get('db');

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

        const db = req.app.get('db');

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
    DATE_FORMAT(fecha_inicio, '%Y-%m-%d') AS fecha_inicio
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
    actuales[0].fecha_inicio;

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

// =========================================================
// 🚍 AUXILIO DE TRANSPORTE
// =========================================================

// ---------------------------------------------------------
// OBTENER AUXILIO DE TRANSPORTE VIGENTE
// ---------------------------------------------------------

router.get(
    '/api/nomina/configuracion/auxilio-transporte',
    async (req, res) => {

        const db = req.app.get('db');

        try {

            const [rows] = await db.query(`
                SELECT
                    id,
                    valor,
                    salario_maximo_aplica,
                    fecha_inicio,
                    fecha_fin,
                    activo,
                    observacion,
                    created_at,
                    updated_at
                FROM nomina_auxilio_transporte
                WHERE activo = 1
                ORDER BY fecha_inicio DESC, id DESC
            `);

            res.json({
                ok: true,
                data: rows
            });

        } catch (error) {

            console.error(
                '❌ Error cargando auxilio de transporte:',
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
// CREAR NUEVA VIGENCIA DE AUXILIO DE TRANSPORTE
// ---------------------------------------------------------

router.post(
    '/api/nomina/configuracion/auxilio-transporte',
    async (req, res) => {

        const db = req.app.get('db');

        let connection;

        try {

            const {
                valor,
                salario_maximo_aplica,
                fecha_inicio,
                observacion
            } = req.body;


            // =================================================
            // VALIDACIONES
            // =================================================

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
                        'El valor del auxilio no es válido.'
                });

            }


            // =================================================
            // VALIDAR SALARIO MÁXIMO
            // =================================================

            let salarioMaximo = null;

            if (
                salario_maximo_aplica !== undefined &&
                salario_maximo_aplica !== null &&
                String(salario_maximo_aplica).trim() !== ''
            ) {

                salarioMaximo =
                    Number(salario_maximo_aplica);

                if (
                    Number.isNaN(salarioMaximo) ||
                    salarioMaximo < 0
                ) {

                    return res.status(400).json({
                        ok: false,
                        error:
                            'El salario máximo para aplicar no es válido.'
                    });

                }

            }


            // =================================================
            // VALIDAR FECHA
            // =================================================

            const fechaNuevaTexto =
                String(fecha_inicio).substring(0, 10);


            if (
                !/^\d{4}-\d{2}-\d{2}$/.test(
                    fechaNuevaTexto
                )
            ) {

                return res.status(400).json({
                    ok: false,
                    error:
                        'La fecha de inicio no tiene un formato válido.'
                });

            }


            const fechaNueva =
                new Date(
                    `${fechaNuevaTexto}T00:00:00`
                );


            if (
                Number.isNaN(
                    fechaNueva.getTime()
                )
            ) {

                return res.status(400).json({
                    ok: false,
                    error:
                        'La fecha de inicio no es válida.'
                });

            }


            // =================================================
            // CONEXIÓN
            // =================================================

            connection =
                await db.getConnection();

            await connection.beginTransaction();


            // =================================================
            // BUSCAR VIGENCIA ACTUAL
            // =================================================

            const [actuales] =
                await connection.query(`
                    SELECT
                        id,
                        DATE_FORMAT(
                            fecha_inicio,
                            '%Y-%m-%d'
                        ) AS fecha_inicio
                    FROM nomina_auxilio_transporte
                    WHERE activo = 1
                    ORDER BY fecha_inicio DESC, id DESC
                    LIMIT 1
                `);


            // =================================================
            // VALIDAR QUE LA NUEVA FECHA SEA POSTERIOR
            // =================================================

            if (actuales.length > 0) {

                const fechaActualTexto =
                    actuales[0].fecha_inicio;

                const fechaActual =
                    new Date(
                        `${fechaActualTexto}T00:00:00`
                    );


                if (
                    Number.isNaN(
                        fechaActual.getTime()
                    )
                ) {

                    await connection.rollback();

                    return res.status(400).json({
                        ok: false,
                        error:
                            'No fue posible validar la vigencia actual.'
                    });

                }


                if (
                    fechaNueva <= fechaActual
                ) {

                    await connection.rollback();

                    return res.status(400).json({
                        ok: false,
                        error:
                            'La nueva fecha debe ser posterior a la vigencia actual.'
                    });

                }

            }


            // =================================================
            // CALCULAR FECHA FINAL ANTERIOR
            // =================================================

            let fechaFinAnterior = null;


            if (actuales.length > 0) {

                const fechaFin =
                    new Date(fechaNueva);

                fechaFin.setDate(
                    fechaFin.getDate() - 1
                );


                fechaFinAnterior =
                    fechaFin
                        .toISOString()
                        .substring(0, 10);


                // =============================================
                // CERRAR VIGENCIA ANTERIOR
                // =============================================

                await connection.query(`
                    UPDATE nomina_auxilio_transporte
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


            // =================================================
            // CREAR NUEVA VIGENCIA
            // =================================================

            await connection.query(`
                INSERT INTO nomina_auxilio_transporte
                (
                    valor,
                    salario_maximo_aplica,
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
                    ?,
                    NULL,
                    1,
                    ?,
                    NOW(),
                    NOW()
                )
            `, [
                nuevoValor,
                salarioMaximo,
                fechaNuevaTexto,
                observacion
                    ? String(observacion).trim()
                    : null
            ]);


            // =================================================
            // CONFIRMAR
            // =================================================

            await connection.commit();


            // =================================================
            // RESPUESTA
            // =================================================

            res.json({
                ok: true,
                mensaje:
                    'Auxilio de transporte actualizado correctamente.',
                fecha_anterior_fin:
                    fechaFinAnterior,
                nueva_fecha_inicio:
                    fechaNuevaTexto
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
                '❌ Error guardando auxilio de transporte:',
                error
            );


            res.status(500).json({
                ok: false,
                error: error.message
            });


        } finally {

            if (connection) {
                connection.release();
            }

        }

    }
);

// =========================================================
// 🧱 MATERIALES DE PRODUCCIÓN
// =========================================================


// ---------------------------------------------------------
// OBTENER MATERIALES
// ---------------------------------------------------------

router.get(
    '/api/nomina/configuracion/materiales',
    async (req, res) => {

        const db = req.app.get('db');

        try {

            const [rows] = await db.query(`
                SELECT
                    m.id,
                    m.codigo,
                    m.nombre,
                    m.descripcion,
                    m.unidad,
                    m.activo,
                    m.created_at,
                    m.updated_at,

                    p.id AS precio_id,
                    p.precio AS precio_por_unidad,
                    p.fecha_inicio,
                    p.fecha_fin,
                    p.activo AS precio_activo

                FROM nomina_materiales m

                LEFT JOIN nomina_materiales_precios p
                    ON p.id = (
                        SELECT p2.id
                        FROM nomina_materiales_precios p2
                        WHERE p2.material_id = m.id
                          AND p2.activo = 1
                          AND p2.fecha_inicio <= CURDATE()
                          AND (
                              p2.fecha_fin IS NULL
                              OR p2.fecha_fin >= CURDATE()
                          )
                        ORDER BY p2.fecha_inicio DESC, p2.id DESC
                        LIMIT 1
                    )

                ORDER BY m.nombre ASC, m.id ASC
            `);


            res.json({
                ok: true,
                data: rows
            });


        } catch (error) {

            console.error(
                '❌ Error obteniendo materiales de producción:',
                error
            );


            res.status(500).json({
                ok: false,
                error:
                    'No fue posible cargar los materiales de producción.'
            });

        }

    }
);


// ---------------------------------------------------------
// CREAR MATERIAL
// ---------------------------------------------------------

router.post(
    '/api/nomina/configuracion/materiales',
    async (req, res) => {

        const db = req.app.get('db');

        let connection = null;

        try {

            const {
                nombre,
                descripcion,
                unidad,
                precio_por_unidad,
                fecha_inicio
            } = req.body;


            // =================================================
            // VALIDAR NOMBRE
            // =================================================

            const nombreLimpio =
                String(nombre || '').trim();


            if (!nombreLimpio) {

                return res.status(400).json({
                    ok: false,
                    error:
                        'El nombre del material es obligatorio.'
                });

            }


            // =================================================
            // VALIDAR UNIDAD
            // =================================================

            const unidadLimpia =
                String(unidad || '').trim();


            if (!unidadLimpia) {

                return res.status(400).json({
                    ok: false,
                    error:
                        'La unidad del material es obligatoria.'
                });

            }


            // =================================================
            // VALIDAR PRECIO
            // =================================================

            const precio =
                Number(
                    String(precio_por_unidad || '0')
                        .replace(/\./g, '')
                        .replace(',', '.')
                );


            if (
                Number.isNaN(precio) ||
                precio < 0
            ) {

                return res.status(400).json({
                    ok: false,
                    error:
                        'El precio por unidad no es válido.'
                });

            }


            // =================================================
            // VALIDAR FECHA
            // =================================================

            if (!fecha_inicio) {

                return res.status(400).json({
                    ok: false,
                    error:
                        'La fecha de inicio es obligatoria.'
                });

            }


            const fechaInicio =
                String(fecha_inicio).substring(0, 10);


            if (
                !/^\d{4}-\d{2}-\d{2}$/.test(fechaInicio)
            ) {

                return res.status(400).json({
                    ok: false,
                    error:
                        'La fecha de inicio no tiene un formato válido.'
                });

            }


            const fechaObj =
                new Date(`${fechaInicio}T00:00:00`);


            if (
                Number.isNaN(fechaObj.getTime())
            ) {

                return res.status(400).json({
                    ok: false,
                    error:
                        'La fecha de inicio no es válida.'
                });

            }


            // =================================================
            // LIMPIAR OBSERVACIÓN
            // =================================================

            const observacionLimpia =
                descripcion !== undefined &&
                descripcion !== null &&
                String(descripcion).trim() !== ''
                    ? String(descripcion).trim()
                    : null;


            // =================================================
            // INICIAR TRANSACCIÓN
            // =================================================

            connection =
                await db.getConnection();

            await connection.beginTransaction();


            // =================================================
// CREAR MATERIAL
//
// El código NO lo ingresa el usuario.
// Primero usamos un código temporal para obtener
// el ID generado por MySQL.
// =================================================

const codigoTemporal =
    `TMP-${Date.now()}-${Math.floor(Math.random() * 100000)}`;


const [resultadoMaterial] =
    await connection.query(`
        INSERT INTO nomina_materiales
        (
            codigo,
            nombre,
            unidad,
            activo,
            descripcion,
            fecha_inicio,
            precio_por_unidad,
            fecha_fin,
            created_at,
            updated_at
        )
        VALUES
        (
            ?,
            ?,
            ?,
            1,
            ?,
            ?,
            ?,
            NULL,
            NOW(),
            NOW()
        )
    `,
    [
        codigoTemporal,
        nombreLimpio,
        unidadLimpia,
        observacionLimpia,
        fechaInicio,
        precio
    ]);


const materialId =
    resultadoMaterial.insertId;


// =================================================
// GENERAR CÓDIGO AUTOMÁTICO
//
// ID 1  → MAT-001
// ID 2  → MAT-002
// ID 15 → MAT-015
// =================================================

const codigo =
    `MAT-${String(materialId).padStart(3, '0')}`;


// =================================================
// ACTUALIZAR CÓDIGO DEL MATERIAL
// =================================================

await connection.query(`
    UPDATE nomina_materiales
    SET
        codigo = ?,
        updated_at = NOW()
    WHERE id = ?
`,
[
    codigo,
    materialId
]);


// =================================================
// CREAR PRECIO INICIAL
// =================================================

await connection.query(`
    INSERT INTO nomina_materiales_precios
    (
        material_id,
        precio,
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
        ?,
        NULL,
        1,
        NULL,
        NOW(),
        NOW()
    )
`,
[
    materialId,
    precio,
    fechaInicio
]);


            // =================================================
            // CONFIRMAR TRANSACCIÓN
            // =================================================

            await connection.commit();


            // =================================================
            // REGISTRO EN CONSOLA
            // =================================================

            console.log(
                `✅ Material ${codigo} creado correctamente.`
            );


            // =================================================
            // RESPUESTA
            // =================================================

            return res.status(201).json({

                ok: true,

                mensaje:
                    'Material creado correctamente.',

                id:
                    materialId,

                codigo:
                    codigo

            });


        } catch (error) {


            // =================================================
            // ROLLBACK
            // =================================================

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


            // =================================================
            // ERROR
            // =================================================

            console.error(
                '❌ Error creando material:',
                error
            );


            return res.status(500).json({

                ok: false,

                error:
                    'No fue posible crear el material.'

            });


        } finally {


            // =================================================
            // LIBERAR CONEXIÓN
            // =================================================

            if (connection) {

                connection.release();

            }

        }

    }
);


// ---------------------------------------------------------
// EDITAR MATERIAL
// ---------------------------------------------------------

router.put(
    '/api/nomina/configuracion/materiales/:id',
    async (req, res) => {

        const db = req.app.get('db');

        let connection = null;

        try {

            const id =
                Number(req.params.id);


            // =================================================
            // VALIDAR ID
            // =================================================

            if (
                !id ||
                !Number.isInteger(id)
            ) {

                return res.status(400).json({
                    ok: false,
                    error: 'ID de material inválido.'
                });

            }


            // =================================================
            // DATOS RECIBIDOS
            // =================================================

            const {
                nombre,
                descripcion,
                unidad,
                precio_por_unidad,
                fecha_inicio
            } = req.body;


            const nombreLimpio =
                String(nombre || '').trim();


            const unidadLimpia =
                String(unidad || '').trim();


            const descripcionLimpia =
                descripcion !== undefined &&
                descripcion !== null &&
                String(descripcion).trim() !== ''
                    ? String(descripcion).trim()
                    : null;


            // =================================================
            // VALIDAR NOMBRE
            // =================================================

            if (!nombreLimpio) {

                return res.status(400).json({
                    ok: false,
                    error:
                        'El nombre del material es obligatorio.'
                });

            }


            // =================================================
            // VALIDAR UNIDAD
            // =================================================

            if (!unidadLimpia) {

                return res.status(400).json({
                    ok: false,
                    error:
                        'La unidad del material es obligatoria.'
                });

            }


            // =================================================
            // VALIDAR PRECIO
            // =================================================

            const precio =
                Number(
                    String(
                        precio_por_unidad || '0'
                    )
                        .replace(/\./g, '')
                        .replace(',', '.')
                );


            if (
                Number.isNaN(precio) ||
                precio < 0
            ) {

                return res.status(400).json({
                    ok: false,
                    error:
                        'El precio del material no es válido.'
                });

            }


            // =================================================
            // VALIDAR FECHA
            // =================================================

            if (!fecha_inicio) {

                return res.status(400).json({
                    ok: false,
                    error:
                        'La fecha de inicio es obligatoria.'
                });

            }


            const fechaInicio =
                String(fecha_inicio)
                    .substring(0, 10);


            if (
                !/^\d{4}-\d{2}-\d{2}$/.test(
                    fechaInicio
                )
            ) {

                return res.status(400).json({
                    ok: false,
                    error:
                        'La fecha de inicio no es válida.'
                });

            }


            // =================================================
            // INICIAR TRANSACCIÓN
            // =================================================

            connection =
                await db.getConnection();

            await connection.beginTransaction();


            // =================================================
            // BUSCAR MATERIAL
            // =================================================

            const [materiales] =
    await connection.query(`
        SELECT
            id,
            codigo,
            nombre,
            unidad,
            descripcion
        FROM nomina_materiales
        WHERE id = ?
        LIMIT 1
    `,
    [
        id
    ]);


            if (
                materiales.length === 0
            ) {

                await connection.rollback();
                connection.release();
                connection = null;

                return res.status(404).json({
                    ok: false,
                    error:
                        'El material no existe.'
                });

            }


            // =================================================
            // OBTENER PRECIO VIGENTE
            // =================================================

            const [preciosVigentes] =
                await connection.query(`
                    SELECT
                        id,
                        precio,
                        fecha_inicio,
                        fecha_fin
                    FROM nomina_materiales_precios
                    WHERE material_id = ?
                      AND activo = 1
                      AND fecha_inicio <= CURDATE()
                      AND (
                          fecha_fin IS NULL
                          OR fecha_fin >= CURDATE()
                      )
                    ORDER BY
                        fecha_inicio DESC,
                        id DESC
                    LIMIT 1
                `,
                [
                    id
                ]);


            const precioVigente =
                preciosVigentes.length > 0
                    ? preciosVigentes[0]
                    : null;


            // =================================================
            // ACTUALIZAR INFORMACIÓN DEL MATERIAL
            //
            // El código NO se modifica.
            // =================================================

            await connection.query(`
    UPDATE nomina_materiales
    SET
        nombre = ?,
        unidad = ?,
        descripcion = ?,
        updated_at = NOW()
    WHERE id = ?
`,
[
    nombreLimpio,
    unidadLimpia,
    descripcionLimpia,
    id
]);

            // =================================================
            // SI NO EXISTE PRECIO VIGENTE
            // =================================================

            if (!precioVigente) {

                await connection.query(`
                    INSERT INTO nomina_materiales_precios
                    (
                        material_id,
                        precio,
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
                        ?,
                        NULL,
                        1,
                        NULL,
                        NOW(),
                        NOW()
                    )
                `,
                [
                    id,
                    precio,
                    fechaInicio
                ]);

            } else {


                // =================================================
                // COMPARAR PRECIO Y FECHA
                // =================================================

                const precioAnterior =
                    Number(
                        precioVigente.precio
                    );


                const fechaAnterior =
                    String(
                        precioVigente.fecha_inicio
                    ).substring(0, 10);


                const mismoPrecio =
                    precioAnterior === precio;


                const mismaFecha =
                    fechaAnterior === fechaInicio;


                // =================================================
                // SI ES EL MISMO REGISTRO DE PRECIO
                // =================================================

                if (
                    mismoPrecio &&
                    mismaFecha
                ) {

                    // No necesitamos crear
                    // otro registro histórico.

                } else {


                    // =============================================
                    // LA NUEVA FECHA DEBE SER POSTERIOR
                    // A LA FECHA DEL PRECIO VIGENTE
                    // =============================================

                    if (
                        fechaInicio <= fechaAnterior
                    ) {

                        await connection.rollback();
                        connection.release();
                        connection = null;

                        return res.status(400).json({
                            ok: false,
                            error:
                                `La nueva fecha de inicio debe ser posterior a ${fechaAnterior}.`
                        });

                    }


                    // =============================================
                    // CALCULAR FECHA FIN DEL PRECIO ANTERIOR
                    // =============================================

                    const fechaNueva =
                        new Date(
                            `${fechaInicio}T00:00:00`
                        );


                    fechaNueva.setDate(
                        fechaNueva.getDate() - 1
                    );


                    const año =
                        fechaNueva.getFullYear();


                    const mes =
                        String(
                            fechaNueva.getMonth() + 1
                        ).padStart(2, '0');


                    const dia =
                        String(
                            fechaNueva.getDate()
                        ).padStart(2, '0');


                    const fechaFinAnterior =
                        `${año}-${mes}-${dia}`;


                    // =============================================
                    // CERRAR PRECIO ANTERIOR
                    // =============================================

                    await connection.query(`
                        UPDATE nomina_materiales_precios
                        SET
                            fecha_fin = ?,
                            activo = 0,
                            updated_at = NOW()
                        WHERE id = ?
                    `,
                    [
                        fechaFinAnterior,
                        precioVigente.id
                    ]);


                    // =============================================
                    // CREAR NUEVO PRECIO
                    // =============================================

                    await connection.query(`
                        INSERT INTO nomina_materiales_precios
                        (
                            material_id,
                            precio,
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
                            ?,
                            NULL,
                            1,
                            NULL,
                            NOW(),
                            NOW()
                        )
                    `,
                    [
                        id,
                        precio,
                        fechaInicio
                    ]);

                }

            }


            // =================================================
            // CONFIRMAR
            // =================================================

            await connection.commit();


            console.log(
                `✅ Material ${materiales[0].codigo} actualizado correctamente.`
            );


            return res.json({

                ok: true,

                mensaje:
                    'Material actualizado correctamente.',

                id:
                    id,

                codigo:
                    materiales[0].codigo

            });


        } catch (error) {


            // =================================================
            // ROLLBACK
            // =================================================

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
                '❌ Error actualizando material:',
                error
            );


            return res.status(500).json({

                ok: false,

                error:
                    'No fue posible actualizar el material.'

            });


        } finally {


            if (connection) {

                connection.release();

            }

        }

    }
);


// ---------------------------------------------------------
// ACTIVAR / DESACTIVAR MATERIAL
// ---------------------------------------------------------

router.patch(
    '/api/nomina/configuracion/materiales/:id/estado',
    async (req, res) => {

        const db = req.app.get('db');

        try {

            const id =
                Number(req.params.id);


            if (
                !id ||
                !Number.isInteger(id)
            ) {

                return res.status(400).json({
                    ok: false,
                    error:
                        'ID de material inválido.'
                });

            }


            const activo =
                req.body.activo ? 1 : 0;


            const [resultado] =
                await db.query(`
                    UPDATE nomina_materiales
                    SET
                        activo = ?,
                        updated_at = NOW()
                    WHERE id = ?
                `, [
                    activo,
                    id
                ]);


            if (
                resultado.affectedRows === 0
            ) {

                return res.status(404).json({
                    ok: false,
                    error:
                        'El material no existe.'
                });

            }


            res.json({

                ok: true,

                mensaje:
                    activo
                        ? 'Material activado correctamente.'
                        : 'Material desactivado correctamente.'

            });


        } catch (error) {

            console.error(
                '❌ Error cambiando estado del material:',
                error
            );


            res.status(500).json({

                ok: false,

                error:
                    'No fue posible cambiar el estado del material.'

            });

        }

    }
);

module.exports = router;
