
document.addEventListener('DOMContentLoaded', () => {

    const lista = document.getElementById('lista-documentos');
    const contador = document.getElementById('contador-documentos');
    const mensajeFinal = document.getElementById('mensaje-final');
    const btnContinuar = document.getElementById('btn-continuar');

    let documentos = [];

    // =========================================
    // ESCAPAR TEXTO HTML
    // =========================================

    function escapar(texto) {
        return String(texto ?? '').replace(/[&<>"']/g, caracter => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        })[caracter]);
    }

    // =========================================
    // CARGAR DOCUMENTOS VIGENTES
    // =========================================

    async function cargarDocumentos() {

        try {

            const respuesta = await fetch(
                '/api/documentos-lectura/vigentes',
                { credentials: 'include' }
            );

            if (respuesta.status === 401) {
                window.location.href = '/login';
                return;
            }

            const resultado = await respuesta.json();

            if (!respuesta.ok || !resultado.success) {
                throw new Error(resultado.message || 'No se pudieron consultar los documentos.');
            }

            documentos = resultado.documentos || [];

            renderizarDocumentos();

        } catch (error) {

            console.error('ERROR CARGANDO DOCUMENTOS:', error);

            contador.textContent = 'No fue posible cargar los documentos.';

            lista.innerHTML = `
                <div class="alerta-error">
                    <p>${escapar(error.message)}</p>
                    <button onclick="location.reload()">Reintentar</button>
                </div>
            `;

        }

    }

    // =========================================
    // MOSTRAR DOCUMENTOS
    // =========================================

    function renderizarDocumentos() {

        lista.innerHTML = '';

        if (documentos.length === 0) {

            contador.textContent = 'No hay documentos pendientes.';
            mostrarFinal();
            return;

        }

        const pendientes = documentos.filter(doc => !doc.aceptacion_id).length;
        const aceptados = documentos.length - pendientes;

        contador.textContent =
            `${aceptados} de ${documentos.length} documentos aceptados`;

        documentos.forEach(doc => {

            const aceptado = Boolean(doc.aceptacion_id);

            const tarjeta = document.createElement('article');

            tarjeta.className = `tarjeta-documento ${aceptado ? 'documento-aceptado' : 'documento-pendiente'}`;

            tarjeta.innerHTML = `
                <div class="documento-cabecera">

                    <div class="documento-icono">
                        <i class="fa-solid fa-file-pdf"></i>
                    </div>

                    <div class="documento-titulo">
                        <span class="documento-categoria">
                            ${escapar(doc.tipo_documento)}
                        </span>

                        <h3>${escapar(doc.titulo)}</h3>

                        <p>${escapar(doc.descripcion || 'Documento empresarial obligatorio.')}</p>
                    </div>

                    <span class="estado-documento">
                        ${aceptado ? 'Aceptado' : 'Pendiente'}
                    </span>

                </div>

                <div class="documento-informacion">
                    <span>
                        <i class="fa-solid fa-code-branch"></i>
                        Versión ${escapar(doc.numero_version)}
                    </span>

                    <span>
                        <i class="fa-regular fa-calendar"></i>
                        ${doc.fecha_publicacion
                            ? new Date(doc.fecha_publicacion).toLocaleDateString('es-CO')
                            : 'Sin fecha'}
                    </span>
                </div>

                <div class="documento-acciones">

                    <button class="btn-ver-documento" type="button">
                        <i class="fa-solid fa-eye"></i>
                        Consultar documento
                    </button>

                    ${
                        aceptado
                        ? `<span class="texto-aceptado">
                                <i class="fa-solid fa-circle-check"></i>
                                Lectura confirmada
                           </span>`
                        : `<span class="texto-pendiente">
                                <i class="fa-solid fa-clock"></i>
                                Requiere aceptación
                           </span>`
                    }

                </div>
            `;

            tarjeta.querySelector('.btn-ver-documento')
                .addEventListener('click', () => abrirDocumento(doc));

            lista.appendChild(tarjeta);

        });

        mostrarFinal();

    }

    // =========================================
    // VISUALIZAR PDF
    // =========================================

    function abrirDocumento(doc) {

        const modal = document.createElement('div');

        modal.className = 'modal-documento';

        modal.innerHTML = `
            <div class="modal-contenido">

                <div class="modal-encabezado">
                    <div>
                        <h2>${escapar(doc.titulo)}</h2>
                        <p>Versión ${escapar(doc.numero_version)}</p>
                    </div>

                    <button class="cerrar-modal" type="button">
                        &times;
                    </button>
                </div>

                <div class="visor-pdf">
                    <iframe
                        title="Documento empresarial"
                        src="/api/documentos-lectura/${encodeURIComponent(doc.version_id)}/archivo"
                    ></iframe>
                </div>

                <div class="modal-pie">

                    <label class="confirmacion-lectura">
                        <input type="checkbox" id="confirmar-lectura">
                        <span>
                            Confirmo que he leído y comprendido
                            el contenido de este documento.
                        </span>
                    </label>

                    <button class="btn-aceptar-documento" disabled>
                        Confirmar lectura y aceptación
                    </button>

                </div>

            </div>
        `;

        document.body.appendChild(modal);

        const cerrar = () => modal.remove();

        modal.querySelector('.cerrar-modal')
            .addEventListener('click', cerrar);

        modal.addEventListener('click', event => {
            if (event.target === modal) cerrar();
        });

        const checkbox = modal.querySelector('#confirmar-lectura');
        const botonAceptar = modal.querySelector('.btn-aceptar-documento');

        checkbox.addEventListener('change', () => {
            botonAceptar.disabled = !checkbox.checked;
        });

        botonAceptar.addEventListener('click', async () => {

            botonAceptar.disabled = true;
            botonAceptar.textContent = 'Registrando aceptación...';

            try {

                const respuesta = await fetch(
                    `/api/documentos-lectura/${encodeURIComponent(doc.documento_id)}/aceptar`,
                    {
                        method: 'POST',
                        credentials: 'include',
                        headers: {
                            'Content-Type': 'application/json'
                        }
                    }
                );

                const resultado = await respuesta.json();

                if (!respuesta.ok || !resultado.success) {
                    throw new Error(resultado.message || 'No se pudo registrar la aceptación.');
                }

                cerrar();

                await cargarDocumentos();

            } catch (error) {

                alert(error.message);

                botonAceptar.disabled = false;
                botonAceptar.textContent = 'Confirmar lectura y aceptación';

            }

        });

    }

    // =========================================
    // VERIFICAR SI TODOS ESTÁN ACEPTADOS
    // =========================================

    function mostrarFinal() {

        const pendientes = documentos.filter(
            doc => !doc.aceptacion_id
        ).length;

        mensajeFinal.hidden = pendientes > 0;

    }

    // =========================================
    // CONTINUAR AL ERP
    // =========================================

    btnContinuar.addEventListener('click', () => {
        window.location.href = '/dashboard';
    });

    // =========================================
    // INICIAR
    // =========================================

    cargarDocumentos();

});
