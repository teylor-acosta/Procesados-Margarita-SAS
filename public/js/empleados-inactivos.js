
document.addEventListener("DOMContentLoaded", () => {

    let empleados = [];
    let empleadosOriginal = [];
    let modalDetalle;
    let empleadoSeleccionado = null;

    function formatearFecha(fecha) {
        if (!fecha) return '-';
        const f = new Date(fecha);
        return `${String(f.getDate()).padStart(2,'0')}/${String(f.getMonth()+1).padStart(2,'0')}/${f.getFullYear()}`;
    }

    async function cargar() {
        try {
            const res = await fetch('/api/empleados-inactivos', {
                credentials: 'include'
            });

            empleados = await res.json();
            empleadosOriginal = [...empleados];

            actualizarEstadisticas();
            render();

        } catch (error) {
            console.error(error);

            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'No fue posible cargar los empleados'
            });
        }
    }

    async function cargarAreas() {
        const res = await fetch('/api/areas',{credentials:'include'});
        const areas = await res.json();

        const select = document.getElementById('filtroArea');

        areas.forEach(area => {
            select.innerHTML += `<option value="${area.nombre}">${area.nombre}</option>`;
        });
    }

    async function cargarSedes() {
        const res = await fetch('/api/sedes',{credentials:'include'});
        const sedes = await res.json();

        const select = document.getElementById('filtroSede');

        sedes.forEach(sede => {
            select.innerHTML += `<option value="${sede.nombre}">${sede.nombre}</option>`;
        });
    }

    async function cargarCargos() {
        const res = await fetch('/api/cargos',{credentials:'include'});
        const cargos = await res.json();

        const select = document.getElementById('filtroCargo');

        cargos.forEach(cargo => {
            select.innerHTML += `<option value="${cargo.nombre}">${cargo.nombre}</option>`;
        });
    }

    function actualizarEstadisticas() {

        const total = empleados.length;

        const renuncias = empleados.filter(
            e => (e.motivo_desactivacion || '').toLowerCase().includes('renuncia')
        ).length;

        const mutuoAcuerdo = empleados.filter(
            e => (e.motivo_desactivacion || '').toLowerCase().includes('mutuo')
        ).length;

        const otros = total - renuncias - mutuoAcuerdo;

        document.getElementById('totalInactivos').textContent = total;
        document.getElementById('statTotal').textContent = total;
        document.getElementById('statRenuncias').textContent = renuncias;
        document.getElementById('statDespidos').textContent = mutuoAcuerdo;
        document.getElementById('statOtros').textContent = otros;
    }

    function aplicarFiltros() {

        const texto = document.getElementById('buscador').value.toLowerCase();
        const area = document.getElementById('filtroArea').value;
        const sede = document.getElementById('filtroSede').value;
        const cargo = document.getElementById('filtroCargo').value;

        empleados = empleadosOriginal.filter(emp => {

            const coincideTexto =
                (emp.nombre || '').toLowerCase().includes(texto) ||
                (emp.numero_documento || '').includes(texto);

            const coincideArea = !area || emp.area === area;
            const coincideSede = !sede || emp.sede === sede;
            const coincideCargo = !cargo || emp.cargo === cargo;

            return coincideTexto && coincideArea && coincideSede && coincideCargo;
        });

        render();
    }

    function render() {

        const tabla = document.getElementById("tablaInactivos");
        tabla.innerHTML = "";

        empleados.forEach(emp => {

            const estadoUsuario =
                Number(emp.bloqueado) === 1
                    ? `<span class="badge bg-danger">Bloqueado</span>`
                    : `<span class="badge bg-success">Activo</span>`;

            const fila = document.createElement("tr");

            fila.innerHTML = `
                <td>${emp.codigo || '-'}</td>
                <td>${emp.nombre || '-'}</td>
                <td>${emp.cargo || '-'}</td>
                <td>${formatearFecha(emp.fecha_registro)}</td>
                <td>${formatearFecha(emp.fecha_desactivacion)}</td>
                <td>${emp.motivo_desactivacion || '-'}</td>
                <td>${emp.usuario_sistema || '-'}</td>
                <td>${estadoUsuario}</td>
                <td>
                    <div style="display:flex;gap:8px;justify-content:center;">
                        <button class="btn btn-primary btn-sm" onclick="verDetalle(${emp.id})">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn btn-success btn-sm" onclick="reactivar(${emp.id})">
                            <i class="fas fa-user-check"></i>
                        </button>
                    </div>
                </td>
            `;

            tabla.appendChild(fila);
        });
    }

    window.verDetalle = (id) => {

        const emp = empleados.find(e => e.id == id);
        if (!emp) return;

        empleadoSeleccionado = emp;

        document.getElementById('detalleNombre').textContent = emp.nombre || '-';
        document.getElementById('detalleDocumento').textContent = emp.numero_documento || '-';
        document.getElementById('detalleFecha').textContent = formatearFecha(emp.fecha_desactivacion);
        document.getElementById('detalleMotivo').textContent = emp.motivo_desactivacion || '-';
        document.getElementById('detalleObservacion').textContent = emp.observacion_desactivacion || '-';
        document.getElementById('detalleUsuario').textContent = emp.usuario_sistema || '-';
        document.getElementById('detalleEstado').textContent =
            Number(emp.bloqueado) === 1 ? 'Bloqueado' : 'Activo';

        modalDetalle.show();
    };

    window.reactivar = async (id) => {

        const conf = await Swal.fire({
            title:'¿Reactivar empleado?',
            text:'El empleado volverá a estar disponible en todo el ERP.',
            icon:'question',
            showCancelButton:true,
            confirmButtonText:'Reactivar',
            cancelButtonText:'Cancelar'
        });

        if (!conf.isConfirmed) return;

        try {

            const response = await fetch('/api/activar-empleado', {
                method:'PUT',
                headers:{'Content-Type':'application/json'},
                body:JSON.stringify({id})
            });

            const result = await response.json();

            if (!result.success) throw new Error();

            empleados = empleados.filter(e => e.id != id);
            empleadosOriginal = empleadosOriginal.filter(e => e.id != id);

            actualizarEstadisticas();
            render();

            modalDetalle.hide();

            Swal.fire({
                icon:'success',
                title:'Empleado reactivado'
            });

        } catch(error) {

            console.error(error);

            Swal.fire({
                icon:'error',
                title:'Error',
                text:'No fue posible reactivar el empleado'
            });
        }
    };

    document.getElementById('btnReactivarModal')
        ?.addEventListener('click', () => {
            if (empleadoSeleccionado) {
                reactivar(empleadoSeleccionado.id);
            }
        });

    document.getElementById('buscador')
        ?.addEventListener('input', aplicarFiltros);

    document.getElementById('filtroArea')
        ?.addEventListener('change', aplicarFiltros);

    document.getElementById('filtroSede')
        ?.addEventListener('change', aplicarFiltros);

    document.getElementById('filtroCargo')
        ?.addEventListener('change', aplicarFiltros);

    document.getElementById('btnLimpiar')
        ?.addEventListener('click', () => {

            document.getElementById('buscador').value = '';
            document.getElementById('filtroArea').value = '';
            document.getElementById('filtroSede').value = '';
            document.getElementById('filtroCargo').value = '';

            empleados = [...empleadosOriginal];
            render();
        });

    modalDetalle = new bootstrap.Modal(
        document.getElementById('modalDetalleEmpleado')
    );

    cargarAreas();
    cargarSedes();
    cargarCargos();
    cargar();

});