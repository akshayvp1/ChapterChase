
const Product = require('../../models/productModel');
const Category = require('../../models/categoryModel');
const path = require('path');
const fs = require('fs');
const User = require("../../models/userModel");
const { promisify } = require('util');
const Order = require('../../models/orderModel');
const Wallet = require('../../models/walletModel'); 


//Load product list page
const loadProduct = async (req, res) => {
  try {
    let admin = req.session.user;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const searchQuery = req.query.search || '';

    const filter = searchQuery ? { productName: new RegExp(searchQuery, 'i') } : {};
    const skip = (page - 1) * limit;

    const products = await Product.find(filter)
      .populate('category')
      .skip(skip)
      .limit(limit);

    const totalProduct = await Product.countDocuments(filter);

    const categories = await Category.find();

    res.render('product-list', {
      products,
      categories,
      admin,
      currentPage: page,
      totalPages: Math.ceil(totalProduct / limit),
      limit,
      startIndex: skip + 1,
      searchQuery 
    });
  } catch (error) {
    console.error('Error fetching products:', error.message);
    res.status(500).send('Server Error');
  }
};



//load add product
const loadAddProduct = async (req, res) => {
    try {
      let admin = req.session.user
      const categories = await Category.find({status:"Active"});
      
      res.render('product-add', { categories,admin });
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };



//add product
const addProduct = async (req, res) => {
  try {
    const { productTitle, productDescription, productPrice, stock, category, isListed,productAuthor,productOffer } = req.body;

    const images = req.files.map(file => file.filename);
    const newProduct = new Product({
      productName: productTitle,
      category: category,
      price: productPrice,
      status: isListed,
      stock: stock,
      description: productDescription,
      images: images,
      author: productAuthor

    });

    await newProduct.save();
    res.status(200).json({ success: true, message: 'Product added successfully!' });
  } catch (error) {
    console.error('Error adding product:', error);
    res.status(500).json({ success: false, message: 'Server Error. Please try again.' });
  }
};



//get product list
  const getProductList = async (req, res) => {
    try {
      const product = await Product.findById(req.params.id).populate('category');
      if (!product) return res.status(404).json({ error: 'Product not found' });
      res.json(product);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };


  
  const unlinkAsync = promisify(fs.unlink);
  const existsAsync = promisify(fs.exists);
  //update product
  const updateProduct = async (req, res) => {
    try {
      const { productName, productCategory, productStock, productPrice, productStatus, productDescription, productAuthor, productOffer } = req.body;
      const productId = req.params.id;
      const product = await Product.findById(productId);
  
      if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
  
     
      product.productName = productName;
      product.category = productCategory;
      product.stock = productStock;
      product.price = productPrice;
      product.status = productStatus;
      product.description = productDescription;
      product.author = productAuthor;
      
  
      if (req.files && req.files.length > 0) {
        const newImages = req.files.map(file => file.filename);
        
        for (let i = 0; i < newImages.length; i++) {
          if (product.images[i]) {

            const oldImagePath = path.join(__dirname, '../../assets/uploads', product.images[i]);          
            try {
              const fileExists = await existsAsync(oldImagePath);
              if (fileExists) {
                await unlinkAsync(oldImagePath);
              }
            } catch (err) {
              console.error('Error checking or deleting old image:', err);
            }
          }
          product.images[i] = newImages[i];
        }
      }
  
      await product.save();
      res.json({ success: true, message: 'Product updated successfully' });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  };
  


//confirm return
const confirmReturn = async (req, res) => {
  try {
      const { orderId, itemId } = req.body;

      const order = await Order.findById(orderId);
      if (!order) {
          return res.status(404).json({ message: 'Order not found' });
      }
      const item = order.items.id(itemId);
      if (!item) {
          return res.status(404).json({ message: 'Item not found in order' });
      }
      console.log('Item found:', item);

      if (item.order_status !== 'Return Requested') {
          return res.status(400).json({ message: 'Item is not in Return Requested status' });
      }

      item.order_status = 'Returned';
      await order.save();

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
          transactionId: `RETURN-${orderId}-${itemId}`,
          description: `Refund for returned item(s) from order ${order.orderId}`,
          amount: refundAmount,
          type: 'credit'
      });

      await wallet.save();

      res.status(200).json({ message: 'Return confirmed and refund processed successfully' });
  } catch (error) {
      console.error('Error in confirmReturn:', error);
      
      if (error.name === 'ValidationError') {
          return res.status(400).json({ message: 'Validation error', details: error.message });
      } else if (error.name === 'CastError') {
          return res.status(400).json({ message: 'Invalid ID format', details: error.message });
      } else {
          return res.status(500).json({ message: 'Internal server error', details: error.message });
      }
  }
};




module.exports = {
    loadProduct,
    loadAddProduct,
    addProduct,
    updateProduct,
    getProductList,
    confirmReturn
    


    
}