const path = require('path');
const fs = require('fs');
const express = require('express');
const adminRoute = express();
const session = require('express-session');
const config = require('../config/config');
const adminController = require('../controllers/admin/adminController');
const productController = require('../controllers/admin/ProductController');
const categoryController = require('../controllers/admin/categoryController');
const adminAuth = require('../middleware/adminAuth');
const upload = require('../config/multer');
const nocache = require('nocache');
const couponController = require ('../controllers/admin/couponController') 
const offerController = require('../controllers/admin/offerController')
const orderController = require('../controllers/admin/orderController')
const customerController = require('../controllers/admin/customerController')
const dashboardController = require('../controllers/admin/dashboardsController')

// Session middleware
adminRoute.use(session({
  secret: config.sessionSecret,
  resave: false,
  saveUninitialized: false,
  cookie: {
    path: '/admin',
    expires: new Date(Date.now() + 86400000),
    httpOnly: true
  }
}));

adminRoute.use(nocache());


// Set view engine and views directory
adminRoute.set('view engine', 'ejs');
adminRoute.set('views', './views/admin'); 

adminRoute.use('/dashboard-assets', express.static(path.join(__dirname, '..', 'dashboard-assets')));


// Body-parser middleware
const bodyParser = require('body-parser');
const userRoute = require('./userRoute');

adminRoute.use(bodyParser.json());
adminRoute.use(bodyParser.urlencoded({ extended: true }));

//admin authentication
adminRoute.get('/', adminController.loadAdminLogin);
adminRoute.post('/adminLogin', adminController.verifyAdmin);
adminRoute.get('/logout',adminAuth.isLogin,adminController.adminLogout)


//dashboard
adminRoute.get('/dashboard', adminAuth.isLogin,dashboardController.loadDashboard);


//category
adminRoute.get('/category-list', adminAuth.isLogin, categoryController.loadCategoryList);
adminRoute.post('/category-list/add', adminAuth.isLogin, categoryController.AddCategory);
adminRoute.patch('/categories-list/edit/:id', adminAuth.isLogin, categoryController.editCategory);


//customer list
adminRoute.get('/customer-list', adminAuth.isLogin,customerController.loadCustomerList);
adminRoute.patch('/edit/:id', adminAuth.isLogin, customerController.editCustomer);
adminRoute.post('/change-status/:id', adminAuth.isLogin, customerController.changeCustomerStatus);

//product
adminRoute.get('/product-list', adminAuth.isLogin, productController.loadProduct);
adminRoute.get('/add-product', adminAuth.isLogin, productController.loadAddProduct);
adminRoute.post('/add-product', adminAuth.isLogin, upload.array('productImages', 3), productController.addProduct);
adminRoute.get('/product/:id', adminAuth.isLogin, productController.getProductList);
adminRoute.patch('/product/:id', adminAuth.isLogin, upload.any(), productController.updateProduct);

//order
adminRoute.get('/order/:id',adminAuth.isLogin, orderController.getOrderDetails);
adminRoute.patch('/order/:id/status',adminAuth.isLogin, orderController.updateOrderStatus);
adminRoute.get('/order-details', adminAuth.isLogin, orderController.loadOrderDetails);


//return confirmation
adminRoute.post('/confirm-return', adminAuth.isLogin, productController.confirmReturn);


//coupon
adminRoute.get('/add-coupon', adminAuth.isLogin, couponController.loadAddcoupon);
adminRoute.get('/coupon-list', adminAuth.isLogin, couponController.loadCouponList);


//offer
adminRoute.get('/add-offer', adminAuth.isLogin, offerController.loadAddOffer);
adminRoute.post('/add-offer',adminAuth.isLogin,offerController.addOffer)

adminRoute.get('/offer-list', adminAuth.isLogin,offerController.loadOfferlist);

module.exports = adminRoute;
