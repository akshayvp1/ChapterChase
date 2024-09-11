const Order = require('../../models/orderModel');
const User = require("../../models/userModel");
const Product = require('../../models/productModel');
const Address = require('../../models/addressModel');
const Cart = require('../../models/cartModel');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const mongoose = require('mongoose');
const Offer = require('../../models/offerModel');
const Coupon = require('../../models/couponModel')
const Wallet = require('../../models/walletModel')
const Wishlist = require('../../models/wishlistModel');



//load checkout
const loadCheckout = async (req, res) => {
    try {
        const userId = req.session.user.id;

        const coupons = await Coupon.find({ isListed: true });
        const offers = await Offer.find({ status: 'active' });
        const addresses = await Address.find({ userId: userId });
        let cart = null;
        let cartCount = 0;
        cart = await Cart.findOne({ userId: userId }).populate('items.productId');

        if (cart && cart.items) {
            cartCount = cart.items.length;
        }
        let wishlist=null;
        let wishlistCount=0;

        
            wishlist=await Wishlist.findOne({userId: userId})
            if(wishlist && wishlist.products){
                wishlistCount=wishlist.products.length
                
           
        }

        if (!cart) {
            throw new Error('Cart not found for user.');
        }

        const cartItems = [];
        let uniqueProductCount = 0;
        let subtotal = 0;

        uniqueProductCount = cart.items.length;

        for (const item of cart.items) {
            const product = item.productId;

            if (!product) {
                throw new Error('Product not found in cart item.');
            }

            let bestDiscountPercentage = 0;
            const productOffers = offers.filter(o => 
                o.offerType === 'product' && o.productId.includes(product._id.toString())
            );
            
            if (productOffers.length > 0) {
                const bestProductOffer = productOffers.reduce((max, offer) => 
                    offer.discount > max.discount ? offer : max, productOffers[0]);
                
                bestDiscountPercentage = bestProductOffer.discount;
            }

            offers.forEach(offer => {
                if (offer.offerType === 'category' && offer.categoryId.includes(product.category.toString())) {
                    const currentDiscountPercentage = offer.discount;
                    if (currentDiscountPercentage > bestDiscountPercentage) {
                        bestDiscountPercentage = currentDiscountPercentage;
                    }
                }
            });

            const originalPrice = parseFloat(product.price);
            const discountedPrice = originalPrice - (originalPrice * (bestDiscountPercentage / 100));
            const total = discountedPrice * item.quantity;

            cartItems.push({
                product: product,
                quantity: item.quantity,
                originalPrice: originalPrice,
                discountedPrice: discountedPrice,
                discountPercentage: bestDiscountPercentage,
                total: total
            });
        }

        subtotal = cartItems.reduce((sum, item) => sum + item.total, 0);

        const shippingCost = 0;
        const total = subtotal + shippingCost;

        res.render('checkout', { 
            cartItems: cartItems, 
            subtotal: subtotal.toFixed(2),
            total: total.toFixed(2),
            discountAmount: 0, 
            addresses: addresses,
            cartCount: uniqueProductCount,
            offers: offers,
            coupons: coupons,
            cartCount,
            wishlistCount
        });
    } catch (error) {
        console.error('Error details:', error.message);
        res.status(500).render('error', { message: 'Error loading checkout: ' + error.message });
    }
};


