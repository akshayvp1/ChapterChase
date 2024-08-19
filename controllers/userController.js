

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
const Address = require('../models/addressModel');
const { log } = require('console');
const Order = require('../models/orderModel');


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
// const loadAccount = (req, res) => {
//     try {
//         const user = req.user || req.session.user;
//         // console.log('User Data from server:', user); 
//         res.render('user-dashboard', { user });
//     } catch (error) {
//         console.log('Error:', error.message);
//     }
// }

const loadAccount = async (req, res) => {
    try {
        const userId = req.session.user.id;
        if (!userId) {
            return res.redirect('/login');
        }

        // Fetch addresses for the logged-in user
        const addresses = await Address.find({ userId: userId });
        console.log('Fetched addresses:', addresses); // Debug log

        // Render the view and pass both user and addresses
        res.render('dashboard-user', { 
            user: req.session.user, 
            addresses: addresses 
        });
    } catch (error) {
        console.error('Error loading account:', error.message);
        res.status(500).send('Error loading account');
    }
};



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
        let cart = await Cart.findOne({ userId: userId });

        if (!cart) {
            cart = new Cart({ userId: userId, items: [] });
        }

        const existingItemIndex = cart.items.findIndex(item => item.productId.toString() === productId);
        console.log('Existing item index:', existingItemIndex);

        if (existingItemIndex > -1) {
            cart.items[existingItemIndex].quantity += parseInt(quantity);
        } else {
            cart.items.push({ productId: productId, quantity: parseInt(quantity) });
        }

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

const updateUser = async (req, res) => {
    const { name, displayName, mobile } = req.body; // Exclude email from the body

    try {
        const userId = req.session.user.id; 
        const user = await User.findByIdAndUpdate(
            userId,
            { name, displayName, mobile }, // Update only these fields
            { new: true }
        );

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json({ message: 'User details updated successfully', user });
    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({ message: 'Error updating user' });
    }
};
const addAddress = async (req, res) => {
    try {
        console.log('User session:', req.session);
        
        const userId = req.session.user?.id;
        console.log('User ID from session:', userId);

        if (!userId) {
            return res.status(401).json({ error: 'User not authenticated. Please log in again.' });
        }

        const { addressName, addressEmail, addressMobile, addressHouse, addressStreet, addressPost, addressCity, addressDistrict, addressState, addressPin } = req.body;

        console.log('Received addressPin:', addressPin);
         
        // Validate pin code
        const pin = parseInt(addressPin, 10);
        console.log('Processed pin:', pin);

        if (isNaN(pin) || pin < 100000 || pin > 999999) {
            return res.status(400).json({ error: `Invalid pin code: "${addressPin}". Please enter a 6-digit number.` });
        }

        // Create new address
        const newAddress = new Address({
            userId,
            addressName,
            addressEmail,
            addressMobile,
            addressHouse,
            addressStreet,
            addressPost,
            addressCity,
            addressDistrict,
            addressState,
            addressPin: pin
        });

        const savedAddress = await newAddress.save();
        res.status(200).json({ address: savedAddress });
    } catch (error) {
        console.error('Error saving address:', error);
        res.status(500).json({ error: 'Error saving address. Please try again.' });
    }
};

const loadUserDashboard = async(req,res)=>{
    try{
    res.render('dashboard-user')
    }
    catch(error){

        console.log(error.message);
        
    }
    
}
const loadAccountDetails = async(req,res)=>{

    try {
        const userId = req.session.user.id;
        if (!userId) {
            return res.redirect('/login');
        }

      

        // Render the view and pass both user and addresses
        res.render('account-details', { 
            user: req.session.user
           
        });
    } catch (error) {
        console.error('Error loading account:', error.message);
        res.status(500).send('Error loading account');
    }

}
const loadUserAddress = async(req,res)=>{
    try {
        const userId = req.session.user.id;
        if (!userId) {
            return res.redirect('/login');
        }

        // Fetch addresses for the logged-in user
        const addresses = await Address.find({ userId: userId });
        console.log('Fetched addresses:', addresses); // Debug log

        // Render the view and pass both user and addresses
        res.render('address-user', { 
            user: req.session.user, 
            addresses: addresses 
        });
    } catch (error) {
        console.error('Error loading account:', error.message);
        res.status(500).send('Error loading account');
    }
}

// const loadUserOrder = async(req,res)=>{
//     try{
//         res.render('order-user')
//     }
//     catch(error){
//         console.log(error.message);
        
//     }
// }

const loadUserOrder = async (req, res) => {
    try {
        const userId = req.session.user.id; // Fetch user ID from session

        if (!userId) {
            return res.status(400).send('<h1>400 - Bad Request</h1><p>User ID is missing in session.</p>');
        }

        console.log('User ID:', userId); // Debugging line

        // Fetch the orders for the given userId                                                    
        const orders = await Order.find({ userId }).populate('items.product');

        console.log('Orders:', orders); // Debugging line

        if (orders.length === 0) {
            return res.render('order-user', { message: 'No orders found for this user.' });
        }

        res.render('order-user', { orders });
    } catch (error) {
        console.error('Error loading user orders:', error);
        res.status(500).send('Internal Server Error');
    }
};


