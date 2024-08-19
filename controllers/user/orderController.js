const Order = require('../../models/orderModel');
const User = require("../../models/userModel");
const Product = require('../../models/productModel');
const Address = require('../../models/addressModel');
const Cart = require('../../models/cartModel');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const mongoose = require('mongoose');
const Offer = require('../../models/offerModel');






const loadCheckout = async (req, res) => {
    try {
        const userId = req.session.user.id;

        const offers = await Offer.find({ status: 'active' });

        // Fetch user addresses
        const addresses = await Address.find({ userId: userId });

        // Fetch the user's cart
        const cart = await Cart.findOne({ userId: userId }).populate('items.productId');

        // Initialize variables for cart items and product count
        const cartItems = [];
        let uniqueProductCount = 0;

        if (cart) {
            // Count the number of unique products in the cart
            uniqueProductCount = cart.items.length;

            // Process cart items
            for (const item of cart.items) {
                const product = item.productId;
                let discountPercentage = 0;

                // Check for product-specific offer
                const productOffer = offers.find(o => o.offerType === 'product' && o.productId.includes(product._id));
                if (productOffer) {
                    discountPercentage = productOffer.discount;
                } else {
                    // Check for category offer
                    const categoryOffer = offers.find(o => o.offerType === 'category' && o.categoryId.includes(product.category));
                    if (categoryOffer) {
                        discountPercentage = categoryOffer.discount;
                    }
                }

                const originalPrice = product.price;
                const discountedPrice = originalPrice - (originalPrice * (discountPercentage / 100));

                cartItems.push({
                    product: product,
                    quantity: item.quantity,
                    originalPrice: originalPrice,
                    discountedPrice: discountedPrice,
                    discountPercentage: discountPercentage,
                    total: discountedPrice * item.quantity
                });
            }
        }

        // Calculate subtotal
        const subtotal = cartItems.reduce((sum, item) => sum + item.total, 0);
        const shippingCost = 0;
        const total = subtotal + shippingCost;

        res.render('checkout', { 
            cartItems: cartItems, 
            subtotal: subtotal, 
            total: total, 
            addresses: addresses,
            cartCount: uniqueProductCount
        });
    } catch (error) {
        console.log('Error details:', error.message);
        res.status(500).render('error', { message: 'Error loading checkout: ' + error.message });
    }
};



// Place order
const placeOrder = async (req, res) => {
    try {
        const { selectedAddress, cartItems, totalPrice, paymentMethod, coupon, couponDiscountAmt } = req.body;
        
        if (!selectedAddress || !cartItems || !totalPrice || !paymentMethod) {
            return res.status(400).json({ success: false, message: 'Missing required fields' });
        }

        const cart=await Cart.findOne({
            userId:req.session.user.id}).populate("items.productId")
            
            

        if (!req.session || !req.session.user || !req.session.user.id) {
            return res.status(401).json({ success: false, message: 'User not authenticated' });
        }

        const userId = req.session.user.id;

        const address = await Address.findById(selectedAddress);
        if (!address) {
            return res.status(404).json({ success: false, message: 'Address not found' });
        }

        const orderItems = cart.items.map(item => ({
            product: item.productId._id,
            quantity: item.quantity,
            price :item.productId.price
        }));
        function generateOrderId() {
            return Date.now(); 
        }

        const orderId = generateOrderId();

        const deliveryDate = new Date();
        deliveryDate.setDate(deliveryDate.getDate() + 3);

        // Create a new order
        const newOrder = new Order({
            userId: userId,
            address: {
                addressName: address.addressName,
                addressEmail: address.addressEmail,
                addressMobile: address.addressMobile,
                addressHouse: address.addressHouse,
                addressStreet: address.addressStreet,
                addressPost: address.addressPost,
                addressCity: address.addressCity,
                addressDistrict: address.addressDistrict,
                addressState: address.addressState,
                addressPin: address.addressPin
            },
            paymentMethod: paymentMethod,
            items: orderItems,
            totalPrice: totalPrice,
            orderId: orderId,
            deliveryDate: deliveryDate, 
            coupon: coupon || null, 
            couponDiscountAmt: couponDiscountAmt || 0 
        });

        await newOrder.save();

        for (const item of orderItems) {
            await Product.findByIdAndUpdate(
                item.product,
                { $inc: { stock: -item.quantity } }, 
                { new: true } 
            );
        }
        await Cart.findOneAndUpdate({ userId: userId }, { $set: { items: [] } }, { new: true });

        
        res.status(200).json({ success: true, message: 'Order placed successfully', order: newOrder, orderId: orderId });
    } catch (error) {
        console.error('Error placing order:', error);
        res.status(500).json({ success: false, message: 'Error placing order' });
    }
};


