const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const passport = require('passport'); 
const authRoutes = require('./routes/auth');
const GoogleStrategy = require('passport-google-oauth20').Strategy; 
const User = require('./models/user');
require('./config/passport-setup');

// for otp 
const nodemailer = require('nodemailer');
const dns = require('dns');

const app = express();
app.use(express.json());

mongoose.connect('mongodb+srv://lokeshmbu2004:6fnkI8kUUr2LXW0T@cluster0.udim8.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0')
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.log(err));


app.use(express.static('views'));
app.use(express.urlencoded({ extended: true }));

app.use(session({
    secret: '@Astra2004',
    resave: false,
    saveUninitialized: true
}));
app.set('view engine', 'ejs');
app.set('views', './views');

app.use(passport.initialize());
app.use(passport.session());

app.use('/auth', authRoutes);

app.get('/', (req, res) => {
    res.render("login.ejs");
});

app.get('/signin', (req, res) => {
    res.render("signin");
});

app.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ gmail: email });

        if (!user) {
            return res.render('login', { error: 'User not found' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.render('login', { error: 'Invalid credentials' });
        }

        res.send(`Welcome ${user.username}`);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
});




app.post('/signin', async (req, res) => {
    const { gmail, username, password, confirmPassword } = req.body;

    if (password !== confirmPassword) {
        return res.status(400).json({ message: 'Passwords do not match' });
    }

    const existingUserByEmail = await User.findOne({ gmail });
    if (existingUserByEmail) {
        return res.status(400).json({ message: 'User with this Gmail already exists' });
    }

    const existingUserByUsername = await User.findOne({ username });
    if (existingUserByUsername) {
        return res.status(400).json({ message: 'Username already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ gmail, username, password: hashedPassword ,isGoogleUser: false});
    await user.save();

    res.status(200).json({ message: 'Account created successfully!' });
});

// google auth........

passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser((id, done) => {
    User.findById(id).then((user) => {
        done(null, user);
    });
});

app.get('/auth/google/callback', passport.authenticate('google', {
    failureRedirect: '/login'
}), async (req, res) => {
    const { id, emails, displayName } = req.user;

    let user = await User.findOne({ gmail: emails[0].value });

    if (!user) {
        user = new User({
            googleId: id,
            gmail: emails[0].value,
            username: displayName,
            isGoogleUser: true
        });
        await user.save();
    }

    res.redirect('/auth/dashboard');
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


// otp validation for signup 

// // Nodemailer Transporter
// const transporter = nodemailer.createTransport({
//     service: 'gmail',
//     auth: {
//         user: 'astradigitalagencies@gmail.com',
//         pass: 'ylwz fdie gona yfwi'
//     }
// });

// // Global variable to store OTP
// let otpCode = '';

// // Function to check if the email domain exists
// function checkEmailExists(gmail) {
//     return new Promise((resolve, reject) => {
//         const domain = gmail.split('@')[1];
//         dns.resolveMx(domain, (err, addresses) => {
//             if (err || addresses.length === 0) {
//                 return reject('Invalid email address');
//             }
//             resolve(true);
//         });
//     });
// }

// // Route to send OTP
// app.post('/send-otp', async (req, res) => {
//     const { gmail } = req.body;
    
//     if (!gmail) {
//         return res.status(400).send('Email is required');
//     }
    
//     try {
//         await checkEmailExists(gmail);  // Verify email domain exists
//         otpCode = Math.floor(100000 + Math.random() * 900000); // Generate a 6-digit OTP
        
//         const mailOptions = {
//             from: 'lokeshmbu2004@gmail.com',
//             to: gmail,
//             subject: 'Your OTP Code',
//             text: `Your OTP code is ${otpCode}`
//         };
        
//         transporter.sendMail(mailOptions, (error, info) => {
//             if (error) {
//                 console.error('Error sending OTP:', error);
//                 return res.status(500).send('Error sending OTP');
//             } else {
//                 console.log('OTP sent:', info.response);
//                 res.status(200).send('OTP sent successfully');
//             }
//         });
//     } catch (error) {
//         console.error('Error sending OTP:', error);
//         res.status(400).send(error);
//     }
// });

// // Route to verify OTP
// app.post('/verify-otp', (req, res) => {
//     const { gmail, otp } = req.body;

//     if (otp !== otpCode.toString()) {
//         return res.status(400).render('signup.ejs', { error: 'Invalid OTP', gmail });
//     }

//     // OTP is valid; render the registration page
//     res.render('signup.ejs', { gmail });
// });


app.listen(3000, () => {
    console.log('Server started on port 3000');
});
