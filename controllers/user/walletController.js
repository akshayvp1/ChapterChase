const User = require('../../models/userModel');
const Wallet = require('../../models/walletModel')
const Cart = require('../../models/cartModel');
const Wishlist = require('../../models/wishlistModel');
const Order = require('../../models/orderModel');


//load wallet
const loadWallet = async (req, res) => {
    try {
        const userId = req.session.user.id;

        
        let wallet = await Wallet.findOne({ userId: userId });
        if (!wallet) {
            wallet = new Wallet({
                userId: userId,
                balance: 0,
                transactions: []
            });
            await wallet.save();
        }

        let cart = null;
        let cartCount = 0;
        
        cart = await Cart.findOne({ userId: userId });
        if (cart && cart.items) {
            cartCount = cart.items.length;
        }

        let wishlist = null;
        let wishlistCount = 0;

        wishlist = await Wishlist.findOne({ userId: userId });
        if (wishlist && wishlist.products) {
            wishlistCount = wishlist.products.length;
        }

        res.render('wallet', { wallet: wallet, cartCount, wishlistCount });
    } catch (error) {
        console.error('Error fetching wallet:', error);
        res.status(500).send('Internal Server Error');
    }
};

//check balance
const checkBalance =  async (req, res) => {
    try {
        const wallet = await Wallet.findOne({ userId: req.session.user.id });
        res.json({ balance: wallet ? wallet.balance : 0 });
    } catch (error) {
        res.status(500).json({ error: 'Error fetching wallet balance' });
    }


}

//wallet payment
const walletPayment = async (req, res) => {
    const { totalPrice } = req.body;
    const userId = req.session.user.id;

    console.log(`Requested amount: ${totalPrice}`);

    try {
        const wallet = await Wallet.findOne({ userId });
        console.log(`Wallet balance: ${wallet.balance}`);

        if (wallet && wallet.balance >= totalPrice) {
           
            await wallet.save();
            return res.status(200).json({ success: true, message: 'Payment successful' });
        } else {
            return res.status(400).json({ success: false, message: 'Insufficient wallet balance' });
        }
    } catch (error) {
        console.error('Error deducting wallet balance:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};





module.exports ={
    loadWallet,
    checkBalance,
    walletPayment
}