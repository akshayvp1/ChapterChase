const express = require('express');
const userRoute = express();
const session = require('express-session');
const bodyParser = require('body-parser');
const passport = require('passport');
const path = require('path');
const nocache = require('nocache');

const orderController = require('../controllers/orderController')
const userController = require('../controllers/userController');
const auth=require("../middleware/auth")

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





userRoute.get('/account',auth.isLogin,userController.loadAccount)
userRoute.get('/logout',auth.isLogin,userController.logout)
userRoute.get('/products-list',userController.loadProductsList)
userRoute.get('/product-details/:id',userController.loadProductDetails)



userRoute.get('/cart',auth.isLogin,userController.loadCart)
userRoute.post('/add-to-cart', userController.addToCart);
userRoute.patch('/update-cart',userController. updateCart);
userRoute.delete('/remove-from-cart', userController.removeFromCart);


userRoute.get('/wishlist',auth.isLogin,userController.loadWishlist)
userRoute.post('/add-to-wishlist', auth.isLogin, userController.addToWishlist);
userRoute.patch('/update-user', auth.isLogin, userController.updateUser);



userRoute.post('/add-address', auth.isLogin, userController.addAddress);
userRoute.get('/dashboard-user',auth.isLogin,userController.loadUserDashboard)
userRoute.get('/account-details',auth.isLogin,userController.loadAccountDetails)
userRoute.get('/user-order',auth.isLogin,userController.loadUserOrder)
userRoute.get('/user-download',auth.isLogin,userController.loadUserDownload)


userRoute.get('/user-address',auth.isLogin,userController.loadUserAddress)

userRoute.get('/get-address/:id',auth.isLogin, userController.getAddress);
userRoute.patch('/edit-address/:id',auth.isLogin, userController.updateAddress);
userRoute.delete('/delete-address/:id',auth.isLogin, userController.deleteAddres);

userRoute.get('/change-password',auth.isLogin,userController.loadChangePassword)

userRoute.post('/change-password', userController.loadPasswordChange);



userRoute.get('/checkout',auth.isLogin,orderController.loadCheckout)
userRoute.post('/place-order',auth.isLogin,orderController.placeOrder)

userRoute.get('/order-summary/:order_id',auth.isLogin,orderController.loadOrderSummary)

userRoute.patch('/order/order-status',auth.isLogin,userController. updateOrderStatus);
userRoute.get('/order/:id',auth.isLogin,userController.getUserOrder)

// Google OAuth routes
userRoute.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

userRoute.get('/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/login' }),
  (req, res) => {
    res.redirect('/home');
  }
);

module.exports = userRoute;
