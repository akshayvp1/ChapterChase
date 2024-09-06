const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/userModel');

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: process.env.GOOGLE_CALLBACK_URL
},
async (accessToken, refreshToken, profile, done) => {
  try {
    let user = await User.findOne({ googleId: profile.id });
    if (!user) {
      user = new User({
        googleId: profile.id,
        displayName: profile.displayName || "N/A",
        name: profile.displayName || "N/A",
        email: profile.emails[0].value,
        password: "N/A",
        mobile: "N/A",
        is_verified: 1,
        is_admin: false,
        isListed: true
      });
      await user.save();
    }
    
    if (!user.isListed) {
      return done(null, false, { message: 'Your account is blocked.' });
    }
    
    return done(null, user);
  } catch (err) {
    console.error('Error in Google Strategy:', err.message);
    return done(err, false);
  }
}));

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

module.exports = passport;