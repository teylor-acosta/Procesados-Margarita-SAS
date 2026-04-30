document.addEventListener("DOMContentLoaded", () => {

let empleados = [];
let filtrados = [];
let pagina = 1;
const porPagina = 10;

let modal = new bootstrap.Modal(document.getElementById('modalEmpleado'));

// =============================
// 🔥 FORMATEAR FECHA TABLA
// =============================
function formatearFecha(fecha) {
    if (!fecha) return '';

    const f = new Date(fecha);

    const dia = String(f.getDate()).padStart(2, '0');
    const mes = String(f.getMonth() + 1).padStart(2, '0');
    const anio = f.getFullYear();

    return `${dia}/${mes}/${anio}`;
}

// =============================
// 🔥 FORMATEAR FECHA INPUT (FIX IMPORTANTE)
// =============================
function formatearFechaInput(fecha) {
    if (!fecha) return '';

    const f = new Date(fecha);

    const anio = f.getFullYear();
    const mes = String(f.getMonth() + 1).padStart(2, '0');
    const dia = String(f.getDate()).padStart(2, '0');

    return `${anio}-${mes}-${dia}`;
}

// =============================
async function cargar() {
    const res = await fetch('/api/empleados', { credentials: 'include' });
    empleados = await res.json();
    filtrados = [...empleados];
    llenarFiltros();
    render();
}

// =============================
function render() {

    const inicio = (pagina - 1) * porPagina;
    const data = filtrados.slice(inicio, inicio + porPagina);

    tablaEmpleados.innerHTML = "";

    data.forEach(emp => {

        const fila = document.createElement("tr");

        fila.innerHTML = `
            <td>${emp.codigo || ''}</td>
            <td>${emp.nombre || ''}</td>
            <td>${emp.numero_documento || ''}</td>
            <td>${emp.tipo_documento || ''}</td>
            <td>${formatearFecha(emp.fecha_nacimiento)}</td>
            <td>${emp.lugar_nacimiento || ''}</td>
            <td>${emp.rh || ''}</td>
            <td>${emp.estado_civil || ''}</td>
            <td>${emp.direccion || ''}</td>
            <td>${emp.barrio_localidad || ''}</td>
            <td>${emp.telefono || ''}</td>
            <td>${emp.email || ''}</td>
            <td>${emp.area || ''}</td>
            <td>${emp.sede || ''}</td>
            <td>${emp.cargo || ''}</td>
            <td><span class="badge-activo">SI</span></td>
        `;

        fila.style.cursor = "pointer";
        fila.addEventListener("click", () => abrirModal(emp));

        tablaEmpleados.appendChild(fila);
    });

    paginar();
}

// =============================
function paginar() {
    const total = Math.ceil(filtrados.length / porPagina);
    paginacion.innerHTML = "";

    for (let i = 1; i <= total; i++) {
        paginacion.innerHTML += `
            <li class="page-item ${i===pagina?'active':''}">
                <button class="page-link" onclick="irPagina(${i})">${i}</button>
            </li>
        `;
    }
}

window.irPagina = (p) => {
    pagina = p;
    render();
};

// =============================
function llenarFiltros() {
    llenarSelect("filtroArea", empleados.map(e => e.area));
    llenarSelect("filtroSede", empleados.map(e => e.sede));
    llenarSelect("filtroCargo", empleados.map(e => e.cargo));
    llenarSelect("filtroTipoDoc", empleados.map(e => e.tipo_documento));
}

function llenarSelect(id, lista) {
    const select = document.getElementById(id);
    select.innerHTML = `<option value="">${id.replace('filtro','')}</option>`;

    [...new Set(lista)].forEach(v => {
        if (v) select.innerHTML += `<option>${v}</option>`;
    });
}

// =============================
function filtrar() {

    const t = buscadorEmpleado.value.toLowerCase();
    const a = filtroArea.value;
    const s = filtroSede.value;
    const c = filtroCargo.value;
    const td = filtroTipoDoc.value;

    filtrados = empleados.filter(e =>
        (!t || e.nombre.toLowerCase().includes(t)) &&
        (!a || e.area === a) &&
        (!s || e.sede === s) &&
        (!c || e.cargo === c) &&
        (!td || e.tipo_documento === td)
    );

    pagina = 1;
    render();
}

buscadorEmpleado.oninput = filtrar;
filtroArea.onchange = filtrar;
filtroSede.onchange = filtrar;
filtroCargo.onchange = filtrar;
filtroTipoDoc.onchange = filtrar;

btnLimpiar.onclick = () => {
    buscadorEmpleado.value = "";
    filtroArea.value = "";
    filtroSede.value = "";
    filtroCargo.value = "";
    filtroTipoDoc.value = "";
    filtrados = [...empleados];
    pagina = 1;
    render();
};

// =============================
async function abrirModal(emp) {

    edit_id.value = emp.id;
    edit_nombre.value = emp.nombre;
    edit_documento.value = emp.numero_documento;
    edit_tipo_documento.value = emp.tipo_documento || '';
    edit_fecha_nacimiento.value = formatearFechaInput(emp.fecha_nacimiento); // 🔥 FIX AQUÍ
    edit_telefono.value = emp.telefono || '';
    edit_email.value = emp.email || '';
    edit_direccion.value = emp.direccion || '';
    edit_barrio.value = emp.barrio_localidad || '';
    edit_lugar_nacimiento.value = emp.lugar_nacimiento || '';
    edit_rh.value = emp.rh || '';
    edit_estado_civil.value = emp.estado_civil || '';

    const res = await fetch('/api/filtros-empleado');
    const data = await res.json();

    cargarSelect("edit_area", data.areas, emp.area_id);
    cargarSelect("edit_sede", data.sedes, emp.sede_id);
    cargarSelect("edit_cargo", data.cargos, emp.cargo_id);

    modal.show();
}

// =============================
function cargarSelect(id, lista, selected) {

    const select = document.getElementById(id);
    select.innerHTML = `<option value="">Seleccione</option>`;

    lista.forEach(x => {
        select.innerHTML += `<option value="${x.id}" ${x.id==selected?'selected':''}>${x.nombre}</option>`;
    });
}

// =============================
window.actualizarEmpleado = async () => {

    const data = {
        id: edit_id.value,
        nombre: edit_nombre.value,
        numero_documento: edit_documento.value,
        tipo_documento: edit_tipo_documento.value,
        fecha_nacimiento: edit_fecha_nacimiento.value, // 🔥 ahora sí se guarda
        telefono: edit_telefono.value,
        email: edit_email.value,
        direccion: edit_direccion.value,
        barrio_localidad: edit_barrio.value,
        lugar_nacimiento: edit_lugar_nacimiento.value,
        rh: edit_rh.value,
        estado_civil: edit_estado_civil.value,
        area_id: edit_area.value,
        sede_id: edit_sede.value,
        cargo_id: edit_cargo.value
    };

    const res = await fetch('/api/actualizar-empleado', {
        method: 'PUT',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify(data)
    });

    const r = await res.json();

    if (r.success) {
        Swal.fire("Actualizado correctamente", "", "success");
        modal.hide();
        cargar();
    }
};

// =============================
window.desactivarDesdeModal = async () => {

    const id = edit_id.value;

    const conf = await Swal.fire({
        title: "¿Seguro que deseas desactivar?",
        icon: "warning",
        showCancelButton: true
    });

    if (!conf.isConfirmed) return;

    await fetch('/api/desactivar-empleado', {
        method: 'PUT',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({id})
    });

    Swal.fire("Empleado desactivado", "", "success");
    modal.hide();
    cargar();
};

cargar();

});