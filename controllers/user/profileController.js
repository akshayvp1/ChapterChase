const User = require('../../models/userModel');
require('dotenv').config();
const Cart = require('../../models/cartModel');
const Order = require('../../models/orderModel');
const Wishlist = require('../../models/wishlistModel');
const Wallet = require('../../models/walletModel')



//load user dashboard
const loadUserDashboard = async (req, res) => {
    try {
        const userId = req.session.user.id;
        

        const wallet = await Wallet.findOne({ userId: userId });

        let uniqueProductCount = 0;

       
        const cart = await Cart.findOne({ userId: userId });

        if (cart && cart.items) {
            
            uniqueProductCount = cart.items.length;
        }
        let wishlist=null;
        let wishlistCount=0;

       
            wishlist=await Wishlist.findOne({userId: userId})
            if(wishlist && wishlist.products){
                wishlistCount=wishlist.products.length
            
        }

        res.render('dashboard-user', { 
            cartCount: uniqueProductCount ,
            wishlistCount,
            userId,
            wallet
        });
    } catch (error) {
        console.log('Error details:', error.message);
        res.status(500).render('error', { message: 'Error loading user dashboard: ' + error.message });
    }
};



//load account details
const loadAccountDetails = async(req,res)=>{

    try {
        const userId = req.session.user.id;
        if (!userId) {
            return res.redirect('/login');
        }
        let uniqueProductCount = 0;

        const cart = await Cart.findOne({ userId: userId });

        if (cart && cart.items) {
            uniqueProductCount = cart.items.length;
        }
        let wishlist=null;
        let wishlistCount=0;

       
            wishlist=await Wishlist.findOne({userId: userId})
            if(wishlist && wishlist.products){
                wishlistCount=wishlist.products.length
            
        }

        res.render('account-details', { 
            user: req.session.user, cartCount: uniqueProductCount,wishlistCount
           
        });
    } catch (error) {
        console.error('Error loading account:', error.message);
        res.status(500).send('Error loading account');
    }

}


//Update user
const updateUser = async (req, res) => {
    const { name, displayName, mobile } = req.body; 

    try {
        const userId = req.session.user.id; 
        const user = await User.findByIdAndUpdate(
            userId,
            { name, displayName, mobile },
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




//load user order
const loadUserOrder = async (req, res) => {
    try {
        const userId = req.session.user.id;
        const page = parseInt(req.query.page) || 1;
        const limit = 7;
        const skip = (page - 1) * limit;
        const searchQuery = req.query.search || ''; 

        let searchCriteria = { userId };

        if (searchQuery) {
            searchCriteria = {
                userId,
                $or: [
                    { 'items.product.productName': { $regex: searchQuery, $options: 'i' } }, 
                    { orderId: { $regex: searchQuery, $options: 'i' } } 
                ]
            };
        }

        const totalOrders = await Order.countDocuments(searchCriteria);
        const totalPages = Math.ceil(totalOrders / limit);

        const orders = await Order.find(searchCriteria)
            .populate('items.product')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        let uniqueProductCount = 0;
        const cart = await Cart.findOne({ userId: userId });
        if (cart && cart.items) {
            uniqueProductCount = cart.items.length;
        }
        let wishlist=null;
        let wishlistCount=0;

       
            wishlist=await Wishlist.findOne({userId: userId})
            if(wishlist && wishlist.products){
                wishlistCount=wishlist.products.length
            
        }

        res.render('order-user', { 
            orders, 
            user:req.session.user.id,
            wishlistCount,
            page, 
            totalPages, 
            cartCount: uniqueProductCount, 
            search: searchQuery,
            message: orders.length === 0 ? 'No orders found for this user.' : ''
        });
    } catch (error) {
        console.error('Error loading user orders:', error);
        res.status(500).send('Internal Server Error');
    }
};




//load user download
const loadUserDownload = async (req, res) => {
    try {
        const userId = req.session.user.id;

        let uniqueProductCount = 0;

        const cart = await Cart.findOne({ userId: userId });

        if (cart && cart.items) {
            uniqueProductCount = cart.items.length;
        }
        let wishlist=null;
        let wishlistCount=0;

       
            wishlist=await Wishlist.findOne({userId: userId})
            if(wishlist && wishlist.products){
                wishlistCount=wishlist.products.length
            
        }

        res.render('download-user', { 
            cartCount: uniqueProductCount ,
            wishlistCount
        });
    } catch (error) {
        console.error('Error loading user downloads:', error);
        res.status(500).send('Internal Server Error');
    }
};


module.exports = {
    loadUserDashboard,
    loadAccountDetails,
    updateUser,
    loadUserOrder,
    loadUserDownload
}