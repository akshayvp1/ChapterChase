const mongoose = require("mongoose");
const { Schema } = mongoose;

const orderSchema = new Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    address: {
        addressName: {
            type: String,
            required: true
        },
        addressEmail: {
            type: String,
            required: true
        },
        addressMobile: {
            type: String,
            required: true
        },
        addressHouse: {
            type: String,
            required: true
        },
        addressStreet: {
            type: String,
            required: true
        },
        addressPost: {
            type: String,
            required: true
        },
        addressCity: {
            type: String,
            required: true
        },
        addressDistrict: {
            type: String,
            required: true
        },
        addressState: {
            type: String,
            required: true
        },
        addressPin: {
            type: Number,
            required: true
        }
    },
    paymentMethod: {
        type: String,
        required: true,
    },
    items: [
        {
            product: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Product",
                required: true,
            },
            quantity: {
                type: Number,
                required: true,
            },
            order_status: {
                type: String,
                enum: ["Pending", "Processing", "Shipped", "Delivered", "Cancelled", "Returned", "Return Requested"],
                default: "Pending",
              },
            price:{
                type:Number,
                required:true
            },
            cancelReason: {
                type: String,
                default: '', // Optional: Set a default value if required
            },
            returnReason:{
                type:String,
                default: '' // Optional: Set a default value if required

            }

        },
    ],
    createdAt: {
        type: Date,
        default: Date.now,
    },
    deliveryDate: {
        type: Date,
    },
    totalPrice: {
        type: Number,
        required: true,
    },
    payment_status: {
        type: String,
        enum: ["Pending", "Completed", "Failed"],
        default: "Pending",
    },
   
    coupon: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Coupon",
    },
    couponDiscountAmt: {
        type: Number,
        default: 0,
    },
    orderId: {
        type: String,
        unique: true,
        required: true,
    },
    
});

module.exports = mongoose.model("Order", orderSchema);
