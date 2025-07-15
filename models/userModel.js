const db = require("../db");

const createUser = (user, callback) => {
  const sql = `
    INSERT INTO users (username, name, date, email, password, role, hpht)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;
  db.query(
    sql,
    [
      user.username,
      user.name,
      user.date,
      user.email,
      user.password,
      user.role,
      user.hpht,
    ],
    callback
  );
};

const findUserByEmail = (email, callback) => {
  const sql = "SELECT * FROM users WHERE email = ?";
  db.query(sql, [email], callback);
};

// Update password user berdasarkan email
const updatePasswordByEmail = (email, hashedPassword, callback) => {
  db.query(
    "UPDATE users SET password = ? WHERE email = ?",
    [hashedPassword, email],
    callback
  );
};

module.exports = { createUser, findUserByEmail, updatePasswordByEmail };
