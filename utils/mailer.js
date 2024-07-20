const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: false, 
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
});


//Send verification email
const sendVerificationEmail = async (email, otp) => {
    try {
        const mailOptions = {
            from: process.env.SMTP_USER,
            to: email,
            subject: 'Verify Your Email Address',
            text: `Your OTP for email verification is: ${otp}`
            
        };
         console.log("otp:",otp);
        await transporter.sendMail(mailOptions);
        console.log('Verification email sent successfully to:', email);
    } catch (error) {
        console.error('Error sending verification email:', error.message);
        throw new Error('Error sending verification email');
    }
};

module.exports = { sendVerificationEmail };
