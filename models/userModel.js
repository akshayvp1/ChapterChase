

const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    mobile: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    is_admin: {
        type: Boolean,
        required: true,
        default: false
    },
    is_verified: {
        type: Boolean,
        default: false
    },
    verificationOTP: {
        type: String,
    },
    otpExpiration: {
        type: Date,
    },
    googleId: {
        type: String
    },
    displayName: {
        type: String
    },
    isListed:{
        type:Boolean
    }
});

module.exports = mongoose.model('User', userSchema);
