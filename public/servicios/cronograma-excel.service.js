'use strict';

// ============================================================

// PROCESADOS MARGARITA S.A.S.

// CRONOGRAMA DE TRANSFORMÍN

// SERVICIO CORPORATIVO DE IMPORTACIÓN Y EXPORTACIÓN

// FORMATO FT-SST-147

// ============================================================

const ExcelJS = require('exceljs');

const path = require('path');

const fs = require('fs');

const crypto = require('crypto');

const db = require('../../DB');

const { obtenerFechaSugerida, validarAnio: validarAnioFechas } = require('./transformin-fechas.service');

// ============================================================

// 01. CONFIGURACIÓN GENERAL

// ============================================================

const CONFIG = Object.freeze({

    codigo: 'FT-SST-147',

    version: '001',

    titulo: 'Cronograma de Actividades para Transformín',

    hoja: 'Cronograma mantenimiento',

    plantilla: path.join(

        __dirname,

        'plantillas',

        'FT-SST-147.xlsx'

    ),

    filaInicial: 10,

    filaFinal: 45,

    columnaEquipo: 1,

    columnaActividad: 2,

    columnaFrecuencia: 3,

    columnaResponsable: 60,

    filaRealizadas: 47,

    filaProgramadas: 48,

    filaCumplimiento: 49,

    maximoArchivo: 5 * 1024 * 1024,

    zonaHoraria: 'America/Bogota'

});

// ============================================================

// 02. DISTRIBUCIÓN CORPORATIVA

// ============================================================

const MESES = Object.freeze([

    { mes: 1, nombre: 'ENERO', inicio: 4, semanas: 5 },

    { mes: 2, nombre: 'FEBRERO', inicio: 9, semanas: 4 },

    { mes: 3, nombre: 'MARZO', inicio: 13, semanas: 5 },

    { mes: 4, nombre: 'ABRIL', inicio: 18, semanas: 5 },

    { mes: 5, nombre: 'MAYO', inicio: 23, semanas: 4 },

    { mes: 6, nombre: 'JUNIO', inicio: 27, semanas: 5 },

    { mes: 7, nombre: 'JULIO', inicio: 32, semanas: 5 },

    { mes: 8, nombre: 'AGOSTO', inicio: 37, semanas: 4 },

    { mes: 9, nombre: 'SEPTIEMBRE', inicio: 41, semanas: 5 },

    { mes: 10, nombre: 'OCTUBRE', inicio: 46, semanas: 4 },

    { mes: 11, nombre: 'NOVIEMBRE', inicio: 50, semanas: 5 },

    { mes: 12, nombre: 'DICIEMBRE', inicio: 55, semanas: 5 }

]);

const ESTADOS = Object.freeze([

    'PENDIENTE',

    'EN_PROCESO',

    'COMPLETADA',

    'CANCELADA'

]);

const MARCAS_VALIDAS = Object.freeze([

    'P',

    'R',

    'X'

]);

const CONTENT_TYPE =

    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

// ============================================================

// 03. FUNCIONES AUXILIARES

// ============================================================

function errorValidacion(mensaje, status = 400) {

    const error = new Error(mensaje);

    error.status = status;

    error.statusCode = status;

    return error;

}

function normalizarTexto(valor) {

    return String(valor ?? '')

        .normalize('NFC')

        .trim();

}

function normalizarComparacion(valor) {

    return normalizarTexto(valor)

        .normalize('NFD')

        .replace(/[\u0300-\u036f]/g, '')

        .replace(/\s+/g, ' ')

        .toUpperCase();

}

function numero(valor) {

    const resultado = Number(valor);

    return Number.isFinite(resultado)

        ? resultado

        : 0;

}

function porcentaje(completadas, programadas) {

    if (!programadas) {

        return null;

    }

    return Number(

        (

            completadas /

            programadas *

            100

        ).toFixed(2)

    );

}

function validarAnio(anio) {
    try {
        return validarAnioFechas(anio);
    } catch (error) {
        throw errorValidacion(error.message);
    }
}

function obtenerFechaActual() {

    const partes = new Intl.DateTimeFormat('en-CA', {

        timeZone: CONFIG.zonaHoraria,

        year: 'numeric',

        month: '2-digit',

        day: '2-digit'

    }).formatToParts(new Date());

    const valores = Object.fromEntries(

        partes.map(parte => [

            parte.type,

            parte.value

        ])

    );

    return (

        `${valores.year}-` +

        `${valores.month}-` +

        `${valores.day}`

    );

}

function obtenerAnioActual() {

    return Number(

        obtenerFechaActual().slice(0, 4)

    );

}

function obtenerHash(buffer) {

    return crypto

        .createHash('sha256')

        .update(buffer)

        .digest('hex');

}

function generarClaveImportacion(equipo, actividad) {

    return crypto

        .createHash('sha256')

        .update(

            normalizarComparacion(

                equipo || actividad

            ),

            'utf8'

        )

        .digest('hex');

}

function letraColumna(numeroColumna) {

    let resultado = '';

    while (numeroColumna > 0) {

        numeroColumna--;

        resultado =

            String.fromCharCode(

                65 + numeroColumna % 26

            ) + resultado;

        numeroColumna = Math.floor(

            numeroColumna / 26

        );

    }

    return resultado;

}

function nombreArchivoSeguro(nombreArchivo) {

    return path.basename(

        String(

            nombreArchivo ||

            'FT-SST-147.xlsx'

        ).replace(/\\/g, '/')

    ).slice(0, 255);

}

// ============================================================

// 04. LECTURA DE CELDAS

// ============================================================

