let capitulosData = [];

document.addEventListener('DOMContentLoaded', async () => {
    console.log("✅ DOM cargado");
    await cargarCapitulos();
});

async function cargarCapitulos() {
    const contenedor = document.getElementById('contenedorCapitulos');
    if (!contenedor) {
        console.error("❌ No se encontró el contenedor");
        return;
    }
    
    contenedor.innerHTML = `
        <div class="text-center p-5">
            <div class="spinner-border text-success" role="status"></div>
            <p class="mt-3">Cargando módulos de inducción...</p>
        </div>
    `;
    
    try {
        const response = await fetch('/api/capitulos-induccion');
        const data = await response.json();
        
        console.log("📦 Respuesta API:", data);
        
        if (data.success && data.capitulos) {
            capitulosData = data.capitulos;
            await renderizarCapitulos(); // Añadimos await para esperar la verificación de firma
        } else {
            contenedor.innerHTML = `
                <div class="alert alert-warning text-center">
                    <i class="fas fa-exclamation-triangle fa-2x mb-2"></i>
                    <p>No se pudieron cargar los capítulos</p>
                    <button class="btn btn-outline-primary btn-sm mt-2" onclick="cargarCapitulos()">
                        <i class="fas fa-sync-alt me-1"></i> Recargar
                    </button>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error:', error);
        contenedor.innerHTML = `
            <div class="alert alert-danger text-center">
                <i class="fas fa-exclamation-circle fa-2x mb-2"></i>
                <p>Error de conexión con el servidor</p>
                <button class="btn btn-outline-danger btn-sm mt-2" onclick="cargarCapitulos()">
                    <i class="fas fa-sync-alt me-1"></i> Reintentar
                </button>
            </div>
        `;
    }
}

async function renderizarCapitulos() {
    const contenedor = document.getElementById('contenedorCapitulos');
    if (!contenedor) return;
    
    if (!capitulosData || capitulosData.length === 0) {
        contenedor.innerHTML = `
            <div class="alert alert-warning text-center">
                <i class="fas fa-exclamation-triangle fa-2x mb-2"></i>
                <p>No hay capítulos disponibles en este momento.</p>
            </div>
        `;
        return;
    }
    
    // Verificar si todos los capítulos están aprobados
    const todosAprobados = capitulosData.every(c => c.aprobado === 1);
    console.log("Todos aprobados?", todosAprobados);
    
    if (todosAprobados && capitulosData.length > 0) {
        // Verificar si ya firmó - llamada síncrona con await
        let yaFirmo = false;
        try {
            const firmaResponse = await fetch('/api/obtener-firma');
            const firmaResult = await firmaResponse.json();
            console.log("Respuesta de firma:", firmaResult);
            if (firmaResult.success && firmaResult.firma) {
                yaFirmo = true;
            }
        } catch(e) {
            console.log("Error al verificar firma:", e);
        }
        
        console.log("¿Ya firmó?", yaFirmo);
        
        let botonesHtml = '';
        
        if (yaFirmo) {
            // Si ya firmó, mostrar botón para ver certificado
            botonesHtml = `
                <div class="d-flex justify-content-center gap-3 mt-4 flex-wrap">
                    <button class="btn-degradado" onclick="irACertificado()">
                        <i class="fas fa-certificate me-2"></i>Ver Certificado
                    </button>
                    <button class="btn-degradado" onclick="irADashboard()">
                        <i class="fas fa-home me-2"></i>Ir al Inicio
                    </button>
                </div>
            `;
        } else {
            // Si NO ha firmado, mostrar SOLO botón de firmar
            botonesHtml = `
                <div class="d-flex justify-content-center gap-3 mt-4 flex-wrap">
                    <button class="btn-degradado" onclick="irAFirma()">
                        <i class="fas fa-signature me-2"></i>Firmar Digitalmente
                    </button>
                    <button class="btn-degradado" onclick="irADashboard()">
                        <i class="fas fa-home me-2"></i>Ir al Inicio
                    </button>
                </div>
            `;
        }
        
        contenedor.innerHTML = `
            <div class="modulo-item text-center">
                <i class="fas fa-trophy fa-5x text-warning mb-4"></i>
                <h3 class="text-success" style="font-size: 2rem;">¡Inducción Completada!</h3>
                <p class="text-muted" style="font-size: 1.1rem;">Has aprobado todos los módulos de inducción.</p>
                <div class="alert alert-success mt-3" style="padding: 20px; font-size: 1rem;">
                    <i class="fas fa-check-circle me-2"></i>
                    Felicitaciones, has completado exitosamente el plan de inducción obligatoria.
                </div>
                ${botonesHtml}
            </div>
        `;
        return;
    }
    
    // Resto del código para mostrar módulos no completados...
    let html = '';
    
    for (const capitulo of capitulosData) {
        const videosCompletados = capitulo.videos_vistos || 0;
        const totalVideos = capitulo.total_videos || 0;
        const porcentajeVideos = totalVideos > 0 ? (videosCompletados / totalVideos) * 100 : 0;
        const videosCompletos = videosCompletados === totalVideos && totalVideos > 0;
        
        const evaluacionAprobada = capitulo.aprobado === 1;
        const evaluacionReprobada = capitulo.aprobado === 0 && capitulo.nota !== null;
        
        let botonEvaluacionHtml = '';
        let estadoEvaluacionHtml = '';
        
        if (evaluacionAprobada) {
            estadoEvaluacionHtml = `
                <div class="mt-3 text-center">
                    <span class="badge bg-success fs-6 p-2">
                        <i class="fas fa-check-circle me-1"></i> Evaluación Aprobada (${capitulo.nota}%)
                    </span>
                </div>
            `;
            botonEvaluacionHtml = '';
        } else if (evaluacionReprobada) {
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
            estadoEvaluacionHtml = `
                <div class="mt-3 text-center">
                    <span class="badge bg-secondary fs-6 p-2">
                        <i class="fas fa-clock me-1"></i> Evaluación Pendiente
                    </span>
                </div>
            `;
            botonEvaluacionHtml = `
                <div class="text-center mt-2">
                    <button class="btn-degradado" onclick="irAEvaluacion(${capitulo.id})" ${!videosCompletos ? 'disabled' : ''}>
                        <i class="fas fa-pencil-alt me-1"></i> ${!videosCompletos ? 'Complete los videos primero' : 'Realizar Evaluación'}
                    </button>
                </div>
            `;
        }
        
        html += `
            <div class="modulo-item mb-4">
                <h3>${capitulo.titulo || 'Sin título'}</h3>
                ${estadoEvaluacionHtml}
                
                <div class="mb-3 mt-3">
                    <div class="d-flex justify-content-between mb-1">
                        <small class="text-muted">Progreso de videos</small>
                        <small class="text-muted">${videosCompletados}/${totalVideos} videos vistos</small>
                    </div>
                    <div class="progress" style="height: 8px;">
                        <div class="progress-bar" style="width: ${porcentajeVideos}%"></div>
                    </div>
                </div>
                
                <div id="subcapitulos-${capitulo.id}">
                    <div class="text-center py-3">
                        <div class="spinner-border spinner-border-sm text-success" role="status"></div>
                        <span class="ms-2 text-muted">Cargando videos...</span>
                    </div>
                </div>
                
                ${botonEvaluacionHtml}
            </div>
        `;
    }
    
    contenedor.innerHTML = html;
    
    for (const capitulo of capitulosData) {
        cargarSubCapitulos(capitulo.id);
    }
}

async function cargarSubCapitulos(capituloId) {
    try {
        const response = await fetch(`/api/sub-capitulos/${capituloId}`);
        const data = await response.json();
        
        const container = document.querySelector(`#subcapitulos-${capituloId}`);
        if (!container) return;
        
        if (data.success && data.sub_capitulos && data.sub_capitulos.length > 0) {
            let html = '';
            for (const sub of data.sub_capitulos) {
                const visto = sub.visto === 1;
                const videoUrl = sub.video_url || `../videos/${sub.video_file}`;
                
                html += `
                    <div class="video-fila ${visto ? 'visto' : ''}">
                        <div class="video-titulo">
                            <i class="fas fa-video me-2"></i> ${sub.titulo || 'Sin título'}
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
            }
            container.innerHTML = html;
        } else {
            container.innerHTML = '<div class="alert alert-info small">No hay videos disponibles</div>';
        }
    } catch (error) {
        console.error('Error cargando videos:', error);
        const container = document.querySelector(`#subcapitulos-${capituloId}`);
        if (container) {
            container.innerHTML = '<div class="alert alert-danger small">Error al cargar videos</div>';
        }
    }
}

// Variables globales para el modal
let videoModalInstance = null;
let currentSubCapituloId = null;
let currentCapituloId = null;

function verVideo(subCapituloId, capituloId, videoUrl) {
    currentSubCapituloId = subCapituloId;
    currentCapituloId = capituloId;
    
    const videoPlayer = document.getElementById('videoPlayer');
    const videoSource = document.getElementById('videoSource');
    const btnConfirmar = document.getElementById('btnConfirmarVisto');
    
    videoSource.src = videoUrl;
    videoPlayer.load();
    
    btnConfirmar.disabled = false;
    btnConfirmar.innerHTML = 'MARCAR COMO VISTO';
    btnConfirmar.classList.remove('btn-success');
    btnConfirmar.classList.add('btn-secondary');
    
    if (videoModalInstance) {
        videoModalInstance.dispose();
    }
    const modalElement = document.getElementById('videoModal');
    videoModalInstance = new bootstrap.Modal(modalElement);
    videoModalInstance.show();
    
    const marcarHabilitado = () => {
        btnConfirmar.disabled = false;
        btnConfirmar.classList.remove('btn-secondary');
        btnConfirmar.classList.add('btn-success');
        btnConfirmar.innerHTML = '✓ MARCAR COMO VISTO';
    };
    
    videoPlayer.addEventListener('ended', marcarHabilitado, { once: true });
    videoPlayer.addEventListener('timeupdate', function onTimeUpdate() {
        if (videoPlayer.duration && videoPlayer.currentTime / videoPlayer.duration >= 0.9) {
            marcarHabilitado();
            videoPlayer.removeEventListener('timeupdate', onTimeUpdate);
        }
    });
}

async function marcarVideoComoVisto() {
    if (!currentSubCapituloId) return;
    
    const btnConfirmar = document.getElementById('btnConfirmarVisto');
    btnConfirmar.disabled = true;
    btnConfirmar.innerHTML = '<i class="fas fa-spinner fa-spin me-1"></i> GUARDANDO...';
    
    try {
        const response = await fetch('/api/marcar-visto', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sub_capitulo_id: currentSubCapituloId })
        });
        
        const result = await response.json();
        
        if (result.success) {
            if (videoModalInstance) {
                videoModalInstance.hide();
            }
            await cargarCapitulos();
        } else {
            alert('Error al marcar el video como visto');
            btnConfirmar.disabled = false;
            btnConfirmar.innerHTML = 'MARCAR COMO VISTO';
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error de conexión');
        btnConfirmar.disabled = false;
        btnConfirmar.innerHTML = 'MARCAR COMO VISTO';
    }
}

function detenerVideo() {
    const videoPlayer = document.getElementById('videoPlayer');
    if (videoPlayer) {
        videoPlayer.pause();
    }
}

function irAEvaluacion(capituloId) {
    window.location.href = `/evaluacion?id=${capituloId}`;
}

function irAFirma() {
    window.location.href = '/firma';
}

function irACertificado() {
    console.log("👉 yendo a certificado");
    window.location.href = '/certificado';
}

function irADashboard() {
    window.location.href = '/dashboard';
}

document.addEventListener('DOMContentLoaded', () => {
    const btnConfirmar = document.getElementById('btnConfirmarVisto');
    if (btnConfirmar) {
        btnConfirmar.onclick = marcarVideoComoVisto;
    }
});



/* 🔥 MODO PRUEBA (SIN VIDEO) */
document.addEventListener("click", function(e) {

    // 👇 ESTE ES EL BOTÓN REAL QUE USAS
    if (e.target && e.target.id === "btnConfirmarVisto") {

        alert("Marcado como visto (modo prueba)");

        // 🔥 simulamos guardado sin video
        if (videoModalInstance) {
            videoModalInstance.hide();
        }

        // 🔥 recarga para que avance módulos
        cargarCapitulos();
    }

});