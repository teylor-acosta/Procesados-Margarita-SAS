
document.addEventListener('DOMContentLoaded', () => {

    // ==========================================
    // ELEMENTOS
    // ==========================================

    const modalDocumento = document.getElementById('modalDocumento');
    const modalVersion = document.getElementById('modalVersion');

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

    document.getElementById('cancelarVersion')
        .addEventListener('click', () => cerrarModal(modalVersion));

    [modalDocumento, modalVersion].forEach(modal => {

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
                historicas.lengtno ;

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
            cargarHistorial()
        ]);

    }

    document.getElementById('btnActualizar')
        .addEventListener('click', cargarTodo);


    // INICIALIZAR

    cargarTodo();

});
