const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/userModel");

// Registrasi
exports.register = (req, res) => {
  const { username, name, date, email, password, role, hpht } = req.body;

  // Validasi panjang password
  if (password.length < 8) {
    return res.status(400).json({ message: "Password minimal 8 karakter" });
  }

  // Validasi role
  if (!["ibu_hamil", "keluarga"].includes(role)) {
    return res.status(400).json({ message: "Role tidak valid" });
  }

  // Validasi HPHT jika role ibu hamil
  if (role === "ibu_hamil" && !hpht) {
    return res
      .status(400)
      .json({ message: "HPHT wajib diisi untuk ibu hamil" });
  }

  // Enkripsi password
  bcrypt.hash(password, 10, (err, hashedPassword) => {
    if (err) return res.status(500).json({ message: "Error hashing password" });

    const newUser = {
      username,
      name,
      date,
      email,
      password: hashedPassword,
      role,
      hpht: role === "ibu_hamil" ? hpht : null,
    };

    User.createUser(newUser, (err, result) => {
      if (err) {
        console.log(err);
        return res.status(500).json({ message: "Gagal mendaftar", error: err });
      }
      res.json({ message: "Registrasi berhasil" });
    });
  });
};

// Login
exports.login = (req, res) => {
  const { email, password } = req.body;

  User.findUserByEmail(email, (err, results) => {
    if (err || results.length === 0) {
      return res.status(401).json({ message: "Email tidak ditemukan" });
    }

    const user = results[0];

    bcrypt.compare(password, user.password, (err, isMatch) => {
      if (err)
        return res
          .status(500)
          .json({ message: "Error saat membandingkan password" });

      if (!isMatch) return res.status(401).json({ message: "Password salah" });

      const token = jwt.sign({ id: user.id, role: user.role }, "SECRET_KEY", {
        expiresIn: "1h",
      });

      res.json({
        message: "Login berhasil",
        token,
        user: {
          id: user.id,
          username: user.username,
          name: user.name,
          hpht: user.hpht,
          email: user.email,
          role: user.role,
        },
      });
    });
  });
};
