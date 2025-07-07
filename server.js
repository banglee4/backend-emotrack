const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
require("dotenv").config();
const passport = require("passport");
const session = require("express-session");

const authRoutes = require("./routes/auth");
const chatBotRoutes = require("./routes/chatBot");
require("./googleAuth/auth"); // Pastikan konfigurasi Google OAuth dimuat

const app = express();
const port = 3000;

// Middleware
app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
  })
);
app.use(passport.initialize());
app.use(passport.session());

// Routes
app.use("/api/auth", authRoutes); // Untuk login, callback, logout, dll
app.use("/api/chat", chatBotRoutes); // Rute chatbot
app.get("/", (req, res) => {
  res.send(`<h1>Home</h1><a href="/api/auth/google">Login with Google</a>`);
});

// Jalankan server
app.listen(port, () => {
  console.log(`Server berjalan di http://localhost:${port}`);
});
