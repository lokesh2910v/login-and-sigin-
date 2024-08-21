const router = require('express').Router();
const crypto = require('crypto');
const User = require('../models/user');
const bcrypt = require('bcryptjs');

const transporter = require('../config/nodemailer');

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

let otpStorage = {};


router.get('/', (req, res) => {
    res.render("login");
});

router.get('/signin', (req, res) => {
    res.render("signin");
});


router.post('/send-otp', async (req, res) => {
    const { gmail } = req.body;

    try {

        const existingUser = await User.findOne({ gmail });
        if (existingUser) {
            return res.status(400).json({ message: 'Gmail already registered' });
        }

        
        const otp = crypto.randomInt(100000, 999999).toString(); 
        otpStorage[gmail] = otp; 

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

router.post('/verify-otp', async (req, res) => {
    const { gmail, otp, username, password, confirmPassword } = req.body;

    try {

        console.log(`Request for OTP verification:`, req.body);

      
        if (!gmail) {
            return res.status(400).json({ message: 'Gmail is required' });
        }

       
        const storedOtp = otpStorage[gmail]; 
        console.log(`Entered OTP: ${otp}, Stored OTP: ${storedOtp}`);
        if (storedOtp !== otp) {
            return res.status(400).json({ message: 'Invalid OTP' });
        }

        if (password !== confirmPassword) {
            return res.status(400).json({ message: 'Passwords do not match' });
        }

       
        const existingUserByUsername = await User.findOne({ username });
        if (existingUserByUsername) {
            return res.status(400).json({ message: 'Username already exists' });
        }

        
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({ gmail, username, password: hashedPassword });
        await user.save();

      
        delete otpStorage[gmail];

        res.status(200).json({ message: 'Account created successfully!' });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
});

router.post('/login', async (req, res) => {
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

router.post('/signin', async (req, res) => {
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
        const user = new User({ gmail, username, password: hashedPassword,  });
        await user.save();

        res.status(200).json({ message: 'Account created successfully!' });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
});


module.exports = router;

