
const Product = require('../models/productModel');
const Category = require('../models/categoryModel');
const path = require('path');
const fs = require('fs');
const User = require("../models/userModel");




//Load product list page
const loadProduct = async (req, res) => {
  try {
    let admin = req.session.user
    const products = await Product.find().populate('category');
    const categories = await Category.find();
    // const user = await User.find({is_admin:1})


     // Fetch categories if needed for product list

    res.render('product-list', { products, categories,admin }); // Pass categories to the view
  } catch (error) {
    console.error('Error fetching products:', error.message);
    res.status(500).send('Server Error');
  }
};

//Load Add product page
// const loadAddProduct = (req,res)=>{
//     try{
        
//         res.render('product-add',)
//     }
//     catch(error){
//         console.log(error.message)
//     }
// }
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

const addProduct = async (req, res) => {
   try {
    let admin = req.session.user
    const { productTitle, productDescription, productPrice, stock, category, isListed } = req.body;
    const images = req.files.map(file => file.path);

    const newProduct = new Product({
      productName: productTitle,
      category: category,
      price: productPrice,
      status: isListed,
      stock: stock,
      description: productDescription,
      images: images
    });
    
    await newProduct.save();
    res.redirect('/admin/add-product',{admin}); // Redirect after successful addition
  } catch (error) {
    console.error('Error adding product:', error);
    res.status(500).send('Server Error');
  }
  };
  const getProduct = async (req, res) => {
    try {
      const product = await Product.findById(req.params.id).populate('category');
      if (!product) return res.status(404).json({ error: 'Product not found' });
      res.json(product);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };

  // const updateProduct = async (req, res) => {
  //   try {
  //     const { productName, productCategory, productStock, productPrice, productStatus } = req.body;
  //     const productId = req.params.id;
  //     const product = await Product.findById(productId);
  
  //     if (!product) return res.status(404).json({ error: 'Product not found' });
  
  //     // Update product details
  //     product.productName = productName;
  //     product.category = productCategory;
  //     product.stock = productStock;
  //     product.price = productPrice;
  //     product.status = productStatus;
  
  //     // Handle image replacement
  //     if (req.files) {
  //       ['productImage1', 'productImage2', 'productImage3'].forEach((field, index) => {
  //         if (req.files[field]) {
  //           // Delete old image if exists
  //           if (product.images[index]) {
  //             fs.unlink(path.join(__dirname, '..', product.images[index]), err => {
  //               if (err) console.log(err);
  //             });
  //           }
  //           // Save new image path
  //           product.images[index] = req.files[field][0].path;
  //         }
  //       });
  //     }
  
  //     await product.save();
  //     res.json({ success: true });
  //   } catch (error) {
  //     res.status(500).json({ error: error.message });
  //   }
  // };
  


  const updateProduct = async (req, res) => {
    try {
      const { productName, productCategory, productStock, productPrice, productStatus, productDescription } = req.body;
      const productId = req.params.id;
      const product = await Product.findById(productId);
  
      if (!product) return res.status(404).json({ error: 'Product not found' });
  
      // Update product details
      product.productName = productName;
      product.category = productCategory;
      product.stock = productStock;
      product.price = productPrice;
      product.status = productStatus;
      product.description = productDescription;
  
      // Handle image replacement
      ['productImage1', 'productImage2', 'productImage3'].forEach((field, index) => {
        if (req.files[field]) {
          // Delete old image if exists
          if (product.images[index]) {
            fs.unlink(path.join(__dirname, '..', product.images[index]), err => {
              if (err) console.log(err);
            });
          }
          // Save new image path
          product.images[index] = req.files[field][0].path;
        }
      });
  
      await product.save();
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };
  
  
  


module.exports = {
    loadProduct,
    loadAddProduct,
    loadOrderList,
    loadOrderDetails,
    addProduct,
    updateProduct,
    getProduct,
   

    
}