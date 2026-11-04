/* ============================================================
   NOVEDADES - UTILIDADES
   Procesados Margarita
   ============================================================
   Funciones puras y helpers reutilizables.
   No dependen de estado global ni del DOM.
   ============================================================ */

(function (global) {
    'use strict';

    /* ============================================================
       CONSTANTES INTERNAS
       ============================================================ */

    const MESES_ES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    const DIAS_ES = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];


    /* ============================================================
       HELPERS INTERNOS (para evitar repetir lógica)
       ============================================================ */

    // Crea una fecha "segura" respetando la zona horaria local.
    // Evita el bug donde '2026-11-03' puede regresar como '2026-11-02'.
    function crearFechaLocal(valor) {
        if (!valor) return null;
        if (valor instanceof Date) return valor;

        const str = String(valor).trim();

        // Formato 'YYYY-MM-DD' → parsear como local, no UTC
        if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
            const [anio, mes, dia] = str.split('-').map(Number);
            return new Date(anio, mes - 1, dia);
        }

        // Formato ISO con tiempo → parsear directo
        const fecha = new Date(str);
        return isNaN(fecha.getTime()) ? null : fecha;
    }

    const Utils = {

        /* ============================================================
           1. FORMATEO DE FECHAS
           ============================================================ */

        formatearFecha(valor) {
            const fecha = crearFechaLocal(valor);
            if (!fecha) return '-';

            const dia = String(fecha.getDate()).padStart(2, '0');
            const mes = String(fecha.getMonth() + 1).padStart(2, '0');
            const anio = fecha.getFullYear();

            return `${dia}/${mes}/${anio}`;
        },

        formatearFechaHora(valor) {
            const fecha = crearFechaLocal(valor);
            if (!fecha) return '-';

            const dia = String(fecha.getDate()).padStart(2, '0');
            const mes = String(fecha.getMonth() + 1).padStart(2, '0');
            const anio = fecha.getFullYear();
            const hh = String(fecha.getHours()).padStart(2, '0');
            const mm = String(fecha.getMinutes()).padStart(2, '0');

            return `${dia}/${mes}/${anio} ${hh}:${mm}`;
        },

        formatearFechaLarga(valor) {
            const fecha = crearFechaLocal(valor);
            if (!fecha) return '-';

            const dia = fecha.getDate();
            const mes = MESES_ES[fecha.getMonth()];
            const anio = fecha.getFullYear();

            return `${dia} de ${mes} de ${anio}`;
        },

        formatearRangoFechas(inicio, fin) {
            if (!inicio && !fin) return '-';
            if (!fin || inicio === fin) return Utils.formatearFecha(inicio);
            return `${Utils.formatearFecha(inicio)} → ${Utils.formatearFecha(fin)}`;
        },

        periodoActual() {
            const hoy = new Date();
            const anio = hoy.getFullYear();
            const mes = String(hoy.getMonth() + 1).padStart(2, '0');
            return `${anio}-${mes}`;
        },

        fechaParaInputDate(valor) {
            const fecha = crearFechaLocal(valor);
            if (!fecha) return '';

            const dia = String(fecha.getDate()).padStart(2, '0');
            const mes = String(fecha.getMonth() + 1).padStart(2, '0');
            const anio = fecha.getFullYear();

            return `${anio}-${mes}-${dia}`;
        },

        // NUEVO: calcular días entre 2 fechas (inclusive)
        diasEntreFechas(inicio, fin) {
            const f1 = crearFechaLocal(inicio);
            const f2 = crearFechaLocal(fin);
            if (!f1 || !f2) return 0;
            if (f2 < f1) return 0;

            const ms = f2.getTime() - f1.getTime();
            return Math.floor(ms / (1000 * 60 * 60 * 24)) + 1;
        },

        // NUEVO: validar si una fecha está en un rango
        fechaEnRango(fecha, desde, hasta) {
            const f = crearFechaLocal(fecha);
            const d = crearFechaLocal(desde);
            const h = crearFechaLocal(hasta);
            if (!f) return false;
            if (d && f < d) return false;
            if (h && f > h) return false;
            return true;
        },


        /* ============================================================
           2. FORMATEO DE NÚMEROS Y CANTIDADES
           ============================================================ */

        formatearNumero(valor, decimales = 0) {
            const numero = Number(valor);
            if (isNaN(numero)) return '-';

            return numero.toLocaleString('es-CO', {
                minimumFractionDigits: decimales,
                maximumFractionDigits: decimales
            });
        },

        formatearMoneda(valor) {
            const numero = Number(valor);
            if (isNaN(numero)) return '-';

            return numero.toLocaleString('es-CO', {
                style: 'currency',
                currency: 'COP',
                minimumFractionDigits: 0,
                maximumFractionDigits: 0
            });
        },

        formatearHoras(valor) {
            const numero = Number(valor);
            if (isNaN(numero)) return '-';
            return `${Utils.formatearNumero(numero, 2)} h`;
        },

        formatearDias(valor) {
            const numero = Number(valor);
            if (isNaN(numero)) return '-';
            return `${Utils.formatearNumero(numero, 0)} día${numero === 1 ? '' : 's'}`;
        },


        /* ============================================================
           3. FORMATEO DE TAMAÑO DE ARCHIVO
           ============================================================ */

        formatearTamanoArchivo(bytes) {
            const n = Number(bytes);
            if (!n || n <= 0) return '0 B';

            const unidades = ['B', 'KB', 'MB', 'GB'];
            const indice = Math.floor(Math.log(n) / Math.log(1024));
            const valor = n / Math.pow(1024, indice);

            return `${valor.toFixed(indice === 0 ? 0 : 1)} ${unidades[indice]}`;
        },


        /* ============================================================
           4. SEGURIDAD (ESCAPE HTML)
           ============================================================ */

        escaparHtml(texto) {
            if (texto === null || texto === undefined) return '';

            return String(texto)
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#39;');
        },

        // NUEVO: sanitizar texto (elimina espacios extra y caracteres raros)
        sanitizarTexto(texto) {
            if (!texto) return '';
            return String(texto)
                .trim()
                .replace(/\s+/g, ' ')
                .replace(/[^\w\sáéíóúÁÉÍÓÚñÑ.,;:!?()-]/g, '');
        },


        /* ============================================================
           5. GENERACIÓN Y DESCARGA DE CSV
           ============================================================ */

        escaparCsv(valor) {
            if (valor === null || valor === undefined) return '';
            const texto = String(valor).replace(/"/g, '""');
            return `"${texto}"`;
        },

        generarCsv(filas, columnas) {
            if (!Array.isArray(filas) || !Array.isArray(columnas)) return '';

            const encabezado = columnas
                .map(col => Utils.escaparCsv(col.titulo))
                .join(',');

            const cuerpo = filas
                .map(fila =>
                    columnas
                        .map(col => Utils.escaparCsv(fila[col.campo]))
                        .join(',')
                )
                .join('\n');

            // BOM UTF-8 para Excel
            return '\uFEFF' + encabezado + '\n' + cuerpo;
        },

        descargarCsv(nombreArchivo, contenidoCsv) {
            try {
                const blob = new Blob([contenidoCsv], { type: 'text/csv;charset=utf-8;' });
                const url = URL.createObjectURL(blob);
                const enlace = document.createElement('a');

                enlace.href = url;
                enlace.download = nombreArchivo;
                enlace.style.display = 'none';

                document.body.appendChild(enlace);
                enlace.click();
                document.body.removeChild(enlace);

                URL.revokeObjectURL(url);
                return true;
            } catch (error) {
                console.error('Error descargando CSV:', error);
                return false;
            }
        },


        /* ============================================================
           6. CONTROL DE TIEMPO (DEBOUNCE MEJORADO)
           ============================================================ */

        debounce(fn, espera = 300) {
            let timeoutId = null;

            const debounced = function (...args) {
                clearTimeout(timeoutId);
                timeoutId = setTimeout(() => {
                    fn.apply(this, args);
                }, espera);
            };

            // NUEVO: permite cancelar la ejecución pendiente
            debounced.cancel = function () {
                clearTimeout(timeoutId);
            };

            return debounced;
        },


        /* ============================================================
           7. VALIDACIONES
           ============================================================ */

        esPeriodoValido(periodo) {
            return /^\d{4}-\d{2}$/.test(String(periodo || ''));
        },

        esCorreoValido(correo) {
            return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(correo || ''));
        },

        archivoEsValido(file, opciones = {}) {
            const {
                tiposPermitidos = [
                    'application/pdf',
                    'image/jpeg',
                    'image/png',
                    'application/msword',
                    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
                ],
                tamanoMaximoMb = 5
            } = opciones;

            if (!file) {
                return { valido: false, motivo: 'No se seleccionó ningún archivo.' };
            }

            if (!tiposPermitidos.includes(file.type)) {
                return {
                    valido: false,
                    motivo: 'Tipo de archivo no permitido. Usa PDF, JPG, PNG, DOC o DOCX.'
                };
            }

            const tamanoMb = file.size / (1024 * 1024);
            if (tamanoMb > tamanoMaximoMb) {
                return {
                    valido: false,
                    motivo: `El archivo supera el tamaño máximo de ${tamanoMaximoMb} MB.`
                };
            }

            return { valido: true, motivo: null };
        },


        /* ============================================================
           8. PAGINACIÓN Y ORDENAMIENTO
           ============================================================ */

        paginar(arreglo, pagina = 1, tamano = 25) {
            if (!Array.isArray(arreglo)) {
                return { datos: [], pagina: 1, totalPaginas: 1, total: 0, tamano };
            }

            const total = arreglo.length;
            const totalPaginas = Math.max(1, Math.ceil(total / tamano));
            const paginaActual = Math.min(Math.max(1, pagina), totalPaginas);
            const inicio = (paginaActual - 1) * tamano;
            const fin = inicio + tamano;

            return {
                datos: arreglo.slice(inicio, fin),
                pagina: paginaActual,
                totalPaginas,
                total,
                tamano
            };
        },

        ordenar(arreglo, criterio) {
            if (!Array.isArray(arreglo)) return [];

            const copia = [...arreglo];

            switch (criterio) {
                case 'fecha_asc':
                    return copia.sort((a, b) => new Date(a.fecha_creacion) - new Date(b.fecha_creacion));
                case 'fecha_desc':
                    return copia.sort((a, b) => new Date(b.fecha_creacion) - new Date(a.fecha_creacion));
                case 'empleado_asc':
                    return copia.sort((a, b) => String(a.empleado_nombre || '').localeCompare(String(b.empleado_nombre || '')));
                case 'empleado_desc':
                    return copia.sort((a, b) => String(b.empleado_nombre || '').localeCompare(String(a.empleado_nombre || '')));
                case 'estado_asc':
                    return copia.sort((a, b) => String(a.estado || '').localeCompare(String(b.estado || '')));
                default:
                    return copia;
            }
        },


        /* ============================================================
           9. UTILIDADES DE TEXTO (NUEVAS)
           ============================================================ */

        // Obtener iniciales de un nombre: "Juan Pérez" → "JP"
        inicialesNombre(nombre) {
            if (!nombre) return '?';

            return String(nombre)
                .trim()
                .split(/\s+/)
                .slice(0, 2)
                .map(p => p.charAt(0).toUpperCase())
                .join('');
        },

        // Formatear texto con título: "juan perez" → "Juan Perez"
        capitalizarTexto(texto) {
            if (!texto) return '';
            return String(texto)
                .toLowerCase()
                .replace(/_/g, ' ')
                .replace(/\b\w/g, c => c.toUpperCase());
        },

        // Truncar texto largo
        truncar(texto, longitud = 30) {
            if (!texto) return '';
            const str = String(texto);
            return str.length > longitud ? str.slice(0, longitud) + '...' : str;
        },


        /* ============================================================
           10. UTILIDADES DE OBJETOS (NUEVAS)
           ============================================================ */

        // Clonar un objeto de forma segura (sin referencias compartidas)
        clonar(objeto) {
            if (objeto === null || typeof objeto !== 'object') return objeto;
            try {
                return JSON.parse(JSON.stringify(objeto));
            } catch (e) {
                return { ...objeto };
            }
        },

        // Obtener un valor anidado seguro: obtenerSeguro(obj, 'a.b.c')
        obtenerSeguro(objeto, ruta, defecto = null) {
            if (!objeto || !ruta) return defecto;
            return ruta.split('.').reduce((acc, clave) => (acc && acc[clave] !== undefined ? acc[clave] : defecto), objeto);
        }

    };


    /* ============================================================
       11. CONGELAR Y EXPONER
       ============================================================ */

    Object.freeze(Utils);

    global.NovedadesUtils = Utils;

})(window);