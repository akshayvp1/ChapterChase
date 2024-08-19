const User = require('../../models/userModel');
const Product = require('../../models/productModel');
const Category = require('../../models/categoryModel');
require('dotenv').config();
const Offer = require('../../models/offerModel');




//load product list
const loadProductsList = async (req, res) => {
  try {
      const user = req.user || req.session.user;
      const categories = await Category.find({ status: 'Active' });
      const page = parseInt(req.query.page, 10) || 1;
      const limit = parseInt(req.query.limit, 9) || 9;
      const skip = (page - 1) * limit;

      // Fetch all offers
      const offers = await Offer.find({ status: 'active' });

      // Get selected categories and sort option from query parameters
      const selectedCategories = req.query.categories || [];
      const sortOption = req.query.sort || '';

      // Determine the sorting criteria
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
              sortCriteria = {}; // Default sorting (if any)
      }

      // Fetch paginated and sorted products with category filter
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

      // Render the product list view with pagination and sorting data
      res.render('products-list', {
          categories,
          user,
          products,
          offers, // Pass offers for processing in the EJS template
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


  

  
//load product details
// const loadProductDetails = async (req, res) => {
//     try {
//         // const product = await Product.find({ status: 'Active' });
//         const offers = await Offer.find({ status: 'active' });

//         const productId = req.params.id; 
//         const product = await Product.findById(productId).exec(); 
//         const user = req.user || req.session.user;

//         if (!product) {
//              res.status(404).send('Product not found');
//         }

//         const relatedProducts = await Product.find({
//             _id: { $ne: productId },
//             category: product.category,
//             status: 'Active'
//         }).limit(4).exec();

//          res.render('product-details', {
//             user,
//             product,
//             relatedProducts,
//             offers,
//             breadcrumbs: [
//                 { title: 'Home', url: '/' },
//                 { title: 'Products', url: '/products-list' },
//                 { title: 'Products-Details', url: '#' }
//             ]
//         });
//     } catch (error) {
//         console.error(error); 
//          res.status(500).send('Server Error'); 
//     }
// };


const loadProductDetails = async (req, res) => {
    try {
        const productId = req.params.id; 
        const product = await Product.findById(productId).exec();
        const offers = await Offer.find({ status: 'active' });
        const user = req.user || req.session.user;

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
            product,
            relatedProducts,
            offers,
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




module.exports = {
    loadProductsList,
    loadProductDetails

}