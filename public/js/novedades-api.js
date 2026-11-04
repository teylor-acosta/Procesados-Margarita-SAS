/* ============================================================
   NOVEDADES - CLIENTE API
   Procesados Margarita
   ============================================================
   Centraliza las llamadas al backend del módulo de novedades.
   Devuelve siempre un objeto: { ok, data, message, status }.
   ============================================================ */

(function (global) {
    'use strict';

    /* ============================================================
       1. CONFIGURACIÓN GLOBAL
       ============================================================ */

    const BASE_URL = '/api/nomina/novedades';
    const CONFIG_URL = '/api/nomina/configuracion';

    const CONFIG_API = {
        TIMEOUT_MS: 15000,       // 15 segundos máximo por petición
        MAX_REINTENTOS: 2,       // Reintentos automáticos si falla la red
        DEBUG: false             // Cambia a true para ver logs detallados
    };

    // Códigos HTTP de referencia
    const HTTP = {
        OK: 200,
        CREADO: 201,
        BAD_REQUEST: 400,
        NO_AUTORIZADO: 401,
        PROHIBIDO: 403,
        NO_ENCONTRADO: 404,
        ERROR_SERVIDOR: 500
    };


    /* ============================================================
       2. HELPERS INTERNOS
       ============================================================ */

    function logDebug(...args) {
        if (CONFIG_API.DEBUG) {
            console.log('[NovedadesAPI]', ...args);
        }
    }

    // Pausa con promesa (usado para reintentos)
    function esperar(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Valida que el ID sea un número positivo
    function validarId(id) {
        const num = Number(id);
        if (!Number.isInteger(num) || num <= 0) {
            throw new Error(`ID inválido: ${id}`);
        }
        return num;
    }

    // Construye query string desde un objeto de filtros
    function construirQuery(filtros = {}) {
        const params = new URLSearchParams();
        Object.entries(filtros).forEach(([clave, valor]) => {
            if (valor !== undefined && valor !== null && valor !== '') {
                params.append(clave, valor);
            }
        });
        const query = params.toString();
        return query ? '?' + query : '';
    }


    /* ============================================================
       3. FUNCIÓN PRINCIPAL: request con timeout y reintentos
       ============================================================ */

    async function request(url, options = {}, intentoActual = 0) {

        const config = {
            credentials: 'same-origin',
            headers: {
                'Accept': 'application/json',
                ...(options.headers || {})
            },
            ...options
        };

        // Convertir objeto a JSON si no es FormData ni string
        if (
            config.body &&
            !(config.body instanceof FormData) &&
            typeof config.body !== 'string'
        ) {
            config.headers['Content-Type'] = 'application/json';
            config.body = JSON.stringify(config.body);
        }

        // Timeout con AbortController
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), CONFIG_API.TIMEOUT_MS);
        config.signal = controller.signal;

        try {
            logDebug(`${config.method || 'GET'} ${url}`, config.body || '');

            const response = await fetch(url, config);
            clearTimeout(timeoutId);

            const contentType = response.headers.get('content-type') || '';
            let payload;

            if (contentType.includes('application/json')) {
                payload = await response.json();
            } else {
                const texto = await response.text();
                payload = { message: texto };
            }

            // --- Manejo especial de sesión expirada ---
            if (response.status === HTTP.NO_AUTORIZADO) {
                logDebug('Sesión expirada (401)');
                return {
                    ok: false,
                    status: response.status,
                    data: payload,
                    message: 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.',
                    sesionExpirada: true
                };
            }

            if (response.status === HTTP.PROHIBIDO) {
                logDebug('Acceso prohibido (403)');
                return {
                    ok: false,
                    status: response.status,
                    data: payload,
                    message: payload.message || 'No tienes permisos para esta acción.',
                    sinPermiso: true
                };
            }

            return {
                ok: response.ok && payload.success !== false,
                status: response.status,
                data: payload,
                message:
                    payload.message ||
                    payload.mensaje ||
                    (response.ok ? 'Operación exitosa' : 'Ocurrió un error')
            };

        } catch (error) {

            clearTimeout(timeoutId);

            // Timeout
            if (error.name === 'AbortError') {
                logDebug(`⏱️ Timeout en ${url}`);
                return {
                    ok: false,
                    status: 0,
                    data: null,
                    message: 'La petición tardó demasiado. Intenta nuevamente.'
                };
            }

            // Reintento automático si no es el último intento
            if (intentoActual < CONFIG_API.MAX_REINTENTOS) {
                const esperaMs = 1000 * Math.pow(2, intentoActual); // 1s, 2s
                logDebug(`🔁 Reintentando (${intentoActual + 1}/${CONFIG_API.MAX_REINTENTOS}) en ${esperaMs}ms`);
                await esperar(esperaMs);
                return request(url, options, intentoActual + 1);
            }

            console.error('❌ Error de red en API novedades:', error);
            return {
                ok: false,
                status: 0,
                data: null,
                message: 'No fue posible conectar con el servidor. Revisa tu conexión.'
            };

        }
    }


    /* ============================================================
       4. MÉTODOS PÚBLICOS DEL API
       ============================================================ */

    const API = {

        /* ========================================================
           CONSULTAS (GET)
           ======================================================== */

        listar() {
            return request(BASE_URL);
        },

        listarHistorial(filtros = {}) {
            return request(`${BASE_URL}/historial${construirQuery(filtros)}`);
        },

        kpis() {
            return request(`${BASE_URL}/kpis`);
        },

        tipos() {
            return request(`${BASE_URL}/tipos`);
        },

        recargos() {
            return request(`${CONFIG_URL}/recargos`);
        },

        // Endpoint que faltaba en el cliente (pero sí existía en el backend)
        horasExtra() {
            return request(`${CONFIG_URL}/horas-extra`);
        },

        // Obtiene tipos y recargos en una sola llamada
        async configuracionCompleta() {
            const [tipos, recargos, horasExtra] = await Promise.all([
                API.tipos(),
                API.recargos(),
                API.horasExtra()
            ]);

            return {
                ok: tipos.ok && recargos.ok && horasExtra.ok,
                tipos: tipos.data?.tipos || [],
                recargos: recargos.data?.data || [],
                horasExtra: horasExtra.data?.data || [],
                message: 'Configuración cargada'
            };
        },

        detalle(id) {
            return request(`${BASE_URL}/${validarId(id)}`);
        },


        /* ========================================================
           CREACIÓN DE NOVEDADES (POST)
           ======================================================== */

        crearIncapacidad(formData) {
            return request(`${BASE_URL}/incapacidad`, {
                method: 'POST',
                body: formData
            });
        },

        crearPermiso(payload) {
            return request(`${BASE_URL}/permiso`, {
                method: 'POST',
                body: payload
            });
        },

        crearAusencia(formData) {
            return request(`${BASE_URL}/ausencia`, {
                method: 'POST',
                body: formData
            });
        },

        crearLicencia(payload) {
            return request(`${BASE_URL}/licencia`, {
                method: 'POST',
                body: payload
            });
        },

        crearHorasExtra(payload) {
            return request(`${BASE_URL}/horas-extra`, {
                method: 'POST',
                body: payload
            });
        },

        crearIngreso(payload) {
            return request(`${BASE_URL}/ingreso-variable`, {
                method: 'POST',
                body: payload
            });
        },

        crearDescuento(formData) {
            return request(`${BASE_URL}/descuento`, {
                method: 'POST',
                body: formData
            });
        },

        crearPrestamo(formData) {
            return request(`${BASE_URL}/prestamo`, {
                method: 'POST',
                body: formData
            });
        },


        /* ========================================================
           CAMBIOS DE ESTADO (PATCH)
           ======================================================== */

        aprobar(id, comentario = '') {
            return request(`${BASE_URL}/${validarId(id)}/aprobar`, {
                method: 'PATCH',
                body: { comentario }
            });
        },

        rechazar(id, observacion) {
            if (!observacion || !String(observacion).trim()) {
                return Promise.resolve({
                    ok: false,
                    status: 0,
                    data: null,
                    message: 'Debes indicar una observación para rechazar.'
                });
            }
            return request(`${BASE_URL}/${validarId(id)}/rechazar`, {
                method: 'PATCH',
                body: { observacion: String(observacion).trim() }
            });
        },

        anular(id, motivo) {
            if (!motivo || !String(motivo).trim()) {
                return Promise.resolve({
                    ok: false,
                    status: 0,
                    data: null,
                    message: 'Debes indicar un motivo para anular.'
                });
            }
            return request(`${BASE_URL}/${validarId(id)}/anular`, {
                method: 'PATCH',
                body: { motivo: String(motivo).trim() }
            });
        },


        /* ========================================================
           CIERRE DE PERÍODO (POST)
           ======================================================== */

        validarCierre(periodo) {
            if (!/^\d{4}-\d{2}$/.test(String(periodo || ''))) {
                return Promise.resolve({
                    ok: false,
                    status: 0,
                    data: null,
                    message: 'El período debe tener el formato YYYY-MM.'
                });
            }
            return request(`${BASE_URL}/cierre-periodo/validar`, {
                method: 'POST',
                body: { periodo }
            });
        },

        cerrarPeriodo(periodo) {
            if (!/^\d{4}-\d{2}$/.test(String(periodo || ''))) {
                return Promise.resolve({
                    ok: false,
                    status: 0,
                    data: null,
                    message: 'El período debe tener el formato YYYY-MM.'
                });
            }
            return request(`${BASE_URL}/cierre-periodo`, {
                method: 'POST',
                body: { periodo }
            });
        },


        /* ========================================================
           EXPORTACIÓN A CSV
           ======================================================== */

        exportarListado(filtros = {}) {
            global.open(`${BASE_URL}/exportar${construirQuery(filtros)}`, '_blank');
        },

        exportarHistorial(filtros = {}) {
            global.open(`${BASE_URL}/historial/exportar${construirQuery(filtros)}`, '_blank');
        },


        /* ========================================================
           UTILIDADES EXTRA
           ======================================================== */

        // Descarga un soporte (PDF/imagen) en una nueva pestaña
        descargarSoporte(rutaArchivo) {
            if (!rutaArchivo) return false;
            global.open(rutaArchivo, '_blank');
            return true;
        },

        // Cambia el estado DEBUG en tiempo de ejecución
        setDebug(activo) {
            CONFIG_API.DEBUG = !!activo;
            console.log(`[NovedadesAPI] Debug ${activo ? 'ACTIVADO' : 'DESACTIVADO'}`);
        }

    };


    /* ============================================================
       5. EXPOSICIÓN GLOBAL
       ============================================================ */

    Object.freeze(API);

    global.NovedadesAPI = API;
    global.NovedadesAPI_HTTP = HTTP;
    global.NovedadesAPI_CONFIG = CONFIG_API;

})(window);