function obtenerTextoCelda(celda) {

    if (!celda || celda.value == null) {

        return '';

    }

    const valor = celda.value;

    if (typeof valor === 'string') {

        return valor.trim();

    }

    if (

        typeof valor === 'number' ||

        typeof valor === 'boolean'

    ) {

        return String(valor);

    }

    if (valor instanceof Date) {

        return valor.toISOString().slice(0, 10);

    }

    if (typeof valor === 'object') {

        if (valor.error || valor.result?.error) {

            throw errorValidacion(

                `La celda ${celda.address} contiene un error.`

            );

        }

        if (Array.isArray(valor.richText)) {

            return valor.richText

                .map(parte => parte.text || '')

                .join('')

                .trim();

        }

        if (valor.formula || valor.sharedFormula) {

            return normalizarTexto(valor.result);

        }

        if (valor.text != null) {

            return normalizarTexto(valor.text);

        }

    }

    return normalizarTexto(celda.text);

}

// ============================================================

// 05. CLASIFICACIÓN DE EVENTOS

// ============================================================

function identificarTipo(equipo) {

    const texto = normalizarComparacion(equipo);

    const ambientales = [

        'AMBIENTAL',

        'AMBIENTE',

        'RECICLAJE',

        'RECICLADOR',

        'AGUA',

        'TIERRA',

        'HUMEDALES',

        'BIODIVERSIDAD',

        'CLIMATICO',

        'AIRE PURO',

        'SOSTENIBILIDAD'

    ];

    const institucionales = [

        'SEGURIDAD',

        'SALUD EN EL TRABAJO',

        'INDEPENDENCIA',

        'BOYACA',

        'INSTITUCIONAL',

        'EMPRESARIAL'

    ];

    const celebraciones = [

        'CUMPLEANOS',

        'NAVIDAD',

        'HALLOWEEN',

        'VELITAS',

        'ANO NUEVO',

        'ANO VIEJO',

        'CARNAVAL',

        'MADRE',

        'PADRE',

        'MUJER',

        'HOMBRE',

        'AMOR Y AMISTAD'

    ];

    if (

        ambientales.some(

            item => texto.includes(item)

        )

    ) {

        return 'AMBIENTAL';

    }

    if (

        institucionales.some(

            item => texto.includes(item)

        )

    ) {

        return 'INSTITUCIONAL';

    }

    if (

        celebraciones.some(

            item => texto.includes(item)

        )

    ) {

        return 'CELEBRACION';

    }

    return 'OTRO';

}

// ============================================================

// 06. INTERPRETACIÓN DE MARCAS

// ============================================================

function interpretarMarca(valor) {

    const marca = normalizarComparacion(valor);

    switch (marca) {

        case '':

            return {

                marca_original: null,

                programada: 0,

                estado: 'PENDIENTE'

            };

        case 'P':

            return {

                marca_original: 'P',

                programada: 1,

                estado: 'PENDIENTE'

            };

        case 'R':

            return {

                marca_original: 'R',

                programada: 1,

                estado: 'COMPLETADA'

            };

        case 'X':

            return {

                marca_original: 'X',

                programada: 0,

                estado: 'PENDIENTE'

            };

        default:

            throw errorValidacion(

                `La marca "${marca}" no pertenece al formato FT-SST-147.`

            );

    }

}

function obtenerMarcaExportacion(semana) {

    if (!semana) {

        return null;

    }

    if (numero(semana.programada) !== 1) {

        return semana.marca_original === 'X'

            ? 'X'

            : null;

    }

    if (semana.estado === 'COMPLETADA') {

        return 'R';

    }

    // Las actividades canceladas conservan

    // su programación original en Excel.

    // No deben contabilizarse como realizadas.

    return 'P';

}

// ============================================================

// 07. VALIDACIÓN DEL ARCHIVO

// ============================================================

function validarArchivo(buffer, nombreArchivo) {

    if (

        !Buffer.isBuffer(buffer) ||

        buffer.length === 0

    ) {

        throw errorValidacion(

            'No se recibió un archivo Excel válido.'

        );

    }

    if (buffer.length > CONFIG.maximoArchivo) {

        throw errorValidacion(

            'El archivo supera el máximo de 5 MB.',

            413

        );

    }

    if (

        nombreArchivo &&

        path.extname(nombreArchivo).toLowerCase() !== '.xlsx'

    ) {

        throw errorValidacion(

            'Únicamente se permiten archivos .xlsx.'

        );

    }

    if (

        buffer[0] !== 0x50 ||

        buffer[1] !== 0x4B

    ) {

        throw errorValidacion(

            'El archivo no corresponde a un documento XLSX válido.'

        );

    }

}

// ============================================================

// 08. VALIDACIÓN DE LA PLANTILLA CORPORATIVA

// ============================================================

function validarEstructura(hoja) {

    if (!hoja) {

        throw errorValidacion(

            `No se encontró la hoja "${CONFIG.hoja}".`

        );

    }

    const codigo = normalizarComparacion(

        obtenerTextoCelda(

            hoja.getCell('BC2')

        )

    );

    if (codigo !== CONFIG.codigo) {

        throw errorValidacion(

            'El documento no corresponde al formato FT-SST-147.'

        );

    }

    const encabezados = [

        ['A7', 'EQUIPO'],

        ['B7', 'ACTIVIDAD'],

        ['C7', 'FRECUENCIA'],

        ['BH7', 'RESPONSABLE']

    ];

    for (const [celda, esperado] of encabezados) {

        const actual = normalizarComparacion(

            obtenerTextoCelda(

                hoja.getCell(celda)

            )

        );

        if (actual !== esperado) {

            throw errorValidacion(

                `El encabezado ${celda} debe ser "${esperado}".`

            );

        }

    }

    for (const mes of MESES) {

        const nombre = normalizarComparacion(

            obtenerTextoCelda(

                hoja.getCell(7, mes.inicio)

            )

        );

        if (nombre !== mes.nombre) {

            throw errorValidacion(

                `La distribución de ${mes.nombre} no es válida.`

            );

        }

        for (

            let semana = 1;

            semana <= mes.semanas;

            semana++

        ) {

            const columna =

                mes.inicio + semana - 1;

            const valor = Number(

                obtenerTextoCelda(

                    hoja.getCell(9, columna)

                )

            );

            if (valor !== semana) {

                throw errorValidacion(

                    `Semana incorrecta en ${mes.nombre}.`

                );

            }

        }

    }

    return true;

}

