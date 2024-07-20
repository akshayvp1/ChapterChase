const express = require('express');
const userRoute = express();
const session = require('express-session');
const bodyParser = require('body-parser');
const passport = require('passport');
const app = express()
const userController = require('../controllers/userController');
const auth=require("../middleware/auth")

userRoute.set('view engine', 'ejs');
userRoute.set('views', './views/users');


userRoute.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false
}));


userRoute.use(bodyParser.json());
userRoute.use(bodyParser.urlencoded({ extended: true }));


userRoute.use(passport.initialize());
userRoute.use(passport.session());


// existing routes
userRoute.get("/", userController.loadHome);
userRoute.get("/login", userController.loadLogin);
userRoute.get("/register", userController.loadRegister);
userRoute.get("/home", userController.loadHome);
userRoute.post("/signup", userController.insertUser);
userRoute.get("/verify-otp", userController.loadOtp);
userRoute.post("/verify-otp", userController.verifyOTP);
userRoute.get("/resend-otp", userController.resendOTP);
userRoute.post('/login', userController.verifyLogin);
userRoute.get('/profile',auth.isLogin,userController.loadProfile)
userRoute.get('/logout',auth.isLogin,userController.logout)
userRoute.get('/products-list',userController.loadProductsList)



// Google OAuth routes
userRoute.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

userRoute.get('/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/login' }),
  (req, res) => {
    // Successful authentication, redirect to home.
    res.redirect('/home');
  }
);

module.exports = userRoute;
