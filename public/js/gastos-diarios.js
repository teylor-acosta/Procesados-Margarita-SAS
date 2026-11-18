// =====================================================================
// CONFIGURACIÓN INICIAL Y VARIABLES GLOBALES
// =====================================================================

const API_URL = '/api/gastos-diarios';

let idGastoAEliminar = null;
let dbSimulada = []; 
let modoSimulacion = false; 

// Inicialización cuando el DOM está listo
document.addEventListener('DOMContentLoaded', () => {
    const hoy = new Date().toISOString().split('T')[0];
    
    // Setear fechas por defecto
    document.getElementById('fechaGasto').value = hoy;
    document.getElementById('filtroFecha').value = hoy;

    // Cargar datos iniciales
    cargarGastos(hoy);
    cargarPrestamosAprobados();

    // Asignar Event Listeners
    document.getElementById('form-gasto').addEventListener('submit', registrarGasto);
    document.getElementById('btn-filtrar').addEventListener('click', filtrarPorFecha);
    document.getElementById('btn-hoy').addEventListener('click', volverAHoy);
    document.getElementById('btn-confirmar-eliminar').addEventListener('click', confirmarEliminacion);
    
    // Listener para el botón de Exportar
    document.getElementById('btnExportar').addEventListener('click', exportarCSV);

    // Listener para el formulario del modal
    const formExcelModal = document.getElementById('form-excel-modal');
    if (formExcelModal) {
        formExcelModal.addEventListener('submit', procesarExcelModal);
    }
});

// =====================================================================
// NOTIFICACIONES TOAST (Reemplazo de alert)
// =====================================================================
function mostrarNotificacion(mensaje, tipo = 'success') {
    const container = document.getElementById('toast-container');
    
    const colores = {
        success: 'bg-success text-white',
        error: 'bg-danger text-white',
        warning: 'bg-warning text-dark',
        info: 'bg-info text-dark'
    };
    
    const iconos = {
        success: 'fa-check-circle',
        error: 'fa-times-circle',
        warning: 'fa-exclamation-triangle',
        info: 'fa-info-circle'
    };

    const toastHTML = `
        <div class="toast align-items-center ${colores[tipo]} border-0 shadow-lg mb-2" role="alert" aria-live="assertive" aria-atomic="true">
            <div class="d-flex">
                <div class="toast-body fs-6 fw-medium d-flex align-items-center gap-2">
                    <i class="fas ${iconos[tipo]} fs-5"></i>
                    ${mensaje}
                </div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
            </div>
        </div>
    `;

    container.insertAdjacentHTML('beforeend', toastHTML);
    const toastElement = container.lastElementChild;
    const toast = new bootstrap.Toast(toastElement, { delay: 3500 });
    toast.show();

    toastElement.addEventListener('hidden.bs.toast', () => {
        toastElement.remove();
    });
}

// =====================================================================
// LÓGICA PRINCIPAL: CARGAR GASTOS
// =====================================================================
async function cargarGastos(fecha) {
    const tbody = document.getElementById('cuerpo-tabla');
    const totalElement = document.getElementById('total-dia');
    
    tbody.innerHTML = `
        <tr>
            <td colspan="6" class="text-center text-muted py-5">
                <div class="spinner-border spinner-border-sm text-primary me-2" role="status"></div>
                Consultando base de datos...
            </td>
        </tr>`;
    totalElement.textContent = '$0.00';

    try {
        if (modoSimulacion) throw new Error('Modo simulación activo');

        const response = await fetch(`${API_URL}?fecha=${fecha}`);
        if (!response.ok) throw new Error('Error del servidor');
        
        const data = await response.json();
        renderizarTabla(data.data || []);

    } catch (error) {
        if (!modoSimulacion) {
            console.warn('⚠️ Backend no detectado. Entrando en modo simulación.');
            modoSimulacion = true;
        }
        
        const gastosFiltrados = dbSimulada.filter(g => g.fecha_registro === fecha);
        renderizarTabla(gastosFiltrados);
    }
}

// =====================================================================
// RENDERIZAR TABLA
// =====================================================================
function renderizarTabla(gastos) {
    const tbody = document.getElementById('cuerpo-tabla');
    const totalElement = document.getElementById('total-dia');
    tbody.innerHTML = '';
    let total = 0;

    if (gastos.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center text-muted py-5">
                    <i class="fas fa-inbox fs-2 mb-3 d-block opacity-50"></i>
                    No hay gastos registrados para esta fecha.
                </td>
            </tr>`;
        totalElement.textContent = '$0.00';
        return;
    }

    gastos.forEach(gasto => {
        const monto = parseFloat(gasto.monto || 0);
        total += monto;

        let vinculoBadge = `<span class="badge badge-soft-secondary rounded-pill px-3 py-2">Ninguno</span>`;
        if (gasto.prestamo_id) {
            vinculoBadge = `<span class="badge badge-soft-warning rounded-pill px-3 py-2"><i class="fas fa-link me-1"></i>Préstamo #${gasto.prestamo_id}</span>`;
        }

        const fechaFormateada = gasto.fecha_registro 
            ? gasto.fecha_registro.split('-').reverse().join('/') 
            : '';

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td class="fw-medium">${fechaFormateada}</td>
            <td><span class="badge bg-light text-dark border fw-bold">${gasto.codigo_gasto}</span></td>
            <td class="text-start">${gasto.nombre_gasto}</td>
            <td>${vinculoBadge}</td>
            <td class="text-end fw-bold text-success">$${monto.toFixed(2)}</td>
            <td>
                <button class="btn btn-outline-danger btn-sm btn-action-delete" onclick="abrirModalEliminar(${gasto.id})" title="Eliminar gasto">
                    <i class="fas fa-trash-alt"></i>
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });

    totalElement.textContent = `$${total.toFixed(2)}`;
}

