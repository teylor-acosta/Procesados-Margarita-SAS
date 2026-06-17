/* ==========================================================================
   🌿 ERP GLOBAL - CONTROLADOR DINÁMICO DE INDUCCIÓN Y SESIÓN SEGURA (V3)
   ========================================================================== */

let capitulosData = [];

// Variables globales para el modal y control de videos
let videoModalInstance = null;
let currentSubCapituloId = null;
let currentCapituloId = null;

document.addEventListener('DOMContentLoaded', async () => {
    console.log("✅ DOM cargado e inicializando módulos...");
    
    // Inicializar controles responsivos y de identidad del Sidebar Lateral
    inicializarSidebar();
    
    // Cargar los módulos principales de la inducción
    await cargarCapitulos();

    // Inicializador de clics estáticos para el modal de video
    const btnConfirmar = document.getElementById('btnConfirmarVisto');
    if (btnConfirmar) {
        btnConfirmar.onclick = marcarVideoComoVisto;
    }
});

/**
 * ==========================================================================
 * 🔒 LÓGICA DE CONTROL, SEGURIDAD Y NAVEGACIÓN DEL SIDEBAR
 * ==========================================================================
 */
function inicializarSidebar() {
    console.log("🔒 Inicializando Menú Lateral ERP...");

    const sidebar = document.getElementById("sidebar");
    const overlay = document.getElementById("sidebarOverlay");
    const btnOpen = document.getElementById("btnOpenSidebar");

    // 📱 1. Control de Apertura Responsiva (Botón hamburguesa)
    if (btnOpen) {
        btnOpen.onclick = function (e) {
            e.stopPropagation();
            if (sidebar) sidebar.classList.add("active");
            if (overlay) overlay.classList.add("active");
        };
    }

    // 📱 2. Control de Cierre Directo (Clic en la capa oscura trasera)
    if (overlay) {
        overlay.onclick = function () {
            if (sidebar) sidebar.classList.remove("active");
            if (overlay) overlay.classList.remove("active");
        };
    }

    // 📱 3. Control de Clic Externo (Cierra si hacen clic fuera del contenedor menú)
    document.addEventListener("click", function (evento) {
        if (sidebar && sidebar.classList.contains("active")) {
            const tocoSidebar = sidebar.contains(evento.target);
            const tocoBoton = btnOpen && btnOpen.contains(evento.target);
            
            if (!tocoSidebar && !tocoBoton) {
                sidebar.classList.remove("active");
                if (overlay) overlay.classList.remove("active");
            }
        }
    });

    // 📡 4. Carga Dinámica Segura de Datos de Sesión (Previene Fuga de Identidades)
    const nameEl = document.getElementById("sbUserName") || document.getElementById("user-name-sidebar");
    const roleEl = document.getElementById("sbUserRole") || document.getElementById("user-role-sidebar");
    const titleWelcomeEl = document.getElementById("user-welcome-title");

    // Extraemos de forma prioritaria el token para validar la cabecera HTTP
    const token = sessionStorage.getItem('token') || localStorage.getItem('token');

    if (!token) {
        console.warn("Acceso denegado: No se detectó token de sesión activa. Redirigiendo...");
        bloquearInterfazPorFaltaDeSesion();
        return;
    }

    fetch('/api/perfil', {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    })
    .then(response => {
        if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
        return response.json();
    })
    .then(datos => {
        if (!datos) return;
        const nombreFinal = datos.nombre_completo || datos.nombre || "Usuario";
        const puestoFinal = datos.puesto || datos.rol || datos.role || "Operario";

        // Inyección dinámica limpia en el Sidebar
        if (nameEl) nameEl.textContent = nombreFinal;
        if (roleEl) roleEl.textContent = puestoFinal;
        
        // Inyección en el saludo de bienvenida principal
        if (titleWelcomeEl) titleWelcomeEl.textContent = `¡Hola, ${nombreFinal}!`;
    })
    .catch((error) => {
        console.log("⚠️ Falló api/perfil o ruta no encontrada (404). Activando contingencia local aislada.");
        
        // MODO SEGURO CORREGIDO:
        // Si el backend no responde (404), extraemos dinámicamente los datos del usuario que inició sesión.
        const usuarioLocalRaw = sessionStorage.getItem('usuario') || localStorage.getItem('usuario');
        
        if (usuarioLocalRaw) {
            try {
                const usuarioLocal = JSON.parse(usuarioLocalRaw);
                const nombreLocal = usuarioLocal.nombre || usuarioLocal.nombre_completo || "Usuario Activo";
                const puestoLocal = usuarioLocal.rol || usuarioLocal.puesto || usuarioLocal.role || "Operario";

                if (nameEl) nameEl.textContent = nombreLocal;
                if (roleEl) roleEl.textContent = puestoLocal;
                if (titleWelcomeEl) titleWelcomeEl.textContent = `¡Hola, ${nombreLocal}!`;
                
                console.log(`✅ Datos de respaldo aplicados con éxito para: ${nombreLocal}`);
            } catch (e) {
                console.error("Error al procesar el JSON del usuario local:", e);
                bloquearInterfazPorFaltaDeSesion();
            }
        } else {
            bloquearInterfazPorFaltaDeSesion();
        }
    });
}

