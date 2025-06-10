const db = require("../db");

const saveChat = (user_id, prompt, response, callback) => {
  db.query(
    "INSERT INTO chats (user_id, prompt, response) VALUES (?, ?, ?)",
    [user_id, prompt, response],
    (err, result) => {
      if (err) return callback(err);
      callback(null, result);
    }
  );
};

const getChats = (user_id, callback) => {
  db.query(
    "SELECT * FROM chats WHERE user_id = ?",
    [user_id],
    (err, result) => {
      if (err) return callback(err);
      callback(null, result);
    }
  );
};

module.exports = { saveChat, getChats };
