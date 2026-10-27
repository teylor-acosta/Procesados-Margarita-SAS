document.addEventListener(
    'DOMContentLoaded',
    cargarDashboard
);

async function cargarDashboard() {

    try {

        const resp = await fetch(
            '/api/dashboard-usuarios'
        );

        const data = await resp.json();

        // ==========================
        // RESUMEN
        // ==========================

        document.getElementById(
            'totalUsuarios'
        ).textContent =
            data.usuariosRegistrados || 0;

        document.getElementById(
            'usuariosActivos'
        ).textContent =
            data.usuariosActivos || 0;

        document.getElementById(
            'totalRoles'
        ).textContent =
            data.rolesConfigurados || 0;

        document.getElementById(
            'accesosHoy'
        ).textContent =
            data.accesosHoy || 0;

        // ==========================
        // INFORMACIÓN
        // ==========================

       document.getElementById(
    'ultimoUsuario'
).textContent =
    data.ultimoUsuario ||
    'Sin registros';

document.getElementById(
    'totalPermisos'
).textContent =
    `${data.permisosAsignados || 0} permisos activos`;

document.getElementById(
    'ultimaActividad'
).textContent =
    data.ultimaActividad ||
    'Sin actividad';

document.getElementById(
    'ultimoAcceso'
).textContent =
    data.ultimoAcceso
        ? new Date(
            data.ultimoAcceso
          ).toLocaleString('es-CO')
        : 'Sin acceso';

        // ==========================
        // TEXTO INFERIOR
        // ==========================

        document.getElementById(
            'usuariosMes'
        ).textContent =
            `${data.usuariosMes || 0} creados este mes`;

        document.getElementById(
            'usuariosActivosMes'
        ).textContent =
            `${data.usuariosActivos || 0} activos`;

        document.getElementById(
            'rolesMes'
        ).textContent =
            `${data.rolesConfigurados || 0} roles disponibles`;

    }

    catch (error) {

        console.error(
            'Error dashboard usuarios:',
            error
        );

    }

}