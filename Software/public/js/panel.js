async function cargarPanel() {

    const res = await fetch('/api/me');
    const data = await res.json();

    if (!data.success) return;

    const rol = data.usuario.rol;
    const contenedor = document.getElementById('contenedorModulos');

    contenedor.innerHTML = '';

    // 🔥 SUPERADMIN
    if (rol === 'superadministrador') {

        contenedor.innerHTML += `
        <div class="col-md-4 mb-4">
            <a href="/empleados" class="card-modulo-link">
                <div class="card-modulo">
                    <img src="img/empleado.png">
                    <h5>Empleados</h5>
                </div>
            </a>
        </div>
        `;
    }

    // 🔥 ADMIN
    else if (rol === 'administrador') {

        contenedor.innerHTML += `
        <div class="col-md-4 mb-4">
            <div class="card-modulo">
                <h5>Reportes</h5>
            </div>
        </div>
        `;
    }

    // 🔥 AUXILIAR
    else if (rol === 'auxiliar') {

        contenedor.innerHTML += `
        <div class="col-md-4 mb-4">
            <div class="card-modulo">
                <h5>Consultas</h5>
            </div>
        </div>
        `;
    }

}

cargarPanel();