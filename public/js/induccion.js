document.addEventListener('DOMContentLoaded', iniciarCarga);

// 1. Cargar los Módulos Principales
function iniciarCarga() {
    fetch('/api/capitulos-induccion')
        .then(res => res.json())
        .then(data => {
            const contenedor = document.getElementById('contenedorModulos');
            contenedor.innerHTML = '';
            data.capitulos.forEach(cap => {
                const item = document.createElement('div');
                item.className = "modulo-item";
                item.innerHTML = `
                    <div class="d-flex flex-wrap justify-content-between align-items-center">
                        <div>
                            <h3 class="fw-bold mb-1" style="color: var(--azul-margarita)">${cap.titulo}</h3>
                            <p class="text-muted small mb-0"><i class="fas fa-play-circle me-2"></i>${cap.videos_vistos || 0} de ${cap.total_videos || 0} completados</p>
                        </div>
                        <button class="btn btn-degradado" onclick="toggleVideos(${cap.id})">VER VIDEOS</button>
                    </div>
                    <div id="lista-${cap.id}" class="d-none mt-4 pt-3 border-top"></div>
                `;
                contenedor.appendChild(item);
            });
        });
}

// 2. Mostrar/Ocultar y cargar videos internos
function toggleVideos(id) {
    const lista = document.getElementById(`lista-${id}`);
    if (!lista.classList.contains('d-none')) return lista.classList.add('d-none');

    fetch(`/api/sub-capitulos/${id}`)
        .then(res => res.json())
        .then(data => {
            lista.classList.remove('d-none');
            
            // Renderizar la lista de videos
            lista.innerHTML = data.sub_capitulos.map(v => `
                <div class="video-fila ${v.visto == 1 ? 'visto' : ''}">
                    <span><i class="${v.visto == 1 ? 'fas fa-check-circle text-success' : 'fas fa-video text-primary'} me-2"></i> ${v.titulo}</span>
                    <button class="btn btn-sm btn-outline-dark" onclick="abrirPlayer('${v.video_url}', ${v.id})">Ver video</button>
                </div>
            `).join('');

            // Lógica para generar el botón de evaluación del módulo específico
            const todosVistos = data.sub_capitulos.length > 0 && data.sub_capitulos.every(v => v.visto == 1);

            if (todosVistos) {
                lista.innerHTML += `
                    <div class="mt-4 p-3 border-top text-center">
                        <button class="btn btn-success btn-lg w-100 py-3 fw-bold shadow" 
                                onclick="window.location.href='/evaluacion?id=${id}'">
                            <i class="fas fa-file-pen me-2"></i> REALIZAR EXAMEN: ${data.sub_capitulos[0].capitulo_titulo || 'Módulo'}
                        </button>
                    </div>
                `;
            }
        });
}

// 3. Funciones del Reproductor Local
function abrirPlayer(archivo, id) {
    const player = document.getElementById('videoPlayer');
    document.getElementById('videoSource').src = `/videos/${archivo}`;
    player.load();
    window.videoSeleccionado = id;
    new bootstrap.Modal(document.getElementById('modalVideo')).show();
}

function detenerVideo() {
    const p = document.getElementById('videoPlayer');
    p.pause();
    p.currentTime = 0;
}

// 4. Marcar video y refrescar para validar el botón de examen
document.getElementById('btnConfirmarVisto').addEventListener('click', () => {
    fetch('/api/marcar-visto', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sub_capitulo_id: window.videoSeleccionado })
    }).then(() => location.reload()); // Recarga para activar el botón de examen
});