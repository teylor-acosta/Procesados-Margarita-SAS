async function cargarEmpleados() {

    const res = await fetch('/api/empleados');
    const data = await res.json();

    const tabla = document.getElementById('tablaEmpleados');
    tabla.innerHTML = '';

    data.forEach(emp => {

        tabla.innerHTML += `
            <tr>
                <td>${emp.nombre}</td>
                <td>${emp.numero_documento}</td>
                <td>${emp.telefono || '-'}</td>
                <td>${emp.email || '-'}</td>

                <td>
                    <button class="btn btn-warning btn-sm">
                        Editar
                    </button>
                </td>
            </tr>
        `;
    });
}

cargarEmpleados();