

const User = require('../models/userModel');
const bcrypt = require('bcrypt');
const { sendVerificationEmail } = require('../utils/mailer');
const randomstring = require('randomstring');
const moment = require('moment');
const Product = require('../models/productModel');
const Category = require('../models/categoryModel');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
require('dotenv').config();
const Cart = require('../models/cartModel');
const Wishlist = require('../models/wishlistModel');
const mongoose = require('mongoose');

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
        const products = await Product.find({ status: 'Active' })

        const categories = await Category.find({})

        const user = req.user || req.session.user;
        res.render("home", { user,categories,products }); 
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
        return res.render('login'); 
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

        // Store user data and OTP in session
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



//verify otp
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

        req.session.user = newUser;

        console.log(`User with email: ${email} verified successfully`);

        return res.status(200).json({ success: true, message: 'OTP verified successfully' });
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

// Verify Login 
const verifyLogin = async (req, res) => {
    try {
        const { email, password } = req.body;
        console.log("first pass",password);

        const user = await User.findOne({email:email});
        

        if (!user) {
            console.log(`User not found for email: ${email}`);
            return res.render('login',{message:"Invalid email or password"})

        }

        if (!user.isListed) {
            return res.render('login',{ message: 'Your account is Blocked.' });
          }

        // Compare passwords using bcrypt
        const match = await bcrypt.compare(password, user.password);

        console.log('Entered password:', password);
        console.log('Stored hashed password:', user.password);
        console.log('Password match:', match);

        if (!match) {
            console.log('Invalid password');
            // return res.status(401).send('Invalid password');
             res.render('login',{message:"Invalid email password"})

        }

        // Set user session 
        req.session.user = {
            id: user._id,
            email: user.email,
            name: user.name,
            mobile:user.mobile
        };

         res.redirect('/home'); 
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
             res.redirect('/home'); 
        });
    } catch (error) {
        console.error('Error logging out:', error.message);
         res.status(500).send('Internal server error');
    }
};

//Load profile with user name
const loadProfile = (req,res)=>{
    try{
        const user = req.user || req.session.user;
        console.log(user);
        res.render('profile', { user })
    }
    catch(error){
        console.log(error.message);
    }
}


//load product list
const loadProductsList = async (req, res) => {
    try {
        
        const user = req.user || req.session.user;
        const categories = await Category.find({status:"Active"});
        const page = parseInt(req.query.page, 10) || 1; 
        const limit = parseInt(req.query.limit, 9) || 9; 
        const skip = (page - 1) * limit;

        // Fetch paginated products
        const products = await Product.find({ status: 'Active' })
            .skip(skip)
            .limit(limit);

        const totalProducts = await Product.countDocuments({ status: 'Active' });
        const totalPages = Math.ceil(totalProducts / limit);

        // Render the product list view with pagination data
         res.render('products-list', {
            categories,
            user,
            products,
            currentPage: page,
            totalPages,
            limit,
            totalProducts,
            breadcrumbs: [
                { title: 'Home', url: '/' },
                { title: 'Products', url: '#' }
            ]
        });
    } catch (error) {
        console.log(error.message);
        res.status(500).send('Error fetching products');
    }
};



//load product details
const loadProductDetails = async (req, res) => {
    try {
        // const product = await Product.find({ status: 'Active' });
        const productId = req.params.id; 
        const product = await Product.findById(productId).exec(); 
        const user = req.user || req.session.user;

        if (!product) {
             res.status(404).send('Product not found');
        }

        const relatedProducts = await Product.find({
            _id: { $ne: productId },
            category: product.category,
            status: 'Active'
        }).limit(4).exec();

         res.render('product-details', {
            user,
            product,
            relatedProducts,
            breadcrumbs: [
                { title: 'Home', url: '/' },
                { title: 'Products', url: '/products-list' },
                { title: 'Products-Details', url: '#' }
            ]
        });
    } catch (error) {
        console.error(error); 
         res.status(500).send('Server Error'); 
    }
};



//load cart
const loadCart = async (req, res) => {


    try {
        if (!req.session.user || !req.session.user.id) {
            // return res.status(400).render('error', { message: 'User ID is required. Please log in.' });
            res.redirect('/login')
        }

        const userId = req.session.user.id;
        const cart = await Cart.findOne({ userId: userId }).populate('items.productId');

        if (!cart) {
            return res.render('cart', { cartItems: [], subtotal: 0, total: 0 });
        }

        const cartItems = cart.items.map(item => ({
            product: item.productId,
            quantity: item.quantity,
            total: item.productId.price * item.quantity
        }));

        // Calculate subtotal
        const subtotal = cartItems.reduce((sum, item) => sum + item.total, 0);
 
        const shippingCost = 0;
        const total = subtotal + shippingCost;

        res.render('cart', { cartItems: cartItems, subtotal: subtotal, total: total });
    } catch (error) {
        console.log('Error details:', error);
        res.status(500).render('error', { message: 'Error loading cart: ' + error.message });
    }
};


