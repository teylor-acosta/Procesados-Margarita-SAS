let canvas = document.getElementById('firmaCanvas');
let ctx = canvas.getContext('2d');
let drawing = false;

// Configurar el canvas
function resizeCanvas() {
    const container = canvas.parentElement;
    const width = Math.min(container.clientWidth - 40, 500);
    canvas.width = width;
    canvas.height = 200;
    
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// Eventos para dibujar
function getCoordinates(e) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    let clientX, clientY;
    
    if (e.touches) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
    } else {
        clientX = e.clientX;
        clientY = e.clientY;
    }
    
    let x = (clientX - rect.left) * scaleX;
    let y = (clientY - rect.top) * scaleY;
    
    x = Math.max(0, Math.min(canvas.width, x));
    y = Math.max(0, Math.min(canvas.height, y));
    
    return { x, y };
}

function startDrawing(e) {
    drawing = true;
    const { x, y } = getCoordinates(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x, y);
    ctx.stroke();
    e.preventDefault();
}

function draw(e) {
    if (!drawing) return;
    const { x, y } = getCoordinates(e);
    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
    e.preventDefault();
}

function stopDrawing() {
    drawing = false;
    ctx.beginPath();
}

canvas.addEventListener('mousedown', startDrawing);
canvas.addEventListener('mousemove', draw);
canvas.addEventListener('mouseup', stopDrawing);
canvas.addEventListener('mouseleave', stopDrawing);

canvas.addEventListener('touchstart', startDrawing);
canvas.addEventListener('touchmove', draw);
canvas.addEventListener('touchend', stopDrawing);

// Botón borrar
document.getElementById('btnBorrar').addEventListener('click', () => {
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
});

// Botón finalizar
document.getElementById('btnFinalizar').addEventListener('click', async () => {
    const firmaData = canvas.toDataURL('image/png');
    
    const btn = document.getElementById('btnFinalizar');
    const textoOriginal = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Guardando...';
    
    try {
        const response = await fetch('/api/guardar-firma', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ firma_data: firmaData })
        });
        
        const result = await response.json();
        
        if (result.success) {
            document.getElementById('mensajeExito').style.display = 'block';
            setTimeout(() => {
                window.location.href = '/certificado';
            }, 2000);
        } else {
            alert('Error al guardar la firma: ' + (result.message || 'Intenta nuevamente'));
            btn.disabled = false;
            btn.innerHTML = textoOriginal;
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error de conexión. Verifica tu internet.');
        btn.disabled = false;
        btn.innerHTML = textoOriginal;
    }
});