// =====================================================================
// REGISTRAR UN NUEVO GASTO
// =====================================================================
async function registrarGasto(evento) {
    evento.preventDefault();
    const btnSubmit = evento.target.querySelector('button[type="submit"]');
    const textoOriginal = btnSubmit.innerHTML;

    const montoInput = document.getElementById('montoGasto').value;
    if (parseFloat(montoInput) <= 0) {
        mostrarNotificacion('El monto debe ser mayor a cero.', 'warning');
        return;
    }

    const nuevoGasto = {
        codigo_gasto: document.getElementById('codigoGasto').value.trim(),
        nombre_gasto: document.getElementById('nombreGasto').value.trim(),
        monto: parseFloat(montoInput),
        fecha_registro: document.getElementById('fechaGasto').value,
        prestamo_id: document.getElementById('vincularPrestamo').value || null,
        id: Date.now()
    };

    try {
        btnSubmit.disabled = true;
        btnSubmit.innerHTML = `<i class="fas fa-spinner fa-spin me-2"></i>Guardando...`;

        if (!modoSimulacion) {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(nuevoGasto)
            });
            if (!response.ok) throw new Error('Error al guardar');
        } else {
            await new Promise(resolve => setTimeout(resolve, 500));
            dbSimulada.push(nuevoGasto);
        }

        mostrarNotificacion('Gasto registrado exitosamente.', 'success');
        
        document.getElementById('form-gasto').reset();
        document.getElementById('fechaGasto').value = nuevoGasto.fecha_registro;
        
        cargarGastos(nuevoGasto.fecha_registro);

    } catch (error) {
        console.error(error);
        mostrarNotificacion('Error al intentar guardar el gasto.', 'error');
    } finally {
        btnSubmit.disabled = false;
        btnSubmit.innerHTML = textoOriginal;
    }
}

// =====================================================================
// ELIMINAR GASTO
// =====================================================================
function abrirModalEliminar(id) {
    idGastoAEliminar = id;
    const modal = new bootstrap.Modal(document.getElementById('modalEliminar'));
    modal.show();
}

async function confirmarEliminacion() {
    if (!idGastoAEliminar) return;

    const btnConfirm = document.getElementById('btn-confirmar-eliminar');
    const textoOriginal = btnConfirm.innerHTML;

    try {
        btnConfirm.disabled = true;
        btnConfirm.innerHTML = `<i class="fas fa-spinner fa-spin me-1"></i>Eliminando...`;

        if (!modoSimulacion) {
            const response = await fetch(`${API_URL}/${idGastoAEliminar}`, { method: 'DELETE' });
            if (!response.ok) throw new Error('Error al eliminar');
        } else {
            dbSimulada = dbSimulada.filter(g => g.id !== idGastoAEliminar);
        }

        const modal = bootstrap.Modal.getInstance(document.getElementById('modalEliminar'));
        modal.hide();

        mostrarNotificacion('Gasto eliminado correctamente.', 'info');
        cargarGastos(document.getElementById('filtroFecha').value);

    } catch (error) {
        console.error(error);
        mostrarNotificacion('No se pudo eliminar el gasto.', 'error');
    } finally {
        btnConfirm.disabled = false;
        btnConfirm.innerHTML = textoOriginal;
        idGastoAEliminar = null;
    }
}

// =====================================================================
// FILTROS DE FECHA
// =====================================================================
function filtrarPorFecha() {
    const fecha = document.getElementById('filtroFecha').value;
    if (fecha) {
        cargarGastos(fecha);
    } else {
        mostrarNotificacion('Selecciona una fecha válida.', 'warning');
    }
}

function volverAHoy() {
    const hoy = new Date().toISOString().split('T')[0];
    document.getElementById('filtroFecha').value = hoy;
    cargarGastos(hoy);
}

