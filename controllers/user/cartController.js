
const Cart = require('../../models/cartModel');
const Offer = require('../../models/offerModel');
const Product = require('../../models/productModel');






//load cart
const loadCart = async (req, res) => {
    try {
        if (!req.session.user || !req.session.user.id) {
            return res.redirect('/login');
        }

        const offers = await Offer.find({ status: 'active' });

        const userId = req.session.user.id;
        const cart = await Cart.findOne({ userId: userId }).populate('items.productId');

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

        res.render('cart', { cartItems, subtotal, total, offers });
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
            console.log('User not logged in.');
            return res.status(401).json({ message: 'User not logged in' });
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

        // Fetch the updated cart item count
        const updatedCart = await Cart.findOne({ userId: userId });
        const cartItemCount = updatedCart.items.reduce((total, item) => total + item.quantity, 0);

        res.status(200).json({ 
            message: 'Item added to cart successfully',
            cartItemCount: cartItemCount
        });
    
    } catch (error) {
        console.log('Error details:', error);
        res.status(500).json({ message: 'Error adding item to cart: ' + error.message });
    }
};




//update cart
const updateCart = async (req, res) => {
    const { productId, quantity } = req.body;
    console.log(quantity);
    

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


module.exports = {
    loadCart,
    addToCart,
    updateCart,
    removeFromCart,

}