//place order
const placeOrder = async (req, res) => {
    try {
        const { selectedAddress, cartItems, subtotal, totalPrice, paymentMethod, couponCode, couponDiscountAmt, paymentStatus } = req.body;

        if (!selectedAddress || !cartItems || !subtotal || !totalPrice || !paymentMethod) {
            return res.status(400).json({ success: false, message: 'Missing required fields' });
        }

        if (!req.session || !req.session.user || !req.session.user.id) {
            return res.status(401).json({ success: false, message: 'User not authenticated' });
        }


        const coupon = await Coupon.find({couponCode:couponCode})



        const userId = req.session.user.id;
        if(couponCode!=null){
                const user = await User.findById(userId)

        if(user.usedCoupons.length<2){


        user.usedCoupons.push(coupon[0]._id);
      }
        user.save()
    }

        


        const address = await Address.findById(selectedAddress);
        if (!address) {
            return res.status(404).json({ success: false, message: 'Address not found' });
        }

        let recalculatedSubtotal = 0;
        const orderItems = cartItems.map(item => {
            const itemTotal = item.price;
            recalculatedSubtotal += itemTotal;
            return {
                product: item.productId,
                quantity: item.quantity,
                price: itemTotal,
                couponDiscountAmt: 0,
                order_status: paymentStatus === 'Failed' ? 'Retry' : 'Pending'
            };
        });

        const confirmedDiscountAmt = Math.min(couponDiscountAmt, recalculatedSubtotal * 0.9);

        let totalDiscountDistributed = 0;
        orderItems.forEach(item => {
            const itemDiscountProportion = item.price / recalculatedSubtotal;
            item.couponDiscountAmt = parseFloat((confirmedDiscountAmt * itemDiscountProportion).toFixed(2));
            totalDiscountDistributed += item.couponDiscountAmt;
        });

        const discrepancy = confirmedDiscountAmt - totalDiscountDistributed;
        if (discrepancy !== 0) {
            orderItems[0].couponDiscountAmt += discrepancy;
        }

        const finalTotalPrice = recalculatedSubtotal 

        const orderId = Date.now().toString();
        const deliveryDate = new Date();
        deliveryDate.setDate(deliveryDate.getDate() + 3);

        const newOrder = new Order({
            userId,
            address: {
                addressName: address.addressName,
                addressEmail: address.addressEmail,
                addressMobile: address.addressMobile,
                addressHouse: address.addressHouse,
                addressStreet: address.addressStreet,
                addressPost: address.addressPost,
                addressCity: address.addressCity,
                addressState: address.addressState,
                addressPin: address.addressPin,
                addressDistrict: address.addressDistrict
            },
            paymentMethod,
            items: orderItems,
            subtotal: recalculatedSubtotal,
            couponCode,
            couponDiscountAmt: confirmedDiscountAmt,
            totalPrice: finalTotalPrice,
            orderId,
            deliveryDate,
            payment_status: paymentStatus === 'Failed' ? 'Pending' : (paymentMethod === 'Cash on Delivery' ? 'Pending' : 'Completed')
        });

       
        if (paymentMethod === 'Wallet') {
            const userWallet = await Wallet.findOne({ userId });
            if (!userWallet) {
                return res.status(404).json({ success: false, message: 'Wallet not found' });
            }

            if (userWallet.balance < finalTotalPrice) {
                return res.status(400).json({ success: false, message: 'Insufficient wallet balance' });
            }

            
            userWallet.balance -= finalTotalPrice;

          
            userWallet.transactions.push({
                transactionId: orderId,
                date: new Date(),
                description: `Order ${orderId} payment`,
                amount: finalTotalPrice,
                type: 'debit'
            });

            await userWallet.save();
        }

        await newOrder.save();

        for (const item of orderItems) {
            await Product.findByIdAndUpdate(
                item.product,
                { $inc: { stock: -item.quantity } },
                { new: true }
            );
        }

        await Cart.findOneAndUpdate({ userId }, { $set: { items: [] } });

        res.status(200).json({ success: true, message: 'Order placed successfully', order: newOrder, orderId });
    } catch (error) {
        console.error('Error placing order:', error);
        res.status(500).json({ success: false, message: 'Error placing order' });
    }
};





//apply coupon
const applyCoupon = async (req, res) => {
    try {
        const { couponCode } = req.body;
        const userId = req.session.user.id;

        if (!couponCode) {
            return res.status(400).json({ success: false, message: 'Coupon code is required' });
        }

        const user = await User.findById(userId);

        if (user.usedCoupons.length >= 2) {
            return res.status(400).json({ success: false, message: 'You have already used 2 coupons.' });
        }

        const [coupon, offers] = await Promise.all([
            Coupon.findOne({ couponCode, isListed: true }),
            Offer.find({ status: 'active' })
        ]);

        if (!coupon) {
            return res.status(404).json({ success: false, message: 'Invalid or inactive coupon code' });
        }

        const currentDate = new Date();
        if (currentDate > coupon.expiryDate) {
            return res.status(400).json({ success: false, message: 'Coupon code has expired' });
        }

        const cart = await Cart.findOne({ userId }).populate('items.productId');
        if (!cart) {
            return res.status(404).json({ success: false, message: 'Cart not found' });
        }

        const cartItems = cart.items.map(item => {
            const product = item.productId;
            const originalPrice = parseFloat(product.price);

            let bestDiscountPercentage = 0;
            const productOffers = offers.filter(o =>
                o.offerType === 'product' && o.productId.includes(product._id.toString())
            );

            if (productOffers.length > 0) {
                const bestProductOffer = productOffers.reduce((max, offer) =>
                    offer.discount > max.discount ? offer : max, productOffers[0]);

                bestDiscountPercentage = bestProductOffer.discount;
            }

            offers.forEach(offer => {
                if (offer.offerType === 'category' && offer.categoryId.includes(product.category.toString())) {
                    const currentDiscountPercentage = offer.discount;
                    if (currentDiscountPercentage > bestDiscountPercentage) {
                        bestDiscountPercentage = currentDiscountPercentage;
                    }
                }
            });

            const discountedPrice = originalPrice - (originalPrice * (bestDiscountPercentage / 100));
            return {
                product,
                quantity: item.quantity,
                originalPrice,
                discountedPrice,
                discountPercentage: bestDiscountPercentage,
                total: discountedPrice * item.quantity
            };
        });

        const subtotal = cartItems.reduce((sum, item) => sum + item.total, 0);

        if (subtotal < coupon.minAmount) {
            return res.status(400).json({ success: false, message: `Total amount must be at least $${coupon.minAmount.toFixed(2)} to use this coupon` });
        }

        const discountPercentage = parseFloat(coupon.redeemAmount);
        if (isNaN(discountPercentage)) {
            return res.status(500).json({ success: false, message: 'Invalid discount value' });
        }

        let discountAmount = 0;

        const discountedItems = cartItems.map(item => {
            const productPriceProportion = item.total / subtotal;
            const productDiscount = productPriceProportion * (discountPercentage / 100) * item.total;
            discountAmount += productDiscount;

            return {
                ...item,
                discountPercentage: (productPriceProportion * discountPercentage).toFixed(2),
                discountedTotal: item.total - productDiscount
            };
        });

        const newTotal = subtotal - discountAmount;

      
        
        await user.save();

        res.json({
            success: true,
            discountAmount: parseFloat(discountAmount.toFixed(2)),
            newTotal: parseFloat(newTotal.toFixed(2)),
            discountedItems
        });
    } catch (error) {
        console.error('Error applying coupon:', error.message);
        res.status(500).json({ success: false, message: 'Error applying coupon' });
    }
};


