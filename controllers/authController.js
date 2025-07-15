const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/userModel");
const nodemailer = require("nodemailer");
// const crypto = require("crypto");

// Penyimpanan OTP sementara (gunakan Redis untuk produksi)
const pendingUsers = {};
const resetTokens = {};

// Register - Kirim OTP
exports.register = (req, res) => {
  const { username, name, date, email, password, role, hpht } = req.body;

  if (email) {
    User.findUserByEmail(email, (err, results) => {
      if (err || results.length > 0) {
        return res.status(400).json({ message: "Email sudah terdaftar" });
      }
    });
  }

  // Validasi
  if (password.length < 8)
    return res.status(400).json({ message: "Password minimal 8 karakter" });
  if (!["ibu_hamil", "keluarga"].includes(role))
    return res.status(400).json({ message: "Role tidak valid" });
  if (role === "ibu_hamil" && !hpht)
    return res
      .status(400)
      .json({ message: "HPHT wajib diisi untuk ibu hamil" });

  const otpCode = Math.floor(100000 + Math.random() * 900000).toString(); // 6 digit angka
  const expires = Date.now() + 5 * 60 * 1000; // 5 menit

  bcrypt.hash(password, 10, (err, hashedPassword) => {
    if (err) return res.status(500).json({ message: "Error hashing password" });

    pendingUsers[email] = {
      userData: {
        username,
        name,
        date,
        email,
        password: hashedPassword,
        role,
        hpht: role === "ibu_hamil" ? hpht : null,
      },
      code: otpCode,
      expires,
    };

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
      subject: "Kode Verifikasi Pendaftaran - Emotrack",
      html: `
        <div style="font-family: Arial; padding: 20px;">
          <h2 style="color:#4CAF50">Verifikasi Akun Emotrack</h2>
          <p>Gunakan kode berikut untuk menyelesaikan proses pendaftaran akun Anda:</p>
          <h1 style="background:#f2f2f2; padding:10px; border-radius:5px; display:inline-block;">${otpCode}</h1>
          <p>Kode ini berlaku selama 5 menit. Jangan bagikan kode ini kepada siapa pun.</p>
        </div>
      `,
    };

    transporter.sendMail(mailOptions, (error) => {
      if (error) {
        console.error(error);
        return res
          .status(500)
          .json({ message: "Gagal mengirim email verifikasi" });
      }

      res.json({ message: "Kode verifikasi telah dikirim ke email Anda" });
    });
  });
};

// Verifikasi OTP dan Simpan User ke DB
exports.verifyRegisterOTP = (req, res) => {
  const { email, code } = req.body;
  const pending = pendingUsers[email];

  if (!pending || pending.code !== code || Date.now() > pending.expires) {
    return res.status(400).json({ message: "Kode OTP salah atau kadaluarsa" });
  }

  User.createUser(pending.userData, (err, result) => {
    if (err) {
      console.log(err);
      return res.status(500).json({ message: "Gagal mendaftar", error: err });
    }

    delete pendingUsers[email];
    res.json({ message: "Registrasi berhasil dan akun terverifikasi" });
  });
};

// Kirim ulang OTP register
exports.resendRegisterOTP = (req, res) => {
  const { email } = req.body;

  const pending = pendingUsers[email];
  if (!pending) {
    return res.status(400).json({
      message: "Data pendaftaran tidak ditemukan atau sudah kedaluwarsa",
    });
  }

  const otpCode = Math.floor(100000 + Math.random() * 900000).toString(); // 6 digit angka
  const expires = Date.now() + 5 * 60 * 1000; // berlaku 5 menit

  pendingUsers[email].code = otpCode;
  pendingUsers[email].expires = expires;

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
    subject: "Kode Verifikasi Baru - Emotrack",
    html: `
      <div style="font-family: Arial; padding: 20px;">
        <h2 style="color:#4CAF50">Verifikasi Ulang Akun Emotrack</h2>
        <p>Kode OTP baru Anda adalah:</p>
        <h1 style="background:#f2f2f2; padding:10px; border-radius:5px; display:inline-block;">${otpCode}</h1>
        <p>Kode ini berlaku selama 5 menit. Jangan bagikan kepada siapa pun.</p>
      </div>
    `,
  };

  transporter.sendMail(mailOptions, (err, info) => {
    if (err) {
      console.log(err);
      return res.status(500).json({ message: "Gagal mengirim ulang OTP" });
    }

    res.json({ message: "Kode OTP baru telah dikirim ke email Anda" });
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

// Lupa Password - Kirim OTP
exports.forgotPassword = (req, res) => {
  const { email } = req.body;

  User.findUserByEmail(email, (err, results) => {
    if (err || results.length === 0) {
      return res.status(404).json({ message: "Email tidak ditemukan" });
    }

    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = Date.now() + 5 * 60 * 1000;

    resetTokens[email] = { code: resetCode, expires };

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
        <div style="font-family: Arial, padding: 20px;">
          <h2 style="color: #4CAF50;">Reset Password Emotrack</h2>
          <p>Gunakan kode berikut untuk reset password akun Anda:</p>
          <h1 style="background: #f2f2f2; padding: 15px; text-align: center; border-radius: 5px;">${resetCode}</h1>
          <p>Kode ini hanya berlaku selama 5 menit.</p>
          <p>Jika Anda tidak meminta reset password, abaikan email ini.</p>
        </div>
      `,
    };

    transporter.sendMail(mailOptions, (error) => {
      if (error) {
        console.error(error);
        return res.status(500).json({ message: "Gagal mengirim email" });
      }

      res.json({ message: "Kode verifikasi dikirim ke email Anda" });
    });
  });
};

// Verifikasi OTP Reset
exports.verifyResetCode = (req, res) => {
  const { email, code } = req.body;
  const token = resetTokens[email];

  if (!token || token.code !== code || Date.now() > token.expires) {
    return res.status(400).json({ message: "Kode salah atau kadaluarsa" });
  }

  res.json({ message: "Kode valid" });
};

// Reset Password
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

    User.updatePasswordByEmail(email, hashedPassword, (err) => {
      if (err) {
        return res.status(500).json({ message: "Gagal update password" });
      }

      delete resetTokens[email];
      res.json({ message: "Password berhasil direset" });
    });
  });
};