/**
 * 🔒 Limpia e interrumpe la interfaz si la identidad no es legítima
 */
function bloquearInterfazPorFaltaDeSesion() {
    const contenedorPerfil = document.querySelector('.user-profile-box');
    if (contenedorPerfil) {
        contenedorPerfil.innerHTML = `
            <div style="color: #dc3545; padding: 5px; font-size: 13px; font-weight: bold; text-align: center;">
                <i class="fas fa-exclamation-triangle"></i> Error de Autenticación
            </div>
        `;
    }
    console.error("Falta de credenciales del usuario actual. Redirigiendo al Login.");
    window.location.href = '/login.html';
}

/**
 * ==========================================================================
 * 📦 LOGICA DEL PLAN DE INDUCCIÓN (CARGA Y RENDERIZACIÓN)
 * ==========================================================================
 */
async function cargarCapitulos() {
    const contenedor = document.getElementById('contenedorCapitulos');
    if (!contenedor) {
        console.error("❌ No se encontró el contenedor de capítulos");
        return;
    }
    
    contenedor.innerHTML = `
        <div class="text-center p-5">
            <div class="spinner-border text-success" role="status"></div>
            <p class="mt-3">Cargando módulos de inducción corporativa...</p>
        </div>
    `;
    
    try {
        const token = sessionStorage.getItem('token') || localStorage.getItem('token');
        const response = await fetch('/api/capitulos-induccion', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        
        console.log("📦 Capítulos cargados con éxito:", data);
        
        if (data.success && data.capitulos) {
            capitulosData = data.capitulos;
            await renderizarCapitulos(); 
        } else {
            contenedor.innerHTML = `
                <div class="alert alert-warning text-center">
                    <i class="fas fa-exclamation-triangle fa-2x mb-2"></i>
                    <p>No se pudieron mapear tus capítulos asignados.</p>
                    <button class="btn btn-outline-primary btn-sm mt-2" onclick="cargarCapitulos()">
                        <i class="fas fa-sync-alt me-1"></i> Recargar
                    </button>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error de comunicación con la API de capítulos:', error);
        contenedor.innerHTML = `
            <div class="alert alert-danger text-center">
                <i class="fas fa-exclamation-circle fa-2x mb-2"></i>
                <p>Error de conexión con el servidor central</p>
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
                <p>No hay capítulos de SST cargados en este momento.</p>
            </div>
        `;
        return;
    }
    
    const todosAprobados = capitulosData.every(c => {
        if (c.id === 1) return true;
        return c.aprobado === 1;
    });
    
    if (todosAprobados && capitulosData.length > 0) {
        let yaFirmo = false;

        try {
            const token = sessionStorage.getItem('token') || localStorage.getItem('token');
            const responseFirma = await fetch('/api/induccion-completada', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const dataFirma = await responseFirma.json();
            yaFirmo = dataFirma.firmado === true;
        } catch(e) {
            console.log("Error validando firma digital de inducción:", e);
        }
        
        let botonesHtml = '';
        
        if (yaFirmo) {
            botonesHtml = `
                <div class="d-flex justify-content-center gap-3 mt-4 flex-wrap">
                    <button class="btn-degradado" onclick="irACertificado()">
                        <i class="fas fa-certificate me-2"></i>Ver Certificado
                    </button>
                    <button class="btn-degradado" onclick="window.location.href='/perfil'">
                        <i class="fas fa-user-circle me-2"></i>Ir a mi Perfil
                    </button>
                </div>
            `;
        } else {
            botonesHtml = `
                <div class="d-flex justify-content-center gap-3 mt-4 flex-wrap">
                    <button class="btn-degradado" onclick="irAFirma()">
                        <i class="fas fa-signature me-2"></i>Firmar Digitalmente
                    </button>
                    <button class="btn-degradado" onclick="window.location.href='/perfil'">
                        <i class="fas fa-user-circle me-2"></i>Ir a mi Perfil
                    </button>
                </div>
            `;
        }
        
        contenedor.innerHTML = `
            <div class="modulo-item text-center">
                <i class="fas fa-trophy fa-5x text-warning mb-4"></i>
                <h3 class="text-success" style="font-size: 2rem;">¡Inducción Completada!</h3>
                <p class="text-muted" style="font-size: 1.1rem;">Has aprobado satisfactoriamente todos los módulos.</p>
                <div class="alert alert-success mt-3" style="padding: 20px; font-size: 1rem;">
                    <i class="fas fa-check-circle me-2"></i>
                    Felicitaciones, has completado exitosamente el plan de inducción obligatoria.
                </div>
                ${botonesHtml}
            </div>
        `;
        return;
    }
    
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

        if (capitulo.id === 1) {
            if (videosCompletos) {
                estadoEvaluacionHtml = `
                    <div class="mt-3 text-center">
                        <span class="badge bg-success fs-6 p-2">
                            <i class="fas fa-check-circle me-1"></i> Bienvenida completada
                        </span>
                    </div>
                `;
            } else {
                estadoEvaluacionHtml = `
                    <div class="mt-3 text-center">
                        <span class="badge bg-secondary fs-6 p-2">
                            <i class="fas fa-clock me-1"></i> Video obligatorio pendiente
                        </span>
                    </div>
                `;
            }
            botonEvaluacionHtml = '';
        } else if (evaluacionAprobada) {
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
                        <i class="fas fa-pencil-alt me-1"></i>
                        ${!videosCompletos ? 'Complete los videos primero' : 'Realizar Evaluación'}
                    </button>
                </div>
            `;
        }
        
        html += `
            <div class="modulo-item mb-4">
                <h3>${capitulo.titulo || 'Módulo sin título'}</h3>
                ${estadoEvaluacionHtml}
                
                <div class="mb-3 mt-3">
                    <div class="d-flex justify-content-between mb-1">
                        <small class="text-muted">Progreso del módulo</small>
                        <small class="text-muted">${videosCompletados}/${totalVideos} videos vistos</small>
                    </div>
                    <div class="progress" style="height: 8px;">
                        <div class="progress-bar-custom" style="width: ${porcentajeVideos}%"></div>
                    </div>
                </div>
                
                <div id="subcapitulos-${capitulo.id}">
                    <div class="text-center py-3">
                        <div class="spinner-border spinner-border-sm text-success" role="status"></div>
                        <span class="ms-2 text-muted">Mapeando recursos de video...</span>
                    </div>
                </div>
                
                ${botonEvaluacionHtml}
            </div>
        `;
    }
    
    contenedor.innerHTML = html;
    
    // Disparar la carga secuencial de videos de cada capítulo
    for (const capitulo of capitulosData) {
        cargarSubCapitulos(capitulo.id);
    }
}

async function cargarSubCapitulos(capituloId) {
    try {
        const token = sessionStorage.getItem('token') || localStorage.getItem('token');
        const response = await fetch(`/api/sub-capitulos/${capituloId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        
        const container = document.querySelector(`#subcapitulos-${capituloId}`);
        if (!container) return;
        
        if (data.success && data.sub_capitulos && data.sub_capitulos.length > 0) {
            let html = '';
            for (const sub of data.sub_capitulos) {
                const visto = sub.visto === 1;
                const videoUrl = sub.url_video;
                
                html += `
                    <div class="video-fila ${visto ? 'visto' : ''}">
                        <div class="video-titulo">
                            <i class="fas fa-video me-2" style="color: ${visto ? '#198754' : '#6c757d'}"></i> ${sub.titulo || 'Multimedia'}
                        </div>
                        <div class="video-acciones">
                            ${!visto ? `
                                <button class="btn-ver-video" onclick="verVideo(${sub.id}, ${capituloId}, '${videoUrl}')">
                                    <i class="fas fa-play me-1"></i> Ver video
                                </button>
                            ` : `
                                <span class="badge bg-success">
                                    <i class="fas fa-check-circle"></i> Visto
                                </span>
                            `}
                        </div>
                    </div>
                `;
            }
            container.innerHTML = html;
        } else {
            container.innerHTML = '<div class="alert alert-info small m-0">No hay videos asignados a este eje temático.</div>';
        }
    } catch (error) {
        console.error(`Error cargando subcapitulos para ID ${capituloId}:`, error);
        const container = document.querySelector(`#subcapitulos-${capituloId}`);
        if (container) {
            container.innerHTML = '<div class="alert alert-danger small m-0">Error técnico al renderizar videos.</div>';
        }
    }
}

function verVideo(subCapituloId, capituloId, videoUrl) {
    currentSubCapituloId = subCapituloId;
    currentCapituloId = capituloId;
    
    const videoPlayer = document.getElementById('videoPlayer');
    const videoSource = document.getElementById('videoSource');
    const btnConfirmar = document.getElementById('btnConfirmarVisto');
    
    if(!videoPlayer || !btnConfirmar) return;

    videoSource.src = videoUrl;
    videoPlayer.load();
    
    btnConfirmar.disabled = true;
    btnConfirmar.innerHTML = 'Debe visualizar el video instructivo';
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
    btnConfirmar.innerHTML = '<i class="fas fa-spinner fa-spin me-1"></i> GUARDANDO PROGRESO...';

    try {
        const token = sessionStorage.getItem('token') || localStorage.getItem('token');
        const response = await fetch('/api/marcar-visto', {
            method: 'POST',
            credentials: 'include',
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json' 
            },
            body: JSON.stringify({ sub_capitulo_id: currentSubCapituloId })
        });

        if (response.status === 401) {
            alert('Su sesión expiró. Por favor reingrese al sistema.');
            window.location.href = '/login.html';
            return;
        }

        const result = await response.json();

        if (result.success) {
            const videoPlayer = document.getElementById('videoPlayer');
            if (videoPlayer) {
                const videoSource = document.getElementById('videoSource');
                videoPlayer.pause();
                videoPlayer.currentTime = 0;
                if (videoSource) videoSource.src = '';
                videoPlayer.load();
            }

            if (videoModalInstance) {
                videoModalInstance.hide();
            }
            await cargarCapitulos();
        } else {
            alert(result.message || 'Error al guardar progreso en la base de datos');
            btnConfirmar.disabled = false;
            btnConfirmar.innerHTML = '✓ MARCAR COMO VISTO';
        }
    } catch (error) {
        console.error('Error de comunicación al actualizar progreso:', error);
        alert('Error de red con el servidor local');
        btnConfirmar.disabled = false;
        btnConfirmar.innerHTML = '✓ MARCAR COMO VISTO';
    }
}

/* ==========================================================================
   🧭 ENRUTAMIENTOS Y REDIRECCIONES DEL FLUJO
   ========================================================================== */
function irAEvaluacion(capituloId) { window.location.href = `/evaluacion?id=${capituloId}`; }
function irAFirma() { window.location.href = '/firma'; }
function irACertificado() { window.location.href = '/certificado'; }