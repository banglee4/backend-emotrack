const mysql = require("mysql2");

const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "", // sesuaikan
  database: "gemastik", // buat database ini
});

db.connect((err) => {
  if (err) throw err;
  console.log("Terhubung ke database!");
});

module.exports = db;
