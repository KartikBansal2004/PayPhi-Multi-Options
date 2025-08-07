require('dotenv').config();

const mysql = require("mysql2");

const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,                   //root
  password: process.env.DB_PASSWORD,          //ppc8r8822
  database: process.env.DB_NAME               //payment_gateway
});

db.connect((err) => {
  if (err) {
    console.error('❌ Error connecting to MySQL:', err);
    return;
  }
  console.log('✅ Connected to MySQL database');
});

module.exports = db;
