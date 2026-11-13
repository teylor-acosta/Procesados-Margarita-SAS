// ============================================
// 🔥 CARGAR VARIABLES .ENV
// ============================================

require('dotenv').config();


// ============================================
// CONFIGURACIONES BASE
// ============================================

const express = require('express');
const cors = require('cors');
const session = require('express-session');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const nodemailer = require('nodemailer');

const db = require('./DB');

const app = express();

const PORT = process.env.PORT || 3000;


// ============================================
// 🔥 CONFIGURACIÓN DE MULTER (SUBIDA DE ARCHIVOS)
// ============================================

const upload = multer({ dest: 'uploads/' });


// ============================================
// BODY PARSER
// ============================================

app.use(express.urlencoded({
    extended: true,
    limit: '50mb'
}));

app.use(express.json({
    limit: '50mb'
}));


// ============================================
// 🔥 CORS CON CREDENCIALES (CORREGIDO)
// ============================================

app.use(cors({
    origin: true,          // refleja el origen del request
    credentials: true      // 🔥 permite enviar/recibir cookies de sesión
}));


// ============================================
// 🔥 SESSION (CORREGIDA)
// ============================================

app.use(session({

    secret: process.env.SESSION_SECRET || 'procesados_margarita_2026',

    resave: false,

    saveUninitialized: false,

    rolling: true,

    cookie: {

        secure: false,          // true en producción con HTTPS

        httpOnly: true,

        sameSite: 'lax',        // 🔥 permite cookies en peticiones same-site

        maxAge: 8 * 60 * 60 * 1000

    }

}));


// ============================================
// 🔒 NO CACHE (BOTÓN ATRÁS)
// ============================================

app.use((req, res, next) => {

    res.set('Cache-Control', 'no-store');

    next();

});


// ============================================
// 🧹 SILENCIAR PETICIONES INTERNAS DE CHROME DEVTOOLS
// ============================================
// Evita el error CSP de com.chrome.devtools.json en consola.
// No afecta a la aplicación.

app.use((req, res, next) => {

    if (req.path.startsWith('/.well-known/appspecific')) {
        return res.status(204).end();
    }

    next();

});


// ============================================
// STATIC
// ============================================

// Bloquear acceso directo a páginas HTML,
// permitiendo únicamente fragmentos autorizados.
app.use((req, res, next) => {

    const ruta = req.path.toLowerCase();

    const archivosPermitidos = [
        '/components/sidebar.html'
    ];

    if (
        ruta.endsWith('.html') &&
        !archivosPermitidos.includes(ruta)
    ) {
        return res.status(404).send('Página no encontrada');
    }

    next();
});


 // Servir recursos estáticos sin abrir HTML directamente
app.use(express.static(
    path.join(__dirname, 'public'),
    { index: false }
));

app.use(
    '/uploads',
    express.static(
        path.join(__dirname, 'public/uploads')
    )
);

app.use(
    '/videos',
    express.static(
        path.join(__dirname, 'public/videos')
    )
);

app.use(
    '/uploads',
    express.static(
        path.join(__dirname, 'uploads')
    )
);



// ============================================
// PASAR DB A ROUTES
// ============================================

app.set('db', db);


// ============================================
// 🔥 IMPORTAR ROUTES
// ============================================

app.use(require('./routes/views.routes'));

app.use(require('./routes/auth.routes'));

app.use(require('./routes/empleados.routes'));

app.use(require('./routes/expediente.routes'));

app.use(require('./routes/induccion.routes'));

app.use(require('./routes/evaluacion.routes'));

app.use(require('./routes/evaluaciones-admin.routes'));

app.use(require("./routes/preguntas-induccion.routes"));

app.use(require("./routes/curso-preguntas.routes"));

app.use(require("./routes/curso-material.routes"));

app.use(require("./routes/curso-evaluaciones.routes"));

app.use(require('./routes/firma.routes'));

app.use(require('./routes/certificado.routes'));

app.use(require('./routes/certificado-capacitacion.routes'));

app.use(require('./routes/evaluacion-capacitacion.routes'));

app.use(require('./routes/perfil.routes'));

app.use(require('./routes/catalogos.routes'));

app.use(require('./routes/documentacion.routes'));

