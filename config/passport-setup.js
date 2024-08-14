const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/user');

passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser((id, done) => {
    User.findById(id).then((user) => {
        done(null, user);
    });
});

passport.use(new GoogleStrategy({
    clientID: 'your_client_id',
    clientSecret: 'your_client_secret',
    callbackURL: '/auth/google/redirect'
}, async (accessToken, refreshToken, profile, done) => {
    const existingUser = await User.findOne({ googleId: profile.id });
    if (existingUser) {
        done(null, existingUser);
    } else {
        const newUser = await new User({
            googleId: profile.id,
            username: profile.displayName,
            gmail: profile.emails[0].value
        }).save();
        done(null, newUser);
    }
}));
