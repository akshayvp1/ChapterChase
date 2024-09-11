const User = require('../../models/userModel');
const Product = require('../../models/productModel');
const Category = require('../../models/categoryModel');
require('dotenv').config();
const Offer = require('../../models/offerModel');
const Cart = require('../../models/cartModel');
const Wishlist = require('../../models/wishlistModel');




//load product list
const loadProductsList = async (req, res) => {
  try {
      const user = req.user || req.session.user;
      const categories = await Category.find({ status: 'Active' });
      const page = parseInt(req.query.page, 10) || 1;
      const limit = parseInt(req.query.limit, 9) || 9;
      const skip = (page - 1) * limit;

      
      let cart = null;
      let cartCount = 0;

      if (user && user.id) {
          cart = await Cart.findOne({ userId: user.id });
          if (cart && cart.items) {
              cartCount = cart.items.length;
          }
      }
      let wishlist=null;
      let wishlistCount=0;

      if(user&& user.id){
          wishlist=await Wishlist.findOne({userId: user.id})
          if(wishlist && wishlist.products){
              wishlistCount=wishlist.products.length
              
          }
      }

      const offers = await Offer.find({ status: 'active' });

      const selectedCategories = req.query.categories || [];
      const sortOption = req.query.sort || '';

      let sortCriteria = {};
      switch (sortOption) {
          case 'priceLowToHigh':
              sortCriteria = { price: 1 };
              break;
          case 'priceHighToLow':
              sortCriteria = { price: -1 };
              break;
          case 'aToZ':
              sortCriteria = { productName: 1 };
              break;
          case 'zToA':
              sortCriteria = { productName: -1 };
              break;
          default:
              sortCriteria = {}; 
      }

      const products = await Product.find({
          status: 'Active',
          ...(selectedCategories.length > 0 ? { category: { $in: selectedCategories } } : {})
      })
      .sort(sortCriteria)
      .skip(skip)
      .limit(limit);

      const totalProducts = await Product.countDocuments({
          status: 'Active',
          ...(selectedCategories.length > 0 ? { category: { $in: selectedCategories } } : {})
      });
      const totalPages = Math.ceil(totalProducts / limit);

      res.render('products-list', {
          categories,
          user,
          cartCount,
          wishlistCount,
          products,
          offers, 
          currentPage: page,
          totalPages,
          limit,
          totalProducts,
          selectedCategories,
          sortOption,
          breadcrumbs: [
              { title: 'Home', url: '/' },
              { title: 'Products', url: '#' }
          ]
      });
  } catch (error) {
      console.log(error.message);
      res.status(500).send('Error fetching products');
  }
};


//product details
const loadProductDetails = async (req, res) => {
    try {
        const productId = req.params.id; 
        const product = await Product.findById(productId).exec();
        const offers = await Offer.find({ status: 'active' });
        const user = req.user || req.session.user;

        let cart = null;
        let cartCount = 0;
  
        if (user && user.id) {
            cart = await Cart.findOne({ userId: user.id });
            if (cart && cart.items) {
                cartCount = cart.items.length;
            }
        }
        let wishlist = null;
        let wishlistCount = 0;

        if (user && user.id) {
            wishlist = await Wishlist.findOne({ userId: user.id });
            if (wishlist && wishlist.products) {
                wishlistCount = wishlist.products.length;
            }
        }

        if (!product) {
            return res.status(404).send('Product not found');
        }

        const relatedProducts = await Product.find({
            _id: { $ne: productId },
            category: product.category,
            status: 'Active'
        }).limit(4).exec();

        
        res.render('product-details', {
            user,
            cartCount,
            product,
            relatedProducts,
            offers,
            wishlistCount,
            stock: product.stock, 
            breadcrumbs: [
                { title: 'Home', url: '/' },
                { title: 'Products', url: '/products-list' },
                { title: 'Product Details', url: '#' }
            ]
        });
    } catch (error) {
        console.error(error); 
        res.status(500).send('Server Error'); 
    }
};


//search product
const searchProduct = async (req, res) => {
  try {
    const query = req.query.q.toLowerCase();
    console.log('Search query:', query);
    
    const products = await Product.find({
      $or: [
        { productName: { $regex: query, $options: "i" } },
        { description: { $regex: query, $options: "i" } }
      ]
    }).limit(10);

    console.log('Found products:', JSON.stringify(products, null, 2));
    console.log('Total products found:', products.length);

    const results = products.map((product) => ({
      id: product._id,
      productName: product.productName,
      description: product.description,
      price: product.price,
      image: `/assets/uploads/${product.images[0]}`,
    }));

    console.log('Formatted results:', JSON.stringify(results, null, 2));

    res.json(results);
  } catch (error) {
    console.error("Error in product search:", error);
    res.status(500).json({ error: "An error occurred while searching for products" });
  }
}
  
  
  
  
  
  



module.exports = {
    loadProductsList,
    loadProductDetails,
    searchProduct

}