// MÓDULO DE DOCUMENTOS Y ACEPTACIONES
app.use(require('./routes/documentos-lectura.routes'));

app.use(require('./routes/centro-actividad.routes'));

app.use(
    '/api/usuarios',
    require('./routes/crear-usuario.routes')
);

app.use(
    '/api/usuarios',
    require('./routes/usuarios-registrados.routes')
);

app.use(
    '/api/dashboard-usuarios',
    require('./routes/dashboard-usuarios.routes')
);

app.use(require('./routes/roles-acceso.routes'));

app.use(
    require(
        './routes/capacitaciones.routes'
    )
);

app.use(
    require(
        './routes/centro-capacitaciones.routes'
    )
);

app.use(
    require(
        './routes/mis-capacitaciones.routes'
    )
);

app.use(
    require('./routes/finalizar-capacitacion.routes')
);

app.use(
    require('./routes/seguimiento-general.routes')
);

app.use(
    require('./routes/nomina.routes')
);

app.use(
    require('./routes/nomina-configuracion.routes')
);

app.use(
    require('./routes/nomina-prestamos.routes')
);

// ============================================
// 🔥 SIDEBAR DINÁMICO
// ============================================

app.use(
    '/api/sidebar',
    require('./routes/sidebar.routes')
);

app.use(
    require('./routes/nomina-novedades.routes')
);

app.use(
    require('./routes/produccion.routes')
);

app.get('/nomina/produccion', (req, res) => {

    const rutaVista = path.join(
        __dirname,
        'public',
        'produccion.html'
    );

    if (!fs.existsSync(rutaVista)) {

        console.log('⚠️ No existe la vista:', rutaVista);

        return res.status(404).send(
            'Vista de liquidación por producción no encontrada. ' +
            'Verifica que el archivo exista en public/produccion.html'
        );

    }

    res.sendFile(rutaVista);

});


// ============================================
// TEST DB
// ============================================

app.get('/test-db', async(req, res) => {

    try {

        const [rows] = await db.query(
            'SELECT 1 AS test'
        );

        res.json(rows);

    } catch(error){

        console.log(error);

        res.status(500).json({
            error: error.message
        });

    }

});


// ============================================
// SERVER
// ============================================

app.get('/tienda', (req, res) => {
    res.sendFile(
        path.join(__dirname, 'public', 'tienda.html')
    );
});


// ============================================
// 🔥 ERRORES GLOBALES
// ============================================

process.on('unhandledRejection', (err) => {

    console.log('UNHANDLED REJECTION');

    console.log(err);

});

process.on('uncaughtException', (err) => {

    console.log('UNCAUGHT EXCEPTION');

    console.log(err);

});


/* =========================================================
   PROCESADOS MARGARITA S.A.S.
   Servidor Principal
   ========================================================= */

// Importar el servicio de correos que creamos
const { 
    notificarPedidoPropietario, 
    notificarPedidoConfirmado, 
    notificarPedidoRechazado 
} = require('./public/servicios/correo');


/* =========================================================
   🔥 CONFIGURACIÓN DE NODEMAILER ÚNICA (HOSTINGER)
   ========================================================= */

const transporter = nodemailer.createTransport({
    host: "smtp.hostinger.com",
    port: 465,
    secure: true,
    auth: {
        user: process.env.EMAIL_USER, 
        pass: process.env.EMAIL_PASS  
    },
    tls: {
        rejectUnauthorized: false
    }
});

// Diagnóstico al arrancar
transporter.verify()
    .then(() => console.log('✅ SMTP Hostinger conectado correctamente'))
    .catch(err => console.error('❌ SMTP error al verificar:', err.message));


/* =========================================================
   FUNCIÓN PARA LEER Y REEMPLAZAR VARIABLES EN PLANTILLAS
   ========================================================= */

function cargarPlantillaChatbot(nombreArchivo, variables) {
    const ruta = path.join(__dirname, 'public', 'servicios', 'plantillas', nombreArchivo);
    
    if (!fs.existsSync(ruta)) {
        throw new Error(`La plantilla del chatbot no existe en: ${ruta}`);
    }

    let html = fs.readFileSync(ruta, 'utf8');
    
    for (const [llave, valor] of Object.entries(variables)) {
        html = html.replace(new RegExp(`{{${llave}}}`, 'g'), valor !== undefined && valor !== null ? valor : '');
    }
    return html;
}


