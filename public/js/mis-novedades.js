/* ============================================================
   MIS NOVEDADES - USUARIO NORMAL
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
    console.log('📋 Módulo de Mis Novedades iniciado (Premium)');

    // --- Variables de Estado ---
    let _guardando = false;
    
    const estadoApp = {
        novedades: [],
        novedadesFiltradas: [],
        paginaActual: 1,
        tamanoPagina: 10
    };

    // --- Referencias al DOM ---
    const DOM = {
        btnRegistrar: document.getElementById('btnRegistrarNovedad'),
        btnRefrescar: document.getElementById('btnRefrescarNovedades'),
        btnExportar: document.getElementById('btnExportarNovedades'),
        btnLimpiar: document.getElementById('btnLimpiarFiltros'),
        
        buscar: document.getElementById('buscarNovedad'),
        filtroTipo: document.getElementById('filtroTipo'),
        filtroEstado: document.getElementById('filtroEstado'),
        filtroMes: document.getElementById('filtroMes'),
        
        tabla: document.getElementById('tablaNovedades'),
        estadoVacio: document.getElementById('estadoVacio'),
        skeleton: document.getElementById('tablaSkeleton'),
        btnPrev: document.getElementById('btnPaginaAnterior'),
        btnNext: document.getElementById('btnPaginaSiguiente'),
        infoPag: document.getElementById('infoPaginacion'),

        // Modal
        modalRegistrar: document.getElementById('modalRegistrarNovedad'),
        selectTipo: document.getElementById('registroTipoNovedad'),
        formDinamico: document.getElementById('formularioNovedadDinamico'),
        campos: document.getElementById('camposNovedad'),
        seccionSoporte: document.getElementById('seccionSoporteNovedad'),
        inputSoporte: document.getElementById('soporteNovedad'),
        avisoAprobacion: document.getElementById('avisoAprobacionNovedad'),
        btnGuardar: document.getElementById('btnGuardarNovedad'),
        divError: document.getElementById('errorRegistroNovedad'),
        previsualizacionSoporte: document.getElementById('previsualizacionSoporte'),
        
        toasts: document.getElementById('contenedorToasts')
    };

    // --- Inicialización ---
    inicializar();

    async function inicializar() {
        // FIX #6: guard bootstrap
        if (typeof bootstrap !== 'undefined') {
            document.querySelectorAll('.modal').forEach((modal) => {
                modal.addEventListener('hide.bs.modal', () => {
                    if (document.activeElement && modal.contains(document.activeElement)) {
                        document.activeElement.blur();
                    }
                });
            });
        }

        establecerMesActual();
        configurarEventos();
        await cargarNovedades();
    }

    // --- Configuración de Eventos ---
    function configurarEventos() {
        if (DOM.btnRefrescar) DOM.btnRefrescar.addEventListener('click', () => { mostrarToast('Actualizando datos...', 'info'); cargarNovedades(); });
        if (DOM.btnExportar) DOM.btnExportar.addEventListener('click', exportarCSV);
        if (DOM.btnRegistrar) DOM.btnRegistrar.addEventListener('click', abrirRegistroNovedad);

        if (DOM.buscar) DOM.buscar.addEventListener('input', debounce(aplicarFiltros, 300));
        if (DOM.filtroTipo) DOM.filtroTipo.addEventListener('change', aplicarFiltros);
        if (DOM.filtroEstado) DOM.filtroEstado.addEventListener('change', aplicarFiltros);
        if (DOM.filtroMes) DOM.filtroMes.addEventListener('change', aplicarFiltros);
        if (DOM.btnLimpiar) DOM.btnLimpiar.addEventListener('click', limpiarFiltros);
        
        if (DOM.btnPrev) DOM.btnPrev.addEventListener('click', () => { if (estadoApp.paginaActual > 1) { estadoApp.paginaActual--; renderizarTabla(); } });
        if (DOM.btnNext) DOM.btnNext.addEventListener('click', () => { const total = Math.ceil(estadoApp.novedadesFiltradas.length / estadoApp.tamanoPagina); if (estadoApp.paginaActual < total) { estadoApp.paginaActual++; renderizarTabla(); } });

        if (DOM.selectTipo) DOM.selectTipo.addEventListener('change', seleccionarTipoNovedad);
        if (DOM.btnGuardar) DOM.btnGuardar.addEventListener('click', guardarNovedad);

        // 🔥 EVENTO PARA ABRIR EL HISTORIAL (Compatible con Admin y Auxiliar)
        const btnVerHistorial = document.getElementById('btnVerHistorial');
        const kpiHistorialCard = document.querySelector('.historial-kpi-clickable');
        
        const abrirModalHistorial = () => {
            if (typeof bootstrap === 'undefined') return;
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
       LÓGICA DE TABLA Y FILTROS
       ======================================================== */
    async function cargarNovedades() {
        try {
            mostrarCargando();
            // FIX #8: credentials
            const respuesta = await fetch('/api/nomina/novedades', { credentials: 'include' });
            if (!respuesta.ok) throw new Error('Error al consultar la API.');

            const resultado = await respuesta.json();
            estadoApp.novedades = Array.isArray(resultado) ? resultado : (resultado.novedades || resultado.data || []);
            
            cargarTiposFiltro();
            actualizarKPIs();
            aplicarFiltros();
        } catch (error) {
            console.error('❌ Error cargando novedades:', error);
            mostrarError('No fue posible conectar con el servidor.');
        }
    }

    function actualizarKPIs() {
        if (document.getElementById('kpiPendientes')) document.getElementById('kpiPendientes').textContent = estadoApp.novedades.filter(n => obtenerEstado(n) === 'PENDIENTE').length;
        if (document.getElementById('kpiAprobadas')) document.getElementById('kpiAprobadas').textContent = estadoApp.novedades.filter(n => obtenerEstado(n) === 'APROBADA').length;
        if (document.getElementById('kpiRechazadas')) document.getElementById('kpiRechazadas').textContent = estadoApp.novedades.filter(n => obtenerEstado(n) === 'RECHAZADA').length;
        
        // FIX #14: credentials
        fetch('/api/nomina/novedades/kpis', { credentials: 'include' })
            .then(res => res.ok ? res.json() : null)
            .then(data => {
                if (data && data.success && data.kpis && document.getElementById('kpiHistorial')) {
                    document.getElementById('kpiHistorial').textContent = data.kpis.historial;
                }
            })
            .catch(() => {});
    }

    function cargarTiposFiltro() {
        if (!DOM.filtroTipo) return;
        // FIX #8: conservar valor actual
        const valorActual = DOM.filtroTipo.value;
        const tipos = [...new Set(estadoApp.novedades.map(n => obtenerTipo(n)).filter(Boolean))];
        DOM.filtroTipo.innerHTML = `<option value="">Todos los tipos</option>`;
        tipos.sort().forEach(tipo => {
            const opt = document.createElement('option');
            opt.value = tipo; opt.textContent = formatearTexto(tipo);
            DOM.filtroTipo.appendChild(opt);
        });
        DOM.filtroTipo.value = valorActual;
    }

    function aplicarFiltros() {
        const texto = (DOM.buscar?.value || '').trim().toLowerCase();
        const tipo = DOM.filtroTipo?.value || '';
        const estado = DOM.filtroEstado?.value || '';
        const mes = DOM.filtroMes?.value || '';

        estadoApp.novedadesFiltradas = estadoApp.novedades.filter(n => {
            // FIX #7: buscar por tipo, doc y empleado
            if (texto) {
                const tipoNom = String(obtenerTipo(n)).toLowerCase();
                const doc = String(n.numero_documento || '').toLowerCase();
                const emp = String(n.empleado_nombre || '').toLowerCase();
                if (!tipoNom.includes(texto) && !doc.includes(texto) && !emp.includes(texto)) return false;
            }
            if (tipo && obtenerTipo(n) !== tipo) return false;
            if (estado && obtenerEstado(n) !== estado) return false;
            if (mes && !String(obtenerFecha(n)).startsWith(mes)) return false;
            return true;
        });

        estadoApp.paginaActual = 1;
        renderizarTabla();
    }

    function limpiarFiltros() {
        if (DOM.buscar) DOM.buscar.value = '';
        if (DOM.filtroTipo) DOM.filtroTipo.value = '';
        if (DOM.filtroEstado) DOM.filtroEstado.value = '';
        if (DOM.filtroMes) DOM.filtroMes.value = '';
        aplicarFiltros();
    }

    function establecerMesActual() {
        if (!DOM.filtroMes) return;
        DOM.filtroMes.value = '';
    }

    function renderizarTabla() {
        if (!DOM.tabla) return;
        ocultarCargando();

        const total = estadoApp.novedadesFiltradas.length;
        const inicio = (estadoApp.paginaActual - 1) * estadoApp.tamanoPagina;
        const novedadesPagina = estadoApp.novedadesFiltradas.slice(inicio, inicio + estadoApp.tamanoPagina);

        if (total === 0) {
            DOM.tabla.innerHTML = '';
            if (DOM.estadoVacio) DOM.estadoVacio.style.display = 'flex';
            renderizarPaginacion();
            return;
        }

        if (DOM.estadoVacio) DOM.estadoVacio.style.display = 'none';
        DOM.tabla.innerHTML = '';
        
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
                    <span style="display: inline-flex; align-items: center; gap: 6px; padding: 5px 12px; border-radius: 20px; font-size: 12px; font-weight: 700; background-color: ${colorBg}; color: ${colorText};">
                        <i class="fas ${icono}"></i> ${escaparHTML(formatearTexto(obtenerTipo(novedad)))}
                    </span>
                </td>
                <td>${formatearFecha(obtenerFecha(novedad))}</td>
                <td>${escaparHTML(obtenerCantidad(novedad))}</td>
                <td>${crearBadgeEstado(obtenerEstado(novedad))}</td>
                <td>${formatearFechaHora(obtenerFechaRegistro(novedad))}</td>
                <td>
                    <div class="novedad-acciones">
                        <button type="button" class="novedad-accion-btn detalle btn-ver-novedad" data-id="${novedad.id}" title="Ver detalle">
                            <i class="fas fa-eye"></i>
                        </button>
                    </div>
                </td>
            `;
            DOM.tabla.appendChild(tr);
        });

        document.querySelectorAll('.btn-ver-novedad').forEach(btn => {
            btn.addEventListener('click', () => verNovedad(btn.dataset.id));
        });

        renderizarPaginacion();
    }

    function renderizarPaginacion() {
        const totalPaginas = Math.max(1, Math.ceil(estadoApp.novedadesFiltradas.length / estadoApp.tamanoPagina));
        if (DOM.infoPag) DOM.infoPag.textContent = `Página ${estadoApp.paginaActual} de ${totalPaginas}`;
        if (DOM.btnPrev) DOM.btnPrev.disabled = estadoApp.paginaActual <= 1;
        if (DOM.btnNext) DOM.btnNext.disabled = estadoApp.paginaActual >= totalPaginas;
    }

    /* ========================================================
       LÓGICA DE REGISTRO
       ======================================================== */
    
    async function abrirRegistroNovedad() {
        if (!DOM.modalRegistrar || typeof bootstrap === 'undefined') return;
        limpiarFormularioNovedad();
        // FIX #6: abrir modal inmediatamente, cargar tipos después
        bootstrap.Modal.getOrCreateInstance(DOM.modalRegistrar).show();
        await cargarTiposRegistro();
    }

    async function cargarTiposRegistro() {
        if (!DOM.selectTipo) return;
        try {
            // FIX #8: credentials
            const res = await fetch('/api/nomina/novedades/tipos', { credentials: 'include' });
            const data = await res.json();
            if (!res.ok || !data.success) throw new Error('Error al cargar tipos');
            
            DOM.selectTipo.innerHTML = `<option value="">Selecciona un tipo de novedad</option>`;
            data.tipos.forEach(t => {
                const opt = document.createElement('option');
                opt.value = t.id;
                opt.textContent = `${t.nombre} — ${t.categoria}`;
                opt.dataset.nombre = t.nombre;
                opt.dataset.codigo = t.codigo || '';
                opt.dataset.categoria = t.categoria || '';
                opt.dataset.descripcion = t.descripcion || '';
                opt.dataset.requiereSoporte = t.requiere_soporte;
                opt.dataset.requiereAprobacion = t.requiere_aprobacion;
                DOM.selectTipo.appendChild(opt);
            });
        } catch (error) { mostrarToast(error.message, 'error'); }
    }

    async function seleccionarTipoNovedad() {
        if (!DOM.selectTipo) return;
        const opt = DOM.selectTipo.selectedOptions[0];
        
        if (DOM.divError) DOM.divError.style.display = 'none';
        if (DOM.campos) DOM.campos.innerHTML = '';
        // FIX #17: limpiar soporte al cambiar tipo
        if (DOM.inputSoporte) DOM.inputSoporte.value = '';
        if (DOM.previsualizacionSoporte) DOM.previsualizacionSoporte.style.display = 'none';

        if (!opt || !opt.value) {
            if (DOM.formDinamico) DOM.formDinamico.style.display = 'none';
            if (DOM.seccionSoporte) DOM.seccionSoporte.style.display = 'none';
            if (DOM.avisoAprobacion) DOM.avisoAprobacion.style.display = 'none';
            if (DOM.btnGuardar) DOM.btnGuardar.disabled = true;
            return;
        }

        const codigo = (opt.dataset.codigo || '').toUpperCase();
        const categoria = (opt.dataset.categoria || '').toUpperCase();
        const nombre = (opt.dataset.nombre || '').toLowerCase();

        if (DOM.formDinamico) DOM.formDinamico.style.display = 'block';
        // FIX #7: soportar "1"/"true" y "0"/"false"
        const reqSoporte = opt.dataset.requiereSoporte === '1' || opt.dataset.requiereSoporte === 'true';
        const reqAprob   = opt.dataset.requiereAprobacion === '1' || opt.dataset.requiereAprobacion === 'true';
        if (DOM.seccionSoporte) DOM.seccionSoporte.style.display = reqSoporte ? 'block' : 'none';
        if (DOM.avisoAprobacion) DOM.avisoAprobacion.style.display = reqAprob ? 'flex' : 'none';
        if (DOM.btnGuardar) DOM.btnGuardar.disabled = false;

        if (!DOM.campos) return;

        // --- AUSENCIA ---
        if (categoria.includes('ASISTENCIA') || nombre.includes('ausencia')) {
            DOM.campos.innerHTML = `
                <div class="row g-3">
                    <div class="col-md-6">
                        <label class="form-label">Tipo de ausencia *</label>
                        <select id="tipoAusencia" class="form-select"><option value="JUSTIFICADA">Justificada</option><option value="INJUSTIFICADA">Injustificada</option></select>
                    </div>
                    <div class="col-md-3"><label class="form-label">Fecha inicio *</label><input type="date" id="fechaInicioAusencia" class="form-control"></div>
                    <div class="col-md-3"><label class="form-label">Fecha fin *</label><input type="date" id="fechaFinAusencia" class="form-control"></div>
                    <div class="col-md-4"><label class="form-label">Días</label><input type="number" id="cantidadDiasAusencia" class="form-control" readonly></div>
                    <div class="col-md-8"><label class="form-label">Motivo *</label><textarea id="motivoAusencia" class="form-control" rows="2"></textarea></div>
                </div>
            `;
            configurarCalculoFechas('fechaInicioAusencia', 'fechaFinAusencia', 'cantidadDiasAusencia');
            return;
        }

        // --- INCAPACIDAD ---
        if (codigo.includes('SALUD') || nombre.includes('incapacidad')) {
            DOM.campos.innerHTML = `
                <div class="row g-3">
                    <div class="col-md-6">
                        <label class="form-label">Tipo de incapacidad *</label>
                        <select id="tipoIncapacidad" class="form-select"><option value="ENFERMEDAD_GENERAL">Enfermedad general</option><option value="ACCIDENTE_TRABAJO">Accidente de trabajo</option></select>
                    </div>
                    <div class="col-md-3"><label class="form-label">Fecha inicio *</label><input type="date" id="fechaInicioIncapacidad" class="form-control"></div>
                    <div class="col-md-3"><label class="form-label">Fecha fin *</label><input type="date" id="fechaFinIncapacidad" class="form-control"></div>
                    <div class="col-md-4"><label class="form-label">Días</label><input type="number" id="cantidadDiasIncapacidad" class="form-control" readonly></div>
                    <div class="col-md-8"><label class="form-label">Observación</label><textarea id="observacionIncapacidad" class="form-control" rows="2"></textarea></div>
                </div>
            `;
            configurarCalculoFechas('fechaInicioIncapacidad', 'fechaFinIncapacidad', 'cantidadDiasIncapacidad');
            return;
        }

        // --- PERMISO ---
        if (codigo.includes('PERMISO') || nombre.includes('permiso')) {
            DOM.campos.innerHTML = `
                <div class="row g-3">
                    <div class="col-md-6">
                        <label class="form-label">Tipo de permiso *</label>
                        <select id="tipoPermiso" class="form-select"><option value="REMUNERADO">Remunerado</option><option value="NO_REMUNERADO">No remunerado</option><option value="COMPENSATORIO">Compensatorio</option></select>
                    </div>
                    <div class="col-md-6"><label class="form-label">Fecha *</label><input type="date" id="fechaPermiso" class="form-control"></div>
                    <div class="col-md-4"><label class="form-label">Hora inicio *</label><input type="time" id="horaInicioPermiso" class="form-control"></div>
                    <div class="col-md-4"><label class="form-label">Hora fin *</label><input type="time" id="horaFinPermiso" class="form-control"></div>
                    <div class="col-md-4"><label class="form-label">Horas totales</label><input type="number" id="cantidadHorasPermiso" class="form-control" readonly></div>
                    <div class="col-12"><label class="form-label">Motivo *</label><textarea id="motivoPermiso" class="form-control" rows="2"></textarea></div>
                </div>
            `;
            configurarCalculoHoras('horaInicioPermiso', 'horaFinPermiso', 'cantidadHorasPermiso');
            return;
        }

        // 🔥 --- LICENCIA / TIEMPO ---
        if (codigo.includes('LICENCIA') || nombre.includes('licencia')) {
            DOM.campos.innerHTML = `
                <div class="row g-3">
                    <div class="col-md-12">
                        <label class="form-label">Tipo de licencia / permiso *</label>
                        <select id="tipoLicencia" class="form-select">
                            <optgroup label="Salud y Familia">
                                <option value="CITA_MEDICA">Citas médicas y salud (Requiere soporte EPS)</option>
                                <option value="CALAMIDAD">Calamidad doméstica grave</option>
                                <option value="LUTO">Licencia por luto (5 días hábiles)</option>
                                <option value="MATERNIDAD">Licencia de maternidad (18 semanas)</option>
                                <option value="PATERNIDAD">Licencia de paternidad (2 semanas)</option>
                            </optgroup>
                            <optgroup label="Obligaciones Legales y Ciudadanas">
                                <option value="VOTO">Ejercicio del voto (Media jornada)</option>
                                <option value="JURADO">Jurado de votación (1 día)</option>
                                <option value="CITA_JUDICIAL">Citas judiciales o administrativas</option>
                                <option value="COLEGIO">Obligaciones escolares (Acudiente)</option>
                            </optgroup>
                            <optgroup label="Otros Permisos">
                                <option value="MATRIMONIO">Matrimonio (3 días)</option>
                                <option value="BICICLETA">Uso de la bicicleta (1 día por 6 meses)</option>
                                <option value="SINDICATO">Comisiones sindicales / Entierro de compañero</option>
                            </optgroup>
                        </select>
                    </div>
                    <div class="col-md-4"><label class="form-label">Fecha inicio *</label><input type="date" id="fechaLicenciaInicio" class="form-control"></div>
                    <div class="col-md-4"><label class="form-label">Fecha fin *</label><input type="date" id="fechaLicenciaFin" class="form-control"></div>
                    <div class="col-md-4"><label class="form-label">Días calculados</label><input type="number" id="diasLicencia" class="form-control" readonly></div>
                    <div class="col-12"><label class="form-label">Motivo / Observación</label><textarea id="observacionLicencia" class="form-control" rows="2" placeholder="Explica brevemente el motivo..."></textarea></div>
                </div>
            `;
            configurarCalculoFechas('fechaLicenciaInicio', 'fechaLicenciaFin', 'diasLicencia');
            return;
        }

        // 🔥 --- VACACIONES ---
        if (codigo.includes('VACACION') || nombre.includes('vacacion')) {
            DOM.campos.innerHTML = `
                <div class="row g-3">
                    <div class="col-md-6"><label class="form-label">Fecha inicio *</label><input type="date" id="fechaInicioVacaciones" class="form-control"></div>
                    <div class="col-md-6"><label class="form-label">Fecha fin *</label><input type="date" id="fechaFinVacaciones" class="form-control"></div>
                    <div class="col-md-4"><label class="form-label">Días calculados</label><input type="number" id="diasVacaciones" class="form-control" readonly></div>
                    <div class="col-md-8"><label class="form-label">Observación</label><textarea id="observacionVacaciones" class="form-control" rows="2" placeholder="Periodo de vacaciones..."></textarea></div>
                </div>
            `;
            configurarCalculoFechas('fechaInicioVacaciones', 'fechaFinVacaciones', 'diasVacaciones');
            return;
        }

        // 🔥 --- HORAS EXTRA / RECARGOS ---
        if (codigo.includes('HORA') || codigo.includes('RECARGO') || nombre.includes('hora extra') || nombre.includes('recargo')) {
            DOM.campos.innerHTML = `
                <div class="row g-3">
                    <div class="col-md-6">
                        <label class="form-label">Tipo de hora / recargo *</label>
                        <select id="tipoHora" class="form-select"><option value="">Cargando...</option></select>
                    </div>
                    <div class="col-md-6"><label class="form-label">Fecha de trabajo *</label><input type="date" id="fechaTrabajo" class="form-control"></div>
                    <div class="col-md-4"><label class="form-label">Hora inicio *</label><input type="time" id="horaInicioExtra" class="form-control"></div>
                    <div class="col-md-4"><label class="form-label">Hora fin *</label><input type="time" id="horaFinExtra" class="form-control"></div>
                    <div class="col-md-4"><label class="form-label">Horas calculadas</label><input type="number" id="horasExtraCalculadas" class="form-control" readonly></div>
                    <div class="col-12"><label class="form-label">Observación</label><textarea id="observacionExtra" class="form-control" rows="2"></textarea></div>
                </div>
            `;
            (async () => {
                const sel = document.getElementById('tipoHora');
                if (!sel) return;
                try {
                    const [resHE, resRec] = await Promise.all([
                        fetch('/api/nomina/configuracion/horas-extra', { credentials: 'include' }),
                        fetch('/api/nomina/configuracion/recargos', { credentials: 'include' })
                    ]);
                    const dataHE = await resHE.json();
                    const dataRec = await resRec.json();
                    sel.innerHTML = '<option value="">Selecciona...</option>';
                    (dataHE.data || []).forEach(t => {
                        const o = document.createElement('option');
                        o.value = t.codigo || t.nombre;
                        o.textContent = `${t.nombre} (Hora extra)`;
                        sel.appendChild(o);
                    });
                    (dataRec.data || []).forEach(t => {
                        const o = document.createElement('option');
                        o.value = t.codigo || t.nombre;
                        o.textContent = `${t.nombre} (Recargo)`;
                        sel.appendChild(o);
                    });
                } catch (e) {
                    sel.innerHTML = '<option value="">Error al cargar</option>';
                }
            })();
            configurarCalculoHoras('horaInicioExtra', 'horaFinExtra', 'horasExtraCalculadas');
            return;
        }

        // 🔥 --- DESCUENTO ---
        if (codigo.includes('DESCUENTO') || categoria.includes('DESCUENTO') || nombre.includes('descuento')) {
            DOM.campos.innerHTML = `
                <div class="row g-3">
                    <div class="col-md-8"><label class="form-label">Concepto *</label><input type="text" id="conceptoDescuento" class="form-control" placeholder="Ej: Préstamo, sanción, etc."></div>
                    <div class="col-md-4"><label class="form-label">Valor *</label><input type="number" id="valorDescuento" class="form-control" min="0" step="0.01"></div>
                    <div class="col-12"><label class="form-label">Observación</label><textarea id="observacionDescuento" class="form-control" rows="2"></textarea></div>
                </div>
            `;
            return;
        }

        // 🔥 --- INGRESO ---
        if (codigo.includes('INGRESO') || categoria.includes('INGRESO') || nombre.includes('ingreso')) {
            DOM.campos.innerHTML = `
                <div class="row g-3">
                    <div class="col-md-8"><label class="form-label">Concepto *</label><input type="text" id="conceptoIngreso" class="form-control" placeholder="Ej: Bono, comisión, etc."></div>
                    <div class="col-md-4"><label class="form-label">Valor *</label><input type="number" id="valorIngreso" class="form-control" min="0" step="0.01"></div>
                    <div class="col-12"><label class="form-label">Observación</label><textarea id="observacionIngreso" class="form-control" rows="2"></textarea></div>
                </div>
            `;
            return;
        }

        // 🔥 --- PRÉSTAMO / ANTICIPO ---
        if (codigo.includes('PRESTAMO') || codigo.includes('PRÉSTAMO') || categoria.includes('PRESTAMO') || nombre.includes('préstamo') || nombre.includes('prestamo') || nombre.includes('anticipo')) {
            const esAnticipo = nombre.includes('anticipo');
            if (esAnticipo && DOM.avisoAprobacion) DOM.avisoAprobacion.style.display = 'none';

            DOM.campos.innerHTML = `
                <div class="row g-3">
                    <div class="${esAnticipo ? 'col-12' : 'col-md-6'}">
                        <label class="form-label">Monto solicitado *</label>
                        <input type="number" id="montoPrestamo" class="form-control" min="0" step="0.01" placeholder="0.00">
                    </div>
                    ${!esAnticipo ? `
                    <div class="col-md-6">
                        <label class="form-label">Número de cuotas *</label>
                        <input type="number" id="cuotasPrestamo" class="form-control" min="1" value="1">
                    </div>
                    ` : ''}
                    <div class="col-12">
                        <label class="form-label">Observación</label>
                        <textarea id="observacionPrestamo" class="form-control" rows="2"></textarea>
                    </div>
                </div>
            `;
            return;
        }

        DOM.campos.innerHTML = `<div class="alert alert-info">Formulario pendiente de configurar.</div>`;
    }

    // FIX #18: helper que resetea el campo si la fecha es inválida
    function configurarCalculoFechas(idIni, idFin, idDias) {
        const fIni = document.getElementById(idIni);
        const fFin = document.getElementById(idFin);
        const dias = document.getElementById(idDias);
        if (!fIni || !fFin || !dias) return;
        const calc = () => {
            if (!fIni.value || !fFin.value) { dias.value = ''; return; }
            // FIX #3: evitar desfase UTC
            const d1 = new Date(fIni.value + 'T00:00:00');
            const d2 = new Date(fFin.value + 'T00:00:00');
            if (d2 >= d1) dias.value = Math.floor((d2 - d1) / (1000 * 60 * 60 * 24)) + 1;
            else dias.value = '';
        };
        fIni.addEventListener('change', calc);
        fFin.addEventListener('change', calc);
    }

    function configurarCalculoHoras(idIni, idFin, idCant) {
        const hIni = document.getElementById(idIni);
        const hFin = document.getElementById(idFin);
        const cant = document.getElementById(idCant);
        if (!hIni || !hFin || !cant) return;
        const calc = () => {
            if (!hIni.value || !hFin.value) { cant.value = ''; return; }
            const [h1, m1] = hIni.value.split(':').map(Number);
            const [h2, m2] = hFin.value.split(':').map(Number);
            const diff = (h2 * 60 + m2) - (h1 * 60 + m1);
            if (diff > 0) cant.value = (diff / 60).toFixed(2);
            else cant.value = '';
        };
        hIni.addEventListener('change', calc);
        hFin.addEventListener('change', calc);
    }

    async function guardarNovedad() {
        if (_guardando) return; 
        if (!DOM.selectTipo) return;

        const opt = DOM.selectTipo.selectedOptions[0];
        if (!opt || !opt.value) return mostrarErrorModal('Selecciona un tipo de novedad.');

        const codigo = (opt.dataset.codigo || '').toUpperCase();
        const categoria = (opt.dataset.categoria || '').toUpperCase();
        const nombre = (opt.dataset.nombre || '').toLowerCase();
        const tipoNovedadId = opt.value;
        const archivo = DOM.inputSoporte?.files?.[0];

        if (DOM.divError) DOM.divError.style.display = 'none';

        try {
            _guardando = true;
            if (DOM.btnGuardar) {
                DOM.btnGuardar.disabled = true;
                DOM.btnGuardar.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Guardando...`;
            }

            let endpoint = '';
            let payload = null;
            let formData = null;

            if (codigo.includes('SALUD') || nombre.includes('incapacidad')) {
                const fIni = document.getElementById('fechaInicioIncapacidad').value;
                const fFin = document.getElementById('fechaFinIncapacidad').value;
                const dias = document.getElementById('cantidadDiasIncapacidad').value;
                if (!fIni || !fFin || !dias) return mostrarErrorModal('Completa las fechas.');
                if (!archivo) return mostrarErrorModal('Adjunta el soporte médico.');
                endpoint = 'incapacidad';
                formData = new FormData();
                formData.append('tipo_novedad_id', tipoNovedadId);
                formData.append('tipo_incapacidad', document.getElementById('tipoIncapacidad').value);
                formData.append('fecha_inicio', fIni);
                formData.append('fecha_fin', fFin);
                formData.append('cantidad_dias', dias);
                formData.append('observacion', document.getElementById('observacionIncapacidad').value || '');
                formData.append('soporte', archivo);
            }
            else if (categoria.includes('ASISTENCIA') || nombre.includes('ausencia')) {
                const fIni = document.getElementById('fechaInicioAusencia').value;
                const fFin = document.getElementById('fechaFinAusencia').value;
                const motivo = document.getElementById('motivoAusencia').value.trim();
                if (!fIni || !fFin) return mostrarErrorModal('Completa las fechas.');
                if (!motivo) return mostrarErrorModal('Escribe el motivo.');
                endpoint = 'ausencia';
                formData = new FormData();
                formData.append('tipo_novedad_id', tipoNovedadId);
                formData.append('tipo_ausencia', document.getElementById('tipoAusencia').value);
                formData.append('fecha_inicio', fIni);
                formData.append('fecha_fin', fFin);
                formData.append('cantidad_dias', document.getElementById('cantidadDiasAusencia').value);
                formData.append('motivo', motivo);
                if (archivo) formData.append('soporte', archivo);
            }
            else if (codigo.includes('PERMISO') || nombre.includes('permiso')) {
                const fecha = document.getElementById('fechaPermiso').value;
                const hIni = document.getElementById('horaInicioPermiso').value;
                const hFin = document.getElementById('horaFinPermiso').value;
                const motivo = document.getElementById('motivoPermiso').value.trim();
                if (!fecha || !hIni || !hFin) return mostrarErrorModal('Completa fecha y horas.');
                if (!motivo) return mostrarErrorModal('Escribe el motivo.');
                endpoint = 'permiso';
                payload = {
                    tipo_novedad_id: tipoNovedadId,
                    tipo_permiso: document.getElementById('tipoPermiso').value,
                    fecha_permiso: fecha,
                    hora_inicio: hIni,
                    hora_fin: hFin,
                    cantidad_horas: Number(document.getElementById('cantidadHorasPermiso').value),
                    motivo: motivo
                };
            }
            else if (codigo.includes('LICENCIA') || nombre.includes('licencia')) {
                const tipoLicencia = document.getElementById('tipoLicencia').value;
                const fIni = document.getElementById('fechaLicenciaInicio').value;
                const fFin = document.getElementById('fechaLicenciaFin').value;
                const dias = document.getElementById('diasLicencia').value;
                const obs = document.getElementById('observacionLicencia').value || '';
                if (!fIni || !fFin || !dias) return mostrarErrorModal('Completa las fechas.');
                endpoint = 'licencia';
                payload = {
                    tipo_novedad_id: tipoNovedadId,
                    tipo_licencia: tipoLicencia,
                    fecha_inicio: fIni,
                    fecha_fin: fFin,
                    cantidad_dias: Number(dias),
                    motivo: tipoLicencia, 
                    observacion: obs
                };
            }
            else if (codigo.includes('VACACION') || nombre.includes('vacacion')) {
                const fIni = document.getElementById('fechaInicioVacaciones').value;
                const fFin = document.getElementById('fechaFinVacaciones').value;
                const dias = document.getElementById('diasVacaciones').value;
                const obs = document.getElementById('observacionVacaciones').value || '';
                if (!fIni || !fFin || !dias) return mostrarErrorModal('Completa las fechas.');
                endpoint = 'vacaciones';
                payload = {
                    tipo_novedad_id: tipoNovedadId,
                    fecha_inicio: fIni,
                    fecha_fin: fFin,
                    cantidad_dias: Number(dias),
                    motivo: 'Vacaciones', 
                    observacion: obs
                };
            }
            else if (codigo.includes('HORA') || codigo.includes('RECARGO') || nombre.includes('hora extra') || nombre.includes('recargo')) {
                const tipoHora = document.getElementById('tipoHora').value;
                const fechaTrabajo = document.getElementById('fechaTrabajo').value;
                const hIni = document.getElementById('horaInicioExtra').value;
                const hFin = document.getElementById('horaFinExtra').value;
                const horas = document.getElementById('horasExtraCalculadas').value;
                const obs = document.getElementById('observacionExtra').value || '';
                if (!tipoHora) return mostrarErrorModal('Selecciona el tipo de hora.');
                if (!fechaTrabajo || !hIni || !hFin) return mostrarErrorModal('Completa fecha y horas.');
                if (!horas || Number(horas) <= 0) return mostrarErrorModal('Horas inválidas.');
                endpoint = 'horas-extra';
                payload = {
                    tipo_novedad_id: tipoNovedadId,
                    tipo_hora: tipoHora,
                    fecha_trabajo: fechaTrabajo,
                    hora_inicio: hIni,
                    hora_fin: hFin,
                    cantidad_horas: Number(horas),
                    observacion: obs
                };
            }
            else if (codigo.includes('DESCUENTO') || categoria.includes('DESCUENTO') || nombre.includes('descuento')) {
                const concepto = document.getElementById('conceptoDescuento').value.trim();
                const valor = document.getElementById('valorDescuento').value;
                const obs = document.getElementById('observacionDescuento').value || '';
                if (!concepto) return mostrarErrorModal('Escribe el concepto.');
                if (!valor || Number(valor) <= 0) return mostrarErrorModal('El valor debe ser mayor a cero.');
                endpoint = 'descuento';
                if (archivo) {
                    formData = new FormData();
                    formData.append('tipo_novedad_id', tipoNovedadId);
                    formData.append('concepto', concepto);
                    formData.append('valor', valor);
                    formData.append('observacion', obs);
                    formData.append('soporte', archivo);
                } else {
                    payload = { tipo_novedad_id: tipoNovedadId, concepto: concepto, valor: Number(valor), observacion: obs };
                }
            }
            else if (codigo.includes('INGRESO') || categoria.includes('INGRESO') || nombre.includes('ingreso')) {
                const concepto = document.getElementById('conceptoIngreso').value.trim();
                const valor = document.getElementById('valorIngreso').value;
                const obs = document.getElementById('observacionIngreso').value || '';
                if (!concepto) return mostrarErrorModal('Escribe el concepto.');
                if (!valor || Number(valor) <= 0) return mostrarErrorModal('El valor debe ser mayor a cero.');
                endpoint = 'ingreso';
                payload = { tipo_novedad_id: tipoNovedadId, concepto: concepto, valor: Number(valor), observacion: obs };
            }
            else if (codigo.includes('PRESTAMO') || codigo.includes('PRÉSTAMO') || categoria.includes('PRESTAMO') || nombre.includes('préstamo') || nombre.includes('prestamo') || nombre.includes('anticipo')) {
                const monto = document.getElementById('montoPrestamo').value;
                const esAnticipo = nombre.includes('anticipo');
                const cuotas = esAnticipo ? 1 : document.getElementById('cuotasPrestamo').value;
                const obs = document.getElementById('observacionPrestamo').value || '';
                if (!monto || Number(monto) <= 0) return mostrarErrorModal('El monto debe ser mayor a cero.');
                endpoint = 'prestamo';
                payload = { tipo_novedad_id: tipoNovedadId, monto: Number(monto), cuotas: Number(cuotas), observacion: obs };
            }
            else {
                return mostrarErrorModal('Este formulario aún no está configurado.');
            }

            // FIX #9: credentials
            const fetchOptions = {
                method: 'POST',
                credentials: 'include',
                body: formData ? formData : JSON.stringify(payload),
                headers: formData ? {} : { 'Content-Type': 'application/json' }
            };

            const res = await fetch(`/api/nomina/novedades/${endpoint}`, fetchOptions);
            const data = await res.json();

            if (!res.ok || !data.success) throw new Error(data.message || 'Error al registrar.');

            // FIX #2: getOrCreateInstance
            if (DOM.modalRegistrar && typeof bootstrap !== 'undefined') {
                bootstrap.Modal.getOrCreateInstance(DOM.modalRegistrar).hide();
            }
            mostrarToast('✅ Novedad registrada correctamente.', 'success');
            await cargarNovedades();

        } catch (error) {
            mostrarErrorModal(error.message);
            mostrarToast(error.message, 'error');
        } finally {
            _guardando = false;
            if (DOM.btnGuardar) {
                DOM.btnGuardar.disabled = false;
                DOM.btnGuardar.innerHTML = `<i class="fas fa-save"></i> Registrar`;
            }
        }
    }

    function mostrarErrorModal(mensaje) {
        if (DOM.divError) {
            DOM.divError.textContent = mensaje;
            DOM.divError.style.display = 'block';
            DOM.divError.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
        if (DOM.btnGuardar) {
            DOM.btnGuardar.disabled = false;
            DOM.btnGuardar.innerHTML = `<i class="fas fa-save"></i> Registrar`;
        }
        _guardando = false;
        return false;
    }

    function limpiarFormularioNovedad() {
        if (DOM.selectTipo) DOM.selectTipo.value = '';
        if (DOM.formDinamico) DOM.formDinamico.style.display = 'none';
        if (DOM.seccionSoporte) DOM.seccionSoporte.style.display = 'none';
        if (DOM.campos) DOM.campos.innerHTML = '';
        if (DOM.btnGuardar) DOM.btnGuardar.disabled = true;
        if (DOM.divError) DOM.divError.style.display = 'none';
        if (DOM.inputSoporte) DOM.inputSoporte.value = '';
        if (DOM.previsualizacionSoporte) DOM.previsualizacionSoporte.style.display = 'none';
    }

    async function verNovedad(id) {
        const modalElement = document.getElementById('modalDetalleNovedad');
        if (!modalElement || typeof bootstrap === 'undefined') return;

        // FIX #16: guards de elementos internos
        const elTipo = document.getElementById('detalleTipoNovedad');
        const elCont = document.getElementById('detalleContenido');
        const elBtn  = document.getElementById('detalleBtnSoporte');

        const modal = bootstrap.Modal.getOrCreateInstance(modalElement);
        if (elTipo) elTipo.textContent = "Cargando...";
        if (elCont) elCont.innerHTML = `<div class="col-12 text-center py-4"><i class="fas fa-spinner fa-spin fa-2x text-success"></i></div>`;
        if (elBtn)  elBtn.style.display = 'none';
        modal.show();

        try {
            // FIX #8: credentials
            const res = await fetch(`/api/nomina/novedades/${id}`, { credentials: 'include' });
            const data = await res.json();
            if (!res.ok || !data.success) throw new Error('Error al cargar');

            const n = data.novedad || {};
            if (elTipo) elTipo.textContent = n.tipo_novedad || 'Detalle';

            // FIX #1: cantidad 0 válida
            const cantTxt = (n.cantidad_dias != null && n.cantidad_dias !== '')
                ? n.cantidad_dias + ' días'
                : (n.cantidad_horas != null && n.cantidad_horas !== '')
                    ? n.cantidad_horas + ' horas'
                    : 'N/A';

            if (elCont) elCont.innerHTML = `
                <div class="col-md-6">
                    <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 14px;">
                        <small style="color: #64748b; font-weight: 700; text-transform: uppercase;">Estado</small>
                        <div style="margin-top: 4px;">${crearBadgeEstado(n.estado)}</div>
                    </div>
                </div>
                <div class="col-md-6">
                    <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 14px;">
                        <small style="color: #64748b; font-weight: 700; text-transform: uppercase;">Cantidad</small>
                        <div style="font-weight: 600; color: #334155;">${escaparHTML(cantTxt)}</div>
                    </div>
                </div>
                <div class="col-md-6">
                    <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 14px;">
                        <small style="color: #64748b; font-weight: 700; text-transform: uppercase;">Fechas</small>
                        <div style="font-weight: 600; color: #334155;">${formatearFecha(n.fecha_inicio)} al ${formatearFecha(n.fecha_fin)}</div>
                    </div>
                </div>
                <div class="col-md-6">
                    <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 14px;">
                        <small style="color: #64748b; font-weight: 700; text-transform: uppercase;">Registrada</small>
                        <div style="font-weight: 600; color: #334155;">${formatearFechaHora(n.fecha_creacion)}</div>
                    </div>
                </div>
                <div class="col-12">
                    <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 14px;">
                        <small style="color: #64748b; font-weight: 700; text-transform: uppercase;">Motivo / Observación</small>
                        <div style="color: #334155; margin-top: 4px;">${escaparHTML(n.motivo || 'Sin motivo')}<br><span style="color: #64748b; font-style: italic;">${escaparHTML(n.observacion || '')}</span></div>
                    </div>
                </div>
            `;

            // FIX #11: validar ruta del soporte
            if (data.soportes && data.soportes.length > 0 && elBtn) {
                const ruta = data.soportes[0].ruta_archivo || data.soportes[0].url || '';
                if (ruta) {
                    elBtn.href = ruta;
                    elBtn.style.display = 'inline-flex';
                    if (data.soportes.length > 1) {
                        elBtn.textContent = `Ver soporte (1 de ${data.soportes.length})`;
                    }
                }
            }

        } catch (error) {
            if (elCont) elCont.innerHTML = `<div class="col-12"><div class="alert alert-danger">Error al cargar detalle: ${escaparHTML(error.message)}</div></div>`;
        }
    }

    function exportarCSV() {
        if (!estadoApp.novedadesFiltradas.length) return mostrarToast('No hay datos para exportar', 'warning');
        // FIX #4: escapar comillas internas
        const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
        let csv = "Tipo,Fecha,Cantidad,Estado\n";
        estadoApp.novedadesFiltradas.forEach(n => {
            csv += [esc(obtenerTipo(n)), esc(obtenerFecha(n)), esc(obtenerCantidad(n)), esc(obtenerEstado(n))].join(',') + '\n';
        });
        const blob = new Blob(["\uFEFF" + csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = `mis_novedades_${new Date().getTime()}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        // FIX #10: revocar URL
        URL.revokeObjectURL(url);
        mostrarToast('Archivo CSV descargado correctamente', 'success');
    }

    function mostrarCargando() { if (DOM.skeleton) DOM.skeleton.style.display = 'flex'; }
    function ocultarCargando() { if (DOM.skeleton) DOM.skeleton.style.display = 'none'; }
    // FIX #4: ocultar skeleton en error
    function mostrarError(msg) { 
        ocultarCargando();
        if (DOM.estadoVacio) DOM.estadoVacio.style.display = 'none';
        if (DOM.tabla) DOM.tabla.innerHTML = `<tr><td colspan="6" class="text-center text-danger py-4"><i class="fas fa-triangle-exclamation"></i> ${escaparHTML(msg)}</td></tr>`; 
    }
    
    function crearBadgeEstado(estado) {
        const map = {
            PENDIENTE: { c: 'pendiente', t: 'Pendiente', i: 'fa-clock' },
            APROBADA: { c: 'aprobada', t: 'Aprobada', i: 'fa-circle-check' },
            RECHAZADA: { c: 'rechazada', t: 'Rechazada', i: 'fa-circle-xmark' },
            ANULADA: { c: 'anulada', t: 'Anulada', i: 'fa-ban' }
        };
        const cfg = map[estado] || map.PENDIENTE;
        return `<span class="novedad-estado ${cfg.c}"><i class="fas ${cfg.i}"></i> ${cfg.t}</span>`;
    }

    function obtenerTipo(n) { return n.tipo_novedad || n.tipo || ''; }
    function obtenerEstado(n) { return String(n.estado || 'PENDIENTE').toUpperCase(); }
    function obtenerFecha(n) { return n.fecha_inicio || ''; }
    
    // FIX #2: permitir cantidad 0
    function obtenerCantidad(n) {
        if (n.cantidad_dias != null && n.cantidad_dias !== '') return n.cantidad_dias + ' días';
        if (n.cantidad_horas != null && n.cantidad_horas !== '') return n.cantidad_horas + ' hrs';
        return '-';
    }
    function obtenerFechaRegistro(n) { return n.fecha_creacion || ''; }

    // FIX #3: evitar desfase UTC en fechas 'YYYY-MM-DD'
    function formatearFecha(f) {
        if (!f) return '-';
        const str = String(f);
        const d = new Date(str.length === 10 ? str + 'T00:00:00' : str);
        return isNaN(d.getTime()) ? str : d.toLocaleDateString('es-CO');
    }
    function formatearFechaHora(f) {
        if (!f) return '-';
        const str = String(f);
        const d = new Date(str.length === 10 ? str + 'T00:00:00' : str);
        return isNaN(d.getTime()) ? str : d.toLocaleString('es-CO');
    }

    // FIX #16: capitalizar
    function formatearTexto(t) { 
        return t ? String(t).toLowerCase().replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : ''; 
    }

    // FIX #21: escaparHTML sin crear div
    function escaparHTML(v) {
        return String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
    }

    function debounce(fn, w) { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), w); }; }

    function mostrarToast(mensaje, tipo = 'success') {
        if (!DOM.toasts) return;
        let icono = 'fa-check-circle', clase = 'success';
        if (tipo === 'error') { icono = 'fa-times-circle'; clase = 'error'; }
        if (tipo === 'warning') { icono = 'fa-exclamation-triangle'; clase = 'warning'; }
        if (tipo === 'info') { icono = 'fa-info-circle'; clase = 'info'; }

        const toast = document.createElement('div');
        toast.className = `toast-novedad ${clase}`;
        toast.innerHTML = `<div class="toast-novedad-icono"><i class="fas ${icono}"></i></div><div class="toast-novedad-contenido">${escaparHTML(mensaje)}</div><button class="toast-novedad-cerrar">&times;</button>`;
        DOM.toasts.appendChild(toast);
        requestAnimationFrame(() => toast.classList.add('mostrar'));
        const cerrar = () => { toast.classList.remove('mostrar'); setTimeout(() => toast.remove(), 300); };
        toast.querySelector('.toast-novedad-cerrar').onclick = cerrar;
        setTimeout(cerrar, 4000);
    }

});