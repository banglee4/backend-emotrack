const express = require("express");
const router = express.Router();
const passport = require("passport");
const authController = require("../controllers/authController");
const authGoogleController = require("../controllers/authGoogleController");

router.post("/register", authController.register);
router.post("/login", authController.login);

// reset password route
router.post("/forgot-password", authController.forgotPassword);
router.post("/verify-reset-code", authController.verifyResetCode);
router.post("/reset-password", authController.resetPassword);

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
