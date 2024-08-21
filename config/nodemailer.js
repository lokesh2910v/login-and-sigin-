const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'astradigitalagencies@gmail.com',
        pass: 'ylwz fdie gona yfwi' 
    }
});

module.exports = transporter;