const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'findback',
  dateStrings: true,
});

// Jalankan query dan kembalikan barisnya saja
const query = async (sql, params) => (await pool.query(sql, params))[0];

module.exports = { pool, query };