// ============================================================

// 09. LECTURA DE PROGRAMACIÓN SEMANAL

// ============================================================

function leerSemanas(hoja, fila) {

    const semanas = [];

    for (const mes of MESES) {

        for (

            let semana = 1;

            semana <= mes.semanas;

            semana++

        ) {

            const columna =

                mes.inicio + semana - 1;

            const celda = hoja.getCell(

                fila,

                columna

            );

            const marca = normalizarComparacion(

                obtenerTextoCelda(celda)

            );

            if (!marca) {

                continue;

            }

            if (!MARCAS_VALIDAS.includes(marca)) {

                throw errorValidacion(

                    `Marca incorrecta "${marca}" en ${celda.address}.`

                );

            }

            const interpretacion =

                interpretarMarca(marca);

            semanas.push({

                mes: mes.mes,

                nombre_mes: mes.nombre,

                semana_mes: semana,

                columna,

                celda: celda.address,

                marca_original:

                    interpretacion.marca_original,

                programada:

                    interpretacion.programada,

                estado:

                    interpretacion.estado,

                fecha_programada: null,

                fecha_realizacion: null

            });

        }

    }

    return semanas;

}

// ============================================================

// 10. ESTADO GENERAL DE UNA ACTIVIDAD

// ============================================================

function calcularEstadoActividad(semanas = []) {

    const programadas = semanas.filter(

        semana => numero(semana.programada) === 1

    );

    if (!programadas.length) {

        return 'PENDIENTE';

    }

    if (

        programadas.every(

            semana => semana.estado === 'COMPLETADA'

        )

    ) {

        return 'COMPLETADA';

    }

    if (

        programadas.every(

            semana => semana.estado === 'CANCELADA'

        )

    ) {

        return 'CANCELADA';

    }

    if (

        programadas.some(

            semana => [

                'COMPLETADA',

                'EN_PROCESO',

                'CANCELADA'

            ].includes(semana.estado)

        )

    ) {

        return 'EN_PROCESO';

    }

    return 'PENDIENTE';

}

// ============================================================

// 11. LECTURA DE ACTIVIDADES

// ============================================================

function leerActividad(hoja, fila) {

    const equipo = obtenerTextoCelda(

        hoja.getCell(

            fila,

            CONFIG.columnaEquipo

        )

    );

    const actividad = obtenerTextoCelda(

        hoja.getCell(

            fila,

            CONFIG.columnaActividad

        )

    );

    const frecuencia = obtenerTextoCelda(

        hoja.getCell(

            fila,

            CONFIG.columnaFrecuencia

        )

    );

    const responsable = obtenerTextoCelda(

        hoja.getCell(

            fila,

            CONFIG.columnaResponsable

        )

    );

    const semanas = leerSemanas(

        hoja,

        fila

    );

    if (

        !equipo &&

        !actividad &&

        !frecuencia &&

        !responsable &&

        !semanas.length

    ) {

        return null;

    }

    if (!equipo || !actividad) {

        throw errorValidacion(

            `La fila ${fila} requiere equipo y actividad.`

        );

    }

    if (equipo.length > 255) {

        throw errorValidacion(

            `El equipo de la fila ${fila} supera 255 caracteres.`

        );

    }

    if (actividad.length > 65535) {

        throw errorValidacion(

            `La descripción de la fila ${fila} es demasiado extensa.`

        );

    }

    if (frecuencia.length > 100) {

        throw errorValidacion(

            `La frecuencia de la fila ${fila} supera 100 caracteres.`

        );

    }

    if (responsable.length > 500) {

        throw errorValidacion(

            `El responsable de la fila ${fila} supera 500 caracteres.`

        );

    }

    return {

        fila,

        orden_excel: fila,

        clave_importacion:

            generarClaveImportacion(

                equipo,

                actividad

            ),

        equipo,

        actividad: equipo,

        descripcion: actividad,

        frecuencia: frecuencia || null,

        responsable: responsable || null,

        tipo: identificarTipo(equipo),

        prioridad: 'MEDIA',

        estado: calcularEstadoActividad(semanas),

        fecha_exacta: null,

        totalProgramadas: semanas.filter(

            semana => numero(semana.programada) === 1

        ).length,

        semanas

    };

}

// ============================================================

// 12. INDICADORES ANUALES Y MENSUALES

// ============================================================

function crearIndicador() {

    return {

        programadas: 0,

        completadas: 0,

        realizadas: 0,

        pendientes: 0,

        enProceso: 0,

        canceladas: 0,

        sinClasificar: 0,

        sin_clasificar: 0,

        porcentaje: null

    };

}

