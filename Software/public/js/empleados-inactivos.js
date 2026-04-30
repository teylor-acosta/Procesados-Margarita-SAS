document.addEventListener("DOMContentLoaded", () => {

let empleados = [];

// =============================
function formatearFecha(fecha) {
    if (!fecha) return '';
    const f = new Date(fecha);
    const d = String(f.getDate()).padStart(2,'0');
    const m = String(f.getMonth()+1).padStart(2,'0');
    const y = f.getFullYear();
    return `${d}/${m}/${y}`;
}

// =============================
async function cargar() {

    const res = await fetch('/api/empleados-inactivos', {
        credentials: 'include'
    });

    empleados = await res.json();

    render();
}

// =============================
function render() {

    const tabla = document.getElementById("tablaInactivos");
    tabla.innerHTML = "";

    empleados.forEach(emp => {

        const fila = document.createElement("tr");

        fila.innerHTML = `
            <td>${emp.codigo}</td>
            <td>${emp.nombre || ''}</td>
            <td>${emp.numero_documento}</td>
            <td>${emp.tipo_documento}</td>
            <td>${formatearFecha(emp.fecha_nacimiento)}</td>
            <td>${emp.area || ''}</td>
            <td>${emp.sede || ''}</td>
            <td>${emp.cargo || ''}</td>
            <td>
                <button class="btn btn-success btn-sm" onclick="reactivar(${emp.id})">
                    <i class="fas fa-user-check"></i> Reactivar
                </button>
            </td>
        `;

        tabla.appendChild(fila);
    });
}

// =============================
window.reactivar = async (id) => {

    const conf = await Swal.fire({
        title: "¿Reactivar empleado?",
        icon: "question",
        showCancelButton: true
    });

    if (!conf.isConfirmed) return;

    await fetch('/api/activar-empleado', {
        method: 'PUT',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({id})
    });

    Swal.fire("Empleado reactivado", "", "success");

    cargar();
};

cargar();

});