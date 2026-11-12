/* ============================================================
   HISTORIAL DE NOVEDADES
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
    console.log('📚 Módulo de Historial de Novedades iniciado');

    if (typeof bootstrap === 'undefined') {
        console.warn('⚠️ Bootstrap no está cargado — el historial no funcionará correctamente');
    }

    const API = {
        listar:      '/api/nomina/novedades/historial',
        verDetalle:  (id) => `/api/nomina/novedades/${id}`,
        restaurar:   (id) => `/api/nomina/novedades/historial/${id}/restaurar`,
        eliminar:    (id) => `/api/nomina/novedades/historial/${id}`,
        exportar:    '/api/nomina/novedades/historial/exportar'
    };

    const modalHistorial = document.getElementById('modalHistorialNovedades');
    if (!modalHistorial) {
        console.warn('⚠️ No existe #modalHistorialNovedades — módulo historial omitido');
        return;
    }

    const DOM = {
        buscar:    document.getElementById('historialBuscar'),
        tipo:      document.getElementById('historialTipo'),
        estado:    document.getElementById('historialEstado'),
        tipoFecha: document.getElementById('historialTipoFecha'),
        dia:       document.getElementById('historialDia'),
        mes:       document.getElementById('historialMes'),
        ano:       document.getElementById('historialAno'),
        desde:     document.getElementById('historialDesde'),
        hasta:     document.getElementById('historialHasta'),

        fechaDia:   document.getElementById('historialFechaDia'),
        fechaMes:   document.getElementById('historialFechaMes'),
        fechaAno:   document.getElementById('historialFechaAno'),
        fechaRango: document.getElementById('historialFechaRango'),

        btnBuscar:   document.getElementById('btnBuscarHistorial'),
        btnLimpiar:  document.getElementById('btnLimpiarHistorial'),
        btnExportar: document.getElementById('btnExportarHistorial'),

        tabla:    document.getElementById('tablaHistorialNovedades'),
        cargando: document.getElementById('historialCargando'),
        vacio:    document.getElementById('historialEstadoVacio'),
        wrapper:  document.getElementById('historialTablaWrapper'),
        contador: document.getElementById('contadorHistorial'),

        toasts: document.getElementById('contenedorToasts')
    };

    const estadoHist = {
        cargado:       false,
        cargando:      false,
        registros:     [],
        tiposCargados: false,
        esAdmin:       false // 🔥 NUEVO: Guardaremos si el usuario es admin
    };

    const toast = window.mostrarToast || mostrarToastLocal;
    const confirmar = window.mostrarConfirmacion || confirmarLocal;
    const verNovedadGlobal = window.verNovedad || null;
    const recargarMain = window.cargarNovedades || null;

    // 🔥 NUEVO: Verificar el rol del usuario al cargar
    async function verificarRol() {
        try {
            const res = await fetch('/api/me');
            if (res.ok) {
                const data = await res.json();
                if (data.success && data.usuario) {
                    const rol = String(data.usuario.rol || '').toUpperCase();
                    estadoHist.esAdmin = rol.includes('ADMIN') || rol.includes('SUPER');
                }
            }
        } catch (e) {
            console.warn('No se pudo verificar el rol:', e);
        }
    }

    // Iniciamos verificando el rol
    verificarRol().then(() => {
        configurarEventos();
    });

    function configurarEventos() {
        if (DOM.btnBuscar)   DOM.btnBuscar.addEventListener('click', () => cargarHistorial());
        if (DOM.btnLimpiar)  DOM.btnLimpiar.addEventListener('click', limpiarFiltros);
        if (DOM.btnExportar) DOM.btnExportar.addEventListener('click', exportarCSV);

        if (DOM.buscar) {
            DOM.buscar.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    cargarHistorial();
                }
            });
        }

        if (DOM.tipoFecha) DOM.tipoFecha.addEventListener('change', toggleFechaFiltro);

        // Delegación en tabla
        if (DOM.tabla) DOM.tabla.addEventListener('click', manejarAcciones);

        if (typeof bootstrap !== 'undefined') {
            modalHistorial.addEventListener('shown.bs.modal', async () => {
                if (!estadoHist.cargado) {
                    estadoHist.cargado = true;
                    await cargarTiposHistorial();
                    await cargarHistorial();
                } else {
                    await cargarHistorial();
                }
            });

            modalHistorial.addEventListener('hidden.bs.modal', () => {
                estadoHist.cargado = false;
            });
        } else {
            document.querySelectorAll('[data-bs-toggle="modal"][data-bs-target="#modalHistorialNovedades"]')
                .forEach(btn => btn.addEventListener('click', async () => {
                    await cargarTiposHistorial();
                    await cargarHistorial();
                }));
        }
    }

    async function cargarTiposHistorial() {
        if (!DOM.tipo || estadoHist.tiposCargados) return;

        try {
            const res = await fetch('/api/nomina/novedades/tipos');
            const data = await res.json();
            if (!data.success) return;

            while (DOM.tipo.options.length > 1) DOM.tipo.remove(1);

            (data.tipos || []).forEach(t => {
                const opt = document.createElement('option');
                opt.value = t.id;
                opt.textContent = t.nombre;
                DOM.tipo.appendChild(opt);
            });

            estadoHist.tiposCargados = true;
        } catch (error) {
            console.warn('⚠️ No se pudieron cargar los tipos:', error);
        }
    }

    function construirParametros() {
        const params = new URLSearchParams();

        const q         = (DOM.buscar?.value || '').trim();
        const tipo      = DOM.tipo?.value || '';
        const estado    = DOM.estado?.value || '';
        const tipoFecha = DOM.tipoFecha?.value || '';

        if (q)      params.append('buscar', q);
        if (tipo)   params.append('tipo', tipo);
        if (estado) params.append('estado', estado);

        if (tipoFecha) {
            params.append('tipo_fecha', tipoFecha);

            switch (tipoFecha) {
                case 'dia':
                    if (DOM.dia?.value) params.append('fecha', DOM.dia.value);
                    break;
                case 'mes':
                    if (DOM.mes?.value) params.append('mes', DOM.mes.value);
                    break;
                case 'ano':
                    if (DOM.ano?.value) params.append('ano', DOM.ano.value);
                    break;
                case 'rango':
                    if (DOM.desde?.value) params.append('desde', DOM.desde.value);
                    if (DOM.hasta?.value) params.append('hasta', DOM.hasta.value);
                    break;
            }
        }

        return params;
    }

    async function cargarHistorial() {
        if (estadoHist.cargando) return;
        estadoHist.cargando = true;

        const params = construirParametros();

        if (DOM.cargando) DOM.cargando.style.display = 'block';
        if (DOM.vacio)    DOM.vacio.style.display = 'none';
        if (DOM.wrapper)  DOM.wrapper.style.display = 'none';
        if (DOM.tabla)    DOM.tabla.innerHTML = '';

        try {
            const res  = await fetch(`${API.listar}?${params.toString()}`, { cache: 'no-store' });
            const data = await res.json();

            if (!data.success) throw new Error(data.message || 'Error al consultar historial');

            const registros = data.novedades || data.data || [];
            estadoHist.registros = registros;

            if (DOM.cargando) DOM.cargando.style.display = 'none';

            if (DOM.contador) {
                DOM.contador.textContent =
                    `${registros.length} novedad${registros.length === 1 ? '' : 'es'}`;
            }

            if (!registros.length) {
                mostrarVacio('Sin resultados', 'No se encontraron novedades con los filtros aplicados.');
                return;
            }

            if (DOM.wrapper) DOM.wrapper.style.display = 'block';

            renderizarTabla(registros);

        } catch (error) {
            console.error('❌ Error cargando historial:', error);
            if (DOM.cargando) DOM.cargando.style.display = 'none';
            if (DOM.contador) DOM.contador.textContent = '0 novedades';
            mostrarVacio('Error al cargar', error.message);
            toast(error.message, 'error');
        } finally {
            estadoHist.cargando = false;
        }
    }

    function renderizarTabla(registros) {
        if (!DOM.tabla) return;
        DOM.tabla.innerHTML = '';

        registros.forEach(h => {
            const estado     = String(h.estado || h.estado_nuevo || 'PENDIENTE').toUpperCase();
            const estadoAnt  = h.estado_anterior || '-';
            
            const idNovedad  = h.id; 
            const idHist     = h.id_historial;

            const categoria = (h.categoria || '').toUpperCase();
            const tipoNom   = (h.tipo_novedad || '').toLowerCase();

            let icono = 'fa-file-alt', colorBg = '#f1f5f9', colorText = '#475569';
            if (categoria.includes('ASISTENCIA') || tipoNom.includes('ausencia')) { icono = 'fa-user-clock'; colorBg = '#fef3c7'; colorText = '#b45309'; }
            else if (categoria.includes('SALUD') || tipoNom.includes('incapacidad')) { icono = 'fa-notes-medical'; colorBg = '#fee2e2'; colorText = '#b91c1c'; }
            else if (categoria.includes('DESCUENTO')) { icono = 'fa-hand-holding-dollar'; colorBg = '#fce7f3'; colorText = '#be185d'; }
            else if (categoria.includes('INGRESO') || tipoNom.includes('ingreso')) { icono = 'fa-money-bill-trend-up'; colorBg = '#d1fae5'; colorText = '#047857'; }
            else if (categoria.includes('PRESTAMO') || tipoNom.includes('anticipo') || tipoNom.includes('prestamo')) { icono = 'fa-building-columns'; colorBg = '#e0e7ff'; colorText = '#4338ca'; }
            else if (categoria.includes('TIEMPO') || tipoNom.includes('permiso') || tipoNom.includes('licencia')) { icono = 'fa-calendar-check'; colorBg = '#cffafe'; colorText = '#0e7490'; }
            else if (tipoNom.includes('vacacion')) { icono = 'fa-umbrella-beach'; colorBg = '#e0f2fe'; colorText = '#0369a1'; }

            // 🔥 FIX: Validamos si el usuario es admin antes de renderizar el botón de eliminar
            const botonEliminar = estadoHist.esAdmin ? `
                        <button type="button"
                                class="novedad-accion-btn btn-eliminar-historial"
                                data-hist-accion="eliminar"
                                data-id="${idHist}"
                                title="Eliminar definitivamente">
                            <i class="fas fa-trash"></i>
                        </button>
            ` : '';

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>
                    <div class="novedad-empleado">
                        <strong>${escaparHTML(h.empleado_nombre || h.empleado || 'Sin empleado')}</strong>
                        <small>${escaparHTML(h.numero_documento || h.empleado_doc || '')}</small>
                    </div>
                </td>
                <td>
                    <span style="display:inline-flex;align-items:center;gap:6px;padding:5px 12px;border-radius:20px;font-size:12px;font-weight:700;background-color:${colorBg};color:${colorText};">
                        <i class="fas ${icono}"></i>
                        ${escaparHTML(formatearTexto(h.tipo_novedad || h.titulo || 'Novedad'))}
                    </span>
                </td>
                <td>${formatearFecha(h.fecha_inicio || h.fecha_novedad)}</td>
                <td>${escaparHTML(formatearCantidad(h))}</td>
                <td>${crearBadgeEstado(estado)}</td>
                <td>
                    <div style="font-size:12px;color:#64748b;">
                        ${formatearFechaHora(h.fecha_registro || h.fecha_archivado || h.created_at)}
                    </div>
                    ${estadoAnt !== '-' ? `<small style="color:#94a3b8;">Antes: ${escaparHTML(estadoAnt)}</small>` : ''}
                </td>
                <td>
                    <div class="novedad-acciones">
                        <!-- BOTÓN VER -->
                        <button type="button"
                                class="novedad-accion-btn detalle"
                                data-hist-accion="ver"
                                data-id="${idNovedad}"
                                title="Ver detalle">
                            <i class="fas fa-eye"></i>
                        </button>
                        
                        <!-- BOTÓN RESTAURAR -->
                        <button type="button"
                                class="novedad-accion-btn btn-restaurar-historial"
                                data-hist-accion="restaurar"
                                data-id="${idHist}"
                                title="Restaurar novedad">
                            <i class="fas fa-rotate-left"></i>
                        </button>
                        
                        <!-- BOTÓN ELIMINAR (Solo si es admin) -->
                        ${botonEliminar}
                    </div>
                </td>
            `;
            DOM.tabla.appendChild(tr);
        });
    }

    function manejarAcciones(e) {
        e.preventDefault();
        e.stopPropagation();

        const btn = e.target.closest('button[data-hist-accion]');
        if (!btn || btn.disabled) return;

        const accion = btn.dataset.histAccion;
        const id     = btn.dataset.id;
        if (!id) return;

        switch (accion) {
            case 'ver':       verDetalle(id);       break;
            case 'restaurar': restaurar(id);        break;
            case 'eliminar':  eliminarDefinitivo(id); break;
        }
    }

    async function verDetalle(id) {
        if (typeof verNovedadGlobal === 'function') {
            try {
                await verNovedadGlobal(id);
                return;
            } catch (e) {
                console.warn('Fallback a consulta directa:', e);
            }
        }

        try {
            const res  = await fetch(API.verDetalle(id));
            const data = await res.json();

            if (!data.success) throw new Error(data.message || 'No se pudo obtener el detalle');

            const n = data.novedad || data.data || data || {};

            if (window.Swal && typeof window.Swal.fire === 'function') {
                await window.Swal.fire({
                    title: 'Detalle de la novedad',
                    width: 620,
                    html: construirDetalleHTML(n),
                    confirmButtonText: 'Cerrar',
                    confirmButtonColor: '#16a34a'
                });
            } else {
                alert(
                    `Empleado: ${n.empleado_nombre || '-'}\n` +
                    `Tipo: ${n.tipo_novedad || '-'}\n` +
                    `Estado: ${n.estado || '-'}\n` +
                    `Motivo: ${n.motivo || '-'}`
                );
            }
        } catch (error) {
            toast(error.message, 'error');
        }
    }

    function construirDetalleHTML(n) {
        const estado = String(n.estado || 'PENDIENTE').toUpperCase();
        return `
            <div style="text-align:left;font-size:14px;line-height:1.7;">
                <p><strong>Empleado:</strong> ${escaparHTML(n.empleado_nombre || '-')}</p>
                <p><strong>Documento:</strong> ${escaparHTML(n.numero_documento || '-')}</p>
                <p><strong>Tipo:</strong> ${escaparHTML(n.tipo_novedad || '-')}</p>
                <p><strong>Categoría:</strong> ${escaparHTML(n.categoria || '-')}</p>
                <p><strong>Fechas:</strong> ${formatearFecha(n.fecha_inicio)} → ${formatearFecha(n.fecha_fin)}</p>
                <p><strong>Cantidad:</strong> ${escaparHTML(formatearCantidad(n))}</p>
                <p><strong>Motivo:</strong> ${escaparHTML(n.motivo || '-')}</p>
                <p><strong>Observación:</strong> ${escaparHTML(n.observacion || '-')}</p>
                <p><strong>Estado:</strong> ${crearBadgeEstado(estado)}</p>
                ${n.observacion_rechazo ? `<p><strong>Observación rechazo:</strong> ${escaparHTML(n.observacion_rechazo)}</p>` : ''}
                <p><strong>Creación:</strong> ${formatearFechaHora(n.fecha_creacion)}</p>
            </div>
        `;
    }

    function restaurar(id) {
        confirmar(
            '¿Restaurar esta novedad? Volverá al listado principal en estado PENDIENTE.',
            async () => {
                try {
                    const res = await fetch(API.restaurar(id), {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' }
                    });
                    const data = await res.json();

                    if (!data.success) throw new Error(data.message || 'Error al restaurar');

                    toast('✅ ' + (data.message || 'Novedad restaurada correctamente'), 'success');
                    await cargarHistorial();
                    if (typeof recargarMain === 'function') await recargarMain();

                } catch (error) {
                    toast(error.message, 'error');
                }
            }
        );
    }

    function eliminarDefinitivo(id) {
        confirmar(
            '⚠️ Esta acción elimina el registro DEFINITIVAMENTE del historial. Deberás ingresar tu contraseña para confirmar. ¿Continuar?',
            async () => {
                let password = '';

                if (window.Swal && typeof window.Swal.fire === 'function') {
                    const { value, isConfirmed } = await window.Swal.fire({
                        title: 'Confirmar eliminación',
                        text: 'Ingresa tu contraseña para eliminar definitivamente',
                        input: 'password',
                        inputPlaceholder: 'Contraseña',
                        inputAttributes: { autocapitalize: 'off', autocomplete: 'off' },
                        showCancelButton: true,
                        confirmButtonText: 'Eliminar',
                        confirmButtonColor: '#e74c3c',
                        cancelButtonText: 'Cancelar',
                        inputValidator: (value) => {
                            if (!value) return 'La contraseña es obligatoria';
                        }
                    });

                    if (!isConfirmed) return;
                    password = value;
                } else {
                    password = prompt('Ingresa tu contraseña para eliminar definitivamente:');
                    if (!password) return;
                }

                try {
                    const res = await fetch(API.eliminar(id), {
                        method: 'DELETE',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ password })
                    });
                    const data = await res.json();

                    if (!data.success) throw new Error(data.message || 'Error al eliminar');

                    toast('🗑️ ' + (data.message || 'Registro eliminado permanentemente'), 'success');
                    await cargarHistorial();

                } catch (error) {
                    toast(error.message, 'error');
                }
            }
        );
    }

    function toggleFechaFiltro() {
        const valor = DOM.tipoFecha?.value || '';
        [DOM.fechaDia, DOM.fechaMes, DOM.fechaAno, DOM.fechaRango].forEach(el => {
            if (el) el.style.display = 'none';
        });
        if (valor === 'dia'   && DOM.fechaDia)   DOM.fechaDia.style.display   = 'block';
        if (valor === 'mes'   && DOM.fechaMes)   DOM.fechaMes.style.display   = 'block';
        if (valor === 'ano'   && DOM.fechaAno)   DOM.fechaAno.style.display   = 'block';
        if (valor === 'rango' && DOM.fechaRango) DOM.fechaRango.style.display = 'flex';
    }

    function limpiarFiltros() {
        [DOM.buscar, DOM.tipo, DOM.estado, DOM.tipoFecha,
         DOM.dia, DOM.mes, DOM.ano, DOM.desde, DOM.hasta]
            .forEach(el => { if (el) el.value = ''; });

        [DOM.fechaDia, DOM.fechaMes, DOM.fechaAno, DOM.fechaRango]
            .forEach(el => { if (el) el.style.display = 'none'; });

        cargarHistorial();
    }

    async function exportarCSV() {
        try {
            const params = construirParametros();
            const url = `${API.exportar}?${params.toString()}`;

            const res = await fetch(url);
            if (!res.ok) throw new Error('No fue posible exportar el historial');

            const contentType = res.headers.get('content-type') || '';
            if (!contentType.includes('csv') && !contentType.includes('octet-stream') && !contentType.includes('text/plain')) {
                const json = await res.json().catch(() => null);
                if (json && !json.success) throw new Error(json.message || 'Error al exportar');
            }

            const blob = await res.blob();
            const objectUrl = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = objectUrl;
            link.download = `historial_novedades_${new Date().toLocaleDateString('sv-SE')}.csv`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(objectUrl);

            toast('✅ Historial exportado', 'success');
        } catch (error) {
            if (!estadoHist.registros.length) {
                toast('No hay registros para exportar', 'warning');
                return;
            }
            console.warn('Fallback a exportación en memoria:', error);
            exportarDesdeMemoria();
        }
    }

    function exportarDesdeMemoria() {
        const columnas = ['ID','Empleado','Documento','Tipo','Fecha inicio','Fecha fin','Cantidad','Estado','Acción','Registro'];
        const filas = estadoHist.registros.map(h => [
            h.id, h.empleado_nombre || '', h.numero_documento || '',
            h.tipo_novedad || '', h.fecha_inicio || '', h.fecha_fin || '',
            formatearCantidad(h), h.estado || '', h.estado_anterior || '',
            h.fecha_registro || ''
        ]);

        let csv = '\uFEFF' + columnas.join(';') + '\n';
        filas.forEach(f => {
            csv += f.map(c => `"${String(c ?? '').replace(/"/g, '""')}"`).join(';') + '\n';
        });

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const objectUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = objectUrl;
        link.download = `historial_novedades_${new Date().toLocaleDateString('sv-SE')}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(objectUrl);

        toast('✅ Historial exportado', 'success');
    }

    function mostrarVacio(titulo, mensaje) {
        if (DOM.vacio) {
            DOM.vacio.style.display = 'flex';
            const h3 = DOM.vacio.querySelector('h3');
            const p  = DOM.vacio.querySelector('p');
            if (h3) h3.textContent = titulo;
            if (p)  p.textContent  = mensaje;
        }
    }

    function crearBadgeEstado(estado) {
        const map = {
            PENDIENTE:  { c: 'pendiente',  t: 'Pendiente',  i: 'fa-clock' },
            APROBADA:   { c: 'aprobada',   t: 'Aprobada',   i: 'fa-circle-check' },
            RECHAZADA:  { c: 'rechazada',  t: 'Rechazada',  i: 'fa-circle-xmark' },
            ANULADA:    { c: 'anulada',    t: 'Anulada',    i: 'fa-ban' },
            PROCESADA:  { c: 'procesada',  t: 'Procesada',  i: 'fa-check-double' }
        };
        const cfg = map[estado] || { c: 'anulada', t: escaparHTML(estado || '-'), i: 'fa-question' };
        return `<span class="novedad-estado ${cfg.c}"><i class="fas ${cfg.i}"></i> ${cfg.t}</span>`;
    }

    function formatearCantidad(h) {
        if (h.cantidad_dias != null)  return h.cantidad_dias + ' días';
        if (h.cantidad_horas != null) return h.cantidad_horas + ' hrs';
        if (h.cantidad != null)       return String(h.cantidad);
        return '-';
    }

    // 🔥 NUEVO: Formato mejorado de fechas
    function formatearFecha(f) {
        if (!f) return '-';
        const str = String(f);
        const d = new Date(str.length === 10 ? str + 'T00:00:00' : str);
        if (isNaN(d.getTime())) return str;
        return d.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' }).replace('.', '');
    }

    // 🔥 NUEVO: Formato mejorado de fecha y hora
    function formatearFechaHora(f) {
        if (!f) return '-';
        const str = String(f);
        const d = new Date(str.length === 10 ? str + 'T00:00:00' : str);
        if (isNaN(d.getTime())) return str;
        return d.toLocaleString('es-CO', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false }).replace('.', '').replace(',', ' ·');
    }

    function formatearTexto(t) {
        if (!t) return '';
        return String(t).toLowerCase().replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    }

    function escaparHTML(val) {
        if (val === null || val === undefined) return '';
        return String(val)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function mostrarToastLocal(mensaje, tipo = 'success') {
        if (!DOM.toasts) { 
            console.log(`[Toast ${tipo}] ${mensaje}`);
            return; 
        }

        let icono = 'fa-check-circle', clase = 'success';
        if (tipo === 'error')   { icono = 'fa-times-circle';        clase = 'error'; }
        if (tipo === 'warning') { icono = 'fa-exclamation-triangle'; clase = 'warning'; }
        if (tipo === 'info')    { icono = 'fa-info-circle';         clase = 'info'; }

        const toast = document.createElement('div');
        toast.className = `toast-novedad ${clase}`;
        toast.innerHTML = `
            <div class="toast-novedad-icono"><i class="fas ${icono}"></i></div>
            <div class="toast-novedad-contenido">${escaparHTML(mensaje)}</div>
            <button class="toast-novedad-cerrar">&times;</button>
        `;
        DOM.toasts.appendChild(toast);
        requestAnimationFrame(() => toast.classList.add('mostrar'));
        const cerrar = () => { toast.classList.remove('mostrar'); setTimeout(() => toast.remove(), 300); };
        toast.querySelector('.toast-novedad-cerrar').onclick = cerrar;
        setTimeout(cerrar, 4000);
    }

    function confirmarLocal(mensaje, callback) {
        const modal = document.getElementById('modalConfirmacion');
        const msg = document.getElementById('modalConfirmacionMensaje');
        const btn = document.getElementById('btnConfirmarAccion');

        if (modal && msg && btn && typeof bootstrap !== 'undefined') {
            msg.textContent = mensaje;
            btn.onclick = () => {
                bootstrap.Modal.getOrCreateInstance(modal).hide();
                callback();
            };
            bootstrap.Modal.getOrCreateInstance(modal).show();
        } else if (confirm(mensaje)) {
            callback();
        }
    }

    window.HistorialNovedades = {
        cargar:   cargarHistorial,
        limpiar:  limpiarFiltros,
        exportar: exportarCSV
    };
});