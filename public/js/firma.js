let canvas = null;
let ctx = null;
let drawing = false;

document.addEventListener('DOMContentLoaded', () => {
    inicializarCanvas();
});

function inicializarCanvas() {
    canvas = document.getElementById('canvasFirma');
    if (!canvas) return;
    
    ctx = canvas.getContext('2d');
    
    // Configuración de estilo de trazo (Ajustado para nitidez)
    ctx.strokeStyle = '#000000'; 
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Eventos Mouse
    canvas.addEventListener('mousedown', empezarDibujo);
    canvas.addEventListener('mousemove', dibujar);
    canvas.addEventListener('mouseup', terminarDibujo);
    canvas.addEventListener('mouseleave', terminarDibujo);
    
    // Eventos Touch (Móviles) - Importante para tablets y celulares
    canvas.addEventListener('touchstart', (e) => { 
        e.preventDefault(); 
        empezarDibujo(e.touches[0]); 
    }, { passive: false });

    canvas.addEventListener('touchmove', (e) => { 
        e.preventDefault(); 
        dibujar(e.touches[0]); 
    }, { passive: false });

    canvas.addEventListener('touchend', terminarDibujo);
}

function obtenerPosicion(e) {
    const rect = canvas.getBoundingClientRect();
    // Ajuste de precisión por si el canvas está escalado por CSS
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY
    };
}

function empezarDibujo(e) {
    drawing = true;
    const pos = obtenerPosicion(e);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
}

function dibujar(e) {
    if (!drawing) return;
    const pos = obtenerPosicion(e);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
}

function terminarDibujo() {
    drawing = false;
    ctx.closePath();
}

function limpiarFirma() {
    if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
}

async function guardarFirma() {
    // Validar si el canvas está vacío
    const blank = document.createElement('canvas');
    blank.width = canvas.width;
    blank.height = canvas.height;
    
    if (canvas.toDataURL() === blank.toDataURL()) {
        alert('Por favor, realiza tu firma antes de continuar.');
        return;
    }

    // Ubicar el botón para feedback visual
    const btn = document.querySelector('.btn-gradient') || document.querySelector('button[onclick="guardarFirma()"]');
    const originalText = btn ? btn.innerHTML : 'Guardar Firma';
    
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i> Procesando...';
    }

    const firmaData = canvas.toDataURL('image/png');
    
    try {
        // Llamada a la API unificada
        const response = await fetch('/api/guardar-firma', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ firma_data: firmaData })
        });
        
        const result = await response.json();
        
        if (result.success) {
            // Si se guarda con éxito, vamos a la generación del certificado
            window.location.href = '/certificado';
        } else {
            alert('Error al procesar la firma: ' + (result.message || 'Error desconocido'));
            if (btn) {
                btn.disabled = false;
                btn.innerHTML = originalText;
            }
        }
    } catch (error) {
        console.error('Error enviando firma:', error);
        alert('Error de conexión con el servidor. Verifica que el servidor esté encendido.');
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = originalText;
        }
    }
}