const express = require('express');
const userRoute = express();
const session = require('express-session');
const bodyParser = require('body-parser');
const passport = require('passport');
const path = require('path');
const nocache = require('nocache');

const orderController = require('../controllers/user/orderController')
const userController = require('../controllers/user/userController');
const auth=require("../middleware/auth")
const addressController = require('../controllers/user/addressController')
const cartController = require('../controllers/user/cartController')
const wishlistController = require('../controllers/user/wishlistController')
const productController = require('../controllers/user/productController')
const changePasswordController = require('../controllers/user/changePasswordController')
const profileController = require('../controllers/user/profileController')
const walletController = require('../controllers/user/walletController')

userRoute.set('view engine', 'ejs');
userRoute.set('views', './views/users');


userRoute.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      path: '/',
      _expires: 86400000,
      httpOnly: true
  }
}));


userRoute.use(nocache());
userRoute.use(bodyParser.json());
userRoute.use(bodyParser.urlencoded({ extended: true }));





userRoute.use(passport.initialize());
userRoute.use(passport.session());


userRoute.get("/", userController.loadHome);
userRoute.get("/login", userController.loadLogin);
userRoute.get("/register", userController.loadRegister);
userRoute.get("/home", userController.loadHome);
userRoute.post("/signup", userController.insertUser);
userRoute.get("/verify-otp", userController.loadOtp);
userRoute.post("/verify-otp", userController.verifyOTP);
userRoute.get("/resend-otp", userController.resendOTP);
userRoute.post('/login', userController.verifyLogin);




userRoute.get('/forgot-password',userController.loadForgot)
userRoute.post('/forgot-password', userController.forgotPassword);
userRoute.get('/reset-password/:token', userController.getResetPassword);
userRoute.post('/reset-password/:token', userController.postResetPassword);




userRoute.get('/account',auth.isLogin,userController.loadAccount)
userRoute.get('/logout',auth.isLogin,userController.logout)

//product
userRoute.get('/products-list',productController.loadProductsList)
userRoute.get('/product-details/:id',productController.loadProductDetails)


//cart
userRoute.get('/cart',auth.isLogin,cartController.loadCart)
userRoute.post('/add-to-cart',auth.isLogin, cartController.addToCart);
userRoute.patch('/update-cart',auth.isLogin,cartController. updateCart);
userRoute.delete('/remove-from-cart',auth.isLogin, cartController.removeFromCart);

//wishlist
userRoute.get('/wishlist',auth.isLogin,wishlistController.loadWishlist)
userRoute.post('/add-to-wishlist', auth.isLogin, wishlistController.addToWishlist);
userRoute.delete('/remove-from-wishlist/:productId', wishlistController.removeFromWishlist);




//profile
userRoute.get('/dashboard-user',auth.isLogin,profileController.loadUserDashboard)
userRoute.get('/account-details',auth.isLogin,profileController.loadAccountDetails)
userRoute.patch('/update-user', auth.isLogin, profileController.updateUser);
userRoute.get('/user-order',auth.isLogin,profileController.loadUserOrder)
userRoute.get('/user-download',auth.isLogin,profileController.loadUserDownload)



//address
userRoute.post('/add-address', auth.isLogin, addressController.addAddress);
userRoute.get('/user-address',auth.isLogin,addressController.loadUserAddress)
userRoute.get('/get-address/:id',auth.isLogin, addressController.getAddress);
userRoute.patch('/edit-address/:id', auth.isLogin, addressController.updateAddress);
userRoute.delete('/delete-address/:id',auth.isLogin, addressController.deleteAddres);


//change password
userRoute.get('/change-password',auth.isLogin,changePasswordController.loadChangePassword)
userRoute.post('/change-password', changePasswordController.loadPasswordChange);


//order
userRoute.get('/checkout',auth.isLogin,orderController.loadCheckout)
userRoute.post('/place-order',auth.isLogin,orderController.placeOrder)
userRoute.get('/order-summary/:order_id',auth.isLogin,orderController.loadOrderSummary)
userRoute.patch('/order/order-status',auth.isLogin,orderController. updateOrderStatus);
userRoute.get('/order/:id',auth.isLogin,orderController.getUserOrder)
userRoute.post('/order/return-request', auth.isLogin, orderController.submitReturnRequest);



//Wallet
userRoute.get('/wallet',auth.isLogin,walletController.loadWallet)


//razorpay
userRoute.post('/create-order',auth.isLogin, orderController.createOrder);
userRoute.post('/verify-payment',auth.isLogin, orderController.verifyPayment);



// Google OAuth routes
userRoute.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

userRoute.get('/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/login' }),
  (req, res) => {
    res.redirect('/home');
  }
);

module.exports = userRoute;
