/* ============================================================
   NÓMINA - NOVEDADES (PRINCIPAL) - 
   PROCESADOS MARGARITA
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {

    console.log('📋 Módulo de Novedades iniciado');

    /* ========================================================
       FIX DE ACCESIBIDAD 
       ======================================================== */
    if (typeof bootstrap !== 'undefined') {
        document.querySelectorAll('.modal').forEach((modal) => {
            modal.addEventListener('hide.bs.modal', () => {
                if (document.activeElement && modal.contains(document.activeElement)) {
                    document.activeElement.blur();
                }
            });
        });
    }

    /* ========================================================
       ELEMENTOS DEL DOM - ACCIONES PRINCIPALES
       ======================================================== */
    const btnRegistrar = document.getElementById('btnRegistrarNovedad');
    const btnRefrescar = document.getElementById('btnRefrescarNovedades');
    const btnCerrarPeriodo = document.getElementById('btnCerrarPeriodo');
    const btnExportarNovedades = document.getElementById('btnExportarNovedades');
    const btnLimpiar = document.getElementById('btnLimpiarFiltros');

    /* ========================================================
       ELEMENTOS DEL DOM - FILTROS Y TABLA
       ======================================================== */
    const buscarNovedad = document.getElementById('buscarNovedad');
    const filtroTipo = document.getElementById('filtroTipo');
    const filtroEstado = document.getElementById('filtroEstado');
    const filtroMes = document.getElementById('filtroMes');

    const contadorResultados = document.getElementById('contadorResultados');
    const indicadorFiltrosActivos = document.getElementById('indicadorFiltrosActivos');
    const ordenarNovedades = document.getElementById('ordenarNovedades');
    const tamanoPagina = document.getElementById('tamanoPagina');
    const btnPaginaAnterior = document.getElementById('btnPaginaAnterior');
    const btnPaginaSiguiente = document.getElementById('btnPaginaSiguiente');
    const infoPaginacion = document.getElementById('infoPaginacion');

    const tablaNovedades = document.getElementById('tablaNovedades');
    const estadoVacio = document.getElementById('estadoVacio');
    const tablaSkeleton = document.getElementById('tablaSkeleton');

    /* ========================================================
       ELEMENTOS DEL DOM - KPIs
       ======================================================== */
    const kpiPendientes = document.getElementById('kpiPendientes');
    const kpiAprobadas = document.getElementById('kpiAprobadas');
    const kpiRechazadas = document.getElementById('kpiRechazadas');
    const kpiHistorial = document.getElementById('kpiHistorial');
    const kpiCards = document.querySelectorAll('[data-kpi-filtro]');

    /* ========================================================
       ELEMENTOS DEL DOM - MODAL REGISTRO
       ======================================================== */
    const modalRegistrarNovedad = document.getElementById('modalRegistrarNovedad');
    const registroTipoNovedad = document.getElementById('registroTipoNovedad');
    const informacionTipoNovedad = document.getElementById('informacionTipoNovedad');
    const registroTipoNombre = document.getElementById('registroTipoNombre');
    const registroTipoDescripcion = document.getElementById('registroTipoDescripcion');
    const formularioNovedadDinamico = document.getElementById('formularioNovedadDinamico');
    const camposNovedad = document.getElementById('camposNovedad');
    const seccionSoporteNovedad = document.getElementById('seccionSoporteNovedad');
    const soporteNovedad = document.getElementById('soporteNovedad');
    const avisoAprobacionNovedad = document.getElementById('avisoAprobacionNovedad');
    const btnGuardarNovedad = document.getElementById('btnGuardarNovedad');
    const errorRegistroNovedad = document.getElementById('errorRegistroNovedad');

    /* ========================================================
       ELEMENTOS DEL DOM - DRAG & DROP
       ======================================================== */
    const zonaDragDropSoporte = document.getElementById('zonaDragDropSoporte');
    const previsualizacionSoporte = document.getElementById('previsualizacionSoporte');
    const soporteNombreArchivo = document.getElementById('soporteNombreArchivo');
    const soporteTamanoArchivo = document.getElementById('soporteTamanoArchivo');
    const btnQuitarSoporte = document.getElementById('btnQuitarSoporte');

    /* ========================================================
       ELEMENTOS DEL DOM - MODALES Y TOASTS
       ======================================================== */
    const modalConfirmacion = document.getElementById('modalConfirmacion');
    const modalConfirmacionMensaje = document.getElementById('modalConfirmacionMensaje');
    const btnConfirmarAccion = document.getElementById('btnConfirmarAccion');
    const contenedorToasts = document.getElementById('contenedorToasts');

    /* ========================================================
       ESTADO LOCAL
       ======================================================== */
    const estadoApp = {
        novedades: [],
        novedadesFiltradas: [],
        paginaActual: 1,
        tamanoPagina: 25,
        ordenActual: 'fecha_desc',
        filtrosActivos: false,
        confirmCallback: null
    };

    /* ========================================================
       EXPONER FUNCIONES GLOBALES
       ======================================================== */
    window.mostrarToast = mostrarToast;
    window.mostrarConfirmacion = mostrarConfirmacion;
    window.verNovedad = verNovedad;
    window.cargarNovedades = cargarNovedades;

    /* ========================================================
       INICIO
       ======================================================== */
    inicializar();

    async function inicializar() {
        establecerMesActual();
        configurarEventos();
        await cargarNovedades();
    }

    function configurarEventos() {
        if (btnRegistrar) btnRegistrar.addEventListener('click', abrirRegistroNovedad);
        if (btnRefrescar) {
            btnRefrescar.addEventListener('click', () => {
                mostrarToast('Actualizando datos...', 'info');
                cargarNovedades();
            });
        }

        if (btnExportarNovedades) btnExportarNovedades.addEventListener('click', exportarCSV);
        if (btnCerrarPeriodo) btnCerrarPeriodo.addEventListener('click', abrirCierrePeriodo);

        if (buscarNovedad) buscarNovedad.addEventListener('input', debounce(aplicarFiltros, 300));
        if (filtroTipo) filtroTipo.addEventListener('change', aplicarFiltros);
        if (filtroEstado) filtroEstado.addEventListener('change', aplicarFiltros);
        if (filtroMes) filtroMes.addEventListener('change', aplicarFiltros);
        if (btnLimpiar) btnLimpiar.addEventListener('click', limpiarFiltros);

        kpiCards.forEach(card => {
            card.addEventListener('click', () => {
                const filtro = card.dataset.kpiFiltro;
                if (filtroEstado) {
                    filtroEstado.value = (filtroEstado.value === filtro) ? '' : filtro;
                    aplicarFiltros();
                }
            });
        });

        if (ordenarNovedades) {
            ordenarNovedades.addEventListener('change', (e) => {
                estadoApp.ordenActual = e.target.value;
                aplicarFiltros();
            });
        }

        if (tamanoPagina) {
            tamanoPagina.addEventListener('change', (e) => {
                estadoApp.tamanoPagina = Number(e.target.value);
                estadoApp.paginaActual = 1;
                renderizarTabla();
            });
        }

        if (btnPaginaAnterior) {
            btnPaginaAnterior.addEventListener('click', () => {
                if (estadoApp.paginaActual > 1) { estadoApp.paginaActual--; renderizarTabla(); }
            });
        }

        if (btnPaginaSiguiente) {
            btnPaginaSiguiente.addEventListener('click', () => {
                const totalPaginas = Math.ceil(estadoApp.novedadesFiltradas.length / estadoApp.tamanoPagina);
                if (estadoApp.paginaActual < totalPaginas) { estadoApp.paginaActual++; renderizarTabla(); }
            });
        }

        if (registroTipoNovedad) registroTipoNovedad.addEventListener('change', seleccionarTipoNovedad);
        if (btnGuardarNovedad) btnGuardarNovedad.addEventListener('click', guardarNovedad);
        
        configurarDragAndDrop();

        if (btnConfirmarAccion) {
            btnConfirmarAccion.addEventListener('click', () => {
                const cb = estadoApp.confirmCallback;
                estadoApp.confirmCallback = null;
                if (typeof cb === 'function') cb();
                if (modalConfirmacion) {
                    bootstrap.Modal.getOrCreateInstance(modalConfirmacion).hide();
                }
            });
        }

        // 🔥 ABRIR MODAL DE HISTORIAL
        const btnVerHistorial = document.getElementById('btnVerHistorial');
        const kpiHistorialCard = document.querySelector('.historial-kpi-clickable');
        
        const abrirModalHistorial = () => {
            const modalElement = document.getElementById('modalHistorialNovedades');
            if (modalElement) {
                const modal = bootstrap.Modal.getOrCreateInstance(modalElement);
                modal.show();
                setTimeout(() => {
                    const btnBuscar = document.getElementById('btnBuscarHistorial');
                    if (btnBuscar) btnBuscar.click();
                }, 300);
            }
        };

        if (btnVerHistorial) btnVerHistorial.addEventListener('click', abrirModalHistorial);
        if (kpiHistorialCard) kpiHistorialCard.addEventListener('click', abrirModalHistorial);
    }

    /* ========================================================
       CARGAR NOVEDADES
       ======================================================== */
    async function cargarNovedades() {
        try {
            mostrarCargando();
            const respuesta = await fetch('/api/nomina/novedades', { cache: 'no-store' });
            if (!respuesta.ok) throw new Error('Error al consultar la API.');

            const resultado = await respuesta.json();
            
            if (Array.isArray(resultado)) estadoApp.novedades = resultado;
            else if (Array.isArray(resultado.novedades)) estadoApp.novedades = resultado.novedades;
            else if (Array.isArray(resultado.data)) estadoApp.novedades = resultado.data;
            else estadoApp.novedades = [];

            cargarTiposFiltro();
            actualizarKPIs();
            aplicarFiltros();

        } catch (error) {
            console.error('❌ Error cargando novedades:', error);
            mostrarError('No fue posible conectar con el servidor.');
        }
    }

    function actualizarKPIs() {
        if (kpiPendientes) kpiPendientes.textContent = estadoApp.novedades.filter(n => obtenerEstado(n) === 'PENDIENTE').length;
        if (kpiAprobadas) kpiAprobadas.textContent = estadoApp.novedades.filter(n => obtenerEstado(n) === 'APROBADA').length;
        if (kpiRechazadas) kpiRechazadas.textContent = estadoApp.novedades.filter(n => obtenerEstado(n) === 'RECHAZADA').length;
        
        fetch('/api/nomina/novedades/kpis')
            .then(res => res.ok ? res.json() : null)
            .then(data => {
                if (data && data.success && data.kpis && kpiHistorial) {
                    kpiHistorial.textContent = data.kpis.historial;
                }
            })
            .catch(() => { /* silencioso */ });
    }

    function cargarTiposFiltro() {
        if (!filtroTipo) return;
        const tipos = [...new Set(estadoApp.novedades.map(n => obtenerTipo(n)).filter(Boolean))];
        const valorActual = filtroTipo.value;

        filtroTipo.innerHTML = `<option value="">Todos los tipos</option>`;
        tipos.sort().forEach(tipo => {
            const opt = document.createElement('option');
            opt.value = tipo;
            opt.textContent = formatearTexto(tipo);
            filtroTipo.appendChild(opt);
        });
        filtroTipo.value = valorActual;
    }

    function aplicarFiltros() {
        const texto = (buscarNovedad?.value || '').trim().toLowerCase();
        const tipo = filtroTipo?.value || '';
        const estado = filtroEstado?.value || '';
        const mes = filtroMes?.value || '';

        estadoApp.filtrosActivos = !!(texto || tipo || estado || mes);

        estadoApp.novedadesFiltradas = estadoApp.novedades.filter(n => {
            if (texto) {
                const empleado = String(obtenerEmpleado(n)).toLowerCase();
                const tipoNom = String(obtenerTipo(n)).toLowerCase();
                const doc = String(n.numero_documento || '').toLowerCase();
                if (!empleado.includes(texto) && !tipoNom.includes(texto) && !doc.includes(texto)) return false;
            }
            if (tipo && obtenerTipo(n) !== tipo) return false;
            if (estado && obtenerEstado(n) !== estado) return false;
            if (mes && !obtenerFecha(n).startsWith(mes)) return false;
            return true;
        });

        estadoApp.novedadesFiltradas.sort((a, b) => {
            switch (estadoApp.ordenActual) {
                case 'fecha_asc': return new Date(obtenerFechaRegistro(a)) - new Date(obtenerFechaRegistro(b));
                case 'empleado_asc': return String(obtenerEmpleado(a)).localeCompare(String(obtenerEmpleado(b)));
                case 'empleado_desc': return String(obtenerEmpleado(b)).localeCompare(String(obtenerEmpleado(a)));
                case 'estado_asc': return String(obtenerEstado(a)).localeCompare(String(obtenerEstado(b)));
                case 'fecha_desc':
                default: return new Date(obtenerFechaRegistro(b)) - new Date(obtenerFechaRegistro(a));
            }
        });

        estadoApp.paginaActual = 1;
        if (indicadorFiltrosActivos) indicadorFiltrosActivos.style.display = estadoApp.filtrosActivos ? 'inline-flex' : 'none';
        renderizarTabla();
    }

    function limpiarFiltros() {
        if (buscarNovedad) buscarNovedad.value = '';
        if (filtroTipo) filtroTipo.value = '';
        if (filtroEstado) filtroEstado.value = '';
        if (filtroMes) filtroMes.value = '';
        if (ordenarNovedades) ordenarNovedades.value = 'fecha_desc';
        estadoApp.ordenActual = 'fecha_desc';
        aplicarFiltros();
    }

    function establecerMesActual() {
        if (!filtroMes) return;
        filtroMes.value = '';
    }

    /* ========================================================
       RENDERIZAR TABLA Y PAGINACIÓN 
       ======================================================== */
    function renderizarTabla() {
        if (!tablaNovedades) return;
        ocultarCargando();

        const total = estadoApp.novedadesFiltradas.length;
        const inicio = (estadoApp.paginaActual - 1) * estadoApp.tamanoPagina;
        const fin = inicio + estadoApp.tamanoPagina;
        const novedadesPagina = estadoApp.novedadesFiltradas.slice(inicio, fin);

        if (contadorResultados) contadorResultados.textContent = `${total} novedad${total === 1 ? '' : 'es'}`;

        if (total === 0) {
            tablaNovedades.innerHTML = '';
            if (estadoVacio) estadoVacio.style.display = 'flex';
            renderizarPaginacion();
            return;
        }

        if (estadoVacio) estadoVacio.style.display = 'none';
        tablaNovedades.innerHTML = '';
        
        novedadesPagina.forEach(novedad => {
            const categoria = (novedad.categoria || '').toUpperCase();
            const tipo = (novedad.tipo_novedad || '').toLowerCase();
            
            let icono = 'fa-file-alt', colorBg = '#f1f5f9', colorText = '#475569';

            if (categoria.includes('ASISTENCIA') || tipo.includes('ausencia')) { icono = 'fa-user-clock'; colorBg = '#fef3c7'; colorText = '#b45309'; }
            else if (categoria.includes('SALUD') || tipo.includes('incapacidad')) { icono = 'fa-notes-medical'; colorBg = '#fee2e2'; colorText = '#b91c1c'; }
            else if (categoria.includes('DESCUENTO')) { icono = 'fa-hand-holding-dollar'; colorBg = '#fce7f3'; colorText = '#be185d'; }
            else if (categoria.includes('INGRESO') || tipo.includes('ingreso')) { icono = 'fa-money-bill-trend-up'; colorBg = '#d1fae5'; colorText = '#047857'; }
            else if (categoria.includes('PRESTAMO') || tipo.includes('anticipo') || tipo.includes('prestamo')) { icono = 'fa-building-columns'; colorBg = '#e0e7ff'; colorText = '#4338ca'; }
            else if (categoria.includes('TIEMPO') || tipo.includes('permiso') || tipo.includes('licencia')) { icono = 'fa-calendar-check'; colorBg = '#cffafe'; colorText = '#0e7490'; }
            else if (tipo.includes('vacacion')) { icono = 'fa-umbrella-beach'; colorBg = '#e0f2fe'; colorText = '#0369a1'; }

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>
                    <div class="novedad-empleado">
                        <strong>${escaparHTML(obtenerEmpleado(novedad))}</strong>
                        <small>${escaparHTML(novedad.numero_documento || '')}</small>
                    </div>
                </td>
                <td>
                    <span style="display: inline-flex; align-items: center; gap: 6px; padding: 5px 12px; border-radius: 20px; font-size: 12px; font-weight: 700; background-color: ${colorBg}; color: ${colorText};">
                        <i class="fas ${icono}"></i> ${escaparHTML(formatearTexto(obtenerTipo(novedad)))}
                    </span>
                </td>
                <td>${formatearFecha(obtenerFecha(novedad))}</td>
                <td>${escaparHTML(obtenerCantidad(novedad))}</td>
                <td>${crearBadgeEstado(obtenerEstado(novedad))}</td>
                <td>${formatearFechaHora(obtenerFechaRegistro(novedad))}</td>
                <td>${crearAcciones(novedad)}</td>
            `;
            tablaNovedades.appendChild(tr);
        });

        agregarEventosAcciones();
        renderizarPaginacion();
    }

    function renderizarPaginacion() {
        const totalPaginas = Math.max(1, Math.ceil(estadoApp.novedadesFiltradas.length / estadoApp.tamanoPagina));
        if (infoPaginacion) infoPaginacion.textContent = `Página ${estadoApp.paginaActual} de ${totalPaginas}`;
        if (btnPaginaAnterior) btnPaginaAnterior.disabled = estadoApp.paginaActual <= 1;
        if (btnPaginaSiguiente) btnPaginaSiguiente.disabled = estadoApp.paginaActual >= totalPaginas;
    }

    /* ========================================================
       ACCIONES EN LA TABLA 
       ======================================================== */
    function crearAcciones(n) {
        const estado = obtenerEstado(n);
        let html = `
            <div class="novedad-acciones">
                <button type="button" class="novedad-accion-btn detalle btn-ver-novedad" data-id="${n.id}" title="Ver detalle">
                    <i class="fas fa-eye"></i>
                </button>
                <button type="button" class="novedad-accion-btn eliminar-historial btn-eliminar-novedad" data-id="${n.id}" title="Enviar al historial">
                    <i class="fas fa-box-archive"></i>
                </button>
        `;

        if (estado === 'PENDIENTE') {
            html += `
                <button type="button" class="novedad-accion-btn aprobar btn-aprobar-novedad" data-id="${n.id}" title="Aprobar">
                    <i class="fas fa-check"></i>
                </button>
                <button type="button" class="novedad-accion-btn rechazar btn-rechazar-novedad" data-id="${n.id}" title="Rechazar">
                    <i class="fas fa-xmark"></i>
                </button>
            `;
        }
        return html + `</div>`;
    }

    function agregarEventosAcciones() {
        document.querySelectorAll('.btn-ver-novedad').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation(); 
                verNovedad(btn.dataset.id);
            });
        });
        
        document.querySelectorAll('.btn-eliminar-novedad').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                mostrarConfirmacion('¿Estás seguro de enviar esta novedad al historial? Podrás restaurarla o eliminarla definitivamente desde ahí.', async () => {
                    try {
                        const res = await fetch(`/api/nomina/novedades/${btn.dataset.id}`, { 
                            method: 'DELETE',
                            headers: { 'Content-Type': 'application/json' }
                        });
                        
                        const data = await res.json();
                        
                        if (!res.ok || !data.success) {
                            throw new Error(data.message || 'Error al eliminar');
                        }
                        
                        mostrarToast('Novedad enviada al historial correctamente', 'success');
                        await cargarNovedades();
                        
                    } catch (error) { 
                        mostrarToast(error.message, 'error'); 
                    }
                });
            });
        });

        document.querySelectorAll('.btn-aprobar-novedad').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                mostrarConfirmacion('¿Estás seguro de aprobar esta novedad?', async () => {
                    try {
                        const res = await fetch(`/api/nomina/novedades/${btn.dataset.id}/aprobar`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' } });
                        const data = await res.json();
                        if (!res.ok || !data.success) throw new Error(data.message || 'Error al aprobar');
                        mostrarToast('Novedad aprobada correctamente', 'success');
                        await cargarNovedades();
                    } catch (error) { mostrarToast(error.message, 'error'); }
                });
            });
        });

        document.querySelectorAll('.btn-rechazar-novedad').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const motivo = prompt('Indica el motivo del rechazo:');
                if (motivo && motivo.trim()) {
                    fetch(`/api/nomina/novedades/${btn.dataset.id}/rechazar`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ observacion: motivo.trim() })
                    })
                    .then(res => res.json())
                    .then(data => {
                        if (!data.success) throw new Error(data.message || 'Error al rechazar');
                        mostrarToast('Novedad rechazada', 'success');
                        cargarNovedades();
                    })
                    .catch(error => mostrarToast(error.message, 'error'));
                }
            });
        });
    }

    async function verNovedad(id) {
        const modalElement = document.getElementById('modalDetalleNovedad');
        if (!modalElement) return;

        const modal = bootstrap.Modal.getOrCreateInstance(modalElement);
        
        document.getElementById('detalleTipoNovedad').textContent = "Cargando...";
        document.getElementById('detalleContenido').innerHTML = `
            <div class="col-12 text-center py-4">
                <i class="fas fa-spinner fa-spin fa-2x text-success"></i>
                <p class="mt-2 text-muted">Obteniendo información...</p>
            </div>
        `;
        document.getElementById('detalleBtnSoporte').style.display = 'none';
        modal.show();

        try {
            const res = await fetch(`/api/nomina/novedades/${id}`);
            const data = await res.json();

            if (!res.ok || !data.success) throw new Error(data.message || 'Error al cargar el detalle');

            const n = data.novedad;
            const soportes = data.soportes || [];
            const historial = data.historial || [];

            document.getElementById('detalleTipoNovedad').textContent = n.tipo_novedad || 'Detalle';

            let html = `
                <div class="col-md-6">
                    <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 14px;">
                        <small style="color: #64748b; font-weight: 700; text-transform: uppercase;">Empleado</small>
                        <div style="font-weight: 700; color: #0f172a; font-size: 15px;">${escaparHTML(n.empleado_nombre)}</div>
                        <div style="color: #94a3b8; font-size: 13px;">Doc: ${escaparHTML(n.numero_documento || 'N/A')}</div>
                    </div>
                </div>
                <div class="col-md-6">
                    <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 14px;">
                        <small style="color: #64748b; font-weight: 700; text-transform: uppercase;">Estado</small>
                        <div style="margin-top: 4px;">${crearBadgeEstado(n.estado)}</div>
                    </div>
                </div>
                <div class="col-md-6">
                    <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 14px;">
                        <small style="color: #64748b; font-weight: 700; text-transform: uppercase;">Fecha Inicio / Fin</small>
                        <div style="font-weight: 600; color: #334155; font-size: 14px;">
                            ${formatearFecha(n.fecha_inicio)} ${n.fecha_fin ? ' → ' + formatearFecha(n.fecha_fin) : ''}
                        </div>
                    </div>
                </div>
                <div class="col-md-6">
                    <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 14px;">
                        <small style="color: #64748b; font-weight: 700; text-transform: uppercase;">Cantidad</small>
                        <div style="font-weight: 600; color: #334155; font-size: 14px;">
                            ${n.cantidad_dias ? n.cantidad_dias + ' días' : (n.cantidad_horas ? n.cantidad_horas + ' horas' : 'N/A')}
                        </div>
                    </div>
                </div>
                <div class="col-12">
                    <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 14px;">
                        <small style="color: #64748b; font-weight: 700; text-transform: uppercase;">Motivo / Observación</small>
                        <div style="color: #334155; font-size: 14px; margin-top: 4px;">
                            ${escaparHTML(n.motivo || 'Sin motivo registrado')}<br>
                            <span style="color: #64748b; font-style: italic;">${escaparHTML(n.observacion || '')}</span>
                        </div>
                    </div>
                </div>
            `;

            if (n.estado === 'RECHAZADA' && n.observacion_rechazo) {
                html += `
                    <div class="col-12 mt-3">
                        <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 12px; padding: 14px;">
                            <small style="color: #b91c1c; font-weight: 700; text-transform: uppercase;">Motivo del Rechazo</small>
                            <div style="color: #b91c1c; font-size: 14px; margin-top: 4px;">${escaparHTML(n.observacion_rechazo)}</div>
                        </div>
                    </div>
                `;
            }

            if (historial.length > 0) {
                html += `
                    <div class="col-12 mt-4">
                        <small style="color: #64748b; font-weight: 700; text-transform: uppercase;">Historial de Cambios</small>
                        <ul style="list-style: none; padding-left: 0; margin-top: 10px; border-left: 2px solid #e2e8f0; margin-left: 10px;">
                `;
                historial.forEach(h => {
                    html += `
                        <li style="margin-bottom: 12px; padding-left: 15px; position: relative;">
                            <div style="position: absolute; left: -6px; top: 4px; width: 10px; height: 10px; border-radius: 50%; background: #16a34a; border: 2px solid #fff;"></div>
                            <div style="font-weight: 700; font-size: 13px; color: #0f172a;">${h.estado_nuevo}</div>
                            <div style="font-size: 12px; color: #64748b;">${formatearFechaHora(h.fecha_registro)}</div>
                            ${h.observacion ? `<div style="font-size: 12px; color: #94a3b8; font-style: italic;">"${h.observacion}"</div>` : ''}
                        </li>
                    `;
                });
                html += `</ul></div>`;
            }

            document.getElementById('detalleContenido').innerHTML = html;

            if (soportes.length > 0) {
                const btnSoporte = document.getElementById('detalleBtnSoporte');
                btnSoporte.href = soportes[0].ruta_archivo;
                btnSoporte.style.display = 'inline-flex';
                if (soportes.length > 1) {
                    btnSoporte.textContent = `Ver soporte (1 de ${soportes.length})`;
                }
            }

        } catch (error) {
            console.error('Error al cargar el detalle:', error);
            document.getElementById('detalleContenido').innerHTML = `
                <div class="col-12">
                    <div class="alert alert-danger">${escaparHTML(error.message)}</div>
                </div>
            `;
        }
    }

    /* ========================================================
       MODAL DE REGISTRO Y FORMULARIOS DINÁMICOS
       ======================================================== */
    async function abrirRegistroNovedad() {
        limpiarFormularioNovedad();
        await cargarTiposRegistro();
        
        const modalElement = document.getElementById('modalRegistrarNovedad');
        if (modalElement) {
            const modal = bootstrap.Modal.getOrCreateInstance(modalElement);
            modal.show();
        }
    }

    async function cargarTiposRegistro() {
        if (!registroTipoNovedad) return;
        try {
            const res = await fetch('/api/nomina/novedades/tipos');
            const data = await res.json();
            if (!res.ok || !data.success) throw new Error('Error al cargar tipos');

            registroTipoNovedad.innerHTML = `<option value="">Selecciona un tipo de novedad</option>`;
            data.tipos.forEach(t => {
                const opt = document.createElement('option');
                opt.value = t.id;
                opt.textContent = `${t.nombre} — ${t.categoria}`;
                opt.dataset.nombre = t.nombre;
                opt.dataset.codigo = t.codigo;
                opt.dataset.categoria = t.categoria;
                opt.dataset.descripcion = t.descripcion || '';
                opt.dataset.permiteEmpleado = t.permite_empleado;
                opt.dataset.requiereSoporte = t.requiere_soporte;
                opt.dataset.requiereAprobacion = t.requiere_aprobacion;
                registroTipoNovedad.appendChild(opt);
            });
        } catch (error) { mostrarToast(error.message, 'error'); }
    }

    async function seleccionarTipoNovedad() {
        if (!registroTipoNovedad) return;
        const opt = registroTipoNovedad.selectedOptions[0];
        
        if (!opt || !opt.value) {
            informacionTipoNovedad.style.display = 'none';
            formularioNovedadDinamico.style.display = 'none';
            seccionSoporteNovedad.style.display = 'none';
            avisoAprobacionNovedad.style.display = 'none';
            btnGuardarNovedad.disabled = true;
            camposNovedad.innerHTML = ''; 
            return;
        }

        const codigo = (opt.dataset.codigo || '').toUpperCase();
        const categoria = (opt.dataset.categoria || '').toUpperCase();
        const nombre = opt.dataset.nombre || '';
        const permiteEmpleado = Number(opt.dataset.permiteEmpleado);

        registroTipoNombre.textContent = nombre;
        registroTipoDescripcion.textContent = opt.dataset.descripcion || 'Sin descripción.';
        informacionTipoNovedad.style.display = 'block';
        formularioNovedadDinamico.style.display = 'block';
        seccionSoporteNovedad.style.display = Number(opt.dataset.requiereSoporte) ? 'block' : 'none';
        avisoAprobacionNovedad.style.display = Number(opt.dataset.requiereAprobacion) ? 'flex' : 'none';

        camposNovedad.innerHTML = ''; 
        btnGuardarNovedad.disabled = true;

        const categoriasPermitidas = ['LICENCIA', 'PRESTAMOS', 'INGRESOS', 'DESCUENTOS', 'VACACIONES'];
        const nombreLower = nombre.toLowerCase();
        const esPermitida = !!permiteEmpleado 
            || categoriasPermitidas.includes(categoria)
            || nombreLower.includes('licencia')
            || nombreLower.includes('vacacion');

        if (!esPermitida) {
            camposNovedad.innerHTML = `<div class="alert alert-warning"><i class="fas fa-lock"></i> Este tipo de novedad no puede ser registrado directamente por un empleado.</div>`;
            return;
        }

        if (categoria === 'ASISTENCIA' || codigo === 'AUSENCIA' || nombreLower.includes('ausencia')) {
            camposNovedad.innerHTML = `
                <div class="row g-3">
                    <div class="col-12">
                        <label class="form-label">Empleado <span class="text-danger">*</span></label>
                        <input type="text" id="empleadoAusencia" class="form-control" placeholder="Escribe el nombre..." autocomplete="off">
                        <div id="listaEmpleadosAusencia" class="list-group mt-1" style="display: none; position: absolute; z-index: 1000; width: 95%;"></div>
                        <input type="hidden" id="empleadoAusenciaId">
                    </div>
                    <div class="col-md-6">
                        <label class="form-label">Tipo de ausencia <span class="text-danger">*</span></label>
                        <select id="tipoAusencia" class="form-select"><option value="">Selecciona...</option><option value="JUSTIFICADA">Justificada</option><option value="INJUSTIFICADA">Injustificada</option></select>
                    </div>
                    <div class="col-md-3"><label class="form-label">Fecha inicio <span class="text-danger">*</span></label><input type="date" id="fechaInicioAusencia" class="form-control"></div>
                    <div class="col-md-3"><label class="form-label">Fecha fin <span class="text-danger">*</span></label><input type="date" id="fechaFinAusencia" class="form-control"></div>
                    <div class="col-md-4"><label class="form-label">Días</label><input type="number" id="cantidadDiasAusencia" class="form-control" readonly></div>
                    <div class="col-md-8"><label class="form-label">Motivo <span class="text-danger">*</span></label><textarea id="motivoAusencia" class="form-control" rows="2"></textarea></div>
                </div>
            `;
            configurarFormularioAusencia();
            btnGuardarNovedad.disabled = false;
            return;
        }

        if (codigo === 'SALUD' || nombreLower.includes('incapacidad')) {
            camposNovedad.innerHTML = `
                <div class="row g-3">
                    <div class="col-md-6">
                        <label class="form-label">Tipo de incapacidad <span class="text-danger">*</span></label>
                        <select id="tipoIncapacidad" class="form-select"><option value="">Selecciona...</option><option value="ENFERMEDAD_GENERAL">Enfermedad general</option><option value="ACCIDENTE_TRABAJO">Accidente de trabajo</option></select>
                    </div>
                    <div class="col-md-3"><label class="form-label">Fecha inicio <span class="text-danger">*</span></label><input type="date" id="fechaInicioIncapacidad" class="form-control"></div>
                    <div class="col-md-3"><label class="form-label">Fecha fin <span class="text-danger">*</span></label><input type="date" id="fechaFinIncapacidad" class="form-control"></div>
                    <div class="col-md-4"><label class="form-label">Días</label><input type="number" id="cantidadDiasIncapacidad" class="form-control" readonly></div>
                    <div class="col-md-8"><label class="form-label">Observación</label><textarea id="observacionIncapacidad" class="form-control" rows="2"></textarea></div>
                </div>
            `;
            configurarFormularioIncapacidad();
            btnGuardarNovedad.disabled = false;
            return;
        }

        if (codigo === 'HORAS_EXTRA' || nombreLower.includes('hora')) {
            camposNovedad.innerHTML = `
                <div class="row g-3">
                    <div class="col-md-6"><label class="form-label">Tipo de hora <span class="text-danger">*</span></label><select id="tipoHoraExtra" class="form-select"><option value="">Cargando...</option></select></div>
                    <div class="col-md-6"><label class="form-label">Fecha de trabajo <span class="text-danger">*</span></label><input type="date" id="fechaTrabajoHoraExtra" class="form-control"></div>
                    <div class="col-md-4"><label class="form-label">Hora inicio <span class="text-danger">*</span></label><input type="time" id="horaInicioHoraExtra" class="form-control"></div>
                    <div class="col-md-4"><label class="form-label">Hora fin <span class="text-danger">*</span></label><input type="time" id="horaFinHoraExtra" class="form-control"></div>
                    <div class="col-md-4"><label class="form-label">Cantidad horas</label><input type="number" id="cantidadHorasExtra" class="form-control" readonly></div>
                    <div class="col-12"><label class="form-label">Observación</label><textarea id="observacionHoraExtra" class="form-control" rows="2"></textarea></div>
                </div>
            `;
            await configurarFormularioHorasExtra();
            btnGuardarNovedad.disabled = false;
            return;
        }

        if (codigo === 'PERMISO' || nombreLower.includes('permiso')) {
            camposNovedad.innerHTML = `
                <div class="row g-3">
                    <div class="col-md-6">
                        <label class="form-label">Tipo de permiso <span class="text-danger">*</span></label>
                        <select id="tipoPermiso" class="form-select"><option value="">Selecciona...</option><option value="REMUNERADO">Remunerado</option><option value="NO_REMUNERADO">No remunerado</option><option value="COMPENSATORIO">Compensatorio</option></select>
                    </div>
                    <div class="col-md-6"><label class="form-label">Fecha <span class="text-danger">*</span></label><input type="date" id="fechaPermiso" class="form-control"></div>
                    <div class="col-md-4"><label class="form-label">Hora inicio <span class="text-danger">*</span></label><input type="time" id="horaInicioPermiso" class="form-control"></div>
                    <div class="col-md-4"><label class="form-label">Hora fin <span class="text-danger">*</span></label><input type="time" id="horaFinPermiso" class="form-control"></div>
                    <div class="col-md-4"><label class="form-label">Cantidad horas</label><input type="number" id="cantidadHorasPermiso" class="form-control" readonly></div>
                    <div class="col-md-6"><label class="form-label">Motivo <span class="text-danger">*</span></label><textarea id="motivoPermiso" class="form-control" rows="2"></textarea></div>
                    <div class="col-md-6"><label class="form-label">Observación</label><textarea id="observacionPermiso" class="form-control" rows="2"></textarea></div>
                </div>
            `;
            configurarFormularioPermiso();
            btnGuardarNovedad.disabled = false;
            return;
        }

        if (codigo === 'LICENCIA' || nombreLower.includes('licencia')) {
            camposNovedad.innerHTML = `
                <div class="row g-3">
                    <div class="col-12">
                        <label class="form-label">Empleado <span class="text-danger">*</span></label>
                        <input type="text" id="buscarEmpleadoLicencia" class="form-control" placeholder="Buscar..." autocomplete="off">
                        <div id="resultadosEmpleadoLicencia" class="list-group" style="position: absolute; z-index: 1000; width: 95%; display:none;"></div>
                        <input type="hidden" id="empleadoLicencia">
                    </div>
                    
                    <div class="col-md-12">
                        <label class="form-label">Tipo de licencia / permiso <span class="text-danger">*</span></label>
                        <select id="tipoLicencia" class="form-select">
                            <option value="">Selecciona...</option>
                            <optgroup label="Licencias de Ley (Remuneradas)">
                                <option value="MATERNIDAD">Licencia de Maternidad (18 semanas)</option>
                                <option value="PATERNIDAD">Licencia de Paternidad (2 semanas)</option>
                                <option value="LUTO">Licencia por Luto (5 días hábiles)</option>
                                <option value="MATRIMONIO">Licencia por Matrimonio (3 días hábiles)</option>
                                <option value="VOTO">Ejercicio del Voto (Media jornada / Certificado)</option>
                                <option value="JURADO">Jurado de Votación (1 día completo)</option>
                                <option value="CALAMIDAD">Calamidad Doméstica Grave (Tiempo razonable)</option>
                            </optgroup>
                            <optgroup label="Permisos Sindicales o Personales">
                                <option value="CITA_MEDICA">Cita Médica (EPS/Clínica)</option>
                                <option value="OBLIGACION_ESCOLAR">Obligación Escolar (Hijos/Representados)</option>
                                <option value="CITA_JUDICIAL">Cita Judicial o Administrativa</option>
                                <option value="BICICLETA">Uso de la Bicicleta (1 día por cada 6 meses)</option>
                                <option value="SINDICATO">Comisiones Sindicales</option>
                                <option value="ENTIERRO">Entierro de Compañero de Trabajo</option>
                            </optgroup>
                        </select>
                    </div>

                    <div class="col-md-6"><label class="form-label">Fecha inicio <span class="text-danger">*</span></label><input type="date" id="fechaInicioLicencia" class="form-control"></div>
                    <div class="col-md-3"><label class="form-label">Fecha fin <span class="text-danger">*</span></label><input type="date" id="fechaFinLicencia" class="form-control"></div>
                    <div class="col-md-3"><label class="form-label">Total Días</label><input type="number" id="cantidadDiasLicencia" class="form-control" readonly></div>
                </div>
            `;
            configurarFormularioLicencia();
            btnGuardarNovedad.disabled = false;
            return;
        }

        if (codigo === 'VACACIONES' || nombreLower.includes('vacacion')) {
            camposNovedad.innerHTML = `
                <div class="row g-3">
                    <div class="col-12">
                        <label class="form-label">Empleado <span class="text-danger">*</span></label>
                        <input type="text" id="buscarEmpleadoVacaciones" class="form-control" placeholder="Buscar empleado..." autocomplete="off">
                        <div id="resultadosEmpleadoVacaciones" class="list-group" style="position: absolute; z-index: 1000; width: 95%; display:none;"></div>
                        <input type="hidden" id="empleadoVacaciones">
                    </div>
                    <div class="col-md-6">
                        <label class="form-label">Fecha de inicio <span class="text-danger">*</span></label>
                        <input type="date" id="fechaInicioVacaciones" class="form-control">
                    </div>
                    <div class="col-md-6">
                        <label class="form-label">Fecha de fin <span class="text-danger">*</span></label>
                        <input type="date" id="fechaFinVacaciones" class="form-control">
                    </div>
                    <div class="col-md-4">
                        <label class="form-label">Días hábiles</label>
                        <input type="number" id="cantidadDiasVacaciones" class="form-control" readonly>
                    </div>
                    <div class="col-md-8">
                        <label class="form-label">Observación</label>
                        <textarea id="observacionVacaciones" class="form-control" rows="2" placeholder="Periodo de vacaciones..."></textarea>
                    </div>
                </div>
            `;
            configurarBuscadorEmpleado('Vacaciones');
            const fIni = document.getElementById('fechaInicioVacaciones');
            const fFin = document.getElementById('fechaFinVacaciones');
            const cantDias = document.getElementById('cantidadDiasVacaciones');
            const calcFechas = () => {
                if (fIni.value && fFin.value) {
                    const d1 = new Date(fIni.value + 'T00:00:00'); 
                    const d2 = new Date(fFin.value + 'T00:00:00');
                    if (d2 >= d1) cantDias.value = Math.floor((d2 - d1) / (1000 * 60 * 60 * 24)) + 1;
                }
            };
            fIni.addEventListener('change', calcFechas);
            fFin.addEventListener('change', calcFechas);
            btnGuardarNovedad.disabled = false;
            return;
        }

        if (categoria === 'DESCUENTOS' || nombreLower.includes('descuento')) {
            camposNovedad.innerHTML = `
                <div class="row g-3">
                    <div class="col-12">
                        <label class="form-label">Empleado <span class="text-danger">*</span></label>
                        <input type="text" id="buscarEmpleadoDescuento" class="form-control" placeholder="Buscar empleado..." autocomplete="off">
                        <div id="resultadosEmpleadoDescuento" class="list-group" style="position: absolute; z-index: 1000; width: 95%; display:none;"></div>
                        <input type="hidden" id="empleadoDescuento">
                    </div>
                    <div class="col-md-6"><label class="form-label">Concepto <span class="text-danger">*</span></label><input type="text" id="conceptoDescuento" class="form-control" placeholder="Ej. Libranza, Embargo..."></div>
                    <div class="col-md-6"><label class="form-label">Valor a descontar <span class="text-danger">*</span></label><input type="number" id="valorDescuento" class="form-control" placeholder="0.00"></div>
                    <div class="col-12"><label class="form-label">Observación</label><textarea id="observacionDescuento" class="form-control" rows="2"></textarea></div>
                </div>
            `;
            configurarBuscadorEmpleado('Descuento');
            seccionSoporteNovedad.style.display = 'block';
            btnGuardarNovedad.disabled = false;
            return;
        }

        if (categoria === 'INGRESOS' || nombreLower.includes('ingreso')) {
            camposNovedad.innerHTML = `
                <div class="row g-3">
                    <div class="col-12">
                        <label class="form-label">Empleado <span class="text-danger">*</span></label>
                        <input type="text" id="buscarEmpleadoIngreso" class="form-control" placeholder="Buscar empleado..." autocomplete="off">
                        <div id="resultadosEmpleadoIngreso" class="list-group" style="position: absolute; z-index: 1000; width: 95%; display:none;"></div>
                        <input type="hidden" id="empleadoIngreso">
                    </div>
                    <div class="col-md-6"><label class="form-label">Concepto <span class="text-danger">*</span></label><input type="text" id="conceptoIngreso" class="form-control" placeholder="Ej. Bonificación, Comisión..."></div>
                    <div class="col-md-6"><label class="form-label">Valor del ingreso <span class="text-danger">*</span></label><input type="number" id="valorIngreso" class="form-control" placeholder="0.00"></div>
                    <div class="col-12"><label class="form-label">Observación</label><textarea id="observacionIngreso" class="form-control" rows="2"></textarea></div>
                </div>
            `;
            configurarBuscadorEmpleado('Ingreso');
            btnGuardarNovedad.disabled = false;
            return;
        }

        if (categoria === 'PRESTAMOS' || nombreLower.includes('préstamo') || nombreLower.includes('anticipo')) {
            const esAnticipo = nombreLower.includes('anticipo');
            camposNovedad.innerHTML = `
                <div class="row g-3">
                    <div class="col-md-6"><label class="form-label">Monto solicitado <span class="text-danger">*</span></label><input type="number" id="montoPrestamo" class="form-control" placeholder="0.00"></div>
                    ${!esAnticipo ? `
                    <div class="col-md-6"><label class="form-label">Número de cuotas <span class="text-danger">*</span></label><input type="number" id="cuotasPrestamo" class="form-control" value="1" min="1"></div>
                    ` : ''}
                    <div class="col-12"><label class="form-label">Observación</label><textarea id="observacionPrestamo" class="form-control" rows="2"></textarea></div>
                </div>
            `;
            btnGuardarNovedad.disabled = false;
            return;
        }

        camposNovedad.innerHTML = `<div class="alert alert-info">Formulario pendiente por implementar.</div>`;
    }

    /* ========================================================
       CONFIGURADORES DE FORMULARIOS
       ======================================================== */
    function normalizarEmpleados(data) {
        const arr = data?.empleados || data?.data || data;
        return Array.isArray(arr) ? arr : [];
    }

    function configurarFormularioAusencia() {
        const inputEmpleado = document.getElementById('empleadoAusencia');
        const listaEmpleados = document.getElementById('listaEmpleadosAusencia');
        const empleadoId = document.getElementById('empleadoAusenciaId');
        let empleadosData = [];

        fetch('/api/empleados', { credentials: 'include' })
            .then(res => res.json())
            .then(data => empleadosData = normalizarEmpleados(data))
            .catch(console.error);

        inputEmpleado.addEventListener('input', function () {
            const texto = this.value.trim().toLowerCase();
            empleadoId.value = '';
            if (!texto) { listaEmpleados.style.display = 'none'; return; }

            const resultados = empleadosData.filter(emp => {
                const nom = emp.nombre_completo || emp.nombre || `${emp.nombres || ''} ${emp.apellidos || ''}`.trim();
                const doc = emp.numero_documento || emp.documento || '';
                return nom.toLowerCase().includes(texto) || doc.includes(texto);
            });

            listaEmpleados.innerHTML = '';
            resultados.slice(0, 5).forEach(emp => {
                const nom = emp.nombre_completo || emp.nombre || `${emp.nombres || ''} ${emp.apellidos || ''}`.trim();
                const btn = document.createElement('button');
                btn.type = 'button';
                btn.className = 'list-group-item list-group-item-action';
                btn.textContent = nom;
                btn.onclick = () => {
                    inputEmpleado.value = nom;
                    empleadoId.value = emp.id;
                    listaEmpleados.style.display = 'none';
                };
                listaEmpleados.appendChild(btn);
            });
            listaEmpleados.style.display = 'block';
        });

        const fInicio = document.getElementById('fechaInicioAusencia');
        const fFin = document.getElementById('fechaFinAusencia');
        const diasInput = document.getElementById('cantidadDiasAusencia');

        const calcular = () => {
            if (fInicio.value && fFin.value) {
                const d1 = new Date(fInicio.value + 'T00:00:00');
                const d2 = new Date(fFin.value + 'T00:00:00');
                if (d2 >= d1) diasInput.value = Math.floor((d2 - d1) / (1000 * 60 * 60 * 24)) + 1;
                else diasInput.value = '';
            }
        };
        fInicio.addEventListener('change', calcular);
        fFin.addEventListener('change', calcular);

        document.getElementById('tipoAusencia').addEventListener('change', (e) => {
            seccionSoporteNovedad.style.display = (e.target.value === 'JUSTIFICADA') ? 'block' : 'none';
        });
    }

    function configurarFormularioIncapacidad() {
        const fInicio = document.getElementById('fechaInicioIncapacidad');
        const fFin = document.getElementById('fechaFinIncapacidad');
        const diasInput = document.getElementById('cantidadDiasIncapacidad');

        const calcular = () => {
            if (fInicio.value && fFin.value) {
                const d1 = new Date(fInicio.value + 'T00:00:00');
                const d2 = new Date(fFin.value + 'T00:00:00');
                if (d2 >= d1) diasInput.value = Math.floor((d2 - d1) / (1000 * 60 * 60 * 24)) + 1;
                else diasInput.value = '';
            }
        };
        fInicio.addEventListener('change', calcular);
        fFin.addEventListener('change', calcular);
    }

    function configurarFormularioLicencia() {
        const inputEmp = document.getElementById('buscarEmpleadoLicencia');
        const listaEmp = document.getElementById('resultadosEmpleadoLicencia');
        const idEmp = document.getElementById('empleadoLicencia');
        const selTipo = document.getElementById('tipoLicencia');
        const fIni = document.getElementById('fechaInicioLicencia');
        const fFin = document.getElementById('fechaFinLicencia');
        const cantDias = document.getElementById('cantidadDiasLicencia');
        let empleadosData = [];

        fetch('/api/empleados', { credentials: 'include' })
            .then(res => res.json())
            .then(data => empleadosData = normalizarEmpleados(data))
            .catch(console.error);

        inputEmp.addEventListener('input', function() {
            const text = this.value.toLowerCase();
            idEmp.value = '';
            if(!text) { listaEmp.style.display = 'none'; return; }
            
            const res = empleadosData.filter(e => {
                const nom = e.nombre_completo || e.nombre || `${e.nombres || ''} ${e.apellidos || ''}`.trim();
                const doc = e.numero_documento || e.documento || '';
                return nom.toLowerCase().includes(text) || doc.includes(text);
            });
            
            listaEmp.innerHTML = '';
            res.slice(0,5).forEach(e => {
                const nom = e.nombre_completo || e.nombre || `${e.nombres || ''} ${e.apellidos || ''}`.trim();
                const btn = document.createElement('button');
                btn.type = 'button'; btn.className = 'list-group-item list-group-item-action';
                btn.textContent = nom;
                btn.onclick = () => { inputEmp.value = nom; idEmp.value = e.id; listaEmp.style.display = 'none'; };
                listaEmp.appendChild(btn);
            });
            listaEmp.style.display = 'block';
        });

        selTipo.addEventListener('change', () => {
            const tipo = selTipo.value;
            let diasDefault = 0;

            if (tipo === 'MATERNIDAD') diasDefault = 126;
            else if (tipo === 'PATERNIDAD') diasDefault = 14;
            else if (tipo === 'LUTO') diasDefault = 5;
            else if (tipo === 'MATRIMONIO') diasDefault = 3;
            else if (tipo === 'JURADO') diasDefault = 1;
            else if (tipo === 'BICICLETA') diasDefault = 1;
            
            if (diasDefault > 0 && fIni.value) {
                cantDias.value = diasDefault;
                const ini = new Date(fIni.value + 'T00:00:00');
                const fin = new Date(ini); 
                fin.setDate(fin.getDate() + diasDefault - 1); 
                fFin.value = fin.toISOString().split('T')[0];
            }
        });

        const calcularFechas = () => {
            if (fIni.value && fFin.value) {
                const ini = new Date(fIni.value + 'T00:00:00');
                const fin = new Date(fFin.value + 'T00:00:00');
                if (fin >= ini) cantDias.value = Math.floor((fin - ini) / (1000 * 60 * 60 * 24)) + 1;
            }
        };
        fIni.addEventListener('change', calcularFechas);
        fFin.addEventListener('change', calcularFechas);
    }

    function configurarFormularioPermiso() {
        const hIni = document.getElementById('horaInicioPermiso');
        const hFin = document.getElementById('horaFinPermiso');
        const cant = document.getElementById('cantidadHorasPermiso');

        const calc = () => {
            if (hIni.value && hFin.value) {
                const [h1, m1] = hIni.value.split(':').map(Number);
                const [h2, m2] = hFin.value.split(':').map(Number);
                const diff = (h2 * 60 + m2) - (h1 * 60 + m1);
                if (diff > 0) cant.value = (diff / 60).toFixed(2);
                else cant.value = '';
            }
        };
        hIni.addEventListener('change', calc);
        hFin.addEventListener('change', calc);
    }

    async function configurarFormularioHorasExtra() {
        const sel = document.getElementById('tipoHoraExtra');
        
        try {
            const [resHE, resRec] = await Promise.all([
                fetch('/api/nomina/configuracion/horas-extra', { credentials: 'include' }),
                fetch('/api/nomina/configuracion/recargos', { credentials: 'include' })
            ]);
            const dataHE = await resHE.json();
            const dataRec = await resRec.json();
            
            const he = dataHE.data || dataHE;
            const rec = dataRec.data || dataRec;

            sel.innerHTML = `<option value="">Selecciona...</option>`;
            
            if (Array.isArray(he) && he.length > 0) {
                const group = document.createElement('optgroup'); group.label = 'Horas Extra';
                he.forEach(t => { const o = document.createElement('option'); o.value = t.codigo; o.textContent = t.nombre; group.appendChild(o); });
                sel.appendChild(group);
            }
            if (Array.isArray(rec) && rec.length > 0) {
                const group = document.createElement('optgroup'); group.label = 'Recargos';
                rec.forEach(t => { const o = document.createElement('option'); o.value = t.codigo; o.textContent = t.nombre; group.appendChild(o); });
                sel.appendChild(group);
            }
        } catch (error) {
            sel.innerHTML = `<option value="">Error al cargar</option>`;
        }

        const hIni = document.getElementById('horaInicioHoraExtra');
        const hFin = document.getElementById('horaFinHoraExtra');
        const cant = document.getElementById('cantidadHorasExtra');

        const calc = () => {
            if (hIni.value && hFin.value) {
                const [h1, m1] = hIni.value.split(':').map(Number);
                const [h2, m2] = hFin.value.split(':').map(Number);
                const diff = (h2 * 60 + m2) - (h1 * 60 + m1);
                if (diff > 0) cant.value = (diff / 60).toFixed(2);
                else cant.value = '';
            }
        };
        hIni.addEventListener('change', calc);
        hFin.addEventListener('change', calc);
    }

    function configurarBuscadorEmpleado(prefix) {
        const inputEmp = document.getElementById(`buscarEmpleado${prefix}`);
        const listaEmp = document.getElementById(`resultadosEmpleado${prefix}`);
        const idEmp = document.getElementById(`empleado${prefix}`);
        
        if (!inputEmp) return;

        let empleadosData = [];

        fetch('/api/empleados', { credentials: 'include' })
            .then(res => res.json())
            .then(data => empleadosData = normalizarEmpleados(data))
            .catch(console.error);

        inputEmp.addEventListener('input', function() {
            const text = this.value.toLowerCase();
            idEmp.value = '';
            if(!text) { listaEmp.style.display = 'none'; return; }
            
            const res = empleadosData.filter(e => {
                const nom = e.nombre_completo || e.nombre || `${e.nombres || ''} ${e.apellidos || ''}`.trim();
                const doc = e.numero_documento || e.documento || '';
                return nom.toLowerCase().includes(text) || doc.includes(text);
            });
            
            listaEmp.innerHTML = '';
            res.slice(0,5).forEach(e => {
                const nom = e.nombre_completo || e.nombre || `${e.nombres || ''} ${e.apellidos || ''}`.trim();
                const btn = document.createElement('button');
                btn.type = 'button'; btn.className = 'list-group-item list-group-item-action';
                btn.textContent = nom;
                btn.onclick = () => { inputEmp.value = nom; idEmp.value = e.id; listaEmp.style.display = 'none'; };
                listaEmp.appendChild(btn);
            });
            listaEmp.style.display = 'block';
        });
    }

    /* ========================================================
       GUARDAR NOVEDAD
       ======================================================== */
    async function guardarNovedad() {
        const opt = registroTipoNovedad?.selectedOptions[0];
        if (!opt || !opt.value) return mostrarToast('Selecciona un tipo de novedad', 'error');

        const codigo = (opt.dataset.codigo || '').toUpperCase();
        const categoria = (opt.dataset.categoria || '').toUpperCase();
        const nombre = opt.dataset.nombre || '';
        const tipoNovedadId = opt.value;
        const archivo = soporteNovedad?.files?.[0];

        try {
            btnGuardarNovedad.disabled = true;
            btnGuardarNovedad.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Guardando...`;

            let endpoint = '';
            let payload = null;
            let formData = null;

            if (codigo === 'SALUD' || nombre.toLowerCase().includes('incapacidad')) {
                if (!archivo) throw new Error('Debes adjuntar el soporte médico.');
                endpoint = 'incapacidad';
                formData = new FormData();
                formData.append('tipo_novedad_id', tipoNovedadId);
                formData.append('tipo_incapacidad', document.getElementById('tipoIncapacidad').value);
                formData.append('fecha_inicio', document.getElementById('fechaInicioIncapacidad').value);
                formData.append('fecha_fin', document.getElementById('fechaFinIncapacidad').value);
                formData.append('observacion', document.getElementById('observacionIncapacidad').value);
                formData.append('soporte', archivo);
            }
            else if (categoria === 'ASISTENCIA') {
                const empId = document.getElementById('empleadoAusenciaId').value;
                if (!empId) throw new Error('Debes buscar y seleccionar un empleado de la lista.');
                endpoint = 'ausencia';
                formData = new FormData();
                formData.append('tipo_novedad_id', tipoNovedadId);
                formData.append('empleado_id', empId);
                formData.append('tipo_ausencia', document.getElementById('tipoAusencia').value);
                formData.append('fecha_inicio', document.getElementById('fechaInicioAusencia').value);
                formData.append('fecha_fin', document.getElementById('fechaFinAusencia').value);
                formData.append('cantidad_dias', document.getElementById('cantidadDiasAusencia').value);
                formData.append('motivo', document.getElementById('motivoAusencia').value);
                if (archivo) formData.append('soporte', archivo);
            }
            else if (codigo === 'PERMISO' || nombre.toLowerCase().includes('permiso')) {
                endpoint = 'permiso';
                payload = {
                    tipo_novedad_id: tipoNovedadId,
                    tipo_permiso: document.getElementById('tipoPermiso').value,
                    fecha_permiso: document.getElementById('fechaPermiso').value,
                    hora_inicio: document.getElementById('horaInicioPermiso').value,
                    hora_fin: document.getElementById('horaFinPermiso').value,
                    cantidad_horas: Number(document.getElementById('cantidadHorasPermiso').value),
                    motivo: document.getElementById('motivoPermiso').value,
                    observacion: document.getElementById('observacionPermiso').value
                };
            }
            else if (codigo === 'LICENCIA' || nombre.toLowerCase().includes('licencia')) {
                const empId = document.getElementById('empleadoLicencia').value;
                if (!empId) throw new Error('Debes buscar y seleccionar un empleado de la lista.');
                
                const tipoLic = document.getElementById('tipoLicencia').value;
                if (!tipoLic) throw new Error('Selecciona el tipo de licencia.');

                endpoint = 'licencia';
                payload = {
                    tipo_novedad_id: tipoNovedadId,
                    empleado_id: Number(empId),
                    tipo_licencia: tipoLic,
                    fecha_inicio: document.getElementById('fechaInicioLicencia').value,
                    fecha_fin: document.getElementById('fechaFinLicencia').value,
                    cantidad_dias: Number(document.getElementById('cantidadDiasLicencia').value),
                    motivo: document.querySelector('#tipoLicencia option:checked').text,
                    observacion: null
                };
            }
            else if (codigo === 'VACACIONES' || nombre.toLowerCase().includes('vacacion')) {
                const empId = document.getElementById('empleadoVacaciones').value;
                if (!empId) throw new Error('Debes buscar y seleccionar un empleado de la lista.');
                
                const fIni = document.getElementById('fechaInicioVacaciones').value;
                const fFin = document.getElementById('fechaFinVacaciones').value;
                const dias = document.getElementById('cantidadDiasVacaciones').value;
                
                if (!fIni || !fFin || !dias) throw new Error('Completa las fechas de las vacaciones.');

                endpoint = 'vacaciones';
                payload = {
                    tipo_novedad_id: tipoNovedadId,
                    empleado_id: Number(empId),
                    fecha_inicio: fIni,
                    fecha_fin: fFin,
                    cantidad_dias: Number(dias),
                    motivo: 'Vacaciones',
                    observacion: document.getElementById('observacionVacaciones').value
                };
            }
            else if (codigo === 'HORAS_EXTRA' || nombre.toLowerCase().includes('hora')) {
                endpoint = 'horas-extra';
                payload = {
                    tipo_novedad_id: tipoNovedadId,
                    tipo_hora: document.getElementById('tipoHoraExtra').value,
                    fecha_trabajo: document.getElementById('fechaTrabajoHoraExtra').value,
                    hora_inicio: document.getElementById('horaInicioHoraExtra').value,
                    hora_fin: document.getElementById('horaFinHoraExtra').value,
                    cantidad_horas: Number(document.getElementById('cantidadHorasExtra').value),
                    observacion: document.getElementById('observacionHoraExtra').value
                };
            }
            else if (categoria === 'DESCUENTOS') {
                const empId = document.getElementById('empleadoDescuento').value;
                if (!empId) throw new Error('Selecciona un empleado de la lista.');

                endpoint = 'descuento';
                formData = new FormData();
                formData.append('tipo_novedad_id', tipoNovedadId);
                formData.append('empleado_id', empId);
                formData.append('concepto', document.getElementById('conceptoDescuento').value);
                formData.append('valor', document.getElementById('valorDescuento').value);
                formData.append('observacion', document.getElementById('observacionDescuento').value);
                if (archivo) formData.append('soporte', archivo);
            }
            else if (categoria === 'INGRESOS') {
                const empId = document.getElementById('empleadoIngreso').value;
                if (!empId) throw new Error('Selecciona un empleado de la lista.');

                endpoint = 'ingreso';
                payload = {
                    tipo_novedad_id: tipoNovedadId,
                    empleado_id: Number(empId),
                    concepto: document.getElementById('conceptoIngreso').value,
                    valor: Number(document.getElementById('valorIngreso').value),
                    observacion: document.getElementById('observacionIngreso').value
                };
            }
            else if (categoria === 'PRESTAMOS') {
                endpoint = 'prestamo';
                const esAnticipo = nombre.toLowerCase().includes('anticipo');
                payload = {
                    tipo_novedad_id: tipoNovedadId,
                    monto: Number(document.getElementById('montoPrestamo').value),
                    cuotas: esAnticipo ? 1 : Number(document.getElementById('cuotasPrestamo').value),
                    observacion: document.getElementById('observacionPrestamo').value
                };
            }
            else {
                throw new Error('Formulario no implementado aún.');
            }

            const fetchOptions = {
                method: 'POST',
                body: formData ? formData : JSON.stringify(payload),
                headers: formData ? {} : { 'Content-Type': 'application/json' }
            };

            const res = await fetch(`/api/nomina/novedades/${endpoint}`, fetchOptions);
            const data = await res.json();

            if (!res.ok || !data.success) throw new Error(data.message || 'Error al registrar.');

            const modalReg = document.getElementById('modalRegistrarNovedad');
            if (modalReg) bootstrap.Modal.getOrCreateInstance(modalReg).hide();
            mostrarToast('Novedad registrada correctamente', 'success');
            await cargarNovedades();

        } catch (error) {
            mostrarToast(error.message, 'error');
        } finally {
            btnGuardarNovedad.disabled = false;
            btnGuardarNovedad.innerHTML = `<i class="fas fa-save"></i> Registrar novedad`;
        }
    }

    /* ========================================================
       DRAG & DROP DE SOPORTES
       ======================================================== */
    function configurarDragAndDrop() {
        if (!zonaDragDropSoporte || !soporteNovedad) return;

        zonaDragDropSoporte.addEventListener('click', () => soporteNovedad.click());
        zonaDragDropSoporte.addEventListener('dragover', (e) => { e.preventDefault(); zonaDragDropSoporte.classList.add('arrastrando'); });
        zonaDragDropSoporte.addEventListener('dragleave', () => zonaDragDropSoporte.classList.remove('arrastrando'));
        zonaDragDropSoporte.addEventListener('drop', (e) => {
            e.preventDefault(); 
            zonaDragDropSoporte.classList.remove('arrastrando');
            if (e.dataTransfer.files.length > 0) {
                try {
                    const dt = new DataTransfer();
                    for (const f of e.dataTransfer.files) dt.items.add(f);
                    soporteNovedad.files = dt.files;
                    actualizarPrevisualizacion();
                } catch (err) {
                    console.warn('No se pudo asignar archivo:', err);
                    mostrarToast('Tu navegador no soporta arrastrar archivos. Usa el botón de seleccionar.', 'warning');
                }
            }
        });

        soporteNovedad.addEventListener('change', actualizarPrevisualizacion);
        if (btnQuitarSoporte) btnQuitarSoporte.addEventListener('click', () => { soporteNovedad.value = ''; actualizarPrevisualizacion(); });
    }

    function actualizarPrevisualizacion() {
        const f = soporteNovedad?.files?.[0];
        if (!f) { if (previsualizacionSoporte) previsualizacionSoporte.style.display = 'none'; return; }
        
        if (f.size > 5 * 1024 * 1024) {
            mostrarToast('El archivo supera el límite de 5 MB.', 'error');
            soporteNovedad.value = ''; 
            if (previsualizacionSoporte) previsualizacionSoporte.style.display = 'none'; 
            return;
        }

        if (soporteNombreArchivo) soporteNombreArchivo.textContent = f.name;
        if (soporteTamanoArchivo) soporteTamanoArchivo.textContent = (f.size / 1024 / 1024).toFixed(2) + ' MB';
        if (previsualizacionSoporte) previsualizacionSoporte.style.display = 'flex';
    }

    function limpiarFormularioNovedad() {
        if (registroTipoNovedad) registroTipoNovedad.value = '';
        if (informacionTipoNovedad) informacionTipoNovedad.style.display = 'none';
        if (formularioNovedadDinamico) formularioNovedadDinamico.style.display = 'none';
        if (seccionSoporteNovedad) seccionSoporteNovedad.style.display = 'none';
        if (camposNovedad) camposNovedad.innerHTML = '';
        if (soporteNovedad) soporteNovedad.value = '';
        if (previsualizacionSoporte) previsualizacionSoporte.style.display = 'none';
        if (btnGuardarNovedad) btnGuardarNovedad.disabled = true;
    }

    /* ========================================================
       CIERRE DE PERÍODO
       ======================================================== */
    async function abrirCierrePeriodo() {
        const modalElement = document.getElementById('modalCierrePeriodo');
        const body = document.getElementById('cierrePeriodoBody');
        const periodo = filtroMes?.value || new Date().toISOString().slice(0, 7);

        if (!modalElement || !body) return;

        body.innerHTML = `<div class="text-center py-4"><i class="fas fa-spinner fa-spin fa-2x text-primary"></i><p class="mt-2">Validando pendientes...</p></div>`;
        
        const modal = bootstrap.Modal.getOrCreateInstance(modalElement);
        modal.show();

        try {
            const res = await fetch('/api/nomina/novedades/cierre-periodo/validar', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ periodo })
            });
            const data = await res.json();

            if (!res.ok || !data.success) throw new Error(data.message);

            const btnConfirmar = document.getElementById('btnConfirmarCierrePeriodo');
            
            if (btnConfirmar) btnConfirmar.onclick = null;

            if (data.pendientes && data.pendientes.length > 0) {
                body.innerHTML = `
                    <div class="alert alert-danger">
                        <h6><i class="fas fa-triangle-exclamation"></i> No se puede cerrar el período ${periodo}</h6>
                        <p class="mb-0">Existen ${data.pendientes.length} novedades pendientes de aprobación. Debes resolverlas antes de cerrar.</p>
                    </div>
                `;
                if (btnConfirmar) btnConfirmar.disabled = true;
            } else {
                body.innerHTML = `
                    <div class="alert alert-success">
                        <h6><i class="fas fa-circle-check"></i> Todo listo para cerrar</h6>
                        <p class="mb-0">No hay novedades pendientes para el período ${periodo}. Al cerrar, las aprobadas pasarán a estado PROCESADA.</p>
                    </div>
                `;
                if (btnConfirmar) {
                    btnConfirmar.disabled = false;
                    btnConfirmar.onclick = () => ejecutarCierrePeriodo(periodo);
                }
            }

        } catch (error) {
            body.innerHTML = `<div class="alert alert-danger">Error: ${escaparHTML(error.message)}</div>`;
        }
    }

    async function ejecutarCierrePeriodo(periodo) {
        const btn = document.getElementById('btnConfirmarCierrePeriodo');
        
        try {
            if (btn) {
                btn.disabled = true;
                btn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Cerrando...`;
            }

            const res = await fetch('/api/nomina/novedades/cierre-periodo', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ periodo })
            });
            const data = await res.json();

            if (!res.ok || !data.success) throw new Error(data.message);

            const modalCierre = document.getElementById('modalCierrePeriodo');
            if (modalCierre) bootstrap.Modal.getOrCreateInstance(modalCierre).hide();
            mostrarToast(`Período ${periodo} cerrado exitosamente`, 'success');
            await cargarNovedades();

        } catch (error) {
            mostrarToast(error.message, 'error');
            if (btn) {
                btn.disabled = false;
                btn.innerHTML = `<i class="fas fa-lock"></i> Cerrar período`;
            }
        }
    }

    /* ========================================================
       EXPORTACIÓN A CSV 
       ======================================================== */
    function exportarCSV() {
        if (!estadoApp.novedadesFiltradas.length) {
            mostrarToast('No hay datos para exportar', 'warning');
            return;
        }

        const columnas = [
            'Empleado', 'Documento', 'Tipo de Novedad', 'Fecha Inicio', 'Fecha Fin', 'Cantidad', 'Estado', 'Observación'
        ];

        const tiposPermitidos = ['HORAS EXTRA', 'RECARGO', 'AUSENCIA', 'INCAPACIDAD', 'LICENCIA', 'VACACIONES'];
        
        const novedadesParaExportar = estadoApp.novedadesFiltradas.filter(n => {
            const tipo = obtenerTipo(n).toUpperCase();
            return tiposPermitidos.some(permitido => tipo.includes(permitido));
        });

        if (!novedadesParaExportar.length) {
            mostrarToast('No hay novedades de los tipos exportables (Horas Extra, Recargo, Ausencia, Incapacidad, Licencia, Vacaciones).', 'warning');
            return;
        }

        const filas = novedadesParaExportar.map(n => [
            obtenerEmpleado(n),
            n.numero_documento || '',
            obtenerTipo(n),
            n.fecha_inicio || '',
            n.fecha_fin || '',
            obtenerCantidad(n),
            obtenerEstado(n),
            n.observacion || n.motivo || ''
        ]);

        let csvContent = "\uFEFF"; 
        csvContent += columnas.join(";") + "\n"; 

        filas.forEach(row => {
            const filaLimpia = row.map(cell => `"${String(cell).replace(/"/g, '""')}"`);
            csvContent += filaLimpia.join(";") + "\n";
        });

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Reporte_Nomina_${new Date().getTime()}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        mostrarToast('Archivo exportado correctamente', 'success');
    }

    /* ========================================================
       SISTEMA DE TOASTS Y MODAL DE CONFIRMACIÓN
       ======================================================== */
    function mostrarToast(mensaje, tipo = 'success') {
        if (!contenedorToasts) return;

        let icono = 'fa-check-circle';
        if (tipo === 'error') icono = 'fa-times-circle';
        if (tipo === 'warning') icono = 'fa-exclamation-triangle';
        if (tipo === 'info') icono = 'fa-info-circle';

        const toast = document.createElement('div');
        toast.className = `toast-novedad ${tipo}`;
        toast.innerHTML = `
            <div class="toast-novedad-icono"><i class="fas ${icono}"></i></div>
            <div class="toast-novedad-contenido">${escaparHTML(mensaje)}</div>
            <button class="toast-novedad-cerrar">&times;</button>
        `;

        contenedorToasts.appendChild(toast);
        
        requestAnimationFrame(() => toast.classList.add('mostrar'));

        const cerrar = () => {
            toast.classList.remove('mostrar');
            setTimeout(() => toast.remove(), 300);
        };

        toast.querySelector('.toast-novedad-cerrar').onclick = cerrar;
        setTimeout(cerrar, 4000);
    }

    function mostrarConfirmacion(mensaje, callback) {
        if (!modalConfirmacion) return;
        modalConfirmacionMensaje.textContent = mensaje;
        estadoApp.confirmCallback = callback;
        
        const modal = bootstrap.Modal.getOrCreateInstance(modalConfirmacion);
        modal.show();
    }

    /* ========================================================
       UTILIDADES DE FORMATO Y SEGURIDAD
       ======================================================== */
    function mostrarCargando() {
        if (tablaSkeleton) tablaSkeleton.style.display = 'flex';
        if (tablaNovedades) tablaNovedades.innerHTML = '';
        if (estadoVacio) estadoVacio.style.display = 'none';
    }

    function ocultarCargando() {
        if (tablaSkeleton) tablaSkeleton.style.display = 'none';
    }

    function mostrarError(msg) {
        ocultarCargando();
        if (tablaNovedades) tablaNovedades.innerHTML = `<tr><td colspan="7" class="text-center text-danger py-4"><i class="fas fa-triangle-exclamation"></i> ${escaparHTML(msg)}</td></tr>`;
    }

    function crearBadgeEstado(estado) {
        const map = {
            PENDIENTE: { clase: 'pendiente', texto: 'Pendiente', icono: 'fa-clock' },
            APROBADA: { clase: 'aprobada', texto: 'Aprobada', icono: 'fa-circle-check' },
            RECHAZADA: { clase: 'rechazada', texto: 'Rechazada', icono: 'fa-circle-xmark' },
            ANULADA: { clase: 'anulada', texto: 'Anulada', icono: 'fa-ban' }
        };
        const cfg = map[estado] || { clase: 'anulada', texto: estado || 'Sin estado', icono: 'fa-question' };
        return `<span class="novedad-estado ${cfg.clase}"><i class="fas ${cfg.icono}"></i> ${cfg.texto}</span>`;
    }

    function obtenerEmpleado(n) { return n.empleado_nombre || n.empleado || 'Sin empleado'; }
    function obtenerTipo(n) { return n.tipo_novedad || n.tipo || ''; }
    function obtenerEstado(n) { return String(n.estado || 'PENDIENTE').toUpperCase(); }
    function obtenerFecha(n) { return n.fecha_inicio || n.fecha || ''; }
    function obtenerCantidad(n) { return n.cantidad_dias ? n.cantidad_dias + ' días' : (n.cantidad_horas ? n.cantidad_horas + ' hrs' : '-'); }
    function obtenerFechaRegistro(n) { return n.fecha_creacion || n.created_at || ''; }

    function formatearFecha(f) {
        if (!f) return '-';
        const str = String(f);
        const d = new Date(str.length === 10 ? str + 'T00:00:00' : str);
        if (isNaN(d.getTime())) return str;
        
        return d.toLocaleDateString('es-CO', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        }).replace('.', '');
    }

    function formatearFechaHora(f) {
        if (!f) return '-';
        const str = String(f);
        const d = new Date(str.length === 10 ? str + 'T00:00:00' : str);
        if (isNaN(d.getTime())) return str;
        
        return d.toLocaleString('es-CO', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        }).replace('.', '').replace(',', ' ·');
    }

    function formatearTexto(t) {
        if (!t) return '';
        return String(t).toLowerCase().replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    }

    function escaparHTML(val) {
        return String(val ?? '').replace(/[&<>"']/g, c => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
        }[c]));
    }

    function debounce(fn, wait) {
        let timeout;
        return function(...args) { clearTimeout(timeout); timeout = setTimeout(() => fn(...args), wait); };
    }

});