function calcularIndicadores(

    actividades = [],

    anio = obtenerAnioActual()

) {

    anio = validarAnio(anio);

    const hoy = obtenerFechaActual();

    const anioHoy = Number(

        hoy.slice(0, 4)

    );

    const mesHoy = Number(

        hoy.slice(5, 7)

    );

    const mensual = MESES.map(mes => ({

        mes: mes.mes,

        nombre: mes.nombre,

        ...crearIndicador()

    }));

    const anual = crearIndicador();

    const cumplimientoAlCorte = {

        fecha: hoy,

        programadas: 0,

        completadas: 0,

        realizadas: 0,

        porcentaje: null

    };

    for (const actividad of actividades) {

        for (const semana of actividad.semanas || []) {

            const mes = numero(semana.mes);

            const indicador = mensual[mes - 1];

            if (!indicador) {

                continue;

            }

            if (

                semana.marca_original === 'X' &&

                numero(semana.programada) === 0

            ) {

                indicador.sinClasificar++;

                indicador.sin_clasificar++;

                continue;

            }

            if (numero(semana.programada) !== 1) {

                continue;

            }

            indicador.programadas++;

            switch (semana.estado) {

                case 'COMPLETADA':

                    indicador.completadas++;

                    indicador.realizadas++;

                    break;

                case 'CANCELADA':

                    indicador.canceladas++;

                    break;

                case 'EN_PROCESO':

                    indicador.enProceso++;

                    indicador.pendientes++;

                    break;

                default:

                    indicador.pendientes++;

            }

            const fechaProgramada =

                semana.fecha_programada;

            let correspondeAlCorte = false;

            if (fechaProgramada) {

                correspondeAlCorte =

                    String(fechaProgramada).slice(0, 10) <= hoy;

            } else if (anio < anioHoy) {

                correspondeAlCorte = true;

            } else if (

                anio === anioHoy &&

                mes < mesHoy

            ) {

                correspondeAlCorte = true;

            }

            if (correspondeAlCorte) {

                cumplimientoAlCorte.programadas++;

                if (

                    semana.estado === 'COMPLETADA' &&

                    (

                        !semana.fecha_realizacion ||

                        String(

                            semana.fecha_realizacion

                        ).slice(0, 10) <= hoy

                    )

                ) {

                    cumplimientoAlCorte.completadas++;

                    cumplimientoAlCorte.realizadas++;

                }

            }

        }

    }

    for (const mes of mensual) {

        mes.porcentaje = porcentaje(

            mes.completadas,

            mes.programadas

        );

        anual.programadas += mes.programadas;

        anual.completadas += mes.completadas;

        anual.realizadas += mes.realizadas;

        anual.pendientes += mes.pendientes;

        anual.enProceso += mes.enProceso;

        anual.canceladas += mes.canceladas;

        anual.sinClasificar += mes.sinClasificar;

        anual.sin_clasificar += mes.sin_clasificar;

    }

    anual.porcentaje = porcentaje(

        anual.completadas,

        anual.programadas

    );

    cumplimientoAlCorte.porcentaje = porcentaje(

        cumplimientoAlCorte.completadas,

        cumplimientoAlCorte.programadas

    );

    return {

        anio,

        anual,

        mensual,

        cumplimientoAlCorte

    };

}

// ============================================================

// 13. PREVISUALIZACIÓN DEL EXCEL

// ============================================================

async function previsualizarExcel(

    buffer,

    nombreArchivo,

    anio = obtenerAnioActual()

) {

    validarArchivo(

        buffer,

        nombreArchivo

    );

    anio = validarAnio(anio);

    const libro = new ExcelJS.Workbook();

    try {

        await libro.xlsx.load(buffer);

    } catch {

        throw errorValidacion(

            'No fue posible abrir el documento Excel.'

        );

    }

    const hoja = libro.getWorksheet(

        CONFIG.hoja

    );

    validarEstructura(hoja);

    const registros = [];

    const errores = [];

    const advertencias = [];

    const claves = new Set();

    for (

        let fila = CONFIG.filaInicial;

        fila <= CONFIG.filaFinal;

        fila++

    ) {

        try {

            const actividad = leerActividad(

                hoja,

                fila

            );

            if (!actividad) {

                continue;

            }

            // Sugerir fechas únicamente para registros nuevos.

            // No alterar las marcas ni la distribución semanal del Excel.

            actividad.fecha_exacta = obtenerFechaSugerida(actividad.actividad, anio);

            if (actividad.fecha_exacta) {

                const mes = Number(actividad.fecha_exacta.slice(5, 7));

                const candidatas = actividad.semanas.filter(semana =>

                    semana.programada === 1 && semana.mes === mes

                );

                // Solo asignar a una semana si no existe ambigüedad.

                if (candidatas.length === 1) {

                    candidatas[0].fecha_programada = actividad.fecha_exacta;

                }

            }

            if (

                claves.has(

                    actividad.clave_importacion

                )

            ) {

                throw errorValidacion(

                    `La actividad "${actividad.equipo}" está duplicada.`

                );

            }

            claves.add(

                actividad.clave_importacion

            );

            const marcasX = actividad.semanas.filter(

                semana => semana.marca_original === 'X'

            );

            if (marcasX.length) {

                advertencias.push({

                    fila,

                    mensaje:

                        'Contiene marcas X pendientes de clasificación.',

                    celdas: marcasX.map(

                        semana => semana.celda

                    )

                });

            }

            registros.push({

                ...actividad,

                valido: true

            });

        } catch (error) {

            errores.push({

                fila,

                mensaje: error.message

            });

        }

    }

    if (

        registros.length === 0 &&

        errores.length === 0

    ) {

        errores.push({

            fila: null,

            mensaje: 'El documento no contiene actividades.'

        });

    }

    const indicadores = calcularIndicadores(

        registros,

        anio

    );

    const mensaje = errores.length

        ? 'El documento contiene errores de validación.'

        : 'Documento validado correctamente.';

    return {

        success: errores.length === 0,

        codigo: CONFIG.codigo,

        anio,

        nombreArchivo:

            nombreArchivoSeguro(nombreArchivo),

        hash: obtenerHash(buffer),

        totalRegistros:

            registros.length + errores.length,

        totalValidos: registros.length,

        totalErrores: errores.length,

        totalAdvertencias: advertencias.length,

        registros,

        actividades: registros,

        errores,

        advertencias,

        indicadores,

        mensaje,

        message: mensaje

    };

}

// ============================================================

// 14. OBTENER O CREAR CRONOGRAMA

// ============================================================

