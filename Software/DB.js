const mysql = require('mysql2');
require('dotenv').config();

const pool = mysql.createPool({

    host: 'shinkansen.proxy.rlwy.net',

    user: 'root',

    password: 'TWPHRfMEWZooysXkytWNJMcFtjmwjDLX',

    database: 'railway',

    port: 34998,

    waitForConnections: true,

    connectionLimit: 10,

    queueLimit: 0,

    connectTimeout: 10000,

    enableKeepAlive: true,

    keepAliveInitialDelay: 0
});

pool.getConnection((err, connection) => {

    if (err) {

        console.error('❌ Error MySQL:', err);

        return;
    }

    console.log('✅ MySQL conectado');

    connection.release();
});

module.exports = pool.promise();