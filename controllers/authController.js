const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/userModel");
const nodemailer = require("nodemailer");
const crypto = require("crypto");

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

// reset password

// Penyimpanan kode verifikasi sementara (gunakan Redis di produksi)
const resetTokens = {};

// Kirim kode reset ke email
exports.forgotPassword = (req, res) => {
  const { email } = req.body;

  User.findUserByEmail(email, (err, results) => {
    if (err || results.length === 0) {
      return res.status(404).json({ message: "Email tidak ditemukan" });
    }

    const resetCode = crypto.randomBytes(3).toString("hex"); // contoh: "a1b2c3"
    const expires = Date.now() + 5 * 60 * 1000; // 5 menit

    resetTokens[email] = { code: resetCode, expires };

    // Konfigurasi pengiriman email
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: `"Emotrack Support" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Kode Reset Password - Emotrack",
      html: `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
      <h2 style="color: #4CAF50;">Reset Password Emotrack</h2>
      <p>Halo,</p>
      <p>Anda telah meminta untuk mereset password akun Emotrack Anda. Gunakan kode verifikasi di bawah ini:</p>
      <div style="background-color: #f2f2f2; padding: 15px; text-align: center; border-radius: 5px; margin: 20px 0;">
        <h1 style="letter-spacing: 2px; color: #333;">${resetCode}</h1>
      </div>
      <p><strong>Jangan bagikan kode ini kepada siapa pun.</strong> Kode ini hanya berlaku selama 5 menit.</p>
      <p>Jika Anda tidak meminta reset password, silakan abaikan email ini.</p>
      <br />
      <p>Salam hangat,</p>
      <p style="color: #4CAF50; font-weight: bold;">Tim Emotrack</p>
    </div>
  `,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.log(error);
        return res.status(500).json({ message: "Gagal mengirim email" });
      }

      res.json({ message: "Kode verifikasi dikirim ke email Anda" });
    });
  });
};

// Verifikasi kode
exports.verifyResetCode = (req, res) => {
  const { email, code } = req.body;
  const token = resetTokens[email];

  if (!token || token.code !== code || Date.now() > token.expires) {
    return res.status(400).json({ message: "Kode salah atau kadaluarsa" });
  }

  res.json({ message: "Kode valid" });
};

// Reset password baru
exports.resetPassword = (req, res) => {
  const { email, code, newPassword } = req.body;
  const token = resetTokens[email];

  if (!token || token.code !== code || Date.now() > token.expires) {
    return res.status(400).json({ message: "Kode salah atau kadaluarsa" });
  }

  if (newPassword.length < 8) {
    return res.status(400).json({ message: "Password minimal 8 karakter" });
  }

  bcrypt.hash(newPassword, 10, (err, hashedPassword) => {
    if (err)
      return res.status(500).json({ message: "Gagal mengenkripsi password" });

    User.updatePasswordByEmail(email, hashedPassword, (err, result) => {
      if (err) {
        return res.status(500).json({ message: "Gagal update password" });
      }

      delete resetTokens[email]; // Hapus token
      res.json({ message: "Password berhasil direset" });
    });
  });
};
