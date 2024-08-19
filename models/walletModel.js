const mongoose = require('mongoose');

const walletSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    balance: {
        type: Number,
        default: 0,
    },
    transactions: [
        {
            transactionId: { type: String },
            date: { type: Date, default: Date.now },
            description: String,
            amount: Number,
            type: {
                type: String,
                enum: ["credit", "debit"],
            },
        },
    ],
});

const Wallet = mongoose.model('Wallet', walletSchema);

module.exports = Wallet;