// =====================================================================
// EXPORTAR A CSV (CORREGIDO)
// =====================================================================
async function exportarCSV() {
    const fechaActual = document.getElementById('filtroFecha').value;
    
    if (!fechaActual) {
        mostrarNotificacion('Selecciona una fecha para exportar.', 'warning');
        return;
    }

    mostrarNotificacion('Generando archivo CSV...', 'info');

    try {
        // Usamos fetch con credentials: 'include' para mantener la sesión
        const response = await fetch(`${API_URL}/exportar?fecha=${fechaActual}`, {
            method: 'GET',
            credentials: 'include'
        });

        if (!response.ok) {
            throw new Error('Error al generar el archivo');
        }

        // Convertimos la respuesta a Blob
        const blob = await response.blob();
        
        // Creamos un enlace temporal para forzar la descarga
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `gastos_${fechaActual}.csv`;
        document.body.appendChild(a);
        a.click();
        
        // Limpiamos el objeto URL
        a.remove();
        window.URL.revokeObjectURL(url);
        
        mostrarNotificacion('Archivo descargado correctamente.', 'success');

    } catch (error) {
        console.error('Error al exportar:', error);
        mostrarNotificacion('No se pudo descargar el archivo. Revisa la consola.', 'error');
    }
}

// =====================================================================
// LÓGICA DE IMPORTACIÓN DESDE EXCEL (Para el modal)
// =====================================================================
async function procesarExcelModal(evento) {
    evento.preventDefault();
    
    const inputFile = document.getElementById('archivoExcelModal');
    const archivo = inputFile.files[0];
    const progressContainer = document.getElementById('excel-progress-container-modal');
    const progressBar = document.getElementById('excel-progress-modal');
    const mensajeDiv = document.getElementById('mensaje-excel-modal');

    if (!archivo) {
        mostrarNotificacion('Selecciona un archivo Excel primero.', 'warning');
        return;
    }

    progressContainer.classList.remove('d-none');
    progressBar.style.width = '10%';
    mensajeDiv.innerHTML = '<i class="fas fa-spinner fa-spin me-1"></i> Leyendo archivo...';

    const reader = new FileReader();
    
    reader.onload = async (e) => {
        try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet);
            
            progressBar.style.width = '50%';
            mensajeDiv.innerHTML = `<i class="fas fa-spinner fa-spin me-1"></i> ${jsonData.length} registros encontrados. Enviando...`;

            const response = await fetch(`${API_URL}/importar`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ gastos: jsonData })
            });

            if (!response.ok) throw new Error('Error al importar');

            progressBar.style.width = '100%';
            progressBar.classList.remove('progress-bar-animated');
            progressBar.classList.add('bg-success');
            mensajeDiv.innerHTML = `<i class="fas fa-check-circle text-success me-1"></i> "${archivo.name}" importado.`;
            mostrarNotificacion('Datos importados con éxito.', 'success');
            
            cargarGastos(document.getElementById('filtroFecha').value);

            // Cerrar el modal después de 2 segundos
            setTimeout(() => {
                const modal = bootstrap.Modal.getInstance(document.getElementById('modalImportar'));
                if (modal) modal.hide();
            }, 2000);

        } catch (error) {
            console.error(error);
            progressBar.classList.add('bg-danger');
            mensajeDiv.innerHTML = `<i class="fas fa-times-circle text-danger me-1"></i> Error al procesar.`;
            mostrarNotificacion('Error al importar el Excel.', 'error');
        } finally {
            inputFile.value = '';
            setTimeout(() => {
                progressContainer.classList.add('d-none');
                progressBar.style.width = '0%';
                progressBar.classList.remove('bg-success', 'bg-danger');
                progressBar.classList.add('bg-info', 'progress-bar-animated');
                mensajeDiv.innerHTML = '';
            }, 4000);
        }
    };

    reader.readAsArrayBuffer(archivo);
}

// =====================================================================
// CARGAR PRÉSTAMOS APROBADOS
// =====================================================================
async function cargarPrestamosAprobados() {
    const select = document.getElementById('vincularPrestamo');
    
    select.innerHTML = '<option value="">-- No vincular --</option>';

    try {
        const response = await fetch(`${API_URL}/prestamos-aprobados`);
        
        if (!response.ok) throw new Error('Error al cargar préstamos');
        
        const data = await response.json();

        if (data.ok && data.data && data.data.length > 0) {
            data.data.forEach(p => {
                const option = document.createElement('option');
                option.value = p.id;
                option.textContent = `Préstamo #${p.id} - ${p.empleado_nombre} ($${parseFloat(p.monto).toFixed(2)})`;
                select.appendChild(option);
            });
        } else {
            const option = document.createElement('option');
            option.value = "";
            option.textContent = "-- No hay préstamos aprobados hoy --";
            option.disabled = true;
            select.appendChild(option);
        }
    } catch (error) {
        console.warn('No se pudieron cargar los préstamos del backend:', error);
        
        // Fallback: Simulación
        const prestamosFalsos = [
            { id: 1, nombre: 'Juan Pérez', monto: 50.00 },
            { id: 2, nombre: 'María Gómez', monto: 120.00 }
        ];

        prestamosFalsos.forEach(p => {
            const option = document.createElement('option');
            option.value = p.id;
            option.textContent = `Préstamo #${p.id} - ${p.nombre} ($${p.monto.toFixed(2)})`;
            select.appendChild(option);
        });
    }
}