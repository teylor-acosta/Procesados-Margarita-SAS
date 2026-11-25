
'use strict';

require('dotenv').config();

const mysql = require('mysql2/promise');

// === CONFIGURACIÓN DE MYSQL ===
const db = mysql.createPool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,

    // === ADMINISTRACIÓN DE CONEXIONES ===
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,

    // === ESTABILIDAD Y COMPATIBILIDAD ===
    connectTimeout: 10000,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
    charset: 'utf8mb4'
});

// === EXPORTAR POOL COMPARTIDO ===
module.exports = db;
