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
    clientID: '88602286776-f74qe8hsgc547hqa8pstqk8plhsds0r0.apps.googleusercontent.com',
    clientSecret: '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',
    callbackURL: '/auth/google/redirect'
  },
  async function(accessToken, refreshToken, profile, done) {
    try {
        // Use async/await to handle the findOne query
        let user = await User.findOne({ googleId: profile.id });

        if (!user) {
            // If user does not exist, create a new user
            user = new User({
                username: profile.displayName,
                gmail: profile.emails[0].value,
                googleId: profile.id
            });
            await user.save(); // Save the new user
        }
        
        return done(null, user); // Return the user (existing or newly created)
    } catch (err) {
        return done(err); // Handle any errors
    }
  }
));
