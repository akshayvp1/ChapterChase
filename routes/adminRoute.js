const express = require("express");
const adminRoute = express(); 
const session = require("express-session");
const config = require("../config/config");
const adminController = require("../controllers/adminController");
const auth = require("../middleware/adminAuth");
const productController = require('../controllers/ProductController')
const categoryController = require('../controllers/categoryController')
const adminAuth = require("../middleware/adminAuth")
const upload = require('../config/multer');

adminRoute.set("view engine", "ejs");
adminRoute.set("views", "./views/admin");



adminRoute.use(session({ 
    secret: config.sessionSecret,
    resave: false,
    saveUninitialized: false 
}));


const bodyParser = require("body-parser");
adminRoute.use(bodyParser.json());
adminRoute.use(bodyParser.urlencoded({ extended: true }));



adminRoute.get('/', adminController.loadAdminLogin);
adminRoute.post('/adminLogin', adminController.verifyAdmin);
adminRoute.get('/dashboard',adminAuth.isLogin, adminController.loadDashboard); 
adminRoute.get('/product-list',adminAuth.isLogin, productController.loadProduct)
adminRoute.get('/add-product',adminAuth.isLogin, productController.loadAddProduct)
adminRoute.get('/category-list',adminAuth.isLogin, categoryController.loadCategoryList)
adminRoute.get('/order-list',adminAuth.isLogin ,productController.loadOrderList)
adminRoute.get('/order-details',adminAuth.isLogin, productController.loadOrderDetails)

adminRoute.post('/category-list/add',adminAuth.isLogin ,categoryController.AddCategory);
adminRoute.patch('/categories-list/edit/:id',adminAuth.isLogin,categoryController.editCategory)

adminRoute.get('/customer-list',adminAuth.isLogin, adminController.loadCustomerList);

adminRoute.patch('/edit/:id', adminAuth.isLogin, adminController.editCustomer);
adminRoute.post('/change-status/:id', adminAuth.isLogin, adminController.changeCustomerStatus);

adminRoute.post('/add-product', adminAuth.isLogin, upload.array('productImages', 3), productController.addProduct);

adminRoute.get('/product/:id',adminAuth.isLogin,productController.getProduct )


   

adminRoute.patch('/product/:id', upload.fields([
    { name: 'productImage1', maxCount: 1 },
    { name: 'productImage2', maxCount: 1 },
    { name: 'productImage3', maxCount: 1 }
  ]), productController.updateProduct);




module.exports = adminRoute;
