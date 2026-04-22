let capitulosData = [];

document.addEventListener('DOMContentLoaded', async () => {
    await cargarCapitulos();
});

async function cargarCapitulos() {
    try {
        const response = await fetch('/api/capitulos-induccion');
        const data = await response.json();
        
        if (data.success) {
            capitulosData = data.capitulos;
            renderizarCapitulos();
        } else {
            mostrarError('No se pudieron cargar los capítulos');
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarError('Error de conexión con el servidor');
    }
}

function renderizarCapitulos() {
    const contenedor = document.getElementById('contenedorCapitulos');
    if (!contenedor) return;
    
    if (capitulosData.length === 0) {
        contenedor.innerHTML = '<div class="alert alert-info">No hay capítulos disponibles</div>';
        return;
    }
    
    let html = '';
    
    capitulosData.forEach(capitulo => {
        const videosCompletados = capitulo.videos_vistos || 0;
        const totalVideos = capitulo.total_videos || 0;
        const porcentajeVideos = totalVideos > 0 ? (videosCompletados / totalVideos) * 100 : 0;
        const videosCompletos = videosCompletados === totalVideos && totalVideos > 0;
        
        // Estado de la evaluación
        const evaluacionAprobada = capitulo.aprobado === 1;
        const evaluacionReprobada = capitulo.aprobado === 0 && capitulo.nota !== null;
        const evaluacionPendiente = capitulo.aprobado === null;
        
        // Determinar qué mostrar
        let botonEvaluacionHtml = '';
        let estadoEvaluacionHtml = '';
        
        if (evaluacionAprobada) {
            // ✅ EVALUACIÓN APROBADA - No mostrar botón, mostrar "Aprobado"
            estadoEvaluacionHtml = `
                <div class="mt-3 text-center">
                    <span class="badge bg-success fs-6 p-2">
                        <i class="fas fa-check-circle me-1"></i> Evaluación Aprobada (${capitulo.nota}%)
                    </span>
                </div>
            `;
            botonEvaluacionHtml = '';
        } else if (evaluacionReprobada) {
            // ❌ EVALUACIÓN REPROBADA - Mostrar botón para reintentar
            estadoEvaluacionHtml = `
                <div class="mt-3 text-center">
                    <span class="badge bg-danger fs-6 p-2 mb-2">
                        <i class="fas fa-times-circle me-1"></i> Evaluación Reprobada (${capitulo.nota}%)
                    </span>
                </div>
            `;
            botonEvaluacionHtml = `
                <div class="text-center mt-2">
                    <button class="btn btn-warning btn-sm" onclick="irAEvaluacion(${capitulo.id})">
                        <i class="fas fa-redo-alt me-1"></i> Reintentar Evaluación
                    </button>
                </div>
            `;
        } else {
            // ⏳ EVALUACIÓN PENDIENTE - Mostrar botón normal
            estadoEvaluacionHtml = `
                <div class="mt-3 text-center">
                    <span class="badge bg-secondary fs-6 p-2">
                        <i class="fas fa-clock me-1"></i> Evaluación Pendiente
                    </span>
                </div>
            `;
            botonEvaluacionHtml = `
                <div class="text-center mt-2">
                    <button class="btn btn-degradado btn-sm" onclick="irAEvaluacion(${capitulo.id})" ${!videosCompletos ? 'disabled' : ''}>
                        <i class="fas fa-pencil-alt me-1"></i> ${!videosCompletos ? 'Complete los videos primero' : 'Realizar Evaluación'}
                    </button>
                </div>
            `;
        }
        
        html += `
            <div class="card-custom mb-4" data-capitulo-id="${capitulo.id}">
                <div class="card-header-custom">
                    <h3 class="mb-2">${capitulo.titulo}</h3>
                    ${estadoEvaluacionHtml}
                </div>
                <div class="card-body-custom">
                    <!-- Barra de progreso de videos -->
                    <div class="mb-3">
                        <div class="d-flex justify-content-between mb-1">
                            <small class="text-muted">Progreso de videos</small>
                            <small class="text-muted">${videosCompletados}/${totalVideos} videos vistos</small>
                        </div>
                        <div class="progress" style="height: 8px;">
                            <div class="progress-bar bg-success" style="width: ${porcentajeVideos}%"></div>
                        </div>
                    </div>
                    
                    <!-- Lista de videos/subcapítulos -->
                    <div id="subcapitulos-${capitulo.id}">
                        <div class="text-center py-3">
                            <div class="spinner-border spinner-border-sm text-success" role="status"></div>
                            <span class="ms-2 text-muted">Cargando videos...</span>
                        </div>
                    </div>
                    
                    ${botonEvaluacionHtml}
                </div>
            </div>
        `;
    });
    
    contenedor.innerHTML = html;
    
    // Cargar los videos de cada capítulo
    capitulosData.forEach(capitulo => {
        cargarSubCapitulos(capitulo.id);
    });
}

async function cargarSubCapitulos(capituloId) {
    try {
        const response = await fetch(`/api/sub-capitulos/${capituloId}`);
        const data = await response.json();
        
        if (data.success) {
            renderizarSubCapitulos(capituloId, data.sub_capitulos);
        }
    } catch (error) {
        console.error('Error al cargar subcapítulos:', error);
        const container = document.querySelector(`#subcapitulos-${capituloId}`);
        if (container) {
            container.innerHTML = '<div class="alert alert-danger small">Error al cargar videos</div>';
        }
    }
}

function renderizarSubCapitulos(capituloId, subCapitulos) {
    const container = document.querySelector(`#subcapitulos-${capituloId}`);
    if (!container) return;
    
    if (!subCapitulos || subCapitulos.length === 0) {
        container.innerHTML = '<div class="alert alert-info small">No hay videos disponibles</div>';
        return;
    }
    
    let html = '<div class="list-group list-group-flush">';
    
    subCapitulos.forEach(sub => {
        const visto = sub.visto === 1;
        const videoUrl = sub.video_url || `../videos/${sub.video_file}`;
        
        html += `
            <div class="video-fila ${visto ? 'visto' : ''}" data-sub-id="${sub.id}">
                <div class="video-info flex-grow-1">
                    <div class="fw-bold">${sub.titulo}</div>
                    ${sub.descripcion ? `<small class="text-muted">${sub.descripcion}</small>` : ''}
                </div>
                <div class="video-acciones">
                    ${!visto ? `
                        <button class="btn-ver-video" onclick="verVideo(${sub.id}, ${capituloId}, '${videoUrl}')">
                            <i class="fas fa-play me-1"></i> Ver video
                        </button>
                    ` : `
                        <span class="badge bg-success">
                            <i class="fas fa-check-circle"></i> Completado
                        </span>
                    `}
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    container.innerHTML = html;
}

function verVideo(subCapituloId, capituloId, videoUrl) {
    // Abrir modal o ventana para ver el video
    const modalHtml = `
        <div class="modal fade" id="videoModal" tabindex="-1" data-bs-backdrop="static">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header bg-success text-white">
                        <h5 class="modal-title">Reproduciendo video</h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body p-0">
                        <video id="videoPlayer" src="${videoUrl}" class="w-100" controls autoplay style="max-height: 70vh;"></video>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-success" id="btnMarcarVisto" disabled>
                            <i class="fas fa-check-circle me-1"></i> Marcar como visto
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Remover modal existente si hay
    const existingModal = document.getElementById('videoModal');
    if (existingModal) existingModal.remove();
    
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    
    const modal = new bootstrap.Modal(document.getElementById('videoModal'));
    modal.show();
    
    const video = document.getElementById('videoPlayer');
    const btnMarcarVisto = document.getElementById('btnMarcarVisto');
    
    // Habilitar botón cuando termine el video o cuando lleve 90% reproducido
    video.addEventListener('timeupdate', () => {
        if (video.duration && video.currentTime / video.duration >= 0.9) {
            btnMarcarVisto.disabled = false;
        }
    });
    
    // También habilitar si termina
    video.addEventListener('ended', () => {
        btnMarcarVisto.disabled = false;
    });
    
    btnMarcarVisto.onclick = async () => {
        try {
            const response = await fetch('/api/marcar-visto', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sub_capitulo_id: subCapituloId })
            });
            
            const result = await response.json();
            
            if (result.success) {
                modal.hide();
                // Recargar los datos para actualizar el estado
                await cargarCapitulos();
            } else {
                alert('Error al marcar el video como visto');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Error de conexión');
        }
    };
    
    // Limpiar modal al cerrar
    document.getElementById('videoModal').addEventListener('hidden.bs.modal', () => {
        video.pause();
        document.getElementById('videoModal').remove();
    });
}

function irAEvaluacion(capituloId) {
    window.location.href = `/evaluacion?id=${capituloId}`;
}

function mostrarError(mensaje) {
    const contenedor = document.getElementById('contenedorCapitulos');
    if (contenedor) {
        contenedor.innerHTML = `
            <div class="alert alert-danger text-center">
                <i class="fas fa-exclamation-triangle fa-2x mb-2"></i>
                <p>${mensaje}</p>
                <button class="btn btn-outline-danger btn-sm" onclick="cargarCapitulos()">
                    <i class="fas fa-sync-alt me-1"></i> Reintentar
                </button>
            </div>
        `;
    }
}