

const User = require('../../models/userModel');
const bcrypt = require('bcrypt');
const { sendVerificationEmail } = require('../../utils/mailer');
const randomstring = require('randomstring');
const moment = require('moment');
const Product = require('../../models/productModel');
const Category = require('../../models/categoryModel');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
require('dotenv').config();
const Cart = require('../../models/cartModel');
const Wishlist = require('../../models/wishlistModel');
const mongoose = require('mongoose');
const Address = require('../../models/addressModel');
const { log } = require('console');
const Order = require('../../models/orderModel');







// Load home page
const loadHome = async (req, res) => {
    try {

        const products = await Product.find({ status: 'Active' });
        const categories = await Category.find({});
        const user = req.user || req.session.user;
        let wishlist=null;
        let wishlistCount=0;
        console.log("user",user);
        

        if(user&& user.id){
            wishlist=await Wishlist.findOne({userId: user.id})
            if(wishlist && wishlist.products){
                wishlistCount=wishlist.products.length
                console.log("daaa",wishlistCount);
                
            }
        }

        let cart = null;
        let cartCount = 0;

        if (user && user.id) {
            cart = await Cart.findOne({ userId: user.id });
            if (cart && cart.items) {
                cartCount = cart.items.length;
            }
        }

        console.log('Cart:', cart);
        console.log('Cart count:', cartCount);

        res.render("home", { user, categories, products, cartCount,wishlistCount });
    } catch (error) {
        console.log('Error loading home page:', error.message);
        res.status(500).send('Internal server error');
    }
};


// Load login page
const loadLogin = async (req, res) => {
    try {
        const categories = await Category.find({})
         
        if (req.session.user) {
            res.render('home', {categories});
            return;
        }
        
        const message = req.query.message || '';
        return res.render('login', { message }); 
    } catch (error) {
        console.error('Error loading login page:', error.message);
        res.status(500).send('Internal server error');
    }
};


// Load register page
const loadRegister = async (req, res) => {
    try {
         res.render('register');
    } catch (error) {
        console.error('Error loading register page:', error.message);
        res.status(500).send('Internal server error');
    }
};


// Insert User with email verification
const insertUser = async (req, res) => {
    try {

        const { registerName, registerEmail, registerMobile, password } = req.body;

        const user = await User.findOne({email:registerEmail});

        if(user){
            console.log(user);
             res.render('register', { message: "Email already exists" });     
          }

        else{
        const otp = randomstring.generate({ length: 6, charset: 'numeric' });
        const otpExpiration = moment().add(1, 'minutes').toDate();

        hashedPassword = await securePassword(password);

        req.session.userData = {
            name: registerName,
            email: registerEmail,
            mobile: registerMobile,
            password: hashedPassword,
            is_admin: 0,
            verificationOTP: otp,
            otpExpiration: otpExpiration,
            isListed:true,
            
        };

        await sendVerificationEmail(registerEmail, otp);

         res.render('otp', { email: registerEmail });
    }
    } catch (error) {
        console.error("Error inserting user:", error.message);
         res.status(500).send('Internal server error');
    }
};


// Load OTP page
const loadOtp = (req, res) => {
    try {
        const email = req.query.email; 
         res.render('otp', { email }); 
    } catch (error) {
        console.error('Error loading OTP page:', error.message);
         res.status(500).send('Internal server error');
    }
};

// Secure Password function
const securePassword = async (password) => {
    try {
        console.log(password)
        const hashedPassword = await bcrypt.hash(password,10);
        return hashedPassword;
    } catch (error) {
        console.error("Error hashing password:", error.message);
        throw new Error("Error hashing password");
    }
};

//verify otp
// const verifyOTP = async (req, res) => {
//     try {
//         const { email, otp } = req.body;

//         if (!email) {
//             console.error('Email is missing in request body');
//             return res.status(400).json({ error: 'Email is required for OTP verification' });
//         }

//         const userData = req.session.userData;

//         if (!userData || userData.email !== email) {
//             console.log(`No session data found for email: ${email}`);
//             return res.status(400).json({ error: 'No session data found for this email' });
//         }

//         const storedOTP = userData.verificationOTP ? userData.verificationOTP.trim() : null;
//         const enteredOTP = otp.trim();

//         console.log(`Session data found for email: ${email}, OTP in session: ${storedOTP}, Entered OTP: ${enteredOTP}, OTP Expiration: ${userData.otpExpiration}`);

//         if (!storedOTP || storedOTP !== enteredOTP) {
//             console.log('Entered OTP does not match stored OTP');
//             return res.status(400).json({ error: 'Invalid OTP' });
//         }

//         if (moment().isAfter(userData.otpExpiration)) {
//             console.log('OTP is expired');
//             return res.status(400).json({ error: 'OTP expired' });
//         }

//         const newUser = new User({
//             ...userData,
//             is_verified: 1
//         });

//         await newUser.save();

//         req.session.user = newUser;
// console.log(newUser,'its your datauset');

//         console.log(`User with email: ${email} verified successfully`);

//         return res.status(200).json({ success: true, message: 'OTP verified successfully' });
//     } catch (error) {
//         console.error("Error verifying OTP:", error.message);
//         return res.status(500).json({ error: 'Internal server error' });
//     }
// };


