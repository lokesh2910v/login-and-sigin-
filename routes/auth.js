const router = require('express').Router();

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

