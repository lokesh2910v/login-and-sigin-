// 

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

// Middleware to check password presence on manual signups
// userSchema.pre('save', function(next) {
//     if (!this.googleId && !this.password) {
//         return next(new Error('Password is required for manual signups'));
//     }
//     next();
// });

const User = mongoose.model('User', userSchema);

module.exports = User;