/* =========================================================
   RUTAS DE LA API
   ========================================================= */

// 1. Ruta para recibir un nuevo pedido desde la tienda
app.post('/api/pedidos', async (req, res) => {
    try {
        const pedido = req.body;

        if (!pedido.cliente || !pedido.correo || !pedido.productos) {
            return res.status(400).json({ 
                ok: false, 
                mensaje: 'Faltan datos obligatorios del pedido.' 
            });
        }

        pedido.numero = `PM-${Date.now().toString().slice(-6)}`;
        pedido.fecha = new Date().toISOString();

        console.log(`📦 Recibiendo pedido #${pedido.numero} de ${pedido.cliente}`);

        const correoEnviado = await notificarPedidoPropietario(pedido);

        if (correoEnviado) {
            return res.status(200).json({
                ok: true,
                mensaje: 'Pedido registrado y correo enviado al propietario.',
                numero_pedido: pedido.numero
            });
        } else {
            return res.status(500).json({
                ok: false,
                mensaje: 'El pedido se recibió pero el correo falló.'
            });
        }

    } catch (error) {
        console.error('❌ Error en /api/pedidos:', error);
        res.status(500).json({ 
            ok: false, 
            mensaje: 'Error interno del servidor.',
            error: error.message 
        });
    }
});

// 2. Ruta para que el dueño confirme un pedido
app.post('/api/pedidos/:numero/confirmar', async (req, res) => {
    try {
        const { numero } = req.params;
        const pedido = req.body;

        pedido.numero = numero;

        const enviado = await notificarPedidoConfirmado(pedido);

        if (enviado) {
            return res.json({ ok: true, mensaje: 'Correo de confirmación enviado al cliente.' });
        } else {
            return res.status(500).json({ ok: false, mensaje: 'No se pudo enviar el correo.' });
        }
    } catch (error) {
        console.error('❌ Error al confirmar:', error);
        res.status(500).json({ ok: false, mensaje: 'Error interno.' });
    }
});

// 3. Ruta para que el dueño rechace un pedido
app.post('/api/pedidos/:numero/rechazar', async (req, res) => {
    try {
        const { numero } = req.params;
        const { motivo, pedido } = req.body;

        pedido.numero = numero;

        const enviado = await notificarPedidoRechazado(pedido, motivo);

        if (enviado) {
            return res.json({ ok: true, mensaje: 'Correo de rechazo enviado al cliente.' });
        } else {
            return res.status(500).json({ ok: false, mensaje: 'No se pudo enviar el correo.' });
        }
    } catch (error) {
        console.error('❌ Error al rechazar:', error);
        res.status(500).json({ ok: false, mensaje: 'Error interno.' });
    }
});

