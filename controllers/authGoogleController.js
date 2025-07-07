const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;

passport.use(
  new GoogleStrategy(
    {
      clientID: "YOUR_GOOGLE_CLIENT_ID",
      clientSecret: "YOUR_GOOGLE_CLIENT_SECRET",
      callbackURL: "/auth/google/callback",
    },
    function (accessToken, refreshToken, profile, done) {
      // Simpan info user ke database jika perlu
      return done(null, profile);
    }
  )
);

// Serialize & deserialize user
passport.serializeUser((user, done) => {
  done(null, user);
});
passport.deserializeUser((obj, done) => {
  done(null, obj);
});
