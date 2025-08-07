require('dotenv').config();

const mysql = require("mysql2");

const db = mysql.createConnection({
host: "localhost",
user: "admin",                       //root
password: "Kart!kBnsal2025",        //ppc8r8822
database: "payphi_multi_options"   //payment_gateway
});

db.connect((err) => {
  if (err) {
    console.error('❌ Error connecting to MySQL:', err);
    return;
  }
  console.log('✅ Connected to MySQL database');
});

module.exports = db;
