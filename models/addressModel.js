const mongoose = require('mongoose');
const addressSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
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

})

module.exports = mongoose.model('Address', addressSchema);