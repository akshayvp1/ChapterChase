const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  productName: { type: String, required: true },
  category: { type: mongoose.Schema.Types.ObjectId,
   ref: 'Category', required: true },
  price: { type: Number, required: true },
  status: { type: String, required: true },
  stock: { type: Number, required: true },
  description: { type: String, required: true },
  images: [{ type: String, required: true }]
});

const Product = mongoose.model('Product', productSchema);

module.exports = Product;
