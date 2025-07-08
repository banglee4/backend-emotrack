const express = require("express");
const router = express.Router();
const passport = require("passport");
const authController = require("../controllers/authController");
const authGoogleController = require("../controllers/authGoogleController");

router.post("/register", authController.register);
router.post("/login", authController.login);

// === GOOGLE LOGIN ===
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

router.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: "/",
    successRedirect: "/",
  })
);

router.get("/profile", authGoogleController.getProfile);
router.get("/logout", authGoogleController.logout);

module.exports = router;
