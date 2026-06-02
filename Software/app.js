// ============================================
// 🔥 CARGAR VARIABLES .ENV
// ============================================

require('dotenv').config();


// ============================================
// CONFIGURACIONES BASE
// ============================================

const express = require('express');
const session = require('express-session');
const path = require('path');

const db = require('./DB');

const app = express();

const PORT = process.env.PORT || 3000;


// ============================================
// BODY PARSER
// ============================================

app.use(express.urlencoded({ extended: true }));

app.use(express.json({
    limit: '50mb'
}));


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
    '/videos',
    express.static(
        path.join(__dirname, 'public/videos')
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

app.use(require('./routes/firma.routes'));

app.use(require('./routes/certificado.routes'));

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

app.use(require('./routes/roles-acceso.routes'));

app.use(
    require(
        './routes/capacitaciones.routes'
    )
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

app.listen(PORT, () => {

    console.log(
        `🚀 Servidor ejecutándose en http://localhost:${PORT}`
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