//load oredr summary
const loadOrderSummary = async (req, res) => {
    try {
        const userId = req.session.user.id; 
        const orderId = req.params.order_id;
        const offers = await Offer.find({ status: 'active' });

        if (!userId) {
            return res.status(400).send('<h1>400 - Bad Request</h1><p>User ID is missing in session.</p>');
        }
        const order = await Order.findOne({ orderId }).populate('items.product');
        const totalPrice = order.items.reduce((acc, item) => acc + item.price, 0);


        if (!order) {
            return res.status(404).render('no-orders', { message: 'No orders found for this user.' });
        }
  

        res.render('order-summary', { 
            order:order,
            totalPrice

        });
    } catch (error) {
        console.error('Error loading order summary:', error);
        res.status(500).send('Internal Server Error');
    }
};


//Update oreder status
const updateOrderStatus = async (req, res) => {
    try {
        const { orderId, itemId, status, reason } = req.body;


        if (!mongoose.Types.ObjectId.isValid(orderId) || !mongoose.Types.ObjectId.isValid(itemId)) {
            return res.status(400).json({ message: 'Invalid Order ID or Item ID.' });
        }

        const order = await Order.findById(orderId).populate('items.product');
        if (!order) {
            return res.status(404).json({ message: 'Order not found.' });
        }

        const itemIndex = order.items.findIndex(item => item._id.toString() === itemId);
        if (itemIndex === -1) {
            return res.status(404).json({ message: 'Item not found in order.' });
        }

        const updateFields = { [`items.${itemIndex}.order_status`]: status };
        if (status === 'Cancelled' && reason) {
            updateFields[`items.${itemIndex}.cancelReason`] = reason;
        }

        const updatedOrder = await Order.findByIdAndUpdate(
            orderId,
            { $set: updateFields },
            { new: true }
        );

        console.log('Order status updated:', updatedOrder);

        if (status === 'Cancelled') {
            const item = order.items[itemIndex];
            const updatedProduct = await Product.findByIdAndUpdate(
                item.product._id,
                { $inc: { stock: item.quantity } },
                { new: true }
            );
            console.log('Updated product stock:', updatedProduct);

            if (order.payment_status === 'Completed') {
                let wallet = await Wallet.findOne({ userId: order.userId });

                if (!wallet) {
                    wallet = new Wallet({
                        userId: order.userId,
                        balance: 0,
                        transactions: []
                    });
                }

                const refundAmount = item.price 

                wallet.balance += refundAmount;
                wallet.transactions.push({
                    transactionId: `Cancel-${orderId}-${itemId}`,
                    description: `Refund for canceled item ${order.orderId.slice(-5)}`,
                    amount: refundAmount,
                    type: 'credit'
                });

                await wallet.save(); 

            }
        }

        res.json({ message: 'Order item status updated successfully.' });
    } catch (error) {
        console.error('Error updating order item status:', error);
        res.status(500).json({ message: 'Error updating order item status.' });
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


//razorpay
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
  
  //verify payment
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
  

//submit return request
const submitReturnRequest = async (req, res) => {
    try {
        const { orderId, itemId, reason } = req.body;
        const userId = req.session.user.id;

        console.log('Received request:', { orderId, itemId, reason, userId }); 

        if (!mongoose.Types.ObjectId.isValid(orderId) || !mongoose.Types.ObjectId.isValid(itemId)) {
            console.log('Invalid ID:', { orderId, itemId }); 
            return res.status(400).json({ message: 'Invalid Order ID or Item ID.' });
        }

        const order = await Order.findOne({ _id: orderId, userId: userId });

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        const itemIndex = order.items.findIndex(item => item._id.toString() === itemId);
        if (itemIndex === -1) {
            return res.status(404).json({ message: 'Item not found in order.' });
        }

        if (!['Delivered', 'Shipped'].includes(order.items[itemIndex].order_status)) {
            return res.status(400).json({ message: 'This item is not eligible for return.' });
        }

        order.items[itemIndex].order_status = 'Return Requested';
        order.items[itemIndex].returnReason = reason;

        await order.save();

        res.status(200).json({ message: 'Return request submitted successfully for the item' });
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
    submitReturnRequest,
    applyCoupon
    
   
   
}