// ============================================
// CONFIGURACIONES BASE
// ============================================

const express = require('express');
const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);
const path = require('path');
const db = require('./DB');

const app = express();
const PORT = process.env.PORT || 3000;


// ============================================
// BODY PARSER
// ============================================

app.use(express.urlencoded({ extended: true }));
app.use(express.json({ limit: '50mb' }));


// ============================================
// SESSION STORE MYSQL
// ============================================

const sessionStore = new MySQLStore({}, db);

app.use(session({
    key: 'connect.sid',
    secret: 'procesados_margarita_2026',
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false,
        httpOnly: true,
        sameSite: 'lax',
        maxAge: 30 * 60 * 1000
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

app.use(express.static(path.join(__dirname, 'public')));
app.use('/videos', express.static(path.join(__dirname, 'public/videos')));


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
app.use(require('./routes/perfil.routes')); // 🔥 importante (foto perfil)
app.use(require('./routes/catalogos.routes'));
app.use(require('./routes/documentacion.routes'));


// ============================================
// SERVER
// ============================================

app.listen(PORT, () => {
    console.log(`🚀 Servidor ejecutándose en http://localhost:${PORT}`);
});