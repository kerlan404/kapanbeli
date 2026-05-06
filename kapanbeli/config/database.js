const mysql = require('mysql2/promise');
require('dotenv').config();

const connection = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD !== undefined ? process.env.DB_PASSWORD : '',
    database: process.env.DB_NAME || 'kapanbeli',
    port: process.env.DB_PORT || 3306, // Tambahkan ini agar mendukung MAMP (8889)
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

module.exports = connection;