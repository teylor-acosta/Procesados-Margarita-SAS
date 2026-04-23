require('dotenv').config();
const mysql = require('mysql2');

const pool = mysql.createPool({
    uri: process.env.MYSQL_URL,

    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,

    enableKeepAlive: true,
    keepAliveInitialDelay: 0
});

// 🔥 OPCIONAL: probar conexión
pool.getConnection((err, connection) => {
    if (err) {
        console.error('❌ Error de conexión:', err);
    } else {
        console.log('✅ Conectado a Railway MySQL (POOL)');
        connection.release();
    }
});

module.exports = pool;