const router = require('express').Router();
const passport = require('passport');

router.get('/google', passport.authenticate('google', {
    scope: ['profile', 'email']
}));

router.get('/google/redirect', passport.authenticate('google'), (req, res) => {
    res.redirect('/auth/dashboard');
});

router.get('/dashboard', (req, res) => {
    if (req.isAuthenticated()) {
        res.send(`Welcome ${req.user.username}`);
    } else {
        res.redirect('/auth/login');
    }
});

router.get('/logout', (req, res) => {
    req.logout(() => {
        res.redirect('/');
    });
});

module.exports = router;

