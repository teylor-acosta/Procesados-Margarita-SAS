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
const multer = require('multer'); // 🔥 AGREGADO: Para que funcione 'upload'
const nodemailer = require('nodemailer'); // 🔥 AGREGADO: Por si se usa 'transporter' en contacto

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

app.use(cors());


// ============================================
// SESSION SIMPLE TEMPORAL
// ============================================

app.use(session({

    secret: 'procesados_margarita_2026',

    resave: false,

    saveUninitialized: false,

    rolling: true,

    cookie: {

        secure: false,

        httpOnly: true,

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
// STATIC
// ============================================

app.use(express.static(
    path.join(__dirname, 'public')
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

// (El app.listen de aquí lo he quitado, porque tenías otro más abajo. 
// Tener dos app.listen en el mismo archivo causaba que el servidor se reiniciara).

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
   CONFIGURACIÓN DE NODEMAILER PARA CONTACTO (GMAIL)
   ========================================================= */
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER, 
        pass: process.env.EMAIL_PASS  
    }
});
/* =========================================================
   RUTAS DE LA API
   ========================================================= */

// 1. Ruta para recibir un nuevo pedido desde la tienda
app.post('/api/pedidos', async (req, res) => {
    try {
        const pedido = req.body;

        // Validación básica de seguridad
        if (!pedido.cliente || !pedido.correo || !pedido.productos) {
            return res.status(400).json({ 
                ok: false, 
                mensaje: 'Faltan datos obligatorios del pedido.' 
            });
        }

        // Generar número de pedido único (basado en la fecha y hora)
        pedido.numero = `PM-${Date.now().toString().slice(-6)}`;
        pedido.fecha = new Date().toISOString();

        console.log(`📦 Recibiendo pedido #${pedido.numero} de ${pedido.cliente}`);

        // 🚀 Enviar el correo al propietario
        const correoEnviado = await notificarPedidoPropietario(pedido);

        if (correoEnviado) {
            // Aquí también podrías guardar el pedido en tu base de datos (DB.js)
            // await DB.guardarPedido(pedido);

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

// 2. Ruta para que el dueño confirme un pedido (envía correo al cliente)
app.post('/api/pedidos/:numero/confirmar', async (req, res) => {
    try {
        const { numero } = req.params;
        const pedido = req.body; // El pedido completo debe venir desde el panel del ERP

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

// 3. Ruta para que el dueño rechace un pedido (envía correo al cliente)
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

        // Cuerpo básico del correo (puedes mejorarlo a tu gusto)
        let htmlCuerpo = `<h2>Nueva solicitud: ${tipo}</h2>`;
        htmlCuerpo += `<p><strong>Datos recibidos:</strong></p><pre>${JSON.stringify(datos, null, 2)}</pre>`;

        const mailOptions = {
            from: `"${process.env.NOMBRE_REMITENTE}" <${process.env.GMAIL_USER}>`,
            to: destino,
            bcc: process.env.CORREO_PROPIETARIO, 
            subject: asunto,
            html: htmlCuerpo,
            attachments: []
        };

        // Si se adjuntó un archivo, lo agregamos al correo
        if (req.file) {
            mailOptions.attachments.push({
                filename: req.file.originalname,
                path: req.file.path
            });
        }

        await transporter.sendMail(mailOptions);
        console.log(`✅ Correo de ${tipo} enviado a ${destino}`);
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
   INICIAR EL SERVIDOR
   ========================================================= */
// 🔥 IMPORTANTE: Este es el ÚNICO app.listen en todo el archivo. 
// Debe ir al final para que todas las rutas estén cargadas antes de encender.
app.listen(PORT, () => {
    console.log(`🚀 Servidor ejecutándose en http://localhost:${PORT}`);
    console.log(`📧 Correos configurados desde: ${process.env.GMAIL_USER}`);
});