async function obtenerOCrearCronograma(

    conexion,

    anio,

    usuarioId = null

) {

    await conexion.execute(

        `

        INSERT INTO transformin_ft147_cronogramas (

            anio,

            codigo_formato,

            version_formato,

            titulo,

            estado,

            creado_por,

            actualizado_por

        )

        VALUES (?, ?, ?, ?, 'ACTIVO', ?, ?)

        ON DUPLICATE KEY UPDATE

            id = LAST_INSERT_ID(id)

        `,

        [

            anio,

            CONFIG.codigo,

            CONFIG.version,

            CONFIG.titulo,

            usuarioId,

            usuarioId

        ]

    );

    const [filas] = await conexion.execute(

        `

        SELECT

            id,

            estado

        FROM transformin_ft147_cronogramas

        WHERE anio = ?

        AND codigo_formato = ?

        LIMIT 1

        FOR UPDATE

        `,

        [

            anio,

            CONFIG.codigo

        ]

    );

    if (!filas.length) {

        throw new Error(

            'No fue posible obtener el cronograma anual.'

        );

    }

    const cronograma = filas[0];

    if (cronograma.estado === 'CERRADO') {

        throw errorValidacion(

            'El cronograma seleccionado se encuentra cerrado.',

            409

        );

    }

    await conexion.execute(

        `

        UPDATE transformin_ft147_cronogramas

        SET

            actualizado_por = ?

        WHERE id = ?

        `,

        [

            usuarioId,

            cronograma.id

        ]

    );

    return cronograma.id;

}

// ============================================================

// 15. GUARDAR ACTIVIDAD INSTITUCIONAL

// ============================================================

async function guardarActividad(

    conexion,

    cronogramaId,

    actividad

) {

    const [existentes] = await conexion.execute(

        `

        SELECT

            id

        FROM transformin_ft147_actividades

        WHERE cronograma_id = ?

        AND clave_importacion = ?

        LIMIT 1

        FOR UPDATE

        `,

        [

            cronogramaId,

            actividad.clave_importacion

        ]

    );

    if (existentes.length) {

        const actividadId = existentes[0].id;

        await conexion.execute(

            `

            UPDATE transformin_ft147_actividades

            SET

                orden_excel = ?,

                equipo = ?,

                actividad = ?,

                descripcion = ?,

                frecuencia = ?,

                responsable = ?

            WHERE id = ?

            `,

            [

                actividad.orden_excel,

                actividad.equipo,

                actividad.actividad,

                actividad.descripcion,

                actividad.frecuencia,

                actividad.responsable,

                actividadId

            ]

        );

        return {

            id: actividadId,

            nueva: false

        };

    }

    const [resultado] = await conexion.execute(

        `

        INSERT INTO transformin_ft147_actividades (

            cronograma_id,

            clave_importacion,

            orden_excel,

            equipo,

            actividad,

            descripcion,

            frecuencia,

            responsable,

            tipo,

            prioridad,

            estado,

            fecha_exacta

        )

        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)

        `,

        [

            cronogramaId,

            actividad.clave_importacion,

            actividad.orden_excel,

            actividad.equipo,

            actividad.actividad,

            actividad.descripcion,

            actividad.frecuencia,

            actividad.responsable,

            actividad.tipo,

            actividad.prioridad,

            actividad.estado,

            actividad.fecha_exacta

        ]

    );

    return {

        id: resultado.insertId,

        nueva: true

    };

}

// ============================================================

// 16. GUARDAR SEMANAS PROGRAMADAS

// ============================================================

async function guardarSemanas(

    conexion,

    actividadId,

    semanas,

    usuarioId = null

) {

    for (const semana of semanas) {

        const [existentes] = await conexion.execute(

            `

            SELECT *

            FROM transformin_ft147_semanas

            WHERE actividad_id = ?

            AND mes = ?

            AND semana_mes = ?

            LIMIT 1

            FOR UPDATE

            `,

            [

                actividadId,

                semana.mes,

                semana.semana_mes

            ]

        );

        const anterior = existentes[0];

        if (!anterior) {

            await conexion.execute(

                `

                INSERT INTO transformin_ft147_semanas (

                    actividad_id,

                    mes,

                    semana_mes,

                    marca_original,

                    programada,

                    estado,

                    fecha_programada,

                    fecha_realizacion,

                    actualizado_por

                )

                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)

                `,

                [

                    actividadId,

                    semana.mes,

                    semana.semana_mes,

                    semana.marca_original,

                    semana.programada,

                    semana.estado,

                    semana.fecha_programada,

                    semana.fecha_realizacion,

                    usuarioId

                ]

            );

            continue;

        }

        // No sobrescribir estados definitivos

        // establecidos previamente desde el ERP.

        if (

            [

                'COMPLETADA',

                'CANCELADA'

            ].includes(anterior.estado)

        ) {

            continue;

        }

        // Una fecha registrada no se elimina mediante una marca X importada.

        if (anterior.fecha_programada && numero(semana.programada) !== 1) {

            continue;

        }

        let estado = semana.estado;

        if (

            anterior.estado === 'EN_PROCESO' &&

            semana.marca_original === 'P'

        ) {

            estado = 'EN_PROCESO';

        }

        await conexion.execute(

            `

            UPDATE transformin_ft147_semanas

            SET

                marca_original = ?,

                programada = ?,

                estado = ?,

                fecha_programada = CASE

                    WHEN ? = 1

                    THEN fecha_programada

                    ELSE NULL

                END,

                actualizado_por = ?

            WHERE id = ?

            `,

            [

                semana.marca_original,

                semana.programada,

                estado,

                semana.programada,

                usuarioId,

                anterior.id

            ]

        );

    }

}

// ============================================================

// 17. ACTUALIZAR ESTADO GENERAL

// ============================================================

async function actualizarEstadoInstitucional(

    conexion,

    actividadId

) {

    const [semanas] = await conexion.execute(

        `

        SELECT

            programada,

            estado

        FROM transformin_ft147_semanas

        WHERE actividad_id = ?

        `,

        [actividadId]

    );

    const estado = calcularEstadoActividad(

        semanas

    );

    await conexion.execute(

        `

        UPDATE transformin_ft147_actividades

        SET estado = ?

        WHERE id = ?

        `,

        [

            estado,

            actividadId

        ]

    );

    return estado;

}

// ============================================================

// 18. IMPORTACIÓN DEFINITIVA

// ============================================================

