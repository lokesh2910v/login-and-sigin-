

const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
    },
    gmail: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        default: null, // Allow null by default
    },
    googleId: {
        type: String,
        default: null, // Default to null for non-Google signups
    }
});

const User = mongoose.model('User', userSchema);

module.exports = User;
