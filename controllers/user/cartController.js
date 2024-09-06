
const Cart = require('../../models/cartModel');
const Offer = require('../../models/offerModel');
const Product = require('../../models/productModel');
const Wishlist = require('../../models/wishlistModel');
const User = require('../../models/userModel');






//load cart
const loadCart = async (req, res) => {
    try {
        if (!req.session.user || !req.session.user.id) {
            return res.redirect('/login');
        }

        const offers = await Offer.find({ status: 'active' });
        let cart = null;
        let cartCount = 0;
        const userId = req.session.user.id;
         cart = await Cart.findOne({ userId: userId }).populate('items.productId');
         if (cart && cart.items) {
            cartCount = cart.items.length;
        }
        let wishlist=null;
        let wishlistCount=0;

        
            wishlist=await Wishlist.findOne({userId: userId})
            if(wishlist && wishlist.products){
                wishlistCount=wishlist.products.length
                console.log("daaa",wishlistCount);
                
            
        }
       

        if (!cart) {
            return res.render('cart', { cartItems: [], subtotal: 0, total: 0, offers });
        }

        const cartItems = cart.items.map(item => {
            const applicableOffers = offers.filter(offer =>
                offer.offerType === 'category' &&
                offer.categoryId.includes(item.productId.category.toString())
            );

            let discountedPrice = item.productId.price;
            let discountPercentage = 0;

            if (applicableOffers.length > 0) {
                const bestOffer = applicableOffers.reduce((maxOffer, currentOffer) =>
                    currentOffer.discount > maxOffer.discount ? currentOffer : maxOffer
                );

                discountedPrice = item.productId.price - (item.productId.price * (bestOffer.discount / 100));
                discountPercentage = bestOffer.discount;
            }

            return {
                product: item.productId,
                quantity: item.quantity,
                total: discountedPrice * item.quantity,
                discountPercentage
            };
        });

        // Calculate subtotal
        const subtotal = cartItems.reduce((sum, item) => sum + item.total, 0);
        const shippingCost = 0;
        const total = subtotal + shippingCost;

        res.render('cart', { cartItems, 
            subtotal, 
            total, 
            offers,
            cartCount,
            wishlistCount ,
            breadcrumbs: [
                    { title: 'Home', url: '/' },
                    { title: 'Products', url: '/products-list' },
                   
                    { title: 'Cart', url: '/cart' }

            ]
            

        });
    } catch (error) {
        console.log('Error details:', error);
        res.status(500).render('error', { message: 'Error loading cart: ' + error.message });
    }
};


//add to cart
const addToCart = async (req, res) => {
    try {
        const { productId, quantity } = req.body;

        if (!req.session.user || !req.session.user.id) {
            return res.status(401).json({ success: false, message: 'User not logged in' });
        }

        const userId = req.session.user.id;

        const product = await Product.findById(productId).exec();
        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        const requestedQuantity = parseInt(quantity, 10);

        let cart = await Cart.findOne({ userId: userId });
        if (!cart) {
            cart = new Cart({ userId: userId, items: [] });
        }

        const existingItemIndex = cart.items.findIndex(item => item.productId.toString() === productId);

        if (existingItemIndex > -1) {
            const existingQuantity = cart.items[existingItemIndex].quantity;
            const newQuantity = existingQuantity + requestedQuantity;
        
            if (newQuantity > product.stock) {
                return res.status(400).json({ 
                    success: false, 
                    message: `You already have ${existingQuantity} item in your cart. Only one can be added to your cart.` 
                });
            }
        
            cart.items[existingItemIndex].quantity = newQuantity;
        }
         else {
            if (requestedQuantity > product.stock) {
                return res.status(400).json({ 
                    success: false, 
                    message: `Only ${product.stock} item(s) left in stock.` 
                });
            }

            cart.items.push({ productId: productId, quantity: requestedQuantity });
        }

        await cart.save();

        const cartItemCount = cart.items.reduce((total, item) => total + item.quantity, 0);

        res.status(200).json({ 
            success: true,
            message: 'Item added to cart successfully',
            cartItemCount: cartItemCount
        });

    } catch (error) {
        console.error('Error occurred:', error);
        res.status(500).json({ success: false, message: 'An error occurred: ' + error.message });
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

        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        const MAX_QUANTITY = 10;

        if (quantity > MAX_QUANTITY) {
            return res.status(400).json({ message: `You can add up to ${MAX_QUANTITY} product(s) only.` });
        }

        if (quantity > product.stock) {
            return res.status(400).json({ message: `Only ${product.stock} product(s) left in stock.` });
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


module.exports = {
    loadCart,
    addToCart,
    updateCart,
    removeFromCart,

}