async function importarExcel(

    buffer,

    nombreArchivo,

    anio = obtenerAnioActual(),

    usuarioId = null

) {

    const vistaPrevia = await previsualizarExcel(

        buffer,

        nombreArchivo,

        anio

    );

    if (!vistaPrevia.success) {

        return {

            ...vistaPrevia,

            mensaje:

                'Corrige los errores antes de importar.',

            message:

                'Corrige los errores antes de importar.'

        };

    }

    const conexion = await db.getConnection();

    let cronogramaId = null;

    let importacionId = null;

    try {

        await conexion.beginTransaction();

        cronogramaId = await obtenerOCrearCronograma(

            conexion,

            vistaPrevia.anio,

            usuarioId

        );

        const [anteriores] = await conexion.execute(

            `

            SELECT id

            FROM transformin_ft147_importaciones

            WHERE cronograma_id = ?

            AND sha256_archivo = ?

            AND estado = 'COMPLETADA'

            LIMIT 1

            `,

            [

                cronogramaId,

                vistaPrevia.hash

            ]

        );

        if (anteriores.length) {

            await conexion.rollback();

            return {

                success: true,

                anio: vistaPrevia.anio,

                duplicado: true,

                importados: 0,

                actualizados: 0,

                duplicados: vistaPrevia.totalValidos,

                mensaje:

                    'Este archivo ya fue importado anteriormente.',

                message:

                    'Este archivo ya fue importado anteriormente.'

            };

        }

        const [registro] = await conexion.execute(

            `

            INSERT INTO transformin_ft147_importaciones (

                cronograma_id,

                nombre_archivo,

                sha256_archivo,

                filas_leidas,

                estado,

                importado_por

            )

            VALUES (?, ?, ?, ?, 'INICIADA', ?)

            `,

            [

                cronogramaId,

                nombreArchivoSeguro(nombreArchivo),

                vistaPrevia.hash,

                vistaPrevia.totalRegistros,

                usuarioId

            ]

        );

        importacionId = registro.insertId;

        let insertadas = 0;

        let actualizadas = 0;

        for (const actividad of vistaPrevia.registros) {

            const resultado = await guardarActividad(

                conexion,

                cronogramaId,

                actividad

            );

            await guardarSemanas(

                conexion,

                resultado.id,

                resultado.nueva ? actividad.semanas : actividad.semanas.map(semana => ({

                    ...semana,

                    fecha_programada: null

                })),

                usuarioId

            );

            await actualizarEstadoInstitucional(

                conexion,

                resultado.id

            );

            if (resultado.nueva) {

                insertadas++;

            } else {

                actualizadas++;

            }

        }

        await conexion.execute(

            `

            UPDATE transformin_ft147_importaciones

            SET

                filas_insertadas = ?,

                filas_actualizadas = ?,

                filas_omitidas = 0,

                estado = 'COMPLETADA',

                finished_at = CURRENT_TIMESTAMP

            WHERE id = ?

            `,

            [

                insertadas,

                actualizadas,

                importacionId

            ]

        );

        await conexion.commit();

        return {

            success: true,

            cronogramaId,

            importacionId,

            anio: vistaPrevia.anio,

            importados: insertadas,

            insertados: insertadas,

            actualizados: actualizadas,

            duplicados: 0,

            advertencias: vistaPrevia.advertencias,

            mensaje:

                'Cronograma importado correctamente.',

            message:

                'Cronograma importado correctamente.'

        };

    } catch (error) {

        await conexion.rollback();

        if (cronogramaId) {

            try {

                await conexion.execute(

                    `

                    INSERT INTO transformin_ft147_importaciones (

                        cronograma_id,

                        nombre_archivo,

                        sha256_archivo,

                        filas_leidas,

                        estado,

                        detalle_error,

                        importado_por,

                        finished_at

                    )

                    SELECT

                        id,

                        ?,

                        ?,

                        ?,

                        'FALLIDA',

                        ?,

                        ?,

                        CURRENT_TIMESTAMP

                    FROM transformin_ft147_cronogramas

                    WHERE id = ?

                    `,

                    [

                        nombreArchivoSeguro(nombreArchivo),

                        vistaPrevia.hash,

                        vistaPrevia.totalRegistros,

                        String(error.message).slice(0, 1000),

                        usuarioId,

                        cronogramaId

                    ]

                );

            } catch (errorHistorial) {

                console.error(

                    '[TRANSFORMÍN] Error registrando importación:',

                    errorHistorial.message

                );

            }

        }

        throw error;

    } finally {

        conexion.release();

    }

}

// ============================================================

// 19. CONSULTAR CRONOGRAMA CORPORATIVO

// ============================================================