const loadUserDownload = async(req,res)=>{
    try{
        res.render('download-user')
    }
    catch(error){
        console.log(error.message);
        
    }
}

const getAddress = async (req, res) => {
    try {
      const addressId = req.params.id;
      const address = await Address.findById(addressId);
  
      if (!address) {
        return res.status(404).json({ message: 'Address not found' });
      }
  
      res.status(200).json(address);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching address', error });
    }
  };

  const updateAddress = async (req, res) => {
    try {
      const addressId = req.params.id;
      console.log(addressId);
      
      const updatedData = req.body;
  
      const address = await Address.findByIdAndUpdate(addressId, updatedData, { new: true });
  
      if (!address) {
        return res.status(404).json({ message: 'Address not found' });
      }
  
      res.status(200).json(address);
    } catch (error) {
      res.status(500).json({ message: 'Error updating address', error });
    }
  };

  const deleteAddres = async (req, res) => {
    try {
      const addressId = req.params.id;
      const address = await Address.findByIdAndDelete(addressId);
  
      if (!address) {
        return res.status(404).json({ success: false, message: 'Address not found' });
      }
  
      res.status(200).json({ success: true, message: 'Address deleted successfully' });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Error deleting address', error });
    }
  };
  
  const loadChangePassword = async(req,res)=>{
    try{
        res.render('change-password')
    }
    catch(error){
        console.log(error.message);
        
    }
  }
  const loadPasswordChange = async (req, res) => {
    const { oldPassword, newPassword, confirmPassword } = req.body;
    const userId = req.session.user.id; // Use session-based user ID
  
    // Log request body to verify data
    console.log('Request Body:', req.body);
  
    // Check if new passwords match
    if (newPassword !== confirmPassword) {
      return res.status(400).json({ success: false, message: 'New passwords do not match' });
    }
  
    // Ensure the old password is provided
    if (!oldPassword) {
      return res.status(400).json({ success: false, message: 'Old password is required' });
    }
  
    try {
      // Retrieve user from the database
      const user = await User.findById(userId);
  
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }
  
      // Log the stored password hash for debugging
      console.log('Stored Password Hash:', user.password);
  
      // Verify old password
      const isMatch = await bcrypt.compare(oldPassword, user.password);
  
      if (!isMatch) {
        return res.status(400).json({ success: false, message: 'Old password is incorrect' });
      }
  
      // Hash new password and update user
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      user.password = hashedPassword;
      await user.save();
  
      res.status(200).json({ success: true, message: 'Password changed successfully' });
    } catch (error) {
      console.error('Error changing password:', error); // Log the error for debugging
      res.status(500).json({ success: false, message: 'Error changing password', error: error.message });
    }
  };

 const updateOrderStatus=async(req, res)=> {
    try {
        const { orderId, status, reason } = req.body;

        // Validate orderId format
        if (!mongoose.Types.ObjectId.isValid(orderId)) {
            return res.status(400).json({ message: 'Invalid Order ID.' });
        }

        const updateFields = { order_status: status };
        
        // If the status is 'Cancelled', include the reason
        if (status === 'Cancelled' && reason) {
            updateFields.cancellationReason = reason;
        }

        const order = await Order.findByIdAndUpdate(orderId, updateFields, { new: true });

        if (!order) {
            return res.status(404).json({ message: 'Order not found.' });
        }

        res.json({ message: 'Order status updated successfully.' });
    } catch (error) {
        console.error('Error updating order status:', error.message);
        res.status(500).json({ message: 'Error updating order status.' });
    }

    
    
    }
    
  
const getUserOrder = async(req,res)=>{
    try {
        const orderId = req.params.id;
        const order = await Order.findById(orderId)
            .populate('items.product') // Populate product details
            .exec();

        if (!order) {
            return res.status(404).send('Order not found');
        }

        res.json(order);
    } catch (error) {
        console.error('Error fetching order details:', error.message);
        res.status(500).send('Error fetching order details');
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
    loginSuccess,
    loginFailure,
    logout,
    loadAccount,
    loadProductsList,
    loadProductDetails,
    loadWishlist,
    loadCart,
    addToCart,
    updateCart,
    removeFromCart,
    addToWishlist,
    updateUser,
    addAddress,
    loadUserDashboard,
    loadAccountDetails,
    loadUserAddress,
    loadUserOrder,
    loadUserDownload,
    getAddress,
    updateAddress,
    deleteAddres,
    loadChangePassword,
    loadPasswordChange,
    updateOrderStatus,
    getUserOrder
    // removeFromWishlist
   
};