// 4. Ruta para el formulario de contacto con archivo adjunto
app.post('/api/contacto', upload.single('archivo'), async (req, res) => {
    try {
        const tipo = req.body.tipo || "solicitud";
        const destino = req.body.correoDestino || process.env.CORREO_SOLICITUDES;
        const asunto = req.body.asunto || `Nueva solicitud: ${tipo}`;
        const datosStr = req.body.datos || "{}";
        const datos = JSON.parse(datosStr);

        let emailCliente = "";
        let nombreCliente = "Cliente";
        let telefonoCliente = "No registrado";

        if (tipo === "producto") {
            emailCliente = datos["pro-correo"]; nombreCliente = datos["pro-nombre"]; telefonoCliente = datos["pro-telefono"];
        } else if (tipo === "material") {
            emailCliente = datos["mat-correo"]; nombreCliente = datos["mat-nombre"]; telefonoCliente = datos["mat-telefono"];
        } else if (tipo === "soporte") {
            emailCliente = datos["sop-correo"]; nombreCliente = datos["sop-nombre"]; telefonoCliente = datos["sop-telefono"];
        } else if (tipo === "empleo") {
            emailCliente = datos["emp-correo"]; nombreCliente = datos["emp-nombre"]; telefonoCliente = datos["emp-telefono"];
        } else if (tipo === "acta") {
            emailCliente = datos["act-correo"]; nombreCliente = datos["act-solicitante"]; telefonoCliente = "No registrado";
        } else if (tipo === "retencion") {
            emailCliente = datos["ret-correo"]; nombreCliente = datos["ret-solicitante"]; telefonoCliente = "No registrado";
        } else {
            emailCliente = datos["correo"] || datos["rec-correo"] || datos["cal-correo"] || "";
            nombreCliente = datos["nombre"] || datos["rec-nombre"] || datos["cal-nombre"] || "Cliente";
            telefonoCliente = datos["rec-telefono"] || datos["cal-telefono"] || "No registrado";
        }

        const fecha = new Date().toLocaleString('es-CO', { timeZone: 'America/Bogota' });
        const tipoSolicitud = tipo.charAt(0).toUpperCase() + tipo.slice(1);

        let tablaDatos = "";
        for (const [key, value] of Object.entries(datos)) {
            if (value) {
                const nombreCampo = key.replace(/^(pro-|mat-|sop-|emp-|rec-|cal-|act-|ret-)/, "").toUpperCase();
                tablaDatos += `
                  <tr>
                    <td style="padding: 12px 15px; border-bottom: 1px solid #e2e8f0; font-weight: bold; color: #0b2345; background-color: #f8fafc; width: 35%; font-size: 14px;">${nombreCampo}</td>
                    <td style="padding: 12px 15px; border-bottom: 1px solid #e2e8f0; color: #334155; font-size: 14px;">${value}</td>
                  </tr>
                `;
            }
        }

        const plantillaAsesor = req.file ? 'chatbot-adjunto.html' : 'chatbot-asesor.html';
        
        const htmlAsesor = cargarPlantillaChatbot(plantillaAsesor, {
            'TIPO_SOLICITUD': tipoSolicitud,
            'FECHA': fecha,
            'NOMBRE_CLIENTE': nombreCliente,
            'EMAIL_CLIENTE': emailCliente || 'No proporcionado',
            'TELEFONO_CLIENTE': telefonoCliente,
            'TABLA_DATOS': tablaDatos,
            'ANIO': new Date().getFullYear()
        });

        const mailAsesor = {
            from: `"${process.env.NOMBRE_REMITENTE || 'Procesados Margarita'}" <${process.env.EMAIL_USER}>`,
            to: destino,
            replyTo: emailCliente || undefined,
            bcc: process.env.CORREO_PROPIETARIO,
            subject: asunto,
            html: htmlAsesor,
            attachments: []
        };

        if (req.file) {
            mailAsesor.attachments.push({
                filename: req.file.originalname,
                path: req.file.path
            });
        }

        await transporter.sendMail(mailAsesor);
        console.log(`✅ Correo 1 (Asesor) enviado a ${destino}`);

        if (emailCliente && emailCliente.includes("@")) {
            const htmlCliente = cargarPlantillaChatbot('chatbot-cliente.html', {
                'NOMBRE_CLIENTE': nombreCliente,
                'TIPO_SOLICITUD': tipoSolicitud,
                'TELEFONO_EMPRESA': process.env.EMPRESA_TELEFONO || '+57 (Tu número aquí)',
                'EMAIL_EMPRESA': process.env.CORREO_SOLICITUDES || 'solicitudes@procesadosmargaritasas.com',
                'ANIO': new Date().getFullYear()
            });

            await transporter.sendMail({
                from: `"${process.env.NOMBRE_REMITENTE}" <${process.env.EMAIL_USER}>`,
                to: emailCliente,
                subject: "Hemos recibido tu solicitud - Procesados Margarita",
                html: htmlCliente
            });
            console.log(`✅ Correo 2 (Confirmación) enviado a ${emailCliente}`);
        } else {
            console.log(`⚠️ No se envió confirmación: el cliente no proporcionó un correo válido.`);
        }

        res.status(200).json({ ok: true, mensaje: "Solicitud enviada correctamente." });

    } catch (error) {
        console.error('❌ Error en /api/contacto:', error);
        res.status(500).json({ 
            ok: false, 
            mensaje: 'Error al enviar la solicitud.',
            error: error.message
        });
    }
});


/* =========================================================
   🔥 INICIAR EL SERVIDOR
   ========================================================= */

app.listen(PORT, () => {
    console.log(`🚀 Servidor ejecutándose en http://localhost:${PORT}`);
    console.log(`📧 Correos configurados desde: ${process.env.EMAIL_USER}`);
});