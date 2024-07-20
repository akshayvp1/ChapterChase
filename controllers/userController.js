

const User = require('../models/userModel');
const bcrypt = require('bcrypt');
const { sendVerificationEmail } = require('../utils/mailer');
const randomstring = require('randomstring');
const moment = require('moment');
const Product = require('../models/productModel');
const Category = require('../models/categoryModel');


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


// Load home page
const loadHome = async (req, res) => {
   
    try {
        const user = req.user || req.session.user;
        res.render("home", { user }); 
    } catch (error) {
        console.log('Error loading home page:', error.message);
        res.status(500).send('Internal server error');
    }

};


// Load login page
const loadLogin = async (req, res) => {
    try {
        res.render('login'); 
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
            return res.render('register', { message: "Email already exists" });     
          }

        else{
        const otp = randomstring.generate({ length: 6, charset: 'numeric' });
        const otpExpiration = moment().add(10, 'minutes').toDate();


        hashedPassword = await securePassword(password);

        // Store user data and OTP in session
        req.session.userData = {
            name: registerName,
            email: registerEmail,
            mobile: registerMobile,
            password: hashedPassword,
            is_admin: 0,
            verificationOTP: otp,
            otpExpiration: otpExpiration,
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


// Verify OTP function
const verifyOTP = async (req, res) => {
    try {
        const { email, otp } = req.body;

        if (!email) {
            console.error('Email is missing in request body');
            return res.status(400).send('Email is required for OTP verification');
        }

        const userData = req.session.userData;

        if (!userData || userData.email !== email) {
            console.log(`No session data found for email: ${email}`);
            return res.status(400).send('No session data found for this email');
        }

        const storedOTP = userData.verificationOTP ? userData.verificationOTP.trim() : null;
        const enteredOTP = otp.trim();

        console.log(`Session data found for email: ${email}, OTP in session: ${storedOTP}, Entered OTP: ${enteredOTP}, OTP Expiration: ${userData.otpExpiration}`);

        if (!storedOTP || storedOTP !== enteredOTP) {
            console.log('Entered OTP does not match stored OTP');
            // return res.status(400).send('Invalid OTP');
            return res.render('otp')
        }

        if (moment().isAfter(userData.otpExpiration)) {
            console.log('OTP is expired');
            return res.status(400).send('OTP expired');
        }

        const newUser = new User({
            ...userData,
            is_verified: 1
        });

        await newUser.save();

        req.session.user = newUser;

        console.log(`User with email: ${email} verified successfully`);

        res.redirect('/home');
    } catch (error) {
        console.error("Error verifying OTP:", error.message);
        res.status(500).send('Internal server error');
    }
};



// Resend OTP 
const resendOTP = async (req, res) => {
    try {
        const { email } = req.query;

        if (!req.session.userData || req.session.userData.email !== email) {
            console.log(`No session data found for email: ${email}`);
            return res.status(400).send('No session data found for this email');
        }

        const otp = randomstring.generate({ length: 6, charset: 'numeric' });
        const otpExpiration = moment().add(10, 'minutes').toDate();

        req.session.userData.verificationOTP = otp;
        req.session.userData.otpExpiration = otpExpiration;

        await sendVerificationEmail(email, otp);

        res.redirect(`/verify-otp?email=${email}`); // Redirect to OTP verification page
    } catch (error) {
        console.error("Error resending OTP:", error.message);
        res.status(500).send('Internal server error');
    }
};


// Verify Login 
const verifyLogin = async (req, res) => {
    try {
        const { email, password } = req.body;
        console.log("first pass",password);
        // Find user by email
        const user = await User.findOne({email:email});

        // If user not found
        if (!user) {
            console.log(`User not found for email: ${email}`);
            return res.render('login',{message:"Invalid email or password"})

        }

        // Compare passwords using bcrypt
        const match = await bcrypt.compare(password, user.password);

        console.log('Entered password:', password);
        console.log('Stored hashed password:', user.password);
        console.log('Password match:', match);

        if (!match) {
            console.log('Invalid password');
            // return res.status(401).send('Invalid password');
            return res.render('login',{message:"Invalid email password"})

        }

        // Set user session 
        req.session.user = {
            id: user._id,
            email: user.email,
            name: user.name,
            mobile:user.mobile
        };

        res.redirect('/home'); // Redirect to home page after successful login
    } catch (error) {
        console.error('Error verifying login:', error.message);
        res.status(500).send('Internal server error');
    }
};



//Login success load home
const loginSuccess = (req,res)=>{
    try{
        res.redirect("/home")

    }
    catch(error){
        console.log(error.message);
    }
}


//Login fail load login
const loginFailure = (req,res)=>{
    try{
        res.render('login')
    }
    catch(error){
        console.log(error.message);
    }
}


//If logout session destroy
const logout = (req, res) => {
    try {
        req.session.destroy(err => {
            if (err) {
                console.error('Error destroying session:', err.message);
            } else {
                console.log('Session destroyed successfully');
            }
            res.redirect('/home'); // Redirect to login page after logout
        });
    } catch (error) {
        console.error('Error logging out:', error.message);
        res.status(500).send('Internal server error');
    }
};


//Load profile with user name
const loadProfile = (req,res)=>{
    try{
        console.log("haiiii");
        const user = req.user || req.session.user;
        console.log(user);
        res.render('profile', { user })
    }
    catch(error){
        console.log(error.message);
    }
}

const loadProductsList =async (req,res)=>{
    try{

        const products = await Product.find();
        
        res.render('products-list',{products})
    }
    catch(error){
        console.log(error.message);
    }
}




module.exports = {
    loadHome,
    loadLogin,
    loadRegister,
    insertUser,
    loadOtp,
    verifyOTP,
    resendOTP,
    verifyLogin,
    loginSuccess,
    loginFailure,
    logout,
    loadProfile,
    loadProductsList
};