async function obtenerCronograma(

    anio = obtenerAnioActual()

) {

    anio = validarAnio(anio);

    const conexion = await db.getConnection();

    try {

        await conexion.beginTransaction();

        const [cronogramas] = await conexion.execute(

            `

            SELECT

                c.*,

                DATE_FORMAT(

                    c.fecha_documento,

                    '%Y-%m-%d'

                ) AS fecha_documento

            FROM transformin_ft147_cronogramas c

            WHERE c.anio = ?

            AND c.codigo_formato = ?

            LIMIT 1

            `,

            [

                anio,

                CONFIG.codigo

            ]

        );

        if (!cronogramas.length) {

            await conexion.commit();

            return {

                success: true,

                anio,

                cronograma: null,

                total: 0,

                actividades: [],

                indicadores:

                    calcularIndicadores([], anio)

            };

        }

        const cronograma = cronogramas[0];

        const [actividades] = await conexion.execute(

            `

            SELECT

                a.*,

                DATE_FORMAT(

                    a.fecha_exacta,

                    '%Y-%m-%d'

                ) AS fecha_exacta

            FROM transformin_ft147_actividades a

            WHERE a.cronograma_id = ?

            ORDER BY

                a.orden_excel IS NULL,

                a.orden_excel ASC,

                a.id ASC

            `,

            [cronograma.id]

        );

        const [semanas] = await conexion.execute(

            `

            SELECT

                s.*,

                DATE_FORMAT(

                    s.fecha_programada,

                    '%Y-%m-%d'

                ) AS fecha_programada,

                DATE_FORMAT(

                    s.fecha_realizacion,

                    '%Y-%m-%d'

                ) AS fecha_realizacion

            FROM transformin_ft147_semanas s

            INNER JOIN transformin_ft147_actividades a

                ON a.id = s.actividad_id

            WHERE a.cronograma_id = ?

            ORDER BY

                s.mes,

                s.semana_mes

            `,

            [cronograma.id]

        );

        const agrupadas = new Map();

        for (const semana of semanas) {

            const clave = String(

                semana.actividad_id

            );

            if (!agrupadas.has(clave)) {

                agrupadas.set(clave, []);

            }

            agrupadas.get(clave).push({

                ...semana,

                // Alias de identificación para el frontend.

                semana_id: semana.id,

                semanaId: semana.id,

                programacionId: semana.id,

                actividadId: semana.actividad_id,

                mes: numero(semana.mes),

                semana_mes:

                    numero(semana.semana_mes),

                programada:

                    numero(semana.programada),

                nombre_mes:

                    MESES[numero(semana.mes) - 1]?.nombre ||

                    ''

            });

        }

        const registros = actividades.map(actividad => {

            const semanasActividad =

                agrupadas.get(

                    String(actividad.id)

                ) || [];

            const programadas =

                semanasActividad.filter(

                    semana => semana.programada === 1

                );

            const completadas =

                programadas.filter(

                    semana => semana.estado === 'COMPLETADA'

                ).length;

            return {

                ...actividad,

                // Conservar id original y exponer alias compatibles.

                actividad_id: actividad.id,

                actividadId: actividad.id,

                origen: 'FT147',

                anio,

                nombre:

                    actividad.equipo ||

                    actividad.actividad,

                fecha:

                    actividad.fecha_exacta || null,

                observaciones:

                    actividad.notas || '',

                estado:

                    calcularEstadoActividad(

                        semanasActividad

                    ),

                totalProgramadas:

                    programadas.length,

                totalCompletadas:

                    completadas,

                totalPendientes:

                    programadas.filter(

                        semana => [

                            'PENDIENTE',

                            'EN_PROCESO'

                        ].includes(semana.estado)

                    ).length,

                porcentaje: porcentaje(

                    completadas,

                    programadas.length

                ),

                semanas: semanasActividad

            };

        });

        await conexion.commit();

        return {

            success: true,

            anio,

            cronograma,

            total: registros.length,

            actividades: registros,

            indicadores: calcularIndicadores(

                registros,

                anio

            )

        };

    } catch (error) {

        await conexion.rollback();

        throw error;

    } finally {

        conexion.release();

    }

}

// ============================================================

// 20. CONSULTAR INDICADORES

// ============================================================

async function obtenerIndicadores(

    anio = obtenerAnioActual()

) {

    const resultado = await obtenerCronograma(

        anio

    );

    return {

        success: true,

        ...resultado.indicadores

    };

}

async function obtenerCumplimientoAnual(

    anio = obtenerAnioActual()

) {

    return obtenerIndicadores(anio);

}

// ============================================================

// 21. CARGAR PLANTILLA ORIGINAL

// ============================================================

async function cargarPlantilla() {

    if (!fs.existsSync(CONFIG.plantilla)) {

        throw new Error(

            'No se encontró la plantilla corporativa FT-SST-147.xlsx.'

        );

    }

    const libro = new ExcelJS.Workbook();

    await libro.xlsx.readFile(

        CONFIG.plantilla

    );

    const hoja = libro.getWorksheet(

        CONFIG.hoja

    );

    validarEstructura(hoja);

    return {

        libro,

        hoja

    };

}

// ============================================================

// 22. LIMPIAR CELDAS DE DATOS

// ============================================================

function limpiarDatosPlantilla(hoja) {

    for (

        let fila = CONFIG.filaInicial;

        fila <= CONFIG.filaFinal;

        fila++

    ) {

        for (

            let columna = 1;

            columna <= CONFIG.columnaResponsable;

            columna++

        ) {

            const celda = hoja.getCell(

                fila,

                columna

            );

            if (

                celda.isMerged &&

                celda.master !== celda

            ) {

                continue;

            }

            celda.value = null;

        }

    }

}

// ============================================================

// 23. ESCRIBIR ACTIVIDADES

// ============================================================

function escribirActividad(

    hoja,

    fila,

    actividad

) {

    hoja.getCell(

        fila,

        CONFIG.columnaEquipo

    ).value =

        actividad.equipo ||

        actividad.actividad ||

        '';

    hoja.getCell(

        fila,

        CONFIG.columnaActividad

    ).value =

        actividad.descripcion ||

        actividad.actividad ||

        '';

    hoja.getCell(

        fila,

        CONFIG.columnaFrecuencia

    ).value =

        actividad.frecuencia || '';

    hoja.getCell(

        fila,

        CONFIG.columnaResponsable

    ).value =

        actividad.responsable || '';

    for (const semana of actividad.semanas || []) {

        const mes = MESES.find(

            item => item.mes === numero(semana.mes)

        );

        const numeroSemana = numero(

            semana.semana_mes

        );

        if (

            !mes ||

            !Number.isInteger(numeroSemana) ||

            numeroSemana < 1 ||

            numeroSemana > mes.semanas

        ) {

            throw errorValidacion(

                'Existe una semana que no cabe en el formato corporativo.'

            );

        }

        const columna =

            mes.inicio + numeroSemana - 1;

        hoja.getCell(

            fila,

            columna

        ).value =

            obtenerMarcaExportacion(semana);

    }

}

// ============================================================

// 24. ACTUALIZAR FÓRMULAS CORPORATIVAS

// ============================================================

