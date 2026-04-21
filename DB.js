const mysql = require('mysql2');

const conexion = mysql.createConnection({
    host: 'localhost',      // o IP si es otro PC
    user: 'root',
    password: '',
    database: 'MargaritaSAS'
});

conexion.connect((err) => {
    if (err) {
        console.error('❌ Error de conexión:', err);
        return;
    }
    console.log('✅ Conectado a MySQL');
});

module.exports = conexion;