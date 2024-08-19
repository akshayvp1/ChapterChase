const path = require('path');
const fs = require('fs');
const express = require('express');
const adminRoute = express();
const session = require('express-session');
const config = require('../config/config');
const adminController = require('../controllers/adminController');
const productController = require('../controllers/ProductController');
const categoryController = require('../controllers/categoryController');
const adminAuth = require('../middleware/adminAuth');
const upload = require('../config/multer');
const nocache = require('nocache');

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


adminRoute.get('/', adminController.loadAdminLogin);
adminRoute.post('/adminLogin', adminController.verifyAdmin);


adminRoute.get('/dashboard', adminAuth.isLogin, adminController.loadDashboard);
adminRoute.get('/product-list', adminAuth.isLogin, productController.loadProduct);
adminRoute.get('/add-product', adminAuth.isLogin, productController.loadAddProduct);
adminRoute.get('/category-list', adminAuth.isLogin, categoryController.loadCategoryList);
// adminRoute.get('/order-list', adminAuth.isLogin, productController.loadOrderList);
adminRoute.get('/order-details', adminAuth.isLogin, productController.loadOrderDetails);
adminRoute.post('/category-list/add', adminAuth.isLogin, categoryController.AddCategory);
adminRoute.patch('/categories-list/edit/:id', adminAuth.isLogin, categoryController.editCategory);
adminRoute.get('/logout',adminAuth.isLogin,adminController.adminLogout)


adminRoute.get('/customer-list', adminAuth.isLogin, adminController.loadCustomerList);
adminRoute.patch('/edit/:id', adminAuth.isLogin, adminController.editCustomer);
adminRoute.post('/change-status/:id', adminAuth.isLogin, adminController.changeCustomerStatus);
adminRoute.post('/add-product', adminAuth.isLogin, upload.array('productImages', 3), productController.addProduct);
adminRoute.get('/product/:id', adminAuth.isLogin, productController.getProductList);
adminRoute.patch('/product/:id', adminAuth.isLogin, upload.any(), productController.updateProduct);

adminRoute.get('/order/:id',adminAuth.isLogin, productController.getOrderDetails);
adminRoute.patch('/order/:id/status',adminAuth.isLogin, productController.updateOrderStatus);
adminRoute.patch('/order/:id/cancel', adminAuth.isLogin,productController.cancelOrder);

// adminRoute.patch('/order/:id/status', adminAuth.isLogin, productController.adminOrderList);


module.exports = adminRoute;
