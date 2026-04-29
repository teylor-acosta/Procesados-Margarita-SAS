const express = require('express');
const router = express.Router();
const path = require('path');

const { proteger, soloAdmin, soloAuxiliar, soloSuperAdmin } = require('../middlewares/auth');

// ============================================
// RUTAS PÚBLICAS
// ============================================

router.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public', 'index.html'));
});

router.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, '../public', 'login.html'));
});

router.get('/recuperar', (req, res) => {
    res.sendFile(path.join(__dirname, '../public', 'recuperar.html'));
});

// ============================================
// RUTAS PROTEGIDAS
// ============================================

router.get('/cambiar-password', proteger, (req, res) => {
    res.sendFile(path.join(__dirname, '../public', 'cambiar-password.html'));
});

router.get('/dashboard', proteger, (req, res) => {
    res.sendFile(path.join(__dirname, '../public', 'dashboard.html'));
});

router.get('/induccion', proteger, (req, res) => {
    res.sendFile(path.join(__dirname, '../public', 'induccion.html'));
});

router.get('/evaluacion', proteger, (req, res) => {
    res.sendFile(path.join(__dirname, '../public', 'evaluacion.html'));
});

router.get('/resultados', proteger, (req, res) => {
    res.sendFile(path.join(__dirname, '../public', 'resultados.html'));
});

router.get('/firma', proteger, (req, res) => {
    res.sendFile(path.join(__dirname, '../public', 'firma.html'));
});

router.get('/certificado', proteger, (req, res) => {
    res.sendFile(path.join(__dirname, '../public', 'certificado.html'));
});

router.get('/perfil', proteger, (req, res) => {
    res.sendFile(path.join(__dirname, '../public', 'perfil.html'));
});
router.get('/empleados-menu', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/empleados-menu.html'));
});

// ============================================
// RUTAS POR ROL
// ============================================

router.get('/admin', proteger, soloAdmin, (req, res) => {
    res.sendFile(path.join(__dirname, '../public', 'admin.html'));
});

router.get('/auxiliar', proteger, soloAuxiliar, (req, res) => {
    res.sendFile(path.join(__dirname, '../public', 'auxiliar.html'));
});

router.get('/crear-empleado', proteger, soloSuperAdmin, (req, res) => {
    res.sendFile(path.join(__dirname, '../public', 'crear-empleado.html'));
});

router.get('/empleados', proteger, soloSuperAdmin, (req, res) => {
    res.sendFile(path.join(__dirname, '../public', 'empleados.html'));
});

// ============================================
// PANEL
// ============================================

router.get('/panel', proteger, (req, res) => {
    res.sendFile(path.join(__dirname, '../public', 'panel.html'));
});

module.exports = router;