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





// const nodemailer = require("nodemailer");
// require("dotenv").config();

// // Debug Environment Variables
// console.log("========== SMTP CONFIG ==========");
// console.log("SMTP_HOST:", process.env.SMTP_HOST);
// console.log("SMTP_PORT:", process.env.SMTP_PORT);
// console.log("SMTP_USER:", process.env.SMTP_USER);
// console.log(
//   "SMTP_PASS:",
//   process.env.SMTP_PASS ? "Loaded ✅" : "Not Loaded ❌"
// );
// console.log("=================================");

// // Create Transporter
// const transporter = nodemailer.createTransport({
//   host: process.env.SMTP_HOST,
//   port: Number(process.env.SMTP_PORT),
//   secure: false, // true for 465, false for 587
//   auth: {
//     user: process.env.SMTP_USER,
//     pass: process.env.SMTP_PASS,
//   },
// });

// // Verify SMTP Connection
// transporter.verify((error, success) => {
//   if (error) {
//     console.error("❌ SMTP Verification Failed");
//     console.error(error);
//   } else {
//     console.log("✅ SMTP Server is ready to send emails");
//   }
// });

// // Send Verification Email
// const sendVerificationEmail = async (email, otp) => {
//   try {
//     const mailOptions = {
//       from: `"ChapterChase" <${process.env.SMTP_USER}>`,
//       to: email,
//       subject: "Verify Your Email Address",
//       text: `Your OTP for email verification is: ${otp}`,
//       html: `
//         <h2>ChapterChase Email Verification</h2>
//         <p>Your OTP is:</p>
//         <h1 style="color:#2563eb;">${otp}</h1>
//         <p>This OTP is valid for 5 minutes.</p>
//       `,
//     };

//     console.log("Sending OTP:", otp);

//     const info = await transporter.sendMail(mailOptions);

//     console.log("✅ Email sent successfully");
//     console.log(info.response);

//     return true;
//   } catch (error) {
//     console.error("❌ Error sending verification email");
//     console.error(error);
//     throw error;
//   }
// };

// module.exports = { sendVerificationEmail };