
const Wishlist = require('../../models/wishlistModel');
const mongoose = require('mongoose');
const Product = require('../../models/productModel');
const Cart = require('../../models/cartModel');
const User = require('../../models/userModel');


//load wislist
const loadWishlist = async (req, res) => {
    try {
        
        let wishlist=null;
        let wishlistCount=0;
        const userId = req.session.user.id;
         wishlist = await Wishlist.findOne({ userId: userId }).populate('products.productId');
    
            if(wishlist && wishlist.products){
                wishlistCount=wishlist.products.length
            
        }
        let cart = null;
        let cartCount = 0;
     
            cart = await Cart.findOne({ userId: userId });
            if (cart && cart.items) {
                cartCount = cart.items.length;
            
        }
        res.render('wishlist', { wishlist: wishlist ,wishlistCount,cartCount});
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
        if (!req.session.user || !req.session.user.id) {
            return res.status(401).json({ success: false, message: 'User not logged in' });
        }

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

//remove product from wishlist
const removeFromWishlist = async (req, res) => {
    try {
        const userId = req.session.user.id;
        const { productId } = req.params;

        if (!userId || !productId) {
            return res.status(400).json({ message: 'User ID or Product ID is missing' });
        }

        const wishlist = await Wishlist.findOne({ userId: userId });

        if (!wishlist) {
            return res.status(404).json({ message: 'Wishlist not found' });
        }

        wishlist.products = wishlist.products.filter(item => item.productId.toString() !== productId);
        await wishlist.save();

        res.json({ message: 'Product removed from wishlist' });
    } catch (error) {
        console.error('Error removing product from wishlist:', error);
        res.status(500).json({ message: 'Server error' });
    }
};



module.exports = {
    loadWishlist,
    addToWishlist,
    removeFromWishlist
}