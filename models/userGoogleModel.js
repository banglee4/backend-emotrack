const db = require("../db");

exports.findByGoogleId = (googleId, callback) => {
  const query = "SELECT * FROM usersgoogle WHERE googleId = ?";
  db.query(query, [googleId], (err, results) => {
    if (err) return callback(err);
    callback(null, results[0]); // bisa null kalau belum ada
  });
};

exports.createUser = (userData, callback) => {
  const { googleId, name, email, photo } = userData;
  const query =
    "INSERT INTO usersgoogle (googleId, name, email, photo) VALUES (?, ?, ?, ?)";
  const values = [googleId, name, email, photo];

  db.query(query, values, (err, result) => {
    if (err) return callback(err);

    // Ambil kembali user yang baru dibuat
    db.query(
      "SELECT * FROM usersgoogle WHERE id = ?",
      [result.insertId],
      (err, results) => {
        if (err) return callback(err);
        callback(null, results[0]);
      }
    );
  });
};

exports.findById = (id, callback) => {
  db.query("SELECT * FROM usersgoogle WHERE id = ?", [id], (err, results) => {
    if (err) return callback(err);
    callback(null, results[0]);
  });
};