const verifyOTP = async (req, res) => {
    try {
        const { email, otp } = req.body;

        if (!email) {
            console.error('Email is missing in request body');
            return res.status(400).json({ error: 'Email is required for OTP verification' });
        }

        const userData = req.session.userData;

        if (!userData || userData.email !== email) {
            console.log(`No session data found for email: ${email}`);
            return res.status(400).json({ error: 'No session data found for this email' });
        }

        const storedOTP = userData.verificationOTP ? userData.verificationOTP.trim() : null;
        const enteredOTP = otp.trim();

        console.log(`Session data found for email: ${email}, OTP in session: ${storedOTP}, Entered OTP: ${enteredOTP}, OTP Expiration: ${userData.otpExpiration}`);

        if (!storedOTP || storedOTP !== enteredOTP) {
            console.log('Entered OTP does not match stored OTP');
            return res.status(400).json({ error: 'Invalid OTP' });
        }

        if (moment().isAfter(userData.otpExpiration)) {
            console.log('OTP is expired');
            return res.status(400).json({ error: 'OTP expired' });
        }

        const newUser = new User({
            ...userData,
            is_verified: 1
        });

        await newUser.save();

        console.log(`User with email: ${email} verified successfully`);

    
        req.session.userData = null;

        
        return res.status(200).json({ 
            success: true, 
            message: 'OTP verified successfully.',
            redirect: '/login'  
        });
    } catch (error) {
        console.error("Error verifying OTP:", error.message);
        return res.status(500).json({ error: 'Internal server error' });
    }
};


//resend otp
const resendOTP = async (req, res) => {
    try {
        const { email } = req.query;

        if (!req.session.userData || req.session.userData.email !== email) {
            console.log(`No session data found for email: ${email}`);
            return res.status(400).json({ error: 'No session data found for this email' });
        }

        const otp = randomstring.generate({ length: 6, charset: 'numeric' });
        const otpExpiration = moment().add(10, 'minutes').toDate();

        req.session.userData.verificationOTP = otp;
        req.session.userData.otpExpiration = otpExpiration;

        await sendVerificationEmail(email, otp);

        return res.status(200).json({ message: 'OTP resent successfully' });
    } catch (error) {
        console.error("Error resending OTP:", error.message);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

//verify login
const verifyLogin = async (req, res) => {
    try {
        const { email, password } = req.body;
        console.log("first pass", password);

        const user = await User.findOne({email: email});

        if (!user) {
            console.log(`User not found for email: ${email}`);
            return res.render('login', {message: "Invalid email or password"});
        }

        if (!user.isListed) {
            return res.render('login', { message: 'Your account is blocked.' });
        }

        const match = await bcrypt.compare(password, user.password);

        console.log('Entered password:', password);
        console.log('Stored hashed password:', user.password);
        console.log('Password match:', match);

        if (!match) {
            console.log('Invalid password');
            return res.render('login', {message: "Invalid email or password"});
        }

        
        req.session.user = {
            id: user._id,
            email: user.email,
            name: user.name,
            mobile: user.mobile
        };

        res.redirect('/home'); 
    } catch (error) {
        console.error('Error verifying login:', error.message);
        res.status(500).send('Internal server error');
    }
};


//If logout session destroy
const logout = (req, res) => {
    try {
        req.session.destroy(err => {
            if (err) {
                console.error('Error destroying session:', err.message);
            } else {
                console.log('Session destroyed successfully');
            }
             res.redirect('/home'); 
        });
    } catch (error) {
        console.error('Error logging out:', error.message);
         res.status(500).send('Internal server error');
    }
};

//load account
const loadAccount = async (req, res) => {
    try {
        const userId = req.session.user.id;
        if (!userId) {
            return res.redirect('/login');
        }
        const addresses = await Address.find({ userId: userId });
        res.render('dashboard-user', { 
            user: req.session.user, 
            addresses: addresses 
        });
    } catch (error) {
        console.error('Error loading account:', error.message);
        res.status(500).send('Error loading account');
    }
};

//load forgot page
const loadForgot = async(req,res)=>{
    try{

        res.render('forget-password')
    }
    catch(error){
        console.log(error.message);
        
    }
}

//forgot password
const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
  
        const resetToken = crypto.randomBytes(20).toString('hex');
        user.resetPasswordToken = resetToken;
        user.resetPasswordExpires = Date.now() + 3600000; 
        await user.save();

        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT,
            secure: false,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            }
        });

        const mailOptions = {
            to: user.email,
            from: process.env.SMTP_USER,
            subject: 'Password Reset',
            text: `You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n
                   Please click on the following link, or paste this into your browser to complete the process:\n\n
                   http://${req.headers.host}/reset-password/${resetToken}\n\n
                   If you did not request this, please ignore this email and your password will remain unchanged.\n`
        };

        await transporter.sendMail(mailOptions);
        res.status(200).json({ message: 'An email has been sent to ' + user.email + ' with further instructions.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'An error occurred' });
    }
};


//get reset password
const getResetPassword = async (req, res) => {
    try {
        const user = await User.findOne({
            resetPasswordToken: req.params.token,
            resetPasswordExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ message: 'Password reset token is invalid or has expired.' });
        }

        res.render('reset-password', { token: req.params.token });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'An error occurred' });
    }
};

//reset password
const postResetPassword = async (req, res) => {
    try {
        const user = await User.findOne({
            resetPasswordToken: req.params.token,
            resetPasswordExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ message: 'Password reset token is invalid or has expired.' });
        }

        const hashedPassword = await bcrypt.hash(req.body.password, 10);
        user.password = hashedPassword;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        await user.save();

        res.redirect('/login')
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'An error occurred' });
    }
};




module.exports = {
    loadHome,
    loadLogin,
    loadRegister,
    insertUser,
    loadOtp,
    verifyOTP,
    resendOTP,
    verifyLogin,
    logout,
    loadAccount,
    forgotPassword,
    getResetPassword,
    postResetPassword,
    loadForgot
    

   
};




