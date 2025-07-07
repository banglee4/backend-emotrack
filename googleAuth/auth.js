const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const userGoogleModel = require("../models/userGoogleModel");

// Konfigurasi strategy sekali saja saat aplikasi dijalankan
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
    },
    (accessToken, refreshToken, profile, done) => {
      // Simpan ke database jika perlu
      const googleId = profile.id;
      const name = profile.displayName;
      const email = profile.emails[0].value;
      const photo = profile.photos[0].value;

      userGoogleModel.findByGoogleId(googleId, (err, user) => {
        if (err) return done(err);
        if (user) return done(null, user);

        const newUser = {
          googleId,
          name,
          email,
          photo,
        };

        userGoogleModel.createUser(newUser, (err, user) => {
          if (err) return done(err);
          done(null, user);
        });
      });

      //   return done(null, profile);
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user);
});
passport.deserializeUser((obj, done) => {
  done(null, obj);
});
