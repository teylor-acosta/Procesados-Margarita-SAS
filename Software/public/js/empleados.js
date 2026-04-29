document.addEventListener("DOMContentLoaded", () => {

let empleados = [];
let filtrados = [];

let pagina = 1;
const porPagina = 5;

// ============================================
// 🔥 CARGAR EMPLEADOS
// ============================================
async function cargar() {

    const res = await fetch('/api/empleados');
    empleados = await res.json();

    filtrados = [...empleados];

    llenarFiltros();
    render();
}

// ============================================
// 🔥 RENDER TABLA
// ============================================
function render() {

    const inicio = (pagina - 1) * porPagina;
    const data = filtrados.slice(inicio, inicio + porPagina);

    const tabla = document.getElementById("tablaEmpleados");
    tabla.innerHTML = "";

    data.forEach(emp => {

        const fila = document.createElement("tr");

        fila.style.cursor = "pointer";

        fila.innerHTML = `
            <td>${emp.codigo || '-'}</td>
            <td>${emp.nombre}</td>
            <td>${emp.numero_documento}</td>
            <td>${emp.area || 'Sin asignar'}</td>
            <td>${emp.sede || 'Sin asignar'}</td>
            <td>${emp.cargo || 'Sin asignar'}</td>
            <td>${emp.telefono || '-'}</td>
            <td>${emp.email || '-'}</td>
            <td>
                <span class="badge ${emp.activo === 'SI' ? 'bg-success' : 'bg-danger'}">
                    ${emp.activo === 'SI' ? 'Activo' : 'Inactivo'}
                </span>
            </td>
        `;

        // 🔥 CLICK → EDITAR
        fila.addEventListener("click", () => abrirEmpleado(emp));

        tabla.appendChild(fila);
    });

    paginar();
}

// ============================================
// 🔥 PAGINACIÓN
// ============================================
function paginar() {

    const total = Math.ceil(filtrados.length / porPagina);
    const contenedor = document.getElementById("paginacion");

    contenedor.innerHTML = "";

    for (let i = 1; i <= total; i++) {

        const li = document.createElement("li");
        li.className = `page-item ${i === pagina ? 'active' : ''}`;

        li.innerHTML = `<button class="page-link">${i}</button>`;

        li.addEventListener("click", () => {
            pagina = i;
            render();
        });

        contenedor.appendChild(li);
    }
}

// ============================================
// 🔍 FILTROS
// ============================================
function filtrar() {

    const texto = document.getElementById("buscadorEmpleado").value.toLowerCase();
    const area = document.getElementById("filtroArea").value;
    const sede = document.getElementById("filtroSede").value;
    const cargo = document.getElementById("filtroCargo").value;

    filtrados = empleados.filter(emp => {

        return (
            (!texto || 
                emp.nombre.toLowerCase().includes(texto) ||
                emp.numero_documento.includes(texto) ||
                (emp.codigo || '').toLowerCase().includes(texto)
            ) &&
            (!area || emp.area === area) &&
            (!sede || emp.sede === sede) &&
            (!cargo || emp.cargo === cargo)
        );
    });

    pagina = 1;
    render();
}

// ============================================
// 🔥 FILTROS SELECT
// ============================================
function llenarFiltros() {

    llenarSelect("filtroArea", empleados.map(e => e.area));
    llenarSelect("filtroSede", empleados.map(e => e.sede));
    llenarSelect("filtroCargo", empleados.map(e => e.cargo));
}

function llenarSelect(id, lista) {

    const select = document.getElementById(id);

    const unicos = [...new Set(lista.filter(x => x))];

    unicos.forEach(valor => {
        const option = document.createElement("option");
        option.value = valor;
        option.textContent = valor;
        select.appendChild(option);
    });
}

// ============================================
// 🔥 LIMPIAR
// ============================================
document.getElementById("btnLimpiar").addEventListener("click", () => {

    document.getElementById("buscadorEmpleado").value = "";
    document.getElementById("filtroArea").value = "";
    document.getElementById("filtroSede").value = "";
    document.getElementById("filtroCargo").value = "";

    filtrados = [...empleados];
    pagina = 1;

    render();
});

// ============================================
// 🔥 EVENTOS
// ============================================
document.getElementById("buscadorEmpleado").addEventListener("input", filtrar);
document.getElementById("filtroArea").addEventListener("change", filtrar);
document.getElementById("filtroSede").addEventListener("change", filtrar);
document.getElementById("filtroCargo").addEventListener("change", filtrar);

// ============================================
// 🔥 EDITAR
// ============================================
window.abrirEmpleado = function(emp) {

    localStorage.setItem("empleadoEditar", JSON.stringify(emp));

    window.location.href = "/crear-empleado";
};

// ============================================
// 🚀 INICIO
// ============================================
cargar();

});