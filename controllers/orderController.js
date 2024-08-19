const Order = require('../models/orderModel');
const User = require("../models/userModel");
const Product = require('../models/productModel');
const payment = require("../models/paymentModel");
const Address = require('../models/addressModel');
const Cart = require('../models/cartModel');



const loadCheckout = async(req,res)=>{

 

    try{

        const userId = req.session.user.id;

    
        const addresses = await Address.find({ userId: userId });
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

        res.render('checkout', { cartItems: cartItems, subtotal: subtotal, total: total,addresses:addresses });
    }
    catch(error){
        console.log(error.message);
        
    }
  }

//   const placeOrder = async (req, res) => {
//     try {
//         const { selectedAddress, cartItems, totalPrice, paymentMethod, coupon, couponDiscountAmt } = req.body;
//          console.log("cartitems",cartItems);

//         // Check if all required fields are present
//         if (!selectedAddress || !cartItems || !totalPrice || !paymentMethod) {
//             return res.status(400).json({ success: false, message: 'Missing required fields' });
//         }

//         if (!req.session || !req.session.user || !req.session.user.id) {
//             return res.status(401).json({ success: false, message: 'User not authenticated' });
//         }

//         const userId = req.session.user.id;

//         // Find address
//         const address = await Address.findById(selectedAddress);
//         if (!address) {
//             return res.status(404).json({ success: false, message: 'Address not found' });
//         }

//         // Prepare items for the order
//         const orderItems = cartItems.map(item => ({
//             product: item.productId,
//             quantity: item.quantity
//         }));

//         // Define the generateOrderId function inside placeOrder
//         function generateOrderId() {
//             // Generate a unique order ID (for example, a UUID or a timestamp-based ID)
//             return  Date.now(); // Simple example using a timestamp
//         }

//         // Generate a unique order ID
//         const orderId = generateOrderId();

//         // Calculate delivery date (3 days from now)
//         const deliveryDate = new Date();
//         deliveryDate.setDate(deliveryDate.getDate() + 3);

//         // Create a new order
//         const newOrder = new Order({
//             userId: userId,
//             address: {
//                 addressName: address.addressName,
//                 addressEmail: address.addressEmail,
//                 addressMobile: address.addressMobile,
//                 addressHouse: address.addressHouse,
//                 addressStreet: address.addressStreet,
//                 addressPost: address.addressPost,
//                 addressCity: address.addressCity,
//                 addressDistrict: address.addressDistrict,
//                 addressState: address.addressState,
//                 addressPin: address.addressPin
//             },
//             paymentMethod: paymentMethod,
//             items: orderItems,
//             totalPrice: totalPrice,
//             orderId: orderId,
//             deliveryDate: deliveryDate, // Set the delivery date to 3 days from now
//             coupon: coupon || null, // Handle optional field
//             couponDiscountAmt: couponDiscountAmt || 0 // Handle optional field
//         });
//         // Save the order
//         await newOrder.save();
//         const cart=await Cart.findOneAndUpdate({ userId: userId }, { $set: { items: [] } }, { new: true });
        

//         // Respond with success
//         res.status(200).json({ success: true, message: 'Order placed successfully', order: newOrder, orderId: orderId });
//     } catch (error) {
//         console.error('Error placing order:', error);
//         res.status(500).json({ success: false, message: 'Error placing order' });
//     }
// };

const placeOrder = async (req, res) => {
    try {
        const { selectedAddress, cartItems, totalPrice, paymentMethod, coupon, couponDiscountAmt } = req.body;
        console.log("cartitems", cartItems);

        // Check if all required fields are present
        if (!selectedAddress || !cartItems || !totalPrice || !paymentMethod) {
            return res.status(400).json({ success: false, message: 'Missing required fields' });
        }

        if (!req.session || !req.session.user || !req.session.user.id) {
            return res.status(401).json({ success: false, message: 'User not authenticated' });
        }

        const userId = req.session.user.id;

        // Find address
        const address = await Address.findById(selectedAddress);
        if (!address) {
            return res.status(404).json({ success: false, message: 'Address not found' });
        }

        // Prepare items for the order
        const orderItems = cartItems.map(item => ({
            product: item.productId,
            quantity: item.quantity
        }));

        // Define the generateOrderId function inside placeOrder
        function generateOrderId() {
            // Generate a unique order ID (for example, a UUID or a timestamp-based ID)
            return Date.now(); // Simple example using a timestamp
        }

        // Generate a unique order ID
        const orderId = generateOrderId();

        // Calculate delivery date (3 days from now)
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
            deliveryDate: deliveryDate, // Set the delivery date to 3 days from now
            coupon: coupon || null, // Handle optional field
            couponDiscountAmt: couponDiscountAmt || 0 // Handle optional field
        });

        // Save the order
        await newOrder.save();

        // Decrease the stock for each product
        for (const item of orderItems) {
            await Product.findByIdAndUpdate(
                item.product,
                { $inc: { stock: -item.quantity } }, // Decrease stock
                { new: true } // Option to return the updated document
            );
        }

        // Clear the cart
        await Cart.findOneAndUpdate({ userId: userId }, { $set: { items: [] } }, { new: true });

        // Respond with success
        res.status(200).json({ success: true, message: 'Order placed successfully', order: newOrder, orderId: orderId });
    } catch (error) {
        console.error('Error placing order:', error);
        res.status(500).json({ success: false, message: 'Error placing order' });
    }
};


const loadOrderSummary = async (req, res) => {
    try {
        const userId = req.session.user.id; // Fetch user ID from session
        const orderId = req.params.order_id;

        if (!userId) {
            return res.status(400).send('<h1>400 - Bad Request</h1><p>User ID is missing in session.</p>');
        }

        console.log('User ID:', userId); // Debugging line

        // Fetch the order for the given userId
        const order = await Order.findOne({ orderId }).populate(
            'items.product'
        );

        console.log('Order:', order); // Debugging line

        if (!order) {
            return res.status(404).render('no-orders', { message: 'No orders found for this user.' });
        }

        // Additional debugging to ensure all items are populated
        console.log('Order Items:', order.items);

        res.render('order-summary', { order });
    } catch (error) {
        console.error('Error loading order summary:', error);
        res.status(500).send('Internal Server Error');
    }
};







  module.exports = {
    loadCheckout,
    placeOrder,
    loadOrderSummary
   
   
}