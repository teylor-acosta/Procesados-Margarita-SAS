
document.addEventListener('DOMContentLoaded', () => {

    // ==========================================
    // ELEMENTOS
    // ==========================================

    const modalDocumento = document.getElementById('modalDocumento');
    const modalVersion = document.getElementById('modalVersion');
    const modalSeguimiento = document.getElementById('modalSeguimiento');

    const formDocumento = document.getElementById('formDocumento');
    const formVersion = document.getElementById('formVersion');

    const tablaDocumentos = document.getElementById('tablaDocumentos');
    const tablaHistorial = document.getElementById('tablaHistorial');
    const filtroTipoHistorial = document.getElementById('filtroTipoHistorial');
    filtroTipoHistorial.addEventListener('change', () => {
    const tipoSeleccionado = filtroTipoHistorial.value;

    const filas = tablaHistorial.querySelectorAll('tr[data-tipo]');

    filas.forEach(fila => {
        const tipoDocumento = fila.dataset.tipo;

        fila.style.display =
            tipoSeleccionado === '' || tipoDocumento === tipoSeleccionado
                ? ''
                : 'none';
    });
});
    const filtroTipoDocumentos = document.getElementById('filtroTipoDocumentos');

    const archivoDocumento = document.getElementById('archivoDocumento');
    const archivoVersion = document.getElementById('archivoVersion');

    let documentosActuales = [];


// ==========================================
// ELEMENTOS DEL SEGUIMIENTO DOCUMENTAL
// ==========================================

const tablaSeguimiento = document.getElementById('tablaSeguimiento');

const filtroBuscarEmpleado = document.getElementById('segBuscarEmpleado');
const filtroSeguimientoDocumento = document.getElementById('segFiltroDocumento');
const filtroSeguimientoEstado = document.getElementById('segFiltroEstado');
const btnActualizarSeguimiento = document.getElementById('btnActualizarSeguimiento');

let datosSeguimiento = [];
let resumenSeguimiento = {};


    filtroTipoDocumentos.addEventListener('change', () => {
    const tipoSeleccionado = filtroTipoDocumentos.value;

    const filas = tablaDocumentos.querySelectorAll('tr[data-tipo]');

    filas.forEach(fila => {
        const tipoDocumento = fila.dataset.tipo;

        fila.style.display =
            tipoSeleccionado === '' || tipoDocumento === tipoSeleccionado
                ? ''
                : 'none';
    });
});


    function mostrarAlerta(titulo, mensaje, icono = 'success') {
    return Swal.fire({
        title: titulo,
        text: mensaje,
        icon: icono,
        confirmButtonText: 'Aceptar',
        confirmButtonColor: '#087B49',
        background: '#ffffff',
        color: '#172033',
        allowOutsideClick: false,
        customClass: {
            popup: 'alerta-erp'
        }
    });
}

    // ==========================================
    // SEGURIDAD Y UTILIDADES DE PRESENTACIÓN
    // ==========================================

    function escaparHTML(valor) {
        return String(valor ?? '').replace(/[&<>"']/g, caracter => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
        })[caracter]);
    }

    function formatearFecha(fecha) {

        if (!fecha) return 'No disponible';

        const fechaLocal = new Date(
            fecha.toString().replace(' ', 'T')
        );

        if (Number.isNaN(fechaLocal.getTime())) {
            return 'No disponible';
        }

        return fechaLocal.toLocaleDateString('es-CO', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    }

    async function respuestaAPI(url, opciones = {}) {

        const respuesta = await fetch(url, {
            credentials: 'same-origin',
            ...opciones
        });

        const datos = await respuesta.json().catch(() => ({}));

        if (!respuesta.ok) {
            throw new Error(
                datos.message || 'No se pudo completar la operación.'
            );
        }

        return datos;
    }


    // ==========================================
    // MODALES
    // ==========================================

    function abrirModal(modal) {
        modal.classList.add('activo');
    }

    function cerrarModal(modal) {
        modal.classList.remove('activo');
    }

    document.getElementById('btnNuevoDocumento')
        .addEventListener('click', () => {

            formDocumento.reset();

            document.getElementById('nombreArchivo').textContent =
                'Tamaño máximo: 20 MB';

            document.getElementById('tituloModal').textContent =
                'Nuevo documento';

            abrirModal(modalDocumento);

        });

    document.getElementById('cerrarModal')
        .addEventListener('click', () => cerrarModal(modalDocumento));

    document.getElementById('cancelarModal')
        .addEventListener('click', () => cerrarModal(modalDocumento));

    document.getElementById('cerrarModalVersion')
        .addEventListener('click', () => cerrarModal(modalVersion));
        // MODAL DE SEGUIMIENTO DOCUMENTAL

document.getElementById('btnAbrirSeguimiento')
    .addEventListener('click', () => {
        abrirModal(modalSeguimiento);
    });

document.getElementById('cerrarModalSeguimiento')
    .addEventListener('click', () => {
        cerrarModal(modalSeguimiento);
    });

    document.getElementById('cancelarVersion')
        .addEventListener('click', () => cerrarModal(modalVersion));

    [modalDocumento, modalVersion, modalSeguimiento].forEach(modal => {

        modal.addEventListener('click', event => {

            if (event.target === modal) {
                cerrarModal(modal);
            }

        });

    });


    // ==========================================
    // SELECCIÓN DE ARCHIVOS
    // ==========================================

    function validarPDF(archivo) {

        if (!archivo) return false;

        if (
            archivo.type !== 'application/pdf' ||
            !archivo.name.toLowerCase().endsWith('.pdf')
        ) {

            alert('El archivo seleccionado debe ser un PDF válido.');

            return false;

        }

        if (archivo.size > 20 * 1024 * 1024) {

            alert('El archivo supera el límite de 20 MB.');

            return false;

        }

        return true;

    }

    archivoDocumento.addEventListener('change', () => {

        const archivo = archivoDocumento.files[0];

        if (!archivo) return;

        if (!validarPDF(archivo)) {
            archivoDocumento.value = '';
            return;
        }

        document.getElementById('nombreArchivo').textContent =
            archivo.name;

    });

    archivoVersion.addEventListener('change', () => {

        const archivo = archivoVersion.files[0];

        if (!archivo) return;

        if (!validarPDF(archivo)) {
            archivoVersion.value = '';
            return;
        }

        document.getElementById('nombreArchivoVersion').textContent =
            archivo.name;

    });



    // ==========================================
    // CARGAR SEGUIMIENTO DOCUMENTAL
    // ==========================================

    async function cargarSeguimiento() {

        tablaSeguimiento.innerHTML = `
            <tr>
                <td colspan="6" class="estado-tabla">
                    Consultando empleados y documentos...
                </td>
            </tr>
        `;

        try {

            const datos = await respuestaAPI(
                '/api/documentos-lectura/seguimiento'
            );

            datosSeguimiento = datos.seguimiento || [];
            resumenSeguimiento = datos.resumen || {};

            // ACTUALIZAR INDICADORES

            document.getElementById('segTotalEmpleados').textContent =
                resumenSeguimiento.total_empleados || 0;

            document.getElementById('segEmpleadosAlDia').textContent =
                resumenSeguimiento.empleados_al_dia || 0;

            document.getElementById('segEmpleadosPendientes').textContent =
                resumenSeguimiento.empleados_con_pendientes || 0;

            const porcentaje =
                Number(resumenSeguimiento.porcentaje_cumplimiento || 0);

            document.getElementById('segPorcentaje').textContent =
                `${porcentaje.toLocaleString('es-CO')}%`;

            // ACTUALIZAR BARRA DE PROGRESO

            document.getElementById('segBarraProgreso').style.width =
                `${Math.min(100, Math.max(0, porcentaje))}%`;

            document.getElementById('segTextoProgreso').textContent =
                `${resumenSeguimiento.total_leidos || 0} de ${
                    (resumenSeguimiento.total_leidos || 0) +
                    (resumenSeguimiento.total_pendientes || 0)
                } aceptaciones`;

            // CARGAR DOCUMENTOS EN EL FILTRO

            const documentos = [
                ...new Map(
                    datosSeguimiento.map(item => [
                        item.documento_id,
                        {
                            id: item.documento_id,
                            titulo: item.documento
                        }
                    ])
                ).values()
            ];

            filtroSeguimientoDocumento.innerHTML = `
                <option value="">Todos los documentos</option>
                ${documentos.map(documento => `
                    <option value="${Number(documento.id)}">
                        ${escaparHTML(documento.titulo)}
                    </option>
                `).join('')}
            `;

            // DIBUJAR TABLA

            renderizarSeguimiento();

        } catch (error) {

            console.error('ERROR SEGUIMIENTO:', error);

            tablaSeguimiento.innerHTML = `
                <tr>
                    <td colspan="6" class="estado-tabla">
                        ${escaparHTML(error.message)}
                    </td>
                </tr>
            `;

        }

    }


    
    // ==========================================
    // RENDERIZAR SEGUIMIENTO AGRUPADO POR EMPLEADO
    // ==========================================

    function renderizarSeguimiento() {

        const busqueda = filtroBuscarEmpleado.value
            .trim()
            .toLowerCase();

        const documentoSeleccionado =
            filtroSeguimientoDocumento.value;

        const estadoSeleccionado =
            filtroSeguimientoEstado.value;

        // AGRUPAR DOCUMENTOS POR EMPLEADO

        const empleados = new Map();

        datosSeguimiento.forEach(item => {

            if (!empleados.has(item.empleado_id)) {

                empleados.set(item.empleado_id, {
                    empleado_id: item.empleado_id,
                    nombre: item.nombre,
                    codigo: item.codigo,
                    numero_documento: item.numero_documento,
                    documentos: []
                });

            }

            empleados.get(item.empleado_id).documentos.push(item);

        });

        // APLICAR FILTROS A LOS EMPLEADOS

        const filtrados = [...empleados.values()].filter(empleado => {

            const coincideBusqueda = [
                empleado.nombre,
                empleado.codigo,
                empleado.numero_documento
            ].some(valor =>
                String(valor || '').toLowerCase().includes(busqueda)
            );

            const documentosLeidos = empleado.documentos.filter(
                doc => doc.estado_lectura === 'LEIDO'
            ).length;

            const documentosPendientes = empleado.documentos.filter(
                doc => doc.estado_lectura === 'PENDIENTE'
            ).length;

            const alDia = documentosPendientes === 0;

            const coincideEstado =
                !estadoSeleccionado ||
                (estadoSeleccionado === 'AL_DIA' && alDia) ||
                (estadoSeleccionado === 'PENDIENTE' && !alDia);

            const coincideDocumento =
                !documentoSeleccionado ||
                empleado.documentos.some(doc =>
                    String(doc.documento_id) === documentoSeleccionado
                );

            return coincideBusqueda &&
                coincideEstado &&
                coincideDocumento;

        });

        // VALIDAR RESULTADOS

        if (filtrados.length === 0) {

            tablaSeguimiento.innerHTML = '';

            document.getElementById(
                'seguimientoSinResultados'
            ).style.display = 'block';

            return;

        }

        document.getElementById(
            'seguimientoSinResultados'
        ).style.display = 'none';

        // DIBUJAR UNA FILA POR EMPLEADO

        tablaSeguimiento.innerHTML = filtrados.map(empleado => {

            const totalLeidos = empleado.documentos.filter(
                doc => doc.estado_lectura === 'LEIDO'
            ).length;

            const totalPendientes = empleado.documentos.filter(
                doc => doc.estado_lectura === 'PENDIENTE'
            ).length;

            const alDia = totalPendientes === 0;

            return `
                <tr class="fila-empleado-seguimiento">

                    <td>
                        <span class="nombre-empleado">
                            ${escaparHTML(empleado.nombre)}
                        </span>

                        <span class="subtexto">
                            Código: ${escaparHTML(empleado.codigo)}
                        </span>
                    </td>

                    <td>
                        ${escaparHTML(empleado.numero_documento)}
                    </td>

                    <td>
                        <span class="contador-leidos">
                            ${totalLeidos}
                        </span>
                    </td>

                    <td>
                        <span class="contador-pendientes">
                            ${totalPendientes}
                        </span>
                    </td>

                    <td>
                        <span class="estado-lectura ${
                            alDia ? 'leido' : 'pendiente'
                        }">
                            <i class="fa-solid ${
                                alDia ? 'fa-circle-check' : 'fa-clock'
                            }"></i>

                            ${alDia ? 'Al día' : 'Con pendientes'}
                        </span>
                    </td>

                    <td>
                        <button
                            type="button"
                            class="btn-ver-detalle"
                            data-empleado="${Number(empleado.empleado_id)}"
                        >
                            <i class="fa-solid fa-chevron-down"></i>
                            Ver detalle
                        </button>
                    </td>

                </tr>
            `;

        }).join('');

        // GUARDAR EMPLEADOS PARA CONSULTAR SU DETALLE

        window.empleadosSeguimientoActual = filtrados;

    }


    // ==========================================
    // MOSTRAR DOCUMENTOS DE UN EMPLEADO
    // ==========================================

    tablaSeguimiento.addEventListener('click', event => {

        const boton = event.target.closest('.btn-ver-detalle');

        if (!boton) return;

        const empleadoID = Number(boton.dataset.empleado);

        const empleado = (
            window.empleadosSeguimientoActual || []
        ).find(item => Number(item.empleado_id) === empleadoID);

        if (!empleado) return;

        const fila = boton.closest('tr');

        const filaDetalle = fila.nextElementSibling;

        // CERRAR DETALLE SI YA ESTÁ ABIERTO

        if (
            filaDetalle &&
            filaDetalle.classList.contains('fila-detalle-empleado')
        ) {

            filaDetalle.remove();

            boton.innerHTML = `
                <i class="fa-solid fa-chevron-down"></i>
                Ver detalle
            `;

            return;

        }

        // CONSTRUIR DETALLE DE DOCUMENTOS

        const contenido = empleado.documentos.map(doc => {

            const leido = doc.estado_lectura === 'LEIDO';

            return `
                <tr>

                    <td>
                        ${escaparHTML(doc.documento)}
                    </td>

                    <td>
                        V.${escaparHTML(doc.numero_version)}
                    </td>

                    <td>
                        <span class="estado-lectura ${
                            leido ? 'leido' : 'pendiente'
                        }">
                            ${leido ? 'Leído' : 'Pendiente'}
                        </span>
                    </td>

                    <td>
                        ${leido
                            ? formatearFecha(doc.fecha_aceptacion)
                            : '—'
                        }
                    </td>

                </tr>
            `;

        }).join('');

        const detalle = document.createElement('tr');

        detalle.className = 'fila-detalle-empleado';

        detalle.innerHTML = `
            <td colspan="6">

                <div class="contenido-detalle-empleado">

                    <h4>
                        <i class="fa-solid fa-file-circle-check"></i>
                        Documentos de ${escaparHTML(empleado.nombre)}
                    </h4>

                    <table class="tabla-detalle-documentos">

                        <thead>
                            <tr>
                                <th>Documento</th>
                                <th>Versión</th>
                                <th>Estado</th>
                                <th>Fecha de aceptación</th>
                            </tr>
                        </thead>

                        <tbody>
                            ${contenido}
                        </tbody>

                    </table>

                </div>

            </td>
        `;

        fila.after(detalle);

        boton.innerHTML = `
            <i class="fa-solid fa-chevron-up"></i>
            Ocultar detalle
        `;

    });


    // ==========================================
    // EVENTOS DE FILTRADO
    // ==========================================

    filtroBuscarEmpleado.addEventListener(
        'input',
        renderizarSeguimiento
    );

    filtroSeguimientoDocumento.addEventListener(
        'change',
        renderizarSeguimiento
    );

    filtroSeguimientoEstado.addEventListener(
        'change',
        renderizarSeguimiento
    );

    btnActualizarSeguimiento.addEventListener(
        'click',
        cargarSeguimiento
    );



    // ==========================================
    // CARGAR DOCUMENTOS VIGENTES
    // ==========================================

    async function cargarDocumentos() {

        tablaDocumentos.innerHTML = `
            <tr>
                <td colspan="6" class="estado-tabla">
                    Cargando documentos...
                </td>
            </tr>
        `;

        try {

            const datos = await respuestaAPI(
                '/api/documentos-lectura/vigentes'
            );

            documentosActuales = datos.documentos || [];

            document.getElementById('totalDocumentos').textContent =
                documentosActuales.length;

            if (documentosActuales.length === 0) {

                tablaDocumentos.innerHTML = `
                    <tr>
                        <td colspan="6" class="estado-tabla">
                            <i class="fa-regular fa-folder-open"></i>
                            <br><br>
                            Todavía no hay documentos publicados.
                        </td>
                    </tr>
                `;

                return;

            }

            tablaDocumentos.innerHTML = documentosActuales.map(documento => `

                <tr data-tipo="${escaparHTML(documento.tipo_documento || '')}">

                    <td>
    <span class="nombre-documento">
        ${escaparHTML(documento.titulo)}
    </span>

    <span class="subtexto">
        ${escaparHTML(documento.descripcion || 'Sin descripción')}
    </span>
</td>

<td>
    <span class="estado-badge">
        ${escaparHTML(documento.tipo_documento || 'Sin categoría')}
    </span>
</td>

                    <td>
                        V.${escaparHTML(documento.numero_version)}
                    </td>

                    <td>
                        ${formatearFecha(documento.fecha_publicacion)}
                    </td>

                    <td>
                        <span class="estado-badge estado-vigente">
                            Vigente
                        </span>
                    </td>

                    <td>
                       <div class="acciones-tabla">

    <button
        class="btn-accion"
        data-accion="ver"
        data-version="${Number(documento.version_id)}"
        title="Ver PDF"
    >
        <i class="fa-solid fa-eye"></i>
    </button>

    <button
        class="btn-accion btn-version"
        data-accion="version"
        data-documento="${Number(documento.documento_id)}"
        title="Subir nueva versión"
    >
        <i class="fa-solid fa-file-circle-plus"></i>
    </button>

    <button
        class="btn-accion"
        data-accion="retirar"
        data-version="${Number(documento.version_id)}"
        title="Retirar de vigencia"
    >
        <i class="fa-solid fa-box-archive"></i>
    </button>

    <button
    class="btn-accion btn-eliminar-documento"
    data-accion="eliminar"
    data-documento="${Number(documento.documento_id)}"
    title="Eliminar definitivamente"
>
    <i class="fa-solid fa-trash"></i>
</button>

</div>
                    </td>

                </tr>

            `).join('');

        } catch (error) {

            console.error('ERROR DOCUMENTOS:', error);

            tablaDocumentos.innerHTML = `
                <tr>
                    <td colspan="6" class="estado-tabla">
                        ${escaparHTML(error.message)}
                    </td>
                </tr>
            `;

        }

    }


    // ==========================================
    // CARGAR HISTORIAL
    // ==========================================

    async function cargarHistorial() {

        tablaHistorial.innerHTML = `
            <tr>
                <td colspan="9" class="estado-tabla">
                    Cargando historial...
                </td>
            </tr>
        `;

        try {

            const datos = await respuestaAPI(
                '/api/documentos-lectura/historial'
            );

            const historial = datos.historial || [];

            const historicas = historial.filter(
                version => version.estado === 'HISTORICA'
            );

            document.getElementById('totalVersiones').textContent =
                historicas.length ;

            if (historial.length === 0) {

                tablaHistorial.innerHTML = `
                    <tr>
                        <td colspan="9" class="estado-tabla">
                            Todavía no existen versiones registradas.
                        </td>
                    </tr>
                `;

                return;

            }

            tablaHistorial.innerHTML = historial.map(version => {

                let clase = 'estado-historico';
                let texto = 'Histórica';

                if (version.estado === 'VIGENTE') {
                    clase = 'estado-vigente';
                    texto = 'Vigente';
                }

                if (version.estado === 'BORRADOR') {
                    clase = 'estado-borrador';
                    texto = 'Borrador';
                }

                return `

    <tr data-tipo="${escaparHTML(version.tipo_documento || '')}">

        <td>
            <span class="nombre-documento">
                ${escaparHTML(version.titulo)}
            </span>
        </td>

        <td>
    <span class="estado-badge">
        ${escaparHTML(version.tipo_documento || 'Sin categoría')}
    </span>
</td>

<td>
    V.${escaparHTML(version.numero_version)}
</td>

        <td>
            ${formatearFecha(version.fecha_publicacion)}
        </td>

        <td>
            ${escaparHTML(version.publicado_por || 'No disponible')}
        </td>

        <td>
            ${escaparHTML(version.retirado_por || '—')}
        </td>

        <td>
            ${formatearFecha(version.fecha_retiro)}
        </td>

        <td>
            <span class="estado-badge ${clase}">
                ${texto}
            </span>
        </td>

        <td>
            <div class="acciones-tabla">

                <button
                    class="btn-accion"
                    data-accion="ver"
                    data-version="${Number(version.version_id)}"
                    title="Consultar PDF"
                >
                    <i class="fa-solid fa-eye"></i>
                </button>

                ${version.estado === 'BORRADOR' ? `
                    <button
                        class="btn-accion btn-version"
                        data-accion="publicar"
                        data-version="${Number(version.version_id)}"
                        title="Publicar versión"
                    >
                        <i class="fa-solid fa-cloud-arrow-up"></i>
                    </button>
                ` : ''}

            </div>
        </td>

    </tr>

`;

            }).join('');

        } catch (error) {

            console.error('ERROR HISTORIAL:', error);

            tablaHistorial.innerHTML = `
                <tr>
                    <td colspan="9" class="estado-tabla">
                        ${escaparHTML(error.message)}
                    </td>
                </tr>
            `;

        }

    }


    // ==========================================
    // ACCIONES DE LAS TABLAS
    // ==========================================

    document.addEventListener('click', async event => {

        const boton = event.target.closest('[data-accion]');

        if (!boton) return;

        const accion = boton.dataset.accion;

        if (accion === 'ver') {

            const versionID = Number(boton.dataset.version);

            if (!versionID) return;

            window.open(
                `/api/documentos-lectura/${versionID}/archivo`,
                '_blank',
                'noopener'
            );

        }

        if (accion === 'version') {

            const documentoID = Number(boton.dataset.documento);

            const documento = documentosActuales.find(
                item => Number(item.documento_id) === documentoID
            );

            if (!documento) return;

            formVersion.reset();

            document.getElementById('documentoVersionID').value =
                documentoID;

            document.getElementById('nombreDocumentoVersion').textContent =
                documento.titulo;

            document.getElementById('nombreArchivoVersion').textContent =
                'Tamaño máximo: 20 MB';

            abrirModal(modalVersion);

        }


// ==========================================
// ELIMINAR DOCUMENTO DEFINITIVAMENTE
// ==========================================

if (accion === 'eliminar') {

    const documentoID = Number(boton.dataset.documento);

    if (!documentoID) return;

    const confirmar = await Swal.fire({
        title: '¿Eliminar documento definitivamente?',
        text: 'Se eliminarán el documento, todas sus versiones, las aceptaciones de lectura y sus archivos PDF. Esta acción no se puede deshacer.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#dc2626',
        cancelButtonColor: '#64748b',
        reverseButtons: true
    });

    if (!confirmar.isConfirmed) return;

    try {

        const datos = await respuestaAPI(
            `/api/documentos-lectura/${documentoID}`,
            {
                method: 'DELETE'
            }
        );

        await Swal.fire({
            title: 'Documento eliminado',
            text: datos.message,
            icon: 'success',
            confirmButtonColor: '#087B49'
        });

        await cargarTodo();

    } catch (error) {

        console.error('ERROR ELIMINAR DOCUMENTO:', error);

        Swal.fire({
            title: 'Error',
            text: error.message,
            icon: 'error',
            confirmButtonColor: '#087B49'
        });

    }

}

        // ==========================================
// RETIRAR VERSIÓN VIGENTE
// ==========================================

if (accion === 'retirar') {

    const versionID = Number(boton.dataset.version);

    if (!versionID) return;

    const confirmar = confirm(
        '¿Deseas retirar esta versión de vigencia? Los empleados dejarán de verla, pero se conservarán el PDF y las confirmaciones anteriores.'
    );

    if (!confirmar) return;

    try {

        const datos = await respuestaAPI(
            `/api/documentos-lectura/versiones/${versionID}/retirar`,
            {
                method: 'POST'
            }
        );

        alert(datos.message);

        await cargarTodo();

    } catch (error) {

        alert(error.message);

    }

}


// ==========================================
// PUBLICAR VERSIÓN BORRADOR
// ==========================================

if (accion === 'publicar') {

    const versionID = Number(boton.dataset.version);

    if (!versionID) return;

    const confirmar = confirm(
        '¿Deseas publicar esta versión? La versión vigente anterior pasará al historial.'
    );

    if (!confirmar) return;

    try {

        const datos = await respuestaAPI(
            `/api/documentos-lectura/versiones/${versionID}/publicar`,
            {
                method: 'POST'
            }
        );

        alert(datos.message);

        await cargarTodo();

    } catch (error) {

        alert(error.message);

    }

}

    });


    // ==========================================
    // PUBLICAR PRIMER DOCUMENTO
    // ==========================================

    formDocumento.addEventListener('submit', async event => {

        event.preventDefault();

        const archivo = archivoDocumento.files[0];

        if (!validarPDF(archivo)) return;

        const boton = document.getElementById('btnPublicar');

        const formulario = new FormData(formDocumento);

        boton.disabled = true;
        boton.innerHTML = `
            <i class="fa-solid fa-spinner fa-spin"></i>
            Publicando...
        `;

        try {

            const datos = await respuestaAPI(
                '/api/documentos-lectura',
                {
                    method: 'POST',
                    body: formulario
                }
            );

            alert(datos.message || 'Documento publicado correctamente.');

            cerrarModal(modalDocumento);

            formDocumento.reset();

            await cargarTodo();

        } catch (error) {

            console.error('ERROR PUBLICAR:', error);

            alert(error.message);

        } finally {

            boton.disabled = false;

            boton.innerHTML = `
                <i class="fa-solid fa-cloud-arrow-up"></i>
                Publicar documento
            `;

        }

    });


    // ==========================================
    // PUBLICAR NUEVA VERSIÓN
    // ==========================================

    formVersion.addEventListener('submit', async event => {

        event.preventDefault();

        const archivo = archivoVersion.files[0];

        if (!validarPDF(archivo)) return;

        const documentoID = document.getElementById(
            'documentoVersionID'
        ).value;

        const boton = document.getElementById('btnPublicarVersion');

        const formulario = new FormData();

        formulario.append('archivo', archivo);

        boton.disabled = true;

        boton.innerHTML = `
            <i class="fa-solid fa-spinner fa-spin"></i>
            Publicando...
        `;

        try {

            const datos = await respuestaAPI(
                `/api/documentos-lectura/${documentoID}/versiones`,
                {
                    method: 'POST',
                    body: formulario
                }
            );

            alert(
                `${datos.message} Nueva versión: ${datos.version}`
            );

            cerrarModal(modalVersion);

            formVersion.reset();

            await cargarTodo();

        } catch (error) {

            console.error('ERROR NUEVA VERSION:', error);

            alert(error.message);

        } finally {

            boton.disabled = false;

            boton.innerHTML = `
                <i class="fa-solid fa-upload"></i>
                Guardar borrador
            `;

        }

    });


    // ==========================================
    // ACTUALIZAR INFORMACIÓN
    // ==========================================

    async function cargarTodo() {
    await Promise.all([
        cargarDocumentos(),
        cargarHistorial(),
        cargarSeguimiento()
    ]);
}

    document.getElementById('btnActualizar')
        .addEventListener('click', cargarTodo);


    // INICIALIZAR

    cargarTodo();

});
