
const Product = require('../models/productModel');
const Category = require('../models/categoryModel');
const path = require('path');
const fs = require('fs');
const User = require("../models/userModel");
const { promisify } = require('util');




//Load product list page
const loadProduct = async (req, res) => {
  try {
    let admin = req.session.user
    const products = await Product.find().populate('category');
    const categories = await Category.find();
    // const user = await User.find({is_admin:1})
    res.render('product-list', { products, categories,admin }); 
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
    //   res.status(500).send('Internal Server Error');
    }
  };

//Load Order list page
const loadOrderList = (req,res)=>{
    try{
        
        res.render('order-list')

    }
    catch(error){
        console.log(error.message);
    }
}

//Load Order list page
const loadOrderDetails = (req,res)=>{
    try{
      let admin = req.session.user

        res.render('order-details',{admin})
    }
    catch(error){
        console.log(error.message);

    }
}



//add product
const addProduct = async (req, res) => {
  try {
    const { productTitle, productDescription, productPrice, stock, category, isListed,productAuthor,productOffer } = req.body;

    // console.log(req.files)
    const images = req.files.map(file => file.filename);



    const newProduct = new Product({
      productName: productTitle,
      category: category,
      price: productPrice,
      offer : productOffer,
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
  
      // Update product details
      product.productName = productName;
      product.category = productCategory;
      product.stock = productStock;
      product.price = productPrice;
      product.status = productStatus;
      product.description = productDescription;
      product.author = productAuthor;
      product.offer = productOffer;
  
      // Handle image updates
      if (req.files && req.files.length > 0) {
        const newImages = req.files.map(file => file.filename);
        
        // Replace only the images that were uploaded
        for (let i = 0; i < newImages.length; i++) {
          if (product.images[i]) {
            // Remove old image file
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
  

  
  


module.exports = {
    loadProduct,
    loadAddProduct,
    loadOrderList,
    loadOrderDetails,
    addProduct,
    updateProduct,
    getProductList,
   

    
}