//Order summary
const loadOrderSummary = async (req, res) => {
    try {
        const userId = req.session.user.id; 
        const orderId = req.params.order_id;
        const offers = await Offer.find({ status: 'active' });

        if (!userId) {
            return res.status(400).send('<h1>400 - Bad Request</h1><p>User ID is missing in session.</p>');
        }
        const order = await Order.findOne({ orderId }).populate('items.product');

        if (!order) {
            return res.status(404).render('no-orders', { message: 'No orders found for this user.' });
        }

        // Calculate discounted prices
        const itemsWithDiscount = order.items.map(item => {
            const product = item.product;
            let discountPercentage = 0;

            // Check for product-specific offer
            const productOffer = offers.find(o => o.offerType === 'product' && o.productId.includes(product._id));
            if (productOffer) {
                discountPercentage = productOffer.discount;
            }

            // Check for category offer
            const categoryOffer = offers.find(o => o.offerType === 'category' && o.categoryId.includes(product.category));
            if (categoryOffer && categoryOffer.discount > discountPercentage) {
                discountPercentage = categoryOffer.discount;
            }

            const discountedPrice = product.price - (product.price * (discountPercentage / 100));

            return {
                ...item.toObject(),
                originalPrice: product.price,
                discountedPrice: discountedPrice,
                discountPercentage: discountPercentage
            };
        });

        res.render('order-summary', { order: { ...order.toObject(), items: itemsWithDiscount }, offers });
    } catch (error) {
        console.error('Error loading order summary:', error);
        res.status(500).send('Internal Server Error');
    }
};

//update order status
const updateOrderStatus = async (req, res) => {
    try {
        const { orderId, status, reason } = req.body;

        if (!mongoose.Types.ObjectId.isValid(orderId)) {
            return res.status(400).json({ message: 'Invalid Order ID.' });
        }

        const updateFields = { 'items.$[].order_status': status };
        if (status === 'Cancelled' && reason) {
            updateFields['items.$[].cancellationReason'] = reason;
        }

        const order = await Order.findByIdAndUpdate(
            orderId,
            { $set: updateFields },
            { new: true }
        );

        if (!order) {
            return res.status(404).json({ message: 'Order not found.' });
        }

        res.json({ message: 'Order status updated successfully.' });
    } catch (error) {
        console.error('Error updating order status:', error.message);
        res.status(500).json({ message: 'Error updating order status.' });
    }
};

    
//Get user order
const getUserOrder = async (req, res) => {
    try {
        const orderId = req.params.id;
        const order = await Order.findById(orderId)
            .populate('items.product') 
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



const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_SECRET
  });
  
  const createOrder = async (req, res) => {
    try {
      const options = {
        amount: req.body.amount * 100,
        currency: 'INR',
        receipt: 'order_' + Date.now()
      };
      const order = await razorpay.orders.create(options);
      res.json({
        orderId: order.id,
        amount: order.amount,
        currency: order.currency
      });
    } catch (error) {
      console.error('Error creating order:', error);
      res.status(500).json({ error: 'Failed to create order' });
    }
  };
  
  const verifyPayment = (req, res) => {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');
  
    if (expectedSignature === razorpay_signature) {
      res.json({ success: true, message: 'Payment verified successfully' });
    } else {
      res.status(400).json({ success: false, message: 'Invalid signature' });
    }
  };
  


  const submitReturnRequest = async (req, res) => {
    try {
        const { orderId, reason } = req.body;
        const userId = req.session.user.id;

        const order = await Order.findOne({ _id: orderId, userId: userId });

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        // Update only items that are in a state that can be returned
        const updatedItems = order.items.map(item => {
            if (['Delivered', 'Shipped'].includes(item.order_status)) {
                return {
                    ...item.toObject(),
                    order_status: 'Return Requested',
                    returnReason: reason
                };
            }
            return item;
        });

        order.items = updatedItems;

        await order.save();

        res.status(200).json({ message: 'Return request submitted successfully' });
    } catch (error) {
        console.error('Error submitting return request:', error);
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
};





  module.exports = {
    loadCheckout,
    placeOrder,
    loadOrderSummary,
    createOrder,
    verifyPayment,
    updateOrderStatus,
    getUserOrder,
    submitReturnRequest
   
   
}