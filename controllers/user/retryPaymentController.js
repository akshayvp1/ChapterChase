const crypto = require('crypto');
const Razorpay = require('razorpay');
const Order = require('../../models/orderModel');


//razorpay
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_SECRET
});

//retry payment
const retryOrder = async (req, res) => {
    try {
        const { orderId, amount } = req.body;
        console.log('Retry Order Request:', { orderId, amount });

        const receipt = `retry_${orderId}_${Date.now()}`.slice(0, 40);

        const options = {
            amount: amount * 100, 
            currency: 'INR',
            receipt: receipt,
            payment_capture: 1
        };

        const order = await razorpay.orders.create(options);

        console.log('Razorpay Order Created:', order);

        res.json({
            success: true,
            orderId: order.id,
            amount: order.amount,
            currency: order.currency
        });
    } catch (error) {
        console.error('Error creating Razorpay retry order:', error);
        res.status(500).json({ success: false, message: 'Failed to create retry order' });
    }
};

const razorpayRetryPayment = async (req, res) => {
    try {
        const { orderId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
        console.log('Razorpay Retry Payment Request:', { orderId, razorpay_order_id, razorpay_payment_id, razorpay_signature });

        
        const body = `${razorpay_order_id}|${razorpay_payment_id}`;
        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_SECRET)
            .update(body)
            .digest('hex');


        if (expectedSignature !== razorpay_signature) {
            console.error('Invalid Signature:', { expectedSignature, razorpay_signature });
            return res.status(400).json({ success: false, message: 'Invalid signature' });
        }

                const updatedOrder = await Order.findOneAndUpdate(
            { orderId: orderId },
            { 
                $set: { 
                    payment_status: 'Completed',
                    'items.$[].order_status': 'Pending'
                }
            },
            { new: true }
        );


        if (!updatedOrder) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        res.json({ success: true, message: 'Payment verified successfully' });
    } catch (error) {
        console.error('Error verifying Razorpay retry payment:', error);
        res.status(500).json({ success: false, message: 'Failed to verify payment' });
    }
};




module.exports = { retryOrder, razorpayRetryPayment };