function actualizarFormulas(

    hoja,

    indicadores

) {

    for (const mes of MESES) {

        const inicio = letraColumna(

            mes.inicio

        );

        const fin = letraColumna(

            mes.inicio + mes.semanas - 1

        );

        const rango =

            `${inicio}${CONFIG.filaInicial}:` +

            `${fin}${CONFIG.filaFinal}`;

        const celdaRealizadas =

            `${inicio}${CONFIG.filaRealizadas}`;

        const celdaProgramadas =

            `${inicio}${CONFIG.filaProgramadas}`;

        const celdaCumplimiento =

            `${inicio}${CONFIG.filaCumplimiento}`;

        const datos =

            indicadores.mensual.find(

                item => item.mes === mes.mes

            ) || crearIndicador();

        hoja.getCell(celdaRealizadas).value = {

            formula: `COUNTIF(${rango},"R")`,

            result: datos.completadas

        };

        hoja.getCell(celdaProgramadas).value = {

            formula:

                `COUNTIF(${rango},"P")+` +

                `COUNTIF(${rango},"R")`,

            result: datos.programadas

        };

        hoja.getCell(celdaCumplimiento).value = {

            formula:

                `IF(${celdaProgramadas}=0,"N/A",` +

                `(${celdaRealizadas}/${celdaProgramadas})*100)`,

            result: datos.porcentaje ?? 'N/A'

        };

    }

}

// ============================================================

// 25. EXPORTACIÓN CORPORATIVA

// ============================================================

async function exportarExcel(

    anio = obtenerAnioActual()

) {

    anio = validarAnio(anio);

    const datos = await obtenerCronograma(

        anio

    );

    if (!datos.cronograma) {

        throw errorValidacion(

            `No existe un cronograma registrado para ${anio}.`,

            404

        );

    }

    const capacidad =

        CONFIG.filaFinal -

        CONFIG.filaInicial +

        1;

    if (datos.actividades.length > capacidad) {

        throw errorValidacion(

            `El formato original admite ${capacidad} actividades. ` +

            'Se requiere ampliar la plantilla corporativa.'

        );

    }

    const {

        libro,

        hoja

    } = await cargarPlantilla();

    limpiarDatosPlantilla(hoja);

    const ocupadas = new Set();

    const pendientes = [];

    // Primera etapa:

    // conservar las filas originales disponibles.

    for (const actividad of datos.actividades) {

        const fila = Number(

            actividad.orden_excel

        );

        if (

            Number.isInteger(fila) &&

            fila >= CONFIG.filaInicial &&

            fila <= CONFIG.filaFinal &&

            !ocupadas.has(fila)

        ) {

            ocupadas.add(fila);

            escribirActividad(

                hoja,

                fila,

                actividad

            );

        } else {

            pendientes.push(actividad);

        }

    }

    // Segunda etapa:

    // asignar filas libres a las demás actividades.

    for (const actividad of pendientes) {

        let fila = CONFIG.filaInicial;

        while (ocupadas.has(fila)) {

            fila++;

        }

        if (fila > CONFIG.filaFinal) {

            throw errorValidacion(

                'No hay espacio disponible en la plantilla.'

            );

        }

        ocupadas.add(fila);

        escribirActividad(

            hoja,

            fila,

            actividad

        );

    }

    actualizarFormulas(

        hoja,

        datos.indicadores

    );

    libro.calcProperties.fullCalcOnLoad = true;

    const resultado =

        await libro.xlsx.writeBuffer();

    return {

        success: true,

        buffer: Buffer.from(resultado),

        nombreArchivo:

            `FT-SST-147 Cronograma De Actividades para Transformin ${anio}.xlsx`,

        contentType: CONTENT_TYPE,

        anio,

        totalActividades:

            datos.actividades.length,

        indicadores:

            datos.indicadores

    };

}

// ============================================================

// 26. OBTENER PLANTILLA ORIGINAL

// ============================================================

async function obtenerPlantillaOriginal() {

    if (!fs.existsSync(CONFIG.plantilla)) {

        throw new Error(

            'La plantilla corporativa no está disponible.'

        );

    }

    return {

        buffer: await fs.promises.readFile(

            CONFIG.plantilla

        ),

        nombreArchivo:

            'FT-SST-147 Cronograma De Actividades para Transformin.xlsx',

        contentType: CONTENT_TYPE

    };

}

// ============================================================

// 27. HISTORIAL DE IMPORTACIONES

// ============================================================

async function obtenerHistorialImportaciones(

    anio = obtenerAnioActual()

) {

    anio = validarAnio(anio);

    const [registros] = await db.execute(

        `

        SELECT

            i.id,

            i.nombre_archivo,

            i.filas_leidas,

            i.filas_insertadas,

            i.filas_actualizadas,

            i.filas_omitidas,

            i.estado,

            i.detalle_error,

            i.importado_por,

            i.created_at,

            i.finished_at,

            c.anio

        FROM transformin_ft147_importaciones i

        INNER JOIN transformin_ft147_cronogramas c

            ON c.id = i.cronograma_id

        WHERE c.anio = ?

        AND c.codigo_formato = ?

        ORDER BY

            i.created_at DESC,

            i.id DESC

        LIMIT 100

        `,

        [

            anio,

            CONFIG.codigo

        ]

    );

    return registros.map(registro => ({

        ...registro,

        filas_leidas:

            numero(registro.filas_leidas),

        filas_insertadas:

            numero(registro.filas_insertadas),

        filas_actualizadas:

            numero(registro.filas_actualizadas),

        filas_omitidas:

            numero(registro.filas_omitidas),

        fecha:

            registro.finished_at ||

            registro.created_at

    }));

}

// ============================================================

// 28. EXPORTACIÓN DEL SERVICIO

// ============================================================

module.exports = {

    CONFIG,

    MESES,

    ESTADOS,

    previsualizarExcel,

    importarExcel,

    exportarExcel,

    obtenerCronograma,

    obtenerPlantillaOriginal,

    obtenerHistorialImportaciones,

    obtenerIndicadores,

    obtenerCumplimientoAnual,

    calcularIndicadores,

    calcularEstadoActividad,

    interpretarMarca,

    obtenerMarcaExportacion,

    obtenerAnioActual,

    obtenerFechaActual

};

// ============================================================

// FIN DEL SERVICIO CORPORATIVO FT-SST-147

// PROCESADOS MARGARITA S.A.S.

// ============================================================
