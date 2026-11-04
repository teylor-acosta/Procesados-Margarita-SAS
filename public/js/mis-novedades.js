/* ============================================================
   MIS NOVEDADES - USUARIO NORMAL (VERSIÓN PREMIUM)
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
    console.log('📋 Módulo de Mis Novedades iniciado (Premium)');

    // --- Variables de Estado ---
    let _guardando = false; // Bandera para evitar doble envío
    
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
        
        toasts: document.getElementById('contenedorToasts')
    };

    // --- Inicialización ---
    inicializar();

    async function inicializar() {
        // Prevenir error de aria-hidden con modales
        document.querySelectorAll('.modal').forEach((modal) => {
            modal.addEventListener('hide.bs.modal', () => {
                if (document.activeElement && modal.contains(document.activeElement)) {
                    document.activeElement.blur();
                }
            });
        });

        establecerMesActual();
        configurarEventos();
        await cargarNovedades();
    }

    // --- Configuración de Eventos ---
    function configurarEventos() {
        if (DOM.btnRefrescar) DOM.btnRefrescar.addEventListener('click', () => { mostrarToast('Actualizando datos...', 'info'); cargarNovedades(); });
        if (DOM.btnExportar) DOM.btnExportar.addEventListener('click', exportarCSV);
        if (DOM.btnRegistrar) DOM.btnRegistrar.addEventListener('click', abrirRegistroNovedad);

        // Filtros
        if (DOM.buscar) DOM.buscar.addEventListener('input', debounce(aplicarFiltros, 300));
        if (DOM.filtroTipo) DOM.filtroTipo.addEventListener('change', aplicarFiltros);
        if (DOM.filtroEstado) DOM.filtroEstado.addEventListener('change', aplicarFiltros);
        if (DOM.filtroMes) DOM.filtroMes.addEventListener('change', aplicarFiltros);
        if (DOM.btnLimpiar) DOM.btnLimpiar.addEventListener('click', limpiarFiltros);
        
        // Paginación
        if (DOM.btnPrev) DOM.btnPrev.addEventListener('click', () => { if (estadoApp.paginaActual > 1) { estadoApp.paginaActual--; renderizarTabla(); } });
        if (DOM.btnNext) DOM.btnNext.addEventListener('click', () => { const total = Math.ceil(estadoApp.novedadesFiltradas.length / estadoApp.tamanoPagina); if (estadoApp.paginaActual < total) { estadoApp.paginaActual++; renderizarTabla(); } });

        // Modal
        if (DOM.selectTipo) DOM.selectTipo.addEventListener('change', seleccionarTipoNovedad);
        if (DOM.btnGuardar) DOM.btnGuardar.addEventListener('click', guardarNovedad);
    }

    /* ========================================================
       LÓGICA DE TABLA Y FILTROS
       ======================================================== */
    async function cargarNovedades() {
        try {
            mostrarCargando();
            const respuesta = await fetch('/api/nomina/novedades');
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
        if (document.getElementById('kpiHistorial')) document.getElementById('kpiHistorial').textContent = estadoApp.novedades.filter(n => obtenerEstado(n) === 'ANULADA').length;
    }

    function cargarTiposFiltro() {
        if (!DOM.filtroTipo) return;
        const tipos = [...new Set(estadoApp.novedades.map(n => obtenerTipo(n)).filter(Boolean))];
        DOM.filtroTipo.innerHTML = `<option value="">Todos los tipos</option>`;
        tipos.sort().forEach(tipo => {
            const opt = document.createElement('option');
            opt.value = tipo; opt.textContent = formatearTexto(tipo);
            DOM.filtroTipo.appendChild(opt);
        });
    }

    function aplicarFiltros() {
        const texto = (DOM.buscar?.value || '').trim().toLowerCase();
        const tipo = DOM.filtroTipo?.value || '';
        const estado = DOM.filtroEstado?.value || '';
        const mes = DOM.filtroMes?.value || '';

        estadoApp.novedadesFiltradas = estadoApp.novedades.filter(n => {
            if (texto && !String(obtenerTipo(n)).toLowerCase().includes(texto)) return false;
            if (tipo && obtenerTipo(n) !== tipo) return false;
            if (estado && obtenerEstado(n) !== estado) return false;
            if (mes && !obtenerFecha(n).startsWith(mes)) return false;
            return true;
        });

        estadoApp.paginaActual = 1;
        renderizarTabla();
    }

    function limpiarFiltros() {
        if (DOM.buscar) DOM.buscar.value = '';
        if (DOM.filtroTipo) DOM.filtroTipo.value = '';
        if (DOM.filtroEstado) DOM.filtroEstado.value = '';
        establecerMesActual();
        aplicarFiltros();
    }

    function establecerMesActual() {
        if (!DOM.filtroMes) return;
        const ahora = new Date();
        DOM.filtroMes.value = `${ahora.getFullYear()}-${String(ahora.getMonth() + 1).padStart(2, '0')}`;
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
            return;
        }

        if (DOM.estadoVacio) DOM.estadoVacio.style.display = 'none';
        DOM.tabla.innerHTML = '';
        
        novedadesPagina.forEach(novedad => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><span class="novedad-tipo">${escaparHTML(formatearTexto(obtenerTipo(novedad)))}</span></td>
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
       LÓGICA DE REGISTRO (PREMIUM)
       ======================================================== */
    
    async function abrirRegistroNovedad() {
        limpiarFormularioNovedad();
        await cargarTiposRegistro();
        const modal = bootstrap.Modal.getOrCreateInstance(DOM.modalRegistrar);
        modal.show();
    }

    async function cargarTiposRegistro() {
        try {
            const res = await fetch('/api/nomina/novedades/tipos');
            const data = await res.json();
            if (!res.ok || !data.success) throw new Error('Error al cargar tipos');
            
            DOM.selectTipo.innerHTML = `<option value="">Selecciona un tipo de novedad</option>`;
            data.tipos.forEach(t => {
                const opt = document.createElement('option');
                opt.value = t.id;
                opt.textContent = `${t.nombre} — ${t.categoria}`;
                opt.dataset.nombre = t.nombre;
                opt.dataset.codigo = t.codigo;
                opt.dataset.categoria = t.categoria;
                opt.dataset.descripcion = t.descripcion || '';
                opt.dataset.requiereSoporte = t.requiere_soporte;
                opt.dataset.requiereAprobacion = t.requiere_aprobacion;
                DOM.selectTipo.appendChild(opt);
            });
        } catch (error) { mostrarToast(error.message, 'error'); }
    }

    async function seleccionarTipoNovedad() {
        const opt = DOM.selectTipo.selectedOptions[0];
        
        if (DOM.divError) DOM.divError.style.display = 'none';

        if (!opt || !opt.value) {
            DOM.formDinamico.style.display = 'none';
            DOM.seccionSoporte.style.display = 'none';
            DOM.avisoAprobacion.style.display = 'none';
            DOM.btnGuardar.disabled = true;
            return;
        }

        const codigo = (opt.dataset.codigo || '').toUpperCase();
        const categoria = (opt.dataset.categoria || '').toUpperCase();
        const nombre = opt.dataset.nombre || '';

        DOM.formDinamico.style.display = 'block';
        DOM.seccionSoporte.style.display = Number(opt.dataset.requiereSoporte) ? 'block' : 'none';
        DOM.avisoAprobacion.style.display = Number(opt.dataset.requiereAprobacion) ? 'flex' : 'none';
        DOM.btnGuardar.disabled = false;
        DOM.campos.innerHTML = '';

        // --- AUSENCIA ---
        if (categoria === 'ASISTENCIA' || nombre.toLowerCase().includes('ausencia')) {
            DOM.campos.innerHTML = `
                <div class="row g-3">
                    <div class="col-md-6">
                        <label class="form-label">Tipo de ausencia *</label>
                        <select id="tipoAusencia" class="form-select"><option value="JUSTIFICADA">Justificada</option><option value="INJUSTIFICADA">Injustificada</option></select>
                    </div>
                    <div class="col-md-3"><label class="form-label">Fecha inicio *</label><input type="date" id="fechaInicio" class="form-control"></div>
                    <div class="col-md-3"><label class="form-label">Fecha fin *</label><input type="date" id="fechaFin" class="form-control"></div>
                    <div class="col-md-4"><label class="form-label">Días</label><input type="number" id="cantidadDias" class="form-control" readonly></div>
                    <div class="col-md-8"><label class="form-label">Motivo *</label><textarea id="motivo" class="form-control" rows="2"></textarea></div>
                </div>
            `;
            const fIni = document.getElementById('fechaInicio');
            const fFin = document.getElementById('fechaFin');
            const dias = document.getElementById('cantidadDias');
            const calc = () => {
                if (fIni.value && fFin.value) {
                    const d1 = new Date(fIni.value); const d2 = new Date(fFin.value);
                    if (d2 >= d1) dias.value = Math.floor((d2 - d1) / (1000*60*60*24)) + 1;
                }
            };
            fIni.addEventListener('change', calc);
            fFin.addEventListener('change', calc);
            return;
        }

        // --- INCAPACIDAD ---
        if (codigo === 'SALUD' || nombre.toLowerCase().includes('incapacidad')) {
            DOM.campos.innerHTML = `
                <div class="row g-3">
                    <div class="col-md-6">
                        <label class="form-label">Tipo de incapacidad *</label>
                        <select id="tipoIncapacidad" class="form-select"><option value="ENFERMEDAD_GENERAL">Enfermedad general</option><option value="ACCIDENTE_TRABAJO">Accidente de trabajo</option></select>
                    </div>
                    <div class="col-md-3"><label class="form-label">Fecha inicio *</label><input type="date" id="fechaInicio" class="form-control"></div>
                    <div class="col-md-3"><label class="form-label">Fecha fin *</label><input type="date" id="fechaFin" class="form-control"></div>
                    <div class="col-md-4"><label class="form-label">Días</label><input type="number" id="cantidadDias" class="form-control" readonly></div>
                    <div class="col-md-8"><label class="form-label">Observación</label><textarea id="observacion" class="form-control" rows="2"></textarea></div>
                </div>
            `;
            const fIni = document.getElementById('fechaInicio');
            const fFin = document.getElementById('fechaFin');
            const dias = document.getElementById('cantidadDias');
            const calc = () => {
                if (fIni.value && fFin.value) {
                    const d1 = new Date(fIni.value); const d2 = new Date(fFin.value);
                    if (d2 >= d1) dias.value = Math.floor((d2 - d1) / (1000*60*60*24)) + 1;
                }
            };
            fIni.addEventListener('change', calc);
            fFin.addEventListener('change', calc);
            return;
        }

        // --- PERMISO ---
        if (codigo === 'PERMISO' || nombre.toLowerCase().includes('permiso')) {
            DOM.campos.innerHTML = `
                <div class="row g-3">
                    <div class="col-md-6">
                        <label class="form-label">Tipo de permiso *</label>
                        <select id="tipoPermiso" class="form-select"><option value="REMUNERADO">Remunerado</option><option value="NO_REMUNERADO">No remunerado</option><option value="COMPENSATORIO">Compensatorio</option></select>
                    </div>
                    <div class="col-md-6"><label class="form-label">Fecha *</label><input type="date" id="fechaPermiso" class="form-control"></div>
                    <div class="col-md-4"><label class="form-label">Hora inicio *</label><input type="time" id="horaInicio" class="form-control"></div>
                    <div class="col-md-4"><label class="form-label">Hora fin *</label><input type="time" id="horaFin" class="form-control"></div>
                    <div class="col-md-4"><label class="form-label">Horas totales</label><input type="number" id="cantidadHoras" class="form-control" readonly></div>
                    <div class="col-12"><label class="form-label">Motivo *</label><textarea id="motivo" class="form-control" rows="2"></textarea></div>
                </div>
            `;
            const hIni = document.getElementById('horaInicio');
            const hFin = document.getElementById('horaFin');
            const cant = document.getElementById('cantidadHoras');
            const calc = () => {
                if (hIni.value && hFin.value) {
                    const [h1, m1] = hIni.value.split(':').map(Number);
                    const [h2, m2] = hFin.value.split(':').map(Number);
                    const diff = (h2*60+m2) - (h1*60+m1);
                    if (diff > 0) cant.value = (diff/60).toFixed(2);
                }
            };
            hIni.addEventListener('change', calc);
            hFin.addEventListener('change', calc);
            return;
        }

        DOM.campos.innerHTML = `<div class="alert alert-info">Formulario pendiente de configurar.</div>`;
    }

    async function guardarNovedad() {
        if (_guardando) return; // Evitar doble envío

        const opt = DOM.selectTipo.selectedOptions[0];
        if (!opt || !opt.value) return mostrarErrorModal('Selecciona un tipo de novedad.');

        const codigo = (opt.dataset.codigo || '').toUpperCase();
        const categoria = (opt.dataset.categoria || '').toUpperCase();
        const nombre = opt.dataset.nombre || '';
        const tipoNovedadId = opt.value;
        const archivo = DOM.inputSoporte?.files?.[0];

        if (DOM.divError) DOM.divError.style.display = 'none';

        try {
            _guardando = true;
            DOM.btnGuardar.disabled = true;
            DOM.btnGuardar.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Guardando...`;

            let endpoint = '';
            let payload = null;
            let formData = null;

            // --- VALIDACIÓN Y CONSTRUCCIÓN ---
            if (codigo === 'SALUD' || nombre.toLowerCase().includes('incapacidad')) {
                const fIni = document.getElementById('fechaInicio').value;
                const fFin = document.getElementById('fechaFin').value;
                const dias = document.getElementById('cantidadDias').value;
                
                if (!fIni || !fFin || !dias) return mostrarErrorModal('Completa las fechas de inicio y fin.');
                if (!archivo) return mostrarErrorModal('Debes adjuntar el soporte médico (PDF o Imagen).');
                
                endpoint = 'incapacidad';
                formData = new FormData();
                formData.append('tipo_novedad_id', tipoNovedadId);
                formData.append('tipo_incapacidad', document.getElementById('tipoIncapacidad').value);
                formData.append('fecha_inicio', fIni);
                formData.append('fecha_fin', fFin);
                formData.append('cantidad_dias', dias);
                formData.append('observacion', document.getElementById('observacion').value || '');
                formData.append('soporte', archivo);
            }
            else if (categoria === 'ASISTENCIA' || nombre.toLowerCase().includes('ausencia')) {
                const fIni = document.getElementById('fechaInicio').value;
                const fFin = document.getElementById('fechaFin').value;
                const motivo = document.getElementById('motivo').value.trim();
                
                if (!fIni || !fFin) return mostrarErrorModal('Completa las fechas de inicio y fin.');
                if (!motivo) return mostrarErrorModal('Escribe el motivo de la ausencia.');
                
                endpoint = 'ausencia';
                formData = new FormData();
                formData.append('tipo_novedad_id', tipoNovedadId);
                formData.append('tipo_ausencia', document.getElementById('tipoAusencia').value);
                formData.append('fecha_inicio', fIni);
                formData.append('fecha_fin', fFin);
                formData.append('cantidad_dias', document.getElementById('cantidadDias').value);
                formData.append('motivo', motivo);
                if (archivo) formData.append('soporte', archivo);
            }
            else if (codigo === 'PERMISO' || nombre.toLowerCase().includes('permiso')) {
                const fecha = document.getElementById('fechaPermiso').value;
                const hIni = document.getElementById('horaInicio').value;
                const hFin = document.getElementById('horaFin').value;
                const motivo = document.getElementById('motivo').value.trim();
                
                if (!fecha || !hIni || !hFin) return mostrarErrorModal('Completa la fecha y las horas.');
                if (!motivo) return mostrarErrorModal('Escribe el motivo del permiso.');
                
                endpoint = 'permiso';
                payload = {
                    tipo_novedad_id: tipoNovedadId,
                    tipo_permiso: document.getElementById('tipoPermiso').value,
                    fecha_permiso: fecha,
                    hora_inicio: hIni,
                    hora_fin: hFin,
                    cantidad_horas: Number(document.getElementById('cantidadHoras').value),
                    motivo: motivo
                };
            }
            else {
                return mostrarErrorModal('Este formulario aún no está configurado.');
            }

            // --- ENVÍO ---
            const fetchOptions = {
                method: 'POST',
                body: formData ? formData : JSON.stringify(payload),
                headers: formData ? {} : { 'Content-Type': 'application/json' }
            };

            const res = await fetch(`/api/nomina/novedades/${endpoint}`, fetchOptions);
            const data = await res.json();

            if (!res.ok || !data.success) throw new Error(data.message || 'Error al registrar en el servidor.');

            // --- ÉXITO ---
            bootstrap.Modal.getInstance(DOM.modalRegistrar).hide();
            mostrarToast('✅ Novedad registrada correctamente. Estado: PENDIENTE.', 'success');
            await cargarNovedades();

        } catch (error) {
            mostrarErrorModal(error.message);
            mostrarToast(error.message, 'error');
        } finally {
            _guardando = false;
            DOM.btnGuardar.disabled = false;
            DOM.btnGuardar.innerHTML = `<i class="fas fa-save"></i> Registrar`;
        }
    }

    // Función auxiliar para mostrar errores en el modal
    function mostrarErrorModal(mensaje) {
        if (DOM.divError) {
            DOM.divError.textContent = mensaje;
            DOM.divError.style.display = 'block';
            // Scroll automático al mensaje de error
            DOM.divError.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
        DOM.btnGuardar.disabled = false;
        DOM.btnGuardar.innerHTML = `<i class="fas fa-save"></i> Registrar`;
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
    }

    /* ========================================================
       VER DETALLE DE LA NOVEDAD
       ======================================================== */
    async function verNovedad(id) {
        const modalElement = document.getElementById('modalDetalleNovedad');
        if (!modalElement) return;

        const modal = bootstrap.Modal.getOrCreateInstance(modalElement);
        document.getElementById('detalleTipoNovedad').textContent = "Cargando...";
        document.getElementById('detalleContenido').innerHTML = `<div class="col-12 text-center py-4"><i class="fas fa-spinner fa-spin fa-2x text-success"></i></div>`;
        document.getElementById('detalleBtnSoporte').style.display = 'none';
        modal.show();

        try {
            const res = await fetch(`/api/nomina/novedades/${id}`);
            const data = await res.json();
            if (!res.ok || !data.success) throw new Error('Error al cargar');

            const n = data.novedad;
            document.getElementById('detalleTipoNovedad').textContent = n.tipo_novedad || 'Detalle';

            document.getElementById('detalleContenido').innerHTML = `
                <div class="col-md-6">
                    <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 14px;">
                        <small style="color: #64748b; font-weight: 700; text-transform: uppercase;">Estado</small>
                        <div style="margin-top: 4px;">${crearBadgeEstado(n.estado)}</div>
                    </div>
                </div>
                <div class="col-md-6">
                    <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 14px;">
                        <small style="color: #64748b; font-weight: 700; text-transform: uppercase;">Fechas</small>
                        <div style="font-weight: 600; color: #334155;">${formatearFecha(n.fecha_inicio)} al ${formatearFecha(n.fecha_fin)}</div>
                    </div>
                </div>
                <div class="col-12">
                    <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 14px;">
                        <small style="color: #64748b; font-weight: 700; text-transform: uppercase;">Motivo / Observación</small>
                        <div style="color: #334155; margin-top: 4px;">${escaparHTML(n.motivo || 'Sin motivo')}<br><span style="color: #64748b; font-style: italic;">${escaparHTML(n.observacion || '')}</span></div>
                    </div>
                </div>
            `;

            if (data.soportes && data.soportes.length > 0) {
                const btnSoporte = document.getElementById('detalleBtnSoporte');
                btnSoporte.href = data.soportes[0].ruta_archivo;
                btnSoporte.style.display = 'inline-flex';
            }

        } catch (error) {
            document.getElementById('detalleContenido').innerHTML = `<div class="col-12"><div class="alert alert-danger">Error al cargar detalle: ${escaparHTML(error.message)}</div></div>`;
        }
    }

    /* ========================================================
       EXPORTAR CSV
       ======================================================== */
    function exportarCSV() {
        if (!estadoApp.novedadesFiltradas.length) return mostrarToast('No hay datos para exportar', 'warning');
        let csv = "Tipo,Fecha,Cantidad,Estado\n";
        estadoApp.novedadesFiltradas.forEach(n => {
            csv += `"${obtenerTipo(n)}","${obtenerFecha(n)}","${obtenerCantidad(n)}","${obtenerEstado(n)}"\n`;
        });
        const blob = new Blob(["\uFEFF" + csv], { type: 'text/csv;charset=utf-8;' }); // BOM para Excel
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = `mis_novedades_${new Date().getTime()}.csv`;
        a.click();
        mostrarToast('Archivo CSV descargado correctamente', 'success');
    }

    /* ========================================================
       UTILIDADES Y COMPONENTES
       ======================================================== */
    function mostrarCargando() { if (DOM.skeleton) DOM.skeleton.style.display = 'flex'; }
    function ocultarCargando() { if (DOM.skeleton) DOM.skeleton.style.display = 'none'; }
    function mostrarError(msg) { if (DOM.tabla) DOM.tabla.innerHTML = `<tr><td colspan="6" class="text-center text-danger py-4"><i class="fas fa-triangle-exclamation"></i> ${msg}</td></tr>`; }
    
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
    function obtenerCantidad(n) { return n.cantidad_dias ? n.cantidad_dias + ' días' : (n.cantidad_horas ? n.cantidad_horas + ' hrs' : '-'); }
    function obtenerFechaRegistro(n) { return n.fecha_creacion || ''; }
    function formatearFecha(f) { return f ? new Date(f).toLocaleDateString('es-CO') : '-'; }
    function formatearFechaHora(f) { return f ? new Date(f).toLocaleString('es-CO') : '-'; }
    function formatearTexto(t) { return t ? String(t).toLowerCase().replace(/_/g, ' ') : ''; }
    function escaparHTML(v) { const d = document.createElement('div'); d.textContent = v ?? ''; return d.innerHTML; }
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