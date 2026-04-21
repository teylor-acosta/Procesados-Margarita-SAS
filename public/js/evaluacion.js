let capituloId = null;
let preguntas = [];
let respuestas = {};

document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    // Cambiado de 'capitulo' a 'id' para ser consistentes con la URL que manda induccion.js (?id=...)
    capituloId = urlParams.get('id') || urlParams.get('capitulo');
    
    if (!capituloId) {
        window.location.href = '/induccion';
        return;
    }
    
    await inicializarEvaluacion();
});

async function inicializarEvaluacion() {
    try {
        const [resPreguntas, resCapitulos] = await Promise.all([
            fetch(`/api/preguntas-evaluacion/${capituloId}`).then(r => r.json()),
            fetch('/api/capitulos-induccion').then(r => r.json())
        ]);

        if (resPreguntas.success) {
            preguntas = resPreguntas.preguntas;
            
            // Buscamos el título del capítulo actual
            const capitulo = resCapitulos.capitulos?.find(c => c.id == capituloId);
            if (capitulo) {
                const tituloElem = document.getElementById('tituloCapitulo');
                if(tituloElem) tituloElem.innerText = capitulo.titulo;
            }
            
            renderizarPreguntas();
        } else {
            throw new Error(resPreguntas.message || "Error al cargar preguntas");
        }
    } catch (error) {
        console.error('Error:', error);
        document.getElementById('contenidoEvaluacion').innerHTML = `
            <div class="alert alert-danger text-center">
                <i class="fas fa-exclamation-circle fa-2x mb-2"></i>
                <p>No se pudo cargar la evaluación. Por favor, intenta de nuevo.</p>
                <a href="/induccion" class="btn btn-outline-danger btn-sm">Volver</a>
            </div>`;
    }
}

function renderizarPreguntas() {
    const contenedor = document.getElementById('contenidoEvaluacion');
    if (!contenedor) return;

    if (preguntas.length === 0) {
        contenedor.innerHTML = '<div class="alert alert-info">No hay preguntas registradas para este módulo.</div>';
        return;
    }
    
    let html = preguntas.map((p, i) => `
        <div class="pregunta-card mb-4" data-pregunta-id="${p.id}">
            <div class="pregunta-texto mb-3">
                <strong>${i + 1}. ${p.pregunta}</strong>
            </div>
            <div class="opciones-lista">
                ${['A', 'B', 'C', 'D'].map(letra => `
                    <div class="opcion-item p-3 mb-2 border rounded cursor-pointer" 
                         onclick="seleccionarRespuesta(${p.id}, '${letra}', this)"
                         style="cursor: pointer; transition: all 0.3s;">
                        <span class="opcion-letra fw-bold">${letra}.</span> ${p[`opcion_${letra.toLowerCase()}`]}
                    </div>
                `).join('')}
            </div>
        </div>
    `).join('');

    html += `
        <div class="text-center mt-5 mb-5">
            <button class="btn-gradient w-100 p-3" id="btnEnviar" onclick="enviarEvaluacion()">
                <i class="fas fa-paper-plane me-2"></i>Finalizar y Calificar
            </button>
        </div>`;
    
    contenedor.innerHTML = html;
}

function seleccionarRespuesta(preguntaId, letra, elemento) {
    respuestas[preguntaId] = letra;
    
    // UI: Obtener el bloque de opciones de esta pregunta específica
    const bloque = elemento.closest('.opciones-lista');
    
    // UI: Limpiar clases de selección en todas las opciones del bloque
    bloque.querySelectorAll('.opcion-item').forEach(el => {
        el.classList.remove('opcion-seleccionada', 'bg-primary', 'text-white');
        el.style.backgroundColor = ''; 
    });
    
    // UI: Activar la seleccionada (Acomódate a tus clases de CSS o usa estilos directos)
    elemento.classList.add('opcion-seleccionada');
    elemento.style.backgroundColor = '#e3f2fd'; // Un tono azul suave de selección
}

async function enviarEvaluacion() {
    // Validar que todas estén respondidas
    if (Object.keys(respuestas).length < preguntas.length) {
        alert('Faltan preguntas por responder. Por favor revisa la evaluación.');
        return;
    }

    const btn = document.getElementById('btnEnviar');
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Procesando resultados...';

    try {
        const response = await fetch('/api/guardar-evaluacion', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                capitulo_id: parseInt(capituloId),
                respuestas: respuestas
            })
        });

        const result = await response.json();
        
        if (result.success) {
            // Redirigimos a resultados pasando los datos en la URL
            // Asegúrate de que resultados.html (o la ruta /resultados) esté lista para leer esto
            const nota = result.nota || 0;
            const aprobado = result.aprobado ? 1 : 0;
            window.location.href = `/resultados?score=${nota}&aprobado=${aprobado}&capitulo=${capituloId}`;
        } else {
            alert(result.message || 'Error al procesar la evaluación');
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-paper-plane me-2"></i>Finalizar y Calificar';
        }
    } catch (e) {
        console.error('Error envío:', e);
        alert('Error de comunicación con el servidor. Verifica tu conexión.');
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-paper-plane me-2"></i>Finalizar y Calificar';
    }
}