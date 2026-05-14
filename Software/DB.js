const mysql = require('mysql2');

const pool = mysql.createPool({
    uri: process.env.MYSQL_URL,

    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,

    connectTimeout: 10000,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0
});

pool.getConnection((err, connection) => {

    if (err) {
        console.error('❌ Error conexión MySQL:', err);
        return;
    }

    console.log('✅ MySQL conectado');

    connection.release();
});

module.exports = pool.promise();