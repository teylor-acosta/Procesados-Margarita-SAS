/* ============================================================
   HISTORIAL Y REPORTES · PROCESADOS MARGARITA
   Archivo: /public/js/reportes.js
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {

    console.log('📊 Módulo Historial y Reportes iniciado');

    /* =========================================================
       REFERENCIAS AL DOM
       ========================================================= */

    const contenedorToasts = document.getElementById('contenedorToasts');

    // Header
    const btnRefrescar       = document.getElementById('btnRefrescar');
    const btnExportarActual  = document.getElementById('btnExportarActual');

    // KPIs
    const kpiNovedades     = document.getElementById('kpiNovedades');
    const kpiNovedadesSub  = document.getElementById('kpiNovedadesSub');
    const kpiPrestamos     = document.getElementById('kpiPrestamos');
    const kpiPrestamosSub  = document.getElementById('kpiPrestamosSub');
    const kpiProduccion    = document.getElementById('kpiProduccion');
    const kpiProduccionSub = document.getElementById('kpiProduccionSub');
    const kpiDescuentos    = document.getElementById('kpiDescuentos');
    const kpiDescuentosSub = document.getElementById('kpiDescuentosSub');

    // Tabs
    const tabs = document.querySelectorAll('.rep-tab[data-tab]');

    // Filtros
    const filtroBuscar    = document.getElementById('filtroBuscar');
    const filtroEstado    = document.getElementById('filtroEstado');
    const filtroTipo      = document.getElementById('filtroTipo');
    const filtroTipoFecha = document.getElementById('filtroTipoFecha');
    const btnLimpiar      = document.getElementById('btnLimpiar');

    // Filtros de fecha
    const contenedorFecha = document.getElementById('contenedorFecha');
    const campoDia        = document.getElementById('campoDia');
    const campoMes        = document.getElementById('campoMes');
    const campoAno        = document.getElementById('campoAno');
    const campoRango      = document.getElementById('campoRango');
    const fechaDia        = document.getElementById('fechaDia');
    const fechaMes        = document.getElementById('fechaMes');
    const fechaAno        = document.getElementById('fechaAno');
    const fechaDesde      = document.getElementById('fechaDesde');
    const fechaHasta      = document.getElementById('fechaHasta');

    // Tabla
    const tablaHead        = document.getElementById('tablaHead');
    const tablaBody        = document.getElementById('tablaBody');
    const tablaSkeleton    = document.getElementById('tablaSkeleton');
    const estadoVacio      = document.getElementById('estadoVacio');
    const contadorResultados = document.getElementById('contadorResultados');
    const btnExportarTabla = document.getElementById('btnExportarTabla');

    // Modal
    const modalDetalle     = document.getElementById('modalDetalleReporte');
    const detalleTitulo    = document.getElementById('detalleTitulo');
    const detalleContenido = document.getElementById('detalleContenido');

    /* =========================================================
       ESTADO LOCAL
       ========================================================= */

    const estadoApp = {
        tabActual: 'novedades',
        filtros: {
            buscar: '',
            estado: '',
            tipo: '',
            tipo_fecha: '',
            fecha: '',
            mes: '',
            ano: '',
            desde: '',
            hasta: ''
        },
        datos: [],
        cargando: false
    };

    /* =========================================================
       CONFIGURACIÓN DE TABs
       ========================================================= */

    const CONFIG_TABS = {

        novedades: {
            endpoint: '/api/nomina/reportes/novedades',
            exportar: 'novedades',
            tipos: [
                'Ausencia', 'Incapacidad', 'Licencia', 'Vacaciones',
                'Permiso', 'Horas extra', 'Descuento', 'Ingreso', 'Préstamo'
            ],
            columnas: [
                { key: 'empleado',         label: 'Empleado',   formatter: (v, r) => `
                    <div class="rep-celda-principal">
                        <strong>${escapeHTML(v || '—')}</strong>
                        <small>${escapeHTML(r.numero_documento || '')}</small>
                    </div>` },
                { key: 'tipo_novedad',     label: 'Tipo' },
                { key: 'categoria',        label: 'Categoría' },
                { key: 'fecha_inicio',     label: 'Inicio',     formatter: v => formatearFecha(v) },
                { key: 'fecha_fin',        label: 'Fin',        formatter: v => formatearFecha(v) },
                { key: 'cantidad_dias',    label: 'Días',       formatter: v => v || '—' },
                { key: 'cantidad_horas',   label: 'Horas',      formatter: v => v || '—' },
                { key: 'estado',           label: 'Estado',     formatter: v => crearBadgeEstado(v) },
                { key: 'fecha_creacion',   label: 'Registro',   formatter: v => formatearFechaHora(v) }
            ]
        },

        prestamos: {
            endpoint: '/api/nomina/reportes/prestamos',
            exportar: 'prestamos',
            tipos: [],
            columnas: [
                { key: 'empleado',         label: 'Empleado',   formatter: (v, r) => `
                    <div class="rep-celda-principal">
                        <strong>${escapeHTML(v || '—')}</strong>
                        <small>${escapeHTML(r.numero_documento || '')}</small>
                    </div>` },
                { key: 'fecha_prestamo',   label: 'Fecha',      formatter: v => formatearFecha(v) },
                { key: 'valor_prestamo',   label: 'Valor',      formatter: v => formatearMoneda(v) },
                { key: 'valor_interes',    label: 'Interés',    formatter: v => formatearMoneda(v) },
                { key: 'saldo_pendiente',  label: 'Saldo',      formatter: v => formatearMoneda(v) },
                { key: 'total_cuotas',     label: 'Cuotas' },
                { key: 'cuotas_pagadas',   label: 'Pagadas' },
                { key: 'estado',           label: 'Estado',     formatter: v => crearBadgeEstado(v) }
            ]
        },

        movimientos: {
            endpoint: '/api/nomina/reportes/movimientos',
            exportar: 'movimientos',
            tipos: [
                'PAGO_CUOTA', 'ABONO_EXTRAORDINARIO', 'CANCELACION_ANTICIPADA',
                'APLAZAMIENTO', 'DESCUENTO_NOMINA', 'AJUSTE'
            ],
            columnas: [
                { key: 'empleado',         label: 'Empleado',   formatter: (v, r) => `
                    <div class="rep-celda-principal">
                        <strong>${escapeHTML(v || '—')}</strong>
                        <small>${escapeHTML(r.numero_documento || '')}</small>
                    </div>` },
                { key: 'tipo_movimiento',  label: 'Tipo',       formatter: v => formatearTexto(v) },
                { key: 'fecha_movimiento', label: 'Fecha',      formatter: v => formatearFechaHora(v) },
                { key: 'valor',            label: 'Valor',      formatter: v => formatearMoneda(v) },
                { key: 'medio_pago',       label: 'Medio' },
                { key: 'observacion',      label: 'Observación', formatter: v => `
                    <span class="rep-truncate" title="${escapeHTML(v || '')}">${escapeHTML(v || '—')}</span>` }
            ]
        },

        produccion: {
            endpoint: '/api/nomina/reportes/produccion',
            exportar: 'produccion',
            tipos: [],
            columnas: [
                { key: 'colaborador',      label: 'Colaborador', formatter: (v, r) => `
                    <div class="rep-celda-principal">
                        <strong>${escapeHTML(v || '—')}</strong>
                        <small>${escapeHTML(r.numero_documento || '')}</small>
                    </div>` },
                { key: 'periodo_inicio',   label: 'Inicio',     formatter: v => formatearFecha(v) },
                { key: 'periodo_fin',      label: 'Fin',        formatter: v => formatearFecha(v) },
                { key: 'total_kilos',      label: 'Kilos',      formatter: v => `${Number(v || 0)} kg` },
                { key: 'total_pagar',      label: 'Total',      formatter: v => formatearMoneda(v) },
                { key: 'fecha_generacion', label: 'Generado',   formatter: v => formatearFechaHora(v) }
            ]
        },

        descuentos: {
            endpoint: '/api/nomina/reportes/descuentos',
            exportar: 'descuentos',
            tipos: ['QUINCENA_1', 'QUINCENA_2'],
            columnas: [
                { key: 'empleado',         label: 'Empleado',   formatter: (v, r) => `
                    <div class="rep-celda-principal">
                        <strong>${escapeHTML(v || '—')}</strong>
                        <small>${escapeHTML(r.numero_documento || '')}</small>
                    </div>` },
                { key: 'fecha_descuento',  label: 'Fecha',      formatter: v => formatearFecha(v) },
                { key: 'tipo_periodo',     label: 'Quincena',   formatter: v => formatearTexto(v) },
                { key: 'saldo_inicial',    label: 'Saldo inicial', formatter: v => formatearMoneda(v) },
                { key: 'valor_descuento',  label: 'Descontado', formatter: v => formatearMoneda(v) },
                { key: 'saldo_final',      label: 'Saldo final',formatter: v => formatearMoneda(v) },
                { key: 'observacion',      label: 'Observación',formatter: v => `
                    <span class="rep-truncate" title="${escapeHTML(v || '')}">${escapeHTML(v || '—')}</span>` }
            ]
        }

        /*
        ============================================================
        🔒 TAB RESERVADA: LIQUIDACIÓN DE NÓMINA
        ============================================================
        Este tab está DESHABILITADO en el HTML.
        Cuando el compañero termine el módulo, debe:

        1. En reportes.html:
           - Quitar "disabled" y "rep-tab--locked" del botón data-tab="liquidacion"

        2. Aquí, agregar la configuración:

        liquidacion: {
            endpoint: '/api/nomina/reportes/liquidacion',
            exportar: 'liquidacion',
            tipos: [],
            columnas: [
                { key: 'empleado',  label: 'Empleado' },
                { key: 'periodo',   label: 'Periodo' },
                { key: 'total',     label: 'Total', formatter: v => formatearMoneda(v) },
                { key: 'estado',    label: 'Estado', formatter: v => crearBadgeEstado(v) }
            ]
        }
        ============================================================
        */

    };

    /* =========================================================
       INICIALIZACIÓN
       ========================================================= */

    inicializar();

    function inicializar() {
        configurarEventos();
        cargarKPIs();
        aplicarTab('novedades');
    }

    function configurarEventos() {
        // Tabs
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                if (tab.disabled) return;
                const nuevaTab = tab.dataset.tab;
                if (!CONFIG_TABS[nuevaTab]) {
                    mostrarToast('Este módulo estará disponible próximamente.', 'info');
                    return;
                }
                aplicarTab(nuevaTab);
            });
        });

        // Botones
        btnRefrescar?.addEventListener('click', () => {
            cargarKPIs();
            cargarDatosTab();
            mostrarToast('Datos actualizados', 'info');
        });

        btnExportarActual?.addEventListener('click', () => exportarTab(estadoApp.tabActual));
        btnExportarTabla?.addEventListener('click', () => exportarTab(estadoApp.tabActual));
        btnLimpiar?.addEventListener('click', limpiarFiltros);

        // Filtros
        filtroBuscar?.addEventListener('input', debounce(() => {
            estadoApp.filtros.buscar = filtroBuscar.value.trim();
            cargarDatosTab();
        }, 350));

        filtroEstado?.addEventListener('change', () => {
            estadoApp.filtros.estado = filtroEstado.value;
            cargarDatosTab();
        });

        filtroTipo?.addEventListener('change', () => {
            estadoApp.filtros.tipo = filtroTipo.value;
            cargarDatosTab();
        });

        filtroTipoFecha?.addEventListener('change', manejarCambioTipoFecha);

        // Filtros de fecha
        fechaDia?.addEventListener('change', () => {
            estadoApp.filtros.fecha = fechaDia.value;
            cargarDatosTab();
        });
        fechaMes?.addEventListener('change', () => {
            estadoApp.filtros.mes = fechaMes.value;
            cargarDatosTab();
        });
        fechaAno?.addEventListener('change', () => {
            estadoApp.filtros.ano = fechaAno.value;
            cargarDatosTab();
        });
        fechaDesde?.addEventListener('change', () => {
            estadoApp.filtros.desde = fechaDesde.value;
            cargarDatosTab();
        });
        fechaHasta?.addEventListener('change', () => {
            estadoApp.filtros.hasta = fechaHasta.value;
            cargarDatosTab();
        });
    }

    /* =========================================================
       TABS
       ========================================================= */

    function aplicarTab(tab) {
        if (!CONFIG_TABS[tab]) return;

        estadoApp.tabActual = tab;

        // Actualizar botones
        tabs.forEach(t => t.classList.toggle('active', t.dataset.tab === tab));

        // Resetear filtros al cambiar tab
        limpiarFiltros(true);

        // Cargar tipos dinámicos
        cargarTiposTab(tab);

        // Resetear columnas
        renderizarEncabezado(tab);

        // Cargar datos
        cargarDatosTab();
    }

    function cargarTiposTab(tab) {
        if (!filtroTipo) return;
        const cfg = CONFIG_TABS[tab];
        const tipos = cfg?.tipos || [];

        filtroTipo.innerHTML = `<option value="">Todos los tipos</option>`;
        tipos.forEach(t => {
            const opt = document.createElement('option');
            opt.value = t;
            opt.textContent = formatearTexto(t);
            filtroTipo.appendChild(opt);
        });
    }

    function manejarCambioTipoFecha() {
        const valor = filtroTipoFecha.value;
        estadoApp.filtros.tipo_fecha = valor;

        // Ocultar todo
        if (campoDia)   campoDia.style.display = 'none';
        if (campoMes)   campoMes.style.display = 'none';
        if (campoAno)   campoAno.style.display = 'none';
        if (campoRango) campoRango.style.display = 'none';

        if (contenedorFecha) {
            contenedorFecha.style.display = valor ? 'flex' : 'none';
        }

        if (valor === 'DIA'   && campoDia)   campoDia.style.display = 'block';
        if (valor === 'MES'   && campoMes)   campoMes.style.display = 'block';
        if (valor === 'ANO'   && campoAno)   campoAno.style.display = 'block';
        if (valor === 'RANGO' && campoRango) campoRango.style.display = 'flex';

        cargarDatosTab();
    }

    /* =========================================================
       LIMPIAR FILTROS
       ========================================================= */

    function limpiarFiltros(silencioso = false) {
        estadoApp.filtros = {
            buscar: '', estado: '', tipo: '', tipo_fecha: '',
            fecha: '', mes: '', ano: '', desde: '', hasta: ''
        };

        if (filtroBuscar)    filtroBuscar.value = '';
        if (filtroEstado)    filtroEstado.value = '';
        if (filtroTipo)      filtroTipo.value = '';
        if (filtroTipoFecha) filtroTipoFecha.value = '';
        if (fechaDia)        fechaDia.value = '';
        if (fechaMes)        fechaMes.value = '';
        if (fechaAno)        fechaAno.value = '';
        if (fechaDesde)      fechaDesde.value = '';
        if (fechaHasta)      fechaHasta.value = '';

        if (contenedorFecha) contenedorFecha.style.display = 'none';
        if (campoDia)   campoDia.style.display = 'none';
        if (campoMes)   campoMes.style.display = 'none';
        if (campoAno)   campoAno.style.display = 'none';
        if (campoRango) campoRango.style.display = 'none';

        if (!silencioso) cargarDatosTab();
    }

    /* =========================================================
       CARGA DE DATOS
       ========================================================= */

    async function cargarDatosTab() {
        const cfg = CONFIG_TABS[estadoApp.tabActual];
        if (!cfg) return;

        try {
            mostrarCargando();

            const query = construirQuery();
            const url = `${cfg.endpoint}?${query}`;

            const res = await fetch(url, {
                credentials: 'include',
                cache: 'no-store'
            });

            const data = await res.json();

            if (!res.ok || !data.ok) {
                throw new Error(data.error || 'Error al consultar los datos.');
            }

            const filas = obtenerFilas(data, estadoApp.tabActual);
            estadoApp.datos = filas;

            ocultarCargando();
            renderizarTabla();

        } catch (error) {
            console.error('❌ Error cargando reportes:', error);
            ocultarCargando();
            mostrarError(error.message);
            mostrarToast(error.message, 'error');
        }
    }

    function obtenerFilas(data, tab) {
        switch (tab) {
            case 'novedades':   return data.novedades   || [];
            case 'prestamos':   return data.prestamos   || [];
            case 'movimientos': return data.movimientos || [];
            case 'produccion':  return data.produccion  || [];
            case 'descuentos':  return data.descuentos  || [];
            default:            return [];
        }
    }

    function construirQuery() {
        const f = estadoApp.filtros;
        const params = new URLSearchParams();

        if (f.buscar)     params.set('buscar', f.buscar);
        if (f.estado)     params.set('estado', f.estado);
        if (f.tipo)       params.set('tipo', f.tipo);
        if (f.tipo_fecha) params.set('tipo_fecha', f.tipo_fecha);
        if (f.fecha)      params.set('fecha', f.fecha);
        if (f.mes)        params.set('mes', f.mes);
        if (f.ano)        params.set('ano', f.ano);
        if (f.desde)      params.set('desde', f.desde);
        if (f.hasta)      params.set('hasta', f.hasta);

        return params.toString();
    }

    /* =========================================================
       KPIs
       ========================================================= */

    async function cargarKPIs() {
        try {
            const res = await fetch('/api/nomina/reportes/kpis', {
                credentials: 'include',
                cache: 'no-store'
            });

            const data = await res.json();
            if (!res.ok || !data.ok) throw new Error(data.error || 'Error al cargar KPIs');

            const k = data.kpis;

            if (kpiNovedades) kpiNovedades.textContent = k.novedades?.total || 0;
            if (kpiNovedadesSub) kpiNovedadesSub.textContent =
                `${k.novedades?.pendientes || 0} pendientes · ${k.novedades?.aprobadas || 0} aprobadas`;

            if (kpiPrestamos) kpiPrestamos.textContent = k.prestamos?.activos || 0;
            if (kpiPrestamosSub) kpiPrestamosSub.textContent =
                `Saldo: ${formatearMoneda(k.prestamos?.saldo || 0)}`;

            if (kpiProduccion) kpiProduccion.textContent = k.produccion?.total || 0;
            if (kpiProduccionSub) kpiProduccionSub.textContent =
                `${formatearMoneda(k.produccion?.total_pagado || 0)} pagados`;

            if (kpiDescuentos) kpiDescuentos.textContent = k.descuentos?.total || 0;
            if (kpiDescuentosSub) kpiDescuentosSub.textContent =
                `${formatearMoneda(k.descuentos?.total_descontado || 0)} descontados`;

        } catch (error) {
            console.error('❌ Error KPIs:', error);
        }
    }

    /* =========================================================
       RENDERIZADO
       ========================================================= */

    function renderizarEncabezado(tab) {
        if (!tablaHead) return;
        const cfg = CONFIG_TABS[tab];
        if (!cfg) return;

        const columnas = cfg.columnas || [];

        tablaHead.innerHTML = `
            <tr>
                ${columnas.map(c => `<th>${c.label}</th>`).join('')}
            </tr>
        `;
    }

    function renderizarTabla() {
        if (!tablaBody) return;

        const cfg = CONFIG_TABS[estadoApp.tabActual];
        const filas = estadoApp.datos;

        tablaBody.innerHTML = '';

        if (!filas.length) {
            if (estadoVacio) estadoVacio.style.display = 'block';
            if (contadorResultados) contadorResultados.textContent = '0 registros';
            return;
        }

        if (estadoVacio) estadoVacio.style.display = 'none';

        const columnas = cfg.columnas;

        const htmlFilas = filas.map(fila => {
            const celdas = columnas.map(col => {
                const valor = fila[col.key];
                const contenido = col.formatter ? col.formatter(valor, fila) : escapeHTML(valor ?? '—');
                return `<td>${contenido}</td>`;
            }).join('');

            return `<tr>${celdas}</tr>`;
        }).join('');

        tablaBody.innerHTML = htmlFilas;

        if (contadorResultados) {
            contadorResultados.textContent =
                filas.length === 1 ? '1 registro' : `${filas.length} registros`;
        }
    }

    /* =========================================================
       EXPORTAR CSV
       ========================================================= */

    function exportarTab(tab) {
        const cfg = CONFIG_TABS[tab];
        if (!cfg || !cfg.exportar) {
            mostrarToast('Este reporte aún no permite exportación.', 'warning');
            return;
        }

        if (!estadoApp.datos.length) {
            mostrarToast('No hay datos para exportar.', 'warning');
            return;
        }

        const query = construirQuery();
        const url = `/api/nomina/reportes/exportar/${cfg.exportar}?${query}`;

        mostrarToast('Generando CSV...', 'info');
        window.open(url, '_blank');
    }

    /* =========================================================
       MODAL DE DETALLE
       ========================================================= */

    function abrirDetalle(titulo, html) {
        if (!modalDetalle) return;
        detalleTitulo.textContent = titulo;
        detalleContenido.innerHTML = html;
        const modal = bootstrap.Modal.getOrCreateInstance(modalDetalle);
        modal.show();
    }

    window.verDetalleReporte = abrirDetalle;

    /* =========================================================
       TOASTS
       ========================================================= */

    function mostrarToast(mensaje, tipo = 'info') {
        if (!contenedorToasts) return;

        const iconos = {
            success: 'fa-circle-check',
            error:   'fa-circle-exclamation',
            warning: 'fa-triangle-exclamation',
            info:    'fa-circle-info'
        };

        const toast = document.createElement('div');
        toast.className = `rep-toast rep-toast--${tipo}`;
        toast.innerHTML = `
            <i class="fas ${iconos[tipo] || iconos.info}"></i>
            <span>${escapeHTML(mensaje)}</span>
            <button type="button" class="rep-toast-close" aria-label="Cerrar">&times;</button>
        `;

        contenedorToasts.appendChild(toast);
        requestAnimationFrame(() => toast.classList.add('mostrar'));

        const cerrar = () => {
            toast.classList.remove('mostrar');
            setTimeout(() => toast.remove(), 250);
        };

        toast.querySelector('.rep-toast-close').addEventListener('click', cerrar);
        setTimeout(cerrar, 4200);
    }

    /* =========================================================
       ESTADOS DE CARGA / VACÍO / ERROR
       ========================================================= */

    function mostrarCargando() {
        estadoApp.cargando = true;
        if (tablaSkeleton) tablaSkeleton.style.display = 'block';
        if (estadoVacio) estadoVacio.style.display = 'none';
        if (tablaBody) tablaBody.innerHTML = '';
    }

    function ocultarCargando() {
        estadoApp.cargando = false;
        if (tablaSkeleton) tablaSkeleton.style.display = 'none';
    }

    function mostrarError(mensaje) {
        if (tablaBody) {
            tablaBody.innerHTML = `
                <tr>
                    <td colspan="20" class="rep-error-cell">
                        <i class="fas fa-circle-exclamation"></i>
                        ${escapeHTML(mensaje)}
                    </td>
                </tr>
            `;
        }
        if (contadorResultados) contadorResultados.textContent = '0 registros';
    }

    /* =========================================================
       UTILIDADES
       ========================================================= */

    function crearBadgeEstado(estado) {
        if (!estado) return '—';
        const mapa = {
            PENDIENTE:     'warning',
            APROBADA:      'success',
            RECHAZADA:     'danger',
            EN_HISTORIAL:  'secondary',
            PROCESADA:     'info',
            ACTIVO:        'success',
            PAGADO:        'primary',
            CANCELADO:     'secondary',
            ANULADO:       'danger'
        };
        const clase = mapa[estado] || 'secondary';
        return `<span class="rep-badge rep-badge--${clase}">${formatearTexto(estado)}</span>`;
    }

    function formatearMoneda(valor) {
        const n = Number(valor) || 0;
        return '$ ' + n.toLocaleString('es-CO', { maximumFractionDigits: 0 });
    }

    function formatearFecha(fecha) {
        if (!fecha) return '—';
        const str = String(fecha).substring(0, 10);
        const partes = str.split('-');
        if (partes.length !== 3) return str;
        return `${partes[2]}/${partes[1]}/${partes[0]}`;
    }

    function formatearFechaHora(fecha) {
        if (!fecha) return '—';
        try {
            const d = new Date(fecha);
            if (isNaN(d.getTime())) return formatearFecha(fecha);
            return d.toLocaleString('es-CO', {
                day: '2-digit', month: '2-digit', year: 'numeric',
                hour: '2-digit', minute: '2-digit'
            });
        } catch {
            return formatearFecha(fecha);
        }
    }

    function formatearTexto(t) {
        if (!t) return '—';
        return String(t)
            .toLowerCase()
            .replace(/_/g, ' ')
            .replace(/\b\w/g, c => c.toUpperCase());
    }

    function escapeHTML(valor) {
        return String(valor ?? '').replace(/[&<>"']/g, c => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
        }[c]));
    }

    function debounce(fn, wait) {
        let t;
        return function(...args) {
            clearTimeout(t);
            t = setTimeout(() => fn(...args), wait);
        };
    }

    /* =========================================================
       HOOK PARA "LIQUIDACIÓN DE NÓMINA" (FUTURO)
       =========================================================
       Cuando el compañero termine el módulo, solo debe:
       1. En reportes.html quitar el disabled del tab
       2. Añadir CONFIG_TABS.liquidacion (ver bloque reservado arriba)
       3. ¡Listo! Este JS ya maneja todo automáticamente.
       ========================================================= */

});