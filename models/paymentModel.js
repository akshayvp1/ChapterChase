const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema({
  payType:{
    type:String,
    required:true
  }
});

module.exports = mongoose.model('Payment',paymentSchema)