//add to cart
const addToCart = async (req, res) => {
    try {
        const { productId, quantity } = req.body;
        console.log('Received productId:', productId, 'quantity:', quantity);
       
        if (!req.session.user || !req.session.user.id) {
            console.log('User not logged in. Redirecting to login page.');
            return res.redirect('/login');  // Redirect to login page
        }

        const userId = req.session.user.id;
        console.log('Searching for cart with userId:', userId);
        let cart = await Cart.findOne({ userId: userId });
        console.log('Existing cart:', cart);

        if (!cart) {
            console.log('Creating new cart for user:', userId);
            cart = new Cart({ userId: userId, items: [] });
        }

        const existingItemIndex = cart.items.findIndex(item => item.productId.toString() === productId);
        console.log('Existing item index:', existingItemIndex);

        if (existingItemIndex > -1) {
            console.log('Updating existing item quantity');
            cart.items[existingItemIndex].quantity += parseInt(quantity);
        } else {
            console.log('Adding new item to cart');
            cart.items.push({ productId: productId, quantity: parseInt(quantity) });
        }

        console.log('Cart before saving:', cart);
        const savedCart = await cart.save();
        console.log('Saved cart:', savedCart);

        res.redirect('/cart');
    } catch (error) {
        console.log('Error details:', error);
        res.status(500).render('error', { message: 'Error adding item to cart: ' + error.message });
    }
};

//update cart
const updateCart = async (req, res) => {
    const { productId, quantity } = req.body;

    if (!req.session.user || !req.session.user.id || !productId || quantity == null) {
        return res.status(400).json({ message: 'Missing required fields or user not logged in' });
    }

    try {
        const userId = req.session.user.id;
        
        let cart = await Cart.findOne({ userId: userId });

        if (!cart) {
            return res.status(404).json({ message: 'Cart not found' });
        }

        const itemIndex = cart.items.findIndex(item => item.productId.toString() === productId);

        if (itemIndex > -1) {
            if (quantity > 0) {
                cart.items[itemIndex].quantity = quantity;
            } else {
                cart.items.splice(itemIndex, 1);
            }
        } else if (quantity > 0) {
            cart.items.push({ productId, quantity });
        }

        await cart.save();
        res.status(200).json({ message: 'Cart updated successfully' });
    } catch (error) {
        console.error('Error updating cart:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

//remove from cart
const removeFromCart = async (req, res) => {
    try {
        if (!req.session.user || !req.session.user.id) {
            return res.status(400).json({ message: 'User not logged in' });
        }

        const { productId } = req.body;

        if (!productId) {
            return res.status(400).json({ message: 'Product ID is required' });
        }

        const userId = req.session.user.id;

        const cart = await Cart.findOne({ userId: userId });

        if (!cart) {
            return res.status(404).json({ message: 'Cart not found' });
        }

        const itemIndex = cart.items.findIndex(item => item.productId.toString() === productId);

        if (itemIndex > -1) {
            cart.items.splice(itemIndex, 1);
            await cart.save();
            return res.status(200).json({ message: 'Item removed from cart successfully' });
        } else {
            return res.status(404).json({ message: 'Item not found in cart' });
        }
    } catch (error) {
        console.error('Error removing item from cart:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

//load wislist
const loadWishlist = async (req, res) => {
    try {

        const userId = req.session.user.id;
        const wishlist = await Wishlist.findOne({ userId: userId }).populate('products.productId');
        console.log('Populated wishlist:', wishlist); 
        res.render('wishlist', { wishlist: wishlist });
    } catch (error) {
        console.log(error.message);
        res.status(500).send('Server error');
    }
};


//add to wishlist
const addToWishlist = async (req, res) => {

    
    try {
        const { productId } = req.body;
        const userId = req.session.user.id;

        if (!mongoose.Types.ObjectId.isValid(productId)) {
            return res.status(400).json({ success: false, message: 'Invalid product ID' });
        }

        let wishlist = await Wishlist.findOne({ userId: userId });

        if (!wishlist) {
            wishlist = new Wishlist({ userId: userId, products: [] });
        }

        const existingProductIndex = wishlist.products.findIndex(item => item.productId.toString() === productId);

        if (existingProductIndex > -1) {
            return res.json({ success: false, message: 'Already in wishlist' });
        } else {
            wishlist.products.push({ productId: new mongoose.Types.ObjectId(productId) });
            await wishlist.save();
            return res.json({ success: true, message: 'Added to wishlist' });
        }
    } catch (error) {
        console.log('Error details:', error);
        res.status(500).json({ success: false, message: 'Error adding to wishlist' });
    }
};

// const removeFromWishlist = async (req, res) => {
//     try {
//       const userId = req.user.id; // Assuming you have user authentication middleware
//       const productId = req.params.productId;
  
//       // Remove the product from the user's wishlist in the database
//       await User.findByIdAndUpdate(userId, {
//         $pull: { wishlist: productId }
//       });
  
//       res.json({ success: true, message: 'Product removed from wishlist' });
//     } catch (error) {
//       console.error('Error removing product from wishlist:', error);
//       res.status(500).json({ success: false, message: 'Failed to remove product from wishlist' });
//     }
//   };

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
    loadProductsList,
    loadProductDetails,
    loadWishlist,
    loadCart,
    addToCart,
    updateCart,
    removeFromCart,
    addToWishlist,
    // removeFromWishlist
   
};




