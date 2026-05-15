require('dotenv').config();

const mysql = require('mysql2/promise');

const db = mysql.createPool({
    uri: process.env.MYSQL_URL,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

module.exports = db;