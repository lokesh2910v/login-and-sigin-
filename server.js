const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const passport = require('passport');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const authRoutes = require('./routes/auth');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('./models/user');
require('./config/passport-setup');

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Connect to MongoDB
mongoose.connect('mongodb+srv://lokeshmbu2004:6fnkI8kUUr2LXW0T@cluster0.udim8.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0')
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.log(err));

// Static files and views setup
app.use(express.static('views'));
app.set('view engine', 'ejs');
app.set('views', './views');

// Session management
app.use(session({
    secret: '@Astra2004',
    resave: false,
    saveUninitialized: true
}));

// Passport initialization
app.use(passport.initialize());
app.use(passport.session());
app.use('/auth', authRoutes);

// Nodemailer setup
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'astradigitalagencies@gmail.com',
        pass: 'ylwz fdie gona yfwi' // Use app password if using 2FA
    }
});

let otpStorage = {}; // Temporary storage for OTPs

// Routes
app.get('/', (req, res) => {
    res.render("login");
});

app.get('/signin', (req, res) => {
    res.render("signin");
});

// Step 1: Send OTP
app.post('/send-otp', async (req, res) => {
    const { gmail } = req.body;

    try {
        // Check if Gmail is already registered
        const existingUser = await User.findOne({ gmail });
        if (existingUser) {
            return res.status(400).json({ message: 'Gmail already registered' });
        }

        // Generate OTP
        const otp = crypto.randomInt(100000, 999999).toString(); // Ensure OTP is always a string
        otpStorage[gmail] = otp; // Store OTP in the object

        // Send OTP via email
        const mailOptions = {
            from: 'astradigitalagencies@gmail.com',
            to: gmail,
            subject: 'Your OTP for account creation',
            text: `Your OTP is ${otp}`
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                return res.status(500).json({ message: 'Failed to send OTP' });
            }
            res.status(200).json({ message: 'OTP sent successfully' });
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
});

// Step 2: Verify OTP and Create Account
app.post('/verify-otp', async (req, res) => {
    const { gmail, otp, username, password, confirmPassword } = req.body;

    try {
        // Log the entire request body for debugging
        console.log(`Request for OTP verification:`, req.body); // Debugging log

        // Check if Gmail is defined
        if (!gmail) {
            return res.status(400).json({ message: 'Gmail is required' });
        }

        // Validate OTP
        const storedOtp = otpStorage[gmail]; // Retrieve the OTP from storage
        console.log(`Entered OTP: ${otp}, Stored OTP: ${storedOtp}`); // Debugging log
        if (storedOtp !== otp) {
            return res.status(400).json({ message: 'Invalid OTP' });
        }

        // Validate Passwords
        if (password !== confirmPassword) {
            return res.status(400).json({ message: 'Passwords do not match' });
        }

        // Check if Username is already taken
        const existingUserByUsername = await User.findOne({ username });
        if (existingUserByUsername) {
            return res.status(400).json({ message: 'Username already exists' });
        }

        // Create User
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({ gmail, username, password: hashedPassword });
        await user.save();

        // Clear OTP from storage
        delete otpStorage[gmail];

        res.status(200).json({ message: 'Account created successfully!' });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
});

// Login route
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

// Signin route
app.post('/signin', async (req, res) => {
    const { gmail, username, password, confirmPassword } = req.body;

    try {
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
        const user = new User({ gmail, username, password: hashedPassword, isGoogleUser: false });
        await user.save();

        res.status(200).json({ message: 'Account created successfully!' });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
});

// Google OAuth Callback
app.get('/auth/google/callback', passport.authenticate('google', {
    failureRedirect: '/login'
}), async (req, res) => {
    const { id, emails, displayName } = req.user;

    try {
        let user = await User.findOne({ gmail: emails[0].value });

        if (!user) {
            user = new User({
                googleId: id,
                gmail: emails[0].value,
                username: displayName,
            });
            await user.save();
        }

        res.redirect('/auth/dashboard');
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
});

// Start the server
app.listen(3000, () => {
    console.log('Server started on port 3000');
});
