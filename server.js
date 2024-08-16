const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const passport = require('passport');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const authRoutes = require('./routes/auth');
const path = require("path");

const User = require('./models/user');


const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, 'public')));

mongoose.connect('mongodb+srv://lokeshmbu2004:6fnkI8kUUr2LXW0T@cluster0.udim8.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0')
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.log(err));

app.use(express.static('views'));
app.set('view engine', 'ejs');
app.set('views', './views');

app.use(session({
    secret: '@Astra2004',
    resave: false,
    saveUninitialized: true
}));


app.use(passport.initialize());
app.use(passport.session());
app.use('/auth', authRoutes);


const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'astradigitalagencies@gmail.com',
        pass: 'ylwz fdie gona yfwi' 
    }
});

let otpStorage = {};


app.get('/', (req, res) => {
    res.render("login");
});

app.get('/signin', (req, res) => {
    res.render("signin");
});


app.post('/send-otp', async (req, res) => {
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

app.post('/verify-otp', async (req, res) => {
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


app.listen(3000, () => {
    console.log('Server started on port 3000');
});
