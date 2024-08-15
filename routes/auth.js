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

// const router = require('express').Router();
// const passport = require('passport');


// // Google authentication routes (unchanged)
// router.get('/google', passport.authenticate('google', {
//     scope: ['profile', 'email']
// }));

// router.get('/google/redirect', passport.authenticate('google', { failureRedirect: '/auth/login' }), (req, res) => {
//     res.redirect('/auth/dashboard');
// });

// // Dashboard route
// router.get('/dashboard', async (req, res) => {
//     if (req.isAuthenticated()) {
//         return res.send(`Welcome ${req.user.username}`);
//     } else {
//         var { email, password } = req.session; // Assume email and password are stored in session during manual login
//         if (email && password) {
//             try {
//                 const user = await User.findOne({ gmail: email });
//                 if (user && await bcrypt.compare(password, user.password)) {
//                     return res.send(`Welcome ${user.username}`);
//                 }
//             } catch (error) {
//                 // Handle any potential errors, such as database issues
//                 return res.status(500).send('Server error');
//             }
//         }
//         return res.redirect('/login');
//     }
// });

// // Login route (for manual login)
// router.post('/login', async (req, res, next) => {
//     const { email, password } = req.body;

//     try {
//         const user = await User.findOne({ gmail: email });
//         if (!user) {
//             return res.status(400).render('login', { error: 'User not found' });
//         }

//         const isMatch = await bcrypt.compare(password, user.password);
//         if (!isMatch) {
//             return res.status(400).render('login', { error: 'Invalid credentials' });
//         }

//         // Store email and password in session for the dashboard check
//         req.session.email = email;
//         req.session.password = password;

//         // Use Passport's login method to establish a session
//         req.login(user, (err) => {
//             if (err) {
//                 return next(err);
//             }
//             return res.redirect('/auth/dashboard');
//         });
//     } catch (error) {
//         return res.status(500).render('login', { error: 'Server error' });
//     }
// });

// // Logout route
// router.get('/logout', (req, res) => {
//     req.logout(() => {
//         req.session.user = null;
//         req.session.email = null;
//         req.session.password = null;
//         res.redirect('/');
//     });
// });

// module.exports = router;

